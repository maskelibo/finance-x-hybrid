"""event_classification + event_impact_mapper — rule coverage + template routing."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from financex.calculators.event_classification import (
    classify_event,
    classify_events,
)
from financex.calculators.event_impact_mapper import (
    map_event_impact,
    map_events,
)
from financex.schemas.base import Confidence
from financex.schemas.kap import KapEvent


def _evt(title: str, *, summary: str | None = None, idx: str = "K-1") -> KapEvent:
    return KapEvent(
        disclosure_id=idx,
        ticker="KCHOL",
        announced_at=datetime(2026, 4, 1, tzinfo=timezone.utc),
        title=title,
        url=f"https://kap.org.tr/Bildirim/{idx}",
        summary=summary,
    )


# ---------- classification ----------

def test_classify_dividend_high_confidence() -> None:
    c = classify_event(_evt("2025 Yılı Temettü Dağıtımı"))
    assert c.primary_type == "dividend"
    assert c.confidence == Confidence.HIGH


def test_classify_debt_issuance() -> None:
    c = classify_event(_evt("Tahvil İhracı Kararı"))
    assert c.primary_type == "debt_issuance"


def test_classify_m_and_a() -> None:
    c = classify_event(_evt("Satın Alma Anlaşması İmzalandı"))
    assert c.primary_type == "m_and_a"


def test_classify_capex_decision_from_investment_keyword() -> None:
    c = classify_event(_evt("Yeni Tesis Yatırım Kararı"))
    assert c.primary_type == "capex_decision"


def test_classify_regulatory() -> None:
    c = classify_event(_evt("EPDK Tarife Kararı Yayımlandı"))
    assert c.primary_type == "regulatory"


def test_unclassified_falls_to_other_low_confidence() -> None:
    c = classify_event(_evt("Personel piknik etkinliği bilgilendirme"))
    assert c.primary_type == "other"
    assert c.confidence == Confidence.LOW


def test_ambiguous_two_matches_is_medium_confidence() -> None:
    # Genel Kurul (governance) + Temettü (dividend) — two distinct rule hits.
    c = classify_event(_evt(
        "Genel Kurul Bildirimi",
        summary="Genel kurulda 2025 yılı temettü görüşülecek",
    ))
    assert c.confidence == Confidence.MEDIUM
    assert len(c.matched_rules) >= 2
    assert "governance" in c.matched_rules
    assert "dividend" in c.matched_rules


# ---------- batch classification ----------

def test_classify_batch_counts_ambiguous_and_unclassified() -> None:
    events = [
        _evt("2025 Temettü Dağıtımı", idx="K-1"),
        _evt("Personel etkinliği", idx="K-2"),
        _evt("Temettü Genel Kurul", idx="K-3"),  # two matches
    ]
    out = classify_events(events)
    assert out.unclassified_count == 1
    assert out.ambiguous_count == 1
    assert len(out.classified) == 3


# ---------- impact mapping ----------

def test_dividend_maps_to_cash_out() -> None:
    c = classify_event(_evt("2025 Temettü Dağıtımı"))
    impact = map_event_impact(c)
    assert impact.direction == "negative"
    assert impact.timing == "immediate"
    assert "dividends_paid" in impact.affected_line_items
    assert "CF" in impact.affected_statements


def test_new_contract_maps_to_positive_revenue() -> None:
    c = classify_event(_evt("Sözleşme İmzalandı: büyük ihale"))
    impact = map_event_impact(c)
    assert impact.direction == "positive"
    assert "revenue" in impact.affected_line_items


def test_production_halt_negative_immediate_pnl() -> None:
    c = classify_event(_evt("Üretim Durduruldu"))
    impact = map_event_impact(c)
    assert impact.direction == "negative"
    assert impact.timing == "immediate"
    assert "P&L" in impact.affected_statements


def test_litigation_affects_provisions_long_term() -> None:
    c = classify_event(_evt("Dava Açıldı"))
    impact = map_event_impact(c)
    assert impact.timing == "long"
    assert "provisions" in impact.affected_line_items


def test_capex_decision_hits_three_statements() -> None:
    c = classify_event(_evt("Yeni Yatırım Kararı"))
    impact = map_event_impact(c)
    statements = set(impact.affected_statements)
    assert statements == {"BS", "CF", "P&L"}


def test_map_events_batch_preserves_order_and_count() -> None:
    events = [
        _evt("2025 Temettü Dağıtımı", idx="K-1"),
        _evt("Sözleşme İmzalandı", idx="K-2"),
        _evt("Dava Açıldı", idx="K-3"),
    ]
    classified = [classify_event(e) for e in events]
    out = map_events(classified, ticker="KCHOL")
    assert len(out.events) == 3
    assert [i.disclosure_id for i in out.events] == ["K-1", "K-2", "K-3"]


def test_quantitative_impact_carried_through() -> None:
    e = _evt("Sözleşme İmzalandı")
    e = e.model_copy(update={"quantitative_impact_try": Decimal("5000000000")})
    c = classify_event(e)
    impact = map_event_impact(c)
    assert impact.quantitative_impact_try == Decimal("5000000000")
