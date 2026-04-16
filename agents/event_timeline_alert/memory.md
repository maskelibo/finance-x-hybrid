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
