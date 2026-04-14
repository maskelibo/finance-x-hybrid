# KAP Watch Agent — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | KAP Watch Agent |
| Uzmanlık | KAP Bildirimleri İzleme |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 2 |
| Gerçek Görev Sayısı | 2 (KCHOL, SISE 12-month monitoring) |
| Ortalama Öğrenme Puanı | 88.5/100 |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Bildirim tipleri | 5 | KCHOL vaka çalışmasından 6 kategori öğrenildi |
| Önem değerlendirmesi | 6 | 3-tier materiality framework uygulandı |
| Zamansal örüntüler | 4 | Q4-Q1 clustering pattern tespit edildi |
| Şirket davranışları | 3 | Portfolio optimization sinyalleri tanındı |
| Etki analizi | 2 | Market reaction tracking başlangıç seviyesi |

---

## Birikimli Bilgi Bankası

### Materiality Hierarchy

- **HIGH:** Finansal duran varlık satış/alım >5B TRY, temettü dağıtımı, M&A işlemleri, genel kurul kararları
- **MEDIUM:** Kredi anlaşmaları, çeyreklik finansal tablolar, bağlı ortaklık sermaye artırımları
- **LOW:** Kurumsal yönetim form güncellemeleri, YK üye değişiklikleri, rutin uyum raporları
- **Not:** Earnings surprise büyüklüğüne göre MEDIUM → HIGH yükselebilir (örn: +488% surprise)

### KAP Bildirim Kategorileri

- Finansal Duran Varlık Satışı / Edinimi
- Genel Kurul İşlemleri
- Kar Payı Dağıtımı
- Kredi Sözleşmesi
- Bağlı Ortaklık Sermaye Artırımı
- Konsolide Finansal Tablo Açıklaması

### Güvenilir Kaynaklar

- **Birincil:** [KAP Resmi Portal](https://kap.org.tr/tr/bildirim-sorgu) — tek yetkili kaynak
- **Haber doğrulama:** Bloomberg HT, Investing.com, CNBCE
- **Analiz:** GCM Yatırım, Bulls Yatırım, Fintables

---

## Öğrenilen Dersler

**Multi-stage transaction:** Büyük işlemler 3–6 aylık süreçte birden fazla KAP bildirimi üretir (örn: Tek-Art Marina: açıklama → sermaye artırımı → tamamlanma).

**Earnings surprise:** Konsolide finansal tablo açıklamalarını otomatik MEDIUM sayma; surprise magnitude'e göre HIGH'a çıkabilir.

**Asset rotation sinyali:** Aynı çeyrekte alım + satım bildirimleri birlikte analiz edilmeli — portfolio optimization stratejisini gösterir.

**Debt issuance 2 aşamalı:** Credit rating duyurusu → final pricing & terms (2 ayrı bildirim).

**Manufacturing restructuring chain:** Closure + restart ayrı bildirimler üretir; aynı projenin devamı olarak işaretle.

**Temporal clustering:** Büyük holdinglerin stratejik işlemleri Q4-Q1'de yoğunlaşır.

---

## Operasyonel Kurallar

1. **Full pass-through zorunlu:** Tespit ettiğin kaç disclosure varsa hepsi downstream'e geçer — sayı kırpma yok.

2. **Bildirim ID zorunlu:** Her disclosure için KAP ID ve URL bulunmalı. ID olmayan disclosure = incomplete.
   ```
   disclosure_id: "1599018"
   url: "https://www.kap.org.tr/tr/Bildirim/1599018"
   ```

3. **Discrepancy resolution:** Context vs. KAP çelişkisi varsa KAP'ta comprehensive search yap (24-month window), tüm eşleşen bildirimleri listele, bulamazsan "not found in KAP" olarak flag'le.

4. **Strategic initiative tracking:** Büyük CAPEX projeleri (>12 ay) için 24-month window kullan. Initial announcement + progress updates + completion bildirimleri ayrı ayrı yakala.

5. **Cross-validation:** Major işlemler için 2+ bağımsız kaynak; KAP bildirim numarası varsa mutlaka dahil et.

6. **Tarih belirsizliği:** Kesin tarih bulunamazsa "est." ile işaretle.

---

## KPI Takip Tablosu

| Tarih | Şirket | Sonuç | Puan |
|---|---|---|---|
| 2026-04-10 | KCHOL | 18 bildirim (8 HIGH, 7 MEDIUM) | 90/100 |
| 2026-04-10 | SISE | 16 bildirim (1 CRITICAL, 4 HIGH, 9 MEDIUM) | 88/100 |

---

## CEO Geri Bildirimi — 2026-04-10 — AKBNK Raporu

### Eksikler:
- **Disclosure #3 YARIM KALMIŞ:** Board of Directors disclosure başlamış ama tamamlanmamış
- **Disclosures 4-11 TAMAMEN EKSİK:** Executive summary'de "11 disclosure" demiş ama sadece 3 tanesinin detayı var — 8 disclosure kayıp
- **Material event timeline incomplete:** 12 aylık monitoring window'da sadece 3 event detaylandırılmış — coverage %27, kabul edilemez

### Bundan Sonra:
- "Full pass-through zorunlu" kuralını UYGULA — tespit ettiğin kaç disclosure varsa HEPSİNİ downstream'e geçir
- Executive summary'de X disclosure dersen, HEPSİNİN detayı olmalı — sayı tutarsızlığı YASAK
- Her disclosure için: KAP ID + URL + tarih + kategori + materiality + özet — eksik bırakma
- 12 aylık window'da en az 10-15 material disclosure beklenir (çeyreklik finansallar hariç) — 3 disclosure çok az, araştırmayı derinleştir

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Pozitif Noktalar:
- ✅ 9 disclosure tespit edildi — temettü, board appointments, routine filings — coverage iyi
- ✅ KAP URL ve tarihler her disclosure için var — traceability sağlanmış
- ✅ Materiality assessment doğru — 3 material event, 6 routine filing classification tutarlı

### Eksikler:
- **Bağlı ortaklık işlemleri eksik:** KCHOL holding şirketi — bağlı ortaklıklarının (TUPRS, ARCLK, FROTO, YKBNK, AYGAZ) KAP disclosures'ları da izlenmeli ama izlenmemiş
- **Portfolio rebalancing sinyalleri yüzeysel:** Mart 2026 TUPRS 2.1% stake sale (9.32B TRY) Context Extraction'da bahsedilmiş ama KAP Watch'ta yok — bu holding için material event
- **Strategic initiative tracking yok:** KCHOL annual report'ta 6 strategic initiative (renewable energy, digital transformation, portfolio rebalancing) bahsedilmiş — bunların KAP disclosures'ları takip edilmemiş

### Bundan Sonra:
- Holding şirketlerinde ANA ŞİRKET + BAĞLI ORTAKLIKLAR (major subsidiaries) KAP disclosures'ları birlikte izle — KCHOL için TUPRS/ARCLK/FROTO/YKBNK major events holding'i etkiler
- Portfolio rebalancing disclosures (bağlı ortaklık pay alım/satım) ZORUNLU izle — "Finansal Duran Varlık Satış/Alımı" kategorisi
- Strategic initiatives için 24-month window KAP search yap — CAPEX announcements, M&A, JV agreements
- Holding-specific materiality: Bağlı ortaklık işlemleri (>%5 ownership change) her zaman MATERIAL

---

## [2026-04-11] Gece Eğitimi #2 — KAP Material Event Classification 2026

**Konu:** KAP platform 2026 status, material event definition, disclosure requirements  
**Sorgular:** 1 web araştırma sorgusu kullanıldı  
**Öğrenme Puanı:** 88/100

**Öğrenilen Dersler:**

1. **KAP Platform 2026 Status:**
   - Merkezi Kayıt Kuruluşu A.Ş. tarafından 7/24 operated
   - Electronically signed notifications için resmi platform
   - CMB (Capital Markets Board) ve Borsa Istanbul regulations uyarınca zorunlu disclosures
   - XBRL-based public disclosure system aktif
   - Ders: KAP tek yetkili kaynak — haber siteleri doğrulama için kullanılabilir ama KAP ID zorunlu

2. **Material Event Tanımı (CMB 2026):**
   - **Insider information:** Capital markets instrument değerini veya investor decisions'ı etkileyebilecek material information + henüz public'e açıklanmamış
   - **Continuous information:** CMB Communiqué on Principles Regarding Disclosure of Material Events uyarınca açıklanması gereken diğer tüm bilgi
   - Material event = gives rise to insider information + continuous information
   - Ders: Materiality assessment yaparken "insider information oluşturur mu?" sorusu kritik

3. **Disclosure Timing Requirement:**
   - Material events **immediately upon occurrence** or **upon becoming known** açıklanmalı
   - Değişiklikler de aynı şekilde immediate disclosure gerektirir
   - Electronically signed olarak KAP'a gönderilmeli (CMB Communiqué)
   - Ders: KAP Watch'ın "12-month monitoring window" yeterli ama real-time monitoring için "immediately upon occurrence" requirement'ı bilmek önemli

4. **CMB Regulatory Framework:**
   - **CMB Communiqué on Principles Regarding Disclosure of Material Events:** Ana düzenleme
   - **CMB Communiqué on Electronically Signed Submissions:** KAP submission process
   - Tüm information ve documents KAP'a gönderilmeli
   - Ders: Compliancecheck yaparken bu iki communiqué reference alınmalı

5. **Material Event Coverage Rule Reinforcement:**
   - KAP single source of truth — tüm material events KAP'ta olmalı
   - "Full pass-through" kuralı (Operasyonel Kurallar #1) CMB requirement ile align
   - Strategic initiative KAP'ta yoksa → "not disclosed" değil "confirmed: no KAP disclosure" olarak report edilmeli
   - Ders: CEO feedback'te flaglenen "8 disclosure kayıp" sorunu artık daha net — KAP'tan gelen her bildirim classify edilmeli, eksik bırakılmamalı

**Güncellenen Operasyonel Kural:**

**6. Materiality assessment CMB framework:**
- Insider information test: Bu bilgi capital markets instrument value'sını etkiler mi?
- Investor decision test: Bu bilgi investor decisions'ı etkiler mi?
- Public disclosure status: Henüz public'e açıklanmamış mı?
- Üç soruya da EVET → Material event (HIGH materiality)

**CEO Feedback'lerden Alınan Aksiyonlar:**
- ✅ KAP material event definition artık CMB regulatory framework ile backed
- ✅ "Immediately upon occurrence" timing requirement artık biliniyor
- ✅ Full pass-through kuralı CMB communiqué ile align (compliance artık doğrulanabilir)

**Eksik kalan:**
- Holding subsidiary cross-check methodology hâlâ geliştirilmeli (KCHOL feedback'te istenmişti)
- Impact quantification için standardized template yok (bazı events için eksik kalmıştı)

---

*Bu dosya her gece 05:30–06:00 arasında güncellenir.*
*Dosya sahibi: KAP Watch Agent | Denetleyen: META (CEO)*

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Pozitif Noktalar:
- ✅ 10 KAP disclosure tespit edilmiş — comprehensive 12-month monitoring
- ✅ Materiality classification yapılmış — HIGH/MEDIUM/LOW framework uygulanmış
- ✅ Multi-stage transaction tracking iyi — Tüpraş sale (announcement → settlement), Göcek marina (announcement → completion)

### Eksikler:
- **Impact quantification bazı events için yüzeysel:** Tüpraş sale 9.32B TRY impact calculated ama Koç Finansman sale ($137M) için TRY equivalent ve holding-level impact eksik
- **Subsidiary KAP cross-check eksik:** KCHOL bağlı ortaklıkları (TUPRS, FROTO, ARCLK, YKBNK) KAP bildirimlerini cross-check etmedin — örn: TUPRS'nin kendi KAP'ı ile KCHOL'un TUPRS'ye ilişkin açıklamaları karşılaştırılmamış

### Bundan Sonra:
- **Impact quantification her event için:** TRY impact, % of equity, % of annual EBITDA, % of market cap — 4 metrik her material event için hesaplanmalı
- **Holding subsidiaries KAP cross-check ZORUNLU:** Her major subsidiary (TUPRS, FROTO, ARCLK, YKBNK, TOASO) için son 90 gün KAP bildirimlerini kontrol et — parent company açıklamaları ile subsidiary açıklamaları tutarlı mı?
- **Event impact timeline:** Forward-looking impact period ekle — örn: "Tüpraş sale impact: Q1 2026 cash inflow, Q2 2026 onward recurring EBITDA reduction"

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL Raporu

### Pozitif Noktalar ✅:
- **4 Tier 1 material events tespit edilmiş:** 5G spectrum auction, FY2025 results, dividend decision, 5G commercial launch — coverage iyi
- **KAP ID ve tarihler var:** Traceability sağlanmış

### Eksikler ⚠️:
- **Tier 3 disclosures TRUNCATED:** Routine operational disclosures başlamış ama kesilmiş — full 12-month inventory tamamlanmamış
- **5G rollout progress disclosures eksik:** Nisan 2026'da 5G lansman oldu ama rollout progress KAP disclosures (coverage milestones, city expansions, CAPEX updates) takip edilmemiş
- **Subsidiary disclosures eksik:** Superonline (fiber expansion), Lifecell (Ukraine operations), Paycell (fintech growth) KAP bildirimlerikontrol edilmemiş — telecom holding için subsidiaries material
- **BTK regulatory disclosures eksik:** Spectrum license, interconnection rate changes, regulatory compliance KAP bildirimleri araştırılmamış
- **Impact quantification yüzeysel:** 5G spectrum $1.224B demiş ama TRY equivalent ve annual amortization impact (TRY 2.34B/year) hesaplanmış mı?

### Bundan Sonra:
- **Telekomünikasyon şirketleri için KAP disclosure kategorileri genişletilmeli:**
  - 5G rollout: Coverage expansion announcements, city launches, CAPEX updates
  - Spectrum: License renewals, spectrum fee payments, auction participations
  - Regulatory: BTK compliance, interconnection agreements, number portability stats
  - Subsidiaries: Superonline fiber expansion, Lifecell Ukraine war impact, Paycell transaction volume
- **Impact quantification her event için ZORUNLU:**
  - TRY impact (FX conversion if needed)
  - % of equity, % of annual EBITDA, % of market cap
  - Forward impact: One-time vs recurring, timeline
  - Example: 5G spectrum $1.224B = TRY 39.8B (@ 32.5 TRY/USD) = 28% of equity, amortization TRY 2.34B/year (17 years) = -200bps EBITDA margin impact
- **Subsidiary KAP cross-check:** Superonline, Lifecell, Paycell major events (>TRY 500M impact) TCELL konsolide finansallarını etkiler — mutlaka izle
- **Full 12-month inventory:** Tier 1 + Tier 2 + Tier 3 — truncation olmadan HEPSİ downstream'e geçmeli

---

*Dosya sahibi: KAP Watch Agent | Denetleyen: CEO*

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **Monitoring window yanlış:** CEO mandate'de "son 30 gün" istendi, ama kap_watch 12 aylık inventory çıkardı. Fazla kapsama teknik olarak iyi ama raporun odağını dağıtıyor; event_classification ve event_impact_mapper downstream agentlar 30 gün odaklı çalışması gerekirken 12 aylık ham veriyle karıştı.
- **30 gün kritik olay özeti ayrı sunulmadı:** 12 aylık tüm bildirimler bir arada listelendi. Son 30 günün materyel olayları ayrı bir "YÜRÜRLÜKTE — ACIL" bölümüyle öne çıkarılmadı.
- **Hurmuz krizi KAP etkisi izlenmedi:** Nisan 2026 Hurmuz krizi TUPRS için en kritik makro olay. Bu olayın KAP'ta TUPRS tarafından bildirim yapılıp yapılmadığı (özel durum açıklaması, risk faktörü güncellemesi) kontrol edilmedi.

### Bundan Sonra:
- **Çift bölüm yapısı ZORUNLU:**
  - Bölüm A: Son 30 gün materyel olaylar (mandate'in talep ettiği kapsam) — öncelik HIGH/CRITICAL
  - Bölüm B: Son 12 ay geçmişi — arşiv/bağlam amaçlı
  - Downstream agentlar Bölüm A'yı birincil input olarak kullanacak.
- **Makro olayların KAP yansıması kontrolü:** Büyük sektörel/jeopolitik gelişme (Hurmuz krizi, TCMB acil faiz artışı, OPEC+ kararı) sonrasında şirketin KAP'ta "özel durum açıklaması" yapıp yapmadığını tara. Sessizlik de bir bulgudur.
- **Forward event takvimi:** Her 30 günlük inventory'e beklenen gelecek bildirimleri (financial statement deadlines, AGM, tahvil ödemeleri) ekle.

---

## ⚠️ CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu

### Pozitif Noktalar:
- ✅ **KAP bildirimleri tespit edildi:** 5 olay için KAP ID'leri ve tarihler verildi.
- ✅ **Ermaden altın madeni tespiti:** 100% EREGL bağlı iştiraki olarak Possible Resource statüsü not edildi.
- ✅ **Temettü bildirimi doğru sınıflandırıldı:** 3,850M TRY temettü detayı ve ex-date (18 Nisan) verildi.

### Eksikler:

1. **Borçlanma bildirimi (1257686) tutarı bilinmiyor:**
   - KAP bildirimi 1257686 tespit edildi ama borçlanma tutarı ("bakiye borçlanma limitinden kullanılabilecek") proxy tahminle bırakıldı. Bu önemli eksik — KAP metninden gerçek tutar çekilmeye çalışılmalıydı.

2. **EPDK enerji tarife kararı (4 Nisan 2026) KAP izlemesine dahil edilmedi:**
   - EPDK +18.61% gaz tarifesi EREGL için materyel makro olaydı. TUPRS raporunda öğrenilen kural: EPDK/BOTAŞ kararları "macro_event" kategorisinde sınıflandırılmalı.

3. **AB Safeguard (1 Temmuz 2026) forward event takviminde yok:**
   - Forward event listesine AB steel safeguard kota değişikliği (1 Temmuz 2026, kesin tarih) eklenmeli.

4. **OYAK sahiplik değişikliği izlenmedi:**
   - OYAK'ın EREGL pay oranı değişikliği (varsa) son 12 ayda izlenmedi.

### Bundan Sonra:

- **Çelik/emtia şirketleri için KAP + makro olay kategorileri:**
  - EPDK/BOTAŞ tarife kararları → "macro_regulatory_event" kategorisi
  - AB Safeguard, CBAM düzenleme değişiklikleri → "trade_regulatory_event" kategorisi
  - Demir cevheri/kok kömürü fiyat şokları → "commodity_market_event" kategorisi
  - Bu kategoriler event_classification'a iletilmeli

- **Borçlanma bildirimi protokolü:** KAP bildirimi "tahvil ihracı/kredi kullanımı" içeriyorsa tutar KAP metninin tam okunmasıyla tespit edilmeli. Proxy tahmin kabul edilemez — escalation ile KAP PDF tam metin çekilmeli.

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu
### Eksikler:
- Görev son 30 günü isterken 12 aylık disclosure inventory ürettin; scope drift var.
- Bazı girdilerde gerçek KAP bildirimi yerine haber sitesi veya genel KAP ana sayfası kullanıldı.
- AB safeguard için EREGL'in resmi KAP açıklaması var mı sorusuna net cevap verilmedi.
- Birkaç disclosure satırında gerçek bildirim numarası ve kesin URL eksik veya placeholder kaldı.
### Bundan Sonra:
- İzleme penceresini mandate'e sadık tut; eski olayları yalnız ayrı arşiv bölümünde ver.
- Her olay için gerçek KAP numarası ve doğrudan link zorunlu.
- "Resmi KAP var mı?" sorusunu açık `var/yok/bulunamadı` formatında cevapla.
- Haber kaynaklarını KAP yerine geçirme; KAP yoksa bunu eksik veri olarak işaretle.
