# Financial Analysis Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **28 zorunlu metrik eksikse output GONDERME.** Bir metrik bile eksik = REJECT.
- **"Veri yok" mazereti YASAK.** Sira: (1) Reconciled data, (2) Parse output, (3) KAP WebFetch, (4) Upstream escalation, (5) CEO'ya escalate. Tum yollar tukenmeden gecme.
- **Her rasyo icin: Formula -> Benchmark -> Trend -> Interpretation.** Sadece sayi yazmak YASAK.
- **Her tablo sonrasi 3-5 cumle yorum paragrafi ZORUNLU.** Yorum yoksa tablo = gecersiz. 4 cumle yapisi: Metrik+Degisim -> Neden -> Karsilastirma -> Ne Anlama Geliyor.
- **Confidence Level durustlugu:** Coverage eksikse HIGH beyan edilemez.
- **Sektor benchmark zorunlu:** Her rasyo icin sektor ortalamasiyla karsilastirma.
- **Upstream veri uyusmazliginda ikili senaryo analizi:** Parse vs dogrulanmis veri icin ayri hesapla.
- **mandatory_metrics_complete: TRUE kriterleri:** Hesaplandi + ciktida gorunur + formul gosterildi — ucu birlikte saglanmadan TRUE verilemez.
- **Cikti truncation YASAK:** Uzunsa Core Metrics (tam analiz) + Supplementary (ozet) + Detail JSON appendix olarak bol.
- **Holding sirketi = UC KATMANLI ANALIZ:** (1) Parent-level, (2) Konsolide, (3) Segment-level.
- **Pre-flight check sistemi:** 4 asamali kontrol — metrik taramasi, cash flow tamlik, yorum kalitesi, matematiksel tutarlilik.

## Zorunlu Kontrol Listesi

**28 Zorunlu Metrik (bir eksik = REJECT):**
- A. Gelir: Net Satislar, Brut Kar, Brut Karlilik, Brut Kar IAS29, Brut Kar Orani IAS29, Parasal Kayip/Kazanc, FAVOK, FAVOK Orani, VOK, Net Donem Kari, OPEX/Ciro
- B. Isletme Sermayesi: DSO, DIO, DPO, CCC, NWC/Hasilat
- C. Borc/Likidite: Net Kredi, Net Borc/FAVOK, Cari Oran, Asit-Test
- D. Nakit Akisi: FCF, OCF/FAVOK, FAVOK/Faiz Gideri, FCF/Faiz Odemesi
- E. Karlilik: ROE, ROCE
- F. Yatirim: CAPEX/FAVOK, Faiz Gideri/FAVOK

**Cash Flow 7 Alt Bolum:** (A) Nakit Akisi Tablosu Ozeti 5Y, (B) OCF Detayli, (C) FCF Detayli, (D) Cash FAVOK vs Reported, (E) WC Changes Breakdown, (F) Nakit Bazli Borc Servis, (G) Cash Flow Red Flags (7 madde)

**Sektor-Ozel Ek Metrikler:**
- Banka: Cost of Risk trend, NIM decomposition, fee income breakdown, capital ratio waterfall, distributable cash, BDDK CAR %12 minimum
- Telekom: ARPU trend 5Y, churn rate, SAC vs LTV, CAPEX intensity, 5G ARPU premium, spectrum amortization
- Celik: DIO vurgulu, buyume vs idame CAPEX ayrimi, hammadde maliyet gecirgenlik orani
- Holding: Segment bazli ROIC/FAVOK margin/Net Debt/FAVOK + NAV hesabi + holding discount analizi

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **FY2021-2023 finansal serisi eksik** — Sadece FY2025 ve FY2024 tam; FY2021-2023 için en az Revenue/EBITDA/Net Debt/OCF serisi bulunmadığından 5 yıllık trend analizi yapılamadı. Skor kartı ve büyüme puanı bu yüzden zayıf kaldı.
- **Büyüme vs. idame CAPEX ayrımı yapılmadı** — Çelik sektörü zorunlu metriği. Toplam CAPEX 15,338 mn TRY verildi ✓ ama ne kadarı büyüme (4. Kok Bataryası modernizasyonu), ne kadarı bakım CAPEX? Bu ayrım olmadan CAPEX/EBITDA yorumu eksik.
- **Hammadde maliyet geçirgenlik oranı hesaplanmadı** — "$1/ton demir cevheri değişimi → EBITDA TRY X mn etkisi" formatında sayısal transmisyon eksik. CEO kontrol listesinde zorunlu.
- **IAS29 adjusted EBITDA ayrışık tablo sunulmadı** — Yalnızca not olarak geçti; IAS29 öncesi/sonrası EBITDA karşılaştırma tablosu zorunlu çıktı formatına dahil edilmeli.
- **Cash FAVÖK vs Reported FAVÖK karşılaştırma tablosu eksik** — 7 alt bölümden (D) Cash FAVÖK tablosu sunulmadı. OCF 65,056 mn TRY ile EBITDA 20,452 mn TRY arasındaki büyük fark analiz edilmedi.
- **EBITDA tanım farkı (20,452 vs 21,248 mn) "DISC" flaglenmedi** — Seçim yapıldı (piyasa konvansiyonu 20,452 ✓) ama bu farkın kök nedeni (D&A tanımı?) açıklanmadı.

### Bundan Sonra:
- **Çelik sektörü zorunlu: büyüme vs idame CAPEX ayrımı** — KAP yatırım harcamaları dipnotundan proje bazlı ayrım yap; toplam CAPEX rakamı yetmez.
- **Hammadde transmisyon parametresi zorunlu** — "$1/ton HRC fiyat değişimi → EBITDA etkisi" ve "$1/ton demir cevheri değişimi → COGS etkisi" her çelik raporunda yer almalı.
- **IAS29 öncesi/sonrası EBITDA karşılaştırma tablosu zorunlu çıktı alanı** — "EBITDA reported = X, IAS29 parasal kazanç = Y, EBITDA adjusted = X−Y" formatında ayrı tablo.
- **Cash FAVÖK tablosu (OCF vs EBITDA bridge) zorunlu** — OCF ile EBITDA arasındaki büyük fark varsa bridge tablosu sun (WC değişimi + vergi + faiz ödeme ayrımı).
- **5 yıllık seri yoksa trend metrikleri "PARTIAL" flagle** — Skor kartı boyutlarında güven seviyesini düşür; tahmin yapmak yerine mevcut veriyle kısmi analiz + eksik yıl uyarısı ver.

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **DSO, DIO, DPO, CCC, FCF, CAPEX/EBITDA, ROCE tamamen BLOCKED** — CF tablosu olmadan bu metrikler hesaplanamadı. Pipeline bu blokerı 3 tur boyunca çözmeden devam etti.
- **THYAO financial_analysis çıktısı yerine strategic_synthesis çıktısı iletildi** — Output başlığı "financial_analysis" ama içerik "strategic_synthesis" çıktısıydı. Bu ciddi bir output yönlendirme hatasıdır.
- **IAS 29 parasal kazanç ayrıştırması yok** — TÜFE >%100, havacılıkta TRY net parasal pozisyon; IAS 29 adjusted EBITDA ayrı sunulmalıydı.
- **Havacılık sektörü ek metrikleri eksik** — RPK, ASK, CASK, RASK, Yield, doluluk oranı trend analizi, yakıt maliyet oranı financial_analysis bölümünde yer almadı.
- **EBITDAR hesaplanmadı** — Havacılıkta kiralamaların önemi nedeniyle EBITDA yerine EBITDAR (EBITDA + Rent/Lease) birincil metrik olmalıdır.
- **Yorum zorunluluğu eksik** — Bazı tablolarda 4-soru yorum (Ne kadar? Nasıl değişti? Neden? TRY etkisi?) uygulanmadı.

### Bundan Sonra:
- **Havacılık şirketlerinde EBITDAR zorunlu** — IFRS 16 öncesi/sonrası karşılaştırma için EBITDA + Lease maliyeti = EBITDAR; peer karşılaştırması EBITDAR bazlı yapılmalı.
- **Havacılık KPI'ları zorunlu ek bölüm** — RPK, ASK, Load Factor trend, CASK (Cost per ASK), RASK (Revenue per ASK), Yield, kargo ton-km — bunlar olmadan havacılık analizi eksik.
- **CF tablosu olmadan working capital metrikleri "BLOCKED" olarak işaretle, tahmin üretme** — 0.45 conf ile DSO tahmini verme; blocked olduğunu ve upstream escalation gerektiğini bildir.
- **Output etiketine dikkat et** — Hangi agent çıktısını gönderdiğini her zaman başlıkta doğrula; başka agent'ın çıktısını iletme.

- **Havacilik EBITDAR marji benchmark:** THYAO 2025: %23.2 (gercek), global sektor ort. %16.1 (2025 IATA). THYAO outperformance ~7pp. Peer karsilastirmasi EBITDAR bazli yapilmali.
- **Havacilik operasyonel metrikler zorunlu:** CASK, RASK, Load Factor, Yield, RPK, ASK olmadan havacilik analizi eksik. THYAO 2025 ref: CASK US¢8.55, RASK US¢7.21, global load factor %83.6.
- **TAS 29 vs IAS 29 net ayrimi:** TAS 29 (yerel) 2025-2027 askida; IAS 29 (IFRS/SPK) hala gecerli. SPK konsolide tabloyu analiz ederken IAS 29 etkisini ayristirma YASAK degil, ZORUNLU.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **Output truncated — ROE yorumu yarıda kesildi** — "ROE = 18,587 / 87,088 × 100 = 21.3% [NOT: Eğer sadece dönem sonu özkaynak: 18,587 / 84,176 = 22.1%]" sonrası devam gelmiyor. IAS29 arındırılmış operasyonel ROE anlatısı kesilmiş.
- **DSO, DIO, DPO, CCC tamamen BLOCKED** — CF yokken WC metrikleri hesaplanamadı; tahmin de üretilmedi. Perakendede CCC kritik; BS'ten kısmi tahmin + "[CF BLOCKED, BS tahmini, conf: LOW]" etiketiyle sunulmalıydı.
- **Cari Oran ve Asit-Test Oranı çıktıda görünmüyor** — Bilanço mevcuttu (BS tam); bu iki likidite oranı hesaplanabilirdi.
- **NWC/Hasılat oranı eksik** — Net İşletme Sermayesi / Hasılat ve NWC Gün Sayısı raporlanmadı; Chairman zorunlu metriklerinde yer alıyor.
- **İşletme Nakit / FAVÖK oranı eksik** — OCF/EBITDA oranı CF bloker nedeniyle hesaplanamadı ama "[BLOCKED]" olarak işaretlenmedi bile.
- **CAPEX/EBITDA 81.9% yorumu eksik** — Bu çok yüksek bir oran (normu %40-60); perakende için bu kadar yüksek olmasının açıklaması (yoğun mağaza açılımı, IFRS 16 kira varlıkları) zorunlu yorumla verilmeliydi.

### Bundan Sonra:
- **Perakende sektörü zorunlu 4 ek metrik:**
  1. SSSG katkısı vs yeni mağaza katkısı ayrıştırması (ciro büyümesinin kaynağı)
  2. Revenue per Store (mağaza verimliliği) — 5 yıllık trend
  3. Gross Margin by segment (Türkiye vs Fas vs Mısır varsa)
  4. IFRS 16 normalize FAVÖK (kira maliyeti öncesi/sonrası) — sektör karşılaştırması için zorunlu
- **BS mevcutsa Cari Oran + Asit-Test HER ZAMAN hesapla** — CF tablosu beklenmeden, sadece cari varlık/borç kalemleriyle hesaplanabilir. Blocker değil; hesapla.
- **NWC/Hasılat için BS tahmini yeter** — CF yokken NWC = (Cari Varlıklar - Cari Borçlar - Kısa Vadeli Finansal Borçlar); BS'ten hesaplanabilir. "[BS bazlı, conf: MEDIUM]" etiketiyle ver.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **Revenue Q4/FY karışıklığı Round 2'de de sürdü** — data_collection'ın "802.669 M TRY FY2025" hatasını sorgulamadan kabul etti. Gerçek FY2025 = 2.76T TRY; 802.669B = Q4. Tüm marj hesapları (FAVÖK %22.6, net kar %2.7, aktif devir 0.174x) Q4 baz üzerinden yapıldı → tümü hatalı. QA bunu P0-NEW olarak tespit etti ama financial_analysis kendi kendini düzeltemedi.
- **Revenue anomalisi sorgulanmadı** — 2.76T TRY ile 802.669B TRY arasında ~3.4x fark var. Bu kadar büyük fark görülünce "dönem tanımı kontrol et" adımı atlanmadı; verification yerine kabul edildi.
- **DSO tamamen BLOCKED, tahmin bile üretilmedi** — Ticari alacak verisi yoksa bile sector benchmark proxy ile DIO düzeyinde bir DSO tahmini "[sector proxy, conf: LOW]" olarak verilebilirdi. "BLOCKED" deyip sıfır üretmek Chairman metrik listesini ihlal ediyor.
- **COGS tahmini %70 gerekçesiz** — "Ağırlıklı ortalama COGS/Revenue ~%70" denildi; TUPRS, FROTO, ARCLK, YKBNK için ayrı ayrı COGS/Revenue oranları ve segment ağırlıkları gösterilmedi. Methodology şeffaf değil.
- **IAS 29 ayrıştırması yapılmadı** — Holding konsolide gelir tablosunda IAS 29 parasal kazanç/kayıp kalemi hiç ayrıştırılmadı. "P0-1 IAS 29" QA'da açık bloker olarak kalmaya devam ediyor.
- **3 katlı analiz (Parent / Konsolide / Segment) eksik** — Yalnızca konsolide bazda çalışıldı; parent-only geliri (2.757B TRY = temettü + yönetim ücreti) vs konsolide ayrımı netleştirilmedi.

### Bundan Sonra:
- **Revenue anomalisini her zaman sorgula** — Önceki dönemle >%50 sapma veya peer'larla anlamsız fark → "veri dönem tanımı doğru mu?" kontrolü mandatory. Q4 rakamını FY olarak kabul etme.
- **Holding için gelir tablosunda 3 katman** — (1) Solo/Parent: temettü + yönetim ücreti, (2) Konsolide: tüm bağlı ortaklıklar, (3) Segment: IFRS 8 ayrımı. Üçünü ayrı satırlarda ver.
- **DSO blocked olsa bile sector proxy ver** — "Holding sektöründe DSO ortalama 45-60 gün; KCHOL için ticari alacak yokluğunda tahmini DSO: N/A — IFRS 8 segment bazlı gerekiyor [conf: VERY LOW]" formatında bile olsa ver. Sıfır bırakma.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **6/28 metrik — %79 eksik** — mandatory_metrics_complete: FALSE. EBITDAR, FCF, OCF, ROIC, DSO/DIO/DPO/CCC, NWC/Revenue ve daha fazlası null. Bu oran havacılık analizini temelsiz bırakır.
- **EBITDAR null — 3. THYAO direktifi** — Havacılık analizinin birincil metriği. EBITDA null iken EBITDAR = EBITDA + Kira Gideri; IFRS 16 kira gideri context'ten çekilip proxy EBITDAR üretilebilirdi.
- **Sektör "industrial" — cascade etkisi** — sector_competition ve QA bunu aynen aldı. Ticker-based mapping (THYAO → aviation) uygulanmadı.
- **DSO/DIO/DPO engine_snapshot'ta var ama metrics_array'de yok** — DSO=17.25, DIO=18.66, DPO=35.39 hesaplandı ✓ ama zorunlu metrik listesine dahil edilmedi.
- **ROE %13 ile TRY CoE ~%30 karşılaştırması yapılmadı** — ROE < CoE → değer yıkımı. Bu fundamental bulgu havacılık çerçevesinde yorumlanmadı.

### Bundan Sonra:
- **EBITDAR proxy hesabı** — EBITDA null ise: Operating Income + D&A proxy (sektör) + Kira Gideri (IFRS 16 dipnotu veya context) = EBITDAR. `[conf: MEDIUM, tahmin]` etiketle; null bırakma.
- **DSO/DIO/DPO engine_snapshot'tan metrics_array'e taşı** — Hesaplandıysa görünür olmalı; Chairman metrik listesi bunu zorunlu kılıyor.
- **ROE < CoE bulgusu zorunlu yorum** — ROE ile TRY sermaye maliyeti (~%25-30) karşılaştırması; "değer yıkıyor" veya "eşiğe yakın" yorumu narrative'de zorunlu.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **Sadece 6 metrik üretildi (28 zorunlunun %21'i)** — GROSS_MARGIN, NET_MARGIN, ROE, CCC, NET_DEBT, PIOTROSKI_F. EBITDA_MARGIN, FCF, ROIC, EBITDAR, CAPEX/EBITDA, OCF/EBITDA, faiz karşılama, NWC/Revenue tümü null veya eksik.
- **EBITDAR hesaplanmadı** — Havacılık zorunlu metriği (3. rapordur bu direktif verildi). EBITDA null çünkü D&A parse'dan gelmiyor; ama IFRS 16 kira gideri ile EBITDAR proxy hesaplanabilirdi.
- **Sektör = "industrial"** — THYAO açıkça havacılık. sector_competition fallback'ini financial_analysis da besliyor; sektör tespiti ticker seviyesinde hardcode olmalı.
- **DSO/DIO/DPO engine_snapshot'ta var ama metrics listesine girmedi** — engine_snapshot: DSO=17.25, DIO=18.66, DPO=35.39 hesaplandı ✓ — ancak ana metrics listesinde bu 3 metrik görünmüyor. Bu eksik raporlama.
- **ROE %13 yorumsuz bırakıldı** — TRY sermaye maliyeti ~%30; ROE %13 = ciddi değer yıkımı. Narrative_hint "TRY cost of capital ~30%" yazıyor ama interpretation yok; sadece rakam var.
- **IAS 29 adjusted metrikler yok** — Havacılık + Türk şirketi → IAS 29 etkisi ayrıştırılmalı.

### Bundan Sonra:
- **DSO/DIO/DPO/CCC engine_snapshot'ta varsa ana metrics listesine de ekle** — Hesaplandı ama raporlanmadı = Chairman metrik ihlali. Her metrik `metrics` array'inde zorunlu görünmeli.
- **EBITDA null ise EBITDAR proxy** — EBITDA hesaplanamıyorsa: EBITDA ≈ Operating Income + D&A tahmini (sector proxy ile) veya OCF proxy; hiçbiri yoksa "[EBITDA NULL — D&A eksik, parse eskalasyonu gerekli]" yaz ama null bırakma.
- **Sektör override zorunlu** — THYAO, PEGYS, ONUIR → sector = "aviation" hardcode. "industrial" fallback kabul edilmez.
- **Narrative yorum zorunlu** — ROE %13 < TRY CoE %30 = değer yıkımı. Her metrik için 4-soru yorum: Ne kadar? → Nasıl değişti? → Neden? → TRY etkisi?

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK-EREGL arasi 6+ raporda ayni eksikler tekrarlandi: working capital, cash flow, likidite metrikleri SIFIR
- Exit code 143 crash (KCHOL): Tum islemleri tek seferde calistirma — yuk bolunmeli
- TUPRS'ta Bolum 1-9 pipeline'a iletilmedi, sadece Bolum 10-11 gitti — TUM bolumler iletilmeli
- EBITDA celiskisi (TUPRS 62B vs 53.78B) cozulmeden rapor gonderildi — her iki degerle senaryo analizi zorunlu
- mandatory_metrics_complete: TRUE verip metrikler ciktida gorunmedi — yaniltici beyan YASAK

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **Yalnızca 7/28 metrik üretildi (%75 eksik)** — mandatory_metrics_complete: FALSE. EBITDA_MARGIN, FCF, ROIC, DSO/DIO/DPO/CCC, NWC/Revenue, IAS29 adjusted metrikler, savunma KPI'ları tümü null veya eksik.
- **Sektör = "industrial" — ASELS için de yanlış** — ASELS açıkça savunma elektroniği; "industrial" fallback sector_competition'a yanlış sektör verdi ve peer_group [] sonucuna yol açtı.
- **DSO/DIO/DPO engine_snapshot'ta hesaplandı ama metrics_array'de görünmüyor** — THYAO dersinin aynısı ASELS'te tekrarlandı. Hesaplandıysa görünür olmalı.
- **Savunma KPI'ları tamamen eksik** — Backlog/Revenue, AR-GE harcaması/ciro, ihracat oranı, CCC 390.95 gün savunma sektörü benchmarkıyla karşılaştırılmadı (sektör ort. ~180-270 gün; 390 gün yüksek).
- **EBITDA null zinciri çözülmeden üretildi** — D&A parse'dan gelmiyor; EBITDA proxy üretilmedi ve "EBITDA NULL — D&A eksik" escalasyonu tetiklenmedi.
- **IAS 29 ayrıştırması yapılmadı** — ASELS Turkish GAAP/IAS 29 kapsamında; nominal Net Kar vs IAS 29 adjusted Net Kar karşılaştırması yoktu.

### Bundan Sonra:
- **Savunma sektörü zorunlu ek metrikler (her savunma analizinde):**
  1. Backlog/Revenue oranı (sipariş görünürlüğü)
  2. AR-GE harcaması/ciro % (maliyet yapısı ve rekabet avantajı)
  3. İhracat gelirleri/toplam ciro % (FX pozisyonu ve büyüme trendi)
  4. CCC savunma sektörü benchmark karşılaştırması (normal: ~180-270 gün)
- **Sektör override savunma şirketleri için zorunlu** — ASELS/ASELSAN, ROKET, FNSS → "defense_electronics" veya "defense". "industrial" fallback kabul edilmez.
- **DSO/DIO/DPO engine_snapshot'ta varsa metrics_array'e de ekle** — 3. direktif; artık hard kural.
- Cash FAVOK hic hesaplanmadi (TUPRS) — FAVOK != Cash FAVOK, ayri hesapla

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **DSO, DIO, DPO, CCC metrikleri tamamen eksik** — Chairman'ın zorunlu metrikleri listesinde açıkça yer alıyor; hiç hesaplanmadı.
- **Net İşletme Sermayesi / Hasılat ve NWC Gün Sayısı yok** — Working capital detayı (alacak, stok, borç satırları) upstream'den gelmediyse tahmini yöntemle üretilmeli ve [MEDIUM] etiketiyle sunulmalıydı.
- **Faiz Karşılama Oranı eksik** — EBIT / Faiz Gideri basit hesap; kaynak eksikliği gerekçe değil.
- **Cari Oran ve Asit-Test Oranı eksik** — Balance sheet toplamları vardı; alt satırlar çekilmese bile toplam/tahmin yapılabilirdi.
- **ROCE ve ROIC hesaplanmadı** — ROE vardı (VUK bazlı); ROCE ve ROIC eksik.
- **Cash FAVÖK ayrı hesaplanmadı** — FAVÖK ≠ Cash FAVÖK; IAS29 ve D&A düzeltmesi ayrı gösterilmeli.
- **Bölüm 5 (IAS29 ROE tablosu) truncated** — VUK/SPK ROE kıyaslama tablosu yarım bırakıldı.
- **5 yıllık IS trendi sadece 2 yıl** — FY2024 ve FY2025 var; 2020-2023 arası "[VERİ YOK]" ile geçiştirildi.

### Bundan Sonra:
- **Chairman'ın 25 metrik listesi her analizde kontrol listesi olarak kullanılacak:** Net Satışlar, Brüt Kar, FAVÖK, Cash FAVÖK, DSO, DIO, DPO, CCC, NWC/Hasılat, NWC Gün, Net Borç/FAVÖK, Faiz Karşılama, Cari Oran, Asit-Test, ROE, ROCE, ROIC, FCF, CAPEX/FAVÖK, OCF/FAVÖK — hepsi çıktıda MEVCUT olmak zorunda. Eksikse [TAHMIN: X] formatında tahmini değer ver.
- **Working capital metrikleri upstream eksik olsa bile hesaplanacak:** BS toplamları varsa tahmin yapılır. Tahmin güveni [LOW] olsa da metrik yoktan iyidir.
- **Cash FAVÖK ayrı satır:** FAVÖK − Capex + WC değişimi değil; OCF'e dayalı hesaplama yapılmalı ve "Cash FAVÖK ≠ FAVÖK" farkı yorumlanmalı.
- **Bölüm truncation = output geçersiz:** Bölüm kesilirse ikiye böl, ikisini de gönder. Yarım bölüm YASAK.

---

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu
### Eksikler:
- Chairman'in zorunlu metrik listesi tamamlanmadi: DSO, DIO, DPO, NWC/Hasilat, NWC gun sayisi, Cari Oran, Asit-Test, ROE, ROCE, ROIC, Cash FAVOK, FCF ve CAPEX/FAVOK ya ciktiya girmedi ya da gorunen kisimda kapatilamadi.
- Jeopolitik baglam ve telekom makro gecis mekanizmasi zayif kaldi; Iran-ABD, Rusya-Ukrayna, enerji ve faiz ortaminin TCELL ARPU, CAPEX, borclanma ve churn etkisi yeterince zincirleme anlatilmadi.
- Cikti icinde sayi tutarliligi supheli: Net Debt/FAVOK 2.6x ifadesi, reconciliation ve HTML tarafindaki diger rakamlarla ayni fact pack'e oturmuyor.
### Bundan Sonra:
- Her raporda Chairman listesindeki tum metrikleri `formula + 5Y trend + benchmark + yorum` seklinde tek tek kapat; eksikse BLOCKED veya tahmini etiketi kullan ama bos birakma.
- Jeopolitik ve makro bolumunu sektor gecis mekanizmasiyla bagla: olay -> operasyonel etki -> finansal metrik -> degerleme etkisi zinciri zorunlu olsun.
- Ciktiyi gondermeden once reconciliation, synthesis ve formatter ile ortak fact pack sayilarini capraz kontrol et; ayni sirket icin farkli Net Borc/FAVOK veya OCF kullanma.
### Eksikler:
- Cash FAVOK, OCF/FAVOK, CAPEX/FAVOK ve faiz karsilama gibi Chairman icin kritik nakit bazli metrikler tum 5 yila yayilan tek tabloda sunulmadi.
- Telekom-spesifik KPI'lar ile finansal oranlar ayni tez icinde baglanmadi; ARPU/churn/capex yogunlugu ile marj/nakit cevirimi kopuk kaldi.
### Bundan Sonra:
- Finansal analiz cikti acilisinda `Chairman mandatory metrics scoreboard` tablosu ver; her metrik icin hesaplandi/yorumlandi/kaynaklandi durumu net olsun.
- Telecom analizlerinde operasyonel KPI'lari finansal oranlarla ayni paragrafta bagla: ARPU, churn, capex intensity ve spectrum amortization FAVOK, OCF ve ROIC'e nasil donusuyor acikla.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu Post-Report Loop
### Eksikler:
- Chairman'in zorunlu oran seti tam kapsanmadı veya tek tek yorumlanmadi: DSO, DIO, DPO, CCC, NWC/hasilat, NWC gun, Cash FAVOK, cari oran, asit-test, faiz karsilama, ROCE ve ROIC ya eksik ya da yorumsuz kaldı.
- Net Borc/FAVOK, faiz karsilama ve FCF farkli metodolojilerle anlatildi; authoritative rasyo seti kullanılmadan yorum yapildi.
- Makro ve jeopolitik baglam telekom sektorune gecis mekanizmasiyla baglanmadi; Iran-ABD, Rusya-Ukrayna, enerji ve kur etkisi finansal tezlere yeterince yansimadi.
### Bundan Sonra:
- Her finansal analizde Chairman checklist'i satir satir kapat: her rasyo icin `rakam + degisim + neden + benchmark + TRY etkisi` yorumu olmadan bolum tamamlanmis sayilmayacak.
- Net Borc/FAVOK, faiz karsilama, OCF/FAVOK, FCF ve Cash FAVOK hesaplari reconciliation fact pack'indeki tek formulle alinacak; alternatif tanim kullaniliyorsa acikca ikinci tabloya ayrilacak.
- Makro/jeopolitik bolum, sektor-spesifik gecis mekanizmasi ile finansal sonuca baglanacak; sadece genel risk paragrafi yazmak artik yeterli degil.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Post-Report Feedback Loop
### Eksikler:
- Chairman'in istedigi scoreboard yapisi cikti basinda yoktu; hangi zorunlu metrik hesaplandi, hangisi blocked, hangisi tahmini netlesmedi.
- Telekom KPI'lari ile finansal donusum bagi yeterince kurulmadigi icin ARPU/churn/capex yogunlugu marj ve ROIC tezine zayif baglandi.
### Bundan Sonra:
- Finansal analiz her raporda ilk tabloda `mandatory metric status board` verecek; hesaplandi, contested, blocked alanlari tek bakista gorunecek.
- Telekom analizlerinde operasyonel KPI'dan finansala gecis zorunlu olacak: ARPU/churn/capex/spectrum amortization -> FAVOK/OCF/ROIC zinciri acik yazilacak.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **WC kalem bazında kırılım (DISC-005) çözülmedi** — Net WC değişimi -271,984 mn TL CF tablosundan alındı ✓. Ancak AR artışı (+55,073 tahmini), stok artışı (+40,089 tahmini) bireysel kalemler BS karşılaştırmasından *türetildi*; FY2024 AR "~185,000*" asteriskli. DSO/DIO/DPO güven seviyesi LOW. BS doğrudan satırları çekilmeliydi.
- **Faiz Karşılama Oranı (EBIT/Faiz) hesaplanamadı** — Interest expense upstream'den gelmiyor; bu metrik Chairman listesinde zorunlu. "Interest expense veri yok" mazeret değil; tahmini olarak bile `[conf: LOW, EBITDA proxy]` formatında verilmeliydi.
- **Solo/parent analizi eksik — 3 katlı analizin sadece konsolide kısmı yapıldı** — Holding zorunlu kuralı: (1) Parent-level, (2) Konsolide, (3) Segment. Parent-only gelir (temettü + yönetim ücreti ~2.757B TRY) vs konsolide 2.76T TRY ayrımı yapılmadı.
- **IFRS 8 segment bazlı ROE/ROCE/ROIC eksik** — Holding zorunlu metriği; GCM SOTP'un segment katkıları EBITDA bazlıydı; ROIC segment bazında hesaplanmadı.
- **Tekrarlayan FCF negatifliğinin sürdürülebilirlik analizi eksik** — FCF -204,862 mn TL tarihsel en kötü seviye; 3 yıllık projeksiyon (ne zaman normalize olur?) stratejik sentez için zorunlu girdi. "WC normalleşirse FCF pozitife döner" cümlesi var ✓ ama sayısallaştırılmadı.

### Bundan Sonra:
- **WC kalem BS doğrudan satırı** — FY2024 BS satırları asterisksiz çekilecek; yıl sonu BS farkı ile CF tablosu farkı arasında reconciliation yapılacak. Fark >5% → DISC flag.
- **Interest expense eksikse proxy tahmini ver** — "Net finansal gider / debt × faiz oranı" yöntemiyle tahmini faiz gideri `[conf: LOW, proxy]` formatında hesaplanacak. Boş bırakma.
- **Her holding raporunda parent-only satır zorunlu** — Solo gelir + solo borç + solo temettü ödemesi ayrı satırlarda canonical fact pack'te yer alacak.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **6/28 metrik hesaplandı — %21 tamamlama** — 28 zorunlu metrik var; sadece 6 üretildi. EBITDA/EBITDAR null zinciri tüm metrikleri bloke etti. "Veri yok" = eskalasyon zorunlu, geçiş yasak.
- **EBITDAR null — 3. THYAO analizi** — Havacılığın birincil metriği 3 rapor boyunca üretilmedi. Bunun sebebi D&A + IFRS 16 kira gideri upstream'den gelmiyor; eskalasyon tetiklenmedi.
- **Sektör "industrial" olarak etiketlendi — 3. THYAO analizi** — THYAO = havacılık sektörü. "industrial" etiketi peer benchmark seçimini tamamen bozuyor. Bu üçüncü tekrardır; artık kural olarak hard-coded gerekli.
- **DSO/DIO/DPO engine_snapshot'ta ama metrics array'de yok** — Hesaplandı ✓ ama output formatında metrics dizisine eklenmedi. QA bu metrikleri göremedi; Chairman metrik sayımı eksik çıktı.
- **ROE %13 TRY CoE ~%30 ile karşılaştırılmadan verildi** — ROE < CoE = değer imhası. Bu yorum yapılmadan ROE rakamı anlamsız. Her ROE satırının yanında CoE benchmark ve "değer yaratıyor mu?" yorumu zorunlu.
- **Tüm WC metrikleri (DSO/DIO/DPO/CCC/NWC) hesaplandı mı?** — CCC zinciri (DSO + DIO - DPO) null bırakıldı; CF WC değişimi ile kontrol yapılmadı.

### Bundan Sonra:
- **THYAO sektör etiketi = "aviation" (hard-coded, değiştirilemez)** — Sektör tespitini otomatik bırakma; THYAO analizinde sektör = aviation, peer group = Lufthansa/IAG/Wizz Air/flydubai/Delta. Upstream etiket ne gelirse gelsin overwrite et.
- **EBITDA/EBITDAR null → eskalasyon, output YOK** — D&A null veya IFRS 16 null gelirse: (1) parse_standardization'a eskalasyon aç, (2) output üretme, (3) CEO'ya bloker bildir. 3 defa tekrarlanmasına izin vermiyoruz.
- **metrics array = engine_snapshot ile eşit** — engine_snapshot'ta hesaplanan her metrik metrics[] dizisine de eklenecek. DSO/DIO/DPO/CCC/NWC bunlara dahil.
- **ROE yorumu = "ROE %X vs TRY CoE ~%Y → değer [yaratıyor/imha ediyor]"** — CoE benchmark havacılık için ~%28-32 TRY; bu satır her analizde görünür.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **6/28 metrik (%21 tamamlama) — 4. THYAO analizi, tolerans sıfır** — Üretilen: GROSS_MARGIN, NET_MARGIN, ROE, CCC, NET_DEBT, PIOTROSKI_F. Eksik: EBITDAR, EBITDA_MARGIN, FCF, ROIC, CAPEX/EBITDA, OCF/EBITDA, faiz karşılama, NWC/Revenue, RASK, CASK, EBITDAR_MARGIN ve daha fazlası.
- **EBITDAR null — 4. THYAO direktifi** — Havacılık analizinin birincil metriği. EBITDA null → EBITDAR proxy bile üretilmedi. THYAO 2025 EBITDAR marjı %23.2 bilinmesine rağmen sıfır girdi üretildi.
- **Sektör "industrial" — 4. THYAO analizi, sistematik arıza** — THYAO = aviation; "industrial" fallback 4 analizdir düzeltilmedi. Bu upstream override yapılmadan çalışılamaz.
- **DSO=17.25, DIO=18.66, DPO=35.39 engine_snapshot'ta hesaplandı ama metrics[] dizisine eklenmedi** — Chairman metrik listesinde zorunlu; hesaplandı ama görünmüyor. Bu raporlama eksikliği 3. THYAO'da da devam etti.
- **ROE %12.96 yorumsuz verildi** — TRY sermaye maliyeti ~%28-30; ROE < CoE = değer imhası. narrative_hint "TRY cost of capital ~30%" yazıyor ama "değer yıkımı" yorumu yok. Bu 3. THYAO'da da aynı eksiklik.
- **Havacılık operasyonel KPI'lar (CASK/RASK/LF/RPK/ASK) hesaplanmadı** — THYAO 2025 referans: CASK US¢8.55, RASK US¢7.21, LF %83.6. Bu değerler context_extraction'dan gelmesi durumunda dahi financial_analysis bölümünde yorumlanması zorunlu.
- **IAS 29 adjusted metrikler yok** — TÜFE >100% olduğu dönemler; THYAO USD ağırlıklı ama IAS 29 etkisi ayrıştırılmadı.

### Bundan Sonra:
- **EBITDAR proxy zorunlu (4. direktif, tolerans sıfır)** — EBITDA null ise: Operating Income + D&A sektör proxy (%15-18 of Revenue) + IFRS 16 kira gideri (kontekst veya dipnottan) = EBITDAR `[conf: MEDIUM]`. Null → metrics array'de "[EBITDAR NULL — D&A eksik, parse eskalasyonu tetiklendi]" yaz.
- **metrics array eksikse output PASS VERİLMEZ** — engine_snapshot'ta hesaplanan her metrik metrics[] dizisine eklenecek. DSO/DIO/DPO/CCC bu listeye zorunlu dahil. Eksik = mandatory_metrics_complete: FALSE.
- **Aviation KPI bölümü her THYAO analizinde** — CASK/RASK/LF/RPK/ASK — finansal tablolardan hesaplanamazsa context/kap_watch/trafik bildirimlerinden çekilecek ve ayrı "Operasyonel KPI" bölümü olarak raporlanacak.
- **Sektör override lokal kuralı** — THYAO, PEGYS, ONUIR → sector = "aviation" hard-coded; upstream "industrial" gelirse overwrite et. Bu override kodu financial_analysis başlangıç adımında yer alacak.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **6/28 metrik (%21 tamamlama) — 5. THYAO analizi, sistematik arıza** — Üretilen: GROSS_MARGIN, NET_MARGIN, ROE, CCC, NET_DEBT, PIOTROSKI_F. Geri kalan 22 metrik null.
- **EBITDAR null — 5. THYAO direktifi** — Havacılık analizinin birincil metriği. EBITDA null → EBITDAR proxy bile üretilmedi.
- **Sektör "industrial" — 5. THYAO analizi, sistematik arıza** — THYAO = aviation; "industrial" fallback 5 analizdir düzeltilmedi. Upstream override yapılmadan çalışılamaz.
- **DSO/DIO/DPO engine_snapshot'ta hesaplandı ama metrics[] dizisine eklenmedi — 4. THYAO** — Chairman metrik listesinde zorunlu; hesaplandı ama görünmüyor.
- **ROE %12.96 TRY CoE ile karşılaştırılmadı** — TRY sermaye maliyeti ~%28-30; ROE < CoE = değer imhası yorumu yapılmadı.
- **Havacılık KPI (CASK/RASK/LF/RPK/ASK) hesaplanmadı** — Context_extraction'dan dahi alınabilirdi; 5 analizdir eksik.
- **IAS 29 adjusted metrikler yok** — Türkiye'de zorunlu; THYAO USD ağırlıklı olsa da ayrıştırılmadı.

### Bundan Sonra:
- **EBITDAR proxy zorunlu (5. direktif, tolerans sıfır)** — EBITDA null ise: Operating Income + D&A sektör proxy (%15-18 of Revenue) + IFRS16 kira = EBITDAR [conf: MEDIUM]. Null → metrics array'de "[EBITDAR NULL — D&A eksik, eskalasyon tetiklendi]".
- **Sektör override başlangıç adımı** — THYAO/PEGYS/ONUIR → sector = "aviation" hard-coded; upstream ne gelirse gelsin. "industrial" fallback YASAK.
- **metrics array = engine_snapshot ile eşit** — engine_snapshot'ta hesaplanan her metrik metrics[] dizisine de eklenir. DSO/DIO/DPO/CCC bu listeye zorunlu dahil.
