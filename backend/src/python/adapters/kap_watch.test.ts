import { describe, expect, it } from 'vitest';

import {
  adaptPythonKapForLegacy,
  type PythonKapEvents,
} from './kap_watch.js';


const sample: PythonKapEvents = {
  events: [
    {
      disclosure_id: '1355133',
      ticker: 'KCHOL',
      announced_at: '2024-11-07T18:17:50+00:00',
      title: 'Finansal Rapor',
      url: 'https://kap.org.tr/tr/Bildirim/1355133',
      category: 'FR',
      subcategory: 'ODA',
      summary: null,
      event_type: 'material_event',
      classification_confidence: 'high',
      is_material: true,
    },
    {
      disclosure_id: '1355177',
      ticker: 'KCHOL',
      announced_at: '2024-11-07T18:25:41+00:00',
      title: 'Özel Durum Açıklaması',
      url: 'https://kap.org.tr/tr/Bildirim/1355177',
      category: 'ODA',
      event_type: 'other',
      classification_confidence: 'low',
      is_material: false,
    },
  ],
  window_start: '2024-10-01T00:00:00+00:00',
  window_end: '2024-12-31T00:00:00+00:00',
};


describe('adaptPythonKapForLegacy', () => {
  it('flattens events into disclosure_inventory', () => {
    const legacy = adaptPythonKapForLegacy(sample, 'kchol', 'kap-1');
    expect(legacy.disclosure_inventory.length).toBe(2);
    expect(legacy.disclosure_count).toBe(2);
  });

  it('uppercases ticker', () => {
    const legacy = adaptPythonKapForLegacy(sample, 'kchol', 'kap-1');
    expect(legacy.ticker).toBe('KCHOL');
    expect(legacy.disclosure_inventory[0].ticker).toBe('KCHOL');
  });

  it('counts material disclosures', () => {
    const legacy = adaptPythonKapForLegacy(sample, 'KCHOL', 'kap-1');
    expect(legacy.material_count).toBe(1);
  });

  it('preserves event_type and confidence as classifier hints', () => {
    const legacy = adaptPythonKapForLegacy(sample, 'KCHOL', 'kap-1');
    expect(legacy.disclosure_inventory[0].event_type_hint).toBe('material_event');
    expect(legacy.disclosure_inventory[0].confidence_hint).toBe('high');
    expect(legacy.disclosure_inventory[1].confidence_hint).toBe('low');
  });

  it('reports monitoring_window from Python payload', () => {
    const legacy = adaptPythonKapForLegacy(sample, 'KCHOL', 'kap-1');
    expect(legacy.monitoring_window.start).toBe('2024-10-01T00:00:00+00:00');
    expect(legacy.monitoring_window.end).toBe('2024-12-31T00:00:00+00:00');
  });

  it('emits warning when disclosure list is empty', () => {
    const legacy = adaptPythonKapForLegacy({ events: [] }, 'KCHOL', 'kap-1');
    expect(legacy.warnings.length).toBeGreaterThan(0);
    expect(legacy.warnings[0]).toContain('KAP');
  });

  it('handles missing optional fields gracefully', () => {
    const minimal: PythonKapEvents = {
      events: [{
        disclosure_id: 'X',
        ticker: 'T',
        announced_at: '2024-01-01T00:00:00Z',
        title: 'Title',
        url: 'https://example.com',
      }],
    };
    const legacy = adaptPythonKapForLegacy(minimal, 'T', 'kap-1');
    expect(legacy.disclosure_inventory[0].event_type_hint).toBeNull();
    expect(legacy.disclosure_inventory[0].is_material).toBeNull();
  });
});
