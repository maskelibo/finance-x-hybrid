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

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **DISC-004 (ticari borç 19,628 vs Not 8: 68,762 mn) çözümsüz bırakıldı** — "AÇIK" olarak flaglendi ama downstream için tek doğrulanmış değer seçilmedi. Kural: discrepancy tespit et → çöz → tek değer gönder. financial_analysis Not 8'i zaten kullandı; reconciliation da doğruyu kilitlemeliydi.
- **FY2021-2023 reconciliation hiç yapılmadı** — Sadece FY2025 ve kısmen FY2024 kontrol edildi. 5 yıllık seri zorunlu; en azından bilanço dengesi (A=L+E) her yıl için check edilmeli.
- **ICF ve Finansman CF cross-check eksik** — "OCF/FCF doğrulandı; tam hat bazlı ekstraksiyon eksik" yazıldı ama tam CF mutabakatı (Opening + Net Change = Closing) doğrulanmadı.
- **Özsermaye mutabakatı (Check 5) yapılmadı** — SE tablosu eksik olduğu için "PENDING" etiketiyle geçildi; bu durumda confidence 0.72 aslında çok yüksek. SE yokken equity check 0.00 olmalı.
- **IAS29 normalize NI tablosu tek satır notla geçildi** — "ias29_adjusted_NI = −182 mn TRY" hesaplandı ✓ ama bu bulgunun downstream etkisi (skor kartı, değerleme, hedef fiyat) ayrıca belirtilmedi.

### Bundan Sonra:
- **DISC-004 gibi açık ticari borç çelişkisinde: Not'u oku, doğru değeri kilitle** — "AÇIK" bırakma; financial_analysis ve DPO/CCC için hangi değerin kullanılacağını sen belirle ve tek değer downstream'e gönder.
- **5 yıllık bilanço dengesi kontrolü zorunlu** — Her raporlama yılı için A=L+E check'ini yap; tek yıl değil, 5 yıl birden.
- **CF mutabakatı tam 3 bölüm** — OCF + ICF + Financing = Net Change; Opening + Net Change = Closing. Sadece OCF yetmez.
- **IAS29 adjusted NI downstream'e ayrıca bildir** — "Normalize NI = X mn TRY" bulgusu finansal analiz, değerleme ve skor kartı için kritik girdi; "not" olarak değil, ayrı tablo olarak gönder.

## CEO Geri Bildirimi — 2026-04-14 — THYAO

**CEO 2026-04-14 THYAO:** D1 equity gap 141B TRY root cause yok (SE tablosu eksikti). WC confidence 0.45. Net Borç earnings call bazli tek kaynak. CF yokken Cross-Statement score 0.65 = yanlis kalibrasyon.
- **IFRS 16 havacilik Net Borc:** Net Borc = Finansal Borc + Finansal Kiralama Borcu - (Nakit + KV Yatirim). Sadece kredi+tahvil kullanma; lease borcu ayri satirda cek.
- **CF yokken Cross-Statement score = 0.00** — CF olmadan nakit mutabakati yapilamaz; yapay puan tutma.
- **Equity gap hipotez yetmez** — SE tablosunu cek: Opening + NP + OCI - div ≠ Closing → her satiri izle, KAP'tan dogrula.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **FAVÖK / IAS29 çelişkisi Tour 1'de ortaya çıktı, Tour 2'de düzeltildi ✓** — 34,541 → 22,515 TRY mn (FAVÖK) ve 59,845 → 21,622 TRY mn (IAS29) düzeltmeleri KAP PDF'e dayandırıldı. Doğru kurtarma.
- **CF/SE Check 3-5 BLOCKED** — Tour 2 sonunda da çözülemedi. Confidence 0.72 burada sınır; Check 3-5 olmadan 0.80+ güven olamaz.
- **Working Capital 11 zorunlu kalemden eksikler var** — Ticari alacaklar Q3 2025 kısmi; stoklar, ticari borçlar tam değil. DSO/DIO/DPO/CCC hesaplanamadı.
- **OPEX dağılımı yapılmadı** — Brüt kar - EBIT farkından OPEX çıkarıldı ama alt kalemler (kira gideri, personel, amortisman) ayrıştırılmadı.

### Bundan Sonra:
- **Perakende sektörü Working Capital öncelikli** — Perakendecilerde CCC (Nakit Dönüşüm Süresi) kritik KPI; DIO (stok devir günü) ve DPO (borç ödeme günü) özellikle önemli. CF/SE yokken BS'den tahmin yap ve "[BS tahmin, conf: MEDIUM]" etiket. Sıfır vermek yerine tahmin + güven notu ver.
- **IAS29 etkisini ayrıştırılmış FAVÖK tablosunu standart çıktıya ekle** — Her Türk şirketinde IAS29 öncesi / sonrası FAVÖK tablosu karşılaştırması zorunlu output alanı.
- **Bilanço denkliği mükemmel ✓** — A = L + E = 189,039 TRY mn çelişkisiz. Bu standardı koru.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **Revenue P0-2 "RESOLVED" kabul edildi ama kaynak çelişkisi devam ediyordu** — 802.669B TRY = Q4, FY = 2.76T TRY. Reconciliation GCM Q4 raporunu "audited FY2025" olarak onayladı; bu yanlış. CHECK 2 "PASS" verilmemeli, "CONTESTED — dönem tanımı çelişkili" olarak kalmalıydı.
- **Balance sheet imbalance 3.646 trilyon TRY çözülmeden "varsayım" ile geçildi** — "Liabilities + Equity ~1.654T, Assets 5.300T → muhtemelen veri eksikliği" yorumu yapıldı. CHECK 1 BLOCKED ile bırakmak doğru; ancak YKBNK'nın 924B TRY konsolide aktifi açıklaması bu büyüklüğü destekler mi? Bu sorgulama yapılmadı.
- **Confidence 0.51 ama CHECK 1 BLOCKED** — Kural: "Kritik imbalance çözülmemişse confidence >0.60 olamaz." 0.51 verilen skor bu eşiğin altında ✓, ancak upstream'e daha güçlü "CHECK 1 FAIL = pipeline BLOCK" mesajı verilmeliydi.
- **Segment reconciliation (segment toplamı = konsolide) hiç denenmedi** — GCM SOTP'tan segment EBITDA'lar mevcuttu; bunların toplamı konsolide EBITDA ile eşleşiyor mu kontrolü yapılmadı.
- **IAS 29 cross-check yapılmadı** — Konsolide gelir tablosundaki parasal kazanç/kayıp kalemi çekilmeden IAS 29 etkisi "DATA GAP" olarak bırakıldı; GCM raporundan tahmini bir değer bile konulmadı.

### Bundan Sonra:
- **Revenue "RESOLVED" kararı için dönem tanımını kilitle** — "Q4 2025 geliri ile FY2025 gelirini aynı satırda karıştırma" kontrolü CHECK 2'nin bir parçası olmalı. FY vs Q4 ayrımı açıkça gösterilmeden CHECK 2 PASS verilemez.
- **YKBNK konsolidasyonu imbalance açıklamasına dahil et** — Banka konsolidasyonu bilanço şişirmesi bilinen bir yapı; bu yapıyı CHECK 1'in yanında açıklayıcı not olarak sun, "varsayım" değil "yapısal açıklama" olarak.
- **Segment reconciliation holding için zorunlu** — GCM veya herhangi bir analist SOTP'undaki segment katkı rakamları toplanıp konsolide EBITDA ile karşılaştırılmalı. Fark >%10 → FLAG.

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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **3 kontrol "skipped" — CF ve SE eksikliği** — CF_TOTAL_RECONCILE, BS_EQUITY_SPLIT, IS_NET_SPLIT hepsi "skipped: not reported". pass_rate = 1.0 görünüyor ama aslında 4 check geçti, 3 atlandı. Bu "1.0" yanıltıcı; gerçek kapsam %57.
- **IFRS 16 lease borcu Net Borç formülüne dahil edilmedi** — Havacılık direktifi: Net Borç = Finansal Borç + Finansal Kiralama Borcu - (Nakit + KV Yatırım). THYAO için kira borcu çok kritik ($25B+ ROU yükümlülüğü); sadece "585,851 mn TRY = ST+LT - Cash" hesabı eksik bırakıyor.
- **5-yıllık bilanço dengesi kontrolü yapılmadı** — Sadece FY-2025 kontrol edildi. Kural: her raporlama yılı için A=L+E check.
- **CF mutabakatı "skipped" ama investing/financing CF parse'da null** — Bu null'ları escalation konusu yapılmadı; "not reported" ile geçildi. Doğru aksiyon: "CF_TOTAL_RECONCILE SKIPPED — parse_standardization'a ICF/FCF talebi" eskalasyonu.

### Bundan Sonra:
- **Havacılık Net Borç = IFRS 16 dahil** — Net Borç formülüne finansal kiralama borcu (ROU lease liability) her havacılık analizinde zorunlu dahil. "ST+LT − Cash" hesabı havacılık için yeterli değil.
- **pass_rate = "skipped_rate" gerçeği yansıtmıyor** — 3 check skipped + 4 passed → gerçek pass_rate = 4/7 = %57. "1.0" raporlama yanıltıcı; downstream bunu "tüm checkler geçti" sanıyor. Skipped checkler ayrı "skipped_due_to_missing_data" notla belirtilmeli.
- **CF skipped → parse'a P1 eskalasyon** — CF_TOTAL_RECONCILE atlandığında reconciliation: "ICF/FCF parse'da null — parse_standardization'a P1 eskalasyon: yatırım ve finansman CF zorunlu" yazmalı.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu (Post-Report Loop)

### Eksikler:
- **3 kontrol "skipped" — pass_rate 1.0 yanıltıcı** — CF_TOTAL_RECONCILE, BS_EQUITY_SPLIT, IS_NET_SPLIT hepsi "skipped: not reported". Gerçek pass_rate = 4/7 = %57 ama çıktı 1.0 gösteriyor. Bu downstream'i "tüm checkler geçti" sanmasına yol açıyor.
- **IFRS 16 lease borcu Net Borç formülüne dahil edilmedi** — THYAO için $25B+ ROU yükümlülüğü; Net Borç = 585,851 mn TRY (ST+LT−Cash) eksik formül. "Havacılık Net Borç = IFRS 16 dahil" direktifi 3. kez uygulanmadı.
- **5-yıllık bilanço dengesi kontrolü yapılmadı** — Sadece FY2025 kontrol edildi; kural: her raporlama yılı için A=L+E check.
- **CF skipped → parse'a eskalasyon yok** — CF_TOTAL_RECONCILE atlandığında "parse_standardization'a ICF/FCF P1 eskalasyonu" direktifi uygulanmadı; "not reported" ile geçildi.

### Bundan Sonra:
- **pass_rate yanıltıcı raporlama giderilecek** — Skipped checkler ayrı "skipped_due_to_missing_data" notla belirtilmeli. "Gerçek pass_rate = 4/7 (%57); 3 check veri eksikliği nedeniyle atlandı" formatı zorunlu.
- **Havacılık Net Borç = IFRS 16 dahil — 3. direktif, kesin kural** — Net Borç = Finansal Borç + Finansal Kiralama Borcu - (Nakit + KV Yatırım). Bir dahaki THYAO'da eski formül tolere edilmez.
- **CF skipped → parse P1 eskalasyonu otomatik tetiklemeli** — "ICF/FCF parse'da null — parse_standardization'a P1 eskalasyon: yatırım ve finansman CF zorunlu" yazmalı.

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

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **CONDITIONAL_PASS verdi — CEO kuralı ihlali:** Pipeline kuralı açık: CONDITIONAL_PASS = BLOCK, istisna yok. Çıktı ya PASS ya FAIL olmalı.
- **EBITDA çelişkisi (50,577M vs 97,400M) çözüme kavuşturulmadı** — Root cause tespit edildi (9A etiketi hatası) ama PDF doğrulaması tamamlanmadan PASS verilemez.
- **CF Check 3 FAIL olarak kaldı** — CAPEX proxy ve nakit balance reverse-engineer durumu "partial" olarak işaretlendi; tam PASS için gerçek kaynak şart.
- **Dış kaynak doğrulaması yapılmadan reconciliation tamamlandı** — EREGL dersine rağmen iç tutarlılık yeterli sayıldı; KAP PDF cross-check yapılmadı.

### Bundan Sonra:
- **CONDITIONAL_PASS kelimesi KULLANILMAYACAK:** Tek kabul edilebilir durumlar: PASS, FAIL, ESCALATE_TO_CEO. "Conditional", "partial", "limited" türevleri YASAK.
- **CF Check FAIL ise output = FAIL:** Upstream'den proxy veri geldiyse FAIL ver ve eksik veriyi listele. CEO direktifi olmadan downstream devam edemez.
- **Dış kaynak çelişkisi FAIL tetikler:** Sadece BS dengesi (A=L+E) yeterli değil. Revenue, EBITDA, Net Kar kaynak bazında cross-check yapılmadan PASS verilemez.

---

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu
### Eksikler:
- Ic tutarlilik testi guclu gorunse de `Overall Confidence: HIGH (0.87)` ve `Ready for downstream` ifadesi erken verildi; downstream ciktilardaki Net Borc/FAVOK, OCF ve operasyonel veri catismalari cozulmeden dosya temiz ilan edildi.
- 5G abone sayisi uyusmazligi `Q1 2026 earnings validation` bekliyor denilerek acik bir fact pack'e baglanmadi; tartismali veri downstream'i kilitlemeliydi.
### Bundan Sonra:
- Reconciliation yalnizca muhasebe esitligini degil kaynaklar arasi sayi uyumunu da kapatacak; kritik catismada `CONTESTED` etiketiyle downstream BLOCK verecek.
- `Ready for downstream` ifadesi ancak net borc, OCF, EBITDA, abone/KPI ve valuation girdileri tek authoritative fact pack'te hizalaninca kullanilacak.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu Post-Report Loop
### Eksikler:
- Net Borc/FAVOK, faiz karsilama, FCF ve KPI tanimlari rapor genelinde farkli formullerle yasarken reconciliation bunlari tek metodolojiye kilitlemedi.
- `CONTESTED` alanlari downstream agent'lari bloke edecek karar formatina donusmedi; sadece not dusulup gecildi.
### Bundan Sonra:
- Reconciliation ciktisi her kritik rasyo icin `formula + numerator + denominator + source period` verecek; ayni rasyo iki yontemle kullaniliyorsa biri primary olarak kilitlenecek.
- Tartismali KPI, FCF zamani veya borc tanimi varsa `ESCALATE_TO_CEO + authoritative fact pack request` olmadan downstream izin verme.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Post-Report Feedback Loop
### Eksikler:
- Fiyat capasi ve teknik taraftaki piyasa degeri varsayimi ile finansal taraftaki valuation girdileri tek bir zaman damgasina sabitlenmedi.
- OCF 96.6bn vs 112.1bn gibi tanim farklari icin `primary measure / secondary measure` kilidi cikmadi; formatter ve summary ayni sayiyi farkli isimlerle kullandi.
### Bundan Sonra:
- Reconciliation, fiyat ve valuation girdileri icin `as_of datetime` zorunlu tutacak; farkli saatli piyasa verileri ayni raporda karismayacak.
- Nakit akisi ve leverage gibi tartismali kalemlerde primary ve secondary tanim ayni blokta yayinlanacak; primary kilitlenmeden downstream PASS verilmeyecek.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **Segment reconciliation (segment EBITDA toplamı = konsolide) yapılmadı** — KCHOL holding; GCM SOTP'tan segment EBITDA katkıları mevcut (TUPRS/FROTO/YKBNK/ARCLK/EREGL/TCELL). Bunların toplamı konsolide EBITDA'ya eşit mi? Bu kontrol yapılmadı. Holding için zorunlu 8. check.
- **ESK-001/003/004 üç eskalasyon açık bırakıldı** — CF FX farkı (68,012 mn), Faaliyet Raporu 1561073, FY2023 CF/SE — bunlar "açık" olarak devredildi. Reconciliation görevi: eskalasyonları açıklamak değil, downstream'e tek doğrulanmış değer göndermek. Açık eskalasyonla final approved figure yayımlanamaz.
- **Solo bilanço hâlâ eksik** — KCHOL parent-only bilanço olmadan leverage analizi (holding-level net borç vs konsolide net borç) yapılamadı. Bu KCHOL'un spesifik riski: banka konsolidasyonu bilanço şişiriyor.
- **Data quality 0.69 ilan edildi ama downstream uyarısı net değil** — 0.69 QA eşiğinin altında; financial_analysis ve valuation'a "düşük kaliteli veri zemini" uyarısı özellikle ve ayrıca yazılmalıydı.

### Bundan Sonra:
- **Holding reconciliation'a zorunlu 8. check ekle: Segment EBITDA Reconciliation** — GCM/analist SOTP'undaki segment katkıları toplanıp konsolide EBITDA ile karşılaştırılacak. Fark >%15 → FLAG + upstream escalation.
- **Açık eskalasyon = final approved figure yayımlama** — ESK formatlı açık maddeler varken "OUTPUT BLOKLANMADI" yazma. Açık maddeleri not olarak ilet ve downstream'i uyar: "aşağıdaki kalemlerde belirsizlik devam ediyor."
- **Solo bilanço KCHOL analizlerinde birinci öncelik** — Faaliyet Raporu 1561073 inmeden solo borç yapısı analiz edilemez; bu data_collection'a P0 olarak verilmeliydi.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **pass_rate 1.0 bildirildi — gerçekte 3/7 check atlandı** — Atlanmış kontroller "N/A" olarak sayıldığı için pass_rate yanıltıcı biçimde 1.0 göründü. Gerçek tamamlama oranı %57. Bu skor COO ve CEO'ya yanlış güven sinyali veriyor.
- **IFRS 16 kiralama borcu Net Borç hesabından dışarıda — 3. THYAO** — Havacılıkta Net Borç = Finansal Borç + IFRS 16 yükümlülükleri − (Nakit + KV Finansal Yatırım). IFRS 16 olmadan net borç eksik gösteriyor; leverage analizi yanıltıcı.
- **CF tablosu atlandı — parse_standardization'a eskalasyon yapılmadı** — CF null geldi; reconciliation kontrol gerçekleştirmeden geçti. Kural: CF check atlandığında parse_standardization'a eskalasyon + BLOCKED sinyal verilmeli.
- **5 yıllık trend tutarlılık kontrolü eksik** — FY2020-2024 zaman serisi kontrolü (revenue büyüme trendi, yıl-yıl tutarlılık) yapılmadı. Bu kontrol bir kez bile gerçekleşmedi.

### Bundan Sonra:
- **pass_rate formülü güncellendi: Tamamlanan check / Toplam tanımlı check (N/A dahil)** — "N/A" = atlandı = başarısız. Gerçek pass_rate = tamamlanan / (tamamlanan + başarısız + atlanmış). 1.0 görmek için tüm checkler tamamlanmış olmalı.
- **IFRS 16 Net Borç zorunlu katmanı (havacılık P0)** — Net Borç = (Uzun Vadeli Finansal Borç + Kısa Vadeli Finansal Borç + IFRS 16 UVK + IFRS 16 KVK) − (Nakit + KV Fin. Yatırım). IFRS 16 null gelirse → data_collection eskalasyonu + check BLOCKED.
- **CF check atlanırsa = parse_standardization'a zorunlu eskalasyon** — "CF verisi null" tespit edildiğinde reconciliation: (1) parse_standardization'a mesaj: "CF tablosu eksik, eskalasyon aç", (2) ilgili checkler FAIL olarak işaret, (3) downstream'e "CF checks: FAILED — eskalasyon açık" bildirimi.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **pass_rate 1.0 bildirildi — 4. THYAO'da aynı yanıltıcı raporlama** — 7 check'ten 3'ü "skipped: not reported" olarak geçildi (CF_TOTAL_RECONCILE, BS_EQUITY_SPLIT, IS_NET_SPLIT). Gerçek tamamlama oranı = 4/7 = %57. "1.0 pass rate" downstream'e yanlış güven sinyali veriyor.
- **IFRS 16 kiralama borcu Net Borç formülüne dahil edilmedi — 4. THYAO** — "Net Debt = 585,851,000,000 TL (ST+LT − Cash)" hesabı havacılıkta eksik formül; THYAO'nun $25B+ IFRS 16 yükümlülüğü dahil edilmedi.
- **CF "skipped" → parse_standardization'a eskalasyon yapılmadı — 4. THYAO** — CF_TOTAL_RECONCILE atlandığında "parse_standardization: ICF/FCF talebi" mesajı gönderilmedi. Direktif 3 kez yazıldı, uygulanmadı.
- **5 yıllık bilanço dengesi kontrolü yapılmadı** — Sadece FY2025 için BS_IDENTITY check yapıldı. FY2020-2024 yıllarının A=L+E kontrolü hiç yapılmadı.
- **overall_decision "pass" ama 3 check atlanmış** — "pass" kararı verilen bir output'ta 3 check atlanmış olması çelişkili; skipped checkler gerçek kapsama göre değerlendirilmedi.

### Bundan Sonra:
- **pass_rate 1.0 = YASAK (4. direktif, artık hard kural)** — Skipped checkler paydaya dahil edilecek. Gerçek kapsam formatı: "passed: 4 / total: 7 (skipped: 3) → gerçek pass_rate: %57". 1.0 sunmak kural ihlali ve downstream manipülasyon riski.
- **IFRS 16 Net Borç = THYAO için sabit formül** — (KV Finansal Borç + UV Finansal Borç + IFRS 16 KVK + IFRS 16 UVK) − (Nakit + KV Finansal Yatırım). data_collection IFRS 16 satırını getirmezse → check FAIL + eskalasyon.
- **CF skip = otomatik eskalasyon (kod seviyesi)** — CF_TOTAL_RECONCILE atlandığında reconciliation otomatik olarak parse_standardization'a "P1 eskalasyon: ICF/FCF null — yatırım faaliyetleri CF zorunlu" iletisi gönderecek.
- **5 yıllık BS kontrol döngüsü zorunlu** — Her raporlama yılı (FY2020-FY2025) için A=L+E check. Eksik yıl → "MISSING_PERIOD_CHECK" flaglenir ve upstream uyarısı verilir.

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
