"""event_classification — rule-based taxonomy refiner on top of kap_watch.

kap_watch already writes a coarse event_type + confidence into each
KapEvent. This module runs a richer rule pass (more keywords, phrase
combinations) and surfaces classification ambiguity explicitly — rows
where two rules matched equally, or where no rule matched a material
disclosure, get flagged for LLM fallback.

The taxonomy matches memory's "15 types" doc (event_impact_mapper):
  dividend, capital_action, debt_issuance, capex_decision,
  management_change, m_and_a, buyback, rating_change, production_halt,
  new_contract, litigation, guidance, regulatory, macro_event, other.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from typing import Iterable

from financex.parsers.label_mapping import normalize_label
from financex.schemas.base import Confidence, FinancexModel
from financex.schemas.kap import KapEvent


@dataclass(frozen=True)
class _Rule:
    event_type: str
    keywords: tuple[str, ...]


_RULES: tuple[_Rule, ...] = (
    _Rule("dividend", ("temettu", "kar payi", "dividend", "nakit kar dagitim")),
    _Rule("capital_action", (
        "sermaye artirimi", "bedelli", "bedelsiz", "capital increase", "rights issue",
        "sermaye azaltim", "capital reduction",
    )),
    _Rule("debt_issuance", (
        "tahvil", "bono", "eurobond", "finansman bonosu", "bond issuance", "debt issuance",
        "kira sertifikasi", "sukuk",
    )),
    _Rule("capex_decision", (
        "yatirim karari", "kapasite", "capex", "yeni tesis", "investment decision",
        "uretim hatti", "fabrika ilave",
    )),
    _Rule("management_change", (
        "istifa", "atama", "ceo degisikligi", "resignation", "appointment",
        "ust yonetim", "yonetim kurulu uyeligi",
    )),
    _Rule("governance", (
        "genel kurul", "yonetim kurulu", "agm", "egm", "board meeting",
        "olagan genel kurul", "olaganüstü genel kurul",
    )),
    _Rule("m_and_a", (
        "satin alma", "birlesme", "devralma", "m&a", "merger", "acquisition",
        "stratejik ortaklik",
    )),
    _Rule("buyback", (
        "geri alim", "pay geri alim", "share buyback", "hisse geri alim",
    )),
    _Rule("rating_change", (
        "kredi derecelendirme", "rating", "s&p", "moody", "fitch",
    )),
    _Rule("production_halt", (
        "uretim durduruldu", "faaliyet durdur", "production halted",
        "tesis kapatildi",
    )),
    _Rule("new_contract", (
        "sozlesme imzalandi", "ihale kazanildi", "sozlesme imza",
        "tedarik anlasmasi", "contract signed", "ihaleye davet",
    )),
    _Rule("litigation", (
        "dava", "tahkim", "litigation", "sulh", "cezai",
    )),
    _Rule("guidance", (
        "beklenti", "ongoru", "guidance", "tahmin revize",
        "hedef revize",
    )),
    _Rule("regulatory", (
        "epdk", "bddk", "spk", "tcmb", "safeguard", "tarife",
        "ceza", "yasak", "soruşturma",
    )),
    _Rule("macro_event", (
        "kur kaybi", "enflasyon", "daralma", "devaluasyon",
    )),
    _Rule("governance", (
        "genel kurul", "yonetim kurulu toplanti", "agm", "egm",
    )),
)


# ---------- Classification result ----------

class ClassifiedEvent(FinancexModel):
    """Extension of KapEvent with richer classification metadata."""

    event: KapEvent
    primary_type: str
    secondary_types: list[str] = []
    confidence: Confidence = Confidence.UNKNOWN
    matched_rules: list[str] = []


class EventClassificationOutput(FinancexModel):
    """Canonical hand-off for event_impact_mapper / LLM fallback."""

    ticker: str
    classified: list[ClassifiedEvent] = []
    unclassified_count: int = 0
    ambiguous_count: int = 0
    computed_at: datetime
    schema_version: str = "1.0.0"


# ---------- Public API ----------

def classify_event(event: KapEvent) -> ClassifiedEvent:
    """Run every rule; pick the best match + surface others as secondary."""
    hay = normalize_label(
        " ".join(filter(None, [event.title, event.summary, event.subcategory, event.category]))
    )
    matches: list[str] = []
    for rule in _RULES:
        for kw in rule.keywords:
            if normalize_label(kw) in hay:
                matches.append(rule.event_type)
                break

    if len(matches) == 1:
        primary = matches[0]
        confidence = Confidence.HIGH
        secondary: list[str] = []
    elif len(matches) > 1:
        primary = matches[0]
        confidence = Confidence.MEDIUM
        secondary = matches[1:]
    else:
        primary = "other"
        confidence = Confidence.LOW
        secondary = []

    return ClassifiedEvent(
        event=event,
        primary_type=primary,
        secondary_types=secondary,
        confidence=confidence,
        matched_rules=matches,
    )


def classify_events(events: Iterable[KapEvent], *, ticker: str | None = None) -> EventClassificationOutput:
    """Batch classify. Counts ambiguous (multi-match) and unclassified rows."""
    classified = [classify_event(e) for e in events]
    ambiguous = sum(1 for c in classified if len(c.matched_rules) > 1)
    unclassified = sum(1 for c in classified if not c.matched_rules)
    return EventClassificationOutput(
        ticker=(ticker or (classified[0].event.ticker if classified else "")).upper(),
        classified=classified,
        ambiguous_count=ambiguous,
        unclassified_count=unclassified,
        computed_at=datetime.now(UTC),
    )
