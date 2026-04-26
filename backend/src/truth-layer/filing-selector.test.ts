import { describe, it, expect } from 'vitest';
import { selectAuthoritativeFiling } from './filing-selector.js';
import type { FilingRecord } from './types.js';

const KAP_1555903_FY2025: FilingRecord = {
  filing_id: 'KAP-1555903',
  document_type: 'konsolide_finansal_rapor',
  filing_date: '2026-02-11',
  period: 'FY2025',
  page_count: 220,
  has_auditor_opinion: true,
  title: 'KCHOL Konsolide Finansal Tablolar FY2025',
  payload_size_bytes: 850_000,
};

const PLACEHOLDER_FY2026: FilingRecord = {
  filing_id: 'KAP-1572100',
  document_type: 'ozel_durum_aciklamasi',
  filing_date: '2026-04-15',
  period: 'FY2026',
  page_count: 2,
  has_auditor_opinion: false,
  title: 'Özel Durum Açıklaması — Yönetim Kurulu Bildirimi',
  payload_size_bytes: 450,
};

const FAALIYET_RAPORU_FY2025: FilingRecord = {
  filing_id: 'KAP-1561073',
  document_type: 'faaliyet_raporu',
  filing_date: '2026-02-24',
  period: 'FY2025',
  page_count: 180,
  has_auditor_opinion: false,
  title: 'KCHOL FY2025 Faaliyet Raporu',
  payload_size_bytes: 600_000,
};

const Q3_INTERIM_2025: FilingRecord = {
  filing_id: 'KAP-1530000',
  document_type: 'q3_finansal',
  filing_date: '2025-11-10',
  period: 'Q3-2025',
  page_count: 95,
  has_auditor_opinion: true,
  payload_size_bytes: 320_000,
};

describe('truth-layer filing-selector', () => {
  it('picks consolidated annual over placeholder material disclosure (KCHOL bug fix)', () => {
    const sel = selectAuthoritativeFiling('KCHOL', [
      PLACEHOLDER_FY2026,
      KAP_1555903_FY2025,
      FAALIYET_RAPORU_FY2025,
    ]);
    expect(sel.selected?.filing_id).toBe('KAP-1555903');
    expect(sel.rejected.find((r) => r.filing.filing_id === 'KAP-1572100')).toBeDefined();
    expect(sel.rejected[0].reason.toLowerCase()).toContain('placeholder');
    expect(sel.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('picks consolidated annual over interim financials', () => {
    const sel = selectAuthoritativeFiling('TEST', [
      Q3_INTERIM_2025,
      KAP_1555903_FY2025,
    ]);
    expect(sel.selected?.filing_id).toBe('KAP-1555903');
  });

  it('returns null selected when only placeholders are provided', () => {
    const onlyPlaceholders = [
      PLACEHOLDER_FY2026,
      { ...PLACEHOLDER_FY2026, filing_id: 'KAP-X', filing_date: '2026-01-01' },
    ];
    const sel = selectAuthoritativeFiling('TEST', onlyPlaceholders);
    expect(sel.selected).toBeNull();
    expect(sel.confidence).toBe(0);
    expect(sel.rejected.length).toBe(2);
  });

  it('rejects too-short non-placeholder filings (e.g., 3-page faaliyet_raporu)', () => {
    const sel = selectAuthoritativeFiling('TEST', [
      { ...FAALIYET_RAPORU_FY2025, page_count: 3, filing_id: 'KAP-SHORT' },
      KAP_1555903_FY2025,
    ]);
    expect(sel.selected?.filing_id).toBe('KAP-1555903');
    expect(sel.rejected.find((r) => r.filing.filing_id === 'KAP-SHORT')).toBeDefined();
  });

  it('reasoning mentions selected filing id and rejection count', () => {
    const sel = selectAuthoritativeFiling('KCHOL', [
      PLACEHOLDER_FY2026,
      KAP_1555903_FY2025,
    ]);
    expect(sel.reasoning).toContain('KAP-1555903');
    expect(sel.reasoning).toContain('rejected');
  });

  it('breaks ties by recency when scores are equal', () => {
    const olderAnnual: FilingRecord = { ...KAP_1555903_FY2025, filing_id: 'KAP-OLD', filing_date: '2024-02-11' };
    const newerAnnual: FilingRecord = { ...KAP_1555903_FY2025, filing_id: 'KAP-NEW', filing_date: '2026-02-11' };
    const sel = selectAuthoritativeFiling('TEST', [olderAnnual, newerAnnual]);
    expect(sel.selected?.filing_id).toBe('KAP-NEW');
  });

  it('confidence drops when runner-up has close score', () => {
    const sel = selectAuthoritativeFiling('TEST', [
      KAP_1555903_FY2025,
      FAALIYET_RAPORU_FY2025, // type 80 vs 100, close after auditor bonus
    ]);
    expect(sel.confidence).toBeGreaterThan(0);
    expect(sel.confidence).toBeLessThanOrEqual(1.0);
  });
});
