# QA Review Agent — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | QA Review Agent |
| Uzmanlık | Kalite Kontrolü |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 1 |
| Ortalama Öğrenme Puanı | 78/100 |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Kalite kriterleri | 1 | Başlangıç seviyesi |
| Doğrulama yöntemleri | 1 | Başlangıç seviyesi |
| Hata tespiti | 1 | Başlangıç seviyesi |
| İyileştirme önerileri | 1 | Başlangıç seviyesi |
| Onay süreçleri | 1 | Başlangıç seviyesi |

---

## Quality Score Thresholds

| Score | Karar | Aksiyon |
|---|---|---|
| > 0.85 | AUTO PASS | Devam et |
| 0.70–0.85 | CONDITIONAL PASS | Minor fixes, devam et |
| 0.50–0.70 | REVISION REQUIRED | Pipeline durdur, major fixes |
| < 0.50 | BLOCK | Temel veri kalitesi sorunu, CEO'ya bildir |

---

## Kurallar — Öğrenilen Dersler

**[2026-04-10] SISE Raporu — Kritik Eksikler:**

**1. Escalation = sadece rapor değil, aksiyon:**
- "Escalate_to_CEO" yazmak yetmez → CEO'ya direkt notification gönder
- Downstream agentlara "QA BLOCKED" flag ilet
- CEO kararı bekle: FIX / OVERRIDE / ABORT

**2. CRITICAL issue → Revision request ZORUNLU:**
- Reject kararını structured olarak gönder:
  ```json
  {"qa_status": "REJECTED", "agent": "...", "missing_items": [...], "deadline": "2 hours"}
  ```
- Agent revision yapmadan downstream'e GEÇEMEZ

**3. Quality score threshold enforcement:**
- Score 0.62 → REVISION REQUIRED → Pipeline durmalı
- 0.62 ile devam etmek yanlış

**4. Issue prioritization:**
- Her issue için: P0 (blocker) / P1 (critical) / P2 (high) / P3 (medium)
- Blocking scope belirt: hangi downstream agentlar etkilenir?
- CEO'ya "P0 fix et, P3 proceed" gibi granular karar imkanı ver

---

## Güçlü Yönlerim (SISE'den)

- Comprehensive review: 13 agent output incelendi
- 5 CRITICAL issue tespit edildi
- Quality score realist (0.62)
- Severity breakdown net (5C / 8H / 12M)

---

## Gelişim Alanlarım

- Escalation: rapor yazmak → aksiyon tetiklemek
- Revision request workflow (structured reject + resubmit)
- Quality threshold enforcement (pipeline durdurma)
- Issue prioritization (P0–P3 framework)

---

## CEO Geri Bildirimi — 2026-04-10 — AKBNK Raporu

### Eksikler:
- **Critical Flag #1 detayı YARIM KALMIŞ:** Balance sheet reconciliation gap analizi başlamış ama Evidence Quality Impact bölümü tamamlanmamış
- **Flags 2-3 TAMAMEN EKSİK:** 3 critical flag tespit edilmiş demiş ama sadece Flag #1'in detayı var
- **Remediation plan eksik:** Her flaglenen issue için "nasıl düzeltilecek" action plan yok
- **Escalation action yok:** "CONDITIONAL_PASS" demiş ama hangi agent'a ne söylenecek, deadline ne, belirtilmemiş
- **Quality threshold enforcement eksik:** Score 0.82 → CONDITIONAL_PASS demiş ama hangi condition'lar? Net değil

### Bundan Sonra:
- Her critical flag için TAM analiz — yarım flag analizi YASAK
- Her issue için remediation action plan ZORUNLU: (1) Sorumlu agent, (2) Düzeltme adımları, (3) Deadline, (4) Success criteria
- CONDITIONAL_PASS = net condition'lar + deadline + verification method
- Escalation sadece rapor değil AKSIYON — agent'lara structured revision request gönder
- SISE raporunda öğrendiğin "Escalation = aksiyon" kuralını UYGULA

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Eksikler:
- **Remediation plan eksik:** Financial_analysis failure tespit edilmiş ama "nasıl düzeltilecek" action plan yok — hangi agent restart edilecek, deadline ne, success criteria ne?
- **Escalation action eksik:** "FAIL" decision verilmiş ama CEO'ya structured notification gönderilmemiş — rapor sadece yazılmış, aksiyon tetiklenmemiş
- **Blocking issue prioritization eksik:** Financial_analysis failure P0, segment data missing P1, 2024 anomaly unexplained P2 — priority breakdown yapılmamış
- **Downstream impact analysis yok:** Financial_analysis failure hangi downstream agent'ları etkiler? (Strategic_synthesis, Final_summary, Value_assessment) — cascade effect analiz edilmemiş

### Bundan Sonra:
- Her CRITICAL/BLOCKING issue için remediation action plan ZORUNLU: (1) Sorumlu agent, (2) Fix steps, (3) Deadline, (4) Success criteria, (5) Verification method
- FAIL decision = CEO'ya structured escalation + downstream agent'ları DURDUR — sadece rapor yazmak değil aksiyon tetiklemek
- Issue prioritization P0-P3 framework kullan: P0 (blocker: raporun tamamlanmasını engelliyor), P1 (critical: kaliteyi ciddi düşürüyor), P2 (high: iyileştirme gerekli), P3 (medium: nice-to-have)
- Downstream impact analysis: Her issue için "hangi agent'lar etkilenir, nasıl?" analizi yap — cascade effect'i map et
- SISE ve AKBNK raporlarında öğrendiğin "Escalation = aksiyon" kuralını UYGULA — KCHOL'da uygulanmadı

---

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu (#2)

### EKSİKLER — ÜÇÜNCÜ KEZ AYNI HATALAR:

**AKBNK ve SISE raporlarında öğrendiğin "Escalation = aksiyon tetiklemek" kuralı KCHOL'da UYGULANMADI.**

- **Remediation plan TAMAMEN EKSİK:** Financial_analysis failure, segment data missing, 2024 anomalies — hepsi tespit edilmiş AMA "nasıl düzeltilecek" action plan yok
- **Escalation action yok:** "CONDITIONAL_PASS" decision verilmiş ama CEO'ya structured notification gönderilmemiş, agent'lara revision request gönderilmemiş — sadece rapor yazılmış, aksiyon tetiklenmemiş
- **Blocking issue prioritization eksik:** Financial_analysis failure P0, segment data missing P1, 2024 anomaly unexplained P2 — hangi issue öncelikli? Impact × Probability matrix yok
- **Downstream impact analysis yok:** Financial_analysis failure hangi downstream agent'ları etkiler? (Strategic_synthesis, Final_summary, Valuation_agent) — cascade effect map edilmemiş
- **Quality threshold enforcement tutarsız:** Overall score 0.68 (MEDIUM) → "CONDITIONAL_PASS" demiş ama 60% mandatory metrics missing → bu durumda REVISION REQUIRED olmalıydı

### BUNDAN SONRA — KALICI KURALLAR:

**1. Remediation Action Plan ZORUNLU (Her CRITICAL/BLOCKING Issue için):**
```
Issue: Financial_analysis %90 metrics missing
- Sorumlu Agent: financial_analysis
- Fix Steps: (1) Upstream data request to parse_standardization (trade receivables, inventory, payables), (2) Calculate working capital metrics, (3) Re-run analysis
- Deadline: 2 hours
- Success Criteria: All Chairman mandatory metrics (DSO, DIO, DPO, CCC, etc.) calculated
- Verification: CEO spot-check 3 random metrics
```

**2. Escalation = Aksiyon Tetiklemek (Rapor Yazmak Değil):**
- FAIL/REVISION REQUIRED decision → CEO'ya structured notification + downstream agent'ları DURDUR
- CONDITIONAL_PASS → agent'lara revision request gönder + deadline belirle
- AUTO PASS → downstream'e devam izni ver

**3. Issue Prioritization P0-P3 Framework:**
- **P0 (Blocker):** Raporun tamamlanmasını engelliyor → pipeline DURDUR
- **P1 (Critical):** Rapor kalitesini ciddi düşürüyor → immediate fix gerekli
- **P2 (High):** İyileştirme gerekli → deadline belirlenerek fix edilmeli
- **P3 (Medium):** Nice-to-have → sonraki raporda düzelt

**4. Downstream Impact Analysis (Cascade Effect):**
```
Financial_analysis failure →
  - Strategic_synthesis: Investment thesis dayanaksız (veri eksik)
  - Valuation_agent: DCF impossible (FCF/CAPEX eksik)
  - Final_summary: Skor kartı eksik (profitability/liquidity metrics yok)
  - QA_review: Overall report confidence LOW
```

**5. Quality Threshold Enforcement:**
- Score > 0.85 → AUTO PASS
- Score 0.70–0.85 → CONDITIONAL PASS (condition'lar net belirtilmeli)
- Score 0.50–0.70 → REVISION REQUIRED (pipeline durdur)
- Score < 0.50 → BLOCK (temel veri kalitesi sorunu)

**KCHOL durumu:** Score 0.68 + 60% mandatory metrics missing → **REVISION REQUIRED** olmalıydı, **CONDITIONAL_PASS değil.**

---

## KPI Tracking (Güncellenmiş):

| Rapor | Decision | CEO Feedback | Uygulama Puanı |
|-------|----------|--------------|----------------|
| SISE | BLOCK (0.62) | "Escalation = aksiyon" öğrenildi | 88/100 |
| AKBNK | CONDITIONAL_PASS (0.82) | "Remediation plan + downstream impact" öğrenildi | 70/100 |
| KCHOL | CONDITIONAL_PASS (0.68) | **Öğrenilen kurallar UYGULANMADI** | **45/100** |
| TCELL | CONDITIONAL_PASS (0.84) | Kurallar hâlâ eksik uygulandı | 65/100 |
| TUPRS | FAIL (0.618) | P0-P3 framework tam uygulandı | TBD |

**Sonraki rapor için hedef:** 95/100 — Tüm kurallar uygulanmalı.

---

## CEO Geri Bildirimi — 2026-04-11 — KCHOL Raporu (#3 — DÖRDÜNCÜ KEZ)

### DÖRDÜNCÜ KEZ AYNI HATALAR — PROTOKOL BAŞARISIZLIĞI:

**SISE, AKBNK, KCHOL (#1), KCHOL (#2) — DÖRT raporda öğrendiğin kurallar KCHOL (#3)'te UYGULANMADI.**

- **Remediation plan TEKRAR EKSİK:** Financial_analysis %60 metrics missing, segment data yok, 2024 anomalies unexplained — hepsi tespit edilmiş AMA "nasıl düzeltilecek" action plan YOK
- **Escalation action YOK:** Score 0.68 + %60 mandatory metrics missing → **REVISION REQUIRED** olmalıydı AMA "CONDITIONAL_PASS" verilmiş
- **Downstream impact analysis YOK:** Financial_analysis failure → Strategic_synthesis, Valuation_agent, Final_summary cascade effect map edilmemiş
- **Issue prioritization P0-P3 YOK:** Hangi issue blocker, hangi issue critical? Priority matrix yok

### KALICI KURALLAR — BEŞİNCİ KEZ YAZILDI, ARTIK UYGULANMALI:

**1. Quality Threshold Enforcement (SERT):**
```
Score > 0.85 → AUTO PASS
Score 0.70–0.85 + minor gaps → CONDITIONAL PASS (condition'lar net belirtilmeli)
Score 0.70–0.85 + major gaps (>%40 mandatory metrics missing) → REVISION REQUIRED
Score 0.50–0.70 → REVISION REQUIRED (pipeline durdur)
Score < 0.50 → BLOCK
```

**KCHOL durumu:** Score 0.68 + %60 mandatory metrics missing → **REVISION REQUIRED** (pipeline DURDUR, fix sonrası devam)

**2. Remediation Action Plan ZORUNLU:**
Her CRITICAL/BLOCKING issue için:
```
Issue: [Description]
- Sorumlu Agent: [agent_id]
- Fix Steps: [Step 1], [Step 2], [Step 3]
- Deadline: [X hours/days]
- Success Criteria: [Measurable outcome]
- Verification Method: [How to confirm fix]
```

**3. Escalation = Aksiyon Tetikleme:**
- FAIL → CEO'ya structured notification + downstream agent'ları DURDUR + fix request
- REVISION REQUIRED → Agent'lara revision request + deadline + pipeline DURDUR
- CONDITIONAL_PASS → Minor fix request + condition'lar net + deadline
- AUTO PASS → Downstream'e devam izni

**4. Downstream Impact Analysis:**
Her critical issue için:
```
[Issue] →
  - [Downstream Agent 1]: [Impact description]
  - [Downstream Agent 2]: [Impact description]
  - [Overall report impact]: [Impact description]
```

**5. Issue Prioritization P0-P3:**
```
P0 (Blocker): Raporun tamamlanmasını engelliyor → pipeline DURDUR
P1 (Critical): Rapor kalitesini ciddi düşürüyor → immediate fix
P2 (High): İyileştirme gerekli → deadline belirlenerek fix
P3 (Medium): Nice-to-have → sonraki raporda düzelt
```

### BEŞİNCİ RAPOR HEDEFİ (Bir sonraki rapor):
- Tüm kurallar uygulanmalı
- Remediation plan her critical issue için
- Escalation aksiyonları tetiklenmeli
- Downstream impact map edilmeli
- Issue prioritization P0-P3 yapılmalı
- Quality threshold enforcement SERT uygulanmalı
- **HEDEF PUAN:** 95/100

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL Raporu

### Pozitif Noktalar ✅:
- **Critical gaps TESPİT EDİLMİŞ:** Financial analysis missing metrics (ROE/ROCE/ROIC/Acid-Test), valuation agent absent — QA agent doğru flaglemiş
- **Confidence scoring calibration iyi:** 0.86/1.00 overall — gerçekçi değerlendirme
- **Completeness dimension LOW (0.76) — DOĞRU TESPİT:** Eksiklikler net görülmüş

### Eksikler ⚠️:
- **QA output TRUNCATED:** Full remediation plan başlamış ama kesilmiş — tam rapor tamamlanmamış
- **Remediation action plan TEKRAR EKSİK — ALTINCI RAPOR:** TCELL için critical gaps tespit edilmiş AMA "nasıl düzeltilecek" action plan YOK
  - Financial_analysis failure: Hangi agent'a ne söylenecek, deadline ne, success criteria ne? — YOK
  - Valuation_agent missing: Kim başlatacak, ne zaman, hangi metodoloji? — YOK
- **Escalation action YOK:** Score 0.86 + critical metrics missing (%70 Chairman mandatory metrics eksik) → **REVISION REQUIRED** olmalıydı AMA "CONDITIONAL_PASS" verilmiş
- **Downstream impact analysis YOK:** Financial_analysis failure → Strategic_synthesis dayanaksız, Valuation impossible, Final_summary skor kartı eksik — cascade effect map edilmemiş
- **Issue prioritization P0-P3 YOK:** Hangi eksiklik blocker (P0), hangi eksiklik critical (P1)? Priority matrix yok

### Bundan Sonra — ALTINCI RAPOR, ARTIK UYGULANMALI:
- **Quality threshold enforcement SERT:**
  ```
  Score > 0.85 + minor gaps → AUTO PASS
  Score > 0.85 + major gaps (>%40 mandatory metrics missing) → REVISION REQUIRED
  Score 0.70–0.85 + minor gaps → CONDITIONAL PASS
  Score 0.70–0.85 + major gaps → REVISION REQUIRED
  Score < 0.70 → BLOCK
  ```
  **TCELL durumu:** Score 0.86 + %70 mandatory metrics missing → **REVISION REQUIRED** (pipeline DURDUR, financial_analysis FIX sonrası devam)

- **Remediation Action Plan ZORUNLU:**
  ```
  Issue: Financial_analysis %70 mandatory metrics missing (ROE, ROCE, ROIC, Asit-Test, DSO, DIO, DPO, CCC, Cash FAVÖK, NWC, OCF/FAVÖK)
  - Sorumlu Agent: financial_analysis
  - Fix Steps: 
    (1) Upstream data request to parse_standardization (balance sheet detail, cash flow full)
    (2) Calculate ALL Chairman mandatory metrics
    (3) Telecom-specific metrics (ARPU trend, churn, CAPEX intensity, spectrum amortization impact)
    (4) Re-run analysis
  - Deadline: 3 hours
  - Success Criteria: ALL 45 Chairman mandatory metrics calculated + interpreted
  - Verification: CEO spot-check 5 random metrics
  ```

- **Escalation = Aksiyon Tetiklemek:**
  - REVISION REQUIRED → Financial_analysis agent'a structured revision request + deadline + pipeline DURDUR
  - Valuation_agent missing → CEO'ya escalate: "Valuation agent başlatılmalı mı yoksa TCELL raporu valuation olmadan mı yayınlansın?"

- **Downstream Impact Analysis:**
  ```
  Financial_analysis %70 metrics missing →
    - Strategic_synthesis: Investment thesis ROE/ROCE/ROIC olmadan zayıf
    - Valuation_agent: DCF impossible (FCF, CAPEX/EBITDA, ROIC eksik)
    - Final_summary: Skor kartı (6 boyut + genel skor) hesaplanamaz (profitability/liquidity metrics yok)
    - Report quality: Chairman REJECT eder
  ```

- **Issue Prioritization:**
  - P0 (Blocker): Valuation agent missing → rapor format incomplete
  - P1 (Critical): Financial_analysis %70 metrics missing → Chairman mandatory checklist fail
  - P2 (High): Multiple agent truncations → completeness düşük
  - P3 (Medium): Telecom-specific benchmarking eksikliği

---

## ✅ CEO Geri Bildirimi — 2026-04-11 — TCELL RAPORU (POST DELTA-UPDATE)

### POZİTİF NOKTALAR:
- ✅ **Critical gaps DOĞRU tespit edilmiş:** Financial analysis missing metrics (ROE/ROCE/ROIC - artık hesaplanmış), truncated outputs flagged, 5G subscriber controversy (15M vs 2M) tutarlı şekilde flagged
- ✅ **Confidence scoring calibration İYİ:** Overall 0.84/1.0 (VERY GOOD) — gerçekçi değerlendirme
- ✅ **Completeness dimension LOW (0.78) tespit edildi:** Truncated outputs nedeniyle completeness düşük — DOĞRU
- ✅ **Evidence sufficiency (0.88) ve Claim support (0.86) EXCELLENT:** 25+ primary sources, critical claims backed by 2+ sources
- ✅ **Scope compliance (0.90) EXCELLENT:** Chairman directives followed (web research, IAS29 handling, 5G controversy flagged)

### Eksikler (AYNI HATALAR TEKRAR EDİYOR — YEDİNCİ RAPOR):
- **QA output TRUNCATED:** Full remediation plan başlamış ama kesilmiş — rapor tamamlanmamış
- **Remediation action plan TEKRAR EKSİK:**
  - Financial_analysis truncation: Nasıl düzeltilecek, deadline ne, success criteria ne? — YOK
  - Multiple agent truncations: Hangi agents restart edilecek, hangi sections re-run edilecek? — YOK
- **Escalation action YOK:**
  - Score 0.84 + %40 outputs truncated → **CONDITIONAL_PASS (with conditions)** veya **REVISION REQUIRED** olmalıydı
  - Conditions: "Fix truncations in financial_analysis, sector_competition, macro_analysis — deadline 2 hours"
  - AMA bu structured condition hiçbir yere gönderilmemiş
- **Downstream impact analysis YOK:**
  - Financial_analysis truncation → Strategic_synthesis incomplete, Final_summary scorecard missing data
  - Cascade effect map edilmemiş
- **Issue prioritization P0-P3 YOK:**
  - P0 (Blocker): Hiç yok (rapor tamamlanabilir)
  - P1 (Critical): Financial_analysis truncation, multiple agent truncations
  - P2 (High): Telecom-specific benchmarking eksiklikleri
  - Priority matrix hiç oluşturulmamış

### KALICI KURAL İHLALİ — YEDİNCİ RAPOR:
**SISE, AKBNK, KCHOL (#1, #2, #3), TCELL (#1) — ALTI raporda öğrendiğin kurallar TCELL (#2 - delta-update)'te UYGULANMADI.**

Aynı eksikler:
1. Remediation action plan yok
2. Escalation sadece rapor, aksiyon yok
3. Downstream impact analysis yok
4. Issue prioritization P0-P3 yok
5. Quality threshold enforcement tutarsız

### YEDİNCİ RAPOR İÇİN ENFORCEMENT:

**BUNDAN SONRA:**

**1. Quality Threshold Enforcement (KESİN):**
```
Score > 0.85 + no critical gaps → AUTO PASS
Score > 0.85 + minor gaps (<20% outputs truncated) → CONDITIONAL_PASS (conditions belirt)
Score > 0.85 + major gaps (>40% outputs truncated) → REVISION REQUIRED
Score 0.70-0.85 → CONDITIONAL_PASS or REVISION (gap severity'e göre)
Score < 0.70 → BLOCK
```

**TCELL durumu:** Score 0.84 + ~40% outputs truncated → **CONDITIONAL_PASS** (structured conditions ile) VEYA **REVISION REQUIRED**

**2. Remediation Action Plan ZORUNLU (Her Critical Issue İçin):**
```
Issue: Financial_analysis output truncated
- Sorumlu Agent: financial_analysis
- Fix Steps: 
  (1) Split output: Core metrics (full) + Supplementary analysis (summary)
  (2) Re-run analysis with length limit awareness
  (3) Validate all 28 mandatory metrics present in output
- Deadline: 2 hours
- Success Criteria: Full financial_analysis output delivered, no truncation
- Verification: CEO spot-check 5 random sections
```

**3. Escalation = Aksiyon Tetiklemek:**
- CONDITIONAL_PASS → Structured conditions + deadline + agent revision requests GÖNDER
- REVISION REQUIRED → Pipeline DURDUR + agent'lara fix request + CEO bildir

**4. Downstream Impact Analysis:**
```
Financial_analysis truncation →
  - Strategic_synthesis: Investment thesis incomplete (missing ROE/ROCE/ROIC — artık hesaplanmış ama truncated)
  - Final_summary: Scorecard calculation incomplete
  - Overall report quality: Reduced from 0.84 to ~0.78
```

**5. Issue Prioritization P0-P3:**
```
P0 (Blocker): Hiç yok
P1 (Critical): Financial_analysis truncation, 5+ agent truncations
P2 (High): Telecom-specific KPI analysis depth
P3 (Medium): Minor data gaps (Moody's credit rating)
```

**CEO DECISION (TCELL Raporu):**

Score 0.84 + 28 mandatory metrics hesaplanmış + truncation issue = **CONDITIONAL_PASS**

**Conditions:**
1. Financial_analysis agent: Split output strategy uygula, core metrics full delivery
2. Truncated agents (sector_competition, macro_analysis, technical_analysis, etc.): Summary delivery acceptable AMA key findings present olmalı
3. Deadline: Next report'ta truncation prevention implemented olmalı

**TCELL raporu Chairman'e sunulabilir** — kritik metrikler tam, truncation "nice-to-have" sections'ta olmuş.

---

---

## TUPRS Raporu — Özgün Bulgular (2026-04-12)

### TUPRS'a Özgü Kritik Öğrenmeler:

**1. Hisse adedi tutarsızlığı — 3 kaynak, 3 farklı değer:**
- Rafineri ve holding şirketlerinde hisse adedi kesinlikle KAP'tan doğrulanmalı
- Temettü matematiği (Toplam temettü ÷ hisse başı = hisse adedi) çapraz kontrol için kullanılabilir

**2. IAS 29 hyperinflation accounting EBITDA'yı gizliyor:**
- Nominal EBITDA ≠ IAS29-adjusted EBITDA → her zaman ikisini ayrı raporla
- Parse_standardization vs web kaynak farkı büyük olasılıkla IAS29 adjustment kaynaklandı

**3. DCF WACC seçimi kritik — TRY nominal vs USD bazlı:**
- TUPRS gibi USD-denominated earnings olan şirkette TRY WACC (%22) çok farklı sonuç verir
- USD-bazlı WACC (%10-12) çok daha yüksek intrinsic value → her iki metodoloji raporlanmalı

**4. valuation_agent timeout riski:**
- TUPRS gibi karmaşık peer + DCF + EV/Capacity tri-methodology hesabında timeout yaşandı
- Çözüm: DCF, peer comparables, EV/Capacity — üç ayrı "turn" olarak çalıştır

**5. Rafineri şirketlerinde temel kontroller:**
- Kapasite × Kullanım oranı × Margin = FCF estimate (hızlı mantık kontrolü)
- 30 MMT × 93% × 7 $/bbl × 7.5 TL/$ ≈ ~14.7B TRY net refinery income proxy

*Dosya sahibi: QA Review Agent | Denetleyen: META (CEO)*

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **Valuation_agent crash önceden önlenebilirdi:** QA, valuation_agent'ın exit code 143 ile çöktüğünü tespit etti — iyi. Ama erken uyarı mekanizması yoktu. Valuation_agent'ın DCF + peer + sensitivity matrix = ağır hesaplama yükü önceden biliniyordu; "modeli 3 parçaya böl" önerisi crash SONRASI geldi, öncesinde değil.
- **mandatory_metrics_complete false positive geç yakalandı:** financial_analysis "TRUE" verdi, QA bunu pipeline sonunda yakaladı. Bu kontrol financial_analysis çıktısı gelir gelmez (pipeline'ın ortasında) yapılmalı, sadece final review'da değil.
- **EBITDA çelişkisi (62B vs 53.78B) çözüm yolu önerilmedi:** QA doğru tespit etti ama "17 Nisan'da çözülür" deyip geçti. Bu aşamada hangi değerin hangi hesaplama için kullanılacağı (konservatif: 53.78B; iyimser: 62.0B) standartlaştırılmadı.
- **Hisse adedi P1 çözümünü QA vermeli:** Üç farklı hisse adedi (1.926B, 936.6M, 2.268B) tespit edildi ama çözüm valuation_agent'a bırakıldı. QA kendi başına KAP temettü matematiğiyle (29.3B ÷ 12.9256 TL = ~2.268B hisse) kontrol yapabilirdi.

### Bundan Sonra:
- **Mid-pipeline QA kontrol noktaları:** Final review yeterli değil. financial_analysis çıktısı gelince → mandatory metrics listesini satır satır karşılaştır. parse_standardization çıktısı gelince → balance sheet equation kontrolü yap. Bekleyip biriktirme.
- **Valuation agent için pre-flight yük yönetimi:** DCF + peer + sensitivity birlikte talep ediliyorsa QA valuation_agent'ı başlatmadan önce "bölümlere ayır" direktifi vermeli.
- **Belirsiz metrik (iki farklı değer) → konservatif standart:** İki farklı EBITDA değeri varsa, tüm hesaplamalar düşük değer (53.78B) ile yapılır; yüksek değer (62.0B) upside senaryosuna rezerve edilir. Bu standardı QA enforce eder.
- **Per-share veri çapraz doğrulaması:** Hisse adedi anlaşmazlığında: KAP temettü bildirimi (toplam temettü ÷ hisse başı temettü = hisse adedi) birincil kaynak olarak kullanılır.
