"""TCMB (Türkiye Cumhuriyet Merkez Bankası) FX + series client.

Two endpoints, both reachable without an API key as of April 2026:

  GET https://www.tcmb.gov.tr/kurlar/today.xml            → today's FX rates
  GET https://www.tcmb.gov.tr/kurlar/YYYYMM/DDMMYYYY.xml → historical FX

The EVDS API (policy rate, CPI, etc.) requires a user-scoped key, so we
expose a hook for that but fall back to explicit user-provided values
when the key is absent.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
import xml.etree.ElementTree as ET

import httpx


TCMB_TODAY_URL = "https://www.tcmb.gov.tr/kurlar/today.xml"


def _tcmb_archive_url(d: date) -> str:
    return f"https://www.tcmb.gov.tr/kurlar/{d.year:04d}{d.month:02d}/{d.day:02d}{d.month:02d}{d.year:04d}.xml"


@dataclass(frozen=True)
class FxRates:
    """TCMB publishes a bulletin with ~25 currencies. We carry the big three."""

    usd_try: Decimal | None = None
    eur_try: Decimal | None = None
    gbp_try: Decimal | None = None
    as_of: date | None = None


class TcmbClient(ABC):
    @abstractmethod
    def fetch_fx(self, as_of: date | None = None) -> FxRates: ...


class HttpTcmbClient(TcmbClient):
    def __init__(self, *, timeout_s: float = 15.0, http_client: httpx.Client | None = None) -> None:
        self._owns_client = http_client is None
        self._client = http_client or httpx.Client(
            timeout=timeout_s,
            headers={"User-Agent": "FinanceX/0.1 (MacroAnalysis)"},
        )

    def fetch_fx(self, as_of: date | None = None) -> FxRates:
        url = TCMB_TODAY_URL if as_of is None else _tcmb_archive_url(as_of)
        resp = self._client.get(url)
        resp.raise_for_status()
        root = ET.fromstring(resp.text)
        bulletin_date_raw = root.attrib.get("Date") or ""
        try:
            mm, dd, yyyy = bulletin_date_raw.split("/")
            bulletin_date = date(int(yyyy), int(mm), int(dd))
        except ValueError:
            bulletin_date = as_of

        rates: dict[str, Decimal] = {}
        for cur in root.findall("Currency"):
            code = cur.attrib.get("Kod") or cur.attrib.get("CurrencyCode")
            if not code:
                continue
            buying_txt = (cur.findtext("ForexSelling") or cur.findtext("ForexBuying") or "").strip()
            if not buying_txt:
                continue
            try:
                rates[code.upper()] = Decimal(buying_txt)
            except Exception:
                continue

        return FxRates(
            usd_try=rates.get("USD"),
            eur_try=rates.get("EUR"),
            gbp_try=rates.get("GBP"),
            as_of=bulletin_date,
        )

    def close(self) -> None:
        if self._owns_client:
            self._client.close()


class StaticTcmbClient(TcmbClient):
    """In-memory stub for tests / offline mode."""

    def __init__(self, fixture: FxRates) -> None:
        self.fixture = fixture

    def fetch_fx(self, as_of: date | None = None) -> FxRates:
        return self.fixture
