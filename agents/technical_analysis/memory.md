# Technical Analysis Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **Standart rapor sablonunu TAM UYGULA:** Volume + Fibonacci + Insider + RS time-series + VWAP + Bollinger — HER raporda ZORUNLU. Eksik bolum birakma.
- **Guven seviyesi asla HIGH degil:** Teknik analiz protokolu geregi maksimum MEDIUM.
- **Canli piyasa verisi yoksa teknik indikator hesaplama YAPMA;** yalniz dogrulanmis fiyat seviyelerini raporla.
- **Memory veya onceki rapor hicbir zaman birincil piyasa kaynagi olamaz.**
- **Her fiyat seviyesi icin: tarih, saat, veri kaynagi ve kapanis/gun ici ayrimi ver.**
- **Hacim teyidi olmadan mum formasyonu uzerinden reversal karari verme.**
- **Hacim teyidi zorunlu:** Her fiyat seviyesi (destek, direnc, kirilim) icin hacim verisi ekle. "X TL destegi tutuldu" -> "X TL destegi Y lot hacimle tutuldu" formati.
- **MACD histogram bulgusu net yazilacak:** "Pozitif bolgede" veya "negatif bolgede, sifir cizgisine yaklasiyor" — belirsiz ifade YASAK.
- **Yabanci flow buyukluk:** Net alim/satim miktari (en az "gunluk ortalama hacmin %X'i") verilmeli.
- **Insider islem teknik analizi:** Satis miktari / ortalama gunluk hacim. <%5 NOTR, %5-10 ORTA, >%10 YUKSEK etkili.
- **Coklu fiyat tutarsizligi:** Upstream pipeline = PRIMARY, son BIST seansi kapanisi = SECONDARY. Her ikisini belirt.

## Zorunlu Kontrol Listesi

**Standart Rapor Sablonu (her analizde doldurulmali):**
```
Volume Analysis:
- 3-month avg: X M adet/gun | Current vs avg: +/- W% | Recent spikes: [Tarih] -> outcome

Fibonacci Retracement (52-week Low-High):
- 0%/23.6%/38.2%/50%/61.8%/100% seviyeleri | Current price position

VWAP Analysis:
- Price vs VWAP: [Above/Below] by X% | Trend: [Rising/Falling/Flat]

Volume Profile:
- POC: X TL | Value Area (70%): Y-Z TL | Price position: [Inside/Outside]

Insider/Institutional:
- KAP net insider: Buy/Sell/Neutral | Yabanci yatrimci payi: [Trend]

RS vs BIST100: [Outperforming/Underperforming] — 12 ay VE YTD iki zaman dilimi

Bollinger Bands:
- Current position vs bands | Squeeze/expansion durumu
```

**Enerji sektoru ek:** Brent/WTI teknik durumu bolumu ekle
**Celik sektoru ek:** HRC Avrupa spot fiyati + demir cevheri + hurda + Cin ihracat + tarife etkisi
**Stochastic RSI 80+ ise** "overbought risk" uyarisi ekle

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Volume analysis eksik** — Hacim verisi sağlanamadığı için 3 aylık ortalama hacim ve hacim spike analizi yok. Kurala göre hacim teyidi olmadan destek/direnç seviyeleri "tutuldu" denilemez.
- **Fibonacci retracement gösterilmedi** — 52 hafta Low-High aralığında Fibonacci seviyeleri (%23.6, %38.2, %50, %61.8) hesaplanıp mevcut fiyat pozisyonu belirtilmedi.
- **VWAP analizi eksik** — Fiyat vs VWAP karşılaştırması, trend yönü raporlanmadı.
- **Bollinger Bands eksik** — Fiyatın bantlar içindeki/dışındaki pozisyonu ve squeeze/expansion durumu belirtilmedi.
- **Insider işlem analizi eksik** — KAP'tan insider alım/satım verisi çekilmedi; Şubat 2026 hisse geri alımı (85.9M TRY, KAP 1561611) teknik analize dahil edilmedi.
- **Yabancı yatırımcı flow verisi eksik** — Net alım/satım miktarı (günlük ortalama hacmin %X'i) verilmedi.
- **RSI 68.53 → "Near Overbought"** — Stochastic RSI 80+ durumu için "overbought risk" uyarısı eklenmeliydi (kurala göre).

### Bundan Sonra:
- **Standart şablonu eksiksiz uygula** — Volume + Fibonacci + VWAP + Bollinger + Insider + RS vs BIST100 + Volume Profile — hepsi mevcut olmadan output gönderme. Hacim verisi yoksa "veri yok — confidence LOW" yaz, bölümü atlama.
- **Hisse geri alım bildirimleri teknik analize dahil et** — KAP'tan gelen buyback bildirimi (örn. 1561611) destek seviyesi analizi için proxy hacim sinyali verir.
- **200-günlük MA kritik destekte** — 316.25 TRY fiyatı 312.10 MA'ya 4.15 TRY mesafede; bu yapı için "kırılma senaryosu ve sonraki destek" hesabı zorunlu (hesaplandı ✓ ama Fibonacci ile konfirme edilmedi).
- **Havacılık sektörü teknik eki** — Brent/jet yakıt fiyatı teknik görünümü ile hisse fiyatı korelasyonu bölümü ekle.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **MACD verisi 33 gün eski** — Son güncelleme 12 Mart 2026; analiz tarihi 14 Nisan 2026. Bu boşluk flaglendi ✓ ("MACD DOĞRULANMALI") ancak güven LOW-MEDIUM'a düştü. Hisse 740 TRY seviyesinde; 33 günde trend değişmiş olabilir.
- **Composite score 0.68 — P0 upstream sorunları yansıtıyor** — FAVÖK/IAS29 çelişkisi ve share count belirsizliği teknik analizin bağımsız kalitesini düşürdü; ancak bu upstream sorun, teknik analistin kontrolünde değil. Doğru teşhis yapıldı ✓.
- **Volume analysis eksik/sınırlı** — 3 aylık ortalama hacim, hacim spike analizi ve hacim teyiti yapılamadı (web veri sınırı). "[VERI YOK — conf: LOW]" etiketiyle bölüm açık bırakılmalı.
- **Bollinger Bands gösterilmedi** — Mevcut standart şablonda zorunlu; sıkışma/genişleme durumu belirtilmeli.

### Bundan Sonra:
- **Perakende hissesi teknik eki zorunlu:** Ramazan sezonu fiyat hareketleri, yaz sezonu hacim anomalileri — mevsimselliğin teknik görünüme etkisi analiz edilmeli. BIMAS için Q1 sonuçları açıklanma dönemlerinde (Mayıs, Ağustos, Kasım) hacim spike tespiti.
- **MACD güncelliği her analizde ilk kontrol** — Veri tarihi 14 günden eski ise "MACD STALE — [tarih]" olarak flagle ve güven seviyesi otomatik LOW-MEDIUM. 30+ günse LOW.
- **Insider işlem teknik analizi — buyback etkisi** — BIMAS'ın 7.11M hisse geri alımı (Eylül-Aralık 2025, 528.86 TL ortalama) destek seviyesi için proxy; bu seviye teknik analizde destek zonu olarak işlenmeli.
- **BIMAS teknik referans değerleri (Nisan 2026):** Mevcut fiyat 740 TRY, 52W low/high tahmini ~520/775, buyback ortalama 528.86 TL (güçlü destek), RSI ~65 momentum bölgesi. Gelecek analizlerde baz noktaları.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **100-MA ve 200-MA yok** — Orta ve uzun vadeli trend belirsiz kaldı. Yalnızca 20-MA ve 50-MA ile "kısa vadeli bullish" değerlendirmesi yapıldı; ancak "orta vade belirtilmez" notu eklendi ✓.
- **RSI, MACD, Stochastic RSI hepsi [VERİ YOK]** — TradingView web fetch'ten yüklenmedi. Önceki KCHOL raporları için de aynı sorun; tekrarlayan veri engeli. Alternatif kaynak (Investing.com KCHOL teknik göstergeler sayfası, bigpara.com teknik analiz) denenmedi.
- **Hacim teyidi yok** — Fibonacci pivot zone (204-206 TL), destek/direnç seviyeleri hacim konfirmasyonu olmadan verildi. Destek/direnç için sadece bir tarihten (10 Nis, 5.02B TL) hacim var; 4 günlük trend yok.
- **VWAP, Bollinger Bands, Volume Profile eksik** — Standart şablonun 5 bölümünden 4'ü eksik. Sadece Fibonacci ve MA seviyeleri mevcut.
- **Insider/kurumsal flow analizi yok** — Delta penceresi (10-14 Nisan) için KCHOL insider işlem taraması yapılmadı.
- **RS vs BIST100 eksik** — 12 aylık ve YTD relatif performans verilmedi. KCHOL'un BIST100'e göre outperform/underperform durumu bilinmiyor.

### Bundan Sonra:
- **Standart şablonu "veri yok — conf: LOW" ile doldur** — Her bölüm için: "VWAP: [VERİ YOK — web veri sınırı, conf: N/A]" satırı bile olsa bölümü boş bırakma. Şablonun her satırı var olmalı.
- **Investing.com KCHOL teknik analiz sayfasını dene** — TradingView screenshot çekilemiyorsa Investing.com teknik göstergeler (RSI, MACD, MA özeti) okunabilir HTML formatında sunuluyor; WebFetch ile çekilebilir.
- **Delta-update'de 4 günlük mum analizi** — 10, 11, 12, 13, 14 Nisan kapanış fiyatları ve hacimlerini tablo olarak sun; yön ve momentum bunu gösteriyor. 4 gün için mevcut veri KAP veya Bigpara'dan çekilebilir.

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK: Volume analysis, RS time-series, institutional flow, short interest, Fibonacci, insider trading — TAMAMEN EKSIK
- KCHOL: Ayni eksikler tekrarlandi
- TCELL: Momentum indicators TRUNCATED, 5G launch price action analizi eksik
- TUPRS: Hacim teyidi yok, MACD sinyal analizi kisitli, yabanci flow buyuklugu verilmedi, Koc satis etkisi hesaplanmadi
- EREGL: Canli veri olmadigi soylenmesine ragmen RSI/MACD/MA yorumu uretildi (kural ihlali), hacim spike teyidi yok, VWAP belirtilmedi

## Son 3 Raporun Ogrenimleri

- **THYAO (2026-04-13):** Web search limitation kritik — volume/insider/VWAP datos unavailable public sources'dan. Fib 61.8% (313.05) current price (316.75) ile 1.2% zonda confluence teyit edildi. RSI 68.5 shows momentum near overbought. +4.3% YoY vs BIST-100 +25.05% gap (-20.75pp) fundamental/valuation anomaly sinyal — sector cyclicality (fuel inflation, labor CPI+3%, capacity headwinds). March traffic +16% YoY shows operational momentum, contrasts technical underperformance. Volume verification ZORUNLU breakout confirmation icin. Analyst consensus 12/12 Strong Buy 473 TL target (+74.6% upside) creates asymmetric risk/reward.
- **EREGL (2026-04-13):** Coklu fiyat referansi protokolu gelistirildi (26.06 vs 31.30 vs 27.04). Stochastic RSI 97.674 -> -%13.6 dusus patterni teyit edildi. MA kumelenmesi direnc analizi dogru yorumlandi. Fibonacci %38.2-%50 kritik test zonu tanimlandi.
- **TUPRS (2026-04-12):** Brent korelasyonu kritik. MA kumelenmesi (convergence) "fair value zone" analizi. Fibonacci %23.6 test teyidi. Koc blok satisi 233 TL psikolojik destek seviyesi. Bollinger Band direkt erisilemiyor — ATR+MA20 tahmini low confidence ile not et.
- **TCELL (2026-04-11):** Truncation sorunu — teknik analiz kesildi. 5G "buy rumor sell news" pattern analiz edilmedi.

## Sektor Bilgi Bankasi

**Guvenilirlik sirasi:** KAP > Investing.com > TradingView > Mynet Finans > Diger
**Breakout volume:** Kirilimda hacim ortalamanin ustunde olmali; dusuk hacimli kirilim guvenilir degil
**Higher Lows:** Her dusus onceki dipten yuksekse yukselis trendi saglam
**OYAK insider notu:** Askeri emekli fonu yapisi nedeniyle KAP insider bildirimi beklenmez — kurumsal sahiplik degisimi izlenmeli
**Web Search Veri Siniri (2026 Temmuz Öğrenmesi):** Public web sources (TradingView screenshot, Yahoo Finance, Investing.com) volume/insider/VWAP detail sağlamıyor. Composite data quality score 0.62'ye düşürüyor. **Çözüm:** BIST direct API veya Bloomberg terminal required downstream reconciliation'da. Web search sadece price/MA/RSI summary'ye yeterli — granular technical analysis için institutional data feeds zorunlu.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **Hacim verisi hiç yok** — Tüm destek/direnç seviyeleri hacim teyitsiz. "KRİTİK DESTEK" ve "TUTTU" iddiaları yapılamaz.
- **MACD [VERİ YOK]** — Histogram yönü ve sinyal çizgisi eksik; momentum analizi eksik kaldı.
- **Relative performance tablosu truncated** — "BI" ile kesildi; BIST100 kıyaslama tamamlanmadı.
- **RSI değeri estimate range (62-68) — gerçek değil** — Tahmin verildi ama confidence 0.60; gerçek RSI değeri olmadan "Neutral/weakening" yorumu zayıf.
- **Stochastic RSI tamamen tahmin** — "[EST. <80]" ile geçiştirildi.

### Bundan Sonra:
- **Hacim teyidi olmadan destek seviyesi "tuttu" iddiası YASAK** — (Bu kural önceki memory'de de vardı; SAHOL'da da ihlal edildi.) Hacim veri kaynağı yoksa "Hacim bilinmiyor — seviye güvenilirliği LOW" yaz.
- **MACD ve Stochastic eksik kalırsa "INCOMPLETE" etiketle:** "VERİ YOK" yazmak yerine ne için gerektiğini açıkla ve confidence overall'ı buna göre düşür.
- **Relative performance bölümü truncation YASAK:** Grafik/tablo yarıda bırakılamaz; sonraki mesajda tamamla veya "tablo devam ediyor" notu ekle.
- **Tahmin vs gerçek ayrımı netleştirilecek:** Tüm tahmin değerleri "[TAHMİN]" tag'i taşımalı; gerçek piyasa verisi "[VERİ: kaynak]" formatında belirtilmeli.

---
