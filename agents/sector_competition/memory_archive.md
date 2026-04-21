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

## [2026-04-13] Gerçek Görev #2 — EREGL Çelik Sektörü Delta Update

**Görev:** EREGL yassı çelik sektör ve rekabet analizi (delta_update modu)
**Kalite Skoru:** 0.82 — CONDITIONAL PASS
**WebSearch:** İzin verilmedi — kritik eksik

**Öğrenilen Dersler:**

1. **WebSearch İzni Kritik:** Çelik sektöründe HRC spot fiyatı ve global peer FY2025 sonuçları olmadan benchmarking puanı düşüyor. İzin verilmezse output'ta açıkça flagle ve macro_analysis agent'tan veri isteme notunu ekle.

2. **İkili Kaldıraç Okuması:** Net Borç/EBITDA 2.1x "makul" görünürken EBIT/Faiz 1.1x kritik zayıflık — ikisini ayrı satırda göster, sadece biriyle yorum yapma. EREGL bu çelişkinin canlı örneği.

3. **Porter + SWOT Entegrasyonu:** Porter'daki güç puanlarının doğrudan SWOT Tehditler/Fırsatlar sütununa beslenmesi tutarlılık sağlıyor. Örn: Tedarikçi Gücü 4/5 → W2 (hammadde ithalat bağımlılığı) + T4 (hammadde fiyat artışı).

4. **Quasi-Monopol için Peer Stratejisi:** Türkiye yassı çelik'te EREGL quasi-monopol → BIST peer'lar yetersiz → küresel peer grubu zorunlu. Bu durumu peer_group notuna ekle, CEO'nun beklentisini yönet.

5. **AB Safeguard Transmission Mekanizması:** %47.8 AB geliri × kota kısıtı = doğrudan EBITDA etkisi (-6B ile -15B TRY). Bu mekanizmayı gelir bazında göster: "Y TRY gelirin %X'i risk altında → marj etkisi" — soyut "büyük etki" değil, somut rakam.

6. **CBAM Tahmini Formülü:** Export tonu × tCO2/ton × EUR sertifika fiyatı = yıllık yükümlülük. Bu formülü her entegre çelik analizinde kullan. EREGL için: 2.0 MT × 2.0 tCO2 × €75.36 = €301M.

7. **Sektör Döngüsü + Yeşil Alt-Döngü:** Olgunluk sektöründe yeşil dönüşüm yeni bir yatırım döngüsü yaratıyor. Bu ikili yapıyı sector_lifecycle bölümünde her zaman belirt.

8. **Çelişki Çözümü:** CEO direktifindeki 4 çelişki noktasından 3'ünü RESOLVED yaptım (Net Borç, FCF, EBITDA yapısal/döngüsel). Bu çerçeveyi benimse: çelişki tespiti → kanıt bazlı RESOLVED/CONTESTED label.

**Kalıcı Kurallar (Güncellemeler):**
- EREGL gibi tek-dominant şirket → global peer grubu; BIST'te karşılaştırılabilir peer yoksa açıkla
- Her analiz için: Porter → SWOT → Benchmarking Scorecard → Sektör Dinamikleri — bu sıra tutarlı olsun
- WebSearch izni yoksa: (a) pipeline verisi kullan, (b) açıkça flag koy, (c) macro agent'tan entegrasyon talep et

---

## [2026-04-13] Gerçek Görev #3 — EREGL Delta Update #2 (Derinleştirilmiş Sektör Analizi)

**Görev:** EREGL yassı çelik sektör rekabet analizi — delta update, CEO Mandatı EREGL-2026-0413-D2
**Kalite Skoru:** 0.82 — CONDITIONAL PASS (WebSearch eksikliği nedeniyle)
**WebSearch:** İzin yine verilmedi — kritik eksik, bir kez daha flaglendi

**Öğrenilen Yeni Dersler:**

1. **Yönetim Görüşü Entegrasyonu Değer Katar:** Chairman direktifine uygun olarak `management_competitive_assessment` verilerini kullanmak çıktı kalitesini artırdı. `[YÖNETİM GÖRÜŞÜ]` + Analistik Değerlendirme + Güvenilirlik skoru formatı çalışıyor.

2. **CBAM Rekabet Asimetrisi:** AB içi üreticiler CBAM'dan muaf, EREGL tabi. Bu yapısal dezavantaj 2027-2034 arasında büyüyerek EREGL'i rekabetçilik krizine götürebilir. Her entegre çelik analizinde "CBAM competitive asymmetry" başlığı ekle.

3. **Porter Güç Skoru Değişim Yönü Kritik:** Statik puan kadar "yön" (↑/↓/→) önemli. Supplier Power 4/5 ve yönü ↑ — bu EREGL için en acil risk. Bu yön oku formatını her Porter tablosuna ekle.

4. **Çelişki Çözümü Sistematik:** CEO'nun 4 çelişkisini explicit RESOLVED/CONTESTED label ile çözmek downstream güveni artırdı. Bu pattern her raporun sonunda çelişki özet tablosu olarak standartlaşsın.

5. **EBIT/Faiz vs Net Borç/EBITDA İkilisi:** Net Borç/EBITDA 2.1x "makul" görünse de EBIT/Faiz 1.13x kritik zayıflık — her kaldıraç analizinde ikisini ayrı satır olarak göster, tek metrik yeterli değil.

6. **Sektör Döngüsü İkili Format:** Olgunluk + Yeşil Alt-Döngü ikili yapısı çelik analizinin temel çerçevesi. Diagram formatı (ASCII art) kullanmak görselliği artırdı.

**Bilgi Bankası Güncellemeleri — EREGL Spesifik:**
- AB içi rakipler CBAM muaf (ThyssenKrupp, voestalpine, Tata Steel UK) — EREGL tabi
- EREGL CCC: 84 gün = peer medyanı civarı (iyi yönetim)
- EBIT/Faiz 1.13x = tehlikeli seviye; peer medyanı ~2-3x
- Küresel peer medyan EBITDA marjı ~8-10% (FY2025 trough) — EREGL bu bantta
- SSAB HYBRIT yeşil çelik = uzun vadeli asıl tehdit (5-8 yıl)
- Ermaden katkısı: sıfır (henüz spekülatif) — analizde ASLA sayma

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

## [2026-04-13] Gerçek Görev #4 — EREGL BIST Peer Benchmark Derinleştirmesi

**Görev:** EREGL için BIST çelik peer setiyle skor kartı kurma  
**Öğrenilen Dersler:**

1. **Çekirdek vs genişletilmiş peer ayrımı şart:** EREGL için `ISDMR` ve `KRDMD` operasyonel çekirdek peer; `CEMTS` ise ürün karması farklı ama quartile dağılımını zenginleştiren genişletilmiş peer. Bu ayrım yazılmazsa benchmark yanıltıcı görünüyor.

2. **KAP + S&P hibrit set pratik çözüm:** KAP/şirket IR sayfaları stratejik konum ve yıllık finansal taban için; StockAnalysis/S&P ise hızlı oran tablosu için işe yarıyor. Böyle hibrit kullanımda `confidence=medium` ve `comparability note` zorunlu.

3. **EREGL’in zayıf noktası artık marj değil değerleme/leverage göreli pozisyonu:** FY2025’te EBITDA marjı peer medyanına yakın olsa da `Net Debt/EBITDA` ve `EV/EBITDA` tarafında daha pahalı/zayıf görünüyor. Bu pattern gelecekte benzer döngüsel şirketlerde de aranmalı.

4. **Porter puanları sektör şoklarıyla güncellenmeli:** Çelikte `Supplier Power` ve `Rivalry` statik değil; AB safeguard ve CBAM sonrası bir puan yukarı taşınabiliyor. 2026 sonrası çelik analizlerinde yön oku (`↑/↓/→`) standardize edilmeli.

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

## [2026-04-13] EREGL Analizi — Demir-Çelik Sektörü

**Görev:** EREGL sektör ve rekabet analizi (deep_dive)
**Sorgular:** 9 web araştırması + 2 WebFetch
**Tahmini Öğrenme Puanı:** 90/100 (CEO değerlendirmesi bekliyor)

### Temel Öğrenimler

1. **Tek BIST Oyuncusu = Global Peer Zorunluluğu (yeniden teyit):** TUPRS analizinde öğrenilen kural EREGL için de geçerli. Yassı çelik segmentinde BIST'te EREGL'in doğrudan rakibi yok; Kardemir (KRDMD) BIST'te tek çelik şirketi ama uzun çelik üreticisi — segment overlap minimumdur. Peer grubunu ArcelorMittal, SSAB, Tata Steel, Nucor ile oluştur.

2. **EBITDA/ton = Çelik Sektörünün Ana KPI'ı:** EREGL FY 2025 $64/ton vs global medyan ~$100 vs ArcelorMittal $111 vs SSAB ~$150+. Bu fark iki yapısal nedenden: (a) premium ürün payı düşüklüğü, (b) enerji + FX maliyet dezavantajı. Çelik analizinde her zaman TRY marjı değil USD/ton marjı kullan.

3. **CBAM Analizi — Sayısal Zorunluluk:** CBAM default BF/BOF için €100.55/ton, doğrulanmış ~€40-50/ton. EREGL AB ihracatı ~745K ton (toplam 1.56M × %47.8) → default ile ~€75M/yıl CBAM maliyeti. Doğrulanmış emisyon verisi arbitrajı €67M/yıl tasarruf potansiyeli. Bu rakamı her enerji/emtia analizine dahil et.

4. **Upstream Veri Uyumsuzluğu Escalation:** parse_standardization FY 2025 net kâr 14.1B TRY raporladı; kap_watch + steelradar 511.8M TRY teyit ediyor. Büyük uyumsuzluğu CEO'ya flagle — "veri var" demek yetmez, kaynaklar tutarsızsa escalate et.

5. **Porter'ın En Kritik Gücü Çelikte Tedarikçi Gücüdür (4/5):** Demir cevheri (Vale/Rio oligopol), hurda (volatil fiyat), enerji (dışa bağımlı) — EREGL tümünde fiyat alıcı. Rafineri analizindeki ham petrol bağımlılığı gibi, çelikte hammadde tedarikçi gücü dominant.

6. **Çin Faktörünün İki Yüzü:** Çin baskısı hem iç hem ihracat piyasasını etkiliyor. Ancak AB'nin Çin'e anti-dumping genişlemesi EREGL için fırsat yaratıyor. Temmuz 2026 AB import kısıtlaması (%50 import cut) EREGL lehine potansiyel. Bu iki yönü her çelik analizinde ayrıştır.

7. **Yeşil Dönüşüm Sıralaması:** SSAB (pilot tamamlandı) > ArcelorMittal (büyük CAPEX) > Tata Steel > EREGL (EIA aşamasında, OYAK $3.2B taahhüt). EREGL geride ama taahhütlü. Yeşil çelik analizinde bu listeyi kullan.

8. **Kardemir Finansal Durumu:** Zarar ediyor (FY 2024 net zarar -3.3B TRY; Q1 2025 EBITDA 1.1B TRY ama negatif EBIT). EREGL ile karşılaştırmalı tablo yapılırken "alt benchmark" olarak göster.

9. **HRC Avrupa Fiyatları (Nisan 2026):** Kuzey Avrupa €720/ton, Güney (İtalya) €699/ton. Bu EREGL ihracat marjı hesaplamasında referans fiyat.

10. **Sektör Yaşam Döngüsü — İkili Okuma:** Küresel çelik "olgunluk → geçiş", Türkiye yassı çelik "geç büyüme/erken olgunluk". Aynı şirket iki döngü aşamasında — TUPRS analizinde de görülmüştü. Her enerji/emtia analizinde küresel vs yerel döngü ayrımı yap.

### EREGL Sektör Benchmark Referans Verileri (2025 FY, web-verified)

| Peer | Ticker | EBITDA Marjı | EBITDA/Ton | Net Borç/EBITDA |
|------|--------|--------------|------------|-----------------|
| EREGL | EREGL | ~9-10% | $64 | ~1.9x |
| Kardemir | KRDMD | Negatif | N/A | >5x (zarar) |
| ArcelorMittal | MT | ~10-11% | $111 (Q3 2025) | ~1.2x |
| SSAB | SSAB | 11% | ~$150+ (premium) | ~0.8x |
| Tata Steel | TATASTEEL | ~10-12% | ~$75-85 | ~2.5-3.0x |

### Öğrenme Kaynakları (Bu Görevde Kullanılanlar)
- EREGL FY 2025 Q4: steelradar.com
- EREGL 2025 production: gmk.center/en/news
- SSAB FY 2025: ssab.com annual report
- ArcelorMittal Q3 2025: corporate.arcelormittal.com
- CBAM costs Turkish steel: eurometal.net, fastmarkets.com
- Turkish steel sector 2026: indexbox.io
- China steel restrictions: gmk.center (62 countries, 207 restrictions)
- European HRC prices April 2026: eurometal.net
- Turkey AD duties Chinese steel: steelorbis.com

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

---

## ✅ CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu

### Pozitif Noktalar:
- ✅ **Global peer grubu doğru seçildi:** BIST'te çelik rakibi yok; ArcelorMittal, SSAB, Tata Steel, Nucor ile peer oluşturuldu. TUPRS analizinden öğrenilen kural uygulandı.
- ✅ **EBITDA/ton KPI'ı kullanıldı:** TRY marjı yerine USD/ton ($64/ton vs global medyan ~$100) karşılaştırması yapıldı — sektöre uygun yaklaşım.
- ✅ **CBAM analizi sayısal yapıldı:** Default €100.55/ton, doğrulanmış ~€40-50/ton, EREGL AB ihracatı ~745K ton → ~€75M/yıl maliyet hesaplandı.
- ✅ **Çin faktörü iki yönlü analiz edildi:** Baskı (dumping) + fırsat (AB anti-dumping → EREGL lehine) ayrıştırıldı.
- ✅ **Upstream veri uyumsuzluğu flaglendi:** Net kâr 14.1B vs 511.8M TRY tutarsızlığı CEO'ya eskalasyon olarak işaretlendi.

### Eksikler:

1. **Working capital peer karşılaştırması yok:**
   - EREGL'in stok döngüsü (demir cevheri/kok stoku) sektör kıyaslamasına konmadı.
   - DIO karşılaştırma tablosu (EREGL vs ArcelorMittal vs SSAB) eksik — çelik üreticilerinde stok yönetimi kritik rekabet avantajı/dezavantajıdır.

2. **AB Safeguard Temmuz 2026 etki hesabı eksik:**
   - AB steel safeguard kota kesintisi (-%47) ve +%50 tarife zammının EREGL AB ihracat geliri üzerindeki sayısal etkisi gösterilmedi.
   - "Kota sıkışma riski" ifadesi var ama TRY gelir etkisi tahmin edilmedi.

3. **Quartile sıralaması eksik:**
   - EREGL sektör benchmark tablosunda "EREGL hangi çeyrekte?" sorusu yanıtsız — $64/ton EBITDA global quartile'da sona yakın ama açıkça ifade edilmedi.

4. **SELL analist gerekçesi sektör analizine yansıtılmadı:**
   - consensus_analyst'ın SELL / güçlü SELL tavsiyesi veren analistlerin argümanları sektör rekabet dinamikleriyle ilişkilendirilmedi.

### Bundan Sonra:

- **Çelik şirketleri için çalışma sermayesi peer tablosu ZORUNLU:**
  ```
  | Metrik | EREGL | ArcelorMittal | SSAB | Tata Steel | Sektör Medyanı | EREGL Quartile |
  |--------|-------|---------------|------|------------|----------------|----------------|
  | DIO (gün) | ? | ? | ? | ? | ? | ? |
  | DSO (gün) | ? | ? | ? | ? | ? | ? |
  | DPO (gün) | ? | ? | ? | ? | ? | ? |
  | CCC (gün) | ? | ? | ? | ? | ? | ? |
  ```

- **AB Safeguard etkisi sayısal zorunlu (Temmuz 2026 tarihli acil gündem):**
  - Mevcut AB ihracat hacmi × kota kesinti oranı (-%47) = kaybedilen ton
  - Kaybedilen ton × ortalama ihracat fiyatı (€/ton) = tahmini gelir kaybı TRY
  - Bu hesap her çelik raporu için ZORUNLU kılındı.

- **Quartile metodolojisi:** Her peer benchmark tablosuna EREGL Quartile sütunu ekle — "1. Çeyrek", "2. Çeyrek", "3. Çeyrek", "4. Çeyrek" sınıflandırması her raporun bulgu özetine dahil edilmeli.

- **SELL argümanı → sektör bağlantısı:** Analist SELL gerekçeleri (örn: "maliyet dezavantajı", "AB ihracat riski") her zaman peer benchmarking ile somutlaştırılmalı.

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu
### Eksikler:
- Çıktı tamamlanmamış; hazırlık notları var ama nihai sektör ve peer analizi yok.
- Peer seti seçiminin mantığını yazdın fakat sayısal benchmark ve net sonuç üretmedin.
- AB safeguard, Çin arzı, HRC ve iç pazar mekanizması şirketin rekabet pozisyonuna somut bağlanmadı.
- Peer finansalları ve sektör veri seti için görünür kaynak referansı verilmedi.
### Bundan Sonra:
- Hazırlık mesajı bırakma; her görevde tamamlanmış peer skor kartı üret.
- Peer seti seçimi sonrası metrik bazlı kıyas tablosu zorunlu.
- Sektör şoklarını mutlaka rekabet avantajı/dezavantajı zincirine bağla.
- Her peer rakamını resmi finansal rapor veya doğrulanmış piyasa kaynağına bağla.

## Purge 2026-04-21 23:11 — 7 section (en yeni: 2026-04-16)

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **Sektör "industrial" olarak yanlış belirlendi** — `"sector": "industrial"` — THYAO açıkça havacılık (airline) sektörüdür. Ticker fallback mekanizması başarısız oldu. Kural: finansal veriler olmasa da ticker'dan sektör tespiti yapılabilir; THYAO → havacılık kesin tanım.
- **Peer group tamamen boş** — `"peer_group": []` — Havacılık sektöründe standart peer: Lufthansa, IAG, Wizz Air, flydubai, Emirates (private). Finansal veriler olmadan bile peer listesi ve kalitatif benchmarking üretilebilir.
- **Benchmarks tamamen boş** — `"benchmarks": []` — EBITDAR marjı, CASK, load factor, EV/EBITDAR peer aralıkları sektör raporlarından çekilebilirdi.
- **financial_analysis bağımlılığı nedeniyle TAMAMEN boş çıktı** — "No financial_analysis output — sector_competition cannot score" kararı yanlış. Sektör analizi finansal verilerle zenginleşir ama bağımsız olarak da üretilebilir: Porter's Five Forces, rekabet konumu, sektör dinamikleri, peer narratif analizi.
- **Havacılık sektörüne özgü hiçbir bulgu yok** — RPK/ASK piyasa payı, slot hakları rekabeti, yakıt hedge sektör ortalaması, MRO rekabet durumu — hiçbiri üretilmedi.

### Bundan Sonra:
- **Havacılık sektörü standart peer grubu** — Delta Air Lines (operasyonel benchmark), Lufthansa (Avrupa hub), IAG (küresel network hub), Wizz Air (Doğu Avrupa LCC), flydubai/Air Arabia (Orta Doğu overlap). Her THYAO analizinde bu 5 peer kullan.
- **Sektör tespiti ticker tabanlı olacak, fallback "industrial" OLMAYACAK** — Bilinmeyen sektörde "unknown" yaz, "industrial" yazma. Havacılık tickerları (THYAO, PEGYS, ONUIR) → airline/transport sektörü.
- **financial_analysis yoksa "temel Porter + peer narratif" üret** — financial_analysis gelmeden: (1) Porter'ın 5 kuvveti kalitatif, (2) Sektör dinamikleri (konsolidasyon, fiyat rekabeti), (3) Peer listesi + kamuya açık metrikler. "Cannot score" değil, "partial — financial_analysis eksik" de.
- **Havacılık sektörü zorunlu 4 analiz** — (1) Slot/rota network rekabeti, (2) Yakıt maliyeti hedge sektör ortalaması, (3) Capacity discipline (sektör ASK büyümesi vs THYAO), (4) Kargo penetrasyon oranı peer karşılaştırması.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **Sektör "industrial" — 3. kez aynı hata (Delta + KCHOL + Standard)** — THYAO → aviation; bu hata artık sistematik. Ticker tabanlı sektör tespiti hiç uygulanmadı.
- **peer_group: [] — 3. kez boş** — Standart peer listesi (Lufthansa, IAG, Wizz, Delta, flydubai) daha önce memory'ye yazıldı; uygulanmadı.
- **benchmarks: sadece THYAO değerleri** — Peer_count: 0 olduğu için tüm benchmark değerleri şirketin kendi değeri; quartile distribution anlamsız.
- **financial_analysis bağımlılığı nedeniyle "partial" bile üretilmedi** — Kural: "financial_analysis yoksa temel Porter + peer narratif üret." Hiç üretilmedi.

### Bundan Sonra:
- **Ticket-based sector mapping kalıcı hafızada** — THYAO/PEGYS/ONUIR → aviation; TUPRS/BIMAS/EREGL → mevcut kategoriler. Her analizde bu mapping önce kontrol edilecek.
- **financial_analysis olmasa bile 3 minimum üretim zorunlu:** (1) Porter 5 kuvvet kalitatif, (2) Standart peer listesi + kamuya açık benchmarklar, (3) Havacılık sektörü dinamikleri. "Cannot score" = geçersiz çıktı.
- **Standard raporda peer benchmark zorunlu** — EBITDAR marjı peer aralığı (IATA sektör ortalaması: %16.1), CASK benchmark (sektör: US¢9-12), Load Factor benchmark (global: %83.6) — bunlar finansal veri olmadan bile üretilebilir.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **Çıktı kesildi — YKBNK bankacılık bölümü sonrası segment analizleri görünmüyor** — Porter analizi YKBNK için tamamlandı; TUPRS, FROTO, ARCLK, EREGL, TCELL segmentleri çıktıda yer almıyor. Holding analizinde 6 segmentin tamamı için Porter yapılması zorunlu.
- **Peer quartile dağılım tabloları eksik** — YKBNK bankacılık bölümü için NIM/NPL/CET1 peer benchmarkları genel anlatıyla verildi; Max/Q3/Median/Q1/Min tablosu yok. Bu formatsızlık tüm segment analizlerinde devam etti.
- **Fitch outlook indiriminin YKBNK NIM senaryosu etkisi kesildi** — BDDK KAPL açıklaması bölümü "BDDK KAP Açıkl" ile kesildi; tamamlanmadı. Skor kartına etki açıklanamadı.
- **Kaynak URL/tarih peer benchmark değerlerinde eksik** — "TCMB 37% politika faizi", "AKBNK NIM %4.1, GARAN %4.3" gibi rakamlar kaynaksız verildi.

### Bundan Sonra:
- **Holding analizinde her segmente ayrı Porter tablosu** — 6 segment × 5 güç = 30 satırlık minimum. Truncation riski varsa her segment için özet skor + tek paragraf yorum; tam Porter sonra appendix'e.
- **Quartile dağılım tablosu holding raporlarında da zorunlu** — Bankacılık: NIM/NPL/CET1 peer quartile. Rafineri: crack spread/EBITDA marjı quartile. Bu tablolar olmadan "YKBNK sektör ortalamasında" iddiası kanıtsız.
- **Kaynak etiketleme standart** — Her peer rakamı: [Kaynak: kurum adı + tarih]. "AKBNK NIM %4.1 [AKBNK FY2025 earnings, Mart 2026]" formatı.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **Sektör "industrial" — 3. THYAO hatası, sistematik arıza** — THYAO → aviation tanımı ticker'dan triviyal. 3 rapordur düzeltilmedi. financial_analysis bağımlılığı gerekçe kabul edilemez; sektör tespiti bağımsızdan yapılır.
- **peer_group: [] — 3. kez boş** — Standart havacılık peer listesi (Lufthansa, IAG, Wizz Air, Delta, flydubai) memory'ye iki kez yazıldı; uygulanmadı.
- **"Cannot score — financial_analysis missing" = geçersiz karar** — Kural: financial_analysis yoksa temel Porter + peer narratif üret. Sıfır çıktı kabul edilemez.
- **Havacılık sektörüne özgü analiz yok** — RPK/ASK piyasa payı, slot hakkı rekabeti, yakıt hedge sektör ortalaması, MRO rekabet — hiçbiri üretilmedi.

### Bundan Sonra:
- **Sektör tespiti hardcoded list'ten (3. ve son direktif)** — THYAO/PEGYS/ONUIR → aviation. Bu mapping bir daha atlanmayacak.
- **financial_analysis yoksa minimum 3 çıktı zorunlu** — (1) Porter 5 kuvvet kalitatif, (2) Standart peer listesi + kamuya açık benchmarklar, (3) Havacılık sektörü dinamikleri. "Cannot score" = geçersiz; "partial — financial_analysis pending" de.
- **Havacılık peer zorunlu benchmarklar (finansal veri gerekmez)** — EBITDAR marjı sektör ortalaması (%16.1 IATA), CASK benchmark (US¢9-12), Load Factor global (%83.6). Kamuya açık sektör verisi; üretilmemesi kural ihlali.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **Sektör "industrial" — 3. THYAO analizi, artık tolerans sıfır** — THYAO havacılık sektörü. "industrial" etiketi nedeniyle peer_group boş döndü, tüm karşılaştırmalı analiz üretilmedi.
- **peer_group[] boş — 3. THYAO analizi** — Lufthansa, IAG, Wizz Air, flydubai, Delta peer listesi 3 analizdir uygulanmadı. Bu peer listesi THYAO için sabit; upstream etiket ne olursa olsun overwrite edilmeli.
- **Kısmi çıktı bile üretilmedi** — financial_analysis bağımlılığı kırık olduğunda bile Porter 5 Güç + sektör anlatısı üretilebilir. Kural: bağımlılık yoksa minimum Porter + peer narrative üret, null döndürme.
- **EBITDAR marjı peer karşılaştırması yapılmadı** — IATA sektör EBITDAR ortalama ~%16.1; THYAO FY2024 EBITDAR marjı %23.2 — bu karşılaştırma yapılmadı.

### Bundan Sonra:
- **THYAO sektör etiketini override et (P0 — 3. direktif, artık hard rule)** — upstream'den "industrial" gelirse sector_competition bunu reddeder ve "aviation" olarak overwrite eder. Bu override kodu seviyesinde gerekiyor; bir daha "industrial fallback" görmek istemiyorum.
- **THYAO peer group sabit listesi:**
  - Global: Lufthansa (LHA), IAG, Delta (DAL)
  - Bölgesel/LCC: Wizz Air, flydubai, Air Arabia
  Bu liste upstream veriden bağımsız; her THYAO analizinde otomatik kullanılır.
- **financial_analysis bağımlılığı kırıksa minimum çıktı zorunlu:**
  1. Porter 5 Güç analizi (sektör bilgisinden)
  2. Peer narrative: THYAO vs peer metrik karşılaştırma anlatısı
  3. EBITDAR marjı / CASK / Load Factor peer benchmark tablosu
  Bunlar için upstream finansal veri gerekmez; üretilmesi zorunlu.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **Sektör "industrial" — 4. THYAO analizi, tolerans sıfır aşıldı** — THYAO = havacılık. "industrial" fallback 4 analizdir düzeltilmedi. Bu artık prompt seviyesinde değil, kod seviyesinde sabit mapping gerektiriyor.
- **peer_group: [] — 4. THYAO analizi** — Lufthansa/IAG/Wizz Air/flydubai/Delta peer listesi 4 analizdir uygulanmadı. Bu liste upstream bağımsız; her THYAO analizinde otomatik kullanılacak.
- **Porter 5 Güç bile üretilmedi** — financial_analysis bağımlılığı kırık olduğunda minimum çıktı direktifi 3 kez verilmişti; bu turda da hiçbir Porter analizi üretilmedi. "Cannot score" = geçersiz çıktı; "partial — upstream eksik" formatı zorunlu.
- **EBITDAR marjı peer karşılaştırması yok** — THYAO FY2025 EBITDAR marjı %23.2 vs IATA sektör ortalaması %16.1; bu 7pp fark sektör konumlaması için kritik — hesaplandı, raporlanmadı.
- **THYAO havacılık sektörüne özgü 4 analiz bölümü yok** — (1) Slot/rota network rekabeti, (2) Yakıt hedge sektör ortalaması, (3) Capacity discipline (ASK büyümesi), (4) Kargo penetrasyon oranı — bunlar finansal veri olmadan sektör bilgisinden üretilebilir.

### Bundan Sonra:
- **Sektör mapping sabit (4. direktif, kod seviyesi şart):** THYAO/PEGYS/ONUIR → aviation; TUPRS → petroleum; EREGL → steel. Upstream etiket ne olursa olsun overwrite edilecek. "industrial" fallback YASAK.
- **financial_analysis bağımlılığı = kısmi çıktı tetikleyicisi, bloker değil** — Finansal veri yoksa: (1) Porter 5 Güç kalitatif, (2) Standart peer listesi + kamuya açık benchmarklar (IATA, Eurocontrol), (3) THYAO operasyonel KPI narrative. "Cannot score" → otomatik FAIL; "partial" → acceptable.
- **EBITDAR peer benchmark tablosu her THYAO'da zorunlu** — IATA sektör: %16.1 | THYAO: %23.2 | Lufthansa FY2024: ~%14.8 | IAG FY2024: ~%19.2. Bu tablo finansal tablolar olmadan da üretilebilir; sektör raporlarından veya IR sayfalarından çekilecek.

---

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **Quartile distribution tablosu eksik** — Her benchmarking metriği için "Max / Q3 / Median / Q1 / Min + EREGL pozisyonu" format zorunlu; sadece ortalama veya peer tablosu yeterli değil.
- **Peer rakamları için kaynak URL/rapor tarihi eksik** — ArcelorMittal, POSCO, Nippon Steel benchmark değerleri kaynaksız yazıldı. Her peer'ın EV/EBITDA ve tCO2/ton değeri için doğrulama bağlantısı gerekli.
- **CBAM kümülatif maliyet tablosu sayısal hesaplanmadı** — AB ihracat payı kesin % bilinmediğinden hesap yapılamadı; ancak "kesin % bilinmiyor → üst sınır × genel AB çelik ihracat payı (%X)" proxy ile sayısal aralık verilmeliydi.
- **SELL analist gerekçesi sektör analizi ile ilişkilendirilmedi** — 0 SELL analist durumu risk olarak değerlendirilmedi; CBAM + EPDK + Çin dumpinge karşın neden SELL yok? Bu asimetrik risk sinyali sektör analizinden desteklenmedi.
- **Benchmarking scorecard çıktısı tam format değil** — Porter'ın Five Forces sonrası zorunlu benchmarking scorecard (6+ metrik × 5+ peer, quartile pozisyon) eksik kaldı.

### Bundan Sonra:
- **Çelik sektörü peer grubu standart 5 oyuncu** — ArcelorMittal (global), POSCO, Nippon Steel, Nucor (EAF benchmark), thyssenkrupp. Her analizde aynı 5 peer kullan; tutarlılık şart.
- **CBAM hesabı için proxy yaklaşım** — AB ihracat payı tam bilinmiyorsa sektör ortalaması (%15-20 Türk çelik ihracatının AB'ye gittiği tahmini) ile üst sınır hesabı yap; "bilinmiyor" deme.
- **Quartile tablosu zorunlu çıktı formatı** — Benchmarking bölümünde her metrik için mutlaka Max/Q3/Median/Q1/Min tablosu ve EREGL'in bu dağılımdaki yeri.
