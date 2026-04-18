#!/usr/bin/env python3
"""
BIST 30 Financial & Activity Report Downloader
Downloads all financial reports (finansal raporlar) and activity reports
(faaliyet raporları) from KAP for BIST 30 companies, 2021-2025, Q1-Q4.

Saves to: output/bist30/{TICKER}/{YEAR}/{QUARTER}/
  e.g. output/bist30/THYAO/2023/Q3-2023/THYAO_financial_report_20231108_1234567.pdf

Usage:
  python scripts/download_bist30_reports.py [--ticker THYAO] [--year 2023] [--dry-run]
"""

import argparse
import os
import sys
import time
import json
from datetime import date, datetime
from pathlib import Path

# Add python-services to path so we can import the KAP client
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "python-services" / "src"))

from financex.crawlers.kap import HttpKapClient, RawDisclosure

# ─── BIST 30 (Nisan 2026) ───────────────────────────────────────────
BIST_30 = [
    "AKBNK", "ARCLK", "ASELS", "BIMAS", "EKGYO",
    "ENKAI", "EREGL", "FROTO", "GARAN", "GUBRF",
    "HEKTS", "ISCTR", "KCHOL", "KOZAA", "KOZAL",
    "KRDMD", "MGROS", "ODAS",  "OYAKC", "PETKM",
    "PGSUS", "SAHOL", "SASA",  "SISE",  "TCELL",
    "THYAO", "TKFEN", "TOASO", "TUPRS", "YKBNK",
]

OUTPUT_DIR = PROJECT_ROOT / "output" / "bist30"

# KAP uses different internal codes for some tickers
KAP_TICKER_MAP = {
    "KOZAA": "TRALT",   # Koza Altın → KAP code TRALT
    "KOZAL": "TRMET",   # Koza Anadolu Metal → KAP code TRMET
}

# ─── Quarter date ranges ─────────────────────────────────────────────
# Financial reports are published 1-3 months after quarter end.
# We search broad windows to catch late filings.
QUARTER_WINDOWS = {
    "Q1": {"period_end_month": 3},   # Jan-Mar results, published ~Apr-Jun
    "Q2": {"period_end_month": 6},   # Apr-Jun results, published ~Jul-Sep
    "Q3": {"period_end_month": 9},   # Jul-Sep results, published ~Oct-Dec
    "Q4": {"period_end_month": 12},  # Oct-Dec results, published ~Jan-Apr next year
}

# Keywords to identify financial vs activity reports in disclosure titles
FINANCIAL_KEYWORDS = [
    "finansal tablo",
    "finansal rapor",
    "mali tablo",
    "bilanco",
    "gelir tablosu",
    "financial statement",
    "financial report",
    "bağımsız denetçi raporu",
    "konsolide",
    "solo finansal",
    "ara dönem",
    "yıllık finansal",
]

# Titles matching these patterns are NOT financial reports — they are
# corporate-governance notifications that happen to share keywords
# (e.g. "Bağımsız Denetim Kuruluşunun Belirlenmesi").
FINANCIAL_EXCLUDE_KEYWORDS = [
    "belirlenmesi",
    "seçimi",
    "atanması",
    "görevlendirilmesi",
    "sözleşme",
    "ücret",
    "komite",
]

ACTIVITY_KEYWORDS = [
    "faaliyet rapor",
    "faaliyet beyan",
    "activity report",
    "yönetim kurulu faaliyet",
    "ara dönem faaliyet",
    "yıllık faaliyet",
    "entegre faaliyet",
    "sorumluluk beyan",
]

# Quarter mapping: which period does a financial filing belong to?
# Based on the report period mentioned in the title or the month of announcement.
QUARTER_MONTH_MAP = {
    1: "Q4",  2: "Q4",  3: "Q4",   # Jan-Mar announcements → Q4 of prev year (annual/Q4)
    4: "Q1",  5: "Q1",  6: "Q1",   # Apr-Jun announcements → Q1
    7: "Q2",  8: "Q2",  9: "Q2",   # Jul-Sep announcements → Q2
    10: "Q3", 11: "Q3", 12: "Q3",  # Oct-Dec announcements → Q3
}

# Title-based quarter detection patterns (Turkish)
TITLE_QUARTER_PATTERNS = [
    # Explicit quarter mentions
    ("01.01", "03.31", "Q1"), ("01.01", "31.03", "Q1"),
    ("01.01", "06.30", "Q2"), ("01.01", "30.06", "Q2"),
    ("01.01", "09.30", "Q3"), ("01.01", "30.09", "Q3"),
    ("01.01", "12.31", "Q4"), ("01.01", "31.12", "Q4"),
    # Month name patterns
    ("ocak-mart", None, "Q1"), ("ocak - mart", None, "Q1"),
    ("ocak-haziran", None, "Q2"), ("ocak - haziran", None, "Q2"),
    ("ocak-eylül", None, "Q3"), ("ocak - eylül", None, "Q3"),
    ("ocak-aralık", None, "Q4"), ("ocak - aralık", None, "Q4"),
    # Period patterns
    ("3 aylık", None, "Q1"), ("3 aylik", None, "Q1"),
    ("6 aylık", None, "Q2"), ("6 aylik", None, "Q2"),
    ("9 aylık", None, "Q3"), ("9 aylik", None, "Q3"),
    ("12 aylık", None, "Q4"), ("yıllık", None, "Q4"),
    # KAP-style "4. 3 Aylık Bildirim" patterns (e.g. "2025 - 4. 3 Aylık Bildirim")
    ("1. 3 aylık", None, "Q1"), ("1. 3 aylik", None, "Q1"),
    ("2. 3 aylık", None, "Q2"), ("2. 3 aylik", None, "Q2"),
    ("3. 3 aylık", None, "Q3"), ("3. 3 aylik", None, "Q3"),
    ("4. 3 aylık", None, "Q4"), ("4. 3 aylik", None, "Q4"),
    # Standalone end-of-period date (annual: "31 Aralık 2025")
    ("31 aralık", None, "Q4"), ("31 aralik", None, "Q4"),
    ("30 eylül", None, "Q3"), ("30 eylul", None, "Q3"),
    ("30 haziran", None, "Q2"),
    ("31 mart", None, "Q1"),
]


def classify_disclosure(d: RawDisclosure) -> str | None:
    """Return 'financial' or 'activity' or None."""
    title_lower = d.title.lower()
    cat = (d.category or "").upper()
    subcat = (d.subcategory or "").upper()

    # KAP category-based classification
    if cat == "FR" or subcat == "FR":
        # FR = Finansal Rapor — but exclude governance notifications
        if any(kw in title_lower for kw in ACTIVITY_KEYWORDS):
            return "activity"
        if any(kw in title_lower for kw in FINANCIAL_EXCLUDE_KEYWORDS):
            return None  # governance notification, not a financial report
        return "financial"

    # Title-based classification (reject governance notifications first)
    is_excluded = any(kw in title_lower for kw in FINANCIAL_EXCLUDE_KEYWORDS)
    if not is_excluded and any(kw in title_lower for kw in FINANCIAL_KEYWORDS):
        return "financial"
    if any(kw in title_lower for kw in ACTIVITY_KEYWORDS):
        return "activity"

    # disclosureClass based
    if "FR" in subcat or "ODA" in cat:
        # Check title more carefully
        if "faaliyet" in title_lower:
            return "activity"
        if "finansal" in title_lower or "mali" in title_lower or "denetim" in title_lower:
            return "financial"

    return None


def detect_quarter(d: RawDisclosure) -> str:
    """Detect which quarter this report belongs to."""
    title_lower = d.title.lower()

    # 1. Try title-based detection first (most accurate)
    for pattern in TITLE_QUARTER_PATTERNS:
        start, end, quarter = pattern
        if start in title_lower:
            if end is None or end in title_lower:
                return quarter

    # 2. Look for year patterns like "2023/3", "2023/6", "2023/9", "2023/12"
    import re
    period_match = re.search(r'20\d{2}\s*/\s*(\d{1,2})', title_lower)
    if period_match:
        month = int(period_match.group(1))
        if month <= 3:
            return "Q1"
        elif month <= 6:
            return "Q2"
        elif month <= 9:
            return "Q3"
        else:
            return "Q4"

    # 3. Fall back: put unclassified reports in OTHER so the pipeline
    #    can pick the right file by size/content rather than a wrong guess.
    return "OTHER"


def detect_report_year(d: RawDisclosure, quarter: str) -> int:
    """Detect which fiscal year this report belongs to."""
    import re
    title = d.title

    # Try to find explicit year in title
    year_matches = re.findall(r'(20[12]\d)', title)
    if year_matches:
        return int(year_matches[0])

    # For Q4 reports announced in Jan-Mar, the report is for the previous year
    announce_year = d.announced_at.year
    announce_month = d.announced_at.month
    if quarter == "Q4" and announce_month <= 4:
        return announce_year - 1

    return announce_year


def download_ticker_year(
    client: HttpKapClient,
    kap_ticker: str,
    display_ticker: str,
    year: int,
    dry_run: bool = False,
    existing_ids: set[str] | None = None,
) -> dict:
    """Download all financial & activity reports for a ticker/year."""
    ticker = display_ticker  # Use BIST ticker for filenames/dirs
    stats = {"financial": 0, "activity": 0, "skipped": 0, "errors": 0, "already_exists": 0}
    existing_ids = existing_ids or set()

    # KAP returns 500 on windows > ~6 months from the same IP.
    # Split into quarterly windows to stay within safe limits.
    windows = [
        (date(year, 1, 1), date(year, 3, 31)),
        (date(year, 4, 1), date(year, 6, 30)),
        (date(year, 7, 1), date(year, 9, 30)),
        (date(year, 10, 1), date(year, 12, 31)),
    ]
    # Also check Q1 of next year for Q4 annual reports published late
    if year < 2026:
        windows.append((date(year + 1, 1, 1), date(year + 1, 4, 15)))

    disclosures: list[RawDisclosure] = []
    for w_since, w_until in windows:
        if w_until > date.today():
            w_until = date.today()
        if w_since > date.today():
            break
        print(f"  [{ticker}] Querying KAP: {w_since} → {w_until}")
        try:
            batch = client.fetch_disclosures(kap_ticker, since=w_since, until=w_until)
            disclosures.extend(batch)
            time.sleep(2)  # Rate limit between queries
        except Exception as e:
            print(f"  [{ticker}] ERROR fetching {w_since}→{w_until}: {e}")
            stats["errors"] += 1
            time.sleep(5)

    # Deduplicate by disclosure_id
    seen_ids: set[str] = set()
    unique_disclosures = []
    for d in disclosures:
        if d.disclosure_id not in seen_ids:
            seen_ids.add(d.disclosure_id)
            unique_disclosures.append(d)
    disclosures = unique_disclosures

    print(f"  [{ticker}] Found {len(disclosures)} unique disclosures for {year}")

    # Filter and classify
    for d in disclosures:
        report_type = classify_disclosure(d)
        if report_type is None:
            continue

        # Skip if already downloaded
        if d.disclosure_id in existing_ids:
            stats["already_exists"] += 1
            continue

        quarter = detect_quarter(d)
        report_year = detect_report_year(d, quarter)

        # Only keep reports for the target year
        if report_year != year:
            # But allow: Q4 reports announced early next year
            if not (quarter == "Q4" and report_year == year):
                continue

        # Build output path
        date_str = d.announced_at.strftime("%Y%m%d")
        filename = f"{ticker}_{report_type}_report_{date_str}_{d.disclosure_id}.pdf"
        quarter_dir = OUTPUT_DIR / ticker / str(report_year) / f"{quarter}-{report_year}"
        quarter_dir.mkdir(parents=True, exist_ok=True)
        filepath = quarter_dir / filename

        if filepath.exists():
            stats["already_exists"] += 1
            continue

        if dry_run:
            print(f"    [DRY-RUN] Would download: {filepath.name}")
            print(f"              Title: {d.title[:80]}")
            stats[report_type] += 1
            continue

        # Download PDF
        try:
            pdf_bytes = client.download_pdf(d.disclosure_id)

            # Validate it's actually a PDF
            if not pdf_bytes or len(pdf_bytes) < 1000:
                print(f"    [SKIP] {d.disclosure_id}: too small ({len(pdf_bytes)} bytes)")
                stats["skipped"] += 1
                continue

            if not pdf_bytes[:5] == b"%PDF-":
                print(f"    [SKIP] {d.disclosure_id}: not a valid PDF")
                stats["skipped"] += 1
                continue

            filepath.write_bytes(pdf_bytes)
            size_kb = len(pdf_bytes) / 1024
            print(f"    [OK] {filename} ({size_kb:.0f} KB)")
            stats[report_type] += 1

            # Rate limit: KAP doesn't like rapid-fire requests
            time.sleep(1.5)

        except Exception as e:
            print(f"    [ERROR] {d.disclosure_id}: {e}")
            stats["errors"] += 1
            time.sleep(3)  # Extra wait on error

    return stats


def get_existing_ids(ticker: str) -> set[str]:
    """Scan existing files to find already-downloaded disclosure IDs."""
    ids = set()
    ticker_dir = OUTPUT_DIR / ticker
    if ticker_dir.exists():
        for pdf_file in ticker_dir.rglob("*.pdf"):
            # Extract disclosure ID from filename: TICKER_type_report_YYYYMMDD_ID.pdf
            parts = pdf_file.stem.split("_")
            if len(parts) >= 5:
                ids.add(parts[-1])
    return ids


def main():
    parser = argparse.ArgumentParser(description="Download BIST 30 reports from KAP")
    parser.add_argument("--ticker", type=str, help="Single ticker to download (default: all BIST 30)")
    parser.add_argument("--year", type=int, help="Single year to download (default: 2021-2025)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be downloaded without actually downloading")
    parser.add_argument("--resume", type=str, help="Resume from this ticker (skip earlier ones alphabetically)")
    args = parser.parse_args()

    tickers = [args.ticker.upper()] if args.ticker else BIST_30
    years = [args.year] if args.year else [2021, 2022, 2023, 2024, 2025]

    if args.resume:
        resume_ticker = args.resume.upper()
        tickers = [t for t in tickers if t >= resume_ticker]
        print(f"Resuming from {resume_ticker}, {len(tickers)} tickers remaining")

    print(f"{'=' * 60}")
    print(f"BIST 30 Report Downloader")
    print(f"Tickers: {len(tickers)} | Years: {years}")
    print(f"Output: {OUTPUT_DIR}")
    if args.dry_run:
        print(f"MODE: DRY RUN (no downloads)")
    print(f"{'=' * 60}\n")

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Initialize KAP client
    client = HttpKapClient()

    total_stats = {"financial": 0, "activity": 0, "skipped": 0, "errors": 0, "already_exists": 0}
    progress_file = OUTPUT_DIR / "_download_progress.json"

    # Load progress if exists
    progress = {}
    if progress_file.exists():
        try:
            progress = json.loads(progress_file.read_text())
        except:
            pass

    try:
        for i, ticker in enumerate(tickers, 1):
            print(f"\n{'─' * 50}")
            print(f"[{i}/{len(tickers)}] {ticker}")
            print(f"{'─' * 50}")

            # Resolve KAP ticker (some companies use different internal codes)
            kap_ticker = KAP_TICKER_MAP.get(ticker, ticker)
            if kap_ticker != ticker:
                print(f"  KAP kodu: {kap_ticker} (BIST: {ticker})")

            existing_ids = get_existing_ids(ticker)
            if existing_ids:
                print(f"  Already have {len(existing_ids)} files")

            for year in years:
                progress_key = f"{ticker}_{year}"
                if progress.get(progress_key) == "done" and not args.dry_run:
                    print(f"  [{ticker}] {year}: already completed (skipping)")
                    continue

                print(f"\n  [{ticker}] Year {year}:")
                stats = download_ticker_year(client, kap_ticker, ticker, year, args.dry_run, existing_ids)

                for k, v in stats.items():
                    total_stats[k] += v

                if not args.dry_run and stats["errors"] == 0:
                    progress[progress_key] = "done"
                    progress_file.write_text(json.dumps(progress, indent=2))

                # Inter-year cooldown
                time.sleep(2)

            # Inter-ticker cooldown
            time.sleep(3)

    except KeyboardInterrupt:
        print(f"\n\n⚠ Interrupted! Progress saved. Resume with --resume {ticker}")
    finally:
        client.close()

    # Summary
    print(f"\n{'=' * 60}")
    print(f"DOWNLOAD SUMMARY")
    print(f"{'=' * 60}")
    print(f"Financial reports: {total_stats['financial']}")
    print(f"Activity reports:  {total_stats['activity']}")
    print(f"Already existed:   {total_stats['already_exists']}")
    print(f"Skipped (invalid): {total_stats['skipped']}")
    print(f"Errors:            {total_stats['errors']}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
