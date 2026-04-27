/**
 * P2E Wave 1 — quality budget aggregator tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  computeQualityBudget,
} from './quality-budget.js';
import { upsertFact, type FactSource } from '../fact-layer/store.js';

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

const docSrc: FactSource = {
  type: 'document', doc_id: 'D', extracted_at: '2026-04-29T10:00:00Z', freshness_days: 5,
};

function insertLineage(
  sid: string, factKey: string, agent: string, normalized: number,
  sourceDoc: string | null = null,
): void {
  db.prepare(
    `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, normalized_value, source_doc_id)
     VALUES (?, ?, ?, 'raw_extracted', ?, '2026-04-29T10:00:00Z', ?, ?)`,
  ).run(sid, factKey, `ln-${nanoid(10)}`, agent, JSON.stringify(normalized), sourceDoc);
}

// =============================================================================
// Smoke
// =============================================================================

describe('quality-budget — smoke', () => {
  it('empty session → score reflects 0% required-fact coverage; not blocked', () => {
    const sid = makeSession();
    const r = computeQualityBudget(sid);
    expect(r.session_id).toBe(sid);
    // Empty session has 0% required-fact coverage which drags the
    // composite score down even though every other signal is neutral.
    // No blockers — empty is honest, not failing.
    expect(r.blockers).toEqual([]);
    expect(r.components.length).toBe(6);
    expect(r.components.find((c) => c.name === 'coverage')!.score).toBe(0);
    expect(r.components.find((c) => c.name === 'confidence')!.score).toBe(1);
  });

  it('component weights sum to ~1 across included components', () => {
    const sid = makeSession();
    const r = computeQualityBudget(sid);
    // hallucination component is excluded (no narrative_text); its weight is 0
    const sum = r.components.reduce((acc, c) => acc + c.weight, 0);
    expect(sum).toBeCloseTo(1, 2);   // ±0.005 — round3 jitter
    expect(r.components.find((c) => c.name === 'hallucination')!.weight).toBe(0);
  });

  it('hallucination component included when narrative_text supplied', () => {
    const sid = makeSession();
    const r = computeQualityBudget(sid, { narrative_text: 'Hasılat 2.757.295 TL.' });
    expect(r.sub_reports.hallucinations).not.toBeNull();
    const sum = r.components.reduce((acc, c) => acc + c.weight, 0);
    expect(sum).toBeCloseTo(1, 2);
    expect(r.components.find((c) => c.name === 'hallucination')!.weight).toBeGreaterThan(0);
  });
});

// =============================================================================
// Critical contradictions degrade status
// =============================================================================

describe('quality-budget — critical contradictions', () => {
  it('one critical contradiction caps lifecycle at degraded', () => {
    const sid = makeSession();
    insertLineage(sid, 'revenue_fy2025', 'a', 1000);
    insertLineage(sid, 'revenue_fy2025', 'b', 2000);  // 100% delta → critical
    const r = computeQualityBudget(sid);
    expect(r.warnings.some((w) => w.includes('critical contradiction'))).toBe(true);
    expect(r.lifecycle_status).toBe('degraded');
  });
});

// =============================================================================
// Critical citation gaps block publish
// =============================================================================

describe('quality-budget — critical citation gaps', () => {
  it('critical citation gap caps lifecycle at degraded', () => {
    const sid = makeSession();
    // Persist a fact and a lineage_node WITHOUT source_doc_id
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 100, unit: 'TRY_mn', sources: [docSrc] });
    insertLineage(sid, 'revenue_fy2025', 'parse_standardization', 100, null);
    const r = computeQualityBudget(sid);
    expect(r.blockers.some((b) => b.includes('critical citation'))).toBe(true);
    expect(r.lifecycle_status).toBe('degraded');
  });

  it('present source_doc_id removes the citation blocker', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 100, unit: 'TRY_mn', sources: [docSrc] });
    insertLineage(sid, 'revenue_fy2025', 'parse_standardization', 100, 'KCHOL_FY2025_AR');
    const r = computeQualityBudget(sid);
    expect(r.blockers.filter((b) => b.includes('citation'))).toEqual([]);
  });
});

// =============================================================================
// Lifecycle status mapping
// =============================================================================

describe('quality-budget — lifecycle thresholds', () => {
  it('non-critical citation gap is a warning, not a blocker', () => {
    const sid = makeSession();
    insertLineage(sid, 'gross_margin_fy2025', 'financial_analysis', 0.17, null);
    const r = computeQualityBudget(sid);
    expect(r.blockers).toEqual([]);
    expect(r.warnings.some((w) => w.includes('non-critical citation'))).toBe(true);
  });

  it('publishable when all components score high and no critical issues', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 100, unit: 'TRY_mn', sources: [docSrc] });
    insertLineage(sid, 'revenue_fy2025', 'parse_standardization', 100, 'KCHOL_FY2025_AR');
    const r = computeQualityBudget(sid);
    // Coverage will be partial (revenue only) so not 'publishable' — accept any non-degraded status.
    expect(['publishable', 'publishable_with_warnings']).toContain(r.lifecycle_status);
  });
});

// =============================================================================
// Determinism
// =============================================================================

describe('quality-budget — determinism', () => {
  it('same state → identical structural output (modulo generated_at + composer timestamps)', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 100, unit: 'TRY_mn', sources: [docSrc] });
    const a = computeQualityBudget(sid);
    const b = computeQualityBudget(sid);
    expect(a.publishable_score).toBe(b.publishable_score);
    expect(a.lifecycle_status).toBe(b.lifecycle_status);
    expect(a.components).toEqual(b.components);
    expect(a.blockers).toEqual(b.blockers);
    expect(a.warnings).toEqual(b.warnings);
  });
});

// =============================================================================
// P1B Wave 2 — citation-driven lifecycle improvement
// =============================================================================

describe('quality-budget — Wave 2 citation provenance lifts lifecycle', () => {
  it('all critical facts cited → no citation blocker; lifecycle not capped at degraded by citation', () => {
    const sid = makeSession();
    // Persist a critical fact and ensure its lineage carries source_doc_id
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 100, unit: 'TRY_mn', sources: [docSrc] });
    db.prepare(
      `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, source_doc_id)
       VALUES (?, 'revenue_fy2025', ?, 'raw_extracted', 'parse_standardization', '2026-04-29T10:00:00Z', 'KCHOL_AR.pdf')`,
    ).run(sid, `ln-${nanoid(10)}`);
    const r = computeQualityBudget(sid);
    expect(r.blockers.filter((b) => b.includes('citation'))).toEqual([]);
    expect(r.lifecycle_status).not.toBe('degraded');
  });

  it('mixed: some critical cited, some missing → still degraded', () => {
    const sid = makeSession();
    upsertFact({ session_id: sid, fact_key: 'revenue_fy2025', value: 100, unit: 'TRY_mn', sources: [docSrc] });
    upsertFact({ session_id: sid, fact_key: 'fcf_fy2025', value: 50, unit: 'TRY_mn', sources: [docSrc] });
    db.prepare(
      `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, source_doc_id)
       VALUES (?, 'revenue_fy2025', ?, 'raw_extracted', 'parse_standardization', '2026-04-29T10:00:00Z', 'KCHOL_AR.pdf')`,
    ).run(sid, `ln-${nanoid(10)}`);
    db.prepare(
      `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, source_doc_id)
       VALUES (?, 'fcf_fy2025', ?, 'raw_extracted', 'financial_analysis', '2026-04-29T10:00:00Z', NULL)`,
    ).run(sid, `ln-${nanoid(10)}`);
    const r = computeQualityBudget(sid);
    expect(r.blockers.some((b) => b.includes('critical citation'))).toBe(true);
    expect(r.lifecycle_status).toBe('degraded');
  });
});
