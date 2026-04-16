# Report Formatter Agent — Kalıcı Kurallar

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

## Bilinen Hatalar

- KCHOL + TCELL: HTML raporu YARIM KALDI — CSS baslangici var ama icerik yok. Truncation YASAK.
- KCHOL: Agent CALISMADI — "I'm ready to continue" dedi ama output uretmedi. DOGRUDAN raporu al, formatla, output uret.
- TCELL: PDF'te 1 sayfa veri 1 sayfa bosluk — CSS page-break hatasi. `page-break-before: always` kullan, `page-break-after: always` kullanma.
- TUPRS: Veri kalitesi uyarilari raporda gorunmuyor. Degerleme bolumunde eksik veri dipnotu yok.
- EREGL: Icerik govdesi kesiliyor. Dipnot/kaynak sistemi yeterince gorunur degil.

---
*Bu dosya her çalışmada otomatik yüklenir. Değişiklik yapmadan önce CEO onayı alın.*
