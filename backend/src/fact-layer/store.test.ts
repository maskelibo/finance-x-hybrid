/**
 * Block P / Plan P1A Wave 1 — store.ts backward-compat smoke.
 *
 * Confirms that the optional confidence_inputs parameter does not regress the
 * existing R7 fact-store contract:
 *   - calls without confidence_inputs persist no confidence (legacy path)
 *   - calls with confidence_inputs persist & retrieve a FactConfidence
 *   - source merge / dedup behaviour is unchanged
 *
 * Tests share the global db at backend/data/financex.db (matches existing
 * pipeline-smoke.test.ts pattern); each test cleans up its own session row
 * via cascade-delete on analysis_sessions.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { upsertFact, getFact, listFacts, type FactSource } from './store.js';

const usedSessions: string[] = [];

function makeSession(): string {
  const id = `t-${nanoid(8)}`;
  db.prepare(
    `INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at)
     VALUES (?, 'TEST', 'standard_institutional', 'pending', ?)`,
  ).run(id, new Date().toISOString());
  usedSessions.push(id);
  return id;
}

afterEach(() => {
  while (usedSessions.length > 0) {
    const id = usedSessions.pop()!;
    db.prepare(`DELETE FROM analysis_sessions WHERE id = ?`).run(id);
  }
});

const docSource: FactSource = {
  type: 'document',
  doc_id: 'TEST_FILING',
  extracted_at: '2026-04-27T10:00:00.000Z',
  freshness_days: 5,
};

describe('store.upsertFact — backward compatibility', () => {
  it('legacy call without confidence_inputs persists confidence=null', () => {
    const sid = makeSession();
    const fact = upsertFact({
      session_id: sid,
      fact_key: 'legacy_metric',
      value: 42,
      unit: 'TRY_mn',
      sources: [docSource],
    });
    expect(fact.confidence).toBeNull();

    const fetched = getFact(sid, 'legacy_metric');
    expect(fetched?.confidence).toBeNull();
  });

  it('preserves existing source merge / dedup behaviour', () => {
    const sid = makeSession();
    const s1: FactSource = { ...docSource, doc_id: 'DOC_A', extracted_at: '2026-04-25T10:00:00.000Z' };
    const s2: FactSource = { ...docSource, doc_id: 'DOC_B', extracted_at: '2026-04-26T10:00:00.000Z' };
    const s3: FactSource = { ...docSource, doc_id: 'DOC_A', extracted_at: '2026-04-27T10:00:00.000Z' };
    upsertFact({ session_id: sid, fact_key: 'merge_metric', value: 1, unit: 'decimal', sources: [s1] });
    upsertFact({ session_id: sid, fact_key: 'merge_metric', value: 1, unit: 'decimal', sources: [s2] });
    upsertFact({ session_id: sid, fact_key: 'merge_metric', value: 1, unit: 'decimal', sources: [s3] });

    const fact = getFact(sid, 'merge_metric')!;
    // 3 distinct (type|agent_id|doc_id|note) keys → 2 distinct (DOC_A, DOC_B);
    // DOC_A's later extracted_at supersedes the earlier entry.
    const docIds = fact.sources.map((s) => s.doc_id).sort();
    expect(docIds).toEqual(['DOC_A', 'DOC_B']);
    const docA = fact.sources.find((s) => s.doc_id === 'DOC_A')!;
    expect(docA.extracted_at).toBe('2026-04-27T10:00:00.000Z');
  });
});

describe('store.upsertFact — P1A Wave 1 confidence persistence', () => {
  it('persists confidence_json when confidence_inputs is supplied', () => {
    const sid = makeSession();
    const fact = upsertFact({
      session_id: sid,
      fact_key: 'p1a_metric',
      value: 1000,
      unit: 'TRY_mn',
      sources: [docSource],
      confidence_inputs: {
        has_conflict: false,
        computation_complexity: 0,
        cross_agent_agreement_count: 1,
      },
    });
    expect(fact.confidence).not.toBeNull();
    // 1 fresh document source, no conflict, no complexity → 1.0 → CERTAIN
    expect(fact.confidence!.tier).toBe('CERTAIN');
    expect(fact.confidence!.score).toBeGreaterThanOrEqual(0.9);
    expect(Array.isArray(fact.confidence!.source_mappings)).toBe(true);
    expect(fact.confidence!.source_mappings[0].plan_type).toBe('direct_disclosure');
  });

  it('round-trips confidence through getFact', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid,
      fact_key: 'rt_metric',
      value: 2.5,
      unit: 'x',
      sources: [docSource],
      confidence_inputs: {
        has_conflict: true,
        conflict_severity: 'material',
        cross_agent_agreement_count: 2,
      },
    });
    const fetched = getFact(sid, 'rt_metric')!;
    expect(fetched.confidence).not.toBeNull();
    expect(fetched.confidence!.components.conflict_penalty).toBeCloseTo(0.20, 5);
    expect(fetched.confidence!.components.agreement_bonus).toBeCloseTo(0.03, 5);
  });

  it('round-trips confidence through listFacts', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid,
      fact_key: 'list_metric_a',
      value: 1,
      unit: 'decimal',
      sources: [docSource],
      confidence_inputs: { computation_complexity: 0 },
    });
    upsertFact({
      session_id: sid,
      fact_key: 'list_metric_b',
      value: 2,
      unit: 'decimal',
      sources: [docSource],
      // no confidence_inputs on this row
    });
    const all = listFacts(sid);
    const a = all.find((f) => f.fact_key === 'list_metric_a')!;
    const b = all.find((f) => f.fact_key === 'list_metric_b')!;
    expect(a.confidence).not.toBeNull();
    expect(b.confidence).toBeNull();
  });

  it('UPDATE preserves prior confidence when caller omits confidence_inputs', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid,
      fact_key: 'preserve_metric',
      value: 1,
      unit: 'decimal',
      sources: [docSource],
      confidence_inputs: { computation_complexity: 0 },
    });
    upsertFact({
      session_id: sid,
      fact_key: 'preserve_metric',
      value: 2,
      unit: 'decimal',
      sources: [docSource],
      // intentionally NO confidence_inputs on the update
    });
    const fact = getFact(sid, 'preserve_metric')!;
    expect(fact.confidence).not.toBeNull();
    expect(fact.value).toBe(2);
  });

  it('UPDATE recomputes confidence when caller passes new confidence_inputs', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid,
      fact_key: 'recompute_metric',
      value: 1,
      unit: 'decimal',
      sources: [docSource],
      confidence_inputs: { computation_complexity: 0 },
    });
    const before = getFact(sid, 'recompute_metric')!;
    upsertFact({
      session_id: sid,
      fact_key: 'recompute_metric',
      value: 1,
      unit: 'decimal',
      sources: [docSource],
      confidence_inputs: { has_conflict: true, conflict_severity: 'critical' },
    });
    const after = getFact(sid, 'recompute_metric')!;
    expect(after.confidence!.score).toBeLessThan(before.confidence!.score);
    expect(after.confidence!.components.conflict_penalty).toBeCloseTo(0.40, 5);
  });
});
