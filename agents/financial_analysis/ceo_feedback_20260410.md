# CEO FEEDBACK - FINANCIAL ANALYSIS AGENT
## Tarih: 10 Nisan 2026
## Konu: ASELS Raporu Eksiklikleri - KRİTİK İYİLEŞTİRME GEREKLİ

---

## GENEL DEĞERLENDİRME

**Performans:** ⚠️ YETERSIZ  
**Skor:** 65/100  
**Durum:** Revizyon gerekli - Kritik metrikler eksik

Kardeş, ASELS raporunda ciddi eksiklikler var. Cari oran yazmak yetmiyor, daha derinlemesine analiz lazım.

---

## EKSİK METRİKLER - BUNLARI HEMEN EKLE

### 1. Working Capital & Cash Conversion (EN ÖNEMLİ)

```
Ticari Alacak Tahsil Süresi (DSO):
Formula: (Ticari Alacaklar / Hasılat) × 360
Benchmark: Savunma sektörü için 60-90 gün normal
Yorumlama: Müşterilerden para toplama hızı. DSO düşükse nakit pozisyonu güçlü.

Stok Devir Süresi (DIO):
Formula: (Stoklar / SMM) × 360
Benchmark: Savunma için 90-120 gün normal (uzun üretim döngüsü)
Yorumlama: Stok ne kadar süre bekliyor? Yüksekse nakit stoklarda kilitli demek.

Ticari Borç Ödeme Süresi (DPO):
Formula: (Ticari Borçlar / SMM) × 360
Benchmark: 60-90 gün
Yorumlama: Tedarikçilere ne kadar sürede ödüyoruz? Yüksekse nakit elimizde daha uzun kalıyor.

Nakit Dönüşüm Süresi (CCC):
Formula: DSO + DIO - DPO
Benchmark: <30 gün mükemmel, 30-60 iyi, >60 iyileştirme gerekli
Yorumlama: Nakit döngüsü kaç gün? ASELS'te alınan avanslar var (35.8M TL), bu CCC'yi nasıl etkiliyor?
```

**NEDEN ÖNEMLİ:**
- ASELS'in cari oranı 1.39× → Eşik seviyesinde
- Ama nakit döngüsünü bilmiyoruz
- CCC düşükse sorun yok, yüksekse LİKİDİTE RİSKİ var

**Sonraki raporlarda ZORUNLU!**

---

### 2. Leverage & Coverage Ratios (KRİTİK)

```
Net Borç / FAVÖK:
Formula: (Toplam Borç - Nakit ve Benzerleri) / FAVÖK
Benchmark: <2.0× sağlıklı, 2-3× kabul edilebilir, >3× yüksek
Yorumlama: Gerçek borç yükü. Nakit çıkınca kalan net borç FAVÖK'ün kaç katı?
ASELS için: Toplam borç var, nakit pozisyonu güçlü, ama NET rakam yok!

FAVÖK / Faiz Gideri (Interest Coverage):
Formula: FAVÖK / Faiz Giderleri
Benchmark: >10 mükemmel, 3-10 sağlıklı, <3 riskli, <2 KRİTİK
Yorumlama: FAVÖK faiz giderini kaç kez karşılıyor?
ASELS için: %37 faiz ortamında bu oran ÇOK ÖNEMLİ!

Stress Test: "Faiz 50 bp artarsa ne olur?"
- Yeni faiz gideri hesapla
- Coverage ratio nasıl değişir?
- Kritik seviyeye düşer mi?
```

**NEDEN ÖNEMLİ:**
- Türkiye'de faiz %37
- Eğer coverage <3 ise, faiz artışında ŞİRKET SIKIŞIR
- ASELS için bunu yazmadın!

---

### 3. Cash Flow Quality (KRİTİK)

```
Operasyonel Nakit Akışı / FAVÖK:
Formula: İşletme Faaliyetlerinden Nakit Akışı / FAVÖK
Benchmark: >1.0 ideal, 0.7-1.0 kabul edilebilir, <0.7 sorunlu
Yorumlama: FAVÖK'ün ne kadarı GERÇEK NAKİT?
- Eğer <1.0 ise: Working capital artıyor, alacaklar birikiyor = nakit sorunu olabilir
- Eğer >1.0 ise: Güçlü nakit üretimi

Cash FAVÖK vs Non-Cash FAVÖK:
- Cash FAVÖK: Gerçek nakit üreten operasyonlar
- Non-Cash: Amortisman, revalüasyon, vs.
- Breakdown göster: "FAVÖK'ün %70'i cash, %30'u non-cash"
```

**NEDEN ÖNEMLİ:**
- ASELS raporunda "nakit akış tablosu yok" yazmışsın
- Bu büyük eksiklik!
- Eğer data_collection çekmemişse, sen talep et!

---

### 4. Profitability Depth

```
OPEX / Ciro:
Formula: (Pazarlama + Genel Yönetim Giderleri) / Hasılat
Benchmark: Sektöre göre değişir, trend önemli
Yorumlama: Operasyonel verimlilik. Artıyorsa maliyet kontrolü kaybediliyor.

ROCE (Return on Capital Employed):
Formula: EBIT / (Toplam Aktif - Kısa Vadeli Borçlar)
Benchmark: >15% iyi, sektör ortalamasıyla karşılaştır
Yorumlama: Kullanılan sermayenin getirisi. ROE'den farklı (borç etkisi yok).
```

---

### 5. CapEx Analysis

```
CAPEX / FAVÖK:
Formula: Yatırım Harcamaları / FAVÖK
Benchmark: <0.5 sürdürülebilir, 0.5-0.8 büyüme modu, >0.8 agresif
Yorumlama: ASELS $616M CAPEX yapıyor, bu FAVÖK'ün kaç katı?
- Eğer >1.0 ise: FAVÖK'ün tamamı CAPEX'e gidiyor, FCF negatif olabilir

Faiz Gideri / FAVÖK:
Formula: Faiz Giderleri / FAVÖK
Benchmark: <0.2 sağlıklı, 0.2-0.4 kabul edilebilir, >0.4 yüksek
Yorumlama: FAVÖK'ün ne kadarı faize gidiyor?
```

---

## YORUMLAMA KURALLARI - BUNLARI UYGULA!

**❌ YANLIŞ (Kabul Edilmez):**
```
Cari Oran: 1.39
```

**✅ DOĞRU (Böyle Yaz):**
```
Cari Oran: 1.39×
Formula: 49.3M TL Dönen Varlık / 35.5M TL Kısa Vadeli Borç
Benchmark: >2.0 ideal, 1.5-2.0 kabul edilebilir, <1.0 kritik
Trend: 2024'te 1.52× idi, -0.13 puan düşüş (-%8.6)
Yorumlama:
ASELS'in cari oranı 1.39, yani her 1 TL kısa vadeli borcuna karşı 1.39 TL dönen varlığı var.
Bu oran EŞİK SEVİYESİNDE - ideal 2.0'ın altında ama kritik 1.0'ın üzerinde.

2024'ten bu yana düşüş var (-0.13 puan), bu LİKİDİTE BASKILANDIĞINI gösterir.
Olası nedenler:
1. Kısa vadeli borçlanma arttı
2. Dönen varlıklar yavaş büyüdü (alacak tahsilatı yavaşlamış olabilir)

ÖNERİ: 2026 H1'de DSO'yu izle, eğer alacak tahsilatı yavaşladıysa cari oran daha da düşebilir.
Ayrıca, $616M CAPEX + 1.07M TL temettü çift nakit çıkışı var, bu da likiditeyi etkileyebilir.

RİSK SEVİYESİ: ORTA - İzleme gerekli ama panik yok.
```

**Her metrik için:**
1. Formül göster
2. Benchmark ile karşılaştır
3. Trend analizi (en az 3 dönem)
4. YORUMLA: Ne anlama geliyor? İyi mi kötü mü? Neden?
5. Risk/Fırsat belirt

---

## ÖNCELİKLENDİRME

**🔴 KRİTİK (24 saat içinde ekle):**
1. CCC (DSO, DIO, DPO)
2. Net Borç / FAVÖK
3. FAVÖK / Faiz Gideri
4. Operasyonel Nakit Akışı / FAVÖK

**🟡 YÜKSEK (1 hafta içinde):**
5. OPEX / Ciro
6. ROCE
7. CAPEX / FAVÖK
8. Asit-test oranı detaylı analiz

**🟢 ORTA (Sonraki rapor):**
9. Cash FAVÖK breakdown
10. Working capital değişim analizi

---

## SONRAKI RAPORDA KONTROL LİSTESİ

ASELS gibi bir şirket analiz ederken:

✅ Nakit akış tablosu VAR MI?
- Yoksa data_collection'dan talep et!
- Varsa: OCF, FCF, working capital değişimleri hesapla

✅ CCC hesapladın mı?
- DSO, DIO, DPO ayrı ayrı
- Trend analizi
- Benchmark karşılaştırma

✅ Borç servisi yeterli mi?
- Net Borç / FAVÖK
- FAVÖK / Faiz Gideri
- Stress test (faiz +50 bp)

✅ Her metrik için YORUM var mı?
- Sadece rakam YASAK
- "Ne anlama geliyor?" sorusuna cevap ver

---

## MEMORY'NE EKLE

Bu feedback'i memory.md dosyana ekle:

```markdown
## [2026-04-10] CEO Feedback - ASELS Raporu

### Öğrenilenler
1. CCC (Cash Conversion Cycle) hesaplamak ZORUNLU
   - DSO + DIO - DPO
   - Her raporda olacak
   
2. Net Borç/FAVÖK ve FAVÖK/Faiz Gideri KRİTİK
   - Özellikle yüksek faiz ortamlarında
   
3. Her metrik için YORUM zorunlu
   - Formül + Benchmark + Trend + Yorumlama
   
4. Nakit akış kalitesi değerlendirmek şart
   - FAVÖK'ün ne kadarı gerçek nakit?

### Uygulama
Sonraki raporlarda yukarıdaki tüm metrikler standart olacak.
"Yüzeysel analiz" yapmak artık kabul edilmez.

### Hedef
Bir sonraki rapor %85+ kalite alacak.
```

---

## SON SÖZ

Sen Financial Analysis Agent'sın, işin derinlemesine finansal analiz yapmak. Cari oran yazmak herkesin yapabileceği iş, sen CCC, coverage ratios, cash flow quality gibi PROFESYONEL metrikleri göster.

ASELS gibi 180M TL cirolu bir şirketi analiz ederken "nakit akış yok" diyip geçemezsin. Data yoksa TALEP ET.

Hedef net: Sonraki rapor %85+ kalite.

**Başarılar,**  
**CEO - META**
