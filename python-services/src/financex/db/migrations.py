"""Idempotent schema migrations for the Python side.

Follows the same `CREATE TABLE IF NOT EXISTS` pattern the Node backend uses,
so the same DB file can be migrated from either side without coordination.

Only adds new tables; never touches Node-owned tables (analysis_sessions,
agent_runs, reports, ceo_activities, goals, kap_events, etc.).
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

from financex.db.connection import connect

# New tables owned by the Python side.
PYTHON_OWNED_SCHEMA = """
CREATE TABLE IF NOT EXISTS ticker_packages (
    ticker TEXT PRIMARY KEY,
    schema_version TEXT NOT NULL,
    package_date TEXT NOT NULL,
    producer TEXT NOT NULL,
    built_at TEXT NOT NULL,
    package_json TEXT NOT NULL,
    quality_score REAL,
    degraded INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ticker_packages_date ON ticker_packages(package_date);

CREATE TABLE IF NOT EXISTS ticker_packages_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    package_date TEXT NOT NULL,
    producer TEXT NOT NULL,
    built_at TEXT NOT NULL,
    package_json TEXT NOT NULL,
    quality_score REAL,
    degraded INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_packages_history_ticker ON ticker_packages_history(ticker, built_at);

CREATE TABLE IF NOT EXISTS crawler_health (
    crawler_id TEXT NOT NULL,
    ticker TEXT,
    last_run_at TEXT NOT NULL,
    status TEXT NOT NULL,
    duration_ms INTEGER,
    error_message TEXT,
    PRIMARY KEY (crawler_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_crawler_health_status ON crawler_health(status, last_run_at);

CREATE TABLE IF NOT EXISTS run_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT NOT NULL,
    ticker TEXT,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL,
    exit_code INTEGER,
    stdout_tail TEXT,
    stderr_tail TEXT,
    payload_ref TEXT
);

CREATE INDEX IF NOT EXISTS idx_run_logs_started ON run_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_run_logs_module ON run_logs(module, started_at);
"""


def ensure_schema(conn: sqlite3.Connection | None = None, path: Path | None = None) -> list[str]:
    """Apply Python-owned schema. Idempotent.

    Returns the list of tables that now exist on the Python side.
    """
    owned = conn
    if owned is None:
        owned = connect(path)
        close_after = True
    else:
        close_after = False

    try:
        owned.executescript(PYTHON_OWNED_SCHEMA)
        rows = owned.execute(
            "SELECT name FROM sqlite_master WHERE type='table' "
            "AND name IN ('ticker_packages','ticker_packages_history','crawler_health','run_logs') "
            "ORDER BY name;"
        ).fetchall()
        return [r["name"] for r in rows]
    finally:
        if close_after:
            owned.close()


def list_all_tables(conn: sqlite3.Connection | None = None, path: Path | None = None) -> list[str]:
    """Return all tables in the DB — useful for `financex db status`."""
    owned = conn
    if owned is None:
        owned = connect(path)
        close_after = True
    else:
        close_after = False
    try:
        rows = owned.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
        ).fetchall()
        return [r["name"] for r in rows]
    finally:
        if close_after:
            owned.close()
