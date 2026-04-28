/**
 * Pre-P5 Full-Stack Governance Replay Validation.
 *
 * Single additive integration test that composes the complete standalone
 * P3/P4 governance stack against the persisted KCHOL session
 * (`qJASnWiqC-3xomxzyLamS`) — verifying cross-layer compatibility before
 * any runtime / orchestrator wiring.
 *
 * Composition order (cold-cache pass):
 *   1. runTaskPlanner         (P3B)
 *   2. runIncrementalComputation (P3C — cold)
 *   3. runCostGovernor        (P3D — generous cap)
 *   4. runEscalationManager   (P4A — consumes 1-3 + quality-os reports)
 *   5. runSelfHealingPipeline (P4B — consumes 4)
 *   6. runIdempotencySaga     (P4C — synthetic saga steps from 1)
 *   7. runCircuitBreaker      (P4D — synthetic operations from 1)
 *
 * Warm-cache pass repeats the chain with caller-supplied cached_outputs_meta
 * so that ComputationPlan emits `reuse` verdicts; the cost governor honors
 * them and projected cost drops accordingly.
 *
 * READ-ONLY against the DB: no inserts / updates. Snapshots
 * `analysis_sessions.total_cost_usd` before / after to verify zero side
 * effects. The standalone engines do not write the DB; this test asserts
 * that invariant explicitly.
 */
import { describe, expect, it } from 'vitest';
import { db } from '../db.js';

import {
  runTaskPlanner,
  TASK_COST_USD,
  TASK_OUTPUTS,
  type TaskKind,
  type TaskPlan,
} from './task-planner.js';
import {
  runIncrementalComputation,
  type CachedOutputMeta,
  type ComputationPlan,
  type IncrementalOptions,
} from './incremental.js';
import {
  runCostGovernor,
  GOVERNOR_REASON_CODES,
  type CostGovernorReport,
} from './cost-governor.js';
import {
  runEscalationManager,
  ESCALATION_REASON_CODES,
  type EscalationReport,
} from './escalation-manager.js';
import {
  runSelfHealingPipeline,
  HEALING_ACTION_CODES,
  type SelfHealingPlan,
} from './self-healing.js';
import {
  runIdempotencySaga,
  IDEMPO_REASON_CODES,
  SAGA_REASON_CODES,
  type IdempotencySagaPlan,
  type SagaStepInput,
} from './idempotency-saga.js';
import {
  runCircuitBreaker,
  CIRCUIT_BREAKER_REASON_CODES,
  type CircuitBreakerPlan,
  type OperationInput,
} from './circuit-breaker.js';

import { computeQualityBudget } from '../quality-os/quality-budget.js';
import { detectContradictions } from '../quality-os/contradiction-engine.js';
import { detectCitationGaps } from '../quality-os/citation-enforcement.js';
import { computeCoverageReport } from '../quality-os/coverage-engine.js';
import { runDeterministicChairmanQuestions } from '../quality-os/chairman-questions-deterministic.js';
import { getMethodologyVersion } from '../fact-layer/methodology.js';

// =============================================================================
// Constants
// =============================================================================

const KCHOL_SESSION = 'qJASnWiqC-3xomxzyLamS';
const GENEROUS_CAP_USD = 50;

interface FullStackOutput {
  taskPlan: TaskPlan;
  computationPlan: ComputationPlan;
  costGovernorReport: CostGovernorReport;
  escalation: EscalationReport;
  selfHealing: SelfHealingPlan;
  idempotencySaga: IdempotencySagaPlan;
  circuitBreaker: CircuitBreakerPlan;
}

// =============================================================================
// Helpers
// =============================================================================

/** Build a synthetic warm-cache IncrementalOptions from a primer pass. */
function buildWarmCacheOptions(
  primer: ComputationPlan,
  computedAtIso: string = new Date().toISOString(),
): IncrementalOptions {
  const accCtx: Record<string, unknown> = {};
  const meta: Partial<Record<TaskKind, CachedOutputMeta>> = {};
  for (const v of primer.computation_decision) {
    const canonicalMarker = TASK_OUTPUTS[v.kind][0];
    accCtx[canonicalMarker] = { content: 'cached-fixture' };
    meta[v.kind] = {
      input_fingerprint: v.computed_input_fingerprint,
      methodology_version: getMethodologyVersion(),
      computed_at: computedAtIso,
    };
  }
  return { accumulated_context: accCtx, cached_outputs_meta: meta };
}

/** Compose the entire stack against a session + plan + incremental options. */
async function runFullStack(
  sessionId: string,
  ticker: string,
  incrementalOpts: IncrementalOptions = {},
  budgetCapUsd = GENEROUS_CAP_USD,
): Promise<FullStackOutput> {
  // 1) Task planner
  const taskPlan = await runTaskPlanner(sessionId, { ticker });

  // 2) Incremental computation
  const computationPlan = await runIncrementalComputation(sessionId, taskPlan, incrementalOpts);

  // 3) Cost governor (consumes ComputationPlan so reuse is honored)
  const costGovernorReport = await runCostGovernor(sessionId, taskPlan, {
    ticker,
    current_session_cost_usd: 0,
    budget_cap_usd: budgetCapUsd,
    computation_plan: computationPlan,
  });

  // 4) Quality-os reads (consumed by escalation)
  const qualityBudget = computeQualityBudget(sessionId);
  const contradictionReport = detectContradictions(sessionId);
  const citationReport = detectCitationGaps(sessionId);
  const coverageReport = computeCoverageReport(sessionId);
  const chairmanReport = runDeterministicChairmanQuestions(sessionId, ticker);

  // 5) Escalation manager
  const escalation = await runEscalationManager(sessionId, {
    task_plan: taskPlan,
    computation_plan: computationPlan,
    cost_governor_report: costGovernorReport,
    quality_budget: qualityBudget,
    contradiction_report: contradictionReport,
    citation_report: citationReport,
    coverage_report: coverageReport,
    chairman_report: chairmanReport,
  }, { ticker });

  // 6) Self-healing
  const selfHealing = await runSelfHealingPipeline(sessionId, escalation, { ticker });

  // 7) Idempotency / saga — synthetic saga state from planned tasks (cold:
  //    every step pending; warm: every step completed with matching fp).
  const isWarm = (incrementalOpts.cached_outputs_meta !== undefined);
  const sagaSteps: SagaStepInput[] = taskPlan.planned_tasks.map((t) => {
    const kindFp = computationPlan.computation_decision.find(
      (v) => v.task_id === t.task_id,
    )?.computed_input_fingerprint ?? `fp-${t.task_id}`;
    return {
      step_id: t.task_id,
      kind: t.kind,
      fingerprint: kindFp,
      status: isWarm ? 'completed' : 'pending',
      has_compensating_action: false,
      is_idempotent: true,
      prior_result_fingerprint: isWarm ? kindFp : undefined,
    };
  });
  const idempotencySaga = await runIdempotencySaga(sessionId, { saga_steps: sagaSteps }, { ticker });

  // 8) Circuit breaker — synthetic operations from planned tasks (no history).
  const cbOps: OperationInput[] = taskPlan.planned_tasks.map((t) => ({
    operation_id: t.task_id,
    kind: t.kind,
    recent_attempts: [],
  }));
  const circuitBreaker = await runCircuitBreaker(sessionId, { operations: cbOps }, { ticker });

  return {
    taskPlan, computationPlan, costGovernorReport,
    escalation, selfHealing, idempotencySaga, circuitBreaker,
  };
}

/** Strip generated_at fields recursively for determinism comparisons. */
function normalize(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (k, v) => k === 'generated_at' ? null : v));
}

// =============================================================================
// Tests
// =============================================================================

const exists = db.prepare(`SELECT 1 AS x FROM analysis_sessions WHERE id = ?`)
  .get(KCHOL_SESSION) as { x?: number } | undefined;

describe('full-stack governance replay (Pre-P5 validation)', () => {
  it.skipIf(!exists?.x)('cold-cache: full stack composes without cross-layer crashes', async () => {
    const before = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
      .get(KCHOL_SESSION) as { total_cost_usd: number };

    const out = await runFullStack(KCHOL_SESSION, 'KCHOL');

    // -- Layer 1: Task planner ------------------------------------------------
    expect(out.taskPlan.session_id).toBe(KCHOL_SESSION);
    expect(out.taskPlan.ticker).toBe('KCHOL');
    expect(out.taskPlan.warnings).toEqual([]);
    // Planner emitted at least one reason code (overall code or per-task codes).
    expect(out.taskPlan.reason_codes.length).toBeGreaterThan(0);
    expect(out.taskPlan.planned_tasks.length).toBeGreaterThan(0);
    // Determinism: planner reason_codes are sorted-unique.
    expect([...out.taskPlan.reason_codes].sort()).toEqual(out.taskPlan.reason_codes);

    // -- Layer 2: Incremental (cold) ------------------------------------------
    expect(out.computationPlan.computation_decision.length).toBe(out.taskPlan.planned_tasks.length);
    // Cold cache: every verdict in {recompute, invalidate} (no reuse paths).
    for (const v of out.computationPlan.computation_decision) {
      expect(['recompute', 'invalidate']).toContain(v.decision);
      expect(v.reason_codes.length).toBeGreaterThanOrEqual(1);
      expect(v.computed_input_fingerprint).toMatch(/^[0-9a-f]{40}$/);
    }
    expect(out.computationPlan.estimated_cost_saved_usd).toBe(0);
    expect(out.computationPlan.warnings).toEqual([]);

    // -- Layer 3: Cost governor (generous cap) --------------------------------
    expect(out.costGovernorReport.budget_status).toBe('within_budget');
    expect(out.costGovernorReport.stop_reasons).toEqual([]);
    // Every allowed task carries a reason_code; sum invariant holds.
    for (const v of out.costGovernorReport.allowed_tasks) {
      expect(v.reason_codes.length).toBeGreaterThanOrEqual(1);
    }
    const sumEffective = out.costGovernorReport.allowed_tasks.reduce(
      (a, v) => a + v.effective_cost_usd, 0,
    );
    expect(out.costGovernorReport.projected_cost_usd).toBeCloseTo(sumEffective, 4);

    // -- Layer 4: Escalation manager -----------------------------------------
    // Coherence with governor: if governor emitted a stop reason, escalation
    // must have an abort-level finding referencing it. Generous cap → none.
    expect(out.escalation.findings.every((f) => f.reason_code.length > 0)).toBe(true);
    // Reason codes always include the overall code.
    const overallCodes = [
      ESCALATION_REASON_CODES.ESC_OVERALL_PROCEED,
      ESCALATION_REASON_CODES.ESC_OVERALL_PROCEED_WITH_WARNING,
      ESCALATION_REASON_CODES.ESC_OVERALL_REQUEST_REVIEW,
      ESCALATION_REASON_CODES.ESC_OVERALL_RETRY_OR_RECOMPUTE,
      ESCALATION_REASON_CODES.ESC_OVERALL_STOP_SESSION,
    ];
    expect(out.escalation.reason_codes.some((c) => overallCodes.includes(c as typeof overallCodes[number]))).toBe(true);
    // KCHOL is publishable* after P1B Wave 3 → expect non-abort.
    expect(['info', 'warning', 'needs_review']).toContain(out.escalation.escalation_level);
    expect(out.escalation.blockers).toEqual([]);

    // -- Layer 5: Self-healing -----------------------------------------------
    // Self-healing must emit one healing_action per per-source escalation finding.
    // (ESC_OVERALL_* codes are intentionally not mapped — verified in P4B tests.)
    const perSourceFindings = out.escalation.findings.filter(
      (f) => !f.reason_code.startsWith('ESC_OVERALL_'),
    );
    expect(out.selfHealing.healing_actions.length).toBe(perSourceFindings.length);
    // Healing actions never carry HEAL_ABORT_NO_RECOVERY here (no abort-level findings).
    expect(out.selfHealing.healing_actions.every(
      (a) => a.action_code !== HEALING_ACTION_CODES.HEAL_ABORT_NO_RECOVERY,
    )).toBe(true);
    expect(['fully_recoverable', 'partially_recoverable']).toContain(out.selfHealing.overall_recoverability);

    // -- Layer 6: Idempotency / saga -----------------------------------------
    // Cold-cache: every step is pending → all verdicts proceed_new.
    expect(out.idempotencySaga.idempotency_verdicts.length).toBe(out.taskPlan.planned_tasks.length);
    for (const v of out.idempotencySaga.idempotency_verdicts) {
      expect(v.decision).toBe('proceed_new');
      expect(v.reason_code).toBe(IDEMPO_REASON_CODES.IDEMPO_PROCEED_NEW_OPERATION);
    }
    expect(out.idempotencySaga.saga_status).toBe('success');
    expect(out.idempotencySaga.compensation_steps).toEqual([]);
    expect(out.idempotencySaga.reason_codes).toContain(SAGA_REASON_CODES.SAGA_STATUS_SUCCESS);

    // -- Layer 7: Circuit breaker --------------------------------------------
    // No history → CB_INSUFFICIENT_HISTORY everywhere; all closed/allow.
    expect(out.circuitBreaker.verdicts.length).toBe(out.taskPlan.planned_tasks.length);
    for (const v of out.circuitBreaker.verdicts) {
      expect(v.state).toBe('closed');
      expect(v.decision).toBe('allow');
      expect(v.reason_code).toBe(CIRCUIT_BREAKER_REASON_CODES.CB_INSUFFICIENT_HISTORY);
    }
    expect(out.circuitBreaker.any_open).toBe(false);
    expect(out.circuitBreaker.any_half_open).toBe(false);
    expect(out.circuitBreaker.blocked_kinds).toEqual([]);

    // -- DB unchanged ---------------------------------------------------------
    const after = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
      .get(KCHOL_SESSION) as { total_cost_usd: number };
    expect(after.total_cost_usd).toBe(before.total_cost_usd);
  });

  it.skipIf(!exists?.x)('cold-cache: deterministic across two consecutive composed runs', async () => {
    const a = await runFullStack(KCHOL_SESSION, 'KCHOL');
    const b = await runFullStack(KCHOL_SESSION, 'KCHOL');
    // Compare each layer's output (mod generated_at + nested timestamps).
    expect(normalize(a.taskPlan)).toEqual(normalize(b.taskPlan));
    expect(normalize(a.computationPlan)).toEqual(normalize(b.computationPlan));
    expect(normalize(a.costGovernorReport)).toEqual(normalize(b.costGovernorReport));
    expect(normalize(a.escalation)).toEqual(normalize(b.escalation));
    expect(normalize(a.selfHealing)).toEqual(normalize(b.selfHealing));
    expect(normalize(a.idempotencySaga)).toEqual(normalize(b.idempotencySaga));
    expect(normalize(a.circuitBreaker)).toEqual(normalize(b.circuitBreaker));
  });

  it.skipIf(!exists?.x)('warm-cache: reuse propagates from incremental → cost governor', async () => {
    const before = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
      .get(KCHOL_SESSION) as { total_cost_usd: number };

    // Cold pass to obtain primer fingerprints.
    const cold = await runFullStack(KCHOL_SESSION, 'KCHOL');
    const warmIncrementalOpts = buildWarmCacheOptions(cold.computationPlan);
    const warm = await runFullStack(KCHOL_SESSION, 'KCHOL', warmIncrementalOpts);

    // Layer 2: every verdict reuse with REUSE_HASH_MATCH.
    for (const v of warm.computationPlan.computation_decision) {
      expect(v.decision).toBe('reuse');
    }
    const expectedSavings = warm.taskPlan.planned_tasks.reduce(
      (s, t) => s + TASK_COST_USD[t.kind], 0,
    );
    expect(warm.computationPlan.estimated_cost_saved_usd).toBeCloseTo(expectedSavings, 4);

    // Layer 3: cost governor honors reuse → every allowed verdict carries
    // GOV_PROCEED_REUSE_HONORED with effective_cost_usd === 0.
    for (const v of warm.costGovernorReport.allowed_tasks) {
      expect(v.reason_codes).toContain(GOVERNOR_REASON_CODES.GOV_PROCEED_REUSE_HONORED);
      expect(v.effective_cost_usd).toBe(0);
      expect(v.cost_savings_usd).toBeCloseTo(v.original_cost_usd, 4);
    }
    expect(warm.costGovernorReport.projected_cost_usd).toBe(0);
    // Warm-cache projected cost is strictly less than cold-cache projected cost.
    expect(warm.costGovernorReport.projected_cost_usd)
      .toBeLessThan(cold.costGovernorReport.projected_cost_usd);

    // Layer 6: warm saga steps are 'completed' with matching fingerprints
    // → IDEMPO_SKIP_FINGERPRINT_MATCH.
    for (const v of warm.idempotencySaga.idempotency_verdicts) {
      expect(v.decision).toBe('skip_idempotent');
      expect(v.reason_code).toBe(IDEMPO_REASON_CODES.IDEMPO_SKIP_FINGERPRINT_MATCH);
    }

    // Determinism — warm run is also deterministic across two passes.
    const warm2 = await runFullStack(KCHOL_SESSION, 'KCHOL', warmIncrementalOpts);
    expect(normalize(warm.taskPlan)).toEqual(normalize(warm2.taskPlan));
    expect(normalize(warm.computationPlan)).toEqual(normalize(warm2.computationPlan));
    expect(normalize(warm.costGovernorReport)).toEqual(normalize(warm2.costGovernorReport));
    expect(normalize(warm.escalation)).toEqual(normalize(warm2.escalation));
    expect(normalize(warm.selfHealing)).toEqual(normalize(warm2.selfHealing));
    expect(normalize(warm.idempotencySaga)).toEqual(normalize(warm2.idempotencySaga));
    expect(normalize(warm.circuitBreaker)).toEqual(normalize(warm2.circuitBreaker));

    // DB unchanged
    const after = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
      .get(KCHOL_SESSION) as { total_cost_usd: number };
    expect(after.total_cost_usd).toBe(before.total_cost_usd);
  });

  it.skipIf(!exists?.x)('cross-layer reason-code coherence: governor-stop ⇔ escalation-abort', async () => {
    // Force stop_session by exhausting current session cost.
    const taskPlan = await runTaskPlanner(KCHOL_SESSION, { ticker: 'KCHOL' });
    const cgr = await runCostGovernor(KCHOL_SESSION, taskPlan, {
      ticker: 'KCHOL',
      current_session_cost_usd: 100,  // already over default cap of 5
      budget_cap_usd: 5,
    });
    expect(cgr.budget_status).toBe('exhausted');
    expect(cgr.stop_reasons).toContain(GOVERNOR_REASON_CODES.GOV_STOP_BUDGET_EXHAUSTED);

    const escalation = await runEscalationManager(KCHOL_SESSION, {
      task_plan: taskPlan,
      cost_governor_report: cgr,
    }, { ticker: 'KCHOL' });
    expect(escalation.escalation_level).toBe('abort');
    expect(escalation.action).toBe('stop_session');
    expect(escalation.findings.some(
      (f) => f.reason_code === ESCALATION_REASON_CODES.ESC_COST_BUDGET_EXHAUSTED,
    )).toBe(true);
    expect(escalation.blockers.length).toBeGreaterThanOrEqual(1);

    // Self-healing must report HEAL_ABORT_NO_RECOVERY for the cost-exhausted finding.
    const heal = await runSelfHealingPipeline(KCHOL_SESSION, escalation, { ticker: 'KCHOL' });
    expect(heal.overall_recoverability).toBe('not_recoverable');
    expect(heal.abort_actions.some(
      (a) => a.source_reason_code === ESCALATION_REASON_CODES.ESC_COST_BUDGET_EXHAUSTED
        && a.action_code === HEALING_ACTION_CODES.HEAL_ABORT_NO_RECOVERY,
    )).toBe(true);
  });

  it.skipIf(!exists?.x)('every layer emits ≥ 1 reason code; no warnings on clean KCHOL', async () => {
    const out = await runFullStack(KCHOL_SESSION, 'KCHOL');
    expect(out.taskPlan.reason_codes.length).toBeGreaterThan(0);
    // computationPlan reason codes are nested in verdicts, not at top level —
    // every verdict carries ≥ 1.
    for (const v of out.computationPlan.computation_decision) {
      expect(v.reason_codes.length).toBeGreaterThanOrEqual(1);
    }
    expect(out.costGovernorReport.reason_codes.length).toBeGreaterThan(0);
    expect(out.escalation.reason_codes.length).toBeGreaterThan(0);
    expect(out.selfHealing.reason_codes.length).toBeGreaterThan(0);
    expect(out.idempotencySaga.reason_codes.length).toBeGreaterThan(0);
    expect(out.circuitBreaker.reason_codes.length).toBeGreaterThan(0);

    // Warnings empty across all layers on clean KCHOL state.
    expect(out.taskPlan.warnings).toEqual([]);
    expect(out.computationPlan.warnings).toEqual([]);
    expect(out.costGovernorReport.warnings).toEqual([]);
    expect(out.escalation.findings.every((f) => f.details.length > 0)).toBe(true);
    expect(out.selfHealing.warnings).toEqual([]);
    expect(out.idempotencySaga.warnings).toEqual([]);
    expect(out.circuitBreaker.warnings).toEqual([]);
  });
});
