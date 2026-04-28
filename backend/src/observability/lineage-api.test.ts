/**
 * P7D Wave 1 — lineage-trail unit tests.
 *
 * Uses the live SQLite (lineage_nodes + lineage_edges tables shipped at
 * P1B Wave 1). Tests insert TEST_LINEAGE_*-prefixed sessions and clean
 * up via DELETE.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express, { type Express } from 'express';
import { db } from '../db.js';
import { buildLineageTrail, isLineageApiEnabled, registerLineageRoutes } from './lineage-api.js';

const TEST_PREFIX = 'TEST_LINEAGE_';

function unique(label: string): string {
  return `${TEST_PREFIX}${label}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function insertSession(id: string): void {
  db.prepare(
    `INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at)
     VALUES (?, 'KCHOL', 'standard_institutional', 'running', '2026-04-28T10:00:00.000Z')`,
  ).run(id);
}

function insertNode(opts: {
  session_id: string;
  fact_key: string;
  node_id: string;
  node_type: string;
  computed_by: string;
  formula?: string | null;
  source_doc_id?: string | null;
  source_page?: number | null;
  raw_value?: string | null;
  normalized_value?: string | null;
}): void {
  db.prepare(
    `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, formula, computed_by,
                                computed_at, source_doc_id, source_page, source_snippet,
                                raw_value, normalized_value, unit_conversion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, NULL)`,
  ).run(
    opts.session_id,
    opts.fact_key,
    opts.node_id,
    opts.node_type,
    opts.formula ?? null,
    opts.computed_by,
    new Date().toISOString(),
    opts.source_doc_id ?? null,
    opts.source_page ?? null,
    opts.raw_value ?? null,
    opts.normalized_value ?? null,
  );
}

function insertEdge(session_id: string, input: string, output: string): void {
  db.prepare(`INSERT INTO lineage_edges (session_id, input_node_id, output_node_id) VALUES (?, ?, ?)`).run(
    session_id,
    input,
    output,
  );
}

function cleanup(): void {
  db.prepare(`DELETE FROM lineage_edges WHERE session_id LIKE ?`).run(`${TEST_PREFIX}%`);
  db.prepare(`DELETE FROM lineage_nodes WHERE session_id LIKE ?`).run(`${TEST_PREFIX}%`);
  db.prepare(`DELETE FROM analysis_sessions WHERE id LIKE ?`).run(`${TEST_PREFIX}%`);
}

beforeEach(() => {
  delete process.env.LINEAGE_API_ENABLED;
  cleanup();
});

afterEach(cleanup);

// =============================================================================
// buildLineageTrail
// =============================================================================

describe('buildLineageTrail', () => {
  it('returns found:false for unknown session/factKey pair', () => {
    const t = buildLineageTrail('no-session-xyz', 'no-fact');
    expect(t.found).toBe(false);
    expect(t.nodes).toEqual([]);
    expect(t.edges).toEqual([]);
  });

  it('returns found:false for empty inputs', () => {
    expect(buildLineageTrail('', 'x').found).toBe(false);
    expect(buildLineageTrail('x', '').found).toBe(false);
  });

  it('returns a single-node trail when fact has only a raw_extracted leaf', () => {
    const sid = unique('leaf');
    insertSession(sid);
    insertNode({
      session_id: sid,
      fact_key: 'revenue_fy2024',
      node_id: `${sid}_leaf1`,
      node_type: 'raw_extracted',
      computed_by: 'fact_extractor',
      source_doc_id: 'KCHOL_Q4_2024.pdf',
      source_page: 12,
      raw_value: '100000000',
      normalized_value: '100000000',
    });
    const t = buildLineageTrail(sid, 'revenue_fy2024');
    expect(t.found).toBe(true);
    expect(t.nodes.length).toBe(1);
    expect(t.edges).toEqual([]);
    expect(t.root_sources).toEqual([{ doc_id: 'KCHOL_Q4_2024.pdf', page: 12 }]);
    expect(t.computed_by).toEqual(['fact_extractor']);
  });

  it('walks edges backwards to ancestor nodes', () => {
    const sid = unique('chain');
    insertSession(sid);
    insertNode({
      session_id: sid,
      fact_key: 'ebitda_fy2024',
      node_id: `${sid}_root`,
      node_type: 'computed',
      computed_by: 'financial_engine',
      formula: 'operating_profit + depreciation',
    });
    insertNode({
      session_id: sid,
      fact_key: 'operating_profit_fy2024',
      node_id: `${sid}_op`,
      node_type: 'raw_extracted',
      computed_by: 'fact_extractor',
      source_doc_id: 'KCHOL_FY24.pdf',
      source_page: 8,
    });
    insertNode({
      session_id: sid,
      fact_key: 'depreciation_fy2024',
      node_id: `${sid}_dep`,
      node_type: 'raw_extracted',
      computed_by: 'fact_extractor',
      source_doc_id: 'KCHOL_FY24.pdf',
      source_page: 11,
    });
    insertEdge(sid, `${sid}_op`, `${sid}_root`);
    insertEdge(sid, `${sid}_dep`, `${sid}_root`);
    const t = buildLineageTrail(sid, 'ebitda_fy2024');
    expect(t.found).toBe(true);
    expect(t.nodes.length).toBe(3);
    expect(t.edges.length).toBe(2);
    const sources = t.root_sources.map((s) => `${s.doc_id}:${s.page}`).sort();
    expect(sources).toEqual(['KCHOL_FY24.pdf:11', 'KCHOL_FY24.pdf:8']);
    expect(t.computed_by.sort()).toEqual(['fact_extractor', 'financial_engine']);
    expect(t.formulas).toEqual(['operating_profit + depreciation']);
  });

  it('does not return nodes from other fact_keys in the same session', () => {
    const sid = unique('iso');
    insertSession(sid);
    insertNode({
      session_id: sid,
      fact_key: 'wanted_fact',
      node_id: `${sid}_w`,
      node_type: 'raw_extracted',
      computed_by: 'fact_extractor',
      source_doc_id: 'a.pdf',
      source_page: 1,
    });
    insertNode({
      session_id: sid,
      fact_key: 'unrelated_fact',
      node_id: `${sid}_u`,
      node_type: 'raw_extracted',
      computed_by: 'fact_extractor',
      source_doc_id: 'b.pdf',
      source_page: 1,
    });
    const t = buildLineageTrail(sid, 'wanted_fact');
    expect(t.nodes.length).toBe(1);
    expect(t.nodes[0].node_id).toBe(`${sid}_w`);
  });

  it('generated_at is ISO-8601', () => {
    const t = buildLineageTrail('x', 'y');
    expect(t.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  });
});

// =============================================================================
// isLineageApiEnabled
// =============================================================================

describe('isLineageApiEnabled', () => {
  it('returns false when unset', () => {
    delete process.env.LINEAGE_API_ENABLED;
    expect(isLineageApiEnabled()).toBe(false);
  });

  it("returns true only on strict '1'", () => {
    process.env.LINEAGE_API_ENABLED = '1';
    expect(isLineageApiEnabled()).toBe(true);
    process.env.LINEAGE_API_ENABLED = 'on';
    expect(isLineageApiEnabled()).toBe(false);
    delete process.env.LINEAGE_API_ENABLED;
  });
});

// =============================================================================
// registerLineageRoutes
// =============================================================================

function isRouteRegistered(app: Express, method: string, routePath: string): boolean {
  type LayerLite = { route?: { path?: string; methods?: Record<string, boolean> } };
  const stack = (app as unknown as { _router: { stack: LayerLite[] } })._router?.stack ?? [];
  return stack.some((l) => l.route?.path === routePath && l.route?.methods?.[method]);
}

describe('registerLineageRoutes', () => {
  it('registers GET /api/lineage/:sessionId/:factKey', () => {
    const app = express();
    registerLineageRoutes(app);
    expect(isRouteRegistered(app, 'get', '/api/lineage/:sessionId/:factKey')).toBe(true);
  });
});
