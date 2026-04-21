# Analyst Consensus Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **Dogrulanmis broker verisi olmadan rakamsal konsensus uretme.** Gerekirse `insufficient verified analyst data` de.
- **Tahmini dagilim, medyan ve revision history yazma;** her analist girdisi icin kurum adi, rapor tarihi ve hedef fiyat linki ver.
- **Konsensus modulunde yalniz dogrulanmis snapshot kullan.**
- **SELL analistler ZORUNLU aciklanacak:** Kurumu + gerekce ozeti (min 3 bullet) + hedef fiyat + spesifik tarih. "SELL var" yazmak yetmez; neden SELL sorusunu cevapla. Azinlikta kalan SELL gorusu = asimetrik risk sinyali — her zaman vurgula.
- **Analist guncelleme tarihi spesifik:** "Q1 2026" degil "2026-02-15" gibi tam tarih. Kriz oncesi/sonrasi ayrimiiçin kritik.
- **Marj/varsayim sensitivity tablosu ZORUNLU:** Her analist icin marj varsayimi + implied EBITDA + hedef fiyat. Sektore gore: rafineri $/bbl, celik $/ton HRC.
- **Revizyon yonu trendi ZORUNLU:** Son 3 ayda her analist icin hedef fiyat revizyonu (yukari/asagi/degismedi) + buyukluk (%). Konsensus momentum pozitif mi negatif mi?
- **Konsensus guvenilirlik kriterleri:** Analist sayisi >=5 guvenilir, 2-4 sinirli coverage uyarisi. Hedef fiyat araligi SD/ort <%15 yuksek konsensus, >%30 belirsiz.
- **KURAL: Konsensus ciktisi yapildiysa downstream dogrulama:** Strategic_synthesis ve final_summary agents'in konsensus verilerini aldigini teyit et.
- **`estimated`, `inferred`, `likely` verileri gercek konsensus raporu gibi sunma; kaynak standardi zayifsa bunu acikca belirt.**

## Zorunlu Kontrol Listesi

- [ ] Tum analist verileri dogrulanmis kaynak mi? (kurum adi + tarih + link)
- [ ] SELL analistlerin gerekceleri (min 3 bullet) aciklandi mi?
- [ ] Marj/varsayim sensitivity tablosu eklendi mi?
- [ ] Revizyon yonu trendi (son 3 ay) analiz edildi mi?
- [ ] Konsensus guvenilirlik (analist sayisi + aralik genisligi) degerlendirmesi var mi?
- [ ] Downstream ajanlara veri iletimi teyit edildi mi?

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **Marj/varsayım sensitivity tablosu eksik** — Her analist için implied HRC fiyatı (USD/ton) + implied EBITDA marjı + kur varsayımı + hedef fiyat tablosu oluşturulmadı. Çelik sektörü: USD/ton HRC varsayımı kritik ayrışma noktası.
- **Revizyon yönü trendi (son 3 ay) eksik** — Ocak-Nisan 2026'da hangi kurumlar upgrade/downgrade yaptı? "Ziraat Yatırım +13.6% upgrade" verildi ✓ ama genel konsensüs momentum (yükselen mi alçalan mı?) hesaplanmadı.
- **"0 SELL" crowded long riski analiz edilmedi** — 6 BUY / 5 HOLD / 0 SELL; CBAM, EPDK enerji şoku ve Çin dumping baskısına karşın neden hiç SELL yok? Bu asimetrik risk sinyali raporlanmadı.
- **Hedef fiyat aralığı 15-39.50 TRY (σ/μ=%48) açıklanmadı** — "HIGH DISPERSION" flaglendi ✓ ama neden bu kadar geniş? En düşük hedef (15 TRY, BEAR senaryosu) ile en yüksek (39.50 TRY) arasındaki varsayım farkı analiz edilmedi.
- **Bazı broker tarihler "[ID doğrula]" olarak kaldı** — Tam tarih yerine "2026-04-XX" veya "Nisan 2026" gibi yaklaşık tarihler verildi; kural "tam tarih" zorunlu.

### Bundan Sonra:
- **Çelik analizlerinde marj sensitivity zorunlu formatı** — Her analist için: HRC varsayımı (USD/ton) + demir cevheri varsayımı (USD/ton) + enerji maliyeti varsayımı → implied EBITDA marjı → hedef fiyat. Bu tablo olmadan çelik konsensüs analizi eksik.
- **"0 SELL" durumunda crowded long analizi** — BIMAS dersinden öğrenildi; EREGL'de de uygulanmalıydı. Sıfır SELL = aşırı iyimserlik riski; EPDK + CBAM senaryosunda kim ilk SELL yazacak?
- **Revizyon trendi konsensüs momentumu tablosu zorunlu** — Son 3 ay: [Broker | Eski Hedef | Yeni Hedef | Yön | Büyüklük(%) | Tarih] tablosu. "Genel momentum pozitif/negatif" sonuç cümlesi ile bitir.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **Output truncated** — Tier 2 ajanlar tablosu "İntegral Yatırım 82..." diye kesildi. Toplam 14 analistten kaç tanesinin tam hedef fiyat + tarih + kaynak kombinasyonu eksiksiz? Görünen kısımda 6-7 kurum tam; geri kalan belirsiz.
- **Revizyon yönü trendi analiz edilmedi** — Ocak-Mart 2026'da yapılan upgradeler listelendi ✓; ancak "konsensüs momentumu pozitif mi negatif mi?" ve "revision acceleration var mı?" soruları yanıtsız.
- **Marj/varsayım sensitivity tablosu eksik** — Her analist için implied EBITDA marj varsayımı + kur varsayımı + hedef fiyat tablosu yok.
- **"0 SELL" riski analiz edilmedi** — 14 analist 13 AL / 1 HOLD; hiç SELL yok. Bu crowded long riski için "asimetrik yukarı yön fiyatlaması" analizi yapılmadı.
- **Hedef fiyat spread'i geniş: 645-945 TL (fark 300 TL)** — Bu kadar geniş aralık analistler arası ciddi görüş ayrılığı; neden bu kadar farklı? Analiz edilmedi.
- **14 analist güvenilir konsensüs eşiği (≥5) ✓**

### Bundan Sonra:
- **"0 SELL" durumunda 3 zorunlu analiz:**
  1. Konsensüs aşırı iyimser mi? Tarihsel BIMAS konsensüs isabeti ne kadar?
  2. Downside risk asimetrik mi fiyatlandırılmış? (Dezenflasyon + özel marka erozyonu + CEO interim = potansiyel downgrade tetikleyiciler)
  3. Crowded long pozisyon: yabancı yatırımcı payı düşerse hızlı çıkış riski?
- **Perakende analist sensitivity tablosu zorunlu:** Her analist için implied EBITDA marjı + implied SSSG + kur varsayımı. Yüksek hedef ile düşük hedef arasındaki tek fark hangi varsayımda?
- **BIMAS analist referans verileri (Nisan 2026):** Ortalama hedef 795 TL, medyan 820 TL, en yüksek 945 TL (TERA), en düşük 645 TL (Gedik). Güncel fiyat 740 TL → ortalamaya upside +7.4%. 13/14 AL, 1 HOLD, 0 SELL. Konsensüs güveni MEDIUM (geniş spread >%30).

## Bilinen Hatalar (Bir Daha Yapma)

- TUPRS: SELL tavsiyesi veren 2 analistin kimligi ve gerekcesi aciklanmadi. Bazi analist tarihleri "Q1 2026" olarak genel verildi. Analist marj varsayimlari arasindaki fark tartisitmadi.
- EREGL: WebSearch olmadan gercek zamanli analist verisi cekemedigini soyleyip yine de 23 kurum, ortalama hedef fiyat, medyan ve dagilim sundun — bu spekulasyon olarak degerlendiriliyor.

## Son 3 Raporun Ogrenimleri

- **TUPRS (2026-04-12):** Her 0.5 $/bbl marj farki = 2.5-3B TRY EBITDA = ~7-10 TL hisse fiyati. Bu sensitivity her rafineri raporunda gosterilmeli.
- **EREGL (2026-04-13):** Celik sirketi icin: "Her $10/ton HRC degisimi = X TRY EBITDA" parametresi uygulanmali. EPDK karari sonrasi asagi revizyon basladi mi izlenmeli.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **İş Yatırım 2025 yıl-sonu (stale) kullanıldı** — 2026 güncellemesi WebFetch başarısız oldu; ancak alternatif (Rota Borsa, Hisseyorum.com, İş Yatırım IR sayfası) denenmedi. Stale raporla konsensüs hesabı güvenilirliği düşürür.
- **TEB Yatırım bulunamadı** — KCHOL gibi büyük holdingler için 5+ broker eşiği önemli; TEB için "bulunamadı" notu açık bırakıldı ama alternatif kaynaklar denenmedi.
- **Revizyon yönü trendi (son 3 ay: Ocak-Nisan 2026) eksik** — "Ziraat +%32 upgrade" tek örnek var ✓; konsensüs momentumu pozitif mi negatif mi? Bu trend tablosu eksik.
- **3 segment sensitivity (TUPRS $/bbl, YKBNK NIM %, holding discount %) her broker için verilmedi** — GCM ve Ziraat için kısmi ✓; Deniz, Garanti, Gedik için bu 3 değişkende varsayım farkları gösterilmedi.
- **0 SELL crowded long analizi** — 11 BUY / 0 SELL: %49 holding iskontosu + negatif FCF + Fitch indirim ortamında sıfır SELL anormal. Bu asimetrik pozisyon analiz edilmedi.
- **Çıktı kesildi** — "Mevcut Fiyat vs Consensus" bölümü "vs G" ile bitti; tablo tamamlanmadı.

### Bundan Sonra:
- **KCHOL için Rota Borsa hedef fiyat sayfası zorunlu ilk kaynak** — rotaborsa.com/koc-holding-kchol-hisse-hedef-fiyat sayfası tüm broker hedeflerini + tarihleri gösteriyor. Her KCHOL analizinde buradan başla.
- **3 segment sensitivity tablosu KCHOL için standart** — [Broker | TUPRS Marj Varsayımı ($/bbl) | YKBNK NIM (%) | Holding Discount (%) | Hedef Fiyat (TL)]. Bu tablo fiyat farkının kaynağını açıklar.
- **0 SELL analizi için 3 soru zorunlu** — (1) Konsensüs çok iyimser mi? (2) Holding discount %47 iken neden SELL yok? (3) Downgrade tetikleyicileri — 21 Nisan İran ateşkes/22 Nisan TCMB/29 Nisan YKBNK Q1 — bunlardan hangisi SELL tetikler?

## Sektor Bilgi Bankasi

- **BIST veri kaynaklari:** Investing.com (en kapsamli), TradingView, SimplyWallSt. Yerel: IS Yatirim, Yapi Kredi Yatirim, Garanti BBVA. Uluslararasi: Goldman, JPMorgan, HSBC (sadece buyuk sirketler).
- **Turk analist ozellikleri:** Yereller TRY bazinda hedef verir; yabancilar kur riskini on planda tutar.

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-21)*
