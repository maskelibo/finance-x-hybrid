#!/usr/bin/env node
/**
 * fetch-pdf.js — KAP / IR / herhangi bir URL'den PDF indir ve text'e cevir.
 *
 * Kullanim:
 *   node scripts/fetch-pdf.js <pdf-url> [output-dosya]
 *   node scripts/fetch-pdf.js https://www.kap.org.tr/tr/api/BildirimPdf/1599018
 *   node scripts/fetch-pdf.js https://www.kap.org.tr/tr/api/BildirimPdf/1599018 output/TCELL_faaliyet.txt
 *
 * Cikti:
 *   - stdout'a extracted text basar (pipe edilebilir)
 *   - Opsiyonel output dosyasi verilirse oraya da yazar
 *   - PDF dosyasini output/ altina kaydeder
 *
 * Agent kullanimi (Bash tool):
 *   node scripts/fetch-pdf.js "https://kap.org.tr/tr/api/BildirimPdf/XXXXX" "output/TICKER_rapor.txt"
 *   Sonra Read tool ile output dosyasini oku.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

let PDFParseClass;
async function getPDFParseClass() {
  if (!PDFParseClass) {
    const mod = await import('pdf-parse');
    PDFParseClass = mod.PDFParse;
  }
  return PDFParseClass;
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'application/pdf,*/*',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  'Referer': 'https://www.kap.org.tr/',
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function downloadPdf(url) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: HEADERS,
        redirect: 'follow',
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type') || '';
      const buffer = Buffer.from(await res.arrayBuffer());

      if (buffer.length < 100) {
        throw new Error(`Response too small (${buffer.length} bytes) — muhtemelen engellendi`);
      }

      // PDF magic bytes check
      if (buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
        // Not a PDF — might be HTML error page
        const text = buffer.toString('utf8').slice(0, 500);
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error(`URL bir PDF degil, HTML sayfa dondu. Ilk 200 karakter: ${text.slice(0, 200)}`);
        }
        // Might still be valid but no magic bytes (rare)
        console.error(`[UYARI] PDF magic bytes bulunamadi ama devam ediliyor...`);
      }

      return buffer;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        console.error(`[Deneme ${attempt}/${MAX_RETRIES}] Hata: ${err.message} — ${RETRY_DELAY_MS}ms bekleyip tekrar deneniyor...`);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  throw new Error(`PDF indirilemedi (${MAX_RETRIES} deneme): ${lastError.message}`);
}

async function extractText(pdfBuffer) {
  const PDFParse = await getPDFParseClass();

  const parser = new PDFParse({ data: pdfBuffer });
  await parser.load();

  const totalPages = parser.doc?.numPages || 0;
  let info = {};
  try { info = await parser.getInfo() || {}; } catch {}

  // Extract all pages at once
  const result = await parser.getText();
  const fullText = result.text || '';

  // Also build page-by-page text
  const pageTexts = [];
  if (result.pages && Array.isArray(result.pages)) {
    for (const page of result.pages) {
      pageTexts.push(`\n--- Sayfa ${page.num} ---\n${page.text}`);
    }
  }

  // Extract tables if available
  let tableText = '';
  try {
    for (let i = 1; i <= totalPages; i++) {
      const tables = await parser.getPageTables({ pageNumber: i });
      if (tables && tables.length > 0) {
        tableText += `\n--- Sayfa ${i} Tablolar ---\n`;
        for (const table of tables) {
          if (table.rows) {
            for (const row of table.rows) {
              tableText += row.map(cell => cell?.text || '').join(' | ') + '\n';
            }
            tableText += '\n';
          }
        }
      }
    }
  } catch {
    // Table extraction not supported for this PDF
  }

  parser.destroy();

  return {
    text: pageTexts.length > 0 ? pageTexts.join('\n') : fullText,
    tables: tableText,
    pages: totalPages,
    info,
  };
}

function sanitizeFilename(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'document';
  } catch {
    return 'document';
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(`Kullanim: node scripts/fetch-pdf.js <pdf-url> [output-dosya]

Ornekler:
  node scripts/fetch-pdf.js "https://www.kap.org.tr/tr/api/BildirimPdf/1599018"
  node scripts/fetch-pdf.js "https://www.kap.org.tr/tr/api/BildirimPdf/1599018" "output/TCELL_rapor.txt"
  node scripts/fetch-pdf.js "https://sirket.com/faaliyet-raporu.pdf" "output/rapor.txt"
`);
    process.exit(0);
  }

  const urlOrPath = args[0];
  const outputPath = args[1] ? resolve(PROJECT_ROOT, args[1]) : null;

  // Check if it's a local file path
  let pdfBuffer;
  if (existsSync(urlOrPath) || existsSync(resolve(PROJECT_ROOT, urlOrPath))) {
    const filePath = existsSync(urlOrPath) ? urlOrPath : resolve(PROJECT_ROOT, urlOrPath);
    console.error(`[fetch-pdf] Yerel PDF okunuyor: ${filePath}`);
    pdfBuffer = readFileSync(filePath);
  } else {
    console.error(`[fetch-pdf] PDF indiriliyor: ${urlOrPath}`);
    pdfBuffer = await downloadPdf(urlOrPath);
  }
  const url = urlOrPath;
  console.error(`[fetch-pdf] PDF indirildi: ${(pdfBuffer.length / 1024).toFixed(0)} KB`);

  // 2. Save raw PDF
  const pdfDir = resolve(PROJECT_ROOT, 'output', 'pdfs');
  if (!existsSync(pdfDir)) mkdirSync(pdfDir, { recursive: true });
  const pdfFilename = sanitizeFilename(url) + (sanitizeFilename(url).endsWith('.pdf') ? '' : '.pdf');
  const pdfPath = resolve(pdfDir, pdfFilename);
  writeFileSync(pdfPath, pdfBuffer);
  console.error(`[fetch-pdf] PDF kaydedildi: ${pdfPath}`);

  // 3. Extract text
  console.error(`[fetch-pdf] Text extract ediliyor...`);
  const result = await extractText(pdfBuffer);
  console.error(`[fetch-pdf] ${result.pages} sayfa extract edildi (${result.text.length} karakter)`);

  // 4. Format output
  const header = [
    `# PDF Text Extraction`,
    `# Kaynak: ${url}`,
    `# Tarih: ${new Date().toISOString()}`,
    `# Sayfa Sayisi: ${result.pages}`,
    result.info?.Title ? `# Baslik: ${result.info.Title}` : '',
    result.info?.Author ? `# Yazar: ${result.info.Author}` : '',
    `# PDF Dosya: ${pdfPath}`,
    `---`,
    '',
  ].filter(Boolean).join('\n');

  const fullOutput = header + result.text + (result.tables ? '\n\n# TABLOLAR\n' + result.tables : '');

  // 5. Output
  if (outputPath) {
    const outDir = dirname(outputPath);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    writeFileSync(outputPath, fullOutput, 'utf8');
    console.error(`[fetch-pdf] Text kaydedildi: ${outputPath}`);
  }

  // Always print to stdout
  console.log(fullOutput);
}

main().catch(err => {
  console.error(`[fetch-pdf] HATA: ${err.message}`);
  process.exit(1);
});
