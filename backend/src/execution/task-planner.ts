/**
 * Deterministic Task Planner (Block P — Plan P3B Wave 1).
 *
 * Standalone session-level planner that decides which agents/sub-agents should
 * run for a given session, in what order, with what predecessor requirements,
 * estimated cost, priority, and explicit reason codes. Aggregates per-call
 * preflight decisions (P3A) into a single deterministic TaskPlan.
 *
 * Wave 1 invariants:
 *   - Standalone: no orchestrator / agent-runner / sub-agent-runner wiring
 *   - Read-only: no DB writes; the optional `recordTaskPlan` adapter mutates
 *     only the caller-supplied accumulatedContext object
 *   - Deterministic: identical inputs → identical structural output (mod
 *     `generated_at`); topo sort uses Kahn's algorithm with alphabetical
 *     tie-break on TaskKind
 *   - Per-input read is defensively wrapped: a single sub-engine failure
 *     becomes a `warnings` entry; the planner never crashes
 *   - No LLM calls; no network / disk I/O beyond the read APIs of the
 *     consumed modules
 */

import { createHash } from 'node:crypto';
import { getCanonicalFactPackV2 } from '../fact-layer/pack-v2.js';
import { buildFactConfidenceSummary } from '../fact-layer/summary.js';
import { computeCoverageReport } from '../quality-os/coverage-engine.js';
import { detectContradictions } from '../quality-os/contradiction-engine.js';
import { detectCitationGaps } from '../quality-os/citation-enforcement.js';
import { computeQualityBudget } from '../quality-os/quality-budget.js';
import {
  runPreflight,
  type PreflightCallContext,
  type PreflightDecision,
} from './preflight.js';

// =============================================================================
// Frozen reason-code constants (exported for downstream callers)
// =============================================================================

export const PLAN_REASON_CODES = {
  PLAN_NO_FACTS: 'PLAN_NO_FACTS',
  PLAN_COVERAGE_GAP: 'PLAN_COVERAGE_GAP',
  PLAN_LOW_CONFIDENCE_PRESENT: 'PLAN_LOW_CONFIDENCE_PRESENT',
  PLAN_CRITICAL_CONTRADICTION: 'PLAN_CRITICAL_CONTRADICTION',
  PLAN_CITATION_GAP_CRITICAL: 'PLAN_CITATION_GAP_CRITICAL',
  PLAN_QUALITY_GREEN_READY_FOR_SYNTHESIS: 'PLAN_QUALITY_GREEN_READY_FOR_SYNTHESIS',
  PLAN_VALUATION_REQUESTED: 'PLAN_VALUATION_REQUESTED',
} as const;

export const SKIP_REASON_CODES = {
  SKIP_DUPLICATE_OUTPUT_PRESENT: 'SKIP_DUPLICATE_OUTPUT_PRESENT',
  SKIP_PREFLIGHT_ABORT: 'SKIP_PREFLIGHT_ABORT',
  SKIP_PREFLIGHT_DUPLICATION: 'SKIP_PREFLIGHT_DUPLICATION',
  SKIP_BLOCKED_BY_QUALITY: 'SKIP_BLOCKED_BY_QUALITY',
  SKIP_BUDGET_FORECAST_EXCEEDS_CAP: 'SKIP_BUDGET_FORECAST_EXCEEDS_CAP',
  SKIP_PREDECESSOR_FAILED: 'SKIP_PREDECESSOR_FAILED',
} as const;

export type PlanReasonCode = typeof PLAN_REASON_CODES[keyof typeof PLAN_REASON_CODES];
export type SkipReasonCode = typeof SKIP_REASON_CODES[keyof typeof SKIP_REASON_CODES];

// =============================================================================
// Task taxonomy
// =============================================================================

export type TaskKind =
  | 'parse_standardization'
  | 'financial_analysis'
  | 'macro_analysis'
  | 'reconciliation'
  | 'val_dcf'
  | 'val_scenario_builder'
  | 'strategic_synthesis'
  | 'chairman_anticipator_deterministic';

export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';

/** Predecessor DAG. parse_standardization is the root. */
const TASK_DAG: Record<TaskKind, TaskKind[]> = {
  parse_standardization: [],
  financial_analysis: ['parse_standardization'],
  macro_analysis: ['parse_standardization'],
  reconciliation: ['financial_analysis'],
  val_dcf: ['financial_analysis'],
  val_scenario_builder: ['val_dcf'],
  strategic_synthesis: ['financial_analysis', 'macro_analysis', 'reconciliation'],
  chairman_anticipator_deterministic: ['strategic_synthesis'],
};

/** Static per-task USD cost estimate (Wave 1 baseline; tunable later). */
const TASK_COST_USD: Record<TaskKind, number> = {
  parse_standardization: 0.20,
  financial_analysis: 0.40,
  macro_analysis: 0.30,
  reconciliation: 0.15,
  val_dcf: 0.80,
  val_scenario_builder: 0.50,
  strategic_synthesis: 0.60,
  chairman_anticipator_deterministic: 0.05,
};

/** Expected accumulated_context output keys per task. The FIRST element is
 *  the canonical marker the planner pre-checks; preflight V4 checks all of
 *  them. This split lets SKIP_DUPLICATE_OUTPUT_PRESENT and
 *  SKIP_PREFLIGHT_DUPLICATION fire on distinguishable conditions. */
const TASK_OUTPUTS: Record<TaskKind, string[]> = {
  parse_standardization: ['parse_standardization'],
  financial_analysis: ['financial_analysis'],
  macro_analysis: ['macro_analysis'],
  reconciliation: ['reconciliation'],
  val_dcf: ['val_dcf', 'val_dcf_output'],
  val_scenario_builder: ['val_scenario_builder', 'val_scenario_output'],
  strategic_synthesis: ['strategic_synthesis'],
  chairman_anticipator_deterministic: ['chairman_questions_deterministic'],
};

/** Tasks that depend on session-quality being green. When lifecycle is
 *  degraded or hold, these are short-circuited via SKIP_BLOCKED_BY_QUALITY. */
const QUALITY_BLOCKED_TASKS: ReadonlySet<TaskKind> = new Set<TaskKind>([
  'val_dcf',
  'val_scenario_builder',
  'strategic_synthesis',
  'chairman_anticipator_deterministic',
]);

const PLAN_REASON_PRIORITY: Record<PlanReasonCode, TaskPriority> = {
  PLAN_NO_FACTS: 'critical',
  PLAN_CRITICAL_CONTRADICTION: 'critical',
  PLAN_COVERAGE_GAP: 'high',
  PLAN_LOW_CONFIDENCE_PRESENT: 'high',
  PLAN_CITATION_GAP_CRITICAL: 'high',
  PLAN_QUALITY_GREEN_READY_FOR_SYNTHESIS: 'normal',
  PLAN_VALUATION_REQUESTED: 'normal',
};

const PRIORITY_ORDER: TaskPriority[] = ['low', 'normal', 'high', 'critical'];

const DEFAULT_BUDGET_CAP_USD = 5;

// =============================================================================
// Output types
// =============================================================================

export interface PlannedTask {
  task_id: string;
  kind: TaskKind;
  priority: TaskPriority;
  reason_codes: string[];
  required_predecessors: TaskKind[];
  expected_output_keys: string[];
  estimated_cost_usd: number;
  /** Pre-built so consumers can pass directly to runPreflight() pre-execution. */
  preflight_hint: PreflightCallContext;
}

export interface SkippedTask {
  task_id: string;
  kind: TaskKind;
  reason_codes: string[];
  details: string;
  preflight_decision_snapshot?: PreflightDecision;
}

export interface TaskPlan {
  session_id: string;
  ticker: string | null;
  generated_at: string;
  planned_tasks: PlannedTask[];
  skipped_tasks: SkippedTask[];
  /** Sum of `planned_tasks[*].estimated_cost_usd` only; skipped tasks excluded. */
  total_estimated_cost_usd: number;
  /** Sorted-unique union over both lists. */
  reason_codes: string[];
  warnings: string[];
}

export interface TaskPlannerOptions {
  /** Override; falls back to fact-pack ticker. */
  ticker?: string | null;
  /** The accumulated context the caller has built so far. Used both for the
   *  planner's own duplication pre-check and embedded into each preflight_hint. */
  accumulated_context?: Record<string, unknown>;
  /** USD already spent on this session (e.g. analysis_sessions.total_cost_usd).
   *  Forwarded to each preflight call as current_session_cost_usd. */
  current_session_cost_usd?: number;
  /** Session-cumulative cap. Defaults to 5. Used by both preflight V8 and the
   *  planner's own forecast check. */
  budget_cap_usd?: number;
  /** When true, enqueue val_dcf + val_scenario_builder under
   *  PLAN_VALUATION_REQUESTED. Defaults to false. */
  valuation_requested?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

function taskId(sessionId: string, kind: TaskKind): string {
  const h = createHash('sha1').update(`${sessionId}|${kind}`).digest('hex').slice(0, 12);
  return `tp-${kind}-${h}`;
}

function maxPriority(a: TaskPriority, b: TaskPriority): TaskPriority {
  return PRIORITY_ORDER.indexOf(a) >= PRIORITY_ORDER.indexOf(b) ? a : b;
}

function sortedUnique(values: ReadonlyArray<string>): string[] {
  return Array.from(new Set(values)).sort();
}

/** Kahn's topological sort over TASK_DAG, restricted to the candidate set. */
function topoSort(candidates: ReadonlyArray<TaskKind>): TaskKind[] {
  const set = new Set(candidates);
  const indeg = new Map<TaskKind, number>();
  for (const k of candidates) {
    const preds = TASK_DAG[k].filter((p) => set.has(p));
    indeg.set(k, preds.length);
  }
  const ready: TaskKind[] = candidates.filter((k) => (indeg.get(k) ?? 0) === 0);
  ready.sort(); // alphabetical tie-break
  const out: TaskKind[] = [];
  while (ready.length > 0) {
    const next = ready.shift()!;
    out.push(next);
    // Reduce indegree of successors that are in the candidate set
    for (const k of candidates) {
      if (TASK_DAG[k].includes(next)) {
        const cur = indeg.get(k) ?? 0;
        indeg.set(k, cur - 1);
        if (cur - 1 === 0) {
          ready.push(k);
          ready.sort();
        }
      }
    }
  }
  return out;
}

interface CandidateAccumulator {
  kind: TaskKind;
  reason_codes: Set<PlanReasonCode>;
  priority: TaskPriority;
}

function bumpCandidate(
  acc: Map<TaskKind, CandidateAccumulator>,
  kind: TaskKind,
  reason: PlanReasonCode,
): void {
  const prior = acc.get(kind);
  if (!prior) {
    acc.set(kind, {
      kind,
      reason_codes: new Set([reason]),
      priority: PLAN_REASON_PRIORITY[reason],
    });
    return;
  }
  prior.reason_codes.add(reason);
  prior.priority = maxPriority(prior.priority, PLAN_REASON_PRIORITY[reason]);
}

// =============================================================================
// Main entry — runTaskPlanner
// =============================================================================

export async function runTaskPlanner(
  sessionId: string,
  options: TaskPlannerOptions = {},
): Promise<TaskPlan> {
  const warnings: string[] = [];
  const accCtx = options.accumulated_context ?? {};
  const budgetCap = typeof options.budget_cap_usd === 'number' && Number.isFinite(options.budget_cap_usd)
    ? options.budget_cap_usd
    : DEFAULT_BUDGET_CAP_USD;
  const currentCost = typeof options.current_session_cost_usd === 'number' && Number.isFinite(options.current_session_cost_usd)
    ? options.current_session_cost_usd
    : 0;

  // --- 1) Defensive read of all input modules -------------------------------
  let pack: ReturnType<typeof getCanonicalFactPackV2> | null = null;
  try { pack = getCanonicalFactPackV2(sessionId); }
  catch (err) { warnings.push(`pack_read_failed:${(err as Error).message}`); }

  let confidence: ReturnType<typeof buildFactConfidenceSummary> | null = null;
  try { confidence = buildFactConfidenceSummary(sessionId); }
  catch (err) { warnings.push(`confidence_read_failed:${(err as Error).message}`); }

  let coverage: ReturnType<typeof computeCoverageReport> | null = null;
  try { coverage = computeCoverageReport(sessionId); }
  catch (err) { warnings.push(`coverage_read_failed:${(err as Error).message}`); }

  let contradictions: ReturnType<typeof detectContradictions> | null = null;
  try { contradictions = detectContradictions(sessionId); }
  catch (err) { warnings.push(`contradictions_read_failed:${(err as Error).message}`); }

  let citation: ReturnType<typeof detectCitationGaps> | null = null;
  try { citation = detectCitationGaps(sessionId); }
  catch (err) { warnings.push(`citation_read_failed:${(err as Error).message}`); }

  let quality: ReturnType<typeof computeQualityBudget> | null = null;
  try { quality = computeQualityBudget(sessionId); }
  catch (err) { warnings.push(`quality_budget_read_failed:${(err as Error).message}`); }

  const ticker = options.ticker ?? pack?.ticker ?? null;

  // --- 2) Build candidate set from PLAN_* rules -----------------------------
  const candidates = new Map<TaskKind, CandidateAccumulator>();

  // PLAN_NO_FACTS — fact pack empty
  if (pack && pack.fact_count === 0) {
    bumpCandidate(candidates, 'parse_standardization', 'PLAN_NO_FACTS');
  }

  // PLAN_COVERAGE_GAP — required-fact coverage incomplete
  if (coverage && coverage.total_missing > 0) {
    bumpCandidate(candidates, 'financial_analysis', 'PLAN_COVERAGE_GAP');
    bumpCandidate(candidates, 'macro_analysis', 'PLAN_COVERAGE_GAP');
  }

  // PLAN_CITATION_GAP_CRITICAL — re-extraction required
  if (citation && citation.critical_gaps.length > 0) {
    bumpCandidate(candidates, 'parse_standardization', 'PLAN_CITATION_GAP_CRITICAL');
  }

  // PLAN_LOW_CONFIDENCE_PRESENT — at least one critical fact below floor
  if (confidence && confidence.low_confidence_keys.length > 0) {
    bumpCandidate(candidates, 'reconciliation', 'PLAN_LOW_CONFIDENCE_PRESENT');
  }

  // PLAN_CRITICAL_CONTRADICTION — disputed canonical numbers
  if (contradictions && contradictions.by_severity.critical > 0) {
    bumpCandidate(candidates, 'reconciliation', 'PLAN_CRITICAL_CONTRADICTION');
  }

  // PLAN_QUALITY_GREEN_READY_FOR_SYNTHESIS — lifecycle publishable*
  if (
    quality &&
    (quality.lifecycle_status === 'publishable' ||
      quality.lifecycle_status === 'publishable_with_warnings')
  ) {
    bumpCandidate(candidates, 'strategic_synthesis', 'PLAN_QUALITY_GREEN_READY_FOR_SYNTHESIS');
    bumpCandidate(candidates, 'chairman_anticipator_deterministic', 'PLAN_QUALITY_GREEN_READY_FOR_SYNTHESIS');
  }

  // PLAN_VALUATION_REQUESTED — explicit caller flag
  if (options.valuation_requested) {
    bumpCandidate(candidates, 'val_dcf', 'PLAN_VALUATION_REQUESTED');
    bumpCandidate(candidates, 'val_scenario_builder', 'PLAN_VALUATION_REQUESTED');
  }

  // --- 3) Topological sort over the candidate set ---------------------------
  const ordered = topoSort(Array.from(candidates.keys()));

  // --- 4) Per-task bucketing (planned vs skipped) ---------------------------
  const planned: PlannedTask[] = [];
  const skipped: SkippedTask[] = [];
  const skippedKinds = new Set<TaskKind>();
  let runningSum = currentCost;

  const lifecycle = quality?.lifecycle_status ?? null;
  const qualityBlocked = lifecycle === 'degraded' || lifecycle === 'hold';

  for (const kind of ordered) {
    const c = candidates.get(kind);
    if (!c) continue;
    const reasonCodes = sortedUnique(Array.from(c.reason_codes));
    const required = TASK_DAG[kind].slice().sort();
    const outputs = TASK_OUTPUTS[kind];
    const cost = TASK_COST_USD[kind];
    const id = taskId(sessionId, kind);

    // 4a) SKIP_PREDECESSOR_FAILED — a candidate predecessor was skipped.
    const failedPreds = TASK_DAG[kind].filter(
      (p) => candidates.has(p) && skippedKinds.has(p),
    );
    if (failedPreds.length > 0) {
      skipped.push({
        task_id: id,
        kind,
        reason_codes: [SKIP_REASON_CODES.SKIP_PREDECESSOR_FAILED],
        details: `Predecessor task(s) skipped: ${failedPreds.sort().join(', ')}.`,
      });
      skippedKinds.add(kind);
      continue;
    }

    // 4b) SKIP_DUPLICATE_OUTPUT_PRESENT — planner pre-check on canonical marker.
    const canonicalMarker = outputs[0];
    if (Object.prototype.hasOwnProperty.call(accCtx, canonicalMarker)) {
      skipped.push({
        task_id: id,
        kind,
        reason_codes: [SKIP_REASON_CODES.SKIP_DUPLICATE_OUTPUT_PRESENT],
        details: `accumulated_context already contains canonical output marker "${canonicalMarker}".`,
      });
      skippedKinds.add(kind);
      continue;
    }

    // 4c) SKIP_BLOCKED_BY_QUALITY — synthesis tier under degraded/hold lifecycle.
    if (qualityBlocked && QUALITY_BLOCKED_TASKS.has(kind)) {
      skipped.push({
        task_id: id,
        kind,
        reason_codes: [SKIP_REASON_CODES.SKIP_BLOCKED_BY_QUALITY],
        details: `Synthesis tier blocked while lifecycle="${lifecycle}".`,
      });
      skippedKinds.add(kind);
      continue;
    }

    // 4d) Build the preflight_hint stored on the PlannedTask. This hint is
    //     for the CALLER's runtime use — its required_predecessor_phases
    //     reflects the DAG so V6 enforces predecessor satisfaction at execute
    //     time. The planner itself owns predecessor sequencing here (topo
    //     sort + SKIP_PREDECESSOR_FAILED), so its OWN preflight call uses an
    //     empty required_predecessor_phases to avoid V6 firing during
    //     planning.
    const preflightHint: PreflightCallContext = {
      session_id: sessionId,
      ticker,
      call_target: { kind: 'agent', id: kind },
      expected_output_keys: outputs.slice(),
      accumulated_context: accCtx,
      estimated_cost_usd: cost,
      current_session_cost_usd: currentCost,
      budget_cap_usd: budgetCap,
      phase: kind,
      required_predecessor_phases: required.slice(),
    };
    const planningPreflightCtx: PreflightCallContext = {
      ...preflightHint,
      required_predecessor_phases: [],
    };
    let decision: PreflightDecision;
    try {
      decision = await runPreflight(planningPreflightCtx);
    } catch (err) {
      warnings.push(`preflight_failed:${kind}:${(err as Error).message}`);
      // Fail-safe: treat as a non-recoverable skip.
      skipped.push({
        task_id: id,
        kind,
        reason_codes: [SKIP_REASON_CODES.SKIP_PREFLIGHT_ABORT],
        details: `Preflight raised: ${(err as Error).message}`,
      });
      skippedKinds.add(kind);
      continue;
    }

    if (decision.action === 'abort') {
      skipped.push({
        task_id: id,
        kind,
        reason_codes: [SKIP_REASON_CODES.SKIP_PREFLIGHT_ABORT],
        details: `runPreflight aborted (reasons=${decision.reason_codes.join(', ') || '∅'}).`,
        preflight_decision_snapshot: decision,
      });
      skippedKinds.add(kind);
      continue;
    }

    if (decision.action === 'skip') {
      skipped.push({
        task_id: id,
        kind,
        reason_codes: [SKIP_REASON_CODES.SKIP_PREFLIGHT_DUPLICATION],
        details: `runPreflight skipped (V4 duplication on expected_output_keys=${outputs.join(',')}).`,
        preflight_decision_snapshot: decision,
      });
      skippedKinds.add(kind);
      continue;
    }

    // 4e) SKIP_BUDGET_FORECAST_EXCEEDS_CAP — running sum + this task > cap.
    if (runningSum + cost > budgetCap) {
      skipped.push({
        task_id: id,
        kind,
        reason_codes: [SKIP_REASON_CODES.SKIP_BUDGET_FORECAST_EXCEEDS_CAP],
        details: `Running session cost forecast $${(runningSum + cost).toFixed(4)} > $${budgetCap.toFixed(4)} cap.`,
      });
      skippedKinds.add(kind);
      continue;
    }

    // 4f) Plan the task.
    planned.push({
      task_id: id,
      kind,
      priority: c.priority,
      reason_codes: reasonCodes,
      required_predecessors: required,
      expected_output_keys: outputs.slice(),
      estimated_cost_usd: cost,
      preflight_hint: preflightHint,
    });
    runningSum += cost;
  }

  // --- 5) Aggregate ---------------------------------------------------------
  const totalEstimated = planned.reduce((a, t) => a + t.estimated_cost_usd, 0);
  const allReasons = sortedUnique([
    ...planned.flatMap((t) => t.reason_codes),
    ...skipped.flatMap((t) => t.reason_codes),
  ]);

  return {
    session_id: sessionId,
    ticker,
    generated_at: new Date().toISOString(),
    planned_tasks: planned,
    skipped_tasks: skipped,
    total_estimated_cost_usd: round4(totalEstimated),
    reason_codes: allReasons,
    warnings,
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// =============================================================================
// Adapter — recordTaskPlan
// =============================================================================

export const TASK_PLAN_CONTEXT_KEYS = {
  /** Append-only array of TaskPlan objects. */
  PLAN: 'task_plan',
  /** JSON mirror of PLAN (string), for stringly-typed transports. */
  PLAN_JSON: 'task_plan_json',
} as const;

/**
 * Append a TaskPlan into the caller's accumulatedContext.
 *
 * - `task_plan` is an append-only array; existing entries are preserved.
 * - `task_plan_json` is a JSON string mirror (rebuilt on every call from
 *   the up-to-date array).
 *
 * Mutates only the two keys above; never touches the DB or any other key.
 */
export function recordTaskPlan(
  sessionId: string,
  plan: TaskPlan,
  accumulatedContext: Record<string, unknown>,
): void {
  const prior = accumulatedContext[TASK_PLAN_CONTEXT_KEYS.PLAN];
  const log: Array<TaskPlan & { recorded_for_session: string }> = Array.isArray(prior)
    ? (prior as Array<TaskPlan & { recorded_for_session: string }>).slice()
    : [];
  log.push({ ...plan, recorded_for_session: sessionId });
  accumulatedContext[TASK_PLAN_CONTEXT_KEYS.PLAN] = log;
  accumulatedContext[TASK_PLAN_CONTEXT_KEYS.PLAN_JSON] = JSON.stringify(log);
}

// =============================================================================
// Test exports — narrow surface for unit tests; not part of the public API.
// =============================================================================

export {
  TASK_DAG,
  TASK_COST_USD,
  TASK_OUTPUTS,
  QUALITY_BLOCKED_TASKS,
  DEFAULT_BUDGET_CAP_USD,
  topoSort,
};
