import Database from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { composeReportContext } from '../src/python/report_formatter/compose.js';
import { renderTemplate } from '../src/python/report_formatter/template_engine.js';

const SESSION_ID = process.argv[2] ?? 'v9D5d_nf_RWSFksHWLFHV';
const TICKER = process.argv[3] ?? 'BIMAS';
const OUT_HTML = process.argv[4] ?? path.resolve('..', `${TICKER}_Yonetim_Kurulu_Raporu_20260423.html`);

const db = new Database(path.resolve('data', 'financex.db'), { readonly: true });
const runs = db.prepare('SELECT agent_id, output_text FROM agent_runs WHERE session_id = ? AND status = ?').all(SESSION_ID, 'completed') as Array<{ agent_id: string; output_text: string | null }>;
const accCtx: Record<string, unknown> = {};
for (const run of runs) {
  accCtx[`${run.agent_id}_output`] = run.output_text || '';
}
console.log(`runs loaded: ${runs.length}`);

const tpl = fs.readFileSync(path.resolve('src', 'python', 'report_formatter', 'template.html'), 'utf-8');
const ctx = composeReportContext({ ticker: TICKER, reportId: `rerender-${Date.now()}`, accumulatedContext: accCtx });
const html = renderTemplate(tpl, ctx);
fs.writeFileSync(OUT_HTML, html, 'utf-8');
console.log(`wrote ${html.length} bytes -> ${OUT_HTML}`);
