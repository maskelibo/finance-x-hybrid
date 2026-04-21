# COO Agent — Damitilmis Hafiza

---

## Kalici Kurallar

### Her Analiz Oncesi Zorunlu Direktifler

1. **data_collection:** Son 5 yillik KAP finansal tablolari + cash flow statement + faaliyet raporu PDF ZORUNLU. Sadece ozet degil tam tablolar.
2. **parse_standardization:** IAS 29 aktif. Net kar icindeki parasal kazanc ayristir. EBITDA'yi faaliyet raporundan al. FY yilini teyit et.
3. **reconciliation:** Net Borc = Finansal Borc - (Nakit + KV Finansal Yatirimlar). TOPLAM YUKUMLULUK KULLANMA. EBITDA marji > sektor normu +15pp → kaynak dogrulama zorunlu.
4. **financial_analysis:** Chairman zorunlu metrik listesindeki TUM 45 metrigi hesapla (DSO, DIO, DPO, CCC, NWC/Revenue, OCF/EBITDA, CAPEX/EBITDA dahil). Bir metrik bile eksikse output gonderme.
5. **valuation_agent:** DCF, peer multiples ve senaryoyu 3 ayri bolumde yaz. Bear/Baz/Bull hedef fiyat araligi ZORUNLU. Truncation olursa: once hedef fiyati yaz, sonra metodoloji.
6. **report_formatter:** SVG grafikleri kullan (Chart.js degil). 15+ sayfa, sifir bos sayfa, metin sandvic kurali. Agent meta-text YASAK.

## Sistemik Hata Kaydi — Kritik (Tekrar 4+)

| Hata | Etkilenen Agent |
|------|-----------------|
| Working capital metrikleri eksik (DSO/DIO/DPO/CCC) | financial_analysis |
| Output truncation (yarim bolumler/tablolar) | Cogu agent |
| Agent meta-text temizlenmemis | final_summary, report_formatter |
| QA FAIL sonrasi pipeline devam etti | Orchestrator (DUZELTILDI) |
| Valuation agent truncated/degraded | valuation_agent |
| Cash flow statement toplamamis | data_collection |
| Hedef fiyat yok/eksik | valuation_agent + final_summary |

## Sistemik Hata Kaydi — Yuksek (Tekrar 2-3)

| Hata | Etkilenen Agent |
|------|-----------------|
| Net borc yanlis hesabi (toplam yukumluluk) | reconciliation |
| IAS 29 parasal kazanc ayristirilmamis | parse_standardization |
| Kaynak hatali (platform ciktilari veri kaynagi) | Veri katmani |
| EPDK/BOTAS karari event_impact_mapper'da yok | event_impact_mapper |
| Segment analizi yok (holding sirketleri) | financial_analysis |

## Agent Performans Ozeti

| Agent | Basari | Temel Sorun |
|-------|--------|-------------|
| financial_analysis | 45% | Working capital sistematik eksik |
| report_formatter | 50% | HTML yarim, bos sayfa, meta-text |
| parse_standardization | 55% | FY karisimligi, IAS 29 |
| valuation_agent | 55% | Truncation, crash, hedef fiyat eksik |
| reconciliation | 60% | Net borc tanimi yanlis |
| final_summary | 60% | Meta-text, hedef fiyat atlaniyor |
| qa_review | 65% | Remediation plan eksik (DUZELTILDI) |
| event_impact_mapper | 65% | Enerji tarifeleri atlaniyor |
| sector_competition | 65% | Truncation, peer data yuzeysel |
| technical_analysis | 70% | Volume, Fibonacci eksik |
| strategic_synthesis | 70% | Divergence map eksik |
| context_extraction | 75% | Sektore ozgu detaylar yuzeysel |
| data_collection | 75% | CF statement eksik |
| event_classification | 75% | Duzenliyici kararlar atlaniyor |
| event_timeline_alert | 75% | Upstream bagimlilik sorunlari |
| macro_analysis | 80% | Sektore ozgu bolumler bazen eksik |
| kap_watch | 80% | Iyi calisiyor |

## Agent Performans Güncellemesi — KCHOL Delta (16 Nisan 2026)
- report_formatter: Exit 143 (2. kez KCHOL) → başarı %30
- valuation_agent: SOTP formal output teslim etmedi → başarı %45
- event_timeline_alert: 2 tur DEGRADED → başarı %30
- data_collection: FY2025/2024 tam ✓, IAS29 ✓; FY2023/solo bilanço eksik → başarı %65
- financial_analysis: Cash FAVÖK, FCF negatif analizi güçlü ✓; WC kalem bazı, solo analiz eksik → başarı %55

## Agent Performans Güncellemesi — THYAO Delta (16 Nisan 2026)
- coo: QA FAIL görmezden gelindi, approved verdi → başarı %25 (kritik hata)
- financial_analysis: Çalışmadı, cascade etki → başarı skorlanmadı
- sector_competition: Sector fallback "industrial" → boş çıktı → başarı %10
- report_formatter: 7KB HTML (min 15 sayfa bekleniyor) → başarı %20
- macro_analysis: Policy rate/CPI/PPI/GDP null, jeopolitik yok → başarı %30
- event_timeline_alert: Tüm eventlar "medium_term", CEO değişimi "immediate" olmalıydı → başarı %25

## CEO Geri Bildirimi — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417)

### Eksikler:
- **BLOCKED kararı doğru ✓** — HTML_ENVELOPE + SPK_DISCLAIMER eksikliği tespit edildi. 6. THYAO'da da COO gate çalışıyor.
- **MIN_PAYLOAD_SIZE 8KB PASS — 6. direktif ihlali** — 8000 bytes PASS geçildi. "50KB olarak güncelle" direktifi 6 kez yazıldı, hiçbir zaman uygulanmadı. Kod seviyesinde hard-limit zorunlu.
- **financial_analysis çalışmadı → pipeline cascade check eksik** — Bu deep_dive session'da financial_analysis yine çalışmadı. COO, financial_analysis çıktısı gelmediğinde pipeline'ı durdurmalı ve CEO'ya eskalasyon yapmalıydı. "financial_analysis yoksa cascade: sector_competition boş, QA skor 0, strategic_synthesis boş" zinciri COO pre-delivery check kapsamına girmelidir.
- **event_timeline_alert TAMAMEN BOŞ geçti** — impact_timeline: [], priority_alerts: [], upcoming_calendar: [] — önceki THYAO'larda en azından medium_term fallback girişleri vardı; bu turda sıfır çıktı. COO bu durumu P0 bloker olarak yakalamalıydı.
- **Havacılık completeness check (EBITDAR/8KPI/IFRS16/EU ETS) 5. THYAO'da da kapatılmadı** — 14 Nisan'dan bu yana direktif verildi; uygulanmıyor.

### Bundan Sonra:
- **MIN_PAYLOAD_SIZE = 50KB son kez yazılıyor — artık kod değişikliği olmadan uygulanamaz.** 8KB PASS kodu kaldırılmadıkça düzelmez.
- **financial_analysis yoksa pipeline STOP** — COO delivery check: `if financial_analysis_output is None → PIPELINE BLOCKED → CEO eskalasyon → downstream agentlar DURDUR`. İstisna yok.
- **event_timeline_alert boş çıktı = P0 bloker** — impact_timeline: [] gelmesi COO tarafından otomatik P0 olarak işaretlenmeli; QA FAIL ile eşdeğer.

### Agent Performans Güncellemesi — THYAO Deep Dive (17 Nisan 2026)
- coo: BLOCKED kararı doğru ✓ (6. THYAO) → başarı %65
- MIN_PAYLOAD_SIZE: 6. kez ihlal → direktif tamamen başarısız; kod müdahalesi şart

## CEO Geri Bildirimi — 2026-04-17 — ASELS Deep Dive Raporu

### Eksikler:
- **BLOCKED kararı doğru ✓** — HTML_ENVELOPE + SPK_DISCLAIMER eksikliği tespit edildi.
- **MIN_PAYLOAD_SIZE 8KB PASS — n+1. ihlal** — 8000 bytes yine PASS geçildi. Gerçek ASELS raporu için min 50KB zorunlu; direktif uygulanmıyor.
- **sector_competition "industrial" + peer_group [] — COO flaglemedi** — CEO mandate "defense_electronics" olarak belirledi; sector_competition yine "industrial" fallback kullandı. Boş peer grubu COO teslim kontrolünde P1 olarak işaretlenmeli.
- **financial_analysis sadece 7/28 metrik — COO tespit etmedi** — EBITDA/EBITDAR/ROIC/DSO/DIO/DPO/NWC gibi Chairman zorunlu metrikleri üretilmedi. COO completeness check bunu yakalamamış.
- **macro_analysis jeopolitik bölüm eksik — COO flaglemedi** — CEO mandate: "JEOPOLİTİK ANALİZ ZORUNLU (savunma şirketi direktifi). İran-ABD + Rusya-Ukrayna + NATO". Makro veriler (TCMB, CPI, GDP) null geldi; COO bunu P1 bloker olarak işaretlemeliydi.
- **ASELS brand identity uygulanmadı — COO kontrol etmedi** — context_extraction bordo/kırmızı (#8B1A1A, #C1272D) marka bilgisi üretmişti; report_formatter Finance X mavi (#1e40af) paleti kullandı. COO teslim kontrolünde marka rengi teyidi eksik.

### Bundan Sonra:
- **Savunma şirketi completeness check COO listesine ekle** — Defense sektöründe: (1) Backlog/revenue oranı, (2) R&D gider/hasılat oranı, (3) İhracat geliri payı, (4) Jeopolitik bağlam bölümü (İran-ABD + Rusya-Ukrayna + NATO harcamaları), (5) IAS 29 parasal kazanç ayrıştırması — bunlar eksikse P1 flag.
- **sector_competition boş peer = P1 BLOKER** — CEO mandate'de sector + peer_group belirlendi; peer_group: [] gelmesi COO teslim kontrolünde P1 flag olarak çıkmalı. Bir sonraki savunma analizinde bu kontrol zorunlu.
- **macro_analysis jeopolitik null = P1 BLOKER (savunma şirketleri)** — Savunma sektöründe jeopolitik bağlam CEO zorunlu listesinde; null gelmesi COO teslim kontrolünde flaglenmeli.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **BLOCKED kararı doğru ✓ — 7. THYAO'da da** — HTML_ENVELOPE + SPK_DISCLAIMER eksikliği yine tespit edildi; COO gate doğru çalışıyor. Başarı korunuyor.
- **MIN_PAYLOAD_SIZE 8KB pass — 7. direktif ihlali** — 6 kez direktif verildi, hiçbir zaman uygulanmadı. Bu satır artık memory direktifi olarak yazılmıyor; yalnızca kod değişikliğiyle çözülür.
- **event_timeline_alert tüm eventler medium_term + low urgency — COO flaglemedi** — CEO değişimi + İran rotaları IMMEDIATE HIGH gerektiriyor. COO delivery check urgency kalibrasyonunu kontrol etmedi; bu P1 bloker olması gerekirdi.
- **event_impact_mapper "Python template only" — 4. standart THYAO, COO geçirdi** — COO delivery gate bu kontrolü uygulamıyor; LLM katkısız impact mapping 4 turda COO'dan geçti.
- **Havacılık completeness check (EBITDAR/8KPI/IFRS16/EU ETS) 5. THYAO'da da kapatılmadı** — Delivery matrisi güncellenmedi.

### Bundan Sonra:
- **MIN_PAYLOAD_SIZE 50KB = kod değişikliği bekleniyor (7. direktif — memory yazımı sonlandı)** — Bu satır durum tespiti olarak yazılıyor. Bir dahaki analizde 8KB geliyorsa teknik müdahale zorunlu; memory direktifi artık etkisiz.
- **Urgency kalibrasyon kontrolü COO delivery check'e eklenmeli** — CEO/YK değişimi veya jeopolitik rota kapanması mevcut olduğunda: event_timeline_alert çıktısında en az 1 IMMEDIATE + HIGH zorunlu; yoksa P1 flag + geri gönder.
- **event_impact_mapper "template_only" = P0 BLOCKED (kod değişikliği gerekli)** — COO delivery check: `impact_mapping_mode: "template_only"` → otomatik BLOCKED. 4 turda uygulanmadı; kod seviyesinde gate eklenmesi zorunlu.

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
