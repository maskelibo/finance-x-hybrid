"""SQLite connection factory.

Shares `backend/data/financex.db` with the Node.js side. Respects the
FINANCEX_DB_PATH env var so tests can point at a temp DB.
"""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator


def default_db_path() -> Path:
    """Repo-relative default: ../backend/data/financex.db from this file."""
    here = Path(__file__).resolve()
    # python-services/src/financex/db/connection.py → ../../../../backend/data/financex.db
    return here.parents[4] / "backend" / "data" / "financex.db"


def db_path() -> Path:
    """Resolve the active DB path. Env var wins; otherwise the default."""
    env = os.environ.get("FINANCEX_DB_PATH")
    if env:
        return Path(env).expanduser().resolve()
    return default_db_path()


def connect(path: Path | None = None) -> sqlite3.Connection:
    """Open a connection with WAL + foreign keys + row factory."""
    target = path or db_path()
    target.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(target), isolation_level=None, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    return conn


@contextmanager
def session(path: Path | None = None) -> Iterator[sqlite3.Connection]:
    """Context-managed connection that commits on exit unless an error occurred."""
    conn = connect(path)
    try:
        conn.execute("BEGIN;")
        yield conn
        conn.execute("COMMIT;")
    except Exception:
        conn.execute("ROLLBACK;")
        raise
    finally:
        conn.close()
