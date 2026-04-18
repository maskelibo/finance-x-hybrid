# Event Impact Mapper — Damıtılmış Hafıza

---

## Kalıcı Kurallar

- Her olayı EVENT TYPE tablosundan bir kategoriye eşle (10 tip); kategorisiz etki analizi yapma
- Her hesaplama için formülü açık yaz, her input'un kaynağını cite et (KAP, agent output, web)
- Her impact'i baseline'a göre % materyal olarak değerlendir
- Confidence label zorunlu: High / Medium / Low / Speculative — belirsizliği gizleme
- IAS 29 etkisini her zaman operasyonel kardan ayır; muhasebe kazancı nakit akışı değildir
- Portfolio düzeyinde net P&L ve kaldıraç etkisini toplu hesapla (her olayı birlikte gör)
- Veri eksikse sektör benchmark proxy kullan — "speculative" etiketle; "yapılamaz" demek YASAK
- Her event için TAM impact mapping — yarım JSON YASAK
- Multi-event portfolio analysis ZORUNLU — events'leri ayrı ayrı değil birlikte analiz et
- **Makro düzenleyici karar (EPDK, BOTAŞ, BDDK) → birinci öncelik:** 24 saat içinde sayısal haritalama ZORUNLU
- **event_timeline_alert IMMEDIATE fazındaki olaylar → haritalama tamamlanmadan çıktı gönderilmez**
- **Her event için P&L, bilanço ve nakit akışı etkisini AYRI AYRI işaretle**
- Formül + kaynak yoksa nedenini açık yaz; quantification yoksa da senaryo aralığı ver `[conf:LOW]`
- `disclosure event` ile `economic effect` ayrımını zorunlu alan yap — zincir olay = tek ekonomik etki
- Her event impact girdisini doğrudan birincil disclosure veya finansal tabloya bağla
- Holding şirketlerinde: equity impact + NAV impact + holding discount impact — üç katman birlikte hesapla
- Board/governance events için qualitative impact framework ZORUNLU
- CFO/Mali GM değişimi → 3 başlık: önceki politika / fark / değişim riski
- FCF-temettü açığı → 3 kapatma yolu (nakit tüketimi, borçlanma, temettü kesintisi) olasılık ağırlıklarıyla sun
- **Etki zinciri ZORUNLU her material event için:** `tetikleyici → operasyonel KPI → P&L/BS/CF kalemi → rasyo etkisi → valuation/senaryo etkisi`
- **Jeopolitik olaylarda 4 kanal ayrı sayısallaştır:** `enerji → finansman → talep → regule fiyatlama` — her kanal boş bırakılmayacak; veri yoksa `[conf:LOW, proxy]`
- **Her material event sonunda Bear/Baz/Bull delta satırı ZORUNLU** — valuation agent ve synthesis bu delta setini kullanacak
- Çelik analizinde CBAM + AB Safeguard haritalama zorunlu — kesin % yoksa sektör proxy + `[conf:LOW]`
- Çok tesisli şirketlerde tesis bazlı impact ayrıştır (örn: Erdemir Zonguldak vs İsdemir İskenderun farklı enerji profili)
- Holding EVENT 3+ truncation önlemi: Batch mapping tablosunu ilk çıktıda ver; detayları EVENT 1-3 + EVENT 4+ iki blok gönder
- Perakende: temettü sürdürülebilirliği = OCF / payout; CEO interim risk = governance prim etkisi; spin-off: segment ayrışması

## Zorunlu Kontrol Listesi

- [ ] Her event için tam quantification (P&L + bilanço + nakit akışı) tamamlandı mı?
- [ ] IMMEDIATE fazındaki tüm olaylar haritalandı mı?
- [ ] Makro düzenleyici kararlar (EPDK/BOTAŞ) birinci öncelik olarak işlendi mi?
- [ ] Multi-event portfolio analizi (net P&L + kaldıraç) yapıldı mı?
- [ ] Disclosure event vs economic effect ayrımı yapıldı mı?
- [ ] Confidence label her impact'te var mı?
- [ ] Formül + kaynak her hesaplamada yazıldı mı?
- [ ] Etki zinciri (tetikleyici→KPI→P&L/BS/CF→rasyo→valuation) her event için var mı?
- [ ] Bear/Baz/Bull delta satırı her material event sonunda var mı?

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK/TCELL: Events 2-5 mappings TAMAMEN EKSİK — ilk event detaylı, kalanlar truncated YASAK
- TUPRS: Hurmuz krizi 4 kanal haritalanmadı (enerji/finansman/talep/regule) — jeopolitik olay atlama YASAK
- EREGL: EPDK ENERJİ TARİFE ŞOKU HARİTALANMADI (-4.0/-4.5B TRY/yıl EBITDA). AB Safeguard Temmuz 2026 eksik
- BIMAS: "1.2B shares" hatası — hisse adedi değişmedi, nominal sermaye arttı (doğru format: "nominal sermaye X TRY arttı, hisse adedi değişmedi")
- SAHOL: IAS29 impact [PENDING] yerine tahmini değer + `[TAHMİN: ~X TRY, conf:LOW]` formatı zorunlu

## Son 3 Raporun Öğrenimleri

- **EREGL (2026-04-13):** Çelik: EBITDA-based payout daha anlamlı; likit varlık ≠ dar nakit; CAPEX/EBITDA >%100 → FCF negatif + temettü = likit tampon tüketimi
- **THYAO (2026-04-14):** Havacılık zorunlu: Brent duyarlılığı ($10 → EBITDA TRY), rota suspansiyonu (kapasiteli hesap), hedge oranı — yoksa `[PENDING]` değil `[conf:LOW, sektör proxy]`
- **TCELL (2026-04-15):** Jeopolitik her olay için 4 kanal (enerji/finansman/talep/regule) — bear/base/bull delta event map'ten türetilmeli; "mock output" YASAK

## Sektör Bilgi Bankası

- **Çelik zorunlu haritalama:** (1) Enerji şokları (EPDK), (2) Hammadde (demir cevheri, kok, hurda), (3) AB (Safeguard+CBAM), (4) Borçlanma, (5) Kredi notu
- **Net Borç/EBITDA:** <3x sağlıklı | 3-5x orta | 5-7x yüksek | >7x distressed
- **Faiz karşılama (EBITDA/Faiz):** >4x sağlıklı | 2-4x yeterli | <2x distressed
- **Temettü kırmızı bayraklar:** Borçtan, IAS29 kazancından veya varlık satışından ödenen temettü
- **EPDK Nisan 2026:** Elektrik +%25, Sanayi ortalama +%20, Doğalgaz santral +%24.2 (Yürürlük: 4 Nisan 2026)

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **"Python template routing only" — LLM katkısı SIFIR** — 61 olay için "quantification_notes: Python template routing only — LLM layer may refine magnitude from parsed financials" yazıldı. Bu demek ki hiçbir olay için gerçek sayısal haritalama yapılmadı; tüm quantification_estimate: null. Bu kural ihlali.
- **quantification_possible: false, quantification_estimate: null — tüm görünen olaylar için** — Temettü sıfır kararı için: "118.2 bn TRY ödenmedi → BS: retained earnings +118.2B TRY" hesabı yapılabilirdi. CEO değişimi için: "belirsizlik primi → EV/EBITDAR iskonto senaryosu" üretilebilirdi.
- **CEO değişimi için qualitative impact framework yok** — Kural: "Board/governance events için qualitative impact framework ZORUNLU" + "CFO/Mali GM değişimi → 3 başlık." Yeni CEO atanmasında da aynı 3 başlık uygulanmalıydı: (1) Önceki politika (eski CEO stratejisi), (2) Fark (yeni CEO bilinmeyenleri), (3) Değişim riski (strateji süreksizliği, yatırımcı güveni).
- **İran rotaları için 4 kanal haritalama yok** — Kural: "Jeopolitik olaylarda 4 kanal ayrı sayısallaştır: enerji → finansman → talep → regule fiyatlama." 10 rota askıya için:
  - Enerji: Orta Doğu rotası yakıt sarfiyatı azalıyor (kısmen olumlu)
  - Talep: Transit yolcu kaybı (Asya-Avrupa bağlantı rotaları)
  - Finansman: Yok (kredi değil operasyonel karar)
  - Regule fiyatlama: Rota lisansı/slot hakkı değişimi
  Hiçbiri haritalanmadı.
- **Bear/Baz/Bull delta satırları tüm olaylar için yok** — 61 "requiring_full_mapping" olayından hiçbiri için Bear/Baz/Bull delta satırı üretilmedi.
- **Etki zinciri (tetikleyici→KPI→P&L/BS/CF→rasyo→valuation) yok** — Tüm mapping "Python template" seviyesinde kaldı; zincir kurulmadı.

### Bundan Sonra:
- **Havacılık sektörü P0 haritalama listesi:**
  1. CEO değişimi → qualitative impact (3 başlık) + valuation uncertainty premium (EV/EBITDAR iskonto senaryosu)
  2. Temettü sıfır → BS retained earnings +X bn TRY; FCF tezi güçleniyor; temettü beklentisi olan yatırımcılar exit mi?
  3. İran rotaları → kapasite × günlük sefer × bilet geliri = TRY gelir kaybı formülü; sektör proxy: $X mn/rota/ay
  4. Brent +%4.68 → THYAO yakıt maliyet artışı = (yıllık yakıt gideri × brent beta) × 3/365 günlük etki
- **"Python template routing only" = FAIL** — Bu etiket görünürse output teslim edilmez. LLM katkısı olmayan impact mapping geçersiz.
- **quantification yoksa proxy + [conf:LOW] zorunlu** — "quantification_possible: false" kararı için "kural gereği sektör proxy kullanıyorum" notu + en kötü/orta/iyi senaryo aralığı ver; null bırakma.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **"Python template routing only" — Standard raporda da tekrarlandı, 3. THYAO** — LLM katkısız impact mapping kabul edilemez. Delta'da yazıldı, uygulanmadı.
- **quantification_estimate: null tüm görünür olaylar** — Temettü sıfır: "retained earnings +118.2B TRY" hesaplanabilirdi. CEO değişimi: qualitative 3-başlık framework üretilebilirdi. Null bırakmak için geçerli gerekçe yok.
- **CEO değişimi için qualitative impact framework yok** — Kural: board/governance events için 3 başlık zorunlu: (1) Önceki CEO politikası, (2) Yeni CEO bilinmeyenleri, (3) Strateji süreksizliği riski. Hiçbiri üretilmedi.
- **İran rotaları 4-kanal haritalama yok** — Enerji / Finansman / Talep / Regule fiyatlama — 4 kanal direktifi 3. kez uygulanmadı.
- **Bear/Baz/Bull delta satırları yok** — Material eventların hiçbiri için delta satırı üretilmedi.

### Bundan Sonra:
- **"Python template routing only" = OTOMATİK COO P0 BLOCKED (3. direktif, kesinleşti)** — Bu etiket görünürse COO teslim kontrolünde geri çevrilecek; event_impact_mapper LLM katkısız çıktı göndermeyecek.
- **Havacılık P0 haritalama 4 zorunlu olay (her THYAO analizinde):**
  1. CEO değişimi → qualitative impact 3 başlık + EV/EBITDAR belirsizlik premi senaryo
  2. Temettü sıfır → BS retained earnings +X bn TRY + FCF tezi etkisi
  3. İran rotaları → kapasite × sefer × bilet geliri = TRY kayıp formülü
  4. Brent ±%3+ → yıllık yakıt gideri × günlük etki
- **quantification yoksa proxy + [conf: LOW] zorunlu** — "quantification_possible: false" kararı için: kural gereği sektör proxy + en kötü/orta/iyi senaryo aralığı. Null bırakma yasak.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **"Python template routing only" — 2. kez aynı THYAO hatası** — 61 event için gerçek haritalama yapılmadı. Delta'da da aynı sorun oluşmuş ve memory'ye yazılmıştı; uygulanmadı.
- **quantification_estimate: null tüm görünür olaylar için** — Temettü sıfır kararı: "retained earnings +118.2B TRY" hesaplanabilirdi. CEO değişimi: qualitative framework (3 başlık) üretilebilirdi.
- **İran rotaları 4-kanal haritalama yok** — Enerji / Finansman / Talep / Regule fiyatlama — 4 kanal direktifi bir kez daha uygulanmadı.
- **Brent +%4.68 → yakıt maliyeti haritalama yok** — THYAO yıllık yakıt gideri × Brent beta = günlük etki hesabı üretilmedi.
- **Bear/Baz/Bull delta satırları yok** — 61 full-mapping gerektiren olaydan hiçbiri için.
- **Etki zinciri (tetikleyici→KPI→P&L/BS/CF→rasyo→valuation) yok** — Zincir kurulmadan haritalama geçersiz.

### Bundan Sonra:
- **"Python template routing only" = OTOMATİK FAIL** — Bu etiket görünürse COO teslim kontrolünde P0 BLOCKED kararı verilecek. event_impact_mapper LLM katkısız çıktı göndermeyecek.
- **Havacılık P0 haritalama zorunlu 4 olay (direktif 2. kez):**
  1. CEO değişimi → qualitative impact 3 başlık + EV/EBITDAR belirsizlik premi senaryo
  2. Temettü sıfır → BS retained earnings +118.2B TRY + FCF tezi etkisi
  3. İran rotaları → kapasite × sefer × bilet geliri = TRY kayıp formülü
  4. Brent +%4.68 → yıllık yakıt gideri × 3/365 = günlük maliyet artışı
- **Standard raporda "Python template only" çıktısı COO tarafından BLOCKED edilmeli** — Bu kontrol COO delivery check listesine eklenmeli.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **TUPRS hisse satışı defter değeri bilinmiyor → net P&L katkı eksik** — 9,320 mn TL satış bedeli verildi ✓. Ancak "defter değeri bilinmiyor — KAP Not'tan çekilmeli" notu konuldu ve bırakıldı. Defter değeri = KCHOL bilançosundaki TUPRS yatırım tutarı; bu KAP PDF 1555903'ten çekilebilir.
- **Olay 3 (KAP 1383079) tamamen boş** — Bilinmeyen varlık satışı için "P&L Etkisi: [VERİ YOK]" verildi ama sektör proxy bile kullanılmadı. Kural: veri yoksa sektör benchmark proxy + `[conf: LOW]`.
- **FCF-temettü açığı 3 kapatma yolu analizi eksik** — FCF -204,862 mn TL iken 17,320 mn TL temettü ödendi. Bu kombinasyonun sürdürülebilirlik analizi: (1) nakit tüketimi, (2) borçlanma, (3) varlık satışı — 3 senaryo olasılık ağırlıklarıyla verilmedi.
- **Bear/Baz/Bull delta satırları tüm olaylar için yok** — Portfolio heatmap var ✓ ama her olay için ayrı Bear/Baz/Bull delta satırı (örn: İran ateşkes → Bear: TUPRS EBITDA -12,000, Baz: -4,000, Bull: +2,000) eksik.

### Bundan Sonra:
- **TUPRS defter değeri = KCHOL BS "Finansal Yatırımlar" satırından** — KAP PDF 1555903 bilanço sayfasında "Uzun Vadeli Finansal Yatırımlar" altında TUPRS yatırım tutarı bulunur. Satış bedeli - defter değeri = P&L katkı.
- **FCF-temettü gap analizi holding için zorunlu** — Her KCHOL raporunda: FCF + nakit bakiyesi vs temettü yükümlülüğü. Açık varsa 3 senaryo (nakit eritme / borç / satış) mutlaka verilecek.
- **Her material event için Bear/Baz/Bull delta zorunlu** — Formatı standart: [Olay | Bear EBITDA Δ | Baz EBITDA Δ | Bull EBITDA Δ | Trigger | Tarih]. Bu tablo valuation_agent'a ve strategic_synthesis'e doğrudan besleniyor.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **"Python template routing only" — 2. THYAO standard analizi** — Gerçek LLM analizi yapılmadı; template çıktısı üretildi. Tüm impact değerleri null veya sabit placeholder. Bu 2. standart THYAO'da tekrarlandı.
- **4 kanal eşleme yapılmadı** — CEO değişimi, temettü sıfır, İran rotaları, Brent hareketi için her olay-kanal zinciri üretilmedi.
- **Hiçbir olay için sayısallaştırma yok** — TRY gelir etkisi, EBITDA etkisi, EPS delta — hepsi null.
- **Bear/Baz/Bull delta tablosu yok** — Strategic_synthesis ve valuation için zorunlu girdi üretilmedi.
- **COO "Python template only" tespit edemedi** — COO kontrol listesinde bu bloker aktif değildi; kaçtı.

### Bundan Sonra:
- **"Python template only" = otomatik FAIL + P0 BLOCKED (COO tarafından da kontrol edilecek)** — Çıktıda template_only: true veya impact değerlerinin tamamı null ise: output reddedilir, LLM analizi tekrar çalıştırılır.
- **THYAO 4 zorunlu kanal eşleme (her analizde):**
  1. CEO değişimi → strateji sürekliliği + EV/EBITDAR belirsizlik premi + yatırımcı güven senaryosu (3 başlık)
  2. Temettü sıfır → BS retained earnings artışı + FCF tezi etkisi + temettü verimine dair beklenti revizyonu
  3. İran rotaları → (İptal edilen sefer/hafta) × (ortalama doluluk %83) × (bilet geliri USD) = yıllık TRY gelir kaybı
  4. Brent hareketi → (yıllık yakıt gideri) × (Brent %Δ) × (1 - hedging oranı) = EBITDA etkisi
- **Her olay için Bear/Baz/Bull delta tablosu:** Olay | Bear Δ | Baz Δ | Bull Δ | Trigger koşul | Beklenen tarih.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **"Python template routing only" — 3. THYAO standardı, kalıcı P0** — Gerçek LLM analizi yapılmadı. 61 event için impact haritalama tamamen template çıktısı. Bu hatanın 3 turda tekrarlanması artık sistematik arıza; kod düzeyinde çözüm şart.
- **quantification_estimate: null tüm olaylar** — CEO değişimi, İran rotaları, Brent hareketi, temettü sıfır — dört kritik olay için TRY etki hesabı sıfır. Tümü için proxy + [conf: LOW] üretilebilirdi.
- **CEO değişimi qualitative framework üretilmedi** — Direktif: 3 başlık zorunlu. (1) Strateji sürekliliği değerlendirmesi, (2) EV/EBITDAR belirsizlik premi senaryo, (3) Yatırımcı güven testi. Hiçbiri üretilmedi.
- **İran rotaları 4-kanal haritalama 3. THYAO'da da yok** — Direktif 3 kez yazıldı: Kapasite/Enerji/Finansman/Regülasyon kanalları üretilmedi.
- **Bear/Baz/Bull delta tablosu 3. THYAO'da da yok** — strategic_synthesis ve valuation bu tabloya muhtaç; yokluğu downstream'i doğrudan etkiliyor.
- **COO "template only" tespiti 3. turda da başarısız** — COO delivery gate bu kontrolü uygulamadı; bloker kapısından geçti.

### Bundan Sonra:
- **"Python template only" = Kod düzeyinde engellenecek (son direktif)** — COO delivery check: impact_mapping_mode: "template_only" → otomatik BLOCKED; operator eskalasyon. Artık memory direktifi değil, kod değişikliği gerekli.
- **THYAO 4 zorunlu haritalama (v4 sonrası hard-coded):**
  1. CEO değişimi → strateji sürekliliği + EV/EBITDAR premi + yatırımcı güven (3 başlık, qualitative kabul edilir)
  2. Temettü sıfır → retained earnings +118.2B TRY + FCF tezi etkisi + temettü beklenti revizyonu
  3. İran rotaları → iptal sefer × doluluk %83 × bilet USD = TRY gelir kaybı [conf: LOW]
  4. Brent hareketi → yıllık yakıt gideri × Brent %Δ × (1 - hedge oranı) = EBITDA etkisi [conf: LOW]
- **Bear/Baz/Bull delta = downstream için zorunlu input** — strategic_synthesis ve valuation bu tablo olmadan senaryo ağırlığı atayamaz. event_impact_mapper bu tabloyu üretmeden çıktı tamamlanmamış sayılır.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **"Python template routing only" — 4. standart THYAO, kod düzeyinde çözüm zorunlu** — Gerçek LLM analizi yapılmadı. 4 THYAO turunda tüm impact haritalama template çıktısı olarak geldi. Memory direktifi artık etkisiz; kod değişikliği şart.
- **quantification_estimate: null tüm olaylar — 4. THYAO** — CEO değişimi, İran rotaları, Brent, temettü sıfır — dört kritik olay için TRY etki hesabı sıfır. Proxy + [conf: LOW] kabul edilir.
- **CEO değişimi qualitative framework üretilmedi — 4. THYAO** — 3 başlık: (1) Strateji sürekliliği, (2) EV/EBITDAR belirsizlik premi senaryosu, (3) Yatırımcı güven testi. Hiçbiri üretilmedi.
- **İran rotaları 4-kanal haritalama — 4. THYAO'da da yok** — Kapasite/Enerji/Finansman/Regülasyon kanalları; direktif 4 kez yazıldı, uygulanmadı.
- **Bear/Baz/Bull delta tablosu — 4. THYAO'da da yok** — strategic_synthesis ve valuation bu tabloya muhtaç.
- **COO "template only" tespiti — 4. turda da başarısız** — COO delivery gate bu kontrolü uygulamadı.

### Bundan Sonra:
- **"Python template only" = kod düzeyinde engellenecek (son direktif — memory'de artık tekrarlanmıyor)** — COO delivery check: `impact_mapping_mode: "template_only"` → otomatik BLOCKED. Kod değişikliği olmadan düzelmez.
- **THYAO 4 zorunlu haritalama (hard-coded):**
  1. CEO değişimi → strateji sürekliliği + EV/EBITDAR premi + yatırımcı güven (3 başlık)
  2. Temettü sıfır → retained earnings +118.2B TRY + FCF tezi + temettü beklenti revizyonu
  3. İran rotaları → iptal sefer × doluluk %83 × bilet USD = TRY gelir kaybı [conf: LOW]
  4. Brent hareketi → yıllık yakıt gideri × Brent %Δ × (1 - hedge) = EBITDA etkisi [conf: LOW]
- **Bear/Baz/Bull delta tablosu = downstream için zorunlu input** — Bu tablo olmadan strategic_synthesis senaryo ağırlığı atayamaz.

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **"Python template routing only" — ASELS'te de aynı arıza** — Gerçek LLM analizi yapılmadı; tüm impact haritalama boş template çıktısı olarak geldi. THYAO ile aynı sistematik arıza savunma şirketine de taşındı.
- **quantification_estimate: null tüm ASELS olayları için** — Temettü dağıtımı için "hisse adedi × temettü/hisse = TRY tutarı" basit hesabı yapılabilirdi; yapılmadı.
- **4-kanal haritalama (Kapasite/Enerji/Finansman/Regülasyon) yok** — ASELS sözleşme duyuruları için 4-kanal analiz: (1) Kapasite: üretim artışı gerekiyor mu? (2) Enerji: maliyet etkisi? (3) Finansman: peşin vs taksit yapısı? (4) Regülasyon: ihracat izni var mı? — bunlar üretilmedi.
- **Bear/Baz/Bull delta tablosu yok** — Savunma sektöründe jeopolitik olay → sipariş defteri büyümesi senaryo tablosu strategic_synthesis için zorunlu girdi.
- **Savunma sektörüne özgü haritalama kalıpları yok** — İhracat sözleşmesi vs iç pazar sözleşmesi etki farkı; offset yükümlülüklerinin maliyet etkisi; TSKGV patent/IP paylaşımı gereksinimleri — bunlar ASELS'e özgü etki kanalları.

### Bundan Sonra:
- **Savunma şirketleri için 4-kanal haritalama şablonu:**
  1. Sipariş defteri (backlog) → revenue visibilitesi artışı/düşüşü TRY
  2. AR-GE → yeni sözleşme → maliyet kaydı vs gelir tanıma zamanlaması
  3. İhracat gelirleri → USD/EUR kur etkisi TRY
  4. Regülasyon/offset → yükümlülük maliyeti tahmini
- **Temettü/AGM haritalama basit ama zorunlu** — Temettü: "X TRY/hisse × Y milyon hisse = Z TRY toplam nakit çıkışı; free cash flow etkisi". Bu hesap her analizde üretilecek.
