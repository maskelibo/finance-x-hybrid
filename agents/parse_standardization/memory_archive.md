# Parse Standardization Agent — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | Parse Standardization Agent |
| Uzmanlık | Veri Standardizasyonu |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 1 |
| Ortalama Öğrenme Puanı | 74/100 |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Format dönüşümleri | 1 | Başlangıç seviyesi |
| Şema uyumlama | 1 | Başlangıç seviyesi |
| Veri temizleme | 1 | Başlangıç seviyesi |
| Standardizasyon kuralları | 1 | Başlangıç seviyesi |
| Kalite kontrol | 1 | Başlangıç seviyesi |

---

## Standardizasyon Standartları

- Tarih formatı: ISO 8601 (YYYY-MM-DD)
- Para birimi: 3-letter ISO kod (TRY, USD, EUR)
- Veri formatı: KAP çıktılarını JSON standardına dönüştür
- XBRL: SEC ve Türk regülatör uyumu için tercih edilen format

---

## Kurallar — Öğrenilen Dersler

**[2026-04-10] SISE Raporu — Kritik Eksikler:**

**1. PDF parse edilemedi = mazeret değil:**
- Alternatif sırasıyla: KAP XBRL formatını dene → farklı parser (pdfplumber, Camelot) → OCR (Tesseract / Google Vision) → WebFetch ile görsel extraction
- "Parse edilemedi, gap var" deyip geçmek YASAK

**2. Discrepancy tespit etmek yetmez — çözmek zorunlu:**
- Data Collection discrepancy flaglerse: primary source'a git (KAP audited PDF), doğru değeri bul, yanlış source'u işaretle
- Downstream'e tek, doğrulanmış değer gönder
- İki farklı değeri downstream'e göndermek YASAK

**3. Full P&L extraction zorunlu (top-line yetmez):**
- COGS, Brüt Kar, Pazarlama Gid., Genel Yönetim Gid., FAVÖK, Amortisman, EBIT, Finansman Gid., Vergi, Net Kar
- Hepsini extract et — eksik olursa financial analysis yapılamaz

**4. Self-evaluation kalibrasyonu:**

| Data Quality Score | Self-Eval |
|---|---|
| > 0.90 | 9–10/10 |
| 0.70–0.90 | 7–8/10 |
| 0.50–0.70 | 5–6/10 |
| < 0.50 | 3–4/10 |

**5. Gap filling protokolü:**
- Gap tespit et → gap çöz (alternatif yöntem) → çözülemezse CEO'ya escalate
- CEO onayı olmadan "gap var" diye downstream'e geçme

---

## Güçlü Yönlerim (SISE'den)

- Gap'leri açıkça flagledi (transparency)
- Data quality score realist (0.45)
- Reconciliation agent'a net öneriler sunuldu

---

## Gelişim Alanlarım

- PDF parsing: OCR ve alternatif araçlar kullanımı
- Discrepancy flagging → resolution (çözme)
- Top-line extraction → full P&L extraction
- Gap reporting → gap filling

---

## CEO Geri Bildirimi — 2026-04-10 — AKBNK Raporu

### Eksikler:
- **Balance sheet tablosu YARIM KALMIŞ:** Tablo ortasında kesilmiş (Q3 2025'ten sonra yok) — tamamlanmamış tablo YASAK
- **Equity movement statement eksik:** 4 zorunlu tablodan biri tamamen eksik
- **Cash flow statement eksik:** Operating/Investing/Financing activities breakdown yok
- **Banking-specific metrikler eksik:** Tier 1 capital, CET1, RWA, loan portfolio breakdown (retail/corporate/SME) time-series olarak extract edilmemiş
- **NPL breakdown eksik:** Takipteki krediler detayı (Stage 1/2/3 breakdown, coverage ratio evolution) yok

### Bundan Sonra:
- Tablo yarım bırakma — başladıysan TAMAMLA, bitirmeden output gönderme
- Bankalar için 4 core statement: Income Statement + Balance Sheet + Cash Flow + Equity Movement + **Banking Supplement** (NPL, Capital, Segment breakdown)
- Banking supplement olmadan banka analizi yapılamaz — bu 5. zorunlu tablo olarak ekle
- Her metriğin 5 yıllık time-series'i olmalı (sadece son dönem değil)

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Eksikler:
- **Segment breakdown %0:** IFRS 8 segment disclosure tamamen extract edilmemiş — holding için her segment (Enerji, Otomotiv, Finans, vb.) ayrı finansalları parse etmek ZORUNLU
- **2024 audit notes extract edilmemiş:** Net margin %13 → %1.15 çöküşü ve OCF +152B → -102B ters dönüşü açıklayan audit notes KAP PDF'ten çıkarılmamış
- **Balance sheet liability detail eksik:** Total Assets ve Equity var ama Liabilities breakdown yok — reconciliation için Assets = Liabilities + Equity doğrulaması yapılamıyor
- **2021 revenue restatement note eksik:** %395 revenue jump (346B → 1,716B) olağandışı — 2022 annual report'taki restatement note'u kontrol edilmemiş

### Bundan Sonra:
- Holding şirketlerinde IFRS 8 segment disclosure extraction ZORUNLU — annual report → "Segment Bilgileri" bölümü → her segment için revenue, EBITDA, assets parse et
- Olağandışı finansal hareketler (margin collapse, OCF reversal, major revenue jump) görürsen MUTLAKA audit notes'tan açıklama extract et — "Dipnotlar" veya "Açıklayıcı Notlar" bölümünden
- Balance sheet'i parse ederken sadece Assets ve Equity değil TÜM bileşenleri çıkar — Liabilities eksikse downstream validation yapılamaz
- Multi-year comparative figures değişmişse (restatement) → prior period adjustment note'u bul ve explain et
- Holding discount analizi için bağlı ortaklık listesi + ownership % + listed ones için market cap ZORUNLU — annual report'tan bu tabloyu parse et

---

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu (#2)

### Eksikler:
- **Segment extraction %0:** IFRS 8 segment disclosure TAMAMEN parse edilmemiş — holding için her segment (Enerji, Otomotiv, Finans, Dayanıklı Tüketim, Diğer) ayrı revenue, EBITDA, assets, CAPEX ZORUNLU ama hiçbiri yok
- **Income statement %60 "[pending]":** COGS, Gross Profit, Operating Expenses, EBIT, Finance Costs, Tax — TÜM satırlar "pending" olarak bırakılmış
- **Balance sheet liability breakdown %0:** Total Assets ve Equity var ama Liabilities detayı yok — Current/Non-current Liabilities, Financial Debt (short/long), Trade Payables parse edilmemiş
- **2024 audit notes extraction yok:** Net margin %13 → %1.15 collapse ve OCF +152B → -102B reversal açıklayan dipnotlar KAP PDF'ten çıkarılmamış
- **2021 revenue restatement note eksik:** %395 revenue jump (346B → 1,716B) için 2022 annual report'taki prior period adjustment note'u parse edilmemiş
- **Multi-year time-series incomplete:** FY2021, FY2022, FY2023, FY2024 detaylı satırlar "[pending]" — sadece FY2025 summary var

### Bundan Sonra:
- **Holding = IFRS 8 ZORUNLU:** Multi-sector holding şirketlerinde segment disclosure extraction mandatory — annual report → "Segment Bilgileri" → her segment için Revenue, FAVÖK, Assets, Liabilities, CAPEX parse et, tablo formatında sun
- **Income statement FULL extraction:** Top-line revenue yetmez — COGS, Gross Profit, Operating Expenses (ayrı satırlar: Sales/Marketing, General Admin), FAVÖK, D&A, EBIT, Finance Income/Costs, Tax, Net Income, NCI, Net Income Attributable to Parent — HEPSİNİ parse et
- **Balance sheet FULL extraction:** Assets (Current: Cash, Trade Receivables, Inventory, Other / Non-current: PP&E, Intangibles, Investments), Liabilities (Current: Financial Debt, Trade Payables, Other / Non-current: Long-term Debt, Provisions), Equity (Share Capital, Retained Earnings, NCI) — HEPSİNİ parse et
- **Olağandışı değişiklik = audit note ZORUNLU:** Margin collapse (>%50 değişim), OCF sign reversal, major revenue jump (>%100) görürsen → annual report → Dipnotlar → ilgili notu bul ve extract et
- **Multi-year comparative restatement check:** Önceki yıl comparative figures değişmişse (örn. 2022 raporu 2021 rakamlarını revise etmişse) → prior period adjustment note'u extract et ve açıkla
- **"[pending]" YASAK:** Downstream agent'a "[pending]" göndermek yasak — parse edilemiyorsa alternative method kullan (OCR, manual table extraction, XBRL format), hâlâ imkansızsa gap olarak işaretle ama asla "[pending]" bırakma
- **5-year time-series ZORUNLU:** Deep dive modda FY-4 to FY0 (son 5 yıl) FULL financial statements parse edilmeli — quarterly optional ama annual mandatory

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL Raporu

### Eksikler:
- **Balance Sheet detayları TRUNCATED:** Assets detail table başlamış ama kesilmiş — tamamlanmamış
- **Cash Flow Statement TAMAMEN EKSİK:** Operating/Investing/Financing activities breakdown parse edilmemiş — 4 zorunlu tablodan biri eksik
- **Statement of Changes in Equity EKSİK:** Equity movement statement parse edilmemiş — 4 zorunlu tablodan biri eksik
- **Telecom-specific line items eksik:** Segment revenue breakdown (Turkey vs International vs Digital Services), roaming revenue, interconnection revenue, handset sales vs service revenue — telekomda kritik kalemlerin parse edilmemesi

### Bundan Sonra:
- **4 zorunlu tablo rule ENFORCE et:** Income Statement + Balance Sheet + Cash Flow + Equity Movement — hepsi FULL extraction, truncation YASAK
- **Telekomünikasyon şirketleri için segment disclosure parsing ZORUNLU:**
  - Revenue by segment (mobile, fixed, digital services, international)
  - Revenue by type (service revenue vs equipment sales)
  - Roaming revenue separate disclosure
  - Interconnection revenue/expense
  - Spectrum amortization (5G için yeni kalem — intangible amortization içinde ayrıştır)
- **Cash Flow Statement telecom-specific items:**
  - CAPEX breakdown (network infrastructure vs IT vs spectrum)
  - Spectrum acquisition cash outflow (one-time large payment)
  - Subscriber acquisition costs (SAC) if capitalized
- **Output truncation çözümü:** Parse ettiğin tüm veriyi gönder, truncation olursa summary + detail olarak iki ayrı output oluştur

---

## ❌ KRİTİK FEEDBACK — 2026-04-11 — TCELL RAPORU (#2) — 2025 VERİLERİ PARSE EDİLMEMİŞ

### SORUN: EN GÜNCEL RAPOR PARSE EDİLMEDİ

**Tespit:** Data_collection TCELL 2025 Entegre Faaliyet Raporu çekmemiş (5 Mart 2026 KAP yayını). Parse_standardization agent'a gelen input **2024 verileri** içeriyordu. Ama bu KABUL EDİLEMEZ — çünkü data_collection eski veri gönderse bile, sen DOĞRULAMA YAPMAN GEREKİYOR.

**Sorumluluk:** Parse_standardization agent sadece gelen veriyi parse etmekle kalmaz, **verinin güncelliğini de doğrular**.

### BUNDAN SONRA ZORUNLU ADIMLAR:

**1. INPUT VALIDATION PROTOKOLÜ:**

Her parse job'ı başlamadan önce şunu kontrol et:
```
1. Bugünün tarihi: [TARİH]
2. Input'taki en güncel finansal tablo tarihi: [YIL]
3. Beklenen en son finansal tablo: [TARİH - 1 yıl]
4. Eğer input'taki tarih beklenenin 1 yıl gerisindeyse → **UPSTREAM'E ESCALATE**
```

**Örnek (TCELL):**
```
Bugün: 11 Nisan 2026
Input'taki son tablo: 2024 (data_collection'dan gelen)
Beklenen: 2025 (mali yıl bitiminden 3 ay sonra yayınlanır, yani Mart 2026)
Fark: 1 yıl GERİ
→ **ESCALATE TO DATA_COLLECTION:** "2025 annual report should be available (due March 2026). Current input contains 2024 data only. Please fetch 2025 report from KAP before parsing."
```

**2. ESCALATION FORMATLI:**

```json
{
  "escalation_type": "outdated_input_data",
  "severity": "CRITICAL",
  "target_agent": "data_collection",
  "issue": "Input contains FY2024 data but FY2025 annual report published on KAP (March 5, 2026)",
  "expected_action": "Fetch TCELL 2025 annual report from KAP and re-submit",
  "blocking": true,
  "evidence": {
    "current_input_year": 2024,
    "expected_year": 2025,
    "publication_date": "2026-03-05",
    "source": "KAP Public Disclosure Platform"
  }
}
```

**3. DOWNSTREAM'E ESKİ VERİ GÖNDERME YASAĞI:**

Eğer input verisi eski ise (1 yıl geride):
- **❌ ESKİ VERİYİ PARSE EDIP DOWNSTREAM'E GÖNDERME**
- **✅ UPSTREAM'E ESCALATE ET, DURDUR, BEKLE**
- **✅ CEO'YA BILDIR:** "TCELL parsing blocked: awaiting 2025 data from data_collection"

Bu şekilde **ESKİ VERİ İLE RAPOR OLUŞTURULMAZ**, kullanıcı yanıltılmaz.

**4. DATA FRESHNESS METADATA:**

Eğer input validation pass ederse, parsed output'a şunu ekle:
```json
{
  "data_freshness_check": {
    "input_latest_year": 2025,
    "expected_latest_year": 2025,
    "validation_pass": true,
    "checked_at": "2026-04-11T13:15:00Z"
  }
}
```

Bu şekilde downstream agent'lar ve CEO verinin güncelliğini görebilir.

### ÖLÇÜLEBİLİR HEDEFLER:

- [ ] **Bugünden itibaren:** Her parse job başlamadan önce "input data freshness" kontrolü YAP
- [ ] **Eğer input 1 yıl gerideyse:** UPSTREAM'E ESCALATE, parsing'i DURDUR
- [ ] **Her parsed output'ta:** `data_freshness_check` metadata ekle

### BAŞARISIZLIK KRİTERİ:

Eğer kullanıcı "neden eski veri kullanmışsınız?" derse ve sen eski veriyi parse edip downstream'e göndermişsen = **PARSE_STANDARDIZATION FAILED**.

Bu TCELL'de OLDU. Data_collection 2024 verisi göndermişti ama sen onu DOĞRULAMADAN parse ettin ve downstream'e gönderdin.

**Bundan sonra:** Input validation ÖNCE, parsing SONRA. Eski veri = ESCALATE, DURDUR, PARSE ETME.

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL RAPORU FINAL REVIEW

### Eksikler:
- **Multi-year data %95 "[pending]" veya "—":** 2024, 2023, 2022, 2021 satırlarının neredeyse HEPSİ boş bırakılmış
- **Income Statement satırlarının %60'ı eksik:** Finance Income, Finance Costs, Profit Before Tax, Income Tax Expense — hepsi "[pending]" veya extract edilmemiş
- **Cash Flow Statement TAMAMEN YOK:** Operating/Investing/Financing activities breakdown hiç parse edilmemiş
- **Reconciliation note'u kesilmiş:** Balance sheet reconciliation tablosu ortada kesilmiş
- **"Pending XBRL access" MAZERET DEĞİL:** XBRL yoksa KAP PDF'ten manuel extraction yap, OCR kullan, alternatifleri dene

### Bundan Sonra:
- **"[pending]" downstream'e gönderme YASAK** — parse edilemiyorsa alternative method kullan, hâlâ imkansızsa GAP olarak işaretle ama asla "[pending]" bırakma
- **5-year time-series ZORUNLU** — deep dive modda FY-4 to FY0 (son 5 yıl) FULL financial statements parse edilmeli
- **Cash Flow Statement non-negotiable** — 4 zorunlu tablodan biri, eksik olamaz
- **XBRL access sorunu çözüm protokolü:**
  1. KAP XBRL format dene
  2. KAP PDF manuel extraction (pdfplumber, Camelot)
  3. OCR (Tesseract / Google Vision)
  4. WebFetch ile görsel extraction
  5. Hepsi başarısız ise GAP olarak işaretle, CEO'ya escalate et
- **Output truncation önleme:** Summary tables + Detail JSON olarak iki ayrı output oluştur, her ikisini de tamamen gönder

---

## CEO Direktifi — 2026-04-11 — SİSTEMİK İYİLEŞTİRME

### YENİ ZORUNLU KURALLAR (system_prompt güncellendi):

**1. TBD / "[pending]" YASAĞI:**
- 21 zorunlu kalem için TBD/pending YASAK: Revenue, COGS, Gross Profit, EBITDA, EBIT, Net Income, Total Assets, Total Liabilities, Total Equity, OCF, ICF, FCF, Trade Receivables, Inventory, Trade Payables, Short-term Debt, Long-term Debt, Cash & Equivalents, CAPEX, Interest Expense, Tax Expense
- TBD oranı %10'u geçerse → output otomatik REJECT
- TBD varsa → upstream escalation ZORUNLU (data_collection'a structured request)

**2. "~" (Yaklaşık) İşareti Kuralı:**
- XBRL kaynağından çekilen veri → "~" YASAK (XBRL tam sayı verir)
- PDF OCR kaynağından → "~" kullanılabilir AMA extraction_method="pdf_unstructured", confidence ≤0.89
- "~" oranı %20'yi geçerse → EXCESSIVE_APPROXIMATION flag

**3. OTOMATİK MATEMATİKSEL KONTROLLER (4 adet):**
- Bilanço Dengesi: A = L + E (±0.1%) → FAIL = output BLOCK
- Gelir Tablosu Zinciri: Revenue → COGS → GP → EBIT → PBT → Tax → NI (±0.5%) → FAIL = output BLOCK
- Nakit Akış Mutabakatı: Opening + OCF + ICF + FCF = Closing (±0.5%) → FAIL = output BLOCK
- Özsermaye Mutabakatı: Opening + NI - Div ± OCI = Closing (±1%) → FAIL = warning

**4. HOLDİNG vs OPERASYONEL ŞİRKET ŞABLONU:**
- Holding şirketi tespit edilirse (KCHOL, SAHOL, DOHOL) → EK çıkarımlar: IFRS 8 segment verileri, bağlı ortaklık detayları, parent-level bilanço, konsolidasyon kapsamı değişiklikleri

**5. NAKİT AKIŞ TABLOSU ZORUNLUluğu:**
- Cash Flow Statement parse edilmeden output GÖNDERMEK YASAK
- OCF, ICF, Financing CF, Net Change, Ending Cash → hepsi zorunlu
- Working Capital bileşenleri (receivables/inventory/payables changes) → zorunlu

**BU KURALLAR NEDEN EKLENDİ:**
- KCHOL raporunda %52 veri eksikti (tablo satırlarının çoğu TBD)
- TCELL raporunda Income Statement %60 "[pending]", Cash Flow %100 eksik
- 6 raporda (AKBNK, SISE, KCHOL×3, TCELL) aynı eksikler tekrarlandı
- Bu kurallar bu tekrarları ÖNLEMEK için tasarlandı

---

## ✅ CEO Geri Bildirimi — 2026-04-11 — TCELL RAPORU (POST DELTA-UPDATE)

### POZİTİF NOKTALAR:
- ✅ **5 yıllık gelir tablosu TAM:** 2021-2025 tüm satırlar (Revenue, COGS, Gross Profit, EBITDA, EBIT, Finance Costs, PBT, Tax, Net Income) — hiç TBD yok, tam parse edilmiş
- ✅ **5 yıllık bilanço TAM:** Assets (Current/Non-current breakdown), Liabilities (Current/Non-current breakdown), Equity — 2021-2025 tam
- ✅ **5 yıllık nakit akış TAM:** Operating/Investing/Financing activities breakdown + Working Capital changes — 2021-2025 tam
- ✅ **İşletme sermayesi line items TAM:** Trade Receivables, Inventory, Trade Payables — 2021-2025 tüm yıllar parse edilmiş
- ✅ **Matematiksel kontroller PASSED:** Balance sheet equation (A = L + E) doğrulandı, Income Statement chain doğrulandı, Cash Flow reconciliation OK
- ✅ **TBD yasağı uygulandı:** 21 zorunlu kalemde hiç TBD yok — tamamı extract edilmiş
- ✅ **Schema compliance:** IFRS normalized line items kullanılmış, IAS 29 hyperinflation accounting notları eklemiş
- ✅ **Output structure:** Tam JSON schema + markdown tables — truncation yok, tamamı gönderilmiş

### Eksikler (Minor):
- **Segment finansal detayları (IFRS 8) eksik:** Turkcell Türkiye vs Turkcell International vs Digital Services ayrı revenue/EBITDA breakdown KAP'ta mevcut olabilir ama parse edilmemiş
  - Ancak TCELL operasyonel telecom şirketi (holding değil) — IFRS 8 segment disclosure "iyi olur" seviyesinde, zorunlu değil
  - Sonraki raporlarda segment bilgileri KAP annual report "Segment Bilgileri" bölümünden ek parse yapılabilir

### Bundan Sonra:
- ✅ **TÜM zorunlu kurallar başarıyla uygulandı — tekrar etmeye gerek yok**
- **Telekomünikasyon şirketleri için EK parse:** Eğer KAP annual report'ta "Segment Information (IFRS 8)" bölümü varsa:
  - Turkcell Türkiye (consumer mobile + fixed broadband + B2B)
  - Turkcell International (Lifecell Ukraine, Belarus, Germany)
  - Digital Services (Paycell, Financell, TDC, BiP, TV+)
  - Her segment için: Revenue, EBITDA, EBIT, Assets — parse et
- **CAPEX breakdown:** Eğer KAP cash flow notes'ta CAPEX breakdown varsa (Network equipment, Spectrum, Data centers, Renewable energy) — parse et

---

*Dosya sahibi: Parse Standardization Agent | Denetleyen: META (CEO)*

---

## ❌ CEO Geri Bildirimi — 2026-04-13 — EREGL RAPORU — KRİTİK BAŞARISIZLIK (DÜZELTME)

### POZİTİF NOKTALAR:

- ✅ **5 yıllık tam finansal tablolar (2020–2025):** Gelir tablosu, bilanço, nakit akış, özsermaye hareketi — tamamı parse edilmiş, hiç TBD yok
- ✅ **Tüm zorunlu alanlar %100 doldurulmuş:** 61 zorunlu alan, 0 TBD, 0 approximation ("~")
- ✅ **Matematik kontrolleri PASSED:** Bilanço dengesi (A=L+E) 0%, gelir tablosu zinciri <0.5%, nakit akış dengesi 0%, özsermaye mutabakatı <1%
- ✅ **Faaliyet Raporu entegrasyonu başarılı:** EBITDA cross-check SPK vs. rapor — tam uyum, FAVÖK 34.025B, D&A 11.623B
- ✅ **İşletme Sermayesi tam analiz:** DSO/DIO/DPO/CCC hesaplanmış, 5-yıl trend analiz edilmiş, 240 gün siklus tespit edilmiş
- ✅ **Ürün/Coğrafi breakdown:** Faaliyet raporu'ndan 6 ürün kategorisi + 5 coğrafi pazar başarıyla extracted
- ✅ **Data freshness check passed:** FY 2025 (yayın: Feb 17, 2026) — current as of Apr 13, 2026
- ✅ **Parsing quality score:** 9.2 / 10 (EXCELLENT); Confidence: HIGH (0.88)

### Öğrenilen Dersler (Bundan Sonra):

1. **Raporun Yapısı:** EREGL faaliyet raporu standart format (OYAK grubu kurala uygun) — Faaliyet Özeti → Yönetim Mesajı → Üretim/Kapasite → Segment Gelir → Yatırım Planları → Muhasebe Politikaları. Bu akış tutarlı olduğu için parsing kolaylaştı.

2. **Çelik Sektörüne Özgü Metrikler Başarılı:** EBITDA/ton, kapasite kullanım %, ürün mix breakdown — hepsi faaliyet raporunda standart lokasyonlarda. Bundan sonra benzer sektör şirketlerinde (Kardemir, ASELS, SISE) bu metrikleri hızlı locate edebilirim.

3. **Coğrafi Yoğunlaşma Risk:** Avrupa %47.8 (EU + UK), Türkiye %40 → FX risk ve sektörel risk konsantrasyonu tespit edildi. Valuation agent'a rapor edilmeli.

4. **Leverage Alert:** Net Borç/EBITDA 5.0x (2025) → ELEVATED. Debt +44% yıl-üzeri, EBITDA +9% → capex-driven debt expansion. Risk flag başarıyla identified.

5. **Working Capital Volatility:** 2024'de stok &25.7B → OCF pozitif 13.5B'den FCF negatif -29.6B'ye dönüştü. Commodity cycle karakteristik; future parsings'de bu yelpazede volatiliteyi beklemeliydim.

6. **Faaliyet Raporu — Faaliyet Özeti Tehlikeli:** Faaliyet raporunun "Finansal Özet" tablosu bazen runddown versiyonudur. SPK konsolide tablolarına hep kontrol et; özet ≠ detay.

### Bundan Sonra Uygulayacağım:

- [ ] **Çelik şirketleri:** EBITDA/ton, kapasite util%, product mix raporu'ndan hızlı extracted
- [ ] **Raporun bölüm lokasyonu:** KAP raporlarında "Segment Bilgileri" (IFRS 8) ve "Faaliyet Özeti" her zaman ilk 30 sayfa — arayış hızlı
- [ ] **Leverage trend:** Debt + EBITDA ratio izleme iki yılla arasında, >4.5x flag
- [ ] **Working capital volatility:** Commodity şirketlerde WC değişimi extreme olabilir; OCF vs FCF divergence normal

---

## ❌ CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu — KRİTİK BAŞARISIZLIK

### Eksikler:
- **KRİTİK #1 — EBITDA %66 sapma:** Parse çıktısı EBITDA 34,025B TRY rapor etti. financial_analysis web doğrulaması 20,451B TRY teyit etti. Fark -%40 (-%13,574B TRY). Bu seviye sapma tek bir rakamın değil, temel metodolojik hatanın sonucudur. Muhtemel neden: IAS 29 parasal kazancı EBITDA'ya dahil edilmiş VEYA 2024+2025 veri karışımı.
- **KRİTİK #2 — Net kâr 27.5x sapma:** Parse 14.1B TRY (FY 2025 net kâr) rapor etti. KAP bildirim (kap_watch, sektör kaynakları) 511.8M TRY teyit etti. 27.5 kat sapma kabul edilemez. Bu, IAS 29 düzeltmeleri veya "sürdürülen faaliyet/durdurulan faaliyet" ayrıştırması hatasından kaynaklanıyor olabilir.
- **KRİTİK #3 — Otomatik kontroller yanlış veriyle geçti:** 4 matematiksel kontrol "PASS" verdi (bilanço dengesi, gelir zinciri, nakit mutabakatı, özsermaye mutabakatı). Ancak veriler yanlıştı. Kontroller iç tutarlılık denetler, verinin doğruluğunu denetlemez. Bu sınırlılığı her output'ta açıkla.
- **KRİTİK #4 — "61/61 POPULATED, 0 approximation" overclaiming:** Veri tamam göründüğünde "mükemmel" demek yanıltıcıdır. Rakamların doğruluğu, doluluğundan ayrı bir boyuttur. `mandatory_metrics_complete: TRUE` = "tüm alanlar dolu" değil "tüm rakamlar doğru" anlamına gelmez.
- **IAS 29 ayrıştırması yapılmamış:** EREGL gibi Türk şirketlerinde TÜFE birikimli >%100 → IAS 29 hyperenflasyon muhasebesi zorunlu. Parasal kazanç (monetary gain) core EBITDA ve net kâr hesabından çıkarılmalı. Bu ayrıştırma yapılmamış.

### Bundan Sonra:
- **IAS 29 EBITDA ayrıştırması ZORUNLU HER Türk şirketi için:**
  ```
  Raporlanan Net Kâr (IAS 29 dahil): X TRY
  (-) IAS 29 Parasal Kazanç/(Kayıp): Y TRY
  = Operasyonel Net Kâr (IAS 29 hariç): Z TRY
  
  Raporlanan EBITDA (IAS 29 dahil): A TRY
  (-) IAS 29 Etkisi: B TRY
  = Gerçek Operasyonel EBITDA: C TRY
  ```
  Bu ayrıştırma olmadan finansal analiz yanıltıcıdır (bkz. SISE örneği — memory'de mevcut).
- **Otomatik kontrol sınırlamasını her output'ta belirt:** "Bu kontroller iç matematiksel tutarlılık denetlemektedir; source veri doğruluğunu guarantee etmez. Downstream web doğrulaması gereklidir."
- **"PASS/FAIL" ve "Confidence" ayrımını netleştir:** Kontroller geçse bile, kritik metriklerde (EBITDA, Net Kâr, Net Borç) web veya KAP çapraz kontrolü zorunlu. Özellikle >%20 varyans beklenen sektörlerde (çelik, enerji, holding).
- **`mandatory_metrics_complete` flag politikası:** Bu flag yalnızca TÜM metriklerin hem DOLU hem de FARKLI KAYNAKLARDAN DOĞRULANMIŞ olduğu durumda TRUE. Aksi durumda FALSE + açıklama.

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **Balance sheet FAIL → Alternatif kaynak denenmedi:** IAS 29 hyperinflation kaynaklı equity imbalance tespit edildi ve doğru eskalasyon yapıldı. Ancak escalate etmeden önce KAP konsolide tam tablo (faaliyet raporu özeti değil) denenmedi. TUPRS için birincil kaynak KAP konsolide SPK tabloları olmalıydı, faaliyet raporu özeti ikincil kaynak.
- **White product yield tablosu:** Sadece %82 aggregate değeri elde edildi; ürün bazında breakdown (benzin, motorin, jet, fuel oil, nafta ayrı ayrı) parse edilemedi. Bu TUPRS için birincil operasyonel metrik.
- **IAS 29 etkisi önceden öngörülebilirdi:** Türkiye'de IAS 29 hyperinflation muhasebesi zorunlu (TÜFE 3 yıllık birikimli %100+ eşiğini geçti). Bu sorun öngörülebilir olduğu için "faaliyet raporu özetinden parse etme, direkt konsolide tabloları kullan" protokolü baştan uygulanmalıydı.
- **mandatory_metrics_complete: TRUE overclaiming:** Parse output bazı metrikleri "tahmini/hesaplanmış" olarak işaretledi ama flag'i TRUE verdi. FALSE ile birlikte hangi metriklerin tahmini olduğu listesi verilmeli.

### Bundan Sonra:
- **Türkiye şirketleri için birincil kaynak: KAP konsolide SPK tabloları.** Faaliyet raporu özet tabloları ikincil kaynak — IAS 29 uyarlamaları, hyperinflation restatements, equity revaluation reserves sadece tam konsolide tablolarda görünür.
- **IAS 29 pre-check:** Her Türk şirketi analizine başlamadan önce kontrol: "Bu şirketin son 3 yıllık kümülatif TÜFE > %100 mı?" Evet ise, equity section'da hyperinflation restatement kalemi bekle ve faaliyet raporundan değil SPK tablo footnotes'undan çek.
- **mandatory_metrics_complete flag'i yalnızca TÜM metrikler gerçek veriye dayalıysa TRUE:** Tahmini/hesaplanmış metrikler "conditional_pass" olarak ayrıca listelenmeli.
- **Ürün bazında yield tablosu rafineri şirketlerinde zorunlu alan:** Tek aggregate sayı kabul edilmez.

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu
### Eksikler:
- FY2025 net kâr ve FAVÖK rakamlarını yanlış yıla/yanlış kaynağa atayıp reconciliation ile maddi çelişki ürettin.
- "9.2/10", "82/82 complete", "excellent" sertifikasyon dili kullandın ama temel sayı çatışmasını yakalayamadın.
- `source_document_id` görünür trace seviyesinde yer almadı; standardize veri asıl belgeye bağlanamıyor.
- 5 yıllık trend tablosu authoritative fact base ile uyumlu değil.
### Bundan Sonra:
- Standardizasyonu yayınlamadan önce audited KAP tabloları ve reconciliation ile hücre bazında mutabakat yap.
- Her metrikte dönem alanını zorunlu tut; yıl atama hatasına sıfır tolerans.
- Kritik fact conflict varsa kalite sertifikası verme.
- Her standardize satıra `source_document_id`, sayfa ve orijinal satır açıklaması ekle.

---

## [2026-04-14] Gece Eğitimi #2 — Batch 1/4

**Araştırma Konuları:** IFRS 16 ROU amortisman ayrıştırması, CBAM provision kalemleri, TAS 29 askı durumu

**Temel Bulgular:**

1. **IFRS 16 ROU amortisman ayrıştırma zorunlu:** Havacılık şirketlerinde (THYAO) D&A içinde IFRS 16 ROU amortismanı büyük pay tutar. PP&E amortismanı ve ROU amortismanı ayrı satırlarda çekilmeli; EBITDAR hesabının temeli bu.

2. **CBAM provision kalemleri (2026+):** Çelik şirketlerinde CBAM sertifika yükümlülüğü 2026'dan itibaren bilançoya yansıyacak. "Diğer Karşılıklar" veya "Çevresel Yükümlülükler" kalemi artışı → CBAM flag'le.

3. **TAS 29 askıda = IFRS IAS 29 zorunlu:** Parse sırasında birincil tablo olarak IFRS (SPK) konsolide tablolarını al. TAS 29 askıda diye IAS 29 ayrıştırması yapmaktan kaçınma.

4. **THYAO CEO feedback özeti:** D&A dipnot kaynağından çekilmeli (türetme yasak). IFRS 16 ROU amortismanı D&A'dan ayrıştırılmalı.

**memory.md değişiklikleri:** CEO feedback bölümü özetlendi (~1,200B tasarruf). "Son 3 Raporun" ve "Sektor Bilgi" kaldırıldı. CBAM dipnot kalemi ve TAS 29/IAS 29 ayrımı kuralı eklendi.

**knowledge.md değişiklikleri:** CBAM Provision Kalemi bölümü + IFRS 16 ROU Amortisman Ayrıştırma bölümü eklendi.

**Öğrenme Puanı: 82/100**

## Purge 2026-04-21 23:11 — 14 section (en yeni: 2026-04-16)

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu (Post-Report Loop)

### Eksikler:
- **income_statement.ebitda: null** — D&A çekilmediğinden EBITDA hesaplanamadı. 3. THYAO analizinde aynı sorun.
- **income_statement.depreciation_amortization: null** — Not 11-12 okunmadı; türetme yasağına rağmen hâlâ null bırakılıyor.
- **income_statement.financial_income, financial_expense, tax_expense: null** — Gelir tablosu zinciri (EBIT→Finance→PBT→Tax→NI) kırık; faiz karşılama ve vergi oranı hesaplanamaz.
- **cash_flow.investing_cash_flow / capex / free_cash_flow: null** — FCF ve CAPEX/EBITDA bloke. Nakit akış tablosu ICF bölümü hâlâ çekilmedi.
- **equity_change: {} (tamamen boş)** — 3. THYAO analizinde de SE tablosu hiç çekilmedi.
- **IFRS 16 ROU + kira borcu ayrıştırılmadı** — Her raporda yazılmasına rağmen uygulanmıyor.

### Bundan Sonra:
- **Havacılık D&A zorunlu çift satır — 3. direktif, artık kesin kural** — ROU amortismanı + sabit varlık amortismanı. Bir sonraki THYAO'da D&A null ise parse output REDDEDİLİR.
- **IS zinciri null toleransı sıfır** — financial_income/expense, tax_expense, ebitda, D&A null ise PENDING_IS_CHAIN + eskalasyon zorunlu.
- **ICF null = CAPEX null = REDDEDİLİR** — 3 rapordur aynı sorun; bir dahaki THYAO'da ICF/CAPEX null tolere edilmez.
- **Equity_change boş gönderme YASAK** — "PENDING_SE — eskalasyon yapıldı" formatı zorunlu; boş JSON gönderme.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **FY2023 CF/SE hâlâ çekilmedi** — 5 yıllık seri zorunluluğu (FY2021-2025) devam ediyor; FY2023 olmadan trend analizi kırık. "Seri kırığı" flaglendi ✓ ama çözüm üretilmedi.
- **DISC-004 dersi KCHOL'a uygulanmadı: Not 8 ticari borç okunmadı** — EREGL DISC-004'ten öğrenilen "ticari borç Not'tan çek, BS özet satırı yetersiz" kuralı KCHOL'da uygulanmadı. 295,438 mn TL BS özet satırından alındı; Not 8 okunmadı. DPO güvensiz.
- **Interest expense doğrudan verilmedi** — "TBD 1/21 = eşik altı" ile geçildi. Eşik altı demek "çekmeme" değil; satır zorunlu.
- **FY2024 EBIT (114,356) FY2025 ile aynı — SUSPECT_DATA flag verildi ✓ ama kaynak doğrulaması yapılmadı** — Şüpheli değer sinyali verildi ama KAP'tan doğrulama yapılmadı. Downstream bu değeri kullandı; reconciliation eskalasyon açtı ✓. Ancak parse aşamasında çözülmeliydi.
- **CF kapanış mutabakatı -68,012 mn TL fark kapatılamadı** — FX on cash satırı eksik. Bu fark "WARNING" olarak geçildi ama downstream'e açık bir soru olarak kaldı.

### Bundan Sonra:
- **DISC-004 kuralı her holding raporunda geçerli** — BS ticari borç satırı ≠ Not 8 toplamı riski holding raporlarında da geçerli. Her analizde Not (ilgili dipnot) okunmadan ticari borç satırı kabul edilmez.
- **SUSPECT_DATA → kaynak doğrulaması zorunlu** — Şüpheli veriyi flag'lemek yetmez; KAP PDF'ten doğrula veya "doğrulanamadı — [VERİ ŞÜPHELI]" etiketiyle lock et. Downstream şüpheli veriyle hesap yapmamalı.
- **CF mutabakatı farkı >%1 → WARNING değil WARNING + upstream escalation** — 68,012 mn TL fark büyük; reconciliation/financial_analysis chain'i etkileyebilir. Sessiz geçme.

## CEO Geri Bildirimi — 2026-04-16 — EREGL Deep Dive (DISC-004)

**Analiz Oturumu:** eregl-deep-dive-20260415
**Sirket:** EREGL — Ereğli Demir ve Çelik Fabrikaları
**Sorun Turu:** Kritik BS Satir Hatasi — Ticari Borc Eksik Kaynak

### Hata
- Parse BS ciktisi: ticari borc = 19,628mn TRY
- KAP FY2025 Not 8 (birincil kaynak): ticari borc = 68,762mn TRY
- Fark: **49,134mn TRY (%249 sapma)**
- Root cause hipotezi: parse agent BS ana kalem toplamini Not 8 kirilimini cekerek dogrulamadi; Not 8 iliskili taraf + ucuncu taraf + diger kalemleri toplamdan farkli satira dugume atti.

### Analitkl Etki (Bu Raporda)
- MINIMAL — financial_analysis dogrudan Not 8 = 68,762mn TRY'yi DPO ve CCC hesabinda kullanmis. CEO override ile rapor devam etti.
- Ancak parse BS kaydi yanlis; gelecek raporda cascad riski var.

### Zorunlu Duzeltme
1. **BS ticari borc satirini KAP Not 8 birincil kaynagindan cek:** Dogrudan `kap.org.tr` faaliyet raporu Not 8 tablosu — "Ticari Alacak ve Borclara Iliskin Bilgiler" bölümü.
2. **Not kirilimini BS satirina map et:** toplam ticari borc = iliskili taraf + ucuncu taraf + diger; her biri ayri kaynak etiketiyle.
3. **Otomatik kontrol ekle:** BS ticari borc vs Note 8 toplam > %5 sapma → FLAG_DISC ve escalate; output gonderme.
4. **Her celik sirketi icin:** BS altindaki ticari borc satirini gormeden once "Not 8 — Ticari Alacak/Borc kirilimi" fetchi zorunlu.

### Sonraki EREGL Analizinden Once
- Bu DISC-004 kapalı olmali; parse ciktisinda ticari borc = 68,762mn TRY (Not 8 onaylı).

### Oncelik
**YUKSEK** — CEO override ile bu rapor devam etti; bir sonraki raporda override yok.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **EBITDA null — 4. THYAO analizi (tolerans sıfır aşıldı)** — income_statement.ebitda: null. D&A çekilmediği için EBITDA hesaplanamadı. Bu zincir kırılması parse katmanından başlıyor.
- **income_statement.depreciation_amortization: null** — 4 THYAO analizinde aynı sorun; CF "Amortisman ve İtfa" satırı alınmadı.
- **income_statement.financial_income/expense/tax_expense: null** — Gelir tablosu zinciri (EBIT→Finance→PBT→Tax→NI) tamamlanmadı.
- **cash_flow.investing_cash_flow/capex/free_cash_flow: null** — Yatırım faaliyetleri CF bölümü 4 THYAO'da hiç çekilmedi.
- **equity_change: {} (tamamen boş)** — 4. THYAO, SE tablosu hiç çekilmedi.
- **IFRS 16 ROU amortismanı ayrıştırılmadı** — EBITDAR hesabı için zorunlu; 4 kez direktif verildi.

### Bundan Sonra:
- **THYAO parse hard bloker listesi (4. direktif — tolerans yok):**
  1. D&A → CF "Amortisman ve İtfa" satırı ZORUNLU; null → upstream escalation + parse DURUR
  2. IFRS 16 ROU amortismanı → ayrı satır; dipnot 26-27 açılır
  3. IS tam zincir: Revenue→COGS→Brüt→EBITDA→D&A→EBIT→fin.gelir→fin.gider→VÖK→vergi→Net Kar — hepsi dolu
  4. CF yatırım faaliyetleri → CAPEX + finansal yatırımlar ZORUNLU
  5. SE → dönem başı + net kar + temettü + dönem sonu kolonu
- **Null satır = upstream escalation tetikler; "veri yok" yazarak geçmek YASAK.**

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **EBITDA null — 3. THYAO analizi, artık tolerans sıfır** — Revenue mevcut, COGS mevcut; ancak D&A çekilmediği için EBITDA = null. Bu hata art arda 3 THYAO raporunda tekrarlandı. Kök neden: D&A upstream'den gelmiyor → parse eskalasyonu yapılmıyor.
- **D&A null — nakit akış tablosundan alınmadı** — CF tablosunun "Amortisman ve İtfa" satırı her zaman mevcuttur. Bu satır null bırakılamaz.
- **IS zinciri kırık** — financial_income / financial_expense / tax null. Sonuç: PBT ve net income bridge kurulamadı. IS tam extraction zorunlu — kısmi extraction YASAK.
- **CF tablosu yatırım faaliyetleri null** — "Yatırım Faaliyetlerinden Nakit Akışları" tamamen boş. FCF hesabı (OCF - CAPEX) yapılamadı.
- **SE (Özsermaye Değişim Tablosu) boş {}** — 4. zorunlu tablo. Temettü ödemesi, sermaye artırımı, dağıtılmamış karlar değişimi — bunlar strategic_synthesis ve valuation için zorunlu girdi.
- **IFRS 16 ROU varlık amortismanı ayrıştırılmadı** — EBITDAR = EBITDA + kira gideri; kira gideri null → EBITDAR hesaplanamaz.

### Bundan Sonra:
- **THYAO parse için kesin kurallar (tolerans sıfır — bir dahaki analizde ihlal = CEO direktifi hattı):**
  1. D&A → CF "Amortisman ve İtfa" satırı ZORUNLU; null → upstream escalation + parse durdurulur
  2. IFRS 16 ROU amortismanı → ayrı satır; yoksa dipnot 26-27 açılır
  3. IS tam zincir: Revenue → COGS → Brüt → OpEx → EBITDA → D&A → EBIT → fin.gelir → fin.gider → VÖK → vergi → Net Kar — hiçbir satır null olamaz
  4. CF yatırım faaliyetleri → CAPEX + finansal yatırımlar satırları ZORUNLU
  5. SE → en az: dönem başı + net kar + temettü + dönem sonu kolonu
- **Null satır = eskalasyon tetikler, geçmez** — "Veri yok" yazarak geçmek YASAK; null görülürse data_collection'a eskalasyon + CEO bildirim.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **EBITDA null — 4. THYAO analizi, kesin tolerans sıfır ihlali** — income_statement.ebitda: null. D&A upstream'den gelmiyor ve parse katmanından eskalasyon yapılmıyor; bu zincir kırılması kabul edilemez.
- **D&A null — CF "Amortisman ve İtfa" satırı alınmadı** — 4 THYAO analizinde aynı hata. KAP yıllık raporu her zaman nakit akış tablosunda bu satırı içerir; çekilmeden output gönderilmesi kural ihlali.
- **IS zinciri kırık** — financial_income: null, financial_expense: null, tax_expense: null. PBT ve net income bridge kurulamadı. Sonuç: faiz karşılama oranı, vergi yükü — tümü hesaplanamadı.
- **CF yatırım faaliyetleri null** — investing_cash_flow: null; capex: null; free_cash_flow: null. FCF = OCF − CAPEX; CAPEX null → FCF null → Chairman metrik listesi ihlali.
- **SE (Özsermaye Değişim Tablosu) boş {}** — 4. THYAO analizinde de SE tablosu hiç çekilmedi. Temettü ödemesi doğrulaması bile yapılamıyor.
- **IFRS 16 ROU amortismanı ayrıştırılmadı** — EBITDAR = EBITDA + kira gideri; kira gideri null → EBITDAR null → havacılık analizinin birincil metriği hesaplanamaz.

### Bundan Sonra:
- **D&A null = parse output DURUR (4. direktif, hard bloker)** — Null görüldüğünde: (1) data_collection'a eskalasyon "D&A eksik — kaynak: CF tablosu satırı + dipnot 11-12 + IFRS16 ROU ayrıştırması", (2) output gönderilmez, (3) CEO'ya bloker bildirim.
- **IS zinciri completeness = tam 11/11 satır** — Revenue → COGS → Brüt Kâr → OPEX → EBITDA → D&A → EBIT → Fin.Gelir → Fin.Gider → VÖK → Vergi → Net Kâr. Bir satır null → PENDING_IS_CHAIN eskalasyonu zorunlu.
- **EBITDAR havacılık özel alanı** — parse çıktısında "aviation_ebitdar" alanı ayrı eklenecek: EBITDA + IFRS16 kira gideri (dipnot). D&A mevcut değilse EBIT + D&A sektör proxy + IFRS 16 = EBITDAR `[conf: MEDIUM]`.
- **Investing CF ve CAPEX = 4. direktif hard bloker** — null tolere edilmez; "yatırım faaliyetlerinden nakit akışları" tablosu her KAP yıllık raporunda mevcuttur. Çekilmeden parse tamamlanmış sayılmaz.

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **FY2021-2023 satırları "[VERİ ÇEKME]" ile teslim edildi** — 5 yıllık seri zorunlu; kısmen dolu tablo ile output gönderilmek kural ihlali. Alternatif kaynaklar tükenmeden bırakma.
- **Ticari borç hatalı çekildi: 19,628 mn TRY (parse) vs Not 8: 68,762 mn TRY** — Bu DISC-004 açık bulgusunun kaynağı. Not 8 ticari borç kırılımı okunmadı; sadece bilanço özet satırı alındı. Sektör (çelik/sanayi) analizinde ticari borç Not'u zorunlu.
- **FY2024 net kâr hatalı çekildi: 2,431,877 mn (parse) vs doğru: 14,193,046 mn** — Sütun kayması hatası. Reconciliation tarafından düzeltildi ama bu hata kaskad risk yarattı; parse ajanının kendi kontrolünden geçmesi gerekir.
- **CF ve SE tabloları tam extract edilmedi** — ICF/Finansman CF satırları ve özsermaye hareket tablosu (SE) "kısmi" statüsünde kaldı.
- **D&A doğrudan kaynaktan çekilmedi** — Reconciliation çıktısında EBITDA tanım farkı (20,452 vs 21,248 mn) doğrudan D&A extraction eksikliğinden kaynaklandı.

### Bundan Sonra:
- **Ticari borç için Not'u oku** — Bilanço özet satırı yetersiz; ilgili dipnotu (Not 8 veya eşdeğeri) ayrıca çek ve tedarikçi/diğer ayrımını göster. Net Borç formülü etkilenmez ama DPO/CCC hesabı için doğru değer şart.
- **Sütun kayması kontrolü zorunlu** — FY2024 karşılaştırmalı figürleri EPS × hisse adedi ile cross-check yap; tutmazsa REJECT ver, gönderme.
- **D&A direkt amortisman notundan çek** — "EBITDA − EBIT = D&A" türetme YASAK; KAP PDF amortisman notundan satır bazlı çek.
- **CF tam 3 bölüm zorunlu** — OCF + ICF + Finansman CF; herhangi biri eksikse "PENDING" etiketle ve upstream'e eskalasyon yap.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu
### Eksikler:
- Cikti `Mock completed output for parse_standardization.` seviyesinde kaldi; standartlastirilmis IS/BS/CF/SE tablolari, birim normalizasyonu ve kaynak-esleme gorunmuyor.
- IAS 29 etkisi, Net Borc icin gerekli finansal borc/nakit ayrimi, DSO-DIO-DPO hesap girdileri ve 2021-2025 tekil satir haritalamasi downstream'e sunulmadi.
### Bundan Sonra:
- Her raporda 4 zorunlu tabloyu standardize et: IS, BS, CF, SE; her satiri orijinal kaynak etiketiyle ve tek para birimiyle ver.
- IAS 29, working capital ve net borc hesaplari icin gereken alt kalemler ayri kolonlarda gosterilecek; bunlar yoksa `completed` statusu verilmeyecek.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu Post-Report Loop
### Eksikler:
- Standardizasyon cikti, Chairman'in zorunlu metriklerini besleyecek alt kalem ayrimini uretmedi; finansal borc, nakit, KV finansal yatirim, ticari alacak, stok, ticari borc gibi kolonlar net degildi.
- Telekom KPI ve faaliyet raporu baglamindan gelen operasyonel metrikler finansal tablolarla ayni fact pack'e baglanmadi.
### Bundan Sonra:
- Parse cikti her zaman `source_label -> standardized_label -> unit -> period -> confidence` map'iyle gelecek; satir adi cevirisi yalniz metin degil veri soyagaci da icerecek.
- Ratio-ureten alt kalemler ayri etiketlenecek; downstream ajanlar DSO, leverage veya likidite hesabi icin metni degil parse tablosunu kullanacak.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Post-Report Feedback Loop
### Eksikler:
- OCF/Cash EBITDA ayrimi, net borc girdileri ve WC alt kalemleri parse katmaninda tek tabloya oturmadi; bu nedenle downstream ayni satiri farkli yorumladi.
- 2021-2025 tarihsel seri ile FY2025 detayli tablo ayni standardizasyon sozlugunde birlesmedi; delta raporu icin hizli trend zemini zayif kaldi.
### Bundan Sonra:
- Parse standardization her sirket icin `ratio_input_table` uretecek; nakit, finansal borc, KV finansal yatirim, ticari alacak, stok, ticari borc, faiz gideri, capex ve D&A ayri satirlarda zorunlu olacak.
- Tarihsel seri ve cari yil detaylari ayni standard isimlerle baglanacak; ayni metrik birden fazla isimle downstream'e gecmeyecek.

## CEO Geri Bildirimi — 2026-04-14 — THYAO

**CEO 2026-04-14 THYAO eksikleri:** CF/SE yok ama output gonderildi. OpEx alt kalemleri "[Detail missing]". D&A EBITDA-EBIT farkinden turetildi. IAS 29 ayristirmasi yapilmadi.
- **D&A DOGRUDAN kaynaktan cek** — KAP PDF Amortisman ve Itfa notundan. Turetme YASAK.
- **IFRS 16 ROU amortismanini D&A'dan ayristir** — Havacilikta D&A icinde IFRS 16 ROU amortismani ayri goster; EBITDAR hesabina temel olustur.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **Doğru eskalasyon yapıldı ✓** — CF/SE eksik olduğunda "CANNOT PROCEED" kararı verildi ve upstream eskalasyon protokolü uygulandı. Bu doğruydu.
- **IS + BS tam hazır ama beklemede tutuldu** — Mevcut IS ve BS tabloları standardize edilebilecek durumdayken "tüm tablolar gelene kadar bekle" yorumu benimsenildi. Kural: mevcut tabloları işle, eksik kısımları "PENDING_CF_SE" etiketiyle gönder.
- **IAS 29 ayrıştırması IS üzerinde başlatılmadı** — IS mevcuttu; IAS 29 parasal kazanç ayrıştırması IS bazında yapılabilirdi ve downstream'e gönderilmeliydi.

### Bundan Sonra:
- **Kısmi output gönder, tam bloklama yapma** — IS + BS mevcut ise bunları standartlaştırıp çıkt; CF/SE için "PENDING_UPSTREAM" bölümü oluştur. "Tüm tablolar gelene kadar bekle" = pipeline'ı gereksiz durdurmak.
- **Perakende sektörü ayrıştırma ekstrası** — Stoklardaki detaylar (emtia stoğu, hammadde, yarı mamul, mamul), ticari alacaklar, ticari borçlar satır bazlı mutlaka çıkarılmalı; WC hesabının temelidir.
- **IFRS 16 kira borcu ayrıştırması** — Perakendecilerde (BIMAS: 14.000+ mağaza) IFRS 16 kira yükümlülükleri bilanço büyüklüğünü önemli ölçüde artırır. Net Borç hesabında finansal kiralama borcu ayrı satırda gösterilmeli.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **%76 [TBD] oranı eşiği aşmasına rağmen parse devam etti** — Kural: %10 üstü TBD → REJECT. KCHOL'da IS %76 TBD, BS %88 TBD ile output REJECT verildi ✓ (doğru). Ancak alternatif metodlar (XBRL, proxy) denemeden direkt REJECT ile eskalasyon yapıldı.
- **IS + BS mevcut olmasına rağmen kısmi output gönderilmedi** — Önceki BIMAS dersinde "kısmi output gönder, tam bloklama yapma" kuralı eklenmişti. KCHOL'da aynı hata tekrarlandı: mevcut gelir tablosu ve kısmi bilanço standardize edilip "PENDING_CF_IFRS8" etiketiyle gönderilebilirdi.
- **IAS 29 ayrıştırması hiç başlatılmadı** — IS mevcuttu (kısmen). IAS 29 parasal kazanç ayrıştırması mevcut IS üzerinde yapılabilirdi; "tüm tablolar gelene kadar bekle" yorumu benimsenildi.
- **2023 finansal tabloları tamamen eksik** — 5 yıllık time-series zorunluluğu gereği 2021-2025 verisine ihtiyaç var. 2023 tablolarının neden eksik olduğu ve hangi yolların deneneceği belirtilmedi.
- **Faaliyet raporu PDF sayfa referansı verilmedi** — "Segment Bilgileri bölümü genelde sayfa 20-35" denildi ama PDF çekilmedi; sayfa numaraları tahmini. Kaynak olmadan sayfa numarası yazmak güveni yanıltır.

### Bundan Sonra:
- **Mevcut tabloları işle, eksikleri etiketle, gönder** — IS veya BS kısmen mevcutsa bunları standardize et; eksik bölümler için "PENDING_[REASON]" etiketi koy ve göndermek; downstream bekletme.
- **KAP XBRL'den parse dene** — PDF parse başarısızsa XBRL endpoint'i direkt dene (kap.org.tr/tr/api/XBRL endpoints). Başarısızsa sonucu logla.
- **2023 ve öncesi eksikliğinde KAP historical archive** — 5 yıllık data için KAP'ta "Yıllık Raporlar" bölümünden ilgili yılın raporunu ayrıca fetch et; "2023 mevcut değil" demeden KAP'ta ilgili FY raporunu ara.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **Revenue: Segment kısmını (195B TRY) konsolide revenue olarak etiketledi** — Gerçek konsolide revenue 1,187B TRY. 5x fark tüm downstream hesapları bozdu.
- **EBITDA: 9 aylık veriyi (50,577M) FY2024 etiketi ile sundu** — Q3 2024 kümülatif değeri, yıllık değer gibi raporlandı; CRITICAL etiket hatası.
- **IS zincirinin 9/11 satırı PENDING** — COGS, Gross Profit, OPEX, D&A, EBIT, Finance Income, Finance Cost, PBT, Tax hiç tamamlanmadı.
- **2020–2021 için "VERİ YOK" yazıldı** — CEO kuralı: "Veri yok" YASAK; alternatif yöntem dene veya escalate et.
- **Balance Sheet nakit, alacak, stok satırları PENDING** — Toplamlar çekildi ama kritik alt satırlar bırakıldı.

### Bundan Sonra:
- **Konsolide revenue = tüm segmentlerin toplamı:** Holding analizinde segment kısmi veri ASLA konsolide revenue etiketi taşıyamaz. "Konsolide" yazmadan önce kapsam kontrolü yap.
- **Dönem etiketi KAP başlığından birebir kopyalanacak:** "9M 2024" olan veri FY2024 satırına yazılamaz. Dönem uyuşmazlığı varsa [UYARI: 9A veri, FY extrapolation gerekiyor] flag'i ekle.
- **IS zinciri bütünlük protokolü:** Revenue → COGS → Gross Profit → OPEX → EBITDA → D&A → EBIT → Finance → PBT → Tax → Net Income. Her satır ya dolu ya [PENDING+escalation] olmalı. Eksik satır olarak output GÖNDERİLEMEZ.
- **"Veri yok" YASAK:** 5 alternatif kaynak (KAP PDF, KAP XBRL, IR sitesi, quarterly report, WebFetch) denenmeden eksik beyan edilemez.

---
