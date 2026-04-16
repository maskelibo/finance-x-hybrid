# Sentiment & News Agent — Katman 2b: Vaka Bazlı Dersler

> Bu dosya CEO geri bildirimleri, rapor bazlı öğrenimler ve sektör bilgi bankasını içerir.
> Agent gerektiğinde bu dosyayı açar; her çalıştırmada otomatik yüklenmez.

---

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Sayısal sentiment skoru (-5/+5 kategori bazlı) eksik** — Tablo var ama her kategori için sayısal skor (analist konsensüsü, insider işlemler, makro haberler, sektör haberleri ayrı) verilmedi.
- **Haber → fiyat etki ölçümü yapılmadı** — 10 Nisan CEO değişikliği haberi sonrası 1/3/5 günlük kapanış fiyatları + abnormal return hesabı eksik. Haberin fiyata etkisi "VERY NEGATIVE" olarak etiketlendi ama sayısallaştırılmadı.
- **Sosyal medya sentiment analizi eksik** — Twitter/X #THYAO #BIST30 sentiment ölçümü yok.
- **Agırlıklı sentiment hesabı yok** — Bloomberg/Reuters (ağır kaynak) vs haber sitesi (hafif kaynak) ağırlık farkı uygulanmadı.
- **CEO değişikliği haberi için önceki 5 günlük baseline hesabı yapılmadı** — Abnormal return = Actual - Expected (beta x piyasa getirisi). Bu hesap eksik.

### Bundan Sonra:
- **Her haber için haber → fiyat tablosu zorunlu** — HIGH/VERY HIGH impact event'larda: Haber tarihi + sonraki 1/3/5 gün kapanış + hacim değişimi + abnormal return.
- **Sayısal sentiment skoru zorunlu çıktı alanı** — Çıktının sonunda skortablosu: Analist sentiment: X/5, Insider: Y/5, Makro haberler: Z/5, Sektör haberleri: W/5, Ağırlıklı toplam: T/5.
- **Havacılık sektörü ek zorunlu:** Yakıt fiyatı haberleri, rota duyuruları, IATA raporları → medya tepkisi ölçümü. Brent spike haberleri ve hisse korelasyonu gösterilmeli.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **Sayısal sentiment skoru (-5/+5 kategori bazlı) eksik** — Haber tablosu kapsamlıydı ✓; ancak her kategori için sayısal skor çıktıda yok.
- **Haber → fiyat etki ölçümü eksik** — Temettü kararı (7 Nisan 2026) ve insider işlem (26 Mart 2026) sonrası 1/3/5 günlük kapanış fiyatı + abnormal return hesabı yapılmadı.
- **Output truncated** — "Tema Dağılımı" tablosu başladı ama kesildi. Sosyal medya sentiment, ağırlıklı toplam skor bölümleri görünmüyor.
- **"0 SELL" analist durumu analiz edilmedi** — 14 analistin tamamı AL önerisi; bu crowded long riski senaryosunun sentiment bölümünde tartışılması gerekiyor.
- **Kaynak linkleri çalışıyor ✓** — rotaborsa.com, cnbce.com linkleri gerçek ve tarihli verilmiş. İyi uygulama.

### Bundan Sonra:
- **Perakende sektörü sentiment zorunlu ek kaynaklar:**
  - Migros ve A101 (özel) haber akışı — sektör fiyat savaşı haberleri BIMAS'ı doğrudan etkiler
  - Tüketici Güven Endeksi (TÜİK aylık yayını)
  - Rekabet Kurumu açıklamaları (AGBI)
  - FILE bağlı ortaklık haberleri
- **Temettü haberi → fiyat etkisi standardize** — ex-date öncesi alım baskısı vs ex-date sonrası düşüş klasik perakende pattern'i.
- **BIMAS sentiment özet (Nisan 2026):** Analist BUY %92.9 (13/14), SELL %0 — aşırı bullish, crowded long riski. Genel ağırlıklı sentiment +3.2/5 (POZITIF).

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **Haber tablosu kapsamlı ve formatı iyi ✓** — 7 haber, her biri tarih/kaynak/duygu/etki/faaliyet raporu bağlantısıyla tam.
- **Duygu skoru hesabı gösterildi ✓** — -0.5/5 (Hafif Negatif) ağırlıklı bileşenlerle hesaplandı. Metodoloji şeffaf.
- **Kritik uyarılar bölümü truncated** — Son satır "B" ile kesildi; alert 21 Nisan, 22 Nisan, 29 Nisan uyarılarının detayı görünmüyor.
- **Sayısal sentiment skoru (-5/+5 kategori bazlı) formatı eksik** — Bileşen hesabı var ama tablo formatında sunulmadı.
- **Haber → fiyat etki tablosu yok** — Fitch downgrade (12 Nisan) ve TUPRS analist upgrade (13 Nisan) sonrası 1/3/5 günlük fiyat hareketi + abnormal return hesabı yapılmadı.
- **Sosyal medya sentiment analizi yok** — #KCHOL Twitter/X sentiment ölçülmedi.
- **Uluslararası basin coverage zayıf** — Bloomberg/Reuters araması yapıldığından söz edilmedi.

### Bundan Sonra:
- **Kritik uyarıları çıktının başına koy** — 5 priority alert output'un son bölümünde; truncation nedeniyle kayboluyor. Bölüm 1 olarak en başa al.
- **Haber → fiyat etkisi KCHOL için zorunlu** — TUPRS upgrade (13 Nisan, +3.73%) ve Fitch downgrade (12 Nisan) KCHOL hisse fiyatına etkisi tablolanmalı.
- **Sayısal kategori tablosunu çıktı sonuna ekle** — Standart format: | Kategori | Ağırlık | Skor | Katkı |

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **0 SELL analisti için "crowded long risk" uyarısı verildi ama derinleştirilmedi** — 9 BUY / 0 SELL durumu için pozisyon yoğunluğu analizi yapılabilirdi.
- **Uluslararası basın eksik** — Reuters, Bloomberg, Financial Times gibi yabancı kaynaklarda SAHOL haberi taranmadı.

### Bundan Sonra:
- **Crowded long riski quantify edilecek:** 0 SELL durumu varsa "pozisyon konsantrasyonu" bölümü ekle.
- **SAHOL gibi büyük holding için uluslararası medya taraması ZORUNLU:** Reuters, Bloomberg Türkiye, Financial Times yabancı yatırımcı perspektifini yansıtır; eksik kalırsa PARTIAL etiketle.

## Son 3 Raporun Ogrenimleri

- **EREGL (2026-04-13):** Cikti gorunur degil — downstream'e iletim sorunu. Haber tablosunda kaynak linki eksik, sentiment-finansal etki metodolojik ayrimi zayif.
- **TUPRS (2026-04-12):** Uluslararasi basin eksik. Insider islem etkisi olculmedi. SELL analist gerekcesi yok. Sonuc: Partial.

## Sektor Bilgi Bankasi

**NLP Metodolojileri:** FinBERT (Ingilizce), BERTurk/mBERT (Turkce), LSTM + Word2Vec/GloVe hibrit
**KPI:** TUPRS 2026-04-12 — Uluslararasi basin eksik, SELL gerekce yok, Partial


## Ek CEO Geri Bildirimleri (memory.md'den taşındı)

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **Sayısal sentiment skoru (-5/+5 kategori bazlı) eksik** — Tablo var ama her kategori için sayısal skor (analist konsensüsü, insider işlemler, makro haberler, sektör haberleri ayrı) verilmedi.
- **Haber → fiyat etki ölçümü yapılmadı** — 10 Nisan CEO değişikliği haberi sonrası 1/3/5 günlük kapanış fiyatları + abnormal return hesabı eksik. Haberin fiyata etkisi "VERY NEGATIVE" olarak etiketlendi ama sayısallaştırılmadı.
- **Sosyal medya sentiment analizi eksik** — Twitter/X #THYAO #BIST30 sentiment ölçümü yok.
- **Agırlıklı sentiment hesabı yok** — Bloomberg/Reuters (ağır kaynak) vs haber sitesi (hafif kaynak) ağırlık farkı uygulanmadı.
- **CEO değişikliği haberi için önceki 5 günlük baseline hesabı yapılmadı** — Abnormal return = Actual - Expected (beta × piyasa getirisi). Bu hesap eksik.

### Bundan Sonra:
- **Her haber için haber → fiyat tablosu zorunlu** — HIGH/VERY HIGH impact event'larda: Haber tarihi + sonraki 1/3/5 gün kapanış + hacim değişimi + abnormal return. CEO değişikliği gibi major olayda bu tablo raporda gösterilmeli.
- **Sayısal sentiment skoru zorunlu çıktı alanı** — Çıktının sonunda skortablosu: Analist sentiment: X/5, Insider: Y/5, Makro haberler: Z/5, Sektör haberleri: W/5, Ağırlıklı toplam: T/5.
- **Havacılık sektörü ek zorunlu:** Yakıt fiyatı haberleri, rota duyuruları, IATA raporları → medya tepkisi ölçümü. Brent spike haberleri ve hisse korelasyonu gösterilmeli.

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **Sayısal sentiment skoru (-5/+5 kategori bazlı) eksik** — Haber tablosu kapsamlıydı ✓; ancak her kategori için sayısal skor (Analist: +X, Insider: +Y, Makro: +Z, Sektör: +W) çıktıda yok.
- **Haber → fiyat etki ölçümü eksik** — Temettü kararı (7 Nisan 2026) ve insider işlem (26 Mart 2026) sonrası 1/3/5 günlük kapanış fiyatı + abnormal return hesabı yapılmadı.
- **Output truncated** — "Tema Dağılımı" tablosu başladı ama kesildi. Sosyal medya sentiment, ağırlıklı toplam skor bölümleri görünmüyor.
- **"0 SELL" analist durumu analiz edilmedi** — 14 analistin tamamı AL önerisi; bu crowded long riski senaryosunun sentiment bölümünde tartışılması gerekiyor.
- **Kaynak linkleri çalışıyor ✓** — rotaborsa.com, cnbce.com linkleri gerçek ve tarihli verilmiş. İyi uygulama.

### Bundan Sonra:
- **Perakende sektörü sentiment zorunlu ek kaynaklar:**
  - Migros ve A101 (özel) haber akışı — sektör fiyat savaşı haberleri BIMAS'ı doğrudan etkiler
  - Tüketici Güven Endeksi (TÜİK aylık yayını) — perakende satış öngörüsü için
  - Rekabet Kurumu açıklamaları (AGBI) — soruşturma güncellemeleri
  - FILE bağlı ortaklık haberleri — BIMAS ayrışmasının kamuoyu algısı
- **Temettü haberi → fiyat etkisi standardize** — BIMAS gibi düzenli temettü ödeyen şirketlerde temettü kararı açıklandığında hisse üzerindeki etkiyi ölç: "ex-date öncesi alım baskısı" vs "ex-date sonrası düşüş" klasik perakende pattern'i.
- **BIMAS sentiment özet (Nisan 2026):** Analist BUY %92.9 (13/14), SELL %0 — aşırı bullish, crowded long riski. Temettü kararı +pozitif, insider işlem nötr. Özel marka erozyonu medyada düşük ilgi. Genel ağırlıklı sentiment +3.2/5 (POZITIF).

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **Haber tablosu kapsamlı ve formatı iyi ✓** — 7 haber, her biri tarih/kaynak/duygu/etki/faaliyet raporu bağlantısıyla tam.
- **Duygu skoru hesabı gösterildi ✓** — -0.5/5 (Hafif Negatif) ağırlıklı bileşenlerle hesaplandı. Metodoloji şeffaf.
- **Kritik uyarılar bölümü truncated** — Son satır "B" ile kesildi; alert 21 Nisan, 22 Nisan, 29 Nisan uyarılarının detayı görünmüyor.
- **Sayısal sentiment skoru (-5/+5 kategori bazlı) formatı eksik** — Bileşen hesabı var ama son çıktıda "Analist: +X/5, Insider: +Y/5, Makro: +Z/5, Sektör: +W/5" tablo formatında sunulmadı.
- **Haber → fiyat etki tablosu yok** — Fitch downgrade (12 Nisan) ve TUPRS analist upgrade (13 Nisan) sonrası 1/3/5 günlük fiyat hareketi + abnormal return hesabı yapılmadı.
- **Sosyal medya sentiment analizi yok** — #KCHOL Twitter/X sentiment ölçülmedi.
- **Uluslararası basin coverage zayıf** — Bloomberg/Reuters araması yapıldığından söz edilmedi; yalnızca yerel kaynaklar kullanıldı.

### Bundan Sonra:
- **Kritik uyarıları çıktının başına koy** — 5 priority alert output'un son bölümünde; truncation nedeniyle kayboluyor. Bölüm 1 olarak en başa al; haber tablosu ikinci sıraya gelsin.
- **Haber → fiyat etkisi KCHOL için zorunlu** — TUPRS upgrade (13 Nisan, +3.73%) ve Fitch downgrade (12 Nisan) KCHOL hisse fiyatına etkisi tablolanmalı. "Anormal getiri = gerçek getiri - (beta × piyasa getirisi)" hesabı göster.
- **Sayısal kategori tablosunu çıktı sonuna ekle** — Standart format: | Kategori | Ağırlık | Skor | Katkı | Analist konsensüsü | %30 | +1.0 | +0.30 | ... | Ağırlıklı Toplam | | -0.5 |

## Bilinen Hatalar (Bir Daha Yapma)

- TUPRS: Uluslararasi basin coverage zayif (Bloomberg/Reuters aranamadi). Sosyal medya sentiment yok. SELL gerekcesi haberlere yansimadi. Koc hisse satisi -%2.1 haber etkisi olculmedi.
- EREGL: Sentiment ciktisi downstream'e ulasmadi. Egitim gecesi kurallari (SELL gerekce, yerel/uluslararasi ayrim, sayisal skor) uygulanip uygulanmadigi belirsiz. EPDK tarife medya tepkisi olculmedi. OYAK faktor uluslararasi algisi analiz edilmedi. Cok sayida nicel etki icin kaynak linki yok. "Garanti BBVA SELL", "Fitch BB-" iddialari primary kaynakla baglanmamis.

## Son 3 Raporun Ogrenimleri

- **EREGL (2026-04-13):** Cikti gorunur degil — downstream'e iletim sorunu. Egitim kurallari ilk gercek gorevde uygulanmis mi belirsiz. Haber tablosunda kaynak linki eksik, sentiment-finansal etki metodolojik ayrimi zayif.
- **TUPRS (2026-04-12):** Uluslararasi basin eksik. Insider islem etkisi olculmedi. SELL analist gerekcesi yok. Sonuc: Partial.

## Sektor Bilgi Bankasi

**NLP Metodolojileri:** FinBERT (Ingilizce), BERTurk/mBERT (Turkce), LSTM + Word2Vec/GloVe hibrit
**KPI:** TUPRS 2026-04-12 — Uluslararasi basin eksik, SELL gerekce yok, Partial

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **0 SELL analisti için "crowded long risk" uyarısı verildi ama derinleştirilmedi** — 9 BUY / 0 SELL durumu için pozisyon yoğunluğu analizi yapılabilirdi; hangi yabancı kurumların kapatma riski var?
- **Uluslararası basın eksik** — Reuters, Bloomberg, Financial Times gibi yabancı kaynaklarda SAHOL haberi taranmadı; yalnızca Türk finans medyası.

### Bundan Sonra:
- **Crowded long riski quantify edilecek:** 0 SELL durumu varsa "pozisyon konsantrasyonu" bölümü ekle: büyük kurumların açık pozisyon biliniyorsa listele; değilse "downgrade riski: herhangi bir SELL ilk olursa ortalama hedefe çekiş X TL" tahmini ver.
- **SAHOL gibi büyük holding için uluslararası medya taraması ZORUNLU:** Reuters, Bloomberg Türkiye, Financial Times yabancı yatırımcı perspektifini yansıtır; eksik kalırsa PARTIAL etiketle.

---
