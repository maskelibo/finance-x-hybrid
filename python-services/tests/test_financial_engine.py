"""financial_engine unit tests — sector-aware math.

The end-to-end tests pin expected ratios against real KCHOL + AKBNK PDFs
(skipped if the fixture PDFs aren't present in /tmp).
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import pytest

from financex.calculators.financial_engine import (
    PiotroskiDeltas,
    ValuationInputs,
    compute_for_period,
)
from financex.parsers.financial_statements import parse_kap_pdf
from financex.schemas.base import Currency, ReportingPeriod, Sector
from financex.schemas.financials import (
    BalanceSheet,
    CashFlowStatement,
    IncomeStatement,
    PeriodFinancials,
)


# ---------- fixture helpers ----------

def _industrial_period() -> PeriodFinancials:
    return PeriodFinancials(
        period=ReportingPeriod.FY,
        year=2024,
        currency=Currency.TRY,
        sector=Sector.INDUSTRIAL,
        balance_sheet=BalanceSheet(
            total_assets=Decimal("1000"),
            total_liabilities=Decimal("600"),
            total_equity=Decimal("400"),
            current_assets=Decimal("400"),
            current_liabilities=Decimal("200"),
            cash_and_equivalents=Decimal("50"),
            trade_receivables=Decimal("100"),
            inventories=Decimal("80"),
            trade_payables=Decimal("60"),
            short_term_debt=Decimal("50"),
            long_term_debt=Decimal("150"),
        ),
        income_statement=IncomeStatement(
            revenue=Decimal("1000"),
            net_income=Decimal("100"),
            cost_of_sales=Decimal("-700"),
            gross_profit=Decimal("300"),
            operating_income=Decimal("150"),
            financial_expense=Decimal("-30"),
        ),
        cash_flow=CashFlowStatement(
            operating_cash_flow=Decimal("120"),
            capex=Decimal("-40"),
        ),
    )


def _bank_period() -> PeriodFinancials:
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


# ---------- industrial branch ----------

def test_industrial_gross_margin() -> None:
    engine = compute_for_period(_industrial_period())
    assert engine.ratios.gross_margin.value == Decimal("30.0000")


def test_industrial_net_margin() -> None:
    engine = compute_for_period(_industrial_period())
    assert engine.ratios.net_margin.value == Decimal("10.0000")


def test_industrial_roe() -> None:
    engine = compute_for_period(_industrial_period())
    assert engine.ratios.roe.value == Decimal("25.0000")


def test_industrial_roa() -> None:
    engine = compute_for_period(_industrial_period())
    assert engine.ratios.roa.value == Decimal("10.0000")


def test_industrial_working_capital_ccc() -> None:
    engine = compute_for_period(_industrial_period())
    # DSO = 100/1000*360 = 36 ; DIO = 80/700*360 = 41.14 ; DPO = 60/700*360 = 30.86
    # CCC = 36 + 41.14 - 30.86 = 46.28 (±rounding)
    ccc = engine.ratios.ccc.value
    assert ccc is not None
    assert Decimal("45") < ccc < Decimal("47")


def test_industrial_net_debt() -> None:
    engine = compute_for_period(_industrial_period())
    # ST + LT - Cash = 50 + 150 - 50 = 150
    assert engine.ratios.net_debt.value == Decimal("150")


def test_industrial_fcf() -> None:
    engine = compute_for_period(_industrial_period())
    # OCF - |CAPEX| = 120 - 40 = 80
    assert engine.ratios.fcf.value == Decimal("80")


def test_industrial_current_ratio() -> None:
    engine = compute_for_period(_industrial_period())
    # 400 / 200 = 2
    assert engine.ratios.current_ratio.value == Decimal("2.0000")


# ---------- banking branch ----------

def test_banking_nim_computed() -> None:
    """Banking slot: ebitda_margin = NIM = NII / Total Assets * 100"""
    engine = compute_for_period(_bank_period())
    # 50000 / 2000000 * 100 = 2.5
    assert engine.ratios.ebitda_margin.value == Decimal("2.5000")


def test_banking_cost_to_income() -> None:
    engine = compute_for_period(_bank_period())
    # |opex| / (NII + NFCI) = 25000 / (50000+20000) = 35.71%
    ci = engine.ratios.opex_to_revenue.value
    assert ci is not None
    assert Decimal("35") < ci < Decimal("36")


def test_banking_roe() -> None:
    engine = compute_for_period(_bank_period())
    # 30000 / 200000 = 15
    assert engine.ratios.roe.value == Decimal("15.0000")


def test_banking_has_no_gross_margin() -> None:
    """Banks don't have gross_profit → gross_margin should be absent/None."""
    engine = compute_for_period(_bank_period())
    assert engine.ratios.gross_margin is None or engine.ratios.gross_margin.value is None


def test_banking_altman_z_skipped() -> None:
    engine = compute_for_period(_bank_period())
    assert engine.scores.altman_z.value is None
    assert "not applicable to banks" in (engine.scores.altman_z.warning or "")


# ---------- Piotroski ----------

def test_piotroski_f_all_positive_signals_scores_9() -> None:
    deltas = PiotroskiDeltas(
        roa_delta=Decimal("0.02"),
        leverage_delta=Decimal("-0.01"),
        current_ratio_delta=Decimal("0.10"),
        new_shares_delta=Decimal("0"),
        gross_margin_delta=Decimal("0.02"),
        asset_turnover_delta=Decimal("0.05"),
    )
    engine = compute_for_period(_industrial_period(), piotroski_deltas=deltas)
    assert engine.scores.piotroski_f.value == Decimal("9")


def test_piotroski_f_default_deltas_partial_score() -> None:
    """With zero deltas, the signals that fire are:
      - net_income > 0
      - OCF > 0
      - OCF > NI
      - new_shares_delta <= 0  (0 satisfies the no-dilution test)
    → exactly 4 of 9.
    """
    engine = compute_for_period(_industrial_period())
    assert engine.scores.piotroski_f.value == Decimal("4")


# ---------- DCF ----------

def test_dcf_runs_and_returns_positive_value() -> None:
    pf = _industrial_period()
    engine = compute_for_period(
        pf,
        shares_outstanding=Decimal("100"),
        valuation=ValuationInputs(
            wacc_override=Decimal("0.15"),
            fcf_projections=[Decimal("100"), Decimal("110"), Decimal("120"), Decimal("130"), Decimal("140")],
            terminal_growth=Decimal("0.03"),
        ),
    )
    assert engine.dcf is not None
    assert engine.dcf.fair_value_per_share > 0
    # Sensitivity grid filled (5 wacc × 4 tg = 20 cells, filters for valid)
    assert len(engine.dcf.sensitivity) > 0


def test_dcf_rejects_terminal_growth_geq_wacc() -> None:
    engine = compute_for_period(
        _industrial_period(),
        shares_outstanding=Decimal("100"),
        valuation=ValuationInputs(
            wacc_override=Decimal("0.10"),
            fcf_projections=[Decimal("100")],
            terminal_growth=Decimal("0.10"),  # equal to wacc → invalid
        ),
    )
    assert engine.dcf is None


# ---------- End-to-end against real PDFs ----------

KCHOL_PDF = Path("/tmp/kchol_pdfs/KCHOL_financial_report_20241107_1355133.pdf")
AKBNK_PDF = Path("/tmp/akbnk_pdfs/AKBNK_financial_report_20241024_1350569.pdf")


@pytest.mark.skipif(not KCHOL_PDF.exists(), reason="KCHOL fixture missing")
def test_engine_on_real_kchol() -> None:
    parsed = parse_kap_pdf(KCHOL_PDF)
    engine = compute_for_period(
        parsed.period,
        market_cap=Decimal("546230000000"),
        shares_outstanding=Decimal("2535898050"),
    )
    # KCHOL 9A 2024 booked a loss → net_margin negative
    assert engine.ratios.net_margin.value < 0
    # ROE / ROA negative
    assert engine.ratios.roe.value < 0
    # Holding: Altman Z produced (industrial branch)
    assert engine.scores.altman_z.value is not None
    # Piotroski emits a score (may be partial but non-None)
    assert engine.scores.piotroski_f.value is not None


@pytest.mark.skipif(not AKBNK_PDF.exists(), reason="AKBNK fixture missing")
def test_engine_on_real_akbnk() -> None:
    parsed = parse_kap_pdf(AKBNK_PDF)
    engine = compute_for_period(
        parsed.period,
        market_cap=Decimal("325000000000"),
        shares_outstanding=Decimal("5200000000"),
    )
    # Banking branch: NIM in ebitda_margin slot, reasonable range for a Turkish bank
    nim = engine.ratios.ebitda_margin.value
    assert nim is not None
    assert Decimal("1") < nim < Decimal("10")
    # ROE positive and sensible for Q3 (9M — annualised would be higher)
    assert engine.ratios.roe.value > 0
    # Altman Z rejected for banks
    assert engine.scores.altman_z.value is None
