# Final Summary Agent — Bilgi Bankası (Katman 2)

> Bu dosya gece eğitimlerinden damıtılmış domain bilgisi içerir.
> Normal görevde ihtiyaç duyduğunda `Read` ile aç.
> Gece eğitiminde güncellenir.

---

## 1. Rapor Yapısı — 12 Bölüm (Chairman Formatı)

1. **Kapak Sayfası** — Şirket adı, ticker, rapor tarihi, hazırlayan
2. **İçindekiler Tablosu** — Sayfa numaralarıyla
3. **Yönetici Özeti** — 1-2 sayfa, skor kartı ile (C-level için)
4. **Şirket Profili** — İş modeli, segmentler, tarihçe
5. **Finansal Analiz** — Tüm zorunlu metrikler + yorumlar
6. **Değerleme** — DCF, multiples, senaryolar
7. **Sektör ve Rekabet** — Porter, peer benchmarking, SWOT
8. **Makroekonomik Bağlam** — TCMB, enflasyon, FX, jeopolitik
9. **Risk Değerlendirmesi** — Risk matrix, mitigation strategies
10. **Sonuç ve Öneriler** — Investment recommendation, target price
11. **Ekler** — Detaylı tablolar, appendix
12. **Zorunlu Bildirimler** — Disclaimer, veri kaynakları (ASLA rapor dışında bırakılmamalı)

---

## 2. Skor Kartı Template (Zorunlu)

| Boyut | Skor (1-10) | Benchmark | Açıklama (2-3 cümle) |
|-------|-------------|-----------|----------------------|
| Karlılık | X/10 | [Peer/sector ref] | [EBITDA margin, ROE, trend] |
| Likidite | X/10 | [Benchmark] | [Cari oran, Net Debt/EBITDA] |
| Kaldıraç | X/10 | [Benchmark] | [Faiz karşılama, borç yapısı] |
| Nakit Akışı | X/10 | [Benchmark] | [FCF, OCF/EBITDA, CAPEX] |
| Büyüme | X/10 | [Guidance] | [Revenue growth, pazar payı] |
| Yönetim Kalitesi | X/10 | [Governance] | [ESG, YK, strateji uyumu] |
| **GENEL SKOR** | **X.X/10** | **[Kategori]** | **[Özet yorum]** |

---

## 3. Investment Recommendation Format

```
RECOMMENDATION: [BUY/HOLD/SELL] ([Overweight/Neutral/Underweight])
Current Price: [X] TL
Target Price (12M): [Baz] TL (Bear: [Y] TL — Bull: [Z] TL)
Upside Potential: ±%X (Base case)
Ağırlıklı Hedef Fiyat: [W] TL (Bull×25% + Baz×50% + Bear×25%)
Key Catalysts: [1], [2], [3] + tahmini tarihler
Key Risks: [1], [2], [3]
```

---

## 4. Hedef Fiyat Metodolojisi (3 Yöntem Ağırlıklı)

### Standart Ağırlıklar
- DCF: %50
- EV/EBITDA Multiples: %30
- SOTP veya Temettü Yield: %20

### Emtia/Enerji Ağırlıkları
- EV/EBITDA: %40, DCF: %35, Temettü Verimi: %15, PE: %10

### Çelik Ağırlıkları
- EV/EBITDA: %40, DCF: %35, Temettü Verimi: %15, EV/ton: %10

### Valuation Agent Degraded Durumunda
- Financial_analysis DCF + strategic_synthesis hedeflerini kullan
- Raporda "Valuation Agent DEGRADED" notu açıkça belirtilmeli

---

## 5. Executive Summary Yazım Kuralları

### Stil
- Sade dil, karmaşık terimlerden kaçınma
- C-level audience — teknik jargon minimize
- Güncel ve doğru veriler kritik
- Chain-of-Thought yaklaşımıyla mantıksal akış

### İçerik
- Investment thesis (1 paragraf)
- Recommendation + target price
- Key catalysts + key risks
- Skor kartı özeti

### Sentez Teknikleri
- Extractive: Key metrics preservation (revenue, margins, growth)
- Abstractive: Analitik yorum + bağlam
- Çelişen bilgileri tespit edip çözüm önerisi sun

---

## 6. Belirsizlik Sınıflandırması

Kurumsal raporda belirsizliği saklamak değil sınıflandırmak kritik:
- **Doğrulanmış:** Audited/KAP kaynaktan teyitli
- **Tahmini:** Hesaplama veya proxy ile elde edilmiş
- **Spekülatif:** Varsayıma dayalı
- **Contestable:** Farklı kaynaklar çelişiyor → her iki değer gösterilmeli

### CONTESTED Etiketi
- Hisse adedi tutarsızlığı → KAP temettü matematiği ile cross-check
- EBITDA çelişkisi (parse vs web) → her iki değer ayrı senaryolarda
- FCF terminolojisi: reconciliation "FCF" etiketi aslında finansman nakit akışı olabilir → OCF−CAPEX doğru tanım

---

## 7. Delta Update Formatı

Önceki rapordan neyin değiştiğini işaretle:
- [DELTA: Hedef fiyat X → Y TL] etiketi veya tablo notu
- Kilit metriklerin revizyonlarında delta oku

---

## 8. Sektöre Özel Rapor Notları

### Rafineri
- Rafineri marjı ($/bbl) ve Hurmuz jeopolitik senaryosu ayrı bölüm
- Hisse adedi tutarsızlığı → CONTESTED + KAP temettü matematği

### Çelik
- P/E tükenmiş kazanç döneminde anlamsız → EV/EBITDA ve PD/DD temel çarpanlar
- AB safeguard en kritik risk faktörü — EBITDA'nın %30-40'ını etkileyebilir
- Avrupa gelir payı her zaman öne çıkarılmalı

### Holding
- Segment bazlı analiz + NAV + holding discount her raporda zorunlu
- Spin-off senaryoları varsa Bull case'e dahil et

---

## 9. Temizlik Kontrol Listesi

Rapor output'a gönderilmeden önce:
- [ ] Agent meta-text temizlenmiş mi? ("Session ID", "Agent ID", "Runtime Mode" gibi)
- [ ] Emoji kaldırılmış mı? (sadece skor kartında kalabilir)
- [ ] 12 bölüm tamamlanmış mı?
- [ ] Grafik verileri [CHART:TYPE] tag'leri var mı?
- [ ] Hedef fiyat aralığı var mı?
- [ ] Zorunlu Bildirimler bölümü var mı?
- [ ] Truncation yok mu? (Yarım bölüm YASAK)

---
