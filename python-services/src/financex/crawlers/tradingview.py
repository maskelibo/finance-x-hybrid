"""TradingView OHLCV fetcher for BIST tickers.

Uses the unofficial tvDatafeed library. Unauthenticated access is
rate-limited but sufficient for daily bars on BIST majors (KCHOL,
THYAO, EREGL, TUPRS, TCELL, ASELS, etc.).

Returns native OhlcvBar objects so downstream calculators don't care
where the bars came from.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Iterable

from financex.schemas.market import OhlcvBar


@dataclass(frozen=True)
class TradingViewFetchParams:
    symbol: str
    exchange: str = "BIST"
    interval: str = "daily"
    n_bars: int = 365


class OhlcvClient(ABC):
    """Interface — fetch OHLCV bars for a symbol."""

    @abstractmethod
    def fetch(self, params: TradingViewFetchParams) -> list[OhlcvBar]:
        ...


class TradingViewClient(OhlcvClient):
    """Real TradingView client via tvDatafeed."""

    _INTERVAL_MAP = {
        "1m": "in_1_minute",
        "5m": "in_5_minute",
        "15m": "in_15_minute",
        "30m": "in_30_minute",
        "1h": "in_1_hour",
        "daily": "in_daily",
        "weekly": "in_weekly",
        "monthly": "in_monthly",
    }

    def __init__(self, username: str | None = None, password: str | None = None) -> None:
        # Import locally so the heavy websocket dep only loads when used.
        from tvDatafeed import Interval, TvDatafeed  # type: ignore[import-not-found]

        self._tv = TvDatafeed(username=username, password=password) if username else TvDatafeed()
        self._Interval = Interval

    def fetch(self, params: TradingViewFetchParams) -> list[OhlcvBar]:
        interval_attr = self._INTERVAL_MAP.get(params.interval)
        if interval_attr is None:
            raise ValueError(f"Unsupported interval {params.interval!r}")
        interval = getattr(self._Interval, interval_attr)

        df = self._tv.get_hist(
            symbol=params.symbol,
            exchange=params.exchange,
            interval=interval,
            n_bars=params.n_bars,
        )
        if df is None or len(df) == 0:
            return []
        return _dataframe_to_bars(df)


class StaticOhlcvClient(OhlcvClient):
    """In-memory fixture for offline / test runs."""

    def __init__(self, bars: Iterable[OhlcvBar]) -> None:
        self._bars = list(bars)

    def fetch(self, params: TradingViewFetchParams) -> list[OhlcvBar]:
        return list(self._bars[-params.n_bars :])


# ---------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------

def _dataframe_to_bars(df) -> list[OhlcvBar]:
    """Convert tvDatafeed DataFrame → list[OhlcvBar]."""
    bars: list[OhlcvBar] = []
    for idx, row in df.iterrows():
        dt = idx if isinstance(idx, datetime) else idx.to_pydatetime()
        bars.append(
            OhlcvBar(
                date=dt.date(),
                open=_to_decimal(row["open"]),
                high=_to_decimal(row["high"]),
                low=_to_decimal(row["low"]),
                close=_to_decimal(row["close"]),
                volume=int(row["volume"]),
            )
        )
    return bars


def _to_decimal(value) -> Decimal:
    return Decimal(str(round(float(value), 6)))
