"""kap_watch runner — fetch + classify + (optionally) persist KAP disclosures."""

from __future__ import annotations

from datetime import date

from financex.crawlers.kap import KapClient, RawDisclosure
from financex.parsers.kap_disclosure import to_kap_event
from financex.schemas.kap import KapEvent, KapEvents


def run_kap_watch(
    ticker: str,
    *,
    since: date,
    until: date | None = None,
    client: KapClient,
) -> KapEvents:
    """Fetch disclosures for a ticker, classify, return a KapEvents bundle."""
    raw: list[RawDisclosure] = client.fetch_disclosures(ticker, since=since, until=until)
    events: list[KapEvent] = [to_kap_event(r) for r in raw]
    return KapEvents(
        events=events,
        window_start=_as_utc_midnight(since),
        window_end=_as_utc_midnight(until) if until else None,
    )


def _as_utc_midnight(d: date) -> "datetime":  # noqa: UP037
    from datetime import datetime, timezone

    return datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
