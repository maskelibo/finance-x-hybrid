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

---

## Yeni Ders — 2026-04-13 — EREGL Delta Update

### Ana Öğrenim:
- Upstream agent birincil kaynak kullandığını söylüyorsa ama çıktı içinde açık belge ID'si, sayfa referansı veya hesap izi yoksa `evidence_sufficiency` otomatik düşürülmeli.
- "Web access yok" veya "permission denied" notu bulunan agent çıktılarında ileriye dönük, sayısal veya güncel piyasa iddiaları `high` değil en fazla `low/speculative` kabul edilmeli.
- QA review sadece yanlış rakamı değil, **hangi rakamın authoritative olduğunu** da açıkça belirtmeli; aksi halde downstream sentez agent'ları çelişkili veriyle çalışır.

### EREGL'e Özgü Kalıcı Kural:
- `parse_standardization` ile `reconciliation/financial_analysis/kap_watch` arasında finansal ana rakam çelişkisi varsa authoritative sıra:
  1. Audited financials / KAP annual filing
  2. Reconciliation output with explicit formulas
  3. Management report summaries
  4. Standardization layer

### QA Uygulama Notu:
- Major output eksikliği + degraded downstream agents kombinasyonu varsa karar `conditional_pass` değil `fail` veya en az `revision_required` mantığında değerlendirilmeli; pipeline'ı devam ettirmek kalite riskini büyütür.
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

---

## Öğrenilen Ders — 2026-04-13 — EREGL

- **Known contradiction downstream'e sızabilir:** `parse_standardization` gibi bir upstream ajan için `CONTRADICTION HOLD` koymak tek başına yeterli değil. QA ayrıca downstream ajanların (`financial_analysis`, `valuation_agent`, `sentiment_news_agent`, `analyst_consensus_agent`) hatalı rakamları yeniden kullanıp kullanmadığını kontrol etmeli.
- **“Web access yok” + kesin sayı = confidence failure:** Bir ajan canlı doğrulama yapamadığını söylüyorsa yine de tam sayı hedef fiyat, HRC spot, rating dağılımı veya regülasyon maliyeti veriyorsa bu `confidence_calibration` ve `claim_support` açısından doğrudan flag'lenmeli.
- **Primary-source scope drift ayrı quality flag olmalı:** `kap_watch` gibi bir görev KAP birincil kaynak ve son 30 gün scope'u ile istenmişse; 12 aya yayılıp ikincil medya ile doldurulan çıktı ayrı bir kapsam ihlali olarak işaretlenmeli.

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu
### Eksikler:
- Bu turdaki en güçlü iş sendendi; yine de fail sonrası minimum remediation set'i öncelik sırasıyla vermedin.
- Kritik bulguları hangi agent'ın neyi yeniden üretmesi gerektiğine tam çevirmedin.
- Chairman zorunlu metrik listesine göre hangi başlıkların eksik kaldığı ayrı checklist olarak açılmadı.
- CEO için iyi bir teşhis var ama downstream için doğrudan uygulanabilir action listesi biraz eksik.
### Bundan Sonra:
- Fail verdiğinde mutlaka `must_fix_before_merge` listesi ekle.
- Her kritik bulguyu bir sahiplikle eşle: hangi agent neyi düzeltecek.
- Chairman zorunlu metrik checklist'ini QA içinde ayrıca denetle.
- QA sonunda önerilen authoritative fact base'i tek paragrafta kilitle.

---

## Gece Eğitimi #2 — 2026-04-16

**Odak:** TCELL raporu post-feedback + 4-kapı framework + QA fact lock

### Bu Gece Öğrenilenler:

**1. Real Artifact Check — İlk Adım:**
- "Mock completed output for agent_X" veya placeholder görünce diğer skorlamaya geçmeden otomatik FAIL.
- Sadece mock değil: truncation, kaynak izi yokluğu, placeholder metinler = artifact failure.

**2. 4 Sert Kapı:**
- Artifact Reality / Mandatory Metric Completeness / Fact Pack Consistency / Scope Compliance
- Biri geçilmezse PASS YASAK. Skor 0.88 olsa bile 4 kapıdan biri kapanmamışsa FAIL.

**3. QA Fact Lock Paragrafı:**
- FAIL/BLOCK kararında authoritative sayı seti ve contested kalemler sabitlenmeli.
- Format: authoritative değer (kaynak) + contested değer (çelişki) + blocked kalem.

**4. Her FAIL'de Zorunlu Alanlar:**
- `issue + owner + unblock condition + downstream impact` — dördü olmadan FAIL kararı eksik.

**5. memory.md Yeniden Yazma:**
- 15.4KB'dan 5.3KB'a indirildi. 8+ rapor CEO geri bildirimi distile edildi.

## Purge 2026-04-21 23:11 — 6 section (en yeni: 2026-04-16)

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
