"""Python-runner audit log. Every Python runner invocation goes here."""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime
from typing import Any


def _now() -> datetime:
    return datetime.now(UTC)


@contextmanager
def track_run(
    conn: sqlite3.Connection,
    runner_id: str,
    *,
    ticker: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> Iterator[int]:
    """Open a python_runs row, yield its id, finalise on exit.

    Any exception bubbling out marks the run as 'failed' before re-raising.
    """
    started = _now()
    metadata_json = json.dumps(metadata) if metadata else None
    cur = conn.execute(
        """
        INSERT INTO python_runs (runner_id, ticker, started_at, status, metadata_json)
        VALUES (?, ?, ?, 'running', ?)
        """,
        (runner_id, ticker, started.isoformat(), metadata_json),
    )
    run_id = cur.lastrowid
    conn.commit()
    assert run_id is not None

    try:
        yield run_id
    except Exception as exc:
        completed = _now()
        conn.execute(
            """
            UPDATE python_runs
               SET status = 'failed',
                   completed_at = ?,
                   duration_ms = ?,
                   error_message = ?
             WHERE id = ?
            """,
            (
                completed.isoformat(),
                int((completed - started).total_seconds() * 1000),
                repr(exc),
                run_id,
            ),
        )
        conn.commit()
        raise

    completed = _now()
    conn.execute(
        """
        UPDATE python_runs
           SET status = 'succeeded',
               completed_at = ?,
               duration_ms = ?
         WHERE id = ?
        """,
        (completed.isoformat(), int((completed - started).total_seconds() * 1000), run_id),
    )
    conn.commit()


def set_output_path(conn: sqlite3.Connection, run_id: int, path: str) -> None:
    conn.execute("UPDATE python_runs SET output_path = ? WHERE id = ?", (path, run_id))
    conn.commit()


def recent_runs(
    conn: sqlite3.Connection,
    *,
    runner_id: str | None = None,
    ticker: str | None = None,
    limit: int = 20,
) -> list[dict[str, Any]]:
    sql = "SELECT * FROM python_runs WHERE 1=1"
    params: list[Any] = []
    if runner_id:
        sql += " AND runner_id = ?"
        params.append(runner_id)
    if ticker:
        sql += " AND ticker = ?"
        params.append(ticker)
    sql += " ORDER BY started_at DESC LIMIT ?"
    params.append(limit)
    return [dict(r) for r in conn.execute(sql, params).fetchall()]
