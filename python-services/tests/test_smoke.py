"""Smoke tests: does the package import and CLI wiring resolve?"""

from typer.testing import CliRunner

from financex import __version__
from financex.cli import app


def test_package_has_version() -> None:
    assert __version__, "financex must expose __version__"


def test_cli_version_command() -> None:
    result = CliRunner().invoke(app, ["version"])
    assert result.exit_code == 0
    assert "financex" in result.stdout


def test_all_subpackages_import() -> None:
    import financex.calculators  # noqa: F401
    import financex.cli  # noqa: F401
    import financex.crawlers  # noqa: F401
    import financex.db  # noqa: F401
    import financex.parsers  # noqa: F401
    import financex.schemas  # noqa: F401
