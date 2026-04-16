# CEO Agent — Kalıcı Kurallar

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

## Agent Performans Ozeti

**KRITIK SORUNLU:** parse_standardization (parse hatalari, kendini SUCCESSFUL ilan ediyor), reconciliation (hatali veri onayliyor), qa_review (tespit iyi, pipeline durdurma yok), valuation_agent (timeout crash), report_formatter (cogu raporda calismadi), final_summary (icerik sig, truncation), event_impact_mapper (EPDK gibi kritik olaylari kaciriyor)

**IYILESIYOR:** financial_analysis (TCELL-delta'da duzeltildi; upstream hata yakalama iyi), data_collection (0.91 guven; tarihsel veri zayif)

**IYI:** macro_analysis (jeopolitik guclu), technical_analysis (Fib+MA+RSI), context_extraction (SOTP/ESG), kap_watch, event_timeline_alert, sector_competition (CBAM/peer)

---
*Bu dosya her çalışmada otomatik yüklenir. Değişiklik yapmadan önce CEO onayı alın.*
