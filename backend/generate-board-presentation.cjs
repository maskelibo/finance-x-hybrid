const puppeteer = require('puppeteer');
const fs = require('fs');

async function generatePresentation() {
  const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASELSAN - Yönetim Kurulu Sunumu</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #ffffff;
            color: #1a1a1a;
        }

        .page {
            width: 210mm;
            height: 297mm;
            padding: 20mm;
            page-break-after: always;
            position: relative;
            background: white;
        }

        .cover {
            background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }

        .cover h1 {
            font-size: 56px;
            font-weight: 800;
            margin-bottom: 20px;
            letter-spacing: -1px;
        }

        .cover .ticker {
            font-size: 72px;
            font-weight: 800;
            color: #4CAF50;
            margin: 30px 0;
            text-shadow: 0 4px 20px rgba(76, 175, 80, 0.4);
        }

        .cover .subtitle {
            font-size: 24px;
            font-weight: 300;
            margin: 10px 0;
            opacity: 0.9;
        }

        .cover .date {
            font-size: 18px;
            margin-top: 50px;
            opacity: 0.7;
        }

        .header {
            border-bottom: 3px solid #2c5364;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }

        h2 {
            font-size: 32px;
            font-weight: 700;
            color: #2c5364;
            margin-bottom: 10px;
        }

        h3 {
            font-size: 24px;
            font-weight: 600;
            color: #203a43;
            margin: 25px 0 15px 0;
        }

        .section-subtitle {
            font-size: 16px;
            color: #666;
            font-weight: 400;
        }

        .metric-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin: 30px 0;
        }

        .metric-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            border-left: 4px solid #4CAF50;
        }

        .metric-card.warning {
            border-left-color: #ff9800;
        }

        .metric-card.danger {
            border-left-color: #f44336;
        }

        .metric-label {
            font-size: 13px;
            color: #666;
            font-weight: 500;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .metric-value {
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
        }

        .metric-change {
            font-size: 14px;
            margin-top: 5px;
            font-weight: 600;
        }

        .metric-change.positive {
            color: #4CAF50;
        }

        .metric-change.negative {
            color: #f44336;
        }

        .chart-container {
            position: relative;
            height: 300px;
            margin: 30px 0;
        }

        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin: 20px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
        }

        th {
            background: #2c5364;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }

        tr:hover {
            background: #f8f9fa;
        }

        .highlight-box {
            background: #e8f5e9;
            border-left: 4px solid #4CAF50;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }

        .warning-box {
            background: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }

        .risk-box {
            background: #ffebee;
            border-left: 4px solid #f44336;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }

        .bullet-list {
            list-style: none;
            padding: 0;
        }

        .bullet-list li {
            padding: 10px 0 10px 30px;
            position: relative;
            line-height: 1.6;
        }

        .bullet-list li:before {
            content: "▸";
            position: absolute;
            left: 0;
            color: #2c5364;
            font-weight: bold;
            font-size: 20px;
        }

        .footer {
            position: absolute;
            bottom: 15mm;
            left: 20mm;
            right: 20mm;
            font-size: 11px;
            color: #999;
            border-top: 1px solid #e0e0e0;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 10px;
        }

        .badge.success {
            background: #e8f5e9;
            color: #2e7d32;
        }

        .badge.warning {
            background: #fff3e0;
            color: #ef6c00;
        }

        .badge.danger {
            background: #ffebee;
            color: #c62828;
        }

        .executive-summary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 16px;
            margin: 20px 0;
        }

        .executive-summary h3 {
            color: white;
            margin-top: 0;
        }

        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <!-- Kapak Sayfası -->
    <div class="page cover">
        <h1>Yönetim Kurulu Sunumu</h1>
        <div class="ticker">ASELS</div>
        <div class="subtitle">ASELSAN Elektronik Sanayi ve Ticaret A.Ş.</div>
        <div class="subtitle">Kapsamlı Finansal ve Stratejik Analiz</div>
        <div class="date">10 Nisan 2026</div>
    </div>

    <!-- Yönetici Özeti -->
    <div class="page">
        <div class="header">
            <h2>Yönetici Özeti</h2>
            <div class="section-subtitle">Temel Bulgular ve Stratejik Değerlendirme</div>
        </div>

        <div class="executive-summary">
            <h3>Ana Sonuç</h3>
            <p style="font-size: 18px; line-height: 1.8;">
                ASELSAN, sektör lideri karlılık marjları (%26.2 FAVÖK), güçlü bilanço yapısı (0.71× Borç/Özkaynak)
                ve $1.13 milyar backlog ile Türkiye'nin savunma teknolojileri sektöründe liderliğini sürdürmektedir.
                Şirket, yüksek enflasyonist ortamda bile marj istikrarını koruyarak makro yalıtım mekanizmalarının
                etkinliğini kanıtlamıştır.
            </p>
        </div>

        <h3>Kilit Metrikler (2025)</h3>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-label">Hasılat</div>
                <div class="metric-value">180.4M</div>
                <div class="metric-change positive">+%15 YoY</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">FAVÖK Marjı</div>
                <div class="metric-value">%26.2</div>
                <div class="metric-change positive">Sektör Lideri</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Net Kâr Marjı</div>
                <div class="metric-value">%16.6</div>
                <div class="metric-change positive">+350 baz puan</div>
            </div>
            <div class="metric-card warning">
                <div class="metric-label">Cari Oran</div>
                <div class="metric-value">1.39×</div>
                <div class="metric-change">İzleme Gerekli</div>
            </div>
        </div>

        <div class="two-column">
            <div>
                <h3>Güçlü Yönler</h3>
                <ul class="bullet-list">
                    <li>Sektörün en yüksek FAVÖK marjı (%26.2)</li>
                    <li>$1.13 milyar onaylanmış sözleşme backlog</li>
                    <li>%89 YoY ihracat büyümesi ($958M)</li>
                    <li>Konservatif bilanço yapısı (0.71× Borç/ÖK)</li>
                    <li>Devlet destekli istikrarlı talep</li>
                </ul>
            </div>
            <div>
                <h3>Risk Faktörleri</h3>
                <ul class="bullet-list">
                    <li>%88 müşteri yoğunlaşması (TSK/SSB)</li>
                    <li>Cari oran 1.39× eşik seviyesinde</li>
                    <li>$830M nakit çıkışı (CAPEX + temettü)</li>
                    <li>RSI 82.3 - aşırı alım bölgesinde</li>
                    <li>Nakit akış verileri eksik</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <span>ASELSAN - Yönetim Kurulu Sunumu</span>
            <span>Sayfa 1</span>
        </div>
    </div>

    <!-- Finansal Performans -->
    <div class="page">
        <div class="header">
            <h2>Finansal Performans Trendi</h2>
            <div class="section-subtitle">2021-2025 Dönemi Analizi</div>
        </div>

        <h3>Gelir ve Karlılık Gelişimi</h3>
        <div class="chart-container">
            <canvas id="revenueChart"></canvas>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Dönem</th>
                    <th>Hasılat (Mly TL)</th>
                    <th>Değişim</th>
                    <th>FAVÖK (Mly TL)</th>
                    <th>FAVÖK Marjı</th>
                    <th>Net Kâr (Mly TL)</th>
                    <th>Net Marj</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>2021</strong></td>
                    <td>20,139</td>
                    <td>-</td>
                    <td>5,502</td>
                    <td>27%</td>
                    <td>7,127</td>
                    <td>35%</td>
                </tr>
                <tr>
                    <td><strong>2022</strong></td>
                    <td>126,353</td>
                    <td><span class="metric-change positive">+527%</span></td>
                    <td>26,533</td>
                    <td>21%</td>
                    <td>2,248</td>
                    <td>2%</td>
                </tr>
                <tr>
                    <td><strong>2023</strong></td>
                    <td>139,076</td>
                    <td><span class="metric-change positive">+10%</span></td>
                    <td>30,289</td>
                    <td>22%</td>
                    <td>13,936</td>
                    <td>10%</td>
                </tr>
                <tr>
                    <td><strong>2024</strong></td>
                    <td>157,340</td>
                    <td><span class="metric-change positive">+13%</span></td>
                    <td>39,574</td>
                    <td>25%</td>
                    <td>19,925</td>
                    <td>13%</td>
                </tr>
                <tr style="background: #e8f5e9;">
                    <td><strong>2025</strong></td>
                    <td>180,445</td>
                    <td><span class="metric-change positive">+15%</span></td>
                    <td>47,329</td>
                    <td>26%</td>
                    <td>29,918</td>
                    <td>17%</td>
                </tr>
            </tbody>
        </table>

        <div class="highlight-box">
            <strong>Önemli Not:</strong> 2022'deki dramatik artış IAS 29 hiperenflasyon muhasebesi uygulaması nedeniyledir.
            2023-2025 dönemi sürdürülebilir organik büyümeyi yansıtmaktadır.
        </div>

        <div class="footer">
            <span>ASELSAN - Yönetim Kurulu Sunumu</span>
            <span>Sayfa 2</span>
        </div>
    </div>

    <!-- Marj Analizi -->
    <div class="page">
        <div class="header">
            <h2>Karlılık Marjları ve Sektör Karşılaştırması</h2>
            <div class="section-subtitle">Rekabet Üstünlüğü Analizi</div>
        </div>

        <div class="two-column">
            <div>
                <h3>Marj Trendi (2021-2025)</h3>
                <div class="chart-container">
                    <canvas id="marginChart"></canvas>
                </div>
            </div>
            <div>
                <h3>Sektör Karşılaştırması (2025)</h3>
                <div class="chart-container">
                    <canvas id="competitorChart"></canvas>
                </div>
            </div>
        </div>

        <div class="highlight-box">
            <h3 style="margin: 0 0 15px 0; color: #2e7d32;">Sektör Liderliği</h3>
            <div class="metric-grid" style="margin: 15px 0 0 0;">
                <div class="metric-card">
                    <div class="metric-label">ASELS FAVÖK</div>
                    <div class="metric-value">%26.2</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">SDTTR FAVÖK</div>
                    <div class="metric-value">%12.1</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Fark</div>
                    <div class="metric-value">2.2×</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Sektör Sıralaması</div>
                    <div class="metric-value">#1</div>
                </div>
            </div>
            <p style="margin-top: 15px; line-height: 1.6;">
                ASELSAN, FAVÖK marjında en yakın rakibi SDTTR'den 2.2×, OTKAR'dan 5.2× daha yüksek performans göstermektedir.
                Bu üstünlük son 5 yıldır sürdürülmekte olup yapısal rekabet avantajını göstermektedir.
            </p>
        </div>

        <h3>Rekabet Avantajı Kaynakları</h3>
        <ul class="bullet-list">
            <li><strong>Ölçek Ekonomisi:</strong> SDTTR'den 75× daha büyük hasılat ($5.3M vs. $70M)</li>
            <li><strong>Teknoloji Portföyü:</strong> 5 grup başkanlığı ile geniş ürün yelpazesi</li>
            <li><strong>Devlet Desteği:</strong> TSKGV ana hissedar, stratejik öneme sahip ulusal şampiyon</li>
            <li><strong>Fiyatlama Gücü:</strong> %30+ enflasyon ortamında %32 brüt marj korundu</li>
        </ul>

        <div class="footer">
            <span>ASELSAN - Yönetim Kurulu Sunumu</span>
            <span>Sayfa 3</span>
        </div>
    </div>

    <!-- Bilanço Analizi -->
    <div class="page">
        <div class="header">
            <h2>Bilanço Güçü ve Likidite</h2>
            <div class="section-subtitle">Mali Yapı Değerlendirmesi</div>
        </div>

        <div class="two-column">
            <div>
                <h3>Varlık ve Özkaynak Büyümesi</h3>
                <div class="chart-container">
                    <canvas id="balanceSheetChart"></canvas>
                </div>
            </div>
            <div>
                <h3>Kaldıraç Oranları</h3>
                <div class="chart-container">
                    <canvas id="leverageChart"></canvas>
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Dönem</th>
                    <th>Toplam Aktif (Mly TL)</th>
                    <th>Özkaynak (Mly TL)</th>
                    <th>ÖK/Aktif</th>
                    <th>Borç/ÖK</th>
                    <th>Cari Oran</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>2021</strong></td>
                    <td>46,413</td>
                    <td>25,835</td>
                    <td>0.56</td>
                    <td>0.80</td>
                    <td>1.38×</td>
                </tr>
                <tr>
                    <td><strong>2022</strong></td>
                    <td>272,954</td>
                    <td>152,708</td>
                    <td>0.56</td>
                    <td>0.79</td>
                    <td>1.41×</td>
                </tr>
                <tr>
                    <td><strong>2023</strong></td>
                    <td>284,564</td>
                    <td>167,022</td>
                    <td>0.59</td>
                    <td>0.70</td>
                    <td>1.45×</td>
                </tr>
                <tr>
                    <td><strong>2024</strong></td>
                    <td>317,803</td>
                    <td>185,028</td>
                    <td>0.58</td>
                    <td>0.72</td>
                    <td>1.52×</td>
                </tr>
                <tr style="background: #fff3e0;">
                    <td><strong>2025</strong></td>
                    <td>431,587</td>
                    <td>251,786</td>
                    <td>0.58</td>
                    <td>0.71</td>
                    <td>1.39×</td>
                </tr>
            </tbody>
        </table>

        <div class="two-column">
            <div class="highlight-box">
                <strong>Güçlü Yönler</strong>
                <ul class="bullet-list" style="margin-top: 10px;">
                    <li>Konservatif 0.71× Borç/Özkaynak oranı</li>
                    <li>%58 özkaynak/aktif - güçlü sermaye tabanı</li>
                    <li>49.3 Mly TL pozitif net işletme sermayesi</li>
                    <li>35.8 Mly TL alınan avans - nakit pozisyonunu destekler</li>
                </ul>
            </div>
            <div class="warning-box">
                <strong>İzleme Gerektiren Konular</strong>
                <ul class="bullet-list" style="margin-top: 10px;">
                    <li>Cari oran 1.52× → 1.39× düşüşü (-0.13 puan)</li>
                    <li>2026 H1 likidite trendinin takibi önerilir</li>
                    <li>$616M CAPEX + 1.07Mly TL temettü nakit çıkışı</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <span>ASELSAN - Yönetim Kurulu Sunumu</span>
            <span>Sayfa 4</span>
        </div>
    </div>

    <!-- Backlog ve Sözleşmeler -->
    <div class="page">
        <div class="header">
            <h2>Sözleşme Backlog ve Büyüme Görünürlüğü</h2>
            <div class="section-subtitle">2026-2029 Gelir Planlaması</div>
        </div>

        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-label">Toplam Backlog</div>
                <div class="metric-value">$1.13B</div>
                <div class="metric-change positive">FY2025'in %21'i</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">İhracat 2025</div>
                <div class="metric-value">$958M</div>
                <div class="metric-change positive">+%89 YoY</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">CAPEX Yatırımı</div>
                <div class="metric-value">$616M</div>
                <div class="metric-change">4 Yeni Tesis</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Beklenen Büyüme</div>
                <div class="metric-value">%15-20</div>
                <div class="metric-change positive">2026-2029</div>
            </div>
        </div>

        <h3>Önemli Sözleşmeler (Nisan 2025 - Nisan 2026)</h3>
        <table>
            <thead>
                <tr>
                    <th>Tarih</th>
                    <th>Sözleşme</th>
                    <th>Değer</th>
                    <th>Müşteri/Bölge</th>
                    <th>Teslimat</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>9 Nisan 2025</td>
                    <td>Askeri Haberleşme Sistemleri</td>
                    <td>$158.6M</td>
                    <td>Orta Doğu/Afrika</td>
                    <td>2026-2028</td>
                </tr>
                <tr>
                    <td>23 Temmuz 2025</td>
                    <td>Elektronik Harp, İHA Önleme, Obüs Yön</td>
                    <td>$169.7M</td>
                    <td>SSB (Türkiye)</td>
                    <td>2026-2029</td>
                </tr>
                <tr style="background: #e8f5e9;">
                    <td>2025 Q4</td>
                    <td>Polonya İhracatı</td>
                    <td>$410M</td>
                    <td>Polonya</td>
                    <td>2026-2028</td>
                </tr>
                <tr>
                    <td>Diğer Sözleşmeler</td>
                    <td>Çeşitli Projeler</td>
                    <td>$392M</td>
                    <td>Karma</td>
                    <td>2026-2029</td>
                </tr>
            </tbody>
        </table>

        <div class="two-column">
            <div>
                <h3>CAPEX Yatırımları ($616M)</h3>
                <ul class="bullet-list">
                    <li>Foton Dedektör Tesisi</li>
                    <li>Radar Entegrasyon Tesisi</li>
                    <li>Hava Savunma Tesisi</li>
                    <li>Akıllı Mühimmat Tesisi</li>
                </ul>
                <p style="margin-top: 15px; line-height: 1.6;">
                    <strong>Devreye Alınma:</strong> 2026 ortası<br>
                    <strong>Etki:</strong> Mevcut backlog'un zamanında teslimatını destekler
                </p>
            </div>
            <div class="chart-container">
                <canvas id="backlogChart"></canvas>
            </div>
        </div>

        <div class="footer">
            <span>ASELSAN - Yönetim Kurulu Sunumu</span>
            <span>Sayfa 5</span>
        </div>
    </div>

    <!-- Makro Yalıtım -->
    <div class="page">
        <div class="header">
            <h2>Makro Ekonomik Yalıtım Mekanizmaları</h2>
            <div class="section-subtitle">Savunma Sektörünün Yapısal Avantajları</div>
        </div>

        <div class="highlight-box">
            <h3 style="margin: 0 0 15px 0; color: #2e7d32;">Beş Yalıtım Mekanizması</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                <div>
                    <strong>1. Devlet Bütçe Taahhüdü</strong>
                    <p>2026 savunma bütçesi $28.2 milyar (+%15 reel büyüme)</p>
                </div>
                <div>
                    <strong>2. Enflasyon Endeksli Sözleşmeler</strong>
                    <p>Maliyet-artı fiyatlama, ÜFE'ye bağlı periyodik ayarlamalar</p>
                </div>
                <div>
                    <strong>3. Avans Ödeme Modeli</strong>
                    <p>35.8 Mly TL alınan avans, nakit pozisyonunu güçlendirir</p>
                </div>
                <div>
                    <strong>4. Döviz Gelir Avantajı</strong>
                    <p>$958M ihracat (+%89), TL aşınmasından faydalanır</p>
                </div>
            </div>
            <div style="margin-top: 15px;">
                <strong>5. İsteğe Bağlı Olmayan Talep</strong>
                <p>Savunma harcamaları ekonomik döngüden bağımsız, stratejik öncelik</p>
            </div>
        </div>

        <h3>Makro Ortam (Nisan 2026)</h3>
        <div class="metric-grid">
            <div class="metric-card warning">
                <div class="metric-label">TCMB Politika Faizi</div>
                <div class="metric-value">%37.0</div>
                <div class="metric-change">Kısıtlayıcı</div>
            </div>
            <div class="metric-card warning">
                <div class="metric-label">TÜFE (Yıllık)</div>
                <div class="metric-value">%30.9</div>
                <div class="metric-change">Mart 2026</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Reel Faiz</div>
                <div class="metric-value">+%6.1</div>
                <div class="metric-change positive">Pozitif</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">ÜFE-TÜFE Farkı</div>
                <div class="metric-value">+0.36</div>
                <div class="metric-change">Puan</div>
            </div>
        </div>

        <div class="two-column">
            <div>
                <h3>Genel Ekonomi Etkileri</h3>
                <ul class="bullet-list">
                    <li>Yüksek faiz ortamı</li>
                    <li>Süregelen enflasyon baskısı</li>
                    <li>TL'de değer kaybı</li>
                    <li>Girdi maliyeti artışları</li>
                    <li>Likidite baskısı</li>
                </ul>
            </div>
            <div>
                <h3>ASELS'e Etki</h3>
                <ul class="bullet-list">
                    <li><span style="color: #4CAF50;">✓</span> Avans modeli ile faiz etkisi minimal</li>
                    <li><span style="color: #4CAF50;">✓</span> Enflasyon endeksli fiyatlama korur</li>
                    <li><span style="color: #4CAF50;">✓</span> Döviz gelir TL kaybından fayda sağlar</li>
                    <li><span style="color: #4CAF50;">✓</span> Maliyet artışları yansıtılıyor</li>
                    <li><span style="color: #4CAF50;">✓</span> Devlet taahhüdü talep istikrarı sağlar</li>
                </ul>
            </div>
        </div>

        <div class="highlight-box">
            <strong>Ampirik Doğrulama:</strong> ASELS %32 brüt marjını %30+ enflasyon ortamında korudu (2025) →
            Fiyatlama gücünü ve yapısal yalıtımı kanıtlıyor.
        </div>

        <div class="footer">
            <span>ASELSAN - Yönetim Kurulu Sunumu</span>
            <span>Sayfa 6</span>
        </div>
    </div>

    <!-- Teknik Analiz -->
    <div class="page">
        <div class="header">
            <h2>Teknik Analiz ve Piyasa Pozisyonu</h2>
            <div class="section-subtitle">Hisse Performansı Değerlendirmesi - 10 Nisan 2026</div>
        </div>

        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-label">Kapanış Fiyatı</div>
                <div class="metric-value">₺376.75</div>
                <div class="metric-change positive">+%4.00</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Tüm Zamanların En Yükseği</div>
                <div class="metric-value">₺379.00</div>
                <div class="metric-change">9 Nisan 2026</div>
            </div>
            <div class="metric-card warning">
                <div class="metric-label">RSI (14)</div>
                <div class="metric-value">82.3</div>
                <div class="metric-change">Aşırı Alım</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">50-Gün HO</div>
                <div class="metric-value">₺354.31</div>
                <div class="metric-change positive">+%6.3 üzerinde</div>
            </div>
        </div>

        <h3>Hareketli Ortalama Analizi</h3>
        <table>
            <thead>
                <tr>
                    <th>Hareketli Ortalama</th>
                    <th>Değer (TL)</th>
                    <th>Fiyat Pozisyonu</th>
                    <th>Fiyattan Uzaklık</th>
                    <th>Sinyal</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>20-günlük</td>
                    <td>337.95</td>
                    <td>Üzerinde</td>
                    <td><span class="metric-change positive">+%11.5</span></td>
                    <td><span class="badge success">Yükseliş</span></td>
                </tr>
                <tr>
                    <td>50-günlük</td>
                    <td>354.31</td>
                    <td>Üzerinde</td>
                    <td><span class="metric-change positive">+%6.3</span></td>
                    <td><span class="badge success">Yükseliş</span></td>
                </tr>
                <tr>
                    <td>100-günlük</td>
                    <td>339.93</td>
                    <td>Üzerinde</td>
                    <td><span class="metric-change positive">+%10.8</span></td>
                    <td><span class="badge success">Yükseliş</span></td>
                </tr>
                <tr>
                    <td>200-günlük</td>
                    <td>339.00</td>
                    <td>Üzerinde</td>
                    <td><span class="metric-change positive">+%11.1</span></td>
                    <td><span class="badge success">Yükseliş</span></td>
                </tr>
            </tbody>
        </table>

        <div class="two-column">
            <div>
                <h3>Destek ve Direnç Seviyeleri</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Seviye</th>
                            <th>Fiyat (TL)</th>
                            <th>Uzaklık</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background: #ffebee;">
                            <td>Direnç 2</td>
                            <td>406.67</td>
                            <td>+%7.9</td>
                        </tr>
                        <tr style="background: #ffebee;">
                            <td>Direnç 1</td>
                            <td>391.33</td>
                            <td>+%3.9</td>
                        </tr>
                        <tr style="background: #fff9c4; font-weight: bold;">
                            <td>Mevcut</td>
                            <td>376.75</td>
                            <td>-</td>
                        </tr>
                        <tr style="background: #e8f5e9;">
                            <td>Destek 1</td>
                            <td>345.33</td>
                            <td>-%8.3</td>
                        </tr>
                        <tr style="background: #e8f5e9;">
                            <td>Destek 2</td>
                            <td>314.67</td>
                            <td>-%16.5</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div>
                <h3>Teknik Görünüm</h3>
                <div class="warning-box">
                    <strong>Kısa Vade (1-4 hafta): TEDBİRLİ</strong>
                    <ul class="bullet-list" style="margin-top: 10px;">
                        <li>RSI 82.3 aşırı alım bölgesinde</li>
                        <li>Tüm zamanların en yükseğinde</li>
                        <li>Kar realizasyonu riski yüksek</li>
                        <li>345-354 TL'ye düzeltme olası</li>
                    </ul>
                </div>
                <div class="highlight-box">
                    <strong>Orta Vade (1-3 ay): POZİTİF</strong>
                    <ul class="bullet-list" style="margin-top: 10px;">
                        <li>Temel görünüm güçlü</li>
                        <li>HO dizilimi sağlam</li>
                        <li>345 TL desteği kritik</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="footer">
            <span>ASELSAN - Yönetim Kurulu Sunumu</span>
            <span>Sayfa 7</span>
        </div>
    </div>

    <!-- Risk Değerlendirmesi -->
    <div class="page">
        <div class="header">
            <h2>Risk Faktörleri ve Azaltma Stratejileri</h2>
            <div class="section-subtitle">Kapsamlı Risk Haritası</div>
        </div>

        <h3>Operasyonel Riskler</h3>
        <div class="risk-box">
            <strong>1. Müşteri Yoğunlaşması Riski - YÜKSEK</strong>
            <p style="margin: 10px 0;">Backlog'un %88'i Türk devleti (TSK/SSB)</p>
            <p style="margin: 10px 0;"><strong>Etki:</strong> Kamu alım politikası değişikliklerine hassasiyet</p>
            <p style="margin: 10px 0;"><strong>Azaltma:</strong> İhracat büyümesi devam ediyor ($958M, +%89 YoY)</p>
        </div>

        <div class="warning-box">
            <strong>2. Sözleşme Teslimat Riski - ORTA</strong>
            <p style="margin: 10px 0;">Teknik gecikmeler, ihracat lisans onayları gecikebilir</p>
            <p style="margin: 10px 0;"><strong>Azaltma:</strong> $616M CAPEX kapasite genişlemesi, tecrübeli ekip</p>
        </div>

        <div class="warning-box">
            <strong>3. İhracat Jeopolitik Riski - ORTA</strong>
            <p style="margin: 10px 0;">Orta Doğu, Doğu Avrupa müşteri bölgeleri jeopolitik riskler taşır</p>
            <p style="margin: 10px 0;"><strong>Azaltma:</strong> Coğrafi çeşitlendirme (Polonya, Malezya, BAE, Pakistan)</p>
        </div>

        <h3>Finansal Riskler</h3>
        <div class="warning-box">
            <strong>1. Likidite İzleme Gereksinimi - ORTA</strong>
            <p style="margin: 10px 0;">Cari oran 1.52× → 1.39× düşüşü</p>
            <p style="margin: 10px 0;">Temettü (-1.07Mly TL) + CAPEX (-$616M) = ~$830M nakit çıkışı</p>
            <p style="margin: 10px 0;"><strong>İzleme:</strong> 2026 H1 cari oran trendinin yakın takibi önerilir</p>
        </div>

        <div class="warning-box">
            <strong>2. FX Riski - DÜŞÜK-ORTA</strong>
            <p style="margin: 10px 0;">İhracat gelirleri dolar/euro ancak ithal girdi maliyetleri var</p>
            <p style="margin: 10px 0;"><strong>Net Etki:</strong> POZİTİF - %68 yerli içerik, döviz gelir artıyor</p>
        </div>

        <h3>Piyasa Riskleri</h3>
        <div class="risk-box">
            <strong>1. Aşırı Alım - YÜKSEK (Kısa Vade)</strong>
            <p style="margin: 10px 0;">RSI 82.3, tüm zamanların en yükseği → Düzeltme riski</p>
            <p style="margin: 10px 0;"><strong>Strateji:</strong> Yeni pozisyonlar için 345-354 TL bandı beklemek makul</p>
        </div>

        <h3>Analitik Kısıtlar</h3>
        <div class="warning-box">
            <strong>Kritik Veri Eksiklikleri</strong>
            <ul class="bullet-list" style="margin-top: 10px;">
                <li>Nakit akış tablosu mevcut değil → Serbest nakit akışı değerlendirilemedi</li>
                <li>Özkaynak değişim detayları eksik → ROE yorumu belirsiz</li>
                <li>Segment bazında gelir dağılımı açıklanmıyor → Ürün karışımı analiz edilemiyor</li>
            </ul>
            <p style="margin-top: 10px;"><strong>Rapor Kalite Skoru:</strong> %72/100 (hedef %80) - "Koşullu Geçer"</p>
        </div>

        <div class="footer">
            <span>ASELSAN - Yönetim Kurulu Sunumu</span>
            <span>Sayfa 8</span>
        </div>
    </div>

    <!-- Sonuç ve Öneriler -->
    <div class="page">
        <div class="header">
            <h2>Genel Değerlendirme ve Stratejik Öneriler</h2>
            <div class="section-subtitle">Yönetim Kurulu için Sonuçlar</div>
        </div>

        <div class="executive-summary">
            <h3>Temel Sonuç</h3>
            <p style="font-size: 18px; line-height: 1.8;">
                ASELSAN fundamentalleri <strong>güçlü</strong>: Sektör liderliği, sağlam bilanço, görünür gelir backlog'u,
                makro yalıtım mekanizmaları. Orta vadeli (2026-2029) büyüme görünümü yapısal faktörlerle destekleniyor
                (devlet savunma bütçesi artışı, kapasite genişlemesi, ihracat ivmesi).
            </p>
        </div>

        <div class="two-column">
            <div>
                <h3>Stratejik Güçlü Yönler</h3>
                <div class="highlight-box">
                    <ul class="bullet-list">
                        <li><strong>Sektör Liderliği:</strong> %26.2 FAVÖK marjı, en yakın rakipten 2.2× üstün</li>
                        <li><strong>Görünür Büyüme:</strong> $1.13M backlog, %15-20 büyüme potansiyeli</li>
                        <li><strong>Mali Güç:</strong> 0.71× Borç/ÖK, %58 özkaynak/aktif</li>
                        <li><strong>Makro Yalıtım:</strong> 5 koruma mekanizması aktif</li>
                        <li><strong>İhracat Momentum:</strong> $958M (+%89 YoY)</li>
                        <li><strong>Kapasite Genişlemesi:</strong> $616M CAPEX, 4 yeni tesis</li>
                    </ul>
                </div>
            </div>
            <div>
                <h3>İzlenmesi Gereken Alanlar</h3>
                <div class="warning-box">
                    <ul class="bullet-list">
                        <li><strong>Likidite:</strong> 2026 H1 cari oran trendi</li>
                        <li><strong>Nakit Yönetimi:</strong> CAPEX + temettü çift çıkış</li>
                        <li><strong>Müşteri Çeşitlendirmesi:</strong> İhracat payını artırmaya devam</li>
                        <li><strong>Teslimat Performansı:</strong> $1.13M backlog zamanında teslimat</li>
                        <li><strong>Teknik Düzeltme:</strong> RSI normalizasyonu bekle</li>
                    </ul>
                </div>
            </div>
        </div>

        <h3>Yatırım Ufku Perspektifi</h3>
        <p style="font-size: 13px; color: #666; margin-bottom: 15px;"><em>Bu perspektif analitik yorumdur, yatırım tavsiyesi değildir.</em></p>

        <table>
            <thead>
                <tr>
                    <th>Ufuk</th>
                    <th>Görünüm</th>
                    <th>Değerlendirme</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Kısa Vade<br>(1-4 hafta)</strong></td>
                    <td><span class="badge warning">TEDBİRLİ</span></td>
                    <td>
                        Teknik düzeltme riski nedeniyle girişte temkin. RSI 82.3 aşırı alım,
                        tüm zamanların en yükseği. 345-354 TL düzeltme sağlıklı konsolidasyon olur.
                    </td>
                </tr>
                <tr>
                    <td><strong>Orta Vade<br>(3-12 ay)</strong></td>
                    <td><span class="badge success">POZİTİF</span></td>
                    <td>
                        Fundamentaller konstruktif, $1.13M backlog görünürlüğü var. Kapasite genişlemesi
                        ve ihracat büyümesi devam edecek. Marj istikrarı bekleniyor.
                    </td>
                </tr>
                <tr>
                    <td><strong>Uzun Vade<br>(1+ yıl)</strong></td>
                    <td><span class="badge success">YAPISAL POZİTİF</span></td>
                    <td>
                        Sektör tailwindleri (savunma bütçesi büyümesi, yerlilik politikası, bölgesel
                        güvenlik ihtiyaçları) devam edecek. Rekabet üstünlüğü sürdürülebilir.
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="highlight-box">
            <h3 style="margin: 0 0 15px 0; color: #2e7d32;">Yönetim Kurulu için Öneriler</h3>
            <ol style="line-height: 2; padding-left: 20px;">
                <li><strong>Likidite Yönetimi:</strong> 2026 H1'de aylık cari oran ve nakit pozisyon takibi yapın</li>
                <li><strong>CAPEX Zaman Planı:</strong> $616M yatırımın devreye alınma takvimini yakından izleyin</li>
                <li><strong>İhracat Stratejisi:</strong> Müşteri çeşitlendirmesini artırmaya devam edin (hedef: ihracat payı %20+)</li>
                <li><strong>Veri Şeffaflığı:</strong> Nakit akış tablosu ve segment bazında gelir açıklamaları yapın - analitik güvenilirliği artırır</li>
                <li><strong>Backlog Teslimatı:</strong> Polonya ve diğer büyük sözleşmelerin teslimat milestone'larını güncel tutun</li>
            </ol>
        </div>

        <div class="footer">
            <span>ASELSAN - Yönetim Kurulu Sunumu</span>
            <span>Sayfa 9</span>
        </div>
    </div>

    <!-- Son Sayfa -->
    <div class="page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%); color: white; text-align: center;">
        <h2 style="color: white; font-size: 48px; margin-bottom: 30px;">Teşekkürler</h2>
        <p style="font-size: 20px; margin: 20px 0; opacity: 0.9;">
            Bu rapor Finance X Platform tarafından<br>
            yapay zeka destekli analitik süreçlerle hazırlanmıştır.
        </p>
        <div style="margin-top: 50px; font-size: 14px; opacity: 0.7;">
            <p>Rapor Tarihi: 10 Nisan 2026</p>
            <p>Rapor ID: fs-out-asels-20260410-001</p>
            <p>Analitik Güven Seviyesi: %72 (Orta)</p>
        </div>
        <div style="margin-top: 40px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 12px; max-width: 600px;">
            <p style="font-size: 12px; line-height: 1.6;">
                <strong>Yasal Uyarı:</strong> Bu analiz Finance X tarafından üretilen otomatik bir analitik rapordur.
                Yatırım tavsiyesi niteliği taşımaz. Yatırım kararları için bağımsız profesyonel danışmanlık alınmalıdır.
                Finance X kayıtlı bir yatırım danışmanı değildir.
            </p>
        </div>
    </div>

    <script>
        // Revenue and Profitability Chart
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: ['2021', '2022', '2023', '2024', '2025'],
                datasets: [{
                    label: 'Hasılat (Mly TL)',
                    data: [20139, 126353, 139076, 157340, 180445],
                    backgroundColor: 'rgba(44, 83, 100, 0.8)',
                    yAxisID: 'y'
                }, {
                    label: 'Net Kâr (Mly TL)',
                    data: [7127, 2248, 13936, 19925, 29918],
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
                    yAxisID: 'y'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return (value/1000).toFixed(0) + 'B';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Margin Trend Chart
        const marginCtx = document.getElementById('marginChart').getContext('2d');
        new Chart(marginCtx, {
            type: 'line',
            data: {
                labels: ['2021', '2022', '2023', '2024', '2025'],
                datasets: [{
                    label: 'FAVÖK Marjı (%)',
                    data: [27, 21, 22, 25, 26],
                    borderColor: 'rgba(44, 83, 100, 1)',
                    backgroundColor: 'rgba(44, 83, 100, 0.1)',
                    tension: 0.3,
                    fill: true
                }, {
                    label: 'Net Marj (%)',
                    data: [35, 2, 10, 13, 17],
                    borderColor: 'rgba(76, 175, 80, 1)',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
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
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Competitor Comparison Chart
        const competitorCtx = document.getElementById('competitorChart').getContext('2d');
        new Chart(competitorCtx, {
            type: 'bar',
            data: {
                labels: ['ASELS', 'SDTTR', 'OTKAR', 'Sektör Medyan'],
                datasets: [{
                    label: 'FAVÖK Marjı (%)',
                    data: [26.2, 12.1, 5.0, 19.0],
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(158, 158, 158, 0.6)',
                        'rgba(158, 158, 158, 0.6)',
                        'rgba(255, 152, 0, 0.6)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 30,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Balance Sheet Chart
        const balanceSheetCtx = document.getElementById('balanceSheetChart').getContext('2d');
        new Chart(balanceSheetCtx, {
            type: 'bar',
            data: {
                labels: ['2021', '2022', '2023', '2024', '2025'],
                datasets: [{
                    label: 'Toplam Aktif (Mly TL)',
                    data: [46413, 272954, 284564, 317803, 431587],
                    backgroundColor: 'rgba(44, 83, 100, 0.6)'
                }, {
                    label: 'Özkaynak (Mly TL)',
                    data: [25835, 152708, 167022, 185028, 251786],
                    backgroundColor: 'rgba(76, 175, 80, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return (value/1000).toFixed(0) + 'B';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Leverage Chart
        const leverageCtx = document.getElementById('leverageChart').getContext('2d');
        new Chart(leverageCtx, {
            type: 'line',
            data: {
                labels: ['2021', '2022', '2023', '2024', '2025'],
                datasets: [{
                    label: 'Borç/Özkaynak',
                    data: [0.80, 0.79, 0.70, 0.72, 0.71],
                    borderColor: 'rgba(44, 83, 100, 1)',
                    backgroundColor: 'rgba(44, 83, 100, 0.1)',
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y'
                }, {
                    label: 'Cari Oran',
                    data: [1.38, 1.41, 1.45, 1.52, 1.39],
                    borderColor: 'rgba(255, 152, 0, 1)',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    tension: 0.3,
                    fill: true,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Borç/Özkaynak'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Cari Oran'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Backlog Chart
        const backlogCtx = document.getElementById('backlogChart').getContext('2d');
        new Chart(backlogCtx, {
            type: 'doughnut',
            data: {
                labels: ['Polonya ($410M)', 'SSB Elektronik Harp ($170M)', 'Haberleşme Sistemleri ($159M)', 'Diğer Sözleşmeler ($391M)'],
                datasets: [{
                    data: [410, 170, 159, 391],
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(44, 83, 100, 0.8)',
                        'rgba(103, 58, 183, 0.8)',
                        'rgba(255, 152, 0, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            font: {
                                size: 10
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Backlog Dağılımı ($1.13B)'
                    }
                }
            }
        });
    </script>
</body>
</html>
  `;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: '/Users/ibrahimpeyman/Documents/Finance X/ASELS_Yönetim_Kurulu_Sunumu_2026.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  });

  await browser.close();
  console.log('PDF başarıyla oluşturuldu: ASELS_Yönetim_Kurulu_Sunumu_2026.pdf');
}

generatePresentation().catch(console.error);
