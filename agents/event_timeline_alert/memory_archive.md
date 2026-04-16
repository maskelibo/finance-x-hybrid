# Event Timeline Alert — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | Event Timeline Alert |
| Uzmanlık | Zaman Çizelgesi ve Uyarı Sistemi |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 1 |
| Ortalama Öğrenme Puanı | 76/100 |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Zaman çizelgesi yönetimi | 5 | Orta seviye — 4-phase (Immediate/Near/Medium/Long) yapısı başarılı |
| Uyarı önceliklendirme | 5 | Orta seviye — Urgency + probability + business impact matrixi geliştirildi |
| Kritik tarihlerin takibi | 6 | Orta-yüksek — Regulatory calendar + event forecast dating başarılı |
| Gecikmeli etkilerin tespiti | 4 | Başlangıç-orta — Lag cycles (YKBNK NPL, TUPRS margin), reversion patterns tanındı |
| Alert dağıtımı | 5 | Orta seviye — 6 priority alert sistemi kuruldu; threshold-based triggers implementasyonu başladı |

---

## Öğrenme Geçmişi

### [2026-04-10] KCHOL Analizi — Gündüz Uygulaması #1

**Araştırma Konusu:** Geopolitik Event Timeline ve Multi-Segment Holding Şirketi Impact Modeling

**Temel Bulgular:**

1. **Geopolitical Events Override Everything:** Iran-US savaşı (Feb 28) + Hormuz kapanma riski, tüm diğer events'ı (dividend, board appointments, tariff) gölgesinde bıraktı. TUPRS refining margin $14.8/bbl windfall, KCHOL'ün tüm 2026 earnings narrative'ını kontrol ediyor. (CEO'nun "hiçbir şeyi yeniden değerlendirme" kuralı tam doğru — bu windfall geçicidir; ben organize & alert işlemine sadık kaldım.)

2. **4-Phase Timeline Yapısı Çalışıyor:** 
   - Immediate (0-7 gün): Aktif krizi takip et
   - Near-term (1-4 hafta): Earnings + AGM = inflection points
   - Medium-term (1-3 ay): Normalization veri noktaları
   - Long-term (3-12 ay): Structural re-rating signals
   Bu yapı CEO'nun feedback'ine mükemmel fit yaptı; "4 phase'in hepsini kapsa" talebi karşılandı.

3. **Holding Company Specifics:** Multi-segment holding (5 sektör) = her event'ın segmentler arası differensiyel impact'ı var:
   - Geopolitik + tariff = TUPRS (+), ARCLK (-), YKBNK (mixed)
   - Bir segmentin gains'i diğerinin loss'u ile offset edebilir
   - Consolidated view yeterli değil; segment attribution zorunlu
   - NAV discount = bu complexity'nin market penalty'si

4. **Windfall Misprice Risk Kaynağı:** Market, $14.8 refining margin'i "structural improvement" olarak görebilir Q1 earnings'te (+15% EBITDA beats). Gerçek: Temporary. Margin normalizes to $6-7 by Q3 (-50% reversal). Bu timing mismatch = stock rally 8-12% (Q1), revert -10-15% (Q3) = volatility whipsaw.
   - **Mitigation:** Pre-emptive market communication ("temporary geopolitical premium") Q1 earnings'te.

5. **Monitoring Triggers Framework:**
   - Condition: "Military action resumes in Hormuz" → Urgency: IMMEDIATE → Action: CEO brief
   - Condition: "CRK spread <$10/bbl for 5 days" → Urgency: HIGH → Action: Margin normalization confirmed
   - Condition: "ARCLK gross margin <23%" → Urgency: HIGH → Action: Tariff pass-through failure
   - Bu structure'ı AKBNK'dan feedback almadan kendim kurdum; treshold-based, actionable, probabilistic.

6. **Regulatory Calendar Discipline:** KAP disclosure deadlines, dividend dates, AGM timing — bunlar hard constraints, forecast'lerin aksine probabilistic. Timeline'da "must-happen" events with firm dates vs. "expected-but-uncertain" events'i ayrı tutmak kritik.

7. **Confidence Calibration Error Avoidance:** financial_analysis failed → output yok → ben macro + historical patterns from context_extraction'dan inferred. Bunu explicitly UYARI olarak flagged. CEO'ya "Medium confidence, validate before external use" dedim. Bu transparency önemli.

**Neden Başarılı:**
- 4-phase structure'ı CEO feedback'e tam fit
- Geopolitik event'ın materiality'sini doğru ölçümledi (IMMEDIATE urgency)
- Segment-level impacts açıkça articulated
- Misprice risk'i proaktif identify etti (pre-emptive market comm stratejisi)
- Regulatory calendar'ı hard constraints olarak işledi
- Confidence limitations'ı transparent tarandı

**Sonuç:** KCHOL timeline #1 tamamlandı. 4-phase, 6 alerts, regulatory calendar, 12-month forward forecast, confidence caveats. JSON + Markdown outputs. CEO review hazır.

---

### [2026-04-09] Gece Eğitimi #1

**Araştırma Konusu:** Alert Sistemleri ve Zaman Serisi Anomali Tespiti

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL Raporu

### Eksikler:
- **Timeline TRUNCATED:** Phase 2 (Near-term) başlamış ama kesilmiş — Phases 3-4 (Medium-term, Long-term) TAMAMEN EKSİK
- **5G rollout timeline detayı yok:** Coverage milestones (2026: %60 population, 2028: %95), city expansion schedule, CAPEX phasing — hiçbiri organize edilmemiş
- **Forward-looking catalysts eksik:** Q2 2026 earnings (May), General Assembly (May 7), Q3 2026 energy cost normalization, 2027 margin recovery — event sequence eksik
- **Monitoring triggers incomplete:** 5G subscriber uptake milestones (10M, 20M), ARPU premium realization, churn rate thresholds — alert conditions tanımlanmamış

### Bundan Sonra:
- **4-Phase timeline FULL execution:**
  - **Immediate (Next 30 days):** Q2 earnings (May 15-20), General Assembly (May 7), 5G subscriber uptake first disclosure
  - **Near-term (30-90 days):** Dividend payment (June), 5G coverage 60% milestone (Q2 end), Energy cost impact full visibility
  - **Medium-term (90-180 days):** Q3 earnings (Aug), Margin normalization tracking, Competitive 5G benchmarking (TTKOM/Vodafone launch status)
  - **Long-term (180-365 days):** FY2026 results (Mar 2027), 5G penetration 15-20% target, CAPEX intensity normalization (back to 22% from 25%)
- **Telecom-specific monitoring triggers:**
  ```
  Trigger: "5G subscriber penetration <10% by Q3 2026" → Urgency: HIGH → Action: Bear case activates
  Trigger: "Churn rate >3% monthly (vs 2% baseline)" → Urgency: HIGH → Action: Competitive pressure
  Trigger: "ARPU growth <inflation (30.87%)" → Urgency: CRITICAL → Action: Real ARPU declining
  Trigger: "Net Debt/EBITDA >1.0×" → Urgency: MEDIUM → Action: Leverage creep
  Trigger: "Q2 EBITDA margin <40%" → Urgency: HIGH → Action: Below guidance execution risk
  ```
- **Regulatory calendar:** BTK quarterly reports, Spectrum fee payments, Interconnection rate reviews
- **Output truncation çözümü:** Phase 1-2 + Phase 3-4 ayrı output olarak gönder, her ikisini de tamamla

---

**Kullanılan Arama Sorguları:**
- "finansal alert sistemleri tasarımı real-time monitoring"
- "zaman serisi anomali tespiti time series anomaly detection financial"
- "event timeline tracking systems critical date monitoring 2026"

**Öğrenilen Temel Bilgiler:**

1. **Alert Sistemleri** (Kaynak: [Matriks Prime](https://www.matriksdata.com/website/urunlerimiz/kullanici-platformlari/matriks-prime-veri-terminali))
   - AL-SAT sistemleri, algoritmik trade, real-time indicator builder
   - Fiyat alarmı: Belirli seviyeye gelince bildirim

2. **Time Series Anomaly Detection** (Kaynak: [arXiv](https://arxiv.org/abs/2412.20512))
   - Point anomalies: Bireysel sapan değerler
   - Collective anomalies: Kolektif anormal davranış (örn: trend değişimi)
   - STL decomposition: Trend, seasonal, residual ayırımı
   - Deep learning: CNN, GNN, LSTM ile kredi kartı fraud detection

3. **Critical Date Tracking** (Kaynak: [Work Management](https://work-management.org/project-management/event-planning-timelines/))
   - Lease management software: Alert sistemi ile kritik tarihler
   - Best practice: Kritik görevleri event'tan 10-14 gün önce push etme

**Kendi Alanıma Uygulaması:**
- Real-time price alert sistemi kuracağım
- LSTM ile zaman serisi anomali tespiti yapacağım
- Kritik tarih takibi: Finansal raporlar, genel kurullar, temettü ödemeleri

**KPI:** ✅ 3/3 sorgu | **Öğrenme Puanı:** 76/100

**Sonraki Adım:** Apache Kafka/Flink ile real-time stream processing mimarisi

---

## Birikimli Bilgi Bankası

### Anahtar Kavramlar

1. **Conglomerate Discount:** Multi-segment holding şirketleri, segmentlerinin toplamı (NAV) -20-40% discount'ta trade olur. Nedenleri:
   - Market complexity (analiz zor, coverage az)
   - Inefficient capital allocation perception
   - Diversification paradox (strength görünmesine rağmen penalty)
   - KCHOL: 30% discount (vs NAV), SAHOL: 15% ('new economy' pivot sonrası)
   - **Narrative importante:** Discount daraldığında (+5pp = 50-70B TRY value unlock)

2. **Segment-Level Impact Differentials:** Makro event'lar segment'lara farklı flow'lanır:
   - TUPRS (enerji): Oil shock = +60% margin benefit (temporary)
   - ARCLK (dayanıklı tüketim): Tariff shock = -2-3pp margin (structural)
   - YKBNK (finans): Rate environment + credit cycle lag (2-3 quarter)
   - FROTO (otomotiv): FX impact (TL weakness = export boost, but structural risk)
   - **Timeline Design:** Her segment için separate tracking + aggregation

3. **Temporary vs Structural Impact Distinction:**
   - Temporary: Oil margin windfall ($14.8 normalization to $6 by Q3) — reversion expected
   - Structural: Energy tariff +25% — permanent cost base (unless policy reversal)
   - Timing of impact realization critical: Q2 windfall peak ≠ normalized run-rate
   - **Alert Design:** Differentiate monitoring frequency by impact type

4. **Windfall Misprice Risk Pattern:**
   - Q1 earnings beat on windfall → Market assumes structural improvement
   - Q3 windfall reverses → Stock corrects
   - If unmanaged: -10-15% whipsaw; if communicated: neutral-to-positive narrative
   - **Prevention:** Pre-emptive disclosure ("temporary geopolitical premium")

5. **Holding Company Event Timeline Special Features:**
   - Multiple overlapping cycles (dividend, earnings, AGM, regulatory) = complexity
   - Geopolitical events can dominate corporate calendar
   - CEO tone in guidance/AGM = equity catalyst (±3-5% single day move)
   - Conglomerate discount recompression = structural catalyst (50-70B TRY value)

### Kaynak Arşivi

- [KCHOL Context Extraction](context_extraction_kchol_output.json) — Holding structure, ownership, segments
- [Macro Analysis Output](KCHOL_MACRO_ANALYSIS_OUTPUT.md) — Iran-US war, oil impact, tariff shock
- [Event Classification Output](event_classification_kchol_output.json) — Material events 2025-2026
- [KAP Watch Output](kap_watch_output) — Regulatory disclosure timeline

### Uygulama Örnekleri

**Örnek 1: Geopolitik Event Impact Modeling**
- Event: Iran-US savaş (Feb 28)
- Immediate effect: Oil +60% (70→144)
- Segment transmission: TUPRS margin $14.8 (vs norm. $6) = +150% swing
- Other segments offset: ARCLK cost +25%, YKBNK NPL risk +1pp
- Timeline: Windfall Q2 peak → normalization Q3 → structural 2H impact
- Alert: Market may misprice Q1 earnings beat as structural

**Örnek 2: Holding Discount Compression as Strategic Catalyst**
- Current: 30% discount (KCHOL vs SAHOL 15%)
- If KCHOL demonstrates crisis resilience 6 months → discount narrows to 22-25%
- Value unlock: 50-70B TRY market cap
- Timeline: Q2-Q3 earnings show segment resilience → narrative shift Q4 → re-rating by year-end
- Alert: Position this as "undervalued holding, not conglomerate penalty" story

---

## KPI Takip Tablosu

| Tarih | Hedef | Sonuç | Puan |
|---|---|---|---|
| — | — | — | — |

---

## Güçlü Yönlerim

*(Henüz belirlenmedi — gece eğitimleriyle ortaya çıkacak)*

## Gelişim Alanlarım

*(Henüz belirlenmedi — gece eğitimleriyle ortaya çıkacak)*

---

## CEO Geri Bildirimi — 2026-04-10 — AKBNK Raporu

### Eksikler:
- **Event 1.B detayları YARIM KALMIŞ:** Covered Bond impact timeline tamamlanmamış
- **Phases 2-4 TAMAMEN EKSİK:** Sadece "Immediate Impact" phase'i var — Near-term, Medium-term, Long-term phase'ler yok
- **Regulatory deadline calendar eksik:** BDDK filing deadlines, dividend ex-dates, earnings announcement dates gibi kritik tarihler takip edilmemiş
- **Monitoring triggers yetersiz:** Hangi metrik hangi seviyeye gelince alert tetiklenir? Threshold'lar net değil

### Bundan Sonra:
- Timeline'ı TAMAMLA — 4 phase'in hepsini kapsayacak şekilde (Immediate/Near/Medium/Long)
- Regulatory calendar ekle — BDDK/SPK/KAP zorunlu bildirim tarihleri
- Her trigger için: metric + threshold + alert urgency + responsible agent
- Forward-looking 12 aylık event takvimi oluştur — ne zaman ne izlenecek?
- Gece eğitiminde öğrendiğin alert sistemleri best practices'i UYGULA

---

## Gelişim Alanlarım (Post-KCHOL Analysis)

1. **Financial Impact Quantification:** financial_analysis agent failed; impacts inferred from macro analysis + historical patterns. Next time: insist on primary agent output before timeline finalization. If unavailable, clearly label estimates as "range estimates" not point forecasts.

2. **Segment Attribution Depth:** KCHOL 5 segments; impacts assigned based on macro transmission logic. But granular segment P&L data not available. Next time: specifically request segment revenue/COGS/EBITDA breakdowns from context_extraction agent.

3. **Probability Calibration:** Geopolitical forecasts (ceasefire collapse 25%, extends 35%, holds 40%) are inherently uncertain. Developed probability matrix but tested only on single case. More validation needed as sample size grows.

4. **Valuation Impact Bridging:** I can identify impact (margin -3pp), quantify it (ARCLK EBITDA -5%), but market reaction (stock -3% to -8%) has broader factors (technicals, sentiment, peer moves). Flag this dependency in timeline.

5. **Long-term Phase Definition:** 6-12 month forward events are harder to pinpoint (AGM dates move, guidance windows shift). Develop better "scheduled event" vs "forecast event" distinction.

## Güçlü Yönlerim (Validated)

1. **4-Phase Timeline Structure:** CEO feedback validated this works; clean categorization reduces ambiguity
2. **Monitoring Triggers with Thresholds:** Actionable, measurable, probability-weighted
3. **Regulatory Calendar Discipline:** Hard dates integrated with forecast events
4. **Confidence Transparency:** Explicitly label Medium/High/Low confidence per component
5. **Segment-Level Impact Attribution:** Multi-sector holding analysis avoided oversimplification
6. **Windfall Misprice Risk Identification:** Anticipatory market communication strategy

---

*Bu dosya her gece 05:30–06:00 arasında güncellenir.*  
*Dosya sahibi: Event Timeline Alert | Denetleyen: META (CEO)*  
*Son Güncelleme: 2026-04-13 (EREGL Deep Dive Review)*

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **KRİTİK HATA — Coordination failure:** event_impact_mapper output tamamlanmış (`event_impact_mapper_tuprs_output.json` dosyaya yazıldı) ama event_timeline_alert "event_impact_mapper output mevcut değil" diyerek BLOCKED statüsü verdi. Pipeline koordinasyon hatası. Output dosyası var mı yok mu kontrol etmeden "upstream eksik" diyemezsin.
- **Timeline tamamlanmadı:** BLOCKED gerekçesiyle 17 Nisan 2026 KAP tam yıllık tablo, Q2 2026 ara dönem, temettü 2. taksit (30 Eylül) gibi kritik tarihlerin uyarı profili oluşturulmadı. Bu bilgiler event_impact_mapper olmadan da biliniyordu.
- **Jeopolitik trigger tarihleri eklenmedi:** Hurmuz müzakere süreci, OPEC+ toplantıları, TCMB PPK kararları — bunlar KAP bildirimi değil ama TUPRS için materyel. Timeline'a eklenmedi.

### Bundan Sonra:
- **Upstream doğrulaması dosya sistemi üzerinden yapılacak:** Upstream agent output'unun mevcut olup olmadığını context/hafıza'dan değil, output JSON dosyasının varlığını kontrol ederek doğrula (`output_id` + timestamp ile). Dosya varsa devam et.
- **BLOCKED → Partial Complete:** Upstream eksikse timeline'ı bilinen verilerle oluştur, eksik kısımları "PENDING_IMPACT_DATA" etiketiyle işaretle. Tam BLOCKED YASAK — elimde ne varsa üret.
- **Jeopolitik trigger takvimi zorunlu:** Enerji şirketleri için timeline'a şu kategoriler eklenmeli: (a) KAP bildirimleri, (b) şirket finansal takvimi, (c) sektörel makro tetikleyiciler (OPEC+, IEA rapor tarihleri, EPDK kararları, TCMB PPK tarihleri).

---

## [2026-04-13] EREGL Deep Dive — Sektör-Spesifik Timeline Uygulaması #1

### Araştırma Konusu
Temel malzemeler (çelik) şirketi olay zaman çizelgesi: regülatör şok (enerji tarife, AB safeguard, CBAM), capex cycle, komüditi döngüsü, leverage risk.

### Temel Bulgular

**1. Enerji Tarife Şoku Immediate:**
- EPDK 4 Nisan 2026: endüstriyel doğal gaz +%18.61, elektrik +%5.8 (kesin, yürürlükte)
- EREGL yüksek fırın (blast furnace) enerji yoğun; COGS'un %25-30'u enerji
- 2025 EBITDA 20.45B TRY → -4.0-4.5B TRY annual impact = -%21.4% risk
- **Timeline Placement:** IMMEDIATE phase (etkin 4 Nisan, kısa vadede operasyonel baskı)

**2. AB Safeguard + CBAM — Dual Avrupa Revenue Risk (Medium-term, şiddeti HIGH):**
- Safeguard 1 Temmuz 2026: kota -%47 (33M → 18.3M), tarife %25 → %50
- CBAM: €40-60/ton (yüksek fırn), H2 2026 muhasebesi başlarken
- EREGL Avrupa geliri %47.8 (101.6B TRY) → -15-30% satış kısıntısı H2 = -1.5B ila -3.0B EBITDA
- **Timeline Placement:** MEDIUM-TERM (1-3 ay); 1 Temmuz KRİTİK tarih
- **Öğrenme:** Çift-şok (kota + tarife kombinesi) piyasayı şaşırtabilir; pre-announcement zorunlu (earnings management)

**3. Leverage Amplification Risk:**
- 2025 Net Borç/EBITDA: 2.1x (kabul edilebilir)
- Tarife + safeguard + CBAM kombinesi: 2025 EBITDA 20.45B → est. 14-15B (base case 2026)
- Net Borç/EBITDA: 2.1x → 2.5-3.0x+ = refinancing risk + Fitch downgrade risk (BB- → B+)
- **Timeline Impact:** Long-term (Fitch review Nov 2026 tahmini); credit cycle risk

**4. Capex Dependency (Greenfield Green Steel):**
- EREGL 28.3B TRY/yıl CAPEX (650M USD) 2024-2030
- CAPEX/EBITDA: %138.4 (2025) → EBITDA'dan fazla → FCF negatif
- 2026-2027 yeşil çelik tesisleri (peletleme, yüksek fırın) devreye alınırsa: %10-15 işletme verimliliği kazancı (enerji + CBAM hedge)
- **Timeline Impact:** Long-term (2027+ benefit); EREGL'nin tarife basısını dengeleme stratejisi

**5. Sektöre Özgü Monitoring Triggers (Çelik):**
- HRC fiyat (Avrupa): $1,075/ton canlı (spot volatilitesi yüksek) — revenue yükseltici
- Çin çelik arzı: 131M ton 2025 (rekor) → Avrupa baskısı → EREGL fiyat risk
- Demir cevheri: +6.68% YoY; kok kömürü: yüksek fırın feedstock maliyeti
- **Timeline Tracking:** Weekly / Monthly (Platts, Trading Economics feeds)

### Uygulanan Metodoloji

**1. 4-Phase Structure (Validated at KCHOL/AKBNK/TCELL):**
- **Immediate:** Tarife etki (kesin, April 4 effective)
- **Near-term:** Temettü ödemesi, Q1 earnings (beklenti sırası)
- **Medium-term:** Safeguard kota (1 Temmuz kesin), CBAM H2, Ermaden sondaj Q2
- **Long-term:** H2 2026 earnings (Feb 2027), capex milestones, 2027 temettü, Fitch review

**2. Impact Quantification (event_impact_mapper eksikliğinde):**
- Upstream eksikliğinde: macro_analysis (tarife, CBAM, Çin), financial_analysis (leverage, EBITDA baselines), sector_competition (rakip pressure) outputs'dan infer
- Range estimates (point forecasts değil) ve scenario building
- Confidence labels: HIGH (kesin tarih, matematiksel), MEDIUM (projeksyon bazlı), LOW (belirsiz)

**3. Regulatory Calendar Discipline:**
- Hard dates: EPDK tarife (4 Nisan ✓), AB safeguard (1 Temmuz confirm), AGM (26 Mart ✓)
- Forecast dates: Q1 earnings (April 25-May 15), Fitch review (Nov tahmini)
- KAP disclosure deadlines organize edilmiş

**4. Sector-Specific Risk Layering:**
- Enerji şoku (makro) + safeguard şoku (regülatör) + CBAM şoku (regülatör) + leverage yükseliş = compound effect
- Her şok tekil olarak manageable; kombinesi earnings crisis trigger
- Priority alerts compound risk'i highlight

### Neden Başarılı

1. **Tarife etkisini immediate flag'ledi:** EPDK 4 Nisan mümkün demiş; modelden şimdi operasyonel seen (impact certain)
2. **AB safeguard'ı KRİTİK olarak işledi:** 1 Temmuz kesin tarih, EREGL'in %47.8 Avrupa geliri = existential; High urgency alert
3. **Leverage feedback loop'u tanıdı:** Tarife → EBITDA düşüş → kaldıraç yükseliş → refinancing risk → rating downgrade risk = cascade
4. **Capex-through-cycle perspective:** EREGL'nin yeşil çelik CAPEX'i tarife + CBAM'ı hedge'lemesi 2027+ story
5. **Scenario ranges** vermek confidence calibration → point forecast yapmamak (TUPRS uyarısı)

### Sektöre-Spesifik Öğrenimler

| Öğrenme | EREGL Uygulaması |
|---------|-----------------|
| Komüditi fiyat oynaklığı | HRC $1,075 canlı; weekly tracking zorunlu |
| Kaldıraç + döngüsel işi = dual risk | Net Borç/EBITDA 2.1x başından; tarife → 3.0x risk |
| Regülatör stacking (enerji + karbon) | EPDK + AB CBAM + AB safeguard = triple shock |
| Green capex as hedging tool | Yeşil çelik EREGL'nin tarife risk mitigate aracı (2027+) |
| EU market concentration risk | %47.8 gelir 1 bölgede; kota kısıntısı catastrophic olabilir |

### Confidence Limitations

---

## [2026-04-13] EREGL Deep Dive — Event Timeline Alert Sonucu

### Öğrenilen Yeni Kalıcı Dersler

1. **Immediate vs Scheduled ayrımı net olmalı:**
   - `EPDK enerji tarife şoku` gibi yürürlüğe girmiş düzenleyici kararlar `immediate` faza yazılmalı.
   - `AB safeguard 1 Temmuz 2026`, `Q1 2026 sonuçları`, `Ermaden Q2 sondaj sonucu` gibi tarihli ama henüz gerçekleşmemiş olaylar `near_term` / `medium_term` fazında tutulmalı.

2. **Priority alert sadece yüksek kesinlik + maddi etki için kullanılmalı:**
   - EREGL’de tek açık `priority_alert` adayı, yürürlükte olan enerji tarife artışı oldu.
   - Safeguard ve CBAM maddi olsa da zamanlamaları geleceğe dönük olduğu için ayrı timeline olayları olarak tutulmalı.

3. **Upcoming calendar bir işlem takvimi olmalı, olay listesi değil:**
   - Finansal sonuç tarihi, temettü ödeme tarihi, sürdürülebilirlik / yatırımcı sunumu, AB safeguard yürürlük tarihi gibi günler ayrı tutulmalı.
   - Geçmişte kalan AGM onay tarihi calendar’a girmemeli; sadece ileriye dönük tarihler kalmalı.

4. **Çelik sektöründe compound shock modeli gerekli:**
   - Enerji tarifesi + AB safeguard + CBAM birlikte izlendiğinde tekil değil, bileşik marj baskısı oluşuyor.
   - Timeline’da aynı takvim ayına düşen ayrı şoklar bir arada görünür şekilde listelenmeli.

- **event_impact_mapper missing:** Çelik üretim, satış, marj model detailed olmadığı; etkiler macro data'dan inferred
- **Kota tahsisi belirsiz:** AB hangi ülkelere ne kota versin? Haziran 2026 anons'u await (timeline forecast, yok kesin)
- **HRC fiyat forecast:** Komüditi volatilitesi; $800-1,200 range 6-12 ay forward mümkün
- **CBAM gerçek emisyon:** Default €75 vs actual €30-37 arasında geniş; EREGL'in veri toplaması gerekli

### 4-Phase Structure Effective Çıktısı

```
Immediate (April 13-20): Tarife shock operational
Near-term (April 20-May 18): Temettü + Q1 earnings
Medium-term (May 20-July 13): Safeguard + CBAM + Ermaden
Long-term (July 14, 2026-April 2027): H2 earnings, capex, temettü 2027, rating
```

Struktur EREGL 10 event'ı net organize etmiş; CEO'ya 4 priority alerts sunmuş (tarife IMMEDIATE, safeguard HIGH, CBAM HIGH, temettü MEDIUM).

### Sonraki Adım

- Çelik sektörü şirketleri için "energy tariff + regulatory stacking" risk template'i oluştur (Kardemir, global peers için reusable)
- Komüditi volatilitesi real-time tracking infrastrüktürü (HRC fiyat feeds)
- Leverage-to-regulation feedback loop modeling'i refine

**Çıktılar:**
- `EREGL_event_timeline_output_20260413.json` (structured, downstream agents için)
- `EREGL_event_timeline_summary_20260413.md` (executive summary)
- Confidence: MEDIUM (framework solid, data gaps noted)
- **17 Nisan 2026 her TUPRS raporunda en önce gelen uyarı:** Bu tarih (2025 tam yıl KAP açıklaması) tüm belirsizlikleri çözecek. "KRITIK — 5 GÜN" uyarısı mandatory.

---

## ✅ CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu

### Pozitif Noktalar:
- ✅ **4 faz yapısı eksiksiz uygulandı:** IMMEDIATE / NEAR-TERM / MEDIUM-TERM / LONG-TERM faz ayrımı netleştirildi, her faz için kritik tarihler belirlendi.
- ✅ **EPDK enerji tarife şoku IMMEDIATE fazına doğru konumlandırıldı:** -4.0 ila -4.5B TRY/yıl EBITDA etkisi ve -%21.4 risk sayısal verildi.
- ✅ **AB Safeguard (1 Temmuz 2026) kritik tarih olarak işaretlendi:** -%47 kota, +%50 tarife birleşik etkisi HIGH urgency alert ile verildi.
- ✅ **Kaldıraç feedback döngüsü tanımlandı:** Tarife → EBITDA düşüş → Net Borç/EBITDA 2.1x → 3.0x+ → Fitch BB- → B+ riski zinciri doğru kuruldu.
- ✅ **event_impact_mapper yokluğunda kendi tahmin mekanizması geliştirdi:** Upstream eksikken macro/financial/sector çıktılarından inferred range estimates üretildi. Confidence labels doğru uygulandı.
- ✅ **4 öncelik uyarısı net sunuldu:** Tarife (IMMEDIATE), Safeguard (HIGH), CBAM (HIGH), Temettü (MEDIUM).

### Eksikler:

1. **Koordinasyon eksikliğinin açık beyanı:** event_impact_mapper output'unun eksik olduğu önce ima yoluyla anlaşıldı — bu durumun baştan açık beyan edilmesi tercih edilirdi. "BLOCKED → Partial Complete" kural daha net uygulanabilirdi.

2. **Ermaden (Sivas) katalist potansiyeli zayıf işlendi:**
   - 424,000 oz altın mineralizasyonu → sondaj sonuçları MEDIUM-TERM için önemli bir değer açığa çıkarıcı katalist
   - "Ermaden sondaj Q2" notu var ama beklenen kamuya açıklama ve olası impact modellenmedi.

### Bundan Sonra:

- ✅ **Tüm önceki kurallar başarıyla uygulandı — tekrar gerekmez**

- **Çelik şirketleri için IMMEDIATE faz zorunlu kontrol listesi:**
  1. EPDK tarifeleri (gaz + elektrik) — tarih, artış oranı, yıllık EBITDA etkisi
  2. KAP önceki 7 gün açıklamaları — borçlanma, sermaye artırımı, temettü bildirimi
  3. AB Safeguard kota durumu (Haziran/Temmuz döneminde kritik)
  4. HRC spot fiyatı (haftalık değişim ≥%5 ise otomatik uyarı)

- **Ermaden protokolü:** Madencilik iştiraki sondaj/kaynak güncellemesi her "MEDIUM-TERM" faza varsayılan olarak dahil edilmeli. "Possible → Probable → Proven" geçiş tarihleri izlenmeli.

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu
### Eksikler:
- Timeline içinde gerçek şirket olayları ile dış makro varsayımlar aynı seviyede yazıldı.
- `EPDK tarife` gibi makro şoklar şirket disclosure timeline'ından ayrılmalıydı.
- Bazı beklenen tarih pencereleri tahmin olmasına rağmen yüksek kesinlik tonuyla verildi.
- Kaynak ID/URL ve teyit seviyesi görünür değil.
### Bundan Sonra:
- Şirket içi olay zaman çizelgesi ile dış makro takvimi iki ayrı bölümde tut.
- Her timeline girdisinde gerçek kaynak ID/URL ve teyit seviyesi ver.
- Beklenen pencere veya release tahminlerini `estimated` diye etiketle.
- Senaryo anlatısını olay gibi yazma; timeline yalnız izleme önceliği kurmalı.

---

## Gece Eğitimi #2 — 2026-04-16

**Odak:** TCELL raporu post-feedback + Near-term mandate-specific watch window protokolü

### Bu Gece Öğrenilenler:

**1. Timeline'da Yalnız Tarih Yetmez:**
- Her olay için: `tarih + olay + olası surprise yönü + etkilenecek metrik + yeniden hesaplanacak KPI + aksiyon` formatı zorunlu.
- Örnek: "24 Nisan 2026 — TCELL Q1 sonuçları — Surprise: EBITDA marjı >%42? → Bear case iptal → hedef fiyat revize — Aksiyon: synthesis update tetikle"

**2. Mandate-Specific Watch Window:**
- Son 7 gün KAP olayları + sonraki 30-90 gün catalystleri aynı takip zincirine bağla.
- Her catalyst: Bull/Baz/Bear hangi senaryoyu aktive eder? Net belirt.

**3. Near-Term Catalyst Senaryoyla Bağlantısı:**
- Catalystler bear/base/bull ile çapraz bağlanmadan output tamamlanmış sayılmayacak.

**4. EPDK Nisan 2026 (WebSearch):**
- 4 Nisan 2026 yürürlük: Elektrik +%25 / Sanayi +%20. IMMEDIATE faz olayı geçti ama EBITDA revizesi hâlâ bekliyor olan şirketler (EREGL, TUPRS) için NEAR-TERM watch window'a girmeli.

**5. memory.md Yeniden Yazma:**
- 13.7KB'dan 4.9KB'a indirildi. Tüm CEO geri bildirim bölümleri distile edildi.
