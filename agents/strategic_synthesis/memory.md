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

## CEO Geri Bildirimi — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417)

### Eksikler:
- **convergence_score: 1, confidence: "low" — tek sinyal üretildi** — Sadece teknik "bullish" sinyali. Operasyonel sinyaller (network gücü, USD gelir avantajı), event sinyalleri (CEO değişimi, İran), makro sinyallerin tamamı eksik.
- **Investment recommendation yok — "HOLD — INSUFFICIENT DATA" yazılmadı (5. THYAO)** — Boş çıktı yerine minimum tavsiye formatı zorunlu direktifi 4 kez verildi; 5. turda da uygulanmadı.
- **Goldman 3-sütun yapısı yok (5. THYAO)** — S.1: hedef fiyat + tez + tablo; S.2-3: yatırım sütunları; S.4-5: nicel riskler. Hiçbiri üretilmedi.
- **SWOT framework yok (5. THYAO)** — 4 boyut × minimum 4 satır kanıt destekli tablo; 5 turda üretilmedi.
- **BUY/SELL trigger listesi yok (5. THYAO)** — Min 3+3 trigger; direktif 4 kez verildi, uygulanmadı.
- **Bull/Baz/Bear full quantification yok (5. THYAO)** — Revenue/EBITDA/EPS/FCF/TP senaryo setleri üretilmedi.
- **Divergences: [] — boş** — "Operasyonel güç vs yönetim belirsizliği" gibi temel çelişkiler haritalanmadı.

### Bundan Sonra:
- **financial_analysis olmadan minimum sentez zorunlu (5. direktif — kesinleşti):**
  1. "HOLD — INSUFFICIENT DATA" tavsiye: recommendation + reason + recheck_condition
  2. Teknik sinyal (MA/RSI/MACD bullish ✓ zaten var)
  3. Operasyonel sinyal (network gücü, USD gelir yapısı — context_extraction'dan)
  4. Event sinyali (CEO değişimi negatif, nakit tutma pozitif)
- **THYAO SWOT minimum içerik (context_extraction'dan her zaman üretilebilir):**
  - S: 340+ destinasyon network, USD gelir ~%90, İstanbul hub moat
  - W: Yeni CEO belirsizliği, İran rota kaybı, yakıt hedge oranı bilinmiyor
  - O: Orta Doğu rotaları açılırsa hızlı toparlanma, kargo büyümesi
  - T: Brent spike, jeopolitik genişleme, küresel resesyon
- **convergence_score: 1 = yetersiz** — Minimum 3 sinyal grubu olmadan sentez üretilemez; üretilirse "partial — 1/3 sinyal grubu" etiketle.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **convergence_score: 0.38, yatırım tavsiyesi yok — 5. THYAO** — Minimum tez "veri eksik → izle" bile üretilmedi. "Sentez yapılamadı" ile boş bırakmak kabul edilemez.
- **Goldman 3-sütun yapısı uygulanmadı — 5. THYAO** — S.1: TP + tez + tablo; S.2-3: 3 yatırım sütunu; S.4-5: 3 sayısallaştırılmış risk. Bu yapı 5 turda da üretilmedi.
- **SWOT tablosu yok — 5. THYAO** — 4 boyut × minimum 4 satır kanıt destekli tablo; 5 analizde de üretilmedi.
- **BUY/HOLD/SELL trigger listesi yok — 5. THYAO** — Minimum 3 BUY + 3 SELL trigger formatı üretilmedi.
- **Bull/Baz/Bear full quantification (Revenue/EBITDA/EPS/FCF/TP) yok — 5. THYAO** — Sadece sözlü senaryo tanımlamaları var; sayısal tablo yok.
- **Operasyonel sinyaller senteze entegre edilmedi** — Yolcu büyümesi +%16, yük faktörü %83.6, pax network gücü — bu veriler mevcut; senteze girmedi.
- **Hedef fiyat bu turda üretildi (Bear 231/Baz 330/Bull 462, ağırlıklı 338 TL) ama kaynak belirsiz** — EBITDAR null olduğundan değerleme nasıl yapıldı teyit edilemedi; final_summary hedef fiyatı üretirken strategic_synthesis boşta kaldı.

### Bundan Sonra:
- **Veri eksikliğinde minimum sentez zorunlu (5. direktif — kesinleşti):** EBITDA null olsa bile: (1) Revenue trend + OCF bazlı kaba değerleme aralığı, (2) Risk listesi, (3) "Veri kalitesi düşük, hedef fiyat geçici" notu. Sıfır üretim kabul edilemez.
- **SWOT tablosu = her THYAO analizinin zorunlu formatı** — 4 boyut × minimum 4 satır kanıt destekli. Gömülü metin değil, tablo formatı.
- **THYAO sabit Bull/Baz/Bear referans değerleri** — Bull: İran açılır + Brent <$75 → TP 320-360 TL | Baz: H2 kısmi + Brent $75-90 → TP 240-280 TL | Bear: kriz genişler + Brent >$100 → TP 160-190 TL. Bu referanslar mevcut verilerle güncellenebilir.

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **sector = "industrial" — cascade etkisi** — financial_analysis'tan gelen yanlış sektör etiketi strategic_synthesis'e de taşındı; peer_group=[] ve sector_score anlamsız.
- **convergence_score 0.63 ama net öneri yok** — "BUY/HOLD/SELL" tavsiyesi üretilmedi. 0.63 konverjans skoru bile minimum "HOLD — veri eksikliği nedeniyle güven düşük" öneri gerektirir.
- **SWOT tablosu yok** — ASELS güçlü yanları (monopol pozisyon, TSKGV desteği, backlog), zayıflıkları (EBITDA null cascade, yüksek CCC), fırsatlar (NATO bütçe artışı, ihracat), tehditler (geopolitik rota kapanması, TSKGV bağımlılığı) — bunların tablo formatında analizi üretilmedi.
- **Goldman yapısı uygulanmadı** — S.1: TP+tez+tablo; S.2-3: 3 yatırım sütunu (backlog görünürlüğü, ihracat büyümesi, AR-GE yatırımı); S.4-5: 3 risk (TSKGV konsantrasyonu, EBITDA null cascade, jeopolitik). Hiçbiri üretilmedi.
- **BUY/SELL trigger listesi yok** — Minimum: BUY: yeni büyük sözleşme + jeopolitik tırmanma + ihracat %30+; SELL: TSKGV bütçe kesintisi + CCC >500 gün + EBITDA marjı <10%.
- **Bull/Baz/Bear full quantification (Revenue/EBITDA/EPS/TP) yok** — Savunma sektöründe jeopolitik senaryo tablosu valuation için zorunlu girdi.

### Bundan Sonra:
- **Savunma şirketleri için Goldman yapısı zorunlu 3 yatırım sütunu:**
  1. Backlog görünürlüğü ve sözleşme pipeline'ı (Revenue visibility 2-3 yıl)
  2. İhracat büyümesi ve yeni pazarlar (FX geliri + ciro diversifikasyonu)
  3. AR-GE yatırımı ve teknoloji geliştirme (rekabet avantajı sürdürülebilirliği)
- **Savunma sektörü Bull/Baz/Bear şablonu:**
  - Bull: Jeopolitik gerilim yüksek + yeni büyük sözleşme + ihracat artışı → TP hedef ×1.3
  - Baz: Mevcut backlog devam + iç pazar istikrar + orta seviye ihracat → TP hedef ×1.0
  - Bear: TSKGV bütçe kesintisi + ihracat gerilimi + jeopolitik normalleşme → TP hedef ×0.7
- **EBITDA null ise savunma değerlemesi: Revenue × sektör marjı proxy** — Savunma peers ortalama EBITDA marjı ~%12-15 (Thales/Leonardo ortalama); ASELS için "EBITDA tahmini = Revenue × %12 [conf: LOW, proxy]" üretilebilir; null bırakma.

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
