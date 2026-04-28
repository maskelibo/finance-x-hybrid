"""Schemas for the financial_analysis hybrid runner.

The Python side produces a deterministic FinancialAnalysisOutput — every
derived number and every structural observation the LLM needs. The LLM
then writes the narrative over this canonical package, never recomputing
anything the engine already did.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import Field

from financex.schemas.base import FinancexModel, Sector
from financex.schemas.engine import EngineOutput


class MetricHighlight(FinancexModel):
    """One numeric observation worth calling out in the report."""

    code: str = Field(description="Stable id, e.g. 'ROE_STRONG', 'CCC_NEGATIVE'.")
    label: str = Field(description="Human label, e.g. 'ROE is 14.3% — above sector median'.")
    value: Decimal | None = None
    unit: str = Field(default="%", description="'%' | 'TL' | 'days' | 'ratio' | 'score'.")
    narrative_hint: str | None = Field(
        default=None,
        description="Hint for the LLM: what angle to take when writing about this metric.",
    )


class RedFlag(FinancexModel):
    """A specific risk signal spotted by rule-based analysis."""

    code: str
    severity: str = Field(description="'info' | 'warn' | 'critical'")
    message: str


class TrendPoint(FinancexModel):
    """One data-point in a multi-period trend series."""

    period_label: str = Field(description="e.g. 'FY2023', 'Q3-2024'.")
    value: Decimal | None = None


class Trend(FinancexModel):
    """A single metric tracked across periods (oldest first)."""

    metric: str
    points: list[TrendPoint] = Field(default_factory=list)
    direction: str | None = Field(
        default=None, description="'up' | 'down' | 'flat' — coarse shape from first→last."
    )


class FinancialAnalysisOutput(FinancexModel):
    """Canonical hand-off from Python engine layer to the LLM analyst.

    Every LLM agent downstream (financial_analysis, strategic_synthesis,
    final_summary) reads this. They never recompute — they only pick
    which angles to emphasise in the narrative.
    """

    ticker: str
    period_label: str
    sector: Sector
    computed_at: datetime

    engine: EngineOutput
    highlights: list[MetricHighlight] = Field(default_factory=list)
    red_flags: list[RedFlag] = Field(default_factory=list)
    trends: list[Trend] = Field(default_factory=list)

    # Carry the numbers used so the LLM can double-check or quote them.
    # Phase 7 FULL — values may be Decimal, None, OR a nested dict
    # (used by `__historical__` to embed multi-period FY-YYYY blocks).
    # Schema relaxed to `Any` to keep backward-compat while allowing
    # multi-period embedding without a separate field.
    canonical_numbers: dict[str, Any] = Field(
        default_factory=dict,
        description="Flat dict of key-metric → latest value, for easy LLM quoting. "
                    "Phase 7+ may include __historical__: {FY-YYYY: {...}} for multi-period.",
    )

    schema_version: str = "1.1.0"
