# Event Impact Mapper — Bilgi Bankasi (Katman 2)

> Bu dosya gece egitimlerinden damitilmis domain bilgisi icerir.
> Normal gorevde ihtiyac duydugunda `Read` ile ac.
> Gece egitiminde guncellenir.

---

## 1. Etki Haritalama Cercevesi

Her olay icin UC AYRI finansal tablo etkisi haritalanir:

```
1. P&L Etkisi:
   - Gelir degisimi (+/- TRY)
   - EBITDA etkisi (+/- TRY, +/- bps margin)
   - Net kar etkisi (+/- TRY)
   - Amortization/depreciation yuku

2. Bilanco Etkisi:
   - Equity degisimi (+/- TRY, % equity)
   - Borc degisimi (+/- TRY)
   - Net borc/EBITDA orani degisimi
   - Maddi olmayan varlik (spectrum, lisans) degisimi

3. Nakit Akisi Etkisi:
   - Operating CF
   - Investing CF (CAPEX, M&A)
   - Financing CF (borc, temettu)
   - Serbest nakit akisi (FCF) etkisi
```

Her hesaplamada: FORMUL + INPUT KAYNAKLARI + CONFIDENCE LABEL zorunlu.

---

## 2. Duzenliyici Kurum Etki Kaliplari

### EPDK (Enerji Piyasasi Duzenleme Kurumu)
- Endustriyel dogal gaz ve elektrik tarifesi kararlari
- Etki formulu: `Tarife artisi +X% x Enerji maliyetinin COGS'taki payi (Y%) = EBITDA etkisi`
- Celik sektoru: Enerji = COGS'un %25-30'u (yuksek firin bazli)
- EREGL ornegi: EPDK +%18.61 gaz → -4.0 ila -4.5B TRY/yil EBITDA = -%21.4 erozyon
- **KURAL:** Enerji tarifesi karari yayinlandiktan sonra 24 saat icinde sayisal haritalama ZORUNLU

### BDDK (Bankacilik Duzenleme ve Denetleme Kurumu)
- Sermaye yeterliligi kararlari
- CET1 waterfall analysis: her faktore (temettu, kredi buyumesi, AT1 bond) ayri CET1 etkisi
- Capital adequacy esikleri: CET1 min %8, Tier 1 min %10, Total Capital min %12

### SPK (Sermaye Piyasasi Kurulu)
- Temettu dagilim kararlari
- SPK approval language = otomatik HIGH confidence
- Material event disclosure zorunluluklari

### AB Duzenlemeleri (Celik icin)
- **Safeguard:** Kota kesintisi + tarife artisi (ornek: -%47 kota, %25→%50 tarife)
- **CBAM:** Karbon sinir duzenleme mekanizmasi, 2026-2034 kademeli
  - Default EUR 75/ton vs actual EUR 30-37/ton
  - Yil bazli artan maliyet yuku tablolu gosterilmeli

---

## 3. Temettu Surdurulebilirlik Analizi

**Formul Seti:**
```
Payout Ratio = Toplam Temettu / Net Kar
Cash Payout Ratio = Toplam Temettu / Serbest Nakit Akisi (daha muhafazakar)
EBITDA-based Payout = Toplam Temettu / EBITDA (celik gibi dusuk net kar sektorlerinde daha anlamli)
```

**Kirmizi Bayraklar:**
- Borctan odenen temettu
- IAS 29 kazancindan odenen temettu (muhasebe, nakit degil)
- Varlik satisindan odenen temettu
- FCF < Temettu (nakit tamponundan finanse ediliyor)

**FCF-Temettu Acigi Varsa → 3 Kapatma Senaryosu:**
1. Net nakitten cek (nakit erozyon hizi hesapla)
2. Borclan (leverage etkisi hesapla)
3. Temettu kes (piyasa reaksiyonu degerlendirmesi)
Her senaryo olasilik agirliklariyla sunulmali.

**Rafineri Ozel:**
- FCF degil, OCF + nakit tampon uclusune bak
- Rafineri marji volatil — FCF dusuk marj donemlerinde kotulesiyor
- 1 $/bbl marj = ~5-6B TRY EBITDA; temettu/marj sensitivity baglantisi kurulmali
- IAS 29 enflasyon duzeltmesiz bakildginda gercek operasyonel kar daha dusuk

**Celik Ozel:**
- FY net kar cok dusuk olsa da birikmis kar stoku gucluyse temettu surdurulebilir
- EBITDA-based payout ratio (%18.8 gibi) daha anlamli gosterge
- Likit varlik vs dar nakit ayrimi (nakit 2.15B ama likit varlik 115.5B TRY olabilir)

**Partial Execution:**
- Temettu iki taksit oldugunda: "Hangisi odendi?" sorusunu her zaman sor
- Analiz aninda yalnizca pending taksit forward-looking impact

---

## 4. Kaldirac Analizi Esikleri

**Net Borc/EBITDA:**
| Aralik | Durum | Aksiyon |
|---|---|---|
| <3x | Saglikli | Normal izleme |
| 3-5x | Orta | Yakin takip |
| 5-7x | Yuksek | Refinancing risk alert |
| >7x | Distressed | Kritik uyari |

**Faiz Karsilama Orani (EBITDA / Faiz Gideri):**
| Aralik | Durum |
|---|---|
| >4x | Saglikli |
| 2-4x | Yeterli |
| <2x | Distressed |

**Kaldirac Feedback Dongusu (Celik ornegi):**
Tarife artisi → EBITDA dususu → Net Borc/EBITDA yukselisi → Refinancing risk → Rating downgrade riski
(EREGL: 2.1x → 3.0x+ senaryosu; Fitch BB- → B+ riski)

---

## 5. Sektor Bazli Zorunlu Haritalama Listesi

### Celik Sirketleri (5 kategori)
1. Enerji maliyeti soklari (EPDK gaz + elektrik)
2. Hammadde fiyat hareketleri (demir cevheri, kok komuru, hurda)
3. AB ihracat duzenlemeleri (Safeguard, CBAM)
4. Borclanma bildirimleri (tutar dogrulamasiyla)
5. Kredi notu degisimleri (outlook dahil)

### Rafineri Sirketleri
- Crack spread degisimi → EBITDA etkisi (1 $/bbl = ~5-6B TRY)
- Hurmuz/jeopolitik → crack spread genislemesi haritalanmali
- CFO/GM degisimi → finansal politika risk analizi

### Holding Sirketleri
- Temettu impact = equity impact + NAV impact + holding discount impact (UC KATMAN)
- Board/governance events icin qualitative impact framework ZORUNLU
- Multi-segment cash allocation constraint analizi

---

## 6. Yonetim Degisikligi Etki Analizi

Yonetim degisikligi (TYPE 6) sayisal quantify edilmez; izleme cercevesi olustur:

**CFO/Mali GM degisimi icin 3 baslik:**
1. Atanan kisinin ONCEKI pozisyonda izledigi finansal politika
2. Bu politikanin mevcut sirketten FARKI
3. Degisim riski (temettu, CAPEX, borclanma politikasi degisikligi)

**CEO + Chairman ayni anda degisirse = CRITICAL FLAG**
- Temettu karari ayni gun ise ic iliski var
- Yeni yonetim sermaye politikasini degistirebilir

---

## 7. IAS 29 Etki Izolasyonu

- Parasal kazanc muhasebe duzeltmesidir, operasyonel nakit akisi DEGILDIR
- Core operasyondan AYIR: adjusted_operational_profit = net_profit - IAS29_gain
- SISE ornegi: 5.0B net kar - 23.4B IAS29 = -18.4B operasyonel ZARAR
- Temettu surdurulebilirliginde IAS 29 kazancini cikart
- Downstream agents'a her zaman uyari gonder

---

## 8. Disclosure Event vs Economic Effect Ayrimi

- Disclosure event: KAP bildirimi (ornek: YK temettu teklifi + Genel Kurul onayi = 2 bildirim)
- Economic effect: Tek nakit cikisi (ornek: temettu odemesi = 1 ekonomik etki)
- **KURAL:** Zincir olaylarda double count yapma
- Portfolio etkisinde disclosure sayisi degil, ekonomik etki sayisi baz al

---

## 9. Makro Olay Finansal Haritalama

event_classification'dan `macro_event` gelirse:
```
Makro olay → Sektor transmisyon mekanizmasi → Sirket ozel EBITDA etkisi → FCF etkisi → Hisse fiyati etkisi

Ornek: Hurmuz krizi → Crack spread genislemesi (7.0 → 10.5 $/bbl)
→ TUPRS EBITDA +19.3B TRY → FCF iyilesmesi → Hisse yukselisi
```

**KURAL:** event_timeline_alert'teki IMMEDIATE fazindaki olaylar → event_impact_mapper haritalamasi TAMAMLANMADAN cikti gonderilmez.

---

## 10. Madencilik Istiraki Degerleme

- Possible Resource → Probable Reserve → Proven Reserve hiyerarsisi her zaman belirt
- SOTP'ye dahil ederken confidence seviyesi acikca yazilmali (speculative)
- EREGL Ermaden ornegi: Possible Resource → spekulatif degerleme $729M (~32.5B TRY)

---
