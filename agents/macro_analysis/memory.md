# Macro Analysis Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **Her makro faktor icin sayisal sirket etkisi hesapla.** "Izlenmeli" demek YASAK. Ornek: "Her $1 Brent degisimi = X TL EPS etkisi."
- **Holding sirketlerinde segment + KONSOLIDE impact zorunlu:** Weighted average = Sum(segment EBITDA contribution % x segment macro impact %).
- **Konsolide FX sensitivity:** Sum(segment net FX position) -> TL %10 depreciation -> EBITDA/equity etkisi TRY.
- **Savunma/havacilik/guvenlik sektoru icin Jeopolitik Analiz bolumu ZORUNLU.**
- **PPI protokolu:** TUIK -> TCMB EVDS -> Bloomberg. Guncel ay yayinlanmadiysa tarihi belirt.
- **Reel kredi buyumesi zorunlu:** Nominal growth - inflation = real growth.
- **Veri kokeni etiketleme:** Her tablo hucresinde `primary`, `secondary`, `inference` isaretle.
- **Web teyidi yoksa dusuk/orta guven disina cikma;** kesin sayi yerine aralik ve acik uyari kullan.
- **Enerji maliyeti soklari (BOTAS/EPDK) acil gorev:** Karar yayinlandiginda sayisal etki hesabi AYNI GUN ciktiya eklenmeli.
- **Jeopolitik analizi zorunlu zincirle yaz:** Olay -> enerji/lojistik/talep -> fiyat/marj -> sirket etkisi.

## Zorunlu Kontrol Listesi

**Her raporda zorunlu bolumler:**
1. TCMB faiz + enflasyon durumu (politika faizi, TUFE, reel faiz)
2. PPI-CPI spread analizi (>0.3pp = kirmizi alarm)
3. FX transmission channels (export revenue +, import cost -, BS FX debt -, NPL-FX)
4. Sektor-spesifik transmission mekanizmasi
5. Jeopolitik bolum (ilgili sektorler icin)
6. Makro impact summary tablosu (segment bazli weighted)

**Enerji/rafineri ek zorunlu 5 bolum:**
1. WTI-Brent spread ve marj etkisi
2. IEA vs OPEC talep projeksiyonu karsilastirmasi
3. Zorunlu stok yukumlulugu finansal maliyeti
4. Turkiye enerji altyapisi (TurkAkim/BTC/Ceyhan)
5. Endustriyel enerji maliyeti (BOTAS gaz + elektrik) -> OPEX baglantisi sayisal

**Celik/emtia ek zorunlu 5 bolum:**
1. Hammadde fiyat transmisyon parametreleri ($1/ton -> EBITDA TRY X)
2. Enerji maliyeti transmisyonu (BOTAS +%1 -> yillik COGS TRY Z)
3. Ihracat fiyati transmisyonu (AB HRC eur/ton -> gelir TRY etkisi)
4. AB Safeguard + CBAM kumulatif etkisi tablosu
5. USD/TRY senaryosu -> ihracat geliri

**Telekom ek zorunlu 4 katman:**
1. TCMB Faiz -> Consumer Purchasing Power -> postpaid churn
2. Enflasyon -> Real ARPU Erosion
3. FX Depreciation -> Multi-Channel (roaming + handset COGS + FX debt)
4. BTK Regulatory Transmission (spectrum fee, revenue share, interconnection)


## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **Jeopolitik bölüm eksik** — İran-ABD gerilimi → Hürmüz Boğazı → enerji maliyeti zinciri; Rusya-Ukrayna → küresel çelik arz/talep dengesizliği analizi yapılmadı. CEO kontrol listesinde "Jeopolitik bağlam (İran-ABD, Rusya-Ukrayna etkisi)" zorunlu.
- **AB Safeguard kümülatif etkisi sayısal değil** — TRK −%47 AB kota kesintisi (1 Temmuz 2026) için gelir kaybı TRY olarak hesaplanmadı.
- **Makro impact summary tablosu bağımsız bölüm olarak sunulmadı** — Tüm makro faktörlerin EBITDA/FCF etkisi tek özet tabloda toparlanmadı.
- **Hammadde transmisyon parametreleri sözel kaldı** — "$1/ton demir cevheri → EBITDA TRY X" ve "BOTAŞ +%1 → COGS TRY Z" formatında sayısal tablo eksik. Enerji maliyeti transmisyonu için EPDK %18.61 artışının EBITDA etkisi hesaplandı ✓ ama demir cevheri/kok kömürü transmisyonu eksik.
- **USD/TRY senaryosu → ihracat geliri hesabı eksik** — Çelik zorunlu 5. madde; çıktıda görünmüyor.

### Bundan Sonra:
- **Çelik analizlerinde jeopolitik zincir zorunlu** — Rusya-Ukrayna (çelik arz) + İran-ABD (enerji) + Çin dampingi (HRC fiyat) → her birini EBITDA etkisiyle sayısal göster.
- **AB Safeguard TRK kota etkisi = çelik zorunlu 4. madde** — Kota miktarı × EREGL ihracat payı = gelir kaybı TRY; AB payı belirsizse sektör proxy (%15-20) kullan.
- **Makro impact summary tablosu çıktının son sayfası olmalı** — Tüm kalemlerin EBITDA/FCF delta'sı tek tabloda; "bağlantı kuruldu" cümleleri değil, sayısal tablo.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **Rusya-Ukrayna etkisi hiç ele alınmadı** — Chairman zorunlu metrikleri: "Jeopolitik bağlam (İran-ABD, Rusya-Ukrayna etkisi)". İran-ABD var ✓; Rusya-Ukrayna yok. KCHOL portföyünde EREGL (çelik: küresel çelik arz dengesi), TUPRS (enerji: Rus ham petrol alternatifleri) doğrudan etkileniyor.
- **Makro impact summary tablosu (tek özet) üretilmedi** — Her faktörün EBITDA/FCF delta'sı tek tabloda toparlanmadı. Ayrı ayrı anlatılar var ✓ ama Chairman/COO'nun görebileceği "hangi makro değişken ne kadar EBITDA etkisi" tablosu eksik.
- **EREGL/CBAM makro analiz katmanında ele alınmadı** — CBAM 1 Temmuz 2026 aktivasyonu segment_competition'da geçiyor; ama macro_analysis segment etkisini makro → segment geçiş mekanizmasıyla sayısallaştırmadı (örn: AB ETS fiyatı × EREGL ihracat payı × tCO2/ton).
- **TCMB rezerv kaybı 50 milyar dolar sistemik risk analizi kısa kaldı** — Büyük bir uyarı verildi ✓ ama "Bu senaryo KCHOL'u nasıl etkiler?" sorusu beş segmente geçiş mekanizmasıyla ele alınmadı.

### Bundan Sonra:
- **Rusya-Ukrayna zorunlu olarak her Türk holding analizine dahil** — Çelik (HRC arz dengesi, Ukrayna ihracatı), enerji (alternatif rota riskleri), tahıl/gıda (tüketim talebi) kanalları. KCHOL için en az EREGL ve TUPRS segmentine geçiş mekanizması.
- **Makro impact summary tablosu son çıktı sayfası** — Her analizin bitişine: Makro faktör | Segment | EBITDA Δ (mn TL) | Güven. Tek tabloda tüm makro faktörler.
- **Holding analizinde weighted macro impact** — Sum(segment EBITDA katkısı % × segment makro etki %) = konsolide ağırlıklı makro etkisi. Bu hesap her holding raporunda zorunlu.

---

*Vaka bazli dersler: case_lessons.md | Domain bilgisi: knowledge.md*
