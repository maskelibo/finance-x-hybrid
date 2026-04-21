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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **income_statement.ebitda: null** — D&A çekilmediğinden EBITDA hesaplanamadı. EBITDA Aviation analizinin çekirdeği; KAP CF notundan D&A satırı zorunlu çekilmeli.
- **income_statement.depreciation_amortization: null** — KAP PDF amortisman notundan (Not 11-12) doğrudan çekilmeli. "EBITDA − EBIT" türetmesi yasaklandı.
- **income_statement.financial_income/expense/tax_expense: null** — Faiz karşılama ve vergi oranı hesaplanamaz. Gelir tablosu zinciri (EBIT → Finance → PBT → Tax → NI) eksiksiz olmalı.
- **cash_flow.investing_cash_flow / capex / free_cash_flow: null** — FCF null → CAPEX/EBITDA bloke. Yatırım CF ve CAPEX satırları KAP nakit akış tablosundan çekilmeli.
- **equity_change: {} (tamamen boş)** — Özsermaye hareket tablosu hiç çekilmedi. ROE trend ve equity reconciliation için zorunlu.
- **IFRS 16 ROU + kira borcu ayrıştırılmadı** — THYAO $25B+ kira yükümlülüğü; ROU amortismanı D&A'dan ayrıştırılmadan EBITDA vs EBITDAR farkı hesaplanamaz.

### Bundan Sonra:
- **Havacılık şirketlerinde D&A zorunlu çift satır** — (1) IFRS 16 ROU amortismanı ayrı satır, (2) sabit varlık amortismanı ayrı satır. İkisinin toplamı = toplam D&A. Her ikisi KAP CF veya amortisman notundan çekilecek.
- **IS zinciri null toleransı: SIFIR** — Financial_income, financial_expense, tax_expense, ebitda, depreciation_amortization — bunlardan biri null ise parse output PENDING_IS_CHAIN etiketiyle CEO'ya eskalasyon.
- **ICF null = CAPEX null = Chairman mandatory metric ihlali** — ICF / CAPEX satırları "CF tam gelmedi" diye null bırakılamaz; alternatif kaynaklar tüketilmeden PENDING yazılmaz.

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

## EREGL Oturumu Dersleri (16 Nisan 2026)

### KRİTİK HATALAR — TEKRAR ETME
1. **Satır kaydırma hatası:** FY2024 Net Kar 2,431,877 yerine 14,193,046 olmalıydı. PDF'den çekerken satır kayması oldu. ÇÖZÜM: Her zaman EPS × Hisse Sayısı ile cross-check yap.
2. **Ticari Alacak / Finansal Yatırım karışıklığı:** 27,447,677 değeri hem "Ticari Alacaklar" hem "Finansal Yatırımlar (ST)" olarak girildi. ÇÖZÜM: Aynı değer iki kalemde OLAMAZ — şüpheli değerleri flagle.
3. **Ticari Borçlar eksik:** BS'de 19,628mn yerine Not 8'deki 68,762mn doğru. ÇÖZÜM: Ticari borçlarda BS satırı ile dipnot arasında fark varsa dipnotu kullan ve flagle.
4. **CF tablosu çekilmedi:** "PENDING" yazıp geçildi. ÇÖZÜM: 4 tablo zorunlu — PENDING yazmak YASAK.
5. **D&A çekilmedi:** EBITDA hesaplanamadı. ÇÖZÜM: Not 2.8 veya Not 11-12'den D&A zorunlu çekilecek.

### ZORUNLU CROSS-CHECK'LER
- Revenue - COGS = Gross Profit (±1%)
- PBT - Tax ≈ Net Income (±1%)  
- EPS × Hisse Sayısı ≈ Net Income (±5%)
- BS Toplam Varlık = Toplam Yükümlülük + Özsermaye (±0.1%)
- Aynı değer iki farklı kalemde → HATA FLAG

---
**Imza:** CEO Agent
**Log Tarihi:** 2026-04-16T14:30:00+03:00
**Oturum:** eregl-deep-dive-20260415

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **EBITDA null — 5. THYAO analizi, sistematik arıza** — income_statement.ebitda: null. D&A upstream'den gelmiyor, parse katmanından eskalasyon yapılmıyor. 5 analizdir aynı hata.
- **D&A null — 5. THYAO, CF "Amortisman ve İtfa" alınmadı** — Her KAP yıllık raporunda bu satır mevcuttur; 5 THYAO analizinde çekilemedi. Eskalasyon tetiklenmedi.
- **CF yatırım faaliyetleri null — 5. THYAO** — investing_cash_flow: null; capex: null; free_cash_flow: null.
- **SE (Özsermaye Değişim Tablosu) boş {} — 5. THYAO** — 4. zorunlu tablo 5 analizde hiç çekilmedi.
- **IFRS 16 ROU amortismanı ayrıştırılmadı — 5. THYAO** — EBITDAR = EBITDA + kira gideri; kira gideri null → EBITDAR null.
- **Null görüldüğünde eskalasyon tetiklenmedi — 5. THYAO** — Direktif 4 kez yazıldı; hiçbir zaman uygulanmadı.

### Bundan Sonra:
- **D&A null = parse output DURUR + eskalasyon zorunlu (5. direktif, hard bloker)** — Null görüldüğünde: (1) data_collection'a eskalasyon, (2) output gönderilmez, (3) CEO'ya bloker bildirim. "Veri yok" yazarak geçmek YASAK.
- **IS zinciri completeness = tam 11/11 satır** — Bir satır null → PENDING_IS_CHAIN eskalasyonu zorunlu.
- **aviation_ebitdar alanı parse çıktısına eklenmeli** — D&A null ise: EBIT + D&A sektör proxy (%15-18 of Revenue) + IFRS16 kira = EBITDAR [conf: MEDIUM].

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **income_statement.ebitda: null — D&A çekilmedi** — THYAO zinciriyle aynı hata savunma şirketine taşındı. ASELS KAP yıllık raporunda amortisman notu mevcuttur; null bırakılamaz.
- **income_statement.depreciation_amortization: null** — "EBITDA − EBIT" türetmesi yasaklandı; KAP amortisman notundan (Not 11-12 veya eşdeğeri) doğrudan çekilmeli.
- **cash_flow.investing_cash_flow: null; capex: null; free_cash_flow: null** — ASELS savunma şirketi için CAPEX/EBITDA kritik KPI; null bırakmak Chairman metrik listesi ihlali.
- **equity_change: {} (boş)** — Özsermaye hareket tablosu hiç çekilmedi; ROE trend ve equity reconciliation için zorunlu.
- **trade_payables = "24,432,000 TL" — DISC-004 benzeri sapma** — ASELS 180B+ TL cirosu karşısında ticari borç 24.4M TL şüpheli derecede düşük. BS özet satırı ile ilgili dipnot (ticari borçlar Not'u) karşılaştırılmadı.
- **IAS 29 parasal kazanç/kayıp: null** — ASELS Turkish GAAP/IAS 29 kapsamında; monetary gain/loss ayrıştırılmadan EBITDA ve Net Kar gerçek operasyonel performansı göstermiyor.

### Bundan Sonra:
- **Savunma sektörü parse ekstrası:** ASELS gibi savunma şirketlerinde (1) AR-GE harcamaları IS'ten ayrı satır, (2) sözleşme ertelenmiş geliri BS'ten, (3) devlet teşvikleri IS'ten ayrıştır. Bunlar savunma margin analizinin girdileri.
- **Trade_payables DISC-004 kontrolü evrensel** — Her şirket analizinde BS ticari borç vs dipnot toplam karşılaştır. Fark >%20 → FLAG_DISC-ASELS + eskalasyon.
- **EBITDA null = savunma analizinde pipeline bloker** — D&A null → EBITDA null → backlog/EBITDA ve AR-GE/EBITDA oranları hesaplanamaz. Null görüldüğünde upstream eskalasyon + parse DURUR.

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
