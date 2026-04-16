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
}


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
    "odenen temettuler": "dividends_paid",
    "amortisman ve itfa giderleri": "depreciation_amortization",
    "amortisman gideri": "depreciation_amortization",
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


def lookup(table_kind: str, label: str) -> str | None:
    """Find the canonical field for a label within a statement kind.

    table_kind ∈ {'balance_sheet', 'income_statement', 'cash_flow', 'equity_change'}
    """
    table = {
        "balance_sheet": BALANCE_SHEET_MAP,
        "income_statement": INCOME_STATEMENT_MAP,
        "cash_flow": CASH_FLOW_MAP,
        "equity_change": EQUITY_CHANGE_MAP,
    }.get(table_kind)
    if not table:
        return None
    key = normalize_label(label)
    if key in table:
        return table[key]
    # Fuzzy: try prefix match on the first 25 chars (KAP sometimes adds trailing detail)
    for known in table:
        if key.startswith(known) or known.startswith(key):
            return table[known]
    return None
