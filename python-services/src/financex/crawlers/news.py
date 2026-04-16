"""News fetcher — Google News RSS.

Google News RSS is public, free, stable — it returns an Atom/RSS feed of
search hits for any query. For a BIST ticker we search `"<TICKER> <company name>"`
in Turkish and ingest the last ~100 items.
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Iterable
from urllib.parse import quote

import httpx

from financex.schemas.news import NewsItem


GOOGLE_NEWS_RSS = "https://news.google.com/rss/search"


class NewsClient(ABC):
    @abstractmethod
    def fetch(self, query: str, *, limit: int = 50) -> list[NewsItem]: ...


class GoogleNewsRSSClient(NewsClient):
    def __init__(
        self,
        *,
        lang: str = "tr",
        region: str = "TR",
        timeout_s: float = 20.0,
        http_client: httpx.Client | None = None,
    ) -> None:
        self.lang = lang
        self.region = region
        self._owns = http_client is None
        self._client = http_client or httpx.Client(
            timeout=timeout_s,
            headers={"User-Agent": "Mozilla/5.0 (FinanceX/0.1)"},
        )

    def fetch(self, query: str, *, limit: int = 50) -> list[NewsItem]:
        params = f"q={quote(query)}&hl={self.lang}&gl={self.region}&ceid={self.region}:{self.lang}"
        resp = self._client.get(f"{GOOGLE_NEWS_RSS}?{params}")
        resp.raise_for_status()
        return _parse_rss(resp.text)[:limit]

    def close(self) -> None:
        if self._owns:
            self._client.close()


class StaticNewsClient(NewsClient):
    def __init__(self, fixtures: Iterable[NewsItem]) -> None:
        self.fixtures = list(fixtures)

    def fetch(self, query: str, *, limit: int = 50) -> list[NewsItem]:  # noqa: ARG002
        return self.fixtures[:limit]


# ---------------------------------------------------------------------
# RSS parsing
# ---------------------------------------------------------------------

def _parse_rss(xml_text: str) -> list[NewsItem]:
    root = ET.fromstring(xml_text)
    items: list[NewsItem] = []
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        raw_date = (item.findtext("pubDate") or "").strip()
        try:
            published = parsedate_to_datetime(raw_date)
            if published.tzinfo is None:
                published = published.replace(tzinfo=timezone.utc)
        except Exception:
            published = datetime.now(timezone.utc)
        source_tag = item.find("source")
        source = (source_tag.text or "").strip() if source_tag is not None else None
        summary = (item.findtext("description") or "").strip() or None

        # Google News titles take the form "Title Text - Source"; extract source.
        if source is None and " - " in title:
            parts = title.rsplit(" - ", 1)
            if len(parts) == 2:
                title = parts[0].strip()
                source = parts[1].strip()

        items.append(NewsItem(
            title=title,
            link=link,
            published_at=published,
            source=source,
            summary=summary,
        ))
    return items
