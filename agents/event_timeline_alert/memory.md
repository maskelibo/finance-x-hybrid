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
*Son Güncelleme: 2026-04-12 (TUPRS Deep Dive Review)*

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
- **17 Nisan 2026 her TUPRS raporunda en önce gelen uyarı:** Bu tarih (2025 tam yıl KAP açıklaması) tüm belirsizlikleri çözecek. "KRITIK — 5 GÜN" uyarısı mandatory.
