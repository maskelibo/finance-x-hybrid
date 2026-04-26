# External Research — memory.md

## Kurallar (permanent)

- **U5'te scaffold stub** — findings: [], status: "scaffold_stub".
- **U7'de açılacak:** backend/src/deep-research/ orkestratörü web search entegrasyonu.
- scope_queries research_brief'ten gelir; ekleme yapma.
- Tam implementasyonda her query için en az 3 kaynak, publisher credibility scoring.

## U7 hedefleri

Bu bölüm U7 başlarken dolar. U5'te boş.

## Publisher–Topic Eşleşmeleri (öğrenimler)

| Topic | Primary Publisher | Güven |
|---|---|---|
| CBAM regülasyon | European Commission (taxation-customs.ec.europa.eu) | HIGH |
| CBAM sertifika fiyatı | EC quarterly announcement — doğrudan EC sayfasından al | HIGH |
| HRC Avrupa fiyatı | Fastmarkets (fastmarkets.com) | HIGH |
| HRC Türkiye ithalat | SteelOrbis (steelorbis.com) — paywall | MEDIUM |
| EU anti-dumping kararları | EC Trade (policy.trade.ec.europa.eu) | HIGH |
| EU steel safeguard + trade data | Eurometal (eurometal.net) | HIGH |
| CBAM benchmark / sertifika fiyat duyurusu | S&P Global Energy + EUROMETAL + EC | HIGH |
| EREGL üretim/ihracat istatistiği | gmk.center/en (GMK Center, Ukrayna çelik ajansı) | MEDIUM-HIGH |
| Western Europe HRC (SteelBenchmarker) | steelbenchmarker.com — PDF, WebFetch binary hata; haber yansıması kullan | MEDIUM-HIGH |
| Çin overcapacity | S&P Global Commodity Insights | HIGH |
| EPDK tarife kararları | Anadolu Ajansı (aa.com.tr) | HIGH |
| TCMB politika faizi | Bigpara / multiple TR news (TCMB.gov.tr JS render engeli var) | MEDIUM-HIGH |
| USD/TRY kur | Bigpara / BloombergHT (TCMB.gov.tr JS engeli) | MEDIUM-HIGH |

## Teknik Notlar

- **TCMB.gov.tr** kur sayfası JS render ile çalışıyor — WebFetch tablo içeriğini alamaz. Haber kaynaklarını kullan.
- **SteelOrbis / Fastmarkets / MEPS** tam fiyat serileri paywall arkasında; yalnızca açık kaynak parçalar erişilebilir.
- **EC CBAM** sertifika fiyatı quarterly açıklanıyor — taxation-customs.ec.europa.eu/cbam sayfasını izle.
- **AB Safeguard** yeni rejim 1 Temmuz 2026'dan geçerli; Türkiye kota konumu belirsiz.

## Publisher–Topic Eşleşmeleri — Retail Sektörü (24 Nisan 2026 BIMAS run öğrenimi)

| Topic | Primary Publisher | Güven |
|---|---|---|
| Türk gıda perakende pazar payı | Perakende Mühendisi (perakendemuhendisi.com) | MEDIUM-HIGH |
| BIMAS finansal sonuçlar haberi | Finansopia (finansopia.com) — KAP tabanlı Türkçe özet | HIGH |
| BIMAS yatırımcı sunumları | bim.com.tr/YatirimciSunumlari/ — PDF (WebFetch binary hata verir) | HIGH (ama binary) |
| BIMAS/MGROS gelir tablosu | Investing.com gelir tablosu sayfası | MEDIUM-HIGH |
| Türk perakende ciro karşılaştırma | BorsaninGündemi / Yatirimx | MEDIUM |
| Türkiye gıda enflasyonu | TÜİK data.tuik.gov.tr, Bianet, IntelliNews | HIGH |
| Tüketici güven endeksi | TradingEconomics (TÜİK tabanlı) tr.tradingeconomics.com | HIGH |
| BIMAS analist raporu (Türk) | Şeker Yatırım PDF (binary engel var) | HIGH (ama binary) |

## Teknik Notlar — Retail Eklentisi

- **bim.com.tr PDF sunumları** (YatirimciSunumlari, DonemselFinansalSonuclar): WebFetch binary hata veriyor. Haber kaynaklarından özetle.
- **Şeker/Garanti/GCM PDF analist raporları**: Binary. Haber yansımaları veya Quartr/TradingView özetleri kullan.
- **IAS29 parasal kazanç/kayıp + DPO/NWC**: External kaynaklarda yok. Bunlar structurally RAG/KAP-only metrikler.
- **SSSG fiyat/hacim ayrıştırması**: Q3 sunumlarında var; tam yıl SSSG investor call transcript'te (Quartr üzeri erişilebilir).

## Publisher–Topic Eşleşmeleri — Havacılık Sektörü (24 Nisan 2026 THYAO run öğrenimi)

| Topic | Primary Publisher | Güven |
|---|---|---|
| Jet yakıt spot fiyatı (güncel) | IATA Fuel Monitor (iata.org/fuel-monitor) — Platts/S&P Global verisi | HIGH |
| Jet yakıt outlook/forecast | EIA STEO (eia.gov/outlooks/steo/) — aylık güncelleme | HIGH |
| Global airline load factor + net margin | IATA Pressroom (iata.org/pressroom/) | HIGH |
| Global airline EBITDAR margin | IATA June/December outlook PDF (WebFetch binary engel var — haber yansıması kullan) | HIGH |
| THYAO trafik istatistikleri (RPK/ASK/pax) | TTR Weekly (ttrweekly.com) veya ts2.tech | MEDIUM-HIGH |
| THYAO filo büyüklüğü haberleri | Anadolu Ajansı (aa.com.tr) | HIGH |
| THYAO filo/rota stratejik haber | Simple Flying (simpleflying.com), MightyTravels | MEDIUM |
| THYAO yatırımcı sunumu PDF | investor.turkishairlines.com — WebFetch binary hata | HIGH (ama binary) |
| USD/TRY + EUR/USD projeksiyonu | Trading Economics (tradingeconomics.com) | HIGH |
| Havacılık sektörü analist raporu | Aviation Week Network — PAYWALL/redirect, kullanma | BLOCKED |

## Teknik Notlar — Havacılık Eklentisi

- **investor.turkishairlines.com PDF sunumları**: Binary hata veriyor. Haber kaynakları veya fintables.com KAP eklentilerinden özetle.
- **Aviation Week Network**: Login redirect — paywall arkasında, WebFetch çalışmaz.
- **IATA fact sheet PDF'leri**: Binary hata veriyor. iata.org/pressroom HTML sayfa haber yansımaları kullan.
- **EIA STEO jet fuel forecast**: eia.gov/outlooks/steo/report/petro_prod.php — HTML erişilebilir.
- **Jet yakıt fiyat volatilitesi 2026**: Nisan 2026'da Hürmüz Boğazı geopolitik krizi sebebiyle $2.50/gal → $4.88/gal sıçrama yaşandı; IATA baz senaryo $88/bbl (pre-kriz) ile güncel $184/bbl arasında ciddi fark var.

## Publisher–Topic Eşleşmeleri — Dayanıklı Tüketim / Beyaz Eşya Sektörü (24 Nisan 2026 ARCLK run öğrenimi)

| Topic | Primary Publisher | Güven |
|---|---|---|
| Avrupa beyaz eşya pazar büyümesi (hacim/değer) | NIQ NielsenIQ — Home Appliances Outlook 2026 Western Europe | HIGH |
| Avrupa beyaz eşya pazar büyümesi (uzun vadeli) | MarketResearchFuture / Fortune Business Insights / Mordor Intelligence | MEDIUM |
| Electrolux yıllık finansal sonuçlar | electroluxgroup.com (Yıl Sonu Raporu Q4) + PR Newswire yansıması | HIGH |
| Electrolux EBITDA (sayısal) | investing.com financial-summary sayfası (ELUX-B.ST) | MEDIUM-HIGH |
| Whirlpool yıllık finansal sonuçlar | whirlpool.mediaroom.com (resmi press release) | HIGH |
| Whirlpool EBITDA margin tarihsel | macrotrends.net WHR EBITDA — 402 engel; StockStory/DCFmodeling kullan | MEDIUM |
| Peer EBITDA karşılaştırması (WHR/ELUX) | Investing.com + StockStory.org | MEDIUM-HIGH |
| CBAM beyaz eşya doğrudan kapsamı (2028) | EC December 17, 2025 downstream extension proposal | HIGH |
| CBAM sertifika fiyat duyurusu | S&P Global Energy + Alcircle + EC taxation-customs.ec.europa.eu | HIGH |

## Teknik Notlar — Dayanıklı Tüketim / Beyaz Eşya Eklentisi

- **electroluxgroup.com** net-debt sayfası (net-debt-359/) timeout veriyor; Net Borç = Net Borç/EBITDA × EBITDA hesapla (EBITDA'yı investing.com'dan al).
- **macrotrends.net WHR EBITDA sayfası**: 402 Payment Required hatası. StockStory.org veya DCFmodeling.com kullan.
- **Beyaz eşya CBAM maruziyeti — iki katman:**
  - Katman 1 (2026 cari): Dolaylı — beyaz eşya içindeki çelik/alüminyum girdileri CBAM'a tabi; üretici (ör. ARCLK) değil, AB'deki ithalatçı ödüyor.
  - Katman 2 (2028 planlı): Doğrudan — ~180 downstream ürün kapsamına household appliances dahil; ARCLK AB ihracatı doğrudan etkilenecek.
- **CBAM Q1 2026 sertifika fiyatı: €75.36/tCO₂e** (EC, 7 Nisan 2026 açıklaması; ETS Ocak-Mart 2026 ağırlıklı ortalama).
- **Avrupa MDA (Major Domestic Appliances) 2026 büyüme:** +1.5% değer, +0.8% hacim (NIQ WE Outlook 2026).
- **NIQ Western Europe Home Appliances Outlook 2026**: nielseniq.com en güvenilir Avrupa beyaz eşya kaynak; paginated HTML erişilebilir.

## Publisher–Topic Eşleşmeleri — Holding Sektörü (24 Nisan 2026 KCHOL run öğrenimi)

| Topic | Primary Publisher | Güven |
|---|---|---|
| KCHOL/ARCLK sahiplik değişikliği (KAP) | Rota Borsa (rotaborsa.com) — KAP duyuru yansıması | HIGH |
| KCHOL/ARCLK hisse devri haberi | BloombergHT (bloomberght.com) | HIGH |
| ARCLK Hitachi JV exit | Paratic (paratic.com) + Finansopia (finansopia.com) | HIGH |
| TUPRS rafinaj marjı (aylık + yıllık) | Paraanaliz (paraanaliz.com) — Gedik rapor yansıması | HIGH |
| TUPRS crack spreads (aylık) | Piapiri (piapiri.com) — aylık breakdown | MEDIUM-HIGH |
| TUPRS Fitch/Moody's rating + finansallar | PA Turkey (paturkey.com) | HIGH |
| TUPRS Nelson Complexity Index | Moody's PDF (tupras.com.tr) + paturkey.com | HIGH |
| Holding NAV indirimi peer benchmark | Paraajansi (paraajansi.com.tr) — Gedik + Şeker rapor özeti | MEDIUM-HIGH |
| SAHOL NAV iskonto senaryoları | Halka Arz Merkezi (halkaarzmerkezi.com) | MEDIUM |
| Teknik Piyasa KCHOL analizi | teknikpiyasa.com.tr — kapsamlı temel analiz | MEDIUM |

## Teknik Notlar — Holding Eklentisi

- **Gedik PDF analist raporları** (cdn.gedik.com): Binary hata veriyor. Paraajansi / Teknik Piyasa haber yansımalarını kullan.
- **KCHOL NAV discount**: ~33% (tüm iştiraklere göre) / ~26% (yalnızca borsada işlem görenler) — Gedik Mart 2025 referans.
- **ARCLK sahiplik yapısı**: KCHOL direkt %48.5 (Aralık 2025 sonrası); Koç Grubu toplamı (VKV dahil) ~%53; free float %17.6.
- **TUPRS Nelson Complexity**: İzmit rafinerisi 14.5 NCI (EMEA'da üst segment); şirket ağırlıklı ortalama 9.5 NCI.
- **ARCLK Hitachi JV (güncel durum — 25 Nisan 2026)**: Arçelik, 21 Nisan 2026'da anlaşma İMZALADI (KAP bildirimi + Bloomberg teyit). KAPANMADI — kapanış anlaşma imzasını takip eden 12 ay içinde bekleniyor. $261M ($205M peşin + $56M 3 yıl taksit). KCHOL'un ARCLK'taki doğrudan payı (%48.5) bu işlemden etkilenmiyor; ARCLK'ın kendi AHHA payını satıyor.

## Türk Banka P/BV Verileri (güncellendi: 25 Nisan 2026)

| Banka | P/BV (spot) | GS Tavsiye | GS Hedef |
|---|---|---|---|
| YKBNK | 1.24x | Buy | 53 TL |
| GARAN | 1.29x | Neutral | 173 TL |
| ISCTR | 0.96x | Buy (upgraded) | 21 TL |

- Sektör ortalama 12M fwd P/BV: **1.05x** (Goldman Sachs, Nisan 2026)
- GS baz senaryo hedef P/BV: **1.2x** (2027E implied 0.8x → yeniden fiyatlama potansiyeli)
- ROE guidance: yüksek 20'ler (high-20s%) 2027E'ye kadar
- Kaynak: PA Turkey (paturkey.com) — GS rapor yansıması; uzmanpara.milliyet.com.tr — spot P/BV

### YKBNK Q4 2025 Sonuçları (Nisan 2026 güncel)
- **GCM (5 Şub 2026):** Hedef 48 TL; P/BV 1.31x; P/E 7.09 (sektör 7.72); ROE %20; NPL %3.67; CAR %14.8
- **İş Yatırım (6 Şub 2026):** Hedef 52 TL (45 TL'den), AL; Q4 solo net kar 9.3B TL; FY2025 ROE %21; 2026E ROE "yüksek 20'ler"; NIM Q4 %2.8, 2026'da +100bp iyileşme bekleniyor
- **Analist hedef aralığı (Nisan 2026):** BofA 72 TL; Garanti BBVA 68 TL; Ak Yatırım 75 TL; TEB 70 TL; GCM 48 TL; İş Yatırım 52 TL
- **Not:** GCM'in 48 TL vs BofA/Ak'ın 68-75 TL farkı: GCM muhafazakâr P/BV (1.31x), büyük yabancı kurumlar daha yüksek ROE rerating beklentisiyle 1.5x+ P/BV kullanıyor olabilir.

## TUPRS Rafinaj Marjı Verileri (güncellendi: 25 Nisan 2026)

- **FY2025 NRM rehberi (revize):** $6.0–6.5/bbl (Q3 sonrası yükseltildi; önceki $5.0–6.0/bbl)
- **Q3 2025 gerçekleşen NRM:** $9.7/bbl (Morgan Stanley tahmini +%20.7 üstü)
- **Q3 2025 EBITDA:** $544M
- **FY2025 EBITDA (Fitch):** ~$1.4B (FY2024 ~$2.1B'dan düşüş — sıkışan marjlar)
- **2026 NRM (İş Yatırım, 9 Nisan 2026 — YENİ):** **10.5 USD/bbl** (6.5'ten yukarı revize; yapısal 0.25 USD/bbl uzun vadeli artış)
- **2026 EBITDA (İş Yatırım):** $2.4B (+%51 YoY); Net kar $1.3B (+%79)
- **2026 EV/EBITDA:** 3.8x — Avrupa benzer şirketlerine göre %28 iskonto
- **İş Yatırım target (9 Nisan 2026):** 338 TL (önceki 250 TL'den), AL
- **Tacirler target (Nisan 2026):** 352 TL (271 TL'den), AL
- **Net cash (Q3 2025):** $1.77B
- Kaynak: arastirma.isyatirim.com.tr (9 Apr 2026), Investing.com, PA Turkey / Fitch

## Global Konglomera NAV İndirim Benchmark (24 Nisan 2026)

| Bölge | NAV İndirim Aralığı | Not |
|---|---|---|
| Kore (chaebol) | %30–60 | Kural: %30–40 |
| Gelişmiş piyasalar (ABD/BA) | %15–30 | — |
| Güneydoğu Asya | Önemli indirim | Pure-play underperform |
| Japonya/Latin Amerika | Premium mümkün | Farklı yapı |
| EM genel (Kopernik Şub 2025) | >%50 (birçok isim) | Book'un yarısı |
| Türkiye sektör standardı | %15–35 | SAHOL/KCHOL/TAVHL |
| KCHOL (Gedik Mart 2025) | %33 (tüm iştir.) / %26 (listeliler) | — |

## Publisher–Topic Eşleşmeleri — Holding Eklentisi 2 (24 Nisan 2026 KCHOL 2. run)

| Topic | Primary Publisher | Güven |
|---|---|---|
| KCHOL analist konsensüs hedef fiyat (çok kurum) | Rota Borsa (rotaborsa.com) — 13 kurum aggregate | MEDIUM-HIGH |
| GCM Yatırım SOTP/NAV analizi | gcmyatirim.com.tr özel raporlar — WebFetch çalışır | HIGH |
| Türk holding NAV iskonto senaryoları | Halka Arz Merkezi (halkaarzmerkezi.com) | MEDIUM |
| Global rafineri marjı + crack spread | EIA STEO (eia.gov/outlooks/steo/archives/apr26.pdf) | HIGH |
| Crack spread monthly breakdown | Kpler (kpler.com/blog) — açık blog yazıları | HIGH |
| Avrupa dizel crack spread | OPIS (opis.com/resources) | HIGH |
| FROTO ihracat/üretim rehberi | A1 Capital PDF — WebFetch binary hata; haber yansıması kullan | HIGH (ama binary) |
| TOASO 2026 üretim + ihracat rehberi | İş Yatırım raporları (arastirma.isyatirim.com.tr) | HIGH |
| fintables.com/KCHOL analist sayfası | fintables.com — 403 engeli WebFetch'te; WebSearch üzerinden sorgula | BLOCKED |

## Teknik Notlar — Holding Eklentisi 2

- **GCM Yatırım KCHOL Feb 12, 2026 raporu**: NAV/hisse (iskontosuz) = **406.07 TL**; hedef fiyat = **299.05 TL** (SOTP %60 + multiples %40); SOTP = 229.75 TL (43% iskonto uygulandı); multiples-based = 403 TL.
- **KCHOL konsensüs (Nisan 2026)**: Ortalama ~298-304 TL; min ~260 TL; maks ~373 TL (Ziraat revizyon sonrası 336.50 TL, Ata 323.30 TL).
- **Türk holding NAV iskonto bandı** (Halka Arz Merkezi, halkaarzmerkezi.com): Bull %20, Base %25–30, Bear %35–40.
- **GCM iskonto KCHOL'a**: %43 — tarihsel ortalamanın üst kısmı (tarihsel: %15–40).
- **FROTO 2026 rehberi**: Türkiye 390K–420K birim ihracat; Romanya 190K–210K birim; toplam toptan satış 670K–730K birim; yüksek tek haneli gelir büyümesi; EBITDA marjı %7–8.
- **TOASO 2026 rehberi**: 65K–75K birim ihracat (K0 modeli); toplam üretim 140K–150K birim; net satış ~523B TRY.

## Önemli Makro Referans (23 Nisan 2026 itibarıyla)

- TCMB politika faizi: **%37** (22 Nisan 2026, değişmedi; gecelik borç verme %40, borçlanma %35.5)
- USD/TRY: **44,9773** (23 Nisan) → **45,0320** (24 Nisan sabah kuru)
- EPDK sanayi elektrik: **+%5,8** | sanayi doğalgaz: **+%18,61** (4 Nisan 2026 yürürlük)
- EU HRC (K. Avrupa exw): **€719/t** (14 Nisan 2026, Fastmarkets)
- US HRC: **$1.075–1.100/t** (16 Nisan 2026)
- CBAM yürürlük: **1 Ocak 2026** | Q1 sertifika fiyatı: **€75.36/tCO₂e** (8 Nisan 2026, EC resmi)
- CBAM Phase-In tablosu: 2026=%2.5, 2027=%5, 2028=%10, 2030=~%48.5, 2034=%100 (free alloc: 97.5→95→90→51.5→0)
- CBAM BF-BOF HRC benchmark (finalized): **1.370 tCO₂e/t** (10 Aralık 2025, EC/EUROMETAL)
- EREGL FY2025 ihracat: **1.53 Mt flat** (34 ülkeye, toplam satışların %20'si)
- EREGL FY2024 ihracat: **~1.18-1.24 Mt flat** (9M: 1.196 Mt, H1: 738k ton, oran %18.8)
- Türkiye→AB HRC 2024: **1.21 Mt** (+%85.4 YoY) — tüm TR üreticiler; EREGL dominant flat producer
- SteelBenchmarker Western Europe HRC: **$840/t** (13 Nisan 2026) — PDF WebFetch çalışmaz, haber kaynakları kullan
- EUROMETAL (eurometal.net): EU steel trade verileri + CBAM benchmark duyuruları için HIGH credibility
- S&P Global Energy (spglobal.com/energy): CBAM sertifika fiyat duyurusu için HIGH credibility
