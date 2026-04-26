"""val_dcf_assumptions — valuation_agent S12 deterministic Python.

Phase A.1 of the new val_dcf chain (S12 structural fix replacing the monolithic
LLM val_dcf — Sonnet variance %33 hang oranı, KCHOL 3-run protokol).

Inputs (task_inputs — pre-parsed by shadow runner, small):
- ticker, sector
- fa_canonical_numbers: dict (or None) — total_equity, net_debt, revenue, etc.
- macro_rates: dict (or None) — policy_rate, tcmb_10y
- macro_inflation: dict (or None) — cpi_yoy

Output:
- WACC components: risk_free_rate, beta, ERP, cost_of_equity, cost_of_debt,
  tax_rate, capital_structure, wacc_pct, terminal_growth_pct
- data_gaps for missing inputs

Deterministic — pure math + heuristics. No LLM, no provider call, no upstream
JSON parsing (shadow runner parses once and passes pre-extracted fields to keep
argv[1] under Windows command-line limits).
"""

from __future__ import annotations

import json
import sys


_SECTOR_BETA = {
    "holding": 1.1, "industrial": 1.0, "automotive": 1.3, "energy": 1.2,
    "banking": 1.1, "telecom": 0.9, "consumer_staples": 0.8,
    "consumer_discretionary": 1.1, "retail": 1.0, "utility": 0.85,
    "real_estate": 1.0, "construction": 1.3, "technology": 1.2,
    "healthcare": 0.9, "materials": 1.1,
}

_SECTOR_CAPITAL_STRUCTURE = {
    "holding": (60, 40), "banking": (10, 90), "real_estate": (40, 60),
    "utility": (45, 55), "telecom": (50, 50), "industrial": (55, 45),
    "automotive": (50, 50), "construction": (45, 55),
}
_DEFAULT_CAPITAL_STRUCTURE = (60, 40)

_DEFAULTS = {
    "risk_free_rate_pct": 35.0,
    "equity_risk_premium_pct": 6.5,
    "cost_of_debt_spread_pct": 4.0,
    "tax_rate_pct": 25.0,
    "terminal_growth_pct": 4.0,
}


def _numeric(v):
    if v is None:
        return None
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        if v != v:
            return None
        return float(v)
    if isinstance(v, str):
        s = v.strip().rstrip("%")
        if not s:
            return None
        try:
            return float(s)
        except Exception:
            return None
    return None


def _resolve_risk_free_rate(rates, gaps):
    if isinstance(rates, dict):
        for key in ("tcmb_10y", "policy_rate"):
            v = _numeric(rates.get(key))
            if v is not None and v > 0:
                return v
    gaps.append("risk_free_rate_default_used (macro.rates null - TCMB 35% proxy)")
    return _DEFAULTS["risk_free_rate_pct"]


def _resolve_beta(sector, gaps):
    if sector and sector.lower() in _SECTOR_BETA:
        return _SECTOR_BETA[sector.lower()]
    gaps.append(f"beta_default_used (sector='{sector}' not in registry - beta=1.0)")
    return 1.0


def _resolve_capital_structure(sector, fa_canonical, gaps):
    if isinstance(fa_canonical, dict):
        equity = _numeric(fa_canonical.get("total_equity"))
        debt = _numeric(fa_canonical.get("net_debt")) or _numeric(fa_canonical.get("total_debt"))
        if equity is not None and equity > 0 and debt is not None and debt >= 0:
            total = equity + debt
            if total > 0:
                e_pct = (equity / total) * 100.0
                d_pct = (debt / total) * 100.0
                return (round(e_pct, 1), round(d_pct, 1))
        if (fa_canonical.get("total_equity") in (0, "0", None)) and (debt in (0, None)):
            gaps.append("capital_structure_default_used (FA canonical_numbers zero - sector default)")
    if sector and sector.lower() in _SECTOR_CAPITAL_STRUCTURE:
        e, d = _SECTOR_CAPITAL_STRUCTURE[sector.lower()]
    else:
        e, d = _DEFAULT_CAPITAL_STRUCTURE
        gaps.append(f"capital_structure_default_used (sector='{sector}' default 60/40)")
    return (float(e), float(d))


def _resolve_terminal_growth(inflation, gaps):
    if isinstance(inflation, dict):
        cpi = _numeric(inflation.get("cpi_yoy"))
        if cpi is not None and cpi > 0:
            target = max(2.0, min(6.0, cpi - 30.0 + 4.0))
            return round(target, 1)
    gaps.append("terminal_growth_default_used (macro.inflation null - 4.0% steady-state proxy)")
    return _DEFAULTS["terminal_growth_pct"]


def run(inputs):
    ticker = inputs.get("ticker", "")
    sector = inputs.get("sector")
    fa_canonical = inputs.get("fa_canonical_numbers")
    macro_rates = inputs.get("macro_rates")
    macro_inflation = inputs.get("macro_inflation")

    data_gaps = []
    fa_available = isinstance(fa_canonical, dict) and len(fa_canonical) > 0
    macro_available = isinstance(macro_rates, dict) or isinstance(macro_inflation, dict)
    if not fa_available:
        data_gaps.append("fa_canonical_numbers unavailable")
    if not macro_available:
        data_gaps.append("macro rates+inflation unavailable")

    rf = _resolve_risk_free_rate(macro_rates, data_gaps)
    beta = _resolve_beta(sector, data_gaps)
    erp = _DEFAULTS["equity_risk_premium_pct"]
    ke = rf + beta * erp
    spread = _DEFAULTS["cost_of_debt_spread_pct"]
    kd_pre = rf + spread
    tax = _DEFAULTS["tax_rate_pct"]
    kd_post = kd_pre * (1.0 - tax / 100.0)
    e_pct, d_pct = _resolve_capital_structure(sector, fa_canonical, data_gaps)
    wacc = (e_pct / 100.0) * ke + (d_pct / 100.0) * kd_post
    terminal_growth = _resolve_terminal_growth(macro_inflation, data_gaps)

    if wacc - terminal_growth < 2.0:
        new_g = max(0.0, wacc - 3.0)
        data_gaps.append(
            f"terminal_growth_capped (wacc={wacc:.2f} too close to g={terminal_growth} - capped to {new_g:.2f})"
        )
        terminal_growth = round(new_g, 2)

    fa_populated = (
        fa_available
        and any(_numeric(v) not in (None, 0.0) for v in fa_canonical.values() if not isinstance(v, dict))
    )

    return {
        "ticker": ticker,
        "sector": sector,
        "wacc_components": {
            "risk_free_rate_pct": round(rf, 2),
            "beta": round(beta, 2),
            "equity_risk_premium_pct": round(erp, 2),
            "cost_of_equity_pct": round(ke, 2),
            "cost_of_debt_pre_tax_pct": round(kd_pre, 2),
            "tax_rate_pct": round(tax, 2),
            "cost_of_debt_after_tax_pct": round(kd_post, 2),
            "equity_weight_pct": round(e_pct, 1),
            "debt_weight_pct": round(d_pct, 1),
            "wacc_pct": round(wacc, 2),
        },
        "terminal_growth_pct": round(terminal_growth, 2),
        "data_quality": {
            "fa_available": fa_available,
            "macro_available": macro_available,
            "fa_canonical_numbers_populated": fa_populated,
        },
        "data_gaps": data_gaps,
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing input"}), file=sys.stderr)
        sys.exit(1)
    inputs = json.loads(sys.argv[1])
    print(json.dumps(run(inputs), ensure_ascii=False))


if __name__ == "__main__":
    main()
