# QA Review Agent — Damitilmis Hafiza

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

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Round 2'de CONDITIONAL PASS verdi — CEO direktifi ihlali** — conditional_pass = BLOCK kuralı CEO memory'de açık yazıyor. QA kendi çıktısında (QF-04) bu hatayı tespit etti ama pipeline zaten açılmıştı. İzin verilmemeli.
- **THYAO eşiği 0.80 iken Round 2 hesabında 0.70 eşiğini uyguladı** — CEO pre-flight'ta THYAO için bar 0.80'e çekildi. QA Round 2'de "0.751 → PASSES 0.70 threshold" dedi; 0.80 eşiğini gözardı etti.
- **CF tablosu çözülmeden report_formatter'a geçiş izni** — P0 bloker (CF) çözülmeden downstream açıldı. QA bu kararı verdi veya engel olmadı.
- **Havacılık KPI'ları Chairman checklist'ine eklenmedi** — RPK, ASK, CASK, RASK, Load Factor, Doluluk Oranı — bu 8 havacılık metriği Chairman zorunlu listesinde eksik; QA bunları ayrıca kontrol etmedi.

### Bundan Sonra:
- **CONDITIONAL PASS = BLOCK** — Bu kural CEO memory'de kalıcı. Senaryosu yok, istisnası yok. conditional_pass sonucu aldığında downstream'i durdur, CEO'ya bildir.
- **Şirkete özel eşik direktifini uygula** — CEO pre-flight direktifinde farklı eşik varsa (örn. THYAO için 0.80), standart QA kuralından önce gelir; bu değeri kullan.
- **Havacılık şirketi için genişletilmiş Chairman checklist** — Standart 45 metrik + 8 havacılık KPI (RPK, ASK, CASK, RASK, Yield, LF, Kargo ton-km, Filo sayısı). Hepsi QA kontrolünden geçmeli.
- **P0 bloker çözülmeden hiçbir downstream'e "izin ver" yazma** — CF eksikken report_formatter/final_summary'e "proceed" verilirse QA doğrudan sorumludur.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **0.80 eşikte REVISION_REQUIRED kararı doğru ✓** — BIMAS için eşik 0.80; skor tam eşikte; "conditional_pass = BLOCK" kuralı uygulandı. THYAO dersinden öğrenildi.
- **CF infrastructure blocker hala çözülmedi** — Tour 1 → Tour 2 (+0.12 iyileşme) ama CF yokken Check 3-5 BLOCKED kalmaya devam ediyor. Bu sistematik sorun; QA bunu escalation olarak CEO'ya bildirmeli, aynı şikayeti her turda tekrarlamak değil.
- **Tour 3 için net hedefler tanımlandı ✓** — 3 minor + 1 infrastructure issue listelendi. Bu iyi; ancak her issue için sorumlu agent + fix step + deadline eksik.
- **NWC/Hasılat ve NWC Gün Sayısı eksikliği tespit edildi ✓** — completeness boyutunu 0.76'ya düşürdü. Doğru tespit.
- **Perakende-spesifik Chairman checklist uygulandı mı?** — SSSG, Revenue per Store, Gross Margin by segment, IFRS 16 normalize FAVÖK — bunlar perakende zorunlu metrikler listesine eklenmeli.

### Bundan Sonra:
- **Perakende sektörü QA ek kontrol noktaları:**
  1. SSSG hesabı mevcut mu? (nominal büyüme - yeni mağaza katkısı)
  2. Revenue per Store trendu 5 yıllık hesaplandı mı?
  3. IFRS 16 öncesi/sonrası FAVÖK karşılaştırması var mı?
  4. Özel marka oranı time-series (erozyon trendi analizi)
  5. Uluslararası segment gelir + mağaza sayısı katkısı ayrıştırılmış mı?
- **CF blocker → CEO direktifi değil, infrastructure escalation** — CF çekilemiyorsa QA "CF BLOCKED — KAP altyapı müdahalesi gerekli, Chairman onayı bekleniyor" şeklinde CEO'ya yapılandırılmış raporla eskalasyon yapar. Aynı şikayeti her QA turunda tekrarlamak pipeline'ı bloke ediyor.
- **IAS29 optik vs operasyonel ROE ayrımı QA'da ayrı kontrol noktası** — Raporlanan ROE ile operasyonel ROE arasındaki fark (%21.3 vs %3.6 BIMAS örneği) kalite kontrol listesine eklenmeli; "IAS29 etkisi ayrıştırıldı mı?" sorusu her Türk şirketi için zorunlu.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **Round 2'de yeni P0 bulgusu (Revenue Q4/FY) tespit edildi ✓ — bu iyi** — QA P0-NEW olarak gelir karışıklığını yakaladı; "Round 2'de çözüldü gibi görünüyor ama aslında yanlış çözüme kilitlendi" tespiti doğru ve kritik analiz.
- **Chairman zorunlu metrik checklist tam uygulandı mı?** — Raporda görünmüyor; tüm 45 metriğin (DSO, DIO, DPO, CCC, NWC, ROE, ROCE, ROIC, vb.) present/blocked/missing durumu ayrı satır satır listelenmedi. "Completeness 0.63" puanı var ama hangi metriğin eksik olduğu liste olarak çekilmedi.
- **Remediation action plan P0 blokerleri için eksik** — Her P0 için: "Sorumlu Agent: data_collection | Fix: KAP PDF script çalıştır | Deadline: 4 saat | Başarı kriteri: IS + BS tam extract" formatı yok. Sadece sorunlar listelendi, sorumluluk atanmadı.
- **Downstream cascade analizi yapılmadı** — "Revenue Q4/FY hatası → financial_analysis marjları yanlış → valuation çarpanları yanlış → hedef fiyat yanıltıcı" zinciri QA'da gösterilmedi.
- **Strategic_synthesis eksikliği flaglenmedi** — strategic_synthesis çıktısı truncated (DIV-3 ve sonrası yok, convergence map eksik, BUY/SELL trigger yok); ama QA bunu P1 olarak kaydetmedi.

### Bundan Sonra:
- **P0 bloker için tam remediation plan formatı** — Her P0: Sorumlu | Fix Adımı | Deadline | Başarı Kriteri | Doğrulama Yöntemi. Bu format olmadan "REVISION_REQUIRED" kararı yeterince yönlendirici değil.
- **Chairman metrik checklist satır satır denetle** — 45 zorunlu metrik için output'ta her birini kontrol et: var (✅), blocked (⛔), eksik (❌). Bu liste QA çıktısında görünür olmalı.
- **Cascade effect her P0 için zorunlu** — "Bu hata downstream'e nasıl yayıldı?" sorusu yanıtlanmadan P0 close edilmez.
- **Strategic_synthesis truncation'ı P1 olarak flagle** — strategic_synthesis çıktısı truncated ise BUY/SELL recommendation ve Bull/Baz/Bear quantification eksiktir; bu CEO approval gate'i etkiler; P1 bloker olarak işaretle.

## Bilinen Hatalar (Bir Daha Yapma)

- SISE-AKBNK-KCHOL-TCELL (7 rapor): Remediation plan, escalation aksiyonu, downstream impact, P0-P3 prioritization TEKRAR TEKRAR EKSIK kaldi. ARTIK UYGULANMALI.
- KCHOL: Score 0.68 + %60 mandatory metrics missing → CONDITIONAL_PASS verildi, REVISION REQUIRED olmaliydi
- TCELL: Score 0.86 + %70 mandatory metrics missing → CONDITIONAL_PASS verildi, REVISION REQUIRED olmaliydi
- TUPRS: mandatory_metrics_complete false positive gec yakalandi — mid-pipeline kontrolu yapilmaliydi. EBITDA celiskisi cozum yolu onerilmedi.

## Son 3 Raporun Ogrenimleri

- **TUPRS (2026-04-12):** Hisse adedi tutarsizligi KAP temettü matematigi ile capraz dogrulama yapilabilir. IAS 29 EBITDA'yi gizliyor — nominal vs adjusted her zaman ayri raporla. Valuation agent timeout riski → modeli 3 parcaya bol.
- **EREGL (2026-04-13):** Upstream ajan birincil kaynak kullanidigini soyluyorsa ama acik belge ID/sayfa referansi yoksa evidence_sufficiency otomatik dusurulmeli. Known contradiction downstream'e sizabilir — QA downstream ajanlarin hatali rakamlari yeniden kullanip kullanmadigini kontrol etmeli. Primary-source scope drift ayri quality flag olmali.
- **KPI:** SISE 88/100, AKBNK 70/100, KCHOL 45/100, TCELL 65/100 — hedef: 95/100

## Sektor Bilgi Bankasi

- Rafineri: Her 1 $/bbl marj = ~5-6B TRY EBITDA. DCF WACC (TRY vs USD) kritik. Kapasite x Kullanim x Margin = FCF estimate (hizli mantik kontrolu).
- IAS 29: Parasal kazanc muhasebe duzeltmesidir, operasyonel nakit akisi degildir. Net kar icindeki IAS 29 etkisi her zaman ayristirilmali.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **CONDITIONAL_PASS'ı aktif olarak FAIL'e çevirmedi** — Reconciliation'ın CONDITIONAL_PASS verdiğini tespit etti ama "CONDITIONAL_PASS = BLOCK" kuralını pipeline'a yansıtmadı; CEO'ya direktif bekledi.
- **IS chain completeness skoru 0.68 — çok düşük** — 9/11 satır PENDING iken REVISION_REQUIRED yerine daha sert yaptırım gerekirdi.
- **"QA Tur 3 minimal" önermesi QA'nın görevi değil** — QA skoru ve karar verir; nasıl düzeltileceğini söylemez (kural ihlali — self-assessment adjacent).
- **IAS29 two-row format eksikliği P1 olarak işaretlendi ama blocking olmadı** — Chairman'ın zorunlu metrikleri listesinde VUK/SPK ayrımı zorunlu; P0 olmalıydı.

### Bundan Sonra:
- **QA reconciliation CONDITIONAL_PASS görünce otomatik FAIL üretecek:** "reconciliation_status = CONDITIONAL_PASS" olan pipeline'da QA skoru ne olursa olsun karar = FAIL.
- **IS chain %80 altında completeness = FAIL (REVISION_REQUIRED değil):** 9/11 satır PENDING olan bir IS tablosu REVISION_REQUIRED değil, doğrudan FAIL tetikler.
- **QA düzeltme önerisi VERMEYECEK:** QA'nın görevi: skor + karar + eksik listesi. "Şunu yap, Tur 3'te şunu düzelt" = downstream agent'ın işi. QA sadece PASS/FAIL + hangi kontrol başarısız oldu.
- **Chairman zorunlu metrikleri = P0 kontrol listesi:** DSO, DIO, DPO, CCC, NWC, ROE/ROCE/ROIC, Cash FAVÖK, FCF — herhangi biri eksikse FAIL, P0.

---
