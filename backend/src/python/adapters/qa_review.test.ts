import { describe, expect, it } from 'vitest';

import {
  adaptQaReviewForLegacy,
  extractFinancialAnalysis,
  extractReconciliation,
} from './qa_review.js';


describe('extractFinancialAnalysis / extractReconciliation', () => {
  it('parses a JSON string wrapper', () => {
    const s = JSON.stringify({ ticker: 'T', highlights: [] });
    expect(extractFinancialAnalysis(s)?.ticker).toBe('T');
  });

  it('accepts already-parsed objects', () => {
    const obj = { checks: [{ code: 'BS_IDENTITY', passed: true }] };
    expect(extractReconciliation(obj)?.checks?.length).toBe(1);
  });

  it('returns null on garbage', () => {
    expect(extractFinancialAnalysis('not-json')).toBeNull();
    expect(extractReconciliation(null)).toBeNull();
  });
});


describe('adaptQaReviewForLegacy — happy path', () => {
  const fa = {
    ticker: 'EREGL',
    period_label: 'FY-2024',
    sector: 'industrial',
    canonical_numbers: {
      revenue: '100', ebitda: '20', net_income: '10', total_debt: '50', cash: '15',
    },
    highlights: [
      { code: 'NET_MARGIN', narrative_hint: 'Margin compressed vs FY23' },
      { code: 'ROE', narrative_hint: '12% — top quartile for sector' },
      { code: 'GROSS_MARGIN', narrative_hint: null },
    ],
    red_flags: [],
  };

  const rec = {
    checks: [
      { code: 'BS_IDENTITY', passed: true },
      { code: 'IS_NET_SPLIT', passed: true },
      { code: 'CF_NET_INCOME_CHAIN', passed: true },
      { code: 'NET_DEBT_CHAIN', passed: true },
    ],
  };

  it('scores all five dimensions', () => {
    const out = adaptQaReviewForLegacy(fa, rec, 'EREGL', 'qa-1');
    expect(out.dimension_scores.map(d => d.code).sort()).toEqual([
      'COMPLETENESS', 'EVIDENCE_SUFFICIENCY', 'FLAG_ACKNOWLEDGEMENT', 'MATH_CONSISTENCY', 'NARRATIVE_COVERAGE',
    ]);
  });

  it('overall pass=true when all dimensions clear 0.7', () => {
    const out = adaptQaReviewForLegacy(fa, rec, 'EREGL', 'qa-1');
    expect(out.overall_pass).toBe(true);
    expect(out.qa_decision).toBe('pass');
    expect(out.escalation_recommendation).toBe('none');
  });

  it('MATH_CONSISTENCY scores reconciliation pass rate', () => {
    const partial = { checks: [
      { code: 'BS_IDENTITY', passed: true },
      { code: 'IS_NET_SPLIT', passed: false },
    ]};
    const out = adaptQaReviewForLegacy(fa, partial, 'EREGL', 'qa-1');
    const m = out.dimension_scores.find(d => d.code === 'MATH_CONSISTENCY')!;
    expect(m.score).toBe(0.5);
    expect(m.evidence).toContain('IS_NET_SPLIT');
  });

  it('COMPLETENESS switches required codes for banking sector', () => {
    const bankFa = { ...fa, sector: 'banking', highlights: [
      { code: 'NIM', narrative_hint: null },
      { code: 'BANK_ROE', narrative_hint: null },
    ]};
    const out = adaptQaReviewForLegacy(bankFa, rec, 'AKBNK', 'qa-1');
    const c = out.dimension_scores.find(d => d.code === 'COMPLETENESS')!;
    // 2 of {NIM, BANK_ROE, COST_TO_INCOME} present → 2/3 ≈ 0.67
    expect(c.score).toBeCloseTo(0.67, 2);
  });
});


describe('adaptQaReviewForLegacy — failure paths', () => {
  it('returns fail + escalate_to_CEO when fa is null', () => {
    const out = adaptQaReviewForLegacy(null, null, 'EREGL', 'qa-1');
    expect(out.qa_decision).toBe('fail');
    expect(out.escalation_recommendation).toBe('escalate_to_CEO');
    expect(out.quality_flags[0]).toContain('NO_FINANCIAL_ANALYSIS');
  });

  it('MATH_CONSISTENCY=0 when reconciliation is null', () => {
    const fa = { highlights: [{ code: 'NET_MARGIN', narrative_hint: 'x' }], canonical_numbers: { a: '1' } };
    const out = adaptQaReviewForLegacy(fa, null, 'T', 'qa-1');
    const m = out.dimension_scores.find(d => d.code === 'MATH_CONSISTENCY')!;
    expect(m.score).toBe(0);
  });

  it('FLAG_ACKNOWLEDGEMENT=1 when critical flags are present alongside highlights', () => {
    const fa = {
      canonical_numbers: { a: '1', b: '2' },
      highlights: [{ code: 'NET_MARGIN', narrative_hint: 'x' }],
      red_flags: [{ code: 'CRITICAL_NEGATIVE_EQUITY', severity: 'critical', message: 'x' }],
    };
    const out = adaptQaReviewForLegacy(fa, null, 'T', 'qa-1');
    const f = out.dimension_scores.find(d => d.code === 'FLAG_ACKNOWLEDGEMENT')!;
    expect(f.score).toBe(1);
  });

  it('FLAG_ACKNOWLEDGEMENT=0 when critical flag but no highlights', () => {
    const fa = {
      canonical_numbers: { a: '1' },
      highlights: [],
      red_flags: [{ code: 'CRITICAL_NEG_EQ', severity: 'critical', message: 'x' }],
    };
    const out = adaptQaReviewForLegacy(fa, null, 'T', 'qa-1');
    const f = out.dimension_scores.find(d => d.code === 'FLAG_ACKNOWLEDGEMENT')!;
    expect(f.score).toBe(0);
  });

  it('decision=conditional_pass when overall in [0.5, 0.7)', () => {
    const fa = {
      highlights: [{ code: 'NET_MARGIN', narrative_hint: null }],
      canonical_numbers: { a: '1', b: null, c: null, d: null },
      red_flags: [],
    };
    const rec = { checks: [{ code: 'BS_IDENTITY', passed: true }] };
    const out = adaptQaReviewForLegacy(fa, rec, 'T', 'qa-1');
    expect(out.qa_decision).toBe('conditional_pass');
    expect(out.escalation_recommendation).toBe('escalate_to_CEO');
  });

  it('uppercases ticker and tags source=python', () => {
    const fa = { highlights: [], canonical_numbers: {}, red_flags: [] };
    const out = adaptQaReviewForLegacy(fa, null, 'eregl', 'qa-1');
    expect(out.ticker).toBe('EREGL');
    expect(out.source).toBe('python');
  });
});
