"""`financex sample ...` — emit fixture payloads for bridge smoke tests.

Not part of the production data flow; lets the Node side exercise the
subprocess bridge against a known-good TickerPackage without hitting
the real crawlers.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal

import typer

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

sample_app = typer.Typer(help="Emit sample payloads for end-to-end smoke tests.")


def _build_kchol_sample() -> TickerPackage:
    return TickerPackage(
        meta=MetaInfo(
            ticker="KCHOL",
            package_date=date(2026, 4, 16),
            producer="financex.cli.sample",
            built_at=datetime.now(timezone.utc),
            sources=[],
        ),
        company=CompanyInfo(
            name="Koç Holding A.Ş.",
            sector="holding",
            is_holding=True,
        ),
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


@sample_app.command("ticker-package")
def ticker_package() -> None:
    """Print a minimal valid TickerPackage as JSON to stdout."""
    pkg = _build_kchol_sample()
    # Emit compact JSON — Node parser is happy either way but this keeps logs small.
    typer.echo(pkg.model_dump_json())
