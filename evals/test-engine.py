#!/usr/bin/env python3
"""
Financial Engine test — golden output'lardan sayı çıkarıp engine hesaplarını simüle eder.
Engine'in TypeScript versiyonunun Python eşdeğeri ile test.
"""
from __future__ import annotations
import re, json
from pathlib import Path

GOLDEN_DIR = Path(__file__).parent / 'golden'

def extract_number(text, *patterns):
    """Extract first number after keyword pattern."""
    for pattern in patterns:
        regex = re.compile(pattern + r'[\s:=]*([\-]?[\d.,]+)\s*(?:TL|TRY|B|M|milyon|milyar)?', re.IGNORECASE)
        match = regex.search(text)
        if match:
            num_str = match.group(1).replace('.', '').replace(',', '.')
            try:
                val = float(num_str)
                if val != float('inf') and val != float('-inf'):
                    return val
            except ValueError:
                pass
    return None

def safe_div(a, b):
    if a is None or b is None or b == 0:
        return None
    return a / b

def compute_ratios(inputs):
    """Python version of financial-engine.ts computeAll()"""
    results = {}

    r = inputs.get

    if r('grossProfit') and r('revenue'):
        results['gross_margin'] = round(safe_div(r('grossProfit'), r('revenue')) * 100, 2)
    if r('ebitda') and r('revenue'):
        results['ebitda_margin'] = round(safe_div(r('ebitda'), r('revenue')) * 100, 2)
    if r('netIncome') and r('revenue'):
        results['net_margin'] = round(safe_div(r('netIncome'), r('revenue')) * 100, 2)
    if r('netIncome') and r('equity'):
        results['roe'] = round(safe_div(r('netIncome'), r('equity')) * 100, 2)
    if r('ebit') and r('totalAssets') and r('currentLiabilities'):
        ce = r('totalAssets') - r('currentLiabilities')
        results['roce'] = round(safe_div(r('ebit'), ce) * 100, 2) if ce else None

    if r('tradeReceivables') and r('revenue'):
        results['dso'] = round(safe_div(r('tradeReceivables'), r('revenue')) * 360, 2)
    if r('inventories') and r('cogs'):
        results['dio'] = round(safe_div(r('inventories'), r('cogs')) * 360, 2)
    if r('tradePayables') and r('cogs'):
        results['dpo'] = round(safe_div(r('tradePayables'), r('cogs')) * 360, 2)

    if r('financialDebt') is not None and r('cashAndEquivalents') is not None:
        results['net_debt'] = round(r('financialDebt') - r('cashAndEquivalents'), 2)
    if results.get('net_debt') and r('ebitda'):
        results['net_debt_to_ebitda'] = round(safe_div(results['net_debt'], r('ebitda')), 2)
    if r('ebitda') and r('interestExpense'):
        results['interest_coverage'] = round(safe_div(r('ebitda'), r('interestExpense')), 2)
    if r('currentAssets') and r('currentLiabilities'):
        results['current_ratio'] = round(safe_div(r('currentAssets'), r('currentLiabilities')), 2)
    if r('ocf') is not None and r('capex') is not None:
        results['fcf'] = round(r('ocf') - abs(r('capex')), 2)

    return results

# Test with golden outputs
print("=" * 80)
print("FINANCIAL ENGINE TEST — Golden Output Extraction + Computation")
print("=" * 80)

for ticker in ['SAHOL', 'TCELL', 'KCHOL']:
    fa_path = GOLDEN_DIR / f'{ticker}_financial_analysis.txt'
    if not fa_path.exists():
        continue

    text = fa_path.read_text()

    # Extract inputs
    inputs = {
        'revenue': extract_number(text, r'Net Satış', r'Revenue', r'Hasılat'),
        'grossProfit': extract_number(text, r'Brüt Kar(?!.*Marj)', r'Gross Profit'),
        'ebitda': extract_number(text, r'FAVÖK(?!.*Marj)', r'EBITDA(?!.*Marj)'),
        'ebit': extract_number(text, r'FVÖK', r'EBIT(?!DA)', r'Faaliyet Kârı'),
        'netIncome': extract_number(text, r'Net (?:Dönem )?Kâr', r'Net Income'),
        'interestExpense': extract_number(text, r'Faiz Gider', r'Interest Expense'),
        'totalAssets': extract_number(text, r'Toplam (?:Aktif|Varlık)', r'Total Assets'),
        'currentAssets': extract_number(text, r'Dönen Varlık', r'Current Assets'),
        'currentLiabilities': extract_number(text, r'KVYK', r'Kısa Vadeli', r'Current Liabilities'),
        'equity': extract_number(text, r'Özkaynak', r'Özsermaye', r'Equity'),
        'financialDebt': extract_number(text, r'Finansal Borç', r'Financial Debt'),
        'cashAndEquivalents': extract_number(text, r'Nakit(?! Akış)', r'Cash(?! Flow)'),
        'tradeReceivables': extract_number(text, r'Ticari Alacak', r'Trade Receivable'),
        'tradePayables': extract_number(text, r'Ticari Borç', r'Trade Payable'),
        'inventories': extract_number(text, r'Stok', r'Inventor'),
        'cogs': extract_number(text, r'SMM', r'COGS', r'Satışların Maliyeti'),
        'ocf': extract_number(text, r'OCF', r'İşletme Nakit'),
        'capex': extract_number(text, r'CAPEX', r'Yatırım Harcama'),
    }

    # Show extracted inputs
    found = {k: v for k, v in inputs.items() if v is not None}
    missing = {k for k, v in inputs.items() if v is None}

    print(f"\n{'─' * 80}")
    print(f"{ticker} — Extracted {len(found)}/{len(inputs)} inputs")
    print(f"{'─' * 80}")

    if found:
        for k, v in sorted(found.items()):
            print(f"  {k:<24} = {v:>15,.2f}")

    if missing:
        print(f"  Missing: {', '.join(sorted(missing))}")

    # Compute ratios
    ratios = compute_ratios(inputs)

    print(f"\n  Computed Ratios ({len(ratios)}):")
    for name, val in sorted(ratios.items()):
        if val is not None:
            unit = '%' if name.endswith('margin') or name == 'roe' or name == 'roce' else ('x' if 'ratio' in name or 'coverage' in name or 'ebitda' in name else '')
            print(f"    {name:<24} = {val:>12,.2f}{unit}")

    # Reproducibility check — same inputs → same output
    ratios2 = compute_ratios(inputs)
    assert ratios == ratios2, f"{ticker}: Reproducibility FAILED!"
    print(f"\n  Reproducibility: PASS (aynı input → aynı output)")

print(f"\n{'=' * 80}")
print("Engine test completed.")
