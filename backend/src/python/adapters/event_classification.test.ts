import { describe, expect, it } from 'vitest';

import {
  adaptDisclosuresToClassification,
  extractDisclosuresFromUpstream,
} from './event_classification.js';


describe('extractDisclosuresFromUpstream', () => {
  it('finds disclosure_inventory from Python kap_watch output', () => {
    const upstream = { disclosure_inventory: [{ disclosure_id: '1', title: 't', url: 'u' }] };
    expect(extractDisclosuresFromUpstream(upstream).length).toBe(1);
  });

  it('finds events[] from legacy LLM shape', () => {
    const upstream = { events: [{ disclosure_id: '1', title: 't', url: 'u' }] };
    expect(extractDisclosuresFromUpstream(upstream).length).toBe(1);
  });

  it('accepts JSON string', () => {
    const upstream = JSON.stringify({ disclosure_inventory: [{ disclosure_id: '1', title: 't', url: 'u' }] });
    expect(extractDisclosuresFromUpstream(upstream).length).toBe(1);
  });

  it('returns empty on garbage', () => {
    expect(extractDisclosuresFromUpstream('nope')).toEqual([]);
    expect(extractDisclosuresFromUpstream(null)).toEqual([]);
  });
});


describe('adaptDisclosuresToClassification', () => {
  const disclosures = [
    {
      disclosure_id: '1', title: 'Temettü', url: 'u',
      event_type_hint: 'dividend', confidence_hint: 'high', is_material: true,
    },
    {
      disclosure_id: '2', title: 'Yönetim', url: 'u',
      event_type_hint: 'governance', confidence_hint: 'medium', is_material: false,
    },
    {
      disclosure_id: '3', title: 'Duyuru', url: 'u',
      event_type_hint: 'other', confidence_hint: 'low', is_material: null,
    },
  ];

  it('buckets by confidence', () => {
    const out = adaptDisclosuresToClassification(disclosures, 'T', 'ec-1');
    expect(out.high_confidence_count).toBe(1);
    expect(out.medium_confidence_count).toBe(1);
    expect(out.low_confidence_count).toBe(1);
  });

  it('collects unclassified and ambiguous ids', () => {
    const out = adaptDisclosuresToClassification(disclosures, 'T', 'ec-1');
    expect(out.unclassified_list).toContain('3');
    expect(out.ambiguous_list).toContain('2');
  });

  it('uppercases ticker', () => {
    const out = adaptDisclosuresToClassification(disclosures, 'kchol', 'ec-1');
    expect(out.ticker).toBe('KCHOL');
  });

  it('warns when >60% land at LOW confidence', () => {
    const bulkLow = Array.from({ length: 10 }).map((_, i) => ({
      disclosure_id: String(i), title: 't', url: 'u',
      event_type_hint: 'other', confidence_hint: 'low', is_material: null,
    }));
    const out = adaptDisclosuresToClassification(bulkLow, 'T', 'ec-1');
    expect(out.warnings.length).toBeGreaterThan(0);
  });
});
