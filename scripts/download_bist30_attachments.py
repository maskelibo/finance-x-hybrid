#!/usr/bin/env python3
"""
BIST 30 — Download actual financial & activity report PDFs from KAP.

KAP publishes two layers per disclosure:
  1. BildirimPdf  — the notification/cover page (small, ~100-180KB)
  2. File attachment — the actual report PDF (large, 400KB-50MB)

The original downloader only fetched layer 1. This script fetches
layer 2 (the real reports) for all BIST 30 companies, 2021-2025.

Strategy:
  1. Fetch disclosure list via byCriteria API (reuses existing KAP client)
  2. Filter for FR (Finansal Rapor) category disclosures
  3. For each disclosure, GET the bildirim page → extract attachment UUID
  4. Download the attachment PDF via /tr/api/file/download/{UUID}
  5. Save to output/bist30/{TICKER}/{YEAR}/{QUARTER}-{YEAR}/

Usage:
  python scripts/download_bist30_attachments.py [--ticker THYAO] [--year 2023]
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import date, datetime
from pathlib import Path
from urllib.parse import unquote

import httpx

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "python-services" / "src"))

from financex.crawlers.kap import HttpKapClient, RawDisclosure

# ─── Config ─────────────────────────────────────────────────────────
BIST_30 = [
    "AKBNK", "ARCLK", "ASELS", "BIMAS", "EKGYO",
    "ENKAI", "EREGL", "FROTO", "GARAN", "GUBRF",
    "HEKTS", "ISCTR", "KCHOL", "KOZAA", "KOZAL",
    "KRDMD", "MGROS", "ODAS",  "OYAKC", "PETKM",
    "PGSUS", "SAHOL", "SASA",  "SISE",  "TCELL",
    "THYAO", "TKFEN", "TOASO", "TUPRS", "YKBNK",
]

KAP_TICKER_MAP = {
    "KOZAA": "TRALT",
    "KOZAL": "TRMET",
}

OUTPUT_DIR = PROJECT_ROOT / "output" / "bist30"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/129.0.0.0 Safari/537.36"
    ),
    "Accept": "*/*",
    "Accept-Language": "tr-TR,tr;q=0.9",
    "Origin": "https://www.kap.org.tr",
    "Referer": "https://www.kap.org.tr/",
}

FILE_DOWNLOAD_URL = "https://www.kap.org.tr/tr/api/file/download/{uuid}"
BILDIRIM_URL = "https://www.kap.org.tr/tr/Bildirim/{disc_id}"
UUID_RE = re.compile(r'/tr/api/file/download/([a-f0-9]{20,})')


def detect_quarter_from_raw(d: RawDisclosure) -> str | None:
    """Use KAP's structured period/year fields when available."""
    period = d.raw.get("period")
    if period is not None:
        try:
            p = int(period)
            return {1: "Q1", 2: "Q2", 3: "Q3", 4: "Q4"}.get(p)
        except (ValueError, TypeError):
            pass

    # Fallback: title-based
    title = d.title.lower()
    patterns = [
        ("4. 3 aylık", "Q4"), ("4. 3 aylik", "Q4"),
        ("3. 3 aylık", "Q3"), ("3. 3 aylik", "Q3"),
        ("2. 3 aylık", "Q2"), ("2. 3 aylik", "Q2"),
        ("1. 3 aylık", "Q1"), ("1. 3 aylik", "Q1"),
        ("12 aylık", "Q4"), ("yıllık", "Q4"),
        ("9 aylık", "Q3"), ("6 aylık", "Q2"), ("3 aylık", "Q1"),
        ("31 aralık", "Q4"), ("30 eylül", "Q3"),
        ("30 haziran", "Q2"), ("31 mart", "Q1"),
    ]
    for kw, q in patterns:
        if kw in title:
            return q
    return None


def detect_year_from_raw(d: RawDisclosure) -> int | None:
    """Use KAP's year field, fallback to title."""
    y = d.raw.get("year")
    if y:
        try:
            return int(y)
        except (ValueError, TypeError):
            pass
    # Title-based
    matches = re.findall(r'(20[12]\d)', d.title)
    if matches:
        return int(matches[0])
    return None


def classify_from_raw(d: RawDisclosure) -> str | None:
    """Classify disclosure as 'financial' or 'activity' using KAP metadata."""
    cat = (d.raw.get("disclosureCategory") or "").upper()
    title_lower = d.title.lower()

    # Exclude governance notifications
    exclude = ["belirlenmesi", "seçimi", "atanması", "görevlendirilmesi",
               "sözleşme", "ücret", "komite", "sorumluluk beyan"]
    if any(kw in title_lower for kw in exclude):
        return None

    # FR category = Finansal Rapor (financial statements)
    if cat == "FR":
        if "faaliyet" in title_lower:
            return "activity"
        return "financial"

    # ODA category = Özel Durum Açıklaması — includes faaliyet raporları
    if cat == "ODA":
        if "faaliyet rapor" in title_lower:
            return "activity"
        # Other ODA disclosures (dividends, board decisions etc.) are not reports
        return None

    return None


def get_attachment_uuid(http: httpx.Client, disc_id: str) -> tuple[str | None, str | None]:
    """Fetch the bildirim page and extract the attachment file UUID + filename."""
    url = BILDIRIM_URL.format(disc_id=disc_id)
    try:
        resp = http.get(url)
        if resp.status_code != 200:
            return None, None
        uuids = UUID_RE.findall(resp.text)
        if not uuids:
            return None, None
        uuid = uuids[0]

        # Get filename from Content-Disposition header
        head_resp = http.head(FILE_DOWNLOAD_URL.format(uuid=uuid))
        cd = head_resp.headers.get("content-disposition", "")
        filename = None
        if "filename*=" in cd:
            # RFC 5987: filename*=UTF-8''encoded_name
            match = re.search(r"filename\*=UTF-8''(.+)", cd)
            if match:
                filename = unquote(match.group(1))
        elif "filename=" in cd:
            match = re.search(r'filename="?([^";\n]+)"?', cd)
            if match:
                filename = match.group(1)
        return uuid, filename
    except Exception as e:
        print(f"    [WARN] get_attachment_uuid({disc_id}): {e}")
        return None, None


def download_attachment(http: httpx.Client, uuid: str) -> bytes | None:
    """Download the actual report PDF by UUID.

    KAP wraps some PDFs in a Java serialization header (first ~27 bytes
    are 0xACED 0005 ...). We detect this and extract the raw PDF from
    the %PDF- marker onward.
    """
    url = FILE_DOWNLOAD_URL.format(uuid=uuid)
    try:
        resp = http.get(url)
        if resp.status_code != 200 or len(resp.content) < 1000:
            return None
        data = resp.content
        if data[:5] == b"%PDF-":
            return data
        # Java-wrapped: find the embedded %PDF-
        pdf_start = data.find(b"%PDF-")
        if pdf_start > 0:
            return data[pdf_start:]
        return None
    except Exception as e:
        print(f"    [WARN] download_attachment: {e}")
        return None


def process_ticker_year(
    kap: HttpKapClient,
    http: httpx.Client,
    kap_ticker: str,
    display_ticker: str,
    year: int,
    existing_files: set[str],
) -> dict:
    stats = {"financial": 0, "activity": 0, "skipped": 0, "errors": 0, "exists": 0}

    # Fetch disclosures for the year + early next year (for Q4 annual reports)
    windows = [
        (date(year, 1, 1), date(year, 3, 31)),
        (date(year, 4, 1), date(year, 6, 30)),
        (date(year, 7, 1), date(year, 9, 30)),
        (date(year, 10, 1), date(year, 12, 31)),
    ]
    if year < 2026:
        windows.append((date(year + 1, 1, 1), date(year + 1, 4, 30)))

    disclosures: list[RawDisclosure] = []
    for w_since, w_until in windows:
        if w_since > date.today():
            break
        if w_until > date.today():
            w_until = date.today()
        try:
            batch = kap.fetch_disclosures(kap_ticker, since=w_since, until=w_until)
            disclosures.extend(batch)
            time.sleep(2)
        except Exception as e:
            print(f"  [{display_ticker}] ERROR fetching {w_since}→{w_until}: {e}")
            stats["errors"] += 1
            time.sleep(5)

    # Deduplicate
    seen = set()
    unique = []
    for d in disclosures:
        if d.disclosure_id not in seen:
            seen.add(d.disclosure_id)
            unique.append(d)
    disclosures = unique

    # Filter: FR category only, with attachments
    candidates = []
    for d in disclosures:
        report_type = classify_from_raw(d)
        if report_type is None:
            continue
        if d.raw.get("attachmentCount", 0) < 1:
            continue
        d_year = detect_year_from_raw(d)
        # For Q4 annual reports announced early next year, accept year+1 announce date
        announce_year = d.announced_at.year
        if d_year is None:
            # No year in metadata — infer from announcement date
            d_year = announce_year if d.announced_at.month >= 4 else announce_year - 1
        if d_year != year:
            continue
        quarter = detect_quarter_from_raw(d)
        if quarter is None:
            quarter = "OTHER"
        candidates.append((d, report_type, quarter))

    print(f"  [{display_ticker}] {year}: {len(disclosures)} disclosures → {len(candidates)} with attachments")

    for d, report_type, quarter in candidates:
        # Build filename
        date_str = d.announced_at.strftime("%Y%m%d")
        filename = f"{display_ticker}_{report_type}_report_{date_str}_{d.disclosure_id}.pdf"

        # Check if already exists in ANY folder
        if filename in existing_files:
            stats["exists"] += 1
            continue

        # Build output path
        quarter_dir = OUTPUT_DIR / display_ticker / str(year) / f"{quarter}-{year}"
        quarter_dir.mkdir(parents=True, exist_ok=True)
        filepath = quarter_dir / filename

        if filepath.exists() and filepath.stat().st_size > 200_000:
            stats["exists"] += 1
            existing_files.add(filename)
            continue
        # Also check if this file exists in OTHER folder with >200KB
        other_path = OUTPUT_DIR / display_ticker / str(year) / "OTHER" / filename
        if other_path.exists() and other_path.stat().st_size > 200_000:
            stats["exists"] += 1
            existing_files.add(filename)
            continue
        # If small notification PDF exists at this path, we'll overwrite it with the real report

        # Get attachment UUID
        uuid, orig_name = get_attachment_uuid(http, d.disclosure_id)
        if not uuid:
            print(f"    [SKIP] {d.disclosure_id}: no attachment UUID found ({d.title[:60]})")
            stats["skipped"] += 1
            continue

        time.sleep(1)

        # Download
        pdf_bytes = download_attachment(http, uuid)
        if not pdf_bytes:
            print(f"    [SKIP] {d.disclosure_id}: attachment download failed")
            stats["skipped"] += 1
            continue

        filepath.write_bytes(pdf_bytes)
        size_kb = len(pdf_bytes) // 1024
        stats[report_type] += 1
        existing_files.add(filename)
        print(f"    [OK] {filename} ({size_kb}KB) ← {orig_name or uuid[:16]}")
        time.sleep(1.5)

    return stats


def get_existing_files(ticker: str) -> set[str]:
    """Get all existing filenames for a ticker (any folder depth)."""
    names = set()
    ticker_dir = OUTPUT_DIR / ticker
    if ticker_dir.exists():
        for f in ticker_dir.rglob("*.pdf"):
            if f.stat().st_size > 200_000:
                names.add(f.name)
    return names


def main():
    parser = argparse.ArgumentParser(description="Download BIST 30 actual report PDFs from KAP attachments")
    parser.add_argument("--ticker", type=str, help="Single ticker (default: all BIST 30)")
    parser.add_argument("--year", type=int, help="Single year (default: 2021-2025)")
    parser.add_argument("--resume", type=str, help="Resume from this ticker")
    args = parser.parse_args()

    tickers = [args.ticker.upper()] if args.ticker else BIST_30
    years = [args.year] if args.year else [2021, 2022, 2023, 2024, 2025]

    if args.resume:
        tickers = [t for t in tickers if t >= args.resume.upper()]

    print(f"{'='*60}")
    print(f"BIST 30 Attachment Downloader")
    print(f"Tickers: {len(tickers)} | Years: {years}")
    print(f"{'='*60}\n")

    kap = HttpKapClient()
    http = httpx.Client(headers=HEADERS, timeout=60, follow_redirects=True)

    totals = {"financial": 0, "activity": 0, "skipped": 0, "errors": 0, "exists": 0}

    try:
        for i, ticker in enumerate(tickers, 1):
            print(f"\n{'─'*50}")
            print(f"[{i}/{len(tickers)}] {ticker}")
            print(f"{'─'*50}")

            kap_ticker = KAP_TICKER_MAP.get(ticker, ticker)
            existing = get_existing_files(ticker)
            print(f"  Existing large PDFs: {len(existing)}")

            for year in years:
                stats = process_ticker_year(kap, http, kap_ticker, ticker, year, existing)
                for k, v in stats.items():
                    totals[k] += v
                time.sleep(2)
            time.sleep(3)

    except KeyboardInterrupt:
        print(f"\n⚠ Interrupted at {ticker}! Resume with --resume {ticker}")
    finally:
        kap.close()
        http.close()

    print(f"\n{'='*60}")
    print(f"DOWNLOAD SUMMARY")
    print(f"{'='*60}")
    print(f"Financial reports: {totals['financial']}")
    print(f"Activity reports:  {totals['activity']}")
    print(f"Already existed:   {totals['exists']}")
    print(f"Skipped:           {totals['skipped']}")
    print(f"Errors:            {totals['errors']}")


if __name__ == "__main__":
    main()
