---
id: sector-banking
name: "Sector Playbook — Banking"
description: "Banka: NIM, CET1, cost of risk, BDDK coklu metrik, BASEL; NPL ratio trend."
triggers: ['banking', 'banka', 'akbnk', 'garan', 'ykbnk', 'isctr', 'halkb', 'vakbn', 'nim', 'cet1', 'bddk', 'basel', 'npl']
applies_to_agents: ['financial_analysis', 'sector_competition', 'context_extraction']
category: sector
priority: high
---

# Sector Playbook — Banking

## Ne Zaman Kullanılır?
Türk bankası analizi (AKBNK, GARAN, ISCTR, YKBNK, HALKB, VAKBN). NIM, CET1, NPL, BDDK mevzuat, Basel III.

## Prosedür
Anahtar metrikler:
- **NIM** (Net Interest Margin) = (faiz geliri − faiz gideri) / ort. faiz getiren varlıklar.
- **CET1** — Common Equity Tier 1 ratio, Basel III minimum %8 (BDDK %8.5 buffer).
- **Cost of Risk** = karşılık / ort. krediler — stage 2-3 kredi oranı.
- **NPL ratio** = non-performing / total loans.
- **Fee/income ratio** — komisyon/ücret geliri çeşitlendirme.
- **C/I (cost-to-income)** — operasyonel verimlilik.

## Kurallar
- Banka için EBITDA anlamsız — net faiz marjı + net kar odaklı.
- ROE benchmark: GYO'lu dönem %40+, düşük GYO %15-20.
- CET1 < %10 → BDDK uyarı; dividend restriction.
- BRSA stres testi (CKO ≥ %0.30) önemli.

## Örnek
AKBNK FY2025: NIM %5.8, CET1 %15.2, NPL %2.1, cost of risk 180bps, ROE %32, fee/income %28.

## Bilinen Tuzaklar
1. Fatura muhasebesi vs gerçek nakit — provisyon gelir/gider netleştirmesi.
2. FX-indexed loan → TRY depreciation'da NPL artar.
3. Hazine destekli krediler (KGF) ayrı risk profili.
4. State banks (HALKB/VAKBN) government-driven growth.

## Referanslar
- BDDK Bankacılık Sektörü Bülteni (aylık)
- Basel III capital framework
