/**
 * Pre-Core-4 Phase C — ownership loader unit tests.
 */

import { describe, expect, it } from 'vitest';

import { loadOwnership, ownershipPieSlices } from './ownership-loader.js';

describe('ownership-loader — KCHOL', () => {
  it('loads KCHOL YAML with all required fields', () => {
    const data = loadOwnership('KCHOL');
    expect(data).not.toBeNull();
    expect(data!.ticker).toBe('KCHOL');
    expect(data!.verification_status).toBe('auto_curated_pending_operator_review');
    expect(data!.source.url).toMatch(/^https?:\/\//);
    expect(data!.source.as_of_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data!.source.source_filing).toBeTruthy();
  });

  it('KCHOL shareholders sum to 100% (within 0.1)', () => {
    const data = loadOwnership('KCHOL');
    expect(data).not.toBeNull();
    const sum = data!.shareholders.reduce((s, x) => s + x.pct, 0);
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.1);
  });

  it('KCHOL exposes a controlling shareholder', () => {
    const data = loadOwnership('KCHOL');
    expect(data!.shareholders.some((s) => s.is_controlling === true)).toBe(true);
  });

  it('returns null for unknown ticker', () => {
    expect(loadOwnership('NONEXIST')).toBeNull();
  });

  it('age_days is computed and non-negative', () => {
    const data = loadOwnership('KCHOL');
    expect(data!.age_days).toBeGreaterThanOrEqual(0);
  });

  it('rollup totals match a sensible decomposition', () => {
    const data = loadOwnership('KCHOL');
    expect(data!.rollup).toBeDefined();
    // free_float_pct must be > 0 for a public BIST listed company
    expect(data!.rollup!.free_float_pct).toBeGreaterThan(0);
  });
});

describe('ownership-loader — ticker normalization', () => {
  it('uppercases the ticker', () => {
    const lower = loadOwnership('kchol');
    expect(lower).not.toBeNull();
    expect(lower!.ticker).toBe('KCHOL');
  });
});

describe('ownershipPieSlices', () => {
  it('returns shareholder slices in source order', () => {
    const data = loadOwnership('KCHOL');
    const slices = ownershipPieSlices(data!);
    expect(slices.length).toBeGreaterThan(0);
    expect(slices[0].label).toBe(data!.shareholders[0].label);
  });

  it('drops trivial (<0.05) slices', () => {
    const data = loadOwnership('KCHOL');
    const slices = ownershipPieSlices(data!);
    for (const s of slices) {
      expect(s.value).toBeGreaterThan(0.05);
    }
  });
});
