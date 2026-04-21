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

## Purge 2026-04-21 23:11 — 12 section (en yeni: 2026-04-16)

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **Faaliyet Raporu 1561073 indirilmedi** — Solo bilanço, segment notları (IFRS 8) ve interest expense için birincil kaynak. İki tur boyunca "ESK-003 açık" olarak kaldı; bu eskalasyon çözüm değil, görevin taşınmasıdır. Rapor teslim edilmeden önce fetch edilmeliydi.
- **KAP 1383079 (13 Mart 2026) detayları çözümsüz kaldı** — "Orta materyallik" denilerek geçildi; bu kalemin içeriği hâlâ [VERİ YOK]. Canonical fact pack'te kapsamsız olay var = eksik teslimat.
- **Interest expense satır bazlı çekilmedi** — Faiz Karşılama Oranı için zorunlu. "TBD 1/21 (%4.8) — eşik altında" gerekçesiyle geçildi; eşik altında bile olmasa bu satır faiz karşılama hesabı için zorunlu.
- **FY2023 CF/SE tablosu seri kırığı devam etti** — FY2021/2022/2024/2025 var; FY2023 eksik. 5 yıllık seri = zorunlu kuralını ihlal.
- **WC kalem bazında kırılım downstream'e iletilmedi** — AR 240,073 mn TL çekildi ✓; stok ve ticari borç bireysel yıl kırılımları BS karşılaştırmasından tahmin bırakıldı (DISC-005). FY2024 AR "~185,000*" asteriskli; asterisksiz kaynak gerekiyor.

### Bundan Sonra:
- **Faaliyet raporu PDF = eskalasyon değil, görev** — Faaliyet raporu çekilemiyorsa fetch'i log göstererek CEO'ya raporla; sessizce "ESK" ile geçme. Çözüm gelmeden döngüyü kapatma.
- **Interest expense her holding raporunda zorunlu satır** — Faiz Karşılama Oranı (EBIT/Faiz) Chairman metrik listesinde; "eşik altında" gerekçesi veri çekmeme sebebi değil. Doğrudan çek, canonical fact pack'e koy.
- **KAP bildirimi çözümsüz kalırsa `unverified — upstream escalation açık` etiketiyle kayıt et** — "Orta materyallik" ile geçme; etiketle ve downstream'i uyar.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **D&A 4. THYAO analizinde hâlâ null** — depreciation_amortization: null; investing_cash_flow: null; capex: null; free_cash_flow: null. Tolerans sıfır direktifi 3 kez verildi; hâlâ çözülmedi.
- **IFRS 16 ROU varlık ve kira borcu satırları ayrıştırılmadı** — THYAO $25B+ kira yükümlülüğü; Net Borç formülü için zorunlu. Canonical fact pack bu iki satır olmadan yayımlanmamalı.
- **FY2020-2023 seri güven seviyesi düşük kaldı** — Tüm eski yıllar "low confidence" veya eksik; 5 yıllık seri zorunlu kuralı ihlal.
- **CEO/YK değişimi sonrası insider tarama yapılmadı** — Ahmet Olmüster atanması (9 Nisan) = KAP pay bildirimi taraması tetikleyicisi; taranmadı.
- **Aylık trafik KPI bildirimleri (KAP) çekilmedi** — RPK/ASK/LF aylık KAP bildirimleri veri koleksiyonuna dahil edilmedi.

### Bundan Sonra:
- **D&A = upstream'den sıfır tolerans (4. direktif, artık hard bloker)** — CF tablosu "Amortisman ve İtfa" satırı; dipnot 11-12; IFRS 16 ROU amortismanı. Üçü olmadan canonical fact pack yayımlanmaz. Null → parse_standardization'a geçiş YOK.
- **Aylık trafik KPI bildirimleri THYAO manifest'ine ekle** — Her analizde son 3 aylık trafik bildirimi (RPK/ASK/LF) KAP ID + URL ile.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **D&A hâlâ çekilmedi — downstream EBITDA null zinciri** — EBITDA = EBIT + D&A; D&A sağlanmadığı için parse → financial_analysis → valuation zinciri tamamen kırıldı. Bu 3. THYAO analizinde aynı hata.
- **IFRS 16 ROU varlık amortismanı ayrıştırılmadı** — Havacılık EBITDAR hesabı için IFRS 16 kira gideri ve ROU amortismanı ayrı satır olarak gelmeli. "IFRS 16 P0 direktifi" 3 analizdir yerine getirilmedi.
- **FY2020–2023 seri güven seviyesi düşük kaldı** — 5 yıllık seri zorunlu kuralı var; ancak eski yılların verileri "low confidence" olarak işaretlendi ve tamamlanmadı. parse_standardization'a geçilmeden önce bunlar tamamlanmalıydı.
- **CEO/YK değişimi sonrası insider pay taraması yapılmadı** — Ahmet Olmüster atanması (9 Nisan) tetikleyiciydi. KAP pay bildirimi taraması = zorunlu; "bulunamadı" sonucu bile kayıt altına alınmalı.
- **THYAO bağlı ortaklık trafik verisi KAP bildirimleri çekilmedi** — Aylık trafik KPI (RPK/ASK/LF) KAP bildirimleri veri koleksiyonuna dahil edilmedi; context_extraction ve financial_analysis bu veriyi göremedi.

### Bundan Sonra:
- **D&A THYAO için birincil kaynak zinciri (P0 — 3. direktif, artık tolerans sıfır):**
  1. KAP yıllık rapor → Nakit Akış Tablosu "Amortisman ve İtfa" satırı
  2. Dipnot 11-12 (maddi/maddi olmayan varlıklar)
  3. IFRS 16: "Kullanım Hakkı Varlığı Amortismanı" ayrı satır (dipnot)
  D&A null → CF tablosu parse edilmeden output YOK.
- **IFRS 16 kira ayrıştırması zorunlu iki satır:** (1) Sabit varlık amortismanı, (2) ROU varlık amortismanı (IFRS 16). Her ikisi olmadan canonical fact pack yayımlanmaz.
- **5 yıllık seri tamamlanmadan geçiş yok** — FY2020-2023 low confidence ise pre-flight: tüm yılları KAP XBRL + PDF 5 adım protokolüyle tamamla, sonra parse_standardization'a gönder.
- **CEO/YK değişimi insider tarama otomatik tetiklenir** — Değişim tarihinden ±7 gün KAP pay bildirimleri: ad/soyad ile aranan yöneticiler. Sonuç: pozitif bulgu veya "tarandı — bulunamadı" kaydı.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **D&A bu analizde de null — 4. THYAO direktifi, artık tolerans SIFIR** — depreciation_amortization: null; investing_cash_flow: null; capex: null; free_cash_flow: null. EBITDA null zinciri tüm pipeline'ı kırdı. Kök neden: D&A upstream'den çekilmeden parse'a gönderildi.
- **IFRS 16 ROU amortismanı ayrıştırılmadı** — THYAO +$25B kira yükümlülüğü; EBITDAR hesabı için zorunlu. Bu direktif 4 THYAO analizinde uygulanmadı.
- **FY2020–2023 seri güven seviyesi düşük kalmaya devam ediyor** — 5 yıllık seri zorunlu kuralı var; eski yıllar "low confidence" kalıyor. KAP XBRL + PDF protokolü çalıştırılmadı.
- **CEO/YK değişimi (9 Nisan 2026) sonrası insider tarama yapılmadı** — KAP pay bildirimi taraması zorunlu; 4 THYAO'da da uygulanmadı.
- **Aylık trafik KPI bildirimleri (RPK/ASK/LF) manifest'e dahil edilmedi** — THYAO için kritik operasyonel veri; context_extraction ve financial_analysis bu veriyi göremedi.
- **Yönetim Kurulu Raporu (THYAO_Yonetim_Kurulu_Raporu_20260416.pdf) okunmadı** — CEO mandate'de "ÖNCE OKU" direktifi vardı; bu kaynak manifest'te yer almıyor.

### Bundan Sonra:
- **D&A = upstream'den HARD BLOKER (4. direktif, tolerans sıfır aşıldı)** — D&A null → parse_standardization'a geçiş YOK. Tüm yollar tüketilmeli: (1) CF "Amortisman ve İtfa" satırı, (2) Dipnot 11-12, (3) IFRS 16 ROU amortismanı ayrı satır. Üçü başarısız → CEO eskalasyonu + pipeline durdurulur.
- **YK Raporu THYAO analizinde ilk fetch görevi** — THYAO_Yonetim_Kurulu_Raporu manifest'in 1. sırasında yer alacak; finansal tablo PDF'lerinden önce okunacak.
- **Trafik KPI bildirimleri THYAO zorunlu manifest kalemi** — Son 3 aylık KAP trafik bildirimleri (RPK/ASK/LF) KAP ID + URL ile; manifest tamamlanmadan çıktı gönderilmez.

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **FY2021-2023 IS/BS verileri "[VERİ ÇEKME]" ile bırakıldı** — Manifest'te 5 yıllık kapsam taahhüt edildi; ancak FY2021-2023 için gelir tablosu ve bilanço satirlari doldurulmadi. Sadece FY2025 ve kısmen FY2024 tam. 5 yıllık seri zorunludur.
- **CF ve SE tabloları kısmi kaldı** — Reconciliation "CF/Özsermaye Tabloları ⚠️ KISMİ" olarak flagledi. OCF/FCF doğrulandı ama ICF, Finansman CF ve özsermaye hareket tablosu (SE) eksik kaldı.
- **Quarterly data sunulmadı** — Deep dive = quarterly + 5 yıl zorunlu kuralına karşın Q1-Q4 2024/2025 quarterly breakdown gönderilmedi.
- **Canonical fact pack net biçimde yayımlanmadı** — Downstream ajanlara tek onaylı fact pack sunulmadı; çelişen rakamlar (ticari borç 19,628 vs 68,762 mn) birden fazla agent tarafından farklı yorumlandı.
- **İçeriden işlem taraması eksik** — KAP'ta yönetim işlemleri taraması zorunlu; çıktıda hiç değinilmedi.
- **İsdemir (EREGL %94.87) finansal verileri ayrıca toplanmadı** — Konsolide + segment (Erdemir / İsdemir ayrımı) ayrı manifest kalemlerinde olmak zorunda.

### Bundan Sonra:
- **FY2021-2023 için minimum veri seti tamamla, bırakma** — KAP XBRL veya yıllık rapor PDF'ten en az Revenue/Net Profit/Total Assets/Net Debt 5 yıllık seri olmadan deep dive output gönderme.
- **CF ve SE olmadan output gönderme** — Sadece OCF değil; ICF (yatırım CF), Finansman CF ve özsermaye hareket tablosu (SE) tam olmadan çıktı gönderilmez.
- **Canonical fact pack zorunlu** — Her analizin sonunda FY başına tek onaylı anahtar rakam tablosu (Revenue/EBITDA/Net Profit/Net Debt/OCF) yayımla; downstream bu tabloya kilitlenir.
- **İsdemir KAP ID'si ayrı tara** — EREGL konsolide ile İsdemir birleşik bağlı ortaklık bildirimleri segment ayrımı için zorunlu.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu
### Eksikler:
- Cikti yalnizca `Mock completed output for data_collection.` seviyesinde kaldi; KAP/SPK/XBRL veya faaliyet raporu PDF'den cekilmis tek bir ham veri, tablo ya da kaynak izi yok.
- 5 yillik gelir tablosu, bilanço, nakit akisi, ozkaynak degisim tablosu ve Chairman'in zorunlu metriklerini destekleyecek satir bazli veri paketi downstream'e verilmedi.
### Bundan Sonra:
- Her raporda output icinde zorunlu olarak `kaynak dosya + tablo adi + satir kalemi + donem` bazli ham veri ozetini ver; mock/placeholder cikti YASAK.
- Cash flow, working capital ve borc metrikleri icin gerekli satirlari toplamadan `completed` deme; eksik varsa upstream talep veya alternatif kaynak dene, sonra eskale et.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu Post-Report Loop
### Eksikler:
- DSO, DIO, DPO, CCC, NWC/hasilat, NWC gun, cari oran, asit-test, faiz karsilama ve Cash FAVOK icin gerekli alt satirlar ham veri paketine konmadi.
- Faaliyet raporu/IR tarafindan yonetim rehberi, capex plani, abone/KPI seti ve telekom makro gecis mekanizmasini destekleyecek veri toplama izi olusmadi.
### Bundan Sonra:
- Chairman ratio coverage icin gerekli alt satirlari ayri `working_capital`, `liquidity`, `leverage`, `returns`, `cash_flow` bloklari halinde topla; downstream hesap beklemesin.
- Her veri paketi, birincil kaynak linki veya belge kimligi olmadan `ready` ilan edilmeyecek; mock, summary veya ic platform referansi veri kaynagi sayilmayacak.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Post-Report Feedback Loop
### Eksikler:
- Son 7 gun KAP filtre talebine ragmen veri toplama seti olay zincirini besleyecek dar pencereyi ayri manifestte vermedi.
- Telekom icin abone, ARPU, churn, capex guidance, spektrum ve enerji maliyeti gecislerini destekleyecek operasyonel ham veri paketi olusmadi.
### Bundan Sonra:
- Data collection her raporda `mandatory ratio inputs` ve `sector KPI inputs` diye iki ayri ham veri bolumu yayinlayacak; finansal ve operasyonel girdiler karismayacak.
- Mandate belirli bir pencere istiyorsa, genis arsiv ayri ek olabilir ama istenen pencere ayri authoritative output olarak zorunlu verilecek.

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Cash Flow Statement tamamen çekilmedi** — OCF/FCF/CAPEX confidence 0.00. Pipeline'ı 3 tur boyunca bloke etti. Bu tek hata QA skoru 0.80 eşiğini geçirdi.
- **Statement of Changes in Equity (SE) eksik** — 141B TRY D1 gap 3 QA turunda da çözümsüz kaldı. ROE/P/BV ±21% belirsizliğe yol açtı.
- **Working capital alt kalemleri eksik** — AR, AP, Inventory satır bazlı extract edilmedi; DSO/DIO/DPO/CCC tamamen blocked.
- **"CONDITIONAL PASS" kararı verdi** — CEO direktifi conditional_pass = BLOCK. Bu karar data_collection'ın yetkisi dışında; QA/CEO'nun kararıdır. Pipeline yanlış açıldı.
- **5 yıllık historical data yetersiz** — Sadece 2024 IS tam; 2020-2023 gelir tablosu, bilanço yalnızca tahmin bazlı (conf. 0.70-0.75).

### Bundan Sonra:
- **CF tablosu olmadan output GÖNDERME** — KAP PDF'ten CF sayfası (Operating/Investing/Financing sections) çekilmeden parse_standardization'a veri geçirme.
- **SE tablosu olmadan output GÖNDERME** — Statement of Changes in Equity (özsermaye hareket tablosu) her analizde zorunlu. Eksikse pipeline'ı bloke et, CEO'ya escalate et.
- **"CONDITIONAL PASS" kararı verme** — Data quality kararı yalnızca QA/CEO verir. Sen yalnızca veriyi topla, downstream ile "bloker" veya "temiz" olarak paylaş.
- **IFRS 16 havacılık şirketlerinde:** ROU varlıklar + lease borcu ayrı satırda çekilmeli; Net Borç formülü için finansal kiralama borcu ayrıştırılmalı.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **CF/SE tabloları Tour 2'de de çekilemedi** — "UPSTREAM BLOCKER" eskalasyonu yapıldı ama çözüm gelmedi. KAP PDF script (node fetch-pdf.js) çalıştırılmadı; "bekliyorum" modunda kaldı. CEO direktifi: "veri yok YASAK — 5 adım tüket."
- **Canonical fact pack üretilmedi** — Revizyon turu sonunda downstream için tek onaylı fact pack yayımlanmadı. Çelişen rakamlar (share count, private label %) birden fazla agent tarafından farklı yorumlandı.
- **Private label erozyon mekanizması analiz edilmedi** — %59 → %54 düşüş tespit edildi ama hangi ürün kategorilerinde, hangi tedarikçilerle ilgili olduğu açıklanmadı.
- **Temettü hesabı KAP'tan doğrulandı ✓** — 14 TL × 600M = 8.4B TRY hesabı ile share count teyit edildi. Bu iyi uygulama.

### Bundan Sonra:
- **Perakende sektörü zorunlu ek veriler** — SSSG (aynı mağaza satış büyümesi), net yeni mağaza sayısı (açılan - kapanan), mağaza başı gelir (TRY/mağaza/yıl), inventory turnover days — bunlar perakende analizinin temel KPI'ları; 5 yıllık time-series zorunlu.
- **CF tablosu olmadan pipeline'ı DURDUR, alternatif yol ara** — KAP PDF'ten CF çekilemiyorsa: (1) XBRL parser ile dene, (2) KAP'ta tablo formatında sunum var mı bak, (3) IR sayfası kontrol et. 3 yol da başarısızsa CEO'ya "5 adım tüketildi, insan müdahalesi gerekli" eskalasyonu gönder.
- **Canonical fact pack zorunlu çıktı** — Her revizyon turunda, verilen tüm rakamlara tek referans noktası oluştur: FAVÖK, net kar, hisse adedi, brüt kar, private label % — her birinin yanında belge seviyesi kaynak. Bu downstream çelişmeleri önler.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **Revenue Q4/FY karışıklığı "RESOLVED" ilan edildi ama yanlış çözüme kilitlendi** — 802.669 milyar TRY = Q4 2025 verisi; FY2025 = 2.76 trilyon TRY. data_collection Round 2'de "802.669 M TRY audited FY2025" diyerek canonical fact pack'e yanlış değer girdi. Bu hatayı financial_analysis ve reconciliation downstream'e taşıdı. P0 "RESOLVED" sayılmamalıydı.
- **KAP PDF script çalıştırılmadı** — CEO mandatında "node scripts/fetch-pdf.js KAP 1512431" direktifi verilmişti. İki revision turunda da bu adım atlandı; script çalıştırılmadan "CANNOT EXECUTE" ile eskalasyon yapıldı. Script başarısız olsa bile log göster, "bekleniyorum" modunda kalma.
- **IFRS 8 segment EBITDA %0 extraction** — TUPRS, TCELL, AKBNK, EREGL, FROTO, ARCLK segment verileri iki tur boyunca çekilemedi. Holding valuation için kritik; alternatif yollar (GCM SOTP'taki segment verileri, KAP XBRL segmenti) tüketilmeden "BLOCKED" denildi.
- **Ticari alacaklar hiç elde edilemedi** — DSO hesabı için zorunlu. Fintables 403 aldı ama Teknik Piyasa sayfası ve GCM raporu kaynak olarak işaretlendi; içerikleri çekilmedi. "Sources identified but not yet retrieved" = görev tamamlanmadı.
- **Canonical fact pack yayımlanmadı** — 802.669B TRY hatalı revenue değeri downstream'e canonical figure olarak geçti; bu 4+ agent'ta hatalı marj hesabına yol açtı.

### Bundan Sonra:
- **Revenue Q4 vs FY ayrımını her zaman açıkça etiketle** — "Q4 2025 (3 ay): 802.669B TRY" ve "FY2025 (12 ay): 2.76T TRY" iki ayrı satır olarak canonical fact pack'e gir. Asla birini diğeri yerine koyma.
- **Script çalıştırma sonucunu raporla** — KAP PDF script komutu çalıştırıldıysa çıktıyı göster; başarısızsa hata mesajını göster. Sessiz "BLOCKED" yasak.
- **IFRS 8 için alternatif kaynak sırası:** (1) KAP XBRL segment tablosu, (2) GCM/analist SOTP'taki segment breakdown'ı, (3) faaliyet raporu PDF sayfa 20-35. Üçü de başarısızsa CEO'ya "5 adım tüketildi" eskalasyonu.
- **Holding raporunda FY geliri doğrulanmadan canonical fact pack yayımlama** — KAP'ta "konsolide gelir tablosu" satırını doğrudan gör, tahmin veya proxy kullanma.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **CAPEX gerçek veriden değil proxy'den hesaplandı** — Enerjisa 23.5B biliniyordu ama diğer segmentler tahmin. Holding analizi için her segment CAPEX'i ayrı KAP PDF'inden çekilmeli.
- **Nakit bakiyesi LOW confidence** — Opening/closing cash balance reverse-engineer ile üretildi. Bilanço nakit satırı KAP'tan doğrudan okunmadı.
- **Working Capital değişimleri OCF bridge residual'dan türetildi** — DSO/DIO/DPO/CCC hesabı için Trade Receivables, Inventory, Trade Payables ayrı satırlar çekilmedi.
- **5 yıllık IS tablosu büyük bölümü PENDING** — COGS, Gross Profit, OPEX, D&A, Finance Income/Cost 2020-2024 arası tamamlanmadı.
- **Bağlı ortaklık CAPEX konsolidasyon ayrımı yapılmadı** — Holding-only vs konsolide CAPEX farkı gösterilmedi.

### Bundan Sonra:
- **Holding analizi = segment CAPEX tablosu ZORUNLU:** Her iştirak (Akbank, Enerjisa, Brisa, Çimsa vb.) için ayrı CAPEX satırı KAP/IR'den çekilmeli. "Proxy" veya "estimate" YASAK.
- **Nakit bakiyesi doğrudan bilanço satırından:** BS satırında "Nakit ve Nakit Benzerleri" doğrudan okunacak; reverse-engineer YASAK.
- **WC döngüsü için 5 alt satır ZORUNLU:** Trade Receivables, Inventory, Other Current Assets, Trade Payables, Other Current Liabilities — ayrı ayrı çekilmeli.
- **IS zinciri %100 dolu olmadan canonical fact pack üretme:** COGS eksikse Gross Profit hesaplanamaz; D&A eksikse EBIT bridge kurulamaz. Eksik varsa CEO'ya escalate et.

---
