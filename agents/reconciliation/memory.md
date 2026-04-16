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
