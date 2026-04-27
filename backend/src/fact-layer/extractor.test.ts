/**
 * P1A Wave 2 — extractor unit + integration tests.
 *
 * Uses the live DB (matches existing pipeline-smoke pattern); each test
 * cleans up its session via cascade-delete on analysis_sessions.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  extractFactsFromAgentOutput,
  tryExtractFactsBestEffort,
  resolvePath,
  normalizePeriodSuffix,
  getExtractionRules,
  listSupportedAgents,
} from './extractor.js';
import { getFact, listFacts } from './store.js';

const sessions: string[] = [];

function makeSession(): string {
  const id = `t-${nanoid(8)}`;
  db.prepare(
    `INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at)
     VALUES (?, 'TEST', 'standard_institutional', 'pending', ?)`,
  ).run(id, new Date().toISOString());
  sessions.push(id);
  return id;
}

afterEach(() => {
  while (sessions.length > 0) {
    const id = sessions.pop()!;
    db.prepare(`DELETE FROM analysis_sessions WHERE id = ?`).run(id);
  }
});

// =============================================================================
// Registry surface
// =============================================================================

describe('extractor — registry surface', () => {
  it('covers exactly the four approved Wave 2 agents', () => {
    expect(listSupportedAgents().sort()).toEqual([
      'financial_analysis',
      'macro_analysis',
      'parse_standardization',
      'technical_analysis',
    ]);
  });

  it('does not include valuation_agent (deferred to Wave 3)', () => {
    expect(listSupportedAgents()).not.toContain('valuation_agent');
    expect(getExtractionRules('valuation_agent')).toEqual([]);
  });

  it('returns empty rules for unknown agents (no-op)', () => {
    expect(getExtractionRules('mystery_agent')).toEqual([]);
  });
});

// =============================================================================
// Path resolution + period suffix
// =============================================================================

describe('extractor — resolvePath', () => {
  it('resolves dotted keys', () => {
    expect(resolvePath({ a: { b: { c: 5 } } }, 'a.b.c')).toBe(5);
  });
  it('resolves array indices', () => {
    expect(resolvePath({ items: [{ x: 1 }, { x: 2 }] }, 'items[1].x')).toBe(2);
  });
  it('returns undefined for missing path', () => {
    expect(resolvePath({ a: 1 }, 'a.b.c')).toBeUndefined();
  });
  it('returns undefined for out-of-range array index', () => {
    expect(resolvePath({ a: [1, 2] }, 'a[5]')).toBeUndefined();
  });
  it('handles null root defensively', () => {
    expect(resolvePath(null, 'a')).toBeUndefined();
  });
});

describe('extractor — normalizePeriodSuffix', () => {
  it('FY-2025 → fy2025', () => { expect(normalizePeriodSuffix('FY-2025')).toBe('fy2025'); });
  it('fy2025 → fy2025', () => { expect(normalizePeriodSuffix('fy2025')).toBe('fy2025'); });
  it('Q1-2026 → q1_2026', () => { expect(normalizePeriodSuffix('Q1-2026')).toBe('q1_2026'); });
  it('H1-2026 → h1_2026', () => { expect(normalizePeriodSuffix('H1-2026')).toBe('h1_2026'); });
  it('2026-04-27 → 20260427', () => { expect(normalizePeriodSuffix('2026-04-27')).toBe('20260427'); });
  it('null → null', () => { expect(normalizePeriodSuffix(null)).toBeNull(); });
  it('empty string → null', () => { expect(normalizePeriodSuffix('')).toBeNull(); });
  it('non-string → null', () => { expect(normalizePeriodSuffix(42)).toBeNull(); });
});

// =============================================================================
// Per-agent extraction
// =============================================================================

describe('extractor — parse_standardization', () => {
  it('extracts income statement + balance fields with FY suffix', () => {
    const sid = makeSession();
    const output = JSON.stringify({
      standardized_statements: [
        {
          period_label: 'FY-2025',
          income_statement: {
            revenue: 2_757_295_000_000,
            cost_of_sales: -1_539_222_000_000,
            gross_profit: 469_354_000_000,
            operating_income: 117_608_000_000,
            ebitda: 192_000_000_000,
            net_income: 34_628_000_000,
          },
          balance_sheet: {
            total_assets: 5_317_600_000_000,
            total_equity: 1_092_573_000_000,
            current_liabilities: 800_000_000_000,
          },
        },
      ],
    });
    const r = extractFactsFromAgentOutput('parse_standardization', sid, output);
    expect(r.extracted).toBeGreaterThanOrEqual(9);
    expect(r.fact_keys).toContain('revenue_fy2025');
    expect(r.fact_keys).toContain('ebitda_fy2025');
    expect(r.fact_keys).toContain('total_assets_fy2025');
    const fact = getFact(sid, 'revenue_fy2025');
    expect(fact?.value).toBeCloseTo(2_757_295, 0); // unit-normalized to TRY_mn
    expect(fact?.confidence).not.toBeNull();
  });
});

describe('extractor — financial_analysis', () => {
  it('extracts canonical_numbers with FY suffix', () => {
    const sid = makeSession();
    const output = JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: {
        revenue: 2757295000000,
        net_income: 34628000000,
        total_assets: 5317600000000,
        total_equity: 1092573000000,
        gross_margin: 17.02,
        ebitda_margin: 6.96,
        net_margin: 1.26,
        roe: 3.17,
        roa: 0.65,
        roce: 6.33,
        current_ratio: 0.87,
        net_debt: 996438000000,
        net_debt_to_ebitda: 5.19,
        fcf: -204862000000,
      },
    });
    const r = extractFactsFromAgentOutput('financial_analysis', sid, output);
    expect(r.extracted).toBe(14);
    expect(r.fact_keys).toContain('roe_fy2025');
    expect(r.fact_keys).toContain('net_debt_to_ebitda_fy2025');
    const ndte = getFact(sid, 'net_debt_to_ebitda_fy2025');
    expect(ndte?.value).toBeCloseTo(5.19, 2);
    expect(ndte?.confidence?.tier).toBeDefined();
  });
});

describe('extractor — macro_analysis', () => {
  it('extracts nested rates / inflation shape', () => {
    const sid = makeSession();
    const output = JSON.stringify({
      rates: { tcmb_policy_rate: 50.0, usd_try: 44.93, eur_try: 52.55 },
      inflation: { cpi_yoy: 38.5 },
    });
    const r = extractFactsFromAgentOutput('macro_analysis', sid, output);
    expect(r.fact_keys).toContain('tcmb_policy_rate');
    expect(r.fact_keys).toContain('cpi_yoy');
    expect(r.fact_keys).toContain('usd_try');
    expect(r.fact_keys).toContain('eur_try');
    // No period suffix on point_in_time facts
    const f = getFact(sid, 'tcmb_policy_rate');
    expect(f?.value).toBeCloseTo(50, 5);
  });

  it('also extracts flat shape, but does not double-store same key', () => {
    const sid = makeSession();
    const output = JSON.stringify({ tcmb_policy_rate: 50.0, usd_try: 44.93 });
    const r = extractFactsFromAgentOutput('macro_analysis', sid, output);
    expect(r.fact_keys).toContain('tcmb_policy_rate');
    expect(r.fact_keys).toContain('usd_try');
    // Each key persisted exactly once
    expect(new Set(r.fact_keys).size).toBe(r.fact_keys.length);
  });
});

describe('extractor — technical_analysis', () => {
  it('extracts rsi from the rsi or rsi_14 path, single key', () => {
    const sid = makeSession();
    const output = JSON.stringify({ rsi: 57.4, trend: 'bullish' });
    const r = extractFactsFromAgentOutput('technical_analysis', sid, output);
    expect(r.fact_keys).toContain('rsi_14');
    expect(getFact(sid, 'rsi_14')?.value).toBeCloseTo(57.4, 2);
  });
});

// =============================================================================
// Safe defaults
// =============================================================================

describe('extractor — safe defaults', () => {
  it('skips missing JSON paths and records reasons', () => {
    const sid = makeSession();
    const output = JSON.stringify({ period_label: 'FY-2025', canonical_numbers: { revenue: 100 } });
    const r = extractFactsFromAgentOutput('financial_analysis', sid, output);
    expect(r.extracted).toBe(1);
    expect(r.skipped).toBeGreaterThan(0);
    expect(r.skip_reasons.some((reason) => reason.includes('missing_path'))).toBe(true);
  });

  it('skips non-finite numeric values', () => {
    const sid = makeSession();
    const output = JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: { revenue: 'not_a_number', net_income: null, total_assets: 100 },
    });
    const r = extractFactsFromAgentOutput('financial_analysis', sid, output);
    expect(r.fact_keys).toEqual(['total_assets_fy2025']);
    expect(r.skip_reasons.some((reason) => reason.includes('non_finite_value') || reason.includes('missing_path'))).toBe(true);
  });

  it('unknown agent → no-op with reason', () => {
    const sid = makeSession();
    const r = extractFactsFromAgentOutput('mystery_agent', sid, '{"x":1}');
    expect(r.extracted).toBe(0);
    expect(r.skip_reasons[0]).toBe('unknown_agent_id:mystery_agent');
  });

  it('empty / unparseable output → safe skip (no fabrication)', () => {
    const sid = makeSession();
    const r = extractFactsFromAgentOutput('financial_analysis', sid, '');
    expect(r.extracted).toBe(0);
    expect(r.skip_reasons[0]).toBe('parse_failed_or_empty_output');
  });

  it('parses JSON-with-LLM-preamble (brace-bound recovery)', () => {
    const sid = makeSession();
    const raw = `Now I'll produce.\n{"period_label":"FY-2025","canonical_numbers":{"revenue":100}}\n\`\`\``;
    const r = extractFactsFromAgentOutput('financial_analysis', sid, raw);
    expect(r.fact_keys).toContain('revenue_fy2025');
  });

  it('per_period rule with missing period → skip per fact, not crash', () => {
    const sid = makeSession();
    // No period_label anywhere → all per_period rules skip
    const output = JSON.stringify({ canonical_numbers: { revenue: 100 } });
    const r = extractFactsFromAgentOutput('financial_analysis', sid, output);
    expect(r.extracted).toBe(0);
    expect(r.skip_reasons.some((reason) => reason.includes('period_missing_or_unparseable'))).toBe(true);
  });
});

// =============================================================================
// Cross-agent agreement / conflict (conservative)
// =============================================================================

describe('extractor — cross-agent agreement', () => {
  it('near-equal value across two agents bumps agreement_count', () => {
    const sid = makeSession();
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [{
        period_label: 'FY-2025',
        income_statement: { revenue: 2757295000000 },
      }],
    }));
    extractFactsFromAgentOutput('financial_analysis', sid, JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: { revenue: 2757295000000 },
    }));
    const fact = getFact(sid, 'revenue_fy2025')!;
    // bonus = (n-1) * 0.03; n=2 → 0.03
    expect(fact.confidence!.components.agreement_bonus).toBeCloseTo(0.03, 5);
    expect(fact.confidence!.components.conflict_penalty).toBe(0);
  });

  it('divergent value flips has_conflict + minor severity (never material/critical)', () => {
    const sid = makeSession();
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [{
        period_label: 'FY-2025',
        income_statement: { revenue: 2757295000000 },
      }],
    }));
    extractFactsFromAgentOutput('financial_analysis', sid, JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: { revenue: 9999999999999 }, // wildly different
    }));
    const fact = getFact(sid, 'revenue_fy2025')!;
    expect(fact.confidence!.components.conflict_penalty).toBeCloseTo(0.05, 5);
  });
});

// =============================================================================
// Best-effort wrapper
// =============================================================================

describe('extractor — tryExtractFactsBestEffort', () => {
  it('returns null when arguments are missing', () => {
    expect(tryExtractFactsBestEffort(undefined, undefined, undefined)).toBeNull();
    expect(tryExtractFactsBestEffort('financial_analysis', undefined, '{}')).toBeNull();
    expect(tryExtractFactsBestEffort('financial_analysis', 'sess', null)).toBeNull();
  });

  it('runs successfully and returns ExtractionResult', () => {
    const sid = makeSession();
    const output = JSON.stringify({ period_label: 'FY-2025', canonical_numbers: { revenue: 100 } });
    const r = tryExtractFactsBestEffort('financial_analysis', sid, output);
    expect(r).not.toBeNull();
    expect(r!.extracted).toBeGreaterThan(0);
  });

  it('swallows downstream errors (does not throw)', () => {
    // Use an agent registered in REGISTRY but with malformed JSON that
    // the loose-parser still fails to recover. Wrapper must return a
    // valid ExtractionResult with skip_reasons; no throw.
    const sid = makeSession();
    const r = tryExtractFactsBestEffort('financial_analysis', sid, '!!!not json!!!');
    expect(r).not.toBeNull();
    expect(r!.extracted).toBe(0);
  });
});

// =============================================================================
// Non-mutation
// =============================================================================

describe('extractor — non-mutation', () => {
  it('does not mutate the parsed output object visible to caller', () => {
    const sid = makeSession();
    const output = JSON.stringify({ period_label: 'FY-2025', canonical_numbers: { revenue: 100 } });
    const before = output.slice();
    extractFactsFromAgentOutput('financial_analysis', sid, output);
    expect(output).toBe(before);
  });

  it('listFacts after extraction matches fact_keys returned', () => {
    const sid = makeSession();
    const output = JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: { revenue: 100, net_income: 10 },
    });
    const r = extractFactsFromAgentOutput('financial_analysis', sid, output);
    const persistedKeys = listFacts(sid).map((f) => f.fact_key).sort();
    expect(persistedKeys).toEqual(r.fact_keys.slice().sort());
  });
});

// =============================================================================
// P1B Wave 1 — lineage integration
// =============================================================================

describe('extractor — P1B lineage integration', () => {
  it('records exactly one raw_extracted lineage node per persisted fact', () => {
    const sid = makeSession();
    const output = JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: { revenue: 100, net_income: 10 },
    });
    extractFactsFromAgentOutput('financial_analysis', sid, output);
    const rows = db.prepare(
      `SELECT fact_key, node_type FROM lineage_nodes WHERE session_id = ?`,
    ).all(sid) as Array<{ fact_key: string; node_type: string }>;
    expect(rows.length).toBe(2);
    for (const r of rows) expect(r.node_type).toBe('raw_extracted');
    expect(rows.map((r) => r.fact_key).sort()).toEqual([
      'net_income_fy2025',
      'revenue_fy2025',
    ]);
  });

  it('captures raw_value ≠ normalized_value for TRY currency rules', () => {
    const sid = makeSession();
    const output = JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: { revenue: 2_757_295_000_000 },
    });
    extractFactsFromAgentOutput('financial_analysis', sid, output);
    const row = db.prepare(
      `SELECT raw_value, normalized_value, unit_conversion FROM lineage_nodes WHERE session_id = ? AND fact_key = ?`,
    ).get(sid, 'revenue_fy2025') as { raw_value: string; normalized_value: string; unit_conversion: string };
    expect(JSON.parse(row.raw_value)).toBe(2_757_295_000_000);
    expect(JSON.parse(row.normalized_value)).toBe(2_757_295);
    expect(row.unit_conversion).toBe('TRY → TRY_mn /1e6');
  });

  it('persists null source_doc_id (Wave 1 honesty — no synthetic doc ids)', () => {
    const sid = makeSession();
    const output = JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: { revenue: 100 },
    });
    extractFactsFromAgentOutput('financial_analysis', sid, output);
    const row = db.prepare(
      `SELECT source_doc_id FROM lineage_nodes WHERE session_id = ? AND fact_key = ?`,
    ).get(sid, 'revenue_fy2025') as { source_doc_id: string | null };
    expect(row.source_doc_id).toBeNull();
  });

  it('records computed_by = agent_id', () => {
    const sid = makeSession();
    const output = JSON.stringify({
      standardized_statements: [{
        period_label: 'FY-2025',
        income_statement: { revenue: 100 },
      }],
    });
    extractFactsFromAgentOutput('parse_standardization', sid, output);
    const row = db.prepare(
      `SELECT computed_by FROM lineage_nodes WHERE session_id = ? AND fact_key = ?`,
    ).get(sid, 'revenue_fy2025') as { computed_by: string };
    expect(row.computed_by).toBe('parse_standardization');
  });

  it('lineage write does not throw when called against an invalid session id (best-effort)', () => {
    // Direct call to extractor with a session that does not exist. The
    // upsertFact will FAIL on FK, the extractor's per-rule try/catch will
    // mark it skipped, and the lineage hook is never reached. Importantly,
    // the wrapper-level call itself does not throw.
    const r = extractFactsFromAgentOutput('financial_analysis', 'no-such-session', JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: { revenue: 100 },
    }));
    expect(r.extracted).toBe(0);
    expect(r.skipped).toBeGreaterThan(0);
  });
});

// =============================================================================
// P1C Wave 1 — methodology snapshot lazy recording
// =============================================================================

describe('extractor — P1C methodology snapshot integration', () => {
  it('first successful fact write triggers exactly one session_methodology row', () => {
    const sid = makeSession();
    const output = JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: { revenue: 100 },
    });
    extractFactsFromAgentOutput('financial_analysis', sid, output);
    const row = db.prepare(
      `SELECT methodology_version, recorded_at FROM session_methodology WHERE session_id = ?`,
    ).get(sid) as { methodology_version: string; recorded_at: string } | undefined;
    expect(row).toBeDefined();
    expect(row!.methodology_version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('subsequent extractions in the same session are no-ops (INSERT OR IGNORE)', () => {
    const sid = makeSession();
    extractFactsFromAgentOutput('financial_analysis', sid, JSON.stringify({
      period_label: 'FY-2025', canonical_numbers: { revenue: 100 },
    }));
    const first = db.prepare(`SELECT recorded_at FROM session_methodology WHERE session_id = ?`).get(sid) as { recorded_at: string };
    extractFactsFromAgentOutput('financial_analysis', sid, JSON.stringify({
      period_label: 'FY-2025', canonical_numbers: { net_income: 10 },
    }));
    const second = db.prepare(`SELECT recorded_at FROM session_methodology WHERE session_id = ?`).get(sid) as { recorded_at: string };
    expect(second.recorded_at).toBe(first.recorded_at);
  });

  it('extraction succeeds when methodology recording fails (best-effort)', () => {
    // Methodology recording for a non-existent session FK-fails inside
    // tryRecordSessionMethodology and is swallowed. The extractor's per-
    // rule loop must still proceed (and skip everything because the same
    // FK fails on upsertFact) without throwing at the top level.
    expect(() => extractFactsFromAgentOutput('financial_analysis', 'no-session', JSON.stringify({
      period_label: 'FY-2025', canonical_numbers: { revenue: 100 },
    }))).not.toThrow();
  });
});
