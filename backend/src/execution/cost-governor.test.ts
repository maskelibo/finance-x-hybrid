/**
 * P3D Wave 1 — adaptive cost governor tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  runCostGovernor,
  recordCostGovernorReport,
  GOVERNOR_REASON_CODES,
  COST_GOVERNOR_CONTEXT_KEYS,
  MODEL_TIER_MULTIPLIERS,
  type BudgetVerdict,
  type CostGovernorReport,
} from './cost-governor.js';
import {
  runTaskPlanner,
  TASK_COST_USD,
  type TaskKind,
  type TaskPlan,
} from './task-planner.js';
import { runIncrementalComputation } from './incremental.js';
import { upsertFact, type FactSource } from '../fact-layer/store.js';
import { getMethodologyVersion, recordSessionMethodology } from '../fact-layer/methodology.js';

// =============================================================================
// Fixtures
// =============================================================================

const sessions: string[] = [];

function makeSession(ticker = 'KCHOL'): string {
  const id = `gv-${nanoid(8)}`;
  db.prepare(
    `INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at)
     VALUES (?, ?, 'standard_institutional', 'pending', ?)`,
  ).run(id, ticker, new Date().toISOString());
  sessions.push(id);
  return id;
}

afterEach(() => {
  while (sessions.length > 0) {
    const id = sessions.pop()!;
    db.prepare(`DELETE FROM session_methodology WHERE session_id = ?`).run(id);
    db.prepare(`DELETE FROM lineage_nodes WHERE session_id = ?`).run(id);
    db.prepare(`DELETE FROM canonical_facts WHERE session_id = ?`).run(id);
    db.prepare(`DELETE FROM analysis_sessions WHERE id = ?`).run(id);
  }
});

const docSrc: FactSource = {
  type: 'document', doc_id: 'D', extracted_at: '2026-04-29T10:00:00Z', freshness_days: 5,
};

function insertLineage(
  sid: string, factKey: string, agent: string,
  sourceDoc: string | null = null, normalized: number | null = null,
): void {
  db.prepare(
    `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, normalized_value, source_doc_id)
     VALUES (?, ?, ?, 'raw_extracted', ?, '2026-04-29T10:00:00Z', ?, ?)`,
  ).run(sid, factKey, `ln-${nanoid(10)}`, agent, normalized !== null ? JSON.stringify(normalized) : null, sourceDoc);
}

function makePublishableSession(): string {
  const sid = makeSession();
  recordSessionMethodology(sid);
  const cited: Array<[string, number]> = [
    ['revenue_fy2025', 100], ['ebitda_fy2025', 30], ['net_debt_fy2025', 10],
    ['fcf_fy2025', 20], ['roe_fy2025', 0.15],
    ['net_debt_to_ebitda_fy2025', 0.33], ['net_income_fy2025', 18],
  ];
  for (const [k, v] of cited) {
    upsertFact({
      session_id: sid, fact_key: k, value: v, unit: 'TRY_mn',
      sources: [docSrc],
      confidence_inputs: {
        sources: [{ type: 'document', doc_id: 'D', extracted_at: '2026-04-29T10:00:00Z', freshness_days: 5 }],
        computation_complexity: 0,
      },
    });
    insertLineage(sid, k, 'parse_standardization', 'KCHOL_FY2025_AR.pdf', v);
  }
  return sid;
}

function emptyTaskPlan(sid: string): TaskPlan {
  return {
    session_id: sid, ticker: 'KCHOL', generated_at: 'x',
    planned_tasks: [], skipped_tasks: [], total_estimated_cost_usd: 0,
    reason_codes: [], warnings: [],
  };
}

function findVerdict(report: CostGovernorReport, kind: TaskKind): BudgetVerdict | undefined {
  return [
    ...report.allowed_tasks,
    ...report.downgraded_tasks,
    ...report.skipped_tasks,
  ].find((v) => v.kind === kind);
}

// =============================================================================
// Smoke
// =============================================================================

describe('cost-governor — smoke', () => {
  it('async signature returns Promise', () => {
    const sid = makeSession();
    const ret = runCostGovernor(sid, emptyTaskPlan(sid));
    expect(ret).toBeInstanceOf(Promise);
  });

  it('empty TaskPlan → within_budget, all lists empty', async () => {
    const sid = makeSession();
    const r = await runCostGovernor(sid, emptyTaskPlan(sid));
    expect(r.budget_status).toBe('within_budget');
    expect(r.allowed_tasks).toEqual([]);
    expect(r.downgraded_tasks).toEqual([]);
    expect(r.skipped_tasks).toEqual([]);
    expect(r.stop_reasons).toEqual([]);
    expect(r.projected_cost_usd).toBe(0);
    expect(r.estimated_savings_usd).toBe(0);
  });

  it('deterministic output modulo generated_at', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const a = await runCostGovernor(sid, plan, { budget_cap_usd: 50 });
    const b = await runCostGovernor(sid, plan, { budget_cap_usd: 50 });
    const norm = (p: CostGovernorReport): unknown =>
      JSON.parse(JSON.stringify(p, (k, v) => k === 'generated_at' ? null : v));
    expect(norm(a)).toEqual(norm(b));
  });
});

// =============================================================================
// Decision rules — one positive per GOV_* code
// =============================================================================

describe('cost-governor — decision rules', () => {
  it('GOV_PROCEED_WITHIN_BUDGET — generous cap, all tasks proceed', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: 50 });
    for (const v of r.allowed_tasks) {
      expect(v.reason_codes).toContain(GOVERNOR_REASON_CODES.GOV_PROCEED_WITHIN_BUDGET);
      expect(v.decision).toBe('proceed');
    }
    expect(r.budget_status).toBe('within_budget');
    expect(r.downgraded_tasks).toEqual([]);
  });

  it('GOV_PROCEED_REUSE_HONORED — P3C reuse verdicts honored', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    // Build a synthetic ComputationPlan with all reuse verdicts.
    const cp = await runIncrementalComputation(sid, plan, {});
    // Override decision='reuse' for every entry
    const fakeReuse = {
      ...cp,
      computation_decision: cp.computation_decision.map((v) => ({
        ...v, decision: 'reuse' as const,
        reason_codes: ['REUSE_HASH_MATCH'],
        invalidation_reasons: ['x'],
        reused_output_keys: [],
        dirty_sub_keys: [],
        estimated_cost_saved_usd: TASK_COST_USD[v.kind],
      })),
    };
    const r = await runCostGovernor(sid, plan, { computation_plan: fakeReuse, budget_cap_usd: 50 });
    for (const v of r.allowed_tasks) {
      expect(v.reason_codes).toContain(GOVERNOR_REASON_CODES.GOV_PROCEED_REUSE_HONORED);
      expect(v.effective_cost_usd).toBe(0);
      expect(v.cost_savings_usd).toBe(v.original_cost_usd);
    }
  });

  it('GOV_DOWNGRADE_MODEL_TIER — tight cap forces highest-cost task to economy', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    // Total = sum of TASK_COST_USD for planned. Set cap just below total
    // so exactly one downgrade resolves it (or close to it).
    const total = plan.planned_tasks.reduce((a, t) => a + TASK_COST_USD[t.kind], 0);
    // Highest-cost task: val_dcf=0.80. Demoted to 0.32 → savings 0.48.
    // Cap = total - 0.6 leaves 0.6 deficit; one demote saves 0.48 (insufficient
    // for closing 0.6 deficit alone). Use cap = total - 0.4 → deficit 0.4 →
    // single demote suffices.
    const cap = total - 0.4;
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: cap });
    expect(r.downgraded_tasks.length).toBeGreaterThanOrEqual(1);
    for (const v of r.downgraded_tasks) {
      expect(v.decision).toBe('downgrade_model');
      expect(v.reason_codes).toContain(GOVERNOR_REASON_CODES.GOV_DOWNGRADE_MODEL_TIER);
      expect(v.recommended_model_tier).toBe('economy');
      expect(v.effective_cost_usd).toBeCloseTo(v.original_cost_usd * MODEL_TIER_MULTIPLIERS.economy, 4);
    }
    // Highest-cost task is val_dcf (0.80) — should be the FIRST target.
    expect(r.downgraded_tasks[0].kind).toBe('val_dcf');
  });

  it('GOV_SKIP_OPTIONAL_TASK — drops low-priority task after downgrade exhausted', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    // Force tight cap that even full downgrade can't close → skip-optional path.
    // Total ~ 1.95. Min after all downgrades = total × 0.4 = 0.78. Set cap = 0.6.
    // Some optional/normal-priority tasks must be dropped.
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: 0.6 });
    const skippedOptional = r.skipped_tasks.filter((v) =>
      v.reason_codes.includes(GOVERNOR_REASON_CODES.GOV_SKIP_OPTIONAL_TASK),
    );
    expect(skippedOptional.length).toBeGreaterThan(0);
  });

  it('GOV_REUSE_ONLY_MODE — fallback when downgrade+skip-optional cannot fit', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const cp = await runIncrementalComputation(sid, plan, {});
    // Mark val_dcf as reuse; everything else as recompute.
    const mixed = {
      ...cp,
      computation_decision: cp.computation_decision.map((v) => ({
        ...v,
        decision: v.kind === 'val_dcf' ? ('reuse' as const) : ('recompute' as const),
        reason_codes: v.kind === 'val_dcf' ? ['REUSE_HASH_MATCH'] : ['RECOMPUTE_NO_CACHE'],
        invalidation_reasons: ['x'],
        reused_output_keys: [],
        dirty_sub_keys: [],
        estimated_cost_saved_usd: v.kind === 'val_dcf' ? TASK_COST_USD['val_dcf'] : 0,
      })),
    };
    // Cap so tight that even all-economy + dropping all optional tasks isn't enough.
    // Force critical-priority tasks to remain too expensive: e.g. cap = 0.05.
    const r = await runCostGovernor(sid, plan, {
      computation_plan: mixed, budget_cap_usd: 0.05,
    });
    const valDcfVerdict = findVerdict(r, 'val_dcf');
    if (valDcfVerdict) {
      expect(valDcfVerdict.decision).toBe('reuse_only');
      expect(valDcfVerdict.reason_codes).toContain(GOVERNOR_REASON_CODES.GOV_REUSE_ONLY_MODE);
    }
    // Non-reuse tasks should be skipped under GOV_REUSE_ONLY_MODE.
    const nonReuseSkips = r.skipped_tasks.filter((v) =>
      v.kind !== 'val_dcf' && v.reason_codes.includes(GOVERNOR_REASON_CODES.GOV_REUSE_ONLY_MODE),
    );
    expect(nonReuseSkips.length).toBeGreaterThan(0);
  });

  it('GOV_STOP_BUDGET_EXHAUSTED — current >= cap before any planning', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const r = await runCostGovernor(sid, plan, {
      current_session_cost_usd: 6, budget_cap_usd: 5,
    });
    expect(r.budget_status).toBe('exhausted');
    expect(r.stop_reasons).toContain(GOVERNOR_REASON_CODES.GOV_STOP_BUDGET_EXHAUSTED);
    for (const v of r.skipped_tasks) {
      expect(v.decision).toBe('stop_session');
      expect(v.reason_codes).toContain(GOVERNOR_REASON_CODES.GOV_STOP_BUDGET_EXHAUSTED);
    }
    expect(r.allowed_tasks).toEqual([]);
  });

  it('GOV_STOP_NO_VIABLE_PLAN — every adaptive path exhausted, no reuse available', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    // No ComputationPlan supplied (no reuse-only path), tight cap so even
    // economy + skip-all-optional cannot fit. Plan has critical tasks
    // (parse-standardization isn't in a publishable plan; reconciliation
    // shouldn't fire). Make scenario: cap so small that even one residual
    // critical/high task costs more than cap.
    const total = plan.planned_tasks.reduce((a, t) => a + TASK_COST_USD[t.kind], 0);
    // Use very tight cap: total × 0.4 (full economy) is the minimum achievable
    // without skips. After all skips of optional tasks, only critical/high
    // remain. If their sum × 0.4 still > cap → stop_session.
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: total * 0.01 });
    expect(r.stop_reasons).toContain(GOVERNOR_REASON_CODES.GOV_STOP_NO_VIABLE_PLAN);
    expect(r.budget_status).toBe('over_budget');
  });

  it('GOV_STOP_PREFLIGHT_ABORT_CHAIN — every preflight aborts (evaluate_preflight=true)', async () => {
    const sid = makePublishableSession();
    // Build a TaskPlan where every preflight_hint will return abort by passing
    // an unknown ticker into the preflight_hint via the planner.
    const plan = await runTaskPlanner(sid, { ticker: 'XXNOTREAL', valuation_requested: true });
    // Planner already short-circuits: with unknown ticker, every task lands
    // in skipped_tasks (SKIP_PREFLIGHT_ABORT) so plan.planned_tasks is empty.
    // For the preflight-abort chain test we need planned_tasks non-empty but
    // each hint yielding abort. Easiest: bypass planner and craft a synthetic
    // plan with hints carrying ticker='XXNOTREAL'.
    const synthetic: TaskPlan = {
      session_id: sid, ticker: 'KCHOL', generated_at: 'x',
      planned_tasks: [
        {
          task_id: 'tp-x-1', kind: 'parse_standardization',
          priority: 'critical', reason_codes: ['PLAN_NO_FACTS'],
          required_predecessors: [], expected_output_keys: ['parse_standardization'],
          estimated_cost_usd: 0.20,
          preflight_hint: {
            session_id: sid, ticker: 'XXNOTREAL',
            call_target: { kind: 'agent', id: 'parse_standardization' },
            expected_output_keys: ['parse_standardization'],
            accumulated_context: {}, estimated_cost_usd: 0.20,
            current_session_cost_usd: 0, budget_cap_usd: 5,
            phase: 'parse_standardization', required_predecessor_phases: [],
          },
        },
      ],
      skipped_tasks: [], total_estimated_cost_usd: 0.20,
      reason_codes: [], warnings: [],
    };
    void plan;
    const r = await runCostGovernor(sid, synthetic, {
      budget_cap_usd: 5, evaluate_preflight: true,
    });
    expect(r.stop_reasons).toContain(GOVERNOR_REASON_CODES.GOV_STOP_PREFLIGHT_ABORT_CHAIN);
    expect(r.budget_status).toBe('exhausted');
  });

  it('GOV_TIGHT_HEADROOM_BELOW_TEN_PERCENT — finalized plan leaves <10% headroom', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const total = plan.planned_tasks.reduce((a, t) => a + TASK_COST_USD[t.kind], 0);
    // cap just slightly above total → tight-headroom guard fires.
    const cap = total + 0.05; // remaining = 0.05 << 10% of cap (~0.17 if cap≈1.7)
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: cap });
    expect(r.budget_status).toBe('tight');
    expect(r.reason_codes).toContain(GOVERNOR_REASON_CODES.GOV_TIGHT_HEADROOM_BELOW_TEN_PERCENT);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Adaptive ladder
// =============================================================================

describe('cost-governor — adaptive ladder', () => {
  it('within-budget: no adaptation (no downgrade, no skip, no stop)', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: 50 });
    expect(r.downgraded_tasks).toEqual([]);
    expect(r.skipped_tasks.filter((v) =>
      v.reason_codes.includes(GOVERNOR_REASON_CODES.GOV_SKIP_OPTIONAL_TASK)
      || v.reason_codes.includes(GOVERNOR_REASON_CODES.GOV_REUSE_ONLY_MODE),
    )).toEqual([]);
    expect(r.stop_reasons).toEqual([]);
  });

  it('downgrade picks highest-cost task first (alphabetical tie-break stable)', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const total = plan.planned_tasks.reduce((a, t) => a + TASK_COST_USD[t.kind], 0);
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: total - 0.4 });
    // First downgrade should be val_dcf (cost 0.80, the highest among planned)
    expect(r.downgraded_tasks[0].kind).toBe('val_dcf');
  });

  it('skip-optional activates after downgrade exhausted', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    // Cap so tight even all economy can't fit → skip-optional must engage.
    // total × 0.4 = 0.78. cap=0.6 → skip needed.
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: 0.6 });
    const downgraded = r.downgraded_tasks.length;
    const skippedOptional = r.skipped_tasks.filter((v) =>
      v.reason_codes.includes(GOVERNOR_REASON_CODES.GOV_SKIP_OPTIONAL_TASK),
    ).length;
    // Either at least one downgrade fired AND at least one skip, or skip alone
    // closed the deficit. Tight cap → both layers exercised.
    expect(downgraded + skippedOptional).toBeGreaterThan(0);
    // Skip-optional must have engaged (since downgrade alone insufficient).
    expect(skippedOptional).toBeGreaterThan(0);
  });
});

// =============================================================================
// Budget status mapping
// =============================================================================

describe('cost-governor — budget_status mapping', () => {
  it('within_budget when projected leaves >10% headroom', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: 100 });
    expect(r.budget_status).toBe('within_budget');
  });

  it('tight when remaining < 10% of cap', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const total = plan.planned_tasks.reduce((a, t) => a + TASK_COST_USD[t.kind], 0);
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: total + 0.05 });
    expect(r.budget_status).toBe('tight');
  });

  it('over_budget when stop-session terminal fires', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const total = plan.planned_tasks.reduce((a, t) => a + TASK_COST_USD[t.kind], 0);
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: total * 0.01 });
    expect(r.budget_status).toBe('over_budget');
  });

  it('exhausted when current_session_cost_usd >= cap', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const r = await runCostGovernor(sid, plan, {
      current_session_cost_usd: 10, budget_cap_usd: 5,
    });
    expect(r.budget_status).toBe('exhausted');
  });
});

// =============================================================================
// Sum invariants
// =============================================================================

describe('cost-governor — sum invariants', () => {
  it('projected_cost_usd === Σ allowed_tasks[*].effective_cost_usd', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: 50 });
    const sum = r.allowed_tasks.reduce((a, v) => a + v.effective_cost_usd, 0);
    expect(r.projected_cost_usd).toBeCloseTo(sum, 4);
  });

  it('estimated_savings_usd === Σ verdicts[*].cost_savings_usd', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: 0.6 });
    const all = [...r.allowed_tasks, ...r.skipped_tasks];
    // downgraded_tasks already inside allowed_tasks → don't double-count
    const sum = all.reduce((a, v) => a + v.cost_savings_usd, 0);
    expect(r.estimated_savings_usd).toBeCloseTo(sum, 4);
  });

  it('remaining_budget_usd === cap - current - projected', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const r = await runCostGovernor(sid, plan, {
      current_session_cost_usd: 0.1, budget_cap_usd: 50,
    });
    expect(r.remaining_budget_usd).toBeCloseTo(50 - 0.1 - r.projected_cost_usd, 4);
  });
});

// =============================================================================
// Cached output protection
// =============================================================================

describe('cost-governor — cached output protection', () => {
  it('engine never mutates cached accumulated_context outputs', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const cached = { content: 'analytical narrative', tokens: 4200 };
    const accCtx: Record<string, unknown> = {
      strategic_synthesis: cached,
      existing_key: { keep: true },
    };
    const before = JSON.stringify(accCtx);
    await runCostGovernor(sid, plan, {
      accumulated_context: accCtx, budget_cap_usd: 0.05,
    });
    const after = JSON.stringify(accCtx);
    expect(after).toBe(before);
    expect(accCtx.strategic_synthesis).toBe(cached); // identity preserved
  });
});

// =============================================================================
// Adapter
// =============================================================================

describe('cost-governor — recordCostGovernorReport adapter', () => {
  it('appends to empty context — cost_governor_report + JSON mirror', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: 50 });
    const ctx: Record<string, unknown> = {};
    recordCostGovernorReport(sid, r, ctx);
    expect(Array.isArray(ctx[COST_GOVERNOR_CONTEXT_KEYS.REPORT])).toBe(true);
    expect((ctx[COST_GOVERNOR_CONTEXT_KEYS.REPORT] as unknown[]).length).toBe(1);
    const parsed = JSON.parse(ctx[COST_GOVERNOR_CONTEXT_KEYS.REPORT_JSON] as string);
    expect(parsed[0].recorded_for_session).toBe(sid);
    expect(parsed[0].session_id).toBe(sid);
  });

  it('append-only across multiple invocations', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const r1 = await runCostGovernor(sid, plan, { budget_cap_usd: 50 });
    const r2 = await runCostGovernor(sid, plan, { budget_cap_usd: 100 });
    const ctx: Record<string, unknown> = {};
    recordCostGovernorReport(sid, r1, ctx);
    recordCostGovernorReport(sid, r2, ctx);
    expect((ctx[COST_GOVERNOR_CONTEXT_KEYS.REPORT] as unknown[]).length).toBe(2);
    expect(JSON.parse(ctx[COST_GOVERNOR_CONTEXT_KEYS.REPORT_JSON] as string).length).toBe(2);
  });

  it('does not mutate unrelated keys nor cached outputs', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: 50 });
    const cached = { content: 'narrative' };
    const ctx: Record<string, unknown> = { existing_key: { keep: true }, val_dcf: cached };
    recordCostGovernorReport(sid, r, ctx);
    expect(ctx.existing_key).toEqual({ keep: true });
    expect(ctx.val_dcf).toBe(cached);
  });
});

// =============================================================================
// evaluate_preflight integration
// =============================================================================

describe('cost-governor — evaluate_preflight', () => {
  it('evaluate_preflight=false (default): governor does not call preflight', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    // Force every preflight to abort by sabotaging the hint with unknown ticker.
    for (const t of plan.planned_tasks) {
      t.preflight_hint = { ...t.preflight_hint, ticker: 'XXNOTREAL' };
    }
    const r = await runCostGovernor(sid, plan, { budget_cap_usd: 50 });
    // With evaluate_preflight=false, governor ignores aborts → tasks proceed.
    expect(r.stop_reasons).not.toContain(GOVERNOR_REASON_CODES.GOV_STOP_PREFLIGHT_ABORT_CHAIN);
  });

  it('evaluate_preflight=true: all-abort triggers GOV_STOP_PREFLIGHT_ABORT_CHAIN', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    for (const t of plan.planned_tasks) {
      t.preflight_hint = { ...t.preflight_hint, ticker: 'XXNOTREAL' };
    }
    const r = await runCostGovernor(sid, plan, {
      budget_cap_usd: 50, evaluate_preflight: true,
    });
    expect(r.stop_reasons).toContain(GOVERNOR_REASON_CODES.GOV_STOP_PREFLIGHT_ABORT_CHAIN);
    expect(r.budget_status).toBe('exhausted');
  });
});

// =============================================================================
// KCHOL replays
// =============================================================================

describe('cost-governor — KCHOL replay (qJASnWiqC-3xomxzyLamS)', () => {
  const KCHOL_SESSION = 'qJASnWiqC-3xomxzyLamS';
  const exists = db.prepare(`SELECT 1 AS x FROM analysis_sessions WHERE id = ?`)
    .get(KCHOL_SESSION) as { x?: number } | undefined;

  it.skipIf(!exists?.x)('generous-cap: budget_status=within_budget, all proceed, runtime <250ms', async () => {
    const before = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
      .get(KCHOL_SESSION) as { total_cost_usd: number };
    const plan = await runTaskPlanner(KCHOL_SESSION, { ticker: 'KCHOL' });
    const t0 = Date.now();
    const r = await runCostGovernor(KCHOL_SESSION, plan, {
      current_session_cost_usd: 0, budget_cap_usd: 50,
    });
    expect(Date.now() - t0).toBeLessThan(250);
    expect(r.budget_status).toBe('within_budget');
    expect(r.downgraded_tasks).toEqual([]);
    expect(r.stop_reasons).toEqual([]);
    for (const v of r.allowed_tasks) {
      expect(v.decision).toBe('proceed');
    }
    const expectedSum = plan.planned_tasks.reduce((s, t) => s + TASK_COST_USD[t.kind], 0);
    expect(r.projected_cost_usd).toBeCloseTo(expectedSum, 4);
    // DB unchanged
    const after = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
      .get(KCHOL_SESSION) as { total_cost_usd: number };
    expect(after.total_cost_usd).toBe(before.total_cost_usd);
  });

  it.skipIf(!exists?.x)('tight-cap: adaptive ladder activates, deterministic, runtime <250ms', async () => {
    const plan = await runTaskPlanner(KCHOL_SESSION, { ticker: 'KCHOL' });
    if (plan.planned_tasks.length === 0) return;
    const total = plan.planned_tasks.reduce((s, t) => s + TASK_COST_USD[t.kind], 0);
    const cap = total - 0.3; // tight cap forces a single downgrade to close the deficit
    const t0 = Date.now();
    const a = await runCostGovernor(KCHOL_SESSION, plan, {
      current_session_cost_usd: 0, budget_cap_usd: cap,
    });
    expect(Date.now() - t0).toBeLessThan(250);

    // Strict expectations for KCHOL tight-cap replay (deterministic).
    // Adaptive ladder MUST close the deficit at the downgrade step alone
    // (skip-optional / stop-session are NOT permissible under this fixture).
    expect(a.budget_status).toBe('tight');
    expect(a.projected_cost_usd).toBeLessThanOrEqual(cap + 1e-6);
    expect(a.downgraded_tasks.length).toBeGreaterThanOrEqual(1);
    expect(a.skipped_tasks.length).toBe(0);
    expect(a.stop_reasons.length).toBe(0);

    // Determinism across two consecutive runs.
    const b = await runCostGovernor(KCHOL_SESSION, plan, {
      current_session_cost_usd: 0, budget_cap_usd: cap,
    });
    const norm = (p: CostGovernorReport): unknown =>
      JSON.parse(JSON.stringify(p, (k, v) => k === 'generated_at' ? null : v));
    expect(norm(a)).toEqual(norm(b));
  });
});
