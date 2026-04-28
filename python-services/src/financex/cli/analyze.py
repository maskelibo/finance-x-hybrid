"""`financex analyze ...` — financial analysis hybrid runner CLI."""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import typer

from financex.calculators.financial_analysis import (
    analyze_financials,
    analyze_multi_pdf,
    collect_annual_periods,
)
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
    # Phase 7 — pass prior_period (from comparative columns) as historical
    historical = [parsed.prior_period] if parsed.prior_period else None
    result = analyze_financials(
        parsed.period, engine, ticker=ticker.upper(), historical=historical,
    )
    typer.echo(result.model_dump_json())
    typer.echo("", err=True)
    typer.echo(
        f"[{result.ticker} {result.period_label}] sector={result.sector.value} "
        f"{len(result.highlights)} highlights, {len(result.red_flags)} red flags",
        err=True,
    )
    for f in result.red_flags:
        typer.echo(f"  [{f.severity:8s}] {f.code}: {f.message}", err=True)


@analyze_app.command("multi-pdf")
def from_multi_pdf(
    pdf_paths: list[Path] = typer.Argument(..., help="Paths to historical KAP financial-report PDFs (chronological order)."),
    ticker: str = typer.Option(..., "--ticker", "-t"),
    market_cap: str | None = typer.Option(None, "--market-cap"),
    shares_outstanding: str | None = typer.Option(None, "--shares"),
) -> None:
    """Phase 7 FULL — parse multiple historical KAP PDFs, dedupe annual
    periods, and emit a FinancialAnalysisOutput whose canonical_numbers
    embed __historical__: {FY-YYYY: {...}} for every distinct annual
    year extracted (interim Q1/H1/Q3 rejected).

    Three consecutive annual filings each yielding 2 periods (current
    + prior column) → 6 unique years (FY2020-FY2025), satisfying the
    directive's 5-year-minimum requirement.
    """
    parsed_results = [parse_kap_pdf(p) for p in pdf_paths]
    annual_by_year = collect_annual_periods(parsed_results)
    if not annual_by_year:
        typer.echo("ERROR: no annual periods extractable from supplied PDFs", err=True)
        raise typer.Exit(code=2)
    # Compute engine for every annual year that survived dedup
    market_cap_dec = Decimal(market_cap) if market_cap else None
    shares_dec = Decimal(shares_outstanding) if shares_outstanding else None
    engines = {
        year: compute_for_period(pf, market_cap=market_cap_dec, shares_outstanding=shares_dec)
        for year, pf in annual_by_year.items()
    }
    result = analyze_multi_pdf(parsed_results, engines, ticker=ticker.upper())
    typer.echo(result.model_dump_json())
    typer.echo("", err=True)
    historical = result.canonical_numbers.get("__historical__", {})
    historical_keys = sorted(historical.keys()) if isinstance(historical, dict) else []
    typer.echo(
        f"[{result.ticker} multi-pdf] current={result.period_label} "
        f"historical=[{', '.join(historical_keys)}] "
        f"total_annual_periods={1 + len(historical_keys)}",
        err=True,
    )
    if 1 + len(historical_keys) < 5:
        typer.echo(
            f"WARNING: only {1 + len(historical_keys)} annual period(s) — directive requires "
            f"5Y FY2021-FY2025 for full board-grade trend analysis. Report layer will "
            f"suppress 5Y chart and surface 'missing official annual coverage' notice.",
            err=True,
        )
