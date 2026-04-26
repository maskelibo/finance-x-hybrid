/**
 * Shadow fan-out for valuation_agent (Part 2 / Block S, FAZ S7 → S12 restructure).
 *
 * 2026-04-26 S12 RESTRUCTURE: monolithic LLM val_dcf split to 4 sub-agents
 * (3 deterministic Python + 1 narrow LLM Sonnet) after %33 hang oranı on
 * KCHOL 3-run protocol (Run 1: 275s OK, Run 2: 686s OK, Run 3: 750s hang).
 *
 * Multi-phase chain:
 *
 *   Phase A (parallel — deterministic + 2 LLM):
 *     val_trading_comps       LLM Sonnet  — trading multiples (peer P/E, EV/EBITDA)
 *     val_sotp                LLM Sonnet  — sum-of-the-parts (holdings only)
 *     val_dcf_assumptions     deterministic Python — WACC + terminal_g
 *     val_dcf_projection      deterministic Python — 5Y FCF projection
 *
 *   Phase B (sequential — deterministic):
 *     val_dcf_terminal  receives previous_assumptions + previous_projection
 *
 *   Phase C (sequential — narrow LLM):
 *     val_dcf_synthesizer  receives all 3 dcf chain outputs (no raw upstream)
 *
 *   Phase D (sequential — LLM):
 *     val_scenario_builder  receives all valuation outputs as compiled context
 *
 * Aggregator (compileValuation) validates:
 *   - DCF chain consistency (wacc > g, ev = pv_explicit + pv_terminal)
 *   - Sub-agent failure tolerance (compiles available outputs, marks failures)
 *
 * Per-sub-agent timeout isolation enforced via yml timeout_ms (det=30s, LLM scope-sized).
 */

import {
  SUBAGENT_VALUATION_ENABLED,
  SUBAGENT_SHADOW_MODE,
} from '../../config.js';
import { dispatchSubAgents } from '../../sub-agents/dispatcher.js';
import type { SubAgentResult, SubAgentTask } from '../../sub-agents/types.js';
// P1.beta — truth-layer methodology hint for val_scenario_builder (advisory)
// P2.alpha — methodology mismatch guard imported from same module
import {
  readTruthAssertions,
  populateTruthAssertions,
  assertMethodologyAlignment,
} from '../../truth-layer/preflight.js';
import type { TruthAssertions } from '../../truth-layer/types.js';

type PhaseAStep = 'val_trading_comps' | 'val_sotp' | 'val_dcf_assumptions' | 'val_dcf_projection';
const PHASE_A: PhaseAStep[] = ['val_trading_comps', 'val_sotp', 'val_dcf_assumptions', 'val_dcf_projection'];

export function valuationShadowActive(): boolean {
  return SUBAGENT_SHADOW_MODE || SUBAGENT_VALUATION_ENABLED;
}

export function fireValuationShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): void {
  if (!valuationShadowActive()) return;
  void runShadow(sessionId, runId, ticker, accumulatedContext).catch((err) => {
    console.warn(`[shadow] valuation_agent sub-agents failed: ${errMsg(err)}`);
  });
}

async function runShadow(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<void> {
  // Parse upstream JSON outputs ONCE in TS — extract small structured fields
  // for the deterministic Python modules. Raw upstream strings (42KB+) cannot
  // be passed as argv[1] on Windows (cmd line limit ~32K).
  const fa = parseUpstreamJson(accumulatedContext['financial_analysis_output']);
  const macro = parseUpstreamJson(accumulatedContext['macro_analysis_output']);
  const faCanonical = (fa as any)?.canonical_numbers ?? null;
  const macroRates = (macro as any)?.rates ?? null;
  const macroInflation = (macro as any)?.inflation ?? null;
  const netDebtFromFa =
    (faCanonical as any)?.net_debt ?? (faCanonical as any)?.total_debt ?? null;

  // Inputs for LLM sub-agents (val_trading_comps, val_sotp, val_scenario_builder)
  // — they DO need raw upstream context for narrative work; LLM path goes
  // through buildSubAgentPrompt which accepts large text via context, NOT argv.
  const llmBaseInputs: Record<string, unknown> = {
    ticker,
    sector: accumulatedContext['sector'] ?? null,
    current_price_try: accumulatedContext['current_price'] ?? null,
    market_cap_try_mn: accumulatedContext['market_cap_try_mn'] ?? null,
    shares_outstanding_mn: accumulatedContext['shares_outstanding_mn'] ?? null,
    financial_analysis_output: accumulatedContext['financial_analysis_output'] ?? null,
    macro_analysis_output: accumulatedContext['macro_analysis_output'] ?? null,
    sector_competition_output: accumulatedContext['sector_competition_output'] ?? null,
    fact_pack: accumulatedContext['fact_pack'] ?? null,
  };

  // Inputs for deterministic Python sub-agents — small pre-parsed fields only.
  const detBaseInputs: Record<string, unknown> = {
    ticker,
    sector: accumulatedContext['sector'] ?? null,
    fa_canonical_numbers: faCanonical,
    macro_rates: macroRates,
    macro_inflation: macroInflation,
  };

  const startedAt = Date.now();
  const stepResults: Record<string, SubAgentResult> = {};
  const stepParsed: Record<string, unknown> = {};

  // ---------- Phase A ----------
  console.log(`[shadow:valuation_agent] phase A — ${PHASE_A.length} sub-agents in parallel`);
  const phaseATasks: SubAgentTask[] = PHASE_A.map((subId) => {
    // Deterministic modules get tiny pre-parsed inputs; LLM modules get the full base.
    const isDet = subId === 'val_dcf_assumptions' || subId === 'val_dcf_projection';
    return {
      sub_agent_id: subId,
      parent_session_id: sessionId,
      parent_run_id: runId,
      parent_agent_id: 'valuation_agent',
      task_description: `S7/S12 valuation Phase A: ${subId}`,
      task_inputs: isDet ? detBaseInputs : llmBaseInputs,
    };
  });
  const phaseAStart = Date.now();
  const phaseAResults = await dispatchSubAgents(phaseATasks, 'parallel', accumulatedContext);
  for (const r of phaseAResults) {
    stepResults[r.sub_agent_id] = r;
    if (r.status === 'completed' && r.output_parsed) stepParsed[r.sub_agent_id] = r.output_parsed;
    logStep('phaseA', r);
  }
  console.log(`[shadow:valuation_agent] phase A done in ${Date.now() - phaseAStart}ms`);

  // ---------- Phase B: val_dcf_terminal ----------
  const terminalInputs: Record<string, unknown> = {
    ticker,
    shares_outstanding_mn: accumulatedContext['shares_outstanding_mn'] ?? null,
    net_debt_try_mn: netDebtFromFa,
  };
  if (stepParsed['val_dcf_assumptions']) terminalInputs['previous_assumptions'] = stepParsed['val_dcf_assumptions'];
  if (stepParsed['val_dcf_projection']) terminalInputs['previous_projection'] = stepParsed['val_dcf_projection'];

  console.log(`[shadow:valuation_agent] phase B — val_dcf_terminal`);
  const terminalTask: SubAgentTask = {
    sub_agent_id: 'val_dcf_terminal',
    parent_session_id: sessionId,
    parent_run_id: runId,
    parent_agent_id: 'valuation_agent',
    task_description: 'S12 valuation Phase B: val_dcf_terminal',
    task_inputs: terminalInputs,
  };
  const phaseBStart = Date.now();
  const [terminalResult] = await dispatchSubAgents([terminalTask], 'sequential', accumulatedContext);
  stepResults['val_dcf_terminal'] = terminalResult;
  if (terminalResult.status === 'completed' && terminalResult.output_parsed) {
    stepParsed['val_dcf_terminal'] = terminalResult.output_parsed;
  }
  logStep('phaseB', terminalResult);
  console.log(`[shadow:valuation_agent] phase B done in ${Date.now() - phaseBStart}ms`);

  // ---------- Phase C: val_dcf_synthesizer ----------
  const synthInputs: Record<string, unknown> = {
    ticker,
    current_price_try: accumulatedContext['current_price'] ?? null,
    previous_assumptions: stepParsed['val_dcf_assumptions'] ?? null,
    previous_projection: stepParsed['val_dcf_projection'] ?? null,
    previous_terminal: stepParsed['val_dcf_terminal'] ?? null,
  };
  console.log(`[shadow:valuation_agent] phase C — val_dcf_synthesizer (narrow LLM)`);
  const synthTask: SubAgentTask = {
    sub_agent_id: 'val_dcf_synthesizer',
    parent_session_id: sessionId,
    parent_run_id: runId,
    parent_agent_id: 'valuation_agent',
    task_description: 'S12 valuation Phase C: val_dcf_synthesizer',
    task_inputs: synthInputs,
  };
  const phaseCStart = Date.now();
  const [synthResult] = await dispatchSubAgents([synthTask], 'sequential', accumulatedContext);
  stepResults['val_dcf_synthesizer'] = synthResult;
  if (synthResult.status === 'completed' && synthResult.output_parsed) {
    stepParsed['val_dcf_synthesizer'] = synthResult.output_parsed;
  }
  logStep('phaseC', synthResult);
  console.log(`[shadow:valuation_agent] phase C done in ${Date.now() - phaseCStart}ms`);

  // ---------- Phase D: val_scenario_builder ----------
  // Receives compiled valuation context (all prior outputs) so it can blend
  // DCF / comps / SOTP into Bull/Base/Bear weighted target.
  // P1.beta: also receives truth-layer methodology hint (advisory — LLM may
  // or may not consume; sub-agent prompt/schema are unchanged). The hint
  // surfaces FTL-recommended weights so the LLM can prefer the right method
  // mix for holding/banking/regular tickers.
  let truthAssertions: TruthAssertions | null = readTruthAssertions(accumulatedContext);
  if (!truthAssertions) {
    try { truthAssertions = populateTruthAssertions(ticker, accumulatedContext); } catch { /* ignore */ }
  }
  const truthHint = truthAssertions ? {
    classification: {
      sector_canonical: truthAssertions.classification.sector_canonical,
      is_holding: truthAssertions.classification.is_holding,
      is_banking: truthAssertions.classification.is_banking,
      sub_classifications: truthAssertions.classification.sub_classifications,
      confidence: truthAssertions.classification.confidence,
    },
    primary_method: truthAssertions.valuation_methodology.primary_method,
    recommended_weights: truthAssertions.valuation_methodology.weights,
    secondary_methods: truthAssertions.valuation_methodology.secondary_methods,
    inappropriate_methods: truthAssertions.valuation_methodology.inappropriate_methods,
    justification: truthAssertions.valuation_methodology.justification,
    advisory_only: true,
  } : null;

  const scenarioInputs: Record<string, unknown> = {
    ...llmBaseInputs,
    val_trading_comps: stepParsed['val_trading_comps'] ?? null,
    val_sotp: stepParsed['val_sotp'] ?? null,
    val_dcf_assumptions: stepParsed['val_dcf_assumptions'] ?? null,
    val_dcf_projection: stepParsed['val_dcf_projection'] ?? null,
    val_dcf_terminal: stepParsed['val_dcf_terminal'] ?? null,
    val_dcf_synthesizer: stepParsed['val_dcf_synthesizer'] ?? null,
    truth_layer_methodology_hint: truthHint,
  };
  console.log(`[shadow:valuation_agent] phase D — val_scenario_builder`);
  const scenarioTask: SubAgentTask = {
    sub_agent_id: 'val_scenario_builder',
    parent_session_id: sessionId,
    parent_run_id: runId,
    parent_agent_id: 'valuation_agent',
    task_description: 'S7 valuation Phase D: val_scenario_builder',
    task_inputs: scenarioInputs,
  };
  const phaseDStart = Date.now();
  const [scenarioResult] = await dispatchSubAgents([scenarioTask], 'sequential', accumulatedContext);
  stepResults['val_scenario_builder'] = scenarioResult;
  logStep('phaseD', scenarioResult);
  console.log(`[shadow:valuation_agent] phase D done in ${Date.now() - phaseDStart}ms`);

  // ---------- Aggregator validation ----------
  const validation = validateValDcfChain(stepParsed);
  if (validation.warnings.length > 0) {
    console.warn(
      `[shadow:valuation_agent] aggregator warnings: ${validation.warnings.join('; ')}`,
    );
  }

  // P2.alpha — methodology mismatch guard (advisory observation; no override).
  // Always logs aligned=true|false plus severity tier so silent FTL→consumer
  // divergence is observable. Replaces the simpler P1.beta divergence-only
  // warning. The LLM output is NOT mutated — guard is read-only.
  const scenarioOutput = stepParsed['val_scenario_builder'] as Record<string, unknown> | undefined;
  const llmPrimary = scenarioOutput
    ? ((scenarioOutput['primary_method'] ?? scenarioOutput['recommended_method'] ?? null) as
        | string
        | null)
    : null;
  const alignment = assertMethodologyAlignment(accumulatedContext, llmPrimary);
  if (alignment) {
    if (alignment.aligned) {
      console.log(
        `[truth-layer:methodology-guard] ticker=${alignment.ticker} aligned=true ` +
          `expected=${alignment.expected_method} chosen=${alignment.chosen_method} ` +
          `class=${alignment.classification_label}`,
      );
    } else {
      console.warn(
        `[truth-layer:methodology-guard] ticker=${alignment.ticker} aligned=false ` +
          `severity=${alignment.severity} expected=${alignment.expected_method} ` +
          `chosen=${alignment.chosen_method ?? '<unknown>'} class=${alignment.classification_label} — ` +
          `${alignment.reasoning}`,
      );
    }
  }

  const totalMs = Date.now() - startedAt;
  const allSubAgents = [...PHASE_A, 'val_dcf_terminal', 'val_dcf_synthesizer', 'val_scenario_builder'];
  const completed = allSubAgents.filter((id) => stepResults[id]?.status === 'completed').length;
  console.log(
    `[shadow:valuation_agent] done ${completed}/${allSubAgents.length} sub-agents in ${Math.round(totalMs / 1000)}s — composite_quality=${(completed / allSubAgents.length).toFixed(2)}`,
  );
}

// =============================================================================
// Aggregator validation — rejects inconsistent DCF chain outputs (S12 spec)
// =============================================================================

function validateValDcfChain(parsed: Record<string, unknown>): { warnings: string[] } {
  const warnings: string[] = [];
  const assumptions = parsed['val_dcf_assumptions'] as any;
  const terminal = parsed['val_dcf_terminal'] as any;
  const synth = parsed['val_dcf_synthesizer'] as any;

  if (assumptions?.wacc_components?.wacc_pct != null && assumptions?.terminal_growth_pct != null) {
    const spread = assumptions.wacc_components.wacc_pct - assumptions.terminal_growth_pct;
    if (spread < 0.5) {
      warnings.push(`wacc-g spread ${spread.toFixed(2)}pp too tight (TV undefined zone)`);
    }
  }

  if (terminal) {
    const ev = Number(terminal.enterprise_value_try_mn);
    const pvE = Number(terminal.pv_explicit_try_mn);
    const pvT = Number(terminal.pv_terminal_try_mn);
    if (Number.isFinite(ev) && Number.isFinite(pvE) && Number.isFinite(pvT)) {
      const expected = pvE + pvT;
      if (Math.abs(ev - expected) > Math.max(1, Math.abs(expected) * 0.001)) {
        warnings.push(`ev mismatch: ev=${ev.toFixed(2)} pv_explicit+pv_terminal=${expected.toFixed(2)}`);
      }
    }
    if (Array.isArray(terminal.consistency_warnings)) {
      for (const w of terminal.consistency_warnings) warnings.push(`terminal: ${w}`);
    }
  }

  if (synth) {
    // synthesizer must not emit final_target_try if terminal returned null
    const synthTarget = synth.final_target_try;
    const terminalTarget = terminal?.implied_share_price_try;
    if (synthTarget != null && terminalTarget == null) {
      warnings.push('synthesizer emitted final_target while terminal=null (no-fake-DCF violation)');
    }
    // synthesizer must not override terminal's number
    if (synthTarget != null && terminalTarget != null) {
      const drift = Math.abs(synthTarget - terminalTarget) / Math.max(1, Math.abs(terminalTarget));
      if (drift > 0.001) {
        warnings.push(`synthesizer target_try drifts from terminal (${synthTarget} vs ${terminalTarget})`);
      }
    }
  }

  return { warnings };
}

// =============================================================================
// Helpers
// =============================================================================

function logStep(phase: string, r: SubAgentResult): void {
  const bytes = (r.output ?? '').length;
  console.log(
    `[shadow:valuation_agent] ${phase}/${r.sub_agent_id} status=${r.status} dur=${Math.round((r.duration_ms ?? 0) / 1000)}s bytes=${bytes}` +
      (r.error ? ` err=${String(r.error).slice(0, 140)}` : ''),
  );
}

function errMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return String(err);
}

function parseUpstreamJson(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed); } catch { /* fall through */ }
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]); } catch { /* swallow */ }
  }
  return null;
}
