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
