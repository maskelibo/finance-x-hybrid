# financex — Python runners

Deterministic Python runners for Finance X. Companion to the Node.js backend
in `../backend/` — handles data collection, PDF/XBRL parsing, and all
finance/math that does not require LLM judgment.

The Node.js orchestrator spawns these runners as subprocesses (or reads
the shared SQLite DB) and feeds the resulting structured packages to the
reasoning agents that remain on Claude.

## Package layout

```
src/financex/
  schemas/       Pydantic models (TickerPackage, KapEvent, etc.) — single source of truth
  db/            SQLite wrapper, migrations, queries (shares backend/data/financex.db)
  crawlers/      Data fetchers: KAP, IS Yatirim, news, analyst sources
  parsers/       PDF / XBRL / HTML parsers
  calculators/   Financial math (engine + technical indicators)
  cli/           typer-based CLI (`uv run financex ...`)
tests/           pytest suite
```

## Install & run

```bash
# From python-services/
uv sync               # install deps + provision Python 3.12
uv run pytest         # smoke tests
uv run financex --help
```

## Not for manual editing of dependencies

Use `uv add <pkg>` / `uv remove <pkg>` — never edit `pyproject.toml`
dependencies directly. Run `uv sync` after pulls.
