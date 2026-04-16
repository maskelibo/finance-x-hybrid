import { describe, expect, it } from 'vitest';

import {
  adaptPythonDataCollectionForLegacy,
  type PythonDataCollectionManifest,
} from './data_collection.js';


const doc = (kind: string, year: number, idx: string) => ({
  kind,
  disclosure_index: idx,
  title: `${kind} ${year}`,
  published_at: `${year}-11-07T18:00:00+00:00`,
  source_url: `https://kap.org.tr/tr/Bildirim/${idx}`,
  local_path: `/tmp/KCHOL_${kind}_${year}.pdf`,
  content_sha256: 'a'.repeat(64),
  size_bytes: 200_000,
  year,
  period_label: `FY${year}`,
});


const sample: PythonDataCollectionManifest = {
  ticker: 'KCHOL',
  collected_at: '2026-04-16T20:00:00+00:00',
  since: '2019-04-16',
  until: '2026-04-16',
  documents: [
    doc('financial_report', 2020, '100'),
    doc('financial_report', 2021, '101'),
    doc('activity_report', 2021, '102'),
    doc('financial_report', 2022, '103'),
    doc('financial_report', 2023, '104'),
    doc('financial_report', 2024, '105'),
    doc('activity_report', 2024, '106'),
  ],
  errors: [],
  warnings: [],
};


describe('adaptPythonDataCollectionForLegacy', () => {
  it('splits documents into financial/activity/other', () => {
    const legacy = adaptPythonDataCollectionForLegacy(sample, 'dc-1');
    expect(legacy.data_manifest.financial_reports.length).toBe(5);
    expect(legacy.data_manifest.activity_reports.length).toBe(2);
    expect(legacy.data_manifest.other.length).toBe(0);
  });

  it('flags five_year_coverage true with ≥5 distinct years', () => {
    const legacy = adaptPythonDataCollectionForLegacy(sample, 'dc-1');
    expect(legacy.quality.five_year_coverage).toBe(true);
  });

  it('flags five_year_coverage false on insufficient history', () => {
    const short: PythonDataCollectionManifest = {
      ...sample,
      documents: sample.documents!.slice(0, 2),   // only 2 years
    };
    const legacy = adaptPythonDataCollectionForLegacy(short, 'dc-1');
    expect(legacy.quality.five_year_coverage).toBe(false);
  });

  it('maps disclosure_index to disclosure_id (legacy field name)', () => {
    const legacy = adaptPythonDataCollectionForLegacy(sample, 'dc-1');
    expect(legacy.data_manifest.financial_reports[0].disclosure_id).toBe('100');
  });

  it('preserves period labels and content hash', () => {
    const legacy = adaptPythonDataCollectionForLegacy(sample, 'dc-1');
    const first = legacy.data_manifest.financial_reports[0];
    expect(first.period_label).toBe('FY2020');
    expect(first.content_sha256.length).toBe(64);
  });

  it('returns zero counts on empty manifest', () => {
    const empty: PythonDataCollectionManifest = {
      ticker: 'TEST',
      collected_at: 'now',
      since: '2020-01-01',
      until: '2026-01-01',
      documents: [],
    };
    const legacy = adaptPythonDataCollectionForLegacy(empty, 'dc-1');
    expect(legacy.document_count).toBe(0);
    expect(legacy.quality.has_financials).toBe(false);
    expect(legacy.quality.five_year_coverage).toBe(false);
  });

  it('sets review_status to pending_ceo_review', () => {
    const legacy = adaptPythonDataCollectionForLegacy(sample, 'dc-1');
    expect(legacy.review_status).toBe('pending_ceo_review');
  });
});
