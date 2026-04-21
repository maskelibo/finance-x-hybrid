# Reconciliation Agent — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | Reconciliation Agent |
| Uzmanlık | Veri Mutabakatı |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 1 (+ 1 gerçek görev) |
| Ortalama Öğrenme Puanı | 82.5/100 |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Veri karşılaştırma | 5 | İlk gerçek görevde 5 tutarsızlık tespit edildi |
| Tutarsızlık tespiti | 6 | Matematiksel imkansızlık (Net Profit > EBITDA) tespit edildi |
| Çelişki çözümleme | 4 | Materiality test uygulandı, source priority rule kullanıldı |
| Kaynak önceliklendirme | 5 | KAP > Fintables hiyerarşisi uygulandı |
| Mutabakat raporu | 7 | 180 satır detaylı JSON + markdown rapor üretildi |
| Confidence scoring | 6 | 0.00–1.00 arası skalada güven puanları atandı |
| Cross-statement validation | 3 | Teorik bilgi var, pratik sınırlı (CF eksikliği) |
| Trend analysis | 5 | Multi-period revenue anomaly detection yapıldı |

---

## Mutabakat Kuralları

### Kaynak Öncelik Hiyerarşisi
1. KAP Audited Financial Statements (PDF/XBRL) — EN YÜKSEK PRİORİTE
2. Company Investor Relations (official)
3. Financial data aggregators (Fintables, Investing.com)
4. News/analyst reports

### Materiality Testi
- Absolute threshold: 50M TRY (BIST100 şirketleri)
- Relative threshold: 1%
- İkisinden biri aşılırsa → MATERIAL kabul edilir

### Muhasebe Kontrol Denklemleri
- Net Profit < EBITDA (her zaman — D&A, Interest, Tax pozitif olduğundan)
- Assets = Liabilities + Equity (bir değer eksikse hesapla, ratio check yap)
- EBITDA = Net Profit + D&A + Interest + Tax

### Escalation Protokolü
"PROCEED BLOCKED" kararı verildiğinde:
1. CEO'ya derhal escalate et
2. Blocked reason: kritik tutarsızlıkları listele
3. Downstream agentları DURDUR — veri kalitesi yetersiz
4. Resolution bekle, sonra devam et

### Tutarsızlık Çözüm Adımları
1. Flag et (confidence 0.00, status INVALID)
2. Parse Standardization'a re-extraction request gönder
3. Re-extraction sonrası yeniden validate et
4. Hala hatalıysa CEO'ya escalate et

### Restatement Detection
- Multi-year analizde önceki yıl comparative figures değişmiş mi kontrol et
- Değiştiyse → restatement var (accounting policy change, error correction, reclassification)
- Tespit edip flag etmek zorunlu

---

## Öğrenilen Dersler

### Ders 1 — Matematiksel İmkansızlık (SISE 2021)
Net Profit (9.1B TRY) > EBITDA (7.6B TRY) tespit edildi. Temel muhasebe denklemleri kaynak ne kadar güvenilir olursa olsun her zaman kontrol edilmeli. Matematiksel imkansızlık = veri hatası, confidence 0.00 atanmalı.

### Ders 2 — Materiality Testi (SISE 2024 Equity)
Fintables (208.1B) vs alternatif kaynak (186.06B) — 22B TRY (%10.6) fark. Hem absolute hem relative threshold aşıldı → MATERIAL. Çözüm için KAP birincil kaynak kontrol edilmeli; conflict tespit edince "PREFERRED_SOURCE" demek yetmez, kaynağı kendin belirleyip downstream'e göndermelisin.

### Ders 3 — Escalation Mekanizması Eksikliği
"PROCEED BLOCKED" denilmesine rağmen downstream agentlar çalışmaya devam etti. Rapor etmek yetmez — pipeline aktif olarak durdurulmalı ve CEO'ya iletilmeli.

### Ders 4 — Balance Sheet Equation Validation
Total Liabilities eksik olduğunda equation check atlandı. Doğru yaklaşım: eksik değişkeni hesapla (L = A – E), mantıklı mı kontrol et, değilse discrepancy flag et.

---

## KPI Takip Tablosu

| Tarih | Görev | Sonuç | Puan |
|---|---|---|---|
| 2026-04-10 | İlk gerçek görev — SISE veri mutabakatı | 5 tutarsızlık, 2 kritik, data quality 0.42/1.00 | 88/100 |

---

## CEO Geri Bildirimi — 2026-04-10 — AKBNK Raporu

### Eksikler:
- **Discrepancy #2 YARIM KALMIŞ:** Balance sheet gap analizi başlamış ama çözüm yok — discrepancy tespit edip bırakma, ÇÖZMEK zorunlu
- **Equity reconciliation yapılmamış:** 2021-2025 retained earnings continuity check eksik (açılış + net kar - temettü = kapanış kontrolü yok)
- **NPL classification consistency check eksik:** NPL oranı dönemler arası tutarlı mı, BDDK standardına uygun mu doğrulanmamış
- **Capital adequacy cross-period validation eksik:** CET1 %21.8 → %12.5 düşüş mantıklı mı, sermaye hareketleri ile uyumlu mu kontrol edilmemiş

### Bundan Sonra:
- Discrepancy tespit et → ÇÖZ → downstream'e tek doğrulanmış değer gönder (iki farklı değer göndermek YASAK)
- Banka analizlerinde equity reconciliation + NPL consistency + capital adequacy validation ZORUNLU kontroller
- Her discrepancy için: (1) Flag, (2) Root cause araştır, (3) Doğru değeri belirle, (4) Yanlış kaynağı işaretle, (5) Tek değer downstream'e
- Output'ta yarım analiz bırakma — başladığın her kontrol tamamlanmalı

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Eksikler:
- **Segment data validation yapılamadı:** IFRS 8 segment toplamları = konsolide total doğrulaması yapılmadı (veri eksikliği nedeniyle) — upstream'e segment extraction eksikliğini escalate edilmemiş
- **Balance sheet equation verify edilemedi:** Assets = Liabilities + Equity kontrolü yapılamadı (Liabilities breakdown eksik) — bu critical validation eksik
- **2024 margin collapse açıklaması yok:** Net margin %13 → %1.15 düşüşü (%-91) ve OCF +152B → -102B reversal için root cause validation yapılmamış — audit notes ile doğrulanmalıydı
- **2021 revenue anomaly çözülmedi:** 346B → 1,716B (%395 artış) için restatement note validation eksik

### Bundan Sonra:
- Upstream veri eksikliği (segment data, balance sheet components) tespit ettiğinde ESCALATE — "veri yok" deyip geçme, data_collection veya parse_standardization'a structured data request gönder
- Holding şirketlerinde segment reconciliation ZORUNLU: Σ(Segment revenue) = Consolidated revenue; eliminasyon tutarlarını ayrı flag'le
- Balance sheet equation eksikse → eksik komponenti hesapla (L = A - E), makul mı kontrol et, değilse discrepancy flag et
- Olağandışı finansal hareketler (>%50 margin değişimi, OCF sign reversal) için audit note cross-validation ZORUNLU — parse_standardization'dan audit notes explanation talep et
- Multi-year revenue anomaly (>%100) için prior period restatement check ZORUNLU — 2022 comparative figures 2021'i revise etmiş mi kontrol et

---

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu (#2)

### Eksikler:
- **Balance sheet imbalance (415,600M TRY) ÇÖZÜLMEDEN BIRAKILMIŞ:** NCI (Non-controlling Interests) hipotezi oluşturulmuş ama DOĞRULANMAMIŞ — KAP annual report balance sheet'ten NCI satırını bulup doğrulaman gerekiyordu
- **Segment reconciliation yapılamamış:** Upstream veri eksikliği (segment data yok) tespit edilmiş AMA upstream'e escalate edilmemiş — data_collection/parse_standardization'a structured data request gönderilmemiş
- **2024 margin collapse root cause validation yok:** Net margin %13 → %1.15 (%-91 düşüş) ve OCF +152B → -102B reversal için audit notes cross-validation yapılmamış
- **2021 revenue anomaly çözülmemiş:** 346B → 1,716B (%395 artış) için restatement note doğrulaması yapılmamış
- **Confidence scoring tutarsız:** Overall confidence 0.65 (MEDIUM) ama critical imbalance çözülmemiş — bu durumda confidence 0.40-0.50 (LOW) olmalıydı

### Bundan Sonra:
- **Hipotez oluşturmak yetmez — DOĞRULA:** Balance sheet imbalance için NCI hipotezi mantıklı AMA KAP annual report balance sheet'ten NCI satırını bul, tutarı karşılaştır, hipotezi confirm et — "likely NCI" demek yetmez, "NCI confirmed at 415,600M TRY per KAP FY2025 BS" demen gerekiyor
- **Upstream veri eksikliği = ESCALATE:** Segment data yok, balance sheet components yok → bu critical validation gap → data_collection/parse_standardization'a STRUCTURED REQUEST gönder: "KCHOL FY2025 için IFRS 8 segment revenue/EBITDA/assets ve balance sheet liability breakdown extract etmek ZORUNLU, yoksa reconciliation tamamlanamıyor"
- **Olağandışı finansal hareket = audit note mandatory:** >%50 margin değişimi, OCF sign reversal, >%100 revenue jump → parse_standardization'a audit note extraction request gönder, dönen note ile cross-validate et
- **Multi-year revenue anomaly protocol:** %395 artış görürsen → (1) 2022 annual report'ta 2021 comparative figures revise edilmiş mi kontrol et, (2) Restatement note var mı bul, (3) Scope change / M&A / accounting policy change var mı doğrula
- **Confidence scoring kalibrasyon:** Critical imbalance çözülmemişse confidence >0.60 olamaz — gerçekçi skor ver (0.40-0.50 LOW range)
- **Balance sheet equation HER ZAMAN check et:** Assets = Liabilities + Equity + NCI → eğer Liabilities eksikse, hesapla (L = A - E - NCI), makul mı kontrol et, değilse discrepancy flag et ve upstream'e escalate et

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL Raporu

### Eksikler:
- **Cash Flow reconciliation TRUNCATED:** Cash flow ties (OCF → FCF → Net Debt change) başlamış ama kesilmiş — tamamlanmamış
- **Cross-statement ties eksik:** Income Statement net income → Cash Flow OCF → Balance Sheet cash change reconciliation yapılmamış
- **5G spectrum acquisition accounting validation yok:** $1.224B spectrum acquisition Balance Sheet'te intangible asset olarak mı kapitalize edilmiş, Cash Flow'da financing mi operating mi, doğrulanmamış
- **Telecom-specific reconciliation checks eksik:**
  - Spectrum amortization (Income Statement) = Intangible asset reduction (Balance Sheet) consistency check yok
  - CAPEX (Cash Flow) = PPE increase (Balance Sheet) reconciliation yok
  - Subscriber acquisition costs accounting treatment validation yok

### Bundan Sonra:
- **Cash Flow reconciliation FULL EXECUTION zorunlu:**
  - OCF = Net Income + D&A + Working Capital Change + non-cash items
  - FCF = OCF - CAPEX
  - Net Debt change = Cash Flow financing activities - Cash Flow debt repayment
  - Cash balance change = OCF + Investing CF + Financing CF
- **5G spectrum acquisition accounting validation (telecomda kritik):**
  - Balance Sheet: Intangible assets artışı = Spectrum payment ($1.224B)
  - Cash Flow: Investing activities → Intangible asset acquisition = $1.224B outflow
  - Income Statement: Amortization expense başladı mı? (TRY 2.34B/year 17 yıl)
  - Cross-check: Amortization başlangıç tarihi (Oct 2025) ile tutarlı mı?
- **Telecom CAPEX reconciliation:**
  - CAPEX (Cash Flow Investing) = PP&E increase (Balance Sheet) + Depreciation (Income Statement)
  - 5G rollout CAPEX intensity (%25 revenue guidance) ile actual CAPEX tutarlı mı?
- **Output truncation önleme:** Reconciliation tamamlanmadan output gönderme — truncation olacaksa CEO'ya escalate et

---

## CEO Direktifi — 2026-04-11 — SİSTEMİK İYİLEŞTİRME

### YENİ ZORUNLU KURALLAR (system_prompt güncellendi):

**7 OTOMATİK CROSS-STATEMENT KONTROL artık ZORUNLU:**

| # | Kontrol | Severity | Fail Durumunda |
|---|---------|----------|---------------|
| 1 | Bilanço Dengesi (A = L + E) | CRITICAL | Output BLOCK |
| 2 | Gelir Tablosu Zinciri (Revenue→COGS→GP→EBIT→PBT→Tax→NI) | HIGH | Output BLOCK |
| 3 | Nakit Akış Mutabakatı (Opening + OCF + ICF + FCF = Closing) | HIGH | Flag + document |
| 4 | Özsermaye Roll-Forward (Opening + NI - Div ± OCI = Closing) | MEDIUM | Flag + warning |
| 5 | Net Income Cross-Check (IS NI = CF starting NI) | HIGH | Flag + investigate |
| 6 | Working Capital Veri Tamlığı (11 zorunlu kalem) | HIGH | Upstream escalation |
| 7 | Anomali Tespiti (Revenue/NI/OCF outliers) | MEDIUM | Flag + CEO approval |

**Working Capital Tamlık Kontrolü — 11 Zorunlu Kalem:**
Financial analysis agent aşağıdaki kalemlerin HEPSİNE ihtiyaç duyuyor. Biri bile eksikse upstream'e structured request gönder:
1. Trade Receivables (Ticari Alacaklar)
2. Inventories (Stoklar)
3. Trade Payables (Ticari Borçlar)
4. Current Assets toplam
5. Current Liabilities toplam
6. Short-term Borrowings
7. Long-term Borrowings
8. Cash & Cash Equivalents
9. CAPEX
10. Interest Expense (Faiz Gideri)
11. Depreciation & Amortization

**Anomali Tespiti Auto-Flag Kuralları:**
- Revenue YoY > ±50% → REVENUE_ANOMALY
- Net Income YoY > ±80% → PROFIT_ANOMALY
- OCF işaret değişikliği → CASH_FLOW_REVERSAL
- Net Margin < 0.5% (Revenue > 1T TRY) → MARGIN_COMPRESSION
- EBIT Margin YoY düşüş > 5pp → OPERATIONAL_DETERIORATION

Bu kurallar KCHOL raporundaki anomalilerin (2024 margin collapse, OCF reversal, 2021 revenue anomaly) tespit edilip çözülememesi sebebiyle eklendi.

---

*Bu dosya her gece 05:30–06:00 arasında güncellenir.*
*Dosya sahibi: Reconciliation Agent | Denetleyen: META (CEO)*
## ✅ CEO Geri Bildirimi — 2026-04-11 — TCELL RAPORU (POST DELTA-UPDATE)

### POZİTİF NOKTALAR:
- ✅ **7 otomatik cross-statement kontrol HEPSİ PASSED:**
  1. Bilanço dengesi (A = L + E): PASSED — variance 0 TRY
  2. Gelir tablosu zinciri: PASSED — tüm satırlar reconcile
  3. Nakit akış mutabakatı: PASSED — 2021-2025 tüm yıllar
  4. Özsermaye roll-forward: PASSED — OCI adjustments explained
  5. Net income cross-check: PASSED — IS NI = CF starting NI
  6. Working capital tamlığı: PASSED — 11 zorunlu kalem tam
  7. Anomali tespiti: PASSED — 5G subscriber controversy (15M vs 2M) flagged
- ✅ **5G abone tutarsızlığı DOĞRU ele alındı:** CONTESTED, Q1 2026 earnings validation scheduled (April 24)
- ✅ **FX reconciliation:** 80% FX debt vs 81% FX cash — net FX position analyzed, double-hit risk flagged

### Bundan Sonra:
- ✅ TÜM zorunlu kontroller başarıyla uygulandı
- Telecom EK: CAPEX reconciliation (CF CAPEX = BS PP&E + IS depreciation)

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **CHECK 1 FAIL → Alternatif kaynak denenmeden BLOCKED:** Balance sheet imbalance doğru tespit edildi ve kök neden (IAS 29) doğru teşhis edildi. Ancak "upstream escalation" yapılmadan önce alternatif kaynak aranmadı. KAP'ta TUPRS konsolide SPK tabloları doğrudan erişilebilir — faaliyet raporu özetindeki imbalance tam tabloda çözülüyor olabilirdi.
- **CHECK 6 PARTIAL PASS — 3 working capital kalemi tahmini:** DSO, DIO, DPO hesabı için gereken alacak devir hızı, stok devir hızı ve borç devir hızı verileri KAP quarterly tablosundan çekilemedi. Bu 3 kalemin tahmini olduğu açıkça downstream'e iletilmeli ve CCC hesabının güven aralığını etkilediği belirtilmeli.
- **Anomaly detection kapsamı dar:** Sadece Revenue YoY ve Net Margin anomalisi flaglendi. Rafineri şirketlerinde asıl kritik anomali: Rafineri marjı $/bbl trendi (19 → 14 → 11 → 7 $/bbl). Bu operating anomali finansal tablolardan önce tespit edilmeli.

### Bundan Sonra:
- **BLOCKING kararından önce alternatif kaynak protokolü:** CHECK 1 FAIL → Adım 1: Aynı veriyi farklı KAP kaynağından (tam konsolide tablo vs özet rapor) çek. Adım 2: Hâlâ fail → BLOCKED + upstream escalation. Doğrudan eskalasyon kabul edilemez.
- **CCC hesabı güven notu:** DSO/DIO/DPO herhangi biri tahmini ise, CCC sonucuna "MEDIUM CONFIDENCE — 3 tahmini girdi" notu zorunlu.
- **Rafineri şirketleri anomaly listesi:** Rafineri marjı ($/bbl) trendi, kapasite kullanımı değişimi, ham petrol alım fiyatı vs. benchmark — bunlar finansal anomaly detection'dan ÖNCE kontrol edilmeli.

---

## ❌ CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu — KRİTİK BAŞARISIZLIK

### Eksikler:

1. **YANLIŞ EBITDA ONAYLANDI — 66% sapma:**
   - Reconciliation çıktısı: EBITDA 34,025B TRY → "APPROVED"
   - KAP doğrulaması: Gerçek EBITDA 20,451B TRY
   - Sapma: +13,574B TRY fazla (+66%). Bu seviyede sapma CHECK sistemi tarafından flaglenmedi.

2. **NAKİT TANIMI KRİTİK HATASI — dar nakit kullanıldı:**
   - Reconciliation çıktısı: Nakit 2,150M TRY (dar nakit: yalnızca "nakit ve nakit benzerleri")
   - Gerçek likit varlıklar: 115,476M TRY (kısa vadeli finansal yatırımlar dahil)
   - EREGL gibi kapsamlı hazine yönetimi yapan şirketlerde dar nakit kullanımı yanıltıcıdır.
   - Kural: Net Borç = Finansal Borç − (Nakit + Kısa Vadeli Finansal Yatırımlar)

3. **NET BORÇ HESABI TAMAMEN YANLIŞ — toplam yükümlülük kullanıldı:**
   - Reconciliation çıktısı: Net Borç = Toplam Borç (261,251B TRY) − Dar Nakit (2,150M TRY) ≈ 259B TRY
   - Doğru hesap: Net Borç = Finansal Borç (158,340B TRY) − Likit Varlıklar (115,476M TRY) ≈ 42,864M TRY
   - Net Borç/EBITDA çıktısı: 5.0x (YANLIŞ) — gerçek: ~2.1x
   - Finansal borç ≠ toplam yükümlülük. Ticari borçlar, vergi borçları, ertelenmiş vergi buraya dahil edilmez.

4. **CHECK 7 ANOMALİ TESPİTİ BAŞARISIZ:**
   - EBITDA marjı parse_standardization'dan 34,025 / 212,500 = %16.0 — sektör ortalaması %8-10
   - Bu %6-8 puanlık marj anomalisi CHECK 7 tarafından flaglenmedi.
   - Net kâr (14.1B) / EBITDA (34,025B) = %41.4 kâr dönüşümü — endüstriyel üretici için anormal yüksek, flaglenmedi.

5. **KALİTE SKORU 0.91 EXCELLENT — YANLIŞ VERİ ÜZERİNDE VERİLDİ:**
   - Tüm 7 CHECK "PASSED" olarak kaydedildi, ancak verilerin doğruluğu değil tutarlılığı test edildi.
   - İç tutarlılık ≠ kaynak doğruluğu. Yanlış veri tutarlı şekilde kopyalandığında tüm checkler geçer.

6. **IAS 29 PARASAL KAZANÇ AYRIŞTIRILMADI:**
   - EREGL 2025 IAS 29 parasal kazanç net kârı önemli ölçüde etkiledi.
   - Reconciliation bu ayrımı yapmadı; net kâr rakamı hiperflasyon düzeltmesi dahil mi hariç mi belirsiz kaldı.

### Bundan Sonra:

- **KURAL: Net Borç = Finansal Borç − (Nakit + Kısa Vadeli Finansal Yatırımlar)** — Toplam yükümlülük ASLA kullanılmaz. Bilanço dipnotlarından finansal borç kalemi (banka kredileri + tahvil + finansal kiralama) ayrıca doğrulanır.

- **KURAL: Marj anomali eşiği sektöre göre kalibre edilir:**
  - Çelik/emtia üreticisi: EBITDA marjı >%15 → otomatik FLAG + kaynak çapraz doğrulaması zorunlu
  - Net kâr/EBITDA oranı >%35 → otomatik FLAG (IAS 29 veya olağanüstü kalem şüphesi)

- **KURAL: Kalite skoru bileşik hesap — doğruluk skoru ayrı tutulur:**
  - İç tutarlılık skoru (mevcut 7 CHECK): ayrı
  - Kaynak doğruluğu skoru (en az 1 bağımsız veri noktası ile çapraz doğrulama): ayrı
  - Final kalite skoru = İç tutarlılık × 0.5 + Kaynak doğruluğu × 0.5
  - Kaynak doğrulaması yapılmadan "0.91 EXCELLENT" verilemez.

- **KURAL: IAS 29 ön kontrol zorunlu (tüm Türk şirketleri):**
  - Parasal kazanç/kayıp kalemi tespit edildiğinde: (a) gelir tablosundan ayrıştır, (b) düzeltilmiş EBITDA ve net kâr ayrıca raporla, (c) "IAS 29 etkisi: X TRY" notu ekle.

- **KURAL: CHECK 7 genişletilmiş anomali listesi — çelik/emtia şirketleri için:**
  - EBITDA marjı > sektör ortalaması +5 puan → FLAG
  - Net Borç/EBITDA > 4.0x veya < 0.5x → kaynak doğrulama zorunlu
  - Nakit (dar) / Toplam likit varlıklar < %5 oranı → dar nakit tanımı sorgula
  - Net kâr/EBITDA > %35 → IAS 29 veya olağanüstü kalem şüphesi

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu
### Eksikler:
- Birçok satır için gerçek belge/sayfa referansı yerine açıklayıcı fakat ikincil görünen etiketler kullandın.
- FCF yönü konusunda data_collection ile çelişkiyi kök neden analiziyle kapatmadın.
- Parse-standardization ile kritik sayı çatışmasını not ettin ama downstream'i bloklayacak net `authoritative approved figures` bölümü vermedin.
- "Audited", "bank confirmations" gibi ifadeler belge seviyesinde gösterilmeden kullanıldı.
### Bundan Sonra:
- Her kritik kalem için belge adı, sayfa ve dipnot referansı zorunlu olsun.
- Çelişkili metriklerde yalnız farkı yazma; hangisini neden seçtiğini açıkla.
- EBITDA, net kâr, FCF, net borç gibi çekirdek rakamlar için ayrı `final approved figure` bölümü yayınla.
- Belgede açık olmayan audit/destek ifadelerini kullanma.

---

---

## [2026-04-14] Gece Eğitimi #2 — Batch 1/4

**Araştırma Konuları:** IFRS 16 havacılık bilanço etkisi, CBAM provision reconciliation, holding discount güncel benchmarklar

**Temel Bulgular:**

1. **IFRS 16 havacılık etkisi quantified:** ROU varlıkları toplam aktifi %20-23 oranında şişirebilir. Bilanço dengesi kontrolünde ROU varlık + kiralama borcu paralel hareket etmeli. Net Borç formülüne finansal kiralama borcu dahil edilmeli (THYAO CEO feedback doğrulandı).

2. **CBAM provision yeni kalem:** 2026'dan itibaren çelik şirketlerinde CBAM karşılığı bilançoya girecek. Bilanco dengesini incelerken "Diğer Karşılıklar" artışı → CBAM flag.

3. **Holding discount güncel Nisan 2026:** KCHOL hedef 298.62 TL vs işlem 202.50 TL (~%32 iskonto). SAHOL P/BV 0.56 (~%44 iskonto). Türkiye holding discount aralığı %25-45 olarak revize edilmeli (önceki %10-40 artık dar).

4. **THYAO CEO feedback özeti:** D1 equity gap 141B TRY — SE tablosu çekilmeden root cause tespit edilemedi. CF yokken Cross-Statement score 0.65 = yanlış kalibrasyon (0.00 olmalı).

**memory.md değişiklikleri:** CEO feedback özetlendi. "Son 3 Raporun" ve "Sektor Bilgi" kaldırıldı. IFRS 16 lease borcu Net Borç kuralı + CF yokken score=0.00 kuralı + CBAM provision ve IFRS 16 bilanço etkisi eklendi.

**knowledge.md değişiklikleri:** IFRS 16 Havacılık Reconciliation, CBAM Provision, Holding Discount Güncel Benchmark bölümleri eklendi.

**Öğrenme Puanı: 84/100**

## Purge 2026-04-21 23:11 — 13 section (en yeni: 2026-04-16)

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
