"""Repository-style queries for Python-owned tables.

Thin wrappers — no ORM, raw SQL. TickerPackage is serialized to JSON
with Pydantic and stored as TEXT; readers parse it back.
"""

from __future__ import annotations

import sqlite3
from datetime import UTC, datetime
from pathlib import Path

from financex.db.connection import connect
from financex.schemas import TickerPackage


class TickerPackageRepo:
    """Persists TickerPackage JSON into both `ticker_packages` (latest-per-ticker)
    and `ticker_packages_history` (append-only audit log)."""

    def __init__(self, conn: sqlite3.Connection | None = None, path: Path | None = None) -> None:
        self.conn = conn or connect(path)

    def save(self, pkg: TickerPackage) -> None:
        payload = pkg.model_dump_json()
        built_at = (pkg.meta.built_at or datetime.now(UTC)).isoformat()
        values = (
            pkg.meta.ticker,
            pkg.meta.schema_version,
            pkg.meta.package_date.isoformat(),
            pkg.meta.producer,
            built_at,
            payload,
            pkg.quality.overall_score,
            1 if pkg.quality.degraded else 0,
        )
        self.conn.execute(
            """
            INSERT INTO ticker_packages
                (ticker, schema_version, package_date, producer, built_at,
                 package_json, quality_score, degraded)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(ticker) DO UPDATE SET
                schema_version=excluded.schema_version,
                package_date=excluded.package_date,
                producer=excluded.producer,
                built_at=excluded.built_at,
                package_json=excluded.package_json,
                quality_score=excluded.quality_score,
                degraded=excluded.degraded
            """,
            values,
        )
        self.conn.execute(
            """
            INSERT INTO ticker_packages_history
                (ticker, schema_version, package_date, producer, built_at,
                 package_json, quality_score, degraded)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            values,
        )

    def latest(self, ticker: str) -> TickerPackage | None:
        row = self.conn.execute(
            "SELECT package_json FROM ticker_packages WHERE ticker = ?;",
            (ticker,),
        ).fetchone()
        if row is None:
            return None
        return TickerPackage.model_validate_json(row["package_json"])

    def history(self, ticker: str, limit: int = 20) -> list[TickerPackage]:
        rows = self.conn.execute(
            "SELECT package_json FROM ticker_packages_history "
            "WHERE ticker = ? ORDER BY built_at DESC LIMIT ?;",
            (ticker, limit),
        ).fetchall()
        return [TickerPackage.model_validate_json(r["package_json"]) for r in rows]


class CrawlerHealthRepo:
    """Tracks whether each Python crawler succeeded on its last run."""

    def __init__(self, conn: sqlite3.Connection | None = None, path: Path | None = None) -> None:
        self.conn = conn or connect(path)

    def record(
        self,
        crawler_id: str,
        ticker: str | None,
        status: str,
        duration_ms: int | None = None,
        error_message: str | None = None,
    ) -> None:
        if status not in {"ok", "fail", "degraded"}:
            raise ValueError(f"Invalid status: {status!r}")
        self.conn.execute(
            """
            INSERT INTO crawler_health
                (crawler_id, ticker, last_run_at, status, duration_ms, error_message)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(crawler_id, ticker) DO UPDATE SET
                last_run_at=excluded.last_run_at,
                status=excluded.status,
                duration_ms=excluded.duration_ms,
                error_message=excluded.error_message
            """,
            (
                crawler_id,
                ticker or "",
                datetime.now(UTC).isoformat(),
                status,
                duration_ms,
                error_message,
            ),
        )

    def status(self, crawler_id: str, ticker: str | None = None) -> dict | None:
        row = self.conn.execute(
            "SELECT * FROM crawler_health WHERE crawler_id = ? AND ticker = ?;",
            (crawler_id, ticker or ""),
        ).fetchone()
        return dict(row) if row else None

    def recent_failures(self, limit: int = 20) -> list[dict]:
        rows = self.conn.execute(
            "SELECT * FROM crawler_health WHERE status IN ('fail','degraded') "
            "ORDER BY last_run_at DESC LIMIT ?;",
            (limit,),
        ).fetchall()
        return [dict(r) for r in rows]
