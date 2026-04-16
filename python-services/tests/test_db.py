"""DB tests — migrations idempotent, TickerPackage roundtrip, crawler_health."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest

from financex.db.connection import connect
from financex.db.migrations import ensure_schema, list_all_tables
from financex.db.queries import CrawlerHealthRepo, TickerPackageRepo
from financex.schemas import (
    BalanceSheet,
    CompanyInfo,
    Financials,
    IncomeStatement,
    MarketData,
    MarketSnapshot,
    MetaInfo,
    PeriodFinancials,
    ReportingPeriod,
    TickerPackage,
)


@pytest.fixture
def temp_db(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    target = tmp_path / "test.db"
    monkeypatch.setenv("FINANCEX_DB_PATH", str(target))
    return target


def _sample_kchol() -> TickerPackage:
    return TickerPackage(
        meta=MetaInfo(
            ticker="KCHOL",
            package_date=date(2026, 4, 16),
            producer="tests.sample",
        ),
        company=CompanyInfo(name="Koç Holding", sector="holding", is_holding=True),
        financials=Financials(
            periods=[
                PeriodFinancials(
                    period=ReportingPeriod.FY,
                    year=2025,
                    balance_sheet=BalanceSheet(
                        total_assets=Decimal("1200000000000"),
                        total_liabilities=Decimal("700000000000"),
                        total_equity=Decimal("500000000000"),
                    ),
                    income_statement=IncomeStatement(
                        revenue=Decimal("380000000000"),
                        net_income=Decimal("45000000000"),
                    ),
                )
            ]
        ),
        market=MarketData(
            snapshot=MarketSnapshot(
                last_price=Decimal("215.40"),
                shares_outstanding=2_535_898_050,
                market_cap=Decimal("546230000000"),
            )
        ),
    )


# ---------- migrations ------------------------------------------------

def test_ensure_schema_creates_python_tables(temp_db: Path) -> None:
    tables = ensure_schema()
    assert set(tables) == {
        "ticker_packages",
        "ticker_packages_history",
        "crawler_health",
        "run_logs",
    }


def test_ensure_schema_is_idempotent(temp_db: Path) -> None:
    ensure_schema()
    # Second call must not raise.
    tables = ensure_schema()
    assert "ticker_packages" in tables


def test_list_all_tables(temp_db: Path) -> None:
    ensure_schema()
    all_tables = list_all_tables()
    assert "ticker_packages" in all_tables
    assert "run_logs" in all_tables


# ---------- TickerPackageRepo ----------------------------------------

def test_ticker_package_save_and_latest(temp_db: Path) -> None:
    ensure_schema()
    repo = TickerPackageRepo()
    pkg = _sample_kchol()
    repo.save(pkg)

    loaded = repo.latest("KCHOL")
    assert loaded is not None
    assert loaded.meta.ticker == "KCHOL"
    assert (
        loaded.financials.periods[0].balance_sheet.total_assets
        == Decimal("1200000000000")
    )


def test_ticker_package_upsert_overwrites_current(temp_db: Path) -> None:
    ensure_schema()
    repo = TickerPackageRepo()
    repo.save(_sample_kchol())
    # Save again with a different revenue.
    pkg2 = _sample_kchol()
    pkg2.financials.periods[0].income_statement.revenue = Decimal("400000000000")
    repo.save(pkg2)

    latest = repo.latest("KCHOL")
    assert latest is not None
    assert latest.financials.periods[0].income_statement.revenue == Decimal("400000000000")


def test_ticker_package_history_is_append_only(temp_db: Path) -> None:
    ensure_schema()
    repo = TickerPackageRepo()
    repo.save(_sample_kchol())
    repo.save(_sample_kchol())
    hist = repo.history("KCHOL")
    assert len(hist) == 2


def test_ticker_package_latest_missing_returns_none(temp_db: Path) -> None:
    ensure_schema()
    repo = TickerPackageRepo()
    assert repo.latest("DOESNOTEXIST") is None


# ---------- CrawlerHealthRepo ----------------------------------------

def test_crawler_health_record_and_status(temp_db: Path) -> None:
    ensure_schema()
    repo = CrawlerHealthRepo()
    repo.record("kap_watch", "KCHOL", "ok", duration_ms=1500)
    s = repo.status("kap_watch", "KCHOL")
    assert s is not None
    assert s["status"] == "ok"
    assert s["duration_ms"] == 1500


def test_crawler_health_invalid_status_raises(temp_db: Path) -> None:
    ensure_schema()
    repo = CrawlerHealthRepo()
    with pytest.raises(ValueError):
        repo.record("kap_watch", "KCHOL", "bogus")


def test_crawler_health_recent_failures(temp_db: Path) -> None:
    ensure_schema()
    repo = CrawlerHealthRepo()
    repo.record("kap_watch", "KCHOL", "ok")
    repo.record("data_collection", "THYAO", "fail", error_message="timeout")
    repo.record("data_collection", "EREGL", "degraded")
    fails = repo.recent_failures()
    crawlers = {(f["crawler_id"], f["ticker"]) for f in fails}
    assert ("data_collection", "THYAO") in crawlers
    assert ("data_collection", "EREGL") in crawlers
    assert ("kap_watch", "KCHOL") not in crawlers


# ---------- isolation: test DB is truly separate from production ----

def test_test_db_does_not_touch_backend_data(temp_db: Path) -> None:
    """Paranoia: the env var must route all ops to the temp DB."""
    ensure_schema()
    backend_data = Path(__file__).resolve().parents[2] / "backend" / "data" / "financex.db"
    # Either the backend DB doesn't exist (fresh clone) or — if it does —
    # we never wrote a 'ticker_packages' row there from this test.
    if backend_data.exists():
        production = connect(backend_data)
        try:
            count = production.execute(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='ticker_packages';"
            ).fetchone()[0]
            # Allow existence (user may have already migrated) but no test-seeded row.
            if count:
                rows = production.execute(
                    "SELECT COUNT(*) FROM ticker_packages WHERE producer='tests.sample';"
                ).fetchone()[0]
                assert rows == 0, "Test data leaked into production DB!"
        finally:
            production.close()
