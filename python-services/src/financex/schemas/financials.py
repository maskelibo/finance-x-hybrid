"""Financial statements — Balance Sheet, Income Statement, Cash Flow, Equity Change.

Hybrid rule:
- Top-line aggregates (total_assets, total_equity, revenue, net_income, cash) are Required.
- Line-item detail (trade receivables, inventories, D&A, etc.) is Optional.
- Missing line items surface as None and drive `QualityControl.missing_fields`
  rather than blocking the package.
"""

from __future__ import annotations

from decimal import Decimal

from pydantic import Field

from financex.schemas.base import Currency, FinancexModel, Money, ReportingPeriod, SourceRef


class BalanceSheet(FinancexModel):
    """Single-period balance sheet in reporting currency."""

    # Required aggregates
    total_assets: Money
    total_liabilities: Money
    total_equity: Money

    # Optional line items — critical ones downstream will flag if missing.
    current_assets: Money | None = None
    cash_and_equivalents: Money | None = None
    trade_receivables: Money | None = None
    inventories: Money | None = None
    other_current_assets: Money | None = None

    non_current_assets: Money | None = None
    ppe_net: Money | None = Field(default=None, description="Property, plant & equipment, net of depreciation.")
    intangibles: Money | None = None
    goodwill: Money | None = None
    investments: Money | None = None

    current_liabilities: Money | None = None
    short_term_debt: Money | None = None
    trade_payables: Money | None = None

    non_current_liabilities: Money | None = None
    long_term_debt: Money | None = None

    minority_interest: Money | None = None
    parent_equity: Money | None = None


class IncomeStatement(FinancexModel):
    """Single-period income statement in reporting currency."""

    # Required
    revenue: Money
    net_income: Money

    # Optional
    cost_of_sales: Money | None = None
    gross_profit: Money | None = None
    opex: Money | None = Field(default=None, description="Operating expenses (SG&A + R&D, etc).")
    operating_income: Money | None = None
    ebitda: Money | None = None
    depreciation_amortization: Money | None = None
    financial_income: Money | None = None
    financial_expense: Money | None = None
    monetary_gain_loss: Money | None = Field(
        default=None,
        description="IAS 29 monetary gain/(loss) line — material for Turkish filers.",
    )
    tax_expense: Money | None = None
    minority_net_income: Money | None = None
    parent_net_income: Money | None = None


class CashFlowStatement(FinancexModel):
    """Single-period cash flow statement in reporting currency."""

    # Required
    operating_cash_flow: Money

    # Optional
    investing_cash_flow: Money | None = None
    financing_cash_flow: Money | None = None
    capex: Money | None = None
    free_cash_flow: Money | None = None
    dividends_paid: Money | None = None
    net_borrowing: Money | None = None
    fx_impact: Money | None = None
    net_change_in_cash: Money | None = None


class EquityChange(FinancexModel):
    """Statement of changes in equity — summary, not full rollforward."""

    # Required
    closing_equity: Money

    # Optional
    opening_equity: Money | None = None
    net_income_to_equity: Money | None = None
    dividends_distributed: Money | None = None
    capital_increase: Money | None = None
    other_comprehensive_income: Money | None = None


class PeriodFinancials(FinancexModel):
    """Four statements bundled for one reporting period."""

    period: ReportingPeriod
    year: int = Field(ge=2000, le=2100)
    currency: Currency = Currency.TRY
    ias29_restated: bool = Field(
        default=False,
        description="True if figures are inflation-adjusted under IAS 29 (Turkish high-inflation accounting).",
    )
    sources: list[SourceRef] = Field(default_factory=list)

    balance_sheet: BalanceSheet
    income_statement: IncomeStatement
    cash_flow: CashFlowStatement | None = None
    equity_change: EquityChange | None = None


class Financials(FinancexModel):
    """Historical financials — typically 5 yearly periods + most recent quarterly."""

    periods: list[PeriodFinancials] = Field(
        min_length=1,
        description="At least the most recent full year must be present.",
    )

    def latest_annual(self) -> PeriodFinancials | None:
        annuals = [p for p in self.periods if p.period == ReportingPeriod.FY]
        return max(annuals, key=lambda p: p.year) if annuals else None
