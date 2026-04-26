# Sector Competition Agent — Katman 2b: Vaka Bazlı Dersler

> Bu dosya CEO geri bildirimleri, rapor bazlı öğrenimler ve sektör bilgi bankasını içerir.
> Agent gerektiğinde bu dosyayı açar; her çalıştırmada otomatik yüklenmez.

---

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Quartile distribution gösterilmedi** — Peer benchmarking tablosunda sadece THYAO vs PEGASUS iki-şirket karşılaştırması yapıldı; Max/Q3/Median/Q1/Min + şirket pozisyonu formatı uygulanmadı.
- **Working capital peer tablosu eksik** — DSO/DIO/DPO/CCC için peer karşılaştırması (havacılık sektörü normu) yapılmadı.
- **Porter puan değişim yönü (ok) gösterilmedi** — Statik 5-kuvvet skoru verildi; yön oku (yukari/asagi/yatay) ve trend analizi eksik.
- **SWOT framework eksik** — Porter Five Forces yapıldı, SWOT ayrıca sunulmadı. Kural: Porter + SWOT ikisi birlikte zorunlu.
- **Segment marj karşılaştırması yapılmadı** — Turkish Cargo vs yolcu vs teknik gelir marjları sektör normlarıyla karşılaştırılmadı.
- **IST slot tavanı 2028 etkisi analiz edildi ✓** — Doğru tespit; ancak büyüme tavanı sonrası stratejik alternatifleri (hub diversification, slot trading) tartışılmadı.

### Bundan Sonra:
- **Havacılık peer seti standardize** — THYAO analizinde: Ryanair, Wizz Air, IAG, Lufthansa, Air France-KLM, Delta, Emirates. Peer median her metrik için zorunlu.
- **Quartile sıralaması zorunlu** — Her benchmarking metriği için 5 dilim: Max/Q3/Median/Q1/Min + THYAO pozisyonu. İki-şirket karşılaştırması yetmez.
- **SWOT Porter ile birlikte** — Porter analizi tamamlandıktan hemen sonra SWOT tablosu; her SWOT maddesi en az 1 kanıtla desteklenmeli.
- **Working capital peer tablosu havacılık sektörü için** — Havacılıkta DIO düşük (kargo olmak üzere), DPO yüksek; sektör normunu peer tablosunda göster.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **SWOT framework çıktıda görünmüyor** — Porter Five Forces + Sektör Outlook verildi; SWOT ayrıca sunulmadı. Kural: Porter + SWOT ikisi zorunlu.
- **Quartile distribution eksik** — BIMAS vs SOKM iki-şirket karşılaştırması yapıldı; Max/Q3/Medyan/Q1/Min formatında sektör dilim analizi yok.
- **Working capital peer tablosu yok** — Perakende sektöründe DIO (stok devir günü) ve DPO (borç ödeme günü) kritik; BIMAS vs SOKM vs Jeronimo Martins WC karşılaştırması eksik.
- **Deflasyon senaryosu analizi iyi ✓** — TÜFE %15-20'ye normalizasyon senaryosu, özel marka deflasyon baskısı ve SOKM M&A riski — bunlar güçlü analizdi.
- **Antitrust riski analizi iyi ✓** — AGBI soruşturması senaryoları ve BIMAS avantajı (EDLP modeli) iyi analiz edildi.

### Bundan Sonra:
- **Perakende sektörü standart peer seti:** BIMAS, SOKM, A101 (tahminsel), Jeronimo Martins (Biedronka benchmark), Pepco. Her analiz için bu 4-5 peer standardize edilmeli.
- **Perakende-spesifik Porter + SWOT:** Porter'da alıcı gücü kalemi için özel marka mix ve fiyat esnekliği analizi; SWOT'ta private label erozyon güçlü zayıflık maddesi olarak her zaman yer almalı.
- **WC peer tablosu perakende için zorunlu ek:** DIO (stok/COGS x 365) + DPO (ticari borc/COGS x 365) + Revenue per Store — her metrik için peer median ve BIMAS pozisyonu.
- **SOKM finansal referans değerleri (Nisan 2026):** Revenue ~350B TRY tahmin, EBITDA marjı ~2.6%, pazar payı ~8.3%, mağaza ~10.500 (181 kapanış 2024). Gelecek BIMAS/perakende analizlerinde bu baz rakamlar kullanılsın.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **SWOT output truncated** — Fırsatlar (Opportunities) bölümü "Iskonto Normalizasyonu: %35'e dönüş = +20% NAV; %25'e d..." ile kesildi. Tehditler (Threats) hiç görünmüyor. Kural: tablo yarıda kalırsa Summary + Detail JSON ikiye böl.
- **Quartile distribution eksik** — Porter Five Forces tabloda peer karşılaştırması yok; "KCHOL Grubu" tek firma olarak değerlendirildi. Holding peer seti (SAHOL, MAN-küresel holdingler) eksik.
- **IFRS 8 %0 nedeniyle peer EBITDA marjı karşılaştırması yapılamadı** — Bunu "CONDITIONAL BLOCKED" olarak doğru işaretledi ✓; ancak "downstream valuation_agent alternatif peer set kullanmalı" önerisi üretildi — upstream veriyi çekme girişiminde bulunulmadı.
- **Working capital peer tablosu yok** — DSO/DPO/CCC için holding peer karşılaştırması yapılamadı (holding için zaten anlamlı olmayabilir); ama "holding holding için CCC anlamsız — segment bazlı WC verilmeli" açıklaması da yok.
- **Segment-level Porter analizi yok** — KCHOL için 5 ana segment (Enerji, Bankacılık, Otomotiv, Telekom, Çelik) her biri kendi Porter dinamiğine sahip; holding-level Porter yüzeysel; segment ayrımı yapılmadı.
- **Yönetim görüşü doğrulanamadı** — "[YÖNETİM GÖRÜŞÜ]" placeholder'ları "faaliyet raporu PDF çekilmedi" nedeniyle doldurulamadı. Koç Holding 2025 FY investor presentation veya earning call transcript alternatif kaynak olarak denenmedi.

### Bundan Sonra:
- **Holding peer seti standardize et** — KCHOL için her zaman: SAHOL (Sabancı), MAN (Alman konglomera), Koç grup bağlı ortaklıkları değil → peer = diğer Türk holdingleri + seçili global holdingler. Quartile distribution bu peer seti ile.
- **SWOT truncation önlemi** — SWOT 4 bölümünün (S/W/O/T) hepsini ilk çıktıda tamamla; truncation riski varsa önce S+W, sonra O+T ayrı mesajda gönder.
- **Segment-level Porter zorunlu** — Holding için Porter'ı konsolide düzeyde değil, en az 3 ana segment için ayrıca yaz: Enerji (TUPRS), Bankacılık (YKBNK/AKBNK), Otomotiv (FROTO). Her segmentin farklı tehdit profili var.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **Çıktı PARTIAL olarak işaretlendi** — Upstream reconciliation bloker nedeniyle peer benchmark tamamlanmadı.
- **Segment bazlı peer karşılaştırması eksik** — Bankacılık (Akbank vs ISCTR/GARAN), Enerji (Enerjisa vs AKSEN), Çimento (Çimsa vs global çimento) ayrı ayrı yapılmadı.
- **SWOT tablosu truncated** — THREAT bölümü "İran savaşı + Hürmüz ablukası (B" ile kesildi.
- **Sektör ömür döngüsü analizi holding genelinde yapıldı** — Segment bazında ayrıştırılmadı (bankacılık farklı lifecycle, perakende farklı, enerji farklı).

### Bundan Sonra:
- **Upstream bloker ≠ partial output gerekçesi:** Reconciliation bloker olsa bile mevcut verilerle tam analiz yap; eksik kısım için [PENDING: upstream veri] flag'i koy, bölümü atlama.
- **SWOT her segment için ayrı:** Holding SWOT'u yanında Bankacılık / Enerji / Sanayi / Perakende alt-SWOT'ları ZORUNLU. Holding indirimi her segmentin zayıflığından oluşur.
- **Truncation YASAK:** SWOT yarım bırakılamaz; bölümü iki mesajda gönder.

## Son 3 Raporun Ogrenimleri

- **EREGL Delta #2 (2026-04-13):** Yonetim gorusu entegrasyonu deger katti. CBAM rekabet asimetrisi tanimlandi. Porter yon oku formati calistirildi. EBIT/Faiz vs Net Borc/EBITDA ikilisi — ikisini ayri goster. Kalite: 0.82 CONDITIONAL PASS.
- **EREGL BIST Peer (2026-04-13):** Cekirdek vs genisletilmis peer ayrimi sart. KAP+S&P hibrit set pratik cozum (confidence=medium). EREGL zayif noktasi artik marj degil degerleme/leverage.
- **TUPRS (2026-04-12):** Tek oyunculu sektor = global peer. Marj paradoksu (NCI 14.5 ama EBITDA %7.47 < peer %9.6). Refinery margin $/bbl ana KPI. Net nakit sektorde anomali.

## Sektor Bilgi Bankasi

**TUPRS Peer:** HelleniQ (%11.5 EBITDA, $16.4/bbl), Motor Oil (~%9.6, ~$12), PKN Orlen (%14.8), ENI (~%8.5, $11.7/bbl). TUPRS: %7.47, $6.0-6.5/bbl, net nakit.
**EREGL Peer:** ArcelorMittal ($111/ton, 1.2x leverage), SSAB (~$150+/ton, 0.8x), Tata Steel (~$75-85/ton, 2.5-3x). EREGL: $64/ton, ~1.9x. Kardemir: zarar, >5x.
**CBAM EREGL:** Default EUR100.55/ton, dogrulanmis ~EUR40-50/ton. AB ihracat ~745K ton -> ~EUR75M/yil.
**AB HRC (Nisan 2026):** Kuzey Avrupa EUR720/ton, Guney EUR699/ton.
**Conglomerate discount:** Global ortalama %13-15. SAHOL %30->%15 basardi (tech pivot, portfolio simplification).


## Ek CEO Geri Bildirimleri (memory.md'den taşındı)

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Quartile distribution gösterilmedi** — Peer benchmarking tablosunda sadece THYAO vs PEGASUS iki-şirket karşılaştırması yapıldı; Max/Q3/Median/Q1/Min + şirket pozisyonu formatı uygulanmadı.
- **Working capital peer tablosu eksik** — DSO/DIO/DPO/CCC için peer karşılaştırması (havacılık sektörü normu) yapılmadı.
- **Porter puan değişim yönü (ok) gösterilmedi** — Statik 5-kuvvet skoru verildi; yön oku (↑↓→) ve trend analizi eksik.
- **SWOT framework eksik** — Porter Five Forces yapıldı, SWOT ayrıca sunulmadı. Kural: Porter + SWOT ikisi birlikte zorunlu.
- **Segment marj karşılaştırması yapılmadı** — Turkish Cargo vs yolcu vs teknik gelir marjları sektör normlarıyla karşılaştırılmadı.
- **IST slot tavanı 2028 etkisi analiz edildi ✓** — Doğru tespit; ancak büyüme tavanı sonrası stratejik alternatifleri (hub diversification, slot trading) tartışılmadı.

### Bundan Sonra:
- **Havacılık peer seti standardize** — THYAO analizinde: Ryanair, Wizz Air, IAG, Lufthansa, Air France-KLM, Delta, Emirates. Peer median her metrik için zorunlu.
- **Quartile sıralaması zorunlu** — Her benchmarking metriği için 5 dilim: Max/Q3/Median/Q1/Min + THYAO pozisyonu. İki-şirket karşılaştırması yetmez.
- **SWOT Porter ile birlikte** — Porter analizi tamamlandıktan hemen sonra SWOT tablosu; her SWOT maddesi en az 1 kanıtla desteklenmeli.
- **Working capital peer tablosu havacılık sektörü için** — Havacılıkta DIO düşük (kargo olmak üzere), DPO yüksek; sektör normunu peer tablosunda göster.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **SWOT framework çıktıda görünmüyor** — Porter Five Forces + Sektör Outlook verildi; SWOT ayrıca sunulmadı. Kural: Porter + SWOT ikisi zorunlu.
- **Quartile distribution eksik** — BIMAS vs SOKM iki-şirket karşılaştırması yapıldı; Max/Q3/Medyan/Q1/Min formatında sektör dilim analizi yok.
- **Working capital peer tablosu yok** — Perakende sektöründe DIO (stok devir günü) ve DPO (borç ödeme günü) kritik; BIMAS vs SOKM vs Jeronimo Martins WC karşılaştırması eksik.
- **Deflasyon senaryosu analizi iyi ✓** — TÜFE %15-20'ye normalizasyon senaryosu, özel marka deflasyon baskısı ve SOKM M&A riski — bunlar güçlü analizdi.
- **Antitrust riski analizi iyi ✓** — AGBI soruşturması senaryoları ve BIMAS avantajı (EDLP modeli) iyi analiz edildi.

### Bundan Sonra:
- **Perakende sektörü standart peer seti:** BIMAS, SOKM, A101 (tahminsel), Jeronimo Martins (Biedronka benchmark), Pepco. Her analiz için bu 4-5 peer standardize edilmeli.
- **Perakende-spesifik Porter + SWOT:** Porter'da alıcı gücü kalemi için özel marka mix ve fiyat esnekliği analizi; SWOT'ta private label erozyon güçlü zayıflık maddesi olarak her zaman yer almalı.
- **WC peer tablosu perakende için zorunlu ek:** DIO (stok/COGS × 365) + DPO (ticari borç/COGS × 365) + Revenue per Store — her metrik için peer median ve BIMAS pozisyonu.
- **SOKM finansal referans değerleri (Nisan 2026):** Revenue ~350B TRY tahmin, EBITDA marjı ~2.6%, pazar payı ~8.3%, mağaza ~10.500 (181 kapanış 2024). Gelecek BIMAS/perakende analizlerinde bu baz rakamlar kullanılsın.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **SWOT output truncated** — Fırsatlar (Opportunities) bölümü "Iskonto Normalizasyonu: %35'e dönüş = +20% NAV; %25'e d..." ile kesildi. Tehditler (Threats) hiç görünmüyor. Kural: tablo yarıda kalırsa Summary + Detail JSON ikiye böl.
- **Quartile distribution eksik** — Porter Five Forces tabloda peer karşılaştırması yok; "KCHOL Grubu" tek firma olarak değerlendirildi. Holding peer seti (SAHOL, MAN-küresel holdingler) eksik.
- **IFRS 8 %0 nedeniyle peer EBITDA marjı karşılaştırması yapılamadı** — Bunu "CONDITIONAL BLOCKED" olarak doğru işaretledi ✓; ancak "downstream valuation_agent alternatif peer set kullanmalı" önerisi üretildi — upstream veriyi çekme girişiminde bulunulmadı.
- **Working capital peer tablosu yok** — DSO/DPO/CCC için holding peer karşılaştırması yapılamadı (holding için zaten anlamlı olmayabilir); ama "holding holding için CCC anlamsız — segment bazlı WC verilmeli" açıklaması da yok.
- **Segment-level Porter analizi yok** — KCHOL için 5 ana segment (Enerji, Bankacılık, Otomotiv, Telekom, Çelik) her biri kendi Porter dinamiğine sahip; holding-level Porter yüzeysel; segment ayrımı yapılmadı.
- **Yönetim görüşü doğrulanamadı** — "[YÖNETİM GÖRÜŞÜ]" placeholder'ları "faaliyet raporu PDF çekilmedi" nedeniyle doldurulamadı. Koç Holding 2025 FY investor presentation veya earning call transcript alternatif kaynak olarak denenmedi.

### Bundan Sonra:
- **Holding peer seti standardize et** — KCHOL için her zaman: SAHOL (Sabancı), MAN (Alman konglomera), Koç grup bağlı ortaklıkları değil → peer = diğer Türk holdingleri + seçili global holdingler. Quartile distribution bu peer seti ile.
- **SWOT truncation önlemi** — SWOT 4 bölümünün (S/W/O/T) hepsini ilk çıktıda tamamla; truncation riski varsa önce S+W, sonra O+T ayrı mesajda gönder.
- **Segment-level Porter zorunlu** — Holding için Porter'ı konsolide düzeyde değil, en az 3 ana segment için ayrıca yaz: Enerji (TUPRS), Bankacılık (YKBNK/AKBNK), Otomotiv (FROTO). Her segmentin farklı tehdit profili var.

## Zorunlu Kontrol Listesi

**Her raporda zorunlu bolumler:**
1. Porter Five Forces (puan + yon oku + sirket-spesifik kanit)
2. SWOT (veri-destekli, dengeli)
3. Peer Benchmarking Scorecard (quartile siralamali)
4. Sektor Dinamikleri (demand-supply, enerji maliyeti, geographic exposure)
5. Calisma sermayesi peer tablosu (DSO/DIO/DPO/CCC + peer + quartile)
6. Sektor yasam dongusu (kuresel vs yerel ayrim)
7. Yonetim gorusu entegrasyonu ([YONETIM GORUSU] + Analitik Degerlendirme + Guvenilirlik)

**Rafineri ek zorunlu:**
- Working capital efficiency peer tablosu (DSO/DIO/DPO/CCC + 3 peer)
- CBAM sayisal: Ton CO2 x karbon fiyati x ihracat hacmi
- NCI (Nelson Complexity) paradoksu: Operasyonel ustunluk != finansal ustunluk aciklanmali

**Celik ek zorunlu:**
- EBITDA/ton (USD) ana KPI — TRY marji degil
- CBAM formulu: Export ton x tCO2/ton x EUR sertifika = yillik yukumluluk
- AB Safeguard sayisal: Mevcut ihracat hacmi x kota kesinti orani = kaybedilen ton x fiyat = TRY gelir kaybi
- CBAM rekabet asimetrisi: AB ici uretici muaf, EREGL tabi
- Celik sektoru yasam dongusu ikili: Olgunluk + Yesil Alt-Dongu

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK: Benchmarking scorecard yarim kaldi, peer 2025 FY verileri KAP'tan cekilmedi, quartile ranking eksik, SWOT/competitive positioning yok
- KCHOL: Segment-level peer comparison detayi eksik, holding discount deep dive yuzeysel, SAHOL segment finansallari parse edilmedi, NAV discount historical trend yok
- TCELL: Porter TRUNCATED, peer benchmarking finansallari eksik, telekom-spesifik competitive dynamics (5G spectrum, MNP flow) eksik
- TUPRS: Working capital peer karsilastirmasi yok, CBAM yuzeysel, NCI-marj paradoksu derinlestirilmedi
- EREGL: WC peer tablosu yok, AB Safeguard Temmuz 2026 sayisal etkisi gosterilmedi, quartile siralamasi eksik, cikti tamamlanmamis

## Son 3 Raporun Ogrenimleri

- **EREGL Delta #2 (2026-04-13):** Yonetim gorusu entegrasyonu deger katti. CBAM rekabet asimetrisi tanimlandi. Porter yon oku formati calistirildi. EBIT/Faiz vs Net Borc/EBITDA ikilisi — ikisini ayri goster. Kalite: 0.82 CONDITIONAL PASS.
- **EREGL BIST Peer (2026-04-13):** Cekirdek vs genisletilmis peer ayrimi sart. KAP+S&P hibrit set pratik cozum (confidence=medium). EREGL zayif noktasi artik marj degil degerleme/leverage.
- **TUPRS (2026-04-12):** Tek oyunculu sektor = global peer. Marj paradoksu (NCI 14.5 ama EBITDA %7.47 < peer %9.6). Refinery margin $/bbl ana KPI. Net nakit sektorde anomali.

## Sektor Bilgi Bankasi

**TUPRS Peer:** HelleniQ (%11.5 EBITDA, $16.4/bbl), Motor Oil (~%9.6, ~$12), PKN Orlen (%14.8), ENI (~%8.5, $11.7/bbl). TUPRS: %7.47, $6.0-6.5/bbl, net nakit.
**EREGL Peer:** ArcelorMittal ($111/ton, 1.2x leverage), SSAB (~$150+/ton, 0.8x), Tata Steel (~$75-85/ton, 2.5-3x). EREGL: $64/ton, ~1.9x. Kardemir: zarar, >5x.
**CBAM EREGL:** Default EUR100.55/ton, dogrulanmis ~EUR40-50/ton. AB ihracat ~745K ton -> ~EUR75M/yil.
**AB HRC (Nisan 2026):** Kuzey Avrupa EUR720/ton, Guney EUR699/ton.
**Conglomerate discount:** Global ortalama %13-15. SAHOL %30->%15 basardi (tech pivot, portfolio simplification).

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **Çıktı PARTIAL olarak işaretlendi** — Upstream reconciliation bloker nedeniyle peer benchmark tamamlanmadı.
- **Segment bazlı peer karşılaştırması eksik** — Bankacılık (Akbank vs ISCTR/GARAN), Enerji (Enerjisa vs AKSEN), Çimento (Çimsa vs global çimento) ayrı ayrı yapılmadı.
- **SWOT tablosu truncated** — THREAT bölümü "İran savaşı + Hürmüz ablukası (B" ile kesildi.
- **Sektör ömür döngüsü analizi holding genelinde yapıldı** — Segment bazında ayrıştırılmadı (bankacılık farklı lifecycle, perakende farklı, enerji farklı).

### Bundan Sonra:
- **Upstream bloker ≠ partial output gerekçesi:** Reconciliation bloker olsa bile mevcut verilerle tam analiz yap; eksik kısım için [PENDING: upstream veri] flag'i koy, bölümü atlama.
- **SWOT her segment için ayrı:** Holding SWOT'u yanında Bankacılık / Enerji / Sanayi / Perakende alt-SWOT'ları ZORUNLU. Holding indirimi her segmentin zayıflığından oluşur.
- **Truncation YASAK:** SWOT yarım bırakılamaz; bölümü iki mesajda gönder.

---

### 2026-04-22 — THYAO
Industrial peer EV/EBITDA medyanı ~6-7x, aviation peer EV/EBITDAR medyanı ~4-5x. Yanlış peer grubu hedef fiyatı %20-30 yukarı çeker ve analizi geçersiz kılar. THYAO'nun 2026-04-14 sessionında peer analizi doğruydu — bu sefer regresyon var.

### 2026-04-22 — THYAO
THYAO: sector=industrial yanlışlığı tüm peer benchmark'larını geçersiz kıldı. Havacılık ticker whitelist tutulmalı: THYAO, PGSUS → her zaman aviation.

### 2026-04-22 — THYAO
THYAO 22-Nis: Peer_count=0 ile EV/EBITDA 4.40x'in ucuz mu pahalı mı olduğu değerlendirilemedi. IAG ve Lufthansa 2025 EV/EBITDA ~4.5-6x — bu bağlam olmadan valuation hedef fiyatı boşlukta kalıyor.

### 2026-04-23 — THYAO
THYAO 20260423: Net Debt/EBITDA 3.67x için benchmark 'median=3.67x' gösterdi (kendi değeri). Gerçek global aviation peer median ~2.8-3.0x — THYAO ortalamanın üzerinde borçlu ama bu tespit edilemedi. Peer eksikliği tüm rekabet analizini geçersiz kıldı.

### 2026-04-23 — EREGL
EREGL: 'industrial' klasifikasyonu tüm çelik benchmark'larını kaçırdı; HRC spread, EBITDA/ton peer kıyası yapılamadı. THYAO seansında da benzer ticker fallback hatası yaşandı. Ticker→sector sabit map orchestrator YAML'ına girilmeli.

### 2026-04-23 — EREGL
EREGL peer: KRDMD, IZDMC, ArcelorMittal, Nucor, POSCO. Bu liste strategic_synthesis LLM narrative'inde oluşturuldu — sector_competition'da olması gerekiyordu.

### 2026-04-23 — ARCLK
ARCLK: VESBE (Vestel Beyaz Eşya) BIST'te işlem gören en yakın yerli rakip. EBITDA marjı ~%8-10 ve Net Borç/EBITDA ~2-3x seviyesiyle ARCLK'nın 4.5% marjı ve 7.24x kaldıraç profilini contextualize eder. Sıfır peer çalışıldığında 'quartile 2' gibi yanıltıcı sıralamalar üretildi.

### 2026-04-24 — BIMAS
BIMAS sektör yanlış etiketlendiğinde peer grubu boş kaldı ve tüm benchmark istatistikleri (Q1/median/Q3) BIMAS'ın kendi değerine eşit oldu — anlamsız karşılaştırma. Bu hata sector misclassification'ın domino etkisi.

### 2026-04-24 — BIMAS
BIMAS brüt marjı %19.3 tek başına anlamsız; MGROS ~%26-28, SOKM ~%16-18 bağlamında değerlendirilmeliydi. Peer eksikliği strategic_synthesis ve valuation sinyallerini bütünüyle bozdu.

### 2026-04-24 — KCHOL
KCHOL: holding iskontosu %41.3 hesaplandı ama peer context yoktu. Tarihsel bant %20-30, fark 'anormal yüksek' olarak notlandı ama quantify edilemedi — yatırımcı aksiyonu belirlenemedi.

### 2026-04-24 — KCHOL
KCHOL analizi için NAV iskontosu Türkiye ortalaması %15-35; GCM %43 ölçtü. Bu peer context sektör=industrial filtresiyle hiç üretilemedi. Holding sektörüne özgü playbook (holding.yaml) doğrudan bağlanmalıydı.

### 2026-04-24 — KCHOL
KCHOL %39.5 NAV iskontosu: SAHOL güncel iskontosu bilinmeden 'yüksek mi, normal mi?' sorusu yanıtsız kaldı. Broker konsensüsü 282.54 TL (13 aracı) sector_competition çıktısına taşınmadı.

### 2026-04-25 — KCHOL
KCHOL 20260425: holding iskonto %30-40 tarihsel, FY2025 %21-39.5 (iki ayrı kaynak) — bu bilgi sector_competition yerine final_summary ve valuation_agent tarafından manuel olarak eklendi. Peer benchmark otomatize edilmeli.

### 2026-04-25 — KCHOL
KCHOL holding iskontosu %19-50 arasında tartışmalı. Peer benchmark olmadan valuation_agent iskonto varsayımı (%37 baz) doğrulanamaz.

### 2026-04-25 — KCHOL
Python engine peer discovery için sector='industrial' kullandı → holding peer'larını bulamadı. sector hiyerarşisi sorunu (financial_analysis ile ortak root cause): tüm agent'lar sector enum override'ını aynı yerden almalı.
