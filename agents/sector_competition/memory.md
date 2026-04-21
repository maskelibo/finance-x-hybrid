# Sector Competition Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **Her analizde sira:** Porter -> SWOT -> Benchmarking Scorecard -> Sektor Dinamikleri. Tutarli tut.
- **Tek dominant oyuncu = global peer zorunlu.** BIST'te karsilastirilabilir peer yoksa acikla, uluslararasi peers kullan.
- **Her benchmarking metric icin quartile distribution goster:** Max, Q3, Median, Q1, Min + sirket pozisyonu.
- **Peer grubu standardize:** Ayni sektor analizlerinde ayni 5-8 peer kullan (tutarlilik).
- **Macro trend -> sirket P&L linkage zorunlu.** Genel sektor yorumu KABUL EDILMEZ — spesifik transmission mekanizmasi goster.
- **Kaynak zorunlulugu:** Her iddia icin inline citation. Kaynaksiz bilgi rapora girmez.
- **Tahmin kullaniliyorsa "Estimated" isaretle** ve low confidence flag ekle.
- **Her peer rakamini resmi finansal rapor veya dogrulanmis piyasa kaynagina bagla.**
- **Porter puan degisim yonu (oku) her tabloda goster:** Statik puan + yon (yukari/asagi/yatay).
- **SELL analist gerekcesi sektor analizi ile iliskilendirilmeli.**
- **Hazirlik mesaji birakma; her gorevde tamamlanmis peer skor karti uret.**
- **WebSearch izni yoksa:** (a) pipeline verisi kullan, (b) acikca flag koy, (c) macro agent'tan veri iste.
- **Celiski tespiti -> kanit bazli RESOLVED/CONTESTED label.** Her raporun sonunda celiski ozet tablosu.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417)

### Eksikler:
- **Sektör "industrial" — 5. THYAO, tolerans tamamen aşıldı** — `"sector": "industrial"` ve `"peer_group": []` ve `"benchmarks": []`. Deep_dive modunda bile aynı hata. THYAO = aviation tanımı ticker'dan triviyal; 5 analizdir düzeltilmedi.
- **Tamamen boş çıktı — önceki turlardan daha kötü** — Önceki THYAO'larda en azından bazı uyarı mesajları vardı; bu turda strengths: [], weaknesses: [], signals tamamen boş. Bu regresyon.
- **"Cannot score — no financial_analysis" → geçersiz karar (5. kez)** — financial_analysis bağımlılığı kırık olduğunda minimum çıktı direktifi 4 kez verildi; 5. turda da hiçbir Porter analizi üretilmedi.
- **EBITDAR peer karşılaştırması hâlâ yok** — THYAO FY2025 EBITDAR marjı %23.2 vs IATA sektör ortalaması %16.1 (+7pp fark). Bu karşılaştırma 4 turda yapılmadı; 5. turda da yok.

### Bundan Sonra:
- **THYAO ticker → aviation mapping = hard-coded, override edilemez (5. direktif)** — Upstream etiket ne gelirse gelsin, THYAO = aviation. "industrial" fallback YASAK.
- **financial_analysis olmasa bile zorunlu minimum çıktı:**
  1. Porter 5 Güç kalitatif (sektör bilgisinden)
  2. Standart peer listesi: Lufthansa/IAG/Delta/Wizz Air/flydubai
  3. EBITDAR marjı peer benchmark: IATA %16.1 vs THYAO %23.2
  4. Havacılık sektörü 4 dinamik: slot rekabeti, yakıt hedge, capacity discipline, kargo penetrasyon
- **"Cannot score" = geçersiz çıktı; "partial — upstream eksik" = acceptable.** Sıfır çıktı artık COO tarafından P0 bloker olarak işaretleniyor.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **Sektör "industrial" + peer_group [] — 5. THYAO analizi, kod seviyesi çözüm şart** — THYAO = havacılık. "industrial" fallback 5 analizdir düzeltilmedi. Memory direktifi etkisiz; hard-coded mapping zorunlu.
- **Porter 5 Güç bile üretilmedi — 5. THYAO** — financial_analysis bağımlılığı kırıkken minimum çıktı direktifi 4 kez verildi; 5. turda da hiçbir Porter analizi yok.
- **EBITDAR peer karşılaştırması yok — 5. THYAO** — THYAO FY2025 EBITDAR marjı %23.2 vs IATA sektör ortalaması %16.1 (+7pp). Bu karşılaştırma 5 analizde yapılmadı.
- **Havacılık sektörüne özgü 4 analiz bölümü yok** — Slot/rota rekabeti, yakıt hedge, capacity discipline, kargo penetrasyon — finansal veri olmadan sektör bilgisinden üretilebilir.

### Bundan Sonra:
- **THYAO ticker → aviation mapping = hard-coded, override edilemez (5. direktif — kod değişikliği zorunlu)** — Upstream etiket ne gelirse gelsin, THYAO = aviation. "industrial" fallback YASAK.
- **financial_analysis olmasa bile zorunlu minimum çıktı:**
  1. Porter 5 Güç kalitatif (sektör bilgisinden)
  2. Standart peer listesi: Lufthansa/IAG/Delta/Wizz Air/flydubai
  3. EBITDAR marjı peer benchmark: IATA %16.1 vs THYAO %23.2
  4. Havacılık sektörü 4 dinamik: slot rekabeti, yakıt hedge, capacity discipline, kargo penetrasyon
- **"Cannot score" = geçersiz çıktı; "partial — upstream eksik" = acceptable** — Sıfır çıktı COO P0 bloker.

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **Sektör "industrial" — ASELS'te de aynı sistematik hata** — ASELS savunma elektroniği (defense_electronics); "industrial" fallback 5. tekrarlayan arıza. CEO mandate sektörü açıkça "defense_electronics" olarak belirledi; uygulanmadı.
- **peer_group: [] — KOMPLE BAŞARISIZLIK** — CEO mandate savunma peer listesini verdi: Thales, Leonardo, Rheinmetall, BAE Systems, Elbit, HEICO, HAEFN.IS. Bu liste memory'de mevcuttu; yine de boş döndü. Savunma analizi temelsiz kaldı.
- **Benchmarks yalnızca ASELS değerleri** — Peer count 0 olduğu için tüm karşılaştırmalı metrikler anlamsız; EV/EBITDA, R&D/Revenue, Order Book/Revenue benchmark'ları üretilmedi.
- **Savunma sektörüne özgü hiçbir analiz üretilmedi** — Jeopolitik talep sürücüsü, ihracat kısıtlamaları, offsetleme yükümlülükleri, AR-GE yoğunluğu, devlet bağımlılığı riski — bunlar savunma sektörünün temel dinamikleri; sıfır üretim.
- **"financial_analysis yoksa cannot score" kararı — 5. tekrar** — Bu gerekçe geçersiz; sektör analizi bağımsız üretilebilir.

### Bundan Sonra:
- **Savunma şirketleri için kalıcı peer listesi:**
  - Global: Thales (HO.PA), Leonardo (LDO.MI), Rheinmetall (RHM.DE), BAE Systems (BAESY), Elbit Systems (ESLT)
  - ABD: HEICO (HEI), L3Harris (LHX), Curtiss-Wright (CW)
  - Yerel: HAEFN.IS (Hürjet/TAI — çıktı yok ise kalitatif)
  Bu liste CEO mandate; upstream bağımsız, her ASELS analizinde otomatik kullanılacak.
- **Savunma sektörü zorunlu 4 analiz bölümü (finansal veri gerekmez):**
  1. Jeopolitik talep sürücüsü (gerilim → bütçe → sipariş defteri transmisyon mekanizması)
  2. AR-GE yoğunluğu peer karşılaştırması (AR-GE/ciro: Thales ~%10, ASELS ~%7)
  3. İhracat vs iç pazar mix (ASELS ~%20-25 ihracat vs savunma peers %30-50)
  4. Devlet bağımlılığı riski (TSKGV müşteri konsantrasyonu)
- **"industrial" fallback savunma şirketlerinde YASAK** — ASELS, HAEFN, ROKET ticker'ları → "defense_electronics". Upstream etiket ne olursa olsun overwrite edilecek.

*Vaka bazli dersler: case_lessons.md | Domain bilgisi: knowledge.md*

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
