"""Analyst consensus — broker target prices, ratings, revisions."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from enum import Enum

from pydantic import Field

from financex.schemas.base import FinancexModel


class Recommendation(str, Enum):
    BUY = "buy"
    OUTPERFORM = "outperform"
    HOLD = "hold"
    UNDERPERFORM = "underperform"
    SELL = "sell"
    NOT_RATED = "not_rated"


class AnalystReport(FinancexModel):
    """One broker's note."""

    broker: str
    report_date: date
    recommendation: Recommendation
    target_price: Decimal | None = None
    currency: str = "TRY"

    # Optional
    analyst_name: str | None = None
    notes: str | None = Field(default=None, max_length=2000)
    url: str | None = None
    upside_pct: Decimal | None = None


class AnalystConsensus(FinancexModel):
    """Aggregated broker view. Python computes means/medians; LLM later
    summarizes SELL rationales."""

    reports: list[AnalystReport] = Field(default_factory=list)

    # Derived stats — all optional until the aggregator runs.
    count: int | None = Field(default=None, ge=0)
    target_price_mean: Decimal | None = None
    target_price_median: Decimal | None = None
    target_price_high: Decimal | None = None
    target_price_low: Decimal | None = None
    target_price_stddev: Decimal | None = None
    upside_vs_last_close_pct: Decimal | None = None

    distribution_buy: int | None = Field(default=None, ge=0)
    distribution_hold: int | None = Field(default=None, ge=0)
    distribution_sell: int | None = Field(default=None, ge=0)

    revision_trend: str | None = Field(default=None, description="'rising' | 'falling' | 'stable'")
