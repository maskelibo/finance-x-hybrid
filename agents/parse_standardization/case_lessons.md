# parse_standardization — Case Lessons


### 2026-04-22 — THYAO
THYAO 22-Nis: total_assets, capex, cash REDACTED kalınca downstream analiz kısmen kör çalıştı. Reconciliation şans eseri bazı değerleri geçirdi — unredacted internal buffer kullandığı anlaşılıyor ama bu audit trail'de görünmüyor.

### 2026-04-22 — THYAO
THYAO 22-Nis: FY2025 özkaynak 911B TRY, Q3-2025'ten delta BS yöntemiyle türetilebilirdi. Temettü 8.951B TRY CF tablosunda mevcut. Fallback mevcut verilerle çalışıyor — otomasyon eksik.

### 2026-04-23 — THYAO
THYAO 20260423: total_assets ~1.997T TRY (20 haneli) CREDIT_CARD olarak maskelendi. Bu tek hata reconciliation'ın audit trail'ini kör etti, financial_analysis'in net_debt hesabını kaynak doğrulama dışı bıraktı ve final_summary'de onlarca 'conf=REDACTED' durumuna yol açtı.

### 2026-04-23 — THYAO
THYAO 20260423: 2024→2025 equity delta: net_income +118B, temettü -8.9B, OCI belirsiz. SE olmadan retained earnings doğrulaması yapılamıyor — bu 141B TRY equity gap sorununu bir önceki analizden bu analize taşıdı.

### 2026-04-23 — EREGL
EREGL Tur-1: parse hatası downstream'e sızdı, reconciliation yanlış veri onayladı. Bu seansta parse çıktısı hiç gelmedi — hata artık detect edilemez. Orchestrator parse timeout'u 3 dakika içinde yakalamalı ve CEO'ya eskalate etmeli.

### 2026-04-23 — ARCLK
ARCLK FY2020: financial_expense ≈ 5.37 milyar TRY; net_change_in_cash ≈ 5.07 milyar TRY. Bu rakamlar başında '5' ile başlayan on haneli sayılar olduğundan Türkiye telefon regex'iyle eşleşti. Sonuç: faiz gideri ve nakit değişimi tüm FY2020 analizinde boş kaldı.

### 2026-04-23 — ARCLK
ARCLK FY2020: operating_income=4,852,296,000 TRY + CF.D&A=1,221,994,000 TRY → EBITDA=6,074,290,000 TRY türetilebilirdi. Cross-tablo bağlantısı kurulmadığından tüm dönemler EBITDA=null gitti; financial_analysis EBITDA marjını doğrudan hesaplayamadı.

### 2026-04-24 — BIMAS
BIMAS FY2025: monetary_gain_loss null → downstream tüm IAS29 ayrımları (ROE, EBITDA IAS29 adjusted, gross_profit_ias29) LLM tarafından tahmin edilmek zorunda kaldı. parse_standardization'daki eksiklik 3 downstream agent'ı etkiledi.

### 2026-04-24 — BIMAS
Önceki BIMAS oturumu (2026-04-14) da SE eksikti ve QA blocked. Bu oturumda da equity_change={} — data_collection local cache'den okuma yaptığı için (file:// paths) eksik tablo atlandı.
