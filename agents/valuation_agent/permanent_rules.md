# Valuation Agent — Kalıcı Kurallar

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

## Bilinen Hatalar

- KCHOL: GCM NAV anchor olarak kullanılıyor ✓. DCF %0 ağırlık (bankacılık FCF sorunu) ✓. SOTP %80+ ✓.
- TUPRS: Exit code 143 crash — yük bölünmedi. Peer EV/EBITDA kaynakları gösterilmedi. WACC bileşenleri gizli kaldı.
- EREGL: Valuation çıktısı downstream'e ulaşmadı (DEGRADED). Hatalı EBITDA ile hesap.
- TRY WACC tuzağı: CAPM TRY WACC (%40+) DCF'i piyasanın çok altına çeker. Çözüm: piyasa-örtük WACC + blended USD/TRY WACC.
- TCMB oranını her analizde macro_analysis çıktısından al — FA memory bayatlar.

---
*Bu dosya her çalışmada otomatik yüklenir. Değişiklik yapmadan önce CEO onayı alın.*
