import { describe, it, expect } from 'vitest';
import {
  SEVERITY_TR,
  RED_FLAG_TR,
  METRIC_TR,
  CONTRADICTION_TYPE_TR,
  QUESTION_CATEGORY_TR,
  CITATION_SOURCE_TR,
  SENTENCE_PATTERNS,
  lookupSeverityTr,
  lookupRedFlagTr,
  lookupMetricTr,
  lookupContradictionTypeTr,
  lookupQuestionCategoryTr,
  lookupCitationSourceTr,
} from './translation_dict.js';

describe('translation_dict — coverage', () => {
  it('SEVERITY_TR covers all required tiers', () => {
    for (const tier of ['critical', 'high', 'medium', 'low', 'authoritative', 'derived', 'inferred']) {
      expect(SEVERITY_TR[tier]).toBeTruthy();
    }
  });

  it('RED_FLAG_TR covers KCHOL live-observed codes', () => {
    expect(RED_FLAG_TR['OVERLEVERAGED']).toBe('Yüksek Borçluluk Riski');
    expect(RED_FLAG_TR['LIQUIDITY_TIGHT']).toBe('Likidite Baskısı');
    expect(RED_FLAG_TR['INTEREST_COVERAGE_LOW']).toBe('Faiz Karşılama Zayıflığı');
    expect(RED_FLAG_TR['PIOTROSKI_WEAK']).toBeTruthy();
    expect(RED_FLAG_TR['HOLDING_DUAL_STREAM']).toBeTruthy();
    expect(RED_FLAG_TR['ALTMAN_Z']).toBeTruthy();
  });

  it('METRIC_TR covers core financial metrics', () => {
    for (const code of ['ROE', 'ROA', 'ROCE', 'GROSS_MARGIN', 'EBITDA_MARGIN', 'NET_MARGIN', 'NET_DEBT', 'NET_DEBT_TO_EBITDA', 'CCC', 'FCF', 'OCF']) {
      expect(METRIC_TR[code]).toBeTruthy();
    }
  });

  it('CONTRADICTION_TYPE_TR covers all 6 P3.alpha types', () => {
    for (const t of ['valuation_method_mismatch', 'target_spread', 'thesis_vs_valuation', 'confidence_vs_conviction', 'financial_red_flag_vs_narrative', 'synthesis_divergence']) {
      expect(CONTRADICTION_TYPE_TR[t]).toBeTruthy();
    }
  });

  it('QUESTION_CATEGORY_TR covers all 5 P3.gamma categories', () => {
    for (const c of ['valuation_challenge', 'financial_risk_challenge', 'methodology_challenge', 'management_strategy', 'downside_scenario']) {
      expect(QUESTION_CATEGORY_TR[c]).toBeTruthy();
    }
  });

  it('CITATION_SOURCE_TR covers all 9 P3.delta source types', () => {
    for (const t of ['kap_disclosure', 'fa_red_flag', 'fa_metric', 'fa_confidence', 'truth_assertion', 'synthesis_divergence', 'synthesis_score', 'methodology_decision', 'contradiction_finding']) {
      expect(CITATION_SOURCE_TR[t]).toBeTruthy();
    }
  });

  it('SENTENCE_PATTERNS includes the live-observed English fragments', () => {
    const sources = SENTENCE_PATTERNS.map(p => p.pattern);
    expect(sources.some(p => p.includes('inspect closer'))).toBe(true);
    expect(sources.some(p => p.includes('FA raised'))).toBe(true);
    expect(sources.some(p => p.includes('Boardroom will ask'))).toBe(true);
  });
});

describe('translation_dict — lookup helpers', () => {
  it('lookupSeverityTr is case-insensitive', () => {
    expect(lookupSeverityTr('HIGH')).toBe('yüksek');
    expect(lookupSeverityTr('High')).toBe('yüksek');
    expect(lookupSeverityTr('high')).toBe('yüksek');
  });

  it('lookupRedFlagTr returns null for unknown code', () => {
    expect(lookupRedFlagTr('UNKNOWN_CODE_XYZ')).toBeNull();
  });

  it('lookupMetricTr handles uppercase normalisation', () => {
    expect(lookupMetricTr('roe')).toBe('Özsermaye Karlılığı');
    expect(lookupMetricTr('ROE')).toBe('Özsermaye Karlılığı');
  });

  it('lookupContradictionTypeTr returns Turkish for all types', () => {
    expect(lookupContradictionTypeTr('valuation_method_mismatch')).toBe('Değerleme Metodolojisi Uyumsuzluğu');
    expect(lookupContradictionTypeTr('synthesis_divergence')).toBe('Sentez Katmanı Tutarsızlık Uyarısı');
  });

  it('lookupQuestionCategoryTr returns Turkish for chairman categories', () => {
    expect(lookupQuestionCategoryTr('financial_risk_challenge')).toBe('Finansal Risk Sorgulaması');
  });

  it('lookupCitationSourceTr returns Turkish for source types', () => {
    expect(lookupCitationSourceTr('kap_disclosure')).toBe('KAP Bildirimleri');
    expect(lookupCitationSourceTr('fa_red_flag')).toBe('Finansal Risk Bayrakları');
  });
});
