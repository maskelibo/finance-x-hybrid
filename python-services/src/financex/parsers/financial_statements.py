"""Parse standardized financial statements from a KAP PDF.

Produces a PeriodFinancials (base) populated with whichever fields we
could extract. Unrecognised rows → surfaced on the QualityControl block.

Strategy:
  1. pdfplumber → every table, page-indexed.
  2. A statement classifier looks at each table's first meaningful row
     to decide: Bilanço / Kar Zarar / Nakit Akış / Özkaynak Değişim.
  3. A column-header detector identifies which column is "current
     period" and what date it ends on (e.g. 30.09.2024 → Q3 2024).
  4. Row walker: for each row, normalise the label, look up the
     canonical field name via label_mapping, parse the current-period
     value (Turkish number format), write into the right model.

This is deliberately a best-effort parser: when in doubt it leaves a
field None and emits a QualityFlag. The LLM layer downstream is the
escape valve for oddly-formatted reports.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path

from financex.parsers.label_mapping import lookup, normalize_label
from financex.parsers.pdf_tables import ExtractedTable, extract_page_text, extract_tables
from financex.schemas.base import Currency, Sector, SourceRef
from financex.schemas.financials import (
    BalanceSheet,
    CashFlowStatement,
    EquityChange,
    IncomeStatement,
    PeriodFinancials,
)
from financex.schemas.quality import QualityFlag, Severity


# ---------------------------------------------------------------------
# Statement classification keywords
# ---------------------------------------------------------------------

STATEMENT_KEYWORDS = {
    "off_balance_sheet": ("nazim hesaplar", "bilanco disi"),
    "balance_sheet": ("finansal durum tablosu", "bilanco"),
    # "kar veya zarar" is the strongest income-statement signal — it also
    # appears in the combined title "Kar veya Zarar ve Diğer Kapsamlı Gelir
    # Tablosu", which IS the income statement (not a standalone OCI table).
    # "gelir tablosu" is deliberately omitted here because it is a substring
    # of "Diğer Kapsamlı Gelir Tablosu" and would mis-classify OCI tables.
    "income_statement": ("kar veya zarar", "kar zarar tablosu"),
    "comprehensive_income": ("diger kapsamli gelir", "toplam kapsamli gelir"),
    "cash_flow": ("nakit akis tablosu", "nakit akim tablosu"),
    "equity_change": ("ozkaynak degisim tablosu", "ozkaynaklardaki degisim"),
}


# Off-balance-sheet data must not sneak into balance_sheet totals — banks
# use this table for contingent liabilities (guarantees, commitments).
_SKIP_KINDS = {"off_balance_sheet", "comprehensive_income"}


# ---------------------------------------------------------------------
# Sector detection from the PDF header
# ---------------------------------------------------------------------

_SECTOR_HINTS: list[tuple[str, Sector]] = [
    ("banka finansal rapor", Sector.BANKING),
    ("bddk", Sector.BANKING),
    ("bankacilik kanunu", Sector.BANKING),
    ("holding finansal rapor", Sector.HOLDING),
    ("sigorta finansal rapor", Sector.INSURANCE),
    ("gayrimenkul yatirim ortakligi", Sector.REIT),
]


def detect_sector(pdf_path: Path | str) -> Sector:
    """Peek at the first page text and guess the sector."""
    head = normalize_label(extract_page_text(pdf_path, 1)[:2_000])
    for hint, sector in _SECTOR_HINTS:
        if hint in head:
            return sector
    return Sector.INDUSTRIAL


def _classify_table(tbl: ExtractedTable) -> str | None:
    """Return the statement kind (balance_sheet / income_statement / ...) or None."""
    head = " ".join(" ".join(row) for row in tbl.rows[:4])
    haystack = normalize_label(head)
    for kind, keywords in STATEMENT_KEYWORDS.items():
        for kw in keywords:
            if kw in haystack:
                return kind
    return None


# ---------------------------------------------------------------------
# Column header detection — find the "current period" date column
# ---------------------------------------------------------------------

_DATE_RE = re.compile(r"(\d{2}\.\d{2}\.\d{4})")
_DATE_RANGE_RE = re.compile(r"\d{2}\.\d{2}\.(\d{4})\s*-\s*(\d{2})\.(\d{2})\.(\d{4})")


@dataclass
class ColumnLayout:
    current_col: int
    previous_col: int | None
    current_period_end: date | None
    currency_multiplier: Decimal = Decimal("1")


def _header_row(rows: list[list[str]]) -> list[str] | None:
    """Return the first row where at least half the cells contain dates."""
    for row in rows[:5]:
        dated = sum(1 for c in row if _DATE_RE.search(c))
        if dated >= 2:
            return row
    return None


def _detect_columns(rows: list[list[str]]) -> ColumnLayout | None:
    header = _header_row(rows)
    if not header:
        return None
    # The column layout typically goes: [label, (Dipnot Ref), current, previous, ...]
    dated_idx = [i for i, c in enumerate(header) if _DATE_RE.search(c)]
    if not dated_idx:
        return None
    current_col = dated_idx[0]
    previous_col = dated_idx[1] if len(dated_idx) > 1 else None

    current_end: date | None = None
    # Try to parse a date range first (OCF-style: "01.01.2024 - 30.09.2024")
    range_match = _DATE_RANGE_RE.search(header[current_col])
    if range_match:
        current_end = date(int(range_match.group(4)), int(range_match.group(3)), int(range_match.group(2)))
    else:
        single = _DATE_RE.search(header[current_col])
        if single:
            d, m, y = single.group(1).split(".")
            current_end = date(int(y), int(m), int(d))

    return ColumnLayout(
        current_col=current_col,
        previous_col=previous_col,
        current_period_end=current_end,
    )


# ---------------------------------------------------------------------
# Currency & multiplier detection
# ---------------------------------------------------------------------

_UNIT_PATTERNS = (
    (re.compile(r"1[\.,]000[\.,]000\s*TL", re.IGNORECASE), Decimal("1000000")),
    (re.compile(r"1[\.,]000\s*TL", re.IGNORECASE), Decimal("1000")),
    (re.compile(r"milyon", re.IGNORECASE), Decimal("1000000")),
    (re.compile(r"bin", re.IGNORECASE), Decimal("1000")),
)


_SUNUM_RE = re.compile(r"sunum\s*para\s*birimi", re.IGNORECASE)


def _detect_multiplier(rows: list[list[str]]) -> Decimal:
    """Look at the first few rows for a 'Sunum Para Birimi: 1.000.000 TL' cue.

    Only matches unit patterns when they appear in a 'Sunum Para Birimi'
    context — otherwise auditor-report text like '1.045 milyon TL' would
    cause a false 1-million multiplier.
    """
    text = " ".join(" ".join(row) for row in rows[:6])
    # Only search for units if we see the 'Sunum Para Birimi' label
    if not _SUNUM_RE.search(text):
        return Decimal("1")
    for pattern, mul in _UNIT_PATTERNS:
        if pattern.search(text):
            return mul
    return Decimal("1")


# ---------------------------------------------------------------------
# Turkish number parsing: "3.009.264" or "(3.009.264)" → Decimal
# ---------------------------------------------------------------------

_NUM_RE = re.compile(r"^\(?-?[\d\.,]+\)?$")


def _parse_tr_number(cell: str) -> Decimal | None:
    raw = cell.strip()
    if not raw or raw in {"-", "—"}:
        return None
    if not _NUM_RE.match(raw):
        return None
    # Handle parentheses as negative
    neg = raw.startswith("(") and raw.endswith(")")
    if neg:
        raw = raw[1:-1]
    # Turkish format uses '.' as thousand sep and ',' as decimal
    # Remove thousand separators first: if there's a comma, treat it as decimal
    if "," in raw:
        # e.g. "1.234,56" → "1234.56"
        raw = raw.replace(".", "").replace(",", ".")
    else:
        # "3.009.264" → "3009264"
        raw = raw.replace(".", "")
    try:
        value = Decimal(raw)
    except InvalidOperation:
        return None
    return -value if neg else value


# ---------------------------------------------------------------------
# Row walker
# ---------------------------------------------------------------------

@dataclass
class _Bag:
    balance: dict[str, Decimal] = field(default_factory=dict)
    income: dict[str, Decimal] = field(default_factory=dict)
    cashflow: dict[str, Decimal] = field(default_factory=dict)
    equity: dict[str, Decimal] = field(default_factory=dict)
    flags: list[QualityFlag] = field(default_factory=list)


# Fields where multiple PDF rows should sum into a single schema field
# (e.g. Genel Yönetim + Pazarlama + Ar-Ge → opex).
_ACCUMULATE_FIELDS: set[tuple[str, str]] = {
    ("income_statement", "opex"),
    ("income_statement", "bank_operating_expenses"),
    ("balance_sheet", "short_term_debt"),
    ("cash_flow", "capex"),
}


def _absorb_table(
    bag: _Bag,
    tbl: ExtractedTable,
    kind: str,
    *,
    multiplier: Decimal = Decimal("1"),
    sector: str = "industrial",
) -> None:
    layout = _detect_columns(tbl.rows)
    target = {
        "balance_sheet": bag.balance,
        "income_statement": bag.income,
        "cash_flow": bag.cashflow,
        "equity_change": bag.equity,
    }.get(kind)
    if target is None:
        return  # comprehensive_income etc. — nothing to map yet

    # Column layout:
    #   - non-banking: first dated column (or first large-value column)
    #   - banking: BS uses 8-col layout [label, Dipnot, TP, YP, Toplam,
    #     TP_prev, YP_prev, Toplam_prev]; "Toplam" is col 4 (0-indexed).
    #     IS/CF use 6-col layout [label, Dipnot, current_9M, prev_9M,
    #     current_3M, prev_3M]; col 2 is the current 9-month column.
    if sector == "banking" and kind == "balance_sheet":
        current_col = 4 if _has_wide_banking_layout(tbl.rows) else None
    elif sector == "banking" and kind in {"income_statement", "cash_flow"}:
        current_col = 2 if _has_narrow_banking_layout(tbl.rows) else None
    else:
        current_col = None

    if current_col is None:
        if layout is None:
            bag.flags.append(
                QualityFlag(
                    code="NO_DATE_COLUMN_CONTINUATION",
                    severity=Severity.INFO,
                    message=f"Continuation table on page {tbl.page} ({kind}) — scanning numeric columns.",
                )
            )
            current_col = _first_numeric_column(tbl.rows)
            if current_col is None:
                return
        else:
            current_col = layout.current_col

    for row in tbl.rows:
        if len(row) <= current_col:
            continue
        label = row[0]
        if not label:
            continue
        field_name = lookup(kind, label, sector=sector)
        if field_name is None:
            continue
        value = _parse_tr_number(row[current_col])
        if value is None:
            continue
        scaled = (value * multiplier).quantize(Decimal("1"))
        if (kind, field_name) in _ACCUMULATE_FIELDS and field_name in target:
            target[field_name] += scaled
        else:
            target[field_name] = scaled


def _has_wide_banking_layout(rows: list[list[str]]) -> bool:
    """Banking BS tables usually have exactly 8 columns."""
    widths = [len(r) for r in rows if r]
    if not widths:
        return False
    return max(widths) >= 8


def _has_narrow_banking_layout(rows: list[list[str]]) -> bool:
    """Banking IS/CF tables usually have 6 columns (9M + 3M comparatives)."""
    widths = [len(r) for r in rows if r]
    if not widths:
        return False
    mx = max(widths)
    return 4 <= mx <= 7


def _first_numeric_column(rows: list[list[str]]) -> int | None:
    """In a continuation table we don't have a dated header, so we guess the
    'current period' column heuristically.

    KAP balance-sheet continuations look like:
        [label] [Dipnot Ref] [current-period value] [previous-period value]
    Dipnot Ref holds tiny integers (footnote indexes: 5, 19, ...).
    Data columns hold large amounts (tens of thousands upward). We pick
    the leftmost column whose parsed values are mostly LARGE — tiny
    integers get filtered out.
    """
    if not rows:
        return None
    width = max(len(r) for r in rows)
    LARGE = Decimal("1000")
    for col in range(1, width):
        large_hits = 0
        examined = 0
        for row in rows:
            if len(row) <= col:
                continue
            examined += 1
            v = _parse_tr_number(row[col])
            if v is not None and abs(v) >= LARGE:
                large_hits += 1
        if examined > 0 and large_hits / examined >= 0.3:
            return col
    return None


# ---------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------

@dataclass
class ParsedFinancials:
    period: PeriodFinancials
    flags: list[QualityFlag]
    current_period_end: date | None
    tables_seen: int


def parse_kap_pdf(
    pdf_path: Path | str,
    *,
    source_id: str = "kap",
    sector: Sector | str | None = None,
) -> ParsedFinancials:
    """Extract a PeriodFinancials from a KAP financial-report PDF.

    `sector` selects which label map + column layout applies. When None,
    we auto-detect from the PDF's first-page header. Banks in particular
    need this — their labels and column layout are entirely different.
    """
    if sector is None:
        sector = detect_sector(pdf_path)
    sector_obj: Sector = sector if isinstance(sector, Sector) else Sector(str(sector).lower())
    sector_value: str = sector_obj.value

    tables = extract_tables(pdf_path)
    bag = _Bag()
    current_end: date | None = None

    # Scan every table once to derive a PDF-wide currency multiplier:
    # KAP metadata tables ("Sunum Para Birimi 1.000.000 TL") are separate
    # from the data tables, so a per-data-table detection misses the cue.
    pdf_multiplier = Decimal("1")
    for tbl in tables:
        m = _detect_multiplier(tbl.rows)
        if m > pdf_multiplier:
            pdf_multiplier = m
    # Fallback: if no multiplier found in tables, scan raw page text.
    # Some KAP PDFs embed "Sunum Para Birimi 1.000 TL" in body text
    # rather than in a structured table row.
    if pdf_multiplier == Decimal("1"):
        # Some KAP PDFs have long auditor reports before the financial
        # tables; scan up to 20 pages to find the multiplier cue.
        for page_num in range(1, 21):
            try:
                page_text = extract_page_text(pdf_path, page_num)
                # Only look for units near "Sunum Para Birimi"
                if not _SUNUM_RE.search(page_text):
                    continue
                for pattern, mul in _UNIT_PATTERNS:
                    if pattern.search(page_text):
                        pdf_multiplier = mul
                        break
                if pdf_multiplier > Decimal("1"):
                    break
            except Exception:
                break

    last_kind: str | None = None
    for tbl in tables:
        kind = _classify_table(tbl)
        if kind in _SKIP_KINDS:
            # Clear sticky kind so the following continuation rows don't
            # accidentally land in another statement.
            last_kind = None
            continue
        # Sticky classification — a data table that lacks a header title
        # (continuation of the previous statement across a page break)
        # keeps the last known kind, unless this table is clearly a
        # metadata table (≤3 rows, no dated header).
        if kind is None:
            is_meta_stub = len(tbl.rows) <= 3 and _header_row(tbl.rows) is None
            if not is_meta_stub and last_kind is not None:
                kind = last_kind
        if kind is None:
            continue
        last_kind = kind
        # Capture the earliest valid "current period end" we see
        layout = _detect_columns(tbl.rows)
        if layout and layout.current_period_end and current_end is None:
            current_end = layout.current_period_end
        _absorb_table(bag, tbl, kind, multiplier=pdf_multiplier, sector=sector_value)

    # ---- Build the nested schema objects --------------------------------
    balance_kwargs = _with_fallbacks_for_balance(bag.balance, sector=sector_value)
    try:
        balance = BalanceSheet(**balance_kwargs)
    except Exception as exc:
        bag.flags.append(
            QualityFlag(code="BALANCE_INVALID", severity=Severity.BLOCK, message=str(exc))
        )
        balance = BalanceSheet(
            total_assets=Decimal("0"), total_liabilities=Decimal("0"), total_equity=Decimal("0")
        )

    income_kwargs = _with_fallbacks_for_income(bag.income)
    try:
        income = IncomeStatement(**income_kwargs)
    except Exception as exc:
        bag.flags.append(
            QualityFlag(code="INCOME_INVALID", severity=Severity.BLOCK, message=str(exc))
        )
        income = IncomeStatement(revenue=Decimal("0"), net_income=Decimal("0"))

    cashflow = None
    if bag.cashflow.get("operating_cash_flow") is not None:
        cashflow = CashFlowStatement(**bag.cashflow)

    equity = None
    if bag.equity.get("closing_equity") is not None:
        equity = EquityChange(**bag.equity)

    # Period from current end date
    year, period = _infer_period_from_date(current_end)

    pf = PeriodFinancials(
        period=period,
        year=year,
        currency=Currency.TRY,
        sector=sector_obj,
        balance_sheet=balance,
        income_statement=income,
        cash_flow=cashflow,
        equity_change=equity,
        sources=[SourceRef(
            source_id=source_id,
            url="",
            fetched_at=_now_utc(),
            detail=str(pdf_path),
        )],
    )
    return ParsedFinancials(
        period=pf,
        flags=bag.flags,
        current_period_end=current_end,
        tables_seen=len(tables),
    )


# ---------------------------------------------------------------------
# Helpers for filling required fields with safe defaults
# ---------------------------------------------------------------------

def _with_fallbacks_for_balance(b: dict[str, Decimal], *, sector: str = "industrial") -> dict[str, Decimal]:
    # Required: total_assets, total_liabilities, total_equity
    ta = b.get("total_assets")
    tl = b.get("total_liabilities")
    te = b.get("total_equity")

    # If assets missing but liabilities + equity present → derive (accounting identity)
    if ta is None and tl is not None and te is not None:
        ta = tl + te
    # If equity missing but we have parent_equity + minority → sum
    if te is None and "parent_equity" in b:
        te = b["parent_equity"] + b.get("minority_interest", Decimal("0"))

    # Banking-specific: BDDK reports a balancing total that already INCLUDES
    # equity. We only harvest assets + equity in banking mode; compute pure
    # liabilities here.
    if sector == "banking" and tl is None and ta is not None and te is not None:
        tl = ta - te

    b2 = dict(b)
    b2.setdefault("total_assets", ta if ta is not None else Decimal("0"))
    b2.setdefault("total_liabilities", tl if tl is not None else Decimal("0"))
    b2.setdefault("total_equity", te if te is not None else Decimal("0"))
    return b2


def _with_fallbacks_for_income(i: dict[str, Decimal]) -> dict[str, Decimal]:
    i2 = dict(i)
    i2.setdefault("revenue", Decimal("0"))
    i2.setdefault("net_income", Decimal("0"))
    # Banking: derive net_interest_income if only the two legs were parsed.
    if "interest_income" in i2 and "interest_expense" in i2 and "net_interest_income" not in i2:
        # interest_expense is typically reported negative.
        i2["net_interest_income"] = i2["interest_income"] + i2["interest_expense"]
    return i2


# ---------------------------------------------------------------------
# Period inference from end date
# ---------------------------------------------------------------------

from datetime import datetime, timezone  # noqa: E402

from financex.schemas.base import ReportingPeriod  # noqa: E402


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _infer_period_from_date(d: date | None) -> tuple[int, ReportingPeriod]:
    if d is None:
        return (datetime.now().year, ReportingPeriod.FY)
    year = d.year
    if d.month == 3:
        return year, ReportingPeriod.Q1
    if d.month == 6:
        return year, ReportingPeriod.H1
    if d.month == 9:
        return year, ReportingPeriod.Q3
    if d.month == 12:
        return year, ReportingPeriod.FY
    # Oddly-dated report; default to annual.
    return year, ReportingPeriod.FY
