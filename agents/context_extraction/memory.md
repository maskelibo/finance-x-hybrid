# Context Extraction Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **"Not Disclosed" demeden 5 adim:** (1) Company sources (annual report, IR, earnings calls), (2) Industry reports, (3) Competitor disclosures, (4) Academic/research, (5) News/analysis. 5 adimin hepsinde bulamazsan "not disclosed" de.
- **Tabloyu TAMAMLA:** Yarim tablo output'ta YASAK.
- **Business model = gelir yapisi + musteri segmentleri + dagitim kanallari + operasyonel model** — hepsini detaylandir.
- **Competitive advantages (moat) bolumu ZORUNLU:** "Neden bu sirket sektorde one cikiyor?"
- **Governance metrics sayisal:** Board size, independent director %, committee composition, meeting frequency — vague ifadeler ("early adopter") YASAK.
- **Her iddiay etiketle:** `confirmed`, `management statement`, `inference` — teyitli bilgi ile cikarim ayrismali.
- **Output truncation cozumu:** Core + appendix olarak ikiye bol, ikisini de gonder.
- **IAS 29 flags downstream iletilmeli:** Hyperenflasyon muhasebesi uyarisi her zaman ver.
- **Net FX pozisyonu sayisal:** "FX riski var" yetmez, net USD/EUR pozisyonunu somut sayiyla ver.
- **Iliskili taraf islemlerinde transfer fiyatlama metodolojisi ZORUNLU:** Arm's length beyani yetmez — CUP, resale price, cost-plus hangisi kullanildigi belirtilmeli.
- **Istirak bazli EBITDA katkisi tablosu her raporda ZORUNLU.**
- **Emtia ureticilerinde dogrudan fiyat-maliyet gecirgenligini sayisal ver:** "1 $/ton degisim → yaklasik X milyon TRY etki" formati.
- **Celiskili metriklerde authoritative baglam setini ayrica kilitle.**
- **Context extraction'da ilk is dogrulanmis baglamsal riskleri ve yonetim cikarimini one yaz.**

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **CEO mektubu / yönetim görüşü PDF'ten direkt çekilemedi** — IR HTML ve basın bültenlerinden yapıldı; birincil kaynak olan entegre faaliyet raporu PDF'i içeriği tam verilmedi. Taahhüt takip tablosu (CEO vaatler vs gerçekleşme) eksik kaldı.
- **OYAK ilişkili taraf transfer fiyatlama metodolojisi belirtilmedi** — OYAK %81.49 hissedar; EREGL-OYAK enerji/lojistik/hammadde işlemlerinde CUP/RPM/CPM hangisi kullanıldığı KAP notlarından çekilmedi.
- **Net FX pozisyonu sayısal hesap eksik** — USD gelir − USD maliyet − USD borç ödemesi = net USD pozisyon formülü uygulanmadı; "fonksiyonel para birimi USD" bilgisi verildi ama net pozisyon TRY etkisi hesaplanmadı.
- **İsdemir / Erdemir segment kapasite ve üretim ayrımı** — "Erdemir ~4.5 mt/y, İsdemir ~3.8 mt/y" verildi ✓ ama FY2025 gerçekleşen üretim ve kapasite kullanımı segment bazında (değil sadece konsolide %81) ayrıştırılmadı.
- **Yönetim rehberliği (guidance) eksik** — FY2026 CAPEX bütçesi, üretim hedefleri ve EBITDA bant yönetimi açıklaması context'e eklenmedi.

### Bundan Sonra:
- **CEO mektubu taahhüt takip tablosu Round 1'den itibaren zorunlu** — Önceki yıl vaatlerini vs. gerçekleşmeyi tabloda göster; sadece genel anlatı yetmez.
- **OYAK ilişkisi için transfer fiyatlama Not'unu oku** — KAP "İlişkili Taraf" dipnotundan metodoloji çek. "Arm's length beyanı" yetmez.
- **Net FX pozisyonu formülü standart** — USD net gelir − USD net maliyet − USD borç servisi = Net USD pozisyon → ×kur = TRY riske maruziyet. Her çelik şirketinde zorunlu.
- **Çelik sektörü: hammadde fiyat-maliyet geçirgenliği sayısal** — "$1/ton demir cevheri değişimi → EBITDA TRY X mn etkisi" formatlı hesabı context çıktısına ekle; financial_analysis bu girdiyi bekler.

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Taahhüt takip tablosu Round 1'de yoktu** — Round 2'de eklendi. Bu tablo her analizde Round 1'de sunulmalı; Round 2 supplementi olmamalı.
- **Seasonality analizi Round 1'de yoktu** — Havacılık için Q1-Q4 gelir dağılımı kritik (özellikle Q3 zirve + Q1 düşük sezon). Round 2'de eklendi; sistematik eksiklik.
- **İlişkili taraf transfer fiyatlama metodolojisi yüzeysel** — "Arm's length beyanı" verildi; CUP/resale price/cost-plus hangisinin kullanıldığı belirtilmedi. Kural ihlali.
- **Net FX pozisyonu sayısal verilmedi** — "%90 hard currency gelir" ifadesi var ama net USD/EUR pozisyonu (USD bazlı net kasa − net yükümlülük) somut rakamla gösterilmedi.
- **Stratejik CAPEX timeline eksikti** — A320neo/B787-9 teslimat takvimi Round 2'de eklendi; Round 1'de eksikti.

### Bundan Sonra:
- **Havacılık sektörü için Round 1'den itibaren zorunlu:** Taahhüt takip tablosu + seasonality analizi (Q1-Q4 dağılımı) + filo CAPEX takvimi. Bunlar havacılık özel şablon parçası olmalı.
- **İlişkili taraf işlemlerinde metodoloji belirt** — "Arm's length" yetmez; hangi transfer fiyatlama metodunun kullanıldığını (CUP, RPM, CPM) KAP notlarından çek.
- **Net FX pozisyonu formülü:** USD gelir − USD maliyet − USD borç ödemesi = Net USD pozisyon. TRY %10 değer kaybı → bu pozisyon × kur = TRY etkisi. Somut hesapla.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **CEO mektubu JSON truncated** — Bölüm 5A CEO mektupları analizi tam 5 yıl için çıkmaya başladı ama output kesildi. "Rekor satış büyümesi ve operasyone..." diye bitiyor. Her mektup için en az taahhüt + gerçekleşme özeti zorunlu.
- **FILE spin-off stratejik etkisi yüzeysel** — 30 Haziran 2025 FILE kısmi bölünmesi içerik olarak geçiyor ama BIMAS'ın stratejik yönü üzerindeki etkisi (hangi kategoriler FILE'da kaldı, hangileri BIMAS'ta) ayrıntılandırılmadı.
- **Private label %54 authoritative veri ✓** — Bu doğruydu ve tüm downstream'e düzeltme sağladı. İyi çalışma.
- **FY2025 guidance karşılaştırması eksiksiz ✓** — Taahhüt takip tablosu bu turda (Round 1'de) hazırdı; THYAO dersinden öğrenildi.

### Bundan Sonra:
- **Perakende sektörü zorunlu extraction ekleri:**
  - SSSG (aynı mağaza satış büyümesi) — yönetim açıklamasından veya hesaplamadan: (ciro büyümesi - net yeni mağaza katkısı)
  - Mağaza formatı mix (büyük/küçük mağaza, kentsel/kırsal dağılımı)
  - Özel marka kategorisi breakdown (hangi kategorilerde yoğun, neden erozyon var)
  - Uluslararası segment katkısı (Fas/Mısır ayrı; mağaza sayısı + gelir tahmini)
- **CEO mektubu çıkarımında truncation önlemi** — Her CEO mektubu için: (1) Ana taahhüt, (2) Önceki yıl taahhüt gerçekleşmesi, (3) Gelecek yıl hedefleri — minimum 3 madde, JSON değil sade tablo formatında.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **TCMB faiz düzeltmesi (%46 → %37) downstream'e iletildi mi belirsiz** — Memory.md'deki hatalı değer (%46) düzeltildi ✓; ancak macro_analysis ve financial_analysis gibi downstream agentların bu güncellemeyi aldığına dair teyit yok. Kritik parametre değişikliğinde "downstream notification" zorunlu olmalı.
- **CEO mektubu alıntıları "[PDF çekilmedi]" ağırlıklı** — Section 5A'da 2025 ve 2024 için CEO mektubu özeti GCM raporu özetinden çıkarıldı, faaliyet raporundan değil. Confidence "low" etiketlendi ✓; ancak alternatif kaynak (Koç Holding IR web sitesindeki yayınlar, YK başkanlık raporları) denenmedi.
- **IFRS 8 segment extraction context_extraction'dan da bekleniyor** — Context_extraction'ın görevi sahiplik oranlarını doğrulamak; ancak EYAŞ→TUPRS dolaylı pay (~%36-40) için KAP ortaklık yapısı teyidi yapılmadı, sadece "~%40.5-44.8" aralık verildi.
- **Taahhüt takip tablosu yönetim anlatısı olarak mevcut değil** — 2025 CEO mektubu taahhütlerinin 2024 gerçekleşmeyle kıyaslaması sadece JSON içinde gömülü kaldı; CEO direktifine göre bu tablo raporda görünür formatta olmalı.
- **Net FX pozisyonu sayısal verilmedi** — Holding düzeyinde net USD/EUR pozisyonu (TUPRS USD gelir + FROTO EUR ihracat − holding düzeyinde FX borç) hesaplanmadı.

### Bundan Sonra:
- **Kritik makro parametre değişikliğinde downstream notification yaz** — "TCMB faizi memory.md'de %46 ama gerçek %37 — downstream agentlar bu değeri kullanıyorsa güncelleme gerekli" bildirimi CEO veya orchestrator'a göndermeli.
- **Koç Holding IR sayfasını birincil CEO mektubu kaynağı olarak kullan** — koc.com.tr/yatirimci-iliskileri/raporlar/ adresinden erişilebilir yıllık rapor sunumları, PDF indirilemese bile özet web sayfaları çekilmeli.
- **Efektif pay hesabı için KAP ortaklık bildirimi şart** — EYAŞ→TUPRS dolaylı pay; KAP'ta EYAŞ sahiplik bildiriminden hesaplanmalı, tahmin aralığı verilemez.

## Zorunlu Kontrol Listesi

Her sirket icin cikarilacak:
- [ ] Is modeli (segment yapisi + finansal performans entegrasyonu)
- [ ] Competitive moat analizi
- [ ] Ownership structure (kesin %'ler, KAP'tan dogrulanmis)
- [ ] Management team (CEO, CFO, Chairman — biyografi ozeti)
- [ ] Stratejik inisiyatifler (timeline + CAPEX commitment)
- [ ] Risk analizi (FX, commodity, regulatory, geopolitik)
- [ ] IAS 29 impact notu (Turk sirketleri)
- [ ] Net FX pozisyonu (sayisal)
- [ ] Seasonality detection (Q1-Q4 revenue breakdown, index)
- [ ] ESG profili (karbon hedefleri, sustainability)
- [ ] Iliskili taraf islemleri (transfer fiyatlama dahil)

Sektor ek cikarimlar:
- **Holding:** SOTP NAV hesabi, holding discount (10-40% Turk holdingleri), segment performans, portfolio rebalancing vs distress sale ayrimi, bagli ortaklik ownership %
- **Telekom:** 3 katmanli analiz (Core Telecom + Digital Services + International), 5G strategy deep dive, spectrum moat, churn/ARPU/MNP, subsidiary analizi
- **Rafineri:** Rafineri marji mekanizmasi, white product yield, dogal hedge tespiti (fiyat endekslemesi), ham petrol diversifikasyon, SAF/enerji gecisi
- **Celik/emtia:** AB Safeguard + CBAM takvimi, HRC fiyat-gelir korelasyonu, demir cevheri/kok komuru-COGS gecirgenlik, EPDK enerji tarife etkisi, maden istarakleri degeri
- **Banka:** Dijital donusum metrikleri, NII vs fee income dagilimi, branch vs digital mix

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK business model yuzeysel — gelir dagilimi, musteri segmentleri detay eksik
- KCHOL ownership %'leri "estimate" kaldi — KAP'tan dogrulanabilirdi
- KCHOL segment finansal performansla entegrasyon eksik — hangi segment karli/zararli?
- TCELL business model truncated, 5G strategy yuzeysel (ilk denemede)
- TUPRS Opet iliskili taraf riski yuzeysel — transfer fiyatlama metodolojisi eksik
- EREGL AB Safeguard/CBAM sayisal etki hesaplanmadi, EPDK tarife soku flaglenmedi, emtia fiyat-maliyet mekanizmasi sayisallanmadi

- **CBAM 2026 EREGL double-impact:** AB safeguard (celik ithalat kotasi) 2026'da sona eriyor (daha fazla ithalat rekabeti). Ayni anda CBAM sertifika yukumlulugu basliyor. EREGL analizinde her ikisini birden flag'le: "Safeguard bitti + CBAM aktif = 2026 double squeeze".
- **THYAO 2025 gercek benchmark:** Hasilat 955.5B TRY (+%28), Net kar 118.2B TRY, EBITDAR marji %23.2, FCF $2.8B (+%45 YoY), CASK US¢8.55, RASK US¢7.21. Gelecek THYAO analizlerinde bu referans rakamlari kullan.
- **Holding discount guncel (Nisan 2026):** KCHOL hedef 298.62 TL vs islem 202.50 TL (~%32 iskonto). SAHOL P/BV 0.56 (~%44 iskonto). Turkiye holding iskonto araligini guncelle: %25-45 (eskiden %10-40).

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **Çıktı Bölüm 4.2 ortasında kesildi** — Bölüm 5 (Faaliyet Raporu Derin Analizi) tamamen eksik kaldı.
- **CEO/YK Başkanı mektubu analizi yapılmadı** — Yönetim anlatısı ve taahhüt takibi CEO kuralında zorunlu; çekilmedi.
- **Net FX pozisyonu sayısal verilmedi** — Döviz cinsi borç/alacak breakdown eksik; sadece yorum yapıldı.
- **İştirak EBITDA katkısı tablosu tamamlanmadı** — Her segmentin SAHOL konsolide EBITDA'ya katkısı eksik.
- **WebFetch engeli için upstream escalation yapılmadı** — PDF erişimi engellenince kendi kendine devam etti; CEO'ya escalate edilmeliydi.

### Bundan Sonra:
- **Truncation YASAK:** Çıktı kesilirse "output boyutu aşıldı" uyarısı ile dur, bölüm bölüm gönder. Yarım bırakmak YASAK.
- **Faaliyet raporu derin analizi her holding analizinde ZORUNLU:** CEO mektubu, geçmiş taahhütler, gerçekleşmeler — her biri ayrı tablo. WebFetch engeli varsa CEO'ya escalate et.
- **Net FX pozisyonu sayısal zorunlu:** USD/EUR borç toplamı, kur hassasiyeti (%10 TL zayıflaması → X TRY etki) mutlaka hesaplanmalı.
- **İştirak EBITDA katkısı tablosu ZORUNLU:** Segment → SAHOL payı → katkı TRY. Eksikse [PENDING] ile escalate et; tablonu boş bırakma.

---

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu
### Eksikler:
- Cikti yalnizca `Mock completed output for context_extraction.` seviyesinde kaldi; sirket anlatisi, yonetim taahhutleri, sermaye tahsisi, rekabet konumu ve CEO mektubu icgoru paketi yok.
- Telekom sektorune ozgu makro gecis mekanizmasi ve jeopolitik baglamin isletmeye nasil yansidigi cikariya donusturulmedi.
### Bundan Sonra:
- Her raporda yonetim anlatisi, stratejik oncelikler, sermaye tahsisi, rekabet avantaji ve son 12 ay taahhut takibini kaynakli context paketi olarak ver.
- Makro/geopolitik olaylarin sirket gelir, maliyet, borclanma ve talep kanalina gecis mekanizmasini ayri alt baslikta zorunlu isle.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu Post-Report Loop
### Eksikler:
- Yonetim anlatisi ve faaliyet raporu okumasi olmadigi icin raporda CEO mektubu, hedefler, 5G monetization tezleri ve sermaye tahsisi disiplini kaynaksiz kaldi.
- Iran-ABD, Rusya-Ukrayna, enerji maliyeti ve kur gecis kanallari telekom is modeline nasil baglaniyor sorusu acilmadi.
### Bundan Sonra:
- Context paketi her zaman `yonetim soylemi + stratejik hedef + gecmis taahhut/gerceklesme + rekabet pozisyonu` cekirdegi ile gelecek.
- Makro-jeopolitik baglam yalniz haber ozetlenerek degil, gelir/maliyet/borclanma/talep kanalina gecis zinciri ile islenecek.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Post-Report Feedback Loop
### Eksikler:
- Telekom is modeli icin core mobile, fixed fiber, data center/cloud, fintech ve uluslararasi ayaklar ayni stratejik haritada toparlanmadi.
- Yonetim rehberligi ile gecmis teslim performansi guclu kaynakli bir `trust score` olarak verilmedi; bu yuzden ileriye donuk tez zayif kaldi.
### Bundan Sonra:
- Context extraction her telekom raporunda `is kolu haritasi + KPI + rekabet avatajı + yonetim rehberligi/gecmis teslim` paketini zorunlu verecek.
- Yonetim mektubu ve guidance okumalari yalniz alinti degil, `taahhut -> gerceklesme -> yeni hedef` tablosu olarak sunulacak.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **Ortaklık yapısı tablosu kesildi** — Semahat Sevim Arsel (%6.15) satırında çıktı kesildi; yabancı yatırımcılar ve diğer hissedarlar görünmedi. Kural: tablo yarım bırakılamaz.
- **Taahhüt takip tablosu görünür formatta sunulmadı** — CEO mektubu alıntısı var ✓ (Levent Çakıroğlu, koc.com.tr); ancak "2025 taahhüt → 2025 gerçekleşme" karşılaştırma tablosu JSON'a gömülü kaldı. Raporda ayrı tablo formatında olmalı.
- **Net FX pozisyonu sayısal verilmedi** — TUPRS USD ihracat geliri + FROTO EUR ihracat geliri − KCHOL konsolide FX borç = net FX pozisyon hesabı yapılmadı. Holding için bu hesap zorunlu.
- **EYAŞ→TUPRS dolaylı pay hâlâ aralık** — "~%36-40 dolaylı" verildi; KAP EYAŞ ortaklık bildirimi okunmadan kesin değer verilemez. Tahmini aralık downstream'e geçmemeli.

### Bundan Sonra:
- **Holding net FX pozisyonu formülü** — Sum(segment net FX pozisyon) = Σ[segment USD/EUR net gelir − segment FX borç servisi]. KCHOL için: TUPRS (USD gelir büyük) + FROTO (EUR ihracat ~%70) + ARCLK (ihracat) − konsolide FX debt. Her analizde bu tabloya yer ver.
- **Efektif pay = KAP bildirimi** — EYAŞ sahiplik oranı KAP'ta EYAŞ ortaklık bildirimi sayfasından doğrudan çekilecek; tahmin aralığı verilmeyecek.
- **Taahhüt takip tablosu her holding raporunda Round 1'den itibaren** — CEO mektubu → sütun 1: taahhüt, sütun 2: gerçekleşme, sütun 3: sapma/yorum. Gömülü JSON değil, ayrı rapor tablosu.
