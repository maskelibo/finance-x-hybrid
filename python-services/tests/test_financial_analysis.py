"""financial_analysis tests — highlights, red-flag rules, sector dispatch."""

from __future__ import annotations

from decimal import Decimal

from financex.calculators.financial_analysis import analyze_financials
from financex.calculators.financial_engine import compute_for_period
from financex.schemas.base import Currency, ReportingPeriod, Sector
from financex.schemas.financials import (
    BalanceSheet,
    CashFlowStatement,
    IncomeStatement,
    PeriodFinancials,
)


def _healthy_industrial() -> PeriodFinancials:
    return PeriodFinancials(
        period=ReportingPeriod.FY,
        year=2024,
        currency=Currency.TRY,
        sector=Sector.INDUSTRIAL,
        balance_sheet=BalanceSheet(
            total_assets=Decimal("1000"),
            total_liabilities=Decimal("400"),
            total_equity=Decimal("600"),
            current_assets=Decimal("500"),
            current_liabilities=Decimal("200"),
            cash_and_equivalents=Decimal("100"),
            trade_receivables=Decimal("100"),
            inventories=Decimal("80"),
            trade_payables=Decimal("60"),
            short_term_debt=Decimal("30"),
            long_term_debt=Decimal("100"),
        ),
        income_statement=IncomeStatement(
            revenue=Decimal("1000"),
            net_income=Decimal("150"),
            cost_of_sales=Decimal("-600"),
            gross_profit=Decimal("400"),
            operating_income=Decimal("200"),
            ebitda=Decimal("250"),
            financial_expense=Decimal("-20"),
        ),
        cash_flow=CashFlowStatement(operating_cash_flow=Decimal("180"), capex=Decimal("-50")),
    )


def _distressed_industrial() -> PeriodFinancials:
    return PeriodFinancials(
        period=ReportingPeriod.FY,
        year=2024,
        currency=Currency.TRY,
        sector=Sector.INDUSTRIAL,
        balance_sheet=BalanceSheet(
            total_assets=Decimal("1000"),
            total_liabilities=Decimal("900"),
            total_equity=Decimal("100"),
            current_assets=Decimal("150"),
            current_liabilities=Decimal("300"),
        ),
        income_statement=IncomeStatement(
            revenue=Decimal("500"),
            net_income=Decimal("-50"),
            cost_of_sales=Decimal("-400"),
            gross_profit=Decimal("100"),
            operating_income=Decimal("10"),
        ),
        cash_flow=CashFlowStatement(operating_cash_flow=Decimal("-20")),
    )


def _bank() -> PeriodFinancials:
    return PeriodFinancials(
        period=ReportingPeriod.Q3,
        year=2024,
        currency=Currency.TRY,
        sector=Sector.BANKING,
        balance_sheet=BalanceSheet(
            total_assets=Decimal("2000000"),
            total_liabilities=Decimal("1800000"),
            total_equity=Decimal("200000"),
        ),
        income_statement=IncomeStatement(
            net_income=Decimal("30000"),
            interest_income=Decimal("300000"),
            interest_expense=Decimal("-250000"),
            net_interest_income=Decimal("50000"),
            net_fee_and_commission_income=Decimal("20000"),
            bank_operating_expenses=Decimal("-25000"),
            loan_loss_provisions=Decimal("-15000"),
        ),
    )


# ---------- industrial rules ----------

def test_healthy_industrial_emits_no_red_flags() -> None:
    pf = _healthy_industrial()
    engine = compute_for_period(pf, market_cap=Decimal("2000"))
    result = analyze_financials(pf, engine, ticker="TEST")
    # A healthy company should not trigger critical flags.
    assert all(f.severity != "critical" for f in result.red_flags)


def test_distressed_industrial_triggers_net_loss_flag() -> None:
    pf = _distressed_industrial()
    engine = compute_for_period(pf)
    result = analyze_financials(pf, engine, ticker="DIST")
    codes = {f.code for f in result.red_flags}
    assert "NET_LOSS" in codes
    assert "LIQUIDITY_TIGHT" in codes


def test_industrial_highlights_include_gross_margin_and_roe() -> None:
    pf = _healthy_industrial()
    engine = compute_for_period(pf, market_cap=Decimal("2000"))
    result = analyze_financials(pf, engine, ticker="TEST")
    codes = {h.code for h in result.highlights}
    assert "GROSS_MARGIN" in codes
    assert "ROE" in codes
    assert "NET_MARGIN" in codes


# ---------- banking rules ----------

def test_bank_highlights_include_nim_and_cost_to_income() -> None:
    pf = _bank()
    engine = compute_for_period(pf)
    result = analyze_financials(pf, engine, ticker="BANK")
    codes = {h.code for h in result.highlights}
    assert "NIM" in codes
    assert "COST_TO_INCOME" in codes
    assert "BANK_ROE" in codes


def test_bank_does_not_emit_industrial_highlights() -> None:
    pf = _bank()
    engine = compute_for_period(pf)
    result = analyze_financials(pf, engine, ticker="BANK")
    codes = {h.code for h in result.highlights}
    # Industrial codes must not appear on bank output
    for forbidden in ("GROSS_MARGIN", "CCC", "FCF", "ALTMAN_Z"):
        assert forbidden not in codes


def test_bank_negative_nii_triggers_critical_flag() -> None:
    pf = _bank()
    pf.income_statement.net_interest_income = Decimal("-1000")
    engine = compute_for_period(pf)
    result = analyze_financials(pf, engine, ticker="SICKBANK")
    codes = {f.code for f in result.red_flags}
    assert "BANK_NII_NEGATIVE" in codes


# ---------- output shape ----------

def test_canonical_numbers_populated() -> None:
    pf = _healthy_industrial()
    engine = compute_for_period(pf, market_cap=Decimal("2000"))
    result = analyze_financials(pf, engine, ticker="TEST")
    assert result.canonical_numbers["total_assets"] == Decimal("1000")
    assert result.canonical_numbers["net_income"] == Decimal("150")


def test_output_schema_version_stable() -> None:
    pf = _healthy_industrial()
    engine = compute_for_period(pf)
    result = analyze_financials(pf, engine, ticker="TEST")
    assert result.schema_version == "1.0.0"


def test_period_label_format() -> None:
    pf = _bank()
    engine = compute_for_period(pf)
    result = analyze_financials(pf, engine, ticker="BANK")
    assert result.period_label == "Q3-2024"
