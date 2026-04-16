"""event_timeline_alert calculator — pure Python, deterministic.

Classifies each event into one of four phases based on `timing_days`
from a reference date, then surfaces priority alerts (IMMEDIATE + HIGH
materiality or must_happen on an IMMEDIATE calendar).
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Iterable

from financex.schemas.timeline import (
    EventForTimeline,
    Phase,
    PriorityAlert,
    Timeline,
    TimelineBucket,
    Urgency,
)

# Phase bounds in days, inclusive on the low side, exclusive on the high
# side — except LONG_TERM which uses [180, 365].
PHASE_RANGES: list[tuple[Phase, int, int]] = [
    (Phase.IMMEDIATE, 0, 30),
    (Phase.NEAR_TERM, 30, 90),
    (Phase.MEDIUM_TERM, 90, 180),
    (Phase.LONG_TERM, 180, 365),
]

# An event is "material" if it moves >= MATERIAL_THRESHOLD of a baseline.
MATERIAL_THRESHOLD = Decimal("0.05")  # 5%


def classify_phase(timing_days: int) -> Phase:
    """Map timing to one of the four phases.

    Past events (negative timing) fold into IMMEDIATE — the agent
    reports on freshly-landed news, not discarded history.
    Events beyond 365 days fold into LONG_TERM.
    """
    if timing_days < 30:
        return Phase.IMMEDIATE
    if timing_days < 90:
        return Phase.NEAR_TERM
    if timing_days < 180:
        return Phase.MEDIUM_TERM
    return Phase.LONG_TERM


def _is_material(event: EventForTimeline) -> bool:
    if event.materiality_pct is None:
        return False
    return event.materiality_pct >= MATERIAL_THRESHOLD


def _urgency_for(event: EventForTimeline, phase: Phase) -> Urgency:
    if phase == Phase.IMMEDIATE and (_is_material(event) or event.must_happen):
        return Urgency.HIGH
    if phase in (Phase.IMMEDIATE, Phase.NEAR_TERM) and _is_material(event):
        return Urgency.MEDIUM
    return Urgency.LOW


def _alert_reason(event: EventForTimeline, phase: Phase) -> str:
    bits: list[str] = [phase.value.upper()]
    if _is_material(event):
        pct = event.materiality_pct
        assert pct is not None
        bits.append(f">={pct:.1%} materiality")
    if event.must_happen:
        bits.append("on regulatory/corporate calendar")
    return " + ".join(bits)


def build_timeline(
    events: Iterable[EventForTimeline],
    *,
    reference_date: date,
) -> Timeline:
    """Bin events into four phase buckets and compute priority alerts.

    Order is preserved within each bucket (caller can pre-sort by timing
    or materiality if desired).
    """
    buckets: dict[Phase, TimelineBucket] = {
        phase: TimelineBucket(phase=phase, day_range=(lo, hi), events=[])
        for phase, lo, hi in PHASE_RANGES
    }

    alerts: list[PriorityAlert] = []

    for event in events:
        phase = classify_phase(event.timing_days)
        buckets[phase].events.append(event)
        urgency = _urgency_for(event, phase)
        if urgency != Urgency.LOW:
            alerts.append(
                PriorityAlert(
                    event_id=event.event_id,
                    title=event.title,
                    phase=phase,
                    urgency=urgency,
                    reason=_alert_reason(event, phase),
                )
            )

    return Timeline(
        reference_date=reference_date,
        buckets=[buckets[phase] for phase, _, _ in PHASE_RANGES],
        priority_alerts=alerts,
    )
