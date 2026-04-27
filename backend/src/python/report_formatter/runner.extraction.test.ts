/**
 * Runner extraction verification (P4.beta.3 mandatory addition #4).
 *
 * Confirms that fa_red_flags array, fa_critical_flag_count, macro structured
 * fields, and technical fields ACTUALLY flow from accumulatedContext into
 * SanitizeOptions. Without this test the sanitizer would still pass on
 * synthetic fixtures while a live run silently fails to rewrite the
 * critical_finding conflict.
 */

import { describe, it, expect } from 'vitest';
import { buildSanitizeOptions } from './runner.js';

describe('runner.buildSanitizeOptions — fa_red_flags extraction', () => {
  it('extracts fa_red_flags array from financial_analysis_output (object form)', () => {
    const ctx: Record<string, unknown> = {
      financial_analysis_output: {
        confidence: 'low',
        critical_flag_count: 1,
        red_flags: [
          { severity: 'critical', code: 'OVERLEVERAGED' },
          { severity: 'warn', code: 'LIQUIDITY_TIGHT' },
          { severity: 'warn', code: 'INTEREST_COVERAGE_LOW' },
          { severity: 'warn', code: 'PIOTROSKI_WEAK' },
          { severity: 'info', code: 'HOLDING_DUAL_STREAM' },
        ],
      },
    };
    const opts = buildSanitizeOptions('KCHOL', ctx);
    expect(Array.isArray(opts.fa_red_flags)).toBe(true);
    expect(opts.fa_red_flags?.length).toBe(5);
    const codes = opts.fa_red_flags?.map((f: any) => f.code) ?? [];
    expect(codes).toContain('OVERLEVERAGED');
    expect(codes).toContain('LIQUIDITY_TIGHT');
  });

  it('extracts fa_red_flags from JSON-string financial_analysis_output', () => {
    const ctx: Record<string, unknown> = {
      financial_analysis_output: JSON.stringify({
        red_flags: [
          { severity: 'critical', code: 'OVERLEVERAGED' },
          { severity: 'warn', code: 'LIQUIDITY_TIGHT' },
        ],
      }),
    };
    const opts = buildSanitizeOptions('KCHOL', ctx);
    expect(Array.isArray(opts.fa_red_flags)).toBe(true);
    expect(opts.fa_red_flags?.length).toBe(2);
  });

  it('returns null fa_red_flags when financial_analysis_output is missing', () => {
    const ctx: Record<string, unknown> = {};
    const opts = buildSanitizeOptions('KCHOL', ctx);
    expect(opts.fa_red_flags).toBeNull();
  });

  it('returns null fa_red_flags when red_flags is not an array', () => {
    const ctx: Record<string, unknown> = {
      financial_analysis_output: { confidence: 'low', red_flags: 'not_an_array' },
    };
    const opts = buildSanitizeOptions('KCHOL', ctx);
    expect(opts.fa_red_flags).toBeNull();
  });

  it('extracts fa_critical_flag_count from canonical numeric field', () => {
    const ctx: Record<string, unknown> = {
      financial_analysis_output: { critical_flag_count: 1 },
    };
    const opts = buildSanitizeOptions('KCHOL', ctx);
    expect(opts.fa_critical_flag_count).toBe(1);
  });

  it('extracts macro structured fields with as_of preservation', () => {
    const ctx: Record<string, unknown> = {
      macro_analysis_output: {
        rates: { tcmb_policy_rate: 50, usd_try: 44.93, eur_try: 52.55 },
        inflation: { cpi_yoy: 38.5 },
        as_of: '2026-04-27',
      },
    };
    const opts = buildSanitizeOptions('KCHOL', ctx);
    expect(opts.macro?.tcmb_policy_rate).toBe(50);
    expect(opts.macro?.cpi_yoy).toBe(38.5);
    expect(opts.macro?.usd_try).toBe(44.93);
    expect(opts.macro?.as_of).toBe('2026-04-27');
  });

  it('extracts technical structured fields', () => {
    const ctx: Record<string, unknown> = {
      technical_analysis_output: {
        trend: 'bullish',
        rsi: 57.4,
        volume_data_available: false,
      },
    };
    const opts = buildSanitizeOptions('KCHOL', ctx);
    expect(opts.technical?.trend).toBe('bullish');
    expect(opts.technical?.rsi).toBe(57.4);
    expect(opts.technical?.volume_data_available).toBe(false);
  });

  it('extracts truth_assertions classification flags', () => {
    const ctx: Record<string, unknown> = {
      truth_assertions: {
        classification: {
          sector_canonical: 'holding',
          is_holding: true,
          is_banking: false,
        },
        valuation_methodology: {
          primary_method: 'val_sotp',
        },
      },
    };
    const opts = buildSanitizeOptions('KCHOL', ctx);
    expect(opts.sector_canonical).toBe('holding');
    expect(opts.is_holding).toBe(true);
    expect(opts.is_banking).toBe(false);
    expect(opts.primary_method).toBe('val_sotp');
  });

  it('does NOT mutate accumulatedContext', () => {
    const ctx: Record<string, unknown> = {
      financial_analysis_output: { red_flags: [{ severity: 'critical' }] },
      macro_analysis_output: { rates: { usd_try: 44.93 } },
    };
    const beforeKeys = Object.keys(ctx).sort();
    const beforeFa = ctx['financial_analysis_output'];
    const beforeMacro = ctx['macro_analysis_output'];
    buildSanitizeOptions('KCHOL', ctx);
    expect(Object.keys(ctx).sort()).toEqual(beforeKeys);
    expect(ctx['financial_analysis_output']).toBe(beforeFa);
    expect(ctx['macro_analysis_output']).toBe(beforeMacro);
  });
});

describe('runner.buildSanitizeOptions — KCHOL realistic flow', () => {
  it('full KCHOL accumulatedContext shape produces all expected fields', () => {
    const ctx: Record<string, unknown> = {
      truth_assertions: {
        classification: { sector_canonical: 'holding', is_holding: true, is_banking: true },
        valuation_methodology: { primary_method: 'val_sotp' },
      },
      financial_analysis_output: JSON.stringify({
        confidence: 'low',
        critical_flag_count: 1,
        red_flags: [
          { severity: 'critical', code: 'OVERLEVERAGED' },
          { severity: 'warn', code: 'LIQUIDITY_TIGHT' },
          { severity: 'warn', code: 'INTEREST_COVERAGE_LOW' },
          { severity: 'warn', code: 'PIOTROSKI_WEAK' },
          { severity: 'info', code: 'HOLDING_DUAL_STREAM' },
        ],
        canonical_numbers: { net_debt: 996438000000, net_debt_to_ebitda: 5.1898, current_ratio: 0.8719 },
      }),
      macro_analysis_output: JSON.stringify({
        rates: { usd_try: 44.93, eur_try: 52.55 },
      }),
      technical_analysis_output: JSON.stringify({
        trend: 'bullish', rsi: 57.4, volume_data_available: false,
      }),
      valuation_agent_output: JSON.stringify({ primary_method: 'val_sotp' }),
    };
    const opts = buildSanitizeOptions('KCHOL', ctx);

    // Must propagate fa_red_flags so critical_finding_resolver can rewrite
    expect(opts.fa_red_flags).not.toBeNull();
    expect(opts.fa_red_flags?.length).toBe(5);
    expect(opts.fa_red_flags?.filter((f: any) => f.severity === 'critical').length).toBe(1);
    expect(opts.fa_red_flags?.filter((f: any) => f.severity === 'warn').length).toBe(3);
    expect(opts.fa_red_flags?.filter((f: any) => f.severity === 'info').length).toBe(1);

    // Other fields propagated
    expect(opts.fa_critical_flag_count).toBe(1);
    expect(opts.is_holding).toBe(true);
    expect(opts.is_banking).toBe(true);
    expect(opts.primary_method).toBe('val_sotp');
    expect(opts.macro?.usd_try).toBe(44.93);
    expect(opts.technical?.rsi).toBe(57.4);
  });
});
