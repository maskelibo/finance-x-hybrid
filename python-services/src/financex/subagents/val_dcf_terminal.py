"""val_dcf_terminal — valuation_agent S12 deterministic Python.

Phase B of the new val_dcf chain. Computes terminal value, EV, equity, target.

Inputs (task_inputs — pre-parsed):
- ticker
- previous_assumptions (chain-injected, small JSON)
- previous_projection (chain-injected, small JSON)
- shares_outstanding_mn
- net_debt_try_mn (best-effort from FA canonical_numbers, optional)

Deterministic — pure math.
"""

from __future__ import annotations

import json
import sys


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


def _pv_explicit(projection, wacc_pct):
    r = wacc_pct / 100.0
    total = 0.0
    for p in projection:
        y = p.get("year", 0)
        fcf = p.get("fcf_try_mn", 0.0) or 0.0
        if y > 0:
            total += fcf / ((1.0 + r) ** y)
    return total


def _terminal_value(year_n_fcf, wacc_pct, g_pct):
    if wacc_pct - g_pct < 0.5:
        return 0.0
    fcf_next = year_n_fcf * (1.0 + g_pct / 100.0)
    spread = (wacc_pct - g_pct) / 100.0
    return fcf_next / spread


def _pv_terminal(tv_at_year_n, wacc_pct, n_years):
    r = wacc_pct / 100.0
    return tv_at_year_n / ((1.0 + r) ** n_years)


def _resolve_net_debt(net_debt_try_mn, gaps):
    nd = _numeric(net_debt_try_mn)
    if nd is not None and nd != 0:
        return (nd, "input.net_debt_try_mn")
    gaps.append("net_debt_default_zero (input.net_debt_try_mn null/zero - equity_value treats as 0)")
    return (0.0, "default_zero")


def run(inputs):
    ticker = inputs.get("ticker", "")
    assumptions = inputs.get("previous_assumptions") or {}
    projection_payload = inputs.get("previous_projection") or {}

    data_gaps = []

    wacc_components = (assumptions.get("wacc_components") if isinstance(assumptions, dict) else None) or {}
    wacc_pct = _numeric(wacc_components.get("wacc_pct"))
    if wacc_pct is None:
        data_gaps.append("wacc_pct missing from previous_assumptions - fallback 35%")
        wacc_pct = 35.0
    terminal_g_pct = _numeric(assumptions.get("terminal_growth_pct"))
    if terminal_g_pct is None:
        data_gaps.append("terminal_growth_pct missing - fallback 4%")
        terminal_g_pct = 4.0

    projection = (projection_payload.get("projection_5y") if isinstance(projection_payload, dict) else None) or []
    if not projection:
        data_gaps.append("projection_5y empty - terminal/EV math returns 0")

    pv_explicit = _pv_explicit(projection, wacc_pct) if projection else 0.0

    last_fcf = (projection[-1].get("fcf_try_mn") if projection else 0.0) or 0.0
    n_years = len(projection)
    tv_at_n = _terminal_value(last_fcf, wacc_pct, terminal_g_pct) if projection else 0.0
    pv_terminal_val = _pv_terminal(tv_at_n, wacc_pct, n_years) if projection else 0.0

    enterprise_value = pv_explicit + pv_terminal_val

    net_debt, net_debt_source = _resolve_net_debt(inputs.get("net_debt_try_mn"), data_gaps)
    equity_value = enterprise_value - net_debt

    shares = _numeric(inputs.get("shares_outstanding_mn"))
    if shares is None or shares <= 0:
        data_gaps.append("shares_outstanding_mn unavailable - implied_share_price=null")
    implied_share_price = (equity_value / shares) if (shares and shares > 0 and equity_value > 0) else None

    sensitivity_matrix = []
    for d_wacc in (-1.0, 0.0, 1.0):
        for d_g in (-0.5, 0.0, 0.5):
            w = wacc_pct + d_wacc
            g = terminal_g_pct + d_g
            if w - g < 0.5:
                sensitivity_matrix.append({"wacc_pct": round(w, 2), "g_pct": round(g, 2), "target_try": None, "note": "wacc<=g+0.5 - DCF undefined"})
                continue
            pv_e = _pv_explicit(projection, w) if projection else 0.0
            tv = _terminal_value(last_fcf, w, g) if projection else 0.0
            pv_t = _pv_terminal(tv, w, n_years) if projection else 0.0
            ev = pv_e + pv_t
            eq = ev - net_debt
            target = (eq / shares) if (shares and shares > 0 and eq > 0) else None
            sensitivity_matrix.append({
                "wacc_pct": round(w, 2),
                "g_pct": round(g, 2),
                "ev_try_mn": round(ev, 2) if ev else 0.0,
                "equity_try_mn": round(eq, 2) if eq else 0.0,
                "target_try": round(target, 2) if target is not None else None,
            })

    consistency_warnings = []
    if abs((pv_explicit + pv_terminal_val) - enterprise_value) > 1.0:
        consistency_warnings.append("ev != pv_explicit + pv_terminal - math inconsistency")
    if wacc_pct - terminal_g_pct < 0.5:
        consistency_warnings.append(f"wacc-g spread {wacc_pct - terminal_g_pct:.2f}pp too tight; TV undefined")
    if equity_value < 0 and net_debt > 0:
        consistency_warnings.append("equity_value negative - distressed signal or upstream data error")

    return {
        "ticker": ticker,
        "wacc_pct_used": round(wacc_pct, 2),
        "terminal_growth_pct_used": round(terminal_g_pct, 2),
        "pv_explicit_try_mn": round(pv_explicit, 2),
        "terminal_value_try_mn": round(tv_at_n, 2),
        "pv_terminal_try_mn": round(pv_terminal_val, 2),
        "enterprise_value_try_mn": round(enterprise_value, 2),
        "net_debt_try_mn": round(net_debt, 2),
        "net_debt_source": net_debt_source,
        "equity_value_try_mn": round(equity_value, 2),
        "shares_outstanding_mn": shares,
        "implied_share_price_try": round(implied_share_price, 2) if implied_share_price is not None else None,
        "sensitivity_matrix": sensitivity_matrix,
        "consistency_warnings": consistency_warnings,
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
