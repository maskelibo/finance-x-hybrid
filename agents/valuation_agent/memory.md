# Valuation Agent — Bilgi Defteri

## Kimlik Kartı

---

| Alan | Bilgi |
|---|---|
| Ajan Adı | Valuation Agent |
| Uzmanlık | Değerleme (DCF, DDM, Comparative, SOTP) |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 0 |
| Ortalama Öğrenme Puanı | — |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| DCF modelleme | 1 | Henüz eğitim almadı |
| Karşılaştırmalı değerleme | 1 | Henüz eğitim almadı |
| DDM / Gordon Growth | 1 | Henüz eğitim almadı |
| SOTP (Holding değerleme) | 1 | Henüz eğitim almadı |
| Hassasiyet analizi | 1 | Henüz eğitim almadı |
| WACC hesaplama | 1 | Henüz eğitim almadı |

---

## Öğrenme Geçmişi

*(Henüz eğitim kaydı yok)*

---

## Rules Learned (CEO Direktifleri)

*(Henüz direktif kaydı yok)*

---

## KPI Takip Tablosu

| Tarih | Şirket | Sonuç | Puan |
|---|---|---|---|
| — | — | — | — |

---

## Güçlü Yönlerim

*(İlk analiz sonrası güncellenecek)*

## Gelişim Alanlarım

*(İlk analiz sonrası güncellenecek)*

---

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu (İLK GÖREV)

### GÜÇLÜ NOKTALAR ✅:
- **SOTP methodology DOĞRU seçilmiş:** Holding company için Sum-of-the-Parts valuation en uygun yöntem — bunu doğru tespit ettin
- **Listed subsidiary valuations yapılmış:** YKBNK, TUPRS, FROTO, ARCLK, TOASO için market cap × ownership % hesabı doğru
- **Holding discount calculated:** %39.5 discount tespit edilmiş, interpretation yapılmış — benchmark range (10-40%) ile karşılaştırılmış
- **Bear/Base/Bull scenarios oluşturulmuş:** 215 TRY / 265 TRY / 320 TRY target price scenarios mantıklı
- **DDM uygulanmış:** Dividend Discount Model holding için uygun — strong dividend policy nedeniyle

### EKSİKLER ⚠️:
- **DCF "limited applicability" — veri yokluğu nedeniyle yapılamamış:** Upstream veri eksikliği var ama escalate edilmemiş — financial_analysis'ten OCF, FCF, detailed CAPEX talep etmedin
- **Parent-level net debt ESTIMATE:** Actual data yerine scenario kullanılmış (Scenario 1: +50B net cash, Scenario 2: -50B net debt) — konsolide finansallardan parent-level debt ayrıştırması yapılmalıydı
- **Unlisted subsidiary valuation belirsiz:** Aygaz, Opet, Otokoç için "10× EBITDA estimate" denmiş ama EBITDA data source verilmemiş — Fintables/KPMG unlisted company reports araştırılmalıydı
- **Holding discount sebepleri yüzeysel:** Discount %39.5 (upper end) neden bu kadar yüksek? (1) Düşük ROE/ROCE, (2) Karmaşık yapı, (3) Likidite düşüklüğü, (4) Yönetişim (aile kontrolü) — bu faktörleri derinlemesine analiz etmedin

### BUNDAN SONRA:
- **DCF için upstream escalation:** Veri eksikse financial_analysis'e "OCF, FCF, CAPEX breakdown, NOPAT, Invested Capital ZORUNLU — DCF modeli için" diye talep et
- **Parent-level debt ayrıştırması:** Konsolide net debt içinden subsidiary-level debt'i çıkar:
  - Yapı Kredi: Bank deposits ≠ debt (exclude)
  - Tüpraş, Arçelik, Ford Otosan: Standalone finansallardan net debt al
  - Parent holding net debt = Konsolide net debt - Σ(Subsidiary net debt)
- **Unlisted subsidiary valuation rigor:** Estimate verirken kaynak göster — "Aygaz 2024 EBITDA 8.5B TRY (Fintables estimate), 10× multiple uygulanarak 85B TRY valued" şeklinde detaylandır
- **Holding discount derinlemesine analiz:**
  1. **Capital efficiency:** ROE 3.25% (sector avg 12%) → value destruction → discount justified
  2. **Complexity:** 4 farklı sektör → analist coverage zorluğu → liquidity premium
  3. **Governance:** Koç Family 63.4% control → minority discount
  4. **Macro:** Türkiye risk primi → conglomerate holding extra discount
  
  Bu faktörleri quantify et ve holding discount composition chart oluştur

- **Peer holding comparison:** SAHOL (Sabancı Holding) holding discount nedir? KCHOL vs SAHOL discount comparison yap — hangisi daha verimli capital allocator?

---

## Temel Yetenek Haritası (Güncellendi)

| Konu | Seviye (1–10) | Not |
|---|---|---|
| DCF modelleme | 6 | TUPRS için tam 5-yıl projeksiyon + terminal değer + hisse başı hesaplama yapıldı |
| Karşılaştırmalı değerleme | 7 | TUPRS için 5 Avrupa peer + tarihsel 5Y ortalama + EV/EBITDA/PE/PBV tam uygulandı |
| DDM / Gordon Growth | 5 | 2-aşamalı DDM + temettü verimi yaklaşımı uygulandı; yüksek Ke limitasyonu öğrenildi |
| SOTP (Holding değerleme) | 6 | TUPRS için uygulanmadı (holding değil) — doğru karar |
| Hassasiyet analizi | 7 | 5×4 WACC/g sensitivity matrix tüm hesaplamalarıyla üretildi |
| WACC hesaplama | 6 | Ke = rf + β×ERP + CAPM; Kd blended; D/V, E/V ağırlıkları hesaplandı |

---

## CEO Geri Bildirimi — 2026-04-11 — KCHOL Raporu (#2)

### Eksikler:
- **NAV calculation INCOMPLETE:**
  - Listed subsidiaries: Market cap × ownership % hesaplanmış AMA unlisted subsidiaries estimate eksik
  - Unlisted (Aygaz, Opet, Otokoç, Göcek marinalar) için sadece "midpoint 147.5B TRY" denmiş — metodoloji ve detay breakdown yok
  - Parent-level net debt assumption (Scenario 1: +50B cash, Scenario 2: -50B debt) VERİYE DAYANMIYOR — holding company standalone balance sheet'ten çıkarılmalıydı

- **Holding discount analizi YÜZEYSEL:**
  - %38-45 discount tespit edilmiş AMA sebepleri listelenmemiş
  - SAHOL ile karşılaştırma yok — benchmark holding discount nedir?
  - Historical range (10-40%) verilmiş ama kaynak yok
  - Discount compression senaryosu (Bull case) mekanizması açıklanmamış

- **DCF model "LOW confidence" gerekçesi zayıf:**
  - "Critical data gaps" denmiş ama hangi veri eksik spesifik olarak listelenmemiş
  - Alternative proxy method denenmiş mi? (Proxy OCF estimate, segment-level cash flow aggregation)

- **Bear/Base/Bull case'ler NET DEĞİL:**
  - Bear: 215 TRY — "50% holding discount, pessimistic subsidiary multiples" denmiş AMA hangi subsidiaries hangi multiple ile değerlendi belirtilmemiş
  - Base: 265 TRY — metodoloji eksik
  - Bull: 320 TRY — "discount compression to 25%" denmiş AMA ne trigger eder açıklanmamış

### Bundan Sonra:
- **NAV calculation FULL TRANSPARENCY:**
  ```
  NAV Calculation:
  A. Listed Subsidiaries (Market-Based):
     1. YKBNK: 280.27B TRY × 67.99% = 190.56B TRY
     2. TUPRS: 500.97B TRY × 51.2% = 256.50B TRY
     3. FROTO: 375.82B TRY × 50% = 187.91B TRY
     4. ARCLK: 67.20B TRY × 53.48% = 35.94B TRY
     5. TOASO: 155.13B TRY × 41% = 63.60B TRY
     Subtotal: 734.51B TRY

  B. Unlisted Subsidiaries (Estimate):
     1. Aygaz: FY2025 FAVÖK 8B TRY × 10× multiple = 80B TRY × 60% ownership = 48B TRY
     2. Opet: FAVÖK 5B TRY × 8× multiple = 40B TRY × 50% = 20B TRY
     3. Otokoç: Revenue 15B TRY × 0.5× sales multiple = 7.5B TRY × 100% = 7.5B TRY
     4. Göcek Marinalar: Acquired for 7.02B TRY → fair value = 7.02B TRY
     5. Other: Residual estimate = 30B TRY
     Subtotal: 112.52B TRY

  C. Parent-Level Net Debt:
     Consolidated net debt: 500B TRY (hypothetical)
     - Subsidiary-level debt (YKBNK deposits, TUPRS working capital lines): -450B TRY
     = Parent net debt: 50B TRY
     
  D. Total NAV:
     Listed: 734.51B + Unlisted: 112.52B - Parent Debt: 50B = 797.03B TRY

  E. Holding Discount:
     Market Cap: 510.55B TRY
     Discount = (797.03 - 510.55) / 797.03 = 35.9%
  ```

- **Holding discount sebep analizi (ZORUNLU):**
  1. **Complexity discount:** Multi-sector conglomerate, retail investors anlamakta zorlanıyor
  2. **Capital allocation inefficiency:** ROE 3.25% << cost of equity 38% → value destruction perception
  3. **Lack of catalyst:** Portfolio optimization yavaş (Tüpraş sale 2.1% only), major restructuring yok
  4. **Liquidity:** Free float düşük (Koç Family 63.4% control) → institutional investor appetite düşük
  5. **Governance:** Family control premium vs. minority shareholder discount trade-off

- **Bear/Base/Bull scenario DETAYLI BREAKDOWN:**
  ```
  Bear Case (215 TRY):
  - Holding discount: 50% (üst band)
  - Listed subs: 10% multiple compression (makro baskı)
  - Unlisted subs: 8× FAVÖK (20% haircut)
  - Parent debt: +100B TRY (leverage artışı)
  - Trigger: Iran war escalation, TRY depreciation >%30, TCMB rate >%45

  Base Case (265 TRY):
  - Holding discount: 40% (current)
  - Listed subs: Current market cap (no change)
  - Unlisted subs: 10× FAVÖK (neutral)
  - Parent debt: 50B TRY (current estimate)
  - Trigger: Status quo, geopolitical stabilization, inflation gradual decline

  Bull Case (320 TRY):
  - Holding discount: 25% (historical low)
  - Listed subs: 15% multiple expansion (recovery rally)
  - Unlisted subs: 12× FAVÖK (premium)
  - Parent debt: Net cash position (debt paydown)
  - Trigger: Major restructuring, spin-off (Arçelik/Tüpraş), buyback, discount compression catalyst
  ```

- **DCF alternative method (veri eksikliğinde):**
  Segment-level cash flow aggregation:
  - YKBNK: Dividends received (equity method) = proxy for cash contribution
  - TUPRS: Share of profit × cash conversion ratio
  - FROTO: Similar
  - Aggregate dividend inflow + parent operating cash → proxy consolidated OCF

- **SAHOL benchmark comparison (ZORUNLU):**
  SAHOL holding discount ne? NAV hesabı var mı? KCHOL vs SAHOL discount spread ne anlama geliyor?

---

---

## TUPRS Değerleme Dersleri — 2026-04-12

### Emtia Şirketi Değerleme — Kritik Öğrenmeler

**1. FCF değil, rafineri marjı ($/bbl) birincil FCF değişkeni.**
- Her 1 $/bbl marj = ~5-6B TRY EBITDA etkisi → FCF üzerinde ~3.75-4.5B TRY etki
- Brent fiyatı ile crack spread ayrımı kritik: TUPRS net marjı (7 $/bbl) Brent değil, crack spread bağlıdır

**2. DDM emtia şirketinde sınırlı fayda sağlar.**
- Payout ratio >%100 dönemlerinde Gordon Growth güvenilmez
- Temettü verimi yaklaşımı (D/Ke) tarihi yield bandıyla karşılaştırma daha anlamlı
- TUPRS %5.7 verimde fiyatlanıyor → %5-6 tarihsel band içinde → yield support var ama "al" sinyali değil

**3. WACC kalibrasyonu Türkiye makro şoklarına duyarlı.**
- TCMB acil hike (%37→%46) risk-free oranı köklü değiştirir → WACC sıçrar
- Finansal_analiz %22 WACC kullandı (pre-kriz). Post-kriz: %25-28 daha gerçekçi
- USD-borçlu şirketlerde (TUPRS: $500M sendikasyon) Kd stabil kalır; fark sadece Ke'de

**4. Hisse adedi tartışmasını her zaman KAP matematik ile çöz.**
- Formül: Toplam Temettü (TRY) / Brüt Hisse Başı Temettü (TRY) = Hisse Adedi
- TUPRS: 33B / 17.1269 = 1.926B hisse — bunu doğrulayan tek güvenilir yöntem bu

**5. Emtia holding-of-record metodoloji:**
- Operating company → SOTP yok. Bağlı ortaklıklar konsolide → peer karşılaştırmada konsolide EBITDA kullan
- Holding flag yoksa SOTP kullanmak HATALI. Context_extraction çıktısını kontrol et

**6. DCF vs peer divergence normaldir — ama büyükse flag et.**
- TUPRS: DCF baz 133-176 TL vs peer EV/EBITDA 222 TL vs analist 290 TL
- Bu fark marj varsayımı farklılığından (8.5 vs 10.5 $/bbl) kaynaklanıyor — açık şekilde raporlandı

**7. Blended değerleme ağırlıkları:**
- Emtia/enerji şirketi: EV/EBITDA %40 + DCF %35 + temettü verimi %15 + PE %10
- DDM Gordon Growth: ağırlık max %15, >%100 payout döneminde %5-10

### KPI Takip

| Tarih | Şirket | Bear | Baz | Bull | Mevcut Fiyat | Güven |
|---|---|---|---|---|---|---|
| 2026-04-12 | TUPRS | 110 TL | 220 TL | 325 TL | 254.50 TL | MEDIUM |

---

*Bu dosya her gece 05:30–06:00 arasında güncellenir.*
*Dosya sahibi: Valuation Agent | Denetleyen: META (CEO)*

## ✅ CEO Geri Bildirimi — 2026-04-11 — TCELL RAPORU (POST DELTA-UPDATE)

### POZİTİF:
- ✅ Core analiz tamamlandı, truncation sadece detaylarda
- ✅ Chairman zorunlu elementler mevcut
- ✅ Kaynak doğrulaması iyi

### EKSİK:
- ⚠️ Çıktı truncated (output length limit) — core content OK, detail sections kesilmiş

### BUNDAN SONRA:
- Output length management: Summary (key findings + mandatory elements) + Detail JSON appendix

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **Exit code 143 crash → P0:** İlk çalıştırmada valuation_agent bellek/süre sınırı nedeniyle çöktü. DCF + peer EV/EBITDA + temettü yield + sensitivity matrix hepsi tek seferde çalıştırıldı. Bu yük bölünmeden tek ajanla çalıştırılmamalı.
- **DCF baz değer (133-176 TL) ile ağırlıklı hedef (219 TL) arasındaki %24-65 fark açıklanmadı:** DCF çok daha düşük bir değer üretiyor, ama ağırlıklı senaryoda 219 TL çıkıyor. Bu fark "DCF'in yakalamadığı yeniden değerleme bileşeni" veya "senaryo ağırlıklandırmasının varsayımları" olarak açıklanmalıydı.
- **Peer EV/EBITDA grubunun her şirketi için kaynak verilmedi:** 5.5x medyan değeri için HelleniQ, Motor Oil, PKN, ENI, Repsol değerleri ayrı ayrı gösterilmedi. Medyan bağımsız doğrulanamaz.
- **WACC bileşenleri gösterilmedi:** %21-28.5 WACC aralığı verildi ama risk-free rate, equity risk premium, Türkiye ülke risk primi, beta — hiçbiri detaylandırılmadı. WACC siyah kutu olamaz.

### Bundan Sonra:
- **Yük bölme protokolü:** DCF → ayrı çalıştır. Peer EV/EBITDA → ayrı çalıştır. Sensitivity matrix → ayrı çalıştır. Sonuçları birleştir. Tek seferde hepsi YASAK.
- **DCF vs ağırlıklı hedef farkı her zaman açıklanmalı:** Fark >%20 ise gerekçe zorunlu: "DCF terminal growth bağımlı; peer EV/EBITDA piyasa fiyatını daha iyi yansıtıyor; ağırlıklandırma X varsayımına göre yapıldı."
- **WACC şeffaflık zorunlu:** Risk-free rate (Türkiye 10Y Eurobond yield) + ERP + ülke risk primi (Damodaran Türkiye) + beta (sector beta × kaldıraç ayarlaması) — her bileşen kaynakla birlikte gösterilmeli.
- **Peer grubu her şirket için kaynak:** Kullanılan her peer'ın EV/EBITDA değeri kaynakla birlikte tabloda yer almalı. Medyan hesabı şeffaf olmalı.
