/**
 * P1D Wave 1 — fact ownership lookup tests.
 */
import { describe, expect, it } from 'vitest';
import {
  loadOwnershipRules,
  findOwnershipRule,
  checkOwnership,
} from './ownership.js';

describe('ownership — loadOwnershipRules', () => {
  it('loads non-empty rule set with prefix + owner + exception_owners shape', () => {
    const rules = loadOwnershipRules();
    expect(rules.length).toBeGreaterThan(0);
    for (const r of rules) {
      expect(typeof r.prefix).toBe('string');
      expect(typeof r.owner).toBe('string');
      expect(Array.isArray(r.exception_owners)).toBe(true);
    }
  });
});

describe('ownership — findOwnershipRule', () => {
  it('matches plain fact_key against the registered prefix', () => {
    const rule = findOwnershipRule('revenue');
    expect(rule?.owner).toBe('parse_standardization');
  });

  it('matches period-suffixed fact_key by stripping the suffix', () => {
    expect(findOwnershipRule('revenue_fy2025')?.owner).toBe('parse_standardization');
    expect(findOwnershipRule('roe_fy2025')?.owner).toBe('financial_analysis');
    expect(findOwnershipRule('rsi_14')?.owner).toBe('technical_analysis');
  });

  it('returns null for unknown fact_key', () => {
    expect(findOwnershipRule('mystery_metric_xyz')).toBeNull();
  });
});

describe('ownership — checkOwnership action matrix', () => {
  it('primary owner → action=accept', () => {
    const r = checkOwnership('revenue_fy2025', 'parse_standardization');
    expect(r.is_primary).toBe(true);
    expect(r.action).toBe('accept');
  });

  it('exception owner → action=arbitration_required', () => {
    const r = checkOwnership('revenue_fy2025', 'financial_analysis');
    expect(r.is_primary).toBe(false);
    expect(r.is_exception).toBe(true);
    expect(r.action).toBe('arbitration_required');
  });

  it('non-primary, non-exception → action=reject', () => {
    const r = checkOwnership('revenue_fy2025', 'mystery_agent');
    expect(r.is_primary).toBe(false);
    expect(r.is_exception).toBe(false);
    expect(r.action).toBe('reject');
  });

  it('unowned fact_key → action=arbitration_required', () => {
    const r = checkOwnership('unowned_metric', 'any_agent');
    expect(r.primary_owner).toBe('unowned');
    expect(r.action).toBe('arbitration_required');
  });

  it('macro / technical primary owners verified', () => {
    expect(checkOwnership('tcmb_policy_rate', 'macro_analysis').action).toBe('accept');
    expect(checkOwnership('rsi_14', 'technical_analysis').action).toBe('accept');
  });
});
