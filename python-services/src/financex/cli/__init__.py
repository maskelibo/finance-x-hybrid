import typer

from financex.cli.db import db_app
from financex.cli.schemas import schemas_app

app = typer.Typer(
    help="Finance X Python runners — data collection, parsing, financial math.",
    no_args_is_help=True,
)
app.add_typer(db_app, name="db")
app.add_typer(schemas_app, name="schemas")


@app.command()
def version() -> None:
    """Show the installed financex version."""
    from financex import __version__

    typer.echo(f"financex {__version__}")


@app.command()
def ping() -> None:
    """Health check — returns 'pong' if the CLI is wired correctly."""
    typer.echo("pong")
