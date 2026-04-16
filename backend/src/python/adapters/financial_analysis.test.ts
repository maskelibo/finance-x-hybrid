import { describe, expect, it } from 'vitest';

import {
  adaptPythonFinancialAnalysisForLegacy,
  type PythonFinancialAnalysisOutput,
} from './financial_analysis.js';


const healthy: PythonFinancialAnalysisOutput = {
  ticker: 'KCHOL',
  period_label: 'FY-2023',
  sector: 'holding',
  highlights: [
    { code: 'ROE', label: 'ROE', value: '18.5', unit: '%' },
    { code: 'NET_MARGIN', label: 'Net margin', value: '8.2', unit: '%' },
    { code: 'GROSS_MARGIN', label: 'Gross margin', value: '24.1', unit: '%' },
    { code: 'EBITDA_MARGIN', label: 'EBITDA margin', value: '15.8', unit: '%' },
    { code: 'FCF', label: 'FCF', value: '50000000000', unit: 'TL' },
    { code: 'ALTMAN_Z', label: 'Altman Z', value: '3.2', unit: 'score' },
  ],
  red_flags: [],
  canonical_numbers: { total_assets: '1200000000000', net_income: '90000000000' },
};

const distressed: PythonFinancialAnalysisOutput = {
  ...healthy,
  period_label: 'Q3-2024',
  red_flags: [
    { code: 'NET_LOSS', severity: 'critical', message: 'Net margin negative' },
    { code: 'LIQUIDITY_TIGHT', severity: 'warn', message: 'current_ratio<1' },
  ],
};


describe('adaptPythonFinancialAnalysisForLegacy', () => {
  it('uppercases ticker and copies period/sector', () => {
    const legacy = adaptPythonFinancialAnalysisForLegacy(healthy, 'kchol', 'fa-1');
    expect(legacy.ticker).toBe('KCHOL');
    expect(legacy.period_label).toBe('FY-2023');
    expect(legacy.sector).toBe('holding');
  });

  it('counts metrics and critical flags', () => {
    const legacy = adaptPythonFinancialAnalysisForLegacy(distressed, 'KCHOL', 'fa-1');
    expect(legacy.metric_count).toBe(6);
    expect(legacy.critical_flag_count).toBe(1);
  });

  it('sets confidence high when no flags', () => {
    const legacy = adaptPythonFinancialAnalysisForLegacy(healthy, 'KCHOL', 'fa-1');
    expect(legacy.confidence).toBe('high');
  });

  it('sets confidence low when a critical flag is present', () => {
    const legacy = adaptPythonFinancialAnalysisForLegacy(distressed, 'KCHOL', 'fa-1');
    expect(legacy.confidence).toBe('low');
  });

  it('sets confidence medium on many non-critical flags', () => {
    const many: PythonFinancialAnalysisOutput = {
      ...healthy,
      red_flags: [
        { code: 'A', severity: 'warn', message: 'a' },
        { code: 'B', severity: 'warn', message: 'b' },
        { code: 'C', severity: 'warn', message: 'c' },
      ],
    };
    const legacy = adaptPythonFinancialAnalysisForLegacy(many, 'KCHOL', 'fa-1');
    expect(legacy.confidence).toBe('medium');
  });

  it('warns on sparse metric output', () => {
    const sparse: PythonFinancialAnalysisOutput = {
      ...healthy,
      highlights: [{ code: 'ROE', label: 'ROE', value: '10', unit: '%' }],
    };
    const legacy = adaptPythonFinancialAnalysisForLegacy(sparse, 'KCHOL', 'fa-1');
    expect(legacy.warnings.length).toBeGreaterThan(0);
  });

  it('preserves canonical_numbers pass-through', () => {
    const legacy = adaptPythonFinancialAnalysisForLegacy(healthy, 'KCHOL', 'fa-1');
    expect(legacy.canonical_numbers['total_assets']).toBe('1200000000000');
  });

  it('tolerates missing top-level fields', () => {
    const legacy = adaptPythonFinancialAnalysisForLegacy({}, 'TEST', 'fa-1');
    expect(legacy.period_label).toBe('unknown');
    expect(legacy.sector).toBe('industrial');
    expect(legacy.metric_count).toBe(0);
  });
});
