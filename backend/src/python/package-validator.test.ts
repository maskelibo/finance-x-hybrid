/**
 * Tests — TickerPackageValidator round-trip with real Pydantic-exported
 * schema. Fixtures use string-Decimals, matching Pydantic's JSON output.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { TickerPackageValidator } from './package-validator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = path.resolve(__dirname, '../../generated/schemas');

// ---------------------------------------------------------------------
// A minimal KCHOL-like valid package — string-Decimals, matches Python's
// JSON serialization of the Pydantic model.
// ---------------------------------------------------------------------
function validKchol(): unknown {
  return {
    meta: {
      ticker: 'KCHOL',
      package_date: '2026-04-16',
      schema_version: '1.0.0',
      producer: 'tests.fixture',
      sources: [],
    },
    company: {
      name: 'Koç Holding A.Ş.',
      sector: 'holding',
      is_holding: true,
      subsidiaries: [],
    },
    financials: {
      periods: [
        {
          period: 'FY',
          year: 2025,
          currency: 'TRY',
          ias29_restated: false,
          sources: [],
          balance_sheet: {
            total_assets: '1200000000000',
            total_liabilities: '700000000000',
            total_equity: '500000000000',
          },
          income_statement: {
            revenue: '380000000000',
            net_income: '45000000000',
          },
        },
      ],
    },
    market: {
      snapshot: {
        last_price: '215.40',
        currency: 'TRY',
        shares_outstanding: 2535898050,
        market_cap: '546230000000',
      },
      history: [],
    },
    quality: {
      missing_fields: [],
      flags: [],
      degraded: false,
    },
  };
}

describe('TickerPackageValidator', () => {
  const v = new TickerPackageValidator({ schemaDir: SCHEMA_DIR });

  it('accepts a minimal valid KCHOL package', () => {
    const res = v.validate(validKchol());
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
    expect(res.schemaVersion).toBe('1.0.0');
    expect(res.data?.meta.ticker).toBe('KCHOL');
  });

  it('rejects package missing a critical top-level field', () => {
    const pkg = validKchol() as Record<string, unknown>;
    delete pkg.financials;
    const res = v.validate(pkg);
    // In warn mode (default) valid=true but warnings populated.
    if (res.mode === 'warn') {
      expect(res.warnings.length).toBeGreaterThan(0);
      expect(res.warnings.join('\n')).toMatch(/financials/);
    } else {
      expect(res.valid).toBe(false);
      expect(res.errors.join('\n')).toMatch(/financials/);
    }
  });

  it('tolerates missing optional field (trade_receivables under balance_sheet)', () => {
    // The fixture already omits trade_receivables and passes — this is
    // the hybrid doctrine in practice.
    const res = v.validate(validKchol());
    expect(res.valid).toBe(true);
  });

  it('rejects a totally malformed payload', () => {
    const res = v.validate({ garbage: true });
    if (res.mode === 'warn') {
      expect(res.warnings.length).toBeGreaterThan(0);
    } else {
      expect(res.valid).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
    }
  });

  it('rejects lowercase ticker (regex constraint)', () => {
    const pkg = validKchol() as Record<string, unknown>;
    (pkg.meta as Record<string, unknown>).ticker = 'kchol';
    const res = v.validate(pkg);
    if (res.mode === 'warn') {
      expect(res.warnings.join('\n')).toMatch(/ticker/);
    } else {
      expect(res.valid).toBe(false);
    }
  });

  it('accepts forward-compat unknown fields (extra=ignore on Python side)', () => {
    const pkg = validKchol() as Record<string, unknown>;
    pkg.some_future_field = { answer: 42 };
    (pkg.meta as Record<string, unknown>).future_hint = 'future';
    const res = v.validate(pkg);
    // Pydantic emits additionalProperties:true at root — Ajv mirrors that.
    expect(res.valid).toBe(true);
  });

  it('exposes the schema version loaded from the file', () => {
    expect(v.validate(validKchol()).schemaVersion).toBe('1.0.0');
  });
});
