/**
 * Shadow Observation — Policy-vs-Runtime Drift Quantification
 *
 * Additive read-only test that, for every stored completed session of the
 * target tickers (KCHOL / THYAO / EREGL / ASELS), composes the standalone
 * P3/P4 governance stack via the existing helpers and computes per-session
 * + aggregate drift metrics against the runtime's actual outcomes recorded
 * in `analysis_sessions` and `agent_runs`.
 *
 * Design constraints:
 *   - Test-only — no source modifications.
 *   - DB read-only — `analysis_sessions.total_cost_usd` snapshot before/after
 *     equal for every session observed; verified explicitly.
 *   - No fresh runs — only stored sessions in {`completed`,
 *     `completed_with_warning`} are observed.
 *   - Drift is MEASURED, not failed on. The test passes regardless of how
 *     much policy-vs-runtime drift is observed; failures are reserved for
 *     structural defects (missing report keys, missing reason codes,
 *     non-determinism, DB mutation, layer crashes).
 *   - The drift summary is logged via console for operator inspection at
 *     test runtime. No artefact written to disk; no DB write.
 *
 * Outputs:
 *   - Per-session ShadowObservation record with 19 metrics.
 *   - Aggregate drift summary across all observed sessions.
 *   - false-abort and false-skip candidate counts.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../db.js';
import {
  recordSessionStartGovernance,
  recordSessionEndGovernance,
  FLAG_ENV_VAR,
  FLAG_ENABLED_VALUE,
} from '../orchestrator-governance.js';
import {
  runIncrementalComputation,
  type CachedOutputMeta,
} from './incremental.js';
import { TASK_OUTPUTS, TASK_COST_USD, type TaskKind, type TaskPlan } from './task-planner.js';
import type { ComputationPlan } from './incremental.js';
import type { CostGovernorReport } from './cost-governor.js';
import type { EscalationReport } from './escalation-manager.js';
import type { SelfHealingPlan } from './self-healing.js';
import type { CircuitBreakerPlan } from './circuit-breaker.js';
import { getMethodologyVersion } from '../fact-layer/methodology.js';

// =============================================================================
// Targets
// =============================================================================

const TARGET_TICKERS = ['KCHOL', 'THYAO', 'EREGL', 'ASELS'] as const;
const SESSIONS_PER_TICKER_CAP = 4;  // keep runtime bounded; deterministic by started_at DESC

// =============================================================================
// Per-session metric record
// =============================================================================

interface ShadowObservation {
  session_id: string;
  ticker: string;
  runtime_status: string;
  // governance presence
  governance_reports_generated: number;
  // escalation
  escalation_level: string;
  escalation_action: string;
  escalation_blockers_count: number;
  // governor
  governor_budget_status: string;
  governor_projected_cost_usd: number;
  governor_actual_cost_usd: number;
  governor_drift_usd: number;
  governor_downgrade_count: number;
  governor_stop_reasons: string[];
  // planner / runtime
  planner_planned_count: number;
  planner_skipped_count: number;
  runtime_executed_count: number;
  planner_drift_count: number;
  // incremental
  cold_recompute_count: number;
  warm_reuse_count: number;
  warm_reuse_savings_usd: number;
  // circuit breaker
  circuit_breaker_open_count: number;
  // self-healing
  self_healing_recoverability: string;
  self_healing_auto_count: number;
  self_healing_manual_count: number;
  self_healing_abort_count: number;
  // drift roll-up
  policy_vs_runtime_drift_count: number;
  drift_dimensions_fired: string[];
  // performance
  replay_runtime_ms: number;
}

// =============================================================================
// Helpers
// =============================================================================

interface CompletedSessionRow { id: string; ticker: string; status: string; total_cost_usd: number; }

function listObservableSessions(): CompletedSessionRow[] {
  // Query stored completed sessions ordered deterministically (started_at DESC).
  const placeholders = TARGET_TICKERS.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT id, ticker, status, total_cost_usd
       FROM analysis_sessions
      WHERE ticker IN (${placeholders})
        AND status IN ('completed', 'completed_with_warning')
      ORDER BY ticker ASC, started_at DESC`
  ).all(...TARGET_TICKERS) as CompletedSessionRow[];

  // Cap per-ticker to keep test runtime bounded; choose latest sessions deterministically.
  const byTicker = new Map<string, CompletedSessionRow[]>();
  for (const r of rows) {
    const list = byTicker.get(r.ticker) ?? [];
    if (list.length < SESSIONS_PER_TICKER_CAP) list.push(r);
    byTicker.set(r.ticker, list);
  }
  return Array.from(byTicker.values()).flat();
}

/** Synthetic warm-cache options derived from a primer ComputationPlan. */
function buildWarmCacheOptions(primer: ComputationPlan, computedAtIso: string): {
  accumulated_context: Record<string, unknown>;
  cached_outputs_meta: Partial<Record<TaskKind, CachedOutputMeta>>;
} {
  const accumulated_context: Record<string, unknown> = {};
  const cached_outputs_meta: Partial<Record<TaskKind, CachedOutputMeta>> = {};
  for (const v of primer.computation_decision) {
    accumulated_context[TASK_OUTPUTS[v.kind][0]] = { content: 'cached-shadow-fixture' };
    cached_outputs_meta[v.kind] = {
      input_fingerprint: v.computed_input_fingerprint,
      methodology_version: getMethodologyVersion(),
      computed_at: computedAtIso,
    };
  }
  return { accumulated_context, cached_outputs_meta };
}

function countCompletedAgentRuns(sessionId: string): number {
  const r = db.prepare(
    `SELECT COUNT(*) AS c FROM agent_runs WHERE session_id = ? AND status = 'completed'`
  ).get(sessionId) as { c: number };
  return r.c;
}

function snapshotTotalCost(sessionId: string): number {
  const r = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
    .get(sessionId) as { total_cost_usd: number };
  return r.total_cost_usd;
}

function normalizeForDeterminism(value: unknown): string {
  return JSON.stringify(value, (k, v) => k === 'generated_at' ? null : v);
}

/** Read the most recent entry of an append-only log key in accumulatedContext. */
function readLatest<T>(ctx: Record<string, unknown>, key: string): T | undefined {
  const log = ctx[key];
  if (!Array.isArray(log) || log.length === 0) return undefined;
  return log[log.length - 1] as T;
}

// =============================================================================
// Per-session observation
// =============================================================================

async function observeSession(row: CompletedSessionRow): Promise<ShadowObservation> {
  const before = snapshotTotalCost(row.id);
  const t0 = Date.now();

  // Compose the shadow stack via the existing helpers (write to a fresh ctx).
  const ctx: Record<string, unknown> = {};
  await recordSessionStartGovernance(row.id, row.ticker, ctx);
  await recordSessionEndGovernance(row.id, row.ticker, before, ctx);

  // Determinism check — second pass on a fresh ctx must produce identical
  // structural reports (mod generated_at + nested timestamps).
  const ctx2: Record<string, unknown> = {};
  await recordSessionStartGovernance(row.id, row.ticker, ctx2);
  await recordSessionEndGovernance(row.id, row.ticker, before, ctx2);
  const REPORT_KEYS = [
    'task_plan', 'computation_plan', 'cost_governor_report',
    'escalation_report', 'self_healing_plan', 'idempotency_saga_plan',
    'circuit_breaker_plan',
  ];
  for (const k of REPORT_KEYS) {
    expect(normalizeForDeterminism(ctx[k])).toBe(normalizeForDeterminism(ctx2[k]));
  }

  const replay_runtime_ms = Date.now() - t0;

  // -- Pull the report objects ------------------------------------------------
  const taskPlan = readLatest<TaskPlan>(ctx, 'task_plan');
  const computationPlan = readLatest<ComputationPlan>(ctx, 'computation_plan');
  const costGovernor = readLatest<CostGovernorReport>(ctx, 'cost_governor_report');
  const escalation = readLatest<EscalationReport>(ctx, 'escalation_report');
  const selfHealing = readLatest<SelfHealingPlan>(ctx, 'self_healing_plan');
  const circuitBreaker = readLatest<CircuitBreakerPlan>(ctx, 'circuit_breaker_plan');

  // -- Structural invariants (failure-on-defect) ------------------------------
  const generated = REPORT_KEYS.filter((k) => Array.isArray(ctx[k]) && (ctx[k] as unknown[]).length > 0).length;
  expect(generated).toBe(7);
  expect(taskPlan).toBeDefined();
  expect(computationPlan).toBeDefined();
  expect(costGovernor).toBeDefined();
  expect(escalation).toBeDefined();
  expect(selfHealing).toBeDefined();
  expect(circuitBreaker).toBeDefined();

  // Every report must carry ≥ 1 reason code somewhere.
  expect(taskPlan!.reason_codes.length).toBeGreaterThan(0);
  for (const v of computationPlan!.computation_decision) {
    expect(v.reason_codes.length).toBeGreaterThanOrEqual(1);
  }
  expect(costGovernor!.reason_codes.length).toBeGreaterThan(0);
  expect(escalation!.reason_codes.length).toBeGreaterThan(0);
  expect(selfHealing!.reason_codes.length).toBeGreaterThan(0);
  expect(circuitBreaker!.reason_codes.length).toBeGreaterThan(0);

  // -- Warm-cache simulation (separate pass; observational only) -------------
  const computedAtIso = new Date().toISOString();
  const warmOpts = buildWarmCacheOptions(computationPlan!, computedAtIso);
  const warmPlan = await runIncrementalComputation(row.id, taskPlan!, warmOpts);
  const warm_reuse_count = warmPlan.computation_decision.filter((v) => v.decision === 'reuse').length;
  const warm_reuse_savings_usd = warmPlan.computation_decision
    .filter((v) => v.decision === 'reuse')
    .reduce((acc, v) => acc + TASK_COST_USD[v.kind], 0);

  // -- Cold-cache invariant: zero reuse, RECOMPUTE codes everywhere ----------
  const cold_recompute_count = computationPlan!.computation_decision.filter(
    (v) => v.decision === 'recompute' || v.decision === 'invalidate',
  ).length;

  // -- Runtime facts ----------------------------------------------------------
  const runtime_executed_count = countCompletedAgentRuns(row.id);
  const planner_planned_count = taskPlan!.planned_tasks.length;
  const planner_skipped_count = taskPlan!.skipped_tasks.length;
  const planner_drift_count = runtime_executed_count - planner_planned_count;

  // -- Drift dimensions -------------------------------------------------------
  const dimensions: string[] = [];
  // 1) cost-cap drift: governor would have stopped, runtime didn't.
  const governorStopped = costGovernor!.budget_status === 'exhausted'
    || costGovernor!.budget_status === 'over_budget'
    || costGovernor!.stop_reasons.length > 0;
  if (governorStopped) dimensions.push('governor_stop_runtime_completed');
  // 2) escalation abort vs runtime completion.
  if (escalation!.escalation_level === 'abort') dimensions.push('escalation_abort_runtime_completed');
  // 3) planner-skipped tasks the runtime executed.
  const skippedKinds = new Set(taskPlan!.skipped_tasks.map((t) => t.kind));
  // Map TaskKind 1:1 to agent_id for false-skip detection.
  const skippedAgentIds = Array.from(skippedKinds);
  let false_skip_hits = 0;
  for (const aid of skippedAgentIds) {
    const r = db.prepare(
      `SELECT 1 AS x FROM agent_runs WHERE session_id = ? AND agent_id = ? AND status = 'completed'`
    ).get(row.id, aid) as { x?: number } | undefined;
    if (r?.x) false_skip_hits++;
  }
  if (false_skip_hits > 0) dimensions.push('planner_skipped_runtime_executed');
  // 4) reuse savings unrealized.
  if (warm_reuse_savings_usd > 0) dimensions.push('reuse_savings_unrealized');
  // 5) downgrade recommended.
  if (costGovernor!.downgraded_tasks.length > 0) dimensions.push('governor_downgrade_recommended');

  // -- DB-unchanged check (must always hold) ----------------------------------
  const after = snapshotTotalCost(row.id);
  expect(after).toBe(before);

  return {
    session_id: row.id,
    ticker: row.ticker,
    runtime_status: row.status,
    governance_reports_generated: generated,
    escalation_level: escalation!.escalation_level,
    escalation_action: escalation!.action,
    escalation_blockers_count: escalation!.blockers.length,
    governor_budget_status: costGovernor!.budget_status,
    governor_projected_cost_usd: costGovernor!.projected_cost_usd,
    governor_actual_cost_usd: before,
    governor_drift_usd: round4(before - costGovernor!.projected_cost_usd),
    governor_downgrade_count: costGovernor!.downgraded_tasks.length,
    governor_stop_reasons: costGovernor!.stop_reasons.slice(),
    planner_planned_count,
    planner_skipped_count,
    runtime_executed_count,
    planner_drift_count,
    cold_recompute_count,
    warm_reuse_count,
    warm_reuse_savings_usd: round4(warm_reuse_savings_usd),
    circuit_breaker_open_count: circuitBreaker!.verdicts.filter((v) => v.state === 'open').length,
    self_healing_recoverability: selfHealing!.overall_recoverability,
    self_healing_auto_count: selfHealing!.auto_heal_actions.length,
    self_healing_manual_count: selfHealing!.manual_heal_actions.length,
    self_healing_abort_count: selfHealing!.abort_actions.length,
    policy_vs_runtime_drift_count: dimensions.length,
    drift_dimensions_fired: dimensions,
    replay_runtime_ms,
  };
}

function round4(n: number): number { return Math.round(n * 10000) / 10000; }

// =============================================================================
// Test suite
// =============================================================================

describe('shadow-observation — policy-vs-runtime drift across stored sessions', () => {
  const observations: ShadowObservation[] = [];
  const targets = listObservableSessions();

  beforeAll(() => {
    process.env[FLAG_ENV_VAR] = FLAG_ENABLED_VALUE;
  });
  afterAll(() => {
    delete process.env[FLAG_ENV_VAR];
    // -- Aggregate summary (printed for operator inspection; never fails) ----
    if (observations.length === 0) return;
    const tickerCoverage = new Map<string, number>();
    for (const o of observations) tickerCoverage.set(o.ticker, (tickerCoverage.get(o.ticker) ?? 0) + 1);
    const total = observations.length;
    const falseAbort = observations.filter(
      (o) => (o.escalation_level === 'abort' || o.governor_budget_status === 'exhausted'
        || o.governor_budget_status === 'over_budget')
        && (o.runtime_status === 'completed' || o.runtime_status === 'completed_with_warning'),
    ).length;
    const falseSkip = observations.filter(
      (o) => o.drift_dimensions_fired.includes('planner_skipped_runtime_executed'),
    ).length;
    const aggregateCostDrift = round4(observations.reduce((a, o) => a + o.governor_drift_usd, 0));
    const reuseSavingsTotal = round4(observations.reduce((a, o) => a + o.warm_reuse_savings_usd, 0));
    const noisyEscalation = observations.filter(
      (o) => o.escalation_level === 'needs_review' || o.escalation_level === 'hold' || o.escalation_level === 'abort',
    ).length;

    const lines = [
      `\n=== Shadow Observation Aggregate Summary ===`,
      `Total sessions observed: ${total}`,
      `Per-ticker coverage: ${Array.from(tickerCoverage.entries()).map(([t, n]) => `${t}=${n}`).join(', ')}`,
      `--- DRIFT INDICATORS ---`,
      `false-abort candidates (policy aborts, runtime completed): ${falseAbort} / ${total} (${(falseAbort / total * 100).toFixed(0)}%)`,
      `false-skip candidates  (planner skipped, runtime executed): ${falseSkip} / ${total} (${(falseSkip / total * 100).toFixed(0)}%)`,
      `noisy escalation rate  (≥ needs_review):                    ${noisyEscalation} / ${total} (${(noisyEscalation / total * 100).toFixed(0)}%)`,
      `aggregate cost drift   (Σ actual − projected):              $${aggregateCostDrift.toFixed(4)}`,
      `aggregate reuse savings if warm cache available:            $${reuseSavingsTotal.toFixed(4)}`,
      `--- PER-SESSION DETAIL ---`,
    ];
    for (const o of observations) {
      lines.push(
        `[${o.ticker}] ${o.session_id.slice(0, 12)} ` +
        `runtime=${o.runtime_status} actual=$${o.governor_actual_cost_usd.toFixed(4)} ` +
        `policy: budget=${o.governor_budget_status} esc=${o.escalation_level}/${o.escalation_action} ` +
        `planner=${o.planner_planned_count}p+${o.planner_skipped_count}s exec=${o.runtime_executed_count} ` +
        `reuse-pot=${o.warm_reuse_count}/$${o.warm_reuse_savings_usd.toFixed(2)} ` +
        `heal=${o.self_healing_recoverability} ` +
        `drift=${o.policy_vs_runtime_drift_count}[${o.drift_dimensions_fired.join(',')}] ` +
        `${o.replay_runtime_ms}ms`,
      );
    }
    console.log(lines.join('\n'));
  });

  // ---------------------------------------------------------------------------
  // Coverage skip
  // ---------------------------------------------------------------------------
  it('observes at least one stored completed session', () => {
    expect(targets.length).toBeGreaterThan(0);
    if (targets.length < TARGET_TICKERS.length) {
      const missing = TARGET_TICKERS.filter((t) => !targets.some((r) => r.ticker === t));
      console.log(`[shadow-observation] partial coverage — no stored sessions for: ${missing.join(', ')}`);
    }
  });

  // ---------------------------------------------------------------------------
  // Per-session observation — one assertion block per session
  // ---------------------------------------------------------------------------
  for (const row of targets) {
    it(`composes governance + computes drift for ${row.ticker} ${row.id.slice(0, 10)}`, async () => {
      const obs = await observeSession(row);
      observations.push(obs);

      // Structural invariants — these MUST hold; drift values are observational.
      expect(obs.governance_reports_generated).toBe(7);
      expect(['info', 'warning', 'needs_review', 'hold', 'abort']).toContain(obs.escalation_level);
      expect(['proceed', 'proceed_with_warning', 'request_review',
              'retry_or_recompute', 'stop_session']).toContain(obs.escalation_action);
      expect(['within_budget', 'tight', 'over_budget', 'exhausted']).toContain(obs.governor_budget_status);
      expect(['fully_recoverable', 'partially_recoverable', 'not_recoverable'])
        .toContain(obs.self_healing_recoverability);
      // Replay must complete in reasonable time (sub-2s composing 7 engines).
      expect(obs.replay_runtime_ms).toBeLessThan(2000);
    });
  }

  // ---------------------------------------------------------------------------
  // Aggregate structural invariants — never fails on drift values
  // ---------------------------------------------------------------------------
  it('aggregate invariants hold across all observed sessions', () => {
    if (observations.length === 0) return;
    // Every session produced 7 reports.
    expect(observations.every((o) => o.governance_reports_generated === 7)).toBe(true);
    // Cold-cache verdicts: every session's cold pass had recompute count
    // equal to planner_planned_count (deterministic policy under no cache).
    for (const o of observations) {
      expect(o.cold_recompute_count).toBe(o.planner_planned_count);
    }
    // Self-healing abort actions are never empty when escalation is 'abort'.
    for (const o of observations) {
      if (o.escalation_level === 'abort') {
        expect(o.self_healing_abort_count + o.escalation_blockers_count).toBeGreaterThan(0);
      }
    }
    // Drift dimensions are a subset of the known set.
    const KNOWN = new Set([
      'governor_stop_runtime_completed',
      'escalation_abort_runtime_completed',
      'planner_skipped_runtime_executed',
      'reuse_savings_unrealized',
      'governor_downgrade_recommended',
    ]);
    for (const o of observations) {
      for (const d of o.drift_dimensions_fired) {
        expect(KNOWN.has(d)).toBe(true);
      }
    }
  });
});
