# Report Formatter Agent — Katman 2b: Vaka Bazlı Dersler

> Bu dosya CEO geri bildirimleri, rapor bazlı öğrenimler ve sektör bilgi bankasını içerir.
> Agent gerektiğinde bu dosyayı açar; her çalıştırmada otomatik yüklenmez.

---

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **HTML raporu üretilmedi** — Rapor BLOCKED (QA 0.757 < 0.80) olduğu için report_formatter beklemede; bu doğru ✓. Ama "Critical Status Report" çıktısı yerine blocking status'u CEO'ya yapılandırılmış escalation ile bildirmesi gerekirdi.
- **Blocking issues özeti iyi yapılandırıldı ✓** — CF, equity gap, WC üç bloker net tablo ile gösterildi.
- **SVG grafikleri üretilmedi** — Bloker nedeniyle beklemede; CF çözüldüğünde SVG min 4 grafik zorunlu.
- **THYAO brand identity talimatı** — Rapor üretildiğinde THY markası (kırmızı/beyaz, renk kodu #E31E24, Noto Sans tipografisi, uçak görselleri) kullanılmalı. Kurumsal kimlik taklit zorunlu.

### Bundan Sonra:
- **BLOCKED durumda "Critical Status Report" değil "CEO Escalation" gönder** — Format: BLOCKER-1/2/3 | sorumlu agent | çözüm adımı | deadline. Rapor yerine yapılandırılmış escalation.
- **Havacılık raporu için brand identity checklist:**
  1. THY kırmızı (#E31E24) başlık/accent rengi
  2. Uçak veya IST havalimanı görseli kapak sayfasında
  3. Yönetim beyanı (CEO/Chairman mektubu) bölümü
  4. IATA code, hisse kodu, borsa kodu kapak tablosunda
- **CF bloker çözülünce ilk önce** — Grafik #1: Gelir/EBITDA/NP 5Y trend (LINE) | Grafik #2: Yolcu/Kargo/Teknik segment dağılımı 2024 (PIE) | Grafik #3: Peer EV/EBITDAR karşılaştırması (BAR) | Grafik #4: Bear/Baz/Bull senaryo kutuları (SVG).

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **HTML body tamamen yok — en kritik P0 hata** — Çıktı yalnızca CSS kodundan oluşuyor; `<body>` içeriği hiç gelmiyor. 12 bölümden yalnızca 1.5 bölüm (Kapak + Yönetici Özeti başlangıcı) teslim edildi. Bu QA'nın COO tarafından "0.64 REVISION_NEEDED" olarak doğru tespit ettiği P0 sorundur.
- **HTML kapatma etiketleri eksik** — `</body></html>` yok; tarayıcı otomatik repair edecek ama PDF render hatalı.
- **BIMAS brand identity uygulanmadı** — BIM kurumsal renkleri (turuncu #F47B20 veya kırmızı, lacivert) kullanılmadı. BIM logosu yok. Her sayfada şirket kimliği zorunlu.
- **CSS ve temel yapı doğru ✓** — DOCTYPE, head, meta, responsive CSS, @page direktifleri, grid layout tanımlandı. Altyapı hazır; içerik yok.

### Bundan Sonra:
- **HTML truncation için kritik kural:** Output limiti aşılacaksa önce Kapak + Yönetici Özeti + Finansal Analiz bölümlerini teslim et; sonra ikinci mesajda Değerleme + Sektör + ... şeklinde devam et. CSS'i tek seferde gönder (kısa tutulursa), içeriği bölümler halinde ekle. **Hiçbir zaman sadece CSS gönderme.**
- **BIMAS brand identity checklist:**
  1. BIM renk paleti: Turuncu #F47B20 (primary), Lacivert #003366 (secondary), Beyaz background
  2. BIM logosu kapak sayfasında ve header'da
  3. "BIM Birleşik Mağazalar A.Ş." tam unvan + BIMAS BIST kodu kapakta
  4. Kurumsal slogan varsa footer'da
- **Tour 3 önceliği:** CF blocker çözülmeden tam HTML üretemezsin; ancak mevcut veriyle 12 bölümlü iskelet oluştur, CF gerektiren bölümleri "[CF ESTIMATED — doğrulama bekleniyor]" kutusuyla doldur. Boş bırakma.
- **COO check koordinasyonu:** HTML teslim edince COO checkini BEKLE; "teslim ettim, COO onayı bekliyorum" bildirimi gönder. Onay gelmeden PDF render tetikleme.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **HTML truncated — COO P0 olarak tespit etti** — CSS kısmı açık ama body tagı kapanmamış; mid-table kesilme var. 53.502 karakter üretildi ama COO "PDF render başarısız" kararı verdi.
- **17 placeholder dolduruldu ✓ — Chart.js yok ✓** — Bunlar başarılı.
- **SVG grafik kalitesi doğrulanamadı** — "4 inline SVG grafik" üretildi denildi; COO truncation nedeniyle grafiklerin tam render edilip edilmediğini kontrol edemedi.
- **Koç Holding brand identity uygulandı mı belirsiz** — KCHOL renkleri (lacivert, kırmızı Koç logosu), tipografi, her sayfada logo — truncated HTML nedeniyle doğrulanamadı.
- **CSS yazıldı ama HTML body tamamlanamadı** — Truncation önceki pattern ile aynı; BIMAS'ta da aynı hata vardı. "CSS gönderdim, içerik gelecek" modeli işe yaramıyor.
- **COO ile koordinasyon eksik** — "HTML teslim ettim, COO onayı bekliyorum" bildirimi gönderilmedi. COO output'u zaten "REVISION_NEEDED" ilan etmişti.

### Bundan Sonra:
- **HTML'yi 3 parçada gönder** — Parça 1: CSS + Kapak + Yönetici Özeti (en önemli) | Parça 2: Finansal Analiz + Değerleme + Sektör | Parça 3: Makro + Teknik + ESG + Sonuç + Zorunlu Bildirimler. Her parça ayrı tam HTML bloğu; birleştirme report_formatter'ın görev değil.
- **HTML kapanma tag kontrolü** — Her parçanın sonunda `</section></main></body></html>` var mı kontrol et. Kapanmayan tag = PDF render hatası.
- **KCHOL brand identity checklist** — Koç Holding lacivert (#003366), kırmızı (#C41E3A Koç logosu rengi), Koç Holding logosu kapakta, "KOÇ HOLDİNG A.Ş." tam unvan + KCHOL BIST kodu, her sayfada header logo.
- **COO checkpoint bekle** — HTML teslim edince CEO/COO'ya "Parça X teslim edildi — kapanış kontrolü yapılsın" bildirimi gönder; onay gelmeden PDF tetikleme.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **HTML üretilmedi** — Sadece specification belgesi hazırlandı; gerçek HTML/PDF çıktısı yok.
- **CEO direktifi beklendi — uygun** — BLOCKED durumu doğru tespit edildi, Option A/B sunuldu.
- **Option B'de 12 bölüm hazır denildi ama bölüm V "⚠️ Bölüm 5 truncated" olarak işaretlendi** — Eksik veriyle "hazır" iddiası yanlış; eksik satırlar "PLACEHOLDER" olarak açıkça belirtilmeliydi.
- **Sabancı marka kimliği specification'da tanımlandı ama uygulanmadı** — Kırmızı/lacivert gradient, logo yerleşimi şablona eklenmedi.

### Bundan Sonra:
- **"Hazır" iddiası YASAK, eksik varsa:** "Section V: ⚠️ financial_analysis Bölüm 5 eksik — placeholder konuldu, CEO onayı bekleniyor" formatında şeffaf bildir.
- **BLOCKED = CEO'ya iki seçenek + süre tahmini:** Option A (strict) ve Option B (conditional proceed) her zaman sunulacak. Süre tahmini her seçenek için ayrı belirtilecek.
- **Şirket marka kimliği şablona bağlanacak:** Sabancı Holding için: kırmızı (#E2001A) + lacivert (#003087) renk paleti, Sabancı logosu her sayfada üst sol köşe — bir kez tanımlanır, tüm raporlarda uygulanır.

## Son 3 Raporun Ogrenimleri

- **TUPRS (2026-04-12):** Her bolum icin min icerik esigi kontrolu yap. PDF validation son adim olmali (sayfa sayisi, bos sayfa, grafik rendering).
- **EREGL (2026-04-13):** Celik sirketi icin "Emtia Gostergesi Paneli" ek bolumu (HRC, demir cevheri, kok komuru). AB Safeguard countdown sayaci urgency element olarak ekle.

## Sektor Bilgi Bankasi

- **Stil:** Font: Arial 11pt body, 14pt headings. Renk: Navy blue #003366 basliklar, #666 metin, #f9f9f9 alternating rows. White space %30-40.
- **Layout Patternleri:** 60/40 asimetrik (en yaygin), 30/40/30 triple (kompleks), 50/50 mix (grafik+tablo ayni sayfa)
- **PDF:** preferCSSPageSize: false, displayHeaderFooter: true
