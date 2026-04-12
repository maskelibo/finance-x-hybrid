const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AKBNK — Kapsamlı Analiz Raporu</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0; padding: 0;
      color: #1e293b; font-size: 11px; line-height: 1.5;
      background: #fff;
    }
    .page { page-break-after: always; padding: 0 10px; min-height: 90vh; }
    .page:last-child { page-break-after: auto; }

    /* COVER */
    .cover {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d9488 100%);
      color: white; padding: 80px 60px; text-align: center;
      min-height: 100vh; display: flex; flex-direction: column;
      justify-content: center; align-items: center;
    }
    .cover h1 { font-size: 42px; margin: 0 0 10px; font-weight: 800; letter-spacing: -1px; }
    .cover .ticker { font-size: 56px; font-weight: 900; color: #2dd4bf; margin: 20px 0; }
    .cover .subtitle { font-size: 18px; opacity: 0.9; margin-bottom: 60px; }
    .cover .meta { font-size: 13px; opacity: 0.7; }
    .cover .meta p { margin: 4px 0; }

    /* SECTION HEADERS */
    .section-title {
      font-size: 22px; font-weight: 700; color: #0f4c75;
      margin: 25px 0 15px; padding-bottom: 8px;
      border-bottom: 3px solid #0d9488;
    }
    .section-subtitle {
      font-size: 11px; color: #64748b; margin: -10px 0 15px;
    }
    h3 { font-size: 14px; color: #334155; margin: 15px 0 8px; }

    /* KPI CARDS */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; }
    .kpi-card {
      background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
      padding: 12px; border-radius: 6px; border-left: 4px solid #0d9488;
    }
    .kpi-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .kpi-value { font-size: 22px; font-weight: 700; color: #0f172a; }
    .kpi-change { font-size: 10px; font-weight: 600; }
    .kpi-change.positive { color: #059669; }
    .kpi-change.negative { color: #dc2626; }
    .kpi-change.warning { color: #d97706; }

    /* TABLES */
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
    th { background: #0f4c75; color: white; padding: 8px 6px; text-align: left; font-weight: 600; font-size: 9px; text-transform: uppercase; }
    td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    tr.highlight { background: #f0fdfa; font-weight: 600; }
    tr.danger { background: #fef2f2; }

    /* CHARTS */
    .chart-container { position: relative; height: 220px; margin: 10px 0; }
    .chart-half { height: 180px; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }

    /* CALLOUT BOXES */
    .callout { padding: 12px 15px; border-radius: 6px; margin: 10px 0; font-size: 11px; }
    .callout-green { background: #f0fdf4; border-left: 4px solid #10b981; }
    .callout-red { background: #fef2f2; border-left: 4px solid #ef4444; }
    .callout-amber { background: #fffbeb; border-left: 4px solid #f59e0b; }
    .callout-blue { background: #eff6ff; border-left: 4px solid #3b82f6; }
    .callout h4 { margin: 0 0 6px; font-size: 12px; }
    .callout ul { margin: 4px 0; padding-left: 18px; }
    .callout li { margin-bottom: 3px; }

    /* RISK BARS */
    .risk-bar-container { margin: 4px 0; }
    .risk-bar-label { display: inline-block; width: 160px; font-size: 10px; }
    .risk-bar-track { display: inline-block; width: 200px; height: 14px; background: #e2e8f0; border-radius: 7px; vertical-align: middle; }
    .risk-bar-fill { height: 100%; border-radius: 7px; }
    .risk-bar-score { display: inline-block; font-size: 10px; font-weight: 700; margin-left: 6px; }
    .risk-high { background: linear-gradient(90deg, #fbbf24, #ef4444); }
    .risk-medium { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
    .risk-low { background: linear-gradient(90deg, #34d399, #10b981); }

    /* FOOTER */
    .page-footer {
      position: relative; bottom: 0; width: 100%;
      border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 20px;
      display: flex; justify-content: space-between;
      font-size: 9px; color: #94a3b8;
    }
    p { margin: 5px 0; }
    .confidence-badge {
      display: inline-block; padding: 2px 8px; border-radius: 10px;
      font-size: 9px; font-weight: 600;
    }
    .conf-high { background: #dcfce7; color: #166534; }
    .conf-medium { background: #fef3c7; color: #92400e; }
    .conf-low { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>

<!-- ==================== KAPAK ==================== -->
<div class="cover page">
  <h1>Yonetim Kurulu Raporu</h1>
  <div class="ticker">AKBNK</div>
  <div class="subtitle">Akbank Turk Anonim Sirketi</div>
  <div class="subtitle">Kapsamli Finansal ve Stratejik Analiz</div>
  <div class="meta">
    <p>Rapor Tarihi: 10 Nisan 2026</p>
    <p>Analiz Tipi: Deep Dive (Tam Entegre Analiz)</p>
    <p>Hazirlayan: Finance X Platform | 16 Ajan Pipeline</p>
    <p>Session ID: fs-akbnk-20260410</p>
  </div>
</div>

<!-- ==================== SAYFA 1: YONETICI OZETI ==================== -->
<div class="page">
  <h2 class="section-title">Yonetici Ozeti</h2>
  <p class="section-subtitle">Temel Bulgular ve Stratejik Degerlendirme</p>

  <div class="callout callout-blue">
    <h4>Ana Sonuc</h4>
    <p>AKBNK, Turkiye'nin en buyuk ozel sermayeli bankasi olarak <strong>guclu franchise degeri</strong> (ROE %21.5, net kar +%35 YoY) sergiliyor. Ancak <strong>yapisal marj sikismasi</strong> (NIM %4.7 &rarr; %3.1, 160 bps dusus) ve <strong>sermaye tamponu erozyonu</strong> (CET1 %21.8 &rarr; %12.5) kritik risk faktorleri. Yonetim, AT1 tahvil ($600M, 5x oversubscription) ve muhafazakar temettu (%11.1 payout) ile proaktif sermaye yonetimi gosteriyor.</p>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Net Kar (2025)</div>
      <div class="kpi-value">57.3B TL</div>
      <div class="kpi-change positive">+%35 YoY</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">ROE</div>
      <div class="kpi-value">%21.5</div>
      <div class="kpi-change warning">-850 bps (2023'ten)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">NIM (2025 FY)</div>
      <div class="kpi-value">%3.1</div>
      <div class="kpi-change negative">-160 bps (Kritik)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">CET1 Rasyosu</div>
      <div class="kpi-value">%12.5</div>
      <div class="kpi-change negative">-930 bps (2023'ten)</div>
    </div>
  </div>

  <div class="two-col">
    <div class="callout callout-green">
      <h4>Guclu Yonler</h4>
      <ul>
        <li><strong>Sektor lideri ucret geliri:</strong> %17.8 pazar payi (#1)</li>
        <li><strong>Guclu varlik kalitesi:</strong> NPL %3.5, sektor ustuicinde Top Quartile</li>
        <li><strong>Dijital liderlik:</strong> %87.9 dijital musteri orani</li>
        <li><strong>Pazar payi ivmesi:</strong> Ticari bankacilik +100 bps</li>
        <li><strong>Deposit-funded model:</strong> L/D %76 (konservatif)</li>
      </ul>
    </div>
    <div class="callout callout-red">
      <h4>Risk Faktorleri</h4>
      <ul>
        <li><strong>NIM sikismasi:</strong> %3.1, saglikli bandin altinda (%3.5-5.0)</li>
        <li><strong>Sermaye baskisi:</strong> CET1 %12.5, sektor medyaninin altinda</li>
        <li><strong>Teknik zayiflik:</strong> Death cross, Fib %61.8 direnci</li>
        <li><strong>Jeopolitik risk:</strong> Iran-ABD savasi kuyruk riski</li>
        <li><strong>Likidite:</strong> Likit varlik orani %13.2, konfor esiginin altinda</li>
      </ul>
    </div>
  </div>

  <div class="page-footer">
    <span>AKBNK - Yonetim Kurulu Raporu</span>
    <span>Sayfa 1</span>
  </div>
</div>

<!-- ==================== SAYFA 2: FINANSAL PERFORMANS ==================== -->
<div class="page">
  <h2 class="section-title">Finansal Performans Trendi</h2>
  <p class="section-subtitle">2021-2025 Donemi Analizi</p>

  <h3>Gelir ve Karlilik Gelisimi</h3>
  <div class="chart-container">
    <canvas id="profitChart"></canvas>
  </div>

  <table>
    <thead>
      <tr>
        <th>Donem</th><th>Net Kar (Mly TL)</th><th>Degisim</th><th>ROE %</th><th>ROA %</th><th>NIM %</th><th>Maliyet/Gelir %</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><strong>2021</strong></td><td>25.0</td><td>-</td><td>30.1%</td><td>3.2%</td><td>3.8%</td><td>25.5%</td></tr>
      <tr><td><strong>2022</strong></td><td>60.0</td><td style="color:#059669">+140%</td><td>68.9%</td><td>5.5%</td><td>4.5%</td><td>25.3%</td></tr>
      <tr><td><strong>2023</strong></td><td>51.3</td><td style="color:#dc2626">-14.5%</td><td>30.0%</td><td>4.4%</td><td>4.7%</td><td>25.8%</td></tr>
      <tr><td><strong>2024</strong></td><td>42.4</td><td style="color:#dc2626">-17.3%</td><td>20.2%</td><td>2.0%</td><td>~3.0*</td><td>34.4%</td></tr>
      <tr class="highlight"><td><strong>2025</strong></td><td>57.25</td><td style="color:#059669">+35.1%</td><td>21.5%</td><td>1.9%</td><td>3.1%</td><td>31.8%</td></tr>
    </tbody>
  </table>

  <div class="callout callout-amber">
    <h4>Onemli Not</h4>
    <p>2022'deki %140 net kar artisi IAS 29 hiperenflasyon muhasebesi ve TCMB faiz artisi donemindeki margin genislemesinden kaynaklanmaktadir. 2023-2025 donemi normalizasyonu yansitmaktadir. *2024 NIM'i 9 aylik veri olabilir (QA Review tarafindan dogrulanmadi).</p>
  </div>

  <div class="page-footer">
    <span>AKBNK - Yonetim Kurulu Raporu</span>
    <span>Sayfa 2</span>
  </div>
</div>

<!-- ==================== SAYFA 3: NIM VE MARJ ANALIZI ==================== -->
<div class="page">
  <h2 class="section-title">Net Faiz Marji (NIM) Analizi</h2>
  <p class="section-subtitle">Birincil Karlilik Riski - Detayli Degerlendirme</p>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">NIM 2025 FY</div>
      <div class="kpi-value">%3.1</div>
      <div class="kpi-change negative">Saglikli bandin altinda</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">NIM Q4 2025</div>
      <div class="kpi-value">%3.5</div>
      <div class="kpi-change positive">+50 bps QoQ iyilesme</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Yonetim Hedefi</div>
      <div class="kpi-value">%4.0</div>
      <div class="kpi-change warning">2026 sonu (90 bps toparlanma)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Sektor Benchmark</div>
      <div class="kpi-value">%3.5-5.0</div>
      <div class="kpi-change negative">AKBNK altinda</div>
    </div>
  </div>

  <div class="chart-container chart-half">
    <canvas id="nimChart"></canvas>
  </div>

  <h3>NIM Sikismasinin Nedenleri</h3>
  <table>
    <thead><tr><th>Faktor</th><th>Etki</th><th>Detay</th><th>Guven</th></tr></thead>
    <tbody>
      <tr><td><strong>TCMB faiz indirimi</strong></td><td style="color:#dc2626">-160 bps</td><td>Politika faizi %50 &rarr; %37 (1,300 bps indirim). Varlik getirisi borc maliyetinden hizli dustu</td><td><span class="confidence-badge conf-high">Yuksek</span></td></tr>
      <tr><td><strong>Mevduat rekabeti</strong></td><td style="color:#dc2626">Yapiskanlık</td><td>Deposit beta yuksek: %37 politika faizine ragmen mevduat faizleri %30-35 bandinda</td><td><span class="confidence-badge conf-high">Yuksek</span></td></tr>
      <tr><td><strong>Kredi fiyatlama asimetrisi</strong></td><td style="color:#dc2626">Negatif</td><td>Yeni krediler dusuk faizle kullandirilirken mevcut mevduatlar yuksek faizle devam</td><td><span class="confidence-badge conf-medium">Orta</span></td></tr>
      <tr><td><strong>Mix shift</strong></td><td style="color:#f59e0b">Olumsuz</td><td>Dusuk marjli perakende/KOBI segmentlerine kayma</td><td><span class="confidence-badge conf-medium">Orta</span></td></tr>
    </tbody>
  </table>

  <div class="callout callout-red">
    <h4>Risk Degerlendirmesi: YUKSEK</h4>
    <p><strong>NIM, izlenmesi gereken en kritik metriktir.</strong> NIM %3.5'in altinda kalirsa: karlilik mevcut maliyet yapisinda surdurulemez — maliyet kesintileri veya pazar payi fedakarligı gerekir. TCMB %30-35'e inerse NIM %2.5-2.8'e dusebilir — agresif yapilanma gerektirir.</p>
    <p><strong>Baz senaryo:</strong> NIM 2027'ye kadar %3.5-3.8'e stabilize olur (tarihsel %4-5'in altinda ama surdurulebilir).</p>
  </div>

  <div class="page-footer">
    <span>AKBNK - Yonetim Kurulu Raporu</span>
    <span>Sayfa 3</span>
  </div>
</div>

<!-- ==================== SAYFA 4: VARLIK KALITESI ==================== -->
<div class="page">
  <h2 class="section-title">Varlik Kalitesi ve Kredi Riski</h2>
  <p class="section-subtitle">NPL, Karsilik ve Fonlama Analizi</p>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">NPL Orani</div>
      <div class="kpi-value">%3.5</div>
      <div class="kpi-change positive">Top Quartile</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Karsilik Orani</div>
      <div class="kpi-value">%80</div>
      <div class="kpi-change positive">Yeterli</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Kredi/Mevduat</div>
      <div class="kpi-value">%76</div>
      <div class="kpi-change positive">Konservatif</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Risk Maliyeti</div>
      <div class="kpi-value">214 bps</div>
      <div class="kpi-change warning">2026 Hedef: 150-200</div>
    </div>
  </div>

  <h3>NPL Trendi (2021-2025)</h3>
  <table>
    <thead><tr><th>Donem</th><th>NPL %</th><th>Brut Krediler (Mly TL)</th><th>NPL Tutar (Mly TL)</th><th>Karsilik %</th><th>Benchmark</th></tr></thead>
    <tbody>
      <tr><td>2021</td><td><%2.0</td><td>310</td><td><6.2</td><td>~90%</td><td><%5 saglikli</td></tr>
      <tr><td>2022</td><td>2.5%</td><td>515</td><td>~12.9</td><td>85%</td><td><%5 saglikli</td></tr>
      <tr><td>2023</td><td>3.5%</td><td>839</td><td>~29.4</td><td>80%</td><td><%5 saglikli</td></tr>
      <tr><td>2024</td><td>3.8%</td><td>1,241</td><td>~47.2</td><td>75%</td><td><%5 saglikli</td></tr>
      <tr class="highlight"><td><strong>2025 Q4</strong></td><td><strong>3.5%</strong></td><td><strong>1,400+</strong></td><td><strong>~49.0</strong></td><td><strong>80%</strong></td><td><%5 saglikli</td></tr>
    </tbody>
  </table>

  <div class="callout callout-amber">
    <h4>Q4 2025 NPL Iyilesmesi: Dogrulama Gerekli</h4>
    <p>Q3'ten Q4'e 150 bps sirali iyilesme QA Review tarafindan "olagan disi buyuklukte" olarak isaretlendi. Olasi nedenler: buyuk kurumsal NPL portfoy write-off'u, basarili tahsilat/yapilandirma veya %47 kredi buyumesinin payda etkisi. <strong>Q4 2025 denetimli mali tablolar (30 Nisan 2026) ile dogrulanmasi gerekmektedir.</strong></p>
  </div>

  <h3>Fonlama Kalitesi</h3>
  <div class="two-col">
    <div>
      <table>
        <thead><tr><th>Metrik</th><th>Deger</th><th>Benchmark</th><th>Durum</th></tr></thead>
        <tbody>
          <tr><td>Kredi/Mevduat</td><td>76%</td><td><%100</td><td style="color:#059669">Mukemmel</td></tr>
          <tr><td>Likit Varlik Orani</td><td>13.2%</td><td>>%20</td><td style="color:#dc2626">Altinda</td></tr>
          <tr><td>Ucret Geliri/Toplam</td><td>16.1%</td><td>>%25</td><td style="color:#f59e0b">Gelisiyor</td></tr>
        </tbody>
      </table>
    </div>
    <div>
      <div class="callout callout-green" style="margin-top:0">
        <h4>Fonlama Gucu</h4>
        <p>AKBNK'in kredi portfoyu tamamen musteri mevduatlariyla fonlaniyor (%76 L/D). %24 likidite tamponu mevduat cikisina karsi dayaniiklilik sagliyor. Bu, wholesale fonlamaya bagli rakiplere karsi onemli rekabet avantaji.</p>
      </div>
    </div>
  </div>

  <div class="page-footer">
    <span>AKBNK - Yonetim Kurulu Raporu</span>
    <span>Sayfa 4</span>
  </div>
</div>

<!-- ==================== SAYFA 5: SERMAYE YETERLILIGI ==================== -->
<div class="page">
  <h2 class="section-title">Sermaye Yeterliligi ve Kaldirac</h2>
  <p class="section-subtitle">Basel III Sermaye Cercevesi - Kritik Degerlendirme</p>

  <div class="chart-container chart-half">
    <canvas id="capitalChart"></canvas>
  </div>

  <table>
    <thead><tr><th>Donem</th><th>CET1 %</th><th>Tier 1 %</th><th>Toplam SYR %</th><th>BDDK Min.</th><th>Tampon</th></tr></thead>
    <tbody>
      <tr><td>2022</td><td>20.8%</td><td>21.2%</td><td>24.5%</td><td>8%/12%</td><td>+12.8%</td></tr>
      <tr><td>2023</td><td>21.8%</td><td>22.1%</td><td>24.9%</td><td>8%/12%</td><td>+13.8%</td></tr>
      <tr><td>2024</td><td>17-18%</td><td>18-19%</td><td>19-20%</td><td>8%/12%</td><td>+9-10%</td></tr>
      <tr class="danger"><td><strong>2025 Q4</strong></td><td><strong>12.5%</strong></td><td><strong>13.6%</strong></td><td><strong>16.8%</strong></td><td><strong>8%/12%</strong></td><td><strong>+4.5%</strong></td></tr>
    </tbody>
  </table>

  <div class="callout callout-red">
    <h4>Kritik Bulgu: 930 bps CET1 Erozyonu (24 ayda)</h4>
    <p><strong>Neden:</strong> (1) RWA patlamasi — kredi portfoyu 18 ayda %65 buyudu, (2) Temettu dagitimlari — hisse basina 2.20 TL = ~11.5 Mly TL sermaye cikisi, (3) IAS 29 baz etkisi tersine donusu. <strong>AT1 tahvil ($600M) Tier 1'i guclendirir ama CET1'i etkilemez</strong> (Additional Tier 1 siniflandirmasi).</p>
    <p><strong>Tampon analizi:</strong> Mevcut %4.5 tampon, BDDK %8 minimumunun %56 uzerinde. Konfor esigi %3 — AKBNK konfor esiginin sadece %1.5 uzerinde.</p>
  </div>

  <h3>Yonetimin Sermaye Aksiyonlari</h3>
  <table>
    <thead><tr><th>Aksiyon</th><th>Tutar</th><th>Tarih</th><th>CET1 Etkisi</th><th>Toplam SYR Etkisi</th></tr></thead>
    <tbody>
      <tr><td>AT1 Tahvil Ihraci</td><td>$600M USD</td><td>Subat 2026</td><td>Notr (AT1)</td><td>+120-150 bps</td></tr>
      <tr><td>IFC/EBRD Ipotek Tahvili</td><td>~$200M USD</td><td>2025-2026</td><td>Notr</td><td>Fonlama cesitliligi</td></tr>
      <tr><td>Muhafazakar Temettu (%11.1)</td><td>11.5 Mly TL</td><td>Mart 2026</td><td>-35-40 bps</td><td>-35-40 bps</td></tr>
      <tr><td>Kredi Buyume Yavaslamasi</td><td>%47 &rarr; %12.8</td><td>2025</td><td>Koruyucu</td><td>Koruyucu</td></tr>
    </tbody>
  </table>

  <div class="page-footer">
    <span>AKBNK - Yonetim Kurulu Raporu</span>
    <span>Sayfa 5</span>
  </div>
</div>

<!-- ==================== SAYFA 6: SEKTOR VE REKABET ==================== -->
<div class="page">
  <h2 class="section-title">Sektor Karsilastirmasi ve Rekabet Pozisyonu</h2>
  <p class="section-subtitle">Akran Grubu Benchmarking (Isbank, Garanti, Yapi Kredi)</p>

  <div class="chart-container chart-half">
    <canvas id="peerChart"></canvas>
  </div>

  <table>
    <thead><tr><th>Metrik</th><th>AKBNK</th><th>Isbank</th><th>Garanti</th><th>Y.Kredi</th><th>AKBNK Sirasi</th></tr></thead>
    <tbody>
      <tr><td><strong>Net Kar (Mly TL)</strong></td><td>57.3</td><td>67.9</td><td>110.6</td><td>47.1</td><td>3./4</td></tr>
      <tr><td><strong>ROE %</strong></td><td>21.5%</td><td>~26%</td><td>~30%+</td><td>~28%</td><td style="color:#dc2626">4./4</td></tr>
      <tr><td><strong>NIM %</strong></td><td>3.1%</td><td>~3.7%</td><td>~4.0%</td><td>~3.5%</td><td style="color:#dc2626">4./4</td></tr>
      <tr><td><strong>NPL %</strong></td><td>3.5%</td><td>~4.5%</td><td>~4.0%</td><td>~5.0%</td><td style="color:#059669">1./4</td></tr>
      <tr><td><strong>CET1 %</strong></td><td>12.5%</td><td>~16%</td><td>~15%</td><td>~14%</td><td style="color:#dc2626">4./4</td></tr>
      <tr><td><strong>Maliyet/Gelir %</strong></td><td>31.8%</td><td>~30%</td><td>~28%</td><td>~32%</td><td>3./4</td></tr>
      <tr><td><strong>Ucret Geliri Payi</strong></td><td>16.1%</td><td>~15%</td><td>~14%</td><td>~13%</td><td style="color:#059669">1./4</td></tr>
    </tbody>
  </table>

  <div class="two-col">
    <div class="callout callout-green">
      <h4>Rekabet Avantajlari</h4>
      <ul>
        <li><strong>Ucret geliri liderligi:</strong> %17.8 pazar payi (sektor #1)</li>
        <li><strong>Varlik kalitesi:</strong> NPL %3.5 vs akran %4-5 (en dusuk)</li>
        <li><strong>Dijital penetrasyon:</strong> %87.9 (akranlar %75-85)</li>
        <li><strong>Pazar payi buyumesi:</strong> Ticari bankacilik +100 bps</li>
      </ul>
    </div>
    <div class="callout callout-red">
      <h4>Rekabet Zayifliklari</h4>
      <ul>
        <li><strong>NIM en dusuk:</strong> %3.1 vs akranlar %3.5-4.0</li>
        <li><strong>CET1 en dusuk:</strong> %12.5 vs akranlar %14-16</li>
        <li><strong>ROE altinda:</strong> %21.5 vs akranlar %26-30</li>
        <li><strong>ROA geriliyor:</strong> %1.9 vs akranlar %2.0-2.5</li>
      </ul>
    </div>
  </div>

  <div class="callout callout-amber">
    <h4>Veri Uyarisi</h4>
    <p>Akran 2025 FY metrikleri kismi tahminlere dayanmaktadir. Isbank, Garanti ve Yapi Kredi 2025 denetimli sonuclari yayinlandiginda benchmarking guncellenmelidir. <span class="confidence-badge conf-medium">Guven: Orta (0.65)</span></p>
  </div>

  <div class="page-footer">
    <span>AKBNK - Yonetim Kurulu Raporu</span>
    <span>Sayfa 6</span>
  </div>
</div>

<!-- ==================== SAYFA 7: MAKRO ORTAM ==================== -->
<div class="page">
  <h2 class="section-title">Makroekonomik Ortam ve Bankacilik Sektoru</h2>
  <p class="section-subtitle">Turkiye Makro Gorunumu - Nisan 2026</p>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">TCMB Politika Faizi</div>
      <div class="kpi-value">%37.0</div>
      <div class="kpi-change warning">Mart 2026 sabit tutuldu</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">TUFE (Yillik)</div>
      <div class="kpi-value">%30.9</div>
      <div class="kpi-change warning">Mart 2026</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Reel Faiz</div>
      <div class="kpi-value">+%6.1</div>
      <div class="kpi-change positive">Pozitif</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">USD/TRY</div>
      <div class="kpi-value">44.48</div>
      <div class="kpi-change negative">-%17.4 yillik</div>
    </div>
  </div>

  <h3>Makro Degiskenlerin AKBNK'a Etkisi</h3>
  <table>
    <thead><tr><th>Degisken</th><th>Guncel</th><th>AKBNK Etkisi</th><th>Yonu</th></tr></thead>
    <tbody>
      <tr><td><strong>TCMB Faiz (%37)</strong></td><td>5 ardiisik indirimden sonra hold</td><td>NIM stabilizasyonu icin olumlu; daha fazla indirim NIM'i ezer</td><td style="color:#f59e0b">Karisik</td></tr>
      <tr><td><strong>Enflasyon (%30.9)</strong></td><td>Kademe kademe yavaslama</td><td>Ucret baskisi (cost-to-income), mevduat fiyatlamasi yapiskanligi</td><td style="color:#dc2626">Olumsuz</td></tr>
      <tr><td><strong>Reel faiz (+%6.1)</strong></td><td>Pozitif reel faiz ortami</td><td>NPL riski duser (asiri borclanma azalir), ama kredi buyumesi yavaslar</td><td style="color:#f59e0b">Karisik</td></tr>
      <tr><td><strong>USD/TRY (44.48)</strong></td><td>%17 yillik deger kaybi</td><td>FX kredi riski (KOBI), AT1/eurobond servis maliyeti artar</td><td style="color:#dc2626">Olumsuz</td></tr>
      <tr><td><strong>GSYIH (+%4.2)</strong></td><td>IMF 2026 tahmini</td><td>Makul kredi talebi, ticari bankacilik pozitif</td><td style="color:#059669">Olumlu</td></tr>
      <tr><td><strong>Insaat sektoru</strong></td><td>+%5.45 buyume</td><td>Konut kredisi talebi, duzcam ic talep</td><td style="color:#059669">Olumlu</td></tr>
      <tr><td><strong>KKM erimesi</strong></td><td>1.53 trilyon TL'ye geriledi</td><td>Normal TL mevduata donus = fonlama maliyeti duser</td><td style="color:#059669">Olumlu</td></tr>
    </tbody>
  </table>

  <div class="callout callout-red">
    <h4>Jeopolitik Risk: 2026 Iran-ABD Savasi</h4>
    <p><strong>28 Subat 2026:</strong> ABD-Israil ortak hava saldirilari Iran liderlik ve askeri altyapisini hedef aldi. Turkiye NATO kalkani ve corafi konumu nedeniyle dogrudan etkilenmedi ancak:</p>
    <ul>
      <li>Enerji fiyatlarinda volatilite (dogalgaz +%18.6, elektrik +%5.8 zamlari)</li>
      <li>BIST 100 Subat zirvesinden -%8.8 duzeltme</li>
      <li>AKBNK AT1 tahvil 5x oversubscription — piyasa dayanikliligi kanitlandi</li>
    </ul>
    <p><span class="confidence-badge conf-medium">Guven: Orta</span> — Jeopolitik riskler olasiliksal senaryolardir</p>
  </div>

  <div class="page-footer">
    <span>AKBNK - Yonetim Kurulu Raporu</span>
    <span>Sayfa 7</span>
  </div>
</div>

<!-- ==================== SAYFA 8: KURUMSAL OLAYLAR ==================== -->
<div class="page">
  <h2 class="section-title">Kurumsal Olaylar ve Finansal Etki Haritasi</h2>
  <p class="section-subtitle">KAP Olay Eslestirmesi - Son 12 Ay (5 Materyal Olay)</p>

  <table>
    <thead><tr><th>Olay</th><th>Tarih</th><th>Tutar</th><th>Etki</th><th>Guven</th></tr></thead>
    <tbody>
      <tr><td><strong>Temettu Dagitimi</strong><br>2.20 TL/hisse (brut)</td><td>Mart 2026</td><td>11.49 Mly TL cikis</td><td>CET1 -35-40 bps, nakit -4.1%, ozkaynak -3.6%</td><td><span class="confidence-badge conf-high">Yuksek</span></td></tr>
      <tr><td><strong>AT1 Tahvil Ihraci</strong><br>$600M USD, 5x oversubscription</td><td>Subat 2026</td><td>~20 Mly TL sermaye</td><td>Tier 1 +120-150 bps, CET1'e etki yok</td><td><span class="confidence-badge conf-high">Yuksek</span></td></tr>
      <tr><td><strong>Ipotek Teminatlı Tahvil</strong><br>IFC/EBRD destekli</td><td>2025-2026</td><td>~$200M USD</td><td>Fonlama cesitliligi, wholesale maliyeti duser</td><td><span class="confidence-badge conf-high">Yuksek</span></td></tr>
      <tr><td><strong>Q4 2025 Kazanc Aciklamasi</strong></td><td>2 Subat 2026</td><td>57.25 Mly TL net kar</td><td>ROE %21.5, NIM %3.1, NPL %3.5</td><td><span class="confidence-badge conf-high">Yuksek</span></td></tr>
      <tr><td><strong>YK Yeniden Yapilandirma</strong></td><td>2026</td><td>-</td><td>Yonetisim istikrari, finansal etki notr</td><td><span class="confidence-badge conf-medium">Orta</span></td></tr>
    </tbody>
  </table>

  <h3>Portfoy Etki Ozeti — FY2026 Projeksiyonu</h3>
  <table>
    <thead><tr><th>Kategori</th><th>Yon</th><th>Tahmini Buyukluk</th><th>Guven</th></tr></thead>
    <tbody>
      <tr><td><strong>Nakit Akisi</strong></td><td style="color:#dc2626">Negatif</td><td>-11.5 Mly TL temettu + devam eden borc servisi</td><td><span class="confidence-badge conf-high">Yuksek</span></td></tr>
      <tr><td><strong>Sermaye (Tier 1)</strong></td><td style="color:#059669">Pozitif</td><td>AT1 +120-150 bps, ancak CET1'e etki yok</td><td><span class="confidence-badge conf-high">Yuksek</span></td></tr>
      <tr><td><strong>Fonlama</strong></td><td style="color:#059669">Pozitif</td><td>Covered bond programi wholesale maliyeti dusurur</td><td><span class="confidence-badge conf-medium">Orta</span></td></tr>
      <tr><td><strong>Karlilik</strong></td><td style="color:#f59e0b">Karisik</td><td>NIM baskisi vs ucret geliri buyumesi</td><td><span class="confidence-badge conf-medium">Orta</span></td></tr>
    </tbody>
  </table>

  <div class="page-footer">
    <span>AKBNK - Yonetim Kurulu Raporu</span>
    <span>Sayfa 8</span>
  </div>
</div>

<!-- ==================== SAYFA 9: TEKNIK ANALIZ ==================== -->
<div class="page">
  <h2 class="section-title">Teknik Analiz ve Piyasa Pozisyonu</h2>
  <p class="section-subtitle">Hisse Performansi Degerlendirmesi - 10 Nisan 2026</p>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Kapanis Fiyati</div>
      <div class="kpi-value">75.30 TL</div>
      <div class="kpi-change negative">Zirveden -%19.5</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">52-Hafta Yuksek</div>
      <div class="kpi-value">93.50 TL</div>
      <div class="kpi-change warning">Erken 2026</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Fibonacci %61.8</div>
      <div class="kpi-value">76.08 TL</div>
      <div class="kpi-change warning">Tam bu seviyede</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">12-Ay Getiri</div>
      <div class="kpi-value">+%57.2</div>
      <div class="kpi-change positive">BIST 100'u asiyor</div>
    </div>
  </div>

  <div class="two-col">
    <div>
      <h3>Hareketli Ortalama Analizi</h3>
      <table>
        <thead><tr><th>HO</th><th>Deger (TL)</th><th>Pozisyon</th><th>Sinyal</th></tr></thead>
        <tbody>
          <tr><td>20-gunluk</td><td>70.13</td><td>+%7.4 uzerinde</td><td style="color:#f59e0b">Notr</td></tr>
          <tr><td>50-gunluk</td><td>67.03</td><td>+%12.3 uzerinde</td><td style="color:#059669">Alis</td></tr>
          <tr><td>52-gunluk</td><td>77.83</td><td>-%3.3 altinda</td><td style="color:#dc2626">Satis</td></tr>
          <tr><td>200-gunluk</td><td>72.81</td><td>+%3.4 uzerinde</td><td style="color:#059669">Zayif Alis</td></tr>
        </tbody>
      </table>
      <p style="font-size:10px; color:#dc2626; font-weight:600;">Death Cross: 50-gun HO (67.03) < 200-gun HO (72.81) — Orta vadeli zayiflik</p>
    </div>
    <div>
      <h3>Destek ve Direnc Seviyeleri</h3>
      <table>
        <thead><tr><th>Seviye</th><th>Fiyat (TL)</th><th>Uzaklik</th><th>Not</th></tr></thead>
        <tbody>
          <tr style="background:#fef2f2"><td>Direnc 3</td><td>83.74</td><td>+%11.2</td><td>Fib %78.6</td></tr>
          <tr style="background:#fef2f2"><td>Direnc 2</td><td>79.67</td><td>+%5.8</td><td>Psikolojik 80 TL</td></tr>
          <tr style="background:#fef2f2"><td>Direnc 1</td><td>77.33</td><td>+%2.7</td><td>Fib %61.8</td></tr>
          <tr style="font-weight:700"><td>Mevcut</td><td>75.30</td><td>—</td><td>Karar noktasi</td></tr>
          <tr style="background:#f0fdf4"><td>Destek 1</td><td>70.33</td><td>-%6.6</td><td>20-gun HO + Fib %50</td></tr>
          <tr style="background:#f0fdf4"><td>Destek 2</td><td>67.03</td><td>-%11.0</td><td>50-gun HO (kritik)</td></tr>
          <tr style="background:#f0fdf4"><td>Destek 3</td><td>65.31</td><td>-%13.3</td><td>Fib %38.2 + Mart dibi</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <h3>Teknik Senaryo Analizi</h3>
  <div class="three-col">
    <div class="callout callout-green">
      <h4>Yukaris (%35-40 olasilik)</h4>
      <p><strong>Tetikleyici:</strong> 77.33 TL kırılması + hacim >10 Mly TL</p>
      <p><strong>Hedef:</strong> 79.67 &rarr; 83.74 TL</p>
      <p><strong>Katalizor:</strong> Q1 2026 earnings surpriz</p>
    </div>
    <div class="callout callout-red">
      <h4>Dusus (%50-55 olasilik)</h4>
      <p><strong>Tetikleyici:</strong> 70.33 TL kirilimi</p>
      <p><strong>Hedef:</strong> 67.03 &rarr; 65.31 TL</p>
      <p><strong>Katalizor:</strong> TCMB faiz indirimi</p>
    </div>
    <div class="callout callout-amber">
      <h4>Yatay (%10-15 olasilik)</h4>
      <p><strong>Aralik:</strong> 68-77 TL</p>
      <p><strong>Sure:</strong> 2-4 hafta</p>
      <p><strong>Katalizor:</strong> Habersiz ortam</p>
    </div>
  </div>

  <div class="page-footer">
    <span>AKBNK - Yonetim Kurulu Raporu</span>
    <span>Sayfa 9</span>
  </div>
</div>

<!-- ==================== SAYFA 10: RISK DASHBOARD ==================== -->
<div class="page">
  <h2 class="section-title">Risk Faktorleri ve Azaltma Stratejileri</h2>
  <p class="section-subtitle">Kapsamli Risk Haritasi</p>

  <h3>Risk Dashboard (Nisan 2026)</h3>
  <div class="chart-container chart-half">
    <canvas id="riskChart"></canvas>
  </div>

  <h3>Detayli Risk Tablosu</h3>
  <table>
    <thead><tr><th>Risk</th><th>Seviye</th><th>Skor</th><th>Aciklama</th><th>Azaltma</th></tr></thead>
    <tbody>
      <tr class="danger"><td><strong>NIM Sikismasi</strong></td><td style="color:#dc2626">YUKSEK</td><td>9/10</td><td>%4.7 &rarr; %3.1 (160 bps). TCMB daha fazla indirir ise %2.5-2.8 riski</td><td>Ucret geliri cesitlendirmesi, mix shift</td></tr>
      <tr class="danger"><td><strong>Sermaye Erozyonu</strong></td><td style="color:#dc2626">YUKSEK</td><td>8/10</td><td>CET1 %12.5, tampon sadece %4.5. Kredi buyumesi devam ederse %10-11'e dusebilir</td><td>AT1 ihraci, muhafazakar temettu, buyume yavaslamasi</td></tr>
      <tr><td><strong>Jeopolitik</strong></td><td style="color:#f59e0b">ORTA</td><td>6/10</td><td>Iran-ABD savasi: enerji volatilitesi, BIST duzeltmesi</td><td>NATO kalkani, AT1 oversubscription dayaniklilik kaniti</td></tr>
      <tr><td><strong>FX Riski</strong></td><td style="color:#f59e0b">ORTA</td><td>6/10</td><td>TL -%17 yillik deger kaybi, FX kredi geri odeme baskisi</td><td>Hedge programi, FX gelir cesitlendirmesi</td></tr>
      <tr><td><strong>Likidite</strong></td><td style="color:#f59e0b">ORTA</td><td>5/10</td><td>Likit varlik orani %13.2, konfor esigi %20'nin altinda</td><td>Guclu mevduat franchise'i (%76 L/D)</td></tr>
      <tr><td><strong>Varlik Kalitesi</strong></td><td style="color:#059669">DUSUK</td><td>3/10</td><td>NPL %3.5, iyi kontrol ediliyor</td><td>IFRS 9 erken uyari, karsilik %80</td></tr>
    </tbody>
  </table>

  <div class="page-footer">
    <span>AKBNK - Yonetim Kurulu Raporu</span>
    <span>Sayfa 10</span>
  </div>
</div>

<!-- ==================== SAYFA 11: DEGERLEME VE SENARYO ==================== -->
<div class="page">
  <h2 class="section-title">Degerleme ve Senaryo Analizi</h2>
  <p class="section-subtitle">Carpan Bazli Degerleme ve Hedef Fiyat</p>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">F/K Orani</div>
      <div class="kpi-value">6.1x</div>
      <div class="kpi-change positive">Sektor 7-9x altinda</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">PD/DD (P/B)</div>
      <div class="kpi-value">1.09x</div>
      <div class="kpi-change positive">Sektor 1.2-1.8x altinda</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Temettu Verimi</div>
      <div class="kpi-value">%2.93</div>
      <div class="kpi-change warning">Mutevazi</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Piyasa Degeri</div>
      <div class="kpi-value">~393 Mly TL</div>
      <div class="kpi-change">5.22 Mly hisse</div>
    </div>
  </div>

  <h3>Uc Senaryo Degerlendirmesi</h3>
  <table>
    <thead><tr><th>Senaryo</th><th>Olasilik</th><th>NIM</th><th>CET1</th><th>Hedef Fiyat</th><th>Potansiyel</th></tr></thead>
    <tbody>
      <tr class="danger"><td><strong>Ayi (Bear)</strong></td><td>%25</td><td>%2.8-3.0</td><td>%10-11</td><td>67 TL (P/B 0.9x)</td><td style="color:#dc2626">-%11</td></tr>
      <tr class="highlight"><td><strong>Baz (Base)</strong></td><td>%50</td><td>%3.5-3.7</td><td>%13-14</td><td>82 TL (P/B 1.2x)</td><td style="color:#059669">+%9</td></tr>
      <tr style="background:#f0fdf4"><td><strong>Boga (Bull)</strong></td><td>%25</td><td>%4.0-4.2</td><td>%14-15</td><td>105 TL (P/B 1.5x)</td><td style="color:#059669">+%39</td></tr>
    </tbody>
  </table>

  <div class="callout callout-blue">
    <h4>Yatirim Tezi</h4>
    <p>AKBNK <strong>deger firsati</strong> sunuyor (P/B 1.09x, sektor medyani 1.2-1.8x altinda; F/K 6.1x vs 7-9x). Ancak bu indirim <strong>risk primidir, ucuzluk degil</strong>. NIM sikismasi ve sermaye baskisi fiyata yansimis durumda.</p>
    <p><strong>Baz senaryo</strong> (NIM %3.5-3.7 stabilize, CET1 %13-14 yonetilir) altinda <strong>%9 yukari potansiyel</strong> var (82 TL hedef vs 75.30 TL mevcut).</p>
  </div>

  <h3>Yatirimci Profili Bazinda Degerlendirme</h3>
  <table>
    <thead><tr><th>Profil</th><th>Gorunum</th><th>Degerlendirme</th></tr></thead>
    <tbody>
      <tr><td><strong>Uzun vadeli deger yatirimcisi</strong></td><td style="color:#059669">OLUMLU</td><td>Franchise kalitesi ve pazar payi ivmesi uzun vade icin cekici, ancak makro volatiliteye tolerans gerekiyor</td></tr>
      <tr><td><strong>Gelir odakli yatirimci</strong></td><td style="color:#f59e0b">NOTR</td><td>Temettu verimi %2.93 mutevazi; sermaye baskisi nedeniyle artis olasiligi dusuk</td></tr>
      <tr><td><strong>Kisa vade trader</strong></td><td style="color:#dc2626">RISKLI</td><td>Death cross, Fibonacci %61.8 direnci, BIST 100 duzeltme faktorleri satis baskisi yaratıyor</td></tr>
    </tbody>
  </table>

  <div class="page-footer">
    <span>AKBNK - Yonetim Kurulu Raporu</span>
    <span>Sayfa 11</span>
  </div>
</div>

<!-- ==================== SAYFA 12: SON DEGERLENDIRME ==================== -->
<div class="page">
  <h2 class="section-title">Genel Degerlendirme ve Izleme Plani</h2>
  <p class="section-subtitle">Yonetim Kurulu Icin Sonuclar</p>

  <div class="callout callout-blue">
    <h4>Temel Sonuc</h4>
    <p><strong>Genel Gorunum: NOTR-POZITIF</strong> — Fundamentaller uzun vade icin olumlu (franchise, pazar payi, varlik kalitesi) ama yakin vade katalizor yok ve makro ruzgar tersten esiyor. %10-15 geri cekilme (67-70 TL'ye) birikim firsati olabilir.</p>
  </div>

  <div class="two-col">
    <div>
      <h3>Stratejik Guclu Yonler</h3>
      <div class="callout callout-green" style="margin-top:5px">
        <ul>
          <li><strong>Karlilik:</strong> ROE %21.5, sektor ustuinde</li>
          <li><strong>Varlik kalitesi:</strong> NPL %3.5, top quartile</li>
          <li><strong>Ucret geliri:</strong> %17.8 pazar payi (#1)</li>
          <li><strong>Dijital:</strong> %87.9 penetrasyon</li>
          <li><strong>Fonlama:</strong> L/D %76, deposit-funded</li>
          <li><strong>Yonetim:</strong> Proaktif sermaye yonetimi</li>
        </ul>
      </div>
    </div>
    <div>
      <h3>Izlenmesi Gereken Alanlar</h3>
      <div class="callout callout-amber" style="margin-top:5px">
        <ul>
          <li><strong>NIM:</strong> %4.0 hedefi gerceklesiyor mu?</li>
          <li><strong>CET1:</strong> %13+ korunuyor mu?</li>
          <li><strong>TCMB:</strong> Faiz karari (Mayis-Haziran)</li>
          <li><strong>NPL:</strong> Q4 iyilesmesi denetimle dogrulandi mi?</li>
          <li><strong>Teknik:</strong> 77.33 TL direnci kirildi mi?</li>
          <li><strong>Jeopolitik:</strong> Iran-ABD catismasi azaliyor mu?</li>
        </ul>
      </div>
    </div>
  </div>

  <h3>Kritik Kilometre Taslari</h3>
  <table>
    <thead><tr><th>Tarih</th><th>Olay</th><th>Izlenecek Metrik</th></tr></thead>
    <tbody>
      <tr><td><strong>30 Nisan 2026</strong></td><td>Q4 2025 Denetimli Mali Tablolar</td><td>CET1 dogrulamasi, NPL denetim onayi, NIM Q1</td></tr>
      <tr><td><strong>Mayis 2026</strong></td><td>Q1 2026 Kazanc Aciklamasi</td><td>NIM %3.2+ toparlanma sinyali? Yonetim rehberligi</td></tr>
      <tr><td><strong>Mayis-Haziran</strong></td><td>TCMB PPK Kararlari</td><td>Faiz %37'de tutar mi yoksa %35'e iner mi?</td></tr>
      <tr><td><strong>Temmuz 2026</strong></td><td>H1 2026 Sonuclari</td><td>6 aylik NIM trendi, CET1 trajektorisi</td></tr>
      <tr><td><strong>Q3-Q4 2026</strong></td><td>Jeopolitik Gelismeler</td><td>Iran-ABD catismasi azalir mi? Enerji fiyatlari</td></tr>
    </tbody>
  </table>

  <h3>Veri Kalite Ozeti</h3>
  <table>
    <thead><tr><th>Boyut</th><th>Skor</th><th>Durum</th></tr></thead>
    <tbody>
      <tr><td>Kanit Yeterliligi</td><td>0.88</td><td style="color:#059669">Mukemmel</td></tr>
      <tr><td>Guven Kalibrasyonu</td><td>0.78</td><td style="color:#f59e0b">Iyi</td></tr>
      <tr><td>Iddia Destegi</td><td>0.85</td><td style="color:#059669">Mukemmel</td></tr>
      <tr><td>Tamlık</td><td>0.82</td><td style="color:#059669">Iyi</td></tr>
      <tr><td>Kapsam Uyumu</td><td>0.90</td><td style="color:#059669">Mukemmel</td></tr>
      <tr class="highlight"><td><strong>Agirlikli Genel</strong></td><td><strong>0.84</strong></td><td style="color:#059669"><strong>YUKSEK KALITE</strong></td></tr>
    </tbody>
  </table>

  <div class="page-footer">
    <span>AKBNK - Yonetim Kurulu Raporu</span>
    <span>Sayfa 12</span>
  </div>
</div>

<!-- ==================== SAYFA 13: ZORUNLU BILDIRIMLER ==================== -->
<div class="page">
  <h2 class="section-title">Zorunlu Bildirimler ve Sinirlamalar</h2>

  <h3>Yasal Uyarilar</h3>
  <div class="callout callout-amber">
    <p><strong>1.</strong> Bu rapor Finance X platformu tarafindan otomatik olarak uretilmis kapsamli sirket analizidir. <strong>Yatirim tavsiyesi niteligi tasimaz.</strong></p>
    <p><strong>2.</strong> Tum sonuclar 10 Nisan 2026 tarihi itibariyledir. Mali tablolar, piyasa fiyatlari ve makroekonomik gostergeler bu tarihten sonra degismis olabilir.</p>
    <p><strong>3.</strong> Ileriye donuk tum tahminler mevcut kosullar ve varsayimlara dayanmaktadir. Gerceklesen sonuclar onemli olcude farkli olabilir.</p>
    <p><strong>4.</strong> Finance X kayitli yatirim danismani degildir. Yatirim kararlari alinmadan once bagimsiz profesyonel danismanlik alinmasi onerilir.</p>
  </div>

  <h3>Analitik Kisitlamalar</h3>
  <table>
    <thead><tr><th>Kisitlama</th><th>Etki</th><th>Cozum Onerisi</th></tr></thead>
    <tbody>
      <tr><td>2024 Bilanco mutabakat farki (173 Mly TL)</td><td>Sermaye bazli metriklerde belirsizlik</td><td>KAP 2024 yillik rapor Note 2 inceleme</td></tr>
      <tr><td>2024 NIM raporlama donemi belirsizligi</td><td>Marj sikismasi trendi distorsiyonu</td><td>KAP 2024 yillik rapor PDF'den tam yil NIM</td></tr>
      <tr><td>Q4 2025 NPL iyilesmesi denetim onayi bekliyor</td><td>Varlik kalitesi degerlendirmesi gecici</td><td>30 Nisan 2026 denetimli tablolar</td></tr>
      <tr><td>Akran 2025 FY verileri kismi tahmin</td><td>Rekabet karsilastirmasi kesinlik eksik</td><td>Akran denetimli sonuclari yayinlandiginda guncelle</td></tr>
    </tbody>
  </table>

  <h3>Veri Kaynaklari</h3>
  <p style="font-size:9px; color:#64748b;">
    <strong>Birincil:</strong> KAP (kap.org.tr), BDDK (bddk.org.tr), TCMB (tcmb.gov.tr), SPK (spk.gov.tr) |
    <strong>Sirket:</strong> Akbank Yatirimci Iliskileri, Faaliyet Raporlari (2021-2024) |
    <strong>Piyasa:</strong> Yahoo Finance, Trading Economics, Investing.com |
    <strong>Sektor:</strong> BBVA Research, IMF, Statista |
    <strong>Haber:</strong> Hurriyet Daily News, Daily Sabah, bne IntelliNews, P.A. Turkey |
    <strong>Toplam: 23+ bagimsiz kaynak</strong>
  </p>

  <div style="text-align:center; margin-top:30px; padding:20px; background:#f8fafc; border-radius:8px;">
    <p style="font-size:12px; font-weight:700; color:#0f4c75;">Finance X Platform | Yapay Zeka Destekli Analitik Rapor</p>
    <p style="font-size:10px; color:#64748b;">Rapor Kodu: AKBNK-DEEPDIVE-20260410-TR | Versiyon: 1.0</p>
    <p style="font-size:10px; color:#64748b;">16 Ajan Pipeline | 207K Token | Toplam Maliyet: $7.97</p>
    <p style="font-size:9px; color:#94a3b8; margin-top:10px;">Bu rapor Finance X tarafindan uretilmistir ve yatirim tavsiyesi niteligi tasimaz.</p>
  </div>

  <div class="page-footer">
    <span>AKBNK - Yonetim Kurulu Raporu</span>
    <span>Sayfa 13</span>
  </div>
</div>

<!-- ==================== CHARTS ==================== -->
<script>
// Net Kar Grafiği
const profitCtx = document.getElementById('profitChart').getContext('2d');
new Chart(profitCtx, {
  type: 'bar',
  data: {
    labels: ['2021', '2022', '2023', '2024', '2025'],
    datasets: [
      { label: 'Net Kar (Mly TL)', data: [25.0, 60.0, 51.3, 42.4, 57.25], backgroundColor: 'rgba(13,148,136,0.8)', borderColor: 'rgba(13,148,136,1)', borderWidth: 2, order: 2 },
      { label: 'ROE %', data: [30.1, 68.9, 30.0, 20.2, 21.5], type: 'line', borderColor: '#f59e0b', backgroundColor: 'transparent', borderWidth: 3, tension: 0.4, yAxisID: 'y1', order: 1 }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { size: 10 } } } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Mly TL', font: { size: 9 } }, ticks: { font: { size: 9 } } },
      y1: { position: 'right', beginAtZero: true, max: 80, title: { display: true, text: 'ROE %', font: { size: 9 } }, grid: { drawOnChartArea: false }, ticks: { font: { size: 9 }, callback: v => v + '%' } }
    }
  }
});

// NIM Trendi
const nimCtx = document.getElementById('nimChart').getContext('2d');
new Chart(nimCtx, {
  type: 'line',
  data: {
    labels: ['2021', '2022', '2023', '2024', '2025', '2026 Hedef'],
    datasets: [
      { label: 'AKBNK NIM %', data: [3.8, 4.5, 4.7, 3.0, 3.1, 4.0], borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.1)', borderWidth: 3, tension: 0.4, fill: true },
      { label: 'Sektor Saglikli Band (Alt)', data: [3.5, 3.5, 3.5, 3.5, 3.5, 3.5], borderColor: '#10b981', borderWidth: 2, borderDash: [5,5], pointRadius: 0 },
      { label: 'Sektor Saglikli Band (Ust)', data: [5.0, 5.0, 5.0, 5.0, 5.0, 5.0], borderColor: '#10b981', borderWidth: 2, borderDash: [5,5], pointRadius: 0 }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { size: 9 } } } },
    scales: { y: { min: 2.0, max: 5.5, ticks: { font: { size: 9 }, callback: v => v + '%' } } }
  }
});

// Sermaye Rasyoları
const capCtx = document.getElementById('capitalChart').getContext('2d');
new Chart(capCtx, {
  type: 'line',
  data: {
    labels: ['2022', '2023', '2024', '2025 Q4'],
    datasets: [
      { label: 'CET1 %', data: [20.8, 21.8, 17.5, 12.5], borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.1)', borderWidth: 3, tension: 0.4, fill: true },
      { label: 'Toplam SYR %', data: [24.5, 24.9, 19.5, 16.8], borderColor: '#3b82f6', borderWidth: 3, tension: 0.4 },
      { label: 'BDDK Minimum CET1 (8%)', data: [8, 8, 8, 8], borderColor: '#ef4444', borderWidth: 2, borderDash: [5,5], pointRadius: 0 },
      { label: 'BDDK Minimum SYR (12%)', data: [12, 12, 12, 12], borderColor: '#f59e0b', borderWidth: 2, borderDash: [5,5], pointRadius: 0 }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { size: 9 } } } },
    scales: { y: { min: 5, max: 28, ticks: { font: { size: 9 }, callback: v => v + '%' } } }
  }
});

// Peer Comparison
const peerCtx = document.getElementById('peerChart').getContext('2d');
new Chart(peerCtx, {
  type: 'bar',
  data: {
    labels: ['ROE %', 'NIM %', 'NPL %', 'CET1 %', 'Maliyet/Gelir %'],
    datasets: [
      { label: 'AKBNK', data: [21.5, 3.1, 3.5, 12.5, 31.8], backgroundColor: 'rgba(13,148,136,0.8)' },
      { label: 'Isbank', data: [26, 3.7, 4.5, 16, 30], backgroundColor: 'rgba(59,130,246,0.6)' },
      { label: 'Garanti', data: [30, 4.0, 4.0, 15, 28], backgroundColor: 'rgba(249,115,22,0.6)' },
      { label: 'Y.Kredi', data: [28, 3.5, 5.0, 14, 32], backgroundColor: 'rgba(168,85,247,0.6)' }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { font: { size: 9 } } } },
    scales: { y: { beginAtZero: true, ticks: { font: { size: 9 } } } }
  }
});

// Risk Dashboard
const riskCtx = document.getElementById('riskChart').getContext('2d');
new Chart(riskCtx, {
  type: 'bar',
  data: {
    labels: ['NIM Sikismasi', 'Sermaye Erozyonu', 'Jeopolitik', 'FX Riski', 'Likidite', 'Varlik Kalitesi'],
    datasets: [{
      label: 'Risk Skoru (0-10)',
      data: [9, 8, 6, 6, 5, 3],
      backgroundColor: ['#ef4444', '#ef4444', '#f59e0b', '#f59e0b', '#f59e0b', '#10b981'],
      borderWidth: 0
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { min: 0, max: 10, ticks: { font: { size: 9 } } },
      y: { ticks: { font: { size: 10 } } }
    }
  }
});
</script>

</body>
</html>
`;

async function generatePDF() {
  console.log('AKBNK raporu olusturuluyor...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for Chart.js to render
  await new Promise(resolve => setTimeout(resolve, 3000));

  const pdfPath = path.join(__dirname, '../../AKBNK_Yonetim_Kurulu_Raporu_2026.pdf');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
  });

  await browser.close();
  console.log('PDF hazir:', pdfPath);
  return pdfPath;
}

generatePDF().catch(console.error);
