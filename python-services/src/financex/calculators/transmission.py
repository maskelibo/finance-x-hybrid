"""Macro → company transmission arithmetic.

Every ticker has four common sensitivities that drive P&L when the
macro environment shifts:

  FX:          Δ(USD/TRY) * company.fx_net_exposure_usd → TRY impact
  Policy rate: Δ(policy rate bp) * company.rate_sensitive_debt_try → interest impact
  Energy:      Δ(Brent USD/bbl) * company.energy_consumption_bbl → COGS impact
  Commodity:   Δ(sector commodity) * company.commodity_exposure → COGS impact

These are coarse linearisations — good enough to sanity-check LLM
narrative but not a precise model. The LLM layer adds the second-order
nuance (pricing pass-through lag, hedging book, etc.).

All inputs + outputs in Decimal.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from financex.schemas.macro import TransmissionImpact


_ZERO = Decimal("0")


@dataclass(frozen=True)
class CompanyExposure:
    """Company-specific sensitivity coefficients.

    Usually sourced from LLM context_extraction (company disclosures +
    management commentary), or entered manually for a first pass.
    """

    # Net USD short position in TRY equivalent.
    # Positive = company owes USD (TL depreciation hurts).
    fx_usd_net_short_try: Decimal = _ZERO

    # TRY-denominated debt that reprices with the policy rate.
    rate_sensitive_debt_try: Decimal = _ZERO

    # Annual energy consumption in barrel-equivalents.
    energy_barrels_per_year: Decimal = _ZERO

    # Annual sector-commodity tonnage (e.g. HRC steel, copper).
    commodity_tonnage_per_year: Decimal = _ZERO

    # Effective tax shield for interest expense.
    tax_rate: Decimal = Decimal("0.25")


@dataclass(frozen=True)
class MacroShift:
    """Coarse macro-variable change magnitudes the caller wants to model."""

    usd_try_pct_change: Decimal = _ZERO        # e.g. 0.10 = 10% TRY depreciation
    policy_rate_bp_change: Decimal = _ZERO     # e.g. 500 = +500 bps
    brent_usd_change: Decimal = _ZERO          # +5 = +$5/bbl
    sector_commodity_pct_change: Decimal = _ZERO


# ---------------------------------------------------------------------
# Individual transmissions
# ---------------------------------------------------------------------

def fx_impact_try(exposure: CompanyExposure, shift: MacroShift) -> Decimal:
    """TL depreciation → extra TRY cost on USD-denominated net exposure."""
    return (exposure.fx_usd_net_short_try * shift.usd_try_pct_change).quantize(Decimal("1"))


def interest_impact_try(exposure: CompanyExposure, shift: MacroShift) -> Decimal:
    """Annualised extra interest expense, net of tax shield."""
    bp = shift.policy_rate_bp_change / Decimal("10000")  # 500bp → 0.05
    gross = exposure.rate_sensitive_debt_try * bp
    after_tax = gross * (Decimal("1") - exposure.tax_rate)
    return after_tax.quantize(Decimal("1"))


def energy_impact_try(exposure: CompanyExposure, shift: MacroShift, usd_try: Decimal) -> Decimal:
    """Annual COGS impact from Brent change, converted at current USD/TRY."""
    return (exposure.energy_barrels_per_year * shift.brent_usd_change * usd_try).quantize(Decimal("1"))


def commodity_impact_try(exposure: CompanyExposure, shift: MacroShift, baseline_price_try_per_ton: Decimal) -> Decimal:
    """Annual COGS impact from sector-commodity price change."""
    return (
        exposure.commodity_tonnage_per_year
        * baseline_price_try_per_ton
        * shift.sector_commodity_pct_change
    ).quantize(Decimal("1"))


# ---------------------------------------------------------------------
# Orchestrator → TransmissionImpact schema
# ---------------------------------------------------------------------

def compute_transmission(
    exposure: CompanyExposure,
    shift: MacroShift,
    *,
    usd_try: Decimal,
    commodity_baseline_price_try_per_ton: Decimal = _ZERO,
    notes: str | None = None,
) -> TransmissionImpact:
    return TransmissionImpact(
        fx_sensitivity_annual_try=fx_impact_try(exposure, shift),
        interest_rate_sensitivity_annual_try=interest_impact_try(exposure, shift),
        energy_cost_sensitivity_annual_try=energy_impact_try(exposure, shift, usd_try),
        commodity_sensitivity_annual_try=commodity_impact_try(
            exposure, shift, commodity_baseline_price_try_per_ton
        ),
        notes=notes,
    )
