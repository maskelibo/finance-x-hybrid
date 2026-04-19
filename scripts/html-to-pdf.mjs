#!/usr/bin/env node
/**
 * Standalone HTML → PDF converter using Puppeteer.
 * Replicates the orchestrator's generatePdfFromFormatterOutput logic.
 *
 * Usage: node scripts/html-to-pdf.mjs <input.html> [output.pdf]
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: node scripts/html-to-pdf.mjs <input.html> [output.pdf]');
  process.exit(1);
}

const html = fs.readFileSync(inputPath, 'utf-8');
if (html.length < 1000) {
  console.error(`HTML too short (${html.length} chars). Aborting.`);
  process.exit(1);
}

// Extract ticker from filename (e.g. ASELS_V4_Final → ASELS)
const basename = path.basename(inputPath, '.html');
const ticker = basename.split('_')[0].toUpperCase();

const defaultOutput = inputPath.replace(/\.html$/, '.pdf');
const outputPath = process.argv[3] || defaultOutput;

console.log(`[html-to-pdf] ${inputPath} (${(html.length / 1024).toFixed(0)} KB) → ${outputPath}`);
console.log(`[html-to-pdf] Ticker: ${ticker}`);

// Use system Chrome if Puppeteer's bundled Chromium isn't available.
// Honors PUPPETEER_EXECUTABLE_PATH for explicit overrides.
const systemChrome = process.env.PUPPETEER_EXECUTABLE_PATH
  || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : undefined);

const browser = await puppeteer.launch({
  headless: true,
  executablePath: systemChrome,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--allow-file-access-from-files'],
});

const page = await browser.newPage();
await page.setViewport({ width: 794, height: 1123 }); // A4 @ 96dpi

// All charts are inline SVG (Chart.js forbidden) — no CDN wait needed.
await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });

const headerTemplate = `
  <div style="width:100%;font-size:8px;color:#666;padding:0 15mm;display:flex;justify-content:space-between;">
    <span>${ticker} — Yönetim Kurulu Raporu</span>
    <span>Finance X Platform</span>
  </div>`;
const footerTemplate = `
  <div style="width:100%;font-size:8px;color:#666;padding:0 15mm;display:flex;justify-content:space-between;">
    <span>Gizli — Yatırım tavsiyesi niteliği taşımaz</span>
    <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`;

await page.pdf({
  path: outputPath,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: false,
  displayHeaderFooter: true,
  headerTemplate,
  footerTemplate,
  margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
});

await browser.close();

const stats = fs.statSync(outputPath);
console.log(`[html-to-pdf] PDF created: ${outputPath} (${(stats.size / 1024).toFixed(0)} KB)`);
