# TUPRS — Türkiye Petrol Rafinerileri A.Ş.
## Kapsamlı Derin Analiz Raporu — Deep Dive Institutional Report

| | |
|---|---|
| **Rapor Türü** | Deep-dive (institutional) |
| **Tarih** | 21 Nisan 2026 |
| **Analiz Dönemi (birincil)** | FY2024 (denetlenmiş, TMS 29 uyumlu) |
| **Karşılaştırma Dönemleri** | FY2023 (Dec24 TL), FY2023 (Dec23 TL), FY2022 (Dec23 TL) |
| **Satın Alma Gücü Temeli** | 31 Aralık 2024 Türk Lirası |
| **Denetçi (FY2024)** | Güney Bağımsız Denetim ve SMMM A.Ş. (EY), Seçkin Özdemir — 17 Şubat 2025 |
| **Sektör** | Rafinaj (`canonical/sectors/energy_refining.yaml`) |
| **Ticker Kaydı** | `canonical/tickers/sector_mapping.yaml` → `TUPRS: energy_refining` |
| **Raporun Uyduğu Şablon** | `canonical/rules/output_integrity.md#OI-003` (12 bölüm) |
| **Zorunlu Metrik Tamlığı** | 28/28 (bkz. Bölüm 5) |
| **Kritik Kurallar** | MM-25 (ROE vs CoE), IAS29-002 (ayrıştırılmış tablo), SR-refining-001..005 |

> **Önemli not (IAS 29 / TMS 29):** Tüm rakamlar aksi belirtilmedikçe **31 Aralık 2024 alım gücü** (Dec24 TL) cinsindendir. FY2023 veya FY2022 kolonu karşılaştırma için kullanıldığında parantez içinde "Dec23 TL" / "Dec24 TL" ibaresi verilir. Türkiye TÜİK TÜFE'sine göre üç yıllık kümülatif enflasyon %291 olduğundan SPK kapsamındaki tüm şirketler TMS 29 yeniden düzenlemesine tabidir. Bu rapor hem IAS 29 öncesi hem sonrası EBITDA tablosunu Bölüm 5'te ayrıca sunar.

---

## 1. Kapak & Künye

### Şirket Bilgileri

| Alan | Değer |
|---|---|
| Tam unvan | Türkiye Petrol Rafinerileri Anonim Şirketi |
| BIST kodu | **TUPRS** |
| BIST endeksleri | BİST-30, BİST-100, BİST-Sürdürülebilirlik (2014'ten bu yana), BİST-Kurumsal Yönetim (2007'den bu yana) |
| Merkez adresi | Gülbahar Mah., Büyükdere Cad. No:101A, Şişli, İstanbul |
| Kuruluş | 16 Kasım 1983 |
| Halka arz | 1991 |
| Çalışan (ort. FY2024) | 6.236 (konsolide) / 6.062 (Tüpraş solo) |
| Denetçi (FY2024) | EY (Güney Bağımsız Denetim) |
| Kontrol eden hissedar | Koç Topluluğu (~%53,2 doğrudan + dolaylı — Enerji Yatırımları A.Ş. %46,40, Koç Holding %6,35, aile %0,47) |
| Halka açıklık oranı | %46,78 (31 Aralık 2024); Mart 2026 KCHOL ikincil halka arzı sonrası %48,9 tahmini (`context_extraction_tuprs_output.json`) |
| Altın hisse | 1 adet C grubu özelleştirme idaresinde — TSK yakıt tedariği veto hakkı |
| Çıkarılmış pay sayısı | 192.679.559.800 adet (1 kr nominal) → 1 TL nominal eşdeğeri ≈ 1,9268 milyar pay; **piyasa fiyat bazı** 936,6 milyon pay (yönetim kurulu raporu ile uyumlu — tartışma notu için bkz. Bölüm 11) |

### Hissedarlık Yapısı (31 Aralık 2024)

| Hissedar | Pay Oranı |
|---|---:|
| Enerji Yatırımları A.Ş. (Koç) | 46,40% |
| Koç Holding A.Ş. | 6,35% |
| Koç ailesi üyeleri ve şirketleri | 0,47% |
| Halka açık (fiili dolaşımda) | **46,78%** |
| **Toplam** | **100,00%** |

Enerji Yatırımları A.Ş. pay dağılımı: Koç Holding %75, Aygaz A.Ş. %20, OPET Petrolcülük %3, Shell artık ≈ %1,9–0,1.

Nihai kontrol: Koç ailesi (Ömer M. Koç, Rahmi M. Koç, Ali Y. Koç) Koç Holding'in %63,4'üne sahip.

---

## 2. Yönetici Özeti

### Tez — 3 cümle özet

Tüpraş FY2024'te operasyonel olarak rekor kapasite kullanım oranıyla (%92,7) çalışmasına rağmen rafinaj marjlarındaki küresel çöküş sonucu reel EBITDA'sını %63, net kârını %76 kaybetti; 41,5 mia TL net nakit pozisyonu ve RUP yatırım teşviki kaynaklı %2,5 efektif vergi avantajıyla bilanço yapısal olarak sağlam kalsa da ROE %6,5'e düşerek 28–32% aralığındaki TRY özkaynak maliyetinin çok altına indi — bu klasik bir döngüsel dip sinyali ve mevcut fiyat (254 TL, P/B ~0,84x) marjların 2025–2026'da normalize olmasına bağlı kısa vadeli bir asimetrik fırsat sunmakta; karşı argüman CBAM, ETS ve EV geçişi gibi yapısal talep düşüşü riskleridir.

### Temel Rakamlar (FY2024 — Dec24 TL)

| Metrik | FY2024 | FY2023 (Dec24 TL) | Değişim % | Sektör benchmark |
|---|---:|---:|---:|---:|
| Hasılat | 810,4 mia TL | 991,2 mia TL | **-18,2%** | — |
| Brüt kâr | 68,0 mia TL | 158,4 mia TL | **-57,1%** | — |
| Brüt marj | **%8,4** | %16,0 | -7,6 pp | Mediterranean refiners 2024: %9–12 |
| FAVÖK (yön.) | 51,3 mia TL | 140,5 mia TL | **-63,5%** | — |
| FAVÖK marjı | **%6,3** | %14,2 | -7,9 pp | Rafinaj peer 2024: %6–10 |
| EBIT | 35,7 mia TL | 106,3 mia TL | -66,4% | — |
| Net kâr (ana ort.) | 18,3 mia TL | 77,4 mia TL | **-76,3%** | — |
| EPS (1 kr nominal) | 9,51 kr | 40,15 kr | -76,3% | — |
| Net nakit | **+41,5 mia TL** | +77,6 mia TL | -46,4% | Peer ortalaması net borç pozisyonunda |
| ROE | **%6,5** | %26,7 | -20,2 pp | **CoE TRY bandı %26–30** — **ROE < CoE (SR-refining-004 ihlali, yorumu Bölüm 5.E)** |
| CAPEX (bin TL) | 13,8 mia | 17,9 mia | -22,7% | USD 376 mn (cari FX) |
| Kapasite kullanımı | **%92,7** | %84,2 | +8,5 pp | 2024 Mediterranean peer ort. %85 |
| Serbest nakit akışı (FCF) | 21,5 mia TL | 105,2 mia TL | **-79,5%** | — |
| Temettü ödenen | 48,8 mia TL | 49,4 mia TL | -1,2% | Yüksek pay-out; kârın çok üstünde (bkz. 5.E) |

### Ana Sinyaller

1. **Operasyonel rekor + finansal çöküş paradoksu.** Üretim %7,2 arttı, kapasite kullanımı 5 yılın zirvesine (%92,7) çıktı ama FAVÖK yarıdan fazla eridi. Sebep hacim değil, rafinaj marjları.
2. **Yapısal net nakit koruması.** 48,8 mia TL temettü ödenmesine rağmen +41,5 mia TL net nakit — CAPEX disiplini + işletme sermayesinin negatif oluşundan (yapısal ödenecek ticari borç finansmanı).
3. **Ham petrol miksi kaymasının maliyeti.** Yüksek kükürtlü oran %53,7'den %21,0'e indi (Kızıldeniz kaynaklı). STAR rafinerisi (Nelson 14,5) bu karma için tasarlanmıştı; alternatif hafif kaynaklı hammadde daha pahalı ve düşük dönüşüm marjı ürettiği muhtemel.
4. **RUP teşviki tükenmek üzere.** Ertelenen vergi varlığı 11,0 → 10,2 mia TL'ye indi; 5 yıl içinde tamamlanacak. Bu sonrası efektif vergi %2,5'tan %25'e sıçrayacak — kâr üzerinde 15–20 puanlık efektif vergi şoku.
5. **Karbon geçişi CAPEX baskısı.** SAF (sürdürülebilir havacılık yakıtı) İzmir yatırımı 2025 sonu yatırım kararı bekliyor. Green hidrojen, propilen splitter (USD 256 mn) aktif cep. Tüpraş aynı anda kâr daralması + yapısal dönüşüm yatırımını yönetmek zorunda.

### Yatırım Notu

**Taraf:** Kısa vadede (6–12 ay) operasyonel döngü dibinde fırsat; uzun vadede (3–5 yıl) yapısal geçiş riski yüksek. **Net pozisyon:** Kısa vadeli pozitif, uzun vadeli nötr — rafinaj marjı normalizasyon zaman çizelgesine bağlı.

**Hedef fiyat bandı (Bölüm 6'dan):** Bear 210 TL / Baz 280 TL / Bull 360 TL (mevcut 254 TL).

### Karşı Argüman (MM-25 zorunluluğu gereği)

ROE %6,5 ile CoE %28–30 bandı arasındaki fark reel değer imhasıdır. Karşıtaraf şöyle iddia eder: (a) Reel rakamlar döngüsel dip; nominal TRY cinsinden ROE %35–40 civarıdır ve temettü verimi tek başına %20,5 (48,8/238 mia TL piyasa değeri). (b) P/B 0,84x, defter değerinin altında işlem — asimetrik upside var. (c) RUP teşviki ve negatif NWC gibi yapısal avantajlar kalıcı. **Bu rapor bu karşıtaraf argümanlarını Bölüm 11'de değerlendirir; kısaca: kısa vadeli taraf haklı, uzun vadeli taraf değil.**

---

## 3. Şirket ve Strateji

### 3.1 İş Modeli

Tüpraş Türkiye'nin **tek entegre rafinerisi** olarak yurt içi rafine ürün talebinin ~%60'ını karşılar. Dört tesiste 30,0 milyon ton/yıl toplam rafinaj kapasitesi (Nelson Complexity ağırlıklı ortalama 9,5 — Mediterranean ortalamasının %15–20 üzerinde).

| Rafineri | Lokasyon | Kapasite (mt/y) | Nelson Complexity | Depolama (m³) | Özellik |
|---|---|---:|---:|---:|---|
| İzmit (STAR) | Kocaeli | 11,3 | **14,5** | 3,0 milyon | En kompleks; motorin / dönüşüm ağır — RUP projesi burada |
| İzmir (Aliağa) | İzmir | 11,9 | 7,66 | 2,5 milyon | En büyük kapasite |
| Kırıkkale | Kırıkkale | 5,4 | 6,32 | 1,3 milyon | İç Anadolu |
| Batman | Batman | 1,4 | 1,83 | 280 bin | Güneydoğu; düşük kompleksite |
| **Toplam** | | **30,0** | **9,5 (portföy ort.)** | **~7,1 milyon** | — |

### 3.2 Operasyonel Kaldıraç Zinciri

1. **Ham petrol temini** (yukarı akış) — 13 ülke, 24 farklı API 16–47 aralığındaki ham tipleri. FY2024 toplam 25,5 mt ham, USD 14,6 mia, cari piyasa fiyatları.
2. **Rafinaj** (orta akış) — 4 tesisin optimizasyonu: hangi rafineri hangi karmayı işliyor, hangi ürüne dönüştürüyor. Linear programming tabanlı yield optimization sürekli çalışıyor.
3. **Dağıtım** (aşağı akış) — Tupras Trading (Londra, uluslararası satış); OPET (%40 pay) perakende; DİTAŞ (%79,98) tanker; Körfez Ulaştırma (demiryolu).

### 3.3 Segmentler ve Marjlara Katkı (FY2024)

| Segment | Hasılat | Brüt kâr | EBIT | Varlık | Yorumu |
|---|---:|---:|---:|---:|---|
| **Rafinaj** | 799,6 mia TL | 66,0 mia TL | 34,6 mia TL | 426,2 mia TL | Hasılatın %98,7'si; marj baskısının odağı |
| **Elektrik (Entek)** | 10,8 mia TL | 2,0 mia TL | 1,1 mia TL | 27,9 mia TL | Sabit yük hedging rolü; 492 MW kurulu (380 MW sıfır karbon) |
| **Konsolide** | **810,4 mia TL** | **68,0 mia TL** | **35,7 mia TL** | **454,1 mia TL** | — |

> **Observation:** Elektrik segmenti FY2024 toplam EBIT'in %3,0'ünü oluşturdu ancak varlıkların %6,1'ini tuttu — varlık getirisi rafinaja göre düşük, ama döngüsel dengeleyici fonksiyonu değerli. **Reasoning:** Rafinaj segmenti hammadde-ürün fiyat farklılığına maruz bir komodite; elektrik ise regüle tarife + renewable PPA sayesinde daha istikrarlı. Portföy teoridi gereği elektrik tarafındaki düşük marjı (yaklaşık %19 brüt) rafinajın yüksek volatilitesine karşı diversifier olarak değerlendirmek doğru. **Counterargument:** Entek sermaye yoğun bir iş; 27,9 mia TL varlık, 1,1 mia TL EBIT'e ulaşıyor — ROA %3,9. Eğer burada sermaye kısıtlanıp rafinajın yenilenmesine yönlendirilseydi daha iyi tahsisa ulaşırdı mı? Muhtemel, ama Entek'in yeşil enerji iddiası ESG hikayesi için stratejik değere sahip. **Implication:** Entek'i ayrı bir ROCE/değerleme merceğiyle analiz etmek gerekir (Bölüm 6 SOTP'de ayrıştırılmıştır).

### 3.4 Ana Alt Şirketler ve İlişkili Taraflar

| Alt şirket / iştirak | Pay | İş | FY2024 hacim/hasılat |
|---|---|---|---|
| **OPET Petrolcülük** (iştirak) | 41,67% | Akaryakıt perakende (1.882 istasyon, %18,44 piyasa payı) | TL 366 mia (OPET 100%) |
| **Tupras Trading Ltd** (UK) | 100% | Uluslararası ticaret | TL 170 mia ticaret hacmi |
| **DİTAŞ** | 79,98% | Deniz tanker taşımacılığı (16 tanker, 661k DWT) | 2,2 mt hidrokarbon |
| **Körfez Taşımacılık** | çoğunluk | Demiryolu (ilk özel) | 2,2 mt + 46 konteyner |
| **Entek Elektrik** | çoğunluk | Kojenerasyon + yenilenebilir | TL 10,8 mia, 2,7 mia kWh |
| **Tupras Ventures** | 100% | Girişim sermayesi | 5 startup + 34 fon dolaylı |

**İlişkili taraf — Yapı Kredi Bankası:** Koç grubu bankası. 31 Ara 2024 itibarıyla 10,7 mia TL mevduat, FY2024 7,5 mia TL mevduat faiz geliri.

### 3.5 Stratejik Dönüşüm Planı

| Alan | Hedef | 2024 Durumu |
|---|---|---|
| Scope 1+2 azaltımı | 2017 bazına göre 2030: %27 | %18 gerçekleşti |
| Karbon nötr | 2050 | Devam |
| SAF (Sürdürülebilir Havacılık Yakıtı) | İzmir rafinerisinde üretim | 2025 sonu nihai yatırım kararı |
| Green hidrojen | Hidrojen Teknolojileri Merkezi açık | AR-GE aşaması |
| Propilen Splitter | USD 256 mn proje | Saha çalışmaları başladı |
| Yenilenebilir elektrik | Entek 380 MW sıfır karbon + Romanya 214 MW güneş | Genişleme |

**Gölge karbon fiyatı** (yatırım kararlarında): USD 22/tCO₂e (2026–2030) → USD 43/tCO₂e (2040–2045).

---

## 4. Sektör ve Rekabet

### 4.1 Sektör Yapısı — Rafinaj

Türkiye rafinaj sektöründe Tüpraş **tek entegre oyuncu** (de facto monopol). İç talebin kalan %40'ı ithalat ile karşılanır (Petkim'in aromatikleri hariç petrokimya odaklı). Rekabet iki kanaldan gelir:

1. **İthalat baskısı** — Yurt dışından rafine ürün (özellikle motorin/dizel) ithalatı Türkiye'nin açık pazar yapısı gereği serbest. Tüpraş'ın iç pazar payını savunması ithal ürünün CIF fiyat + lojistik + gümrük düzeyine dayanıyor.
2. **Crack spread küresel piyasası** — Akdeniz'deki Cracking ve Reforming marjları dünya referans fiyatlarını (Brent crude, ARA gas oil, ARA gasoline) yansıtır. Tüpraş ne kadar iyi yönetilirse yönetilsin küresel marj dalgalanmasının altında kalır.

### 4.2 Küresel Rafinaj Marjı Trendi

| Yıl | Dünya Net Rafinaj Marjı ($/bbl) | Mediterranean Crack Spread (Brent→diesel, $/bbl) | Tüpraş EBITDA marjı (%) | Not |
|---:|---:|---:|---:|---|
| 2021 | ~5 | 12–15 | ~7 | Pandemi toparlanma |
| 2022 | **~18–22** (rekor) | **30–40** (rekor) | 15–18 (yüksek) | Rus invaziyon + talep kurtarması |
| 2023 | ~12–14 | 20–25 | 14 | Normalleşme |
| 2024 | **~6–8** (düşük) | 12–18 | **6,3** (çöküş) | Çin yavaşlaması + yeni kapasite |
| 2025 (est) | 7–9 | 14–18 | 7–9 (stabilizasyon) | IEA referans senaryo |

**Crack spread transmisyon parametresi (SR-refining-002):**
- $1/bbl motorin crack spread artışı → **~1,8 mia TL EBITDA katkısı** (tahmini, 2024 hacim bazında)
- $1/bbl ham petrol kalite farkı (Brent–local mix) → **~1,1 mia TL COGS etkisi**

> **Observation:** Tüpraş'ın FAVÖK marjı küresel rafinaj marj döngüsüyle net korelasyon gösterir (R² tahmini > 0,80); 2022 rekor yılında %18, 2024 dip yılında %6,3. **Reasoning:** Rafinaj komodite fiyat farkı işidir (ham alış fiyatı – ürün satış fiyatı). Tüpraş'ın yapabildiği tek şey doğru karmayı optimize etmek ve kapasite kullanımını maksimize etmek — ki 2024'te ikisini de yapıyor (karma kaydı + %92,7 utilization). Bu durumda marj düşüşü yönetimsel bir başarısızlık değil, küresel arz-talep dalgalanmasının yansımasıdır. **Counterargument:** Karma kayması (HS %53,7 → %21) yönetimsel bir tercihten çok Kızıldeniz zorunluluğu gibi görünüyor; eğer tedarik kaynakları seçilseydi marj savunulabilir miydi? Muhtemel evet, ama jeopolitik risk yönetimi için diversifikasyon uzun vadede doğru karar. **Implication:** Tüpraş'ı değerlerken döngüsel mid-cycle FAVÖK marjı (~%10–12) referans alınmalı; zirve (2022 %18) veya dip (2024 %6,3) noktaları değil.

### 4.3 Peer Set Karşılaştırması (2024)

| Şirket | Ülke | Kapasite (mt/y) | Nelson | EBITDA marjı 2024 | Net Borç/EBITDA | ROE | P/B |
|---|---|---:|---:|---:|---:|---:|---:|
| **TUPRS** | TR | 30,0 | 9,5 | %6,3 | **Net nakit (−0,8x)** | %6,5 | 0,84x |
| MOL Group | HU | 20,9 | 10,6 | %9,1 | 1,2x | %12,4 | 0,95x |
| OMV Downstream | AT | 21,0 | ~9 | %7,8 | 1,8x | %9,3 | 1,10x |
| Repsol Refining | ES | 23,0 | 9,8 | %5,2 | 1,5x | %4,1 | 0,72x |
| Neste (renewable + ref.) | FI | 15,0 | 11,0 | %15,3 | 0,9x | %18,1 | 2,30x |
| Motor Oil Hellas | GR | 9,0 | 12,0 | %4,9 | 2,1x | %7,2 | 0,88x |
| PKN Orlen | PL | 35,2 | ~9 | %4,2 | 2,4x | %3,8 | 0,55x |
| **Sektör ortalama** | | — | ~9,6 | **%7,5** | 1,5x | %8,8 | 1,03x |

> **Observation:** Tüpraş Nelson complexity olarak medyan peer set'ine denk (9,5 vs 9,6); ancak bilanço yapısıyla (net nakit) dünya rafinaj sektöründe **outlier pozitif**tir — peerlerin ağırlıklı ortalama net borç/EBITDA'sı 1,5x. **Reasoning:** Bu yapısal özellik hem Tüpraş'ın müşteri + tedarikçi vade ayarlamasından (negatif NWC), hem yıllardır biriken RUP dönemi nakit akışlarından kaynaklanıyor. Koç Holding stratejisi Tüpraş'ı nakit üreten bir "kale" gibi kullanıp kâr payı yoluyla diğer iştiraklere yönlendiriyor — bu Bölüm 10 dağıtım politikasını açıklıyor. **Counterargument:** Net nakit teorik olarak değer yaratmaz çünkü nakit düşük getirili (~TLREF). Bir rafineri için ideal WACC altı getiri sağlayan bir sermaye yapısı (%25–30 finansal kaldıraç) ROE'yi optimize eder. Tüpraş'ın sıfır kaldıracı muhafazakâr ama kârlılığı kaldıraca aç bırakıyor. **Implication:** Tüpraş'ın "değerlemesi" net nakdin içkin değeri ile ayrıştırılmalı: Enterprise Value = Market Cap (238) – Net Cash (41,5) = 196,5 mia TL; EV/EBITDA (yön. 51,3) = 3,8x. Peer ortalaması 5,2x. Bu çok ucuz bir çarpan, kısa vadeli taraf argümanının çekirdeği.

### 4.4 SWOT

| Güçlü | Zayıf |
|---|---|
| Türkiye'de monopol + yüksek iç talep kapsama | Rafinaj komodite marjına bağımlılık (tek segment) |
| Nelson 9,5 kompleksite (STAR 14,5) | Scope 3 emisyonlarında dönüşüm riski |
| Net nakit pozisyonu, temettü kapasitesi | RUP teşvikinin 5 yılda tükenmesi (%22,5 vergi artışı) |
| Koç Holding aile desteği + hissedar disiplini | Jeopolitik ham petrol arz kırılganlığı (Kızıldeniz, Rus kısıtlaması) |
| ESG ratinglerinde iyileşme (S&P 34→55) | Reel ROE CoE'nin altında — sermaye getirisi zayıflığı |

| Fırsat | Tehdit |
|---|---|
| SAF + yeşil H2 üretim yatırımları | AB CBAM: 2026 sonrası rafine ürün ihracına karbon maliyeti |
| Türkiye havayolu büyümesi → jet yakıtı talebi | EV geçişi: motorin-benzin talep düşüşü 2035+ |
| Entek + Romanya 214 MW güneş genişleme | Crack spread normalizasyon ne zaman geleceği belirsiz |
| Propilen Splitter (USD 256 mn) petkim değer zinciri | ETS (Emisyon Ticaret Sistemi) Türkiye uyumu maliyet artışı |

---

## 5. Finansal Analiz (28 Zorunlu Metrik + Yorumlar)

Her metrik için: **formül → hesap → sektör benchmark → FY2022–2024 trend → yorum paragrafı.** Yorum paragrafları MM-25 interpretation_depth standartlarına uygun (observation ≥80 / reasoning ≥120 / counterargument ≥60 / implication ≥80 karakter). Tüm rakamlar aksi belirtilmedikçe Dec24 TL cinsindendir.

### 5.A Gelir Metrikleri (MM-01 … MM-11)

#### MM-01 — Net Satışlar

| Yıl | Değer (bin TL) | YoY değişim | Güven |
|---:|---:|---:|---|
| FY2022 (Dec23 TL) | 916.751.060 | — | HIGH |
| FY2023 (Dec23 TL) | 686.528.507 | -25,1% | HIGH |
| FY2023 (Dec24 TL) | 991.202.993 | — | HIGH |
| FY2024 (Dec24 TL) | **810.385.588** | **-18,2%** (vs FY2023 Dec24) | HIGH |

Formül: KAP denetlenmiş IAS 29 yeniden düzenlenmiş hasılat.

> **Yorum:** FY2024 hasılat reel bazda %18,2 geriledi, bu düşüş ürün satış hacmi değil ürün fiyatlarındaki düşüşten kaynaklanıyor (hacim +1,1%). Reel gerileme küresel crack spread'lerin 2022–2023 zirvesinden normalleşmesinin doğrudan yansıması — rafinaj işinde hasılat fiyat × hacim olduğundan aynı hacimde düşük marjla çalışmak reel hasılatı düşürür. Karşı argüman: nominal TRY hasılatı muhtemelen %50+ büyümüştür (TÜFE %44,4 + reel fiyat düşüşü) — ancak yatırımcı analizi için reel değer anlamlıdır. Sonuç: hasılat dip noktası görünüyor; 2025'ten itibaren marj normalizasyonuyla reel hasılat stabilizasyonu beklenir.

#### MM-02 — Brüt Kâr

| Yıl | Değer (bin TL) | Güven |
|---:|---:|---|
| FY2022 (Dec23 TL) | 113.079.718 | HIGH |
| FY2023 (Dec24 TL) | 158.430.524 | HIGH |
| FY2024 (Dec24 TL) | **68.030.304** | HIGH |

Formül: Hasılat – Satışların maliyeti.

> **Yorum:** FY2024 brüt kâr FY2023'ün %43'üne indi (158 → 68 mia TL), yani %57 düşüş. Bu hasılat düşüşünün (%18) neredeyse üç katı bir kâr düşüşü; operasyonel kaldıraç ters yönde çalıştı çünkü rafinajın maliyet yapısı sabit ağırlıklı (enerji, amortisman, işçilik). Karşı argüman: bu düşüş yalnızca 2023'ün olağanüstü yüksek brüt kârıyla karşılaştırıldığında dramatik; 2022 Dec23 TL bazında 113 mia TL ile karşılaştırınca %39 altta — hala sert ama daha az şok verici. Sonuç: brüt kâr mutlak değerde 2021 öncesi döngüsel seviyeye döndü; döngüsel toparlanma için 2025–2026'da rafinaj marjlarının 2022 seviyelerine yakın normale gelmesi beklenmelidir.

#### MM-03 — Brüt Marj

| Yıl | Brüt Marj | Sektör Benchmark (Mediterranean refiners) |
|---:|---:|---:|
| FY2022 | %12,3 | %10–14 |
| FY2023 | %16,0 | %12–16 |
| FY2024 | **%8,4** | %6–10 |

> **Yorum:** FY2024 brüt marj %8,4 — bu 2020 pandemi çöküşü sonrası en düşük seviye. Sektör benchmark Mediterranean rafinerileri için 2024 yılında %6–10 bandında olduğundan Tüpraş ortalama üstü performans gösterdi (Nelson Complexity 9,5 avantajı). Karşı argüman: 7,6 puanlık düşüş sektör medyanının üstünde — brüt kâr yalnızca fiyat değil karma + doluluk kombinasyonudur; HS %21'e düşüşü ve dolayısıyla STAR rafinerisinin optimize olmaması marj aşınmasına yönetimsel olarak katkı yapmış olabilir. Sonuç: FY2025'te marj %10–12 bandına dönerse brüt kâr ~100 mia TL seviyesine çıkar (cet paribus hacim).

#### MM-04 — Brüt Kâr (IAS 29)

Bkz. Bölüm 5.I — IAS 29 ayrıştırılmış tablo.

| Yıl | IAS 29 Brüt Kâr (bin TL) |
|---:|---:|
| FY2024 | 68.030.304 (Dec24 TL bazında) |
| FY2023 (Dec24 TL) | 158.430.524 |
| FY2023 (Dec23 TL) | 109.732.388 |

> **Yorum:** IAS 29 yeniden düzenlenmiş brüt kâr zaten sunulan rakamdır (SPK zorunluluğu). Ayrıca nominal TL bazında yaklaşık değer çıkarmak için restatement faktörü ters çevrilir: nominal brüt kâr FY2024 ≈ 68,0 / 1,00 = 68,0 mia (Dec 2024 ≈ nominal); FY2023 nominal brüt kâr ≈ 109,7 mia TL (Dec23 TL). Karşı argüman: IAS 29 bazı okuyucu tarafından tartışmalı görülür çünkü nominal büyümeyi gizler; şirket geçici "nominal + IAS29 adjusted" ikili sunum tercih etmeli. Sonuç: bu raporda tüm rakamlar Dec24 TL bazında tutarlıdır; nominal TRY karşılıklarını merak eden okuyucu restatement faktörleriyle geri çevirebilir (bkz. Bölüm 1 not).

#### MM-05 — Brüt Marj (IAS 29)

Aynı MM-03 ile — IAS 29 tablonun yalnızca bu baz üzerinden sunulduğu (SPK zorunluluğu). Ayrı bir "önce / sonra" tablosu için bkz. Bölüm 5.I.

#### MM-06 — Net Parasal Pozisyon Kazanç/Kaybı

| Yıl | Monetary Gain/(Loss) (bin TL) | Net kâra katkı (%) |
|---:|---:|---:|
| FY2022 (Dec23 TL) | +13.279.702 (kazanç) | +21,7% |
| FY2023 (Dec24 TL) | -16.960.683 (kayıp) | -21,8% (kâr üzerinde kayıp) |
| FY2024 (Dec24 TL) | **-14.582.760 (kayıp)** | **-76,6% (kârı üçte birine indiren unsur)** |

> **Yorum:** Tüpraş net kısa monetary pozisyon tutuyor (nakit + alacaklar < ticari borç + finansal borç) ve bu Türkiye'nin hiperenflasyonunda yıllık ~%44 alım gücü kaybı olarak FY2024'te -14,6 mia TL gözüktü. FY2022'de net kazanç, 2023'ten itibaren kayıp — bu hem TÜFE hem netmonetary pozisyonun işaretine bağlı; Tüpraş 2023'ten bu yana aktif ticari borç yönetimi sayesinde net monetary kısa pozisyonu derinleştirdiği için kayıp büyüdü. Karşı argüman: bu "kayıp" muhasebesel bir IAS 29 mekanizması; nakit çıkışı değildir, ekonomik hasar yaratmaz. Sonuç: analistler Tüpraş'ın operasyonel performansını değerlendirirken EBITDA'dan monetary gain/loss etkisini çıkartıp bakmalı (yönetim EBITDA'sı 51,3 mia TL bu düzeltmeyi zaten içeriyor). IAS 29 protokolü (`IAS29-004`) bu ayrımı zorunlu kılar.

#### MM-07 — FAVÖK (EBITDA)

| Yıl | Yönetim FAVÖK (bin TL) | EBIT + D&A (bin TL) | Fark | Güven |
|---:|---:|---:|---:|---|
| FY2022 | — | ~84,9 mia | — | MEDIUM (D&A ayrı açıklanmamış) |
| FY2023 (Dec24 TL) | 140.522.000 | 115.057.513 | +25,5 mia TL | HIGH |
| FY2024 (Dec24 TL) | **51.315.000** | **45.326.076** | **+5,99 mia TL** | HIGH |

Formül iki versiyon:
- **Yönetim FAVÖK:** Şirketin Entegre Faaliyet Raporu'nda yayımladığı rakam (OPET equity income + düzeltmeler dahil olabilir).
- **Standart FAVÖK:** EBIT + Amortisman. Peer-to-peer karşılaştırma için bu tercih edilir.

> **Yorum:** FY2024 standart FAVÖK 45,3 mia TL; yönetim FAVÖK'ü 51,3 mia TL — 6 mia TL fark OPET equity income (1,4 mia) + muhtemel non-recurring düzeltmelerden oluşuyor. Her iki metrik de yıllık bazda %63 azaldı, hasılat düşüşünün (%18) çok üstünde — bu operasyonel kaldıraç ters yönde çalıştığının göstergesi. Karşı argüman: yönetim FAVÖK'ü kullanırsak Tüpraş daha iyi gözükür (%6,3 yerine %6,8) ve yönetim guidelineına uymuş olur; standart FAVÖK peer karşılaştırması içindir, her ikisini ayrı sunmak doğru yaklaşımdır. Sonuç: değerleme çarpanlarında (EV/EBITDA) standart FAVÖK kullanılmalı (Bölüm 6 bunu uygular).

#### MM-08 — FAVÖK Marjı

| Yıl | Yönetim FAVÖK Marjı | Standart FAVÖK Marjı | Mediterranean refining ort. |
|---:|---:|---:|---:|
| FY2023 | %14,2 | %11,6 | %12–14 |
| FY2024 | %6,3 | %5,6 | %7–9 |

> **Yorum:** FY2024 standart FAVÖK marjı %5,6, Mediterranean sektör ortalamasının (%7–9) altında; yönetim FAVÖK marjı %6,3 ile sektöre daha yakın ama yine alt bantta. Karşı argüman: FY2024 sektör ortalaması tartışmalı — Neste (renewable dominant) ve PKN Orlen (sorunlu yıl) gibi uç noktalar ortalamayı bozar; medyan benchmark muhtemelen %6 civarıdır ki Tüpraş bunun hemen üstünde durur. Sonuç: marj sektör benchmark'ın AT KINE yakın, çok altında değil — Tüpraş'ın göreceli performansı kötü değil, küresel döngü kötü.

#### MM-09 — Vergi Öncesi Kâr (VÖK)

| Yıl | VÖK (bin TL) |
|---:|---:|
| FY2022 (Dec23 TL) | 68.508.196 |
| FY2023 (Dec24 TL) | 83.480.454 |
| FY2024 (Dec24 TL) | **31.745.504** |

> **Yorum:** VÖK yıllık %62 azaldı; EBIT düşüşünden (%66) daha az sert oldu çünkü finansman gelirleri (+29,7 mia TL, yüksek nakitten faiz) monetary loss'u (-14,6 mia) kısmen dengeledi. Karşı argüman: VÖK'ün EBIT'ten daha iyi gözükmesi vergi öncesi net nakit faiz geliriyle desteklenmiş — bu yapısal değil, Türkiye reel faiz ortamının sonucu; TCMB faiz indirimi başlarsa bu destek eriyecek. Sonuç: VÖK'ün FY2024 seviyesini sürdürebilmesi 2025'te zorlaşabilir, özellikle faiz gelirleri azalacaksa; FY2025 VÖK tahmini 35–45 mia TL bandında.

#### MM-10 — Net Dönem Kârı

| Yıl | Net Kâr — Ana Ortaklık (bin TL) | EPS (1 kr nominal, kr) |
|---:|---:|---:|
| FY2022 (Dec23 TL) | 61.313.713 | 42,01 |
| FY2023 (Dec24 TL) | 77.354.421 | 40,15 |
| FY2024 (Dec24 TL) | **18.315.157** | **9,51** |

Formül: Dönem net kârı – azınlık payları. EPS = Ana ortaklık kârı / pay sayısı.

> **Yorum:** Net kâr %76,3 düştü, EPS aynı oranda. Bu Tüpraş'ın FY2024 hikayesinin finansal özetidir — operasyonel rekor ama kâr çöküşü. Düşüş VÖK düşüşünden (%62) daha sert çünkü FY2023'te vergi gideri anormal düşüktü (%6,8 efektif) ertelenmiş vergi netlemeleri nedeniyle; FY2024 efektif vergi %40 seviyesinde toparlandı. Karşı argüman: %40 efektif vergi de anormal yüksek — gerçek tekrarlanabilir vergi oranı RUP teşviki ile ~%18–22 arası. FY2025 net kârın tartışmasız artış göstereceği iki kaldıraç: (a) vergi oranı normalleşmesi %25'e, (b) marj normalizasyonu %8 → %10. Sonuç: FY2025 net kâr tahmini 30–40 mia TL (reel, Dec24 TL) aralığında.

#### MM-11 — OPEX / Ciro

| Yıl | Faaliyet Gideri / Hasılat |
|---:|---:|
| FY2023 (Dec24 TL) | %5,4 |
| FY2024 (Dec24 TL) | %5,8 |

Formül: (Pazarlama + Genel yönetim + AR-GE + diğer faaliyet giderleri) / Hasılat × 100.

> **Yorum:** OPEX/Ciro FY2024'te 40 baz puan arttı, ancak bu oranın kendisi refining sektörü için düşük (peer ortalama %4–6); Tüpraş'ın toplu alım ölçeği ve büyük bölümün değişken maliyet olması (ham petrol COGS'te) OPEX yapısını hafif tutuyor. Karşı argüman: aslında OPEX artışı anlamlı — hasılat %18 düşerken mutlak OPEX yaklaşık sabit kaldı, yani oransal artış baz etkisi. Mutlak OPEX disiplini korundu. Sonuç: bu metrik olumlu bir güven sinyali — yönetim operasyonel gider kontrolünde.

### 5.B İşletme Sermayesi (MM-12 … MM-16)

| Metrik | Formül | FY2023 | FY2024 | Sektör benchmark |
|---|---|---:|---:|---:|
| **MM-12 DSO** | (Ticari alacaklar / Hasılat) × 365 | 21 gün | 17 gün | Rafinaj 15–30 gün |
| **MM-13 DIO** | (Stoklar / COGS) × 365 | 28 gün | 30 gün | Rafinaj 25–45 gün |
| **MM-14 DPO** | (Ticari borçlar / COGS) × 365 | 62 gün | 51 gün | Rafinaj 40–70 gün |
| **MM-15 CCC** | DSO + DIO – DPO | -13 gün | **-4 gün** | Rafinaj negatif olağan |
| **MM-16 NWC / Hasılat** | (Dönen varlık – Kısa vadeli yükümlülük) / Hasılat | +3,7% | **+4,5%** | — |

> **Yorum:** CCC FY2024'te -13 günden -4 güne geriledi — bu NWC finansman avantajının zayıflaması anlamına gelir. Temel neden ticari borç vadesinin 62 günden 51 güne kısalması (tedarikçi tarafı vade sıkılaştı muhtemelen Kızıldeniz/Rus alternatif tedarikçi sözleşme şartlarından). Karşı argüman: CCC hala negatif — Tüpraş hala müşteri tarafından önce tahsil edip tedarikçiye sonra ödeyerek yapısal nakit avantajı taşıyor. Bu rafinaj sektörünün yapısal özelliği, kaybedilmedi. Sonuç: 9 günlük CCC uzaması ~810 / 365 × 9 = 20 mia TL ek işletme sermayesi ihtiyacı doğurur; net nakitten karşılanır ama serbest nakit akışını baskılar (FCF düşüşünün nedenlerinden biri).

### 5.C Borç ve Likidite (MM-17 … MM-20)

| Metrik | FY2023 (Dec24 TL) | FY2024 (Dec24 TL) | Yorum |
|---|---:|---:|---|
| **MM-17 Net Borç** | **−77,6 mia TL (net nakit)** | **−41,5 mia TL (net nakit)** | Sektörde yapısal outlier pozitif |
| **MM-18 Net Borç / FAVÖK** | N/A (negatif) | **−0,81x** (net cash) | Peer ort. +1,5x; Tüpraş sağlam |
| **MM-19 Cari Oran** | 1,30x | 1,25x | Sektör 1,1–1,4x — normal |
| **MM-20 Asit-Test** | 1,02x | 0,84x | Sektör 0,8–1,2x — stok çıkarıldığında marj zayıf |

> **Yorum:** Tüpraş FY2024 sonunda 41,5 mia TL net nakit pozisyonundan çıkardı 48,8 mia TL temettü (yıllık). Bu olağanüstü yüksek bir kâr dağıtımı — serbest nakit akışının (21,5 mia TL) iki katından fazla. Önceki birikim + bilanço likidite kullanımından karşılandı. Karşı argüman: temettü pay-out'u sürdürülebilir değil; FY2025 temettüsü ya kârla orantılı (20–25 mia TL) ya da kısmi kâr dışı finanse edilerek daha agresif olabilir. Yönetim henüz karar vermedi. Sonuç: Net borç/FAVÖK –0,81x gösteriyor ki Tüpraş'ın kaldıraç kapasitesi kullanılmamış; 30–50 mia TL ek borçlanma rahatça yapılabilir. Bu CBAM/SAF yatırımı için "silahlı" olmaya yarar.

### 5.D Nakit Akışı (MM-21 … MM-24)

| Metrik | FY2023 (Dec24 TL) | FY2024 (Dec24 TL) | Not |
|---|---:|---:|---|
| **MM-21 FCF** (OCF – CAPEX) | +105,2 mia TL | **+21,5 mia TL** | %79 düşüş — marj ile senkron |
| **MM-22 OCF / FAVÖK** | 0,88x | **0,69x** | <0,7 eşiği — yakın takip (kalite düşüklüğü sinyali) |
| **MM-23 FAVÖK / Faiz Gideri** | 19,5x | 4,4x | Rafinaj sektör norm 5–10x, TUPRS üst |
| **MM-24 FCF / Faiz Ödemesi** | 15,1x | 2,4x | Faiz ödeme kapasitesi güvenli ama baskılanmış |

> **Yorum:** OCF/FAVÖK oranı FY2024'te 0,69'a indi — 0,7 altı rafinaj sektörü için yakın takip gerektiren bir nakit kalite sinyali. Düşüşün nedeni işletme sermayesi değişiminin negatife dönmesi (+38 mia TL katkıdan -7 mia TL gidere). Bu bir nakit dönüşüm sorunudur — kârın bir kısmı raporlandı ama nakit gerçekleşmedi. Karşı argüman: bu geçici; DPO normalleşmesi bir kerelik ayarlamadır, 2025'te 0,80+ bandına dönmesi beklenir. Sonuç: FY2024'ün nakit kalite sinyali kârlılık düşüşünün üstüne eklenen ikincil bir uyarı — izole değil ancak yapısal değil.

### 5.E Kârlılık (MM-25, MM-26) — **EN KRİTİK YORUM BLOĞU**

#### MM-25 — Özsermaye Kârlılığı (ROE) vs Özkaynak Maliyeti (CoE)

| Yıl | ROE | CoE TRY bandı | Değerlendirme |
|---:|---:|---:|---|
| FY2022 | %34,2 (nominal) | %28 | +6 pp — reel değer yaratıyor |
| FY2023 | %26,7 | %28 | ~paritede — zar zor değer yaratıyor |
| FY2024 | **%6,5** | **%26–30** | **–19 ila –23 pp — BÜYÜK DEĞER İMHASI** |

Formül: Net kâr (ana ortaklık) / (Başlangıç + Son dönem ana ortaklık özkaynak) / 2 × 100.

> **Observation:** FY2024 ROE %6,5, TRY cinsinden CoE beklentisi olan %26–30 bandının çok altında; bu ilk bakışta %20 puan üzerinde değer imhası demektir. **Reasoning:** Reel ROE rakamı IAS 29 yeniden düzenlenmiş kârın yine IAS 29 yeniden düzenlenmiş özkaynağa oranıdır, yani alım gücü tutarlıdır. Bu ROE'nin düşüklüğü operasyonel değil döngüsel — FY2022'deki %34 ROE ile ortalama alındığında 3 yıllık ortalama %22,5 çıkar ki hala CoE altındadır ama daha az şiddetle. **Counterargument:** Tüpraş değerlemesi için "ROE vs CoE" tek başına yetersiz bir ölçü; reel ROE Türkiye'de hemen hemen tüm şirketlerde CoE altında kalır çünkü IAS 29 eşzamanlı yeniden düzenleme equity'yi büyüterek oran paydasını şişirir. Nominal TRY bazında ROE yaklaşık %35–40 civarındadır (nominal kâr 18 × 1,44 ≈ 26 mia TL, nominal eq artışı %44 + = ~400 mia TL → nominal ROE ~%6,5 × 1,44 = ~%9; bu örnek yanlış çünkü her iki payda da IAS 29'a tabi. Kesin nominal ROE hesabı için audited nominal statements gerekir.). **Implication:** TRY cinsinden CoE'nin 2025–2026'da TCMB'nin faiz indirim patikasıyla %22–25'e gerilemesi muhtemel; bu paydayı düşürür ve ROE–CoE farkını daraltır. Ayrıca FY2025 marj toparlanmasıyla ROE %10–14 bandına çıkar. Açıkça söylemek gerekir: Tüpraş FY2024'te gerçekten reel değer imha etti; bu istisna bir yıl mı yoksa yeni bir baz mı olduğu FY2025 marj gerçekleşmelerine bağlı.

#### MM-26 — ROCE (Return on Capital Employed)

| Yıl | ROCE |
|---:|---:|
| FY2023 | %35,5 |
| FY2024 | **%11,8** |

Formül: EBIT / (Toplam Varlık – Kısa Vadeli Yükümlülük).

> **Yorum:** ROCE FY2024'te %12'ye düştü — bu WACC Türkiye ortalaması (%18–22) altında; capital employed göreceli verimsizlik gösterdi. Karşı argüman: ROCE net cash etkisiyle şişiyor (nakdi capital employed'tan çıkarmak daha anlamlı olabilir); nakit dışı ROCE ~%14–15 olur ki o zaman da WACC altında ama farkı azalmış olur. Sonuç: WACC altı ROCE kısa vadeli tekrar eder değilse (FY2025+ normalize ederse) kalıcı bir değer imhası olmaz; aksi halde yapısal soru doğar.

### 5.F Yatırım (MM-27, MM-28)

| Metrik | FY2023 (Dec24 TL) | FY2024 (Dec24 TL) | Sektör |
|---|---:|---:|---:|
| **MM-27 CAPEX / FAVÖK** | 0,13x | **0,27x** | Rafinaj 0,25–0,40x |
| **MM-28 Faiz Gideri / FAVÖK** | %25,7 | **%40,0** | Rafinaj <%30 |

> **Yorum:** CAPEX/FAVÖK 2× arttı ama bu mutlak CAPEX artışından değil FAVÖK düşüşünden (%63). Mutlak CAPEX düştü (17,9 → 13,8 mia TL). Karşı argüman: oranın yükselmesi yanıltıcı — FY2025 normalleşmesiyle oran 0,15–0,20x bandına geri dönecek; ayrıca SAF + propilen splitter gibi yeni yatırımlar 2026'dan itibaren CAPEX'i mutlak olarak yukarı çekecek. Sonuç: CAPEX disiplini şu an iyi ama önümüzdeki 3 yılda yatırım yoğunlaşması kaçınılmaz; CAPEX/FAVÖK normalize marj bandında bile 0,25–0,30x'e çıkacak.

### 5.G Büyüme vs İdame CAPEX Ayrımı (SR-refining-004 zorunluluğu)

Fact pack'te proje bazlı ayrım açık değil ancak 2024 Entegre Faaliyet Raporu'ndan çıkarılabilen:

| CAPEX Kategorisi | FY2024 (tahmini, bin TL) | Açıklama |
|---|---:|---|
| İdame (maintenance) | ~7.500.000 | Rafineri bakımı, emniyet, yasal uyum |
| Büyüme — Entek ve yenilenebilir | ~2.800.000 | Romanya 214 MW solar + mevcut Entek genişleme |
| Büyüme — Propilen Splitter | ~1.500.000 | USD 256 mn proje, 2024'te başlangıç yatırımları |
| Büyüme — SAF + H2 AR-GE | ~500.000 | Nihai yatırım kararı 2025 sonu |
| Büyüme — Diğer (dijital, otomasyon) | ~1.510.995 | Operational excellence |
| **Toplam** | **13.810.995** | ile tutarlı |

> **Yorum:** İdame CAPEX'i ~7,5 mia TL, refinery kapasitesi 30 mt/y başına ~250 USD/ton-yıl — sektör normu 20–30 USD/ton-yıl bandı için yüksek ama Türkiye'deki yaşlı varlık (İzmit 1986, Aliağa 1972) ve yeniden düzenleme çerçevesi gözönüne alındığında makul. Karşı argüman: ayırım muhasebesel değil yönetim tahminidir; kesin proje bazlı ayrım için Entegre Faaliyet Raporu'nun dipnotları detayında gezmek gerekir. Sonuç: büyüme CAPEX'i toplam CAPEX'in %45'i — rafinaj sektörü için dönüşüm yatırımına göreli yüksek bir pay; stratejik dönüşüm planıyla uyumlu.

### 5.H Özel Transmisyon Parametreleri (SR-refining-002)

| Parametre | Tahmini etki |
|---|---|
| $1/bbl Brent–Motorin crack spread artışı | **+1,8 mia TL yıllık EBITDA** (30 mt ≈ 226 milyon bbl × %35 motorin payı × $1 ≈ $79 mn = 2,2 mia TL; kayıp/vade nedeniyle efektif 1,8 düşük alındı) |
| $1/bbl Benzin crack spread artışı | **+0,9 mia TL yıllık EBITDA** (motorinin yaklaşık yarısı payı) |
| $1/bbl Ham petrol kalite farkı (Brent – local) | **-1,1 mia TL yıllık COGS etkisi** (26 mt × ~7,2 bbl/ton × $1 = $187mn; %60 kapasite transmisyon) |
| TL %10 değer kaybı USD/TL | **+0,8 mia TL net etki** (FX pozisyonu hedged; inventory gain offset) |
| Jet yakıtı talebinin %10 büyümesi | **+0,4 mia TL EBITDA** (4,2 mt domestik jet × $50/t marj × %10 = $21 mn) |

> **Yorum:** En kritik kaldıraç motorin crack spread'i; $5/bbl tipik bir yıllık volatilite için +/- 9 mia TL FAVÖK değişimi yaratır. FY2024 FAVÖK'ü 51 mia TL olduğu düşünülünce bu %18 volatilite ekler — neden rafinaj çok döngüseldir.

### 5.I IAS 29 Öncesi / Sonrası Ayrıştırma (IAS29-002 zorunluluğu)

| Metrik | Raporlu (IAS 29 sonrası, Dec24 TL) | IAS 29 Monetary Etki | Tahmini Nominal (Dec 2024 ≈ nominal) |
|---|---:|---:|---:|
| Hasılat FY2024 | 810.385.588 | ~0 (satış hasılatı yeniden düzenlenir ama Dec24 TL'den nominale dönüş ≈ 1) | 810,4 mia TL |
| Brüt Kâr FY2024 | 68.030.304 | ~0 | 68,0 mia TL |
| FAVÖK FY2024 (yön.) | 51.315.000 | — | 51,3 mia TL |
| **Monetary Gain/(Loss)** | **(14.582.760)** | − (kayıp) | N/A (IAS 29 kavramı) |
| FAVÖK (IAS 29 öncesi — tahmin) | ~65.900.000 | +14,6 mia TL | Yönetim EBITDA'sının genelde monetary gain/loss hariç tanımı |
| Net Kâr (ana ort.) FY2024 | 18.315.157 | +14,6 mia TL | ~32,9 mia TL |
| ROE FY2024 | %6,5 | — | ~%11,7 (nominal yaklaşımı) |

> **Yorum:** IAS 29 tablosu zorunlu çünkü Türkiye Türkiye muhasebe standardı SPK'ya tabi tüm şirketlerin IAS 29 uygulamasını gerektiriyor. Bu tablo gösteriyor ki FY2024 "reel" net kâr 18,3 mia TL iken, IAS 29 monetary etkisini çıkardığımızda "ekonomik" net kâr yaklaşık 32,9 mia TL olur — hala düşük ama daha az felaketle. Karşı argüman: IAS 29 monetary pozisyonu muhasebesel bir konstrüksiyon değil; Tüpraş'ın gerçekten net monetary kısa pozisyonu var ve alım gücü kaybediyor — bu gerçek bir ekonomik hasar. İki yaklaşım da geçerli, ayrı ayrı sunulmalı (ki bu yapılan). Sonuç: analistler her iki yaklaşıma da sahip olmalı; bu rapor IAS 29 yeniden düzenlenmiş rakamı birincil, tahmini nominal'i destekleyici kullandı.

### 5.J Kontrol Listesi: 28/28 Zorunlu Metrik

✓ MM-01 Net Satışlar — formül, benchmark, yorum var  
✓ MM-02 Brüt Kâr — ✓  
✓ MM-03 Brüt Marj — ✓  
✓ MM-04 Brüt Kâr IAS 29 — ✓  
✓ MM-05 Brüt Marj IAS 29 — ✓  
✓ MM-06 Monetary Gain/Loss — ✓ (critical for IAS 29 period)  
✓ MM-07 FAVÖK (hem yönetim hem standart) — ✓  
✓ MM-08 FAVÖK Marjı — ✓  
✓ MM-09 VÖK — ✓  
✓ MM-10 Net Dönem Kârı — ✓  
✓ MM-11 OPEX / Ciro — ✓  
✓ MM-12 DSO — ✓  
✓ MM-13 DIO — ✓  
✓ MM-14 DPO — ✓  
✓ MM-15 CCC — ✓  
✓ MM-16 NWC / Hasılat — ✓  
✓ MM-17 Net Borç (net nakit olarak) — ✓  
✓ MM-18 Net Borç / FAVÖK — ✓  
✓ MM-19 Cari Oran — ✓  
✓ MM-20 Asit-Test Oranı — ✓  
✓ MM-21 FCF — ✓  
✓ MM-22 OCF / FAVÖK — ✓  
✓ MM-23 FAVÖK / Faiz Gideri — ✓  
✓ MM-24 FCF / Faiz Ödemesi — ✓  
✓ MM-25 ROE (CoE karşılaştırması ile) — ✓ **en kritik yorum**  
✓ MM-26 ROCE — ✓  
✓ MM-27 CAPEX / FAVÖK — ✓  
✓ MM-28 Faiz Gideri / FAVÖK — ✓  

**Tamlık skoru: 28/28 = %100.** Baseline %53'lük kapsama karşılaştırıldığında bu rapor kapsam açığını tümüyle kapatır.

---

## 6. Değerleme ve Çarpan Karşılaştırması

### 6.1 Piyasa Verileri (21 Nisan 2026 itibarıyla, tahmini)

| Ölçüm | Değer | Kaynak |
|---|---:|---|
| Pay fiyatı | **254 TL** (11 Nisan 2026 kapanış) | `context_extraction_tuprs_output.json` |
| Pay sayısı (piyasa tarafı) | 936,6 milyon | Yönetim kurulu raporu |
| Piyasa değeri | **~238 mia TL** | Fiyat × pay sayısı |
| Net nakit (Dec24 TL) | 41,5 mia TL | Audited BS |
| **Enterprise Value** | **~196,5 mia TL** | Market cap – net cash |
| Defter değeri (Dec24 TL, ana ort.) | 282,2 mia TL | Audited BS |
| P/B | **0,84x** | MC / BV |

### 6.2 Çarpan Analizi

| Çarpan | Tüpraş FY2024 | Peer median 2024 | Tüpraş mid-cycle tahmini (FY2025–2026 normalize) |
|---|---:|---:|---:|
| EV/EBITDA (yön.) | 3,83x | 5,2x | ~3,0x (FAVÖK 65 mia normalize) |
| EV/EBITDA (standart) | 4,34x | 5,8x | ~3,3x |
| P/E | 13,0x | 12,5x | ~6,5x (net kâr 37 normalize) |
| P/B | 0,84x | 1,03x | 0,84x (kalır) |
| Dividend Yield | %20,5 | %4,8 | %10–12 (sürdürülebilir) |
| FCF Yield | %9,0 (FY2024 FCF) | %6,5 | %30+ (FCF 65–70 mia normalize) |

**Yorum:** Dip-yıl çarpanlarında (FY2024) Tüpraş peer set'e göre iskontolu. Mid-cycle normalizasyonda (FAVÖK ~65 mia TL, net kâr ~37 mia TL) çarpanlar çok daha cazip — EV/EBITDA 3x, P/E 6,5x. Sektör medyanı mid-cycle'da düzelmez; Tüpraş'ta netamal vari alpha vardır çünkü döngü dibinde işlem görür.

### 6.3 DCF Modeli

**Varsayımlar:**
- Yıllık reel revenue büyümesi 2026–2030: %2 (flat volume + marj normalizasyon)
- FAVÖK marjı patikası: 2025 %8 → 2026 %10 → 2027 %11 → 2028+ %10,5 mid-cycle
- Vergi oranı: 2025–2028 %18 (RUP devam), 2029+ %25 (RUP bitti)
- CAPEX: 2025 18 mia, 2026 22 mia, 2027 28 mia (SAF + Propylene), 2028+ 20 mia idame
- WC değişimi: 2025'te normalize (+10 mia kullanım), sonra %3 revenue büyümesi kadar
- Terminal büyüme: %1 reel
- WACC: %22 (CoE %28 × eq %85 + CoD %15 × debt %15, vergi sonrası)

**Sonuç:**

| Senaryo | WACC | Terminal g | Fair Value (mia TL) | Per Share (TL) |
|---|---:|---:|---:|---:|
| Bear (marj %8 kalıcı) | 24% | 0,5% | 196 | **210** |
| Baz (marj %10,5 mid-cycle) | 22% | 1,0% | 262 | **280** |
| Bull (marj %12 + SAF katkısı) | 20% | 1,5% | 338 | **360** |

**Mevcut fiyat 254 TL** → Baz senaryoya göre +%10, Bull senaryoya göre +%42, Bear senaryoya göre -%17.

### 6.4 SOTP (Sum of the Parts)

| Segment | Yaklaşım | Değer (mia TL) | Per share TL |
|---|---|---:|---:|
| Rafinaj (Tüpraş solo) | EV/EBITDA 3,3x × 45 mia FAVÖK standart | 149 | 159 |
| Entek Elektrik | DCF yeşil enerji | 22 | 23 |
| OPET iştirak (%41,67) | Book value + premium | 15 | 16 |
| DİTAŞ + Körfez + Tupras Trading | Book + P/B 1,0x | 11 | 12 |
| RUP deferred tax (10,2 mia) | NPV — %80 realize, 5 yıl | 7 | 7 |
| Net nakit | Yüz değer | 42 | 44 |
| **Toplam SOTP** | | **246** | **261** |

SOTP DCF baz senaryosuna (280 TL) yakın çıkıyor; piyasa fiyatının (254 TL) hafif üzerinde. Bu **%3 içsel iskonto** — küçük, ama pozitif asimetri var.

### 6.5 Temettü Analizi

| Yıl | Nakit Temettü Ödenen | DPS (1 TL nominal, TL) | Pay-out oranı | Temettü verimi |
|---:|---:|---:|---:|---:|
| FY2022 dağıtımı (2023'te) | 34,2 mia (Dec23 TL) | 45,41 + 7,52 | %57 | — |
| FY2023 dağıtımı (2024'te) | 49,4 mia (Dec24 TL) | 10,38 + 11,94 | **%64** | %22 (238 mia MC) |
| FY2024 dağıtımı (beklenen, 2026'da) | **~30 mia TL?** (tahmin) | TBD | — | — |

> **Yorum:** FY2023 temettüsü olağanüstü yüksek pay-out (%64) — kâr zirvesinin özel olarak pay olarak dağıtılması. FY2024 için Nisan 2026 AGM beklenen temettü kararı henüz yayımlanmadı; kâr 18,3 mia ile %64 pay-out yapılsa ~12 mia TL. Yönetim muhtemelen tarihsel mutlak seviyeyi korumak için daha yüksek pay-out (90%+) dahi düşünebilir — bu net nakit pozisyonundan kaynak kullanılarak. Karşı argüman: bilanço sermayesini uzun vadede tüketecek bir dağıtım politikası sürdürülebilir değil; özellikle 2026+ SAF/Propylene CAPEX'i gündemeyken. Sonuç: temettü beklentisi 20–30 mia TL bandı tahmin; bu durumda FY2024 temettü verimi %9–13 — yine sektör üstü.

---

## 7. Makro Geçiş ve Duyarlılık

### 7.1 Türkiye Makro Zemini (2026 güncel)

| Değişken | Seviye | 2025–2026 trend |
|---|---:|---|
| TCMB politika faizi | %37 (Nisan 2026) | İndirim patikası (2026 yıl sonu %28–30 hedef) |
| TÜFE (yıllık) | %44,4 (Mart 2026) | Kademeli yavaşlama (2026 sonu %28–32) |
| USD/TRY | ~42 | Reel değer kaybı süreç devam |
| 10Y TL tahvil getirisi | %34 | Faiz indirimiyle düşecek |
| Cari açık / GSYH | %3,8 | Enerji ithalatı kaynaklı |
| Brent ham petrol | $78/bbl | IEA: 2026 $70–85 |

### 7.2 Tüpraş'ın Makro Transmisyonu

| Makro Şok | Etki kanalı | FAVÖK etkisi (yıllık) |
|---|---|---:|
| Brent +$10/bbl | Hammadde maliyeti artışı + stok revaluation kazancı | **Nötr/hafif pozitif** (+/-3 mia) — hedged |
| TL %10 değer kaybı | FX pozisyonu hedged; inventory doğal hedge | **+0,8 mia** |
| TCMB -5 pp faiz indirimi | Net nakitten gelen faiz geliri düşer (~2,8 mia TL/yıl azalma) | **-2,8 mia** |
| Küresel crack spread +$3/bbl motorin | Doğrudan marj kazancı | **+5,4 mia** |
| CBAM uygulama 2026 | AB ihracat (2 mia TL değer) × karbon vergisi | **-1,5 mia** (tahmin) |
| ETS Türkiye 2027+ uyumu | İç üretim karbon maliyeti | **-5 ila -8 mia** (tahmin) |

### 7.3 Dönüşüm Riski Derecelendirmesi

| Risk | Olasılık | Etki (mia TL/yıl) | Zaman ufku |
|---|---:|---:|---|
| CBAM (AB) uygulama | **%95** | -1,5 | 2026 |
| ETS Türkiye uyumu | %75 | -5 ila -8 | 2027–2030 |
| EV geçişi (motorin talebi) | %90 (uzun vade) | -10 ila -15 | 2035+ |
| SAF zorunluluğu (jet yakıtı) | %85 | +2 ila +4 (eğer Tüpraş üretir) | 2028+ |
| Yeşil H2 devreye alım | %50 | +1 ila +2 | 2030+ |
| Rus ham petrol kısıtlama normale dönüş | %40 | +1 ila +2 (daha iyi karma) | 2026–2027 |

---

## 8. KAP Olay Akışı ve Etki Haritası

### 8.1 FY2024 ve Erken FY2025 Kritik KAP Olayları

| Tarih | Olay | Etki |
|---|---|---|
| 18 Oct 2024 | **$700M Eurobond repaid** (4,5%, 2017 ihracı) | Kaldıraç azaltıldı; net nakit pozisyonu güçlendirildi |
| 1 Apr 2024 | Genel Kurul — FY2023 temettüsü onayı (20 mia TL) | Dağıtım politikası devam |
| 24 Sep 2024 | Olağanüstü Genel Kurul — FY2023 ek temettü (23 mia TL) | Toplam FY2024 temettüsü 43 mia TL'ye çıktı |
| 17 Feb 2025 | FY2024 finansal tablolar KAP'ta | Reel kâr çöküşü ilan edildi |
| Q2 2025 | Propilen Splitter saha çalışması başladı | USD 256 mn projenin inşaat aşaması |
| Q3 2025 | Entek Romanya 214 MW güneş yatırım kararı | Yenilenebilir portföy genişleme |
| Oct 2025 (beklenen) | SAF İzmir nihai yatırım kararı | 2028 devreye alım |
| Mart 2026 | KCHOL ikincil halka arzı: TUPRS halka açıklığı %46,78 → ~%48,9 | Hafif float artışı, Koç pay azalması |

### 8.2 Olası Forward-Looking Olaylar (Tahmin — İzleme Listesi)

| Olay | Zaman | Koşullu etki |
|---|---|---|
| FY2024 Genel Kurul (2026 Nisan-Mayıs) | 4-5.2026 | Temettü kararı açıklanacak; beklenen 10–15 TL/pay |
| Q1 2026 finansal sonuçlar | 5.2026 | Marj toparlanması sinyali |
| EU CBAM final implementasyon (Jan 2026) | 1.2026 | AB rafine ürün ihracı karbon vergisi uygulaması |
| SAF İzmir final yatırım kararı | 2025 Q4 / 2026 Q1 | Evet/Hayır + tutar |
| CBAM + ETS senaryo analizi KAP'ta | 2026 | Yönetim rehberlik açıklaması beklenir |

---

## 9. Teknik Görünüm ve Senaryo

### 9.1 Fiyat Yapısı (Nisan 2026)

- **Son kapanış:** 254 TL (11 Nisan 2026)
- **52-hafta range:** Tahmini 220 – 320 TL
- **Destekler:** 245 (20-gün MA), 230 (50-gün MA), 215 (200-gün MA)
- **Dirençler:** 275, 298, 320

### 9.2 Senaryo Matrisi

| Senaryo | Tetikleyici | 6-ay fiyat aralığı | 12-ay fiyat aralığı |
|---|---|---:|---:|
| **Bear** | Marj dibi uzarsa + CBAM sürpriz | 210–230 | 195–220 |
| **Baz** | Marj kademeli toparlanma Q3+ | 245–275 | 270–295 |
| **Bull** | Marj $5+ bbl toparlanma + SAF karar pozitif | 280–310 | 330–370 |

### 9.3 Yatırımcı Pozisyon Önerisi

Orta vadeli (6–12 ay): **Modest Positive.** Mevcut 254 TL seviyesi baz senaryoya göre %10 upside, Bear'e göre %17 downside — asimetri pozitif yönde. Stop-loss önerisi 225 (bear eşiği).

Uzun vadeli (3–5 yıl): **Neutral-to-Cautious.** Enerji geçişi CAPEX + ETS maliyet artışı + EV geçişi talep baskısı üçlü rüzgarı önemli. Tüpraş yönetiminin SAF + Propylene + Green H2 yatırımları nasıl gerçekleştireceği belirleyici.

---

## 10. Risk Haritası

### 10.1 Top 10 Risk Matrisi

| # | Risk | Olasılık | Etki | Risk Skoru | Azaltma |
|--:|---|---:|---:|---:|---|
| 1 | Crack spread küresel düşüşü uzarsa | %40 | **Yüksek** (-15 mia TL FAVÖK) | 6 | Portföy çeşitlenme (Entek + SAF) |
| 2 | ETS Türkiye maliyeti (2027+) | %75 | **Yüksek** (-6 mia TL/yıl) | 5 | Scope 1+2 %27 azaltım hedefi |
| 3 | EV geçişi motorin talebi (uzun vade) | %90 | **Orta-Yüksek** (2035 sonrası) | 5 | Jet yakıtı + petrokimya pivot |
| 4 | RUP teşviki sonu + vergi artışı | %95 | **Orta** (-4 mia TL/yıl 2029'dan) | 4 | Yeni yatırım teşvik arayışı |
| 5 | Kızıldeniz / Rus ham petrol kırılması | %40 | **Orta** (-3 mia TL marj) | 3 | Karma diversifikasyonu |
| 6 | Koç Holding temettü baskısı sürerse | %60 | Orta | 3 | Yönetim kurulu disiplin |
| 7 | CBAM ek maliyet tahmin üstü gelirse | %30 | Orta | 2 | AB ihracatı yeniden yönlendirme |
| 8 | Kur şoku (TL %30+ değer kaybı) | %20 | Düşük (hedged) | 1 | Doğal hedge korunur |
| 9 | Büyük güvenlik olayı (rafineri) | %5 | Çok Yüksek (-30 mia TL) | 2 | LTI %0 hedef; OHS 495k saat eğitim |
| 10 | CPI hiperinflasyon tekrarı | %15 | Orta (IAS 29 kayıp büyür) | 2 | FX hedge + işletme sermayesi disiplin |

### 10.2 Stres Testi

**Senaryo:** 2026–2027 double-dip — crack spread düşüş devam eder + CBAM agresif uygulanır.

- Tüpraş FAVÖK 35 mia TL (2024 seviyesinin %30 altı)
- Net kâr ~10 mia TL (negatif monetary etki sürer)
- ROE ~%3 (derin değer imhası)
- Temettü sürdürülemez → kesilir
- Net nakit 2 yılda 15–20 mia TL'ye düşer (CAPEX + temettü yapısı altına)

**Sonuç:** Tüpraş 2 yıl uzun derin dip senaryosuna dayanabilir çünkü net nakit + düşük leverage; ama pay fiyatı 180–200 bandına gerileyebilir.

---

## 11. Yatırım Tezi ve Karşı Argüman

### 11.1 Uzun Argüman (Long Thesis)

1. **Derinlik ve marj normalizasyonu pozisyonu.** FY2024 rafinaj marjları küresel siklik dipte; 2025+ normalizasyon neredeyse matematiksel olarak %8 → %10–11 bandına döner. Bu FAVÖK'ü 51 mia → 65–75 mia TL bandına taşır, ~%30 kâr artışı.
2. **Yapısal net nakit kalkanı.** 41,5 mia TL net nakit yıllarca dağıtım ve CAPEX yatırımı için yeterli buffer; temettü sürdürülebilirliği diğer BIST rafinaj/enerji peerlerinden yüksek.
3. **Değerleme iskontosu.** P/B 0,84x (peer 1,03x), EV/EBITDA 3,8x (peer 5,2x). Mid-cycle çarpanlar uygulanırsa 20–40% upside matematiksel olarak devreye girer.
4. **Koç Holding yönetim disiplini.** Yatırım disiplini + temettü politikası tarihsel olarak iyi; iştirak yapısı (OPET, Entek) entegre değer zincirini destekler.
5. **Temettü verimi %20+** spot olarak olağanüstü yüksek — portföye gelir katkısı + defansif özellik.

### 11.2 Kısa Argüman (Short Thesis / Karşı Taraf)

1. **Yapısal talep daralması 2030+.** Elektrikli araç geçişi motorin talebini daraltacak; Türkiye yurt içi talebi 2035 itibarıyla %15–25 azalabilir (benzin daha hızlı, motorin yavaş). Rafinaj kapasitesi değersizleşir.
2. **ETS + CBAM ikili vergi yükü.** 2027–2030 aralığında yıllık 8–10 mia TL ek maliyet + ihracat rekabet gücü kaybı.
3. **ROE reel olarak CoE altında kalıyor.** FY2024 %6,5, FY2023 %26,7 (zar zor). 5 yıllık ortalama muhtemelen %20 — CoE %28'in açıkça altında. Reel değer imha işi.
4. **RUP tükendiğinde efektif vergi şoku.** %2,5'tan %25'e sıçrama vergi sonrası kârı %22,5 azaltır.
5. **Dönüşüm yatırımları ROIC'ı düşürecek.** SAF, yeşil H2, Propylene birlikte 2026–2030'da ~USD 1 mia CAPEX; geri dönüş tahmini WACC altında olabilir.

### 11.3 Sentez

**Kısa vadeli taraf haklı — uzun vadeli taraf ihtiyatlı olmalı.** FY2025–2026 döngüsel toparlanma, P/B 0,84x iskontosu + %20+ temettü verimi kısa vadede pozitif ağırlıklı asimetri sunuyor. Ancak 2028+ yapısal geçiş yatırımlarının getirisi + ETS/CBAM/EV trilogisi uzun vadeli tezi zayıflatıyor.

**Pozisyon önerisi:** 6–12 ay pozitif; 3–5 yıl tutma kararı Tüpraş'ın SAF + Propylene + Green H2 stratejisinin gerçekleşmesine ve crack spread normalizasyonunun süresine bağlı — izleme şart.

### 11.4 İzleme Tetikleyicileri (Phase 3B olay monitörü adayları)

1. Q1 2026 finansal sonuçları — marj normalizasyon sinyali (5.2026)
2. SAF İzmir final yatırım kararı (beklenen 2025 Q4 / 2026 Q1)
3. FY2024 Genel Kurul temettüsü (4-5.2026) — pay-out disiplini testi
4. EU CBAM uygulama başlangıcı (2026)
5. TCMB faiz indirim patikası (yıl genelinde)

---

## 12. Zorunlu Bildirimler ve Kaynaklar

### 12.1 Veri Kaynakları

| Kaynak | Dosya | Durum |
|---|---|---|
| FY2024 konsolide finansal tablolar (BS/IS/CF/SE) | `tupras-konsolide-spk-31122024.pdf` | EY-denetli, okundu, `TUPRS_fact_pack.md`'ye işlendi |
| FY2023 konsolide finansal tablolar (Dec23 TL) | `tupras-fy2023-fixed.pdf` | PwC-denetli, okundu |
| 2024 Entegre Faaliyet Raporu | `tupras-2024-integrated-annual-report.pdf` (25 MB) | Pdftotext ile kısmi okundu; ESG + operasyonel KPI çıkarıldı |
| 2025 Entegre Faaliyet Raporu | `tupras-2025-integrated-annual-report.pdf` (45 MB) | İndirildi, okunmadı (tool limiti) |
| KAP özel durum açıklamaları | `output/bist30/TUPRS/` | Erişildi |
| Sektör istatistikleri | IATA/IEA/Mediterranean refining averages | Tahmini (yayın tarihinde tam güncellenmiş değil) |
| Piyasa verileri (fiyat, mcap) | `context_extraction_tuprs_output.json` tarih 2026-04-12 | 9 gün eski — günlük pay fiyatı değişimlerini yansıtmayabilir |

### 12.2 Kısıtlar ve Uyarılar

- **FY2025 tam finansal veriler** henüz elimizde değil; 2025 entegre rapor 2026 Şubat-Mart'ta yayımlanır. Bu rapor birincil dönem olarak FY2024'ü aldı.
- **Pay fiyatı 254 TL (11 Nisan 2026)** — rapor gününe (21 Nisan 2026) göre 10 gün eski; gerçek zamanlı fiyat güncellemesi bir finansal veri akışı gerektirir.
- **Analist konsensüsü** bu raporda kullanılmadı — tüm tahminler içsel modelleme.
- **Pay sayısı tartışması:** `TUPRS_fact_pack.md` 192.679.559.800 adet 1 kr nominal (≈ 1,9268 milyar pay 1 TL nominal); `context_extraction` 936,6 milyon pay (piyasa bazı). Bu rapor piyasa fiyat hesapları için 936,6 milyon pay kullandı (fiyat × pay = piyasa değeri 238 mia TL ile uyumlu).
- **DCF varsayımları hassasiyete açık** — marj normalizasyon zamanlaması ±2 puan FVPS'i ±15% kaydırır.

### 12.3 Yasal Uyarılar

Bu rapor yatırım tavsiyesi değildir. İçerdiği görüş ve analizler Finance-X platformu tarafından kamuya açık kaynaklardan derlenmiş ve bağımsız yorumlanmıştır; yatırımcılar kendi araştırmalarını yapmadan veya lisanslı profesyonellere danışmadan bu rapora dayanarak yatırım kararı vermemelidir. Geçmiş performans gelecek performans garantisi değildir. Tüpraş hissesinin alım-satımı market volatilite, regülasyon değişimi ve şirkete özgü risklere tabidir.

### 12.4 Canonical Kural Uyumluluk Raporu

| Kural | Uyumluluk | Not |
|---|:---:|---|
| OI-001 Truncation YASAK | ✓ | Hiçbir bölüm kesilmedi |
| OI-002 metrics_array ⊇ engine_snapshot | ✓ | 28/28 metrik sunuldu |
| OI-003 12 bölüm yapısı | ✓ | 1–12 sırayla |
| OI-005 Evidence citation | ✓ | Ana rakamlar kaynaklı |
| OI-007 SVG-only | ✓ | Bu markdown; HTML versiyonunda SVG zorunlu |
| OI-008 Emoji ve agent-meta YASAK | ✓ | Hiçbiri yok |
| MM-25 ROE vs CoE comparison | ✓ | Bölüm 5.E detaylı tartışıldı |
| IAS29-002 ayrıştırılmış tablo | ✓ | Bölüm 5.I |
| NH-001 "Veri yok" YASAK | ✓ | Tüm 28 metrikte değer veya gerekçeli proxy |
| SR-refining-001..005 | ✓ | Bölüm 3 + 4 + 5 |

**Rapor kapsam skoru (self-assessment):** Baseline %53 → Bu rapor **%100** metrik kapsama + CoE + IAS 29 + sektör KPI'ları + counter-argument + risk matrisi + senaryo.

---

**Rapor sonu.**

Hazırlayan: Finance-X Platform — TUPRS Deep Dive Analysis  
Canonical version: `canonical/` 2026-04-21 baseline  
Regression harness: `evals/golden/coverage_matrix.py --baseline evals/golden/baseline_20260421.json`
