---
id: piotroski-f-score
name: "Piotroski F-Score"
description: "Quality score 9 binary criterion: profitability, leverage, operating efficiency."
triggers: ['piotroski', 'f-score', 'quality score', 'kalite skoru']
applies_to_agents: ['financial_analysis']
category: financial_analysis
priority: medium
---

# Piotroski F-Score

## Ne Zaman Kullanılır?
Fundamental quality screening. 9 binary criterion, toplam 0-9. F ≥ 7: yüksek kaliteli (value screener). F ≤ 3: zayıf.

## Prosedür
9 kriter (1 puan her biri):
1. Positive net income
2. Positive OCF
3. OCF > Net income (quality)
4. ROA improved YoY
5. Long-term debt ratio improved (azalmış)
6. Current ratio improved
7. No share issuance (dilution yok)
8. Gross margin improved YoY
9. Asset turnover improved YoY

## Kurallar
- YoY improvement = strict greater-than (eşit değil).
- New IPO'lar için kriter 7 n/a — 8 skor üzerinden değerlendir.
- Banking hariç — financial sector farklı metrics.

## Örnek
EREGL 2025: NI+ ✓, OCF+ ✓, OCF>NI ✗ (NI büyük), ROA↑ ✓, LTD↓ ✓, CR↓ ✗, dilution ✓ (no issuance), GM↑ ✗, asset turnover↑ ✓ → F=6/9.

## Bilinen Tuzaklar
1. Restated prior year — improvement false positive olabilir.
2. Asset sales (divestiture) → asset turnover yapay iyileşir.
3. Emerging market inflation YoY comparison bozar (IAS 29 restated kullan).

## Referanslar
- Piotroski (2000) "Value Investing: The Use of Historical Financial Statement Information"
