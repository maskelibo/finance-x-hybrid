"""`financex timeline ...` — event bucketing CLI."""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

import typer

from financex.calculators.timeline import build_timeline
from financex.schemas.timeline import EventForTimeline

timeline_app = typer.Typer(help="event_timeline_alert — bucket events by timing.")


@timeline_app.command("bucket")
def bucket(
    input_file: Path = typer.Option(
        Path("-"),
        "--in",
        "-i",
        help="Path to JSON list of EventForTimeline. '-' reads from stdin.",
    ),
    reference: str | None = typer.Option(
        None,
        "--reference-date",
        "-r",
        help="ISO date to bucket events against. Defaults to today (UTC).",
    ),
) -> None:
    """Read events from a JSON file (or stdin), emit the bucketed Timeline as JSON."""
    raw = sys.stdin.read() if str(input_file) == "-" else input_file.read_text(encoding="utf-8")
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        typer.echo(f"error: invalid JSON input: {exc}", err=True)
        raise typer.Exit(code=2) from exc

    if not isinstance(payload, list):
        typer.echo("error: input must be a JSON array of events.", err=True)
        raise typer.Exit(code=2)

    events = [EventForTimeline.model_validate(item) for item in payload]
    ref = date.fromisoformat(reference) if reference else date.today()
    timeline = build_timeline(events, reference_date=ref)
    typer.echo(timeline.model_dump_json())
