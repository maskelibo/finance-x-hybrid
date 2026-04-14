# KAP Watch Agent — Bilgi Bankasi (Katman 2)

> Bu dosya gece egitimlerinden damitilmis domain bilgisi icerir.
> Normal gorevde ihtiyac duydugunda `Read` ile ac.
> Gece egitiminde guncellenir.

---

## 1. KAP Platform Yapisi

- **Operator:** Merkezi Kayit Kurulusu A.S. (7/24 aktif)
- **Yasal dayanak:** CMB (Sermaye Piyasasi Kurulu) ve Borsa Istanbul duzenlemeleri
- **Sistem:** XBRL-based public disclosure system
- **Imza:** Elektronik imzali bildirimler
- **URL yapisi:** `https://www.kap.org.tr/tr/Bildirim/{bildirim_id}`
- **Sorgu sayfasi:** `https://kap.org.tr/tr/bildirim-sorgu`
- KAP TEK YETKILI KAYNAK — haber siteleri dogrulama icin kullanilabilir ama KAP ID ZORUNLU

**CMB Duzenleme Cercevesi:**
- CMB Communique on Principles Regarding Disclosure of Material Events
- CMB Communique on Electronically Signed Submissions
- Material events **immediately upon occurrence** veya **upon becoming known** aciklanmali

---

## 2. KAP Bildirim Kategorileri

| Kategori | Aciklama | Tipik Materiality |
|---|---|---|
| Finansal Duran Varlik Satis/Edinimi | Bagli ortaklik pay islemleri | HIGH (>5B TRY) |
| Genel Kurul Islemleri | AGM kararlari, gundem | HIGH |
| Kar Payi Dagilimi | Temettu bildirimi, ex-date | HIGH |
| Kredi Sozlesmesi | Banka kredisi, tahvil ihrac | MEDIUM-HIGH |
| Bagli Ortaklik Sermaye Artirimi | Subsidiary capital increase | MEDIUM |
| Konsolide Finansal Tablo Aciklamasi | Ceyreklik/yillik finansallar | MEDIUM (earnings surprise → HIGH) |
| Kurumsal Yonetim Form Guncellemesi | Compliance raporlari | LOW |
| YK Uye Degisiklikleri | Board member changes | LOW-MEDIUM |
| Ozel Durum Aciklamasi | Material event disclosure | HIGH |

---

## 3. Materiality Degerlendirme Cercevesi

### CMB Materiality Testi (3 Soru)
1. **Insider information testi:** Bu bilgi capital markets instrument degerini etkiler mi?
2. **Investor decision testi:** Bu bilgi yatirimci kararlarini etkiler mi?
3. **Public disclosure status:** Henuz kamuya aciklanmamis mi?
- Uc soruya da EVET → Material event (HIGH materiality)

### Materiality Hiyerarsisi
- **HIGH:** Finansal duran varlik satis/alim >5B TRY, temettu, M&A, genel kurul kararlari
- **MEDIUM:** Kredi anlasmalari, ceyreklik finansallar, bagli ortaklik sermaye artirimlari
- **LOW:** Kurumsal yonetim form guncellemeleri, YK uye degisiklikleri, rutin uyum raporlari
- Earnings surprise buyuklugune gore MEDIUM → HIGH yukselebilir (+%488 surprise ornegi)

---

## 4. Cift Bolum Raporlama Yapisi

```
Bolum A: Son 30 Gun Materyal Olaylar
  - Oncelik: HIGH/CRITICAL
  - Mandate'in talep ettigi kapsam
  - Downstream agentlar bu bolumu birincil input olarak kullanir

Bolum B: Son 12 Ay Gecmisi
  - Arsiv/baglam amacli
  - Eski olaylar yalniz bu bolumde
```

**Izleme penceresi mandate'e sadik tutulmali.** 12 aylik inventory cikarilsa bile son 30 gunluk materyel olaylar AYRI ve ON PLANDA sunulur.

---

## 5. Holding Sirketi KAP Izleme Protokolu

- **Ana sirket + bagli ortakliklar BIRLIKTE izle:**
  - Major subsidiaries (TUPRS, ARCLK, FROTO, YKBNK vb.) KAP disclosure'lari holding'i etkiler
  - Bagli ortaklik islemleri (>%5 ownership change) her zaman MATERIAL

- **Subsidiary KAP cross-check ZORUNLU:**
  - Her major subsidiary icin son 90 gun KAP bildirimlerini kontrol et
  - Parent aciklamalari ile subsidiary aciklamalari tutarli mi?
  - Ornek: TUPRS'nin kendi KAP'i ile KCHOL'un TUPRS'ye iliskin aciklamalari karsilastirilmali

- **Portfolio rebalancing disclosures:** "Finansal Duran Varlik Satis/Alimi" kategorisi
  - Ayni ceyrekte alim + satim → portfolio optimization stratejisi sinyali

---

## 6. Sektor-Spesifik KAP + Makro Olay Kategorileri

### Celik/Emtia Sirketleri
- `macro_regulatory_event` — EPDK/BOTAS tarife kararlari
- `trade_regulatory_event` — AB Safeguard, CBAM duzenleme degisiklikleri
- `commodity_market_event` — Demir cevheri, kok komuru, HRC fiyat soklari
- OYAK sahiplik degisikligi izlenmeli

### Telekom Sirketleri
- 5G rollout: Coverage expansion announcements, sehir lansmanlari, CAPEX updates
- Spectrum: Lisans yenileme, spectrum fee odemeleri, auction katilimlari
- Regulatory: BTK compliance, interconnection anlasmalari, numara tasima istatistikleri
- Subsidiaries: Superonline fiber expansion, Lifecell Ukraine, Paycell islem hacmi

### Enerji/Rafineri Sirketleri
- Hurmuz krizi gibi makro olaylarin KAP'ta "ozel durum aciklamasi" yapilip yapilmadigi kontrol edilmeli
- Sessizlik de bir bulgu — "Resmi KAP var mi?" sorusu `var/yok/bulunamadi` ile cevaplanmali

---

## 7. Bildirim Kaliplari ve Oruntuleri

### Multi-Stage Transaction
- Buyuk islemler 3-6 aylik surecte birden fazla KAP bildirimi uretir
- Ornek: Tek-Art Marina: aciklama → sermaye artirimi → tamamlanma
- Ayni projenin devamliligi isaretlenmeli

### Debt Issuance (2 Asamali)
- Asama 1: Credit rating duyurusu
- Asama 2: Final pricing & terms
- Iki ayri bildirim olarak gelir

### Manufacturing Restructuring Chain
- Closure + restart ayri bildirimler uretir
- Ayni projenin devami olarak isaretlenmeli

### Temporal Clustering
- Buyuk holdinglerin stratejik islemleri Q4-Q1'de yogunlasir
- Bu donem daha siki izleme gerektirir

---

## 8. Impact Quantification Protokolu

Her material event icin 4 metrik ZORUNLU:
```
1. TRY impact (FX conversion if needed, disclosure date kuru)
2. % of equity
3. % of annual EBITDA
4. % of market cap
+ Forward impact: One-time vs recurring, timeline

Ornek: 5G spectrum $1.224B = TRY 39.8B (@ 32.5 TRY/USD)
  = %28 of equity
  Amortization: TRY 2.34B/yil (17 yil) = -200bps EBITDA margin etkisi
```

---

## 9. Borclanma Bildirimi Protokolu

- KAP bildirimi "tahvil ihraci/kredi kullanimi" iceriyorsa:
  - Tutar KAP metninin TAM OKUNMASIYLA tespit edilmeli
  - Proxy tahmin KABUL EDILEMEZ
  - Tutar bulunamazsa → escalation ile KAP PDF tam metin cekilmeli
  - Ornek: EREGL 1257686 nolu bildirim tutari bilinmiyordu → proxy birakildi (HATALI)

---

## 10. Forward Event Takvimi

Her 30 gunluk inventory'e beklenen gelecek bildirimler eklenmeli:
- Financial statement deadlines (ceyreklik/yillik)
- AGM tarihleri
- Tahvil odeme tarihleri
- Temettu ex-date ve odeme tarihleri
- AB Safeguard yururluk tarihleri
- EPDK tarife karar donemleri

### Makro Olay KAP Yansimasi Kontrolu
- Buyuk sektorel/jeopolitik gelisme sonrasinda:
  - Sirketin KAP'ta "ozel durum aciklamasi" yapip yapmadigini tara
  - Sessizlik de bir bulgudur — "KAP aciklamasi YOK" olarak raporla
  - Ornek: TUPRS — Hurmuz krizi sonrasi KAP'ta ozel durum aciklamasi var mi?

---

## 11. Guvenilir Kaynak Hiyerarsisi

| Oncelik | Kaynak | Kullanim |
|---|---|---|
| 1 (Birincil) | KAP Resmi Portal (kap.org.tr) | Tek yetkili kaynak |
| 2 (Dogrulama) | Bloomberg HT, Investing.com, CNBCE | Haber dogrulama |
| 3 (Analiz) | GCM Yatirim, Bulls Yatirim, Fintables | Analiz destegi |

- Haber kaynaklarini KAP YERINE GECIRME
- KAP yoksa bunu EKSIK VERI olarak isaretle
- Her disclosure icin KAP ID + URL ZORUNLU; ID olmayan = incomplete

---
