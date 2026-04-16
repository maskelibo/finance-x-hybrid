# Macro Analysis Agent — Katman 2b: Vaka Bazlı Dersler

> Bu dosya CEO geri bildirimleri, rapor bazlı öğrenimler ve sektör bilgi bankasını içerir.
> Agent gerektiğinde bu dosyayı açar; her çalıştırmada otomatik yüklenmez.

---

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **TCMB politika faizi tutarsızlığı** — v4-FINAL çıktıda %37 kullanıldı; memory.md'de %46 yazıyordu. Kritik makro parametre yanlış hesaplamalara yol açtı. Round 2'de fark edilip düzeltildi ama Round 1 hatalıydı.
- **Rusya üstgeçiş ve EU ETS bölümleri Round 1'de truncation nedeniyle görünmüyordu** — İçerik mevcut ama downstream (QA, CEO) göremedi; pipeline üzerinde "eksik" sayıldı ve Round 2 supplementi gerekti.
- **Jet yakıt/Brent duyarlılık analizi** — $10 Brent değişimi → EBITDA etkisi quantify edilmeli dendi. Bu analiz event_impact_mapper'a devredildi; macro_analysis kendi bölümünde de göstermeli.
- **TCMB %46 faizinin iç hat talebi üzerindeki etkisi** — Düzeltildi (+Round 2) ama ilk çıktıda eksikti; iç hat gelirinin toplam gelir içindeki payına göre ek baskı hesabı gecikmeli geldi.

### Bundan Sonra:
- **Makro parametre değerlerini her çıktı başında doğrula** — Memory.md'deki faiz/enflasyon değerlerini kullanmadan önce web search veya son KAP/TCMB verisiyle teyit et. "memory.md'deki değeri kullandım" yeterli değil.
- **Havacılık sektörü ek zorunlu bölümler:** Jet yakıt fiyatı ($/bbl) + Brent duyarlılığı ($10 değişim → TRY EBITDA etkisi) + hedging pozisyonu + Rusya üstgeçiş avantajı nicel + EU ETS/CORSIA maliyet etkisi — bunların hepsi Round 1'den itibaren zorunlu.
- **Truncation riski yüksek bölümleri output başına taşı** — Rusya üstgeçiş ve EU ETS gibi kritik bölümler, uzun output sırasında kaybedilmemesi için mümkünse ilk yarıya koy.
- **Jeopolitik zincir analizi için tarih belirt** — "İran krizi" → "İran-ABD gerilimi, Nisan 2026" gibi spesifik olay-tarih eşleşmesi.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **Output truncated — Bölüm 5 (Makro → Şirket Geçiş Mekanizması) yarıda kesildi** — "5.1 Olumlu Makro Senaryolar" tablosu "Reel Gelir Baskısı → Tüketic..." diye bitiyor. Geçiş mekanizması tablosu perakende analizinin en kritik bölümü; tam teslim edilmedi.
- **Asgari ücret transmisyon hesabı iyi ✓** — Temmuz 2026 +%10 ücret artışı → ~1.0-1.5B TRY ek OPEX → -20 ila -30 bps EBITDA marjı hesabı doğru formatta.
- **Rekabet Kurumu soruşturması analizi kapsamlı ✓** — BIMAS avantajı (EDLP modeli) ve senaryo olasılıkları iyi analiz edildi.
- **TCMB faiz değeri güncel mi?** — Çıktıda %37 kullanıldı; macro_analysis memory.md'de %46 yazıyor. BIMAS analizinde kullanılan değer teyit edilmeli.

### Bundan Sonra:
- **Perakende sektörü makro transmisyon öncelik sırası:**
  1. TÜFE enflasyonu → SSSG nominal büyüme (pass-through mekanizması)
  2. Reel ücret büyümesi → tüketici harcama kapasitesi (en kritik perakende metriği)
  3. Asgari ücret revizyonları → işgücü maliyeti baskısı
  4. PPI-CPI makası → tedarikçi fiyat baskısı vs. satış fiyatı esnekliği
  5. Kira enflasyonu → OPEX baskısı (14.000 mağazada IFRS 16 altında)
- **Her senaryo için sayısal etki tablosu zorunlu** — "TÜFE %30 → %16'ya geriler" senaryosunda: IAS29 kazancı 21,622 → 8-10B TRY azalır → net kâr -12B TRY → P/E çarpanı yeniden fiyatlar. Bu zinciri sayısal göster.
- **Truncation riski yüksek bölümleri çıktının başına koy** — Transmisyon mekanizması tablosu gibi kritik özet tablolar output'un ilk yarısında verilmeli; truncation sonunda kaybolmamalı.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **Output yine truncated — FROTO bölümü yarıda kesildi** — "Aylık taksit yükü: 1 milyon TRY araç için ~" ile bitiyor. Bu 3. turda da truncation sorunu çözülemedi. FROTO, ARCLK, TCELL, EREGL segmentleri hiç görünmüyor.
- **Konsolide FX sensitivity hesabı eksik** — Holding direktifine göre: Sum(segment net FX pozisyon) → TRY %10 depresiasyon → EBITDA/equity etkisi TRY. Bu hesap önceki KCHOL raporunda da eksikti, bu turda da yok. Tekrarlayan hata.
- **Makro veri bankasında TCMB %46 hala yazıyor** — memory.md Sektor Bilgi Bankasi bölümünde "TCMB: %46" var; context_extraction Round 2'de %37 olarak düzeltti. Macro_analysis kendi memory'sini güncellemedi.
- **Fitch görünüm indirimi sayısallaştırılmadı** — "BB-/Stable (Pozitif→Stabil)" haberinin holding iskontosuna etkisi "+2-3pp" olarak event_impact_mapper'a bırakıldı. Macro_analysis kendi bölümünde country risk premium artışı → WACC → NAV etkisini hesaplamalıydı.
- **İran müzakere statusü 10-14 Nisan penceresi için doğrulanamadı** — "Günler içinde yeni müzakere turu" CEO mandatında yazıyordu; macro_analysis bu bilgiyi ne doğruladı ne de reddetti.

### Bundan Sonra:
- **Truncation için segmentleri önce özet tabloyla ver** — 6 segment (TUPRS, YKBNK/AKBNK, FROTO, ARCLK, TCELL, EREGL) için makro etki özet tablosunu ilk çıktıda ver; detayları ardından bölüm bölüm ekle. Özet tablo truncate olursa en az sayısal etki görünmüş olur.
- **Memory.md'deki TCMB faizini anında güncelle** — Context_extraction'dan "TCMB %37 doğrulandı" geldiğinde macro_analysis memory.md Sektor Bilgi Bankasi'nı aynı anda güncelle. Eski değer kalmaz.
- **Konsolide FX sensitivity her holding analizinde zorunlu** — KCHOL için: TUPRS (USD satış - TRY maliyet) + FROTO (EUR ihracat) + YKBNK (FX mevduat/kredi dengesi) + ARCLK (EUR ihracat) → net FX pozisyon → TRY %10 değer kaybı = X TRY EBITDA etkisi. Bu hesabı atlama.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **BOTAŞ tarifeleri: Sanayi ve mesken karıştırıldı (Round 1)** — +%25 mesken tarifeyi sanayi için kullandı; doğrusu sanayi +%18.61. Her analizde sanayi/mesken/toptan ayrımı yapılmalı.
- **TCMB %37 vs %46 başlangıçta ayrıştırılmadı** — Resmi repo (%37) ile gecelik koridor (%46) Round 2'de düzeltildi ama ilk çıktıda karışıklık vardı.
- **Bölüm 3.5 (CarrefourSA) ve sonrası truncated** — Makro geçiş zinciri "TÜFE %30.87 → CARFA" ile kesildi.
- **Jeopolitik bölüm (İran-ABD, Hürmüz) tam çekilmedi** — SAHOL için önemli bir makro risk faktörü; Chairman tarafından zorunlu tutuluyor.
- **Sektör-spesifik makro geçiş mekanizması tüm segmentler için tamamlanmadı** — Bankacılık NIM analizi var, Brisa kısmen var; sigorta (AvivaSA/Agesa) ve dijital segmentler eksik.

### Bundan Sonra:
- **BOTAŞ tarife kaynağını ayrıştır:** Her analizde sanayi/mesken/toptan tarife ayrı satırlarda olacak. "Enerji fiyatı +X%" yazılacaksa hangi kategori olduğu belirtilecek.
- **TCMB iki faiz her zaman ayrı satırda:** "Resmi politika faizi: %37 (PPK kararı)" + "Gecelik koridor üst bandı: %46" — kesinlikle aynı satırda gösterilmeyecek.
- **Jeopolitik bağlam zorunlu:** İran-ABD gerilimi, Rusya-Ukrayna, Hürmüz ablukası senaryosu her holding/enerji/sanayi analizinde zorunlu bölüm. Truncation engeli varsa ayrı mesajda gönder.
- **Tüm segmentler için geçiş zinciri:** Makro değişken → ilgili SAHOL iştiraki → quantified EBITDA/Kar etkisi. Her segment ayrı satır.

## Son 3 Raporun Ogrenimleri

- **EREGL (2026-04-13):** TCMB %46 ve TUFE dogru verildi. Cin celik ihracat baskisi tanimlandi. BOTAS gaz etkisi ve hammadde transmisyon parametreleri sayisal baglanmadi.
- **TUPRS (2026-04-12):** Hurmuz krizi cok boyutlu modellendi. Ural crude discount + yaptirim riski, EPDK OTV mekanizmasi, Ceyhan stratejik avantaj dogru analiz edildi.
- **TCELL post-delta (2026-04-11):** Jeopolitik->enerji->COGS zinciri mukemmel. Elektrik tarife etkisi sayisallastirildi. BTK regulatory katman eksik.

## Sektor Bilgi Bankasi

**Guncel Veri Bankasi (13 Nisan 2026):**
- TCMB: **%37** (Mart 2026 PPK — %46 HATALI; context_extraction 2026-04-14 düzeltti) | TUFE YoY: %30.87 | Yi-UFE: %28.08 | USD/TRY: 44.70 (14 Nis)
- Brent: $95.20 (ateskes sonrasi) | Peak: $111.69 (2 Nisan)
- Ural discount: -$12.6 ila -$28/bbl | OPEC+ Mayis: +411K bpd
- BOTAS endustriyel gaz: +%18.61 (4 Nisan) | Turkey GDP 2026 IMF: %4.2
- BDDK min CAR: %12 | Overdraft conversion factor: %10
- AB HRC Kuzey Avrupa: EUR720/ton | Demir cevheri: ~$95/ton | Kok komuru: ~$185-200/ton

**Anahtar Kavramlar:**
- PPI > CPI = margin compression (spread >0.3pp = alarm)
- Reel Politika Faizi: Nominal - CPI. >+5% = cok siki
- NPL lagging indicator: Faiz artisinan 6-12 ay sonra sicrar
- IAS 29: Kumulatif 3Y enflasyon >%100 = hyperinflation. TAS 29 2025-2027 askida, IAS 29 gecerli

**Veri Kaynaklari:** TCMB (evds2.tcmb.gov.tr) | TUIK (data.tuik.gov.tr) | BDDK (bddk.org.tr/BultenAylik) | KAP | Trading Economics | OSD (osd.org.tr)


## Ek CEO Geri Bildirimleri (memory.md'den taşındı)

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **TCMB politika faizi tutarsızlığı** — v4-FINAL çıktıda %37 kullanıldı; memory.md'de %46 yazıyordu. Kritik makro parametre yanlış hesaplamalara yol açtı. Round 2'de fark edilip düzeltildi ama Round 1 hatalıydı.
- **Rusya üstgeçiş ve EU ETS bölümleri Round 1'de truncation nedeniyle görünmüyordu** — İçerik mevcut ama downstream (QA, CEO) göremedi; pipeline üzerinde "eksik" sayıldı ve Round 2 supplementi gerekti.
- **Jet yakıt/Brent duyarlılık analizi** — $10 Brent değişimi → EBITDA etkisi quantify edilmeli dendi. Bu analiz event_impact_mapper'a devredildi; macro_analysis kendi bölümünde de göstermeli.
- **TCMB %46 faizinin iç hat talebi üzerindeki etkisi** — Düzeltildi (+Round 2) ama ilk çıktıda eksikti; iç hat gelirinin toplam gelir içindeki payına göre ek baskı hesabı gecikmeli geldi.

### Bundan Sonra:
- **Makro parametre değerlerini her çıktı başında doğrula** — Memory.md'deki faiz/enflasyon değerlerini kullanmadan önce web search veya son KAP/TCMB verisiyle teyit et. "memory.md'deki değeri kullandım" yeterli değil.
- **Havacılık sektörü ek zorunlu bölümler:** Jet yakıt fiyatı ($/bbl) + Brent duyarlılığı ($10 değişim → TRY EBITDA etkisi) + hedging pozisyonu + Rusya üstgeçiş avantajı nicel + EU ETS/CORSIA maliyet etkisi — bunların hepsi Round 1'den itibaren zorunlu.
- **Truncation riski yüksek bölümleri output başına taşı** — Rusya üstgeçiş ve EU ETS gibi kritik bölümler, uzun output sırasında kaybedilmemesi için mümkünse ilk yarıya koy.
- **Jeopolitik zincir analizi için tarih belirt** — "İran krizi" → "İran-ABD gerilimi, Nisan 2026" gibi spesifik olay-tarih eşleşmesi.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **Output truncated — Bölüm 5 (Makro → Şirket Geçiş Mekanizması) yarıda kesildi** — "5.1 Olumlu Makro Senaryolar" tablosu "Reel Gelir Baskısı → Tüketic..." diye bitiyor. Geçiş mekanizması tablosu perakende analizinin en kritik bölümü; tam teslim edilmedi.
- **Asgari ücret transmisyon hesabı iyi ✓** — Temmuz 2026 +%10 ücret artışı → ~1.0-1.5B TRY ek OPEX → -20 ila -30 bps EBITDA marjı hesabı doğru formatta.
- **Rekabet Kurumu soruşturması analizi kapsamlı ✓** — BIMAS avantajı (EDLP modeli) ve senaryo olasılıkları iyi analiz edildi.
- **TCMB faiz değeri güncel mi?** — Çıktıda %37 kullanıldı; macro_analysis memory.md'de %46 yazıyor. BIMAS analizinde kullanılan değer teyit edilmeli.

### Bundan Sonra:
- **Perakende sektörü makro transmisyon öncelik sırası:**
  1. TÜFE enflasyonu → SSSG nominal büyüme (pass-through mekanizması)
  2. Reel ücret büyümesi → tüketici harcama kapasitesi (en kritik perakende metriği)
  3. Asgari ücret revizyonları → işgücü maliyeti baskısı
  4. PPI-CPI makası → tedarikçi fiyat baskısı vs. satış fiyatı esnekliği
  5. Kira enflasyonu → OPEX baskısı (14.000 mağazada IFRS 16 altında)
- **Her senaryo için sayısal etki tablosu zorunlu** — "TÜFE %30 → %16'ya geriler" senaryosunda: IAS29 kazancı 21,622 → 8-10B TRY azalır → net kâr -12B TRY → P/E çarpanı yeniden fiyatlar. Bu zinciri sayısal göster.
- **Truncation riski yüksek bölümleri çıktının başına koy** — Transmisyon mekanizması tablosu gibi kritik özet tablolar output'un ilk yarısında verilmeli; truncation sonunda kaybolmamalı.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **Output yine truncated — FROTO bölümü yarıda kesildi** — "Aylık taksit yükü: 1 milyon TRY araç için ~" ile bitiyor. Bu 3. turda da truncation sorunu çözülemedi. FROTO, ARCLK, TCELL, EREGL segmentleri hiç görünmüyor.
- **Konsolide FX sensitivity hesabı eksik** — Holding direktifine göre: Sum(segment net FX pozisyon) → TRY %10 depresiasyon → EBITDA/equity etkisi TRY. Bu hesap önceki KCHOL raporunda da eksikti, bu turda da yok. Tekrarlayan hata.
- **Makro veri bankasında TCMB %46 hala yazıyor** — memory.md Sektor Bilgi Bankasi bölümünde "TCMB: %46" var; context_extraction Round 2'de %37 olarak düzeltti. Macro_analysis kendi memory'sini güncellemedi.
- **Fitch görünüm indirimi sayısallaştırılmadı** — "BB-/Stable (Pozitif→Stabil)" haberinin holding iskontosuna etkisi "+2-3pp" olarak event_impact_mapper'a bırakıldı. Macro_analysis kendi bölümünde country risk premium artışı → WACC → NAV etkisini hesaplamalıydı.
- **İran müzakere statusü 10-14 Nisan penceresi için doğrulanamadı** — "Günler içinde yeni müzakere turu" CEO mandatında yazıyordu; macro_analysis bu bilgiyi ne doğruladı ne de reddetti.

### Bundan Sonra:
- **Truncation için segmentleri önce özet tabloyla ver** — 6 segment (TUPRS, YKBNK/AKBNK, FROTO, ARCLK, TCELL, EREGL) için makro etki özet tablosunu ilk çıktıda ver; detayları ardından bölüm bölüm ekle. Özet tablo truncate olursa en az sayısal etki görünmüş olur.
- **Memory.md'deki TCMB faizini anında güncelle** — Context_extraction'dan "TCMB %37 doğrulandı" geldiğinde macro_analysis memory.md Sektor Bilgi Bankasi'nı aynı anda güncelle. Eski değer kalmaz.
- **Konsolide FX sensitivity her holding analizinde zorunlu** — KCHOL için: TUPRS (USD satış - TRY maliyet) + FROTO (EUR ihracat) + YKBNK (FX mevduat/kredi dengesi) + ARCLK (EUR ihracat) → net FX pozisyon → TRY %10 değer kaybı = X TRY EBITDA etkisi. Bu hesabı atlama.

## Bilinen Hatalar (Bir Daha Yapma)

- KCHOL: Segment etkileri var ama konsolide aggregate impact hesaplanmadi
- KCHOL: Konsolide FX sensitivity senaryosu eksik kaldi
- AKBNK: BDDK regulatory changes, TL/FX balance sheet exposure, reel kredi buyumesi eksikti
- TCELL: FX analizi truncated, BTK regulatory transmission eksik
- TUPRS: WTI-Brent spread, IEA talep tahminleri, zorunlu stok maliyeti, BOTAS OPEX etkisi sayisal baglanti eksik
- EREGL: BOTAS +%18.61 etkisi sayisal baglanmadi (-4.0 ila -4.5B TRY/yil), hammadde transmisyon parametreleri verilmedi, HRC guncelleme canli teyitsiz sunuldu

## Son 3 Raporun Ogrenimleri

- **EREGL (2026-04-13):** TCMB %46 ve TUFE dogru verildi. Cin celik ihracat baskisi tanimlandi. BOTAS gaz etkisi ve hammadde transmisyon parametreleri sayisal baglanmadi.
- **TUPRS (2026-04-12):** Hurmuz krizi cok boyutlu modellendi. Ural crude discount + yaptirim riski, EPDK OTV mekanizmasi, Ceyhan stratejik avantaj dogru analiz edildi.
- **TCELL post-delta (2026-04-11):** Jeopolitik->enerji->COGS zinciri mukemmel. Elektrik tarife etkisi sayisallastirildi. BTK regulatory katman eksik.

## Sektor Bilgi Bankasi

**Guncel Veri Bankasi (13 Nisan 2026):**
- TCMB: **%37** (Mart 2026 PPK — %46 HATALI; context_extraction 2026-04-14 düzeltti) | TUFE YoY: %30.87 | Yi-UFE: %28.08 | USD/TRY: 44.70 (14 Nis)
- Brent: $95.20 (ateskes sonrasi) | Peak: $111.69 (2 Nisan)
- Ural discount: -$12.6 ila -$28/bbl | OPEC+ Mayis: +411K bpd
- BOTAS endustriyel gaz: +%18.61 (4 Nisan) | Turkey GDP 2026 IMF: %4.2
- BDDK min CAR: %12 | Overdraft conversion factor: %10
- AB HRC Kuzey Avrupa: EUR720/ton | Demir cevheri: ~$95/ton | Kok komuru: ~$185-200/ton

**Anahtar Kavramlar:**
- PPI > CPI = margin compression (spread >0.3pp = alarm)
- Reel Politika Faizi: Nominal - CPI. >+5% = cok siki
- NPL lagging indicator: Faiz artisinan 6-12 ay sonra sicrar
- IAS 29: Kumulatif 3Y enflasyon >%100 = hyperinflation. TAS 29 2025-2027 askida, IAS 29 gecerli

**Veri Kaynaklari:** TCMB (evds2.tcmb.gov.tr) | TUIK (data.tuik.gov.tr) | BDDK (bddk.org.tr/BultenAylik) | KAP | Trading Economics | OSD (osd.org.tr)

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **BOTAŞ tarifeleri: Sanayi ve mesken karıştırıldı (Round 1)** — +%25 mesken tarifeyi sanayi için kullandı; doğrusu sanayi +%18.61. Her analizde sanayi/mesken/toptan ayrımı yapılmalı.
- **TCMB %37 vs %46 başlangıçta ayrıştırılmadı** — Resmi repo (%37) ile gecelik koridor (%46) Round 2'de düzeltildi ama ilk çıktıda karışıklık vardı.
- **Bölüm 3.5 (CarrefourSA) ve sonrası truncated** — Makro geçiş zinciri "TÜFE %30.87 → CARFA" ile kesildi.
- **Jeopolitik bölüm (İran-ABD, Hürmüz) tam çekilmedi** — SAHOL için önemli bir makro risk faktörü; Chairman tarafından zorunlu tutuluyor.
- **Sektör-spesifik makro geçiş mekanizması tüm segmentler için tamamlanmadı** — Bankacılık NIM analizi var, Brisa kısmen var; sigorta (AvivaSA/Agesa) ve dijital segmentler eksik.

### Bundan Sonra:
- **BOTAŞ tarife kaynağını ayrıştır:** Her analizde sanayi/mesken/toptan tarife ayrı satırlarda olacak. "Enerji fiyatı +X%" yazılacaksa hangi kategori olduğu belirtilecek.
- **TCMB iki faiz her zaman ayrı satırda:** "Resmi politika faizi: %37 (PPK kararı)" + "Gecelik koridor üst bandı: %46" — kesinlikle aynı satırda gösterilmeyecek.
- **Jeopolitik bağlam zorunlu:** İran-ABD gerilimi, Rusya-Ukrayna, Hürmüz ablukası senaryosu her holding/enerji/sanayi analizinde zorunlu bölüm. Truncation engeli varsa ayrı mesajda gönder.
- **Tüm segmentler için geçiş zinciri:** Makro değişken → ilgili SAHOL iştiraki → quantified EBITDA/Kar etkisi. Her segment ayrı satır.

---
