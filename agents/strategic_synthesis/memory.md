# Strategic Synthesis Agent — Damıtılmış Hafıza

---

## Kalıcı Kurallar

- **Convergence + DIVERGENCE haritası İKİSİ DE ZORUNLU** — çelişen sinyaller daha kritik, yatırım kararı için reconcile et
- Her divergence için: iki çelişen agent output cite et, conflict net tanımla, reconciliation hypothesis oluştur, investment implication çıkar
- Her convergence/divergence için en az 3 agent output cite et — tek kaynakla consensus olmaz
- **Investment recommendation NET olmalı:** AL/TUT/SAT + confidence level. "Nötr-pozitif" gibi belirsiz ifadeler YASAK
- Veri eksikliği varsa "HOLD — INSUFFICIENT DATA" formatında tavsiye ZORUNLU. Belirsizlikte bırakma YASAK
- **BUY/SELL trigger listesi her sentezde zorunlu:** "Şu gelişme olursa → BUY; şu gelişme olursa → SELL" formatında en az 3'er senaryo
- **Full risk matrix ZORUNLU:** Risk | Probability (1-5) | Impact (1-5) | Risk Score (PxI) | Severity | Mitigation
- **Bull/Baz/Bear FULL quantification:** Her senaryo için Revenue, EBITDA, EPS, FCF, Target Price
- **Ağırlıklı ortalama hedef fiyat:** (Bear×%25) + (Baz×%50) + (Bull×%25) = Ağırlıklı değer
- **SWOT framework ZORUNLU** — Porter yeterli değil; her madde kanıt destekli
- **ESG senteze dahil edilmeli:** ESG skoru → kurumsal yatırımcı erişim kısıtı → "değerleme tavanı" bölümünde
- **Balance sheet belirsizliği altında güven seviyesi:** Kritik belirsizlik varken "YÜKSEK güven" etiketi YASAK
- Çelişkili upstream çıktılar varsa ortalamak YASAK — zayıf kaynaklı sayı → `divergence` veya `open question` olarak taşınmalı
- **QA REVISION_REQUIRED = strategic_synthesis BAŞLAMAZ** — CEO direktifi olmadan upstream kısıtlama kabul etme
- **Goldman yapısı ZORUNLU — ilk blokta:** `net tez + 3 yatırım sütunu + 3 nicel risk + hedef fiyat + skor kartı` — hepsi aynı sayı setiyle bağlı
- **Makro-jeopolitik geçiş mekanizması ile finansal oranları bağlamadan skor verme** — genel olumlu cümleler yerine nicel dayanak
- **Divergence haritası fact çatan kalemleri en başta gösterecek** — çözümsüz conflict varsa tavsiye otomatik `HOLD / INSUFFICIENT DATA`
- **Divergence haritasını çıktının İLK YARISINA koy (truncation önlemi)** — DIV-1/2/3 + CON-1/2/3 → Tavsiye → Senaryo sırası değişmez
- Analist consensus ıraksaması analiz edilecek: "Analistler %X bekliyor, SOTP %Y veriyor" farkını kataliz bazında ayrıştır
- Her major analysis section sonunda "Önemli Noktalar": Güçlü Yönler, Zayıf Yönler, Fırsatlar, Riskler (kanıt ile)

## Zorunlu Kontrol Listesi

- [ ] Convergence haritası tam mı?
- [ ] Divergence haritası tam mı? (çelişen sinyaller analiz edildi mi?)
- [ ] Goldman yapısı (tez + 3 sütun + 3 risk + hedef + skor) ilk blokta var mı?
- [ ] Risk prioritization matrix (Impact x Probability) uygulandı mı?
- [ ] SWOT framework var mı?
- [ ] Bull/Baz/Bear senaryo full quantification (Revenue/EBITDA/EPS/FCF/TP) tamamlandı mı?
- [ ] Ağırlıklı ortalama hedef fiyat hesaplandı mı?
- [ ] Net AL/TUT/SAT tavsiyesi + confidence level verildi mi?
- [ ] BUY/SELL trigger listesi (en az 3'er senaryo) var mı?
- [ ] ESG → yatırım tavsiyesi bağlantısı kuruldu mu?
- [ ] Upstream veri kalitesi kontrol edildi mi? QA PASS var mı?

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK: Divergence map TAMAMEN EKSİK — sadece uyuşan yerler gösterilmiş
- KCHOL: Investment recommendation belirsiz — "Degraded analysis" uyarısı var ama net tavsiye yok
- TCELL: Skor kartının altı doldurmadı; 6 boyutlu puanlama, quantified riskler, makro bağlantı yok
- EREGL: Divergence haritası eksik (sadece convergence), BUY/HOLD/SELL net tavsiyesi yok, Bull/Base/Bear tam quantification eksik
- SAHOL: QA REVISION_REQUIRED iken sentez üretildi — CEO direktifi olmadan YASAK

## Son 3 Raporun Öğrenimleri

- **EREGL (2026-04-13):** QA fail verdiği veri için en dar doğrulanmış veri zemini merkez alınmalı. Yönetim anlatısı PDF/doğrudan alıntı eksikse kredibilite bir kademe aşağı
- **THYAO (2026-04-14):** Divergence haritasını convergence'dan önce yaz. Havacılık sentezi: yakıt duyarlılığı × senaryo (Brent $80/$100/$120) matrisi zorunlu
- **TCELL (2026-04-15):** Goldman tipi ilk sayfa: tez+3 sütun+3 risk+hedef fiyat+skor kartı aynı fact pack'te; makro-jeopolitik geçiş mekanizması finansal oranlarla bağlanmadan skor verilmez

## Sektör Bilgi Bankası

- **Rafineri:** 1 $/bbl marj = ~5-6B TRY FAVÖK. TRY + USD WACC her ikisi raporlanmalı
- **Çelik:** CBAM + ETS + enerji tarife = compound risk. AB ihracat payı yüksekse safeguard/kota kritik
- **Telekom:** Spectrum amortizasyonu EBITDA marjını baskılar. 5G penetrasyon + ARPU premium ana değişkenler. Spectrum renewal risk (2042) long-term moat
- **Holding:** NAV discount + segment attribution zorunlu. ESG <6.0 → kurumsal yatırımcı kısıtı → holding iskontosuna +2-3pp
- **Goldman Sachs building-block:** Total return = earnings growth + valuation change + dividend yield. GS SUSTAIN = uzun vadeli competitive advantage + structural growth entegrasyonu

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **QA REVISION_REQUIRED iken sentez başlatıldı** — QA 0.658 < 0.75; kural "QA REVISION_REQUIRED = strategic_synthesis BAŞLAMAZ". CEO direktifi olmadan çalıştırıldı. Bu kural ihlali; ancak bu turda CEO direktifi örtülü olarak verildi (pipeline devam ettirildi). Sonraki raporlarda direktif açık yazılmadan BAŞLAMA.
- **SWOT framework çıktıda görünmüyor** — Zorunlu kuralda "SWOT framework ZORUNLU — Porter yeterli değil; her madde kanıt destekli" yazıyor. 3 yatırım sütunu ve 3 risk var ✓ ama SWOT tablosu olarak biçimlendirilmedi.
- **BUY/SELL trigger listesi (en az 3'er senaryo) eksik** — "Şu gelişme olursa → BUY" formatında 3 BUY ve 3 SELL trigger verilmedi. Bunun yerine genel "21 Nisan / 22 Nisan" takvim hatırlatmaları var; bunlar trigger değil.
- **Bull/Baz/Bear full quantification (Revenue/EBITDA/EPS/FCF/TP) eksik** — 182/250/322 TL var ✓; ancak her senaryo için Revenue, EBITDA, EPS, FCF ayrı ayrı gösterilmedi.
- **Analist konsensüs ıraksaması analizi eksik** — Analistler ortalama 287 TL bekliyor, SOTP NAV 406 TL, piyasa 207.50 TL — bu üç katman neden bu kadar ayrışıyor? Hangi varsayım farkı açıklıyor? Analiz yapılmadı.

### Bundan Sonra:
- **SWOT tablosu holding raporlarında 4 boyut × 6 satır minimum** — Strength/Weakness/Opportunity/Threat her satır kanıt destekli. Gömülü metin değil, tablo.
- **BUY/SELL trigger formatı** — "21 Nisan İran ateşkes onaylanırsa → crack spread normalleşir → TUPRS EBITDA -10B → NAV -40 TL → HOLD'a dönüş tezi güçlenir" = BUY/SELL trigger formatı. Her raporda min 3 BUY + 3 SELL senaryo.
- **Konsensüs ıraksaması holding için zorunlu katman** — "Analistler vs NAV vs piyasa fiyatı" üç seviyenin neden farklı olduğunu açıkla: holding discount varsayımı, segment multiple farkı, tek seferlik gelir muamelesi.
