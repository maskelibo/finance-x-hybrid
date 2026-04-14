# Technical Analysis Agent — Bilgi Bankası (Katman 2)

> Bu dosya gece eğitimlerinden damıtılmış domain bilgisi içerir.
> Normal görevde ihtiyaç duyduğunda `Read` ile aç.
> Gece eğitiminde güncellenir.

---

## 1. İndikatör Parametreleri ve Sinyal Kuralları

### MACD
- MACD Line = 12 EMA − 26 EMA
- Signal Line = MACD'nin 9 periyod EMA'sı
- Histogram = MACD − Signal
- MACD sinyal çizgisini yukarı keserse AL sinyali, aşağı keserse SAT sinyali
- Histogram sıfır çizgisine yaklaşma yönü net yazılmalı — belirsiz ifade yasak

### RSI (Relative Strength Index)
- 14 periyot standart
- >70: Aşırı alım | <30: Aşırı satım | 50-60: Nötr, devam potansiyeli
- MACD ile birlikte kullanımda sinyal doğruluğu artar

### Stochastic RSI
- 80+ = overbought risk uyarısı ekle
- Extreme overbought (>95) → yaklaşan satış baskısı ön sinyali
- EREGL pattern: StochRSI 97.674 → -13.6% düşüş (doğrulanmış)

### Hareketli Ortalamalar (MA)
- Kısa vade: 5, 10, 12, 20, 26 EMA
- Uzun vade: 50, 100, 200 EMA
- Fiyat > 20MA > 50MA = klasik boğa sıralaması
- Golden Cross: 50 EMA'nın 200 EMA'yı yukarı kesmesi = güçlü yükseliş
- Death Cross: 50 EMA'nın 200 EMA'yı aşağı kesmesi = güçlü düşüş

### MA Kümelenmesi (Convergence)
- MA-5/10/20/50/100/200 dar bantta yakınsama → "fair value zone" veya karar eşiği
- Bollinger Squeeze ile birlikte → kırılım yaklaşıyor sinyali
- Kümelenme direnç oluşturur: aşılırsa momentum hızlanır, aşılamazsa double-top riski

### Bollinger Bands
- BB seviyeleri Investing.com'dan direkt alınamayabilir → ATR + MA-20 ile tahmin → Low confidence
- Alt Bollinger Bandına yakın fiyat + sert düşüş = "walking the lower band" riski
- Bearish trendde alt band satış, boğa trendde dip fırsatı

---

## 2. Fibonacci Retracement

- Hesaplama: Level = Low + (High − Low) × Fibonacci %
- Standart seviyeler: %0, %23.6, %38.2, %50, %61.8, %100
- **%38.2–%50 zonu** en kritik karar noktası — bullish/bearish senaryonun pivot noktası
- TradingView'dan otomatik hesaplanabilir
- %23.6 test edilip tutunursa → bullish yapısal sinyal

---

## 3. Hacim (Volume) Analizi

### Temel Kurallar
- Her fiyat seviyesi (destek, direnç, kırılım) için hacim teyidi zorunlu
- Kırılım sırasında hacim ortalamanın üstünde olmalı — düşük hacimli kırılımlar güvenilir değil
- Format: "X TL desteği Y lot hacimle tutuldu"

### VWAP (Volume-Weighted Average Price)
- Institutional benchmark — execution quality ölçütü
- Fiyat VWAP üstünde = bullish, altında = bearish

### Smart Money Flow Index (SMFI)
- Institutional activity takibi — accumulation / distribution tespiti
- RSI/MACD'ye ek katman olarak kullanılır

### Point of Control (POC) & Value Area
- POC: Highest accumulated volume'lü fiyat — price magnet
- Value Area (%70): Toplam hacmin %70'ini içeren aralık = "fair value" tanımlar
- POC ve Value Area destek/direnç analizine ek katman

### Cumulative Volume Delta (CVD)
- Tick-level directional volume — institutional positioning'i fiyat öncesinde gösterir
- Volume profile + delta divergence + order flow = güçlü sinyal

---

## 4. BIST-Spesifik Pattern'lar

### Insider Trading Analizi
- KAP "İçeriden Öğrenenler Listesi" + "Pay Alım/Satım Bildirimi" son 90 gün kontrol
- Net insider buying + bullish technicals = çok güçlü sinyal
- Insider işlem etkisi: satış miktarı / ortalama günlük hacim → <%5 NÖTR, %5-10 ORTA, >%10 YÜKSEK
- OYAK gibi yapılar: kişisel insider bildirimi KAP'ta görünmeyebilir → kurumsal sahiplik değişimi izle

### Relative Strength (RS)
- RS = (Hisse fiyatı / BIST100) × 100
- RS yükseliyorsa hisse piyasayı geçiyor
- HER İKİ zaman dilimini raporla (12 aylık + YTD) — tek zaman dilimi yanıltıcı
- Sektör döngüsü: Çelik hisseleri faiz normalleşme döneminde BIST finansallara göre geride kalabilir

### Kurumsal Yerleştirme Seviyesi
- Ana hissedar blok satışları "taban seviyesi" oluşturabilir
- Yerleştirme fiyatı teknik destek referansı olarak kullanılır (ör: TUPRS 233 TL Koç yerleştirmesi)

---

## 5. Sektöre Özel Teknik Şablon Ekleri

### Rafineri / Enerji
- Brent crude ile korelasyon çok yüksek — her ikisinin teknik durumu paralel kontrol
- Brent teknik analizi standart şablona dahil

### Çelik / Emtia
- HRC (Hot Rolled Coil) Avrupa spot fiyatı, demir cevheri, hurda fiyatı trendi
- Çin çelik ihracatı yönü
- Trump tarife etkisi (Positive/Negative/Neutral)

---

## 6. Güvenilir Veri Kaynakları

| Kaynak | Kullanım | Güvenilirlik |
|--------|----------|-------------|
| KAP | Insider bildirimler, resmi açıklamalar | EN YÜKSEK |
| Investing.com | RSI, MACD, teknik özet sinyalleri | YÜKSEK |
| TradingView | Fiyat grafikleri, performans metrikleri | YÜKSEK |
| Mynet Finans | Türkçe teknik analiz, destek/direnç | ORTA |
| Hisse.net | Hacim analizi, günlük yorumlar | ORTA |
| MKK / TCMB | Yabancı yatırımcı pay değişimi | YÜKSEK |

---

## 7. Güven Seviyesi Kuralı

- Teknik analiz güven seviyesi asla HIGH değil — maksimum MEDIUM
- Çoklu fiyat tutarsızlığı varsa: upstream pipeline referansı = PRIMARY, son BIST kapanışı = SECONDARY
- Higher Lows pattern: Her düşüş önceki dipten daha yüksekte → yükseliş trendi sağlam

---
