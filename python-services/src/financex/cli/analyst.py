"""`financex analyst ...` — broker-consensus aggregator CLI."""

from __future__ import annotations

import json
from datetime import date
from decimal import Decimal
from pathlib import Path

import typer

from financex.calculators.analyst_consensus import aggregate_reports
from financex.schemas.analyst import AnalystReport, Recommendation

analyst_app = typer.Typer(help="analyst_consensus — aggregate broker notes.")


@analyst_app.command("aggregate")
def aggregate(
    fixture: Path = typer.Option(..., "--fixture", "-f", exists=True, help="JSON array of AnalystReport."),
    last_close: str | None = typer.Option(None, "--last-close", help="Used for upside % on consensus."),
) -> None:
    """Read broker reports from a JSON fixture, emit AnalystConsensus as JSON."""
    payload = json.loads(fixture.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        typer.echo("error: fixture must be a JSON array of AnalystReport.", err=True)
        raise typer.Exit(code=2)

    reports: list[AnalystReport] = []
    for item in payload:
        coerced = dict(item)
        if isinstance(coerced.get("report_date"), str):
            coerced["report_date"] = date.fromisoformat(coerced["report_date"])
        if isinstance(coerced.get("recommendation"), str):
            coerced["recommendation"] = Recommendation(coerced["recommendation"].lower())
        reports.append(AnalystReport.model_validate(coerced))

    lc = Decimal(last_close) if last_close else None
    consensus = aggregate_reports(reports, last_close=lc)
    typer.echo(consensus.model_dump_json())

    typer.echo("", err=True)
    typer.echo(
        f"Reports: {consensus.count}  |  Buy/Hold/Sell: "
        f"{consensus.distribution_buy}/{consensus.distribution_hold}/{consensus.distribution_sell}",
        err=True,
    )
    if consensus.target_price_mean is not None:
        typer.echo(
            f"Target mean {consensus.target_price_mean} / median {consensus.target_price_median} "
            f"/ range [{consensus.target_price_low}, {consensus.target_price_high}] "
            f"(σ {consensus.target_price_stddev})",
            err=True,
        )
    if consensus.upside_vs_last_close_pct is not None:
        typer.echo(f"Upside vs last close: {consensus.upside_vs_last_close_pct}%", err=True)
    if consensus.revision_trend:
        typer.echo(f"Revision trend: {consensus.revision_trend}", err=True)
    if consensus.distribution_sell == 0 and (consensus.count or 0) >= 3:
        typer.echo("[flag] crowded long — zero SELL ratings across the sample.", err=True)
