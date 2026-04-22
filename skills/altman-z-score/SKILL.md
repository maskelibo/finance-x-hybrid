---
id: altman-z-score
name: "Altman Z-Score"
description: "Bankruptcy risk scoring: Z = 1.2A + 1.4B + 3.3C + 0.6D + 1.0E (public manufacturing)."
triggers: ['altman', 'z-score', 'bankruptcy risk', 'iflas riski', 'distress']
applies_to_agents: ['financial_analysis', 'valuation_agent']
category: financial_analysis
priority: medium
---

# Altman Z-Score

## Ne Zaman Kullanılır?
Bankrupty risk scoring. Manufacturing + halka açık şirketler için klasik formül. Özel/hizmet/finansal için varyant formüller.

## Prosedür
Z = 1.2·A + 1.4·B + 3.3·C + 0.6·D + 1.0·E, burada:
- A = (Current Assets − Current Liabilities) / Total Assets
- B = Retained Earnings / Total Assets
- C = EBIT / Total Assets
- D = Market Cap / Total Liabilities
- E = Revenue / Total Assets

## Kurallar
- Z > 2.99: safe zone
- 1.81 < Z < 2.99: grey zone
- Z < 1.81: distress zone
- **Emerging markets discount** — Türkiye için threshold 0.5 puan daha düşük alın.
- Bankalar için Altman anlamsız; bunun yerine Altman Z" (private/non-manufacturing).

## Örnek
EREGL 2025: A=0.12, B=0.28, C=0.08, D=1.2, E=0.45 → Z = 1.2×0.12 + 1.4×0.28 + 3.3×0.08 + 0.6×1.2 + 1.0×0.45 = 1.986 (grey zone).

## Bilinen Tuzaklar
1. Market cap D'yi etkiler — bear market'te Z düşer false-distress.
2. Retained earnings negatif olabilir (yeniden yapılanma) — Z anlamsız.
3. Türkçe raporlarda "Dağıtılmamış Kârlar" = Retained Earnings.

## Referanslar
- Altman (1968) Original paper
- _shared_knowledge_modules/altman.md
