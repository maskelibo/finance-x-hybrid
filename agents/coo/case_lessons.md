# COO Agent — Katman 2b: Vaka Bazlı Dersler

> Bu dosya CEO geri bildirimleri, rapor bazlı öğrenimler ve sektör bilgi bankasını içerir.
> Agent gerektiğinde bu dosyayı açar; her çalıştırmada otomatik yüklenmez.

---

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **REVISION_NEEDED kararı doğru ✓** — QA 0.757 < 0.80 ve P0 blokerlar (CF, D1 equity, WC) çözülmeden teslim edilemez. COO doğru durdu.
- **Conditional_pass upstream'de engellenmedi** — data_collection "CONDITIONAL PASS" verdiğinde COO pipeline'ı durdurmalıydı. CEO direktifi: conditional_pass = BLOCK. Bu kontrol COO'nun pre-QA gate kapsamında.
- **Havacılık sektörü özel kontrol listesi eksik** — THYAO CEO pre-flight direktifinde 8 havacılık KPI (RPK, ASK, CASK, RASK, LF, Kargo ton-km, filo, hedging) belirtildi; COO bu KPI'ları completeness check'e dahil etmedi.
- **IFRS 16 lease borç ayrıştırma kontrolü yapılmadı** — Net Borç formülünde lease borcu dahil mi diye COO kontrolü yoktu.

### Bundan Sonra:
- **COO havacılık şirketi completeness check'e ekle:**
  - EBITDAR (EBITDA + Rent/Lease) hesaplandı mı?
  - 8 havacılık KPI mevcut mu?
  - IFRS 16 ROU varlık + lease borcu ayrıştırması yapıldı mı?
  - Rusya üstgeçiş + EU ETS + CORSIA bölümleri var mı?
- **Conditional_pass = BLOCK** — data_collection veya herhangi bir agent conditional_pass verirse COO downstream'i durdurur, CEO'ya eskalasyon bildirir.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **REVISION_NEEDED kararı doğru ✓** — QA 0.59/1.0 < 0.80 eşiği; HTML body tagı kapatılmamış P0 olarak doğru tespit edildi.
- **Revenue Q4/FY karışıklığı COO tarafından yakalanmadı** — data_collection "802.669 M TRY FY2025 RESOLVED" dediğinde COO bunu "PARTIAL" olarak geçti. Gerçekte bu yanlış çözüme kilitlenmeydi.
- **Content check bölüm kalitesini değil yalnızca başlık varlığını kontrol etti** — "15 bölüm PASS" kararı heading taramasına dayanıyordu; içerik kalitesi değerlendirilmedi.
- **QA'dan önceki data quality check eksik** — Holding normu ~%6-8 FAVÖK marjı; %22.6 immediate cross-check gerektirirdi.
- **Blocker listesi tam değildi** — DSO BLOCKED, IFRS 8 %0, TCMB %46→%37 bellek hatası COO delivery check'inde P0 olarak listelenmedi.

### Bundan Sonra:
- **COO holding şirketi completeness check'e ekle:**
  - Revenue tanımı: Solo/Parent + Konsolide FY + En son quarter — üçü ayrı satır doğrulandı mı?
  - IFRS 8 segment extraction %0 → otomatik P0
  - Balance sheet imbalance > %50 → P0, downstream BLOCK
  - FAVÖK marjı holding normu dışında (%5-15 bant dışı) → kaynak sorgu zorunlu
- **Revenue dönem doğrulaması COO delivery check'e ekle**
- **HTML delivery check için kapanış tag kontrolü:** `</body></html>` var mı? Eksikse report_formatter'ı geri gönder.
- **Performans izleme güncelleme:**
  - report_formatter: HTML body eksik (BIMAS + KCHOL = 2. kez) → başarı %35'e düştü
  - financial_analysis: Revenue Q4/FY hatayı kendi yakalamadı → başarı %40

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **BLOCKED kararı doğru verildi** — COO pipeline'ı durdurdu ve CEO'ya eskalasyon yaptı. Doğru davranış.
- **Tur 3 minimal adımları COO'nun değil CEO'nun belirlemesi gerekirdi** — Teknik direktifler COO'nun değil CEO'nun yetkisinde.
- **Blocker listesi eksiksiz değildi** — IAS29 ROE tablosu eksikliği ve financial_analysis Bölüm 5 truncation P0 blocker olarak listelenmedi.

### Bundan Sonra:
- **COO direktif VERMEZ, bildirir:** "Şunu düzelt" değil, "Bu blocker mevcut, CEO kararı gerekiyor" formatında eskalasyon yapılacak.
- **Blocker listesi tüm P0'ları kapsamalı:** QA raporundaki tüm P0 sorunlar COO listesinde görünmeli.
- **Delivery check her analizin sonunda ZORUNLU:** CEO gate kapısını geçmeden rapor teslim edilemez. COO bu gate'i yönetir.


## Ek CEO Geri Bildirimleri (memory.md'den taşındı)

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
