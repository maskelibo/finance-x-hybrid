"""Schemas for sentiment_news — headlines + price reaction."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import Field

from financex.schemas.base import FinancexModel


class NewsItem(FinancexModel):
    """One news headline with optional price-reaction enrichment."""

    title: str
    link: str
    published_at: datetime
    source: str | None = None
    summary: str | None = None

    # Rule-based classification (LLM later refines)
    theme: str | None = Field(
        default=None,
        description="growth | risk | m_and_a | regulatory | governance | other.",
    )
    sentiment_hint: str | None = Field(
        default=None,
        description="positive | negative | neutral — keyword-based first pass.",
    )

    # Event-study enrichments (fair-return proxy: stock r − BIST100 r over window).
    abnormal_return_1d: Decimal | None = None
    abnormal_return_3d: Decimal | None = None
    abnormal_return_5d: Decimal | None = None


class NewsAnalysisOutput(FinancexModel):
    """Canonical sentiment_news package handed to the LLM analyst."""

    ticker: str
    window_start: date
    window_end: date
    items: list[NewsItem] = Field(default_factory=list)

    theme_distribution: dict[str, int] = Field(default_factory=dict)
    sentiment_distribution: dict[str, int] = Field(default_factory=dict)
    overall_sentiment_score: Decimal | None = Field(
        default=None,
        description="Rule-based coarse score in [-5, +5]. LLM is expected to refine.",
    )

    computed_at: datetime
    schema_version: str = "1.0.0"
