"""analyst_consensus — deterministic aggregation of broker reports.

Python takes a list of AnalystReport rows (from KAP broker filings,
is_yatirim research page, or a manual JSON fixture) and produces
canonical consensus statistics + a small set of red-flag signals.
The LLM layer later writes the narrative — *why* specific brokers
recommend SELL, what a 30% target spread implies, etc.

Key signals the LLM should see:
  - `distribution_*` counts let it call 'crowded long' when SELLs = 0.
  - `target_price_stddev` flags unusual disagreement across the Street.
  - `revision_trend` ('rising' / 'falling' / 'stable') is derived from
    report dates when ≥2 cohorts are present.
"""

from __future__ import annotations

import statistics
from datetime import date, timedelta
from decimal import Decimal

from financex.schemas.analyst import AnalystConsensus, AnalystReport, Recommendation


# ---------------------------------------------------------------------
# Distribution buckets
# ---------------------------------------------------------------------

_BUY_SET = {Recommendation.BUY, Recommendation.OUTPERFORM}
_SELL_SET = {Recommendation.SELL, Recommendation.UNDERPERFORM}


def _bucket_counts(reports: list[AnalystReport]) -> tuple[int, int, int]:
    buy = sum(1 for r in reports if r.recommendation in _BUY_SET)
    sell = sum(1 for r in reports if r.recommendation in _SELL_SET)
    hold = sum(1 for r in reports if r.recommendation == Recommendation.HOLD)
    return buy, hold, sell


# ---------------------------------------------------------------------
# Target-price statistics
# ---------------------------------------------------------------------

def _target_stats(
    reports: list[AnalystReport],
) -> tuple[Decimal | None, Decimal | None, Decimal | None, Decimal | None, Decimal | None]:
    """Return (mean, median, high, low, stddev) of non-null target prices."""
    prices = [r.target_price for r in reports if r.target_price is not None]
    if not prices:
        return (None, None, None, None, None)
    mean = Decimal(str(round(statistics.fmean(float(p) for p in prices), 4)))
    median = Decimal(str(round(statistics.median(float(p) for p in prices), 4)))
    high = max(prices)
    low = min(prices)
    stddev = (
        Decimal(str(round(statistics.pstdev(float(p) for p in prices), 4)))
        if len(prices) > 1
        else Decimal("0")
    )
    return mean, median, high, low, stddev


# ---------------------------------------------------------------------
# Revision trend — compare recent 30 days vs preceding 60
# ---------------------------------------------------------------------

def _revision_trend(reports: list[AnalystReport], *, as_of: date | None = None) -> str | None:
    """Return 'rising' / 'falling' / 'stable' / None."""
    pricy = [r for r in reports if r.target_price is not None]
    if len(pricy) < 3:
        return None

    ref = as_of or max(r.report_date for r in pricy)
    recent_cutoff = ref - timedelta(days=30)
    older_cutoff = ref - timedelta(days=90)

    recent = [r.target_price for r in pricy if r.report_date >= recent_cutoff]
    older = [
        r.target_price
        for r in pricy
        if older_cutoff <= r.report_date < recent_cutoff
    ]
    if len(recent) < 2 or len(older) < 2:
        return None

    recent_mean = statistics.fmean(float(p) for p in recent if p is not None)
    older_mean = statistics.fmean(float(p) for p in older if p is not None)
    if older_mean == 0:
        return None
    delta_pct = (recent_mean - older_mean) / abs(older_mean)
    if delta_pct > 0.03:
        return "rising"
    if delta_pct < -0.03:
        return "falling"
    return "stable"


# ---------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------

def aggregate_reports(
    reports: list[AnalystReport],
    *,
    last_close: Decimal | None = None,
    as_of: date | None = None,
) -> AnalystConsensus:
    """Build an AnalystConsensus over a list of broker notes.

    `last_close` (optional) enables `upside_vs_last_close_pct` on the
    consensus — a hand-off the LLM uses when writing the "target
    upside" line in the report.
    """
    buy, hold, sell = _bucket_counts(reports)
    mean, median, high, low, stddev = _target_stats(reports)
    trend = _revision_trend(reports, as_of=as_of)

    upside: Decimal | None = None
    if last_close is not None and last_close > 0 and mean is not None:
        upside = (((mean / last_close) - Decimal("1")) * Decimal("100")).quantize(Decimal("0.01"))

    return AnalystConsensus(
        reports=list(reports),
        count=len(reports),
        target_price_mean=mean,
        target_price_median=median,
        target_price_high=high,
        target_price_low=low,
        target_price_stddev=stddev,
        upside_vs_last_close_pct=upside,
        distribution_buy=buy,
        distribution_hold=hold,
        distribution_sell=sell,
        revision_trend=trend,
    )
