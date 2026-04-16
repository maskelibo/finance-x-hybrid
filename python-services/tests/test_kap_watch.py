"""kap_watch tests — crawler + classifier + runner.

Uses MockKapClient exclusively so no network is touched.
"""

from __future__ import annotations

from datetime import date, datetime, timezone

from financex.calculators.kap_watch import run_kap_watch
from financex.crawlers.kap import MockKapClient, RawDisclosure
from financex.parsers.kap_disclosure import CLASSIFICATION_RULES, classify_disclosure, to_kap_event
from financex.schemas.base import Confidence


# ---------- fixtures ----------

def _raw(
    ticker: str,
    announced: datetime,
    title: str,
    *,
    did: str = "KAP-001",
    summary: str | None = None,
) -> RawDisclosure:
    return RawDisclosure(
        disclosure_id=did,
        ticker=ticker,
        announced_at=announced,
        title=title,
        url=f"https://kap.org.tr/tr/Bildirim/{did}",
        summary=summary,
    )


def _dt(y: int, m: int, d: int) -> datetime:
    return datetime(y, m, d, tzinfo=timezone.utc)


# ---------- classifier ----------

def test_classifier_has_rule_for_each_type() -> None:
    """Every declared rule must have at least one keyword and a canonical type."""
    types = {rule.event_type for rule in CLASSIFICATION_RULES}
    assert "dividend" in types
    assert "debt_issuance" in types
    for rule in CLASSIFICATION_RULES:
        assert rule.keywords, f"rule for {rule.event_type} has no keywords"


def test_dividend_classification() -> None:
    raw = _raw("KCHOL", _dt(2026, 4, 10), "2025 Yılı Temettü Dağıtımı")
    event_type, confidence = classify_disclosure(raw)
    assert event_type == "dividend"
    assert confidence == Confidence.HIGH


def test_debt_issuance_classification() -> None:
    raw = _raw("TUPRS", _dt(2026, 3, 5), "Tahvil İhracı Kararı")
    event_type, confidence = classify_disclosure(raw)
    assert event_type == "debt_issuance"


def test_governance_classification_english_keyword() -> None:
    raw = _raw("THYAO", _dt(2026, 4, 1), "Notice of AGM")
    event_type, confidence = classify_disclosure(raw)
    assert event_type == "governance"


def test_unclassifiable_returns_other_low_confidence() -> None:
    raw = _raw("ASELS", _dt(2026, 3, 15), "Genel bilgi açıklaması")
    event_type, confidence = classify_disclosure(raw)
    assert event_type == "other"
    assert confidence == Confidence.LOW


def test_ambiguous_multi_keyword_confidence_medium() -> None:
    # Governance-ish AGM context + dividend keyword → two matches.
    raw = _raw(
        "KCHOL",
        _dt(2026, 4, 10),
        "Genel Kurul Bildirimi",
        summary="Genel kurulda 2025 temettü dağıtımı görüşülecek.",
    )
    event_type, confidence = classify_disclosure(raw)
    assert event_type in {"governance", "dividend"}
    assert confidence == Confidence.MEDIUM


def test_classifier_is_case_insensitive() -> None:
    raw = _raw("ASELS", _dt(2026, 3, 5), "TAHVİL İHRACI KARARI")
    event_type, _ = classify_disclosure(raw)
    assert event_type == "debt_issuance"


# ---------- projection to KapEvent ----------

def test_to_kap_event_carries_all_fields() -> None:
    raw = _raw(
        "TCELL",
        _dt(2026, 2, 1),
        "Tahvil İhracı Bildirimi",
        summary="1 milyar TL tutarında tahvil ihracı",
    )
    event = to_kap_event(raw)
    assert event.disclosure_id == raw.disclosure_id
    assert event.ticker == "TCELL"
    assert event.title == raw.title
    assert event.url == raw.url
    assert event.summary == raw.summary
    assert event.event_type == "debt_issuance"
    assert event.classification_confidence == Confidence.HIGH


# ---------- runner + MockKapClient ----------

def test_run_kap_watch_filters_by_window_and_ticker() -> None:
    fixtures = [
        _raw("KCHOL", _dt(2026, 3, 15), "Temettü dağıtımı kararı", did="K-1"),
        _raw("KCHOL", _dt(2025, 12, 10), "Önceki yıl temettüsü", did="K-OLD"),
        _raw("THYAO", _dt(2026, 3, 20), "AGM bildirimi", did="T-1"),
        _raw("KCHOL", _dt(2026, 4, 1), "Yatırım kararı", did="K-2"),
    ]
    client = MockKapClient(fixtures=fixtures)
    result = run_kap_watch(
        "KCHOL",
        since=date(2026, 1, 1),
        until=date(2026, 4, 30),
        client=client,
    )
    assert {e.disclosure_id for e in result.events} == {"K-1", "K-2"}
    assert result.window_start is not None
    assert result.window_end is not None


def test_run_kap_watch_empty_when_ticker_unknown() -> None:
    fixtures = [_raw("KCHOL", _dt(2026, 4, 1), "Temettü")]
    client = MockKapClient(fixtures=fixtures)
    result = run_kap_watch("UNKNOWN", since=date(2026, 1, 1), client=client)
    assert result.events == []


def test_run_kap_watch_produces_valid_schema() -> None:
    """Result should round-trip through JSON without losing data."""
    fixtures = [
        _raw("KCHOL", _dt(2026, 3, 15), "Temettü dağıtımı kararı", did="K-1"),
        _raw("KCHOL", _dt(2026, 4, 1), "Bedelli Sermaye Artırımı", did="K-2"),
    ]
    client = MockKapClient(fixtures=fixtures)
    result = run_kap_watch("KCHOL", since=date(2026, 1, 1), client=client)
    from financex.schemas.kap import KapEvents

    rebuilt = KapEvents.model_validate_json(result.model_dump_json())
    assert [e.event_type for e in rebuilt.events] == ["dividend", "capital_action"]
