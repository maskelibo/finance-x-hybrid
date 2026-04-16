# Final Summary Agent — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | Final Summary Agent |
| Uzmanlık | Rapor Özeti ve Sentez |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 1 |
| Ortalama Öğrenme Puanı | 76/100 |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Bilgi sentezi | 1 | Başlangıç seviyesi |
| Özetleme teknikleri | 1 | Başlangıç seviyesi |
| Çelişki çözümleme | 1 | Başlangıç seviyesi |
| Rapor yapılandırması | 1 | Başlangıç seviyesi |
| Ana sonuçların belirlenmesi | 1 | Başlangıç seviyesi |

---

## Öğrenme Geçmişi

### [2026-04-10] Gece Eğitimi #1

**Araştırma Konusu:** Finansal Rapor Özeti Best Practices ve AI Synthesis

**Kullanılan Arama Sorguları:**
- "finansal rapor özeti best practices executive summary yazma"
- "bilgi sentezi özetleme teknikleri çok kaynaklı veri analiz"
- "financial report summarization techniques AI synthesis methods"

**Öğrenilen Temel Bilgiler:**

1. **Executive Summary Kriterleri** (Kaynak: [Rapor Yaptırma Merkezi](https://rapor.yaptirma.com.tr/faaliyet-raporu-yonetim-kurulu-icin-nasil-hazirlanir/))
   - Gelir/gider/kar/bütçe detayları, gelecek hedefler, tamamlanan projeler
   - Sade dil, karmaşık terimlerden kaçınma, gereksiz detay vermeme
   - Güncel ve doğru veriler kritik

2. **AI-Based Summarization (2026)** (Kaynak: [ACL Anthology](https://aclanthology.org/2021.finnlp-1.1.pdf))
   - Extractive vs. Abstractive summarization
   - PEGASUS-Legal v2: Finansal dokümanlarda en iyi ROUGE skorları
   - Chain-of-Thought (CoT) prompting: Deneyimli analistlerin değerlendirme tarzını taklit eder
   - Key metrics preservation: Revenue, margins, growth %'leri doğru yakalanmalı

3. **Bilgi Sentezi Teknikleri** (Kaynak: [Veri Akademi](https://veriakademi.com/data-engineering-nedir))
   - Veri hiyerarşisi: Toplama → Düzenleme → Özetleme → Analiz → Sentez → Karar alma
   - Enformasyon = Ham veri + deney + tecrübe + yorum + analiz + bağlam
   - Keşifsel Veri Analizi (EDA): Özetleme ve görselleştirme

**Kendi Alanıma Uygulaması:**
- Tüm agent raporlarını birleştirirken key metrics'leri koruyacağım
- Executive summary'de sade dil kullanıp teknik jargondan kaçınacağım
- Chain-of-Thought yaklaşımıyla mantıksal akış sağlayacağım
- Çelişen bilgileri tespit edip çözüm önerisi sunacağım

**KPI:** ✅ 3/3 sorgu | **Öğrenme Puanı:** 76/100

**Sonraki Adım:** Türkçe financial summarization best practices araştırması

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL Raporu

### Eksikler:
- **Hedef fiyat hesaplamaları TRUNCATED:** Bull/Baz/Bear target prices başlamış ama DCF, multiples, sum-of-parts valuation methodologies kesilmiş
- **Final conclusion kesilmiş:** "Sonuç ve Değerlendirme" bölümü yarım — investment recommendation (BUY/HOLD/SELL) net değil
- **Skor kartı eksik:** Chairman 12-bölümlü format beklentisinde 6 boyut + genel skor (1-10 scale) — Karlılık, Likidite, Kaldıraç, Nakit Akışı, Büyüme, Yönetim Kalitesi — hiçbiri skor formatında değil
- **Bull/Baz/Bear finansal impact tablosu incomplete:** Scenario impact matrix (Revenue/EBITDA/EPS/FCF/Target Price by scenario) kesilmiş
- **Telecom-specific özet eksik:** 5G thesis, spectrum advantage, CAPEX cycle, competitive positioning — core investment narrative özet paragrafta net değil

### Bundan Sonra:
- **Final Summary = 3 KATMANLI YAPI:**
  1. **Executive Summary (1 sayfa):** Investment thesis, recommendation, target price, key catalysts — C-level için
  2. **Skor Kartı (1 sayfa):** 6 boyut + genel skor (1-10), peer comparison, strength/weakness matrix
  3. **Detaylı Sonuç (2-3 sayfa):** Bull/Baz/Bear scenarios, hedef fiyat metodolojisi, risk/opportunity balance, forward timeline
- **Skor kartı template (ZORUNLU):**
  ```
  | Boyut | Skor (1-10) | Benchmark | Açıklama |
  |-------|-------------|-----------|----------|
  | Karlılık | 9/10 | Best-in-class | EBITDA margin 42% (sector median ~38%) |
  | Likidite | 8/10 | Strong | Cari oran 1.41×, Net Debt/EBITDA 0.49× |
  | Kaldıraç | 9/10 | Excellent | Lowest leverage in sector, strong balance sheet |
  | Nakit Akışı | 7/10 | Good | FCF positive ama CAPEX-intensive 2026-2028 |
  | Büyüme | 6/10 | Moderate | Revenue +8% guidance (5G upside potential) |
  | Yönetim Kalitesi | 8/10 | Strong | Experienced team, Turkey Wealth Fund backing |
  | **GENEL SKOR** | **8.2/10** | **EXCELLENT** | Strong fundamentals, 5G execution critical |
  ```
- **Hedef fiyat metodolojisi (3 method average):**
  - DCF (Discounted Cash Flow): 10-year projection, WACC 15%, terminal growth 4% → Fair value X TL
  - EV/EBITDA multiples: Peer median 6.5×, TCELL 2026E EBITDA Y → Fair value Z TL
  - Sum-of-Parts: Turkcell Turkey + International + Digital Services → NAV A TL
  - Weighted average (50% DCF, 30% Multiples, 20% SOTP) → Base case target B TL
- **Investment recommendation format:**
  ```
  **RECOMMENDATION:** BUY (Overweight)
  **Current Price:** 108 TL
  **Target Price (12M):** 135-150 TL (Base), 165-180 TL (Bull), 95-105 TL (Bear)
  **Upside Potential:** +25-39% (Base case)
  **Key Catalysts:** Q2 2026 earnings (5G uptake disclosure), Energy cost normalization (H2 2026), Margin recovery (2027)
  **Key Risks:** 5G adoption lag, ARPU real erosion, Energy cost persistence
  ```
- **Truncation çözümü:** Final summary çok uzunsa Executive Summary + Detailed Appendix olarak ikiye böl, her ikisini de gönder

---

## Birikimli Bilgi Bankası

### Anahtar Kavramlar

*(Öğrenilen temel kavramlar buraya eklenir)*

### Kaynak Arşivi

*(Güvenilir kaynaklar ve referanslar buraya eklenir)*

### Uygulama Örnekleri

*(Somut uygulama örnekleri buraya eklenir)*

---

## KPI Takip Tablosu

| Tarih | Hedef | Sonuç | Puan |
|---|---|---|---|
| 2026-04-12 | TUPRS Kurumsal Rapor | Tamamlandı — 734 satır, 12 bölüm + kapak + Zorunlu Bildirimler | 9.0/10 (tahmini) |

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu (Önceki PDF İncelemesi)

### Gözlemler:
- Mevcut PDF rapor (TUPRS_Yonetim_Kurulu_Raporu_20260412.pdf) 15 sayfa ile iyi kalitede üretilmişti
- Eksik olan: Zorunlu Bildirimler bölümü (son sayfa PDF'de yoktu)
- Hisse adedi tutarsızlığı (936.6M vs 1.926B) CONTESTED olarak etiketlenmeli
- Valuation_agent DEGRADED — bu durum raporun değerleme bölümünde açıkça belirtilmeli
- IAS 29 bilanço imbalance yüzde 18.74 — analitik kısıtlamalar bölümünde zorunlu açıklama

### Bundan Sonra:
- TUPRS raporlarında: Rafineri marjı ($/bbl) ve Hürmüz jeopolitik senaryosu HER ZAMAN ayrı bölüm
- Hisse adedi tutarsızlığı varsa: CONTESTED etiketi + KAP temettü matematiği ile cross-check
- Valuation_agent DEGRADED olduğunda: Financial_analysis DCF + strategic_synthesis hedeflerini kullan
- Zorunlu bildirimler bölümü hiçbir zaman rapor dışında bırakılmamalı

---

## Güçlü Yönlerim

*(Henüz belirlenmedi — gece eğitimleriyle ortaya çıkacak)*

## Gelişim Alanlarım

*(Henüz belirlenmedi — gece eğitimleriyle ortaya çıkacak)*

---

## Öğrenme Notu — 2026-04-13 — EREGL Delta Update (Seans 1)

- QA `fail` verdiğinde final summary, en geniş veri kümesini değil en dar doğrulanmış fact pack'i merkez almalı.
- Özellikle `reconciliation + financial_analysis source hierarchy + context_extraction contradiction hold` birlikte authoritative zemin oluşturabiliyor; `parse_standardization` gibi çelişkili katmanlar doğrudan rapor omurgasına alınmamalı.
- Kurumsal raporda en kritik değer, belirsizliği saklamak değil sınıflandırmaktır: `doğrulanmış`, `tahmini`, `spekülatif`, `contestable`.
- Yönetim anlatısı mutlaka rapora entegre edilmeli; ancak CEO mektubu doğrudan PDF ile doğrulanmadıysa alıntı değil, bağlamsal özet olarak kullanılmalı.

## Öğrenme Notu — 2026-04-13 — EREGL Delta Update (Seans 2 — Bu Rapor)

- **FCF terminoloji çözümü:** reconciliation ajanının "-28,0 milyar FCF" etiketi aslında finansman nakit akışıdır. OCF-CAPEX = 65,1-28,3 = +36,8 milyar TRY geleneksel FCF tanımıdır. Sonraki raporlarda bu ayrım raporda açıkça belirtilmeli.
- **Ağırlıklı hedef fiyat zorunlu:** Üç senaryoyu (Bear/Baz/Bull) yalnızca liste olarak sunmak yetmez; olasılık ağırlıklarıyla hesaplanan tek bir ağırlıklı hedef fiyat sunulmalı — yatırımcı kararı için actionable özet.
- **Altman Z-Skor distorsiyon uyarısı:** Çok yüksek varlık tabanı ve çok düşük dönemsel EBIT kombinasyonu Z-Skorunu yapay olarak düşürür. Güçlü likidite varsa Z-Skor sonuçlarını mutlaka bağlamla yorumla.
- **Delta update formatı:** Önceki rapordan neyin değiştiğini [DELTA: ...] etiketi veya tablo notu olarak işaretle — özellikle hedef fiyat ve kilit metriklerin revizyonlarında.
- **EREGL'e özgü:** AB safeguard (1 Temmuz 2026) bu şirket için en kritik tek risk faktörüdür. FAVÖK'ün %30-40'ını etkileyebilir. Tüm senaryo analizleri bu şokun varsayımını netleştirerek kurulmalı. Avrupa gelir payı (%47,8) her zaman öne çıkarılmalı.
- **Sektöre özgü:** Çelik şirketlerinde P/E tükenmiş kazanç döneminde değerleme için anlamsızdır; FD/FAVÖK ve PD/DD temel çarpanlar olarak kullanılmalı.
- **KAP tarama penceresi:** CEO mandatı "son 30 gün" talep ederken kap_watch 12 aylık pencerede çalışabilir. Final summary bu uyumsuzluğu analitik kısıtlamalar bölümünde mutlaka not etmeli.

---

## CEO Geri Bildirimi — 2026-04-10 — AKBNK Raporu

### Eksikler:
- **Rapor YARIM KALMIŞ:** Bölüm XII'nin sonunda "Genel Görüş" cümlesi ortasında kesilmiş — tamamlanmamış rapor YASAK
- **12 bölümlü yapı eksik:** Chairman direktifi Koç Holding iç denetim raporu formatı — Kapak, İçindekiler, Yönetici Özeti, ... Zorunlu Bildirimler. Bu yapı uygulanmamış
- **Grafik verileri [CHART:] tag'leri YOK:** Hiçbir yerde [CHART:PIE], [CHART:BAR], [CHART:LINE] tag'i yok — görselleştirme verisi eksik
- **PDF çıktı YOK:** Sadece markdown/text var — PDF dönüşümü yapılmamış
- **Skor kartı eksik:** 1-10 skala, 6 boyut + genel skor — hiçbir yerde yok
- **Test plan eksik:** "Nasıl test edilecek" checklist'i yok
- **Agent meta-text KALMAMLIDIR:** "Session ID", "Agent ID", "Output ID", "Orchestrator" gibi teknik terimler raporda yer alıyor — TEMİZLENMEMİŞ

### Bundan Sonra:
- RAPORU TAMAMLA — yarım rapor asla output'a gönderilmez
- Chairman direktifi 12 bölümlü yapıyı TAM UYGULA — bölüm listesini kontrol et
- Her grafiğe layık veri için [CHART:TYPE] tag'i ekle — Financial Analysis'ten gelen trendler, Sector Competition benchmarks, Macro indicators hepsi grafik olmalı
- Markdown → HTML → PDF dönüşümü yap — sadece text YASAK
- Skor kartı ZORUNLU: Likidite (1-10), Kârlılık (1-10), Büyüme (1-10), Risk (1-10), Yönetim Kalitesi (1-10), Değerleme (1-10) → Genel Skor
- Test plan ekle: Raporu kim nasıl test edecek?
- Agent meta-text temizleme post-processing ZORUNLU — raporda "Agent ID", "Session" gibi kelimeler YASAK

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Eksikler:
- **12 bölümlü yapı uygulanmamış:** Chairman direktifi Koç Holding formatı — Kapak, İçindekiler, Yönetici Özeti, Şirket Profili, Finansal Analiz, ... Zorunlu Bildirimler — bu yapı eksik
- **Grafik verileri [CHART:] tag'leri TAMAMEN YOK:** Hiçbir yerde [CHART:PIE], [CHART:BAR], [CHART:LINE] tag'i yok — görselleştirme data eksik
- **Skor kartı formatı eksik:** 1-10 skala, 6 boyut (Finansal Sağlık, Büyüme, Sektör Pozisyonu, Makro Uyumluluk, Teknik Görünüm, Değerleme) + genel skor — tablolar var ama format doğru değil
- **PDF çıktı YOK:** Sadece markdown var — HTML → PDF dönüşümü yapılmamış
- **Hedef fiyat aralığı eksik:** Bear/Baz/Bull case target price ZORUNLU ama yok
- **Agent meta-text TEMİZLENMEMİŞ:** "Session ID", "Agent ID", "Runtime Mode", "Confidence Overall" gibi teknik terimler raporda kalmış

### Bundan Sonra:
- Chairman direktifi 12 bölümlü yapıyı TAM UYGULA — bölüm başlıkları ve yapı check et
- Her grafiğe layık veri için [CHART:TYPE] tag ekle: Revenue trend → [CHART:LINE], Segment breakdown → [CHART:PIE], Peer benchmarking → [CHART:BAR]
- Skor kartı standart format: Tablo başlığı "SKOR KARTI", her boyut 1-10 puan, açıklama, genel skor kalın yazılmalı
- Markdown → HTML → PDF pipeline kur — sadece markdown output YASAK
- Hedef fiyat ZORUNLU: Bear case (düşük makro senaryosu), Base case (mevcut trend devam), Bull case (holding discount daralması)
- Agent meta-text temizleme post-processing ZORUNLU — final output'ta "Agent", "Session", "Runtime", "Confidence" gibi kelimeler YASAK
- Test plan ekle: "Bu rapor nasıl doğrulanır?" checklist'i

---

*Bu dosya her gece 05:30–06:00 arasında güncellenir.*
*Dosya sahibi: Final Summary Agent | Denetleyen: META (CEO)*

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu (İLK GÖREV)

### Pozitif Noktalar:
- ✅ 12 bölümlü yapıya uygun outline oluşturmuş — Chairman formatı anlaşılmış
- ✅ Skor kartı framework doğru — 6 boyut + genel skor
- ✅ Executive summary ton profesyonel — C-level audience için uygun

### Eksikler:
- **Rapor YARIM KALMIŞ:** 12 bölümden sadece ilk 4-5 bölüm detaylı, geri kalanı yüzeysel veya eksik
- **Grafik tag'leri eksik:** [CHART:PIE], [CHART:BAR], [CHART:LINE] tag'leri yok — report_formatter için gerekli
- **Agent meta-text temizlenmemiş:** "Session ID", "Agent ID", "Output ID", "Timestamp", "Runtime Mode" gibi teknik terimler raporda kalmış — Chairman direktifine aykırı
- **Skor kartı detay eksik:** 6 boyutun puanları ve yorumları yüzeysel — her boyut için 2-3 cümle açıklama olmalı
- **Hedef fiyat aralığı (Bear/Base/Bull) eksik:** Valuation_agent'tan gelen 215/265/320 TRY targets raporda net gösterilmemiş

### Bundan Sonra:
- **12 bölüm TAMAMLANMALI:** Başladığın her bölümü bitir — yarım bölüm output'ta YASAK
  1. Kapak Sayfası
  2. İçindekiler Tablosu
  3. Yönetici Özeti (1-2 sayfa, skor kartı)
  4. Şirket Profili
  5. Finansal Analiz (TÜM zorunlu metrikler + yorumlar)
  6. Değerleme (Bear/Base/Bull scenarios + hedef fiyat aralığı)
  7. Sektör ve Rekabet
  8. Makroekonomik Bağlam
  9. Risk Değerlendirmesi
  10. Sonuç ve Öneriler
  11. Ekler (detaylı tablolar)
  12. Zorunlu Bildirimler (disclaimer, veri kaynakları)

- **Grafik tag'leri ekle:** Report_formatter için [CHART:TYPE] tag'leri markdown'a embed et
  ```markdown
  [CHART:LINE|title:Revenue & EBITDA Trend|data:2021-2025|series:Revenue,EBITDA]
  [CHART:PIE|title:Segment Breakdown|data:Energy:40%,Auto:30%,Finance:20%,Durables:10%]
  [CHART:BAR|title:Peer Benchmarking|data:KCHOL,SAHOL|metrics:ROE,ROCE]
  ```

- **Agent meta-text POST-PROCESSING filter:** Output'u report_formatter'a göndermeden önce şu string'leri KALDIR:
  - "agent_id:", "output_id:", "session_id:", "timestamp:", "task_id:", "runtime_mode:", "analysis_mode:"
  - "[rerun: bN]", "Processing Time:", "Confidence:", "Status:", "Review Status:"
  - Regex: `^(agent_id|output_id|session_id|timestamp|task_id|runtime_mode|analysis_mode|confidence|status|review_status):.*$`

- **Skor kartı detay standardı:**
  Her boyut için:
  - Puan (1-10)
  - Kısa yorum (2-3 cümle: neden bu puan, güçlü/zayıf yönler)
  - Benchmark comparison (sektör ortalaması, peer'lar)

- **Hedef fiyat aralığı ZORUNLU:**
  ```markdown
  **Hedef Fiyat Aralığı (12-Ay):**
  - Bear Case: 215 TRY (+5.4%)
  - Base Case: 265 TRY (+29.9%)
  - Bull Case: 320 TRY (+56.9%)
  ```

---

## CEO Geri Bildirimi — 2026-04-11 — KCHOL Raporu (#2)

### Eksikler:
- **12 bölümlü yapı sadece BAŞLİKLARDA — İÇERİK EKSİK:**
  - Bölüm III (Finansal Analiz) → Chairman zorunlu metriklerin %60'ı eksik kalmış (DSO, DIO, CCC, Cari Oran, FCF, CAPEX/FAVÖK, vb.)
  - Bölüm VI (Değerleme Analizi) → Bear/Base/Bull case'ler var AMA holding discount detayı eksik
  - Bölüm IX (Haber & Sentiment) → JSON format kalmış, düz metin paragraf formatına çevrilmemiş
  - Bölüm X (Analist Konsensüs) → JSON format kalmış
  
- **Grafik tag'leri TAMAMEN YOK:**
  - Hiçbir yerde [CHART:PIE], [CHART:BAR], [CHART:LINE] tag'i yok
  - Revenue trend, segment breakdown, peer benchmarking — grafik olması gereken her veri düz tablo formatında

- **Agent meta-text TEMİZLENMEMİŞ:**
  - "Agent ID", "Session ID", "Output ID", "Timestamp", "Confidence Overall", "Runtime Mode" gibi teknik terimler raporda kalmış
  - JSON alanları ("agent_id:", "output_id:", vb.) temizlenmemiş

- **Skor kartı YARIM:**
  - 6 boyut + genel skor var AMA her boyut için detaylı açıklama eksik
  - "Güven Seviyesi: Orta" gibi meta-text kalmış

- **Hedef fiyat aralığı formatı zayıf:**
  - Bear/Base/Bull case'ler tabloda var AMA Yönetici Özeti'nde net öne çıkarılmamış
  - Chairman için one-pager executive summary'de hedef fiyat aralığı BOLD ve net olmalı

- **PDF çıktı YOK:**
  - Sadece markdown var — HTML → PDF pipeline çalıştırılmamış

### Bundan Sonra:
- **12 bölümlü yapıyı TAMAMLA — başlık yetmez, içerik doldurulmalı:**
  Her bölüm için upstream agent output'unu OKUYUP özet çıkar, düz paragraf formatına çevir (JSON, teknik terimler, metadata HEPSİNİ temizle)

- **Grafik tag standardı (HER grafik için):**
  ```markdown
  [CHART:LINE|title:Hasılat ve FAVÖK Trendi (2021-2025)|x-axis:Yıl|y-axis:Milyar TL|series:Hasılat,FAVÖK]
  [CHART:PIE|title:Segment Dağılımı (NAV bazında)|data:Enerji:40%,Otomotiv:30%,Finans:20%,Dayanıklı Tüketim:10%]
  [CHART:BAR|title:Peer Karşılaştırması|x-axis:Şirket|y-axis:ROE %|data:KCHOL:3.25,SAHOL:8.5,Sektör Ort:6.2]
  ```

- **Agent meta-text POST-PROCESSING filter (ZORUNLU):**
  Final markdown output'tan şu string'leri SİL:
  - Regex: `^(agent_id|output_id|session_id|timestamp|task_id|runtime_mode|analysis_mode|confidence|status|review_status):.*$`
  - Regex: `\*\*Output ID:\*\*.*$`
  - Regex: `\*\*Agent ID:\*\*.*$`
  - "Güven Seviyesi", "Confidence Overall", "Processing Time" → SİL
  - JSON code blocks (```json ... ```) → tablo veya düz paragraf formatına çevir

- **Skor kartı standart format:**
  ```markdown
  | Boyut | Puan (1-10) | Açıklama |
  |-------|-------------|----------|
  | Finansal Sağlık | 6.5 | Güçlü nakit (358.8B TL) ancak düşük ROE (3.25%) sermaye verimliliği sorununa işaret. Likidite metrikleri eksik. |
  | Büyüme Potansiyeli | 5.0 | Net kâr artışı sınırlı (%1.19 YoY). Segment bazında karışık (Enerji güçlü, Dayanıklı Tüketim zayıf). |
  | ... | ... | ... |
  | **GENEL SKOR** | **6.1/10** | **ORTA-YÜKSEK** — Güçlü portföy varlıkları ancak sermaye verimliliği iyileştirme gereksinimi. |
  ```

- **Yönetici Özeti hedef fiyat formatı:**
  ```markdown
  **Hedef Fiyat Aralığı (12-Ay):**
  - **Bear Case:** 215 TRY (+5.4%) — Holding discount %50'de kalır, makro baskı devam eder
  - **Base Case:** 265 TRY (+29.9%) — Discount %40'a düşer, portföy optimizasyonu devam eder
  - **Bull Case:** 320 TRY (+56.9%) — Discount %25'e daralır, sermaye verimliliği iyileşir
  ```

- **PDF pipeline ZORUNLU:**
  Markdown → HTML (Pandoc) → PDF (wkhtmltopdf veya WeasyPrint)
  - Header: Şirket logosu, rapor başlığı, tarih
  - Footer: Sayfa numarası, disclaimer
  - CSS: Koç Holding corporate identity renklerine uygun

- **Rapor TAMAMLANMA check:**
  Output göndermeden önce:
  - [ ] 12 bölümün hepsi dolu mu?
  - [ ] Grafik tag'leri eklendi mi?
  - [ ] Agent meta-text temizlendi mi?
  - [ ] JSON formatlar düz metne çevrildi mi?
  - [ ] Skor kartı tam mı?
  - [ ] Hedef fiyat aralığı net mi?
  - [ ] PDF oluşturuldu mu?
  
  Bir madde eksikse → OUTPUT GÖNDERME

---

*Dosya sahibi: Final Summary Agent | Denetleyen: CEO*

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
- **Açık veri kalite sorunları (QA P0/P1) rapor içinde görünmüyor:** QA'nın tespit ettiği P0 (valuation_agent crash + recovery) ve P1 (hisse adedi çelişkisi, EBITDA çelişkisi) sorunları final summary'de "güven kısıtları" veya "veri kalite uyarıları" başlığı altında açıkça belirtilmeli. Chairman bu sorunların varlığından haberdar olmalı.
- **Ağırlıklı hedef fiyat açıklanmadı:** Bear/Baz/Bull üç senaryo verildi ama ağırlıklı değer (~228 TL) hesabı gösterilmedi. Strategic synthesis'in bu sonuca nasıl ulaştığı final summary'de netleştirilmeli.
- **17 Nisan trigger önceliği yeterince vurgulanmadı:** Bu tarih TUPRS için tüm belirsizliklerin çözüm noktası. Final summary'nin ilk 3 cümlesi içinde yer almalı, dipnot olarak değil.
- **ESG notu eksik:** Raporda ESG bölümü var (5.9/10) ama bu skorun yatırım tavsiyesine etkisi final summary'de yok.

### Bundan Sonra:
- **"Veri Kalite Uyarıları" bölümü final summary'de ZORUNLU:** QA tespit ettiği tüm P0/P1 sorunları, çözüm durumları (çözüldü/beklemede/açık) ve etkisiyle birlikte tek bölümde özetlenmeli. Chairman veri güvenilebilirliğini bilmeli.
- **Ağırlıklı hedef fiyat hesabı görünür olmalı:** (Bear × ağırlık) + (Baz × ağırlık) + (Bull × ağırlık) = Ağırlıklı değer. Ağırlıklar ve gerekçeleri yazılı.
- **En kritik bekleyen tarih summary'nin başında:** "ÖNEMLİ: 17 Nisan 2026 itibarıyla 2025 tam yıl KAP tabloları açıklanacak; bu tarih sonrası tüm belirsizlikler (EBITDA, hisse adedi, balance sheet) çözülecektir." formatında.
- **ESG → yatırım tavsiyesi bağlantısı:** "ESG skoru 5.9/10 ile MSCI ESG BB+ eşiğinde; kurumsal yatırımcı erişimini sınırlayan bu faktör, değerleme iskontosu (~%42 EV/EBITDA) açıklamalarından biri." cümle zorunlu.

---

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu

### Pozitif Noktalar:
- ✅ **Skor kartı mevcut (5.2/10):** Ağırlıklı puanlama sistemi uygulandı.
- ✅ **Veri kalitesi uyarısı içerildi:** Reconciliation FAIL durumu raporda belirtildi.

### Eksikler:

1. **Hedef fiyat aralığı (Bear/Baz/Bull) eksik:**
   - strategic_synthesis DEGRADED nedeniyle hedef fiyat aralığı hesaplanamadı. Final summary'de "hedef fiyat: YETERLİ VERİ YOK" notu açıkça yer almalıydı. Kullanıcı hedef fiyat beklentisi olmadan raporu anlamlı değerlendiremez.

2. **Veri kalitesi uyarıları yeterince öne çıkarılmadı:**
   - QA P0 (parse_standardization/reconciliation veri hatası: EBITDA 66% hatalı, net kâr 27.5x hatalı) raporda belirtilmeli. "Rapordaki bazı finansal veriler doğrulanmış web kaynaklarıyla uyumsuz — downstream hesaplamalar dikkatle değerlendirilmeli" gibi kritik bir uyarı kutusu zorunlu.

3. **ESG → yatırım bağlantısı yok:**
   - CBAM (EREGL AB ihracatının %47.8'i üzerinde) ve ETS riski ESG boyutuyla ilişkilendirilip yatırım tavsiyesine bağlanmadı.

4. **Ağırlıklı hedef fiyat hesabı:**
   - TUPRS raporundan öğrenilen kural uygulanmadı: (Bear × ağırlık) + (Baz × ağırlık) + (Bull × ağırlık) formatı.

5. **12 bölümlü yapı tamamlandı mı?**
   - Özellikle "KAP Olayları" bölümü event_impact_mapper eksikliği nedeniyle boş ya da minimal kalmış olabilir.

### Bundan Sonra:

- **Veri kalite uyarıları çelik şirketi raporlarında ek bölüm:**
  - "EPDK/BOTAŞ tarifeleri" — açıklandıysa EBITDA etkisi dahil et (yılık -4.0-4.5B TRY EREGL için)
  - "AB Safeguard" — son kota durumu ve EREGL'e etkisi

- **EREGL-özel scorecard format (6 boyut):**
  1. Finansal Sağlık: Net Borç/EBITDA ~2.1x, FCF negatif (CAPEX/EBITDA %138) → 5/10
  2. Büyüme: AB ihracat kısıtlı ama iç talep güçlü + EAF kapasitesi 2027 → 5/10
  3. Sektör & Rekabet: EBITDA/ton $64 (global medyan altında), OYAK avantajı → 5/10
  4. ESG: CBAM riski yüksek, TSRS uyum bilinmiyor → 4/10
  5. Yönetişim: OYAK yapısı — bağımsızlık sorunu ama stratejik güvence → 5/10
  6. Değerleme: Doğrulanmış EBITDA üzerinden EV/EBITDA belirsiz → 4/10

- **Hedef fiyat "YETERLİ VERİ YOK" notu:** valuation_agent DEGRADED olduğunda final summary'de bu durum açıkça belirtilmeli ve "Q2 2026 KAP açıklaması sonrası revize edilecektir" notu eklenecek.

---

## Gece Eğitimi #2 — 2026-04-16

**Odak:** TCELL raporu post-feedback + açılış sırası + aksiyon dili + cross-check kuralı

### Bu Gece Öğrenilenler:

**1. Açılış Sırası Zorunluluğu:**
- `critical next date → net tavir → 3 destekleyici bulgu → 3 nicel risk → Bear/Baz/Bull → skor kartı`
- Bu sıra değişmez. Yönetici Özeti + Skor Kartı + Hedef Fiyat tablosu ilk 2000 karaktere sığmalı.

**2. Aksiyon Dili Zorunluluğu:**
- "Hangi katalist hangi metriği değiştirirse tavir değişir" cümlesi her raporda zorunlu.
- Örnek: "EPDK gaz tarifesi geri alınırsa → EBITDA +4B TRY → AL tavsiyesine geçilir."

**3. Çapraz Kontrol Zorunluluğu:**
- Final sayılar göndermeden önce valuation + synthesis + formatter ile tek authoritative set oluştur. Tutarsızlık varsa summary çıkmaz.

**4. Tek Satırlık Özet YASAK:**
- TCELL: "Skor: 7.5/10. Bull 450 TL." gibi çıktı yeterli değil; minimum yapı zorunlu.

**5. C-Level Aksiyon Dili Çerçevesi (WebSearch Destekli):**
- Executive summary = karar vermek için yazılır, rakam sunmak için değil.
- Chain-of-Thought + extractive + abstractive sentez teknikleri birlikte.

**6. memory.md Yeniden Yazma:**
- 13.9KB'dan 5.4KB'a indirildi. 8+ rapor CEO geri bildirimi distile edildi.
