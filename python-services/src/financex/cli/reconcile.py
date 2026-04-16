"""`financex reconcile ...` — math-consistency CLI."""

from __future__ import annotations

from pathlib import Path

import typer

from financex.calculators.reconciliation import run_reconciliation
from financex.parsers.financial_statements import parse_kap_pdf

reconcile_app = typer.Typer(help="reconciliation — deterministic math checks on a PeriodFinancials.")


@reconcile_app.command("pdf")
def from_pdf(
    pdf_path: Path = typer.Argument(..., exists=True, file_okay=True),
    ticker: str | None = typer.Option(None, "--ticker", "-t"),
) -> None:
    """Parse a KAP PDF + run reconciliation checks. Emit report JSON on stdout."""
    parsed = parse_kap_pdf(pdf_path)
    report = run_reconciliation(parsed.period, ticker=ticker)
    typer.echo(report.model_dump_json())
    # Human summary on stderr.
    typer.echo("", err=True)
    typer.echo(
        f"[{report.ticker or '-'} {report.period_label}] "
        f"{'PASS' if report.all_passed else 'FAIL'} — "
        f"{sum(1 for c in report.checks if c.passed)}/{len(report.checks)} checks passed",
        err=True,
    )
    for c in report.checks:
        tick = "✓" if c.passed else "✗"
        typer.echo(f"  {tick} {c.code}: {c.message}", err=True)
