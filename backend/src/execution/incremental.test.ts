/**
 * P3C Wave 1 — incremental computation engine tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  runIncrementalComputation,
  recordComputationPlan,
  computeTaskFingerprint,
  packContentSnapshot,
  COMPUTATION_PLAN_CONTEXT_KEYS,
  INCREMENTAL_REASON_CODES,
  type CachedOutputMeta,
  type ComputationPlan,
  type IncrementalOptions,
} from './incremental.js';
import {
  runTaskPlanner,
  TASK_COST_USD,
  TASK_OUTPUTS,
  type TaskKind,
  type TaskPlan,
} from './task-planner.js';
import { upsertFact, type FactSource } from '../fact-layer/store.js';
import { getMethodologyVersion, recordSessionMethodology } from '../fact-layer/methodology.js';

// =============================================================================
// Fixtures
// =============================================================================

const sessions: string[] = [];

function makeSession(ticker = 'KCHOL'): string {
  const id = `ic-${nanoid(8)}`;
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
    ['revenue_fy2025', 100],
    ['ebitda_fy2025', 30],
    ['net_debt_fy2025', 10],
    ['fcf_fy2025', 20],
    ['roe_fy2025', 0.15],
    ['net_debt_to_ebitda_fy2025', 0.33],
    ['net_income_fy2025', 18],
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

/** Build a fully-warm IncrementalOptions where every planned task is cached
 *  with input_fingerprint matching the engine's computation, methodology
 *  current, and computed_at fresh. */
async function buildWarmCache(
  sessionId: string,
  plan: TaskPlan,
  computedAtIso: string = new Date().toISOString(),
): Promise<IncrementalOptions> {
  // Primer pass: run engine with empty options to obtain the engine-computed
  // fingerprints for each task.
  const primer = await runIncrementalComputation(sessionId, plan, {});
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

// =============================================================================
// Smoke
// =============================================================================

describe('incremental — smoke', () => {
  it('async signature returns a Promise', () => {
    const ret = runIncrementalComputation('nope', {
      session_id: 'nope', ticker: null, generated_at: '', planned_tasks: [],
      skipped_tasks: [], total_estimated_cost_usd: 0, reason_codes: [], warnings: [],
    });
    expect(ret).toBeInstanceOf(Promise);
  });

  it('empty TaskPlan → empty ComputationPlan', async () => {
    const sid = makeSession();
    const plan: TaskPlan = {
      session_id: sid, ticker: 'KCHOL', generated_at: 'x',
      planned_tasks: [], skipped_tasks: [], total_estimated_cost_usd: 0,
      reason_codes: [], warnings: [],
    };
    const r = await runIncrementalComputation(sid, plan);
    expect(r.computation_decision).toEqual([]);
    expect(r.affected_tasks).toEqual([]);
    expect(r.invalidation_reasons).toEqual([]);
    expect(r.reused_outputs).toEqual([]);
    expect(r.recompute_tasks).toEqual([]);
    expect(r.estimated_cost_saved_usd).toBe(0);
    expect(r.warnings).toEqual([]);
  });

  it('deterministic output modulo generated_at', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const a = await runIncrementalComputation(sid, plan);
    const b = await runIncrementalComputation(sid, plan);
    const norm = (p: ComputationPlan): unknown =>
      JSON.parse(JSON.stringify(p, (k, v) => k === 'generated_at' ? null : v));
    expect(norm(a)).toEqual(norm(b));
  });
});

// =============================================================================
// Decision rules — one positive per reason code
// =============================================================================

describe('incremental — decision rules', () => {
  it('RECOMPUTE_NO_CACHE — empty accumulated_context', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const r = await runIncrementalComputation(sid, plan, { accumulated_context: {} });
    for (const v of r.computation_decision) {
      expect(v.decision).toBe('recompute');
      expect(v.reason_codes).toEqual([INCREMENTAL_REASON_CODES.RECOMPUTE_NO_CACHE]);
    }
    expect(r.estimated_cost_saved_usd).toBe(0);
  });

  it('INVALIDATION_NO_CACHE_META — cached output present but no cache meta', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const accCtx: Record<string, unknown> = {};
    for (const t of plan.planned_tasks) {
      accCtx[TASK_OUTPUTS[t.kind][0]] = { content: 'present' };
    }
    const r = await runIncrementalComputation(sid, plan, { accumulated_context: accCtx });
    for (const v of r.computation_decision) {
      expect(v.decision).toBe('invalidate');
      expect(v.reason_codes).toEqual([INCREMENTAL_REASON_CODES.INVALIDATION_NO_CACHE_META]);
    }
  });

  it('INVALIDATION_METHODOLOGY_DRIFT — cached version differs from current', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const warm = await buildWarmCache(sid, plan);
    // Inject a stale methodology version into all cache entries.
    for (const k of Object.keys(warm.cached_outputs_meta!) as TaskKind[]) {
      warm.cached_outputs_meta![k]!.methodology_version = '0.0.0-legacy';
    }
    const r = await runIncrementalComputation(sid, plan, warm);
    expect(r.computation_decision[0].decision).toBe('invalidate');
    expect(r.computation_decision[0].reason_codes).toEqual(
      [INCREMENTAL_REASON_CODES.INVALIDATION_METHODOLOGY_DRIFT],
    );
  });

  it('INVALIDATION_INPUT_HASH_MISMATCH — fingerprint differs from cached', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const warm = await buildWarmCache(sid, plan);
    // Corrupt the FIRST task's cached fingerprint.
    const k0 = plan.planned_tasks[0].kind;
    warm.cached_outputs_meta![k0]!.input_fingerprint = 'bogus_hash';
    const r = await runIncrementalComputation(sid, plan, warm);
    const v0 = r.computation_decision[0];
    expect(v0.decision).toBe('invalidate');
    expect(v0.reason_codes).toEqual([INCREMENTAL_REASON_CODES.INVALIDATION_INPUT_HASH_MISMATCH]);
  });

  it('INVALIDATION_UPSTREAM_DIRTY — predecessor dirty propagates', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const warm = await buildWarmCache(sid, plan);
    // Corrupt only parse_standardization. Children depending on it should
    // cascade-invalidate via INVALIDATION_UPSTREAM_DIRTY (NOT hash_mismatch).
    // Note: for a publishable session, parse_standardization isn't a planned
    // candidate. We instead corrupt the planned head task and verify children.
    const head = plan.planned_tasks[0].kind;
    warm.cached_outputs_meta![head]!.input_fingerprint = 'dirty_head';
    const r = await runIncrementalComputation(sid, plan, warm);
    const headVerdict = r.computation_decision.find((v) => v.kind === head)!;
    expect(headVerdict.decision).toBe('invalidate'); // hash mismatch
    // Find a planned child of `head`
    const child = plan.planned_tasks.find((t) =>
      t.kind !== head && t.required_predecessors.includes(head),
    );
    if (child) {
      const childVerdict = r.computation_decision.find((v) => v.kind === child.kind)!;
      expect(childVerdict.decision).toBe('invalidate');
      expect(childVerdict.reason_codes).toEqual(
        [INCREMENTAL_REASON_CODES.INVALIDATION_UPSTREAM_DIRTY],
      );
    }
  });

  it('INVALIDATION_FRESHNESS_BAND_3 — cache age >90d', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    // 100 days ago.
    const ancient = new Date(Date.now() - 100 * 86_400_000).toISOString();
    const warm = await buildWarmCache(sid, plan, ancient);
    const r = await runIncrementalComputation(sid, plan, warm);
    expect(r.computation_decision[0].decision).toBe('invalidate');
    expect(r.computation_decision[0].reason_codes).toEqual(
      [INCREMENTAL_REASON_CODES.INVALIDATION_FRESHNESS_BAND_3],
    );
  });

  it('PARTIAL_RECOMPUTE_FRESHNESS_BAND_2 — cache age 30-90d', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const middle = new Date(Date.now() - 60 * 86_400_000).toISOString();
    const warm = await buildWarmCache(sid, plan, middle);
    const r = await runIncrementalComputation(sid, plan, warm);
    expect(r.computation_decision[0].decision).toBe('partial_recompute');
    expect(r.computation_decision[0].reason_codes).toEqual(
      [INCREMENTAL_REASON_CODES.PARTIAL_RECOMPUTE_FRESHNESS_BAND_2],
    );
  });

  it('PARTIAL_RECOMPUTE_SUBKEY_DIRTY — sub-key fingerprints differ', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const warm = await buildWarmCache(sid, plan);
    // Pick val_dcf (has 2 expected output keys → 2 sub-keys).
    const t = plan.planned_tasks.find((p) => p.kind === 'val_dcf');
    if (t) {
      warm.cached_outputs_meta!['val_dcf']!.sub_key_fingerprints = {
        val_dcf: 'A', val_dcf_output: 'B',
      };
      warm.current_sub_key_fingerprints = {
        val_dcf: { val_dcf: 'A', val_dcf_output: 'B-DIFFERENT' },
      };
      const r = await runIncrementalComputation(sid, plan, warm);
      const v = r.computation_decision.find((x) => x.kind === 'val_dcf')!;
      expect(v.decision).toBe('partial_recompute');
      expect(v.reason_codes).toEqual([INCREMENTAL_REASON_CODES.PARTIAL_RECOMPUTE_SUBKEY_DIRTY]);
      expect(v.dirty_sub_keys).toEqual(['val_dcf_output']);
    }
  });

  it('REUSE_HASH_MATCH — fully warm cache, fresh, matching', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const warm = await buildWarmCache(sid, plan);
    const r = await runIncrementalComputation(sid, plan, warm);
    for (const v of r.computation_decision) {
      expect(v.decision).toBe('reuse');
      expect(v.reason_codes).toEqual([INCREMENTAL_REASON_CODES.REUSE_HASH_MATCH]);
    }
  });
});

// =============================================================================
// Cascade propagation
// =============================================================================

describe('incremental — cascade propagation', () => {
  it('parent invalidate propagates to child', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    // Corrupt the head-of-DAG task that has at least one planned descendant.
    const warm = await buildWarmCache(sid, plan);
    // Find a parent with a planned child
    const candidateKinds = new Set(plan.planned_tasks.map((t) => t.kind));
    const parent = plan.planned_tasks.find((t) =>
      plan.planned_tasks.some((c) => c.required_predecessors.includes(t.kind) && candidateKinds.has(c.kind)),
    );
    expect(parent).toBeDefined();
    warm.cached_outputs_meta![parent!.kind]!.input_fingerprint = 'corrupted';
    const r = await runIncrementalComputation(sid, plan, warm);
    expect(r.affected_tasks).toContain(parent!.kind);
    // At least one child verdict should be UPSTREAM_DIRTY
    const child = plan.planned_tasks.find((t) =>
      t.required_predecessors.includes(parent!.kind),
    );
    if (child) {
      const cv = r.computation_decision.find((v) => v.kind === child.kind)!;
      expect(cv.reason_codes).toContain(INCREMENTAL_REASON_CODES.INVALIDATION_UPSTREAM_DIRTY);
    }
  });

  it('siblings remain independent', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const warm = await buildWarmCache(sid, plan);
    // val_dcf and strategic_synthesis are siblings via financial_analysis.
    // Corrupt val_dcf only; strategic_synthesis should NOT see UPSTREAM_DIRTY
    // from val_dcf (val_dcf is not a predecessor of strategic_synthesis).
    if (warm.cached_outputs_meta!['val_dcf']) {
      warm.cached_outputs_meta!['val_dcf']!.input_fingerprint = 'corrupted-only-dcf';
      const r = await runIncrementalComputation(sid, plan, warm);
      const ss = r.computation_decision.find((v) => v.kind === 'strategic_synthesis');
      if (ss) {
        // strategic_synthesis must NOT be UPSTREAM_DIRTY because of val_dcf.
        expect(ss.reason_codes).not.toContain(INCREMENTAL_REASON_CODES.INVALIDATION_UPSTREAM_DIRTY);
      }
    }
  });
});

// =============================================================================
// Cost savings
// =============================================================================

describe('incremental — cost savings', () => {
  it('reuse → full task cost saved', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const warm = await buildWarmCache(sid, plan);
    const r = await runIncrementalComputation(sid, plan, warm);
    for (const v of r.computation_decision) {
      expect(v.estimated_cost_saved_usd).toBe(TASK_COST_USD[v.kind]);
    }
  });

  it('recompute / invalidate → 0 saved', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const r = await runIncrementalComputation(sid, plan, { accumulated_context: {} });
    for (const v of r.computation_decision) {
      expect(v.estimated_cost_saved_usd).toBe(0);
    }
  });

  it('partial_recompute SUBKEY_DIRTY → fractional saved (clean/total × cost)', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const warm = await buildWarmCache(sid, plan);
    // val_dcf has TASK_OUTPUTS = ['val_dcf', 'val_dcf_output'] → total=2
    // dirty=1 (val_dcf_output) → save = 1/2 × 0.80 = 0.40
    if (warm.cached_outputs_meta!['val_dcf']) {
      warm.cached_outputs_meta!['val_dcf']!.sub_key_fingerprints = {
        val_dcf: 'A', val_dcf_output: 'B',
      };
      warm.current_sub_key_fingerprints = {
        val_dcf: { val_dcf: 'A', val_dcf_output: 'B-DIFFERENT' },
      };
      const r = await runIncrementalComputation(sid, plan, warm);
      const v = r.computation_decision.find((x) => x.kind === 'val_dcf')!;
      expect(v.estimated_cost_saved_usd).toBeCloseTo(0.5 * TASK_COST_USD['val_dcf'], 4);
    }
  });

  it('total estimated_cost_saved_usd equals sum of verdict savings', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const warm = await buildWarmCache(sid, plan);
    const r = await runIncrementalComputation(sid, plan, warm);
    const sum = r.computation_decision.reduce((a, v) => a + v.estimated_cost_saved_usd, 0);
    expect(r.estimated_cost_saved_usd).toBeCloseTo(sum, 4);
  });
});

// =============================================================================
// Fingerprint determinism
// =============================================================================

describe('incremental — fingerprint determinism', () => {
  it('same fact_pack snapshot → same fingerprint across runs', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const a = await runIncrementalComputation(sid, plan);
    const b = await runIncrementalComputation(sid, plan);
    for (let i = 0; i < a.computation_decision.length; i++) {
      expect(a.computation_decision[i].computed_input_fingerprint)
        .toBe(b.computation_decision[i].computed_input_fingerprint);
    }
  });

  it('accumulated_context key ordering does not change fingerprint', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const ctxA: Record<string, unknown> = { a: 1, b: 2, c: 3 };
    const ctxB: Record<string, unknown> = { c: 3, b: 2, a: 1 };
    const a = await runIncrementalComputation(sid, plan, { accumulated_context: ctxA });
    const b = await runIncrementalComputation(sid, plan, { accumulated_context: ctxB });
    for (let i = 0; i < a.computation_decision.length; i++) {
      expect(a.computation_decision[i].computed_input_fingerprint)
        .toBe(b.computation_decision[i].computed_input_fingerprint);
    }
  });

  it('computeTaskFingerprint helper: key order independent', () => {
    const fpA = computeTaskFingerprint({
      session_id: 'S', task_kind: 'val_dcf',
      fact_pack_content: { a: 1, b: 2, c: 3 },
      predecessor_fingerprints: { financial_analysis: 'X' },
      methodology_version: 'v1',
    });
    const fpB = computeTaskFingerprint({
      session_id: 'S', task_kind: 'val_dcf',
      fact_pack_content: { c: 3, b: 2, a: 1 },
      predecessor_fingerprints: { financial_analysis: 'X' },
      methodology_version: 'v1',
    });
    expect(fpA).toBe(fpB);
    expect(fpA).toMatch(/^[0-9a-f]{40}$/);
  });

  it('packContentSnapshot is deterministic and excludes mutable metadata', () => {
    // Build a minimal pack-shaped object.
    const fakePack = {
      facts: {
        revenue_fy2025: { value: 100, unit: 'TRY_mn', sources: [{ updated_at: 'X' }] },
        ebitda_fy2025: { value: 30, unit: 'TRY_mn', sources: [{ updated_at: 'Y' }] },
      },
    } as never;
    const snap = packContentSnapshot(fakePack);
    expect(snap).toEqual({
      revenue_fy2025: { value: 100, unit: 'TRY_mn' },
      ebitda_fy2025: { value: 30, unit: 'TRY_mn' },
    });
  });
});

// =============================================================================
// Membership rules
// =============================================================================

describe('incremental — membership rules', () => {
  it('reused_outputs and recompute_tasks are sorted-unique', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const warm = await buildWarmCache(sid, plan);
    const r = await runIncrementalComputation(sid, plan, warm);
    expect([...r.reused_outputs].sort()).toEqual(r.reused_outputs);
    expect([...r.recompute_tasks].sort()).toEqual(r.recompute_tasks);
  });

  it('partial_recompute appears in BOTH reused_outputs AND recompute_tasks', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const warm = await buildWarmCache(sid, plan);
    if (warm.cached_outputs_meta!['val_dcf']) {
      warm.cached_outputs_meta!['val_dcf']!.sub_key_fingerprints = {
        val_dcf: 'A', val_dcf_output: 'B',
      };
      warm.current_sub_key_fingerprints = {
        val_dcf: { val_dcf: 'A', val_dcf_output: 'B-DIFFERENT' },
      };
      const r = await runIncrementalComputation(sid, plan, warm);
      expect(r.reused_outputs).toContain('val_dcf');
      expect(r.recompute_tasks).toContain('val_dcf');
    }
  });

  it('reuse-only verdicts: not in recompute_tasks; recompute-only: not in reused', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const warm = await buildWarmCache(sid, plan);
    const r1 = await runIncrementalComputation(sid, plan, warm);
    for (const k of r1.reused_outputs) {
      const v = r1.computation_decision.find((x) => x.kind === k)!;
      if (v.decision === 'reuse') {
        expect(r1.recompute_tasks).not.toContain(k);
      }
    }
    const r2 = await runIncrementalComputation(sid, plan, { accumulated_context: {} });
    for (const k of r2.recompute_tasks) {
      const v = r2.computation_decision.find((x) => x.kind === k)!;
      if (v.decision === 'recompute' || v.decision === 'invalidate') {
        expect(r2.reused_outputs).not.toContain(k);
      }
    }
  });
});

// =============================================================================
// Adapter — recordComputationPlan
// =============================================================================

describe('incremental — recordComputationPlan adapter', () => {
  it('appends to empty context — computation_plan + computation_plan_json', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const r = await runIncrementalComputation(sid, plan);
    const ctx: Record<string, unknown> = {};
    recordComputationPlan(sid, r, ctx);
    expect(Array.isArray(ctx[COMPUTATION_PLAN_CONTEXT_KEYS.PLAN])).toBe(true);
    expect((ctx[COMPUTATION_PLAN_CONTEXT_KEYS.PLAN] as unknown[]).length).toBe(1);
    const parsed = JSON.parse(ctx[COMPUTATION_PLAN_CONTEXT_KEYS.PLAN_JSON] as string);
    expect(parsed[0].recorded_for_session).toBe(sid);
    expect(parsed[0].session_id).toBe(sid);
  });

  it('append-only across multiple invocations', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const r1 = await runIncrementalComputation(sid, plan);
    const r2 = await runIncrementalComputation(sid, plan);
    const ctx: Record<string, unknown> = {};
    recordComputationPlan(sid, r1, ctx);
    recordComputationPlan(sid, r2, ctx);
    expect((ctx[COMPUTATION_PLAN_CONTEXT_KEYS.PLAN] as unknown[]).length).toBe(2);
    expect(JSON.parse(ctx[COMPUTATION_PLAN_CONTEXT_KEYS.PLAN_JSON] as string).length).toBe(2);
  });

  it('does not mutate unrelated keys nor cached analytical outputs', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, {});
    const r = await runIncrementalComputation(sid, plan);
    const cachedNarrative = { content: 'analytical narrative', tokens: 4200 };
    const ctx: Record<string, unknown> = {
      existing_key: { keep: true },
      strategic_synthesis: cachedNarrative,
    };
    recordComputationPlan(sid, r, ctx);
    expect(ctx.existing_key).toEqual({ keep: true });
    expect(ctx.strategic_synthesis).toBe(cachedNarrative); // identity preserved
    expect((ctx.strategic_synthesis as { content: string }).content).toBe('analytical narrative');
  });

  it('engine itself never mutates cached outputs (decision-only invariant)', async () => {
    const sid = makePublishableSession();
    const plan = await runTaskPlanner(sid, { valuation_requested: true });
    const warm = await buildWarmCache(sid, plan);
    const beforeAcc = JSON.stringify(warm.accumulated_context);
    await runIncrementalComputation(sid, plan, warm);
    const afterAcc = JSON.stringify(warm.accumulated_context);
    expect(afterAcc).toBe(beforeAcc);
  });
});

// =============================================================================
// KCHOL replay
// =============================================================================

describe('incremental — KCHOL replay (qJASnWiqC-3xomxzyLamS)', () => {
  const KCHOL_SESSION = 'qJASnWiqC-3xomxzyLamS';
  const exists = db.prepare(`SELECT 1 AS x FROM analysis_sessions WHERE id = ?`)
    .get(KCHOL_SESSION) as { x?: number } | undefined;

  it.skipIf(!exists?.x)('cold cache → all recompute, save=0, runtime <250ms', async () => {
    const plan = await runTaskPlanner(KCHOL_SESSION, { ticker: 'KCHOL' });
    const t0 = Date.now();
    const r = await runIncrementalComputation(KCHOL_SESSION, plan, { accumulated_context: {} });
    expect(Date.now() - t0).toBeLessThan(250);
    expect(r.warnings).toEqual([]);
    expect(r.estimated_cost_saved_usd).toBe(0);
    for (const v of r.computation_decision) {
      expect(['recompute', 'invalidate']).toContain(v.decision);
      expect(v.reason_codes.length).toBeGreaterThanOrEqual(1);
    }
  });

  it.skipIf(!exists?.x)('warm cache → all reuse, save=Σ task costs, deterministic', async () => {
    const plan = await runTaskPlanner(KCHOL_SESSION, { ticker: 'KCHOL' });
    if (plan.planned_tasks.length === 0) {
      // Defensive: KCHOL might be in a state with no candidate tasks; skip math.
      return;
    }
    const before = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
      .get(KCHOL_SESSION) as { total_cost_usd: number };
    const warm = await buildWarmCache(KCHOL_SESSION, plan);
    const t0 = Date.now();
    const a = await runIncrementalComputation(KCHOL_SESSION, plan, warm);
    expect(Date.now() - t0).toBeLessThan(250);
    for (const v of a.computation_decision) {
      expect(v.decision).toBe('reuse');
      expect(v.reason_codes).toEqual([INCREMENTAL_REASON_CODES.REUSE_HASH_MATCH]);
    }
    const expectedSum = plan.planned_tasks.reduce((s, t) => s + TASK_COST_USD[t.kind], 0);
    expect(a.estimated_cost_saved_usd).toBeCloseTo(expectedSum, 4);

    // Determinism across two runs (mod generated_at).
    const b = await runIncrementalComputation(KCHOL_SESSION, plan, warm);
    const norm = (p: ComputationPlan): unknown =>
      JSON.parse(JSON.stringify(p, (k, v) => k === 'generated_at' ? null : v));
    expect(norm(a)).toEqual(norm(b));

    // The replay must NOT mutate the DB session row.
    const after = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
      .get(KCHOL_SESSION) as { total_cost_usd: number };
    expect(after.total_cost_usd).toBe(before.total_cost_usd);
  });
});
