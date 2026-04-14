# Analyst Consensus Agent — Bilgi Bankası (Katman 2)

> Bu dosya gece eğitimlerinden damıtılmış domain bilgisi içerir.
> Normal görevde ihtiyaç duyduğunda `Read` ile aç.
> Gece eğitiminde güncellenir.

---

## 1. BIST Konsensüs Veri Kaynakları

| Kaynak | URL | İçerik |
|--------|-----|--------|
| Investing.com | investing.com/equities/[şirket]-consensus-estimates | Strong Buy/Buy/Hold/Sell/Strong Sell + ort. hedef fiyat |
| SimplyWallSt | simplywall.st/markets/tr | BIST geneli piyasa analizi |
| TradingView | tradingview.com → Turkey stocks forecast | Forecast & analyst ideas |
| CEIC Data | — | Turkey P/E ratio historical (1986-2026) |

---

## 2. Konsensüs Güvenilirlik Kriterleri

| Analist Sayısı | Durum | Aksiyon |
|----------------|-------|---------|
| ≥ 5 | Güvenilir konsensüs | Normal raporla |
| 2-4 | Sınırlı coverage | "Sınırlı coverage" uyarısı ekle |
| 0-1 | Yetersiz | "Konsensüs mevcut değil" yaz |

### Hedef Fiyat Dağılımı
- Standart sapma / ortalama < %15 → Yüksek konsensüs (dar aralık)
- Standart sapma / ortalama > %30 → Belirsiz görünüm (geniş aralık, vurgula)

---

## 3. Revizyon Yönü Trendi (Zorunlu)

Her analist için son 3 ay:
- **Revizyon yönü:** ↑ (yukarı) / ↓ (aşağı) / → (değişmedi)
- **Revizyon büyüklüğü:** % değişim
- **Konsensüs momentum:** Yukarı revizyon sayısı > aşağı revizyon sayısı → pozitif momentum
- **Kriz öncesi/sonrası ayrımı:** Güncelleme tarihi SPESIFIK — kriz öncesi mi sonrası mı?

---

## 4. SELL Analist Zorunlu Açıklama

SELL veya Strong SELL veren HER analist için:
1. **Kurum adı** (İş Yatırım, Yapı Kredi Yatırım, Garanti BBVA, vb.)
2. **Gerekçe özeti** (minimum 3 bullet point)
3. **Hedef fiyat** (TL cinsinden)
4. **Spesifik tarih** (gün/ay/yıl — "Q1 2026" kabul edilmez)

- "SELL var" yazmak yetmez; **neden SELL** sorusunu cevapla
- Azınlıkta kalan SELL görüşü = asimetrik risk sinyali → HER ZAMAN vurgula

---

## 5. Marj / Varsayım Sensitivity Tablosu

### Zorunlu Format
```
| Analist | Kurum | Marj Varsayımı | Implied EBITDA | Hedef Fiyat | Tarih |
|---------|-------|----------------|----------------|-------------|-------|
```

### Sektöre Özel Sensitivity Parametreleri

**Rafineri:**
- Her 0.5 $/bbl rafineri marjı farkı ≈ 2.5-3B TRY EBITDA ≈ ~7-10 TL hisse fiyatı

**Çelik:**
- Her $10/ton HRC değişimi ≈ X TRY EBITDA (şirkete göre hesapla)

---

## 6. Türkiye Aracı Kurum Haritası

### Yerel Aracı Kurumlar (Türkçe raporlar)
- İş Yatırım
- Yapı Kredi Yatırım
- Garanti BBVA Yatırım
- Ak Yatırım
- Deniz Yatırım
- QNB Finansinvest
- Tacirler Yatırım

### Uluslararası Coverage (sadece büyük şirketler)
- Goldman Sachs
- JPMorgan
- HSBC
- Morgan Stanley
- Citi

**Not:** Uluslararası coverage yalnızca büyük BIST şirketlerinde mevcut (TUPRS, TCELL, BIMAS, THYAO)

### Yerel vs Uluslararası Farkları
- Yabancı analistler kur riskini ön planda tutar
- Yerel analistler TRY bazında hedef verir
- Her iki perspektifi ayrı değerlendir

---

## 7. Doğrulama Kuralları

- Doğrulanmış broker verisi olmadan rakamsal konsensüs üretme
- `estimated`, `inferred`, `likely` verileri gerçek konsensüs gibi sunma
- Tahmini dağılım/medyan/revision history yazma — gerekirse `insufficient verified analyst data` de
- Her analist girdisi için kurum adı + rapor tarihi + hedef fiyat kaynağı ver
- Konsensüs modülünde yalnız doğrulanmış snapshot kullan
- Konsensüs çıktısı yapıldıysa downstream agents (strategic_synthesis, final_summary) tarafından alındığını teyit et

---
