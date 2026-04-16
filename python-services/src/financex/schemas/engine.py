"""Financial-engine output schema.

Mirrors the existing backend/src/financial-engine.ts EngineOutput so that
the Python port is drop-in compatible. Downstream LLM agents will reference
these canonical numbers instead of recomputing them.
"""

from __future__ import annotations

from decimal import Decimal

from pydantic import Field

from financex.schemas.base import FinancexModel


class RatioValue(FinancexModel):
    """One ratio with value and optional warning (mirrors TS engine pattern)."""

    value: Decimal | None = None
    warning: str | None = None


class EngineRatios(FinancexModel):
    """All derived ratios. None means not computable with the given inputs."""

    # Profitability
    gross_margin: RatioValue | None = None
    ebitda_margin: RatioValue | None = None
    net_margin: RatioValue | None = None
    roe: RatioValue | None = None
    roa: RatioValue | None = None
    roce: RatioValue | None = None
    roic: RatioValue | None = None
    opex_to_revenue: RatioValue | None = None

    # Working capital
    dso: RatioValue | None = None
    dio: RatioValue | None = None
    dpo: RatioValue | None = None
    ccc: RatioValue | None = None
    nwc_to_revenue: RatioValue | None = None

    # Leverage / liquidity
    net_debt: RatioValue | None = None
    net_debt_to_ebitda: RatioValue | None = None
    interest_coverage: RatioValue | None = None
    current_ratio: RatioValue | None = None
    acid_test: RatioValue | None = None

    # Cash flow quality
    fcf: RatioValue | None = None
    ocf_to_ebitda: RatioValue | None = None
    capex_to_ebitda: RatioValue | None = None
    interest_burden: RatioValue | None = None


class EngineScores(FinancexModel):
    altman_z: RatioValue | None = None
    piotroski_f: RatioValue | None = None


class DcfSensitivityCell(FinancexModel):
    wacc: Decimal
    terminal_growth: Decimal
    fair_value_per_share: Decimal


class DcfResult(FinancexModel):
    wacc: Decimal | None = None
    terminal_growth: Decimal | None = None
    fair_value_per_share: Decimal | None = None
    enterprise_value: Decimal | None = None
    pv_fcf: list[Decimal] = Field(default_factory=list)
    terminal_value: Decimal | None = None
    sensitivity: list[DcfSensitivityCell] = Field(default_factory=list)


class EngineOutput(FinancexModel):
    """Canonical engine output — consumed by valuation_agent, strategic_synthesis,
    final_summary, report_formatter.
    """

    ratios: EngineRatios = Field(default_factory=EngineRatios)
    scores: EngineScores = Field(default_factory=EngineScores)
    dcf: DcfResult | None = None
    warnings: list[str] = Field(default_factory=list)
    computed_at: str | None = None
