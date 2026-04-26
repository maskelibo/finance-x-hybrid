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

### 2026-04-24 — BIMAS
EBITDA kaynak farkı (%2.2) downstream EV/EBITDA hedef fiyatını kaydırır. Valuation agent hangi EBITDA'yı kullandığını açıklamamış — audit trail yok.

### 2026-04-24 — KCHOL
KCHOL 2026-04-24: disclosure 1555903 (FY2025 annuals) 'FY-2026' etiketiyle geçirildi → financial_analysis'e revenue=0, assets=0 geçti → 28 oran null → QA 0.46 → downstream cascade çöküşü.

### 2026-04-24 — KCHOL
KCHOL: 3 ardışık analizde IFRS 8 segment extraction %0 başarı. TUPRS/FROTO/YKBNK/ARCLK segment EBITDA katkısı hiç elde edilemedi (CEO P0-002 ihlali).

### 2026-04-24 — KCHOL
KCHOL FY2025: CF parse başarısız → FCF null → Piotroski F-score CF kriteri hesaplanamadı → Chairman zorunlu metrikleri (FCF, OCF/EBITDA, CAPEX/EBITDA) eksik — QA COMPLETENESS=0.

### 2026-04-24 — KCHOL
1555903 (Finansal Rapor, 367KB, FY2025 konsolide) yerine 1555915 (Özel Durum, 81KB) işlendi. Dosya boyutu bile ayırt edici sinyaldi — 81KB finansal tablo taşıyamaz.

### 2026-04-24 — KCHOL
KCHOL: 1555915 (Özel Durum, 81KB) FY-2026 interim — tam yıl tablo yok. 1555903 (Finansal Rapor, 368KB) FY-2025 birincil kaynak. Boyut farkı (81KB vs 368KB) bile dönem boşluğunu ima ediyor.

### 2026-04-25 — KCHOL
KCHOL 20260425: parse_standardization FY-2025 BS (total_assets=5.32T) ve IS (revenue=2.76T) doldurdu ancak cash_flow={}. financial_analysis sonucunda FCF=null, OCF/EBITDA=null, CAPEX/EBITDA=null. Valuation SOTP'ta holding-only net borç da doğrulanamadı.

### 2026-04-25 — KCHOL
KCHOL 20260211: 1555903 (FY-2025 bilanço kapanışı 31.12.2025) → FY-2025. Yayın tarihi = 2026 değil, kapanış tarihi = 2025.

### 2026-04-25 — KCHOL
KCHOL 20260211: 1555903 (Finansal Rapor, 367KB) birincil. 1555915 (Özel Durum, 81KB) ODA track'i. İki track ayrı tutulmadan tüm sezon veri kaybı oluştu.

### 2026-04-25 — KCHOL
KCHOL her çeyrekte iki eş zamanlı bildirim yayımlıyor: (a) kısa özel durum özeti ve (b) tam finansal rapor. Agent boyut filtresi uygulamadığı için küçük özeti seçti.

### 2026-04-25 — KCHOL
Holdinglerde nakit akış tablosu ayrı sayfalarda (genellikle p.6-8) yer alır ve tablo başlığı 'Nakit Akış Tablosu' / 'Consolidated Statement of Cash Flows' olarak geliyor. Regex pattern bu başlığı kapsıyor mu doğrulanmalı.
