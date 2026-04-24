"""dc_financials sub-agent (deterministic).

FAZ S4/S12 refactor: the original LLM version hung on an 18-minute tool-call
loop trying to re-crawl KAP for the 5Y financial-statement set that the
legacy data_collection path had already fetched. The new approach is a pure
filter over the parent's DataCollectionManifest — zero new network calls,
zero LLM tokens, finishes in <1s.

Contract (argv[1] JSON):
  {
    "ticker": "KCHOL",
    "data_collection_output": "<full legacy manifest JSON string>"
  }

Output: matches schemas/sub-agents/dc_financials_collector.json.

Each financial_report CollectedDocument contributes one StatementEntry to
all four statement arrays (income_statement / balance_sheet / cash_flow /
shareholders_equity). The same source PDF covers all four statements, so
the parsed period_label + doc_id + source_url + local_path are mirrored —
downstream parse_standardization is responsible for splitting the single
PDF into per-statement blocks.
"""

from __future__ import annotations

import json
import re
import sys
from datetime import date
from typing import Any


STATEMENT_TYPES = ("income_statement", "balance_sheet", "cash_flow", "shareholders_equity")


def _normalise_period(doc: dict[str, Any]) -> str | None:
    """Return a fiscal_period label matching the schema pattern
    ^(FY|Q[1-4]_)?[0-9]{4}$ — e.g. "FY2025" or "Q3_2024"."""
    raw = (doc.get("period_label") or "").strip()
    if raw:
        raw = raw.replace("-", "").replace(" ", "")
        m = re.match(r"^(FY)(\d{4})$", raw, flags=re.IGNORECASE)
        if m:
            return f"FY{m.group(2)}"
        m = re.match(r"^Q([1-4])[_]?(\d{4})$", raw, flags=re.IGNORECASE)
        if m:
            return f"Q{m.group(1)}_{m.group(2)}"
    year = doc.get("year")
    if isinstance(year, int):
        return f"FY{year}"
    return None


def _build_entry(doc: dict[str, Any], fiscal_period: str) -> dict[str, Any]:
    doc_id = (
        doc.get("disclosure_id")
        or doc.get("disclosure_index")
        or doc.get("content_sha256")
        or ""
    )
    return {
        "fiscal_period": fiscal_period,
        "doc_id": str(doc_id),
        "source_url": str(doc.get("source_url") or ""),
        "raw_path": str(doc.get("local_path") or ""),
    }


def _extract_financial_reports(payload: Any) -> tuple[list[dict[str, Any]], int | None]:
    """Accept either:
    - Legacy adapter shape: {"data_manifest": {"financial_reports": [...]}, "window": {"until": "..."}}
    - Pure financex manifest:  {"documents": [...], "until": "..."}

    Returns (financial_report docs, window_until_year).
    """
    if not isinstance(payload, dict):
        return [], None

    # Legacy adapter shape
    dm = payload.get("data_manifest")
    if isinstance(dm, dict):
        reports = dm.get("financial_reports")
        if isinstance(reports, list):
            window = payload.get("window", {}) or {}
            until = window.get("until")
            year = _extract_year(until)
            # Entries already filtered by the adapter — keep them as-is.
            return [r for r in reports if isinstance(r, dict)], year

    # Pure financex manifest shape
    docs = payload.get("documents")
    if isinstance(docs, list):
        year = _extract_year(payload.get("until"))
        return (
            [d for d in docs if isinstance(d, dict) and d.get("kind") == "financial_report"],
            year,
        )

    return [], None


def _extract_year(value: Any) -> int | None:
    if isinstance(value, str) and len(value) >= 4:
        try:
            return int(value[:4])
        except ValueError:
            return None
    return None


def run(ticker: str, manifest_json: str) -> dict[str, Any]:
    ticker_upper = ticker.upper()
    empty: dict[str, list[Any]] = {k: [] for k in STATEMENT_TYPES}

    if not manifest_json.strip():
        return {
            "ticker": ticker_upper,
            "statements": empty,
            "missing_periods": [],
            "data_quality_flags": ["no_data_collection_output_provided"],
        }

    try:
        payload = json.loads(manifest_json)
    except json.JSONDecodeError as err:
        return {
            "ticker": ticker_upper,
            "statements": empty,
            "missing_periods": [],
            "data_quality_flags": [f"manifest_parse_error: {err}"],
        }

    fin_docs, window_until_year = _extract_financial_reports(payload)

    statements: dict[str, list[dict[str, Any]]] = {k: [] for k in STATEMENT_TYPES}
    periods_seen: set[str] = set()
    quality_flags: list[str] = []

    for doc in fin_docs:
        fiscal_period = _normalise_period(doc)
        if fiscal_period is None:
            quality_flags.append(
                f"period_unresolved: disclosure_id={doc.get('disclosure_id') or doc.get('disclosure_index')}"
            )
            continue
        periods_seen.add(fiscal_period)
        entry = _build_entry(doc, fiscal_period)
        for stmt_type in STATEMENT_TYPES:
            statements[stmt_type].append(entry)

    # Expected 5Y FY window: (window_until_year - 4) .. window_until_year.
    ref_year = window_until_year or date.today().year
    expected_years = {ref_year - i for i in range(5)}
    present_years = {int(p[2:]) for p in periods_seen if p.startswith("FY") and p[2:].isdigit()}
    missing_periods = sorted(f"FY{y}" for y in expected_years - present_years)

    if not fin_docs:
        quality_flags.append("no_financial_reports_in_manifest")

    return {
        "ticker": ticker_upper,
        "statements": statements,
        "missing_periods": missing_periods,
        "data_quality_flags": quality_flags,
    }


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing input argv[1]"}), file=sys.stderr)
        sys.exit(1)
    try:
        inputs = json.loads(sys.argv[1])
    except json.JSONDecodeError as err:
        print(json.dumps({"error": f"input JSON parse: {err}"}), file=sys.stderr)
        sys.exit(1)

    ticker = inputs.get("ticker")
    if not ticker or not isinstance(ticker, str):
        print(json.dumps({"error": "ticker required"}), file=sys.stderr)
        sys.exit(1)

    dc_output = inputs.get("data_collection_output") or ""
    if not isinstance(dc_output, str):
        dc_output = json.dumps(dc_output)

    result = run(ticker, dc_output)
    print(json.dumps(result, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
