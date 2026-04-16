"""technical_analysis calculator tests.

Covers:
  - empty history → all-None TechnicalIndicators
  - short history → only indicators whose window fits are populated
  - full history (>=200 bars) → every field populated
  - trend classification
  - JSON roundtrip preserves Decimals
  - input doesn't need to be date-sorted — calculator sorts
"""

from __future__ import annotations

import math
from datetime import date, timedelta
from decimal import Decimal

from financex.calculators.technical import compute_technical
from financex.schemas.market import OhlcvBar
from financex.schemas.technical import TechnicalIndicators


# ---------- fixture helpers ----------

def _bar(d: date, close: float, high: float | None = None, low: float | None = None) -> OhlcvBar:
    return OhlcvBar(
        date=d,
        open=Decimal(str(close * 0.99)),
        high=Decimal(str(high if high is not None else close * 1.01)),
        low=Decimal(str(low if low is not None else close * 0.98)),
        close=Decimal(str(close)),
        volume=100_000,
    )


def _trend_history(n: int, start: float, slope: float) -> list[OhlcvBar]:
    """Generate n daily bars with a linear trend."""
    base = date(2025, 1, 1)
    return [_bar(base + timedelta(days=i), start + slope * i) for i in range(n)]


def _sideways_history(n: int, price: float) -> list[OhlcvBar]:
    base = date(2025, 1, 1)
    return [_bar(base + timedelta(days=i), price + math.sin(i / 3) * 0.5) for i in range(n)]


# ---------- tests ----------

def test_empty_history_returns_all_none() -> None:
    result = compute_technical([])
    assert isinstance(result, TechnicalIndicators)
    assert result.ma_20 is None
    assert result.ma_50 is None
    assert result.ma_200 is None
    assert result.rsi_14 is None
    assert result.macd is None
    assert result.trend is None


def test_short_history_populates_only_fitting_indicators() -> None:
    # 25 bars: 20-window fits (ma_20, bollinger), 14-window fits (rsi, atr)
    result = compute_technical(_trend_history(25, 100.0, 0.5))
    assert result.ma_20 is not None
    assert result.bollinger_middle is not None
    assert result.rsi_14 is not None
    assert result.atr_14 is not None
    assert result.ma_50 is None
    assert result.ma_200 is None
    assert result.macd is None  # needs 26 bars


def test_full_history_populates_every_indicator() -> None:
    result = compute_technical(_trend_history(250, 100.0, 0.2))
    assert result.ma_20 is not None
    assert result.ma_50 is not None
    assert result.ma_200 is not None
    assert result.rsi_14 is not None
    assert result.macd is not None
    assert result.macd_signal is not None
    assert result.macd_histogram is not None
    assert result.bollinger_upper is not None
    assert result.bollinger_middle is not None
    assert result.bollinger_lower is not None
    assert result.atr_14 is not None
    assert result.trend is not None


def test_uptrend_gives_bullish_label() -> None:
    result = compute_technical(_trend_history(220, 50.0, 0.5))
    assert result.trend == "bullish"
    assert result.ma_50 is not None and result.ma_200 is not None
    assert result.ma_50 > result.ma_200


def test_downtrend_gives_bearish_label() -> None:
    result = compute_technical(_trend_history(220, 200.0, -0.4))
    assert result.trend == "bearish"
    assert result.ma_50 is not None and result.ma_200 is not None
    assert result.ma_50 < result.ma_200


def test_calculator_accepts_unsorted_input() -> None:
    bars = _trend_history(50, 100.0, 0.5)
    reversed_bars = list(reversed(bars))
    result_sorted = compute_technical(bars)
    result_reversed = compute_technical(reversed_bars)
    assert result_sorted.ma_20 == result_reversed.ma_20
    assert result_sorted.trend == result_reversed.trend


def test_as_of_date_is_last_bar() -> None:
    bars = _trend_history(50, 100.0, 0.5)
    expected = bars[-1].date.isoformat()
    result = compute_technical(bars)
    assert result.as_of_date == expected


def test_bollinger_upper_above_middle_above_lower() -> None:
    result = compute_technical(_sideways_history(50, 100.0))
    assert result.bollinger_upper is not None
    assert result.bollinger_middle is not None
    assert result.bollinger_lower is not None
    assert result.bollinger_upper > result.bollinger_middle > result.bollinger_lower


def test_rsi_within_0_100_range() -> None:
    result = compute_technical(_trend_history(50, 100.0, 0.5))
    assert result.rsi_14 is not None
    assert Decimal("0") <= result.rsi_14 <= Decimal("100")


def test_json_roundtrip_preserves_decimals() -> None:
    result = compute_technical(_trend_history(220, 100.0, 0.3))
    rebuilt = TechnicalIndicators.model_validate_json(result.model_dump_json())
    assert rebuilt.ma_20 == result.ma_20
    assert rebuilt.rsi_14 == result.rsi_14
    assert rebuilt.trend == result.trend
