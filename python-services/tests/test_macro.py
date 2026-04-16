"""macro_analysis tests — TCMB FX parsing, transmission formulas, orchestration."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from pathlib import Path

import pytest

from financex.calculators.macro_analysis import MacroInputs, analyze_macro, build_snapshot
from financex.calculators.transmission import (
    CompanyExposure,
    MacroShift,
    commodity_impact_try,
    compute_transmission,
    energy_impact_try,
    fx_impact_try,
    interest_impact_try,
)
from financex.crawlers.tcmb import FxRates, HttpTcmbClient, StaticTcmbClient


# ---------- transmission formulas ----------

def test_fx_impact_linear() -> None:
    ex = CompanyExposure(fx_usd_net_short_try=Decimal("1000000000"))  # 1B TRY short USD
    shift = MacroShift(usd_try_pct_change=Decimal("0.10"))              # 10% depreciation
    assert fx_impact_try(ex, shift) == Decimal("100000000")             # 100M TRY hit


def test_interest_impact_after_tax_shield() -> None:
    ex = CompanyExposure(
        rate_sensitive_debt_try=Decimal("100000000"),
        tax_rate=Decimal("0.25"),
    )
    shift = MacroShift(policy_rate_bp_change=Decimal("500"))  # +5%
    # Gross = 100M * 0.05 = 5M; after-tax = 5M * 0.75 = 3.75M
    assert interest_impact_try(ex, shift) == Decimal("3750000")


def test_energy_impact_uses_usd_try_rate() -> None:
    ex = CompanyExposure(energy_barrels_per_year=Decimal("1000000"))
    shift = MacroShift(brent_usd_change=Decimal("5"))
    usd_try = Decimal("45")
    # 1M bbl * $5 * 45 TL/USD = 225M TRY
    assert energy_impact_try(ex, shift, usd_try) == Decimal("225000000")


def test_commodity_impact_respects_baseline_price() -> None:
    ex = CompanyExposure(commodity_tonnage_per_year=Decimal("100000"))
    shift = MacroShift(sector_commodity_pct_change=Decimal("0.10"))
    baseline = Decimal("20000")  # 20K TRY/ton
    # 100K tons * 20K TRY/ton * 10% = 200M TRY
    assert commodity_impact_try(ex, shift, baseline) == Decimal("200000000")


def test_compute_transmission_bundles_all_four_channels() -> None:
    ex = CompanyExposure(
        fx_usd_net_short_try=Decimal("1000000"),
        rate_sensitive_debt_try=Decimal("1000000"),
        energy_barrels_per_year=Decimal("100"),
        commodity_tonnage_per_year=Decimal("100"),
        tax_rate=Decimal("0.2"),
    )
    shift = MacroShift(
        usd_try_pct_change=Decimal("0.1"),
        policy_rate_bp_change=Decimal("100"),
        brent_usd_change=Decimal("1"),
        sector_commodity_pct_change=Decimal("0.1"),
    )
    impact = compute_transmission(
        ex, shift, usd_try=Decimal("45"), commodity_baseline_price_try_per_ton=Decimal("10000")
    )
    assert impact.fx_sensitivity_annual_try is not None
    assert impact.interest_rate_sensitivity_annual_try is not None
    assert impact.energy_cost_sensitivity_annual_try is not None
    assert impact.commodity_sensitivity_annual_try is not None


# ---------- TCMB XML parsing ----------

_SAMPLE_TCMB_XML = """<?xml version="1.0" encoding="UTF-8"?>
<Tarih_Date Tarih="16.04.2026" Date="04/16/2026" Bulten_No="2026/73">
  <Currency Kod="USD" CurrencyCode="USD">
    <ForexBuying>44.6788</ForexBuying>
    <ForexSelling>44.7593</ForexSelling>
  </Currency>
  <Currency Kod="EUR" CurrencyCode="EUR">
    <ForexBuying>52.6800</ForexBuying>
    <ForexSelling>52.7600</ForexSelling>
  </Currency>
  <Currency Kod="GBP" CurrencyCode="GBP">
    <ForexBuying>55.1234</ForexBuying>
    <ForexSelling>55.2000</ForexSelling>
  </Currency>
</Tarih_Date>
"""


class _FakeHttpResponse:
    def __init__(self, text: str) -> None:
        self.text = text

    def raise_for_status(self) -> None:  # noqa: D401
        return None


class _FakeHttpClient:
    def __init__(self, text: str) -> None:
        self.text = text

    def get(self, url: str):  # noqa: ANN001
        return _FakeHttpResponse(self.text)


def test_http_tcmb_client_parses_sample_xml() -> None:
    client = HttpTcmbClient(http_client=_FakeHttpClient(_SAMPLE_TCMB_XML))  # type: ignore[arg-type]
    fx = client.fetch_fx()
    assert fx.usd_try == Decimal("44.7593")
    assert fx.eur_try == Decimal("52.7600")
    assert fx.gbp_try == Decimal("55.2000")
    assert fx.as_of == date(2026, 4, 16)


# ---------- orchestrator ----------

def test_build_snapshot_merges_fx_and_user_inputs() -> None:
    client = StaticTcmbClient(FxRates(
        usd_try=Decimal("45.00"),
        eur_try=Decimal("50.00"),
        as_of=date(2026, 4, 16),
    ))
    snap = build_snapshot(
        MacroInputs(tcmb_policy_rate=Decimal("45"), cpi_yoy=Decimal("35")),
        client=client,
    )
    assert snap.usd_try == Decimal("45.00")
    assert snap.tcmb_policy_rate == Decimal("45")
    assert snap.cpi_yoy == Decimal("35")
    assert len(snap.sources) == 1
    assert snap.sources[0].source_id == "tcmb"


def test_analyze_macro_emits_full_package() -> None:
    client = StaticTcmbClient(FxRates(
        usd_try=Decimal("45.00"), eur_try=Decimal("50.00"), as_of=date(2026, 4, 16)
    ))
    result = analyze_macro(
        "KCHOL",
        CompanyExposure(fx_usd_net_short_try=Decimal("1000000000")),
        MacroInputs(cpi_yoy=Decimal("40")),
        MacroShift(usd_try_pct_change=Decimal("0.1")),
        client=client,
    )
    assert result.ticker == "KCHOL"
    assert result.snapshot.usd_try == Decimal("45.00")
    assert result.transmission.fx_sensitivity_annual_try == Decimal("100000000")
    assert "fx_shift_pct" in result.scenario
    assert result.schema_version == "1.0.0"


# ---------- live TCMB (skippable) ----------

@pytest.mark.skipif(
    "pytest" in str(Path(__file__)),  # always skip by default — opt-in live test
    reason="live TCMB fetch — enable by removing the skip when you want to probe.",
)
def test_live_tcmb_fetch() -> None:
    """Opt-in: actually hits www.tcmb.gov.tr/kurlar/today.xml."""
    client = HttpTcmbClient()
    fx = client.fetch_fx()
    client.close()
    assert fx.usd_try is not None and fx.usd_try > Decimal("20")
