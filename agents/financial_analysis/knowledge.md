# Financial Analysis Agent — Bilgi Bankası (Katman 2)

> Bu dosya gece eğitimlerinden damıtılmış domain bilgisi içerir.
> Normal görevde ihtiyaç duyduğunda `Read` ile aç.
> Gece eğitiminde güncellenir.

---

## 1. Zorunlu Metrik Formülleri ve BIST Benchmark'ları

### A. Karlılık (Profitability)

| Metrik | Formül | BIST Benchmark |
|--------|--------|----------------|
| Brüt Kar Marjı | Brüt Kar / Net Satışlar | Sektöre göre değişir |
| FAVÖK Marjı | FAVÖK / Net Satışlar | İmalat: %12-18, Telekom: %38-43, Rafineri: değişken |
| Cash FAVÖK | FAVÖK + Working Capital Değişimi | >%80 FAVÖK sağlıklı |
| Net Kar Marjı | Net Kar / Net Satışlar | Sağlıklı: %8-15 |
| ROE | Net Kar / Özkaynak | Sağlıklı: %12-20 |
| ROCE | EBIT / (Toplam Varlıklar − KVYK) | >%15 iyi, <%10 zayıf |
| ROIC | NOPAT / Invested Capital | >WACC olmalı |
| ROA | Net Kar / Ortalama Toplam Aktifler | Sektöre bağlı |
| OPEX / Ciro | Faaliyet Giderleri / Net Satışlar | Düşük = operasyonel verimlilik |

### B. İşletme Sermayesi (Working Capital)

| Metrik | Formül | BIST Benchmark |
|--------|--------|----------------|
| DSO | (Ticari Alacaklar / Hasılat) × 360 | Sektör ort. ~75 gün |
| DIO | (Stoklar / SMM) × 360 | Çelik: 45-90 gün tipik |
| DPO | (Ticari Borçlar / SMM) × 360 | — |
| CCC | DSO + DIO − DPO | ≤30 gün best-in-class, ~52 gün ort. |
| NWC / Hasılat | (Dönen Varlıklar − KVYK) / Hasılat | — |
| NWC Gün Sayısı | (NWC / Hasılat) × 360 | — |

### C. Kaldıraç ve Faiz Karşılama

| Metrik | Formül | Benchmark |
|--------|--------|-----------|
| Net Borç | Toplam Finansal Borçlar − Nakit | Negatif = güçlü pozisyon |
| Net Borç / FAVÖK | Net Borç / FAVÖK | <1x düşük, 1-3x kabul edilir, >5x aşırı |
| Faiz Karşılama | FAVÖK / Faiz Gideri | >10 mükemmel, 3-10 sağlıklı, <3 riskli, <2 kritik |
| Faiz Yükü | Faiz Gideri / FAVÖK | <%10 mükemmel, %10-33 kabul, >%50 kritik |

### D. Likidite

| Metrik | Formül | Benchmark |
|--------|--------|-----------|
| Cari Oran | Dönen Varlıklar / KVYK | >2 tercih, >1 minimum |
| Asit-Test | (Dönen Varlıklar − Stoklar) / KVYK | >1 sağlıklı |
| Nakit Oran | Nakit / KVYK | — |

### E. Nakit Akış Kalitesi

| Metrik | Formül | Benchmark |
|--------|--------|-----------|
| FCF | OCF − CAPEX | Pozitif olmalı |
| OCF / FAVÖK | İşletme Nakit / FAVÖK | >%100 mükemmel, %80-100 sağlıklı, <%60 red flag |
| CAPEX / FAVÖK | Yatırım / FAVÖK | <%30 hafif, %30-60 orta, >%100 dış finansman gerekli |
| FCF / Faiz Ödemesi | Serbest Nakit / Faiz | >3x mükemmel, <1x kritik |

### F. Skorlama Metrikleri

**Altman Z-Score:** 1.2×(NWC/TA) + 1.4×(RE/TA) + 3.3×(EBIT/TA) + 0.6×(MV/TL) + 1.0×(Sales/TA)
- Z > 2.99: Güvenli | 1.81-2.99: Gri bölge | Z < 1.81: İflas riski
- Dikkat: Yüksek varlık tabanı + düşük EBIT → yapay düşük Z-Skor

**Piotroski F-Score (0-9):** +1 puan her biri: Net kar pozitif, OCF pozitif, ROA artan, OCF>Net Kar, Borç/Aktif azalan, Cari oran artan, Yeni hisse yok, Brüt marj artan, Aktif devir hızı artan
- 8-9: Çok güçlü | 5-7: Orta | 0-4: Zayıf

---

## 2. Sektöre Özel Normlar

### Bankacılık
- NIM (Net Interest Margin) ana karlılık metriği — FAVÖK yerine kullanılır
- Cost of Risk trendi: 5 yıllık CoR, NPL formation vs write-off dinamiği
- Fee income breakdown: kredi kartı / ödeme / wealth management / bancassurance
- Capital ratios: CET1, Tier 1 — BDDK minimum CAR %12
- Distributable cash = Net Income − regulatory capital requirement − growth capital need

### Telekomünikasyon
- ARPU (Average Revenue Per User) nominal vs real (enflasyon-adjusted)
- Churn rate: postpaid vs prepaid ayrımı
- CAPEX intensity = CAPEX / Revenue — telekomda kritik (%25+ tipik)
- Spectrum amortization etkisi (ör: TCELL 2.34B TL/yıl, 17 yıl)

### Rafineri / Enerji
- Rafineri marjı ($/bbl) birincil FCF değişkeni — her 1 $/bbl ≈ 5-6B TRY EBITDA
- Crack spread ≠ Brent fiyatı
- Stok değerleme riski: yüksek fiyatta alınan stok, düşen Brent'te değer kaybı

### Çelik
- HRC korelasyonu: Avrupa spot fiyatı ana sürücü
- DIO özellikle önemli — stok devir süresi 45-90 gün tipik
- CAPEX döngüsü: büyüme CAPEX vs idame CAPEX ayrımı
- CBAM yükümlülüğü: Export tonu × tCO2/ton × EUR sertifika fiyatı

### Holding Şirketleri
- NAV = Σ(Listed subs market cap × ownership %) + Σ(Unlisted subs estimated value × ownership %) + Net Cash
- Holding discount = (NAV − Market Cap) / NAV × 100
- Üç katmanlı analiz: Parent-level / Konsolide / Segment-level
- Her segment için ayrı ROIC, FAVÖK margin, working capital, CAPEX/Revenue

---

## 3. IAS 29 Hyperinflation Muhasebesi

- Kümülatif 3-yıl enflasyon >%100 = hyperinflation → IAS 29 aktif
- TAS 29 (yerel) 2025-2027 askıda (7571 sayılı yasa); IAS 29 (IFRS) hâlâ geçerli
- Parasal Kayıp/Kazanç: Net parasal pozisyon × enflasyon etkisi — zorunlu açıklama
- Brüt Kar IAS29 ve Brüt Kar Oranı IAS29 ayrı raporla
- İki farklı EBITDA varsa (IAS29 vs reported) → her ikisi için senaryo analizi yap

---

## 4. FAVÖK Hesaplama Protokolü

**Yöntem A:** Faaliyet raporundan direkt al (birincil)
**Yöntem B:** EBIT (SPK Gelir Tablosu "Esas Faaliyet Kârı") + D&A (SPK Nakit Akış "Amortisman ve itfa") = FAVÖK
- Kontrol: Yöntem A ile karşılaştır — fark >%2 ise açıkla
- SPK "Faaliyet Kârı" = EBIT (amortisman SONRASI). FAVÖK DEĞİLDİR.

---

## 5. Yorum Formatı (Zorunlu 4-Soru)

Her metrik için:
1. **NE KADAR VE NEREDE?** Değer + tarihsel bağlam + peer benchmark
2. **NASIL DEĞİŞTİ?** Yön + büyüklük + tutarlılık (kaç dönem art arda?)
3. **NEDEN DEĞİŞTİ?** 2-3 somut iş faktörü + yönetim yorumu
4. **YATIRIM ETKİSİ NEDİR?** FCF, temettü, borç servisi veya değerleme üzerindeki somut etki

---

## 6. Değerleme Metrikleri

| Metrik | Formül |
|--------|--------|
| F/K (P/E) | Piyasa Değeri / Net Kar |
| FD/FAVÖK (EV/EBITDA) | (Piyasa Değeri + Net Borç) / FAVÖK |
| PD/DD (P/BV) | Piyasa Değeri / Özsermaye |
| Temettü Verimi | Temettü / Hisse Fiyatı |
| Payout Ratio | Toplam Temettü / Net Kar |
| FCF Sürdürülebilirlik | FCF / Temettü Ödemesi (>1.5x güvenli) |

---

## 7. Havacılık Sektörü Benchmark Tablosu (2025)

| Metrik | THYAO 2025 | Küresel Ort. (IATA) | Not |
|--------|-----------|---------------------|-----|
| EBITDAR Marjı | %23.2 | %16.1 | +7pp outperformance |
| Load Factor | ~%85+ | %83.6 (rekor) | — |
| CASK | US¢8.55 | — | YoY +%0.5 |
| RASK | US¢7.21 | — | YoY +%0.9 |
| FCF | $2.8B | $1.9B | +%45 YoY |

- Değerleme çarpanı: **EV/EBITDAR** (EBITDA değil) — IFRS 16 etkisini izole eder
- **CASK bileşenleri:** Yakıt (%25-30) + Personel (%20-25) + Bakım (%10) + Havalimanı (%10) + Amortisman (%10)
- **RASK = Passenger RASK + Cargo RASK** — cargo ayrı analiz (THYAO 2024: cargo +%35)
- IAS 29: TAS 29 yerel 2025-2027 askıda; IAS 29 (IFRS) zorunlu. Adjusted EBITDA her ikisi için hesapla.

---
