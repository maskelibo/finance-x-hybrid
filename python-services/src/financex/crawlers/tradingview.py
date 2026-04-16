"""OHLCV fetcher for BIST tickers.

Primary source: tvDatafeed (TradingView WebSocket scrape).
Fallback:       yfinance (`THYAO.IS` Istanbul suffix).

Live THYAO run on 2026-04-16 caught the primary path returning empty
frames ("you are using nologin method, data you access may be
limited"). TradingView appears to rate-limit nologin scrapes on BIST
symbols. The fallback chain guarantees a downstream technical run
even when TradingView goes cold — yfinance has a stable Yahoo Finance
backend for BIST.

Returns native OhlcvBar objects so downstream calculators don't care
where the bars came from.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime, timedelta
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


class YFinanceClient(OhlcvClient):
    """Yahoo Finance fallback.

    Maps TradingView BIST params onto the yfinance ticker format
    (`SYMBOL.IS` for Istanbul) and converts the returned DataFrame
    back into OhlcvBar rows.
    """

    _YF_INTERVAL_MAP = {
        "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m", "1h": "60m",
        "daily": "1d", "weekly": "1wk", "monthly": "1mo",
    }

    def fetch(self, params: TradingViewFetchParams) -> list[OhlcvBar]:
        # Import lazily so tests that don't exercise yfinance don't
        # pay the import cost (it pulls pandas + numpy network stack).
        import yfinance as yf

        yf_interval = self._YF_INTERVAL_MAP.get(params.interval, "1d")
        symbol = params.symbol.upper()
        # yfinance wants Istanbul suffix for BIST tickers.
        if params.exchange.upper() == "BIST" and not symbol.endswith(".IS"):
            symbol = f"{symbol}.IS"

        # Convert n_bars into a start-date window: daily ≈ n_bars
        # calendar days + 40% buffer for weekends/holidays; smaller
        # intervals fall back to yfinance defaults.
        start = None
        if yf_interval == "1d":
            start = (datetime.now().date() - timedelta(days=int(params.n_bars * 1.5))).isoformat()
        elif yf_interval == "1wk":
            start = (datetime.now().date() - timedelta(weeks=params.n_bars)).isoformat()
        elif yf_interval == "1mo":
            start = (datetime.now().date() - timedelta(days=int(params.n_bars * 31))).isoformat()

        ticker = yf.Ticker(symbol)
        if start:
            df = ticker.history(start=start, interval=yf_interval, auto_adjust=False)
        else:
            # Intraday: use yfinance's max-range defaults.
            df = ticker.history(period="60d", interval=yf_interval, auto_adjust=False)

        if df is None or len(df) == 0:
            return []

        # yfinance dataframes are indexed by tz-aware Timestamp.
        bars: list[OhlcvBar] = []
        for idx, row in df.iterrows():
            dt = idx.to_pydatetime() if hasattr(idx, "to_pydatetime") else idx
            if isinstance(dt, datetime):
                d = dt.date()
            else:
                d = dt
            bars.append(
                OhlcvBar(
                    date=d,
                    open=_to_decimal(row["Open"]),
                    high=_to_decimal(row["High"]),
                    low=_to_decimal(row["Low"]),
                    close=_to_decimal(row["Close"]),
                    volume=int(row.get("Volume", 0) or 0),
                )
            )
        # Keep the most recent n_bars rows so callers get a predictable window.
        return bars[-params.n_bars:] if len(bars) > params.n_bars else bars


class FallbackOhlcvClient(OhlcvClient):
    """Primary + fallback chain.

    Tries `primary.fetch` first. If it raises OR returns an empty
    list, falls back to the secondary client. Logs which source was
    ultimately used so the technical agent can record provenance.
    """

    def __init__(self, primary: OhlcvClient, fallback: OhlcvClient) -> None:
        self.primary = primary
        self.fallback = fallback
        self.last_source: str = "none"

    def fetch(self, params: TradingViewFetchParams) -> list[OhlcvBar]:
        try:
            bars = self.primary.fetch(params)
        except Exception as exc:  # noqa: BLE001
            print(f"[tv-fallback] primary fetch failed: {type(exc).__name__}: {exc}; trying fallback")
            bars = []

        if not bars:
            bars = self.fallback.fetch(params)
            self.last_source = "fallback"
        else:
            self.last_source = "primary"

        return bars


class StaticOhlcvClient(OhlcvClient):
    """In-memory fixture for offline / test runs."""

    def __init__(self, bars: Iterable[OhlcvBar]) -> None:
        self._bars = list(bars)

    def fetch(self, params: TradingViewFetchParams) -> list[OhlcvBar]:
        return list(self._bars[-params.n_bars :])


def build_default_ohlcv_client(
    *,
    tv_username: str | None = None,
    tv_password: str | None = None,
) -> OhlcvClient:
    """Factory: TradingView primary + YFinance fallback, both typed as OhlcvClient."""
    return FallbackOhlcvClient(
        primary=TradingViewClient(username=tv_username, password=tv_password),
        fallback=YFinanceClient(),
    )


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
