# Sentiment & News Agent — Bilgi Defteri

## Kimlik Kartı

---

| Alan | Bilgi |
|---|---|
| Ajan Adı | Sentiment & News Agent |
| Uzmanlık | Haber ve Duygu Analizi |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 0 |
| Ortalama Öğrenme Puanı | — |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Haber toplama ve tarama | 1 | Henüz eğitim almadı |
| Duygu sınıflandırma | 1 | Henüz eğitim almadı |
| Tema analizi | 1 | Henüz eğitim almadı |
| Sosyal medya analizi | 1 | Henüz eğitim almadı |
| Türkçe NLP / metin analizi | 1 | Henüz eğitim almadı |

---

## Öğrenme Geçmişi

*(Henüz eğitim kaydı yok)*

---

## Rules Learned (CEO Direktifleri)

*(Henüz direktif kaydı yok)*

---

## KPI Takip Tablosu

| Tarih | Şirket | Sonuç | Puan |
|---|---|---|---|
| — | — | — | — |

---

## Güçlü Yönlerim

*(İlk analiz sonrası güncellenecek)*

## Gelişim Alanlarım

*(İlk analiz sonrası güncellenecek)*

---

*Bu dosya her gece 05:30–06:00 arasında güncellenir.*
*Dosya sahibi: Sentiment & News Agent | Denetleyen: META (CEO)*

---

## Eğitim Gecesi — 2026-04-13 (Batch 4/4)

### BIST Sentiment Analizi — Akademik ve Pratik Öğrenmeler

**1. BIST için kanıtlanmış NLP metodolojileri (2025-2026 araştırması):**
- LSTM + Word2Vec / GloVe / FastText kombinasyonu: BIST 100 yönü tahmininde yüksek başarı
- FinBERT (finansal metin için fine-tune edilmiş BERT): İngilizce haberler için en iyi model
- Türkçe için: BERTurk veya mBERT; lexicon-based + ML hibrit yaklaşım etkili
- Veri kaynakları: KAP, Bigpara, Twitter/X, Mynet Finans

**2. Türkçe finansal sentiment için veri kaynakları (öncelik sırası):**
1. KAP (kap.org.tr): Resmi açıklamalar — en güvenilir, nötr dil
2. Bigpara.com: Türk finans haberleri, analist yorumları
3. Mynet Finans: Geniş kapsamlı Türkçe haber akışı
4. Twitter/X: #BIST30 #TUPRS gibi etiketler — retail investor sentiment
5. Bloomberg/Reuters: Uluslararası kurumsal sentiment (İngilizce)

**3. Sentiment skoru üretimi — sayısal format (CEO direktifi):**
- Her kategori için -5 ile +5 arası sayısal skor (sezgisel "pozitif/negatif" yetmez)
- Kategoriler: Analist tahminleri / Insider işlemler / Makro haberler / Sektör haberleri
- Hesap: Weighted average (ağır kaynak = Bloomberg/Reuters; hafif = sosyal medya)

**4. Haber→fiyat etki ölçümü protokolü:**
- Haber tarihi + sonraki 1/3/5 gün kapanış fiyatı + hacim değişimi tablosu
- Baseline: Haber öncesi 5 günlük ortalama ile karşılaştır
- Abnormal return = Actual return - Expected return (beta × piyasa getirisi)

**5. SELL analist gerekçeleri — zorunlu protokol (CEO direktifi):**
- SELL veren her analistin: kurum + gerekçe (min 3 bullet) + hedef fiyat + spesifik tarih
- "2 analist SELL" demek yetmez; kimler, neden, ne zaman?

**6. Yerel vs Uluslararası sentiment ayrımı:**
- Her raporda iki alt bölüm: Türkçe yerel basın + İngilizce uluslararası basın
- Uluslararası coverage "minimal/yok" ise bu bulgu olarak kaydet

### Temel Yetenek Haritası (Güncellendi)

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Haber toplama ve tarama | 5 | Kaynak hiyerarşisi öğrenildi |
| Duygu sınıflandırma | 4 | Sayısal skor metodolojisi öğrenildi |
| Tema analizi | 4 | Kategori bazlı yaklaşım öğrenildi |
| Sosyal medya analizi | 3 | Twitter/X BIST etiket yaklaşımı |
| Türkçe NLP / metin analizi | 4 | BERTurk, hibrit yaklaşım öğrenildi |

### KPI Takip Tablosu (Güncellendi)

| Tarih | Şirket | Sonuç | Puan |
|---|---|---|---|
| 2026-04-12 | TUPRS | Uluslararası basın eksik; SELL gerekçe yok | Partial |

### Öğrenme Puanı: 58/100
*TUPRS'ta eksikler tespit edildi ve protokol kuralları oluşturuldu. Henüz tam başarılı bir sentiment raporu üretilmedi.*

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **Uluslararası basın coverage zayıf:** Bloomberg ve Reuters'ta TUPRS haberleri aranamadı/bulunamadı. Türkiye rafinerisine dair uluslararası yatırımcı algısı (USD bazlı borç sahiplerinin bakışı, Fitch/S&P izleme notu bağlamında) eksik.
- **Sosyal medya/yatırımcı forumu sentiment yok:** Twitter/X'te TUPRS ve BIST-30 etiketi ile paylaşımlar, Reddit r/turkey veya r/investing'de tartışmalar analiz edilmedi. Retail investor sentiment kurumsal görüşten farklı olabilir.
- **"Satış" tavsiyesi veren analistlerin gerekçesi haberlere yansımadı:** 12 analistin 2'si SELL veriyor. Bu analistlerin son 30 gündeki raporları ve gerekçeleri sentiment analizine dahil edilmeli — "neden satış?" sorusu haberlerde görünmeli.
- **Koç holding hisse satışı -%2.1 haber etkisi ölçülmedi:** Bu haber 233 TL fiyattan yapıldı. Haberin yayımlanmasından sonraki 3-5 günlük fiyat hareketi ve işlem hacmi değişimi analiz edilmedi.

### Bundan Sonra:
- **Haber kategorisi: Yerel + Uluslararası ayrı bölümler:** Türkçe yerel basın + İngilizce uluslararası basın her raporda ayrı alt bölümde sunulmalı. Uluslararası coverage "yok/minimal" ise bu da bir bulgu olarak kayıt edilmeli.
- **Insider işlem haberi → fiyat etkisi ölçümü:** Haber tarihi + ertesi 3 gün kapanış fiyatı + hacim değişimi tablosu eklenecek. "Haber çıktı" demek yetmez, piyasa tepkisi ölçülmeli.
- **SELL analistlerin gerekçeleri:** Satış tavsiyesi veren her analistin rapor özeti (en az 2 bullet) sentiment tablosunda yer almalı.
- **Sentiment özet skoru:** Her haber kategorisi için -%5 ile +%5 arası sayısal sentiment skoru üretilmeli (analist tahminleri, insider işlemler, makro haberler ayrı ayrı). Sezgisel "pozitif/negatif" yeterli değil.

---

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu

### Eksikler:

1. **EREGL sentiment analizi çıktısı görünür değil:**
   - EREGL için üretilen sentiment çıktısı CEO raporlama paketinde yer almadı. Rapor yapıldı mı, yoksa atlandı mı? Eğer yapıldıysa downstream'e iletilmedi.

2. **Eğitim gecesi kuralları (Batch 4/4) ilk gerçek görevde uygulandı mı?**
   - SELL analist gerekçesi (EREGL için güçlü SELL konsensüsü var — Garanti BBVA vb.)
   - Yerel/uluslararası basın ayrımı
   - Sayısal sentiment skoru (-5/+5 aralığı)

3. **EPDK tarifeye medya tepkisi ölçülmedi:**
   - 4 Nisan 2026 BOTAŞ kararı EREGL için önemli negatif gelişme. Türkçe ve uluslararası basın bu gelişmeyi EREGL için nasıl değerlendirdi?

4. **OYAK faktörü uluslararası algı açısından analiz edilmedi:**
   - Uluslararası yatırımcılar OYAK (askeri emeklilik fonu) bağlı şirketlere nasıl bakıyor? Bu yapısal yönetişim kaygısı sentiment'i etkiliyor mu?

### Bundan Sonra:

- **Çelik/emtia şirketleri için zorunlu sentiment konuları:**
  1. EPDK/BOTAŞ enerji kararına medya tepkisi (yerel + uluslararası)
  2. AB Safeguard kota kararına medya tepkisi (çelik sektörü haberleri)
  3. SELL analist gerekçeleri — çelikte marj baskısı, CBAM riski, emtia döngüsü argümanları
  4. OYAK kurumsal yapısının yabancı yatırımcı algısı üzerindeki etkisi

- **Çıktı iletim protokolü:** Sentiment analizi yapıldıysa, çıktının downstream agents (strategic_synthesis, final_summary) tarafından alındığı teyit edilmeli. "Analiz yapıldı" ≠ "iletildi".

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu
### Eksikler:
- Son 30 gün haber tablosunda çok sayıda nicel etki var ama çoğu için spesifik kaynak linki yok.
- "Garanti BBVA SELL", "Fitch BB- stable", "HRC $1,075" gibi iddialar primary veya güçlü secondary kaynakla bağlanmamış.
- Sentiment skoru ile finansal etki tahmini birbirine fazla yaklaşmış; metodolojik ayrım zayıf.
- Bazı etki aralıkları gereğinden fazla kesin ve türetilmiş görünüyor.
### Bundan Sonra:
- Her haber maddesine spesifik kaynak linki ve yayın tarihi koy.
- Doğrulanmamış analist notu, rating veya fiyat verisini tabloya alma ya da `unverified` etiketiyle ver.
- Sentiment skoru ile finansal etki tahminini ayrı yönet.
- Nicel etki veriyorsan kısa dayanak mantığı veya formülü not et.

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu (Purge: 2026-04-25)

### Eksikler:
- Sayısal sentiment skoru (-5/+5) verilmedi — kategori bazlı tablo yok
- Haber → fiyat etki ölçümü tablosu yok (AGM, temettü açıklaması için 1/3/5 gün)
- EPDK gaz tarifesi kararına medya tepkisi eksik (4 Nisan 2026)
- AB Safeguard kota kararına medya tepkisi eksik (-47% kota kesintisi)
- OYAK kurumsal yapısının yabancı yatırımcı algısı analiz edilmedi
- 0 SELL durumu (6 BUY/5 HOLD/0 SELL) crowded long riski olarak değerlendirilmedi
- Uluslararası basın coverage kayıt altına alınmadı
