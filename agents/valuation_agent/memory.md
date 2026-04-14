# Valuation Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **WACC seffaflik zorunlu:** Risk-free rate + ERP + ulke risk primi (Damodaran) + beta (sektor x kaldirac) — her bilesen kaynakla gosterilmeli. WACC siyah kutu OLAMAZ.
- **DCF vs agirlikli hedef farki >%20 ise gerekce zorunlu.**
- **Peer grubu her sirket icin kaynak ver:** Kullanilan her peer'in EV/EBITDA degeri kaynakla tabloda yer almali. Medyan hesabi seffaf olmali.
- **Yuk bolme protokolu:** DCF, Peer EV/EBITDA, Sensitivity matrix ayri ayri calistir, sonra birlestir. Tek seferde hepsi YASAK (exit 143 riski).
- **Holding = SOTP zorunlu.** Operating company -> SOTP yok. Context_extraction ciktisini kontrol et.
- **NAV hesabi TAM SEFFAFLIK:** Listed subs (mcap x own%) + Unlisted (FAVOK x multiple, kaynak goster) + Parent net debt (konsolide - subsidiary debt) = Total NAV.
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
- DDM: Max %15 agirlik; >%100 payout doneminde %5-10. Kesintili dagitim gecmisinde dusuk agirlik.
- Holding: SOTP + NAV + Discount analizi

**WACC Bilesen Kaynaklari:**
- Risk-free: Turkiye 10Y Eurobond yield (USD bazli) veya TCMB politika faizi
- Beta: Sektor kaldiracisiz beta x kaldirac ayarlamasi
- ERP + CRP: Damodaran Ocak 2026 (pages.stern.nyu.edu/~adamodar)
- Kd: Sirketin agirlikli borclanma maliyeti (son finansal rapordan)
- Kontrol: valueinvesting.io/[TICKER].IS, alphaspread.com/security/ist/[TICKER]

**Turkiye WACC Araliklari (2026):**
- Sigorta/finansal: ~%29-30 | Banka: yapisal farkli (dusuk) | Enerji/sanayi: %25-28

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **DCF'te FCF projeksiyonu CF tablosu olmadan yapıldı** — Cash Flow Statement 0.00 confidence'a sahip; buna rağmen DCF modeli USD bazlı FCF projeksiyonu ile devam etti. Confidence notu eklendi ✓ ama model sonuçlarına çok güvenildi.
- **Havacılık için yöntem ağırlıkları açıklanmadı** — Havacılık sektörü değerleme mixi (EV/EBITDAR vs DCF vs P/E vs temettü verimi) oranları ve gerekçeleri verilmedi. Memory'de havacılık için özel yöntem ağırlıkları yok.
- **Peer değerleme tarihleri eski** — Analist hedefleri Nov 2024 / Feb 2025 bazlı; kriz sonrası (Nisan 2026) güncel peer değerlemeleri kullanılmadı.
- **WACC havacılık benchmark'ı belirtilmedi** — %13-15 WACC kullanıldı; küresel havacılık sektörü WACC normu ile karşılaştırma yapılmadı.
- **7 peer tablo oluşturuldu ✓ ve medyan hesabı şeffaf ✓** — Bu pozitif; devam et.

### Bundan Sonra:
- **Havacılık değerleme ağırlıkları standardize et** — EV/EBITDAR %40 + DCF (EBITDAR bazlı) %35 + P/E %15 + FCF yield %10. EBITDA değil EBITDAR (kira öncesi) kullan — çünkü havacılıkta lease yükü çok yüksek.
- **CF olmadan DCF confidence'ı LOW olarak etiketle** — "CF tablosu yok → FCF projeksiyon tahmini; DCF güveni LOW; EV/EBITDAR peer multiples ağırlığı artırıldı" notu ekle ve ağırlığı %40'tan %50+'a çek.
- **Peer tablosunda her satır için: şirket + son rapor tarihi + kaynak URL** — Nov 2024 verisi kullanıldığında "(tarih: Nov 2024, güncel olmayabilir)" notu zorunlu.
- **Havacılık sektörü için market-implied WACC hesabı zorunlu** — Mevcut fiyat + consensus FCF → hangi WACC'ı implicitly fiyatlıyor? Bear senaryosunda market-implied WACC gösterildi ✓; bunu her analizde yap.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **Output truncated — Bölüm 2+ görünmüyor** — "Bölüm 2: Güncel Fiyat vs Adil Değer" bölümü başladı ama kesildi. Sensitivity matrix, peer comparison tablosu, DCF metodoloji tablosu eksik (QA P1 tespiti).
- **WACC bileşenleri açıklanmadı** — Perakende için WACC hesabı (risk-free + ERP + CRP + beta) gösterilmedi. TRY bazlı vs USD bazlı WACC tartışması yok.
- **DDM uygulama mantığı doğru ✓** — "Düzenli temettü, max %5 ağırlık" kararı THYAO dersinden öğrenildi ve burada doğru uygulandı.
- **CF bloker için FCF tahmin metodolojisi açıklanmadı** — "CF ESTIMATED" notu var ✓ ama tahmin hangi yöntemle yapıldı (OCF proxy, sector median CAPEX/EBITDA baz)? Bu açıklanmalı.
- **3 senaryo adil değer tablosu kapsamlı ✓** — Bull 965 / Baz 725 / Bear 490 + senaryo anlatısı eksiksiz. Olasılık ağırlıkları (%25/%50/%25) gösterildi.

### Bundan Sonra:
- **Perakende sektörü değerleme ağırlıkları standardize:**
  - EV/EBITDA (IFRS 16 sonrası) %40 — kira etkili karşılaştırma için
  - EV/EBITDA (IFRS 16 öncesi, kira normalize) %20 — sektör normalizasyonu
  - DCF (FCF yield bazlı) %25 — CF tablosu varken; yoksa %15'e düşür, EV/EBITDA %45'e çek
  - FCF Yield %10
  - DDM %5 (düzenli temettü mevcut)
- **Peer benchmark ağırlıklı seçim:** Jeronimo Martins (Biedronka) ve Pepco Türkiye hard-discount benzeri; bunlar medyan hesabına alınmalı. Sadece SOKM yeterli değil.
- **BIMAS değerleme referans değerleri (Nisan 2026):** EV/EBITDA NTM ~10.4x (peer medyan 11.1x), FCF Yield ~3.5% baz, P/E 24.3x (IAS29 şişirilmiş), Bear 490 / Baz 725 / Bull 965 TRY. HOLD — adil değerli. Konsensüs ortalama 795 TL, medyan 820 TL (kendi hedefimizin %7-10 üstünde).

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **SOTP NAV bileşen tablosu truncated** — "ARCLK (%37.5 pay) → ..." ile kesildi. TCELL, FROTO, EREGL katkıları görünmüyor. Blended NAV 385-388 TL hesabının detaylı gösterimi eksik.
- **Metodoloji şeffaflığı güçlü ✓** — SOTP %85, Peer %10, DDM %5, DCF %0 ağırlıkları ve gerekçeleri net. GCM anchor kullanımı açıklandı.
- **TUPRS +3.73% → NAV güncellemesi hesaplandı ✓** — "+~5 TL NAV katkısı" hesabı mevcut.
- **Fitch düzeltmesi -8 TL NAV** — Formül gösterilmedi. "Makro risk primi artışı → -2% NAV" denildi; hangi riskten hangi NAV azalmasına giden zincir açıklanmadı.
- **Holding iskontosu driver analizi başladı ✓ ama tamamlanmadı** — "6 driver ile quantify edildi" denildi; KCHOL-SAHOL farkı anlamlı. Ama neden 6 driver ve toplamda kaç pp premium oluşturduğu gösterilmedi.
- **Revenue yanlış baz (Q4 vs FY) valuation'a yansımadı** — FAVÖK marjı %22.6 (hatalı, Q4 bazlı) valuation'da peer çarpanları hesabında kullanıldı mı? SOTP NAV metodolojisi EBITDA çarpanına dayanıyor; hatalı marj peer seçimini etkiliyor.

### Bundan Sonra:
- **SOTP bileşen tablosunu önce özet, sonra detay formatında gönder** — "Tüm 6 subsidiary katkı tablosu" tek mesajda sığmıyorsa: özetle tablo (subsidiary + katkı TL + ağırlık) → ardından her subsidiary'nin detaylı metodolojisi. Tablo yarıda kalmasın.
- **Fitch düzeltmesi formülünü göster** — "BB-/Stable → CRP +25bps → WACC +15bps → discount factor +0.15% → SOTP NAV × 0.9815 = -8 TL" gibi açık zincir. "Makro risk" yeterli değil.
- **KCHOL holding discount driver matrisi standardize** — 6 driver: ROE/Ke makas, çapraz sahiplik karmaşıklığı, ARCLK zararı, IFRS 8 şeffaflık eksikliği, governance, likidite prim. Her driver için +/- pp quantification. SAHOL matrisiyle karşılaştır.

## Bilinen Hatalar (Bir Daha Yapma)

- KCHOL (önceki hatalar DÜZELTILDI 14 Nis): Artık GCM NAV anchor olarak kullanılıyor. Holding discount 6 driver ile quantify edildi. DCF açıkça %0 ağırlık alarak devre dışı bırakıldı (bankacılık FCF sorunu). SOTP %80 ağırlık ile ana metot.
- TUPRS: Exit code 143 crash — yuk bolunmedi. DCF baz (133-176 TL) vs agirlikli hedef (219 TL) farki aciklanmadi. Peer EV/EBITDA kaynaklari gosterilmedi. WACC bilesenleri gizli kaldi.
- EREGL: Valuation ciktisi downstream'e ulasmadi (DEGRADED). Hatali EBITDA (34B) ile hesap yapilmis olabilir. EV/ton kapasite metrigi kullanilmadi.

## Son 3 Raporun Ogrenimleri

- **EREGL (2026-04-13):** Yuksek faiz rejiminde TL DCF piyasanin belirgin altinda kalir — low confidence etiketiyle sun. Dongusal sanayide dip net karda F/K bozulur, omurga EV/FAVOK+PD/DD olmali. CAPEX rehberi (22-28B TRY/yil) DCF'te oncelikli. Ermaden opsiyonelligi excluded value olarak not et.
- **TUPRS (2026-04-12):** Rafineri marji $/bbl birincil FCF degiskeni (1 $/bbl = ~5-6B TRY EBITDA). Hisse adedi: Toplam Temettu / Brut HBT = Hisse Adedi. Blended agirliklar emtia icin: EV/EBITDA %40 + DCF %35 + yield %15 + PE %10.
- **KCHOL (2026-04-14):** Bankacılık konsolidasyonu (YKB) nedeniyle FCF -204B TL negatif → DCF tamamen geçersiz; SOTP %100 ağırlık zorunlu. GCM SOTP'u (406 TL) analist hedef fiyatı baz alır; piyasa fiyatı baz alındığında NAV ~370 TL → blended ~388 TL. Holding discount driver analizi zorunlu: ROE/Ke makas (3.5% vs 46%) en büyük driver (+8pp), ardından çapraz sahiplik karmaşıklığı (+5pp). SAHOL peer karşılaştırması için referans (KCHOL-SAHOL discount farkı ~20pp = ROE makas farkını yansıtır). Bağlı ortaklık hisse sayıları KAP'tan doğrulanmazsa SOTP güven MEDIUM'a kilitlenir.

## Sektor Bilgi Bankasi

**BIST degerleme (Nisan 2026):** P/E ~8-10x (tarihsel ortalama alti). Piyasa cap/GDP orta duzey.
**KPI:** TUPRS Bear 110 / Baz 220 / Bull 325 TL (Mevcut 254.50, MEDIUM). EREGL: DEGRADED.
**THYAO (2026-04-13):** Bear 220 / Baz 550 / Bull 1,000 TRY (Mevcut 316.75, MEDIUM).
  EV/EBITDAR current 2.61x (peer median 4.1x = -36% iskonto). P/E 1.95x (tarihsel 6-8x).
**KCHOL (2026-04-14 Delta):** Bear 170 / Baz 252 / Bull 338 TL (Mevcut 204, MEDIUM).
  GCM NAV 406.07 TL; bu rapor blended NAV ~388 TL; mevcut iskonto %47-50 (tarihi üst bant).
  P/NAV 0.50x vs peer medyan 0.62x vs SAHOL ~0.72x. SOTP %80 + Karsilastirmali %15 + DDM %5 + DCF %0.
**SAHOL (2026-04-14):** Bear 108 / Baz 131 / Bull 155 TL (Mevcut 89.30, MEDIUM).
  Gross NAV 342.4B TL; Parent net debt 18.6B; Net NAV 323.8B = 154.2 TL/hisse (iskonto oncesi).
  Holding iskontosu %44 (P/BV 0.56x). AKBNK alone = 95.1 TL/hisse > mevcut fiyat (yapısal anomali).
  EV/EBITDA 4.41x vs tarihsel 5.5-6.5x = %20-32 iskonto. SOTP %80 + EV/EBITDA %15 + DCF %5 + DDM %0.
  Holding discount drivers (7): ROE/Ke makas +12pp, bankacılık karmaşıklığı +8pp, CARFA/KORDS zarar +7pp,
    yönetim değişimi +5pp, IAS29 karmaşıklığı +4pp, likidite +3pp, kataliz yokluğu +5pp = ~44pp.
  KCHOL-SAHOL discount farkı ~20pp = ROE makas farkı (KCHOL ~12% vs SAHOL ~0.6% raporlanan).
  Katalizörler: Enerjisa IPO (+5-10 TL), Akçansa satış Q2 2026 ($436.9M), TCMB faiz indirimi Akbank NIM.
  Sensitivity: Holding discount × AKBNK fiyat matris — AKBNK 115 TL + %10 discount = 178 TL bull upside.

## Son 3 Raporun Ogrenimleri

- **EREGL (2026-04-13):** Yuksek faiz rejiminde TL DCF piyasanin belirgin altinda kalir — low confidence etiketiyle sun. Dongusal sanayide dip net karda F/K bozulur, omurga EV/FAVOK+PD/DD olmali. CAPEX rehberi (22-28B TRY/yil) DCF'te oncelikli. Ermaden opsiyonelligi excluded value olarak not et.
- **TUPRS (2026-04-12):** Rafineri marji $/bbl birincil FCF degiskeni (1 $/bbl = ~5-6B TRY EBITDA). Hisse adedi: Toplam Temettu / Brut HBT = Hisse Adedi. Blended agirliklar emtia icin: EV/EBITDA %40 + DCF %35 + yield %15 + PE %10.
- **THYAO (2026-04-14 Round 2):** USD bazli WACC %13.2 (Ke %15.95: rf 4.3%+CRP 4.0%+beta 1.3×ERP 5.5%; Kd net-of-tax 5.85%). Baz DCF implied ~780-820 TRY; blended (EV/EBITDAR %40 + DCF %35 + P/E norm %15 + DDM %5) → 550 TRY (%13 Türkiye/TVF iskontosu sonrasi). Peer grubu (7 sirket): Ryanair 5.8x / Wizz 4.4x / IAG 4.2x / Lufthansa 3.6x / AF-KLM 3.2x / DAL 5.1x / Pegasus 4.8x → medyan 4.4x; THYAO 2.52x = -%43 iskonto. Sensitivity matrix: WACC %10-22% × terminal g %1.0-3.5% grid tamamlandi; baz bölgesi WACC %13-15 + g %2-2.5% → 550-820 TRY. Piyasa 316 TRY = WACC ~%20-22 + g %1 implying = extreme bear. DDM agirlik %5 max (2025 temettü sifir, kesintili gecmis). SOTP uygulanmadi (operating company). CF tablosu eksik — FCF tahmin bazli (guven 0.35), bu DCF'e uncertainty ekliyor.
- **SAHOL (2026-04-14):** SOTP Baz NAV 265.96B TRY; Akbank 199.76B (%75). Baz hedef 104 TL (%18 iskonto), Bull 137 TL (%10), Bear 77 TL (%28). Holding discount 2026 için %25-45 aralığı (mevcut %44 — tarihsel yüksek). Akçansa satış (+19.5B) Parça 3'te binding offer floor kullanıldı (HIGH confidence). DCF dışlandı (bankacılık konsolidasyonu FCF'i geçersiz kılıyor). DDM %5 ağırlık.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **Parça 2 tablosu truncated** — "CBAM" ile kesildi; Akçansa ve Brisa açıklamaları tamamlanmadı.
- **Parça 3 (unlisted iştiraklerin değerlemesi) görünmüyor** — Kordsa, Temsa, Olmuksan, Teknosa, AvivaSA değerlemesi eksik.
- **Holding discount tarihsel analizi yapılmadı** — "Mevcut %44, peer %30" denildi ama SAHOL'un kendi tarihsel iskontosu (5 yıl) gösterilmedi.
- **Kataliz bazlı senaryo analizi eksik** — Bull/Bear/Base senaryolarında Akçansa kapanışı +X TL, Enerjisa IPO +Y TL gibi kataliz katkıları ayrıştırılmadı.

### Bundan Sonra:
- **Holding SOTP 3 tam parça:** Listed iştiraklerin piyasa değeri + Unlisted iştiraklerin EV/EBITDA değeri + Net Borç/Nakit = 3 parça hepsi tam tablo olarak verilecek.
- **Holding discount tarihsel bant ZORUNLU:** 5 yıllık SAHOL P/BV discount bandı (min/maks/ortalama) SOTP tablosunun yanında gösterilecek.
- **Senaryo = kataliz tabanlı:** Her Bull/Bear/Base senaryosu için hangi katalizlerin ne kadar katkı yaptığı ayrı satırda listelenecek.

---
