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

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **7 broker doğrulandı ✓ — asgari eşik karşılandı** — GCM (doğrulanmış tarih: 2026-02-12) ve İş Yatırım (doğrulanmış: 2025-10-15) tam kaynaklı; diğerleri "~est." formatında. Bu kabul edilebilir ama est. oranı yüksek.
- **SELL analist sayısı 0 — açıklanmadı** — 11 BUY / 0 SELL crowded long riski; "neden SELL yok?" sorusu sentez bölümünde sadece dokunduruldu, tam analiz yapılmadı. Ziraat upgrade (+32%) sonrası bile SELL gelmemesi anomali.
- **Marj/varsayım sensitivity tablosu kısmen yapıldı ✓** — Ziraat, GCM, İş Yatırım için implied TUPRS marj varsayımları verildi; ancak YKBNK NIM varsayımı, ARCLK recovery varsayımı eksik. Holding için en az 3 segment varsayımı zorunlu.
- **Revizyon yönü trendi eksik** — 3 aylık upgrade/downgrade trendi gösterilmedi. "Ziraat 254.70 → 336.50 upgrade" tek örnek; konsensüs momentumu hesaplanmadı.
- **Hedef fiyat aralığı geniş (286-336 TL) açıklanmadı** — ~%17 spread; "neden bu kadar farklı?" sorusu yanıtsız. SOTP'ta holding discount varsayımı farkı veya TUPRS marj beklentisi farkı mı? Analiz edilmedi.

### Bundan Sonra:
- **KCHOL için 3 segment sensitivity zorunlu** — Her broker için en az: TUPRS marj varsayımı ($/bbl), YKBNK NIM varsayımı (%), holding discount varsayımı (%). Bu üç değer hedef fiyat farkını açıklar.
- **"0 SELL" analizi standart** — "Tüm analistler AL ise: (1) consensus çok mı iyimser? (2) holding iskonto %47 iken neden SELL yok? (3) downgrade tetikleyicileri neler?" Bu 3 soru KCHOL analizinde yanıtlanmalı.
- **Revizyon trendi için Rota Borsa ve analist sayfaları** — rotaborsa.com/koc-holding-kchol-hisse-hedef-fiyat sayfası revision history'yi gösteriyor; her analizde bu sayfadan son 3 ay revision tablosunu çek.

## Bilinen Hatalar (Bir Daha Yapma)

- TUPRS: SELL tavsiyesi veren 2 analistin kimligi ve gerekcesi aciklanmadi. Bazi analist tarihleri "Q1 2026" olarak genel verildi. Analist marj varsayimlari arasindaki fark tartisitmadi.
- EREGL: WebSearch olmadan gercek zamanli analist verisi cekemedigini soyleyip yine de 23 kurum, ortalama hedef fiyat, medyan ve dagilim sundun — bu spekulasyon olarak degerlendiriliyor.

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Revizyon yönü trendi "WebSearch döndürmedi" ile geçiştirildi** — Son 3 aydaki upgrade/downgrade tarihleri bulunamadı. Kural: "bulunamadı" demeden alternatif kaynakları tüket (Bloomberg, Refinitiv, Investing.com, IS Yatirim IR sayfası).
- **Marj/varsayım sensitivity tablosu eksik** — Her analist için implied EBITDA + marj varsayımı + hedef fiyat tablosu yok. Havacılık için: yakıt varsayımı ($/bbl), dolar kuru varsayımı, EBITDAR multiplier.
- **Analist raporları 3+ ay eski** — En yeni rapor Feb 2025; CEO değişikliği + İran krizi (Nisan 2026) sonrası güncel analist görüşleri yok. "Stale" notu eklendi ✓ ama güncel veri aranmadı.
- **12 AL / 0 SELL risk analizi yapılmadı** — Hiç negatif tavsiye olmaması sistematik bias riski; "asimetrik yukarı yön fiyatlaması" analizi yapılmadı.
- **Hedef fiyat aralığı geniş (%26 SD/Ort)** — 345-580 TL aralığı analistler arası ciddi görüş farklılığı; bu fark analiz edilmedi.

### Bundan Sonra:
- **Kriz sonrası analist güncellemelerini ara** — CEO değişikliği ve temettü iptali gibi major event sonrası 30 gün içinde herhangi bir analist notu güncellemesi var mı? Investing.com, TradingView, Hisseyorum.com'da ara.
- **Marj/varsayım sensitivity tablosu havacılık için** — Her analist için: yakıt varsayımı ($/bbl Brent), USD/TRY kur varsayımı, EBITDAR büyüme tahmini, hedef fiyat. Bu tablo divergence'ı açıklar.
- **"0 SELL" analizi** — Tüm analistler AL ise: (1) consensus aşırı iyimser mi? (2) SELL analistler neden yok? (3) Downside risk asimetrik mi fiyatlandırılmış? Bu 3 soruyu tartış.
- **Spesifik tarih formatı** — "Q1 2026" değil "2026-02-15" gibi tam tarih. Özellikle kriz öncesi/sonrası ayrımı için kritik.

## Son 3 Raporun Ogrenimleri

- **TUPRS (2026-04-12):** Her 0.5 $/bbl marj farki = 2.5-3B TRY EBITDA = ~7-10 TL hisse fiyati. Bu sensitivity her rafineri raporunda gosterilmeli.
- **EREGL (2026-04-13):** Celik sirketi icin: "Her $10/ton HRC degisimi = X TRY EBITDA" parametresi uygulanmali. EPDK karari sonrasi asagi revizyon basladi mi izlenmeli.

## Sektor Bilgi Bankasi

- **BIST veri kaynaklari:** Investing.com (en kapsamli), TradingView, SimplyWallSt. Yerel: IS Yatirim, Yapi Kredi Yatirim, Garanti BBVA. Uluslararasi: Goldman, JPMorgan, HSBC (sadece buyuk sirketler).
- **Turk analist ozellikleri:** Yereller TRY bazinda hedef verir; yabancilar kur riskini on planda tutar.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **Güvenilirlik skoru tablosu truncated** — "Cavea" ile kesildi; boyut skorları tamamlanmadı.
- **Earnings surprise history "DATA" eksik** — Gerçek Q3/Q4 2024 EPS gerçekleşmesi bulunamadı; proxy hesaplama yapıldı ama zayıf.
- **Analist hedefleri arasındaki %23 spread derinlemesine analiz edilmedi** — Aşırı yüksek hedef (175 TL) ile düşük hedef (134 TL) arasındaki farkın nedeni sorgulanmadı.

### Bundan Sonra:
- **Güvenilirlik skoru tablosu tam teslim edilecek:** Her boyut (kapsam, kalite, tarafsızlık, tarihsel doğruluk) tam puan ve gerekçe ile. Truncation = output geçersiz.
- **EPS surprise history 4 çeyrek ZORUNLU:** Gerçek değer bulunamazsa "[BULUNAMADI — proxy kullanıldı]" etiketi ver. Proxy hesaplama yeterli; tamamen boş YASAK.
- **Hedef dağılım analizi ZORUNLU:** Spread >%15 ise en yüksek ve en düşük hedeflerin hangi varsayımlara dayandığı açıklanacak (holding discount, Akçansa kapanış vs. gecikme senaryosu gibi).

---
