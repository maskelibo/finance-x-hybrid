"""technical_analysis calculator.

Takes OHLCV bars (from MarketData.history) and computes moving averages,
RSI, MACD, Bollinger bands, ATR, and a rule-based trend label.

Pure deterministic math — the `ta` library operates on pandas Series.
Where a given lookback window exceeds the supplied history, that
indicator comes back None rather than failing the whole calculation.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Iterable

import pandas as pd
from ta.momentum import RSIIndicator
from ta.trend import MACD, SMAIndicator
from ta.volatility import AverageTrueRange, BollingerBands

from financex.schemas.market import OhlcvBar
from financex.schemas.technical import TechnicalIndicators


def _bars_to_dataframe(bars: Iterable[OhlcvBar]) -> pd.DataFrame:
    """Convert OHLCV bars into a date-sorted pandas DataFrame of floats.

    Decimals are coerced to float — `ta` operates on float Series.
    This is acceptable for indicator math; the authoritative TRY values
    still live in the original Decimal fields.
    """
    rows = [
        {
            "date": b.date,
            "open": float(b.open),
            "high": float(b.high),
            "low": float(b.low),
            "close": float(b.close),
            "volume": b.volume,
        }
        for b in bars
    ]
    if not rows:
        return pd.DataFrame(columns=["date", "open", "high", "low", "close", "volume"])
    df = pd.DataFrame(rows)
    df = df.sort_values("date").reset_index(drop=True)
    return df


def _tail_or_none(series: pd.Series) -> Decimal | None:
    if series.empty:
        return None
    value = series.iloc[-1]
    if pd.isna(value):
        return None
    return Decimal(str(round(float(value), 6)))


def _trend_label(ma50: Decimal | None, ma200: Decimal | None) -> str | None:
    if ma50 is None or ma200 is None:
        return None
    if ma50 > ma200:
        return "bullish"
    if ma50 < ma200:
        return "bearish"
    return "neutral"


def compute_technical(bars: Iterable[OhlcvBar]) -> TechnicalIndicators:
    """Compute the full TechnicalIndicators block from an OHLCV history.

    Any indicator whose lookback exceeds the history length is left None.
    A caller passing an empty history back gets an all-None result.
    """
    df = _bars_to_dataframe(bars)
    if df.empty:
        return TechnicalIndicators()

    close = df["close"]
    high = df["high"]
    low = df["low"]

    ma_20 = _tail_or_none(SMAIndicator(close=close, window=20).sma_indicator()) if len(df) >= 20 else None
    ma_50 = _tail_or_none(SMAIndicator(close=close, window=50).sma_indicator()) if len(df) >= 50 else None
    ma_200 = _tail_or_none(SMAIndicator(close=close, window=200).sma_indicator()) if len(df) >= 200 else None

    rsi_14 = _tail_or_none(RSIIndicator(close=close, window=14).rsi()) if len(df) >= 14 else None

    macd_val = None
    macd_signal_val = None
    macd_hist_val = None
    if len(df) >= 26:
        macd = MACD(close=close, window_slow=26, window_fast=12, window_sign=9)
        macd_val = _tail_or_none(macd.macd())
        macd_signal_val = _tail_or_none(macd.macd_signal())
        macd_hist_val = _tail_or_none(macd.macd_diff())

    boll_upper = None
    boll_middle = None
    boll_lower = None
    if len(df) >= 20:
        bb = BollingerBands(close=close, window=20, window_dev=2)
        boll_upper = _tail_or_none(bb.bollinger_hband())
        boll_middle = _tail_or_none(bb.bollinger_mavg())
        boll_lower = _tail_or_none(bb.bollinger_lband())

    atr_14 = None
    if len(df) >= 14:
        atr = AverageTrueRange(high=high, low=low, close=close, window=14)
        atr_14 = _tail_or_none(atr.average_true_range())

    as_of = df["date"].iloc[-1].isoformat()
    # Fix #28 — emit the real last close so the report doesn't silently
    # substitute MA20 as "Son Kapanış".
    from decimal import Decimal as _Dec
    last_close = _Dec(str(close.iloc[-1])) if len(close) > 0 else None

    return TechnicalIndicators(
        as_of_date=as_of,
        last_close=last_close,
        ma_20=ma_20,
        ma_50=ma_50,
        ma_200=ma_200,
        rsi_14=rsi_14,
        macd=macd_val,
        macd_signal=macd_signal_val,
        macd_histogram=macd_hist_val,
        bollinger_upper=boll_upper,
        bollinger_middle=boll_middle,
        bollinger_lower=boll_lower,
        atr_14=atr_14,
        trend=_trend_label(ma_50, ma_200),
    )
