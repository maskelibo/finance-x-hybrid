"""sector_competition tests — quartile math, sector dispatch, strengths/weaknesses."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from financex.calculators.sector_competition import compare_with_peers
from financex.schemas.analysis import FinancialAnalysisOutput, MetricHighlight
from financex.schemas.base import Sector
from financex.schemas.engine import EngineOutput


def _mk_report(
    ticker: str, sector: Sector, metrics: dict[str, Decimal]
) -> FinancialAnalysisOutput:
    highlights = [
        MetricHighlight(code=code, label=code, value=value, unit="%")
        for code, value in metrics.items()
    ]
    return FinancialAnalysisOutput(
        ticker=ticker,
        period_label="FY-2024",
        sector=sector,
        computed_at=datetime.now(timezone.utc),
        engine=EngineOutput(),
        highlights=highlights,
    )


# ---------- Industrial benchmark ----------

def test_industrial_benchmark_ranks_best_gross_margin() -> None:
    company = _mk_report("BEST", Sector.INDUSTRIAL, {"GROSS_MARGIN": Decimal("35")})
    peers = [
        _mk_report("A", Sector.INDUSTRIAL, {"GROSS_MARGIN": Decimal("25")}),
        _mk_report("B", Sector.INDUSTRIAL, {"GROSS_MARGIN": Decimal("20")}),
        _mk_report("C", Sector.INDUSTRIAL, {"GROSS_MARGIN": Decimal("15")}),
    ]
    report = compare_with_peers(company, peers)
    gm = next(b for b in report.benchmarks if b.metric_code == "GROSS_MARGIN")
    assert gm.company_rank == 1
    assert gm.quartile == 1
    assert gm.max_value == Decimal("35")
    assert gm.min_value == Decimal("15")
    assert "GROSS_MARGIN" in report.strengths


def test_industrial_benchmark_bottom_quartile_goes_to_weaknesses() -> None:
    company = _mk_report("WORST", Sector.INDUSTRIAL, {"NET_MARGIN": Decimal("-5")})
    peers = [
        _mk_report("A", Sector.INDUSTRIAL, {"NET_MARGIN": Decimal("10")}),
        _mk_report("B", Sector.INDUSTRIAL, {"NET_MARGIN": Decimal("8")}),
        _mk_report("C", Sector.INDUSTRIAL, {"NET_MARGIN": Decimal("6")}),
    ]
    report = compare_with_peers(company, peers)
    nm = next(b for b in report.benchmarks if b.metric_code == "NET_MARGIN")
    assert nm.quartile == 4
    assert "NET_MARGIN" in report.weaknesses


def test_lower_is_better_inverts_ranking() -> None:
    # Net debt / EBITDA: lower is better
    company = _mk_report("CLEAN", Sector.INDUSTRIAL, {"NET_DEBT_TO_EBITDA": Decimal("0.5")})
    peers = [
        _mk_report("A", Sector.INDUSTRIAL, {"NET_DEBT_TO_EBITDA": Decimal("3")}),
        _mk_report("B", Sector.INDUSTRIAL, {"NET_DEBT_TO_EBITDA": Decimal("4")}),
        _mk_report("C", Sector.INDUSTRIAL, {"NET_DEBT_TO_EBITDA": Decimal("5")}),
    ]
    report = compare_with_peers(company, peers)
    nd = next(b for b in report.benchmarks if b.metric_code == "NET_DEBT_TO_EBITDA")
    assert nd.company_rank == 1  # lowest leverage = best
    assert nd.quartile == 1


def test_missing_metric_gracefully_reports_blank() -> None:
    company = _mk_report("SOLO", Sector.INDUSTRIAL, {})
    peers = []
    report = compare_with_peers(company, peers)
    for b in report.benchmarks:
        assert b.company_value is None
        assert b.company_rank is None


# ---------- Banking benchmark ----------

def test_banking_uses_banking_metrics() -> None:
    company = _mk_report("AKBNK", Sector.BANKING, {"NIM": Decimal("3"), "BANK_ROE": Decimal("20")})
    peers = [
        _mk_report("GARAN", Sector.BANKING, {"NIM": Decimal("2.5"), "BANK_ROE": Decimal("18")}),
        _mk_report("ISCTR", Sector.BANKING, {"NIM": Decimal("2.8"), "BANK_ROE": Decimal("22")}),
    ]
    report = compare_with_peers(company, peers)
    codes = {b.metric_code for b in report.benchmarks}
    assert codes == {"NIM", "BANK_ROE", "BANK_ROA", "COST_TO_INCOME", "LLP_NII_BURDEN"}


def test_banking_cost_to_income_lower_is_better() -> None:
    company = _mk_report("EFFICIENT", Sector.BANKING, {"COST_TO_INCOME": Decimal("35")})
    peers = [
        _mk_report("A", Sector.BANKING, {"COST_TO_INCOME": Decimal("50")}),
        _mk_report("B", Sector.BANKING, {"COST_TO_INCOME": Decimal("55")}),
        _mk_report("C", Sector.BANKING, {"COST_TO_INCOME": Decimal("60")}),
    ]
    report = compare_with_peers(company, peers)
    ci = next(b for b in report.benchmarks if b.metric_code == "COST_TO_INCOME")
    assert ci.company_rank == 1  # lowest = best
    assert ci.quartile == 1


# ---------- Output shape ----------

def test_report_sets_peer_group_tickers() -> None:
    company = _mk_report("ME", Sector.INDUSTRIAL, {"ROE": Decimal("20")})
    peers = [
        _mk_report("A", Sector.INDUSTRIAL, {"ROE": Decimal("10")}),
        _mk_report("B", Sector.INDUSTRIAL, {"ROE": Decimal("15")}),
    ]
    report = compare_with_peers(company, peers)
    assert report.peer_group == ["A", "B"]


def test_report_schema_version() -> None:
    company = _mk_report("X", Sector.INDUSTRIAL, {"ROE": Decimal("1")})
    report = compare_with_peers(company, [])
    assert report.schema_version == "1.0.0"
