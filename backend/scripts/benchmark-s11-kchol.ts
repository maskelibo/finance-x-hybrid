/**
 * S11 KCHOL standalone benchmark harness — restructured chain.
 *
 * 2026-04-26 RESTRUCTURE: signal layer is now 4 deterministic Python sub-agents
 * (3 extractors in parallel + compiler) rather than the monolithic
 * ss_signal_merger LLM (Sonnet variance %67 hang oranı, kabul edilemez).
 *
 *   Phase 1 (parallel det.): ss_{financial,event,macro}_signal_extractor
 *   Phase 2 (sequential det.): ss_signal_compiler
 *   Phase 3 (sequential LLM): ss_contradiction_flag
 *   Phase 4 (sequential LLM): ss_thesis_writer
 *
 * Replays the chain on top of accumulatedContext reconstructed from a
 * previously completed KCHOL session in the DB. Bypasses the orchestrator and
 * the fire-and-forget shadow runner — runs the chain inline so we can capture
 * every metric, validate success criteria, and STOP at phase end.
 *
 * Usage:
 *   npx tsx scripts/benchmark-s11-kchol.ts <session_id> [--strip-valuation]
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { buildCompactSummaryPack, packForSubAgent, type CompactSummaryPack } from '../src/sub-agents/compact_summary_pack.ts';
import { dispatchSubAgents } from '../src/sub-agents/dispatcher.ts';
import type { SubAgentResult, SubAgentTask } from '../src/sub-agents/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Phase1Step = 'ss_financial_signal_extractor' | 'ss_event_signal_extractor' | 'ss_macro_signal_extractor';
type AnyStep =
  | Phase1Step
  | 'ss_signal_compiler'
  | 'ss_contradiction_flag'
  | 'ss_thesis_writer';

const PHASE1: Phase1Step[] = [
  'ss_financial_signal_extractor',
  'ss_event_signal_extractor',
  'ss_macro_signal_extractor',
];
const ALL_STEPS: AnyStep[] = [...PHASE1, 'ss_signal_compiler', 'ss_contradiction_flag', 'ss_thesis_writer'];

const PACK_SECTION_KEYS = [
  'top_financial_insights',
  'top_valuation_outputs',
  'top_sector_findings',
  'top_macro_impacts',
  'top_event_conclusions',
  'unresolved_contradictions',
  'citation_sensitive_facts',
] as const;

const args = process.argv.slice(2);
const sessionId = args.find((a) => !a.startsWith('--'));
const stripValuation = args.includes('--strip-valuation');

if (!sessionId) {
  console.error('usage: benchmark-s11-kchol.ts <session_id> [--strip-valuation]');
  process.exit(1);
}

const dbPath = path.join(__dirname, '..', 'data', 'financex.db');
const db = new Database(dbPath, { readonly: true });

interface SessionRow { id: string; ticker: string; status: string; started_at: string; completed_at: string | null }
const sess = db.prepare<unknown[], SessionRow>(`SELECT id, ticker, status, started_at, completed_at FROM analysis_sessions WHERE id=?`).get(sessionId);
if (!sess) {
  console.error(`session not found: ${sessionId}`);
  process.exit(1);
}
console.log(`[harness] Loaded session ${sess.id} ticker=${sess.ticker} status=${sess.status} started=${sess.started_at} completed=${sess.completed_at}`);

const UPSTREAM_AGENTS = [
  'financial_analysis',
  'valuation_agent',
  'sector_competition',
  'macro_analysis',
  'event_impact_mapper',
  'strategic_synthesis',
  'qa_review',
];

const accumulatedContext: Record<string, unknown> = { ticker: sess.ticker };
for (const ag of UPSTREAM_AGENTS) {
  const row = db.prepare<unknown[], { output_text: string | null }>(`SELECT output_text FROM agent_runs WHERE session_id=? AND agent_id=? AND output_text IS NOT NULL ORDER BY rowid DESC LIMIT 1`).get(sess.id, ag);
  if (row?.output_text) {
    accumulatedContext[`${ag}_output`] = row.output_text;
    console.log(`[harness]   ${ag}_output  ${Math.round(row.output_text.length / 1024)}KB`);
  } else {
    console.log(`[harness]   ${ag}_output  (empty)`);
  }
}
if (stripValuation) {
  delete accumulatedContext['valuation_agent_output'];
  console.log(`[harness] --strip-valuation applied: valuation_agent_output removed`);
}
db.close();

const harnessSessionId = `bench_s11_${Date.now()}`;
const harnessRunId = `bench_run_${Date.now()}`;

interface StepReport {
  sub_agent_id: AnyStep;
  status: string;
  input_bytes: number;
  output_bytes: number;
  duration_s: number;
  used_pack_sections: string[];
  missing_pack_sections: string[];
  data_gaps: string[];
  phase: 1 | 2 | 3 | 4;
  error?: string;
  parsed?: unknown;
}

async function run(): Promise<void> {
  const pack = buildCompactSummaryPack(accumulatedContext);
  const packBytes = JSON.stringify(pack).length;
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log(`║  COMPACT PACK — ${pack.ticker}  sector=${pack.sector ?? '-'}  is_holding=${pack.is_holding}  ${Math.round(packBytes / 1024)}KB`.padEnd(78) + '║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(`  fin=${pack.top_financial_insights.length}  val=${pack.top_valuation_outputs.length}  sec=${pack.top_sector_findings.length}  mac=${pack.top_macro_impacts.length}  evt=${pack.top_event_conclusions.length}  contra=${pack.unresolved_contradictions.length}  cit=${pack.citation_sensitive_facts.length}`);
  console.log('');

  const startedAt = Date.now();
  const stepParsed: Record<string, unknown> = {};
  const reports: StepReport[] = [];

  // ---------- Phase 1: 3 deterministic extractors in parallel ----------
  console.log(`▶ PHASE 1  3 deterministic extractors (parallel)`);
  const phase1Tasks: SubAgentTask[] = PHASE1.map((subId) => {
    const slice = packForSubAgent(subId, pack) as Record<string, unknown>;
    return {
      sub_agent_id: subId,
      parent_session_id: harnessSessionId,
      parent_run_id: harnessRunId,
      parent_agent_id: 'strategic_synthesis',
      task_description: `S11 BENCHMARK Phase 1: ${subId}`,
      task_inputs: slice,
    };
  });
  const phase1Started = Date.now();
  const phase1Results = await dispatchSubAgents(phase1Tasks, 'parallel', accumulatedContext);
  const phase1Ms = Date.now() - phase1Started;
  for (const r of phase1Results) {
    const inputs = phase1Tasks.find((t) => t.sub_agent_id === r.sub_agent_id)!.task_inputs as Record<string, unknown>;
    const slice = inputs;
    const used = packedSectionsFromSlice(slice);
    const missing = missingSectionsFromPack(pack, used);
    const outputBytes = (r.output ?? '').length;
    const dataGaps = extractDataGaps(r.output_parsed);
    reports.push({
      sub_agent_id: r.sub_agent_id as Phase1Step,
      status: r.status,
      input_bytes: JSON.stringify(slice).length,
      output_bytes: outputBytes,
      duration_s: Math.round((r.duration_ms ?? 0) / 1000),
      used_pack_sections: used,
      missing_pack_sections: missing,
      data_gaps: dataGaps,
      phase: 1,
      error: r.error,
      parsed: r.output_parsed,
    });
    if (r.status === 'completed' && r.output_parsed) stepParsed[r.sub_agent_id] = r.output_parsed;
    console.log(`   ⏹ ${r.sub_agent_id}  status=${r.status}  dur=${Math.round((r.duration_ms ?? 0) / 1000)}s  output_bytes=${outputBytes}` + (r.error ? `  err=${String(r.error).slice(0, 100)}` : ''));
  }
  console.log(`   phase 1 done in ${phase1Ms}ms`);
  console.log('');

  // ---------- Phase 2: signal_compiler ----------
  console.log(`▶ PHASE 2  ss_signal_compiler (sequential deterministic)`);
  const compilerSlice = packForSubAgent('ss_signal_compiler', pack) as Record<string, unknown>;
  if (stepParsed['ss_financial_signal_extractor']) compilerSlice['previous_financial_signals'] = stepParsed['ss_financial_signal_extractor'];
  if (stepParsed['ss_event_signal_extractor']) compilerSlice['previous_event_signals'] = stepParsed['ss_event_signal_extractor'];
  if (stepParsed['ss_macro_signal_extractor']) compilerSlice['previous_macro_signals'] = stepParsed['ss_macro_signal_extractor'];

  const compilerInputBytes = JSON.stringify(compilerSlice).length;
  const compilerTask: SubAgentTask = {
    sub_agent_id: 'ss_signal_compiler',
    parent_session_id: harnessSessionId,
    parent_run_id: harnessRunId,
    parent_agent_id: 'strategic_synthesis',
    task_description: 'S11 BENCHMARK Phase 2: signal_compiler',
    task_inputs: compilerSlice,
  };
  const phase2Started = Date.now();
  const [compilerResult] = await dispatchSubAgents([compilerTask], 'sequential', accumulatedContext);
  const compilerOutputBytes = (compilerResult.output ?? '').length;
  reports.push({
    sub_agent_id: 'ss_signal_compiler',
    status: compilerResult.status,
    input_bytes: compilerInputBytes,
    output_bytes: compilerOutputBytes,
    duration_s: Math.round((compilerResult.duration_ms ?? 0) / 1000),
    used_pack_sections: packedSectionsFromSlice(compilerSlice),
    missing_pack_sections: missingSectionsFromPack(pack, packedSectionsFromSlice(compilerSlice)),
    data_gaps: extractDataGaps(compilerResult.output_parsed),
    phase: 2,
    error: compilerResult.error,
    parsed: compilerResult.output_parsed,
  });
  if (compilerResult.status === 'completed' && compilerResult.output_parsed) stepParsed['ss_signal_compiler'] = compilerResult.output_parsed;
  console.log(`   ⏹ ss_signal_compiler  status=${compilerResult.status}  dur=${Math.round((compilerResult.duration_ms ?? 0) / 1000)}s  output_bytes=${compilerOutputBytes}` + (compilerResult.error ? `  err=${String(compilerResult.error).slice(0, 100)}` : ''));
  console.log(`   phase 2 done in ${Date.now() - phase2Started}ms`);
  console.log('');

  // ---------- Phase 3: contradiction_flag ----------
  console.log(`▶ PHASE 3  ss_contradiction_flag (sequential LLM)`);
  const contraSlice = packForSubAgent('ss_contradiction_flag', pack) as Record<string, unknown>;
  if (stepParsed['ss_signal_compiler']) contraSlice['previous_signal_map'] = stepParsed['ss_signal_compiler'];
  const contraTask: SubAgentTask = {
    sub_agent_id: 'ss_contradiction_flag',
    parent_session_id: harnessSessionId,
    parent_run_id: harnessRunId,
    parent_agent_id: 'strategic_synthesis',
    task_description: 'S11 BENCHMARK Phase 3: contradiction_flag',
    task_inputs: contraSlice,
  };
  const phase3Started = Date.now();
  const [contraResult] = await dispatchSubAgents([contraTask], 'sequential', accumulatedContext);
  const contraInputBytes = JSON.stringify(contraSlice).length;
  const contraOutputBytes = (contraResult.output ?? '').length;
  reports.push({
    sub_agent_id: 'ss_contradiction_flag',
    status: contraResult.status,
    input_bytes: contraInputBytes,
    output_bytes: contraOutputBytes,
    duration_s: Math.round((contraResult.duration_ms ?? 0) / 1000),
    used_pack_sections: packedSectionsFromSlice(contraSlice),
    missing_pack_sections: missingSectionsFromPack(pack, packedSectionsFromSlice(contraSlice)),
    data_gaps: extractDataGaps(contraResult.output_parsed),
    phase: 3,
    error: contraResult.error,
    parsed: contraResult.output_parsed,
  });
  if (contraResult.status === 'completed' && contraResult.output_parsed) stepParsed['ss_contradiction_flag'] = contraResult.output_parsed;
  console.log(`   ⏹ ss_contradiction_flag  status=${contraResult.status}  dur=${Math.round((contraResult.duration_ms ?? 0) / 1000)}s  output_bytes=${contraOutputBytes}` + (contraResult.error ? `  err=${String(contraResult.error).slice(0, 100)}` : ''));
  console.log(`   phase 3 done in ${Date.now() - phase3Started}ms`);
  console.log('');

  // ---------- Phase 4: thesis_writer ----------
  console.log(`▶ PHASE 4  ss_thesis_writer (sequential LLM)`);
  const thesisSlice = packForSubAgent('ss_thesis_writer', pack) as Record<string, unknown>;
  if (stepParsed['ss_signal_compiler']) thesisSlice['previous_signal_map'] = stepParsed['ss_signal_compiler'];
  if (stepParsed['ss_contradiction_flag']) thesisSlice['previous_contradictions'] = stepParsed['ss_contradiction_flag'];
  const thesisTask: SubAgentTask = {
    sub_agent_id: 'ss_thesis_writer',
    parent_session_id: harnessSessionId,
    parent_run_id: harnessRunId,
    parent_agent_id: 'strategic_synthesis',
    task_description: 'S11 BENCHMARK Phase 4: thesis_writer',
    task_inputs: thesisSlice,
  };
  const phase4Started = Date.now();
  const [thesisResult] = await dispatchSubAgents([thesisTask], 'sequential', accumulatedContext);
  const thesisInputBytes = JSON.stringify(thesisSlice).length;
  const thesisOutputBytes = (thesisResult.output ?? '').length;
  reports.push({
    sub_agent_id: 'ss_thesis_writer',
    status: thesisResult.status,
    input_bytes: thesisInputBytes,
    output_bytes: thesisOutputBytes,
    duration_s: Math.round((thesisResult.duration_ms ?? 0) / 1000),
    used_pack_sections: packedSectionsFromSlice(thesisSlice),
    missing_pack_sections: missingSectionsFromPack(pack, packedSectionsFromSlice(thesisSlice)),
    data_gaps: extractDataGaps(thesisResult.output_parsed),
    phase: 4,
    error: thesisResult.error,
    parsed: thesisResult.output_parsed,
  });
  console.log(`   ⏹ ss_thesis_writer  status=${thesisResult.status}  dur=${Math.round((thesisResult.duration_ms ?? 0) / 1000)}s  output_bytes=${thesisOutputBytes}` + (thesisResult.error ? `  err=${String(thesisResult.error).slice(0, 100)}` : ''));
  console.log(`   phase 4 done in ${Date.now() - phase4Started}ms`);
  console.log('');

  const totalSec = Math.round((Date.now() - startedAt) / 1000);
  const completed = reports.filter((r) => r.status === 'completed').length;

  // ===== Per-step report =====
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`SUMMARY — ${completed}/${ALL_STEPS.length} sub-agents complete in ${totalSec}s`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  for (const r of reports) {
    console.log('');
    console.log(`  ${r.sub_agent_id}  (phase ${r.phase})`);
    console.log(`    status:                 ${r.status}`);
    console.log(`    input_bytes:            ${r.input_bytes}`);
    console.log(`    output_bytes:           ${r.output_bytes}`);
    console.log(`    duration:               ${r.duration_s}s`);
    console.log(`    used_pack_sections:     [${r.used_pack_sections.join(', ')}]`);
    console.log(`    missing_pack_sections:  [${r.missing_pack_sections.join(', ')}]`);
    console.log(`    data_gaps:              [${r.data_gaps.join(', ')}]`);
    if (r.error) console.log(`    error:                  ${String(r.error).slice(0, 200)}`);
  }

  // ===== Success criteria =====
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('SUCCESS CRITERIA (restructured chain)');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  validateCriteria(reports, pack);

  // Save artefact
  const fs = await import('node:fs');
  const artefactDir = path.join(__dirname, '..', 'data', 'benchmark-s11');
  if (!fs.existsSync(artefactDir)) fs.mkdirSync(artefactDir, { recursive: true });
  const tag = stripValuation ? '_stripval' : '';
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const artefact = path.join(artefactDir, `s11v2_${sess.ticker}_${sess.id}${tag}_${ts}.json`);
  fs.writeFileSync(artefact, JSON.stringify({ session_id: sess.id, ticker: sess.ticker, strip_valuation: stripValuation, pack_summary: { bytes: packBytes, ...packCounts(pack) }, reports }, null, 2));
  console.log('');
  console.log(`[harness] artefact saved: ${path.relative(process.cwd(), artefact)}`);
}

function validateCriteria(reports: StepReport[], pack: CompactSummaryPack): void {
  const finExt = reports.find((r) => r.sub_agent_id === 'ss_financial_signal_extractor');
  const evtExt = reports.find((r) => r.sub_agent_id === 'ss_event_signal_extractor');
  const macExt = reports.find((r) => r.sub_agent_id === 'ss_macro_signal_extractor');
  const compiler = reports.find((r) => r.sub_agent_id === 'ss_signal_compiler');
  const cf = reports.find((r) => r.sub_agent_id === 'ss_contradiction_flag');
  const tw = reports.find((r) => r.sub_agent_id === 'ss_thesis_writer');

  const out: Array<[string, boolean, string]> = [];

  // C1: signal layer (Phase 1+2) all complete — deterministic, no provider variance
  const signalLayerComplete = [finExt, evtExt, macExt, compiler].every((r) => r?.status === 'completed');
  out.push(['signal layer complete (3 extractors + compiler)', signalLayerComplete,
    [finExt, evtExt, macExt, compiler].map((r) => `${r?.sub_agent_id}=${r?.status}`).join(' ')]);

  // C2: no provider_hang anywhere
  const noHang = reports.every((r) => !(r.error && /provider_hang/i.test(r.error)));
  out.push(['no provider_hang anywhere', noHang, noHang ? 'all phases hang-free' : 'provider_hang detected']);

  // C3: signal_map non-empty (compiler output signals[] >= 3)
  let sigCount = 0;
  let holdingCount = 0;
  let smOk = false;
  if (compiler?.parsed && typeof compiler.parsed === 'object') {
    const obj = compiler.parsed as any;
    sigCount = Array.isArray(obj.signals) ? obj.signals.length : 0;
    holdingCount = Array.isArray(obj.holding_signals) ? obj.holding_signals.length : 0;
    smOk = sigCount >= 3;
  }
  out.push(['signal_map non-empty (compiler signals >= 3)', smOk, `signals=${sigCount} holding_signals=${holdingCount}`]);

  // C4: holding signals present when is_holding=true
  let holdingOk = false;
  if (compiler?.parsed && typeof compiler.parsed === 'object') {
    const obj = compiler.parsed as any;
    if (obj.is_holding) {
      holdingOk = obj?.data_quality?.holding_override_applied === true && holdingCount > 0;
    } else {
      holdingOk = true; // not a holding, no requirement
    }
  }
  out.push(['holding signals present when is_holding=true', holdingOk, `is_holding=${(compiler?.parsed as any)?.is_holding} override=${(compiler?.parsed as any)?.data_quality?.holding_override_applied} holding_signals=${holdingCount}`]);

  // C5: contradiction_flag consumed signal_map
  let cfOk = false;
  let contraCount = 0;
  let weakCount = 0;
  if (cf?.parsed && typeof cf.parsed === 'object') {
    const obj = cf.parsed as any;
    contraCount = Array.isArray(obj.contradictions) ? obj.contradictions.length : 0;
    weakCount = Array.isArray(obj.weak_evidence_flags) ? obj.weak_evidence_flags.length : 0;
    const sawSignals = obj?.data_quality?.signal_map_used === true && (obj?.data_quality?.signal_count_seen ?? 0) >= 3;
    cfOk = sawSignals && contraCount + weakCount >= 1;
  }
  out.push(['contradiction_flag consumed signal_map', cfOk, `contradictions=${contraCount} weak_evidence=${weakCount} signals_seen=${(cf?.parsed as any)?.data_quality?.signal_count_seen}`]);

  // C6: thesis_writer no fake DCF when valuation gap
  let thesisNoFake = false;
  let convictionLevel = 'n/a';
  let valConfidence = 'n/a';
  let hasNumericTargets = false;
  if (tw?.parsed && typeof tw.parsed === 'object') {
    const obj = tw.parsed as any;
    valConfidence = obj?.valuation_anchor?.valuation_confidence ?? 'n/a';
    convictionLevel = obj?.recommendation?.conviction ?? 'n/a';
    const anchorBand = obj?.valuation_anchor?.target_band_try ?? {};
    const scenarios = obj?.scenarios ?? {};
    hasNumericTargets = (
      typeof anchorBand?.low === 'number' || typeof anchorBand?.mid === 'number' || typeof anchorBand?.high === 'number' ||
      typeof scenarios?.bear?.target_band_try?.low === 'number' || typeof scenarios?.bear?.target_band_try?.high === 'number' ||
      typeof scenarios?.base?.target_band_try?.low === 'number' || typeof scenarios?.base?.target_band_try?.high === 'number' ||
      typeof scenarios?.bull?.target_band_try?.low === 'number' || typeof scenarios?.bull?.target_band_try?.high === 'number'
    );
    const valGap = pack.top_valuation_outputs.length === 0 || stripValuation;
    if (valGap) {
      thesisNoFake = !hasNumericTargets && (valConfidence === 'limited' || valConfidence === 'missing');
    } else {
      thesisNoFake = true;
    }
  }
  out.push(['thesis_writer no fake DCF when valuation gap', thesisNoFake, `valuation_confidence=${valConfidence} numeric_targets=${hasNumericTargets} pack_val_count=${pack.top_valuation_outputs.length}${stripValuation ? ' (strip-valuation MODE)' : ''}`]);

  // C7: thesis usable
  let usable = false;
  if (tw?.parsed && typeof tw.parsed === 'object') {
    const obj = tw.parsed as any;
    const hasSummary = typeof obj.thesis_summary === 'string' && obj.thesis_summary.length > 200;
    const hasPillars = Array.isArray(obj?.thesis_pillars?.material_pillars) && obj.thesis_pillars.material_pillars.length >= 1;
    const hasRec = typeof obj?.recommendation?.action === 'string';
    const hasScenarios = obj?.scenarios?.bull && obj?.scenarios?.base && obj?.scenarios?.bear;
    usable = hasSummary && hasPillars && hasRec && hasScenarios;
  }
  out.push(['thesis usable (summary + pillars + recommendation + scenarios)', usable, '']);

  // C8: thesis_writer output ≤ 15KB hard cap
  const twBytes = tw?.output_bytes ?? 0;
  const twOk = twBytes > 0 && twBytes <= 15_000;
  out.push(['thesis_writer output ≤ 15KB hard cap', twOk, `${twBytes} bytes`]);

  // Print
  let allPass = true;
  for (const [name, pass, detail] of out) {
    const tag = pass ? '✅' : '❌';
    if (!pass) allPass = false;
    console.log(`  ${tag} ${name}`);
    if (detail) console.log(`        ${detail}`);
  }
  console.log('');
  console.log(allPass ? '🟢 ALL CRITERIA PASS — S11 PASS candidate' : '🔴 ONE OR MORE CRITERIA FAILED');
}

// =============================================================================
// Helpers
// =============================================================================

function packCounts(pack: CompactSummaryPack) {
  return {
    fin: pack.top_financial_insights.length,
    val: pack.top_valuation_outputs.length,
    sec: pack.top_sector_findings.length,
    mac: pack.top_macro_impacts.length,
    evt: pack.top_event_conclusions.length,
    contra: pack.unresolved_contradictions.length,
    cit: pack.citation_sensitive_facts.length,
  };
}
function packedSectionsFromSlice(slice: Record<string, unknown>): string[] {
  return PACK_SECTION_KEYS.filter((k) => Array.isArray(slice[k]) && (slice[k] as unknown[]).length > 0);
}
function missingSectionsFromPack(pack: CompactSummaryPack, used: string[]): string[] {
  const usedSet = new Set(used);
  return PACK_SECTION_KEYS.filter((k) => {
    const arr = (pack as unknown as Record<string, unknown[]>)[k];
    return Array.isArray(arr) && arr.length === 0 && !usedSet.has(k);
  });
}
function extractDataGaps(parsed: unknown): string[] {
  if (!parsed || typeof parsed !== 'object') return [];
  const obj = parsed as Record<string, unknown>;
  const gaps = obj['data_gaps'];
  if (!Array.isArray(gaps)) return [];
  return gaps.filter((g): g is string => typeof g === 'string').slice(0, 8);
}

run().catch((err) => {
  console.error('[harness] FATAL:', err);
  process.exit(2);
});
