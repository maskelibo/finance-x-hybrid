# Context Extraction Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **"Not Disclosed" demeden 5 adim:** (1) Company sources (annual report, IR, earnings calls), (2) Industry reports, (3) Competitor disclosures, (4) Academic/research, (5) News/analysis. 5 adimin hepsinde bulamazsan "not disclosed" de.
- **Tabloyu TAMAMLA:** Yarim tablo output'ta YASAK.
- **Business model = gelir yapisi + musteri segmentleri + dagitim kanallari + operasyonel model** — hepsini detaylandir.
- **Competitive advantages (moat) bolumu ZORUNLU:** "Neden bu sirket sektorde one cikiyor?"
- **Governance metrics sayisal:** Board size, independent director %, committee composition, meeting frequency — vague ifadeler ("early adopter") YASAK.
- **Her iddiay etiketle:** `confirmed`, `management statement`, `inference` — teyitli bilgi ile cikarim ayrismali.
- **Output truncation cozumu:** Core + appendix olarak ikiye bol, ikisini de gonder.
- **IAS 29 flags downstream iletilmeli:** Hyperenflasyon muhasebesi uyarisi her zaman ver.
- **Net FX pozisyonu sayisal:** "FX riski var" yetmez, net USD/EUR pozisyonunu somut sayiyla ver.
- **Iliskili taraf islemlerinde transfer fiyatlama metodolojisi ZORUNLU:** Arm's length beyani yetmez — CUP, resale price, cost-plus hangisi kullanildigi belirtilmeli.
- **Istirak bazli EBITDA katkisi tablosu her raporda ZORUNLU.**
- **Emtia ureticilerinde dogrudan fiyat-maliyet gecirgenligini sayisal ver:** "1 $/ton degisim → yaklasik X milyon TRY etki" formati.
- **Celiskili metriklerde authoritative baglam setini ayrica kilitle.**
- **Context extraction'da ilk is dogrulanmis baglamsal riskleri ve yonetim cikarimini one yaz.**

## Zorunlu Kontrol Listesi

Her sirket icin cikarilacak:
- [ ] Is modeli (segment yapisi + finansal performans entegrasyonu)
- [ ] Competitive moat analizi
- [ ] Ownership structure (kesin %'ler, KAP'tan dogrulanmis)
- [ ] Management team (CEO, CFO, Chairman — biyografi ozeti)
- [ ] Stratejik inisiyatifler (timeline + CAPEX commitment)
- [ ] Risk analizi (FX, commodity, regulatory, geopolitik)
- [ ] IAS 29 impact notu (Turk sirketleri)
- [ ] Net FX pozisyonu (sayisal)
- [ ] Seasonality detection (Q1-Q4 revenue breakdown, index)
- [ ] ESG profili (karbon hedefleri, sustainability)
- [ ] Iliskili taraf islemleri (transfer fiyatlama dahil)

Sektor ek cikarimlar:
- **Holding:** SOTP NAV hesabi, holding discount (10-40% Turk holdingleri), segment performans, portfolio rebalancing vs distress sale ayrimi, bagli ortaklik ownership %
- **Telekom:** 3 katmanli analiz (Core Telecom + Digital Services + International), 5G strategy deep dive, spectrum moat, churn/ARPU/MNP, subsidiary analizi
- **Rafineri:** Rafineri marji mekanizmasi, white product yield, dogal hedge tespiti (fiyat endekslemesi), ham petrol diversifikasyon, SAF/enerji gecisi
- **Celik/emtia:** AB Safeguard + CBAM takvimi, HRC fiyat-gelir korelasyonu, demir cevheri/kok komuru-COGS gecirgenlik, EPDK enerji tarife etkisi, maden istarakleri degeri
- **Banka:** Dijital donusum metrikleri, NII vs fee income dagilimi, branch vs digital mix

## Bilinen Hatalar (Bir Daha Yapma)

- AKBNK business model yuzeysel — gelir dagilimi, musteri segmentleri detay eksik
- KCHOL ownership %'leri "estimate" kaldi — KAP'tan dogrulanabilirdi
- KCHOL segment finansal performansla entegrasyon eksik — hangi segment karli/zararli?
- TCELL business model truncated, 5G strategy yuzeysel (ilk denemede)
- TUPRS Opet iliskili taraf riski yuzeysel — transfer fiyatlama metodolojisi eksik
- EREGL AB Safeguard/CBAM sayisal etki hesaplanmadi, EPDK tarife soku flaglenmedi, emtia fiyat-maliyet mekanizmasi sayisallanmadi

- **CBAM 2026 EREGL double-impact:** AB safeguard (celik ithalat kotasi) 2026'da sona eriyor (daha fazla ithalat rekabeti). Ayni anda CBAM sertifika yukumlulugu basliyor. EREGL analizinde her ikisini birden flag'le: "Safeguard bitti + CBAM aktif = 2026 double squeeze".
- **THYAO 2025 gercek benchmark:** Hasilat 955.5B TRY (+%28), Net kar 118.2B TRY, EBITDAR marji %23.2, FCF $2.8B (+%45 YoY), CASK US¢8.55, RASK US¢7.21. Gelecek THYAO analizlerinde bu referans rakamlari kullan.
- **Holding discount guncel (Nisan 2026):** KCHOL hedef 298.62 TL vs islem 202.50 TL (~%32 iskonto). SAHOL P/BV 0.56 (~%44 iskonto). Turkiye holding iskonto araligini guncelle: %25-45 (eskiden %10-40).

## CEO Geri Bildirimi — 2026-04-17 — ASELS Raporu

### Eksikler:
- **TSKGV sahiplik oranı KAP'tan doğrulanmadı** — "~%84-85 [src: inference]" olarak verildi. TSKGV ASELS'in dominant hissedarı; kesin oran KAP ortaklık bildirimi veya şirket tescil belgelerinden doğrulanmalıydı. "Inference" kabul edilemez.
- **Net FX pozisyonu sayısal hesaplanmadı** — ASELS gelirinin önemli kısmı USD/EUR cinsinden (ihracat, dövizli sözleşmeler); maliyet TRY ağırlıklı. Net USD pozisyonu = USD gelir − USD maliyet = doğal hedge var mı? Bu hesap yapılmadı.
- **Yönetim rehberliği (guidance) eksik** — FY2026 sipariş hedefleri, ihracat hedefi, AR-GE harcama bütçesi context'e eklenmedi.
- **Transfer fiyatlama metodolojisi belirtilmedi** — TSKGV ve SSB (Savunma Sanayii Başkanlığı) ile sözleşmelerde hangi fiyatlama yöntemi kullanıldığı (maliyet+, münhasır ihale, uzlaşılmış fiyat) belirtilmedi.
- **Jeopolitik bağlam eksik** — ASELS değerlemesinin %90'ı jeopolitiktir: Iran-ABD gerilimi, Rusya-Ukrayna savaşı, NATO bütçeleri, Türkiye SSB bütçesi artışı — bunların sipariş defterine transmisyon mekanizması analiz edilmedi.
- **Sipariş defteri (backlog) ve sözleşme visibilitesi eksik** — Backlog/Revenue oranı savunma şirketlerinin temel komfort metriği; context'te yoktu.

### Bundan Sonra:
- **Savunma şirketi için jeopolitik bağlam bölümü ZORUNLU** — Iran-ABD, Rusya-Ukrayna, NATO bütçe taahhütleri, Türkiye SSB bütçesi → savunma sipariş defteri transmisyon mekanizması zorunlu bölüm.
- **TSKGV ve SSB ilişkisi için transfer fiyatlama metodolojisi** — KAP "İlişkili Taraf" dipnotundan metodoloji çek; "Arm's length beyanı" yetmez.
- **Savunma sektörü ek extraction listesi:** (1) Backlog tutarı ve kapsama süresi, (2) İhracat/iç satış oranı (%), (3) AR-GE harcaması/ciro %, (4) SSB/TSKGV sözleşme duyuruları özeti.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Deep Dive (thyao-deep-20260417)

### Eksikler:
- **Çıktı truncated** — Coğrafi maruz kalma bölümü "Teknik/MRO/Catering" ile kesildi. Brand identity ve şirket profili iyi başladı; sonrası yok. Truncation YASAK kuralı ihlali.
- **CEO Ahmet Olmüster profili yok — 5. THYAO direktifi, artık tolerans sıfır** — 9 Nisan 2026 CEO değişikliği; 4-madde profil (geçmiş, önceki pozisyon, strateji farkı, piyasa reaksiyonu) 5 THYAO analizinde de üretilmedi. Bu çıktı eksikliği "Yönetim Kalitesi" skor kartı boyutunu tamamen kör bırakıyor.
- **Net FX pozisyonu sayısallaştırılmadı — 5. THYAO** — USD hard gelir − USD yakıt − USD IFRS 16 kira − USD borç servisi = Net USD pozisyon formülü uygulanmadı.
- **İran krizi rota kaybı sayısallaştırılmadı — 5. THYAO** — Kaç rota, kaç sefer/hafta, tahmini gelir kaybı TRY hesabı üretilmedi.
- **Mevsimsellik analizi yok — 3. direktif** — Q1 düşük / Q3 zirve sezon dağılımı, Ramazan/Kurban bayramı etkileri eksik.
- **KAP Şirket Genel Bilgi Formu okunmadı** — TVF ortaklık oranı (~%49.12) tahmini olarak kalmaya devam ediyor.

### Bundan Sonra:
- **CEO/YK değişiminde 4-madde profil = hard bloker (5. direktif, tolerans sıfır)** — Bu profil olmadan context_extraction çıktısı tamamlanmış sayılmaz, downstream'e gönderilmez.
- **THYAO havacılık bağlamı zorunlu 5 madde Round 1'den:** (1) CEO profili, (2) Net FX sayısal, (3) Q1-Q4 mevsimsellik, (4) İran rota kaybı sayısal, (5) Taahhüt takip tablosu. Herhangi biri eksikse çıktı PENDING_CONTEXT.
- **Truncation → Core + Appendix** — Çıktı büyükse iki parça halinde gönder; yarım bırakma.

## CEO Geri Bildirimi — 2026-04-17 — THYAO Raporu

### Eksikler:
- **CEO Ahmet Olmüster profili yok — 5. THYAO direktifi, tolerans tamamen tükendi** — 9 Nisan 2026 CEO değişikliği; 4-madde profil 5 THYAO analizinde de üretilmedi. "Yönetim Kalitesi" skor kartı boyutu 5 analizdir kör.
- **Yabancı yatırımcı oranı hâlâ [VERİ YOK]** — TVF oranı bu turda kaynaklanmış görünüyor; ancak yabancı yatırımcı yüzdesi teyit edilemedi.
- **Net FX pozisyonu sayısallaştırılmadı — 5. THYAO** — USD hard gelir − USD yakıt − USD IFRS16 kira − USD borç servisi = Net USD pozisyon formülü 5 analizdir uygulanmadı.
- **İran krizi rota kaybı sayısallaştırılmadı — 5. THYAO** — Kaç rota, kaç sefer/hafta, tahmini TRY gelir kaybı formülü üretilmedi.
- **Mevsimsellik analizi yok — 3. direktif** — Q1/Q3 sezon dağılımı, Ramazan/Kurban bayramı etkileri eksik.
- **Truncation** — Coğrafi maruz kalma bölümü tamamlanamadan kesildi; Core + Appendix formatı uygulanmadı.

### Bundan Sonra:
- **CEO/YK değişiminde 4-madde profil = hard bloker (5. direktif, tolerans sıfır)** — Bu profil olmadan context_extraction çıktısı tamamlanmış sayılmaz; downstream'e gönderilmez. KAP atama bildirimi + haber taraması + şirket profili = 3 kaynak.
- **THYAO havacılık bağlamı 5 madde zorunlu** — (1) CEO profili, (2) Net FX sayısal, (3) Mevsimsellik, (4) İran rota kaybı sayısal, (5) Taahhüt takip tablosu. Herhangi biri eksik → çıktı PENDING_CONTEXT.
- **Truncation → Core + Appendix** — Çıktı büyükse iki parça halinde gönder; yarım bırakma.

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
