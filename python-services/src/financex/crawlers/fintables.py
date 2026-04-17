"""Fintables mirror — fallback PDF source for historical KAP disclosures.

Fintables (storage.fintables.com) hosts cached copies of KAP financial
reports.  URL patterns discovered empirically:

  storage.fintables.com/media/uploads/kap-attachments/
    {CompanyName}-Entegre-Faaliyet-Raporu-{YYYY}.pdf
    {CompanyName}-Faaliyet-Raporu-{YYYY}.pdf
    {CompanyName}-Finansal-Rapor-{YYYY}.pdf

Used as a fallback when KAP doesn't return old-year PDFs (pre-2024).
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

import httpx

_BASE = "https://storage.fintables.com/media/uploads/kap-attachments"
_TIMEOUT_S = 30.0
_RETRY_ATTEMPTS = 3
_RETRY_BACKOFF_S = 2.0

# Mapping: BIST ticker → company slug used in Fintables URLs.
# Populated for frequently-analysed tickers; extend as needed.
TICKER_SLUG: dict[str, str] = {
    "THYAO": "Turk-Hava-Yollari",
    "EREGL": "Eregli-Demir-Celik",
    "ASELS": "Aselsan",
    "TCELL": "Turkcell",
    "TUPRS": "Tupras",
    "BIMAS": "Bim-Birlesik-Magazalar",
    "KCHOL": "Koc-Holding",
    "SAHOL": "Sabanci-Holding",
    "SISE": "Turkiye-Sise-ve-Cam",
    "TOASO": "Tofas",
    "AKBNK": "Akbank",
    "GARAN": "Garanti-BBVA",
    "YKBNK": "Yapi-Kredi-Bankasi",
    "ISCTR": "Is-Bankasi",
    "HALKB": "Halkbank",
    "VAKBN": "Vakifbank",
    "PETKM": "Petkim",
    "KOZAL": "Koza-Altin",
    "KOZAA": "Koza-Anadolu-Metal",
    "ARCLK": "Arcelik",
    "TAVHL": "TAV-Havalimanlari",
    "FROTO": "Ford-Otosan",
    "EKGYO": "Emlak-Konut-GYO",
    "ENKAI": "Enka-Insaat",
    "PGSUS": "Pegasus",
    "ASTOR": "Astor-Enerji",
    "ISMEN": "Is-Yatirim",
    "VESTL": "Vestel",
    "TTKOM": "Turk-Telekom",
    "MGROS": "Migros",
    "SOKM": "Sok-Marketler",
}

# URL templates to try, in order.  {slug} = company slug, {year} = 4-digit.
_URL_TEMPLATES: list[str] = [
    f"{_BASE}/{{slug}}-Entegre-Faaliyet-Raporu-{{year}}.pdf",
    f"{_BASE}/{{slug}}-Faaliyet-Raporu-{{year}}.pdf",
    f"{_BASE}/{{slug}}-Finansal-Rapor-{{year}}.pdf",
    f"{_BASE}/{{slug}}-Yillik-Faaliyet-Raporu-{{year}}.pdf",
    # Some tickers use lowercase slug
    f"{_BASE}/{{slug_lower}}-entegre-faaliyet-raporu-{{year}}.pdf",
    f"{_BASE}/{{slug_lower}}-faaliyet-raporu-{{year}}.pdf",
]

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/129.0.0.0 Safari/537.36"
    ),
    "Accept": "application/pdf, */*",
}


class FintablesClient:
    """Download historical PDFs from Fintables mirror.

    Tries multiple URL patterns per ticker+year pair.  Returns the first
    successful PDF body, or None if every pattern 404s.
    """

    def __init__(
        self,
        *,
        timeout_s: float = _TIMEOUT_S,
        http_client: httpx.Client | None = None,
    ) -> None:
        self._owns_client = http_client is None
        self._client = http_client or httpx.Client(
            timeout=timeout_s,
            headers=_HEADERS,
            follow_redirects=True,
        )

    def fetch_pdf(self, ticker: str, year: int) -> bytes | None:
        """Try to download the financial/activity report PDF for *ticker* + *year*.

        Returns raw PDF bytes on success, None if not found on Fintables.
        """
        slug = TICKER_SLUG.get(ticker.upper())
        if slug is None:
            # Unknown ticker — can't construct URL
            return None

        slug_lower = slug.lower()

        for template in _URL_TEMPLATES:
            url = template.format(slug=slug, slug_lower=slug_lower, year=year)
            body = self._try_download(url)
            if body is not None:
                return body

        return None

    def source_url(self, ticker: str, year: int) -> str | None:
        """Return the URL that would be tried first (for provenance logging)."""
        slug = TICKER_SLUG.get(ticker.upper())
        if slug is None:
            return None
        return _URL_TEMPLATES[0].format(slug=slug, slug_lower=slug.lower(), year=year)

    def _try_download(self, url: str) -> bytes | None:
        """GET *url* with retry on transient errors.  Returns None on 404/403."""
        last_exc: Exception | None = None
        for attempt in range(1, _RETRY_ATTEMPTS + 1):
            try:
                resp = self._client.get(url)
            except (httpx.ConnectError, httpx.ReadTimeout, httpx.RemoteProtocolError) as exc:
                last_exc = exc
                if attempt < _RETRY_ATTEMPTS:
                    time.sleep(_RETRY_BACKOFF_S * attempt)
                continue

            if resp.status_code == 200:
                ct = resp.headers.get("content-type", "")
                if "pdf" in ct or len(resp.content) > 10_000:
                    return resp.content
                return None  # Got HTML error page, not a PDF

            if resp.status_code in (404, 403):
                return None  # This URL pattern doesn't exist

            # Transient error — retry
            if resp.status_code in (429, 500, 502, 503, 504) and attempt < _RETRY_ATTEMPTS:
                time.sleep(_RETRY_BACKOFF_S * attempt)
                continue

            return None  # Non-retryable error

        return None

    def close(self) -> None:
        if self._owns_client:
            self._client.close()
