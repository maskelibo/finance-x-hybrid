# Parse Standardization Agent — Bilgi Bankasi (Katman 2)

> Bu dosya gece egitimlerinden damitilmis domain bilgisi icerir.
> Normal gorevde ihtiyac duydugunda `Read` ile ac.
> Gece egitiminde guncellenir.

---

## IAS 29 Hyperenflasyon Muhasebesi

Turkiye, IMF tarafindan hyperinflationary economy ilan edildi (2024). 3 yillik kumulatif TUFE >%100.

### IAS 29 EBITDA Ayristirmasi (Tum Turk sirketleri icin ZORUNLU)
```
Raporlanan Net Kar (IAS 29 dahil): X TRY
(-) IAS 29 Parasal Kazanc/(Kayip): Y TRY
= Operasyonel Net Kar (IAS 29 hariç): Z TRY

Raporlanan EBITDA (IAS 29 dahil): A TRY
(-) IAS 29 Etkisi: B TRY
= Gercek Operasyonel EBITDA: C TRY
```

### Ornek: SISE 2024
- Raporlanan net kar: 5.0B TRY
- IAS 29 parasal kazanc: 23.4B TRY
- Operasyonel sonuc: 5.0 - 23.4 = **-18.4B TRY ZARAR**

### Birincil Kaynak: KAP konsolide SPK tablolari
- Faaliyet raporu ozet tablolari IKINCIL kaynak
- IAS 29 restatement, equity revaluation reserves sadece tam konsolide tablolarda gorunur

---

## IFRS Satir Kalemleri Eslemesi

### Gelir Tablosu — Tam Extraction Zorunlu
Revenue -> COGS -> Gross Profit -> Sales/Marketing Expense -> General Admin Expense -> EBITDA -> D&A -> EBIT -> Finance Income -> Finance Costs -> PBT -> Tax -> Net Income -> NCI -> Net Income Attributable to Parent

### Bilanco — Tam Extraction Zorunlu
**Varliklar:** Current (Cash, Trade Receivables, Inventory, Other) / Non-current (PP&E, Intangibles, Investments)
**Yukumlulukler:** Current (Financial Debt, Trade Payables, Other) / Non-current (Long-term Debt, Provisions)
**Ozkaynak:** Share Capital, Retained Earnings, NCI (Non-controlling Interests)

### Nakit Akis — Tam Extraction Zorunlu
OCF (Operating), ICF (Investing), Financing CF, Net Change, Ending Cash
Working Capital bilesenleri: receivables/inventory/payables changes

### 21 Zorunlu Kalem (TBD/pending YASAK)
Revenue, COGS, Gross Profit, EBITDA, EBIT, Net Income, Total Assets, Total Liabilities, Total Equity, OCF, ICF, FCF, Trade Receivables, Inventory, Trade Payables, Short-term Debt, Long-term Debt, Cash & Equivalents, CAPEX, Interest Expense, Tax Expense

---

## Mali Yil Tespit Ipuclari

- Turk sirketlerinin cogu: 1 Ocak - 31 Aralik
- Yillik rapor yayinlanma: Mali yil bitiminden ~75 gun (Mart ayi)
- Input'taki en guncel tablo tarihi vs bugunun tarihi: 1 yil gerideyse ESCALATE
- KAP'ta yeni rapor varsa ESKİ VERİ İLE PARSE ETME

### Data Freshness Metadata
```json
{
  "data_freshness_check": {
    "input_latest_year": 2025,
    "expected_latest_year": 2025,
    "validation_pass": true,
    "checked_at": "2026-04-11T13:15:00Z"
  }
}
```

---

## Otomatik Matematiksel Kontroller (4 adet)

| # | Kontrol | Tolerans | Fail Durumu |
|---|---------|----------|-------------|
| 1 | Bilanco Dengesi: A = L + E | ±0.1% | Output BLOCK |
| 2 | Gelir Tablosu Zinciri: Revenue->COGS->GP->EBIT->PBT->Tax->NI | ±0.5% | Output BLOCK |
| 3 | Nakit Akis Mutabakati: Opening + OCF + ICF + FCF = Closing | ±0.5% | Output BLOCK |
| 4 | Ozkaynak Mutabakati: Opening + NI - Div ± OCI = Closing | ±1% | Warning |

**SINIRLILIK UYARISI:** Bu kontroller ic matematiksel tutarlilik denetler; kaynak veri dogrulugunu garanti ETMEZ. Downstream web dogrulamasi gereklidir.

---

## "~" (Yaklasik) Isareti Kurallari

- XBRL kaynagindan -> "~" YASAK (XBRL tam sayi verir)
- PDF OCR kaynagindan -> "~" kullanilabilir AMA extraction_method="pdf_unstructured", confidence <=0.89
- "~" orani %20'yi gecerse -> EXCESSIVE_APPROXIMATION flag

---

## Holding vs Operasyonel Sirket Sablonu

### Holding Sirketi Tespit Edilirse (KCHOL, SAHOL, DOHOL)
EK cikarimlar zorunlu:
- IFRS 8 segment verileri (her segment icin Revenue, FAVOK, Assets, Liabilities, CAPEX)
- Bagli ortaklik detaylari + ownership %
- Parent-level bilanco
- Konsolidasyon kapsami degisiklikleri
- Annual report -> "Segment Bilgileri" bolumunu bul

### Operasyonel Sirket
- IFRS 8 segment disclosure "iyi olur" seviyesinde, zorunlu degil
- Ancak segment bilgisi KAP'ta varsa parse et

---

## Sektor Bazli Parse Ipuclari

### Celik/Emtia (EREGL, Kardemir)
- EBITDA/ton, kapasite util%, product mix rapordan hizli extract
- KAP raporlarinda "Segment Bilgileri" ve "Faaliyet Ozeti" ilk 30 sayfa
- Working capital volatilitesi: Commodity sirketlerde WC degisimi extreme olabilir; OCF vs FCF divergence normal
- EREGL rapor yapisi: Faaliyet Ozeti -> Yonetim -> Uretim/Kapasite -> Segment Gelir -> Yatirim -> Muhasebe

### Telekomunikasyon (TCELL)
- Segment revenue: mobile, fixed, digital services, international AYRI parse
- Revenue by type: service revenue vs equipment sales
- Spectrum amortization: 5G icin yeni kalem — intangible amortization icinde ayristir
- CAPEX breakdown: network infrastructure vs IT vs spectrum
- Cash Flow: spectrum acquisition cash outflow (one-time large payment)

### Rafineri (TUPRS)
- Urun bazinda yield tablosu zorunlu (benzin, motorin, jet, fuel oil, nafta AYRI)
- Tek aggregate sayi kabul edilmez
- mandatory_metrics_complete flag yalnizca TUM metrikler gercek veriye dayaliysa TRUE

---

## CBAM Provision Kalemi (2026+)

Çelik şirketlerinde (EREGL, Kardemir) CBAM sertifika yükümlülüğü 2026'dan itibaren aktif.
- Bilançoda aranacak kalemler: "Diğer Karşılıklar", "Çevresel Yükümlülükler", "CBAM Karşılığı"
- Hesaplama: İhraç ton × tCO2/ton emisyon yoğunluğu × AB ETS sertifika fiyatı (EUR)
- Dipnot kontrolü: "Karbon düzenlemelerine ilişkin karşılıklar" başlığını ara
- Yoksa eksik kalem olarak flag'le + CEO escalation

## IFRS 16 ROU Amortisman Ayristirma

Havacılık şirketlerinde (THYAO) D&A içinde IFRS 16 ROU amortismanı büyük pay tutar.
- Dipnot: "Kullanım Hakkı Varlıkları / Amortisman" satırını bul
- Ayrıştırma çıktısı:
  - PP&E Amortisman (geleneksel): X TRY
  - ROU Amortisman (IFRS 16): Y TRY
  - Toplam D&A: X + Y TRY
- EBITDAR hesabı için: EBITDA + ROU Amortisman + Lease Faizi = EBITDAR

## PDF Parse Cozum Sirasi

1. KAP XBRL format dene
2. KAP PDF manuel extraction (pdfplumber, Camelot)
3. OCR (Tesseract / Google Vision)
4. WebFetch ile gorsel extraction
5. Fintables mirror'dan PDF indir
6. Hepsi basarisizsa GAP olarak isaretle, CEO'ya escalate et
- "[pending]" downstream'e gonderme YASAK
- "Parse edilemedi" mazeret degil

---

## Kalite Skoru Kalibrasyonu

| Data Quality Score | Self-Eval |
|---|---|
| > 0.90 | 9-10/10 |
| 0.70-0.90 | 7-8/10 |
| 0.50-0.70 | 5-6/10 |
| < 0.50 | 3-4/10 |

- `mandatory_metrics_complete: TRUE` = "tum alanlar dolu" demek; "tum rakamlar dogru" DEMEK DEGIL
- Tahmini/hesaplanmis metrikler "conditional_pass" olarak ayrica listelenmeli

---
