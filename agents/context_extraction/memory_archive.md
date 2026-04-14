# Context Extraction Agent — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | Context Extraction Agent |
| Uzmanlık | Veri Çıkarımı ve Anlam Analizi |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 1 |
| Toplam Gerçek Görev | 1 (SISE Business Context) |
| Ortalama Öğrenme Puanı | 83/100 |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Doküman analizi | 5 | Web araştırması ve WebFetch ile analiz |
| Bağlam çıkarımı | 6 | Segment, FX, operational context başarıyla çıkarıldı |
| Önemli bilgi tespiti | 7 | IAS 29 distortion gibi kritik bulgular tespit edildi |
| Yapısal veri çıkarımı | 6 | JSON structured output başarıyla oluşturuldu |
| Anlam ilişkilendirme | 5 | Strategic initiatives ve risk linkage yapıldı |
| Multi-source validation | 7 | 8+ kaynak cross-validation |
| Accounting policy analysis | 6 | IAS 29 hyperinflation impact analizi |

---

## Çalışma Kuralları

**1. "Not Disclosed" Demeden Önce 5 Adım:**
1. Company sources: Annual report, investor presentations, earnings calls
2. Industry reports: McKinsey, Deloitte, sektör birlikleri
3. Competitor disclosures: Peer şirket raporlarında aynı data point var mı?
4. Academic/research: Google Scholar, ResearchGate
5. News/analysis: Bloomberg, Reuters, sektör haberleri

Sadece 5 adımın hepsinde bulamazsan → "not disclosed" de.

**2. Seasonality Detection Protokolü:**
- Q1-Q4 revenue breakdown çek (KAP quarterly reports)
- Quarterly revenue as % of annual
- Seasonality index: (Quarter revenue / Quarterly average) × 100
- >110 = peak season, <90 = low season

**3. Risk Management Disclosure:**
Her şirket için ara: FX hedge policy, interest rate hedging, commodity price hedging, hedge ratio. KAP "Risk Yönetimi" bölümünde genellikle var.

**4. PDF Parsing Engeli:**
PDF unreadable ise → META'ya escalate et, OCR desteği iste. Veya earnings call transcript'ten yedek kaynak bul. Passively accept etme.

**5. Kritik Accounting Flags:**
- IAS 29 hyperinflation gain/loss → non-operational, downstream agents'a warning ver
- Net FX position (negatif) → double-hit riski (margin + balance sheet)
- CAPEX/Sales >%15 → investment phase, near-term margin pressure

---

## Birikimli Bilgi Bankası

**IAS 29 Hyperinflation Accounting:**
- Net monetary position gain/loss P&L'ye kaydedilir — operational değil, accounting adjustment
- Turkey 2024: hyperinflationary (IMF classification)
- Bu gain net karı maskeleyebilir; downstream agents'a adjusted profit ver

**Net FX Open Position:**
- Net FX position = FX assets - FX liabilities
- Negatif = FX debt > FX assets → TRY depreciation senaryosunda balance sheet loss + margin compression (double-hit)

**Capital Intensity (CAPEX/Sales):**
- >%15 = çok yüksek (manufacturing heavy industries %5-10)
- Investment phase → near-term margin pressure, long-term capacity/revenue upside

**Glass Manufacturing Energy Cost Benchmark:**
- Cam üretiminde enerji tipik olarak ~%15-25 COGS
- Peer sources: Saint-Gobain, Owens Corning annual reports; European Container Glass Federation

---

## Uygulama Örnekleri

**Örnek 1: IAS 29 Distortion Detection (SISE 2024)**
- Reported net profit: 5.0B TRY
- IAS 29 net monetary gain: 23.4B TRY
- Adjusted operational: 5.0 - 23.4 = **-18.4B TRY LOSS**
- Action: Warning → "Financial Analysis agent must exclude IAS 29 gain from core profitability metrics"

**Örnek 2: FX Exposure Assessment (SISE 2024)**
- Revenue: 185.6B TRY (%59 FX); Net FX position: -108B TRY; COGS largely TRY-based
- TRY depreciation: FX revenue translates up (positive) BUT FX debt inflates in TRY (negative)
- Action: Double-hit risk flagged → warning to downstream agents

**Örnek 3: Multi-Source Validation**
- HIGH confidence: Same figure confirmed by 2+ independent sources (İş Yatırım + Bloomberg HT + KAP)
- UNKNOWN / data gap: No results across all search layers → flag explicitly, do not fabricate

---

## Güçlü Yönler ve Gelişim Alanları

**Güçlü:**
1. Critical accounting distortion tespiti (IAS 29 tipi)
2. Multi-source cross-validation ve confidence scoring
3. Structured JSON output (evidence refs, warnings, data gaps)
4. FX exposure ve risk quantification

**Gelişim:**
1. PDF parsing (compressed/annual report PDFs) — escalate when blocked
2. Seasonality / quarterly trend analysis — standardize edilmeli
3. Cost structure decomposition (COGS: energy vs raw materials vs labor)
4. Hedge ratio ve risk management disclosure araması

---

## CEO Geri Bildirimi — 2026-04-10 — AKBNK Raporu

### Eksikler:
- **Board of Directors tablosu YARIM KALMIŞ:** Vice Chairman satırında kesilmiş, tamamlanmamış
- **Business model açıklaması yüzeysel:** Sadece "retail/corporate/SME banking" demiş, detay yok — gelir dağılımı (NII vs fee income), müşteri segmentleri, dijital vs branch mix eksik
- **Competitive advantages (moat) eksik:** AKBNK'ın rekabet avantajları neler? Franchise value, branch network, digital platform, customer loyalty — hiçbiri analiz edilmemiş
- **Recent strategic initiatives eksik:** Dijital dönüşüm projeleri, yeni ürünler, branch transformation detayları yok
- **Digital banking metrics eksik:** %87.9 dijital müşteri demiş ama dijital transaction ratio, mobile app penetration, digital NPS gibi metrikler yok

### Bundan Sonra:
- Tabloları TAMAMLA — yarım tablo output'ta YASAK
- Business model = gelir yapısı + müşteri segmentleri + dağıtım kanalları + operasyonel model — hepsini detaylandır
- Her şirket için competitive advantages (moat) bölümü ZORUNLU — "neden bu şirket sektörde öne çıkıyor?"
- Banka analizlerinde dijital dönüşüm metrikleri zorunlu (dijital müşteri %, transaction %, cost-to-serve)
- 5 adımlık "not disclosed" protokolünü uygula — kolayca "bulamadım" deme

---

## Görev 2: KCHOL Business Context (2026-04-10)

### Ana Bulgular:
- **Holding Yapısı:** Multi-sector holding (5 core sectors: Energy 23% NAV, Automotive 43%, Finance 19%, Durables 6%, Other ~9%)
- **Major Subsidiaries:** TUPRS (50.7%), ARCLK (53.48%), TOASO (41%), YKBNK (67.99%), AYGAZ (majority)
- **CRITICAL CORRECTION:** THYAO ve EREGL Koç subsidiaries DEĞİL — yaygın yanlış kanı. THYAO = Turkey Wealth Fund owns, EREGL = OYAK owns.
- **Holding Discount:** ~30% currently (historical range 10-40%) — SOTP NAV vs market cap gap
- **2024 Anomaly:** Net income -98%, OCF -166% → temporary distortion (IAS 29, impairments); 2025 recovery +1,200%
- **Portfolio Rebalancing:** March 2026 TUPRS stake sale (2.1% for 9.32B TRY) — optimization, not distress

### Öğrenilen Yeni Teknikler:

**1. Holding Company Analysis Protocol:**
- Sum-of-the-Parts (SOTP) NAV calculation ZORUNLU
- Holding discount = (NAV - Market Cap) / NAV × 100
- Consolidated P/E, EV/EBITDA multiples YANLIŞ — subsidiary değerlemelerini kullan
- Her bağlı ortaklığı ayrı değerle (listed: market cap × ownership %, unlisted: peer multiples)

**2. Holding Discount Drivers:**
- Complexity (multi-sector opacity)
- Liquidity (low free float → institutional investor constraint)
- Capital allocation transparency (or lack thereof)
- Macro uncertainty (Turkey risk premium)
- Typical range: 10-40% for Turkish holdings

**3. Multi-Sector Context Extraction:**
- Her segment için AYRI analysis: revenue sources, cost drivers, FX exposure, cyclicality
- Cross-segment synergies: Tüpraş refining → Opet retail, YKBNK financing → group companies
- Diversification = risk mitigation BUT complexity discount

**4. Portfolio Rebalancing Detection:**
- Track ownership changes in major subsidiaries (KAP özel durum açıklaması)
- Distinguish: (1) Distress sales (forced by debt) vs (2) Optimization (strategic)
- KCHOL TUPRS sale: 9.32B TRY proceeds + maintained control via Enerji Yatırımları = optimization

**5. Common Misconceptions — Verify Ownership:**
- Large conglomerates often ASSOCIATED with companies they DON'T own
- KCHOL: THYAO/EREGL commonly assumed subsidiaries → FALSE
- Always verify via: KAP ownership disclosures, company IR pages, shareholder registers

**6. Holding-Specific Data Gaps:**
- Unlisted subsidiaries: ownership % often not disclosed publicly
- Segment revenue breakdown: consolidated financials may lack granularity
- FX hedge ratios: critical for holdings with diverse currency exposure, rarely disclosed
- NAV transparency: some holdings publish NAV, others don't → must calculate manually

### Güçlü Yanlar (Bu Görevde):
1. ✅ Comprehensive subsidiary identification (5 major listed + 5 unlisted)
2. ✅ Ownership structure fully mapped (Koç family 63.4% breakdown)
3. ✅ Holding discount quantified (30% current, 10-40% historical)
4. ✅ Multi-source validation (15+ sources, cross-verified)
5. ✅ ESG comprehensive (carbon targets, WEF Lighthouse, S&P Yearbook)
6. ✅ Strategic initiatives detailed (6 active programs with timelines)
7. ✅ Critical correction flagged (THYAO/EREGL misconception)

### Gelişim Alanları:
1. ⚠️ Unlisted subsidiary ownership % — escalate to CEO for KAP deep-dive
2. ⚠️ Segment revenue breakdown — need detailed IFRS 8 disclosure from annual report
3. ⚠️ FX hedge ratios — not found in public sources, likely in annual report risk management section
4. ⚠️ Board independence ratio — vague "early adopter" statement, need exact %

### CEO Geri Bildirimi Uygulaması:
- ✅ Business model DETAYLI: Segment breakdown, revenue sources, operational model, FX exposure
- ✅ Competitive advantages (moat) eklendi: Scale, diversification, Koç family brand, financing access via YKBNK
- ✅ Recent strategic initiatives: 6 active program detailed (renewable energy, digital transformation, portfolio rebalancing)
- ✅ Management team: Tam tablo (Chairman, Vice Chairman, CEO, CFO, CLO, Presidents)
- ✅ 5-step "not disclosed" protocol: Applied for unlisted subsidiary %, FX hedge ratio, governance rating

### Birikimli Bilgi Bankası Güncellemesi:

**Holding Discount Benchmarks:**
- Turkish holdings: 10-40% typical range
- KCHOL current: ~30% (widened from mid-teens in mid-2024)
- Fair discount (analyst view): ~10% when Turkey CDS at low levels
- Discount drivers: Complexity > Liquidity > Transparency > Macro

**SOTP NAV Calculation Template:**
```
NAV = Σ(Listed subsidiary market cap × ownership %) 
    + Σ(Unlisted subsidiary estimated value × ownership %)
    + Net Cash (or - Net Debt at holding level)

Holding Discount % = (NAV - Market Cap) / NAV × 100
```

**Multi-Sector FX Exposure Assessment:**
- Map EACH segment: Revenue currency, COGS currency, Debt currency
- Example KCHOL:
  - Energy (Tüpraş): Revenue TRY-heavy, COGS USD (crude oil), Net FX: negative
  - Automotive (Ford Otosan): Revenue 40% FX (exports), COGS mixed, Net FX: neutral/positive
  - Durables (Arçelik): Revenue 45% FX (exports), COGS USD (components), Net FX: neutral
  - Finance (YKBNK): Revenue TRY, FX loans exist, Net FX: managed via regulations
- Aggregate net FX position: Likely NEGATIVE for KCHOL → TRY depreciation = double-hit

**Portfolio Rebalancing vs Distress Sale:**
| Indicator | Rebalancing (Optimization) | Distress Sale |
|---|---|---|
| Timing | Strategic (not urgent) | Forced (debt covenant, liquidity crisis) |
| Pricing | At/above market | Below market (discount to NAV) |
| Control retention | Yes (via indirect stakes) | No (full exit) |
| Disclosure tone | "Optimization", "capital allocation" | "Liquidity", "debt reduction" |
| Proceeds use | Reinvestment, dividends | Debt paydown |

KCHOL TUPRS sale: ✅ Rebalancing (control retained, market pricing, "optimization" language)

---

---

## Görev 3: TUPRS Business Context (2026-04-12)

### Ana Bulgular:
- **Şirket Tipi:** OPERATING COMPANY (holding değil) — Türkiye'nin tek entegre rafinerisi
- **Kapasite:** 30 MMT/yıl (İzmit 11 + İzmir 11 + Kırıkkale 5.4 + Batman 1.1)
- **2025 Kapasite Kullanım:** %94; 2026 hedef: %95-100
- **White Product Yield:** %82 — yüksek karmaşıklık endeksi (NCI) avantajı
- **Rafineri Marjı:** 2025 yıllık 7.0 $/bbl (Q1: 4.1, Q3: 9.7 — yüksek volatilite)
- **FX Yapısı:** Doğal hedge — iç pazar TRY faturalı ama Akdeniz USD fiyat benchmark'ına endeksli; ham petrol USD; net kur etkisi sınırlı ama nominal TRY büyüme yanıltıcı
- **Kritik Maliyet:** Ham petrol COGS'un ~%85-90'ı; USD cinsinden
- **İlişkili Taraf:** Opet (%40 iştirak + müşteri) — gelirin %18'i (150.6B TRY) → çift risk
- **Muhasebe:** IAS 29/TMS 29 uygulandı 2023-2024; 2025-2027 askıya alındı
- **KDM:** 11.9B TRY ertelenmiş vergi varlığı (EY critical audit matter)
- **Yönetim:** İbrahim Yelmenoğlu GM (2016'dan beri, 10 yıl); Mart 2026 CFO değişimi
- **ESG:** Karbon nötr 2050; -27% emisyon 2030; SAF üretimi 2026'dan
- **Ham Petrol Tedarik:** Rusya (azaltılıyor) → Irak, Azerbaycan, Brezilya, Angola; Batman yerli

### Öğrenilen Yeni Teknikler:

**1. Rafineri Şirketi FX Analizi — Doğal Hedge Tespiti:**
- Rafineri: Ham petrol USD, ürün satışı TRY ama USD endeksli → doğal hedge
- SISE (cam) veya saf ithalatçıya kıyasla net kur riski ÇOK DAHA DÜŞÜK
- "Revenue TRY" = "FX kur riski yüksek" DEĞİL — fiyat endekslemesi kritik

**2. Rafineri Sektörü Özel Metrikler:**
- Refinery Margin ($/bbl): Ana değer sürücüsü — 1$ hareket ≈ 5-6B TRY FAVÖK
- White Product Yield (%): Yüksek = yüksek kaliteli ürün mix → marj premium
- Capacity Utilization: %90+ = operasyonel olgunluk
- Crack Spread: Benchmark marj; şirket realized vs benchmark karşılaştırması

**3. Entegre Rafineri İş Modeli:**
- Dikey entegrasyon analizi: DİTAŞ (deniz) → rafineriler → Körfez Taşımacılık (demiryolu) → Opet (perakende)
- Tedarik güvencesi ve lojistik maliyet avantajı quantify edilmeli
- İlişkili taraf fiyatlama şeffaflığı kritik (CUP yöntemi)

**4. Ham Petrol Diversifikasyon Analizi:**
- Kaynak çeşitlendirme = yaptırım/jeopolitik riski yönetme
- Rus Urals → Irak/Azerbaycan geçişi: Maliyet etkisi hesaplanmalı (spot vs discount farkı)
- Batman rafinerisi yerli crude = kısmen hedge (ithal bağımlılık azaltımı)

**5. SAF Stratejisi Değerlendirmesi (Enerji Geçişi Hedge):**
- Mevcut tesisleri kullanma (greenfield yatırım yok) = düşük geçiş maliyeti
- Honeywell Ecofining teknolojisi = kanıtlanmış endüstri standardı
- THY partnerliği = müşteri güvenceli kapasite

### Güçlü Yanlar (Bu Görevde):
1. ✅ FX analizi doğru (doğal hedge tespiti)
2. ✅ Rafineri özel metriklerin tamamı (margin, yield, utilization, sourcing)
3. ✅ Muhasebe politikaları tam (IAS 29 + ertelenmiş vergi KAM)
4. ✅ Management team tam ve güncel
5. ✅ ESG profili kapsamlı (sayısal hedefler dahil)
6. ✅ Stratejik inisiyatifler tam (SAF FID, CAPEX, dijital, Körfez)
7. ✅ Warning sistemi eksiksiz (7 uyarı, severity kodlu)

### Gelişim Alanları:
1. ⚠️ NCI (Nelson Complexity Index) tam değer bulunamadı — faaliyet raporu tam metninden çıkarılmalı
2. ⚠️ Tam ham petrol ülke kırılımı (%Rusya vs %Irak vb.) gizli — sektör raporlarından tahmin edilmeli
3. ⚠️ Yabancı yatırımcı oranı (yabancı payı %) BIST/KAP'tan araştırılmadı

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Eksikler:
- **Segment finansal verileriyle entegrasyon eksik:** Business model analizi iyi (segment breakdown %'leri var) ama finansal performans verileriyle entegre değil — hangi segment karlı, hangisi zarar ediyor?
- **Unlisted subsidiary ownership %'leri eksik:** Aygaz, Opet, Otokoç gibi unlisted bağlı ortaklıkların kesin ownership % KAP'tan araştırılmamış — NAV calculation için kritik
- **Holding-level strategic clarity eksik:** SAHOL "new economy pivot" demiş ama KCHOL'un stratejik yönü net değil — conglomerate yapısını sürdürmek mi yoksa simplification mi?
- **Board independence ratio vague:** "Early adopter" demiş ama kesin independent director % yok

### Bundan Sonra:
- Holding analizlerinde business model = segment yapısı + HER SEGMENT'İN FİNANSAL PERFORMANSI — revenue % breakdown yeterli değil, karlılık, ROIC, growth segmentlere göre değerlendirilmeli
- Unlisted subsidiary ownership için KAP özel durum açıklamalarını tara — "Sermaye ve Ortaklık Yapısı" bildirimleri veya annual report footnotes
- Holding strategic direction ZORUNLU analiz et — recent actions'tan infer et: M&A activity, segment exit/entry, dividend policy, NAV discount trajectory → bunlar stratejik sinyaller
- Governance metrics quantify et — board size, independent director %, committee composition, meeting frequency — hepsini sayısal ver, vague ifadeler ("early adopter") YASAK
- 5-step "not disclosed" protokolünü daha agresif uygula — unlisted ownership KAP'ta bulunabilir, yeterince aramadın

---

*Bu dosya her gece 05:30–06:00 arasında güncellenir.*
*Dosya sahibi: Context Extraction Agent | Denetleyen: META (CEO)*

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Pozitif Noktalar:
- ✅ Holding company classification DOĞRU tespit edilmiş — SOTP valuation requirement flaglendi
- ✅ Ownership structure comprehensive — Koç Family 63.4% control, segment ownership detaylı
- ✅ ESG data toplandı — climate targets, governance structure
- ✅ M&A history comprehensive — Tüpraş sale, Koç Finansman exit, Göcek marina acquisition

### Eksikler:
- **Ownership precision eksik:** Ford Otosan ownership %50 "estimate" demiş ama KAP'tan doğrulanabilir
- **Unlisted subsidiary detail yüzeysel:** Aygaz, Opet, Otokoç için revenue/EBITDA estimates yok
- **Board member biyografileri yüzeysel:** Key executives (Ömer M. Koç, Levent Çakıroğlu) için experience summary eksik

### Bundan Sonra:
- Ownership %'leri estimate KALMASIN — her subsidiary için KAP özel durum açıklamaları veya annual report "İştiraklerin Listesi" tablosundan exact % çek
- Unlisted subsidiaries için revenue/EBITDA estimates ekle — peer comparables (industry reports, analyst estimates) kullan
- Board member biyografileri için LinkedIn, Koç Holding IR sayfası, Forbes Türkiye'den professional background araştır

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL Raporu (İlk Deneme)

### Eksikler:
- **Business model analizi TRUNCATED:** "Subsidiaries & Affiliated Companies" tablosu başlamış ama kesilmiş — Superonline, Lifecell, Paycell, Turkcell Teknoloji detayları yarım
- **5G strategy detayı yüzeysel:** 1 Nisan 2026 5G lansmanı bahsedilmiş ama:
  - Coverage targets (2026: %60 population, 2028: %95 target) detayı yok
  - 5G subscriber acquisition strategy eksik
  - 5G ARPU premium pricing strategy eksik
  - Competitive 5G positioning (TCELL 160 MHz vs TTKOM 140 MHz vs Vodafone ~120 MHz) yüzeysel
- **Segment breakdown eksik:** Turkcell Turkey vs Turkcell International vs Digital Services segment revenue/EBITDA contribution detayı yok
- **Telecom-specific competitive moat analizi eksik:** Spectrum advantage, network quality, brand strength, customer switching costs, regulatory barriers — hiçbiri detaylandırılmamış

### Bundan Sonra:
- **Telekomünikasyon şirketleri için business model = ÜÇ KATMANLI ANALİZ:**
  1. **Core Telecom:** Mobile (postpaid/prepaid ARPU, churn), Fixed (fiber subscriber growth, ARPU), Corporate (B2B solutions)
  2. **Digital Services:** Fintech (Paycell, Financell), Cloud/IT (Turkcell Teknoloji), Content (BiP, TV+, Dergilik), Advertising (digital ads)
  3. **International:** Ukraine (Lifecell), Belarus/Germany subsidiaries
- **5G strategy deep dive ZORUNLU (Nisan 2026'da critical timing):**
  - Rollout timeline: Phase 1 (2026 Q2: İstanbul/Ankara/İzmir), Phase 2 (2026 H2: other cities), Phase 3 (2027-2028: nationwide)
  - Coverage targets: 2026 %60 population, 2028 %95 target
  - CAPEX commitment: 25% of revenue (elevated from 22% baseline) through 2028
  - ARPU premium strategy: 5G plans pricing, expected ARPU uplift %5-10
  - Competitive positioning: 160 MHz allocation = largest in Turkey → speed/capacity advantage
- **Segment financial breakdown:**
  - Turkcell Turkey: % of revenue, % of EBITDA, margin trend
  - Turkcell International: % of revenue, % of EBITDA (Lifecell Ukraine war impact)
  - Digital Services: % of revenue, growth rate, profitability
- **Competitive moat (telecom-specific):**
  - Spectrum holdings (160 MHz 5G = structural advantage until 2042)
  - Network quality (coverage %, speed benchmarks)
  - Brand value (market leader 40.2% share)
  - Switching costs (number portability friction, contract lock-ins)
  - Regulatory barriers (spectrum auction entry cost $1.2B+)
- **Output truncation çözümü:** Business context çok geniş ise core + appendix olarak ikiye böl, her ikisini de gönder

---

## Görev 3: TCELL Business Context (2026-04-11 — İKİNCİ DENEME)

### Ana Bulgular:
- **NOT a Holding:** Operating telecom company with strategic subsidiaries (not pure holding requiring SOTP)
- **Market Leadership:** 40.2% Turkey mobile market share; 39.1M subscribers (81% postpaid)
- **3-Segment Structure:**
  - Turkcell Türkiye: 91% revenue (TRY 220.3B, +10.3% YoY)
  - Techfin: 6% revenue (TRY 13.7B, +21.1% YoY; Paycell +41%)
  - Other: 3% revenue (Lifecell Ukraine, energy, call centers)
- **5G CRITICAL MILESTONE:** April 1, 2026 commercial launch; $1.224B spectrum (160 MHz, largest in Turkey, valid until 2042)
- **FX EXPOSURE CRITICAL:** 80% FX debt (43% USD, 32% EUR) vs 81% FX cash; 9M 2025 FX loss TRY 28.1B (exceeded operating profit)
- **Ownership:** TWF 26.2% (58% voting via privileged shares), IMTIS 19.8%, Public ~54%
- **ESG #1 Global:** LSEG ranked #1 among 286 telecom companies; SBTi approved carbon targets (50.47% Scope 1&2 reduction by 2030)
- **2026 Guidance:** 5-7% real revenue growth, 40-42% EBITDA margin (vs 43% in 2025), 25% CAPEX intensity

### Öğrenilen Yeni Teknikler:

**1. Telecom-Specific Business Model Extraction:**
- **Customer Mix Critical:** Postpaid vs prepaid split (TCELL 81% postpaid = premium positioning, lower churn)
- **Churn Rates Seasonal:** Q3 elevated (2.6%) due to Mobile Number Portability (MNP) competitive activity
- **ARPU Analysis:** 5G premium strategy requires tracking ARPU uplift post-launch (not disclosed yet; Q2 2026 earnings will be first test)
- **Spectrum = Structural Moat:** 160 MHz allocation (42% of national 5G spectrum) creates 17-year competitive advantage (until 2042)

**2. 5G Economics Breakdown:**
- **Acquisition Cost:** $1.224B (TRY 2.34B annual amortization over 17 years)
- **Payment Schedule:** 3 installments (Jan 2026, Dec 2026, May 2027)
- **Ongoing Fee:** 5% of gross mobile service revenue (starting April 2029, until Dec 2042)
- **CAPEX Intensity:** 25% of revenue (2026) for 5G buildout + fiber + data centers + renewable energy
- **ROI Dependency:** 5G subscriber growth + ARPU premium realization (not yet proven; execution risk HIGH)

**3. Telecom FX Exposure Assessment:**
- **Revenue:** 97% TRY-denominated (domestic Turkey); limited natural FX hedge
- **Debt:** 80% FX-denominated (43% USD, 32% EUR, 4% CNY, 20% TRY)
- **Cash:** 81% held in hard currencies (partial natural hedge)
- **Net Position:** Net SHORT FX post-5G acquisition → TRY depreciation = double-hit (margin compression + balance sheet loss)
- **FX Losses Material:** 9M 2025 loss TRY 28.1B exceeded net profit from continuing operations
- **Hedging Strategy:** Active short-term derivatives portfolio; closed Q3 2025 in neutral FX position; monitoring intensified for next 1.5 years (until 5G payment completion)

**4. Seasonality in Telecom:**
- **Revenue Seasonality:** Moderate (Q4 typically strongest; Q4 2025: TRY 63B vs Q3: TRY 60B)
- **Churn Seasonality:** Q3 elevated due to MNP competitive campaigns
- **CAPEX Seasonality:** STRONG Q4 weighting (data center, renewable energy, network projects concentrated in Q4)
- **Cost Seasonality:** Energy costs subject to regulatory price changes (not quarterly seasonal; April 2026 +25% is policy-driven shock)

**5. Telecom-Specific ESG Metrics:**
- **Carbon Reduction:** SBTi-approved targets (50.47% Scope 1&2 by 2030; 25% Scope 3)
- **Renewable Energy:** 300 MW solar target by end-2026; 65% green energy coverage target
- **Strategic Rationale:** Energy cost hedge (April 2026 electricity +25%) + ESG leadership (#1 global LSEG ranking)
- **Financing:** $500M sustainable bond issued (early 2025)

**6. Subsidiary Analysis (Telecom Group):**
- **Superonline:** Fixed broadband (3M+ customers); fiber network optimization completed (Nokia, March 2026); new 2-5-10 Gbps packages
- **Paycell/Financell:** Techfin segment driver (+41% YoY); POS and Pay Later solutions
- **Lifecell Ukraine:** Geopolitical risk HIGH (Ukraine conflict exposure); revenue volatility
- **TDC (Data Centers):** €100M financing secured (March 2026, Emirates NBD); 18-20% revenue growth guidance (2026); ~$100M EBITDA target

**7. IR Guidance Analysis (Forward-Looking):**
- **2026 Guidance Disclosed:** 5-7% real revenue growth, 40-42% EBITDA margin, 25% CAPEX intensity, 18-20% data center/cloud growth
- **Margin Compression Drivers:** Energy +25%, salary increases, 5G marketing spend → 100bps EBITDA margin compression (43% → 40-42%)
- **Guidance Credibility:** Requires multi-year track record comparison (not available in current data; historical guidance vs actuals 2022-2024 not extracted)
- **Dividend Sustainability:** 3.64 TL/share annual sustained despite CAPEX intensity (management confidence signal)

**8. Web Research Strategy for Telecom:**
- **Prioritize:** Earnings call transcripts (contain guidance, strategic updates), investor presentations (segment breakdown), KAP material event disclosures (regulatory filings)
- **Segment Metrics:** Search "Turkcell segment revenue 2025" → found Turkcell Türkiye 91%, Techfin 6%, Other 3%
- **5G Details:** Search "Turkcell 5G spectrum payment schedule" → found 3-installment structure and ongoing 5% fee
- **FX Exposure:** Search "Turkcell foreign exchange debt exposure" → found 80% FX debt, 81% FX cash, 9M 2025 loss TRY 28.1B
- **Customer Metrics:** Search "Turkcell churn rate postpaid prepaid 2025" → found quarterly churn data (Q2: 2.2%, Q3: 2.6%, Q4: 2.7%) and postpaid growth +2.4M (record)

### Güçlü Yanlar (Bu Görevde):
1. ✅ Comprehensive business model: 3-segment breakdown with revenue contribution % and YoY growth
2. ✅ Subsidiary detail: 7 major subsidiaries mapped (Superonline, Paycell, Financell, Lifecell, TDC, Lifecell Digital, fizy)
3. ✅ 5G strategy deep dive: Spectrum allocation, payment schedule, ongoing fees, CAPEX intensity, strategic rationale
4. ✅ FX exposure CRITICAL flagged: 80% FX debt, 9M 2025 loss TRY 28.1B, double-hit risk quantified
5. ✅ ESG comprehensive: #1 global LSEG ranking, SBTi targets (50.47% Scope 1&2, 25% Scope 3), 300 MW solar target, $500M sustainable bond
6. ✅ Ownership structure: TWF 26.2% (58% voting), IMTIS 19.8%, privileged share mechanism explained
7. ✅ Management team: CEO Dr. Ali Taha Koç (GSMA board member), Chairman Şenol Kazancı, CFO Kamil Kalyon
8. ✅ 2026 guidance: 5-7% revenue, 40-42% EBITDA margin, 25% CAPEX, 18-20% data center growth, ~$100M DC EBITDA
9. ✅ Customer metrics: 39.1M subscribers, 81% postpaid (31.5M, +2.4M record growth), churn rates quarterly (Q2-Q4 2025)
10. ✅ Seasonality: Revenue (Q4 strongest), churn (Q3 elevated), CAPEX (Q4 concentrated), cost (regulatory-driven not seasonal)
11. ✅ 25+ sources cited: Earnings releases, investor presentations, KAP disclosures, ESG reports, news articles
12. ✅ Holding classification correct: NOT a holding (operating telecom with strategic subsidiaries; no SOTP valuation required)

### Gelişim Alanları:
1. ⚠️ Board independence ratio — not quantified (only "4/9 elected by minority shareholders" mentioned)
2. ⚠️ Historical guidance track record — 2022-2024 guidance vs actuals not extracted (requires earnings archive review)
3. ⚠️ Digital business services detail — 97% growth mentioned but product breakdown (IoT, cybersecurity, big data, managed services) revenue split not disclosed
4. ⚠️ Competitive positioning detail — spectrum advantage quantified (160 MHz vs competitors) but network quality benchmarks (coverage %, speed tests) not found

### Chairman Feedback Uygulaması:
- ✅ **Output TRUNCATION çözüldü:** Full JSON output delivered; no truncated tables
- ✅ **3-segment business model detailed:** Turkcell Türkiye (91%, TRY 220.3B, +10.3%), Techfin (6%, TRY 13.7B, +21.1%), Other (3%)
- ✅ **5G strategy DEEP DIVE:** Spectrum (160 MHz, $1.224B, 3-installment payment), launch (April 1, 2026), CAPEX (25%), strategic rationale (ARPU uplift, B2B IoT)
- ✅ **Competitive moat (telecom-specific):** Spectrum (160 MHz, 17-year advantage until 2042), market leadership (40.2% share), brand strength, switching costs (MNP friction), regulatory barriers ($1.2B+ entry cost)
- ✅ **Segment financial breakdown:** Revenue contribution % (Turkcell Türkiye 91%, Techfin 6%, Other 3%); EBITDA margin implied (~43% Group 2025)
- ✅ **FX exposure quantified:** 80% FX debt breakdown (43% USD, 32% EUR, 4% CNY, 20% TRY), 81% FX cash, 9M 2025 loss TRY 28.1B, double-hit risk

### Birikimli Bilgi Bankası Güncellemesi:

**Telecom Business Model Template:**
```
1. Core Telecom Metrics:
   - Mobile subscribers (total, postpaid %, prepaid %)
   - ARPU (Average Revenue Per User)
   - Churn rate (monthly or quarterly)
   - Market share
   - Network coverage (% population/geography)

2. Segment Breakdown:
   - Domestic telecom (consumer mobile, B2B, wholesale)
   - Fixed broadband (fiber, ADSL, corporate)
   - Digital services (cloud, IoT, cybersecurity, content, fintech)
   - International operations

3. Capital Intensity:
   - CAPEX/Revenue % (telecom typical: 15-25%)
   - Spectrum acquisition (one-time + ongoing fees)
   - Network buildout (4G maintenance + 5G deployment)
   - Fiber/data center expansion

4. FX Exposure (Critical for EM Telecoms):
   - Revenue currency mix (domestic vs international)
   - Debt currency mix (local vs hard currency)
   - Cash holdings currency mix
   - Net FX position (short/long)
   - Hedging strategy

5. Competitive Moat:
   - Spectrum holdings (amount, duration, cost to replicate)
   - Network quality (coverage, speed, reliability)
   - Brand value and customer loyalty
   - Switching costs (number portability friction, contract lock-ins)
   - Regulatory barriers (spectrum auction entry cost, licensing)
```

**5G Economics Checklist:**
- [ ] Spectrum acquisition cost (upfront + ongoing fees)
- [ ] Spectrum allocation (MHz, bands, duration)
- [ ] CAPEX intensity (% of revenue during buildout phase)
- [ ] Coverage targets (% population by year)
- [ ] ARPU premium strategy (expected uplift %)
- [ ] Subscriber migration targets (4G → 5G)
- [ ] B2B/IoT revenue opportunity (enterprise use cases)
- [ ] Competitive positioning (spectrum vs competitors)
- [ ] ROI timeline (payback period, NPV sensitivity)

**Telecom FX Risk Assessment:**
| Metric | TCELL Example | Interpretation |
|---|---|---|
| FX Debt % | 80% (43% USD, 32% EUR, 4% CNY) | HIGH exposure |
| FX Revenue % | ~3% (international + roaming) | LOW natural hedge |
| Net FX Position | Net SHORT (post-5G acquisition) | TRY depreciation = double-hit |
| FX Cash % | 81% hard currency | Partial hedge against FX debt |
| Realized FX Loss | TRY 28.1B (9M 2025) | Material impact (exceeded operating profit) |
| Hedging Strategy | Active short-term derivatives; neutral position Q3 2025 | Proactive management |
| Risk Rating | **CRITICAL** | Can overwhelm operating performance |

**Telecom Churn Benchmarks:**
- Postpaid monthly churn: 1.0-2.0% (mature markets), 2.0-3.5% (emerging markets)
- Prepaid monthly churn: 3.0-6.0% (high volatility)
- TCELL churn Q2-Q4 2025: 2.2%, 2.6%, 2.7% (blended; slightly elevated due to MNP competition)
- Seasonality: Q3 typically highest (back-to-school campaigns, competitive promotions)

**Telecom ESG Focus Areas:**
- **Carbon Reduction:** SBTi targets (Scope 1&2: 50-70% reduction by 2030; Scope 3: 20-30%)
- **Renewable Energy:** On-site solar/wind generation to hedge energy costs + meet carbon targets
- **E-Waste:** Device recycling programs, circular economy initiatives
- **Digital Inclusion:** Affordable connectivity for underserved populations
- **Privacy & Security:** Data protection, cybersecurity investments

---

## ✅ CEO Geri Bildirimi — 2026-04-11 — TCELL RAPORU (POST DELTA-UPDATE)

### POZİTİF NOKTALAR:
- ✅ **Business model 3-segment breakdown TAM:** Turkcell Türkiye (91% revenue, TRY 220.3B, +10.3%), Techfin (6%, TRY 13.7B, +21.1%), Other (3%) — detaylı analiz yapılmış
- ✅ **5G strategy deep dive MÜKEMMELspectrum (160 MHz, $1.224B, 3-installment payment), launch (1 Nisan 2026), coverage targets, CAPEX (25%), strategic rationale (ARPU uplift, B2B IoT)
- ✅ **FX exposure KRİTİK FLAGGED:** 80% FX debt (43% USD, 32% EUR), 81% FX cash, 9M 2025 FX loss TRY 28.1B (exceeded operating profit) — double-hit risk quantified
- ✅ **Subsidiary detail:** 7 major subsidiaries mapped (Superonline, Paycell, Financell, Lifecell, TDC, Lifecell Digital, fizy) — her biri için strategy ve performance
- ✅ **ESG comprehensive:** #1 global LSEG ranking (286 telecom operators içinde), SBTi targets (50.47% Scope 1&2, 25% Scope 3), 300 MW solar target, $500M sustainable bond
- ✅ **Ownership structure:** TVF 26.2% (58% voting via privileged shares), IMTIS 19.8%, privileged share mechanism detaylı açıklanmış
- ✅ **2026 guidance:** 5-7% revenue, 40-42% EBITDA margin, 25% CAPEX, 18-20% data center growth, ~$100M DC EBITDA
- ✅ **Competitive moat (telecom-specific):** Spectrum advantage (160 MHz, 17-year valid until 2042), market leadership (40.2% share), switching costs (MNP friction), regulatory barriers ($1.2B+ entry cost)
- ✅ **Seasonality analizi:** Revenue (Q4 strongest), churn (Q3 elevated), CAPEX (Q4 concentrated), cost (regulatory-driven)
- ✅ **25+ kaynak cite edilmiş:** Earnings releases, investor presentations, KAP disclosures, ESG reports, haber kaynakları

### Eksikler (Minor):
- **Board independence ratio quantified değil:** "4/9 elected by minority shareholders" demiş ama exact independent director % yok (örn: "44% independent")
- **Historical guidance track record eksik:** 2022-2024 guidance vs actuals karşılaştırması yapılmamış (requires earnings archive review)
- **Digital business services product breakdown:** 97% growth mentioned but product revenue split (IoT vs cybersecurity vs big data vs managed services) not disclosed

### Bundan Sonra:
- ✅ **TÜM önceki kurallar başarıyla uygulandı — output TRUNCATION çözüldü, tam JSON delivered**
- **Board quantification:** Eğer independent director % KAP'ta varsa extract et — "early adopter" / "minority shareholder elected" gibi vague terms YASAK, sayısal oran ver
- **Guidance track record (nice-to-have):** Eğer mümkünse 2022-2024 yönetim rehberliği vs fiili sonuçlar karşılaştırması yap — credibility assessment için
- **Digital services granularity:** Eğer quarterly reports veya earnings calls'ta segment breakdown varsa (IoT, cloud, cybersecurity, advertising ayrı revenue) — parse et

---

*Dosya sahibi: Context Extraction Agent | Denetleyen: CEO*

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **Opet ilişkili taraf riski yüzeysel geçildi:** Opet hem %40 iştirak hem gelirin %18'i kaynağı. Bu çift rol (iştrak + müşteri) yapısal çıkar çatışması riskidir. Transfer fiyatlama metodolojisi (CUP mu? Cost-plus mı?) ve bağımsız denetçinin bu işlemlere ilişkin notu açıkça belirtilmeli. Sadece "ilişkili taraf + müşteri" demek yetmez.
- **Körfez Taşımacılık ve Entek iştiraklarının EBITDA katkısı:** Entek 517.8M TRY katkısı verildi, Körfez Taşımacılık için rakam yok. Konsolide analizde tüm iştiraklerin EBITDA katkısı tablolu olmalı.
- **Doğal hedge mekanizması derinleştirilmeli:** "TRY faturalı ama Akdeniz USD benchmark endeksli" notu var — bu mekanizmanın gerçekten hedge işlevi gördüğü kanıtlanmalı: Net USD pozisyonu (USD alımlar - USD eşdeğeri satışlar) somut sayıyla verilmeli.

### Bundan Sonra:
- **İlişkili taraf işlemlerinde transfer fiyatlama metodolojisi ZORUNLU:** "Arm's length" beyanı yetmez — KAP dipnotlarından hangi fiyatlama yöntemi kullanıldığı çekilmeli (CUP, resale price, cost-plus). TUPRS-Opet işlemi özelinde bu kural geçerli.
- **İştirak bazlı EBITDA katkısı tablosu her raporda yer almalı:** Tüm konsolide iştiraklerin (DİTAŞ, Opet, Körfez, Entek, Tupras Trading) EBITDA katkısı ayrı satırda gösterilmeli; "toplam konsolide" rakamının kaynakları açık olmalı.
- **Net FX pozisyonu sayısal:** Doğal hedge iddiası için "USD alım hacmi ($/yıl) - USD eşdeğeri satış hacmi ($/yıl) = net pozisyon X milyon $" formatında kanıtlanmalı.

---

## ✅ CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu

### Pozitif Noktalar:
- ✅ **OYAK mülkiyeti doğru tespit edildi:** EREGL = OYAK bağlı ortaklığı — KCHOL/THY misconception daha önce düzeltilmişti, bu raporda tekrar edilmedi
- ✅ **IAS 29 flags downstream iletildi:** Hiperflasyon muhasebesi uyarısı downstream agents'a verildi
- ✅ **Ermaden iştiraki tanımlandı:** 100% EREGL bağlı, Sivas madencilik projesine atıf yapıldı
- ✅ **OYAK grup içi işlemler flaglendi:** OYAK Çimento gibi grup içi satışların ilişkili taraf boyutu notlandı

### Eksikler:

1. **AB Safeguard / CBAM detayı yüzeysel:**
   - AB çelik safeguard kotası (Temmuz 2026: -%47 kota, +%50 tarife) ve CBAM geçiş dönemi (2026-2034 aşamalı karbonlandırma) EREGL'in AB ihracat stratejisi için kritik. Bu iki düzenlemenin EREGL ihracat geliri üzerindeki combined etkisi sayısal olarak verilmedi.

2. **Ermaden altın projesi detayı eksik:**
   - 424,000 oz Possible Resource (Sivas) bilgisi verilmedi — bu önemli "gizli değer" kalemi valuation agent için kritik.

3. **Çelik/emtia bağlantısı mekanizması eksik:**
   - HRC (Sıcak Haddelenmiş Çelik) fiyatı → EREGL geliri mekanizması; demir cevheri/kok kömürü fiyatı → COGS mekanizması sayısal bağlantı kurulmadan sadece "emtia fiyatları önemlidir" düzeyinde kaldı.

4. **EPDK enerji tarifesi şoku notlandırılmadı:**
   - 4 Nisan 2026 EPDK kararı (+18.61% sanayi gaz tarifesi) en acil maliyet şokuydı — business context'te flaglenmesi gerekirdi.

### Bundan Sonra:

- **Çelik şirketleri için zorunlu context çıkarım alanları:**
  1. AB Safeguard kota + tarife değişiklik takvimi (Temmuz 2026 kritik)
  2. CBAM geçiş takvimi + EREGL'in karbon yoğunluğu (Scope 1-2 tCO2/ton çelik) 
  3. HRC/CRC spot fiyatı → gelir korelasyonu (€/ton başına 1$ değişim ≈ X TRY EBITDA)
  4. Demir cevheri + kok kömürü fiyatı → COGS geçirgenlik oranı
  5. Enerji düzenleyici kararları (EPDK) → süreç bazlı maliyet etkisi
  6. OYAK grup içi satış oranı + fiyatlama metodolojisi
  7. Ermaden değeri (maden kaynağı + maden geliştirme aşaması)

- **KURAL: Emtia üreticilerinde doğrudan fiyat-maliyet geçirgenliği sayısal verilmeli:** "Demir cevheri fiyatı arttı → COGS artar" yerine "1 $/ton demir cevheri değişimi → yaklaşık X milyon TRY COGS etkisi" formatı.

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu
### Eksikler:
- Sayı çelişkisini doğru yakaladın ama bunu kısa ve karar verdirici yönetici sonucuna bağlamadın.
- Brand identity paketi şirket risk bağlamına göre fazla alan kapladı; öncelik finansal ve stratejik bağlam olmalıydı.
- Reuters/Bloomberg/IR yönlendirmesi verdin ama spesifik belge/link listesi görünür değil.
- Ermaden, AB safeguard ve yönetim söylemlerinde teyitli bilgi ile çıkarım daha sert ayrıştırılmalıydı.
### Bundan Sonra:
- Context extraction'da ilk iş doğrulanmış bağlamsal riskleri ve yönetim çıkarımını öne yaz.
- Her iddiayı `confirmed`, `management statement`, `inference` diye etiketle.
- Kurum adı yerine spesifik belge veya haber linki ver.
- Çelişki tespit ettiğinde kullanılacak authoritative bağlam setini ayrıca kilitle.

---

## [2026-04-14] Gece Eğitimi #2 — Batch 1/4

**Araştırma Konuları:** THYAO 2025 gerçek benchmarklar, CBAM 2026 double-impact (EREGL), holding discount güncelleme, SPK transfer fiyatlama gereklilikleri

**Temel Bulgular:**

1. **THYAO 2025 gerçek rakamlar:** Hasılat 955.5B TRY (+%28), Net kar 118.2B TRY, EBITDAR marjı %23.2, FCF $2.8B (+%45 YoY), CASK US¢8.55, RASK US¢7.21. Küresel sektör EBITDAR ort. %16.1 → THYAO ~+7pp outperformance. Bu rakamlar gelecek THYAO analizlerinin referansı.

2. **EREGL 2026 double-impact:** AB safeguard (çelik ithalat kotası) 2026'da sona eriyor → daha fazla ithalat rekabeti. Aynı anda CBAM sertifika yükümlülüğü başlıyor → yeni maliyet kalemi. Her iki etkiyi birlikte flag'le: "Safeguard bitti + CBAM aktif = 2026 double squeeze".

3. **EREGL green transition:** 3.2 milyar dolar yeşil dönüşüm yatırımı, 2050 net sıfır hedefi. Bu ESG bağlamı analizde raporlanmalı.

4. **Holding discount revize:** KCHOL ~%32, SAHOL ~%44. Türkiye holding discount aralığı %25-45 olarak güncellendi (önceki %10-40 yetersiz).

5. **SPK II-17.1 transfer fiyatlama:** Bağımsız YK onayı zorunlu. "Arm's length beyanı" yetmez — CUP/RPM/CPM metodolojisini dipnottan çek.

**memory.md değişiklikleri:** "Son 4 Raporun" ve "Sektor Bilgi Bankasi" kaldırıldı (knowledge.md'ye taşındı). CBAM double-impact, THYAO benchmark, holding discount güncelleme kuralları eklendi.

**knowledge.md değişiklikleri:** THYAO 2025 benchmark tablosu, Havacılık 8 Zorunlu Context Alanı, EREGL 7 Zorunlu Context Alanı bölümleri eklendi.

**Öğrenme Puanı: 88/100**
