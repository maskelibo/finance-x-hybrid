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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **HTML_ENVELOPE eksik — COO doğru BLOCKED ketti ✓** — HTML envelope olmadan report teslim edilemez. COO'nun bu kontrolü yapması olumlu iyileşme.
- **SPK_DISCLAIMER eksik** — Zorunlu Bildirimler bölümü dahil edilmedi. SPK disclaimer olmadan rapor yayımlanamaz.
- **~8KB içerik — 50KB direktifi 4. kez ihlal edildi** — MIN_PAYLOAD_SIZE = 50KB direktifi 4 rapordur uygulanmıyor. Havacılık raporu minimum: Yönetici Özeti + Finansal Analiz + Değerleme + Sektör + Risk = 50KB+ zorunlu.
- **Self-check döngüsü tetiklenmedi** — HTML oluşturulmadan önce kendi zorunlu kontrol listesi çalıştırılmadı; HTML_ENVELOPE ve SPK_DISCLAIMER eksikliği önceden tespit edilebilirdi.
- **THY marka kimliği belirsiz** — Kırmızı (#E31E24), Noto Sans tipografisi, IST havalimanı / uçak görseli kapak — marka kimliği şablona bağlanmadı.

### Bundan Sonra:
- **HTML tesliminden önce zorunlu self-check (4. direktif, kesinleşti):**
  1. HTML_ENVELOPE mevcut mu?
  2. SPK_DISCLAIMER var mı?
  3. Toplam boyut ≥50KB mı?
  4. THY brand identity (kırmızı #E31E24) uygulandı mı?
  Bu 4 kontrol geçmeden COO'ya teslim etme.
- **MIN_PAYLOAD_SIZE 50KB = hard bloker** — 50KB altı HTML COO tarafından reddedilecek; bu kontrolü COO delivery checklist'te sabit.
- **THYAO brand identity checklist:** (1) THY kırmızı #E31E24 başlık/accent, (2) IST/uçak görseli kapakta, (3) IATA kodu + hisse kodu kapak tablosunda, (4) Yönetim beyanı bölümü.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **HTML_ENVELOPE eksik** — `<html>` veya `</html>` tag'i yok; COO tarafından BLOCKED. Bu hata basit kontrol; formatter kendi çıktısında `<html lang="tr">...</html>` olduğunu teyit etmeli.
- **SPK_DISCLAIMER eksik** — "yatırım tavsiyesi değildir" footer'da veya zorunlu bildirimler bölümünde olmak zorunda; her THYAO raporunda şart.
- **8KB içerik — 15 sayfa standard rapor için yetersiz** — Delta'da 7KB, standard'da 8KB. final_summary içeriği HTML'ye aktarılmadı ya da çok minimal işlendi.
- **THY brand identity uygulandı mı belirsiz** — context_extraction çok detaylı brand bilgisi üretmişti (#E81932 kırmızı, turkuaz tablo headerları, İstanbul silueti kapak motifi). Bu bilgiler HTML'ye yansıtıldı mı doğrulanamadı.
- **SVG grafik sayısı bilinmiyor** — 8KB HTML'de min 4 SVG grafik üretilmiş olamaz.

### Bundan Sonra:
- **Çıktı göndermeden önce self-check zorunlu:**
  1. `<html lang="tr">...</html>` tam envelope mevcut?
  2. Footer veya Zorunlu Bildirimler bölümünde "yatırım tavsiyesi değildir" var?
  3. Boyut ≥ 50KB? (7-8KB = içerik yok anlamına gelir)
  4. Min 4 SVG grafik var?
  5. 12 bölüm başlığı HTML'de mevcut?
- **THYAO brand checklist (her THYAO raporunda):**
  1. Kırmızı (#E81932) header bantları + tablo arka planları
  2. THY logosu (kuş silueti) kapak + iç sayfa header
  3. Turkuaz (#008B8B) tablo header rengi (KAP finansal tablo standardı)
  4. İstanbul silueti kapak görseli (açık gri grafik)
  5. Footer: kırmızı sayfa numarası + "Finance X Platform | Confidential"
- **final_summary içeriğini 12 bölüme map et** — final_summary markdown/metin geldiğinde formatter şunu yapar: Bölüm I = Yönetici Özeti → Skor Kartı + hedef fiyat tablo; Bölüm III → Finansal tablolar; vb. Mapping olmadan "boş HTML" çıktısı yasak.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **HTML 7073 bytes — gerçek içerik YOK** — COO "MIN_PAYLOAD_SIZE ≥ 5KB PASS" verdi ama 7KB bir sayfaya denk gelir; min 15 sayfa = 50KB+ beklenir. CSS + iskelet + minimal içerik ile gerçek rapor üretilmedi.
- **12 bölüm içeriği yok** — Sadece HTML envelope, style ve tek tablo (COO check tablosu gibi görünen basit yapı) mevcut. 12 bölümün hiçbirinin içeriği yok.
- **SVG grafik yok** — Min 4 SVG grafik zorunlu; çıktıda hiçbiri yok.
- **THY brand identity uygulanmadı** — Kırmızı (#E81C28) başlık bantları, THY logosu, kapak görsel formatı, uçak ikonu — hiçbiri uygulanmadı.
- **final_summary metin içeriği HTML'ye dönüştürülmedi** — final_summary kapsamlı içerik üretti (yönetim analizi, senaryo anlatısı, risk bölümleri); formatter bunları HTML formatına çevirmedi.
- **QA FAIL durumunda formatter çalışmamalıydı** — QA score 0 ile formatter aktifleşmeli değil. Ancak COO "approved" kararı verdiği için formatter çalıştı. Gerçekte formatter da "QA FAIL → içerik yok → BLOCKED" kararı verebilirdi.

### Bundan Sonra:
- **MIN_PAYLOAD_SIZE eşiği 50KB olarak güncelle** — 5KB eşik anlamsız; 15 sayfa A4 rapor = 50-150KB HTML. COO ile birlikte bu eşiği güncellemeyi talep et.
- **THY brand identity checklist (THYAO her raporunda):**
  1. Kırmızı (#E81C28) header bantları + tablo header arka planı
  2. THY logosu (kuş/daire silueti) kapak ortası + iç sayfa sağ üst
  3. Kapak: tam sayfa fotoğraf benzeri arka plan + kırmızı overlay + "Türk Hava Yolları AO — THYAO"
  4. Footer: kırmızı sayfa numarası + "Finance X Platform | Confidential"
- **QA FAIL sinyali geldiğinde formatter self-check ekle** — `if qa_decision in ["fail", "conditional_pass"] → formatter_status = "BLOCKED — QA kapısı geçilmedi"; içerik üretme, COO'ya bildir.`
- **final_summary içeriğini HTML'ye dönüştür** — final_summary markdown/metin gelirse formatter bunu 12 bölüme map eder. Mapping olmadan "boş HTML" üretmek YASAK.

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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **HTML_ENVELOPE eksik → COO BLOCKED ✓** — COO doğru karar verdi. `<html lang="tr">...</html>` tam sarmalayıcı olmadan HTML çıktısı geçersiz. Self-check bu hatayı yakalamamış.
- **SPK disclaimer eksik** — "Bu rapor yatırım tavsiyesi değildir" footer notu zorunlu; atlandı.
- **8KB içerik — 50KB min eşiği çok altında** — Gerçek rapor içeriği 8KB; hedef minimum 50KB (~15 sayfa A4). Bu eşik 3 analizdir uygulanmıyor.
- **4 SVG grafik kontrolü yapılmadı** — Kural min 4 SVG; self-check sırasında grafik sayısı doğrulanmadı.
- **Self-check döngüsü çalışmadı** — Format completion check (HTML envelope, SPK, boyut, SVG sayısı, 12 bölüm) teslimden önce yapılmalıydı; yapılmadı.
- **THY marka renkleri uygulanmadı** — #E81932 kırmızı (heading/accent), turkuaz tablo başlıkları THYAO raporunun görsel kimliği. Uygulanıp uygulanmadığı kontrol edilmedi.

### Bundan Sonra:
- **Self-check THYAO zorunlu 6 kontrol (teslimden önce):**
  1. HTML tam envelope: `<html lang="tr">` açılış + `</html>` kapanış → PASS/FAIL
  2. SPK disclaimer footer: "Bu rapor yatırım tavsiyesi değildir" → PASS/FAIL
  3. Dosya boyutu ≥50KB → PASS/FAIL (50KB altı = BLOCKED)
  4. SVG grafik sayısı ≥4 → PASS/FAIL
  5. 12 bölüm başlığı mevcut → PASS/FAIL
  6. Marka renkleri: #E81932 THYAO kırmızı header → PASS/FAIL
  Herhangi biri FAIL → teslim YOK, fix yapılır.
- **THY marka kimliği:** Kırmızı #E81932 (heading/accent), turkuaz tablo başlıkları, her sayfada THY logosu üst sol. Kapak: THYAO BIST kodu + rapor tarihi + "Finance X Platform | Kurumsal Analiz".
- **50KB minimum = konfigürasyon olarak güncel** — Min 50KB eşiği kod seviyesinde yeni standart; 8KB eşiği artık geçersiz.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417)

### Eksikler:
- **HTML_ENVELOPE eksik — COO BLOCKED ✓ — 6. THYAO ihlali** — `<html>` veya `</html>` tag'i yok. Self-check tetiklenmedi; COO bu hatayı tespit etti. 6 turda aynı hata.
- **SPK_DISCLAIMER eksik — 6. ihlal** — "yatırım tavsiyesi değildir" footer/zorunlu bildirimler bölümünde yok. Şablona gömülü olması gereken bu direktif hâlâ uygulanmıyor.
- **8KB içerik — 50KB eşiği 6. kez ihlal edildi** — 8000 bytes PASS geçildi. Formatter'ın kendisi 50KB altı içerik üretmemeli; bu self-check adımının parçası.
- **Self-check döngüsü 6. THYAO'da da çalışmadı** — Zorunlu 6 kontrol (HTML envelope, SPK, boyut, SVG sayısı, 12 bölüm, marka rengi) teslimden önce çalıştırılmadı.
- **THYAO marka kimliği (#E81932/#1C2B50) uygulanıp uygulanmadığı belirsiz** — Report formatter çıktısında Finance X mavi/amber palet görünüyor; THYAO kırmızı-lacivert uygulanmadı.

### Bundan Sonra:
- **HTML_ENVELOPE + SPK_DISCLAIMER = şablona gömülü sabit (6. direktif, kod zorunlu)** — Bu iki element dinamik içerik yokken bile şablonda bulunmalı. Template dosyasına hard-coded.
- **Self-check 6 adım teslimden önce otomatik (değiştirilemez):**
  1. `<html lang="tr">...</html>` tam envelope → PASS/FAIL
  2. "yatırım tavsiyesi değildir" footer → PASS/FAIL
  3. Boyut ≥50KB → PASS/FAIL
  4. SVG grafik ≥4 → PASS/FAIL
  5. 12 bölüm başlığı mevcut → PASS/FAIL
  6. #E81932 header rengi (THYAO) → PASS/FAIL
  Herhangi biri FAIL → teslim YOK, otomatik fix + tekrar kontrol.
- **THYAO marka kimliği sabit:** #E81932 kırmızı (heading/accent), #1C2B50 lacivert, turkuaz tablo başlıkları. Finance X paleti THYAO raporunda kullanılamaz.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **HTML_ENVELOPE eksik → COO BLOCKED ✓** — COO doğru karar verdi. `<html lang="tr">...</html>` tam sarmalayıcı olmadan HTML çıktısı geçersiz; self-check bu hatayı yakalamamış.
- **SPK_DISCLAIMER eksik — 5. ihlal** — "Bu rapor yatırım tavsiyesi değildir" footer zorunlu direktif; 5 turda uygulanmadı. Artık kod seviyesinde şablona gömülmeli.
- **Dosya boyutu 8KB — 50KB eşiğinin çok altında (5. ihlal)** — Her turda aynı hata; MIN_PAYLOAD_SIZE direktifi 5 kez verildi. Kod değişikliği olmadan bu hata tekrarlanacak.
- **THYAO marka renkleri (#E81932, lacivert #1C2B50) uygulanmadı** — Finance X mavi/amber renk paleti kullanıldı; THYAO kurumsal kimliği uygulanmadı.
- **4 SVG grafik kontrolü yapılmadı** — Kural min 4 SVG; self-check sırasında grafik sayısı doğrulanmadı.
- **Self-check döngüsü çalışmadı** — 6 zorunlu kontrol (HTML envelope, SPK, boyut, SVG, bölümler, marka rengi) teslimden önce yapılmadı.

### Bundan Sonra:
- **HTML_ENVELOPE + SPK_DISCLAIMER = şablon olarak sabit (kod değişikliği gerekli)** — Bu iki element hiçbir koşulda atlanamaz. Template dosyasına gömülü; dinamik içerik eksik olsa bile sarmalayıcı ve footer sabit kalır.
- **50KB minimum = renderer seviyesinde kontrol** — Çıktı render edilmeden önce byte size ölçülür; <50KB → padding mekanizması veya "İçerik genişlet" tetikleyicisi. 8KB ile teslim artık teknik olarak bloke.
- **THYAO self-check 6 zorunlu adım (teslimden önce otomatik):**
  1. HTML tam envelope: `<html lang="tr">` + `</html>` → PASS/FAIL
  2. SPK disclaimer footer mevcut → PASS/FAIL
  3. Dosya boyutu ≥50KB → PASS/FAIL (altı = BLOCKED)
  4. SVG grafik sayısı ≥4 → PASS/FAIL
  5. 12 bölüm başlığı mevcut → PASS/FAIL
  6. Marka rengi #E81932 header'da → PASS/FAIL
  Herhangi biri FAIL → teslim YOK; otomatik fix + tekrar kontrol.
- **THYAO marka kimliği sabit referans:** #E81932 kırmızı (heading/accent), #1C2B50 lacivert (sidebar/nav), turkuaz tablo başlıkları. Finance X mavi/amber paleti THYAO raporunda kullanılamaz.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **HTML_ENVELOPE eksik → COO BLOCKED ✓** — COO doğru karar verdi. `<html lang="tr">...</html>` tam sarmalayıcı olmadan HTML geçersiz; self-check bu hatayı yakalamadı.
- **SPK_DISCLAIMER eksik — 7. ihlal** — "Bu rapor yatırım tavsiyesi değildir" footer zorunlu; 7 turda uygulanmadı. Artık şablona gömülmesi zorunlu.
- **Dosya boyutu ~8KB — 50KB eşiğinin çok altında (7. ihlal)** — 6 kez direktif verildi, hiçbir zaman uygulanmadı. Kod değişikliği olmadan bu hata tekrarlanacak.
- **THYAO marka renkleri (#E81932, #1C2B50) uygulanmadı — 7. ihlal** — Finance X mavi/amber renk paleti kullanıldı. Self-check sırasında marka rengi kontrolü yapılmadı.
- **SVG grafik sayısı kontrolü yapılmadı** — Kural min 4 SVG; self-check sırasında sayı doğrulanmadı.
- **Self-check döngüsü 7. turda da çalışmadı** — 6 zorunlu kontrol teslimden önce yapılmadı.

### Bundan Sonra:
- **HTML_ENVELOPE + SPK_DISCLAIMER = şablon olarak sabit (kod değişikliği gerekli — 7. direktif sonrası memory'de tekrar yazılmıyor)** — Template dosyasına gömülü olmalı; dinamik içerik eksik olsa bile sarmalayıcı ve footer sabit kalır.
- **50KB minimum = renderer seviyesinde kontrol** — Çıktı render edilmeden önce byte size ölçülür; <50KB → bloker. Kod değişikliği olmadan düzelmez.
- **THYAO self-check 6 zorunlu adım (teslimden önce otomatik):**
  1. HTML tam envelope → PASS/FAIL
  2. SPK disclaimer footer → PASS/FAIL
  3. Dosya boyutu ≥50KB → PASS/FAIL
  4. SVG grafik sayısı ≥4 → PASS/FAIL
  5. 12 bölüm başlığı → PASS/FAIL
  6. Marka rengi #E81932 header'da → PASS/FAIL

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **HTML_ENVELOPE eksik → COO BLOCKED ✓** — COO doğru karar verdi. `<html lang="tr">...</html>` tam sarmalayıcı olmadan HTML geçersiz; self-check bu hatayı önceden yakalayamadı.
- **SPK_DISCLAIMER eksik** — "Bu rapor yatırım tavsiyesi değildir" footer zorunlu; şablona gömülü olmadığından yine eksik kaldı.
- **Dosya boyutu ~8KB — 50KB eşiğinin çok altında** — THYAO'da tekrarlayan aynı hata; ASELS'e de taşındı.
- **Finance X mavi (#1e40af) kullanıldı — ASELS bordo (#8B1A1A) değil** — Her şirket için marka rengi self-check listesinde olmalı. ASELS = bordo (#8B1A1A), THYAO = kırmızı (#E81932), standart = Finance X mavi (#1e40af).
- **Self-check döngüsü çalışmadı** — 6 zorunlu kontrol teslimden önce yapılmadı.

### Bundan Sonra:
- **Şirket marka rengi tablosu (her analizde lookup et):**
  | Şirket | Birincil Renk | İkincil Renk |
  | THYAO | #E81932 (kırmızı) | #1C2B50 (lacivert) |
  | ASELS | #8B1A1A (bordo) | #1C3A5F (koyu mavi) |
  | EREGL | #E63329 (çelik kırmızı) | #1A3A5C (lacivert) |
  | Finance X default | #1e40af (mavi) | #f59e0b (amber) |
- **HTML_ENVELOPE + SPK_DISCLAIMER = şablon sabit (kod değişikliği — 2. ASELS direktifi)** — Template dosyasına gömülü olmalı; dinamik içerik eksik olsa bile sarmalayıcı ve footer sabit kalır.
- **Self-check 6 adım ASELS için de geçerli:**
  1. HTML tam envelope → PASS/FAIL
  2. SPK disclaimer footer → PASS/FAIL
  3. Dosya boyutu ≥50KB → PASS/FAIL
  4. SVG grafik sayısı ≥4 → PASS/FAIL
  5. 12 bölüm başlığı → PASS/FAIL
  6. Marka rengi #8B1A1A (ASELS bordo) header'da → PASS/FAIL
