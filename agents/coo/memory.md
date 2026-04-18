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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **QA score 0 (FAIL) ile delivery APPROVED kararı verildi** — En kritik hata. QA "NO_FINANCIAL_ANALYSIS — cannot score" → score 0 → qa_decision: "fail" olmasına rağmen COO "approved" kararı verdi. Bu doğrudan CEO direktifine aykırı: QA FAIL = BLOCK.
- **financial_analysis agent çalışmadı ama pipeline durdurulmadı** — financial_analysis çıktısı olmadan sector_competition, strategic_synthesis ve qa_review boş döndü. COO bu cascade hatayı görüp financial_analysis'i re-run etmeli veya pipeline'ı durdurmalıydı.
- **Minimum payload kontrolü (7073 bytes) yetersiz eşik** — 7KB HTML "passed" dedi; gerçekte bu ~1 sayfalık içerik. Min 15 sayfa = ~80-100KB arası beklenmeli. COO payload eşiğini 50KB olarak güncellemelidir.
- **Sector "industrial" fallback COO tarafından flaglenmedi** — sector_competition "Sector inferred via ticker fallback → industrial" uyarısı verdi. THYAO açıkça havacılık; bu hata COO teslim kontrolünde P1 olarak görünmeliydi.
- **Havacılık özel kontroller bu turda da eksik** — 14 Nisan direktifi: EBITDAR, RPK/ASK/LF/CASK/hedging, IFRS 16. Hiçbiri completeness check'te kapatılmadı.

### Bundan Sonra:
- **QA FAIL = otomatik BLOCKED kararı** — COO delivery gate kodu: `if qa_decision in ["fail", "conditional_pass"] → decision = "blocked"`. İstisna yok.
- **financial_analysis yoksa pipeline cascade check** — financial_analysis çıktısı gelmezse COO şunu listeler: "sector_competition, strategic_synthesis, qa_review boş döner — pipeline durdur, financial_analysis re-run et veya CEO'ya eskalasyon."
- **Payload eşiği güncelleme** — MIN_PAYLOAD_SIZE: 7KB → 50KB. 15+ sayfa HTML'de minimum 50KB içerik beklenir.
- **Sector fallback = P1 flag** — Herhangi bir agent "sector inferred via fallback" derse COO P1 flag koyar; doğru sektör teyidi olmadan downstream analiz geçerli sayılmaz.

## Agent Performans Güncellemesi — THYAO Delta (16 Nisan 2026)
- coo: QA FAIL görmezden gelindi, approved verdi → başarı %25 (kritik hata)
- financial_analysis: Çalışmadı, cascade etki → başarı skorlanmadı
- sector_competition: Sector fallback "industrial" → boş çıktı → başarı %10
- report_formatter: 7KB HTML (min 15 sayfa bekleniyor) → başarı %20
- macro_analysis: Policy rate/CPI/PPI/GDP null, jeopolitik yok → başarı %30
- event_timeline_alert: Tüm eventlar "medium_term", CEO değişimi "immediate" olmalıydı → başarı %25

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **BLOCKED kararı doğru ✓** — HTML_ENVELOPE ve SPK_DISCLAIMER eksikliği nedeniyle BLOCKED verildi. Bir önceki THYAO delta-update'te QA FAIL görmezden gelinmişti; bu turda düzeltme yapıldı.
- **HTML_ENVELOPE ve SPK_DISCLAIMER pre-flight check olmalı** — Bu iki kontrol, report_formatter çalışmadan ÖNCE yapılabilir. Formatter çalıştıktan sonra tespit etmek değil; formatter'a "SPK disclaimer zorunlu, HTML tam envelope zorunlu" direktifi önceden verilmeli.
- **MIN_PAYLOAD_SIZE 8KB PASS ama standart rapor için yetersiz** — 8KB gerçek içerik değil; delta raporunda 7KB ile aynı sorun devam ediyor. COO payload eşiğini bu rapordan itibaren 50KB olarak uygulasın (direktif verilmişti ama uygulanmadı).
- **Havacılık sektörü completeness check bu turda da eksik** — EBITDAR, 8 havacılık KPI, IFRS 16 ayrıştırması — 14 Nisan direktifi; bugün de kapatılmadı.

### Bundan Sonra:
- **SPK_DISCLAIMER ve HTML_ENVELOPE COO pre-brief'ine zorunlu ekle** — report_formatter'a brief yaparken: "HTML tam envelope (<html>...</html>) ve footer'da 'yatırım tavsiyesi değildir' notu zorunlu" direktifini ver. Formatter çalıştıktan sonra değil, önce.
- **MIN_PAYLOAD_SIZE eşiği 50KB olarak güncelle** — 8KB ve 7KB raporlar her turda geçiyor; eşik güncellenmeden sorun devam eder.
- **Havacılık completeness check listesi kalıcı ekle:** EBITDAR hesaplandı mı? | 8 KPI (RPK/ASK/CASK/RASK/LF/Kargo/Filo/Hedging) mevcut mu? | IFRS 16 ROU + lease borcu ayrışması yapıldı mı? | Rusya üstgeçiş + EU ETS + CORSIA var mı?

### Agent Performans Güncellemesi — THYAO Standard (16 Nisan 2026)
- coo: BLOCKED kararı doğru ✓ (HTML_ENVELOPE + SPK_DISCLAIMER) → başarı %55 (önceki delta %25'ten iyileşti)
- payload_check: 8KB → hâlâ yetersiz eşik uygulanıyor → başarı %40

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu (Post-Report Loop)

### Eksikler:
- **BLOCKED kararı doğru ✓** — HTML_ENVELOPE + SPK_DISCLAIMER eksikliği COO tarafından tespit edildi. İki direktiften sonra ilk kez COO bloker verdi; iyileşme.
- **MIN_PAYLOAD_SIZE 8KB PASS — 50KB direktifi 3. kez uygulanmadı** — Delta-update'te "50KB olarak güncelle" direktifi verilmişti; standard raporda da 8KB eşiği uygulandı. Bu direktif COO kodu seviyesinde güncellenmeli.
- **Havacılık completeness check BU TURDA DA KAPANMADI** — 14 Nisan direktifi: EBITDAR, 8 KPI, IFRS 16, Rusya üstgeçiş, EU ETS, CORSIA. Standard raporda da bu liste teslim kontrolünde kapatılmadı. 3. THYAO raporu; direktif hâlâ uygulanmıyor.
- **SPK_DISCLAIMER + HTML_ENVELOPE pre-brief direktifi uygulanmadı** — report_formatter'a brief yapılmadan önce bu iki zorunluluk belirtilmeli. Formatter çalışıp eksiklik tespit edilmesi değil, formatter başlamadan direktif verilmesi gerekirdi.
- **event_impact_mapper "Python template only" COO teslim kontrolünde görünmedi** — QA "Python template only" = P0 direktifi COO delivery check'ine eklenmemişti; bu kontrol atlattı.

### Bundan Sonra:
- **MIN_PAYLOAD_SIZE eşiği 50KB olarak kalıcı güncelle** — Bu direktif 3. kez yazılıyor. Bir dahaki THYAO analizinde 8KB geçerse COO otomatik BLOCKED verir. 50KB = ~15 sayfa A4 rapor minimum eşiği.
- **Havacılık completeness check listesini delivery matrisine kalıcı ekle** — EBITDAR hesaplandı mı? | 8 KPI var mı? | IFRS 16 ayrışması yapıldı mı? | Rusya üstgeçiş + EU ETS + CORSIA var mı? Bunlardan herhangi biri yoksa delivery BLOCKED.
- **report_formatter pre-brief standardı** — Her THYAO analizinde formatter'a brief: "HTML tam envelope (<html lang='tr'>...</html>), footer'da 'yatırım tavsiyesi değildir' notu, min 4 SVG grafik, 50KB+ içerik." Bu 4 şart brief'te zorunlu.
- **event_impact_mapper kontrol ekle** — Delivery check: event_impact_mapper çıktısında "Python template routing only" etiketleri var mı? Varsa P0 BLOCKED.

### Agent Performans Güncellemesi — THYAO Standard Post-Report Loop
- coo: MIN_PAYLOAD_SIZE eşiği 3. kez uygulanmadı → başarı %50
- havacılık_completeness: 3. THYAO analizinde de kapatılamadı → direktif başarısız

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **BLOCKED kararı doğru ✓** — HTML_ENVELOPE + SPK_DISCLAIMER eksikliği doğru tespit edildi. COO bu turda da işlevini yerine getirdi.
- **MIN_PAYLOAD_SIZE 8KB — 4. direktif hâlâ uygulanmadı** — Delta, Standard, Full ve şimdi Remediation — 4 raporda "50KB'ye güncelle" yazıldı; hâlâ 8KB eşiği aktif. Bu direktif kod seviyesinde değişmeden uygulanmayacak.
- **Havacılık completeness check 4. THYAO'da da kapatılmadı** — EBITDAR hesaplandı mı? 8 KPI var mı? IFRS 16 ayrıştırması var mı? EU ETS/CORSIA var mı? Bu 4 kontrol delivery matrisinde yoksa matris eksik.
- **event_impact_mapper "Python template only" kontrolü yine kaçtı** — COO bu kontrolü delivery check listesine eklemişti; aktif olarak uygulanmadı.
- **report_formatter pre-brief yapılmadı** — HTML envelope + SPK disclaimer direktifi formatter'a çalışmadan önce verilmeli. Sonradan tespit BLOCKED demek; önceden vermek sorun çıkarmamak demek.

### Bundan Sonra:
- **MIN_PAYLOAD_SIZE = 50KB artık sabit eşik (4. ve son direktif)** — 8KB eşiği kaldırıldı. Bir dahaki analizde 8KB PASS verilirse bu direktif tamamen geçersiz sayılır.
- **Havacılık delivery matrisine kalıcı 4 satır** — EBITDAR null → BLOCKED | 8 KPI eksik → BLOCKED | IFRS16 yok → BLOCKED | Rusya üstgeçiş+EU ETS yok → P1 uyarı.
- **event_impact_mapper "template_only: true" = COO seviyesi otomatik P0 BLOCKED.**

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **BLOCKED kararı doğru ✓** — HTML_ENVELOPE + SPK_DISCLAIMER eksikliği tespit edildi, delivery reddedildi. Bu turda COO işlevi doğru çalıştı.
- **MIN_PAYLOAD_SIZE 50KB hâlâ 8KB eşiğiyle çalışıyor — 4. direktif** — Önceki 3 bildirimde "50KB'ye güncelle" yazıldı; standard analizde de 8KB PASS olarak geçti. Kod seviyesinde güncellenmedi.
- **Havacılık completeness check 3. THYAO'da da kapatılmadı** — EBITDAR var mı, 8 KPI var mı, IFRS 16 ayrışması var mı, EU ETS/CORSIA bölümü var mı — bu 4 kontrol delivery matrisine hâlâ eklenmedi.
- **event_impact_mapper "Python template only" delivery check'ten kaçtı** — P0 bloker direktifi COO kontrol listesine yazılmış; ancak bu turu içinde aktif kontrol yapılmadı ve kaçtı.
- **report_formatter'a pre-brief yapılmadı** — HTML envelope + SPK disclaimer formatçıya çalışmaya başlamadan önce direktif olarak verilmedi; hata sonradan tespit edildi.

### Bundan Sonra:
- **MIN_PAYLOAD_SIZE = 50KB — bu kez kod değişikliği gerekiyor** — Pre-flight delivery check: `payload_size_kb < 50 → BLOCKED`. 8KB eşiği artık tolerans dışı; bir dahaki THYAO'da 8KB PASS verilirse bu direktif tamamen işlevsiz sayılır.
- **Havacılık delivery check matrisi (THYAO özel) kalıcı hale getirildi:**
  1. EBITDAR hesaplandı mı? (null → BLOCKED)
  2. 8 operasyonel KPI mevcut mu? (RPK/ASK/LF/CASK/RASK/Kargo/Filo/Hedging)
  3. IFRS 16 ROU ayrıştırması yapıldı mı?
  4. Rusya üstgeçiş + EU ETS + CORSIA bölümleri var mı?
  Herhangi biri yoksa → BLOCKED
- **event_impact_mapper delivery kontrol aktif hale geldi** — Çıktıda "Python template routing only" veya "template_only: true" etiketleri varsa → P0 BLOCKED. Bu kontrol artık delivery check döngüsünde.
- **report_formatter pre-brief standardı her THYAO'da zorunlu** — Formatter'a brief: "HTML tam envelope, footer'da SPK disclaimer, min 4 SVG, 50KB+ içerik" — 4 zorunluluk brief'te açıkça yazılacak.

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

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **BLOCKED kararı doğru ✓** — HTML_ENVELOPE + SPK_DISCLAIMER eksikliği yine tespit edildi. COO bloker doğru çalışıyor.
- **MIN_PAYLOAD_SIZE 8KB PASS — 5. direktif ihlali** — 8073 bytes PASS geçildi. 50KB direktifi 5 kez yazıldı, hiçbir zaman uygulanmadı. Bu artık kod seviyesinde hard-limit olarak tanımlanmalı.
- **Havacılık completeness check (EBITDAR/8KPI/IFRS16/EU ETS) bu turda da kapatılmadı** — 4 analizdir aynı 4 kontrol eksik. Delivery matrisi güncellenmedi.
- **event_impact_mapper "Python template only" bu turda da geçti** — 61 event için sıfır LLM katkısı; COO delivery check'te yakalanmadı.
- **report_formatter THYAO brand identity kullanmadı** — Finance X kendi blue/amber brand identity'siyle teslim etti; THYAO kırmızı-lacivert marka kimliği kullanılmadı. CEO direktifi: sirket brand identity taklit et.

### Bundan Sonra:
- **MIN_PAYLOAD_SIZE 50KB — kesin ve son (5. direktif, tolerans sıfır)** — Bir dahaki THYAO analizinde 8KB PASS verilirse COO performans skoru "KRİTİK SORUNLU"ya düşer.
- **THYAO brand identity kontrolü COO delivery check'e ekle** — Raporda `#E81932` (THYAO kırmızı) ve `#1C2B50` (lacivert) CSS renk değerleri yoksa → report_formatter'a geri gönder.
- **event_impact_mapper "template_only" = otomatik P0 BLOCKED** — Bu kontrolü delivery loop'a kod seviyesinde ekle; LLM katkısız impact mapping kabul edilemez.

### Agent Performans Güncellemesi — THYAO Full v4 (16 Nisan 2026)
- COO: BLOCKED kararı doğru ✓ (5. THYAO'da da) → başarı %60
- MIN_PAYLOAD_SIZE: 5. kez ihlal → direktif başarısız; kod seviyesinde fix zorunlu
- Havacılık completeness: 4. THYAO'da da kapatılmadı → direktif başarısız

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
