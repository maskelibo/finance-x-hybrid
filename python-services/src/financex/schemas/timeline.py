"""Schemas for the event_timeline_alert agent.

Inputs (EventForTimeline): lightweight event descriptors produced by
upstream event_impact_mapper. Each event carries its own timing and
materiality so the bucketer can run with no extra context.

Outputs (Timeline): events binned into four phases plus a flat list of
priority alerts (IMMEDIATE + HIGH materiality).
"""

from __future__ import annotations

from datetime import date
from enum import Enum

from pydantic import Field

from financex.schemas.base import Confidence, FinancexModel, Ratio


class Phase(str, Enum):
    """Four-phase timeline buckets in days from the reference date."""

    IMMEDIATE = "immediate"    # 0–30 d
    NEAR_TERM = "near_term"    # 30–90 d
    MEDIUM_TERM = "medium_term"  # 90–180 d
    LONG_TERM = "long_term"    # 180–365 d


class Urgency(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class EventForTimeline(FinancexModel):
    """Minimal description of one event fed into the bucketer."""

    event_id: str = Field(description="Stable id, e.g. 'KAP-1234567' or 'EPDK-202604-01'.")
    title: str
    timing_days: int = Field(
        description="Days from the reference date until the event materialises. "
        "Negative values (past events) are clamped to IMMEDIATE.",
    )

    # --- optional -------------------------------------------------------
    summary: str | None = None
    event_type: str | None = Field(
        default=None,
        description="Taxonomy tag from event_classification (debt_issuance, capex_decision, ...).",
    )
    materiality_pct: Ratio | None = Field(
        default=None,
        description="Impact magnitude as % of a baseline (revenue/equity/market-cap).",
    )
    confidence: Confidence = Confidence.UNKNOWN
    source_url: str | None = None
    must_happen: bool = Field(
        default=False,
        description="True when the event is on a regulatory/corporate calendar (e.g. AGM, scheduled coupon, EPDK review).",
    )


class PriorityAlert(FinancexModel):
    """Surfaced on the top of the timeline — high urgency + material."""

    event_id: str
    title: str
    phase: Phase
    urgency: Urgency
    reason: str = Field(description="Why this bubbled up (e.g. 'IMMEDIATE and >5% EBITDA impact').")


class TimelineBucket(FinancexModel):
    phase: Phase
    day_range: tuple[int, int] = Field(description="[low, high] inclusive bounds in days.")
    events: list[EventForTimeline] = Field(default_factory=list)


class Timeline(FinancexModel):
    """Result of the bucketer. Four buckets always present (possibly empty)."""

    reference_date: date
    buckets: list[TimelineBucket]
    priority_alerts: list[PriorityAlert] = Field(default_factory=list)

    def bucket_for(self, phase: Phase) -> TimelineBucket:
        for b in self.buckets:
            if b.phase == phase:
                return b
        raise KeyError(phase)
