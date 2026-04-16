"""sector_competition — peer quartile benchmarking.

Input: target FinancialAnalysisOutput + list of peer FinancialAnalysisOutputs.
Output: SectorComparisonReport — per-metric min/Q1/median/Q3/max + the
target's rank + quartile, plus coarse strengths/weaknesses lists.

Porter Five Forces and qualitative SWOT stay on the LLM side; this
module only does the arithmetic.
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from financex.schemas.analysis import FinancialAnalysisOutput
from financex.schemas.base import Sector
from financex.schemas.competition import MetricBenchmark, SectorComparisonReport


# ---------------------------------------------------------------------
# Metric catalogue per sector
# ---------------------------------------------------------------------

@dataclass(frozen=True)
class _Metric:
    code: str          # MetricHighlight.code expected on FinancialAnalysisOutput.highlights
    label: str
    unit: str
    higher_is_better: bool


INDUSTRIAL_METRICS: tuple[_Metric, ...] = (
    _Metric("GROSS_MARGIN", "Gross margin", "%", higher_is_better=True),
    _Metric("EBITDA_MARGIN", "EBITDA margin", "%", higher_is_better=True),
    _Metric("NET_MARGIN", "Net margin", "%", higher_is_better=True),
    _Metric("ROE", "Return on equity", "%", higher_is_better=True),
    _Metric("NET_DEBT_TO_EBITDA", "Net debt / EBITDA", "ratio", higher_is_better=False),
    _Metric("CCC", "Cash conversion cycle", "days", higher_is_better=False),
    _Metric("ALTMAN_Z", "Altman Z-score", "score", higher_is_better=True),
    _Metric("PIOTROSKI_F", "Piotroski F-score", "score", higher_is_better=True),
)

BANKING_METRICS: tuple[_Metric, ...] = (
    _Metric("NIM", "Net Interest Margin", "%", higher_is_better=True),
    _Metric("BANK_ROE", "Banking ROE", "%", higher_is_better=True),
    _Metric("BANK_ROA", "Banking ROA", "%", higher_is_better=True),
    _Metric("COST_TO_INCOME", "Cost/Income", "%", higher_is_better=False),
    _Metric("LLP_NII_BURDEN", "Loan-loss provisions / NII", "%", higher_is_better=False),
)


def _metrics_for_sector(sector: Sector) -> tuple[_Metric, ...]:
    if sector == Sector.BANKING:
        return BANKING_METRICS
    return INDUSTRIAL_METRICS


# ---------------------------------------------------------------------
# Helpers — pull a metric value out of a FinancialAnalysisOutput
# ---------------------------------------------------------------------

def _metric_value(report: FinancialAnalysisOutput, code: str) -> Decimal | None:
    for h in report.highlights:
        if h.code == code:
            return h.value
    return None


def _quartile_of(value: Decimal, sorted_values: list[Decimal], higher_is_better: bool) -> int:
    """Return 1-4 quartile for `value` within `sorted_values`.

    Values are treated as placed on the sorted list (ascending). When
    higher is better we invert so rank 1 = top performer.
    """
    if not sorted_values:
        return 4
    try:
        pos = sorted_values.index(value)
    except ValueError:
        # Value not exactly in list (rounding) — fall back to rank by comparison.
        pos = sum(1 for v in sorted_values if v < value)
    pct = (pos + 0.5) / len(sorted_values)  # 0..1
    if higher_is_better:
        pct = 1 - pct
    if pct <= 0.25:
        return 1
    if pct <= 0.5:
        return 2
    if pct <= 0.75:
        return 3
    return 4


def _rank_of(value: Decimal, all_values: list[Decimal], higher_is_better: bool) -> int:
    """1-indexed rank. 1 = best."""
    sorted_values = sorted(all_values, reverse=higher_is_better)
    for i, v in enumerate(sorted_values, start=1):
        if v == value:
            return i
    return len(sorted_values)


def _quartiles(values: list[Decimal]) -> tuple[Decimal, Decimal, Decimal]:
    """Return (Q1, median, Q3). Requires at least 2 values."""
    floats = [float(v) for v in values]
    q = statistics.quantiles(floats, n=4, method="inclusive") if len(floats) >= 2 else [floats[0], floats[0], floats[0]]
    return (
        Decimal(str(round(q[0], 4))),
        Decimal(str(round(q[1], 4))),
        Decimal(str(round(q[2], 4))),
    )


# ---------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------

def compare_with_peers(
    company: FinancialAnalysisOutput,
    peers: list[FinancialAnalysisOutput],
) -> SectorComparisonReport:
    """Build a quartile benchmark report for `company` vs the peer group.

    Peers should be the same sector. Different-sector peers are silently
    tolerated but the result will be misleading.
    """
    sector = company.sector
    metrics = _metrics_for_sector(sector)

    benchmarks: list[MetricBenchmark] = []
    strengths: list[str] = []
    weaknesses: list[str] = []

    for metric in metrics:
        company_value = _metric_value(company, metric.code)
        peer_values: list[Decimal] = []
        for peer in peers:
            v = _metric_value(peer, metric.code)
            if v is not None:
                peer_values.append(v)

        all_values = list(peer_values)
        if company_value is not None:
            all_values.append(company_value)

        if not all_values:
            benchmarks.append(MetricBenchmark(
                metric_code=metric.code,
                label=metric.label,
                unit=metric.unit,
                higher_is_better=metric.higher_is_better,
                peer_count=len(peers),
            ))
            continue

        sorted_values = sorted(all_values)
        q1, median, q3 = _quartiles(all_values) if len(all_values) >= 2 else (sorted_values[0], sorted_values[0], sorted_values[0])

        quartile: int | None = None
        rank: int | None = None
        if company_value is not None:
            quartile = _quartile_of(company_value, sorted_values, metric.higher_is_better)
            rank = _rank_of(company_value, all_values, metric.higher_is_better)
            if quartile == 1:
                strengths.append(metric.code)
            elif quartile == 4:
                weaknesses.append(metric.code)

        benchmarks.append(MetricBenchmark(
            metric_code=metric.code,
            label=metric.label,
            unit=metric.unit,
            higher_is_better=metric.higher_is_better,
            company_value=company_value,
            min_value=sorted_values[0],
            q1=q1,
            median=median,
            q3=q3,
            max_value=sorted_values[-1],
            company_rank=rank,
            peer_count=len(peers),
            quartile=quartile,
        ))

    return SectorComparisonReport(
        ticker=company.ticker,
        period_label=company.period_label,
        sector=sector,
        computed_at=datetime.now(UTC),
        peer_group=[p.ticker for p in peers],
        benchmarks=benchmarks,
        strengths=strengths,
        weaknesses=weaknesses,
    )
