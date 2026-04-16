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
