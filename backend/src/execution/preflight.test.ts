/**
 * P3A Wave 1 — pre-LLM/agent preflight validator tests.
 *
 * 8 validators × happy + sad + 2 cross-cutting + adapter + KCHOL replay.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  runPreflight,
  recordPreflightDecision,
  arbitrateAction,
  PREFLIGHT_CONTEXT_KEYS,
  DEFAULT_BUDGET_CAP_USD,
  type PreflightCallContext,
  type PreflightDecision,
  type PreflightFinding,
} from './preflight.js';
import { upsertFact, type FactSource } from '../fact-layer/store.js';
import { recordSessionMethodology } from '../fact-layer/methodology.js';

// =============================================================================
// Fixtures
// =============================================================================

const sessions: string[] = [];

/** Create a session with a real, registered ticker (KCHOL is in sector_registry.yml). */
function makeSession(ticker = 'KCHOL'): string {
  const id = `pf-${nanoid(8)}`;
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

function baseCtx(sid: string, overrides: Partial<PreflightCallContext> = {}): PreflightCallContext {
  return {
    session_id: sid,
    call_target: { kind: 'agent', id: 'val_dcf' },
    accumulated_context: {},
    ...overrides,
  };
}

function findingFor(d: PreflightDecision, validator: string): PreflightFinding | undefined {
  return d.findings.find((f) => f.validator === validator);
}

// =============================================================================
// Smoke
// =============================================================================

describe('preflight — smoke', () => {
  it('async signature returns a Promise', () => {
    const sid = makeSession();
    const ret = runPreflight(baseCtx(sid));
    expect(ret).toBeInstanceOf(Promise);
  });

  it('empty session → action=proceed (warnings only, no blockers)', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid));
    // V2 (empty pack), V7 (no methodology) → warnings; no blockers expected
    expect(d.action).toBe('proceed');
    expect(d.blockers_count).toBe(0);
    expect(d.warnings_count).toBeGreaterThanOrEqual(2);
    expect(d.findings.length).toBe(d.blockers_count + d.warnings_count + d.info_count);
    // reason_codes are sorted
    expect([...d.reason_codes].sort()).toEqual(d.reason_codes);
    // generated_at is an ISO timestamp
    expect(() => new Date(d.generated_at).toISOString()).not.toThrow();
  });
});

// =============================================================================
// V1 ticker_known
// =============================================================================

describe('preflight — V1 ticker_known', () => {
  it('known ticker (KCHOL via session row) → no V1 finding', async () => {
    const sid = makeSession('KCHOL');
    const d = await runPreflight(baseCtx(sid));
    expect(findingFor(d, 'V1_ticker_known')).toBeUndefined();
  });

  it('unknown ticker passed via ctx → V1 blocker → abort', async () => {
    const sid = makeSession('KCHOL');
    const d = await runPreflight(baseCtx(sid, { ticker: 'XXNOTREAL' }));
    const f = findingFor(d, 'V1_ticker_known');
    expect(f?.severity).toBe('blocker');
    expect(f?.reason_code).toBe('TICKER_UNKNOWN');
    expect(d.action).toBe('abort');
  });

  it('TEST ticker (test fixture) without ctx override → V1 blocker', async () => {
    const sid = makeSession('TEST');
    const d = await runPreflight(baseCtx(sid));
    const f = findingFor(d, 'V1_ticker_known');
    expect(f?.severity).toBe('blocker');
    expect(d.action).toBe('abort');
  });
});

// =============================================================================
// V2 fact_pack_available
// =============================================================================

describe('preflight — V2 fact_pack_available', () => {
  it('empty pack → V2 warning', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid));
    const f = findingFor(d, 'V2_fact_pack_available');
    expect(f?.severity).toBe('warning');
    expect(f?.reason_code).toBe('DATA_FACT_PACK_EMPTY');
  });

  it('non-empty pack → no V2 finding', async () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 100, unit: 'TRY_mn', sources: [docSrc] });
    const d = await runPreflight(baseCtx(sid));
    expect(findingFor(d, 'V2_fact_pack_available')).toBeUndefined();
  });
});

// =============================================================================
// V3 confidence_floor
// =============================================================================

describe('preflight — V3 confidence_floor', () => {
  it('avg score below floor → V3 warning', async () => {
    const sid = makeSession();
    // Persist a fact with low confidence — agent source with unknown id maps
    // to `inferred` (0.35), critical conflict (-0.40), complexity 3 (-0.15).
    upsertFact({
      session_id: sid, fact_key: 'revenue_fy2025', value: 100, unit: 'TRY_mn',
      sources: [docSrc],
      confidence_inputs: {
        sources: [{ type: 'agent', agent_id: 'unknown_xx', extracted_at: '2026-04-29T10:00:00Z', freshness_days: 120 }],
        has_conflict: true,
        conflict_severity: 'critical',
        computation_complexity: 3,
      },
    });
    const d = await runPreflight(baseCtx(sid));
    const f = findingFor(d, 'V3_confidence_floor');
    expect(f?.severity).toBe('warning');
    expect(f?.reason_code).toBe('DATA_CONFIDENCE_FLOOR_BELOW_THRESHOLD');
  });

  it('avg score above floor → no V3 finding', async () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'revenue_fy2025', value: 100, unit: 'TRY_mn',
      sources: [docSrc],
      confidence_inputs: {
        sources: [{ type: 'document', doc_id: 'D', extracted_at: '2026-04-29T10:00:00Z', freshness_days: 5 }],
        computation_complexity: 0,
      },
    });
    const d = await runPreflight(baseCtx(sid));
    expect(findingFor(d, 'V3_confidence_floor')).toBeUndefined();
  });

  it('empty session does not fire V3 (V2 owns the empty signal)', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid));
    expect(findingFor(d, 'V3_confidence_floor')).toBeUndefined();
  });
});

// =============================================================================
// V4 duplication_check  → skip action
// =============================================================================

describe('preflight — V4 duplication_check', () => {
  it('expected key already in accumulated_context → V4 warning + action=skip', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid, {
      expected_output_keys: ['val_dcf_output'],
      accumulated_context: { val_dcf_output: { already: 'computed' } },
    }));
    const f = findingFor(d, 'V4_duplication_check');
    expect(f?.severity).toBe('warning');
    expect(f?.reason_code).toBe('DUPLICATION_OUTPUT_ALREADY_PRESENT');
    expect(d.action).toBe('skip');
  });

  it('no overlap → no V4 finding, action=proceed', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid, {
      expected_output_keys: ['val_dcf_output'],
      accumulated_context: { other_key: 1 },
    }));
    expect(findingFor(d, 'V4_duplication_check')).toBeUndefined();
    expect(d.action).toBe('proceed');
  });

  it('blocker present alongside duplication → abort overrides skip', async () => {
    const sid = makeSession('KCHOL');
    const d = await runPreflight(baseCtx(sid, {
      ticker: 'XXNOTREAL', // V1 blocker
      expected_output_keys: ['val_dcf_output'],
      accumulated_context: { val_dcf_output: 1 },
    }));
    expect(d.action).toBe('abort');
  });
});

// =============================================================================
// V5 citation_provenance_ready
// =============================================================================

describe('preflight — V5 citation_provenance_ready', () => {
  it('critical citation gap present → V5 warning', async () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 100, unit: 'TRY_mn', sources: [docSrc] });
    db.prepare(
      `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at)
       VALUES (?, 'revenue_fy2025', ?, 'raw_extracted', 'parse_standardization', '2026-04-29T10:00:00Z')`,
    ).run(sid, `ln-${nanoid(10)}`);
    const d = await runPreflight(baseCtx(sid));
    const f = findingFor(d, 'V5_citation_provenance_ready');
    expect(f?.severity).toBe('warning');
    expect(f?.reason_code).toBe('CITATION_CRITICAL_GAPS_PRESENT');
    expect(d.action).toBe('proceed');
  });

  it('lineage node carries source_doc_id → no V5 finding', async () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 100, unit: 'TRY_mn', sources: [docSrc] });
    db.prepare(
      `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, source_doc_id)
       VALUES (?, 'revenue_fy2025', ?, 'raw_extracted', 'parse_standardization', '2026-04-29T10:00:00Z', 'KCHOL_FY2025_AR')`,
    ).run(sid, `ln-${nanoid(10)}`);
    const d = await runPreflight(baseCtx(sid));
    expect(findingFor(d, 'V5_citation_provenance_ready')).toBeUndefined();
  });
});

// =============================================================================
// V6 phase_boundary_satisfied
// =============================================================================

describe('preflight — V6 phase_boundary_satisfied', () => {
  it('all required predecessor keys present → no V6 finding', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid, {
      required_predecessor_phases: ['parse_standardization', 'financial_analysis'],
      accumulated_context: { parse_standardization: 1, financial_analysis: 1 },
    }));
    expect(findingFor(d, 'V6_phase_boundary_satisfied')).toBeUndefined();
  });

  it('missing predecessor → V6 blocker → abort', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid, {
      required_predecessor_phases: ['parse_standardization', 'financial_analysis'],
      accumulated_context: { parse_standardization: 1 },
    }));
    const f = findingFor(d, 'V6_phase_boundary_satisfied');
    expect(f?.severity).toBe('blocker');
    expect(f?.reason_code).toBe('PHASE_BOUNDARY_VIOLATION');
    expect(d.action).toBe('abort');
  });

  it('no required_predecessor_phases provided → no V6 finding', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid));
    expect(findingFor(d, 'V6_phase_boundary_satisfied')).toBeUndefined();
  });
});

// =============================================================================
// V7 methodology_session_fresh
// =============================================================================

describe('preflight — V7 methodology_session_fresh', () => {
  it('no methodology snapshot → V7 warning', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid));
    const f = findingFor(d, 'V7_methodology_session_fresh');
    expect(f?.severity).toBe('warning');
    expect(f?.reason_code).toBe('METHODOLOGY_SESSION_STALE');
  });

  it('current methodology recorded → no V7 finding', async () => {
    const sid = makeSession();
    recordSessionMethodology(sid);
    const d = await runPreflight(baseCtx(sid));
    expect(findingFor(d, 'V7_methodology_session_fresh')).toBeUndefined();
  });

  it('stale methodology version → V7 warning', async () => {
    const sid = makeSession();
    db.prepare(
      `INSERT INTO session_methodology (session_id, methodology_version, methodology_snapshot, recorded_at)
       VALUES (?, '0.0.0-legacy', '{"version":"0.0.0-legacy","components":{}}', ?)`,
    ).run(sid, new Date().toISOString());
    const d = await runPreflight(baseCtx(sid));
    const f = findingFor(d, 'V7_methodology_session_fresh');
    expect(f?.severity).toBe('warning');
    expect(f?.details).toContain('0.0.0-legacy');
  });
});

// =============================================================================
// V8 cost_budget_within_cap
// =============================================================================

describe('preflight — V8 cost_budget_within_cap (session-cumulative)', () => {
  it('current+estimate just over cap → V8 blocker → abort', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid, {
      current_session_cost_usd: 4.95,
      estimated_cost_usd: 0.10,
      budget_cap_usd: 5,
    }));
    const f = findingFor(d, 'V8_cost_budget_within_cap');
    expect(f?.severity).toBe('blocker');
    expect(f?.reason_code).toBe('BUDGET_EXCEEDED');
    expect(d.action).toBe('abort');
    // details mentions current + estimated + cap
    expect(f?.details).toContain('4.9500');
    expect(f?.details).toContain('0.1000');
    expect(f?.details).toContain('5.0000');
  });

  it('current+estimate just under cap → no V8 finding', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid, {
      current_session_cost_usd: 4.90,
      estimated_cost_usd: 0.05,
      budget_cap_usd: 5,
    }));
    expect(findingFor(d, 'V8_cost_budget_within_cap')).toBeUndefined();
  });

  it('estimate alone over default cap → V8 blocker → abort', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid, {
      estimated_cost_usd: 6,
      current_session_cost_usd: 0,
    }));
    const f = findingFor(d, 'V8_cost_budget_within_cap');
    expect(f?.severity).toBe('blocker');
    expect(f?.reason_code).toBe('BUDGET_EXCEEDED');
    expect(d.action).toBe('abort');
    expect(DEFAULT_BUDGET_CAP_USD).toBe(5);
  });

  it('current_session_cost_usd omitted → defaults to 0', async () => {
    const sid = makeSession();
    // 0 (default) + 4 = 4 < default cap 5 → no finding
    const d = await runPreflight(baseCtx(sid, { estimated_cost_usd: 4 }));
    expect(findingFor(d, 'V8_cost_budget_within_cap')).toBeUndefined();
  });

  it('caller-overridden cap respected (current+estimate vs override)', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid, {
      current_session_cost_usd: 0.5,
      estimated_cost_usd: 0.6,
      budget_cap_usd: 1,
    }));
    expect(findingFor(d, 'V8_cost_budget_within_cap')?.severity).toBe('blocker');
  });

  it('estimate + current both omitted → no V8 finding', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid));
    expect(findingFor(d, 'V8_cost_budget_within_cap')).toBeUndefined();
  });
});

// =============================================================================
// Cross-cutting: arbitration & determinism
// =============================================================================

describe('preflight — cross-cutting', () => {
  it('arbitrateAction direct: blocker > duplication > clean', () => {
    const blocker: PreflightFinding = {
      validator: 'V1_ticker_known', reason_code: 'TICKER_UNKNOWN',
      severity: 'blocker', details: '',
    };
    const duplication: PreflightFinding = {
      validator: 'V4_duplication_check', reason_code: 'DUPLICATION_OUTPUT_ALREADY_PRESENT',
      severity: 'warning', details: '',
    };
    const otherWarning: PreflightFinding = {
      validator: 'V7_methodology_session_fresh', reason_code: 'METHODOLOGY_SESSION_STALE',
      severity: 'warning', details: '',
    };
    expect(arbitrateAction([blocker, duplication])).toBe('abort');
    expect(arbitrateAction([duplication])).toBe('skip');
    expect(arbitrateAction([otherWarning])).toBe('proceed');
    expect(arbitrateAction([])).toBe('proceed');
  });

  it('determinism: same inputs → identical structural output (mod generated_at)', async () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 100, unit: 'TRY_mn', sources: [docSrc] });
    recordSessionMethodology(sid);
    const ctx = baseCtx(sid, { estimated_cost_usd: 0.1 });
    const a = await runPreflight(ctx);
    const b = await runPreflight(ctx);
    expect(a.action).toBe(b.action);
    expect(a.reason_codes).toEqual(b.reason_codes);
    expect(a.findings).toEqual(b.findings);
    expect(a.blockers_count).toBe(b.blockers_count);
    expect(a.warnings_count).toBe(b.warnings_count);
    expect(a.info_count).toBe(b.info_count);
  });
});

// =============================================================================
// Adapter — recordPreflightDecision
// =============================================================================

describe('preflight — recordPreflightDecision adapter', () => {
  it('appends to empty context — preflight_log + preflight_log_json', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid));
    const ctx: Record<string, unknown> = {};
    recordPreflightDecision(sid, d, ctx);
    expect(Array.isArray(ctx[PREFLIGHT_CONTEXT_KEYS.LOG])).toBe(true);
    expect((ctx[PREFLIGHT_CONTEXT_KEYS.LOG] as unknown[]).length).toBe(1);
    expect(typeof ctx[PREFLIGHT_CONTEXT_KEYS.LOG_JSON]).toBe('string');
    const parsed = JSON.parse(ctx[PREFLIGHT_CONTEXT_KEYS.LOG_JSON] as string);
    expect(parsed[0].session_id).toBe(sid);
    expect(parsed[0].action).toBe(d.action);
  });

  it('append-only: subsequent calls preserve prior entries', async () => {
    const sid = makeSession();
    const d1 = await runPreflight(baseCtx(sid));
    const d2 = await runPreflight(baseCtx(sid, { call_target: { kind: 'llm', id: 'opus' } }));
    const ctx: Record<string, unknown> = {};
    recordPreflightDecision(sid, d1, ctx);
    recordPreflightDecision(sid, d2, ctx);
    const log = ctx[PREFLIGHT_CONTEXT_KEYS.LOG] as PreflightDecision[];
    expect(log.length).toBe(2);
    // mirror reflects array exactly
    expect(JSON.parse(ctx[PREFLIGHT_CONTEXT_KEYS.LOG_JSON] as string).length).toBe(2);
  });

  it('does not mutate unrelated keys', async () => {
    const sid = makeSession();
    const d = await runPreflight(baseCtx(sid));
    const ctx: Record<string, unknown> = { existing_key: { keep: true } };
    recordPreflightDecision(sid, d, ctx);
    expect(ctx.existing_key).toEqual({ keep: true });
  });
});

// =============================================================================
// KCHOL replay against persisted production session
// =============================================================================

describe('preflight — KCHOL replay (qJASnWiqC-3xomxzyLamS)', () => {
  const KCHOL_SESSION = 'qJASnWiqC-3xomxzyLamS';
  const exists = db.prepare(`SELECT 1 AS x FROM analysis_sessions WHERE id = ?`)
    .get(KCHOL_SESSION) as { x?: number } | undefined;

  it.skipIf(!exists?.x)(
    'clean call against KCHOL session → action=proceed, blockers_count=0',
    async () => {
      const d = await runPreflight({
        session_id: KCHOL_SESSION,
        ticker: 'KCHOL',
        call_target: { kind: 'agent', id: 'val_dcf' },
        expected_output_keys: ['val_dcf_output'],
        accumulated_context: {},
        estimated_cost_usd: 0.05,
      });
      expect(d.action).toBe('proceed');
      expect(d.blockers_count).toBe(0);
      // Sanity: V1 (KCHOL is registered) should not fire.
      expect(d.findings.find((f) => f.validator === 'V1_ticker_known')).toBeUndefined();
    },
  );
});
