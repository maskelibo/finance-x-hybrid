"""sentiment_news tests — classifier, abnormal return, aggregator, RSS parsing."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from financex.calculators.sentiment_news import (
    abnormal_return,
    build_output,
    classify_news_items,
    enrich_with_returns,
)
from financex.crawlers.news import GoogleNewsRSSClient, StaticNewsClient, _parse_rss
from financex.schemas.market import OhlcvBar
from financex.schemas.news import NewsItem


def _item(title: str, pub: datetime, summary: str | None = None) -> NewsItem:
    return NewsItem(title=title, link="https://example.com", published_at=pub, summary=summary)


# ---------- theme classification ----------

def test_theme_growth_on_investment_headline() -> None:
    items = classify_news_items([_item("Şirket yeni tesis yatırımı açıkladı", datetime(2026, 4, 1, tzinfo=timezone.utc))])
    assert items[0].theme == "growth"


def test_theme_regulatory_on_epdk_headline() -> None:
    items = classify_news_items([_item("EPDK tarife kararı yayımlandı", datetime(2026, 4, 1, tzinfo=timezone.utc))])
    assert items[0].theme == "regulatory"


def test_theme_m_and_a() -> None:
    items = classify_news_items([_item("XYZ satın alma anlaşması imzaladı", datetime(2026, 4, 1, tzinfo=timezone.utc))])
    assert items[0].theme == "m_and_a"


def test_theme_unknown_falls_through_to_other() -> None:
    items = classify_news_items([_item("Şirket piknik düzenledi", datetime(2026, 4, 1, tzinfo=timezone.utc))])
    assert items[0].theme == "other"


# ---------- sentiment classification ----------

def test_sentiment_positive_on_growth_keywords() -> None:
    items = classify_news_items([_item("Şirket rekor kâr artışı açıkladı", datetime(2026, 4, 1, tzinfo=timezone.utc))])
    assert items[0].sentiment_hint == "positive"


def test_sentiment_negative_on_portfolio_removal() -> None:
    items = classify_news_items(
        [_item("Aracı kurum Koç Holding'i model portföyden çıkardı", datetime(2026, 4, 16, tzinfo=timezone.utc))]
    )
    assert items[0].sentiment_hint == "negative"


# ---------- abnormal return ----------

def _bar(d: date, close: float) -> OhlcvBar:
    return OhlcvBar(
        date=d,
        open=Decimal(str(close)),
        high=Decimal(str(close)),
        low=Decimal(str(close)),
        close=Decimal(str(close)),
        volume=1_000_000,
    )


def test_abnormal_return_positive_when_stock_beats_index() -> None:
    stock = [_bar(date(2026, 4, 1), 100), _bar(date(2026, 4, 2), 110)]
    index = [_bar(date(2026, 4, 1), 100), _bar(date(2026, 4, 2), 102)]
    ar = abnormal_return(stock, index, event_date=date(2026, 4, 1), window_days=1)
    # Stock +10%, index +2% → AR = +8%
    assert ar == Decimal("0.0800")


def test_abnormal_return_none_when_window_outside_bars() -> None:
    stock = [_bar(date(2026, 4, 1), 100)]
    index = [_bar(date(2026, 4, 1), 100)]
    ar = abnormal_return(stock, index, event_date=date(2026, 4, 10), window_days=3)
    assert ar is None


def test_enrich_with_returns_populates_each_item() -> None:
    stock = [
        _bar(date(2026, 4, 1), 100), _bar(date(2026, 4, 2), 105),
        _bar(date(2026, 4, 3), 108), _bar(date(2026, 4, 4), 110),
        _bar(date(2026, 4, 5), 112), _bar(date(2026, 4, 6), 115),
    ]
    index = [
        _bar(date(2026, 4, 1), 1000), _bar(date(2026, 4, 2), 1005),
        _bar(date(2026, 4, 3), 1010), _bar(date(2026, 4, 4), 1012),
        _bar(date(2026, 4, 5), 1015), _bar(date(2026, 4, 6), 1018),
    ]
    items = [_item("Haber", datetime(2026, 4, 1, tzinfo=timezone.utc))]
    enriched = enrich_with_returns(items, stock, index)
    assert enriched[0].abnormal_return_1d is not None


# ---------- aggregator ----------

def test_overall_score_range_minus_five_to_plus_five() -> None:
    items = classify_news_items([
        _item("rekor kâr artışı", datetime(2026, 4, 1, tzinfo=timezone.utc)),
        _item("büyüme ivmesi", datetime(2026, 4, 2, tzinfo=timezone.utc)),
        _item("yatırım kararı", datetime(2026, 4, 3, tzinfo=timezone.utc)),
    ])
    out = build_output("TEST", items)
    assert out.overall_sentiment_score is not None
    assert Decimal("-5") <= out.overall_sentiment_score <= Decimal("5")


def test_output_distributions_match_item_counts() -> None:
    items = classify_news_items([
        _item("rekor kâr", datetime(2026, 4, 1, tzinfo=timezone.utc)),
        _item("rekor yatırım", datetime(2026, 4, 2, tzinfo=timezone.utc)),
        _item("soruşturma başladı", datetime(2026, 4, 3, tzinfo=timezone.utc)),
    ])
    out = build_output("TEST", items)
    assert out.sentiment_distribution.get("positive", 0) == 2
    assert out.sentiment_distribution.get("negative", 0) == 1
    assert len(out.items) == 3


def test_empty_items_produces_empty_output() -> None:
    out = build_output("EMPTY", [])
    assert out.items == []
    assert out.overall_sentiment_score is None


# ---------- RSS parser ----------

_SAMPLE_RSS = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<item>
<title>Test haberi - Example Source</title>
<link>https://example.com/article</link>
<pubDate>Thu, 16 Apr 2026 14:36:55 GMT</pubDate>
<description>short description</description>
</item>
</channel></rss>
"""


def test_rss_parser_extracts_item_and_source() -> None:
    items = _parse_rss(_SAMPLE_RSS)
    assert len(items) == 1
    assert items[0].title == "Test haberi"
    assert items[0].source == "Example Source"
    assert items[0].published_at.tzinfo is not None


# ---------- StaticNewsClient ----------

def test_static_news_client_returns_fixture() -> None:
    fixtures = [_item("H1", datetime(2026, 4, 1, tzinfo=timezone.utc)),
                _item("H2", datetime(2026, 4, 2, tzinfo=timezone.utc))]
    client = StaticNewsClient(fixtures)
    assert client.fetch("query", limit=10) == fixtures
    assert client.fetch("query", limit=1) == fixtures[:1]
