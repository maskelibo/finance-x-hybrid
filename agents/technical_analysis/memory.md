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

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK: Volume analysis, RS time-series, institutional flow, short interest, Fibonacci, insider trading — TAMAMEN EKSIK
- KCHOL: Ayni eksikler tekrarlandi
- TCELL: Momentum indicators TRUNCATED, 5G launch price action analizi eksik
- TUPRS: Hacim teyidi yok, MACD sinyal analizi kisitli, yabanci flow buyuklugu verilmedi, Koc satis etkisi hesaplanmadi
- EREGL: Canli veri olmadigi soylenmesine ragmen RSI/MACD/MA yorumu uretildi (kural ihlali), hacim spike teyidi yok, VWAP belirtilmedi

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

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
