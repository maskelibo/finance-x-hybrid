"""KAP (Kamuyu Aydınlatma Platformu) material-event records."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import Field

from financex.schemas.base import Confidence, FinancexModel


class KapEvent(FinancexModel):
    """One KAP disclosure. Minimal required fields; rich optional ones.

    Required: disclosure_id, ticker, announced_at, title, url.
    """

    disclosure_id: str = Field(description="KAP's canonical ID for the disclosure.")
    ticker: str
    announced_at: datetime
    title: str
    url: str

    # --- optional --------------------------------------------------------
    category: str | None = Field(default=None, description="KAP category, e.g. 'Özel Durum Açıklaması'.")
    subcategory: str | None = None
    summary: str | None = Field(default=None, max_length=4000)
    full_text: str | None = None

    # Rule-based classification outputs (set by event_classification later).
    event_type: str | None = Field(
        default=None,
        description="One of 15: debt_issuance, capex_decision, management_change, ...",
    )
    classification_confidence: Confidence = Confidence.UNKNOWN
    is_material: bool | None = None
    quantitative_impact_try: Decimal | None = None
    impact_pct_revenue: Decimal | None = None
    impact_pct_equity: Decimal | None = None


class KapEvents(FinancexModel):
    events: list[KapEvent] = Field(default_factory=list)
    window_start: datetime | None = None
    window_end: datetime | None = None
