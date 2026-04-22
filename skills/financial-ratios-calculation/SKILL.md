---
id: financial-ratios-calculation
name: "28 Mandatory Metric Formulas"
description: "DSO/DIO/DPO/CCC/NWC/ROE/ROCE/ROIC/FCF... 28 Chairman zorunlu metrik formul rehberi."
triggers: ['28 metric', 'ratio', 'dso', 'dio', 'dpo', 'ccc', 'roe', 'roce', 'roic', 'fcf', 'nwc', 'capex/ebitda']
applies_to_agents: ['financial_analysis', 'reconciliation']
category: financial_analysis
priority: critical
---

# 28 Mandatory Metric Formulas

## Ne Zaman Kullanılır?
financial_analysis agent 28 Chairman-zorunlu metrik raporu üretirken. Metrik eksikse report_formatter banner'ı uyarı verir.

## Prosedür
| Metrik | Formül |
|---|---|
| DSO | Alacak / (Satış/365) |
| DIO | Stok / (COGS/365) |
| DPO | Borç / (COGS/365) |
| CCC | DSO + DIO − DPO |
| NWC/Revenue | (Alacak+Stok−Borç) / Satış |
| Net Borç/EBITDA | (Kredi−Nakit) / EBITDA |
| Faiz Karşılama | EBITDA / Faiz Gideri |
| Cari Oran | Dönen Varlık / KVY |
| Asit-Test | (Dönen−Stok) / KVY |
| ROE | Net Kar / Ortalama Özsermaye |
| ROCE | NOPAT / (Toplam Varlık − KVY) |
| ROIC | NOPAT / Yatırılan Sermaye |
| FCF | OCF − CAPEX |
| CAPEX/EBITDA | CAPEX / EBITDA |
| OCF/EBITDA | OCF / EBITDA |

## Kurallar
- Avg özsermaye = (BOP+EOP)/2, period-end değil.
- NOPAT = EBIT × (1 − efektif vergi oranı).
- 28 metrikten eksik olan varsa `[VERİ YOK]` etiketi + confidence=blocked.
- Her metriğin yorumu zorunlu (sadece rakam yazmak yasak — Chairman direktifi).

## Örnek
THYAO FY2025: EBITDA 184.8 bn, Net Debt 677 bn, Net Debt/EBITDA = 3.67x (havacılıkta yüksek sınır).

## Bilinen Tuzaklar
1. Banka için ROIC/ROCE alternative (risk-weighted).
2. Holding için segment bazlı ROIC daha anlamlı.
3. CCC negative olabilir (retail model — ödeme > alım hızlı).

## Referanslar
- canonical/rules/mandatory_metrics.yaml
- _shared_knowledge_modules/ratios.md
