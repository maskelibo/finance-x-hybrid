import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePDF() {
  console.log('🚀 Starting TCELL PDF fix...');

  const htmlPath = path.resolve(__dirname, '../TCELL_Kapsamli_Analiz_Raporu_2026.html');
  const pdfPath = path.resolve(__dirname, '../TCELL_Yonetim_Kurulu_Raporu_20260411_FIXED.pdf');

  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ HTML file not found: ${htmlPath}`);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Read and set HTML content
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  await page.setContent(htmlContent, {
    waitUntil: 'networkidle0'
  });

  // Wait for charts to fully render
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Generate PDF
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    }
  });

  await browser.close();

  const stats = fs.statSync(pdfPath);
  console.log(`✅ PDF generated successfully: ${pdfPath}`);
  console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
}

generatePDF().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
