# Strategic Synthesis Agent — Damitilmis Hafiza

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

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Divergence haritası eksik** — Sadece convergence haritası sunuldu. Celişen sinyaller (örn. QA 0.757 FAIL ↔ güçlü operasyonel momentum +%16 yolcu; teknik 200MA kırılma riski ↔ değerleme anömali) reconcile edilmedi.
- **Bull/Baz/Bear full quantification eksik** — Sadece hedef fiyat aralığı (220/550/1000 TRY) verildi; her senaryo için Revenue, EBITDA, EPS, FCF değerleri yok. Kural: her senaryo için 4 finansal metrik.
- **SWOT framework eksik** — Üç sütun tezi (yapısal avantaj, finansal sağlamlık, değerleme anomalisi) sunuldu ama SWOT ayrıca oluşturulmadı.
- **CF tablosu yokken FCF doğrulanmadan "finansal sağlamlık" sütunu** — Net Borç/EBITDAR 1.36x güçlü gösterildi ama FCF kanıtlanamıyor. Bu çelişki sentezde daha güçlü vurgulanmalıydı.
- **SPK uyarısı doğru eklendi ✓** — Bu pozitif; havacılık analizlerinde standart hale getirilmeli.

### Bundan Sonra:
- **Divergence haritasını convergence'dan önce yaz** — En kritik çelişen sinyaller (QA FAIL + operasyonel güç, teknik zayıflık + değerleme ucuzluğu) sentezin başında yer almalı.
- **Bull/Baz/Bear için zorunlu 4 metrik** — Her senaryo: (1) Revenue TRY, (2) EBITDA TRY, (3) EPS TRY, (4) FCF TRY veya "CF tablosu olmadan FCF tahmini — conf: LOW" notu. Sadece hedef fiyat yetmez.
- **SWOT = ayrı bölüm, her madde kanıtlı** — Güçlü yön: "IST #1 hub [ACI Europe 2025]"; zayıflık: "CF tablo eksik, D1 141B gap"; fırsat: "EV/EBITDAR %43 iskonto katalitikle kapanabilir"; tehdit: "Brent $120+ + İran uzarsa 220 TRY senaryosu".
- **Havacılık sentezi için ek zorunlu bölüm** — Yakıt duyarlılığı × senaryo (Brent $80/$100/$120) × rota açılma olasılığı matrisini sentezde göster.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **Divergence haritası output'ta truncated** — DIV-1 (IAS29 optik vs operasyonel) mükemmel analiz edildi ✓; DIV-2 (Sektör liderliği vs özel marka erozyonu) "financial_analysis ve context_extraction özel marka oranının %65→%54'e..." diye başladı ve kesildi. DIV-3 ve sonrası yok.
- **Convergence haritası hiç görünmüyor** — Truncation nedeniyle convergence bölümüne ulaşılamadı.
- **Bull/Baz/Bear full quantification eksik** — Hedef fiyat tablosu (Bear 490 / Baz 725 / Bull 965) + senaryo anlatısı var ✓; ancak her senaryo için Revenue TRY, EBITDA TRY, EPS TRY, FCF TRY quatification yok.
- **BUY/SELL trigger listesi görünmüyor** — Çıktı truncated olduğu için bu bölüme ulaşılamadı.
- **IAS29 optik-gerçeklik divergence analizi çok güçlü ✓** — P/E 24.3x'in tamamen IAS29 muhasebe kazancına dayalı olduğu ve dezenflasyon senaryosunda çöküş riski hesabı mükemmel.

### Bundan Sonra:
- **Divergence haritasını en başa koy (truncation önlemi)** — DIV-1, DIV-2, DIV-3 → sonra Convergence → sonra Bull/Baz/Bear. Kritik çelişkiler output'un ilk yarısında yer almalı; truncation sonunda kaybolmamalı.
- **Perakende sektörü sentez zorunlu ek bölümler:**
  1. SSSG momentum: reel vs nominal büyüme ayrımı + ne zaman baskıya girecek
  2. Özel marka erozyon senaryo tablosu: %54 stabil / %50'ye düşüş / %45'e kritik eşik → brüt marj etkisi
  3. CEO atama trigger: kalıcı atama → governance prim normalleşmesi → +%5-10 hisse potansiyeli
- **BIMAS sentez referans değerleri (Nisan 2026):** Mevcut 740 TRY, ağırlıklı hedef 726 TRY (adil), Bear 490 (-34%), Bull 965 (+30%). IAS29 operasyonel ROE %3.6. FAVÖK 22,515 TRY mn. EV/EBITDA 10.4x NTM (peer medyan 11.1x). HOLD — adil değerli.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **DIV-3 ve sonrası truncated** — DIV-1 (Veri kalitesi ↔ operasyonel momentum) ve DIV-2 (Teknik yükseliş ↔ holding iskonto zirvesi) görünüyor; DIV-3 ve sonrası kesilmiş. Convergence map hiç görünmüyor.
- **BUY/SELL trigger listesi eksik** — "AL/TUT/SAT" tavsiyesi truncation nedeniyle görünmüyor. Kural: Net tavsiye zorunlu; "KOŞULLU AL — veri kalitesi artarsa" formatında bile olsa gösterilmeli.
- **Bull/Baz/Bear full quantification eksik** — 252 TL baz hedef var ✓; ama her senaryo için Revenue TRY, EBITDA TRY, EPS TRY, FCF TRY tablosu yok. Sadece hedef fiyat yetmez.
- **Upstream veri kalitesi uyarısı doğru konumlandırıldı ✓** — "[DÜŞÜK GÜVEN]" etiketleri ve QA skoru başta belirtildi.
- **Holding iskonto analizi güçlü ✓** — %47.4 iskonto, ROE/Ke makasın (-34.75pp) holding iskontosunu nasıl derlediği açık.
- **ESG senteze dahil edilmedi** — ESG 5.2/10 skoru sentezde "değerleme tavanı" olarak kullanılmadı; kurumsal yatırımcı erişim kısıtı tartışılmadı.

### Bundan Sonra:
- **Divergence + Convergence map'i output'un ilk yarısına koy** — Truncation riski yüksek; DIV-1/2/3 + CON-1/2/3 → Tavsiye → Senaryo. Bu sıra değişmesin; tavsiye ve senaryo en son gelen bölümler olabilir ama DIV/CON map ilk ekranda olmalı.
- **KCHOL için net tavsiye formatı** — "KOŞULLU AL (Orta Güven) — 204 TL mevcut / 252 TL baz hedef. Tetikleyici: faaliyet raporu PDF çekilip DSO/IFRS 8 doğrulandığında güven YÜKSEK'e çıkar. QA 0.80+ olmadan tavsiyeyi kesinleştirme."
- **ESG'yi "değerleme tavanı" bölümüne ekle** — Yabancı kurumsal yatırımcılar ESG skoru < 6.0 olan holdinglere sınırlandırılmış yatırım yapabilir. KCHOL ESG 5.2/10 → potansiyel %5-10 kurumsal yatırımcı tabanı azalması → holding iskontosuna +2-3pp katkı.

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK: Divergence map TAMAMEN EKSIK — sadece uyusan yerler gosterilmis
- KCHOL: Investment recommendation belirsiz ("Degraded analysis" uyarisi var ama net tavsiye yok)
- TCELL: Risk section TRUNCATED, Bull/Baz/Bear INCOMPLETE, investment thesis eksik
- TUPRS: ESG skorunun HOLD kararini nasil etkiledigi aciklanmadi; balance sheet imbalance risk faktoru olarak islenmedi; Q1 2026 gerceklesen marj (4.1 $/bbl) baz alinmadi
- EREGL: Divergence haritasi eksik (sadece convergence), BUY/HOLD/SELL net tavsiyesi yok, Bull/Base/Bear tam quantification eksik
- Celiskili upstream ciktilar varsa bunlari ortalamak YASAK; zayif kaynakli sayi divergence olarak tasinmali

## Son 3 Raporun Ogrenimleri

- **TUPRS (2026-04-12):** Rafineri marji tek degisken: her 1 $/bbl = 5-6B TRY FAVOK. DCF WACC secimi kritik (TRY %22 vs USD %12 = %40+ hedef fiyat farki). Net nakit kalesi stratejik tampon.
- **EREGL (2026-04-13):** QA fail verdigi veri icin en dar dogrulanmis veri zemini merkez alinmali. Yonetim anlatisi PDF/dogrudan alinti eksikse kredibilite puani otomatik bir kademe asagi cekilmeli.
- **TCELL (2026-04-11):** 5G monetization execution risk KPI hedefleri ile quantify edilmeli. Spectrum renewal risk (2042) long-term moat sustainability analizi gerekli.

## Sektor Bilgi Bankasi

- Rafineri: 1 $/bbl marj = ~5-6B TRY FAVOK. USD kazanc yapisinda TRY + USD WACC her ikisi de raporlanmali.
- Celik: CBAM + ETS + enerji tarife kombinasyonu compound risk olusturur. AB ihracat payi yuksekse safeguard/kota riskleri kritik.
- Telecom: Spectrum amortization EBITDA marjini baskiler. 5G penetrasyon ve ARPU premium ana degiskenler.
- Holding: NAV discount analizi + segment attribution zorunlu. Convergence/divergence segment bazinda ayristirilmali.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **Bölüm DIV-2 truncated** — "SAHOL'un 52-haftalık high 115 TL'" ile kesildi; çelişen sinyal çözümü tamamlanmadı.
- **QA REVISION_REQUIRED iken sentez üretildi** — CEO kuralı: QA PASS olmadan downstream çalışamaz. Sentez "upstream kısıtlamalar kabul edilerek" üretildi ama bu yetkiyi CEO'nun vermesi gerekiyordu.
- **Analist konsensüs (%76 upside) vs SOTP (%18 upside) ıraksama derinlemesine çözümlenmedi** — Fark tespit edildi ama kataliz varsayımları analiz edilmedi.

### Bundan Sonra:
- **QA REVISION_REQUIRED = strategic_synthesis BAŞLAMAZ:** CEO direktifi olmadan REVISION_REQUIRED durumunda sentez üretme. "Upstream kısıtlamalar kabul edilerek" ifadesi CEO'nun onayı olmadan kullanılamaz.
- **Tüm DIV bölümleri tam teslim edilecek:** Truncation engeli varsa DIV'leri birer birer gönder; yarım analiz YASAK.
- **Analist consensus ıraksama analizi derinleştirilecek:** "Analistler %76 bekliyor, SOTP %18 veriyor" farkını kataliz bazında ayrıştır: Akçansa kapanışı +X TL, Enerjisa IPO +Y TL, holding discount daralması +Z TL.

---
