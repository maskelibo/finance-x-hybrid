"""event_timeline_alert calculator tests.

Covers:
  - each day-range mapping (boundary + off-by-one cases)
  - negative timing folds into IMMEDIATE
  - beyond 365 days folds into LONG_TERM
  - priority alerts fire on IMMEDIATE + material / must_happen
  - empty input produces four empty buckets
  - JSON roundtrip preserves Decimal materiality
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest

from financex.calculators.timeline import (
    MATERIAL_THRESHOLD,
    build_timeline,
    classify_phase,
)
from financex.schemas.timeline import (
    EventForTimeline,
    Phase,
    Timeline,
    Urgency,
)


# ---------- phase classification ----------

@pytest.mark.parametrize(
    "days, phase",
    [
        (-10, Phase.IMMEDIATE),
        (0, Phase.IMMEDIATE),
        (29, Phase.IMMEDIATE),
        (30, Phase.NEAR_TERM),
        (89, Phase.NEAR_TERM),
        (90, Phase.MEDIUM_TERM),
        (179, Phase.MEDIUM_TERM),
        (180, Phase.LONG_TERM),
        (365, Phase.LONG_TERM),
        (9999, Phase.LONG_TERM),
    ],
)
def test_classify_phase_boundaries(days: int, phase: Phase) -> None:
    assert classify_phase(days) == phase


# ---------- fixtures ----------

def _ev(
    event_id: str,
    timing_days: int,
    materiality: Decimal | None = None,
    must_happen: bool = False,
) -> EventForTimeline:
    return EventForTimeline(
        event_id=event_id,
        title=f"Event {event_id}",
        timing_days=timing_days,
        materiality_pct=materiality,
        must_happen=must_happen,
    )


# ---------- bucketing ----------

def test_empty_input_yields_four_empty_buckets() -> None:
    tl = build_timeline([], reference_date=date(2026, 4, 16))
    assert len(tl.buckets) == 4
    assert all(b.events == [] for b in tl.buckets)
    assert tl.priority_alerts == []


def test_events_land_in_correct_buckets() -> None:
    events = [
        _ev("A", 5),      # immediate
        _ev("B", 45),     # near-term
        _ev("C", 100),    # medium-term
        _ev("D", 200),    # long-term
    ]
    tl = build_timeline(events, reference_date=date(2026, 4, 16))
    assert [e.event_id for e in tl.bucket_for(Phase.IMMEDIATE).events] == ["A"]
    assert [e.event_id for e in tl.bucket_for(Phase.NEAR_TERM).events] == ["B"]
    assert [e.event_id for e in tl.bucket_for(Phase.MEDIUM_TERM).events] == ["C"]
    assert [e.event_id for e in tl.bucket_for(Phase.LONG_TERM).events] == ["D"]


def test_insertion_order_preserved() -> None:
    events = [_ev(str(i), 10 + i) for i in range(5)]
    tl = build_timeline(events, reference_date=date(2026, 4, 16))
    assert [e.event_id for e in tl.bucket_for(Phase.IMMEDIATE).events] == list("01234")


# ---------- priority alerts ----------

def test_immediate_plus_material_triggers_high_alert() -> None:
    ev = _ev("A", 5, materiality=Decimal("0.10"))
    tl = build_timeline([ev], reference_date=date(2026, 4, 16))
    assert len(tl.priority_alerts) == 1
    assert tl.priority_alerts[0].urgency == Urgency.HIGH
    assert tl.priority_alerts[0].phase == Phase.IMMEDIATE
    assert "IMMEDIATE" in tl.priority_alerts[0].reason
    assert "material" in tl.priority_alerts[0].reason.lower()


def test_immediate_plus_must_happen_triggers_high_alert() -> None:
    ev = _ev("A", 10, must_happen=True)
    tl = build_timeline([ev], reference_date=date(2026, 4, 16))
    assert len(tl.priority_alerts) == 1
    assert tl.priority_alerts[0].urgency == Urgency.HIGH
    assert "calendar" in tl.priority_alerts[0].reason.lower()


def test_near_term_material_is_medium_urgency() -> None:
    ev = _ev("A", 45, materiality=Decimal("0.10"))
    tl = build_timeline([ev], reference_date=date(2026, 4, 16))
    assert len(tl.priority_alerts) == 1
    assert tl.priority_alerts[0].urgency == Urgency.MEDIUM


def test_long_term_event_not_alerted() -> None:
    ev = _ev("A", 200, materiality=Decimal("0.20"))
    tl = build_timeline([ev], reference_date=date(2026, 4, 16))
    assert tl.priority_alerts == []


def test_immaterial_immediate_event_not_alerted() -> None:
    ev = _ev("A", 5, materiality=Decimal("0.01"))
    tl = build_timeline([ev], reference_date=date(2026, 4, 16))
    assert tl.priority_alerts == []


def test_material_threshold_exact_boundary_alerts() -> None:
    ev = _ev("A", 5, materiality=MATERIAL_THRESHOLD)
    tl = build_timeline([ev], reference_date=date(2026, 4, 16))
    assert len(tl.priority_alerts) == 1
    assert tl.priority_alerts[0].urgency == Urgency.HIGH


# ---------- JSON roundtrip ----------

def test_json_roundtrip_preserves_decimal() -> None:
    ev = _ev("A", 10, materiality=Decimal("0.1234"))
    tl = build_timeline([ev], reference_date=date(2026, 4, 16))
    rebuilt = Timeline.model_validate_json(tl.model_dump_json())
    ev_back = rebuilt.bucket_for(Phase.IMMEDIATE).events[0]
    assert ev_back.materiality_pct == Decimal("0.1234")
