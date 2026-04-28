/**
 * P7D Wave 1 — Explainability lineage-trail endpoint.
 *
 * Surfaces the per-fact derivation graph (lineage_nodes + lineage_edges)
 * so a UI panel can answer "Why is this number what it is?".
 *
 * Wave 1 ships ONLY the backend trail builder + GET endpoint. The
 * frontend React component is out of the CI test path and deferred.
 *
 * Pure read-only. No DB writes, no LLM, no network, no subprocess.
 * Default OFF: server.ts only registers the route under
 * LINEAGE_API_ENABLED='1'. With the flag unset, behaviour is
 * byte-identical to today (route is unregistered).
 */

import type { Express, Request, Response } from 'express';
import { db } from '../db.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LineageNode {
  node_id: string;
  fact_key: string;
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

export interface LineageEdge {
  input_node_id: string;
  output_node_id: string;
}

export interface LineageRootSource {
  doc_id: string;
  page: number | null;
}

export interface LineageTrail {
  session_id: string;
  fact_key: string;
  found: boolean;
  nodes: LineageNode[];
  edges: LineageEdge[];
  root_sources: LineageRootSource[];
  computed_by: string[];
  formulas: string[];
  generated_at: string;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

interface LineageNodeRow {
  node_id: string;
  fact_key: string;
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

interface LineageEdgeRow {
  input_node_id: string;
  output_node_id: string;
}

export function buildLineageTrail(sessionId: string, factKey: string): LineageTrail {
  const generatedAt = new Date().toISOString();
  if (
    typeof sessionId !== 'string' ||
    sessionId.length === 0 ||
    typeof factKey !== 'string' ||
    factKey.length === 0
  ) {
    return {
      session_id: String(sessionId ?? ''),
      fact_key: String(factKey ?? ''),
      found: false,
      nodes: [],
      edges: [],
      root_sources: [],
      computed_by: [],
      formulas: [],
      generated_at: generatedAt,
    };
  }

  const factNodes = db
    .prepare(
      `SELECT node_id, fact_key, node_type, formula, computed_by, computed_at,
              source_doc_id, source_page, source_snippet, raw_value,
              normalized_value, unit_conversion
       FROM lineage_nodes
       WHERE session_id = ? AND fact_key = ?
       ORDER BY computed_at ASC`,
    )
    .all(sessionId, factKey) as LineageNodeRow[];

  if (factNodes.length === 0) {
    return {
      session_id: sessionId,
      fact_key: factKey,
      found: false,
      nodes: [],
      edges: [],
      root_sources: [],
      computed_by: [],
      formulas: [],
      generated_at: generatedAt,
    };
  }

  // Walk edges backwards from the fact's nodes to find ancestors.
  const visited = new Set<string>(factNodes.map((n) => n.node_id));
  const queue: string[] = [...visited];
  const allNodes: Map<string, LineageNodeRow> = new Map();
  for (const n of factNodes) allNodes.set(n.node_id, n);

  const allEdges: LineageEdge[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const incoming = db
      .prepare(
        `SELECT input_node_id, output_node_id
         FROM lineage_edges
         WHERE session_id = ? AND output_node_id = ?`,
      )
      .all(sessionId, nodeId) as LineageEdgeRow[];
    for (const edge of incoming) {
      allEdges.push({ input_node_id: edge.input_node_id, output_node_id: edge.output_node_id });
      if (!visited.has(edge.input_node_id)) {
        visited.add(edge.input_node_id);
        queue.push(edge.input_node_id);
        const ancestor = db
          .prepare(
            `SELECT node_id, fact_key, node_type, formula, computed_by, computed_at,
                    source_doc_id, source_page, source_snippet, raw_value,
                    normalized_value, unit_conversion
             FROM lineage_nodes WHERE session_id = ? AND node_id = ?`,
          )
          .get(sessionId, edge.input_node_id) as LineageNodeRow | undefined;
        if (ancestor) allNodes.set(ancestor.node_id, ancestor);
      }
    }
  }

  const nodes: LineageNode[] = Array.from(allNodes.values());

  // Root sources: leaf raw_extracted nodes carrying a source_doc_id.
  const inputIds = new Set(allEdges.map((e) => e.output_node_id));
  const rootSources: LineageRootSource[] = [];
  for (const n of nodes) {
    const isLeaf = !inputIds.has(n.node_id);
    if (isLeaf && typeof n.source_doc_id === 'string' && n.source_doc_id.length > 0) {
      rootSources.push({ doc_id: n.source_doc_id, page: n.source_page });
    }
  }

  const computedBy = Array.from(new Set(nodes.map((n) => n.computed_by))).sort();
  const formulas = Array.from(new Set(nodes.map((n) => n.formula).filter((f): f is string => typeof f === 'string' && f.length > 0))).sort();

  return {
    session_id: sessionId,
    fact_key: factKey,
    found: true,
    nodes,
    edges: allEdges,
    root_sources: rootSources,
    computed_by: computedBy,
    formulas,
    generated_at: generatedAt,
  };
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function isLineageApiEnabled(): boolean {
  return process.env.LINEAGE_API_ENABLED === '1';
}

export function registerLineageRoutes(app: Express): void {
  app.get('/api/lineage/:sessionId/:factKey', (req: Request, res: Response) => {
    try {
      const params = req.params as { sessionId?: string; factKey?: string };
      const sessionId = params.sessionId ?? '';
      const factKey = params.factKey ?? '';
      if (!sessionId || !factKey) {
        res.status(400).json({ error: 'sessionId_and_factKey_required' });
        return;
      }
      const trail = buildLineageTrail(sessionId, factKey);
      if (!trail.found) {
        res.status(404).json({ error: 'lineage_not_found', session_id: sessionId, fact_key: factKey });
        return;
      }
      res.json(trail);
    } catch (err) {
      res.status(500).json({ error: 'lineage_query_failed' });
      console.warn('[lineage-routes] /lineage failed:', err instanceof Error ? err.message : err);
    }
  });
}
