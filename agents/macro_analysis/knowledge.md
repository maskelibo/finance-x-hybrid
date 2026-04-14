# Macro Analysis Agent — Bilgi Bankası (Katman 2)

> Bu dosya gece eğitimlerinden damıtılmış domain bilgisi içerir.
> Normal görevde ihtiyaç duyduğunda `Read` ile aç.
> Gece eğitiminde güncellenir.

---

## 1. TCMB Politika Çerçevesi

### Faiz Politikası Dinamikleri
- **Policy Reversal Pattern:** Forward guidance ani kriz durumunda terk edilebilir (ör: %37 → %46 tek seferde)
- **Reel Politika Faizi:** Nominal − CPI. >+5% = çok sıkı
- Nisan 2026: Reel faiz +%15.13 → son 15 yılın en yüksek reel kısıtlaması
- Sonraki MPC toplantısı takip edilmeli — Governör sinyalleri kritik

### Enflasyon Hedefleme
- 2026 enflasyon hedefi: %16 (band %15-21'e genişletildi)
- IAS 29 tetikleyici: Kümülatif 3-yıl enflasyon >%100

### BDDK Düzenlemeleri (2026)
- Minimum CAR: %12 (with capital buffer) — önceki %8'den yükseltilmiş
- Overdraft credit conversion factor: %10 (1 Nisan 2026 yürürlük)
- Consumer lending, mortgage LTV, restructuring kuralları sıkılaştırıldı
- Reserve requirements artışı → funding cost increase → NIM pressure

---

## 2. Kritik Makro Göstergeler ve Formüller

### PPI-CPI Spread
- PPI > CPI → üreticiler maliyeti tüketiciye yansıtamıyor → gross margin compression
- Spread >0.3pp = kırmızı alarm (Mart 2026: +36 bps)
- İzleme: TÜİK aylık yayın

### Reel Kredi Büyümesi
- Formül: Nominal kredi büyümesi − Enflasyon = Reel kredi büyümesi
- Bankacılık sektörü analizi için zorunlu hesap

### FX Transmission Channels
1. Export Revenue (+)
2. Import Cost (−)
3. Balance Sheet FX debt (−)
4. NPL — FX borçlu TRY gelirli müşteriler (−)
- Holdinglerde segment bazında netleştir

### NPL Lagging Indicator
- Faiz artışından 6-12 ay sonra NPL sıçrar
- Cari NPL düşükse (%2.7 gibi) → forward-looking tahmin yap
- %4-5'e yükselme beklentisi normal gecikme

---

## 3. Sektöre Özel Makro Transmission Mekanizmaları

### Bankacılık
1. TCMB faiz → NIM (Net Interest Margin): spread = kredi faizi − mevduat faizi
2. Reserve requirements → fonlama maliyeti → NIM pressure
3. Credit growth limits + macroprudential → reel kredi büyümesi yavaşlar
4. NPL formation risk: faiz artışı + 6-12 ay gecikme

### Telekomünikasyon
1. **Faiz → Consumer Purchasing Power:** Postpaid churn, prepaid downgrade, handset financing düşüşü
2. **Enflasyon → Real ARPU Erosion:** Nominal ARPU growth − CPI = Real ARPU
3. **FX → Multi-Channel:** Roaming revenue (turizm), handset COGS (USD), FX debt
4. **BTK Regulatory:** Spectrum fee, revenue share, interconnection rates, MNP costs

### Enerji / Rafineri
- Hurmuz krizi → multi-channel impact: tedarik, fiyat volatilitesi, stok değerleme, crack spread
- Ural crude discount vs yaptırım riski (AB $44.10 tavan, ABD baskısı)
- BOTAŞ endüstriyel gaz artışı → rafineri OPEX (enerji payı %8-12)
- EPDK ÖTV mekanizması rafineriye doğrudan marj kısıtlaması DEĞİLDİR — dolaylı talep koruma

### Çelik / Enerji-Yoğun Sanayi
- Geopolitical → Energy → COGS zinciri zorunlu modelleme
- Enerji maliyeti ~%25 COGS (cam), weighted impact hesabı
- Doğalgaz/elektrik artışı → COGS modellemesi her zaman yapılmalı

### Savunma / Havacılık
- Jeopolitik analiz ZORUNLU: aktif çatışmalar → savunma talebi → ürün-jeopolitik uyumu → ihracat riskleri

---

## 4. Holding-Level Konsolide Impact Metodolojisi

### Weighted Average Impact Formülü
```
Konsolide Impact = Σ(Segment EBITDA contribution % × Segment macro impact %)
Örnek: TUPRS +20% × %40 katkı + ARCLK -15% × %15 katkı = +5.75% net impact
```

### Diversification Benefit
- Segment correlation matrix: bazı segmentler ters yönde hareket eder (ör: oil price + → TUPRS +, ARCLK −)
- Net portfolio volatility: √(Σw²σ² + Σwᵢwⱼσᵢσⱼρᵢⱼ)

### Multi-Currency FX Sensitivity
- Her segment net FX pozisyonu ayrı hesapla
- Konsolide net FX position = Σ(segment FX positions)
- TL %10 depreciation senaryosu → konsolide EBITDA/equity impact (TRY milyar)

---

## 5. Veri Kaynakları ve Protokol

| Kaynak | URL | Kullanım |
|--------|-----|----------|
| TCMB | tcmb.gov.tr / evds2.tcmb.gov.tr | Faiz, enflasyon raporu, kur |
| TÜİK | data.tuik.gov.tr | CPI, PPI, GDP, sektörel veri |
| BDDK | bddk.org.tr/BultenAylik | Kredi hacmi, NPL, sektörel kredi |
| KAP | kap.org.tr | Kamuyu aydınlatma |
| Trading Economics | tradingeconomics.com/turkey | Dashboard |
| OSD | osd.org.tr | Otomotiv üretim/ihracat |

**PPI Protokolü:** TÜİK → TCMB EVDS → Bloomberg (sırasıyla)

---

## 6. Jeopolitik Analiz Zorunlu Bölümleri

Savunma/enerji/banka şirketleri için:
A) Aktif bölgesel çatışmalar ve durumları
B) Sektörel talep etkisi (savunma harcaması, enerji güvenliği)
C) Şirket ürün portföyü ile jeopolitik ortam uyumu
D) Jeopolitik riskler (ihracat lisansı, ödeme akışı, ambargo, yaptırım)

**Ateşkes değerlendirmesi:** "Resolved" sayılmaz — "Fragile, ongoing risk" etiketiyle takip

---

## 7. Güncel Veri Bankası (Son Güncelleme: Nisan 2026)

- TCMB policy rate: %46 (acil artış)
- TÜFE YoY: %30.87 (Mart 2026)
- Yİ-ÜFE YoY: %28.08 (Mart 2026)
- USD/TRY: ~44.60
- BDDK minimum CAR: %12
- Turkey GDP 2026 IMF: %4.2
- BOTAŞ endüstriyel gaz artışı: +%18.61 (Nisan 2026)

---
