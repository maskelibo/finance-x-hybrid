"""esg — deterministic CBAM / ETS cost arithmetic.

The hard numbers a sustainability analyst needs are coarse-but-concrete
cost estimates of carbon-pricing mechanisms. Python computes those; the
LLM handles rating interpretation, materiality judgment, and greenwashing
flags.

Key inputs (per issuer, per annum):
  scope1_tco2:              direct emissions tonnage
  carbon_price_eur_per_t:   prevailing EU ETS spot, e.g. ~€85/tCO2 in 2026
  ets_free_allowance_pct:   free allocation still granted (sector-specific,
                             declining under EU phase-out)
  cbam_coverage_pct:        CBAM transition factor for the year (2025: 0.025,
                             2026: 0.485, 2034: 1.0 per current schedule)
  product_tonnage:          for reference-intensity CBAM calc (optional)
  usd_try / eur_try:        for TRY conversion

Outputs in both EUR and TRY.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from financex.schemas.base import FinancexModel


_ZERO = Decimal("0")


@dataclass(frozen=True)
class CbamInputs:
    scope1_tco2: Decimal
    carbon_price_eur_per_t: Decimal = Decimal("85")  # 2026 indicative EU ETS
    ets_free_allowance_pct: Decimal = Decimal("0.5")
    cbam_coverage_pct: Decimal = Decimal("0.485")    # 2026 CBAM phase-in factor
    product_tonnage: Decimal | None = None
    cbam_default_intensity: Decimal | None = None    # EU default tCO2/ton if unverified
    eur_try: Decimal | None = None


class CbamCostBreakdown(FinancexModel):
    """CBAM + ETS annual carbon cost, in EUR and (if FX given) TRY."""

    scope1_tco2: Decimal
    carbon_price_eur_per_t: Decimal

    ets_free_allowance_pct: Decimal
    cbam_coverage_pct: Decimal

    # Results
    ets_annual_cost_eur: Decimal
    cbam_annual_cost_eur: Decimal
    total_annual_cost_eur: Decimal

    ets_annual_cost_try: Decimal | None = None
    cbam_annual_cost_try: Decimal | None = None
    total_annual_cost_try: Decimal | None = None

    computed_at: datetime


def compute_cbam_cost(inputs: CbamInputs) -> CbamCostBreakdown:
    """Compute separate ETS and CBAM annual cost streams.

    Rough model (good for order-of-magnitude):
      ETS:   scope1_tco2 × (1 − free_allowance_pct) × carbon_price_eur_per_t
      CBAM:  intensity_diff × product_tonnage × coverage_pct × carbon_price
             where intensity_diff = max(0, cbam_default_intensity − verified)
             (when default intensity unknown we fall back to the same
             scope1 × coverage pass so the number is at least conservative.)
    """
    if inputs.scope1_tco2 < 0:
        raise ValueError("scope1_tco2 must be non-negative")

    ets_cost_eur = (
        inputs.scope1_tco2
        * (Decimal("1") - inputs.ets_free_allowance_pct)
        * inputs.carbon_price_eur_per_t
    ).quantize(Decimal("1"))

    # CBAM cost: importer pays the carbon price on the verified
    # embedded emissions, scaled by the phase-in coverage factor. If no
    # verified emissions are reported, the EU falls back to the default
    # intensity × product_tonnage — which yields a higher bill than
    # accurately reporting the producer's real number.
    verified_emissions = inputs.scope1_tco2
    if (
        inputs.product_tonnage is not None
        and inputs.product_tonnage > 0
        and inputs.cbam_default_intensity is not None
    ):
        default_emissions = inputs.cbam_default_intensity * inputs.product_tonnage
        # Use whichever is HIGHER — EU's 'punitive default' kicks in when
        # the producer is dirtier than the benchmark, otherwise the verified
        # figure is used.
        cbam_emissions_basis = max(verified_emissions, default_emissions)
    else:
        cbam_emissions_basis = verified_emissions

    cbam_cost_eur = (
        cbam_emissions_basis
        * inputs.cbam_coverage_pct
        * inputs.carbon_price_eur_per_t
    ).quantize(Decimal("1"))

    total_eur = (ets_cost_eur + cbam_cost_eur).quantize(Decimal("1"))

    ets_try: Decimal | None = None
    cbam_try: Decimal | None = None
    total_try: Decimal | None = None
    if inputs.eur_try is not None and inputs.eur_try > 0:
        ets_try = (ets_cost_eur * inputs.eur_try).quantize(Decimal("1"))
        cbam_try = (cbam_cost_eur * inputs.eur_try).quantize(Decimal("1"))
        total_try = (total_eur * inputs.eur_try).quantize(Decimal("1"))

    return CbamCostBreakdown(
        scope1_tco2=inputs.scope1_tco2,
        carbon_price_eur_per_t=inputs.carbon_price_eur_per_t,
        ets_free_allowance_pct=inputs.ets_free_allowance_pct,
        cbam_coverage_pct=inputs.cbam_coverage_pct,
        ets_annual_cost_eur=ets_cost_eur,
        cbam_annual_cost_eur=cbam_cost_eur,
        total_annual_cost_eur=total_eur,
        ets_annual_cost_try=ets_try,
        cbam_annual_cost_try=cbam_try,
        total_annual_cost_try=total_try,
        computed_at=datetime.now(UTC),
    )


# ---------------------------------------------------------------------
# Aggregate output — combines cost calc + optional external ratings
# ---------------------------------------------------------------------

class EsgAnalysisOutput(FinancexModel):
    """Canonical hand-off to the LLM ESG scorer."""

    ticker: str
    sector_hint: str
    cbam: CbamCostBreakdown | None = None
    external_ratings_supplied: bool = False
    notes: str | None = None
    computed_at: datetime
    schema_version: str = "1.0.0"


def analyze_esg(
    ticker: str,
    *,
    sector_hint: str,
    cbam_inputs: CbamInputs | None = None,
    external_ratings_supplied: bool = False,
    notes: str | None = None,
) -> EsgAnalysisOutput:
    cbam = compute_cbam_cost(cbam_inputs) if cbam_inputs else None
    return EsgAnalysisOutput(
        ticker=ticker.upper(),
        sector_hint=sector_hint,
        cbam=cbam,
        external_ratings_supplied=external_ratings_supplied,
        notes=notes,
        computed_at=datetime.now(UTC),
    )
