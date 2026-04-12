const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  const htmlPath = path.join(__dirname, '../../TCELL_Kapsamli_Analiz_Raporu_2026.html');

  if (!fs.existsSync(htmlPath)) {
    console.error('HTML file not found:', htmlPath);
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  console.log(`HTML loaded: ${(htmlContent.length / 1024).toFixed(0)} KB`);

  // Validate HTML
  if (!htmlContent.includes('<!DOCTYPE html>') || !htmlContent.includes('</html>')) {
    console.error('HTML is incomplete — missing DOCTYPE or closing tag');
    process.exit(1);
  }

  const pageCount = (htmlContent.match(/class="page/g) || []).length;
  const chartCount = (htmlContent.match(/<canvas/g) || []).length;
  console.log(`Pages: ${pageCount}, Charts: ${chartCount}`);

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Wait for Chart.js to render
  console.log('Waiting for charts to render...');
  await new Promise(resolve => setTimeout(resolve, 4000));

  const pdfPath = path.join(__dirname, '../../TCELL_Yonetim_Kurulu_Raporu_20260411.pdf');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
  });

  await browser.close();

  const stats = fs.statSync(pdfPath);
  console.log(`PDF generated: ${pdfPath}`);
  console.log(`PDF size: ${(stats.size / 1024).toFixed(0)} KB`);

  if (stats.size < 50000) {
    console.error('WARNING: PDF is suspiciously small — may be broken');
  } else {
    console.log('PDF generation successful!');
  }
}

generatePDF().catch(err => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
