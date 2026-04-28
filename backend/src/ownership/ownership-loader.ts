/**
 * Pre-Core-4 Phase C — ownership YAML loader.
 *
 * Replaces the hardcoded ticker → ownership lookup in
 * report_formatter/compose.ts (line ~2285) with a config-driven
 * loader that reads `config/ownership/<TICKER>.yaml` and returns
 * structured ownership data + verification status + source attribution.
 *
 * When a ticker has no YAML config:
 *   - returns null
 *   - the caller (compose.ts) falls back to the legacy hardcoded
 *     lookup, then to the BIST-average sector approximation
 *
 * When a ticker has a YAML config:
 *   - returned ownership carries `verification_status` so the
 *     report renderer can show an honest "operator review pending"
 *     badge until the operator promotes the file.
 *   - QA truth context picks up the freshness signal.
 *
 * No paid LLM calls. No network. Pure FS read + YAML parse.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

import { PROJECT_ROOT } from '../config.js';

export interface OwnershipShareholderEntry {
  label: string;
  pct: number;
  note?: string;
  is_controlling?: boolean;
}

export interface OwnershipSourceAttribution {
  url: string;
  as_of_date: string;
  source_filing: string;
}

export interface OwnershipRollup {
  family_and_related_total_pct?: number;
  foundation_pct?: number;
  pension_fund_pct?: number;
  free_float_pct?: number;
  treasury_pct?: number;
}

export interface OwnershipData {
  ticker: string;
  verification_status: 'operator_verified' | 'auto_curated_pending_operator_review';
  source: OwnershipSourceAttribution;
  shareholders: OwnershipShareholderEntry[];
  total_pct: number;
  rollup?: OwnershipRollup;
  /** Convenience: age in days vs. ownership.source.as_of_date. */
  age_days: number;
}

const OWNERSHIP_DIR = path.join(PROJECT_ROOT, 'config', 'ownership');

export function loadOwnership(ticker: string): OwnershipData | null {
  const tk = ticker.toUpperCase();
  const filePath = path.join(OWNERSHIP_DIR, `${tk}.yaml`);
  if (!fs.existsSync(filePath)) return null;
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
  let parsed: Partial<OwnershipData>;
  try {
    parsed = yaml.parse(raw) as Partial<OwnershipData>;
  } catch {
    return null;
  }
  if (
    !parsed
    || typeof parsed.ticker !== 'string'
    || !Array.isArray(parsed.shareholders)
    || typeof parsed.total_pct !== 'number'
    || !parsed.source
    || typeof (parsed.source as OwnershipSourceAttribution).url !== 'string'
    || typeof (parsed.source as OwnershipSourceAttribution).as_of_date !== 'string'
  ) {
    return null;
  }
  // Compute age_days from source.as_of_date (best-effort).
  let ageDays = 9999;
  try {
    const asOf = new Date(parsed.source.as_of_date);
    if (!Number.isNaN(asOf.getTime())) {
      ageDays = Math.floor((Date.now() - asOf.getTime()) / 86_400_000);
    }
  } catch { /* fallthrough */ }

  return {
    ticker: parsed.ticker.toUpperCase(),
    verification_status: parsed.verification_status === 'operator_verified'
      ? 'operator_verified'
      : 'auto_curated_pending_operator_review',
    source: parsed.source,
    shareholders: parsed.shareholders as OwnershipShareholderEntry[],
    total_pct: parsed.total_pct,
    rollup: parsed.rollup,
    age_days: ageDays,
  };
}

export function ownershipPieSlices(data: OwnershipData): Array<{ label: string; value: number }> {
  return data.shareholders
    .filter((s) => s.pct > 0.05)
    .map((s) => ({ label: s.label, value: s.pct }));
}
