/**
 * Fact Layer — Unit Normalizer (R7)
 *
 * Every numeric fact is normalized to a canonical unit before persisting.
 * Prevents fake contradictions where one agent reports EBITDA in TRY_mn and
 * another in TRY_bn — the numbers differ 1000x but it's a unit mismatch, not a fact dispute.
 */

export const CANONICAL_UNITS = {
  currency: 'TRY_mn',
  percentage: 'decimal',
  days: 'int',
  multiplier: 'decimal',
} as const;

export type RawUnit =
  | 'TRY' | 'TRY_mn' | 'TRY_bn'
  | 'USD' | 'USD_mn' | 'USD_bn'
  | 'EUR' | 'EUR_mn' | 'EUR_bn'
  | 'pct' | 'decimal'
  | 'days' | 'x';

// Rough FX defaults — override per session at runtime with fresh rates.
const FX_TO_TRY: Record<string, number> = {
  USD: 42.5,
  EUR: 46.2,
};

export function setFxRates(rates: Partial<Record<'USD' | 'EUR', number>>): void {
  if (rates.USD !== undefined) FX_TO_TRY.USD = rates.USD;
  if (rates.EUR !== undefined) FX_TO_TRY.EUR = rates.EUR;
}

export function normalizeToTRYMn(value: number, unit: RawUnit): {
  normalized_value: number;
  canonical_unit: string;
  conversion_note?: string;
} {
  switch (unit) {
    case 'TRY_mn':
      return { normalized_value: value, canonical_unit: 'TRY_mn' };
    case 'TRY':
      return { normalized_value: value / 1_000_000, canonical_unit: 'TRY_mn', conversion_note: '/1e6' };
    case 'TRY_bn':
      return { normalized_value: value * 1000, canonical_unit: 'TRY_mn', conversion_note: '×1000' };
    case 'USD':
      return { normalized_value: (value * FX_TO_TRY.USD) / 1_000_000, canonical_unit: 'TRY_mn', conversion_note: `USD→TRY@${FX_TO_TRY.USD}, /1e6` };
    case 'USD_mn':
      return { normalized_value: value * FX_TO_TRY.USD, canonical_unit: 'TRY_mn', conversion_note: `USD_mn→TRY_mn@${FX_TO_TRY.USD}` };
    case 'USD_bn':
      return { normalized_value: value * FX_TO_TRY.USD * 1000, canonical_unit: 'TRY_mn', conversion_note: `USD_bn→TRY_mn@${FX_TO_TRY.USD}×1000` };
    case 'EUR':
      return { normalized_value: (value * FX_TO_TRY.EUR) / 1_000_000, canonical_unit: 'TRY_mn', conversion_note: `EUR→TRY@${FX_TO_TRY.EUR}, /1e6` };
    case 'EUR_mn':
      return { normalized_value: value * FX_TO_TRY.EUR, canonical_unit: 'TRY_mn', conversion_note: `EUR_mn→TRY_mn@${FX_TO_TRY.EUR}` };
    case 'EUR_bn':
      return { normalized_value: value * FX_TO_TRY.EUR * 1000, canonical_unit: 'TRY_mn', conversion_note: `EUR_bn→TRY_mn@${FX_TO_TRY.EUR}×1000` };
    default:
      throw new Error(`Unknown currency unit: ${unit}`);
  }
}

export function normalizePercentage(value: number, unit: RawUnit): number {
  if (unit === 'pct') return value / 100;
  if (unit === 'decimal') return value;
  throw new Error(`Unknown percentage unit: ${unit}`);
}

export type NormalizedFact = {
  value: number;
  unit: string;
  conversion?: string;
};

export function normalizeFactValue(factKey: string, value: number, rawUnit: RawUnit): NormalizedFact {
  const k = factKey.toLowerCase();
  // Multiplier check runs first — keys like ev_ebitda_x would otherwise hit currency branch.
  if (k.endsWith('_x') || k.includes('_multiple')) {
    return { value, unit: 'x' };
  }
  if (k.includes('days') || k.endsWith('_dso') || k.endsWith('_dio') || k.endsWith('_dpo') || k.endsWith('_ccc')) {
    return { value: Math.round(value), unit: 'days' };
  }
  if (k.includes('pct') || k.includes('margin') || k.includes('ratio') || k.includes('rate')) {
    return { value: normalizePercentage(value, rawUnit), unit: 'decimal' };
  }
  // Currency detection — match common financial terms regardless of underscore prefix.
  const CURRENCY_TERMS = ['try_mn', 'revenue', 'ebitda', 'debt', 'capex', 'fcf', 'opex', 'net_sales', 'gross_profit', 'op_income', 'cash'];
  if (CURRENCY_TERMS.some(t => k.includes(t))) {
    const result = normalizeToTRYMn(value, rawUnit);
    return { value: result.normalized_value, unit: result.canonical_unit, conversion: result.conversion_note };
  }
  return { value, unit: rawUnit };
}
