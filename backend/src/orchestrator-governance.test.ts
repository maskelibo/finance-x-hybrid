/**
 * P4.5 Wave 1 — orchestrator governance shadow helper tests.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from './db.js';
import {
  recordSessionStartGovernance,
  recordSessionEndGovernance,
  isShadowModeEnabled,
  FLAG_ENV_VAR,
  FLAG_ENABLED_VALUE,
} from './orchestrator-governance.js';
import { recordSessionMethodology } from './fact-layer/methodology.js';
import { upsertFact, type FactSource } from './fact-layer/store.js';

// =============================================================================
// Fixtures
// =============================================================================

const sessions: string[] = [];

function makeSession(ticker = 'KCHOL'): string {
  const id = `og-${nanoid(8)}`;
  db.prepare(
    `INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at)
     VALUES (?, ?, 'standard_institutional', 'pending', ?)`,
  ).run(id, ticker, new Date().toISOString());
  sessions.push(id);
  return id;
}

afterEach(() => {
  // Always reset the env flag so tests are isolated.
  delete process.env[FLAG_ENV_VAR];
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

// =============================================================================
// Flag gating
// =============================================================================

describe('orchestrator-governance — flag gating', () => {
  it('flag unset (default): isShadowModeEnabled() = false; helpers no-op', async () => {
    delete process.env[FLAG_ENV_VAR];
    expect(isShadowModeEnabled()).toBe(false);
    const sid = makeSession();
    const ctx: Record<string, unknown> = {};
    await recordSessionStartGovernance(sid, 'KCHOL', ctx);
    await recordSessionEndGovernance(sid, 'KCHOL', 0, ctx);
    expect(ctx.task_plan).toBeUndefined();
    expect(ctx.task_plan_json).toBeUndefined();
    expect(ctx.computation_plan).toBeUndefined();
    expect(ctx.cost_governor_report).toBeUndefined();
    expect(ctx.escalation_report).toBeUndefined();
    expect(ctx.self_healing_plan).toBeUndefined();
    expect(ctx.idempotency_saga_plan).toBeUndefined();
    expect(ctx.circuit_breaker_plan).toBeUndefined();
  });

  it('flag = "off": helpers no-op', async () => {
    process.env[FLAG_ENV_VAR] = 'off';
    expect(isShadowModeEnabled()).toBe(false);
    const sid = makeSession();
    const ctx: Record<string, unknown> = {};
    await recordSessionStartGovernance(sid, 'KCHOL', ctx);
    expect(ctx.task_plan).toBeUndefined();
  });

  it('invalid flag value ("maybe"): treated as OFF', async () => {
    process.env[FLAG_ENV_VAR] = 'maybe';
    expect(isShadowModeEnabled()).toBe(false);
    const sid = makeSession();
    const ctx: Record<string, unknown> = {};
    await recordSessionStartGovernance(sid, 'KCHOL', ctx);
    expect(ctx.task_plan).toBeUndefined();
  });

  it('flag = "ON" (uppercase): treated as OFF (strict equality)', async () => {
    process.env[FLAG_ENV_VAR] = 'ON';
    expect(isShadowModeEnabled()).toBe(false);
    const sid = makeSession();
    const ctx: Record<string, unknown> = {};
    await recordSessionStartGovernance(sid, 'KCHOL', ctx);
    expect(ctx.task_plan).toBeUndefined();
  });

  it('flag = "on": isShadowModeEnabled() = true', () => {
    process.env[FLAG_ENV_VAR] = FLAG_ENABLED_VALUE;
    expect(isShadowModeEnabled()).toBe(true);
  });
});

// =============================================================================
// Flag ON — session-start
// =============================================================================

describe('orchestrator-governance — session-start (flag ON)', () => {
  beforeEach(() => { process.env[FLAG_ENV_VAR] = FLAG_ENABLED_VALUE; });

  it('writes task_plan + computation_plan with JSON mirrors', async () => {
    const sid = makeSession();
    const ctx: Record<string, unknown> = {};
    await recordSessionStartGovernance(sid, 'KCHOL', ctx);
    expect(Array.isArray(ctx.task_plan)).toBe(true);
    expect((ctx.task_plan as unknown[]).length).toBe(1);
    expect(typeof ctx.task_plan_json).toBe('string');
    expect(Array.isArray(ctx.computation_plan)).toBe(true);
    expect((ctx.computation_plan as unknown[]).length).toBe(1);
    expect(typeof ctx.computation_plan_json).toBe('string');
    // JSON mirror round-trips
    const parsed = JSON.parse(ctx.task_plan_json as string);
    expect(parsed[0].recorded_for_session).toBe(sid);
  });

  it('append-only: two consecutive invocations append two entries', async () => {
    const sid = makeSession();
    const ctx: Record<string, unknown> = {};
    await recordSessionStartGovernance(sid, 'KCHOL', ctx);
    await recordSessionStartGovernance(sid, 'KCHOL', ctx);
    expect((ctx.task_plan as unknown[]).length).toBe(2);
    expect((ctx.computation_plan as unknown[]).length).toBe(2);
    expect(JSON.parse(ctx.task_plan_json as string).length).toBe(2);
  });

  it('preserves existing accumulatedContext keys (no narrative mutation)', async () => {
    const sid = makeSession();
    const cached = { content: 'analytical narrative', tokens: 4200 };
    const ctx: Record<string, unknown> = {
      strategic_synthesis: cached,
      existing_key: { keep: true },
      ticker: 'KCHOL',
    };
    await recordSessionStartGovernance(sid, 'KCHOL', ctx);
    expect(ctx.strategic_synthesis).toBe(cached);
    expect(ctx.existing_key).toEqual({ keep: true });
    expect(ctx.ticker).toBe('KCHOL');
  });
});

// =============================================================================
// Flag ON — session-end
// =============================================================================

describe('orchestrator-governance — session-end (flag ON)', () => {
  beforeEach(() => { process.env[FLAG_ENV_VAR] = FLAG_ENABLED_VALUE; });

  it('writes 5 governance reports with JSON mirrors', async () => {
    const sid = makePublishableSession();
    const ctx: Record<string, unknown> = {};
    await recordSessionStartGovernance(sid, 'KCHOL', ctx);
    await recordSessionEndGovernance(sid, 'KCHOL', 0.05, ctx);
    expect(Array.isArray(ctx.cost_governor_report)).toBe(true);
    expect(Array.isArray(ctx.escalation_report)).toBe(true);
    expect(Array.isArray(ctx.self_healing_plan)).toBe(true);
    expect(Array.isArray(ctx.idempotency_saga_plan)).toBe(true);
    expect(Array.isArray(ctx.circuit_breaker_plan)).toBe(true);
    expect(typeof ctx.cost_governor_report_json).toBe('string');
    expect(typeof ctx.escalation_report_json).toBe('string');
    expect(typeof ctx.self_healing_plan_json).toBe('string');
    expect(typeof ctx.idempotency_saga_plan_json).toBe('string');
    expect(typeof ctx.circuit_breaker_plan_json).toBe('string');
  });

  it('regenerates task_plan when session-start was not called', async () => {
    const sid = makePublishableSession();
    const ctx: Record<string, unknown> = {};
    // Skip session-start entirely; session-end should still produce reports.
    await recordSessionEndGovernance(sid, 'KCHOL', 0.05, ctx);
    expect(Array.isArray(ctx.task_plan)).toBe(true);
    expect(Array.isArray(ctx.cost_governor_report)).toBe(true);
    expect(Array.isArray(ctx.escalation_report)).toBe(true);
  });

  it('preserves existing accumulatedContext keys', async () => {
    const sid = makePublishableSession();
    const cached = { content: 'analytical narrative' };
    const ctx: Record<string, unknown> = {
      strategic_synthesis: cached, existing_key: { keep: true },
    };
    await recordSessionStartGovernance(sid, 'KCHOL', ctx);
    await recordSessionEndGovernance(sid, 'KCHOL', 0.05, ctx);
    expect(ctx.strategic_synthesis).toBe(cached);
    expect(ctx.existing_key).toEqual({ keep: true });
  });

  it('append-only: two session-ends append', async () => {
    const sid = makePublishableSession();
    const ctx: Record<string, unknown> = {};
    await recordSessionStartGovernance(sid, 'KCHOL', ctx);
    await recordSessionEndGovernance(sid, 'KCHOL', 0.05, ctx);
    await recordSessionEndGovernance(sid, 'KCHOL', 0.10, ctx);
    expect((ctx.cost_governor_report as unknown[]).length).toBe(2);
    expect((ctx.escalation_report as unknown[]).length).toBe(2);
  });
});

// =============================================================================
// Exception path — does not throw, logs [governance-shadow] warning
// =============================================================================

describe('orchestrator-governance — exception path', () => {
  beforeEach(() => { process.env[FLAG_ENV_VAR] = FLAG_ENABLED_VALUE; });

  it('corrupted accumulatedContext.task_plan does not throw at session-end', async () => {
    const sid = makePublishableSession();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Pre-pollute task_plan with a malformed entry: planned_tasks=undefined.
    const ctx: Record<string, unknown> = {
      task_plan: [{ recorded_for_session: sid, planned_tasks: undefined }],
    };
    await expect(
      recordSessionEndGovernance(sid, 'KCHOL', 0.05, ctx)
    ).resolves.toBeUndefined();
    // At least one [governance-shadow] warning emitted.
    const shadowWarnings = warnSpy.mock.calls
      .map((c) => String(c[0] ?? ''))
      .filter((s) => s.includes('[governance-shadow]'));
    expect(shadowWarnings.length).toBeGreaterThan(0);
    warnSpy.mockRestore();
  });

  it('helper never throws even when flag toggled mid-run', async () => {
    const sid = makePublishableSession();
    const ctx: Record<string, unknown> = {};
    await recordSessionStartGovernance(sid, 'KCHOL', ctx);
    delete process.env[FLAG_ENV_VAR];  // toggle OFF mid-session
    await expect(
      recordSessionEndGovernance(sid, 'KCHOL', 0.05, ctx)
    ).resolves.toBeUndefined();
    // Session-end is a no-op now → no new keys
    expect(ctx.cost_governor_report).toBeUndefined();
  });
});

// =============================================================================
// No DB writes
// =============================================================================

describe('orchestrator-governance — no DB writes', () => {
  beforeEach(() => { process.env[FLAG_ENV_VAR] = FLAG_ENABLED_VALUE; });

  it('analysis_sessions.total_cost_usd snapshot before/after equal', async () => {
    const sid = makePublishableSession();
    db.prepare(`UPDATE analysis_sessions SET total_cost_usd = ? WHERE id = ?`).run(0.42, sid);
    const before = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
      .get(sid) as { total_cost_usd: number };
    const ctx: Record<string, unknown> = {};
    await recordSessionStartGovernance(sid, 'KCHOL', ctx);
    await recordSessionEndGovernance(sid, 'KCHOL', 0.42, ctx);
    const after = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
      .get(sid) as { total_cost_usd: number };
    expect(after.total_cost_usd).toBe(before.total_cost_usd);
  });
});

// =============================================================================
// KCHOL persisted-session validation
// =============================================================================

describe('orchestrator-governance — KCHOL replay (qJASnWiqC-3xomxzyLamS)', () => {
  const KCHOL_SESSION = 'qJASnWiqC-3xomxzyLamS';
  const exists = db.prepare(`SELECT 1 AS x FROM analysis_sessions WHERE id = ?`)
    .get(KCHOL_SESSION) as { x?: number } | undefined;

  beforeEach(() => { process.env[FLAG_ENV_VAR] = FLAG_ENABLED_VALUE; });

  it.skipIf(!exists?.x)(
    'composes full governance against persisted KCHOL; DB unchanged',
    async () => {
      const before = db.prepare(`SELECT total_cost_usd, status FROM analysis_sessions WHERE id = ?`)
        .get(KCHOL_SESSION) as { total_cost_usd: number; status: string };
      const ctx: Record<string, unknown> = {};
      await recordSessionStartGovernance(KCHOL_SESSION, 'KCHOL', ctx);
      await recordSessionEndGovernance(KCHOL_SESSION, 'KCHOL', before.total_cost_usd, ctx);
      // All 7 governance keys present.
      expect(Array.isArray(ctx.task_plan)).toBe(true);
      expect(Array.isArray(ctx.computation_plan)).toBe(true);
      expect(Array.isArray(ctx.cost_governor_report)).toBe(true);
      expect(Array.isArray(ctx.escalation_report)).toBe(true);
      expect(Array.isArray(ctx.self_healing_plan)).toBe(true);
      expect(Array.isArray(ctx.idempotency_saga_plan)).toBe(true);
      expect(Array.isArray(ctx.circuit_breaker_plan)).toBe(true);
      // DB unchanged
      const after = db.prepare(`SELECT total_cost_usd, status FROM analysis_sessions WHERE id = ?`)
        .get(KCHOL_SESSION) as { total_cost_usd: number; status: string };
      expect(after.total_cost_usd).toBe(before.total_cost_usd);
      expect(after.status).toBe(before.status);
    },
  );

  it.skipIf(!exists?.x)(
    'flag-OFF round-trip: orchestrator behavior unchanged with flag disabled',
    async () => {
      delete process.env[FLAG_ENV_VAR];
      const before = db.prepare(`SELECT total_cost_usd, status FROM analysis_sessions WHERE id = ?`)
        .get(KCHOL_SESSION) as { total_cost_usd: number; status: string };
      const ctx: Record<string, unknown> = { existing: 'preserved' };
      await recordSessionStartGovernance(KCHOL_SESSION, 'KCHOL', ctx);
      await recordSessionEndGovernance(KCHOL_SESSION, 'KCHOL', before.total_cost_usd, ctx);
      // No governance keys written.
      expect(ctx.task_plan).toBeUndefined();
      expect(ctx.cost_governor_report).toBeUndefined();
      // Existing key preserved.
      expect(ctx.existing).toBe('preserved');
      // DB unchanged.
      const after = db.prepare(`SELECT total_cost_usd, status FROM analysis_sessions WHERE id = ?`)
        .get(KCHOL_SESSION) as { total_cost_usd: number; status: string };
      expect(after.total_cost_usd).toBe(before.total_cost_usd);
      expect(after.status).toBe(before.status);
    },
  );

  // -------------------------------------------------------------------------
  // Pre-P5 Wave A2 — calibrated cap surfaces in the cost governor report
  // -------------------------------------------------------------------------
  it.skipIf(!exists?.x)(
    'calibrated cap: KCHOL no longer false-aborts solely on default $5',
    async () => {
      const before = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
        .get(KCHOL_SESSION) as { total_cost_usd: number };
      const ctx: Record<string, unknown> = {};
      await recordSessionStartGovernance(KCHOL_SESSION, 'KCHOL', ctx);
      await recordSessionEndGovernance(KCHOL_SESSION, 'KCHOL', before.total_cost_usd, ctx);
      const cgrLog = ctx.cost_governor_report as Array<{ budget_status: string; reason_codes: string[] }>;
      const cgr = cgrLog[cgrLog.length - 1];
      // KCHOL actual cost ($6.21) < calibrated cap ($7.46) → governor must
      // NOT report 'exhausted' (which is current >= cap). Pre-A2 baseline
      // had budget_status='exhausted' for this exact session; A2 fixes it.
      expect(cgr.budget_status).not.toBe('exhausted');
    },
  );
});
