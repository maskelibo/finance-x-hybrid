import { describe, expect, it } from 'vitest';

import {
  adaptPythonReconciliationForLegacy,
  type PythonReconciliationReport,
} from './reconciliation.js';


const allPass: PythonReconciliationReport = {
  ticker: 'KCHOL',
  period_label: 'Q3-2024',
  checks: [
    { code: 'BS_IDENTITY', name: 'A=L+E', passed: true, message: 'ok' },
    { code: 'BS_EQUITY_SPLIT', name: 'P+M', passed: true, message: 'ok' },
    { code: 'IS_GROSS_CHAIN', name: 'chain', passed: true, message: 'skipped: banking' },
  ],
};

const withFailure: PythonReconciliationReport = {
  ticker: 'KCHOL',
  period_label: 'Q3-2024',
  checks: [
    { code: 'BS_IDENTITY', name: 'A=L+E', passed: false, message: 'off by 1B' },
    { code: 'BS_EQUITY_SPLIT', name: 'P+M', passed: true, message: 'ok' },
    { code: 'IS_GROSS_CHAIN', name: 'chain', passed: true, message: 'ok' },
  ],
};


describe('adaptPythonReconciliationForLegacy', () => {
  it('counts passed vs skipped vs failed', () => {
    const legacy = adaptPythonReconciliationForLegacy(allPass, 'KCHOL', 'rec-1');
    expect(legacy.check_count).toBe(3);
    expect(legacy.failed_count).toBe(0);
    expect(legacy.skipped_count).toBeGreaterThanOrEqual(1);
    expect(legacy.overall_decision).toBe('pass');
  });

  it('reports partial when 1–2 checks fail', () => {
    const legacy = adaptPythonReconciliationForLegacy(withFailure, 'KCHOL', 'rec-1');
    expect(legacy.failed_count).toBe(1);
    expect(legacy.overall_decision).toBe('partial');
  });

  it('warns on critical BS_IDENTITY failure', () => {
    const legacy = adaptPythonReconciliationForLegacy(withFailure, 'KCHOL', 'rec-1');
    expect(legacy.warnings.some(w => w.includes('BS_IDENTITY'))).toBe(true);
  });

  it('pass_rate reflects real percentage', () => {
    const legacy = adaptPythonReconciliationForLegacy(withFailure, 'KCHOL', 'rec-1');
    // 2 of 3 passed → 0.6667
    expect(legacy.pass_rate).toBeCloseTo(2 / 3, 3);
  });

  it('preserves period_label and ticker', () => {
    const legacy = adaptPythonReconciliationForLegacy(allPass, 'kchol', 'rec-1');
    expect(legacy.ticker).toBe('KCHOL');
    expect(legacy.period_label).toBe('Q3-2024');
  });

  it('handles empty check list', () => {
    const legacy = adaptPythonReconciliationForLegacy({ checks: [] }, 'T', 'rec-1');
    expect(legacy.check_count).toBe(0);
    expect(legacy.pass_rate).toBe(0);
    expect(legacy.overall_decision).toBe('pass'); // zero failed
  });
});
