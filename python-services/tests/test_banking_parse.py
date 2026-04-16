"""Banking sector parser tests — label fold, NII reconciliation, sector detection.

The big end-to-end test runs against the real AKBNK Q3 2024 PDF and
skips cleanly if the fixture isn't present (fresh clone).
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import pytest

from financex.calculators.reconciliation import run_reconciliation
from financex.parsers.financial_statements import detect_sector, parse_kap_pdf
from financex.parsers.label_mapping import get_income_statement_map, lookup
from financex.schemas.base import Sector


AKBNK_PDF = Path("/tmp/akbnk_pdfs/AKBNK_financial_report_20241024_1350569.pdf")


# ---------- sector-aware lookup ----------

def test_lookup_banking_interest_income() -> None:
    assert lookup("income_statement", "Faiz Gelirleri", sector="banking") == "interest_income"


def test_lookup_banking_net_interest_income() -> None:
    assert lookup("income_statement", "Net Faiz Geliri", sector="banking") == "net_interest_income"


def test_lookup_banking_loan_loss_provisions() -> None:
    assert (
        lookup("income_statement", "Beklenen Zarar Karşılıkları", sector="banking")
        == "loan_loss_provisions"
    )


def test_lookup_industrial_has_no_interest_income() -> None:
    # Industrial map has no "interest_income" field.
    assert lookup("income_statement", "Faiz Gelirleri", sector="industrial") is None


def test_lookup_banking_balance_sheet_varliklar_toplami() -> None:
    assert lookup("balance_sheet", "VARLIKLAR TOPLAMI", sector="banking") == "total_assets"


def test_income_map_is_sector_disjoint() -> None:
    """Banking map should be strictly a banking overlay — no revenue/CoGS."""
    banking = get_income_statement_map("banking")
    assert "hasilat" not in banking
    assert "satislarin maliyeti" not in banking
    assert "faiz gelirleri" in banking
    assert "net faiz geliri" in banking


# ---------- End-to-end against the real AKBNK PDF ----------

@pytest.mark.skipif(
    not AKBNK_PDF.exists(),
    reason="Run `financex data collect AKBNK --since 2024-10-01 --until 2024-12-31 --pdf-dir /tmp/akbnk_pdfs` first.",
)
def test_akbnk_sector_autodetects_banking() -> None:
    assert detect_sector(AKBNK_PDF) == Sector.BANKING


@pytest.mark.skipif(not AKBNK_PDF.exists(), reason="AKBNK fixture PDF missing.")
def test_akbnk_parse_end_to_end() -> None:
    result = parse_kap_pdf(AKBNK_PDF)
    pf = result.period

    # Sector + period
    assert pf.sector == Sector.BANKING
    assert pf.year == 2024
    assert pf.period.value == "Q3"

    # Totals landed
    bs = pf.balance_sheet
    assert bs.total_assets > 0
    assert bs.total_equity > 0

    # Accounting identity holds (banking fallback derives liabilities)
    diff = bs.total_assets - (bs.total_liabilities + bs.total_equity)
    assert abs(diff) <= bs.total_assets / Decimal("10000")

    # Banking-specific fields populated
    is_ = pf.income_statement
    assert is_.interest_income is not None
    assert is_.interest_expense is not None
    assert is_.net_interest_income is not None
    # Interest expense is signed negative
    assert is_.interest_expense < 0
    # NII reconciles to within 1 TL of income + expense
    assert abs(is_.net_interest_income - (is_.interest_income + is_.interest_expense)) < Decimal("1000")
    # Net income positive for AKBNK 9M 2024
    assert is_.net_income > 0


@pytest.mark.skipif(not AKBNK_PDF.exists(), reason="AKBNK fixture PDF missing.")
def test_akbnk_reconciliation_all_passes() -> None:
    parsed = parse_kap_pdf(AKBNK_PDF)
    report = run_reconciliation(parsed.period, ticker="AKBNK")
    assert report.all_passed, f"Failed checks: {[c.code for c in report.failed()]}"
    # Must include banking-specific checks
    check_codes = {c.code for c in report.checks}
    assert "NII_RECONCILE" in check_codes
    assert "BANK_NII_POSITIVE" in check_codes
    # Must NOT include net-debt check (inappropriate for banks)
    assert "NET_DEBT_SANITY" not in check_codes
