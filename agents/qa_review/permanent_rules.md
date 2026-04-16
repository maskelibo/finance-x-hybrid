# QA Review Agent — Kalıcı Kurallar

---

## Kalici Kurallar

- **Quality Score Thresholds (SERT):**
  - > 0.85 + no critical gaps → AUTO PASS
  - > 0.85 + major gaps (>%40 mandatory metrics missing) → REVISION REQUIRED
  - 0.70-0.85 + minor gaps → CONDITIONAL PASS (conditions net belirtilmeli)
  - 0.70-0.85 + major gaps → REVISION REQUIRED
  - 0.50-0.70 → REVISION REQUIRED (pipeline durdur)
  - < 0.50 → BLOCK
- **Escalation = AKSIYON TETIKLEMEK (rapor yazmak degil):**
  - FAIL → CEO'ya structured notification + downstream agentlari DURDUR + fix request
  - REVISION REQUIRED → Agentlara revision request + deadline + pipeline DURDUR
  - CONDITIONAL_PASS → Minor fix request + conditions net + deadline
  - AUTO PASS → Downstream'e devam izni
- **Remediation Action Plan ZORUNLU (her CRITICAL/BLOCKING issue icin):**
  - Sorumlu Agent, Fix Steps, Deadline, Success Criteria, Verification Method
- **Issue Prioritization P0-P3:**
  - P0 (Blocker): Pipeline DURDUR
  - P1 (Critical): Immediate fix gerekli
  - P2 (High): Deadline belirlenerek fix
  - P3 (Medium): Sonraki raporda duzelt
- **Downstream Impact Analysis (Cascade Effect) ZORUNLU:**
  - Her critical issue icin hangi downstream agentlar etkilenir, nasil?
- **Fail verdiginde mutlaka `must_fix_before_merge` listesi ekle**
- Her kritik bulguyu sahiplikle esle: hangi agent neyi duzeltecek
- Chairman zorunlu metrik checklistini QA icinde ayrica denetle
- QA sonunda onerilen authoritative fact base'i tek paragrafta kilitle
- **Mid-pipeline QA kontrol noktalari:** financial_analysis ciktisi gelince mandatory metrics satir satir karsilastir. parse_standardization ciktisi gelince balance sheet equation kontrolu yap.
- **Belirsiz metrik (iki farkli deger) → konservatif standart:** Dusuk deger ile hesapla; yuksek deger upside senaryosuna rezerve
- Authoritative kaynak sirasi: (1) Audited financials/KAP, (2) Reconciliation with explicit formulas, (3) Management report summaries, (4) Standardization layer

## Zorunlu Kontrol Listesi

- [ ] Quality score threshold doğru uygulandı mı?
- [ ] Her critical issue icin remediation action plan var mi?
- [ ] Issue prioritization P0-P3 yapildi mi?
- [ ] Downstream impact analysis (cascade effect) eklendi mi?
- [ ] must_fix_before_merge listesi var mi?
- [ ] Escalation aksiyonu tetiklendi mi (sadece rapor degil)?
- [ ] Chairman zorunlu metrik checklist'i ayrıca denetlendi mi?
- [ ] Authoritative fact base kilitlendı mi?
- [ ] WebSearch/WebFetch kullanildi mi? Kullanilmadiysa neden? (Permission sorunu 2026-04-13'te cozuldu — artik tum agentlarin web erisimi var)

## Bilinen Hatalar

- SISE-AKBNK-KCHOL-TCELL (7 rapor): Remediation plan, escalation aksiyonu, downstream impact, P0-P3 prioritization TEKRAR TEKRAR EKSIK kaldi. ARTIK UYGULANMALI.
- KCHOL: Score 0.68 + %60 mandatory metrics missing → CONDITIONAL_PASS verildi, REVISION REQUIRED olmaliydi
- TCELL: Score 0.86 + %70 mandatory metrics missing → CONDITIONAL_PASS verildi, REVISION REQUIRED olmaliydi
- TUPRS: mandatory_metrics_complete false positive gec yakalandi — mid-pipeline kontrolu yapilmaliydi. EBITDA celiskisi cozum yolu onerilmedi.

---
*Bu dosya her çalışmada otomatik yüklenir. Değişiklik yapmadan önce CEO onayı alın.*
