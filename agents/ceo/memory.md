# CEO Agent — Damitilmis Hafiza

---

## Kalici Kurallar (Chairman Direktifleri)

### Veri Kaynak Kurallari
- **MUTLAK:** Veriler DOGRUDAN faaliyet raporu PDF, KAP SPK tablolari veya XBRL'den. Platform ciktilari (HTML/PDF/MD) ASLA kaynak olamaz. Kaynaksiz iddia YASAK, WebFetch zorunlu.
- **"Veri yok" YASAK** — KAP'ta 5 yillik tablo mevcut. Agent: alternative method → upstream request → CEO escalate. Onayi olmadan "veri yok" denemez.

### Rapor Onay & Kalite
- **CEO APPROVAL GATE:** Rapor CEO onayi olmadan TESLIM EDILEMEZ. qa/synthesis/final: completed + min karakter + [DEGRADED] yok.
- **QA GATE:** conditional_pass = BLOCK. Score < 0.75 → BLOCK. FAIL → downstream dur + remediation plan.
- **Pre-QA Gate:** Events sonrasi completeness check, yetersiz agent re-run.
- **Self-assessment YASAK** — kalite karari yalniz QA/CEO verir. **Fact Pack:** Catisma → CEO authoritative pack yayimlar, downstream kilitlenir.

### Rapor Format Standardi
- **12 bolumlu yapi** (Kapak→Yonetici Ozeti→...→Zorunlu Bildirimler). Her bulgu: Tespit→Aciklama→Risk→Oneri.
- **Goldman yapisi:** S.1=hedef fiyat+tez+tablo, S.2-3=yatirim sutunlari, S.4-5=riskler (quantified).
- **Skor karti** (1-10, 6 boyut+genel) + hedef fiyat (Bear/Baz/Bull) ZORUNLU.
- **Metin sandvic:** Her tablo oncesi "neden bakiyoruz" + sonrasi "ne anliyor". 4-soru yorum: Ne kadar? Nasil degisti? Neden? TRY etkisi?
- **Gorsel:** [CHART:PIE/BAR/LINE] tag'leri, %55/%45 metin/gorsel, layout yan yana 60/40 (alt alta YASAK).
- **Sirket brand identity taklit et** (renkler, tipografi, layout). Her sayfada logo. Yonetim anlatisi (CEO mektubu, taahut takibi) zorunlu.
- **Sayfa tasmasi YASAK** (orphans:4, widows:4, tablo ortasinda kesme YASAK). Emoji YASAK, meta-text YASAK. PDF zorunlu.

### Otonomi & Proaktif Yonetim
- CEO proaktif dusunur. Rate limit/crash/format/eksik metrik → KENDIN COZ, Chairman'e YAZMA.
- Chairman'e SADECE: sirket/sektor ekleme, mimari degisiklik, butce, stratejik yon.
- Tekrarlayan hata YASAK — bir feedback tum analizlere uygulanir. Uygulanmasini KONTROL ET ("Checked memory: [rules]" zorunlu).

### Teknik Kurallar
- **IAS 29:** Turk sirketi → TUFE >%100 → IAS 29 aktif → KAP konsolide tablo, parasal kazanc ayristir.
- **Net Borc = Finansal Borc - (Nakit + KV Finansal Yatirimlar).** Toplam yukumluluk YASAK.
- **Reconciliation skoru:** Ic tutarlilik %50 + kaynak dogrulugu %50. Kaynak dogrulanmadan EXCELLENT verilemez.
- **Emtia anomali:** Celik EBITDA marji >%15 → FLAG. Net kar/EBITDA >%35 → IAS 29 suphe.
- **EPDK/BOTAS → event_impact_mapper IMMEDIATE.** Valuation 3 parcada calisir. Holding timeout 25dk + 2 retry.
- **Truncation → CEO'ya escalate, yarim output GONDERME.** Summary + Detail JSON cift cikti.
- **Upstream validation:** "[pending]" → downstream analiz YAPMA, talep et. 4 zorunlu tablo: IS, BS, CF, SE.
- Heartbeat loglari → heartbeat_archive.md (burada sadece son ozet, max 10 satir).

---

## Operasyonel Kontrol Listesi

### Pre-Flight
- [ ] Sirket tipi (holding→segment+SOTP+NAV) + sektor framework (Telekom:ARPU/churn, Banka:NIM/CET1, Enerji:WTI-Brent/IEA)
- [ ] Agent memory yuklenmis mi, onceki feedback uygulanmis mi?
- [ ] IAS 29 pre-check

### Quality Review (Onay Oncesi)
- [ ] ~45 zorunlu metrik tam mi? Her rasyo yorumlanmis mi (sayi+anlam+trend+benchmark)?
- [ ] Makro analiz (TCMB/enflasyon/doviz/buyume/enerji/jeopolitik) + sektor-ozel analiz var mi?
- [ ] Kaynaklar dogru mu (platform ciktisi referans YASAK)? Meta-text temiz mi?
- [ ] 12 bolum icerik dolu mu? Grafik/skor karti/hedef fiyat/PDF tamam mi? Tum bolumler gorunur mu?
- [ ] Holding ek: segment analiz + NAV + holding discount + parent vs consolidated ayrim

---

## Agent Performans Ozeti

**KRITIK SORUNLU:** parse_standardization (parse hatalari, kendini SUCCESSFUL ilan ediyor), reconciliation (hatali veri onayliyor), qa_review (tespit iyi, pipeline durdurma yok), valuation_agent (timeout crash), report_formatter (cogu raporda calismadi), final_summary (icerik sig, truncation), event_impact_mapper (EPDK gibi kritik olaylari kaciriyor)

**IYILESIYOR:** financial_analysis (TCELL-delta'da duzeltildi; upstream hata yakalama iyi), data_collection (0.91 guven; tarihsel veri zayif)

**IYI:** macro_analysis (jeopolitik guclu), technical_analysis (Fib+MA+RSI), context_extraction (SOTP/ESG), kap_watch, event_timeline_alert, sector_competition (CBAM/peer)

**ORTA:** strategic_synthesis (convergence iyi; divergence/BUY-HOLD-SELL eksik)

---

## Son 3 Raporun Ogrenimleri

### EREGL (13 Nisan) — QA ~0.45, REJECT
- Kaskadif veri hatasi: parse EBITDA %66 fazla + net kar 27.5x fazla → reconciliation 0.91 skorla onayladi. **Ders:** Ic tutarlilik ≠ kaynak dogrulugu.
- Net borc hesabi yanlis (toplam yukumluluk vs finansal borc). EPDK +%18.61 gaz tarifesi (~-4.5B TRY/yil) event_impact_mapper'da YOK.
- **Iyi:** financial_analysis upstream hatayi web dogrulamayla yakaladi.

### TUPRS (12 Nisan) — QA 0.618, PARTIAL RECOVERY
- event_timeline_alert upstream output varken "eksik" dedi → dosya varligi kontrolu sart.
- financial_analysis bolum 1-9 pipeline'a girmedi. valuation tek seferde crash (exit 143) → 3 parca.
- **Iyi:** kap_watch 12 aylik envanter, data_collection 0.91, esg CDP A- tespiti.

### TCELL Delta (11 Nisan) — QA 0.84, CONDITIONAL PASS
- Delta-update stratejisi basarili: gap-focused deep execution > genis scope shallow.
- Upstream guclendirme ise yaradi (input validation + [pending] yasagi). Truncation hala sorun → cift output uygulanacak.

---

## Watchlist & Hedefler Ozeti

### Son Heartbeat — #78 (14 Nisan 2026 — Yirminci Döngü)
**ALERT — BRENT $102.47 / PAKISTAN MÜZAKERELERİ ÇÖKTÜ / HÜRMÜZ ABLUĞASI BAŞLADI / TUPRS YARIN KRİTİK.** Pakistan'daki ABD-İran görüşmeleri başarısız sonuçlandı (Vance: "Anlaşamadık, dönüyoruz" — 21 saatlik müzakere). ABD, 13 Nisan TSİ 17:00'dan itibaren İran limanlarına deniz abluğası başlattı. Brent gün içinde volatil: motorin indirimi sonrası $96.66'ya geriledi (-%2.7), ardından abluka haberiyyle $102-103 bölgesine yükseldi; oilpriceapi canlı: **$102.47/bbl** → **$102 kritik eşik AŞILDI.** Tanker trafiği kısıtlı (Rich Starry ablukadan bu yana boğazdan geçen ilk gemi). İran dini lider onayı bekliyor — yeni görüşme planı yok. **TUPRS:** 17 Nisan YARIN — Brent $102+ kritik eşik aşıldı, crack spread izlemesi maksimum öneme çıktı; bugün yeni KAP bildirimi yok (KCHOL Mart 2026 %2.1 TUPRS satışı tamamlandı, eski bilgi). **EREGL:** YK temettü ödeme tarihi KAP'ta hâlâ YOK — **18 Nisan kritik (4 gün)**; brüt 0.55 TRY / net 0.4675 TRY OGM 26 Mart onaylı. **TCELL/KCHOL/THYAO/BIMAS/SAHOL:** Yeni özel bildirim teyit edilmedi. **BIST 100 (13 Nis. son kapanış):** 13,924.22 (-1.06%). **TCMB PPK (22 Nisan — 8 gün):** Abluka + petrol baskısı → +300bp beklentisi güçleniyor. **Chairman'e ALERT: EVET — Brent $102.47 ($102 kritik eşik AŞILDI); Pakistan çöktü, Hürmüz abluğası aktif; TUPRS 17 Nisan YARIN acil izleme; Morgan Stanley $110+ Q2 tahmini geçerli.**

### Son Heartbeat — #77 (14 Nisan 2026 — On Dokuzuncu Döngü)
**SAKİN DÖNGÜ — BRENT $97.45-98.05 / TUPRS 17 NİSAN YARIN KRİTİK / EREGL TEMETTÜ 18 NİSAN HÂLÂ BEKLİYOR.** Brent: **$97.45-98.05/bbl** (gün içi aralık $96.48-$98.68) — $97-98 bandında konsolide, $102 eşiği altında; Hürmüz müzakereleri devam, piyasa sakin. **TUPRS:** 17 Nisan (YARIN) KAP/crack spread izlemesi — bugün yeni KAP bildirimi yok; 2. taksit temettü ex-d 30 Eylül; Brent $97-98 bandı ve distillat marjı olumlu. **EREGL:** YK ödeme tarihi KAP'ta hâlâ YOK — **18 Nisan kritik (4 gün)**; brüt 0.55 TRY / net 0.4675 TRY OGM 26 Mart onaylı; tüm kaynaklarda teyit: ödeme tarihi YK'ya bırakıldı, henüz açıklanmadı. **THYAO/KCHOL/BIMAS/SAHOL/TCELL:** Yeni özel durum bildirimi yok. **TCMB PPK (22 Nisan — 8 gün):** +300bp beklentisi değişmedi. **KAP Taraması:** Watchlist şirketlerinde P0 düzeyinde yeni bildirim teyit edilmedi. **Chairman'e ALERT: HAYIR — Brent $97-98 bandında ($102 altı), TUPRS 17 Nisan YARIN rutin izleme, EREGL temettü tarihi hâlâ beklemede, P0 yok.**

### Son Heartbeat — #76 (14 Nisan 2026 — On Sekizinci Döngü)
**SAKİN DÖNGÜ — BRENT $97.45 / TUPRS 17 NİSAN YARIN SABAH KRİTİK / EREGL TEMETTÜ 18 NİSAN 4 GÜN / EIA DİSTİLLAT MARJI MART 2022 ZİRVESİ.** Brent: **$97.45/bbl (-1.64% 14 Nis.)** — $97-98 bandında konsolide, $102 eşiği altında. Hürmüz müzakereleri devam. **YENİ EIA VERİSİ:** Distillat crack spread Mart 2026'da NYH'de $1.42/gal ortalaması — Mart 2022'den bu yana en yüksek aylık seviye, 5 yıllık ortalama ($0.68/gal) 2 katı; Brent-WTI spread Nisan'da $15/b zirveye çıkıyor (üretim aksamaları). TUPRS için ham madde $97 bandında sabit, ürün marjları rekor → **son derece olumlu pozisyon**. **TUPRS:** 17 Nisan (YARIN) KAP/crack spread izlemesi — yeni özel bildirim yok. **EREGL:** YK temettü ödeme tarihi hâlâ KAP'ta YOK — **18 Nisan kritik (4 gün)**; 2024 emsal 18 Nisan olasılığı yüksek, bu döngüde de doğrulanamadı (brüt 0.55 TRY / net 0.4675 TRY OGM 26 Mart onaylı). **BIST Bileşimi (13 Nis.):** TCELL -1.36%, KCHOL +0.05%, THYAO -2.01%, BIMAS -0.93%, SAHOL -2.84% — genel piyasa baskısı var, P0 açıklama yok. **TCMB PPK (22 Nisan — 8 gün):** +300bp beklentisi değişmedi. **KAP Taraması:** Watchlist şirketlerinde (TUPRS/EREGL/TCELL/KCHOL/THYAO/BIMAS/SAHOL) bugün P0 düzeyinde yeni KAP bildirimi teyit edilmedi. **Chairman'e ALERT: HAYIR — Brent $97-98 ($102 altı), EIA distillat marjı TUPRS için güçlü olumlu (17 Nisan öncesi son döngü), EREGL temettü tarihi 4 gün, yeni negatif P0 olay yok.**

### Son Heartbeat — #74 (14 Nisan 2026 — On Altıncı Döngü)
**SAKİN DÖNGÜ — BRENT $97-98 BANDINDA / TUPRS YARIN (17 NİSAN) KRİTİK / EREGL TEMETTÜ HÂLÂ YK BEKLİYOR.** Brent: **$97.45-98.05/bbl** (oilpriceapi/WebSearch canlı) — $97-98 bandında seyir devam, $102 eşiği altında. Hürmüz müzakereleri sürmekte, ABD-İran görüşmeleri devam ediyor. **TUPRS:** 17 Nisan (YARIN) — KAP/crack spread izlemesi kritik seviyede; yeni KAP bildirimi yok; İş Yatırım 338 TL (9 Nis.), Deniz Yatırım 359 TL hedef koruyor; Brent $97-98 bandı margin açısından olumlu. **EREGL:** 2026 temettüsü 0.55 TRY brüt / 0.4675 TRY net (26 Mart OGM onaylı, 3 Mart açıklandı); YK ödeme tarihi hâlâ KAP'ta YOK — **18 Nisan kritik (4 gün)**. Tarihsel emsal: 2024'te OGM 28 Mart, YK karar 5 Nisan, ödeme 18 Nisan → 2026 OGM 26 Mart, YK kararı gecikiyor, 18 Nisan olasılığı yüksek. **TCELL/KCHOL/THYAO/BIMAS/SAHOL:** Özel durum açıklaması yok. **TCMB PPK (22 Nisan — 8 gün):** Goldman +300bp beklentisi koruyor. **KAP Taraması:** Watchlist şirketlerinde P0 düzeyinde yeni bildirim teyit edilmedi. **Chairman'e ALERT: HAYIR — Brent $97-98 ($102 altı), TUPRS YARIN rutin izleme başlıyor, EREGL temettü tarihi hâlâ bekleniyor (2024 pattern → 18 Nisan), yeni kritik KAP açıklaması yok. TUPRS 17 Nisan izlemesi için CEO sabah erken döngü gerekiyor.**

### Son Heartbeat — #73 (14 Nisan 2026 — On Beşinci Döngü)
**SAKİN DÖNGÜ — BRENT $97.85 / TUPRS 17 NİSAN YARIN / EREGL 18 NİSAN 4 GÜN / TCMB PPK TARTIŞMALI.** Brent: **$97.85/bbl** (Trading Economics canlı) — 13 Nis. $97.23'ten +%2.14 toparladı; $97-98 bandında seyrediyor, $102 kritik eşiği altında. 14 Nisan akaryakıt (motorin/benzin) indirimi yapıldı — petrol fiyatı gerilemesiyle tutarlı. **TUPRS:** 17 Nisan (3 gün) KAP/crack spread izlemesi aktif — yeni KAP bildirimi yok; Hürmüz riski sürmekte, Brent $102 altı pozitif. **EREGL:** YK temettü ödeme tarihi KAP'ta hâlâ YOK (tüm kaynaklarda teyit: OGM 26 Mart onaylı, YK'ya bırakıldı) — **18 Nisan kritik (4 gün)**. **TCELL/KCHOL/THYAO/BIMAS/SAHOL:** Özel durum açıklaması yok. **TCMB PPK (22 Nisan — 8 gün):** Görüş bölünmüş — Goldman +300bp beklentisi koruyor, bir grup analist Mart'taki "bekle-gör" stratejisinin devam edeceğini öngörüyor (sabit). Karar belirleyicileri: Mart enflasyonu hedef üstü + Hürmüz kaynaklı petrol-enerji baskısı. **KAP Taraması:** WebSearch ile P0 düzeyinde yeni bildirim teyit edilmedi. **Chairman'e ALERT: HAYIR — Brent $97-98 bandında ($102 altı), TUPRS 17 Nisan rutin izleme (3 gün), EREGL temettü tarihi hâlâ beklemede (4 gün), TCMB PPK beklentisi piyasada tartışmalı ama P0 olay yok.**

### Son Heartbeat — #72 (14 Nisan 2026 — On Dördüncü Döngü)
**SAKİN DÖNGÜ — BRENT $97-98 BANDINDA DEVAM / TUPRS 17 NİSAN 3 GÜN / EREGL 18 NİSAN 4 GÜN.** Brent: **$97.93-98.08/bbl (-1.29-1.44% 14 Nis.)** — #71'deki $98.03'e paralel, $97-98 bandında konsolide oluyor; $102 kritik eşiği altında kalmaya devam. Hürmüz müzakere sürecinde piyasa sakin. **TUPRS:** 17 Nisan (3 gün) KAP/crack spread izlemesi aktif — yeni KAP bildirimi yok; TUPRS 2026 temettü 14.56 TL/hisse net (1. taksit ex-d 16 Mart tamamlandı). **EREGL:** YK temettü ödeme tarihi KAP'ta hâlâ YOK (tüm kaynaklarda teyit: OGM 26 Mart'ta ödeme tarihi YK'ya bırakıldı) — **18 Nisan kritik (4 gün)**; her döngüde doğrulanamıyor. **TCELL/KCHOL/THYAO/BIMAS/SAHOL:** Yeni özel bildirim yok. **TCMB PPK (22 Nisan — 8 gün):** +300bp beklentisi değişmedi. **KAP Taraması:** WebFetch dinamik sayfa nedeniyle doğrudan erişilemiyor — watchlist şirketlerinde web aramasıyla P0 düzeyinde yeni bildirim teyit edilmedi. **Chairman'e ALERT: HAYIR — Brent $97-98 bandında ($102 altı), TUPRS 17 Nisan izleme rutin, EREGL temettü tarihi hâlâ beklemede (4 gün), yeni kritik KAP açıklaması yok.**

### Son Heartbeat — #71 (14 Nisan 2026 — On Üçüncü Döngü)
**SAKİN DÖNGÜ — BRENT $97-98 BANDINDA / EREGL TEMETTÜ YK HÂLÂ BEKLİYOR.** Brent: **$98.03/bbl (-1.34% 14 Nis.)** — #70'deki $97.08'den hafif yukarı, $97-98 bandında yatay seyrediyor; $102 kritik eşiği altında kalmaya devam ediyor. Hürmüz volatilitesi sürmekte (ABD-İran müzakereleri dalgalı), ancak piyasa paniklemedi. **TUPRS:** 17 Nisan (3 gün) KAP/crack spread izlemesi hâlâ aktif; bugün yeni KAP bildirimi yok. **EREGL:** 0.55 TRY brüt / 0.4675 TRY net temettü onaylı (26 Mart OGM); YK ödeme tarihi açıklaması KAP'ta hâlâ YOK — **18 Nisan kritik (4 gün)**; bu döngüde de doğrulanamadı. **TCELL/KCHOL/THYAO/BIMAS:** Yeni özel bildirim yok. **TCMB PPK (22 Nisan — 8 gün):** Goldman +300bp beklentisini koruyor; Mart enflasyonu hedef üzerinde, petrol hafif gerileme enflasyon baskısını sınırlı azaltıyor. **KAP Taraması:** Watchlist şirketlerinde P0 düzeyinde yeni bildirim yok. **Chairman'e ALERT: HAYIR — Brent $97-98 bandında ($102 altı), EREGL temettü tarihi hâlâ beklemede (rutin izleme), yeni kritik KAP açıklaması yok.**

### Son Heartbeat — #70 (14 Nisan 2026 — On İkinci Döngü)
**ALERT — BRENT SERT GERİ ÇEKİLDİ / ABD-İRAN ATEŞKES MÜZAKERELERİ.** #69'da verilen "$102+ uyarısı" tersine döndü: ABD-İran yeniden müzakere haberlerine Brent **$101.82 (13 Nis.) → $97.08 (14 Nis.)**, günlük düşüş -%2.02. TUPRS için: $102 kritik eşik ALTINA düştü → ham madde maliyeti baskısı azaldı, refinery margin perspektifi iyileşti. Hürmüz krizi devam ediyor ama ateşkes sinyali piyasayı sakinleştirdi. **Volatilite riski sürüyor** — Goldman "Hürmüz 1 ay daha kapalı kalırsa $100+ tüm 2026" uyarısı geçerliliğini koruyor. BIST 100: 13 Nisan kapanış 14,073 (haftalık +8.79%), 14 Nisan verisi henüz yok. USD/TRY: ~44.60-44.72 (stabil). **EREGL:** YK ödeme tarihi hâlâ KAP'ta yok — 18 Nisan kritik (4 gün). Temettü net 0.4675 TRY onaylı (26 Mart OGM). **TUPRS:** Yeni KAP bildirimi yok; 17 Nisan izleme aktif. **TCELL/KCHOL/THYAO/BIMAS:** Özel bildirim yok. **TCMB PPK (22 Nisan — 8 gün):** Petrol geri çekilmesi enflasyon baskısını hafifçe azaltabilir ama +300bp beklentisi korunuyor. **Chairman'e ALERT: EVET — Brent $97'ye geriledi (#69 $102+ uyarısı güncelleniyor); TUPRS eşik altına düştü, 17 Nisan öncesi pozisyon değerlendirmesi önerilebilir. Hürmüz volatilitesi devam, erken pozisyon almak riskli.**

### Son Heartbeat — #69 (14 Nisan 2026 — On Birinci Döngü)
**UYARI — BRENT $102+ EŞİĞİ AŞILDI / TUPRS KRİTİK.** Hürmüz Boğazı ablukası 13 Nisan 17:00'da resmen başladı → Brent **$101.82 (13 Nis.) / $102.50 açılış (14 Nis.)**, günlük aralık $98.86-$103.88. Heartbeat #68'deki "$97.94 normalleşme" geçersiz — kısa süreli düşüş, abluka ile fiyat tekrar $102+ bölgesine döndü. **TUPRS için $102 kritik eşik AŞILDI** (17 Nisan KAP/crack spread izleme öne çekiliyor). Morgan Stanley Q2 tahmini $110/bbl. BIST 100: 14,058.51 (-0.11%), bankacılık -1.07%, holding -0.69%. USD/TRY: ~44.72 (stabil). **EREGL:** 0.55 TRY brüt temettü; YK ödeme tarihi KAP'ta hâlâ açıklanmadı — 18 Nisan kritik (4 gün). **TCMB PPK (22 Nisan — 8 gün):** Hürmüz kaynaklı petrol-enflasyon baskısı → +300bp beklentisi güçlendi. **KAP Taraması:** TUPRS/EREGL/KCHOL/TCELL/THYAO/BIMAS'ta bugün yeni özel bildirim yok. **Chairman'e ALERT: EVET — Brent $102+ aşıldı; TUPRS $102 kritik eşiği geçti, 17 Nisan izleme aciliyeti arttı.**

### Son Heartbeat — #68 (14 Nisan 2026 — Onuncu Döngü)
**SAKİN DÖNGÜ — BRENT GERİ ÇEKİLDİ / BIST YATAY.** BIST 100: 14,058.51 (-0.11%), günlük düşük 13,842.77 (sabah sert baskı) → toparlanma devam. Brent: **$97.94/bbl (-1.40%)** — Hürmüz şoku sonrası $100 altına geriledi, normalleşme sinyali. **EREGL:** Temettü 0.55 TRY brüt (OGK 26 Mart onaylı), YK ödeme tarihi hâlâ KAP'ta çıkmadı — 18 Nisan kritik, her döngüde kontrol. **TUPRS:** 17 Nisan KAP/crack spread izleme, 6 Mayıs gelir raporu. **TCMB PPK (22 Nisan — 8 gün):** +300bp beklenti değişmedi. **KAP Taraması:** Watchlist şirketlerinde yeni özel bildirim yok. **Chairman'e ALERT: HAYIR — Brent geri çekildi, BIST toparlanıyor, P0 yok.**

### Aktif Izleme
- 17 Nisan: TUPRS KAP → crack spread + Körfez tedarik riski (Brent $102+ kritik) | 18 Nisan: EREGL temettü ödeme tarihi YK açıklaması | 22 Nisan: TCMB PPK (+300bp olasılığı artmış; petrol şoku ek baskı) | 6 Mayıs: TUPRS gelir raporu | Q2: EREGL Q1 (EPDK etkisi + çelik talep)

### Rapor Gecmisi (13 rapor)
PASS: ASELS(0.78), TCELL-delta(0.84) | BLOCK: AKBNK(0.58), SISE(0.62), KCHOLx3(0.45-0.68), TCELL#1(0.62), EREGL(~0.45), THYAO(0.757), **BIMAS(0.80)** | PARTIAL: TUPRS(0.618)
**Hedef:** QA > 0.85, %100 PASS.

---

## CEO Post-Report Review — KCHOL Delta — 14 Nisan 2026

### Pipeline Sonucu
- **QA Final Score: 0.676 / 1.0** — Eşik 0.80. REVISION_REQUIRED. Pipeline durduruldu.
- **Round 1 → Round 2 iyileşme:** +0.086 (0.590 → 0.676) — yetersiz; kök sorunlar devam ediyor.
- **Kalan P0 blokerler (3):** (1) Revenue Q4/FY karışıklığı — yanlış çözüme kilitlendi, (2) DSO/DIO/DPO/CCC veri bloker — KAP PDF çekilmedi, (3) IFRS 8 segment EBITDA %0 — 2 tur boyunca çözülmedi.
- **HTML raporu:** report_formatter 53.502 karakter üretti ama COO "mid-table kesilme, CSS eksik, PDF render başarısız" kararı verdi → P0.

### Sistemik Bulgular (KCHOL'a Özgü — Tekrar Eden)

| Sorun | Tezahür | Tekrar Sayısı |
|-------|---------|--------------|
| Revenue Q4/FY karışıklığı | 802.669B TRY = Q4, FY = 2.76T TRY; financial_analysis yanlış baz aldı | İlk kez bu kadar net |
| KAP PDF çekilmedi | 2 tur boyunca "CANNOT EXECUTE" — script çalıştırılmadı | KCHOL: 3. kez |
| IFRS 8 segment extraction %0 | Holding valuation için kritik; 2 tur boyunca alternatif denenmedi | KCHOL: 3. kez |
| Truncation (macro, sector, final, strategic, event_impact) | Tüm uzun çıktılarda output kesildi | Her KCHOL raporunda |
| Macro_analysis TCMB %46 → %37 | memory.md güncellenmemişti; context_extraction düzeltti | 2. kez |
| Report formatter HTML body yok | CSS var, body yok — BIMAS'ta da aynı pattern | BIMAS + KCHOL |

### KCHOL'a Özgü Holding Öğrenimleri

1. **Banka konsolidasyonu bilanço şişirmesi** — YKBNK 924B TRY varlık tam konsolidasyonu nedeniyle KCHOL konsolide bilanço 5.3T TRY; L+E tarafı eksik veri olduğunda imbalance normal. Sonraki analizde bu yapıyı baştan açıkla.
2. **Revenue tanımı kritik** — Parent-only (temettü + yönetim ücreti = ~2.76B TRY), Konsolide (12 ay = 2.76T TRY), Q4 standalone (802B TRY). Üçü aynı raporda birbirine karışmamalı.
3. **SOTP için GCM anchor** — GCM Şubat 2026 SOTP 406 TL güvenilir analistik baz; blended NAV (50% GCM + 50% piyasa) = ~388 TL. Holding discount drivers: ROE/Ke makas ~34pp, çapraz sahiplik ~5pp, ARCLK zararı ~3pp.
4. **TUPRS efektif pay** — KCHOL doğrudan %4.27 + EYAŞ aracılığıyla ~%36-40 = toplam ~%40.5-44.8. Yalnızca %26.2 doğrudan pay kullanmak SOTP'u hafife alır.

### CEO Direktifleri — Sonraki KCHOL Analizi İçin
- **KAP PDF script zorunlu ilk adım** — node scripts/fetch-pdf.js komutu çalıştırılmadan parse/reconciliation'a geçiş YASAK.
- **Revenue tanımı canonical fact pack'te üç satır** — (1) Solo/Parent, (2) Konsolide FY, (3) En son quarter. Üçü zorunlu, hiçbiri diğerinin yerine geçemez.
- **IFRS 8 için GCM SOTP kullan** — Faaliyet raporu PDF çekilemezse GCM/analist SOTP'undaki segment katkı rakamları proxy olarak kullanılabilir; "[analist proxy, conf: MEDIUM]" etiketiyle.

---

## CEO Post-Report Review — THYAO — 14 Nisan 2026

### Pipeline Sonucu
- **QA Final Score: 0.757** — Eşik 0.80. BLOCKED.
- **Temel bloker:** Cash Flow Statement tamamen eksik (conf: 0.00) → 3 QA turunda çözümsüz.
- **İkincil blokerlar:** D1 equity gap 141B TRY (SE tablosu yok), Working Capital BLOCKED (DSO/DIO/DPO/CCC).
- **Çözülen P0:** strategic_synthesis Round 2'de tamamlandı (KOŞULLU AL, 524 TRY hedef, 3-sütun tez).

### Sistemik Bulgular (Tekrar Eden Hatalar — THYAO'da da Çıktı)

| Sorun | Tekrar Sayısı (Toplam) | THYAO'daki Tezahür |
|-------|----------------------|--------------------|
| CF tablosu eksik | 4 (AKBNK, KCHOL, TUPRS, THYAO) | data_collection bitmeden output gönderdi |
| conditional_pass = BLOCK ihlali | 3 (TCELL, TUPRS, THYAO) | data_collection "CONDITIONAL PASS" verdi, pipeline açıldı |
| Working capital BLOCKED | 5+ rapor | CF yokken DSO/DIO/DPO/CCC tahmin ile devam |
| Output başlık/içerik uyuşmazlığı | İlk kez | financial_analysis başlıklı output = strategic_synthesis içeriği |
| Makro parametre tutarsızlığı | 2 (TUPRS, THYAO) | TCMB faizi %37 vs %46 — memory.md güncellenmemişti |
| Upstream validation context'ten yapıldı | 2 (TUPRS, THYAO) | Dosya sistemi kontrolü atlandı |

### Havacılık Sektörü Öğrenimleri (THYAO İlk Rapor)

1. **EBITDAR birincil metrik** — IFRS 16 nedeniyle havacılıkta EBITDA değil EBITDAR (+ rent/lease) peer karşılaştırması için zorunlu. Tüm sonraki havacılık analizleri için şablon güncellendi.
2. **8 KPI zorunlu ek** — RPK, ASK, CASK, RASK, Yield, Load Factor, Kargo ton-km, Filo sayısı — havacılık analizinin ayrılmaz parçası.
3. **IAS 29 havacılıkta sınırlı ama mevcut** — Gelir %70 USD/EUR → parasal kayıp sınırlı ama TRY maliyet kalemleri etkileniyor; ayrıştırma yapılmalı.
4. **Rusya üstgeçiş hakkı** — Avrupalı FSC rakiplerine (~$50-80M/yıl) kalıcı maliyet avantajı; macro_analysis Round 1'de truncation nedeniyle görülmedi. Havacılık şablonuna sabit eklendi.
5. **THYAO değerleme anomalisi netti** — EV/EBITDAR 2.52x vs peer median 4.4x = −43% iskonto; CF bloker çözülünce DCF güven artacak.

### CEO Direktifleri — Sonraki Havacılık Analizi İçin

- **THYAO veya herhangi bir havacılık şirketi** için CEO pre-flight direktifine havacılık KPI checklistini ekle: EBITDAR, RPK, ASK, CASK, RASK, LF, Hedging, Rusya üstgeçiş, EU ETS/CORSIA.
- **CF tablosu bloker kriterini sıkılaştır** — CF yokken parse_standardization ve reconciliation "BLOCKED" verecek; financial_analysis working capital bölümünü "BLOCKED" olarak bırakacak; tahmin üretmeyecek.
- **THYAO bir sonraki analizde** CF + SE tabloları ilk 30 dakikada çekilmeli; bu tamamlanmadan pipeline ilerleyemez.

---

## CEO Post-Report Review — BIMAS — 14 Nisan 2026

### Pipeline Sonucu
- **QA Final Score: 0.80** — Eşik 0.80. BLOCKED (REVISION_REQUIRED Tour 3).
- **Ana başarılar (Tour 1 → Tour 2):** FAVÖK 34,541 → 22,515 TRY mn düzeltildi ✓ | IAS29 59,845 → 21,622 düzeltildi ✓ | Share count 610M teyit edildi ✓ | Private label %54 hizalandı ✓ | ROE/ROCE/CAPEX-EBITDA eklendi ✓
- **Ana bloker (çözülmedi):** CF/SE tabloları 2 tur boyunca upstream'den gelmedi → Working capital (DSO/DIO/DPO/CCC), OCF, FCF, CF Check 3-5 BLOCKED.
- **Report formatter P0:** HTML yalnızca CSS içeriyor, body yok → 12 bölümden 1.5 bölüm teslim edildi.

### Sistematik Bulgular (BIMAS'a Özgü)

| Sorun | BIMAS'taki Tezahür |
|-------|-------------------|
| CF tablosu upstream bloker | 2 tur çözülmedi; data_collection KAP PDF script çalıştırmadı |
| Truncation | strategic_synthesis, macro_analysis, financial_analysis, context_extraction, event_classification, analyst_consensus, esg — hepsi kesildi |
| IAS29 optik-gerçeklik uçurumu | ROE %21.3 raporlanan vs %3.6 operasyonel — kritik divergence tespit edildi ✓ |
| HTML report formatter failure | Body content hiç üretilmedi (P0) |
| Share count çelişkisi | event_impact_mapper'da "1.2B shares" hatası Tour 2'de de kaldı |

### Perakende Sektörü — Kalıcı Öğrenim

1. **IAS29 perakendede kritik optik risk:** Yüksek enflasyon döneminde perakende-TÜFE endeksli gelir, IAS29 parasal kazancı şişirir. TÜFE %30→%16 normalizasyonunda net kâr dramatik düşer; bu dezenflasyon riski artık BIMAS şablonuna sabit eklendi.
2. **CF bloker perakendede çözüm yolu:** KAP'ta perakende firmaları için CF tablosu OCF = Net Kâr + D&A ± WC değişimleri formatında. BS bazlı WC tahmini (AR/AP/Stok değişimi) + income statement D&A → tahmini OCF. "[Tahmini, conf: MEDIUM]" etiketiyle verilebilir.
3. **SSSG CEO direktifine eklendi:** Perakende analizlerinde SSSG (aynı mağaza satış büyümesi) zorunlu metrik listesine dahil edildi. Her perakende analizinde bu metrik eksikse pipeline BLOCK.
4. **Özel marka oranı time-series:** Perakendeciler için özel marka oranı erozyon trendi (BIMAS: %65 → %54) brüt marj kalkanının proxy'si; 5 yıllık trend zorunlu.

### CEO Direktifleri — Sonraki Perakende Analizi İçin

- **Herhangi bir perakende şirketi (BIMAS, SOKM vb.) için CEO pre-flight ek kontrolleri:**
  - SSSG, Revenue per Store, Özel Marka Oranı, IFRS 16 normalize EBITDA
  - IAS29 etkisi: reported ROE vs operasyonel ROE ayrımı
  - Uluslararası segment (Fas/Mısır gibi) ayrı raporlama
  - CEO/GM dualitesi governance riski değerlendirmesi
- **CF tablosu bloker kriterini bir kez daha sıkılaştır:** KAP PDF'ten CF çekilemiyorsa data_collection BS+IS kombinasyonundan tahmini OCF üretecek; "[Tahmini, conf: MEDIUM]" etiketli. "BLOCKED" deyip pipeline durdurmak YASAK.
- **BIMAS bir sonraki analizde:** Q1 2026 sonuçları (~15 Mayıs) ve CEO kalıcı atama açıklaması iki kritik katalizör. Bu açıklamalar gelince delta-update analizi yapılacak.

## CEO Post-Report Review — 2026-04-14 — SAHOL Raporu

### Pipeline Sonucu
- **QA Skoru:** 0.738 (eşik 0.85) — REVISION_REQUIRED
- **Delivery:** BLOCKED (reconciliation CONDITIONAL_PASS + QA eşik altı)
- **Tur Sayısı:** 2 revizyon turu; Tur 3 için CEO direktifi bekleniyor

### Kritik Sistem Sorunları (Tekrarlanmamalı)

1. **CONDITIONAL_PASS sızıntısı:** Reconciliation CONDITIONAL_PASS verdi; QA bunu FAIL'e çevirmedi; COO yakaladı ama teknik direktif CEO'ya eskalasyon yerine kendisi yazdı. **Fix:** QA otomatik kuralı — reconciliation=CONDITIONAL_PASS → QA skoru ne olursa FAIL.

2. **Holding analizi için IS zinciri boş teslim edildi:** Parse_standardization revenue 195B (segment kısmı) ve EBITDA 50,577M (9A veri) ile yanlış etiketle teslim etti. Cascade hata tüm downstream'i sarstı. **Fix:** Holding analizi pre-flight'ta parse'dan "revenue coverage %100 mı?" kontrol adımı eklenmeli.

3. **Chairman metrikleri eksik:** DSO, DIO, DPO, CCC, NWC, ROCE, ROIC, Cash FAVÖK hiçbiri financial_analysis çıktısında yoktu. **Fix:** financial_analysis için zorunlu metrik kontrol listesi QA gate'e eklenecek; herhangi bir eksik = P0 FAIL.

4. **Truncation salgını:** Bölüm 4.2 (context_extraction), SWOT (sector_competition), DIV-2 (strategic_synthesis), skor kartı (final_summary), Parça 2 (valuation), timeline bölüm 1 (event_timeline_alert) — 6+ agent çıktısı kesildi. **Fix:** Her agent "output tamamlandı / truncation riski" kontrolü yapacak; kesme yerine 2 mesaj protokolü.

5. **Veri kalitesi 0.46 ile başladı** — upstream verification yetersiz. Holding analizi için data_collection'a ek süre ve "segment CAPEX gerçek veriden" direktifi verilmeli.

### Sonraki SAHOL / Holding Analizi İçin CEO Direktifleri

- **Holding pre-flight zorunlu ek kontroller:** SOTP için her iştirak stake %, son kapanış fiyatı, piyasa değeri tablosu — başlamadan önce.
- **CONDITIONAL_PASS = otomatik FAIL:** QA kuralına işlenecek; istisna yok.
- **Chairman'ın 25 metrik listesi QA kontrol listesine eklendi:** Eksik metrik → P0 → FAIL.
- **Truncation protokolü:** >3000 token çıktı riski olan bölümler bölünecek; kesme YASAK.

---

## CEO Feedback Loop Özeti — KCHOL Delta — 14 Nisan 2026

### Tüm Agent Memory'leri Güncellendi
Bu feedback loop tamamlandı. Aşağıdaki sistemik sorunlar 22 agent memory'sine yazıldı:

### Pipeline Geneli Kök Nedenler (Çözülmeden Kapanmamalı)

| # | Kök Neden | Etkilenen Agent Sayısı | Cascaded Etki |
|---|-----------|----------------------|--------------|
| 1 | **Revenue Q4/FY karışıklığı** — 802.669B = Q4, FY = 2.76T | data_collection → financial_analysis → reconciliation → valuation → final | FAVÖK marjı, ROE, net kar marjı hepsi yanlış hesaplandı |
| 2 | **KAP PDF script çalıştırılmadı** | data_collection (3. kez) | IFRS 8, ticari alacak, tam bilanço elde edilemedi |
| 3 | **IFRS 8 segment EBITDA %0** | data_collection, parse_standardization | Holding valuation analist SOTP'a mecbur kaldı |
| 4 | **Truncation salgını** | macro_analysis, sector_competition, strategic_synthesis, final_summary, event_impact_mapper, event_timeline_alert | Kritik bölümler (DIV-3, FROTO makro, BUY/SELL trigger) görünemedi |
| 5 | **Report formatter HTML body eksik** | report_formatter (BIMAS + KCHOL = 2. kez) | PDF render başarısız; COO REVISION_NEEDED |

### Yeni Holding-Spesifik Kurallar (Sonraki KCHOL / Holding Analizi İçin)

1. **Revenue üç katmanlı doğrulama ZORUNLU** — Canonical fact pack'e girmeden önce: (a) Solo/Parent geliri kaynağı nedir? (b) Konsolide FY 12 aylık mı? (c) En son quarter kaç aylık? Üçü ayrı satır, kaynak referanslı.
2. **Banka konsolidasyonu balance sheet imbalance açıklaması** — YKBNK tam konsolidasyon → bilanço aktif 5.3T TRY; liabilties +equity eksik veri durumunda imbalance yapısaldır. Her KCHOL analizinin başında bu açıklamayı koy.
3. **TUPRS efektif pay ~%40.5** (KCHOL %4.27 + EYAŞ dolaylı ~%36) her analizde; yalnızca doğrudan %26.2 kullanmak SOTP'u hafife alır.
4. **GCM SOTP anchor** (406 TL, Şubat 2026) — faaliyet raporu PDF yokken en güvenilir NAV tahmini; "[analist proxy, conf: MEDIUM]" etiketiyle kullanılabilir.

### QA İstatistikleri — KCHOL Pipeline Genel Bakış

| Tur | QA Skoru | Ana İlerleme | Açık P0 |
|-----|----------|-------------|---------|
| Round 1 | 0.590 | İlk tarama | 4 bloker |
| Round 2 | 0.676 | Revenue Q4/FY tanımlandı ama yanlış çözüldü | 3 bloker |
| **Hedef (Round 3)** | **≥ 0.80** | **KAP PDF + Revenue FY + IFRS 8 proxy** | **0 bloker** |

### Feedback Loop Tamamlama Kaydı
- **Tarih:** 14 Nisan 2026
- **Güncellenen memory sayısı:** 22 (data_collection, parse_standardization, reconciliation, context_extraction, financial_analysis, sector_competition, macro_analysis, technical_analysis, kap_watch, event_classification, event_impact_mapper, event_timeline_alert, qa_review, strategic_synthesis, final_summary, valuation_agent, sentiment_news_agent, analyst_consensus_agent, esg_agent, report_formatter, coo, ceo)
- **Yeni kural sayısı eklendi:** ~65 kural (22 agent × ortalama ~3 kural)
- **Bir sonraki analiz:** Round 3 için KAP PDF script zorunlu ilk adım; revenue canonical doğrulama pre-flight'ta

---

*Arsiv: memory_archive.md | Heartbeat loglari: heartbeat_archive.md*
*Dosya sahibi: CEO Meta-Agent | Denetleyen: Chairman*
