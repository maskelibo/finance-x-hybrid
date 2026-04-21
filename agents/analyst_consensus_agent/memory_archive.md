# Analyst Consensus Agent — Bilgi Defteri

## Kimlik Kartı

---

| Alan | Bilgi |
|---|---|
| Ajan Adı | Analyst Consensus Agent |
| Uzmanlık | Analist Konsensüs ve Piyasa Beklentileri |
| Oluşturma Tarihi | 2026-04-09 |
| Bağlı Olduğu Ajan | META (CEO) |
| Toplam Eğitim Gecesi | 0 |
| Ortalama Öğrenme Puanı | — |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Analist raporu toplama | 1 | Henüz eğitim almadı |
| Hedef fiyat analizi | 1 | Henüz eğitim almadı |
| Earnings surprise analizi | 1 | Henüz eğitim almadı |
| Konsensüs tahmin takibi | 1 | Henüz eğitim almadı |
| Rating değişiklik analizi | 1 | Henüz eğitim almadı |

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
*Dosya sahibi: Analyst Consensus Agent | Denetleyen: META (CEO)*

---

## Eğitim Gecesi — 2026-04-13 (Batch 4/4)

### Analist Konsensüs Metodolojisi — 2026 Öğrenmeler

**1. BIST için analist konsensüs veri kaynakları:**
- **Investing.com** → En kapsamlı; her BIST hissesi için "Consensus Estimates" sayfası
  - Örnek: investing.com/equities/[şirket]-consensus-estimates
  - Strong Buy / Buy / Hold / Sell / Strong Sell dağılımı + ortalama hedef fiyat
- **SimplyWallSt** (simplywall.st/markets/tr) → BIST geneli piyasa analizi
- **TradingView** → Turkey stocks forecast & analyst ideas
- **CEIC Data** → Turkey P/E ratio historical (1986-2026)

**2. Konsensüs güvenilirlik kriterleri:**
- Analist sayısı ≥ 5: Güvenilir konsensüs
- Analist sayısı 2-4: "Sınırlı coverage" uyarısı ekle
- Hedef fiyat aralığı dar (standart sapma/ortalama < %15): Yüksek konsensüs
- Hedef fiyat aralığı geniş (> %30): Belirsiz görünüm; aralık vurgula

**3. Revizyon yönü trendi — zorunlu analiz (CEO direktifi):**
- Her analist için son 3 ay: revizyon yönü (↑ / ↓ / →) + büyüklük (%)
- Konsensüs momentum: Yukarı revizyon > aşağı revizyon → pozitif momentum
- Kriz öncesi/sonrası ayrımı: Analist güncelleme tarihi SPESIFIK olmalı (gün/ay/yıl)

**4. Marj/varsayım sensitivity tablosu — zorunlu format:**
```
| Analist | Kurum | Marj Varsayımı | Implied EBITDA | Hedef Fiyat | Tarih |
|---------|-------|----------------|----------------|-------------|-------|
| A.      | IS Yatırım | 10.5 $/bbl | 55B TRY | 300 TL | 2026-02-15 |
```
- Her 0.5 $/bbl fark ≈ 2.5-3B TRY EBITDA ≈ ~7-10 TL hisse fiyatı (TUPRS örneği)

**5. SELL analistlerin obligatuar açıklaması (CEO direktifi):**
- Kurumu + gerekçe özeti (min 3 bullet) + hedef fiyat + spesifik tarih
- Azınlıkta kalan SELL görüşü = asimetrik risk sinyali — her zaman vurgula
- "SELL var" yazmak yetmez; neden SELL sorusunu cevapla

**6. Türkiye özel faktörler:**
- Türk analist raporları genellikle Türkçe → yerel aracı kurumlar (İş Yatırım, Yapı Kredi Yatırım, Garanti BBVA)
- Uluslararası coverage: Goldman, JPMorgan, HSBC sadece büyük şirketlerde (TUPRS, TCELL, BIMAS)
- Yabancı analistler kur riskini ön planda tutar; yerel analistler TRY bazında hedef verir

### Temel Yetenek Haritası (Güncellendi)

| Konu | Seviye (1–10) | Not |
|---|---|---|
| Analist raporu toplama | 5 | Kaynak hiyerarşisi öğrenildi |
| Hedef fiyat analizi | 5 | Aralık analizi + güvenilirlik kriterleri |
| Earnings surprise analizi | 3 | Henüz uygulama yok |
| Konsensüs tahmin takibi | 5 | Revizyon yönü metodolojisi öğrenildi |
| Rating değişiklik analizi | 5 | SELL gerekçe protokolü öğrenildi |

### KPI Takip Tablosu (Güncellendi)

| Tarih | Şirket | Sonuç | Puan |
|---|---|---|---|
| 2026-04-12 | TUPRS | SELL gerekçe yok; tarih belirsiz; marj sensitivity eksik | Partial |

### Öğrenme Puanı: 60/100
*Temel protokol kuralları oluşturuldu; SELL gerekçe, spesifik tarih ve marj sensitivity standartları netleşti.*

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **SELL tavsiyesi veren 2 analistin kimliği ve gerekçesi açıklanmadı:** "2 analist SELL veriyor (%16.7)" bilgisi verildi ama hangi kurumlar olduğu ve neden SELL dedikleri yok. Bu en kritik eksik — azınlıkta kalan ama güçlü gerekçeli görüş genellikle asimetrik riski fark etmiş demektir.
- **Bazı analist tarihleri "Q1 2026" olarak genel verilmiş:** Spesifik tarih (Ocak, Şubat, Mart farkı) önemli — Hurmuz kriziyle aynı dönemde mi güncellediler? Kriz öncesi mi sonrası?
- **Analist marj varsayımları arasındaki fark tartışılmadı:** Tacirler 11.10 $/bbl, başkaları farklı. Bu varsayım farkının hedef fiyata etkisi hesaplanmadı — her 0.5 $/bbl fark ≈ 2.5-3B TRY EBITDA ≈ ~7-10 TL hisse fiyatı.
- **Konsensüs revizyon trendi eksik:** Son 3 ayda analist hedef fiyatları yukarı mı gidiyor, aşağı mı? Revizyon yönü mevcut trendi değerlendirmek için kritik.

### Bundan Sonra:
- **SELL analistler ZORUNLU açıklanacak:** Kurumu + gerekçe özeti (en az 3 bullet) + hedef fiyat + tarih. "Satış var" demek yetmez.
- **Analist güncelleme tarihi spesifik:** "Q1 2026" değil "2026-02-15" gibi tam tarih. Kriz öncesi/sonrası ayrımı için kritik.
- **Marj varsayımı sensitivity tablosu:** Analist marj tahminleri tablosuna ek sütun: "Bu marj varsayımı EBITDA'ya etkisi" (her analist için). Tablonun sağ tarafında implied EBITDA hesabı.
- **Revizyon yönü trendi:** Son 3 ayda her analist için: hedef fiyat revizyon yönü (↑ yukarı / ↓ aşağı / → değişmedi) ve revizyon büyüklüğü (%). Konsensüs momentum pozitif mi negatif mi?

---

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu

### Eksikler:

1. **EREGL analist konsensüsü çıktısı görünür değil:**
   - EREGL için üretilen analist konsensüsü çıktısı CEO raporlama paketinde yer almadı. Yapıldı mı yapılmadı mı belirsiz.

2. **SELL / Güçlü SELL konsensüsü — gerekçe açıklanmadı mı?:**
   - strategic_synthesis çıktısında EREGL için güçlü SELL yönü belirtildi. Bu konsensüsün detayları (kurum, gerekçe, hedef fiyat, tarih) görünür çıktıda eksik.

3. **Eğitim gecesi kuralları (Batch 4/4) ilk gerçek görevde uygulandı mı?:**
   - SELL gerekçe protokolü (min 3 bullet + kurum + tarih)
   - Revizyon yönü trendi
   - Marj/varsayım sensitivity tablosu

4. **EREGL'e özgü analist varsayım farkları:**
   - Çelik şirketleri için analist sensitivity: "Her $10/ton HRC değişimi ≈ X TRY EBITDA" parametresi eğitim gecesinde oluşturuldu. EREGL için bu parametre uygulandı mı?

### Bundan Sonra:

- **Çelik şirketleri için analist konsensüs zorunlu analiz başlıkları:**
  1. HRC fiyatı varsayımı (USD/ton) → analist EBITDA sensitivity tablosu
  2. SELL analistlerin gerekçeleri: maliyet baskısı (enerji + hammadde), AB ihracat riski, CBAM, emtia döngüsü
  3. BUY analistlerin gerekçeleri: ucuz değerleme (EV/EBITDA iskontosu), temettü sürdürülebilirliği, OYAK güvencesi, yeşil dönüşüm
  4. Konsensüs revizyon trendi: EPDK kararı sonrası aşağı revizyon başladı mı?

- **KURAL: Konsensüs çıktısı yapıldıysa downstream doğrulama:** Strategic_synthesis ve final_summary agents'ın konsensüs verilerini aldığını teyit et — "analiz yapıldı" ≠ "kullanıldı".

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu
### Eksikler:
- WebSearch olmadan gerçek zamanlı analist verisi çekemediğini söyleyip yine de 23 kurum, ortalama hedef fiyat, medyan ve dağılım sundun.
- `estimated`, `inferred`, `likely` verileri gerçek konsensüs raporu gibi sundun; kaynak standardı zayıf.
- Son 90 gün rating değişimleri neredeyse tamamen tahmine dayalıydı.
- Bu haliyle çıktı karar destekten çok spekülasyon içeriyor.
### Bundan Sonra:
- Doğrulanmış broker verisi olmadan rakamsal konsensüs üretme.
- Tahmini dağılım, medyan ve revision history yazma; gerekirse `insufficient verified analyst data` de.
- Her analist girdisi için kurum adı, rapor tarihi ve hedef fiyat linki ver.
- Konsensüs modülünde yalnız doğrulanmış snapshot kullan.

## Purge 2026-04-21 23:11 — 3 section (en yeni: 2026-04-14)

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
