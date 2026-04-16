import { describe, expect, it } from 'vitest';

import {
  adaptSectorCompetitionForLegacy,
  extractFinancialAnalysis,
  extractPeers,
} from './sector_competition.js';


describe('extractFinancialAnalysis / extractPeers', () => {
  it('parses JSON string and plain object', () => {
    expect(extractFinancialAnalysis('{"ticker":"X"}')?.ticker).toBe('X');
    expect(extractFinancialAnalysis({ ticker: 'Y' })?.ticker).toBe('Y');
  });

  it('extracts peers from raw array', () => {
    const out = extractPeers([{ ticker: 'A' }, { ticker: 'B' }]);
    expect(out.map(p => p.ticker)).toEqual(['A', 'B']);
  });

  it('extracts peers from wrapped object {peers:[...]}', () => {
    const out = extractPeers({ peers: [{ ticker: 'A' }] });
    expect(out).toHaveLength(1);
  });

  it('returns [] on garbage or missing', () => {
    expect(extractPeers(null)).toEqual([]);
    expect(extractPeers('not-json')).toEqual([]);
    expect(extractPeers({})).toEqual([]);
  });
});


describe('adaptSectorCompetitionForLegacy — industrial', () => {
  const target = {
    ticker: 'EREGL',
    period_label: 'FY-2024',
    sector: 'industrial',
    highlights: [
      { code: 'GROSS_MARGIN', value: 15 },
      { code: 'EBITDA_MARGIN', value: 10 },
      { code: 'NET_MARGIN', value: 5 },
      { code: 'ROE', value: 8 },
      { code: 'NET_DEBT_TO_EBITDA', value: 3 },
    ],
  };

  const peers = [
    { ticker: 'KRDMD', highlights: [
      { code: 'GROSS_MARGIN', value: 18 },
      { code: 'EBITDA_MARGIN', value: 12 },
      { code: 'NET_MARGIN', value: 7 },
      { code: 'ROE', value: 10 },
      { code: 'NET_DEBT_TO_EBITDA', value: 2 },
    ]},
    { ticker: 'PEER3', highlights: [
      { code: 'GROSS_MARGIN', value: 10 },
      { code: 'EBITDA_MARGIN', value: 6 },
      { code: 'NET_MARGIN', value: 3 },
      { code: 'ROE', value: 5 },
      { code: 'NET_DEBT_TO_EBITDA', value: 5 },
    ]},
  ];

  it('computes benchmarks for each industrial metric', () => {
    const out = adaptSectorCompetitionForLegacy(target, peers, 'EREGL', 'sc-1');
    expect(out.benchmarks.length).toBeGreaterThanOrEqual(5);
    const gm = out.benchmarks.find(b => b.metric_code === 'GROSS_MARGIN')!;
    expect(gm.company_value).toBe(15);
    expect(gm.min_value).toBe(10);
    expect(gm.max_value).toBe(18);
    expect(gm.peer_count).toBe(2);
  });

  it('tags strengths when company is in top quartile', () => {
    const strongerTarget = {
      ...target,
      highlights: [
        { code: 'GROSS_MARGIN', value: 30 }, // way above peers
        ...target.highlights.slice(1),
      ],
    };
    const out = adaptSectorCompetitionForLegacy(strongerTarget, peers, 'EREGL', 'sc-1');
    expect(out.strengths).toContain('GROSS_MARGIN');
  });

  it('tags weaknesses when company is in bottom quartile', () => {
    const weakerTarget = {
      ...target,
      highlights: [
        { code: 'GROSS_MARGIN', value: 2 },
        ...target.highlights.slice(1),
      ],
    };
    const out = adaptSectorCompetitionForLegacy(weakerTarget, peers, 'EREGL', 'sc-1');
    expect(out.weaknesses).toContain('GROSS_MARGIN');
  });

  it('lower_is_better metric (NET_DEBT_TO_EBITDA) inverts ranking', () => {
    const out = adaptSectorCompetitionForLegacy(target, peers, 'EREGL', 'sc-1');
    const nd = out.benchmarks.find(b => b.metric_code === 'NET_DEBT_TO_EBITDA')!;
    expect(nd.higher_is_better).toBe(false);
    // target=3, peers=[2, 5]; 2 is the best (lower), so target ranks #2
    expect(nd.company_rank).toBe(2);
  });

  it('reports peer_group tickers', () => {
    const out = adaptSectorCompetitionForLegacy(target, peers, 'EREGL', 'sc-1');
    expect(out.peer_group).toEqual(['KRDMD', 'PEER3']);
  });
});


describe('adaptSectorCompetitionForLegacy — banking switch', () => {
  const akbnk = {
    ticker: 'AKBNK',
    sector: 'banking',
    highlights: [
      { code: 'NIM', value: 5 },
      { code: 'BANK_ROE', value: 20 },
      { code: 'BANK_ROA', value: 2 },
      { code: 'COST_TO_INCOME', value: 40 },
      { code: 'LLP_NII_BURDEN', value: 25 },
    ],
  };

  it('uses banking metric catalogue', () => {
    const out = adaptSectorCompetitionForLegacy(akbnk, [], 'AKBNK', 'sc-1');
    const codes = out.benchmarks.map(b => b.metric_code);
    expect(codes).toContain('NIM');
    expect(codes).toContain('BANK_ROE');
    expect(codes).not.toContain('GROSS_MARGIN');
  });
});


describe('adaptSectorCompetitionForLegacy — degenerate cases', () => {
  it('emits warning when no peers are supplied', () => {
    const target = { ticker: 'X', sector: 'industrial', highlights: [{ code: 'ROE', value: 10 }] };
    const out = adaptSectorCompetitionForLegacy(target, [], 'X', 'sc-1');
    expect(out.warnings.some(w => w.includes('peer'))).toBe(true);
  });

  it('returns empty output with warning when company is null', () => {
    const out = adaptSectorCompetitionForLegacy(null, [], 'X', 'sc-1');
    expect(out.benchmarks).toEqual([]);
    expect(out.warnings.some(w => w.includes('No financial_analysis'))).toBe(true);
  });

  it('metric with no data produces null benchmark entry', () => {
    const target = { ticker: 'X', sector: 'industrial', highlights: [] };
    const out = adaptSectorCompetitionForLegacy(target, [], 'X', 'sc-1');
    const any = out.benchmarks[0];
    expect(any.company_value).toBeNull();
    expect(any.quartile).toBeNull();
  });

  it('tags output as source=python', () => {
    const target = { ticker: 'X', sector: 'industrial', highlights: [{ code: 'ROE', value: 10 }] };
    const out = adaptSectorCompetitionForLegacy(target, [], 'X', 'sc-1');
    expect(out.source).toBe('python');
  });
});
