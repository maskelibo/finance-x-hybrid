# FINANCIAL ANALYSIS - KRİTİK METRİKLER CHECKLİST
## CEO MANDATED - 10 Nisan 2026

Bu checklist her rapor için ZORUNLU kontrol listesidir.
Eksik metrik varsa rapor REDDEDİLİR.

---

## ✅ WORKING CAPITAL & CASH CONVERSION (EN ÖNEMLİ)

- [ ] **DSO (Days Sales Outstanding)** hesaplandı
  - Formula gösterildi
  - 3 dönem trend analizi yapıldı
  - Sektör benchmark ile karşılaştırıldı
  - Yorumlandı (müşteri tahsilatı hızı nasıl?)

- [ ] **DIO (Days Inventory Outstanding)** hesaplandı
  - Formula gösterildi
  - Trend analizi yapıldı
  - Yorumlandı (stok verimliliği nasıl?)

- [ ] **DPO (Days Payable Outstanding)** hesaplandı
  - Formula gösterildi
  - Trend analizi yapıldı
  - Yorumlandı (tedarikçi ödeme süresi nasıl?)

- [ ] **CCC (Cash Conversion Cycle)** hesaplandı
  - CCC = DSO + DIO - DPO
  - Benchmark: <30 mükemmel, 30-60 iyi, >90 kötü
  - Trend analizi (iyileşiyor mu kötüleşiyor mu?)
  - Yorumlandı (nakit döngüsü kaç gün? ne anlama geliyor?)

- [ ] **Net Working Capital / Revenue** hesaplandı
  - TRY milyon ve oran olarak
  - Trend analizi
  - Yorumlandı

- [ ] **NWC Days** hesaplandı
  - (NWC / Revenue) × 360
  - Yorumlandı

---

## ✅ LEVERAGE & COVERAGE (KRİTİK)

- [ ] **Net Borç / FAVÖK** hesaplandı
  - Net Borç = Toplam Borç - Nakit ve Benzerleri
  - Benchmark: <2.0 sağlıklı, 2-3 kabul edilebilir, >3 yüksek
  - Yorumlandı (gerçek borç yükü nasıl?)

- [ ] **FAVÖK / Faiz Gideri** (Interest Coverage) hesaplandı
  - Benchmark: >10 mükemmel, 3-10 sağlıklı, <3 riskli, <2 KRİTİK
  - Yüksek faiz ortamında stress test yapıldı
  - Yorumlandı (faiz ödeme kapasitesi yeterli mi?)

- [ ] **Faiz Gideri / FAVÖK** hesaplandı
  - Benchmark: <0.2 sağlıklı, >0.4 yüksek
  - Yorumlandı (FAVÖK'ün ne kadarı faize gidiyor?)

---

## ✅ CASH FLOW QUALITY (KRİTİK)

- [ ] **Operasyonel Nakit Akışı / FAVÖK** hesaplandı
  - Benchmark: >1.0 ideal, 0.7-1.0 kabul edilebilir, <0.7 sorunlu
  - Yorumlandı (FAVÖK'ün ne kadarı gerçek nakit?)

- [ ] **Serbest Nakit Akışı / Faiz Ödemesi** hesaplandı
  - Yorumlandı (operasyonel nakit ile faiz ödenebiliyor mu?)

- [ ] **Cash FAVÖK vs Non-Cash FAVÖK** breakdown yapıldı
  - Cash items neler?
  - Non-cash items neler? (amortisman, revalüasyon)
  - Oran olarak gösterildi

- [ ] **Working Capital Değişim Analizi** yapıldı
  - Alacaklarda değişim
  - Stoklarda değişim
  - Borçlarda değişim
  - Net etki yorumlandı (nakit tüketiyor mu, serbest bırakıyor mu?)

---

## ✅ PROFITABILITY DEPTH

- [ ] **OPEX / Ciro** hesaplandı
  - Pazarlama + Genel Yönetim Giderleri / Hasılat
  - Trend analizi
  - Yorumlandı (operasyonel verimlilik nasıl?)

- [ ] **ROCE (Return on Capital Employed)** hesaplandı
  - EBIT / (Toplam Aktif - Kısa Vadeli Borçlar)
  - Benchmark: >15% iyi
  - ROE ile karşılaştırıldı
  - Yorumlandı

- [ ] **Gross Margin** analizi derinleştirildi
  - IAS29 etkisi ayrıştırıldı
  - Fiyatlama gücü değerlendirildi

- [ ] **ROE ve ROA** trend analizi yapıldı
  - 3 dönem karşılaştırma
  - Özkaynak değişimleri açıklandı

---

## ✅ CAPEX ANALYSIS

- [ ] **CAPEX / FAVÖK** hesaplandı
  - Benchmark: <0.5 sürdürülebilir, 0.5-0.8 büyüme, >0.8 agresif
  - Yorumlandı (FAVÖK yatırımları karşılayabiliyor mu?)

- [ ] **CAPEX Breakdown** yapıldı
  - Maintenance CAPEX vs Growth CAPEX
  - Büyük yatırımlar detaylandırıldı

- [ ] **FCF (Free Cash Flow)** hesaplandı
  - OCF - CAPEX
  - FCF margin hesaplandı
  - Yorumlandı (pozitif mi negatif mi? neden?)

---

## ✅ LIQUIDITY (Mevcut + Derinleştirilmiş)

- [ ] **Current Ratio** hesaplandı VE yorumlandı
  - Sadece "1.39" yazmak YASAK
  - Formula + Benchmark + Trend + Yorum ZORUNLU

- [ ] **Acid-Test Ratio** detaylı analiz yapıldı
  - (Dönen Varlık - Stok) / Kısa Vadeli Borç
  - Cari oran ile karşılaştırıldı
  - Yorumlandı (stok çıkınca likidite nasıl?)

- [ ] **Quick Ratio Trend** analizi yapıldı
  - İyileşiyor mu kötüleşiyor mu?

---

## YORUMLAMA KURALI - ZORUNLU

Her metrik için şu format ZORUNLU:

```
[Metrik Adı]: [Değer]
Formula: [Hesaplama göster]
Benchmark: [Sektör/genel benchmark]
Trend: [3 dönem karşılaştır]
Yorumlama:
- Ne anlama geliyor?
- İyi mi kötü mü? Neden?
- Risk var mı? Fırsat var mı?
- Yönetim ne yapmalı?
```

**❌ SADECE RAKAM YAZMAK YASAK**
**✅ YORUM OLMADAN METRİK KABUL EDİLMEZ**

---

## VERI EKSİKLİĞİ PROTOKOLÜ

Nakit akış tablosu yoksa:
1. Data_collection agentından TALEscriptET
2. Yoksa bile yapabildiğin hesaplamaları yap
3. "Veri eksikliği nedeniyle hesaplanamadı" yaz
4. missing_inputs[] array'ine ekle

Segment bazında veri yoksa:
1. KAP'ta ara
2. Yönetim raporlarında ara
3. Gerçekten yoksa "açıklanmıyor" yaz
4. Konsolide bazda analiz yap

---

## CEO KONTROL PROTOKOLÜ

CEO bu checklist'i kontrol edecek:
- Eksik metrik varsa → **REDDEDİLİR**
- Yorum yoksa → **REDDEDİLİR**  
- Sadece rakam varsa → **REDDEDİLİR**

Hedef kalite: %85+

---

**Tarih:** 10 Nisan 2026  
**Versiyon:** 1.0  
**Zorunluluk:** MUTLAK
