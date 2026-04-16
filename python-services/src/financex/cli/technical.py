"""`financex technical ...` — technical indicators CLI."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import typer

from financex.calculators.technical import compute_technical
from financex.schemas.market import OhlcvBar

technical_app = typer.Typer(help="technical_analysis — indicators from OHLCV bars.")


@technical_app.command("analyze")
def analyze(
    input_file: Path = typer.Option(
        Path("-"),
        "--in",
        "-i",
        help="Path to JSON list of OhlcvBar. '-' reads from stdin.",
    ),
) -> None:
    """Read OHLCV bars, emit TechnicalIndicators as JSON."""
    raw = sys.stdin.read() if str(input_file) == "-" else input_file.read_text(encoding="utf-8")
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        typer.echo(f"error: invalid JSON input: {exc}", err=True)
        raise typer.Exit(code=2) from exc

    if not isinstance(payload, list):
        typer.echo("error: input must be a JSON array of OHLCV bars.", err=True)
        raise typer.Exit(code=2)

    bars = [OhlcvBar.model_validate(item) for item in payload]
    indicators = compute_technical(bars)
    typer.echo(indicators.model_dump_json())


@technical_app.command("fetch")
def fetch(
    ticker: str = typer.Argument(..., help="BIST ticker, e.g. KCHOL."),
    exchange: str = typer.Option("BIST", "--exchange", "-e"),
    interval: str = typer.Option(
        "daily", "--interval", "-i", help="1m | 5m | 15m | 30m | 1h | daily | weekly | monthly"
    ),
    n_bars: int = typer.Option(365, "--bars", "-n", min=20, max=5000),
    output: str = typer.Option(
        "indicators",
        "--output",
        "-o",
        help="'indicators' → emit TechnicalIndicators (default). "
        "'bars' → emit raw OHLCV list.",
    ),
) -> None:
    """Fetch bars (TradingView primary → yfinance fallback) and emit bars or indicators."""
    from financex.crawlers.tradingview import (
        TradingViewFetchParams,
        build_default_ohlcv_client,
    )

    client = build_default_ohlcv_client()
    bars = client.fetch(
        TradingViewFetchParams(
            symbol=ticker.upper(), exchange=exchange, interval=interval, n_bars=n_bars
        )
    )
    if not bars:
        typer.echo(
            f"error: no data returned for {exchange}:{ticker} from either TradingView or yfinance",
            err=True,
        )
        raise typer.Exit(code=3)

    source = getattr(client, "last_source", "unknown")
    typer.echo(f"[tv] source={source} bars={len(bars)}", err=True)

    if output == "bars":
        typer.echo(json.dumps([b.model_dump(mode="json") for b in bars], default=str))
    elif output == "indicators":
        indicators = compute_technical(bars)
        typer.echo(indicators.model_dump_json())
    else:
        typer.echo(f"error: unknown --output {output!r} (expected 'bars' or 'indicators')", err=True)
        raise typer.Exit(code=2)
