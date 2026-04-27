/**
 * P2A Wave 1 — contradiction engine tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  classifyNumericDelta,
  getThresholdsForFact,
  detectContradictions,
  detectDirectNumericConflicts,
} from './contradiction-engine.js';

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

function insertLineage(
  sid: string, factKey: string, agent: string, normalized: number, at: string,
): void {
  db.prepare(
    `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, normalized_value)
     VALUES (?, ?, ?, 'raw_extracted', ?, ?, ?)`,
  ).run(sid, factKey, `ln-${nanoid(10)}`, agent, at, JSON.stringify(normalized));
}

// =============================================================================
// classifyNumericDelta — 3-tier
// =============================================================================

describe('classifyNumericDelta — 3-tier severity', () => {
  it('< soft (3%) → no_conflict', () => {
    const r = classifyNumericDelta('revenue_fy2025', [1000, 1020]);
    expect(r.severity).toBe('no_conflict');
  });

  it('soft band [3%, 10%) → soft', () => {
    const r = classifyNumericDelta('revenue_fy2025', [1000, 1050]);
    expect(r.severity).toBe('soft');
    expect(r.relative_delta).toBeCloseTo(0.0476, 3);
  });

  it('material band [10%, 25%) → material', () => {
    const r = classifyNumericDelta('revenue_fy2025', [1000, 1150]);
    expect(r.severity).toBe('material');
  });

  it('≥ 25% → critical', () => {
    const r = classifyNumericDelta('revenue_fy2025', [1000, 1500]);
    expect(r.severity).toBe('critical');
  });

  it('single-value or empty → no_conflict', () => {
    expect(classifyNumericDelta('x', []).severity).toBe('no_conflict');
    expect(classifyNumericDelta('x', [42]).severity).toBe('no_conflict');
  });

  it('zero-baseline → no_conflict (cannot compute relative)', () => {
    expect(classifyNumericDelta('x', [0, 0]).severity).toBe('no_conflict');
  });

  it('non-finite values are skipped (NaN ignored, finite pair classified)', () => {
    // NaN dropped; remaining 100 vs 105 = 4.76% → soft band
    const r = classifyNumericDelta('x', [NaN, 100, 105]);
    expect(r.severity).toBe('soft');
    // Pure no_conflict case: < 3% delta
    expect(classifyNumericDelta('x', [100, 102]).severity).toBe('no_conflict');
  });
});

describe('getThresholdsForFact — custom prefixes', () => {
  it('default thresholds for unknown fact_key', () => {
    expect(getThresholdsForFact('revenue_fy2025').soft).toBeCloseTo(0.03, 5);
  });

  it('usd_try uses tighter currency thresholds', () => {
    expect(getThresholdsForFact('usd_try').soft).toBeCloseTo(0.005, 5);
    expect(getThresholdsForFact('usd_try').critical).toBeCloseTo(0.02, 5);
  });

  it('shares_outstanding uses very tight thresholds', () => {
    expect(getThresholdsForFact('shares_outstanding').soft).toBeCloseTo(0.001, 5);
  });

  it('eps_2025 uses eps thresholds via prefix match', () => {
    expect(getThresholdsForFact('eps_2025').material).toBeCloseTo(0.03, 5);
  });
});

// =============================================================================
// detectDirectNumericConflicts — lineage-based
// =============================================================================

describe('detectDirectNumericConflicts', () => {
  it('returns empty when no lineage rows exist', () => {
    const sid = makeSession();
    expect(detectDirectNumericConflicts(sid)).toEqual([]);
  });

  it('single-writer fact → no conflict', () => {
    const sid = makeSession();
    insertLineage(sid, 'revenue_fy2025', 'parse_standardization', 1000, '2026-04-29T10:00:00Z');
    expect(detectDirectNumericConflicts(sid)).toEqual([]);
  });

  it('two writers within tolerance → no conflict', () => {
    const sid = makeSession();
    insertLineage(sid, 'revenue_fy2025', 'parse_standardization', 1000, '2026-04-29T10:00:00Z');
    insertLineage(sid, 'revenue_fy2025', 'financial_analysis', 1010, '2026-04-29T10:01:00Z');
    expect(detectDirectNumericConflicts(sid)).toEqual([]);
  });

  it('two writers in soft band → severity=soft', () => {
    const sid = makeSession();
    insertLineage(sid, 'revenue_fy2025', 'a', 1000, '2026-04-29T10:00:00Z');
    insertLineage(sid, 'revenue_fy2025', 'b', 1050, '2026-04-29T10:01:00Z');
    const c = detectDirectNumericConflicts(sid);
    expect(c.length).toBe(1);
    expect(c[0].severity).toBe('soft');
    expect(c[0].fact_key).toBe('revenue_fy2025');
    expect(c[0].candidates.length).toBe(2);
  });

  it('two writers in material band → severity=material', () => {
    const sid = makeSession();
    insertLineage(sid, 'revenue_fy2025', 'a', 1000, '2026-04-29T10:00:00Z');
    insertLineage(sid, 'revenue_fy2025', 'b', 1200, '2026-04-29T10:01:00Z');
    const c = detectDirectNumericConflicts(sid);
    expect(c[0].severity).toBe('material');
  });

  it('two writers in critical band → severity=critical', () => {
    const sid = makeSession();
    insertLineage(sid, 'revenue_fy2025', 'a', 1000, '2026-04-29T10:00:00Z');
    insertLineage(sid, 'revenue_fy2025', 'b', 2000, '2026-04-29T10:01:00Z');
    const c = detectDirectNumericConflicts(sid);
    expect(c[0].severity).toBe('critical');
  });

  it('multiple fact_keys produce separate conflict entries', () => {
    const sid = makeSession();
    insertLineage(sid, 'revenue_fy2025', 'a', 1000, '2026-04-29T10:00:00Z');
    insertLineage(sid, 'revenue_fy2025', 'b', 2000, '2026-04-29T10:01:00Z');   // critical (100% delta)
    insertLineage(sid, 'ebitda_fy2025',  'a', 200,  '2026-04-29T10:02:00Z');
    insertLineage(sid, 'ebitda_fy2025',  'b', 210,  '2026-04-29T10:03:00Z');   // soft (4.76% delta)
    insertLineage(sid, 'roa_fy2025',     'a', 100,  '2026-04-29T10:04:00Z');
    insertLineage(sid, 'roa_fy2025',     'b', 102,  '2026-04-29T10:05:00Z');   // no_conflict (~2%)
    const c = detectDirectNumericConflicts(sid);
    expect(c.length).toBe(2);
    expect(c.find((x) => x.fact_key === 'revenue_fy2025')!.severity).toBe('critical');
    expect(c.find((x) => x.fact_key === 'ebitda_fy2025')!.severity).toBe('soft');
    expect(c.find((x) => x.fact_key === 'roa_fy2025')).toBeUndefined();
  });
});

// =============================================================================
// detectContradictions — top-level report
// =============================================================================

describe('detectContradictions — top-level report', () => {
  it('empty session → consistency_score = 1.0', () => {
    const sid = makeSession();
    const r = detectContradictions(sid);
    expect(r.total_conflicts).toBe(0);
    expect(r.overall_consistency_score).toBe(1);
    expect(r.by_severity).toEqual({ soft: 0, material: 0, critical: 0 });
  });

  it('one critical → consistency penalised', () => {
    const sid = makeSession();
    insertLineage(sid, 'revenue_fy2025', 'a', 1000, '2026-04-29T10:00:00Z');
    insertLineage(sid, 'revenue_fy2025', 'b', 2000, '2026-04-29T10:01:00Z');
    const r = detectContradictions(sid);
    expect(r.total_conflicts).toBe(1);
    expect(r.by_severity.critical).toBe(1);
    expect(r.overall_consistency_score).toBeCloseTo(0.9, 3);
  });

  it('mixed severity counts roll up by_severity correctly', () => {
    const sid = makeSession();
    insertLineage(sid, 'k_critical', 'a', 1000, '2026-04-29T10:00:00Z');
    insertLineage(sid, 'k_critical', 'b', 2000, '2026-04-29T10:01:00Z');
    insertLineage(sid, 'k_material', 'a', 1000, '2026-04-29T10:02:00Z');
    insertLineage(sid, 'k_material', 'b', 1200, '2026-04-29T10:03:00Z');
    insertLineage(sid, 'k_soft',     'a', 1000, '2026-04-29T10:04:00Z');
    insertLineage(sid, 'k_soft',     'b', 1050, '2026-04-29T10:05:00Z');
    const r = detectContradictions(sid);
    expect(r.by_severity.critical).toBe(1);
    expect(r.by_severity.material).toBe(1);
    expect(r.by_severity.soft).toBe(1);
    expect(r.overall_consistency_score).toBeLessThan(1);
  });

  it('non-blocking: detection never throws + never modifies DB', () => {
    const sid = makeSession();
    insertLineage(sid, 'k', 'a', 1000, '2026-04-29T10:00:00Z');
    insertLineage(sid, 'k', 'b', 2000, '2026-04-29T10:01:00Z');
    const beforeRows = db.prepare(`SELECT COUNT(*) AS c FROM lineage_nodes WHERE session_id = ?`).get(sid) as { c: number };
    detectContradictions(sid);
    const afterRows = db.prepare(`SELECT COUNT(*) AS c FROM lineage_nodes WHERE session_id = ?`).get(sid) as { c: number };
    expect(afterRows.c).toBe(beforeRows.c);
  });

  it('cross-session isolation', () => {
    const sa = makeSession();
    const sb = makeSession();
    insertLineage(sa, 'k', 'a', 1000, '2026-04-29T10:00:00Z');
    insertLineage(sa, 'k', 'b', 2000, '2026-04-29T10:01:00Z');
    expect(detectContradictions(sa).total_conflicts).toBe(1);
    expect(detectContradictions(sb).total_conflicts).toBe(0);
  });
});
