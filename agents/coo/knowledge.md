# COO Agent — Bilgi Bankası (Katman 2)

> Bu dosya gece eğitimlerinden damıtılmış domain bilgisi içerir.
> Normal görevde ihtiyaç duyduğunda `Read` ile aç.
> Gece eğitiminde güncellenir.

---

## 1. Pre-Flight Checklist — Sektöre Göre

### Tüm Sektörler (Standart)

| # | Kontrol | Sorumlu Agent | Aksiyon |
|---|---------|---------------|---------|
| 1 | 5 yıllık KAP finansal tabloları + CF statement | data_collection | Eksikse: KAP URL'i ver, tam tablo iste |
| 2 | Faaliyet raporu PDF | data_collection | Eksikse: Şirket IR sayfasından çek |
| 3 | IAS 29 aktif mi? | parse_standardization | Parasal kazanç ayrıştır |
| 4 | Net Borç doğru formül | reconciliation | Net Borç = Finansal Borç − (Nakit + KV Fin. Yat.) |
| 5 | EBITDA çapraz kontrol | reconciliation | Faaliyet raporundaki EBITDA ile karşılaştır |
| 6 | 28 zorunlu metrik | financial_analysis | Bir eksik bile → output gönderme |
| 7 | Bear/Baz/Bull hedef fiyat | valuation_agent | Truncation olursa: önce hedef fiyatı yaz |
| 8 | SVG grafik + meta-text temizliği | report_formatter | Sıfır boş sayfa, metin sandviç kuralı |

### Bankacılık Ek Kontrolleri
- BDDK regulatory changes (CAR %12, reserve requirements)
- NIM decomposition, Cost of Risk trend, fee income breakdown
- Balance sheet TL/FX currency mismatch
- Reel kredi büyümesi = nominal − enflasyon
- NPL lagging indicator: faiz artışından 6-12 ay sonra sıçrama beklenir

### Savunma / Havacılık Ek Kontrolleri
- Jeopolitik Analiz bölümü macro_analysis'te var mı? (YOKSA → REJECT)
- Ürün portföyü-çatışma uyumu analizi

### Holding Ek Kontrolleri
- Segment bazlı finansal analiz (her major segment ayrı)
- NAV calculation + holding discount
- Parent-level vs consolidated debt breakdown
- Context_extraction'da HOLDING flag'i kontrol

### Enerji / Rafineri Ek Kontrolleri
- Rafineri marjı ($/bbl) analizi
- Brent/WTI korelasyonu
- EPDK/BOTAŞ düzenlemeleri
- Hurmuz / jeopolitik tedarik zinciri riski

### Çelik Ek Kontrolleri
- HRC spot fiyatı korelasyonu
- CBAM yükümlülük hesabı
- AB Safeguard kota etkisi
- EAF dönüşüm yatırımı durumu

### Telekomünikasyon Ek Kontrolleri
- ARPU trend (nominal vs real)
- CAPEX intensity (%25+ tipik)
- Spectrum amortization etkisi
- BTK regulatory transmission

---

## 2. Delivery Check Kriterleri

### HTML/PDF Kontrol
- [ ] 15+ sayfa
- [ ] Sıfır boş sayfa (page-break CSS doğru mu?)
- [ ] SVG veya Canvas grafik: en az 4
- [ ] Agent meta-text temizlenmiş mi?
- [ ] Her tablonun önünde/arkasında yorum metni var mı?
- [ ] Kapak sayfası + İçindekiler + Zorunlu Bildirimler var mı?
- [ ] "Finance X Bağımsız Analizi" etiketi her sayfada mı?

### İçerik Kontrol
- [ ] 28 zorunlu metrik hesaplanmış ve yorumlanmış mı?
- [ ] Skor kartı (6 boyut + genel skor) var mı?
- [ ] Hedef fiyat aralığı (Bear/Baz/Bull) var mı?
- [ ] Ağırlıklı hedef fiyat var mı?
- [ ] Investment recommendation net mi? (BUY/HOLD/SELL)
- [ ] IAS 29 parasal kazanç ayrıştırılmış mı?
- [ ] Cash flow 7 alt bölüm tamamlanmış mı?

---

## 3. Bilinen Hata Pattern'ları ve Çözümleri

### KRİTİK (Tekrar 4+)

| Hata | Çözüm |
|------|-------|
| Working capital eksik (DSO/DIO/DPO/CCC) | Pre-flight'ta financial_analysis kontrol, eksikse upstream'e veri talebi |
| Output truncation | financial_analysis'e: "CORE METRICS önce, supplementary sonra" direktifi |
| Agent meta-text kalmış | report_formatter post-processing regex filter |
| QA FAIL sonrası pipeline devam | conditional_pass → BLOCK (düzeltildi) |
| Valuation crash (exit 143) | Yük bölme: DCF / peer / sensitivity ayrı çalıştır |
| Cash flow toplanmamış | data_collection'a: "KAP CF URL ZORUNLU" direktifi |
| Hedef fiyat yok | valuation_agent'e: "Truncation olursa önce hedef fiyat" |

### YÜKSEK (Tekrar 2-3)

| Hata | Çözüm |
|------|-------|
| Net borç yanlış | reconciliation'a: "TOPLAM YÜKÜMLÜLÜK KULLANMA" direktifi |
| IAS 29 ayrıştırılmamış | parse_standardization'a: "IAS 29 aktif" hatırlatması |
| Platform çıktısı kaynak olarak kullanılmış | Tüm agent'lara: source_document kontrolü |
| EBITDA FY karışıklığı | parse_standardization'a: "FY başlık + tarih teyit" |
| Segment analizi yok (holding) | financial_analysis'e: holding → çift katman direktifi |

---

## 4. Net Borç Tanımı (Doğru Formül)

```
Net Borç = Kısa Vadeli Finansal Borçlar
         + Uzun Vadeli Finansal Borçlar
         − Nakit ve Nakit Benzerleri
         − Kısa Vadeli Finansal Yatırımlar

YANLIŞ: Toplam Yükümlülükler − Nakit (bu net borç DEĞİLDİR)
```

### EBITDA Anomali Tespiti
- EBITDA marjı > sektör normu + 15pp → dış kaynak doğrulaması zorunlu
- İki farklı EBITDA varsa → financial_analysis'e her ikisini de flagle

---

## 5. Sonraki Analiz Başlangıç Direktifleri

Her yeni analiz başlamadan önce MUTLAKA verilecek direktifler:

1. **data_collection:** "Son 5 yıllık KAP + CF statement + faaliyet raporu PDF ZORUNLU"
2. **parse_standardization:** "IAS 29 aktif. Parasal kazanç ayrıştır. EBITDA faaliyet raporundan al. FY teyit et."
3. **reconciliation:** "Net Borç = Finansal Borç − Nakit. TOPLAM YÜKÜMLÜLÜK KULLANMA. EBITDA anomali kontrolü."
4. **financial_analysis:** "Chairman zorunlu 28+ metrik. DSO, DIO, DPO, CCC, OCF/EBITDA, CAPEX/EBITDA dahil. Bir eksik → output gönderme."
5. **valuation_agent:** "DCF, peer, senaryo 3 ayrı bölümde. Bear/Baz/Bull ZORUNLU. Truncation olursa önce hedef fiyat."
6. **report_formatter:** "SVG grafikleri kullan. 15+ sayfa, sıfır boş sayfa, metin sandviç. Agent meta-text YASAK."

---

## 6. Upstream Escalation Protokolü

```
Agent veri bulamazsa:
1. Kendi scope'unda ara (reconciled data, parse output)
2. WebFetch ile KAP'tan çek
3. Upstream agent'a structured request gönder
4. Tüm yollar tükendiyse → CEO'ya escalate, output GÖNDERME
"Veri yok" deyip geçmek YASAK
```

---
