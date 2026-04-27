/**
 * P1A Wave 2 — pack-v2 composer + helpers tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  getCanonicalFactPackV2,
  listLowConfidenceFacts,
  summarizeConfidence,
} from './pack-v2.js';
import { upsertFact, type FactSource } from './store.js';

const sessions: string[] = [];

function makeSession(ticker = 'TEST'): string {
  const id = `t-${nanoid(8)}`;
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
    db.prepare(`DELETE FROM analysis_sessions WHERE id = ?`).run(id);
  }
});

const docSrc = (overrides: Partial<FactSource> = {}): FactSource => ({
  type: 'document',
  doc_id: 'TEST_FILING',
  extracted_at: '2026-04-27T10:00:00.000Z',
  freshness_days: 5,
  ...overrides,
});

describe('pack-v2 — empty session', () => {
  it('returns a well-formed empty pack without throwing', () => {
    const sid = makeSession('KCHOL');
    const pack = getCanonicalFactPackV2(sid);
    expect(pack.fact_count).toBe(0);
    expect(pack.facts).toEqual({});
    expect(pack.confidence_summary.avg_score).toBe(0);
    // All five tier keys present
    expect(Object.keys(pack.confidence_summary.tier_counts).sort()).toEqual([
      'CERTAIN', 'HIGH', 'LOW', 'MEDIUM', 'SPECULATIVE',
    ]);
    for (const v of Object.values(pack.confidence_summary.tier_counts)) {
      expect(v).toBe(0);
    }
    expect(pack.confidence_summary.low_confidence_keys).toEqual([]);
    expect(pack.confidence_summary.speculative_keys).toEqual([]);
    expect(pack.confidence_summary.unscored_keys).toEqual([]);
    expect(pack.conflict_summary.disputed_keys).toEqual([]);
    expect(pack.ticker).toBe('KCHOL');
  });
});

describe('pack-v2 — mixed confidence / null confidence rows', () => {
  it('separates scored vs unscored and excludes unscored from avg', () => {
    const sid = makeSession();
    // Scored fact (high)
    upsertFact({
      session_id: sid,
      fact_key: 'high_metric',
      value: 1,
      unit: 'decimal',
      sources: [docSrc()],
      confidence_inputs: { computation_complexity: 0 }, // CERTAIN tier
    });
    // Scored fact (low)
    upsertFact({
      session_id: sid,
      fact_key: 'low_metric',
      value: 2,
      unit: 'decimal',
      sources: [docSrc({ type: 'agent', agent_id: 'mystery' })], // → inferred=0.35
      confidence_inputs: {},
    });
    // Unscored fact (no confidence_inputs)
    upsertFact({
      session_id: sid,
      fact_key: 'unscored_metric',
      value: 3,
      unit: 'decimal',
      sources: [docSrc()],
    });
    const pack = getCanonicalFactPackV2(sid);
    expect(pack.fact_count).toBe(3);
    expect(pack.confidence_summary.unscored_keys).toEqual(['unscored_metric']);
    // avg only includes scored facts
    expect(pack.confidence_summary.avg_score).toBeGreaterThan(0);
    // Tier counts: 1 CERTAIN, 1 LOW, others 0
    expect(pack.confidence_summary.tier_counts.CERTAIN).toBe(1);
    expect(pack.confidence_summary.tier_counts.LOW).toBe(1);
    expect(pack.confidence_summary.tier_counts.MEDIUM).toBe(0);
  });
});

describe('pack-v2 — low-confidence helpers', () => {
  it('listLowConfidenceFacts respects the default 0.55 threshold', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'high', value: 1, unit: 'decimal',
      sources: [docSrc()], confidence_inputs: {},
    });
    upsertFact({
      session_id: sid, fact_key: 'low', value: 2, unit: 'decimal',
      sources: [docSrc({ type: 'agent', agent_id: 'mystery' })], confidence_inputs: {},
    });
    const lows = listLowConfidenceFacts(sid);
    expect(lows.map((f) => f.fact_key)).toEqual(['low']);
  });

  it('listLowConfidenceFacts respects a custom threshold', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'high', value: 1, unit: 'decimal',
      sources: [docSrc()], confidence_inputs: {},
    });
    upsertFact({
      session_id: sid, fact_key: 'mid', value: 2, unit: 'decimal',
      sources: [docSrc({ type: 'computed' })], confidence_inputs: { has_conflict: true, conflict_severity: 'material', computation_complexity: 1 },
    });
    // Custom threshold = 0.95 → catches more facts than default 0.55
    const aggressive = listLowConfidenceFacts(sid, 0.95);
    expect(aggressive.length).toBeGreaterThanOrEqual(1);
  });

  it('summarizeConfidence shape matches confidence_summary projection', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'a', value: 1, unit: 'decimal',
      sources: [docSrc()], confidence_inputs: {},
    });
    const s = summarizeConfidence(sid);
    expect(s.tier_counts.CERTAIN).toBe(1);
    expect(s.unscored_keys).toEqual([]);
    expect(s.avg_score).toBeGreaterThan(0);
  });
});

describe('pack-v2 — non-mutation', () => {
  it('composer is a pure read; calling twice returns identical structural payload (composed_at differs)', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'x', value: 1, unit: 'decimal',
      sources: [docSrc()], confidence_inputs: {},
    });
    const a = getCanonicalFactPackV2(sid);
    const b = getCanonicalFactPackV2(sid);
    expect(a.fact_count).toBe(b.fact_count);
    expect(a.facts).toEqual(b.facts);
    expect(a.confidence_summary).toEqual(b.confidence_summary);
    expect(a.conflict_summary).toEqual(b.conflict_summary);
    // composed_at is the only field allowed to differ
  });
});

describe('pack-v2 — conflict summary', () => {
  it('infers minor severity from persisted conflict_penalty=0.05', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'minor_disp', value: 1, unit: 'decimal',
      sources: [docSrc()],
      confidence_inputs: { has_conflict: true, conflict_severity: 'minor' },
    });
    const pack = getCanonicalFactPackV2(sid);
    expect(pack.conflict_summary.disputed_keys).toEqual(['minor_disp']);
    expect(pack.conflict_summary.by_severity.minor).toBe(1);
    expect(pack.conflict_summary.by_severity.material).toBe(0);
    expect(pack.conflict_summary.by_severity.critical).toBe(0);
  });

  it('counts material and critical severities when persisted', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'mat_disp', value: 1, unit: 'decimal',
      sources: [docSrc()],
      confidence_inputs: { has_conflict: true, conflict_severity: 'material' },
    });
    upsertFact({
      session_id: sid, fact_key: 'crit_disp', value: 2, unit: 'decimal',
      sources: [docSrc()],
      confidence_inputs: { has_conflict: true, conflict_severity: 'critical' },
    });
    const pack = getCanonicalFactPackV2(sid);
    expect(pack.conflict_summary.by_severity.material).toBe(1);
    expect(pack.conflict_summary.by_severity.critical).toBe(1);
  });
});

// =============================================================================
// P1B Wave 1 — lineage_summary
// =============================================================================

describe('pack-v2 — lineage_summary (P1B Wave 1)', () => {
  it('legacy session with no lineage rows — traced=0, untraced lists every fact_key', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'untraced_a', value: 1, unit: 'decimal',
      sources: [docSrc()],
    });
    upsertFact({
      session_id: sid, fact_key: 'untraced_b', value: 2, unit: 'decimal',
      sources: [docSrc()],
    });
    const pack = getCanonicalFactPackV2(sid);
    expect(pack.lineage_summary.traced_fact_count).toBe(0);
    expect(pack.lineage_summary.untraced_fact_keys).toEqual(['untraced_a', 'untraced_b']);
    expect(pack.lineage_summary.avg_computation_depth).toBe(0);
    expect(pack.lineage_summary.distinct_root_doc_ids).toEqual([]);
  });

  it('traced session counts traced_fact_count and excludes them from untraced_fact_keys', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'traced_x', value: 1, unit: 'decimal',
      sources: [docSrc()],
    });
    upsertFact({
      session_id: sid, fact_key: 'untraced_y', value: 2, unit: 'decimal',
      sources: [docSrc()],
    });
    db.prepare(
      `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at)
       VALUES (?, 'traced_x', ?, 'raw_extracted', 'test', ?)`,
    ).run(sid, `ln-${nanoid(10)}`, new Date().toISOString());
    const pack = getCanonicalFactPackV2(sid);
    expect(pack.lineage_summary.traced_fact_count).toBe(1);
    expect(pack.lineage_summary.untraced_fact_keys).toEqual(['untraced_y']);
  });

  it('surfaces distinct_root_doc_ids when lineage rows carry source_doc_id', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'doc_traced', value: 1, unit: 'decimal',
      sources: [docSrc()],
    });
    db.prepare(
      `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, source_doc_id)
       VALUES (?, 'doc_traced', ?, 'raw_extracted', 'test', ?, 'KCHOL_FY2025')`,
    ).run(sid, `ln-${nanoid(10)}`, new Date().toISOString());
    const pack = getCanonicalFactPackV2(sid);
    expect(pack.lineage_summary.distinct_root_doc_ids).toEqual(['KCHOL_FY2025']);
  });
});
