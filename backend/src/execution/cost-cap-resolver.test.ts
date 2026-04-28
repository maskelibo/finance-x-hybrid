/**
 * Pre-P5 Wave A2 — cost cap resolver tests.
 */
import { describe, expect, it } from 'vitest';
import {
  resolveCostCap,
  listCalibratedTickers,
  COST_CAP_REASON_CODES,
  COST_CAP_FALLBACK_USD,
  CALIBRATED_CAPS_USD,
  CALIBRATION_SOURCE_COMMIT,
} from './cost-cap-resolver.js';

// =============================================================================
// Calibrated tickers
// =============================================================================

describe('cost-cap-resolver — calibrated tickers', () => {
  it('KCHOL resolves to $7.46 (per-ticker p95 + 20%)', () => {
    const r = resolveCostCap('KCHOL');
    expect(r.cap_usd).toBe(7.46);
    expect(r.ticker).toBe('KCHOL');
    expect(r.reason_code).toBe(COST_CAP_REASON_CODES.COST_CAP_CALIBRATED);
    expect(r.source).toBe('per_ticker_p95_plus_20');
    expect(r.details).toContain('KCHOL');
    expect(r.details).toContain('$7.46');
    expect(r.details).toContain(CALIBRATION_SOURCE_COMMIT);
  });

  it('THYAO resolves to $2.68', () => {
    const r = resolveCostCap('THYAO');
    expect(r.cap_usd).toBe(2.68);
    expect(r.reason_code).toBe(COST_CAP_REASON_CODES.COST_CAP_CALIBRATED);
  });

  it('EREGL resolves to $5.53', () => {
    const r = resolveCostCap('EREGL');
    expect(r.cap_usd).toBe(5.53);
    expect(r.reason_code).toBe(COST_CAP_REASON_CODES.COST_CAP_CALIBRATED);
  });

  it('listCalibratedTickers returns sorted unique', () => {
    const list = listCalibratedTickers();
    expect(list).toEqual(['EREGL', 'KCHOL', 'THYAO']);
  });

  it('CALIBRATED_CAPS_USD is frozen (cannot be mutated)', () => {
    expect(Object.isFrozen(CALIBRATED_CAPS_USD)).toBe(true);
  });
});

// =============================================================================
// Fallback paths
// =============================================================================

describe('cost-cap-resolver — fallback paths', () => {
  it('null ticker → FALLBACK_MISSING_TICKER + $8 fallback', () => {
    const r = resolveCostCap(null);
    expect(r.cap_usd).toBe(COST_CAP_FALLBACK_USD);
    expect(r.cap_usd).toBe(8.00);
    expect(r.ticker).toBeNull();
    expect(r.reason_code).toBe(COST_CAP_REASON_CODES.COST_CAP_FALLBACK_MISSING_TICKER);
    expect(r.source).toBe('fallback_global_safe_cap');
  });

  it('undefined ticker → FALLBACK_MISSING_TICKER', () => {
    const r = resolveCostCap(undefined);
    expect(r.cap_usd).toBe(COST_CAP_FALLBACK_USD);
    expect(r.reason_code).toBe(COST_CAP_REASON_CODES.COST_CAP_FALLBACK_MISSING_TICKER);
  });

  it('empty string → FALLBACK_MISSING_TICKER', () => {
    const r = resolveCostCap('');
    expect(r.reason_code).toBe(COST_CAP_REASON_CODES.COST_CAP_FALLBACK_MISSING_TICKER);
  });

  it('whitespace-only string → FALLBACK_MISSING_TICKER', () => {
    const r = resolveCostCap('   ');
    expect(r.reason_code).toBe(COST_CAP_REASON_CODES.COST_CAP_FALLBACK_MISSING_TICKER);
    expect(r.ticker).toBeNull();
  });

  it('ASELS (no calibration data) → FALLBACK_UNKNOWN_TICKER + $8', () => {
    const r = resolveCostCap('ASELS');
    expect(r.cap_usd).toBe(COST_CAP_FALLBACK_USD);
    expect(r.ticker).toBe('ASELS');
    expect(r.reason_code).toBe(COST_CAP_REASON_CODES.COST_CAP_FALLBACK_UNKNOWN_TICKER);
    expect(r.source).toBe('fallback_global_safe_cap');
    expect(r.details).toContain('ASELS');
  });

  it('arbitrary unknown ticker → FALLBACK_UNKNOWN_TICKER', () => {
    const r = resolveCostCap('XXNOTREAL');
    expect(r.cap_usd).toBe(COST_CAP_FALLBACK_USD);
    expect(r.reason_code).toBe(COST_CAP_REASON_CODES.COST_CAP_FALLBACK_UNKNOWN_TICKER);
  });

  it('fallback cap is strictly larger than any calibrated cap (safe by construction)', () => {
    for (const t of listCalibratedTickers()) {
      expect(resolveCostCap(t).cap_usd).toBeLessThanOrEqual(COST_CAP_FALLBACK_USD);
    }
  });
});

// =============================================================================
// Ticker normalization
// =============================================================================

describe('cost-cap-resolver — ticker normalization', () => {
  it('lowercase resolves identically to uppercase', () => {
    expect(resolveCostCap('kchol').cap_usd).toBe(resolveCostCap('KCHOL').cap_usd);
    expect(resolveCostCap('kchol').reason_code).toBe(resolveCostCap('KCHOL').reason_code);
  });

  it('mixed case resolves identically', () => {
    expect(resolveCostCap('KcHoL').cap_usd).toBe(7.46);
    expect(resolveCostCap('ThYaO').cap_usd).toBe(2.68);
  });

  it('whitespace is trimmed', () => {
    expect(resolveCostCap('  KCHOL  ').cap_usd).toBe(7.46);
    expect(resolveCostCap('\tEREGL\n').cap_usd).toBe(5.53);
  });

  it('ticker field in resolution is normalized (uppercase, trimmed)', () => {
    expect(resolveCostCap('  kchol  ').ticker).toBe('KCHOL');
    expect(resolveCostCap('thyao').ticker).toBe('THYAO');
  });
});

// =============================================================================
// Determinism + purity
// =============================================================================

describe('cost-cap-resolver — purity', () => {
  it('same input → identical output across calls (pure function)', () => {
    const a = resolveCostCap('KCHOL');
    const b = resolveCostCap('KCHOL');
    expect(a).toEqual(b);
  });

  it('does not throw on any input — never propagates', () => {
    expect(() => resolveCostCap('')).not.toThrow();
    expect(() => resolveCostCap(null)).not.toThrow();
    expect(() => resolveCostCap(undefined)).not.toThrow();
    expect(() => resolveCostCap('  ')).not.toThrow();
    expect(() => resolveCostCap('XXNOTREAL')).not.toThrow();
    expect(() => resolveCostCap('@@@$$$')).not.toThrow();
  });
});

// =============================================================================
// Reason-code coverage (every frozen code can fire)
// =============================================================================

describe('cost-cap-resolver — reason-code coverage', () => {
  it('every COST_CAP_REASON_CODES key is reachable', () => {
    const reached = new Set<string>();
    reached.add(resolveCostCap('KCHOL').reason_code);             // CALIBRATED
    reached.add(resolveCostCap('XXNOTREAL').reason_code);          // FALLBACK_UNKNOWN_TICKER
    reached.add(resolveCostCap(null).reason_code);                 // FALLBACK_MISSING_TICKER
    expect(reached.size).toBe(Object.keys(COST_CAP_REASON_CODES).length);
  });
});
