# Event Timeline Alert — Bilgi Bankasi (Katman 2)

> Bu dosya gece egitimlerinden damitilmis domain bilgisi icerir.
> Normal gorevde ihtiyac duydugunda `Read` ile ac.
> Gece egitiminde guncellenir.

---

## 1. 4-Faz Zaman Cizelgesi Yapisi

| Faz | Aralik | Icerik | Izleme Frekans |
|---|---|---|---|
| IMMEDIATE | 0-30 gun | Aktif kriz, yururlukteki duzenliyici kararlar, KAP son 7 gun | Gunluk |
| NEAR-TERM | 30-90 gun | Earnings, AGM, temettu odemeleri = inflection points | Haftalik |
| MEDIUM-TERM | 90-180 gun | Normalization veri noktalari, regulatuar degisiklikler | Aylik |
| LONG-TERM | 180-365 gun | Structural re-rating sinyalleri, CAPEX milestones | Ceyreklik |

**Kritik Kurallar:**
- 4 fazin TUMU dolu olmali — truncation YASAK
- "must-happen" events (kesin tarih) vs "expected-but-uncertain" events AYRI tutulmali
- Tahminler `estimated` etiketi tasimali
- Sirket ici olay zaman cizelgesi ile dis makro takvim IKI AYRI BOLUMDE

---

## 2. Materiality Esikleri ve Onceliklendirme

**Priority Alert Matrisi:**

| Urgency | Kosul | Aksiyon |
|---|---|---|
| IMMEDIATE | Yururlukteki karar + maddi etki kesin | CEO brief, aninda haritalama |
| CRITICAL | 7 gun icinde kesin olay + yuksek etki | Agentlar arasi koordinasyon |
| HIGH | 30 gun icinde beklenen + materyel | Izleme listesine al |
| MEDIUM | 90+ gun + materyel ama belirsiz | Normal takip |

**Kesinlik Seviyeleri:**
- HIGH: Kesin tarih, matematiksel hesaplama mumkun (EPDK tarife artisi yururlukte)
- MEDIUM: Projeksiyon bazli (Q1 earnings beklentisi)
- LOW: Belirsiz (jeopolitik senaryo, komodite fiyat tahmini)

**Priority alert SADECE yuksek kesinlik + maddi etki icin kullanilir.**

---

## 3. Sektor-Spesifik Monitoring Triggers

### Celik IMMEDIATE Faz Kontrol Listesi
1. EPDK tarifeleri (gaz + elektrik) — tarih, artis orani, yillik EBITDA etkisi
2. KAP onceki 7 gun aciklamalari — borclanma, sermaye artirimi, temettu
3. AB Safeguard kota durumu (Haziran/Temmuz doneminde kritik)
4. HRC spot fiyati (haftalik degisim ≥%5 ise otomatik uyari)

### Telekom Monitoring Triggers
```
Trigger: "5G subscriber penetration <%10 by Q3 2026" → HIGH → Bear case aktivasyon
Trigger: "Churn rate >%3 aylik (vs %2 baseline)" → HIGH → Rekabet baskisi
Trigger: "ARPU buyumesi < enflasyon" → CRITICAL → Reel ARPU dususu
Trigger: "Net Borc/EBITDA >1.0x" → MEDIUM → Leverage creep
Trigger: "Q2 EBITDA margin <%40" → HIGH → Guidance alti execution riski
```

### Holding Monitoring Triggers
```
Trigger: "Military action resumes in Hormuz" → IMMEDIATE → CEO brief
Trigger: "CRK spread <$10/bbl for 5 days" → HIGH → Margin normalizasyon teyidi
Trigger: "ARCLK gross margin <%23" → HIGH → Tariff pass-through basarisizligi
```

### Enerji Sirketleri Jeopolitik Trigger Takvimi
- OPEC+ toplanti tarihleri
- IEA aylik rapor tarihleri
- EPDK tarife karar tarihleri
- TCMB PPK (Para Politikasi Kurulu) tarihleri

---

## 4. Temporary vs Structural Etki Ayrimi

| Ozellik | Temporary | Structural |
|---|---|---|
| Ornek | Oil margin windfall ($14.8→$6) | Enerji tarife +%25 |
| Reversion | Beklenir (3-6 ay) | Beklenmez (politika degisikligi haric) |
| Izleme | Yuksek frekans (haftalik) | Normal (ceyreklik) |
| Piyasa riski | Misprice (yapisal iyilesmeylestirilme) | Uzun vadeli marj baskisi |

**Windfall Misprice Risk Kaliplari:**
- Q1 earnings beat (windfall) → Piyasa yapisal iyilesme zanneder
- Q3 windfall reversal → Hisse duzeltmesi
- Yonetilmezse: -%10-15 whipsaw; iletilirse: notral-pozitif
- Onleme: Pre-emptive disclosure ("gecici jeopolitik prim")
- Ornek: TUPRS $14.8 refining margin (Q1) → normalizasyon $6-7 (Q3) = -%50 reversal

---

## 5. Holding Sirketi Timeline Ozel Kaliplari

- Birden fazla cakisan dongu: temettu, earnings, AGM, regulatuar = karmasiklik
- Jeopolitik olaylar kurumsal takvimi golgeleyebilir
- CEO tonu guidance/AGM'de = equity catalyst (±%3-5 tek gun hareketi)
- Conglomerate discount daralma = yapisal catalyst (50-70B TRY deger)

**Segment-Level Impact Differentials:**
- Ayni makro olay → sektorlere farkli flow:
  - TUPRS (enerji): Oil shock = +%60 marj (temporary)
  - ARCLK (dayankli tuketim): Tariff shock = -2-3pp marj (structural)
  - YKBNK (finans): Rate + credit cycle lag (2-3 ceyrek)
- Bir segmentin kazanci digerinin kaybiyla offset olabilir
- Konsolide gorunum yeterli degil; segment attribution ZORUNLU

---

## 6. Compound Shock Modeli (Celik Sektoru)

Tekil soklar manageable; KOMBINESI earnings crisis trigger edebilir:

```
Enerji sok (EPDK) + Safeguard sok (AB kota) + CBAM sok (karbon maliyeti)
= Bilesik marj baskisi

EREGL Ornegi:
- EPDK +%18.61 gaz → -4.0B TRY EBITDA
- AB Safeguard -%47 kota → -1.5 ila -3.0B TRY EBITDA
- CBAM EUR 40-60/ton → ek maliyet
- Toplam: EBITDA 20.45B → 14-15B (base case 2026)
- Kaldirac: Net Borc/EBITDA 2.1x → 2.5-3.0x+
- Rating: Fitch BB- → B+ downgrade riski
```

Ayni takvim ayina dusen ayri soklar BIR ARADA gorunur sekilde listelenmeli.

---

## 7. Regulatory Calendar Disiplini

**Kesin Tarihli Olaylar (Hard Constraints):**
- KAP disclosure deadlines
- Temettu dagitim tarihleri (ex-date)
- AGM tarihleri
- AB Safeguard yururluk tarihleri
- EPDK tarife yururluk tarihleri

**Beklenen Tarih Pencereleri (Forecast Events):**
- Ceyreklik earnings aciklamalari (tahminiler, `estimated` etiketli)
- Fitch/Moody's rating review (yil icinde tahmini)
- 5G coverage milestones

**Upcoming calendar bir ISLEM TAKVIMI olmali, olay listesi degil.**
- Gecmiste kalan AGM onay tarihi calendar'a girmemeli
- Sadece ileriye donuk tarihler kalmali

---

## 8. Upstream Koordinasyon Protokolu

- **BLOCKED → Partial Complete:** Upstream agent output eksikse bilinen verilerle olustur, eksik kisimlari `PENDING_IMPACT_DATA` etiketiyle isaretle. Tam BLOCKED YASAK.
- **Upstream dogrulamasi DOSYA SISTEMI uzerinden:** output JSON dosyasinin varligini kontrol et (`output_id` + timestamp). Context/hafizadan degil.
- event_impact_mapper output yoksa: macro_analysis, financial_analysis, sector_competition output'larindan infer et.
- Range estimates (point forecasts degil) ve scenario building kullan.
- Confidence limitations'i transparent bildir.

---

## 9. Ermaden ve Madencilik Istiraki Protokolu

- Madencilik istiraki sondaj/kaynak guncellemesi MEDIUM-TERM'e VARSAYILAN olarak dahil et
- Possible → Probable → Proven gecis tarihleri izlenmeli
- Sondaj sonuclari ve KAP aciklamasi beklenen tarihler timeline'a eklenmeli
- Deger aciga cikarici katalist olarak modellenmeli (SOTP potansiyeli)

---

## 10. Anomali Tespit Temelleri

**Zaman Serisi Anomali Tipleri:**
- Point anomalies: Bireysel sapan degerler
- Collective anomalies: Kolektif anormal davranis (trend degisimi)
- STL decomposition: Trend, seasonal, residual ayirimi

**Uygulama Alanlari:**
- Fiyat alarmlari: Belirli seviyeye gelince bildirim
- Kritik tarih takibi: Finansal raporlar, genel kurullar, temettu odemeleri
- Best practice: Kritik gorevleri event'tan 10-14 gun once push et

---

## 11. Near-Term Mandate-Specific Watch Window

Her raporda near-term (30-90 gün) bölümü şunları içermeli:

```
WATCH WINDOW FORMAT:
Tarih | Olay | Olası Surprise Yönü | Etkilenecek Metrik | Yeniden Hesaplanacak KPI | Aksiyon
```

- Son 7 gün KAP olayları + sonraki 30-90 gün catalystleri aynı takip zincirine bağla
- Her catalyst: Bull/Baz/Bear hangi senaryoyu aktive eder? — net belirt
- "EPDK Nisan 2026 +%20 sanayi" gibi geçmiş olayların henüz EBITDA revizesi yapılmadıysa watch window'a gir
- Turkey Q1 2026 earnings window: Nisan-Mayıs 2026; KAP ~15 Mayıs son tarih

---
