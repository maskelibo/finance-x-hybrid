"""reconciliation tests — every check, pass/fail/skip paths."""

from __future__ import annotations

from decimal import Decimal

from financex.calculators.reconciliation import run_reconciliation
from financex.schemas.base import Currency, ReportingPeriod
from financex.schemas.financials import (
    BalanceSheet,
    CashFlowStatement,
    IncomeStatement,
    PeriodFinancials,
)


def _period(bs: BalanceSheet, is_: IncomeStatement, cf: CashFlowStatement | None = None) -> PeriodFinancials:
    return PeriodFinancials(
        period=ReportingPeriod.Q3,
        year=2024,
        currency=Currency.TRY,
        balance_sheet=bs,
        income_statement=is_,
        cash_flow=cf,
    )


# ---------- BS_IDENTITY ----------

def test_bs_identity_passes_when_assets_equal_liabilities_plus_equity() -> None:
    bs = BalanceSheet(
        total_assets=Decimal("1000"),
        total_liabilities=Decimal("600"),
        total_equity=Decimal("400"),
    )
    is_ = IncomeStatement(revenue=Decimal("1"), net_income=Decimal("1"))
    report = run_reconciliation(_period(bs, is_))
    check = next(c for c in report.checks if c.code == "BS_IDENTITY")
    assert check.passed


def test_bs_identity_fails_when_off_by_more_than_tolerance() -> None:
    bs = BalanceSheet(
        total_assets=Decimal("1000"),
        total_liabilities=Decimal("600"),
        total_equity=Decimal("300"),  # 100 short
    )
    is_ = IncomeStatement(revenue=Decimal("1"), net_income=Decimal("1"))
    report = run_reconciliation(_period(bs, is_))
    check = next(c for c in report.checks if c.code == "BS_IDENTITY")
    assert not check.passed
    assert check.absolute_error == Decimal("100")


def test_bs_identity_tolerates_ten_bp_drift() -> None:
    bs = BalanceSheet(
        total_assets=Decimal("1000000"),
        total_liabilities=Decimal("600000"),
        total_equity=Decimal("400001"),  # 1 TL drift ~ 0.0001% tolerance is 0.1%
    )
    is_ = IncomeStatement(revenue=Decimal("1"), net_income=Decimal("1"))
    report = run_reconciliation(_period(bs, is_))
    check = next(c for c in report.checks if c.code == "BS_IDENTITY")
    assert check.passed


# ---------- BS_EQUITY_SPLIT ----------

def test_equity_split_passes_with_parent_and_minority() -> None:
    bs = BalanceSheet(
        total_assets=Decimal("1000"),
        total_liabilities=Decimal("600"),
        total_equity=Decimal("400"),
        parent_equity=Decimal("250"),
        minority_interest=Decimal("150"),
    )
    is_ = IncomeStatement(revenue=Decimal("1"), net_income=Decimal("1"))
    report = run_reconciliation(_period(bs, is_))
    check = next(c for c in report.checks if c.code == "BS_EQUITY_SPLIT")
    assert check.passed


def test_equity_split_skipped_if_parent_missing() -> None:
    bs = BalanceSheet(
        total_assets=Decimal("1000"),
        total_liabilities=Decimal("600"),
        total_equity=Decimal("400"),
    )
    is_ = IncomeStatement(revenue=Decimal("1"), net_income=Decimal("1"))
    report = run_reconciliation(_period(bs, is_))
    check = next(c for c in report.checks if c.code == "BS_EQUITY_SPLIT")
    assert check.passed  # skipped = passed
    assert "skipped" in check.message


# ---------- IS_GROSS_CHAIN ----------

def test_gross_chain_passes_when_revenue_minus_cogs_equals_gross() -> None:
    bs = BalanceSheet(total_assets=Decimal("1"), total_liabilities=Decimal("0"), total_equity=Decimal("1"))
    is_ = IncomeStatement(
        revenue=Decimal("1000"),
        net_income=Decimal("100"),
        cost_of_sales=Decimal("-700"),  # negative per KAP convention
        gross_profit=Decimal("300"),
    )
    report = run_reconciliation(_period(bs, is_))
    check = next(c for c in report.checks if c.code == "IS_GROSS_CHAIN")
    assert check.passed


def test_gross_chain_fails_on_arithmetic_error() -> None:
    bs = BalanceSheet(total_assets=Decimal("1"), total_liabilities=Decimal("0"), total_equity=Decimal("1"))
    is_ = IncomeStatement(
        revenue=Decimal("1000"),
        net_income=Decimal("100"),
        cost_of_sales=Decimal("-700"),
        gross_profit=Decimal("250"),  # 50 off
    )
    report = run_reconciliation(_period(bs, is_))
    check = next(c for c in report.checks if c.code == "IS_GROSS_CHAIN")
    assert not check.passed


# ---------- CF_TOTAL_RECONCILE ----------

def test_cf_reconcile_passes_with_all_flows() -> None:
    bs = BalanceSheet(total_assets=Decimal("1"), total_liabilities=Decimal("0"), total_equity=Decimal("1"))
    is_ = IncomeStatement(revenue=Decimal("1"), net_income=Decimal("1"))
    cf = CashFlowStatement(
        operating_cash_flow=Decimal("500"),
        investing_cash_flow=Decimal("-200"),
        financing_cash_flow=Decimal("-100"),
        fx_impact=Decimal("10"),
        net_change_in_cash=Decimal("210"),
    )
    report = run_reconciliation(_period(bs, is_, cf))
    check = next(c for c in report.checks if c.code == "CF_TOTAL_RECONCILE")
    assert check.passed


def test_cf_reconcile_skipped_when_no_cf_reported() -> None:
    bs = BalanceSheet(total_assets=Decimal("1"), total_liabilities=Decimal("0"), total_equity=Decimal("1"))
    is_ = IncomeStatement(revenue=Decimal("1"), net_income=Decimal("1"))
    report = run_reconciliation(_period(bs, is_, None))
    check = next(c for c in report.checks if c.code == "CF_TOTAL_RECONCILE")
    assert check.passed
    assert "skipped" in check.message


# ---------- Report helpers ----------

def test_all_passed_true_on_clean_report() -> None:
    bs = BalanceSheet(total_assets=Decimal("1000"), total_liabilities=Decimal("600"), total_equity=Decimal("400"))
    is_ = IncomeStatement(revenue=Decimal("1"), net_income=Decimal("1"))
    report = run_reconciliation(_period(bs, is_), ticker="TEST")
    assert report.all_passed


def test_report_failed_helper_returns_only_failures() -> None:
    bs = BalanceSheet(
        total_assets=Decimal("1000"),
        total_liabilities=Decimal("600"),
        total_equity=Decimal("500"),  # off by 100
    )
    is_ = IncomeStatement(revenue=Decimal("1"), net_income=Decimal("1"))
    report = run_reconciliation(_period(bs, is_))
    fails = report.failed()
    assert len(fails) == 1
    assert fails[0].code == "BS_IDENTITY"
