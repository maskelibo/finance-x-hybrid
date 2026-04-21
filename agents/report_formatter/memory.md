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

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
