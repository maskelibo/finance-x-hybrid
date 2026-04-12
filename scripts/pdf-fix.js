import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePDF(htmlPath, outputPath) {
  console.log('🚀 Starting PDF generation...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Read HTML content
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Set content
  await page.setContent(htmlContent, {
    waitUntil: 'networkidle0'
  });

  // Wait for charts to render
  await page.waitForTimeout(3000);

  // Generate PDF with proper settings
  await page.pdf({
    path: outputPath,
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
  console.log(`✅ PDF generated successfully: ${outputPath}`);
}

// Run
const htmlPath = process.argv[2] || './TCELL_Kapsamli_Analiz_Raporu_2026.html';
const pdfPath = process.argv[3] || './TCELL_Yonetim_Kurulu_Raporu_20260411_FIXED.pdf';

generatePDF(
  path.resolve(htmlPath),
  path.resolve(pdfPath)
).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
