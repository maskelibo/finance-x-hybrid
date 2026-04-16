"""macro_analysis — hybrid runner.

Python builds the MacroSnapshot (FX from TCMB today.xml; rates/CPI
user-supplied until EVDS key is wired) and computes company-specific
TransmissionImpact. The LLM layer adds geopolitical narrative and
judges which channel (FX / rate / energy / commodity) is the binding
constraint in the current cycle.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from decimal import Decimal

from financex.calculators.transmission import (
    CompanyExposure,
    MacroShift,
    compute_transmission,
)
from financex.crawlers.tcmb import HttpTcmbClient, TcmbClient
from financex.schemas.base import FinancexModel, SourceRef
from financex.schemas.macro import MacroSnapshot, TransmissionImpact


@dataclass(frozen=True)
class MacroInputs:
    """Non-FX macro figures. Until EVDS is wired, the caller supplies these."""

    tcmb_policy_rate: Decimal | None = None
    cpi_yoy: Decimal | None = None
    ppi_yoy: Decimal | None = None
    gdp_yoy: Decimal | None = None
    bist100_level: Decimal | None = None
    bist100_ytd_return: Decimal | None = None


class MacroAnalysisOutput(FinancexModel):
    """Canonical macro package handed to the LLM analyst."""

    ticker: str
    as_of: date
    snapshot: MacroSnapshot
    transmission: TransmissionImpact
    scenario: dict[str, str] = field(default_factory=dict)  # type: ignore[assignment]
    computed_at: datetime
    schema_version: str = "1.0.0"


def build_snapshot(
    inputs: MacroInputs,
    *,
    client: TcmbClient | None = None,
    as_of: date | None = None,
) -> MacroSnapshot:
    """Pull FX from TCMB and fold in user-provided macro aggregates."""
    tcmb = client or HttpTcmbClient()
    try:
        fx = tcmb.fetch_fx(as_of)
    finally:
        if isinstance(tcmb, HttpTcmbClient) and client is None:
            tcmb.close()

    return MacroSnapshot(
        as_of=fx.as_of or as_of or date.today(),
        tcmb_policy_rate=inputs.tcmb_policy_rate,
        cpi_yoy=inputs.cpi_yoy,
        ppi_yoy=inputs.ppi_yoy,
        usd_try=fx.usd_try,
        eur_try=fx.eur_try,
        gdp_yoy=inputs.gdp_yoy,
        bist100_level=inputs.bist100_level,
        bist100_ytd_return=inputs.bist100_ytd_return,
        sources=[
            SourceRef(
                source_id="tcmb",
                url="https://www.tcmb.gov.tr/kurlar/today.xml",
                fetched_at=datetime.now(UTC),
                detail="FX from today.xml; macro aggregates from MacroInputs",
            )
        ],
    )


def analyze_macro(
    ticker: str,
    exposure: CompanyExposure,
    inputs: MacroInputs,
    shift: MacroShift,
    *,
    client: TcmbClient | None = None,
    as_of: date | None = None,
    commodity_baseline_price_try_per_ton: Decimal = Decimal("0"),
) -> MacroAnalysisOutput:
    snapshot = build_snapshot(inputs, client=client, as_of=as_of)
    usd_try = snapshot.usd_try or Decimal("1")
    transmission = compute_transmission(
        exposure,
        shift,
        usd_try=usd_try,
        commodity_baseline_price_try_per_ton=commodity_baseline_price_try_per_ton,
    )
    return MacroAnalysisOutput(
        ticker=ticker.upper(),
        as_of=snapshot.as_of or date.today(),
        snapshot=snapshot,
        transmission=transmission,
        scenario={
            "fx_shift_pct": str(shift.usd_try_pct_change),
            "rate_shift_bp": str(shift.policy_rate_bp_change),
            "brent_shift_usd": str(shift.brent_usd_change),
            "commodity_shift_pct": str(shift.sector_commodity_pct_change),
        },
        computed_at=datetime.now(UTC),
    )
