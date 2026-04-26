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

## Bilinen Hatalar (Bir Daha Yapma)

- TUPRS: SELL tavsiyesi veren 2 analistin kimligi ve gerekcesi aciklanmadi. Bazi analist tarihleri "Q1 2026" olarak genel verildi. Analist marj varsayimlari arasindaki fark tartisitmadi.
- EREGL: WebSearch olmadan gercek zamanli analist verisi cekemedigini soyleyip yine de 23 kurum, ortalama hedef fiyat, medyan ve dagilim sundun — bu spekulasyon olarak degerlendiriliyor.

## Son 3 Raporun Ogrenimleri

- **TUPRS (2026-04-12):** Her 0.5 $/bbl marj farki = 2.5-3B TRY EBITDA = ~7-10 TL hisse fiyati. Bu sensitivity her rafineri raporunda gosterilmeli.
- **EREGL (2026-04-13):** Celik sirketi icin: "Her $10/ton HRC degisimi = X TRY EBITDA" parametresi uygulanmali. EPDK karari sonrasi asagi revizyon basladi mi izlenmeli.

## Sektor Bilgi Bankasi

- **BIST veri kaynaklari:** Investing.com (en kapsamli), TradingView, SimplyWallSt. Yerel: IS Yatirim, Yapi Kredi Yatirim, Garanti BBVA. Uluslararasi: Goldman, JPMorgan, HSBC (sadece buyuk sirketler).
- **Turk analist ozellikleri:** Yereller TRY bazinda hedef verir; yabancilar kur riskini on planda tutar.
- **Rota Borsa:** rotaborsa.com — broker hedef fiyat + revision history. KCHOL gibi buyuk holdinglerin KCHOL-hedef-fiyat sayfasi tum aracı kurum hedeflerini listeler.
- **BorsaMatik:** borsamatik.com.tr — yabanci yatirimci radar hisseler, günlük net alim/satim verisi.
- **BIST 2026 analist ortami (Nisan 2026):** BIST 100 yilsonu hedefleri 15.250-16.680 puan arasi. En cok kapsanan: THYAO (24 analist), TCELL (23), AKBNK (22), MIGROS (21). Materyaller sektoru +%54 kazanc buyumesi beklentisiyle en iyimser sektor.
- **BIMAS referans (Nisan 2026):** Ort. hedef 795 TL, medyan 820 TL, en yuksek 945 TL (TERA), en dusuk 645 TL (Gedik). 13/14 AL, 1 HOLD, 0 SELL. Konsensus guveni MEDIUM.
- **Yabanci yatirimci (Nisan 2026):** Net +579M dolar akim; toplam 44.1 milyar dolar pozisyon.

---

*Eski feedback'ler → `memory_archive.md` (son purge: 2026-04-25)*
