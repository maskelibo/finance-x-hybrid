const puppeteer = require('puppeteer');
const path = require('path');

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>KCHOL — Kapsamli Analiz Raporu</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
  <style>
    @page{size:A4 portrait;margin:15mm}*{box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;margin:0;padding:0;color:#1e293b;font-size:11px;line-height:1.5;background:#fff}.page{page-break-after:always;padding:0 10px;min-height:90vh}.page:last-child{page-break-after:auto}
    .cover{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);color:#fff;padding:80px 60px;text-align:center;min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center}.cover h1{font-size:42px;margin:0 0 10px;font-weight:800}.cover .ticker{font-size:56px;font-weight:900;color:#e94560;margin:20px 0}.cover .subtitle{font-size:18px;opacity:.9;margin-bottom:60px}.cover .meta{font-size:13px;opacity:.7}.cover .meta p{margin:4px 0}
    .section-title{font-size:22px;font-weight:700;color:#16213e;margin:25px 0 15px;padding-bottom:8px;border-bottom:3px solid #e94560}.section-subtitle{font-size:11px;color:#64748b;margin:-10px 0 15px}h3{font-size:14px;color:#334155;margin:15px 0 8px}
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:15px 0}.kpi-card{background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);padding:12px;border-radius:6px;border-left:4px solid #e94560}.kpi-label{font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}.kpi-value{font-size:22px;font-weight:700;color:#0f172a}.kpi-change{font-size:10px;font-weight:600}.kpi-change.positive{color:#059669}.kpi-change.negative{color:#dc2626}.kpi-change.warning{color:#d97706}
    table{width:100%;border-collapse:collapse;margin:10px 0;font-size:10px}th{background:#16213e;color:#fff;padding:8px 6px;text-align:left;font-weight:600;font-size:9px;text-transform:uppercase}td{padding:7px 6px;border-bottom:1px solid #e2e8f0}tr:nth-child(even){background:#f8fafc}tr.highlight{background:#fff3cd;font-weight:600}tr.danger{background:#fef2f2}
    .chart-container{position:relative;height:220px;margin:10px 0}.chart-half{height:180px}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:20px}.three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px}
    .callout{padding:12px 15px;border-radius:6px;margin:10px 0;font-size:11px}.callout-green{background:#f0fdf4;border-left:4px solid #10b981}.callout-red{background:#fef2f2;border-left:4px solid #ef4444}.callout-amber{background:#fffbeb;border-left:4px solid #f59e0b}.callout-blue{background:#eff6ff;border-left:4px solid #3b82f6}.callout h4{margin:0 0 6px;font-size:12px}.callout ul{margin:4px 0;padding-left:18px}.callout li{margin-bottom:3px}
    .page-footer{position:relative;bottom:0;width:100%;border-top:1px solid #e2e8f0;padding-top:6px;margin-top:20px;display:flex;justify-content:space-between;font-size:9px;color:#94a3b8}
    .conf-high{display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;background:#dcfce7;color:#166534}.conf-medium{display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;background:#fef3c7;color:#92400e}
  </style>
</head>
<body>
<div class="cover page"><h1>Yonetim Kurulu Raporu</h1><div class="ticker">KCHOL</div><div class="subtitle">Koc Holding A.S.</div><div class="subtitle">Kapsamli Finansal ve Stratejik Analiz</div><div class="meta"><p>Rapor Tarihi: 10 Nisan 2026</p><p>Analiz Tipi: Deep Dive | 21 Ajan Pipeline</p><p>Hazirlayan: Finance X Platform</p></div></div>

<div class="page">
  <h2 class="section-title">Yonetici Ozeti</h2>
  <div class="callout callout-blue"><h4>Ana Sonuc</h4><p><strong>KCHOL</strong>, Turkiye'nin en buyuk sanayi holdingi olarak <strong>%39.5 holding iskontosu</strong> ile islem gormektedir (tarihsel %10-40 araliginin ust siniri). Guclu temettu (%3.35 verim) ve portfoy optimizasyonu (Tupras satisi, Koc Finansman cikisi) iskonto daralmasi potansiyeli tasir. Ancak <strong>dusuk sermaye verimliligi</strong> (ROE %3.25, ROCE %1.48) holding yapisinin deger yiktigini gostermektedir. <strong>Genel gorunum: NOTR-POZITIF</strong> — deger firsati var ama katalizor gerekli.</p></div>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-label">Piyasa Degeri</div><div class="kpi-value">517 Mly TL</div><div class="kpi-change">204 TL x 2.536M hisse</div></div>
    <div class="kpi-card"><div class="kpi-label">NAV (SOTP)</div><div class="kpi-value">882 Mly TL</div><div class="kpi-change negative">%39.5 iskonto</div></div>
    <div class="kpi-card"><div class="kpi-label">ROE</div><div class="kpi-value">%3.25</div><div class="kpi-change negative">Sermaye maliyetinin cok altinda</div></div>
    <div class="kpi-card"><div class="kpi-label">Temettu Verimi</div><div class="kpi-value">%3.35</div><div class="kpi-change positive">6.83 TL/hisse, %78.7 payout</div></div>
  </div>
  <div class="two-col">
    <div class="callout callout-green"><h4>Guclu Yonler</h4><ul><li><strong>Mavi cip portfoy:</strong> TUPRS (monopol rafineri), FROTO (ihracat #1), YKBNK (#7 banka)</li><li><strong>Temettu surdurulebilirligi:</strong> 1.27x karsilama orani</li><li><strong>Portfoy optimizasyonu:</strong> Tupras satisi 9.32 Mly TL, Koc Finansman cikisi</li><li><strong>Teknik guc:</strong> ADX 49.1, tum HO'larin uzerinde, +%31 yillik getiri</li></ul></div>
    <div class="callout callout-red"><h4>Risk Faktorleri</h4><ul><li><strong>Sermaye verimliligi krizi:</strong> ROE %3.25, ROCE %1.48</li><li><strong>Holding iskontosu:</strong> %39.5 — tarihsel ust sinir</li><li><strong>Arcelik cokusu:</strong> Ihracat -%12, Cin rekabeti</li><li><strong>Jeopolitik:</strong> Iran savasi → enerji volatilitesi</li><li><strong>Net marj cokusu:</strong> %9.64 → %0.80 (2023-2025)</li></ul></div>
  </div>
  <div class="page-footer"><span>KCHOL - Yonetim Kurulu Raporu</span><span>Sayfa 1</span></div>
</div>

<div class="page">
  <h2 class="section-title">Sum-of-Parts (SOTP) ve Holding Iskontosu</h2>
  <div class="chart-container"><canvas id="navChart"></canvas></div>
  <table><thead><tr><th>Bagli Ortaklik</th><th>Ticker</th><th>Piyasa Deg. (Mly TL)</th><th>KCHOL Pay %</th><th>KCHOL Payi (Mly TL)</th></tr></thead><tbody>
    <tr><td><strong>Tupras</strong></td><td>TUPRS</td><td>501.0</td><td>51.2%</td><td><strong>256.5</strong></td></tr>
    <tr><td><strong>Yapi Kredi</strong></td><td>YKBNK</td><td>280.3</td><td>68.0%</td><td><strong>190.6</strong></td></tr>
    <tr><td><strong>Ford Otosan</strong></td><td>FROTO</td><td>375.8</td><td>~50%</td><td><strong>187.9</strong></td></tr>
    <tr><td><strong>Tofas</strong></td><td>TOASO</td><td>155.1</td><td>41%</td><td><strong>63.6</strong></td></tr>
    <tr><td><strong>Arcelik</strong></td><td>ARCLK</td><td>67.2</td><td>53.5%</td><td><strong>35.9</strong></td></tr>
    <tr class="highlight"><td><strong>TOPLAM KOTE</strong></td><td></td><td></td><td></td><td><strong>734.5</strong></td></tr>
    <tr><td>Kote Olmayan (Aygaz, Opet, Otokoc)</td><td></td><td></td><td></td><td><strong>~147.5</strong></td></tr>
    <tr class="highlight"><td><strong>BRUT VARLIK DEGERI</strong></td><td></td><td></td><td></td><td><strong>882.0</strong></td></tr>
  </tbody></table>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-label">NAV</div><div class="kpi-value">882 Mly</div><div class="kpi-change">Kote + kote olmayan</div></div>
    <div class="kpi-card"><div class="kpi-label">Piyasa Deg.</div><div class="kpi-value">517 Mly</div><div class="kpi-change negative">NAV'in %58.6'si</div></div>
    <div class="kpi-card"><div class="kpi-label">Iskonto</div><div class="kpi-value">%39.5</div><div class="kpi-change negative">Ust sinir</div></div>
    <div class="kpi-card"><div class="kpi-label">Daralirsa (%30)</div><div class="kpi-value">+%20.9</div><div class="kpi-change positive">617 Mly TL hedef</div></div>
  </div>
  <div class="callout callout-amber"><h4>Iskonto Neden Genis?</h4><ul><li>ROE %3.25 &lt;&lt; sermaye maliyeti %38 — deger yikimi</li><li>Konglomera karmasikligi — yatirimci pure-play tercih eder</li><li>Aile kontrolu %63.4 — azinlik haklari sinirli</li><li>Kote olmayan varliklarin dusuk likiditesi</li></ul></div>
  <div class="page-footer"><span>KCHOL - Yonetim Kurulu Raporu</span><span>Sayfa 2</span></div>
</div>

<div class="page">
  <h2 class="section-title">Segment Bazli Performans</h2>
  <div class="chart-container chart-half"><canvas id="segmentChart"></canvas></div>
  <table><thead><tr><th>Segment</th><th>Sirket</th><th>KCHOL Pay</th><th>Durum</th><th>2026 Gorunum</th></tr></thead><tbody>
    <tr><td><strong>Enerji</strong></td><td>Tupras</td><td>51.2%</td><td style="color:#059669">GUCLU</td><td style="color:#f59e0b">Karisik — marj normalizasyonu riski</td></tr>
    <tr><td><strong>Finans</strong></td><td>Yapi Kredi</td><td>68.0%</td><td style="color:#f59e0b">ORTA</td><td style="color:#dc2626">Riskli — NIM baskisi, NPL artisi</td></tr>
    <tr><td><strong>Otomotiv</strong></td><td>FROTO/TOASO</td><td>50/41%</td><td style="color:#f59e0b">KARISIK</td><td style="color:#f59e0b">Ihracat guclu, ic pazar zayif</td></tr>
    <tr class="danger"><td><strong>Dayanikli Tuk.</strong></td><td>Arcelik</td><td>53.5%</td><td style="color:#dc2626">ZAYIF</td><td style="color:#dc2626">Cin rekabeti, Avrupa talep dusuk</td></tr>
  </tbody></table>
  <div class="callout callout-red"><h4>Jeopolitik Etki: Iran Savasi</h4><p>Brent $61→$118 (%95 spike). Turkiye enerji +%25 zam. Tupras gecici fayda, diger 3 segment olumsuz. Ateskes kirilgan — binary senaryo riski.</p></div>
  <h3>Makro → Segment Transmisyon</h3>
  <table><thead><tr><th>Makro</th><th>Enerji</th><th>Finans</th><th>Otomotiv</th><th>Day. Tuk.</th></tr></thead><tbody>
    <tr><td>Faiz %37</td><td style="color:#059669">Notr</td><td style="color:#f59e0b">Karisik</td><td style="color:#dc2626">Negatif</td><td style="color:#dc2626">Negatif</td></tr>
    <tr><td>TL -%17</td><td style="color:#059669">Pozitif</td><td style="color:#dc2626">Negatif</td><td style="color:#059669">Pozitif</td><td style="color:#f59e0b">Karisik</td></tr>
    <tr><td>Iran Savasi</td><td style="color:#059669">Pozitif</td><td style="color:#dc2626">Negatif</td><td style="color:#dc2626">Negatif</td><td style="color:#dc2626">Negatif</td></tr>
  </tbody></table>
  <div class="page-footer"><span>KCHOL - Yonetim Kurulu Raporu</span><span>Sayfa 3</span></div>
</div>

<div class="page">
  <h2 class="section-title">Finansal Performans Trendi</h2>
  <div class="chart-container"><canvas id="profitChart"></canvas></div>
  <table><thead><tr><th>Metrik</th><th>2021</th><th>2022</th><th>2023</th><th>2024</th><th>2025</th></tr></thead><tbody>
    <tr><td><strong>Hasilat (Mly TL)</strong></td><td>477,050</td><td>1,555,660</td><td>1,988,419</td><td>2,252,685</td><td>2,757,295</td></tr>
    <tr><td><strong>Net Kar (Mly TL)</strong></td><td>46,483</td><td>91,427</td><td>191,696</td><td>25,872</td><td>22,000</td></tr>
    <tr><td><strong>Net Marj %</strong></td><td>9.74</td><td>5.88</td><td>9.64</td><td>1.15</td><td>~0.80</td></tr>
  </tbody></table>
  <div class="callout callout-red"><h4>Karlilik Cokusu (2024-2025)</h4><p>Net kar 191.7 Mly → 22 Mly (-%88.5). Net marj %9.64 → %0.80. Olasi nedenler: IAS 29 tersine donus, Arcelik impairment, enerji one-time kalemler. <strong>Denetim notlari ile dogrulanmadi.</strong></p></div>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-label">ROE</div><div class="kpi-value">%3.25</div><div class="kpi-change negative">Benchmark %12-20</div></div>
    <div class="kpi-card"><div class="kpi-label">ROCE</div><div class="kpi-value">%1.48</div><div class="kpi-change negative">WACC %37.2</div></div>
    <div class="kpi-card"><div class="kpi-label">Temettu Karsilama</div><div class="kpi-value">1.27x</div><div class="kpi-change positive">Surdurulebilir</div></div>
    <div class="kpi-card"><div class="kpi-label">Payout</div><div class="kpi-value">%78.7</div><div class="kpi-change warning">Yuksek</div></div>
  </div>
  <div class="page-footer"><span>KCHOL - Yonetim Kurulu Raporu</span><span>Sayfa 4</span></div>
</div>

<div class="page">
  <h2 class="section-title">Teknik Analiz ve Piyasa Pozisyonu</h2>
  <div class="kpi-grid">
    <div class="kpi-card"><div class="kpi-label">Kapanis</div><div class="kpi-value">204.00 TL</div><div class="kpi-change positive">+%2.20</div></div>
    <div class="kpi-card"><div class="kpi-label">52h Yuksek</div><div class="kpi-value">229.10 TL</div><div class="kpi-change warning">-%11.0</div></div>
    <div class="kpi-card"><div class="kpi-label">RSI (14)</div><div class="kpi-value">64.6</div><div class="kpi-change positive">Yukselis</div></div>
    <div class="kpi-card"><div class="kpi-label">ADX</div><div class="kpi-value">49.1</div><div class="kpi-change positive">Cok guclu</div></div>
  </div>
  <div class="two-col"><div>
    <h3>Destek / Direnc</h3>
    <table><thead><tr><th>Seviye</th><th>Fiyat</th><th>Uzaklik</th></tr></thead><tbody>
      <tr style="background:#fef2f2"><td>Direnc 3 (52h)</td><td>229.10</td><td>+%12.3</td></tr>
      <tr style="background:#fef2f2"><td>Direnc 1</td><td>205.16</td><td>+%0.6</td></tr>
      <tr style="font-weight:700"><td>Mevcut</td><td>204.00</td><td>—</td></tr>
      <tr style="background:#f0fdf4"><td>Destek 1</td><td>192.33</td><td>-%5.7</td></tr>
      <tr style="background:#f0fdf4"><td>Destek 2 (Fib)</td><td>185.67</td><td>-%9.0</td></tr>
      <tr style="background:#f0fdf4"><td>Destek 3</td><td>170.14</td><td>-%16.6</td></tr>
    </tbody></table>
  </div><div>
    <h3>Momentum</h3>
    <table><thead><tr><th>Gosterge</th><th>Deger</th><th>Sinyal</th></tr></thead><tbody>
      <tr><td>RSI (14)</td><td>64.6</td><td style="color:#059669">Alis</td></tr>
      <tr><td>MACD</td><td>+1.66</td><td style="color:#059669">Alis</td></tr>
      <tr><td>Stochastic</td><td>72.7</td><td style="color:#f59e0b">Dikkatli</td></tr>
      <tr><td>ADX</td><td>49.1</td><td style="color:#059669">Cok guclu trend</td></tr>
    </tbody></table>
    <p style="font-size:10px;color:#059669;font-weight:600">Tum HO'larin uzerinde — golden alignment</p>
  </div></div>
  <div class="page-footer"><span>KCHOL - Yonetim Kurulu Raporu</span><span>Sayfa 5</span></div>
</div>

<div class="page">
  <h2 class="section-title">Risk Dashboard ve Senaryo Analizi</h2>
  <div class="chart-container chart-half"><canvas id="riskChart"></canvas></div>
  <h3>Hedef Fiyat Senaryolari (SOTP Bazli)</h3>
  <table><thead><tr><th>Senaryo</th><th>Olasilik</th><th>Iskonto</th><th>Hedef</th><th>Potansiyel</th></tr></thead><tbody>
    <tr class="danger"><td><strong>Ayi</strong></td><td>%25</td><td>%50</td><td>215 TL</td><td style="color:#059669">+%5.4</td></tr>
    <tr class="highlight"><td><strong>Baz</strong></td><td>%50</td><td>%40</td><td>265 TL</td><td style="color:#059669">+%29.9</td></tr>
    <tr style="background:#f0fdf4"><td><strong>Boga</strong></td><td>%25</td><td>%25</td><td>320 TL</td><td style="color:#059669">+%56.9</td></tr>
  </tbody></table>
  <div class="callout callout-blue"><h4>Yatirim Tezi</h4><p>KCHOL <strong>iskonto daralma hikayesidir</strong>. PD/DD 0.76x, %39.5 iskonto. Portfoy optimizasyonu + temettu (%3.35) katalizor saglayabilir. Ancak ROE %3.25 iskontoya hak veriyor — sermaye verimliligi iyilesmeden anlamli daralma beklenmemeli.</p></div>
  <h3>Izleme Plani</h3>
  <table><thead><tr><th>Tarih</th><th>Olay</th><th>Izlenecek</th></tr></thead><tbody>
    <tr><td><strong>20 Nisan</strong></td><td>Q1 2026 Bilancolari</td><td>Net marj toparlanmasi, segment performans</td></tr>
    <tr><td><strong>22 Nisan</strong></td><td>TCMB PPK</td><td>Faiz karari — tum segmentler etkilenir</td></tr>
    <tr><td><strong>Q2 2026</strong></td><td>Arcelik Ihracat</td><td>Avrupa talebi toparlanma sinyali?</td></tr>
    <tr><td><strong>Q3 2026</strong></td><td>Iran Ateskes</td><td>Enerji fiyat stabilizasyonu?</td></tr>
  </tbody></table>
  <div style="text-align:center;margin-top:20px;padding:15px;background:#f8fafc;border-radius:8px;">
    <p style="font-size:12px;font-weight:700;color:#16213e">Finance X Platform | Rapor Kodu: KCHOL-DEEPDIVE-20260410</p>
    <p style="font-size:9px;color:#94a3b8">21 Ajan | $8.22 | Bu rapor yatirim tavsiyesi degildir.</p>
  </div>
  <div class="page-footer"><span>KCHOL - Yonetim Kurulu Raporu</span><span>Sayfa 6</span></div>
</div>

<script>
new Chart(document.getElementById('navChart').getContext('2d'),{type:'bar',data:{labels:['Tupras','Yapi Kredi','Ford Otosan','Tofas','Arcelik','Kote Olmayan'],datasets:[{label:'KCHOL Payi (Mly TL)',data:[256.5,190.6,187.9,63.6,35.9,147.5],backgroundColor:['#e94560','#0f3460','#16213e','#533483','#2b2d42','#8d99ae']}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},title:{display:true,text:'SOTP Bagli Ortaklik Degerleri (Mly TL)',font:{size:12}}},scales:{y:{ticks:{font:{size:9}}}}}});
new Chart(document.getElementById('segmentChart').getContext('2d'),{type:'doughnut',data:{labels:['Enerji','Finans','Otomotiv','Day. Tuketim','Diger'],datasets:[{data:[40,25,20,10,5],backgroundColor:['#e94560','#0f3460','#16213e','#533483','#8d99ae']}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:9}}},title:{display:true,text:'Tahmini FAVOK Dagilimi',font:{size:12}}}}});
new Chart(document.getElementById('profitChart').getContext('2d'),{type:'bar',data:{labels:['2021','2022','2023','2024','2025'],datasets:[{label:'Net Kar (Mly TL)',data:[46483,91427,191696,25872,22000],backgroundColor:'rgba(233,69,96,0.8)',order:2},{label:'Net Marj %',data:[9.74,5.88,9.64,1.15,0.80],type:'line',borderColor:'#0f3460',borderWidth:3,tension:0.4,yAxisID:'y1',order:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top',labels:{font:{size:9}}}},scales:{y:{ticks:{font:{size:9},callback:v=>(v/1000).toFixed(0)+'B'}},y1:{position:'right',min:0,max:12,grid:{drawOnChartArea:false},ticks:{font:{size:9},callback:v=>v+'%'}}}}});
new Chart(document.getElementById('riskChart').getContext('2d'),{type:'bar',data:{labels:['Sermaye Verimliligi','Jeopolitik','Segment Baskisi','Holding Iskontosu','Makro','Temettu Risk'],datasets:[{label:'Risk (0-10)',data:[9,8,7,6,6,3],backgroundColor:['#ef4444','#ef4444','#f59e0b','#f59e0b','#f59e0b','#10b981']}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{min:0,max:10,ticks:{font:{size:9}}},y:{ticks:{font:{size:10}}}}}});
<\/script>
</body></html>`;

async function generatePDF() {
  console.log('KCHOL raporu olusturuluyor...');
  const browser = await puppeteer.launch({headless:'new',args:['--no-sandbox']});
  const page = await browser.newPage();
  await page.setContent(htmlContent,{waitUntil:'domcontentloaded',timeout:30000});
  await new Promise(r=>setTimeout(r,3000));
  const pdfPath = path.join(__dirname,'../../KCHOL_Yonetim_Kurulu_Raporu_2026.pdf');
  await page.pdf({path:pdfPath,format:'A4',printBackground:true,margin:{top:'10mm',right:'10mm',bottom:'10mm',left:'10mm'}});
  await browser.close();
  console.log('PDF hazir:',pdfPath);
}
generatePDF().catch(console.error);
