/**
 * Standalone smoke test for the Finance X report formatter.
 *
 * Uses pre-computed TUPRS agent outputs from the repo root to exercise
 * composeReportContext + applyTheme + renderTemplate for all three themes
 * (institutional, anthropic, minimal) without touching the database or the
 * LLM pipeline. Writes three HTML files to `output/` that can be opened
 * directly to validate the theme system and section coverage.
 *
 * Run: cd backend && npx tsx src/scripts/test-tuprs-report.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { composeReportContext } from '../python/report_formatter/compose.js';
import { renderTemplate } from '../python/report_formatter/template_engine.js';
import { applyTheme, getTheme, type ThemeName } from '../python/report_formatter/themes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');
const TEMPLATE_PATH = path.join(__dirname, '../python/report_formatter/template.html');
const OUTPUT_DIR = path.join(ROOT, 'output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Required TUPRS agent outputs. Each file becomes one entry in accumulatedContext.
// `final_summary_output` is wired to the prior handwritten comprehensive report
// (TUPRS_Kapsamli_Analiz_Raporu_2026.md) so compose.ts can extract narrative
// blocks (exec summary, valuation, closing) from it — that's the LLM output
// our pipeline would normally produce.
const INPUT_FILES: Array<[string, string]> = [
  ['context_extraction_output',      'context_extraction_tuprs_output.json'],
  ['parse_standardization_output',   'parse_standardization_tuprs_output.json'],
  ['sector_competition_output',      'sector_competition_tuprs_output.json'],
  ['event_impact_mapper_output',     'event_impact_mapper_tuprs_output.json'],
  ['data_collection_output',         'TUPRS_data_collection_manifest_20260412.json'],
  ['final_summary_output',           'TUPRS_Kapsamli_Analiz_Raporu_2026.md'],
];

function loadInput(relPath: string): string {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    console.warn(`  (missing) ${relPath} — skipping`);
    return '';
  }
  return fs.readFileSync(full, 'utf-8');
}

const accumulatedContextBase: Record<string, unknown> = {
  ticker: 'TUPRS',
  runtimeMode: 'standard_institutional',
};
for (const [contextKey, fileName] of INPUT_FILES) {
  const content = loadInput(fileName);
  if (content) accumulatedContextBase[contextKey] = content;
}

// Load the canonical template once.
const TEMPLATE = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
console.log(`Template: ${TEMPLATE.length.toLocaleString('tr-TR')} bytes`);
console.log(`Input files loaded: ${Object.keys(accumulatedContextBase).filter(k => k.endsWith('_output')).length}`);
console.log('');

// Render report in each theme.
const THEMES: ThemeName[] = ['institutional', 'anthropic', 'minimal'];
const results: Array<{ theme: ThemeName; bytes: number; pages: number; svgs: number; canvases: number; path: string }> = [];

for (const themeName of THEMES) {
  const accumulatedContext = { ...accumulatedContextBase, theme: themeName };
  const ctx = composeReportContext({
    ticker: 'TUPRS',
    reportId: `tuprs-smoke-${themeName}`,
    accumulatedContext,
  });

  const theme = getTheme(themeName);
  const themed = applyTheme(TEMPLATE, theme);
  const html = renderTemplate(themed, ctx);

  const outPath = path.join(OUTPUT_DIR, `TUPRS_${themeName}_smoke.html`);
  fs.writeFileSync(outPath, html, 'utf-8');

  // Match `.page` div boundary, not `.page-header` / `.page-inner` etc.
  const pages = (html.match(/class="page(?:\s|")/g) || []).length + (html.match(/class="page cover-page/g) || []).length;
  const svgs = (html.match(/<svg/gi) || []).length;
  const canvases = (html.match(/<canvas/gi) || []).length;

  results.push({ theme: themeName, bytes: html.length, pages, svgs, canvases, path: outPath });
  console.log(`  ✓ ${themeName.padEnd(14)} ${html.length.toLocaleString('tr-TR').padStart(9)} B  ${String(pages).padStart(2)} pages  ${String(svgs).padStart(2)} SVGs  ${String(canvases).padStart(2)} canvases`);
}

console.log('');
console.log('── Quality gates ──');
const MIN_BYTES = 30_000;
const EXPECTED_PAGES = 10; // template has 14 but some conditional blocks may hide
const MIN_SVGS = 4;

let failures = 0;
for (const r of results) {
  if (r.bytes < MIN_BYTES) { console.log(`  ✗ ${r.theme}: only ${r.bytes} bytes (min ${MIN_BYTES})`); failures++; }
  if (r.pages < EXPECTED_PAGES) { console.log(`  ✗ ${r.theme}: only ${r.pages} pages (expected ≥ ${EXPECTED_PAGES})`); failures++; }
  if (r.svgs < MIN_SVGS) { console.log(`  ✗ ${r.theme}: only ${r.svgs} SVG charts (min ${MIN_SVGS})`); failures++; }
  if (r.canvases > 0) { console.log(`  ✗ ${r.theme}: ${r.canvases} canvas element(s) — Chart.js is forbidden`); failures++; }
}

if (failures === 0) {
  console.log(`  ✓ All ${results.length} themes passed all gates`);
}

console.log('');
console.log('── Theme uniqueness ──');
// Make sure the themes actually differ — read the :root block from each.
const rootRe = /:root\s*\{[\s\S]*?\}/;
const roots = results.map(r => {
  const html = fs.readFileSync(r.path, 'utf-8');
  const m = html.match(rootRe);
  return { theme: r.theme, block: m ? m[0] : '' };
});
for (let i = 0; i < roots.length; i++) {
  for (let j = i + 1; j < roots.length; j++) {
    if (roots[i].block === roots[j].block) {
      console.log(`  ✗ ${roots[i].theme} and ${roots[j].theme} produced identical :root blocks`);
      failures++;
    }
  }
}
if (failures === 0) {
  console.log(`  ✓ All three themes produced distinct CSS`);
}

console.log('');
console.log(`Reports written to: ${OUTPUT_DIR}`);
for (const r of results) {
  console.log(`  file://${r.path.replace(/\\/g, '/')}`);
}

process.exit(failures === 0 ? 0 : 1);
