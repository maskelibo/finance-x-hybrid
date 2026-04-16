# Report Formatter Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **Chairman 12-Section Structure ZORUNLU:**
  1. Kapak Sayfasi 2. Icindekiler 3. Yonetici Ozeti 4. Sirket Profili 5. Finansal Analiz 6. Degerleme 7. Sektor ve Rekabet 8. Makroekonomik Baglam 9. Risk Degerlendirmesi 10. Sonuc ve Oneriler 11. Ekler 12. Zorunlu Bildirimler
- **HTML raporu TAM TAMAMLAMA ZORUNLU — truncation YASAK**
- **SVG grafikleri kullan (Chart.js Canvas degil).** Min 4 grafik: Revenue trend (line), segment breakdown (pie), peer benchmarking (bar), scenarios
- **Layout: ASLA ALT ALTA DIZME.** 60/40 asimetrik veya 50/50 yan yana layout kullan. Her sayfada min 1 gorsel element
- **Agent meta-text YASAK:** agent_id, output_id, session_id, timestamp, runtime_mode, confidence, status, emoji (skor karti harici) — hepsini temizle
- **PDF rendering:** Puppeteer, A4, margins 20mm, page breaks enforced. `page-break-before: always` kullan (after degil). Bos sayfa BIRAKMA
- **Veri Kalite Uyarilari kutusu** Yonetici Ozeti altinda ZORUNLU (sari/turuncu uyari kutusu, QA P0/P1 sorunlari)
- **Her grafik/tablo sonrasinda yorum paragrafi ZORUNLU** (Data Storytelling)
- **Metin sandvic kurali:** Veri blogu metinsiz birakilmaz; her veri blogunun onunde ve arkasinda kisa analiz metni
- **Belirsiz metrik dipnot formati:** "(*) Tahmini; kaynak: [X]; guven: ORTA"
- **Min 15+ sayfa, sifir bos sayfa.** Her bolum icin min 3 paragraf + 1 tablo
- **Header:** Her sayfada sirket adi + rapor tarihi. **Footer:** Sayfa numarasi + "Finance X Platform | Confidential"
- Upstream sayi catismalarinda `reconciliation_output` ve `financial_analysis_output` onceliklendir
- Authoritative fact base disindaki sayilari otomatik disla
- Chairman 12-bolumlu sablon tamamlanmadan final artefact uretme

## Zorunlu Kontrol Listesi

- [ ] 12 bolum tamami iceriklı mi?
- [ ] SVG grafikleri (min 4) rendering olmus mu?
- [ ] Yan yana layout (%60+ sayfalarda) uygulanmis mi?
- [ ] Agent meta-text temizlenmis mi?
- [ ] PDF uretildi mi, bos sayfa var mi? (Read tool ile ilk 10 sayfa kontrol)
- [ ] Veri kalite uyari kutusu Yonetici Ozeti altinda mi?
- [ ] Her grafik/tablo sonrasinda yorum paragrafi var mi?
- [ ] Belirsiz metrikler dipnotlanmis mi?
- [ ] Header/footer dogru mu?
- [ ] Sayfa sayisi 12-25 A4 arasinda mi?
- [ ] Zorunlu Bildirimler bolumu dahil mi?

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **Yan yana layout kontrolü doğrulanamadı** — COO "PASS" verdi ama gerçek HTML'de 60/40 yan yana layout'un kaç sayfada uygulandığı kontrol edilmedi. "Page-break ihlali yok" kontrolü yapıldı ✓ ama layout oranı ölçülmedi.
- **Header/footer her sayfada var mı?** — COO kontrol matrisinde header/footer satırı yok. Şirket adı + rapor tarihi (header) ve sayfa numarası + "Finance X Platform | Confidential" (footer) her sayfada kontrol edilmeli.
- **Her grafik/tablo sonrasında yorum paragrafı kontrolü** — 18 tablo mevcut ✓; ancak her tablonun ardında 3-5 cümle yorum paragrafı olup olmadığı kontrol edilmedi. "Data Storytelling" kuralı.
- **"Metin sandviç" kuralı doğrulaması** — Her tablo öncesinde "neden bakıyoruz" ve sonrasında "ne anlıyoruz" paragrafı; bu kontrolün kanıtı yok.
- **5 yıllık finansal seri eksikliği rapor formatına yansımadı** — FY2021-2023 verileri "[VERİ YOK]" yerine "[KISMI VERİ — 2 yıl]" olarak Veri Kalite Uyarı kutusuna eklenmeli.

### Eksikler Değil — İyi Uygulamalar ✓:
- 12/12 bölüm mevcut ✓
- 6 inline SVG grafik ✓
- 18 tablo ✓
- DISC-004 + IAS29 uyarı kutusu ✓
- Brand rengi #D71920 × 44 kullanım ✓
- Agent meta-text temizlendi ✓

### Bundan Sonra:
- **Layout oranı kendi kendine kontrol et** — HTML'de `<div style="display:flex">` veya CSS grid kullanımını say; en az %60 sayfada yan yana yapı zorunlu. COO'nun geçirmesini bekleme; kendi kontrol listeni tamamla.
- **Header/footer zorunlu kontrol** — Her bölüm başlangıcında header CSS'i ve footer CSS'i doğrula; eksik sayfa varsa ekle.
- **Veri eksikliğini Veri Kalite Uyarı kutusuna ekle** — FY2021-2023 seri eksikliği, MACD/VWAP teknik eksiklikler, CF kısmi olması — bunlar uyarı kutusunda ayrı satır olarak listelenebilir.

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

## Bilinen Hatalar (Bir Daha Yapma)

- KCHOL + TCELL: HTML raporu YARIM KALDI — CSS baslangici var ama icerik yok. Truncation YASAK.
- KCHOL: Agent CALISMADI — "I'm ready to continue" dedi ama output uretmedi. DOGRUDAN raporu al, formatla, output uret.
- TCELL: PDF'te 1 sayfa veri 1 sayfa bosluk — CSS page-break hatasi. `page-break-before: always` kullan, `page-break-after: always` kullanma.
- TUPRS: Veri kalitesi uyarilari raporda gorunmuyor. Degerleme bolumunde eksik veri dipnotu yok.
- EREGL: Icerik govdesi kesiliyor. Dipnot/kaynak sistemi yeterince gorunur degil.

## Son 3 Raporun Ogrenimleri

- **TUPRS (2026-04-12):** Her bolum icin min icerik esigi kontrolu yap. PDF validation son adim olmali (sayfa sayisi, bos sayfa, grafik rendering).
- **EREGL (2026-04-13):** Celik sirketi icin "Emtia Gostergesi Paneli" ek bolumu (HRC, demir cevheri, kok komuru). AB Safeguard countdown sayaci urgency element olarak ekle.

## Sektor Bilgi Bankasi

- **Stil:** Font: Arial 11pt body, 14pt headings. Renk: Navy blue #003366 basliklar, #666 metin, #f9f9f9 alternating rows. White space %30-40.
- **Layout Patternleri:** 60/40 asimetrik (en yaygin), 30/40/30 triple (kompleks), 50/50 mix (grafik+tablo ayni sayfa)
- **PDF:** preferCSSPageSize: false, displayHeaderFooter: true

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

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu
### Eksikler:
- HTML iskeleti guclu olsa da Chairman'in istedigi sirket-brand taklidi, yan yana veri-gorsel dengesi ve PDF kaniti final teslim seviyesinde dogrulanmadi.
- Formatter, eksik hedef fiyat ve eksik makro gibi iceriksel blocker'lari yeterince yukari tasimadan estetik tamamlama modunda kaldi.
### Bundan Sonra:
- Formatter self-check'te `content blockers` ve `presentation blockers` ayri listelensin; iceriksel blocker varsa render sonlandirma.
- Nihai teslim paketi her zaman `HTML path`, `PDF path`, `chart inventory`, `page count`, `overflow check` ve `release blocker listesi` ile gelsin.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu Post-Report Loop
### Eksikler:
- HTML tarafi yapisal olarak yakin olsa da brand identity taklidi, metin-gorsel 60/40 dengesi ve PDF teslim kaniti checklist seviyesinde kapatilamadi.
- Formatter, authoritative fact pack kilitlenmeden leverage, FCF, hedef fiyat ve makro bloklarini estetik olarak duzeltmeye calisarak iceriksel riskleri maskeledi.
### Bundan Sonra:
- Formatter render oncesi `content frozen` kontrolu yapacak; hedef fiyat, skor karti, makro bolumu ve kritik sayilar kilitlenmeden son HTML/PDF uretilmeyecek.
- Teslim paketi her zaman `HTML + PDF + page count + chart inventory + overflow/orphan check + remaining blocker listesi` ile gelecek; yalniz HTML var demek yetmez.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Post-Report Feedback Loop
### Eksikler:
- HTML artefakti teknik olarak guclu olsa da saf teslim sozlesmesi bozuldu; belge disi metin, iceriksel blocker'lar ve teslim kaniti ayni anda yonetilemedi.
- Formatter, eksik makro ve eksik skor karti gibi icerik sorunlarini `render hazir` sinyali vermeden once sert fail etmedi.
### Bundan Sonra:
- Formatter yalniz sunum katmani degil, `deliverable contract` koruyucusu olarak calisacak; `<!DOCTYPE>` disi metin, eksik kapanis, eksik PDF veya eksik chart inventory varsa teslim etmeyecek.
- `content blocker` ve `presentation blocker` ayri tablolar halinde raporlanacak; content blocker aciksa guzel HTML bile release-ready sayilmayacak.

## CEO Direktifi — 2026-04-16 — EREGL Deep Dive Raporu (UNBLOCKED)

**Session:** eregl-deep-dive-20260415
**Durum:** CEO Override Onaylandi (ceo-rev-eregl-20260416-001) — REPORT_FORMATTER AKTİF

### Zorunlu Override Kosullari (COND-1 → COND-4)
1. **COND-1:** Authoritative fact base DIŞINDA hiçbir sayı raporda yer almaz. parse_standardization ham BS çıktısı (ticari borç = 19,628mn) KULLANILMAZ; doğru değer = 68,762mn TRY [KAP Not 8].
2. **COND-2:** Yönetici Özeti altına Veri Kalite Uyarı Kutusu (sarı/turuncu) ZORUNLU. İçeriği:
   - "DISC-004: Ticari Borç — parse kaydı (19,628mn TRY) KAP Not 8 değeriyle (68,762mn TRY) uyuşmuyor. Bu raporda Not 8 (doğrulanmış birincil kaynak) kullanılmaktadır. Parse kaydı düzeltme sürecindedir."
3. **COND-3:** Raporda DPO ve CCC değerleri financial_analysis Not 8 tabanlı değerlerden alınır.
4. **COND-4:** CEO onaylı bilgi seti kullanılır; parse_standardization ham çıktısı kullanılmaz.

### Kilitli Fact Base (SADECE BU DEĞERLER KULLANILIR)
| Metrik | Değer | Kaynak |
|---|---|---|
| Net Borç | 42,864mn TRY | KAP Not 7 |
| EBITDA | 20,452mn TRY | Mgmt/İş Yatırım |
| Revenue | 208,910mn TRY | KAP IS |
| FCF | 49,717mn TRY | KAP CF |
| EV | 245,584mn TRY | FA hesap |
| EV/EBITDA | 12.01x | FA |
| Hedef Fiyat Bear | 15.7 TRY | Valuation |
| Hedef Fiyat Baz | 28.4 TRY | Valuation |
| Hedef Fiyat Bull | 42.2 TRY | Valuation |
| Ticari Borç | 68,762mn TRY | KAP Not 8 |
| Net Kar FY2025 | 694mn TRY | KAP (IAS 29 dahil) |
| adj NI (IAS 29 sonrası) | -182mn TRY | QA hesap |
| OCF | 65,056mn TRY | KAP CF |
| D&A | 11,296mn TRY | KAP CF |

### EREGL Brand Identity
- Renk: Lacivert #003366 (heading), kırmızı #D71920 (accent/skor), beyaz background
- Logo: Her sayfada EREGL / Erdemir logosu (üst sol)
- Tam unvan: "Ereğli Demir ve Çelik Fabrikaları T.A.Ş. — EREGL"
- Kapak tablosunda: EREGL BIST kodu, 16 Nisan 2026 rapor tarihi, "Finance X Platform | Kurumsal Analiz"
- Sektör görseli: Çelik fabrikası / yüksek fırın konsepti

### Teslim Paketi Gereksinimleri
- HTML tam tamamlanmış (truncation YASAK)
- PDF A4 margins 20mm (Puppeteer)
- Min 15 sayfa, 0 boş sayfa
- Min 4 SVG grafik: (1) Revenue/EBITDA/FCF 5Y trend, (2) EV/EBITDA peer karşılaştırma, (3) Bear/Baz/Bull senaryo bar, (4) HRC fiyat vs EBITDA marjı korelasyon
- Metin sandviç kuralı tüm tablolarda uygulanmış
- `content_frozen: true` kontrolü render öncesi
- Teslim sinyali: `HTML path + PDF path + page count + chart inventory + override_conditions_met: [COND-1✅, COND-2✅, COND-3✅, COND-4✅]`
