"""TickerPackage persistence — save, load, list, history rollover."""

from __future__ import annotations

import sqlite3
from datetime import UTC, datetime

from financex.schemas import TickerPackage


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def save_package(conn: sqlite3.Connection, pkg: TickerPackage) -> None:
    """Upsert the latest package row; archive the previous one if it existed.

    This is atomic: previous row moves to history and new row is written in
    the same transaction.
    """
    prev = conn.execute(
        """
        SELECT ticker, schema_version, package_date, package_json, producer, built_at
        FROM ticker_packages
        WHERE ticker = ?
        """,
        (pkg.meta.ticker,),
    ).fetchone()

    if prev is not None:
        conn.execute(
            """
            INSERT INTO ticker_package_history
              (ticker, schema_version, package_date, package_json, producer, built_at, archived_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                prev["ticker"],
                prev["schema_version"],
                prev["package_date"],
                prev["package_json"],
                prev["producer"],
                prev["built_at"],
                _now_iso(),
            ),
        )

    built_at_iso = (pkg.meta.built_at or datetime.now(UTC)).isoformat()
    conn.execute(
        """
        INSERT INTO ticker_packages
          (ticker, schema_version, package_date, package_json, producer, built_at,
           quality_score, degraded, missing_fields_count, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(ticker) DO UPDATE SET
          schema_version       = excluded.schema_version,
          package_date         = excluded.package_date,
          package_json         = excluded.package_json,
          producer             = excluded.producer,
          built_at             = excluded.built_at,
          quality_score        = excluded.quality_score,
          degraded             = excluded.degraded,
          missing_fields_count = excluded.missing_fields_count,
          updated_at           = excluded.updated_at
        """,
        (
            pkg.meta.ticker,
            pkg.meta.schema_version,
            pkg.meta.package_date.isoformat(),
            pkg.model_dump_json(),
            pkg.meta.producer,
            built_at_iso,
            pkg.quality.overall_score,
            1 if pkg.quality.degraded else 0,
            len(pkg.quality.missing_fields),
            _now_iso(),
        ),
    )
    conn.commit()


def load_package(conn: sqlite3.Connection, ticker: str) -> TickerPackage | None:
    """Return the latest stored package for a ticker, or None if unseen."""
    row = conn.execute(
        "SELECT package_json FROM ticker_packages WHERE ticker = ?",
        (ticker,),
    ).fetchone()
    if row is None:
        return None
    return TickerPackage.model_validate_json(row["package_json"])


def list_tickers(conn: sqlite3.Connection) -> list[str]:
    """All tickers currently in ticker_packages, alphabetical."""
    return [row["ticker"] for row in conn.execute("SELECT ticker FROM ticker_packages ORDER BY ticker")]


def history_depth(conn: sqlite3.Connection, ticker: str) -> int:
    """How many archived packages exist for this ticker."""
    row = conn.execute(
        "SELECT COUNT(*) AS cnt FROM ticker_package_history WHERE ticker = ?",
        (ticker,),
    ).fetchone()
    return int(row["cnt"])
