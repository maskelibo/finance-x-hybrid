# Valuation Agent — Vaka Bazlı Dersler (Katman 2b)

> Önceki analizlerden CEO geri bildirimi ve vaka bazlı öğrenimler.
> Aynı şirketi veya benzer sektörü analiz ederken `Read` ile aç.

---

## CEO Geri Bildirimi — THYAO

- DCF'te FCF projeksiyonu CF tablosu olmadan yapıldı (conf: 0.00) — model sonuçlarına çok güvenildi.
- Havacılık yöntem ağırlıkları açıklanmadı.
- Peer değerleme tarihleri eski (Nov 2024 / Feb 2025).
- WACC havacılık benchmark'ı belirtilmedi.
- **Kural:** Havacılık ağırlıkları: EV/EBITDAR %40 + DCF (EBITDAR) %35 + P/E %15 + FCF yield %10. CF yoksa DCF conf LOW, EV/EBITDAR %50+'a çek.

## CEO Geri Bildirimi — BIMAS

- Output truncated — Sensitivity matrix, peer comparison, DCF tablosu eksik.
- WACC bileşenleri açıklanmadı.
- **Kural:** Perakende ağırlıkları: EV/EBITDA (IFRS 16 sonrası) %40 + normalize %20 + DCF %25 + FCF Yield %10 + DDM %5. CF yoksa DCF %15'e düşür.

## CEO Geri Bildirimi — KCHOL Delta

- SOTP NAV bileşen tablosu truncated.
- Fitch düzeltmesi formülü gösterilmedi (-8 TL NAV).
- Holding iskontosu driver analizi tamamlanmadı.
- Revenue yanlış baz (Q4 vs FY) valuation'a yansımış olabilir.
- **Kural:** SOTP tablosunu önce özet sonra detay. Fitch düzeltmesi açık zincirle göster. 6 driver: ROE/Ke makas, çapraz sahiplik, ARCLK zararı, IFRS 8 eksikliği, governance, likidite.

## CEO Geri Bildirimi — SAHOL

- Parça 2 tablosu truncated. Parça 3 (unlisted iştiraklerin değerlemesi) görünmüyor.
- Holding discount tarihsel analizi yapılmadı.
- Kataliz bazlı senaryo analizi eksik.
- **Kural:** Holding SOTP 3 tam parça zorunlu. 5 yıllık discount bant zorunlu. Senaryo = kataliz tabanlı.

---

## Son Raporların Öğrenimleri

### EREGL (13 Nisan)
- Yüksek faiz rejiminde TL DCF piyasanın belirgin altında kalır — low confidence etiketiyle sun.
- Döngüsel sanayide dip net karda F/K bozulur, omurga EV/FAVÖK+PD/DD olmalı.
- CAPEX rehberi (22-28B TRY/yıl) DCF'te öncelikli. Ermaden opsiyonelliği excluded value.

### TUPRS (12 Nisan)
- Rafineri marjı $/bbl birincil FCF değişkeni (1 $/bbl ≈ 5-6B TRY EBITDA).
- Hisse adedi: Toplam Temettü / Brüt HBT.
- Emtia ağırlıkları: EV/EBITDA %40 + DCF %35 + yield %15 + PE %10.

### THYAO (14 Nisan Round 2)
- USD bazlı WACC %13.2. Baz DCF ~780-820 TRY; blended → 550 TRY (%13 TR iskontosu sonrası).
- Peer (7): Ryanair 5.8x / Wizz 4.4x / IAG 4.2x / Lufthansa 3.6x / AF-KLM 3.2x / DAL 5.1x / Pegasus 4.8x → medyan 4.4x; THYAO 2.52x = -%43.
- CF tablosu eksik — FCF tahmin bazlı (güven 0.35).

### KCHOL (14 Nisan)
- Bankacılık konsolidasyonu (YKB) → FCF -204B negatif → DCF geçersiz; SOTP %100 zorunlu.
- GCM SOTP 406 TL anchor; blended NAV ~388 TL; iskonto %47-50.
- Holding discount: ROE/Ke makas (+8pp), çapraz sahiplik (+5pp).

### KCHOL Delta (16 Nisan 2026)
- **Üç yönlü NAV doğrulama**: SOTP bottom-up (364-402 TL) ≈ GCM anchor (406 TL) ≈ piyasa-örtük NAV (207.5/(1-0.49)=407 TL) — üçü bağımsız yakınsadı. Bu yakınsama yüksek güven sinyalidir; raporlarda zorunlu cross-check.
- **DCF matematiksel anomali**: TRY WACC %42 + negatif FCF → özsermaye değeri -786,837 mn TL (-310 TL/hisse). Hata değil, beklenen sonuç. Ağırlık %0. Holding yapısında DCF'i hiç çalıştırma, sadece "geçersiz" olarak işaretle ve SOTP'a geç.
- **Holding iskontosu 6 driver sistemi (zorunlu)**: (1) ROE/Ke negatif makas: KCHOL ROE ~3.25% vs Ke ~35-38% → en büyük driver; (2) ARCLK kronik zarar: 2024'te -15B TL; (3) Fitch downgrade (Ekim 2024) → YKBNK P/BV baskısı; (4) tek seferlik gelir dominansı (raporlanan NI'nin %70'i); (5) IFRS 8 segment şeffaflık eksikliği; (6) çapraz sahiplik/governance karmaşıklığı.
- **Crack spread → NAV hassasiyet kalibrasyonu**: $1/bbl TUPRS marjı = ±%0.19 KCHOL NAV (TUPRS ağırlık %30 × EV/EBITDA esneklik). 4×4 matris: iskonto % × TUPRS marjı $/bbl.
- **YKBNK P/BV matrisi**: 29 Nisan Q1 2025 sonuçları NAV revizyonu için kritik tetikleyici. P/BV 0.75x→1.0x = +5-8 TL/hisse NAV artışı.
- **Kural:** Holding SOTP önce ÖZET (3 satır: Gross NAV, net borç, iskonto) sonra DETAY tablosu. İskonto driver tablosunu mutlaka ekle. Hedef fiyat = NAV × (1 - baz iskonto).

### SAHOL (14 Nisan)
- SOTP Baz NAV 265.96B TRY; Akbank %75. Baz 104 TL, Bull 137, Bear 77.
- Holding discount %25-45 (mevcut %44 — tarihsel yüksek).
- Akçansa satış +19.5B HIGH confidence.

### ASTOR (14 Nisan)
- TRY WACC tuzağı: CAPM %42 → DCF 65-110 TL (piyasa açıklanamıyor). Piyasa-örtük ~%12.
- Blended WACC %27 (USD %60 × %15.5 + TRY %40 × %42.7).
- NTM vs LTM fark yüksek büyüme döneminde kritik: LTM 17.8x vs NTM 12.3x.
- DDM büyüme şirketlerinde anlamsız; %5 max.

---

## Sektör Bilgi Bankası (Aktif Referanslar)

- TUPRS: Bear 110 / Baz 220 / Bull 325 TL
- THYAO: Bear 220 / Baz 550 / Bull 1,000 TRY; EV/EBITDAR 2.61x (peer 4.1x)
- KCHOL: Bear 182 / Baz 250 / Bull 322 TL; GCM NAV 406 TL; Bottom-up NAV 364-402 TL; iskonto %49 (mevcut); baz iskonto varsayım %32; P/NAV 0.51x (16 Nis 2026)
- SAHOL: Bear 108 / Baz 131 / Bull 155 TL; Gross NAV 342.4B
- ASTOR: Bear 107 / Baz 215 / Bull 315 TRY; EV/EBITDA NTM 12.3x

---

*Dosya sahibi: Valuation Agent | Güncelleyen: CEO Feedback Loop*

### 2026-04-22 — THYAO
THYAO IFRS16 farkı FY2024 bazında ~40-60B TRY tahmin ediliyor. Bu fark EV'yi %8-12 değiştirir, hedef fiyatı 10-20 TRY etkiler. Mevcut base hedef 413 TRY — IFRS16 hariç net borçla 395 TRY, dahil versiyonla 430 TRY olabilir. Fark yatırım kararını etkileyecek büyüklükte.

### 2026-04-22 — THYAO
THYAO: Valuation LLM narrative eksiksiz ve kaynak doğrulamalı ancak COO/strategic_synthesis structured field okursa null görür. Engine nulls + LLM narrative çelişkisi raporun güvenilirliğini zedeliyor ve downstream confidence'ı düşürüyor.

### 2026-04-22 — THYAO
THYAO 22-Nis: EV/EBITDA 6.10x vs 4.40x farkı 314B TRY'ye karşılık geliyor. Bu belirsizlik Bear/Baz/Bull senaryolarının tümünü etkiliyor. Hedef fiyat aralığı (235-877 TRY) bu yüzden çok geniş.

### 2026-04-23 — EREGL
EREGL: CEO mandate valuation timeout riskini açıkça uyarmıştı ('split into 3 parts on first attempt') — bu önlem alınmadı ve agent hiç çalışmadı. Uyarı → önlem dönüşümü orchestrator pre-run checklist'e girilmeli.

### 2026-04-23 — EREGL
EREGL: final_summary Bear=MA200 27.51, Bull=Bollinger_upper 34.11 kullandı. Bu veriler valuation_agent yok diye MA/BB seviyelerine dönüştü — yatırımcıya yanıltıcı.

### 2026-04-24 — KCHOL
KCHOL TUPRS: legal entity pay %40.5 vs board_report proxy %51.2 → NAV farkı ~66 Mly TRY. YKBNK legal entity pay (UniCredit devir sonrası ~%49.9) board_report %68.0 ile çelişiyor — devir sonrası yapısal değişim izlenmiyor.

### 2026-04-25 — KCHOL
KCHOL 20260425: YKBNK legal entity stake belirsizliği (%41 vs %61.17 Koç Grubu) baz senaryo hedef fiyatı 222 TL'nin ~±10-13 TL sapma riski taşıyor. KAP pay bildirimleri data_collection'da mevcut (1580840: pay alım satım bildirimi) ancak valuation_agent kullanmadı.

### 2026-04-25 — KCHOL
KCHOL: 31 Mrd TRY EBITDA farkı. Doğru değer IAS29 adjusted (212,360) büyük olasılıkla; ancak peer karşılaştırması için reported (181,500) kullanılmalı. İki ayrı SOTP satırı gerekir.

### 2026-04-25 — KCHOL
KCHOL: TUPRS Koç Group %51.2 vs KCHOL legal entity %40.5 (GCM kaynaklı). 10.7pp fark yüksek NAV etkisi; legal entity payı KAP'tan doğrulanmadan raporlanamaz.

### 2026-04-25 — KCHOL
FY2024 EBITDA farkı (181,500 vs 212,360 = %17 sapma) IAS 29 monetary gain muamelesinden kaynaklanıyor — kısmen EBITDA'ya dahil eden ve etmeyen kaynaklar var. KCHOL özelinde IAS 29 adjusted EBITDA tanımı standartlaştırılmalı.

### 2026-04-25 — KCHOL
TUPRS için context_extraction STAKE_MISMATCH zaten 25pp delta tespit etti (26.2% legal vs 51.2% group). Bu delta GCM raporunda holding company perspective'ten yazıldığını gösteriyor. KCHOL hissedarı için legal entity NAD doğru ölçüttür.
