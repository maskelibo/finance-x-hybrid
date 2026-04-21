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

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
