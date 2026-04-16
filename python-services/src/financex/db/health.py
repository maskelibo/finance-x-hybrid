"""Per-crawler health tracking — consumed by a future watchdog."""

from __future__ import annotations

import sqlite3
from datetime import UTC, datetime
from typing import Any


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def record_success(conn: sqlite3.Connection, crawler_id: str) -> None:
    now = _now_iso()
    conn.execute(
        """
        INSERT INTO crawler_health
          (crawler_id, last_success_at, consecutive_failures, total_successes, total_failures, updated_at)
        VALUES (?, ?, 0, 1, 0, ?)
        ON CONFLICT(crawler_id) DO UPDATE SET
          last_success_at      = excluded.last_success_at,
          consecutive_failures = 0,
          total_successes      = total_successes + 1,
          updated_at           = excluded.updated_at
        """,
        (crawler_id, now, now),
    )
    conn.commit()


def record_failure(conn: sqlite3.Connection, crawler_id: str, message: str) -> None:
    now = _now_iso()
    conn.execute(
        """
        INSERT INTO crawler_health
          (crawler_id, last_failure_at, last_failure_message,
           consecutive_failures, total_successes, total_failures, updated_at)
        VALUES (?, ?, ?, 1, 0, 1, ?)
        ON CONFLICT(crawler_id) DO UPDATE SET
          last_failure_at      = excluded.last_failure_at,
          last_failure_message = excluded.last_failure_message,
          consecutive_failures = consecutive_failures + 1,
          total_failures       = total_failures + 1,
          updated_at           = excluded.updated_at
        """,
        (crawler_id, now, message, now),
    )
    conn.commit()


def get_health(conn: sqlite3.Connection, crawler_id: str) -> dict[str, Any] | None:
    row = conn.execute(
        "SELECT * FROM crawler_health WHERE crawler_id = ?",
        (crawler_id,),
    ).fetchone()
    return dict(row) if row else None


def list_unhealthy(conn: sqlite3.Connection, threshold: int = 3) -> list[dict[str, Any]]:
    """Crawlers that have failed `threshold` or more times in a row."""
    rows = conn.execute(
        "SELECT * FROM crawler_health WHERE consecutive_failures >= ? ORDER BY consecutive_failures DESC",
        (threshold,),
    ).fetchall()
    return [dict(r) for r in rows]
