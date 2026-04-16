"""`financex data ...` — data_collection CLI."""

from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path

import typer

from financex.calculators.data_collection import run_data_collection
from financex.crawlers.kap import RawDisclosure

data_app = typer.Typer(help="data_collection — fetch KAP disclosures + pull PDFs.")


def _parse_prefetched(path: Path) -> list[RawDisclosure]:
    """Load a disclosure list previously emitted by kap_watch.

    Accepts either:
      - a raw list of disclosure dicts
      - a kap_watch output envelope with `disclosure_inventory: [...]`
    Each entry must have at least a disclosure_id + title; everything
    else falls back sensibly.
    """
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    # Accept any of these wrappers:
    #   - raw list of dicts
    #   - kap_watch CLI shape:    {"events": [...]}
    #   - kap_watch adapter shape: {"disclosure_inventory": [...]}
    items: object = payload
    if isinstance(payload, dict):
        for key in ("disclosure_inventory", "events", "disclosures"):
            if isinstance(payload.get(key), list):
                items = payload[key]
                break
    if not isinstance(items, list):
        raise typer.BadParameter(
            f"Prefetched file {path} must contain a list (or dict with "
            f"disclosure_inventory / events / disclosures)"
        )

    out: list[RawDisclosure] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        did = str(item.get("disclosure_id") or item.get("disclosureIndex") or "")
        if not did:
            continue
        published_raw = item.get("published_at") or item.get("announced_at")
        if isinstance(published_raw, str):
            try:
                announced = datetime.fromisoformat(published_raw.replace("Z", "+00:00"))
            except ValueError:
                announced = datetime.now(timezone.utc)
        else:
            announced = datetime.now(timezone.utc)
        out.append(
            RawDisclosure(
                disclosure_id=did,
                ticker=str(item.get("ticker") or "").upper(),
                announced_at=announced,
                title=str(item.get("title") or ""),
                url=str(item.get("url") or ""),
                category=item.get("category") or item.get("event_type_hint"),
                subcategory=item.get("subcategory"),
                summary=item.get("summary") or item.get("event_type_hint"),
            )
        )
    return out


@data_app.command("collect")
def collect(
    ticker: str = typer.Argument(..., help="BIST ticker, e.g. KCHOL."),
    years: int = typer.Option(
        6,
        "--years",
        "-y",
        min=1,
        max=15,
        help="How many years of history to fetch (approximate — uses calendar years).",
    ),
    since: str | None = typer.Option(
        None,
        "--since",
        "-s",
        help="Explicit ISO date lower bound. Overrides --years.",
    ),
    until: str | None = typer.Option(None, "--until", "-u"),
    pdf_dir: Path = typer.Option(
        Path("../output/pdfs"),
        "--pdf-dir",
        help="Where to land downloaded PDFs (relative to python-services/).",
    ),
    kinds: str = typer.Option(
        "financial_report,activity_report",
        "--kinds",
        help="Comma-separated list of document kinds to download.",
    ),
    prefetched: Path | None = typer.Option(
        None,
        "--prefetched",
        help="Path to a kap_watch output JSON. When supplied we skip the "
             "byCriteria call entirely and go straight to PDF downloads — "
             "avoids tripping KAP's back-to-back rate-limit.",
    ),
) -> None:
    """Fetch and archive disclosures, emit a DataCollectionManifest as JSON on stdout."""
    if since:
        since_date = date.fromisoformat(since)
    else:
        today = date.today()
        since_date = date(today.year - years, today.month, today.day)
    until_date = date.fromisoformat(until) if until else None

    kinds_tuple = tuple(k.strip() for k in kinds.split(",") if k.strip())

    prefetched_list = _parse_prefetched(prefetched) if prefetched else None

    manifest = run_data_collection(
        ticker.upper(),
        since=since_date,
        until=until_date,
        pdf_dir=pdf_dir.resolve(),
        kinds_to_download=kinds_tuple,
        prefetched_disclosures=prefetched_list,
    )
    typer.echo(manifest.model_dump_json())
