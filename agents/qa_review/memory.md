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
