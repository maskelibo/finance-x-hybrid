/**
 * P5A — Coverage Score (narrative topic coverage).
 *
 * For each topic in `expected_narratives[]`, checks whether AT LEAST ONE of
 * its `key_points` appears in the actual report's narrative text. A topic is
 * "covered" iff one or more key_points are found; the score is the fraction
 * of topics that are covered.
 *
 * Pure deterministic string matching — no LLM, no semantic similarity. The
 * matching is case-insensitive and whitespace-normalized; exact phrase match
 * on the normalized form. Operator should choose key_points that are
 * structurally invariant (specific multi-word phrases or canonical metric
 * names), not stylistic words.
 */

export interface ExpectedNarrative {
  topic: string;
  key_points: string[];
}

export interface CoverageMissing {
  topic: string;
  expected_key_points: string[];
  found_key_points: string[];
}

export interface CoverageScoringResult {
  /** covered_topics / total_topics. 1.0 when total === 0 (vacuously true). */
  score: number;
  covered_topics: number;
  total_topics: number;
  missing_topics: CoverageMissing[];
}

export function scoreCoverage(
  expectedNarratives: ReadonlyArray<ExpectedNarrative>,
  actualReportText: string | null | undefined,
): CoverageScoringResult {
  const haystack = normalize(actualReportText ?? '');
  const missing: CoverageMissing[] = [];
  let covered = 0;
  const total = expectedNarratives.length;

  for (const narrative of expectedNarratives) {
    const found: string[] = [];
    const expected: string[] = [];
    for (const kp of narrative.key_points) {
      const needle = normalize(kp);
      expected.push(kp);
      if (needle.length > 0 && haystack.includes(needle)) {
        found.push(kp);
      }
    }
    if (found.length > 0) {
      covered++;
    } else {
      missing.push({
        topic: narrative.topic,
        expected_key_points: expected.slice().sort(),
        found_key_points: found,
      });
    }
  }

  return {
    score: total === 0 ? 1 : round4(covered / total),
    covered_topics: covered,
    total_topics: total,
    missing_topics: missing,
  };
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
