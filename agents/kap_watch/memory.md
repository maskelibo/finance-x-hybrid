# KAP Watch Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **Full pass-through ZORUNLU:** Tespit ettigin kac disclosure varsa HEPSI downstream'e gecer — sayi kirpma yok.
- **Bildirim ID ZORUNLU:** Her disclosure icin KAP ID ve URL bulunmali. ID olmayan = incomplete. Gercek KAP numarasi ve dogrudan link zorunlu; haber sitesi veya genel KAP ana sayfasi kabul edilmez.
- **Executive summary'de X disclosure dersen HEPSININ detayi olmali** — sayi tutarsizligi YASAK.
- **Cift bolum yapisi ZORUNLU:**
  - Bolum A: Son 30 gun materyal olaylar — oncelik HIGH/CRITICAL
  - Bolum B: Son 12 ay gecmisi — arsiv/baglam amacli
  - Izleme penceresini mandate'e sadik tut; eski olaylari yalniz ayri arsiv bolumunde ver.
- **Holding sirketlerinde ANA SIRKET + BAGLI ORTAKLIKLAR KAP disclosure'lari birlikte izle:** Major subsidiaries events holding'i etkiler. Bagli ortaklik islemleri (>%5 ownership change) her zaman MATERIAL.
- **Subsidiary KAP cross-check ZORUNLU:** Her major subsidiary icin son 90 gun KAP bildirimlerini kontrol et — parent ile subsidiary aciklamalari tutarli mi?
- **Impact quantification her event icin:** TRY impact, % of equity, % of annual EBITDA, % of market cap + forward impact (one-time vs recurring, timeline).
- **Forward event takvimi:** Her 30 gunluk inventory'e beklenen gelecek bildirimleri (financial statement deadlines, AGM, tahvil odemeleri) ekle.
- **Makro olaylarin KAP yansimasi kontrolu:** Buyuk sektorel/jeopolitik gelisme sonrasinda sirketin KAP'ta "ozel durum aciklamasi" yapip yapmadigini tara. Sessizlik de bir bulgudur.
- **"Resmi KAP var mi?" sorusunu acik `var/yok/bulunamadi` formatinda cevapla.**
- **Strategic initiative tracking:** Buyuk CAPEX projeleri icin 24-month window kullan.
- **Discrepancy resolution:** Context vs KAP celiskisi varsa KAP'ta 24-month comprehensive search yap.
- **Borclanma bildirimi protokolu:** Tutar KAP metninin tam okunmasiyla tespit edilmeli. Proxy tahmin kabul edilemez.

## Zorunlu Kontrol Listesi

Her rapor icin:
- [ ] Bolum A (son 30 gun) ve Bolum B (12 ay) ayri sunuldu mu?
- [ ] Her disclosure icin: KAP ID + URL + tarih + kategori + materiality + ozet
- [ ] Holding ise bagli ortakliklarin KAP disclosure'lari da izlendi mi?
- [ ] Impact quantification (TRY, % equity, % EBITDA, % market cap) her material event icin
- [ ] Forward event takvimi eklendi mi?
- [ ] Makro olaylarin KAP yansimasi kontrolu yapildi mi?
- [ ] Full 12-month inventory: Tier 1 + Tier 2 + Tier 3 — truncation yok

**Materiality Hiyerarsisi:**
- HIGH: Finansal duran varlik satis/alim >5B TRY, temettu, M&A, genel kurul kararlari
- MEDIUM: Kredi anlasmalari, ceyreklik finansallar, bagli ortaklik sermaye artirimlari
- LOW: Kurumsal yonetim form guncellemeleri, YK uye degisiklikleri, rutin uyum raporlari
- Earnings surprise buyuklugune gore MEDIUM → HIGH yukselebilir

**CMB Materiality Framework:** Insider information testi (capital markets instrument value etkiler mi?) + Investor decision testi + Public disclosure status. Ucune de EVET → HIGH.

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK'da 11 disclosure denip sadece 3'unun detayi verildi — 8 disclosure kayip
- KCHOL'da bagli ortakliklarin (TUPRS, ARCLK, FROTO, YKBNK) KAP disclosure'lari izlenmedi
- TCELL'de Tier 3 disclosures truncated, subsidiary disclosures eksik, BTK regulatory eksik
- TUPRS'de 12 aylik inventory cikarildi ama mandate 30 gun istedi — scope drift
- TUPRS Hurmuz krizi KAP etkisi izlenmedi
- EREGL borclanma bildirimi tutari bilinmiyor (proxy tahmin birakildi)
- EREGL EPDK tarife karari KAP izlemesine dahil edilmedi
- Bazi disclosure'larda gercek bildirim numarasi yerine placeholder kullanildi

## Son 3 Raporun Ogrenimleri

- **EREGL (2026-04-13):** Celik/emtia sirketleri icin KAP + makro olay kategorileri: EPDK/BOTAS → macro_regulatory_event, AB Safeguard/CBAM → trade_regulatory_event, demir cevheri/kok komuru sok → commodity_market_event. OYAK sahiplik degisikligi izlenmeli. AB Safeguard forward event takvimine eklenmeli.
- **TUPRS (2026-04-12):** Cift bolum yapisi (30 gun + 12 ay) zorunlu. Hurmuz krizi gibi makro olaylarin KAP yansimasi kontrolu gerekli. Forward event takvimi eklenmeli.
- **TCELL (2026-04-11):** 4 Tier 1 material event tespit edildi. Telekom icin ek kategoriler: 5G rollout, spectrum, BTK regulatory, subsidiary disclosures (Superonline, Lifecell, Paycell).

## Sektor Bilgi Bankasi

- Multi-stage transaction: Buyuk islemler 3-6 aylik surecte birden fazla KAP bildirimi uretir.
- Temporal clustering: Buyuk holdinglerin stratejik islemleri Q4-Q1'de yogunlasir.
- Debt issuance 2 asamali: Credit rating duyurusu → final pricing & terms.
- KAP tek yetkili kaynak. Haber siteleri dogrulama icin kullanilabilir ama KAP ID zorunlu.
- KAP: kap.org.tr → Sirket ara → Bildirim Sorgu.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **monitoring_window.start "2025-04-16" — 1 YIL GERİ** — Doğru pencere "2026-03-17" (son 30 gün) veya "2025-04-16" (son 12 ay) olmalıydı. Çıktı "2025-04-16" gösteriyor ama 119 disclosure listelendi; bu 12 aylık tarama mı, veri hatası mı? Net belirtilmeli.
- **is_material: null tüm disclosures için** — 119 disclosure'dan hiçbirinin `is_material` alanı doldurulmadı. CEO değişimi (1590373) açıkça materyal; manuel olarak bile `is_material: true` yazılabilirdi.
- **quantitative_impact_try: null tüm disclosures için** — CEO değişimi, temettü sıfır kararı, yönetim kurulu atamaları için TRY etki hesabı yapılmadı. "CEO değişiminin finansal etkisi sayısal verilemez" doğrudur ama temettü sıfır kararının impact'i hesaplanabilirdi: "118.2 bn TRY olası temettü ödemesinin sıfırlanması = nakit koruması +118.2 bn TRY."
- **İran krizi KAP sessizliği tespiti yapılmadı** — 10 Orta Doğu rotası askıya alındı; THYAO'nun bu konuda özel durum açıklaması yapıp yapmadığı kontrol edilmedi. "Sessizlik de bulgudur" kuralı uygulanmadı.
- **Forward event takvimi üretilmedi** — Mayıs 2026 Q1 sonuçları, yeni CEO'nun ilk stratejik beyanı, TCMB PPK tarihleri forward takvimde sunulmadı.
- **Trafik KPI aylık bildirimleri KAP ID ile teyit edilmedi** — Mart 2026 trafik verisi (pax +%16, doluluk %83.6) context'ten aktarıldı ama KAP bildirim ID'si çekilmedi.

### Bundan Sonra:
- **is_material alanını her zaman doldur** — "SPK mevzuatı açısından materyal mi?" sorusunu her disclosure için cevapla: true/false/uncertain. Yönetim değişikliği → true (SPK bildirimi zorunlu). Rutin form → false. Bilinmiyorsa "uncertain" yaz.
- **Temettü/kar payı bildirimleri için quantitative_impact zorunlu** — Temettü kararı (sıfır da olsa) → "X mn TRY temettü dağıtılmadı / korundu" formatıyla sayısal etki her zaman hesaplanabilir.
- **THYAO için zorunlu KAP tarama kategorileri:**
  1. Aylık trafik KPI bildirimleri (ID + URL her ay)
  2. CEO/YK değişikliği sonrası "özel durum açıklaması"
  3. Rota askıya alma / operasyonel değişiklik bildirimleri
  4. İran/Orta Doğu operasyonu hakkında THYAO sessizliği tespiti
  5. Yeni CEO'nun ilk stratejik beyanı (AGM sonrası bildirimi takip)
- **monitoring_window başlangıç tarihi net yaz** — "Son 30 gün (2026-03-16 → 2026-04-16)" veya "Son 12 ay (2025-04-16 → 2026-04-16)" hangisi mandate'se, başlıkta açıkça belirt.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **119 disclosure tarandı ✓ — kapsam iyi** — Bildirim sayısı kabul edilebilir.
- **is_material null tüm 119 bildirimde — 5. THYAO, kalıcı bloker** — CEO değişimi (KAP 1590373) SPK mevzuatı uyarınca açıkça materyel; null çıktı 5. kez tekrarlandı. Rutin formlar için "LOW" bile olsa zorunlu.
- **quantitative_impact null tüm bildirimlerde — 5. THYAO** — Temettü sıfır: "118.2bn TRY nakit koruması" hesaplanabilirdi. İran/rota: gelir kaybı tahmini [conf: LOW] kabul edilir.
- **İran/Orta Doğu rota krizi KAP sessizliği tespiti yok** — 10 rota askıya → THYAO özel durum açıklaması yaptı mı? Sessizlik de bulgudur.
- **Forward event takvimi üretilmedi — 5. THYAO** — Q1 sonuçları, TCMB PPK, yeni CEO stratejik beyanı, aylık trafik bildirimi yok.
- **Aylık trafik KPI bildirimi KAP ID'si teyit edilmedi** — Mart 2026 pax +%16 verisi context'ten alındı; KAP bildirim ID'si ve URL'si verilmedi.

### Bundan Sonra:
- **is_material: Her bildirim için zorunlu, null = FAIL (5. direktif — kesinleşti)** — HIGH/MEDIUM/LOW skalası. İçerik okunmadıysa: "BELİRSİZ"; asla null bırakma.
- **Sessizlik tespiti: İran + CEO değişimi sonrası KAP özel durum bildirimi kontrol edilecek** — SPK bildirimi beklentisi var; bildirim yoksa "Sessizlik Tespiti" bölümüne yaz.
- **Forward takvim = son bölüm, 5 zorunlu kategori** — Tarih | Olay | Beklenen Materyallik | İlgili Agent. Eksikse çıktı tamamlanmış sayılmaz.

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **is_material: null — 99 bildirimin TAMAMI** — Her bildirim için değerlendirme yapılmadı. Özellikle kritik: KAP ID 1594693 (temettü dağıtımı, 1594692 ile aynı gün = BUGÜN, 17 Nisan) ve 1594692 (AGM çağrısı) açıkça YÜKSEK materyallikti; null olarak kaldı.
- **quantitative_impact: null — tüm bildirimlerde** — Temettü için "1,594,693 TL × hisse adedi = X TRY toplam temettü" hesaplanabilirdi. Her bildirim için en azından "conf: LOW" ile tahmin üretilmeli.
- **Temettü dağıtımı (BUGÜN, 17 Nisan) IMMEDIATE olarak flaglenmedi** — Bugün gerçekleşen materyel olay (temettü dağıtım başlangıcı) urgent değil, LOW olarak sınıflandırıldı. event_timeline_alert'e IMMEDIATE sinyali verilmedi.
- **AGM çağrısı (BUGÜN, 17 Nisan) IMMEDIATE olarak flaglenmedi** — Aynı problem; AGM gündemindeki konular (sermaye artırımı, YK seçimi) NEAR-TERM materyel olayları tetikleyebilirdi.
- **DÖNÜŞÜM bildirimleri (pay dönüşümü) değerlendirilmedi** — Birden fazla DÖNÜŞÜM bildirimi var; bunlar serbest dolaşım ve ortaklık yapısı değişimi açısından materyel olabilir.
- **Forward event takvimi üretilmedi** — Q1 2025 finansal sonuçlar, AGM tarihi, yeni sözleşme duyuruları beklentisi; bunlar ASELS izleme takvimine girilmedi.

### Bundan Sonra:
- **Savunma şirketleri için is_material değerlendirme şablonu:**
  - Sözleşme/ihale duyuruları: YÜKSEK (>1% revenue ise ÇOK YÜKSEK)
  - SSB/TSKGV bildirimleri: YÜKSEK
  - Pay dönüşümü (DÖNÜŞÜM): ORTA (serbest dolaşım etkileri)
  - Temettü/AGM (bugün veya 7 gün içinde): YÜKSEK + IMMEDIATE
  - Rutin dipnot açıklamaları: DÜŞÜK
- **Forward takvim savunma şirketleri için zorunlu içerik:** (1) Yeni sözleşme duyurusu beklentisi, (2) SSB ihale takvimi, (3) Çeyrek finansal sonuçlar, (4) AGM/EGM tarihleri, (5) Temettü ödeme takvimi.
- **Bugün gerçekleşen olaylar her zaman IMMEDIATE + YÜKSEK** — Temettü dağıtım günü, AGM günü, vade tarihi — bunlar her zaman IMMEDIATE önceliğiyle raporlanacak.

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
