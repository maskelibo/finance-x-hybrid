# CEO FEEDBACK RAPORU
## ASELS Analizi - 10 Nisan 2026
## Rapor ID: fs-out-asels-20260410-001

---

## GENEL DEĞERLENDİRME

**Kalite Skoru:** %72/100 (Hedef: %80)  
**Durum:** KOŞULLU GEÇER - Ciddi iyileştirme gerektiriyor  
**CEO Onayı:** ❌ REDDEDİLDİ - Revizyon gerekli

---

## KRİTİK EKSİKLİKLER

### 1. FINANCIAL_ANALYSIS AGENT - BÜYÜK EKSİKLİKLER ❌

**Eksik Metrikler:**

#### Working Capital & Cash Conversion Analysis (KRİTİK)
- ❌ **Ticari Alacak Tahsil Süresi (DSO)** = (Ticari Alacaklar / Hasılat) × 360
- ❌ **Stok Devir Süresi (DIO)** = (Stoklar / SMM) × 360
- ❌ **Ticari Borç Ödeme Süresi (DPO)** = (Ticari Borçlar / SMM) × 360
- ❌ **Nakit Dönüşüm Süresi (CCC)** = DSO + DIO - DPO
  - **Benchmark:** Best-in-class ≤30 gün, ortalama ~52 gün
  - **Neden Önemli:** Savunma sektöründe alınan avanslar var (35.8M TL) ama nakit döngüsü bilinmiyor
- ❌ **Net İşletme Sermayesi / Hasılat** oranı ve trend analizi
- ❌ **NWC Gün Sayısı** = (Net İşletme Sermayesi / Hasılat) × 360

#### Leverage & Coverage Analysis (KRİTİK)
- ❌ **Net Borç / FAVÖK** oranı
  - **Formula:** (Toplam Borç - Nakit ve Nakit Benzerleri) / FAVÖK
  - **Neden Önemli:** Gerçek borç yükünü gösterir, nakit pozisyonu dikkate alır
- ❌ **FAVÖK / Faiz Gideri** (Interest Coverage Ratio)
  - **Benchmark:** >10 mükemmel, 3-10 sağlıklı, <3 riskli, <2 kritik
  - **Neden Önemli:** %37 faiz ortamında şirketin faiz ödeme gücü
- ❌ **Serbest Nakit Akışı / Faiz Ödemesi**
  - **Neden Önemli:** Operasyonel nakit akışından faiz ödenebiliyor mu?

#### Cash Flow Quality Analysis (KRİTİK)
- ❌ **Operasyonel Nakit Akışı / FAVÖK** oranı
  - **Benchmark:** >1.0 ideal (FAVÖK'ün tamamı nakite dönüşüyor), 0.7-1.0 kabul edilebilir
  - **Neden Önemli:** Kâğıt üzerindeki FAVÖK'ün ne kadarı gerçek nakit?
- ⚠️ **FAVÖK Cash vs Non-Cash Breakdown** başlığı var ama detay yok
  - Cash FAVÖK ne kadar?
  - Non-cash items neler? (amortisman, revalüasyon, vs.)

#### Liquidity Deep Dive (ORTA ÖNCELİK)
- ⚠️ **Asit-Test Oranı** bahsedilmiş ama detaylı analiz yok
  - **Formula:** (Dönen Varlıklar - Stoklar) / Kısa Vadeli Borçlar
  - **Neden Önemli:** Cari oran 1.39× eşikte, stok çıkarınca ne oluyor?

#### Profitability Depth (ORTA ÖNCELİK)
- ⚠️ **OPEX / Ciro** oranı yok
  - **Neden Önemli:** Operasyonel verimlilik, maliyet kontrolü
- ⚠️ **ROCE (Return on Capital Employed)** yok
  - **Formula:** EBIT / (Toplam Aktif - Kısa Vadeli Borçlar)
  - **Neden Önemli:** Kullanılan sermayenin getirisi, ROE'den farklı

#### CapEx Analysis (ORTA ÖNCELİK)
- ⚠️ **CAPEX / FAVÖK** oranı yok
  - **Mevcut Durum:** $616M CAPEX yatırımı var ama FAVÖK'e oranı bilinmiyor
  - **Benchmark:** <0.5 sürdürülebilir, 0.5-0.8 büyüme modu, >0.8 agresif
- ⚠️ **Faiz Gideri / FAVÖK** oranı yok

---

**FINANCIAL_ANALYSIS AGENT'A TALİMATLAR:**

```
ÖNCELİK 1 (KRİTİK - Önümüzdeki 24 saat):
1. Nakit Dönüşüm Döngüsü (CCC) hesapla ve yorumla:
   - DSO, DIO, DPO'yu ayrı ayrı hesapla
   - CCC'yi benchmark'larla karşılaştır
   - Savunma sektörü için özel bağlam ekle (avans sistemi)
   - Trend analizi (3 yıl)

2. Net Borç / FAVÖK ve FAVÖK / Faiz Gideri hesapla:
   - Her ikisi için de benchmark analizi
   - %37 faiz ortamında stress test
   - "Faiz 50 baza puan artarsa ne olur?" senaryosu

3. Operasyonel Nakit Akışı / FAVÖK hesapla:
   - FAVÖK'ün nakit kalitesini değerlendir
   - Working capital değişimlerini detaylandır

ÖNCELİK 2 (ORTA - 1 hafta içinde):
4. OPEX/Ciro, ROCE, CAPEX/FAVÖK ekle
5. Asit-test oranı detaylı analizi
6. Cash vs Non-Cash FAVÖK breakdown

BUNDAN SONRA HER RAPORDA:
- Yukarıdaki TÜM metrikler standart olacak
- Her metrik için: Formül + Benchmark + Trend + Yorum
- "Sadece rakam yazmak" YASAKtır, YORUM ZORUNLU
```

---

### 2. MACRO_ANALYSIS AGENT - JEOPOLİTİK ANALİZ EKSİK ❌

**Kritik Eksiklik:**

#### İran-ABD Gerginliği Analizi YOK
- **Durum:** Nisan 2026'da İran-ABD gerginliği artıyor (kullanıcı dün bahsetti)
- **ASELS İçin Önemi:** 
  - Savunma sanayi şirketi
  - Türkiye İran'ın komşusu
  - Bölgesel güvenlik ihtiyaçları artıyor
  - Türk savunma ürünlerine talep artışı olası
  - NATO müttefikleri (Polonya vs.) savunma harcamalarını artırabilir

**Neden Yazılmadı?**
- Macro agent sadece Türkiye ekonomik makro (faiz, enflasyon, TL) yazmış
- Jeopolitik risk katmanı YOK
- Sektörel makro etkileri (savunma bütçeleri, bölgesel güvenlik) eksik

#### Diğer Eksik Jeopolitik Faktörler
- Rusya-Ukrayna savaşının devamı (savunma talebine etki)
- NATO genişlemesi (Finlandiya, İsveç)
- Ortadoğu silahlanma yarışı
- Türk savunma sanayine yaptırımlar / lisans kısıtlamaları

---

**MACRO_ANALYSIS AGENT'A TALİMATLAR:**

```
HEMEN EKLE (Önümüzdeki rapor):
1. Jeopolitik Risk Analizi Bölümü:
   - Bölgesel geopolitik gelişmeler (İran-ABD, Rusya-Ukrayna)
   - Türkiye'ye komşu ülkelerdeki güvenlik durumu
   - NATO ve müttefik ülkelerin savunma harcama trendleri
   - Savunma sanayi için özel etki analizi

2. Sektörel Makro Etki:
   - Sadece genel ekonomi değil, SEKTÖRe özgü makro
   - Örnek: "Savunma bütçeleri bölgesel olarak nasıl gelişiyor?"
   - Örnek: "Jeopolitik risk arttığında savunma şirketlerine etki ne?"

3. Şirket-Spesifik Jeopolitik Linkage:
   - ASELS'in müşteri coğrafyası (Polonya, Orta Doğu)
   - Jeopolitik gelişmelerin bu coğrafyalara etkisi
   - Fırsat mı, risk mi?

BUNDAN SONRA HER RAPORDA:
- Jeopolitik Risk Analizi ZORUNLU bölüm
- Özellikle savunma, enerji, ulaştırma sektörlerinde
- "Sadece TCMB faizi yazmak" yetmez
```

---

### 3. FINAL_SUMMARY AGENT - SENTEZLEŞTİRME ZAYIF ⚠️

**Sorun:**
- Jeopolitik fırsatlar (İran-ABD) yönetici özetinde YOK
- En kritik finansal metrikler (CCC, Net Borç/FAVÖK) olmadığı için sentez eksik
- "Ne yapmalı?" sorusuna cevap zayıf

**TALİMAT:**
```
Sentezleme yaparken:
1. Jeopolitik fırsatları/riskleri ÖN PLANA çıkar
2. En kritik 3-5 finansal metriği vurgula (sadece hasılat/FAVÖK değil)
3. Yönetim kuruluna ACTION ITEM'lar sun
   - "İzlenmeli" yerine "Şunu yapın" formatı
```

---

### 4. TECHNICAL_ANALYSIS AGENT - İYİ AMA EKSİK BİLGİ ⚠️

**Sorun:**
- Hacim trendi verileri truncate olmuş
- MACD analizi eksik
- Sosyal sentiment (X, haber başlıkları) yok

**TALİMAT:**
```
- Output truncation sorununu çöz
- Volume profile detaylı analizi ekle
- Sosyal sentiment katmanı ekle (opsiyonel ama iyi olur)
```

---

## GENEL SİSTEM İYİLEŞTİRMELERİ

### 1. Nakit Akış Tablosu Veri Toplama
- **Sorun:** Data_collection agent nakit akış tablosu çekmemiş
- **Sonuç:** FCF, operasyonel nakit akışı hesaplanamadı
- **Aksiyon:** Data_collection agent'a nakit akış tablosu ZORUNLU hale getir

### 2. Segment Bazında Gelir Dağılımı
- **Sorun:** ASELS segment gelirleri açıklamıyor (5 grup başkanlığı ayrımı yok)
- **Sonuç:** Ürün karışımı analiz edilemedi
- **Aksiyon:** Eğer KAP'ta yoksa, "veri yok" diye YAZ ama ara!

### 3. Output Truncation Sorunu
- **Sorun:** Tüm agent çıktıları kesilmiş
- **Sonuç:** Kayıp analiz olabilir
- **Aksiyon:** Output buffer boyutunu artır veya paginate et

---

## BAŞARI GÖSTERGELERİ (Sonraki Raporda)

✅ **Finansal metrikler checklist:**
- [ ] DSO, DIO, DPO, CCC hesaplanmış ve yorumlanmış
- [ ] Net Borç/FAVÖK, FAVÖK/Faiz Gideri var
- [ ] Operasyonel Nakit Akışı/FAVÖK var
- [ ] OPEX/Ciro, ROCE, CAPEX/FAVÖK var
- [ ] Asit-test oranı detaylı

✅ **Jeopolitik analiz checklist:**
- [ ] İran-ABD gerginliği analiz edilmiş
- [ ] ASELS'e özgü etki değerlendirilmiş
- [ ] Bölgesel savunma harcama trendleri var
- [ ] Fırsat/risk dengesi kurulmuş

✅ **Sentez kalitesi:**
- [ ] Jeopolitik fırsatlar ön planda
- [ ] Action item'lar net
- [ ] Yönetim kuruluna karar desteği sağlanmış

---

## CEO NOTU

Bu rapor %72 kalite ile "koşullu geçer" aldı ama ASELS gibi kritik bir şirket için bu yeterli değil. Bir savunma şirketi analiz ediyorsun, İran-ABD savaşı var, bunu yazmaman BÜYÜK EKSİK.

Finansal metrikler eksik olunca rapor "yüzeysel" kalıyor. Cari oran yazmak yetmez, CCC, Net Borç/FAVÖK gibi derin metrikler lazım.

**Hedef:** Sonraki rapor %85+ kalite alacak. 

**Motivasyon değil, ZORUNLULUK.**

---

**Rapor Tarihi:** 10 Nisan 2026  
**CEO:** META  
**Dağıtım:** Financial_Analysis, Macro_Analysis, Final_Summary, Technical_Analysis, Data_Collection
