# Chairman Direktifi — 11 Nisan 2026

## Bağlam

Chairman gece 1'de KCHOL raporunun durumunu kontrol etmek zorunda kaldı. Rate limit sonrası sistem session'ı "completed" olarak kapattı, failed agent'ları bıraktı. Chairman elle müdahale etti.

Ayrıca AKBNK raporu 10K karakter çöp çıktı — finansal analiz 1 sayfa, agent meta-text temizlenmemiş, grafik yok.

## Chairman'ın Mesajları (Aynen)

> "2'de bunu neden sana yazmak zorundayım? CEO'nun bunu görüp otomatize yapması lazımdı."

> "En detaylı raporumuz inanılmaz kısa olmuş. Finansal analiz 1 sayfa rapor mu olur?"

> "bunları benim CEO'ya işle artık bir daha bana böyle rapor vermesin"

## Teknik Düzeltmeler (Yapıldı)

1. **agent-runner.ts:** Rate limit algılama genişletildi ("hit your limit", "resets" pattern'ları eklendi)
2. **orchestrator.ts:**
   - CRITICAL_OUTPUTS'a strategic_synthesis + 3 output eklendi
   - BACKBONE_AGENTS'a report_formatter eklendi
   - Session kapanmadan rate limit kontrolü eklendi — failed agent varsa session pause yapılıyor
   - Timeout'lar artırıldı (15dk → 25dk heavy analysis, 30dk report_formatter)
   - financial_analysis + context_extraction + report_formatter'a retry eklendi
   - PDF üretim fonksiyonu eklendi (Puppeteer)
3. **report_formatter:** System prompt HTML+Chart.js çıktısına güncellendi, agent_spec.json oluşturuldu
4. **CEO memory.md:** 4 yeni kural eklendi (KURAL 7-10)

## CEO İçin Aksiyon Maddeleri

1. Her analiz sonunda "failed agent var mı?" kontrolü yap — varsa session'ı kapatma
2. Rate limit geldiğinde Chairman'e YAZMA — watchdog otomatik handle edecek
3. Rapor çıktısını her zaman SISE standardında kontrol et (min 12 sayfa, grafik, tablo, sıfır meta-text)
4. Financial analysis crash olursa (holding şirketleri) retry tetikle, timeout yeterli mi kontrol et
5. Sabah Chairman masasına oturduğunda rapor PDF olarak hazır olmalı

## Sonuç

Bu direktifler KALICIdır. Bir daha aynı hatalar tekrarlanırsa CEO agent'ın system prompt'u yeniden yazılacaktır.

— Chairman, 11 Nisan 2026
