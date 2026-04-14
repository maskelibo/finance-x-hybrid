# Sentiment & News Agent — Bilgi Bankası (Katman 2)

> Bu dosya gece eğitimlerinden damıtılmış domain bilgisi içerir.
> Normal görevde ihtiyaç duyduğunda `Read` ile aç.
> Gece eğitiminde güncellenir.

---

## 1. Türkçe Finansal Haber Kaynakları (Öncelik Sırası)

| # | Kaynak | URL | Güvenilirlik | Kullanım |
|---|--------|-----|-------------|----------|
| 1 | KAP | kap.org.tr | EN YÜKSEK | Resmi açıklamalar — nötr dil |
| 2 | Bigpara | bigpara.com | YÜKSEK | Türk finans haberleri, analist yorumları |
| 3 | Mynet Finans | mynet.com/finans | ORTA | Geniş kapsamlı Türkçe haber akışı |
| 4 | Twitter/X | #BIST30 #[TICKER] | DÜŞÜK | Retail investor sentiment |
| 5 | Bloomberg/Reuters | — | YÜKSEK | Uluslararası kurumsal sentiment (İngilizce) |

### Kaynak Standardı
- Her haber maddesine spesifik kaynak linki + yayın tarihi koy
- Doğrulanmamış analist notu/rating/fiyat verisini tabloya alma ya da `unverified` etiketiyle ver
- Türetilmiş veya tahmine dayalı rakamları gerçek veri gibi sunma

---

## 2. Sentiment Skoru Metodolojisi

### Sayısal Skor Sistemi
- Her kategori: **-5** ile **+5** arası sayısal skor
- Sezgisel "pozitif/negatif" YETERLİ DEĞİL — sayısal olmalı

### Kategoriler
| Kategori | Ağırlık | Kaynak |
|----------|---------|--------|
| Analist Tahminleri | YÜKSEK | Bloomberg, Reuters, yerel aracı kurumlar |
| Insider İşlemler | YÜKSEK | KAP bildirimler |
| Makro Haberler | ORTA | TCMB, TÜİK kararları |
| Sektör Haberleri | ORTA | Sektörel yayınlar |
| Sosyal Medya | DÜŞÜK | Twitter/X, yatırımcı forumları |

### Hesaplama
- Weighted average: Ağır kaynak (Bloomberg/Reuters) > hafif kaynak (sosyal medya)
- Sentiment skoru ile finansal etki tahminini ayrı yönet — metodolojik ayrım zorunlu

---

## 3. Haber → Fiyat Etki Ölçümü

### Protokol
1. Haber tarihi kaydet
2. Sonraki 1/3/5 gün kapanış fiyatı
3. Hacim değişimi (ortalamaya göre)
4. Baseline: Haber öncesi 5 günlük ortalama ile karşılaştır
5. Abnormal return = Actual return − Expected return (beta × piyasa getirisi)

### Tablo Formatı
```
| Haber | Tarih | Kaynak | 1 Gün | 3 Gün | 5 Gün | Hacim Δ |
|-------|-------|--------|-------|-------|-------|---------|
```

---

## 4. SELL Analist Gerekçe Protokolü

- SELL veren HER analist için zorunlu:
  1. **Kurum adı** (İş Yatırım, Garanti BBVA, vb.)
  2. **Gerekçe özeti** (minimum 3 bullet point)
  3. **Hedef fiyat** (TL)
  4. **Spesifik tarih** (gün/ay/yıl — "Q1 2026" yetmez)
- "2 analist SELL" demek yetmez — kimler, neden, ne zaman?
- Azınlıkta kalan SELL = asimetrik risk sinyali — her zaman vurgula

---

## 5. Yerel vs Uluslararası Ayrımı

Her raporda iki alt bölüm zorunlu:
1. **Türkçe Yerel Basın:** Bigpara, Mynet, yerel analist yorumları
2. **İngilizce Uluslararası Basın:** Bloomberg, Reuters, FT, WSJ

- Uluslararası coverage "yok/minimal" ise bu da bir bulgu olarak kaydet
- Uluslararası yatırımcılar kur riskini ön planda tutar
- OYAK gibi yapısal yönetişim kaygılarının uluslararası algısı ayrı değerlendirilmeli

---

## 6. NLP Metodolojileri (Referans)

### BIST için Kanıtlanmış Modeller
- **FinBERT:** İngilizce finansal metin için en iyi model
- **BERTurk / mBERT:** Türkçe metin için
- **LSTM + Word2Vec/GloVe/FastText:** BIST 100 yön tahmininde yüksek başarı
- Hibrit yaklaşım (lexicon-based + ML) etkili

---

## 7. Sektöre Özel Sentiment Konuları

### Çelik / Emtia
1. EPDK/BOTAŞ enerji kararına medya tepkisi
2. AB Safeguard kota kararına medya tepkisi
3. SELL analistlerin gerekçeleri: maliyet baskısı, CBAM, emtia döngüsü
4. BUY gerekçeleri: ucuz değerleme, temettü, yeşil dönüşüm

### Rafineri / Enerji
1. Brent fiyat hareketlerine medya tepkisi
2. Hurmuz/jeopolitik gelişmelere medya reaksiyonu
3. Insider (ana hissedar) blok satışlarının haber etkisi

### Telekomünikasyon
1. 5G lansman haberleri — "buy rumor, sell news" pattern kontrolü
2. BTK düzenleme haberleri

---
