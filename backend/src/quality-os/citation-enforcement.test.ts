/**
 * P2D Wave 1 — citation enforcement tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  isCriticalFactKey,
  detectCitationGaps,
  stemOf,
} from './citation-enforcement.js';

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

function insertNode(
  sid: string, factKey: string, agent: string, sourceDocId: string | null,
): void {
  db.prepare(
    `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, source_doc_id)
     VALUES (?, ?, ?, 'raw_extracted', ?, ?, ?)`,
  ).run(sid, factKey, `ln-${nanoid(10)}`, agent, '2026-04-29T10:00:00Z', sourceDocId);
}

// =============================================================================
// stemOf + isCriticalFactKey
// =============================================================================

describe('citation — stemOf', () => {
  it('strips fy suffix', () => { expect(stemOf('revenue_fy2025')).toBe('revenue'); });
  it('strips q suffix (multi-token)', () => { expect(stemOf('revenue_q1_2026')).toBe('revenue'); });
  it('strips date suffix', () => { expect(stemOf('revenue_20260427')).toBe('revenue'); });
  it('handles compound stems', () => { expect(stemOf('net_debt_fy2025')).toBe('net_debt'); });
  it('handles compound stems with multi-token suffix', () => {
    expect(stemOf('net_debt_q1_2026')).toBe('net_debt');
  });
  it('returns key unchanged when no suffix', () => { expect(stemOf('revenue')).toBe('revenue'); });
});

describe('citation — isCriticalFactKey', () => {
  it('flags revenue / net_income / ebitda / net_debt / roe / fcf as critical', () => {
    expect(isCriticalFactKey('revenue_fy2025')).toBe(true);
    expect(isCriticalFactKey('net_income_fy2025')).toBe(true);
    expect(isCriticalFactKey('ebitda_fy2025')).toBe(true);
    expect(isCriticalFactKey('net_debt_fy2025')).toBe(true);
    expect(isCriticalFactKey('roe_fy2025')).toBe(true);
    expect(isCriticalFactKey('fcf_fy2025')).toBe(true);
  });

  it('does not flag ratios / margins / macro / technical as critical', () => {
    expect(isCriticalFactKey('gross_margin_fy2025')).toBe(false);
    expect(isCriticalFactKey('rsi_14')).toBe(false);
    expect(isCriticalFactKey('usd_try')).toBe(false);
    expect(isCriticalFactKey('current_ratio_fy2025')).toBe(false);
  });
});

// =============================================================================
// detectCitationGaps
// =============================================================================

describe('citation — detectCitationGaps', () => {
  it('empty session → no gaps, ratio=1', () => {
    const sid = makeSession();
    const r = detectCitationGaps(sid);
    expect(r.total_facts_with_lineage).toBe(0);
    expect(r.facts_with_citation).toBe(0);
    expect(r.facts_missing_citation).toBe(0);
    expect(r.coverage_ratio).toBe(1);
    expect(r.critical_gaps).toEqual([]);
    expect(r.non_critical_gaps).toEqual([]);
  });

  it('lineage with source_doc_id → no gap', () => {
    const sid = makeSession();
    insertNode(sid, 'revenue_fy2025', 'parse_standardization', 'KCHOL_FY2025_AR');
    const r = detectCitationGaps(sid);
    expect(r.facts_with_citation).toBe(1);
    expect(r.facts_missing_citation).toBe(0);
    expect(r.critical_gaps).toEqual([]);
  });

  it('critical fact without source_doc_id → critical gap', () => {
    const sid = makeSession();
    insertNode(sid, 'revenue_fy2025', 'parse_standardization', null);
    const r = detectCitationGaps(sid);
    expect(r.critical_gaps.length).toBe(1);
    expect(r.critical_gaps[0].fact_key).toBe('revenue_fy2025');
    expect(r.critical_gaps[0].severity).toBe('critical');
  });

  it('non-critical fact without source_doc_id → non_critical gap', () => {
    const sid = makeSession();
    insertNode(sid, 'gross_margin_fy2025', 'financial_analysis', null);
    const r = detectCitationGaps(sid);
    expect(r.critical_gaps).toEqual([]);
    expect(r.non_critical_gaps.length).toBe(1);
    expect(r.non_critical_gaps[0].severity).toBe('non_critical');
  });

  it('any node with doc_id satisfies the citation (across multiple writers)', () => {
    const sid = makeSession();
    insertNode(sid, 'revenue_fy2025', 'a', null);
    insertNode(sid, 'revenue_fy2025', 'b', 'KCHOL_FY2025_AR');
    const r = detectCitationGaps(sid);
    expect(r.critical_gaps).toEqual([]);
    expect(r.facts_with_citation).toBe(1);
  });

  it('aggregates writers + node_count per gap', () => {
    const sid = makeSession();
    insertNode(sid, 'revenue_fy2025', 'a', null);
    insertNode(sid, 'revenue_fy2025', 'b', null);
    const r = detectCitationGaps(sid);
    expect(r.critical_gaps[0].writers).toEqual(['a', 'b']);
    expect(r.critical_gaps[0].node_count).toBe(2);
  });

  it('cross-session isolation', () => {
    const sa = makeSession();
    const sb = makeSession();
    insertNode(sa, 'revenue_fy2025', 'a', null);
    expect(detectCitationGaps(sa).critical_gaps.length).toBe(1);
    expect(detectCitationGaps(sb).critical_gaps.length).toBe(0);
  });

  it('gaps sorted alphabetically by fact_key', () => {
    const sid = makeSession();
    insertNode(sid, 'revenue_fy2025', 'a', null);
    insertNode(sid, 'ebitda_fy2025', 'a', null);
    insertNode(sid, 'fcf_fy2025', 'a', null);
    const r = detectCitationGaps(sid);
    const keys = r.critical_gaps.map((g) => g.fact_key);
    expect(keys).toEqual(keys.slice().sort());
  });
});

// =============================================================================
// P1B Wave 2 — provenance-driven gap reduction
// =============================================================================

describe('citation — Wave 2 provenance reduces gaps', () => {
  it('mixed lineage: any single node with doc_id satisfies the gate', () => {
    const sid = makeSession();
    insertNode(sid, 'revenue_fy2025', 'parse_standardization', 'KCHOL_AR.pdf');
    insertNode(sid, 'revenue_fy2025', 'financial_analysis', null);
    const r = detectCitationGaps(sid);
    expect(r.critical_gaps).toEqual([]);
    expect(r.facts_with_citation).toBe(1);
  });

  it('coverage_ratio rises as more facts gain citations', () => {
    const sid = makeSession();
    insertNode(sid, 'revenue_fy2025', 'a', 'X.pdf');
    insertNode(sid, 'ebitda_fy2025', 'a', null);
    const r1 = detectCitationGaps(sid);
    expect(r1.coverage_ratio).toBeCloseTo(0.5, 2);
    insertNode(sid, 'ebitda_fy2025', 'b', 'X.pdf');
    const r2 = detectCitationGaps(sid);
    expect(r2.coverage_ratio).toBe(1);
    expect(r2.critical_gaps).toEqual([]);
  });

  it('aggregation totals shift correctly with mixed coverage', () => {
    const sid = makeSession();
    insertNode(sid, 'revenue_fy2025',  'a', 'X.pdf');         // critical, cited
    insertNode(sid, 'gross_margin_fy2025', 'a', 'X.pdf');     // non-critical, cited
    insertNode(sid, 'fcf_fy2025',      'a', null);            // critical, missing
    insertNode(sid, 'roa_fy2025',      'a', null);            // non-critical, missing
    const r = detectCitationGaps(sid);
    expect(r.facts_with_citation).toBe(2);
    expect(r.facts_missing_citation).toBe(2);
    expect(r.critical_gaps.map((g) => g.fact_key)).toEqual(['fcf_fy2025']);
    expect(r.non_critical_gaps.map((g) => g.fact_key)).toEqual(['roa_fy2025']);
  });
});
