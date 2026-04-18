# Data Collection Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **4 Core Statement ZORUNLU:** IS, BS, CF, SE — CF eksikse output reddedilir. `statement_coverage` alani zorunlu.
- **Indirect verification KABUL EDILMEZ:** "Confirmed (indirect)" yetmez. KAP PDF'ten gercek tablo sayfasini gor, extract et.
- **Discrepancy resolution:** Celiseni flagle + ikisini raporla + COZ. KAP audited PDF birincil kaynak.
- **Gercekci data quality score:** CF eksik: -0.15, equity discrepancy: -0.10, quarterly eksik: -0.05, PDF fail: -0.05.
- **Deep dive = quarterly + 5 yil:** Q1-Q4 quarterly + 5 yillik historical data ZORUNLU.
- **En guncel rapor kontrolu:** Her analize baslamadan once KAP'ta son yillik rapor var mi kontrol et. Varsa KULLAN. "Eski veri var ama yeni rapor KAP'ta" = BASARISIZLIK.
- **Holding = IFRS 8 ZORUNLU:** Segment bazli revenue, EBITDA, assets extract et. Bagli ortaklik ownership % zorunlu.
- **Balance sheet FULL extraction:** Sadece total degil TUM satirlar — Current/Non-current Assets, Liabilities, Equity, NCI.
- **Revenue anomaly (>%100) = restatement note arastir:** Scope change, M&A, accounting policy change olabilir.
- **"Bulunamadi" demeden 5 adim:** KAP annual PDF, KAP XBRL, IR sayfasi, quarterly reports, WebFetch gorsel extraction.
- **Output truncation YASAK:** Buyukse summary + detail olarak ikiye bol, ikisini de tamamen gonder.
- **TBD/pending YASAK:** Kesin durum yaz; aradir, dogrula.
- **Tablo yarim birakma YASAK:** Basladin mi TAMAMLA.
- **IAS 29 pre-check ZORUNLU:** Her Turk sirketi icin "3 yil kumulatif TUFE >%100 mi?" kontrol et, flag ekle.
- **Iceriden islem taramasi her analizde ZORUNLU:** KAP'ta yonetim islemleri ayrica taranmali.
- **Beklenen veri tarihleri downstream'e bildir:** Manifest'te "beklenen aciklama: YYYY-MM-DD" alani doldur.
- **Canonical fact pack:** Veri toplama sonunda downstream icin tek bir onayli canonical fact pack uret. Her sayisal iddianin karsisina belge seviyesi referans koy.
- **source_document_id ZORUNLU:** Her belge icin belge adi, donem, tarih, URL, kaynak sinifi.
- **Ikincil veriyi ayir:** Piyasa/konsensus verileri `secondary/unverified` etiketi ile ayri tutulmali.

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Cash Flow Statement tamamen çekilmedi** — OCF/FCF/CAPEX confidence 0.00. Pipeline'ı 3 tur boyunca bloke etti. Bu tek hata QA skoru 0.80 eşiğini geçirdi.
- **Statement of Changes in Equity (SE) eksik** — 141B TRY D1 gap 3 QA turunda da çözümsüz kaldı. ROE/P/BV ±21% belirsizliğe yol açtı.
- **Working capital alt kalemleri eksik** — AR, AP, Inventory satır bazlı extract edilmedi; DSO/DIO/DPO/CCC tamamen blocked.
- **"CONDITIONAL PASS" kararı verdi** — CEO direktifi conditional_pass = BLOCK. Bu karar data_collection'ın yetkisi dışında; QA/CEO'nun kararıdır. Pipeline yanlış açıldı.
- **5 yıllık historical data yetersiz** — Sadece 2024 IS tam; 2020-2023 gelir tablosu, bilanço yalnızca tahmin bazlı (conf. 0.70-0.75).

### Bundan Sonra:
- **CF tablosu olmadan output GÖNDERME** — KAP PDF'ten CF sayfası (Operating/Investing/Financing sections) çekilmeden parse_standardization'a veri geçirme.
- **SE tablosu olmadan output GÖNDERME** — Statement of Changes in Equity (özsermaye hareket tablosu) her analizde zorunlu. Eksikse pipeline'ı bloke et, CEO'ya escalate et.
- **"CONDITIONAL PASS" kararı verme** — Data quality kararı yalnızca QA/CEO verir. Sen yalnızca veriyi topla, downstream ile "bloker" veya "temiz" olarak paylaş.
- **IFRS 16 havacılık şirketlerinde:** ROU varlıklar + lease borcu ayrı satırda çekilmeli; Net Borç formülü için finansal kiralama borcu ayrıştırılmalı.

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **FY2021-2023 IS/BS verileri "[VERİ ÇEKME]" ile bırakıldı** — Manifest'te 5 yıllık kapsam taahhüt edildi; ancak FY2021-2023 için gelir tablosu ve bilanço satirlari doldurulmadi. Sadece FY2025 ve kısmen FY2024 tam. 5 yıllık seri zorunludur.
- **CF ve SE tabloları kısmi kaldı** — Reconciliation "CF/Özsermaye Tabloları ⚠️ KISMİ" olarak flagledi. OCF/FCF doğrulandı ama ICF, Finansman CF ve özsermaye hareket tablosu (SE) eksik kaldı.
- **Quarterly data sunulmadı** — Deep dive = quarterly + 5 yıl zorunlu kuralına karşın Q1-Q4 2024/2025 quarterly breakdown gönderilmedi.
- **Canonical fact pack net biçimde yayımlanmadı** — Downstream ajanlara tek onaylı fact pack sunulmadı; çelişen rakamlar (ticari borç 19,628 vs 68,762 mn) birden fazla agent tarafından farklı yorumlandı.
- **İçeriden işlem taraması eksik** — KAP'ta yönetim işlemleri taraması zorunlu; çıktıda hiç değinilmedi.
- **İsdemir (EREGL %94.87) finansal verileri ayrıca toplanmadı** — Konsolide + segment (Erdemir / İsdemir ayrımı) ayrı manifest kalemlerinde olmak zorunda.

### Bundan Sonra:
- **FY2021-2023 için minimum veri seti tamamla, bırakma** — KAP XBRL veya yıllık rapor PDF'ten en az Revenue/Net Profit/Total Assets/Net Debt 5 yıllık seri olmadan deep dive output gönderme.
- **CF ve SE olmadan output gönderme** — Sadece OCF değil; ICF (yatırım CF), Finansman CF ve özsermaye hareket tablosu (SE) tam olmadan çıktı gönderilmez.
- **Canonical fact pack zorunlu** — Her analizin sonunda FY başına tek onaylı anahtar rakam tablosu (Revenue/EBITDA/Net Profit/Net Debt/OCF) yayımla; downstream bu tabloya kilitlenir.
- **İsdemir KAP ID'si ayrı tara** — EREGL konsolide ile İsdemir birleşik bağlı ortaklık bildirimleri segment ayrımı için zorunlu.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **CF/SE tabloları Tour 2'de de çekilemedi** — "UPSTREAM BLOCKER" eskalasyonu yapıldı ama çözüm gelmedi. KAP PDF script (node fetch-pdf.js) çalıştırılmadı; "bekliyorum" modunda kaldı. CEO direktifi: "veri yok YASAK — 5 adım tüket."
- **Canonical fact pack üretilmedi** — Revizyon turu sonunda downstream için tek onaylı fact pack yayımlanmadı. Çelişen rakamlar (share count, private label %) birden fazla agent tarafından farklı yorumlandı.
- **Private label erozyon mekanizması analiz edilmedi** — %59 → %54 düşüş tespit edildi ama hangi ürün kategorilerinde, hangi tedarikçilerle ilgili olduğu açıklanmadı.
- **Temettü hesabı KAP'tan doğrulandı ✓** — 14 TL × 600M = 8.4B TRY hesabı ile share count teyit edildi. Bu iyi uygulama.

### Bundan Sonra:
- **Perakende sektörü zorunlu ek veriler** — SSSG (aynı mağaza satış büyümesi), net yeni mağaza sayısı (açılan - kapanan), mağaza başı gelir (TRY/mağaza/yıl), inventory turnover days — bunlar perakende analizinin temel KPI'ları; 5 yıllık time-series zorunlu.
- **CF tablosu olmadan pipeline'ı DURDUR, alternatif yol ara** — KAP PDF'ten CF çekilemiyorsa: (1) XBRL parser ile dene, (2) KAP'ta tablo formatında sunum var mı bak, (3) IR sayfası kontrol et. 3 yol da başarısızsa CEO'ya "5 adım tüketildi, insan müdahalesi gerekli" eskalasyonu gönder.
- **Canonical fact pack zorunlu çıktı** — Her revizyon turunda, verilen tüm rakamlara tek referans noktası oluştur: FAVÖK, net kar, hisse adedi, brüt kar, private label % — her birinin yanında belge seviyesi kaynak. Bu downstream çelişmeleri önler.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **Revenue Q4/FY karışıklığı "RESOLVED" ilan edildi ama yanlış çözüme kilitlendi** — 802.669 milyar TRY = Q4 2025 verisi; FY2025 = 2.76 trilyon TRY. data_collection Round 2'de "802.669 M TRY audited FY2025" diyerek canonical fact pack'e yanlış değer girdi. Bu hatayı financial_analysis ve reconciliation downstream'e taşıdı. P0 "RESOLVED" sayılmamalıydı.
- **KAP PDF script çalıştırılmadı** — CEO mandatında "node scripts/fetch-pdf.js KAP 1512431" direktifi verilmişti. İki revision turunda da bu adım atlandı; script çalıştırılmadan "CANNOT EXECUTE" ile eskalasyon yapıldı. Script başarısız olsa bile log göster, "bekleniyorum" modunda kalma.
- **IFRS 8 segment EBITDA %0 extraction** — TUPRS, TCELL, AKBNK, EREGL, FROTO, ARCLK segment verileri iki tur boyunca çekilemedi. Holding valuation için kritik; alternatif yollar (GCM SOTP'taki segment verileri, KAP XBRL segmenti) tüketilmeden "BLOCKED" denildi.
- **Ticari alacaklar hiç elde edilemedi** — DSO hesabı için zorunlu. Fintables 403 aldı ama Teknik Piyasa sayfası ve GCM raporu kaynak olarak işaretlendi; içerikleri çekilmedi. "Sources identified but not yet retrieved" = görev tamamlanmadı.
- **Canonical fact pack yayımlanmadı** — 802.669B TRY hatalı revenue değeri downstream'e canonical figure olarak geçti; bu 4+ agent'ta hatalı marj hesabına yol açtı.

### Bundan Sonra:
- **Revenue Q4 vs FY ayrımını her zaman açıkça etiketle** — "Q4 2025 (3 ay): 802.669B TRY" ve "FY2025 (12 ay): 2.76T TRY" iki ayrı satır olarak canonical fact pack'e gir. Asla birini diğeri yerine koyma.
- **Script çalıştırma sonucunu raporla** — KAP PDF script komutu çalıştırıldıysa çıktıyı göster; başarısızsa hata mesajını göster. Sessiz "BLOCKED" yasak.
- **IFRS 8 için alternatif kaynak sırası:** (1) KAP XBRL segment tablosu, (2) GCM/analist SOTP'taki segment breakdown'ı, (3) faaliyet raporu PDF sayfa 20-35. Üçü de başarısızsa CEO'ya "5 adım tüketildi" eskalasyonu.
- **Holding raporunda FY geliri doğrulanmadan canonical fact pack yayımlama** — KAP'ta "konsolide gelir tablosu" satırını doğrudan gör, tahmin veya proxy kullanma.

## Zorunlu Kontrol Listesi

Her analiz oncesi:
1. Bugunun tarihi vs beklenen son rapor tarihi kontrol
2. KAP'ta en guncel rapor var mi? → Varsa indir ve kullan
3. 4 core statement (IS, BS, CF, SE) mevcut mu?
4. IAS 29 pre-check yapildi mi?
5. Insider islem taramasi yapildi mi?

Her rapor icin toplanacak:
- [ ] Gunluk borsa verileri (fiyat, hacim, 52W band, market cap, beta, F/K)
- [ ] Teknik gostergeler (RSI, MOM, MACD, destek/direnc)
- [ ] Bilanco detay kirilimi (asset/liability alt kategoriler)
- [ ] Brut oran, aktif devir hizi, borc/ozsermaye, FX net pozisyonu
- [ ] Peer comparison (min 1, ideal 3-5 peer)
- [ ] data_collection_metadata (report_date, publication_date, collection_date, is_latest_available, source)

Sektor ek checklists:
- Telekom: BTK verileri, abone breakdown, ARPU, churn, MNP, spectrum, 5G timeline
- Rafineri: Urun dagilim tablosu (yield), kapasite kullanim, rafineri marji
- Celik/emtia: EBITDA/ton, kapasite util%, urun karmasi, hammadde bagimliligi
- Banka: BDDK verileri, NPL detay, capital adequacy, segment breakdown
- Holding: IFRS 8 segment, bagli ortaklik ownership %, NAV hesabi icin veriler

## Bilinen Hatalar (Bir Daha Yapma)

- TCELL 2025 raporu KAP'ta varken 2024 verisi kullanildi → KABUL EDILEMEZ
- EREGL 2024 primary olarak sunuldu, 2025 toplanmadi → parse_standardization yanlis veri uretti
- KCHOL segment finansallari tamamen eksik birakild
- SISE equity discrepancy (186B vs 208B) cozulmeden downstream'e gonderildi
- TUPRS insider islem (Koc %2.1 satis) data collection yerine teknik analizden geldi
- EREGL temettu celiskisi (0.25 vs 0.55 TL) cozulmeden downstream'e tasindi
- Segment gelir dokumu "requires parsing" olarak gecildi — PARSE ET
- KAP disclosure_id'ler dogrulanmadan tahmini kullanildi

- **Surdurulebilirlik raporu yeni kaynak (2025+):** Buyuk sirketler icin surdurulebilirlik/ESG raporu yayini zorunlu hale geldi. Karbon emisyonu, su tuketimi, enerji verisi bu rapordan alinmali — ozellikle celik/rafineri/telekom icin.
- **TAS 29 vs IAS 29 ayrimi:** TAS 29 (yerel KGK standardi) 7571 sk ile 2025-2027 arasi askida; IAS 29 (IFRS/SPK raporlamasi) HALA GECERLI. SPK tablolarini IAS 29 uzerinden degerlendir.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **CAPEX gerçek veriden değil proxy'den hesaplandı** — Enerjisa 23.5B biliniyordu ama diğer segmentler tahmin. Holding analizi için her segment CAPEX'i ayrı KAP PDF'inden çekilmeli.
- **Nakit bakiyesi LOW confidence** — Opening/closing cash balance reverse-engineer ile üretildi. Bilanço nakit satırı KAP'tan doğrudan okunmadı.
- **Working Capital değişimleri OCF bridge residual'dan türetildi** — DSO/DIO/DPO/CCC hesabı için Trade Receivables, Inventory, Trade Payables ayrı satırlar çekilmedi.
- **5 yıllık IS tablosu büyük bölümü PENDING** — COGS, Gross Profit, OPEX, D&A, Finance Income/Cost 2020-2024 arası tamamlanmadı.
- **Bağlı ortaklık CAPEX konsolidasyon ayrımı yapılmadı** — Holding-only vs konsolide CAPEX farkı gösterilmedi.

### Bundan Sonra:
- **Holding analizi = segment CAPEX tablosu ZORUNLU:** Her iştirak (Akbank, Enerjisa, Brisa, Çimsa vb.) için ayrı CAPEX satırı KAP/IR'den çekilmeli. "Proxy" veya "estimate" YASAK.
- **Nakit bakiyesi doğrudan bilanço satırından:** BS satırında "Nakit ve Nakit Benzerleri" doğrudan okunacak; reverse-engineer YASAK.
- **WC döngüsü için 5 alt satır ZORUNLU:** Trade Receivables, Inventory, Other Current Assets, Trade Payables, Other Current Liabilities — ayrı ayrı çekilmeli.
- **IS zinciri %100 dolu olmadan canonical fact pack üretme:** COGS eksikse Gross Profit hesaplanamaz; D&A eksikse EBIT bridge kurulamaz. Eksik varsa CEO'ya escalate et.

---

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu
### Eksikler:
- Cikti yalnizca `Mock completed output for data_collection.` seviyesinde kaldi; KAP/SPK/XBRL veya faaliyet raporu PDF'den cekilmis tek bir ham veri, tablo ya da kaynak izi yok.
- 5 yillik gelir tablosu, bilanço, nakit akisi, ozkaynak degisim tablosu ve Chairman'in zorunlu metriklerini destekleyecek satir bazli veri paketi downstream'e verilmedi.
### Bundan Sonra:
- Her raporda output icinde zorunlu olarak `kaynak dosya + tablo adi + satir kalemi + donem` bazli ham veri ozetini ver; mock/placeholder cikti YASAK.
- Cash flow, working capital ve borc metrikleri icin gerekli satirlari toplamadan `completed` deme; eksik varsa upstream talep veya alternatif kaynak dene, sonra eskale et.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu Post-Report Loop
### Eksikler:
- DSO, DIO, DPO, CCC, NWC/hasilat, NWC gun, cari oran, asit-test, faiz karsilama ve Cash FAVOK icin gerekli alt satirlar ham veri paketine konmadi.
- Faaliyet raporu/IR tarafindan yonetim rehberi, capex plani, abone/KPI seti ve telekom makro gecis mekanizmasini destekleyecek veri toplama izi olusmadi.
### Bundan Sonra:
- Chairman ratio coverage icin gerekli alt satirlari ayri `working_capital`, `liquidity`, `leverage`, `returns`, `cash_flow` bloklari halinde topla; downstream hesap beklemesin.
- Her veri paketi, birincil kaynak linki veya belge kimligi olmadan `ready` ilan edilmeyecek; mock, summary veya ic platform referansi veri kaynagi sayilmayacak.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Post-Report Feedback Loop
### Eksikler:
- Son 7 gun KAP filtre talebine ragmen veri toplama seti olay zincirini besleyecek dar pencereyi ayri manifestte vermedi.
- Telekom icin abone, ARPU, churn, capex guidance, spektrum ve enerji maliyeti gecislerini destekleyecek operasyonel ham veri paketi olusmadi.
### Bundan Sonra:
- Data collection her raporda `mandatory ratio inputs` ve `sector KPI inputs` diye iki ayri ham veri bolumu yayinlayacak; finansal ve operasyonel girdiler karismayacak.
- Mandate belirli bir pencere istiyorsa, genis arsiv ayri ek olabilir ama istenen pencere ayri authoritative output olarak zorunlu verilecek.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **D&A ve investing CF satırları eksik kaldı** — financial_analysis çıktısında depreciation_amortization null, investing_cash_flow null, CAPEX null, FCF null. Parse sorununa katkıda bulunmak için data_collection D&A satırını IS ve CF tablosunun her ikisinde de açıkça işaretlemiş olmak zorundaydı. THYAO gelir tablosunda "Amortisman ve itfa payları" + CF tablosunda "Maddi/maddi olmayan duran varlık alımları" satırları ayrı çekilmeli.
- **IFRS 16 ROU varlık ve kira borcu satırları ayrıştırılmadı** — Kural: THYAO bilanços unda finansal kiralama borçlarını ROU varlıklarından ayrı satırlara çek; Net Borç formülü `Finansal Borç + Finansal Kiralama Borcu − (Nakit + KV Finansal Yatırımlar)` şeklinde oluşturulabilsin. Ayrıştırılmadan canonical fact pack yayımlanmamalı.
- **FY2020-2023 IS/BS confidence 0.70-0.75 (tahmin bazlı)** — 14 Nisan THYAO raporundan aynı sorun; Standard raporda da 5 yıllık seri tam değil. Sadece FY2024-2025 doğrulanmış; FY2020-2023 gelir tablosu + bilanço KAP PDF'ten satır bazlı çekilmedi.
- **Yönetim içeriden işlem taraması eksik** — CEO değişimi (9 Nisan 2026) = yönetim işlemi taraması tetikleyicisi. KAP'ta yönetim alım/satım bildirimleri kontrol edilmedi. Kural: insider tarama her analizde zorunlu; CEO/YK değişimi ek tetikleyici.
- **Canonical fact pack FY2025 anahtar rakamları doğrulandı mı?** — THYAO 2025 gerçek benchmarklar (Hasilat 955.5B TRY, Net kar 118.2B TRY, EBITDAR marji %23.2, FCF $2.8B) memory'de var; data_collection bu değerleri KAP'tan bağımsız teyit etmeli ve canonical fact pack'te `source: KAP_audited` etiketiyle kilitlemeli.

### Bundan Sonra:
- **Havacılık D&A zorunlu çift satır** — (1) Sabit varlık amortismanı ve (2) IFRS 16 ROU varlık amortismanı ayrı kalemler. Her ikisi olmadan EBITDA bridge kurulamaz, EBITDAR hesaplanamaz. Eksikse parse_standardization'a "D&A: [VERİ EKSİK]" işaretiyle iletilemez — 5 adım protokolü çalıştır.
- **IFRS 16 kiralama detayı havacılıkta P0** — THYAO bilanços unda Uzun Vadeli Kiralama Borçları (UVKB) + Kısa Vadeli Kiralama Borçları (KVKB) ayrı satırda çekilmeden canonical fact pack yayımlanmayacak.
- **5 yıllık seri tamamlanmadan rapor başlatma** — FY2020-2023 için KAP XBRL + yıllık rapor PDF 5 adım protokolü; tamamlanmadan parse_standardization'a geçiş yok. Bu standart rapordan önce pre-flight kontrolüne eklendi.
- **CEO değişimi tarihinde zorunlu insider tarama** — Her YK/CEO değişimi = KAP pay bildirimi taraması tetiklenir. "Yönetim işlemi bulunamadı" sonucu bile kayıt altına alınmalı.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **Faaliyet Raporu 1561073 indirilmedi** — Solo bilanço, segment notları (IFRS 8) ve interest expense için birincil kaynak. İki tur boyunca "ESK-003 açık" olarak kaldı; bu eskalasyon çözüm değil, görevin taşınmasıdır. Rapor teslim edilmeden önce fetch edilmeliydi.
- **KAP 1383079 (13 Mart 2026) detayları çözümsüz kaldı** — "Orta materyallik" denilerek geçildi; bu kalemin içeriği hâlâ [VERİ YOK]. Canonical fact pack'te kapsamsız olay var = eksik teslimat.
- **Interest expense satır bazlı çekilmedi** — Faiz Karşılama Oranı için zorunlu. "TBD 1/21 (%4.8) — eşik altında" gerekçesiyle geçildi; eşik altında bile olmasa bu satır faiz karşılama hesabı için zorunlu.
- **FY2023 CF/SE tablosu seri kırığı devam etti** — FY2021/2022/2024/2025 var; FY2023 eksik. 5 yıllık seri = zorunlu kuralını ihlal.
- **WC kalem bazında kırılım downstream'e iletilmedi** — AR 240,073 mn TL çekildi ✓; stok ve ticari borç bireysel yıl kırılımları BS karşılaştırmasından tahmin bırakıldı (DISC-005). FY2024 AR "~185,000*" asteriskli; asterisksiz kaynak gerekiyor.

### Bundan Sonra:
- **Faaliyet raporu PDF = eskalasyon değil, görev** — Faaliyet raporu çekilemiyorsa fetch'i log göstererek CEO'ya raporla; sessizce "ESK" ile geçme. Çözüm gelmeden döngüyü kapatma.
- **Interest expense her holding raporunda zorunlu satır** — Faiz Karşılama Oranı (EBIT/Faiz) Chairman metrik listesinde; "eşik altında" gerekçesi veri çekmeme sebebi değil. Doğrudan çek, canonical fact pack'e koy.
- **KAP bildirimi çözümsüz kalırsa `unverified — upstream escalation açık` etiketiyle kayıt et** — "Orta materyallik" ile geçme; etiketle ve downstream'i uyar.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **D&A 4. THYAO analizinde hâlâ null** — depreciation_amortization: null; investing_cash_flow: null; capex: null; free_cash_flow: null. Tolerans sıfır direktifi 3 kez verildi; hâlâ çözülmedi.
- **IFRS 16 ROU varlık ve kira borcu satırları ayrıştırılmadı** — THYAO $25B+ kira yükümlülüğü; Net Borç formülü için zorunlu. Canonical fact pack bu iki satır olmadan yayımlanmamalı.
- **FY2020-2023 seri güven seviyesi düşük kaldı** — Tüm eski yıllar "low confidence" veya eksik; 5 yıllık seri zorunlu kuralı ihlal.
- **CEO/YK değişimi sonrası insider tarama yapılmadı** — Ahmet Olmüster atanması (9 Nisan) = KAP pay bildirimi taraması tetikleyicisi; taranmadı.
- **Aylık trafik KPI bildirimleri (KAP) çekilmedi** — RPK/ASK/LF aylık KAP bildirimleri veri koleksiyonuna dahil edilmedi.

### Bundan Sonra:
- **D&A = upstream'den sıfır tolerans (4. direktif, artık hard bloker)** — CF tablosu "Amortisman ve İtfa" satırı; dipnot 11-12; IFRS 16 ROU amortismanı. Üçü olmadan canonical fact pack yayımlanmaz. Null → parse_standardization'a geçiş YOK.
- **Aylık trafik KPI bildirimleri THYAO manifest'ine ekle** — Her analizde son 3 aylık trafik bildirimi (RPK/ASK/LF) KAP ID + URL ile.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **D&A hâlâ çekilmedi — downstream EBITDA null zinciri** — EBITDA = EBIT + D&A; D&A sağlanmadığı için parse → financial_analysis → valuation zinciri tamamen kırıldı. Bu 3. THYAO analizinde aynı hata.
- **IFRS 16 ROU varlık amortismanı ayrıştırılmadı** — Havacılık EBITDAR hesabı için IFRS 16 kira gideri ve ROU amortismanı ayrı satır olarak gelmeli. "IFRS 16 P0 direktifi" 3 analizdir yerine getirilmedi.
- **FY2020–2023 seri güven seviyesi düşük kaldı** — 5 yıllık seri zorunlu kuralı var; ancak eski yılların verileri "low confidence" olarak işaretlendi ve tamamlanmadı. parse_standardization'a geçilmeden önce bunlar tamamlanmalıydı.
- **CEO/YK değişimi sonrası insider pay taraması yapılmadı** — Ahmet Olmüster atanması (9 Nisan) tetikleyiciydi. KAP pay bildirimi taraması = zorunlu; "bulunamadı" sonucu bile kayıt altına alınmalı.
- **THYAO bağlı ortaklık trafik verisi KAP bildirimleri çekilmedi** — Aylık trafik KPI (RPK/ASK/LF) KAP bildirimleri veri koleksiyonuna dahil edilmedi; context_extraction ve financial_analysis bu veriyi göremedi.

### Bundan Sonra:
- **D&A THYAO için birincil kaynak zinciri (P0 — 3. direktif, artık tolerans sıfır):**
  1. KAP yıllık rapor → Nakit Akış Tablosu "Amortisman ve İtfa" satırı
  2. Dipnot 11-12 (maddi/maddi olmayan varlıklar)
  3. IFRS 16: "Kullanım Hakkı Varlığı Amortismanı" ayrı satır (dipnot)
  D&A null → CF tablosu parse edilmeden output YOK.
- **IFRS 16 kira ayrıştırması zorunlu iki satır:** (1) Sabit varlık amortismanı, (2) ROU varlık amortismanı (IFRS 16). Her ikisi olmadan canonical fact pack yayımlanmaz.
- **5 yıllık seri tamamlanmadan geçiş yok** — FY2020-2023 low confidence ise pre-flight: tüm yılları KAP XBRL + PDF 5 adım protokolüyle tamamla, sonra parse_standardization'a gönder.
- **CEO/YK değişimi insider tarama otomatik tetiklenir** — Değişim tarihinden ±7 gün KAP pay bildirimleri: ad/soyad ile aranan yöneticiler. Sonuç: pozitif bulgu veya "tarandı — bulunamadı" kaydı.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **D&A bu analizde de null — 4. THYAO direktifi, artık tolerans SIFIR** — depreciation_amortization: null; investing_cash_flow: null; capex: null; free_cash_flow: null. EBITDA null zinciri tüm pipeline'ı kırdı. Kök neden: D&A upstream'den çekilmeden parse'a gönderildi.
- **IFRS 16 ROU amortismanı ayrıştırılmadı** — THYAO +$25B kira yükümlülüğü; EBITDAR hesabı için zorunlu. Bu direktif 4 THYAO analizinde uygulanmadı.
- **FY2020–2023 seri güven seviyesi düşük kalmaya devam ediyor** — 5 yıllık seri zorunlu kuralı var; eski yıllar "low confidence" kalıyor. KAP XBRL + PDF protokolü çalıştırılmadı.
- **CEO/YK değişimi (9 Nisan 2026) sonrası insider tarama yapılmadı** — KAP pay bildirimi taraması zorunlu; 4 THYAO'da da uygulanmadı.
- **Aylık trafik KPI bildirimleri (RPK/ASK/LF) manifest'e dahil edilmedi** — THYAO için kritik operasyonel veri; context_extraction ve financial_analysis bu veriyi göremedi.
- **Yönetim Kurulu Raporu (THYAO_Yonetim_Kurulu_Raporu_20260416.pdf) okunmadı** — CEO mandate'de "ÖNCE OKU" direktifi vardı; bu kaynak manifest'te yer almıyor.

### Bundan Sonra:
- **D&A = upstream'den HARD BLOKER (4. direktif, tolerans sıfır aşıldı)** — D&A null → parse_standardization'a geçiş YOK. Tüm yollar tüketilmeli: (1) CF "Amortisman ve İtfa" satırı, (2) Dipnot 11-12, (3) IFRS 16 ROU amortismanı ayrı satır. Üçü başarısız → CEO eskalasyonu + pipeline durdurulur.
- **YK Raporu THYAO analizinde ilk fetch görevi** — THYAO_Yonetim_Kurulu_Raporu manifest'in 1. sırasında yer alacak; finansal tablo PDF'lerinden önce okunacak.
- **Trafik KPI bildirimleri THYAO zorunlu manifest kalemi** — Son 3 aylık KAP trafik bildirimleri (RPK/ASK/LF) KAP ID + URL ile; manifest tamamlanmadan çıktı gönderilmez.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **D&A bu analizde de null — 5. THYAO direktifi, tolerans tamamen tükendi** — depreciation_amortization: null; investing_cash_flow: null; capex: null; free_cash_flow: null. Kök neden: CF "Amortisman ve İtfa" satırı 5 THYAO analizinde çekilemedi.
- **IFRS 16 ROU varlık amortismanı ayrıştırılmadı — 5. THYAO** — THYAO $25B+ kira yükümlülüğü; EBITDAR için zorunlu 2 satır 5 analizdir gelmedi.
- **5 yıllık seri tamamlanmadan parse'a geçildi** — FY2020-2023 "low confidence" olarak geçirildi; KAP XBRL + PDF protokolü çalıştırılmadı.
- **CEO/YK değişimi insider pay taraması yapılmadı — 5. THYAO** — Ahmet Olmüster (9 Nisan 2026) atanmasından bu yana 5 analizdir KAP pay bildirimi taraması yapılmadı.
- **Aylık trafik KPI bildirimleri (RPK/ASK/LF) manifest'e dahil edilmedi** — financial_analysis ve context_extraction bu veriyi göremedi.
- **YK Raporu manifest'in 1. sırasında yer almadı** — CEO direktifi: YK Raporu önce okunur. Bu sefer de finansal tablo PDF'lerinden önce gelmedi.

### Bundan Sonra:
- **D&A = 5. direktif, hard bloker — tolerans sıfır aşıldı** — D&A null → parse'a geçiş YOK. Kaynak zinciri tüketilecek: (1) CF "Amortisman ve İtfa", (2) Dipnot 11-12, (3) IFRS 16 ROU amortismanı dipnot. Üçü başarısız → CEO eskalasyonu + pipeline dur.
- **5 yıllık seri tamamlanma önkoşulu** — FY2020-2023 low confidence ise KAP XBRL + PDF protokolü çalıştır; tamamlanmadan parse'a geçme.
- **CEO/YK değişimi → insider tarama otomatik tetiklenir** — Değişim tarihinden ±7 gün KAP pay bildirimleri; pozitif bulgu veya "tarandı — bulunamadı" kaydı zorunlu.

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **Yalnızca FY2025 verisi toplandı — 5 yıllık seri yok** — FY2021-2024 IS/BS/CF toplam dışı bırakıldı. Deep dive kuralı: FY-4 to FY0 tam finansal tablolar zorunlu. ASELS 5 yıllık trend (ciro büyümesi, borç profili, backlog/revenue) analiz edilemedi.
- **YK Raporu (Yönetim Kurulu Raporu) toplanmadı** — ASELS savunma şirketi; ihracat kısıtlamaları, sözleşme pipeline'ı, AR-GE harcamaları YK Raporunda açıklanır. Manifest'te yer almıyor.
- **Canonical fact pack yayımlanmadı** — Downstream ajanlara tek onaylı fact pack verilmedi; trade_payables = "24,432,000 TL" (180B+ TL ciro karşısında şüpheli düşük) çözümsüz geçti. DISC-004 benzeri yeni bir hata riski.
- **Savunma sektörü KPI verileri toplanmadı** — Sipariş defteri (backlog), AR-GE harcamaları, ihracat/iç satış oranı, TSKGV sözleşme miktarları — bunlar savunma analizinin temel KPI'ları; hiçbiri manifest'te yer almıyor.
- **İçeriden işlem taraması yapılmadı** — KAP yönetim işlemleri taraması zorunlu kuralına rağmen çıktıda yer yok. ASELS için TSKGV/yönetim alım-satım takibi özellikle kritik.
- **IAS 29 ön kontrolü belgesi eksik** — ASELS cumulative TÜFE >%100 koşulunu karşılıyor; IAS 29 parasal kazanç/kayıp satırının KAP'tan extract edildiğine dair kanıt yok.

### Bundan Sonra:
- **Savunma sektörü ek manifest kalemleri ZORUNLU:** (1) Sipariş defteri (backlog), (2) AR-GE harcamaları (Not), (3) İhracat gelirleri ayrımı, (4) TSKGV/SSB sözleşme duyuruları, (5) YK Raporu. Bu 5 kalem savunma şirketlerinde her analizde toplanacak.
- **Trade_payables için DISC-004 protokolü savunma şirketlerine de uygula** — BS özet satırı ile ilgili dipnot (ticari borçlar ayrımı) karşılaştır. Fark >%20 → FLAG_DISC + eskalasyon + doğru değeri kilitle.
- **5 yıllık seri tamamlanmadan parse'a geçiş YOK** — FY2021-2024 verileri KAP XBRL + PDF 5 adım protokolüyle tamamlanacak; eksik yıllarla canonical fact pack yayımlanmayacak.
