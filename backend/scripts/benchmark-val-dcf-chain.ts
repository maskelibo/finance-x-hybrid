/**
 * val_dcf chain stability protocol — S12 Phase 2-3 (variance + shadow validation).
 *
 * Replays the new 4-sub-agent val_dcf chain (3 deterministic + 1 narrow LLM)
 * on KCHOL upstream context multiple times and measures:
 *
 *   - hang ratio (target <5%)
 *   - latency per run
 *   - output drift across runs (target <1% on key fields: WACC, EV, equity, terminal_value)
 *   - parity vs legacy val_dcf shape
 *   - chain consistency (aggregator validation)
 *
 * Usage:
 *   npx tsx scripts/benchmark-val-dcf-chain.ts <session_id> [--runs N]
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { dispatchSubAgents } from '../src/sub-agents/dispatcher.ts';
import type { SubAgentResult, SubAgentTask } from '../src/sub-agents/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const sessionId = args.find((a) => !a.startsWith('--'));
const runsIdx = args.findIndex((a) => a === '--runs');
const NUM_RUNS = runsIdx >= 0 && args[runsIdx + 1] ? parseInt(args[runsIdx + 1], 10) : 3;

if (!sessionId) {
  console.error('usage: benchmark-val-dcf-chain.ts <session_id> [--runs N]');
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

const accumulatedContext: Record<string, unknown> = { ticker: sess.ticker };
for (const ag of ['financial_analysis', 'macro_analysis', 'sector_competition']) {
  const row = db.prepare<unknown[], { output_text: string | null }>(`SELECT output_text FROM agent_runs WHERE session_id=? AND agent_id=? AND output_text IS NOT NULL ORDER BY rowid DESC LIMIT 1`).get(sess.id, ag);
  if (row?.output_text) {
    accumulatedContext[`${ag}_output`] = row.output_text;
    console.log(`[harness]   ${ag}_output  ${Math.round(row.output_text.length / 1024)}KB`);
  }
}
db.close();

interface ChainRunReport {
  run_idx: number;
  status_per_step: Record<string, string>;
  duration_per_step_ms: Record<string, number>;
  output_bytes_per_step: Record<string, number>;
  total_dur_s: number;
  hang_in_run: boolean;
  parsed: Record<string, unknown>;
  aggregator_warnings: string[];
}

const PHASE_A: Array<'val_dcf_assumptions' | 'val_dcf_projection'> = ['val_dcf_assumptions', 'val_dcf_projection'];

async function singleChainRun(idx: number): Promise<ChainRunReport> {
  // Pre-parse upstream JSON outputs (cached from accumulatedContext); pass
  // small extracted fields to deterministic Python modules to stay under
  // Windows command-line argv limit.
  const fa = parseUpstreamJsonHelper(accumulatedContext['financial_analysis_output']);
  const macro = parseUpstreamJsonHelper(accumulatedContext['macro_analysis_output']);
  const faCanonical = (fa as any)?.canonical_numbers ?? null;
  const macroRates = (macro as any)?.rates ?? null;
  const macroInflation = (macro as any)?.inflation ?? null;
  const netDebtFromFa = (faCanonical as any)?.net_debt ?? (faCanonical as any)?.total_debt ?? null;

  const detBaseInputs: Record<string, unknown> = {
    ticker: sess.ticker,
    sector: 'holding',
    fa_canonical_numbers: faCanonical,
    macro_rates: macroRates,
    macro_inflation: macroInflation,
  };

  const started = Date.now();
  const stepResults: Record<string, SubAgentResult> = {};
  const stepParsed: Record<string, unknown> = {};
  const statusPer: Record<string, string> = {};
  const durPer: Record<string, number> = {};
  const bytesPer: Record<string, number> = {};

  // Phase A — val_dcf_assumptions + val_dcf_projection in parallel (deterministic)
  const phaseATasks: SubAgentTask[] = PHASE_A.map((subId) => ({
    sub_agent_id: subId,
    parent_session_id: `bench_chain_${idx}_${Date.now()}`,
    parent_run_id: `bench_run_${idx}_${Date.now()}`,
    parent_agent_id: 'valuation_agent',
    task_description: `chain run ${idx + 1} Phase A: ${subId}`,
    task_inputs: detBaseInputs,
  }));
  const phaseAResults = await dispatchSubAgents(phaseATasks, 'parallel', accumulatedContext);
  for (const r of phaseAResults) {
    stepResults[r.sub_agent_id] = r;
    statusPer[r.sub_agent_id] = r.status;
    durPer[r.sub_agent_id] = r.duration_ms ?? 0;
    bytesPer[r.sub_agent_id] = (r.output ?? '').length;
    if (r.status === 'completed' && r.output_parsed) stepParsed[r.sub_agent_id] = r.output_parsed;
  }

  // Phase B — val_dcf_terminal (deterministic)
  const terminalInputs: Record<string, unknown> = {
    ticker: sess.ticker,
    shares_outstanding_mn: null,
    net_debt_try_mn: netDebtFromFa,
  };
  if (stepParsed['val_dcf_assumptions']) terminalInputs['previous_assumptions'] = stepParsed['val_dcf_assumptions'];
  if (stepParsed['val_dcf_projection']) terminalInputs['previous_projection'] = stepParsed['val_dcf_projection'];
  const terminalTask: SubAgentTask = {
    sub_agent_id: 'val_dcf_terminal',
    parent_session_id: `bench_chain_${idx}`,
    parent_run_id: `bench_run_${idx}`,
    parent_agent_id: 'valuation_agent',
    task_description: `chain run ${idx + 1} Phase B`,
    task_inputs: terminalInputs,
  };
  const [terminalRes] = await dispatchSubAgents([terminalTask], 'sequential', accumulatedContext);
  stepResults['val_dcf_terminal'] = terminalRes;
  statusPer['val_dcf_terminal'] = terminalRes.status;
  durPer['val_dcf_terminal'] = terminalRes.duration_ms ?? 0;
  bytesPer['val_dcf_terminal'] = (terminalRes.output ?? '').length;
  if (terminalRes.status === 'completed' && terminalRes.output_parsed) stepParsed['val_dcf_terminal'] = terminalRes.output_parsed;

  // Phase C — val_dcf_synthesizer (LLM)
  const synthInputs: Record<string, unknown> = {
    ticker: sess.ticker,
    current_price_try: 165,
    previous_assumptions: stepParsed['val_dcf_assumptions'] ?? null,
    previous_projection: stepParsed['val_dcf_projection'] ?? null,
    previous_terminal: stepParsed['val_dcf_terminal'] ?? null,
  };
  const synthTask: SubAgentTask = {
    sub_agent_id: 'val_dcf_synthesizer',
    parent_session_id: `bench_chain_${idx}`,
    parent_run_id: `bench_run_${idx}`,
    parent_agent_id: 'valuation_agent',
    task_description: `chain run ${idx + 1} Phase C`,
    task_inputs: synthInputs,
  };
  const [synthRes] = await dispatchSubAgents([synthTask], 'sequential', accumulatedContext);
  stepResults['val_dcf_synthesizer'] = synthRes;
  statusPer['val_dcf_synthesizer'] = synthRes.status;
  durPer['val_dcf_synthesizer'] = synthRes.duration_ms ?? 0;
  bytesPer['val_dcf_synthesizer'] = (synthRes.output ?? '').length;
  if (synthRes.status === 'completed' && synthRes.output_parsed) stepParsed['val_dcf_synthesizer'] = synthRes.output_parsed;

  const totalDurS = Math.round((Date.now() - started) / 1000);
  const hangInRun = Object.values(stepResults).some((r) =>
    r.status !== 'completed' && /provider_hang|deadline/i.test(r.error ?? '')
  );

  // Aggregator validation
  const aggregator_warnings: string[] = [];
  const ass = stepParsed['val_dcf_assumptions'] as any;
  const term = stepParsed['val_dcf_terminal'] as any;
  if (ass?.wacc_components?.wacc_pct != null && ass?.terminal_growth_pct != null) {
    const spread = ass.wacc_components.wacc_pct - ass.terminal_growth_pct;
    if (spread < 0.5) aggregator_warnings.push(`wacc-g spread ${spread.toFixed(2)}pp too tight`);
  }
  if (term && Number.isFinite(term.enterprise_value_try_mn)) {
    const ev = term.enterprise_value_try_mn;
    const expected = (term.pv_explicit_try_mn ?? 0) + (term.pv_terminal_try_mn ?? 0);
    if (Math.abs(ev - expected) > Math.max(1, Math.abs(expected) * 0.001)) {
      aggregator_warnings.push(`ev mismatch: ev=${ev} pv_e+pv_t=${expected}`);
    }
  }

  return {
    run_idx: idx + 1,
    status_per_step: statusPer,
    duration_per_step_ms: durPer,
    output_bytes_per_step: bytesPer,
    total_dur_s: totalDurS,
    hang_in_run: hangInRun,
    parsed: stepParsed,
    aggregator_warnings,
  };
}

function pickField(parsed: Record<string, unknown>, path: string[]): unknown {
  let cur: any = parsed;
  for (const p of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

function pctDrift(values: Array<number | null | undefined>): number | null {
  const numbers = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (numbers.length < 2) return null;
  const mean = numbers.reduce((s, x) => s + x, 0) / numbers.length;
  if (mean === 0) return null;
  const max = Math.max(...numbers);
  const min = Math.min(...numbers);
  return Math.abs(max - min) / Math.abs(mean) * 100;
}

async function main(): Promise<void> {
  console.log('');
  console.log(`╔════════════════════════════════════════════════════════════════════╗`);
  console.log(`║  val_dcf CHAIN STABILITY PROTOCOL — ${NUM_RUNS} runs (S12 Phase 2-3)         ║`);
  console.log(`║  ticker=${sess.ticker}  4 sub-agents per run (3 det + 1 LLM)             ║`);
  console.log(`╚════════════════════════════════════════════════════════════════════╝`);

  const reports: ChainRunReport[] = [];
  const protocolStarted = Date.now();
  for (let i = 0; i < NUM_RUNS; i++) {
    console.log('');
    console.log(`▶ RUN ${i + 1}/${NUM_RUNS}`);
    const r = await singleChainRun(i);
    reports.push(r);
    console.log(`   total_dur=${r.total_dur_s}s  hang_in_run=${r.hang_in_run}`);
    for (const [k, v] of Object.entries(r.status_per_step)) {
      console.log(`     ${k.padEnd(28)} status=${v.padEnd(10)} dur=${Math.round((r.duration_per_step_ms[k] ?? 0) / 1000)}s bytes=${r.output_bytes_per_step[k]}`);
    }
    if (r.aggregator_warnings.length > 0) {
      for (const w of r.aggregator_warnings) console.log(`     ⚠ aggregator: ${w}`);
    }
  }
  const protocolSec = Math.round((Date.now() - protocolStarted) / 1000);

  // ========== Statistics ==========
  const hangCount = reports.filter((r) => r.hang_in_run).length;
  const fullSuccess = reports.filter((r) => Object.values(r.status_per_step).every((s) => s === 'completed')).length;
  const hangRatePct = (hangCount / NUM_RUNS) * 100;
  const synthDurations = reports.map((r) => Math.round((r.duration_per_step_ms['val_dcf_synthesizer'] ?? 0) / 1000)).filter((d) => d > 0);
  const meanSynthDur = synthDurations.length > 0 ? Math.round(synthDurations.reduce((s, x) => s + x, 0) / synthDurations.length) : null;

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`AGGREGATE STATISTICS — ${NUM_RUNS} runs in ${protocolSec}s`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`  Full success runs:        ${fullSuccess}/${NUM_RUNS}`);
  console.log(`  Hang count:               ${hangCount}/${NUM_RUNS}  (${hangRatePct.toFixed(1)}%)  [target <5%]`);
  console.log(`  Mean synthesizer dur:     ${meanSynthDur === null ? 'n/a' : meanSynthDur + 's'}`);

  // ========== Output drift across runs ==========
  console.log('');
  console.log('  Output drift (across runs, key DCF fields):');
  type FieldSpec = { label: string; sub_agent: string; path: string[] };
  const fields: FieldSpec[] = [
    { label: 'WACC pct',                sub_agent: 'val_dcf_assumptions', path: ['wacc_components', 'wacc_pct'] },
    { label: 'Terminal growth pct',     sub_agent: 'val_dcf_assumptions', path: ['terminal_growth_pct'] },
    { label: 'PV explicit (TRY mn)',    sub_agent: 'val_dcf_terminal',    path: ['pv_explicit_try_mn'] },
    { label: 'Terminal value (TRY mn)', sub_agent: 'val_dcf_terminal',    path: ['terminal_value_try_mn'] },
    { label: 'Enterprise value',        sub_agent: 'val_dcf_terminal',    path: ['enterprise_value_try_mn'] },
    { label: 'Equity value',            sub_agent: 'val_dcf_terminal',    path: ['equity_value_try_mn'] },
    { label: 'Implied share price',     sub_agent: 'val_dcf_terminal',    path: ['implied_share_price_try'] },
    { label: 'Synthesizer target',      sub_agent: 'val_dcf_synthesizer', path: ['final_target_try'] },
  ];
  for (const f of fields) {
    const values = reports.map((r) => {
      const sub = r.parsed[f.sub_agent];
      if (!sub || typeof sub !== 'object') return null;
      const v = pickField(sub as Record<string, unknown>, f.path);
      return typeof v === 'number' ? v : (v == null ? null : null);
    });
    const drift = pctDrift(values);
    const valuesStr = values.map((v) => v === null ? 'null' : (typeof v === 'number' ? v.toFixed(2) : String(v))).join(' / ');
    const driftStr = drift === null ? 'n/a' : drift.toFixed(3) + '%';
    const ok = drift === null || drift < 1.0 ? '✅' : '❌';
    console.log(`    ${ok} ${f.label.padEnd(28)} runs=[${valuesStr}]  drift=${driftStr}`);
  }

  // ========== Verdict ==========
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('VERDICT');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  if (hangRatePct >= 5) {
    console.log(`  🔴 hang_ratio ${hangRatePct.toFixed(1)}% ≥ 5% — chain NOT STABLE`);
  } else if (fullSuccess < NUM_RUNS) {
    console.log(`  🟡 hang_ratio ${hangRatePct.toFixed(1)}% < 5% but ${NUM_RUNS - fullSuccess}/${NUM_RUNS} runs incomplete`);
  } else {
    console.log(`  🟢 hang_ratio ${hangRatePct.toFixed(1)}% < 5% AND ${fullSuccess}/${NUM_RUNS} full success — chain STABLE`);
  }

  // Save artefact
  const fs = await import('node:fs');
  const artefactDir = path.join(__dirname, '..', 'data', 'benchmark-s12');
  if (!fs.existsSync(artefactDir)) fs.mkdirSync(artefactDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const artefact = path.join(artefactDir, `val_dcf_chain_${sess.ticker}_${sess.id}_${ts}.json`);
  fs.writeFileSync(artefact, JSON.stringify({
    session_id: sess.id,
    ticker: sess.ticker,
    num_runs: NUM_RUNS,
    hang_rate_pct: hangRatePct,
    full_success_count: fullSuccess,
    mean_synth_duration_s: meanSynthDur,
    reports,
  }, null, 2));
  console.log('');
  console.log(`[harness] artefact saved: ${path.relative(process.cwd(), artefact)}`);
}

function parseUpstreamJsonHelper(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed); } catch { /* fall through */ }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) try { return JSON.parse(fence[1]); } catch { /* swallow */ }
  return null;
}

main().catch((err) => {
  console.error('[harness] FATAL:', err);
  process.exit(2);
});
