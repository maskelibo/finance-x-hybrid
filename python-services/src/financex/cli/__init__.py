import typer

from financex.cli.analyst import analyst_app
from financex.cli.analyze import analyze_app
from financex.cli.data import data_app
from financex.cli.db import db_app
from financex.cli.kap import kap_app
from financex.cli.macro import macro_app
from financex.cli.parse import parse_app
from financex.cli.reconcile import reconcile_app
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
app.add_typer(parse_app, name="parse")
app.add_typer(reconcile_app, name="reconcile")
app.add_typer(analyze_app, name="analyze")
app.add_typer(macro_app, name="macro")
app.add_typer(analyst_app, name="analyst")
app.add_typer(macro_app, name="macro")


@app.command()
def version() -> None:
    """Show the installed financex version."""
    from financex import __version__

    typer.echo(f"financex {__version__}")


@app.command()
def ping() -> None:
    """Health check — returns 'pong' if the CLI is wired correctly."""
    typer.echo("pong")
