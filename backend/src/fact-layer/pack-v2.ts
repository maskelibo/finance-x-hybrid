/**
 * CanonicalFactPackV2 composer (Block P — Plan P1A Wave 2).
 *
 * Pure read-only projection of `canonical_facts` rows into a confidence-aware
 * pack. V1 fact-pack.ts is left untouched; V2 is additive and uses a distinct
 * function name (`getCanonicalFactPackV2`) to avoid clashing with V1's
 * existing `getFactPack`.
 *
 * Strict invariants:
 *   - No DB writes
 *   - Facts without confidence_json appear in `facts` with `confidence: null`
 *     and are EXCLUDED from confidence_summary averages / tier counts
 *   - tier_counts always carries all 5 tier keys (CERTAIN/HIGH/MEDIUM/LOW/
 *     SPECULATIVE) for downstream stability, even when 0
 *   - Empty session → well-formed empty pack; never throws
 */

import { db } from '../db.js';
import { listFacts, type CanonicalFact } from './store.js';
import type { FactConfidence, FactConfidenceTier } from './confidence.js';
import { computeSessionLineageStats } from './lineage.js';
import { getSessionMethodology } from './methodology.js';

// =============================================================================
// Types
// =============================================================================

export interface ConfidenceSummary {
  /** Average score across facts THAT HAVE confidence. 0 when none. */
  avg_score: number;
  /** Count by tier. All 5 keys always present (zero-filled). */
  tier_counts: Record<FactConfidenceTier, number>;
  /** fact_keys with score < 0.55. */
  low_confidence_keys: string[];
  /** fact_keys with score < 0.30. Subset of low_confidence_keys. */
  speculative_keys: string[];
  /** fact_keys with confidence === null (legacy / opted-out). */
  unscored_keys: string[];
}

export interface ConflictSummary {
  /** fact_keys whose persisted confidence has has_conflict=true (tracked via
   *  components.conflict_penalty > 0). */
  disputed_keys: string[];
  /** Counts by severity inferred from persisted conflict_penalty values:
   *  0.05 → minor, 0.20 → material, 0.40 → critical. Wave 2 only emits
   *  'minor' (P1D will introduce material/critical). */
  by_severity: { minor: number; material: number; critical: number };
}

/** P1B Wave 1 — optional lineage roll-up. Legacy sessions (no lineage rows)
 *  yield traced_fact_count=0 + untraced_fact_keys=all_facts. Never throws. */
export interface LineageSummary {
  traced_fact_count: number;
  /** Sorted alphabetically — fact_keys present in canonical_facts but with
   *  no lineage_nodes row in the session. */
  untraced_fact_keys: string[];
  avg_computation_depth: number;
  /** Sorted alphabetically. Empty until P1B Wave 2 adds doc-level provenance. */
  distinct_root_doc_ids: string[];
}

/** P1C Wave 1 — methodology snapshot reference for the session. null when
 *  no snapshot has been recorded (legacy session). */
export interface MethodologySummary {
  version: string;
  recorded_at: string;
}

export interface CanonicalFactPackV2 {
  session_id: string;
  ticker: string | null;
  fact_count: number;
  facts: Record<string, CanonicalFact>;
  confidence_summary: ConfidenceSummary;
  conflict_summary: ConflictSummary;
  /** P1B Wave 1 — optional lineage roll-up. Always present (additive
   *  shape); empty fields when no lineage has been recorded. */
  lineage_summary: LineageSummary;
  /** P1C Wave 1 — methodology snapshot ref. null for legacy sessions. */
  methodology_summary: MethodologySummary | null;
  /** Composer wall-clock timestamp. */
  composed_at: string;
}

// =============================================================================
// Constants
// =============================================================================

const ALL_TIERS: FactConfidenceTier[] = ['CERTAIN', 'HIGH', 'MEDIUM', 'LOW', 'SPECULATIVE'];
const LOW_CONFIDENCE_THRESHOLD = 0.55;
const SPECULATIVE_THRESHOLD = 0.30;

// =============================================================================
// Composer
// =============================================================================

export function getCanonicalFactPackV2(sessionId: string): CanonicalFactPackV2 {
  const rows = listFacts(sessionId);

  const facts: Record<string, CanonicalFact> = {};
  for (const f of rows) facts[f.fact_key] = f;

  const tierCounts = emptyTierCounts();
  const lowConfidenceKeys: string[] = [];
  const speculativeKeys: string[] = [];
  const unscoredKeys: string[] = [];
  const disputedKeys: string[] = [];
  const bySeverity = { minor: 0, material: 0, critical: 0 };

  let scoreSum = 0;
  let scoredCount = 0;

  for (const f of rows) {
    const c = f.confidence ?? null;
    if (!c) {
      unscoredKeys.push(f.fact_key);
      continue;
    }
    tierCounts[c.tier] = (tierCounts[c.tier] ?? 0) + 1;
    scoreSum += c.score;
    scoredCount++;
    if (c.score < LOW_CONFIDENCE_THRESHOLD) lowConfidenceKeys.push(f.fact_key);
    if (c.score < SPECULATIVE_THRESHOLD) speculativeKeys.push(f.fact_key);

    // Conflict severity inferred from persisted conflict_penalty value.
    const cp = c.components?.conflict_penalty ?? 0;
    if (cp > 0) {
      disputedKeys.push(f.fact_key);
      if (cp >= 0.40 - 1e-9) bySeverity.critical++;
      else if (cp >= 0.20 - 1e-9) bySeverity.material++;
      else bySeverity.minor++;
    }
  }

  const avgScore = scoredCount > 0 ? round3(scoreSum / scoredCount) : 0;

  // P1B Wave 1 — lineage roll-up. Cheap when tables are empty (legacy
  // sessions): traced_fact_count = 0 → untraced lists every fact_key.
  const lineageStats = computeSessionLineageStats(sessionId);
  const tracedSet = readTracedFactKeys(sessionId);
  const untracedFactKeys = Object.keys(facts).filter((k) => !tracedSet.has(k)).sort();

  return {
    session_id: sessionId,
    ticker: readTickerForSession(sessionId),
    fact_count: rows.length,
    facts,
    confidence_summary: {
      avg_score: avgScore,
      tier_counts: tierCounts,
      low_confidence_keys: lowConfidenceKeys.sort(),
      speculative_keys: speculativeKeys.sort(),
      unscored_keys: unscoredKeys.sort(),
    },
    conflict_summary: {
      disputed_keys: disputedKeys.sort(),
      by_severity: bySeverity,
    },
    lineage_summary: {
      traced_fact_count: lineageStats.traced_fact_count,
      untraced_fact_keys: untracedFactKeys,
      avg_computation_depth: lineageStats.avg_computation_depth,
      distinct_root_doc_ids: lineageStats.distinct_root_doc_ids,
    },
    methodology_summary: readMethodologySummary(sessionId),
    composed_at: new Date().toISOString(),
  };
}

function readMethodologySummary(sessionId: string): MethodologySummary | null {
  const snap = getSessionMethodology(sessionId);
  if (!snap) return null;
  return { version: snap.methodology_version, recorded_at: snap.recorded_at };
}

// =============================================================================
// Helpers
// =============================================================================

export function listLowConfidenceFacts(
  sessionId: string,
  threshold: number = LOW_CONFIDENCE_THRESHOLD,
): CanonicalFact[] {
  return listFacts(sessionId).filter((f) => {
    const c = f.confidence as FactConfidence | null | undefined;
    return c != null && c.score < threshold;
  });
}

export function summarizeConfidence(sessionId: string): ConfidenceSummary {
  return getCanonicalFactPackV2(sessionId).confidence_summary;
}

function emptyTierCounts(): Record<FactConfidenceTier, number> {
  const out: Record<FactConfidenceTier, number> = {
    CERTAIN: 0, HIGH: 0, MEDIUM: 0, LOW: 0, SPECULATIVE: 0,
  };
  for (const t of ALL_TIERS) out[t] = 0;
  return out;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function readTickerForSession(sessionId: string): string | null {
  const row = db.prepare(`SELECT ticker FROM analysis_sessions WHERE id = ?`).get(sessionId) as { ticker?: string } | undefined;
  return row?.ticker ?? null;
}

function readTracedFactKeys(sessionId: string): Set<string> {
  const rows = db.prepare(
    `SELECT DISTINCT fact_key FROM lineage_nodes WHERE session_id = ?`,
  ).all(sessionId) as Array<{ fact_key: string }>;
  return new Set(rows.map((r) => r.fact_key));
}
