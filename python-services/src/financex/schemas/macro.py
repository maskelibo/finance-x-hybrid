"""Macro context snapshot — rates, FX, inflation, indices."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from pydantic import Field

from financex.schemas.base import FinancexModel, SourceRef


class MacroSnapshot(FinancexModel):
    """Macro variables on a given date. All optional — macro is a supplement,
    not a blocker."""

    as_of: date | None = None

    # Rates / monetary
    tcmb_policy_rate: Decimal | None = None
    tcmb_10y_bond_yield: Decimal | None = None

    # Inflation
    cpi_yoy: Decimal | None = Field(default=None, description="TÜFE yıllık %.")
    ppi_yoy: Decimal | None = Field(default=None, description="ÜFE yıllık %.")
    core_cpi_yoy: Decimal | None = None

    # FX
    usd_try: Decimal | None = None
    eur_try: Decimal | None = None

    # Growth
    gdp_yoy: Decimal | None = None

    # Equity benchmarks
    bist100_level: Decimal | None = None
    bist100_ytd_return: Decimal | None = None
    sector_index_level: Decimal | None = None
    sector_index_ytd_return: Decimal | None = None

    sources: list[SourceRef] = Field(default_factory=list)


class TransmissionImpact(FinancexModel):
    """Company-specific sensitivity translated from macro moves.

    Python computes the arithmetic; the LLM later adds narrative.
    """

    fx_sensitivity_annual_try: Decimal | None = Field(
        default=None,
        description="TRY impact on net financial expense per 10% TRY depreciation.",
    )
    energy_cost_sensitivity_annual_try: Decimal | None = None
    interest_rate_sensitivity_annual_try: Decimal | None = None
    commodity_sensitivity_annual_try: Decimal | None = None
    notes: str | None = None
