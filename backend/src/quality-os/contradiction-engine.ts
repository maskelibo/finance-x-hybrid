/**
 * Contradiction Engine (Block P — Plan P2A Wave 1).
 *
 * Deterministic numeric-conflict detector across the lineage_nodes a session
 * has accumulated. 3-tier severity classifier per fact_key delta:
 *
 *   < soft threshold       → no_conflict (variance within tolerance)
 *   soft ≤ Δ < material    → soft       (annotate inline; no arbitration)
 *   material ≤ Δ < critical→ material   (arbitration optional; pipeline OK)
 *   ≥ critical threshold   → critical   (arbitration mandatory; QA notify)
 *
 * Wave 1 scope: direct_numeric_conflict only. Other contradiction types
 * (narrative_vs_numeric / summary_vs_detail / valuation_vs_thesis / temporal /
 * unit_mismatch / period_mismatch) are deferred — they require agent-output
 * or report-HTML inspection that crosses Wave 1's boundary.
 *
 * Strict invariants:
 *   - flag-only: detection NEVER blocks delivery, NEVER deletes content
 *   - pure offline computation against canonical_facts + lineage_nodes;
 *     no DB writes
 *   - empty session → well-formed empty report (consistency_score=1)
 */

import { db } from '../db.js';

// =============================================================================
// Types
// =============================================================================

export type ContradictionSeverity = 'soft' | 'material' | 'critical';

export interface ContradictionThresholds {
  soft: number;
  material: number;
  critical: number;
}

export interface ContradictionCandidate {
  computed_by: string;
  value: number;
  computed_at: string;
}

export interface DirectNumericConflict {
  fact_key: string;
  severity: ContradictionSeverity;
  /** relative delta = (max - min) / max(|max|, |min|), 0..∞ */
  relative_delta: number;
  candidates: ContradictionCandidate[];
  /** Human-readable summary; never narrative-suppressing. */
  description: string;
}

export interface ContradictionReport {
  session_id: string;
  total_conflicts: number;
  by_severity: Record<ContradictionSeverity, number>;
  conflicts: DirectNumericConflict[];
  /** 0..1; 1.0 means no conflicts, 0.0 means every checked fact diverged critically. */
  overall_consistency_score: number;
}

// =============================================================================
// Thresholds
// =============================================================================

/** Default 3-tier numeric delta thresholds (relative). */
const DEFAULT_THRESHOLDS: ContradictionThresholds = {
  soft: 0.03,      // 3%
  material: 0.10,  // 10%
  critical: 0.25,  // 25%  (>= critical → 'critical' severity)
};

/** Tighter thresholds for fact_key prefixes that demand more precision. */
const CUSTOM_THRESHOLDS: Array<{ prefix: string; thresholds: ContradictionThresholds }> = [
  { prefix: 'usd_try',      thresholds: { soft: 0.005, material: 0.01, critical: 0.02 } },
  { prefix: 'eur_try',      thresholds: { soft: 0.005, material: 0.01, critical: 0.02 } },
  { prefix: 'shares',       thresholds: { soft: 0.001, material: 0.005, critical: 0.01 } },
  { prefix: 'eps',          thresholds: { soft: 0.01, material: 0.03, critical: 0.08 } },
];

export function getThresholdsForFact(factKey: string): ContradictionThresholds {
  for (const { prefix, thresholds } of CUSTOM_THRESHOLDS) {
    if (factKey === prefix || factKey.startsWith(`${prefix}_`)) return thresholds;
  }
  return DEFAULT_THRESHOLDS;
}

export function classifyNumericDelta(
  factKey: string,
  values: ReadonlyArray<number>,
): { severity: ContradictionSeverity | 'no_conflict'; relative_delta: number } {
  if (values.length < 2) return { severity: 'no_conflict', relative_delta: 0 };
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { severity: 'no_conflict', relative_delta: 0 };
  }
  const denom = Math.max(Math.abs(max), Math.abs(min));
  if (denom === 0) {
    return { severity: 'no_conflict', relative_delta: 0 };
  }
  const delta = (max - min) / denom;
  const t = getThresholdsForFact(factKey);
  if (delta < t.soft) return { severity: 'no_conflict', relative_delta: delta };
  if (delta < t.material) return { severity: 'soft', relative_delta: delta };
  if (delta < t.critical) return { severity: 'material', relative_delta: delta };
  return { severity: 'critical', relative_delta: delta };
}

// =============================================================================
// Direct numeric conflict detection (lineage-based)
// =============================================================================

interface LineageRow {
  fact_key: string;
  computed_by: string;
  computed_at: string;
  normalized_value: string | null;
}

export function detectDirectNumericConflicts(sessionId: string): DirectNumericConflict[] {
  const rows = db.prepare(`
    SELECT fact_key, computed_by, computed_at, normalized_value
    FROM lineage_nodes
    WHERE session_id = ?
    ORDER BY fact_key, computed_at
  `).all(sessionId) as LineageRow[];

  // Group by fact_key
  const byFact = new Map<string, LineageRow[]>();
  for (const r of rows) {
    const list = byFact.get(r.fact_key) ?? [];
    list.push(r);
    byFact.set(r.fact_key, list);
  }

  const conflicts: DirectNumericConflict[] = [];
  for (const [factKey, list] of byFact) {
    if (list.length < 2) continue;

    // Coerce normalized_value strings to finite numbers
    const candidates: ContradictionCandidate[] = [];
    for (const r of list) {
      const v = parseFiniteNumber(r.normalized_value);
      if (v === null) continue;
      candidates.push({ computed_by: r.computed_by, value: v, computed_at: r.computed_at });
    }
    if (candidates.length < 2) continue;

    const { severity, relative_delta } = classifyNumericDelta(
      factKey,
      candidates.map((c) => c.value),
    );
    if (severity === 'no_conflict') continue;

    const distinctAgents = Array.from(new Set(candidates.map((c) => c.computed_by))).sort();
    conflicts.push({
      fact_key: factKey,
      severity,
      relative_delta,
      candidates,
      description: `${factKey}: ${distinctAgents.length} writer${distinctAgents.length === 1 ? '' : 's'} diverged by ${(relative_delta * 100).toFixed(2)}% (severity=${severity})`,
    });
  }
  return conflicts;
}

function parseFiniteNumber(s: string | null): number | null {
  if (s == null) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(s); } catch { return null; }
  if (typeof parsed === 'number' && Number.isFinite(parsed)) return parsed;
  return null;
}

// =============================================================================
// Top-level report
// =============================================================================

export function detectContradictions(sessionId: string): ContradictionReport {
  const conflicts = detectDirectNumericConflicts(sessionId);
  const bySeverity: Record<ContradictionSeverity, number> = { soft: 0, material: 0, critical: 0 };
  for (const c of conflicts) bySeverity[c.severity]++;

  // Consistency score: penalise critical heaviest, then material, then soft.
  // Cap at 1.0 (no conflicts) and floor at 0 (>= 10 critical conflicts in a
  // single session — extremely degraded).
  const penalty =
      bySeverity.critical * 0.10
    + bySeverity.material * 0.03
    + bySeverity.soft     * 0.005;
  const consistency = Math.max(0, Math.min(1, 1 - penalty));

  return {
    session_id: sessionId,
    total_conflicts: conflicts.length,
    by_severity: bySeverity,
    conflicts,
    overall_consistency_score: round3(consistency),
  };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
