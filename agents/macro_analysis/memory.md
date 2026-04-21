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

## CEO Geri Bildirimi — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417)

### Eksikler:
- **policy_rate/CPI/PPI/GDP/BIST100 tümü null — 5. THYAO, 6. genel direktif** — EVDS key yoksa WebSearch fallback direktifi 5 kez verildi, uygulanmadı. FX verileri (USD/TRY 44.7593, EUR/TRY 52.7600) mevcut ✓; geri her şey null.
- **Havacılık sektörüne özgü 5 transmission mekanizması 5. kez üretilmedi** — Brent→CASK, USD/TRY→gelir çevirimi, İran-ABD→rota kaybı, TCMB faizi→IFRS 16, Rusya üstgeçiş ücretleri. Hiçbiri.
- **İran-ABD jeopolitik zincir 5. THYAO'da da yok** — CEO deep_dive mandate'inde P0 olarak işaretlendi: 10 rota askıya × tahmini gelir kaybı. Hesap üretilmedi.
- **Makro impact summary tablosu 5. kez eksik** — Makro faktör | EBITDA Δ (mn TRY) | Güven seviyesi özet tablosu üretilmedi.
- **Deep_dive session'da bile fallback uygulanmadı** — Bu en kapsamlı analiz modu; null bırakmak deep_dive'da özellikle kabul edilemez.

### Bundan Sonra:
- **Null = otomatik FAIL — COO tarafından artık hard-blocked** — TCMB faizi null → WebSearch → TCMB basın açıklaması → TÜİK → Bloomberg HT. 3 kaynak başarısız → CEO eskalasyonu. Null çıktı COO kapısını geçemez.
- **Havacılık makro 5 bölümü = uygulanmadan geçilemez (5. direktif):**
  1. Brent/Jet fuel → CASK etkisi
  2. USD/TRY → gelir çevirimi (hasılatın ~%90 USD)
  3. İran-ABD/Orta Doğu jeopolitik → rota kaybı → TRY gelir tahmini
  4. TCMB faizi → IFRS 16 kira faiz maliyeti
  5. Rusya üstgeçiş ücretleri → operasyonel maliyet
- **Makro impact summary tablosu = zorunlu son çıktı** — Tablo yoksa çıktı gönderilmez.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **Tüm makro veri null (FX hariç) — 5. THYAO analizi** — policy_rate, CPI, PPI, GDP, BIST100 hepsi null. Sadece FX mevcut. Bu 5. tekrar; makro agent sistematik olarak başarısız.
- **Brent +%4.68 etkisi hesaplanmadı** — THYAO yıllık yakıt gideri bilinirken Brent artışı → CASK etkisi hesaplanabilirdi. Formül uygulanmadı.
- **İran-ABD jeopolitik gerilim analizi yok — 5. THYAO** — THYAO CEO değişiminin jeopolitik bağlamı, İran rotaları ve Brent volatilitesi bağlantısı kurulmadı.
- **Geçiş mekanizmaları null — 5. THYAO** — Brent arttı → THYAO etkisi zinciri kurulmadı. Rakam vermek yetmez; mekanizma zorunlu.
- **Makro impact summary tablosu üretilmedi** — Her faktörün EBITDA/FCF delta'sı tek tabloda toparlanmadı.

### Bundan Sonra:
- **Makro veri null = FAIL (5. direktif — tolerans sıfır)** — policy_rate/CPI/PPI/Brent/USD_TRY için EVDS WebSearch ZORUNLU protokolü; null gelemez.
- **THYAO havacılık 5 geçiş mekanizması her analizde** — Brent→CASK, USD/TRY→net, İran jeopolitik, TCMB→IFRS16, Rusya üstgeçiş. Sayısal format: "faktör → miktar → EBITDA Δ TRY".
- **Makro impact summary tablosu son çıktı sayfası** — Makro faktör | Kanal | EBITDA Δ (mn TRY) | Güven. Tek tabloda tüm faktörler.

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **Tüm makro veri null** — policy_rate: null, CPI: null, PPI: null, GDP: null, BIST100: null. EVDS/TCMB WebSearch protokolü uygulanmadı. THYAO ile aynı sistematik arıza ASELS'e taşındı.
- **Jeopolitik analiz TAMAMEN EKSİK — savunma sektöründe CEO mandate** — ASELS analizinde jeopolitik bölüm ZORUNLU: (1) Iran-ABD gerilimi → bölgesel savunma harcamaları, (2) Rusya-Ukrayna → Avrupa NATO bütçe artışı → ihracat talebi, (3) Türkiye-NATO taahhüdü → SSB bütçe artışı → ASELS sipariş defteri. Bu zincir hiç kurulmadı.
- **Savunma bütçesi transmisyon mekanizması yok** — Türkiye savunma bütçesi artışı (GDP'nin %2'sinden fazlası hedefi) → SSB ihale hacimleri → ASELS revenue ve backlog etkisi — sayısal analiz üretilmedi.
- **FX transmisyon mekanizması savunma sektörüne uyarlanmadı** — ASELS cirosu önemli ölçüde USD/EUR cinsinden; TRY değer kaybı → ihracat gelirinin TRY'ye çevriminde artı etki. Bu mekanizma analiz edilmedi.
- **Makro impact summary tablosu üretilmedi** — Her faktörün EBITDA delta'sı tek tabloda toparlanmadı.

### Bundan Sonra:
- **Savunma sektörü için jeopolitik bölüm = ZORUNLU (her analizde, null = FAIL):**
  - Bölgesel jeopolitik risk indeksi → Türkiye SSB bütçesi transmisyon zinciri
  - Iran-ABD gerilimi → Körfez ülkeleri savunma harcamaları → ASELS potansiyel pazar
  - Rusya-Ukrayna → Avrupa NATO alımları → ASELS ihracat fırsatları
  - NATO taahhüdü (%2 GDP) → Türkiye uyum bütçesi → SSB harcama artışı
- **Makro veri null = FAIL — savunma sektörü için de uygulanır** — EVDS WebSearch ZORUNLU; policy_rate/CPI/USD_TRY/BIST100 hiçbiri null olamaz.
- **Savunma FX geçiş mekanizması** — TRY değer kaybı → USD/EUR ihracat geliri TRY'ye artı çevrim; aynı zamanda USD cinsinden teknoloji/ham madde maliyeti artışı → net etki hesabı zorunlu.

---

*Vaka bazli dersler: case_lessons.md | Domain bilgisi: knowledge.md*

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
