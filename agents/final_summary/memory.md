# Final Summary Agent — Damıtılmış Hafıza

---

## Kalıcı Kurallar

- **Final Summary = 3 KATMANLI YAPI:**
  1. Executive Summary (1 sayfa): Investment thesis, recommendation, target price, key catalysts — C-level için
  2. Skor Kartı (1 sayfa): 6 boyut + genel skor (1-10), peer comparison, strength/weakness matrix
  3. Detaylı Sonuç (2-3 sayfa): Bull/Baz/Bear senaryolar, hedef fiyat metodolojisi, risk/opportunity balance, forward timeline
- **12 bölümlü yapı TAM UYGULANMALI:** Kapak, İçindekiler, Yönetici Özeti, Şirket Profili, Finansal Analiz, Değerleme, Sektör ve Rekabet, Makroekonomik Bağlam, Risk Değerlendirmesi, Sonuç ve Öneriler, Ekler, Zorunlu Bildirimler
- **Skor kartı ZORUNLU:** Karlılık, Likidite, Kaldıraç, Nakit Akışı, Büyüme, Yönetim Kalitesi — her biri 1-10, açıklama + benchmark
- **Hedef fiyat aralığı Bear/Baz/Bull ZORUNLU.** Ağırlıklı hesap görülür: (Bear×%25) + (Baz×%50) + (Bull×%25)
- **Valuation agent DEGRADED ise:** "Hedef fiyat: YETERLİ VERİ YOK — Q sonrası revize edilecektir" notu açıkça yer almalı
- **Veri Kalite Uyarıları bölümü ZORUNLU:** QA P0/P1 sorunları, çözüm durumları ve etkisiyle birlikte tek bölümde özetlenmeli
- **En kritik bekleyen tarih summary'nin başında** (örnek: "ÖNEMLİ: 17 Nisan 2026...")
- **ESG → yatırım tavsiyesi bağlantısı kurulmalı** — "ESG X/10 → kurumsal yatırımcı kısıtı → değerleme tavanı" formatı
- **Agent meta-text POST-PROCESSING filter ZORUNLU:** agent_id, output_id, session_id, timestamp, runtime_mode, confidence, status, emoji — hepsini SİL
- **Grafik tag'leri ekle:** [CHART:LINE], [CHART:PIE], [CHART:BAR] — report_formatter için zorunlu; minimum 3 tag
- **Truncation çözümü:** Çok uzunsa Executive Summary + Detailed Appendix olarak ikiye böl
- **Yarım rapor YASAK** — başlanan her bölüm bitirilmeli; truncation varsa "output incomplete" flag'i ekle
- **Açılış sırası ZORUNLU:** `critical next date → net tavir → 3 destekleyici bulgu → 3 nicel risk → Bear/Baz/Bull → skor kartı`
- **C-level özet aksiyon dili taşıyacak:** "Hangi katalist hangi metriği değiştirirse tavir değişir" cümlesi her raporda zorunlu
- **Final sayıları göndermeden önce valuation, synthesis ve formatter ile çapraz kontrol** — tutarsızlık varsa summary çıkmayacak
- **Tek satırlık özet YASAK** — minimum: hedef fiyat (Bear/Baz/Bull) + ana tez + 3 destekleyici bulgu + 3 risk + net tavir
- Grafik tag'leri içindekiler tablosunun hemen altına da duyurulacak: "[CHART:PIE] [CHART:LINE] [CHART:BAR]"
- Sektöre özel KPI tablosu Yönetici Özeti içinde: havacılık (RPK/ASK/LF/CASK), çelik (ton/EBITDA), perakende (SSSG/Revenue per Store)
- Yönetici Özeti + Skor Kartı + Hedef Fiyat tablosunu ilk 2000 karaktere sığdır — truncation olsa bile bu üç element görünmüş olsun
- Belirsizliği saklamak değil sınıflandırmak: doğrulanmış / tahmini / spekülatif / contestable

## Zorunlu Kontrol Listesi

- [ ] 12 bölümün hepsi dolu mu?
- [ ] Açılış sırası (critical date → tavir → 3 bulgu → 3 risk → Bear/Baz/Bull → skor kartı) uygulandı mı?
- [ ] Grafik tag'leri ([CHART:LINE/PIE/BAR]) minimum 3 adet eklendi mi?
- [ ] Agent meta-text temizlendi mi?
- [ ] JSON formatlar düz metne çevrildi mi?
- [ ] Skor kartı tam mı (6 boyut + genel skor)?
- [ ] Hedef fiyat aralığı Bear/Baz/Bull net mi?
- [ ] Ağırlıklı hedef fiyat hesabı görünür mü?
- [ ] Veri kalite uyarıları bölümü var mı?
- [ ] ESG → yatırım bağlantısı kuruldu mu?
- [ ] Aksiyon dili cümlesi var mı? ("Hangi katalist → tavir değişir")
- [ ] Valuation/synthesis/formatter ile çapraz kontrol yapıldı mı?
- [ ] Zorunlu Bildirimler bölümü dahil mi?

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK: Rapor cümlesi ortasında kesilmiş — yarım rapor YASAK
- KCHOL: Agent meta-text temizlenmemiş (Session ID, Agent ID vb.), grafik tag'leri yok
- TCELL: "Skor: 7.5/10. Bull 450 TL, Bear 280 TL." — tek satır özet YASAK; tam yapı zorunlu
- TUPRS: QA P0/P1 sorunları rapor içinde görünmüyor, ağırlıklı hedef fiyat açıklanmadı
- EREGL: Grafik tag'leri sistematik eklenmedi; ESG → yatırım bağlantısı kurulmadı

## Son 3 Raporun Öğrenimleri

- **EREGL (2026-04-13):** Çelik P/E tükenmiş kazanç döneminde anlamsız → FD/FAVÖK ve PD/DD kullan. AB safeguard = EBITDA'nın %30-40'ı riski. Delta update: [DELTA: X→Y TL] etiketiyle
- **THYAO (2026-04-14):** Havacılık özet KPI tablosu (RPK/ASK/LF/CASK/RASK/Kargo/Filo) Yönetici Özeti içinde zorunlu. Türkçe karakter standartlaştır (UTF-8)
- **TCELL (2026-04-15):** Açılış bloğu: critical date + net tavir + 3 bulgu + 3 risk + Bear/Baz/Bull + skor kartı; tek authoritative fact pack kullan; aksiyon cümlesi zorunlu

## Sektör Bilgi Bankası

- **Çelik:** P/E yerine FD/FAVÖK ve PD/DD. CBAM + AB safeguard + enerji tarife = compound risk. Avrupa gelir payı öne çıkar
- **Rafineri:** Marj ($/bbl) ve jeopolitik senaryo ayrı bölüm. IAS 29 bilanço imbalance açıklanmalı
- **Holding:** Segment bazlı analiz + NAV discount değerleme bölümünde. Spin-off senaryoları Bull case'e dahil
- **Hedef fiyat ağırlıkları:** Standart: DCF %50 / EV/EBITDA %30 / SOTP %20 | Çelik: EV/EBITDA %40 / DCF %35 / Temettü %15 / EV/ton %10

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **QA score 0 (FAIL) ile rapor teslim edildi** — Kritik kural ihlali. Veri Kalite Uyarısı (P0) notu var ✓ ama QA FAIL durumunda final_summary üretmek CEO direktifine aykırı. "financial_analysis yoksa rapor ÇIKMAZ" kuralı burada uygulanmadı.
- **Havacılık KPI tablosu (RPK/ASK/LF/CASK/RASK) Yönetici Özeti'nde yok** — Önceki THYAO raporundan öğrenilmişti; delta-update'te de eklenmesi zorunluydu. Bu tablo havacılık analizinin sektörel temeli.
- **Skor kartı 6 boyut + puanlar görünmüyor** — 1-10 skor kartı çıktıda görünmedi. Aksiyon dili var ✓ ama skor kartı tablosu eksik.
- **DSO/DIO/DPO/CCC/NWC metrikleri yok** — financial_analysis olmadığından; ancak final summary "bu metrikler eksik, nedeni financial_analysis çalışmadı" şeklinde açıkça belirtmeliydi. "Veri Kalite Uyarısı" bölümünde satır satır eksik metrik listelenmeli.
- **Makro bölümünde TCMB faizi/CPI/PPI null** — Makro veriler eksik olmasına rağmen rapor bu boşlukları yeterince vurgulamadı. "Makro analizde politika faizi, enflasyon ve BIST100 verileri üretilmedi" açık uyarısı P0 seviyesinde işaretlenmeli.
- **sector_competition tamamen boş (industrial fallback)** — Sektör ve Rekabet bölümü raporda nasıl göründü? Peer grup boşsa bu bölümün "[MEVCUT DEĞİL — sector_competition çalıştırılamadı]" etiketiyle işaretlenmesi zorunlu.

### Bundan Sonra:
- **QA FAIL = final_summary ÜRETME** — financial_analysis yoksa, QA score 0 ise: final_summary üretmek YASAK. Bunun yerine: "RAPOR HAZIR DEĞİL — QA FAIL: financial_analysis eksik. Unblock condition: CF tablosu + WC metrikleri." Bu mesaj CEO'ya eskalasyon mesajıdır.
- **Veri Kalite Uyarıları bölümü = P0 eksikler satır satır** — Her P0/P1 için: Eksik metrik | Nedeni | Hangi agent sorumlu | Recheck koşulu. "Genel uyarı" değil, matris formatı.
- **Sektöre özel KPI tablosu Yönetici Özeti'nin ilk tablosu** — Havacılık: RPK | ASK | Load Factor | CASK | RASK | Kargo ton-km | Filo. Bu tablo financial_analysis olmadan context_extraction ve kap_watch verilerinden üretilebilir (operasyonel veri finansal veriye bağımlı değil).

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **Yapı güçlü ✓ — ama hedef fiyat boş** — Bear/Baz/Bull hedef fiyatlar "yeniden hesaplanacak" olarak boş. "YETERLİ VERİ YOK + unblock koşulu" notu konulmalı; boş bırakılamaz.
- **Havacılık KPI tablosu Yönetici Özeti'nde yok — 3. direktif** — RPK/ASK/Load Factor/CASK/RASK/Kargo/Filo tablosu. Context_extraction ve kap_watch verilerinden üretilebilir; financial_analysis beklenmez.
- **DSO/DIO/DPO/CCC metrikleri veri kalite uyarıları bölümünde listesiz** — Engine_snapshot'ta var (DSO=17.25); final_summary bu değerleri Veri Kalite bölümünde P1 olarak matris formatında listelemeli.
- **EBITDA/EBITDAR null → skor kartı puanı kaynaksız** — "Finansal Sağlık" boyutu puanı bu eksikliği yansıtmadı; kaynak belirsiz puan verilemez.
- **Veri Kalite Uyarıları genel uyarı** — "Genel uyarı" değil: Eksik Metrik | Nedeni | Sorumlu Agent | Recheck Koşulu matris formatı zorunlu.

### Bundan Sonra:
- **Hedef fiyat boş ise "YETERLİ VERİ YOK" + unblock koşulu** — "Valuation agent EBITDA eksik → Hedef fiyat: N/A. Unblock: CF tablosu + EBITDA teyidi." Zorunlu format.
- **Havacılık KPI tablosu Yönetici Özeti'nin ilk tablosu (3. direktif)** — RPK | ASK | Load Factor | CASK | RASK | Kargo ton-km | Filo. Financial_analysis olmadan üretilebilir.
- **Veri Kalite Uyarıları = P0/P1 matris** — Her satır: Metrik | Nedeni | Sorumlu Agent | Recheck Koşulu.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **Rapor yapısı güçlü ✓** — 12 bölümlü içindekiler, skor kartı (6 boyut), critical date uyarısı, chart tag'leri mevcut. İyi çalışma.
- **Hedef fiyat: — / — / —** — Bear/Baz/Bull hedef fiyatlar "yeniden hesaplanacak" olarak boş. Final summary hedef fiyat olmadan teslim edilemez; valuation_agent yoksa "YETERLİ VERİ YOK" notu konulmalı.
- **Havacılık KPI tablosu (RPK/ASK/LF/CASK/RASK) Yönetici Özeti'nde yok** — Direktif 2 rapordur verildi; hâlâ eklenmedi. Bu tablo context_extraction'dan üretilebilir.
- **DSO/DIO/DPO/CCC Finansal Analiz bölümünde eksik** — engine_snapshot'ta DSO=17.25, DIO=18.66, DPO=35.39 var; final_summary bunları içermeli.
- **EBITDA/EBITDAR null → skor kartı "Finansal Sağlık" boyutu eksik veriyle puanlandı** — "EBITDA eksik → kaldıraç belirsiz" yazılmış ✓ ama skor kartı puanı (5/10) bu belirsizliği gerçek anlamamış; kaynak belirsiz puan verilmemeli.
- **Working capital metrikleri veri kalite uyarıları bölümünde listesiz** — Hangi metriklerin neden eksik olduğu matris formatında P0/P1 listesi yok.

### Bundan Sonra:
- **Hedef fiyat boş ise "YETERLİ VERİ YOK" notu + unblock koşulu** — "Valuation agent çalışmadı / EBITDA eksik → Hedef fiyat: N/A. Unblock: CF tablosu + EBITDA teyidi." Her zaman bu format.
- **Havacılık KPI tablosu Yönetici Özeti'nin ilk tablosu (3. direktif)** — RPK | ASK | Load Factor | CASK | RASK | Kargo ton-km | Filo. Context_extraction ve kap_watch verilerinden üretilebilir.
- **Veri Kalite Uyarıları = P0/P1 matris** — "Genel uyarı" değil: Eksik Metrik | Nedeni | Sorumlu Agent | Recheck Koşulu. Matris formatı zorunlu.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **report_formatter DEGRADED (exit 143) → HTML boş** — Final summary içerik olarak hazırlandı ✓ (I-XII bölüm mevcut); ancak report_formatter HTML'ye aktaramadı. Temel sorun: context window overflow — tüm upstream çıktılar tek seferde formatter'a geçirildi.
- **SOTP tablosu (6 iştirak × NAV katkısı) raporda yok** — Valuation SOTP formal output downstream'e gelmedi; final summary'de bu tablo [EKSIK] olarak işaretlenmedi. Chairman bu tablosuz raporu onaylamaz.
- **Ağırlıklı hedef fiyat hesabı görünür değil** — (182×%25) + (250×%50) + (322×%25) = hesabı çıktıda mevcut mu? Formül görünür biçimde yazılmalı.
- **C-level aksiyon dili cümlesi** — "Hangi katalist hangi metriği değiştirirse tavir değişir" formatında cümle var mı? "21 Nisan İran ateşkes → crack spread normalleşir → NAV -40 TL → tavsiye gözden geçir" gibi.
- **IFRS 8 segment EBITDA ikincil kaynak (GCM) raporda etiketlenmedi** — Tüm segment EBITDA değerleri GCM Q4 2025 bazlı; bu veri kalitesi düşürücü faktör "Veri Kalite Uyarıları" bölümünde açıkça yazılmalı.

### Bundan Sonra:
- **report_formatter'a büyük içerik geçişi = parçalı gönder** — Final summary büyükse: önce kritik bölümler (Yönetici Özeti + Skor Kartı + Hedef Fiyat), sonra detaylar. Tek seferde tüm upstream çıktıları formatter'a YASAK (exit 143 riski).
- **SOTP tablosu eksikse açıkça işaretle** — "[SOTP TABLOSU EKSİK — valuation_agent SOTP çıktısı bekleniyor]" notu. Boş bırakmak veya GCM verisiyle doldurmak CEO approval gate'ini geçmez.
- **Ağırlıklı hedef fiyat formülü görünür** — Her holding raporunda: "(Bear×%25) + (Baz×%50) + (Bull×%25) = Ağırlıklı Hedef Fiyat: X TL" formülü açık yazılacak. Hesap gizli kalmamalı.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **12 bölüm yapısı ve özet iskelet güçlü ✓** — Bu turda final_summary yapısal olarak doğru; I-XII bölüm mevcut, skor kartı var, chart tag'leri var.
- **Hedef fiyat boş kaldı** — "Yeterli veri yok" notu yerine "TP: N/A — unblock: CF tablosu + EBITDA teyidi bekleniyor" formatı kullanılmadı.
- **Havacılık KPI tablosu yok — 3. direktif** — RPK | ASK | Load Factor | CASK | RASK | Kargo ton-km | Filo tablosu Yönetici Özeti'nde yer almadı. Bu tablo context_extraction + kap_watch verisiyle üretilebilir.
- **WC metrikleri eksik** — DSO/DIO/DPO/CCC Çalışma Sermayesi bölümünde görünmedi; financial_analysis bağımlılığı kırıksa tahmin proxy'si `[conf: LOW]` ile verilmeliydi.
- **Veri kalite uyarıları serbest metin olarak kaldı** — Matris formatı: Eksik Metrik | Nedeni | Sorumlu Agent | Recheck Koşulu. Bu format uygulanmadı.
- **Tavsiye ("BUY/HOLD/SELL") yok** — strategic_synthesis çıktısı yoktu; final_summary "Tavsiye: N/A — strategic_synthesis bekliyor" notu yazmalıydı.

### Bundan Sonra:
- **Hedef fiyat her analizde görünür — null değil, "N/A + unblock koşulu":**
  "Hedef Fiyat: N/A — Unblock: (1) CF tablosu parse edilsin, (2) EBITDA teyit edilsin. Mevcut durumda valuation çalıştırılamadı."
- **Havacılık KPI tablosu Yönetici Özeti'nin ilk tablosu (3. direktif — tolans sıfır):**
  RPK | ASK | Load Factor | CASK | RASK | Kargo ton-km | Filo (sayısı) | Hedging oranı
  Context_extraction + kap_watch verisiyle her zaman üretilebilir.
- **Veri kalite matrisi (P0/P1 formatı):**
  | Eksik Metrik | Nedeni | Sorumlu | Recheck Koşulu |
  |---|---|---|---|
  | EBITDA | D&A upstream null | data_collection | CF tablosu parse |
  | EBITDAR | IFRS16 ayrışması yok | parse_standardization | ROU amortismanı |
- **Tavsiye = N/A değil, "koşullu tez"** — strategic_synthesis yoksa final_summary mevcut verilerle "Veriler tamamlanana kadar takip listesi / izle" notu yaz.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417)

### Eksikler:
- **QA FAIL uyarısı var ✓ — doğru yaklaşım** — "QA KARAR: FAIL (Skor: 0/1)" ve "Bu rapor finansal tablo verileri olmadan üretilmiştir" notu açık ve güçlü. Bu pozitif değişiklik korunmalı.
- **12 bölüm yapısı mevcut ✓** — İçindekiler ve bölüm başlıkları var; iskelet doğru.
- **Hedef fiyat bölümü: "Hedef fiyat verilemez" — kabul edilebilir ama format yanlış** — "N/A + unblock koşulu" formatı kullanılmadı. "Hedef Fiyat: N/A — Unblock: (1) financial_analysis çalıştır, (2) EBITDA teyit edilsin" zorunlu format.
- **Havacılık KPI tablosu Yönetici Özeti'nde yok — 5. direktif** — RPK/ASK/Load Factor/CASK/RASK/Kargo/Filo/Hedging tablosu; context_extraction ve kap_watch verisiyle her zaman üretilebilir. 5 turda üretilmedi.
- **Veri kalite uyarıları genel anlatı** — "financial_analysis çalışmadı" genel uyarısı var ✓ ama P0/P1 matris formatı (Eksik Metrik | Nedeni | Sorumlu Agent | Recheck Koşulu) uygulanmadı.
- **DSO/DIO/DPO/CCC metrikleri tamamen eksik** — WC metrikleri veri kalite uyarılarında bile listesiz.
- **"En kritik bekleyen tarih" bölümü var ✓** — "Q1 2026 Finansal Sonuçları — tahminen Mayıs 2026" doğru tespit. Bu kazanım korunmalı.

### Bundan Sonra:
- **QA FAIL uyarısı formatı standardı (her raporда):**
  ```
  **QA KARAR: FAIL**
  Hedef Fiyat: N/A — Unblock: (1) financial_analysis çalışsın, (2) EBITDA teyit edilsin
  | Eksik Metrik | Nedeni | Sorumlu | Recheck Koşulu |
  | EBITDA | D&A null | data_collection | CF tablosu parse |
  | EBITDAR | IFRS16 ayrışması yok | parse_standardization | ROU amortismanı |
  ```
- **Havacılık KPI tablosu Yönetici Özeti ilk tablosu (5. direktif — tolerans sıfır):** RPK | ASK | Load Factor | CASK | RASK | Kargo ton-km | Filo | Hedging. financial_analysis beklenmez; context_extraction + kap_watch yeterli.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **12 bölüm yapısı ve özet iskelet güçlü ✓** — Bu turda final_summary yapısal olarak doğru; I-XII bölüm mevcut, skor kartı var, chart tag'leri var. Bu pozitif değişiklik korunmalı.
- **Hedef fiyat bölümü boş** — "TP: N/A — Unblock: CF tablosu parse edilsin + EBITDA teyit edilsin" formatı kullanılmadı; bölüm tamamen boş bırakıldı.
- **Havacılık KPI tablosu (RPK/ASK/LF/CASK/RASK/Kargo/Filo/Hedging) yok — 4. direktif** — Context_extraction + kap_watch verisiyle her zaman üretilebilir; 4 turda üretilmedi.
- **WC metrikleri (DSO/DIO/DPO/CCC) Çalışma Sermayesi bölümünde görünmedi** — Financial_analysis bağımlılığı kırıksa proxy `[conf: LOW]` ile verilmeliydi.
- **Veri kalite uyarıları P0/P1 matris formatında değil** — Serbest metin olarak kaldı; matris formatı uygulanmadı (3. direktif).
- **EBITDAR null cascade final_summary'de uyarı olarak flaglenmedi** — EBITDAR null → valuation imkansız; bu bilgi Veri Kalite Uyarıları matrisinde açıkça yazılmalıydı.

### Bundan Sonra:
- **12 bölüm yapısı sürdür + havacılık KPI tablosu ekle (4. direktif — tolerans sıfır):**
  RPK | ASK | Load Factor | CASK | RASK | Kargo ton-km | Filo (adet) | Hedging oranı
  Her zaman context_extraction + kap_watch'tan üretilebilir. Null ise `[VERİ YOK — conf: N/A]` doldur; boş bırakma.
- **Hedef fiyat null değil "N/A + unblock koşulu" formatı:**
  "Hedef Fiyat: N/A — Unblock: (1) CF tablosu parse edilsin, (2) EBITDA teyit edilsin, (3) valuation_agent yeniden çalışsın."
- **Veri kalite matrisi (P0/P1 formatı zorunlu):**
  | Eksik Metrik | Nedeni | Sorumlu | Recheck Koşulu |
  | EBITDA | D&A upstream null | data_collection | CF tablosu parse |
  | EBITDAR | IFRS16 ayrışması yok | parse_standardization | ROU amortismanı |
- **Tavsiye bölümü "koşullu tez" ile doldurul** — strategic_synthesis yoksa: "Mevcut verilerle izle — Unblock: upstream eksiklikler giderilene kadar BUY/HOLD/SELL verilemez."

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **Hedef fiyat üretildi ✓ — önemli iyileşme** — Bear 231 / Baz 330 / Bull 462 TL, ağırlıklı 338 TL. Bu THYAO analizlerinde ilk kez hedef fiyat üretildi. Pozitif değişiklik korunmalı.
- **12 bölüm yapısı, skor kartı, chart tag'leri ✓ — yapısal doğruluk iyi**
- **Havacılık KPI tablosu (RPK/ASK/LF/CASK/RASK/Kargo/Filo/Hedging) Yönetici Özeti'nde yok — 5. direktif** — Her zaman context_extraction + kap_watch'tan üretilebilir; 5 analizdir eksik.
- **Veri kalite uyarıları P0/P1 matris formatında değil — 4. direktif** — Serbest metin olarak kaldı; matris formatı uygulanmadı.
- **WC metrikleri (DSO/DIO/DPO/CCC) Çalışma Sermayesi bölümünde görünmedi** — financial_analysis bağımlılığı kırıksa proxy [conf: LOW] ile verilmeliydi.
- **EBITDAR null cascade final_summary'de flaglenmedi** — EBITDAR null → valuation imkansız; Veri Kalite Uyarıları matrisinde açıkça yazılmalıydı.
- **Hedef fiyat kaynağı belirsiz** — EBITDAR null olduğundan değerleme temeli teyit edilemedi; hangi yöntemle üretildiği net değil.

### Bundan Sonra:
- **Hedef fiyat üretimini sürdür ✓ — Bear/Baz/Bull + ağırlıklı format doğru**
- **Havacılık KPI tablosu Yönetici Özeti ilk tablosu (5. direktif — tolerans sıfır):** RPK | ASK | LF | CASK | RASK | Kargo ton-km | Filo | Hedging. Null ise [VERİ YOK] doldur; boş bırakma.
- **Veri kalite matrisi P0/P1 formatı zorunlu:**
  | Eksik Metrik | Nedeni | Sorumlu | Recheck Koşulu |
  | EBITDA | D&A upstream null | data_collection | CF tablosu parse |
  | EBITDAR | IFRS16 ayrışması yok | parse_standardization | ROU amortismanı |
- **Hedef fiyat null değil "N/A + unblock koşulu" formatı** — strategic_synthesis yoksa: "TP: N/A — Unblock: (1) CF parse edilsin, (2) EBITDA teyit edilsin."

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **Yapısal kalite iyi ✓ — 12 bölüm, skor kartı, chart tag'leri mevcut** — Temel format doğru; korunmalı.
- **EBITDA null cascade P0 bloker olarak flaglenmedi** — D&A null → EBITDA null → valuation imkansız zinciri Veri Kalite Uyarıları matrisinde açıkça yazılmalıydı.
- **Sektör "industrial" final özette düzeltilmedi** — ASELS savunma şirketi; son özette de yanlış sektör etiketi kaldı.
- **Savunma KPI tablosu (backlog, AR-GE, ihracat) Yönetici Özeti'nde yok** — Havacılıktaki RPK/ASK tablosunun savunma ekvivalenti eksik.
- **Jeopolitik bağlam final özette yer almadı** — Macro_analysis jeopolitik null geldiğinde final_summary kendi minimal jeopolitik bağlamı üretmeliydi.
- **Veri kalite uyarıları P0/P1 matris formatında değil** — Serbest metin olarak kaldı.

### Bundan Sonra:
- **Savunma şirketi KPI tablosu Yönetici Özeti ilk tablosu:**
  Backlog (TRY) | Backlog/Revenue (×) | AR-GE/ciro (%) | İhracat/ciro (%) | Yeni sözleşme (son 12 ay TRY)
  Null ise [VERİ YOK — conf: N/A]; boş bırakma.
- **Jeopolitik bağlam (macro null olsa bile) final özette zorunlu** — "ASELS için jeopolitik gerilim = sipariş defteri büyüme katalizörü" — 2 cümle bile yeterli; sıfır üretim kabul edilemez.
- **Veri kalite matrisi P0/P1 savunma formatı:**
  | Eksik Metrik | Nedeni | Sorumlu | Recheck Koşulu |
  | EBITDA | D&A upstream null | data_collection | CF tablosu parse |
  | Sektör etiketi | Fallback "industrial" | financial_analysis | Ticker override |
  | Jeopolitik analiz | macro_analysis null | macro_analysis | EVDS WebSearch |
