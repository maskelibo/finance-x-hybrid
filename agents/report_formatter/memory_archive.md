# Report Formatter Agent — Bilgi Defteri

## Kimlik Kartı

| Alan | Bilgi |
|---|---|
| Ajan Adı | Report Formatter Agent |
| Uzmanlık | Rapor Formatlama ve Sunum |
| Oluşturma Tarihi | 2026-04-10 |
| Bağlı Olduğu Ajan | Final Summary Agent (upstream), CEO (downstream) |
| Toplam Eğitim Gecesi | 0 (yeni oluşturuldu) |
| Ortalama Öğrenme Puanı | N/A |

---

## Temel Yetenek Haritası

| Konu | Seviye (1–10) | Not |
|---|---|
| Markdown temizleme | 1 | Yeni oluşturuldu |
| Tablo formatlama | 1 | ASCII tablo formatları öğrenilecek |
| Executive summary yazımı | 1 | C-level ton ve yapı |
| Görsel hiyerarşi | 1 | Box-drawing characters |
| İçerik distillation | 1 | Uzun raporu özet executive summary'ye sıkıştırma |

---

## Öğrenme Geçmişi

### [2026-04-10] Oluşturulma

**Oluşturma Sebebi:** Chairman direktifi — "Yöneticiye böyle boktan rapor verilmez. Raporu alsın en son raporu güzelleştirsin biraz her yerde yıldızlar var kareler var raporda olmaz böyle yönetici özeti sadece şık grafiklerle bölümlerine güzel ayrılmış sağlam dolu bir rapor yazacak."

**Misyon:**
- Markdown yıldız/emoji/kare temizleme
- Executive-grade format
- Şık tablolar, bölüm hiyerarşisi
- Profesyonel dil ve ton

**İlk Görev:** Bir sonraki raporda (KCHOL tekrar veya başka şirket) devreye alınacak

---

## Birikimli Bilgi Bankası

### Anahtar Kavramlar

- EREGL raporlarında upstream sayı paketleri çakışabiliyor; HTML raporda görünür bir `source hierarchy` notu ile `reconciliation_output` ve `financial_analysis_output` çekirdeğini önceliklendir.
- PDF uyumluluğu için `page-break-before: always` kullan, `page-break-after: always` kullanma; fixed header/footer ile sayfa amblemi ve sayfa numarası tekrarını sağla.
- Kurumsal raporda çubuk/grafik bloklarının önünde ve arkasında kısa analiz metni zorunlu; veri bloğunu metinsiz bırakma.

*(Öğrenilen temel kavramlar buraya eklenir)*

### Kaynak Arşivi

*(Güvenilir kaynaklar ve referanslar buraya eklenir)*

### Uygulama Örnekleri

*(Somut uygulama örnekleri buraya eklenir)*

---

## KPI Takip Tablosu

| Tarih | Hedef | Sonuç | Puan |
|---|---|---|---|
| — | — | — | — |

---

## Güçlü Yönlerim

*(Henüz belirlenmedi — ilk rapor formatlama sonrası ortaya çıkacak)*

## Gelişim Alanlarım

*(Henüz belirlenmedi — ilk rapor formatlama sonrası ortaya çıkacak)*

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu

### Eksikler:
- **HTML raporu YARIM KALMIŞ:** Output kesilmiş, tamamlanmamış HTML — CSS styling başlamış ama KPI cards, charts, content sections eksik
- **PDF dönüşümü YOK:** HTML → PDF pipeline çalıştırılmamış
- **Chart.js grafikleri oluşturulmamış:** Script tag var ama hiçbir canvas/chart element yok — finansal trendler, segment breakdown grafikleri eksik
- **Chairman formatına uyumsuz:** Koç Holding iç denetim raporu formatı değil — professional styling var ama yapı uyumsuz

### Bundan Sonra:
- HTML raporu TAMAMLA — yarım HTML output YASAK
- Chart.js ile şu grafikleri oluştur: (1) Revenue trend (line), (2) Segment breakdown (pie), (3) Peer benchmarking (bar), (4) Holding discount evolution (line)
- HTML tamamlandıktan sonra puppeteer/wkhtmltopdf ile PDF oluştur — final output PDF olmalı
- Chairman formatı uygula: 12 bölümlü yapı, professional header/footer, page breaks, skor kartı özel formatting
- Agent meta-text'leri (Session ID, Agent ID, Runtime Mode) HTML rendering öncesi temizle — post-processing filter ekle
- Cover page, table of contents, executive summary ayrı sayfalarda — pagination doğru olmalı

---

---

## CEO Geri Bildirimi — 2026-04-11 — TCELL Raporu (İKİNCİ GÖREV — TEKRAR BAŞARISIZ)

### Eksikler:
- **HTML raporu TEKRAR YARIM KALMIŞ:** KCHOL'da da yarım kalmıştı, TCELL'de de — sadece CSS başlangıcı var, content yok
- **PDF dönüşümü YOK:** Hiç denenmemiş
- **Chart.js implementation YOK:** Script tag var ama canvas/chart yok
- **Chairman 12-bölümlü format UYGULANMAMIŞ:** İki raporda da (KCHOL, TCELL) aynı hata

### Bundan Sonra:
- **HTML raporu TAM TAMAMLAMA ZORUNLU — truncation YASAK, CEO'ya önce escalate et**
- **Chairman 12-bölümlü yapı ZORUNLU:** Kapak → İçindekiler → Yönetici Özeti → ... → Zorunlu Bildirimler
- **Chart.js charts minimum 4:** Revenue trend, segment breakdown, peer benchmarking, scenarios
- **PDF generation:** Puppeteer, A4, margins 20mm, page breaks enforced
- **Agent meta-text temizleme:** "Agent ID:", "Session ID:", emoji, markdown artifacts — hepsini çıkar

---

## CEO Geri Bildirimi — 2026-04-10 — KCHOL Raporu (İLK GÖREV — BAŞARISIZ)

### Eksikler:
- **Agent ÇALIŞMADI:** "I'm ready to continue" dedi ama hiçbir output üretmedi — final_summary'den gelen raporu formatlayıp HTML/PDF'e dönüştürmedi
- **HTML raporu YARIM KALMIŞ:** CSS styling başladı ama KPI cards, charts, content sections, mandatory 12-section structure — hiçbiri tamamlanmadı
- **PDF dönüşümü YOK:** HTML → PDF pipeline (puppeteer/wkhtmltopdf) hiç tetiklenmedi
- **Chart.js grafikleri oluşturulmadı:** Revenue trend, segment breakdown (pie), peer benchmarking (bar), holding discount evolution (line) — hiçbiri yok
- **Chairman formatına uyumsuz:** Koç Holding iç denetim raporu formatı uygulanmadı

### BUNDAN SONRA — ZORUNLU KURALLAR:

**1. Agent Çalışma Protokolü:**
- "I'm ready to continue" DEĞİL, doğrudan raporu al, formatla, output üret
- Input: final_summary markdown raporu
- Processing: Temizleme → HTML dönüşümü → Chart.js grafikleri → PDF rendering
- Output: (1) Formatted HTML file, (2) Professional PDF file

**2. HTML Raporu ZORUNLU Bileşenleri:**

**A. Chairman 12-Section Structure:**
1. Kapak Sayfası (Şirket logo placeholder, rapor tarihi, hazırlayan)
2. İçindekiler Tablosu (sayfa numaraları ile)
3. Yönetici Özeti (1-2 sayfa, skor kartı ile)
4. Şirket Profili
5. Finansal Analiz
6. Değerleme
7. Sektör ve Rekabet
8. Makroekonomik Bağlam
9. Risk Değerlendirmesi
10. Sonuç ve Öneriler
11. Ekler (detaylı tablolar)
12. Zorunlu Bildirimler (disclaimer, veri kaynakları)

**B. Visual Components (Chart.js):**
- Revenue Trend (Line Chart): 5-year revenue + EBITDA trend
- Segment Breakdown (Pie Chart): Revenue by segment (%, TRY billions)
- Peer Benchmarking (Bar Chart): KCHOL vs SAHOL ROE, ROCE, Net Debt/EBITDA
- Holding Discount Evolution (Line Chart): NAV vs Market Cap gap over time

**C. Skor Kartı (Special Formatting):**
```html
<div class="scorecard">
  <div class="score-item">
    <div class="score-label">Finansal Sağlık</div>
    <div class="score-value">6.5/10</div>
    <div class="score-bar"><div class="score-fill" style="width: 65%"></div></div>
  </div>
  <!-- Repeat for all 6 dimensions -->
</div>
```

**D. Agent Meta-Text Temizleme (Post-Processing Filter):**
Şu ifadeleri markdown'dan KALDIR:
- "Agent ID:", "Output ID:", "Session ID:", "Timestamp:", "Task ID:", "Runtime Mode:", "Analysis Mode:"
- "[rerun: bN]", "Processing Time:", "Confidence:", "Status:"
- Emoji (✅, ❌, ⚠️) — sadece skor kartı ve executive summary'de kalabilir, detaylı bölümlerde YASAK

**3. PDF Rendering Pipeline:**
```javascript
const puppeteer = require('puppeteer');
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(htmlContent);
await page.pdf({
  path: 'KCHOL_Raporu_2026-04-10.pdf',
  format: 'A4',
  printBackground: true,
  margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
});
```

**4. Chairman Format Compliance:**
- **Header:** Her sayfada şirket adı + rapor tarihi
- **Footer:** Sayfa numarası + "Finance X Platform | Confidential"
- **Page Breaks:** Her major section yeni sayfada başlamalı
- **Professional Styling:**
  - Font: Arial/Helvetica (sans-serif), 11pt body, 14pt headings
  - Color Scheme: Navy blue (#003366) headings, gray (#666666) text, white background
  - Tables: Border-collapse, alternating row colors (#f9f9f9)
  - Charts: Professional color palette (blues, grays), no neon colors

**5. İlk Çalışma Kontrol Listesi (Bir Sonraki Rapor):**
- [ ] final_summary markdown'ı oku
- [ ] Agent meta-text'leri temizle (regex filter)
- [ ] 12-section structure'a uygun HTML oluştur
- [ ] Chart.js ile 4 temel grafiği embed et
- [ ] Skor kartını özel formatting ile render et
- [ ] Puppeteer ile PDF'e dönüştür
- [ ] HTML + PDF output'u kaydet
- [ ] CEO'ya "READY FOR REVIEW" notification gönder

---

## ❌ KRİTİK FEEDBACK — 2026-04-11 — TCELL PDF BOŞLUK SORUNU

### KULLANICI ŞİKAYETİ:

**"PDF versiyonunda 1 sayfa veri 1 sayfa boşluk olarak gidiyor"**

**Tespit:** TCELL_Yonetim_Kurulu_Raporu_20260411.pdf incelendi:
- Sayfa 2: TAMAMEN BOŞ
- Sayfa 4: TAMAMEN BOŞ
- Sayfa 3: Yönetici Özeti (normal)
- Sayfa 5: Finansal Performans Trendi (normal)

**SORUN:** PDF rendering sırasında CSS `page-break` ayarları yanlış yapılmış. Her bölüm yeni sayfada başlaması gerekiyor ama **boş sayfa bırakmamalı**.

### KÖK NEDEN ANALİZİ:

Muhtemel sebep CSS'te şu hatalı ayarlar:
```css
/* YANLIŞ — her bölümden önce sayfa boşluğu bırakıyor */
section {
  page-break-before: always;
}

/* VEYA */
.page {
  page-break-after: always;
}
```

Bu ayarlar her bölümden önce yeni sayfa açıyor ama eğer bölüm zaten yeni sayfadaysa, bir boş sayfa daha ekleniyor.

### DOĞRU CSS PAGE-BREAK AYARLARI:

```css
/* DOĞRU — boş sayfa BIRAKMA */
.page-break {
  page-break-after: avoid;
  page-break-inside: avoid;
}

/* Major section başlangıçları için */
.section-major {
  page-break-before: always;
  page-break-inside: avoid;
}

/* Minor section başlangıçları için — sayfanın sonundaysa kaydır, değilse aynı sayfada kal */
.section-minor {
  page-break-before: auto;
  page-break-inside: avoid;
}

/* Tablolar kesilmesin */
table {
  page-break-inside: avoid;
}

/* Grafik ve KPI kartları kesilmesin */
.chart-container, .scorecard {
  page-break-inside: avoid;
}
```

### PDF RENDERİNG PUPPETEERpage-break configuration:

```javascript
await page.pdf({
  path: output_path,
  format: 'A4',
  printBackground: true,
  margin: {
    top: '20mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm'
  },
  preferCSSPageSize: false, // A4 fixed size kullan
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">TCELL Kurumsal Analiz Raporu</div>',
  footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
});
```

### TEST CHECKLIST (PDF Boşluk Kontrolü):

PDF oluşturulduktan sonra şu kontrolü YAP:
```
1. PDF'i oku (Read tool ile 1-10 sayfaları)
2. Her sayfayı kontrol et: İçerik var mı?
3. Eğer 2+ ardışık boş sayfa varsa → CSS page-break hatası VAR
4. Boş sayfa tespit edilirse → CSS'i düzelt, PDF'i yeniden oluştur, tekrar kontrol et
5. Boş sayfa yoksa → CEO'ya "PDF READY FOR REVIEW" bildir
```

### BUNDAN SONRA — PDF QA PROTOKOLÜ:

Her PDF output'tan SONRA (CEO'ya göndermeden önce):
```
1. PDF'i Read tool ile oku (ilk 5 sayfa)
2. Boş sayfa tespit et
3. Eğer boş sayfa varsa:
   a. CSS page-break ayarlarını gözden geçir
   b. Puppeteer rendering options kontrol et
   c. Düzelt
   d. PDF'i yeniden oluştur
   e. Tekrar kontrol et
4. Boş sayfa yoksa → CEO'ya gönder
```

### ÖLÇÜLEBİLİR HEDEFLER:

- [ ] **Bir sonraki PDF'te:** Sıfır boş sayfa
- [ ] **Her PDF'te:** Automated blank page detection (Read tool ile ilk 10 sayfa check)
- [ ] **CSS standardı:** Yukarıdaki doğru page-break ayarlarını şablon olarak kullan

### BAŞARISIZLIK KRİTERİ:

Eğer kullanıcı "PDF'te boş sayfalar var" derse = **REPORT_FORMATTER QA FAILED**.

Bu TCELL'de OLDU. PDF'i CEO'ya göndermeden önce KONTROL ETMEN GEREKİYORDU.

**Bundan sonra:** PDF QA ZORUNLU — boş sayfa kontrolü YAP, temiz PDF teslim et.

---

## 🎨 LAYOUT RULES — TCELL KAP RAPORU REFERANS (11 Nisan 2026)

### SORUN: TABLOLAR ALTTA ALTA DIZILMIŞ, SAĞA SOLA YAYGIN DEĞİL

**Chairman feedback:** "Bizim raporlarda grafikler/tablolar alt alta, TCELL KAP raporundaki gibi grafik sağda metin solda olsun."

### LAYOUT PATTERN ANALİZİ (TCELL 2025 Entegre Faaliyet Raporu):

**Sayfa 60-65 analizi:**

**Pattern 1: 60/40 Asimetrik (En yaygın)**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────────────────────┐  ┌──────────────────┐   │
│  │                      │  │                  │   │
│  │   METIN BÖLÜMÜ       │  │    GÖRSEL        │   │
│  │   (Sol - %60)        │  │   (Sağ - %40)    │   │
│  │                      │  │                  │   │
│  │   - Başlık           │  │   [Fotoğraf/     │   │
│  │   - Paragraflar      │  │    Grafik]       │   │
│  │   - Bullet points    │  │                  │   │
│  │                      │  │                  │   │
│  └──────────────────────┘  └──────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**CSS Implementation:**
```css
.layout-60-40 {
  display: grid;
  grid-template-columns: 60% 38%;
  gap: 2%;
  margin: 20mm;
}

.text-section {
  padding-right: 20px;
}

.visual-section {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Pattern 2: 30/40/30 Triple (Kompleks sayfalar)**
```
┌─────────────────────────────────────────────────────┐
│  ┌──────┐  ┌────────────────┐  ┌──────────────┐   │
│  │METIN │  │   GÖRSEL       │  │   METIN      │   │
│  │(Sol  │  │   (Orta %40)   │  │   KUTUSU     │   │
│  │ %30) │  │   [Büyük       │  │   (Sağ %30)  │   │
│  │      │  │    Fotoğraf]   │  │              │   │
│  │Bullet│  │                │  │   • Detay    │   │
│  │points│  │                │  │   • Açıklama │   │
│  └──────┘  └────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────┘
```

**CSS Implementation:**
```css
.layout-30-40-30 {
  display: grid;
  grid-template-columns: 28% 40% 28%;
  gap: 2%;
}

.info-box {
  background: #f0f8ff;
  border-left: 4px solid #003366;
  padding: 15px;
}
```

**Pattern 3: Mix Layout (Grafik + Tablo aynı sayfada)**
```
┌─────────────────────────────────────────────────────┐
│  BAŞLIK + METIN (Full Width)                       │
│                                                     │
│  ┌───────────────────┐  ┌──────────────────────┐  │
│  │   LINE CHART      │  │   BAR CHART          │  │
│  │   (Sol %50)       │  │   (Sağ %50)          │  │
│  └───────────────────┘  └──────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │   TABLO (Full Width)                        │  │
│  │   [Kredi Derecelendirme Tablosu]            │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌────────────────────────────────────────────┐   │
│  │   BÜYÜK FOTOĞRAF (Full Width, %60 height)  │   │
│  └────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### ZORUNLU LAYOUT KURALLARI:

**1. ASLA ALT ALTA DİZME:**
```
❌ YANLIŞ:
[Grafik 1]
[Grafik 2]
[Grafik 3]
[Tablo 1]

✅ DOĞRU:
[Metin | Grafik 1]
[Grafik 2 | Tablo 1]
[Büyük Fotoğraf]
```

**2. HER SAYFADA MİNİMUM BİR GÖRSEL:**
- Fotoğraf, grafik, tablo, icon grid — en az biri olmalı
- Tamamen metin sayfalar YASAK (istisnai durumlar hariç)

**3. BEYAZ ALAN KULLANIMI:**
- Sayfa margin: 20mm (üst/alt/sol/sağ)
- Element arası gap: 15-20px
- Paragraf spacing: 1.5× line height

**4. TİPOGRAFİ HİYERARŞİSİ:**
```css
h1 { font-size: 24pt; color: #003366; font-weight: bold; margin-bottom: 20px; }
h2 { font-size: 18pt; color: #003366; font-weight: bold; margin-bottom: 15px; }
h3 { font-size: 14pt; color: #333; font-weight: bold; margin-bottom: 10px; }
body { font-size: 11pt; color: #333; line-height: 1.6; font-family: 'Arial', sans-serif; }
caption { font-size: 9pt; color: #666; font-style: italic; }
```

**5. RENK PALETİ (TCELL KAP Standardı):**
```css
:root {
  --primary-blue: #003366;    /* Başlıklar */
  --accent-blue: #0066cc;     /* Linkler, vurgular */
  --light-blue: #f0f8ff;      /* Bilgi kutuları background */
  --text-dark: #333;          /* Ana metin */
  --text-light: #666;         /* İkincil metin */
  --border-gray: #ddd;        /* Tablo borderları */
  --bg-white: #fff;           /* Sayfa background */
}
```

**6. GRAFİK BOYUTLANDIRMA:**
- Yan yana grafikler: Her biri max %48 width (gap %4)
- Tek grafik: Max %60 width (metin %38, gap %2)
- Full-width grafik: %100 (sadece çok önemli grafikler için)

**7. TABLO STİLİ:**
```css
table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

thead {
  background: #003366;
  color: white;
  font-weight: bold;
}

tbody tr:nth-child(even) {
  background: #f9f9f9;
}

td, th {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}
```

### SAYFA DÜZENİ ŞABLONdosyası (HTML):

**Şablon 1: Finansal Performans Sayfası**
```html
<div class="page">
  <header>
    <h1>Finansal Performans Trendi</h1>
  </header>
  
  <div class="layout-60-40">
    <div class="text-section">
      <h2>Güçlü Büyüme ve Marj İyileşmesi</h2>
      <p>Turkcell'in 2025 hasılatı %13.8 artarak 241.5 milyar TL'ye ulaştı...</p>
      <ul>
        <li>5G abone tabanı %45 genişledi</li>
        <li>ARPU %8.5 arttı</li>
        <li>Fiber abone +%12</li>
      </ul>
      <p><strong>FAVÖK marjı %43.1'e yükseldi</strong>, bu sektör ortalamasının...</p>
    </div>
    
    <div class="visual-section">
      <canvas id="revenueChart" width="400" height="300"></canvas>
    </div>
  </div>
  
  <div class="layout-50-50" style="margin-top: 30px;">
    <div>
      <h3>Hasılat Trendi (2020-2025)</h3>
      <canvas id="trendChart" width="350" height="250"></canvas>
    </div>
    <div>
      <h3>FAVÖK Marjı Karşılaştırması</h3>
      <canvas id="marginChart" width="350" height="250"></canvas>
    </div>
  </div>
</div>
```

### CEO QUALITY GATE (LAYOUT):

**Rapor kabul kriterleri:**
- [ ] Hiçbir sayfada 3+ ardışık tablo/grafik alt alta dizilmemiş
- [ ] En az %60 sayfalarda yan yana layout var (60/40 veya 30/40/30)
- [ ] Her sayfada en az 1 görsel element (grafik/fotoğraf/icon)
- [ ] Beyaz alan kullanımı uygun (margin 20mm, gap 15-20px)
- [ ] Renk paleti TCELL standardına uygun (#003366 primary blue)

**Eğer bu kriterlermeet edilmezse:**
- Output = **REJECT**
- "Layout eski format (alt alta dizilmiş), TCELL KAP standardına çevir (60/40 asimetrik)"

---

## 📝 WORDING + LAYOUT ENFORCEMENT (11 Nisan 2026)

**Final_summary'den gelen markdown'ı formatlıyorsun. İki zorunlu işlem:**

1. **WORDING:** Her tablo sonrasında yorum paragrafı var mı? Yoksa ekle.
2. **LAYOUT:** Tabloları/grafikleri yan yana diz (60/40 veya 50/50), alt alta YASAK.

**İlk kez uygulanacak rapor:** TCELL (yeniden çalıştırılacak)

---

*Dosya sahibi: Report Formatter Agent | Denetleyen: CEO*

---

## Eğitim Gecesi — 2026-04-13 (Batch 4/4)

### 2026 Kurumsal Rapor Trend Öğrenmeleri

**1. PDF + Dijital format ikilisi zorunlu hale geldi:**
- Kurumsal raporlar artık hem print-ready A4 PDF hem dijital interaktif format sunuyor
- Chart.js / Tableau / embedded vizualizasyon → dijital versiyonlarda standart
- KPMG/PWC illustrative financial statements: bölüm hiyerarşisi, tablo stili, tipografi referans kılavuzları

**2. Veri hikaye anlatımı (Data Storytelling) standardı:**
- Her grafik veya tablo sonrasına "yorum paragrafı" zorunlu (bağlam + implication)
- Tablo sonrası "Bu rakamlar ne anlama geliyor?" sorusunu cevapla
- Vismeco/Redokun 2026 annual report design: grafik + kısa yorum + metrik öne çıkarma

**3. Boşluk ve okunabilirlik kriterleri (2026 standardı):**
- White space %30-40 sayfa alanı → okuyucu yorgunluğunu azaltır
- 1.6 line height body metin; tablo hücre padding min 10px
- Mobile-responsive HTML: CSS media queries ile tablet/mobil uyum

**4. CEO Quality Gate Güncellemesi — Yeni Zorunlu Adım:**
- PDF'te boş sayfa var mı? → Read tool ile ilk 10 sayfa kontrol (daha önce kaydedilmişti)
- Veri kalite uyarı kutusu (P0/P1) Yönetici Özeti altında → sarı/turuncu uyarı kutusu
- Belirsiz metrik dipnotu standardı: "(*) Tahmini; kaynak: [X]; güven: ORTA"

### Öğrenme Puanı: 62/100
*Temel format bilgisi mevcut; ancak hiç tamamlanmış rapor üretmemiş. İlk tam çıktıda puan revizyonu yapılacak.*

---

## CEO Geri Bildirimi — 2026-04-12 — TUPRS Raporu

### Eksikler:
- **Veri kalitesi uyarıları raporda görünmüyor:** QA'nın P0/P1 tespitleri (valuation crash+recovery, hisse adedi çelişkisi, EBITDA belirsizliği) HTML raporda hiçbir yerde belirtilmiyor. Chairman raporu okurken bilgi boşluklarının farkında olmalı.
- **Değerleme bölümü eksik veriye dayandığını belirtmiyor:** Valuation section tamamlandı ama EBITDA'daki %15.2 belirsizlik, kullanılan EBITDA değeri ve güven aralığı dipnot olarak yer almıyor.
- **Bazı bölümler minimum içerik eşiğinin altında olabilir:** 84,756 karakter toplam hacim görünürde büyük ama bazı bölümler tek paragraf mı yoksa tam içerik mi kontrolü yapılmadı. Özellikle "KAP Olayları" bölümü event_timeline_alert BLOCKED nedeniyle eksik kalmış olabilir.
- **PDF çıktı doğrulaması yapılmadı:** Puppeteer uyumluluğu beyan edildi ama gerçekten PDF'e dönüştürüldü mü ve sayfa sayısı (15-20 A4) uygun mu doğrulanmadı.

### Bundan Sonra:
- **"Veri Kalite Uyarıları" kutusu HTML raporun Yönetici Özeti'nin hemen altında ZORUNLU:** QA P0/P1 sorunları, çözüm durumu ve okuyucuya etkisi sarı/turuncu uyarı kutusuyla gösterilmeli. Gizlemek yanıltıcı olur.
- **Her bölüm için minimum içerik eşiği kontrolü:** Bölüm başına minimum 3 paragraf + 1 tablo. Altında kalırsa formatter "INCOMPLETE — upstream data eksik" notu ekleyip CEO'ya flag açar.
- **Belirsiz metrikler için dipnot formatı standardize edilmeli:** "(*) Bu değer tahminidir; kaynak: [X]; güven: ORTA; 17 Nisan KAP açıklamasıyla revize edilecektir." formatında dipnot.
- **PDF validation son adım olmalı:** Puppeteer ile PDF üret, sayfa sayısını doğrula (min 12, max 25 A4), boş sayfa yok, tüm grafikler rendering olmuş — bu kontrolleri tamamlandı olarak raporla.

---

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu

### Pozitif Noktalar:
- ✅ **HTML rapor üretildi (EREGL brand colors ile):** Rapor mavi-gri renk paleti uygulandı, EREGL kurumsal renkleri doğru kullanıldı.
- ✅ **12 bölümlü yapı iskelet oluşturuldu.**

### Eksikler:

1. **PDF çıktı doğrulaması belirsiz:**
   - HTML → PDF dönüşümü yapıldı mı? Boş sayfa kontrolü (Read tool ile ilk 10 sayfa) uygulandı mı? TUPRS raporundaki lesson unlearned olabilir.

2. **Veri kalitesi uyarı kutusu eksik:**
   - Eğitim gecesi (Batch 4/4) kuralından: "Veri kalite uyarı kutusu (P0/P1) Yönetici Özeti altında → sarı/turuncu uyarı kutusu." EREGL raporunda parse_standardization EBITDA hatası (%66 sapma) P0 seviyesinde bir sorun. Bu uyarı kutusu raporda görünmesi gerekirdi.

3. **KAP Olayları bölümü eksik olabilir:**
   - event_impact_mapper çıktısı eksikti. Bu bölüm "INCOMPLETE — event_impact_mapper çıktısı mevcut değil" notu ile işaretlendi mi?

4. **Belirsiz metrik dipnot formatı uygulandı mı?:**
   - EBITDA, Net kâr, Net Borç gibi doğrulanmamış veriler için "(*) Bu değer tahminidir; kaynak: [X]; güven: ORTA" formatı uygulandı mı belirsiz.

### Bundan Sonra:

- **Çelik şirketi raporu için ek bölüm → "Emtia Göstergesi Paneli":**
  ```html
  <div class="commodity-dashboard">
    <h2>Emtia ve Sektör Göstergeleri (Nisan 2026)</h2>
    <div class="layout-30-30-30">
      <div class="kpi-box">HRC Avrupa: €720/ton</div>
      <div class="kpi-box">Demir Cevheri: $95/ton</div>
      <div class="kpi-box">Kok Kömürü: $190/ton</div>
    </div>
  </div>
  ```

- **Veri kalite uyarı kutusu — EREGL spesifik:**
  ```html
  <div class="warning-box" style="background:#fff3cd; border-left:5px solid #ffc107; padding:15px;">
    <strong>⚠️ VERİ KALİTESİ UYARISI (P0):</strong>
    Reconciliation ajanı FAIL aldı (skor: 0.35/1.0). 
    EBITDA parse hatası tespit edildi (34,025B TRY → doğrulanan: 20,451B TRY).
    Bu rapordaki finansal göstergeler doğrulanmış web kaynakları ile çapraz doğrulandı.
    Q2 2026 KAP açıklaması sonrası revize edilecektir.
  </div>
  ```

- **AB Safeguard countdown sayacı (Temmuz 2026 için):**
  - "Kota değişikliğine: X gün" formatında görsel sayaç — bu sektör spesifik urgency element olarak eklenmeli.

## CEO Geri Bildirimi — 2026-04-13 — EREGL Raporu
### Eksikler:
- HTML iskeleti güçlü ama görünen çıktı yine tamamlanmış rapor seviyesinde değil; içerik gövdesi kesiliyor.
- Authoritative sayı çatışmasını yönetme niyeti doğru olsa da dipnot/kaynak sistemi yeterince görünür değil.
- Chairman'ın 12 bölümlü yapısı ve zorunlu bildirim blokları tamamlanmış içerik olarak görünmüyor.
- Formatlama aşamasında içerik güvenilirliği filtresi tam uygulanmamış.
### Bundan Sonra:
- Eksik veya kesilmiş HTML'yi teslim etme; render öncesi tamlık kontrolü yap.
- Report formatter authoritative fact base dışındaki sayıları otomatik dışlamalı.
- Her tabloda dipnot veya kaynak satırı formatı zorunlu olsun.
- Chairman 12-bölümlü şablon tamamlanmadan final artefact üretme.

## Purge 2026-04-21 23:11 — 14 section (en yeni: 2026-04-16)

## CEO Geri Bildirimi — 2026-04-16 — THYAO Remediation (thyao-remediation-20260416)

### Eksikler:
- **HTML_ENVELOPE eksik — COO doğru BLOCKED ketti ✓** — HTML envelope olmadan report teslim edilemez. COO'nun bu kontrolü yapması olumlu iyileşme.
- **SPK_DISCLAIMER eksik** — Zorunlu Bildirimler bölümü dahil edilmedi. SPK disclaimer olmadan rapor yayımlanamaz.
- **~8KB içerik — 50KB direktifi 4. kez ihlal edildi** — MIN_PAYLOAD_SIZE = 50KB direktifi 4 rapordur uygulanmıyor. Havacılık raporu minimum: Yönetici Özeti + Finansal Analiz + Değerleme + Sektör + Risk = 50KB+ zorunlu.
- **Self-check döngüsü tetiklenmedi** — HTML oluşturulmadan önce kendi zorunlu kontrol listesi çalıştırılmadı; HTML_ENVELOPE ve SPK_DISCLAIMER eksikliği önceden tespit edilebilirdi.
- **THY marka kimliği belirsiz** — Kırmızı (#E31E24), Noto Sans tipografisi, IST havalimanı / uçak görseli kapak — marka kimliği şablona bağlanmadı.

### Bundan Sonra:
- **HTML tesliminden önce zorunlu self-check (4. direktif, kesinleşti):**
  1. HTML_ENVELOPE mevcut mu?
  2. SPK_DISCLAIMER var mı?
  3. Toplam boyut ≥50KB mı?
  4. THY brand identity (kırmızı #E31E24) uygulandı mı?
  Bu 4 kontrol geçmeden COO'ya teslim etme.
- **MIN_PAYLOAD_SIZE 50KB = hard bloker** — 50KB altı HTML COO tarafından reddedilecek; bu kontrolü COO delivery checklist'te sabit.
- **THYAO brand identity checklist:** (1) THY kırmızı #E31E24 başlık/accent, (2) IST/uçak görseli kapakta, (3) IATA kodu + hisse kodu kapak tablosunda, (4) Yönetim beyanı bölümü.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Standard Institutional Raporu

### Eksikler:
- **HTML_ENVELOPE eksik** — `<html>` veya `</html>` tag'i yok; COO tarafından BLOCKED. Bu hata basit kontrol; formatter kendi çıktısında `<html lang="tr">...</html>` olduğunu teyit etmeli.
- **SPK_DISCLAIMER eksik** — "yatırım tavsiyesi değildir" footer'da veya zorunlu bildirimler bölümünde olmak zorunda; her THYAO raporunda şart.
- **8KB içerik — 15 sayfa standard rapor için yetersiz** — Delta'da 7KB, standard'da 8KB. final_summary içeriği HTML'ye aktarılmadı ya da çok minimal işlendi.
- **THY brand identity uygulandı mı belirsiz** — context_extraction çok detaylı brand bilgisi üretmişti (#E81932 kırmızı, turkuaz tablo headerları, İstanbul silueti kapak motifi). Bu bilgiler HTML'ye yansıtıldı mı doğrulanamadı.
- **SVG grafik sayısı bilinmiyor** — 8KB HTML'de min 4 SVG grafik üretilmiş olamaz.

### Bundan Sonra:
- **Çıktı göndermeden önce self-check zorunlu:**
  1. `<html lang="tr">...</html>` tam envelope mevcut?
  2. Footer veya Zorunlu Bildirimler bölümünde "yatırım tavsiyesi değildir" var?
  3. Boyut ≥ 50KB? (7-8KB = içerik yok anlamına gelir)
  4. Min 4 SVG grafik var?
  5. 12 bölüm başlığı HTML'de mevcut?
- **THYAO brand checklist (her THYAO raporunda):**
  1. Kırmızı (#E81932) header bantları + tablo arka planları
  2. THY logosu (kuş silueti) kapak + iç sayfa header
  3. Turkuaz (#008B8B) tablo header rengi (KAP finansal tablo standardı)
  4. İstanbul silueti kapak görseli (açık gri grafik)
  5. Footer: kırmızı sayfa numarası + "Finance X Platform | Confidential"
- **final_summary içeriğini 12 bölüme map et** — final_summary markdown/metin geldiğinde formatter şunu yapar: Bölüm I = Yönetici Özeti → Skor Kartı + hedef fiyat tablo; Bölüm III → Finansal tablolar; vb. Mapping olmadan "boş HTML" çıktısı yasak.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Delta-Update Raporu

### Eksikler:
- **HTML 7073 bytes — gerçek içerik YOK** — COO "MIN_PAYLOAD_SIZE ≥ 5KB PASS" verdi ama 7KB bir sayfaya denk gelir; min 15 sayfa = 50KB+ beklenir. CSS + iskelet + minimal içerik ile gerçek rapor üretilmedi.
- **12 bölüm içeriği yok** — Sadece HTML envelope, style ve tek tablo (COO check tablosu gibi görünen basit yapı) mevcut. 12 bölümün hiçbirinin içeriği yok.
- **SVG grafik yok** — Min 4 SVG grafik zorunlu; çıktıda hiçbiri yok.
- **THY brand identity uygulanmadı** — Kırmızı (#E81C28) başlık bantları, THY logosu, kapak görsel formatı, uçak ikonu — hiçbiri uygulanmadı.
- **final_summary metin içeriği HTML'ye dönüştürülmedi** — final_summary kapsamlı içerik üretti (yönetim analizi, senaryo anlatısı, risk bölümleri); formatter bunları HTML formatına çevirmedi.
- **QA FAIL durumunda formatter çalışmamalıydı** — QA score 0 ile formatter aktifleşmeli değil. Ancak COO "approved" kararı verdiği için formatter çalıştı. Gerçekte formatter da "QA FAIL → içerik yok → BLOCKED" kararı verebilirdi.

### Bundan Sonra:
- **MIN_PAYLOAD_SIZE eşiği 50KB olarak güncelle** — 5KB eşik anlamsız; 15 sayfa A4 rapor = 50-150KB HTML. COO ile birlikte bu eşiği güncellemeyi talep et.
- **THY brand identity checklist (THYAO her raporunda):**
  1. Kırmızı (#E81C28) header bantları + tablo header arka planı
  2. THY logosu (kuş/daire silueti) kapak ortası + iç sayfa sağ üst
  3. Kapak: tam sayfa fotoğraf benzeri arka plan + kırmızı overlay + "Türk Hava Yolları AO — THYAO"
  4. Footer: kırmızı sayfa numarası + "Finance X Platform | Confidential"
- **QA FAIL sinyali geldiğinde formatter self-check ekle** — `if qa_decision in ["fail", "conditional_pass"] → formatter_status = "BLOCKED — QA kapısı geçilmedi"; içerik üretme, COO'ya bildir.`
- **final_summary içeriğini HTML'ye dönüştür** — final_summary markdown/metin gelirse formatter bunu 12 bölüme map eder. Mapping olmadan "boş HTML" üretmek YASAK.

## CEO Direktifi — 2026-04-16 — EREGL Deep Dive Raporu (UNBLOCKED)

**Session:** eregl-deep-dive-20260415
**Durum:** CEO Override Onaylandi (ceo-rev-eregl-20260416-001) — REPORT_FORMATTER AKTİF

### Zorunlu Override Kosullari (COND-1 → COND-4)
1. **COND-1:** Authoritative fact base DIŞINDA hiçbir sayı raporda yer almaz. parse_standardization ham BS çıktısı (ticari borç = 19,628mn) KULLANILMAZ; doğru değer = 68,762mn TRY [KAP Not 8].
2. **COND-2:** Yönetici Özeti altına Veri Kalite Uyarı Kutusu (sarı/turuncu) ZORUNLU. İçeriği:
   - "DISC-004: Ticari Borç — parse kaydı (19,628mn TRY) KAP Not 8 değeriyle (68,762mn TRY) uyuşmuyor. Bu raporda Not 8 (doğrulanmış birincil kaynak) kullanılmaktadır. Parse kaydı düzeltme sürecindedir."
3. **COND-3:** Raporda DPO ve CCC değerleri financial_analysis Not 8 tabanlı değerlerden alınır.
4. **COND-4:** CEO onaylı bilgi seti kullanılır; parse_standardization ham çıktısı kullanılmaz.

### Kilitli Fact Base (SADECE BU DEĞERLER KULLANILIR)
| Metrik | Değer | Kaynak |
|---|---|---|
| Net Borç | 42,864mn TRY | KAP Not 7 |
| EBITDA | 20,452mn TRY | Mgmt/İş Yatırım |
| Revenue | 208,910mn TRY | KAP IS |
| FCF | 49,717mn TRY | KAP CF |
| EV | 245,584mn TRY | FA hesap |
| EV/EBITDA | 12.01x | FA |
| Hedef Fiyat Bear | 15.7 TRY | Valuation |
| Hedef Fiyat Baz | 28.4 TRY | Valuation |
| Hedef Fiyat Bull | 42.2 TRY | Valuation |
| Ticari Borç | 68,762mn TRY | KAP Not 8 |
| Net Kar FY2025 | 694mn TRY | KAP (IAS 29 dahil) |
| adj NI (IAS 29 sonrası) | -182mn TRY | QA hesap |
| OCF | 65,056mn TRY | KAP CF |
| D&A | 11,296mn TRY | KAP CF |

### EREGL Brand Identity
- Renk: Lacivert #003366 (heading), kırmızı #D71920 (accent/skor), beyaz background
- Logo: Her sayfada EREGL / Erdemir logosu (üst sol)
- Tam unvan: "Ereğli Demir ve Çelik Fabrikaları T.A.Ş. — EREGL"
- Kapak tablosunda: EREGL BIST kodu, 16 Nisan 2026 rapor tarihi, "Finance X Platform | Kurumsal Analiz"
- Sektör görseli: Çelik fabrikası / yüksek fırın konsepti

### Teslim Paketi Gereksinimleri
- HTML tam tamamlanmış (truncation YASAK)
- PDF A4 margins 20mm (Puppeteer)
- Min 15 sayfa, 0 boş sayfa
- Min 4 SVG grafik: (1) Revenue/EBITDA/FCF 5Y trend, (2) EV/EBITDA peer karşılaştırma, (3) Bear/Baz/Bull senaryo bar, (4) HRC fiyat vs EBITDA marjı korelasyon
- Metin sandviç kuralı tüm tablolarda uygulanmış
- `content_frozen: true` kontrolü render öncesi
- Teslim sinyali: `HTML path + PDF path + page count + chart inventory + override_conditions_met: [COND-1✅, COND-2✅, COND-3✅, COND-4✅]`

## CEO Geri Bildirimi — 2026-04-16 — THYAO Tam Analiz (thyao-full-20260416)

### Eksikler:
- **HTML_ENVELOPE eksik → COO BLOCKED ✓** — COO doğru karar verdi. `<html lang="tr">...</html>` tam sarmalayıcı olmadan HTML çıktısı geçersiz. Self-check bu hatayı yakalamamış.
- **SPK disclaimer eksik** — "Bu rapor yatırım tavsiyesi değildir" footer notu zorunlu; atlandı.
- **8KB içerik — 50KB min eşiği çok altında** — Gerçek rapor içeriği 8KB; hedef minimum 50KB (~15 sayfa A4). Bu eşik 3 analizdir uygulanmıyor.
- **4 SVG grafik kontrolü yapılmadı** — Kural min 4 SVG; self-check sırasında grafik sayısı doğrulanmadı.
- **Self-check döngüsü çalışmadı** — Format completion check (HTML envelope, SPK, boyut, SVG sayısı, 12 bölüm) teslimden önce yapılmalıydı; yapılmadı.
- **THY marka renkleri uygulanmadı** — #E81932 kırmızı (heading/accent), turkuaz tablo başlıkları THYAO raporunun görsel kimliği. Uygulanıp uygulanmadığı kontrol edilmedi.

### Bundan Sonra:
- **Self-check THYAO zorunlu 6 kontrol (teslimden önce):**
  1. HTML tam envelope: `<html lang="tr">` açılış + `</html>` kapanış → PASS/FAIL
  2. SPK disclaimer footer: "Bu rapor yatırım tavsiyesi değildir" → PASS/FAIL
  3. Dosya boyutu ≥50KB → PASS/FAIL (50KB altı = BLOCKED)
  4. SVG grafik sayısı ≥4 → PASS/FAIL
  5. 12 bölüm başlığı mevcut → PASS/FAIL
  6. Marka renkleri: #E81932 THYAO kırmızı header → PASS/FAIL
  Herhangi biri FAIL → teslim YOK, fix yapılır.
- **THY marka kimliği:** Kırmızı #E81932 (heading/accent), turkuaz tablo başlıkları, her sayfada THY logosu üst sol. Kapak: THYAO BIST kodu + rapor tarihi + "Finance X Platform | Kurumsal Analiz".
- **50KB minimum = konfigürasyon olarak güncel** — Min 50KB eşiği kod seviyesinde yeni standart; 8KB eşiği artık geçersiz.

## CEO Geri Bildirimi — 2026-04-16 — THYAO Full Analiz (thyao-full-20260416-v4)

### Eksikler:
- **HTML_ENVELOPE eksik → COO BLOCKED ✓** — COO doğru karar verdi. `<html lang="tr">...</html>` tam sarmalayıcı olmadan HTML çıktısı geçersiz; self-check bu hatayı yakalamamış.
- **SPK_DISCLAIMER eksik — 5. ihlal** — "Bu rapor yatırım tavsiyesi değildir" footer zorunlu direktif; 5 turda uygulanmadı. Artık kod seviyesinde şablona gömülmeli.
- **Dosya boyutu 8KB — 50KB eşiğinin çok altında (5. ihlal)** — Her turda aynı hata; MIN_PAYLOAD_SIZE direktifi 5 kez verildi. Kod değişikliği olmadan bu hata tekrarlanacak.
- **THYAO marka renkleri (#E81932, lacivert #1C2B50) uygulanmadı** — Finance X mavi/amber renk paleti kullanıldı; THYAO kurumsal kimliği uygulanmadı.
- **4 SVG grafik kontrolü yapılmadı** — Kural min 4 SVG; self-check sırasında grafik sayısı doğrulanmadı.
- **Self-check döngüsü çalışmadı** — 6 zorunlu kontrol (HTML envelope, SPK, boyut, SVG, bölümler, marka rengi) teslimden önce yapılmadı.

### Bundan Sonra:
- **HTML_ENVELOPE + SPK_DISCLAIMER = şablon olarak sabit (kod değişikliği gerekli)** — Bu iki element hiçbir koşulda atlanamaz. Template dosyasına gömülü; dinamik içerik eksik olsa bile sarmalayıcı ve footer sabit kalır.
- **50KB minimum = renderer seviyesinde kontrol** — Çıktı render edilmeden önce byte size ölçülür; <50KB → padding mekanizması veya "İçerik genişlet" tetikleyicisi. 8KB ile teslim artık teknik olarak bloke.
- **THYAO self-check 6 zorunlu adım (teslimden önce otomatik):**
  1. HTML tam envelope: `<html lang="tr">` + `</html>` → PASS/FAIL
  2. SPK disclaimer footer mevcut → PASS/FAIL
  3. Dosya boyutu ≥50KB → PASS/FAIL (altı = BLOCKED)
  4. SVG grafik sayısı ≥4 → PASS/FAIL
  5. 12 bölüm başlığı mevcut → PASS/FAIL
  6. Marka rengi #E81932 header'da → PASS/FAIL
  Herhangi biri FAIL → teslim YOK; otomatik fix + tekrar kontrol.
- **THYAO marka kimliği sabit referans:** #E81932 kırmızı (heading/accent), #1C2B50 lacivert (sidebar/nav), turkuaz tablo başlıkları. Finance X mavi/amber paleti THYAO raporunda kullanılamaz.

## CEO Geri Bildirimi — 2026-04-15 — EREGL Raporu

### Eksikler:
- **Yan yana layout kontrolü doğrulanamadı** — COO "PASS" verdi ama gerçek HTML'de 60/40 yan yana layout'un kaç sayfada uygulandığı kontrol edilmedi. "Page-break ihlali yok" kontrolü yapıldı ✓ ama layout oranı ölçülmedi.
- **Header/footer her sayfada var mı?** — COO kontrol matrisinde header/footer satırı yok. Şirket adı + rapor tarihi (header) ve sayfa numarası + "Finance X Platform | Confidential" (footer) her sayfada kontrol edilmeli.
- **Her grafik/tablo sonrasında yorum paragrafı kontrolü** — 18 tablo mevcut ✓; ancak her tablonun ardında 3-5 cümle yorum paragrafı olup olmadığı kontrol edilmedi. "Data Storytelling" kuralı.
- **"Metin sandviç" kuralı doğrulaması** — Her tablo öncesinde "neden bakıyoruz" ve sonrasında "ne anlıyoruz" paragrafı; bu kontrolün kanıtı yok.
- **5 yıllık finansal seri eksikliği rapor formatına yansımadı** — FY2021-2023 verileri "[VERİ YOK]" yerine "[KISMI VERİ — 2 yıl]" olarak Veri Kalite Uyarı kutusuna eklenmeli.

### Eksikler Değil — İyi Uygulamalar ✓:
- 12/12 bölüm mevcut ✓
- 6 inline SVG grafik ✓
- 18 tablo ✓
- DISC-004 + IAS29 uyarı kutusu ✓
- Brand rengi #D71920 × 44 kullanım ✓
- Agent meta-text temizlendi ✓

### Bundan Sonra:
- **Layout oranı kendi kendine kontrol et** — HTML'de `<div style="display:flex">` veya CSS grid kullanımını say; en az %60 sayfada yan yana yapı zorunlu. COO'nun geçirmesini bekleme; kendi kontrol listeni tamamla.
- **Header/footer zorunlu kontrol** — Her bölüm başlangıcında header CSS'i ve footer CSS'i doğrula; eksik sayfa varsa ekle.
- **Veri eksikliğini Veri Kalite Uyarı kutusuna ekle** — FY2021-2023 seri eksikliği, MACD/VWAP teknik eksiklikler, CF kısmi olması — bunlar uyarı kutusunda ayrı satır olarak listelenebilir.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu
### Eksikler:
- HTML iskeleti guclu olsa da Chairman'in istedigi sirket-brand taklidi, yan yana veri-gorsel dengesi ve PDF kaniti final teslim seviyesinde dogrulanmadi.
- Formatter, eksik hedef fiyat ve eksik makro gibi iceriksel blocker'lari yeterince yukari tasimadan estetik tamamlama modunda kaldi.
### Bundan Sonra:
- Formatter self-check'te `content blockers` ve `presentation blockers` ayri listelensin; iceriksel blocker varsa render sonlandirma.
- Nihai teslim paketi her zaman `HTML path`, `PDF path`, `chart inventory`, `page count`, `overflow check` ve `release blocker listesi` ile gelsin.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Raporu Post-Report Loop
### Eksikler:
- HTML tarafi yapisal olarak yakin olsa da brand identity taklidi, metin-gorsel 60/40 dengesi ve PDF teslim kaniti checklist seviyesinde kapatilamadi.
- Formatter, authoritative fact pack kilitlenmeden leverage, FCF, hedef fiyat ve makro bloklarini estetik olarak duzeltmeye calisarak iceriksel riskleri maskeledi.
### Bundan Sonra:
- Formatter render oncesi `content frozen` kontrolu yapacak; hedef fiyat, skor karti, makro bolumu ve kritik sayilar kilitlenmeden son HTML/PDF uretilmeyecek.
- Teslim paketi her zaman `HTML + PDF + page count + chart inventory + overflow/orphan check + remaining blocker listesi` ile gelecek; yalniz HTML var demek yetmez.

## CEO Geri Bildirimi — 2026-04-15 — TCELL Post-Report Feedback Loop
### Eksikler:
- HTML artefakti teknik olarak guclu olsa da saf teslim sozlesmesi bozuldu; belge disi metin, iceriksel blocker'lar ve teslim kaniti ayni anda yonetilemedi.
- Formatter, eksik makro ve eksik skor karti gibi icerik sorunlarini `render hazir` sinyali vermeden once sert fail etmedi.
### Bundan Sonra:
- Formatter yalniz sunum katmani degil, `deliverable contract` koruyucusu olarak calisacak; `<!DOCTYPE>` disi metin, eksik kapanis, eksik PDF veya eksik chart inventory varsa teslim etmeyecek.
- `content blocker` ve `presentation blocker` ayri tablolar halinde raporlanacak; content blocker aciksa guzel HTML bile release-ready sayilmayacak.

## CEO Geri Bildirimi — 2026-04-14 — THYAO Raporu

### Eksikler:
- **HTML raporu üretilmedi** — Rapor BLOCKED (QA 0.757 < 0.80) olduğu için report_formatter beklemede; bu doğru ✓. Ama "Critical Status Report" çıktısı yerine blocking status'u CEO'ya yapılandırılmış escalation ile bildirmesi gerekirdi.
- **Blocking issues özeti iyi yapılandırıldı ✓** — CF, equity gap, WC üç bloker net tablo ile gösterildi.
- **SVG grafikleri üretilmedi** — Bloker nedeniyle beklemede; CF çözüldüğünde SVG min 4 grafik zorunlu.
- **THYAO brand identity talimatı** — Rapor üretildiğinde THY markası (kırmızı/beyaz, renk kodu #E31E24, Noto Sans tipografisi, uçak görselleri) kullanılmalı. Kurumsal kimlik taklit zorunlu.

### Bundan Sonra:
- **BLOCKED durumda "Critical Status Report" değil "CEO Escalation" gönder** — Format: BLOCKER-1/2/3 | sorumlu agent | çözüm adımı | deadline. Rapor yerine yapılandırılmış escalation.
- **Havacılık raporu için brand identity checklist:**
  1. THY kırmızı (#E31E24) başlık/accent rengi
  2. Uçak veya IST havalimanı görseli kapak sayfasında
  3. Yönetim beyanı (CEO/Chairman mektubu) bölümü
  4. IATA code, hisse kodu, borsa kodu kapak tablosunda
- **CF bloker çözülünce ilk önce** — Grafik #1: Gelir/EBITDA/NP 5Y trend (LINE) | Grafik #2: Yolcu/Kargo/Teknik segment dağılımı 2024 (PIE) | Grafik #3: Peer EV/EBITDAR karşılaştırması (BAR) | Grafik #4: Bear/Baz/Bull senaryo kutuları (SVG).

## CEO Geri Bildirimi — 2026-04-14 — BIMAS Raporu

### Eksikler:
- **HTML body tamamen yok — en kritik P0 hata** — Çıktı yalnızca CSS kodundan oluşuyor; `<body>` içeriği hiç gelmiyor. 12 bölümden yalnızca 1.5 bölüm (Kapak + Yönetici Özeti başlangıcı) teslim edildi. Bu QA'nın COO tarafından "0.64 REVISION_NEEDED" olarak doğru tespit ettiği P0 sorundur.
- **HTML kapatma etiketleri eksik** — `</body></html>` yok; tarayıcı otomatik repair edecek ama PDF render hatalı.
- **BIMAS brand identity uygulanmadı** — BIM kurumsal renkleri (turuncu #F47B20 veya kırmızı, lacivert) kullanılmadı. BIM logosu yok. Her sayfada şirket kimliği zorunlu.
- **CSS ve temel yapı doğru ✓** — DOCTYPE, head, meta, responsive CSS, @page direktifleri, grid layout tanımlandı. Altyapı hazır; içerik yok.

### Bundan Sonra:
- **HTML truncation için kritik kural:** Output limiti aşılacaksa önce Kapak + Yönetici Özeti + Finansal Analiz bölümlerini teslim et; sonra ikinci mesajda Değerleme + Sektör + ... şeklinde devam et. CSS'i tek seferde gönder (kısa tutulursa), içeriği bölümler halinde ekle. **Hiçbir zaman sadece CSS gönderme.**
- **BIMAS brand identity checklist:**
  1. BIM renk paleti: Turuncu #F47B20 (primary), Lacivert #003366 (secondary), Beyaz background
  2. BIM logosu kapak sayfasında ve header'da
  3. "BIM Birleşik Mağazalar A.Ş." tam unvan + BIMAS BIST kodu kapakta
  4. Kurumsal slogan varsa footer'da
- **Tour 3 önceliği:** CF blocker çözülmeden tam HTML üretemezsin; ancak mevcut veriyle 12 bölümlü iskelet oluştur, CF gerektiren bölümleri "[CF ESTIMATED — doğrulama bekleniyor]" kutusuyla doldur. Boş bırakma.
- **COO check koordinasyonu:** HTML teslim edince COO checkini BEKLE; "teslim ettim, COO onayı bekliyorum" bildirimi gönder. Onay gelmeden PDF render tetikleme.

## CEO Geri Bildirimi — 2026-04-14 — KCHOL Delta Raporu

### Eksikler:
- **HTML truncated — COO P0 olarak tespit etti** — CSS kısmı açık ama body tagı kapanmamış; mid-table kesilme var. 53.502 karakter üretildi ama COO "PDF render başarısız" kararı verdi.
- **17 placeholder dolduruldu ✓ — Chart.js yok ✓** — Bunlar başarılı.
- **SVG grafik kalitesi doğrulanamadı** — "4 inline SVG grafik" üretildi denildi; COO truncation nedeniyle grafiklerin tam render edilip edilmediğini kontrol edemedi.
- **Koç Holding brand identity uygulandı mı belirsiz** — KCHOL renkleri (lacivert, kırmızı Koç logosu), tipografi, her sayfada logo — truncated HTML nedeniyle doğrulanamadı.
- **CSS yazıldı ama HTML body tamamlanamadı** — Truncation önceki pattern ile aynı; BIMAS'ta da aynı hata vardı. "CSS gönderdim, içerik gelecek" modeli işe yaramıyor.
- **COO ile koordinasyon eksik** — "HTML teslim ettim, COO onayı bekliyorum" bildirimi gönderilmedi. COO output'u zaten "REVISION_NEEDED" ilan etmişti.

### Bundan Sonra:
- **HTML'yi 3 parçada gönder** — Parça 1: CSS + Kapak + Yönetici Özeti (en önemli) | Parça 2: Finansal Analiz + Değerleme + Sektör | Parça 3: Makro + Teknik + ESG + Sonuç + Zorunlu Bildirimler. Her parça ayrı tam HTML bloğu; birleştirme report_formatter'ın görev değil.
- **HTML kapanma tag kontrolü** — Her parçanın sonunda `</section></main></body></html>` var mı kontrol et. Kapanmayan tag = PDF render hatası.
- **KCHOL brand identity checklist** — Koç Holding lacivert (#003366), kırmızı (#C41E3A Koç logosu rengi), Koç Holding logosu kapakta, "KOÇ HOLDİNG A.Ş." tam unvan + KCHOL BIST kodu, her sayfada header logo.
- **COO checkpoint bekle** — HTML teslim edince CEO/COO'ya "Parça X teslim edildi — kapanış kontrolü yapılsın" bildirimi gönder; onay gelmeden PDF tetikleme.

## CEO Geri Bildirimi — 2026-04-14 — SAHOL Raporu

### Eksikler:
- **HTML üretilmedi** — Sadece specification belgesi hazırlandı; gerçek HTML/PDF çıktısı yok.
- **CEO direktifi beklendi — uygun** — BLOCKED durumu doğru tespit edildi, Option A/B sunuldu.
- **Option B'de 12 bölüm hazır denildi ama bölüm V "⚠️ Bölüm 5 truncated" olarak işaretlendi** — Eksik veriyle "hazır" iddiası yanlış; eksik satırlar "PLACEHOLDER" olarak açıkça belirtilmeliydi.
- **Sabancı marka kimliği specification'da tanımlandı ama uygulanmadı** — Kırmızı/lacivert gradient, logo yerleşimi şablona eklenmedi.

### Bundan Sonra:
- **"Hazır" iddiası YASAK, eksik varsa:** "Section V: ⚠️ financial_analysis Bölüm 5 eksik — placeholder konuldu, CEO onayı bekleniyor" formatında şeffaf bildir.
- **BLOCKED = CEO'ya iki seçenek + süre tahmini:** Option A (strict) ve Option B (conditional proceed) her zaman sunulacak. Süre tahmini her seçenek için ayrı belirtilecek.
- **Şirket marka kimliği şablona bağlanacak:** Sabancı Holding için: kırmızı (#E2001A) + lacivert (#003087) renk paleti, Sabancı logosu her sayfada üst sol köşe — bir kez tanımlanır, tüm raporlarda uygulanır.
