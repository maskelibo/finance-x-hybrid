"""Technical indicator snapshot — populated by calculators/technical.py (later)."""

from __future__ import annotations

from decimal import Decimal

from pydantic import Field

from financex.schemas.base import FinancexModel


class TechnicalIndicators(FinancexModel):
    """All fields Optional — a package is valid even without technicals.

    This mirrors the output shape calculators/technical.py will produce
    from `MarketData.history` using the `ta` library.
    """

    as_of_date: str | None = None

    # Moving averages
    ma_20: Decimal | None = None
    ma_50: Decimal | None = None
    ma_200: Decimal | None = None

    # Momentum / oscillators
    rsi_14: Decimal | None = None
    macd: Decimal | None = None
    macd_signal: Decimal | None = None
    macd_histogram: Decimal | None = None

    # Volatility
    bollinger_upper: Decimal | None = None
    bollinger_middle: Decimal | None = None
    bollinger_lower: Decimal | None = None
    atr_14: Decimal | None = None

    # Trend summary — rule-based label from calculator, not LLM judgment.
    trend: str | None = Field(default=None, description="'bullish' | 'bearish' | 'neutral'")
    relative_to_bist100_ytd: Decimal | None = None
