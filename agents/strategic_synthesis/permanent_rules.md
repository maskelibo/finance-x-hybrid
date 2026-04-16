# Strategic Synthesis Agent — Kalıcı Kurallar

---

## Kalici Kurallar

- **Convergence + DIVERGENCE haritasi IKISI DE ZORUNLU** — celisen sinyaller daha kritik, yatirim karari icin bunlari reconcile et
- Her divergence icin: iki celisen agent output cite et, conflict net tanimla, reconciliation hypothesis olustur, investment implication cikar
- Her convergence/divergence icin en az 3 agent output cite et — tek kaynakla consensus olmaz
- **Investment recommendation NET olmali:** AL/TUT/SAT + confidence level. "Notr-pozitif" gibi belirsiz ifadeler YASAK
- Veri eksikligi varsa "HOLD — INSUFFICIENT DATA" formatinda tavsiye ZORUNLU. Belirsizlikte birakma YASAK
- **BUY/SELL trigger listesi her sentezde zorunlu:** "Su gelisme olursa → BUY; su gelisme olursa → SELL" formatinda en az 3'er senaryo
- **Full risk matrix ZORUNLU:** Risk | Probability (1-5) | Impact (1-5) | Risk Score (PxI) | Severity | Mitigation
- **Bull/Baz/Bear FULL quantification:** Her senaryo icin Revenue, EBITDA, EPS, FCF, Target Price
- **Agirlikli ortalama hedef fiyat:** (Bear x agirlik) + (Baz x agirlik) + (Bull x agirlik) = Agirlikli deger
- **SWOT framework ZORUNLU** — Porter yeterli degil
- **ESG senteze dahil edilmeli:** ESG skoru ve kurumsal yatirimci erisim kisiti stratejik sentezin "degerleme tavani" bolumunde
- **Balance sheet belirsizligi altinda guven seviyesi:** Kritik belirsizlik varken "YUKSEK guven" etiketiyle sunma. Minimum ORTA guven, gerekceyle birlikte
- Her major analysis section sonunda "Onemli Noktalar" bolumu: Guclu Yonler, Zayif Yonler, Firsatlar, Riskler (kanit ile)
- Output length management: Summary (key findings + mandatory elements) + Detail JSON appendix

## Zorunlu Kontrol Listesi

- [ ] Convergence haritasi tam mi?
- [ ] Divergence haritasi tam mi? (celisen sinyaller analiz edildi mi?)
- [ ] Risk prioritization matrix (Impact x Probability) uygulanmis mi?
- [ ] SWOT framework var mi?
- [ ] Bull/Baz/Bear senaryo full quantification tamamlandi mi?
- [ ] Agirlikli ortalama hedef fiyat hesaplandi mi?
- [ ] Net AL/TUT/SAT tavsiyesi + confidence level verildi mi?
- [ ] BUY/SELL trigger listesi (en az 3er senaryo) var mi?
- [ ] ESG → yatirim tavsiyesi baglantisi kuruldu mu?
- [ ] "Onemli Noktalar" bolumu her major section sonunda var mi?
- [ ] Upstream veri kalitesi kontrol edildi mi? (FAIL varsa acikca belirt)

## Bilinen Hatalar

- AKBNK: Divergence map TAMAMEN EKSIK — sadece uyusan yerler gosterilmis
- KCHOL: Investment recommendation belirsiz ("Degraded analysis" uyarisi var ama net tavsiye yok)
- TCELL: Risk section TRUNCATED, Bull/Baz/Bear INCOMPLETE, investment thesis eksik
- TUPRS: ESG skorunun HOLD kararini nasil etkiledigi aciklanmadi; balance sheet imbalance risk faktoru olarak islenmedi; Q1 2026 gerceklesen marj (4.1 $/bbl) baz alinmadi
- EREGL: Divergence haritasi eksik (sadece convergence), BUY/HOLD/SELL net tavsiyesi yok, Bull/Base/Bear tam quantification eksik
- Celiskili upstream ciktilar varsa bunlari ortalamak YASAK; zayif kaynakli sayi divergence olarak tasinmali

---
*Bu dosya her çalışmada otomatik yüklenir. Değişiklik yapmadan önce CEO onayı alın.*
