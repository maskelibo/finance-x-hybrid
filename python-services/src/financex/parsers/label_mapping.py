"""Turkish IFRS label → canonical English field name.

KAP-published financial statements use a consistent Turkish vocabulary
defined by the Capital Markets Board taxonomy. This map covers the
fields our schemas (BalanceSheet / IncomeStatement / CashFlowStatement
/ EquityChange) care about. Unmapped rows are not an error — they're
surfaced via QualityControl.missing_fields so the LLM layer can see
what stayed on the floor.
"""

from __future__ import annotations

import re
import unicodedata


_TR_FOLD = str.maketrans({"ı": "i", "ş": "s", "ğ": "g", "ç": "c", "ü": "u", "ö": "o"})


def normalize_label(text: str) -> str:
    """Fold Turkish → ASCII, lowercase, strip punctuation, collapse whitespace.

    NFKD alone is not enough: `ı`, `ş`, `ğ`, `ç` are stand-alone Unicode
    letters (no combining diacritic), so NFKD leaves them untouched. We
    apply an explicit Turkish → ASCII fold before stripping combining
    marks (which handles `ü`, `ö` from NFKD).
    """
    t = text.replace("İ", "i").replace("I", "ı").lower()
    t = t.translate(_TR_FOLD)
    # Strip any residual combining marks (defensive — ü/ö already folded above).
    t = "".join(c for c in unicodedata.normalize("NFKD", t) if not unicodedata.combining(c))
    t = re.sub(r"[().\-:;,/]+", " ", t)
    t = re.sub(r"\s+", " ", t).strip()
    return t


# --- Balance Sheet -----------------------------------------------------

BALANCE_SHEET_MAP: dict[str, str | None] = {
    # Totals — accept KAP's 'toplam' variants as well as the base word.
    "toplam varliklar": "total_assets",
    "toplam kaynaklar": "total_assets",
    "toplam yukumlulukler": "total_liabilities",
    "toplam ozkaynaklar": "total_equity",

    # Current assets (both 'TOPLAM DÖNEN VARLIKLAR' and the section header)
    "donen varliklar": "current_assets",
    "toplam donen varliklar": "current_assets",
    "nakit ve nakit benzerleri": "cash_and_equivalents",
    "ticari alacaklar": "trade_receivables",
    "stoklar": "inventories",

    # Non-current assets
    "duran varliklar": "non_current_assets",
    "toplam duran varliklar": "non_current_assets",
    "maddi duran varliklar": "ppe_net",
    "maddi olmayan duran varliklar": "intangibles",
    "serefiye": "goodwill",
    "yatirimlar": "investments",

    # Current liabilities
    "kisa vadeli yukumlulukler": "current_liabilities",
    "toplam kisa vadeli yukumlulukler": "current_liabilities",
    "kisa vadeli borclanmalar": "short_term_debt",
    "ticari borclar": "trade_payables",

    # Non-current liabilities
    "uzun vadeli yukumlulukler": "non_current_liabilities",
    "toplam uzun vadeli yukumlulukler": "non_current_liabilities",
    "uzun vadeli borclanmalar": "long_term_debt",

    # Equity
    "odenmis sermaye": None,  # informational
    "ana ortakliga ait ozkaynaklar": "parent_equity",
    "kontrol gucu olmayan paylar": "minority_interest",
}


# --- Income Statement --------------------------------------------------

INCOME_STATEMENT_MAP: dict[str, str] = {
    "hasilat": "revenue",
    "toplam hasilat": "revenue",  # KAP's preferred — segments sum here
    "satis gelirleri": "revenue",
    "satislarin maliyeti": "cost_of_sales",
    "brut kar": "gross_profit",
    "brut kar zarar": "gross_profit",
    "faaliyet kari": "operating_income",
    "esas faaliyet kari zarari": "operating_income",
    "vergi oncesi kar": "pretax_income",
    "surdurulen faaliyetler vergi oncesi kar zarari": "pretax_income",
    "donem kari zarari": "net_income",
    "donem kari": "net_income",
    "net donem kari": "net_income",
    "ana ortakliga ait donem kari zarari": "parent_net_income",
    "kontrol gucu olmayan paylar kari": "minority_net_income",
    "net parasal pozisyon kazanc kaybi": "monetary_gain_loss",
    "parasal kazanc kayip": "monetary_gain_loss",
    # Finansman gelir/giderleri — EBITDA ve interest coverage hesabı için kritik
    "finansman gelirleri": "financial_income",
    "finansman giderleri": "financial_expense",
    "finansman gelir gideri": "financial_expense",
    "faiz gelirleri": "interest_income",
    "faiz giderleri": "interest_expense",
    "faiz geliri": "interest_income",
    "faiz gideri": "interest_expense",
    # Vergi
    "vergi gideri geliri": "tax_expense",
    "surdurulen faaliyetler vergi gideri geliri": "tax_expense",
    "donem vergi gideri geliri": "tax_expense",
    "ertelenmis vergi gideri geliri": "tax_expense",
    # Amortisman (nadiren gelir tablosunda ayrı gösterilir)
    "amortisman ve itfa giderleri": "depreciation_amortization",
    "amortisman giderleri": "depreciation_amortization",
    # OpEx
    "genel yonetim giderleri": "opex",
    "pazarlama giderleri": "opex",
    "arastirma gelistirme giderleri": "opex",
}


# ---------------------------------------------------------------------
# BANKING — BDDK format overlay
# ---------------------------------------------------------------------

INCOME_STATEMENT_MAP_BANKING: dict[str, str] = {
    "faiz gelirleri": "interest_income",
    "faiz giderleri": "interest_expense",
    "net faiz geliri": "net_interest_income",
    "net faiz geliri gideri": "net_interest_income",
    # Fees
    "ucret ve komisyon gelirleri": "fee_and_commission_income",
    "ucret ve komisyon giderleri": "fee_and_commission_expense",
    "net ucret ve komisyon gelirleri": "net_fee_and_commission_income",
    "komisyon gelirleri": "fee_and_commission_income",
    # Trading
    "alim satim karlari zararlari net": "trading_income",
    "ticari kar zarar net": "trading_income",
    "sermaye piyasasi islemleri karlari net": "trading_income",
    # FX
    "kambiyo islemleri karlari zararlari net": "fx_income",
    # Loan losses
    "beklenen zarar karsiliklari": "loan_loss_provisions",
    "kredi ve diger alacaklar degisim karsiligi": "loan_loss_provisions",
    "karsilik giderleri": "loan_loss_provisions",
    # Operating costs
    "personel giderleri": "bank_operating_expenses",  # approximation
    "diger faaliyet giderleri": "bank_operating_expenses",
    # Net income
    "donem net kari veya zarari": "net_income",
    "grubun kari zarari": "net_income",
}


BALANCE_SHEET_MAP_BANKING: dict[str, str | None] = {
    # Banks under BDDK use DIFFERENT label conventions than industrials.
    # The totals in particular:
    #   "VARLIKLAR TOPLAMI"       (= total_assets;    NOT 'Toplam Aktifler')
    #   "YÜKÜMLÜLÜKLER TOPLAMI"   (= total_liabilities)
    #   "ÖZKAYNAKLAR"             (= total_equity — also used as section header
    #                              but in banking IS the aggregate)
    "varliklar toplami": "total_assets",
    "aktif toplami": "total_assets",
    "toplam aktifler": "total_assets",
    # NOTE on banking BS: BDDK's "YÜKÜMLÜLÜKLER TOPLAMI" / "PASİF TOPLAMI"
    # is the balancing side of the balance sheet — it INCLUDES equity.
    # We do NOT map it to total_liabilities here; we derive pure liabilities
    # in _with_fallbacks_for_balance as (balancing_side − equity).
    "ozkaynaklar": "total_equity",
    "toplam ozkaynaklar": "total_equity",
    # Asset-side bank-specific lines
    "nakit degerler ve merkez bankasi": "cash_and_equivalents",
    "nakit ve nakit benzerleri": "cash_and_equivalents",
    # Footnote-reference columns surface as informational only
    "odenmis sermaye": None,
}


# ---------------------------------------------------------------------
# HOLDING overlay — adds financial-segment stream on top of standard
# ---------------------------------------------------------------------

INCOME_STATEMENT_MAP_HOLDING: dict[str, str] = {
    "finans sektoru faaliyetleri hasilati": "financial_segment_revenue",
    "finans sektoru faaliyetleri maliyeti": "financial_segment_cost",
}


# ---------------------------------------------------------------------
# Getters — sector-aware merged maps
# ---------------------------------------------------------------------

def get_income_statement_map(sector: str = "industrial") -> dict[str, str]:
    """Return the merged label → field map for a sector.

    Precedence: sector overlay wins over standard. Banking fully overrides
    the standard P&L since a bank has no `revenue`/`cost_of_sales`/`gross_profit`.
    """
    sector = (sector or "industrial").lower()
    if sector == "banking":
        # Banks: banking overlay is the whole map (no revenue/CoGS).
        merged = {**INCOME_STATEMENT_MAP_BANKING}
        return merged
    if sector == "holding":
        merged = dict(INCOME_STATEMENT_MAP)
        merged.update(INCOME_STATEMENT_MAP_HOLDING)
        return merged
    return dict(INCOME_STATEMENT_MAP)


def get_balance_sheet_map(sector: str = "industrial") -> dict[str, str | None]:
    sector = (sector or "industrial").lower()
    if sector == "banking":
        # Bank BS is mostly shared labels, but swap a few banking-specific ones.
        merged = dict(BALANCE_SHEET_MAP)
        merged.update(BALANCE_SHEET_MAP_BANKING)
        return merged
    return dict(BALANCE_SHEET_MAP)


# --- Cash Flow ---------------------------------------------------------

CASH_FLOW_MAP: dict[str, str] = {
    "isletme faaliyetlerinden nakit akislari": "operating_cash_flow",
    "yatirim faaliyetlerinden nakit akislari": "investing_cash_flow",
    "finansman faaliyetlerinden nakit akislari": "financing_cash_flow",
    "yatirim faaliyetlerinde kullanilan nakit akislari": "investing_cash_flow",
    "finansman faaliyetlerinde kullanilan nakit akislari": "financing_cash_flow",
    "nakit ve nakit benzerlerindeki net degisim": "net_change_in_cash",
    "maddi ve maddi olmayan duran varlik alimlari": "capex",
    "maddi duran varlik alimlari": "capex",
    "maddi olmayan duran varlik alimlari": "capex",
    "yatirim harcamalari": "capex",
    "sabit kiymek yatirimlari": "capex",
    "duran varlik alimlari": "capex",
    "maddi ve maddi olmayan duran varliklarin alimi": "capex",
    "maddi duran varliklarin alimi icin odenen nakit": "capex",
    "odenen temettuler": "dividends_paid",
    "odenen temettüler": "dividends_paid",
    "kar payi odemeleri": "dividends_paid",
    "amortisman ve itfa giderleri": "depreciation_amortization",
    "amortisman gideri": "depreciation_amortization",
    "amortisman ve itfa paylar": "depreciation_amortization",
    "amortisman": "depreciation_amortization",
    "itfa paylar": "depreciation_amortization",
    "maddi ve maddi olmayan duran varlik amortismani": "depreciation_amortization",
    "amortismanlar": "depreciation_amortization",
    "amortisman ve itfa gideri ile ilgili duzeltmeler": "depreciation_amortization",
    "amortisman ve itfa giderleri ile ilgili duzeltmeler": "depreciation_amortization",
    "amortisman ve itfa ile ilgili duzeltmeler": "depreciation_amortization",
    "amortismana iliskin duzeltmeler": "depreciation_amortization",
    "yabanci para cevrim farklarinin etkisi": "fx_impact",
    "kur farki etkisi": "fx_impact",
}


# --- Equity Change -----------------------------------------------------

EQUITY_CHANGE_MAP: dict[str, str] = {
    "donem basi bakiye": "opening_equity",
    "donem sonu bakiye": "closing_equity",
    "odenen temettu": "dividends_distributed",
    "sermaye artirimi": "capital_increase",
    "diger kapsamli gelir": "other_comprehensive_income",
}


def lookup(table_kind: str, label: str, sector: str = "industrial") -> str | None:
    """Find the canonical field for a label within a statement kind.

    table_kind ∈ {'balance_sheet', 'income_statement', 'cash_flow', 'equity_change'}
    sector ∈ {'industrial', 'holding', 'banking', 'insurance', ...}
    """
    if table_kind == "balance_sheet":
        table: dict[str, str | None] = get_balance_sheet_map(sector)
    elif table_kind == "income_statement":
        table = get_income_statement_map(sector)
    elif table_kind == "cash_flow":
        table = CASH_FLOW_MAP
    elif table_kind == "equity_change":
        table = EQUITY_CHANGE_MAP
    else:
        return None

    key = normalize_label(label)
    if key in table:
        return table[key]
    # Fuzzy: try prefix match (KAP sometimes adds trailing detail)
    for known in table:
        if key.startswith(known) or known.startswith(key):
            return table[known]
    return None
