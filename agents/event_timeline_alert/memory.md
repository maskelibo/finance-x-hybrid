# Event Timeline Alert — Damıtılmış Hafıza

---

## Kalıcı Kurallar

- **4-Phase timeline FULL execution ZORUNLU:**
  - Immediate (0-30 gün): Aktif kriz ve yürürlükteki düzenleyici kararlar
  - Near-term (30-90 gün): Earnings + AGM + temettü = inflection points
  - Medium-term (90-180 gün): Normalization veri noktaları + regulatuar değişiklikler
  - Long-term (180-365 gün): Structural re-rating sinyalleri
- **Truncation YASAK** — 4 fazın hepsi tamamlanmalı; gerekirse Phase 1-2 + Phase 3-4 ayrı output
- **BLOCKED → Partial Complete:** Upstream eksikse bilinen verilerle oluştur, eksik kısımları "PENDING_IMPACT_DATA" etiketle. Tam BLOCKED YASAK
- **Upstream doğrulaması DOSYA SİSTEMİ üzerinden:** output JSON dosyasının varlığını kontrol et — context/hafızadan değil. Yoksa "PENDING_UPSTREAM_DATA" yaz
- **Şirket içi olay takvimi ile dış makro takvim İKİ AYRI BÖLÜMDE tut** — karışık tablo YASAK
- **Her timeline girdisinde: gerçek kaynak ID/URL + teyit seviyesi ver.** Beklenen pencere → `estimated` etiketle
- Her trigger için: metric + threshold + alert urgency + responsible agent
- Regulatory calendar ekle — BDDK/SPK/KAP/EPDK zorunlu bildirim tarihleri
- Forward-looking 12 aylık event takvimi oluştur
- "must-happen" events (kesin tarih) vs "expected-but-uncertain" events ayrı tut
- Confidence labels: HIGH (kesin tarih), MEDIUM (projeksiyon), LOW (belirsiz)
- **Jeopolitik trigger takvimi zorunlu (enerji şirketleri):** OPEC+, IEA rapor tarihleri, EPDK kararları, TCMB PPK tarihleri
- Immediate vs Scheduled ayrımı net: yürürlükteki karar → immediate; tarihli gelecek → near/medium/long
- Priority alert sadece yüksek kesinlik + maddi etki için kullanılmalı
- **Timeline çıktıları her olay için** `tarih + olay + olası surprise yönü + etkilenecek metrik + CEO/analyst aksiyonu` **formatında yazılacak** — yalnız tarih vermek yeterli sayılmayacak
- **Near-term timeline'da `mandate-specific watch window` zorunlu** — son 7 gün KAP olayları ve sonraki 30-90 gün catalystleri aynı takip zincirine bağlanacak
- **Near-term katalystler Bear/Baz/Bull senaryolarıyla çapraz bağlanmadan output tamamlanmış sayılmayacak**
- **Monitoring trigger'ları nicel olacak:** "İzle" yetmez → "Faiz +100bp → NIM -X TRY → değerleme -Y TL" zinciri kurulacak
- **Her event için aksiyon önerisi zorunlu:** "İzle" değil, "Q2'de EBITDA revize et / upstream update tetikle" gibi somut öneri

## Zorunlu Kontrol Listesi

- [ ] 4 faz (Immediate/Near/Medium/Long) tamamı dolu mu?
- [ ] Şirket olayları ve dış makro takvim ayrı bölümde mi?
- [ ] Her girdi için kaynak ID/URL ve teyit seviyesi var mı?
- [ ] Tahminler `estimated` etiketli mi?
- [ ] Regulatory calendar eklendi mi?
- [ ] Monitoring triggers (metric + threshold + urgency + nicel eşik) tanımlı mı?
- [ ] 12 aylık forward event takvimi var mı?
- [ ] Upstream output kontrolü (dosya sistemi) yapıldı mı?
- [ ] Near-term katalystler Bear/Baz/Bull ile çapraz bağlandı mı?
- [ ] Her event için aksiyon önerisi var mı?

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK: Phases 2-4 TAMAMEN EKSİK — regulatory deadline calendar da yok
- TCELL: Phase 2 başlamış ama kesilmiş, Phases 3-4 tamamen eksik — 4 faz tam ZORUNLU
- TUPRS: Koordinasyon hatası — event_impact_mapper çıktısı vardı ama "mevcut değil" denildi; dosya kontrolü yapmadan "upstream eksik" denilemez
- EREGL: Makro şoklar şirket disclosure timeline'ından ayrılmalıydı; Phase 3-4 truncated
- SAHOL: Tüm 3 bölüm tam teslim edilmedi; monitoring trigger'ları nicel eşik içermiyordu

## Son 3 Raporun Öğrenimleri

- **EREGL (2026-04-13):** EPDK tarife şoku IMMEDIATE'e konumlandırıldı ✓. AB Safeguard 1 Temmuz must-happen. Compound shock modeli gerekli (EPDK+Safeguard+CBAM birlikte)
- **THYAO (2026-04-14):** Havacılık regulatory calendar: TCMB PPK + Hazine/SPK deadlines + IATA/EASA + Q earnings — bunlar sabit eklenti. Upstream validation her zaman dosya sistemi
- **TCELL (2026-04-15):** Timeline her olay için yeniden hesaplanacak metrik listesini yazacak; near-term timeline'da mandate-specific watch window zorunlu; catalysts senaryolarla bağlanmalı

## Sektör Bilgi Bankası

- **Çelik IMMEDIATE kontrol:** EPDK tarifeleri + KAP son 7 gün + AB Safeguard kota + HRC spot (≥%5/hafta ise uyarı)
- **Temporary vs Structural:** Oil margin windfall = temporary (3-6 ay reversion). Enerji tarife +%25 = structural. Farklı izleme frekansı
- **Holding:** Multiple overlapping cycles; CEO tonu guidance/AGM = equity catalyst (±%3-5 tek gün)
- **EPDK Nisan 2026 (must-happen geçti):** Elektrik +%25, Sanayi +%20 — EREGL/TUPRS/çelik şirketi EBITDA etkisi güncellenmeli
- **Çelik regulatory calendar zorunlu:** EPDK periyodik tarife, AB Safeguard review (yıllık), CBAM doğrulama deadlines, KAP finansal rapor son tarihleri

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **Tüm olaylar "medium_term" + urgency "low" — Standard raporda tekrar, 3. THYAO** — CEO değişimi (9 Nisan 2026) = IMMEDIATE HIGH. İran rotaları askıya = IMMEDIATE HIGH. Bu kural iki kez yazıldı, iki kez ihlal edildi.
- **4-phase execution yapılmadı** — Sadece medium_term. IMMEDIATE (0-30 gün), Near-term (30-90 gün), Long-term (180-365 gün) fazları tamamen eksik.
- **materiality_pct: null tüm olaylar** — CEO değişimi için bile yönetim belirsizliği premi tahmini `[conf: LOW, proxy]` ile yapılabilirdi.
- **Near-term katalystler yok** — Mayıs 2026 Q1 sonuçları + yeni CEO ilk beyanı = en kritik near-term katalistler; timeline'da görünmüyor.
- **Bear/Baz/Bull senaryo çapraz bağlantısı yok** — Kural defalarca yazıldı, hâlâ uygulanmıyor.

### Bundan Sonra:
- **THYAO urgency kuralı (3. kez — artık kesinleşti, override şart):**
  - CEO/YK değişikliği → IMMEDIATE, urgency: HIGH
  - İran rota askıya (devam ediyor) → IMMEDIATE, urgency: HIGH
  - Brent ±%3+ hareket → IMMEDIATE, urgency: MEDIUM
  - Temettü sıfır kararı (tescil edildi) → IMMEDIATE, urgency: MEDIUM
- **4-phase şablon her THYAO analizinde** — Phase 1: CEO değişimi + İran + Brent | Phase 2: Q1 sonuçları + TCMB PPK | Phase 3: Rota normalize + yeni strateji | Phase 4: Filo CAPEX + 2026-2027
- **"medium_term" fallback = COO P1 flag** — Tüm eventlar medium_term ise COO urgency kalibrasyonunu reddedecek; bu kontrol COO delivery checklist'e eklendi.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **Tüm 119 event "medium_term" + urgency "low" — Delta ile aynı hata, standard raporda da tekrarlandı** — CEO değişimi (9 Nisan 2026) = IMMEDIATE, urgency: HIGH. İran rotaları = IMMEDIATE, urgency: HIGH. Bunlar önceki delta review'da da yazılmıştı.
- **4-phase execution yapılmadı** — Sadece medium_term. IMMEDIATE (0-30 gün), Near-term (30-90 gün), Long-term (180-365 gün) fazları tamamen eksik.
- **materiality_pct: null tüm olaylar** — CEO değişimi için bile yönetim belirsizliği premi tahmini yapılabilirdi.
- **Near-term katalystler yok** — Mayıs 2026 Q1 sonuçları + yeni CEO ilk beyanı = en kritik near-term katalistler; timeline'da görünmüyor.
- **Bear/Baz/Bull senaryo çapraz bağlantısı yok** — Kural defalarca yazıldı, hâlâ uygulanmıyor.
- **Monitoring trigger'ları nicel eşik içermiyor** — "İzle" yerine somut formül zorunlu.

### Bundan Sonra:
- **THYAO urgency scoring kuralı (3. kez):**
  - CEO/YK değişikliği → IMMEDIATE, urgency: HIGH
  - İran rota askıya alma (devam ediyor) → IMMEDIATE, urgency: HIGH
  - Brent ±%3+ hareket → IMMEDIATE, urgency: MEDIUM
  - Temettü sıfır kararı (tescil edildi) → IMMEDIATE, urgency: MEDIUM
  - Yönetim kurulu atamaları → near_term, urgency: LOW
- **4-phase execution zorunlu şablon** — Her THYAO analizinde: Phase 1 (IMMEDIATE): CEO değişimi + İran rotaları + Brent hareketi | Phase 2 (Near-term): Q1 sonuçları + TCMB PPK + İran ateşkes takibi | Phase 3 (Medium): Yeni stratejik yön + rota normalize | Phase 4 (Long): Filo CAPEX + 2026-2027 büyüme.
- **"medium_term" fallback = COO P1 flag** — Tüm eventslar medium_term ise COO urgency kalibrasyonu reddetmeli; bu kontrolü COO delivery check'e ekle.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **Tüm 119 event "medium_term" (90-180 gün) olarak etiketlendi** — CEO değişimi (9 Nisan 2026) P0 IMMEDIATE event; etkisi anında hissedilir (yönetim belirsizliği bugün fiyatlanır). İran krizi de IMMEDIATE (rota askıya alma devam ediyor). "medium_term" atamak bu olayları önemsizleştiriyor.
- **urgency_level: "low" tüm olaylar için** — CEO değişimi ve İran rotaları için urgency = HIGH olmalıydı. Temettü kararı urgency = MEDIUM (nakit koruması pozitif sinyal). Hiçbiri "low" değil.
- **4-phase execution eksik — sadece medium_term var** — Zorunlu 4 faz: Immediate (0-30 gün) + Near-term (30-90 gün) + Medium-term (90-180 gün) + Long-term (180-365 gün). Sadece medium_term üretildi; Immediate ve Near-term tamamen eksik.
- **materiality_pct: null tüm olaylar için** — 119 olaydan hiçbirinde % materyallik hesabı yok. CEO değişimi için bile "yönetim değişikliğinin EBITDA etkisi = belirsizlik premi × tarihsel peer analizi" yapılabilirdi.
- **Near-term katalystler (Mayıs 2026 Q1 sonuçları) yok** — En kritik near-term katalist: Mayıs 2026 Q1 sonuçları + yeni CEO'nun ilk stratejik beyanı. Bunlar timeline'da yok.
- **Bear/Baz/Bull senaryo çapraz bağlantısı yok** — Kural: "Near-term katalystler Bear/Baz/Bull senaryolarıyla çapraz bağlanmadan output tamamlanmış sayılmayacak." Hiçbir katalyst senaryo ile bağlanmadı.
- **Monitoring trigger'ları nicel eşik içermiyor** — "İzle" yerine "Yeni CEO Q1'de EBITDAR marjı ≥%23 açıklarsa → BULL senaryo ağırlığı %60'a çıkar" gibi somut trigger zorunlu.

### Bundan Sonra:
- **THYAO delta-update IMMEDIATE bölümü zorunlu olaylar:**
  - CEO değişimi (9 Nisan 2026) → IMMEDIATE, urgency: HIGH
  - İran rotaları askıya (devam ediyor) → IMMEDIATE, urgency: HIGH
  - Brent +%4.68 (bugün) → IMMEDIATE, urgency: MEDIUM
  - Temettü sıfır kararı → IMMEDIATE (tescil edildi), urgency: MEDIUM
- **Near-term bölümü zorunlu katalystler (THYAO):**
  - Mayıs 2026 Q1 sonuçları → yeni CEO'nun ilk stratejik açıklaması
  - TCMB PPK (22 Nisan 2026) → kur/maliyet etkisi
  - İran-ABD ateşkes/kriz gelişmesi → rota tekrar açılma tarihi
- **Urgency scoring kuralı** — CEO/YK değişikliği = HIGH; jeopolitik operasyonel etki = HIGH; makro fiyat hareketi ≥%3 = MEDIUM; temettü kararı = MEDIUM; governance atamaları = LOW.
- **Havacılık regulatory calendar (THYAO):**
  - Her ayın başı: Aylık trafik verisi KAP bildirimi
  - Mayıs 2026: Q1 finansal sonuçlar
  - Haziran 2026: IATA CAGR güncellemesi
  - Temmuz 2026: H1 operasyonel veri

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **Tüm eventler medium_term + low urgency — 2. standart THYAO** — CEO değişimi = IMMEDIATE + HIGH; İran rotaları = IMMEDIATE + HIGH; Brent hareketi = IMMEDIATE + MEDIUM. Bunların tamamı yanlış urgency ile sınıflandırıldı.
- **4 fazlı yapı (IMMEDIATE/NEAR-TERM/MEDIUM/LONG) uygulanmadı** — Tüm olaylar tek faza yığıldı; zaman çizelgesi analizi yapılamadı.
- **materiality_pct hiçbir olay için hesaplanmadı** — Her olay için EBITDA etkisinin yüzdesi zorunlu; null döndürüldü.
- **Near-term katalistler listelenmedi** — Q1 sonuçları (Mayıs), TCMB PPK (22 Nisan), İran ateşkes/kriz gelişmesi — bunlar near-term bölümüne girmedi.
- **Bear/Baz/Bull senaryo bağlantısı kurulmadı** — Her event timeline alert hangi senaryoyu güçlendiriyor/zayıflatıyor? Bu bağlantı üretilmedi.

### Bundan Sonra:
- **Urgency calibration kuralları (hard-coded, override edilemez):**
  - CEO/YK değişimi → IMMEDIATE + HIGH (her zaman)
  - Jeopolitik operasyonel etki (rota kapanması) → IMMEDIATE + HIGH
  - Makro fiyat hareketi ≥%3 (Brent/kur) → IMMEDIATE + MEDIUM
  - Temettü kararı (sıfır/ödeme) → IMMEDIATE + MEDIUM
  - Governance atamaları → NEAR-TERM + LOW
- **4 fazlı yapı zorunlu (her analizde):**
  - IMMEDIATE (0-48 saat): CEO değişimi + İran rotaları + Brent spike
  - NEAR-TERM (1-4 hafta): Q1 sonuçları + TCMB PPK + CEO stratejik açıklaması
  - MEDIUM-TERM (1-3 ay): İran kriz çözümü + rota tekrar açılması + H1 operasyonel veri
  - LONG-TERM (3+ ay): EU ETS/CORSIA, filo büyüme kararları, ILS rating
- **Her alert için Bear/Baz/Bull senaryo bağlantısı:** "Bu event gerçekleşirse → [Bull/Baz/Bear] senaryo ağırlığı değişir, nasıl?"

## CEO Geri Bildirimi — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417)

### Eksikler:
- **TAMAMEN BOŞ çıktı — önceki turlardan daha kötü (regresyon)** — impact_timeline: [], priority_alerts: [], upcoming_calendar: []. Önceki THYAO'larda en azından medium_term fallback girişleri vardı; bu turda sıfır. Bu en kötü performans.
- **4-phase execution 4. THYAO standard'da da yapılmadı, deep_dive'da da yok** — IMMEDIATE/NEAR-TERM/MEDIUM/LONG fazları; direktif 4 kez verildi.
- **CEO değişimi, İran rotaları, Brent spike — hiçbiri listede bile yok** — Priority alerts tamamen boş; bunların IMMEDIATE+HIGH olması şart.
- **Upcoming calendar boş** — Mayıs 2026 Q1 sonuçları, TCMB PPK 22 Nisan, EREGL temettü tarihi bile eklenmedi.
- **Bear/Baz/Bull senaryo bağlantısı kurulmadı (4. THYAO)** — Her event timeline alert hangi senaryoyu güçlendiriyor sorusu yanıtsız.
- **materiality_pct 4. kez null** — Her olay için EBITDA etkisi yüzdesi hesabı yapılmadı.

### Bundan Sonra:
- **Boş çıktı = COO P0 bloker (kesinleşti)** — impact_timeline: [] gelmesi COO tarafından QA FAIL ile eşdeğer P0 bloker olarak işaretlenir; pipeline durur.
- **THYAO IMMEDIATE zorunlu olaylar (hard-coded, override edilemez):**
  - CEO/YK değişimi → IMMEDIATE + HIGH
  - İran rotaları askıya → IMMEDIATE + HIGH
  - Brent ±%3+ → IMMEDIATE + MEDIUM
  - Temettü kararı → IMMEDIATE + MEDIUM
- **4 fazlı şablon zorunlu (deep_dive dahil her modda):**
  - IMMEDIATE: CEO değişimi, İran rotaları, Brent hareketi
  - NEAR-TERM: Q1 sonuçları, TCMB PPK, CEO stratejik beyanı
  - MEDIUM: İran kriz çözümü, rota normalizasyonu
  - LONG: EU ETS/CORSIA, filo CAPEX, ILS rating
- **Her event için Bear/Baz/Bull bağlantısı 1 cümle** — "Bu event gerçekleşirse → [Bull/Baz/Bear] ağırlığı artar." 1 cümle yeterli; sıfır kabul edilemez.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **Tüm eventler medium_term + low urgency — 3. THYAO standardı, artık kalıcı bloker** — CEO değişimi + İran rotaları + Brent hareketi üçü birden IMMEDIATE + HIGH/MEDIUM gerektiriyor. Direktif 3 kez yazıldı; 3 turda uygulanmadı. COO delivery check bu hatayı geçirmemeli.
- **4 fazlı yapı 3. turda da uygulanmadı** — IMMEDIATE/NEAR-TERM/MEDIUM/LONG bölümleri üretilmedi; tüm olaylar tek zamana yığıldı.
- **materiality_pct 3. turda da null** — Her olay için % EBITDA etkisi hesabı zorunlu; 3 turda sıfır üretim.
- **Near-term katalystler 3. turda da listelenmedi** — Mayıs 2026 Q1 sonuçları, 22 Nisan TCMB PPK, yeni CEO'nun ilk stratejik beyanı — bunlar near-term bölümüne 3 turda da girmedi.
- **Bear/Baz/Bull senaryo bağlantısı 3. turda da kurulmadı** — Her alert "Bu event gerçekleşirse hangi senaryo güçleniyor?" sorusunu yanıtsız bıraktı.
- **COO urgency kalibrasyonu kontrolü 3. turda da başarısız** — "medium_term fallback = COO P1 flag" direktifi uygulanmadı.

### Bundan Sonra:
- **Urgency scoring = COO delivery gate hard check (artık kod değişikliği gerekli):**
  - CEO/YK değişimi → IMMEDIATE + HIGH; aksi COO tarafından BLOCKED
  - Jeopolitik rota kapanması → IMMEDIATE + HIGH; aksi BLOCKED
  - Brent ±%3+ → IMMEDIATE + MEDIUM; aksi BLOCKED
  - Temettü kararı → IMMEDIATE + MEDIUM; aksi BLOCKED
  - Tüm eventler medium_term → COO otomatik P1 FLAG + geri gönder
- **4 fazlı yapı = zorunlu template (override edilemez):**
  - IMMEDIATE (0-48h): CEO değişimi, İran rotaları, Brent spike
  - NEAR-TERM (1-4 hafta): Q1 sonuçları, TCMB PPK, CEO stratejik açıklaması
  - MEDIUM-TERM (1-3 ay): İran kriz çözümü, rota normalizasyonu
  - LONG-TERM (3+ ay): EU ETS/CORSIA, filo CAPEX, ILS rating
- **Bear/Baz/Bull bağlantısı her alert için 1 cümle bile zorunlu** — "Bu event gerçekleşirse → [Bull/Baz/Bear] senaryo ağırlığı artar/azalır." 1 cümle yeterli; sıfır üretim kabul edilmez.
- **materiality_pct hesap zorunlu** — TRY etkisi / yıllık EBITDA. EBITDA null ise sektör proxy (IATA EBITDAR %) kullan; yine null bırakma.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **Tüm eventler medium_term + low urgency — 4. standart THYAO, artık kalıcı bloker** — CEO değişimi + İran rotaları + Brent hareketi üçü birden IMMEDIATE + HIGH/MEDIUM gerektiriyor. 4 turda uygulanmadı. COO delivery check bu hatayı yakalamalıydı.
- **4 fazlı yapı — 4. turda da uygulanmadı** — IMMEDIATE/NEAR-TERM/MEDIUM/LONG bölümleri üretilmedi; tüm olaylar tek zamana yığıldı. (Not: bu turda deep_dive'dan farklı olarak en azından bazı medium_term girişler var — tam boş değil.)
- **materiality_pct 4. turda da null** — % EBITDA etkisi hesabı zorunlu; 4 turda sıfır üretim.
- **Near-term katalystler — 4. turda da yok** — Q1 sonuçları, TCMB PPK, yeni CEO stratejik beyanı near-term bölümüne girmedi.
- **Bear/Baz/Bull senaryo bağlantısı — 4. turda da kurulmadı** — Her alert hangi senaryoyu güçlendiriyor? sorusu yanıtsız.

### Bundan Sonra:
- **Urgency scoring = COO delivery gate hard check (kod değişikliği gerekli):**
  - CEO/YK değişimi → IMMEDIATE + HIGH; aksi COO BLOCKED
  - Jeopolitik rota kapanması → IMMEDIATE + HIGH; aksi BLOCKED
  - Brent ±%3+ → IMMEDIATE + MEDIUM; aksi BLOCKED
  - Tüm eventler medium_term → COO otomatik P1 FLAG + geri gönder
- **4 fazlı şablon = zorunlu template:**
  - IMMEDIATE (0-48h): CEO değişimi, İran rotaları, Brent spike
  - NEAR-TERM (1-4 hafta): Q1 sonuçları, TCMB PPK, CEO stratejik açıklaması
  - MEDIUM-TERM (1-3 ay): İran kriz çözümü, rota normalizasyonu
  - LONG-TERM (3+ ay): EU ETS/CORSIA, filo CAPEX, ILS rating
- **Bear/Baz/Bull bağlantısı her alert için zorunlu** — 1 cümle bile yeterli; sıfır üretim kabul edilmez.
- **materiality_pct hesap zorunlu** — EBITDA null ise sektör proxy kullan; null bırakma.

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **Tüm olaylar medium_term + low urgency** — ASELS temettü dağıtımı ve AGM BUGÜN (17 Nisan) gerçekleşiyor; bunlar IMMEDIATE önceliğiyle işaretlenmeli, LOW urgency değil.
- **4 fazlı yapı uygulanmadı** — IMMEDIATE/NEAR-TERM/MEDIUM-TERM/LONG-TERM bölümleri üretilmedi; tüm olaylar tek kategoriye sıkıştırıldı.
- **materiality_pct: null tüm bildirimlerde** — TRY etkisi / EBITDA = % materyallik hesabı yapılmadı.
- **Savunma sektörü özel katalystler missing** — Yeni sözleşme duyurusu → sipariş defteri artışı → revenue guidance güncelleme potansiyeli bağlantısı kurulmadı.
- **Jeopolitik tetikleyici bağlantısı yok** — Iran-ABD gerilim artışı → ASELS savunma talebi → hisse fiyatı etkisi senaryo zinciri raporlanmadı.
- **Near-term katalystler eksik** — Q1 2025 finansal sonuç açıklaması, sonraki SSB ihale duyurusu, YK raporu yayını beklenen olaylar listesine girilmedi.

### Bundan Sonra:
- **Savunma şirketleri için 4 fazlı alert şablonu:**
  - IMMEDIATE (0-48s): Bugün gerçekleşen temettü/AGM; acil jeopolitik gelişmeler; yeni kritik sözleşme
  - NEAR-TERM (1-4 hafta): Çeyrek finansal sonuçlar; SSB ihale kararları; Türkiye savunma bütçesi açıklaması
  - MEDIUM-TERM (1-3 ay): TSKGV pay yapısı değişiklikleri; AR-GE milestone bildirimleri; ihracat izin kararları
  - LONG-TERM (3+ ay): Çok yıllık sözleşme dönüşümleri; uluslararası savunma fuarı öncesi
- **Bugün gerçekleşen her olay = IMMEDIATE + YÜKSEK — artık hard kural** — Analiz tarihi ile olay tarihi aynıysa otomatik IMMEDIATE tetiklenir.
