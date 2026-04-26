import { describe, it, expect } from 'vitest';
import { classifyCompany, isHoldingTicker, isBankingTicker } from './classifier.js';

describe('truth-layer classifier', () => {
  it('classifies KCHOL as holding with banking_heavy sub-class', () => {
    const c = classifyCompany('KCHOL');
    expect(c.is_holding).toBe(true);
    expect(c.is_banking).toBe(false);
    expect(c.sub_classifications).toContain('banking_heavy');
    expect(c.sources).toContain('sector_registry');
    expect(c.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('classifies SAHOL as holding with banking_heavy sub-class', () => {
    const c = classifyCompany('SAHOL');
    expect(c.is_holding).toBe(true);
    expect(c.sub_classifications).toContain('banking_heavy');
  });

  it('classifies AKBNK as banking (not holding)', () => {
    const c = classifyCompany('AKBNK');
    expect(c.is_holding).toBe(false);
    expect(c.is_banking).toBe(true);
    expect(c.sources).toContain('sector_registry');
  });

  it('classifies ASELS as defense_electronics (industrial-like, not holding/banking)', () => {
    const c = classifyCompany('ASELS');
    expect(c.is_holding).toBe(false);
    expect(c.is_banking).toBe(false);
    expect(c.sector_canonical).toBe('defense_electronics');
  });

  it('classifies THYAO as aviation (regular)', () => {
    const c = classifyCompany('THYAO');
    expect(c.is_holding).toBe(false);
    expect(c.is_banking).toBe(false);
    expect(c.sector_canonical).toBe('aviation');
  });

  it('falls back to industrial when ticker is unknown', () => {
    const c = classifyCompany('UNKNOWN_TICKER_XYZ');
    expect(c.sector_canonical).toBe('industrial');
    expect(c.sources).toContain('default_industrial');
    expect(c.confidence).toBeLessThanOrEqual(0.5);
  });

  it('uses FA narrative as backup classifier when no registry hit', () => {
    const c = classifyCompany('NEWSTOCKZZZ', {
      fa_llm_narrative: '"bist_sector": "holding_conglomerate"',
    });
    expect(c.is_holding).toBe(true);
    expect(c.sources).toContain('fa_llm_narrative');
  });

  it('isHoldingTicker convenience returns true for KCHOL/SAHOL/DOHOL', () => {
    expect(isHoldingTicker('KCHOL')).toBe(true);
    expect(isHoldingTicker('SAHOL')).toBe(true);
    expect(isHoldingTicker('DOHOL')).toBe(true);
    expect(isHoldingTicker('AKBNK')).toBe(false);
    expect(isHoldingTicker('THYAO')).toBe(false);
  });

  it('isBankingTicker convenience returns true for AKBNK/GARAN/YKBNK', () => {
    expect(isBankingTicker('AKBNK')).toBe(true);
    expect(isBankingTicker('GARAN')).toBe(true);
    expect(isBankingTicker('YKBNK')).toBe(true);
    expect(isBankingTicker('KCHOL')).toBe(false);
  });

  it('reasoning is non-empty and includes registry hit', () => {
    const c = classifyCompany('TUPRS');
    expect(c.reasoning).toContain('TUPRS');
    expect(c.reasoning.toLowerCase()).toContain('registry');
  });
});
