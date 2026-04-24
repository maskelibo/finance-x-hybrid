"""dc_market_profile sub-agent (deterministic).

Fetches 5Y OHLCV using the existing TradingView → yfinance fallback client,
emits a JSON blob matching schemas/sub-agents/dc_market_profile_collector.json.

Market cap / shares outstanding / free float are best-effort: TradingView
exposes them inconsistently for BIST tickers, so we accept null when the
primary path doesn't yield them. Dividend history is deferred (empty array)
until the KAP dividend crawler is wired in a later phase.
"""

from __future__ import annotations

import json
import sys
from decimal import Decimal
from typing import Any

from financex.crawlers.tradingview import (
    TradingViewFetchParams,
    build_default_ohlcv_client,
)

# BIST30 membership lookup. Kept inline — small, read-only, easier to audit
# than a YAML dependency for a single constant.
BIST30: set[str] = {
    "AKBNK", "AKSEN", "ASELS", "BIMAS", "EKGYO", "EREGL", "FROTO", "GARAN",
    "HALKB", "ISCTR", "KCHOL", "KRDMD", "KOZAL", "MGROS", "PETKM", "PGSUS",
    "SAHOL", "SASA", "SISE", "TAVHL", "TCELL", "THYAO", "TOASO", "TUPRS",
    "ULKER", "VAKBN", "YKBNK",
}


def _to_jsonable(val: Any) -> Any:
    if isinstance(val, Decimal):
        return float(val)
    return val


def _bars_to_json(bars) -> list[dict]:
    return [
        {
            "date": b.date.isoformat() if hasattr(b.date, "isoformat") else str(b.date),
            "open": _to_jsonable(b.open),
            "high": _to_jsonable(b.high),
            "low": _to_jsonable(b.low),
            "close": _to_jsonable(b.close),
            "volume": _to_jsonable(b.volume),
        }
        for b in bars
    ]


def _index_membership(ticker: str) -> list[str]:
    """Return BIST indices the ticker is a member of.

    Only BIST30 is tracked here; BIST100 membership requires a canonical list
    that lives outside this module.
    """
    out: list[str] = []
    if ticker in BIST30:
        out.append("BIST30")
    return out


def run(ticker: str, n_bars: int = 1260) -> dict:
    """Main entry point — parameterized so tests can call it directly."""
    client = build_default_ohlcv_client()
    params = TradingViewFetchParams(symbol=ticker, exchange="BIST", interval="daily", n_bars=n_bars)
    try:
        bars = client.fetch(params)
    except Exception as err:  # noqa: BLE001 — tight boundary, everything is schema-safe below
        bars = []
        fetch_error = str(err)
    else:
        fetch_error = None

    output = {
        "ticker": ticker,
        "ohlcv_5y": _bars_to_json(bars),
        "market_cap_try_mn": None,
        "shares_outstanding_mn": None,
        "free_float_pct": None,
        "dividend_history": [],
        "borsa_istanbul_index_membership": _index_membership(ticker),
    }
    if fetch_error:
        output["data_quality_flags"] = [f"ohlcv_fetch_error: {fetch_error}"]
    return output


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
        print(json.dumps({"error": "ticker required in input"}), file=sys.stderr)
        sys.exit(1)

    # Default to ~5 years of daily bars
    n_bars = int(inputs.get("n_bars") or 1260)

    result = run(ticker.upper(), n_bars=n_bars)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
