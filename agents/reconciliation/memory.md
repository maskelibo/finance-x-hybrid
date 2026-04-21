# Reconciliation Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **Kaynak Oncelik Hiyerarsisi:** KAP Audited (en yuksek) > Company IR > Aggregators (Fintables) > News/analyst.
- **Materiality Testi:** Absolute: 50M TRY (BIST100), Relative: 1%. Ikisinden biri asilirsa MATERIAL.
- **Muhasebe denklemleri HER ZAMAN kontrol et:** Net Profit < EBITDA | A = L + E + NCI | EBITDA = NI + D&A + Interest + Tax.
- **Discrepancy tespit et → COZ → tek dogrulanmis deger downstream'e gonder.** Iki farkli deger gondermek YASAK.
- **Her discrepancy icin:** (1) Flag, (2) Root cause arastir, (3) Dogru degeri belirle, (4) Yanlis kaynayi isaretle, (5) Tek deger downstream'e.
- **Hipotez olusturmak yetmez — DOGRULA:** "Likely NCI" degil "NCI confirmed at X TRY per KAP FY BS" demen gerekiyor.
- **Upstream veri eksikligi = ESCALATE:** Segment data yok, BS components yok → structured request gonder.
- **Yarim analiz birakma YASAK:** Basladigin her kontrol tamamlanmali.
- **BLOCKING kararindan once alternatif kaynak protokolu:** CHECK 1 FAIL → Adim 1: Ayni veriyi farkli KAP kaynagindan (tam konsolide tablo vs ozet rapor) cek. Adim 2: Hala fail → BLOCKED + upstream escalation.
- **Confidence scoring kalibrasyon:** Critical imbalance cozulmemisse confidence >0.60 olamaz.
- **Net Borc = Finansal Borc - (Nakit + Kisa Vadeli Finansal Yatirimlar).** Toplam yukumluluk ASLA kullanilmaz. Finansal borc = banka kredileri + tahvil + finansal kiralama.
- **Kalite skoru bilesik:** Ic tutarlilik skoru (7 CHECK) x 0.5 + Kaynak dogrulugu skoru (capraz dogrulama) x 0.5. Kaynak dogrulamasi yapilmadan "EXCELLENT" verilemez.
- **IAS 29 on kontrol ZORUNLU (tum Turk sirketleri):** Parasal kazanc/kayip tespit edildiginde: (a) gelir tablosundan ayristir, (b) duzeltilmis EBITDA ve net kar ayrica raporla, (c) "IAS 29 etkisi: X TRY" notu ekle.
- **Her kritik kalem icin belge adi, sayfa ve dipnot referansi ZORUNLU.**
- **Celiskili metriklerde yalniz farki yazma; hangisini neden sectigini acikla.**
- **EBITDA, net kar, FCF, net borc icin ayri `final approved figure` bolumu yayinla.**

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **pass_rate 1.0 yanıltıcı — gerçek kapsam %57** — CF_TOTAL_RECONCILE, BS_EQUITY_SPLIT, IS_NET_SPLIT "skipped: not reported" olarak geçildi. 7 check'ten 4'ü geçti, 3'ü atlandı. "1.0 pass rate" ibaresi downstream'i yüksek kalite sanmasına yol açar.
- **IFRS 16 lease borcu Net Borç formülüne dahil edilmedi — 3. THYAO** — Havacılık direktifi: Net Borç = Finansal Borç + Finansal Kiralama Borcu − (Nakit + KV Yatırım). THYAO için $25B+ ROU yükümlülüğü kritik; sadece finansal borç − nakit = eksik formül.
- **5-yıllık bilanço dengesi kontrolü yapılmadı** — Sadece FY2025 kontrol edildi. Önceki EREGL dersi uygulanmadı: her raporlama yılı için A=L+E zorunlu.
- **CF "skipped" → parse_standardization'a eskalasyon yapılmadı** — investing_cash_flow/capex/free_cash_flow null iken "not reported" ile geçildi; doğru aksiyon: "CF_TOTAL_RECONCILE SKIPPED — parse_standardization'a ICF/FCF talebi" eskalasyonu tetiklemekti.

### Bundan Sonra:
- **pass_rate gerçek kapsama göre raporla** — "skipped" check'leri paydaya dahil et: 4 geçti / 7 toplam = %57 gerçek kapsam. 1.0 sunmak kural ihlali.
- **THYAO Net Borç formülü zorunlu (3. direktif, artık hard rule)** — Finansal Borç + Kira Borcu (IFRS 16) − Nakit − KV Yatırım. Havacılık analizinin temel Net Borç tanımı.
- **CF "skipped" = parse eskalasyon tetikleyicisi** — CF_TOTAL_RECONCILE atlanırsa otomatik "parse_standardization: ICF/FCF talebi" iletisi gönderilecek.

## Zorunlu Kontrol Listesi — 7 Otomatik Cross-Statement Kontrol

| # | Kontrol | Severity | Fail Durumunda |
|---|---------|----------|---------------|
| 1 | Bilanco Dengesi (A = L + E) | CRITICAL | Output BLOCK |
| 2 | Gelir Tablosu Zinciri (Revenue→COGS→GP→EBIT→PBT→Tax→NI) | HIGH | Output BLOCK |
| 3 | Nakit Akis Mutabakati (Opening + OCF + ICF + FCF = Closing) | HIGH | Flag + document |
| 4 | Ozsermaye Roll-Forward (Opening + NI - Div ± OCI = Closing) | MEDIUM | Flag + warning |
| 5 | Net Income Cross-Check (IS NI = CF starting NI) | HIGH | Flag + investigate |
| 6 | Working Capital Veri Tamligi (11 zorunlu kalem) | HIGH | Upstream escalation |
| 7 | Anomali Tespiti (Revenue/NI/OCF outliers) | MEDIUM | Flag + CEO approval |

**11 Zorunlu Working Capital Kalemi:** Trade Receivables, Inventories, Trade Payables, Current Assets, Current Liabilities, Short-term Borrowings, Long-term Borrowings, Cash & Equivalents, CAPEX, Interest Expense, D&A.

**Anomali Tespiti Auto-Flag Kurallari:**
- Revenue YoY > ±50% → REVENUE_ANOMALY
- Net Income YoY > ±80% → PROFIT_ANOMALY
- OCF isaret degisikligi → CASH_FLOW_REVERSAL
- Net Margin < 0.5% (Revenue > 1T TRY) → MARGIN_COMPRESSION
- EBIT Margin YoY dusus > 5pp → OPERATIONAL_DETERIORATION

**Sektor-spesifik anomali esikleri:**
- Celik/emtia: EBITDA marji >%15 → FLAG | Net kar/EBITDA >%35 → IAS 29 suphesi | Net Borc/EBITDA >4.0x veya <0.5x → kaynak dogrulama | Nakit (dar)/Toplam likit <%5 → dar nakit tanimini sorgula
- Rafineri: Rafineri marji ($/bbl) trendi, kapasite kullanimi, ham petrol fiyati vs benchmark — finansal anomaly'den ONCE kontrol et
- Banka: Equity reconciliation (acilis + net kar - temettu = kapanis) | NPL classification consistency | Capital adequacy cross-period validation ZORUNLU

**Sektor-spesifik ek kontroller:**
- Holding: Segment reconciliation (segment toplami = konsolide total) + NCI dogrulamasi
- Telekom: CAPEX reconciliation (CF CAPEX = BS PP&E + IS depreciation) + spectrum amortization consistency
- CCC hesabi guven notu: DSO/DIO/DPO tahmini ise "MEDIUM CONFIDENCE" notu zorunlu

## Bilinen Hatalar (Bir Daha Yapma)

- EREGL EBITDA 34B onaylandi, gercek 20.4B (%66 sapma) — ic tutarlilik gecti ama kaynak dogrulugu yapilmadi
- EREGL net borc hesabinda toplam yukumluluk (261B) kullanildi, dogru olan finansal borc (158B) — 5x vs 2.1x
- EREGL dar nakit (2.1B) kullanildi, gercek likit varliklar 115.5B
- KCHOL balance sheet imbalance (415.6B) NCI hipotezi olusturuldu ama KAP'tan dogrulanmadi
- KCHOL segment reconciliation yapilmadi, upstream'e escalate edilmedi
- SISE Net Profit (9.1B) > EBITDA (7.6B) — matematiksel imkansizlik
- TCELL cash flow reconciliation truncated/kesilmis

- **CBAM provision rekonsiliasyon (2026+):** Celik sirketlerinde (EREGL) CBAM sertifika yukumlulugu yeni provision kalemi olusturabilir. Bilanco dengesini kontrol ederken "Diger Karsıliklar" artisini CBAM ihtimali ile flag'le.
- **IFRS 16 bilanco etkisi:** Havacilik/kiralama agirlikli sirketlerde IFRS 16 ROU varliklari toplam varlik degerini %20-23 artirir. Bilanco dengesi kontrolunde bu kalem buyukse ayri goster.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **pass_rate 1.0 bildirildi — 5. THYAO'da aynı yanıltıcı raporlama** — Skipped checkler "N/A" olarak sayıldığı için pass_rate 1.0 göründü. Gerçek tamamlama oranı %57. Downstream'e yanlış güven sinyali vermeye devam ediyor.
- **IFRS 16 kiralama borcu Net Borç formülüne dahil edilmedi — 5. THYAO** — "Net Debt = 585.8T TL (ST+LT − Cash)" formülü havacılıkta eksik; THYAO'nun $25B+ IFRS 16 yükümlülüğü dahil edilmedi.
- **CF "skipped" → parse_standardization'a eskalasyon yapılmadı — 5. THYAO** — CF_TOTAL_RECONCILE atlandığında parse_standardization'a mesaj gönderilmedi. Direktif 4 kez yazıldı, uygulanmadı.
- **5 yıllık bilanço dengesi kontrolü yapılmadı** — Sadece FY2025 için BS_IDENTITY check. FY2020-2024 yılları hiç kontrol edilmedi.
- **overall_decision "pass" ama 3 check atlanmış — 5. THYAO** — Skipped checkler gerçek kapsama göre değerlendirilmedi.

### Bundan Sonra:
- **pass_rate 1.0 = YASAK (5. direktif — hard kural, son uyarı)** — Skipped checkler paydaya dahil: gerçek pass_rate = tamamlanan / (tamamlanan + başarısız + atlanmış). 1.0 sunmak kural ihlali.
- **IFRS 16 Net Borç = THYAO sabit formülü** — (KV Fin. Borç + UV Fin. Borç + IFRS16 KVK + IFRS16 UVK) − (Nakit + KV Fin. Yatırım). data_collection IFRS16 satırını getirmezse → check FAIL + eskalasyon.
- **CF skip = otomatik parse eskalasyonu** — CF_TOTAL_RECONCILE atlandığında reconciliation parse_standardization'a "P1 eskalasyon: ICF/FCF null" iletisi otomatik gönderecek.

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **pass_rate 1.0 yanıltıcı — gerçekte 5/7 (2 atlandı)** — CF_TOTAL_RECONCILE ve BS_EQUITY_SPLIT "skipped: not reported" olarak geçildi. Gerçek kapsam = 5/7 = %71. "1.0 pass rate" downstream'i yüksek kalite sanmasına yol açtı.
- **FY2021-2024 bilanço dengesi kontrolü hiç yapılmadı** — Yalnızca FY2025 kontrol edildi. ASELS 5 yıllık büyüme (ciro 3x, R&D harcaması) dönemidir; her yıl için A=L+E zorunlu.
- **Nakit akışı "skipped" → parse_standardization'a eskalasyon yapılmadı** — Investing CF/FCF null iken "not reported" geçildi; doğru aksiyon eskalasyon tetikleyiciydi.
- **IAS 29 parasal kazanç/kayıp analizi yapılmadı** — ASELS savunma şirketi, TRY bazlı gelir ama döviz maliyetleri var; IAS 29 etkisi göz ardı edildi. Normalize NI downstream'e iletilmedi.
- **Trade_payables DISC-004 benzeri sapma (24.4M TL) reconciliation aşamasında işaretlenmedi** — DPO/CCC için kritik yanlış değer downstream'e geçti; reconciliation bunu tespit etmeli ve kilitlemeliydi.

### Bundan Sonra:
- **pass_rate gerçek kapsama göre raporla — 5. direktif, hard kural** — Skipped checkler paydaya dahil. "passed: 5 / total: 7 (skipped: 2) → gerçek pass_rate: %71". 1.0 sunmak kural ihlali.
- **Savunma şirketlerinde IAS 29 zorunlu** — Parasal kazanç/kayıp tespit edildiğinde: (a) IS'ten ayrıştır, (b) duzeltilmiş EBITDA ve net kar raporla, (c) "IAS 29 etkisi: X TRY" tablosu downstream'e gönder.
- **CF skipped = parse eskalasyonu otomatik tetiklemeli** — CF_TOTAL_RECONCILE atlandığında parse_standardization'a "P1 eskalasyon: ICF/FCF null" iletisi gönderilecek. ASELS'te uygulanmadı; bir sonraki analizde hard kural.

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
