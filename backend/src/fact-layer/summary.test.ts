/**
 * P1A Wave 2 — summary.ts compact JSON tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import { buildFactConfidenceSummary } from './summary.js';
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
  doc_id: 'TEST_DOC',
  extracted_at: '2026-04-27T10:00:00.000Z',
  freshness_days: 5,
  ...overrides,
});

describe('buildFactConfidenceSummary — empty session', () => {
  it('returns a well-formed empty summary', () => {
    const sid = makeSession('KCHOL');
    const s = buildFactConfidenceSummary(sid);
    expect(s.session_id).toBe(sid);
    expect(s.ticker).toBe('KCHOL');
    expect(s.fact_count).toBe(0);
    expect(s.scored_fact_count).toBe(0);
    expect(s.unscored_fact_count).toBe(0);
    expect(s.avg_score).toBe(0);
    expect(s.low_confidence_keys).toEqual([]);
    expect(s.speculative_keys).toEqual([]);
    expect(s.unscored_keys).toEqual([]);
    expect(s.disputed_keys).toEqual([]);
    expect(s.conflict_severity_counts).toEqual({ minor: 0, material: 0, critical: 0 });
  });
});

describe('buildFactConfidenceSummary — populated session', () => {
  it('reports correct scored / unscored counts', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'scored_a', value: 1, unit: 'decimal',
      sources: [docSrc()], confidence_inputs: {},
    });
    upsertFact({
      session_id: sid, fact_key: 'scored_b', value: 2, unit: 'decimal',
      sources: [docSrc()], confidence_inputs: {},
    });
    upsertFact({
      session_id: sid, fact_key: 'unscored', value: 3, unit: 'decimal',
      sources: [docSrc()],
    });
    const s = buildFactConfidenceSummary(sid);
    expect(s.fact_count).toBe(3);
    expect(s.scored_fact_count).toBe(2);
    expect(s.unscored_fact_count).toBe(1);
    expect(s.unscored_keys).toEqual(['unscored']);
    expect(s.avg_score).toBeGreaterThan(0);
  });

  it('surfaces minor disputes via disputed_keys + conflict_severity_counts', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'disp', value: 1, unit: 'decimal',
      sources: [docSrc()],
      confidence_inputs: { has_conflict: true, conflict_severity: 'minor' },
    });
    const s = buildFactConfidenceSummary(sid);
    expect(s.disputed_keys).toEqual(['disp']);
    expect(s.conflict_severity_counts.minor).toBe(1);
  });
});

describe('buildFactConfidenceSummary — determinism', () => {
  it('produces identical structural payload across calls', () => {
    const sid = makeSession('DET');
    upsertFact({
      session_id: sid, fact_key: 'a', value: 1, unit: 'decimal',
      sources: [docSrc()], confidence_inputs: {},
    });
    const a = buildFactConfidenceSummary(sid);
    const b = buildFactConfidenceSummary(sid);
    // composed_at differs (wall-clock) — strip before comparing
    const { composed_at: _ca, ...aRest } = a;
    const { composed_at: _cb, ...bRest } = b;
    expect(aRest).toEqual(bRest);
  });

  it('keys arrays are sorted alphabetically for stable downstream hashing', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'zebra', value: 1, unit: 'decimal',
      sources: [docSrc()], confidence_inputs: {},
    });
    upsertFact({
      session_id: sid, fact_key: 'alpha', value: 2, unit: 'decimal',
      sources: [docSrc()],
    });
    const s = buildFactConfidenceSummary(sid);
    expect(s.unscored_keys).toEqual(['alpha']);
  });
});
