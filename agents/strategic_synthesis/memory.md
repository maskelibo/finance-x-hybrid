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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **financial_analysis olmadan sentez çalıştırıldı** — `"No financial_analysis output — strategic_synthesis cannot extract fundamental signals"` uyarısı verildi; doğru tespit ✓. Ancak sonuçta convergence_score: 0, confidence: "low" ve investment_recommendation yok. Kural: "Veri eksikliği varsa 'HOLD — INSUFFICIENT DATA' formatında tavsiye ZORUNLU." Bu tavsiye verilmedi.
- **signals.positive sadece teknik "bullish" trendi** — Tek pozitif sinyal: MA sinyal grubu. Operasyonel güç (pax +%16, load factor %83.6, Q1 data), temettü sıfır (nakit koruması) ve network genişliği (130+ ülke) — bunlar fundamental pozitif sinyaller olarak senteze dahil edilebilirdi.
- **signals.negative sadece "Event net: -2"** — Negatif sinyaller yetersiz; İran krizi ve CEO değişiminin kuantifiye etkisi yoktu.
- **Divergence haritası tamamen yok** — convergence_score: 0 + divergences: [] = boş. Havacılık için kritik divergence: "Operasyonel güç (bullish teknik) vs yönetim belirsizliği (negative event)" çelişkisi haritalanmadı.
- **Goldman yapısı yok** — İlk blok: tez + 3 sütun + 3 risk + hedef fiyat + skor kartı. Hiçbiri üretilmedi.
- **Bull/Baz/Bear quantification yok** — Revenue/EBITDA/EPS/FCF/TP senaryo setleri üretilmedi.
- **BUY/SELL trigger listesi yok** — "Yeni CEO Q1'de EBITDAR ≥%23 → BUY" gibi 3 BUY + 3 SELL trigger yazılmadı.

### Bundan Sonra:
- **financial_analysis yoksa "HOLD — INSUFFICIENT DATA" formatını YAZ** — Sadece boş çıktı gönderme. `"recommendation": "HOLD — INSUFFICIENT DATA", "reason": "financial_analysis eksik — nakit akışı, çalışma sermayesi ve IFRS 16 verileri doğrulanamadı", "recheck_condition": "financial_analysis CF tablosu geldiğinde"` formatı zorunlu.
- **Mevcut verilerden partial sentez üret** — financial_analysis yoksa bile: (1) teknik sinyaller, (2) event chain sinyalleri, (3) context_extraction'dan fundamental narrative → 3 sinyal grubuyla "sınırlı veri ile orta güvenli" sentez üretilebilir.
- **Havacılık sentezi zorunlu divergence tespiti:**
  - "Operasyonel güç (load factor %83.6, pax +%16) vs yönetim belirsizliği (CEO değişimi)" çelişkisi
  - "Güçlü FCF tezi vs temettü dağıtılmaması" yatırımcı sinyali çatışması
  - "İran rotaları geçici vs yapısal risk" zamansal belirsizlik
- **Havacılık Bull/Baz/Bear temel değişkenler:**
  - Bull: İran rotaları açılır, Brent <$75, yeni CEO güven artırır
  - Baz: Rotalar H2'de kısmen açılır, Brent $75-90, CEO geçiş 1-2 çeyrek sürer
  - Bear: İran krizi genişler, Brent >$100, yönetim değişimi strateji kırılmasına yol açar

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **Investment recommendation yok — 2. THYAO** — "HOLD — INSUFFICIENT DATA" formatı Delta'da da yazılmadı, Standard'da da yazılmadı. Boş çıktı kabul edilemez; veri eksikliği varsa da tavsiye formatı zorunlu.
- **Goldman yapısı yok** — Tez + 3 yatırım sütunu + 3 nicel risk + hedef fiyat + skor kartı; hiçbiri üretilmedi.
- **SWOT framework yok** — signals.positive/negative var ama SWOT tablosu üretilmedi.
- **BUY/SELL trigger listesi yok** — "Yeni CEO Q1'de EBITDAR ≥%23 → BUY" formatında 3+3 trigger. Delta'da da eksikti.
- **Havacılık divergence haritası yok** — "Operasyonel güç (pax +%16, LF %83.2) vs yönetim belirsizliği (CEO değişimi)" çelişkisi haritalanmadı.
- **Bull/Baz/Bear full quantification yok** — Revenue/EBITDA/EPS/FCF/TP senaryo setleri üretilmedi.

### Bundan Sonra:
- **financial_analysis eksik iken zorunlu minimum sentez:**
  1. "HOLD — INSUFFICIENT DATA" tavsiye formatı: recommendation + reason + recheck_condition
  2. Operasyonel sinyal (pax büyümesi + LF context'ten)
  3. Event chain sinyali (temettü sıfır = nakit koruması, pozitif)
  4. Teknik sinyal (MA/RSI/MACD bullish)
- **Havacılık Bull/Baz/Bear temel değişkenler (3. kez — uygulanacak):**
  - Bull: İran rotaları açılır + Brent <$75 + yeni CEO güven verir
  - Baz: Rotalar H2'de kısmen açılır + Brent $75-90 + CEO geçiş 1-2 çeyrek
  - Bear: İran krizi genişler + Brent >$100 + strateji kırılması

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **convergence_score: 0.38 + investment_recommendation: yok** — HOLD — INSUFFICIENT DATA formatı yazılmadı; sadece boş sinyal listesi verildi.
- **Goldman yapısı yok** — Tez + 3 yatırım sütunu + 3 nicel risk + hedef fiyat + skor kartı; hiçbiri üretilmedi.
- **SWOT framework yok** — Signals.positive/negative var ama SWOT tablosu yok.
- **BUY/SELL trigger listesi yok** — "Yeni CEO Q1'de EBITDAR ≥%23 → BUY" formatında 3+3 trigger yazılmadı.
- **Bull/Baz/Bear full quantification yok** — Revenue/EBITDA/EPS/FCF/TP senaryo setleri üretilmedi.
- **Havacılık divergence haritası yok** — "Operasyonel güç (pax+%16, LF %83.2) vs yönetim belirsizliği (CEO değişimi)" çelişkisi haritalanmadı.
- **sector_competition "industrial" boş peer** — Synthesis temel girdi olan peer benchmarklar boş; bu synthesis kalitesini çürütüyor.
- **Sinyal grubu eksik** — Positive signal'da: pax büyümesi, load factor, rota ağı (130+ ülke), temettü sıfır (nakit koruması) eksik. Sadece teknik "bullish" var.

### Bundan Sonra:
- **financial_analysis eksik olsa bile 3 pozitif sinyal havacılıkta her zaman üretilebilir:**
  1. Operasyonel KPI sinyali (pax büyümesi + LF context_extraction'dan)
  2. Event chain sinyali (temettü sıfır = nakit koruması, pozitif)
  3. Teknik sinyal (MA/RSI/MACD bullish)
- **"HOLD — INSUFFICIENT DATA" formatı** — financial_analysis/EBITDA/FCF yoksa: `"recommendation": "HOLD — INSUFFICIENT DATA", "reason": "...", "recheck_condition": "..."`. Boş çıktı kabul edilemez.
- **Havacılık Bull/Baz/Bear temel değişkenler (3. kez — uygulanmalı):**
  - Bull: İran rotaları açılır + Brent <$75 + yeni CEO güven verir
  - Baz: Rotalar H2'de kısmen açılır + Brent $75-90 + CEO geçiş 1-2 çeyrek
  - Bear: İran krizi genişler + Brent >$100 + strateji kırılması

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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **BUY/SELL tavsiyesi yok — convergence 0.38** — Goldman yapısı: net tez + tavsiye üretilmedi. "EBITDA null → sentez yapılamadı" gerekçesi kısmi doğru; ancak mevcut verilerle (Revenue, OCF, context, teknik) minimum tez üretilebilirdi.
- **Goldman 3-sütun yapısı uygulanmadı** — S.1: hedef fiyat + tez + tablo; S.2-3: 3 yatırım sütunu; S.4-5: 3 sayısallaştırılmış risk. Bu yapı üretilmedi.
- **SWOT tablosu yok** — 4 boyut × minimum 4 satır kanıt destekli tablo üretilmedi.
- **BUY/SELL trigger listesi yok** — Minimum 3 BUY + 3 SELL trigger ("şu gelişirse → al/sat" formatı) eksik.
- **Bull/Baz/Bear full quantification eksik** — Revenue/EBITDA/EPS/FCF her senaryo için ayrı verilmedi; sadece hedef fiyat aralığı var.
- **Operasyonel sinyaller görmezden gelindi** — CEO değişimi + İran rotaları + Brent hareketi senteze entegre edilmedi.

### Bundan Sonra:
- **Veri eksikliğinde minimum sentez zorunlu** — EBITDA null olsa bile: (1) Revenue trend + OCF bazlı kaba değerleme, (2) Risk listesi, (3) "Veri kalitesi düşük, hedef fiyat geçici" notu. Hiçbir çıktı üretmemek kabul edilemez.
- **THYAO Goldman yapısı (her standard analizde):**
  - S.1: Yatırım tezi (1 paragraf) + hedef fiyat tablosu (Bear/Baz/Bull + ağırlıklı)
  - S.2-3: 3 yatırım sütunu (her biri: kanıt + sayı + zaman ufku)
  - S.4-5: 3 sayısallaştırılmış risk (her biri: olasılık + EBITDA etkisi + tetikleyici)
- **BUY/SELL trigger formatı (min 3+3):** "İran rotaları H2'de açılırsa + Brent <$80 + yeni CEO güven verirse → Hedef fiyat 280→350 TL → BUY trigger"
- **THYAO Bull/Baz/Bear temel değişkenler (3. kez — uygulanacak):**
  - Bull: İran rotaları açılır + Brent <$75 + yeni CEO güven verir → TP 320-360 TL
  - Baz: Rotalar H2 kısmen açılır + Brent $75-90 + CEO geçiş 1-2 çeyrek → TP 240-280 TL
  - Bear: İran krizi genişler + Brent >$100 + strateji kırılması → TP 160-190 TL

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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **Goldman 3-sütun yapısı uygulanmadı** — S.1: hedef fiyat + tez + tablo; S.2-3: 3 yatırım sütunu; S.4-5: 3 sayısallaştırılmış risk. Bu yapı üretilmedi. convergence_score 0.38 upstream bağımlılık doğrudan bu eksikliğe yol açtı.
- **SWOT tablosu yok — 4. THYAO** — 4 boyut × minimum 4 satır kanıt destekli tablo; 4 analizde de üretilmedi.
- **BUY/HOLD/SELL tavsiyesi yok** — Minimum tez "veri eksik → izle" şeklinde bile olsa üretilmeliydi. "Sentez yapılamadı" başlığıyla boş bırakmak kabul edilemez.
- **BUY/SELL trigger listesi yok** — Minimum 3 BUY + 3 SELL trigger ("şu gelişirse → al/sat" formatı) üretilmedi.
- **Bull/Baz/Bear full quantification (Revenue/EBITDA/EPS/FCF/TP) üretilmedi** — Sadece sözlü senaryo tanımlamaları var; sayısal tablo yok.
- **Operasyonel sinyaller (CEO değişimi, İran rotaları, Brent hareketi) senteze entegre edilmedi** — Mevcut verilerle bile bu sinyallerden senaryo ağırlığı üretilebilirdi.
- **convergence_score 0.38 upstream-bağımlı ama sentez tamamen bekleme modunda** — Kısmi upstream ile minimum sentez zorunlu; "sıfır çıktı" kabul edilemez.

### Bundan Sonra:
- **Veri eksikliğinde minimum sentez zorunlu (4. direktif — kesinleşti):** EBITDA null olsa bile: (1) Revenue trend + OCF bazlı kaba değerleme aralığı, (2) Risk listesi, (3) "Veri kalitesi düşük, hedef fiyat geçici" notu. Hiçbir çıktı üretmemek kabul edilemez.
- **SWOT tablosu = her THYAO analizinin zorunlu formatı (artık memory hard-coded):** 4 boyut × minimum 4 satır kanıt destekli. Gömülü metin değil, tablo formatı.
- **THYAO Goldman yapısı (her standard analizde uygulanacak):**
  - S.1: Yatırım tezi (1 paragraf) + hedef fiyat tablosu (Bear/Baz/Bull + ağırlıklı)
  - S.2-3: 3 yatırım sütunu (her biri: kanıt + sayı + zaman ufku)
  - S.4-5: 3 sayısallaştırılmış risk (her biri: olasılık % + EBITDA etkisi + tetikleyici)
- **BUY/SELL trigger 3+3 formatı (THYAO sabit senaryolar):**
  - BUY: İran rotaları H2'de açılırsa + Brent <$80 + yeni CEO güven verirse → TP 280→350 TL
  - SELL: İran krizi genişlerse + Brent >$100 + CEO strateji kırılması → TP <200 TL
- **THYAO Bull/Baz/Bear (v4 sonrası sabit referans — değiştirilemez):**
  - Bull: İran rotaları açılır + Brent <$75 + yeni CEO güven verir → TP 320-360 TL
  - Baz: Rotalar H2 kısmen açılır + Brent $75-90 + CEO geçiş 1-2 çeyrek → TP 240-280 TL
  - Bear: İran krizi genişler + Brent >$100 + strateji kırılması → TP 160-190 TL

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
