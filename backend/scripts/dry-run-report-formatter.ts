/**
 * Dry-run for the Python hybrid report_formatter.
 *
 * Picks a completed session, feeds its LLM outputs into the Python
 * template engine, and writes the rendered HTML to /tmp so we can
 * eyeball it. Claude is NOT called; narrative blocks left empty.
 *
 * Usage:  cd backend && npx tsx scripts/dry-run-report-formatter.ts [session_id]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { db } from '../src/db.js';
import { composeReportContext } from '../src/python/report_formatter/compose.js';
import { renderTemplate } from '../src/python/report_formatter/template_engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, '..', 'src', 'python', 'report_formatter', 'template.html');


const sessionId = process.argv[2] ?? (() => {
  const row = db.prepare(
    `SELECT id FROM analysis_sessions WHERE status='completed' ORDER BY started_at DESC LIMIT 1`,
  ).get() as { id: string } | undefined;
  return row?.id;
})();

if (!sessionId) {
  console.error('No completed session found. Pass a session_id as arg.');
  process.exit(1);
}

const sessionMeta = db.prepare(
  `SELECT ticker FROM analysis_sessions WHERE id = ?`,
).get(sessionId) as { ticker: string } | undefined;

if (!sessionMeta) {
  console.error(`Session ${sessionId} not found`);
  process.exit(1);
}

const { ticker } = sessionMeta;

// Load every completed agent's output into accumulatedContext under
// the `<agent_id>_output` key so composeReportContext can read them.
const rows = db.prepare(
  `SELECT agent_id, output_text FROM agent_runs WHERE session_id = ? AND status = 'completed'`,
).all(sessionId) as Array<{ agent_id: string; output_text: string }>;

const accumulatedContext: Record<string, unknown> = {};
for (const r of rows) {
  accumulatedContext[`${r.agent_id}_output`] = r.output_text;
}

console.log(`Session ${sessionId} (${ticker})`);
console.log(`  Loaded ${rows.length} agent outputs into context`);

const composed = composeReportContext({
  ticker,
  reportId: 'dry-rpt-demo',
  accumulatedContext,
});

console.log(`\n  Composed context keys: ${Object.keys(composed).join(', ')}`);

const template = readFileSync(TEMPLATE_PATH, 'utf-8');
const html = renderTemplate(template, composed);

const outPath = `/tmp/${ticker.toLowerCase()}-python-report.html`;
writeFileSync(outPath, html, 'utf-8');

console.log(`\n  Rendered ${html.length} bytes → ${outPath}`);
console.log(`  Contains <html>: ${html.includes('<html')}`);
console.log(`  Contains disclaimer: ${html.includes('yatırım tavsiyesi değildir')}`);
console.log(`  Contains ticker: ${html.includes(ticker)}`);
console.log(`  QA score in output: ${composed.qa_score}`);
console.log(`  DCF present: ${composed.dcf_present}`);
console.log(`  Critical findings: ${(composed.critical_findings as string[]).length}`);
console.log(`  Highlights: ${(composed.highlights as unknown[]).length}`);
console.log(`  Benchmarks: ${(composed.benchmarks as unknown[]).length}`);
console.log(`  Event impacts: ${(composed.event_impacts as unknown[]).length}`);

// Compare size vs LLM report_formatter for this session
const llmFormatter = rows.find(r => r.agent_id === 'report_formatter');
if (llmFormatter) {
  let llmHtmlLen = llmFormatter.output_text.length;
  try {
    const env = JSON.parse(llmFormatter.output_text);
    if (typeof env === 'object' && env?.formatted_html) llmHtmlLen = env.formatted_html.length;
  } catch { /* raw */ }
  console.log(`\n  LLM report_formatter output: ${llmFormatter.output_text.length} bytes (HTML ${llmHtmlLen})`);
  console.log(`  Python template output:      ${html.length} bytes (${Math.round((html.length / llmHtmlLen) * 100)}% of LLM)`);
}
