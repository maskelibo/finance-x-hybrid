---
id: goldman-report-structure
name: "Goldman 12-Section Report"
description: "12 bolumlu Yonetim Kurulu raporu sablonu; metin-gorsel sandvic kurali."
triggers: ['12 bolum', 'yonetim kurulu raporu', 'goldman template', 'executive report', 'chairman brief']
applies_to_agents: ['report_formatter', 'final_summary', 'strategic_synthesis']
category: report_format
priority: high
---

# Goldman 12-Section Report

## Ne Zaman Kullanılır?
report_formatter final HTML/PDF üretirken. final_summary rapor iskeletini hazırlarken. 12 sabit bölüm standart template.

## Prosedür
1. Executive Summary (1 sayfa)
2. Investment Thesis
3. Valuation (DCF + multiples + target price)
4. Financial Analysis (28 metrik, trend, YoY)
5. Sector & Competitive Position
6. Macro Context (Turkey + global)
7. Key Risks & Mitigants
8. ESG & Governance
9. Technical Analysis (chart + indicators)
10. Event Timeline & Catalysts
11. Scenario Analysis (Bear/Base/Bull)
12. Appendix (metodoloji, kaynaklar)

## Kurallar
- **Metin sandviç**: her tablo/grafik öncesi 2 cümle, sonrası 3-5 cümle yorum.
- Chart.js YASAK — SVG deterministic (svg_charts.ts).
- Her sayı `[KAYNAK: doc_id]` veya `[VERİ YOK]`.
- Brand identity CSS theme preset (institutional/anthropic/minimal).
- HTML validation: 12 section başlık, 4+ SVG, 60-120KB range.

## Örnek
THYAO rapor: §1 Executive 850 chars, §4 Financial Analysis 28 metrics table + 4 chart, §11 Scenario 3 fiyat range 247-325 TL.

## Bilinen Tuzaklar
1. Section 2 + section 11 birbirini tekrar eder → thesis-scenario bağı açık.
2. Section 8 ESG eksik rapor tesliminde common fail (data gap).
3. CEO delivery check (COO) 4 kriterde bakar: format ok, 12 section present, metin-görsel balance, marka identity applied.

## Referanslar
- backend/src/python/report_formatter/template.html (canonical)
