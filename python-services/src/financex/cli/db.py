"""`financex db ...` subcommands — migrate and inspect the SQLite DB."""

from __future__ import annotations

import typer

from financex.db.connection import db_path
from financex.db.migrations import ensure_schema, list_all_tables

db_app = typer.Typer(help="SQLite operations for the Python side.")


@db_app.command()
def migrate() -> None:
    """Apply Python-owned schema (idempotent)."""
    path = db_path()
    typer.echo(f"Target DB: {path}")
    tables = ensure_schema()
    typer.echo(f"Python-owned tables present: {', '.join(tables)}")


@db_app.command()
def status() -> None:
    """Show which tables exist in the active DB."""
    path = db_path()
    all_tables = list_all_tables()
    typer.echo(f"Target DB: {path}")
    typer.echo(f"Total tables: {len(all_tables)}")
    for t in all_tables:
        typer.echo(f"  - {t}")
