# Data Collection Agent — Bilgi Bankasi (Katman 2)

> Bu dosya gece egitimlerinden damitilmis domain bilgisi icerir.
> Normal gorevde ihtiyac duydugunda `Read` ile ac.
> Gece egitiminde guncellenir.

---

## KAP Navigasyon ve URL Kaliplari

- Ana portal: `https://www.kap.org.tr/tr/`
- Bildirim URL: `https://www.kap.org.tr/tr/Bildirim/{bildirim_id}`
- Sirket arama: Ticker ile ara (ASELS, SISE, EREGL vb.)
- Finansal tablolar sekmesi: En guncel yillik/donemsel raporu indir
- PDF boyutu >5MB ise muhtemelen entegre faaliyet raporu (tam veri)
- Fintables mirror: `storage.fintables.com/media/uploads/kap-attachments/{Sirket}-Entegre-Faaliyet-Raporu-{YIL}.pdf`
- Sirket IR sayfasi: `{sirket}.com.tr/yatirimci-iliskileri/faaliyet-raporu`

### KAP Arama Protokolu
1. "Finansal Tablolar" sekmesi -> en guncel bildirimi kontrol et
2. Bildirim tarihi 3 ay icinde mi? -> Yillik rapordur
3. Bildirim turu "Finansal Rapor (FR)" -> Indir
4. Icindekiler: 4 zorunlu tablonun (IS, BS, CF, SE) sayfalari var mi?
5. Eksikse tam yillik raporu indir (ozet degil)

### Alternatif Kaynak Hiyerarsisi
1. KAP (kap.org.tr) — birincil resmi kaynak
2. Fintables (storage.fintables.com) — KAP mirror, parse edilebilir
3. Sirket IR sayfasi — direkt download
4. Web search: `site:kap.org.tr [TICKER] 2025 finansal rapor` — Google cache
5. Ikincil kaynaklar (Investing.com, Is Yatirim) — sadece backup

---

## Faaliyet Raporu Sayfa Yapisi

- Ilk 30 sayfa: "Faaliyet Ozeti" ve "Segment Bilgileri" (IFRS 8)
- Ortalar: Yonetim mesaji, uretim/kapasite, segment gelir, yatirim planlari
- Son kisim: Muhasebe politikalari, dipnotlar, finansal tablolar
- OYAK grubu raporlari standart format: Faaliyet Ozeti -> Yonetim -> Uretim/Kapasite -> Segment Gelir -> Yatirim -> Muhasebe
- **UYARI:** Faaliyet raporunun "Finansal Ozet" tablosu ozet versiyondur; SPK konsolide tablolarina her zaman kontrol et

---

## Veri Guncelligi Kontrolu

Her analiz baslamadan once:
- Bugunu tarihi: [TARIH]
- Sirketin mali yili: Genelde 1 Ocak - 31 Aralik
- Son yillik rapor yayinlanma suresi: Mali yil bitiminden ~75 gun (Mart ayi)
- KAP'ta bu rapor var mi? -> KONTROL ET, varsa INDIR VE KULLAN
- Metadata: `report_date`, `publication_date`, `collection_date`, `data_age_days`, `is_latest_available`

---

## PDF Parse Engeli Cozumleri

KAP PDF'leri FlateDecode compression kullanir; WebFetch parse edemeyebilir.
1. KAP XBRL formati dene
2. Farkli parser (pdfplumber, Camelot) dene
3. OCR (Tesseract / Google Vision)
4. WebFetch ile gorsel extraction
5. Fintables mirror'dan indir
6. Sirket IR sayfasindan indir
7. Google cache dene
- 403 erisim engeli: IR sayfalari WebFetch'i engelleyebilir -> indirekt kaynaklara yonel

---

## Sektor Bazli Zorunlu Veriler

### Banka Sektoru
- BDDK verileri: NPL detay, capital adequacy, segment breakdown
- Basel III capital tables (CET1, Tier 1, RWA)
- NPL breakdown: Stage 1/2/3, coverage ratio evolution
- Loan portfolio: retail/corporate/SME
- BDDK rapor linkleri her donem icin zorunlu

### Telekomunikasyon
- BTK (btk.gov.tr): sektor raporlari, pazar payi, spectrum tahsisi
- Abone sayisi: postpaid/prepaid/fiber/corporate breakdown
- ARPU by segment (mobile, fixed, corporate)
- Churn rate (aylik/ceyreklik), MNP net gain/loss
- Spectrum holdings (MHz by band: 700/900/1800/2100/2600/3500)
- 5G rollout timeline + capex guidance
- Network coverage (populasyon %, cografi %)

### Rafineri
- Urun dagilim tablosu: benzin, motorin, jet yakiti, fuel oil, nafta yield'lari TABLO formatinda
- White product yield (%)
- Kapasite kullanim orani
- Rafineri marji ($/bbl)
- Ham petrol tedarik ulke kirilimi

### Celik/Emtia
- EBITDA/ton, kapasite kullanim %, urun karmasi (HRC/CRC/galvaniz ayri ayri)
- Ham madde bagimliligi (demir cevheri/kok komuru kaynak ulkeleri)
- Faaliyet raporunun "Operasyonel KPI'lar" bolumunden cikar

---

## Borsa ve Teknik Veri Kaynaklari

### Borsa Verileri (Her raporda zorunlu)
- Kaynaklar: Investing.com Turkey -> [TICKER] -> Overview | Fintables | Is Yatirim
- Gunluk: Acilis, Kapanis, En Yuksek, En Dusuk fiyat
- Islem Hacmi: Lot + TL
- 52 Hafta Bandi, Piyasa Degeri, Beta, F/K (PER)

### Teknik Analiz
- Kaynak: TradingView.com -> [TICKER].IS -> Technical Indicators
- RSI, MOM, MACD, Destek/Direnc seviyeleri (5'er seviye)
- Ortalama hacim: 10/20/50/100 gunluk

### Peer Karsilastirma
- Fintables -> Sector Analysis -> Peer Table
- Is Yatirim -> Sector Reports -> Peer Benchmarking
- Metrikler: PD, PD/DD, F/K, EV/FAVOK, ROE, ROA, FAVOK Marji

---

## IAS 29 On-Kontrol (Tum Turk Sirketleri)

Her analiz baslamadan: "Bu sirketin son 3 yil kumulatif TUFE > %100 mu?"
- Evet -> net kar rakami icin "IAS 29 parasal kazanc dahil mi?" notu ekle
- Bu bilgi parse_standardization'a iletilmeli
- Birincil kaynak: KAP konsolide SPK tablolari (faaliyet raporu ozet tablolari IKINCIL)

---

## TAS 29 vs IAS 29 Ayrimi (Kritik)

- **TAS 29 (KGK/yerel):** 7571 sayılı yasa ile 2025-2027 arası uygulamadan kaldırıldı.
- **IAS 29 (IFRS/SPK raporlaması):** HÂLÂ GEÇERLİ. SPK konsolide tablolarını IAS 29 perspektifinden değerlendir.
- Veri toplarken: Şirket "IAS 29 uygulamıyoruz" derse → SPK tablosunu incele, IFRS parasal kazanç/kayıp satırı var mı bak.

---

## Surdurulebilirlik Raporu Yeni Veri Kaynagi (2025+)

- KGK düzenlemesi ile büyük şirketler için sürdürülebilirlik raporlaması zorunlu (2025 itibaren).
- Çelik (EREGL): Karbon emisyonu (tCO2/ton üretim), enerji tüketimi, CBAM baz verileri.
- Rafineri (TUPRS): Enerji yoğunluğu, su tüketimi, GHG emisyonları.
- Telekom (TCELL): E-atık, ağ enerji tüketimi, dijital kapsama.
- **Veri noktası:** CBAM sertifika hesabı için emisyon verisi bu rapordan alınmalı.

---

## Iceriden Islem Taramasi

Her analizde zorunlu: KAP'ta yonetim islemleri (Form 3/4 esdegeri) ayrica taranmali.
Ornek: TUPRS'te Koc'un Mart 2026'da %2.1 hisse satisi data_collection yerine teknik analizden geldi — kabul edilemez.

---
