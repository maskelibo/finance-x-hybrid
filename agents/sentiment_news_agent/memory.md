# Sentiment & News Agent — Damitilmis Hafiza

---

## Kalici Kurallar

- **Sayisal sentiment skoru zorunlu:** Her kategori icin -5 ile +5 arasi (analist tahminleri / insider islemler / makro haberler / sektor haberleri ayri ayri). Sezgisel "pozitif/negatif" YETMEZ.
- **SELL analist gerekcesi zorunlu:** SELL veren her analistin: kurum + gerekce (min 3 bullet) + hedef fiyat + tarih. "2 analist SELL" demek yetmez.
- **Yerel vs Uluslararasi ayrim:** Her raporda iki alt bolum: Turkce yerel basin + Ingilizce uluslararasi basin. Uluslararasi coverage "yok/minimal" ise bu bulgu olarak kaydet.
- **Haber -> fiyat etki olcumu:** Haber tarihi + sonraki 1/3/5 gun kapanis fiyati + hacim degisimi tablosu. Baseline: Haber oncesi 5 gunluk ortalama. Abnormal return = Actual - Expected (beta x piyasa getirisi).
- **Cikti iletim protokolu:** Sentiment analizi yapildiysa, ciktinin downstream (strategic_synthesis, final_summary) tarafindan alindigi teyit edilmeli. "Analiz yapildi" != "iletildi".
- **Her haber maddesine spesifik kaynak linki ve yayin tarihi koy.**
- **Dogrulanmamis analist notu, rating veya fiyat verisini tabloya alma ya da `unverified` etiketiyle ver.**
- **Sentiment skoru ile finansal etki tahminini ayri yonet.** Metodolojik ayrim net olmali.
- **Nicel etki veriyorsan kisa dayanak mantigi veya formulu not et.**
- **Agirlikli sentiment hesabi:** Agir kaynak = Bloomberg/Reuters; hafif = sosyal medya.

## Zorunlu Kontrol Listesi

**Her raporda zorunlu bolumler:**
1. Analist konsensus tablosu (BUY/HOLD/SELL dagilimi + SELL gerekcesi detay)
2. Yerel basin ozeti (KAP, Bigpara, Mynet Finans)
3. Uluslararasi basin ozeti (Bloomberg, Reuters) — yoksa "minimal" olarak kaydet
4. Insider islem haberi -> fiyat etkisi tablosu (3-5 gunluk)
5. Sayisal sentiment skoru (-5/+5 kategori bazli)
6. Sosyal medya sentiment (Twitter/X #BIST30 #TICKER etiketleri)

**Celik/emtia sektoru ek zorunlu:**
1. EPDK/BOTAS kararina medya tepkisi (yerel + uluslararasi)
2. AB Safeguard kota kararina medya tepkisi
3. SELL analist gerekcesi — marj baskisi, CBAM riski, emtia dongusu
4. OYAK kurumsal yapisinin yabanci yatrimci algisi

**Kaynak hiyerarsisi:**
1. KAP (kap.org.tr) — en guvenilir, notr dil
2. Bigpara.com — Turk finans haberleri, analist yorumlari
3. Mynet Finans — genis kapsamli Turkce haber akisi
4. Twitter/X — #BIST30 etiketleri, retail investor sentiment
5. Bloomberg/Reuters — uluslararasi kurumsal sentiment


## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **Sayısal sentiment skoru (-5/+5) verilmedi** — Haber listesi verildi ✓ ama her kategori (analist, insider, makro, sektör) için sayısal skor tablosu eksik. Sezgisel "Pozitif/Neutral/Negatif" yetmez.
- **Haber → fiyat etki ölçümü tablosu yok** — AGM sonuçları (26 Mart), temettü açıklaması (3 Mart) için haber tarihi + 1/3/5 gün kapanış fiyatı + hacim değişimi tablosu oluşturulmadı.
- **EPDK gaz tarifesi kararına medya tepkisi eksik** — Çelik sektörü zorunlu 1. ek madde; 4 Nisan 2026 EPDK kararına EREGL özelinde yerel basın haberi araması yapılmadı.
- **AB Safeguard kota kararına medya tepkisi eksik** — TRK −%47 kota kesintisi için EREGL/sektör haberi araması yapılmadı. Çelik sektörü zorunlu 2. ek madde.
- **OYAK kurumsal yapısının yabancı yatırımcı algısı** — OYAK sahipliğinin kurumsal yatırımcı algısına etkisi (governance discount, şeffaflık, bağımsız YK) analiz edilmedi. Çelik sektörü zorunlu 4. ek madde.
- **0 SELL durumu crowded long riski olarak analiz edilmedi** — 6 BUY / 5 HOLD / 0 SELL; neden SELL yok? Bu asimetrik risk sinyali değerlendirilmedi.
- **Uluslararası basın coverage "minimal" kategorisi** — Bloomberg/Reuters EREGL coverage'ı var mı/yok mu "minimal" olarak kayıt altına alınmadı.

### Bundan Sonra:
- **EPDK ve AB Safeguard kararları → medya tepkisi çelik analizlerinde zorunlu** — Her iki olay için en az 3 haber kaynağı (Bigpara, Reuters, Bloomberg) + yerel vs uluslararası tepki karşılaştırması.
- **Sayısal sentiment tablosu 4 kategori** — Analist (+/-5) / Insider (+/-5) / Makro haber (+/-5) / Sektör haberi (+/-5) → ağırlıklı genel sentiment skoru. Format: tablo, her kategori satır.
- **0 SELL durumunda zorunlu analiz** — "Neden SELL yok?" sorusunu her raporda yönelt: CBAM/EPDK riski fiyatlanmadı mı? Çin dumping baskısı hafife mi alındı? Bu analiz raporun bir paragrafı.

## CEO Geri Bildirimi — 2026-04-16 — KCHOL Delta-Update Raporu

### Eksikler:
- **Sayısal sentiment skoru (-5/+5) 4 kategoride verilmedi** — Haber tablosu verildi ✓; ancak analist/insider/makro haber/sektör haberi için ayrı ayrı sayısal skor tablosu eksik. "Pozitif/Negatif" etiketleme yeterli değil.
- **Sosyal medya sentiment (Twitter/X #KCHOL) eksik** — Zorunlu kontrol listesinin 6. maddesi; arama yapıldı mı belli değil. Retail sentiment görünmüyor.
- **0 SELL analizi yapılmadı** — 11 BUY / 0 SELL. "Neden SELL yok?" sorusu: %49 holding iskontosu + negatif FCF + ARCLK kronik zarar + Fitch görünüm indirimi varken crowded long riski analiz edilmedi.
- **Haber → fiyat etki tablosu (1/3/5 gün kapanış) sunulmadı** — Fitch indirim haberi (10-15 Nisan) ve TUPRS satışı (25 Mart) için "haber sonrası fiyat değişimi" hesabı yapılmadı.
- **Uluslararası basın coverage kayıt altına alınmadı** — Bloomberg/Reuters KCHOL haberi var mı/yok mu? "Minimal" kategorisi bile işaretlenmedi.

### Bundan Sonra:
- **Sayısal sentiment tablosu 4 satır zorunlu** — [Analist | Insider | Makro | Sektör] her biri -5/+5 arası puan + ağırlıklı genel skor. Bu tablo olmadan sentiment çıktısı eksik sayılır.
- **0 SELL → zorunlu analiz** — "Sıfır SELL durumu neden anomali?" bölümü: (1) mevcut riskler fiyatlandı mı?, (2) downgrade tetikleyicileri neler?, (3) yabancı pay düşerse çıkış riski? Holding analizlerinde bu analiz zorunlu.
- **Fitch haberi → fiyat etkisi** — 10 Nisan Fitch sovereign indirimi + 15 Nisan bankacılık outlook indirimi → 10/11/12/13/14/15 Nisan KCHOL kapanış fiyatları tablosu. Abnormal return hesabı zorunlu.

---

*Vaka bazli dersler: case_lessons.md | Domain bilgisi: knowledge.md*
