"""Quality control — the hybrid doctrine in practice.

Every TickerPackage carries a QualityControl block. Producers populate it
as they discover gaps; downstream consumers decide whether to proceed,
degrade, or block based on the flags here (not by re-inspecting fields).
"""

from __future__ import annotations

from enum import Enum

from pydantic import Field

from financex.schemas.base import FinancexModel


class Severity(str, Enum):
    INFO = "info"
    WARN = "warn"
    BLOCK = "block"


class QualityFlag(FinancexModel):
    """A single non-fatal issue flagged by a producer."""

    code: str = Field(description="Stable machine id, e.g. 'MISSING_CF_STATEMENT'.")
    severity: Severity = Severity.WARN
    message: str
    affected_path: str | None = Field(
        default=None,
        description="Dot-path into TickerPackage, e.g. 'financials.periods[0].cash_flow'.",
    )


class QualityControl(FinancexModel):
    """Aggregated health of a TickerPackage.

    - `missing_fields` lists optional-but-critical fields that came back null.
    - `flags` lists producer-surfaced issues.
    - `overall_score` is a 0-1 heuristic (1 = perfect, <0.5 = downstream may downgrade).
    """

    missing_fields: list[str] = Field(default_factory=list)
    flags: list[QualityFlag] = Field(default_factory=list)
    overall_score: float | None = Field(default=None, ge=0.0, le=1.0)
    degraded: bool = Field(
        default=False,
        description="Set True when a soft-block trip occurs — downstream should know the pipeline is limping.",
    )

    def has_block(self) -> bool:
        return any(f.severity == Severity.BLOCK for f in self.flags)
