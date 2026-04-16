"""`financex esg ...` — CBAM / ETS cost CLI."""

from __future__ import annotations

from decimal import Decimal

import typer

from financex.calculators.esg import CbamInputs, analyze_esg

esg_app = typer.Typer(help="esg — CBAM / ETS deterministic cost estimates.")


@esg_app.command("cbam")
def cbam(
    ticker: str = typer.Argument(..., help="BIST ticker, e.g. EREGL."),
    scope1: str = typer.Option(..., "--scope1", help="Annual Scope 1 emissions in tCO2."),
    carbon_price: str = typer.Option("85", "--carbon-price", help="EUR per tCO2 (EU ETS)."),
    free_allowance: str = typer.Option("0.5", "--free", help="ETS free allowance fraction (0-1)."),
    cbam_coverage: str = typer.Option("0.485", "--cbam-coverage", help="CBAM phase-in fraction for the year."),
    product_tonnage: str | None = typer.Option(None, "--product-tons"),
    default_intensity: str | None = typer.Option(None, "--default-intensity"),
    eur_try: str | None = typer.Option(None, "--eur-try", help="For TRY conversion."),
    sector: str = typer.Option("steel", "--sector"),
    notes: str | None = typer.Option(None, "--notes"),
) -> None:
    """Compute CBAM + ETS annual carbon cost for a ticker."""
    inputs = CbamInputs(
        scope1_tco2=Decimal(scope1),
        carbon_price_eur_per_t=Decimal(carbon_price),
        ets_free_allowance_pct=Decimal(free_allowance),
        cbam_coverage_pct=Decimal(cbam_coverage),
        product_tonnage=Decimal(product_tonnage) if product_tonnage else None,
        cbam_default_intensity=Decimal(default_intensity) if default_intensity else None,
        eur_try=Decimal(eur_try) if eur_try else None,
    )
    result = analyze_esg(ticker, sector_hint=sector, cbam_inputs=inputs, notes=notes)
    typer.echo(result.model_dump_json())
    br = result.cbam
    if br:
        typer.echo(
            f"\n[{ticker}] Scope1 {br.scope1_tco2:,} tCO2 @ €{br.carbon_price_eur_per_t}/t",
            err=True,
        )
        typer.echo(f"  ETS   annual: €{br.ets_annual_cost_eur:,}", err=True)
        typer.echo(f"  CBAM  annual: €{br.cbam_annual_cost_eur:,}", err=True)
        typer.echo(f"  TOTAL annual: €{br.total_annual_cost_eur:,}", err=True)
        if br.total_annual_cost_try is not None:
            typer.echo(f"                ₺{br.total_annual_cost_try:,}", err=True)
