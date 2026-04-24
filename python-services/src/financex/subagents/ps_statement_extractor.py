"""ps_statement_extractor sub-agent (deterministic).

Wraps the existing `parsers.financial_statements.parse_kap_pdf` so the
backend dispatcher can call it as a standalone Python entry point.
Emits one serialized block per input PDF.
"""

from __future__ import annotations

import json
import sys
from decimal import Decimal
from pathlib import Path
from typing import Any

from financex.parsers.financial_statements import detect_sector, parse_kap_pdf


def _to_jsonable(val: Any) -> Any:
    if isinstance(val, Decimal):
        return float(val)
    if hasattr(val, "isoformat"):
        return val.isoformat()
    if isinstance(val, dict):
        return {k: _to_jsonable(v) for k, v in val.items()}
    if isinstance(val, list):
        return [_to_jsonable(v) for v in val]
    return val


def _parsed_to_dict(parsed) -> dict:
    """Best-effort serialisation of a ParsedFinancials object.

    We don't hard-depend on the schema fields — anything that model_dump()
    yields gets serialised; anything else falls back to __dict__ coercion.
    """
    if hasattr(parsed, "model_dump"):
        return _to_jsonable(parsed.model_dump())
    if hasattr(parsed, "__dict__"):
        return {k: _to_jsonable(v) for k, v in vars(parsed).items() if not k.startswith("_")}
    return {}


def run(ticker: str, pdf_paths: list[str]) -> dict:
    statements_by_period: list[dict] = []
    parse_errors: list[dict] = []

    for pdf_path_str in pdf_paths:
        pdf_path = Path(pdf_path_str)
        if not pdf_path.exists():
            parse_errors.append({"pdf": pdf_path_str, "error": "file not found"})
            continue
        try:
            sector = detect_sector(pdf_path)
            parsed = parse_kap_pdf(pdf_path, sector=sector)
            block = _parsed_to_dict(parsed)
            block["source_pdf"] = pdf_path_str
            block["sector_detected"] = str(sector.value) if hasattr(sector, "value") else str(sector)
            # Surface fiscal_period if the parsed model exposes one.
            block.setdefault("fiscal_period", block.get("period_label") or block.get("as_of") or "UNKNOWN")
            statements_by_period.append(block)
        except Exception as err:  # noqa: BLE001
            parse_errors.append({"pdf": pdf_path_str, "error": str(err)})

    return {
        "ticker": ticker,
        "statements_by_period": statements_by_period,
        "parse_errors": parse_errors,
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
    pdf_paths = inputs.get("pdf_paths", [])
    if not ticker or not isinstance(ticker, str):
        print(json.dumps({"error": "ticker required"}), file=sys.stderr)
        sys.exit(1)
    if not isinstance(pdf_paths, list):
        print(json.dumps({"error": "pdf_paths must be an array"}), file=sys.stderr)
        sys.exit(1)

    result = run(ticker.upper(), pdf_paths)
    print(json.dumps(result, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
