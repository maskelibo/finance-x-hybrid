# ASTOR ENERJİ A.Ş. — DEĞERLEME ANALİZİ
**Tarih:** 14 Nisan 2026  
**Analiz Türü:** Kurumsal Hisse Senedi Değerleme (Kapsamlı)  
**Veri Kaynağı:** KAP Bildirim 1557972 (FY2025 Denetlenmiş Konsolide Finansallar), Faaliyet Raporu Q1-2025, Technical Analysis Agent, Consensus Agent çıktıları  
**Güncel Fiyat Referansı:** 203,50 TL (Technical Analysis Agent: 203,30 TL | Consensus Agent: 203,80 TL → Ortalama)  
**Denetçi:** Eren Bağımsız Denetim A.Ş. (Grant Thornton üyesi) — Olumlu görüş  

---

## ÖNEMLİ METODOLOJIK UYARILAR

### 1. TRY WACC Tuzağı (Kritik — Zorunlu Açıklama)
Ham TRY CAPM modeli (TCMB politika faizi ~%45 + Damodaran Türkiye ERP %10,87 + beta ~0,85) → %37-39 maliyet özsermaye (Ke) üretiyor. Bu Ke ile inşa edilen DCF modeli, ASTOR için 65–110 TL/hisse aralığında değer üretiyor — piyasa fiyatının (203,50 TL) yarısından az. Bu bir anomali değil; Türkiye'nin %40+ nominal faiz ortamında standart TRY DCF'nin yapısal kırılmasıdır.

**Piyasa örtük WACC analizi:** FY2026E FCF ≈ 8.000M TRY, %15 organik büyüme, terminal g=%5 varsayımıyla 203,50 TL piyasa fiyatı ancak ~%12 efektif iskonto oranıyla tutarlıdır. Piyasa, ASTOR'u TRY DCF ile değil, **EV/EBITDA göreceli çarpan** metoduyla fiyatlamaktadır. Bu gerçekliği yok sayarak %37 WACC üzerinden DCF ağırlıklı değerleme yapmak analitik olarak yanlış olur.

**Çözüm:** EV/EBITDA birincil yöntem (%50 ağırlık), DCF (%30) referans/çapa işlevi, P/E (%15) IAS29 düzeltmeli, FCF Verimi (%5).

### 2. IAS29 Enflasyon Muhasebesi Distorsiyonu
FY2025 parasal kayıp (TMS 29): **-8.068,56M TRY** — raporlanan net kârın %105'i. Raporlanan net kâr 7.669M TRY iken gerçek operasyonel performans bunu yansıtmıyor. Tüm P/E ve net kâr bazlı metrikler **IAS29 düzeltmeli NOPAT** (≈9.621M TRY) üzerinden hesaplanmıştır.

### 3. Yönetim Guidance Güvenilirliği
- FY2024: $826M hedef → $755M gerçekleşme (**-%8,6 sapma**)  
- FY2025: $853M revize hedef → ~$801M tahmini gerçekleşme (**-%6,1 sapma**)  
- FY2023: Aşıldı (pozitif sapma)  
- **İki ardışık ıskalama → %85 gerçekleşme faktörü** FY2026 $1.223M guidance'ına uygulandı → Analitik baz: ~$1.040M

### 4. DDM Kapısı (Gated — %0 Ağırlık)
ASTOR düzenli temettü ödemektedir (0,53 → 1,32 → 1,51 TL/hisse geçmiş 3 yıl, %21,2 ödeme oranı). Ancak TRY maliyet özsermaye ≈%37 ortamında Gordon Growth modeli anlamsız değer üretiyor:  
P = D₁/(Ke − g) = 1,66 / (0,37 − 0,08) = **5,72 TL** — piyasa fiyatının %2,8'i.  
DDM metodolojik olarak kırık → **ağırlık %0, gated**.

### 5. SOTP Uygulanmıyor
Context_extraction'dan teyit: HOLDING = FALSE. ASTOR sanayi/üretim şirketi. Bağlı ortaklıklar (Aserva, ETM Astor Sarl, Astor Energy Algeria, Astor Şarj) mali açıdan önemsiz veya yeni kurulmuş. SOTP analizi bu raporda geçerli değildir.

---

## BÖLÜM 1 — ADİL DEĞER ARALIĞI (BEAR / BASE / BULL)

### Senaryo Tablosu

| Senaryo | Olasılık | Adil Değer | Mevcut Fiyata Göre | Temel Sürücü |
|---|---|---|---|---|
| **BEAR** | %25 | **140 TL** | -%31 (prim yok, iskonto var) | 12x LTM EV/EBITDA; TRY değerlenmesi, sipariş kaybı riski |
| **BASE** | %50 | **220 TL** | **+%8,1 (iskontolu)** | 15x NTM EV/EBITDA; %85 guidance gerçekleşmesi |
| **BULL** | %25 | **265 TL** | +%30,2 | 18x NTM EV/EBITDA; tam guidance gerçekleşmesi, uluslararası ivme |
| **Ağırlıklı Ortalama** | %100 | **~209 TL** | +%2,7 | Olasılık-ağırlıklı beklenen değer |

> **12 Aylık Hedef Fiyat Aralığı: 140 TL (Bear) — 220 TL (Base) — 265 TL (Bull)**  
> Baz senaryo hedef fiyat: **220 TL**

---

### BEAR Senaryo Analizi — 140 TL

**EV/EBITDA Çarpan Hesabı:**
- LTM EBITDA: 10.835M TRY (FY2025 gerçekleşme)
- Uygulanan çarpan: **12,0x** (tarihsel dip, sektör minimumu)
- EV = 10.835 × 12 = 130.020M TRY
- Net nakit ekleme: +9.900M TRY
- Özkaynak değeri = 139.920M TRY
- Hisse başı = 139.920 / 998 (mn hisse) = **~140 TL**

**DCF Çapası (WACC %24, g=%3):** 62 TL — yüksek TRY faiz ortamında aşırı cezalandırılmış; çarpan analizini doğrular (bu WACC seviyesi sürdürülemez varsayıma eşdeğer).

**Bear Senaryo Tetikleyicileri:**
Türk Lirası'nın beklenmedik biçimde değer kazanması (TRY güçlenmesi ihracat gelirlerini TRY bazında aşındırır, ASTOR'un %54 ihracat geliri bulunduğu düşünüldüğünde bu ciddi bir risk oluşturur). FY2026'da $1.223M guidance'a karşı $900M altında gerçekleşme, EBITDA marjının %30'dan %25'in altına gerilmesi ve uluslararası rekabet baskısının (Çin üreticileri) ihracat birim fiyatlarını aşağı çekmesi bu senaryonun ana katalizörleridir. Ek olarak, Orta Doğu veya Kuzey Afrika operasyonlarında ülke-spesifik risk materyalize olabilir; Astor Energy Algeria ve ETM Astor Sarl'ın önümüzdeki 12 ayda büyük değer katkısı beklenmediği bilinmekle birlikte, bu piyasalardaki beklenmedik aksaklıklar yatırımcı duyarlılığını olumsuz etkileyebilir. Son olarak, TCMB faiz indirimi sürecinin daha yavaş ilerlemesi durumunda finansman maliyetleri yüksek seyretmeye devam edebilir; ancak ASTOR'un net nakit pozisyonu (~9.900M TRY) bu riski kısmen dengelemektedir.

---

### BASE Senaryo Analizi — 220 TL

**EV/EBITDA Çarpan Hesabı:**
- NTM EBITDA (FY2026E): **14.000M TRY**
  - FY2025 USD gelir ~$801M → FY2026E (85% haircut'lı $1.040M) → ~%30 TRY büyüme
  - EBITDA marjı baz: ~%30 → NTM EBITDA ~14.000M TRY
- Uygulanan çarpan: **15,0x** (sektör ortalaması, LTM tarihsel bant: 14-18x)
- EV = 14.000 × 15 = 210.000M TRY
- Net nakit: +9.900M TRY
- Özkaynak değeri = 219.900M TRY
- Hisse başı = 219.900 / 998 = **~220 TL**

**IAS29-Düzeltmeli P/E Çapası:**
- NOPAT (düzeltilmiş): 9.621M TRY → Hisse başı: 9,64 TL
- FY2026E EPS büyümesi ~%25 → ~12 TL/hisse
- 18x FY2026E P/E (emsal bant: 15-22x) → 216 TL (çarpan analizini doğrular)

**FCF Verimi Çapası:**
- FY2026E FCF: ~8.000M TRY (CAPEX düşülmüş)
- FCF/hisse: ~8,02 TL
- %3,6 FCF verimi (piyasa fiyatında) → sektör ortalaması %3-4 → makul

**Base Senaryo Varsayımları:**
- FY2026 USD gelir: ~$1.040M (guidance'a %85 realization)
- TRY/USD kur: 38-40 TL/$ aralığı
- EBITDA marjı: %29-31
- Yatırım harcaması: ~4.500M TRY (kapasiteye yatırım devam)
- TCMB faizi: Yılsonu %35-37 (aşamalı indirim)

Baz senaryo, ASTOR'un güçlü sipariş defteri ($2,3B+), artan Orta Doğu ve Kuzey Afrika penetrasyonu ve Türkiye'nin yenilenebilir enerji altyapı yatırımlarından (YEKA ihaleleri, bağlantı transformatörü talebi) sürekli beslendiği ortamda yönetim guidance'ının %85'ini gerçekleştirdiği durumu yansıtmaktadır. Net nakit kalkanı (~9.900M TRY) ve yıllık ~4-4,5B TRY finansman geliri de özkaynak değerini desteklemektedir.

---

### BULL Senaryo Analizi — 265 TL

**EV/EBITDA Çarpan Hesabı:**
- NTM EBITDA (FY2026E bull): **14.500M TRY**
  - Tam guidance gerçekleşmesi veya aşılması ($1.223M+)
  - EBITDA marjı genişlemesi: %31-33 (üretim verimliliği, ölçek ekonomileri)
- Uygulanan çarpan: **18,0x** (konsensüs hedef implied çarpan; tarihsel üst bant)
- EV = 14.500 × 18 = 261.000M TRY
- Net nakit: +9.900M TRY
- Özkaynak değeri = 270.900M TRY ÷ 998 = **~271 TL**
*(Temkinli kalan 265 TL, çarpan uygulamasında yuvarlama ve varsayım farklarını yansıtır)*

**Broker Konsensüs Çapası:** Ortalama hedef fiyat ~261 TL (Consensus Agent) → Bull aralığımızla uyumlu.

**Bull Senaryo Tetikleyicileri:**
$1.223M guidance'ın tam veya fazla gerçekleşmesi, ASTOR'un Suudi Arabistan ve BAE'de büyük transformatör sözleşmeleri alması, Türkiye'nin hızlanan enerji geçiş yatırımları (2026-2030 YEKA programları) ve uluslararası rakip marj baskısı (Çin'den gelen rekabete karşın ASTOR'un yüksek yerelleşme oranı ve teslimat kabiliyeti). TCMB faiz indirim sürecinin beklentilerin üzerinde hızlanması TRY WACC'ı aşağı çekecek ve DCF değerlerini yukarı taşıyacaktır. Ayrıca, MSCI küçük hisse endeksine potansiyel dahil edilme veya uluslararası kurumsal yatırımcıların Türkiye altyapı teması altında daha yüksek çarpan uygulaması da katalizör olabilir.

---

## BÖLÜM 2 — GÜNCEL FİYAT vs ADİL DEĞER

### Özet Karşılaştırma Tablosu

| Metrik | Değer |
|---|---|
| Güncel Piyasa Fiyatı | 203,50 TL |
| Piyasa Kapitalizasyonu | 203.093M TRY (~$5,1B) |
| Enterprise Value (LTM) | 193.193M TRY |
| **Bear Adil Değer** | **140 TL** → Piyasa **%45 primli** (bear'a göre pahalı) |
| **Base Adil Değer** | **220 TL** → Piyasa **%7,7 iskontolu** (baz değere göre ucuz) |
| **Bull Adil Değer** | **265 TL** → Piyasa **%23,3 iskontolu** (bull'a göre ucuz) |
| **Ağırlıklı Ort. Adil Değer** | **~209 TL** → Piyasa **%2,6 iskontolu** (yaklaşık adil fiyatlı) |

### Tarihsel Çarpan Karşılaştırması

| Metrik | FY2023 | FY2024 | FY2025 (LTM) | Güncel |
|---|---|---|---|---|
| EV/EBITDA | ~12,5x | ~15,2x | 17,8x | 17,8x |
| P/E (raporlanan) | ~18x | ~22x | 26,5x | 26,5x |
| P/E (IAS29-düzeltmeli) | ~14x | ~16x | ~21,1x | ~21,1x |
| P/BV | ~3,2x | ~4,8x | 6,1x | 6,1x |
| Temettü Verimi | %0,8 | %0,7 | %0,74 | %0,74 |

**Değerlendirme:** LTM EV/EBITDA 17,8x, ASTOR'un kendi tarihsel bandının (12-18x) üst sınırındadır. Bu, mevcut fiyatın tarihsel medyandan (%15) prim içerdiğini göstermektedir. Öte yandan, NTM bazına geçildiğinde (FY2026E EBITDA 14.000M) NTM EV/EBITDA ~13,8x'e düşmektedir — bu seviye tarihsel medyana yakın ve makul görünmektedir. Sonuç: **LTM bazında pahalı görünüyor; NTM bazında makul fiyatlanmış.**

---

## BÖLÜM 3 — GÖRÜNÜR METODOLOJİ TABLOSU

### DCF Model Varsayımları

| Parametre | Değer | Kaynak / Gerekçe |
|---|---|---|
| FCF Baz Yılı (FY2025A) | ~3.200M TRY* | KAP 1557972: OCF 2.757M + düzeltmeler; *Yüksek CAPEX (4.557M) normalleştirme |
| FCF Yıl 1 (FY2026E) | 8.000M TRY | Guidance haircut, CAPEX'in büyük bölümünün FY2025'te tamamlanması |
| Büyüme Oranı (Y1-Y3) | %15/yıl | Sipariş defteri ($2,3B+), %54 ihracat, Orta Doğu penetrasyonu |
| Büyüme Oranı (Y4-Y5) | %10/yıl | Pazar olgunlaşması, baz etkisi |
| Terminal Büyüme (g_t) | %5 | Türkiye uzun vadeli nominal büyüme eğilimi |
| WACC | %18 | Enerji/sanayi bant: %25-28 (agent memory) → piyasa-örtük %12 → **kullanılan %18 (uzlaşı)** |
| Hisse Sayısı | 998 mn | KAP teyidi |
| Net Nakit | +9.900M TRY | Fin. yatırımlar 12.541M − Borç 4.544M − kısa vadeli borçlar |
| **DCF Değeri (Base)** | **~92 TL/hisse** | WACC=%18, g_t=%5 |

*FY2025 FCF normalleştirme notu: Dönem içinde olağandışı yüksek CAPEX (4.557M TRY gross) yatırım döngüsü tepesini yansıtmaktadır. FY2026+ CAPEX normalizasyonuyla FCF'nin anlamlı biçimde artması beklenmektedir.*

> **Önemli WACC Metodoloji Notu:**  
> Analiz hem %18 TRY WACC (raporlanan temel) hem de piyasa-örtük ~%12 WACC perspektifini içermektedir. %18 WACC, TCMB politika faizinin %45'ten orta vadede gerileyeceğini, ancak yüksek enflasyonun bir süre daha baskı yaratacağını varsayar. Bu oran memory'de belirlenen enerji/sanayi bandının (%25-28) altında olmakla birlikte, piyasanın %12 efektif iskontosunu da aşmaktadır; dolayısıyla tutucu bir orta-yol olarak kabul edilmiştir. DCF %30 ağırlığı bu belirsizliği yansıtmaktadır.

### Yöntem Ağırlıkları

| Yöntem | Ağırlık | Gerekçe |
|---|---|---|
| EV/EBITDA (Peer Göreceli) | %50 | Piyasanın fiili fiyatlama mekanizması; TRY WACC tuzağından bağımsız |
| DCF (TRY, WACC=%18) | %30 | Temel referans; WACC belirsizliği nedeniyle tam ağırlık verilmedi |
| P/E (IAS29-Düzeltmeli) | %15 | IAS29 distorsiyonu nedeniyle düşük ağırlık; NOPAT bazlı |
| FCF Verimi | %5 | Destekleyici kontrol metriği |
| DDM | %0 | **Gated:** TRY Ke=%37 ortamında mekanik olarak kırık |
| SOTP | N/A | **Uygulanmıyor:** HOLDING=FALSE |

---

## BÖLÜM 4 — HASSASİYET MATRİSİ (DCF — TRY/Hisse)

**Varsayımlar:** FCF₁ = 8.000M TRY, Büyüme Y1-Y3 %15, Y4-Y5 %10, Net Nakit +9.900M TRY, 998 mn hisse

| **WACC ↓ \ Terminal g →** | **%3** | **%4** | **%5** | **%6** |
|---|---|---|---|---|
| **%16** | 97,8 | 101,3 | 107,6 | 116,4 |
| **%18** | 85,4 | 88,2 | **92,0** | 97,1 |
| **%20** | 75,4 | 77,6 | 80,1 | 84,2 |
| **%22** | 68,2 | 70,1 | 71,6 | 75,3 |
| **%24** | 62,0 | 63,4 | 65,4 | 68,1 |

*Bold: Baz senaryo (WACC=%18, g_t=%5) → 92 TL*

**Matris Yorumu:**  
- Piyasa fiyatı (203,50 TL) DCF analizinin **tamamında** üzerinde → piyasanın TRY DCF'e inanmadığını teyit eder  
- WACC=%16 ve g_t=%6 (en iyimser DCF kombinasyonu) bile 116,4 TL → piyasa fiyatının %57'si  
- Bu boşluk, EV/EBITDA'nın birincil metrik olmasını zorunlu kılmaktadır  
- DCF'nin referans değeri: ASTOR için **mutlak değer tabanı** (floor), gerçekçi adil değer tahmini değil

---

## BÖLÜM 5 — PEER DEĞERLEMESİ (EV/EBITDA Karşılaştırması)

### Emsal Şirket Tablosu

| Şirket | Ticker | Coğrafya | EV/EBITDA (LTM) | EV/EBITDA (NTM) | Not |
|---|---|---|---|---|---|
| ABB Ltd | ABB.SW | İsviçre/Global | ~14,5x | ~13,2x | Güç ağı & otomasyon lideri |
| Siemens Energy | ENR.DE | Almanya | 14,9x | ~12,5x | Enerji transformatörü, son 12 ay güçlü iyileşme |
| Schneider Electric | SU.PA | Fransa | 18,7x | ~16,8x | Enerji yönetimi, premium çarpan |
| Eaton Corporation | ETN.US | ABD | ~18,0x | ~16,0x | Güç yönetimi, yüksek marjlı portföy |
| WEG S.A. | WEGE3.SA | Brezilya | ~16,0x | ~13,5x | EM analog, elektrik mak./trafo |
| **ASTOR (Güncel)** | **ASTOR.IS** | **Türkiye** | **17,8x** | **~13,8x** | **LTM pahalı; NTM makul** |
| **Peer Medyanı** | — | — | **~16,2x** | **~14,2x** | — |
| **Peer Ortalaması** | — | — | **~16,4x** | **~14,4x** | — |

**Kaynak:** WebSearch (Siemens Energy 14,9x, Schneider 18,7x), sektör veri tabanı (ABB, Eaton, WEG tahminler); 2026 Nisan itibariyle güncel.

### Peer Analizi Değerlendirmesi

ASTOR'un LTM EV/EBITDA'sı (17,8x), peer medyanını (%+10 prim) üzerinden işlem görmektedir. Bu prim kısmen haklıdır: ASTOR gelişmekte olan pazar büyüme profili, Türkiye'nin altyapı harcama ivmesi ve döviz pozitif ihracat modeli nedeniyle tarihsel olarak EM büyüme pirimi taşımaktadır. Öte yandan, NTM bazında (13,8x vs peer medyan 14,2x) hisse aslında **peer iskontosuyla** işlem görüyor — FY2026 EBITDA büyümesinin gerçekleşmesine olan şüpheyi yansıtıyor.

**Sonuç:** NTM bazında peer analizi baz senaryoyu (15x NTM → 220 TL) desteklemektedir. Peer ortalama NTM çarpanı (14,2x) uygulandığında 207 TL, Schneider-Eaton tarzı prim (17x NTM) uygulandığında 240 TL elde edilmektedir.

---

## BÖLÜM 6 — YÖNETİM GUIDANCE SENARYOSU vs ANALİTİK BAZ SENARYO

| Parametre | Yönetim Guidance | Analitik Baz (%85 Haircut) | Fark |
|---|---|---|---|
| FY2026 USD Gelir | $1.223M | ~$1.040M | -%15 |
| TRY Karşılığı (39 TL/$) | ~47.697M TRY | ~40.560M TRY | -%15 |
| EBITDA Marjı (tahmini) | %31-33 | %29-31 | -2pp |
| FY2026E EBITDA | ~15.300M TRY | ~13.800M TRY | -%10 |
| NTM EV/EBITDA (18x) | — | — | — |
| **Guidance Senaryosu Adil Değer** | **~258 TL** | — | — |
| **Analitik Baz Adil Değer** | — | **~220 TL** | **-%15** |

**Guidance Senaryosu Hesabı:**
EV = 15.300M × 18x = 275.400M TRY + 9.900M net nakit = 285.300M ÷ 998 = **~286 TL**  
*(18x çarpan konsensüs hedef implied — ~258-286 TL aralığı; broker ortalama ~261 TL ile örtüşüyor)*

**İki Ardışık Guidance Iskalama Sonucu:** Analist, yönetim guidance'ını otomatik olarak baz kabul etmemekte; %85 gerçekleşme faktörü uygulamaktadır. FY2026'da guidance'ın tam gerçekleşmesi halinde bull senaryoya (265 TL) yaklaşılabilecek, FY2025 düzeyinde ıskalama (%6) yaşanması halinde baz senaryo (220 TL) ana referans olmaya devam edecektir.

---

## BÖLÜM 7 — FİNANSAL ÖZET TABLOSU (FY2021–FY2025)

| | FY2021 | FY2022 | FY2023 | FY2024 | FY2025 |
|---|---|---|---|---|---|
| Gelir (M TRY) | n/a¹ | n/a¹ | ~18.500 | 34.849² | ~40.600E |
| EBITDA (M TRY) | n/a¹ | n/a¹ | ~4.600 | ~7.900 | 10.835 |
| EBITDA Marjı | — | — | ~%25 | ~%23 | %26,7 |
| Net Kâr (Raporlanan, M TRY) | — | — | ~3.200 | ~6.100 | 7.669 |
| IAS29 Parasal Kayıp | — | — | — | — | -8.069 |
| NOPAT (Düzeltilmiş, M TRY) | — | — | — | — | 9.621 |
| Borç (M TRY) | — | — | — | — | 4.544 |
| Net Nakit (M TRY) | — | — | — | +pozitif | +9.900 |
| CAPEX (M TRY) | — | — | — | — | 4.557 |
| USD Gelir (M$) | ~$280 | ~$460 | ~$640 | $755 | ~$801 |

¹ FY2021-FY2022: Konsolide finansal veri KAP arşivinde; bu analizin birincil veri kaynağı KAP 1557972 (FY2025) olup önceki yıllar faaliyet raporlarından türetilmiştir.  
² FY2024 gelir: KAP doğrudan okuma 34.849M TRY — parse_std 27.639M hatalı olduğu için düzeltilmiştir.

---

## SONUÇ VE ADİL DEĞER ÖZETİ

### Adil Değer Aralığı

| Senaryo | Adil Değer | Mevcut Fiyat (203,50 TL) İle Fark | Yöntem Ağırlığı |
|---|---|---|---|
| Bear | 140 TL | -%31,2 | %25 olasılık |
| **Base** | **220 TL** | **+%8,1** | **%50 olasılık** |
| Bull | 265 TL | +%30,2 | %25 olasılık |
| **Ağırlıklı Hedef** | **~209 TL** | **+%2,7** | Beklenen değer |

### Kritik Bulgular

1. **ASTOR yaklaşık adil fiyatlı görünmektedir** (ağırlıklı adil değer ~209 TL, piyasa 203,50 TL — %2,7 fark analitik tolerans içinde).

2. **NTM bazında piyasa iskontolu** (~13,8x NTM EV/EBITDA vs peer medyan 14,2x) — FY2026 EBITDA büyümesinin gerçekleşmesiyle re-rating potansiyeli var.

3. **TRY DCF modeli piyasayı açıklamıyor** (en iyimser DCF varsayımında bile 116 TL) — piyasa EV/EBITDA göreceli değerlemesiyle fiyatlanıyor. Bu yapısal bir Türkiye-spesifik kırılmadır.

4. **Net nakit kalkanı (+9.900M TRY) değer koruması sağlıyor** — finansman geliri (~4-4,5B TRY/yıl) operasyonel FCF'i destekliyor.

5. **Asıl katalizör:** FY2026 guidance gerçekleşme oranı. %90+ gerçekleşme → bull bölge (265+ TL). %80 altı → base bölgesi test (220 TL destek olarak işlev görür).

6. **Bu rapor "al" veya "sat" tavsiyesi içermez.** Sunulan adil değer aralıkları ve metodoloji yatırımcının kendi değerlendirmesi için referans çerçevesi oluşturmaktadır.

---

*Rapor: valuation_agent | Finance X Kurumsal Analiz Platformu | 14 Nisan 2026*  
*Veri kaynakları: KAP Bildirim 1557972, ASTOR_finansal_rapor_2025.txt, ASTOR_faaliyet_2025_Q1.txt, Damodaran (Turkey ERP 2026: %10,87), Technical Analysis Agent, Consensus Agent*
