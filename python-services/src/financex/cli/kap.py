"""`financex kap ...` — KAP disclosure fetcher CLI."""

from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path
from typing import Any

import typer

from financex.calculators.kap_watch import run_kap_watch
from financex.crawlers.kap import HttpKapClient, MockKapClient, RawDisclosure

kap_app = typer.Typer(help="kap_watch — fetch KAP disclosures for a ticker.")


def _coerce_raw_disclosure(item: dict[str, Any]) -> RawDisclosure:
    """Fixture JSON → RawDisclosure. Parses ISO datetime strings."""
    coerced = dict(item)
    announced = coerced.get("announced_at")
    if isinstance(announced, str):
        coerced["announced_at"] = datetime.fromisoformat(announced.replace("Z", "+00:00"))
    return RawDisclosure(**coerced)


@kap_app.command("watch")
def watch(
    ticker: str = typer.Argument(..., help="BIST ticker, e.g. KCHOL."),
    since: str = typer.Option(..., "--since", "-s", help="ISO date lower bound, e.g. 2026-01-01."),
    until: str | None = typer.Option(None, "--until", "-u", help="ISO date upper bound. Defaults to today."),
    fixture_file: Path | None = typer.Option(
        None,
        "--fixture",
        "-f",
        help="Path to a JSON list of RawDisclosure dicts. When provided, uses MockKapClient "
        "and never touches the network — useful for dry runs.",
    ),
) -> None:
    """Fetch disclosures and emit a KapEvents bundle as JSON on stdout."""
    since_date = date.fromisoformat(since)
    until_date = date.fromisoformat(until) if until else None

    client: MockKapClient | HttpKapClient
    if fixture_file is not None:
        payload = json.loads(fixture_file.read_text(encoding="utf-8"))
        if not isinstance(payload, list):
            typer.echo("error: fixture must be a JSON array", err=True)
            raise typer.Exit(code=2)
        client = MockKapClient(fixtures=[_coerce_raw_disclosure(item) for item in payload])
    else:
        client = HttpKapClient()

    events = run_kap_watch(ticker.upper(), since=since_date, until=until_date, client=client)
    typer.echo(events.model_dump_json())
