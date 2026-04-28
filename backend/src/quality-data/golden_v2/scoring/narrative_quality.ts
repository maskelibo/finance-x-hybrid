/**
 * P5A — Narrative Quality Score (keyword overlap, NO LLM).
 *
 * For every key_point across all expected_narratives, checks whether the
 * normalized form appears in the actual report text. Returns the fraction
 * found across the FLAT key_point set (vs. coverage_score, which is
 * per-topic granularity).
 *
 * Why both this and coverage_score?
 *   - coverage_score answers: "did the report at least mention each topic?"
 *   - narrative_quality answers: "how thorough was the discussion of each
 *     topic? did the report cover ALL key_points or just one?"
 *
 * Together they form a coverage / depth pair without invoking an LLM.
 *
 * Matching is case-insensitive + whitespace-normalized + exact substring on
 * the normalized form. No fuzzy matching; no semantic similarity. This is
 * intentional: deterministic scoring is repeatable and operator-auditable.
 */

import type { ExpectedNarrative } from './coverage_score.js';

export interface NarrativeMissingPoint {
  topic: string;
  key_point: string;
}

export interface NarrativeQualityResult {
  /** found / total. 1.0 when total === 0 (vacuously true). */
  score: number;
  found: number;
  total: number;
  missing_points: NarrativeMissingPoint[];
}

export function scoreNarrativeQuality(
  expectedNarratives: ReadonlyArray<ExpectedNarrative>,
  actualReportText: string | null | undefined,
): NarrativeQualityResult {
  const haystack = normalize(actualReportText ?? '');
  let total = 0;
  let found = 0;
  const missing: NarrativeMissingPoint[] = [];

  for (const narrative of expectedNarratives) {
    for (const kp of narrative.key_points) {
      total++;
      const needle = normalize(kp);
      if (needle.length > 0 && haystack.includes(needle)) {
        found++;
      } else {
        missing.push({ topic: narrative.topic, key_point: kp });
      }
    }
  }

  return {
    score: total === 0 ? 1 : round4(found / total),
    found,
    total,
    missing_points: missing,
  };
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
