"""Wave 7 tests — valuation, strategic_synthesis, qa_review."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from financex.calculators.financial_engine import ValuationInputs
from financex.calculators.qa_review import review_analysis
from financex.calculators.strategic_synthesis import SynthesisInputs, synthesize
from financex.calculators.valuation import run_valuation
from financex.schemas.analysis import FinancialAnalysisOutput, MetricHighlight, RedFlag
from financex.schemas.base import Currency, ReportingPeriod, Sector
from financex.schemas.competition import MetricBenchmark, SectorComparisonReport
from financex.schemas.engine import EngineOutput
from financex.schemas.financials import (
    BalanceSheet,
    CashFlowStatement,
    IncomeStatement,
    PeriodFinancials,
)
from financex.schemas.reconciliation import ReconciliationCheck, ReconciliationReport


def _period(sector: Sector = Sector.INDUSTRIAL) -> PeriodFinancials:
    return PeriodFinancials(
        period=ReportingPeriod.FY,
        year=2024,
        currency=Currency.TRY,
        sector=sector,
        balance_sheet=BalanceSheet(
            total_assets=Decimal("1000"),
            total_liabilities=Decimal("400"),
            total_equity=Decimal("600"),
            cash_and_equivalents=Decimal("50"),
            short_term_debt=Decimal("50"),
            long_term_debt=Decimal("150"),
        ),
        income_statement=IncomeStatement(
            revenue=Decimal("1000"),
            net_income=Decimal("120"),
            ebitda=Decimal("250"),
            operating_income=Decimal("200"),
        ),
        cash_flow=CashFlowStatement(operating_cash_flow=Decimal("180"), capex=Decimal("-40")),
    )


def _fa(
    sector: Sector,
    highlights: list[MetricHighlight],
    red_flags: list[RedFlag] | None = None,
    canonical: dict[str, Decimal | None] | None = None,
) -> FinancialAnalysisOutput:
    return FinancialAnalysisOutput(
        ticker="T",
        period_label="FY-2024",
        sector=sector,
        computed_at=datetime.now(timezone.utc),
        engine=EngineOutput(),
        highlights=highlights,
        red_flags=red_flags or [],
        canonical_numbers=canonical or {},
    )


# ---------- valuation ----------

def test_valuation_flags_try_wacc_trap() -> None:
    pf = _period()
    inputs = ValuationInputs(
        wacc_override=Decimal("0.35"),
        fcf_projections=[Decimal("100")] * 5,
        terminal_growth=Decimal("0.03"),
    )
    out = run_valuation("TEST", pf, valuation_inputs=inputs, shares_outstanding=Decimal("100"))
    assert out.try_wacc_warning is True
    assert out.dcf is not None
    assert any("TRY WACC" in n for n in out.notes)


def test_valuation_skips_dcf_for_banks() -> None:
    pf = _period(Sector.BANKING)
    inputs = ValuationInputs(
        wacc_override=Decimal("0.18"),
        fcf_projections=[Decimal("100")] * 5,
        terminal_growth=Decimal("0.03"),
    )
    out = run_valuation("AKBNK", pf, valuation_inputs=inputs, shares_outstanding=Decimal("100"))
    assert out.dcf is None
    assert out.banking_sector_warning is True


def test_valuation_flags_holding_sotp() -> None:
    pf = _period(Sector.HOLDING)
    out = run_valuation("KCHOL", pf)
    assert out.holding_sotp_required is True


def test_valuation_peer_multiples_present_when_peers_supplied() -> None:
    pf = _period()
    peers = [
        _fa(Sector.INDUSTRIAL, [], canonical={"ebitda_margin": Decimal("20"), "net_margin": Decimal("10")}),
        _fa(Sector.INDUSTRIAL, [], canonical={"ebitda_margin": Decimal("25"), "net_margin": Decimal("12")}),
        _fa(Sector.INDUSTRIAL, [], canonical={"ebitda_margin": Decimal("18"), "net_margin": Decimal("8")}),
    ]
    out = run_valuation("T", pf, peers=peers)
    assert out.peer_ev_ebitda is not None
    assert out.peer_ev_ebitda.count == 3
    assert out.peer_ev_ebitda.median is not None


# ---------- strategic_synthesis ----------

def test_synthesis_positive_signals_from_healthy_company() -> None:
    fa = _fa(
        Sector.INDUSTRIAL,
        [
            MetricHighlight(code="ROE", label="ROE", value=Decimal("25"), unit="%"),
            MetricHighlight(code="NET_MARGIN", label="Net margin", value=Decimal("10"), unit="%"),
        ],
    )
    out = synthesize(SynthesisInputs(financial_analysis=fa, technical_trend="bullish"), ticker="HEALTHY")
    assert len(out.signals.positive) >= 2
    assert out.convergence_score > 0


def test_synthesis_negative_on_red_flags() -> None:
    fa = _fa(
        Sector.INDUSTRIAL,
        [MetricHighlight(code="NET_MARGIN", label="NM", value=Decimal("-5"), unit="%")],
        red_flags=[
            RedFlag(code="NET_LOSS", severity="critical", message="loss"),
            RedFlag(code="ALTMAN_DISTRESS", severity="warn", message="distress"),
        ],
    )
    out = synthesize(SynthesisInputs(financial_analysis=fa), ticker="SICK")
    assert len(out.signals.negative) >= 2
    assert out.convergence_score < 0


def test_synthesis_divergence_flagged_when_source_has_both_polarities() -> None:
    fa = _fa(
        Sector.INDUSTRIAL,
        [MetricHighlight(code="ROE", label="ROE", value=Decimal("20"), unit="%")],
        red_flags=[RedFlag(code="LIQUIDITY_TIGHT", severity="warn", message="x")],
    )
    out = synthesize(SynthesisInputs(financial_analysis=fa), ticker="MIX")
    # fundamental has BOTH positive (ROE) and negative (flag) entries
    assert any("fundamental" in d for d in out.divergences)


def test_synthesis_peer_signals_pulled_from_strengths_weaknesses() -> None:
    fa = _fa(Sector.INDUSTRIAL, [])
    peer = SectorComparisonReport(
        ticker="T",
        period_label="FY-2024",
        sector=Sector.INDUSTRIAL,
        computed_at=datetime.now(timezone.utc),
        peer_group=["A", "B"],
        benchmarks=[MetricBenchmark(metric_code="ROE", label="ROE")],
        strengths=["ROE"],
        weaknesses=["NET_DEBT_TO_EBITDA"],
    )
    out = synthesize(SynthesisInputs(financial_analysis=fa, peer_report=peer), ticker="T")
    sources = {s.source for s in out.signals.positive + out.signals.negative}
    assert "peer" in sources


# ---------- qa_review ----------

def test_qa_full_pass_on_healthy_output() -> None:
    fa = _fa(
        Sector.INDUSTRIAL,
        [
            MetricHighlight(code="ROE", label="ROE", value=Decimal("25"), unit="%", narrative_hint="x"),
            MetricHighlight(code="NET_MARGIN", label="NM", value=Decimal("12"), unit="%", narrative_hint="x"),
        ],
        canonical={"net_income": Decimal("100"), "revenue": Decimal("1000"), "roe": Decimal("25")},
    )
    rec = ReconciliationReport(
        ticker="T",
        period_label="FY-2024",
        checks=[
            ReconciliationCheck(code="BS_IDENTITY", name="x", passed=True, message="ok"),
            ReconciliationCheck(code="IS_GROSS_CHAIN", name="x", passed=True, message="ok"),
        ],
    )
    qa = review_analysis(fa, reconciliation=rec)
    assert qa.overall_pass is True
    assert qa.overall_score >= Decimal("0.7")


def test_qa_fails_on_missing_canonical_data() -> None:
    fa = _fa(
        Sector.INDUSTRIAL,
        [MetricHighlight(code="ROE", label="ROE", value=Decimal("20"), unit="%")],
        canonical={"net_income": None, "revenue": None, "roe": None},
    )
    qa = review_analysis(fa)
    assert qa.overall_pass is False
    assert any("EVIDENCE_SUFFICIENCY" in f for f in qa.quality_flags)


def test_qa_banking_requires_banking_core_highlights() -> None:
    fa = _fa(
        Sector.BANKING,
        [MetricHighlight(code="NIM", label="NIM", value=Decimal("3"), unit="%", narrative_hint="x")],
        canonical={"net_income": Decimal("100")},
    )
    qa = review_analysis(fa)
    completeness = next(d for d in qa.dimensions if d.code == "COMPLETENESS")
    # NIM is present but BANK_ROE + COST_TO_INCOME aren't → partial
    assert completeness.score < Decimal("1")
    assert completeness.score > Decimal("0")
