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

## Yapilan Duzeltmeler (2026-04-13)

1. **QA Gate:** `critical` keyword kaldırildi, `conditional_pass` blocklist'e eklendi, score < 0.75 → BLOCK
2. **Pre-QA Completeness Gate:** financial_analysis min 3000 char + keywords, macro min 1000 char, valuation min 500 char + hedef fiyat. Basarisiz → auto re-run
3. **HTML Chart Validation:** SVG + Canvas kontrol, ikisi de 0 → uyari

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

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **REVISION_NEEDED kararı doğru ✓** — QA 0.757 < 0.80 ve P0 blokerlar (CF, D1 equity, WC) çözülmeden teslim edilemez. COO doğru durdu.
- **Conditional_pass upstream'de engellenmedi** — data_collection "CONDITIONAL PASS" verdiğinde COO pipeline'ı durdurmalıydı. CEO direktifi: conditional_pass = BLOCK. Bu kontrol COO'nun pre-QA gate kapsamında.
- **Havacılık sektörü özel kontrol listesi eksik** — THYAO CEO pre-flight direktifinde 8 havacılık KPI (RPK, ASK, CASK, RASK, LF, Kargo ton-km, filo, hedging) belirtildi; COO bu KPI'ları completeness check'e dahil etmedi.
- **IFRS 16 lease borç ayrıştırma kontrolü yapılmadı** — Net Borç formülünde lease borcu dahil mi diye COO kontrolü yoktu.

### Bundan Sonra:
- **COO havacılık şirketi completeness check'e ekle:**
  - EBITDAR (EBITDA + Rent/Lease) hesaplandı mı?
  - 8 havacılık KPI (RPK, ASK, CASK, RASK, LF, Kargo, Filo, Hedging) mevcut mu?
  - IFRS 16 ROU varlık + lease borcu ayrıştırması yapıldı mı?
  - Rusya üstgeçiş + EU ETS + CORSIA bölümleri var mı?
- **Conditional_pass = BLOCK** — data_collection veya herhangi bir agent conditional_pass verirse COO downstream'i durdurur, CEO'ya eskalasyon bildirir.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **REVISION_NEEDED kararı doğru ✓** — QA 0.59/1.0 < 0.80 eşiği; HTML body tagı kapatılmamış (CSS var, içerik yok) P0 olarak doğru tespit edildi. Pipeline durduruldu.
- **Revenue Q4/FY karışıklığı COO tarafından yakalanmadı** — data_collection "802.669 M TRY FY2025 RESOLVED" dediğinde COO bunu "PARTIAL" olarak geçti. Gerçekte bu yanlış çözüme kilitlenmeydi; QA Round 2'de P0-NEW olarak tespit etti. COO, revenue tutarı doğrulamasını (Q4 = 3 ay, FY = 12 ay ayrımı) kendi delivery check listesine almalıydı.
- **Content check bölüm kalitesini değil yalnızca başlık varlığını kontrol etti** — "15 bölüm PASS" kararı heading taramasına dayanıyordu; içerik kalitesi (gelir tutarsızlığı, bilanço 226% imbalance, IFRS 8 %0) değerlendirilmedi.
- **QA'dan önceki data quality check eksik** — COO, QA skoru gelmeden önce financial_analysis çıktısındaki "FAVÖK marjı %22.6" gibi anormal değerleri görmezden geldi. Holding normu ~%6-8 FAVÖK marjıdır; %22.6 immediate cross-check gerektirirdi.
- **Blocker listesi tam değildi** — DSO BLOCKED, IFRS 8 %0, TCMB %46→%37 bellek hatası COO delivery check'inde P0 olarak listelenmedi.

### Bundan Sonra:
- **COO holding şirketi completeness check'e ekle:**
  - Revenue tanımı: Solo/Parent + Konsolide FY + En son quarter — üçü ayrı satır doğrulandı mı?
  - IFRS 8 segment extraction %0 → otomatik P0 (holding valuation için zorunlu)
  - Balance sheet imbalance > %50 → P0, downstream BLOCK
  - FAVÖK marjı holding normu dışında (%5-15 bant dışı) → kaynak sorgu zorunlu
- **Revenue dönem doğrulaması COO delivery check'e ekle:** "FY geliri ile Q4 geliri karıştırıldı mı?" kontrolü QA'dan önce yapılacak. Tek bir tutarsızlık downstream'de 5+ agentin hesaplarını bozabilir (cascade risk).
- **HTML delivery check için kapanış tag kontrolü:** `</body></html>` var mı? COO HTML teslim alınca bunu ilk kontrol eder. Eksikse report_formatter'ı geri gönder.
- **Performans izleme güncelleme:**
  - report_formatter: HTML body eksik (BIMAS + KCHOL = 2. kez) → başarı %35'e düştü
  - financial_analysis: Revenue Q4/FY hatayı kendi yakalamadı → başarı %40

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **BLOCKED kararı doğru verildi** — COO pipeline'ı durdurdu ve CEO'ya eskalasyon yaptı. Doğru davranış.
- **Tur 3 minimal adımları COO'nun değil CEO'nun belirlemesi gerekirdi** — "Yapılacaklar: reconciliation'dan CONDITIONAL_PASS kaldır" gibi teknik direktifler COO'nun değil CEO'nun yetkisinde.
- **Blocker listesi eksiksiz değildi** — IAS29 ROE tablosu eksikliği ve financial_analysis Bölüm 5 truncation P0 blocker olarak listelenmedi.

### Bundan Sonra:
- **COO direktif VERMEZ, bildirir:** "Şunu düzelt" değil, "Bu blocker mevcut, CEO kararı gerekiyor" formatında eskalasyon yapılacak.
- **Blocker listesi tüm P0'ları kapsamalı:** QA raporundaki tüm P0 sorunlar (QF-01, QF-02, QF-REC, IAS29 ROE) COO listesinde görünmeli.
- **Delivery check her analizin sonunda ZORUNLU:** CEO gate kapısını geçmeden rapor teslim edilemez. COO bu gate'i yönetir.

---
