import { describe, expect, it } from 'vitest';

import {
  adaptValuationForLegacy,
  extractFinancialAnalysis,
  extractSectorCompetition,
} from './valuation.js';


describe('extractors', () => {
  it('parse JSON string + plain object', () => {
    expect(extractFinancialAnalysis('{"ticker":"X","sector":"industrial"}')?.ticker).toBe('X');
    expect(extractSectorCompetition({ benchmarks: [] })?.benchmarks).toEqual([]);
  });

  it('return null on garbage', () => {
    expect(extractFinancialAnalysis(null)).toBeNull();
    expect(extractSectorCompetition('not-json')).toBeNull();
  });
});


describe('adaptValuationForLegacy — warnings/flags', () => {
  it('emits banking_sector_warning and suppresses DCF for banking filer', () => {
    const fa = {
      ticker: 'AKBNK',
      period_label: 'FY-2024',
      sector: 'banking',
      engine_snapshot: { dcf: { per_share_value: 100, wacc_used: 0.15 } },
    };
    const out = adaptValuationForLegacy(fa, null, 'AKBNK', 'val-1');
    expect(out.banking_sector_warning).toBe(true);
    expect(out.dcf).toBeNull();
    // Wave 1: notes were Turkified ("Banka — FCF tabanlı DCF...")
    expect(out.notes.some(n => /banka|banking/i.test(n))).toBe(true);
  });

  it('emits holding_sotp_required for holding filer', () => {
    const fa = {
      ticker: 'KCHOL',
      period_label: 'FY-2024',
      sector: 'holding',
      engine_snapshot: { dcf: { per_share_value: 500, wacc_used: 0.18 } },
    };
    const out = adaptValuationForLegacy(fa, null, 'KCHOL', 'val-1');
    expect(out.holding_sotp_required).toBe(true);
    expect(out.notes.some(n => /sotp/i.test(n))).toBe(true);
  });

  it('Phase D — SOTP gate PASSES for KCHOL (curated YAML present)', () => {
    const fa = {
      ticker: 'KCHOL',
      period_label: 'FY-2024',
      sector: 'holding',
      engine_snapshot: { dcf: { per_share_value: 500, wacc_used: 0.18 } },
    };
    const out = adaptValuationForLegacy(fa, null, 'KCHOL', 'val-1');
    expect(out.sotp_gate_pass).toBe(true);
    expect(out.target_price_publish_blocked).toBe(false);
    expect(out.sotp_data).not.toBeNull();
    expect(out.sotp_data!.computed.total_subsidiary_count).toBeGreaterThanOrEqual(3);
    // per_share_value preserved when gate passes
    expect(out.dcf?.per_share_value).toBe(500);
  });

  it('Phase D — SOTP gate FAILS for holding without curated YAML; target_price blocked', () => {
    const fa = {
      ticker: 'NOSOTP',
      period_label: 'FY-2024',
      sector: 'holding',
      engine_snapshot: { dcf: { per_share_value: 500, wacc_used: 0.18 } },
    };
    const out = adaptValuationForLegacy(fa, null, 'NOSOTP', 'val-1');
    expect(out.sotp_gate_pass).toBe(false);
    expect(out.target_price_publish_blocked).toBe(true);
    expect(out.sotp_data).toBeNull();
    // per_share_value stripped when target_price publish blocked
    expect(out.dcf?.per_share_value).toBeNull();
    expect(out.warnings.some(w => /SOTP gate FAIL/.test(w))).toBe(true);
    expect(out.notes.some(n => /YAYINLANAMAZ/i.test(n))).toBe(true);
  });

  it('Phase D — SOTP gate trivially passes for non-holding industrial', () => {
    const fa = {
      sector: 'industrial',
      engine_snapshot: { dcf: { per_share_value: 50, wacc_used: 0.12 } },
    };
    const out = adaptValuationForLegacy(fa, null, 'EREGL', 'val-1');
    expect(out.sotp_gate_pass).toBe(true);
    expect(out.target_price_publish_blocked).toBe(false);
    expect(out.sotp_data).toBeNull();
  });

  it('emits try_wacc_warning when engine DCF used WACC > 25%', () => {
    const fa = {
      sector: 'industrial',
      engine_snapshot: { dcf: { per_share_value: 50, wacc_used: 0.32 } },
    };
    const out = adaptValuationForLegacy(fa, null, 'EREGL', 'val-1');
    expect(out.try_wacc_warning).toBe(true);
    expect(out.notes.some(n => n.toLowerCase().includes('try wacc'))).toBe(true);
  });

  it('no warnings when WACC is USD-like and sector is industrial', () => {
    const fa = {
      sector: 'industrial',
      engine_snapshot: { dcf: { per_share_value: 50, wacc_used: 0.12 } },
    };
    const out = adaptValuationForLegacy(fa, null, 'EREGL', 'val-1');
    expect(out.try_wacc_warning).toBe(false);
    expect(out.holding_sotp_required).toBe(false);
    expect(out.banking_sector_warning).toBe(false);
    expect(out.dcf).not.toBeNull();
  });

  it('warns when engine DCF is absent', () => {
    const fa = { sector: 'industrial', engine_snapshot: { dcf: null } };
    const out = adaptValuationForLegacy(fa, null, 'X', 'val-1');
    expect(out.warnings.some(w => w.includes('engine DCF'))).toBe(true);
    expect(out.dcf).toBeNull();
  });

  it('returns empty output + warning when fa is null', () => {
    const out = adaptValuationForLegacy(null, null, 'X', 'val-1');
    expect(out.warnings[0]).toContain('No financial_analysis');
    expect(out.dcf).toBeNull();
  });
});


describe('adaptValuationForLegacy — peer multiples', () => {
  const fa = { sector: 'industrial', engine_snapshot: { dcf: null } };

  it('picks EBITDA_MARGIN benchmark as peer_ev_ebitda proxy', () => {
    const sc = { benchmarks: [
      { metric_code: 'EBITDA_MARGIN', company_value: 12, median: 10, q1: 8, q3: 14 },
    ]};
    const out = adaptValuationForLegacy(fa, sc, 'X', 'val-1');
    expect(out.peer_ev_ebitda?.metric).toBe('EBITDA_MARGIN');
    expect(out.peer_ev_ebitda?.median).toBe(10);
    expect(out.peer_ev_ebitda?.company_vs_median).toBe(0.2); // (12/10 − 1) = 0.2
  });

  it('picks NET_MARGIN benchmark as peer_pe proxy', () => {
    const sc = { benchmarks: [
      { metric_code: 'NET_MARGIN', company_value: 8, median: 5, q1: 3, q3: 10 },
    ]};
    const out = adaptValuationForLegacy(fa, sc, 'X', 'val-1');
    expect(out.peer_pe?.metric).toBe('NET_MARGIN');
    expect(out.peer_pe?.company_value).toBe(8);
  });

  it('returns null peer stats when benchmark is missing', () => {
    const out = adaptValuationForLegacy(fa, null, 'X', 'val-1');
    expect(out.peer_ev_ebitda).toBeNull();
    expect(out.peer_pe).toBeNull();
  });
});


describe('adaptValuationForLegacy — misc', () => {
  it('uppercases ticker', () => {
    const out = adaptValuationForLegacy(
      { ticker: 'eregl', sector: 'industrial' }, null, 'x', 'val-1',
    );
    expect(out.ticker).toBe('EREGL');
  });

  it('tags output as source=python', () => {
    const out = adaptValuationForLegacy({ sector: 'industrial' }, null, 'X', 'val-1');
    expect(out.source).toBe('python');
  });
});
