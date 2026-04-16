"""event_impact_mapper — deterministic event → P&L / BS / CF impact router.

Given a ClassifiedEvent (from event_classification), this module:

  1. Projects which financial statements the event touches
     (affected_statements: P&L / BS / CF / all).
  2. Tags timing on the four-phase scale:
     immediate (<30d) / near (30-90d) / medium (90-180d) / long (180-365d).
  3. Proposes a direction (positive / negative / mixed / unknown).
  4. Optionally quantifies TRY impact when the event carries a headline
     number (contract value, capex, dividend amount, etc.).

Geopolitical / macro-chained events (Iran-oil-finance-tariff cascades)
stay on the LLM side — the pattern matching here stops at 'regulatory'
with a hint to the LLM for further depth.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from financex.calculators.event_classification import ClassifiedEvent
from financex.schemas.base import FinancexModel


# ---------- Impact template table ----------

@dataclass(frozen=True)
class _Template:
    affected_statements: tuple[str, ...]
    direction: str            # positive / negative / mixed / unknown
    timing: str               # immediate / near / medium / long
    affected_line_items: tuple[str, ...]


_IMPACT_TEMPLATES: dict[str, _Template] = {
    "dividend": _Template(
        affected_statements=("CF", "BS"),
        direction="negative",   # cash goes out
        timing="immediate",
        affected_line_items=("dividends_paid", "cash", "retained_earnings"),
    ),
    "capital_action": _Template(
        affected_statements=("BS", "CF"),
        direction="positive",   # cash or share count changes
        timing="near",
        affected_line_items=("paid_in_capital", "cash", "share_count"),
    ),
    "debt_issuance": _Template(
        affected_statements=("BS", "CF", "P&L"),
        direction="mixed",
        timing="immediate",
        affected_line_items=("long_term_debt", "cash", "financial_expense"),
    ),
    "capex_decision": _Template(
        affected_statements=("BS", "CF", "P&L"),
        direction="mixed",
        timing="medium",
        affected_line_items=("ppe_net", "capex", "depreciation_amortization"),
    ),
    "management_change": _Template(
        affected_statements=("P&L",),
        direction="unknown",
        timing="near",
        affected_line_items=("opex",),
    ),
    "governance": _Template(
        affected_statements=("BS",),
        direction="unknown",
        timing="near",
        affected_line_items=("equity",),
    ),
    "m_and_a": _Template(
        affected_statements=("BS", "P&L", "CF"),
        direction="mixed",
        timing="medium",
        affected_line_items=("goodwill", "revenue", "investing_cash_flow"),
    ),
    "buyback": _Template(
        affected_statements=("BS", "CF"),
        direction="negative",  # cash out
        timing="immediate",
        affected_line_items=("treasury_shares", "cash", "eps"),
    ),
    "rating_change": _Template(
        affected_statements=("P&L",),
        direction="mixed",
        timing="medium",
        affected_line_items=("financial_expense",),  # future funding cost
    ),
    "production_halt": _Template(
        affected_statements=("P&L",),
        direction="negative",
        timing="immediate",
        affected_line_items=("revenue", "gross_profit"),
    ),
    "new_contract": _Template(
        affected_statements=("P&L",),
        direction="positive",
        timing="medium",
        affected_line_items=("revenue", "backlog"),
    ),
    "litigation": _Template(
        affected_statements=("P&L", "BS"),
        direction="negative",
        timing="long",
        affected_line_items=("provisions", "other_expense"),
    ),
    "guidance": _Template(
        affected_statements=("P&L",),
        direction="unknown",
        timing="near",
        affected_line_items=("revenue", "ebitda"),
    ),
    "regulatory": _Template(
        affected_statements=("P&L",),
        direction="unknown",
        timing="near",
        affected_line_items=("revenue", "cost_of_sales"),
    ),
    "macro_event": _Template(
        affected_statements=("P&L", "BS"),
        direction="unknown",
        timing="medium",
        affected_line_items=("financial_expense", "fx_impact"),
    ),
    "other": _Template(
        affected_statements=("P&L",),
        direction="unknown",
        timing="medium",
        affected_line_items=(),
    ),
}


# ---------- Output schema ----------

class EventImpact(FinancexModel):
    disclosure_id: str
    event_type: str
    title: str
    affected_statements: list[str]
    affected_line_items: list[str]
    direction: str
    timing: str
    confidence: str
    quantitative_impact_try: Decimal | None = None
    notes: str | None = None


class EventImpactOutput(FinancexModel):
    ticker: str
    events: list[EventImpact] = []
    computed_at: datetime
    schema_version: str = "1.0.0"


# ---------- Public API ----------

def map_event_impact(classified: ClassifiedEvent) -> EventImpact:
    tmpl = _IMPACT_TEMPLATES.get(classified.primary_type, _IMPACT_TEMPLATES["other"])
    qimpact = classified.event.quantitative_impact_try
    return EventImpact(
        disclosure_id=classified.event.disclosure_id,
        event_type=classified.primary_type,
        title=classified.event.title,
        affected_statements=list(tmpl.affected_statements),
        affected_line_items=list(tmpl.affected_line_items),
        direction=tmpl.direction,
        timing=tmpl.timing,
        confidence=classified.confidence.value,
        quantitative_impact_try=qimpact,
    )


def map_events(classified_events: list[ClassifiedEvent], *, ticker: str | None = None) -> EventImpactOutput:
    impacts = [map_event_impact(c) for c in classified_events]
    return EventImpactOutput(
        ticker=(ticker or (classified_events[0].event.ticker if classified_events else "")).upper(),
        events=impacts,
        computed_at=datetime.now(UTC),
    )
