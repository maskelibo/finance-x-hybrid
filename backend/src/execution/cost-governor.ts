/**
 * Adaptive Cost Governor (Block P — Plan P3D Wave 1).
 *
 * Standalone session-level economic arbiter. Consumes a P3B TaskPlan + an
 * optional P3C ComputationPlan + caller-supplied current session cost +
 * budget cap, and emits a single CostGovernorReport with one BudgetVerdict
 * per planned task and a session-level budget_status / stop_reasons summary.
 *
 * Wave 1 invariants:
 *   - Standalone: no orchestrator / agent-runner / planner / preflight /
 *     incremental wiring. The governor RECOMMENDS; the caller acts.
 *   - Read-only: never mutates cached output objects in accumulated_context.
 *     The optional adapter writes only two narrow keys.
 *   - Deterministic: same inputs → same structural output (mod
 *     `generated_at`). Tie-breaks on task_kind alphabetical sort.
 *   - Every verdict carries ≥ 1 frozen reason code from
 *     GOVERNOR_REASON_CODES.
 *   - Adaptive ladder is executed in a fixed order; steps are never skipped.
 *   - No LLM calls; no DB access; no model swap actually performed (the
 *     governor records `recommended_model_tier`, the caller honors it).
 */

import {
  TASK_COST_USD,
  type TaskKind,
  type TaskPlan,
  type TaskPriority,
} from './task-planner.js';
import type { ComputationPlan } from './incremental.js';
import {
  runPreflight,
  type PreflightDecision,
} from './preflight.js';

// =============================================================================
// Frozen reason-code constants
// =============================================================================

export const GOVERNOR_REASON_CODES = {
  GOV_PROCEED_WITHIN_BUDGET: 'GOV_PROCEED_WITHIN_BUDGET',
  GOV_PROCEED_REUSE_HONORED: 'GOV_PROCEED_REUSE_HONORED',
  GOV_DOWNGRADE_MODEL_TIER: 'GOV_DOWNGRADE_MODEL_TIER',
  GOV_SKIP_OPTIONAL_TASK: 'GOV_SKIP_OPTIONAL_TASK',
  GOV_REUSE_ONLY_MODE: 'GOV_REUSE_ONLY_MODE',
  GOV_STOP_BUDGET_EXHAUSTED: 'GOV_STOP_BUDGET_EXHAUSTED',
  GOV_STOP_NO_VIABLE_PLAN: 'GOV_STOP_NO_VIABLE_PLAN',
  GOV_STOP_PREFLIGHT_ABORT_CHAIN: 'GOV_STOP_PREFLIGHT_ABORT_CHAIN',
  GOV_TIGHT_HEADROOM_BELOW_TEN_PERCENT: 'GOV_TIGHT_HEADROOM_BELOW_TEN_PERCENT',
} as const;

export type GovernorReasonCode =
  typeof GOVERNOR_REASON_CODES[keyof typeof GOVERNOR_REASON_CODES];

// =============================================================================
// Output types
// =============================================================================

export type BudgetStatus = 'within_budget' | 'tight' | 'over_budget' | 'exhausted';

export type GovernorDecision =
  | 'proceed'
  | 'downgrade_model'
  | 'skip_optional'
  | 'reuse_only'
  | 'stop_session';

export type ModelTierId = 'default' | 'economy';

export interface BudgetVerdict {
  task_id: string;
  kind: TaskKind;
  decision: GovernorDecision;
  /** Sorted-unique frozen codes from GOVERNOR_REASON_CODES. */
  reason_codes: string[];
  /** Set when decision='downgrade_model'. */
  recommended_model_tier?: ModelTierId;
  /** Cost the caller would actually pay if they honor the verdict. */
  effective_cost_usd: number;
  /** Original TASK_COST_USD[kind] for transparency. */
  original_cost_usd: number;
  /** original − effective. ≥ 0. */
  cost_savings_usd: number;
}

export interface CostGovernorReport {
  session_id: string;
  ticker: string | null;
  generated_at: string;
  budget_status: BudgetStatus;
  /** Verdicts the caller may execute: decision ∈ {proceed, downgrade_model}. */
  allowed_tasks: BudgetVerdict[];
  /** decision === 'downgrade_model' (strict subset of allowed_tasks). */
  downgraded_tasks: BudgetVerdict[];
  /** decision ∈ {skip_optional, reuse_only, stop_session}. */
  skipped_tasks: BudgetVerdict[];
  /** Populated only when budget_status='exhausted' OR a session-wide stop fires. */
  stop_reasons: string[];
  /** Σ allowed_tasks[*].effective_cost_usd. */
  projected_cost_usd: number;
  /** budget_cap_usd − current_session_cost_usd − projected_cost_usd. */
  remaining_budget_usd: number;
  /** Σ verdicts[*].cost_savings_usd. */
  estimated_savings_usd: number;
  /** Sorted-unique union over all verdicts + session-level stop_reasons. */
  reason_codes: string[];
  warnings: string[];
}

export interface CostGovernorOptions {
  /** Override; falls back to taskPlan.ticker. */
  ticker?: string | null;
  /** Caller-supplied accumulated context. Read-only here; the engine never
   *  mutates existing keys. Only used when evaluate_preflight=true (passed
   *  through to runPreflight). */
  accumulated_context?: Record<string, unknown>;
  /** Optional ComputationPlan from P3C. Reuse verdicts honored when present. */
  computation_plan?: ComputationPlan;
  /** USD already spent on this session. Default 0. */
  current_session_cost_usd?: number;
  /** USD cap on session-cumulative spend. Default 5. */
  budget_cap_usd?: number;
  /** Explicit list of tasks the caller wants dropped first under tight budget.
   *  Default: empty (engine falls back to priority-based ordering). */
  optional_task_kinds?: TaskKind[];
  /** When true, run preflight per task and surface GOV_STOP_PREFLIGHT_ABORT_CHAIN
   *  if every preflight returns abort. Default false. */
  evaluate_preflight?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_BUDGET_CAP_USD = 5;
const TIGHT_HEADROOM_RATIO = 0.10;

const MODEL_TIER_MULTIPLIERS: Record<ModelTierId, number> = {
  default: 1.0,
  economy: 0.4,
};

const PRIORITY_ORDER: TaskPriority[] = ['critical', 'high', 'normal', 'low'];

// =============================================================================
// Helpers
// =============================================================================

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function sortedUnique(values: ReadonlyArray<string>): string[] {
  return Array.from(new Set(values)).sort();
}

function priorityRank(p: TaskPriority): number {
  return PRIORITY_ORDER.indexOf(p);
}

interface InternalVerdict {
  task_id: string;
  kind: TaskKind;
  priority: TaskPriority;
  decision: GovernorDecision;
  reason_codes: Set<GovernorReasonCode>;
  recommended_model_tier?: ModelTierId;
  effective_cost_usd: number;
  original_cost_usd: number;
  /** Internal: snapshot of P3C verdict (when ComputationPlan supplied). */
  is_reuse_in_plan: boolean;
}

function setVerdict(
  v: InternalVerdict,
  decision: GovernorDecision,
  code: GovernorReasonCode,
  effective: number,
  modelTier?: ModelTierId,
): void {
  v.decision = decision;
  v.reason_codes = new Set([code]);
  v.effective_cost_usd = round4(effective);
  if (modelTier !== undefined) {
    v.recommended_model_tier = modelTier;
  } else {
    delete v.recommended_model_tier;
  }
}

// =============================================================================
// Main entry — runCostGovernor
// =============================================================================

export async function runCostGovernor(
  sessionId: string,
  taskPlan: TaskPlan,
  options: CostGovernorOptions = {},
): Promise<CostGovernorReport> {
  const warnings: string[] = [];
  const cap = typeof options.budget_cap_usd === 'number' && Number.isFinite(options.budget_cap_usd)
    ? options.budget_cap_usd
    : DEFAULT_BUDGET_CAP_USD;
  const current = typeof options.current_session_cost_usd === 'number' && Number.isFinite(options.current_session_cost_usd)
    ? options.current_session_cost_usd
    : 0;
  const ticker = options.ticker ?? taskPlan.ticker ?? null;
  const optionalSet = new Set<TaskKind>(options.optional_task_kinds ?? []);
  const computationPlan = options.computation_plan;
  const stopReasons: GovernorReasonCode[] = [];

  // Build ComputationPlan lookup by task_id.
  const reuseTaskIds = new Set<string>();
  if (computationPlan) {
    for (const v of computationPlan.computation_decision) {
      if (v.decision === 'reuse') reuseTaskIds.add(v.task_id);
    }
  }

  // -------------------------------------------------------------------------
  // Step 1 — stop-first check.
  // -------------------------------------------------------------------------
  if (current >= cap) {
    const verdicts: InternalVerdict[] = taskPlan.planned_tasks.map((t) => {
      const v: InternalVerdict = {
        task_id: t.task_id,
        kind: t.kind,
        priority: t.priority,
        decision: 'proceed',
        reason_codes: new Set<GovernorReasonCode>(),
        effective_cost_usd: 0,
        original_cost_usd: TASK_COST_USD[t.kind],
        is_reuse_in_plan: reuseTaskIds.has(t.task_id),
      };
      setVerdict(v, 'stop_session', GOVERNOR_REASON_CODES.GOV_STOP_BUDGET_EXHAUSTED, 0);
      return v;
    });
    stopReasons.push(GOVERNOR_REASON_CODES.GOV_STOP_BUDGET_EXHAUSTED);
    return assembleReport({
      sessionId, ticker, taskPlan, verdicts,
      budget_status: 'exhausted',
      stop_reasons: stopReasons,
      cap, current, warnings,
    });
  }

  // -------------------------------------------------------------------------
  // Steps 2-3 — initial verdicts: reuse-honor and plain-proceed.
  // -------------------------------------------------------------------------
  const verdicts: InternalVerdict[] = taskPlan.planned_tasks.map((t) => {
    const isReuse = reuseTaskIds.has(t.task_id);
    const v: InternalVerdict = {
      task_id: t.task_id,
      kind: t.kind,
      priority: t.priority,
      decision: 'proceed',
      reason_codes: new Set<GovernorReasonCode>(),
      effective_cost_usd: 0,
      original_cost_usd: TASK_COST_USD[t.kind],
      is_reuse_in_plan: isReuse,
    };
    if (isReuse) {
      setVerdict(v, 'proceed', GOVERNOR_REASON_CODES.GOV_PROCEED_REUSE_HONORED, 0);
    } else {
      setVerdict(v, 'proceed', GOVERNOR_REASON_CODES.GOV_PROCEED_WITHIN_BUDGET, TASK_COST_USD[t.kind]);
    }
    return v;
  });

  const projected = (): number =>
    round4(verdicts.filter(isAllowed).reduce((a, v) => a + v.effective_cost_usd, 0));

  // -------------------------------------------------------------------------
  // Step 4 — forecast vs cap. If clean, finalize.
  // -------------------------------------------------------------------------
  if (current + projected() <= cap) {
    return finalize({
      sessionId, ticker, taskPlan, verdicts,
      cap, current, warnings, stopReasons,
      computationPlan,
      evaluatePreflight: options.evaluate_preflight === true,
      accumulatedContext: options.accumulated_context ?? {},
    });
  }

  // -------------------------------------------------------------------------
  // Step 5 — downgrade pass: highest-original-cost first, alphabetical tie-break.
  //          Only operates on tasks currently 'proceed' (not on reuse-honored).
  // -------------------------------------------------------------------------
  const downgradeable = (): InternalVerdict[] =>
    verdicts
      .filter((v) => v.decision === 'proceed' && !v.is_reuse_in_plan && v.recommended_model_tier === undefined)
      .sort((a, b) => {
        if (b.original_cost_usd !== a.original_cost_usd) return b.original_cost_usd - a.original_cost_usd;
        return a.kind.localeCompare(b.kind);
      });

  while (current + projected() > cap) {
    const candidates = downgradeable();
    if (candidates.length === 0) break;
    const target = candidates[0];
    const economyCost = round4(target.original_cost_usd * MODEL_TIER_MULTIPLIERS.economy);
    setVerdict(target, 'downgrade_model', GOVERNOR_REASON_CODES.GOV_DOWNGRADE_MODEL_TIER, economyCost, 'economy');
  }

  if (current + projected() <= cap) {
    return finalize({
      sessionId, ticker, taskPlan, verdicts,
      cap, current, warnings, stopReasons,
      computationPlan,
      evaluatePreflight: options.evaluate_preflight === true,
      accumulatedContext: options.accumulated_context ?? {},
    });
  }

  // -------------------------------------------------------------------------
  // Step 6 — skip-optional pass: drop optional/low/normal-priority tasks.
  //          Lowest-priority first, alphabetical tie-break on kind.
  // -------------------------------------------------------------------------
  const skipEligible = (): InternalVerdict[] =>
    verdicts
      .filter((v) => isAllowed(v) && !v.is_reuse_in_plan
        && (optionalSet.has(v.kind) || v.priority === 'normal' || v.priority === 'low'))
      .sort((a, b) => {
        // Lowest priority first → highest priorityRank index first
        if (priorityRank(b.priority) !== priorityRank(a.priority)) {
          return priorityRank(b.priority) - priorityRank(a.priority);
        }
        return a.kind.localeCompare(b.kind);
      });

  while (current + projected() > cap) {
    const candidates = skipEligible();
    if (candidates.length === 0) break;
    const target = candidates[0];
    setVerdict(target, 'skip_optional', GOVERNOR_REASON_CODES.GOV_SKIP_OPTIONAL_TASK, 0);
  }

  if (current + projected() <= cap) {
    return finalize({
      sessionId, ticker, taskPlan, verdicts,
      cap, current, warnings, stopReasons,
      computationPlan,
      evaluatePreflight: options.evaluate_preflight === true,
      accumulatedContext: options.accumulated_context ?? {},
    });
  }

  // -------------------------------------------------------------------------
  // Step 7 — reuse-only fallback.
  //   Trigger only when ComputationPlan supplied AND ≥ 1 reuse verdict.
  //   Reuse-honored tasks become 'reuse_only'; everything else 'skip_optional'
  //   with code GOV_REUSE_ONLY_MODE.
  // -------------------------------------------------------------------------
  const hasAnyReuse = reuseTaskIds.size > 0;
  if (hasAnyReuse) {
    for (const v of verdicts) {
      if (v.is_reuse_in_plan) {
        setVerdict(v, 'reuse_only', GOVERNOR_REASON_CODES.GOV_REUSE_ONLY_MODE, 0);
      } else {
        setVerdict(v, 'skip_optional', GOVERNOR_REASON_CODES.GOV_REUSE_ONLY_MODE, 0);
      }
    }
    // Reuse-only mode forces effective_cost=0 across the board → always within budget.
    return finalize({
      sessionId, ticker, taskPlan, verdicts,
      cap, current, warnings, stopReasons,
      computationPlan,
      evaluatePreflight: options.evaluate_preflight === true,
      accumulatedContext: options.accumulated_context ?? {},
    });
  }

  // -------------------------------------------------------------------------
  // Step 8 — stop-session terminal.
  // -------------------------------------------------------------------------
  for (const v of verdicts) {
    if (isAllowed(v)) {
      setVerdict(v, 'stop_session', GOVERNOR_REASON_CODES.GOV_STOP_NO_VIABLE_PLAN, 0);
    }
  }
  stopReasons.push(GOVERNOR_REASON_CODES.GOV_STOP_NO_VIABLE_PLAN);
  return finalize({
    sessionId, ticker, taskPlan, verdicts,
    cap, current, warnings, stopReasons,
    computationPlan,
    evaluatePreflight: options.evaluate_preflight === true,
    accumulatedContext: options.accumulated_context ?? {},
    forcedStatus: 'over_budget',
  });
}

// =============================================================================
// Finalization (steps 9 + 10)
// =============================================================================

interface FinalizeArgs {
  sessionId: string;
  ticker: string | null;
  taskPlan: TaskPlan;
  verdicts: InternalVerdict[];
  cap: number;
  current: number;
  warnings: string[];
  stopReasons: GovernorReasonCode[];
  computationPlan?: ComputationPlan;
  evaluatePreflight: boolean;
  accumulatedContext: Record<string, unknown>;
  forcedStatus?: BudgetStatus;
}

async function finalize(args: FinalizeArgs): Promise<CostGovernorReport> {
  // Step 9 — preflight-abort chain check (only when explicitly requested).
  if (args.evaluatePreflight) {
    const decisions: PreflightDecision[] = [];
    for (const t of args.taskPlan.planned_tasks) {
      const decision = await runPreflight(t.preflight_hint);
      decisions.push(decision);
    }
    const allAbort = decisions.length > 0 && decisions.every((d) => d.action === 'abort');
    if (allAbort) {
      // Flip every verdict to stop_session with the chain reason.
      for (const v of args.verdicts) {
        setVerdict(v, 'stop_session', GOVERNOR_REASON_CODES.GOV_STOP_PREFLIGHT_ABORT_CHAIN, 0);
      }
      args.stopReasons.push(GOVERNOR_REASON_CODES.GOV_STOP_PREFLIGHT_ABORT_CHAIN);
      return assembleReport({
        sessionId: args.sessionId,
        ticker: args.ticker,
        taskPlan: args.taskPlan,
        verdicts: args.verdicts,
        budget_status: 'exhausted',
        stop_reasons: args.stopReasons,
        cap: args.cap,
        current: args.current,
        warnings: args.warnings,
      });
    }
  }

  // Step 10 — tight-headroom guard + budget_status mapping.
  const projected = round4(
    args.verdicts.filter(isAllowed).reduce((a, v) => a + v.effective_cost_usd, 0),
  );
  const remaining = round4(args.cap - args.current - projected);
  let budgetStatus: BudgetStatus;
  if (args.forcedStatus) {
    budgetStatus = args.forcedStatus;
  } else if (remaining < 0) {
    budgetStatus = 'over_budget';
  } else if (args.cap > 0 && (remaining / args.cap) < TIGHT_HEADROOM_RATIO) {
    budgetStatus = 'tight';
    args.warnings.push(`headroom ${(remaining / args.cap * 100).toFixed(1)}% < 10%`);
    // Add tight-headroom code to a synthetic session-level marker by attaching
    // it to every "proceed" or "downgrade_model" verdict's reason_codes? No —
    // session-level signals belong in stop_reasons or report-level reason_codes.
    // We add it to report.reason_codes via the assemble step below.
  } else {
    budgetStatus = 'within_budget';
  }

  return assembleReport({
    sessionId: args.sessionId,
    ticker: args.ticker,
    taskPlan: args.taskPlan,
    verdicts: args.verdicts,
    budget_status: budgetStatus,
    stop_reasons: args.stopReasons,
    cap: args.cap,
    current: args.current,
    warnings: args.warnings,
    extraReasonCodes: budgetStatus === 'tight'
      ? [GOVERNOR_REASON_CODES.GOV_TIGHT_HEADROOM_BELOW_TEN_PERCENT]
      : [],
  });
}

// =============================================================================
// Assembly (verdict bucketing + invariant maintenance)
// =============================================================================

interface AssembleArgs {
  sessionId: string;
  ticker: string | null;
  taskPlan: TaskPlan;
  verdicts: InternalVerdict[];
  budget_status: BudgetStatus;
  stop_reasons: GovernorReasonCode[];
  cap: number;
  current: number;
  warnings: string[];
  extraReasonCodes?: GovernorReasonCode[];
}

function assembleReport(args: AssembleArgs): CostGovernorReport {
  const allowed: BudgetVerdict[] = [];
  const downgraded: BudgetVerdict[] = [];
  const skipped: BudgetVerdict[] = [];

  for (const v of args.verdicts) {
    const out: BudgetVerdict = {
      task_id: v.task_id,
      kind: v.kind,
      decision: v.decision,
      reason_codes: sortedUnique(Array.from(v.reason_codes)),
      effective_cost_usd: round4(v.effective_cost_usd),
      original_cost_usd: round4(v.original_cost_usd),
      cost_savings_usd: round4(v.original_cost_usd - v.effective_cost_usd),
    };
    if (v.recommended_model_tier !== undefined) {
      out.recommended_model_tier = v.recommended_model_tier;
    }
    if (out.decision === 'proceed' || out.decision === 'downgrade_model') {
      allowed.push(out);
      if (out.decision === 'downgrade_model') downgraded.push(out);
    } else {
      skipped.push(out);
    }
  }

  const projected = round4(allowed.reduce((a, v) => a + v.effective_cost_usd, 0));
  const remaining = round4(args.cap - args.current - projected);
  const totalSavings = round4(args.verdicts.reduce(
    (a, v) => a + (v.original_cost_usd - v.effective_cost_usd),
    0,
  ));

  const reasonCodes = sortedUnique([
    ...args.verdicts.flatMap((v) => Array.from(v.reason_codes)),
    ...args.stop_reasons,
    ...(args.extraReasonCodes ?? []),
  ]);

  return {
    session_id: args.sessionId,
    ticker: args.ticker,
    generated_at: new Date().toISOString(),
    budget_status: args.budget_status,
    allowed_tasks: allowed,
    downgraded_tasks: downgraded,
    skipped_tasks: skipped,
    stop_reasons: sortedUnique(args.stop_reasons),
    projected_cost_usd: projected,
    remaining_budget_usd: remaining,
    estimated_savings_usd: totalSavings,
    reason_codes: reasonCodes,
    warnings: args.warnings.slice(),
  };
}

function isAllowed(v: InternalVerdict): boolean {
  return v.decision === 'proceed' || v.decision === 'downgrade_model';
}

// =============================================================================
// Adapter — recordCostGovernorReport
// =============================================================================

export const COST_GOVERNOR_CONTEXT_KEYS = {
  REPORT: 'cost_governor_report',
  REPORT_JSON: 'cost_governor_report_json',
} as const;

/**
 * Append a CostGovernorReport into the caller's accumulatedContext.
 *
 * - 'cost_governor_report' is an append-only array; existing entries preserved.
 * - 'cost_governor_report_json' is a JSON string mirror.
 *
 * Mutates only the two keys above; never touches the DB or any other key,
 * and never mutates cached output objects.
 */
export function recordCostGovernorReport(
  sessionId: string,
  report: CostGovernorReport,
  accumulatedContext: Record<string, unknown>,
): void {
  const prior = accumulatedContext[COST_GOVERNOR_CONTEXT_KEYS.REPORT];
  const log: Array<CostGovernorReport & { recorded_for_session: string }> = Array.isArray(prior)
    ? (prior as Array<CostGovernorReport & { recorded_for_session: string }>).slice()
    : [];
  log.push({ ...report, recorded_for_session: sessionId });
  accumulatedContext[COST_GOVERNOR_CONTEXT_KEYS.REPORT] = log;
  accumulatedContext[COST_GOVERNOR_CONTEXT_KEYS.REPORT_JSON] = JSON.stringify(log);
}

// =============================================================================
// Test exports — narrow surface
// =============================================================================

export {
  MODEL_TIER_MULTIPLIERS,
  DEFAULT_BUDGET_CAP_USD,
  TIGHT_HEADROOM_RATIO,
};
