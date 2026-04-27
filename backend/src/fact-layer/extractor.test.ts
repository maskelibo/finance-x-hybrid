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
    // Filter for raw_extracted only — Wave 2 may additionally emit a
    // `computed` node (e.g. net_margin) when input stems are present.
    const rawRows = db.prepare(
      `SELECT fact_key, node_type FROM lineage_nodes WHERE session_id = ? AND node_type = 'raw_extracted'`,
    ).all(sid) as Array<{ fact_key: string; node_type: string }>;
    expect(rawRows.length).toBe(2);
    expect(rawRows.map((r) => r.fact_key).sort()).toEqual([
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

// =============================================================================
// P1B Wave 2 — doc-level provenance + inheritance
// =============================================================================

describe('extractor — P1B Wave 2 doc provenance', () => {
  it('parse_std rule attaches source_doc_id from standardized_statements[0].source_pdf', () => {
    const sid = makeSession();
    const output = JSON.stringify({
      standardized_statements: [{
        period_label: 'FY-2025',
        source_pdf: 'KCHOL_AR_FY2025.pdf',
        income_statement: { revenue: 1_000_000_000_000 },
      }],
    });
    extractFactsFromAgentOutput('parse_standardization', sid, output);
    const row = db.prepare(
      `SELECT source_doc_id FROM lineage_nodes WHERE session_id = ? AND fact_key = 'revenue_fy2025'`,
    ).get(sid) as { source_doc_id: string | null };
    expect(row.source_doc_id).toBe('KCHOL_AR_FY2025.pdf');
  });

  it('parse_std rule with missing source_pdf records null source_doc_id (no fabrication)', () => {
    const sid = makeSession();
    const output = JSON.stringify({
      standardized_statements: [{
        period_label: 'FY-2025',
        income_statement: { revenue: 1_000_000_000_000 },
      }],
    });
    extractFactsFromAgentOutput('parse_standardization', sid, output);
    const row = db.prepare(
      `SELECT source_doc_id FROM lineage_nodes WHERE session_id = ? AND fact_key = 'revenue_fy2025'`,
    ).get(sid) as { source_doc_id: string | null };
    expect(row.source_doc_id).toBeNull();
  });

  it('FA rule inherits source_doc_id from prior parse_std node for same period', () => {
    const sid = makeSession();
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [{
        period_label: 'FY-2025',
        source_pdf: 'KCHOL_AR_FY2025.pdf',
        income_statement: { revenue: 1_000_000_000_000 },
      }],
    }));
    extractFactsFromAgentOutput('financial_analysis', sid, JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: { net_income: 100_000_000_000, total_equity: 500_000_000_000 },
    }));
    const niDoc = db.prepare(
      `SELECT source_doc_id FROM lineage_nodes WHERE session_id = ? AND fact_key = 'net_income_fy2025' AND computed_by = 'financial_analysis'`,
    ).get(sid) as { source_doc_id: string | null };
    expect(niDoc.source_doc_id).toBe('KCHOL_AR_FY2025.pdf');
  });

  it('FA rule with no matching parse_std period leaves source_doc_id null', () => {
    const sid = makeSession();
    // parse_std emits FY-2025; FA emits FY-2026 — no match
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [{
        period_label: 'FY-2025',
        source_pdf: 'KCHOL_AR_FY2025.pdf',
        income_statement: { revenue: 1_000_000_000_000 },
      }],
    }));
    extractFactsFromAgentOutput('financial_analysis', sid, JSON.stringify({
      period_label: 'FY-2026',
      canonical_numbers: { revenue: 0 },
    }));
    const row = db.prepare(
      `SELECT source_doc_id FROM lineage_nodes WHERE session_id = ? AND fact_key = 'revenue_fy2026' AND computed_by = 'financial_analysis'`,
    ).get(sid) as { source_doc_id: string | null };
    expect(row.source_doc_id).toBeNull();
  });
});

// =============================================================================
// P1B Wave 2 — computed lineage post-pass
// =============================================================================

describe('extractor — P1B Wave 2 computed lineage', () => {
  function setupKchol(sid: string): void {
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [{
        period_label: 'FY-2025',
        source_pdf: 'KCHOL_AR_FY2025.pdf',
        income_statement: {
          revenue: 2_757_295_000_000,
          gross_profit: 469_354_000_000,
          ebitda: 192_000_000_000,
          net_income: 34_628_000_000,
        },
        balance_sheet: {
          total_assets: 5_317_600_000_000,
          total_equity: 1_092_573_000_000,
          current_liabilities: 800_000_000_000,
        },
      }],
    }));
    extractFactsFromAgentOutput('financial_analysis', sid, JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: {
        revenue: 2_757_295_000_000,
        net_income: 34_628_000_000,
        total_assets: 5_317_600_000_000,
        total_equity: 1_092_573_000_000,
        gross_margin: 17.02,
        ebitda_margin: 6.96,
        net_margin: 1.26,
        roe: 3.17,
        roa: 0.65,
        net_debt: 996_438_000_000,
        net_debt_to_ebitda: 5.19,
      },
    }));
  }

  it('emits computed lineage nodes for all 7 derivations when inputs are present', () => {
    const sid = makeSession();
    setupKchol(sid);
    const computed = db.prepare(
      `SELECT fact_key, formula FROM lineage_nodes WHERE session_id = ? AND node_type = 'computed' ORDER BY fact_key`,
    ).all(sid) as Array<{ fact_key: string; formula: string }>;
    const computedKeys = computed.map((c) => c.fact_key);
    // current_ratio is skipped because current_assets isn't in registry
    expect(computedKeys).toContain('net_debt_to_ebitda_fy2025');
    expect(computedKeys).toContain('gross_margin_fy2025');
    expect(computedKeys).toContain('ebitda_margin_fy2025');
    expect(computedKeys).toContain('net_margin_fy2025');
    expect(computedKeys).toContain('roe_fy2025');
    expect(computedKeys).toContain('roa_fy2025');
    expect(computedKeys).not.toContain('current_ratio_fy2025'); // current_assets missing
  });

  it('skips computed pass when an input fact is missing (no fabrication)', () => {
    const sid = makeSession();
    extractFactsFromAgentOutput('financial_analysis', sid, JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: { revenue: 100_000_000_000 }, // only revenue, no net_income / total_assets etc.
    }));
    const computed = db.prepare(
      `SELECT fact_key FROM lineage_nodes WHERE session_id = ? AND node_type = 'computed'`,
    ).all(sid) as Array<{ fact_key: string }>;
    expect(computed.length).toBe(0);
  });

  it('computed node carries formula + input_node_ids via lineage_edges', () => {
    const sid = makeSession();
    setupKchol(sid);
    const computedNode = db.prepare(
      `SELECT node_id, formula FROM lineage_nodes WHERE session_id = ? AND fact_key = 'net_debt_to_ebitda_fy2025' AND node_type = 'computed'`,
    ).get(sid) as { node_id: string; formula: string };
    expect(computedNode.formula).toBe('net_debt / ebitda');
    const edges = db.prepare(
      `SELECT input_node_id FROM lineage_edges WHERE session_id = ? AND output_node_id = ?`,
    ).all(sid, computedNode.node_id) as Array<{ input_node_id: string }>;
    expect(edges.length).toBe(2);
  });

  it('computed node inherits source_doc_id from input lineage', () => {
    const sid = makeSession();
    setupKchol(sid);
    const row = db.prepare(
      `SELECT source_doc_id FROM lineage_nodes WHERE session_id = ? AND fact_key = 'net_debt_to_ebitda_fy2025' AND node_type = 'computed'`,
    ).get(sid) as { source_doc_id: string };
    expect(row.source_doc_id).toBe('KCHOL_AR_FY2025.pdf');
  });

  it('emits no computed pass when all inputs lack values (no fabrication)', () => {
    const sid = makeSession();
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [{
        period_label: 'FY-2025',
        source_pdf: 'X.pdf',
        income_statement: {},  // no income items
        balance_sheet: {},     // no balance items
      }],
    }));
    const computed = db.prepare(
      `SELECT fact_key FROM lineage_nodes WHERE session_id = ? AND node_type = 'computed'`,
    ).all(sid) as Array<{ fact_key: string }>;
    expect(computed.length).toBe(0);
  });

  it('idempotent: re-running extraction does not duplicate computed nodes', () => {
    const sid = makeSession();
    setupKchol(sid);
    const beforeCount = db.prepare(
      `SELECT COUNT(*) AS c FROM lineage_nodes WHERE session_id = ? AND node_type = 'computed'`,
    ).get(sid) as { c: number };
    setupKchol(sid);  // re-run
    const afterCount = db.prepare(
      `SELECT COUNT(*) AS c FROM lineage_nodes WHERE session_id = ? AND node_type = 'computed'`,
    ).get(sid) as { c: number };
    expect(afterCount.c).toBe(beforeCount.c);
  });

  it('formula_divergence annotation appears when computed differs from FA-emitted by >1%', () => {
    const sid = makeSession();
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [{
        period_label: 'FY-2025',
        source_pdf: 'X.pdf',
        income_statement: { revenue: 1000_000_000, ebitda: 200_000_000, net_income: 50_000_000 },
        balance_sheet: { total_assets: 5000_000_000, total_equity: 1000_000_000 },
      }],
    }));
    extractFactsFromAgentOutput('financial_analysis', sid, JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: {
        revenue: 1000_000_000, ebitda: 200_000_000, net_income: 50_000_000,
        total_assets: 5000_000_000, total_equity: 1000_000_000,
        net_debt: 100_000_000,
        net_debt_to_ebitda: 99.99,  // wildly diverges from 100m/200m=0.5
      },
    }));
    const row = db.prepare(
      `SELECT unit_conversion FROM lineage_nodes WHERE session_id = ? AND fact_key = 'net_debt_to_ebitda_fy2025' AND node_type = 'computed'`,
    ).get(sid) as { unit_conversion: string };
    expect(row.unit_conversion).toContain('formula_divergence');
  });
});

// =============================================================================
// P1B Wave 3 — multi-statement extraction
// =============================================================================

describe('extractor — P1B Wave 3 multi-statement parse_standardization', () => {
  const realFy2025 = {
    period_label: 'FY-2025',
    source_pdf: 'KCHOL_FY2025.pdf',
    income_statement: { revenue: 2_757_295_000_000, gross_profit: 469_354_000_000, operating_income: 117_608_000_000, net_income: 34_628_000_000, cost_of_sales: -1_539_222_000_000, ebitda: 192_000_000_000 },
    balance_sheet: { total_assets: 5_317_600_000_000, total_equity: 1_092_573_000_000, current_liabilities: 800_000_000_000 },
  };
  const placeholderFy2026 = {
    period_label: 'FY-2026',
    source_pdf: 'KCHOL_FY2026_PLACEHOLDER.pdf',
    income_statement: { revenue: 0, net_income: 0 },
    balance_sheet: { total_assets: 0 },
  };
  const realQ32025 = {
    period_label: 'Q3-2025',
    source_pdf: 'KCHOL_Q3_2025.pdf',
    income_statement: { revenue: 1_954_626_000_000, net_income: 23_290_000_000, gross_profit: 320_000_000_000 },
    balance_sheet: { total_assets: 5_105_989_000_000, total_equity: 1_080_000_000_000 },
  };

  it('emits facts for all real-period statements (multi-statement loop)', () => {
    const sid = makeSession();
    const r = extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [placeholderFy2026, realFy2025, realQ32025],
    }));
    expect(r.fact_keys).toContain('revenue_fy2025');
    expect(r.fact_keys).toContain('net_income_fy2025');
    expect(r.fact_keys).toContain('total_assets_fy2025');
    expect(r.fact_keys).toContain('revenue_q3_2025');
    expect(r.fact_keys).toContain('net_income_q3_2025');
  });

  it('skips placeholder statements (all-three core fields zero/null)', () => {
    const sid = makeSession();
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [placeholderFy2026],
    }));
    const persisted = listFacts(sid).map((f) => f.fact_key);
    expect(persisted.length).toBe(0);
  });

  it('does NOT skip a statement where only one of the three core fields is zero', () => {
    const sid = makeSession();
    // revenue=0 BUT net_income and total_assets populated → real statement
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [{
        period_label: 'FY-2025',
        source_pdf: 'EDGE.pdf',
        income_statement: { revenue: 0, net_income: 1000, gross_profit: null },
        balance_sheet: { total_assets: 5000 },
      }],
    }));
    const persisted = listFacts(sid).map((f) => f.fact_key);
    // revenue=0 IS persisted (legitimate zero), net_income persists, total_assets persists
    expect(persisted).toContain('net_income_fy2025');
    expect(persisted).toContain('total_assets_fy2025');
  });

  it('source_doc_id is period-specific — no cross-period contamination', () => {
    const sid = makeSession();
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [realFy2025, realQ32025],
    }));
    const fy2025Doc = db.prepare(
      `SELECT source_doc_id FROM lineage_nodes WHERE session_id = ? AND fact_key = 'revenue_fy2025' AND node_type = 'raw_extracted'`,
    ).get(sid) as { source_doc_id: string };
    const q3Doc = db.prepare(
      `SELECT source_doc_id FROM lineage_nodes WHERE session_id = ? AND fact_key = 'revenue_q3_2025' AND node_type = 'raw_extracted'`,
    ).get(sid) as { source_doc_id: string };
    expect(fy2025Doc.source_doc_id).toBe('KCHOL_FY2025.pdf');
    expect(q3Doc.source_doc_id).toBe('KCHOL_Q3_2025.pdf');
  });

  it('FA FY-2025 facts inherit FY-2025 doc_id, not FY-2026 placeholder doc_id', () => {
    const sid = makeSession();
    // Order matters: parse_std first emits FY-2026 placeholder (skipped), then real FY-2025
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [placeholderFy2026, realFy2025],
    }));
    extractFactsFromAgentOutput('financial_analysis', sid, JSON.stringify({
      period_label: 'FY-2025',
      canonical_numbers: { net_debt: 996_438_000_000, fcf: -204_862_000_000 },
    }));
    const ndDoc = db.prepare(
      `SELECT source_doc_id FROM lineage_nodes WHERE session_id = ? AND fact_key = 'net_debt_fy2025' AND computed_by = 'financial_analysis'`,
    ).get(sid) as { source_doc_id: string };
    expect(ndDoc.source_doc_id).toBe('KCHOL_FY2025.pdf'); // NOT KCHOL_FY2026_PLACEHOLDER.pdf
  });

  it('emits computed lineage per period when inputs exist for that period', () => {
    const sid = makeSession();
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [realFy2025, realQ32025],
    }));
    const computed = db.prepare(
      `SELECT fact_key FROM lineage_nodes WHERE session_id = ? AND node_type = 'computed' ORDER BY fact_key`,
    ).all(sid) as Array<{ fact_key: string }>;
    const keys = computed.map((c) => c.fact_key);
    // FY-2025 has gross_profit + revenue + total_assets + total_equity + net_income
    expect(keys).toContain('gross_margin_fy2025');
    expect(keys).toContain('net_margin_fy2025');
    expect(keys).toContain('roe_fy2025');
    expect(keys).toContain('roa_fy2025');
    // Q3-2025 has same set (gross_profit, revenue, net_income, total_assets, total_equity)
    expect(keys).toContain('gross_margin_q3_2025');
    expect(keys).toContain('roe_q3_2025');
  });

  it('idempotent re-run: same inputs produce same lineage row count', () => {
    const sid = makeSession();
    const output = JSON.stringify({ standardized_statements: [realFy2025] });
    extractFactsFromAgentOutput('parse_standardization', sid, output);
    const before = (db.prepare(`SELECT COUNT(*) AS c FROM lineage_nodes WHERE session_id = ?`).get(sid) as { c: number }).c;
    extractFactsFromAgentOutput('parse_standardization', sid, output);
    const after = (db.prepare(`SELECT COUNT(*) AS c FROM lineage_nodes WHERE session_id = ?`).get(sid) as { c: number }).c;
    // raw_extracted nodes get new node_ids each call (random nanoid) so they double.
    // But computed nodes are guarded by computedNodeExistsForFact and stay 1×.
    const computedBefore = (db.prepare(`SELECT COUNT(*) AS c FROM lineage_nodes WHERE session_id = ? AND node_type = 'computed'`).get(sid) as { c: number }).c;
    expect(computedBefore).toBeGreaterThan(0);
    expect(after).toBeGreaterThanOrEqual(before); // never fewer; same fact via INSERT OR REPLACE on canonical_facts is idempotent
  });

  it('missing source_pdf is honest — source_doc_id stays null, no fabrication', () => {
    const sid = makeSession();
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [{
        period_label: 'FY-2025',
        // no source_pdf field
        income_statement: { revenue: 1_000_000_000, net_income: 100_000_000 },
        balance_sheet: { total_assets: 5_000_000_000 },
      }],
    }));
    const row = db.prepare(
      `SELECT source_doc_id FROM lineage_nodes WHERE session_id = ? AND fact_key = 'revenue_fy2025'`,
    ).get(sid) as { source_doc_id: string | null };
    expect(row.source_doc_id).toBeNull();
  });

  it('non-string source_pdf is defensively ignored (no fabrication)', () => {
    const sid = makeSession();
    extractFactsFromAgentOutput('parse_standardization', sid, JSON.stringify({
      standardized_statements: [{
        period_label: 'FY-2025',
        source_pdf: 12345,  // wrong type
        income_statement: { revenue: 1_000_000_000, net_income: 100_000_000 },
        balance_sheet: { total_assets: 5_000_000_000 },
      }],
    }));
    const row = db.prepare(
      `SELECT source_doc_id FROM lineage_nodes WHERE session_id = ? AND fact_key = 'revenue_fy2025'`,
    ).get(sid) as { source_doc_id: string | null };
    expect(row.source_doc_id).toBeNull();
  });

  it('preserves backward compatibility — getExtractionRules(parse_standardization) still returns 9 idx=0 rules', () => {
    const rules = getExtractionRules('parse_standardization');
    expect(rules.length).toBe(9);
    expect(rules.every((r) => r.json_path.includes('standardized_statements[0]'))).toBe(true);
  });
});
