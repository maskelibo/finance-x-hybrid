"""Phase 7 FULL — multi-PDF / 5-year extraction unit tests.

Validates the deterministic interface only — does NOT exercise
parse_kap_pdf with real PDFs (those tests live in test_parse_financials).
Synthesizes ParsedFinancials fixtures to test:

  - collect_annual_periods rejects interim periods (Q1/H1/Q3).
  - collect_annual_periods dedupes same-year entries deterministically
    (highest-score wins).
  - analyze_multi_pdf assembles canonical_numbers.__historical__ with
    every distinct annual year.
  - analyze_multi_pdf raises when no annual data is collectable.
  - <5 annual years collected → output still emitted; 5Y gate is on
    the report side, not on the analyzer side.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal

import pytest

from financex.calculators.financial_analysis import (
    analyze_multi_pdf,
    collect_annual_periods,
    _period_score,
)
from financex.calculators.financial_engine import compute_for_period
from financex.schemas.base import Currency, Sector
from financex.schemas.financials import (
    BalanceSheet,
    CashFlowStatement,
    IncomeStatement,
    PeriodFinancials,
    ReportingPeriod,
    SourceRef,
)
from datetime import UTC, datetime


def _make_period(year: int, period: ReportingPeriod, *, revenue: int = 100_000,
                 net_income: int = 10_000, total_assets: int = 500_000,
                 total_equity: int = 200_000, total_liabilities: int = 300_000,
                 score_boost: int = 0) -> PeriodFinancials:
    """Build a PeriodFinancials fixture with a given year/period."""
    bs = BalanceSheet(
        total_assets=Decimal(total_assets),
        total_liabilities=Decimal(total_liabilities),
        total_equity=Decimal(total_equity),
        cash=Decimal(50_000) if score_boost > 0 else None,
        trade_receivables=Decimal(40_000) if score_boost > 1 else None,
        inventories=Decimal(30_000) if score_boost > 2 else None,
    )
    is_ = IncomeStatement(
        revenue=Decimal(revenue),
        net_income=Decimal(net_income),
        gross_profit=Decimal(int(revenue * 0.3)) if score_boost > 0 else None,
        operating_income=Decimal(int(revenue * 0.15)) if score_boost > 1 else None,
        ebitda=Decimal(int(revenue * 0.20)) if score_boost > 2 else None,
    )
    cf = CashFlowStatement(operating_cash_flow=Decimal(int(net_income * 1.5))) if score_boost > 0 else None
    return PeriodFinancials(
        period=period, year=year, currency=Currency.TRY, sector=Sector.INDUSTRIAL,
        balance_sheet=bs, income_statement=is_, cash_flow=cf, equity_change=None,
        sources=[SourceRef(source_id="test", url="", fetched_at=datetime.now(UTC), detail="fixture")],
    )


@dataclass
class _ParsedFixture:
    """Lightweight ParsedFinancials stand-in with .period and .prior_period."""
    period: PeriodFinancials
    prior_period: PeriodFinancials | None = None


# ---------- _period_score ----------

def test_period_score_increases_with_more_populated_fields() -> None:
    minimal = _make_period(2024, ReportingPeriod.FY, score_boost=0)
    rich = _make_period(2024, ReportingPeriod.FY, score_boost=3)
    assert _period_score(rich) > _period_score(minimal)


# ---------- collect_annual_periods ----------

def test_collect_annual_rejects_interim_periods() -> None:
    fy2024 = _make_period(2024, ReportingPeriod.FY)
    h1_2024 = _make_period(2024, ReportingPeriod.H1)
    q3_2024 = _make_period(2024, ReportingPeriod.Q3)
    parsed = [_ParsedFixture(period=fy2024), _ParsedFixture(period=h1_2024),
              _ParsedFixture(period=q3_2024)]
    out = collect_annual_periods(parsed)
    assert set(out.keys()) == {2024}
    assert out[2024].period == ReportingPeriod.FY


def test_collect_annual_aggregates_across_pdfs_via_prior_columns() -> None:
    # PDF A: current FY-2025 + prior FY-2024
    # PDF B: current FY-2024 + prior FY-2023
    # PDF C: current FY-2022 (no prior)
    pdf_a = _ParsedFixture(
        period=_make_period(2025, ReportingPeriod.FY, revenue=300),
        prior_period=_make_period(2024, ReportingPeriod.FY, revenue=200, score_boost=0),
    )
    pdf_b = _ParsedFixture(
        period=_make_period(2024, ReportingPeriod.FY, revenue=210, score_boost=3),  # higher score → wins dedup
        prior_period=_make_period(2023, ReportingPeriod.FY, revenue=180),
    )
    pdf_c = _ParsedFixture(period=_make_period(2022, ReportingPeriod.FY, revenue=150))
    out = collect_annual_periods([pdf_a, pdf_b, pdf_c])
    assert sorted(out.keys()) == [2022, 2023, 2024, 2025]
    # Dedup winner for FY-2024: pdf_b's high-score version (revenue=210)
    assert out[2024].income_statement.revenue == Decimal(210)


def test_collect_annual_dedup_is_deterministic() -> None:
    """Same year, same data score → first-seen kept (stable iteration)."""
    fy_a = _make_period(2024, ReportingPeriod.FY, revenue=100)
    fy_b = _make_period(2024, ReportingPeriod.FY, revenue=200)
    parsed = [_ParsedFixture(period=fy_a), _ParsedFixture(period=fy_b)]
    out = collect_annual_periods(parsed)
    assert len(out) == 1
    # When scores tie, the >  comparison keeps the first-seen entry (fy_a).
    assert out[2024].income_statement.revenue == Decimal(100)


def test_collect_annual_empty_when_no_inputs() -> None:
    assert collect_annual_periods([]) == {}


def test_collect_annual_skips_periods_with_none_year() -> None:
    pf_no_year = _make_period(2024, ReportingPeriod.FY)
    # Force year to None to simulate parser failure
    pf_no_year = pf_no_year.model_copy(update={"year": None})
    out = collect_annual_periods([_ParsedFixture(period=pf_no_year)])
    assert out == {}


# ---------- analyze_multi_pdf ----------

def test_analyze_multi_pdf_rejects_interim_only_inputs() -> None:
    h1 = _make_period(2024, ReportingPeriod.H1)
    parsed = [_ParsedFixture(period=h1)]
    with pytest.raises(ValueError, match="no annual periods"):
        analyze_multi_pdf(parsed, {}, ticker="EREGL")


def test_analyze_multi_pdf_assembles_historical_block() -> None:
    fy2025 = _make_period(2025, ReportingPeriod.FY, revenue=300, score_boost=3)
    fy2024 = _make_period(2024, ReportingPeriod.FY, revenue=250, score_boost=2)
    fy2023 = _make_period(2023, ReportingPeriod.FY, revenue=200, score_boost=2)
    parsed = [
        _ParsedFixture(period=fy2025, prior_period=fy2024),
        _ParsedFixture(period=fy2023),
    ]
    engines = {
        2025: compute_for_period(fy2025),
        2024: compute_for_period(fy2024),
        2023: compute_for_period(fy2023),
    }
    out = analyze_multi_pdf(parsed, engines, ticker="EREGL")
    # Current period is the most recent annual year
    assert out.period_label == "FY-2025"
    # Historical block contains the other two years (FY-2024, FY-2023)
    historical = out.canonical_numbers.get("__historical__")
    assert historical is not None
    assert isinstance(historical, dict)
    assert sorted(historical.keys()) == ["FY-2023", "FY-2024"]
    assert historical["FY-2024"]["revenue"] == Decimal(250)
    assert historical["FY-2023"]["revenue"] == Decimal(200)


def test_analyze_multi_pdf_under_five_periods_emits_partial_output() -> None:
    """The 5Y gate lives on the report side. analyze_multi_pdf still
    emits whatever annual periods are available."""
    fy2025 = _make_period(2025, ReportingPeriod.FY, revenue=300, score_boost=3)
    parsed = [_ParsedFixture(period=fy2025)]
    engines = {2025: compute_for_period(fy2025)}
    out = analyze_multi_pdf(parsed, engines, ticker="ASELS")
    assert out.period_label == "FY-2025"
    historical = out.canonical_numbers.get("__historical__")
    # No prior_period → no historical block emitted
    assert historical in (None, {})


# ---------- 5Y coverage assembly via prior-column extraction ----------

def test_two_pdfs_with_prior_columns_yield_four_periods() -> None:
    """Each PDF gives 2 periods via comparative columns. 2 PDFs cover 4
    periods if the years don't overlap; with overlap, dedup kicks in."""
    # PDF 1: FY-2025 (current) + FY-2024 (prior)
    pdf1 = _ParsedFixture(
        period=_make_period(2025, ReportingPeriod.FY, score_boost=3),
        prior_period=_make_period(2024, ReportingPeriod.FY, score_boost=2),
    )
    # PDF 2: FY-2023 (current) + FY-2022 (prior)
    pdf2 = _ParsedFixture(
        period=_make_period(2023, ReportingPeriod.FY, score_boost=3),
        prior_period=_make_period(2022, ReportingPeriod.FY, score_boost=2),
    )
    out = collect_annual_periods([pdf1, pdf2])
    assert sorted(out.keys()) == [2022, 2023, 2024, 2025]


def test_three_pdfs_yield_five_year_coverage() -> None:
    # PDF 1: FY-2025 + FY-2024
    # PDF 2: FY-2023 + FY-2022
    # PDF 3: FY-2021 + FY-2020 (would yield 6 unique years)
    pdfs = [
        _ParsedFixture(
            period=_make_period(2025, ReportingPeriod.FY),
            prior_period=_make_period(2024, ReportingPeriod.FY),
        ),
        _ParsedFixture(
            period=_make_period(2023, ReportingPeriod.FY),
            prior_period=_make_period(2022, ReportingPeriod.FY),
        ),
        _ParsedFixture(
            period=_make_period(2021, ReportingPeriod.FY),
            prior_period=_make_period(2020, ReportingPeriod.FY),
        ),
    ]
    out = collect_annual_periods(pdfs)
    assert len(out) == 6
    assert 2025 in out and 2020 in out
    # The directive's 5Y minimum (FY2021-FY2025) is satisfied.
    fy_2021_to_2025 = {y for y in out if 2021 <= y <= 2025}
    assert len(fy_2021_to_2025) == 5
