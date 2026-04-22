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

**KRITIK SORUNLU:** parse_standardization (ticari borc Not hatasi, FY sütun kayması), technical_analysis (MACD/VWAP/Bollinger sistematik eksik), event_classification (EPDK macro_regulatory_event atlıyor, CBAM trade_regulatory_event eksik)

**IYILESIYOR:** financial_analysis (Not 8 ticari borc doğru kullandı ✓, upstream hata yakalamada güçlü), reconciliation (net borç formülü doğru ✓, IAS29 adjusted NI hesaplandı ✓)

**IYI:** kap_watch (12 aylık envanter eksiksiz), event_impact_mapper (EPDK haritalandı ✓, portfolio net FCF doğru ✓), valuation_agent (TRY WACC tuzağından kaçındı ✓, 3 bölümlü çalışma ✓), report_formatter (12/12 bölüm, 6 SVG, brand identity ✓)

**ORTA:** strategic_synthesis (divergence haritası önce ✓; SWOT/BUY-SELL trigger/Bull-Bear full quantification eksik), data_collection (FY2021-2023 seri eksikliği), sector_competition (quartile dağılım tablosu ve peer kaynak eksik), esg_agent (CDP araması yapılmadı, ETS hesabı yok), macro_analysis (jeopolitik eksik, AB Safeguard sayısal hesap yok)

---

## Son 3 Raporun Ogrenimleri

### EREGL Deep Dive (15-16 Nisan) — QA 0.80, CONDITIONAL_PASS → CEO OVERRIDE → APPROVED
- **Tur 1** (13 Nisan): QA ~0.45, REJECT — parse EBITDA %66 fazla, net kar 27.5x fazla, net borc yanlis, EPDK +%18.61 event_impact_mapper'da YOK.
- **Tur 2** (15-16 Nisan): P0/P1 tamamen cozuldu (8/8). QA 0.80 — CONDITIONAL_PASS → normalde BLOCK.
- **CEO Override:** DISC-004 (ticari borc parse 19,628mn vs Not 8 68,762mn) P2 olarak acik kaldi; financial_analysis dogru degeri kullandigi icin analiitk etki SIFIR. Override COND-1..4 ile onaylandi.
- **Kilitli Fact Base:** Net Borc 42,864mn [Not 7] | EBITDA 20,452mn | FCF 49,717mn | EV/EBITDA 12.01x | Bear/Baz/Bull 15.7/28.4/42.2 TRY
- **Chairman Checklist:** 15/15 PASS

**Post-Report CEO Review Bulguları (16 Nisan 2026):**
- Ders 1: financial_analysis upstream hatayı web doğrulamayla yakaladı ✓ — bu katmanın değeri yüksek.
- Ders 2: parse BS ticari borç Not 8'den doğrulanmadan kabul edilmemeli; DISC-004'ün kalıcı kaynağı bu.
- Ders 3: IAS29 materiality — Net Kar/NI > 30% tetikleyici olarak zorunlu (EREGL'de 126.2% → tetiklendi ✓).
- Ders 4: FY2021-2023 veri eksikliği sistematik sorun; 5 yıllık seri data_collection pre-flight'ında zorunlu kontrol.
- Ders 5: Teknik analiz MACD/VWAP/Bollinger sistematik "[VERİ YOK]" — alternatif kaynak protokolü (4 kaynak) uygulanmadı.
- Ders 6: event_classification EPDK + CBAM'ı otomatik atladı — çelik analizinde macro_regulatory + trade_regulatory pre-flight zorunlu.
- Ders 7: strategic_synthesis SWOT + BUY/SELL trigger + Bull/Baz/Bear full quantification eksik kaldı — her çelik raporunda bu 3 bölüm zorunlu.
- Ders 8: ESG/CDP araması + Türkiye ETS hesabı + CBAM proxy hesabı her çelik raporunda zorunlu.
- **P2-001 Acik:** parse_standardization Not 8 ticari borç düzeltmesi — sonraki EREGL analizinden önce kapatılmalı.

### TUPRS (12 Nisan) — QA 0.618, PARTIAL RECOVERY
- event_timeline_alert upstream output varken "eksik" dedi → dosya varligi kontrolu sart.
- financial_analysis bolum 1-9 pipeline'a girmedi. valuation tek seferde crash (exit 143) → 3 parca.
- **Iyi:** kap_watch 12 aylik envanter, data_collection 0.91, esg CDP A- tespiti.

### TCELL Delta (11 Nisan) — QA 0.84, CONDITIONAL PASS
- Delta-update stratejisi basarili: gap-focused deep execution > genis scope shallow.
- Upstream guclendirme ise yaradi (input validation + [pending] yasagi). Truncation hala sorun → cift output uygulanacak.

---

## Son Heartbeat — 2026-04-21 TSİ (Otonom Döngü #130)
- Checked memory: [veri kaynağı kuralları, heartbeat özet limiti, kalıcı kurallar, takvim].
- **KAP Erişim:** JS-render engeli devam. Bildirim listesi alınamadı (sistematik sorun).
- **WTI:** $90.06 (+3.02%, Haz-26 kontr.) — Önceki döngü $82.59'dan ~+%9 artış. İran müzakere gerilimi Pazartesi petrolü yukarı taşıdı. TUPRS crack spread izlenmeli.
- **BIST100:** 14,375 (-0.76%) — Pazartesi kapanışı, temkinli seyir. PPK öncesi bekle-gör modu.
- **EREGL:** 33.72 (+1.26%) — 17 Nisan 32.04'ten +%5.2. 52H high 34.48'e yaklaşıyor. Q1 earnings 2 gün sonra (23 Nisan).
- **TUPRS:** Fiyat alınamadı (404). WTI +%9 hareketi göz önünde bulundurularak izlenecek.
- **Takvim (KRİTİK):** PPK **YARIN 22 Nisan** | EREGL Q1 earnings **23 Nisan**.
- **Olağandışı:** WTI $82→$90 sıçraması (+%9) dikkat çekici. İran 2. tur müzakere reddi Pazartesi petrolü sertçe yukarı taşıdı. TUPRS'ta negatif maliyet baskısı riski var. EREGL 52H zirveye yakın, earnings beklentisi yüksek.
- P0/P1 yok. **Chairman ALERT: HAYIR.**

## Önceki Heartbeat — 2026-04-19 TSİ (Döngü #129) [→ Archive]
- Bkz. heartbeat_archive.md. WTI $82.59 (-11.45%), BIST pazar kapalı, PPK 22 Nisan / EREGL earnings 23 Nisan takvimi teyit edildi.

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
