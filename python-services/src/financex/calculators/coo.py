"""coo — pre-flight and delivery checks, purely rule-based.

Two phases of the pipeline use this module:

  - pre-flight (before data_collection): sector-aware mandatory
    requirements (which KAP disclosures, which external data sources,
    which reconciliation checks apply).
  - delivery (after report_formatter): HTML bütünlüğü, tablo kapanışı,
    mandatory disclaimer, page-count sanity.

Both phases return a structured decision so the orchestrator can
either proceed, proceed-with-flags, or block.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from pydantic import Field

from financex.schemas.base import FinancexModel, Sector


class CheckItem(FinancexModel):
    code: str
    label: str
    passed: bool
    message: str


class PreflightReport(FinancexModel):
    ticker: str
    sector: Sector
    decision: str          # 'go' | 'conditional' | 'no_go'
    items: list[CheckItem] = Field(default_factory=list)
    computed_at: datetime
    schema_version: str = "1.0.0"


class DeliveryReport(FinancexModel):
    ticker: str
    decision: str          # 'approved' | 'revision_needed' | 'blocked'
    items: list[CheckItem] = Field(default_factory=list)
    computed_at: datetime
    schema_version: str = "1.0.0"


# ---------- Pre-flight catalogue ----------

@dataclass(frozen=True)
class _PreflightRule:
    code: str
    label: str
    sectors: tuple[Sector, ...]


_PREFLIGHT_RULES: tuple[_PreflightRule, ...] = (
    _PreflightRule(
        "KAP_ACCESS", "Reachable KAP endpoint (api/search/combined)",
        sectors=tuple(Sector)
    ),
    _PreflightRule(
        "TCMB_FX", "TCMB daily FX bulletin reachable",
        sectors=tuple(Sector)
    ),
    _PreflightRule(
        "FIVE_YEAR_WINDOW", "Five-year fetch window resolvable",
        sectors=tuple(Sector)
    ),
    _PreflightRule(
        "BDDK_FORMAT_AWARE", "Parser loaded banking label overlay",
        sectors=(Sector.BANKING,)
    ),
    _PreflightRule(
        "HOLDING_SOTP_NOTED", "Holding SOTP requirement flagged to valuation",
        sectors=(Sector.HOLDING,)
    ),
)


def preflight(
    ticker: str,
    sector: Sector,
    *,
    facts: dict[str, bool] | None = None,
) -> PreflightReport:
    """Run sector-filtered pre-flight checks.

    `facts` supplies live probe results — e.g. {"KAP_ACCESS": True}.
    Missing keys default to True (optimistic) so pre-flight doesn't
    require every probe before the pipeline can even run.
    """
    facts = facts or {}
    items: list[CheckItem] = []
    failed_any = False
    for rule in _PREFLIGHT_RULES:
        if sector not in rule.sectors:
            continue
        passed = facts.get(rule.code, True)
        if not passed:
            failed_any = True
        items.append(CheckItem(
            code=rule.code,
            label=rule.label,
            passed=passed,
            message="ok" if passed else f"fact missing or False for {rule.code}",
        ))

    decision = "no_go" if failed_any else "go"
    return PreflightReport(
        ticker=ticker.upper(),
        sector=sector,
        decision=decision,
        items=items,
        computed_at=datetime.now(UTC),
    )


# ---------- Delivery checks (HTML scan) ----------

_CRITICAL_STRINGS = (
    "<html",
    "</html>",
    "yatırım tavsiyesi",   # mandatory disclaimer
)

_TABLE_OPEN_RE = re.compile(r"<table\b", re.IGNORECASE)
_TABLE_CLOSE_RE = re.compile(r"</table>", re.IGNORECASE)


def delivery_check(ticker: str, html: str) -> DeliveryReport:
    """Scan a rendered HTML report for structural + compliance requirements."""
    items: list[CheckItem] = []

    # 1. HTML structural integrity
    open_tables = len(_TABLE_OPEN_RE.findall(html))
    close_tables = len(_TABLE_CLOSE_RE.findall(html))
    tables_ok = open_tables == close_tables
    items.append(CheckItem(
        code="TABLE_BALANCE",
        label="Every <table> closes properly",
        passed=tables_ok,
        message=f"{open_tables} opened, {close_tables} closed",
    ))

    # 2. Document envelope
    envelope_ok = "<html" in html.lower() and "</html>" in html.lower()
    items.append(CheckItem(
        code="HTML_ENVELOPE",
        label="HTML envelope present",
        passed=envelope_ok,
        message="ok" if envelope_ok else "missing <html> or </html>",
    ))

    # 3. Mandatory SPK disclaimer (paraphrase match — must appear)
    disclaimer_ok = "yatırım tavsiyesi değildir" in html.lower()
    items.append(CheckItem(
        code="SPK_DISCLAIMER",
        label="Mandatory SPK disclaimer present",
        passed=disclaimer_ok,
        message="ok" if disclaimer_ok else "missing 'yatırım tavsiyesi değildir'",
    ))

    # 4. Minimum page-count proxy — the minimal Python template runs
    #    ~6 KB; the full LLM-authored template is 80 KB+. We floor at
    #    5 KB: anything smaller is clearly a stub / error placeholder.
    size_ok = len(html) >= 5_000
    items.append(CheckItem(
        code="MIN_PAYLOAD_SIZE",
        label="Rendered HTML ≥ 5 KB",
        passed=size_ok,
        message=f"{len(html)} bytes",
    ))

    # Decide
    if not envelope_ok or not disclaimer_ok:
        decision = "blocked"
    elif not tables_ok or not size_ok:
        decision = "revision_needed"
    else:
        decision = "approved"

    return DeliveryReport(
        ticker=ticker.upper(),
        decision=decision,
        items=items,
        computed_at=datetime.now(UTC),
    )
