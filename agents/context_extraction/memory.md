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

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **TSKGV sahiplik oranı KAP'tan doğrulanmadı** — "~%84-85 [src: inference]" olarak verildi. TSKGV ASELS'in dominant hissedarı; kesin oran KAP ortaklık bildirimi veya şirket tescil belgelerinden doğrulanmalıydı. "Inference" kabul edilemez.
- **Net FX pozisyonu sayısal hesaplanmadı** — ASELS gelirinin önemli kısmı USD/EUR cinsinden (ihracat, dövizli sözleşmeler); maliyet TRY ağırlıklı. Net USD pozisyonu = USD gelir − USD maliyet = doğal hedge var mı? Bu hesap yapılmadı.
- **Yönetim rehberliği (guidance) eksik** — FY2026 sipariş hedefleri, ihracat hedefi, AR-GE harcama bütçesi context'e eklenmedi.
- **Transfer fiyatlama metodolojisi belirtilmedi** — TSKGV ve SSB (Savunma Sanayii Başkanlığı) ile sözleşmelerde hangi fiyatlama yöntemi kullanıldığı (maliyet+, münhasır ihale, uzlaşılmış fiyat) belirtilmedi.
- **Jeopolitik bağlam eksik** — ASELS değerlemesinin %90'ı jeopolitiktir: Iran-ABD gerilimi, Rusya-Ukrayna savaşı, NATO bütçeleri, Türkiye SSB bütçesi artışı — bunların sipariş defterine transmisyon mekanizması analiz edilmedi.
- **Sipariş defteri (backlog) ve sözleşme visibilitesi eksik** — Backlog/Revenue oranı savunma şirketlerinin temel komfort metriği; context'te yoktu.

### Bundan Sonra:
- **Savunma şirketi için jeopolitik bağlam bölümü ZORUNLU** — Iran-ABD, Rusya-Ukrayna, NATO bütçe taahhütleri, Türkiye SSB bütçesi → savunma sipariş defteri transmisyon mekanizması zorunlu bölüm.
- **TSKGV ve SSB ilişkisi için transfer fiyatlama metodolojisi** — KAP "İlişkili Taraf" dipnotundan metodoloji çek; "Arm's length beyanı" yetmez.
- **Savunma sektörü ek extraction listesi:** (1) Backlog tutarı ve kapsama süresi, (2) İhracat/iç satış oranı (%), (3) AR-GE harcaması/ciro %, (4) SSB/TSKGV sözleşme duyuruları özeti.

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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **TVF ortaklık oranı "[VERİ YOK]" kaldı** — "~%49.12" tahmini verildi ama KAP Şirket Genel Bilgi Formu (1590424) okunmadı. Delta-update'te bu form KAP watch'tan geldi; form okunup kesin oran çıkarılmalıydı.
- **Net FX pozisyonu sayısal hesap yok** — "%90 hard currency gelir" bağlamı var ✓ ama delta-update'te "USD gelir − USD maliyet − USD borç = net pozisyon × kur = TRY etki" hesabı yapılmadı. İran krizi sonrası 10 rota askıya alındı; bu rotaların USD gelir kaybı sayısallaştırılmadı.
- **İran krizinin rota bazlı gelir etkisi çekilmedi** — "10 Orta Doğu rotası askıya, H1 2026 ~54,000 mn TRY kayıp" CEO pre-flight'ta bilgiydi ama context_extraction bu tahminin kaynağını ve methodolojisini doğrulamadı; downstream'e [VERİ YOK] olarak mı geçti belirsiz.
- **Yeni CEO (Ahmet Olmuster) profili çıkarılmadı** — CEO/YK değişimi P0 event olarak pre-flight'ta belirtildi. Context_extraction yeni CEO'nun geçmişini, stratejik önceliklerini ve pazar sinyallerini çıkarmalıydı. Çıktıda görünmüyor.
- **Temettü sıfır kararının stratejik yorumu eksik** — "2025 karının tamamı tutuldu" bilgisi var ✓ ama "Bu karar THYAO'nun stratejik öncelikleri (filo yatırımı? borç azaltımı? büyüme?) hakkında ne söylüyor?" bağlamsal yorumu çıkarılmadı.

### Bundan Sonra:
- **CEO/YK değişiminde yeni lider profili ZORUNLU** — Yeni atanan CEO için: (1) Önceki pozisyon ve şirket, (2) Sektör deneyimi, (3) Bilinen stratejik tutum, (4) Piyasa reaksiyonu. Bu profil olmadan "yönetim kredibilitesi" bölümü boş kalır.
- **Delta-update'te P0 olaylar için ilk iş context güncelleme** — CEO değişimi, temettü sıfır, rota askıya alma → her birini "ne oldu → ne anlama geliyor → hangi metrik etkilenir" zinciriyle context'e ekle. Sadece bilgi ver, yorum da ekle.
- **KAP Şirket Genel Bilgi Formu her delta-update'te oku** — Bu form sahiplik, yönetim kurulu, bağlı ortaklık değişikliklerini içerir. delta-update'te özellikle "değişim bildirimi" kategorisindeki formlar birincil kaynak.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **Yeni CEO Ahmet Olmüster profili eksik — 3. direktif** — 9 Nisan 2026 CEO değişimi; 4-madde profil (geçmiş, önceki pozisyon, strateji farkı, piyasa reaksiyonu) üretilmedi. Delta feedback'te de yazıldı, Standard'da da eksik kaldı.
- **TVF ortaklık oranı (~%49.12) KAP'tan doğrulanmadı** — KAP Şirket Genel Bilgi Formu (1590424) okunmadı; tahmini oran downstream'e geçti. 2. kez aynı hata.
- **Net FX pozisyonu sayısal hesaplanmadı** — "%90 hard currency gelir" seviyesinde kaldı. USD gelir − USD kira/yakıt gideri − USD borç servisi = Net USD pozisyon TRY hesabı yok.
- **İran rotaları gelir etkisi sayısallaştırılmadı** — 10 rota × kapasite × bilet geliri = H1 2026 TRY kayıp tahmini context'te üretilmedi. Delta feedback'te de yazıldı; Standard'da da eksik.
- **Mevsimsellik analizi eksik** — Q1 düşük / Q3 zirve sezon dağılımı Round 1'de yer almadı. Bu THYAO için 2. tekrar.

### Bundan Sonra:
- **CEO/YK değişiminde 4-madde profil zorunlu (3. direktif, kesinleşti)** — Önceki pozisyon + sektör deneyimi + bilinen stratejik tutum + piyasa reaksiyonu. Eksikse çıktı tamamlanmış sayılmaz.
- **THYAO Net FX formülü (IFRS 16 dahil)** — USD gelir − USD yakıt maliyeti − USD IFRS 16 kira ödemesi − USD finansal borç servisi = Net USD pozisyon. TRY %10 zayıflaması etkisi = net × kur.
- **Havacılık zorunlu Round 1 şablonu** — Taahhüt takip tablosu + Q1-Q4 seasonality + filo CAPEX takvimi + İran jeopolitik rota kaybı sayısallaştırması. Round 2'ye bırakılamaz.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **Yeni CEO Ahmet Olmüster profili eksik** — 9 Nisan 2026 CEO değişimi P0 event; Delta-update feedback'te de yazıldı, Standard raporda hâlâ yok. Yeni CEO için zorunlu: (1) Önceki pozisyon/şirket, (2) Sektör deneyimi (havacılık mı, finans mı?), (3) Bilinen stratejik tutum, (4) Piyasa reaksiyonu. Bu profil olmadan skor kartı "Yönetim Kalitesi" boyutu kör.
- **Ortaklık yapısı tablosu kesildi** — TVF oranı için "[VERİ YOK]" verildi; KAP Şirket Genel Bilgi Formu (1590424) okunmadan tahmini geçildi. Delta-update feedback'te aynı hata işaretlenmişti — 2. kez tekrar.
- **Net FX pozisyonu sayısal hesap yok** — Standard raporda da "%90 hard currency gelir" seviyesinde kaldı. "USD gelir − USD maliyet − USD finansal kiralama ödemesi = Net USD pozisyon → ×kur = TRY etki" hesabı üretilmedi. THYAO için bu hesap IFRS 16 kiralama ödemelerini de içermeli.
- **İran krizi rota bazlı gelir etkisi çıkarılmadı** — 10 Orta Doğu rotasının H1 2026 USD gelir kaybı context extraction'da sayısallaştırılmadı; downstream'e yorum seviyesinde geçti. Delta feedback'te yazıldı; Standard raporda da eksik.
- **Seasonality analizi Round 1'de yok** — 14 Nisan THYAO raporunda aynı eksiklik: havacılık Q1-Q4 gelir dağılımı (Q3 zirve, Q1 düşük sezon) Round 1'de sunulmalı. Bu 2. tekrar.
- **Temettü sıfır kararının stratejik yorumu yüzeysel** — "2025 karının tamamı tutuldu" bilgisi var ✓ ama "Bu karar ne anlama geliyor — filo yatırımı mı, borç azaltımı mı, büyüme fonu mu?" bağlamsal yorumu downstream'e geçmedi.

### Bundan Sonra:
- **CEO/YK değişiminde yeni lider profili ZORUNLU (3. direktif)** — Yeni atanan CEO için 4 maddelik profil: (1) Önceki pozisyon/şirket, (2) Sektör deneyimi, (3) Bilinen stratejik tutum, (4) Piyasa reaksiyonu. Context_extraction bu profili KAP ve haber kaynaklarından çıkarmadan çıktısını tamamlandı saymamalı.
- **KAP Şirket Genel Bilgi Formu = sahiplik teyidi için birincil kaynak** — TVF oranı, yönetim kurulu yapısı, bağlı ortaklık değişimleri bu formda. Her THYAO analizinde form okunacak; tahmin aralığı verilemez.
- **THYAO Net FX formülü (IFRS 16 dahil):** USD hard currency gelir − USD yakıt maliyeti − USD IFRS 16 kira ödemesi − USD finansal borç servisi = Net USD pozisyon. TRY %10 zayıflaması etkisi = net pozisyon × kur. Hem negatif hem pozitif senaryo hesaplanacak.
- **Havacılık zorunlu Round 1 şablonu:** Taahhüt takip tablosu + Q1-Q4 seasonality + filo CAPEX takvimi + İran/jeopolitik rota kaybı sayısallaştırması. Bunlar Round 2'ye bırakılamaz.

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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **CEO Ahmet Olmüster profili eksik — 3. direktif** — 9 Nisan 2026 atanmasından bu yana 3 THYAO analizinde profil üretilmedi. KAP atama bildirimi + haber taraması yapılmadan çıktı tamamlandı sayılamaz.
- **TVF oranı tahmin aralığı olarak verildi — teyit edilmedi** — "%49 TVF" doğrulansın: KAP Şirket Genel Bilgi Formu birincil kaynak; "~%49" veya aralık biçimde verilmesi downstream güven kaybı yaratıyor.
- **Net FX pozisyonu sayısallaştırılmadı** — USD hard gelir - USD yakıt - USD IFRS16 kira - USD borç servisi = net USD pozisyon. TRY %10 zayıflaması senaryosu hesaplanmadı. Bu havacılık analizinin temel girdisi.
- **Mevsimsellik bölümü eksik** — THYAO yaz/kış doluluk farkı, Q1-Q4 EBITDAR dağılımı, Ramazan/Kurban bayramı etkileri — bunlar stratejik sentez için zorunlu girdi.
- **İran krizi rota kaybı sayısallaştırılmadı** — "İran rotaları askıya alındı" tespiti var ✓; ancak kaç sefer/hafta, hangi güzergahlar, tahmini gelir kaybı = null.

### Bundan Sonra:
- **CEO/YK değişiminde yeni lider profili ZORUNLU (3. direktif → artık hard bloker)** — Yeni CEO için 4 madde: (1) önceki pozisyon/şirket, (2) sektör deneyimi, (3) bilinen stratejik tutum, (4) piyasa reaksiyonu. Bu profil olmadan context_extraction çıktısı tamamlanmış sayılmaz.
- **Net FX formülü her THYAO'da Round 1'den zorunlu:** USD gelir − USD yakıt − USD IFRS16 ödemesi − USD borç servisi = Net USD pozisyon. TRY %10 zayıflama etkisi = net pozisyon × kur değişimi.
- **Rota kaybı sayısallaştırma şablonu:** (İptal edilen sefer/hafta) × (ortalama doluluk %83) × (ortalama bilet geliri USD) × 52 hafta = yıllık gelir kaybı tahmini `[conf: MEDIUM]`.
- **Sahiplik yapısı = KAP Genel Bilgi Formu (anlık)** — "~%" veya aralık değil; KAP formundaki kesin oran. Tahmin aralığı verilmez.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417)

### Eksikler:
- **Çıktı truncated** — Coğrafi maruz kalma bölümü "Teknik/MRO/Catering" ile kesildi. Brand identity ve şirket profili iyi başladı; sonrası yok. Truncation YASAK kuralı ihlali.
- **CEO Ahmet Olmüster profili yok — 5. THYAO direktifi, artık tolerans sıfır** — 9 Nisan 2026 CEO değişikliği; 4-madde profil (geçmiş, önceki pozisyon, strateji farkı, piyasa reaksiyonu) 5 THYAO analizinde de üretilmedi. Bu çıktı eksikliği "Yönetim Kalitesi" skor kartı boyutunu tamamen kör bırakıyor.
- **Net FX pozisyonu sayısallaştırılmadı — 5. THYAO** — USD hard gelir − USD yakıt − USD IFRS 16 kira − USD borç servisi = Net USD pozisyon formülü uygulanmadı.
- **İran krizi rota kaybı sayısallaştırılmadı — 5. THYAO** — Kaç rota, kaç sefer/hafta, tahmini gelir kaybı TRY hesabı üretilmedi.
- **Mevsimsellik analizi yok — 3. direktif** — Q1 düşük / Q3 zirve sezon dağılımı, Ramazan/Kurban bayramı etkileri eksik.
- **KAP Şirket Genel Bilgi Formu okunmadı** — TVF ortaklık oranı (~%49.12) tahmini olarak kalmaya devam ediyor.

### Bundan Sonra:
- **CEO/YK değişiminde 4-madde profil = hard bloker (5. direktif, tolerans sıfır)** — Bu profil olmadan context_extraction çıktısı tamamlanmış sayılmaz, downstream'e gönderilmez.
- **THYAO havacılık bağlamı zorunlu 5 madde Round 1'den:** (1) CEO profili, (2) Net FX sayısal, (3) Q1-Q4 mevsimsellik, (4) İran rota kaybı sayısal, (5) Taahhüt takip tablosu. Herhangi biri eksikse çıktı PENDING_CONTEXT.
- **Truncation → Core + Appendix** — Çıktı büyükse iki parça halinde gönder; yarım bırakma.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **CEO Ahmet Olmüster profili eksik — 4. THYAO direktifi, artık hard bloker** — 9 Nisan 2026 CEO değişikliği; 4-madde profil (geçmiş, önceki pozisyon, strateji farkı, piyasa reaksiyonu) 4 THYAO analizinde de üretilmedi. Bu çıktı eksikliği "Yönetim Kalitesi" skor kartı boyutunu tamamen kör bırakıyor.
- **TVF oranı (%49.12) KAP'tan doğrulanmadı** — KAP Şirket Genel Bilgi Formu (disclosure_id: 1590424) bu bildirim döneminde mevcuttu ve okunmadı. Tahmini oran downstream'e geçti.
- **Net FX pozisyonu sayısallaştırılmadı — 4. THYAO** — USD hard gelir − USD yakıt − USD IFRS 16 kira − USD borç servisi = Net USD pozisyon formülü; TRY %10 zayıflama senaryosu hesaplanmadı.
- **Mevsimsellik analizi yok** — Q1 düşük / Q3 zirve sezon dağılımı, Ramazan/Kurban bayramı etkileri 4. turda da eksik.
- **İran krizi rota kaybı sayısallaştırılmadı — 4. THYAO** — Kaç rota, kaç sefer/hafta, tahmini gelir kaybı TRY formülü üretilmedi. Yönetim Kurulu Raporu (THYAO_Yonetim_Kurulu_Raporu_20260416.pdf) okunmadı; bu kaynak yönetim görüşü için birincil olmalıydı.

### Bundan Sonra:
- **CEO/YK değişiminde 4-madde profil = hard bloker (4. direktif, tolerans sıfır)** — Profil olmadan context_extraction "tamamlandı" sayılmaz. KAP atama bildirimi (1590373) + haber taraması (Reuters/Bloomberg Türkiye) + LinkedIn/şirket profili = 3 kaynak üretilecek.
- **YK Raporu okunması context'in 1. görevi** — THYAO_Yonetim_Kurulu_Raporu_20260416.pdf: yönetim görüşü, gelecek döneme bakış, taahhüt takibi — bu veriler başka kaynaktan gelmiyor.
- **KAP Şirket Genel Bilgi Formu = sahiplik teyidinin tek kaynağı** — TVF oranı, YK üyeleri, komite yapısı bu formda. "~%" veya aralık yazmak yasak; form okunmadan sahiplik bölümü tamamlanamaz.
- **THYAO havacılık bağlamı zorunlu 5 madde (Round 1'den):** (1) CEO profili, (2) Net FX pozisyonu sayısal, (3) Q1-Q4 mevsimsellik, (4) İran rota kaybı sayısal, (5) Taahhüt takip tablosu. Bunların herhangi biri eksikse çıktı PENDING_CONTEXT sayılır.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **CEO Ahmet Olmüster profili yok — 5. THYAO direktifi, tolerans tamamen tükendi** — 9 Nisan 2026 CEO değişikliği; 4-madde profil 5 THYAO analizinde de üretilmedi. "Yönetim Kalitesi" skor kartı boyutu 5 analizdir kör.
- **Yabancı yatırımcı oranı hâlâ [VERİ YOK]** — TVF oranı bu turda kaynaklanmış görünüyor; ancak yabancı yatırımcı yüzdesi teyit edilemedi.
- **Net FX pozisyonu sayısallaştırılmadı — 5. THYAO** — USD hard gelir − USD yakıt − USD IFRS16 kira − USD borç servisi = Net USD pozisyon formülü 5 analizdir uygulanmadı.
- **İran krizi rota kaybı sayısallaştırılmadı — 5. THYAO** — Kaç rota, kaç sefer/hafta, tahmini TRY gelir kaybı formülü üretilmedi.
- **Mevsimsellik analizi yok — 3. direktif** — Q1/Q3 sezon dağılımı, Ramazan/Kurban bayramı etkileri eksik.
- **Truncation** — Coğrafi maruz kalma bölümü tamamlanamadan kesildi; Core + Appendix formatı uygulanmadı.

### Bundan Sonra:
- **CEO/YK değişiminde 4-madde profil = hard bloker (5. direktif, tolerans sıfır)** — Bu profil olmadan context_extraction çıktısı tamamlanmış sayılmaz; downstream'e gönderilmez. KAP atama bildirimi + haber taraması + şirket profili = 3 kaynak.
- **THYAO havacılık bağlamı 5 madde zorunlu** — (1) CEO profili, (2) Net FX sayısal, (3) Mevsimsellik, (4) İran rota kaybı sayısal, (5) Taahhüt takip tablosu. Herhangi biri eksik → çıktı PENDING_CONTEXT.
- **Truncation → Core + Appendix** — Çıktı büyükse iki parça halinde gönder; yarım bırakma.
