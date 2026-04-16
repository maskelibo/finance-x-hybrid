"""sentiment_news — headline classification + abnormal-return enrichment.

Python side:
  - coarse theme / sentiment keyword pass
  - abnormal return over 1d / 3d / 5d event windows using the `ta` bars
  - rolls up theme and sentiment distributions
  - produces an overall rule-based score in [-5, +5]

LLM side (later):
  - rewrites the sentiment per item with context
  - separates anticipated-vs-unanticipated headlines
  - writes the 'macro headwinds vs idiosyncratic' narrative
"""

from __future__ import annotations

import re
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import Iterable

from financex.parsers.label_mapping import normalize_label
from financex.schemas.market import OhlcvBar
from financex.schemas.news import NewsAnalysisOutput, NewsItem


# ---------- Theme + sentiment keyword rules ----------

_THEME_RULES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("m_and_a", ("satın alma", "birleşme", "acquisition", "merger", "devral")),
    ("regulatory", ("epdk", "bddk", "spk", "tcmb", "ceza", "yasak", "safeguard", "soruşturma")),
    ("growth", ("büyüme", "yatırım", "kapasite", "yeni tesis", "ihale kazan", "rekor")),
    ("risk", ("dava", "zarar", "kayıp", "iflas", "grev", "kriz", "düşüş")),
    ("governance", ("yönetim kurulu", "genel kurul", "agm", "temettü", "kar payı", "istifa")),
)

_POSITIVE_KEYWORDS = (
    "büyüme", "kâr artış", "rekor", "yatırım", "yeni tesis", "ihale kazan",
    "al önerisi", "hedef yükselt", "yükseltti",
)
_NEGATIVE_KEYWORDS = (
    "zarar", "kayıp", "düşüş", "sat önerisi", "hedef düşür", "soruşturma",
    "dava", "iflas", "grev", "ceza", "yasak", "kriz", "model portföyden çıkar",
)


def _classify_theme(text: str) -> str:
    low = normalize_label(text)
    for theme, keywords in _THEME_RULES:
        for kw in keywords:
            if normalize_label(kw) in low:
                return theme
    return "other"


def _classify_sentiment(text: str) -> str:
    low = normalize_label(text)
    pos = any(normalize_label(k) in low for k in _POSITIVE_KEYWORDS)
    neg = any(normalize_label(k) in low for k in _NEGATIVE_KEYWORDS)
    if pos and not neg:
        return "positive"
    if neg and not pos:
        return "negative"
    return "neutral"


# ---------- Abnormal return (stock − index) over event window ----------

def _total_return(bars: list[OhlcvBar], start: date, end: date) -> Decimal | None:
    """Close-to-close return from first bar with date>=start to last with date<=end."""
    within = [b for b in bars if start <= b.date <= end]
    if len(within) < 2:
        return None
    first = within[0].close
    last = within[-1].close
    if first == 0:
        return None
    return ((last - first) / first).quantize(Decimal("0.0001"))


def abnormal_return(
    stock_bars: list[OhlcvBar],
    index_bars: list[OhlcvBar],
    *,
    event_date: date,
    window_days: int,
) -> Decimal | None:
    end = event_date + timedelta(days=window_days)
    stock_r = _total_return(stock_bars, event_date, end)
    index_r = _total_return(index_bars, event_date, end)
    if stock_r is None or index_r is None:
        return None
    return (stock_r - index_r).quantize(Decimal("0.0001"))


# ---------- Orchestration ----------

def classify_news_items(items: Iterable[NewsItem]) -> list[NewsItem]:
    """Apply theme + sentiment keyword rules in place. Returns a new list."""
    out: list[NewsItem] = []
    for it in items:
        haystack = " ".join(filter(None, [it.title, it.summary]))
        out.append(it.model_copy(update={
            "theme": _classify_theme(haystack),
            "sentiment_hint": _classify_sentiment(haystack),
        }))
    return out


def enrich_with_returns(
    items: list[NewsItem],
    stock_bars: list[OhlcvBar],
    index_bars: list[OhlcvBar],
) -> list[NewsItem]:
    """Add 1d / 3d / 5d abnormal return for each item."""
    out: list[NewsItem] = []
    for it in items:
        event = it.published_at.date()
        out.append(it.model_copy(update={
            "abnormal_return_1d": abnormal_return(stock_bars, index_bars, event_date=event, window_days=1),
            "abnormal_return_3d": abnormal_return(stock_bars, index_bars, event_date=event, window_days=3),
            "abnormal_return_5d": abnormal_return(stock_bars, index_bars, event_date=event, window_days=5),
        }))
    return out


def _overall_score(items: list[NewsItem]) -> Decimal | None:
    if not items:
        return None
    score_map = {"positive": 1, "neutral": 0, "negative": -1}
    raw = sum(score_map.get(it.sentiment_hint or "neutral", 0) for it in items)
    # Normalise to [-5, +5]
    normalised = Decimal(raw) * Decimal("5") / Decimal(len(items))
    return normalised.quantize(Decimal("0.01"))


def build_output(
    ticker: str,
    items: list[NewsItem],
    *,
    window_start: date | None = None,
    window_end: date | None = None,
) -> NewsAnalysisOutput:
    """Aggregate classified items into a NewsAnalysisOutput."""
    theme_dist: dict[str, int] = {}
    sentiment_dist: dict[str, int] = {}
    for it in items:
        theme_dist[it.theme or "other"] = theme_dist.get(it.theme or "other", 0) + 1
        sentiment_dist[it.sentiment_hint or "neutral"] = sentiment_dist.get(
            it.sentiment_hint or "neutral", 0
        ) + 1

    if window_start is None and items:
        window_start = min(it.published_at for it in items).date()
    if window_end is None and items:
        window_end = max(it.published_at for it in items).date()

    return NewsAnalysisOutput(
        ticker=ticker.upper(),
        window_start=window_start or date.today(),
        window_end=window_end or date.today(),
        items=items,
        theme_distribution=theme_dist,
        sentiment_distribution=sentiment_dist,
        overall_sentiment_score=_overall_score(items),
        computed_at=datetime.now(UTC),
    )
