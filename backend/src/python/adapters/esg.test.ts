import { describe, expect, it } from 'vitest';

import {
  adaptEsgForLegacy,
  computeCbamCost,
  extractCbamInputs,
} from './esg.js';


describe('extractCbamInputs', () => {
  it('parses JSON string and plain object', () => {
    expect(extractCbamInputs('{"scope1_tco2":1000}')?.scope1_tco2).toBe(1000);
    expect(extractCbamInputs({ scope1_tco2: 500 })?.scope1_tco2).toBe(500);
  });

  it('returns null on garbage', () => {
    expect(extractCbamInputs(null)).toBeNull();
    expect(extractCbamInputs('nope')).toBeNull();
  });
});


describe('computeCbamCost — ETS formula', () => {
  it('ETS cost = scope1 × (1 − free_pct) × carbon_price', () => {
    const out = computeCbamCost({
      scope1_tco2: 100_000,
      carbon_price_eur_per_t: 80,
      ets_free_allowance_pct: 0.4,
      cbam_coverage_pct: 0,    // zero-out CBAM half
    });
    // 100000 × 0.6 × 80 = 4,800,000
    expect(out.ets_annual_cost_eur).toBe(4_800_000);
  });

  it('raises on negative scope1', () => {
    expect(() => computeCbamCost({ scope1_tco2: -1 })).toThrow('non-negative');
  });

  it('defaults match 2026 indicative values (€85, 50% free, CBAM 48.5%)', () => {
    const out = computeCbamCost({ scope1_tco2: 10_000 });
    // ETS: 10000 × 0.5 × 85 = 425,000
    expect(out.ets_annual_cost_eur).toBe(425_000);
    // CBAM: 10000 × 0.485 × 85 = 412,250
    expect(out.cbam_annual_cost_eur).toBe(412_250);
    expect(out.total_annual_cost_eur).toBe(837_250);
  });
});


describe('computeCbamCost — CBAM punitive-default logic', () => {
  it('uses max(verified, default × tonnage) for CBAM basis', () => {
    // Verified: 10000 tCO2. Default: 1.5 tCO2/ton × 10000 tons = 15000 tCO2 (dirtier benchmark).
    // max = 15000.
    const out = computeCbamCost({
      scope1_tco2: 10_000,
      carbon_price_eur_per_t: 100,
      ets_free_allowance_pct: 0,
      cbam_coverage_pct: 1,                      // 100% phase-in for easy math
      product_tonnage: 10_000,
      cbam_default_intensity: 1.5,
    });
    // CBAM = 15000 × 1 × 100 = 1,500,000
    expect(out.cbam_annual_cost_eur).toBe(1_500_000);
  });

  it('uses verified when verified > default×tonnage (producer dirtier than benchmark)', () => {
    const out = computeCbamCost({
      scope1_tco2: 20_000,
      carbon_price_eur_per_t: 100,
      ets_free_allowance_pct: 0,
      cbam_coverage_pct: 1,
      product_tonnage: 10_000,
      cbam_default_intensity: 1.5,               // default = 15000, verified = 20000
    });
    expect(out.cbam_annual_cost_eur).toBe(2_000_000);
  });

  it('falls back to verified when tonnage/default missing', () => {
    const out = computeCbamCost({
      scope1_tco2: 10_000,
      carbon_price_eur_per_t: 100,
      ets_free_allowance_pct: 0,
      cbam_coverage_pct: 1,
    });
    expect(out.cbam_annual_cost_eur).toBe(1_000_000);
  });
});


describe('computeCbamCost — TRY conversion', () => {
  it('populates TRY figures when eur_try provided', () => {
    const out = computeCbamCost({
      scope1_tco2: 1_000,
      carbon_price_eur_per_t: 85,
      ets_free_allowance_pct: 0.5,
      cbam_coverage_pct: 0.485,
      eur_try: 45,
    });
    expect(out.ets_annual_cost_try).toBe(Math.round(out.ets_annual_cost_eur * 45));
    expect(out.total_annual_cost_try).toBe(Math.round(out.total_annual_cost_eur * 45));
  });

  it('TRY fields null when eur_try missing or zero', () => {
    const out = computeCbamCost({ scope1_tco2: 1_000 });
    expect(out.ets_annual_cost_try).toBeNull();
    expect(out.total_annual_cost_try).toBeNull();
  });
});


describe('adaptEsgForLegacy', () => {
  it('emits empty CBAM + warning when inputs are null', () => {
    const out = adaptEsgForLegacy(null, 'EREGL', 'esg-1');
    expect(out.cbam).toBeNull();
    expect(out.warnings.some(w => w.includes('CBAM inputs'))).toBe(true);
    expect(out.source).toBe('python');
  });

  it('passes through sector_hint + notes', () => {
    const out = adaptEsgForLegacy({ scope1_tco2: 1000 }, 'SISE', 'esg-1', {
      sectorHint: 'industrial',
      externalRatingsSupplied: true,
      notes: 'MSCI BBB, Sustainalytics medium',
    });
    expect(out.sector_hint).toBe('industrial');
    expect(out.external_ratings_supplied).toBe(true);
    expect(out.notes).toContain('MSCI');
  });

  it('computes CBAM with defaults when partial inputs given', () => {
    const out = adaptEsgForLegacy({ scope1_tco2: 100_000 }, 'EREGL', 'esg-1');
    expect(out.cbam).not.toBeNull();
    expect(out.cbam!.total_annual_cost_eur).toBeGreaterThan(0);
  });

  it('uppercases ticker', () => {
    const out = adaptEsgForLegacy(null, 'eregl', 'esg-1');
    expect(out.ticker).toBe('EREGL');
  });
});
