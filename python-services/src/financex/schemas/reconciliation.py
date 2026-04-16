"""Schemas for reconciliation — the mathematical-consistency layer that
sits between parse_standardization and the LLM reasoning agents.

A ReconciliationReport is not an opinion; it is a set of boolean math
checks + the absolute/relative error magnitudes so downstream consumers
can decide whether the numbers are trustworthy.
"""

from __future__ import annotations

from decimal import Decimal

from pydantic import Field

from financex.schemas.base import FinancexModel


class ReconciliationCheck(FinancexModel):
    """One deterministic consistency assertion on a PeriodFinancials."""

    # Required
    code: str = Field(description="Stable id, e.g. 'BS_IDENTITY', 'IS_GROSS_MARGIN_CHAIN'.")
    name: str
    passed: bool
    message: str

    # Optional — numerical evidence
    actual: Decimal | None = None
    expected: Decimal | None = None
    absolute_error: Decimal | None = None
    relative_error_pct: Decimal | None = None
    tolerance_pct: Decimal | None = Field(
        default=None,
        description="Allowed relative error in percent. Checks below this pass.",
    )


class ReconciliationReport(FinancexModel):
    """Aggregated result of all reconciliation checks for one period."""

    ticker: str | None = None
    period_label: str | None = None
    checks: list[ReconciliationCheck] = Field(default_factory=list)

    @property
    def all_passed(self) -> bool:
        return all(c.passed for c in self.checks)

    def failed(self) -> list[ReconciliationCheck]:
        return [c for c in self.checks if not c.passed]
