const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ASELS finansal verileri (rapordan çıkarıldı)
const financialData = {
  revenue: [
    { year: 2021, value: 20139 },
    { year: 2022, value: 126353 },
    { year: 2023, value: 139076 },
    { year: 2024, value: 157340 },
    { year: 2025, value: 180445 }
  ],
  netProfit: [
    { year: 2021, value: 7127 },
    { year: 2022, value: 2248 },
    { year: 2023, value: 13936 },
    { year: 2024, value: 19925 },
    { year: 2025, value: 29918 }
  ],
  margins: {
    gross: [33, 27, 27, 32, 32],
    ebitda: [27, 21, 22, 25, 26],
    net: [35, 2, 10, 13, 17]
  },
  equity: [
    { year: 2021, value: 25835 },
    { year: 2022, value: 152708 },
    { year: 2023, value: 167022 },
    { year: 2024, value: 185028 },
    { year: 2025, value: 251786 }
  ]
};

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ASELSAN - Yönetim Kurulu Raporu</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    @page {
      size: A4 landscape;
      margin: 20mm;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }

    .cover {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 60px;
      text-align: center;
      border-radius: 8px;
      margin-bottom: 30px;
      page-break-after: always;
    }

    .cover h1 {
      font-size: 48px;
      margin: 0 0 20px 0;
      font-weight: 700;
    }

    .cover .subtitle {
      font-size: 24px;
      opacity: 0.9;
      margin-bottom: 40px;
    }

    .cover .meta {
      font-size: 16px;
      opacity: 0.8;
      margin-top: 60px;
    }

    .section {
      background: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 28px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 10px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }

    .kpi-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }

    .kpi-label {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-value {
      font-size: 32px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 4px;
    }

    .kpi-change {
      font-size: 14px;
      font-weight: 600;
    }

    .kpi-change.positive {
      color: #10b981;
    }

    .kpi-change.negative {
      color: #ef4444;
    }

    .chart-container {
      position: relative;
      height: 350px;
      margin: 30px 0;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }

    .highlights {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 20px;
      margin: 20px 0;
    }

    .highlights h3 {
      color: #166534;
      margin-top: 0;
    }

    .highlights ul {
      margin: 10px 0;
      padding-left: 20px;
    }

    .highlights li {
      margin-bottom: 8px;
      color: #15803d;
    }

    .risks {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 20px;
      margin: 20px 0;
    }

    .risks h3 {
      color: #991b1b;
      margin-top: 0;
    }

    .risks ul {
      margin: 10px 0;
      padding-left: 20px;
    }

    .risks li {
      margin-bottom: 8px;
      color: #dc2626;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #1e293b;
    }

    .footer {
      text-align: center;
      padding: 20px;
      color: #64748b;
      font-size: 12px;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <!-- KAPAK SAYFASI -->
  <div class="cover">
    <h1>ASELSAN ELEKTRONİK SANAYİ VE TİCARET A.Ş.</h1>
    <div class="subtitle">Yönetim Kurulu Raporu</div>
    <div class="subtitle">ASELS — BIST</div>
    <div class="meta">
      <p>Rapor Tarihi: 10 Nisan 2026</p>
      <p>Analiz Dönemi: 2021-2025</p>
      <p>Finance X Platform</p>
    </div>
  </div>

  <!-- ANA KPI'LAR -->
  <div class="section">
    <h2 class="section-title">📊 Temel Göstergeler (2025)</h2>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Hasılat</div>
        <div class="kpi-value">180.4 Mly ₺</div>
        <div class="kpi-change positive">↑ 15% YoY</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Net Kâr</div>
        <div class="kpi-value">29.9 Mly ₺</div>
        <div class="kpi-change positive">↑ 50% YoY</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">FAVÖK Marjı</div>
        <div class="kpi-value">26.2%</div>
        <div class="kpi-change positive">Sektör lideri</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Borç/Özkaynak</div>
        <div class="kpi-value">0.71×</div>
        <div class="kpi-change positive">Konservatif</div>
      </div>
    </div>
  </div>

  <!-- GELİR VE KÂRLILIK GRAFİKLERİ -->
  <div class="section">
    <h2 class="section-title">📈 Finansal Performans Trendi</h2>
    <div class="two-col">
      <div>
        <h3 style="text-align: center; color: #64748b;">Hasılat Büyümesi (Milyon ₺)</h3>
        <div class="chart-container">
          <canvas id="revenueChart"></canvas>
        </div>
      </div>
      <div>
        <h3 style="text-align: center; color: #64748b;">Net Kâr Gelişimi (Milyon ₺)</h3>
        <div class="chart-container">
          <canvas id="profitChart"></canvas>
        </div>
      </div>
    </div>
  </div>

  <!-- MARJ ANALİZİ -->
  <div class="section">
    <h2 class="section-title">💰 Karlılık Marjları</h2>
    <div class="chart-container">
      <canvas id="marginsChart"></canvas>
    </div>
  </div>

  <!-- GÜÇLÜ YÖNLER VE RİSKLER -->
  <div class="section">
    <h2 class="section-title">⚖️ Stratejik Değerlendirme</h2>
    <div class="two-col">
      <div class="highlights">
        <h3>✅ Güçlü Yönler</h3>
        <ul>
          <li><strong>Sektör Lideri Karlılık:</strong> FAVÖK %26.2, rakiplerden 2-5× yüksek</li>
          <li><strong>Güçlü Bilanço:</strong> Borç/Özkaynak 0.71×, %58 özkaynak oranı</li>
          <li><strong>Gelir Görünürlüğü:</strong> $1.13 milyar onaylanmış sözleşme backlog'u</li>
          <li><strong>Makro Yalıtımı:</strong> Devlet destekli talep, enflasyon endeksli fiyatlama</li>
          <li><strong>İhracat İvmesi:</strong> $958M ihracat (+%89 YoY)</li>
        </ul>
      </div>
      <div class="risks">
        <h3>⚠️ Risk Faktörleri</h3>
        <ul>
          <li><strong>Müşteri Yoğunlaşması:</strong> Backlog'un %88'i Türk devleti</li>
          <li><strong>Likidite İzleme:</strong> Cari oran 1.39×, eşik seviyesinde</li>
          <li><strong>Nakit Çıkışı:</strong> Temettü + CAPEX ~$830M (2025-2026)</li>
          <li><strong>Teknik Aşırı Alım:</strong> RSI 82.3, tüm zamanların en yüksek fiyatında</li>
          <li><strong>Sözleşme Teslimat Riski:</strong> Teknik gecikmeler olasılığı</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- BACKLOG ANALİZİ -->
  <div class="section">
    <h2 class="section-title">📋 Sözleşme Backlog ve Gelir Görünürlüğü</h2>
    <table>
      <thead>
        <tr>
          <th>Sözleşme</th>
          <th>Tutar</th>
          <th>Müşteri</th>
          <th>Teslimat</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Polonya İhracatı</td>
          <td>$410M</td>
          <td>Polonya</td>
          <td>2026-2028</td>
        </tr>
        <tr>
          <td>SSB Elektronik Harp</td>
          <td>$169.7M</td>
          <td>SSB (Türkiye)</td>
          <td>2026-2029</td>
        </tr>
        <tr>
          <td>Askeri Haberleşme</td>
          <td>$158.6M</td>
          <td>Orta Doğu/Afrika</td>
          <td>2026-2028</td>
        </tr>
        <tr style="font-weight: 600; background: #f1f5f9;">
          <td>TOPLAM BACKLOG</td>
          <td>~$1.13 milyar</td>
          <td>Çeşitli</td>
          <td>2026-2029</td>
        </tr>
      </tbody>
    </table>
    <p style="color: #64748b; font-size: 14px; margin-top: 10px;">
      <strong>Etki:</strong> Backlog FY2025 hasılatının %21'ine denk geliyor. 2026-2029 döneminde
      yıllık %15-20 artımlı hasılat beklentisi.
    </p>
  </div>

  <!-- TEKNİK GÖRÜNÜM -->
  <div class="section">
    <h2 class="section-title">📉 Teknik Görünüm</h2>
    <div class="two-col">
      <div>
        <h3 style="color: #64748b;">Mevcut Durum (10 Nisan 2026)</h3>
        <table style="margin-top: 20px;">
          <tbody>
            <tr>
              <td><strong>Kapanış Fiyatı</strong></td>
              <td>376.75 ₺</td>
            </tr>
            <tr>
              <td><strong>Günlük Değişim</strong></td>
              <td style="color: #10b981;">+4.00%</td>
            </tr>
            <tr>
              <td><strong>RSI (14)</strong></td>
              <td style="color: #ef4444;">82.3 (Aşırı Alım)</td>
            </tr>
            <tr>
              <td><strong>50-Gün HO</strong></td>
              <td>354.31 ₺ (Üzerinde)</td>
            </tr>
            <tr>
              <td><strong>200-Gün HO</strong></td>
              <td>339.00 ₺ (Üzerinde)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <h3 style="color: #64748b;">Destek & Direnç Seviyeleri</h3>
        <table style="margin-top: 20px;">
          <thead>
            <tr>
              <th>Seviye</th>
              <th>Fiyat</th>
              <th>Uzaklık</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #fef2f2;">
              <td>Direnç 2</td>
              <td>406.67 ₺</td>
              <td>+7.9%</td>
            </tr>
            <tr style="background: #fef2f2;">
              <td>Direnç 1</td>
              <td>391.33 ₺</td>
              <td>+3.9%</td>
            </tr>
            <tr style="font-weight: 600;">
              <td>Mevcut</td>
              <td>376.75 ₺</td>
              <td>—</td>
            </tr>
            <tr style="background: #f0fdf4;">
              <td>Destek 1</td>
              <td>345.33 ₺</td>
              <td>-8.3%</td>
            </tr>
            <tr style="background: #f0fdf4;">
              <td>Destek 2</td>
              <td>314.67 ₺</td>
              <td>-16.5%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div style="background: #fff7ed; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px;">
      <strong style="color: #b45309;">⚠️ Teknik Uyarı:</strong> Hisse tüm zamanların en yüksek seviyesinde
      işlem görüyor ve RSI aşırı alım bölgesinde (82.3). Kısa vadede (1-2 hafta) konsolidasyon/düzeltme
      olasılığı yüksek. Yeni pozisyon girişlerinde teknik düzeltme beklemek (345-354 ₺ bandı) taktiksel
      olarak daha uygun olabilir.
    </div>
  </div>

  <!-- GENEL DEĞERLENDİRME -->
  <div class="section">
    <h2 class="section-title">🎯 Yönetici Sonuç Değerlendirmesi</h2>
    <div style="padding: 20px; background: #fafafa; border-radius: 8px;">
      <h3 style="color: #1e3a8a; margin-top: 0;">Temel Tez</h3>
      <p style="font-size: 16px; line-height: 1.8; color: #334155;">
        <strong>ASELSAN</strong> fundamentalleri güçlü bir savunma teknolojileri lideridir.
        Sektör lideri karlılık (%26 FAVÖK marjı), güçlü bilanço yapısı (0.71× Borç/Özkaynak),
        ve görünür gelir backlog'u ($1.13 milyar) ile <strong>orta vadeli büyüme görünümü
        yapısal faktörlerle destekleniyor:</strong>
      </p>
      <ul style="font-size: 16px; line-height: 1.8; color: #334155;">
        <li>Devlet savunma bütçesi artışı ($28.2M, +%15 reel)</li>
        <li>Kapasite genişlemesi ($616M CAPEX, 2026 ortası devreye alınacak)</li>
        <li>İhracat ivmesi (+%89 YoY, $958M)</li>
        <li>Makro yalıtımı (enflasyon endeksli sözleşmeler, avans modeli)</li>
      </ul>

      <h3 style="color: #dc2626; margin-top: 30px;">Dikkat Edilmesi Gereken Hususlar</h3>
      <p style="font-size: 16px; line-height: 1.8; color: #334155;">
        <strong>Teknik durum</strong> kısa vadede tedbirli: RSI aşırı alım bölgesinde (82.3),
        tüm zamanların en yüksek seviyesinde (376.75 ₺) işlem görüyor. Konsolidasyon/düzeltme
        olasılığı yüksek.
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: #334155;">
        <strong>Likidite</strong> takip edilmeli: Cari oran 1.39× eşik seviyesinde.
        Temettü (-1.07M ₺) + CAPEX (-$616M) çift nakit çıkışı 2025-2026 döneminde gerçekleşiyor.
      </p>
      <p style="font-size: 16px; line-height: 1.8; color: #334155;">
        <strong>Veri kalitesi uyarısı:</strong> Nakit akış tablosu verileri eksikliği analiz
        bütünlüğünü azaltıyor. FCF ve nakit dönüşüm kalitesi değerlendirilemedi.
      </p>

      <h3 style="color: #059669; margin-top: 30px;">Yatırım Ufku Görünümü</h3>
      <table style="margin-top: 15px;">
        <thead>
          <tr>
            <th>Dönem</th>
            <th>Görünüm</th>
            <th>Değerlendirme</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Kısa Vade</strong><br>(1-4 hafta)</td>
            <td style="color: #f59e0b;">⚠️ Tedbirli</td>
            <td>Teknik düzeltme riski, aşırı alım sinyalleri</td>
          </tr>
          <tr>
            <td><strong>Orta Vade</strong><br>(3-12 ay)</td>
            <td style="color: #10b981;">✅ Pozitif</td>
            <td>Fundamentaller konstruktif, backlog görünürlüğü var</td>
          </tr>
          <tr>
            <td><strong>Uzun Vade</strong><br>(1+ yıl)</td>
            <td style="color: #10b981;">✅ Yapısal Güçlü</td>
            <td>Sektör tailwindleri devam edecek (savunma bütçesi, yerlilik)</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <p><strong>Finance X Platform</strong> | Yapay Zeka Destekli Analitik Rapor</p>
    <p>Bu rapor Finance X tarafından üretilen otomatik bir analitik rapordur. Yatırım tavsiyesi niteliği taşımaz.</p>
    <p>Rapor ID: fs-out-asels-20260410-001 | Hazırlanma: 10 Nisan 2026</p>
  </div>

  <script>
    // Hasılat Grafiği
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    new Chart(revenueCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(financialData.revenue.map(d => d.year))},
        datasets: [{
          label: 'Hasılat (Milyon ₺)',
          data: ${JSON.stringify(financialData.revenue.map(d => d.value))},
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString() + 'M';
              }
            }
          }
        }
      }
    });

    // Net Kâr Grafiği
    const profitCtx = document.getElementById('profitChart').getContext('2d');
    new Chart(profitCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(financialData.netProfit.map(d => d.year))},
        datasets: [{
          label: 'Net Kâr (Milyon ₺)',
          data: ${JSON.stringify(financialData.netProfit.map(d => d.value))},
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString() + 'M';
              }
            }
          }
        }
      }
    });

    // Marj Grafiği
    const marginsCtx = document.getElementById('marginsChart').getContext('2d');
    new Chart(marginsCtx, {
      type: 'line',
      data: {
        labels: [2021, 2022, 2023, 2024, 2025],
        datasets: [
          {
            label: 'Brüt Marj (%)',
            data: ${JSON.stringify(financialData.margins.gross)},
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            tension: 0.4
          },
          {
            label: 'FAVÖK Marjı (%)',
            data: ${JSON.stringify(financialData.margins.ebitda)},
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            tension: 0.4
          },
          {
            label: 'Net Marj (%)',
            data: ${JSON.stringify(financialData.margins.net)},
            borderColor: 'rgba(245, 158, 11, 1)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 3,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 40,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  </script>
</body>
</html>
`;

async function generatePDF() {
  console.log('🚀 PDF oluşturuluyor...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  // Grafiklerin render olması için bekle
  await new Promise(resolve => setTimeout(resolve, 2000));

  const pdfPath = path.join(__dirname, '../data/ASELS_Yonetim_Kurulu_Raporu_2026.pdf');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: {
      top: '10mm',
      right: '10mm',
      bottom: '10mm',
      left: '10mm'
    }
  });

  await browser.close();

  console.log('✅ PDF hazır:', pdfPath);
  return pdfPath;
}

generatePDF().catch(console.error);
