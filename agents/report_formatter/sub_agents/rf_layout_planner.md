# RF Layout Planner — Deterministic Sub-Agent

Python module: `financex.subagents.rf_layout_planner`.

## Input

```json
{ "ticker": "EREGL", "sector": "industrial", "runtime_mode": "standard_institutional" }
```

## Output

```json
{
  "ticker": "EREGL",
  "sections": [
    { "id": "cover", "title": "Kapak", "order": 0 },
    { "id": "toc", "title": "İçindekiler", "order": 1 },
    { "id": "executive_summary", "title": "Yönetici Özeti", "order": 2 },
    { "id": "company_profile", "title": "Şirket Tanıtımı", "order": 3 },
    { "id": "financial_performance", "title": "Finansal Performans", "order": 4 },
    { "id": "sector_competition", "title": "Sektör ve Rekabet", "order": 5 },
    { "id": "macro_outlook", "title": "Makro Görünüm", "order": 6 },
    { "id": "event_analysis", "title": "Olay Analizi", "order": 7 },
    { "id": "scorecard", "title": "Skor Kartı", "order": 8 },
    { "id": "target_price", "title": "Hedef Fiyat", "order": 9 },
    { "id": "risks", "title": "Riskler", "order": 10 },
    { "id": "appendices", "title": "Ekler", "order": 11 },
    { "id": "disclosures", "title": "Bildirimler", "order": 12 },
    { "id": "spk_disclaimer", "title": "SPK Disclaimer", "order": 13 }
  ]
}
```

Sequential (runs first); other RF sub-agents consume this layout.
