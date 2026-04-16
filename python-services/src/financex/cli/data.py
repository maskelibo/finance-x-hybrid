"""`financex data ...` — data_collection CLI."""

from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

import typer

from financex.calculators.data_collection import run_data_collection

data_app = typer.Typer(help="data_collection — fetch KAP disclosures + pull PDFs.")


@data_app.command("collect")
def collect(
    ticker: str = typer.Argument(..., help="BIST ticker, e.g. KCHOL."),
    years: int = typer.Option(
        6,
        "--years",
        "-y",
        min=1,
        max=15,
        help="How many years of history to fetch (approximate — uses calendar years).",
    ),
    since: str | None = typer.Option(
        None,
        "--since",
        "-s",
        help="Explicit ISO date lower bound. Overrides --years.",
    ),
    until: str | None = typer.Option(None, "--until", "-u"),
    pdf_dir: Path = typer.Option(
        Path("../output/pdfs"),
        "--pdf-dir",
        help="Where to land downloaded PDFs (relative to python-services/).",
    ),
    kinds: str = typer.Option(
        "financial_report,activity_report",
        "--kinds",
        help="Comma-separated list of document kinds to download.",
    ),
) -> None:
    """Fetch and archive disclosures, emit a DataCollectionManifest as JSON on stdout."""
    if since:
        since_date = date.fromisoformat(since)
    else:
        today = date.today()
        since_date = date(today.year - years, today.month, today.day)
    until_date = date.fromisoformat(until) if until else None

    kinds_tuple = tuple(k.strip() for k in kinds.split(",") if k.strip())

    manifest = run_data_collection(
        ticker.upper(),
        since=since_date,
        until=until_date,
        pdf_dir=pdf_dir.resolve(),
        kinds_to_download=kinds_tuple,
    )
    typer.echo(manifest.model_dump_json())
