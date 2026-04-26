/**
 * Shadow fan-out for strategic_synthesis (Part 2 / Block S, FAZ S11).
 *
 * 2026-04-26 RESTRUCTURE: signal layer split from a single LLM (ss_signal_merger
 * — Sonnet, %67 hang oranı KCHOL benchmark) into 4 deterministic Python
 * sub-agents to eliminate provider variance from the chain head.
 *
 * Hybrid 4-phase pipeline:
 *
 *   Phase 1 (parallel, deterministic Python):
 *     ss_financial_signal_extractor   pack.top_financial_insights → sig_fin_*
 *     ss_event_signal_extractor       pack.top_event_conclusions → sig_evt_*
 *     ss_macro_signal_extractor       pack.top_macro_impacts → sig_mac_*
 *
 *   Phase 2 (sequential, deterministic Python):
 *     ss_signal_compiler  3 extractor + pack base → canonical signal_map +
 *                         holding_signals + valuation/sector data_quality
 *
 *   Phase 3 (sequential, LLM Sonnet):
 *     ss_contradiction_flag  receives previous_signal_map (compiler output)
 *
 *   Phase 4 (sequential, LLM Sonnet):
 *     ss_thesis_writer       receives previous_signal_map +
 *                            previous_contradictions
 *
 * Failure isolation:
 *   - One Phase 1 extractor failing does NOT abort the chain. Compiler is
 *     tolerant: missing previous_*_signals → []; data_quality.extractor_status
 *     marks the failed extractor; data_gaps lists the absence.
 *   - Phase 2 compiler failure breaks chain BUT contradiction_flag and
 *     thesis_writer can still run with no previous_signal_map (graceful
 *     degradation, see prior runs 2/3).
 *   - Phase 3/4 LLM hang risk addressed by S11 fix-pack (run 2 + run 3
 *     verified 2/2 PASS).
 *
 * Per-step metric log: input_bytes, output_bytes, duration_ms,
 * used_pack_sections, missing_pack_sections, data_gaps.
 */

import {
  SUBAGENT_STRATEGIC_SYNTHESIS_ENABLED,
  SUBAGENT_SHADOW_MODE,
} from '../../config.js';
import { dispatchSubAgents } from '../../sub-agents/dispatcher.js';
import { buildCompactSummaryPack, packForSubAgent, type CompactSummaryPack } from '../../sub-agents/compact_summary_pack.js';
import type { SubAgentResult, SubAgentTask } from '../../sub-agents/types.js';

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

export function strategicSynthesisShadowActive(): boolean {
  return SUBAGENT_SHADOW_MODE || SUBAGENT_STRATEGIC_SYNTHESIS_ENABLED;
}

export function fireStrategicSynthesisShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): void {
  if (!strategicSynthesisShadowActive()) return;
  void runShadow(sessionId, runId, ticker, accumulatedContext).catch((err) => {
    console.warn(`[shadow] strategic_synthesis sub-agents failed: ${errMsg(err)}`);
  });
}

async function runShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<void> {
  const pack = buildCompactSummaryPack(accumulatedContext);
  const packBytes = JSON.stringify(pack).length;
  const populated = packPopulationSummary(pack);
  console.log(
    `[shadow:strategic_synthesis] compact_pack — ticker=${pack.ticker} sector=${pack.sector ?? '-'} is_holding=${pack.is_holding} total=${Math.round(packBytes / 1024)}KB ${populated.summary}`,
  );

  const startedAt = Date.now();
  const stepResults: Record<string, SubAgentResult> = {};
  const stepParsed: Record<string, unknown> = {};

  // -------- Phase 1: 3 extractors in parallel --------
  const phase1Tasks: SubAgentTask[] = PHASE1.map((subId) => {
    const slice = packForSubAgent(subId, pack) as Record<string, unknown>;
    return {
      sub_agent_id: subId,
      parent_session_id: sessionId,
      parent_run_id: runId,
      parent_agent_id: 'strategic_synthesis',
      task_description: `S11 Phase 1 (parallel deterministic): ${subId}`,
      task_inputs: slice,
    };
  });

  console.log(`[shadow:strategic_synthesis] phase 1 — 3 deterministic extractors in parallel`);
  const phase1Started = Date.now();
  const phase1Results = await dispatchSubAgents(phase1Tasks, 'parallel', accumulatedContext);
  for (const r of phase1Results) {
    stepResults[r.sub_agent_id] = r;
    if (r.status === 'completed' && r.output_parsed) {
      stepParsed[r.sub_agent_id] = r.output_parsed;
    }
    logStepResult(r, phase1Tasks.find((t) => t.sub_agent_id === r.sub_agent_id)?.task_inputs ?? {});
  }
  const phase1Ms = Date.now() - phase1Started;
  console.log(`[shadow:strategic_synthesis] phase 1 done in ${phase1Ms}ms`);

  // -------- Phase 2: signal_compiler --------
  const compilerSlice = packForSubAgent('ss_signal_compiler', pack) as Record<string, unknown>;
  if (stepParsed['ss_financial_signal_extractor']) {
    compilerSlice['previous_financial_signals'] = stepParsed['ss_financial_signal_extractor'];
  }
  if (stepParsed['ss_event_signal_extractor']) {
    compilerSlice['previous_event_signals'] = stepParsed['ss_event_signal_extractor'];
  }
  if (stepParsed['ss_macro_signal_extractor']) {
    compilerSlice['previous_macro_signals'] = stepParsed['ss_macro_signal_extractor'];
  }

  console.log(`[shadow:strategic_synthesis] phase 2 — signal_compiler`);
  const compilerTask: SubAgentTask = {
    sub_agent_id: 'ss_signal_compiler',
    parent_session_id: sessionId,
    parent_run_id: runId,
    parent_agent_id: 'strategic_synthesis',
    task_description: 'S11 Phase 2 (sequential deterministic): compile canonical signal_map',
    task_inputs: compilerSlice,
  };
  const phase2Started = Date.now();
  const [compilerResult] = await dispatchSubAgents([compilerTask], 'sequential', accumulatedContext);
  stepResults['ss_signal_compiler'] = compilerResult;
  if (compilerResult.status === 'completed' && compilerResult.output_parsed) {
    stepParsed['ss_signal_compiler'] = compilerResult.output_parsed;
  }
  logStepResult(compilerResult, compilerSlice);
  console.log(`[shadow:strategic_synthesis] phase 2 done in ${Date.now() - phase2Started}ms`);

  // -------- Phase 3: contradiction_flag --------
  const contradictionSlice = packForSubAgent('ss_contradiction_flag', pack) as Record<string, unknown>;
  if (stepParsed['ss_signal_compiler']) {
    // Compiler output IS the canonical signal_map (same shape as legacy
    // ss_signal_merger output) — inject as previous_signal_map.
    contradictionSlice['previous_signal_map'] = stepParsed['ss_signal_compiler'];
  }
  console.log(`[shadow:strategic_synthesis] phase 3 — contradiction_flag`);
  const contradictionTask: SubAgentTask = {
    sub_agent_id: 'ss_contradiction_flag',
    parent_session_id: sessionId,
    parent_run_id: runId,
    parent_agent_id: 'strategic_synthesis',
    task_description: 'S11 Phase 3 (sequential LLM): contradiction_flag',
    task_inputs: contradictionSlice,
  };
  const phase3Started = Date.now();
  const [contraResult] = await dispatchSubAgents([contradictionTask], 'sequential', accumulatedContext);
  stepResults['ss_contradiction_flag'] = contraResult;
  if (contraResult.status === 'completed' && contraResult.output_parsed) {
    stepParsed['ss_contradiction_flag'] = contraResult.output_parsed;
  }
  logStepResult(contraResult, contradictionSlice);
  console.log(`[shadow:strategic_synthesis] phase 3 done in ${Date.now() - phase3Started}ms`);

  // -------- Phase 4: thesis_writer --------
  const thesisSlice = packForSubAgent('ss_thesis_writer', pack) as Record<string, unknown>;
  if (stepParsed['ss_signal_compiler']) thesisSlice['previous_signal_map'] = stepParsed['ss_signal_compiler'];
  if (stepParsed['ss_contradiction_flag']) thesisSlice['previous_contradictions'] = stepParsed['ss_contradiction_flag'];
  console.log(`[shadow:strategic_synthesis] phase 4 — thesis_writer`);
  const thesisTask: SubAgentTask = {
    sub_agent_id: 'ss_thesis_writer',
    parent_session_id: sessionId,
    parent_run_id: runId,
    parent_agent_id: 'strategic_synthesis',
    task_description: 'S11 Phase 4 (sequential LLM): thesis_writer',
    task_inputs: thesisSlice,
  };
  const phase4Started = Date.now();
  const [thesisResult] = await dispatchSubAgents([thesisTask], 'sequential', accumulatedContext);
  stepResults['ss_thesis_writer'] = thesisResult;
  logStepResult(thesisResult, thesisSlice);
  console.log(`[shadow:strategic_synthesis] phase 4 done in ${Date.now() - phase4Started}ms`);

  const totalMs = Date.now() - startedAt;
  const subAgents: AnyStep[] = [...PHASE1, 'ss_signal_compiler', 'ss_contradiction_flag', 'ss_thesis_writer'];
  const completed = subAgents.filter((id) => stepResults[id]?.status === 'completed').length;
  console.log(
    `[shadow:strategic_synthesis] done ${completed}/${subAgents.length} sub-agents in ${Math.round(totalMs / 1000)}s — composite_quality=${(completed / subAgents.length).toFixed(2)}`,
  );
}

// =============================================================================
// Helpers
// =============================================================================

function logStepResult(result: SubAgentResult, taskInputs: Record<string, unknown>): void {
  const inputBytes = JSON.stringify(taskInputs).length;
  const outputBytes = (result.output ?? '').length;
  const dataGaps = extractDataGaps(result.output_parsed);
  console.log(
    `[shadow:strategic_synthesis] ${result.sub_agent_id} status=${result.status} ` +
      `dur=${Math.round((result.duration_ms ?? 0) / 1000)}s input_bytes=${inputBytes} output_bytes=${outputBytes} ` +
      `data_gaps=[${dataGaps.join(',')}]` +
      (result.error ? ` err=${String(result.error).slice(0, 140)}` : ''),
  );
}

function packPopulationSummary(pack: CompactSummaryPack): { summary: string; populated: string[]; missing: string[] } {
  const sections: Array<[string, number]> = [
    ['fin', pack.top_financial_insights.length],
    ['val', pack.top_valuation_outputs.length],
    ['sec', pack.top_sector_findings.length],
    ['mac', pack.top_macro_impacts.length],
    ['evt', pack.top_event_conclusions.length],
    ['contra', pack.unresolved_contradictions.length],
    ['cit', pack.citation_sensitive_facts.length],
  ];
  const populated: string[] = [];
  const missing: string[] = [];
  const parts: string[] = [];
  for (const [k, n] of sections) {
    parts.push(`${k}=${n}`);
    if (n > 0) populated.push(k);
    else missing.push(k);
  }
  return { summary: `[${parts.join(' ')}]`, populated, missing };
}

function extractDataGaps(parsed: unknown): string[] {
  if (!parsed || typeof parsed !== 'object') return [];
  const obj = parsed as Record<string, unknown>;
  const gaps = obj['data_gaps'];
  if (!Array.isArray(gaps)) return [];
  return gaps.filter((g): g is string => typeof g === 'string').slice(0, 6);
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}
