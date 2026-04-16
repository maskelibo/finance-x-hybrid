"""`financex schemas ...` subcommands — export / inspect JSON Schemas."""

from __future__ import annotations

from pathlib import Path

import typer

from financex.schemas.export import EXPORTABLE_SCHEMAS, export_all

schemas_app = typer.Typer(help="Schema utilities for the Python ↔ Node contract.")


@schemas_app.command("export")
def export_cmd(
    out: Path = typer.Option(
        Path("../backend/generated/schemas"),
        "--out",
        "-o",
        help="Target directory. Created if missing. Relative to python-services/.",
    ),
) -> None:
    """Export every known schema as a JSON Schema file."""
    resolved = out.resolve()
    written = export_all(resolved)
    typer.echo(f"Exported {len(written)} schema(s) to {resolved}:")
    for path in written:
        typer.echo(f"  - {path.name}")


@schemas_app.command("list")
def list_cmd() -> None:
    """List exportable schema keys and their Pydantic classes."""
    for name, cls in EXPORTABLE_SCHEMAS.items():
        typer.echo(f"{name} → {cls.__name__}")
