---
id: dcf-valuation
name: "DCF Valuation"
description: "WACC, terminal value, scenario analysis; 5-yillik projeksiyon + sensitivity table."
triggers: ['dcf', 'discounted cash flow', 'wacc', 'terminal value', 'intrinsic value', 'dfa']
applies_to_agents: ['valuation_agent', 'strategic_synthesis']
category: valuation
priority: critical
---

# DCF Valuation

## Ne Zaman Kullanılır?
valuation_agent intrinsic value hesaplarken. Şirket istikrarlı FCF, predictible growth varsa. Banking için alternative DDM kullan.

## Prosedür
1. **5-yıl FCF projeksiyonu** — revenue growth × operating margin × (1−tax) − CAPEX − ∆NWC.
2. **WACC** = Equity_ratio × Ke + Debt_ratio × Kd × (1−tax).
   - Ke = Rf + β × ERP (Türkiye ERP ~11-14%, Rf Turkish 10Y ~37-40%).
3. **Terminal value** = FCF_year5 × (1+g) / (WACC−g). g = LT GDP growth ~2-3% real.
4. **Enterprise Value** = Σ PV(FCF) + PV(TV).
5. **Equity Value** = EV − Net Debt.
6. **Per-share** = Equity / Shares outstanding.

## Kurallar
- Bear/Base/Bull senaryo zorunlu — tek nokta tahmini kabul edilmez.
- Sensitivity tablosu: WACC ±200bp × g ±100bp matris.
- Turkish companies: USD DCF tercih (TRY volatility) veya TRY DCF with CPI-adjusted g.
- Terminal value EV'nin %60'ını geçerse mantıklılık testi gerekli.

## Örnek
THYAO: FCF_2025 105.7B TL, growth ort 8%, WACC %24 (local), g=%3 → EV ~580B, Equity ~395B, fair PS ~286 TL (spot 323 → %11 discount).

## Bilinen Tuzaklar
1. Negative FCF yıllar — ortalama alma, DCF için kapsayıcı projection.
2. CAPEX lumpy ise (havacılık fleet purchase) average-out.
3. Working capital dönüşüm sürekli değilse run-rate normalleştir.

## Referanslar
- Damodaran country risk premium
- _shared_knowledge_modules/dcf.md
