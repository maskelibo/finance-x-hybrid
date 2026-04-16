"""KAP (Kamuyu Aydınlatma Platformu) disclosure fetcher.

Two layers:
  - KapClient  (abstract) : fetches raw disclosure dicts.
  - HttpKapClient         : real httpx implementation, used in production.
  - MockKapClient         : in-memory, used in tests and anywhere offline.

The real endpoint/HTML layout varies and KAP does not publish a stable
documented API. HttpKapClient keeps the base URL configurable so we can
point it at the correct endpoint once verified, without touching the
rest of the pipeline.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Any

import httpx

DEFAULT_KAP_BASE_URL = "https://www.kap.org.tr"
DEFAULT_DISCLOSURE_LIST_PATH = "/tr/api/disclosure"
DEFAULT_TIMEOUT_S = 30.0


@dataclass(frozen=True)
class RawDisclosure:
    """Raw disclosure record as returned by a KAP source.

    Fields are deliberately optional — parsers will graciously handle
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
    """Real KAP client over HTTPS.

    The exact endpoint/query shape is fragile — KAP's public API is not
    officially documented. The plumbing is in place; we point at the
    correct path in a follow-up once verified against a live ticker.
    """

    def __init__(
        self,
        *,
        base_url: str = DEFAULT_KAP_BASE_URL,
        disclosure_list_path: str = DEFAULT_DISCLOSURE_LIST_PATH,
        timeout_s: float = DEFAULT_TIMEOUT_S,
        http_client: httpx.Client | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.disclosure_list_path = disclosure_list_path
        self.timeout_s = timeout_s
        self._owns_client = http_client is None
        self._client = http_client or httpx.Client(
            base_url=self.base_url,
            timeout=timeout_s,
            headers={"User-Agent": "FinanceX/0.1 (KapWatch)"},
        )

    def fetch_disclosures(
        self,
        ticker: str,
        *,
        since: date,
        until: date | None = None,
    ) -> list[RawDisclosure]:
        params = {
            "ticker": ticker,
            "from": since.isoformat(),
            "to": (until or date.today()).isoformat(),
        }
        resp = self._client.get(self.disclosure_list_path, params=params)
        resp.raise_for_status()
        payload = resp.json()
        return [_raw_from_kap_payload(item) for item in payload]

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
            if d.ticker == ticker
            and since <= d.announced_at.date() <= ceiling
        ]


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------

def _raw_from_kap_payload(item: dict[str, Any]) -> RawDisclosure:
    """Project a KAP JSON record into our RawDisclosure shape.

    KAP fields vary across endpoints; we accept the common superset and
    fall through to None when a field is absent.
    """
    announced = item.get("publishDate") or item.get("announcedAt") or item.get("date")
    announced_dt: datetime
    if isinstance(announced, datetime):
        announced_dt = announced
    elif isinstance(announced, str):
        announced_dt = datetime.fromisoformat(announced.replace("Z", "+00:00"))
    else:
        announced_dt = datetime.now(timezone.utc)

    return RawDisclosure(
        disclosure_id=str(item.get("disclosureIndex") or item.get("id") or item.get("disclosureId") or ""),
        ticker=str(item.get("ticker") or item.get("stockCode") or "").upper(),
        announced_at=announced_dt,
        title=str(item.get("title") or item.get("subject") or ""),
        url=str(item.get("url") or item.get("link") or ""),
        category=item.get("disclosureClass") or item.get("category"),
        subcategory=item.get("disclosureType") or item.get("subcategory"),
        summary=item.get("summary"),
        full_text=item.get("content") or item.get("body"),
        raw=item,
    )
