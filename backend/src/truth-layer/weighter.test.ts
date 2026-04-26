import { describe, it, expect } from 'vitest';
import { classifyCompany } from './classifier.js';
import { recommendValuationWeights, methodWeight } from './weighter.js';

describe('truth-layer weighter', () => {
  it('recommends val_sotp primary for KCHOL (holding+banking_heavy)', () => {
    const c = classifyCompany('KCHOL');
    const w = recommendValuationWeights(c);
    expect(w.primary_method).toBe('val_sotp');
    expect(w.weights.val_sotp).toBeGreaterThanOrEqual(0.5);
    expect(w.weights.val_dcf).toBeLessThan(0.25);
    expect(w.justification.toLowerCase()).toContain('holding');
  });

  it('recommends val_sotp primary for DOHOL (plain holding)', () => {
    const c = classifyCompany('DOHOL');
    const w = recommendValuationWeights(c);
    expect(w.primary_method).toBe('val_sotp');
    expect(w.weights.val_sotp).toBeGreaterThanOrEqual(0.6);
  });

  it('recommends val_p_b primary for AKBNK (banking)', () => {
    const c = classifyCompany('AKBNK');
    const w = recommendValuationWeights(c);
    expect(w.primary_method).toBe('val_p_b');
    expect(w.weights.val_p_b).toBeGreaterThanOrEqual(0.4);
    expect(w.inappropriate_methods).toContain('val_dcf');
  });

  it('recommends val_dcf primary for ASELS (regular industrial)', () => {
    const c = classifyCompany('ASELS');
    const w = recommendValuationWeights(c);
    expect(w.primary_method).toBe('val_dcf');
    expect(w.weights.val_dcf).toBeGreaterThanOrEqual(0.5);
  });

  it('weights sum to 1.0 (within rounding tolerance)', () => {
    for (const ticker of ['KCHOL', 'SAHOL', 'AKBNK', 'ASELS', 'THYAO', 'TUPRS']) {
      const c = classifyCompany(ticker);
      const w = recommendValuationWeights(c);
      const sum = Object.values(w.weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeGreaterThanOrEqual(0.99);
      expect(sum).toBeLessThanOrEqual(1.01);
    }
  });

  it('inappropriate_methods includes val_p_b for non-bank companies', () => {
    const w = recommendValuationWeights(classifyCompany('THYAO'));
    expect(w.inappropriate_methods).toContain('val_p_b');
  });

  it('methodWeight convenience returns the registered weight', () => {
    const w = recommendValuationWeights(classifyCompany('KCHOL'));
    expect(methodWeight(w, 'val_sotp')).toBe(w.weights.val_sotp);
    expect(methodWeight(w, 'val_dcf')).toBe(w.weights.val_dcf);
  });
});
