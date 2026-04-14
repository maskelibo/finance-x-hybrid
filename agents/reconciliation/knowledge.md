# Reconciliation Agent — Bilgi Bankasi (Katman 2)

> Bu dosya gece egitimlerinden damitilmis domain bilgisi icerir.
> Normal gorevde ihtiyac duydugunda `Read` ile ac.
> Gece egitiminde guncellenir.

---

## Muhasebe Kontrol Denklemleri

### Temel Denklemler
- **Bilanco:** Assets = Liabilities + Equity + NCI
- **EBITDA:** Net Profit + D&A + Interest + Tax
- **Net Profit < EBITDA:** Her zaman gecerli (D&A, Interest, Tax pozitif oldugundan)
- **Eksik degisken:** L = A - E - NCI -> hesapla, makul mu kontrol et

### 7 Otomatik Cross-Statement Kontrol

| # | Kontrol | Severity | Fail Durumunda |
|---|---------|----------|---------------|
| 1 | Bilanco Dengesi (A = L + E) | CRITICAL | Output BLOCK |
| 2 | Gelir Tablosu Zinciri (Revenue->COGS->GP->EBIT->PBT->Tax->NI) | HIGH | Output BLOCK |
| 3 | Nakit Akis Mutabakati (Opening + OCF + ICF + FCF = Closing) | HIGH | Flag + document |
| 4 | Ozkaynak Roll-Forward (Opening + NI - Div ± OCI = Closing) | MEDIUM | Flag + warning |
| 5 | Net Income Cross-Check (IS NI = CF starting NI) | HIGH | Flag + investigate |
| 6 | Working Capital Veri Tamligi (11 zorunlu kalem) | HIGH | Upstream escalation |
| 7 | Anomali Tespiti (Revenue/NI/OCF outliers) | MEDIUM | Flag + CEO approval |

---

## Net Borc Hesabi — DOGRU FORMUL

```
Net Borc = Finansal Borc - (Nakit + Kisa Vadeli Finansal Yatirimlar)
```

- **Finansal Borc** = Banka kredileri + tahvil + finansal kiralama
- **Toplam yukumluluk ASLA kullanilmaz** (ticari borclar, vergi borclari, ertelenmis vergi HARIC)
- Bilanco dipnotlarindan finansal borc kalemi ayrica dogrulanir
- Genis nakit tanimi: Dar nakit (sadece nakit ve nakit benzerleri) YETERSIZ olabilir
  - Ornek EREGL: Dar nakit 2.15B TRY, likit varliklar (kisa vadeli finansal yatirimlar dahil) 115.5B TRY

### Net Borc/EBITDA Esikleri
| Oran | Durum |
|------|-------|
| <3x | Saglikli |
| 3-5x | Orta |
| 5-7x | Yuksek |
| >7x | Distressed |

---

## Materiality Testi

- **Absolute threshold:** 50M TRY (BIST100 sirketleri)
- **Relative threshold:** %1
- Ikisinden biri asilirsa -> MATERIAL kabul edilir

---

## Anomali Tespit Kurallari (Auto-Flag)

| Kosul | Flag |
|-------|------|
| Revenue YoY > ±%50 | REVENUE_ANOMALY |
| Net Income YoY > ±%80 | PROFIT_ANOMALY |
| OCF isaret degisikligi | CASH_FLOW_REVERSAL |
| Net Margin < %0.5 (Revenue > 1T TRY) | MARGIN_COMPRESSION |
| EBIT Margin YoY dusus > 5pp | OPERATIONAL_DETERIORATION |

---

## Sektor Bazli Anomali Esikleri

### Celik/Emtia (EREGL, Kardemir)
- EBITDA marji > sektor ortalamasi +5 puan -> FLAG
- Sektor ortalamasi: %8-10
- EBITDA marji >%15 -> otomatik FLAG + kaynak capraz dogrulamasi zorunlu
- Net kar/EBITDA orani >%35 -> FLAG (IAS 29 veya olaganustu kalem suphesi)
- Net Borc/EBITDA > 4.0x veya < 0.5x -> kaynak dogrulama zorunlu
- Nakit (dar) / Toplam likit varliklar < %5 -> dar nakit tanimi sorgula

### Rafineri (TUPRS)
- Rafineri marji ($/bbl) trendi: 19 -> 14 -> 11 -> 7 $/bbl (operating anomaly)
- 1 $/bbl marj = ~5-6B TRY EBITDA
- Rafineri sirketlerinde asil kritik anomali: rafineri marji trendi, finansal tablolardan ONCE tespit edilmeli
- Kapasite kullanim degisimi

---

## Cash Flow Tam Mutabakat Formuleri

```
OCF = Net Income + D&A + Working Capital Change + non-cash items
FCF = OCF - CAPEX
Net Debt change = Cash Flow financing activities - Cash Flow debt repayment
Cash balance change = OCF + Investing CF + Financing CF
```

---

## Working Capital — 11 Zorunlu Kalem

1. Trade Receivables (Ticari Alacaklar)
2. Inventories (Stoklar)
3. Trade Payables (Ticari Borclar)
4. Current Assets toplam
5. Current Liabilities toplam
6. Short-term Borrowings
7. Long-term Borrowings
8. Cash & Cash Equivalents
9. CAPEX
10. Interest Expense (Faiz Gideri)
11. Depreciation & Amortization

- DSO/DIO/DPO herhangi biri tahmini ise, CCC sonucuna "MEDIUM CONFIDENCE — X tahmini girdi" notu zorunlu

---

## Kalite Skoru Hesaplama

```
Final Kalite Skoru = Ic Tutarlilik x 0.5 + Kaynak Dogrulugu x 0.5
```

- Ic tutarlilik skoru: 7 CHECK sonucu
- Kaynak dogrulugu skoru: En az 1 bagimsiz veri noktasi ile capraz dogrulama
- Kaynak dogrulamasi yapilmadan "0.91 EXCELLENT" verilemez
- Critical imbalance cozulmemisse confidence >0.60 olamaz

---

## IAS 29 On Kontrol (Tum Turk Sirketleri)

- Parasal kazanc/kayip tespit edildiginde:
  (a) Gelir tablosundan ayristir
  (b) Duzeltilmis EBITDA ve net kar ayrica raporla
  (c) "IAS 29 etkisi: X TRY" notu ekle
- Net kar icinde IAS 29 parasal kazanci varsa -> operasyonel sonuc negatif olabilir (bkz. SISE 2024: 5.0B raporlanan, -18.4B operasyonel)

---

## Holding Sirketi Ozel Kontroller

- IFRS 8 segment toplamlari = konsolide total dogrulamasi zorunlu
- Eliminasyon tutarlarini ayri flag'le
- NCI (Non-controlling Interests) bilancoda ayri kontrol et
- Balance sheet imbalance icin NCI hipotezi olusturuldugunda KAP annual report BS'den NCI satirini bul ve DOGRULA

---

## Banka Sektoru Ozel Kontroller

- Equity reconciliation: Acilis + net kar - temettu = kapanis kontrolu zorunlu
- NPL classification consistency: NPL orani donemler arasi tutarli mi, BDDK standardina uygun mu
- Capital adequacy cross-period validation: CET1 dusus mantikli mi, sermaye hareketleri ile uyumlu mu

---

## Telekom Sektoru Ozel Kontroller

- CAPEX reconciliation: CF CAPEX = BS PP&E + IS depreciation
- 5G spectrum: BS intangible assets artisi = spectrum payment
- Spectrum amortization baslangic tarihi ile tutarli mi
- FX reconciliation: FX borc orani vs FX nakit orani -> net FX pozisyon analizi

---

## IFRS 16 Havacilik Reconciliation Noktalari

Havacılık şirketlerinde (THYAO) IFRS 16 bilanço etkisi büyük:
- ROU varlıkları toplam aktifi %20-23 oranında şişirebilir
- Bilanco dengesi kontrol edilirken: ROU varlık artışı + kiralama borcu artışı paralel mi?
- Net Borç formülü (havacılık): Finansal Borç + **Finansal Kiralama Borcu** - (Nakit + KV Yatırım)
- EBITDAR = EBITDA + Kira Gideri (IFRS 16 öncesi konvansiyona göre) — peer karşılaştırması için

## CBAM Provision Reconciliation (2026+)

- Çelik şirketlerinde yeni provision kalemi: "CBAM Karşılığı" veya "Çevresel Yükümlülükler"
- Önceki yıl bulunmayan kalem artıksa: CBAM karşılığı olup olmadığını sorgula
- Dipnot referansı: "AB Sınırda Karbon Düzenlemesi" veya "CBAM Yükümlülüğü" başlığı

## Holding Discount Guncel Benchmarklar (Nisan 2026)

| Sirket | Hedef Fiyat | İşlem Fiyatı | Tahmini İskonto |
|--------|-------------|--------------|-----------------|
| KCHOL | 298.62 TL | 202.50 TL | ~%32 |
| SAHOL | — | — | ~%44 (P/BV: 0.56) |

- Türkiye holding discount revize aralığı: **%25-45** (önceki %10-40 artık dar)
- Genişleme nedeni: Makro volatilite + karmaşıklık + şeffaflık sorunları

## Restatement Detection

- Multi-year analizde onceki yil comparative figures degismis mi kontrol et
- Degistiyse -> restatement var (accounting policy change, error correction, reclassification)
- Multi-year revenue anomaly (>%100): Prior period restatement check zorunlu
- 2022 comparative figures 2021'i revize etmis mi kontrol et

---
