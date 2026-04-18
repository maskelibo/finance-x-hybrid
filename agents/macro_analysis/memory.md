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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **TCMB politika faizi null** — EVDS key sağlanmadı gerekçesiyle. Bu kabul edilemez; EVDS'ye erişim yoksa WebSearch ile TCMB basın açıklaması okunabilir. Politika faizi Türkiye analizinin temel parametresidir.
- **CPI/PPI null, GDP null, BIST100 null** — Sadece FX (USD/TRY, EUR/TRY) üretilebildi. 6 zorunlu bölümden 5'i eksik.
- **İran-ABD jeopolitik analiz tamamen yok** — CEO pre-flight: "10 Orta Doğu rotası askıya, H1 2026 ~54,000 mn TRY tahmini kayıp." Bu havacılık analizinin en kritik makro olayı; macro_analysis jeopolitik zinciri kurmadı: İran krizi → rota kapatma → gelir kaybı → EBITDAR etkisi.
- **Havacılık sektörüne özgü makro transmission mekanizması yok** — Zorunlu bölümler: (1) Brent fiyatı → yakıt maliyeti (THYAO için $1 Brent = X TRY COGS etkisi), (2) USD/TRY → gelir çevirimi (USD hasılatın TRY'ye dönüşüm etkisi), (3) TÜFe → real ARPU erosion (bilet fiyatı artışı vs enflasyon), (4) TCMB faizi → finansman maliyeti (kira borçları). Hiçbiri üretilmedi.
- **Brent +%4.68 (bugün) → yakıt maliyeti etkisi hesaplanmadı** — CEO pre-flight'ta P1 olarak işaretlenmişti. Hedge oranı bilinmiyorsa "[VERİ YOK]" denilmeli ama Brent etkisi formülü kurulmalıydı.
- **Makro impact summary tablosu üretilmedi** — Tüm faktörlerin EBITDA/FCF delta'sı tek tabloda toparlanmadı.

### Bundan Sonra:
- **Politika faizi için EVDS yoksa WebSearch fallback ZORUNLU** — "TCMB politika faizi [tarih]" araması → güncel oran. Null bırakmak kabul edilmez. Kaynak: TCMB resmi basın açıklaması URL'si.
- **Havacılık sektörü makro zorunlu 5 bölüm:**
  1. Brent/Jet fuel → CASK etkisi ($1/bbl Brent = THYAO X mn USD yakıt maliyeti)
  2. USD/TRY → gelir çevirimi (hasılatın %90'ı USD bazlı → kur değişimi TRY etki)
  3. İran-ABD/Orta Doğu jeopolitik → rota kapasitesi → gelir kaybı TRY
  4. TCMB faizi → IFRS 16 kira faiz maliyeti (yeniden finansman senaryosu)
  5. Rusya üstgeçiş ücretleri → operasyonel maliyet (Rus hava sahası alternatif güzergah)
- **Jeopolitik zincir zorunlu: Olay → kanal → metrik → TRY etkisi** — "İran krizi" genel cümlesi değil: "10 rota × ortalama X uçuş/gün × Y TRY gelir/uçuş = Z mn TRY H1 kayıp" formülü.
- **Delta-update'te ÖNCE jeopolitik + FX güncel değerleri** — Delta bağlamı göz önüne alınarak: İran, Brent, USD/TRY güncel + etki zinciri. Standart makro bölümleri sonra.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **policy_rate/CPI/PPI/GDP/BIST100 tümü null — 4. direktif** — EVDS key yoksa WebSearch fallback direktifi üç kez verildi; uygulanmadı. Null bırakmak kabul edilemez.
- **Havacılık sektörüne özgü 5 transmission mekanizması üretilmedi** — Brent→CASK, USD/TRY→gelir çevirimi, İran-ABD jeopolitik→rota kaybı, TCMB faizi→IFRS 16 kira maliyeti, Rusya üstgeçiş ücretleri — direktif 3. kez verilmişti; hâlâ yok.
- **İran-ABD jeopolitik zincir yok** — CEO pre-flight P1: 10 rota askıya × tahmini gelir kaybı. Zincir kurulmadı: İran krizi → rota kapatma → ASK azalması → EBITDAR etkisi.
- **Brent +%4.68 → yakıt maliyeti hesaplanmadı** — Aynı gün P1 direktifi: $1/bbl Brent = THYAO yakıt maliyet delta formülü üretilmedi.
- **Makro impact summary tablosu yok** — Tüm faktörlerin EBITDA/FCF delta'sı tek özet tabloda toparlanmadı.

### Bundan Sonra:
- **EVDS yoksa 3 fallback sırasıyla dene (4. ve son direktif):** (1) TCMB basın açıklaması WebSearch, (2) TÜİK resmi sitesi, (3) Bloomberg HT. 3 kaynak başarısız → CEO eskalasyonu. Null = otomatik FAIL.
- **Havacılık makro 5 zorunlu bölüm (4. kez — kesinleşti):** Brent/CASK + USD/TRY gelir + İran-ABD + TCMB/IFRS16 + Rusya üstgeçiş. Her bölüm sayısal.
- **İran jeopolitik zincir formatı** — Rota sayısı × günlük sefer × ortalama TRY bilet geliri = TRY kayıp tahmini. Sektör proxy ile `[conf: LOW]` kabul edilir; null kabul edilmez.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **policy_rate/CPI/PPI/GDP/BIST100 tümü null — 3. THYAO raporunda aynı sorun** — EVDS key yoksa WebSearch fallback zorunlu direktifi verildi; uygulanmadı. Null bırakmak kabul edilemez.
- **Havacılık sektörüne özgü makro transmission mekanizması yok** — 5 zorunlu bölüm (Brent→CASK, USD/TRY→gelir, İran-ABD jeopolitik, TCMB faizi→IFRS16, Rusya üstgeçiş) hiçbiri üretilmedi.
- **İran-ABD jeopolitik zincir yok** — CEO pre-flight'ta P1 olarak işaretlendi. 10 rota askıya = H1 2026 ~54,000 mn TRY kayıp tahmini bağlamı; bu bilgi macro_analysis'te gelir → talep → gelir kaybı zinciriyle işlenmedi.
- **Brent +%4.68 → yakıt maliyeti etkisi yok** — $1/bbl Brent = THYAO X mn USD yakıt maliyeti formülü üretilmedi.
- **Makro impact summary tablosu üretilmedi** — Tüm faktörlerin EBITDA/FCF delta'sı tek tabloda toparlanmadı.

### Bundan Sonra:
- **Havacılık raporu = EVDS+WebSearch zorunlu** — Null dönerse: TCMB basın açıklaması (WebSearch "TCMB politika faizi Nisan 2026") → TÜİK resmi sitesi (CPI) → Bloomberg HT (BIST100). 3 kaynak başarısız → CEO eskalasyon. Null bırakma yasak.
- **Havacılık makro 5 zorunlu bölüm listesi (3. kez yazılıyor — artık uygulanmalı):**
  1. Brent/Jet fuel → CASK etkisi
  2. USD/TRY → gelir çevirimi (hasılatın %90'ı USD)
  3. İran-ABD/Orta Doğu jeopolitik → rota kapasitesi → TRY gelir kaybı
  4. TCMB faizi → IFRS 16 kira faiz maliyeti
  5. Rusya üstgeçiş ücretleri → operasyonel maliyet

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **policy_rate/CPI/PPI/GDP/BIST100 tümü null — 4. THYAO, 5. genel direktif** — EVDS key yoksa WebSearch fallback direktifi 4 kez verildi, uygulanmadı. Artık kalıcı FAIL: Null bırakan macro_analysis çıktısı COO tarafından otomatik reddedilecek.
- **Brent +%4.68 (aynı gün P1) → yakıt maliyeti hesaplanmadı** — "Her $1/bbl Brent = THYAO X mn USD yakıt maliyeti" formülü CEO pre-flight'ta işaretlenmişti. THYAO yakıt maliyeti ~35 USD/bbl hedge varsayımıyla bile senaryo kurulabilirdi; kurulmadı.
- **İran-ABD jeopolitik zincir 4. THYAO'da da yok** — 10 rota askıya → ASK azalması → EBITDAR etkisi → TRY kayıp hesabı. CEO pre-flight'ta "~54,000 mn TRY tahmini kayıp" bağlamı verildi; macro_analysis kullanmadı.
- **Havacılık sektörüne özgü 5 transmission mekanizması 4. kez üretilmedi** — Brent→CASK, USD/TRY→gelir çevirimi, İran-ABD→rota kaybı, TCMB faizi→IFRS16 kira maliyeti, Rusya üstgeçiş ücretleri — hepsi null.
- **Makro impact summary tablosu 4. kez eksik** — Tüm faktörlerin EBITDA/FCF delta'sı tek özet tabloda toparlanmadı.

### Bundan Sonra:
- **Null = otomatik FAIL — artık kesinleşti (4. direktif):** TCMB faizi null → WebSearch → TCMB basın açıklaması → TÜİK → Bloomberg HT. 3 kaynak başarısız → CEO eskalasyonu. Null çıktı COO kapısını geçemez.
- **Brent spike tetikleyicisi:** Brent günlük %1+ hareket = aynı gün macro_analysis'te THYAO yakıt maliyeti delta hesabı zorunlu. "Hedge oranı bilinmiyor → [conf: LOW]" kabul edilir; hesap tamamen atlamak kabul edilmez.
- **Havacılık makro 5 bölümü artık memory'de kodlanmış kural (4. kez — uygulanmadan geçilemez):**
  1. Brent/Jet fuel → CASK etkisi (THYAO $1/bbl = X mn USD)
  2. USD/TRY → gelir çevirimi (hasılatın ~%90 USD)
  3. İran-ABD/Orta Doğu jeopolitik → rota kaybı → TRY gelir tahmini
  4. TCMB faizi → IFRS 16 kira faiz maliyeti
  5. Rusya üstgeçiş ücretleri → operasyonel maliyet
- **Makro impact summary tablosu = her raporun zorunlu son bölümü** — Makro faktör | EBITDA Δ (mn TRY) | Güven seviyesi. Tablo yoksa çıktı gönderilmez.

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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **Tüm makro veri null — 3. THYAO analizi** — TCMB faiz oranı, CPI/PPI, USD/TRY, Brent fiyatı hepsinin THYAO'ya etki kanalı null döndü. Bu 3. tekrar; makro agent sistematik olarak başarısız.
- **Brent +%4.68 etkisi hesaplanmadı (aynı günde gerçekleşti)** — THYAO yıllık yakıt gideri biliniyorken Brent +%4.68 → CASK etkisi hesaplanabilirdi. Formül: yıllık yakıt gideri × Brent değişimi × hedging oranı.
- **İran-ABD jeopolitik gerilim analizi yok** — THYAO CEO değişiminin jeopolitik bağlamı (İran rotaları askıya alınmış) ve Brent volatilitesi ile İran krizi bağlantısı kurulmadı. Bu analizin kritik makro faktörü.
- **Geçiş mekanizmaları null** — "Brent arttı → THYAO'ya etkisi şudur" zinciri hiç kurulmadı. Rakam vermek yeterli değil; mekanizma zorunlu.
- **TCMB faiz → IFRS16 bağlantısı analiz edilmedi** — TCMB %47.5 → IFRS 16 kira yenileme faizleri → THYAO kira maliyeti artışı. Bu zincir zorunlu.

### Bundan Sonra:
- **THYAO makro analiz 5 zorunlu bölüm (her analizde, null = BLOCKED):**
  1. Brent → CASK: yıllık yakıt gideri × Brent %Δ × (1 - hedging oranı) = EBITDA etkisi (TRY)
  2. USD/TRY → gelir: USD hard gelir × kur %Δ = TRY gelir etkisi; USD yakıt × kur %Δ = maliyet etkisi; net
  3. İran-ABD jeopolitik: rota kapanma senaryosu → kapasite kaybı → gelir kaybı
  4. TCMB faiz → IFRS 16: kira yenileme faiz etkisi → yıllık kira maliyeti artışı
  5. Rusya üstgeçiş: üstgeçiş ücreti + Rusya-Çin hat kısıtlaması → operasyonel maliyet
- **Her bölümde sayısal geçiş mekanizması zorunlu** — "Brent arttı, negatif etki" anlatısı yetmez; "Brent +%5 → CASK +X TRY/RPK → EBITDA -Y mn TRY" formatı.

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
