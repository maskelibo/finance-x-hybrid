/**
 * P1B Wave 1 — lineage module tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  recordLineageNode,
  tryRecordLineageNode,
  getLineageTrail,
  buildLineageTrail,
  computeSessionLineageStats,
  type LineageNodeInput,
} from './lineage.js';

const sessions: string[] = [];

function makeSession(): string {
  const id = `t-${nanoid(8)}`;
  db.prepare(
    `INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at)
     VALUES (?, 'TEST', 'standard_institutional', 'pending', ?)`,
  ).run(id, new Date().toISOString());
  sessions.push(id);
  return id;
}

afterEach(() => {
  while (sessions.length > 0) {
    const id = sessions.pop()!;
    db.prepare(`DELETE FROM analysis_sessions WHERE id = ?`).run(id);
  }
});

const baseNode = (overrides: Partial<LineageNodeInput> = {}): LineageNodeInput => ({
  session_id: 'unset',
  fact_key: 'revenue_fy2025',
  node_id: `ln-${nanoid(10)}`,
  node_type: 'raw_extracted',
  computed_by: 'parse_standardization',
  computed_at: '2026-04-27T10:00:00.000Z',
  ...overrides,
});

// =============================================================================
// recordLineageNode + getLineageTrail (single node)
// =============================================================================

describe('lineage — recordLineageNode + getLineageTrail (single node)', () => {
  it('persists a node and round-trips it via getLineageTrail', () => {
    const sid = makeSession();
    const nodeId = `ln-${nanoid(10)}`;
    recordLineageNode(baseNode({
      session_id: sid,
      node_id: nodeId,
      raw_value: 2_757_295_000_000,
      normalized_value: 2_757_295,
      unit_conversion: 'TRY → TRY_mn /1e6',
    }));
    const trail = getLineageTrail(sid, 'revenue_fy2025');
    expect(trail).not.toBeNull();
    expect(trail!.fact_key).toBe('revenue_fy2025');
    expect(trail!.nodes.length).toBe(1);
    expect(trail!.nodes[0].node_id).toBe(nodeId);
    expect(trail!.nodes[0].node_type).toBe('raw_extracted');
    expect(trail!.nodes[0].raw_value).toBe(2_757_295_000_000);
    expect(trail!.nodes[0].normalized_value).toBe(2_757_295);
    expect(trail!.nodes[0].unit_conversion).toBe('TRY → TRY_mn /1e6');
    expect(trail!.computation_depth).toBe(0); // raw-only
    expect(trail!.is_fully_traced).toBe(true);
  });

  it('getLineageTrail returns null for unknown fact', () => {
    const sid = makeSession();
    expect(getLineageTrail(sid, 'no_such_fact')).toBeNull();
  });

  it('buildLineageTrail is an alias of getLineageTrail', () => {
    expect(buildLineageTrail).toBe(getLineageTrail);
  });

  it('raw-only fact has computation_depth = 0', () => {
    const sid = makeSession();
    recordLineageNode(baseNode({ session_id: sid }));
    const trail = getLineageTrail(sid, 'revenue_fy2025');
    expect(trail!.computation_depth).toBe(0);
  });

  it('idempotent on duplicate node_id (INSERT OR IGNORE)', () => {
    const sid = makeSession();
    const nodeId = `ln-dup-${nanoid(8)}`;
    recordLineageNode(baseNode({ session_id: sid, node_id: nodeId, computed_by: 'first' }));
    recordLineageNode(baseNode({ session_id: sid, node_id: nodeId, computed_by: 'second' }));
    const trail = getLineageTrail(sid, 'revenue_fy2025');
    expect(trail!.nodes.length).toBe(1);
    expect(trail!.nodes[0].computed_by).toBe('first'); // first write wins
  });
});

// =============================================================================
// DAG semantics — multi-edge defensive
// =============================================================================

describe('lineage — DAG construction with edges', () => {
  it('walks upstream edges and computes depth correctly', () => {
    const sid = makeSession();
    // Two raw inputs; one computed output that depends on both.
    const inputA = `ln-${nanoid(10)}`;
    const inputB = `ln-${nanoid(10)}`;
    const output = `ln-${nanoid(10)}`;
    recordLineageNode(baseNode({ session_id: sid, fact_key: 'cash_fy2025', node_id: inputA }));
    recordLineageNode(baseNode({ session_id: sid, fact_key: 'debt_fy2025', node_id: inputB }));
    recordLineageNode(baseNode({
      session_id: sid,
      fact_key: 'net_debt_fy2025',
      node_id: output,
      node_type: 'computed',
      formula: 'debt - cash',
      input_node_ids: [inputA, inputB],
    }));
    const trail = getLineageTrail(sid, 'net_debt_fy2025');
    expect(trail).not.toBeNull();
    expect(trail!.nodes.length).toBe(3);
    expect(trail!.computation_depth).toBeGreaterThanOrEqual(1);
    expect(trail!.is_fully_traced).toBe(true);
  });

  it('edge pointing to a non-existent node sets is_fully_traced=false', () => {
    const sid = makeSession();
    const output = `ln-${nanoid(10)}`;
    const ghost = 'ln-ghost-does-not-exist';
    recordLineageNode(baseNode({
      session_id: sid,
      fact_key: 'orphan_fy2025',
      node_id: output,
      node_type: 'computed',
      input_node_ids: [ghost],
    }));
    const trail = getLineageTrail(sid, 'orphan_fy2025');
    expect(trail).not.toBeNull();
    expect(trail!.is_fully_traced).toBe(false);
  });

  it('duplicate edges are de-duplicated (PK collision OR IGNORE)', () => {
    const sid = makeSession();
    const inputA = `ln-${nanoid(10)}`;
    const output = `ln-${nanoid(10)}`;
    recordLineageNode(baseNode({ session_id: sid, fact_key: 'a', node_id: inputA }));
    recordLineageNode(baseNode({
      session_id: sid, fact_key: 'b', node_id: output, node_type: 'computed',
      input_node_ids: [inputA, inputA, inputA],
    }));
    const edgeRows = db.prepare(
      `SELECT COUNT(*) AS c FROM lineage_edges WHERE session_id = ? AND output_node_id = ?`,
    ).get(sid, output) as { c: number };
    expect(edgeRows.c).toBe(1);
  });

  it('skips empty / non-string input_node_ids defensively', () => {
    const sid = makeSession();
    const output = `ln-${nanoid(10)}`;
    recordLineageNode(baseNode({
      session_id: sid, fact_key: 'def', node_id: output,
      input_node_ids: ['', 'real-id', '' as unknown as string],
    }));
    const edgeRows = db.prepare(
      `SELECT COUNT(*) AS c FROM lineage_edges WHERE session_id = ? AND output_node_id = ?`,
    ).get(sid, output) as { c: number };
    expect(edgeRows.c).toBe(1);
  });
});

// =============================================================================
// Cross-session isolation
// =============================================================================

describe('lineage — cross-session isolation', () => {
  it('does not leak nodes from session A into session B', () => {
    const sa = makeSession();
    const sb = makeSession();
    recordLineageNode(baseNode({
      session_id: sa, fact_key: 'isolated_a', node_id: `ln-${nanoid(10)}`,
    }));
    expect(getLineageTrail(sb, 'isolated_a')).toBeNull();
  });

  it('two sessions with the same fact_key are independent', () => {
    const sa = makeSession();
    const sb = makeSession();
    recordLineageNode(baseNode({ session_id: sa, node_id: `ln-${nanoid(10)}`, computed_by: 'agent_a' }));
    recordLineageNode(baseNode({ session_id: sb, node_id: `ln-${nanoid(10)}`, computed_by: 'agent_b' }));
    expect(getLineageTrail(sa, 'revenue_fy2025')!.nodes[0].computed_by).toBe('agent_a');
    expect(getLineageTrail(sb, 'revenue_fy2025')!.nodes[0].computed_by).toBe('agent_b');
  });
});

// =============================================================================
// Source roots + provenance
// =============================================================================

describe('lineage — root source de-duplication', () => {
  it('de-dupes root_sources by (doc_id, page)', () => {
    const sid = makeSession();
    recordLineageNode(baseNode({
      session_id: sid, fact_key: 'r1', node_id: `ln-${nanoid(10)}`,
      source_doc_id: 'KCHOL_FY2025', source_page: 12,
    }));
    recordLineageNode(baseNode({
      session_id: sid, fact_key: 'r1', node_id: `ln-${nanoid(10)}`,
      source_doc_id: 'KCHOL_FY2025', source_page: 12, // duplicate
    }));
    recordLineageNode(baseNode({
      session_id: sid, fact_key: 'r1', node_id: `ln-${nanoid(10)}`,
      source_doc_id: 'KCHOL_FY2025', source_page: 14, // distinct page
    }));
    const trail = getLineageTrail(sid, 'r1');
    expect(trail!.root_sources.length).toBe(2);
  });

  it('omits root_sources when source_doc_id is null (Wave 1 honesty)', () => {
    const sid = makeSession();
    recordLineageNode(baseNode({
      session_id: sid, node_id: `ln-${nanoid(10)}`, source_doc_id: null,
    }));
    const trail = getLineageTrail(sid, 'revenue_fy2025');
    expect(trail!.root_sources).toEqual([]);
  });
});

// =============================================================================
// tryRecordLineageNode (best-effort)
// =============================================================================

describe('lineage — tryRecordLineageNode best-effort', () => {
  it('does not throw on success', () => {
    const sid = makeSession();
    expect(() => tryRecordLineageNode(baseNode({ session_id: sid, node_id: `ln-${nanoid(10)}` }))).not.toThrow();
  });

  it('does not throw when called against an invalid session id (FK fails) — swallows silently', () => {
    expect(() => tryRecordLineageNode(baseNode({
      session_id: 'session-that-does-not-exist',
      node_id: `ln-${nanoid(10)}`,
    }))).not.toThrow();
  });
});

// =============================================================================
// computeSessionLineageStats
// =============================================================================

describe('lineage — computeSessionLineageStats', () => {
  it('returns zeros for an empty session', () => {
    const sid = makeSession();
    const stats = computeSessionLineageStats(sid);
    expect(stats).toEqual({ traced_fact_count: 0, avg_computation_depth: 0, distinct_root_doc_ids: [] });
  });

  it('counts distinct fact_keys', () => {
    const sid = makeSession();
    recordLineageNode(baseNode({ session_id: sid, fact_key: 'a', node_id: `ln-${nanoid(10)}` }));
    recordLineageNode(baseNode({ session_id: sid, fact_key: 'b', node_id: `ln-${nanoid(10)}` }));
    recordLineageNode(baseNode({ session_id: sid, fact_key: 'a', node_id: `ln-${nanoid(10)}` }));
    expect(computeSessionLineageStats(sid).traced_fact_count).toBe(2);
  });

  it('returns sorted distinct_root_doc_ids', () => {
    const sid = makeSession();
    recordLineageNode(baseNode({
      session_id: sid, node_id: `ln-${nanoid(10)}`, source_doc_id: 'Z_DOC',
    }));
    recordLineageNode(baseNode({
      session_id: sid, node_id: `ln-${nanoid(10)}`, source_doc_id: 'A_DOC',
    }));
    expect(computeSessionLineageStats(sid).distinct_root_doc_ids).toEqual(['A_DOC', 'Z_DOC']);
  });
});

// =============================================================================
// Snippet capping
// =============================================================================

describe('lineage — defensive serialisation', () => {
  it('caps source_snippet at 240 chars', () => {
    const sid = makeSession();
    const long = 'X'.repeat(1000);
    const nid = `ln-${nanoid(10)}`;
    recordLineageNode(baseNode({ session_id: sid, node_id: nid, source_snippet: long, source_doc_id: 'D' }));
    const trail = getLineageTrail(sid, 'revenue_fy2025')!;
    expect(trail.nodes[0].source_snippet!.length).toBe(240);
  });
});

// =============================================================================
// P1B Wave 2 — DAG with computed nodes
// =============================================================================

describe('lineage — Wave 2 computed-DAG construction', () => {
  it('getLineageTrail walks 2-level DAG when a computed node references raw inputs', async () => {
    const sid = makeSession();
    const inputA = `ln-${nanoid(10)}`;
    const inputB = `ln-${nanoid(10)}`;
    const computed = `ln-${nanoid(10)}`;
    recordLineageNode(baseNode({ session_id: sid, fact_key: 'net_debt_fy2025', node_id: inputA, source_doc_id: 'X.pdf' }));
    recordLineageNode(baseNode({ session_id: sid, fact_key: 'ebitda_fy2025',   node_id: inputB, source_doc_id: 'X.pdf' }));
    recordLineageNode(baseNode({
      session_id: sid,
      fact_key: 'net_debt_to_ebitda_fy2025',
      node_id: computed,
      node_type: 'computed',
      formula: 'net_debt / ebitda',
      input_node_ids: [inputA, inputB],
    }));
    const trail = getLineageTrail(sid, 'net_debt_to_ebitda_fy2025')!;
    expect(trail.nodes.length).toBe(3);
    expect(trail.computation_depth).toBeGreaterThanOrEqual(1);
    expect(trail.is_fully_traced).toBe(true);
    // root_sources de-duped to one (both inputs have the same doc)
    expect(trail.root_sources.length).toBe(1);
    expect(trail.root_sources[0].doc_id).toBe('X.pdf');
  });

  it('formula_divergence annotation round-trips through unit_conversion field', () => {
    const sid = makeSession();
    const nid = `ln-${nanoid(10)}`;
    recordLineageNode(baseNode({
      session_id: sid,
      fact_key: 'roe_fy2025',
      node_id: nid,
      node_type: 'computed',
      formula: '(net_income / total_equity) * 100',
      unit_conversion: 'formula:(net_income / total_equity) * 100; formula_divergence: computed=3.17 vs FA-emitted=99.99 (96.83%)',
    }));
    const trail = getLineageTrail(sid, 'roe_fy2025')!;
    expect(trail.nodes[0].unit_conversion).toContain('formula_divergence');
  });
});
