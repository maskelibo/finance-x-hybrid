import { describe, expect, it } from 'vitest';

import {
  adaptParsedPeriodsForLegacy,
  extractPdfPathsByKind,
  extractPdfPathsFromManifest,
  type PythonPeriodFinancials,
} from './parse_standardization.js';


describe('extractPdfPathsFromManifest', () => {
  it('walks nested structures and finds local_path PDFs', () => {
    const upstream = {
      data_manifest: {
        financial_reports: [
          { disclosure_id: '1', local_path: '/tmp/KCHOL_2024.pdf' },
          { disclosure_id: '2', local_path: '/tmp/KCHOL_2023.pdf' },
        ],
        activity_reports: [{ local_path: '/tmp/KCHOL_activity_2024.pdf' }],
      },
    };
    const paths = extractPdfPathsFromManifest(upstream);
    expect(paths.length).toBe(3);
    expect(paths).toContain('/tmp/KCHOL_2024.pdf');
  });

  it('accepts JSON string upstream payloads', () => {
    const upstream = JSON.stringify({
      data_manifest: { financial_reports: [{ local_path: '/tmp/a.pdf' }] },
    });
    expect(extractPdfPathsFromManifest(upstream)).toEqual(['/tmp/a.pdf']);
  });

  it('returns empty array on garbage', () => {
    expect(extractPdfPathsFromManifest('not json')).toEqual([]);
    expect(extractPdfPathsFromManifest(null)).toEqual([]);
  });

  it('ignores non-PDF file references', () => {
    const upstream = { documents: [{ local_path: '/tmp/something.csv' }] };
    expect(extractPdfPathsFromManifest(upstream)).toEqual([]);
  });

  it('dedupes the same path appearing twice', () => {
    const upstream = {
      a: { local_path: '/tmp/same.pdf' },
      b: { local_path: '/tmp/same.pdf' },
    };
    expect(extractPdfPathsFromManifest(upstream)).toEqual(['/tmp/same.pdf']);
  });

  it('recognises pdf_path and path field-name variants', () => {
    const upstream = {
      x: { pdf_path: '/tmp/x.pdf' },
      y: { path: '/tmp/y.pdf' },
    };
    const paths = extractPdfPathsFromManifest(upstream);
    expect(paths.sort()).toEqual(['/tmp/x.pdf', '/tmp/y.pdf']);
  });
});


describe('extractPdfPathsByKind — Phase I kind-aware extractor', () => {
  const upstream = {
    data_manifest: {
      financial_reports: [
        { kind: 'financial_report', local_path: '/tmp/financial_a.pdf' },
        { kind: 'financial_report', local_path: 'data/historical_pdfs/KCHOL/2021.pdf' },
      ],
      activity_reports: [
        { kind: 'activity_report', local_path: '/tmp/activity_b.pdf' },
      ],
      other: [
        { kind: 'other', local_path: '/tmp/random_c.pdf' },
      ],
    },
  };

  it('returns ONLY financial_report paths regardless of filesystem location', () => {
    const paths = extractPdfPathsByKind(upstream, 'financial_report');
    expect(paths.sort()).toEqual([
      '/tmp/financial_a.pdf',
      'data/historical_pdfs/KCHOL/2021.pdf',
    ].sort());
  });

  it('disk-seeded historical PDFs (kind=financial_report) ARE returned even when path lacks "financial_report" substring', () => {
    const paths = extractPdfPathsByKind(upstream, 'financial_report');
    expect(paths).toContain('data/historical_pdfs/KCHOL/2021.pdf');
  });

  it('returns activity_report paths separately', () => {
    expect(extractPdfPathsByKind(upstream, 'activity_report')).toEqual(['/tmp/activity_b.pdf']);
  });

  it('returns other paths separately', () => {
    expect(extractPdfPathsByKind(upstream, 'other')).toEqual(['/tmp/random_c.pdf']);
  });

  it('rejects entries whose declared kind does not match the array key', () => {
    const mixed = {
      data_manifest: {
        financial_reports: [
          { kind: 'activity_report', local_path: '/tmp/wrong_kind.pdf' },
          { kind: 'financial_report', local_path: '/tmp/correct.pdf' },
        ],
      },
    };
    expect(extractPdfPathsByKind(mixed, 'financial_report')).toEqual(['/tmp/correct.pdf']);
  });

  it('returns [] when manifest has no data_manifest', () => {
    expect(extractPdfPathsByKind({}, 'financial_report')).toEqual([]);
    expect(extractPdfPathsByKind('not json', 'financial_report')).toEqual([]);
    expect(extractPdfPathsByKind(null, 'financial_report')).toEqual([]);
  });
});


describe('adaptParsedPeriodsForLegacy', () => {
  const periods: PythonPeriodFinancials[] = [
    {
      period: 'FY',
      year: 2020,
      currency: 'TRY',
      balance_sheet: { total_assets: '1000' },
      income_statement: { revenue: '500' },
      cash_flow: { operating_cash_flow: '100' },
    },
    {
      period: 'FY',
      year: 2021,
      currency: 'TRY',
      balance_sheet: { total_assets: '1100' },
      income_statement: { revenue: '550' },
      cash_flow: { operating_cash_flow: '110' },
    },
    {
      period: 'FY',
      year: 2022,
      currency: 'TRY',
      balance_sheet: { total_assets: '1200' },
      income_statement: { revenue: '600' },
      cash_flow: { operating_cash_flow: '120' },
    },
    {
      period: 'FY',
      year: 2023,
      currency: 'TRY',
      balance_sheet: { total_assets: '1300' },
      income_statement: { revenue: '650' },
      cash_flow: { operating_cash_flow: '130' },
    },
    {
      period: 'Q3',
      year: 2024,
      currency: 'TRY',
      balance_sheet: { total_assets: '1400' },
      income_statement: { revenue: '500' },
      cash_flow: { operating_cash_flow: '80' },
    },
  ];

  const bundled = periods.map((p, i) => ({ pdf: `/tmp/p${i}.pdf`, parsed: p }));

  it('maps periods into standardized_statements entries', () => {
    const legacy = adaptParsedPeriodsForLegacy(bundled, 'kchol', 'ps-1');
    expect(legacy.standardized_statements.length).toBe(5);
    expect(legacy.standardized_statements[0].period_label).toBe('FY-2020');
    expect(legacy.standardized_statements[0].source_pdf).toBe('/tmp/p0.pdf');
  });

  it('confirms five-year coverage when ≥5 distinct years', () => {
    const legacy = adaptParsedPeriodsForLegacy(bundled, 'KCHOL', 'ps-1');
    expect(legacy.auto_checks.five_year_coverage).toBe(true);
  });

  it('flags auto_checks has_balance_sheet / has_income_statement', () => {
    const legacy = adaptParsedPeriodsForLegacy(bundled, 'KCHOL', 'ps-1');
    expect(legacy.auto_checks.has_balance_sheet).toBe(true);
    expect(legacy.auto_checks.has_income_statement).toBe(true);
    expect(legacy.auto_checks.has_cash_flow).toBe(true);
  });

  it('emits warning when cash flow is missing', () => {
    const noCf: PythonPeriodFinancials[] = periods.map(p => ({ ...p, cash_flow: null }));
    const legacy = adaptParsedPeriodsForLegacy(
      noCf.map((p, i) => ({ pdf: `/tmp/p${i}.pdf`, parsed: p })),
      'KCHOL',
      'ps-1',
    );
    expect(legacy.warnings.some(w => w.includes('cash-flow'))).toBe(true);
  });

  it('emits short-history warning when <5 years', () => {
    const short = bundled.slice(0, 2);
    const legacy = adaptParsedPeriodsForLegacy(short, 'KCHOL', 'ps-1');
    expect(legacy.warnings.some(w => w.includes('distinct'))).toBe(true);
    expect(legacy.auto_checks.five_year_coverage).toBe(false);
  });
});
