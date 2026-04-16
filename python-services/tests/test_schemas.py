"""Schema tests — verify the hybrid doctrine holds:
  - Missing critical field → ValidationError.
  - Missing optional field → None, no error, producer can flag it.
  - JSON roundtrip preserves Decimal precision.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError

from financex.schemas import (
    CURRENT_SCHEMA_VERSION,
    BalanceSheet,
    CompanyInfo,
    Financials,
    IncomeStatement,
    MarketData,
    MarketSnapshot,
    MetaInfo,
    PeriodFinancials,
    QualityControl,
    QualityFlag,
    ReportingPeriod,
    Severity,
    TickerPackage,
)


# ---------- Fixture: a minimal, valid KCHOL package ----------------------

def _valid_kchol() -> TickerPackage:
    bs = BalanceSheet(
        total_assets=Decimal("1_200_000_000_000"),
        total_liabilities=Decimal("700_000_000_000"),
        total_equity=Decimal("500_000_000_000"),
        # trade_receivables intentionally omitted — tests the hybrid path.
    )
    is_ = IncomeStatement(
        revenue=Decimal("380_000_000_000"),
        net_income=Decimal("45_000_000_000"),
    )
    period = PeriodFinancials(
        period=ReportingPeriod.FY,
        year=2025,
        balance_sheet=bs,
        income_statement=is_,
    )
    return TickerPackage(
        meta=MetaInfo(
            ticker="KCHOL",
            package_date=date(2026, 4, 16),
            producer="financex.crawlers.kchol",
        ),
        company=CompanyInfo(name="Koç Holding A.Ş.", sector="holding", is_holding=True),
        financials=Financials(periods=[period]),
        market=MarketData(
            snapshot=MarketSnapshot(
                last_price=Decimal("215.40"),
                shares_outstanding=2_535_898_050,
                market_cap=Decimal("546_230_000_000"),
            )
        ),
    )


# ---------- Hybrid doctrine: critical field missing ----------------------

def test_missing_critical_field_in_balance_sheet_raises() -> None:
    """total_equity is declared Required — missing it must blow up."""
    with pytest.raises(ValidationError) as exc:
        BalanceSheet(
            total_assets=Decimal("100"),
            total_liabilities=Decimal("50"),
            # total_equity omitted — must fail
        )
    assert "total_equity" in str(exc.value)


def test_missing_critical_top_level_field_raises() -> None:
    """TickerPackage.financials is Required."""
    with pytest.raises(ValidationError):
        TickerPackage(
            meta=MetaInfo(ticker="KCHOL", package_date=date(2026, 4, 16), producer="test"),
            company=CompanyInfo(name="Koç", sector="holding"),
            # financials missing
            market=MarketData(
                snapshot=MarketSnapshot(
                    last_price=Decimal("1"), shares_outstanding=1, market_cap=Decimal("1")
                )
            ),
        )


# ---------- Hybrid doctrine: optional fields stay None ------------------

def test_optional_field_absence_is_ok() -> None:
    """trade_receivables missing is legal — it's Optional."""
    pkg = _valid_kchol()
    assert pkg.financials.periods[0].balance_sheet.trade_receivables is None
    assert pkg.technical is None
    assert pkg.macro is None


def test_quality_defaults_to_empty() -> None:
    """A fresh package has an empty QualityControl block — never None."""
    pkg = _valid_kchol()
    assert pkg.quality.missing_fields == []
    assert pkg.quality.flags == []
    assert pkg.quality.degraded is False


# ---------- Producer surfacing missing fields ---------------------------

def test_producer_can_flag_missing_detail_field() -> None:
    pkg = _valid_kchol()
    pkg.quality = QualityControl(
        missing_fields=["financials.periods[0].balance_sheet.trade_receivables"],
        flags=[
            QualityFlag(
                code="MISSING_AR",
                severity=Severity.WARN,
                message="Trade receivables absent from KAP disclosure — DSO will be None.",
                affected_path="financials.periods[0].balance_sheet.trade_receivables",
            )
        ],
    )
    assert pkg.quality.missing_fields == [
        "financials.periods[0].balance_sheet.trade_receivables"
    ]
    assert not pkg.quality.has_block()


def test_block_severity_is_detected() -> None:
    qc = QualityControl(
        flags=[QualityFlag(code="HARD_FAIL", severity=Severity.BLOCK, message="Boom")]
    )
    assert qc.has_block()


# ---------- Meta & versioning -------------------------------------------

def test_schema_version_present_by_default() -> None:
    pkg = _valid_kchol()
    assert pkg.meta.schema_version == CURRENT_SCHEMA_VERSION


def test_ticker_pattern_enforced() -> None:
    with pytest.raises(ValidationError):
        MetaInfo(ticker="kchol", package_date=date(2026, 4, 16), producer="test")  # lowercase
    with pytest.raises(ValidationError):
        MetaInfo(ticker="KC", package_date=date(2026, 4, 16), producer="test")


# ---------- JSON roundtrip: Decimal survives ---------------------------

def test_json_roundtrip_preserves_decimal() -> None:
    pkg = _valid_kchol()
    as_json = pkg.model_dump_json()
    rebuilt = TickerPackage.model_validate_json(as_json)
    original_assets = pkg.financials.periods[0].balance_sheet.total_assets
    rebuilt_assets = rebuilt.financials.periods[0].balance_sheet.total_assets
    assert rebuilt_assets == original_assets
    assert rebuilt.meta.ticker == "KCHOL"


# ---------- Helper on Financials ---------------------------------------

def test_financials_latest_annual() -> None:
    pkg = _valid_kchol()
    latest = pkg.financials.latest_annual()
    assert latest is not None
    assert latest.year == 2025
    assert latest.period == ReportingPeriod.FY


# ---------- Forward-compat: unknown field is ignored -------------------

def test_extra_fields_are_ignored() -> None:
    """extra='ignore' — producers can add fields older consumers don't know about."""
    payload = {
        "meta": {
            "ticker": "KCHOL",
            "package_date": "2026-04-16",
            "producer": "test",
            "schema_version": CURRENT_SCHEMA_VERSION,
            "future_field_we_dont_know": 42,
        },
        "company": {"name": "Koç", "sector": "holding"},
        "financials": {
            "periods": [
                {
                    "period": "FY",
                    "year": 2025,
                    "balance_sheet": {
                        "total_assets": "100",
                        "total_liabilities": "50",
                        "total_equity": "50",
                    },
                    "income_statement": {"revenue": "10", "net_income": "1"},
                }
            ]
        },
        "market": {
            "snapshot": {
                "last_price": "1",
                "shares_outstanding": 1,
                "market_cap": "1",
            }
        },
    }
    pkg = TickerPackage.model_validate(payload)
    assert pkg.meta.ticker == "KCHOL"
