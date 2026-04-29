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

  it('scores all 12 dimensions (5 legacy + 6 Wave 2 truth + 1 Phase E visual)', () => {
    const out = adaptQaReviewForLegacy(fa, rec, 'EREGL', 'qa-1');
    expect(out.dimension_scores.map(d => d.code).sort()).toEqual([
      'CFS_PARSED_NOT_ESTIMATED',
      'COMPLETENESS',
      'EVIDENCE_SUFFICIENCY',
      'FLAG_ACKNOWLEDGEMENT',
      'LANGUAGE_PURITY',
      'MATH_CONSISTENCY',
      'MULTI_YEAR_COVERAGE',
      'NARRATIVE_COVERAGE',
      'OWNERSHIP_FRESHNESS',
      'PEER_COUNT_SUFFICIENT',
      'PERIOD_CONSISTENCY',
      'VISUAL_COVERAGE',
    ]);
  });

  it('overall pass=true when all dimensions clear 0.7', () => {
    // With Phase E adding VISUAL_COVERAGE (mid-score 0.5 by default), the
    // happy-path mean drops below 0.7; provide a high chart_ready proxy
    // so this test continues exercising the fully-passing branch.
    const out = adaptQaReviewForLegacy(fa, rec, 'EREGL', 'qa-1', {
      truthContext: { charts_ready_count: 12, charts_total_count: 13 },
    });
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


describe('adaptQaReviewForLegacy — Wave 2 truth dimensions', () => {
  const fa = {
    ticker: 'KCHOL', period_label: 'FY-2025', sector: 'holding',
    canonical_numbers: { gross_margin: '17.0', net_margin: '1.2', operating_cash_flow: null, capex: null },
    highlights: [{ code: 'NET_MARGIN', narrative_hint: 'low' }, { code: 'ROE', narrative_hint: 'mid' }],
    red_flags: [],
  };
  const rec = {
    checks: [
      { code: 'BS_IDENTITY', passed: true, message: 'skipped: totals are zero' },
      { code: 'BS_EQUITY_SPLIT', passed: true, message: 'skipped: parent missing' },
    ],
  };

  it('mid-score (0.5) for all 7 truth dims when context not supplied', () => {
    const out = adaptQaReviewForLegacy(fa, rec, 'KCHOL', 'qa-1');
    const truthCodes = ['MULTI_YEAR_COVERAGE', 'PEER_COUNT_SUFFICIENT', 'OWNERSHIP_FRESHNESS',
      'CFS_PARSED_NOT_ESTIMATED', 'PERIOD_CONSISTENCY', 'LANGUAGE_PURITY', 'VISUAL_COVERAGE'];
    for (const code of truthCodes) {
      const d = out.dimension_scores.find(x => x.code === code)!;
      expect(d.score).toBe(0.5);
    }
  });

  it('hard_fail when peer_count=0 (blocker)', () => {
    const out = adaptQaReviewForLegacy(fa, rec, 'KCHOL', 'qa-1', {
      truthContext: { peer_count: 0 },
    });
    expect(out.qa_decision).toBe('hard_fail');
    expect(out.escalation_recommendation).toBe('block_publish');
    expect(out.blocker_failures).toContain('PEER_COUNT_SUFFICIENT');
    expect(out.overall_pass).toBe(false);
  });

  it('hard_fail when CFS not parsed (blocker)', () => {
    const out = adaptQaReviewForLegacy(fa, rec, 'KCHOL', 'qa-1', {
      truthContext: { cfs_operating_cash_flow_parsed: false, cfs_capex_parsed: false },
    });
    expect(out.qa_decision).toBe('hard_fail');
    expect(out.blocker_failures).toContain('CFS_PARSED_NOT_ESTIMATED');
  });

  it('hard_fail when period mismatch (FA vs reconciliation)', () => {
    const out = adaptQaReviewForLegacy(fa, rec, 'KCHOL', 'qa-1', {
      truthContext: { reconciliation_period: 'FY-2026' },
    });
    expect(out.qa_decision).toBe('hard_fail');
    expect(out.blocker_failures).toContain('PERIOD_CONSISTENCY');
  });

  it('hard_fail when ownership is static_fallback (blocker — hardcoded fallback only)', () => {
    const out = adaptQaReviewForLegacy(fa, rec, 'KCHOL', 'qa-1', {
      truthContext: { ownership_source: 'static_fallback' },
    });
    expect(out.qa_decision).toBe('hard_fail');
    expect(out.blocker_failures).toContain('OWNERSHIP_FRESHNESS');
  });

  it('Phase I — curated_pending_review scores 0.5 (NOT blocker) for fresh YAML', () => {
    const out = adaptQaReviewForLegacy(fa, rec, 'KCHOL', 'qa-1', {
      truthContext: { ownership_source: 'curated_pending_review', ownership_age_days: 30 },
    });
    const dim = out.dimension_scores.find(d => d.code === 'OWNERSHIP_FRESHNESS')!;
    expect(dim.score).toBe(0.5);
    expect(dim.is_blocker).toBeUndefined();
    expect(out.blocker_failures ?? []).not.toContain('OWNERSHIP_FRESHNESS');
  });

  it('Phase I — curated_pending_review scores 0.3 when stale (>180d), still not blocker', () => {
    const out = adaptQaReviewForLegacy(fa, rec, 'KCHOL', 'qa-1', {
      truthContext: { ownership_source: 'curated_pending_review', ownership_age_days: 200 },
    });
    const dim = out.dimension_scores.find(d => d.code === 'OWNERSHIP_FRESHNESS')!;
    expect(dim.score).toBe(0.3);
    expect(dim.is_blocker).toBeUndefined();
    expect(out.blocker_failures ?? []).not.toContain('OWNERSHIP_FRESHNESS');
  });

  it('hard_fail when multi_year_periods < 3 (blocker)', () => {
    const out = adaptQaReviewForLegacy(fa, rec, 'KCHOL', 'qa-1', {
      truthContext: { multi_year_periods: 1 },
    });
    expect(out.qa_decision).toBe('hard_fail');
    expect(out.blocker_failures).toContain('MULTI_YEAR_COVERAGE');
  });

  it('PASS when all 12 dims clear thresholds', () => {
    const recReal = {
      checks: [
        { code: 'BS_IDENTITY', passed: true, message: 'ok' },
        { code: 'IS_NET_SPLIT', passed: true, message: 'ok' },
      ],
    };
    const out = adaptQaReviewForLegacy(fa, recReal, 'KCHOL', 'qa-1', {
      truthContext: {
        multi_year_periods: 5,
        peer_count: 4,
        ownership_source: 'kap_filing',
        ownership_age_days: 30,
        cfs_operating_cash_flow_parsed: true,
        cfs_capex_parsed: true,
        reconciliation_period: 'FY-2025',
        english_residue_count: 0,
        estimate_judgment_rewrites: 0,
        charts_ready_count: 12,
        charts_total_count: 13,
      },
    });
    expect(out.qa_decision).toBe('pass');
    expect(out.overall_pass).toBe(true);
    expect(out.blocker_failures).toBeUndefined();
  });

  it('Phase E — VISUAL_COVERAGE scores by ratio of ready charts', () => {
    const out12 = adaptQaReviewForLegacy(fa, rec, 'KCHOL', 'qa-1', {
      truthContext: { charts_ready_count: 12, charts_total_count: 13 },
    });
    const dim12 = out12.dimension_scores.find(d => d.code === 'VISUAL_COVERAGE')!;
    expect(dim12.score).toBe(1);

    const out8 = adaptQaReviewForLegacy(fa, rec, 'KCHOL', 'qa-1', {
      truthContext: { charts_ready_count: 8, charts_total_count: 13 },
    });
    const dim8 = out8.dimension_scores.find(d => d.code === 'VISUAL_COVERAGE')!;
    expect(dim8.score).toBe(0.7); // 8/13 ≈ 0.62 → bucket [0.55, 0.75) → 0.7

    const out6 = adaptQaReviewForLegacy(fa, rec, 'KCHOL', 'qa-1', {
      truthContext: { charts_ready_count: 6, charts_total_count: 13 },
    });
    const dim6 = out6.dimension_scores.find(d => d.code === 'VISUAL_COVERAGE')!;
    expect(dim6.score).toBe(0.5); // 6/13 ≈ 0.46 → bucket [0.4, 0.55) → 0.5
  });

  it('Phase E — VISUAL_COVERAGE blocker when <4 charts ready', () => {
    const out = adaptQaReviewForLegacy(fa, rec, 'KCHOL', 'qa-1', {
      truthContext: { charts_ready_count: 2, charts_total_count: 13 },
    });
    expect(out.qa_decision).toBe('hard_fail');
    expect(out.blocker_failures).toContain('VISUAL_COVERAGE');
  });

  it('mathConsistency distinguishes skipped from truly_passed', () => {
    const recAllSkipped = {
      checks: [
        { code: 'A', passed: true, message: 'skipped: data missing' },
        { code: 'B', passed: true, message: 'skipped: totals are zero' },
      ],
    };
    const out = adaptQaReviewForLegacy(fa, recAllSkipped, 'KCHOL', 'qa-1');
    const math = out.dimension_scores.find(d => d.code === 'MATH_CONSISTENCY')!;
    expect(math.score).toBe(0); // 0 / 0 = 0, all skipped = no real signal
    expect(math.evidence).toContain('skipped');
  });
});
