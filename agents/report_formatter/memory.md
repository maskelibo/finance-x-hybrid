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
- **Min 15+ sayfa, sifir bos sayfa.** Her bolum icin min 3 paragraf + 1 tablo.
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
- **Sirket Marka Rengi Lookup Tablosu:**
  | Sirket | Birincil | Ikincil |
  |--------|---------|---------|
  | THYAO | #E81932 kirmizi | #1C2B50 lacivert |
  | ASELS | #8B1A1A bordo | #1C3A5F koyu mavi |
  | KCHOL | #003366 lacivert | #C41E3A kirmizi |
  | EREGL | #E63329 celik kirmizi | #1A3A5C lacivert |
  | BIMAS | #F47B20 turuncu | #003366 lacivert |
  | Finance X | #1e40af mavi | #f59e0b amber |
- **2026 Trend:** Portrait→landscape geçiş; interaktif navigasyon; ESG bölümü zorunlu; çok kanal marka tutarlılığı +%30 etkileşim.

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

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-25)*
