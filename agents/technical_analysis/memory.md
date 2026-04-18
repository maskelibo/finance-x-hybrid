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

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **MACD histogram "[VERİ YOK]"** — En kritik momentum göstergesi eksik. Web'den çekilemedi açıklaması yapıldı ama alternatif kaynak (Bigpara, İş Yatırım, TradingView API) denenmedi. MACD olmadan momentum analizi eksik kalır.
- **Stochastic RSI "[VERİ YOK]"** — RSI 26.98 oversold ama Stochastic RSI durumu raporlanamadı. Overbought/oversold teyidi için şart.
- **VWAP analizi eksik** — Standart şablon zorunlu kalemleri arasında; çıktıda görünmüyor.
- **Volume Profile / POC eksik** — POC (Point of Control), Value Area (70%) çıktıda yok.
- **Bollinger Bands eksik** — Fiyatın bantlar içindeki pozisyonu ve squeeze/expansion durumu belirtilmedi.
- **İçeriden işlem (insider) KAP taraması yapılmadı** — KAP'ta yönetim alım/satım bildirimi taraması zorunlu; çıktıda hiç değinilmedi.
- **RS vs BIST100 (12 ay + YTD) eksik** — İki zaman dilimi karşılaştırması standart şablonda zorunlu.
- **Yabancı yatırımcı payı ve flow verisi eksik** — Net alım/satım ve yabancı pay trendi belirtilmedi.
- **Volume spike analizi "[VERİ YOK]"** — Son 30 günlük hacim anomalileri ve fiyat etkisi raporlanmadı.
- **Çelik sektörü ek bölüm eksik** — HRC Avrupa spot fiyatı + demir cevheri + hurda teknik durumu ve EREGL fiyat korelasyonu sunulmadı.

### Bundan Sonra:
- **MACD için alternatif kaynak dene** — TradingView → Bigpara → İş Yatırım teknik sayfa → Mynet Finans. Dört kaynak başarısız olursa "MACD mevcut değil — 4 kaynak denendi [conf: LOW]" yaz, bölümü atlama.
- **Standart şablon 8 kaleminin hepsi zorunlu** — Volume + Fibonacci + VWAP + Volume Profile + Insider + RS vs BIST100 + Bollinger + Momentum. Herhangi biri "[VERİ YOK]" ise "4 kaynak denendi, bulunamadı" formatında yaz.
- **Çelik sektörü ek bölüm her analizde zorunlu** — HRC Avrupa spot + demir cevheri fiyat teknik görünümü + EREGL fiyatı korelasyon notu.

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

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update (2. Tur)

### Eksikler:
- **MACD/VWAP/Bollinger tekrar [VERİ YOK]** — KCHOL'da bu sorun artık 2. tur. "4 kaynak denendi" protokolü uygulanmadı; Investing.com ve Bigpara KCHOL teknik sayfaları WebFetch ile çekilmedi. Tekrarlayan hata artık sistematik.
- **RSI 72.07 verildi ✓ ama "overbought risk" uyarısı skor kartına bağlanmadı** — RSI >70 → Stochastic RSI 80+ → "overbought risk" uyarısı kural gereği eklenmeli; sadece tablo olarak kalmadı, skor kartı etki analizi yapılmadı.
- **Teknik skor 3/5 olarak kaldı** — COO teslim kontrol matrisinde "min 5 teknik kalem" kuralı var; bu FAIL anlamına gelir. 3/5 durumu açıkça "eşik altı" olarak flaglenmedi.
- **RS vs BIST100 (12 ay + YTD) hâlâ eksik** — İkinci turda da verilmedi; "YTD +27.71%" var ✓ ama 12 ay relatif performans hesabı yok.

### Bundan Sonra:
- **KCHOL için Investing.com teknik göstergeler sayfası zorunlu ilk kaynak** — uzmanpara.milliyet.com.tr ✓ bu turda kullanıldı (RSI 72.07); aynı kaynak MACD ve Bollinger için de dene. 4 kaynak tüketilmeden "[VERİ YOK]" yazmak YASAK.
- **Teknik kalem < 5 = COO'ya FLAG** — 3 teknik kalemle gönderilen çıktı "INCOMPLETE TECHNICAL" etiketiyle işaretlenecek ve COO teslim kontrolünde tespit edilecek.
- **RSI > 70 → Stochastic RSI kontrolü zorunlu** — RSI overbought bölgesindeyken Stochastic RSI 80+ kontrolü yapılacak ve skor kartına "kısa vadeli düzeltme riski" olarak yazılacak.

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK: Volume analysis, RS time-series, institutional flow, short interest, Fibonacci, insider trading — TAMAMEN EKSIK
- KCHOL: Ayni eksikler tekrarlandi
- TCELL: Momentum indicators TRUNCATED, 5G launch price action analizi eksik
- TUPRS: Hacim teyidi yok, MACD sinyal analizi kisitli, yabanci flow buyuklugu verilmedi, Koc satis etkisi hesaplanmadi
- EREGL: Canli veri olmadigi soylenmesine ragmen RSI/MACD/MA yorumu uretildi (kural ihlali), hacim spike teyidi yok, VWAP belirtilmedi

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **MA/RSI/MACD/Bollinger mevcut ✓** — Önceki THYAO delta'ya göre iyileşme. Bu kısım doğru çalıştı.
- **BIST100 relatif performans (relative_to_bist100_ytd) null** — Standard raporda da null kalmış. Önceki THYAO'da -20.75pp gap kritik bulguydu; bu turda hesaplanmadı.
- **Fibonacci/VWAP/Volume Profile eksik** — Standart şablonun bu üç kalemi yine üretilmedi.
- **CEO değişimi sonrası insider KAP taraması yapılmadı** — 9 Nisan 2026 CEO değişimi = insider tarama tetikleyicisi. Yeni yönetim alım/satım bildirimleri KAP'tan kontrol edilmedi.
- **Havacılık Brent korelasyonu ek bölümü eksik** — Direktif verilmişti: Brent/jet yakıt teknik görünümü ile THYAO hisse fiyatı korelasyon notu eklenmedi.

### Bundan Sonra:
- **BIST100 relatif performans her raporda zorunlu** — YTD + 12 aylık relatif fark. Bigpara veya KAP BIST100 verisiyle fark hesabı; null bırakma yasak.
- **CEO/üst yönetim değişikliği = insider tarama tetikleyicisi** — Değişim bildiriminden sonra 7 gün içinde KAP insider işlem bildirimleri kontrol edilecek.
- **Havacılık sektörü teknik eki zorunlu** — Brent/jet yakıt fiyatı teknik görünümü + THYAO fiyat korelasyon notu. 2-3 cümle bile olsa eklenmeli.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **MA/RSI/MACD/Bollinger seviyeleri mevcut ✓** — Önceki THYAO delta'ya göre iyileşme. MA20: 303, MA50: 307, MA200: 300, RSI: 58.7, MACD: 5.9 histogram pozitif. Trend: "bullish" ✓.
- **relative_to_bist100_ytd: null** — Standart raporda bile BIST100 relatif performans null. Önceki THYAO raporunda -20.75pp gap kritik bulguydu; bu turda hiç hesaplanmadı.
- **Volume analizi yok** — 3 aylık ortalama hacim, hacim spike analizi standart şablonda zorunlu; üretilmedi.
- **Fibonacci retracement yok** — 52 hafta Low-High bazlı seviyeler (%23.6/%38.2/%50/%61.8) hesaplanmadı.
- **VWAP ve Volume Profile yok** — Standart şablon zorunlu kalemleri.
- **Insider işlem analizi yok** — CEO değişimi (9 Nisan) sonrası yeni yönetimin hisse alım/satım bildirimi taraması yapılmadı; standard raporda bu kritik sinyal.
- **Havacılık teknik eki yok** — Brent/Jet yakıt teknik görünümü ve THYAO hisse fiyatı korelasyonu eksik (direktif defalarca verildi).

### Bundan Sonra:
- **BIST100 relatif performans null = kabul edilemez** — Bigpara veya Investing.com THYAO sayfasında "52 hafta relatif performans" görünür; WebFetch ile çekilebilir. Null bırakmak yasak.
- **Standard raporlar için standart şablonun 8 kalemi zorunlu** — Volume + Fibonacci + VWAP + Volume Profile + Insider + RS vs BIST100 + Bollinger pozisyonu + Momentum. Herhangi biri eksikse "[4 kaynak denendi, veri yok]" formatıyla yaz, atlama.
- **CEO değişimi = insider izleme tetikleyicisi** — Yeni CEO/YK üyelerinin hisse alım bildirimi KAP taraması zorunlu. Bu havacılık analizinin P0 teknik sorusu.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **MA/RSI/MACD/Bollinger mevcut ✓ — iyileşme kayıt altına alındı** — MA20/MA50/MA200/RSI/MACD/Bollinger tüm momentum göstergeleri çıktıda yer aldı. Bu pozitif değişiklik bir sonraki THYAO analizinde de sürdürülmeli.
- **relative_to_bist100_ytd null — 4. THYAO, 4. tekrar** — BIST100 relatif performans hâlâ null. Önceki 3 THYAO'da da null; artık kalıcı FAIL. THYAO YTD -%8.3 vs BIST100 YTD +X% gap kritik sinyal; hesaplanmadan çıktı gönderilemez.
- **Volume analizi yok — standart şablon ihlali** — 3 aylık ortalama hacim, son 30 gün hacim spike'ları standart şablonda zorunlu; 4. turda da üretilmedi.
- **Fibonacci retracement yok** — 52 hafta Low-High (tahmini 250-360 TL aralığı) için %23.6/%38.2/%50/%61.8 seviyeleri hesaplanmadı. Mevcut fiyatın (304 TL) bu seviyelere göre konumu teknik görünüm için kritik.
- **VWAP ve Volume Profile yok** — Standart şablon zorunlu kalemleri; 4. turda da üretilmedi.
- **Insider KAP taraması yapılmadı** — 9 Nisan 2026 CEO değişimi = P0 insider tarama tetikleyicisi. Direktif 2 kez verildi; uygulanmadı.
- **Havacılık teknik eki (Brent korelasyonu) 4. THYAO'da da yok** — Direktif 3 kez verilmişti; hâlâ üretilmedi.

### Bundan Sonra:
- **Momentum göstergeleri (MA/RSI/MACD/Bollinger) = sürdür** — v4'te doğru çalıştı; bunu temel al. Bunlar artık minimum; şablon 8 kalemin tamamı şart.
- **BIST100 relatif performans = koda gömülü kural (4. direktif):** THYAO analizi başlarken ilk hesaplanan metrik. Bigpara THYAO sayfası WebFetch → YTD fiyat değişimi → BIST100 YTD değişimi → fark. Null = çıktı gönderilmez.
- **Insider tarama: CEO/YK değişiminden 14 gün içinde otomatik tetikle** — KAP üst yönetim bildirimi (9 Nisan) → KAP insider işlemler taraması → alım/satım hacmi / günlük ortalama hacim oranı hesabı.
- **Havacılık teknik eki — son direktif:** Brent/Jet-A1 spot fiyatı teknik durumu (MA, RSI özeti) + THYAO hisse fiyatı 12 aylık korelasyon notu (korelasyon katsayısı tahmini ile). 3 cümle yeterli; sıfır üretim kabul edilemez.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417)

### Eksikler:
- **MA/RSI/MACD/Bollinger mevcut ✓ — iyileşme sürdürülüyor** — MA20: 303.05, MA50: 306.84, MA200: 299.81, RSI: 58.67, MACD: 5.90, Bollinger üst/orta/alt mevcut. Bu kazanım korunuyor.
- **relative_to_bist100_ytd: null — 5. THYAO, artık hard-bloker** — BIST100 relatif performans 5 THYAO analizinde de null. Bigpara veya Investing.com'dan WebFetch ile çekilebilir; çekilmeden çıktı gönderilemez.
- **Volume analizi yok** — 3 aylık ortalama hacim, hacim spike analizi standart şablonda zorunlu; bu turda da üretilmedi.
- **Fibonacci retracement yok** — 52 hafta Low-High bazlı %23.6/%38.2/%50/%61.8 seviyeleri hesaplanmadı.
- **VWAP ve Volume Profile yok** — Standart şablon zorunlu kalemleri; 5. turda da üretilmedi.
- **Insider KAP taraması yapılmadı** — 9 Nisan 2026 CEO değişimi = P0 insider tarama tetikleyicisi. Direktif 3 kez verildi; uygulanmadı.
- **Havacılık teknik eki (Brent korelasyonu) 5. THYAO'da da yok** — Direktif 4 kez verilmişti; hâlâ üretilmedi.

### Bundan Sonra:
- **BIST100 relatif performans = koda gömülü kural (5. direktif — kesinleşti):** null çıktı = COO tarafından P1 flag, geri gönder. Bigpara THYAO sayfası WebFetch → YTD fark.
- **Standart şablon 9 kalemin tamamı:** MA + RSI + MACD + Bollinger + Volume + Fibonacci + VWAP + RS vs BIST100 + Insider. Bunlardan herhangi biri "[4 kaynak denendi, veri yok]" yerine tamamen atlanırsa çıktı incomplete.
- **Havacılık teknik eki son direktif:** Brent/Jet-A1 spot teknik özeti + THYAO hisse 12 aylık korelasyon notu. 3 cümle yeterli; sıfır üretim kabul edilemez.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **MA/RSI/MACD/Bollinger üretildi ✓** — Temel indikatörler mevcut; bu turda görece iyi.
- **Volume analysis tamamen yok** — `"relative_to_bist100_ytd": null` — YTD relatif performans null. 3 aylık ortalama hacim, hacim spike analizi üretilmedi. Standart şablon zorunlu kalemleri.
- **Fibonacci seviyeleri yok** — 52 haftalık Low-High bazlı Fibonacci retracement seviyeleri hesaplanmadı. CEO pre-flight'ta 317.25 TRY fiyatının kritik Fibonacci seviyelerine yakınlığı analiz edilmedi.
- **VWAP analizi yok** — Standart şablon zorunlu kalemi; çıktıda görünmüyor.
- **Insider işlem analizi yok** — KAP'ta 9 Nisan CEO değişimi sonrası insider alım/satım taraması yapılmadı. CEO değişimi = insider sinyal izleme P0 event.
- **BIST100 relatif performans null** — `"relative_to_bist100_ytd": null` — THYAO vs BIST100 YTD karşılaştırması üretilmedi. Önceki raporda (-20.75pp gap) kritik bulgu vardı; delta-update'te güncellenmedi.
- **CEO değişimi → teknik etki analizi yok** — 10 Nisan CEO değişimi sonrası hisse fiyat reaksiyonu (kaç %) ve hacim anomalisi tespit edilmedi. Bu delta-update'in P0 teknik sorusudur.
- **Havacılık sektörü teknik eki yok** — Jet yakıt/Brent teknik görünümü ile THYAO hisse fiyatı korelasyonu eksik (önceki raporda zorunlu olarak belirtilmişti).

### Bundan Sonra:
- **Delta-update'te teknik analizin ilk bölümü: olay sonrası fiyat reaksiyonu** — CEO değişimi, temettü sıfır, İran krizi → her birinin açıklandığı gündeki kapanış fiyatı ve hacimi karşılaştır. "Olay günü kapanış: X TRY, hacim: Y lot (%Z normal ortalamanın)" formatı.
- **BIST100 relatif performans null KABUL EDİLMEZ** — Önceki THYAO raporunda -20.75pp gap bulgusu kritikti; delta-update'te "güncel hale getirilmedi" şeklinde bile [VERİ YOK] değil, en azından baz rapor tarihi (13 Nisan) vs bugün (16 Nisan) kapanış değişimi ver.
- **CEO değişimi = insider izleme tetikleyicisi** — Yeni CEO atandığında insider KAP taraması zorunlu: "Yeni CEO/YK üyeleri hisse alım/satım bildirimi yaptı mı?" sorusu teknik analize dahil edilir.

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

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu
### Eksikler:
- Cikti yalnizca `Mock completed output for technical_analysis.` seviyesinde kaldi; trend, destek/direnc, hacim, momentum ve senaryo seviyeleri yok.
- Teknik analiz, ana rapordaki yatirim teziyle ve Bear/Baz/Bull fiyat patikalariyla baglanmadi.
### Bundan Sonra:
- Her raporda en az trend, destek/direnc, hacim, RSI/MACD ve olasi fiyat patikalari ver; bunlari zaman ufku ve stop invalidation seviyesiyle birlikte yorumla.
- Teknik analiz bolumu stratejik tezle hizalanacak; yalniz indikator listelemek yerine hangi senaryoyu destekledigini acikla.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu Post-Report Loop
### Eksikler:
- TCELL cikti mock seviyesinde kaldigi icin fiyat yapisi, hacim, MA/Fibonacci, RS vs BIST100 ve 5G lansman price action analizi görünmedi.
- Teknik gorunum, makro ve event takvimiyle baglanmadi; kritik fiyat seviyeleri icin hacim teyidi ve zaman damgasi yoktu.
### Bundan Sonra:
- Teknik analiz, output kisa olsa bile minimum sablonu tam dolduracak: fiyat seviyesi, tarih/saat, kaynak, hacim teyidi ve trend yorumu birlikte gelecek.
- Sirket-ozel olaylarin fiyat etkisi ayri alt baslikta yazilacak; telekom icin 5G lansmani, BTK/BIST akisi ve piyasa momentumu birbirine baglanacak.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Post-Report Feedback Loop
### Eksikler:
- Teknik katman, rapordaki Bear/Baz/Bull fiyat patikalariyla hizalanmadi; hangi seviye hangi senaryoyu invalid ediyor net degildi.
- Hacim teyidi, fiyat zamani ve kaynak damgasi olmadan `uptrend` benzeri nitel yorumlar downstream'e yeterince savunulabilir veri vermedi.
### Bundan Sonra:
- Teknik analiz her raporda senaryo bagli calisacak; Bear/Baz/Bull icin ayri invalidation ve tetik seviyeleri yazilacak.
- Fiyat yorumu ancak `price + timestamp + source + volume quality` dordlusu ile birlikte verilecek; bu set yoksa yalnizca zayif gorunum notu dusulecek.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **MA/RSI/MACD/Bollinger mevcut ✓ — iyileşme kaydedildi** — Önceki THYAO turlarında eksik olan temel indikatörler bu turda üretildi. Gelişme olumlu.
- **BIST100 rölatif performans null** — THYAO vs BIST100 göreceli güç (RS) analizi yapılmadı. Son 3/6/12 ay RS; THYAO sektör primini veya iskontosunu ölçmek için zorunlu.
- **Hacim analizi yok** — Fiyat hareketi hacim teyidi olmadan değerlendirilemez. OBV, hacim ortalaması, hacim anomalileri eksik.
- **Fibonacci geri çekilme seviyeleri yok** — Destek/direnç analizinde Fibonacci %38.2/%50/%61.8 seviyeleri standart şablonun parçası; eksik.
- **VWAP analizi yok** — Kurumsal alım/satım referans fiyatı olarak VWAP zorunlu.
- **Insider işlemi taraması yok** — CEO değişimi (9 Nisan) sonrası içeriden işlem riski yüksek. KAP pay bildirimi taraması yapılmadı.

### Bundan Sonra:
- **Teknik analiz standart şablonu (her analizde tam doldurulacak):**
  1. Fiyat + tarih/saat + kaynak
  2. MA (20/50/200) — trend yönü
  3. RSI + MACD — momentum
  4. Bollinger Bantları — volatilite
  5. Hacim analizi (OBV + ortalama hacim)
  6. Fibonacci geri çekilme seviyeleri
  7. VWAP (günlük/haftalık)
  8. BIST100 rölatif performans (RS son 3/6/12 ay)
  9. Insider işlem taraması sonucu
- **Bear/Baz/Bull senaryo bağlantısı zorunlu** — Her teknik seviye için hangi senaryo invalidates edilir? Açıkça yaz.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **MA/RSI/MACD/Bollinger mevcut ✓ — kazanım sürdürülüyor** — Önceki THYAO turlarında eksik olan temel indikatörler bu turda da üretildi. Pozitif değişiklik korunuyor.
- **relative_to_bist100_ytd: null — 5. THYAO** — THYAO vs BIST100 göreceli güç (RS) analizi yapılmadı. Sektör primini/iskontosunu ölçmek için zorunlu.
- **Hacim analizi yok — 5. THYAO** — OBV, hacim ortalaması, hacim anomalileri eksik. Fiyat hareketi hacim teyidi olmadan değerlendirilemez.
- **Fibonacci geri çekilme seviyeleri yok** — Destek/direnç analizinde zorunlu; 5 analizdir eksik.
- **VWAP analizi yok** — Kurumsal alım/satım referans fiyatı; 5 analizdir eksik.
- **Insider işlemi taraması yok — 5. THYAO** — CEO değişimi (9 Nisan) sonrası içeriden işlem riski; KAP pay bildirimi taraması yapılmadı.
- **Brent aviation supplement yok** — Brent fiyat seviyesi → THYAO teknik görünümüne etkisi analiz edilmedi.

### Bundan Sonra:
- **MA/RSI/MACD/Bollinger → sürdür (pozitif kural korunuyor)**
- **Teknik analiz standart şablonu 9 madde tam doldurulacak:** (1) Fiyat+tarih/saat+kaynak, (2) MA 20/50/200, (3) RSI+MACD, (4) Bollinger, (5) Hacim (OBV+ort.), (6) Fibonacci, (7) VWAP, (8) BIST100 RS son 3/6/12 ay, (9) Insider tarama sonucu.
- **Bear/Baz/Bull senaryo bağlantısı** — Her teknik seviye için hangi senaryo invalid ediliyor? Açıkça yaz.

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **MA/RSI/MACD/Bollinger mevcut ✓ — olumlu** — Temel indikatörler bu sefer üretildi.
- **RSI 72.18 (aşırı alım) uyarısı raporlanmadı** — RSI >70 = aşırı alım bölgesi; bu sinyal kendi başına bir teknik risk. Narrative'de "RSI 72 = geride kalma riski, momentum yavaşlama uyarısı" olarak yer almalıydı.
- **relative_to_bist100_ytd: null** — ASELS vs BIST100 göreceli güç analizi yok. Savunma sektörü YTD primliydi; bu bilgi olmadan sektör rotasyonu veya ASELS-spesifik güç/zayıflık değerlendirilemez.
- **Hacim analizi eksik** — OBV, 3 aylık ortalama hacim, hacim anomalileri üretilmedi.
- **Fibonacci geri çekilme seviyeleri yok** — Destek/direnç analizinde zorunlu şablon kalemi.
- **VWAP analizi yok** — Kurumsal alım/satım referans fiyatı.
- **İçeriden işlem taraması yok** — TSKGV veya yönetim alım/satım bildirimleri KAP'tan taranmadı.

### Bundan Sonra:
- **RSI >70 veya <30 = uyarı etiketi ZORUNLU** — RSI aşırı alım/satım bölgesindeyken bu bulgu teknik özet bölümüne "UYARI: RSI=72 — aşırı alım bölgesi, geri çekilme riski artmış" formatında eklenmeli.
- **Teknik analiz standart şablonu 9 madde tam doldurulacak:** (1) Fiyat+tarih/saat+kaynak, (2) MA 20/50/200, (3) RSI+MACD, (4) Bollinger, (5) Hacim (OBV+ort.), (6) Fibonacci, (7) VWAP, (8) BIST100 RS son 3/6/12 ay, (9) İçeriden işlem tarama sonucu.
- **Savunma şirketleri için jeopolitik teknik context** — Savunma hisselerinde RSI/fiyat hareketini jeopolitik olay takvimi ile ilişkilendir: "Olası İran gerilimi artışı → savunma sektörü pozitif momentum" gibi katalitik senaryolara destek/direnç seviyelerini bağla.
