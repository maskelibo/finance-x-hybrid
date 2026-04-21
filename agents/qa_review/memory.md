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

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
