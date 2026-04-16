"""Wave 8 tests — coo (preflight + delivery) and report_formatter."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from financex.calculators.coo import delivery_check, preflight
from financex.report_formatter import ReportPayload, render_report
from financex.schemas.analysis import FinancialAnalysisOutput, MetricHighlight, RedFlag
from financex.schemas.base import Sector
from financex.schemas.engine import EngineOutput


# ---------- preflight ----------

def test_preflight_industrial_default_go() -> None:
    report = preflight("TEST", Sector.INDUSTRIAL)
    assert report.decision == "go"
    assert all(i.passed for i in report.items)


def test_preflight_banking_loads_banking_rule() -> None:
    report = preflight("AKBNK", Sector.BANKING)
    codes = {i.code for i in report.items}
    assert "BDDK_FORMAT_AWARE" in codes


def test_preflight_holding_loads_sotp_rule() -> None:
    report = preflight("KCHOL", Sector.HOLDING)
    codes = {i.code for i in report.items}
    assert "HOLDING_SOTP_NOTED" in codes


def test_preflight_no_go_on_failed_probe() -> None:
    report = preflight("TEST", Sector.INDUSTRIAL, facts={"KAP_ACCESS": False})
    assert report.decision == "no_go"
    failed = [i for i in report.items if not i.passed]
    assert any(i.code == "KAP_ACCESS" for i in failed)


# ---------- delivery ----------

def _minimal_html(body: str = "", *, size_padding: int = 6_000) -> str:
    pad = "x" * size_padding
    return f"""<!DOCTYPE html>
<html><head><title>t</title></head>
<body>
{body}
<div class="disclaimer">Bu rapor yatırım tavsiyesi değildir.</div>
<!-- {pad} -->
</body></html>"""


def test_delivery_approves_clean_html() -> None:
    html = _minimal_html("<table><tr><td>x</td></tr></table>")
    report = delivery_check("TEST", html)
    assert report.decision == "approved"
    assert all(i.passed for i in report.items)


def test_delivery_blocks_when_disclaimer_missing() -> None:
    html = (
        "<!DOCTYPE html><html><head><title>t</title></head>"
        "<body><p>hello</p>" + ("x" * 12_000) + "</body></html>"
    )
    report = delivery_check("TEST", html)
    assert report.decision == "blocked"


def test_delivery_flags_table_imbalance() -> None:
    html = _minimal_html("<table><tr><td>x</td></tr>")  # unclosed <table>
    report = delivery_check("TEST", html)
    assert report.decision == "revision_needed"
    table_item = next(i for i in report.items if i.code == "TABLE_BALANCE")
    assert table_item.passed is False


def test_delivery_flags_tiny_payload() -> None:
    html = (
        "<!DOCTYPE html><html><head></head><body>"
        "<p>yatırım tavsiyesi değildir</p></body></html>"
    )
    report = delivery_check("TEST", html)
    assert report.decision == "revision_needed"


# ---------- report_formatter ----------

def _payload() -> ReportPayload:
    fa = FinancialAnalysisOutput(
        ticker="KCHOL",
        period_label="Q3-2024",
        sector=Sector.HOLDING,
        computed_at=datetime.now(timezone.utc),
        engine=EngineOutput(),
        highlights=[
            MetricHighlight(
                code="NET_MARGIN", label="Net margin", value=Decimal("-0.51"),
                unit="%", narrative_hint="Negative — loss territory.",
            ),
            MetricHighlight(
                code="ROE", label="Return on equity", value=Decimal("-1.00"),
                unit="%", narrative_hint="Check sector cost of capital.",
            ),
        ],
        red_flags=[
            RedFlag(code="NET_LOSS", severity="critical", message="9M net loss -8.5B TRY"),
        ],
        canonical_numbers={
            "total_assets": Decimal("3851061000000"),
            "total_equity": Decimal("841797000000"),
            "net_income": Decimal("-8460000000"),
        },
    )
    return ReportPayload(
        ticker="KCHOL",
        company_name="Koç Holding A.Ş.",
        sector_label="Holding",
        period_label="Q3 2024",
        generated_at=datetime.now(timezone.utc),
        analysis=fa,
    )


def test_render_report_produces_valid_envelope() -> None:
    html = render_report(_payload())
    assert html.startswith("<!DOCTYPE html>")
    assert "<html" in html.lower()
    assert "</html>" in html.lower()


def test_render_report_embeds_disclaimer() -> None:
    html = render_report(_payload())
    assert "yatırım tavsiyesi değildir" in html.lower()


def test_render_report_passes_delivery_check() -> None:
    payload = _payload()
    html = render_report(payload)
    report = delivery_check(payload.ticker, html)
    assert report.decision == "approved", f"failed checks: {[i for i in report.items if not i.passed]}"


def test_render_report_applies_brand_primary_color() -> None:
    payload = _payload()
    custom = ReportPayload(
        ticker=payload.ticker,
        company_name=payload.company_name,
        sector_label=payload.sector_label,
        period_label=payload.period_label,
        generated_at=payload.generated_at,
        analysis=payload.analysis,
        primary_color_hex="#FF6600",
        secondary_color_hex="#123456",
    )
    html = render_report(custom)
    assert "#FF6600" in html
    assert "#123456" in html


def test_render_report_lists_all_highlights() -> None:
    html = render_report(_payload())
    assert "Net margin" in html
    assert "Return on equity" in html


def test_render_report_surfaces_critical_flag() -> None:
    html = render_report(_payload())
    assert "NET_LOSS" in html
    assert "CRITICAL" in html.upper()


def test_render_report_handles_no_red_flags() -> None:
    payload = _payload()
    payload.analysis.red_flags.clear()
    html = render_report(payload)
    # Must still render a valid full HTML
    assert "</html>" in html.lower()
