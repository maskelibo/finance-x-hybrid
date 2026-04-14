# Report Formatter Agent — Bilgi Bankası (Katman 2)

> Bu dosya gece eğitimlerinden damıtılmış domain bilgisi içerir.
> Normal görevde ihtiyaç duyduğunda `Read` ile aç.
> Gece eğitiminde güncellenir.

---

## 1. HTML/CSS Temel Kurallar

### Template Tabanlı Çalışma
- Sıfırdan HTML yazma — `templates/report_base.html` oku ve placeholder'ları doldur
- CSS'i DEĞİŞTİRME — sadece `:root` değişkenlerini brand renkleriyle güncelle
- Tablo genişliklerini DEĞİŞTİRME — `table-layout: fixed` zaten ayarlı

### Profesyonel Styling
- Font: Arial/Helvetica (sans-serif), 11pt body, 14pt headings
- Color Scheme: Navy blue (#003366) headings, gray (#666666) text, white background
- Tables: Border-collapse, alternating row colors (#f9f9f9)
- Charts: Professional color palette (blues, grays) — no neon colors

### Brand Identity Entegrasyonu
```css
:root {
  --brand-primary: [context_extraction.brand_identity.primary_color];
  --brand-secondary: [context_extraction.brand_identity.secondary_color];
  --brand-accent: [context_extraction.brand_identity.accent_color];
  --brand-bg: [default: #f8fafc];
}
```
Tüm başlık, tablo header, KPI bordür renklerinde `var(--brand-primary)` kullan.

---

## 2. Sayfa Kesmesi (Page Break) Kuralları

### DOĞRU CSS
```css
/* Bölüm başlangıcı */
.page { page-break-before: always; }

/* Orphan/Widow kontrolü */
p, li, .analysis-block { orphans: 4; widows: 4; }

/* Başlıklar sayfanın sonuna ASLA kırılmasın */
h1, h2, h3, h4 { page-break-after: avoid; break-after: avoid; }

/* Tablolar bölünmesin */
table { page-break-inside: avoid; }
```

### YANLIŞ — Boş Sayfa Sorunu
```css
/* KULLANMA — her bölümden önce boş sayfa bırakır */
section { page-break-before: always; }
.page { page-break-after: always; }
```

### PDF Uyumluluk
- `page-break-before: always` kullan, `page-break-after: always` KULLANMA
- Fixed header/footer ile sayfa amblemi ve sayfa numarası tekrarı

---

## 3. SVG Grafik Tercihi

- **SVG kullan, Chart.js değil** (COO direktifi)
- Chart.js `<canvas>` elemanları PDF rendering'de sorun yaratabilir
- SVG doğrudan HTML'e embed edilir, harici kütüphane gerektirmez
- Minimum 4 grafik: Revenue trend, segment breakdown, peer benchmarking, scenarios

### Grafik Kuralları
- Her grafiğin önünde 2 cümle, arkasında 3 cümle yorum — **metin sandviç kuralı**
- Veri bloğunu metinsiz bırakma
- `[VERİ YOK]` olan metrikleri tabloda boş bırak — uydurma rakam yazma

---

## 4. HTML Bileşenleri

### KPI Kartları
```html
<div class="kpi-grid"> <!-- 4'lü grid otomatik -->
  <div class="kpi-card">
    <div class="kpi-label">FAVÖK Marjı</div>
    <div class="kpi-value">%42.3</div>
    <div class="kpi-trend">↑ +2.1pp YoY</div>
  </div>
</div>
```

### Skor Kartı
```html
<div class="scorecard">
  <div class="score-item">
    <div class="score-label">Finansal Sağlık</div>
    <div class="score-value">6.5/10</div>
    <div class="score-bar">
      <div class="score-fill" style="width: 65%"></div>
    </div>
  </div>
</div>
```

### SWOT Grid
```html
<div class="swot-grid"> <!-- 2x2 grid otomatik -->
  <div class="swot-strength">Güçlü Yönler</div>
  <div class="swot-weakness">Zayıf Yönler</div>
  <div class="swot-opportunity">Fırsatlar</div>
  <div class="swot-threat">Tehditler</div>
</div>
```

### Senaryo Kutuları
```html
<div class="scenario-grid"> <!-- 3'lü grid otomatik -->
  <div class="scenario bear">Bear Case</div>
  <div class="scenario base">Base Case</div>
  <div class="scenario bull">Bull Case</div>
</div>
```

### Tablo Formatı
- Sayısal sütunlar: `class="num"` (sağa hizalı)
- Tablo headerları: Brand primary arka plan, beyaz metin

---

## 5. PDF Rendering Pipeline

```javascript
const puppeteer = require('puppeteer');
const page = await browser.newPage();
await page.setContent(htmlContent);
await page.pdf({
  path: '[TICKER]_Raporu_[TARIH].pdf',
  format: 'A4',
  printBackground: true,
  margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
});
```

### PDF Kontrol Listesi
- [ ] 15+ sayfa
- [ ] Sıfır boş sayfa
- [ ] Header: Her sayfada şirket adı + rapor tarihi
- [ ] Footer: Sayfa numarası + "Finance X Platform | Confidential"
- [ ] Page breaks: Her major section yeni sayfada

---

## 6. Kapak Sayfası

```html
<div class="cover-page" style="background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));">
  <div class="brand-mark">Finance X | Kurumsal Araştırma</div>
  <h1>[ŞİRKET ADI]</h1>
  <div class="ticker">[TİCKER].IS</div>
  <div class="report-date">[GG.AA.YYYY]</div>
</div>
```

### Her Sayfa Header
```html
<div class="page-header">
  <div class="page-header-left">
    <span class="company-ticker">[TICKER]</span>
    <span class="report-section">[Bölüm Adı]</span>
  </div>
  <div class="page-header-right">
    <div class="brand-mark">[TICKER]</div>
  </div>
</div>
```

---

## 7. Telif Hakkı Kuralları

**Yapılabilir (Legal):**
- Şirketin kamuya açık kurumsal renklerini kullanmak
- Kurumsal rapor estetiğinden ilham almak
- Ticker/adını header'a koymak

**YASAK:**
- Şirketin orijinal layout/grafik tasarımını kopyalamak
- Şirketten çıkmış izlenimi vermek
- Logoyu izinsiz kullanmak (sadece ticker metni)

**Her sayfada:** "Finance X Bağımsız Analizi" etiketi ZORUNLU

---

## 8. Agent Meta-Text Temizleme (Post-Processing)

Markdown'dan KALDIR:
- "Agent ID:", "Output ID:", "Session ID:", "Timestamp:", "Task ID:", "Runtime Mode:", "Analysis Mode:"
- "[rerun: bN]", "Processing Time:", "Confidence:", "Status:"
- Emoji (detaylı bölümlerde) — sadece skor kartı/executive summary'de kalabilir

---
