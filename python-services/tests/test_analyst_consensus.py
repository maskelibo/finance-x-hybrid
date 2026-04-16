"""analyst_consensus aggregator tests — distribution, target stats, revision trend."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from financex.calculators.analyst_consensus import aggregate_reports
from financex.schemas.analyst import AnalystReport, Recommendation


def _r(
    broker: str,
    rec: Recommendation,
    target: Decimal | None,
    report_date: date,
) -> AnalystReport:
    return AnalystReport(
        broker=broker,
        report_date=report_date,
        recommendation=rec,
        target_price=target,
    )


# ---------- distribution ----------

def test_distribution_counts_buy_hold_sell() -> None:
    reports = [
        _r("A", Recommendation.BUY, Decimal("300"), date(2026, 4, 1)),
        _r("B", Recommendation.OUTPERFORM, Decimal("310"), date(2026, 4, 3)),
        _r("C", Recommendation.HOLD, Decimal("250"), date(2026, 4, 5)),
        _r("D", Recommendation.SELL, Decimal("180"), date(2026, 4, 8)),
    ]
    c = aggregate_reports(reports)
    assert c.distribution_buy == 2  # BUY + OUTPERFORM
    assert c.distribution_hold == 1
    assert c.distribution_sell == 1
    assert c.count == 4


def test_zero_sell_is_flagged_via_distribution() -> None:
    """Aggregator itself doesn't raise; CLI layer surfaces the flag.
    This test just confirms the data lets us detect it downstream."""
    reports = [
        _r("A", Recommendation.BUY, Decimal("300"), date(2026, 4, 1)),
        _r("B", Recommendation.BUY, Decimal("310"), date(2026, 4, 5)),
        _r("C", Recommendation.HOLD, Decimal("280"), date(2026, 4, 10)),
    ]
    c = aggregate_reports(reports)
    assert c.distribution_sell == 0
    assert c.count >= 3  # qualifies for crowded-long flag


# ---------- target-price stats ----------

def test_target_price_mean_median_range() -> None:
    reports = [
        _r("A", Recommendation.BUY, Decimal("200"), date(2026, 4, 1)),
        _r("B", Recommendation.BUY, Decimal("250"), date(2026, 4, 2)),
        _r("C", Recommendation.HOLD, Decimal("300"), date(2026, 4, 3)),
    ]
    c = aggregate_reports(reports)
    assert c.target_price_mean == Decimal("250")
    assert c.target_price_median == Decimal("250")
    assert c.target_price_high == Decimal("300")
    assert c.target_price_low == Decimal("200")


def test_upside_computed_when_last_close_supplied() -> None:
    reports = [
        _r("A", Recommendation.BUY, Decimal("240"), date(2026, 4, 1)),
        _r("B", Recommendation.BUY, Decimal("260"), date(2026, 4, 2)),
    ]
    c = aggregate_reports(reports, last_close=Decimal("200"))
    # mean 250, last 200 → upside 25%
    assert c.upside_vs_last_close_pct == Decimal("25.00")


def test_target_stats_none_when_no_prices() -> None:
    reports = [_r("A", Recommendation.NOT_RATED, None, date(2026, 4, 1))]
    c = aggregate_reports(reports)
    assert c.target_price_mean is None
    assert c.target_price_high is None


# ---------- revision trend ----------

def test_revision_trend_rising() -> None:
    """Recent (last 30d) targets are meaningfully higher than the prior 60d window."""
    reports = [
        _r("A", Recommendation.BUY, Decimal("200"), date(2026, 1, 15)),
        _r("B", Recommendation.BUY, Decimal("205"), date(2026, 2, 1)),
        _r("C", Recommendation.BUY, Decimal("260"), date(2026, 4, 1)),
        _r("D", Recommendation.BUY, Decimal("265"), date(2026, 4, 10)),
    ]
    c = aggregate_reports(reports, as_of=date(2026, 4, 15))
    assert c.revision_trend == "rising"


def test_revision_trend_falling() -> None:
    reports = [
        _r("A", Recommendation.BUY, Decimal("300"), date(2026, 1, 15)),
        _r("B", Recommendation.BUY, Decimal("310"), date(2026, 2, 1)),
        _r("C", Recommendation.HOLD, Decimal("220"), date(2026, 4, 1)),
        _r("D", Recommendation.SELL, Decimal("210"), date(2026, 4, 10)),
    ]
    c = aggregate_reports(reports, as_of=date(2026, 4, 15))
    assert c.revision_trend == "falling"


def test_revision_trend_none_with_insufficient_cohort() -> None:
    reports = [
        _r("A", Recommendation.BUY, Decimal("200"), date(2026, 4, 1)),
    ]
    c = aggregate_reports(reports)
    assert c.revision_trend is None


# ---------- stddev / spread ----------

def test_stddev_shows_disagreement() -> None:
    reports = [
        _r("A", Recommendation.BUY, Decimal("180"), date(2026, 4, 1)),
        _r("B", Recommendation.HOLD, Decimal("220"), date(2026, 4, 2)),
        _r("C", Recommendation.SELL, Decimal("260"), date(2026, 4, 3)),
    ]
    c = aggregate_reports(reports)
    assert c.target_price_stddev is not None
    assert c.target_price_stddev > Decimal("20")  # substantial spread


def test_empty_reports_returns_empty_consensus() -> None:
    c = aggregate_reports([])
    assert c.count == 0
    assert c.target_price_mean is None
    assert c.distribution_buy == 0
