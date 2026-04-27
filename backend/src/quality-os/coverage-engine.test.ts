/**
 * P2C Wave 1 — coverage engine tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  computeCoverageReport,
  stemMatchesPersistedKey,
  listAllRequiredStems,
  categoryForStem,
  REQUIRED_FACTS_BY_CATEGORY,
} from './coverage-engine.js';
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

// =============================================================================
// Period suffix matching
// =============================================================================

describe('stemMatchesPersistedKey — period suffix', () => {
  it('exact match', () => {
    expect(stemMatchesPersistedKey('revenue', 'revenue')).toBe(true);
  });
  it('FY suffix', () => {
    expect(stemMatchesPersistedKey('revenue', 'revenue_fy2025')).toBe(true);
  });
  it('Q suffix', () => {
    expect(stemMatchesPersistedKey('revenue', 'revenue_q1_2026')).toBe(true);
  });
  it('H suffix', () => {
    expect(stemMatchesPersistedKey('revenue', 'revenue_h1_2026')).toBe(true);
  });
  it('date suffix (YYYYMMDD)', () => {
    expect(stemMatchesPersistedKey('revenue', 'revenue_20260427')).toBe(true);
  });
  it('does NOT match non-period suffix', () => {
    expect(stemMatchesPersistedKey('revenue', 'revenue_growth')).toBe(false);
  });
  it('does NOT match other stems with same prefix', () => {
    expect(stemMatchesPersistedKey('revenue', 'revenue_growth_fy2025')).toBe(false);
    expect(stemMatchesPersistedKey('roe', 'roe_history')).toBe(false);
  });
  it('does NOT confuse stem boundary', () => {
    expect(stemMatchesPersistedKey('roe', 'roa_fy2025')).toBe(false);
    expect(stemMatchesPersistedKey('net_debt', 'net_debt_to_ebitda_fy2025')).toBe(false);
  });
});

// =============================================================================
// Registry helpers
// =============================================================================

describe('coverage — registry helpers', () => {
  it('listAllRequiredStems returns sorted union', () => {
    const all = listAllRequiredStems();
    expect(all.length).toBeGreaterThan(0);
    expect(all).toEqual(all.slice().sort());
    expect(new Set(all).size).toBe(all.length);  // no dups
  });

  it('categoryForStem maps stem to its category', () => {
    expect(categoryForStem('revenue')).toBe('financial_statements');
    expect(categoryForStem('roe')).toBe('ratios_and_leverage');
    expect(categoryForStem('rsi_14')).toBe('technical');
    expect(categoryForStem('mystery')).toBeNull();
  });
});

// =============================================================================
// computeCoverageReport
// =============================================================================

describe('coverage — computeCoverageReport', () => {
  it('empty session → 0% coverage with all stems missing', () => {
    const sid = makeSession();
    const r = computeCoverageReport(sid);
    expect(r.total_present).toBe(0);
    expect(r.total_missing).toBe(r.total_required);
    expect(r.overall_coverage).toBe(0);
    expect(r.by_category.length).toBe(Object.keys(REQUIRED_FACTS_BY_CATEGORY).length);
    expect(r.all_missing_stems.length).toBe(r.total_missing);
  });

  it('persisted fact_key with FY suffix counts as present', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 100, unit: 'TRY_mn', sources: [docSrc] });
    const r = computeCoverageReport(sid);
    const fs = r.by_category.find((c) => c.category === 'financial_statements')!;
    expect(fs.present_stems).toContain('revenue');
    expect(fs.missing_stems).not.toContain('revenue');
  });

  it('full coverage in one category yields ratio=1', () => {
    const sid = makeSession();
    for (const stem of REQUIRED_FACTS_BY_CATEGORY.financial_statements) {
      upsertFact({ session_id: sid, fact_key: `${stem}_fy2025`, value: 1, unit: 'decimal', sources: [docSrc] });
    }
    const r = computeCoverageReport(sid);
    const fs = r.by_category.find((c) => c.category === 'financial_statements')!;
    expect(fs.coverage_ratio).toBe(1);
    expect(fs.missing_stems).toEqual([]);
  });

  it('partial coverage produces fractional ratio', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 1, unit: 'TRY_mn', sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'net_income_fy2025', value: 1, unit: 'TRY_mn', sources: [docSrc] });
    const r = computeCoverageReport(sid);
    const fs = r.by_category.find((c) => c.category === 'financial_statements')!;
    expect(fs.coverage_ratio).toBeGreaterThan(0);
    expect(fs.coverage_ratio).toBeLessThan(1);
  });

  it('non-period suffix does NOT count toward coverage', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_growth', value: 0.1, unit: 'decimal', sources: [docSrc] });
    const r = computeCoverageReport(sid);
    const fs = r.by_category.find((c) => c.category === 'financial_statements')!;
    expect(fs.present_stems).not.toContain('revenue');
  });

  it('cross-session isolation', () => {
    const sa = makeSession();
    const sb = makeSession();
    upsertFact({ session_id: sa, fact_key: 'revenue_fy2025', value: 1, unit: 'TRY_mn', sources: [docSrc] });
    expect(computeCoverageReport(sa).total_present).toBeGreaterThan(0);
    expect(computeCoverageReport(sb).total_present).toBe(0);
  });

  it('output shape is stable for identical state (deterministic)', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 1, unit: 'TRY_mn', sources: [docSrc] });
    const r1 = computeCoverageReport(sid);
    const r2 = computeCoverageReport(sid);
    expect(r1).toEqual(r2);
  });
});
