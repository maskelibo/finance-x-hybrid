# AGENT FEEDBACK — USAGE GELİNCE UYGULANACAK
**Tarih:** 10 Nisan 2026  
**Kaynak:** SISE Detaylı Gap Analysis  
**Durum:** HAZIR - Her agent'a uygulanmayı bekliyor

---

## 🎯 FINANCIAL ANALYSIS AGENT

**Dosya:** `agents/financial_analysis/memory.md`

### Eklenecek Feedback:

```markdown
## CEO Feedback — 2026-04-10 — SISE Raporu Eksiklikleri

### Hesaplanmayan Metrikler (KRİTİK)

SISE raporunda aşağıdaki metrikler eksik kaldı. Bu KABUL EDİLEMEZ.

#### 1. Working Capital Metrikleri

**DSO (Days Sales Outstanding):**
- **Formül:** (Ticari Alacaklar / Net Satışlar) × 365
- **Nasıl Hesaplanır:**
  1. KAP → SISE Q4 2024 Finansal Rapor → Dipnot 7: Ticari Alacaklar
  2. Ticari Alacaklar (kısa vadeli) tutarını al
  3. Net Satışlar (Gelir Tablosu) ile böl, 365 ile çarp
  4. Yorumla: 45-60 gün = İyi (cam sektörü), 90+ gün = Tahsilat sorunu
- **Benchmark:** Cam sektörü ortalama 50-60 gün

**DIO (Days Inventory Outstanding):**
- **Formül:** (Stoklar / SMM) × 365
- **Nasıl Hesaplanır:**
  1. KAP → Bilanço → Stoklar
  2. Gelir Tablosu → Satılan Malın Maliyeti (SMM)
  3. Hesapla ve yorumla: Düşük = İyi (hızlı devir), Yüksek = Stok birikimi
- **Benchmark:** Sermaye-yoğun imalat 60-90 gün

**DPO (Days Payable Outstanding):**
- **Formül:** (Ticari Borçlar / SMM) × 365
- **Nasıl Hesaplanır:**
  1. KAP → Bilanço → Ticari Borçlar (kısa vadeli)
  2. SMM ile böl, 365 ile çarp
  3. Yorumla: Yüksek = İyi (tedarikçilere geç ödeme, nakit korunur)

**Cash Conversion Cycle (CCC):**
- **Formül:** DSO + DIO - DPO
- **Yorum:** Düşük = Nakit döngüsü hızlı, Yüksek = Nakit döngüsü yavaş

**NWC / Revenue:**
- **Formül:** (Dönen Varlıklar - Kısa Vadeli Yabancı Kaynaklar) / Net Satışlar
- **Benchmark:** %10-15 sağlıklı

#### 2. Getiri Metrikleri

**ROE (Return on Equity):**
- **Formül:** (Net Kâr / Özsermaye) × 100
- **SISE'de Sorun:** Equity tutarsızlığı var (186B vs 208B TL)
- **Çözüm:**
  1. KAP → Q4 2024 Finansal Rapor → Dipnot 17: Özsermaye Detayı
  2. Doğru equity rakamını bul (hangi kaynak resmi KAP raporu?)
  3. Tutarsızlığı çöz, sonra hesapla
  4. **IAS29 etkisiyle / etkisiz ayrı hesapla**
- **Benchmark:** Sağlıklı sanayi %12-20

**ROCE (Return on Capital Employed):**
- **Formül:** FVÖK / (Total Assets - Current Liabilities)
- **Hesaplama:**
  1. FVÖK = FAVÖK - D&A (depreciation & amortization)
  2. Total Assets - Current Liabilities = Capital Employed
  3. Hesapla ve yorumla
- **Benchmark:** %12-18 sağlıklı

**ROIC (Return on Invested Capital):**
- **Formül:** NOPAT / Invested Capital
- **NOPAT:** Net Operating Profit After Tax = FVÖK × (1 - Tax Rate)
- **Invested Capital:** Equity + Net Debt

#### 3. Kaldıraç Metrikleri

**Interest Coverage Ratio:**
- **Formül:** FVÖK / Faiz Giderleri
- **SISE için Kritik:** 500M USD Eurobond @ 8.375% = 1.86B TRY faiz/yıl
- **Hesaplama:**
  1. Gelir Tablosu → Finansman Giderleri altında Faiz Giderleri
  2. FVÖK (EBIT) hesapla: FAVÖK - D&A
  3. Interest Coverage = FVÖK / Faiz Giderleri
  4. Yorumla: >5× Güçlü, 2-5× Orta, <2× Riskli
- **SISE Tahmini:** 2-2.5× (kritik seviye)

**CAPEX / FAVÖK:**
- **Formül:** Toplam CAPEX / FAVÖK
- **Nasıl:**
  1. Nakit Akış Tablosu → Yatırım Faaliyetleri → MDV Alımları (CAPEX)
  2. FAVÖK ile böl
  3. Yorumla: %30-50 = Yatırım fazlası, %20-30 = Normal, <20% = Mature

### Bundan Sonra (Kurallar):

1. **"Veri Yok" Excuse YASAK:**
   - Önce Google'da formül ara
   - Sonra KAP dipnotlarını oku
   - Hala bulamazsan → başka veri kaynağı ara (şirket faaliyet raporu, yatırımcı sunumu)
   - Gerçekten yoksa → "Veri bulunamadı, hesaplanamadı" yaz + neden açıkla

2. **Her Raporda Working Capital Section Zorunlu:**
   - DSO, DIO, DPO, CCC → Her şirket için
   - NWC analizi → Nakit yaratım/tüketimi açıkla
   - Trend göster (5 yıl)

3. **Getiri Metrikleri Zorunlu:**
   - ROE, ROCE, ROIC → Her raporda
   - IAS29 etkisi varsa ayrı hesapla (with/without)
   - Sektör benchmark ile karşılaştır

4. **Veri Tutarsızlığı Protokolü:**
   - Tutarsızlık gördüğünde → DURAKLAMA
   - Kaynak belgeye dön, çöz
   - Çözemezsen → rapor başında BÜYÜK UYARI + o metriği çıkar
   - "Ortalama aldım" YANLIŞ YAKLAŞIM

5. **Cash Flow Waterfall Zorunlu:**
   - Sadece FCF değil, nasıl oluştuğunu göster
   - CFO + CFI + CFF breakdown
   - Waterfall chart + yorum
```

---

## 🌍 MACRO ANALYSIS AGENT

**Dosya:** `agents/macro_analysis/memory.md`

### Eklenecek Feedback:

```markdown
## CEO Feedback — 2026-04-10 — Türkiye Makro Analizi Derinleştirme

### Eksikler:

SISE raporunda Türkiye makrosu var AMA sektör-spesifik transmission eksik.

#### 1. FX Senaryo Analizi

**Mevcut:** USD/TRY 44.50 belirtilmiş  
**Eksik:** Senaryo analizi yok

**Ekle:**
| Senaryo | USD/TRY | SISE FX Pozisyonu Etkisi | Bilanço Etkisi |
|---------|---------|--------------------------|----------------|
| **Base Case** | 44.50 | -108B TL net FX açık pozisyon | Mevcut durum |
| **Bear Case** | 50.00 | %12.4 TL devalüasyonu | -13.4B TL kayıp |
| **Extreme** | 55.00 | %23.6 TL devalüasyonu | -25.5B TL kayıp |

**Hesaplama:**
- Net FX Pozisyonu: USD Varlıklar - USD Borçlar (TL cinsinden)
- TL %10 değer kaybetse → Net açık pozisyon × 10% = Bilanço kaybı

#### 2. Sektör-Spesifik Göstergeler

**Cam sektörü için kritik göstergeler:**

**İnşaat Sektörü (Düzcam Talebi):**
- ✅ Türkiye: +%5.45 büyüme (var)
- ❌ Avrupa inşaat sektörü? (düzcam ihracatının %40'ı Avrupa'ya)
- **Kaynak:** Eurostat construction PMI, European Construction Industry Federation

**Otomotiv Sektörü (Endüstriyel Cam Talebi):**
- Türkiye otomotiv üretimi trendi?
- Avrupa otomotiv üretimi? (SISE camları Avrupa OEM'lere gidiyor)
- **Kaynak:** OICA (Uluslararası Otomobil İmalatçıları Örgütü), OSD (Türkiye)

**Gıda-İçecek Sektörü (Cam Ambalaj Talebi):**
- Türkiye gıda sanayi büyümesi?
- Cam ambalaj vs plastik trendi?
- **Kaynak:** TÜİK sanayi üretim endeksi, Packaging Europe

**Enerji Fiyatları:**
- ✅ Doğalgaz +%18.61, Elektrik +%5.8 (var)
- ❌ Forward curve nedir? (6-12 ay sonra ne bekleniyor?)
- **Kaynak:** EPDK, TTF (Dutch gas hub), Türkiye elektrik piyasası

#### 3. Faiz Politikası Transmission

**Mevcut:** "TCMB %37 faiz → Borçlanma maliyeti yüksek"  
**Eksik:** Nasıl transmission ediyor?

**Doğru Analiz:**
1. **Direkt Etki YOK:**
   - SISE'nin Eurobond USD-cinsinden → TCMB faizinden etkilenmiyor
   - TL borçları var mı? → Dipnotları kontrol et

2. **İNDİREKT Etki:**
   - TCMB %37 → TL kredileri pahalı
   - Müşteriler (inşaat, gıda şirketleri) yatırım yapmaz
   - SISE'ye talep düşer

3. **Enflasyon Etkisi:**
   - %37 faiz → Enflasyon baskılanıyor (%30.87'ye düştü)
   - Düşük enflasyon → Reel ücretler korunur → Tüketim dayanır
   - Cam ambalaj talebi (tüketim malları için) korunur

**Ekle: Transmission Zinciri Şeması**
```
TCMB %37 Faiz
  ↓
TL kredileri pahalı
  ↓
İnşaat şirketleri yatırım yavaşlatır
  ↓
Düzcam talebi düşer (iç piyasa)
  ↓
SISE Türkiye satışları baskı altında
```

### Bundan Sonra:

1. **Makro Analiz = Şirkete Nasıl Transmission Ediyor?**
   - Sadece "TCMB faiz %37" değil → SISE'ye etkisi?
   - Mekanizmayı açıkla

2. **Senaryo Analizi Zorunlu:**
   - FX için: Base / Bear / Extreme
   - Enerji için: Stability / Continued Increase
   - Avrupa talebi için: Recovery / Stagnation

3. **Sektör-Spesifik Göstergeler:**
   - Her şirketin sektörüne göre relevant göstergeleri bul
   - İnşaat, otomotiv, gıda vb. → Hangileri şirketi etkiliyor?
```

---

## 📊 DATA COLLECTION AGENT

**Dosya:** `agents/data_collection/memory.md`

### Eklenecek Feedback:

```markdown
## CEO Feedback — 2026-04-10 — Veri Tutarsızlığı Çözülmedi

### Sorun:

SISE raporunda 2 farklı equity değeri var (186.06B TL vs 208.11B TL, %10.6 fark) ve sen bunu çözmedin.

**Agent Yaklaşımı (YANLIŞ):**
> "Equity tutarsızlığı var, ortalama aldım: 197B TL"

**Doğru Yaklaşım:**
1. Tutarsızlığı gördüğünde DUR
2. Her iki kaynağa geri dön:
   - Kaynak 1: KAP Q4 2024 Finansal Rapor → Bilanço → Toplam Özsermaye
   - Kaynak 2: Nerede bu 2. rakamı bulduk? (Çeyrek rapor? Dipnot?)
3. HANGİSİ RESMİ KAYNAK?
   - KAP'taki yıllık bağımsız denetimli rapor → KAYNAK 1 (en güvenilir)
   - Diğer her kaynak ikincil
4. Doğru rakamı kullan + dipnot referansı ver

**Eğer Gerçekten Çözemezsen:**
- Rapor başında BÜYÜK UYARI yaz:
  > ⚠️ **VERİ KALİTE UYARISI:** 2024 Equity değeri için çelişkili veri tespit edildi (186B vs 208B TL). ROE metrikleri bu raporda hesaplanamamıştır. Veri kalitesi düzeltilene kadar bu metrikler güvenilir değildir.
- O metriği rapordan ÇIKAR (yanlış hesaplama risk)

### Bundan Sonra:

1. **5 Yıllık Detaylı Finansal Tablolar İndir:**
   - Bilanço: Detaylı (stoklar, alacaklar, borçlar ayrımıyla)
   - Gelir Tablosu: Segment bazında (mümkünse)
   - Nakit Akış: CFO, CFI, CFF ayrımıyla
   - Dipnotlar: Working capital detayları için (Dipnot 7, 11, 17 genelde)

2. **Veri Kalite Kontrolü:**
   - Her rakam için kaynak belge adı + dipnot referansı
   - Tutarsızlık gördüğünde → kaynak belgeye dön
   - Matematiksel imkansızlık gördüğünde (EBITDA < Net Profit) → uyar

3. **Çeyrek Raporlar da İndir:**
   - Trend analizi için gerekli
   - Son 2 yıl çeyreklik (8 çeyrek) minimum
```

---

## 🏢 SECTOR COMPETITION AGENT

**Dosya:** `agents/sector_competition/memory.md`

### Eklenecek Feedback:

```markdown
## CEO Feedback — 2026-04-10 — Rakip Analizi Derinleştirilmeli

### Sorun:

SISE raporunda "Global rakipler %25 FAVÖK marjı" denmiş AMA kim bu rakipler?

**Mevcut Yaklaşım (YETERSİZ):**
> "SISE %5.8 FAVÖK marjı, global sektör ortalaması ~%25"

**Doğru Yaklaşım:**

### Peer Comparison Table Yap:

| Şirket | FAVÖK Marjı | Net Debt/EBITDA | CAPEX/Sales | ROE | Notlar |
|--------|-------------|-----------------|-------------|-----|--------|
| **SISE** | 5.8% | 6.82× | 16-17% | 2.5% | Baseline |
| **Saint-Gobain** | ? | ? | ? | ? | Global cam lideri |
| **AGC (Asahi Glass)** | ? | ? | ? | ? | Japonya, Top 3 |
| **Guardian Industries** | ? | ? | ? | ? | Koch Industries |
| **Owens-Illinois** | ? | ? | ? | ? | Cam ambalaj lideri |
| **NSG Group (Pilkington)** | ? | ? | ? | ? | Britanya |

**Veri Kaynakları:**
1. **Şirket Annual Reports:**
   - Saint-Gobain: https://www.saint-gobain.com/en/finance/results-and-publications
   - AGC: https://www.agc.com/en/ir/
   - Owens-Illinois: https://www.o-i.com/investors/
2. **Google Finance:** Hızlı finansal özet
3. **Sector Reports:**
   - Deloitte: "Global Glass Industry Report"
   - McKinsey: "Future of Glass Manufacturing"
   - IBISWorld: "Glass Manufacturing - Global Market Research"

### Nasıl Analiz Yapacaksın:

1. **Her Peer için:**
   - Latest annual report indir
   - EBITDA margin, Net Debt/EBITDA, ROE çıkar
   - Tabloya ekle

2. **Karşılaştırmalı Yorum:**
   ```
   SISE'nin %5.8 FAVÖK marjı, global peers ile karşılaştırıldığında:
   - Saint-Gobain: %18.2 (12.4pp üstün)
   - AGC: %21.5 (15.7pp üstün)
   - Owens-Illinois: %22.1 (16.3pp üstün)
   
   SISE'nin marj dezavantajı 3 faktörden kaynaklanıyor:
   1. Enerji maliyeti: Türkiye enerji fiyatları Avrupa'dan %30-40 yüksek
   2. Operational efficiency: Saint-Gobain'in labor productivity %25 daha yüksek
   3. Pricing power: Premium market positioning (Saint-Gobain Avrupa premium, SISE volume player)
   ```

3. **Benchmark Göster:**
   - "Global ortalama" değil → "Saint-Gobain %18.2, AGC %21.5, peer median %20.1"

### Bundan Sonra:

- **Her raporda peer comparison table**
- **Spesifik rakip isimleri + rakamlar**
- **Neden fark var? (Maliyet yapısı, pricing, efficiency)**
```

---

## 📅 EVENT IMPACT MAPPER AGENT

**Dosya:** `agents/event_impact_mapper/memory.md`

### Eklenecek Feedback:

```markdown
## CEO Feedback — 2026-04-10 — Combined Event Scenarios Eksik

### Mevcut Yaklaşım (İYİ AMA EKSİK):

6 olayı ayrı ayrı haritaladın. Her birinin etkisini belirttin. İyi iş.

### Eksik Olan:

**Birleşik Etkiler (Combined Scenarios):**

Olaylar birbirinden bağımsız değil, aynı anda gerçekleşiyorlar:
- Event 1: Temettü ödeme (324M TRY çıkış, Haziran 2026)
- Event 2: Eurobond faiz (1.86B TRY/yıl, quarterly payments)
- Event 3: İtalya fabrikası (+1.3B TRY FAVÖK/yıl, Q2 2026 başlangıç)

**Bunları TEK TEK değil, BİRLEŞİK olarak analiz et:**

### Combined Scenario Analysis:

**Net Liquidity Impact (Haziran-Aralık 2026):**
```
Başlangıç Nakit: X TRY
- Temettü ödemesi: -324M TRY (Haziran)
- Eurobond faiz: -465M TRY × 2 = -930M TRY (Q2, Q3)
+ İtalya FAVÖK katkısı: +1.3B / 2 = +650M TRY (H2 2026, 6 ay)
+ Operasyonel nakit akışı: +Y TRY (FCF 2024 -645M bazında tahmin)
= Net Nakit Değişimi: -604M TRY (kötü senaryo)
```

**Timeline Görselleştirmesi:**
```
Q2 2026: - 324M (temettü) - 465M (faiz) + 200M (İtalya ramp-up) = -589M
Q3 2026: - 465M (faiz) + 450M (İtalya tam kapasite) = -15M
Q4 2026: - 465M (faiz) + 450M (İtalya) + operasyonel iyileşme = pozitife dönüş mü?
```

**Kritik Dönem:** Q2-Q3 2026 en riskli (temettü + faiz yükü, İtalya henüz tam katkı vermiyor)

### Senaryo Matrisi:

| Senaryo | İtalya Fabrikası | Enerji Fiyatları | Avrupa Talebi | Net Likidite Etkisi (H2 2026) |
|---------|------------------|------------------|---------------|-------------------------------|
| **Best Case** | +1.3B TRY | Stable | Recovery +10% | -200M TRY |
| **Base Case** | +1.0B TRY | Stable | Flat | -600M TRY |
| **Worst Case** | +0.5B TRY (ramp-up issues) | +20% increase | -10% decline | -1.2B TRY |

### Bundan Sonra:

1. **Her raporda Combined Scenario Analysis:**
   - Olayları tek tek + birleşik senaryolar
   - Best / Base / Worst case
   - Timeline göster (çeyrek bazında)

2. **Diğer KAP Bildirimleri:**
   - "6/16 eşleştirildi" dedin → diğer 10 nerede?
   - Hangisi material, hangisi değil? Tablolaştır:
     | KAP Bildirimi | Tarih | Materiality | Haritalandı mı? | Neden haritalanmadı? |

3. **Liquidity Stress Testing:**
   - Worst case'de şirketin nakit yeterli mi?
   - Kredi limitleri kullanılacak mı?
   - Refinancing riski var mı?
```

---

## 📝 FINAL SUMMARY AGENT

**Dosya:** `agents/final_summary/memory.md`

### Eklenecek Feedback:

```markdown
## CEO Feedback — 2026-04-10 — Rapor Cleanup Protokolü

### Sorun:

SISE raporunda agent internal commentleri kalıyordu (şimdi temizlendi, ama süreç düzelmeli).

### Rapor Finalization Kuralları:

**YASAK İfadeler (Raporda Asla Olmamalı):**
- ❌ "Hafızamı inceledim..."
- ❌ "Şimdi hazırlıyorum..."
- ❌ "Agent Internal" bölümleri
- ❌ "ÖZ-DEĞERLENDİRME" sections
- ❌ "WebSearch yaptım..." gibi süreç açıklamaları
- ❌ Emoji (Chairman profesyonel rapor istiyor)

**İZİN VERİLEN İfadeler:**
- ✅ Analiz içeriği
- ✅ Bulgular, yorumlar
- ✅ Riskler, fırsatlar
- ✅ Senaryo analizleri
- ✅ Uyarılar, kısıtlamalar

### Pre-Submit Checklist:

Raporu Chairman'a göndermeden önce:

1. **Meta-Text Kontrolü:**
   ```bash
   grep -i "hafızam" report.md → Bulunmamalı
   grep -i "agent internal" report.md → Bulunmamalı
   grep -i "öz-değerlendirme" report.md → Bulunmamalı
   ```

2. **Format Kontrolü:**
   - [ ] Başlıklar profesyonel (#### kullanmadan önce düşün)
   - [ ] Tablolar düzgün (aligned columns)
   - [ ] Bullet points tutarlı

3. **İçerik Kontrolü:**
   - [ ] Her metrik yorumlanmış (sadece sayı değil)
   - [ ] Kaynaklar belirtilmiş
   - [ ] Belirsiz ifadeler yok ("yüksek", "düşük" → KAÇA GÖRE?)
   - [ ] Rapor bir sonuca varıyor (actionable insights)

### Bundan Sonra:

- Her rapor finalize edilmeden CEO Quality Review geçecek
- Checklist'i geç → tek HAYIR varsa REJECT
```

---

**TÜM FEEDBACK HAZIR**

**Uygulama Sırası (Usage Gelince):**
1. Financial Analysis (en kritik, 11 metrik eksik)
2. Data Collection (veri kalitesi düzeltilmeli)
3. Macro Analysis (senaryo analizi eklenecek)
4. Sector Competition (peer comparison)
5. Event Impact Mapper (combined scenarios)
6. Final Summary (cleanup protokolü)

**Her feedback agents/{agent_id}/memory.md dosyasına Edit tool ile eklenecek.**
