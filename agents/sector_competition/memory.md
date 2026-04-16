# Sector Competition Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **Her analizde sira:** Porter -> SWOT -> Benchmarking Scorecard -> Sektor Dinamikleri. Tutarli tut.
- **Tek dominant oyuncu = global peer zorunlu.** BIST'te karsilastirilabilir peer yoksa acikla, uluslararasi peers kullan.
- **Her benchmarking metric icin quartile distribution goster:** Max, Q3, Median, Q1, Min + sirket pozisyonu.
- **Peer grubu standardize:** Ayni sektor analizlerinde ayni 5-8 peer kullan (tutarlilik).
- **Macro trend -> sirket P&L linkage zorunlu.** Genel sektor yorumu KABUL EDILMEZ — spesifik transmission mekanizmasi goster.
- **Kaynak zorunlulugu:** Her iddia icin inline citation. Kaynaksiz bilgi rapora girmez.
- **Tahmin kullaniliyorsa "Estimated" isaretle** ve low confidence flag ekle.
- **Her peer rakamini resmi finansal rapor veya dogrulanmis piyasa kaynagina bagla.**
- **Porter puan degisim yonu (oku) her tabloda goster:** Statik puan + yon (yukari/asagi/yatay).
- **SELL analist gerekcesi sektor analizi ile iliskilendirilmeli.**
- **Hazirlik mesaji birakma; her gorevde tamamlanmis peer skor karti uret.**
- **WebSearch izni yoksa:** (a) pipeline verisi kullan, (b) acikca flag koy, (c) macro agent'tan veri iste.
- **Celiski tespiti -> kanit bazli RESOLVED/CONTESTED label.** Her raporun sonunda celiski ozet tablosu.


## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **Quartile distribution tablosu eksik** — Her benchmarking metriği için "Max / Q3 / Median / Q1 / Min + EREGL pozisyonu" format zorunlu; sadece ortalama veya peer tablosu yeterli değil.
- **Peer rakamları için kaynak URL/rapor tarihi eksik** — ArcelorMittal, POSCO, Nippon Steel benchmark değerleri kaynaksız yazıldı. Her peer'ın EV/EBITDA ve tCO2/ton değeri için doğrulama bağlantısı gerekli.
- **CBAM kümülatif maliyet tablosu sayısal hesaplanmadı** — AB ihracat payı kesin % bilinmediğinden hesap yapılamadı; ancak "kesin % bilinmiyor → üst sınır × genel AB çelik ihracat payı (%X)" proxy ile sayısal aralık verilmeliydi.
- **SELL analist gerekçesi sektör analizi ile ilişkilendirilmedi** — 0 SELL analist durumu risk olarak değerlendirilmedi; CBAM + EPDK + Çin dumpinge karşın neden SELL yok? Bu asimetrik risk sinyali sektör analizinden desteklenmedi.
- **Benchmarking scorecard çıktısı tam format değil** — Porter'ın Five Forces sonrası zorunlu benchmarking scorecard (6+ metrik × 5+ peer, quartile pozisyon) eksik kaldı.

### Bundan Sonra:
- **Çelik sektörü peer grubu standart 5 oyuncu** — ArcelorMittal (global), POSCO, Nippon Steel, Nucor (EAF benchmark), thyssenkrupp. Her analizde aynı 5 peer kullan; tutarlılık şart.
- **CBAM hesabı için proxy yaklaşım** — AB ihracat payı tam bilinmiyorsa sektör ortalaması (%15-20 Türk çelik ihracatının AB'ye gittiği tahmini) ile üst sınır hesabı yap; "bilinmiyor" deme.
- **Quartile tablosu zorunlu çıktı formatı** — Benchmarking bölümünde her metrik için mutlaka Max/Q3/Median/Q1/Min tablosu ve EREGL'in bu dağılımdaki yeri.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **Çıktı kesildi — YKBNK bankacılık bölümü sonrası segment analizleri görünmüyor** — Porter analizi YKBNK için tamamlandı; TUPRS, FROTO, ARCLK, EREGL, TCELL segmentleri çıktıda yer almıyor. Holding analizinde 6 segmentin tamamı için Porter yapılması zorunlu.
- **Peer quartile dağılım tabloları eksik** — YKBNK bankacılık bölümü için NIM/NPL/CET1 peer benchmarkları genel anlatıyla verildi; Max/Q3/Median/Q1/Min tablosu yok. Bu formatsızlık tüm segment analizlerinde devam etti.
- **Fitch outlook indiriminin YKBNK NIM senaryosu etkisi kesildi** — BDDK KAPL açıklaması bölümü "BDDK KAP Açıkl" ile kesildi; tamamlanmadı. Skor kartına etki açıklanamadı.
- **Kaynak URL/tarih peer benchmark değerlerinde eksik** — "TCMB 37% politika faizi", "AKBNK NIM %4.1, GARAN %4.3" gibi rakamlar kaynaksız verildi.

### Bundan Sonra:
- **Holding analizinde her segmente ayrı Porter tablosu** — 6 segment × 5 güç = 30 satırlık minimum. Truncation riski varsa her segment için özet skor + tek paragraf yorum; tam Porter sonra appendix'e.
- **Quartile dağılım tablosu holding raporlarında da zorunlu** — Bankacılık: NIM/NPL/CET1 peer quartile. Rafineri: crack spread/EBITDA marjı quartile. Bu tablolar olmadan "YKBNK sektör ortalamasında" iddiası kanıtsız.
- **Kaynak etiketleme standart** — Her peer rakamı: [Kaynak: kurum adı + tarih]. "AKBNK NIM %4.1 [AKBNK FY2025 earnings, Mart 2026]" formatı.

---

*Vaka bazli dersler: case_lessons.md | Domain bilgisi: knowledge.md*
