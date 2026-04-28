/**
 * Governance Runtime Shadow Helpers (Block P — Plan P4.5 Wave 1).
 *
 * Two shadow-mode helpers that the orchestrator may invoke at session-start
 * and session-end boundaries to compose the standalone P3/P4 governance
 * stack. The helpers RECORD reports into accumulatedContext and never block,
 * skip, downgrade, or rerun. Every recommendation is observation-only.
 *
 * Wave 1 invariants:
 *   - Feature-flag gated on `process.env.GOVERNANCE_SHADOW_MODE === 'on'`.
 *     Any other value (unset, '', 'off', 'maybe', etc.) is treated as OFF
 *     and the helpers no-op.
 *   - Every inner engine call is wrapped in its own try/catch; failures emit
 *     `[governance-shadow]` warnings via console.warn and never propagate.
 *   - The helpers mutate ONLY the governance-owned accumulatedContext keys
 *     written by the existing standalone adapters (task_plan,
 *     task_plan_json, computation_plan, computation_plan_json,
 *     cost_governor_report, cost_governor_report_json, escalation_report,
 *     escalation_report_json, self_healing_plan, self_healing_plan_json,
 *     idempotency_saga_plan, idempotency_saga_plan_json,
 *     circuit_breaker_plan, circuit_breaker_plan_json).
 *   - No DB writes; cached analytical narrative is preserved verbatim.
 */

import {
  runTaskPlanner, recordTaskPlan,
  type TaskPlan,
} from './execution/task-planner.js';
import {
  runIncrementalComputation, recordComputationPlan,
  type ComputationPlan,
} from './execution/incremental.js';
import {
  runCostGovernor, recordCostGovernorReport,
  type CostGovernorReport,
} from './execution/cost-governor.js';
import {
  runEscalationManager, recordEscalationReport,
  type EscalationReport,
} from './execution/escalation-manager.js';
import {
  runSelfHealingPipeline, recordSelfHealingPlan,
} from './execution/self-healing.js';
import {
  runIdempotencySaga, recordIdempotencySagaPlan,
  type SagaStepInput,
} from './execution/idempotency-saga.js';
import {
  runCircuitBreaker, recordCircuitBreakerPlan,
  type OperationInput,
} from './execution/circuit-breaker.js';

import { computeQualityBudget, type QualityBudgetReport } from './quality-os/quality-budget.js';
import { detectContradictions, type ContradictionReport } from './quality-os/contradiction-engine.js';
import { detectCitationGaps, type CitationReport } from './quality-os/citation-enforcement.js';
import { computeCoverageReport, type CoverageReport } from './quality-os/coverage-engine.js';
import {
  runDeterministicChairmanQuestions,
  type DeterministicChairmanReport,
} from './quality-os/chairman-questions-deterministic.js';

// =============================================================================
// Feature flag
// =============================================================================

const FLAG_ENV_VAR = 'GOVERNANCE_SHADOW_MODE';
const FLAG_ENABLED_VALUE = 'on';

/** Strict equality on `'on'`. Any other value (unset / 'off' / 'maybe') → OFF. */
export function isShadowModeEnabled(): boolean {
  return process.env[FLAG_ENV_VAR] === FLAG_ENABLED_VALUE;
}

function shadowWarn(stage: string, err: unknown): void {
  console.warn(`[governance-shadow] ${stage} failed: ${err instanceof Error ? err.message : err}`);
}

// =============================================================================
// Internal helpers
// =============================================================================

function readLatestTaskPlan(accCtx: Record<string, unknown>): TaskPlan | undefined {
  const log = accCtx['task_plan'];
  if (!Array.isArray(log) || log.length === 0) return undefined;
  return log[log.length - 1] as TaskPlan;
}

function readLatestComputationPlan(accCtx: Record<string, unknown>): ComputationPlan | undefined {
  const log = accCtx['computation_plan'];
  if (!Array.isArray(log) || log.length === 0) return undefined;
  return log[log.length - 1] as ComputationPlan;
}

// =============================================================================
// Session-start helper — runs P3B + P3C(cold) and records into accCtx
// =============================================================================

/**
 * Compose the session-start governance shadow. Idempotent (append-only); safe
 * to call multiple times. No-op when the feature flag is OFF. Never throws.
 */
export async function recordSessionStartGovernance(
  sessionId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<void> {
  if (!isShadowModeEnabled()) return;

  let taskPlan: TaskPlan | undefined;
  try {
    // Shallow copy: the planner embeds preflight_hint.accumulated_context as a
    // reference, and we are about to APPEND task_plan into accumulatedContext.
    // Passing the live object would create a circular structure that breaks
    // JSON.stringify inside recordTaskPlan. The copy preserves duplication-
    // detection signal (canonical-marker presence) without aliasing.
    const planCtx = { ...accumulatedContext };
    taskPlan = await runTaskPlanner(sessionId, {
      ticker,
      accumulated_context: planCtx,
    });
    recordTaskPlan(sessionId, taskPlan, accumulatedContext);
  } catch (err) {
    shadowWarn('session-start.task-planner', err);
    return;  // can't proceed to incremental without a plan
  }

  try {
    const computation = await runIncrementalComputation(sessionId, taskPlan, {});
    recordComputationPlan(sessionId, computation, accumulatedContext);
  } catch (err) {
    shadowWarn('session-start.incremental', err);
  }
}

// =============================================================================
// Session-end helper — composes P3D + P4A + P4B + P4C + P4D
// =============================================================================

/**
 * Compose the session-end governance shadow. No-op when the feature flag is
 * OFF. Never throws. Each inner layer is wrapped in its own try/catch; a
 * single layer failure does not prevent later layers from attempting.
 */
export async function recordSessionEndGovernance(
  sessionId: string,
  ticker: string,
  totalCostUsd: number,
  accumulatedContext: Record<string, unknown>,
): Promise<void> {
  if (!isShadowModeEnabled()) return;

  // 1) Resolve TaskPlan — reuse latest from accCtx if session-start ran;
  //    otherwise generate a fresh one (defensive — flag may have flipped
  //    mid-session).
  let taskPlan: TaskPlan | undefined = readLatestTaskPlan(accumulatedContext);
  if (!taskPlan) {
    try {
      // Shallow copy to avoid the same circular-reference trap as session-start.
      const planCtx = { ...accumulatedContext };
      taskPlan = await runTaskPlanner(sessionId, {
        ticker,
        accumulated_context: planCtx,
      });
      recordTaskPlan(sessionId, taskPlan, accumulatedContext);
    } catch (err) {
      shadowWarn('session-end.task-planner', err);
      return;  // no plan → cannot run any downstream layer
    }
  }

  // 2) Resolve ComputationPlan — reuse latest if session-start ran,
  //    otherwise generate cold.
  let computationPlan: ComputationPlan | undefined = readLatestComputationPlan(accumulatedContext);
  if (!computationPlan) {
    try {
      computationPlan = await runIncrementalComputation(sessionId, taskPlan, {});
      recordComputationPlan(sessionId, computationPlan, accumulatedContext);
    } catch (err) {
      shadowWarn('session-end.incremental', err);
    }
  }

  // 3) Cost governor — uses real session-cumulative cost from caller.
  let costGovernorReport: CostGovernorReport | undefined;
  try {
    costGovernorReport = await runCostGovernor(sessionId, taskPlan, {
      ticker,
      current_session_cost_usd: totalCostUsd,
      computation_plan: computationPlan,
    });
    recordCostGovernorReport(sessionId, costGovernorReport, accumulatedContext);
  } catch (err) {
    shadowWarn('session-end.cost-governor', err);
  }

  // 4) Quality-os reads (consumed by escalation).
  let qualityBudget: QualityBudgetReport | undefined;
  let contradictionReport: ContradictionReport | undefined;
  let citationReport: CitationReport | undefined;
  let coverageReport: CoverageReport | undefined;
  let chairmanReport: DeterministicChairmanReport | undefined;

  try { qualityBudget = computeQualityBudget(sessionId); }
  catch (err) { shadowWarn('session-end.quality-budget', err); }
  try { contradictionReport = detectContradictions(sessionId); }
  catch (err) { shadowWarn('session-end.contradiction', err); }
  try { citationReport = detectCitationGaps(sessionId); }
  catch (err) { shadowWarn('session-end.citation', err); }
  try { coverageReport = computeCoverageReport(sessionId); }
  catch (err) { shadowWarn('session-end.coverage', err); }
  try { chairmanReport = runDeterministicChairmanQuestions(sessionId, ticker); }
  catch (err) { shadowWarn('session-end.chairman', err); }

  // 5) Escalation manager.
  let escalation: EscalationReport | undefined;
  try {
    escalation = await runEscalationManager(sessionId, {
      task_plan: taskPlan,
      computation_plan: computationPlan,
      cost_governor_report: costGovernorReport,
      quality_budget: qualityBudget,
      contradiction_report: contradictionReport,
      citation_report: citationReport,
      coverage_report: coverageReport,
      chairman_report: chairmanReport,
    }, { ticker });
    recordEscalationReport(sessionId, escalation, accumulatedContext);
    console.log(
      `[governance-shadow] session=${sessionId} ` +
      `escalation_level=${escalation.escalation_level} ` +
      `action=${escalation.action} ` +
      `next_steps=${escalation.recommended_next_steps.length}`,
    );
  } catch (err) {
    shadowWarn('session-end.escalation', err);
  }

  // 6) Self-healing — needs an escalation report.
  if (escalation) {
    try {
      const heal = await runSelfHealingPipeline(sessionId, escalation, { ticker });
      recordSelfHealingPlan(sessionId, heal, accumulatedContext);
    } catch (err) {
      shadowWarn('session-end.self-healing', err);
    }
  }

  // 7) Idempotency / saga — synthetic step list from the planned tasks.
  try {
    const sagaSteps: SagaStepInput[] = (taskPlan.planned_tasks ?? []).map((t) => ({
      step_id: t.task_id,
      kind: t.kind,
      fingerprint: t.task_id,
      // Session-end: assume agents that survived the orchestrator loop
      // completed; the orchestrator's own status row is the canonical truth.
      status: 'completed',
      has_compensating_action: false,
      is_idempotent: true,
    }));
    const saga = await runIdempotencySaga(sessionId, { saga_steps: sagaSteps }, { ticker });
    recordIdempotencySagaPlan(sessionId, saga, accumulatedContext);
  } catch (err) {
    shadowWarn('session-end.idempotency-saga', err);
  }

  // 8) Circuit breaker — synthetic operations with empty history (Wave 1
  //    has no per-operation failure log; future wiring waves will populate it).
  try {
    const ops: OperationInput[] = (taskPlan.planned_tasks ?? []).map((t) => ({
      operation_id: t.task_id,
      kind: t.kind,
      recent_attempts: [],
    }));
    const cb = await runCircuitBreaker(sessionId, { operations: ops }, { ticker });
    recordCircuitBreakerPlan(sessionId, cb, accumulatedContext);
  } catch (err) {
    shadowWarn('session-end.circuit-breaker', err);
  }
}

// =============================================================================
// Test exports
// =============================================================================

export { FLAG_ENV_VAR, FLAG_ENABLED_VALUE };
