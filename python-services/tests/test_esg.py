"""esg calculator tests — CBAM / ETS math, TRY conversion, intensity gap model."""

from __future__ import annotations

from decimal import Decimal

import pytest

from financex.calculators.esg import CbamInputs, analyze_esg, compute_cbam_cost


# ---------- ETS math ----------

def test_ets_cost_applies_free_allowance() -> None:
    inputs = CbamInputs(
        scope1_tco2=Decimal("1000000"),  # 1M tCO2
        carbon_price_eur_per_t=Decimal("100"),
        ets_free_allowance_pct=Decimal("0.5"),
        cbam_coverage_pct=Decimal("0"),
    )
    br = compute_cbam_cost(inputs)
    # (1M * 0.5 free → 500K billable) * €100 = €50M
    assert br.ets_annual_cost_eur == Decimal("50000000")
    assert br.cbam_annual_cost_eur == Decimal("0")
    assert br.total_annual_cost_eur == Decimal("50000000")


def test_ets_with_no_free_allowance_pays_full_price() -> None:
    inputs = CbamInputs(
        scope1_tco2=Decimal("500000"),
        carbon_price_eur_per_t=Decimal("80"),
        ets_free_allowance_pct=Decimal("0"),
        cbam_coverage_pct=Decimal("0"),
    )
    br = compute_cbam_cost(inputs)
    # 500K * €80 = €40M
    assert br.ets_annual_cost_eur == Decimal("40000000")


# ---------- CBAM math ----------

def test_cbam_conservative_fallback_when_no_intensity_supplied() -> None:
    inputs = CbamInputs(
        scope1_tco2=Decimal("1000000"),
        carbon_price_eur_per_t=Decimal("100"),
        ets_free_allowance_pct=Decimal("1"),  # ETS fully free → 0 ETS cost
        cbam_coverage_pct=Decimal("0.5"),
    )
    br = compute_cbam_cost(inputs)
    # ETS: zero
    assert br.ets_annual_cost_eur == Decimal("0")
    # CBAM fallback: 1M * 0.5 coverage * €100 = €50M
    assert br.cbam_annual_cost_eur == Decimal("50000000")


def test_cbam_punitive_default_applies_when_producer_is_dirtier() -> None:
    """EU default 2.0 tCO2/ton; verified intensity 2.5 → EU forces the
    default BUT since verified is already higher, verified is used.
    """
    inputs = CbamInputs(
        scope1_tco2=Decimal("2500000"),         # verified 2.5 tCO2/ton * 1M tons
        product_tonnage=Decimal("1000000"),
        cbam_default_intensity=Decimal("2.0"),
        carbon_price_eur_per_t=Decimal("100"),
        ets_free_allowance_pct=Decimal("1"),
        cbam_coverage_pct=Decimal("1"),
    )
    br = compute_cbam_cost(inputs)
    # Basis = max(2.5M, 2.0 * 1M) = 2.5M → 2.5M * 1 * €100 = €250M
    assert br.cbam_annual_cost_eur == Decimal("250000000")


def test_cbam_default_floor_lifts_reported_emissions_when_cleaner_than_default() -> None:
    """When producer reports LOWER than the EU default, the EU still
    charges on the default. This is the opposite of an intensity discount.
    """
    inputs = CbamInputs(
        scope1_tco2=Decimal("500000"),          # verified 0.5 tCO2/ton * 1M
        product_tonnage=Decimal("1000000"),
        cbam_default_intensity=Decimal("2.0"),  # EU default punishes unverified
        carbon_price_eur_per_t=Decimal("100"),
        ets_free_allowance_pct=Decimal("1"),
        cbam_coverage_pct=Decimal("1"),
    )
    br = compute_cbam_cost(inputs)
    # Basis = max(500K, 2.0 * 1M) = 2.0M → €200M
    assert br.cbam_annual_cost_eur == Decimal("200000000")


# ---------- TRY conversion ----------

def test_try_fields_populated_when_eur_try_supplied() -> None:
    inputs = CbamInputs(
        scope1_tco2=Decimal("100000"),
        carbon_price_eur_per_t=Decimal("100"),
        ets_free_allowance_pct=Decimal("0"),
        cbam_coverage_pct=Decimal("0"),
        eur_try=Decimal("50"),
    )
    br = compute_cbam_cost(inputs)
    # ETS = 100K * €100 = €10M → 500M TRY at EURTRY 50
    assert br.ets_annual_cost_eur == Decimal("10000000")
    assert br.ets_annual_cost_try == Decimal("500000000")
    assert br.total_annual_cost_try == Decimal("500000000")


def test_try_fields_none_without_eur_try() -> None:
    inputs = CbamInputs(scope1_tco2=Decimal("100000"))
    br = compute_cbam_cost(inputs)
    assert br.total_annual_cost_try is None


# ---------- Validation ----------

def test_negative_scope1_raises() -> None:
    with pytest.raises(ValueError):
        compute_cbam_cost(CbamInputs(scope1_tco2=Decimal("-1")))


# ---------- Orchestrator ----------

def test_analyze_esg_bundles_cbam_into_output() -> None:
    inputs = CbamInputs(scope1_tco2=Decimal("10000"), eur_try=Decimal("45"))
    result = analyze_esg("EREGL", sector_hint="steel", cbam_inputs=inputs, notes="EREGL 2025")
    assert result.ticker == "EREGL"
    assert result.cbam is not None
    assert result.cbam.scope1_tco2 == Decimal("10000")
    assert result.notes == "EREGL 2025"
    assert result.schema_version == "1.0.0"


def test_analyze_esg_without_cbam_is_valid() -> None:
    result = analyze_esg("KCHOL", sector_hint="holding")
    assert result.cbam is None
    assert result.external_ratings_supplied is False
