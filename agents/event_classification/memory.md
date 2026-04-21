# Event Classification Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **Full event coverage ZORUNLU:** KAP Watch'tan gelen HER disclosure classify edilmeli — truncation YASAK. "Classified edilmemis disclosure" kabul edilmez.
- **Her classified event icin TAM JSON output** — yarim JSON YASAK. Summary table'da kac event varsa HEPSININ detayli classification'i olmali.
- **Truncation prevention:** 10+ olay icin output siniri asilirsa → ozet tablo + detay JSON formati kullan. Yarim cikti gondermek YASAK.
- **Quantitative impact HER event icin:**
  - Cash impact: Inflow/Outflow X TRY
  - P&L impact: EBITDA +/- Y TRY, Net income +/- Z TRY
  - Balance sheet impact: Equity +/- A TRY, Debt +/- B TRY
  - % of equity, % of market cap, % of annual EBITDA
  - FX conversion (USD/EUR → TRY at disclosure date rate)
  - Rakam yoksa industry benchmark kullan, estimate yap
- **Multi-event scenarios analiz et:** Ayni donemde birden fazla event olunca birbirlerini nasil etkiler? Cross-event interaction + net consolidated impact.
- **Zaman damgasi oncelik siralamasi:** Son 30 gun = "AKTIF", 30-180 gun = "GECMIS-GECERLI", 180+ gun = "ARSIV".
- **AGM/Genel Kurul icin sub-event listesi:** Gundemde birden fazla materyal karar varsa her karari ayri olay olarak siniflandir.
- **"macro_event" kategorisi ZORUNLU:** EPDK, BOTAS, TCMB kararlari, Hurmuz krizi gibi sektor etkileyen makro olaylar KAP bildirimi olmasa da siniflandirilir.
- **Her event'te gercek bildirim URL'si ve mumkunse bildirim numarasi ZORUNLU.**
- **Rakam iceren event'leri authoritative source ile capraz kontrol etmeden miktar yazma.**
- **Primary kaynak yoksa placeholder event uretme; `unclassified_due_to_missing_primary_source` de.**
- **`primary_type` yaninda kisa downstream muhasebe etkisi notu ver.**

## Zorunlu Kontrol Listesi

**Taxonomy:**
- `debt_issuance` — tahvil/eurobond ihrac, kredi anlasmasi
- `dividend_buyback` — temettu bildirimi, hisse geri alim
- `management_change` — YK baskan/CEO degisikligi (routine=MEDIUM, unexpected=HIGH)
- `production_halt` — uretim durusu/yeniden baslatma
- `capex_decision` — fabrika transferi/yatirim karari
- `routine_filing` — finansal raporlar, governance form guncellemeleri
- `corporate_governance` — denetci secimi, komite atamalari
- `macro_event` — EPDK, BOTAS, TCMB, jeopolitik
- `macro_regulatory_event` — EPDK/BOTAS tarife kararlari
- `trade_regulatory_event` — AB Safeguard, CBAM, anti-dumping
- `commodity_market_event` — HRC, demir cevheri, kok komuru fiyat soklari

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK Event #1 JSON yarim kaldi, Events 2-5 detaylari TAMAMEN EKSIK
- AKBNK cross-event impact analizi eksik (AT1 bond + covered bonds + dividend uclusu)
- SISE 16 disclosure'dan sadece 10'u classify edildi, Eurobond discrepancy arastirilmadi
- TCELL Events 3-5 classification TAMAMEN EKSIK (truncated)
- TUPRS makro olaylar (Hurmuz, TCMB faiz) siniflandirilmadi
- EREGL cikti truncated — sadece 2 olay gorundu, 10 olaydan
- EREGL EPDK karari ve AB Safeguard siniflandirilmadigi belirsiz
- Bazi event'lerde `kap_url` yalniz ana sayfa seviyesinde kaldi

## Son 3 Raporun Ogrenimleri

- **EREGL (2026-04-13):** Celik icin 5 zorunlu kategori: kap_material_disclosure, macro_regulatory_event, trade_regulatory_event, commodity_market_event, corporate_action. Reserve/drilling updates net karar yoksa `unclassified`. Audit firm secimi = corporate_governance (operasyonel event degil).
- **TUPRS (2026-04-12):** Makro olaylar (Hurmuz, TCMB) KAP bildirimi olmasa da siniflandirilmali. AGM alt-olaylari ayri siniflandirilmali. 12 ay vs 30 gun kapsam ayrimi zorunlu.
- **TCELL (2026-04-11):** Telekom event types eklendi (spectrum_acquisition, network_rollout, regulatory_compliance). Amortization/depreciation impact hesaplanmali.

## Sektor Bilgi Bankasi

- Holding event density dusuk (3-5 material/yil vs operating 8-12). Board governance holdinglede higher materiality.
- Routine filing vs event distinction kritik: "Board appointments" (event) vs "governance compliance form" (routine).
- SPK approval language = AUTOMATIC HIGH confidence.
- Dividend payout ratio holding indicator: >%70 = mature, distribution odakli.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **is_material: null tüm 119 classification için** — Hiçbir olay için is_material alanı doldurulmadı. CEO değişimi (1590373) açıkça SPK mevzuatı uyarınca materyal; bu alan boş bırakılamaz.
- **quantitative_impact_try: null hepsi için** — 119 olay arasında hiçbiri için TRY etki hesabı yapılmadı. Temettü sıfır kararı için bile "118.2 bn TRY temettü ödemesi yapılmadı = nakit koruması" şeklinde etki yazılabilirdi.
- **İran krizi macro_event olarak classify edilmedi** — 10 Orta Doğu rotası askıya = havacılık için P0 macro_event. THYAO'nun "Özel Durum Açıklaması (Genel)" bildirimleri arasında İran etkisine dair bir sınıflandırma yok; bu olay KAP'tan bağımsız olarak macro_event taxonomy'siyle işlenmeliydi.
- **Brent +%4.68 ve USD/TRY 44.76 macro_event sınıflandırması yok** — CEO pre-flight P1 olarak belirtmişti. Bu makro değişkenler macro_event olarak listeye girmedi.
- **CEO değişimi için "management_change" tam JSON eksik** — Severity "unexpected" (beklentisiz = HIGH materiality), önceki CEO kim, yeni CEO kim, stratejik fark nedir — bunlar tam JSON'da yer almalıydı.
- **Multi-event interaction analizi yok** — CEO değişimi + temettü sıfır + İran rotaları → üçü aynı anda açıklandı. Net combined etkisi (yönetim riski + nakit koruması + rota gelir kaybı) tek tabloda sunulmadı.

### Bundan Sonra:
- **is_material alanı her classification'da doldurulacak** — true / false / uncertain + tek cümle gerekçe. SPK mevzuatı gerektiren olay = true. Bilinmiyorsa = uncertain.
- **Havacılık için zorunlu macro_event listesi:**
  - Brent fiyatı ±%3 üstü hareket → macro_event (yakıt maliyeti)
  - USD/TRY ±%2 üstü hareket → macro_event (gelir çevirimi)
  - İran/Orta Doğu rota kapatmaları → macro_event (operasyonel gelir)
  - IATA/ICAO regulasyon değişikliği → macro_regulatory_event
- **CEO/YK değişimi = unexpected_management_change (HIGH materiality)** — routine (beklenen dönem sonu) değil; beklentisiz CEO değişimi her zaman HIGH + severe olarak işaretlenecek.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **is_material null tüm eventlerde — 5. THYAO, kalıcı hata** — CEO değişimi, İran rota kapanması, Brent +%4.68 — üçü de yüksek materyallik taşıyor; hepsi null. Direktif 4 kez yazıldı; null çıktı artık COO kapısında durduruluyor.
- **İran rota kapanması macro_event olarak sınıflandırılmadı — 5. THYAO** — Direktif: Brent ±%3+ ve İran/Orta Doğu rota kapanması → macro_event zorunlu. 5 analizdir uygulanmadı.
- **quantitative_impact tüm eventlerde null — 5. THYAO** — CEO değişimi için strateji belirsizliği risk tahmini bile üretilmedi. İran rotaları için: rota × sefer × TRY gelir = [conf: LOW] kabul edilir.
- **AGM sub-event ayrımı yapılmadı** — Temettü sıfır kararı, YK seçimi, sermaye kararı ayrı eventler olarak sınıflandırılmadı.
- **Multi-event interaction tablosu üretilmedi** — CEO değişimi + İran rotaları + Brent spike kümülatif EBITDA delta hesabı yapılmadı.

### Bundan Sonra:
- **THYAO event taxonomy = memory'de sabit kod (5. direktif):**
  - CEO/YK değişimi → unexpected_management_change, CRITICAL, is_material: HIGH
  - Brent ±%3+ → macro_event, HIGH, is_material: HIGH
  - İran/Orta Doğu rota kapanması → macro_event, HIGH, is_material: HIGH
  - AGM kararları → her karar ayrı sub-event
- **is_material null = classification incomplete — COO BLOCKED gönderilir (5. direktif)** — "BELİRSİZ" bile null'dan üstün.
- **3+ materyel event → cross-event interaction tablosu zorunlu** — Olay | Bireysel EBITDA Δ | Kümülatif Etki | Yön.

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **is_material: null tüm 99 bildirimde** — Temettü dağıtımı (BUGÜN), AGM (BUGÜN), DÖNÜŞÜM bildirimleri, savunma sözleşme duyuruları — hepsi null. Bu bildirimler için açıkça YÜKSEK materyallik değerlendirmesi yapılmalıydı.
- **quantitative_impact: null tüm bildirimlerde** — Savunma sektöründe sözleşme duyuruları için "sözleşme tutarı / yıllık ciro = % impact" basit hesabı yapılabilirdi.
- **Savunma sözleşme duyuruları "contract_signing" olarak sınıflandırılmadı** — ASELS'te sözleşme bildirimleri özel olay tipidir; "corporate_action" veya "other" değil, "contract_signing" kategorisi zorunlu.
- **DÖNÜŞÜM bildirimleri (pay dönüşümü) değerlendirilmedi** — Ortaklık yapısı ve serbest dolaşım etkisi açısından ORTA materyallik; sınıflandırılmadı.
- **Multi-event interaction tablosu yok** — Temettü + AGM + sözleşme duyuruları bir arada olduğunda kümülatif etki analizi üretilmedi.

### Bundan Sonra:
- **Savunma şirketleri için olay sınıflandırma şablonu:**
  - Sözleşme/ihale duyurusu → contract_signing, YÜKSEK (>%1 ciro)
  - Temettü dağıtımı (aynı gün) → corporate_action, YÜKSEK, IMMEDIATE
  - AGM (aynı gün) → corporate_action, YÜKSEK, IMMEDIATE
  - Pay dönüşümü → share_structure_change, ORTA
  - SSB/TSKGV ilgili bildirim → regulatory_event, YÜKSEK
- **Bugün gerçekleşen her olay → IMMEDIATE + YÜKSEK** — "Tarih = analiz tarihi" koşulu otomatik IMMEDIATE tetikleyicisi.

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
