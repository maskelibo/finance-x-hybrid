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

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
