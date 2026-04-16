import { describe, expect, it } from 'vitest';

import {
  adaptStrategicSynthesisForLegacy,
  extractEventImpact,
  extractFinancialAnalysis,
  extractMacro,
  extractSectorCompetition,
  extractTechnical,
} from './strategic_synthesis.js';


describe('extractors', () => {
  it('parse JSON string and plain object variants', () => {
    expect(extractFinancialAnalysis('{"ticker":"X"}')?.ticker).toBe('X');
    expect(extractSectorCompetition({ strengths: ['ROE'] })?.strengths).toEqual(['ROE']);
    expect(extractTechnical('{"trend":"bullish"}')?.trend).toBe('bullish');
    expect(extractMacro({ tilt: 'negative' })?.tilt).toBe('negative');
    expect(extractEventImpact({ event_impacts: [{ impact_direction: 'positive' }] })?.event_impacts?.length).toBe(1);
  });

  it('return null on garbage', () => {
    expect(extractFinancialAnalysis(null)).toBeNull();
    expect(extractFinancialAnalysis('not-json')).toBeNull();
    expect(extractMacro(42)).toBeNull();
  });
});


describe('adaptStrategicSynthesisForLegacy — bucketing + score', () => {
  const fa = {
    ticker: 'EREGL',
    period_label: 'FY-2024',
    sector: 'industrial',
    highlights: [
      { code: 'GROSS_MARGIN', label: 'Gross margin', value: 15, narrative_hint: 'x' },
      { code: 'EBITDA_MARGIN', label: 'EBITDA margin', value: 10, narrative_hint: 'x' },
      { code: 'NET_MARGIN', label: 'Net margin', value: 5, narrative_hint: 'x' },
      { code: 'ROE', label: 'ROE', value: 8, narrative_hint: 'x' },
      { code: 'ALTMAN_Z', label: 'Altman Z', value: 3, narrative_hint: 'x' },
    ],
    red_flags: [{ code: 'MINOR_LEVERAGE_DRIFT', severity: 'info', message: 'info only' }],
  };

  it('bucketises positive highlights as positive signals', () => {
    const out = adaptStrategicSynthesisForLegacy({
      financialAnalysis: fa,
      sectorCompetition: null,
      technical: null,
      macro: null,
      eventImpact: null,
    }, 'EREGL', 'ss-1');
    expect(out.signals.positive.length).toBe(5);
    expect(out.signals.neutral.some(s => s.label === 'MINOR_LEVERAGE_DRIFT')).toBe(true);
  });

  it('NET_MARGIN≤0 flips the signal to negative', () => {
    const faNeg = { ...fa, highlights: [{ code: 'NET_MARGIN', value: -2 }] };
    const out = adaptStrategicSynthesisForLegacy({
      financialAnalysis: faNeg,
      sectorCompetition: null, technical: null, macro: null, eventImpact: null,
    }, 'X', 'ss-1');
    expect(out.signals.negative[0].label).toBe('NET_MARGIN');
  });

  it('peer strengths/weaknesses feed signed peer signals', () => {
    const sc = { strengths: ['ROE'], weaknesses: ['CCC'] };
    const out = adaptStrategicSynthesisForLegacy({
      financialAnalysis: fa, sectorCompetition: sc, technical: null, macro: null, eventImpact: null,
    }, 'EREGL', 'ss-1');
    expect(out.signals.positive.some(s => s.label.includes('ROE'))).toBe(true);
    expect(out.signals.negative.some(s => s.label.includes('CCC'))).toBe(true);
  });

  it('technical trend "bullish" → positive technical signal', () => {
    const out = adaptStrategicSynthesisForLegacy({
      financialAnalysis: fa, sectorCompetition: null,
      technical: { trend: 'bullish' },
      macro: null, eventImpact: null,
    }, 'EREGL', 'ss-1');
    expect(out.signals.positive.some(s => s.source === 'technical')).toBe(true);
  });

  it('macro tilt "negative" → negative macro signal', () => {
    const out = adaptStrategicSynthesisForLegacy({
      financialAnalysis: fa, sectorCompetition: null, technical: null,
      macro: { tilt: 'negative' },
      eventImpact: null,
    }, 'EREGL', 'ss-1');
    expect(out.signals.negative.some(s => s.source === 'macro')).toBe(true);
  });

  it('event net direction uses majority of event_impacts', () => {
    const ev = { event_impacts: [
      { impact_direction: 'positive' }, { impact_direction: 'positive' }, { impact_direction: 'positive' },
    ]};
    const out = adaptStrategicSynthesisForLegacy({
      financialAnalysis: fa, sectorCompetition: null, technical: null, macro: null,
      eventImpact: ev,
    }, 'EREGL', 'ss-1');
    expect(out.signals.positive.some(s => s.source === 'event')).toBe(true);
  });

  it('convergence_score in [-1, 1] range', () => {
    const out = adaptStrategicSynthesisForLegacy({
      financialAnalysis: fa, sectorCompetition: null, technical: null, macro: null, eventImpact: null,
    }, 'EREGL', 'ss-1');
    expect(out.convergence_score).toBeGreaterThanOrEqual(-1);
    expect(out.convergence_score).toBeLessThanOrEqual(1);
  });

  it('confidence = high when 8+ signals and |score|≥0.4', () => {
    const bigFa = {
      ...fa,
      highlights: [
        { code: 'GROSS_MARGIN', value: 15 },
        { code: 'EBITDA_MARGIN', value: 10 },
        { code: 'NET_MARGIN', value: 5 },
        { code: 'ROE', value: 8 },
        { code: 'ROA', value: 4 },
        { code: 'ROCE', value: 6 },
        { code: 'ALTMAN_Z', value: 3 },
        { code: 'PIOTROSKI_F', value: 6 },
      ],
    };
    const out = adaptStrategicSynthesisForLegacy({
      financialAnalysis: bigFa, sectorCompetition: null, technical: null, macro: null, eventImpact: null,
    }, 'EREGL', 'ss-1');
    expect(out.confidence).toBe('high');
  });

  it('confidence = low when fewer than 4 signals', () => {
    const tinyFa = { highlights: [{ code: 'NET_MARGIN', value: 3 }], red_flags: [] };
    const out = adaptStrategicSynthesisForLegacy({
      financialAnalysis: tinyFa, sectorCompetition: null, technical: null, macro: null, eventImpact: null,
    }, 'X', 'ss-1');
    expect(out.confidence).toBe('low');
  });

  it('detects source-level divergence (e.g. peer says +X and -X)', () => {
    const sc = { strengths: ['ROE'], weaknesses: ['GROSS_MARGIN'] };
    const out = adaptStrategicSynthesisForLegacy({
      financialAnalysis: fa, sectorCompetition: sc, technical: null, macro: null, eventImpact: null,
    }, 'EREGL', 'ss-1');
    expect(out.divergences.some(d => d.includes('peer'))).toBe(true);
  });

  it('returns empty bucket + warning when fa is null', () => {
    const out = adaptStrategicSynthesisForLegacy({
      financialAnalysis: null, sectorCompetition: null, technical: null, macro: null, eventImpact: null,
    }, 'X', 'ss-1');
    expect(out.signals.positive.length).toBe(0);
    expect(out.signals.negative.length).toBe(0);
    expect(out.warnings[0]).toContain('financial_analysis');
  });

  it('tags output as source=python', () => {
    const out = adaptStrategicSynthesisForLegacy({
      financialAnalysis: fa, sectorCompetition: null, technical: null, macro: null, eventImpact: null,
    }, 'EREGL', 'ss-1');
    expect(out.source).toBe('python');
  });
});
