/**
 * Coverage Engine (Block P — Plan P2C Wave 1).
 *
 * Required-fact coverage tracker. For each session, surfaces which required
 * canonical facts are present vs missing per category. Gaps are advisory
 * — they feed into the QA rubric (P2B) and the future Quality Budget
 * (P2E), but never block delivery on their own.
 *
 * Strict invariants:
 *   - non-blocking: returns a report; never deletes or rejects content
 *   - period-suffix-aware: a required fact "revenue" is satisfied by ANY
 *     persisted "revenue_fy2025" / "revenue_q1_2026" / "revenue" key
 *   - deterministic: same fact set → same report
 *   - read-only: no DB writes, no side effects
 */

import { listFacts } from '../fact-layer/store.js';

// =============================================================================
// Required-fact registry (Wave 1 hardcoded; yaml in a future wave)
// =============================================================================

export const REQUIRED_FACTS_BY_CATEGORY: Readonly<Record<string, ReadonlyArray<string>>> = {
  financial_statements: [
    'revenue',
    'net_income',
    'total_assets',
    'total_equity',
  ],
  ratios_and_leverage: [
    'gross_margin',
    'ebitda_margin',
    'net_margin',
    'roe',
    'roa',
    'current_ratio',
    'net_debt',
    'net_debt_to_ebitda',
  ],
  cash_flow: [
    'fcf',
  ],
  macro: [
    'tcmb_policy_rate',
    'cpi_yoy',
    'usd_try',
    'eur_try',
  ],
  technical: [
    'rsi_14',
  ],
};

// =============================================================================
// Types
// =============================================================================

export interface CategoryCoverage {
  category: string;
  /** Stem facts that satisfied at least one persisted fact_key. */
  present_stems: string[];
  /** Stem facts with no matching persisted fact_key. */
  missing_stems: string[];
  /** present / total. 0..1. 1.0 when all required stems present. */
  coverage_ratio: number;
}

export interface CoverageReport {
  session_id: string;
  total_required: number;
  total_present: number;
  total_missing: number;
  /** present / total across all categories. 0..1. */
  overall_coverage: number;
  by_category: CategoryCoverage[];
  /** Flat sorted list of missing stems for downstream consumers. */
  all_missing_stems: string[];
}

// =============================================================================
// Period suffix matcher
// =============================================================================
//
// A required stem "revenue" should match persisted keys like:
//   - "revenue"             (no suffix)
//   - "revenue_fy2025"      (fy suffix)
//   - "revenue_q1_2026"     (quarterly suffix)
//   - "revenue_h1_2026"     (semi-annual)
//   - "revenue_20260427"    (date suffix)
//
// It must NOT match "revenue_growth" or "gross_revenue". Pattern: stem
// equals the persisted key, OR persisted key starts with `${stem}_` AND
// the suffix portion looks like a recognised period token.

const PERIOD_SUFFIX_RE = /^(?:fy\d{4}|q[1-4]_\d{4}|h[12]_\d{4}|\d{8})$/i;

function stemMatchesPersistedKey(stem: string, persistedKey: string): boolean {
  if (persistedKey === stem) return true;
  if (!persistedKey.startsWith(`${stem}_`)) return false;
  const suffix = persistedKey.slice(stem.length + 1);
  return PERIOD_SUFFIX_RE.test(suffix);
}

// =============================================================================
// Main entry
// =============================================================================

export function computeCoverageReport(sessionId: string): CoverageReport {
  const facts = listFacts(sessionId);
  const persistedKeys = new Set(facts.map((f) => f.fact_key));

  let totalRequired = 0;
  let totalPresent = 0;
  const categories: CategoryCoverage[] = [];
  const allMissing = new Set<string>();

  for (const [category, stems] of Object.entries(REQUIRED_FACTS_BY_CATEGORY)) {
    const present: string[] = [];
    const missing: string[] = [];
    for (const stem of stems) {
      const isPresent = anyKeyMatchesStem(stem, persistedKeys);
      if (isPresent) present.push(stem);
      else { missing.push(stem); allMissing.add(stem); }
    }
    totalRequired += stems.length;
    totalPresent += present.length;
    categories.push({
      category,
      present_stems: present.slice().sort(),
      missing_stems: missing.slice().sort(),
      coverage_ratio: stems.length > 0 ? round3(present.length / stems.length) : 1,
    });
  }

  const overall = totalRequired > 0 ? round3(totalPresent / totalRequired) : 1;

  return {
    session_id: sessionId,
    total_required: totalRequired,
    total_present: totalPresent,
    total_missing: totalRequired - totalPresent,
    overall_coverage: overall,
    by_category: categories,
    all_missing_stems: Array.from(allMissing).sort(),
  };
}

function anyKeyMatchesStem(stem: string, persistedKeys: Set<string>): boolean {
  for (const k of persistedKeys) {
    if (stemMatchesPersistedKey(stem, k)) return true;
  }
  return false;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// =============================================================================
// Public helpers
// =============================================================================

/** Flattened list of every required stem across categories. */
export function listAllRequiredStems(): string[] {
  const out: string[] = [];
  for (const stems of Object.values(REQUIRED_FACTS_BY_CATEGORY)) {
    out.push(...stems);
  }
  return out.sort();
}

/** Deterministic categorisation lookup — useful for downstream UI. */
export function categoryForStem(stem: string): string | null {
  for (const [cat, stems] of Object.entries(REQUIRED_FACTS_BY_CATEGORY)) {
    if (stems.includes(stem)) return cat;
  }
  return null;
}

// Exposed for tests
export { stemMatchesPersistedKey };
