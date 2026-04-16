"""data_collection runner — fetch KAP disclosures + pull the PDFs.

Hybrid layer (Python side): deterministic fetch/classify/download of
the documents a ticker's analysis will need. The LLM layer downstream
interprets them; we just get them on disk.

Behaviour:
  1. Window the KAP query (default: last 6 years).
  2. For every disclosure, classify it coarsely (financial_report,
     activity_report, disclosure, other) using title + category keywords.
  3. Download the PDF behind each financial_report and activity_report,
     hash it, write it to the configured `pdf_dir`, record everything
     in a DataCollectionManifest.

Design notes:
  - We do NOT download every disclosure PDF — that would be tens of MB
    per ticker and most disclosures are administrative. Only the
    financial + activity reports matter for downstream parsing.
  - Idempotent: if a PDF with the same SHA256 already exists, we reuse
    it and skip the network hit.
"""

from __future__ import annotations

import hashlib
import re
from datetime import UTC, date, datetime
from pathlib import Path

from financex.crawlers.kap import HttpKapClient, KapClient, RawDisclosure
from financex.schemas.base import SourceRef
from financex.schemas.data_collection import CollectedDocument, DataCollectionManifest


# ---------- Coarse classification --------------------------------------

_KIND_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("financial_report", ("finansal rapor", "finansal tablo", "financial report")),
    ("activity_report", ("faaliyet raporu", "activity report")),
]


def _tr_lower(text: str) -> str:
    return text.replace("İ", "i").replace("I", "ı").lower()


def classify_kind(title: str, category: str | None, summary: str | None) -> str:
    hay = _tr_lower(" ".join(filter(None, (title, category, summary))))

    # KAP disclosureCategory 'FR' = Finansal Rapor — authoritative.
    if (category or "").upper() == "FR":
        return "financial_report"

    for kind, keywords in _KIND_RULES:
        if any(kw in hay for kw in keywords):
            return kind
    return "disclosure"


# ---------- Period inference -------------------------------------------

_PERIOD_PATTERNS = (
    # "01.01.2024 - 30.09.2024" → Q3-2024
    (re.compile(r"(\d{2})\.(\d{2})\.(\d{4})\s*-\s*(\d{2})\.(\d{2})(\d{2}|\d{4})"), "date-range"),
    # "Q3-2024", "2024 3. Çeyrek"
    (re.compile(r"20\d{2}\s*(?:3|4|1|2)\s*(?:\.|\s)?\s*çeyrek", re.IGNORECASE), "quarter-tr"),
    (re.compile(r"\bQ([1-4])[- ]?(\d{4})\b", re.IGNORECASE), "q-en"),
    (re.compile(r"\b(20\d{2})\s*YILI\b", re.IGNORECASE), "annual-tr"),
)


def infer_period(title: str, summary: str | None, published_at: datetime) -> tuple[str | None, int | None]:
    """Best-effort period label + year, based on title/summary text.

    Falls back to the published_at year.
    """
    text = f"{title or ''} {summary or ''}"

    # "01.01.2024 - 30.09.2024" → Q3-2024 (ends in Sept)
    m = re.search(r"\d{2}\.\d{2}\.(\d{4})\s*-\s*(\d{2})\.(\d{2})\.(\d{2,4})", text)
    if m:
        year_end = m.group(4)
        month_end = int(m.group(3))
        year = int(year_end) if len(year_end) == 4 else 2000 + int(year_end)
        if month_end == 3:
            return f"Q1-{year}", year
        if month_end == 6:
            return f"H1-{year}" if "Ara" not in text else f"Q2-{year}", year
        if month_end == 9:
            return f"Q3-{year}", year
        if month_end == 12:
            return f"FY{year}", year
        return f"P-{month_end:02d}-{year}", year

    # Explicit Turkish quarter
    m = re.search(r"(20\d{2}).{0,10}?([1-4])\s*\.?\s*çeyrek", _tr_lower(text))
    if m:
        year = int(m.group(1))
        q = m.group(2)
        return f"Q{q}-{year}", year

    # Fallback: year from publish date
    y = published_at.year
    return None, y


# ---------- Hashing + I/O ----------------------------------------------

def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _filename_for(ticker: str, idx: str, kind: str, published_at: datetime) -> str:
    stamp = published_at.strftime("%Y%m%d")
    return f"{ticker}_{kind}_{stamp}_{idx}.pdf"


# ---------- Main runner ------------------------------------------------

def run_data_collection(
    ticker: str,
    *,
    since: date,
    until: date | None = None,
    client: KapClient | None = None,
    pdf_dir: Path,
    kinds_to_download: tuple[str, ...] = ("financial_report", "activity_report"),
) -> DataCollectionManifest:
    """Collect all interesting disclosures for a ticker, downloading PDFs
    for the chosen `kinds_to_download`.
    """
    http_client = client or HttpKapClient()
    _owns_client = client is None
    ceiling = until or date.today()

    pdf_dir.mkdir(parents=True, exist_ok=True)

    documents: list[CollectedDocument] = []
    errors: list[str] = []
    warnings: list[str] = []

    try:
        raw_list: list[RawDisclosure] = http_client.fetch_disclosures(
            ticker, since=since, until=ceiling
        )
    except Exception as exc:
        raise RuntimeError(f"KAP fetch_disclosures failed for {ticker}: {exc}") from exc

    for raw in raw_list:
        kind = classify_kind(raw.title, raw.category, raw.summary)
        period_label, year = infer_period(raw.title, raw.summary, raw.announced_at)

        if kind not in kinds_to_download:
            continue
        if not raw.disclosure_id:
            warnings.append(f"Skipping disclosure with empty index: {raw.title!r}")
            continue

        # Only HttpKapClient has download_pdf. Test clients may skip PDF bodies.
        if not hasattr(http_client, "download_pdf"):
            warnings.append(f"{type(http_client).__name__} has no download_pdf; skipping PDF body.")
            continue

        try:
            pdf_bytes = http_client.download_pdf(raw.disclosure_id)  # type: ignore[attr-defined]
        except Exception as exc:
            errors.append(f"download_pdf failed for idx={raw.disclosure_id}: {exc}")
            continue

        sha = _sha256(pdf_bytes)
        filename = _filename_for(ticker.upper(), raw.disclosure_id, kind, raw.announced_at)
        local_path = (pdf_dir / filename).resolve()

        # Idempotent: if we already have a file with this SHA256 under the
        # same name, skip the write.
        if not (local_path.exists() and _sha256(local_path.read_bytes()) == sha):
            local_path.write_bytes(pdf_bytes)

        documents.append(
            CollectedDocument(
                kind=kind,
                disclosure_index=raw.disclosure_id,
                title=raw.title,
                published_at=raw.announced_at,
                source_url=raw.url,
                local_path=str(local_path),
                content_sha256=sha,
                size_bytes=len(pdf_bytes),
                category=raw.category,
                subcategory=raw.subcategory,
                summary=raw.summary,
                period_label=period_label,
                year=year,
            )
        )

    if _owns_client and hasattr(http_client, "close"):
        http_client.close()  # type: ignore[attr-defined]

    return DataCollectionManifest(
        ticker=ticker.upper(),
        collected_at=datetime.now(UTC),
        since=since,
        until=ceiling,
        documents=documents,
        sources_consulted=[
            SourceRef(
                source_id="kap",
                url="https://www.kap.org.tr",
                fetched_at=datetime.now(UTC),
                detail=f"POST /tr/api/disclosure/members/byCriteria + GET /tr/api/BildirimPdf",
            )
        ],
        errors=errors,
        warnings=warnings,
    )
