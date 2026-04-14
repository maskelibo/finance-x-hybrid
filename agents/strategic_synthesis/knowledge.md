# Strategic Synthesis Agent — Bilgi Bankası (Katman 2)

> Bu dosya gece eğitimlerinden damıtılmış domain bilgisi içerir.
> Normal görevde ihtiyaç duyduğunda `Read` ile aç.
> Gece eğitiminde güncellenir.

---

## 1. Convergence / Divergence Analiz Framework

### Convergence Map (Uyuşan Sinyaller)
- En az 3 agent output cite et — tek kaynakla "consensus" olmaz
- Convergence = güven artırır ama sorgulanmalı (tüm agentlar aynı hatalı veriyi mi kullanıyor?)

### Divergence Map (Çelişen Sinyaller) — ZORUNLU

Her divergence için 4 adım:

```
1. İki çelişen agent output'u cite et
2. Conflict'i net tanımla
3. Reconciliation Hypothesis: Hangisi doğru? Neden çelişiyor?
4. Investment Implication: Yatırım kararına etkisi nedir?
```

### Tipik Divergence Pattern'ları (BIST)

**Macro vs Financial:**
- Segment windfall (ör: refining margin) konsolide nakde dönüşmeyebilir
- Equity method income ≠ cash dividend → OCF'ye yansıma gecikmesi

**Valuation vs Analyst Consensus:**
- DCF çok düşük (yüksek WACC nedeniyle) vs analistler yüksek hedef → varsayım farkını analiz et
- Bu fark "DCF'in yakalamadığı yeniden değerleme bileşeni" olabilir

**Technical vs Fundamental:**
- Teknik güçlü + fundamental zayıf → momentum trade sinyali
- Uzun vadeli yatırım kararı fundamentale dayanmalı

---

## 2. Risk Prioritization Matrix

### Impact × Probability Framework

| Risk | Impact (1-5) | Probability (1-5) | Risk Score | Priority |
|------|--------------|-------------------|------------|----------|
| [En yüksek risk] | 5 | 4 | 20 | P0 |
| ... | ... | ... | ... | P1/P2/P3 |

### Önem Sırası
- **P0 (20-25):** Board-level alarm — investability threat
- **P1 (12-19):** Close monitoring gerekli
- **P2 (6-11):** Awareness level
- **P3 (1-5):** Nice-to-know

---

## 3. Investment Thesis Yapısı

### Net Recommendation Formatı
- BUY (Overweight) / HOLD (Neutral) / SELL (Underweight)
- "Nötr-pozitif" gibi belirsiz ifadeler YASAK
- Veri eksikliği varsa: "HOLD — INSUFFICIENT DATA" de ama belirsizlikte bırakma

### Thesis Template
```
RECOMMENDATION: [BUY/HOLD/SELL] ([Confidence Level])
Current Price: [X] TL
Target Price (12M): [Bear] / [Baz] / [Bull] TL
Upside Potential: ±%X (Base case)
Key Catalysts: [1], [2], [3]
Key Risks: [1], [2], [3]
```

---

## 4. Stratejik Analiz Araçları

### SWOT Framework (BIST Adaptasyonu)
- Holding için: Strengths (scale, diversification) / Weaknesses (NAV discount, complexity) / Opportunities (discount compression) / Threats (de-conglomeration trend)
- Her nokta veri-destekli olmalı
- Güçlü yönler zayıflıkları maskeleyebilir — her iki boyut net yazılmalı

### BCG Matrisi (Sektör Bazlı)
- Pazar büyüme hızı vs pazar payı
- Holding segmentleri için uygulanabilir

### Strategic Positioning
- Market attractiveness–competitive position matrix
- Değer yatırımı: Gerçek değerin altında fiyatlandırılmış hisseler
- Momentum stratejisi: Yükseliş trendindeki hisseleri takip

---

## 5. Bull/Baz/Bear Senaryo Quantification

Her senaryo için zorunlu tablo:

| Parametre | Bull | Baz | Bear |
|-----------|------|-----|------|
| Revenue Growth | %X | %Y | %Z |
| EBITDA Margin | %X | %Y | %Z |
| EPS | X TL | Y TL | Z TL |
| FCF | X B TL | Y B TL | Z B TL |
| Target Price | X TL | Y TL | Z TL |
| Olasılık | %25 | %50 | %25 |

### Ağırlıklı Hedef Fiyat
Weighted Target = Bull × %25 + Baz × %50 + Bear × %25

---

## 6. Çelişkili Upstream Yönetimi

- Çelişkili upstream çıktılar varsa ortalamak YASAK
- Zayıf kaynaklı sayı → `divergence` veya `open question` olarak taşınmalı
- Yönetim anlatısı yatırım tezini zenginleştirir, fakat PDF/doğrudan alıntı eksikse yönetim kredibilitesi puanı bir kademe aşağı çekilmeli
- QA `fail` verdiğinde: en dar doğrulanmış veri zemini merkez alınmalı

### Authoritative Kaynak Sırası
1. Audited financials / KAP annual filing
2. Reconciliation output with explicit formulas
3. Management report summaries
4. Standardization layer

---

## 7. Telekomünikasyon Stratejik Considerations (Örnek)

- Spectrum renewal risk (2042): Regulatory evolution, auction dynamics, 6G transition
- Fiber convergence: Fixed-mobile bundling, Superonline integration
- Digital services: Fintech, cloud/IT, content platforms — beyond connectivity
- International exposure: Ukraine recovery, regional expansion

---
