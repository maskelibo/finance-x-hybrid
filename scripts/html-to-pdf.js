#!/usr/bin/env node

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function htmlToPdf(htmlPath, pdfPath) {
  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  // Read HTML file
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const htmlUrl = 'file://' + htmlPath;

  // Navigate to file
  await page.goto(htmlUrl, {
    waitUntil: 'networkidle'
  });

  // Wait for charts to render
  await page.waitForTimeout(2000);

  // Generate PDF with fixed settings (no blank pages)
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm'
    },
    preferCSSPageSize: true
  });

  await browser.close();
  console.log(`✅ PDF generated: ${pdfPath}`);
}

// Get arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node html-to-pdf.js <html-file> [output-pdf]');
  process.exit(1);
}

const htmlPath = path.resolve(args[0]);
const pdfPath = args[1] ? path.resolve(args[1]) : htmlPath.replace('.html', '.pdf');

if (!fs.existsSync(htmlPath)) {
  console.error(`❌ HTML file not found: ${htmlPath}`);
  process.exit(1);
}

htmlToPdf(htmlPath, pdfPath).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
