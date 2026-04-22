---
id: sotp-valuation
name: "SOTP Valuation"
description: "Holding/konglomera icin Sum-of-the-Parts; net asset value, NAV discount."
triggers: ['sotp', 'sum of the parts', 'holding', 'nav', 'discount to nav', 'konglomera']
applies_to_agents: ['valuation_agent', 'sector_competition', 'strategic_synthesis']
category: valuation
priority: high
---

# SOTP (Sum-of-the-Parts) Valuation

## Ne Zaman Kullanılır?
Holding/konglomera yapıda (KCHOL, SAHOL, DOHOL). Segment'lerin biri diğerinden çok farklı economics'e sahip → tek çarpan anlamsız.

## Prosedür
1. **Segment dökümü** — her iştirak/iş birimi ayrı: net income/ebitda/revenue.
2. **Her segment için uygun metod**:
   - Stake'i halka açık → son kapanış × ownership × (1−likidite discount).
   - Stake'i özel → peer EV/EBITDA × segment EBITDA.
   - Finansal iştirak (banka) → P/B × book × share.
3. **Net debt** — holding seviyesi ayrı çek.
4. **NAV** = Σ segment values − holding net debt.
5. **Discount to NAV** — piyasa genelde %25-50 discount ile işlem görür (likidite+governance).

## Kurallar
- Minority stake (<20%) fair value ile, eşitlik metodu ile değil.
- Holding-level giderler (corporate overhead) ayrı satır.
- Cross-holding varsa çifte sayma önlenir.
- Currency mismatch: segment USD earnings × current FX ile convert.

## Örnek
KCHOL (basit model): Koç Fiat 120B + Tofaş 80B + Yapı Kredi %41 × market cap 350B = 143.5B + segmentler toplam ~430B. Net debt 50B. NAV ~380B. %35 discount → hedef 247B.

## Bilinen Tuzaklar
1. Intra-group transaction'lar düşmeden segment EBITDA overstated.
2. Deferred tax liability of parent — NAV'dan düş.
3. Holding employee options vs segment şirketleri.

## Referanslar
- _shared_knowledge_modules/sotp.md
- Holding sektör raporları (Akbank Yatırım, Yapı Kredi Yatırım)
