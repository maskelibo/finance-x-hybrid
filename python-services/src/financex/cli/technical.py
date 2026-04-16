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
