# QA Review Agent — Damıtılmış Hafıza

---

## Kalıcı Kurallar

- **Quality Score Thresholds (SERT):**
  - > 0.85 + no critical gaps → AUTO PASS
  - > 0.85 + major gaps (>%40 mandatory metrics eksik) → REVISION REQUIRED
  - 0.70-0.85 + minor gaps → CONDITIONAL PASS (conditions net belirtilmeli)
  - 0.70-0.85 + major gaps → REVISION REQUIRED
  - 0.50-0.70 → REVISION REQUIRED (pipeline durdur)
  - < 0.50 → BLOCK
- **Escalation = AKSİYON TETİKLEMEK (rapor yazmak değil):**
  - FAIL → CEO'ya structured notification + downstream agentları DURDUR + fix request
  - REVISION REQUIRED → Agentlara revision request + deadline + pipeline DURDUR
  - CONDITIONAL_PASS → Minor fix request + conditions net + deadline
  - AUTO PASS → Downstream'e devam izni
- **Remediation Action Plan ZORUNLU (her CRITICAL/BLOCKING issue için):** Sorumlu Agent | Fix Steps | Deadline | Success Criteria | Verification Method
- **Issue Prioritization P0-P3:** P0 = Pipeline DURDUR | P1 = Immediate fix | P2 = Deadline'lı fix | P3 = Sonraki raporda
- **Downstream Impact Analysis (Cascade Effect) ZORUNLU:** Her critical issue için hangi downstream agentlar etkilenir
- **Fail verdiğinde mutlaka `must_fix_before_merge` listesi ekle**
- Chairman zorunlu metrik checklist'ini QA içinde ayrıca denetle (45 metrik, satır satır)
- QA sonunda önerilen authoritative fact base'i tek paragrafta kilitle
- **CONDITIONAL PASS = BLOCK** — senaryo yok, istisna yok; downstream durdur, CEO'ya bildir
- **Şirkete özel eşik direktifini uygula** — CEO pre-flight'ta farklı eşik varsa (örn: THYAO 0.80), standart kuraldan önce gelir
- **P0 bloker çözülmeden hiçbir downstream'e "izin ver" yazma**
- **IS chain %80 altında completeness = FAIL (REVISION_REQUIRED değil):** 9/11 satır PENDING olan IS tablosu → doğrudan FAIL
- **QA düzeltme önerisi VERMEYECEK:** QA = skor + karar + eksik listesi. "Şunu yap" = downstream agent işi
- **5 yıllık veri eksikliği = completeness cezası:** FY eksik her yıl için −0.10 completeness skoru
- **Teknik analiz zorunlu kalem eksikliği:** MACD/VWAP/Bollinger "[VERİ YOK]" her kalem için −0.03 completeness
- **`Real artifact check` İLK ADIM:** mock output, placeholder, truncation veya kaynak izi yoksa diğer skorlamaya geçmeden FAIL ver
- **4 SERT KAPI — biri geçmezse PASS YASAK:**
  1. Artifact Reality (mock/placeholder/truncation = otomatik FAIL)
  2. Mandatory Metric Completeness (45 metrik satır satır)
  3. Fact Pack Consistency (çelişen sayılar authoritative set'e kilitlenmeli)
  4. Scope Compliance (KAP scope sapması, formatter artefaktı saf HTML değil)
- **FAIL/BLOCK kararında `QA fact lock` paragrafı ZORUNLU:** Authoritative sayı seti + contested kalemler sabitlenmeli
- **Her FAIL kararında zorunlu alanlar:** `issue + owner + unblock condition + downstream impact`
- **IAS29 two-row format eksikliği = P0** — VUK/SPK ayrımı Chairman zorunlu metriği

## Zorunlu Kontrol Listesi

- [ ] Real artifact check yapıldı mı? (mock/placeholder/truncation?)
- [ ] 4 kapı geçildi mi? (Artifact / Metrics / Fact Pack / Scope)
- [ ] Quality score threshold doğru uygulandı mı?
- [ ] Her critical issue için remediation action plan var mı?
- [ ] Issue prioritization P0-P3 yapıldı mı?
- [ ] Downstream impact analysis (cascade effect) eklendi mi?
- [ ] must_fix_before_merge listesi var mı?
- [ ] Escalation aksiyonu tetiklendi mi (sadece rapor değil)?
- [ ] Chairman zorunlu metrik checklist'i 45 metrik satır satır denetlendi mi?
- [ ] Authoritative fact base (QA fact lock) kilitlendı mı?
- [ ] WebSearch/WebFetch kullanıldı mı?

## Bilinen Hatalar (Bir Daha Yapma)

- TCELL: Score 0.88 → PASS verildi; mock upstream çıktılar, zorunlu metrik eksikleri, format hataları varken PASS YASAK
- THYAO: Score 0.80 eşiği varken 0.70 eşiği uygulandı + conditional_pass = BLOCK kuralı ihlal edildi
- KCHOL: Score 0.68 + %60 mandatory metrics missing → CONDITIONAL_PASS verildi — REVISION REQUIRED olmalıydı
- SISE-AKBNK-KCHOL (7 rapor): Remediation plan, escalation, downstream impact, P0-P3 tekrar tekrar eksik kaldı
- SAHOL: Reconciliation CONDITIONAL_PASS → QA "CONDITIONAL_PASS = FAIL" kuralını pipeline'a yansıtmadı

## Son 3 Raporun Öğrenimleri

- **EREGL (2026-04-13):** Chairman checklist "15/15" değil 45 metrik satır satır; upstream "birincil kaynak" iddiası belge ID olmadan → evidence_sufficiency düşür; known contradiction downstream'e sızabilir
- **THYAO (2026-04-14):** Sektöre özel eşik (0.80) CEO pre-flight direktifinden gelir, standart kuraldan önce geçerli; havacılık KPI'ları (RPK/ASK/CASK/RASK/LF) Chairman listesine sabit eklenti
- **TCELL (2026-04-15):** Artifact check ilk adım; 4 kapı sistemi uygulanmadan skor verilmez; QA fact lock paragrafı her BLOCK kararında zorunlu

## Sektör Bilgi Bankası

- **Rafineri:** 1 $/bbl marj = ~5-6B TRY EBITDA. DCF WACC (TRY vs USD) kritik. IAS29 muhasebe ≠ nakit
- **IAS 29:** Net kar içindeki IAS29 etkisi her zaman ayrıştırılmalı — VUK/SPK two-row format P0
- **Havacılık ek Chairman metrikleri:** RPK, ASK, CASK, RASK, Yield, Load Factor, Kargo ton-km, Filo sayısı (8 KPI)
- **Perakende ek kontrol:** SSSG, Revenue per Store, IFRS 16 öncesi/sonrası FAVÖK, özel marka oranı trend

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **İki turda da 0.75 eşiği geçilemedi (R1: 0.644, R2: 0.658)** — Fark: -0.092. Ana bloker: valuation_agent SOTP formal output teslim etmedi; event_timeline_alert 2 turda DEGRADED. Bu iki bloker R1'den itibaren P0 olarak belirlenmeliydi ve sadece bu ikisinin çözümü QA'yı 0.75 üzerine çıkarabilirdi.
- **Chairman metrik checklist "DELTA" bölümü tamamlanmadı** — Çıktı "Chairman Metrik Checklist — DELT..." ile kesildi. 45 metrik satır satır kontrol tamamlanmadı.
- **report_formatter DEGRADED → 7 kontrol yapılamadı** — HTML boş olduğundan header/footer, grafik sayısı, sayfa sayısı, meta-text kontrolleri yapılamadı. Bu durum FAIL olarak kaydedilmeli ve report_formatter'a geri gönderilmeliydi; "KONTROL YAPILAMADI" ile geçme.
- **valuation SOTP kısmi kanıt (case_lessons) PASS sayılamaz** — 182/250/322 TL case_lessons.md'de görünüyor; bu resmi çıktı değil. QA bunu "PARTIAL" olarak doğru flagledi ✓; ancak bunun nasıl çözüleceğine dair remediation planı yazılmadı.

### Bundan Sonra:
- **report_formatter DEGRADED = teknik bloker, geçici çözüm zorunlu** — HTML boş geldiğinde QA şu adımı yapacak: "report_formatter çıktısı olmadan X kontrol yapılamıyor; final_summary'den HTML olmaksızın metin QA'sı yapılıyor, format kontrolü PENDING." Kontrol yapılamadıysa "FAIL" değil "NOT ASSESSED — formatter fix gerekiyor" etiketle.
- **SOTP formal output için unblock condition net yazılacak** — "valuation_agent SOTP tablosu (6 iştirak satırı, her biri NAV katkısı ile) QA'ya iletilmeden completeness skoru 0.50 üzerine çıkmaz."
- **Holding analizinde ek Chairman metrikler** — SOTP NAV katkısı, holding discount tarihi banda göre (tarihsel %20-30 vs mevcut %49), segment EBITDA doğrulaması — bunlar holding QA checklist'ine kalıcı eklendi.
- **Holding QA ek checklist kalem:** SOTP tablosu (6 iştirak) | NAV katkı % | Holding discount hesabı + tarihi bant | Parent-only net borç vs konsolide net borç.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **QA skoru 0.96 şişirilmiş — Standard raporda da tekrarlandı, 3. THYAO** — 5 boyuttan sadece 2 zorunlu metrik kontrol edildi. 28 zorunlu metriğin 6'sı hesaplandı; Chairman 45-metrik checklist satır satır kontrol edilmedi. Bu kadar eksikle 0.96 vermek pipeline'ı yanıltır.
- **Sektör "industrial" flaglenmedi** — sector_competition "industrial" fallback = P1 BLOKER direktifi verilmişti; QA bu hatayla gözden kaçırdı.
- **event_impact_mapper "Python template only" flaglenmedi** — Bu etiket = otomatik FAIL direktifi vardı; QA gözden kaçırdı.
- **Havacılık 8 KPI kontrolü yapılmadı** — RPK/ASK/CASK/RASK/LF/Kargo/Filo/Hedging — context_extraction çıktısından bile kontrol edilebilirdi.
- **EBITDA/EBITDAR null = P0 bloker** — Havacılık analizinde EBITDAR null olduğunda QA skoruna yansımadı; evidence_sufficiency boyutu 0.3'e çekilmeliydi.

### Bundan Sonra:
- **QA 4 kapı sistemine sektöre özgü 3 ek kapı eklendi (kalıcı):**
  - Kapı 5: Sektör sınıflandırma doğruluğu (ticker fallback = P1)
  - Kapı 6: event_impact_mapper "Python template" tespiti (= P0 FAIL)
  - Kapı 7: Havacılık → EBITDAR + 8 KPI varlık kontrolü
- **Chairman 45-metrik checklist satır satır zorunlu** — "required=[NET_MARGIN, ROE]; present=[NET_MARGIN, ROE]" yetersiz. 45 metrik tamamı kontrol edilmeden completeness skoru verilemez.
- **QA 5. boyutu: teslim kriterleri** — HTML_ENVELOPE + SPK_DISCLAIMER + min 50KB payload kontrolü QA'nın ayrı boyutu olarak eklendi; COO'ya bırakılmaz.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **QA skoru 0.96 — şişirilmiş** — 5 boyuttan sadece 2 zorunlu metrik (NET_MARGIN, ROE) kontrol edildi. 28 zorunlu metriğin sadece 6'sı hesaplandı (EBITDA/FCF/EBITDAR/ROIC/CAPEX/Faiz Karşılama yok). Chairman 45-metrik checklist satır satır kontrol edilmedi; bu kadar eksikle 0.96 verilmesi yanıltıcı.
- **Sektör "industrial" flaglenmedi** — sector_competition "industrial" fallback = P1 BLOKER direktifi verilmişti; QA bu hatayl geçirdi.
- **event_impact_mapper "Python template only" flaglenmedi** — Bu etiket = otomatik FAIL direktifi; QA gözden kaçırdı.
- **Havacılık 8 KPI kontrolü yapılmadı** — RPK/ASK/CASK/RASK/LF/Kargo/Filo/Hedging — context_extraction çıktısından bile kontrol edilebilirdi.
- **EBITDA/EBITDAR null = P0 bloker** — Havacılık analizinde EBITDAR null olduğunda QA skoruna yansımadı; EBITDA/EBITDAR eksikliği evidence_sufficiency boyutunu 0.3'e çekmeliydi.

### Bundan Sonra:
- **QA 4 kapı sistemini genişlet — sektöre özgü kapı ekle:**
  - Kapı 5: Sektör sınıflandırma doğruluğu (ticker fallback = P1)
  - Kapı 6: Event_impact_mapper "Python template" tespiti (= P0 FAIL)
  - Kapı 7: Havacılık → EBITDAR + 8 KPI varlık kontrolü
- **Chairman 45-metrik checklist satır satır zorunlu** — "required=[NET_MARGIN, ROE]; present=[NET_MARGIN, ROE]" yetersiz. 45 metriğin tamamı kontrol edilmeden completeness skoru verilemez.
- **0.96 ile "pass" verilen raporda COO BLOCKED kararı aldı** — HTML_ENVELOPE + SPK_DISCLAIMER eksikliği QA kapsamına girmeli. QA 5. boyutu: "Teslim kriterleri (HTML envelope, SPK disclaimer, min payload)" eklenmeli.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **financial_analysis yoksa skor 0 ve tüm boyutlar skorlanmadı** — "NO_FINANCIAL_ANALYSIS — cannot score" kararı ile qa_decision: "fail" verildi. Ancak kural: QA diğer boyutları (technical_analysis, macro_analysis, context_extraction, event_chain) financial_analysis olmadan da değerlendirmelidir. Bu 4 boyutun skoru ayrı üretilmeliydi; final skor "financial_analysis eksik, bu boyut 0" şeklinde hesaplanmalıydı.
- **Remediation action plan yok** — QA FAIL verdi ama `must_fix_before_merge` listesi, sorumlu agent, unblock condition hiçbiri yazılmadı. FAIL kararında bunlar zorunlu.
- **Cascade downstream impact analizi yok** — financial_analysis yokluğunun cascade etkisi: sector_competition boş, strategic_synthesis eksik, valuation çalışmadı. Bu zincir QA çıktısında görünmedi.
- **Havacılık 8 KPI kontrolü yapılmadı** — RPK, ASK, CASK, RASK, Load Factor, Kargo ton-km, Filo, Hedging oranı — QA bu 8 KPI'yı context_extraction çıktısından bile kontrol edebilirdi.
- **CEO değişimi governance impact QA'ya dahil edilmedi** — 9 Nisan CEO değişimi governance boyutunu etkiler; "yönetim kalitesi" skoru bu olay nedeniyle revize edilmeliydi.
- **escalation_recommendation: "escalate_to_CEO"** — Doğru ✓ ama yapılandırılmış notification yok; "Ne yapılmalı, kim yapmalı, ne zaman" bilgisi eksik.

### Bundan Sonra:
- **financial_analysis olmadan QA = kısmi skor, tam FAIL değil** — Boyutlar: (1) Completeness (financial_analysis olmadan 0 → bu boyut 0), (2) Context/Governance (context_extraction'dan), (3) Technical (technical_analysis'ten), (4) Event Chain (kap/classification/mapper'dan), (5) Format (formatter'dan). Olmayan boyutlar açıkça 0 ve nedeni yazılarak toplam skor üretilir.
- **Havacılık QA boyutu: 8 KPI zorunlu kontrol** — context_extraction çıktısında RPK/ASK/LF/CASK/RASK/Kargo/Filo/Hedging var mı? Her biri için completeness ceza puanı.
- **FAIL kararı ZORUNLU yapı:**
  ```
  must_fix_before_merge:
  - financial_analysis: CF tablosu + WC metrikleri | owner: data_collection+parse | unblock: CF tablo çıktısı mevcut
  - sector_competition: sector "aviation" ile yeniden çalıştır | owner: sector_competition | unblock: peer_group doldu
  - strategic_synthesis: financial_analysis gelene kadar WAIT | owner: orchestrator
  ```

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **QA skoru 0.96 — şişirilmiş, sadece 2/45 metrik kontrol edildi** — Kural 45 Chairman metriğini kontrol etmek; 2 tanesi yapıldı ve %96 tamamlama verildi. Bu yanıltıcı; gerçek tamamlama %4.4.
- **Sektör "industrial" etiketi QA tarafından flaglenmedi** — 3. THYAO analizinde sektör yanlış; QA bunu tespit etmedi. Sektör kontrolü QA gate'inin parçası.
- **"Python template only" event_impact_mapper çıktısı flaglenmedi** — P0 direktifi mevcut; QA kontrol etmedi.
- **8 havacılık KPI kontrolü yapılmadı** — RPK/ASK/LF/CASK/RASK/Kargo/Filo/Hedging — context_extraction çıktısından kontrol edilebilirdi.
- **CONDITIONAL_PASS = BLOCK kuralı** — QA bu turda 0.96 verdi; ancak kural "0.80 altı = BLOCK". Gerçek skor ~0.10 olmalıydı.
- **COO BLOCKED olduğuna göre QA da başarısız** — COO HTML_ENVELOPE + SPK eksikliği tespit etti; QA format kontrolü yapılmadı.

### Bundan Sonra:
- **45 Chairman metrik sayımı hard zorunlu** — QA checkpoint 1: metrics[] dizisini say. 45'ten az ise tamamlanmamış QA; skor = (mevcut / 45). Kısmi sayımla 0.90+ vermek kural ihlali.
- **THYAO QA özel kontroller (her analizde):**
  1. Sektör etiketi "aviation" mı? (Değilse → FLAG + BLOCK)
  2. EBITDAR hesaplandı mı? (Null → FLAG + BLOCK)
  3. event_impact_mapper: "Python template only" var mı? (Varsa → P0 BLOCK)
  4. report_formatter: HTML envelope tam mı? SPK disclaimer var mı?
  5. 8 havacılık KPI: RPK/ASK/LF/CASK/RASK/Kargo/Filo/Hedging kontrol
- **QA skoru formülü:** (Tamamlanan kontrol / Toplam zorunlu kontrol). CONDITIONAL_PASS = BLOCK; QA 0.75 altı = REVISION_REQUIRED; QA 0.80 altı = CONDITIONAL_PASS (COO BLOCKED).

## CEO Geri Bildirimi — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417)

### Eksikler:
- **QA score 0, qa_decision: "fail" — doğru karar ✓** — financial_analysis yokluğunda FAIL vermek doğru. Önceki 4 THYAO'da 0.96 şişirilmiş skor verilen hatayla kıyaslandığında bu daha doğru.
- **Diğer agent boyutları kısmi skorlanmadı** — "No financial_analysis — cannot score" kararıyla tüm boyutlar 0 bırakıldı. Kural: financial_analysis olmadan QA = kısmi skor; technical_analysis (✓ mevcut), context_extraction (kısmi ✓), kap_watch (✓ mevcut) değerlendirilebilirdi.
- **event_timeline_alert TAMAMEN BOŞ çıktısı QA'ya flaglenmedi** — impact_timeline: [] gelmesi P0 bloker; QA escalation_recommendation'da bu bilgi yer almalıydı.
- **Remediation action plan üretilmedi** — FAIL kararında must_fix_before_merge listesi, sorumlu agent, unblock condition hiçbiri yazılmadı.
- **Cascade downstream impact analizi eksik** — financial_analysis yokluğunun cascade etkisi QA çıktısında listelenmedi.
- **Havacılık 8 KPI kontrolü yapılmadı** — context_extraction çıktısından RPK/ASK/LF/CASK/RASK/Kargo/Filo/Hedging kontrolü yapılabilirdi.

### Bundan Sonra:
- **FAIL kararı minimum yapısı (kesinleşti):**
  ```
  must_fix_before_merge:
  - financial_analysis: CF tablosu + WC metrikleri + EBITDAR | owner: data_collection+parse | unblock: CF çıktısı mevcut
  - sector_competition: "aviation" hardcoding | owner: sector_competition | unblock: peer_group dolu
  - event_timeline_alert: 4-phase + urgency calibration | owner: event_timeline_alert | unblock: IMMEDIATE events mevcut
  cascade_impact: sector_competition boş → strategic_synthesis boş → valuation imkansız
  ```
- **financial_analysis olmadan kısmi skor zorunlu** — Context/Technical/Event/Format boyutları ayrı değerlendirilir; toplam = (mevcut boyutlar ortalaması × ağırlık) + financial boyut 0.
- **event_timeline_alert boş çıktı = P0 automatic flag** — QA çıktısında ayrı satır: "event_timeline_alert: impact_timeline boş = P0 BLOCKED".

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **QA skoru 0.96 şişirilmiş — gerçek kapsam 2/45 metrik (~%4)** — QA 11/14 kanonik değer kontrol etti (EVIDENCE_SUFFICIENCY: 0.79), toplam 0.96 skoru üretildi. Gerçek Chairman metrik kapsamı: 6 metrik kontrol edildi / 45 zorunlu = %13.3. Skor hesabı yanlış; sistem bu skor ile 0.96 alarak geçirildi.
- **Sektör etiketi "industrial" QA tarafından flaglenmedi — 4. THYAO** — Hava yolu şirketinin "industrial" sektörüyle geçmesi temel QA kontrolü; tespit edilmedi.
- **"Python template only" (event_impact_mapper) QA'yı geçti — 3. THYAO** — P0 direktifi memory'de mevcut; QA kontrol listesine dahil edilmemişti.
- **8 havacılık KPI kontrolü yapılmadı** — RPK/ASK/LF/CASK/RASK/Kargo/Filo/Hedging — context_extraction'dan kontrol edilebilirdi; yapılmadı.
- **Format gate (HTML envelope, SPK, 50KB) QA tarafından doğrulanmadı** — COO bu hataları tespit etti; QA bunları önceden yakalamalıydı.
- **D&A null cascade QA tarafından kaçırıldı** — D&A null → EBITDA null → EBITDAR null → valuation imkansız. Bu zincir P0 flag oluşturmalıydı.

### Bundan Sonra:
- **QA skor formülü revize (kesinleşti):** metrics_checked / 45. Kısmi sayımla 0.90+ vermek kural ihlali; COO'ya raporlanır.
- **THYAO QA zorunlu 5 özel kontrol (her analizde):**
  1. Sektör etiketi = "aviation" mı? (Değilse → FLAG + BLOCK)
  2. EBITDAR hesaplandı mı? (Null → FLAG + BLOCK)
  3. event_impact_mapper: "Python template only" var mı? (Varsa → P0 BLOCK)
  4. report_formatter: HTML envelope + SPK disclaimer + ≥50KB → PASS/FAIL
  5. 8 havacılık KPI: RPK/ASK/LF/CASK/RASK/Kargo/Filo/Hedging her biri kontrol
- **D&A null = cascade alarm:** D&A null → EBITDA null → EBITDAR null → sector_competition boş → valuation imkansız. QA bu zinciri P0 BLOCK + data_collection eskalasyonu ile yakalamalı.
- **QA 0.75 altı = REVISION_REQUIRED (COO BLOCKED)** — Gerçek skor hesabı uygulanacak; 0.96 ile geçiş artık kabul edilemez.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **QA skoru 0.96 şişirilmiş — gerçek kapsam ~2/45 (%4) — 5. THYAO** — Sadece NET_MARGIN ve ROE kontrol edildi; 43 Chairman metriği görmezden gelindi. qa_decision: "pass" — yanlış karar; FAIL veya REVISION_REQUIRED olmalıydı.
- **Sektör etiketi "industrial" QA tarafından flaglenmedi — 5. THYAO** — Temel QA kontrolü; tespit edilmedi.
- **"Python template only" (event_impact_mapper) QA'yı geçti — 4. THYAO** — P0 direktifi memory'de mevcut; QA kontrol listesine dahil edilmedi.
- **8 havacılık KPI kontrolü yapılmadı — 5. THYAO** — RPK/ASK/LF/CASK/RASK/Kargo/Filo/Hedging; context_extraction'dan kontrol edilebilirdi.
- **Format gate (HTML envelope, SPK, 50KB) QA tarafından doğrulanmadı** — COO bu hataları tespit etti; QA bunları önceden yakalamalıydı.
- **D&A null cascade QA tarafından kaçırıldı** — D&A null → EBITDA null → EBITDAR null → valuation imkansız. Bu zincir P0 flag oluşturmalıydı.

### Bundan Sonra:
- **QA skor formülü: metrics_checked / 45 (5. direktif — kesinleşti)** — Kısmi sayımla 0.90+ vermek kural ihlali; COO'ya raporlanır.
- **THYAO QA zorunlu 5 özel kontrol (her analizde):**
  1. Sektör etiketi = "aviation" mı? (Değilse → FLAG + BLOCK)
  2. EBITDAR hesaplandı mı? (Null → FLAG + BLOCK)
  3. event_impact_mapper: "Python template only" var mı? (Varsa → P0 BLOCK)
  4. report_formatter: HTML envelope + SPK disclaimer + ≥50KB → PASS/FAIL
  5. 8 havacılık KPI: RPK/ASK/LF/CASK/RASK/Kargo/Filo/Hedging her biri kontrol
- **D&A null = cascade alarm** — D&A null → EBITDA null → EBITDAR null → sector_competition boş → valuation imkansız. QA bu zinciri P0 BLOCK ile yakalamalı.

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **QA skoru 0.97 şişirilmiş — gerçek kapsam ~2/45 (%4)** — Yalnızca NET_MARGIN ve ROE doğrulandı; 43 Chairman metriği görmezden gelindi. qa_decision: "pass" — yanlış karar; REVISION_REQUIRED olmalıydı (gerçek skor <0.75).
- **Sektör etiketi "industrial" QA tarafından flaglenmedi** — ASELS = savunma elektroniği; "industrial" temel QA kontrolünde yakalanmadı. Cascade etkisi: sector_competition peer_group=[], strategic_synthesis senaryo yok.
- **EBITDA null QA tarafından penalize edilmedi** — D&A null → EBITDA null zinciri P0 bloker olmalıydı; QA bu cascade'i flagledi ama QA skorunu düşürmedi.
- **28 zorunlu metrikten gerçekte yalnızca 7 hesaplandı — QA bunu yakalamadı** — mandatory_metrics_complete'i doğrulamak QA'nın birincil görevi; 21/28 eksik metrik skoru 0.97 yapmamalıydı.
- **Savunma sektörüne özgü QA kontrolleri yok** — Backlog/Revenue, AR-GE/ciro, ihracat oranı, jeopolitik bağlam, IAS 29 parasal kazanç — bunlar savunma şirketi için zorunlu kontroller; QA listesinde yer almıyor.

### Bundan Sonra:
- **ASELS/savunma QA zorunlu 5 özel kontrol (her analizde):**
  1. Sektör etiketi = "defense_electronics" mı? (Değilse → FLAG + BLOCK)
  2. Peer_group'ta Thales/Leonardo/Rheinmetall/BAE Systems var mı? (Boşsa → BLOCK)
  3. Jeopolitik bağlam bölümü mevcut mu? (Eksikse → FLAG)
  4. Backlog/Revenue ve AR-GE/ciro hesaplandı mı? (Null → FLAG)
  5. IAS 29 parasal kazanç/kayıp ayrıştırıldı mı? (Null → FLAG)
- **QA skor formülü: metrics_checked / 45 — savunma için de geçerli** — 7/28 metrik = gerçek kapsam %16; 0.97 QA skoru kural ihlali.
