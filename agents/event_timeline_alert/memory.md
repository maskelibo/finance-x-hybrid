# Event Timeline Alert — Damitilmis Hafiza

---

## Kalici Kurallar

- **4-Phase timeline FULL execution ZORUNLU:**
  - Immediate (0-30 gun): Aktif krizi ve yururlukteki duzenliyici kararlari takip et
  - Near-term (30-90 gun): Earnings + AGM + temettu = inflection points
  - Medium-term (90-180 gun): Normalization veri noktalari + regulator degisiklikler
  - Long-term (180-365 gun): Structural re-rating signals
- **Truncation YASAK** — 4 fazin hepsi tamamlanmali. Gerekirse Phase 1-2 + Phase 3-4 ayri output olarak gonder
- **BLOCKED → Partial Complete:** Upstream eksikse bilinen verilerle olustur, eksik kisimlari "PENDING_IMPACT_DATA" etiketiyle isaretle. Tam BLOCKED YASAK
- **Upstream dogrulamasi dosya sistemi uzerinden:** output JSON dosyasinin varligini kontrol et, context/hafizadan degil
- **Sirket ici olay zamanlcizelgesi ile dis makro takvimi IKI AYRI BOLUMDE tut**
- **Her timeline girdisinde: gercek kaynak ID/URL + teyit seviyesi ver.** Beklenen pencere/tahmin → `estimated` etiketle
- **Senaryo anlatisini olay gibi yazma; timeline yalniz izleme onceligi kurmali**
- Her trigger icin: metric + threshold + alert urgency + responsible agent
- Regulatory calendar ekle — BDDK/SPK/KAP/EPDK zorunlu bildirim tarihleri
- Forward-looking 12 aylik event takvimi olustur
- "must-happen" events (firm dates) vs "expected-but-uncertain" events ayri tut
- Confidence labels: HIGH (kesin tarih, matematiksel), MEDIUM (projeksiyon bazli), LOW (belirsiz)
- **Jeopolitik trigger takvimi zorunlu (enerji sirketleri):** OPEC+, IEA rapor tarihleri, EPDK kararlari, TCMB PPK tarihleri
- Immediate vs Scheduled ayrimi net olmali: yururlukteki karar → immediate; tarihli gelecek olay → near/medium/long
- Priority alert sadece yuksek kesinlik + maddi etki icin kullanilmali

## Zorunlu Kontrol Listesi

- [ ] 4 faz (Immediate/Near/Medium/Long) tamami dolu mu?
- [ ] Sirket olaylari ve dis makro takvim ayri bolumde mi?
- [ ] Her girdi icin kaynak ID/URL ve teyit seviyesi var mi?
- [ ] Tahminler `estimated` etiketli mi?
- [ ] Regulatory calendar eklendi mi?
- [ ] Monitoring triggers (metric + threshold + urgency) tanimli mi?
- [ ] 12 aylik forward event takvimi var mi?
- [ ] Upstream output kontrolu (dosya sistemi) yapildi mi?

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Upstream validation dosya sistemi yerine context'ten yapıldı** — "✅ Upstream verified" ifadeleri kullanıldı ama kural: dosya sistemi üzerinden JSON çıktısının varlığını kontrol et. event_impact_mapper çıktısı eksikti; context'ten "confirmed" denmesi hatalı.
- **Regulatory calendar eksik** — 22 Nisan 2026 TCMB PPK, Mayıs 2026 Q1 2026 sonuçları, 2026 AGM tarihi, Temmuz 2026 CORSIA raporlama — bunlar takvimde yok.
- **Şirket olayları ve dış makro takvim tek bölümde karıştı** — CEO değişikliği (şirket olayı) ile İran krizi (makro) aynı tabloda karışık sunuldu; ayrı bölüm kuralı uygulanmadı.
- **Phase 3-4 timeline kısa** — Medium-term ve long-term fazları yeterince detaylandırılmadı; IST slot tavanı 2028 etkisine Phase 4'te yer verilmedi.

### Bundan Sonra:
- **Upstream validation her zaman dosya sistemi ile** — "upstream output JSON'ı var mı?" kontrolü context'ten değil dosya path üzerinden yapılmalı. Dosya yoksa "PENDING_UPSTREAM_DATA" etiketle, "✅ verified" yazma.
- **Havacılık regulatory calendar zorunlu:** TCMB PPK tarihleri + Hazine/SPK finansal rapor deadlines + IATA/EASA operasyonel bildirimler + Q earnings dates — bunları Phase 1-2'ye sabit ekle.
- **Şirket vs makro takvim her zaman ayrı bölümde** — İç olaylar (AGM, earnings, filo teslimatı) = "Şirket Takvimi"; dış makro (TCMB, Brent, İran müzakereleri) = "Makro Takvim". Aynı tabloda karıştırma.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **Tablo format bozulması** — Bazı tablo satırlarında `\n` karakterleri ham olarak göründü ("|------|-------|------|---|---|\n|" gibi). Bu markdown render sorununu işaret ediyor; tabloları düzgün HTML veya markdown table formatında üret.
- **4 faz tam tamamlandı ✓** — Immediate + Near-term + Medium-term + Long-term hepsi mevcut. THYAO dersinden öğrenildi.
- **CEO interim URGENT flag iyi konumlandırıldı ✓** — En acil risk olarak tablonun başında yer aldı.
- **Şirket takvimi ve makro takvim ayrı bölümde değil** — CEO interim (şirket) ve TCMB PPK (makro) aynı tabloda yan yana listelenmiş; kurala göre ayrı bölümler olmalı.
- **Q1 2026 ara hesap (~15 Mayıs 2026) CRITICAL olarak Phase 2'de doğru tespit ✓**

### Bundan Sonra:
- **Perakende sektörü zorunlu takvim öğeleri:**
  - Temettü ex-date'leri (BIMAS: 17 Haziran, 16 Eylül, 16 Aralık 2026) — nakit akışı planlaması
  - Ramazan sezonu etkisi: Nisan-Mayıs 2026 döneminde Q1 satış verisi beklentisi
  - Asgari ücret revizyonu: Temmuz 2026 (her yıl Ocak + Temmuz)
  - CEO kalıcı atama: KAP'ta açıklama bekleniyor — "imminently bekleniyor" doğru tespit ✓
- **Tablo formatı standartlaştır** — Ham `\n` çıktısı kabul edilemez. Markdown tablo kullan: her satır `|` ile başlayıp `|` ile bitsin; başlık sonrası `|---|---|` ayırıcı satırı.
- **BIMAS 2026 kritik tarih takvimi (referans):** 22 Nisan TCMB PPK | ~15 Mayıs Q1 2026 | 17 Haziran Temettü #1 Ex-date | Temmuz Asgari ücret revizyonu | 16 Eylül Temettü #2 Ex-date | ~15 Ağustos Q2 2026 | 16 Aralık Temettü #3 Ex-date | ~15 Kasım Q3 2026.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **Şirket olayları ve makro takvim ayrı bölümde değil** — 4 faz timeline tamamlandı ✓; ancak TCMB PPK, İran ateşkes (makro) ile YKBNK Q1, TUPRS KAP (şirket) aynı tabloda karışık. Kural: "Şirket Takvimi" ve "Makro Takvim" ayrı bölümler.
- **5 priority alert çıktı truncated** — Son satırda "B" harfinde kesildi (tam içerik görünmüyor). Alert 5 ve gerekçesi kayıp.
- **Upstream validation dosya sistemi üzerinden değil** — THYAO dersinde "dosya sistemi kontrolü" kuralı eklenmişti; bu turda da context veya hafızadan "output confirmed" yazılmış olabilir.
- **Regulatory calendar eksik** — BDDK/SPK/EPDK zorunlu bildirim tarihleri eklenmedi. Yalnızca piyasa takvimi (TCMB PPK, earnings) var.
- **"Must-happen" vs "expected-but-uncertain" ayrımı net değil** — 22 Nisan TCMB PPK (kesin tarih) ile "günler içinde İran müzakeresi" (belirsiz) aynı format.

### Bundan Sonra:
- **Holding için 12 aylık forward takvim zorunlu** — Her segment için beklenen earnings tarihleri (YKBNK, AKBNK, FROTO, ARCLK, TCELL, EREGL, TUPRS) + KCHOL konsolide holding sonuçları — bunları "Subsidiary Earnings Calendar" başlığıyla ayrı tablo olarak sun.
- **Şirket vs Makro takvim her zaman ayrı header** — "## Şirket Takvimi" ve "## Makro Takvim" başlıkları altında ayır; karışık tablo YASAK.
- **Alert truncation önlemi** — Priority alert'lerin hepsi output'un ilk yarısında olmalı (çünkü en önemli bölüm). Son yarıya bırakılırsa truncation riski. Bu turda alert'ler çıktının son bölümünde; başa taşı.

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK: Phases 2-4 TAMAMEN EKSIK, regulatory deadline calendar eksik
- TCELL: Phase 2 baslamis ama kesilmis, Phases 3-4 tamamen eksik, 5G rollout timeline detayi yok
- TUPRS: **Koordinasyon hatasi** — event_impact_mapper output dosyasi vardi ama "mevcut degil" diyerek BLOCKED verildi. Dosya kontrolu yapilmadan "upstream eksik" denilemez. Jeopolitik trigger tarihleri eklenmedi.
- EREGL: Makro soklar sirket disclosure timeline'indan ayrilmaliydi. Bazi tahminler yuksek kesinlik tonuyla verildi.

## Son 3 Raporun Ogrenimleri

- **KCHOL (2026-04-10):** Jeopolitik events override everything. Windfall misprice risk: Q1 beat → market structural improvement zanneder → Q3 reversal. Segment-level impact differentials zorunlu (5 sektor farkli etkilenir). Conglomerate discount recompression = structural catalyst.
- **TUPRS (2026-04-12):** 17 Nisan 2026 (2025 tam yil KAP aciklamasi) tum belirsizlikleri cozecek — "KRITIK — X GUN" uyarisi mandatory.
- **EREGL (2026-04-13):** EPDK tarife soku IMMEDIATE fazina dogru konumlandirildi. AB Safeguard 1 Temmuz kritik tarih. Kaldirac feedback dongusu: Tarife → EBITDA dusus → Net Borc/EBITDA 2.1x → 3.0x+ → rating riski. Compound shock modeli gerekli (enerji + safeguard + CBAM birlikte).

## Sektor Bilgi Bankasi

- **Celik IMMEDIATE faz kontrol listesi:** (1) EPDK tarifeleri, (2) KAP onceki 7 gun, (3) AB Safeguard kota durumu, (4) HRC spot fiyati (haftalik degisim ≥%5 ise uyari)
- **Temporary vs Structural:** Oil margin windfall = temporary (reversion expected). Energy tariff +25% = structural (unless policy reversal). Farkli monitoring frekansinda izle.
- **Holding sirketleri:** Multiple overlapping cycles. CEO tone in guidance/AGM = equity catalyst (+-3-5% tek gun hareketi).
- **Ermaden protokolu:** Madencilik istiraki sondaj/kaynak guncellemesi MEDIUM-TERM'e varsayilan olarak dahil et. Possible → Probable → Proven gecis tarihleri izle.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **IMMEDIATE FAZI bölümü truncated** — "Kritik Gözlem:" ile kesildi; izleme trigger'ları ve aksiyon önerileri tamamlanmadı.
- **NEAR-TERM ve FORWARD bölümleri görünmüyor** — Bölüm 2 ve 3 çıktıda yok; sadece Bölüm 1 kısmen var.
- **Monitoring trigger'ları için eşik değerleri eksik** — "TCMB PPK 22 Nisan — izle" yazıldı ama "faiz +50bp → Akbank NIM −X TRY" gibi nicel eşikler verilmedi.

### Bundan Sonra:
- **Her timeline bölümü tam teslim edilecek:** IMMEDIATE + NEAR-TERM + FORWARD — üçü de tam. Kesilirse bölüm bölüm gönder.
- **Monitoring trigger'ları nicel olacak:** "TCMB faiz değişimi izle" yetmez. "Faiz +100bp → Akbank NIM −2–3B TRY → SAHOL değerlemesi −X TL" zinciri kurulacak.
- **Her event için aksiyon önerisi ZORUNLU:** Olay gerçekleşirse CEO ne yapmalı? "İzle" değil, "Q2 sonuçlarında EBITDA revize et / pozisyon yeniden değerlendir / upstream update tetikle" gibi somut öneriler.

---
