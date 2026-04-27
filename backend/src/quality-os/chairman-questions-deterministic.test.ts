/**
 * P2F Wave 1 — deterministic chairman questions tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  runDeterministicChairmanQuestions,
  recordDeterministicChairmanReport,
  stemOf,
  periodOf,
  DETERMINISTIC_CHAIRMAN_CONTEXT_KEYS,
} from './chairman-questions-deterministic.js';
import { upsertFact, type FactSource } from '../fact-layer/store.js';

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

const docSrc: FactSource = {
  type: 'document', doc_id: 'D', extracted_at: '2026-04-29T10:00:00Z', freshness_days: 5,
};

function insertLineage(sid: string, factKey: string, agent: string, normalized: number, doc: string | null = null): void {
  db.prepare(
    `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, normalized_value, source_doc_id)
     VALUES (?, ?, ?, 'raw_extracted', ?, '2026-04-29T10:00:00Z', ?, ?)`,
  ).run(sid, factKey, `ln-${nanoid(10)}`, agent, JSON.stringify(normalized), doc);
}

// =============================================================================
// Helpers
// =============================================================================

describe('chairman-deterministic — helpers', () => {
  it('stemOf strips period suffixes', () => {
    expect(stemOf('revenue_fy2025')).toBe('revenue');
    expect(stemOf('current_ratio_q1_2026')).toBe('current_ratio');
    expect(stemOf('rsi_14')).toBe('rsi_14'); // no period match (rsi_14 has _14 not period)
    expect(stemOf('plain')).toBe('plain');
  });

  it('periodOf returns the suffix without underscore', () => {
    expect(periodOf('revenue_fy2025')).toBe('fy2025');
    expect(periodOf('roe_q3_2025')).toBe('q3_2025');
    expect(periodOf('plain')).toBeNull();
  });
});

// =============================================================================
// D1 leverage_above_threshold
// =============================================================================

describe('D1 leverage_above_threshold', () => {
  it('fires P0 when net_debt_to_ebitda >= 5.0', () => {
    const sid = makeSession('KCHOL');
    upsertFact({ session_id: sid, fact_key: 'net_debt_to_ebitda_fy2025', value: 5.19, unit: 'x', sources: [docSrc] });
    const r = runDeterministicChairmanQuestions(sid, 'KCHOL');
    const q = r.questions.find((x) => x.category === 'leverage');
    expect(q).toBeDefined();
    expect(q!.severity).toBe('P0');
    expect(q!.trigger_facts).toEqual(['net_debt_to_ebitda_fy2025']);
    expect(q!.question).toContain('5,19');
  });

  it('silent when net_debt_to_ebitda < 5.0', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'net_debt_to_ebitda_fy2025', value: 2.5, unit: 'x', sources: [docSrc] });
    const r = runDeterministicChairmanQuestions(sid, 'KCHOL');
    expect(r.questions.find((x) => x.category === 'leverage')).toBeUndefined();
  });
});

// =============================================================================
// D2 liquidity_distress
// =============================================================================

describe('D2 liquidity_distress', () => {
  it('fires P0 when current_ratio < 1.0', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'current_ratio_fy2025', value: 0.87, unit: 'decimal', sources: [docSrc] });
    const r = runDeterministicChairmanQuestions(sid);
    const q = r.questions.find((x) => x.category === 'liquidity');
    expect(q).toBeDefined();
    expect(q!.severity).toBe('P0');
    expect(q!.question).toContain('0,87');
  });

  it('silent when current_ratio >= 1.0', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'current_ratio_fy2025', value: 1.5, unit: 'decimal', sources: [docSrc] });
    const r = runDeterministicChairmanQuestions(sid);
    expect(r.questions.find((x) => x.category === 'liquidity')).toBeUndefined();
  });
});

// =============================================================================
// D3 revenue_growth_margin_compression
// =============================================================================

describe('D3 revenue_growth_margin_compression', () => {
  it('fires P0 when revenue YoY > 10% AND ebitda_margin drops > 200bps', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2024',       value: 1000, unit: 'TRY_mn', sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025',       value: 1200, unit: 'TRY_mn', sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'ebitda_margin_fy2024', value: 18,   unit: 'decimal', sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'ebitda_margin_fy2025', value: 15,   unit: 'decimal', sources: [docSrc] });
    const r = runDeterministicChairmanQuestions(sid);
    const q = r.questions.find((x) => x.category === 'profitability_margin');
    expect(q).toBeDefined();
    expect(q!.severity).toBe('P0');
    expect(q!.question).toContain('+%20'); // 1200/1000 - 1 = 20%
    expect(q!.trigger_facts).toContain('revenue_fy2025');
  });

  it('silent when only one comparable FY period exists', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 1000, unit: 'TRY_mn', sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'ebitda_margin_fy2025', value: 15, unit: 'decimal', sources: [docSrc] });
    const r = runDeterministicChairmanQuestions(sid);
    expect(r.questions.find((x) => x.category === 'profitability_margin')).toBeUndefined();
  });

  it('silent when revenue grows but margin is stable', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2024', value: 1000, unit: 'TRY_mn', sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 1200, unit: 'TRY_mn', sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'ebitda_margin_fy2024', value: 18, unit: 'decimal', sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'ebitda_margin_fy2025', value: 17.5, unit: 'decimal', sources: [docSrc] });
    const r = runDeterministicChairmanQuestions(sid);
    expect(r.questions.find((x) => x.category === 'profitability_margin')).toBeUndefined();
  });
});

// =============================================================================
// D4 negative_profitability
// =============================================================================

describe('D4 negative_profitability', () => {
  it('fires P0 when net_income < 0', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'net_income_fy2025', value: -500_000, unit: 'TRY_mn', sources: [docSrc] });
    const r = runDeterministicChairmanQuestions(sid);
    const q = r.questions.find((x) => x.category === 'profitability_negative');
    expect(q).toBeDefined();
    expect(q!.severity).toBe('P0');
  });

  it('silent when net_income >= 0', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'net_income_fy2025', value: 1_000, unit: 'TRY_mn', sources: [docSrc] });
    const r = runDeterministicChairmanQuestions(sid);
    expect(r.questions.find((x) => x.category === 'profitability_negative')).toBeUndefined();
  });
});

// =============================================================================
// D5 low_confidence_critical_fact
// =============================================================================

describe('D5 low_confidence_critical_fact', () => {
  it('fires P0 when a CRITICAL_FACT_STEM has confidence score < 0.55', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'revenue_fy2025', value: 1000, unit: 'TRY_mn',
      sources: [{ ...docSrc, type: 'agent', agent_id: 'mystery_agent' }],   // → inferred → low score
      confidence_inputs: { computation_complexity: 0 },
    });
    const r = runDeterministicChairmanQuestions(sid);
    const q = r.questions.find((x) => x.category === 'data_quality');
    expect(q).toBeDefined();
    expect(q!.severity).toBe('P0');
    expect(q!.confidence).toBe('low');
  });

  it('silent when critical fact has high confidence', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'revenue_fy2025', value: 1000, unit: 'TRY_mn',
      sources: [docSrc],
      confidence_inputs: { computation_complexity: 0 },  // → CERTAIN
    });
    const r = runDeterministicChairmanQuestions(sid);
    expect(r.questions.find((x) => x.category === 'data_quality')).toBeUndefined();
  });
});

// =============================================================================
// D6 critical_citation_gap
// =============================================================================

describe('D6 critical_citation_gap', () => {
  it('fires P1 when citation report has critical gaps', () => {
    const sid = makeSession();
    insertLineage(sid, 'revenue_fy2025', 'parse_standardization', 1000, null); // critical, no doc
    const r = runDeterministicChairmanQuestions(sid);
    const q = r.questions.find((x) => x.category === 'citation_gap');
    expect(q).toBeDefined();
    expect(q!.severity).toBe('P1');
  });

  it('silent when no critical citation gaps', () => {
    const sid = makeSession();
    insertLineage(sid, 'revenue_fy2025', 'parse_standardization', 1000, 'D.pdf');
    const r = runDeterministicChairmanQuestions(sid);
    expect(r.questions.find((x) => x.category === 'citation_gap')).toBeUndefined();
  });
});

// =============================================================================
// D7 unresolved_critical_contradiction
// =============================================================================

describe('D7 unresolved_critical_contradiction', () => {
  it('fires P1 when critical contradictions are present', () => {
    const sid = makeSession();
    insertLineage(sid, 'revenue_fy2025', 'a', 1000);
    insertLineage(sid, 'revenue_fy2025', 'b', 5000);  // 80% delta → critical
    const r = runDeterministicChairmanQuestions(sid);
    const q = r.questions.find((x) => x.category === 'contradiction');
    expect(q).toBeDefined();
    expect(q!.severity).toBe('P1');
  });

  it('silent when no critical contradictions', () => {
    const sid = makeSession();
    const r = runDeterministicChairmanQuestions(sid);
    expect(r.questions.find((x) => x.category === 'contradiction')).toBeUndefined();
  });
});

// =============================================================================
// Cross-cutting
// =============================================================================

describe('chairman-deterministic — cross-cutting invariants', () => {
  it('empty session → empty report, no crash', () => {
    const sid = makeSession();
    const r = runDeterministicChairmanQuestions(sid);
    expect(r.total_count).toBe(0);
    expect(r.questions).toEqual([]);
    expect(r.by_severity).toEqual({ P0: 0, P1: 0, P2: 0 });
  });

  it('stable question_id — same input produces same id across runs', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'net_debt_to_ebitda_fy2025', value: 5.19, unit: 'x', sources: [docSrc] });
    const r1 = runDeterministicChairmanQuestions(sid, 'KCHOL');
    const r2 = runDeterministicChairmanQuestions(sid, 'KCHOL');
    expect(r1.questions[0].question_id).toBe(r2.questions[0].question_id);
  });

  it('no duplicate questions across detectors (same id de-duped)', () => {
    const sid = makeSession();
    // Two facts that would each trigger leverage with the same key — should dedup
    upsertFact({ session_id: sid, fact_key: 'net_debt_to_ebitda_fy2025', value: 6.0, unit: 'x', sources: [docSrc] });
    const r = runDeterministicChairmanQuestions(sid, 'KCHOL');
    const ids = r.questions.map((q) => q.question_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('by_severity and by_category counts roll up', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'net_debt_to_ebitda_fy2025', value: 6.0, unit: 'x', sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'current_ratio_fy2025', value: 0.5, unit: 'decimal', sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'net_income_fy2025', value: -100, unit: 'TRY_mn', sources: [docSrc] });
    const r = runDeterministicChairmanQuestions(sid);
    expect(r.by_severity.P0).toBeGreaterThanOrEqual(3);
    expect(r.by_category.leverage).toBe(1);
    expect(r.by_category.liquidity).toBe(1);
    expect(r.by_category.profitability_negative).toBe(1);
  });

  it('low_confidence input lowers question confidence', () => {
    const sid = makeSession();
    upsertFact({
      session_id: sid, fact_key: 'net_debt_to_ebitda_fy2025', value: 6.0, unit: 'x',
      sources: [{ ...docSrc, type: 'agent', agent_id: 'mystery' }],
      confidence_inputs: {},
    });
    const r = runDeterministicChairmanQuestions(sid);
    const q = r.questions.find((x) => x.category === 'leverage')!;
    expect(['low', 'medium']).toContain(q.confidence);
  });

  it('cross-session isolation', () => {
    const sa = makeSession();
    const sb = makeSession();
    upsertFact({ session_id: sa, fact_key: 'net_debt_to_ebitda_fy2025', value: 6.0, unit: 'x', sources: [docSrc] });
    expect(runDeterministicChairmanQuestions(sa).total_count).toBeGreaterThan(0);
    expect(runDeterministicChairmanQuestions(sb).total_count).toBe(0);
  });
});

// =============================================================================
// Adapter
// =============================================================================

describe('chairman-deterministic — recordDeterministicChairmanReport', () => {
  it('writes both context keys and does not mutate other fields', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'net_debt_to_ebitda_fy2025', value: 6.0, unit: 'x', sources: [docSrc] });
    const ctx: Record<string, unknown> = {
      chairman_questions: { existing: true },     // P3.gamma LLM key — must NOT be touched
      other_field: 42,
    };
    const report = recordDeterministicChairmanReport(sid, 'KCHOL', ctx);
    expect(ctx[DETERMINISTIC_CHAIRMAN_CONTEXT_KEYS.REPORT]).toBe(report);
    expect(typeof ctx[DETERMINISTIC_CHAIRMAN_CONTEXT_KEYS.REPORT_JSON]).toBe('string');
    expect(JSON.parse(ctx[DETERMINISTIC_CHAIRMAN_CONTEXT_KEYS.REPORT_JSON] as string).total_count).toBe(report.total_count);
    // P3.gamma key NOT touched
    expect(ctx['chairman_questions']).toEqual({ existing: true });
    // unrelated field NOT touched
    expect(ctx['other_field']).toBe(42);
  });

  it('returns a non-null report with valid structure', () => {
    const sid = makeSession();
    const r = recordDeterministicChairmanReport(sid, 'KCHOL', {});
    expect(r.session_id).toBe(sid);
    expect(r.ticker).toBe('KCHOL');
    expect(Array.isArray(r.questions)).toBe(true);
    expect(typeof r.generated_at).toBe('string');
  });
});

// =============================================================================
// KCHOL replay
// =============================================================================

describe('chairman-deterministic — KCHOL session replay shape', () => {
  it('produces ≥ 2 P0 questions for a session matching the KCHOL profile (leverage + liquidity)', () => {
    const sid = makeSession('KCHOL');
    // Mirror the post-Wave-3 KCHOL replay state (subset relevant to detectors):
    upsertFact({ session_id: sid, fact_key: 'net_debt_to_ebitda_fy2025', value: 5.19,  unit: 'x',       sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'current_ratio_fy2025',      value: 0.87,  unit: 'decimal', sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'net_income_fy2025',         value: 34628, unit: 'TRY_mn',  sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025',            value: 2_757_295, unit: 'TRY_mn', sources: [docSrc] });
    const r = runDeterministicChairmanQuestions(sid, 'KCHOL');
    expect(r.by_severity.P0).toBeGreaterThanOrEqual(2);
    expect(r.questions.find((q) => q.category === 'leverage')).toBeDefined();
    expect(r.questions.find((q) => q.category === 'liquidity')).toBeDefined();
    // No false positives — net_income > 0, no margin compression data → silent
    expect(r.questions.find((q) => q.category === 'profitability_negative')).toBeUndefined();
    expect(r.questions.find((q) => q.category === 'profitability_margin')).toBeUndefined();
  });
});
