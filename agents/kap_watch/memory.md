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

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **KAP ID'lerin çoğu "pending verification"** — Kar payı dağıtım kararı (7 Nisan 2026), hisse geri alım bildirimi, CEO değişikliği dışında gerçek KAP numaraları doğrulanmadı. "Pending" ile output gönderme kuralı ihlal edildi.
- **CEO değişikliği KAP ID 1451483 teyit edildi ✓** — Tek tam doğrulanan bildirim bu oldu. Standart bu olmalı.
- **FILE kısmi bölünmesi (30 Haziran 2025) KAP bildirimi aranmadı** — Bu önemli bir kurumsal olay; KAP'ta EGM kararı + SPK onayı bildirimi mutlaka olmalı; ID tespit edilmedi.
- **Sermaye artırımı (19 Şubat 2026) tam KAP ID eksik** — Bu bildirim perakendecilerde önemli; hisse başına düşen değer değişimi için KAP'tan doğrulanmalı.

### Bundan Sonra:
- **BIMAS perakende için zorunlu KAP tarama kategorileri:**
  1. Mağaza açılım/kapanım bildirimleri (net mağaza sayısı teyidi için)
  2. Temettü bildirimleri (3 taksit takvimi ile birlikte)
  3. Yönetim/CEO değişikliği (interim → kalıcı atama bekleniyor — KAP'ta takip et)
  4. FILE bağlı ortaklık bildirimleri (EGM kararları, sermaye yapısı)
  5. Share buyback program bildirimleri (başlangıç, ilerleme, sonuç)
- **"Pending" yerine "bulunamadı — haber kaynağı kullanıldı [conf: LOW]" formatı** — THYAO dersinden öğrenilmişti; BIMAS'ta da uygulanmalıydı.
- **BIMAS bilinen KAP referansları:** CEO değişikliği: 1451483 | Temettü 2025: 7 Nisan 2026 kararı [ID doğrula] | Sermaye artırımı: 19 Şubat 2026 [ID doğrula] | Geri alım sonucu: ~19 Aralık 2025 [ID doğrula].

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **10-14 Nisan delta penceresi için sıfır resmi KAP bildirimi** — CEO mandatında "sıfır tolerans" direktifi verilmişti. Sonuç: 4 subsidiary için de "[BULUNAMADI]" KAP ID'si. Secondary sources (haber siteleri) kullanıldı; bu kural ihlali.
- **Subsidiary KAP cross-check yapılmadı** — TUPRS, EREGL, ARCLK, FROTO 10-14 Nisan KAP bildirimleri aranmadı. CEO mandatında bunlar P1 görevi olarak verilmişti.
- **TUPRS temettü miktarı çelişkisi çözülmedi** — "14.56 TL veya 10.38 TL (bazı kaynaklara göre)" denildi; KAP'tan doğrulanmadan ikisi birden bırakıldı. Kural: discrepancy çöz, tek doğru değeri ver.
- **KAP ID 1059056 yanlış eşleşme flaglenmedi** — "TUPRS dividend için KAP ID 1059056 bulundu ama 2022 birleşmesine işaret ediyor" denildi; bu anomali CEO'ya eskalasyon gerektirirdi.
- **Impact quantification eksik** — Dividend bildirimi (KAP ID bulunamadı) için TRY impact, % equity, % EBITDA hesabı yapılmadı.
- **Forward event takvimi zayıf** — 17 Nisan TUPRS KAP, 22 Nisan TCMB PPK, 29 Nisan YKBNK Q1 sonuçları bazı yerlerde geçiyor; ama takvim formatında, tarih ve kaynak ile ayrı bölümde sunulmadı.

### Bundan Sonra:
- **kap.org.tr doğrudan arama API kullan** — kap.org.tr/tr/Bildirim/Ara endpoint'i veya kap.org.tr/tr/sirket/[KCHOL]/bildirimler yolu ile tarih filtreli arama. Haber sitesi aramasına güvenme.
- **TUPRS gibi büyük subsidiary için özel tarama** — kap.org.tr/tr/sirket/TUPRS/bildirimler?baslangicTarihi=2026-04-10&bitisTarihi=2026-04-14 formatında direkt URL dene.
- **Çelişkili tutar için KAP metnini oku** — Temettü tutarı 14.56 TL vs 10.38 TL; KAP bildirim metninde kesin değer yazıyor. Metni WebFetch ile oku; tahmin etme.
- **Delta penceresi bildirimi bulunamazsa "sessizlik de bulgudur" yaz** — "10-14 Nisan arasında KCHOL/TUPRS/EREGL/FROTO/ARCLK için KAP'ta materyel ozel durum açıklaması tespit edilmedi" formatında resmi tespiti kaydet.

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

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Birçok disclosure ID "PENDING KAP VERIFICATION"** — Gerçek KAP numarası olmadan disclosure geçerli sayılmaz. Mart 2026 ve Şubat 2026 trafik raporları için KAP ID bulunamadı; haber sitesi kaynaklarıyla geçiştirildi.
- **2025 Q1/Q2/Q3/FY raporları "[PENDING]"** — Bu raporlar KAP'ta mevcut (investor.turkishairlines.com ve KAP'ta yayımlandı); "PENDING" etiketi yanlış. KAP ID bulunmalıydı.
- **Impact quantification eksik** — Trafik sonuçları ve finansal raporlar için TRY etki, % equity, % EBITDA, % market cap hesabı yapılmadı.
- **Forward event takvimi eksik** — 22 Nisan 2026 TCMB PPK, Mayıs 2026 Q1 sonuçları, 2026 AGM tarihi — bunlar forward takvimde yer almalıydı.
- **CEO/Chairman değişikliği için KAP bildirimi aranmadı** — April 10 değişikliği için KAP özel durum açıklaması olup olmadığı kontrol edilmedi; "sessizlik de bir bulgudur" kuralı uygulanmadı.

### Bundan Sonra:
- **"PENDING KAP VERIFICATION" kabul edilemez** — Ya gerçek KAP ID bul ya da "bulunamadı — haber kaynağı kullanıldı [conf: LOW]" olarak etiketle. PENDING ile output gönderme.
- **Yönetim değişikliği sonrası KAP özel durum açıklaması zorunlu ara** — CEO/Chairman değişikliği 24 saat içinde KAP'a bildirilmesi gerekir (SPK mevzuatı). Bildirim varsa ID çek; yoksa "SPK mevzuatı gereği bildirim bekleniyor — sessizlik riski" yaz.
- **Havacılık için aylık trafik KPI'ları periyodik bildirim** — Yolcu sayısı, doluluk oranı, kargo verisi aylık KAP bildirimi; her ay için ID + URL zorunlu.

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

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **Birçok KAP ID "Gerçek KAP ID bulunamadı" olarak işaretlendi** — SAHOL temettü, KORDS no-dividend, CARFA AGM bildirimleri için gerçek KAP ID eksik.
- **Haber siteleri KAP ID yerine kaynak olarak kullanıldı** — finansopia.com, bigpara.hurriyet.com, infoyatirim.com birincil kaynak gibi sunuldu; bunlar doğrulama kaynağı olabilir, asıl kaynak olamaz.
- **Akçansa satış bildirimi için doğrudan KAP linki bulunamadı** — En material olay (HIGH) için ID eksik; "haber kaynakları" gerekçesi yeterli değil.

### Bundan Sonra:
- **KAP ID bulunamazsa bildirim "UNVERIFIED" etiketiyle işaretlenecek:** "KAP ID bulunamadı" yazılmayacak. Bunun yerine: [UNVERIFIED — haber kaynağından görüldü, KAP'ta teyit edilemedi]. Bu ayrım downstream güvenilirliği için kritik.
- **WebFetch ile KAP doğrulama zorunlu:** kap.org.tr/tr/sirket-bildirimleri/{şirket-kodu} sayfasına WebFetch ile giderek bildirimi bul ve gerçek ID'yi çek. Haber sitesinden ID kopyalama YASAK.
- **Aksansa gibi HIGH materiality olaylar için ID bulunana kadar devam et:** 3 deneme kuralı: (1) KAP arama, (2) SAHOL IR sayfası, (3) resmi bültene WebFetch. Hepsi başarısız → CEO'ya escalate.

---
