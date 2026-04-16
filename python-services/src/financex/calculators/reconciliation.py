"""reconciliation calculator — deterministic math checks on PeriodFinancials.

Checks (in order, every one runs regardless of prior outcomes):

  BS_IDENTITY          Aktif = Pasif + Özkaynak (accounting identity)
  BS_EQUITY_SPLIT      Özkaynak = Parent Equity + Minority Interest
  BS_CURRENT_SPLIT     Toplam Aktif = Dönen + Duran
  IS_GROSS_CHAIN       Hasılat − Maliyet = Brüt Kar (if all three present)
  IS_NET_SPLIT         Net Kar = Parent NI + Minority NI (if provided)
  CF_TOTAL_RECONCILE   OCF + ICF + FCF + FX impact = Net Change in Cash
  NET_DEBT_SANITY      Net Debt = (ST Debt + LT Debt) − Cash ≥ 0-ish

Each check tolerates a small relative error (default 0.1% = 10 bps) to
account for rounding in KAP PDFs. Absolute + relative error are emitted
so downstream agents can spot "close but not exact" situations.

No check is a blocker on its own — even a failed BS_IDENTITY only marks
the report as degraded. The LLM layer decides what to do with it.
"""

from __future__ import annotations

from decimal import Decimal

from financex.schemas.financials import PeriodFinancials
from financex.schemas.reconciliation import ReconciliationCheck, ReconciliationReport


DEFAULT_TOLERANCE_PCT = Decimal("0.1")  # 10 basis points


def _pct_error(actual: Decimal, expected: Decimal) -> Decimal:
    if expected == 0:
        return Decimal("0") if actual == 0 else Decimal("100")
    return (abs(actual - expected) / abs(expected)) * Decimal("100")


def _check_equal(
    code: str,
    name: str,
    actual: Decimal,
    expected: Decimal,
    *,
    tolerance_pct: Decimal = DEFAULT_TOLERANCE_PCT,
) -> ReconciliationCheck:
    abs_err = abs(actual - expected)
    rel_err = _pct_error(actual, expected)
    passed = rel_err <= tolerance_pct
    return ReconciliationCheck(
        code=code,
        name=name,
        passed=passed,
        message=(
            f"{name}: actual={actual}, expected={expected}, "
            f"|err|={abs_err}, rel={rel_err:.4f}%, tol={tolerance_pct}%"
        ),
        actual=actual,
        expected=expected,
        absolute_error=abs_err,
        relative_error_pct=rel_err,
        tolerance_pct=tolerance_pct,
    )


def _skip(code: str, name: str, reason: str) -> ReconciliationCheck:
    return ReconciliationCheck(
        code=code,
        name=name,
        passed=True,  # skipped = not failing
        message=f"skipped: {reason}",
    )


# ---------------------------------------------------------------------
# Individual checks
# ---------------------------------------------------------------------

def _bs_identity(pf: PeriodFinancials) -> ReconciliationCheck:
    bs = pf.balance_sheet
    if bs.total_assets == 0 or (bs.total_liabilities == 0 and bs.total_equity == 0):
        return _skip("BS_IDENTITY", "Balance Sheet identity", "totals are zero")
    return _check_equal(
        "BS_IDENTITY",
        "Assets = Liabilities + Equity",
        bs.total_assets,
        bs.total_liabilities + bs.total_equity,
    )


def _bs_equity_split(pf: PeriodFinancials) -> ReconciliationCheck:
    bs = pf.balance_sheet
    if bs.parent_equity is None or bs.minority_interest is None:
        return _skip("BS_EQUITY_SPLIT", "Equity = Parent + Minority", "parent/minority not reported")
    return _check_equal(
        "BS_EQUITY_SPLIT",
        "Equity = Parent Equity + Minority Interest",
        bs.total_equity,
        bs.parent_equity + bs.minority_interest,
    )


def _bs_current_split(pf: PeriodFinancials) -> ReconciliationCheck:
    bs = pf.balance_sheet
    if bs.current_assets is None or bs.non_current_assets is None:
        return _skip("BS_CURRENT_SPLIT", "Assets = Current + Non-current", "asset breakdown missing")
    return _check_equal(
        "BS_CURRENT_SPLIT",
        "Total Assets = Current Assets + Non-current Assets",
        bs.total_assets,
        bs.current_assets + bs.non_current_assets,
    )


def _is_gross_chain(pf: PeriodFinancials) -> ReconciliationCheck:
    i = pf.income_statement
    if i.cost_of_sales is None or i.gross_profit is None:
        return _skip("IS_GROSS_CHAIN", "Revenue − CoGS = Gross Profit", "COGS or GP not reported")
    # cost_of_sales is usually reported as a negative in KAP, so add.
    expected = i.revenue + i.cost_of_sales
    return _check_equal(
        "IS_GROSS_CHAIN",
        "Revenue + CostOfSales = Gross Profit",
        i.gross_profit,
        expected,
    )


def _is_net_split(pf: PeriodFinancials) -> ReconciliationCheck:
    i = pf.income_statement
    if i.parent_net_income is None or i.minority_net_income is None:
        return _skip(
            "IS_NET_SPLIT",
            "Net Income = Parent + Minority",
            "parent/minority NI not reported",
        )
    return _check_equal(
        "IS_NET_SPLIT",
        "Net Income = Parent + Minority",
        i.net_income,
        i.parent_net_income + i.minority_net_income,
    )


def _cf_total_reconcile(pf: PeriodFinancials) -> ReconciliationCheck:
    cf = pf.cash_flow
    if cf is None:
        return _skip("CF_TOTAL_RECONCILE", "OCF + ICF + FCF + FX = ΔCash", "cash flow missing")
    if cf.investing_cash_flow is None or cf.financing_cash_flow is None:
        return _skip(
            "CF_TOTAL_RECONCILE",
            "OCF + ICF + FCF + FX = ΔCash",
            "investing/financing CF not reported",
        )
    if cf.net_change_in_cash is None:
        return _skip(
            "CF_TOTAL_RECONCILE",
            "OCF + ICF + FCF + FX = ΔCash",
            "net change in cash not reported",
        )
    fx = cf.fx_impact or Decimal("0")
    expected = cf.operating_cash_flow + cf.investing_cash_flow + cf.financing_cash_flow + fx
    return _check_equal(
        "CF_TOTAL_RECONCILE",
        "OCF + ICF + FCF + FX = Net ΔCash",
        cf.net_change_in_cash,
        expected,
        tolerance_pct=Decimal("0.5"),  # CF rounding is looser
    )


def _net_debt_sanity(pf: PeriodFinancials) -> ReconciliationCheck:
    bs = pf.balance_sheet
    st = bs.short_term_debt
    lt = bs.long_term_debt
    cash = bs.cash_and_equivalents
    if st is None or lt is None or cash is None:
        return _skip(
            "NET_DEBT_SANITY",
            "Net Debt = (ST+LT Debt) − Cash",
            "short/long-term debt or cash missing",
        )
    net_debt = st + lt - cash
    # Sanity check: net_debt can legitimately be negative for cash-rich
    # holdings, so we only flag truly wild values (> 10× total equity).
    if bs.total_equity > 0 and abs(net_debt) > bs.total_equity * Decimal("10"):
        return ReconciliationCheck(
            code="NET_DEBT_SANITY",
            name="Net Debt is within ±10× equity",
            passed=False,
            message=f"Net Debt={net_debt} vs |equity|={bs.total_equity} — look twice.",
            actual=net_debt,
            expected=bs.total_equity,
        )
    return ReconciliationCheck(
        code="NET_DEBT_SANITY",
        name="Net Debt within sensible bounds",
        passed=True,
        message=f"Net Debt = {net_debt} TL (ST+LT − Cash)",
        actual=net_debt,
    )


# ---------------------------------------------------------------------
# Public runner
# ---------------------------------------------------------------------

def run_reconciliation(
    pf: PeriodFinancials,
    *,
    ticker: str | None = None,
) -> ReconciliationReport:
    """Run every deterministic check against a PeriodFinancials."""
    period_label = f"{pf.period.value}-{pf.year}"
    checks = [
        _bs_identity(pf),
        _bs_equity_split(pf),
        _bs_current_split(pf),
        _is_gross_chain(pf),
        _is_net_split(pf),
        _cf_total_reconcile(pf),
        _net_debt_sanity(pf),
    ]
    return ReconciliationReport(ticker=ticker, period_label=period_label, checks=checks)
