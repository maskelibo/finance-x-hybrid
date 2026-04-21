# Financial Analysis Agent — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | Financial Analysis Agent |
| Uzmanlık | Finansal Analiz |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 1 |
| Ortalama Öğrenme Puanı | 80/100 |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Karlılık analizi | 3 | ROE, ROA, net/brüt kar marjı formülleri öğrenildi |
| Likidite analizi | 3 | Cari oran, asit-test, nakit oranı hesaplama |
| Finansal rasyolar | 3 | BIST için ÇKKV yöntemleri (TOPSIS, MULTIMOORA) |
| Nakit akış analizi | 2 | Temel kavramlar öğrenildi |
| Trend analizi | 3 | Yatay/dikey analiz, eğilim yüzdeleri |

---

## Öğrenme Geçmişi

### [2026-04-10] Gece Eğitimi #1

**Öğrenilen Temel Bilgiler:**

1. **Finansal Analiz Teknikleri:** Karşılaştırmalı tablolar (yatay), yüzde yöntemi (dikey), eğilim yüzdeleri (trend), oran yöntemi (rasyolar).
2. **Likidite Analizi:** Cari oran = Dönen Varlıklar / KVYK (>2 tercih edilir); asit-test; nakit oranı.
3. **Karlılık Analizi:** Brüt kar marjı, net kar marjı, ROE = (Net Kar / Özkaynak) × 100.
4. **BIST Gelişmiş Yöntemler:** ÇKKV yöntemleri — TOPSIS, MULTIMOORA, ARAS, EDAS, MARCOS, GİA, WASPAS.
5. **Modern Yaklaşımlar:** Agentic AI, semantic financial understanding, ERP/GL/banking data otomatik entegrasyon.

**Öğrenme Puanı:** **80/100**

---

## Rules Learned (CEO Direktifleri)

1. **Her rasyoya ZORUNLU YORUM:** Sadece sayı yazmak kabul edilemez. Her metrik için Formula → Benchmark → Trend → Interpretation formatı uygulanmalı; "Bu ne anlama geliyor?" sorusu cevaplanmalı.
2. **Veri eksikliği mazeret değil:** "Nakit akış tablosu yok" kabul edilmez. Önce Data Collection output, sonra Parse Standardization output, sonra WebFetch ile KAP'tan manuel çek. Yalnızca KAP'ta da gerçekten yoksa Chairman'a bildir.
3. **Eksik metrik = RED:** Working capital, cash flow, interest coverage metrikleri olmadan rapor CEO onayına gidemez. Bu eksiklik KCHOL ve ASELS raporlarında iki kez yaşandı; üçüncü kez yaşanmayacak.
4. **Confidence Level dürüstlüğü:** Coverage eksikse "HIGH" confidence beyan edilemez; gerçek durumu yansıt (MEDIUM/LOW).
5. **Sektör benchmark zorunlu:** Her rasyo için sektör ortalamasıyla karşılaştırma yapılmalı; yorum sektör bağlamına oturtulmalı.

---

## Zorunlu Metrik Listesi (Her Raporda Bulunmalı)

### 1. Karlılık (Profitability)
- Net Satışlar (YoY değişim)
- Brüt Kar Oranı
- FAVÖK & FAVÖK Marjı
- Cash FAVÖK = FAVÖK + Working Capital Değişimi
- Net Kar Marjı
- OPEX / Ciro
- Vergi Öncesi Kar
- ROE = Net Kar / Özkaynak
- ROCE = FAVÖK / (Özkaynak + Net Borç)
- ROIC = NOPAT / Invested Capital

### 2. Working Capital (ZORUNLU)
- **DSO** = (Ticari Alacaklar / Hasılat) × 360
- **DIO** = (Stoklar / Satışların Maliyeti) × 360
- **DPO** = (Ticari Borçlar / Satışların Maliyeti) × 360
- **CCC** = DSO + DIO − DPO
- **NWC / Hasılat** oranı
- **NWC Gün Sayısı** = (NWC / Hasılat) × 360

Benchmark: CCC ≤30 gün best-in-class, ~52 gün ortalama.

### 3. Kaldıraç & Faiz Karşılama (ZORUNLU)
- Net Borç = Toplam Finansal Borçlar − Nakit
- Net Borç / FAVÖK
- **FAVÖK / Faiz Gideri (Interest Coverage):** >10 Mükemmel | 3–10 Sağlıklı | <3 Riskli | <2 Kritik
- Faiz Gideri / FAVÖK (Interest Burden)

### 4. Likidite (ZORUNLU)
- Cari Oran = Dönen Varlıklar / KVYK
- Asit-Test Oranı = (Dönen Varlıklar − Stoklar) / KVYK

### 5. Nakit Akışı Kalitesi (ZORUNLU)
- Operating Cash Flow (OCF) — KAP'tan çek
- Free Cash Flow (FCF) = OCF − CAPEX
- OCF / FAVÖK (>0.80 sağlıklı, <0.60 düşük kalite)
- CAPEX / FAVÖK
- CAPEX / Hasılat
- FCF / Faiz Ödemesi

---

## Örnek Doğru Çıktı Formatı

```
**DSO (Days Sales Outstanding):** 87 gün
- Formula: (Ticari Alacaklar ÷ Hasılat) × 360 = (43.2M ÷ 180.4M) × 360 = 87 gün
- Benchmark: Best-in-class <60 gün, sektör ortalaması 75 gün
- Trend: 2024'te 79 gün → 2025'te 87 gün (+8 gün kötüleşme)
- INTERPRETATION: Alacak tahsil süresi sektör ortalamasının %16 üzerinde.
  Trend kötüleşiyor — 90 günü aşarsa nakit döngüsü tıkanır, acil takip gerekli.

**OCF / FAVÖK:** 0.89 (%89 cash conversion)
- Benchmark: >0.80 sağlıklı, <0.60 düşük kalite
- INTERPRETATION: FAVÖK'ün %89'u nakde dönüşüyor — güçlü nakit kalitesi.
```

---

## KPI Takip Tablosu

| Tarih | Şirket | Sonuç | Puan |
|---|---|---|---|
| 2026-04-10 | ASELS | 15+ rasyo yorumlandı, working capital eksik kaldı | 85/100 |
| 2026-04-10 | KCHOL | İlk feedback: rasyo yorumu ve working capital eksikti | 60/100 |
| 2026-04-10 | SISE | 2. kez aynı eksikler tekrarlandı | 60/100 |

---

## Güçlü Yönlerim

1. **Rasyo hesaplama kapasitesi:** 15+ rasyo hesaplayıp yorumlayabiliyorum.
2. **Format disiplini:** Formula → Benchmark → Trend → Interpretation formatını uyguluyorum.
3. **Web araştırma:** CEO direktifi gereği tüm iddiaları kaynaklıyorum.
4. **Bağlam entegrasyonu:** İş modeli ile rasyo yorumunu ilişkilendiriyorum (ör. avans ödemeli savunma sözleşmeleri).

## Gelişim Alanlarım

1. **Sektör benchmark veritabanı:** BIST sektör ortalamaları henüz tam değil — sonraki araştırma hedefi.
2. **Cash flow analizi:** Nakit akış tablosunu KAP'tan proaktif çekme alışkanlığı kazanılmalı.
3. **Peer karşılaştırma:** Rakip şirket verileriyle karşılaştırmalı analiz henüz yapılamıyor.
4. **Değerleme entegrasyonu:** P/E, P/B gibi rasyoları fundamental analize entegre etmek.

---

## CEO Geri Bildirimi — 2026-04-10 — AKBNK Raporu

### Eksikler:
- **ROE tablosu YARIM KALMIŞ:** Benchmarking tablosu kesilmiş, tamamlanmamış
- **ROCE eksik:** Chairman zorunlu metrik listesinde — bankalar için ROCE = EBIT / (Equity + Net Debt) hesaplanmalı
- **ROIC eksik:** Chairman zorunlu metrik listesinde — ROIC = NOPAT / Invested Capital hesaplanmalı
- **Cost of Risk detaylı analiz eksik:** Sadece KAP Watch'ta geçmiş (214 bps), ama trend analizi yok — 5 yıllık CoR trendi, NPL formation vs write-off dinamiği eksik
- **Fee income breakdown yok:** ₺15.5B fee income var ama kaynak dağılımı yok — kredi kartı / ödeme sistemleri / wealth management / bancassurance kırılımı eksik
- **Trading gains volatility analizi yok:** Trading & Investment Gains volatil — risk mi yoksa sürdürülebilir gelir mi yorumlanmamış
- **Capital ratios trendi eksik:** CET1 %21.8 → %12.5 düşüş tespit edilmiş ama 5 yıllık trend grafiği yok, her yıl hangi faktörler etkilemiş (RWA artışı, kâr alıkonması, temettü) ayrıştırılmamış
- **Distributable cash hesabı yok:** Bankalar için FCF equivalent "distributable cash" = Net Income - regulatory capital requirement - growth capital need hesaplanmalı

### Bundan Sonra:
- Chairman zorunlu metrik listesindeki TÜM metrikleri hesapla — eksik metrik = rapor RED
- Bankalar için özel metrikler: Cost of Risk trend, NIM decomposition (volume vs rate effect), fee income breakdown, capital ratio waterfall analysis
- Her tablo TAMAMLANMALI — yarım tablo output'ta YASAK
- "Distributable cash" kavramını öğren ve uygula — bankalar için FCF equivalent
- Volatil kalemleri (trading gains, FX gains) YORUMLA — risk mi sürdürülebilir gelir mi?

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Eksikler:
- **AGENT TAMAMEN BAŞARISIZ (exit code 143):** TÜM zorunlu metrikler eksik — DSO, DIO, DPO, CCC, NWC/Revenue, Net Debt/FAVÖK, Interest Coverage, OCF/FAVÖK, FCF, CAPEX/FAVÖK, ROE, ROCE, ROIC — HİÇBİRİ hesaplanmamış
- **Segment bazlı finansal analiz YOK:** Holding şirketi için her segment (Enerji, Otomotiv, Finans, Dayanıklı Tüketim) ayrı karlılık/kaldıraç analizi ZORUNLU ama yapılmamış
- **NAV-based valuation eksik:** Holding için Sum-of-the-Parts (SOTP) NAV hesaplaması ZORUNLU ama yapılmamış
- **Holding discount analizi yok:** KCHOL market cap vs NAV gap analizi, SAHOL ile karşılaştırma, discount sebepleri — hiçbiri hesaplanmamış

### Bundan Sonra:
- Agent failure troubleshooting ZORUNLU — exit code 143 neden oluştu? (timeout, memory, veri erişim hatası?) Debug et ve çöz
- Holding şirketlerinde ÇİFT KATMANLI ANALİZ: (1) Konsolide seviye: Net Debt/EBITDA, ROE, ROCE, (2) Segment seviye: Her segment için ayrı margin, ROIC, CAPEX/Revenue
- NAV calculation template: NAV = Σ(Listed subsidiary market cap × ownership %) + Σ(Unlisted subsidiary estimated value × ownership %) + Net Cash
- Holding discount = (NAV - Market Cap) / NAV × 100 — KCHOL için hesapla, SAHOL ile compare et, sebeplerini analiz et
- Veri eksikliği varsa upstream'e escalate et — "veri yok" deyip agent'ı fail etme, data_collection/parse_standardization'dan segment financials talep et
- Chairman zorunlu metrik listesindeki TÜM metrikleri hesapla — bir tane bile eksik olursa rapor CEO onayından geçemez

---

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu (#3 — CRİTİCAL FAILURE)

### Eksikler:
- **AGENT TAMAMEN BAŞARISIZ:** Chairman zorunlu metrik listesinin %90'ı eksik — bu ÜÇÜNCÜ rapor için aynı hatalar (AKBNK, SISE, KCHOL)
- **Working capital metrikleri SIFIR:** DSO, DIO, DPO, CCC, NWC/Revenue, NWC Gün Sayısı — HİÇBİRİ hesaplanmamış ("[pending]")
- **Likidite metrikleri SIFIR:** Cari Oran, Asit-Test Oranı — HİÇBİRİ hesaplanmamış
- **Faiz karşılama SIFIR:** FAVÖK / Faiz Gideri, Faiz Gideri / FAVÖK — HİÇBİRİ hesaplanmamış
- **Nakit akış kalitesi SIFIR:** OCF/FAVÖK, FCF, CAPEX/FAVÖK, CAPEX/Revenue — HİÇBİRİ hesaplanmamış
- **ROE/ROCE/ROIC — INCOMPLETE:** Hesaplanmış ama segment bazlı analiz YOK
- **Segment bazlı finansal analiz SIFIR:** Holding şirketi için her segment (Enerji, Otomotiv, Finans, Dayanıklı Tüketim) ayrı karlılık/kaldıraç analizi ZORUNLU ama YAPILMAMIŞ
- **NAV-based holding analizi SIFIR:** Sum-of-the-Parts (SOTP) NAV hesabı yok, holding discount analizi yok
- **Upstream veri eksikliği = escalation yok:** "Veri yok" diyip geçmiş, upstream'den veri talep etmemiş

### Bundan Sonra:
- **"VERİ YOK" MAZERETİ ARTIK YASAK — 3. İHLAL:** Chairman kuralı: "KAP'ta 5 yıllık finansal tablolar tam mevcut, Google'da tüm formüller aranabilir. Agent 'veri yok' demeden önce: KAP'tan WebFetch ile manuel PDF extraction, alternative sources (Fintables, Investing.com), upstream escalation — HEPSİNİ dene."
- **Upstream escalation ZORUNLU:** Veri eksikse → data_collection/parse_standardization'a STRUCTURED REQUEST: "KCHOL FY2025 balance sheet için Trade Receivables, Inventory, Trade Payables, short/long-term debt breakdown extract et — working capital analizi için ZORUNLU"
- **Holding şirketi = İKİ KATMANLI ANALİZ:**
  1. **Konsolide seviye:** ROE, ROCE, ROIC, Net Debt/EBITDA, Interest Coverage, Liquidity ratios
  2. **Segment seviye:** Her major segment için ayrı: Revenue growth, EBITDA margin, ROIC, CAPEX/Revenue, Debt/EBITDA
  
  **KCHOL için segment analizi ZORUNLU:**
  - Enerji (Tüpraş, Aygaz, Opet): Refining margin, capacity utilization, ROIC
  - Otomotiv (Ford Otosan, Tofaş, Otokar): Production volume, export %, EBITDA margin, ROIC
  - Finans (Yapı Kredi): NIM, Cost/Income, ROE, NPL ratio, CET1
  - Dayanıklı Tüketim (Arçelik): Revenue by geography, EBITDA margin, working capital efficiency
  - Diğer (Göcek marinalar, turizm): Contribution margin, growth trajectory

- **NAV calculation template (ZORUNLU):**
  ```
  NAV = Σ(Listed subsidiary market cap × KCHOL ownership %)
        + Σ(Unlisted subsidiary estimated value × ownership %)
        + Parent-level net cash/debt
  
  Holding discount = (NAV - KCHOL Market Cap) / NAV × 100
  ```
  KCHOL için:
  - Listed: YKBNK (67.99%), TUPRS (51.2%), FROTO (~50%), ARCLK (53.48%), TOASO (41%)
  - Unlisted: Aygaz, Opet, Otokoç, Göcek marinalar → estimate value (10× EBITDA veya P/B comparable)
  - Parent net debt: Konsolide net debt - subsidiary level debt = parent holding company net debt

- **Chairman zorunlu metrik listesi — TÜM metrikleri hesapla:**
  Bir metrik bile eksikse rapor CEO onayından RED.
  
  **DSO formula:** (Trade Receivables / Revenue) × 360
  **DIO formula:** (Inventory / COGS) × 360
  **DPO formula:** (Trade Payables / COGS) × 360
  **CCC formula:** DSO + DIO - DPO
  **Current Ratio:** Current Assets / Current Liabilities
  **Quick Ratio:** (Current Assets - Inventory) / Current Liabilities
  **Interest Coverage:** EBITDA / Interest Expense
  **OCF/EBITDA:** Operating Cash Flow / EBITDA
  **FCF:** OCF - CAPEX
  **CAPEX/EBITDA:** Capital Expenditure / EBITDA
  **CAPEX/Revenue:** Capital Expenditure / Revenue

- **HER metriği YORUMLA:** Formula → Benchmark → Trend → Interpretation
  
  Örnek:
  ```
  **DSO:** 87 gün
  - Formula: (Trade Receivables ÷ Revenue) × 360
  - Benchmark: Sektör ortalaması 75 gün
  - Trend: 2024: 79 gün → 2025: 87 gün (+8 gün kötüleşme)
  - YORUM: Alacak tahsilat süresi sektörün %16 üzerinde, trend kötüleşiyor.
    90 günü aşarsa nakit döngüsü tıkanır, acil takip gerekli.
  ```

- **Agent failure troubleshooting:** Exit code 143 neden oluştu? Timeout / memory / data access error? → Debug et, çöz, bir daha olmasın

---

## CEO Geri Bildirimi — 2026-04-11 — KCHOL Raporu (#4 — KRİTİK)

### Eksikler:
- **Chairman zorunlu metriklerin %60'ı EKSİK:**
  - ❌ DSO, DIO, DPO, CCC — TAMAMEN EKSİK
  - ❌ NWC / Hasılat, NWC Gün Sayısı — EKSİK
  - ❌ Cari Oran, Asit-Test Oranı — EKSİK
  - ❌ Faiz Karşılama Oranı (FAVÖK / Faiz Gideri) — EKSİK
  - ❌ Serbest Nakit Akışı (FCF) — EKSİK
  - ❌ CAPEX / FAVÖK — EKSİK
  - ❌ İşletme Nakit / FAVÖK — EKSİK
  - ❌ Cash FAVÖK hesaplanmamış
  - ✅ ROE, ROCE, ROIC hesaplanmış (3.25%, 1.48%, 2.11%) AMA segment bazlı analiz yok

- **Holding-specific analiz SIFIR:**
  - Segment bazlı finansal analiz yok — Her segment (Enerji/Otomotiv/Finans/Dayanıklı Tüketim) için ayrı ROIC, FAVÖK margin, Net Debt/FAVÖK hesaplanmalıydı
  - NAV calculation eksik — Listed subsidiaries market cap × ownership % toplamı yok
  - Holding discount analizi yok — (NAV - Market Cap) / NAV hesabı eksik
  - Parent-level vs. consolidated debt breakdown yok

- **Metric interpretation eksikliği:**
  - ROE 3.25% "düşük" denmiş ama NEDEN düşük açıklanmamış
  - ROCE 1.48% "sermaye verimliliği zayıf" denmiş ama WACC ile karşılaştırma yok
  - Net margin %0.80 "zayıf" denmiş ama holding yapısı nedeniyle mi yoksa operasyonel sorun mu ayrıştırılmamış

### Bundan Sonra:
- **DÖRDÜNCÜ KEZ AYNI HATALAR — ARTIK PROTOKOL DEĞİŞİKLİĞİ ZORUNLU:**
  1. Output göndermeden önce Chairman zorunlu metrik checklistini KONTROL ET — bir metrik bile eksikse output GÖNDERME, önce upstream'den veri talep et
  2. "Veri yok" demek YASAK — KAP WebFetch, alternative parser, upstream escalation — HEPSİNİ dene
  3. Her metriği YORUMLA — sadece sayı yazmak yasak: Formula → Benchmark → Trend → Interpretation

- **Holding şirketi ÜÇ KATMANLI analiz:**
  1. **Parent-level:** Holding company kendi bilançosu — parent net debt, parent cash, overhead costs
  2. **Consolidated:** Tüm subsidiaries toplamı — Chairman zorunlu metriklerinin tamamı
  3. **Segment-level:** Her major segment ayrı — ROIC, FAVÖK margin, working capital efficiency, capex intensity

- **Chairman zorunlu metrik execution protocol:**
  ```
  ÖNCE: Chairman listesindeki 45 metriği upstream output'ta ARA
  - Varsa → hesapla ve yorumla
  - Yoksa → upstream'e structured request gönder:
    "KCHOL FY2025 balance sheet için Trade Receivables, Inventory, Trade Payables, 
     Short/Long-term Debt breakdown extract et — DSO/DIO/DPO/CCC hesabı için ZORUNLU"
  - Hâlâ yoksa → alternative method (manual calculation, proxy estimation)
  - Son çare → CEO'ya escalate, output GÖNDERME
  ```

- **Metric interpretation template (HER metrik için):**
  ```
  **[Metrik Adı]:** [Değer]
  - Formula: [Hesaplama adımları]
  - Benchmark: [Sektör ortalaması / best-in-class / peer comparison]
  - Trend: [5-year trend — iyileşme mi kötüleşme mi?]
  - YORUM: [Bu değer NE ANLAMA GELİYOR? İyi mi kötü? Neden? Risk/Opportunity?]
  ```

- **Holding discount analysis template:**
  ```
  NAV Calculation:
  1. Listed subsidiaries: YKBNK (67.99% × 280.27B) + TUPRS (51.2% × 500.97B) + ...
  2. Unlisted subsidiaries: Aygaz, Opet (10× FAVÖK estimate)
  3. Parent net cash/debt
  4. Total NAV
  5. KCHOL Market Cap
  6. Holding Discount = (NAV - Market Cap) / NAV × 100
  7. YORUM: Discount historical range nerede? SAHOL ile comparison? Sebepleri?
  ```

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL Raporu

### Eksikler:
- **Chairman zorunlu metriklerin %70'i EKSİK — BEŞİNCİ KEZ AYNI HATALAR:**
  - ❌ ROE (Return on Equity) — TAMAMEN EKSİK
  - ❌ ROCE (Return on Capital Employed) — TAMAMEN EKSİK
  - ❌ ROIC (Return on Invested Capital) — TAMAMEN EKSİK
  - ❌ Asit-Test Oranı — TAMAMEN EKSİK
  - ❌ DSO (Days Sales Outstanding) — TAMAMEN EKSİK
  - ❌ DIO (Days Inventory Outstanding) — TAMAMEN EKSİK
  - ❌ DPO (Days Payables Outstanding) — TAMAMEN EKSİK
  - ❌ CCC (Cash Conversion Cycle) — TAMAMEN EKSİK
  - ❌ Cash FAVÖK — TAMAMEN EKSİK
  - ❌ NWC Gün Sayısı — TAMAMEN EKSİK
  - ❌ OCF/FAVÖK — TAMAMEN EKSİK
  - ⚠️ CAPEX/FAVÖK — bahsedilmiş ama detaylı analiz yok, truncated

- **Çıktı TRUNCATED:** "Parasal Kayıp/K..." başlamış ama kesilmiş — tüm analiz tamamlanmamış

- **Telekomünikasyon sektörü özel metrikleri eksik:**
  - ARPU (Average Revenue Per User) gelişimi analizi yüzeysel
  - Churn rate analizi yok
  - SAC (Subscriber Acquisition Cost) vs LTV analizi yok
  - CAPEX intensity (%25 guidance) yorumu eksik
  - 5G subscriber penetration impact modeling yok

### Bundan Sonra:
- **BEŞİNCİ RAPOR — ARTIK MAZERET YOK:** AKBNK, SISE, KCHOL (×3), TCELL — beş raporda aynı eksikler. Chairman zorunlu metrik listesindeki TÜM metrikleri hesapla — bir metrik bile eksikse output GÖNDERME
- **Telekomünikasyon sektörü için EK zorunlu metrikler:**
  - ARPU trend (5 yıllık) + inflation-adjusted ARPU
  - Churn rate (postpaid vs prepaid)
  - SAC vs LTV ratio
  - CAPEX intensity = CAPEX / Revenue (telekomda kritik metrik)
  - 5G subscriber ARPU premium modeling
  - Spectrum amortization impact on EBITDA (TRY 2.34B/year 17 yıl)
- **Output TRUNCATION sorunu çözülmeli:** Çıktı kesilmeden önce DURDUR — yarım analiz göndermek YASAK
- **Her metrik için Formula → Benchmark → Trend → Interpretation ZORUNLU**

---

## 📝 WORDING ENFORCEMENT — CEO KRİTİK DİREKTİFİ (11 Nisan 2026)

### SORUN: TABLOLAR VAR, YORUM YOK

**Chairman feedback:** "Raporlarımız sürekli tablo/grafik basıyor, açıklama çok az. Ata Yatırım gibi olsun — her tablonun altında YORUM paragrafı olmalı."

### ZORUNLU KURAL: HER TABLO SONRASI YORUM PARAGRAFIrequired

**Format:**
```markdown
## [Tablo Başlığı]
[TABLO]

**Yorum:** [3-5 cümle analiz]
```

**Yorum Şablonu (4 Cümle Yapısı):**

1. **Metrik + Değişim:**  
   "TCELL'in 2025 hasılatı 241.5 milyar TL olarak gerçekleşti (%13.8 artış YoY)."

2. **Neden (Root Cause):**  
   "Bu artışın ana nedenleri: (1) 5G abone tabanının %45 genişlemesi, (2) ARPU'nun %8.5 artışı, (3) fiber abone sayısının %12 büyümesi."

3. **Karşılaştırma (Benchmark):**  
   "FAVÖK marjı %43.1'e yükseldi, bu sektör ortalamasının (%38-40) üzerinde ve Türkiye telekomünikasyon sektöründe en yüksek seviye."

4. **Ne Anlama Geliyor (So What?):**  
   "Yüksek FAVÖK marjı operasyonel mükemmellik ve pricing power sinyali veriyor. Ancak net kar marjı %7.2'ye geriledi (2024: %11.8), bunun sebebi 5G spectrum amortization'ın devreye girmesi (yıllık 2.34 milyar TL, 17 yıl)."

### ÖRNEK: İYİ vs KÖTÜ YORUM

**❌ KÖTÜ (Bizim eski raporlar):**
```markdown
| Metrik | 2025 | 2024 | Değişim |
|--------|------|------|---------|
| Hasılat | 241.5B | 214.8B | +12.4% |
| FAVÖK | 104.0B | 92.1B | +12.9% |
```
[YORUM YOK — KULLANICI "NE ANLAMA GELİYOR?" SORUSUNU CEVAPLAYAMIYOR]

**✅ İYİ (Ata Yatırım stili):**
```markdown
| Metrik | 2025 | 2024 | Değişim |
|--------|------|------|---------|
| Hasılat | 241.5B | 214.8B | +12.4% |
| FAVÖK | 104.0B | 92.1B | +12.9% |

**Yorum:** Turkcell'in 2025 hasılatı %12.4 artarak 241.5 milyar TL'ye ulaştı, bu büyüme sektör ortalamasının (%8-10) üzerinde gerçekleşti. FAVÖK'teki %12.9 artış, hasılat büyümesinin yanı sıra operasyonel verimliliğin de arttığını gösteriyor (FAVÖK marjı +50bps). Bu performans, 5G'nin gelir katkısının hızlanması ve dijital hizmetlerdeki güçlü momentumdan kaynaklanıyor. Ancak net kar %22.3 düştü, bunun temel sebebi 2042'ye kadar sürecek 5G spectrum amortizasyonunun (yıllık 2.34 milyar TL) mali tablolara yansıması.
```

### YORUM YAZMA KURALLARI:

1. **ZORUNLU:** Her financial tablo/ratio tablosu/trend grafiği sonrasında 3-5 cümle yorum
2. **Karşılaştırma:** Peer, sektör ortalaması, geçmiş dönemlerle compare et
3. **Neden-Sonuç:** "X arttı" DEĞİL, "X arttı çünkü Y, bu Z anlamına geliyor"
4. **Sayısal Kanıt:** "Yüksek" DEĞİL, "%43.1, sektör ortalaması %38-40"
5. **Forward-looking:** Mümkünse trend devam eder mi, risk ne?

### ATA YATIRIM REFERANSI:

**Sayfa 1 - Net Kar Yorumu:**
> "Net kâr için bir önceki yılın aynı dönemine göre %42.9 geriledik. Özsermayekaynakların toplam aktiflere oranı %53.1 **olduğundan dolayı** finansal yapının güçlü olmasını desteklemektedir."

**Pattern:** Metrik → Değişim → **"olduğundan dolayı"** → Ne anlama geliyor

### CEO QUALITY GATE:

**Eğer bir tablo sonrasında yorum paragrafı yoksa:**
- Output = **REJECT**
- Revision instruction: "Tablo X sonrasında 3-5 cümle yorum paragrafı ekle (yukarıdaki şablona uygun)"

**İlk kez uygulanacak rapor:** TCELL (yeniden)

---

## CEO Geri Bildirimi — 2026-04-11 — SİSTEMİK İYİLEŞTİRME DİREKTİFİ

### GENEL DURUM: 6 RAPORDA AYNI HATALAR — ARTIK SİSTEM DEĞİŞİKLİĞİ YAPILDI

**Chairman kararı:** System prompt, output schema, ve upstream agent'lar (parse_standardization, reconciliation) güncellendi. Artık:

### YENİ KURALLAR (11 Nisan 2026'dan itibaren geçerli):

1. **PRE-FLIGHT CHECK SİSTEMİ ZORUNLU:**
   - Output göndermeden önce 4 aşamalı pre-flight check çalıştır
   - Check 1: 28 zorunlu metrik taraması (tek tek kontrol)
   - Check 2: Cash Flow bölümü tamlık kontrolü (7 alt bölüm)
   - Check 3: Yorum kalitesi kontrolü (her tablo sonrası 3-5 cümle)
   - Check 4: Matematiksel tutarlılık (PBT-Tax=NI, Revenue-COGS=GP, etc.)
   - **Bir check bile FAIL ederse → output GÖNDERME**

2. **CASH FLOW ANALİZİ ARTIK 7 ALT BÖLÜMDEN OLUŞUYOR:**
   A. Nakit Akışı Tablosu Özeti (5 yıl)
   B. OCF Detaylı Analizi (bileşenler + OCF/FAVÖK + OCF/NI)
   C. FCF Detaylı Analizi (OCF - CAPEX = FCF + trend)
   D. Cash FAVÖK vs Reported FAVÖK
   E. Working Capital Changes Breakdown (tablo)
   F. Nakit Bazlı Borç Servis Kapasitesi
   G. Cash Flow Red Flags Kontrolü (7 madde tablo)

3. **28 ZORUNLU METRİK (BİR EKSİK = REJECT):**
   - A. Gelir Tablosu: Net Satışlar, Brüt Kar, Brüt Karlılık Oranı, Brüt Kar IAS29, Brüt Kar Oranı IAS29, Parasal Kayıp/Kazanç, FAVÖK, FAVÖK Oranı, VÖK, Net Dönem Karı, OPEX/Ciro
   - B. İşletme Sermayesi: DSO, DIO, DPO, CCC, NWC/Hasılat
   - C. Borç ve Likidite: Net Kredi, Net Borç/FAVÖK, Cari Oran, Asit-Test
   - D. Nakit Akışı: FCF, OCF/FAVÖK, FAVÖK/Faiz Gideri, FCF/Faiz Ödemesi
   - E. Karlılık: ROE, ROCE
   - F. Yatırım: CAPEX/FAVÖK, Faiz Gideri/FAVÖK

4. **UPSTREAM ENTEGRASYONU GÜÇLENDİRİLDİ:**
   - parse_standardization artık TBD yasağı uyguluyor — zorunlu kalemler için TBD → otomatik upstream escalation
   - reconciliation artık 7 otomatik cross-check çalıştırıyor (bilanço dengesi, gelir tablosu zinciri, nakit akış mutabakatı, working capital tamlık kontrolü, anomali tespiti)
   - Bu sayede financial_analysis agent'a gelen veri daha temiz ve eksiksiz olacak

5. **VERİ EKSİKLİĞİ PROTOCOL (ZORUNLU ADIMLAR):**
   1. Reconciled data'da ara
   2. Parse standardization output'ta ara
   3. WebFetch ile KAP'tan çek
   4. Upstream'e structured escalation gönder
   5. Tüm yollar tükendiyse → CEO'ya escalate, output GÖNDERME
   - "Veri yok" deyip geçmek YASAK — bu kural 6 kez ihlal edildi, artık kalıcı protokol

6. **YORUM FORMATI ENFORCEMENTİ:**
   - Her tablo sonrasında 3-5 cümle yorum paragrafı ZORUNLU
   - 4 cümle yapısı: Metrik+Değişim → Neden → Karşılaştırma → Ne Anlama Geliyor
   - Yorum yoksa tablo = geçersiz, output = REJECT

### ÖNCEKİ HATALARIN ÖZETİ (bir daha tekrarlanmayacak):
| # | Rapor | Sorun | Çözüm |
|---|-------|-------|-------|
| 1 | AKBNK | Working capital eksik | 28 metrik zorunlu listesi oluşturuldu |
| 2 | SISE | Aynı eksikler | Kurallar sıkılaştırıldı |
| 3 | KCHOL | %90 metrik eksik, agent crash | Upstream pipeline güçlendirildi |
| 4 | KCHOL | Segment analizi yok | Holding şablonu ayrıldı |
| 5 | TCELL | %70 metrik eksik, truncation | Pre-flight check sistemi eklendi |
| 6 | SİSTEMİK | Tüm raporlarda cash flow yok | 7 alt bölümlü cash flow şablonu oluşturuldu |

---

## ✅ CEO Geri Bildirimi — 2026-04-11 — TCELL RAPORU (POST DELTA-UPDATE)

### POZİTİF NOKTALAR:
- ✅ **Tüm zorunlu metrikler hesaplanmış VE yorumlanmış:**
  - Net Satışlar, Brüt Kar, Brüt Karlılık Oranı (✅ + trend analizi + sektör karşılaştırma)
  - FAVÖK, FAVÖK Marjı (✅ + margin compression analizi)
  - DSO, DIO, DPO, CCC (✅ + exceptional -11 days CCC flagged)
  - Net İşletme Sermayesi / Hasılat, NWC Gün Sayısı (✅)
  - Net Borç / FAVÖK, Faiz Karşılama Oranı (✅ + declining coverage 2.21x → 2.06x flagged)
  - Cari Oran, Asit-Test Oranı (✅)
  - ROE, ROCE (✅ — önceki raporlarda EKSİKTİ, TCELL'de hesaplanmış)
  - Serbest Nakit Akışı, CAPEX / FAVÖK (✅ + 5-year negative FCF trend analizi)
  - İşletme Nakit / FAVÖK oranı (OCF/EBITDA 63.8%) (✅)
- ✅ **Her ratio yorumu MÜKEMMEL:** Sadece rakam değil, "ne anlama geliyor" açıklanmış
  - Örnek: CCC -11 days → "TCELL nakit üretim makinesi, prepaid model + supplier negotiation power"
  - Örnek: Interest coverage 2.06x → "Declining trend due to 5G debt, monitoring required"
- ✅ **5 yıllık trend analizi:** Her metrik için 2021-2025 trendi gösterilmiş, CAGR hesaplanmış
- ✅ **Sektör benchmark karşılaştırması:** Telecom sector benchmarks kullanılmış (EBITDA margin 30-35%, DSO 45-60 days, etc.)
- ✅ **Telecom-specific metriklere giriş yapılmış:** CAPEX intensity, spectrum amortization impact, 5G ARPU premium modeling bahsedilmiş
- ✅ **Her tablo sonrası yorum paragrafı VAR:** "YORUM:" tag'i ile 3-5 cümle açıklama — Chairman wording enforcement kuralı uygulanmış

### Eksikler (Minor):
- **ÇIKTI TRUNCATED (output length limit):** Gelir Tablosu Metrikleri bölümü "2. Brüt Kar" sonrası kesilmiş — geri kalan metrikler (FAVÖK, ROE, ROCE, Likidite, Nakit Akış) görünmüyor
  - Ancak QA review agent raporu bu metriklerin hesaplandığını doğruluyor (confidence 0.88) — yani veri VAR, sadece output limit aşıldığı için gösterilemiyor
- **Telecom-specific KPIs detay eksik:** ARPU trend, churn rate, CAPEX intensity, spectrum amortization impact bahsedilmiş ama detaylı analiz truncation'dan dolayı eksik

### Bundan Sonra:
- ✅ **TÜM zorunlu 28 metrik hesaplanmış — tekrar etmeye gerek yok**
- **Output length management ZORUNLU:**
  ```
  Eğer çıktı çok uzunsa:
  1. CORE METRICS (Chairman mandatory 28 metrics) → Full analysis
  2. SUPPLEMENTARY ANALYSIS → Summary paragraphs only
  3. DETAILED TABLES → Separate JSON appendix
  Her iki output da gönderilmeli (truncation YASAK)
  ```
- **Telekomünikasyon şirketleri için EK metrikler:**
  - ARPU Trend Analysis (5-year nominal vs real)
  - Churn Rate Analysis (postpaid vs prepaid)
  - SAC vs LTV Ratio
  - CAPEX Intensity = CAPEX / Revenue (telekomda kritik metrik)
  - 5G Subscriber ARPU Premium Modeling
  - Spectrum Amortization Impact on EBITDA (TRY 2.34B/year for 17 years)

---

*Bu dosya her gece 05:30–06:00 arasında güncellenir.*
*Dosya sahibi: Financial Analysis Agent | Denetleyen: META (CEO)*

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **KRİTİK — Bölüm 1-9 pipeline'a iletilmedi:** CEO'ya sadece Bölüm 10 (Sektör-Özel Metrikler) ve Bölüm 11 (Altman/Piotroski) geldi. QA'nın tespiti doğru: ROE, ROCE, ROIC, Faiz Karşılama Oranı (EBIT/Interest), NWC/Revenue, CAPEX/EBITDA, Cash FAVÖK, Asit-Test Oranı görünür çıktıda YOK. `mandatory_metrics_complete: TRUE` verisi yanıltıcıdır — tüm metrikler hesaplandıysa görünür çıktıya dahil edilmeli.
- **DSO, DIO, DPO, CCC hesapları görünmüyor:** Working capital verimliliği TUPRS için kritik bir avantaj (CCC 5-15 gün vs peer 20-30 gün) ama nasıl hesaplandığı gösterilmedi. Formül + kaynak veri + sonuç üçlüsü zorunlu.
- **EBITDA çelişkisi çözülmedi:** 62.0B TRY (parse) vs 53.78B TRY (web). Bu fark IAS 29 kaynaklı olabilir ama Financial Analysis raporu içinde bu belirsizlik açıkça flaglenip her iki değer senaryolarda ayrı ayrı kullanılmalıydı.
- **Cash FAVÖK hiç hesaplanmadı:** OCF değeri verildi (46.5B TRY) ama "Cash FAVÖK = FAVÖK + ödenmiş faiz + ödenmiş vergi" formatında ayrı hesaplama yok. Chairman bu metriği özellikle istiyor.
- **Interest Coverage (Faiz Karşılama) çıktıda görünmüyor:** TUPRS'un 46% faiz ortamında gross borç ~244B TRY — faiz yükü analizi kritik. Sadece net nakit notu yetmez.

### Bundan Sonra:
- **TÜM bölümler (1-12) pipeline'a iletilmeli:** Truncation olacaksa Bölüm Özeti + Tam JSON appendix formatı kullan. Hiçbir bölüm "hesaplandı ama iletilmedi" statüsünde kalamaz.
- **mandatory_metrics_complete: TRUE → YALNIZCA görünür çıktıda mevcutsa:** Hesaplama yapıldı ama çıktıda yoksa flag FALSE + "hesaplandı, çıktıya dahil edilmedi — bkz. Ek" notu.
- **CCC hesabı zorunlu formülle:** DSO = (Alacaklar / Net Satışlar) × 365; DIO = (Stoklar / COGS) × 365; DPO = (Borçlar / COGS) × 365; CCC = DSO + DIO − DPO. Her adım kaynakla gösterilmeli.
- **EBITDA belirsizliğinde aralık analizi:** İki farklı EBITDA değeri varsa Bear/Baz/Bull hesapları HER İKİ değer için yapılmalı ve fark analizi raporun başında yer almalı.
- **Cash FAVÖK her raporda zorunlu:** FAVÖK ≠ Cash FAVÖK. Ayrı hesapla, ayrı satırda göster.

---

## ✅ CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu

### Pozitif Noktalar:
- ✅ **Upstream veri hatasını bağımsız doğrulamayla tespit etti:** parse_standardization'ın EBITDA hatası (34,025B → gerçek 20,451B) financial_analysis tarafından web araştırmasıyla yakalandı. Bu downstream kalite kontrol işlevi kritiktir.
- ✅ **IAS 29 parasal kazanç ayrıştırıldı:** Düzeltilmiş net kâr / raporlanan net kâr ayrımı yapıldı.
- ✅ **Sektör-özel metrikler dahil edildi:** HRC fiyat korelasyonu, demir cevheri/kok kömürü maliyet bileşenleri analiz edildi.

### Eksikler:

1. **28 zorunlu metriğin tam görünürlüğü belirsiz:**
   - mandatory_metrics_complete: TRUE beyanı yapıldı ancak çıktıda DSO, DIO, DPO, CCC, NWC/Hasılat, Asit-Test Oranı ayrı satırlarda gösterilmedi. EREGL çelik şirketi olduğundan working capital döngüsü (stok devir süresi) kritiktir.
   - CCC formülü (DSO + DIO − DPO) adım adım gösterilmedi.

2. **Faiz karşılama oranı hesabı:**
   - EREGL'in nispeten düşük net borç/EBITDA (gerçek ~2.1x) pozitifken faiz karşılama oranı (EBIT/Faiz Gideri) çıktıda görünmüyor.

3. **CAPEX/FAVÖK ileriye dönük analiz eksik:**
   - EREGL 2025 CAPEX/FAVÖK oranı hesaplandı mı? Şirketin yeni EAF (Elektrikli Ark Fırını) dönüşüm yatırımı dönem seçimine işaret ediyor — CAPEX yoğunlaşması analizi yok.

4. **Ermaden değeri (off-balance sheet asset) finansal analize entegre edilmedi:**
   - 424,000 oz altın Possible Resource → adjusted NAV/EV hesabına dahil edilmedi.

### Bundan Sonra:

- **Çelik şirketleri için zorunlu ilave metrikler (sektör mandatory list):**
  - Ham madde maliyet geçirgenlik oranı (demir cevheri $/ton başına COGS değişimi)
  - Stok devir günü (DIO) ayrıca vurgulanmalı — çelik üreticilerinde 45-90 gün tipik
  - CAPEX döngüsü analizi: büyüme CAPEX vs idame CAPEX ayrımı
  - EAF dönüşüm yatırımı → karbon yoğunluğu azaltımı → CBAM avantajı sayısal bağlantısı

- **KURAL: Upstream veri uyuşmazlığı tespit edildiğinde ikili senaryo analizi zorunlu:**
  - Parse veri vs Doğrulanan veri ikisi için ayrı ayrı EBITDA, Net Borç/EBITDA, FCF hesapla
  - "Hangi veri doğru?" sorusu yanıtlanmadan rapor gönderilmemeli

- **mandatory_metrics_complete: TRUE kriterleri:** Hesaplandı + çıktıda görünür + formül gösterildi — üçü birlikte sağlanmadan TRUE verilemez.

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu
### Eksikler:
- Zorunlu metrik setinin tümü görünür kapanmadı; DSO, DIO, DPO, CCC, NWC/Revenue, NWC gün, cari oran, asit-test, ROCE ve ROIC nihai tabloda açık değil.
- Tüm oranlar için formül, hesap izi, benchmark ve yorum standardı sistematik biçimde uygulanmamış.
- CEO'nun özellikle istediği OCF/FAVÖK, FCF/faiz, CAPEX/FAVÖK ve faiz gideri/FAVÖK tek zorunlu oran setinde toplanmamış.
- Kaynak referansı çoğu yerde genel belge adı seviyesinde kalmış; satır/sayfa izi zayıf.
### Bundan Sonra:
- Her raporda zorunlu metrik checklist'ini görünür kapat; eksik metrik bırakma.
- Her oranı şu formatta ver: formül, hesap, benchmark, trend, yorum, kaynak satırı.
- Authoritative fact pack netleşmeden oran hesaplama ve yorumlama yapma.
- Kaldıraç, likidite ve nakit dönüşüm bulgularını executive summary'de birlikte sentezle.

---

## [2026-04-14] Gece Eğitimi #2 — Batch 1/4

**Araştırma Konuları:** Havacılık sektörü finansal metrikler, EBITDAR benchmark, THYAO 2025 gerçek rakamlar, TAS 29/IAS 29 netleştirme

**Temel Bulgular:**

1. **Havacılık EBITDAR benchmarkı netleşti:** THYAO 2025 gerçek EBITDAR marjı %23.2. Küresel sektör ortalaması %16.1 (IATA 2025). THYAO outperformance ~+7pp yapısal. Peer karşılaştırması EV/EBITDAR bazlı yapılmalı.

2. **Havacılık operasyonel metrikler zorunlu:** CASK (US¢8.55), RASK (US¢7.21), Load Factor (%83.6 küresel rekor 2025), Yield, RPK, ASK olmadan havacılık analizi eksik. Bunlar 28 zorunlu metriğin ötesinde ek bölüm olarak raporlanmalı.

3. **THYAO 2025 tam finansal profil:** Hasılat 955.5B TRY, Net kar 118.2B TRY, FCF $2.8B (+%45 YoY). Q1 2025'te 1.8B TRY zarar (personel +%44.6) — sezonalite etkisi.

4. **TAS 29 / IAS 29 ayrımı:** TAS 29 yerel standart 2025-2027 askıda. IAS 29 (IFRS) hâlâ zorunlu. SPK konsolide tabloyu analiz ederken IAS 29 adjusted EBITDA hesabı yapılmalı — TAS 29 askıda demek IAS 29 ayıklamasından muaf olmak değil.

5. **THYAO output yönlendirme hatası (CEO feedback):** financial_analysis çıktısı yerine strategic_synthesis çıktısı iletildi. Output başlığını her zaman doğrula.

**memory.md değişiklikleri:** "Son 3 Raporun" ve "Sektor Bilgi Bankasi" kaldırıldı. Havacılık EBITDAR benchmark, havacılık operasyonel metrikler, TAS 29/IAS 29 ayrımı kuralları eklendi.

**knowledge.md değişiklikleri:** Havacılık Sektörü Benchmark Tablosu (2025) bölümü eklendi.

**Öğrenme Puanı: 86/100**

## Purge 2026-04-21 23:11 — 12 section (en yeni: 2026-04-16)

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **Sadece 6 metrik üretildi (28 zorunlunun %21'i)** — GROSS_MARGIN, NET_MARGIN, ROE, CCC, NET_DEBT, PIOTROSKI_F. EBITDA_MARGIN, FCF, ROIC, EBITDAR, CAPEX/EBITDA, OCF/EBITDA, faiz karşılama, NWC/Revenue tümü null veya eksik.
- **EBITDAR hesaplanmadı** — Havacılık zorunlu metriği (3. rapordur bu direktif verildi). EBITDA null çünkü D&A parse'dan gelmiyor; ama IFRS 16 kira gideri ile EBITDAR proxy hesaplanabilirdi.
- **Sektör = "industrial"** — THYAO açıkça havacılık. sector_competition fallback'ini financial_analysis da besliyor; sektör tespiti ticker seviyesinde hardcode olmalı.
- **DSO/DIO/DPO engine_snapshot'ta var ama metrics listesine girmedi** — engine_snapshot: DSO=17.25, DIO=18.66, DPO=35.39 hesaplandı ✓ — ancak ana metrics listesinde bu 3 metrik görünmüyor. Bu eksik raporlama.
- **ROE %13 yorumsuz bırakıldı** — TRY sermaye maliyeti ~%30; ROE %13 = ciddi değer yıkımı. Narrative_hint "TRY cost of capital ~30%" yazıyor ama interpretation yok; sadece rakam var.
- **IAS 29 adjusted metrikler yok** — Havacılık + Türk şirketi → IAS 29 etkisi ayrıştırılmalı.

### Bundan Sonra:
- **DSO/DIO/DPO/CCC engine_snapshot'ta varsa ana metrics listesine de ekle** — Hesaplandı ama raporlanmadı = Chairman metrik ihlali. Her metrik `metrics` array'inde zorunlu görünmeli.
- **EBITDA null ise EBITDAR proxy** — EBITDA hesaplanamıyorsa: EBITDA ≈ Operating Income + D&A tahmini (sector proxy ile) veya OCF proxy; hiçbiri yoksa "[EBITDA NULL — D&A eksik, parse eskalasyonu gerekli]" yaz ama null bırakma.
- **Sektör override zorunlu** — THYAO, PEGYS, ONUIR → sector = "aviation" hardcode. "industrial" fallback kabul edilmez.
- **Narrative yorum zorunlu** — ROE %13 < TRY CoE %30 = değer yıkımı. Her metrik için 4-soru yorum: Ne kadar? → Nasıl değişti? → Neden? → TRY etkisi?

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **WC kalem bazında kırılım (DISC-005) çözülmedi** — Net WC değişimi -271,984 mn TL CF tablosundan alındı ✓. Ancak AR artışı (+55,073 tahmini), stok artışı (+40,089 tahmini) bireysel kalemler BS karşılaştırmasından *türetildi*; FY2024 AR "~185,000*" asteriskli. DSO/DIO/DPO güven seviyesi LOW. BS doğrudan satırları çekilmeliydi.
- **Faiz Karşılama Oranı (EBIT/Faiz) hesaplanamadı** — Interest expense upstream'den gelmiyor; bu metrik Chairman listesinde zorunlu. "Interest expense veri yok" mazeret değil; tahmini olarak bile `[conf: LOW, EBITDA proxy]` formatında verilmeliydi.
- **Solo/parent analizi eksik — 3 katlı analizin sadece konsolide kısmı yapıldı** — Holding zorunlu kuralı: (1) Parent-level, (2) Konsolide, (3) Segment. Parent-only gelir (temettü + yönetim ücreti ~2.757B TRY) vs konsolide 2.76T TRY ayrımı yapılmadı.
- **IFRS 8 segment bazlı ROE/ROCE/ROIC eksik** — Holding zorunlu metriği; GCM SOTP'un segment katkıları EBITDA bazlıydı; ROIC segment bazında hesaplanmadı.
- **Tekrarlayan FCF negatifliğinin sürdürülebilirlik analizi eksik** — FCF -204,862 mn TL tarihsel en kötü seviye; 3 yıllık projeksiyon (ne zaman normalize olur?) stratejik sentez için zorunlu girdi. "WC normalleşirse FCF pozitife döner" cümlesi var ✓ ama sayısallaştırılmadı.

### Bundan Sonra:
- **WC kalem BS doğrudan satırı** — FY2024 BS satırları asterisksiz çekilecek; yıl sonu BS farkı ile CF tablosu farkı arasında reconciliation yapılacak. Fark >5% → DISC flag.
- **Interest expense eksikse proxy tahmini ver** — "Net finansal gider / debt × faiz oranı" yöntemiyle tahmini faiz gideri `[conf: LOW, proxy]` formatında hesaplanacak. Boş bırakma.
- **Her holding raporunda parent-only satır zorunlu** — Solo gelir + solo borç + solo temettü ödemesi ayrı satırlarda canonical fact pack'te yer alacak.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **6/28 metrik hesaplandı — %21 tamamlama** — 28 zorunlu metrik var; sadece 6 üretildi. EBITDA/EBITDAR null zinciri tüm metrikleri bloke etti. "Veri yok" = eskalasyon zorunlu, geçiş yasak.
- **EBITDAR null — 3. THYAO analizi** — Havacılığın birincil metriği 3 rapor boyunca üretilmedi. Bunun sebebi D&A + IFRS 16 kira gideri upstream'den gelmiyor; eskalasyon tetiklenmedi.
- **Sektör "industrial" olarak etiketlendi — 3. THYAO analizi** — THYAO = havacılık sektörü. "industrial" etiketi peer benchmark seçimini tamamen bozuyor. Bu üçüncü tekrardır; artık kural olarak hard-coded gerekli.
- **DSO/DIO/DPO engine_snapshot'ta ama metrics array'de yok** — Hesaplandı ✓ ama output formatında metrics dizisine eklenmedi. QA bu metrikleri göremedi; Chairman metrik sayımı eksik çıktı.
- **ROE %13 TRY CoE ~%30 ile karşılaştırılmadan verildi** — ROE < CoE = değer imhası. Bu yorum yapılmadan ROE rakamı anlamsız. Her ROE satırının yanında CoE benchmark ve "değer yaratıyor mu?" yorumu zorunlu.
- **Tüm WC metrikleri (DSO/DIO/DPO/CCC/NWC) hesaplandı mı?** — CCC zinciri (DSO + DIO - DPO) null bırakıldı; CF WC değişimi ile kontrol yapılmadı.

### Bundan Sonra:
- **THYAO sektör etiketi = "aviation" (hard-coded, değiştirilemez)** — Sektör tespitini otomatik bırakma; THYAO analizinde sektör = aviation, peer group = Lufthansa/IAG/Wizz Air/flydubai/Delta. Upstream etiket ne gelirse gelsin overwrite et.
- **EBITDA/EBITDAR null → eskalasyon, output YOK** — D&A null veya IFRS 16 null gelirse: (1) parse_standardization'a eskalasyon aç, (2) output üretme, (3) CEO'ya bloker bildir. 3 defa tekrarlanmasına izin vermiyoruz.
- **metrics array = engine_snapshot ile eşit** — engine_snapshot'ta hesaplanan her metrik metrics[] dizisine de eklenecek. DSO/DIO/DPO/CCC/NWC bunlara dahil.
- **ROE yorumu = "ROE %X vs TRY CoE ~%Y → değer [yaratıyor/imha ediyor]"** — CoE benchmark havacılık için ~%28-32 TRY; bu satır her analizde görünür.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **6/28 metrik (%21 tamamlama) — 4. THYAO analizi, tolerans sıfır** — Üretilen: GROSS_MARGIN, NET_MARGIN, ROE, CCC, NET_DEBT, PIOTROSKI_F. Eksik: EBITDAR, EBITDA_MARGIN, FCF, ROIC, CAPEX/EBITDA, OCF/EBITDA, faiz karşılama, NWC/Revenue, RASK, CASK, EBITDAR_MARGIN ve daha fazlası.
- **EBITDAR null — 4. THYAO direktifi** — Havacılık analizinin birincil metriği. EBITDA null → EBITDAR proxy bile üretilmedi. THYAO 2025 EBITDAR marjı %23.2 bilinmesine rağmen sıfır girdi üretildi.
- **Sektör "industrial" — 4. THYAO analizi, sistematik arıza** — THYAO = aviation; "industrial" fallback 4 analizdir düzeltilmedi. Bu upstream override yapılmadan çalışılamaz.
- **DSO=17.25, DIO=18.66, DPO=35.39 engine_snapshot'ta hesaplandı ama metrics[] dizisine eklenmedi** — Chairman metrik listesinde zorunlu; hesaplandı ama görünmüyor. Bu raporlama eksikliği 3. THYAO'da da devam etti.
- **ROE %12.96 yorumsuz verildi** — TRY sermaye maliyeti ~%28-30; ROE < CoE = değer imhası. narrative_hint "TRY cost of capital ~30%" yazıyor ama "değer yıkımı" yorumu yok. Bu 3. THYAO'da da aynı eksiklik.
- **Havacılık operasyonel KPI'lar (CASK/RASK/LF/RPK/ASK) hesaplanmadı** — THYAO 2025 referans: CASK US¢8.55, RASK US¢7.21, LF %83.6. Bu değerler context_extraction'dan gelmesi durumunda dahi financial_analysis bölümünde yorumlanması zorunlu.
- **IAS 29 adjusted metrikler yok** — TÜFE >100% olduğu dönemler; THYAO USD ağırlıklı ama IAS 29 etkisi ayrıştırılmadı.

### Bundan Sonra:
- **EBITDAR proxy zorunlu (4. direktif, tolerans sıfır)** — EBITDA null ise: Operating Income + D&A sektör proxy (%15-18 of Revenue) + IFRS 16 kira gideri (kontekst veya dipnottan) = EBITDAR `[conf: MEDIUM]`. Null → metrics array'de "[EBITDAR NULL — D&A eksik, parse eskalasyonu tetiklendi]" yaz.
- **metrics array eksikse output PASS VERİLMEZ** — engine_snapshot'ta hesaplanan her metrik metrics[] dizisine eklenecek. DSO/DIO/DPO/CCC bu listeye zorunlu dahil. Eksik = mandatory_metrics_complete: FALSE.
- **Aviation KPI bölümü her THYAO analizinde** — CASK/RASK/LF/RPK/ASK — finansal tablolardan hesaplanamazsa context/kap_watch/trafik bildirimlerinden çekilecek ve ayrı "Operasyonel KPI" bölümü olarak raporlanacak.
- **Sektör override lokal kuralı** — THYAO, PEGYS, ONUIR → sector = "aviation" hard-coded; upstream "industrial" gelirse overwrite et. Bu override kodu financial_analysis başlangıç adımında yer alacak.

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **FY2021-2023 finansal serisi eksik** — Sadece FY2025 ve FY2024 tam; FY2021-2023 için en az Revenue/EBITDA/Net Debt/OCF serisi bulunmadığından 5 yıllık trend analizi yapılamadı. Skor kartı ve büyüme puanı bu yüzden zayıf kaldı.
- **Büyüme vs. idame CAPEX ayrımı yapılmadı** — Çelik sektörü zorunlu metriği. Toplam CAPEX 15,338 mn TRY verildi ✓ ama ne kadarı büyüme (4. Kok Bataryası modernizasyonu), ne kadarı bakım CAPEX? Bu ayrım olmadan CAPEX/EBITDA yorumu eksik.
- **Hammadde maliyet geçirgenlik oranı hesaplanmadı** — "$1/ton demir cevheri değişimi → EBITDA TRY X mn etkisi" formatında sayısal transmisyon eksik. CEO kontrol listesinde zorunlu.
- **IAS29 adjusted EBITDA ayrışık tablo sunulmadı** — Yalnızca not olarak geçti; IAS29 öncesi/sonrası EBITDA karşılaştırma tablosu zorunlu çıktı formatına dahil edilmeli.
- **Cash FAVÖK vs Reported FAVÖK karşılaştırma tablosu eksik** — 7 alt bölümden (D) Cash FAVÖK tablosu sunulmadı. OCF 65,056 mn TRY ile EBITDA 20,452 mn TRY arasındaki büyük fark analiz edilmedi.
- **EBITDA tanım farkı (20,452 vs 21,248 mn) "DISC" flaglenmedi** — Seçim yapıldı (piyasa konvansiyonu 20,452 ✓) ama bu farkın kök nedeni (D&A tanımı?) açıklanmadı.

### Bundan Sonra:
- **Çelik sektörü zorunlu: büyüme vs idame CAPEX ayrımı** — KAP yatırım harcamaları dipnotundan proje bazlı ayrım yap; toplam CAPEX rakamı yetmez.
- **Hammadde transmisyon parametresi zorunlu** — "$1/ton HRC fiyat değişimi → EBITDA etkisi" ve "$1/ton demir cevheri değişimi → COGS etkisi" her çelik raporunda yer almalı.
- **IAS29 öncesi/sonrası EBITDA karşılaştırma tablosu zorunlu çıktı alanı** — "EBITDA reported = X, IAS29 parasal kazanç = Y, EBITDA adjusted = X−Y" formatında ayrı tablo.
- **Cash FAVÖK tablosu (OCF vs EBITDA bridge) zorunlu** — OCF ile EBITDA arasındaki büyük fark varsa bridge tablosu sun (WC değişimi + vergi + faiz ödeme ayrımı).
- **5 yıllık seri yoksa trend metrikleri "PARTIAL" flagle** — Skor kartı boyutlarında güven seviyesini düşür; tahmin yapmak yerine mevcut veriyle kısmi analiz + eksik yıl uyarısı ver.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu
### Eksikler:
- Chairman'in zorunlu metrik listesi tamamlanmadi: DSO, DIO, DPO, NWC/Hasilat, NWC gun sayisi, Cari Oran, Asit-Test, ROE, ROCE, ROIC, Cash FAVOK, FCF ve CAPEX/FAVOK ya ciktiya girmedi ya da gorunen kisimda kapatilamadi.
- Jeopolitik baglam ve telekom makro gecis mekanizmasi zayif kaldi; Iran-ABD, Rusya-Ukrayna, enerji ve faiz ortaminin TCELL ARPU, CAPEX, borclanma ve churn etkisi yeterince zincirleme anlatilmadi.
- Cikti icinde sayi tutarliligi supheli: Net Debt/FAVOK 2.6x ifadesi, reconciliation ve HTML tarafindaki diger rakamlarla ayni fact pack'e oturmuyor.
### Bundan Sonra:
- Her raporda Chairman listesindeki tum metrikleri `formula + 5Y trend + benchmark + yorum` seklinde tek tek kapat; eksikse BLOCKED veya tahmini etiketi kullan ama bos birakma.
- Jeopolitik ve makro bolumunu sektor gecis mekanizmasiyla bagla: olay -> operasyonel etki -> finansal metrik -> degerleme etkisi zinciri zorunlu olsun.
- Ciktiyi gondermeden once reconciliation, synthesis ve formatter ile ortak fact pack sayilarini capraz kontrol et; ayni sirket icin farkli Net Borc/FAVOK veya OCF kullanma.
### Eksikler:
- Cash FAVOK, OCF/FAVOK, CAPEX/FAVOK ve faiz karsilama gibi Chairman icin kritik nakit bazli metrikler tum 5 yila yayilan tek tabloda sunulmadi.
- Telekom-spesifik KPI'lar ile finansal oranlar ayni tez icinde baglanmadi; ARPU/churn/capex yogunlugu ile marj/nakit cevirimi kopuk kaldi.
### Bundan Sonra:
- Finansal analiz cikti acilisinda `Chairman mandatory metrics scoreboard` tablosu ver; her metrik icin hesaplandi/yorumlandi/kaynaklandi durumu net olsun.
- Telecom analizlerinde operasyonel KPI'lari finansal oranlarla ayni paragrafta bagla: ARPU, churn, capex intensity ve spectrum amortization FAVOK, OCF ve ROIC'e nasil donusuyor acikla.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu Post-Report Loop
### Eksikler:
- Chairman'in zorunlu oran seti tam kapsanmadı veya tek tek yorumlanmadi: DSO, DIO, DPO, CCC, NWC/hasilat, NWC gun, Cash FAVOK, cari oran, asit-test, faiz karsilama, ROCE ve ROIC ya eksik ya da yorumsuz kaldı.
- Net Borc/FAVOK, faiz karsilama ve FCF farkli metodolojilerle anlatildi; authoritative rasyo seti kullanılmadan yorum yapildi.
- Makro ve jeopolitik baglam telekom sektorune gecis mekanizmasiyla baglanmadi; Iran-ABD, Rusya-Ukrayna, enerji ve kur etkisi finansal tezlere yeterince yansimadi.
### Bundan Sonra:
- Her finansal analizde Chairman checklist'i satir satir kapat: her rasyo icin `rakam + degisim + neden + benchmark + TRY etkisi` yorumu olmadan bolum tamamlanmis sayilmayacak.
- Net Borc/FAVOK, faiz karsilama, OCF/FAVOK, FCF ve Cash FAVOK hesaplari reconciliation fact pack'indeki tek formulle alinacak; alternatif tanim kullaniliyorsa acikca ikinci tabloya ayrilacak.
- Makro/jeopolitik bolum, sektor-spesifik gecis mekanizmasi ile finansal sonuca baglanacak; sadece genel risk paragrafi yazmak artik yeterli degil.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Post-Report Feedback Loop
### Eksikler:
- Chairman'in istedigi scoreboard yapisi cikti basinda yoktu; hangi zorunlu metrik hesaplandi, hangisi blocked, hangisi tahmini netlesmedi.
- Telekom KPI'lari ile finansal donusum bagi yeterince kurulmadigi icin ARPU/churn/capex yogunlugu marj ve ROIC tezine zayif baglandi.
### Bundan Sonra:
- Finansal analiz her raporda ilk tabloda `mandatory metric status board` verecek; hesaplandi, contested, blocked alanlari tek bakista gorunecek.
- Telekom analizlerinde operasyonel KPI'dan finansala gecis zorunlu olacak: ARPU/churn/capex/spectrum amortization -> FAVOK/OCF/ROIC zinciri acik yazilacak.

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **DSO, DIO, DPO, CCC, FCF, CAPEX/EBITDA, ROCE tamamen BLOCKED** — CF tablosu olmadan bu metrikler hesaplanamadı. Pipeline bu blokerı 3 tur boyunca çözmeden devam etti.
- **THYAO financial_analysis çıktısı yerine strategic_synthesis çıktısı iletildi** — Output başlığı "financial_analysis" ama içerik "strategic_synthesis" çıktısıydı. Bu ciddi bir output yönlendirme hatasıdır.
- **IAS 29 parasal kazanç ayrıştırması yok** — TÜFE >%100, havacılıkta TRY net parasal pozisyon; IAS 29 adjusted EBITDA ayrı sunulmalıydı.
- **Havacılık sektörü ek metrikleri eksik** — RPK, ASK, CASK, RASK, Yield, doluluk oranı trend analizi, yakıt maliyet oranı financial_analysis bölümünde yer almadı.
- **EBITDAR hesaplanmadı** — Havacılıkta kiralamaların önemi nedeniyle EBITDA yerine EBITDAR (EBITDA + Rent/Lease) birincil metrik olmalıdır.
- **Yorum zorunluluğu eksik** — Bazı tablolarda 4-soru yorum (Ne kadar? Nasıl değişti? Neden? TRY etkisi?) uygulanmadı.

### Bundan Sonra:
- **Havacılık şirketlerinde EBITDAR zorunlu** — IFRS 16 öncesi/sonrası karşılaştırma için EBITDA + Lease maliyeti = EBITDAR; peer karşılaştırması EBITDAR bazlı yapılmalı.
- **Havacılık KPI'ları zorunlu ek bölüm** — RPK, ASK, Load Factor trend, CASK (Cost per ASK), RASK (Revenue per ASK), Yield, kargo ton-km — bunlar olmadan havacılık analizi eksik.
- **CF tablosu olmadan working capital metrikleri "BLOCKED" olarak işaretle, tahmin üretme** — 0.45 conf ile DSO tahmini verme; blocked olduğunu ve upstream escalation gerektiğini bildir.
- **Output etiketine dikkat et** — Hangi agent çıktısını gönderdiğini her zaman başlıkta doğrula; başka agent'ın çıktısını iletme.

- **Havacilik EBITDAR marji benchmark:** THYAO 2025: %23.2 (gercek), global sektor ort. %16.1 (2025 IATA). THYAO outperformance ~7pp. Peer karsilastirmasi EBITDAR bazli yapilmali.
- **Havacilik operasyonel metrikler zorunlu:** CASK, RASK, Load Factor, Yield, RPK, ASK olmadan havacilik analizi eksik. THYAO 2025 ref: CASK US¢8.55, RASK US¢7.21, global load factor %83.6.
- **TAS 29 vs IAS 29 net ayrimi:** TAS 29 (yerel) 2025-2027 askida; IAS 29 (IFRS/SPK) hala gecerli. SPK konsolide tabloyu analiz ederken IAS 29 etkisini ayristirma YASAK degil, ZORUNLU.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **Output truncated — ROE yorumu yarıda kesildi** — "ROE = 18,587 / 87,088 × 100 = 21.3% [NOT: Eğer sadece dönem sonu özkaynak: 18,587 / 84,176 = 22.1%]" sonrası devam gelmiyor. IAS29 arındırılmış operasyonel ROE anlatısı kesilmiş.
- **DSO, DIO, DPO, CCC tamamen BLOCKED** — CF yokken WC metrikleri hesaplanamadı; tahmin de üretilmedi. Perakendede CCC kritik; BS'ten kısmi tahmin + "[CF BLOCKED, BS tahmini, conf: LOW]" etiketiyle sunulmalıydı.
- **Cari Oran ve Asit-Test Oranı çıktıda görünmüyor** — Bilanço mevcuttu (BS tam); bu iki likidite oranı hesaplanabilirdi.
- **NWC/Hasılat oranı eksik** — Net İşletme Sermayesi / Hasılat ve NWC Gün Sayısı raporlanmadı; Chairman zorunlu metriklerinde yer alıyor.
- **İşletme Nakit / FAVÖK oranı eksik** — OCF/EBITDA oranı CF bloker nedeniyle hesaplanamadı ama "[BLOCKED]" olarak işaretlenmedi bile.
- **CAPEX/EBITDA 81.9% yorumu eksik** — Bu çok yüksek bir oran (normu %40-60); perakende için bu kadar yüksek olmasının açıklaması (yoğun mağaza açılımı, IFRS 16 kira varlıkları) zorunlu yorumla verilmeliydi.

### Bundan Sonra:
- **Perakende sektörü zorunlu 4 ek metrik:**
  1. SSSG katkısı vs yeni mağaza katkısı ayrıştırması (ciro büyümesinin kaynağı)
  2. Revenue per Store (mağaza verimliliği) — 5 yıllık trend
  3. Gross Margin by segment (Türkiye vs Fas vs Mısır varsa)
  4. IFRS 16 normalize FAVÖK (kira maliyeti öncesi/sonrası) — sektör karşılaştırması için zorunlu
- **BS mevcutsa Cari Oran + Asit-Test HER ZAMAN hesapla** — CF tablosu beklenmeden, sadece cari varlık/borç kalemleriyle hesaplanabilir. Blocker değil; hesapla.
- **NWC/Hasılat için BS tahmini yeter** — CF yokken NWC = (Cari Varlıklar - Cari Borçlar - Kısa Vadeli Finansal Borçlar); BS'ten hesaplanabilir. "[BS bazlı, conf: MEDIUM]" etiketiyle ver.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **Revenue Q4/FY karışıklığı Round 2'de de sürdü** — data_collection'ın "802.669 M TRY FY2025" hatasını sorgulamadan kabul etti. Gerçek FY2025 = 2.76T TRY; 802.669B = Q4. Tüm marj hesapları (FAVÖK %22.6, net kar %2.7, aktif devir 0.174x) Q4 baz üzerinden yapıldı → tümü hatalı. QA bunu P0-NEW olarak tespit etti ama financial_analysis kendi kendini düzeltemedi.
- **Revenue anomalisi sorgulanmadı** — 2.76T TRY ile 802.669B TRY arasında ~3.4x fark var. Bu kadar büyük fark görülünce "dönem tanımı kontrol et" adımı atlanmadı; verification yerine kabul edildi.
- **DSO tamamen BLOCKED, tahmin bile üretilmedi** — Ticari alacak verisi yoksa bile sector benchmark proxy ile DIO düzeyinde bir DSO tahmini "[sector proxy, conf: LOW]" olarak verilebilirdi. "BLOCKED" deyip sıfır üretmek Chairman metrik listesini ihlal ediyor.
- **COGS tahmini %70 gerekçesiz** — "Ağırlıklı ortalama COGS/Revenue ~%70" denildi; TUPRS, FROTO, ARCLK, YKBNK için ayrı ayrı COGS/Revenue oranları ve segment ağırlıkları gösterilmedi. Methodology şeffaf değil.
- **IAS 29 ayrıştırması yapılmadı** — Holding konsolide gelir tablosunda IAS 29 parasal kazanç/kayıp kalemi hiç ayrıştırılmadı. "P0-1 IAS 29" QA'da açık bloker olarak kalmaya devam ediyor.
- **3 katlı analiz (Parent / Konsolide / Segment) eksik** — Yalnızca konsolide bazda çalışıldı; parent-only geliri (2.757B TRY = temettü + yönetim ücreti) vs konsolide ayrımı netleştirilmedi.

### Bundan Sonra:
- **Revenue anomalisini her zaman sorgula** — Önceki dönemle >%50 sapma veya peer'larla anlamsız fark → "veri dönem tanımı doğru mu?" kontrolü mandatory. Q4 rakamını FY olarak kabul etme.
- **Holding için gelir tablosunda 3 katman** — (1) Solo/Parent: temettü + yönetim ücreti, (2) Konsolide: tüm bağlı ortaklıklar, (3) Segment: IFRS 8 ayrımı. Üçünü ayrı satırlarda ver.
- **DSO blocked olsa bile sector proxy ver** — "Holding sektöründe DSO ortalama 45-60 gün; KCHOL için ticari alacak yokluğunda tahmini DSO: N/A — IFRS 8 segment bazlı gerekiyor [conf: VERY LOW]" formatında bile olsa ver. Sıfır bırakma.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **DSO, DIO, DPO, CCC metrikleri tamamen eksik** — Chairman'ın zorunlu metrikleri listesinde açıkça yer alıyor; hiç hesaplanmadı.
- **Net İşletme Sermayesi / Hasılat ve NWC Gün Sayısı yok** — Working capital detayı (alacak, stok, borç satırları) upstream'den gelmediyse tahmini yöntemle üretilmeli ve [MEDIUM] etiketiyle sunulmalıydı.
- **Faiz Karşılama Oranı eksik** — EBIT / Faiz Gideri basit hesap; kaynak eksikliği gerekçe değil.
- **Cari Oran ve Asit-Test Oranı eksik** — Balance sheet toplamları vardı; alt satırlar çekilmese bile toplam/tahmin yapılabilirdi.
- **ROCE ve ROIC hesaplanmadı** — ROE vardı (VUK bazlı); ROCE ve ROIC eksik.
- **Cash FAVÖK ayrı hesaplanmadı** — FAVÖK ≠ Cash FAVÖK; IAS29 ve D&A düzeltmesi ayrı gösterilmeli.
- **Bölüm 5 (IAS29 ROE tablosu) truncated** — VUK/SPK ROE kıyaslama tablosu yarım bırakıldı.
- **5 yıllık IS trendi sadece 2 yıl** — FY2024 ve FY2025 var; 2020-2023 arası "[VERİ YOK]" ile geçiştirildi.

### Bundan Sonra:
- **Chairman'ın 25 metrik listesi her analizde kontrol listesi olarak kullanılacak:** Net Satışlar, Brüt Kar, FAVÖK, Cash FAVÖK, DSO, DIO, DPO, CCC, NWC/Hasılat, NWC Gün, Net Borç/FAVÖK, Faiz Karşılama, Cari Oran, Asit-Test, ROE, ROCE, ROIC, FCF, CAPEX/FAVÖK, OCF/FAVÖK — hepsi çıktıda MEVCUT olmak zorunda. Eksikse [TAHMIN: X] formatında tahmini değer ver.
- **Working capital metrikleri upstream eksik olsa bile hesaplanacak:** BS toplamları varsa tahmin yapılır. Tahmin güveni [LOW] olsa da metrik yoktan iyidir.
- **Cash FAVÖK ayrı satır:** FAVÖK − Capex + WC değişimi değil; OCF'e dayalı hesaplama yapılmalı ve "Cash FAVÖK ≠ FAVÖK" farkı yorumlanmalı.
- **Bölüm truncation = output geçersiz:** Bölüm kesilirse ikiye böl, ikisini de gönder. Yarım bölüm YASAK.

---
