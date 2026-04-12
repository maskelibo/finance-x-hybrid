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
