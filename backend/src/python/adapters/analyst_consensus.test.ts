import { describe, expect, it } from 'vitest';

import {
  adaptAnalystConsensusForLegacy,
  extractReports,
} from './analyst_consensus.js';


describe('extractReports', () => {
  it('accepts bare array', () => {
    const out = extractReports([{ broker: 'A', recommendation: 'buy' }]);
    expect(out.length).toBe(1);
  });

  it('accepts {reports:[...]} wrapper', () => {
    expect(extractReports({ reports: [{ broker: 'X' }] }).length).toBe(1);
  });

  it('accepts JSON string', () => {
    expect(extractReports(JSON.stringify([{ broker: 'X' }])).length).toBe(1);
  });

  it('returns [] on garbage/null', () => {
    expect(extractReports(null)).toEqual([]);
    expect(extractReports('not-json')).toEqual([]);
    expect(extractReports(42)).toEqual([]);
  });
});


describe('adaptAnalystConsensusForLegacy — distribution + stats', () => {
  const reports = [
    { broker: 'A', recommendation: 'buy',  target_price: 100, report_date: '2026-04-01' },
    { broker: 'B', recommendation: 'buy',  target_price: 110, report_date: '2026-04-05' },
    { broker: 'C', recommendation: 'hold', target_price: 95,  report_date: '2026-03-10' },
    { broker: 'D', recommendation: 'sell', target_price: 70,  report_date: '2026-02-15' },
    { broker: 'E', recommendation: 'outperform', target_price: 120, report_date: '2026-04-02' },
  ];

  it('bucketises recommendations (buy/outperform → buy, sell/underperform → sell)', () => {
    const out = adaptAnalystConsensusForLegacy(reports, 'X', 'ac-1');
    expect(out.distribution_buy).toBe(3);
    expect(out.distribution_hold).toBe(1);
    expect(out.distribution_sell).toBe(1);
  });

  it('computes target-price stats (mean/median/high/low/stddev)', () => {
    const out = adaptAnalystConsensusForLegacy(reports, 'X', 'ac-1');
    expect(out.target_price_mean).toBe(99);   // (100+110+95+70+120)/5
    expect(out.target_price_median).toBe(100);
    expect(out.target_price_high).toBe(120);
    expect(out.target_price_low).toBe(70);
    expect(out.target_price_stddev).toBeGreaterThan(0);
  });

  it('upside_vs_last_close_pct computed from last_close option', () => {
    const out = adaptAnalystConsensusForLegacy(reports, 'X', 'ac-1', { lastClose: 90 });
    // mean=99, lc=90 → (99/90 - 1) * 100 = 10
    expect(out.upside_vs_last_close_pct).toBe(10);
  });

  it('upside null when last_close not supplied', () => {
    const out = adaptAnalystConsensusForLegacy(reports, 'X', 'ac-1');
    expect(out.upside_vs_last_close_pct).toBeNull();
  });

  it('skips non-numeric target_price entries', () => {
    const dirty = [...reports, { broker: 'Z', recommendation: 'buy', target_price: 'n/a', report_date: '2026-04-10' }];
    const out = adaptAnalystConsensusForLegacy(dirty, 'X', 'ac-1');
    expect(out.target_price_mean).toBe(99);   // same as before — 'n/a' dropped
  });
});


describe('adaptAnalystConsensusForLegacy — revision trend + crowded long', () => {
  it('detects rising trend (recent 30d mean > older 60d mean by >3%)', () => {
    const reports = [
      { broker: 'A', recommendation: 'buy', target_price: 80, report_date: '2026-01-15' },
      { broker: 'B', recommendation: 'buy', target_price: 85, report_date: '2026-02-01' },
      { broker: 'C', recommendation: 'buy', target_price: 95, report_date: '2026-04-05' },
      { broker: 'D', recommendation: 'buy', target_price: 100, report_date: '2026-04-10' },
      { broker: 'E', recommendation: 'buy', target_price: 110, report_date: '2026-04-12' },
    ];
    const out = adaptAnalystConsensusForLegacy(reports, 'X', 'ac-1', { asOf: '2026-04-14' });
    expect(out.revision_trend).toBe('rising');
  });

  it('detects falling trend', () => {
    const reports = [
      { broker: 'A', recommendation: 'hold', target_price: 110, report_date: '2026-01-15' },
      { broker: 'B', recommendation: 'hold', target_price: 115, report_date: '2026-02-01' },
      { broker: 'C', recommendation: 'hold', target_price: 95,  report_date: '2026-04-05' },
      { broker: 'D', recommendation: 'hold', target_price: 90,  report_date: '2026-04-10' },
      { broker: 'E', recommendation: 'hold', target_price: 85,  report_date: '2026-04-12' },
    ];
    const out = adaptAnalystConsensusForLegacy(reports, 'X', 'ac-1', { asOf: '2026-04-14' });
    expect(out.revision_trend).toBe('falling');
  });

  it('returns null trend when <3 priced reports', () => {
    const reports = [
      { broker: 'A', recommendation: 'buy', target_price: 100, report_date: '2026-04-01' },
      { broker: 'B', recommendation: 'hold', target_price: 95, report_date: '2026-04-02' },
    ];
    const out = adaptAnalystConsensusForLegacy(reports, 'X', 'ac-1');
    expect(out.revision_trend).toBeNull();
  });

  it('crowded_long_flag set when ≥5 reports and zero SELLs and ≥3 BUYs', () => {
    const reports = Array.from({ length: 6 }, (_, i) => ({
      broker: `B${i}`, recommendation: 'buy' as const, target_price: 100 + i,
    }));
    const out = adaptAnalystConsensusForLegacy(reports, 'X', 'ac-1');
    expect(out.crowded_long_flag).toBe(true);
    expect(out.warnings.some(w => w.includes('Crowded long'))).toBe(true);
  });

  it('warns when zero reports supplied', () => {
    const out = adaptAnalystConsensusForLegacy([], 'X', 'ac-1');
    expect(out.warnings.some(w => w.includes('No analyst'))).toBe(true);
    expect(out.count).toBe(0);
    expect(out.crowded_long_flag).toBe(false);
  });

  it('tags output as source=python and uppercases ticker', () => {
    const out = adaptAnalystConsensusForLegacy([], 'eregl', 'ac-1');
    expect(out.ticker).toBe('EREGL');
    expect(out.source).toBe('python');
  });
});
