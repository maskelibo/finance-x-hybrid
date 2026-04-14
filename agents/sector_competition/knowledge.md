# Sector Competition Agent — Bilgi Bankası (Katman 2)

> Bu dosya gece eğitimlerinden damıtılmış domain bilgisi içerir.
> Normal görevde ihtiyaç duyduğunda `Read` ile aç.
> Gece eğitiminde güncellenir.

---

## 1. Porter Beş Güçler — BIST Adaptasyonu

### Uygulama Kuralları
- Teorik değil, şirketin gerçek verilerine uygula
- Her güç için 1-5 puan + yön oku (↑/↓/→) — statik puan yetmez
- Pricing power kaybı → yüksek buyer power kanıtı
- AI etkisi (2026): Her force için AI impact ayrı değerlendirilmeli

### 2026 AI Güncellemesi
- **Supplier Power:** GPU üreticileri (NVIDIA) ve cloud providers yeni dominant tedarikçiler
- **Buyer Power:** AI-powered comparison tools → müşteri switching ability arttı
- **Substitutes:** İnsan hizmetleri (hukuk, tıp, tasarım) AI alternatiflerine karşı vulnerable

### Porter → SWOT Entegrasyonu
- Porter güç puanları doğrudan SWOT Tehditler/Fırsatlar sütununa beslenmeli
- Örnek: Tedarikçi Gücü 4/5 → W (hammadde bağımlılığı) + T (fiyat artışı riski)

---

## 2. Peer Comparison Metodolojisi

### Peer Group Seçim Kriterleri
- Business characteristics > aynı borsa gereksinimi
- Scale ve segment overlap öncelikli — aynı borsada olmak zorunlu değil
- Dominant yerel oyuncular (%72+ pazar payı) için global peers daha anlamlı
- Optimal peer grup boyutu: 5-8 şirket × 5-8 birincil metrik
- NAICS 4-digit seviyesi daha temiz peer grupları verir

### Çekirdek vs Genişletilmiş Peer Ayrımı
- Çekirdek: Operasyonel olarak doğrudan karşılaştırılabilir (aynı ürün/pazar)
- Genişletilmiş: Ürün karması farklı ama quartile dağılımını zenginleştiren
- Bu ayrım yazılmazsa benchmark yanıltıcı görünüyor

### Quartile Analizi (Best Practice)
- Lower Quartile (25th percentile) = top performer
- Upper Quartile (75th percentile) = improvement opportunity
- Her metrik için: Max, Q3, Median, Q1, Min, Şirket pozisyonu gösterilmeli
- Relative comparison: "global peer median'ının %X'i" formatı

### Veri Kaynakları
- KAP: kap.org.tr → Ticker → Finansal Tablolar → Annual PDF
- SEC EDGAR: Public company margins (ABD peers)
- KAP + S&P hibrit: Stratejik konum KAP'tan, hızlı oran tablosu S&P'den → confidence=medium

---

## 3. Sektör Sınıflandırma ve Dinamikler

### BIST Sektörel Endeksler
- XBANK (Bankacılık), XUSIN (Sınai), XTEKS (Tekstil) vb. — ~500 şirket
- Benchmark karşılaştırma amaçlı kullanılır

### Sektör → Şirket Bağlantı Kuralı
- Macro trend'i spesifik transmission mechanism ile şirket P&L'ine bağla
- "Enerji fiyatları arttı" yetmez → "Enerji fiyatı +%18 → COGS +%4.5 → Gross margin −3.3pp" gösterilmeli
- Demand-supply balance + enerji maliyeti + geographic exposure her analizde yer almalı

### Sektör Lifecycle İkili Format
- Olgunluk sektöründe yeşil dönüşüm yeni yatırım alt-döngüsü yaratabilir
- Sektör lifecycle ≠ business lifecycle (ör: çelik mature, EAF dönüşümü growth alt-döngüsü)

---

## 4. Holding Şirketi Rekabet Analizi

### Çift Katmanlı Analiz
1. **Holding-level:** NAV discount, Porter for conglomerate structure, governance
2. **Segment-level:** Her segment için ayrı sektör dinamikleri, Porter, peer benchmarking

### Conglomerate Discount
- Global average: %13-15 (developed economies)
- BIST'te: %20-40 yaygın
- Compression stratejileri: Spin-offs (en etkili, GE örneği), transparency improvement, management credibility
- Peer sayısı az ise (sadece 2-3 holding) → quartile distribution yapılamaz → relative positioning yap

### Segment Lifecycle Divergence
- Holding segmentleri farklı lifecycle stage'lerinde olabilir (energy mature, EV growth, banking growth)
- AMA holding yapısı olarak conglomerate model "maturity → decline" global trendinde (GE, Siemens breakup)

---

## 5. Sektöre Özel Benchmarklar

### Çelik
- Quasi-monopol (EREGL yassı çelik) → BIST peer yetersiz → küresel peer zorunlu
- İkili kaldıraç okuması: Net Borç/EBITDA ve EBIT/Faiz ikisi de ayrı gösterilmeli
- AB Safeguard transmission: Gelir bazında "Y TRY gelirin %X'i risk altında → marj etkisi"
- CBAM formülü: Export tonu × tCO2/ton × EUR sertifika fiyatı = yıllık yükümlülük
- CBAM rekabet asimetrisi: AB içi üreticiler muaf, EREGL tabi — yapısal dezavantaj

### Cam
- Enerji ~%25 COGS → enerji fiyat değişimi doğrudan margin etkisi
- Global peers: Guardian, AGC, NSG ile benchmark

### Bankacılık
- NIM, Cost/Income, ROE, NPL ratio, CET1 ana benchmarking metrikleri
- Türk bankaları: AKBNK, GARAN, YKBNK, ISCTR, VAKBN

---

## 6. SWOT Dengesi Kuralı

- Güçlü yönler (scale leadership) zayıflıkları (profitability crisis) maskeleyebilir
- Her iki boyut net ve veri-destekli olmalı
- Revenue ranking: Market share + absolute TRY sıralaması
- Tahmin varsa "Estimated" etiketle + low confidence flag

---

## 7. Çelişki Yönetimi

- CEO direktifindeki çelişki noktaları kanıt bazlı RESOLVED/CONTESTED label ile çözülmeli
- Her raporun sonunda çelişki özet tablosu standartlaşsın
- Net Borç/EBITDA "makul" ama EBIT/Faiz "kritik" → ikisini ayrı satırda göster, tek metrikle yorum yapma

---
