"""macro_analysis hybrid output schema.

Python produces canonical numbers (snapshot + sensitivity impacts), LLM
writes the geopolitical / sector-transmission narrative over the top.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import Field

from financex.schemas.base import FinancexModel, SourceRef
from financex.schemas.macro import MacroSnapshot, TransmissionImpact


class MacroScenario(FinancexModel):
    """One 'what if' run. Label, the shock definition, and the computed
    TRY impact on the company."""

    label: str = Field(description="e.g. 'Base', 'TRY -10%', 'Brent +$10', 'Rates +200bp'.")
    shock_description: str
    impact: TransmissionImpact


class MacroAnalysisOutput(FinancexModel):
    """Canonical macro snapshot + per-company transmission results."""

    ticker: str
    computed_at: datetime
    snapshot: MacroSnapshot
    scenarios: list[MacroScenario] = Field(default_factory=list)
    narrative_hints: list[str] = Field(
        default_factory=list,
        description="Deterministic observations the LLM should weave into its geopolitical/sector narrative.",
    )
    sources: list[SourceRef] = Field(default_factory=list)
    schema_version: str = "1.0.0"

    # Stash for the LLM to double-check.
    canonical_numbers: dict[str, Decimal | None] = Field(default_factory=dict)
