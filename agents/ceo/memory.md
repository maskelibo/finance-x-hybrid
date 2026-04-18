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

## CEO Post-Report Review — 2026-04-16 — KCHOL Delta-Update

### Pipeline Özeti
- **Oturum:** kchol-delta-20260416 | **QA Skoru:** 0.658 (2 tur, eşik altı) | **Teslim:** BLOCKED
- **Temel Blokerlar:** report_formatter exit 143 (HTML boş) + valuation_agent SOTP formal output teslim edilmedi + event_timeline_alert 2 tur DEGRADED
- **İyi Çalışan:** data_collection (FY2025/2024 tam, IAS29 ayrıştırması ✓, net borç doğru formül ✓), macro_analysis (TCMB/TÜFE/FX/İran-ABD/Fitch tümü), kap_watch (12 ay envanter ✓), context_extraction (brand identity ✓, CEO mektubu ✓)

### Kritik Dersler

1. **report_formatter exit 143 = context overflow → sistematik çözüm** — Final summary + tüm upstream çıktıları tek seferde formatter'a geçirilmesi YASAK. Çözüm: Formatter'a maksimum ~8000 token; önce kritik bölümler (Yönetici Özeti + Skor Kartı + Hedef Fiyat), sonra detaylar.

2. **Valuation SOTP formal output = ayrı downstream mesajı** — case_lessons.md güncellemesi ≠ SOTP output iletme. 6 iştirak × NAV katkısı tablosu ayrı mesajla downstream'e (QA + final_summary) gönderilmeliydi. Bir sonraki KCHOL analizinden önce bu protokol net.

3. **Holding analizinde 3 tur acık eskalasyon = pipeline riski** — ESK-001/003/004 açık kaldı. Data quality 0.69 ile "output bloklanmadı" kararı verildi; ama 3 açık eskalasyonla final approved figure yayımlamak downstream'de 5+ agent zincirini kirletiyor. Bir sonraki analizde: >2 açık eskalasyon = CEO teyidi olmadan downstream PASS yok.

4. **Sector_competition truncation holding için kritik** — YKBNK bölümünde kesildi; 5 segment analizi yapılamadı. Holding analizinde sector_competition zorunlu 6 segment; truncation = skor kartı segment boyutu güvenilmez.

5. **Macro_analysis Rusya-Ukrayna eksikliği** — KCHOL'da EREGL (çelik arz) ve TUPRS (enerji) segmentleri Rusya-Ukrayna'ya maruz; bu faktör atlandı. Chairman listesinde "Rusya-Ukrayna etkisi" açık yazıyor; bir daha atlanmayacak.

6. **Technical_analysis MACD/VWAP/Bollinger 2. tur tekrar** — KCHOL 2. kez aynı eksiklik; artık sistematik. Investing.com + Bigpara teknik sayfaları zorunlu ilk kaynak olarak pre-flight'a eklendi.

### Açık Kalemler (Bir Sonraki KCHOL Analizine)
- P0: Faaliyet Raporu 1561073 fetch edilmeli (solo bilanço + segment notları + interest expense)
- P0: Valuation SOTP formal output formatı netleştirilmeli
- P1: KAP 1383079 içerik doğrulaması
- P1: FY2023 CF/SE çekilmeli (seri kırığı)
- P1: DISC-004 → KCHOL Not 8 ticari borç

### Performans İzleme (Güncel)
- **KRITIK SORUNLU:** report_formatter (exit 143 tekrar), valuation_agent (SOTP teslim etmedi), event_timeline_alert (DEGRADED 2 tur), technical_analysis (MACD/VWAP/Bollinger sistematik)
- **GELİŞMESİ GEREKEN:** parse_standardization (DISC-004 KCHOL'a uygulanmadı), sector_competition (truncation + quartile eksik), strategic_synthesis (SWOT + BUY/SELL trigger + Bull/Bear full quant eksik)
- **İYİ:** data_collection (IAS29 ✓, net borç ✓), reconciliation (7 check sistematik ✓), macro_analysis (tüm faktörler ✓ sadece Rusya-Ukrayna eksik), kap_watch (12 ay envanter ✓), event_impact_mapper (portfolio heatmap ✓)

## CEO Post-Report Review — 2026-04-16 — THYAO Delta-Update

### Pipeline Özeti
- **Oturum:** thyao-delta-20260416 | **QA Skoru:** 0 (FAIL) | **Teslim:** COO "approved" verdi — HATALI KARAR
- **Temel Blokerlar:** financial_analysis çalışmadı (cascade: sector_competition boş, strategic_synthesis eksik, qa_review score 0) | macro_analysis kritik veriler null | event_impact_mapper LLM katkısız | report_formatter 7KB HTML
- **İyi Çalışan:** context_extraction (brand identity, şirket profili kapsamlı ✓), kap_watch (119 disclosure listelendi ✓), technical_analysis (MA/RSI/MACD/Bollinger temel indikatörler ✓), final_summary (P0 uyarı notu var ✓)

### Sistematik Hata: Pipeline Başarısızlık Zinciri
Bu analizde tek bir köklü hata (financial_analysis çalışmadı) 6 downstream agent'ı bozdu:
1. financial_analysis → ÇALIŞMADI
2. sector_competition → "industrial" fallback, peer_group: [], benchmarks: []
3. qa_review → score 0, "cannot score"
4. strategic_synthesis → convergence_score: 0, recommendation: yok
5. event_impact_mapper → "Python template only", LLM katkı: 0
6. report_formatter → 7KB HTML
7. COO → QA FAIL görmezden, "approved" kararı ❌ (en kritik hata)

### Kritik Dersler

1. **financial_analysis çalışmadığında pipeline KESİLMELİ** — financial_analysis çıktısı gelmezse COO ve CEO re-run talep etmeli; cascade beklenmemeli. Alternatif: financial_analysis PENDING iken diğer katmanlar (context, event chain, technical) çalışır ama final output GÖNDERİLMEZ.

2. **COO "approved" kararı QA FAIL'i geçemez** — QA score 0 → COO kararı ne olursa olsun BLOCKED. Bu kuralın COO kodu seviyesinde zorlanması şart. `override_authority: ceo_only` — COO override yetkisi yok.

3. **sector_competition "industrial" fallback = P1 BLOKER** — Ticker bilinmiyorsa "unknown" yaz, "industrial" değil. THYAO → aviation; bu tanım ticker'dan triviyal. sector_competition'ın sektör tespiti için kural: "THYAO, PEGYS, ONUIR = aviation; TUPRS, BIMAS = diğer" hardcoded mapping.

4. **event_impact_mapper "Python template only" = geçersiz çıktı** — LLM katkısız impact mapping kabul edilemez. Bu etiket görünürse pipeline bu agent'dan çıktıyı PENDING say.

5. **event_timeline_alert tüm olayları medium_term atadı** — CEO değişimi + İran rotaları = IMMEDIATE. Urgency kalibrasyonu: CEO/YK değişimi = HIGH + IMMEDIATE. Bu havacılık analizinin en temel timeline kuralı.

6. **Makro analiz sıfır veri üretimini önlemek için fallback protokolü gerekli** — EVDS key yoksa WebSearch → TCMB basın bülteni → Bloomberg HT. Null bırakmak YASAK.

### Açık Kalemler (Sonraki THYAO Analizine)
- P0: financial_analysis re-run — CF tablosu + WC metrikleri (DSO/DIO/DPO/CCC) + IFRS 16 kira detayı
- P0: sector_competition — "aviation" sektörü, standart peer grubu (Lufthansa/IAG/Wizz/Delta/flydubai)
- P1: Yeni CEO Ahmet Olmuster profili ve stratejik ilk sinyaller (Q1 2026 sonrası)
- P1: İran-ABD jeopolitik son durum — rotalar tekrar açıldı mı?
- P1: Mayıs 2026 Q1 sonuçlarının takibi (EBITDAR marjı, yolcu büyümesi)

### Performans İzleme — THYAO Delta Sonrası
- **KRİTİK SORUNLU:** financial_analysis (çalışmadı), sector_competition (fallback hatası, boş output), event_impact_mapper (LLM katkısız), event_timeline_alert (faz kalibrasyonu yanlış), macro_analysis (null değerler), COO (QA FAIL geçirdi)
- **GELİŞMESİ GEREKEN:** report_formatter (7KB → min 50KB), qa_review (kısmi skor üretmedi), strategic_synthesis (HOLD-INSUFFICIENT DATA yazmadı)
- **İYİ:** context_extraction (brand identity + şirket profili ✓), kap_watch (119 disclosure ✓), technical_analysis (temel indikatörler ✓), final_summary (P0 uyarı notu ✓)

## CEO Post-Report Review — 2026-04-16 — THYAO Standard Institutional

### Pipeline Özeti
- **Oturum:** thyao-standard-20260416 | **QA Skoru:** 0.96 (ŞİŞİRİLMİŞ — gerçek kapsam ~2/45 metrik) | **Teslim:** COO BLOCKED ✓ (HTML_ENVELOPE + SPK_DISCLAIMER eksik)
- **Temel Blokerlar:** report_formatter HTML envelope + SPK disclaimer eksik (COO doğru bloke etti ✓) | financial_analysis 22/28 metrik null | sector_competition "industrial" + peer_group boş (3. kez) | event_impact_mapper "Python template only" (2. THYAO) | EBITDA/EBITDAR null
- **İyi Çalışan:** COO BLOCKED kararı (önceki delta'dan iyileşme ✓), technical_analysis (MA/RSI/MACD/Bollinger ✓), final_summary yapı (12 bölüm + skor kartı + chart tag'leri ✓), kap_watch (119 disclosure ✓)
- **Önceki Rapordan İyileşme:** COO delta'da QA FAIL'i geçirmişti; bu sefer HTML_ENVELOPE/SPK_DISCLAIMER üzerinde BLOCKED verdi. Bu tek büyük iyileşme.

### Agent Performans — THYAO Standard Sonrası (17 Agent)

| Agent | Durum | Ana Sorun |
|---|---|---|
| data_collection | GELİŞMESİ GEREKİYOR | D&A/IFRS16 ROU/5 yıllık seri eksik |
| parse_standardization | KRİTİK SORUNLU | EBITDA null, D&A null, investing CF null, SE boş |
| reconciliation | ORTA | 3/7 check atlandı, IFRS 16 Net Borç formülde yok |
| context_extraction | GELİŞMESİ GEREKİYOR | Yeni CEO profili yok (3. direktif), TVF oranı tahmini, Net FX sayısalsız |
| financial_analysis | KRİTİK SORUNLU | 6/28 metrik, EBITDAR null (3. direktif), sektör "industrial" |
| sector_competition | KRİTİK SORUNLU | "industrial" (3. kez), peer_group [] (3. kez), sıfır benchmar |
| macro_analysis | KRİTİK SORUNLU | TCMB/CPI/PPI/GDP/BIST100 null, İran-ABD mekanizması yok |
| technical_analysis | İYİ | MA/RSI/MACD/Bollinger mevcut ✓; BIST100 rel. perf. eksik |
| kap_watch | ORTA | 119 disclosure ✓ ama is_material null tümü (3. kez) |
| event_classification | KRİTİK SORUNLU | is_material null tümü, İran/Brent sınıflanmadı |
| event_impact_mapper | KRİTİK SORUNLU | "Python template only" (2. THYAO), sıfır nicelik |
| event_timeline_alert | KRİTİK SORUNLU | Tümü medium_term+low (standart'ta da tekrarlandı, 2. kez) |
| qa_review | KRİTİK SORUNLU | 0.96 şişirilmiş skor; 2/45 metrik kontrol, 3 yeni kural kaçırıldı |
| strategic_synthesis | KRİTİK SORUNLU | Goldman yapısı yok, SWOT yok, BUY/SELL trigger yok, öneri yok |
| final_summary | ORTA | Yapı güçlü ✓; hedef fiyat boş, KPI tablosu yok (3. direktif) |
| report_formatter | GELİŞMESİ GEREKİYOR | HTML_ENVELOPE/SPK_DISCLAIMER eksik; COO doğru bloke etti |
| COO | İYİ | BLOCKED kararı doğru ✓ (delta'dan iyileşme) |

### Kritik Dersler

1. **"3. kez aynı hata" = sistematik arıza, bireysel hata değil** — sector_competition "industrial"/boş peer, event_impact_mapper "Python template", event_timeline_alert urgency kalibrasyonu — bunlar 3 THYAO raporunda tekrarlandı. Bir sonraki THYAO analizinden önce bu 3 agent'ın sektör hardcoding'i, LLM routing ve urgency calibration'ı CEO seviyesinde doğrulanmalı.

2. **QA skor şişirmesi zinciri kırdı** — 0.96 QA skoru ile pipeline devam etti; COO HTML_ENVELOPE kontrolü sayesinde durdu. QA 45-metrik satır satır kontrol etmeden skor veremez. QA score > 0.85 için gerçek eşik: 4 kapı + sektöre özgü 3 ek kapı + 45 metrik > %80 kaplı.

3. **EBITDAR eksikliği havacılık analizini geçersiz kılar** — EBITDAR = havacılık analizinin merkezi metriği. 3 rapordur direktif verildi; hâlâ null. Bu THYAO'ya özgü parser kuralı gerektiriyor: EBITDAR = EBIT + D&A + Kira Giderleri (IFRS 16 öncesi). parse_standardization'a özel havacılık hesap alanı eklenecek.

4. **COO pre-flight listesine delivery kontrolleri eklendi** — HTML_ENVELOPE + SPK_DISCLAIMER + min 50KB payload kontrolü COO delivery checklist'te olmalı; QA'nın 5. boyutu olarak da eklenmeli. "Yapısal kalite" ve "teslim kriterleri" ayrı kontrol katmanı.

5. **Context_extraction yeni CEO profili = havacılık analizinin governance ayağı** — 9 Nisan 2026 CEO değişimi IMMEDIATE P0; context'in bunu içermemesi "Yönetim Kalitesi" skor kartı boyutunu temelsiz bırakıyor. CEO atamalarında context 4-madde profil üretmeden çıktı tamamlanmış sayılmayacak.

### Açık Kalemler (Sonraki THYAO Analizine)
- P0: EBITDAR hesaplaması — parse_standardization'a IFRS 16 kira gideri ayrıştırma kuralı
- P0: sector_competition "aviation" hardcoded mapping doğrulaması
- P0: event_impact_mapper LLM routing düzeltmesi ("Python template" önlemi)
- P1: Yeni CEO Ahmet Olmüster profili — context_extraction zorunlu çıkarım
- P1: Mayıs 2026 Q1 sonuçları takibi (EBITDAR marjı, pax büyümesi, yeni CEO ilk rehberi)
- P1: event_timeline_alert urgency calibration — CEO/İran rotaları = IMMEDIATE HIGH

## CEO Post-Report Review — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Pipeline Özeti
- **Oturum:** thyao-remediation-20260416 | **QA Skoru:** 0.96 (ŞİŞİRİLMİŞ) | **Teslim:** COO BLOCKED ✓ (HTML_ENVELOPE + SPK_DISCLAIMER eksik — doğru karar)
- **İyi Çalışan:** COO BLOCKED kararı ✓, technical_analysis (MA/RSI/MACD/Bollinger ✓), kap_watch (119 disclosure ✓), final_summary yapı (12 bölüm + skor kartı ✓)
- **Kritik Sorunlar:** financial_analysis (6/28 metrik), sector_competition ("industrial" + boş peer — 3. kez), event_impact_mapper ("Python template" — 2. kez), event_timeline_alert (tümü medium_term+low — 2. kez), qa_review (0.96 şişirilmiş — 3. kez), macro_analysis (null değerler — 3. kez), EBITDAR null (3. kez)

### Agent Performans Değerlendirmesi

| Agent | Durum | Ana Sorun |
|---|---|---|
| data_collection | GELİŞMESİ GEREKİYOR | D&A/IFRS16 ROU/5 yıllık seri eksik |
| parse_standardization | KRİTİK SORUNLU | EBITDA null, D&A null, investing CF null, SE boş |
| reconciliation | ORTA | pass_rate 1.0 yanıltıcı (%57 gerçek), IFRS 16 Net Borç formülde yok |
| context_extraction | GELİŞMESİ GEREKİYOR | Yeni CEO profili yok (3. direktif), TVF tahmini, Net FX sayısalsız |
| financial_analysis | KRİTİK SORUNLU | 6/28 metrik, EBITDAR null (3. direktif), sektör "industrial" |
| sector_competition | KRİTİK SORUNLU | "industrial" (3. kez), peer_group [] (3. kez), sıfır benchmark |
| macro_analysis | KRİTİK SORUNLU | TCMB/CPI/PPI/GDP/BIST100 null (4. direktif), İran-ABD mekanizması yok |
| technical_analysis | İYİ | MA/RSI/MACD/Bollinger ✓; BIST100 rel. perf. null, insider tarama yok |
| kap_watch | ORTA | 119 ✓; is_material null tümü (3. kez), forward takvim yok |
| event_classification | KRİTİK SORUNLU | is_material null tümü (3. kez), İran/Brent macro_event yok |
| event_impact_mapper | KRİTİK SORUNLU | "Python template only" (2. THYAO), sıfır nicelik |
| event_timeline_alert | KRİTİK SORUNLU | Tümü medium_term+low (2. kez); 4-phase execution yok |
| qa_review | KRİTİK SORUNLU | 0.96 şişirilmiş (3. kez); 3 yeni kural kaçırıldı |
| strategic_synthesis | KRİTİK SORUNLU | Goldman yapısı yok, SWOT yok, BUY/SELL trigger yok, öneri yok |
| final_summary | ORTA | Yapı güçlü ✓; hedef fiyat boş, KPI tablosu yok (3. direktif) |
| report_formatter | GELİŞMESİ GEREKİYOR | HTML_ENVELOPE/SPK_DISCLAIMER eksik; ~8KB (50KB direktifi 4. kez ihlali) |
| COO | İYİ | BLOCKED kararı doğru ✓ |

### Sistematik Tekrar Hataları — 3+ Direktif İhlali

1. **sector_competition "industrial" → 3. THYAO** — Ticker-based hardcoding şart; artık code-level override gerekiyor
2. **event_impact_mapper "Python template" → 2. THYAO** — LLM routing düzeltmesi P0; COO pre-delivery check listesine eklendi
3. **event_timeline_alert medium_term fallback → 2. THYAO** — CEO/İran = IMMEDIATE HIGH; urgency calibration code-level düzeltme şart
4. **qa_review skor şişirmesi → 3. THYAO** — 45-metrik satır satır kontrol olmadan skor = geçersiz; 7-kapı sistemi kalıcı
5. **is_material null → 3. THYAO (kap_watch + event_classification)** — COO delivery check: is_material null varsa geri çevir
6. **macro_analysis null değerler → 4. direktif** — EVDS yoksa 3-kaynak fallback zorunlu; null = otomatik FAIL
7. **EBITDAR null → 3. THYAO** — parse_standardization'a IFRS 16 kira gideri özel havacılık kuralı zorunlu

### Açık Kalemler (Sonraki THYAO Analizine)
- P0: EBITDAR hesaplaması — parse_standardization'a IFRS 16 kira gideri ayrıştırma kuralı (3. direktif, artık hard bloker)
- P0: sector_competition "aviation" hardcoded mapping — code-level doğrulama gerekli
- P0: event_impact_mapper LLM routing — "Python template" önleme mekanizması
- P1: Yeni CEO Ahmet Olmüster profili — context_extraction zorunlu 4-madde profil
- P1: Mayıs 2026 Q1 sonuçları takibi (EBITDAR marjı, pax büyümesi, yeni CEO rehberi)
- P1: COO delivery check listesi güncellemesi — is_material null + medium_term fallback + 50KB kontrolü

### Performans İzleme (THYAO Standard Sonrası — Güncel)
- **KRİTİK SORUNLU:** sector_competition (3 rapor boyunca "industrial"+boş peer), event_impact_mapper (LLM katkısız), event_timeline_alert (urgency kalibrasyonu bozuk), macro_analysis (null değerler sistematik), parse_standardization (EBITDA/D&A/CF null), qa_review (skor şişirme)
- **GELİŞMESİ GEREKEN:** financial_analysis (6/28 metrik), data_collection (D&A/IFRS16/5yıllık seri), context_extraction (CEO profili, net FX), final_summary (hedef fiyat + KPI tablosu), report_formatter (HTML envelope/SPK disclaimer)
- **İYİ:** COO (BLOCKED kararı doğru ✓), technical_analysis (temel indikatörler ✓), kap_watch (hacimli disclosure ✓), reconciliation (net borç formülü ✓)

## CEO Post-Report Review — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Oturum Özeti
- Mod: Standard Institutional
- COO Kararı: BLOCKED (HTML_ENVELOPE + SPK_DISCLAIMER eksik) ✓ — doğru karar
- QA Skoru: 0.96 bildirildi — gerçekte ~0.05 (2/45 metrik)
- Analiz Tamamlama: Kısmi — final_summary üretildi, hedef fiyat blank, EBITDA null zinciri tüm pipeline'ı etkiledi

### Agent Performans Tablosu (thyao-full-20260416)

| Agent | Değerlendirme | Ana Sorun | Tekrar Sayısı |
|---|---|---|---|
| coo | ✅ İYİ | BLOCKED kararı doğru | — |
| data_collection | ❌ BAŞARISIZ | D&A null, IFRS16 yok | 3. THYAO |
| parse_standardization | ❌ BAŞARISIZ | EBITDA/D&A/CF null | 3. THYAO |
| reconciliation | ⚠️ KISMI | pass_rate yanıltıcı, IFRS16 net borç dışı | 3. THYAO |
| context_extraction | ⚠️ KISMI | CEO profili yok, net FX null | 3. THYAO |
| financial_analysis | ❌ BAŞARISIZ | 6/28 metrik, "industrial" sektör | 3. THYAO |
| sector_competition | ❌ BAŞARISIZ | "industrial", boş peer | 3. THYAO |
| macro_analysis | ❌ BAŞARISIZ | Tüm makro null | 3. THYAO |
| technical_analysis | ✅ İYİLEŞME | MA/RSI/MACD ✓; RS/hacim/Fibonacci eksik | İyileşiyor |
| kap_watch | ⚠️ KISMI | 119 bildirim ✓; is_material null | 3. THYAO |
| event_classification | ❌ BAŞARISIZ | is_material null, İran/Brent sınıflandırılmadı | 3. THYAO |
| event_impact_mapper | ❌ BAŞARISIZ | "Python template only" — LLM çıktısı yok | 2. THYAO |
| event_timeline_alert | ❌ BAŞARISIZ | Tüm medium_term+low urgency | 2. THYAO |
| qa_review | ❌ BAŞARISIZ | 0.96 şişirilmiş skor (2/45) | 2. THYAO |
| strategic_synthesis | ❌ BAŞARISIZ | Tavsiye yok, Goldman yok, SWOT yok | 1. (upstream bağımlı) |
| final_summary | ⚠️ KISMI | Yapı ✓; hedef fiyat blank, KPI tablosu yok | 3. THYAO KPI |
| report_formatter | ❌ BAŞARISIZ | HTML envelope yok, SPK yok, 8KB | 3. THYAO |
| ceo | ✅ DÖNGÜ TAMAMLANDI | Post-report feedback loop çalıştı | — |

### P0 Açık Maddeler — Bir Sonraki THYAO Analizi İçin

1. **[P0] EBITDAR parse kuralı** — D&A + IFRS16 ROU amortismanı data_collection → parse_standardization zincirinde; 4. analizde null gelmesi tolerans dışı.
2. **[P0] sector_competition aviation hardcoding** — THYAO = aviation; upstream "industrial" gelirse override. Kod seviyesinde fix.
3. **[P0] event_impact_mapper LLM routing** — "Python template only" çıktısı P0 BLOCKED; gerçek LLM analizi zorunlu.
4. **[P0] report_formatter self-check aktivasyonu** — 6 kontrol listesi (HTML/SPK/50KB/4SVG/12 bölüm/marka) çıktıdan önce çalışmalı.
5. **[P1] QA 45-metrik sayımı** — Kısmi sayımla yüksek skor verilmesi QA güvenilirliğini sıfırlıyor; 45 metrik = 45 kontrol.
6. **[P1] event_timeline_alert urgency kalibrasyonu** — CEO değişimi = IMMEDIATE+HIGH hard-coded; düzeltilmeli.

### 5 Kritik Ders (thyao-full-20260416)

1. **COO iyileşmesi gerçek** — BLOCKED kararı 3. THYAO'da doğru verildi. Önceki delta hatasından öğrenildi. COO gate çalışıyor.
2. **QA skor şişirmesi pipeline'ı tehdit ediyor** — 0.96 skor tüm downstream'e güven sinyali veriyor; oysa gerçekte sadece 2 metrik kontrol edildi. QA reformu kritik.
3. **3 sistematik arıza hâlâ çözülmedi** — sector_competition, event_impact_mapper, event_timeline_alert 2-3 THYAO analizinde aynı hataları tekrarlıyor. Bunlar prompt düzeltmesiyle değil kod seviyesi değişikliğiyle çözülmeli.
4. **EBITDA null = pipeline kırılması** — D&A upstream'den null geldiğinde tüm zincir (EBITDA → finansal_analiz → sektör → sentez → valuation) çöküyor. Bu tek nokta arızası giderilmeli.
5. **Partial output > no output** — Veri eksikliğinde bazı agentlar (sector_competition, strategic_synthesis) sıfır çıktı üretiyor. Kural: eksikliği belgele, minimum çıktıyı üret, null bırakma.

## CEO Post-Report Review — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Oturum Özeti
- Mod: Full Institutional (YK Raporu dahil — THYAO_Yonetim_Kurulu_Raporu_20260416.pdf)
- Analiz No: 4. THYAO Full Analiz (v4)
- COO Kararı: BLOCKED (HTML_ENVELOPE + SPK_DISCLAIMER eksik, 8KB) ✓ — doğru karar
- QA Skoru (bildirilen): 0.96 | Gerçek: ~%13 (6/45 metrik)
- Genel Değerlendirme: Pipeline sistematik sorunları 4. turda da devam etti; D&A null → EBITDA null → EBITDAR null cascadei tüm downstream'i etkisi altında tuttu.

### Agent Performans Tablosu (thyao-full-20260416-v4)

| Agent | Değerlendirme | Ana Sorun | Kaçıncı İhlal |
|---|---|---|---|
| coo | ✅ İYİ | BLOCKED kararı doğru; MIN_PAYLOAD ihlali geçmedi | — |
| data_collection | ❌ BAŞARISIZ | D&A null (4. THYAO), YK Raporu okunmadı | 4. |
| parse_standardization | ❌ BAŞARISIZ | EBITDA/D&A/investing CF null, aviation_ebitdar alanı yok | 4. |
| reconciliation | ⚠️ KISMI | pass_rate 1.0 (gerçek 4/7=57%), IFRS16 net borç dışı | 4. |
| context_extraction | ⚠️ KISMI | CEO profili yok (4. direktif), TVF unverified, net FX null | 4. |
| financial_analysis | ❌ BAŞARISIZ | 6/28 metrik, "industrial" sektör (4. THYAO) | 4. |
| sector_competition | ❌ BAŞARISIZ | "industrial" + boş peer (4. THYAO), EBITDAR benchmark yok | 4. |
| macro_analysis | ❌ BAŞARISIZ | Tüm makro null (4. THYAO), 5 transmission mekanizması yok | 4. |
| technical_analysis | ✅ İYİLEŞME | MA/RSI/MACD/Bollinger ✓; RS/hacim/Fibonacci/insider hâlâ eksik | Trend ↑ |
| kap_watch | ⚠️ KISMI | 119 bildirim ✓; is_material/impact null, forward takvim yok | 4. |
| event_classification | ❌ BAŞARISIZ | is_material null, İran/Brent macro_event sınıflandırılmadı | 4. |
| event_impact_mapper | ❌ BAŞARISIZ | "Python template only" — LLM katkısız (3. THYAO standard) | 3. |
| event_timeline_alert | ❌ BAŞARISIZ | Tüm medium_term+low urgency (3. THYAO standard) | 3. |
| qa_review | ❌ BAŞARISIZ | 0.96 şişirilmiş skor (6/45 metrik), 5 özel kontrol uygulanmadı | 4. |
| strategic_synthesis | ❌ BAŞARISIZ | Goldman/SWOT/tavsiye/Bull-Baz-Bear yok; convergence 0.38 | 2. |
| final_summary | ⚠️ KISMI | Yapı ✓ (12 bölüm); hedef fiyat blank, KPI tablosu yok | 4. KPI |
| report_formatter | ❌ BAŞARISIZ | HTML envelope + SPK yok, 8KB, THYAO marka rengi yok | 5. ihlal |

### 5 Kritik Ders (thyao-full-20260416-v4)

1. **D&A null = Tüm pipeline çöküşü** — 4. turda da aynı root cause. D&A data_collection'dan null gelince EBITDA → EBITDAR → financial_analysis → sector_competition → strategic_synthesis → valuation zinciri domino gibi düşüyor. Bu tek madde giderilene kadar tam analiz üretilemez.
2. **Kod değişikliği olmadan memory direktifi yetmiyor** — sector_competition "industrial", event_impact_mapper "template only", event_timeline_alert "medium_term", report_formatter "8KB" — bunlar 3-5 turda memory direktifine rağmen tekrarlandı. Bu 4'ü için kod seviyesinde hard-block mekanizması şart.
3. **technical_analysis gerçek iyileşme gösterdi** — MA/RSI/MACD/Bollinger v4'te doğru üretildi. Bu prompt-level direktiflerin çalışabileceğini kanıtlıyor. Ancak RS/hacim/Fibonacci/insider hâlâ eksik; kazanım korunmalı, kalan eksikler kapatılmalı.
4. **QA güvenilirlik krizi** — 0.96 skor sisteme "her şey yolunda" sinyali verdi; oysa 6/45 metrik kontrol edildi. QA şişirilmiş skor pipeline'ı tehdit ediyor; 45-metrik zorunlu sayım reformu P0.
5. **YK Raporu directive uygulanmadı** — CEO "ÖNCE OKU" direktifine rağmen THYAO_Yonetim_Kurulu_Raporu_20260416.pdf okunmadı. Bu direktif data_collection için artık "1. görev" olarak memory'de hard-coded.

### P0/P1 Açık Maddeler — Bir Sonraki THYAO Analizi İçin

- **[P0] D&A extraction** — data_collection → parse_standardization zincirinde CF "Amortisman ve İtfa" satırı. Null = hard BLOCKED, tüm analiz durur.
- **[P0] sector_competition aviation hardcoding** — THYAO ticker → "aviation" override. Kod değişikliği.
- **[P0] event_impact_mapper LLM routing** — "Python template only" → otomatik BLOCKED. Kod değişikliği.
- **[P0] report_formatter self-check 6 adım** — HTML/SPK/50KB/4SVG/12bölüm/marka → render öncesi otomatik.
- **[P0] QA 45-metrik sayımı** — Kısmi sayımla 0.90+ vermek artık kural ihlali; COO'ya raporlanır.
- **[P1] event_timeline_alert urgency calibration** — CEO/İran = IMMEDIATE+HIGH hard-coded; kod değişikliği.
- **[P1] macro_analysis EVDS fallback** — Null = FAIL; 3-kaynak WebSearch protokolü otomatik.
- **[P1] YK Raporu ilk fetch** — data_collection'ın 1. görevi; direktif 1 kez yeterli, kod garantisi şart.

## CEO Post-Report Review — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417)

### Pipeline Özeti
- **Oturum:** thyao-deep-20260417 | **Mod:** deep_dive | **QA Skoru:** 0 (FAIL) | **Teslim:** COO BLOCKED ✓
- **Root Cause:** financial_analysis çalışmadı → cascade: sector_competition boş, qa_review score 0, strategic_synthesis tek sinyal
- **İyi Çalışan:** COO BLOCKED kararı ✓ (HTML_ENVELOPE + SPK_DISCLAIMER), technical_analysis (MA/RSI/MACD/Bollinger ✓), final_summary (QA FAIL uyarısı + 12 bölüm iskelet ✓), kap_watch (119 disclosure ✓)
- **Kritik Yeni Sorun:** event_timeline_alert TAMAMEN BOŞ (impact_timeline: [], priority_alerts: [], upcoming_calendar: []) — önceki turlardan daha kötü. Bu regresyon.

### Sistematik Tekrar Hataları — Bu Oturumda Sayım

| Hata | Bu Oturumda | Toplam THYAO |
|---|---|---|
| financial_analysis çalışmadı | ✗ | 5. kez (deep_dive dahil) |
| sector_competition "industrial" + boş peer | ✗ | 5. THYAO |
| macro_analysis tüm null | ✗ | 5. THYAO |
| event_timeline_alert urgency kalibrasyonu | ✗ (tamamen boş) | 4. THYAO standard + 1 deep_dive |
| report_formatter HTML_ENVELOPE + SPK eksik | ✗ | 6. THYAO |
| MIN_PAYLOAD_SIZE 8KB PASS | ✗ | 6. THYAO |
| context_extraction CEO profili yok | ✗ | 5. THYAO |
| strategic_synthesis Goldman/SWOT/tavsiye yok | ✗ | 5. THYAO |
| technical_analysis BIST100 rel. null | ✗ | 5. THYAO |

### Kritik Ders — Deep Dive Modunun Farkı Yok
Deep_dive modu için tüm pipeline hazırlığı yapıldı (CEO mandate, 5 kaynak PDF, data inventory). Ancak pipeline sistematik arızaları deep_dive modunda da tekrarlandı. **Sonuç:** Analiz modu değişikliği sistematik sorunları çözmüyor. Çözüm prompt/memory direktifinde değil; KOD SEVİYESİNDE değişiklik gerekiyor:
1. sector_competition THYAO → aviation hardcoded mapping
2. event_impact_mapper LLM routing garantisi
3. macro_analysis null = COO otomatik BLOCKED
4. report_formatter HTML_ENVELOPE + SPK_DISCLAIMER şablon olarak gömülü
5. MIN_PAYLOAD_SIZE 50KB renderer seviyesinde kontrol

### Yeni P0 Tespit: event_timeline_alert Regresyon
Önceki THYAO'larda en azından medium_term fallback girişleri üretiliyordu. Bu turda tamamen boş çıktı üretildi (impact_timeline: []). Bu regresyon, agent'ın upstream bağımlılığını tamamen yanlış yorumladığını gösteriyor. **Kural:** event_timeline_alert, external event calendar ve havacılık regulatory calendar bilgisini upstream'e bağımlı olmadan üretebilir. TCMB PPK tarihleri, Q1 sonuçları takvimi, IATA raporları takvimi — bunlar sabit bilgi.

### Açık Kalemler (Sonraki THYAO Deep Dive Analizi İçin)
- P0: financial_analysis — CF tablosu + D&A + EBITDAR + WC metrikleri + sektör "aviation"
- P0: sector_competition "aviation" kod seviyesinde hardcoding
- P0: event_impact_mapper LLM routing (Python template değil)
- P0: report_formatter self-check 6 adım otomatik
- P1: event_timeline_alert urgency calibration + 4-phase şablon
- P1: macro_analysis EVDS fallback WebSearch protokolü
- P1: context_extraction CEO Olmüster profili 4-madde

### Performans İzleme — thyao-deep-20260417 Sonrası (Güncel)
- **KRİTİK SORUNLU:** financial_analysis (5 turda çalışmadı), sector_competition (5 THYAO "industrial"), macro_analysis (5 THYAO null), event_timeline_alert (regresyon — boş çıktı), report_formatter (6 THYAO HTML/SPK eksik), strategic_synthesis (5 THYAO Goldman/SWOT/tavsiye yok)
- **GELİŞMESİ GEREKEN:** context_extraction (CEO profili 5. kez eksik), qa_review (kısmi skor üretmeli), final_summary (KPI tablosu 5. kez eksik)
- **İYİ:** COO (BLOCKED kararı ✓), technical_analysis (MA/RSI/MACD/Bollinger ✓ — kazanım korunuyor), kap_watch (119 disclosure ✓)

## CEO Post-Report Feedback Loop — 2026-04-17 — ASELS Deep Dive

### Pipeline Genel Değerlendirmesi
ASELS analizi 18 agent üzerinden geçti. COO BLOCKED kararı verdi (HTML_ENVELOPE + SPK_DISCLAIMER eksikliği) — doğru karar. Ancak pipeline boyunca aynı sistematik sorunlar tekrar etti:

### Kritik Bulgular (P0 — Her Agent):
- **D&A null cascade** — parse → EBITDA null → valuation imkansız. Bu 5. THYAO + 1. ASELS = 6 rapordur çözülmedi.
- **sector_competition "industrial" + peer_group []** — ASELS'e özgü: "defense_electronics" sektörü ve Thales/Leonardo/Rheinmetall/BAE/Elbit peer listesi uygulanmadı.
- **macro_analysis jeopolitik bölüm eksik** — CEO mandate savunma şirketi için jeopolitik analizi zorunlu kılıyordu; macro agent null teslim etti.
- **event_timeline_alert tüm olaylar medium_term** — Bugün (17 Nisan) gerçekleşen temettü dağıtımı ve AGM IMMEDIATE olmalıydı.
- **event_impact_mapper "Python template only"** — Gerçek LLM analizi yok; sıfır quantification.
- **QA skoru 0.97 şişirilmiş** — Gerçek kapsam 7/28 metrik (%25); 0.97 ile geçiş kural ihlali.

### Yeni ASELS-Spesifik Sorunlar:
- trade_payables = "24,432,000 TL" — 180B+ TL ciro karşısında şüpheli düşük (DISC-004 ekvivalenti)
- TSKGV sahiplik "~%84-85 [src: inference]" — KAP doğrulaması yapılmadı
- 5 yıllık seri yok — sadece FY2025
- YK Raporu toplanmadı

### Savunma Sektörü Kalıcı Direktifler (her ASELS analizinde):
1. Sektör = "defense_electronics" (upstream'den bağımsız, override edilecek)
2. Peer listesi: Thales, Leonardo, Rheinmetall, BAE Systems, Elbit, HEICO, HAEFN.IS
3. Jeopolitik analiz bölümü zorunlu: Iran-ABD + Rusya-Ukrayna + NATO + Türkiye SSB bütçesi
4. Savunma KPI'ları: backlog, AR-GE/ciro, ihracat oranı her raporda
5. COO delivery gate'e savunma sektörü completeness check'i eklendi (peer_group [] = P1 BLOKER, jeopolitik null = P1 BLOKER)

### Agent Performans Güncellemesi — ASELS Sonrası:
- **KRİTİK SORUNLU:** financial_analysis (7/28 metrik), sector_competition ("industrial" savunmada da), macro_analysis (jeopolitik null), event_impact_mapper (template only), report_formatter (HTML/SPK/boyut)
- **GELİŞMESİ GEREKEN:** data_collection (5 yıl yok, YK Raporu yok), parse_standardization (D&A null), reconciliation (pass_rate yanıltıcı)
- **İYİ:** COO (BLOCKED kararı doğru ✓), technical_analysis (MA/RSI/MACD ✓), kap_watch (99 disclosure tamamlandı ✓), final_summary (yapısal kalite ✓)

## Son Heartbeat — 2026-04-18 TSİ (Otonom Döngü #127)
- Checked memory: [veri kaynağı kuralları, heartbeat özet limiti, kalıcı kurallar, takvim].
- **KAP Erişim:** JS-render engeli devam. Pazar günü — bildirim beklenmez.
- **WTI:** $83.85 (-11.45%) | **Brent:** $90.38 (-9.07%) — Bloomberg HT teyid. Konsolidasyon bandı $83-86 devam. Hormuz açık.
- **BIST (kapalı — son kapanış 17 Nisan):** THYAO **329.00** (+3.70%) | TUPRS **253.00** (-5.60%) | ASELS **414.00** (+0.73%) | EREGL **32.04** (+3.69%) | KCHOL **211.80** (+3.57%).
- **Yeni:** KCHOL fiyatı bu döngüde ilk kez alındı (önceki turda Bigpara 404 idi). Tüm fiyatlar 17 Nisan kapanışı.
- **Takvim (kritik):** PPK **22 Nisan (4 gün)** | EREGL Q1 earnings **23 Nisan (5 gün)**.
- P0/P1 yok. **Chairman ALERT: HAYIR.**

## Son Heartbeat — 2026-04-18 TSİ (Otonom Döngü #126) [→ Archive]
- Bkz. heartbeat_archive.md (WTI $84.96 -10.28%, Brent $91.90 -7.54%, BIST 14,588 kapanış, PPK 22 Nisan, HAYIR alert)

## Son Heartbeat — 2026-04-18 TSİ (Otonom Döngü #125) [→ Archive]
- Bkz. heartbeat_archive.md (WTI $84.96 -10.28%, Brent $91.90 -7.54%, BIST 14,588 kapanış, PPK 22 Nisan, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #124) [→ Archive]
- Bkz. heartbeat_archive.md (WTI $85.54 -9.66% konsolidasyon, BIST 14,588 kapanış, PPK 22 Nisan, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #122) [→ Archive]
- Bkz. heartbeat_archive.md (WTI $84.66 -10.59% konsolidasyon, BIST kapanış değişmedi, PPK 22 Nisan, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #121) [→ Archive]
- Bkz. heartbeat_archive.md (WTI $84.57 -10.69% Hormuz kalıcı konsolidasyon, BIST kapanış değişmedi, PPK 22 Nisan, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #120) [→ Archive]
- Bkz. heartbeat_archive.md (WTI $84.67 -10.58% Hormuz kalıcı, Lufthansa küçülme THYAO avantajı, BIST +2.72%, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #119) [→ Archive]
- Bkz. heartbeat_archive.md (WTI $84.10 -11.18% Hormuz devam, EREGL 32.04 +3.69%, THYAO 329.00 +3.70%, TUPRS 253.00 -5.60%, PPK 22 Nisan, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #118) [→ Archive]
- Bkz. heartbeat_archive.md (WTI $83.87 -11.43% Hormuz devam, EREGL 32.04 +3.69%, THYAO 329.00 +3.70%, TUPRS 253.00 -5.60%, PPK 22 Nisan, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #117) [→ Archive]
- Bkz. heartbeat_archive.md (EREGL 32.04 +3.69%, THYAO ~319.25 +0.63%, TUPRS ~261.25 -1.31%, ASELS 411 -1.38%, KCHOL -1.59%, PPK 22 Nisan, HAYIR alert)

## Son Heartbeat — 2026-04-18 TSİ (Otonom Döngü #116) [→ Archive]
- Bkz. heartbeat_archive.md (WTI 81.22 flat, EREGL +3.69% ex-div, TUPRS -5.60%, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #115) [→ Archive]
- Bkz. heartbeat_archive.md (WTI $81.09 flat, EREGL ex-date bugün, Q1 earnings 23 Nisan, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #114) [→ Archive]
- Bkz. heartbeat_archive.md (WTI $80.98 $81 konsolidasyon, EREGL ex-date yarın, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #113) [→ Archive]
- Bkz. heartbeat_archive.md (WTI $81.14 -14.31% Hormuz, TUPRS -5.69%, EREGL son alım günü, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #112) [→ Archive]
- Bkz. heartbeat_archive.md (WTI -11.62% Hormuz açılması, THYAO +4.10%, EREGL son alım günü, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #111) [→ Archive]
- Bkz. heartbeat_archive.md (WTI -3.54% ABD-İran müzakere, EREGL son alım günü, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #110) [→ Archive]
- Bkz. heartbeat_archive.md (Brent -3.41% tersine dönüş, TUPRS -1.21%, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #109) [→ Archive]
- Bkz. heartbeat_archive.md (Brent +3.46% ikinci güçlü gün, EREGL son alım, HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #108) [→ Archive]
- Bkz. heartbeat_archive.md (Brent $98 konsolidasyon, EREGL son alım günü, tümü HAYIR alert)

## Son Heartbeat — 2026-04-17 TSİ (Otonom Döngü #107) [→ Archive]
- Bkz. heartbeat_archive.md (EREGL son alım günü, Brent konsolidasyon, tümü HAYIR alert)

---
*Eski kayıtlar: heartbeat_archive.md | Vaka dersleri: case_lessons.md | Kalıcı kurallar: permanent_rules.md*
