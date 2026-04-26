"""val_dcf_projection — valuation_agent S12 deterministic Python.

Phase A.2 of the new val_dcf chain. Projects 5Y revenue/EBITDA/FCF.

Inputs (task_inputs — pre-parsed by shadow runner, small):
- ticker, sector
- fa_canonical_numbers: dict (or None) — revenue, ebitda_margin, etc.

Output:
- 5-year projection + assumptions + data_gaps

Deterministic — pure math + sector heuristics.
"""

from __future__ import annotations

import json
import sys


_SECTOR_EBITDA_MARGIN_DEFAULT = {
    "holding": 18.0, "industrial": 15.0, "banking": 35.0, "telecom": 30.0,
    "energy": 20.0, "automotive": 12.0, "consumer_staples": 18.0,
    "consumer_discretionary": 12.0, "retail": 8.0, "utility": 30.0,
    "real_estate": 60.0, "construction": 12.0, "technology": 25.0,
    "healthcare": 18.0, "materials": 16.0,
}

_SECTOR_CAPEX_PCT = {
    "telecom": 18.0, "energy": 15.0, "utility": 14.0, "real_estate": 10.0,
    "automotive": 6.0, "industrial": 5.0, "holding": 5.0, "construction": 8.0,
    "technology": 8.0, "retail": 3.0, "consumer_staples": 4.0,
    "consumer_discretionary": 4.0, "healthcare": 5.0, "materials": 7.0,
}

_DEFAULT_EBITDA_MARGIN_PCT = 15.0
_DEFAULT_CAPEX_PCT = 5.0
_DEFAULT_DA_PCT = 4.0
_DEFAULT_NWC_DELTA_PCT = 15.0
_DEFAULT_TAX_PCT = 25.0


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


def _resolve_revenue_base(fa_canonical, gaps):
    if isinstance(fa_canonical, dict):
        rev = _numeric(fa_canonical.get("revenue"))
        if rev is not None and rev > 0:
            return (rev, "fa_canonical_numbers.revenue")
    gaps.append("revenue_base_unavailable (fa_canonical_numbers.revenue=0/null)")
    return (None, "default_zero")


def _resolve_ebitda_margin(fa_canonical, sector, gaps):
    if isinstance(fa_canonical, dict):
        m = _numeric(fa_canonical.get("ebitda_margin"))
        if m is not None and 0 < m < 100:
            return (m, "fa_canonical_numbers.ebitda_margin")
    s = (sector or "").lower()
    if s in _SECTOR_EBITDA_MARGIN_DEFAULT:
        gaps.append(f"ebitda_margin_default_used (sector='{s}' default {_SECTOR_EBITDA_MARGIN_DEFAULT[s]}%)")
        return (_SECTOR_EBITDA_MARGIN_DEFAULT[s], f"sector_default[{s}]")
    gaps.append(f"ebitda_margin_default_used (sector='{sector}' generic {_DEFAULT_EBITDA_MARGIN_PCT}%)")
    return (_DEFAULT_EBITDA_MARGIN_PCT, "generic_default")


def _resolve_capex_pct(sector):
    s = (sector or "").lower()
    return _SECTOR_CAPEX_PCT.get(s, _DEFAULT_CAPEX_PCT)


def _projection_growth_curve(year_1_growth_pct, terminal_growth_pct=6.0):
    rates = []
    step = (terminal_growth_pct - year_1_growth_pct) / 4.0
    for y in range(5):
        rate = year_1_growth_pct + step * y
        rates.append(round(rate, 2))
    return rates


def run(inputs):
    ticker = inputs.get("ticker", "")
    sector = inputs.get("sector")
    fa_canonical = inputs.get("fa_canonical_numbers")

    data_gaps = []
    fa_available = isinstance(fa_canonical, dict) and len(fa_canonical) > 0
    if not fa_available:
        data_gaps.append("fa_canonical_numbers unavailable")

    rev_base, rev_source = _resolve_revenue_base(fa_canonical, data_gaps)
    ebitda_margin_pct, margin_source = _resolve_ebitda_margin(fa_canonical, sector, data_gaps)
    capex_pct = _resolve_capex_pct(sector)
    da_pct = _DEFAULT_DA_PCT
    nwc_delta_pct = _DEFAULT_NWC_DELTA_PCT
    tax_pct = _DEFAULT_TAX_PCT

    year_1_growth = 25.0
    terminal_year_growth = 6.0
    growth_curve = _projection_growth_curve(year_1_growth, terminal_year_growth)

    projection = []
    prev_revenue = rev_base if rev_base is not None else 0.0
    for y, growth_pct in enumerate(growth_curve, start=1):
        revenue = prev_revenue * (1.0 + growth_pct / 100.0) if prev_revenue > 0 else 0.0
        delta_revenue = revenue - prev_revenue
        ebitda = revenue * (ebitda_margin_pct / 100.0)
        da = revenue * (da_pct / 100.0)
        ebit = ebitda - da
        tax_amount = max(0.0, ebit) * (tax_pct / 100.0)
        nopat = ebit - tax_amount
        capex = revenue * (capex_pct / 100.0)
        delta_nwc = max(0.0, delta_revenue) * (nwc_delta_pct / 100.0)
        fcf = nopat + da - capex - delta_nwc

        projection.append({
            "year": y,
            "revenue_try_mn":     round(revenue, 2),
            "growth_pct":         growth_pct,
            "ebitda_try_mn":      round(ebitda, 2),
            "ebitda_margin_pct":  round(ebitda_margin_pct, 2),
            "da_try_mn":          round(da, 2),
            "ebit_try_mn":        round(ebit, 2),
            "tax_try_mn":         round(tax_amount, 2),
            "nopat_try_mn":       round(nopat, 2),
            "capex_try_mn":       round(capex, 2),
            "delta_nwc_try_mn":   round(delta_nwc, 2),
            "fcf_try_mn":         round(fcf, 2),
        })
        prev_revenue = revenue

    return {
        "ticker": ticker,
        "sector": sector,
        "assumptions": {
            "revenue_base_try_mn": round(rev_base if rev_base is not None else 0.0, 2),
            "revenue_source": rev_source,
            "ebitda_margin_pct": round(ebitda_margin_pct, 2),
            "ebitda_margin_source": margin_source,
            "capex_pct_of_revenue": capex_pct,
            "da_pct_of_revenue": da_pct,
            "nwc_delta_pct_of_delta_revenue": nwc_delta_pct,
            "tax_rate_pct": tax_pct,
            "growth_curve_pct": growth_curve,
        },
        "projection_5y": projection,
        "data_quality": {
            "fa_available": fa_available,
            "revenue_base_realistic": rev_base is not None and rev_base > 0,
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
