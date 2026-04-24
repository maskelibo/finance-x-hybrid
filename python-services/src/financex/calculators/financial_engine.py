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

from financex.schemas.base import ReportingPeriod, Sector
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
# Period-aware multipliers (Fix #5 — 2026-04-24)
#
# Turkish KAP filings are YTD cumulative. Q1 is 3 months of revenue/EBITDA/
# opex, H1 is 6 months, Q3 is 9 months, Q4 == FY is 12 months.
# When we compute a stock/flow ratio (Net Debt / EBITDA) the denominator
# must be ANNUALIZED so the ratio is comparable to the benchmark (which
# is annual). Without annualization, ARCLK Q1-2026 Net Debt/EBITDA came
# out as 28.97x (stock 169.78B / Q1 flow 5.86B) — fake distress signal;
# annualized gives 7.24x (high leverage, not distress).
#
# Similarly `_days(num, denom, days=360)` assumes denom is annual flow.
# For Q1 denom we must pass days=91 (3 months) to get a realistic DSO.
# ---------------------------------------------------------------------
def _annualize_multiplier(period: ReportingPeriod) -> Decimal:
    """Multiplier to extrapolate cumulative YTD flow to 12-month equivalent."""
    return {
        ReportingPeriod.Q1: Decimal("4"),
        ReportingPeriod.H1: Decimal("2"),
        ReportingPeriod.Q3: Decimal("4") / Decimal("3"),
        ReportingPeriod.Q4: Decimal("1"),
        ReportingPeriod.FY: Decimal("1"),
    }.get(period, Decimal("1"))


def _period_days(period: ReportingPeriod) -> int:
    """Calendar-day span of cumulative YTD flow — used by DSO/DIO/DPO."""
    return {
        ReportingPeriod.Q1: 91,
        ReportingPeriod.H1: 181,
        ReportingPeriod.Q3: 273,
        ReportingPeriod.Q4: 365,
        ReportingPeriod.FY: 365,
    }.get(period, 365)


def _annualize(value: Decimal | None, period: ReportingPeriod) -> Decimal | None:
    if value is None:
        return None
    return value * _annualize_multiplier(period)


def _roic(
    ebit: Decimal | None,
    tax_expense: Decimal | None,
    net_income: Decimal | None,
    total_equity: Decimal | None,
    net_debt: Decimal | None,
) -> RatioValue | None:
    """ROIC = NOPAT / Invested Capital.
    NOPAT = EBIT × (1 - effective_tax_rate).
    Invested Capital = Total Equity + Net Debt.
    """
    if ebit is None or total_equity is None:
        return RatioValue(value=None, warning="ROIC: EBIT or equity missing")
    # Effective tax rate from actual tax/pretax; fallback to 25% (Turkish corporate)
    eff_tax = Decimal("0.25")
    if tax_expense is not None and net_income is not None:
        pretax = net_income + abs(tax_expense)  # EBT
        if pretax > 0:
            eff_tax = abs(tax_expense) / pretax
    nopat = ebit * (Decimal("1") - eff_tax)
    invested_capital = total_equity + (net_debt if net_debt is not None else _ZERO)
    if invested_capital <= 0:
        return RatioValue(value=None, warning="ROIC: invested capital <= 0")
    val = (nopat / invested_capital * Decimal("100")).quantize(Decimal("0.0001"))
    return RatioValue(value=val)


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

    # Fix #5 — period-aware days: cumulative YTD flow needs its own day count.
    period_days = _period_days(pf.period)
    dso = _days(bs.trade_receivables, is_.revenue, label="DSO", days=period_days)
    dio = _days(bs.inventories, cogs_abs, label="DIO", days=period_days)
    dpo = _days(bs.trade_payables, cogs_abs, label="DPO", days=period_days)

    # Fix #12 (2026-04-24) — DSO/DIO/DPO anomali tespiti.
    # Turkish BIST sanayi beyaz eşya normali: DSO 40-90, DIO 60-120, DPO 60-180.
    # Dışına çıkan değerler tipik olarak parse hatası (örn. receivables 0'a
    # yakın olduğunda DSO ~0). Bu durumda raw value'yu silme, ama agent
    # için "anomaly" flag ekle. Downstream yorum bunu görür.
    def _flag_anomaly(rv: RatioValue, low: int, high: int, label: str) -> RatioValue:
        if rv.value is None or rv.value == 0:
            return rv
        v = float(rv.value)
        if v < low or v > high:
            tag = f"anomaly_detected: {label} {v:.2f} out of plausible range [{low}-{high}] — verify upstream data"
            # Preserve value but attach warning so downstream LLM sees the flag.
            return RatioValue(value=rv.value, warning=tag)
        return rv
    dso = _flag_anomaly(dso, 5, 200, "DSO")
    dio = _flag_anomaly(dio, 15, 400, "DIO")
    dpo = _flag_anomaly(dpo, 15, 400, "DPO")
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

    # Fix #6 — Normalize FCF for one-off WC swings + annualize for FY band reference.
    # CF konvansiyonu: ΔWC pozitif → WC arttı (nakit emildi). wc_release = -ΔWC
    # böylece pozitif değer = nakit serbest bırakıldı (positive cash impact).
    # Normalize FCF = FCF − ΔWC = FCF + wc_release. Sub-annual periyotlar
    # için _annualize FY band için projeksiyon verir (CEO mandate, 4 metrik).
    wc_change = cf.change_in_working_capital if cf else None
    wc_release_value: Decimal | None = None
    normalized_fcf_value: Decimal | None = None
    if wc_change is not None:
        wc_release_value = -wc_change
    if fcf_value is not None and wc_change is not None:
        normalized_fcf_value = fcf_value - wc_change
    fcf_annualized_value = _annualize(fcf_value, pf.period)
    normalized_fcf_annualized_value = _annualize(normalized_fcf_value, pf.period)

    # EBT (Earnings Before Tax) — pretax income or derive from NI + tax
    ebt_value: Decimal | None = getattr(is_, 'pretax_income', None)
    if ebt_value is None and is_.net_income is not None and is_.tax_expense is not None:
        ebt_value = is_.net_income + abs(is_.tax_expense)

    # IAS29 Gross Profit: Gross Profit + Monetary Gain/Loss (if IAS29 applied)
    monetary = getattr(is_, 'monetary_gain_loss', None)
    gp_ias29: Decimal | None = None
    if is_.gross_profit is not None and monetary is not None:
        gp_ias29 = is_.gross_profit + monetary

    # U6 — IAS 29 operating-only EBITDA.
    # Doğru formül: operating_profit + D&A.
    # NMP (monetary_gain_loss) EXCLUDED per IAS 29 operating definition
    # (Not 35 tipik, finansal giderlerin altı, vergi öncesi kârın üstü).
    ebitda_ias29_val: Decimal | None = None
    ebitda_ias29_warn: str | None = None
    if ebit is not None and da_value is not None:
        ebitda_ias29_val = ebit + abs(da_value)
    elif is_.ebitda is not None:
        # Fallback: schema'daki ebitda alanı (Turkish IFRS 2022+ typically restated)
        ebitda_ias29_val = is_.ebitda
        ebitda_ias29_warn = "fallback: used reported ebitda; verify restatement methodology"
    else:
        ebitda_ias29_warn = "IAS29 EBITDA: operating_income+D&A ve reported ebitda ikisi de eksik"

    # FCF / Interest Payment
    fcf_to_interest_value: Decimal | None = None
    if fcf_value is not None and is_.financial_expense is not None and is_.financial_expense != 0:
        fcf_to_interest_value = fcf_value / abs(is_.financial_expense)

    ratios = EngineRatios(
        gross_margin=_ratio_pct(is_.gross_profit, is_.revenue, label="Gross Margin"),
        ebitda=RatioValue(
            value=ebitda.quantize(Decimal("1")) if ebitda is not None else None,
            warning=None if ebitda is not None else "EBITDA: EBIT or D&A missing",
        ),
        ebt=RatioValue(
            value=ebt_value.quantize(Decimal("1")) if ebt_value is not None else None,
            warning=None if ebt_value is not None else "EBT: pretax_income and tax_expense missing",
        ),
        gross_profit_ias29=RatioValue(
            value=gp_ias29.quantize(Decimal("1")) if gp_ias29 is not None else None,
            warning=None if gp_ias29 is not None else "IAS29 Gross Profit: monetary_gain_loss missing",
        ),
        gross_margin_ias29=_ratio_pct(gp_ias29, is_.revenue, label="Gross Margin IAS29"),
        ebitda_ias29=RatioValue(
            value=ebitda_ias29_val.quantize(Decimal("1")) if ebitda_ias29_val is not None else None,
            warning=ebitda_ias29_warn,
        ),
        ebitda_margin_ias29=_ratio_pct(ebitda_ias29_val, is_.revenue, label="EBITDA Margin IAS29"),
        ebitda_margin=_ratio_pct(ebitda, is_.revenue, label="EBITDA Margin"),
        net_margin=_ratio_pct(is_.net_income, is_.revenue, label="Net Margin"),
        roe=_ratio_pct(is_.net_income, bs.total_equity, label="ROE"),
        roa=_ratio_pct(is_.net_income, bs.total_assets, label="ROA"),
        roce=_ratio_pct(
            ebit,
            (bs.total_assets - bs.current_liabilities) if (bs.current_liabilities is not None) else None,
            label="ROCE",
        ),
        roic=_roic(ebit, is_.tax_expense, is_.net_income, bs.total_equity, net_debt_value),
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
        # Fix #5 — Net Debt is a STOCK (bilanço anı), EBITDA is cumulative FLOW.
        # For non-FY periods the flow is annualized before the ratio so the
        # threshold benchmark (>5x distress) compares apples-to-apples.
        net_debt_to_ebitda=_ratio_raw(
            net_debt_value,
            _annualize(ebitda, pf.period),
            label=f"Net Debt/EBITDA (annualized from {pf.period.value})",
        ),
        # Interest coverage: both sides of the ratio are flows of the same period
        # → no annualization needed; but warn if period is sub-annual.
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
        fcf_to_interest=RatioValue(
            value=fcf_to_interest_value.quantize(Decimal("0.0001")) if fcf_to_interest_value is not None else None,
            warning=None if fcf_to_interest_value is not None else "FCF/Interest: FCF or financial_expense missing",
        ),
        # Fix #6 — CEO mandate quartet
        wc_release=RatioValue(
            value=wc_release_value.quantize(Decimal("1")) if wc_release_value is not None else None,
            warning=None if wc_release_value is not None
            else "WC release: change_in_working_capital missing from CF (ΔWC required)",
        ),
        normalized_fcf=RatioValue(
            value=normalized_fcf_value.quantize(Decimal("1")) if normalized_fcf_value is not None else None,
            warning=None if normalized_fcf_value is not None
            else "Normalized FCF: needs FCF and ΔWC (FCF − ΔWC strips one-off WC swings)",
        ),
        fcf_annualized=RatioValue(
            value=fcf_annualized_value.quantize(Decimal("1")) if fcf_annualized_value is not None else None,
            warning=(
                None if fcf_annualized_value is not None else "FCF annualized: FCF missing"
            ) if pf.period in (ReportingPeriod.FY, ReportingPeriod.Q4)
            else f"FCF annualized from {pf.period.value} (extrapolation — verify seasonality)",
        ),
        normalized_fcf_annualized=RatioValue(
            value=normalized_fcf_annualized_value.quantize(Decimal("1")) if normalized_fcf_annualized_value is not None else None,
            warning=(
                None if normalized_fcf_annualized_value is not None
                else "Normalized FCF annualized: needs FCF and ΔWC"
            ) if pf.period in (ReportingPeriod.FY, ReportingPeriod.Q4)
            else f"Normalized FCF annualized from {pf.period.value} (extrapolation — verify seasonality)",
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
    cf = pf.cash_flow

    # ROE / ROA — same formulas, different inputs (banks' NI is clean).
    roe = _ratio_pct(is_.net_income, bs.total_equity, label="Banking ROE")
    roa = _ratio_pct(is_.net_income, bs.total_assets, label="Banking ROA")

    # Net Interest Margin (NIM) = Net Interest Income / Total Assets
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

    # Loan Loss Provisions / NII
    llp_to_nii = _ratio_pct(
        abs(is_.loan_loss_provisions) if is_.loan_loss_provisions is not None else None,
        is_.net_interest_income,
        label="LLP/NII",
    )

    # Net Margin on Interest Income
    net_margin = _ratio_pct(is_.net_income, is_.interest_income, label="Net Margin (on Interest Income)")

    # Equity Multiplier = Total Assets / Total Equity (bank leverage proxy)
    equity_multiplier = _ratio_raw(bs.total_assets, bs.total_equity, label="Equity Multiplier")

    # NII share = NII / (NII + NFC + Trading + Other)
    # Simplified: NII / (Interest Income) — how much of gross income is interest
    nii_share = _ratio_pct(is_.net_interest_income, is_.interest_income, label="NII/Interest Income")

    # Loans-to-Assets: trade_receivables proxy (banks report loans there)
    loans_to_assets = _ratio_pct(bs.trade_receivables, bs.total_assets, label="Loans/Assets")

    # Net Debt — banks: financial debt - cash (same formula, different interpretation)
    net_debt_value: Decimal | None = None
    if bs.short_term_debt is not None and bs.long_term_debt is not None and bs.cash_and_equivalents is not None:
        net_debt_value = bs.short_term_debt + bs.long_term_debt - bs.cash_and_equivalents

    # Current ratio — meaningful even for banks
    current_ratio = _ratio_raw(bs.current_assets, bs.current_liabilities, label="Current Ratio")

    # FCF — if cash flow data available
    fcf_value: Decimal | None = None
    if cf and cf.operating_cash_flow is not None and cf.capex is not None:
        fcf_value = cf.operating_cash_flow - abs(cf.capex)

    # Fix #6 — CEO mandate quartet (banks)
    wc_change = cf.change_in_working_capital if cf else None
    wc_release_value: Decimal | None = -wc_change if wc_change is not None else None
    normalized_fcf_value: Decimal | None = (
        fcf_value - wc_change if (fcf_value is not None and wc_change is not None) else None
    )
    fcf_annualized_value = _annualize(fcf_value, pf.period)
    normalized_fcf_annualized_value = _annualize(normalized_fcf_value, pf.period)

    # Piotroski-like quality checks still work for banks via the generic fields
    ratios = EngineRatios(
        # Generic slots (backward compat)
        ebitda_margin=nim,                        # reused slot: banks → NIM
        net_margin=net_margin,
        roe=roe,
        roa=roa,
        opex_to_revenue=cost_to_income,           # banks → Cost/Income
        interest_coverage=llp_to_nii,             # banks → LLP/NII
        current_ratio=current_ratio,
        net_debt=RatioValue(
            value=net_debt_value.quantize(Decimal("1")) if net_debt_value is not None else None,
            warning=None if net_debt_value is not None else "Net Debt: missing debt/cash fields",
        ),
        fcf=RatioValue(
            value=fcf_value.quantize(Decimal("1")) if fcf_value is not None else None,
            warning=None if fcf_value is not None else "FCF: OCF or CAPEX missing in banking report",
        ),
        # Fix #6 — CEO mandate quartet (banks)
        wc_release=RatioValue(
            value=wc_release_value.quantize(Decimal("1")) if wc_release_value is not None else None,
            warning=None if wc_release_value is not None else "WC release: ΔWC missing from CF",
        ),
        normalized_fcf=RatioValue(
            value=normalized_fcf_value.quantize(Decimal("1")) if normalized_fcf_value is not None else None,
            warning=None if normalized_fcf_value is not None else "Normalized FCF: needs FCF and ΔWC",
        ),
        fcf_annualized=RatioValue(
            value=fcf_annualized_value.quantize(Decimal("1")) if fcf_annualized_value is not None else None,
            warning=(
                None if fcf_annualized_value is not None else "FCF annualized: FCF missing"
            ) if pf.period in (ReportingPeriod.FY, ReportingPeriod.Q4)
            else f"FCF annualized from {pf.period.value} (extrapolation)",
        ),
        normalized_fcf_annualized=RatioValue(
            value=normalized_fcf_annualized_value.quantize(Decimal("1")) if normalized_fcf_annualized_value is not None else None,
            warning=(
                None if normalized_fcf_annualized_value is not None
                else "Normalized FCF annualized: needs FCF and ΔWC"
            ) if pf.period in (ReportingPeriod.FY, ReportingPeriod.Q4)
            else f"Normalized FCF annualized from {pf.period.value} (extrapolation)",
        ),
        # Banking-specific named fields
        nim=nim,
        cost_to_income=cost_to_income,
        llp_to_nii=llp_to_nii,
        loans_to_assets=loans_to_assets,
        equity_multiplier=equity_multiplier,
        nii_growth=nii_share,
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
