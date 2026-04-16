"""KAP (Kamuyu Aydınlatma Platformu) disclosure fetcher — live against the
current KAP API surface (discovered via browser network inspection).

Endpoints actually used by kap.org.tr (April 2026):
  POST /tr/api/search/combined              → ticker → memberOid (UUID)
  POST /tr/api/disclosure/members/byCriteria → filtered disclosure list
  GET  /tr/api/BildirimPdf/{disclosureIndex} → the disclosure PDF

Legacy endpoints like `/tr/api/disclosures` and `/api/memberDisclosures`
are dead; don't reach for them.

Resilience: KAP occasionally returns 5xx / 429 — specifically we have
seen `500 Internal Server Error` on byCriteria when two requests land
close together from the same IP. All outbound HTTP calls go through
`_retry` with exponential backoff (3 tries, 2s → 4s → 8s) for
transient server errors and rate limits.
"""

from __future__ import annotations

import time
from abc import ABC, abstractmethod
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Any

import httpx

DEFAULT_KAP_BASE_URL = "https://www.kap.org.tr"
SEARCH_PATH = "/tr/api/search/combined"
CRITERIA_PATH = "/tr/api/disclosure/members/byCriteria"
PDF_PATH_TEMPLATE = "/tr/api/BildirimPdf/{index}"
DEFAULT_TIMEOUT_S = 30.0

# Transient status codes we retry on. 500/502/503/504 are server-side
# transients; 429 is rate-limit. Anything else (401, 403, 404) is a
# real error — don't waste attempts.
_RETRYABLE_STATUS = frozenset({429, 500, 502, 503, 504})
_RETRY_ATTEMPTS = 3
_RETRY_BACKOFF_BASE_S = 2.0  # 2s, 4s, 8s


def _retry(fn: Callable[[], httpx.Response], *, op_name: str = "KAP request") -> httpx.Response:
    """Call `fn()` with exponential backoff on retryable HTTP errors.

    Re-raises the last exception (or HTTPStatusError) if every attempt
    fails — caller decides whether to treat that as a hard failure.
    """
    last_exc: Exception | None = None
    for attempt in range(1, _RETRY_ATTEMPTS + 1):
        try:
            resp = fn()
        except (httpx.ConnectError, httpx.ReadTimeout, httpx.RemoteProtocolError) as exc:
            last_exc = exc
            if attempt >= _RETRY_ATTEMPTS:
                break
            wait = _RETRY_BACKOFF_BASE_S * (2 ** (attempt - 1))
            print(f"[KAP retry] {op_name}: {type(exc).__name__} — sleeping {wait:.0f}s (attempt {attempt}/{_RETRY_ATTEMPTS})")
            time.sleep(wait)
            continue

        if resp.status_code in _RETRYABLE_STATUS and attempt < _RETRY_ATTEMPTS:
            wait = _RETRY_BACKOFF_BASE_S * (2 ** (attempt - 1))
            print(f"[KAP retry] {op_name}: HTTP {resp.status_code} — sleeping {wait:.0f}s (attempt {attempt}/{_RETRY_ATTEMPTS})")
            time.sleep(wait)
            continue

        return resp

    if last_exc is not None:
        raise last_exc
    # fn() returned but exhausted retries — surface the final response
    # so the caller can raise_for_status() with accurate context.
    return fn()


@dataclass(frozen=True)
class RawDisclosure:
    """Raw disclosure record as returned by KAP.

    Fields are deliberately optional — parsers will gracefully handle
    whatever KAP gives and surface gaps through QualityControl.
    """

    disclosure_id: str
    ticker: str
    announced_at: datetime
    title: str
    url: str
    category: str | None = None
    subcategory: str | None = None
    summary: str | None = None
    full_text: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)


class KapClient(ABC):
    """Interface: fetch raw disclosures for a ticker within a window."""

    @abstractmethod
    def fetch_disclosures(
        self,
        ticker: str,
        *,
        since: date,
        until: date | None = None,
    ) -> list[RawDisclosure]:
        ...


class HttpKapClient(KapClient):
    """Live KAP client.

    Two-step request: resolve ticker → memberOid (UUID) via /search/combined,
    then POST that OID into /disclosure/members/byCriteria along with the
    date window.
    """

    # KAP's private API rejects "bare" clients with 500 — browsers pass a
    # full header set (Referer + Origin + realistic UA + Sec-Fetch-*).
    # Replicating the Chrome desktop fingerprint we observed in DevTools
    # on kap.org.tr; this was the fix that made the live pipeline stop
    # tripping KAP's anti-scrape gate.
    _HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/129.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
        "Origin": "https://www.kap.org.tr",
        "Referer": "https://www.kap.org.tr/",
        "Sec-Ch-Ua": '"Chromium";v="129", "Not=A?Brand";v="8", "Google Chrome";v="129"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
    }

    def __init__(
        self,
        *,
        base_url: str = DEFAULT_KAP_BASE_URL,
        timeout_s: float = DEFAULT_TIMEOUT_S,
        http_client: httpx.Client | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self._owns_client = http_client is None
        self._client = http_client or httpx.Client(
            base_url=self.base_url,
            timeout=timeout_s,
            headers=self._HEADERS,
        )
        # Simple per-instance cache; ticker → memberOid lookups are stable.
        self._member_oid_cache: dict[str, str] = {}

    def resolve_member_oid(self, ticker: str) -> str | None:
        """Return KAP's internal UUID for a ticker, or None if unknown."""
        upper = ticker.upper()
        if upper in self._member_oid_cache:
            return self._member_oid_cache[upper]

        resp = _retry(
            lambda: self._client.post(
                SEARCH_PATH,
                json={"keyword": upper, "discClass": "ALL", "lang": "tr", "channel": "WEB"},
            ),
            op_name=f"resolve_member_oid({upper})",
        )
        resp.raise_for_status()
        payload = resp.json()
        for category in payload:
            if category.get("category") == "companyOrFunds":
                for item in category.get("results", []):
                    if str(item.get("cmpOrFundCode", "")).upper() == upper:
                        oid = item.get("memberOrFundOid")
                        if oid:
                            self._member_oid_cache[upper] = oid
                            return oid
        return None

    def fetch_disclosures(
        self,
        ticker: str,
        *,
        since: date,
        until: date | None = None,
    ) -> list[RawDisclosure]:
        ceiling = until or date.today()
        member_oid = self.resolve_member_oid(ticker)
        if member_oid is None:
            raise ValueError(f"KAP: unknown ticker {ticker!r} (search/combined returned no match)")

        body = {
            "fromDate": since.isoformat(),
            "toDate": ceiling.isoformat(),
            "memberType": "IGS",
            "mkkMemberOidList": [member_oid],
            "inactiveMkkMemberOidList": [],
            "disclosureClass": "",
            "subjectList": [],
            "isLate": "",
            "mainSector": "",
            "sector": "",
            "subSector": "",
            "marketOid": "",
            "index": "",
            "bdkReview": "",
            "bdkMemberOidList": [],
            "year": "",
            "term": "",
        }
        resp = _retry(
            lambda: self._client.post(CRITERIA_PATH, json=body),
            op_name=f"fetch_disclosures({ticker})",
        )
        resp.raise_for_status()
        rows = resp.json()
        return [_row_to_raw(r, fallback_ticker=ticker.upper(), base_url=self.base_url) for r in rows]

    def download_pdf(self, disclosure_index: int | str) -> bytes:
        """Download the disclosure PDF. Returns raw bytes."""
        path = PDF_PATH_TEMPLATE.format(index=disclosure_index)
        resp = _retry(
            lambda: self._client.get(path),
            op_name=f"download_pdf({disclosure_index})",
        )
        resp.raise_for_status()
        return resp.content

    def close(self) -> None:
        if self._owns_client:
            self._client.close()


class MockKapClient(KapClient):
    """In-memory KAP client for tests and offline runs."""

    def __init__(self, fixtures: list[RawDisclosure]) -> None:
        self.fixtures = fixtures

    def fetch_disclosures(
        self,
        ticker: str,
        *,
        since: date,
        until: date | None = None,
    ) -> list[RawDisclosure]:
        ceiling = until or date.today()
        return [
            d
            for d in self.fixtures
            if d.ticker == ticker.upper()
            and since <= d.announced_at.date() <= ceiling
        ]


# ---------------------------------------------------------------------
# Row → RawDisclosure projection
# ---------------------------------------------------------------------

_TR_DATETIME_FMTS = (
    "%d.%m.%Y %H:%M:%S",
    "%d.%m.%Y %H:%M",
    "%d.%m.%Y",
)


def _parse_kap_datetime(raw: str) -> datetime:
    """Parse KAP's Turkish-format timestamps. Falls back to UTC now on error."""
    if not raw:
        return datetime.now(timezone.utc)
    for fmt in _TR_DATETIME_FMTS:
        try:
            naive = datetime.strptime(raw, fmt)
            # KAP timestamps are Turkey local time; we store them naive-as-UTC
            # to keep things simple — consumers compare dates, not tz.
            return naive.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return datetime.now(timezone.utc)


def _row_to_raw(row: dict[str, Any], *, fallback_ticker: str, base_url: str) -> RawDisclosure:
    """Map the flat dict returned by byCriteria into RawDisclosure."""
    idx = row.get("disclosureIndex")
    ticker = (row.get("stockCodes") or fallback_ticker or "").split(",")[0].upper().strip()
    return RawDisclosure(
        disclosure_id=str(idx) if idx is not None else "",
        ticker=ticker,
        announced_at=_parse_kap_datetime(row.get("publishDate") or ""),
        title=row.get("subject") or row.get("kapTitle") or "",
        url=f"{base_url}/tr/Bildirim/{idx}" if idx is not None else "",
        category=row.get("disclosureCategory"),
        subcategory=row.get("disclosureClass"),
        summary=row.get("summary"),
        full_text=None,
        raw=row,
    )
