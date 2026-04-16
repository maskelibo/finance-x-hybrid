#!/usr/bin/env python3
"""
Golden output'lar üzerinde schema validator simülasyonu.
Python'da schema-validator.ts mantığını taklit eder.
"""
from __future__ import annotations
import json, os, re
from pathlib import Path

GOLDEN_DIR = Path(__file__).parent / 'golden'

TEXT_RULES = {
    'financial_analysis': {'min': 5000, 'required': ['ROE', 'EBITDA'], 'warning': ['FCF', 'DSO', 'CCC', 'CAPEX']},
    'valuation_agent': {'min': 3000, 'required': ['DCF', 'WACC'], 'warning': ['Bull', 'Bear', 'Sensitivity']},
    'strategic_synthesis': {'min': 5000, 'required': ['Skor', 'Risk'], 'warning': ['SWOT', 'Boyut']},
    'final_summary': {'min': 5000, 'required': ['Skor'], 'warning': ['Bull', 'Bear']},
    'qa_review': {'min': 500, 'required': ['quality', 'review'], 'warning': []},
    'reconciliation': {'min': 3000, 'required': ['quality'], 'warning': ['score', 'skor', 'puan']},
    'report_formatter': {'min': 1000, 'required': ['html', 'HTML'], 'warning': []},
}

def validate(agent_id, output):
    errors = []
    warnings = []
    rules = TEXT_RULES.get(agent_id)
    if not rules:
        return 'PASS', errors, warnings

    out_lower = output.lower()

    if len(output) < rules['min']:
        errors.append(f"çıktı çok kısa: {len(output)} (min {rules['min']})")

    for kw in rules['required']:
        if kw.lower() not in out_lower:
            errors.append(f"keyword eksik: {kw}")

    for kw in rules.get('warning', []):
        if kw.lower() not in out_lower:
            warnings.append(f"beklenen keyword eksik: {kw}")

    if output.strip() == '':
        errors.append("çıktı boş")

    if output.startswith('[DEGRADED]'):
        errors.append("DEGRADED")

    status = 'FAIL' if errors else ('WARN' if warnings else 'PASS')
    return status, errors, warnings

# Test all golden outputs
print(f"{'Ticker':<8} {'Agent':<24} {'Status':<6} {'Len':>6} {'Errors':<40} {'Warnings'}")
print('-' * 120)

total = 0
fails = 0
warns = 0

for f in sorted(GOLDEN_DIR.glob('*_*.txt')):
    name = f.stem
    parts = name.split('_', 1)
    if len(parts) != 2:
        continue
    ticker = parts[0]
    agent_id = parts[1]

    if agent_id not in TEXT_RULES:
        continue

    output = f.read_text()
    status, errors, warnings_list = validate(agent_id, output)

    total += 1
    if status == 'FAIL': fails += 1
    if status == 'WARN': warns += 1

    err_str = '; '.join(errors)[:40] if errors else '-'
    warn_str = '; '.join(warnings_list)[:40] if warnings_list else '-'

    print(f"{ticker:<8} {agent_id:<24} {status:<6} {len(output):>6} {err_str:<40} {warn_str}")

print('-' * 120)
print(f"Total: {total} | PASS: {total-fails-warns} | WARN: {warns} | FAIL: {fails}")
print(f"False positive rate (FAIL on known-good output): {fails}/{total} = {fails/total*100:.0f}%")
