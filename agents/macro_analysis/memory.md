# Macro Analysis Agent — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | Macro Analysis Agent |
| Uzmanlık | Makroekonomik Analiz |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim/Görev | 4 (2 eğitim + 2 gerçek görev) |
| Ortalama Öğrenme Puanı | 88.5/100 |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Enflasyon | 5 | CPI/PPI dinamikleri, IAS 29 hyperinflation accounting, energy inflation transmission |
| Faiz politikası | 5 | TCMB mekanizmaları, reel faiz hesaplaması, banka NIM etkisi, refinancing risk |
| Döviz kurları | 6 | FX transmission channels, export/import impact modeling, net FX position analysis |
| Büyüme göstergeleri | 4 | GDP forecasting, sektörel büyüme analizi, construction sector linkage |
| Para politikası | 5 | Policy reversal dynamics, credit transmission, leverage impact |
| Şirket-Makro Bağlantı | 7 | Holding segment-level macro impact, energy-intensive industry cost modeling, export market weakness transmission |
| Jeopolitik Analiz | 6 | Geopolitical → Energy → COGS chain, supply disruption modeling, ceasefire fragility assessment |
| Enerji Piyasaları | 5 | Energy price transmission to energy-intensive industries, natural gas/electricity cost modeling |

---

## Öğrenme Geçmişi

### [2026-04-10] Gece Eğitimi #1 — Türkiye Makroekonomik Göstergeler 2026

3 web search yapıldı.

**Öğrenilen Bilgiler:**
- TCMB faizi %38 → %37 (Nisan 2026); 2026 sonu enflasyon hedefi %16
- 2026 büyüme beklentisi: %3.7; milli gelir $1.538T (2025 Q3)
- Sonraki adım: TCMB EVDS API entegrasyonu

**KPI:** 3/3 sorgu | Puan: 82/100

---

### [2026-04-10] Gerçek Görev #1 — KCHOL Makro Analizi

9 web search yapıldı.

**Kalıcı Öğrenmeler:**

1. **Merkez Bankası Policy Reversal:** TCMB %37 → %46 (+900 baz puan) tek seferde sıkılaştırdı. Ders: Forward guidance ani kriz durumunda terk edilebilir.

2. **PPI > CPI = Margin Compression:** PPI +2.30% vs CPI +1.94% (Mart 2026) = +36 bps spread. Ders: PPI-CPI spread, şirket marj baskısını öngörmek için önde gelen göstergedir.

3. **IAS 29 / TAS 29:** TAS 29 (yerel) 2025-2027 için 7571 sayılı yasa ile askıya alındı; IAS 29 (IFRS) hâlâ geçerli olabilir. Ders: Yerel muhasebe ile IFRS ayrımına dikkat et.

4. **Holding FX Exposure:** Konsolide "48% hard-currency revenue" yanıltıcı olabilir. Segment bazında net FX pozisyonu hesapla (Automotive: pozitif / Energy: negatif / Finance: negatif → Net: yaklaşık nötr). Ders: Holding'lerde segment-level FX analizi zorunludur.

5. **NPL Lagging Indicator:** %46 faiz ortamında NPL %2.7 unsustainably düşük. 6-12 ay içinde %4-5'e sıçrama beklenir. Ders: NPL'ler gecikmiş göstergedir; faiz artışından 2-3 çeyrek sonrasını takip et.

**KPI:** 9/9 sorgu | 16 kaynak | Puan: 90/100

---

### [2026-04-10] Gerçek Görev #2 — SISE (Şişecam) Makro Analizi

8 web search yapıldı.

**Kalıcı Öğrenmeler:**

1. **Geopolitical → Energy → COGS Zinciri:** İran-ABD Savaşı → Hürmüz kapalı → Türkiye doğalgaz +%18.61 / elektrik +%5.8. SISE'ye etki: ~6.2B TRY ek maliyet, -3.3pp gross margin riski. Ders: Energy-intensive sektörler (cam, çimento, çelik) için jeopolitik analiz ZORUNLUDUR.

2. **Energy Cost Modeling:** Cam üretiminde enerji ~%25 COGS. Weighted impact = (energy cost × % zam). Ders: Enerji fiyat değişimini her zaman COGS'e modellemek gerekir.

3. **Export Market Macro:** SISE uluslararası gelir %59 → %49 (Q4), Avrupa GDP ~%1. Export-heavy şirketler için hedef pazar GDP/PMI önde gelen göstergedir.

4. **Ceasefire Fragility:** Ateşkes "resolved" sayılmaz. "Fragile, ongoing risk" olarak işaretlenmeli; stabilite doğrulanmadan kapatılmaz.

5. **Multi-Geography Divergence:** Türkiye inşaat +%5.45 vs Avrupa %1 → iç/dış pazar macro'su ayrı analiz edilmeli, net effect hesaplanmalı.

**CEO Feedback:** Güçlü: jeopolitik → enerji → COGS zinciri, 40+ kaynak. Eksik: PPI TÜİK/EVDS'den direkt çekilmeli; BDDK sektörel kredi eklenmeli; pricing power için "spekülatif" denmeyip proxy inference yapılmalı.

**KPI:** 8/8 sorgu | 40+ kaynak | Puan: 92/100

---

## CEO Feedback — ASELS Raporu (2026-04-10)

**Kural (Kalıcı):** Savunma / havacılık / güvenlik sektöründeki her şirket için Jeopolitik Analiz bölümü ZORUNLUDUR. ASELS analizinde bu bölüm eksikti; jeopolitik olaylar savunma şirketleri için doğrudan talep, ihracat ve fiyatlama gücü etkisi yaratır. Bir sonraki savunma şirketi analizinde jeopolitik bölüm olmadan rapor CEO onayına gitmeyecek.

**Şirket Jeopolitik Analiz Zorunluluğu Tetikleyicileri:**
- Sektör: savunma, havacılık/uzay, güvenlik elektroniği, silah/mühimmat
- Müşteri tabanı: TSK, SSB, NATO ülkeleri
- Ürün portföyü: radar, füze, elektronik harp, zırhlı araç

**Zorunlu bölümler:** A) Aktif bölgesel çatışmalar → B) Savunma talebi etkisi → C) Şirket ürün-jeopolitik uyumu → D) Jeopolitik riskler (ihracat lisansı, ödeme, ambargo)

---

## Birikimli Bilgi Bankası

### Anahtar Kavramlar

**PPI-CPI Spread:** PPI > CPI ise üreticiler maliyeti tüketiciye yansıtamıyor → gross margin compression. İzleme: spread >0.3pp = kırmızı alarm.

**Reel Politika Faizi:** Nominal − CPI. >+5% = çok sıkı. Nisan 2026: +%11.5 → yüksek refinancing + NPL baskısı.

**FX Transmission Channels:** Export Revenue (+) / Import Cost (−) / Balance Sheet FX debt (−) / NPL-FX borçlu TRY gelirli (−). Holdingler için segment bazında netleştir.

**IAS 29:** Kümülatif 3-yıl enflasyon >%100 = hyperinflation. TAS 29 (yerel) 2025-2027 askıda (7571 sayılı yasa); IAS 29 (IFRS) hâlâ geçerli.

**NPL Lagging Indicator:** Faiz artışından 6-12 ay sonra NPL sıçrar. Cari oran düşükse forward-looking tahmin yap.

**Pricing Power Inference:** Doğrudan veri yoksa proxy kullan: gross margin trend + PPI-CPI spread + revenue hacim/fiyat ayrıştırması + müşteri konsantrasyonu.

### Veri Kaynakları

| Kaynak | URL | Kullanım |
|---|---|---|
| TCMB | tcmb.gov.tr / evds2.tcmb.gov.tr | Faiz, enflasyon raporu, historical rate path |
| TÜİK | data.tuik.gov.tr | CPI, PPI, GDP, sektörel veri |
| BDDK | bddk.org.tr/BultenAylik | Kredi hacmi, NPL, sektörel kredi kırılımı |
| KAP | kap.org.tr | Kamuyu aydınlatma, finansal tablolar |
| Trading Economics | tradingeconomics.com/turkey | Konsolide makro dashboard, FX |
| OSD | osd.org.tr | Otomotiv üretim ve ihracat |

**PPI Protokolü:** TÜİK → TCMB EVDS → Bloomberg. Güncel ay yayınlanmadıysa tarihi belirt.

**BDDK Sektörel Kredi:** Toplam → Kurumsal (İmalat / İnşaat / Hizmet) → Tüketici

---

## KPI Takip Tablosu

| Tarih | Görev | Sonuç | Puan |
|---|---|---|---|
| 2026-04-10 | Gece Eğitimi #1 | 3/3 sorgu, TCMB/TÜİK veri çekildi | 82/100 |
| 2026-04-10 | KCHOL Görev #1 | 9/9 sorgu, 16 kaynak, segment-level macro linkage | 90/100 |
| 2026-04-10 | SISE Görev #2 | 8 paralel sorgu, 40+ kaynak, geopolitical + energy-intensive modelleme | 92/100 |
| 2026-04-11 | Gece Eğitimi #4 | TCMB/BDDK Nisan 2026, holding consolidation methodology | 90/100 |

---

## Güçlü Yönlerim

1. **Sistematik Araştırma:** Paralel web search ile tüm macro katmanları (para, enflasyon, FX, büyüme, kredi) kapsamlı taranıyor
2. **Kaynak Doğrulama:** Her iddia için birincil kaynak (TCMB, TÜİK, BDDK) ile URL cite ediliyor
3. **Şirket-Makro Bağlantı:** Segment-level FX ve marj transmission analizi (holding yapılarına özgü)
4. **Forward-Looking Analiz:** NPL ve risk tahminlerinde lagging indicator sınırını aşarak öngörü yapılıyor

## Gelişim Alanlarım

1. **EVDS API Entegrasyonu:** Manuel web search yerine TCMB EVDS'den programmatic veri çekme
2. **Parametrik Senaryo Modellemesi:** "TRY %20 depreciation → EPS -X%" düzeyinde quantitative senaryolar
3. **Peer Benchmarking:** Macro sensitivity karşılaştırmalı analiz (örn. KCHOL vs SAHOL/DOHOL)
4. **Real-Time Monitoring:** KAP/TCMB duyurularını otomatik takip

---

## [2026-04-11] Gece Eğitimi #4 — TCMB/BDDK Nisan 2026 Güncellemeleri

**Konu:** TCMB faiz politikası April 2026, BDDK düzenlemeler, holding-level consolidation  
**Sorgular:** 2 web araştırma sorgusu kullanıldı  
**Öğrenme Puanı:** 90/100

**Öğrenilen Dersler:**

1. **TCMB Nisan 2026 Durum:**
   - **Policy rate:** %37 (Mart 2026'da hold, 5 ardışık indirimden sonra ilk duraklama)
   - **Sonraki MPC toplantısı:** 22 Nisan 2026
   - **2026 enflasyon hedefi:** %16 (band %13-19'dan %15-21'e genişletildi)
   - **Governör Karahan signal:** "Mart ve Nisan verilerini görmek gerekli" → Nisan toplantısında da hold beklentisi
   - **Rationale:** Higher energy prices'ın Turkish economy'ye etkisi → tight monetary stance sürecek
   - Ders: Macro analiz yaparken "policy stance tightness" artık %37 hold üzerinden değerlendirilmeli (önceki görevlerde %37 → %46 sıkılaştırma vardı, şimdi hold modu)

2. **BDDK 2026 Regulatory Changes (1 Nisan 2026 yürürlük):**
   - **Minimum CAR:** %12 (with capital buffer) — önceki %8'den yükseltilmiş
   - **Overdraft credit conversion factor:** %10 (unused overdraft limits için CAR calculation'da) — regulator bunu 3 katına kadar çıkarabilir
   - **Macroprudential tightening:** Credit card, personal loan, mortgage LTV, restructuring rules hepsi sıkılaştırıldı
   - **Reserve requirements:** TCMB ve BDDK simultane measures — consumer lending ve bank balance sheet restrictions
   - Ders: AKBNK/YKBNK gibi banka analizlerinde CAR %12 minimum artık zorunlu (CEO feedback'te flaglenen "BDDK regulatory changes eksik" sorunu artık çözülebilir)

3. **Banking Sector Transmission Mechanism (2026 Update):**
   - CAR %12 minimum + %10 overdraft credit conversion → banks'in lending capacity kısıtlanıyor
   - Reserve requirement artışı → funding cost increase → NIM pressure (ama policy rate hold → NIM stabilization)
   - Credit growth limits + macroprudential measures → real credit growth yavaşlar
   - Ders: Banka analizlerinde "nominal credit growth - inflation = real credit growth" hesabı artık ZORUNLU (CEO feedback'te flaglendi)

4. **Holding-Level Consolidated Impact Methodology:**
   - Segment-level macro impacts var (KCHOL görevlerinde yapıldı) AMA konsolide impact hesabı eksikti
   - Formula: Weighted average = Σ(segment EBITDA contribution % × segment macro impact %)
   - Example: TUPRS +20% EBITDA (oil windfall) × 40% contribution + ARCLK -15% (energy cost) × 15% contribution = net +5.75% KCHOL impact
   - Ders: Sonraki holding analizlerinde bu calculation ZORUNLU (CEO feedback #2'de istenmişti)

5. **Currency Mismatch Consolidated Analysis:**
   - Her segment FX exposure ayrı analiz edilmişti (KCHOL: TUPRS export-heavy +, ARCLK import-heavy -, YKBNK net FX asset position)
   - AMA consolidated net FX position hesaplanmamıştı
   - Methodology: Σ(segment net FX position) → TL %10 depreciation scenario → consolidated equity impact (TRY billions)
   - Ders: Multi-currency holdings için consolidated FX sensitivity scenario ZORUNLU

**Güncel Veri Bankası (11 Nisan 2026):**
- TCMB policy rate: %37 (hold since Mart 2026)
- 2026 inflation target: %16 (band %15-21)
- Next MPC meeting: 22 Nisan 2026
- BDDK minimum CAR: %12 (with buffer)
- Overdraft credit conversion factor: %10 (since 1 Nisan 2026)

**CEO Feedback'lerden Alınan Aksiyonlar:**
- ✅ BDDK regulatory changes artık güncel (CAR %12, overdraft factor %10)
- ✅ Real credit growth metodolojisi artık net (nominal - inflation)
- ✅ Holding consolidated impact methodology hazır (weighted average formula)
- ✅ Consolidated FX sensitivity framework hazır (segment positions aggregate edilecek)

---

## CEO Geri Bildirimi — 2026-04-10 — AKBNK Raporu

### Eksikler:
- **Sektör-spesifik transmission mekanizması yüzeysel:** NIM transmission iyi ama banking sector liquidity, BDDK regulatory changes (reserve requirements, loan-to-deposit limits), credit cycle dynamics eksik
- **TL/USD balance sheet exposure eksik:** AKBNK'ın TL vs FX varlık/yükümlülük breakdown'ı yok — currency mismatch riski analiz edilmemiş
- **Inflation impact on real credit growth eksik:** Nominal kredi %47 büyümüş ama reel olarak ne kadar? Enflasyon arındırılmış kredi büyümesi hesaplanmamış
- **TCMB reserve requirements değişimi eksik:** Reserve requirement ratio değişiklikleri bankaların fonlama maliyetini etkiler — araştırılmamış
- **Banking sector systemic risk analizi eksik:** AKBNK systemically important bank mi? Türk bankacılık sektörü concentration riski, interbank exposure gibi konular eksik

### Bundan Sonra:
- Banka analizlerinde BDDK regulatory changes ZORUNLU — reserve requirements, CAR minimums, NPL classification rules, loan growth limits
- Balance sheet currency mismatch analizi ekle — TL/FX breakdown, net FX position, depreciation scenarios
- Real credit growth hesapla — nominal growth - inflation = real growth
- Banking sector systemic risk bölümü ekle — concentration, interbank exposure, regulatory oversight
- Credit cycle pozisyonunu belirle — expansion mı contraction mı, NPL formation risk nerede?

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Pozitif Noktalar:
- ✅ Jeopolitik analiz VAR ve DETAYLI — İran-ABD savaşı, ceasefire fragility, Hormuz disruption, oil price impact — hepsi analiz edilmiş
- ✅ Segment-level macro transmission VAR — TUPRS (refining margin windfall), TOASO (export boost), ARCLK (energy cost hit), YKBNK (NIM), THYAO (tourism collapse) — her segment için ayrı analiz
- ✅ Scenario matrix VAR — 40% ceasefire holds, 35% status quo, 25% re-escalation — quantified probabilities
- ✅ 40+ kaynak cite edilmiş — TCMB, TÜİK, web sources tümü kaynaklı

### Eksikler:
- **Holding-level consolidated impact eksikliği:** Segment etkileri var ama konsolide KCHOL EBITDA/net income impact nedir? (örn: TUPRS +X%, ARCLK -Y% → net KCHOL +Z%)
- **Portfolio diversification benefit quantification yok:** Holding çeşitlendirmesi makro şoklara karşı nasıl bir buffer sağlıyor? Correlation analysis eksik
- **Currency mismatch analizi yüzeysel:** Her segment FX exposure ayrı var ama konsolide net FX position ve TL depreciation scenario eksik

### Bundan Sonra:
- Holding şirketlerinde segment-level + CONSOLIDATED impact hesapla — segment ağırlıkları ile weighted average impact ver
- Diversification benefit quantify et — segment correlation analysis (TUPRS oil price +, ARCLK oil price -) → net portfolio volatility reduction
- Multi-currency exposure holdings için consolidated FX sensitivity analysis: TL %10 depreciation → KCHOL consolidated EBITDA/equity impact nedir?
- Segment macro impact'lerini revenue/EBITDA contribution ağırlıklarıyla birleştir — örn: TUPRS EBITDA'nın %40'ı, +20% TUPRS impact → KCHOL +8%

---

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu (#2)

### Pozitif Noktalar ✅:
- **Jeopolitik analiz MÜKEMMELl** — İran-ABD savaşı, ceasefire fragility, Hormuz disruption, oil price scenarios — hepsi detaylı, 40+ kaynak cite edilmiş
- **Segment-level macro transmission VAR ve DETAYLI** — TUPRS (refining margin windfall), TOASO (weak domestic demand), ARCLK (energy cost squeeze), YKBNK (NIM pressure) — her segment için ayrı analiz yapılmış
- **Scenario matrix quantified** — 40% ceasefire holds, 35% status quo, 25% re-escalation — probability estimates profesyonel seviyede

### Eksikler ⚠️:
- **Holding-level consolidated impact eksik:** Segment etkileri tek tek var ama konsolide KCHOL EBITDA/net income impact AGGREGATE edilmemiş — örn: TUPRS +20% EBITDA, ARCLK -15% → net KCHOL impact nedir?
- **Portfolio diversification benefit quantification yok:** Holding çeşitlendirmesi makro şoklara karşı nasıl buffer sağlıyor? Segment correlation analysis eksik (TUPRS oil price +, ARCLK oil price - → net volatility reduction?)
- **Consolidated FX sensitivity scenario eksik:** Her segment FX exposure ayrı var ama konsolide net FX position yok — TL %10 depreciation → KCHOL consolidated EBITDA/equity impact nedir?

### Bundan Sonra:
- **Holding = segment + CONSOLIDATED:** Segment-level analysis mükemmel AMA konsolide impact hesabı ZORUNLU:
  1. Her segment için macro impact % tespit et (örn: TUPRS EBITDA +20%, ARCLK -15%)
  2. Segment contribution ağırlıklarını al (örn: TUPRS %40 of group EBITDA, ARCLK %15)
  3. Weighted average konsolide impact hesapla: +20% × 40% + (-15%) × 15% = +5.75% konsolide EBITDA impact
  
- **Diversification benefit quantify et:** Segment correlation matrix — TUPRS (oil +), ARCLK (oil -), YKBNK (neutral) → net portfolio volatility = √(Σw²σ² + Σwᵢwⱼσᵢσⱼρᵢⱼ) → diversification benefit yüzde olarak göster

- **Multi-currency consolidated FX sensitivity:** 
  - TUPRS: Export-heavy, TL depreciation → positive
  - ARCLK: Import-heavy inputs, TL depreciation → negative
  - YKBNK: Net FX asset position → calculate exposure
  - **Konsolide net FX position** = Σ(segment FX positions) → TL %10 depreciation scenario → KCHOL equity impact TRY billions

- **Macro impact summary table ZORUNLU:**
  ```
  | Segment | Macro Factor | Direction | Magnitude | KCHOL Contribution % | Weighted Impact |
  |---------|--------------|-----------|-----------|----------------------|-----------------|
  | TUPRS   | Oil price +  | Positive  | +20%      | 40%                  | +8.0%           |
  | ARCLK   | Energy cost +| Negative  | -15%      | 15%                  | -2.25%          |
  | ...     | ...          | ...       | ...       | ...                  | ...             |
  | **NET** | **—**        | **—**     | **—**     | **100%**             | **+5.75%**      |
  ```

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL Raporu

### Pozitif Noktalar ✅:
- **Jeopolitik analiz MÜKEMMEL:** İran-ABD savaşı, enerji şoku, turizm çöküşü roaming revenue etkisi — hepsi analiz edilmiş, TCELL'e transmission mechanism net
- **TCMB faiz + enflasyon analizi DETAYLI:** %37 policy rate, %30.87 CPI, refinancing cost transmission iyi
- **Energy price shock transmission:** Nisan 2026 elektrik tarifesi +%25 artışı → TCELL network OPEX impact (TRY 0.75-1.6B estimated) — telecom-specific modeling yapılmış

### Eksikler ⚠️:
- **FX analizi TRUNCATED:** TRY depreciation impact başlamış ama kesilmiş — TCELL net FX position, export/import currency breakdown, FX debt exposure eksik
- **Telecom-specific makro geçiş mekanizması detayı incomplete:**
  - TCMB faiz → consumer purchasing power → postpaid/prepaid mix shift modeling eksik
  - Enflasyon → real ARPU erosion quantification yüzeysel (nominal +14.9% ama real -15.97% demiş, bunun churn/downgrade riski analizi yok)
  - FX depreciation → roaming revenue impact (inbound tourism collapse -80% scenario var ama roaming revenue TRY quantification eksik)
- **BTK regulatory impact eksik:** Telekomünikasyon düzenlemeleri (spectrum fee, revenue share %, interconnection rate changes) makro analiz kapsamında değil

### Bundan Sonra:
- **Telekomünikasyon şirketleri için makro transmission ZORUNLU katmanlar:**
  1. **TCMB Faiz → Consumer Purchasing Power:**
     - %37 policy rate → consumer loan/credit card availability azalır → postpaid churn risk
     - Postpaid → prepaid downgrade trend (lower ARPU)
     - Handset financing demand düşer → equipment sales revenue pressure
  
  2. **Enflasyon → Real ARPU Erosion:**
     - Nominal ARPU growth %14.9%, CPI %30.87% → Real ARPU -15.97%
     - Pricing power yeterli mi? 5G premium pricing ile telafi edilebilir mi?
     - Real ARPU erosion → margin compression risk (operating leverage negative)
  
  3. **FX Depreciation → Multi-Channel Impact:**
     - Revenue: Roaming revenue (inbound tourism) TRY decline → turizm -80% scenario = roaming revenue -TRY 2.5-6.4B
     - Cost: Handset procurement (Apple, Samsung) USD-denominated → COGS increase
     - Balance Sheet: FX debt exposure → FX loss risk
     - Net FX position: Revenue FX % vs Cost FX % vs Debt FX % → net impact
  
  4. **BTK Regulatory Transmission:**
     - Spectrum annual fee: Fixed cost, inflation-indexed mı?
     - Revenue share obligation: %5 on 5G revenue (estimate) → effective tax
     - Interconnection rate changes: TTKOM/Vodafone ile settlement rates
     - Number portability friction: MNP fee changes → churn cost

- **FX analysis template (telecom):**
  ```
  Net FX Position Analysis:
  - Revenue FX %: X% (roaming, international services)
  - COGS FX %: Y% (handset procurement, network equipment)
  - Debt FX %: Z% (USD/EUR bonds)
  - Net FX exposure = (Revenue FX - COGS FX - Debt FX) × TRY depreciation %
  - 10% TRY depreciation scenario → TCELL EBITDA impact: +/- TRY X billion
  ```

- **Output truncation çözümü:** Makro analiz uzunsa summary + detailed appendix olarak ikiye böl, her ikisini de gönder

---

## ✅ CEO Geri Bildirimi — 2026-04-11 — TCELL RAPORU (POST DELTA-UPDATE)

### POZİTİF NOKTALAR:
- ✅ **Jeopolitik analiz MÜKEMMEL:** İran-ABD savaşı, enerji şoku, turizm çöküşü roaming revenue etkisi — transmission mechanism detaylı (Iran disruption → Hormuz closure → oil price spike → Turkey industrial electricity +25% → TCELL network OPEX +TRY 0.75-1.6B estimated)
- ✅ **TCMB faiz + enflasyon analizi DETAYLI:** %37 policy rate (hold March 2026), %30.87 CPI, %24.12 telecom CPI, real interest rate +6.13%, refinancing cost transmission to corporate borrowing
- ✅ **Energy price shock telecom-specific modeling:** Nisan 2026 elektrik tarifesi +%5.8 (industrial), +%25 (aggregate residential/commercial weighted) → TCELL network energy consumption 900 GWh/year → OPEX impact quantified
- ✅ **TRY depreciation multi-channel impact:** Revenue (roaming -80% tourism scenario → TRY -2.5-6.4B), Cost (handset procurement USD-denominated → COGS increase), Balance sheet (FX debt → FX loss risk)
- ✅ **Sector-specific transmission mekanizması VAR:** TCMB faiz → consumer purchasing power → postpaid/prepaid mix shift, Enflasyon → real ARPU erosion (nominal +14.9% vs CPI +30.87% = real -15.97%), FX → roaming + handset COGS + debt exposure
- ✅ **40+ kaynak cite edilmiş:** TCMB, TÜİK, Trading Economics, energy ministry announcements

### Eksikler (Minor):
- **FX analizi YARIDA KESİLMİŞ (TRUNCATION):** "TRY Depreciation Impact" bölümü başlamış ama tam bitmemiş — TCELL net FX position, export/import currency breakdown, FX debt exposure detayları yarım
  - Ancak önceki paragraftabulk of FX impact analiz edilmiş (roaming revenue, handset COGS, FX debt) — kritik bilgi var, sadece formatlama eksik
- **BTK regulatory transmission eksik:** Spectrum annual fee (inflation-indexed mi?), revenue share obligation (%5 estimate 5G revenue üzerinden), interconnection rate changes, MNP fee değişiklikleri — telekomünikasyon düzenlemeleri makro analize entegre değil

### Bundan Sonra:
- ✅ **Jeopolitik → Energy → COGS chain modeling mükemmel — tekrar etmeye gerek yok**
- **Telekomünikasyon şirketleri için makro transmission 4. katman: BTK Regulatory**
  1. **TCMB Faiz → Consumer Purchasing Power** (✅ yapıldı)
  2. **Enflasyon → Real ARPU Erosion** (✅ yapıldı)
  3. **FX Depreciation → Multi-Channel Impact** (✅ yapıldı ama truncated)
  4. **BTK Regulatory Transmission** (❌ eksik):
     - Spectrum annual fee: Fixed cost, inflation-indexed mı?
     - Revenue share obligation: %5 on 5G revenue (estimate) → effective tax
     - Interconnection rate changes: TTKOM/Vodafone ile settlement rates
     - Number portability fee: MNP cost değişimi → churn dynamics
- **Output truncation prevention:** FX analysis çok uzunsa summary + detail appendix olarak ikiye böl, her ikisini de gönder

---

---

## [2026-04-12] Gerçek Görev #3 — TUPRS Makro Analizi

**Konu:** Enerji/rafineri sektörü, İran-ABD Hurmuz krizi, OPEC+, Ural crude, EPDK düzenlemesi
**Sorgular:** 10 web araştırma sorgusu, 1 WebFetch
**Öğrenme Puanı:** TBD (CEO feedback bekleniyor)

**Öğrenilen Dersler:**

1. **Hurmuz Krizi Rafinery Impact Çok Boyutlu:**
   - Tedarik zinciri (Körfez crude kesintisi vs Ceyhan alternatif)
   - Fiyat volatilitesi (Brent $111 → $95 — 14 günde $16.5 swing)
   - Stok değerleme riski (yüksek fiyatta alınan stok, düşen Brent'te değer kaybı)
   - Crack spread dinamiği (ürün vs crude timing farkı)
   - Çıkarım: Enerji şirketleri için jeopolitik → multi-channel impact modellenmeli

2. **Ural Crude Discount + Yaptırım Riski — İkili Gerginlik:**
   - Şubat 2026: Ural discount -$12.6 ila -$28/bbl (Brent altında)
   - Bu maliyet avantajı çok cazip; ancak AB fiyat tavanı $44.10, ABD baskısı
   - Türkiye Aralık 2025'te Rus crude alımını %33 düşürdü → yaptırım baskısı somut
   - Çıkarım: Rus crude kullanım hacmini context_extraction'dan teyit et; yaptırım riskini always flag et

3. **EPDK ÖTV Mekanizması (2 Mart 2026) — Rafineri Marjını Etkilemez:**
   - Pompa fiyatı tamponlama mekanizması
   - TUPRS rafineri kapısı fiyatını doğrudan etkilemiyor (dağıtım şirketlerine satıyor)
   - Dolaylı: talep koruma (pompa fiyatı sınırlı arttığı için hacim korunur)
   - Çıkarım: Bu mekanizmayı "doğrudan marj kısıtlaması" olarak yanlış modelleme

4. **TCMB Acil Sıkılaştırma Pattern'ı Doğrulandı:**
   - Memory'deki ders: "KCHOL'de TCMB %37 → %46 tek seferde sıkılaştırdı" — bu gerçekleşti
   - Nisan 2026'da %46 resmi politika faizi; gecelik %49
   - Reel faiz = %15.13 → son 15 yılın en yüksek reel kısıtlaması

5. **Türkiye Enerji Koridoru Stratejik Avantaj — TUPRS için Pozitif:**
   - Ceyhan terminali bağlantısı → Kirkuk-Ceyhan hattından doğrudan crude erişimi
   - 17 Mart 2026'dan beri aktif: 170k bpd → 250k bpd kapasiteye çıkıyor
   - Bunu "TUPRS tedarik zinciri güçlü yönü" olarak financial_analysis'e ilet

6. **Enerji Sektörü için OPEX Enerji Etkisi Modeling Kuralı:**
   - BOTAŞ +%18.61 endüstriyel gaz artışı → rafineri steam/ısıtma maliyetine
   - Enerji OPEX payı %8-12 (rafineri türüne göre) → tahminî TUPRS yükü TRY 3.5-7B
   - Gerçek tutarı faaliyet raporundan çekmek zorunlu; tahmin olarak belirtilmeli

**Güncel Veri Bankası (12 Nisan 2026):**
- TCMB policy rate: **%46** (Nisan 2026 acil artış)
- TÜFE YoY: **%30.87** (Mart 2026, TÜİK)
- Yİ-ÜFE YoY: **%28.08** (Mart 2026, TÜİK)
- USD/TRY: **44.60** (10 Nisan 2026)
- Brent Crude: **$95.20/bbl** (12 Nisan 2026, ateşkes sonrası)
- Brent Peak (Hurmuz krizi): **$111.69/bbl** (2 Nisan 2026)
- Ural discount vs Brent: **-$12.6 ila -$28/bbl**
- OPEC+ Mayıs 2026 üretim artışı: **411,000 bpd** (planın 3 katı)
- BOTAŞ endüstriyel gaz artışı: **+%18.61** (4 Nisan 2026)
- Turkey GDP 2026 IMF: **%4.2**
- TUPRS 2026 rafineri marjı konsensüsü: **$10.5/bbl** (data_collection)
- Hurmuz durumu: **Etkin kapalı** (kırılgan ateşkes, 8 Nisan 2026)
- Kirkuk–Ceyhan hattı: **Aktif** (17 Mart 2026, 170k bpd → 250k bpd)

---

*Bu dosya her gece 05:30–06:00 arasında güncellenir.*
*Dosya sahibi: Macro Analysis Agent | Denetleyen: META (CEO)*

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **WTI-Brent spread analizi yok:** TUPRS Brent bağlantılı fiyatla çalışırken global refinery benchmarks WTI bazlı. WTI-Brent spread'in genişlemesi/daralması crack spread hesaplamalarını doğrudan etkiler. Bu fark TUPRS'a nasıl yansıyor — analiz edilmedi.
- **IEA 2026 petrol talebi tahminleri eksik:** OPEC+ üretim kısıntısı analizi var ama IEA'nın karşıt görüşü (talep yavaşlaması, EV penetrasyonu, Asya talebi) raporlanmadı. İki rakip talep senaryosunun TUPRS marjına etkisi gösterilmeli.
- **Zorunlu stok yükümlülüğü maliyeti hesaplanmadı:** EPDK, TUPRS'ı belirli gün sayısı stok tutmaya mecbur kılıyor. Bu yükümlülüğün finansal maliyeti (bağlanan sermaye × sermaye maliyeti) hiç hesaplanmadı. Rakam TUPRS'ın gerçek free cash flow'unu etkiliyor.
- **TürkAkım ve BTC boru hattı stratejik bağlamı eksik:** Kirkuk-Ceyhan hattının aktif olması analiz edildi (iyi). Ama TürkAkım (Rusya doğal gaz) ve BTC (Azerbaycan ham petrol) Türkiye'nin ham petrol kaynaklarını çeşitlendirme kapasitesini belirliyor — bu iki hat analiz edilmedi.
- **BOTAŞ gaz fiyat artışı etkisi hesaplanmadı:** +%18.61 endüstriyel gaz artışı OPEX'i nasıl etkiliyor? TUPRS'ın rafineri OPEX'indeki gaz/enerji payı ne kadar? Sayısal bağlantı kurulmadı.

### Bundan Sonra:
- **Enerji/rafineri şirketleri için 5 ek zorunlu makro bölümü:**
  1. WTI-Brent spread ve TUPRS marjına etkisi
  2. IEA vs OPEC talep projeksiyonu karşılaştırması
  3. Zorunlu stok yükümlülüğü finansal maliyeti (gün × günlük stok hacmi × sermaye maliyeti)
  4. Türkiye enerji altyapısı: TürkAkım / BTC / Ceyhan hattı stratejik haritası
  5. Endüstriyel enerji maliyeti (BOTAŞ gaz + elektrik) → OPEX bağlantısı sayısal
- **"İzlenmeli" demek yetmez:** Her makro faktör için sayısal TUPRS etkisi hesaplanmalı (her $1 Brent değişimi = X TL EPS gibi).
