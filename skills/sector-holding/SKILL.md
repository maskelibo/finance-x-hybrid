---
id: sector-holding
name: "Sector Playbook — Holding"
description: "Holding: NAV, SOTP, discount to NAV, segment reporting, ittifak kumemizasyon."
triggers: ['holding', 'kchol', 'sahol', 'dohol', 'enkai', 'nav', 'sotp', 'discount', 'segment']
applies_to_agents: ['financial_analysis', 'sector_competition', 'valuation_agent', 'strategic_synthesis']
category: sector
priority: high
---

# Sector Playbook — Holding

## Ne Zaman Kullanılır?
Holding/konglomera analizi (KCHOL, SAHOL, DOHOL, ENKAI, TKFEN). NAV, SOTP discount, segment reporting.

## Prosedür
1. Segment-level P&L — otomotiv, enerji, finans, gıda ayrı dökümü.
2. NAV = Σ (stake × market/fair value) − holding net debt − deferred tax.
3. Discount-to-NAV tarihsel ortalama (KCHOL %30, SAHOL %40).
4. Holding-level corporate overhead ayrı gider.

## Kurallar
- Her segment için uygun metrik kullan: banka NIM, otomotiv SSSG, çelik CUF.
- Cross-listed iştirak → discount veya premium'a göre fair value revize.
- Minority stake <%20 fair value with observable price.
- Private asset (unlisted) peer EV/EBITDA × segment EBITDA.

## Örnek
KCHOL FY2025: NAV ~430B TL (otomotiv 180B + finans 150B + enerji 50B + tüketim 40B + diğer 10B), net holding debt 30B. Fair = 400B. Market cap 260B → %35 discount.

## Bilinen Tuzaklar
1. Double-counting: segment EBITDA'da intra-group transactions düşmediyse overstated.
2. Deferred tax reserve — NAV'dan çık.
3. Segment revenue vs consolidated revenue — elimination farkı.
4. SPV/offshore segment visibility düşük.

## Referanslar
- Yapı Kredi Yatırım holding research
- Akbank AŞ holding desk notlar
