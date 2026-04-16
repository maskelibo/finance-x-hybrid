"""parse_standardization unit tests — Turkish text folding, number parsing,
classification, column detection. The big end-to-end test runs the parser
against the real KCHOL Q3 2024 PDF and is marked to skip if the fixture
PDF isn't present.
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import pytest

from financex.parsers.financial_statements import (
    _classify_table,
    _detect_multiplier,
    _first_numeric_column,
    _parse_tr_number,
    parse_kap_pdf,
)
from financex.parsers.label_mapping import lookup, normalize_label
from financex.parsers.pdf_tables import ExtractedTable


# ---------- Turkish normalization ----------

@pytest.mark.parametrize(
    "src, expected",
    [
        ("Hasılat", "hasilat"),
        ("TOPLAM YÜKÜMLÜLÜKLER", "toplam yukumlulukler"),
        ("Dönem Karı (Zararı)", "donem kari zarari"),
        ("Ana Ortaklığa Ait Özkaynaklar", "ana ortakliga ait ozkaynaklar"),
        ("TOPLAM KAYNAKLAR", "toplam kaynaklar"),
        ("Nakit ve Nakit Benzerleri", "nakit ve nakit benzerleri"),
    ],
)
def test_normalize_label_folds_turkish(src: str, expected: str) -> None:
    assert normalize_label(src) == expected


def test_lookup_balance_sheet_totals() -> None:
    assert lookup("balance_sheet", "TOPLAM VARLIKLAR") == "total_assets"
    assert lookup("balance_sheet", "TOPLAM YÜKÜMLÜLÜKLER") == "total_liabilities"
    assert lookup("balance_sheet", "TOPLAM ÖZKAYNAKLAR") == "total_equity"
    assert lookup("balance_sheet", "TOPLAM KAYNAKLAR") == "total_assets"


def test_lookup_income_statement() -> None:
    assert lookup("income_statement", "Hasılat") == "revenue"
    assert lookup("income_statement", "TOPLAM HASILAT") == "revenue"
    assert lookup("income_statement", "Dönem Karı (Zararı)") == "net_income"


def test_lookup_cash_flow() -> None:
    assert lookup("cash_flow", "İşletme Faaliyetlerinden Nakit Akışları") == "operating_cash_flow"


# ---------- Number parsing ----------

@pytest.mark.parametrize(
    "raw, expected",
    [
        ("3.009.264", Decimal("3009264")),
        ("-8.460", Decimal("-8460")),
        ("(992.712)", Decimal("-992712")),
        ("1.234,56", Decimal("1234.56")),
        ("0", Decimal("0")),
        ("", None),
        ("-", None),
        ("not a number", None),
    ],
)
def test_parse_tr_number(raw, expected) -> None:
    assert _parse_tr_number(raw) == expected


# ---------- Multiplier detection ----------

def test_detect_multiplier_milyon_tl() -> None:
    rows = [["Sunum Para Birimi", "1.000.000 TL"], ["Finansal Tablo Niteliği", "Konsolide"]]
    assert _detect_multiplier(rows) == Decimal("1000000")


def test_detect_multiplier_bin_tl() -> None:
    rows = [["Sunum Para Birimi", "1.000 TL"]]
    assert _detect_multiplier(rows) == Decimal("1000")


def test_detect_multiplier_defaults_to_one() -> None:
    rows = [["Finansal Durum Tablosu", ""]]
    assert _detect_multiplier(rows) == Decimal("1")


# ---------- Table classification ----------

def test_classify_balance_sheet() -> None:
    tbl = ExtractedTable(page=2, rows=[
        ["Finansal Durum Tablosu (Bilanço)"],
        ["Varlıklar"],
        ["DÖNEN VARLIKLAR"],
    ])
    assert _classify_table(tbl) == "balance_sheet"


def test_classify_income_statement() -> None:
    tbl = ExtractedTable(page=4, rows=[
        ["Kar veya Zarar Tablosu"],
        ["KAR VEYA ZARAR KISMI"],
    ])
    assert _classify_table(tbl) == "income_statement"


def test_classify_cash_flow() -> None:
    tbl = ExtractedTable(page=6, rows=[
        ["Nakit Akış Tablosu (Dolaylı Yöntem)"],
    ])
    assert _classify_table(tbl) == "cash_flow"


def test_classify_continuation_returns_none() -> None:
    # A page-2 of the BS has no statement title — only data rows.
    tbl = ExtractedTable(page=3, rows=[
        ["TOPLAM YÜKÜMLÜLÜKLER", "", "3.009.264", "2.968.121"],
        ["ÖZKAYNAKLAR", "", "", ""],
    ])
    assert _classify_table(tbl) is None


# ---------- Column detection ----------

def test_first_numeric_column_skips_footnote_ref_column() -> None:
    """Dipnot Ref column has tiny ints (5, 19, ...) — must skip to the data col."""
    rows = [
        ["TOPLAM YÜKÜMLÜLÜKLER", "", "3.009.264", "2.968.121"],
        ["ÖZKAYNAKLAR", "", "", ""],
        ["Ana Ortaklığa Ait Özkaynaklar", "", "509.735", "549.866"],
        ["Ödenmiş Sermaye", "19", "2.536", "2.536"],
        ["Sermaye Düzeltme Farkları", "19", "64.706", "64.706"],
        ["Geri Alınmış Paylar (-)", "19", "-84", "-84"],
    ]
    assert _first_numeric_column(rows) == 2


# ---------- End-to-end against real PDF (optional) ----------

KCHOL_PDF = Path("/tmp/kchol_pdfs/KCHOL_financial_report_20241107_1355133.pdf")


@pytest.mark.skipif(not KCHOL_PDF.exists(), reason="Run `financex data collect KCHOL` first to fetch the fixture.")
def test_parse_real_kchol_q3_2024() -> None:
    result = parse_kap_pdf(KCHOL_PDF)
    pf = result.period

    # Period correctly inferred
    assert pf.year == 2024
    assert pf.period.value == "Q3"

    # Accounting identity within 0.01% — proves BS parsed cleanly.
    bs = pf.balance_sheet
    assert bs.total_assets > 0
    assert bs.total_liabilities > 0
    assert bs.total_equity > 0
    lhs = bs.total_assets
    rhs = bs.total_liabilities + bs.total_equity
    assert abs(lhs - rhs) <= (lhs / Decimal("10000"))

    # IS sanity: revenue > 0, net_income signed correctly.
    assert pf.income_statement.revenue > 0
    # KCHOL 9A 2024 booked a net loss — value should be negative.
    assert pf.income_statement.net_income < 0

    # Cash flow: OCF positive.
    assert pf.cash_flow is not None
    assert pf.cash_flow.operating_cash_flow > 0
