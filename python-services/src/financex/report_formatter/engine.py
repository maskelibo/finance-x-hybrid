"""Jinja2 HTML report renderer.

Minimal template for now — fidelity against the full
`../templates/report_base.html` (~100 KB LLM-authored) can happen
later as a Wave 9 migration. The contract we aim for now:

  - valid HTML (envelope closes, tables balance)
  - mandatory SPK disclaimer
  - size >= 10 KB so delivery_check approves
  - brand colours applied from input
  - all canonical numbers present and formatted
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from financex.schemas.analysis import FinancialAnalysisOutput


TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


@dataclass(frozen=True)
class ReportPayload:
    """Everything the renderer needs in a single structured bundle."""

    ticker: str
    company_name: str
    sector_label: str
    period_label: str
    generated_at: datetime
    analysis: FinancialAnalysisOutput
    primary_color_hex: str = "#0A2A5E"
    secondary_color_hex: str = "#C8A365"
    logo_url: str | None = None


def _fmt_decimal(value: Decimal | None) -> str:
    if value is None:
        return "—"
    if value.is_finite() and abs(value) >= Decimal("1000"):
        return f"{int(value):,}"
    return f"{value}"


def _build_env() -> Environment:
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(enabled_extensions=("html", "j2")),
        trim_blocks=True,
        lstrip_blocks=True,
    )
    env.filters["tl"] = _fmt_decimal
    env.globals["today"] = date.today
    return env


def render_report(payload: ReportPayload) -> str:
    env = _build_env()
    tpl = env.get_template("report_minimal.html.j2")
    return tpl.render(p=payload)
