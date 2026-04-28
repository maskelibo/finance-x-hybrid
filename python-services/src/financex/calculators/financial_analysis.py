"""financial_analysis — hybrid runner.

Python side: deterministic extraction of highlights, red flags, and
trends from an EngineOutput + PeriodFinancials. The LLM reads this
package and adds narrative; it does not recompute anything.

Design:
  - One entry point: analyze_financials(pf, engine, prior_pf=None, ticker=None).
  - Sector-dispatched rule sets:
      - Industrial: EBITDA margin, Gross margin, ROE, CCC, Net debt/EBITDA, FCF.
      - Banking:    NIM, Cost/Income, ROE, LLP burden.
      - Holding:    same as industrial + flag dual-stream P&L.
  - Rules are plain `if` checks against engine values; bands are based on
    conservative industry heuristics — the LLM tunes narrative, the rules
    just surface the observation.
"""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from financex.schemas.analysis import (
    FinancialAnalysisOutput,
    MetricHighlight,
    RedFlag,
    Trend,
    TrendPoint,
)
from financex.schemas.base import Sector
from financex.schemas.engine import EngineOutput
from financex.schemas.financials import PeriodFinancials


# ---------------------------------------------------------------------
# Rule helpers
# ---------------------------------------------------------------------

def _hl(
    code: str, label: str, value: Decimal | None, unit: str, hint: str | None = None
) -> MetricHighlight:
    return MetricHighlight(code=code, label=label, value=value, unit=unit, narrative_hint=hint)


def _flag(code: str, severity: str, message: str) -> RedFlag:
    return RedFlag(code=code, severity=severity, message=message)


# ---------------------------------------------------------------------
# Industrial / holding rules
# ---------------------------------------------------------------------

def _industrial_highlights(pf: PeriodFinancials, eng: EngineOutput) -> list[MetricHighlight]:
    r = eng.ratios
    out: list[MetricHighlight] = []

    if r.gross_margin and r.gross_margin.value is not None:
        out.append(_hl(
            "GROSS_MARGIN", "Gross margin", r.gross_margin.value, "%",
            hint="Benchmark against sector. Margin <15% in industrial or <25% in consumer is thin.",
        ))
    if r.ebitda_margin and r.ebitda_margin.value is not None:
        out.append(_hl(
            "EBITDA_MARGIN", "EBITDA margin", r.ebitda_margin.value, "%",
            hint="Core operating profitability. <10% is pressured.",
        ))
    if r.net_margin and r.net_margin.value is not None:
        out.append(_hl(
            "NET_MARGIN", "Net margin", r.net_margin.value, "%",
            hint="After-financing profitability. Negative signals P&L distress.",
        ))
    if r.roe and r.roe.value is not None:
        out.append(_hl(
            "ROE", "Return on equity", r.roe.value, "%",
            hint="Compare vs Turkish equity cost of capital (~30% TRY, ~15% USD).",
        ))
    if r.ccc and r.ccc.value is not None:
        out.append(_hl(
            "CCC", "Cash conversion cycle", r.ccc.value, "days",
            hint="Negative CCC = supplier-financed growth (rare and favourable).",
        ))
    if r.net_debt and r.net_debt.value is not None:
        out.append(_hl(
            "NET_DEBT", "Net debt", r.net_debt.value, "TL",
            hint="Absolute number — contextualise against total equity.",
        ))
    if r.net_debt_to_ebitda and r.net_debt_to_ebitda.value is not None:
        out.append(_hl(
            "NET_DEBT_TO_EBITDA", "Net debt / EBITDA", r.net_debt_to_ebitda.value, "ratio",
            hint=">3x typically concerning; >5x is stressed.",
        ))
    if r.fcf and r.fcf.value is not None:
        out.append(_hl(
            "FCF", "Free cash flow (OCF−CAPEX)", r.fcf.value, "TL",
            hint="Negative FCF: growth CAPEX or ops drag? LLM should distinguish.",
        ))
    if eng.scores.altman_z and eng.scores.altman_z.value is not None:
        out.append(_hl(
            "ALTMAN_Z", "Altman Z-score", eng.scores.altman_z.value, "score",
            hint="<1.81 distress zone; >2.99 safe zone. Between = grey.",
        ))
    if eng.scores.piotroski_f and eng.scores.piotroski_f.value is not None:
        out.append(_hl(
            "PIOTROSKI_F", "Piotroski F-score", eng.scores.piotroski_f.value, "score",
            hint="0–9 scale. 7–9 = strong; 0–3 = weak. Needs YoY deltas for full signal.",
        ))
    return out


def _industrial_red_flags(pf: PeriodFinancials, eng: EngineOutput) -> list[RedFlag]:
    r = eng.ratios
    flags: list[RedFlag] = []

    if r.net_margin and r.net_margin.value is not None and r.net_margin.value < 0:
        flags.append(_flag("NET_LOSS", "critical", f"Net margin negative ({r.net_margin.value}%)."))
    if r.current_ratio and r.current_ratio.value is not None and r.current_ratio.value < Decimal("1"):
        flags.append(_flag(
            "LIQUIDITY_TIGHT", "warn",
            f"Current ratio {r.current_ratio.value} < 1 — short-term obligations exceed current assets.",
        ))
    if r.net_debt_to_ebitda and r.net_debt_to_ebitda.value is not None and r.net_debt_to_ebitda.value > Decimal("5"):
        flags.append(_flag(
            "OVERLEVERAGED", "critical",
            f"Net Debt/EBITDA {r.net_debt_to_ebitda.value} > 5x — elevated distress risk.",
        ))
    if r.interest_coverage and r.interest_coverage.value is not None and r.interest_coverage.value < Decimal("2"):
        flags.append(_flag(
            "INTEREST_COVERAGE_LOW", "warn",
            f"Interest coverage {r.interest_coverage.value} < 2x — earnings barely cover financing cost.",
        ))
    if eng.scores.altman_z and eng.scores.altman_z.value is not None and eng.scores.altman_z.value < Decimal("1.81"):
        flags.append(_flag(
            "ALTMAN_DISTRESS", "warn",
            f"Altman Z {eng.scores.altman_z.value} < 1.81 — statistical distress zone.",
        ))
    if eng.scores.piotroski_f and eng.scores.piotroski_f.value is not None and eng.scores.piotroski_f.value <= Decimal("3"):
        flags.append(_flag(
            "PIOTROSKI_WEAK", "warn",
            f"Piotroski F {eng.scores.piotroski_f.value}/9 — low quality fundamentals.",
        ))

    # Holding-specific: flag dual-stream income statement if present.
    if pf.sector == Sector.HOLDING and pf.income_statement.financial_segment_revenue is not None:
        flags.append(_flag(
            "HOLDING_DUAL_STREAM", "info",
            "Holding dual-stream P&L present (finans segment). "
            "Industrial gross-margin chain checked on non-financial stream only.",
        ))

    return flags


# ---------------------------------------------------------------------
# Banking rules
# ---------------------------------------------------------------------

def _banking_highlights(pf: PeriodFinancials, eng: EngineOutput) -> list[MetricHighlight]:
    r = eng.ratios
    out: list[MetricHighlight] = []

    # Banking overlay reuses industrial slots — we relabel for clarity.
    if r.ebitda_margin and r.ebitda_margin.value is not None:
        out.append(_hl(
            "NIM", "Net Interest Margin (NII / Total Assets)",
            r.ebitda_margin.value, "%",
            hint="Turkish banks: 3-5% healthy. Below 2% → pressure from funding cost.",
        ))
    if r.roe and r.roe.value is not None:
        out.append(_hl(
            "BANK_ROE", "Banking ROE", r.roe.value, "%",
            hint="Turkish banking sector: 20-30% common. <15% underperformer.",
        ))
    if r.roa and r.roa.value is not None:
        out.append(_hl(
            "BANK_ROA", "Banking ROA", r.roa.value, "%",
            hint="Strong bank >1.5%. <1% signals earnings pressure.",
        ))
    if r.opex_to_revenue and r.opex_to_revenue.value is not None:
        out.append(_hl(
            "COST_TO_INCOME", "Cost-to-Income Ratio", r.opex_to_revenue.value, "%",
            hint="Top-quartile <40%. >55% suggests inefficient operations.",
        ))
    if r.interest_coverage and r.interest_coverage.value is not None:
        out.append(_hl(
            "LLP_NII_BURDEN", "Loan loss provisions / NII", r.interest_coverage.value, "%",
            hint="Elevated (>40%) signals credit stress. Normal range 15-30%.",
        ))
    return out


def _banking_red_flags(pf: PeriodFinancials, eng: EngineOutput) -> list[RedFlag]:
    r = eng.ratios
    flags: list[RedFlag] = []
    nii = pf.income_statement.net_interest_income

    if nii is not None and nii < 0:
        flags.append(_flag("BANK_NII_NEGATIVE", "critical",
                           "Net Interest Income negative — funding cost above asset yields."))
    if r.opex_to_revenue and r.opex_to_revenue.value is not None:
        ci = r.opex_to_revenue.value
        if ci > Decimal("60"):
            flags.append(_flag("BANK_COST_HIGH", "warn",
                               f"Cost-to-Income {ci}% > 60% — operating efficiency concern."))
    if r.interest_coverage and r.interest_coverage.value is not None:
        llp_ratio = r.interest_coverage.value
        if llp_ratio > Decimal("50"):
            flags.append(_flag("BANK_LLP_HEAVY", "critical",
                               f"LLP/NII {llp_ratio}% > 50% — half of NII eaten by provisions."))
    if r.roe and r.roe.value is not None and r.roe.value < Decimal("10"):
        flags.append(_flag("BANK_ROE_WEAK", "warn",
                           f"ROE {r.roe.value}% < 10% — below sector norm for Turkish banking."))
    return flags


# ---------------------------------------------------------------------
# Trend computation (optional prior period)
# ---------------------------------------------------------------------

def _trends_for(
    pf: PeriodFinancials, eng: EngineOutput,
    prior: tuple[PeriodFinancials, EngineOutput] | None,
) -> list[Trend]:
    if prior is None:
        return []
    prior_pf, prior_eng = prior
    current_label = f"{pf.period.value}-{pf.year}"
    prior_label = f"{prior_pf.period.value}-{prior_pf.year}"

    tracked_metrics = ["gross_margin", "ebitda_margin", "net_margin", "roe", "roa"]
    trends: list[Trend] = []
    for metric in tracked_metrics:
        current_rv = getattr(eng.ratios, metric, None)
        prior_rv = getattr(prior_eng.ratios, metric, None)
        if current_rv is None or current_rv.value is None:
            continue
        points = []
        if prior_rv and prior_rv.value is not None:
            points.append(TrendPoint(period_label=prior_label, value=prior_rv.value))
        points.append(TrendPoint(period_label=current_label, value=current_rv.value))

        direction: str | None = None
        if prior_rv and prior_rv.value is not None:
            if current_rv.value > prior_rv.value:
                direction = "up"
            elif current_rv.value < prior_rv.value:
                direction = "down"
            else:
                direction = "flat"
        trends.append(Trend(metric=metric, points=points, direction=direction))
    return trends


# ---------------------------------------------------------------------
# Canonical numbers (flat for easy LLM quoting)
# ---------------------------------------------------------------------

def _canonical_numbers(pf: PeriodFinancials, eng: EngineOutput) -> dict[str, Decimal | None]:
    """Flat canonical_numbers for LLM quoting + downstream truth gates.

    Wave 3 (2026-04-28) — expanded from 14 ratio-only fields to include
    raw line-item totals (gross_profit, pre_tax_income, NMP, OCF, CAPEX,
    WC components) so the LLM isn't forced to back-compute amounts from
    margins. Field names mirror IncomeStatement / BalanceSheet /
    CashFlowStatement schemas.
    """
    r = eng.ratios
    bs = pf.balance_sheet
    is_ = pf.income_statement
    cf = pf.cash_flow

    # Pre-tax income: derive from net_income + tax_expense when not explicit.
    pre_tax: Decimal | None = None
    tax_exp = getattr(is_, "tax_expense", None)
    if is_.net_income is not None and tax_exp is not None:
        # tax_expense is typically negative (expense); pre-tax = net - tax_expense
        # (since net_income = pre_tax + tax_expense when tax_expense is signed
        # negative, equivalently pre_tax = net_income - tax_expense).
        pre_tax = is_.net_income - tax_exp

    out: dict[str, Decimal | None] = {
        # Balance sheet totals
        "total_assets": bs.total_assets,
        "total_equity": bs.total_equity,
        "total_liabilities": getattr(bs, "total_liabilities", None),
        # Income statement raw line items
        "revenue": is_.revenue,
        "cost_of_sales": getattr(is_, "cost_of_sales", None),
        "cogs": getattr(is_, "cost_of_sales", None),  # alias for board-friendly key
        "gross_profit": getattr(is_, "gross_profit", None),
        "opex": getattr(is_, "opex", None),
        "operating_expenses": getattr(is_, "opex", None),  # alias
        "operating_income": getattr(is_, "operating_income", None),
        "operating_profit": getattr(is_, "operating_income", None),  # alias
        "ebit": getattr(is_, "operating_income", None),
        "ebitda": getattr(is_, "ebitda", None),
        "depreciation_amortization": getattr(is_, "depreciation_amortization", None),
        "financial_income": getattr(is_, "financial_income", None),
        "financial_expense": getattr(is_, "financial_expense", None),
        "interest_income": getattr(is_, "interest_income", None),
        "interest_expense": getattr(is_, "interest_expense", None),
        "monetary_gain_loss": getattr(is_, "monetary_gain_loss", None),
        "net_monetary_position_gain_loss": getattr(is_, "monetary_gain_loss", None),  # alias for clarity
        "pre_tax_income": pre_tax,
        "tax_expense": tax_exp,
        "net_income": is_.net_income,
        "minority_net_income": getattr(is_, "minority_net_income", None),
        "parent_net_income": getattr(is_, "parent_net_income", None),
        # Working capital line items (from balance sheet)
        "trade_receivables": getattr(bs, "trade_receivables", None),
        "inventories": getattr(bs, "inventories", None),
        "trade_payables": getattr(bs, "trade_payables", None),
        # Cash flow statement raw line items (board-grade requirement)
        "operating_cash_flow": getattr(cf, "operating_cash_flow", None) if cf else None,
        "capex": getattr(cf, "capex", None) if cf else None,
        "investing_cash_flow": getattr(cf, "investing_cash_flow", None) if cf else None,
        "financing_cash_flow": getattr(cf, "financing_cash_flow", None) if cf else None,
        "free_cash_flow_reported": getattr(cf, "free_cash_flow", None) if cf else None,
        "dividends_paid": getattr(cf, "dividends_paid", None) if cf else None,
        "net_change_in_cash": getattr(cf, "net_change_in_cash", None) if cf else None,
        "cf_depreciation_amortization": getattr(cf, "depreciation_amortization", None) if cf else None,
        "change_in_working_capital": getattr(cf, "change_in_working_capital", None) if cf else None,
        "working_capital_change_total": getattr(cf, "change_in_working_capital", None) if cf else None,  # alias
    }
    # Add applicable ratios (preserved from legacy schema)
    for key in (
        "gross_margin", "ebitda_margin", "net_margin",
        "roe", "roa", "roce", "current_ratio",
        "net_debt", "net_debt_to_ebitda", "fcf",
        "normalized_fcf", "wc_release",
    ):
        rv = getattr(r, key, None)
        if rv is not None:
            out[key] = rv.value
    return out


# ---------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------

def analyze_financials(
    pf: PeriodFinancials,
    engine: EngineOutput,
    *,
    ticker: str,
    prior: tuple[PeriodFinancials, EngineOutput] | None = None,
) -> FinancialAnalysisOutput:
    if pf.sector == Sector.BANKING:
        highlights = _banking_highlights(pf, engine)
        flags = _banking_red_flags(pf, engine)
    else:
        highlights = _industrial_highlights(pf, engine)
        flags = _industrial_red_flags(pf, engine)

    return FinancialAnalysisOutput(
        ticker=ticker,
        period_label=f"{pf.period.value}-{pf.year}",
        sector=pf.sector,
        computed_at=datetime.now(UTC),
        engine=engine,
        highlights=highlights,
        red_flags=flags,
        trends=_trends_for(pf, engine, prior),
        canonical_numbers=_canonical_numbers(pf, engine),
    )
