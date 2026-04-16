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

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **5 yıllık seri eksikliği teslim kontrolünden geçirilmedi** — FY2021-2023 verileri eksikti; COO teslim kontrol matrisinde "FY2021-2023 tarihsel seri" satırı yok. Bu eksiklik rapordaki 5 yıllık trend analizlerini ve büyüme skor kartını zayıflattı.
- **Teknik analiz standart şablon kontrolü yapılmadı** — MACD/VWAP/Bollinger/Volume Profile "[VERİ YOK]" olarak çıktıda kaldı; COO teslim matrisi bunu flaglemedi.
- **Header/footer kontrolü eksik** — Teslim matrisinde header/footer satırı yok; "Temiz" geçildi ama doğrulama kanıtı yok.
- **Layout kalite kontrolü yüzeysel** — "page-break ihlali yok" kontrol edildi ✓ ama 60/40 yan yana layout oranı sayısal olarak doğrulanmadı.
- **COO teslim kararı doğruydu: APPROVED ✓** — P0/P1 8/8 çözüldü, fact base kilitlendi, COND-1..4 karşılandı. Teslim onayı yerinde.

### Bundan Sonra:
- **COO teslim matrisi yeni satır ekle: "5 yıllık veri tamamlığı"** — FY(yıl-4) to FY(yıl) tüm yıllar için en az Revenue/EBITDA/Net Debt/OCF var mı? Tek satır kontrol.
- **Teknik analiz standart şablon kontrolü COO listesine ekle** — Min 5 teknik kalem dolu olmalı (Fibonacci ✓, RSI ✓, MA ✓ + en az 2 diğer). "[VERİ YOK]" olan kalem sayısı ≥4 ise flag.
- **Header/footer kontrolü COO listesine ekle** — HTML'de header CSS ve footer CSS varlığı string aramasıyla kontrol et; yoksa report_formatter'a geri gönder.

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

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu
### Eksikler:
- COO cikti, eksik hedef fiyat ve ayri `macro_analysis_output` yoklugunu dogru gordu ama Chairman'in zorunlu skor karti, gorsel/PDF ve son teslim checklistini satir satir kapatmadan durdu.
- Delivery gate karari dogru yone gitse de "hangi blocker hangi agent'a ait" sorumluluk dagilimi finalde yeterince operasyonel yazilmadi.
### Bundan Sonra:
- Release gate sonucunda her blocker'i `agent_owner + fix + recheck condition` formatinda yaz; yalniz "blocked" demek yetmez.
- COO kontrolde hedef fiyat, skor karti, PDF, 12 bolum, makro bolumu ve chart inventory ayri ayri `present/missing` olarak zorunlu listele.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu Post-Report Loop
### Eksikler:
- COO, teslim kontrolunde raporun 12 bolum, skor karti, Bear/Baz/Bull hedef fiyat, PDF artefakti, chart inventory ve makro-jeopolitik tamligini tek tek kapatmadi.
- `blocked/revision_needed` karari verilse de blocker sahipligi net ayrismadi; hangi eksigin data_collection, FA, synthesis, formatter veya QA tarafinda cozulecegi operasyonel yazilmadi.
### Bundan Sonra:
- COO release gate'te her zorunlu teslim unsurunu `present/missing/contested` formatinda tek satirlik checklist olarak verecek; eksik kalan madde varsa rapor cikmayacak.
- Her blocker icin `owner + due output + recheck rule` zorunlu olacak; ortak ve muallak blocker listesi artik kabul edilmeyecek.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Post-Report Feedback Loop
### Eksikler:
- COO, final rapordaki OCF tanim catismasi, makro bolum boslugu ve PDF/deliverable kaniti eksigini gormesine ragmen bunlari tek teslim checklistine baglamadi.
- Release karari verilirken `hangi agent neyi duzeltecek` ve `yeniden kontrol kosulu nedir` formatinda operasyonel takip listesi uretilmedi.
### Bundan Sonra:
- COO her teslimde `content gate` ve `artifact gate`i ayri calistiracak; sayi/fact pack catismasi varsa layout dogru olsa bile teslim duracak.
- COO blocker ozeti her zaman `issue -> owner -> fix artifact -> recheck` matrisiyle yayinlanacak; bu format olmadan gate karari tamamlanmis sayilmayacak.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **BLOCKED kararı doğru ✓** — report_formatter DEGRADED + QA 0.658 < 0.75 ile delivery blocked. Karar yerinde.
- **report_formatter exit 143 (context overflow) için sistematik çözüm önerisi sunulmadı** — Aynı hata KCHOL önceki turda da oluştu; COO'nun "formatter büyük input → parçalı gönder" direktifini sistematik olarak kayıt etmesi ve bir sonraki teslime hazırlaması gerekiyordu.
- **SOTP tablosu eksikliği COO teslim kontrolünde önceden flaglenmedi** — "valuation_agent SOTP formal output yok" COO pre-delivery check'inde P0 olarak görünmedi; sadece QA bölümünde tespit edildi. COO holding analizlerinde SOTP varlığını ayrıca kontrol etmeli.
- **7 kontrol "YAPILAMADI" durumu bloker matrisi yerine tek notla geçildi** — HTML boş → 7 kontrol yapılamadı. COO bu 7 kontrolü "PENDING — formatter fix sonrası yeniden kontrol edilecek" formatında ayrı matrise almalıydı.

### Bundan Sonra:
- **report_formatter büyük içerik → parçalı gönderim kuralı COO pre-brief'ine ekle** — Final summary > ~8000 token ise: "Formatter'a parçalı gönder: Bölüm 1-4 önce, 5-12 sonra." Bu direktif COO başlangıç briefine zorunlu girdi.
- **Holding teslim kontrolüne yeni satır: SOTP Tablosu** — Kontrol: [valuation_agent SOTP tablosu (6 iştirak × NAV katkısı) downstream'e iletildi mi?] — EVET/HAYIR. HAYIR ise P0 bloker.
- **"YAPILAMADI" kontroller için ikincil doğrulama** — HTML boş gelirse final_summary çıktısından metin QA'sı yapılacak; "HTML kontrol edilemedi, metin QA yapıldı" notu ile devam edilecek.

## Agent Performans Güncellemesi — KCHOL Delta (16 Nisan 2026)
- report_formatter: Exit 143 (2. kez KCHOL) → başarı %30
- valuation_agent: SOTP formal output teslim etmedi → başarı %45
- event_timeline_alert: 2 tur DEGRADED → başarı %30
- data_collection: FY2025/2024 tam ✓, IAS29 ✓; FY2023/solo bilanço eksik → başarı %65
- financial_analysis: Cash FAVÖK, FCF negatif analizi güçlü ✓; WC kalem bazı, solo analiz eksik → başarı %55
