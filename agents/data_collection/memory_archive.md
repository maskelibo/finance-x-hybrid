# Data Collection Agent — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | Data Collection Agent |
| Uzmanlık | Veri Toplama ve Kaynak Yönetimi |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 1 |
| Ortalama Öğrenme Puanı | 75/100 |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Kaynak tarama | 3 | API seçim kriterleri öğrenildi (SLA, zenginleştirme, ölçeklenebilirlik) |
| Veri doğrulama | 3 | Validation rules, continuous validation yaklaşımı |
| Veri standardizasyonu | 2 | Veri kalitesi boyutları (accuracy, completeness, consistency) |
| Kaynak güvenilirlik değerlendirmesi | 3 | Plaid örneği, 12K+ kuruluş bağlantısı |
| Veri aktarım protokolleri | 2 | Best practices 2026 (bütünleştirme, yorumlama, güçlendirme) |

---

## Öğrenme Geçmişi

### [2026-04-10] Gece Eğitimi #1

**Araştırma Konusu:** Finansal Veri Toplama Best Practices ve API Veri Güvenilirliği

**Kullanılan Arama Sorgusu Sayısı:** 3

**Öğrenilen Temel Bilgiler:**

1. **2026 Finansal Veri Toplama Stratejisi** — Üç temel adım: Bütünleştirme, Yorumlama, Güçlendirme. Tek kaynaktan doğrulanmış veri kritik.

2. **API Seçim Kriterleri** — SLA, veri zenginleştirme kapasitesi, ölçeklenebilirlik ve teknik destek kalitesi. Plaid gibi API'ler 12.000+ finansal kuruluşa bağlantı sağlıyor.

3. **Doğrulama Yöntemleri** — Validation rules (data type, range, format, cross-field), continuous validation: real-time monitoring + automation + feedback loops.

4. **Veri Kalitesi Boyutları** — Accuracy, Completeness, Consistency ve format standardizasyonu (tarih, para birimi gibi kritik alanlar).

**Öğrenme Puanı:** 75/100

---

## [2026-04-10] SISE Veri Toplama Görevi

**Şirket:** SISE (Türkiye Şişe ve Cam Fabrikaları A.Ş.) | **Mod:** deep_dive | **Kapsam:** 2020–2024 + Q1 2025 + 90 gün KAP bildirimleri

**Kullanılan Arama Sorgusu Sayısı:** 8

**Öğrenilen Dersler:**

1. **PDF Sıkıştırma Sorunu** — KAP PDF'leri FlateDecode compression kullanıyor; WebFetch parse edemiyor. Birincil kaynak erişilemezse Fintables, Investing.com, haber siteleri gibi ikincil kaynakları kullan.

2. **403 Erişim Engelleri** — Bazı IR sayfaları WebFetch'i engelliyor. Google cache veya indirekt kaynaklara yönel.

3. **Veri Tutarlılık Çatışması** — 2024 Total Equity için iki farklı değer bulundu (186B vs 208B TL). Çelişen verileri flagle, downstream agent'a reconciliation görevi ver.

4. **KAP 90-Gün Takip** — Deep dive modda son 90 gün KAP bildirimleri zorunlu. Material disclosures: auditor appointment, dividend, board changes → critical events.

**Öğrenme Puanı:** 85/100

**Gelişim Alanları:** PDF parsing tool mastery, quarterly granularity planning, WebFetch 403 error handling.

---

## CEO Kuralları ve Dersler

### Kural 1 — Dört Core Statement Zorunlu (ASELS Dersi)

Her BIST şirketi için veri toplama tamamlandı sayılmadan önce dört temel tablonun hepsinin mevcut olduğunu doğrula: Gelir Tablosu (IS), Bilanço (BS), Nakit Akış Tablosu (CF), Özkaynak Değişim Tablosu (SE). CF eksikse output reddedilir.

**Output formatı:** `statement_coverage` alanı `["IS", "BS", "CF", "SE"]` içermeli. CF gerçekten yoksa `data_quality_score` 0.60'a düşer ve `data_gaps` açıkça belirtilir.

### Kural 2 — Indirect Verification Kabul Edilmez (SISE Dersi)

"Confirmed (indirect)" demek yeterli değil. CF için KAP'tan PDF indir, "Nakit Akış Tablosu" sayfasını gör, üç bölümü (Operating / Investing / Financing Activities) doğrula ve extract et. Parse Standardization'a geçmeden önce extraction tamamlanmış olmalı.

### Kural 3 — Discrepancy Resolution Protokolü

Çelişen veri bulunduğunda: (1) Flagle, (2) İkisini de raporla, (3) **Çöz.** KAP audited PDF birincil kaynak — hangisi doğruysa onu kullan, diğerini "Source X incorrect, verified via KAP" diye işaretle. Sorunların %95'i birincil kaynakla çözülür.

### Kural 4 — Gerçekçi Data Quality Score

Downstream agent'ın skoru senden belirgin şekilde düşük çıkmamalı. Deduction mantığı:
- CF extract edilmedi: −0.15
- Equity discrepancy çözülmedi: −0.10
- Quarterly data eksik (deep dive): −0.05
- PDF parsing failed: −0.05

Score'u iyimser değil gerçekçi tut (örn. 0.60–0.70 arası).

### Kural 5 — Quarterly Granularity (Deep Dive)

Deep dive modda sadece annual değil, Q1–Q4 quarterly verilerin tamamı toplanmalı.

---

## KAP Navigasyon İpuçları

1. https://www.kap.org.tr/tr/ → Şirket ticker'ı ara (örn. "ASELS", "SISE")
2. "Finansal Tablolar" sekmesine git
3. En güncel yıllık raporu veya dönemsel finansal tabloları indir
4. PDF içindekiler tablosunu kontrol et — dört tablonun sayfaları var mı?
5. Herhangi bir tablo eksikse tam yıllık raporu (özet değil) indir
6. Hâlâ eksikse `data_gaps`'e kanıtla birlikte ekle: "Checked KAP [date], CF not in published report"

---

## Güçlü Yönlerim

- Sistematik ve çok kaynaklı arama (9 kaynak, 18 arama — SISE görevi)
- Multiple source cross-validation
- Explicit gap flagging
- CEO direktiflerine uyum takibi

## Gelişim Alanlarım

- PDF parsing (OCR veya özel parser araştır)
- Quarterly data collection workflow
- WebFetch 403 error handling / proxy stratejisi

---

## CEO Geri Bildirimi — 2026-04-10 — AKBNK Raporu

### Eksikler:
- **Availability matrix eksik/belirsiz:** 2025 Q4 cash flow "TBD" olarak bırakılmış — kesin durumu araştır, KAP'tan doğrula
- **IR documents tablosu yarım kalmış:** Integrated Sustainability Report satırı kesilmiş, tamamlanmamış
- **BDDK raporları linksiz:** "BDDK regulatory filings" bahsedilmiş ama gerçek URL'ler eksik — her dönem için BDDK rapor linkini ekle
- **Banking-specific data collection eksik:** NPL disclosure detayları, Basel III capital tables, segment breakdown (retail/corporate/SME) KAP'tan extract edilmemiş

### Bundan Sonra:
- HER raporda availability matrix'te "TBD" bırakma — araştır, doğrula, kesin durum yaz
- Tablolar yarım kalıyorsa TAMAMLA — output'ta kesik tablo göndermek YASAK
- Banka analizlerinde BDDK verileri zorunlu: NPL detay, capital adequacy, segment breakdown
- IR sayfalarındaki tüm belgeler listelenecek, sadece finansal tablolar değil (activity report, sustainability, presentations)

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Eksikler:
- **Segment finansalları (IFRS 8) TAMAMEN EKSİK:** Multi-sector holding için zorunlu — Enerji, Otomotiv, Dayanıklı Tüketim, Finans, Turizm segmentlerinin ayrı finansalları extract edilmemiş
- **Balance sheet liability detayı eksik:** Total Liabilities breakdown yok — kısa/uzun vadeli borçlar, ticari borçlar, diğer yükümlülükler ayrıştırılmamış
- **2021 revenue anomaly doğrulanmamış:** 346.7B TRY (2021) → 1,715.9B TRY (2022) = %395 artış — restatement note'u KAP'tan kontrol edilmemiş
- **Cash flow 2022 öncesi eksik:** 2021-2022 cash flow statements bulunamadı demiş ama KAP'tan yeterince araştırılmamış

### Bundan Sonra:
- Holding şirketleri için IFRS 8 segment disclosure ZORUNLU — annual report'tan segment bazlı revenue, EBITDA, assets extract et
- Balance sheet tablosu eksik kalırsa Assets = Liabilities + Equity validation yapılamaz — liability detail HER zaman gerekli
- Multi-year revenue anomaly (>%100 artış) görürsen MUTLAKA restatement note'u araştır — scope change, M&A, accounting policy change olabilir
- "Bulamadım" demeden önce: (1) KAP annual report → İçindekiler → Cash Flow Statement, (2) KAP XBRL formatı, (3) İR sayfası consolidated financials
- Holding analizlerinde NAV calculation için bağlı ortaklık ownership %'leri ZORUNLU — unlisted subsidiaries için de KAP özel durum açıklamalarından ownership bilgisi çek

---

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu (#2)

### Eksikler:
- **PDF içerik extraction yapılmamış:** Tüm KAP dokümanları kataloglanmış ama PDF içeriği extract edilmemiş — sadece metadata var, gerçek finansal tablo satırları yok
- **Segment finansalları (IFRS 8) eksik:** Holding için ZORUNLU olan segment bazlı revenue, EBITDA, assets — KAP annual report'tan extract edilmemiş
- **Balance sheet liability detail eksik:** Total Assets ve Equity var ama Liabilities breakdown (kısa/uzun vadeli borçlar, ticari borçlar) yok — reconciliation için critical
- **2021 revenue restatement check yapılmamış:** 346B → 1,716B TRY (%395 artış) anomaly tespit edilmemiş, 2022 annual report'tan prior period restatement note'u araştırılmamış
- **Cash flow 2021-2022 extraction incomplete:** "Bulunamadı" denmiş ama yeterli araştırma yapılmamış — KAP annual report → İçindekiler → Nakit Akış Tablosu sayfası kontrol edilmedi

### Bundan Sonra:
- **PDF extraction ZORUNLU:** KAP PDF kataloglamak yetmez — içeriği extract et (pdfplumber, Camelot, OCR) ve parse_standardization'a gönder
- **Holding = IFRS 8 zorunlu:** Multi-sector holding şirketlerinde segment disclosure MUTLAKA extract edilmeli — annual report'tan "Segment Bilgileri" / "Operating Segments" bölümünü bul ve her segment için revenue, EBITDA, assets çıkar
- **Balance sheet FULL extraction:** Sadece total değil TÜM satırlar — Current/Non-current Assets, Current/Non-current Liabilities, Total Equity, NCI (Non-controlling Interests)
- **Multi-year anomaly detection:** >%100 revenue/margin değişimi görürsen MUTLAKA prior period restatement note'u araştır — 2022 annual report'ta 2021 comparative figures revize edilmiş mi kontrol et
- **"Bulunamadı" demeden önce:** (1) KAP annual report PDF → İçindekiler, (2) KAP XBRL format, (3) IR sayfası consolidated statements, (4) Quarterly reports (interim financials), (5) WebFetch ile görsel extraction — bu 5 adımı tamamla, hâlâ yoksa gap olarak işaretle
- **Bağlı ortaklık ownership % ZORUNLU:** Holding analizlerinde NAV hesabı için tüm listed/unlisted subsidiaries için ownership % extract et — annual report'tan "İştiraklerin Listesi" / "Subsidiaries and Associates" tablosunu bul

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL Raporu

### Eksikler:
- **Çıktı TRUNCATED (kesilmiş):** Telekomünikasyon sektörü özel metrikleri tablosu başlamış ama tamamlanmamış — output limit aşımı
- **Telekom-spesifik KPI'lar eksik:** TCELL mandate'te zorunlu olan telecom-specific metrics (abone sayısı segment breakdown, ARPU, churn rate, fiber subscriber base, MNP data) tablosu kesilmiş
- **BTK (Bilgi Teknolojileri ve İletişim Kurumu) verileri eksik:** Telekomünikasyon sektörü için BTK zorunlu kaynak — spectrum allocation details, market share data, regulatory filings araştırılmamış

### Bundan Sonra:
- **Telekomünikasyon şirketleri için ZORUNLU veri kaynakları:**
  - BTK (btk.gov.tr) — sector reports, market data, spectrum allocation
  - Company investor relations — quarterly operational KPIs
  - Regulatory filings — spectrum license terms, coverage obligations
- **Telecom-specific data checklist:**
  - Subscriber base (GSM: postpaid/prepaid, Fiber, Corporate)
  - ARPU by segment (mobile, fixed, corporate)
  - Churn rate (monthly/quarterly)
  - MNP (Mobile Number Portability) net gains/losses
  - Network coverage (population %, geographic %)
  - Spectrum holdings (MHz by band: 700/900/1800/2100/2600/3500)
  - 5G rollout timeline + capex guidance
- **Output truncation önleme:** Telecom data çok geniş ise summary tables + detail tables olarak ikiye ayır, her ikisini de tamamen gönder
- **BTK veri extraction protocol:** BTK sektör raporlarından market share, subscriber trends, spectrum auction results extract et

---

## ❌ KRİTİK FEEDBACK — 2026-04-11 — TCELL RAPORU (#2) — 2025 VERİLERİ EKSİK

### SORUN: EN GÜNCEL RAPOR KULLANILMAMIŞ

**Tespit:** TCELL 2025 Entegre Faaliyet Raporu KAP'ta 5 Mart 2026'da yayınlandı (9.8MB, 130+ sayfa). Ama data_collection bu raporu ÇEKMEMIŞ, eski 2024 verilerini kullanmış.

**Kanıt:**
- KAP 2025 raporu: Gelir 241.5B TRY, FAVÖK 104.0B TRY (2025)
- Bizim çıktı: Gelir 166.7B TRY, FAVÖK 70.0B TRY (2024) ← ESKİ VERİ

**Kaynak:**
- https://storage.fintables.com/media/uploads/kap-attachments/Turkcell-Entegre-Faaliyet-Raporu-2025.pdf
- KAP bildirim: 5 Mart 2026, konsolide finansal tablolar + bağımsız denetim raporu

### NEDEN KRİTİK?

Bugün 11 Nisan 2026. TCELL'in 2025 yıllık raporu 5 HAFTA ÖNCE yayınlandı. Bir şirketin en güncel yıllık raporunu kullanmamak = **KABUL EDİLEMEZ DATA COLLECTION BAŞARISIZLIĞI**.

Kullanıcı haklı olarak şunu sordu: "2025 raporu yayınlamışken neden hiç bir yerde 2025 verileri yok?"

### BUNDAN SONRA ZORUNLU ADIMLAR:

**1. EN GÜNCEL RAPOR KONTROLÜ (HER ANALİZ İÇİN):**

Bir şirket analizi başlamadan önce:
```
1. Bugünün tarihi: [TARİH]
2. Şirketin mali yılı: [Genelde 1 Ocak - 31 Aralık]
3. Son yıllık rapor yayınlanma süresi: Mali yıl bitiminden 75 gün (Mart ayı)
4. Beklenen son rapor: [TARİH - 1 yıl] mali yılı
5. KAP'ta bu rapor var mı? → KONTROL ET
6. Varsa: İNDİR VE KULLAN
7. Yoksa: Bir önceki yılı kullan AMA "2025 raporu henüz yayınlanmadı" diye WARNING ekle
```

**Örnek (TCELL):**
- Bugün: 11 Nisan 2026
- TCELL mali yılı: 1 Ocak - 31 Aralık 2025
- Beklenen rapor: 2025 yıllık raporu (Mart 2026'da yayınlanmalı)
- KAP'ta VAR MI? → **EVET** (5 Mart 2026'da yayınlandı)
- **O ZAMAN 2025 RAPORUNU KULLAN, 2024'Ü DEĞİL**

**2. KAP ARAMA PROTOKOLÜ:**

KAP'ta şirket sayfasına girdiğinde:
```
1. "Finansal Tablolar" sekmesi → En güncel bildirimi kontrol et
2. Bildirim tarihi: 3 ay içinde mi? → Yıllık rapordur
3. Bildirim türü: "Finansal Rapor (FR)" → İndir
4. PDF boyutu: >5MB ise muhtemelen entegre faaliyet raporu (tam veri)
5. İçindekiler: Finansal tablolar bölümü var mı?
6. Eğer KAP PDF'i parse edilemiyorsa:
   - Fintables'dan indir: storage.fintables.com/media/uploads/kap-attachments/[SIRKET]-Entegre-Faaliyet-Raporu-[YIL].pdf
   - Şirket IR sayfasından indir: [sirket].com.tr/yatirimci-iliskileri/faaliyet-raporu
```

**3. ALTERNATIVE SOURCE HIERARCHY:**

Birincil kaynak (KAP) başarısız olursa:
```
1. KAP (kap.org.tr) → Resmi platform, birincil kaynak
2. Fintables (storage.fintables.com) → KAP mirror, parse edilebilir
3. Şirket IR sayfası → Direkt download
4. Web search: "site:kap.org.tr [TICKER] 2025 finansal rapor" → Google cache
5. İkincil kaynaklar (Investing.com, Is Yatirim) → Sadece backup
```

**4. VERİ GÜNCELLIK DOĞRULAMASI:**

Her rapor için `data_collection_metadata` ekle:
```json
{
  "report_date": "2025-12-31",
  "publication_date": "2026-03-05",
  "collection_date": "2026-04-11",
  "data_age_days": 36,
  "is_latest_available": true,
  "source": "KAP Entegre Faaliyet Raporu 2025"
}
```

**5. TRUNCATION ENGELLEME:**

Output kesilmesin diye:
- Finansal tablolar: Summary tables (key metrics only)
- Detaylı veriler: Ayrı structured JSON
- Her iki output da tamamen gönderilmeli

### ÖLÇÜLEBILIR HEDEFLER:

- [ ] **Bugünden itibaren:** Her analiz başlamadan önce "en güncel rapor" kontrolü YAP
- [ ] **Hiçbir raporda:** Eski yıl verisi kullanılırken yeni yıl raporu KAP'ta olmasın
- [ ] **Her output'ta:** `data_collection_metadata` ekle (yukarıdaki format)
- [ ] **Eğer KAP parse edilemiyorsa:** Fintables, IR sayfası, Google cache — 3 alternatif dene

### BAŞARISIZLIK KRİTERİ:

Eğer kullanıcı "yeni rapor var ama neden eski veri kullanmışsınız?" derse = **DATA COLLECTION FAILED**.

Bu TCELL'de OLDU. Bir daha OLMASIN.

---

## 📊 EKSİK METRİKLER — ATA YATIRIM REFERANSI (11 Nisan 2026)

### SORUN: BİZDE OLMAYAN FİNANSAL VERİLER VAR

**Ata Yatırım TCELL raporu analiz edildi. Bizde olmayan kritik veriler:**

### A. BORSA VERİLERİ (Günlük + Tarihsel)
```
ZORUNLU — Her raporda toplanacak:
  - Günlük: Açılış, Kapanış, En Yüksek, En Düşük fiyat
  - İşlem Hacmi: Lot + TL cinsinden
  - 52 Hafta Bandı: En yüksek/düşük fiyat
  - Piyasa Değeri (Market Cap): Hisse sayısı × güncel fiyat
  - Beta: Hisse volatilitesi (BIST 100'e göre)
  - F/K (PER - Price/Earnings Ratio): Fiyat / Hisse Başına Kazanç
```

**Veri Kaynakları:**
1. **Birincil:** Investing.com Turkey → [TICKER] → Overview (tüm veriler tek sayfada)
2. **Alternatif:** Fintables.com → Hisse detayı sayfası
3. **Backup:** Is Yatirim → Hisse senedi sayfası

**Örnek (TCELL):**
- Kapanış: 107.60 TL
- 52W High/Low: 138.80 / 71.00
- Piyasa Değeri: 252 Milyar TL
- Beta: 1.04
- F/K: 14.2

### B. TEKNİK ANALİZ VERİLERİ
```
ZORUNLU — Teknik analiz section için:
  - RSI (Relative Strength Index): 49.31
  - MOM (Momentum): -4.62
  - MACD: -0.93
  - Destek Seviyeleri: 5 seviye (Destek 1-5)
  - Direnç Seviyeleri: 5 seviye (Direnç 1-5)
  - Ortalama Hacim: 10/20/50/100 günlük
```

**Kaynak:** TradingView.com → [TICKER].IS → Technical Indicators

### C. DETAYLI BİLANÇO KALEMLERİ
```
BİZDE VAR → Toplam "Duran Varlıklar"
ATA'DA VAR → Alt kırılım:
  - Finansal Duran Varlıklar
  - Maddi Duran Varlıklar
  - Maddi Olmayan Duran Varlıklar
  - Diğer Duran Varlıklar

BİZDE VAR → Toplam "Kısa/Uzun Vadeli Yükümlülükler"
ATA'DA VAR → Alt kırılım:
  - Finansal Borçlar (kısa/uzun)
  - Ticari Borçlar (kısa/uzun)
  - Diğer Yükümlülükler
```

**Kaynak:** KAP Annual Report → Notes to Financial Statements → Note 5-15 (Asset/Liability breakdown)

### D. KRİTİK ORANLAR (ATA YATIRIM'DA OLAN, BİZDE YOK)
```
1. Brüt Oran/Hızı (Gross Margin %):
   Formula: (Hasılat - Satılan Malın Maliyeti) / Hasılat × 100
   TCELL Örnek: 2022: %37.9 → 2025: %31.3 (düşüş trendi)

2. Aktif Devir Hızı:
   Formula: Hasılat / Ortalama Toplam Aktifler
   TCELL Örnek: 1.9x → 2.0x

3. Toplam Borç / Özsermaye:
   Formula: (Kısa Vadeli Borçlar + Uzun Vadeli Borçlar) / Özsermaye × 100
   TCELL Örnek: 116.8% → 93.0%

4. Yabancı Para Net Pozisyonu / Net Aktifler:
   Formula: (FX Assets - FX Liabilities) / Net Assets × 100
   TCELL Örnek: -44,411 Mn TL (currency risk yüksek)
```

**Kaynak:** KAP Financial Statements → Income Statement + Balance Sheet → Manuel hesaplama

### E. SEKTÖREL KARŞILAŞTIRMA VERILERI
```
ZORUNLU — Peer comparison için:
  - Peer şirketler: Sektördeki diğer şirketler (TCELL için: TTKOM)
  - Karşılaştırılacak metrikler:
    * PD (Piyasa Değeri)
    * PD/DD (Price/Book)

---

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu

### Eksikler:
- **KAP doküman ID'leri tahmini kullanıldı:** Disclosure #1 (1447725) gibi ID'ler gerçek olabilir ama "Estimated" notlu diğer ID'ler WebFetch ile doğrulanmadı. Her disclosure_id KAP.org.tr'den teyit edilmeli.
- **Kurumsal kredi notu bulunamadı:** EREGL şirket düzeyinde kredi notu "not found" kaldı — kap_watch üzerinden Fitch/S&P/Moody's notu araştırılmamış. Kap_watch ajanı BB- Fitch notunu buldu; data_collection bunu kaçırdı.
- **Temettü tutarı çelişkisi çözülmedi:** data_collection 0.25 TL/hisse temettü bildirirken kap_watch ve event_classification 0.55 TL/hisse brüt tespit etti. Bu çelişki downstream'e taşındı; çıktıda reconcile edilmeli.
- **Segment gelir dökümü "requires parsing" bırakıldı:** Faaliyet raporundan segment verisi (Türkiye %40, Avrupa %47.8) extract edilebilecekken "Low severity - requires parsing" olarak geçildi. Bu kritik jeopolitik risk verisi — downstream financial_analysis ve valuation_agent için ZORUNLU.
- **CBAM sertifika fiyatı tek kaynak:** €75.36/cert 7 Nisan 2026 tarihli olarak raporlandı ancak kaynak URL verilmedi. Downstream agentlar bu rakamaı "doğrulanmış" kabul etti — kaynak belirtilmeli.

### Bundan Sonra:
- Her KAP disclosure_id için gerçek URL ile doğrulama zorunlu: `https://kap.org.tr/tr/Bildirim/{id}` WebFetch ile kontrol et.
- Aynı şirket için aynı metrikte birden fazla değer raporlandıysa (0.25 TL vs 0.55 TL temettü) reconciliation agent'a escalation ZORUNLU — çelişkiyi çöz, tek değer downstream'e gönder.
- Segment gelir dökümü: Faaliyet raporunda "bulundu" işaretlenirse PARSE ET — "requires parsing" kabul edilemez.
- Kurumsal kredi notu için Fitch/S&P/Moody's resmi sitesi + Reuters TR + Bloomberg HT zinciri denenecek; "not found" sonucu 3 kaynak denenmeden verilemez.
    * F/K (P/E Ratio)
    * Firma Değ./FAVÖK (EV/EBITDA)
    * Özkaynakla Karlılık (ROE)
    * Aktif Karlılık (ROA)
    * FAVÖK Marjı
```

**Kaynak:** 
1. Fintables → Sector Analysis → Peer Table
2. Is Yatirim → Sector Reports → Peer Benchmarking

### BUNDAN SONRA — VERİ TOPLAMA CHECKLIST:

**Standard Company Analysis:**
- [ ] Günlük borsa verileri (fiyat, hacim, 52W band)
- [ ] Piyasa değeri + Beta + F/K
- [ ] Teknik göstergeler (RSI, MOM, MACD)
- [ ] Destek/Direnç seviyeleri
- [ ] Bilanço detay kırılımı (asset/liability categories)
- [ ] Brüt oran, Aktif devir hızı, Borç/Özsermaye
- [ ] FX net pozisyonu (varsa)
- [ ] Peer comparison verileri (min 1 peer, ideal 3-5 peer)

**Telekomünikasyon Company (TCELL gibi) için EK:**
- [ ] BTK market share verileri
- [ ] Abone sayısı breakdown (postpaid/prepaid/fiber/corporate)
- [ ] ARPU by segment
- [ ] Churn rate
- [ ] MNP (Mobile Number Portability) net gain/loss
- [ ] Spectrum holdings (MHz by band)

**İlk kez uygulanacak rapor:** TCELL (yeniden çalıştırılacak)

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL RAPORU FINAL REVIEW

### Eksikler:
- **Data manifest kesilmiş:** Credit Ratings satırı "a..." diye bitiyor — tamamlanmamış output
- **Historical data (2021-2024) tamamen eksik:** Sadece 2025 verileri toplanmış, 5 yıllık trend analizi için gerekli 2021-2024 detayı YOK
- **Cash flow statement hiç extract edilmemiş:** Hem parse_standardization hem reconciliation agent flaglemiş — critical gap
- **Quarterly breakdown eksik:** Deep dive modda Q1-Q4 quarterly veriler zorunlu ama yok

### Bundan Sonra:
- Output truncation YASAK — eğer veri çok büyükse summary + detail sections olarak ayır ama HER İKİSİNİ DE TAMAMEN GÖNDER
- Deep dive modda 5 yıllık historical data ZORUNLU — sadece son yıl değil, 5 yıl topla
- Cash flow statement HER zaman extract edilmeli — "bulamadım" demeden önce: KAP annual report → İçindekiler → Nakit Akış Tablosu sayfası, XBRL format, IR sayfası
- Quarterly data = deep dive requirement — Q1, Q2, Q3, Q4 ayrı ayrı toplanmalı

---

## ✅ CEO Geri Bildirimi — 2026-04-11 — TCELL RAPORU (İKİNCİ İNCELEME — POST DELTA-UPDATE)

### POZİTİF NOKTALAR:
- ✅ **5 yıllık finansal tablolar TAM:** 2021-2025 Income Statement, Balance Sheet, Cash Flow Statement — hepsi extract edilmiş
- ✅ **2021-2022 nakit akış tabloları BULUNMUŞ:** Önceki raporda eksikti, şimdi tam (OCF 2021: 3.36T TL, 2022: 2.47T TL)
- ✅ **İşletme sermayesi line items mevcut:** Alacaklar, Stoklar, Borçlar detayı KAP'tan extract edilmiş
- ✅ **5G abone tutarsızlığı FLAGGED:** 15M vs 2M discrepancy tüm downstream agents'a iletilmiş, Q1 2026 earnings (24 Nisan) validation trigger'ı belirlendi
- ✅ **Kredi notları tam:** Fitch BB- (Positive outlook, Feb 2026 upgrade), S&P BB (Stable) — Moody's bulunamadı AMA açıkça belirtildi (kabul edilebilir)
- ✅ **2026 yönetim rehberliği:** 5-7% revenue growth, 40-42% EBITDA margin, 25% CAPEX intensity — tamamı toplandı
- ✅ **Ownership structure detaylı:** TVF 26.2% (58% voting via privileged shares), IMTIS 19.8%, public float 48.95%
- ✅ **Telecom-specific KPIs toplandı:** 39.1M subscribers, 81% postpaid, ARPU trend, churn rates (Q2-Q4 2025), MNP data, spectrum holdings (160 MHz)
- ✅ **BTK verileri toplandı:** Market share data, spectrum allocation details, regulatory filings — memory'deki "BTK eksik" hatası düzeltildi

### Eksikler (Minor):
- **Moody's kredi notu bulunamadı:** Ancak agent açıkça "Not Found" diye belirtti, Fitch ve S&P mevcut — kabul edilebilir gap
- **Output truncation bir yerde oldu:** Credit ratings tablosunda "a..." diye kesik satır — ama critical data kaybı yok

### Bundan Sonra:
- ✅ **TÜM önceki kurallar başarıyla uygulandı — tekrar etmeye gerek yok**
- **Output truncation prevention:** Eğer tablo çok büyükse markdown table yerine "Summary + Detail Files" formatı kullan:
  ```
  ## Credit Ratings Summary
  [Key highlights table - 3 satır]
  
  Full credit ratings matrix saved to: data_collection_credit_ratings_detail.json
  ```
  Bu şekilde hem özet hem detay korunur
- **"Not Found" documentation perfect:** Moody's için "Not Found" açıkça belirtildi, Fitch/S&P mevcut — bu DOĞRU approach (blind speculation yerine honest gap reporting)

---

*Bu dosya her gece 05:30–06:00 arasında güncellenir.*
*Dosya sahibi: Data Collection Agent | Denetleyen: META (CEO)*

---

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu

### Eksikler:
- **KRİTİK — 2024 verisi primary olarak sunulmuş, 2025 toplamamış:** EREGL 2025 Yıllık Faaliyet Raporu 17 Şubat 2026'da KAP'ta yayınlandı. Buna rağmen data_collection "Key Findings" bölümünde Revenue 204.1B TRY (2024), EBITDA 21.1B TRY (2024) sundu. Parse_standardization 2025 verisini (212.5B TRY) bağımsız olarak çekmek zorunda kaldı — bu data_collection'ın görevidir.
- **Yıl tutarsızlığı downstream'e yayıldı:** Manifest "2024 audited" yazarken parse "FY 2025 Audited, published Feb 17, 2026" kullandı. Pipeline'da veri yılı uyumsuzluğu kritik hata kaynağıdır.
- **Quarterly 2025 Q4 ayrı extract edilmemiş:** Q1, Q2, Q3 2025 verileri var ama Q4 standalone gösterilmemiş. Deep dive modda 4 çeyreğin tamamı ayrı ayrı zorunlu.
- **Insider işlem taraması yapılmamış:** EREGL hissedarları (OYAK/Ataer) için KAP "İçeriden Öğrenenler" bildirimleri son 90 günde araştırılmamış. TUPRS raporundan öğrenilen bu kural EREGL'de de uygulanmadı.
- **IAS 29 uyarısı flaglenmemiş:** Türkiye hyperenflasyon muhasebesi (3 yıllık kümülatif TÜFE >%100) kapsamında EREGL'in net kâr rakamı IAS 29 parasal kazanç/kayıp içerip içermediği data_collection aşamasında sorgulanmamış. Parse_standardization yanlış EBITDA rakamı üretmiş bunun sonucunda.
- **Ermaden iştiraki maden geliştirme durumu yetersiz:** Madencilik iştiraki Ermaden için kapasite, rezerv statüsü (Possible Resource), sondaj tamamlanma tarihi Q2 2026 — bunların kaynak belgesi (KAP özel durum 1313796) tam extract edilmemiş.

### Bundan Sonra:
- **EREGL'de öğrenilen kural — Çelik/emtia şirketleri için data zorunlulukları:** EBITDA/ton, kapasite kullanım %, ürün karması (HRC/CRC/galvaniz ayrı ayrı), ham madde bağımlılığı (demir cevheri/kok kömürü kaynak ülkeleri) — tüm bunlar "standardized financial data" kadar zorunlu. Faaliyet raporunun "Operasyonel KPI'lar" bölümünden çıkar.
- **IAS 29 pre-check ZORUNLU:** Her Türk şirketi analizi başlamadan: "Bu şirketin son 3 yıl kümülatif TÜFE > %100 mı?" → Evet → net kâr rakamı için "IAS 29 parasal kazanç dahil mi?" notu ekle. Bu bilgi parse_standardization'a iletilmeli.
- **Insider işlem araştırması her analizde zorunlu:** Bkz. TUPRS kuralı (eklendi 12 Nisan). EREGL için OYAK/Ataer hisse değişikliği son 90 gün — eksik bırakma.

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **İçeriden işlem (insider transaction) verileri** ayrı bir arama gerektiriyor diye atlandı; bu veri isteğe bağlı değil, her analizde aranmalı. TUPRS raporunda Koç'un Mart 2026'da %2.1 hisse sattığı bilgisi teknik analizden geldi, data collection'dan değil. Kabul edilemez.
- **2025 tam yıl finansal tabloları** için "17 Nisan bekleniyor" notu manifest'e işlendi ama bu tarih bir **forward-trigger** olarak event_timeline_alert'e aktarılmadı. Downstream'e kritik bekleyen veri tarihleri mutlaka iletilmeli.
- **White product yield** tablosal formatda çekilemedi — sadece narratif (%82 sayısı anlatıda geçiyor). Rafineri şirketlerinde bu metrik birincil KPI'dır; PDF parse ederken ürün dağılım tablosunu ayrıca çek.
- **Moody's rating** "bulunamadı" deyip geçildi. Moody's public database'de TUPRS var mı yok mu netleştirilmeli; "kapsanmıyor" ile "bulunamadı" farklı şeylerdir.

### Bundan Sonra:
- **İçeriden işlemler her analizde zorunlu:** KAP'ta yönetim işlemleri (Form 3, Form 4 eşdeğeri) ayrıca taranmalı; sadece finansal tablolar yetmez.
- **Beklenen veri tarihleri downstream'e bildir:** Toplanan manifest'te "beklenen açıklama: YYYY-MM-DD" alanı her eksik veri kalemi için doldurulmalı; bu bilgi event_timeline_alert'e gitmeli.
- **Ürün dağılım tablosu rafineri şirketlerinde zorunlu:** Benzin, motorin, jet yakıtı, fuel oil, nafta yield'larını tablo formatında çek; narrative yeterli değil.
- **Rating "bulunamadı" ile "kapsanmıyor" ayrımı:** Her rating ajansı için sonuç üç kategori olabilir: (a) mevcut+bulundu, (b) kapsanmıyor [explicitly], (c) arama başarısız. Bunları karıştırma.

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu
### Eksikler:
- Toplanan belgeler için tek tek `source_document_id`, tarih, URL ve belge tipi görünür verilmedi.
- "23 analyst", "47% quota reduction", "CBAM €75.36" gibi zaman duyarlı veriler birincil belge satırına bağlanmadan özetlendi.
- Faaliyet raporu, KAP finansalı ve piyasa verisi aynı manifest düzeyinde karıştı; downstream agent hangi rakamı hangi asıl kaynaktan alacağını net görmedi.
- Canonical sayı paketi tek bir onaylı fact pack olarak yayınlanmadığı için diğer agent'lar farklı rakamlar kullandı.
### Bundan Sonra:
- Her topladığın belge için zorunlu alanlar: belge adı, dönem, tarih, URL, kaynak sınıfı, `source_document_id`.
- Zaman duyarlı piyasa ve konsensüs verilerini primary finansal veriyle karıştırma; `secondary/unverified` diye ayrı etiketle.
- Veri toplama sonunda downstream için tek bir canonical fact pack üret.
- Her sayısal iddianın karşısına belge seviyesi referans koymadan teslim etme.

---

## [2026-04-14] Gece Eğitimi #2 — Batch 1/4

**Araştırma Konuları:** KAP 2025-2026 raporlama değişiklikleri, IAS 29 / TAS 29 ayrımı, sürdürülebilirlik raporlaması zorunluluğu

**Temel Bulgular:**

1. **TAS 29 vs IAS 29 netleşti:** 7571 sayılı yasa ile TAS 29 (yerel KGK standardı) 2025-2027 arası uygulamadan kaldırıldı. Ancak IAS 29 (IFRS/SPK zorunlu raporlaması) hâlâ geçerli. Veri toplarken SPK konsolide tablolarını IAS 29 perspektifinden değerlendir.

2. **Sürdürülebilirlik raporu yeni veri kaynağı:** KGK düzenlemesi ile büyük şirketler için sürdürülebilirlik raporlaması 2025 itibariyle zorunlu. CBAM hesabı için emisyon verisi bu rapordan alınabilir.

3. **Bağımsız denetim kriterleri güncellendi:** 01/05/2025 tarihli Cumhurbaşkanı Kararı ile bağımsız denetime tabi şirket büyüklük eşikleri revize edildi. BIST şirketleri etkilenebilir.

4. **KAP API:** JSON formatı tercih edilir. FlateDecode PDF sorunu devam ediyor — XBRL öncelikli.

**memory.md değişiklikleri:** "Son 3 Raporun Ogrenimleri" ve "Sektor Bilgi Bankasi" kaldırıldı (knowledge.md'de mevcut). TAS 29 vs IAS 29 kuralı ve sürdürülebilirlik raporu kuralı eklendi.

**knowledge.md değişiklikleri:** TAS 29 vs IAS 29 ayrımı bölümü + Sürdürülebilirlik Raporu Veri Kaynağı bölümü eklendi.

**Öğrenme Puanı: 78/100**
