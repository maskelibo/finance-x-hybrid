/**
 * P1D Wave 1 — truth arbitration tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  arbitrateTruth,
  arbitrateFactFromLineage,
  type TruthCandidate,
} from './truth-arbitration.js';

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

const c = (overrides: Partial<TruthCandidate> = {}): TruthCandidate => ({
  fact_key: 'revenue_fy2025',
  value: 1000,
  confidence_score: 0.9,
  source_type: 'direct_disclosure',
  freshness_days: 10,
  computed_by: 'parse_standardization',
  ...overrides,
});

// =============================================================================
// Pure arbitrateTruth
// =============================================================================

describe('arbitrateTruth — basic', () => {
  it('throws on empty input', () => {
    expect(() => arbitrateTruth([])).toThrow();
  });

  it('single-candidate input returns trivial decision', () => {
    const d = arbitrateTruth([c()], { arbitration_timestamp: '2026-04-29T10:00:00.000Z' });
    expect(d.canonical_value).toBe(1000);
    expect(d.canonical_source).toBe('parse_standardization');
    expect(d.rejected_candidates).toEqual([]);
    expect(d.decision_reason).toContain('single candidate');
    expect(d.ownership?.is_primary).toBe(true);
  });

  it('deterministic — identical inputs produce identical decisions', () => {
    const cands = [c({ computed_by: 'a' }), c({ computed_by: 'b', confidence_score: 0.5 })];
    const d1 = arbitrateTruth(cands, { arbitration_timestamp: 'x' });
    const d2 = arbitrateTruth(cands, { arbitration_timestamp: 'x' });
    expect(d1).toEqual(d2);
  });
});

// =============================================================================
// Source priority
// =============================================================================

describe('arbitrateTruth — source priority', () => {
  it('direct_disclosure beats inferred even with equal confidence', () => {
    const d = arbitrateTruth([
      c({ computed_by: 'agent_inf', source_type: 'inferred' }),
      c({ computed_by: 'agent_dd', source_type: 'direct_disclosure' }),
    ]);
    expect(d.canonical_source).toBe('agent_dd');
    expect(d.rejected_candidates[0].computed_by).toBe('agent_inf');
    expect(d.rejected_candidates[0].rejection_reason).toContain('stronger source');
  });

  it('computed beats analyst_estimate with same confidence', () => {
    const d = arbitrateTruth([
      c({ computed_by: 'analyst', source_type: 'analyst_estimate' }),
      c({ computed_by: 'computed', source_type: 'computed' }),
    ]);
    expect(d.canonical_source).toBe('computed');
  });
});

// =============================================================================
// Confidence + freshness + conflict signals
// =============================================================================

describe('arbitrateTruth — confidence & freshness', () => {
  it('higher confidence wins when source taxonomy matches', () => {
    const d = arbitrateTruth([
      c({ computed_by: 'low', source_type: 'computed', confidence_score: 0.3 }),
      c({ computed_by: 'high', source_type: 'computed', confidence_score: 0.95 }),
    ]);
    expect(d.canonical_source).toBe('high');
    expect(d.rejected_candidates[0].rejection_reason).toContain('higher confidence');
  });

  it('penalises stale freshness', () => {
    const d = arbitrateTruth([
      c({ computed_by: 'stale', source_type: 'computed', freshness_days: 200 }),
      c({ computed_by: 'fresh', source_type: 'computed', freshness_days: 1 }),
    ]);
    expect(d.canonical_source).toBe('fresh');
  });

  it('penalises has_conflict candidates', () => {
    const d = arbitrateTruth([
      c({ computed_by: 'conflicted', has_conflict: true }),
      c({ computed_by: 'clean', has_conflict: false }),
    ]);
    expect(d.canonical_source).toBe('clean');
    expect(d.rejected_candidates[0].rejection_reason).toContain('conflict');
  });

  it('preserves rejected candidates with values & rejection_reason', () => {
    const d = arbitrateTruth([
      c({ computed_by: 'a', value: 100, source_type: 'inferred' }),
      c({ computed_by: 'b', value: 200, source_type: 'direct_disclosure' }),
      c({ computed_by: 'c', value: 300, source_type: 'analyst_estimate' }),
    ]);
    expect(d.canonical_source).toBe('b');
    expect(d.rejected_candidates.length).toBe(2);
    for (const r of d.rejected_candidates) {
      expect(r.value).not.toBeNull();
      expect(r.rejection_reason.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// Ownership integration
// =============================================================================

describe('arbitrateTruth — ownership annotation', () => {
  it('attaches OwnershipCheck to the decision', () => {
    const d = arbitrateTruth([c({ fact_key: 'revenue_fy2025', computed_by: 'parse_standardization' })]);
    expect(d.ownership?.is_primary).toBe(true);
    expect(d.ownership?.action).toBe('accept');
  });

  it('non-owner winner is annotated with arbitration_required action', () => {
    const d = arbitrateTruth([c({
      fact_key: 'revenue_fy2025',
      computed_by: 'financial_analysis',  // exception owner
      source_type: 'computed',
    })]);
    expect(d.ownership?.is_exception).toBe(true);
    expect(d.ownership?.action).toBe('arbitration_required');
  });
});

// =============================================================================
// Live arbitration via lineage
// =============================================================================

describe('arbitrateFactFromLineage', () => {
  it('returns null when no lineage rows exist', () => {
    const sid = makeSession();
    expect(arbitrateFactFromLineage(sid, 'no_such_fact')).toBeNull();
  });

  it('builds candidates from lineage_nodes for the fact_key', () => {
    const sid = makeSession();
    // Two writers for the same fact_key.
    db.prepare(
      `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, raw_value, normalized_value)
       VALUES (?, 'revenue_fy2025', ?, 'raw_extracted', 'parse_standardization', ?, '2757295000000', '2757295')`,
    ).run(sid, `ln-${nanoid(10)}`, '2026-04-25T10:00:00.000Z');
    db.prepare(
      `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, raw_value, normalized_value)
       VALUES (?, 'revenue_fy2025', ?, 'raw_extracted', 'mystery_agent', ?, '9999999999', '9999')`,
    ).run(sid, `ln-${nanoid(10)}`, '2026-04-25T10:01:00.000Z');

    const decision = arbitrateFactFromLineage(sid, 'revenue_fy2025', {
      reference_at: '2026-04-29T10:00:00.000Z',
    });
    expect(decision).not.toBeNull();
    // parse_standardization → direct_disclosure (priority 100); mystery → inferred (20)
    // parse_std should win.
    expect(decision!.canonical_source).toBe('parse_standardization');
    expect(decision!.rejected_candidates.length).toBe(1);
    expect(decision!.rejected_candidates[0].computed_by).toBe('mystery_agent');
  });
});
