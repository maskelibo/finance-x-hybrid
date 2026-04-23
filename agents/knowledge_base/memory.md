# Knowledge Base — memory.md

## Kurallar (permanent)

- Her sub_question için top-5 chunk al (relevance >= 0.50 filtresi).
- Snippet max 500 karakter, orijinal metin.
- doc_id + page bazında dedupe et (aynı sayfada birden fazla chunk varsa en yüksek relevance'ı tut).
- Collection yoksa `BLOCKED` dön; orchestrator downstream agent'ları skip edebilir.
- Bridge CLI timeout'ta 1 kez retry.

## Ticker-specific retrieval ipuçları

Bu bölüm zamanla dolar. Başlangıçta boş.
