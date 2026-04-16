"""Macro data fetcher — currencies, BIST index, Brent, from free sources.

The Turkish central-bank EVDS feed requires an API key. Pending that,
Yahoo Finance is good enough for the FX/commodity/index snapshot a
macro_analysis run actually needs. Inflation & policy-rate fields on
MacroSnapshot stay None unless an EVDS client is wired in.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any

import httpx

from financex.schemas.base import SourceRef
from financex.schemas.macro import MacroSnapshot


YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"


@dataclass(frozen=True)
class MacroFetchParams:
    """Which macro series to pull on this run."""

    want_usd_try: bool = True
    want_eur_try: bool = True
    want_bist100: bool = True
    want_brent: bool = True
    as_of: date | None = None  # defaults to latest


class MacroClient(ABC):
    @abstractmethod
    def snapshot(self, params: MacroFetchParams | None = None) -> MacroSnapshot:
        ...


class YfinanceMacroClient(MacroClient):
    """Free macro fetcher via Yahoo Finance chart endpoint.

    Rate-limited but fine for a few symbols a day. No API key required.
    """

    _SYMBOLS = {
        "usd_try": "USDTRY=X",
        "eur_try": "EURTRY=X",
        "bist100": "^XU100",
        "brent": "BZ=F",
    }

    def __init__(self, *, timeout_s: float = 20.0, http_client: httpx.Client | None = None) -> None:
        self._owns_client = http_client is None
        self._client = http_client or httpx.Client(
            timeout=timeout_s,
            headers={"User-Agent": "Mozilla/5.0 (FinanceX/0.1)"},
            follow_redirects=True,
        )

    def _latest_close(self, symbol: str) -> tuple[Decimal, date] | None:
        url = YAHOO_CHART_URL.format(symbol=symbol.replace("^", "%5E").replace("=", "%3D"))
        resp = self._client.get(url, params={"interval": "1d", "range": "5d"})
        if resp.status_code != 200:
            return None
        data = resp.json()
        result = data.get("chart", {}).get("result") or []
        if not result:
            return None
        quote = result[0]
        closes = (quote.get("indicators", {}).get("quote") or [{}])[0].get("close") or []
        timestamps = quote.get("timestamp") or []
        for ts, c in reversed(list(zip(timestamps, closes))):
            if c is not None:
                return Decimal(str(round(float(c), 6))), datetime.fromtimestamp(ts, tz=timezone.utc).date()
        return None

    def snapshot(self, params: MacroFetchParams | None = None) -> MacroSnapshot:
        p = params or MacroFetchParams()
        sources: list[SourceRef] = []
        now = datetime.now(timezone.utc)
        latest_date: date | None = None

        def _pull(key: str) -> tuple[Decimal | None, date | None]:
            symbol = self._SYMBOLS[key]
            pair = self._latest_close(symbol)
            if pair is None:
                return None, None
            sources.append(SourceRef(
                source_id=f"yahoo:{symbol}",
                url=YAHOO_CHART_URL.format(symbol=symbol),
                fetched_at=now,
            ))
            return pair

        usd_try = usd_try_date = None
        eur_try = bist100 = brent = None

        if p.want_usd_try:
            v, d = _pull("usd_try")
            usd_try, usd_try_date = v, d
            if d:
                latest_date = d
        if p.want_eur_try:
            v, d = _pull("eur_try")
            eur_try = v
            if d and (latest_date is None or d > latest_date):
                latest_date = d
        if p.want_bist100:
            v, d = _pull("bist100")
            bist100 = v
            if d and (latest_date is None or d > latest_date):
                latest_date = d
        if p.want_brent:
            v, d = _pull("brent")
            brent = v
            if d and (latest_date is None or d > latest_date):
                latest_date = d

        return MacroSnapshot(
            as_of=p.as_of or latest_date or now.date(),
            usd_try=usd_try,
            eur_try=eur_try,
            bist100_level=bist100,
            sources=sources,
        )

    def close(self) -> None:
        if self._owns_client:
            self._client.close()


class StaticMacroClient(MacroClient):
    """Test / offline client — returns a fixed MacroSnapshot."""

    def __init__(self, fixture: MacroSnapshot) -> None:
        self.fixture = fixture

    def snapshot(self, params: MacroFetchParams | None = None) -> MacroSnapshot:
        return self.fixture


__all__ = [
    "MacroClient",
    "MacroFetchParams",
    "StaticMacroClient",
    "YfinanceMacroClient",
]


# Suppress unused import if type-checkers complain.
_ = Any
