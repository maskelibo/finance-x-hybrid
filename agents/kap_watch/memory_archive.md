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

## Purge 2026-04-21 23:11 — 13 section (en yeni: 2026-04-16)

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **119 disclosure hacim iyi ✓ — ancak is_material: null tümü (3. kez)** — Delta ve Standard raporda aynı hata tekrarlandı. CEO değişimi (1590373) SPK mevzuatı uyarınca açıkça materyal; null kabul edilemez.
- **quantitative_impact_try: null tüm disclosures** — Temettü sıfır kararı (1590365): "118.2 bn TRY ödenmedi = nakit koruması" şeklinde etki her zaman üretilebilir.
- **İran krizi KAP sessizliği tespiti yapılmadı** — 10 Orta Doğu rotası askıya; THYAO özel durum açıklaması yaptı mı? Sessizlik de bulgudur kuralı uygulanmadı.
- **Forward event takvimi üretilmedi** — Mayıs 2026 Q1 sonuçları, yeni CEO beyanı, TCMB PPK (22 Nisan) takvimde görünmüyor.
- **Aylık trafik KPI bildirimleri KAP ID ile teyit edilmedi** — Trafik verisi context'ten aktarıldı; KAP bildirim ID'si çekilmedi.

### Bundan Sonra:
- **is_material alanı her disclosure'da zorunlu (3. direktif)** — true / false / uncertain + tek cümle gerekçe. Yönetim değişikliği = true; rutin form = false. Bu alan COO delivery check'e eklendi.
- **Temettü/kar payı kararında quantitative_impact zorunlu** — Sıfır temettü bile hesaplanabilir: "X mn TRY ödenmedi = nakit koruması." Null bırakma yasak.
- **THYAO KAP tarama 5 zorunlu kategori (3. kez yazılıyor — uygulanacak):**
  1. Aylık trafik KPI bildirimleri (ID + URL)
  2. CEO/YK değişikliği sonrası özel durum açıklaması
  3. Rota askıya alma/operasyonel değişiklik bildirimleri
  4. İran sessizliği tespiti (bildiri yoksa "sessizlik" kaydı)
  5. Yeni CEO'nun ilk stratejik beyanı takibi

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **119 disclosure listelendi ✓ — hacim iyi** — Full inventory mevcut; bu pozitif.
- **is_material: null tüm 119 disclosure için** — Aynı THYAO delta hatası tekrarlandı. CEO değişimi (1590373) açıkça SPK mevzuatı uyarınca materyal; null kabul edilemez.
- **quantitative_impact_try: null tüm disclosures için** — Temettü sıfır kararı (1590365): "118.2 bn TRY ödenmedi = nakit koruması" şeklinde etki yazılabilirdi.
- **İran krizi KAP sessizliği tespiti yapılmadı** — "10 Orta Doğu rotası askıya" konusunda THYAO özel durum açıklaması yaptı mı? Bu kontrol yapılmadı.
- **Forward event takvimi üretilmedi** — Mayıs 2026 Q1 sonuçları, yeni CEO ilk beyanı, TCMB PPK (22 Nisan) takvimde yok.
- **Aylık trafik KPI bildirimleri KAP ID ile teyit edilmedi** — Mart 2026 trafik verisi (pax +%16) context'ten aktarıldı, KAP bildirim ID'si çekilmedi.

### Bundan Sonra:
- **is_material alanı her zaman doldurulacak** — Bu direktif delta'da da verildi; standard raporda da uygulanmadı. Yönetim değişikliği = true, rutin form = false, bilinmiyorsa = uncertain. 3 seçenekten biri zorunlu.
- **Temettü kararlarında quantitative_impact zorunlu** — "X mn TRY temettü ödenmedi / korundu" formatı her zaman üretilebilir; null bırakma yasak.
- **THYAO zorunlu KAP tarama kategorileri (3. kez yazılıyor):**
  1. Aylık trafik KPI bildirimleri (ID + URL)
  2. CEO/YK değişikliği sonrası özel durum açıklaması
  3. Rota askıya alma / operasyonel değişiklik bildirimleri
  4. İran/Orta Doğu operasyonu hakkında sessizlik tespiti
  5. Yeni CEO'nun ilk stratejik beyanı takibi

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **KAP 1383079 (13 Mart 2026) detayları hâlâ çözümsüz** — "Orta materyallik" etiketiyle downstream'e geçildi. KAP 1383079 bildirim metninin WebFetch ile okunması (kap.org.tr/tr/Bildirim/1383079) yapılmadı; içerik bilinmeden materyallik skoru doğru değil.
- **Subsidiary KAP cross-check (YKBNK, TUPRS, FROTO) delta penceresi için yapılmadı** — KCHOL holdingi için major subsidiary KAP taraması zorunlu; delta window (14-16 Nisan) için YKBNK ve TUPRS'ın özel durum açıklaması var mı kontrolü eksik.
- **Forward event takvimi format olarak ayrı bölümde sunulmadı** — 22 Nisan PPK ve 29 Nisan YKBNK Q1 farklı agent çıktılarında dağılmış; kap_watch çıktısında ayrı "Forward Takvim" bölümü olarak sunulmalıydı.
- **Impact quantification KAP 1383079 için sıfır** — Materyallik "ORTA" ama TRY etki, % equity, % EBITDA hesabı yapılamadı. Kural: impact bilinmiyorsa sektör proxy kullan ve `[conf: LOW]` etiketle.

### Bundan Sonra:
- **KAP bildirim metni WebFetch ile oku** — Bildirim ID'si var ama içerik bilinmiyorsa kap.org.tr/tr/Bildirim/[ID] sayfasından doğrudan oku. Haber kaynağına güvenme; KAP metnini oku.
- **KCHOL holding = 6 subsidiary + ana şirket taraması** — YKBNK, TUPRS, FROTO, ARCLK, EREGL, TCELL için KAP delta penceresi bildirimleri ayrıca kontrol edilecek. Sessizlik da bulgu.
- **Forward takvim zorunlu ayrı bölüm** — "Beklenen Kritik Olaylar" başlığı altında: Tarih | Olay | Materiality | İlgili Segment | Beklenen Etki. 22 Nisan PPK + 29 Nisan YKBNK Q1 bu formatta.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **119 bildirim çekildi ✓ — hacim iyi** — KAP kapsamı bu turda güçlüydü; 119 bildirim tarih/ID ile listelenmiş.
- **is_material null tüm bildirimlerde — 3. THYAO analizi** — Materyallik skoru hiçbir bildirim için üretilmedi. Kural net: bildirim ID'si var + içerik biliniyorsa materyallik ZORUNLU.
- **quantitative_impact null tüm bildirimlerde** — Her bildirim için: TRY etkisi, hisse başı etki, % EBITDA — bunlar üretilmedi.
- **Forward takvim eksik** — Q1 2025 sonuçları (Mayıs), TCMB PPK (22 Nisan), aylık trafik bildirimi — bunlar forward calendar'a eklenmedi.
- **İran/Orta Doğu sessizlik tespiti yapılmadı** — Kural: İran rota askıya alma konusunda bildirim yoksa bunu "sessizlik tespiti" olarak özellikle not et. Bu bilgi event_classification için önemli.
- **CEO değişimi post-disclosure takibi yok** — Ahmet Olmüster atanması (KAP bildirimi) sonrası YK açıklamaları, strateji beyanı takibi yapılmadı.

### Bundan Sonra:
- **is_material = her bildirim için zorunlu (null = output incomplete)** — İçerik okundu ama materyallik yok → tamamlanmamış çıktı. Materyallik skalası: HIGH (>%5 EBITDA etkisi potansiyeli) / MEDIUM (%1-5) / LOW (<1%). İçerik bilinmiyorsa: "MATERYALLIK: BELİRSİZ — içerik okunmadı" etiketi.
- **quantitative_impact şablonu (her materyel bildirim için):**
  ```
  - TRY etkisi: [hesaplama veya "conf: LOW, proxy"]
  - % EBITDA: [tahmini etki yüzdesi]
  - Hisse başı etki: [TRY/hisse tahmini]
  ```
- **THYAO forward takvim zorunlu 5 kategori:** (1) Aylık trafik KPI bildirimi, (2) Q1/Q2 finansal sonuçlar, (3) TCMB PPK tarihleri, (4) CEO/YK stratejik açıklaması, (5) İran/Bölgesel operasyonel bildirim.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **is_material null tüm 119 bildirimde — 4. THYAO, kalıcı bloker** — CEO değişimi (KAP 1590373) SPK mevzuatı uyarınca açıkça materyel; null çıktı sistematik hata. Rutin formlar için "LOW" bile olsa zorunlu.
- **quantitative_impact null tüm bildirimlerde** — Temettü sıfır kararı (KAP 1590365): "118.2 bn TRY nakit koruması" şeklinde etki hesaplanabilirdi. İran/rota bildirimleri için: rota × sefer × TRY bilet = gelir kaybı tahmini [conf: LOW] kabul edilir.
- **İran/Orta Doğu rota krizi KAP sessizliği tespiti yok** — 10 rota askıya → THYAO "özel durum açıklaması" yaptı mı? Yaptıysa KAP ID; yapmadıysa "sessizlik = bulgu" notu. Her iki durum da raporlanmalıydı.
- **Forward event takvimi üretilmedi** — Mayıs 2026 Q1 finansal sonuçları, 22 Nisan TCMB PPK, yeni CEO Ahmet Olmüster'ın ilk stratejik beyanı, aylık trafik bildirimi — hiçbiri ileriye dönük takvimde yok.
- **Aylık trafik KPI bildirimi KAP ID'si teyit edilmedi** — Mart 2026 pax +%16 verisi context'ten alındı; KAP bildirim ID'si ve URL'si verilmedi.

### Bundan Sonra:
- **is_material: Her bildirim için zorunlu, null = FAIL (4. direktif — kesinleşti)** — Materyallik skalası: HIGH (stratejik/yönetim/büyük finansal), MEDIUM (operasyonel/kota/rota), LOW (rutin form). İçerik okunmadan "BELİRSİZ" et; asla null bırakma.
- **Sessizlik tespiti: İran + CEO değişimi sonrası KAP özel durum bildirimi kontrol edilecek** — Bu iki olay için SPK bildirimi beklentisi var; bildirim yoksa bunu açıkça "Sessizlik Tespiti" bölümüne yaz.
- **quantitative_impact şablonu her HIGH/MEDIUM bildirimine zorunlu:**
  ```
  - TRY etkisi: [hesaplama veya "conf: LOW, proxy kullanıldı"]
  - % EBITDA: [tahmini etki yüzdesi]
  - % Piyasa değeri: [tahmini]
  ```
- **Forward takvim = her THYAO çıktısının son bölümü** — Tarih | Olay | Beklenen Materyallik | İlgili Agent. 5 zorunlu kategori dahil edilmeden çıktı tamamlanmış sayılmaz.

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **İsdemir KAP bildirimleri taranmadı** — EREGL'in %94.87 iştiraki İsdemir'in son 90 gün KAP bildirimleri ayrıca kontrol edilmedi. Subsidiary cross-check zorunlu kural.
- **EPDK gaz tarifesi (4 Nisan 2026) için EREGL KAP sessizliği tespit edilmedi** — EPDK kararına karşın EREGL'den "özel durum açıklaması" yapılıp yapılmadığı teyit edilmedi; "sessizlik de bulgudur" kuralı uygulanmadı.
- **Impact quantification eksik** — Açıklanan olayların (Kok Bataryası, AGM, temettü) % of annual EBITDA ve % of market cap etkisi hesaplanmadı. Sadece olay listesi verildi.
- **Forward event takvimi formatsız** — Q1 2026 sonuçları, TCMB PPK, AB TRQ yürürlük tarihleri (1 Temmuz 2026) beklenen gelecek bildirimleri olarak ayrı bölümde listelenmelidir.
- **Borclanma bildirimi taraması yapılmadı** — EREGL'in banka kredisi veya tahvil bildirimi araması eksik; net borç 42,864 mn TRY bileşenleri KAP borclanma bildirimlerinden teyit edilmedi.

### Bundan Sonra:
- **EREGL analizi için zorunlu KAP tarama kategorileri:**
  1. İsdemir KAP ID cross-check (son 90 gün)
  2. Gaz/enerji tarifesi sonrası EREGL özel durum açıklaması ("sessizlik" dahil kayıt et)
  3. Borclanma bildirimleri (FY2025 net borç bileşenleri teyidi)
  4. CAPEX bildirimleri (Kok Bataryası tamamlama bildirimi)
  5. AB Safeguard/CBAM'a ilişkin EREGL yönetim açıklaması
- **Impact quantification standart** — Her olay için minimum: TRY tutar + % EBITDA + % piyasa değeri + one-time vs recurring sınıflandırması.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu
### Eksikler:
- Cikti `Mock completed output for kap_watch.` seviyesinde kaldi; son KAP bildirimleri, duzenleyici aciklamalar, geri alim/temettu/ihale/spektrum ve yonetim beyanlari taranmis gorunmuyor.
- Final rapordaki sayisal ve stratejik tezleri destekleyecek event envanteri downstream'e iletilmedi.
### Bundan Sonra:
- Her raporda son 12 ay KAP envanterini tarih, baslik, konu, olasi etki ve ilgili finansal metrik baglantisiyla ozetle.
- KAP watch output'u olmadan event siniflandirma ve impact mapping'e gecme; kritik bildirim varsa once onu authoritative olay listesine yaz.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu Post-Report Loop
### Eksikler:
- TCELL bundle'inda KAP watch ciktisi mock seviyesinde kaldi; son 12 ay bildirim envanteri, material event ayrimi ve finansal tez baglantisi kurulmadan downstream event zinciri basladi.
- KAP olaylari ile 5G, regule fiyatlama, yatirim harcamasi ve temettu/finansman basliklari arasinda authoritative olay listesi olusmadi.
### Bundan Sonra:
- KAP watch her raporda `tarih + disclosure id + olay tipi + materiality + finansal kanal` tablosu uretecek; mock veya bos ciktida pipeline durdurulacak.
- Routine filing ile material event ayrimi acik yapilacak; downstream event agent'lari yalniz bu onayli olay listesinden beslenecek.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Post-Report Feedback Loop
### Eksikler:
- Gorev acikca son 7 gun taramasi istediginde bu pencere ayri bir kritik olay listesi olarak cikarilmadi.
- KAP envanteri ile beklenen ileri tarihli catalyst takvimi ayni authoritative watchlist'te birlestirilmedi.
### Bundan Sonra:
- KAP watch mandate penceresini ayni adla ayri cikti blokunda verecek; `7 gun`, `30 gun`, `12 ay` artik birbirine karismayacak.
- Her material KAP olayi icin `finansal kanal + sonraki beklenen adim/tarih` birlikte yazilacak; timeline agent'i ham metin degil bu watchlist'i kullanacak.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **KAP ID'lerin çoğu "pending verification"** — Kar payı dağıtım kararı (7 Nisan 2026), hisse geri alım bildirimi, CEO değişikliği dışında gerçek KAP numaraları doğrulanmadı. "Pending" ile output gönderme kuralı ihlal edildi.
- **CEO değişikliği KAP ID 1451483 teyit edildi ✓** — Tek tam doğrulanan bildirim bu oldu. Standart bu olmalı.
- **FILE kısmi bölünmesi (30 Haziran 2025) KAP bildirimi aranmadı** — Bu önemli bir kurumsal olay; KAP'ta EGM kararı + SPK onayı bildirimi mutlaka olmalı; ID tespit edilmedi.
- **Sermaye artırımı (19 Şubat 2026) tam KAP ID eksik** — Bu bildirim perakendecilerde önemli; hisse başına düşen değer değişimi için KAP'tan doğrulanmalı.

### Bundan Sonra:
- **BIMAS perakende için zorunlu KAP tarama kategorileri:**
  1. Mağaza açılım/kapanım bildirimleri (net mağaza sayısı teyidi için)
  2. Temettü bildirimleri (3 taksit takvimi ile birlikte)
  3. Yönetim/CEO değişikliği (interim → kalıcı atama bekleniyor — KAP'ta takip et)
  4. FILE bağlı ortaklık bildirimleri (EGM kararları, sermaye yapısı)
  5. Share buyback program bildirimleri (başlangıç, ilerleme, sonuç)
- **"Pending" yerine "bulunamadı — haber kaynağı kullanıldı [conf: LOW]" formatı** — THYAO dersinden öğrenilmişti; BIMAS'ta da uygulanmalıydı.
- **BIMAS bilinen KAP referansları:** CEO değişikliği: 1451483 | Temettü 2025: 7 Nisan 2026 kararı [ID doğrula] | Sermaye artırımı: 19 Şubat 2026 [ID doğrula] | Geri alım sonucu: ~19 Aralık 2025 [ID doğrula].

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **10-14 Nisan delta penceresi için sıfır resmi KAP bildirimi** — CEO mandatında "sıfır tolerans" direktifi verilmişti. Sonuç: 4 subsidiary için de "[BULUNAMADI]" KAP ID'si. Secondary sources (haber siteleri) kullanıldı; bu kural ihlali.
- **Subsidiary KAP cross-check yapılmadı** — TUPRS, EREGL, ARCLK, FROTO 10-14 Nisan KAP bildirimleri aranmadı. CEO mandatında bunlar P1 görevi olarak verilmişti.
- **TUPRS temettü miktarı çelişkisi çözülmedi** — "14.56 TL veya 10.38 TL (bazı kaynaklara göre)" denildi; KAP'tan doğrulanmadan ikisi birden bırakıldı. Kural: discrepancy çöz, tek doğru değeri ver.
- **KAP ID 1059056 yanlış eşleşme flaglenmedi** — "TUPRS dividend için KAP ID 1059056 bulundu ama 2022 birleşmesine işaret ediyor" denildi; bu anomali CEO'ya eskalasyon gerektirirdi.
- **Impact quantification eksik** — Dividend bildirimi (KAP ID bulunamadı) için TRY impact, % equity, % EBITDA hesabı yapılmadı.
- **Forward event takvimi zayıf** — 17 Nisan TUPRS KAP, 22 Nisan TCMB PPK, 29 Nisan YKBNK Q1 sonuçları bazı yerlerde geçiyor; ama takvim formatında, tarih ve kaynak ile ayrı bölümde sunulmadı.

### Bundan Sonra:
- **kap.org.tr doğrudan arama API kullan** — kap.org.tr/tr/Bildirim/Ara endpoint'i veya kap.org.tr/tr/sirket/[KCHOL]/bildirimler yolu ile tarih filtreli arama. Haber sitesi aramasına güvenme.
- **TUPRS gibi büyük subsidiary için özel tarama** — kap.org.tr/tr/sirket/TUPRS/bildirimler?baslangicTarihi=2026-04-10&bitisTarihi=2026-04-14 formatında direkt URL dene.
- **Çelişkili tutar için KAP metnini oku** — Temettü tutarı 14.56 TL vs 10.38 TL; KAP bildirim metninde kesin değer yazıyor. Metni WebFetch ile oku; tahmin etme.
- **Delta penceresi bildirimi bulunamazsa "sessizlik de bulgudur" yaz** — "10-14 Nisan arasında KCHOL/TUPRS/EREGL/FROTO/ARCLK için KAP'ta materyel ozel durum açıklaması tespit edilmedi" formatında resmi tespiti kaydet.

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Birçok disclosure ID "PENDING KAP VERIFICATION"** — Gerçek KAP numarası olmadan disclosure geçerli sayılmaz. Mart 2026 ve Şubat 2026 trafik raporları için KAP ID bulunamadı; haber sitesi kaynaklarıyla geçiştirildi.
- **2025 Q1/Q2/Q3/FY raporları "[PENDING]"** — Bu raporlar KAP'ta mevcut (investor.turkishairlines.com ve KAP'ta yayımlandı); "PENDING" etiketi yanlış. KAP ID bulunmalıydı.
- **Impact quantification eksik** — Trafik sonuçları ve finansal raporlar için TRY etki, % equity, % EBITDA, % market cap hesabı yapılmadı.
- **Forward event takvimi eksik** — 22 Nisan 2026 TCMB PPK, Mayıs 2026 Q1 sonuçları, 2026 AGM tarihi — bunlar forward takvimde yer almalıydı.
- **CEO/Chairman değişikliği için KAP bildirimi aranmadı** — April 10 değişikliği için KAP özel durum açıklaması olup olmadığı kontrol edilmedi; "sessizlik de bir bulgudur" kuralı uygulanmadı.

### Bundan Sonra:
- **"PENDING KAP VERIFICATION" kabul edilemez** — Ya gerçek KAP ID bul ya da "bulunamadı — haber kaynağı kullanıldı [conf: LOW]" olarak etiketle. PENDING ile output gönderme.
- **Yönetim değişikliği sonrası KAP özel durum açıklaması zorunlu ara** — CEO/Chairman değişikliği 24 saat içinde KAP'a bildirilmesi gerekir (SPK mevzuatı). Bildirim varsa ID çek; yoksa "SPK mevzuatı gereği bildirim bekleniyor — sessizlik riski" yaz.
- **Havacılık için aylık trafik KPI'ları periyodik bildirim** — Yolcu sayısı, doluluk oranı, kargo verisi aylık KAP bildirimi; her ay için ID + URL zorunlu.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **Birçok KAP ID "Gerçek KAP ID bulunamadı" olarak işaretlendi** — SAHOL temettü, KORDS no-dividend, CARFA AGM bildirimleri için gerçek KAP ID eksik.
- **Haber siteleri KAP ID yerine kaynak olarak kullanıldı** — finansopia.com, bigpara.hurriyet.com, infoyatirim.com birincil kaynak gibi sunuldu; bunlar doğrulama kaynağı olabilir, asıl kaynak olamaz.
- **Akçansa satış bildirimi için doğrudan KAP linki bulunamadı** — En material olay (HIGH) için ID eksik; "haber kaynakları" gerekçesi yeterli değil.

### Bundan Sonra:
- **KAP ID bulunamazsa bildirim "UNVERIFIED" etiketiyle işaretlenecek:** "KAP ID bulunamadı" yazılmayacak. Bunun yerine: [UNVERIFIED — haber kaynağından görüldü, KAP'ta teyit edilemedi]. Bu ayrım downstream güvenilirliği için kritik.
- **WebFetch ile KAP doğrulama zorunlu:** kap.org.tr/tr/sirket-bildirimleri/{şirket-kodu} sayfasına WebFetch ile giderek bildirimi bul ve gerçek ID'yi çek. Haber sitesinden ID kopyalama YASAK.
- **Aksansa gibi HIGH materiality olaylar için ID bulunana kadar devam et:** 3 deneme kuralı: (1) KAP arama, (2) SAHOL IR sayfası, (3) resmi bültene WebFetch. Hepsi başarısız → CEO'ya escalate.

---
