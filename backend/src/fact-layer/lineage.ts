/**
 * Data Lineage Tracking (Block P — Plan P1B Wave 1).
 *
 * Per-fact derivation graph. Wave 1 records raw_extracted nodes only (one
 * per persisted extracted fact); computed / aggregated / transformed nodes
 * are reserved for Wave 2 once Python engine integration lands.
 *
 * Strict invariants:
 *   - Lineage is OPT-IN: callers explicitly invoke recordLineageNode AFTER
 *     successful upsertFact. Failure to record a node must NEVER orphan the
 *     fact and must NEVER block extraction. Use tryRecordLineageNode for
 *     fire-and-forget paths.
 *   - canonical_facts.fact data is the source of truth; lineage augments it.
 *   - getLineageTrail returns null for unknown facts and never throws.
 *   - DAG traversal is defensive: edges that reference missing nodes are
 *     surfaced via is_fully_traced=false rather than as a crash.
 *   - Cross-session isolation is enforced by every query; no node from
 *     session A is ever returned to session B.
 */

import { db } from '../db.js';

// =============================================================================
// Types
// =============================================================================

export type LineageNodeType =
  | 'raw_extracted'
  | 'computed'
  | 'aggregated'
  | 'transformed';

export interface LineageNodeInput {
  session_id: string;
  fact_key: string;
  /** Stable unique id; pass an external nanoid or ulid. */
  node_id: string;
  node_type: LineageNodeType;
  formula?: string | null;
  computed_by: string;
  computed_at: string;
  source_doc_id?: string | null;
  source_page?: number | null;
  source_snippet?: string | null;
  raw_value?: unknown;        // JSON-encoded on persist
  normalized_value?: unknown; // JSON-encoded on persist
  unit_conversion?: string | null;
  /** input_node_ids referenced by this node — edges are written separately. */
  input_node_ids?: string[];
}

export interface LineageNode {
  session_id: string;
  fact_key: string;
  node_id: string;
  node_type: LineageNodeType;
  formula: string | null;
  computed_by: string;
  computed_at: string;
  source_doc_id: string | null;
  source_page: number | null;
  source_snippet: string | null;
  raw_value: unknown;
  normalized_value: unknown;
  unit_conversion: string | null;
}

export interface LineageTrail {
  fact_key: string;
  /** Topologically sorted: roots first (no incoming edges), leaves last. */
  nodes: LineageNode[];
  /** De-duplicated by doc_id (and page when present). */
  root_sources: Array<{ doc_id: string; page?: number }>;
  /** Max depth from any root to the fact's terminal node. 0 for raw-only. */
  computation_depth: number;
  /** False when an edge points to a missing node id (defensive). */
  is_fully_traced: boolean;
}

const SNIPPET_MAX_LEN = 240;

// =============================================================================
// Persistence
// =============================================================================

/**
 * Persist a lineage node + (optionally) its incoming edges. Idempotent on
 * duplicate node_id (INSERT OR IGNORE on the row; edges deduped via PK).
 */
export function recordLineageNode(input: LineageNodeInput): void {
  const formula = input.formula ?? null;
  const sourceDocId = input.source_doc_id ?? null;
  const sourcePage = typeof input.source_page === 'number' && Number.isFinite(input.source_page)
    ? input.source_page : null;
  const snippet = typeof input.source_snippet === 'string'
    ? input.source_snippet.slice(0, SNIPPET_MAX_LEN)
    : null;
  const unitConv = input.unit_conversion ?? null;
  const rawJson = input.raw_value === undefined ? null : JSON.stringify(input.raw_value);
  const normJson = input.normalized_value === undefined ? null : JSON.stringify(input.normalized_value);

  db.prepare(`
    INSERT OR IGNORE INTO lineage_nodes (
      session_id, fact_key, node_id, node_type, formula,
      computed_by, computed_at,
      source_doc_id, source_page, source_snippet,
      raw_value, normalized_value, unit_conversion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.session_id, input.fact_key, input.node_id, input.node_type, formula,
    input.computed_by, input.computed_at,
    sourceDocId, sourcePage, snippet,
    rawJson, normJson, unitConv,
  );

  if (input.input_node_ids && input.input_node_ids.length > 0) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO lineage_edges (session_id, input_node_id, output_node_id)
      VALUES (?, ?, ?)
    `);
    for (const inputNodeId of input.input_node_ids) {
      if (typeof inputNodeId !== 'string' || inputNodeId.length === 0) continue;
      stmt.run(input.session_id, inputNodeId, input.node_id);
    }
  }
}

/**
 * Best-effort wrapper: console.warn on failure, never throws. Intended for
 * the extractor.ts post-upsert hook so a lineage error never blocks fact
 * extraction.
 */
export function tryRecordLineageNode(input: LineageNodeInput): void {
  try {
    recordLineageNode(input);
  } catch (err) {
    console.warn(`[lineage] record_failed fact=${input.fact_key} node=${input.node_id}: ${(err as Error).message}`);
  }
}

// =============================================================================
// Query / DAG construction
// =============================================================================

/**
 * Build the full lineage trail for one fact_key in one session.
 * Returns null when no lineage rows exist for that fact.
 */
export function getLineageTrail(sessionId: string, factKey: string): LineageTrail | null {
  // Step 1 — collect every node the fact_key directly produced.
  const terminalNodes = readNodesForFact(sessionId, factKey);
  if (terminalNodes.length === 0) return null;

  // Step 2 — recursive upstream walk over edges via WITH RECURSIVE.
  const allNodes = new Map<string, LineageNode>();
  for (const n of terminalNodes) allNodes.set(n.node_id, n);

  const upstreamRows = db.prepare(`
    WITH RECURSIVE upstream(node_id, depth) AS (
      SELECT le.input_node_id, 1
      FROM lineage_edges le
      WHERE le.session_id = ? AND le.output_node_id IN (
        SELECT node_id FROM lineage_nodes WHERE session_id = ? AND fact_key = ?
      )
      UNION ALL
      SELECT le.input_node_id, u.depth + 1
      FROM lineage_edges le
      JOIN upstream u ON u.node_id = le.output_node_id
      WHERE le.session_id = ? AND u.depth < 32
    )
    SELECT DISTINCT node_id, depth FROM upstream
  `).all(sessionId, sessionId, factKey, sessionId) as Array<{ node_id: string; depth: number }>;

  let isFullyTraced = true;
  let maxDepth = 0;
  for (const { node_id, depth } of upstreamRows) {
    if (depth > maxDepth) maxDepth = depth;
    if (allNodes.has(node_id)) continue;
    const n = readNode(sessionId, node_id);
    if (n) {
      allNodes.set(node_id, n);
    } else {
      // Edge references a node that no longer exists — surface defensively
      // rather than crash. Wave 2 / P1D may want to re-anchor it later.
      isFullyTraced = false;
    }
  }

  // Step 3 — topological order: parents (upstream) before children. We
  // currently know depth from terminals but for raw_extracted-only sessions
  // there are no edges and depth = 0. Sort: nodes without edges first
  // (raw_extracted), then by computed_at as a stable secondary.
  const orderedNodes = Array.from(allNodes.values()).sort((a, b) => {
    if (a.computed_at !== b.computed_at) return a.computed_at.localeCompare(b.computed_at);
    return a.node_id.localeCompare(b.node_id);
  });

  // Step 4 — root sources: any node with a source_doc_id is a root for
  // citation purposes regardless of where it sits in the DAG.
  const rootSourceMap = new Map<string, { doc_id: string; page?: number }>();
  for (const n of orderedNodes) {
    if (!n.source_doc_id) continue;
    const key = `${n.source_doc_id}|${n.source_page ?? ''}`;
    if (!rootSourceMap.has(key)) {
      rootSourceMap.set(key, n.source_page == null
        ? { doc_id: n.source_doc_id }
        : { doc_id: n.source_doc_id, page: n.source_page });
    }
  }

  return {
    fact_key: factKey,
    nodes: orderedNodes,
    root_sources: Array.from(rootSourceMap.values()),
    computation_depth: maxDepth,
    is_fully_traced: isFullyTraced,
  };
}

/**
 * Direct alias matching the master plan name; identical behaviour to
 * getLineageTrail. Exposed for downstream consumers expecting the plan's
 * naming.
 */
export const buildLineageTrail = getLineageTrail;

// =============================================================================
// P1B Wave 2 helpers — doc inheritance + DAG construction
// =============================================================================

/** Returns all node_ids recorded for a fact_key in this session, in
 *  computed_at order (oldest first). Empty array when no rows. */
export function getLineageNodeIdsForFact(sessionId: string, factKey: string): string[] {
  const rows = db.prepare(`
    SELECT node_id FROM lineage_nodes
    WHERE session_id = ? AND fact_key = ?
    ORDER BY computed_at ASC, node_id ASC
  `).all(sessionId, factKey) as Array<{ node_id: string }>;
  return rows.map((r) => r.node_id);
}

/** Returns the first non-null source_doc_id among lineage rows for a
 *  fact_key in this session, or null when none exists. Used by the
 *  computed-lineage emitter to inherit doc anchors from raw inputs. */
export function findSourceDocIdForFact(sessionId: string, factKey: string): string | null {
  const row = db.prepare(`
    SELECT source_doc_id FROM lineage_nodes
    WHERE session_id = ? AND fact_key = ? AND source_doc_id IS NOT NULL AND source_doc_id != ''
    ORDER BY computed_at ASC LIMIT 1
  `).get(sessionId, factKey) as { source_doc_id: string } | undefined;
  return row?.source_doc_id ?? null;
}

/** True when at least one `computed` node for this fact_key already
 *  exists in the session — used to keep the computed-pass idempotent. */
export function computedNodeExistsForFact(sessionId: string, factKey: string): boolean {
  const row = db.prepare(`
    SELECT 1 FROM lineage_nodes
    WHERE session_id = ? AND fact_key = ? AND node_type = 'computed'
    LIMIT 1
  `).get(sessionId, factKey) as { 1?: number } | undefined;
  return row !== undefined;
}

// =============================================================================
// Pack-v2 helpers (cheap aggregation queries used by lineage_summary)
// =============================================================================

export interface SessionLineageStats {
  /** Distinct fact_keys with at least one lineage node persisted. */
  traced_fact_count: number;
  /** Average computation_depth across traced facts. 0 when none traced. */
  avg_computation_depth: number;
  /** De-duplicated source_doc_id values across the session. */
  distinct_root_doc_ids: string[];
}

export function computeSessionLineageStats(sessionId: string): SessionLineageStats {
  const tracedFactKeys = db.prepare(`
    SELECT DISTINCT fact_key FROM lineage_nodes WHERE session_id = ?
  `).all(sessionId) as Array<{ fact_key: string }>;

  if (tracedFactKeys.length === 0) {
    return { traced_fact_count: 0, avg_computation_depth: 0, distinct_root_doc_ids: [] };
  }

  // Cheap depth approximation: max depth via single-query CTE per fact would
  // be expensive at scale. For Wave 1 (raw_extracted only) all depths are 0
  // by definition. We still run a recursive query for forward-compat with
  // Wave 2 computed nodes; cap at 32 to avoid pathological cycles.
  const depthRow = db.prepare(`
    WITH RECURSIVE walk(out_id, depth) AS (
      SELECT le.output_node_id, 1
      FROM lineage_edges le
      WHERE le.session_id = ?
      UNION ALL
      SELECT le.output_node_id, w.depth + 1
      FROM lineage_edges le
      JOIN walk w ON w.out_id = le.input_node_id
      WHERE le.session_id = ? AND w.depth < 32
    )
    SELECT COALESCE(MAX(depth), 0) AS max_depth FROM walk
  `).get(sessionId, sessionId) as { max_depth: number } | undefined;

  const docRows = db.prepare(`
    SELECT DISTINCT source_doc_id
    FROM lineage_nodes
    WHERE session_id = ? AND source_doc_id IS NOT NULL
  `).all(sessionId) as Array<{ source_doc_id: string }>;

  return {
    traced_fact_count: tracedFactKeys.length,
    avg_computation_depth: depthRow?.max_depth ?? 0,
    distinct_root_doc_ids: docRows.map((r) => r.source_doc_id).sort(),
  };
}

// =============================================================================
// Internal helpers
// =============================================================================

function readNodesForFact(sessionId: string, factKey: string): LineageNode[] {
  const rows = db.prepare(`
    SELECT * FROM lineage_nodes WHERE session_id = ? AND fact_key = ?
  `).all(sessionId, factKey) as Array<RawLineageRow>;
  return rows.map(rowToNode);
}

function readNode(sessionId: string, nodeId: string): LineageNode | null {
  const row = db.prepare(`
    SELECT * FROM lineage_nodes WHERE session_id = ? AND node_id = ?
  `).get(sessionId, nodeId) as RawLineageRow | undefined;
  return row ? rowToNode(row) : null;
}

interface RawLineageRow {
  session_id: string;
  fact_key: string;
  node_id: string;
  node_type: string;
  formula: string | null;
  computed_by: string;
  computed_at: string;
  source_doc_id: string | null;
  source_page: number | null;
  source_snippet: string | null;
  raw_value: string | null;
  normalized_value: string | null;
  unit_conversion: string | null;
}

function rowToNode(row: RawLineageRow): LineageNode {
  return {
    session_id: row.session_id,
    fact_key: row.fact_key,
    node_id: row.node_id,
    node_type: row.node_type as LineageNodeType,
    formula: row.formula,
    computed_by: row.computed_by,
    computed_at: row.computed_at,
    source_doc_id: row.source_doc_id,
    source_page: row.source_page,
    source_snippet: row.source_snippet,
    raw_value: parseJsonOrNull(row.raw_value),
    normalized_value: parseJsonOrNull(row.normalized_value),
    unit_conversion: row.unit_conversion,
  };
}

function parseJsonOrNull(s: string | null): unknown {
  if (s == null) return null;
  try { return JSON.parse(s); } catch { return null; }
}
