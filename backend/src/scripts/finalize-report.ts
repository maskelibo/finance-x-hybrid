/**
 * Standalone report finalizer.
 *
 * Pulls all completed agent outputs from the DB for a given session, runs
 * them through composeReportContext + applyTheme + renderTemplate, and
 * generates the PDF via Puppeteer. Bypasses the orchestrator — useful
 * when the pipeline gets stuck in a QA/revision loop or a rate limit and
 * you already have enough upstream data to finalize.
 *
 * Run: cd backend && npx tsx src/scripts/finalize-report.ts <sessionId> [theme]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../db.js';
import { composeReportContext } from '../python/report_formatter/compose.js';
import { renderTemplate } from '../python/report_formatter/template_engine.js';
import { applyTheme, getTheme, mergeBrandOverride, type BrandOverride, type ThemeName } from '../python/report_formatter/themes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const TEMPLATE_PATH = path.join(__dirname, '../python/report_formatter/template.html');
const OUTPUT_DIR = path.join(ROOT, 'output');

const sessionId = process.argv[2];
const themeArg = (process.argv[3] as ThemeName) || undefined;

if (!sessionId) {
  console.error('Usage: npx tsx src/scripts/finalize-report.ts <sessionId> [theme]');
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Pull session + all completed agent outputs ──────────────────────
const session = db.prepare(`SELECT * FROM analysis_sessions WHERE id = ?`).get(sessionId) as any;
if (!session) {
  console.error(`Session not found: ${sessionId}`);
  process.exit(1);
}

const runs = db.prepare(`
  SELECT agent_id, output_text, status FROM agent_runs
  WHERE session_id = ? AND status = 'completed' AND output_text IS NOT NULL
`).all(sessionId) as Array<{ agent_id: string; output_text: string; status: string }>;

if (runs.length === 0) {
  console.error('No completed agents with output found');
  process.exit(1);
}

const ticker = String(session.ticker || 'UNKNOWN').toUpperCase();
const theme = themeArg || session.theme || 'institutional';

console.log(`Session: ${sessionId}`);
console.log(`Ticker:  ${ticker}`);
console.log(`Theme:   ${theme}`);
console.log(`Completed agents: ${runs.length}`);
for (const r of runs) {
  console.log(`  - ${r.agent_id.padEnd(28)} ${r.output_text.length.toLocaleString('tr-TR').padStart(9)} chars`);
}

// ─── Build accumulatedContext (same shape the orchestrator uses) ─────
const accumulatedContext: Record<string, unknown> = {
  ticker,
  runtimeMode: session.runtime_mode,
  theme,
};
for (const r of runs) {
  accumulatedContext[`${r.agent_id}_output`] = r.output_text;
}

// ─── Render ───────────────────────────────────────────────────────────
const reportId = `rpt-finalize-${Date.now()}`;
const ctx = composeReportContext({ ticker, reportId, accumulatedContext });

const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
const brandOverride = (() => {
  const raw = accumulatedContext['context_extraction_output'];
  if (!raw) return undefined;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const brand = (parsed as any).brand_identity;
    if (!brand) return undefined;
    const o: BrandOverride = {};
    if (brand.primary_color) o.primary = brand.primary_color;
    if (brand.secondary_color) o.primaryDark = brand.secondary_color;
    if (brand.accent_color) o.accent = brand.accent_color;
    return Object.keys(o).length ? o : undefined;
  } catch { return undefined; }
})();

const themed = applyTheme(template, mergeBrandOverride(getTheme(theme), brandOverride));
const html = renderTemplate(themed, ctx);

const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const basePath = path.join(OUTPUT_DIR, `${ticker}_Yonetim_Kurulu_Raporu_${stamp}`);
const htmlPath = `${basePath}.html`;
const pdfPath  = `${basePath}.pdf`;
fs.writeFileSync(htmlPath, html, 'utf-8');
console.log(`\n✓ HTML written: ${htmlPath} (${html.length.toLocaleString('tr-TR')} bytes)`);

// ─── PDF via Puppeteer with system Chrome ────────────────────────────
const puppeteer = await import('puppeteer');
const systemChrome = process.env.PUPPETEER_EXECUTABLE_PATH
  || (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : undefined);

const browser = await puppeteer.default.launch({
  headless: true,
  executablePath: systemChrome,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
});

const page = await browser.newPage();
await page.setViewport({ width: 794, height: 1123 });
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
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate,
  footerTemplate,
  margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
});

await browser.close();

const stats = fs.statSync(pdfPath);
console.log(`✓ PDF written: ${pdfPath} (${(stats.size / 1024).toFixed(0)} KB)`);

// Count pages for sanity check
const pageCount = (html.match(/class="page(?:\s|")/g) || []).length;
const svgCount = (html.match(/<svg/gi) || []).length;
console.log(`\nQuality: ${pageCount} pages, ${svgCount} SVG charts`);
