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
| EU steel safeguard | Eurometal / EUROFER | MEDIUM-HIGH |
| Çin overcapacity | S&P Global Commodity Insights | HIGH |
| EPDK tarife kararları | Anadolu Ajansı (aa.com.tr) | HIGH |
| TCMB politika faizi | Bigpara / multiple TR news (TCMB.gov.tr JS render engeli var) | MEDIUM-HIGH |
| USD/TRY kur | Bigpara / BloombergHT (TCMB.gov.tr JS engeli) | MEDIUM-HIGH |

## Teknik Notlar

- **TCMB.gov.tr** kur sayfası JS render ile çalışıyor — WebFetch tablo içeriğini alamaz. Haber kaynaklarını kullan.
- **SteelOrbis / Fastmarkets / MEPS** tam fiyat serileri paywall arkasında; yalnızca açık kaynak parçalar erişilebilir.
- **EC CBAM** sertifika fiyatı quarterly açıklanıyor — taxation-customs.ec.europa.eu/cbam sayfasını izle.
- **AB Safeguard** yeni rejim 1 Temmuz 2026'dan geçerli; Türkiye kota konumu belirsiz.

## Önemli Makro Referans (23 Nisan 2026 itibarıyla)

- TCMB politika faizi: **%37** (22 Nisan 2026, değişmedi)
- USD/TRY: **~44,90** (22 Nisan 2026)
- EPDK sanayi elektrik: **+%5,8** | sanayi doğalgaz: **+%18,61** (4 Nisan 2026 yürürlük)
- EU HRC (K. Avrupa exw): **€719/t** (14 Nisan 2026, Fastmarkets)
- US HRC: **$1.075–1.100/t** (16 Nisan 2026)
- CBAM yürürlük: **1 Ocak 2026** | Q1 sertifika fiyatı: **~€75/tCO₂e**
