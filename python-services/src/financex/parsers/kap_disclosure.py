"""Rule-based classification + projection for KAP disclosures.

Turns a RawDisclosure (network shape) into a KapEvent (schema shape).
Event-type inference is keyword-based; ambiguous disclosures get
`Confidence.LOW` and are candidates for the LLM fallback layer later.
"""

from __future__ import annotations

from dataclasses import dataclass

from financex.crawlers.kap import RawDisclosure
from financex.schemas.base import Confidence
from financex.schemas.kap import KapEvent


# Canonical event types used across Finance X. Intentionally kept small;
# event_classification will extend this taxonomy when Wave 6 lands.
EVENT_TYPES = {
    "dividend",
    "capital_action",
    "debt_issuance",
    "capex_decision",
    "governance",
    "m_and_a",
    "management_change",
    "material_event",
    "regulatory",
    "other",
}


@dataclass(frozen=True)
class _TypeRule:
    """A single keyword rule. All terms are matched case-insensitively
    against the disclosure title + summary + subcategory."""

    event_type: str
    keywords: tuple[str, ...]


CLASSIFICATION_RULES: tuple[_TypeRule, ...] = (
    _TypeRule("dividend", ("temettü", "kar payı", "dividend")),
    _TypeRule("capital_action", ("sermaye artırımı", "bedelli", "bedelsiz", "capital increase", "rights issue")),
    _TypeRule("debt_issuance", ("tahvil", "bono", "eurobond", "finansman bonosu", "bond issuance", "debt issuance")),
    _TypeRule("capex_decision", ("yatırım kararı", "kapasite", "capex", "yeni tesis", "investment decision")),
    _TypeRule("governance", ("yönetim kurulu", "genel kurul", "agm", "egm", "board meeting")),
    _TypeRule("m_and_a", ("satın alma", "birleşme", "devralma", "m&a", "merger", "acquisition")),
    _TypeRule("management_change", ("istifa", "atama", "ceo değişikliği", "resignation", "appointment")),
    _TypeRule("regulatory", ("epdk", "bddk", "spk", "tcmb", "regulatory", "safeguard", "tarife")),
    _TypeRule("material_event", ("özel durum", "material event", "material information")),
)


def _tr_lower(text: str) -> str:
    """Lowercase Turkish-aware — avoids Unicode combining-dot on 'İ'."""
    return text.replace("İ", "i").replace("I", "ı").lower()


def classify_disclosure(disclosure: RawDisclosure) -> tuple[str, Confidence]:
    """Return (event_type, confidence) for a disclosure.

    - Exactly one rule matches → HIGH.
    - Multiple rules match → MEDIUM (still returns the first match; the
      LLM fallback should resolve overlap).
    - No rule matches → 'other', LOW.
    """
    haystack = _tr_lower(
        " ".join(
            part
            for part in (disclosure.title, disclosure.summary, disclosure.subcategory, disclosure.category)
            if part
        )
    )

    matches: list[str] = []
    for rule in CLASSIFICATION_RULES:
        if any(_tr_lower(kw) in haystack for kw in rule.keywords):
            matches.append(rule.event_type)

    if len(matches) == 1:
        return matches[0], Confidence.HIGH
    if len(matches) > 1:
        return matches[0], Confidence.MEDIUM
    return "other", Confidence.LOW


def to_kap_event(disclosure: RawDisclosure) -> KapEvent:
    """Project a RawDisclosure + classification into the canonical KapEvent schema."""
    event_type, confidence = classify_disclosure(disclosure)
    return KapEvent(
        disclosure_id=disclosure.disclosure_id,
        ticker=disclosure.ticker,
        announced_at=disclosure.announced_at,
        title=disclosure.title,
        url=disclosure.url,
        category=disclosure.category,
        subcategory=disclosure.subcategory,
        summary=disclosure.summary,
        full_text=disclosure.full_text,
        event_type=event_type,
        classification_confidence=confidence,
    )
