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
## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **EPDK gaz tarifesi (4 Nisan 2026) `macro_regulatory_event` olarak classify edilmedi** — CEO direktifinde "EPDK gaz tarifesi bildirimleri → IMMEDIATE flag" açıkça yazılıydı. Bu olayın macro_regulatory_event olarak sınıflandırılması zorunluydu; çıktıda yalnızca kap_watch tarafından geçildi, event_classification tarafından tam JSON ile işlenmedi.
- **CBAM (AB Safeguard TRK −%47, 1 Temmuz 2026) `trade_regulatory_event` olarak classify edilmedi** — Bu çelik sektörü için kritik düzenleyici olay taxonomy'de mevcut; sınıflandırılması zorunluydu.
- **AGM sub-event listesi tam değil** — AGM gündemindeki temettü onayı, yönetim kurulu seçimi, bağımsız üye seçimi ayrı sub-eventler olarak classify edildi ✓ ama ibra kararı ve denetçi seçimi alt eventleri eksik.
- **Multi-event interaction analizi eksik** — EPDK tarifesi + CBAM + Kok Bataryası CAPEX → net combined EBITDA etkisi hesaplanmadı. Her olay ayrı ayrı analiz edildi.

### Bundan Sonra:
- **EPDK/BOTAŞ kararları her analizde macro_regulatory_event olarak ÖNCE classify et** — CEO direktifi olan acil tetikleyiciler listesinin başına koy; KAP bildirimi yoksa bile macro_event taxonomy'si ile işle.
- **Çelik analizinde `trade_regulatory_event` zorunlu kontrol** — AB Safeguard, CBAM, anti-dumping kararları çelik sektörü için özellikle kritik; taxonomy'den bu kategoriye mutlaka bak.
- **Multi-event portfolio: EPDK + CBAM + CAPEX net etkisi** — Aynı dönemde birden fazla maliyet etkisi varsa bunların combined EBITDA üzerindeki net etkisini cross-event interaction tablosunda göster.

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Output truncated — 16 event'ten sadece 2'si tam JSON ile gösterildi** — Kalan 14 event truncated; "16 classified" denip detayı sunulmayan event sayısı = 14. Bu kural ihlali.
- **Makro olaylar (İran krizi, TCMB %46 faiz) classify edilmedi** — Mevcut `macro_event` kategorisi var ama bu kritik olaylar için classification çıktıda yok. İran-ABD gerilimi, TCMB acil faiz artışı, Brent $103 → hepsinin macro_event classification'ı bulunmalıydı.
- **CEO/Chairman değişikliği için tam JSON eksik** — Event 16 olarak başlıkta geçiyor ama tam classification JSON'ı gösterilmedi (truncation nedeniyle).
- **Multi-event interaction analizi eksik** — CEO değişikliği + temettü iptali + İran krizi → net consolidated P&L etkisi hesabı yapılmadı.

### Bundan Sonra:
- **10+ event'te summary table + FULL detail JSON ikisi birlikte** — Özet tablo ile başla, hemen ardından tam JSON appendix ekle. "16 classified" deyip sadece 2 JSON gösterme.
- **Makro olayları ilk sıraya koy** — THYAO gibi jeopolitik bağımlı şirketlerde İran krizi, yakıt fiyatı, TCMB faizi → bunlar P0 macro_event olarak listenin başında yer almalı.
- **Eş zamanlı multi-event senaryosu** — CEO değişikliği + temettü iptali aynı anda açıklandı; bunlar tek economic event olarak net etki ile birlikte sunulmalı (ayrı ayrı double-count değil).

- `corporate_action` — temettu, sermaye artirimi, borclanma
- `spectrum_acquisition` — spectrum auction, license acquisition (telekom)
- `network_rollout` — 5G/4G coverage expansion (telekom)
- `regulatory_compliance` — BTK filings, interconnection (telekom)
- Tek event birden fazla tip icerebilir → primary + secondary classification
- Reserve determination/drilling updates net yatirim karari yoksa → `unclassified` escalate
- Annual/integrated report → `routine_filing`

**Confidence Scoring:**
- HIGH: Acik sartlar (tutar, faiz, vade, explicit language), SPK approval
- MEDIUM: Inference gereken, routine/expected event
- LOW: Yalnizca dolayli kanit

**Her rapor icin:**
- [ ] KAP Watch'tan gelen tum disclosure'lar classify edildi mi?
- [ ] Her event icin quantitative impact hesaplandi mi?
- [ ] Macro events dahil edildi mi?
- [ ] Zaman damgasi (AKTIF/GECMIS/ARSIV) atandi mi?
- [ ] Multi-event interaction analizi yapildi mi?
- [ ] JSON output tam mi, truncation yok mu?

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **JSON output truncated** — 8 event classify edildi ve özet tablo tam verildi ✓; ancak Event #1'in JSON çıktısı "...classification_confidence": "high", "confidence_rationale": "Board decision formally announced with e..." diye kesildi. Diğer 7 event'in tam JSON'ı yok.
- **Makro olaylar classify edilmedi** — İran-ABD gerilimi (Brent $103), TCMB PPK (22 Nisan 2026) ve Rekabet Kurumu soruşturması macro_event kategorisinde classifiy edilmedi.
- **Multi-event interaction analizi eksik** — Temettü kararı + CEO interim devamı + FILE spin-off birlikte net portfolio etkisi tartışılmadı. Double-count riski yoksa "net etkisi nedir" sorusu yanıtsız kaldı.
- **8 event özet tablosu kapsamlı ✓** — Event tipi, tarih, materiality, güven skoru, finansal etki — hepsi özet tabloda mevcut. İyi yapı.

### Bundan Sonra:
- **Perakende sektörü özel event kategorileri:**
  - `store_expansion` — net mağaza açılımı KAP bildirimleri (perakende büyüme KPI'sı)
  - `antitrust_investigation` — Rekabet Kurumu soruşturması (BIMAS + rakipler)
  - `international_expansion` — Fas/Mısır mağaza bildirimleri, yabancı yasal onaylar
- **10+ event'te summary + tam JSON birlikte** — BIMAS 8 event için özet tablo doğruydu; devam bölümünde her event JSON'ı verilmeliydi. THYAO'daki hata burada da tekrarlandı.
- **CEO interim devam süresi (10+ ay) URGENT flag** — event_classification'da "management_change" kategorisinde severity = HIGH olarak işaretlenmeli; "interim 10+ ay = governance risk materializing" notu eklenmeli.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **KAP ID'lerin tamamı "[BULUNAMADI]"** — 7 olay sınıflandırıldı ama hepsinde disclosure_id eksik. Secondary sources'tan classification yapıldı. Bu kural ihlali; primary KAP ID olmadan confidence MEDIUM üstüne çıkamaz.
- **Event JSON'ları truncated** — Event 2 JSON sonunda "classification_rationa..." diye kesildi; Event 3-7'nin tam JSON'ı yok. Summary tablosu var ✓ ama kural: her event için tam JSON zorunlu.
- **Multi-event interaction analizi yapılmadı** — KCHOL temettü (Event 1) + TUPRS temettü (Event 2) + Fitch downgrade (Event 7) birlikte net portfolio etkisi ve KCHOL NAV üzerindeki kümülatif impact hesaplanmadı.
- **İran ateşkes (Event 4) jeopolitik event** — "VOLATIL" olarak etiketlendi ✓ ama quantitative P&L impact sadece event_impact_mapper'a devredildi; event_classification kendi bölümünde bile tahmini TRY etkiyi vermedi.
- **YKBNK tahvil geri alımı "unclassified"** — "KAP doğrulaması eksik" gerekçesiyle sınıflandırılmadı. Kural: `unclassified_due_to_missing_primary_source` etiketiyle bile olsa kaydet; "classify edemem" deyip atlama.

### Bundan Sonra:
- **7 event summary tablosu iyi formatlandı ✓** — Bu formatı koru: her event için tür, tarih, materiality, güven, finansal etki özeti.
- **KAP ID bulunamazsa confidence değerini kademeli düşür** — KAP ID confirmed = HIGH, secondary source only = MEDIUM, sadece tahmin = LOW. MEDIUM confidence'ta KAP ID alanı "[secondary source]" ile doldur.
- **Multi-event NAV impact tablosu ekle** — Holding analizinde 3+ materyel event varsa sonunda: "Net NAV etkisi = Event1 + Event2 + Event3 = +/- X TRY" özet tablosu zorunlu.

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

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **22. ve 23. event truncated** — 23 disclosure analiz edildi ama son 2 satır çıktıda görünmüyor; bölüm kesilmiş.
- **MANAGEMENT_CHANGE (2025-03-25) için detay eksik** — Hangi pozisyon değişti, kim atandı/ayrıldı, materiality gerekçesi tam verilmedi.
- **Genel confidence 0.72 — doğrulama yetersiz** — KAP ID eksik bildirimlerin confidence'ı düşük tutulmalıydı.

### Bundan Sonra:
- **23 event = 23 tam satır:** Her bildirim tam doldurulacak. Son satır kesilirse bölümü iki parçada gönder.
- **MANAGEMENT_CHANGE detayı ZORUNLU:** Ayrılan kişi, gelen kişi, pozisyon, etki (governance/strateji) mutlaka belirtilmeli.
- **KAP ID eksik = confidence max 0.70:** KAP'tan doğrulanamayan bildirimlerde confidence 0.75 üstüne çıkılamaz.

---

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu
### Eksikler:
- Cikti `Mock completed output for event_classification.` seviyesinde kaldi; olaylar regule edici, operasyonel, finansal ve jeopolitik olarak siniflandirilmadi.
- Telekom icin spektrum, fiyatlama, enerji, kur, vergi ve rekabet kaynakli event agaci kurulmadan downstream analiz baslatildi.
### Bundan Sonra:
- Her event'i `kategori + zaman ufku + kesinlik + finansal kanal` formatinda siniflandir; genel gecis cumlesi yetmez.
- Jeopolitik ve duzenleyici olaylar sektor-spesifik alt siniflara ayrilacak; telekomda spektrum, BTK, enerji ve kurallar ayri izlenecek.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu Post-Report Loop
### Eksikler:
- Olaylar yalnizca var/yok seviyesinde kaldi; hangi olay kisa vadeli katalist, hangisi yapisal risk, hangisi tartismali veri kaynagi bunu ayirmadi.
- Jeopolitik olaylar telekom icin ayri bir sinif agacina konmadi; Iran-ABD, Rusya-Ukrayna, enerji ve regule fiyatlama baglanti seti kurulmadı.
### Bundan Sonra:
- Event classification ciktilari her zaman `event_id + kategori + alt kategori + horizon + confidence + owner metric` alanlariyla gelecek.
- Jeopolitik, makro ve duzenleyici olaylari sektor sozlugune gore alt siniflara ayir; telekomda BTK, spektrum, enerji, kur ve rekabet ayrimi zorunlu.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Post-Report Feedback Loop
### Eksikler:
- Event seti, `katalist / risk / routine filing` olarak yatirim diline donusturulmedi; final raporun hangi olayi onde tasiyacagi belirsiz kaldi.
- Telekom sektorunde spektrum, BTK, enerji, kur ve vergi etkileri ayni kategori altinda yeterince ayrismadi.
### Bundan Sonra:
- Event classification her raporda cikisina `investment meaning` alani ekleyecek; olay sadece adlandirilmayacak, katalist mi risk mi rutin mi net yazilacak.
- Telekom event taxonomy'si ayri sabit set olarak uygulanacak; spektrum, BTK, enerji, kur, vergi ve rekabet olaylari birbiri yerine kullanilmayacak.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **KAP 1383079 "unclassified_due_to_missing_primary_source" doğru etiketlendi ✓** — Ancak materyallik değerlendirmesi "ORTA" olarak konuldu; içerik bilinmeden materyallik atamak doğru değil. "MATERYALLIK: BELİRSİZ" olmalıydı.
- **Event JSON'ları truncated** — Event 2 JSON "classification_rationa..." ile kesildi; Event 3-7 tam JSON eksik. Özet tablo mevcut ✓ ama kural: her event için tam JSON.
- **Multi-event interaction analizi yapılmadı** — TUPRS satışı (9,320 mn TL nakit) + temettü ödemesi (-17,320 mn TL) + Fitch downgrade → net NAV ve kümülatif nakit etkisi hesaplanmadı. KCHOL gibi 8 materyel olay varken cross-event tablo zorunlu.
- **Koç Finansman satışı KAP bildirimi doğrulanmadı** — Haber kaynakları (Mynet Finans) kullanıldı; KAP'ta resmi bildirim ID'si yok. Bu confidence = MEDIUM olmaktan çıkıp LOW olmalıydı.

### Bundan Sonra:
- **Materyallik = içerik bilinmeden verilemez** — KAP bildirimi okunmadan "ORTA" atama yasak. İçerik bilinemiyorsa: "MATERYALLIK: BELİRSİZ — içerik doğrulaması gerekiyor".
- **Holding analizinde cross-event NAV tablosu zorunlu** — 3+ materyel event varsa sonunda: Olay | P&L Etkisi (mn TL) | NAV Etkisi (TL/hisse) | Dönem | Net. Bu tablo event_impact_mapper'ın input'u.
- **Event JSON truncation önlemi** — 5+ event varsa: Özet tablo → JSON Batch 1 (Event 1-3) → JSON Batch 2 (Event 4+). Tek mesajda kesme.
