/**
 * val_dcf 3-run stability protocol — S12 readiness check.
 *
 * D-list pattern: same KCHOL upstream context replayed 3 times consecutively
 * to measure provider variance (hang oranı, duration distribution, output_bytes).
 *
 * Per S12 readiness rule: hang oranı > 20% → cutover BLOCKER, NOT READY status.
 *
 * Bypasses the parent-orchestrator's executeWithSubAgents (which does fan-out
 * across all 4 valuation sub-agents) — runs val_dcf in isolation so we can
 * cleanly attribute variance to that single sub-agent.
 *
 * Usage:
 *   npx tsx scripts/benchmark-val-dcf-stability.ts <session_id> [--runs N]
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { dispatchSubAgents } from '../src/sub-agents/dispatcher.ts';
import type { SubAgentTask } from '../src/sub-agents/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const sessionId = args.find((a) => !a.startsWith('--'));
const runsIdx = args.findIndex((a) => a === '--runs');
const NUM_RUNS = runsIdx >= 0 && args[runsIdx + 1] ? parseInt(args[runsIdx + 1], 10) : 3;

if (!sessionId) {
  console.error('usage: benchmark-val-dcf-stability.ts <session_id> [--runs N]');
  process.exit(1);
}

const dbPath = path.join(__dirname, '..', 'data', 'financex.db');
const db = new Database(dbPath, { readonly: true });

interface SessionRow { id: string; ticker: string; status: string }
const sess = db.prepare<unknown[], SessionRow>(`SELECT id, ticker, status FROM analysis_sessions WHERE id=?`).get(sessionId);
if (!sess) {
  console.error(`session not found: ${sessionId}`);
  process.exit(1);
}
console.log(`[harness] session ${sess.id} ticker=${sess.ticker} status=${sess.status}`);

const UPSTREAM_AGENTS = [
  'financial_analysis',
  'macro_analysis',
  'sector_competition',
];

const accumulatedContext: Record<string, unknown> = { ticker: sess.ticker };
const taskInputs: Record<string, unknown> = {
  ticker: sess.ticker,
  sector: null,
  current_price_try: null,
  market_cap_try_mn: null,
  shares_outstanding_mn: null,
  fact_pack: null,
};
for (const ag of UPSTREAM_AGENTS) {
  const row = db.prepare<unknown[], { output_text: string | null }>(`SELECT output_text FROM agent_runs WHERE session_id=? AND agent_id=? AND output_text IS NOT NULL ORDER BY rowid DESC LIMIT 1`).get(sess.id, ag);
  if (row?.output_text) {
    accumulatedContext[`${ag}_output`] = row.output_text;
    taskInputs[`${ag}_output`] = row.output_text;
    console.log(`[harness]   ${ag}_output  ${Math.round(row.output_text.length / 1024)}KB`);
  } else {
    console.log(`[harness]   ${ag}_output  (empty — val_dcf may degrade)`);
  }
}
db.close();

interface RunReport {
  run_idx: number;
  status: string;
  duration_s: number;
  output_bytes: number;
  error_class: string;
  error_text?: string;
}

function classifyError(error: string | undefined, status: string, output_bytes: number, duration_s: number): string {
  if (status === 'completed' && output_bytes > 0) return 'completed';
  if (!error) return 'failed_unknown';
  if (/provider_hang/i.test(error) && output_bytes === 0) return 'provider_hang_zero_byte';
  if (/output_volume_timeout/i.test(error)) return 'output_volume_timeout';
  if (/dispatcher hard deadline/i.test(error) && output_bytes === 0) return 'provider_hang_zero_byte';
  if (/timeout/i.test(error)) return 'timeout_other';
  return 'failed_other';
}

async function singleRun(idx: number): Promise<RunReport> {
  const task: SubAgentTask = {
    sub_agent_id: 'val_dcf',
    parent_session_id: `bench_valdcf_${Date.now()}`,
    parent_run_id: `bench_run_${idx}_${Date.now()}`,
    parent_agent_id: 'valuation_agent',
    task_description: `S12 val_dcf stability run ${idx + 1}/${NUM_RUNS}`,
    task_inputs: taskInputs,
  };
  const started = Date.now();
  const [result] = await dispatchSubAgents([task], 'sequential', accumulatedContext);
  const duration_s = Math.round((Date.now() - started) / 1000);
  const output_bytes = (result.output ?? '').length;
  const error_class = classifyError(result.error, result.status, output_bytes, duration_s);
  return {
    run_idx: idx + 1,
    status: result.status,
    duration_s,
    output_bytes,
    error_class,
    error_text: result.error ? String(result.error).slice(0, 200) : undefined,
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log(`╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  val_dcf STABILITY PROTOCOL — ${NUM_RUNS} consecutive runs                ║`);
  console.log(`║  ticker=${sess.ticker}  cap=720s  retry_max=2 (per yml)              ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);
  console.log('');
  console.log(`[harness] task_inputs size: ${Math.round(JSON.stringify(taskInputs).length / 1024)}KB`);

  const reports: RunReport[] = [];
  const protocolStarted = Date.now();
  for (let i = 0; i < NUM_RUNS; i++) {
    console.log('');
    console.log(`▶ RUN ${i + 1}/${NUM_RUNS}  (sequential, ${reports.filter((r) => r.error_class === 'provider_hang_zero_byte').length}/${i} hang so far)`);
    const r = await singleRun(i);
    reports.push(r);
    console.log(`   ⏹ status=${r.status}  dur=${r.duration_s}s  output_bytes=${r.output_bytes}  error_class=${r.error_class}` + (r.error_text ? `  err=${r.error_text}` : ''));
  }
  const protocolSec = Math.round((Date.now() - protocolStarted) / 1000);

  // Statistics
  const hangCount = reports.filter((r) => r.error_class === 'provider_hang_zero_byte').length;
  const completedCount = reports.filter((r) => r.error_class === 'completed').length;
  const failedOther = reports.filter((r) => !['completed', 'provider_hang_zero_byte'].includes(r.error_class)).length;
  const hangRatePct = (hangCount / NUM_RUNS) * 100;
  const successRatePct = (completedCount / NUM_RUNS) * 100;
  const completedDurations = reports.filter((r) => r.error_class === 'completed').map((r) => r.duration_s);
  const meanCompletedDur = completedDurations.length > 0
    ? Math.round(completedDurations.reduce((s, x) => s + x, 0) / completedDurations.length)
    : null;

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`STATISTICS — ${NUM_RUNS} runs in ${protocolSec}s`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`  Hang count:               ${hangCount}/${NUM_RUNS}  (${hangRatePct.toFixed(1)}%)`);
  console.log(`  Success count:            ${completedCount}/${NUM_RUNS}  (${successRatePct.toFixed(1)}%)`);
  console.log(`  Other failure:            ${failedOther}/${NUM_RUNS}`);
  console.log(`  Mean dur (completed):     ${meanCompletedDur === null ? 'n/a' : meanCompletedDur + 's'}`);
  console.log('');
  console.log(`  Per-run breakdown:`);
  for (const r of reports) {
    console.log(`    Run ${r.run_idx}: ${r.error_class.padEnd(28)} dur=${String(r.duration_s).padStart(4)}s output=${String(r.output_bytes).padStart(6)}B`);
  }
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('VERDICT');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  if (hangRatePct > 20) {
    console.log(`  🔴 HANG ORANI %${hangRatePct.toFixed(1)} > %20 — cutover BLOCKER`);
    console.log(`     S12 status: NOT READY`);
    console.log(`     Önerilen aksiyonlar: structural fix (val_dcf prompt simplification veya`);
    console.log(`     deterministic split — ss_signal_merger pattern uygulanabilir).`);
  } else if (hangRatePct > 10) {
    console.log(`  🟡 HANG ORANI %${hangRatePct.toFixed(1)} (10-20%) — borderline, cutover öncesi monitoring gerekli`);
  } else {
    console.log(`  🟢 HANG ORANI %${hangRatePct.toFixed(1)} ≤ %10 — kabul edilebilir`);
  }

  // Save artefact
  const fs = await import('node:fs');
  const artefactDir = path.join(__dirname, '..', 'data', 'benchmark-s12');
  if (!fs.existsSync(artefactDir)) fs.mkdirSync(artefactDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const artefact = path.join(artefactDir, `val_dcf_stability_${sess.ticker}_${sess.id}_${ts}.json`);
  fs.writeFileSync(artefact, JSON.stringify({
    session_id: sess.id,
    ticker: sess.ticker,
    num_runs: NUM_RUNS,
    hang_rate_pct: hangRatePct,
    success_rate_pct: successRatePct,
    mean_completed_duration_s: meanCompletedDur,
    reports,
  }, null, 2));
  console.log('');
  console.log(`[harness] artefact saved: ${path.relative(process.cwd(), artefact)}`);
}

main().catch((err) => {
  console.error('[harness] FATAL:', err);
  process.exit(2);
});
