# Valuation Agent — Bilgi Bankası (Katman 2)

> Bu dosya gece eğitimlerinden damıtılmış domain bilgisi içerir.
> Normal görevde ihtiyaç duyduğunda `Read` ile aç.
> Gece eğitiminde güncellenir.

---

## 1. DCF Parametreleri — Türkiye

### WACC Hesaplama

```
WACC = Ke × (E/V) + Kd × (1−T) × (D/V)

Ke (Özsermaye Maliyeti) = Risk-free rate + β × ERP + CRP
Kd (Borç Maliyeti) = Ağırlıklı borçlanma maliyeti (finansal tablolardan)
```

### WACC Bileşen Kaynakları (Her raporda zorunlu gösterilmeli)

| Bileşen | Kaynak | Not |
|---------|--------|-----|
| Risk-free rate | Türkiye 10Y Eurobond yield (USD bazlı) veya TCMB politika faizi | Acil hike sonrası güncelle |
| ERP (Equity Risk Premium) | %5-7 (Türkiye ülke riski dahil) | Damodaran Ocak güncelleme |
| CRP (Country Risk Premium) | pages.stern.nyu.edu/~adamodar | Her Ocak güncellenir |
| Beta | Sektör kaldıraçsız beta × kaldıraç ayarlaması | — |
| Kd | Faiz gideri / ortalama borç (son finansal rapordan) | — |

### Türkiye WACC Aralıkları (2026)

| Sektör | Tipik WACC |
|--------|-----------|
| Sigorta/Finansal | ~%29-30 |
| Enerji/Sanayi | %22-30 (makro şok sonrası %25-28) |
| Banka | Yapısal farklı (mudiler ≠ borç) → daha düşük |

### DCF Özel Kurallar
- **Projeksiyon süresi:** 5 yıl standart
- **Terminal büyüme:** %3-5 (TL enflasyon ortamı)
- **Büyüme oranı:** Son 3 yıl gelir büyümesi ortalaması (max %20)
- **TCMB acil hike sonrası:** WACC sıçrar — rf köklü değişir
- **USD-borçlu şirketlerde:** Kd stabil kalır; fark Ke'de
- **Yüksek rf rejiminde:** TL DCF çıktısı piyasanın belirgin altında kalabilir → `low confidence` etiketle

### Yük Bölme Protokolü
- DCF → ayrı çalıştır
- Peer EV/EBITDA → ayrı çalıştır
- Sensitivity matrix → ayrı çalıştır
- Tek seferde hepsi YASAK (exit code 143 riski)

---

## 2. Peer Multiple Aralıkları

### BIST Değerleme Seviyeleri (Nisan 2026)
- P/E: yaklaşık 8-10x (tarihsel ortalamanın altında)
- Piyasa kap./GDP oranı: orta düzey → cazip ama kur riski

### Peer Tablosu Formatı
Her peer şirketinin EV/EBITDA değeri kaynakla birlikte tabloda — medyan hesabı şeffaf olmalı

### Tarihsel Çarpan Karşılaştırması (Zorunlu)
```
Mevcut F/K: [X] | 5-yıl ort. F/K: [Y] | Fark: [±Z%]
Mevcut FD/FAVÖK: [X] | 5-yıl ort.: [Y] | Fark: [±Z%]
Peer medyan FD/FAVÖK: [X] | Premium/İskonto: [±Z%]
```

---

## 3. Sektöre Özel Değerleme

### Emtia / Enerji
- **Değerleme ağırlığı:** EV/EBITDA %40 + DCF %35 + Temettü Verimi %15 + PE %10
- DDM Gordon Growth: ağırlık max %15; >%100 payout döneminde %5-10
- Rafineri marjı ($/bbl) birincil FCF değişkeni — her 1 $/bbl ≈ 5-6B TRY EBITDA
- Brent fiyatı ≠ crack spread → TUPRS net marjı crack spread bağlı
- Hisse adedi doğrulama: Toplam Temettü / Brüt Hisse Başı Temettü = Hisse Adedi

### Çelik
- **Değerleme ağırlığı:** EV/EBITDA %40 + DCF %35 + Temettü Verimi %15 + EV/ton %10
- EV/ton kapasitesi: installed capacity × peer EV/ton
- Dip net kar döneminde P/E analitik olarak bozulur → EV/FAVÖK ve PD/DD kullan
- DDM yalnızca düzenli temettü politikası varsa — kesintili dağıtımda düşük ağırlık
- Önce CAPEX ve marj baskısı kur, sonra gelir büyümesi ekle

### Holding Şirketleri (SOTP)
```
NAV = Σ(Listed subs market cap × ownership %)
    + Σ(Unlisted subs estimated value × ownership %)
    + Parent-level net cash/debt

Holding Discount = (NAV − Market Cap) / NAV × 100
```

- Unlisted subsidiary valuation: EBITDA × multiple (kaynak göster)
- Parent-level net debt = Konsolide net debt − Σ(Subsidiary net debt)
- Holding discount sebepleri: Complexity, capital efficiency (ROE << CoE), governance (aile kontrolü), liquidity, macro risk

### Holding Discount Composition
1. Capital efficiency: ROE << cost of equity → value destruction perception
2. Complexity: Multi-sector → analist coverage zorluğu
3. Governance: Aile kontrolü (ör: %63 free float düşük) → minority discount
4. Macro: Türkiye risk primi → conglomerate holding extra discount

---

## 4. Senaryo Analizi Framework

### Bear/Baz/Bull Zorunlu Format

| Senaryo | Olasılık | Varsayımlar | Hedef Fiyat |
|---------|----------|-------------|-------------|
| Bull | %25 | Marj genişlemesi, multiple expansion, catalyst | [X] TL |
| Baz | %50 | Mevcut trend devamı | [Y] TL |
| Bear | %25 | Marj baskısı, çarpan daralması | [Z] TL |

Her senaryo için 3-4 cümle açıklama ZORUNLU: Ne olması lazım? Tetikleyiciler? Marjlar? Çarpanlar?

### Ağırlıklı Hedef Fiyat
- Üç senaryoyu olasılık ağırlıklarıyla hesaplanan tek bir hedef fiyat olarak da sun
- DCF vs ağırlıklı hedef farkı >%20 ise gerekçe zorunlu

---

## 5. Hassasiyet Matrisi (Sensitivity Matrix)

WACC ve terminal büyüme oranı değişimlerinin hisse başı değere etkisi:

| WACC ↓ \ g → | %2,0 | %3,0 | %4,0 | %5,0 |
|---------------|------|------|------|------|
| %16 | ... | ... | ... | ... |
| %18 | ... | **[BAZ]** | ... | ... |
| %20 | ... | ... | ... | ... |
| %22 | ... | ... | ... | ... |

Matris sonrası 2 cümle yorum zorunlu: WACC ±200 bps etkisi, en kritik değişken hangisi

---

## 6. DDM / Gordon Growth Model

```
P = D1 / (Ke − g)
D1 = Son temettü × (1 + büyüme)
g = ROE × retention ratio (veya tarihsel ortalama)
```

- Yalnızca düzenli temettü ödeyen şirketlerde uygula
- Yüksek Ke ortamında (Türkiye %30+) DDM değerleri çok düşük çıkabilir
- 2-aşamalı DDM: Yüksek büyüme dönemi + olgun dönem
- Payout >%100 dönemlerinde Gordon Growth güvenilmez

---

## 7. Araçlar ve Kontrol Kaynakları

| Araç | URL | Kullanım |
|------|-----|----------|
| Damodaran | pages.stern.nyu.edu/~adamodar | ERP, CRP, beta |
| ValueInvesting.io | valueinvesting.io/[TICKER].IS | BIST WACC hazır (kontrol) |
| Alpha Spread | alphaspread.com/security/ist/[TICKER] | WACC lookup |
| GuruFocus | gurufocus.com Turkey market | Piyasa geneli değerleme |

---
