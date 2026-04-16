"""Market data — price, market cap, OHLCV history."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from pydantic import Field

from financex.schemas.base import Currency, FinancexModel


class OhlcvBar(FinancexModel):
    """One trading day."""

    date: date
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int = Field(ge=0)
    adjusted_close: Decimal | None = None


class MarketSnapshot(FinancexModel):
    """Current-state market view."""

    # Required
    last_price: Decimal
    currency: Currency = Currency.TRY
    shares_outstanding: int = Field(gt=0)
    market_cap: Decimal

    # Optional
    last_price_date: date | None = None
    float_shares: int | None = Field(default=None, ge=0)
    free_float_pct: Decimal | None = None
    avg_daily_volume_3m: int | None = Field(default=None, ge=0)
    high_52w: Decimal | None = None
    low_52w: Decimal | None = None
    ytd_return_pct: Decimal | None = None
    dividend_yield: Decimal | None = None


class MarketData(FinancexModel):
    """Snapshot plus (optional) recent history."""

    snapshot: MarketSnapshot
    history: list[OhlcvBar] = Field(
        default_factory=list,
        description="Most-recent-first or ordered; technical_analysis handles sort.",
    )
