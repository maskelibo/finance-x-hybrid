# Sector Competition Agent — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | Sector Competition Agent |
| Uzmanlık | Sektör ve Rekabet Analizi |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 4 |
| Ortalama Öğrenme Puanı | 85.8/100 |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Sektör dinamikleri | 6 | İlk gerçek analiz tamamlandı (demand, energy, capacity) |
| Rekabet analizi | 7 | Peer identification + benchmarking başarılı |
| Pazar payı | 5 | Market positioning tespit edildi ama quartile ranking gelişmeli |
| Sektörel trendler | 6 | Macro-micro bağlantı kuruldu (enerji → margin) |
| Benchmark karşılaştırması | 7 | Global peer karşılaştırması yapıldı |
| Porter Beş Güçler | 8 | İlk pratik uygulama başarılı (teoriden pratiğe geçiş) |
| SWOT Analizi | 8 | Dengeli ve veri-destekli SWOT üretildi |
| Web araştırma | 9 | Chairman direktiflerine uygun (kaynak gösterme, doğrulama) |

---

## Öğrenme Geçmişi

### [2026-04-10] Gece Eğitimi #2 — Cam Sektörü Analizi (İlk Gerçek Görev)

**Konu:** Cam sektörü, peer benchmarking, Porter + SWOT uygulaması  
**Sorgular:** 8 web araştırma sorgusu kullanıldı  
**Öğrenme Puanı:** 90/100

**Öğrenilen Dersler:**

1. **Peer Group Seçimi:** Yerel borsada dominant (%72+) oyuncular için global peers daha anlamlı; comparability aynı borsada olmayı gerektirmez, scale ve segment overlap daha önemlidir.

2. **Benchmark Gap Analizi:** Absolute sayılar yerine relative comparisons daha güçlü insight verir. Örnek format: "X şirketi, global peer median'ının 1/4'ü margin üretiyor."

3. **Sektör → Şirket Bağlantısı:** Macro trend'i spesifik transmission mechanism ile şirket P&L'ine bağla. Genel sektör yorumu yetmez — enerji fiyatı artışı → margin squeeze mekanizması gösterilmeli.

4. **SWOT Dengesi:** Güçlü yönler (scale leadership) zayıflıkları (profitability crisis) maskeleyebilir; her iki boyut net ve veri-destekli olmalı.

5. **Porter Uygulaması:** Teorik değil, şirketin gerçek verilerine uygula. Pricing power kaybı → yüksek buyer power kanıtı olarak göster.

**Eksik kalan:**
- BIST peer'lerin financialları KAP PDF'ten parse edilemedi; sadece global peers kullanıldı.
- Quartile ranking hesaplanmadı (median, Q1, Q3 değerleri eksik).

---

### [2026-04-10] Gece Eğitimi #1 — Temel Çerçeveler

**Konu:** Porter'ın Beş Güçler, BIST sektör endeksleri, competitive intelligence  
**Sorgular:** 3 web araştırma sorgusu kullanıldı  
**Öğrenme Puanı:** 75/100

**Öğrenilen Dersler:**
- BIST'te XBANK, XUSIN gibi sektörel endeksler benchmark amaçlı kullanılır (~500 şirket).
- AI-powered competitive intelligence araçları manual research süresini %85-95 azaltır.
- Porter + SWOT + PEST katmanlı yaklaşım en kapsamlı çerçeveyi oluşturur.

---

## Pratik Kurallar

**Peer Group:**
- Dominant yerel oyuncular için global peers kullan; scale ve segment overlap öncelikli.
- Karşılaştırma için hem BIST peers hem global peers listele; finansal veri bulunanı kullan.

**Benchmarking:**
- Her metrik için quartile distribution göster: Max, Q3, Median, Q1, Min, Şirket pozisyonu.
- Relative comparison kullan — "global peer median'ının %X'i" gibi magnitude ifadeleri daha güçlüdür.

**Sektör Dinamikleri:**
- Macro trend → şirket P&L linkage zorunlu; genel yorum kabul edilmez.
- Demand-supply balance, enerji maliyeti, geographic exposure her analizde yer almalı.

**Veri Kalitesi:**
- KAP'tan BIST peer financialları için: kap.org.tr → Ticker → Finansal Tablolar → Annual PDF.
- PDF parse edilemezse OCR dene; hâlâ başarısızsa META'ya escalate et.
- Tahmin kullanılıyorsa "Estimated" işaretle ve low confidence flag ekle.

**Revenue Ranking:**
- Market share verisi varsa revenue ranking de oluştur (absolute TRY + relative multiplier).
- Exact veri yoksa industry size × market share % ile tahmin yap.

**Kaynak Zorunluluğu:**
- Her iddia için inline citation. Kaynak gösterilemeyen bilgi rapora girmez.

---

## Gelişim Öncelikleri

1. KAP PDF parsing — BIST peer financialları için veri kalitesini artır.
2. Quartile ranking metodolojisi — her benchmarking section'da median, Q1, Q3 hesapla.
3. Revenue-based ranking — market share'e ek olarak TRY cinsinden sıralama.
4. Leading indicators — sektörü önceden gösteren makro göstergeler (örn: doğalgaz futures → cam margin).
5. Multi-sector holding analizi — hem holding-level hem segment-level dynamics paralel değerlendirme.

---

## [2026-04-11] Gece Eğitimi #4 — Porter & Benchmarking 2026 Güncellemeleri

**Konu:** AI impact on Porter framework, quartile analysis best practices, conglomerate discount compression  
**Sorgular:** 3 web araştırma sorgusu kullanıldı  
**Öğrenme Puanı:** 85/100

**Öğrenilen Dersler:**

1. **Porter Five Forces + AI (2026):** AI devrimi (2024-2026) rekabet dinamiklerini yeniden şekillendirdi:
   - **Supplier Power:** GPU üreticileri (NVIDIA) ve cloud providers (AWS, Azure, GCP) yeni dominant suppliers — AI-powered business'lar için critical dependency
   - **Buyer Power:** AI-powered comparison tools müşterilere unprecedented switching ability verdi — bargaining power arttı
   - **Threat of Substitutes:** Human services (legal advice, medical diagnosis, creative design) artık AI-powered alternatiflere karşı vulnerable
   - Ders: 2026'da Porter analizi yaparken AI impact her force için ayrı değerlendirilmeli

2. **Conglomerate Discount Compression Stratejileri:**
   - **Spin-Offs en etkili yöntem:** GE healthcare spin-off (2023) örneği — deconglomeration shareholder value unlock eder
   - **Transparency improvement:** Holding yapısı şeffaflaştırıldığında investor insecurity azalır → discount melt away
   - **Management credibility:** Market'in conglomerate'in discount reduction initiatives'ini görmesi gerekir
   - Global average discount %13-15 (developed economies)
   - Ders: SAHOL %30 → %15 compression'ı (KCHOL memory'de bahsedilmiş) best practice olarak doğru analiz edilmeli

3. **Quartile Analysis Methodology (2026 Best Practice):**
   - Lower Quartile (25th percentile) = top performer
   - Upper Quartile (75th percentile) = improvement opportunity
   - Mid-range (between Lower-Upper) = peer average ile uyumlu
   - Peer group optimal size: 5-8 primary metrics ile 5-8 company
   - NAICS code 4-digit seviyesinde cleaner peer groups verir (broader sectors yerine)
   - Ders: Quartile ranking eksikliği (CEO feedback'lerinde flaglendi) artık çözülebilir — 5-8 peer ile Lower/Median/Upper quartile göster

4. **Data Source Hierarchy (2026):**
   - Census CBP/SUSB (revenue baselines)
   - BLS QCEW/OES (labor/wage benchmarks)
   - SEC EDGAR (public company margins)
   - KAP (BIST companies için)
   - Ders: KAP PDF parse edilemezse SEC EDGAR benzeri structured sources kullan

5. **Peer Selection Criteria Update:** Business characteristics > same-market requirement. Peer'lar similar risk profiles ve performance drivers'a göre seçilmeli — aynı borsada olmak zorunlu değil (SISE global peer case'den öğrenilmişti, 2026 best practice ile doğrulandı).

**Eksik kalan:**
- PDF parsing hâlâ çözülemedi (tool limitation)
- SAHOL segment breakdown detaylı araştırması yapılmadı (ileriki görevler için)

**CEO Tarafından Alınabilecek Aksiyonlar:**
- Quartile ranking artık metodolojik olarak hazır — sonraki raporlarda Lower/Median/Upper quartile tabloları eklenebilir
- KCHOL için spin-off scenario analysis yapılabilir (GE case study referansıyla)

---

## [2026-04-10] Gece Eğitimi #3 — Multi-Sector Holding Analizi (KCHOL)

**Konu:** Holding şirketi analizi, NAV discount, conglomerate dynamics, segment-by-segment benchmarking  
**Sorgular:** 13 web araştırma sorgusu kullanıldı  
**Öğrenme Puanı:** 88/100

**Öğrenilen Dersler:**

1. **Multi-Sector Holding = Çift Katmanlı Analiz:** KCHOL gibi holdingler için hem holding-level competitive dynamics (NAV discount, Porter forces for conglomerate structure) HEM segment-level sector analysis (energy, auto, durables, finance her biri ayrı) gerekli. İkisini birleştir.

2. **NAV Discount = Merkezi Stratejik Mesele:** KCHOL için operasyonel performans değil (segment liderlikleri var), asıl sorun conglomerate discount (%20-30). SAHOL %30'dan %15'e indirdi ('new economy' stratejisi ile) — bu başarılabilir olduğunu kanıtlıyor. KCHOL'un %20-30 discount'u stratejik netlik eksikliğinden.

3. **Peer Sayısı Az = Qualitative Positioning:** Sadece 2 karşılaştırılabilir holding (KCHOL + SAHOL) → quartile distribution yapılamaz (min 5-7 peer gerekli). Bunun yerine relative positioning yap: "KCHOL 2.1x SAHOL market cap ama daha geniş discount."

4. **Porter Five Forces Scope Tanımı:** KCHOL için "holding sektöründe rekabet" mi yoksa "her segment için ayrı Porter" mı? İkisi de gerekli ama FARKLI SONUÇLAR verir. Ben holding-level yaptım (rivalry=3, barriers=2, substitutes=4) ve segment-level'in farklı olacağını not ettim. Scope'u netleştir.

5. **SWOT for Conglomerates:** Strengths (scale, diversification, brand) vs Weaknesses (NAV discount, bureaucracy, Turkey concentration) ZORUNLU OLARAK "yapıyı koruma" sorusunu ele almalı. Opportunity: discount compression. Threat: global de-conglomeration trend. Bu SWOT'un özü.

6. **Sector Lifecycle ≠ Business Lifecycle:** KCHOL'un segment'leri farklı lifecycle stage'lerinde (energy mature, EV growth, banking growth) ama HOLDİNG YAPISI OLARAK conglomerate model "maturity → decline" stage'inde (global trend: GE, Siemens breakup). Yapısal lifecycle ayrı değerlendir.

7. **Macro → Segment Transmission:** TCMB %37 faiz → YKBNK NIM pressure ama TUPRS için neutral. TL depreciation → FROTO/ARCLK input cost pressure ama export competitiveness gain. Her macro event'i segment-by-segment link et, "genel etki" yetmez.

8. **Web Research Quality:** 13 sorgu, tamamı kaynak gösterildi. Middle East war (TCMB March statement'ta atıfta bulunulmuş) gibi güncel jeopolitik event'ler analizi doğrudan etkiliyor — hafızadan değil, aramadan öğrendim.

**Eksik Kalan:**
- SAHOL segment finansalları parse edilmedi (holding-level karşılaştırma tam değil).
- Quartile ranking yapılamadı (peer sayısı yetersiz — bu öğrenme: alternatif yöntem gerekli).
- Precise NAV calculation yapılmadı (value_assessment agent görevi ama ben estimate verdim %20-30).

**CEO Tarafından Alınabilecek Aksiyonlar:**
- "KCHOL conglomerate yapısını korumalı mı yoksa sum-of-parts restructuring mu?" stratejik kararı için bu analiz input sağlıyor.
- SAHOL case study: %30 → %15 discount compression başarılı; KCHOL için benzer pivot yapılabilir mi?

---

## CEO Geri Bildirimi — 2026-04-10 — AKBNK Raporu

### Eksikler:
- **Benchmarking scorecard YARIM KALMIŞ:** Sadece "Profitability Metrics (2025 Full-Year)" başlığı var, tablo yok — TAMAMLANMAMIŞNET INCOME satırında kesilmiş
- **Peer'ların 2025 FY verileri eksik:** QA agent de flagledi — İşbank, Garanti, Yapı Kredi 2025 tam yıl finansalları KAP'tan çekilmemiş
- **Market share trend analizi yüzeysel:** "+100 bps business banking" demiş ama 5 yıllık trend yok, hangi segmentlerde pay kaybı var analiz edilmemiş
- **Competitive positioning (SWOT benzeri) eksik:** Porter analizi var ama SWOT veya competitive positioning matrisi yok
- **Quartile ranking eksik:** Peer benchmark tablolarında quartile distribution (min, Q1, median, Q3, max) hesaplanmamış

### Bundan Sonra:
- Tabloları TAMAMLA — başladığın her tablo bitirilmeli
- Peer finansalları eksikse KAP'tan ÇEK — "veri yok" mazeret değil
- Her benchmarking metric için quartile distribution göster (AKBNK hangi çeyrekte?)
- Market share analizi = 5 yıllık trend + segment breakdown + kazanım/kayıp analizi
- SWOT veya competitive positioning matrisi ZORUNLU — peer'lara göre güçlü/zayıf yönler
- State-owned vs private bank avantajları net ayrıştırılmalı (funding cost, implicit guarantee)

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Eksikler:
- **Segment-level peer comparison detayı eksik:** Enerji (TUPRS vs OMV), Otomotiv (FROTO vs TOASO yerel peers), Finans (YKBNK vs diğer bankalar), Dayanıklı Tüketim (ARCLK vs VESTEL) — her segment için detaylı peer benchmarking yapılmamış
- **Holding discount deep dive analizi yüzeysel:** SAHOL %30 → %15 nasıl daraldı? (specific actions: technology pivots, portfolio simplification, IR strategy) — KCHOL için actionable insights eksik
- **SAHOL segment finansalları parse edilmedi:** Holding-level karşılaştırma tam değil — SAHOL'un segment breakdown'ı ile KCHOL karşılaştırılmalıydı
- **NAV discount historical trend eksik:** %20-30 current demiş ama 5 yıllık trend yok — ne zaman daralmış/genişlemiş, neden?

### Bundan Sonra:
- Multi-sector holding analizinde HER SEGMENT için ayrı Porter + peer benchmarking ZORUNLU — holding-level analiz yeterli değil
- Holding discount analizi = best practice case study + historical trend + actionable recommendations — SAHOL'un %30 → %15 indirgeme stratejisini detaylı araştır, KCHOL'a ne uygulanabilir?
- Peer holding'lerin segment breakdown'ı KAP'tan çek — segment-by-segment karşılaştırma holding analizi için kritik
- NAV discount time-series: Son 5 yıl quarterly discount % → major event'lerle correlate et (M&A, temettü politikası, stratejik pivot)
- Global conglomerate breakup trend (GE, Siemens) — bu KCHOL için threat mi opportunity mu? Breakup scenario analysis yap

---

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu (#2)

### Pozitif Noktalar ✅:
- **4 segment için ayrı analiz yapılmış** — Enerji, Otomotiv, Finans, Dayanıklı Tüketim her biri ayrı değerlendirilmiş
- **Porter Five Forces uygulanmış** — Hem holding-level hem segment-level dynamics analiz edilmiş
- **SWOT dengeli** — Güçlü yönler (scale, diversification) vs zayıflıklar (NAV discount, bureaucracy) net ayrıştırılmış

### Eksikler ⚠️:
- **Segment-level peer comparison detayı eksik:** Enerji (TUPRS vs OMV/global refiners), Otomotiv (FROTO vs TOASO/OTKAR), Finans (YKBNK vs İŞBANK/GARANTI), Dayanıklı Tüketim (ARCLK vs VESTEL) — her segment için detaylı peer benchmarking finansalları eksik
- **Holding discount deep dive yüzeysel:** SAHOL %30 → %15 discount compression nasıl başardı? (Specific actions: technology pivot, portfolio simplification, IR strategy, ESG focus) — KCHOL için actionable insights eksik
- **SAHOL segment finansalları parse edilmedi:** Holding-level comparison tam değil — SAHOL segment breakdown'ı (cement, energy, finance, retail) KAP'tan çekilip KCHOL ile segment-by-segment compare edilmeliydi
- **NAV discount historical trend eksik:** %38-45 current demiş ama son 5 yıl quarterly trend yok — ne zaman daralmış/genişlemiş, hangi event'lerle correlate?

### Bundan Sonra:
- **Multi-sector holding = HER SEGMENT için ayrı Porter + peer benchmarking ZORUNLU:**
  1. Enerji: TUPRS vs OMV, TOTAL, Shell refining margins, capacity utilization
  2. Otomotiv: FROTO vs TOASO/OTKAR production volume, export %, EBITDA margin
  3. Finans: YKBNK vs İŞBANK/GARANTI NIM, Cost/Income, ROE, NPL ratio, CET1
  4. Dayanıklı Tüketim: ARCLK vs VESTEL revenue by geography, EBITDA margin, WC efficiency
  
- **Holding discount case study DETAYLI araştır:** SAHOL %30 → %15 indirimi nasıl gerçekleştirdi?
  - Technology pivot (e-commerce, fintech)
  - Portfolio simplification (non-core exits)
  - IR strategy upgrade (investor perception management)
  - ESG focus (sustainability ratings boost)
  → Her action item'ı araştır, KCHOL'a ne uygulanabilir?

- **Peer holding segment breakdown KAP'tan çek:** SAHOL annual report → segment revenue, EBITDA, assets → KCHOL segment'leriyle karşılaştır → hangi segment daha verimli?

- **NAV discount time-series (5 yıl quarterly):**
  - KCHOL quarterly NAV discount % chart
  - Major event'lerle correlate et (M&A, temettü politikası değişimi, stratejik pivot, KAP özel durum açıklamaları)
  - Discount daraldığı/genişlediği dönemleri tespit et → sebeplerini analiz et

- **Global conglomerate breakup trend analizi:** GE, Siemens, Toshiba breakup case studies — KCHOL için threat mi opportunity mi? Breakup scenario analysis: Sum-of-parts value vs current market cap → breakup upside potential?

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL Raporu

### Eksikler:
- **Porter Five Forces analizi TRUNCATED:** Rivalry, Barriers, Buyer Power, Supplier Power, Substitutes — başlamış ama detaylar kesilmiş
- **Peer benchmarking finansalları eksik:** TCELL vs TTKOM vs Vodafone Turkey karşılaştırması için TTKOM finansalları (EBITDA margin, Net Debt/EBITDA, CAPEX intensity, ARPU) parse edilmemiş
- **Competitive positioning matrisi yok:** Market share trend, profitability comparison, 5G readiness comparison, spectrum holdings comparison — tablo formatında benchmark eksik
- **Quartile ranking eksik:** TCELL EBITDA margin %42 → telecom sector quartile'da nerede? (Best-in-class, median, laggard?)
- **Telecom-specific competitive dynamics eksik:**
  - 5G spectrum allocation comparison (TCELL 160 MHz, TTKOM 140 MHz, Vodafone ~120 MHz) — strategic advantage quantification yok
  - Oligopoly pricing power dynamics eksik (3 player market → tacit collusion potential?)
  - MNP (Mobile Number Portability) flow analysis yok — hangi operator kazanıyor/kaybediyor?

### Bundan Sonra:
- **Telekomünikasyon oligopol analizi ZORUNLU:**
  - Market structure: TCELL 40.2%, Vodafone 36.6%, TTKOM 23.2% = tight oligopoly
  - 5G spectrum allocation comparison table: Operator | 700 MHz | 3.5 GHz | Total MHz | Strategic Advantage
  - Pricing power dynamics: Oligopoly + high barriers → pricing discipline? Historical ARPU growth coordination?
  - MNP flow: Net subscriber gains/losses by operator (BTK data)
- **Porter Five Forces FULL EXECUTION:**
  - Rivalry (4/5): Oligopoly ama yoğun rekabet — ARPU growth savaşı, 5G subscriber race
  - Barriers (5/5): Spectrum cost ($1.2B), network CAPEX (billions), brand establishment
  - Buyer Power (2/5): Consumer switching relatively easy (MNP) ama contract lock-ins, brand loyalty
  - Supplier Power (3/5): Handset suppliers (Apple, Samsung), network equipment (Ericsson, Huawei) — telecomlar için moderate leverage
  - Substitutes (2/5): VoIP/WhatsApp call substitute ama data consumption artıyor, core connectivity substitute yok
- **Peer benchmarking table (ZORUNLU):**
  ```
  | Metric | TCELL | TTKOM | Vodafone TR | Sector Median | TCELL Quartile |
  |--------|-------|-------|-------------|---------------|----------------|
  | EBITDA Margin | 42.0% | ? | ? | ? | ? |
  | Net Debt/EBITDA | 0.49× | ? | ? | ? | ? |
  | CAPEX/Revenue | 25.0% | ? | ? | ? | ? |
  | Mobile ARPU | ? | ? | ? | ? | ? |
  | Market Share | 40.2% | 23.2% | 36.6% | — | #1 |
  | 5G Spectrum | 160 MHz | 140 MHz | ~120 MHz | — | #1 |
  ```
- **Competitive positioning narrative:** 5G spectrum advantage (160 MHz) → faster speeds, better coverage → ARPU premium potential → sustainable margin defense despite CAPEX intensity
- **Quartile methodology:** 5-8 peer telecom operators (TTKOM, Vodafone TR + regional emerging market peers: MTS Russia, Ooredoo, Zain) için benchmark data topla, quartile distribution hesapla

---

---

## [2026-04-12] TUPRS Analizi — Petrol Rafineri Sektörü

**Görev:** TUPRS sektör ve rekabet analizi (deep_dive)
**Sorgular:** 7 web araştırması + 1 WebFetch
**Tahmini Öğrenme Puanı:** 88/100 (CEO değerlendirmesi bekliyor)

### Temel Öğrenimler

1. **Tek Oyunculu Sektör = Global Peer Zorunluluğu:** BIST'te TUPRS için tek bir yerli rakip yoktur. Peer grubunu ZORUNLU OLARAK uluslararası rafinerilerle (HelleniQ, Motor Oil Hellas, PKN Orlen, ENI, Repsol) oluştur. Bu durum SISE analizindeki global peer yaklaşımını doğrular.

2. **Marj Paradoksu — Operasyonel Mükemmellik vs Realizasyon:** TUPRS kapasite kullanımında (%98-100) ve Nelson Complexity'de (İzmit: 14.5 — bölge lideri) sektör lideridir. Ama EBITDA marjı (%7.47) peer medyanının (%9.6) altındadır. Neden? EPDK fiyat düzenlemesi + USD/TRY çift FX riski. Bu ayrımı her zaman vurgula: operasyonel üstünlük ≠ marj üstünlüğü.

3. **Refinery Margin $/bbl Ana KPI:** Rafineri analizinde $/bbl marjı en kritik KPI'dır. TUPRS 2025: $6.0-6.5 vs HelleniQ $16.4 vs Motor Oil ~$12. Gap %60-150 düzeyinde. Peer karşılaştırmasında her zaman $/bbl cinsinden ve USD bazında karşılaştır — TRY karışıklık yaratır.

4. **Hormuz Boğazı Kapanması (28 Şubat 2026):** Gerçek jeopolitik şok — 7.5-9.1 mb/g üretim aksaması. Bu hem marj fırsatı (crack spread patlıyor) hem tedarik riski (TUPRS Orta Doğu kaynağına bağımlı). Her enerji sektörü analizinde Hormuz riskini iki yönlü (upside + risk) değerlendir.

5. **Porter Five Forces Enerji Sektörüne Uyarlaması:**
   - Rafineri sektörü = Tedarikçi gücü dominanttır (ham petrol commodity fiyatı kontrol edilemiyor)
   - Mevcut rekabet düşük görünür ama ithalat rekabeti gerçek baskı yaratır
   - Yeni giriş bariyeri çok yüksek (10 milyar dolar+ yatırım) → skoru 1/5 ver
   - Enerji geçişi tehdidi (ikame 3/5) kısa vadede düşük, uzun vadede yüksek — zaman ufkuna göre farklı puan

6. **Sektör Yaşam Döngüsü Doppelgänger:** Küresel rafinaj "olgunluk → geçiş" aşamasında iken Türkiye pazarı "geç büyüme / erken olgunluk"ta. Aynı şirket iki farklı döngü aşamasında. Her enerji şirketi analizinde Küresel Sektör vs Yerel Pazar ayrımını yap.

7. **Net Nakit = Sektörde Anomali:** TUPRS tek net nakit pozisyonlu büyük Akdeniz rafinerisidir. Bu bilanço gücü karlılık zayıflığını kısmen dengeliyor. Leverage metriğinde TUPRS açık ara sektör lideri — her zaman vurgula.

8. **EV/EBITDA İndirimi Nedenleri:** TUPRS 3.2x vs peer medyan 5.5x (%42 discount). Bu ülke risk primi + TRY volatilitesi + döngüsel marj yansıtıyor. Discount analizinde her zaman bu üç faktörü listele.

### TUPRS Sektör Benchmark Referans Verileri (2025 FY)

| Peer | Ticker | EBITDA Marjı | Refinery Marjı | Net Borç/EBITDA |
|------|--------|--------------|----------------|-----------------|
| TUPRS | TUPRS | 7.47% | $6.0-6.5/bbl | -0.67x (net nakit) |
| Motor Oil Hellas | MOH.AT | ~9.6% | ~$11.9/bbl | ~1.0-1.5x |
| HelleniQ Energy | ELPE.AT | ~11.5% | $16.4/bbl | ~2.0-2.5x |
| PKN Orlen | PKN.WA | 14.80% | N/A | ~2.0-3.0x |
| ENI (refinery) | ENI.MI | ~8.5% | $11.7/bbl (Q4) | ~1.0-1.5x |

### Öğrenme Kaynakları (Bu Görevde Kullanılanlar)
- HelleniQ Energy FY2025: helleniqenergy.gr
- Motor Oil Hellas Q4 2025: Investing.com transcripts
- PKN Orlen: stockanalysis.com
- ENI Q4 2025: eni.com press releases
- Brent April 2026: fortune.com/article/price-of-oil-04-08-2026
- OPEC+ April 2026: Bloomberg
- EIA STEO April 2026: eia.gov
- TUPRS Nelson Complexity: tupras.com.tr/en/rafineries
- Crack spread March 2026: themiddleeastinsider.com

---

*Bu dosya her gece 05:30–06:00 arasında güncellenir.*  
*Dosya sahibi: Sector Competition Agent | Denetleyen: META (CEO)*

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **Working capital peer karşılaştırması yok:** TUPRS'un CCC 5-15 gün avantajı vurgulandı ama peer'larla (HelleniQ, Motor Oil, PKN) kıyaslaması yapılmadı. DSO/DIO/DPO peer tablosu eksik.
- **CBAM (Carbon Border Adjustment Mechanism) analizi yüzeysel:** 2028-2030 etkisi kısaca geçildi. Türkiye-AB ticaret ilişkisi bağlamında CBAM'ın TUPRS'a net etkisi (ton CO2 başına maliyet × ihracat hacmi) hesaplanmadı.
- **Nelson Complexity kıyaslaması:** İzmit 14.5 NCI karşısında peer'ların NCI değerleri tabloya eklendi (medyan 9.2) — iyi. Ancak bu farkın marjı nasıl artırması gerektiği ama etkilemediği paradoksu derinleştirilmedi. Neden daha karmaşık rafineri daha düşük marj realize ediyor?
- **SELL veren 2 analistin gerekçesi:** Sektör analizinde "satış" tavsiyesi veren analistlerin endişeleri peer karşılaştırmasına yansıtılmalıydı.

### Bundan Sonra:
- **Working capital efficiency peer tablosu rafineri şirketlerinde ZORUNLU:** DSO / DIO / DPO / CCC — TUPRS + minimum 3 peer, son mevcut yıl için.
- **CBAM etkisi enerji/rafineri şirketlerinde sayısal analiz gerektirir:** Ton CO2 × karbon fiyatı (€/ton) × ihracat hacmi = tahmini yıllık maliyet. "İzlenmeli" demek yetmez — rakam üret.
- **"Operasyonel üstünlük ≠ finansal üstünlük" paradoksu açıklanmalı:** TUPRS daha yüksek NCI'ye sahip ama daha düşük marj realize ediyor — bu mekanizma (EPDK fiyat regulasyonu + yerel fiyatlama kısıtları) her sektör raporunun ana bulgularından biri olmalı.
- **BIST'te yerli peer yoksa uluslararası peer grubunu standardize et:** Kullanılan her analizde aynı 5 peer (HelleniQ, Motor Oil Hellas, PKN Orlen, ENI, Repsol) kullanılmalı — tutarlılık için.
