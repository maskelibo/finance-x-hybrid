import typer

from financex.cli.data import data_app
from financex.cli.db import db_app
from financex.cli.kap import kap_app
from financex.cli.sample import sample_app
from financex.cli.schemas import schemas_app
from financex.cli.technical import technical_app
from financex.cli.timeline import timeline_app

app = typer.Typer(
    help="Finance X Python runners — data collection, parsing, financial math.",
    no_args_is_help=True,
)
app.add_typer(db_app, name="db")
app.add_typer(schemas_app, name="schemas")
app.add_typer(sample_app, name="sample")
app.add_typer(timeline_app, name="timeline")
app.add_typer(technical_app, name="technical")
app.add_typer(kap_app, name="kap")
app.add_typer(data_app, name="data")


@app.command()
def version() -> None:
    """Show the installed financex version."""
    from financex import __version__

    typer.echo(f"financex {__version__}")


@app.command()
def ping() -> None:
    """Health check — returns 'pong' if the CLI is wired correctly."""
    typer.echo("pong")
