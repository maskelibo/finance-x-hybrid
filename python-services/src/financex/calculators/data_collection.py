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
import os
import re
import time
from datetime import UTC, date, datetime
from pathlib import Path

from financex.crawlers.fintables import FintablesClient
from financex.crawlers.kap import HttpKapClient, KapClient, RawDisclosure
from financex.schemas.base import SourceRef
from financex.schemas.data_collection import CollectedDocument, DataCollectionManifest, YearCoverageGap

# Only used when we DO have to go back to KAP (no prefetched list).
# kap_watch + data_collection land in the same orchestrator phase, so
# without a disclosure-list handoff we trip KAP's per-IP rate limit.
# Default is generous; the orchestrator now passes a prefetched list
# via CollectedDisclosuresList and the cooldown is bypassed entirely.
_KAP_COOLDOWN_S = float(os.environ.get("FINANCEX_KAP_COOLDOWN_S", "4"))


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
    prefetched_disclosures: list[RawDisclosure] | None = None,
) -> DataCollectionManifest:
    """Collect all interesting disclosures for a ticker, downloading PDFs
    for the chosen `kinds_to_download`.

    If `prefetched_disclosures` is supplied (typically piped from the
    orchestrator after kap_watch already fetched the list), we skip the
    byCriteria POST entirely and go straight to PDF downloads. This
    avoids tripping KAP's back-to-back rate-limit.
    """
    http_client = client or HttpKapClient()
    _owns_client = client is None
    ceiling = until or date.today()

    pdf_dir.mkdir(parents=True, exist_ok=True)

    documents: list[CollectedDocument] = []
    errors: list[str] = []
    warnings: list[str] = []

    if prefetched_disclosures is not None:
        # Orchestrator already has the list from kap_watch — reuse it
        # and skip the byCriteria call (plus its cooldown).
        raw_list = prefetched_disclosures
    else:
        # Cool-down in case the orchestrator just ran kap_watch against the
        # same ticker — KAP rate-limits back-to-back byCriteria calls.
        if _KAP_COOLDOWN_S > 0:
            time.sleep(_KAP_COOLDOWN_S)

        try:
            raw_list = http_client.fetch_disclosures(
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

    sources = [
        SourceRef(
            source_id="kap",
            url="https://www.kap.org.tr",
            fetched_at=datetime.now(UTC),
            detail="POST /tr/api/disclosure/members/byCriteria + GET /tr/api/BildirimPdf",
        )
    ]

    # ------------------------------------------------------------------
    # Year-gap detection + Fintables fallback
    # ------------------------------------------------------------------
    expected_years = set(range(since.year, ceiling.year + 1))
    covered_years_fr = {d.year for d in documents if d.kind == "financial_report" and d.year}
    covered_years_ar = {d.year for d in documents if d.kind == "activity_report" and d.year}
    missing_fr = sorted(expected_years - covered_years_fr)
    missing_ar = sorted(expected_years - covered_years_ar)

    coverage_gaps: list[YearCoverageGap] = []

    if missing_fr or missing_ar:
        # Try Fintables mirror for missing years
        fintables = FintablesClient()
        fintables_used = False
        try:
            for year in sorted(set(missing_fr) | set(missing_ar)):
                pdf_bytes = fintables.fetch_pdf(ticker, year)
                if pdf_bytes is not None:
                    fintables_used = True
                    sha = _sha256(pdf_bytes)
                    # Fintables reports are typically activity_report (entegre faaliyet)
                    kind = "activity_report"
                    stamp = f"{year}0101"
                    fname = f"{ticker.upper()}_{kind}_{stamp}_fintables.pdf"
                    local_path = (pdf_dir / fname).resolve()
                    if not (local_path.exists() and _sha256(local_path.read_bytes()) == sha):
                        local_path.write_bytes(pdf_bytes)

                    fintables_url = fintables.source_url(ticker, year) or ""
                    documents.append(
                        CollectedDocument(
                            kind=kind,
                            disclosure_index=f"fintables-{year}",
                            title=f"{ticker.upper()} Faaliyet Raporu {year} (Fintables mirror)",
                            published_at=datetime(year, 12, 31, tzinfo=UTC),
                            source_url=fintables_url,
                            local_path=str(local_path),
                            content_sha256=sha,
                            size_bytes=len(pdf_bytes),
                            period_label=f"FY{year}",
                            year=year,
                        )
                    )
                    # Remove from missing sets
                    missing_fr = [y for y in missing_fr if y != year]
                    missing_ar = [y for y in missing_ar if y != year]
                else:
                    # Record the gap
                    coverage_gaps.append(
                        YearCoverageGap(
                            year=year,
                            kind="financial_report",
                            sources_tried=["kap", "fintables"],
                            reason="404_all_sources",
                        )
                    )
        finally:
            fintables.close()

        if fintables_used:
            sources.append(
                SourceRef(
                    source_id="fintables",
                    url="https://storage.fintables.com",
                    fetched_at=datetime.now(UTC),
                    detail="GET /media/uploads/kap-attachments/{slug}-*-{year}.pdf",
                )
            )

    # Any remaining gaps that Fintables couldn't fill
    for year in missing_fr:
        if not any(g.year == year for g in coverage_gaps):
            coverage_gaps.append(
                YearCoverageGap(
                    year=year,
                    kind="financial_report",
                    sources_tried=["kap"],
                    reason="not_in_kap_window",
                )
            )

    if coverage_gaps:
        gap_years = sorted({g.year for g in coverage_gaps})
        warnings.append(f"Year coverage gaps remain: {gap_years}. Manual IR page fetch may be needed.")

    return DataCollectionManifest(
        ticker=ticker.upper(),
        collected_at=datetime.now(UTC),
        since=since,
        until=ceiling,
        documents=documents,
        sources_consulted=sources,
        errors=errors,
        warnings=warnings,
        coverage_gaps=coverage_gaps,
    )
