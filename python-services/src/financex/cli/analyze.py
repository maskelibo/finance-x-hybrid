"""`financex analyze ...` — financial analysis hybrid runner CLI."""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import typer

from financex.calculators.financial_analysis import analyze_financials
from financex.calculators.financial_engine import compute_for_period
from financex.parsers.financial_statements import parse_kap_pdf

analyze_app = typer.Typer(help="financial_analysis — hybrid (Python engine + LLM-ready package).")


@analyze_app.command("pdf")
def from_pdf(
    pdf_path: Path = typer.Argument(..., exists=True),
    ticker: str = typer.Option(..., "--ticker", "-t"),
    market_cap: str | None = typer.Option(None, "--market-cap", help="Market cap in TL."),
    shares_outstanding: str | None = typer.Option(None, "--shares", help="Shares outstanding."),
) -> None:
    """Parse → engine → analyze in one shot. Emits FinancialAnalysisOutput JSON."""
    parsed = parse_kap_pdf(pdf_path)
    engine = compute_for_period(
        parsed.period,
        market_cap=Decimal(market_cap) if market_cap else None,
        shares_outstanding=Decimal(shares_outstanding) if shares_outstanding else None,
    )
    result = analyze_financials(parsed.period, engine, ticker=ticker.upper())
    typer.echo(result.model_dump_json())
    typer.echo("", err=True)
    typer.echo(
        f"[{result.ticker} {result.period_label}] sector={result.sector.value} "
        f"{len(result.highlights)} highlights, {len(result.red_flags)} red flags",
        err=True,
    )
    for f in result.red_flags:
        typer.echo(f"  [{f.severity:8s}] {f.code}: {f.message}", err=True)
