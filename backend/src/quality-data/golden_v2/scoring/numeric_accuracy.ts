/**
 * P5A — Numeric Accuracy Scoring.
 *
 * Compares operator-supplied `expected_facts` (from a golden_report.json) to
 * the session's CanonicalFactPackV2 (`pack.facts[fact_key].value`). Pure
 * function; no I/O; no LLM; no DB.
 *
 * Tolerance:
 *   - Per-fact `tolerance_pct` override wins.
 *   - Otherwise the caller-supplied default (typically 0.02 = 2%) applies.
 *   - For string/categorical facts, exact match (==) — tolerance ignored.
 *
 * Mismatch records are exhaustive: any expected fact that is missing from the
 * actual pack OR differs beyond tolerance lands in `mismatches[]`. Matches
 * are counted but not enumerated to keep output bounded.
 *
 * NOT a content judgement: a fact missing from the actual pack counts as a
 * mismatch with `actual: null`. The caller decides whether that's a fail.
 */

export interface ExpectedFactValue {
  value: number | string | null;
  unit?: string;
  tolerance_pct?: number;
}

export type ExpectedFacts = Record<string, ExpectedFactValue>;

export interface ActualFactPack {
  facts?: Record<string, { value: number | string | null; unit?: string }>;
}

export interface NumericMismatch {
  fact_key: string;
  expected: number | string | null;
  actual: number | string | null;
  delta_pct?: number;
  within_tolerance: boolean;
  reason: 'missing_in_actual' | 'numeric_out_of_tolerance' | 'string_inequality' | 'type_mismatch';
}

export interface NumericScoringResult {
  /** matches / total. 1.0 when total === 0 (vacuously true). */
  score: number;
  matches: number;
  total: number;
  mismatches: NumericMismatch[];
}

const DEFAULT_TOLERANCE_PCT = 0.02;

export function scoreNumericAccuracy(
  goldenFacts: ExpectedFacts,
  actualFactPack: ActualFactPack | null | undefined,
  defaultTolerancePct: number = DEFAULT_TOLERANCE_PCT,
): NumericScoringResult {
  const actualFacts = actualFactPack?.facts ?? {};
  const mismatches: NumericMismatch[] = [];
  let matches = 0;
  let total = 0;

  for (const factKey of Object.keys(goldenFacts).sort()) {
    total++;
    const expected = goldenFacts[factKey];
    const actualEntry = actualFacts[factKey];

    if (!actualEntry) {
      mismatches.push({
        fact_key: factKey,
        expected: expected.value,
        actual: null,
        within_tolerance: false,
        reason: 'missing_in_actual',
      });
      continue;
    }

    const tolerance = typeof expected.tolerance_pct === 'number' && Number.isFinite(expected.tolerance_pct)
      ? expected.tolerance_pct
      : defaultTolerancePct;

    if (typeof expected.value === 'number' && typeof actualEntry.value === 'number') {
      const exp = expected.value;
      const act = actualEntry.value;
      const denom = Math.max(Math.abs(exp), Number.EPSILON);
      const deltaPct = exp === 0 && act === 0 ? 0 : Math.abs(act - exp) / denom;
      const within = deltaPct <= tolerance;
      if (within) {
        matches++;
      } else {
        mismatches.push({
          fact_key: factKey,
          expected: exp,
          actual: act,
          delta_pct: round4(deltaPct),
          within_tolerance: false,
          reason: 'numeric_out_of_tolerance',
        });
      }
      continue;
    }

    if (typeof expected.value === 'string' && typeof actualEntry.value === 'string') {
      if (expected.value === actualEntry.value) {
        matches++;
      } else {
        mismatches.push({
          fact_key: factKey,
          expected: expected.value,
          actual: actualEntry.value,
          within_tolerance: false,
          reason: 'string_inequality',
        });
      }
      continue;
    }

    // Type mismatch (e.g., expected string, actual number) — never within tolerance.
    mismatches.push({
      fact_key: factKey,
      expected: expected.value,
      actual: actualEntry.value ?? null,
      within_tolerance: false,
      reason: 'type_mismatch',
    });
  }

  return {
    score: total === 0 ? 1 : round4(matches / total),
    matches,
    total,
    mismatches,
  };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export { DEFAULT_TOLERANCE_PCT };
