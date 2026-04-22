---
id: financial-statements-extraction
name: "Financial Statements Extraction"
description: "PDF faaliyet raporundan IS/BS/CF/SE tablolarini extract etme; IFRS/SPK layout."
triggers: ['gelir tablosu', 'bilanco', 'nakit akim', 'income statement', 'balance sheet', 'cash flow', 'spk', 'konsolide finansal']
applies_to_agents: ['parse_standardization', 'reconciliation', 'data_collection']
category: data_acquisition
priority: critical
---

# Financial Statements Extraction

## Ne Zaman Kullanılır?
PDF faaliyet raporu veya SPK konsolide rapordan gelir tablosu (IS), bilanço (BS), nakit akım tablosu (CF), özsermaye değişim (SE) çıkarılacağında.

## Prosedür
1. **PDF text extract** → `pdfplumber` veya `pymupdf`. Scanned ise OCR (tesseract).
2. **Tablo tespiti** → layout heuristics (çok sütunlu sayısal bloklar, başlık satırları).
3. **Satır eşleştirme** → Türkçe/İngilizce satır etiketi regex'leri (Hasılat/Revenue, Brüt Kar/Gross Profit, FAVÖK/EBITDA).
4. **Dönem yayılımı** → Q1/H1/9M/FY + karşılaştırma (current vs previous).
5. **Unit normalize** → mn TL / bn TL / USD → TRY_mn canonical (fact-layer/unit-normalizer).

## Kurallar
- SPK formatı vs VUK formatı farkı (IAS 29 uygulama).
- Konsolide vs solo ayrımı.
- "Satış gelirleri" ≠ "Hasılat" — bazen brüt vs net farkı.
- İlişkili taraf satışları ayrı satır (segment breakdown'da önemli).

## Örnek
TUPRS 2025 annual: Hasılat 945.7 bn TL → raw 945,700,000,000 → 945,700 mn (canonical TRY_mn).

## Bilinen Tuzaklar
1. PDF sayfa header/footer tablo kesmesi → satır birleştirme gerekli.
2. Notlara atıflar (*1, 5.2.1) tablo'dan düşer.
3. Restated comparatives (önceki dönem IAS 29 düzeltmeli) karıştırmamalı.

## Referanslar
- pdfplumber docs — table_settings
- SPK Sermaye Piyasası Finansal Raporlama Tebliği
