"""`financex macro ...` — macro_analysis CLI."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import typer

from financex.calculators.macro_analysis import MacroInputs, analyze_macro
from financex.calculators.transmission import CompanyExposure, MacroShift

macro_app = typer.Typer(help="macro_analysis — TCMB FX + transmission arithmetic.")


@macro_app.command("snapshot")
def snapshot(
    as_of: str | None = typer.Option(None, "--as-of", help="ISO date; defaults to today."),
) -> None:
    """Pull the TCMB FX bulletin and print it as JSON."""
    from financex.calculators.macro_analysis import build_snapshot

    target = date.fromisoformat(as_of) if as_of else None
    snap = build_snapshot(MacroInputs(), as_of=target)
    typer.echo(snap.model_dump_json())


@macro_app.command("analyze")
def analyze(
    ticker: str = typer.Argument(..., help="BIST ticker."),
    fx_net_short_try: str = typer.Option("0", "--fx-exposure", help="USD short TRY-equivalent."),
    rate_sensitive_debt: str = typer.Option("0", "--rate-debt", help="TRY-denominated variable-rate debt."),
    energy_barrels: str = typer.Option("0", "--energy-bbl", help="Annual barrel-equivalent consumption."),
    commodity_tons: str = typer.Option("0", "--commodity-tons", help="Annual sector-commodity tonnage."),
    commodity_base: str = typer.Option("0", "--commodity-price", help="Baseline TRY price per ton."),
    tax_rate: str = typer.Option("0.25", "--tax"),
    fx_shift_pct: str = typer.Option("0.10", "--fx-shift", help="TRY depreciation pct (0.10 = 10%)."),
    rate_shift_bp: str = typer.Option("500", "--rate-shift", help="Policy rate change in bps."),
    brent_shift_usd: str = typer.Option("5", "--brent-shift", help="$ per barrel change."),
    commodity_shift_pct: str = typer.Option("0.05", "--commodity-shift"),
    policy_rate: str | None = typer.Option(None, "--policy-rate"),
    cpi_yoy: str | None = typer.Option(None, "--cpi"),
    ppi_yoy: str | None = typer.Option(None, "--ppi"),
    gdp_yoy: str | None = typer.Option(None, "--gdp"),
) -> None:
    """Full macro snapshot + company-specific transmission impact."""
    exposure = CompanyExposure(
        fx_usd_net_short_try=Decimal(fx_net_short_try),
        rate_sensitive_debt_try=Decimal(rate_sensitive_debt),
        energy_barrels_per_year=Decimal(energy_barrels),
        commodity_tonnage_per_year=Decimal(commodity_tons),
        tax_rate=Decimal(tax_rate),
    )
    shift = MacroShift(
        usd_try_pct_change=Decimal(fx_shift_pct),
        policy_rate_bp_change=Decimal(rate_shift_bp),
        brent_usd_change=Decimal(brent_shift_usd),
        sector_commodity_pct_change=Decimal(commodity_shift_pct),
    )
    inputs = MacroInputs(
        tcmb_policy_rate=Decimal(policy_rate) if policy_rate else None,
        cpi_yoy=Decimal(cpi_yoy) if cpi_yoy else None,
        ppi_yoy=Decimal(ppi_yoy) if ppi_yoy else None,
        gdp_yoy=Decimal(gdp_yoy) if gdp_yoy else None,
    )
    result = analyze_macro(
        ticker,
        exposure,
        inputs,
        shift,
        commodity_baseline_price_try_per_ton=Decimal(commodity_base),
    )
    typer.echo(result.model_dump_json())
