# Context Extraction Agent — Bilgi Bankasi (Katman 2)

> Bu dosya gece egitimlerinden damitilmis domain bilgisi icerir.
> Normal gorevde ihtiyac duydugunda `Read` ile ac.
> Gece egitiminde guncellenir.

---

## 1. IAS 29 Hyperenflasyon Muhasebesi

- Turkiye IMF tarafindan hyperinflationary economy ilan edildi (2024).
- Net parasal kazanc/kayip P&L'ye kaydedilir — operasyonel DEGIL, muhasebe duzeltmesi.
- Temettu/karlilik analizi yaparken IAS 29 etkisini core operasyondan AYIR.
- Ornek: SISE 2024 net kar 5.0B TRY → icinde 23.4B TRY IAS29 kazanci → operasyonel sonuc -18.4B TRY ZARAR.
- Downstream agents'a her zaman adjusted profit ver.
- 2025-2027 arasi bazi sirketlerde askiya alindi (ornek: TUPRS).

---

## 2. Holding Sirketi Analiz Protokolu

**SOTP NAV Hesaplama:**
```
NAV = Sum(Listed subsidiary market cap x ownership %)
    + Sum(Unlisted subsidiary estimated value x ownership %)
    + Net Cash (veya - Net Debt at holding level)

Holding Discount % = (NAV - Market Cap) / NAV x 100
```

**Holding Discount Benchmarklari:**
- Turk holdingleri: %10-40 tipik aralik
- KCHOL guncel: ~%30 (mid-teens'den genisledt mid-2024)
- Discount suruculeri oncelik sirasi: Complexity > Liquidity > Transparency > Macro
- Discount 5pp daralma = 50-70B TRY value unlock

**Rebalancing vs Distress Sale Ayrimi:**

| Gosterge | Rebalancing | Distress Sale |
|---|---|---|
| Zamanlama | Stratejik, acil degil | Zorunlu (borca/likiditeye bagli) |
| Fiyatlama | Piyasa degerinde veya uzerinde | Iskontolu |
| Kontrol | Korunur (dolayli paylar) | Tam cikis |
| Disclosure tonu | "Optimizasyon" | "Likidite", "borc azaltma" |

**Yaygin Yanlis Kani — Sahiplik Dogrula:**
- THYAO = Turkey Wealth Fund (Koc degil)
- EREGL = OYAK (Koc degil)
- Her zaman KAP ownership disclosures, IR sayfalari ve pay defterinden dogrula.

---

## 3. Sektor Bazli Cikarim Sablonlari

### Rafineri (TUPRS tipi)
- Dogal hedge tespiti: Ham petrol USD, urun satisi TRY ama USD endeksli → dogal hedge
- "Revenue TRY" = "FX kur riski yuksek" DEGIL — fiyat endekslemesi kritik
- Ozel metrikler: Refinery Margin ($/bbl), White Product Yield (%), Capacity Utilization, Crack Spread
- 1 $/bbl marj hareketi = ~5-6B TRY FAVOK etkisi
- Dikey entegrasyon: DITAS (deniz) → rafineriler → Korfez Tasimacilik (demiryolu) → Opet (perakende)

### Telekom (TCELL tipi)
- 3 katmanli analiz: Core Telecom + Digital Services + International
- Musteri mix kritik: Postpaid vs prepaid (TCELL %81 postpaid = premium)
- ARPU, churn rate (seasonal: Q3 yuksek), MNP etkisi
- Spectrum = yapisal moat (TCELL 160 MHz, 17 yil 2042'ye kadar)
- FX riski: %97 TRY gelir ama %80 FX borc = double-hit
- CAPEX/Revenue: telekom tipik %15-25, 5G doneminde %25

### Celik/Emtia (EREGL tipi)
- AB Safeguard + CBAM takvimi izlenmeli
- HRC fiyat-gelir korelasyonu sayisal verilmeli
- Demir cevheri/kok komuru-COGS gecirgenlik: "1 $/ton degisim → ~X milyon TRY etki"
- EPDK enerji tarife etkisi: COGS'un %25-30'u enerji (yuksek firin)
- OYAK grup ici satislar ve Ermaden istiraki degeri

### Banka (AKBNK tipi)
- NII vs fee income dagilimi zorunlu
- Dijital donusum metrikleri: dijital musteri %, transaction %, mobile app penetration, cost-to-serve
- Branch vs digital mix

### Havacilik (THYAO tipi)
- EBITDAR (before aircraft rent) = sektor standart valuation metrigi, EV/EBITDAR kullan
- FX yapisi: ~%90 hard currency gelir, ~%32 TRY maliyet = zayif TRY = maliyet avantaji
- IFRS 16 lease yapisi: ROU + lease borcu ayrimi zorunlu
- Cargo = belly + dedicated freighter mix
- IST Hub Moati: ACI Europe #1 global connectivity hub

---

## 4. FX Pozisyon Analiz Cercevesi

- Net FX Pozisyon = FX Varliklar - FX Yukumlulukler
- Negatif = FX borc > FX varlik → TRY depreciation'da double-hit (marj + bilanco)
- Holding multi-segment: HER segment icin ayri Revenue/COGS/Debt currency haritala
- Rafineri: Dogal hedge var (USD bazli fiyatlama) — SISE/ithalatci ile karistirma
- Telekom: Gelir TRY ama borc FX = en yuksek double-hit riski
- Havacilik: Tersine telekom — gelir FX, maliyet kismi TRY = TRY zayiflamasi AVANTAJ

---

## 5. Zorunlu Cikarim Kontrol Listesi

Her sirket icin:
1. Is modeli (segment yapisi + finansal performans entegrasyonu)
2. Competitive moat analizi ("neden bu sirket sektorde one cikiyor?")
3. Ownership structure (kesin %'ler, KAP'tan dogrulanmis)
4. Management team (CEO, CFO, Chairman — biyografi ozeti)
5. Stratejik inisiyatifler (timeline + CAPEX commitment)
6. Risk analizi (FX, commodity, regulatory, jeopolitik)
7. IAS 29 impact notu
8. Net FX pozisyonu (sayisal)
9. Seasonality detection (Q1-Q4 revenue breakdown, index >110 = peak, <90 = low)
10. ESG profili (karbon hedefleri, sustainability)
11. Iliskili taraf islemleri (transfer fiyatlama: CUP/resale price/cost-plus)
12. Istirak bazli EBITDA katkisi tablosu

---

## 7. THYAO 2025 Gercek Finansal Benchmarklar (Referans)

| Metrik | 2025 Gerçek | 2024 | Değişim |
|--------|-------------|------|---------|
| Hasılat | 955.5B TRY | 746.5B TRY | +%28 |
| Net Kar | 118.2B TRY | — | — |
| EBITDAR Marjı | %23.2 | %22.5 | +0.7pp |
| FCF | $2.8B | $1.9B | +%45 |
| CASK | US¢8.55 | — | +%0.5 YoY |
| RASK | US¢7.21 | — | +%0.9 YoY |

- Global sektör EBITDAR marjı (IATA 2025): %16.1 → THYAO outperformance: ~+7pp
- Global Load Factor 2025: %83.6 (rekor)

## 8. Havacilik Icin 8 Zorunlu Context Alani (THYAO Dersi)

1. IFRS 16 lease yapısı (ROU varlık + lease borcu ayrımı)
2. EBITDA vs EBITDAR farkı ve hangi marjın kullanılacağı
3. Hub moatı (IST = ACI Europe #1 global connectivity hub)
4. Cargo segment outperformance (belly + dedicated freighter mix)
5. FX yapısı (%90 hard currency gelir, %32 TRY maliyet = zayıf TRY = maliyet avantajı)
6. IAS 29 izolasyonu (efektif vergi anomalisi işareti)
7. Yönetim değişikliği (CEO + Chairman aynı anda = CRITICAL FLAG)
8. Temettü politikası volatilitesi (ödenip iptal edilen pattern)

## 9. EREGL Icin 7 Zorunlu Context Alani

1. AB Safeguard (2026'da sona eriyor → daha fazla ithalat rekabeti)
2. CBAM sertifika yükümlülüğü (2026 aktif → yeni maliyet kalemi)
3. HRC fiyat-gelir korelasyonu (sayısal: Avrupa HRC spot × satış hacmi)
4. Demir cevheri/kok kömürü - COGS geçirgenliği
5. EPDK enerji tarife kararları (COGS'un %25-30'u enerji)
6. OYAK grup içi satışlar (transfer fiyatlama etkisi)
7. Ermaden iştiraki değeri (stratejik ham madde güvencesi)

## 6. Veri Kalitesi Kurallari

- **"Not Disclosed" demeden 5 adim:** (1) Company sources, (2) Industry reports, (3) Competitor disclosures, (4) Academic/research, (5) News/analysis
- Her iddiay etiketle: `confirmed`, `management statement`, `inference`
- Celiskili metriklerde authoritative baglam setini kilitle
- Tabloyu TAMAMLA — yarim tablo output'ta YASAK
- Governance metrics sayisal: "early adopter" gibi vague ifadeler YASAK
- Output truncation cozumu: Core + appendix olarak ikiye bol

---
