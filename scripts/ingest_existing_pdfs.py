"""
U4 — Batch ingestion pipeline for existing BIST30 PDF corpus.

Scans output/bist30/ and output/archive/, parses filename + folder metadata,
and idempotently ingests each PDF into the per-ticker Qdrant collection.

Usage (run from repo root):
    python-services/.venv/Scripts/python.exe scripts/ingest_existing_pdfs.py [flags]

Flags:
    --ticker TICKER    Only ingest files for this ticker (repeatable)
    --root PATH        Add a root to scan (default: output/bist30 + output/archive)
    --limit N          Cap total files processed in this run
    --dry-run          Print what would be ingested, do not touch Qdrant
    --force            Re-ingest even if doc_id is already in checkpoint
    --state PATH       Checkpoint file (default: _qdrant/.ingest_state.json)
    --skip-archive     Skip output/archive (bist30 only)
    --skip-bist30      Skip output/bist30 (archive only)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable, Optional

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "python-services" / "src"))

from financex.document_intel.ingest import ingest_pdf  # noqa: E402
from financex.document_intel.embedding import get_default_embedder  # noqa: E402


# --- Filename → metadata -----------------------------------------------------

KNOWN_TICKERS = {
    "AKBNK", "ARCLK", "ASELS", "BIMAS", "EKGYO", "ENKAI", "EREGL", "TUPRS",
    "THYAO", "TCELL", "KCHOL", "SISE", "SAHOL", "GARAN", "ISCTR", "YKBNK",
    "VAKBN", "HALKB", "PETKM", "FROTO", "TOASO", "KOZAL", "KOZAA", "PGSUS",
    "DOHOL", "TTKOM", "MGROS", "BIST100", "XU030",
}

ARCHIVE_TYPE_HINTS = {
    "Yonetim_Kurulu_Raporu": "board_report",
    "YONETIM_RAPORU": "board_report",
    "V4_Final": "board_report",
    "V4_Reformat": "board_report",
    "Yönetim_Kurulu_Sunumu": "board_presentation",
    "Entegre_Faaliyet_Raporu": "integrated_annual",
    "ROBOT_ANALIZ": "analyst_note",
    "ATA_YATIRIM": "analyst_note",
}


@dataclass
class PdfMeta:
    pdf_path: str
    ticker: str
    doc_id: str
    doc_type: str
    fiscal_period: str
    source: str  # "bist30" or "archive"

    def as_dict(self) -> dict:
        return asdict(self)


def _parse_date_yyyymmdd(s: str) -> Optional[str]:
    m = re.search(r"(20\d{2})(\d{2})(\d{2})", s)
    if not m:
        return None
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"


def _parse_year_only(s: str) -> Optional[str]:
    m = re.search(r"(20\d{2})", s)
    return m.group(1) if m else None


def _fiscal_from_folder(quarter_folder: str, year_folder: str) -> str:
    """'Q1-2021' → 'Q1-2021'; 'OTHER' → 'FY-{year}'."""
    q = quarter_folder.strip()
    if q.upper() == "OTHER":
        return f"FY-{year_folder}"
    return q


def _archive_doc_type(stem: str) -> str:
    low = stem.lower()
    for key, val in ARCHIVE_TYPE_HINTS.items():
        if key.lower() in low:
            return val
    return "misc"


def _archive_ticker(stem: str) -> Optional[str]:
    # Token-level scan — pick first KNOWN_TICKERS match
    tokens = re.split(r"[_\-\. ]+", stem)
    for tok in tokens:
        up = tok.upper()
        if up in KNOWN_TICKERS:
            return up
    return None


def parse_bist30_path(pdf_path: Path, root: Path) -> Optional[PdfMeta]:
    """output/bist30/{TICKER}/{YEAR}/{QUARTER|OTHER}/{filename}.pdf"""
    try:
        rel = pdf_path.relative_to(root)
    except ValueError:
        return None
    parts = rel.parts  # e.g., ('AKBNK', '2021', 'Q1-2021', 'AKBNK_activity_report_20210302_914620.pdf')
    if len(parts) < 4:
        return None
    ticker, year, quarter, fname = parts[0], parts[1], parts[2], parts[-1]
    stem = Path(fname).stem
    # filename shape: {TICKER}_{doc_type}_{YYYYMMDD}_{kap_id}
    m = re.match(r"^[A-Z0-9]+_(activity_report|financial_report)_(\d{8})_(\d+)$", stem)
    if not m:
        return None
    doc_type = m.group(1)
    fiscal = _fiscal_from_folder(quarter, year)
    return PdfMeta(
        pdf_path=str(pdf_path),
        ticker=ticker.upper(),
        doc_id=stem,  # stable, collision-free across folders
        doc_type=doc_type,
        fiscal_period=fiscal,
        source="bist30",
    )


def parse_archive_path(pdf_path: Path) -> Optional[PdfMeta]:
    stem = pdf_path.stem
    ticker = _archive_ticker(stem)
    if not ticker:
        return None
    doc_type = _archive_doc_type(stem)
    # fiscal: prefer YYYYMMDD → year else any 4-digit year
    date = _parse_date_yyyymmdd(stem)
    year = date.split("-")[0] if date else _parse_year_only(stem)
    fiscal = f"FY-{year}" if year else "FY-UNKNOWN"
    return PdfMeta(
        pdf_path=str(pdf_path),
        ticker=ticker,
        doc_id=stem,
        doc_type=doc_type,
        fiscal_period=fiscal,
        source="archive",
    )


def scan_bist30(root: Path) -> Iterable[PdfMeta]:
    if not root.exists():
        return
    for pdf in sorted(root.rglob("*.pdf")):
        meta = parse_bist30_path(pdf, root)
        if meta:
            yield meta


def scan_archive(root: Path) -> Iterable[PdfMeta]:
    if not root.exists():
        return
    for pdf in sorted(root.glob("*.pdf")):
        meta = parse_archive_path(pdf)
        if meta:
            yield meta


# --- Checkpoint --------------------------------------------------------------

def load_state(path: Path) -> dict:
    if not path.exists():
        return {"version": 1, "ingested": {}}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"version": 1, "ingested": {}}


def save_state(path: Path, state: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


# --- Main --------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ticker", action="append", default=[])
    ap.add_argument("--root", action="append", default=[])
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--state", default=str(REPO_ROOT / "_qdrant" / ".ingest_state.json"))
    ap.add_argument("--skip-archive", action="store_true")
    ap.add_argument("--skip-bist30", action="store_true")
    ap.add_argument("--qdrant-url", default="http://localhost:6333")
    args = ap.parse_args()

    state_path = Path(args.state)
    state = load_state(state_path)
    ingested: dict = state.setdefault("ingested", {})

    metas: list[PdfMeta] = []
    if not args.skip_bist30:
        metas.extend(scan_bist30(REPO_ROOT / "output" / "bist30"))
    if not args.skip_archive:
        metas.extend(scan_archive(REPO_ROOT / "output" / "archive"))
    for extra in args.root:
        p = Path(extra).resolve()
        if p.is_dir():
            metas.extend(scan_archive(p))

    # ticker filter
    if args.ticker:
        wanted = {t.upper() for t in args.ticker}
        metas = [m for m in metas if m.ticker in wanted]

    total = len(metas)
    skipped_ingested = 0
    todo: list[PdfMeta] = []
    for m in metas:
        if not args.force and m.doc_id in ingested:
            skipped_ingested += 1
            continue
        todo.append(m)

    if args.limit > 0:
        todo = todo[: args.limit]

    # Breakdown
    per_ticker: dict[str, int] = {}
    for m in todo:
        per_ticker[m.ticker] = per_ticker.get(m.ticker, 0) + 1

    print(f"scanned={total}  already_ingested={skipped_ingested}  pending={len(todo)}", flush=True)
    print(f"per_ticker(pending)={json.dumps(per_ticker, ensure_ascii=False)}", flush=True)

    if args.dry_run:
        for m in todo[:25]:
            print(f"  [dry] {m.ticker}  {m.doc_type:<22}  {m.fiscal_period:<12}  {m.doc_id}")
        if len(todo) > 25:
            print(f"  ... (+{len(todo) - 25} more)")
        return 0

    if not todo:
        print("nothing to ingest.", flush=True)
        return 0

    # Warm embedder once (cached across files)
    embedder = get_default_embedder()
    print(f"embedder: {embedder.name}  dim={embedder.dim}", flush=True)

    ok = 0
    failed = 0
    total_chunks = 0
    t0 = time.time()
    for i, m in enumerate(todo, start=1):
        started = time.time()
        try:
            res = ingest_pdf(
                pdf_path=Path(m.pdf_path),
                ticker=m.ticker,
                doc_id=m.doc_id,
                doc_type=m.doc_type,
                fiscal_period=m.fiscal_period,
                qdrant_url=args.qdrant_url,
                embedder=embedder,
            )
            status = res.get("status", "unknown")
            chunks = res.get("chunks", 0)
            total_chunks += chunks
            elapsed = time.time() - started
            print(
                f"[{i}/{len(todo)}] {status:<7}  {m.ticker}  {m.doc_type:<20}  "
                f"{m.fiscal_period:<12}  chunks={chunks:<4}  {elapsed:5.1f}s  {m.doc_id}",
                flush=True,
            )
            if status in ("success", "empty"):
                ingested[m.doc_id] = {
                    "ticker": m.ticker,
                    "doc_type": m.doc_type,
                    "fiscal_period": m.fiscal_period,
                    "chunks": chunks,
                    "status": status,
                    "pdf_path": m.pdf_path,
                    "ingested_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                }
                ok += 1
            else:
                failed += 1
                print(f"    error: {res.get('error')}", flush=True)
        except Exception as exc:  # keep batch resilient
            failed += 1
            print(f"[{i}/{len(todo)}] FAIL    {m.ticker}  {m.doc_id}  {exc}", flush=True)

        # Flush checkpoint every 5 files to survive crashes
        if i % 5 == 0:
            save_state(state_path, state)

    save_state(state_path, state)
    dt = time.time() - t0
    print(
        f"\nDONE  ok={ok}  failed={failed}  total_chunks={total_chunks}  elapsed={dt:.1f}s",
        flush=True,
    )
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
