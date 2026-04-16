"""`financex news ...` — sentiment_news CLI."""

from __future__ import annotations

import typer

from financex.calculators.sentiment_news import (
    build_output,
    classify_news_items,
    enrich_with_returns,
)
from financex.crawlers.news import GoogleNewsRSSClient
from financex.crawlers.tradingview import TradingViewClient, TradingViewFetchParams

news_app = typer.Typer(help="sentiment_news — headlines + abnormal return.")


@news_app.command("analyze")
def analyze(
    ticker: str = typer.Argument(..., help="BIST ticker, e.g. KCHOL."),
    query: str | None = typer.Option(None, "--query", help="Override search query."),
    enrich: bool = typer.Option(
        False,
        "--enrich/--no-enrich",
        help="Pull daily bars from TradingView and compute abnormal returns.",
    ),
    limit: int = typer.Option(30, "--limit", "-n", min=1, max=200),
) -> None:
    """Fetch Google News RSS + classify + optionally enrich with abnormal returns."""
    q = query or f"{ticker} hisse OR {ticker} BIST"
    client = GoogleNewsRSSClient()
    try:
        items = client.fetch(q, limit=limit)
    finally:
        client.close()

    classified = classify_news_items(items)

    if enrich:
        tv = TradingViewClient()
        stock_bars = tv.fetch(TradingViewFetchParams(symbol=ticker.upper(), exchange="BIST", interval="daily", n_bars=400))
        index_bars = tv.fetch(TradingViewFetchParams(symbol="XU100", exchange="BIST", interval="daily", n_bars=400))
        classified = enrich_with_returns(classified, stock_bars, index_bars)

    result = build_output(ticker, classified)
    typer.echo(result.model_dump_json())
    typer.echo(
        f"\n[{result.ticker}] items={len(result.items)}  "
        f"themes={result.theme_distribution}  "
        f"sentiment={result.sentiment_distribution}  "
        f"overall={result.overall_sentiment_score}",
        err=True,
    )
