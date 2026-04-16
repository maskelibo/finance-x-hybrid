# Valuation Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **WACC seffaflik zorunlu:** Risk-free rate + ERP + ulke risk primi (Damodaran) + beta (sektor x kaldirac) — her bilesen kaynakla gosterilmeli. WACC siyah kutu OLAMAZ.
- **DCF vs agirlikli hedef farki >%20 ise gerekce zorunlu.**
- **Peer grubu her sirket icin kaynak ver:** Kullanilan her peer'in EV/EBITDA degeri kaynakla tabloda yer almali. Medyan hesabi seffaf olmali.
- **Yuk bolme protokolu:** DCF, Peer EV/EBITDA, Sensitivity matrix ayri ayri calistir, sonra birlestir. Tek seferde hepsi YASAK (exit 143 riski).
- **Holding = SOTP zorunlu.** Operating company → SOTP yok. Context_extraction ciktisini kontrol et.
- **NAV hesabi TAM SEFFAFLIK:** Listed subs (mcap x own%) + Unlisted (FAVOK x multiple, kaynak goster) + Parent net debt = Total NAV.
- **Holding discount sebep analizi zorunlu:** Complexity, capital allocation, catalyst yoklugu, likidite, governance — quantify et.
- **Bear/Base/Bull senaryo DETAYLI:** Her senaryo icin holding discount, subsidiary multiple, parent debt, trigger ayri ayri belirt.
- **Her hedef fiyat icin metod agirliklari, carpan kaynagi ve kopru tablosu ver.**
- **Disarida birakilan opsiyonel varliklar icin `excluded value` notu ekle.**
- **Upstream EBITDA celiskisi varsa degerleme kilitlenmeli.** Dogrulanmadan EV/EBITDA hesabi YAPILMAZ.
- **Forward EBITDA ve CAPEX varsayimlarini makro/operasyonel driver listesine bagla.**

## Zorunlu Kontrol Listesi

**Degerleme Metod Agirliklari (sektor bazli):**
- Emtia/enerji: EV/EBITDA %40 + DCF %35 + temettü verimi %15 + PE %10
- Celik: EV/EBITDA %40 + normalize DCF %35 + P/B sanity %15 + EV/ton %10
- Havacilik: EV/EBITDAR %40 + DCF (EBITDAR) %35 + P/E %15 + FCF yield %10
- Perakende: EV/EBITDA (IFRS 16 sonrasi) %40 + normalize %20 + DCF %25 + FCF %10 + DDM %5
- DDM: Max %15 agirlik; >%100 payout doneminde %5-10. Kesintili dagitim gecmisinde dusuk agirlik.
- Holding: SOTP + NAV + Discount analizi. DCF holding icin genellikle gecersiz (bankacilik FCF sorunu).

**WACC Bilesen Kaynaklari:**
- Risk-free: Turkiye 10Y Eurobond yield (USD bazli) veya TCMB politika faizi
- Beta: Sektor kaldiracisiz beta x kaldirac ayarlamasi
- ERP + CRP: Damodaran Ocak 2026 (pages.stern.nyu.edu/~adamodar)
- Kd: Sirketin agirlikli borclanma maliyeti (son finansal rapordan)
- Kontrol: valueinvesting.io/[TICKER].IS, alphaspread.com/security/ist/[TICKER]

**Turkiye WACC Araliklari (2026):**
- Sigorta/finansal: ~%29-30 | Banka: yapisal farkli (dusuk) | Enerji/sanayi: %25-28

## Bilinen Hatalar (Bir Daha Yapma)

- KCHOL: GCM NAV anchor olarak kullanılıyor ✓. DCF %0 ağırlık (bankacılık FCF sorunu) ✓. SOTP %80+ ✓.
- TUPRS: Exit code 143 crash — yük bölünmedi. Peer EV/EBITDA kaynakları gösterilmedi. WACC bileşenleri gizli kaldı.
- EREGL: Valuation çıktısı downstream'e ulaşmadı (DEGRADED). Hatalı EBITDA ile hesap.
- TRY WACC tuzağı: CAPM TRY WACC (%40+) DCF'i piyasanın çok altına çeker. Çözüm: piyasa-örtük WACC + blended USD/TRY WACC.
- TCMB oranını her analizde macro_analysis çıktısından al — FA memory bayatlar.

---

*Vaka bazlı dersler: case_lessons.md | Domain bilgisi: knowledge.md*

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **Resmi SOTP output teslim edilmedi** — Bear/Baz/Bull (182/250/322 TL) case_lessons.md'ye yazıldı; bu downstream için yeterli değil. QA ve financial_analysis resmi çıktı bekledi; case_lessons'a yazma ≠ output iletme. Formal SOTP tablo: 6 iştirak × [sahiplik oranı, market cap, katkı TL, katkı %, discount varsayımı] formatında downstream'e gönderilmeliydi.
- **Conf: 0.40 → hedef fiyat güvensizliği downstream'e yeterince aktarılmadı** — "Kısmi kanıt" uyarısı case_lessons'da var ✓; ama downstream agentlara (strategic_synthesis, final_summary) "Bu hedef fiyatı %40 güvenle kullanın" notu açıkça gönderilmedi.
- **FY2025 negatif FCF (-204,862 mn TL) → SOTP yaklaşımı tekrar doğrulandı ✓** — DCF %0 ağırlık kararı doğru; ama "Neden DCF geçersiz?" analizi (negatif OCF + bankacılık FCF sorunu) formal çıktıda görünmüyor; sadece case_lessons'ta.
- **Sensitivity matrix (WACC × terminal growth) holding için de yapılmadı** — Tek nokta değerleme: GCM NAV 406 TL anchor. Holding discount %40/%49/%55 senaryosu × segment multiple ±%20 = hassasiyet tablosu eksik.

### Bundan Sonra:
- **SOTP formal output formatı** — Sütunlar: İştirak | Sahiplik % | KCHOL payı Market Cap (mn TL) | SOTP Değerleme Yöntemi | NAV Katkısı (mn TL) | NAV Katkısı (TL/hisse). 6 satır + toplam + holding discount → NAV. Bu tablo QA'ya ve final_summary'ye doğrudan gönderilecek.
- **Confidence = 0.40 → downstream uyarısı zorunlu** — Conf <0.60 ise downstream mesajı: "Bu hedef fiyat formal SOTP yapılmadan üretildi; Bear/Baz/Bull aralığı güvenilirlik düşük. Yatırım kararı için formal SOTP tamamlanana kadar tavsiye: İZLE."
- **Holding discount sensitivity tablosu** — Discount %35/%49/%60 × GCM NAV 406 TL = 263/207/162 TL üç senaryo. Bu tablonun Bear/Baz/Bull'la tutarlılığı gösterilmeli.

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **EV/ton analizi (%10 ağırlık) görünmüyor** — Çelik sektörü değerleme metodolojisi: EV/EBITDA %40 + normalize DCF %35 + P/B sanity %15 + EV/ton %10. EV/ton bölümü çıktıda yer almadı.
- **Peer grubu kaynak tablosu eksik** — ArcelorMittal, POSCO, Nippon Steel peer EV/EBITDA değerleri verildi ama kaynak URL veya rapor tarihi yok. Her peer'ın doğrulanmış EV/EBITDA'sı ayrı tabloda zorunlu.
- **Sensitivity matrix (WACC × terminal growth)** — WACC %28 tek nokta; WACC %24-32 × g %1-4 matris çalıştırılmadı. Hedef fiyat duyarlılığı belirsiz.
- **Forward EBITDA varsayımları makro driver'lara bağlanmadı** — "2026E EBITDA = 22,000 mn TRY" kullanıldı ama hangi HRC fiyatı, hangi kapasite kullanımı, hangi enerji maliyeti varsayıldığı tabloda gösterilmedi.
- **FY2023 negatif FCF (−13.14bn) anomalisi açıklanmadı** — DCF normalize FCF taban hesabında FY2023 negatif FCF kullanıldı; bu değerin kök nedeni (yatırım dönemi mi, WC çıkışı mı?) not edilmedi.
- **WACC şeffaflığı ve TRY tuzağından kaçınma ÇOK İYİ uygulandı ✓** — USD/TRY blended WACC yaklaşımı doğru; market-implied cross-check eklendi ✓. Bu iyi uygulama her çelik analizinde devam etsin.

### Bundan Sonra:
- **EV/ton çelik analizlerinde zorunlu 4. metot** — Erdemir kapasitesi (4.5 mt) + İsdemir kapasitesi (3.8 mt) = 8.3 mt toplam; EV/kapasitesi (ton başına) + peer karşılaştırması. Kota: EV/ton $150-300 küresel çelik aralığı.
- **WACC sensitivity matrix zorunlu** — WACC (%24/%28/%32) × terminal growth (%1/%2.5/%4) = 3×3 = 9 senaryo hedef fiyat tablosu. Tek nokta yetmez.
- **Forward EBITDA driver tablosu** — "2026E EBITDA = X" için: HRC varsayım (USD/ton) + kapasite kullanım (%) + enerji maliyeti (TRY/ton) + kur (USD/TRY) → EBITDA TRY. Makro driver'lara açıkça bağla.

## CEO Geri Bildirimi — 2026-04-14 — TCELL Raporu
### Eksikler:
- Degerleme girdilerini platform ara ciktilari ve ikincil kaynaklardan topladi; birincil kaynak disiplini bozuldu.
- Hisse sayisi, EBITDA cekirdegi ve net borc tanimi catismali iken adil deger ve hedef fiyat verdi.
- WACC, peer carpanlari ve metod agirliklari tam seffaf tablo halinde gorunmedi; DCF kalibrasyonu narratif kaldi.
### Bundan Sonra:
- Degerleme, sadece reconciliation tarafindan kilitlenmis EBITDA, net borc ve hisse sayisi setiyle baslar; conflict varsa valuation durur.
- Her raporda WACC bilesenleri, peer carpan kaynaklari, metod agirliklari ve kopru tablosu tek bakista gorunur olmadan hedef fiyat yayinlama.
