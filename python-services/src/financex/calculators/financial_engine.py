"""Deterministic financial engine — Python port of backend/src/financial-engine.ts.

Purpose: take a validated PeriodFinancials (from parse_standardization +
reconciliation) and compute every canonical ratio/score/valuation the
downstream LLM agents would otherwise have to do by arithmetic.

Key differences from the TS original:
  - Decimal throughout (TS used float) — finance math cannot tolerate
    binary rounding on large figures.
  - Sector-aware: banking gets NIM, Cost-to-Income, LDR, Loans-to-Assets
    instead of inventory turnover / CCC (which are meaningless for banks).
  - Takes a PeriodFinancials directly via `compute_for_period()` — no
    need to wrap an intermediate FinancialInputs dict.
  - Emits a schemas.EngineOutput so Node can Ajv-validate the JSON.

Graceful degradation: any missing input returns a RatioValue(None, warning)
rather than raising, so a partial period is still useful.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from decimal import Decimal
from typing import Iterable

from financex.schemas.base import Sector
from financex.schemas.engine import (
    DcfResult,
    DcfSensitivityCell,
    EngineOutput,
    EngineRatios,
    EngineScores,
    RatioValue,
)
from financex.schemas.financials import PeriodFinancials


# ---------------------------------------------------------------------
# Safe math primitives
# ---------------------------------------------------------------------

_ZERO = Decimal("0")


def _safe_div(num: Decimal | None, denom: Decimal | None) -> Decimal | None:
    if num is None or denom is None or denom == 0:
        return None
    return num / denom


def _pct(num: Decimal | None, denom: Decimal | None) -> Decimal | None:
    """Return num/denom * 100 as Decimal, rounded to 4 dp; None on invalid."""
    if num is None or denom is None or denom == 0:
        return None
    return ((num / denom) * Decimal("100")).quantize(Decimal("0.0001"))


def _ratio_pct(num: Decimal | None, denom: Decimal | None, *, label: str) -> RatioValue:
    if num is None:
        return RatioValue(value=None, warning=f"{label}: numerator missing")
    if denom is None:
        return RatioValue(value=None, warning=f"{label}: denominator missing")
    if denom == 0:
        return RatioValue(value=None, warning=f"{label}: division by zero")
    return RatioValue(value=((num / denom) * Decimal("100")).quantize(Decimal("0.0001")))


def _ratio_raw(num: Decimal | None, denom: Decimal | None, *, label: str) -> RatioValue:
    """Return raw num/denom (not a percentage) — for ratios like Net Debt/EBITDA."""
    if num is None:
        return RatioValue(value=None, warning=f"{label}: numerator missing")
    if denom is None:
        return RatioValue(value=None, warning=f"{label}: denominator missing")
    if denom == 0:
        return RatioValue(value=None, warning=f"{label}: division by zero")
    return RatioValue(value=(num / denom).quantize(Decimal("0.0001")))


def _days(num: Decimal | None, denom: Decimal | None, *, label: str, days: int = 360) -> RatioValue:
    if num is None or denom is None or denom == 0:
        return RatioValue(value=None, warning=f"{label}: missing or zero denominator")
    return RatioValue(value=((num / denom) * Decimal(days)).quantize(Decimal("0.01")))


# ---------------------------------------------------------------------
# Standard (industrial) ratios
# ---------------------------------------------------------------------

def _industrial_ratios(pf: PeriodFinancials) -> EngineRatios:
    bs = pf.balance_sheet
    is_ = pf.income_statement
    cf = pf.cash_flow

    # Derive CoGS as a positive number when reported negative in KAP.
    cogs_abs: Decimal | None = None
    if is_.cost_of_sales is not None:
        cogs_abs = abs(is_.cost_of_sales)

    # EBIT proxy: operating_income if present, else revenue − cogs − opex.
    ebit: Decimal | None = is_.operating_income

    # EBITDA proxy: if ebitda present use it, else EBIT + D&A.
    # D&A may be in income_statement or cash_flow (KAP format puts it in
    # cash_flow as "Amortisman ve İtfa Gideri İle İlgili Düzeltmeler").
    ebitda: Decimal | None = is_.ebitda
    da_value = is_.depreciation_amortization or (cf.depreciation_amortization if cf else None)
    if ebitda is None and ebit is not None and da_value is not None:
        ebitda = ebit + abs(da_value)

    dso = _days(bs.trade_receivables, is_.revenue, label="DSO")
    dio = _days(bs.inventories, cogs_abs, label="DIO")
    dpo = _days(bs.trade_payables, cogs_abs, label="DPO")
    ccc_val = None
    ccc_warn = None
    if dso.value is not None and dio.value is not None and dpo.value is not None:
        ccc_val = (dso.value + dio.value - dpo.value).quantize(Decimal("0.01"))
    else:
        ccc_warn = "CCC: one of DSO/DIO/DPO missing"

    net_debt_value: Decimal | None = None
    if (bs.short_term_debt is not None) and (bs.long_term_debt is not None) and (bs.cash_and_equivalents is not None):
        net_debt_value = bs.short_term_debt + bs.long_term_debt - bs.cash_and_equivalents

    fcf_value: Decimal | None = None
    if cf and cf.operating_cash_flow is not None and cf.capex is not None:
        fcf_value = cf.operating_cash_flow - abs(cf.capex)

    ratios = EngineRatios(
        gross_margin=_ratio_pct(is_.gross_profit, is_.revenue, label="Gross Margin"),
        ebitda_margin=_ratio_pct(ebitda, is_.revenue, label="EBITDA Margin"),
        net_margin=_ratio_pct(is_.net_income, is_.revenue, label="Net Margin"),
        roe=_ratio_pct(is_.net_income, bs.total_equity, label="ROE"),
        roa=_ratio_pct(is_.net_income, bs.total_assets, label="ROA"),
        roce=_ratio_pct(
            ebit,
            (bs.total_assets - bs.current_liabilities) if (bs.current_liabilities is not None) else None,
            label="ROCE",
        ),
        opex_to_revenue=_ratio_pct(is_.opex, is_.revenue, label="OPEX/Revenue"),
        dso=dso,
        dio=dio,
        dpo=dpo,
        ccc=RatioValue(value=ccc_val, warning=ccc_warn),
        nwc_to_revenue=_ratio_pct(
            (bs.current_assets - bs.current_liabilities)
            if (bs.current_assets is not None and bs.current_liabilities is not None)
            else None,
            is_.revenue,
            label="NWC/Revenue",
        ),
        net_debt=RatioValue(
            value=net_debt_value.quantize(Decimal("1")) if net_debt_value is not None else None,
            warning=None if net_debt_value is not None else "Net Debt: short/long debt or cash missing",
        ),
        net_debt_to_ebitda=_ratio_raw(net_debt_value, ebitda, label="Net Debt/EBITDA"),
        interest_coverage=_ratio_raw(
            ebitda,
            abs(is_.financial_expense) if is_.financial_expense is not None else None,
            label="Interest Coverage",
        ),
        current_ratio=_ratio_raw(bs.current_assets, bs.current_liabilities, label="Current Ratio"),
        acid_test=_ratio_raw(
            (bs.current_assets - bs.inventories)
            if (bs.current_assets is not None and bs.inventories is not None)
            else None,
            bs.current_liabilities,
            label="Acid Test",
        ),
        fcf=RatioValue(
            value=fcf_value.quantize(Decimal("1")) if fcf_value is not None else None,
            warning=None if fcf_value is not None else "FCF: OCF or CAPEX missing",
        ),
        ocf_to_ebitda=_ratio_pct(
            cf.operating_cash_flow if cf else None, ebitda, label="OCF/EBITDA"
        ),
        capex_to_ebitda=_ratio_pct(
            abs(cf.capex) if (cf and cf.capex is not None) else None, ebitda, label="CAPEX/EBITDA"
        ),
        interest_burden=_ratio_pct(
            abs(is_.financial_expense) if is_.financial_expense is not None else None,
            ebitda,
            label="Interest Burden",
        ),
    )
    return ratios


# ---------------------------------------------------------------------
# Banking ratios — NIM, Cost-to-Income, ROE, ROA
# ---------------------------------------------------------------------

def _banking_ratios(pf: PeriodFinancials) -> EngineRatios:
    """Banks need a different slate. Most of the industrial ratios are
    N/A (no CoGS, no DIO/DPO/CCC) — we compute what makes sense and
    leave the rest None with a warning.
    """
    bs = pf.balance_sheet
    is_ = pf.income_statement

    # ROE / ROA — same formulas, different inputs (banks' NI is clean).
    roe = _ratio_pct(is_.net_income, bs.total_equity, label="Banking ROE")
    roa = _ratio_pct(is_.net_income, bs.total_assets, label="Banking ROA")

    # Net Interest Margin (NIM) = Net Interest Income / Total Assets
    # (annualised — we leave annualisation to the caller since period
    # cadence comes from PeriodFinancials.period)
    nim = _ratio_pct(is_.net_interest_income, bs.total_assets, label="NIM")

    # Cost-to-Income: bank_operating_expenses / (NII + NFC)
    operating_income_bank: Decimal | None = None
    if is_.net_interest_income is not None:
        operating_income_bank = is_.net_interest_income
        if is_.net_fee_and_commission_income is not None:
            operating_income_bank = operating_income_bank + is_.net_fee_and_commission_income
    cost_to_income = _ratio_pct(
        abs(is_.bank_operating_expenses) if is_.bank_operating_expenses is not None else None,
        operating_income_bank,
        label="Cost/Income",
    )

    # Signal loan-loss-provision ratio relative to NII (health proxy).
    llp_to_nii = _ratio_pct(
        abs(is_.loan_loss_provisions) if is_.loan_loss_provisions is not None else None,
        is_.net_interest_income,
        label="LLP/NII",
    )

    # We stash the banking-specific ratios in the generic EngineRatios
    # shape; NIM lives on ebitda_margin slot conceptually (banks don't
    # have EBITDA). Keep canonical names by using custom dict on the
    # EngineOutput later — for now, use the generic slots.
    ratios = EngineRatios(
        ebitda_margin=nim,                        # reused slot: banks → NIM
        net_margin=_ratio_pct(is_.net_income, is_.interest_income, label="Net Margin (on Interest Income)"),
        roe=roe,
        roa=roa,
        opex_to_revenue=cost_to_income,           # banks → Cost/Income
        interest_coverage=llp_to_nii,             # banks → LLP/NII (distress proxy)
    )
    return ratios


# ---------------------------------------------------------------------
# Scoring — Altman Z (industrial only), Piotroski F (generic)
# ---------------------------------------------------------------------

def _altman_z(pf: PeriodFinancials, market_cap: Decimal | None) -> RatioValue:
    bs = pf.balance_sheet
    is_ = pf.income_statement
    if pf.sector == Sector.BANKING:
        return RatioValue(value=None, warning="Altman Z: not applicable to banks")
    if bs.total_assets == 0 or bs.total_liabilities == 0:
        return RatioValue(value=None, warning="Altman Z: division by zero on TA/TL")
    if market_cap is None:
        return RatioValue(value=None, warning="Altman Z: market_cap missing")

    nwc = None
    if bs.current_assets is not None and bs.current_liabilities is not None:
        nwc = bs.current_assets - bs.current_liabilities
    if nwc is None:
        return RatioValue(value=None, warning="Altman Z: NWC missing")

    ebit = is_.operating_income
    if ebit is None:
        return RatioValue(value=None, warning="Altman Z: EBIT (operating_income) missing")

    retained_earnings = bs.total_equity  # approximation when parent equity not broken out
    ta = bs.total_assets

    z = (
        Decimal("1.2") * (nwc / ta)
        + Decimal("1.4") * (retained_earnings / ta)
        + Decimal("3.3") * (ebit / ta)
        + Decimal("0.6") * (market_cap / bs.total_liabilities)
        + Decimal("1.0") * (is_.revenue / ta)
    )
    return RatioValue(value=z.quantize(Decimal("0.01")))


@dataclass(frozen=True)
class PiotroskiDeltas:
    """Year-over-year change inputs needed for Piotroski F. Missing values
    default to 0 — the engine returns a valid score (0-9), but caller
    should know the result is lower bound."""

    roa_delta: Decimal = _ZERO
    leverage_delta: Decimal = _ZERO       # Debt/Assets(t) − Debt/Assets(t-1); <0 = improving
    current_ratio_delta: Decimal = _ZERO  # CR(t) − CR(t-1); >0 = improving
    new_shares_delta: Decimal = _ZERO     # shares(t) − shares(t-1); ≤0 = no dilution
    gross_margin_delta: Decimal = _ZERO   # GM(t) − GM(t-1); >0 = improving
    asset_turnover_delta: Decimal = _ZERO


def _piotroski_f(pf: PeriodFinancials, deltas: PiotroskiDeltas) -> RatioValue:
    is_ = pf.income_statement
    cf = pf.cash_flow
    if cf is None:
        return RatioValue(value=None, warning="Piotroski F: cash flow missing")
    checks = [
        is_.net_income > 0,
        cf.operating_cash_flow > 0,
        deltas.roa_delta > 0,
        cf.operating_cash_flow > is_.net_income,
        deltas.leverage_delta < 0,
        deltas.current_ratio_delta > 0,
        deltas.new_shares_delta <= 0,
        deltas.gross_margin_delta > 0,
        deltas.asset_turnover_delta > 0,
    ]
    return RatioValue(value=Decimal(sum(1 for c in checks if c)))


# ---------------------------------------------------------------------
# WACC + DCF + sensitivity matrix
# ---------------------------------------------------------------------

def _wacc(
    ke: Decimal | None,
    kd: Decimal | None,
    tax_rate: Decimal | None,
    equity_weight: Decimal | None,
    debt_weight: Decimal | None,
) -> RatioValue:
    if None in (ke, kd, tax_rate, equity_weight, debt_weight):
        return RatioValue(value=None, warning="WACC: inputs missing")
    if abs((equity_weight + debt_weight) - Decimal("1")) > Decimal("0.05"):  # type: ignore[operator]
        return RatioValue(value=None, warning="WACC: weights do not sum to ~1.0")
    val = (
        ke * equity_weight  # type: ignore[operator]
        + kd * (Decimal("1") - tax_rate) * debt_weight  # type: ignore[operator]
    )
    return RatioValue(value=val.quantize(Decimal("0.0001")))


def _dcf(
    fcf_projections: Iterable[Decimal],
    wacc_rate: Decimal,
    terminal_growth: Decimal,
    shares_outstanding: Decimal,
    net_debt: Decimal = _ZERO,
) -> DcfResult | None:
    fcfs = list(fcf_projections)
    if not fcfs:
        return None
    if wacc_rate <= 0 or terminal_growth >= wacc_rate or shares_outstanding <= 0:
        return None

    pv_fcf: list[Decimal] = []
    for i, fcf in enumerate(fcfs, start=1):
        discount = (Decimal("1") + wacc_rate) ** i
        pv_fcf.append((fcf / discount).quantize(Decimal("1")))

    last_fcf = fcfs[-1]
    terminal = (last_fcf * (Decimal("1") + terminal_growth)) / (wacc_rate - terminal_growth)
    pv_terminal = (terminal / ((Decimal("1") + wacc_rate) ** len(fcfs))).quantize(Decimal("1"))

    enterprise_value = sum(pv_fcf, _ZERO) + pv_terminal
    equity_value = enterprise_value - net_debt
    fair_value_per_share = (equity_value / shares_outstanding).quantize(Decimal("0.01"))

    return DcfResult(
        wacc=wacc_rate,
        terminal_growth=terminal_growth,
        fair_value_per_share=fair_value_per_share,
        enterprise_value=enterprise_value.quantize(Decimal("1")),
        pv_fcf=pv_fcf,
        terminal_value=terminal.quantize(Decimal("1")),
        sensitivity=[],
    )


def _sensitivity(
    fcf_projections: Iterable[Decimal],
    shares_outstanding: Decimal,
    wacc_range: Iterable[Decimal],
    tg_range: Iterable[Decimal],
    net_debt: Decimal = _ZERO,
) -> list[DcfSensitivityCell]:
    out: list[DcfSensitivityCell] = []
    fcfs = list(fcf_projections)
    for w in wacc_range:
        for tg in tg_range:
            result = _dcf(fcfs, w, tg, shares_outstanding, net_debt)
            if result is not None:
                out.append(
                    DcfSensitivityCell(
                        wacc=w,
                        terminal_growth=tg,
                        fair_value_per_share=result.fair_value_per_share,
                    )
                )
    return out


# ---------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------

@dataclass(frozen=True)
class ValuationInputs:
    """Assumption bundle for WACC + DCF. Usually supplied by the LLM
    valuation agent; engine just does the arithmetic."""

    ke: Decimal | None = None
    kd: Decimal | None = None
    tax_rate: Decimal | None = None
    equity_weight: Decimal | None = None
    debt_weight: Decimal | None = None
    fcf_projections: list[Decimal] = field(default_factory=list)
    terminal_growth: Decimal | None = None
    wacc_override: Decimal | None = None


def compute_for_period(
    pf: PeriodFinancials,
    *,
    market_cap: Decimal | None = None,
    shares_outstanding: Decimal | None = None,
    valuation: ValuationInputs | None = None,
    piotroski_deltas: PiotroskiDeltas | None = None,
) -> EngineOutput:
    """Run every applicable metric. Pipeline callers wrap this around a
    single PeriodFinancials output by parse_standardization.
    """
    warnings: list[str] = []

    # --- Ratios ----------------------------------------------------------
    ratios = _banking_ratios(pf) if pf.sector == Sector.BANKING else _industrial_ratios(pf)

    # --- Scores ----------------------------------------------------------
    altman = _altman_z(pf, market_cap)
    piotroski = _piotroski_f(pf, piotroski_deltas or PiotroskiDeltas())
    scores = EngineScores(altman_z=altman, piotroski_f=piotroski)

    # --- WACC + DCF ------------------------------------------------------
    wacc_value: Decimal | None = None
    dcf_result: DcfResult | None = None
    if valuation:
        if valuation.wacc_override is not None:
            wacc_value = valuation.wacc_override
        else:
            w_calc = _wacc(
                valuation.ke, valuation.kd, valuation.tax_rate,
                valuation.equity_weight, valuation.debt_weight,
            )
            if w_calc.warning:
                warnings.append(w_calc.warning)
            wacc_value = w_calc.value

        if (
            wacc_value is not None
            and valuation.fcf_projections
            and valuation.terminal_growth is not None
            and shares_outstanding is not None
            and shares_outstanding > 0
        ):
            nd = ratios.net_debt.value if (ratios.net_debt and ratios.net_debt.value is not None) else _ZERO
            dcf_result = _dcf(
                valuation.fcf_projections,
                wacc_value,
                valuation.terminal_growth,
                shares_outstanding,
                nd,
            )
            if dcf_result is not None:
                # Build sensitivity grid centred on base case
                w_grid = [
                    wacc_value - Decimal("0.02"),
                    wacc_value - Decimal("0.01"),
                    wacc_value,
                    wacc_value + Decimal("0.01"),
                    wacc_value + Decimal("0.02"),
                ]
                tg_grid = [
                    valuation.terminal_growth - Decimal("0.01"),
                    valuation.terminal_growth,
                    valuation.terminal_growth + Decimal("0.01"),
                    valuation.terminal_growth + Decimal("0.02"),
                ]
                dcf_result.sensitivity.extend(
                    _sensitivity(valuation.fcf_projections, shares_outstanding, w_grid, tg_grid, nd)
                )

    # Collect ratio warnings
    for slot_name in EngineRatios.model_fields.keys():
        rv = getattr(ratios, slot_name, None)
        if rv is not None and rv.warning:
            warnings.append(f"{slot_name}: {rv.warning}")

    return EngineOutput(
        ratios=ratios,
        scores=scores,
        dcf=dcf_result,
        warnings=warnings,
        computed_at=datetime.now(UTC).isoformat(),
    )
