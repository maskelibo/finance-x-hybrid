/**
 * P2B Wave 1 — structured QA decision tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  validateQADecision,
  parseQADecisionFromText,
  requestTargetedRevision,
  computeAutoQARubric,
  type QADecision,
} from './qa-decision.js';
import { upsertFact, type FactSource } from '../fact-layer/store.js';

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

const docSrc: FactSource = {
  type: 'document', doc_id: 'D', extracted_at: '2026-04-29T10:00:00Z', freshness_days: 5,
};

const validDecision = (overrides: Partial<QADecision> = {}): QADecision => ({
  session_id: 'sid-1',
  status: 'pass',
  overall_score: 0.9,
  components: [{ name: 'consistency', score: 0.9 }],
  warnings: [],
  revision_requests: [],
  decided_at: '2026-04-29T10:00:00Z',
  ...overrides,
});

// =============================================================================
// validateQADecision
// =============================================================================

describe('qa-decision — validateQADecision', () => {
  it('passes a well-formed decision', () => {
    expect(validateQADecision(validDecision())).toEqual({ ok: true, errors: [] });
  });

  it('rejects null / non-object', () => {
    expect(validateQADecision(null).ok).toBe(false);
    expect(validateQADecision('not-a-decision').ok).toBe(false);
  });

  it('rejects unknown status', () => {
    const v = validateQADecision(validDecision({ status: 'mystery' as 'pass' }));
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => e.includes('status invalid'))).toBe(true);
  });

  it('rejects out-of-range overall_score', () => {
    expect(validateQADecision(validDecision({ overall_score: 1.5 })).ok).toBe(false);
    expect(validateQADecision(validDecision({ overall_score: -0.1 })).ok).toBe(false);
  });

  it('rejects components with bad score range', () => {
    const v = validateQADecision(validDecision({ components: [{ name: 'x', score: 2 }] }));
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => e.includes('score must be 0..1'))).toBe(true);
  });

  it('rejects revision_requests without must_not_delete=true', () => {
    const bad = {
      ...validDecision(),
      revision_requests: [{ scope: 's', reason: 'r', must_not_delete: false }],
    };
    expect(validateQADecision(bad).ok).toBe(false);
  });

  it('accepts well-formed revision_requests', () => {
    const ok = {
      ...validDecision({ status: 'revision_required', overall_score: 0.5 }),
      revision_requests: [{ scope: 'section', reason: 'add detail', must_not_delete: true }],
    };
    expect(validateQADecision(ok).ok).toBe(true);
  });
});

// =============================================================================
// parseQADecisionFromText
// =============================================================================

describe('qa-decision — parseQADecisionFromText', () => {
  it('parses pure JSON', () => {
    const raw = JSON.stringify(validDecision());
    expect(parseQADecisionFromText(raw)?.status).toBe('pass');
  });

  it('recovers from LLM preamble + trailing fences', () => {
    const raw = `Now I'll produce.\n${JSON.stringify(validDecision())}\n\`\`\``;
    expect(parseQADecisionFromText(raw)?.status).toBe('pass');
  });

  it('returns null on schema mismatch', () => {
    expect(parseQADecisionFromText('{"status":"pass"}')).toBeNull();
  });

  it('returns null on unparseable input', () => {
    expect(parseQADecisionFromText('not json at all')).toBeNull();
    expect(parseQADecisionFromText('')).toBeNull();
  });
});

// =============================================================================
// requestTargetedRevision
// =============================================================================

describe('qa-decision — requestTargetedRevision', () => {
  it('emits structured revision request with must_not_delete=true', () => {
    const r = requestTargetedRevision('section', 'add citation');
    expect(r).toEqual({ scope: 'section', reason: 'add citation', must_not_delete: true });
  });

  it('honours optional target_ref', () => {
    const r = requestTargetedRevision('fact', 'reconcile', 'revenue_fy2025');
    expect(r.target_ref).toBe('revenue_fy2025');
  });
});

// =============================================================================
// computeAutoQARubric — deterministic
// =============================================================================

describe('qa-decision — computeAutoQARubric', () => {
  it('empty session produces well-formed pass decision', () => {
    const sid = makeSession();
    const d = computeAutoQARubric(sid);
    expect(validateQADecision(d).ok).toBe(true);
    expect(d.session_id).toBe(sid);
    expect(d.status).toBe('pass');
    expect(d.overall_score).toBe(1);
    expect(d.components.length).toBe(4);
    expect(d.revision_requests).toEqual([]);
  });

  it('lowers consistency score when contradictions exist', () => {
    const sid = makeSession();
    db.prepare(
      `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, normalized_value)
       VALUES (?, 'x', ?, 'raw_extracted', 'a', '2026-04-29T10:00:00Z', '1000')`,
    ).run(sid, `ln-${nanoid(10)}`);
    db.prepare(
      `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, normalized_value)
       VALUES (?, 'x', ?, 'raw_extracted', 'b', '2026-04-29T10:01:00Z', '2000')`,
    ).run(sid, `ln-${nanoid(10)}`);
    const d = computeAutoQARubric(sid);
    const consistencyComp = d.components.find((c) => c.name === 'consistency')!;
    expect(consistencyComp.score).toBeLessThan(1);
  });

  it('adds warning when critical contradiction is present', () => {
    const sid = makeSession();
    db.prepare(
      `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, normalized_value)
       VALUES (?, 'x', ?, 'raw_extracted', 'a', '2026-04-29T10:00:00Z', '1000')`,
    ).run(sid, `ln-${nanoid(10)}`);
    db.prepare(
      `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, normalized_value)
       VALUES (?, 'x', ?, 'raw_extracted', 'b', '2026-04-29T10:01:00Z', '5000')`,
    ).run(sid, `ln-${nanoid(10)}`);
    const d = computeAutoQARubric(sid);
    expect(d.warnings.some((w) => w.includes('critical contradiction'))).toBe(true);
  });

  it('lowers confidence_floor when low-confidence facts exist', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'a', value: 1, unit: 'decimal', sources: [docSrc],
      confidence_inputs: { computation_complexity: 0 },                              // CERTAIN
    });
    upsertFact({
      session_id: sid, fact_key: 'b', value: 2, unit: 'decimal',
      sources: [{ ...docSrc, type: 'agent', agent_id: 'mystery' }],                  // inferred → LOW
      confidence_inputs: {},
    });
    const d = computeAutoQARubric(sid);
    const conf = d.components.find((c) => c.name === 'confidence_floor')!;
    expect(conf.score).toBeLessThan(1);
    expect(d.warnings.some((w) => w.includes('below 0.55 confidence'))).toBe(true);
  });

  it('produces deterministic output for identical state', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'a', value: 1, unit: 'decimal', sources: [docSrc], confidence_inputs: {} });
    const d1 = computeAutoQARubric(sid);
    const d2 = computeAutoQARubric(sid);
    // decided_at differs (wall-clock); strip before compare
    const { decided_at: _x, ...a } = d1;
    const { decided_at: _y, ...b } = d2;
    expect(a).toEqual(b);
  });
});
