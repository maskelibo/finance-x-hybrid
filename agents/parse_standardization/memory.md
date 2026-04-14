# Parse Standardization Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **PDF parse edilemedi = mazeret degil:** KAP XBRL → pdfplumber/Camelot → OCR → WebFetch gorsel. "Parse edilemedi, gap var" deyip gecmek YASAK.
- **Discrepancy tespit = COZ:** Primary source'a git, dogru degeri bul, yanlis source'u isaretle. Downstream'e tek dogrulanmis deger gonder. Iki farkli deger gondermek YASAK.
- **Full P&L extraction ZORUNLU:** Revenue, COGS, Gross Profit, OpEx (Sales/Marketing, Gen Admin ayri), EBITDA, D&A, EBIT, Finance Income/Costs, PBT, Tax, Net Income, NCI, NI Attributable to Parent — HEPSI.
- **4 zorunlu tablo:** IS + BS + CF + Equity Movement — hepsi FULL extraction, truncation YASAK.
- **Balance sheet FULL extraction:** Assets (Current/Non-current alt kalemler), Liabilities (Current/Non-current + Financial Debt + Trade Payables), Equity (Share Capital, Retained Earnings, NCI).
- **5-year time-series ZORUNLU:** Deep dive modda FY-4 to FY0 full financial statements.
- **"[pending]" / TBD YASAK:** Parse edilemiyorsa alternative method kullan; imkansizsa GAP olarak isaretle. 21 zorunlu kalemde TBD orani %10'u gecerse output otomatik REJECT.
- **"~" (yaklasik) kurali:** XBRL'den → "~" YASAK. PDF OCR → "~" kullanilabilir, confidence ≤0.89. "~" orani %20'yi gecerse EXCESSIVE_APPROXIMATION flag.
- **Tablo yarim birakma YASAK:** Basladigin tabloyu TAMAMLA.
- **Input validation ZORUNLU:** Her parse job baslamadan once input verisinin guncelligini kontrol et. 1 yil gerideyse UPSTREAM'E ESCALATE, PARSING'I DURDUR, eski veriyi parse edip downstream'e gonderme.
- **Holding = IFRS 8 ZORUNLU:** Multi-sector holdinglerde segment disclosure extraction mandatory.
- **Olagan disi degisiklik = audit note ZORUNLU:** Margin collapse (>%50), OCF sign reversal, major revenue jump (>%100) → dipnotlardan aciklama extract et.
- **Cash Flow Statement non-negotiable:** Parse edilmeden output GONDERMEK YASAK. OCF, ICF, FCF, Net Change, Ending Cash + Working Capital bilesenleri ZORUNLU.
- **IAS 29 EBITDA ayristirmasi ZORUNLU (tum Turk sirketleri):** Raporlanan EBITDA/Net Kar icinden IAS 29 parasal kazanc/kayip ayristir. Ayristirma olmadan "excellent" sertifikasi verme.
- **Otomatik matematiksel kontroller (4 adet):** Bilanco Dengesi A=L+E (±0.1%) FAIL=BLOCK | Gelir Tablosu Zinciri (±0.5%) FAIL=BLOCK | Nakit Akis Mutabakati (±0.5%) FAIL=BLOCK | Ozsermaye Mutabakati (±1%) FAIL=warning.
- **Ic tutarlilik ≠ kaynak dogrulugu:** Kontroller gecse bile kritik metriklerde (EBITDA, Net Kar, Net Borc) web/KAP capraz kontrolu zorunlu. Her output'ta bu sinirlamayi belirt.
- **mandatory_metrics_complete flag:** Yalnizca TUM metrikler hem DOLU hem FARKLI KAYNAKLARDAN DOGRULANMIS ise TRUE. Tahmini metrikler "conditional_pass" olarak ayri listele.
- **source_document_id ZORUNLU:** Her standardize satira belge adi, sayfa ve orijinal satir aciklamasi ekle.
- **Yil atama hatasina sifir tolerans:** Her metrikte donem alani zorunlu.
- **Kritik fact conflict varsa kalite sertifikasi verme.**

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

## Zorunlu Kontrol Listesi

Her parse job oncesi:
1. Input data freshness kontrolu (bugunun tarihi vs input'taki en guncel tablo tarihi)
2. Beklenen son finansal tablo tarihi hesapla (mali yil bitimi + 75 gun)
3. Fark 1 yil ise → ESCALATE, DURDUR

Her output icin:
- [ ] 4 zorunlu tablo tam mi? (IS, BS, CF, SE)
- [ ] 21 zorunlu kalemde TBD var mi? (0 olmali)
- [ ] 4 matematiksel kontrol gecti mi?
- [ ] IAS 29 ayristirmasi yapildi mi? (Turk sirketleri)
- [ ] data_freshness_check metadata eklendi mi?
- [ ] source_document_id her satirda var mi?
- [ ] Output truncation yok mu?

Sektor ek islemler:
- Holding: IFRS 8 segment verileri + bagli ortaklik detaylari + konsolidasyon kapsami
- Telekom: Segment revenue breakdown, roaming, interconnection, spectrum amortization, CAPEX breakdown
- Rafineri: Urun bazinda yield tablosu, birincil kaynak KAP konsolide SPK tablolari
- Celik: EBITDA/ton, kapasite util%, urun mix, cografi kirilim
- Banka: NPL breakdown (Stage 1/2/3), capital tables, segment breakdown

## Bilinen Hatalar (Bir Daha Yapma)

- TCELL'de 2024 verisi parse edilip downstream'e gonderildi, 2025 raporu KAP'ta varken → input validation yapilmamisti
- KCHOL'da income statement %60 "[pending]", segment extraction %0 → KABUL EDILEMEZ
- EREGL'de EBITDA %66 sapma (34B vs gercek 20.4B) ve net kar 27.5x sapma — IAS 29 ayristirmasi yapilmamis, yanlis veri uzerine "9.2/10 EXCELLENT" sertifikasi verilmis
- AKBNK balance sheet tablosu ortada kesilmis
- TCELL cash flow statement tamamen eksik birakild
- Faaliyet raporu ozet tablosu SPK konsolide tablosu yerine kullanildi (TUPRS)
- **KCHOL (2026-04-14):** Data_collection'dan 2025 "Satış 2.757B" gelmişti - 97% düşüş 2022'den, verified değil. Parent-only mi consolidated mi belirsiz. 2023 finansal tablosu tamamen eksik. Balance sheet %88 [TBD], cash flow 2024 FY eksik. IAS 29 ayristirmasi yapılmamis. IFRS 8 segment extraction %0. Parse REJECTED, TBD %76 (threshold %10). Upstream escalation gerekti.

- **CBAM 2026 dipnot kalemleri:** 2026'dan itibaren celik sirketleri (EREGL) CBAM sertifika yukumlulukleri bilancoya kaydedilmeli. Parse sirasinda "Diger Karşılıklar" veya "Cevresel Yukumlulukler" altinda yeni kalem var mi kontrol et.
- **TAS 29 vs IAS 29:** TAS 29 (yerel) 7571 sk ile 2025-2027 arasi askida. IAS 29 (IFRS/SPK) HALA GECERLI. SPK konsolide tablolari IAS 29'a gore; yerel muhasebe TAS 29 askida = parse sırasında IFRS tablosunu birincil al.

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
