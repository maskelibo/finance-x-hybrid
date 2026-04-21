# ESG Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **Sektor baglami zorunlu:** E puani sektore gore kalibre edilmeli. Mutlak emisyon degil, yonetim kalitesi ve taahhut ciddiyeti degerlendir.
- **Veri yoksa tahmin yapma:** "Veri mevcut degil" yaz; uydurma YASAK.
- **Greenwashing uyarisi flag'le:** Taahhut/kapasite orantisizliklarini W-xxx formatinda kaydet.
- **Kaynak goster:** CDP, BIST uyeligi icin URL/kaynak adi.
- **G agirligi %40:** YK bagimsizligi ve iliskili taraf derinlemesine analiz.
- **TSRS uyumu sor:** FY2024+ BIST sirketleri icin TSRS/TFRS-S1/S2 uyum durumu — KAP'ta aranmali. Pre-flight check'e ekle.
- **ETS riski dahil et:** Rafineri, enerji, cimento, celik sirketleri icin ETS maliyet etkisi hesapla.
- **CDP once ara:** "Bulunamadi" demeden cdp.net'ten sirket kaydini kontrol et. CDP public database'den Scope 1/2/3 cek.
- **ESG skor verdiginde puan metodunu ve agirliklarini kisa tabloyla acikla.**
- **Her ana ESG riskini nakit akisi, CAPEX veya regulasyon etkisine bagla.**
- **Endeks uyeligi ve dis rating'lerde en resmi kaynagi kullan.**
- **Sosyal/yonetisim metriklerinde trend ve sektor benchmark'ini birlikte ver.**
- **Celik sirketlerinde tCO2/ton crude steel yogunlugu mutlaka aranmali.** CBAM etkisi bu metrik olmadan eksik kalir.
- **CBAM ve ESG baglantisi sayisal kurulmali:** Scope 1 -> CBAM default vs dogrulanmis karsilastirmasi -> yillik tasarruf.

## Zorunlu Kontrol Listesi

**Her raporda zorunlu:**
1. CDP kaydi + skor (cdp.net'ten ara)
2. BIST Surdurulebilirlik Endeksi uyeligi teyidi
3. TSRS uyum beyani (KAP'ta TFRS-S1/S2)
4. YK bagimsizlik orani (SPK %33 min, best practice %50+)
5. CEO dualitesi kontrolu
6. Iliskili taraf konsantrasyonu
7. E/S/G puan metodolojisi ve agirliklari tablosu

**Celik sektoru ek zorunlu:**
1. CDP kaydi + Scope 1 tCO2/ton celik (CBAM baglantisi)
2. Turkiye ETS kapsam durumu + tahmini maliyet yuku
3. LTIR (faaliyet raporu HSE bolumu)
4. EAF donusum plani + karbon hedefleri
5. OYAK sahipliginin yonetisim etkisi (iliskili taraf + azinlik haklari)

**Rafineri sektoru ek zorunlu:**
1. CDP public database'den Scope 1/2/3
2. Faaliyet raporu HSE bolumunden LTIR/TRIR
3. SAF/yesil yatirim TL ve $ karsiligi (yuzde degil, somut rakam)
4. YK bagimsizlik -> MSCI ESG etkisi (~%15-20 agirlik)
5. ETS maliyet riski

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **CDP kaydı aranmadı** — Zorunlu 1. madde; cdp.net'ten EREGL/Erdemir kaydı kontrol edilmedi. "CDP kayıt yok" veya "CDP public score bulunamadı" şeklinde teyit edilmedi.
- **BIST Sürdürülebilirlik Endeksi üyeliği teyidi** — BIST'te EREGL'in BIST Sürdürülebilirlik Endeksi'nde olup olmadığı resmi kaynak ile doğrulanmadı.
- **TSRS uyum beyanı (TFRS-S1/S2) kontrol edilmedi** — FY2024+ zorunlu TSRS kontrolü; KAP'ta bu kapsam aranmadı.
- **Türkiye ETS kapsam durumu ve tahmini maliyet yükü hesaplanmadı** — Çelik sektörü zorunlu 2. madde. Türkiye ETS pilot kapsamında çelik var mı/yok mu? ETS maliyeti = Scope 1 emisyon × karbonun TRY karşılığı formülü eksik.
- **CBAM sayısal hesabı tamamlanamadı** — AB ihracat payı eksik olduğundan hesap yapılamadı; ancak sektör proxy (%15-20 Türk çelik ihracatı AB'ye) ile üst sınır tahmini yapılabilirdi.
- **OYAK sahipliğinin yönetişim etkisi eksik** — OYAK %81.49 dominant hissedar; bağımsız YK oranı %33.3 (kural minimum) üzerinde değil; ilişkili taraf işlem yoğunluğu ve azınlık hakları koruması analizi eksik. Çelik sektörü zorunlu 5. madde.
- **Yenilenebilir enerji % "[VERİ YOK]"** — Erdemir Enerji A.Ş. kurulumu biliniyor; somut enerji karışımı oranı KAP veya faaliyet raporundan çekilemedi.
- **LTIR (Lost Time Injury Rate) verildi mi belirsiz** — Zorunlu 3. madde; çıktıda faaliyet raporu HSE bölümünden sayısal LTIR görünmüyor.

### Bundan Sonra:
- **CDP araması zorunlu ilk adım** — cdp.net'te "Erdemir" veya "Ereğli" ara; bulamazsan "CDP kayıt tespit edilemedi [conf: MEDIUM — basın açıklaması/KAP aranabilir]" yaz.
- **ETS hesabı çelik için zorunlu** — Scope 1 (2.2 tCO2/ton × üretim miktarı) × karbonun fiyatı (Türkiye pilot ETS veya EU ETS proxy) = yıllık maliyet yükü TRY. Pilot ETS yoksa EU ETS benzer hesabı "[sektör proxy, conf: LOW]" etiketle.
- **CBAM proxy hesabı** — AB ihracat payı kesin bilinmiyorsa "%15-20 Türk çelik ihracatı" proxy ile CBAM üst sınır maliyet = Scope 1 × ihracat payı × CBAM ücreti €/ton. Low confidence etiketle ama ver.
- **OYAK ilişkili taraf analizi derinlemesine** — YK bağımsızlık oranı (%33.3), OYAK-EREGL enerji/hammadde ilişkili taraf işlem tutarları ve arm's length metodolojisi. G puanı bu analize göre kalibre et.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **CDP araması yapılmadı (KCHOL konsolide)** — Zorunlu 1. madde. cdp.net'ten "Koç Holding" araması; iştiraklerin (TUPRS, EREGL) ayrı CDP kayıtları da kontrol edilmedi. Holdinglerde her iştirak ayrı CDP kaydına sahip olabilir.
- **Scope 1/2/3 verileri [VERİ YOK]** — KCHOL faaliyet raporu veya sürdürülebilirlik raporu (koc.com.tr/surdurulebilirlik) Scope emisyon verisi içeriyor; bu kaynak denenmedi.
- **BIST Sürdürülebilirlik Endeksi üyeliği teyid edilmedi** — KCHOL BIST50 endeksinde; sürdürülebilirlik endeksi üyeliği olma ihtimali yüksek. Kontrol edilmedi.
- **TSRS uyum beyanı (TFRS-S1/S2) KAP'ta aranmadı** — FY2024+ zorunlu kontrol; KCHOL ölçeğinde bu beyan KAP'ta olmalı.
- **EREGL CBAM hesabı kesildi** — ESG çıktısı "Her 2M ton/yıl çelik üretimi → Scope 1 ~4M tCO2" hesabı cümle ortasında kesildi. Tamamlanmadı.
- **TUPRS ETS maliyet riski hesabı yarım** — Rafineri Scope 1 (~2.2 tCO2/ton ürün) belirtildi ✓; ancak ETS pilot kapsam ve yıllık maliyet yükü TRY olarak hesaplanmadı.

### Bundan Sonra:
- **Holding ESG = konglomera frameworkü** — Her ana iştirak için ayrı ESG profil satırı: [İştirak | Sektör | Scope 1 (tCO2/ton) | CBAM/ETS Riski | CDP Kaydı | Ana ESG Risk]. Bu tablo olmadan KCHOL ESG analizi eksik.
- **koc.com.tr/surdurulebilirlik zorunlu kaynak** — Koç Holding 2026 yılında 100. yılını kutluyor; sürdürülebilirlik raporu kapsamlı. Her KCHOL analizinde WebFetch ile bu sayfadan emisyon/enerji/su verileri çekilecek.
- **EREGL CBAM hesabı tamamlanacak** — Üretim: ~8.3M ton/yıl → Scope 1 ~16.6M tCO2 → AB ihracat payı %15-20 proxy → CBAM yükümlülük tahmini. Low confidence etiketiyle bile tamamla, kesilmiş bırakma.

---

*Vaka bazli dersler: case_lessons.md | Domain bilgisi: knowledge.md*
