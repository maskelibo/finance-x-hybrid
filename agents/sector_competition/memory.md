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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **Sektör "industrial" olarak yanlış belirlendi** — `"sector": "industrial"` — THYAO açıkça havacılık (airline) sektörüdür. Ticker fallback mekanizması başarısız oldu. Kural: finansal veriler olmasa da ticker'dan sektör tespiti yapılabilir; THYAO → havacılık kesin tanım.
- **Peer group tamamen boş** — `"peer_group": []` — Havacılık sektöründe standart peer: Lufthansa, IAG, Wizz Air, flydubai, Emirates (private). Finansal veriler olmadan bile peer listesi ve kalitatif benchmarking üretilebilir.
- **Benchmarks tamamen boş** — `"benchmarks": []` — EBITDAR marjı, CASK, load factor, EV/EBITDAR peer aralıkları sektör raporlarından çekilebilirdi.
- **financial_analysis bağımlılığı nedeniyle TAMAMEN boş çıktı** — "No financial_analysis output — sector_competition cannot score" kararı yanlış. Sektör analizi finansal verilerle zenginleşir ama bağımsız olarak da üretilebilir: Porter's Five Forces, rekabet konumu, sektör dinamikleri, peer narratif analizi.
- **Havacılık sektörüne özgü hiçbir bulgu yok** — RPK/ASK piyasa payı, slot hakları rekabeti, yakıt hedge sektör ortalaması, MRO rekabet durumu — hiçbiri üretilmedi.

### Bundan Sonra:
- **Havacılık sektörü standart peer grubu** — Delta Air Lines (operasyonel benchmark), Lufthansa (Avrupa hub), IAG (küresel network hub), Wizz Air (Doğu Avrupa LCC), flydubai/Air Arabia (Orta Doğu overlap). Her THYAO analizinde bu 5 peer kullan.
- **Sektör tespiti ticker tabanlı olacak, fallback "industrial" OLMAYACAK** — Bilinmeyen sektörde "unknown" yaz, "industrial" yazma. Havacılık tickerları (THYAO, PEGYS, ONUIR) → airline/transport sektörü.
- **financial_analysis yoksa "temel Porter + peer narratif" üret** — financial_analysis gelmeden: (1) Porter'ın 5 kuvveti kalitatif, (2) Sektör dinamikleri (konsolidasyon, fiyat rekabeti), (3) Peer listesi + kamuya açık metrikler. "Cannot score" değil, "partial — financial_analysis eksik" de.
- **Havacılık sektörü zorunlu 4 analiz** — (1) Slot/rota network rekabeti, (2) Yakıt maliyeti hedge sektör ortalaması, (3) Capacity discipline (sektör ASK büyümesi vs THYAO), (4) Kargo penetrasyon oranı peer karşılaştırması.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **Sektör "industrial" — 3. kez aynı hata (Delta + KCHOL + Standard)** — THYAO → aviation; bu hata artık sistematik. Ticker tabanlı sektör tespiti hiç uygulanmadı.
- **peer_group: [] — 3. kez boş** — Standart peer listesi (Lufthansa, IAG, Wizz, Delta, flydubai) daha önce memory'ye yazıldı; uygulanmadı.
- **benchmarks: sadece THYAO değerleri** — Peer_count: 0 olduğu için tüm benchmark değerleri şirketin kendi değeri; quartile distribution anlamsız.
- **financial_analysis bağımlılığı nedeniyle "partial" bile üretilmedi** — Kural: "financial_analysis yoksa temel Porter + peer narratif üret." Hiç üretilmedi.

### Bundan Sonra:
- **Ticket-based sector mapping kalıcı hafızada** — THYAO/PEGYS/ONUIR → aviation; TUPRS/BIMAS/EREGL → mevcut kategoriler. Her analizde bu mapping önce kontrol edilecek.
- **financial_analysis olmasa bile 3 minimum üretim zorunlu:** (1) Porter 5 kuvvet kalitatif, (2) Standart peer listesi + kamuya açık benchmarklar, (3) Havacılık sektörü dinamikleri. "Cannot score" = geçersiz çıktı.
- **Standard raporda peer benchmark zorunlu** — EBITDAR marjı peer aralığı (IATA sektör ortalaması: %16.1), CASK benchmark (sektör: US¢9-12), Load Factor benchmark (global: %83.6) — bunlar finansal veri olmadan bile üretilebilir.

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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **Sektör "industrial" — 3. THYAO hatası, sistematik arıza** — THYAO → aviation tanımı ticker'dan triviyal. 3 rapordur düzeltilmedi. financial_analysis bağımlılığı gerekçe kabul edilemez; sektör tespiti bağımsızdan yapılır.
- **peer_group: [] — 3. kez boş** — Standart havacılık peer listesi (Lufthansa, IAG, Wizz Air, Delta, flydubai) memory'ye iki kez yazıldı; uygulanmadı.
- **"Cannot score — financial_analysis missing" = geçersiz karar** — Kural: financial_analysis yoksa temel Porter + peer narratif üret. Sıfır çıktı kabul edilemez.
- **Havacılık sektörüne özgü analiz yok** — RPK/ASK piyasa payı, slot hakkı rekabeti, yakıt hedge sektör ortalaması, MRO rekabet — hiçbiri üretilmedi.

### Bundan Sonra:
- **Sektör tespiti hardcoded list'ten (3. ve son direktif)** — THYAO/PEGYS/ONUIR → aviation. Bu mapping bir daha atlanmayacak.
- **financial_analysis yoksa minimum 3 çıktı zorunlu** — (1) Porter 5 kuvvet kalitatif, (2) Standart peer listesi + kamuya açık benchmarklar, (3) Havacılık sektörü dinamikleri. "Cannot score" = geçersiz; "partial — financial_analysis pending" de.
- **Havacılık peer zorunlu benchmarklar (finansal veri gerekmez)** — EBITDAR marjı sektör ortalaması (%16.1 IATA), CASK benchmark (US¢9-12), Load Factor global (%83.6). Kamuya açık sektör verisi; üretilmemesi kural ihlali.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **Sektör "industrial" — 3. THYAO analizi, artık tolerans sıfır** — THYAO havacılık sektörü. "industrial" etiketi nedeniyle peer_group boş döndü, tüm karşılaştırmalı analiz üretilmedi.
- **peer_group[] boş — 3. THYAO analizi** — Lufthansa, IAG, Wizz Air, flydubai, Delta peer listesi 3 analizdir uygulanmadı. Bu peer listesi THYAO için sabit; upstream etiket ne olursa olsun overwrite edilmeli.
- **Kısmi çıktı bile üretilmedi** — financial_analysis bağımlılığı kırık olduğunda bile Porter 5 Güç + sektör anlatısı üretilebilir. Kural: bağımlılık yoksa minimum Porter + peer narrative üret, null döndürme.
- **EBITDAR marjı peer karşılaştırması yapılmadı** — IATA sektör EBITDAR ortalama ~%16.1; THYAO FY2024 EBITDAR marjı %23.2 — bu karşılaştırma yapılmadı.

### Bundan Sonra:
- **THYAO sektör etiketini override et (P0 — 3. direktif, artık hard rule)** — upstream'den "industrial" gelirse sector_competition bunu reddeder ve "aviation" olarak overwrite eder. Bu override kodu seviyesinde gerekiyor; bir daha "industrial fallback" görmek istemiyorum.
- **THYAO peer group sabit listesi:**
  - Global: Lufthansa (LHA), IAG, Delta (DAL)
  - Bölgesel/LCC: Wizz Air, flydubai, Air Arabia
  Bu liste upstream veriden bağımsız; her THYAO analizinde otomatik kullanılır.
- **financial_analysis bağımlılığı kırıksa minimum çıktı zorunlu:**
  1. Porter 5 Güç analizi (sektör bilgisinden)
  2. Peer narrative: THYAO vs peer metrik karşılaştırma anlatısı
  3. EBITDAR marjı / CASK / Load Factor peer benchmark tablosu
  Bunlar için upstream finansal veri gerekmez; üretilmesi zorunlu.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417)

### Eksikler:
- **Sektör "industrial" — 5. THYAO, tolerans tamamen aşıldı** — `"sector": "industrial"` ve `"peer_group": []` ve `"benchmarks": []`. Deep_dive modunda bile aynı hata. THYAO = aviation tanımı ticker'dan triviyal; 5 analizdir düzeltilmedi.
- **Tamamen boş çıktı — önceki turlardan daha kötü** — Önceki THYAO'larda en azından bazı uyarı mesajları vardı; bu turda strengths: [], weaknesses: [], signals tamamen boş. Bu regresyon.
- **"Cannot score — no financial_analysis" → geçersiz karar (5. kez)** — financial_analysis bağımlılığı kırık olduğunda minimum çıktı direktifi 4 kez verildi; 5. turda da hiçbir Porter analizi üretilmedi.
- **EBITDAR peer karşılaştırması hâlâ yok** — THYAO FY2025 EBITDAR marjı %23.2 vs IATA sektör ortalaması %16.1 (+7pp fark). Bu karşılaştırma 4 turda yapılmadı; 5. turda da yok.

### Bundan Sonra:
- **THYAO ticker → aviation mapping = hard-coded, override edilemez (5. direktif)** — Upstream etiket ne gelirse gelsin, THYAO = aviation. "industrial" fallback YASAK.
- **financial_analysis olmasa bile zorunlu minimum çıktı:**
  1. Porter 5 Güç kalitatif (sektör bilgisinden)
  2. Standart peer listesi: Lufthansa/IAG/Delta/Wizz Air/flydubai
  3. EBITDAR marjı peer benchmark: IATA %16.1 vs THYAO %23.2
  4. Havacılık sektörü 4 dinamik: slot rekabeti, yakıt hedge, capacity discipline, kargo penetrasyon
- **"Cannot score" = geçersiz çıktı; "partial — upstream eksik" = acceptable.** Sıfır çıktı artık COO tarafından P0 bloker olarak işaretleniyor.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **Sektör "industrial" + peer_group [] — 5. THYAO analizi, kod seviyesi çözüm şart** — THYAO = havacılık. "industrial" fallback 5 analizdir düzeltilmedi. Memory direktifi etkisiz; hard-coded mapping zorunlu.
- **Porter 5 Güç bile üretilmedi — 5. THYAO** — financial_analysis bağımlılığı kırıkken minimum çıktı direktifi 4 kez verildi; 5. turda da hiçbir Porter analizi yok.
- **EBITDAR peer karşılaştırması yok — 5. THYAO** — THYAO FY2025 EBITDAR marjı %23.2 vs IATA sektör ortalaması %16.1 (+7pp). Bu karşılaştırma 5 analizde yapılmadı.
- **Havacılık sektörüne özgü 4 analiz bölümü yok** — Slot/rota rekabeti, yakıt hedge, capacity discipline, kargo penetrasyon — finansal veri olmadan sektör bilgisinden üretilebilir.

### Bundan Sonra:
- **THYAO ticker → aviation mapping = hard-coded, override edilemez (5. direktif — kod değişikliği zorunlu)** — Upstream etiket ne gelirse gelsin, THYAO = aviation. "industrial" fallback YASAK.
- **financial_analysis olmasa bile zorunlu minimum çıktı:**
  1. Porter 5 Güç kalitatif (sektör bilgisinden)
  2. Standart peer listesi: Lufthansa/IAG/Delta/Wizz Air/flydubai
  3. EBITDAR marjı peer benchmark: IATA %16.1 vs THYAO %23.2
  4. Havacılık sektörü 4 dinamik: slot rekabeti, yakıt hedge, capacity discipline, kargo penetrasyon
- **"Cannot score" = geçersiz çıktı; "partial — upstream eksik" = acceptable** — Sıfır çıktı COO P0 bloker.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **Sektör "industrial" — 4. THYAO analizi, tolerans sıfır aşıldı** — THYAO = havacılık. "industrial" fallback 4 analizdir düzeltilmedi. Bu artık prompt seviyesinde değil, kod seviyesinde sabit mapping gerektiriyor.
- **peer_group: [] — 4. THYAO analizi** — Lufthansa/IAG/Wizz Air/flydubai/Delta peer listesi 4 analizdir uygulanmadı. Bu liste upstream bağımsız; her THYAO analizinde otomatik kullanılacak.
- **Porter 5 Güç bile üretilmedi** — financial_analysis bağımlılığı kırık olduğunda minimum çıktı direktifi 3 kez verilmişti; bu turda da hiçbir Porter analizi üretilmedi. "Cannot score" = geçersiz çıktı; "partial — upstream eksik" formatı zorunlu.
- **EBITDAR marjı peer karşılaştırması yok** — THYAO FY2025 EBITDAR marjı %23.2 vs IATA sektör ortalaması %16.1; bu 7pp fark sektör konumlaması için kritik — hesaplandı, raporlanmadı.
- **THYAO havacılık sektörüne özgü 4 analiz bölümü yok** — (1) Slot/rota network rekabeti, (2) Yakıt hedge sektör ortalaması, (3) Capacity discipline (ASK büyümesi), (4) Kargo penetrasyon oranı — bunlar finansal veri olmadan sektör bilgisinden üretilebilir.

### Bundan Sonra:
- **Sektör mapping sabit (4. direktif, kod seviyesi şart):** THYAO/PEGYS/ONUIR → aviation; TUPRS → petroleum; EREGL → steel. Upstream etiket ne olursa olsun overwrite edilecek. "industrial" fallback YASAK.
- **financial_analysis bağımlılığı = kısmi çıktı tetikleyicisi, bloker değil** — Finansal veri yoksa: (1) Porter 5 Güç kalitatif, (2) Standart peer listesi + kamuya açık benchmarklar (IATA, Eurocontrol), (3) THYAO operasyonel KPI narrative. "Cannot score" → otomatik FAIL; "partial" → acceptable.
- **EBITDAR peer benchmark tablosu her THYAO'da zorunlu** — IATA sektör: %16.1 | THYAO: %23.2 | Lufthansa FY2024: ~%14.8 | IAG FY2024: ~%19.2. Bu tablo finansal tablolar olmadan da üretilebilir; sektör raporlarından veya IR sayfalarından çekilecek.

---

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **Sektör "industrial" — ASELS'te de aynı sistematik hata** — ASELS savunma elektroniği (defense_electronics); "industrial" fallback 5. tekrarlayan arıza. CEO mandate sektörü açıkça "defense_electronics" olarak belirledi; uygulanmadı.
- **peer_group: [] — KOMPLE BAŞARISIZLIK** — CEO mandate savunma peer listesini verdi: Thales, Leonardo, Rheinmetall, BAE Systems, Elbit, HEICO, HAEFN.IS. Bu liste memory'de mevcuttu; yine de boş döndü. Savunma analizi temelsiz kaldı.
- **Benchmarks yalnızca ASELS değerleri** — Peer count 0 olduğu için tüm karşılaştırmalı metrikler anlamsız; EV/EBITDA, R&D/Revenue, Order Book/Revenue benchmark'ları üretilmedi.
- **Savunma sektörüne özgü hiçbir analiz üretilmedi** — Jeopolitik talep sürücüsü, ihracat kısıtlamaları, offsetleme yükümlülükleri, AR-GE yoğunluğu, devlet bağımlılığı riski — bunlar savunma sektörünün temel dinamikleri; sıfır üretim.
- **"financial_analysis yoksa cannot score" kararı — 5. tekrar** — Bu gerekçe geçersiz; sektör analizi bağımsız üretilebilir.

### Bundan Sonra:
- **Savunma şirketleri için kalıcı peer listesi:**
  - Global: Thales (HO.PA), Leonardo (LDO.MI), Rheinmetall (RHM.DE), BAE Systems (BAESY), Elbit Systems (ESLT)
  - ABD: HEICO (HEI), L3Harris (LHX), Curtiss-Wright (CW)
  - Yerel: HAEFN.IS (Hürjet/TAI — çıktı yok ise kalitatif)
  Bu liste CEO mandate; upstream bağımsız, her ASELS analizinde otomatik kullanılacak.
- **Savunma sektörü zorunlu 4 analiz bölümü (finansal veri gerekmez):**
  1. Jeopolitik talep sürücüsü (gerilim → bütçe → sipariş defteri transmisyon mekanizması)
  2. AR-GE yoğunluğu peer karşılaştırması (AR-GE/ciro: Thales ~%10, ASELS ~%7)
  3. İhracat vs iç pazar mix (ASELS ~%20-25 ihracat vs savunma peers %30-50)
  4. Devlet bağımlılığı riski (TSKGV müşteri konsantrasyonu)
- **"industrial" fallback savunma şirketlerinde YASAK** — ASELS, HAEFN, ROKET ticker'ları → "defense_electronics". Upstream etiket ne olursa olsun overwrite edilecek.

*Vaka bazli dersler: case_lessons.md | Domain bilgisi: knowledge.md*
