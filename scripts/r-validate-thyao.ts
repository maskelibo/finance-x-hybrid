/**
 * Block R validation — THYAO session post-mortem.
 * Ran after session terminal state to verify all R-phase features worked live.
 */
import fs from 'node:fs';
import path from 'node:path';
import { db } from '../backend/src/db.js';
import { getFactPack } from '../backend/src/fact-pack.js';
import { AGENTS_ROOT } from '../backend/src/config.js';

const SID = process.argv[2] || 'AKyBn8BMI_5OuhprEd_S7';

const session = db.prepare(`SELECT * FROM analysis_sessions WHERE id = ?`).get(SID) as any;
if (!session) { console.error(`Session ${SID} not found`); process.exit(1); }

const runs = db.prepare(`SELECT agent_id, status, duration_ms, tokens_used, cost_usd, error_message FROM agent_runs WHERE session_id = ? ORDER BY rowid ASC`).all(SID) as any[];

const completed = runs.filter(r => r.status === 'completed').length;
const failed = runs.filter(r => r.status === 'failed').length;
const running = runs.filter(r => r.status === 'running').length;

console.log('=== SESSION ===');
console.log(`id=${SID} ticker=${session.ticker} mode=${session.runtime_mode}`);
console.log(`status=${session.status} phase=${session.current_phase}`);
console.log(`started=${session.started_at} completed=${session.completed_at}`);
console.log(`cost=\$${(session.total_cost_usd || 0).toFixed(3)} tokens=${session.total_tokens}`);
console.log(`overall_score=${session.overall_score}`);
console.log(`quality_warning=${session.quality_warning} reason=${session.quality_warning_reason || '(none)'}`);
console.log(`error=${session.error_message || '(none)'}`);

console.log(`\n=== AGENT RUNS === (${runs.length} total: ${completed} completed, ${failed} failed, ${running} running)`);
for (const r of runs) {
  const dur = r.duration_ms ? `${Math.round(r.duration_ms/1000)}s` : '-';
  const err = r.error_message ? ` err=${String(r.error_message).slice(0,80)}` : '';
  console.log(`  ${r.agent_id.padEnd(26)} ${r.status.padEnd(10)} ${dur.padStart(6)} \$${(r.cost_usd||0).toFixed(3)}${err}`);
}

console.log(`\n=== R-FEATURE CHECKS ===`);

// R6: sector from registry
const sectorSeen = runs.some(r => (r.error_message || '').toLowerCase().includes('aviation')) ||
  fs.readFileSync('/tmp/fx-server.log', 'utf8').includes('[sector] THYAO → aviation (from registry)');
console.log(`R6 sector registry (THYAO → aviation): ${sectorSeen ? '✅' : '⚠️ server log'te kanıt yok'}`);

// R7: fact pack initialized
const pack = getFactPack(SID);
console.log(`R7 fact pack initialized: ${pack ? `✅ sector=${pack.sector_canonical}` : '❌ missing'}`);

// R3: feedback loop lessons.jsonl write (mtime after session start)
const sessionStart = new Date(session.started_at).getTime();
const agents = fs.readdirSync(AGENTS_ROOT).filter(d => fs.statSync(path.join(AGENTS_ROOT, d)).isDirectory() && !d.startsWith('_'));
const lessonsWritten: string[] = [];
for (const aid of agents) {
  const fp = path.join(AGENTS_ROOT, aid, 'lessons.jsonl');
  if (!fs.existsSync(fp)) continue;
  const mtime = fs.statSync(fp).mtimeMs;
  if (mtime > sessionStart) lessonsWritten.push(aid);
}
console.log(`R3 feedback loop wrote lessons.jsonl since session start: ${lessonsWritten.length} agent — ${lessonsWritten.slice(0,5).join(', ')}${lessonsWritten.length > 5 ? '...' : ''}`);

// R5: QA status signal
const qaSignal = session.status === 'qa_failed' ? 'HARD BLOCKED (critical)' :
  session.status === 'completed_with_warning' ? `SOFT (warning: ${session.quality_warning_reason || '-'})` :
  session.status === 'completed' ? 'PASS' : `state=${session.status}`;
console.log(`R5 QA hard gate signal: ${qaSignal}`);

// R8: PII scrub fired?
const serverLog = fs.existsSync('/tmp/fx-server.log') ? fs.readFileSync('/tmp/fx-server.log','utf8') : '';
const piiMatches = serverLog.match(/\[PII\] Scrubbed[^\n]*/g) || [];
console.log(`R8 PII scrubber fires: ${piiMatches.length}`);

// IAS 29 adjusted EBITDA check — look in financial_analysis output if available
const faRow = db.prepare(`SELECT output_text FROM agent_runs WHERE session_id = ? AND agent_id = 'financial_analysis'`).get(SID) as { output_text: string | null } | undefined;
if (faRow?.output_text) {
  const lower = faRow.output_text.toLowerCase();
  const has_ias29 = lower.includes('ias 29') || lower.includes('ias29') || lower.includes('enflasyon muhasebesi');
  const has_adjusted = lower.includes('adjusted') || lower.includes('düzeltilmiş') || lower.includes('duzeltilmis');
  const has_ebitda = lower.includes('ebitda') || lower.includes('favök') || lower.includes('favok');
  console.log(`IAS 29 adjusted EBITDA: IAS29=${has_ias29 ? '✅' : '❌'} adjusted=${has_adjusted ? '✅' : '❌'} ebitda=${has_ebitda ? '✅' : '❌'}`);
} else {
  console.log(`IAS 29 adjusted EBITDA: financial_analysis output yok`);
}

console.log(`\n=== END ===`);
