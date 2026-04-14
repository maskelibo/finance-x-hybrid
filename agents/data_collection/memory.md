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
