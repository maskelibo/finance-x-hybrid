"""Schemas for sector_competition — peer benchmarking output.

The Python runner aggregates peer FinancialAnalysisOutput objects, computes
quartile distributions per metric, and reports where the target ticker
lands. The LLM then writes the Porter/SWOT narrative over these numbers.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import Field

from financex.schemas.base import FinancexModel, Sector


class MetricBenchmark(FinancexModel):
    """One metric compared across the peer group (target company included)."""

    metric_code: str
    label: str
    unit: str = "%"
    higher_is_better: bool = True

    company_value: Decimal | None = None
    min_value: Decimal | None = None
    q1: Decimal | None = None
    median: Decimal | None = None
    q3: Decimal | None = None
    max_value: Decimal | None = None

    company_rank: int | None = Field(default=None, description="1 = best; None = missing")
    peer_count: int = 0
    quartile: int | None = Field(
        default=None, description="1 = top quartile, 4 = bottom quartile"
    )


class SectorComparisonReport(FinancexModel):
    """Full peer-benchmark report for one ticker."""

    ticker: str
    period_label: str
    sector: Sector
    computed_at: datetime

    peer_group: list[str] = Field(default_factory=list)
    benchmarks: list[MetricBenchmark] = Field(default_factory=list)

    # Metric codes where company lands in Q1 / Q4 — handy for LLM Porter narrative.
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)

    schema_version: str = "1.0.0"
