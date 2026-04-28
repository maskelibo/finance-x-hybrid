/**
 * Pre-Core-4 Phase D — SOTP loader unit tests.
 */

import { describe, expect, it } from 'vitest';

import { holdingSotpGatePass, loadSotp } from './sotp-loader.js';

describe('sotp-loader — KCHOL', () => {
  it('loads KCHOL SOTP YAML with all required fields', () => {
    const data = loadSotp('KCHOL');
    expect(data).not.toBeNull();
    expect(data!.ticker).toBe('KCHOL');
    expect(data!.verification_status).toBe('auto_curated_pending_operator_review');
    expect(data!.shares_outstanding_mn).toBeGreaterThan(0);
    expect(data!.holding_discount_pct).toBeGreaterThan(0);
    expect(data!.listed_subsidiaries.length).toBeGreaterThan(0);
  });

  it('computes gross/net/adjusted NAV consistently', () => {
    const data = loadSotp('KCHOL');
    expect(data).not.toBeNull();
    const c = data!.computed;
    expect(c.gross_nav_try).toBeGreaterThan(0);
    expect(c.net_nav_try).toBeCloseTo(c.gross_nav_try - data!.holding_net_debt_try, -3);
    const expectedAdj = c.net_nav_try * (1 - data!.holding_discount_pct / 100);
    expect(c.adjusted_nav_try).toBeCloseTo(expectedAdj, -3);
  });

  it('computes per-share NAV from adjusted NAV / shares', () => {
    const data = loadSotp('KCHOL');
    expect(data).not.toBeNull();
    const c = data!.computed;
    const sharesAbs = data!.shares_outstanding_mn * 1_000_000;
    expect(c.per_share_nav_try).toBeCloseTo(c.adjusted_nav_try / sharesAbs, 2);
    expect(c.per_share_nav_try).toBeGreaterThan(0);
  });

  it('counts subsidiaries (listed + private)', () => {
    const data = loadSotp('KCHOL');
    expect(data!.computed.listed_count).toBe(data!.listed_subsidiaries.length);
    expect(data!.computed.private_count).toBe(data!.private_subsidiaries.length);
    expect(data!.computed.total_subsidiary_count).toBe(
      data!.listed_subsidiaries.length + data!.private_subsidiaries.length,
    );
  });

  it('returns null for unknown ticker', () => {
    expect(loadSotp('NONEXIST')).toBeNull();
  });

  it('uppercases ticker on lookup', () => {
    const data = loadSotp('kchol');
    expect(data).not.toBeNull();
    expect(data!.ticker).toBe('KCHOL');
  });

  it('age_days is non-negative', () => {
    const data = loadSotp('KCHOL');
    expect(data!.age_days).toBeGreaterThanOrEqual(0);
  });
});

describe('holdingSotpGatePass — Phase D hard gate', () => {
  it('passes trivially for non-holding sectors', () => {
    const r = holdingSotpGatePass('EREGL', 'industrial');
    expect(r.pass).toBe(true);
    expect(r.data).toBeNull();
  });

  it('passes for non-holding even when ticker is unknown', () => {
    const r = holdingSotpGatePass('XXXXX', 'banking');
    expect(r.pass).toBe(true);
  });

  it('passes for KCHOL holding (curated SOTP YAML present, ≥3 subs)', () => {
    const r = holdingSotpGatePass('KCHOL', 'holding');
    expect(r.pass).toBe(true);
    expect(r.data).not.toBeNull();
    expect(r.data!.computed.total_subsidiary_count).toBeGreaterThanOrEqual(3);
  });

  it('FAILS for holding ticker without SOTP YAML', () => {
    const r = holdingSotpGatePass('NOSOTP', 'holding');
    expect(r.pass).toBe(false);
    expect(r.data).toBeNull();
    expect(r.reason).toMatch(/no SOTP YAML/i);
  });

  it('case-insensitive sector match', () => {
    const r = holdingSotpGatePass('KCHOL', 'HOLDING');
    expect(r.pass).toBe(true);
  });
});

describe('sotp-loader — listed subsidiary integrity', () => {
  it('every listed subsidiary has a ticker and a positive market cap', () => {
    const data = loadSotp('KCHOL');
    for (const s of data!.listed_subsidiaries) {
      expect(s.ticker).toMatch(/^[A-Z]+$/);
      expect(s.market_cap_try).toBeGreaterThan(0);
      expect(s.koc_effective_share_try).toBeGreaterThan(0);
      expect(s.stake_pct).toBeGreaterThan(0);
    }
  });

  it('koc_effective_share_try roughly equals market_cap × stake (within 1%)', () => {
    const data = loadSotp('KCHOL');
    for (const s of data!.listed_subsidiaries) {
      const expected = s.market_cap_try * (s.stake_pct / 100);
      const diff = Math.abs(s.koc_effective_share_try - expected) / expected;
      expect(diff).toBeLessThan(0.01);
    }
  });
});
