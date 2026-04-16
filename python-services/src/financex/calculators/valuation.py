"""valuation — hybrid runner on top of financial_engine.

Python does the DCF arithmetic + peer-multiple aggregation. The LLM
layer picks WACC / terminal-growth policy, writes the Bull/Base/Bear
scenarios and composes the weighted fair value. TRY WACC is intentionally
flagged as unsafe on Turkish filers (see valuation_astor_learnings memory).
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from financex.calculators.financial_engine import (
    PiotroskiDeltas,
    ValuationInputs,
    compute_for_period,
)
from financex.schemas.analysis import FinancialAnalysisOutput
from financex.schemas.base import FinancexModel, Sector
from financex.schemas.engine import DcfResult
from financex.schemas.financials import PeriodFinancials


# ---------- Schemas ----------

class PeerMultipleStats(FinancexModel):
    metric: str
    count: int
    median: Decimal | None = None
    low: Decimal | None = None
    high: Decimal | None = None
    q1: Decimal | None = None
    q3: Decimal | None = None


class ValuationOutput(FinancexModel):
    ticker: str
    sector: Sector
    period_label: str

    dcf: DcfResult | None = None
    peer_ev_ebitda: PeerMultipleStats | None = None
    peer_pe: PeerMultipleStats | None = None

    # LLM hints
    try_wacc_warning: bool = False
    holding_sotp_required: bool = False
    banking_sector_warning: bool = False

    notes: list[str] = []
    computed_at: datetime
    schema_version: str = "1.0.0"


# ---------- Peer multiples ----------

@dataclass(frozen=True)
class _PeerMetric:
    code: str
    values: list[Decimal]


def _peer_stats(code: str, peers: list[FinancialAnalysisOutput]) -> PeerMultipleStats:
    values: list[Decimal] = []
    for p in peers:
        hv = p.canonical_numbers.get(code)
        if hv is not None:
            values.append(hv)
    if not values:
        return PeerMultipleStats(metric=code, count=0)
    sorted_vals = sorted(values)
    floats = [float(v) for v in values]
    q = statistics.quantiles(floats, n=4, method="inclusive") if len(floats) >= 2 else [floats[0]] * 3
    return PeerMultipleStats(
        metric=code,
        count=len(values),
        low=sorted_vals[0],
        high=sorted_vals[-1],
        q1=Decimal(str(round(q[0], 4))),
        median=Decimal(str(round(q[1], 4))),
        q3=Decimal(str(round(q[2], 4))),
    )


# ---------- Orchestrator ----------

def run_valuation(
    ticker: str,
    pf: PeriodFinancials,
    *,
    valuation_inputs: ValuationInputs | None = None,
    market_cap: Decimal | None = None,
    shares_outstanding: Decimal | None = None,
    peers: list[FinancialAnalysisOutput] | None = None,
) -> ValuationOutput:
    """Full valuation pass for one ticker.

    Runs the engine's DCF if valuation_inputs + shares supplied, then
    aggregates peer multiples where peers are given. Sector-aware: bank
    DCF would need FCFE + NIM assumptions — current engine does an
    industrial-style FCF DCF, so we flag the limitation instead of
    silently computing a misleading number.
    """
    notes: list[str] = []

    # Warn on sector mismatches
    try_wacc_warning = False
    holding_sotp = False
    banking_warning = False
    if valuation_inputs and valuation_inputs.wacc_override is not None:
        w = valuation_inputs.wacc_override
        # Turkish TRY WACC is typically 30-40%+; USD-equivalent 12-18%.
        if w > Decimal("0.25"):
            try_wacc_warning = True
            notes.append(
                f"WACC override {w} looks like a TRY rate. Memory warns this is the 'TRY WACC trap' — "
                "prefer USD WACC for Turkish filers unless FCFs are TRY-nominal and matched."
            )
    if pf.sector == Sector.HOLDING:
        holding_sotp = True
        notes.append("Holding — consolidated DCF is an upper bound only. SOTP required for real fair value.")
    if pf.sector == Sector.BANKING:
        banking_warning = True
        notes.append("Banking — FCF-based DCF not applicable; prefer excess return or DDM. Skipping DCF.")

    # DCF (industrial / holding only)
    dcf_result: DcfResult | None = None
    if pf.sector != Sector.BANKING and valuation_inputs:
        engine = compute_for_period(
            pf,
            market_cap=market_cap,
            shares_outstanding=shares_outstanding,
            valuation=valuation_inputs,
        )
        dcf_result = engine.dcf

    # Peer multiples
    peer_ev_ebitda = None
    peer_pe = None
    if peers:
        peer_ev_ebitda = _peer_stats("ebitda_margin", peers)  # proxy for EV/EBITDA relative pos
        peer_pe = _peer_stats("net_margin", peers)            # proxy for P/E relative pos

    return ValuationOutput(
        ticker=ticker.upper(),
        sector=pf.sector,
        period_label=f"{pf.period.value}-{pf.year}",
        dcf=dcf_result,
        peer_ev_ebitda=peer_ev_ebitda,
        peer_pe=peer_pe,
        try_wacc_warning=try_wacc_warning,
        holding_sotp_required=holding_sotp,
        banking_sector_warning=banking_warning,
        notes=notes,
        computed_at=datetime.now(UTC),
    )


# Convenience re-exports so callers don't need two imports.
__all__ = ["ValuationInputs", "PiotroskiDeltas", "ValuationOutput", "PeerMultipleStats", "run_valuation"]
