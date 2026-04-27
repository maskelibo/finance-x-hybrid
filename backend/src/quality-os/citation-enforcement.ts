/**
 * Citation Enforcement (Block P — Plan P2D Wave 1).
 *
 * Detects facts that lack a citation (source_doc_id on a lineage_node).
 * Critical facts (revenue / net_income / ebitda / net_debt / roe / fcf and
 * their period-suffixed variants) must carry citations once P1B Wave 2
 * Python integration writes doc_ids; until then this layer reports the gap
 * as advisory.
 *
 * Wave 1 invariants:
 *   - DETECTION ONLY — never blocks publish; the block-on-critical decision
 *     is owned by the P2E Quality Budget gate
 *   - severity: critical (no source_doc_id on a critical-stem fact)
 *               non_critical (no source_doc_id on a non-critical fact)
 *   - non-destructive: never mutates lineage_nodes / canonical_facts
 */

import { db } from '../db.js';

const CRITICAL_FACT_STEMS: ReadonlySet<string> = new Set([
  'revenue',
  'net_income',
  'ebitda',
  'net_debt',
  'net_debt_to_ebitda',
  'roe',
  'fcf',
]);

const PERIOD_SUFFIX_RE = /^(?:fy\d{4}|q[1-4]_\d{4}|h[12]_\d{4}|\d{8})$/i;

function stemOf(factKey: string): string {
  // Strip a trailing period suffix if present, otherwise return as-is.
  const idx = factKey.lastIndexOf('_');
  if (idx < 0) return factKey;
  // Keys like net_debt_to_ebitda_fy2025: walk back two underscores
  // until the trailing token doesn't look like a period suffix.
  const parts = factKey.split('_');
  while (parts.length > 1) {
    const tail = parts[parts.length - 1];
    const tailWithIndex = parts.length >= 2 ? `${parts[parts.length - 2]}_${tail}` : '';
    // Match `q1_2026` / `h1_2026` style two-token suffix
    if (PERIOD_SUFFIX_RE.test(tailWithIndex)) {
      parts.splice(parts.length - 2, 2);
      break;
    }
    if (PERIOD_SUFFIX_RE.test(tail)) {
      parts.pop();
      break;
    }
    return parts.join('_');
  }
  return parts.join('_');
}

export function isCriticalFactKey(factKey: string): boolean {
  return CRITICAL_FACT_STEMS.has(stemOf(factKey));
}

// =============================================================================
// Types
// =============================================================================

export type CitationGapSeverity = 'critical' | 'non_critical';

export interface CitationGap {
  fact_key: string;
  severity: CitationGapSeverity;
  /** Distinct agents that wrote a lineage node for this fact. */
  writers: string[];
  /** Number of lineage nodes for the fact (across all writers). */
  node_count: number;
}

export interface CitationReport {
  session_id: string;
  total_facts_with_lineage: number;
  /** Number of facts that have at least one lineage node carrying source_doc_id. */
  facts_with_citation: number;
  facts_missing_citation: number;
  critical_gaps: CitationGap[];
  non_critical_gaps: CitationGap[];
  /** facts_with_citation / total_facts_with_lineage (1.0 when no lineage). */
  coverage_ratio: number;
}

// =============================================================================
// Main entry
// =============================================================================

interface NodeRow {
  fact_key: string;
  computed_by: string;
  has_doc: number; // SQLite returns 0/1
}

export function detectCitationGaps(sessionId: string): CitationReport {
  // For each fact_key in this session's lineage, group nodes by writer and
  // mark whether ANY node for that fact has a non-null source_doc_id.
  const rows = db.prepare(`
    SELECT
      fact_key,
      computed_by,
      CASE WHEN source_doc_id IS NOT NULL AND source_doc_id != '' THEN 1 ELSE 0 END AS has_doc
    FROM lineage_nodes
    WHERE session_id = ?
  `).all(sessionId) as NodeRow[];

  // Group: { fact_key: { writers: Set, anyDoc: bool, nodeCount: int } }
  const factState = new Map<string, { writers: Set<string>; anyDoc: boolean; nodeCount: number }>();
  for (const r of rows) {
    const e = factState.get(r.fact_key) ?? { writers: new Set<string>(), anyDoc: false, nodeCount: 0 };
    e.writers.add(r.computed_by);
    if (r.has_doc) e.anyDoc = true;
    e.nodeCount++;
    factState.set(r.fact_key, e);
  }

  const critical: CitationGap[] = [];
  const nonCritical: CitationGap[] = [];
  let withCitation = 0;
  for (const [factKey, e] of factState) {
    if (e.anyDoc) {
      withCitation++;
      continue;
    }
    const gap: CitationGap = {
      fact_key: factKey,
      severity: isCriticalFactKey(factKey) ? 'critical' : 'non_critical',
      writers: Array.from(e.writers).sort(),
      node_count: e.nodeCount,
    };
    if (gap.severity === 'critical') critical.push(gap);
    else nonCritical.push(gap);
  }

  // Sort gaps deterministically (fact_key alpha)
  critical.sort((a, b) => a.fact_key.localeCompare(b.fact_key));
  nonCritical.sort((a, b) => a.fact_key.localeCompare(b.fact_key));

  const total = factState.size;
  const ratio = total > 0 ? Math.round((withCitation / total) * 1000) / 1000 : 1;
  return {
    session_id: sessionId,
    total_facts_with_lineage: total,
    facts_with_citation: withCitation,
    facts_missing_citation: total - withCitation,
    critical_gaps: critical,
    non_critical_gaps: nonCritical,
    coverage_ratio: ratio,
  };
}

// Exposed for tests
export { stemOf };
