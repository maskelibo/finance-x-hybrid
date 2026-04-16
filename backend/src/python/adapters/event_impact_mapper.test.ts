import { describe, expect, it } from 'vitest';

import {
  adaptClassifiedToImpacts,
  extractClassifiedEventsFromUpstream,
} from './event_impact_mapper.js';


describe('extractClassifiedEventsFromUpstream', () => {
  it('finds classified_events[] from Python event_classification adapter output', () => {
    const upstream = {
      classified_events: [
        { disclosure_id: '1', title: 't', url: 'u', primary_type: 'dividend', classification_confidence: 'high' },
      ],
    };
    expect(extractClassifiedEventsFromUpstream(upstream).length).toBe(1);
  });

  it('finds events[] from legacy LLM shape', () => {
    const upstream = {
      events: [{ disclosure_id: '1', title: 't', primary_type: 'new_contract', classification_confidence: 'medium' }],
    };
    expect(extractClassifiedEventsFromUpstream(upstream).length).toBe(1);
  });

  it('accepts JSON string', () => {
    const upstream = JSON.stringify({
      classified_events: [{ disclosure_id: '1', title: 't', primary_type: 'buyback', classification_confidence: 'high' }],
    });
    expect(extractClassifiedEventsFromUpstream(upstream).length).toBe(1);
  });

  it('returns empty on garbage', () => {
    expect(extractClassifiedEventsFromUpstream('nope')).toEqual([]);
    expect(extractClassifiedEventsFromUpstream(null)).toEqual([]);
    expect(extractClassifiedEventsFromUpstream({})).toEqual([]);
  });
});


describe('adaptClassifiedToImpacts', () => {
  const classified = [
    { disclosure_id: 'k-1', title: 'Temettü dağıtımı', primary_type: 'dividend', classification_confidence: 'high', url: 'https://kap/1' },
    { disclosure_id: 'k-2', title: 'Yeni sözleşme', primary_type: 'new_contract', classification_confidence: 'medium', url: 'https://kap/2' },
    { disclosure_id: 'k-3', title: 'Sıradan duyuru', primary_type: 'other', classification_confidence: 'low' },
    { disclosure_id: 'k-4', title: 'Yönetim değişikliği', primary_type: 'management_change', classification_confidence: 'medium' },
  ];

  it('routes dividend to CF+BS with negative direction', () => {
    const out = adaptClassifiedToImpacts(classified, 'TUPRS', 'eim-1');
    const dividend = out.event_impacts.find(e => e.event_type === 'dividend');
    expect(dividend?.affected_statements).toEqual(['CF', 'BS']);
    expect(dividend?.impact_direction).toBe('negative');
    expect(dividend?.timing_horizon).toBe('immediate');
    expect(dividend?.affected_line_items).toContain('dividends_paid');
  });

  it('routes new_contract to P&L with positive direction', () => {
    const out = adaptClassifiedToImpacts(classified, 'TUPRS', 'eim-1');
    const contract = out.event_impacts.find(e => e.event_type === 'new_contract');
    expect(contract?.affected_statements).toEqual(['P&L']);
    expect(contract?.impact_direction).toBe('positive');
  });

  it('counts routine filings separately (primary_type=other)', () => {
    const out = adaptClassifiedToImpacts(classified, 'TUPRS', 'eim-1');
    // only "other" is routine (empty affected_statements fallback); management_change still has P&L stmt
    expect(out.routine_filings_noted).toBe(1);
    expect(out.events_requiring_full_mapping).toBe(3);
  });

  it('maps confidence → effect_type (high→confirmed, medium→plausible, low→speculative)', () => {
    const out = adaptClassifiedToImpacts(classified, 'TUPRS', 'eim-1');
    expect(out.event_impacts.find(e => e.disclosure_reference === 'k-1')?.effect_type).toBe('confirmed');
    expect(out.event_impacts.find(e => e.disclosure_reference === 'k-2')?.effect_type).toBe('plausible');
    expect(out.event_impacts.find(e => e.disclosure_reference === 'k-3')?.effect_type).toBe('speculative');
  });

  it('uppercases ticker', () => {
    const out = adaptClassifiedToImpacts(classified, 'tuprs', 'eim-1');
    expect(out.company.ticker).toBe('TUPRS');
  });

  it('warns when zero quantitative impact figures are present', () => {
    const out = adaptClassifiedToImpacts(classified, 'TUPRS', 'eim-1');
    expect(out.warnings.some(w => w.includes('quantitative_impact_try'))).toBe(true);
  });

  it('emits quantification_estimate when upstream carries a TRY figure', () => {
    const withQuant = [
      { disclosure_id: 'k-dq', title: 'Büyük temettü', primary_type: 'dividend', classification_confidence: 'high', quantitative_impact_try: 29_300_000_000 },
    ];
    const out = adaptClassifiedToImpacts(withQuant, 'TUPRS', 'eim-1');
    expect(out.event_impacts[0].quantification_possible).toBe(true);
    expect(out.event_impacts[0].quantification_estimate?.total_try).toBe(29_300_000_000);
  });

  it('falls back to other template for unknown event types', () => {
    const weird = [{ disclosure_id: 'w-1', title: 'x', primary_type: 'nonexistent_type', classification_confidence: 'high' }];
    const out = adaptClassifiedToImpacts(weird, 'X', 'eim-1');
    expect(out.event_impacts[0].affected_statements).toEqual(['P&L']);
    expect(out.event_impacts[0].impact_direction).toBe('uncertain');
  });

  it('returns low overall confidence with empty event list', () => {
    const out = adaptClassifiedToImpacts([], 'X', 'eim-1');
    expect(out.confidence_overall).toBe('low');
    expect(out.events_processed).toBe(0);
    expect(out.warnings.length).toBeGreaterThan(0);
  });

  it('tags output as source=python', () => {
    const out = adaptClassifiedToImpacts(classified, 'T', 'eim-1');
    expect(out.source).toBe('python');
  });
});
