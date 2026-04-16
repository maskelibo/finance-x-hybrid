"""`financex parse ...` — pdf_standardization CLI."""

from __future__ import annotations

from pathlib import Path

import typer

from financex.parsers.financial_statements import parse_kap_pdf

parse_app = typer.Typer(help="parse_standardization — KAP PDF → standard IFRS period.")


@parse_app.command("financials")
def financials(
    pdf_path: Path = typer.Argument(..., exists=True, file_okay=True, help="Path to a KAP financial-report PDF."),
) -> None:
    """Parse a KAP financial-report PDF, emit a PeriodFinancials on stdout."""
    result = parse_kap_pdf(pdf_path)
    typer.echo(result.period.model_dump_json())
    # Flags + diagnostics go to stderr so Node's stdout pipe stays JSON-clean.
    if result.flags:
        typer.echo(f"[parse] {len(result.flags)} flag(s):", err=True)
        for f in result.flags:
            typer.echo(f"  - [{f.severity}] {f.code}: {f.message}", err=True)
    typer.echo(
        f"[parse] tables_seen={result.tables_seen}, current_period_end={result.current_period_end}",
        err=True,
    )
