/**
 * P4A Wave 1 — escalation manager tests.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db } from '../db.js';
import {
  runEscalationManager,
  recordEscalationReport,
  ESCALATION_REASON_CODES,
  ESCALATION_CONTEXT_KEYS,
  LEVEL_RANK,
  ACTION_BY_LEVEL,
  type EscalationManagerInputs,
  type EscalationReport,
  type EscalationLevel,
  type SourceModule,
} from './escalation-manager.js';
import { runTaskPlanner } from './task-planner.js';
import { runIncrementalComputation } from './incremental.js';
import { runCostGovernor } from './cost-governor.js';
import { computeQualityBudget } from '../quality-os/quality-budget.js';
import { detectContradictions } from '../quality-os/contradiction-engine.js';
import { detectCitationGaps } from '../quality-os/citation-enforcement.js';
import { computeCoverageReport } from '../quality-os/coverage-engine.js';
import { runDeterministicChairmanQuestions } from '../quality-os/chairman-questions-deterministic.js';
import { upsertFact, type FactSource } from '../fact-layer/store.js';
import { recordSessionMethodology } from '../fact-layer/methodology.js';
import type { PreflightDecision } from './preflight.js';
import type { TaskPlan, SkippedTask } from './task-planner.js';
import type { ComputationPlan, ComputationVerdict } from './incremental.js';
import type { CostGovernorReport } from './cost-governor.js';
import type { QualityBudgetReport } from '../quality-os/quality-budget.js';
import type { ContradictionReport } from '../quality-os/contradiction-engine.js';
import type { CitationReport } from '../quality-os/citation-enforcement.js';
import type { CoverageReport } from '../quality-os/coverage-engine.js';
import type { DeterministicChairmanReport } from '../quality-os/chairman-questions-deterministic.js';

// =============================================================================
// Fixtures
// =============================================================================

const sessions: string[] = [];

function makeSession(ticker = 'KCHOL'): string {
  const id = `em-${nanoid(8)}`;
  db.prepare(
    `INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at)
     VALUES (?, ?, 'standard_institutional', 'pending', ?)`,
  ).run(id, ticker, new Date().toISOString());
  sessions.push(id);
  return id;
}

afterEach(() => {
  while (sessions.length > 0) {
    const id = sessions.pop()!;
    db.prepare(`DELETE FROM session_methodology WHERE session_id = ?`).run(id);
    db.prepare(`DELETE FROM lineage_nodes WHERE session_id = ?`).run(id);
    db.prepare(`DELETE FROM canonical_facts WHERE session_id = ?`).run(id);
    db.prepare(`DELETE FROM analysis_sessions WHERE id = ?`).run(id);
  }
});

const docSrc: FactSource = {
  type: 'document', doc_id: 'D', extracted_at: '2026-04-29T10:00:00Z', freshness_days: 5,
};

function insertLineage(
  sid: string, factKey: string, agent: string,
  sourceDoc: string | null = null, normalized: number | null = null,
): void {
  db.prepare(
    `INSERT INTO lineage_nodes (session_id, fact_key, node_id, node_type, computed_by, computed_at, normalized_value, source_doc_id)
     VALUES (?, ?, ?, 'raw_extracted', ?, '2026-04-29T10:00:00Z', ?, ?)`,
  ).run(sid, factKey, `ln-${nanoid(10)}`, agent, normalized !== null ? JSON.stringify(normalized) : null, sourceDoc);
}

function makePublishableSession(): string {
  const sid = makeSession();
  recordSessionMethodology(sid);
  const cited: Array<[string, number]> = [
    ['revenue_fy2025', 100], ['ebitda_fy2025', 30], ['net_debt_fy2025', 10],
    ['fcf_fy2025', 20], ['roe_fy2025', 0.15],
    ['net_debt_to_ebitda_fy2025', 0.33], ['net_income_fy2025', 18],
  ];
  for (const [k, v] of cited) {
    upsertFact({
      session_id: sid, fact_key: k, value: v, unit: 'TRY_mn',
      sources: [docSrc],
      confidence_inputs: {
        sources: [{ type: 'document', doc_id: 'D', extracted_at: '2026-04-29T10:00:00Z', freshness_days: 5 }],
        computation_complexity: 0,
      },
    });
    insertLineage(sid, k, 'parse_standardization', 'KCHOL_FY2025_AR.pdf', v);
  }
  return sid;
}

// -- Synthetic input builders ---------------------------------------------------

function preflightWithBlocker(): PreflightDecision {
  return {
    action: 'abort', reason_codes: ['TICKER_UNKNOWN'],
    findings: [{
      validator: 'V1_ticker_known', reason_code: 'TICKER_UNKNOWN',
      severity: 'blocker', details: 'unknown ticker',
    }],
    blockers_count: 1, warnings_count: 0, info_count: 0,
    generated_at: '2026-04-28T00:00:00Z',
  };
}

function preflightWithWarning(): PreflightDecision {
  return {
    action: 'proceed', reason_codes: ['DATA_FACT_PACK_EMPTY'],
    findings: [{
      validator: 'V2_fact_pack_available', reason_code: 'DATA_FACT_PACK_EMPTY',
      severity: 'warning', details: 'empty pack',
    }],
    blockers_count: 0, warnings_count: 1, info_count: 0,
    generated_at: '2026-04-28T00:00:00Z',
  };
}

function taskPlanWithSkippedTasks(skips: Array<Pick<SkippedTask, 'kind' | 'reason_codes'>>): TaskPlan {
  return {
    session_id: 'tp', ticker: 'KCHOL', generated_at: 'x',
    planned_tasks: [],
    skipped_tasks: skips.map((s, i) => ({
      task_id: `tp-${i}`, kind: s.kind, reason_codes: s.reason_codes, details: '',
    })),
    total_estimated_cost_usd: 0, reason_codes: [], warnings: [],
  };
}

function computationPlanWithInvalidations(
  options: { withMethodologyDrift?: boolean } = {},
): ComputationPlan {
  const verdict: ComputationVerdict = {
    task_id: 'tp-x', kind: 'financial_analysis',
    decision: 'invalidate',
    reason_codes: options.withMethodologyDrift
      ? ['INVALIDATION_METHODOLOGY_DRIFT']
      : ['INVALIDATION_INPUT_HASH_MISMATCH'],
    invalidation_reasons: ['x'],
    reused_output_keys: [],
    dirty_sub_keys: [],
    estimated_cost_saved_usd: 0,
    computed_input_fingerprint: 'fp',
  };
  return {
    session_id: 's', ticker: 'KCHOL', generated_at: 'x',
    computation_decision: [verdict],
    affected_tasks: [],
    invalidation_reasons: [],
    reused_outputs: [],
    recompute_tasks: ['financial_analysis'],
    estimated_cost_saved_usd: 0,
    warnings: [],
  };
}

function costGovernorReportStub(opts: {
  stop_reasons?: string[];
  reason_codes?: string[];
  downgraded_count?: number;
  remaining?: number;
} = {}): CostGovernorReport {
  return {
    session_id: 's', ticker: 'KCHOL', generated_at: 'x',
    budget_status: 'within_budget',
    allowed_tasks: [],
    downgraded_tasks: Array.from({ length: opts.downgraded_count ?? 0 }, (_, i) => ({
      task_id: `tp-${i}`, kind: 'val_dcf' as const, decision: 'downgrade_model' as const,
      reason_codes: ['GOV_DOWNGRADE_MODEL_TIER'],
      recommended_model_tier: 'economy' as const,
      effective_cost_usd: 0.32, original_cost_usd: 0.80, cost_savings_usd: 0.48,
    })),
    skipped_tasks: [],
    stop_reasons: opts.stop_reasons ?? [],
    projected_cost_usd: 0,
    remaining_budget_usd: opts.remaining ?? 5,
    estimated_savings_usd: 0,
    reason_codes: opts.reason_codes ?? [],
    warnings: [],
  };
}

function qualityBudgetStub(lifecycle: QualityBudgetReport['lifecycle_status']): QualityBudgetReport {
  return {
    session_id: 's',
    publishable_score: lifecycle === 'publishable' ? 0.95 : 0.5,
    lifecycle_status: lifecycle,
    components: [],
    blockers: lifecycle === 'hold' || lifecycle === 'degraded' ? ['blk1'] : [],
    warnings: lifecycle === 'publishable_with_warnings' ? ['warn1'] : [],
    sub_reports: {} as never,
    generated_at: 'x',
  };
}

function contradictionStub(critical: number): ContradictionReport {
  return {
    session_id: 's', total_conflicts: critical,
    by_severity: { critical, material: 0, soft: 0 },
    conflicts: [], overall_consistency_score: critical > 0 ? 0.5 : 1,
  };
}

function citationStub(criticalGaps: number): CitationReport {
  return {
    session_id: 's', total_facts_with_lineage: 5,
    facts_with_citation: 5 - criticalGaps,
    facts_missing_citation: criticalGaps,
    critical_gaps: Array.from({ length: criticalGaps }, (_, i) => ({
      fact_key: `revenue_fy202${i}`, severity: 'critical' as const,
      writers: ['parse_standardization'], node_count: 1,
    })),
    non_critical_gaps: [],
    coverage_ratio: 1 - criticalGaps / 5,
  };
}

function coverageStub(missing: number): CoverageReport {
  return {
    session_id: 's', total_required: 10,
    total_present: 10 - missing,
    total_missing: missing,
    overall_coverage: (10 - missing) / 10,
    by_category: [],
    all_missing_stems: Array.from({ length: missing }, (_, i) => `stem_${i}`),
  };
}

function chairmanReportWithP0(): DeterministicChairmanReport {
  return {
    ticker: 'KCHOL', session_id: 's', generated_at: 'x',
    questions: [{
      question_id: 'dcq-abc', severity: 'P0', category: 'leverage',
      trigger_facts: ['net_debt_to_ebitda_fy2025'],
      question: 'Q?', why_it_matters: 'because',
      expected_answer_location: 'financial_analysis > leverage',
      evidence_fact_keys: ['net_debt_to_ebitda_fy2025'],
      confidence: 'high',
    }],
    by_severity: { P0: 1, P1: 0, P2: 0 },
    by_category: {
      leverage: 1, liquidity: 0, profitability_margin: 0,
      profitability_negative: 0, data_quality: 0, citation_gap: 0, contradiction: 0,
    },
    total_count: 1, warnings: [],
  };
}

// =============================================================================
// Smoke
// =============================================================================

describe('escalation-manager — smoke', () => {
  it('async signature returns a Promise', () => {
    const ret = runEscalationManager('s', {});
    expect(ret).toBeInstanceOf(Promise);
  });

  it('no inputs → escalation_level=info, action=proceed, single overall code', async () => {
    const r = await runEscalationManager('s', {});
    expect(r.escalation_level).toBe('info');
    expect(r.action).toBe('proceed');
    expect(r.findings).toEqual([]);
    expect(r.affected_modules).toEqual([]);
    expect(r.recommended_next_steps).toEqual([]);
    expect(r.blockers).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.reason_codes).toEqual([ESCALATION_REASON_CODES.ESC_OVERALL_PROCEED]);
  });

  it('determinism: same inputs → same structural output mod generated_at', async () => {
    const inputs: EscalationManagerInputs = {
      quality_budget: qualityBudgetStub('publishable_with_warnings'),
      contradiction_report: contradictionStub(1),
    };
    const a = await runEscalationManager('s', inputs);
    const b = await runEscalationManager('s', inputs);
    const norm = (p: EscalationReport): unknown =>
      JSON.parse(JSON.stringify(p, (k, v) => k === 'generated_at' ? null : v));
    expect(norm(a)).toEqual(norm(b));
  });

  it('level ordering is strict: info < warning < needs_review < hold < abort', () => {
    expect(LEVEL_RANK.info).toBeLessThan(LEVEL_RANK.warning);
    expect(LEVEL_RANK.warning).toBeLessThan(LEVEL_RANK.needs_review);
    expect(LEVEL_RANK.needs_review).toBeLessThan(LEVEL_RANK.hold);
    expect(LEVEL_RANK.hold).toBeLessThan(LEVEL_RANK.abort);
    // Action mapping is 1:1
    const levels: EscalationLevel[] = ['info', 'warning', 'needs_review', 'hold', 'abort'];
    const actions = levels.map((l) => ACTION_BY_LEVEL[l]);
    expect(new Set(actions).size).toBe(5);
  });
});

// =============================================================================
// Per-source escalations — one positive test per ESC_* code
// =============================================================================

describe('escalation-manager — per-source ESC_* codes', () => {
  it('ESC_PREFLIGHT_BLOCKER → abort', async () => {
    const r = await runEscalationManager('s', {
      preflight_decisions: [preflightWithBlocker()],
    });
    expect(r.escalation_level).toBe('abort');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_PREFLIGHT_BLOCKER && f.level === 'abort')).toBe(true);
  });

  it('ESC_PREFLIGHT_WARNING → warning', async () => {
    const r = await runEscalationManager('s', {
      preflight_decisions: [preflightWithWarning()],
    });
    expect(r.escalation_level).toBe('warning');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_PREFLIGHT_WARNING && f.level === 'warning')).toBe(true);
  });

  it('ESC_PLANNER_SKIP_ABORT → hold', async () => {
    const r = await runEscalationManager('s', {
      task_plan: taskPlanWithSkippedTasks([
        { kind: 'val_dcf', reason_codes: ['SKIP_PREFLIGHT_ABORT'] },
      ]),
    });
    expect(r.escalation_level).toBe('hold');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_PLANNER_SKIP_ABORT && f.level === 'hold')).toBe(true);
  });

  it('ESC_PLANNER_PREDECESSOR_FAILURE → hold', async () => {
    const r = await runEscalationManager('s', {
      task_plan: taskPlanWithSkippedTasks([
        { kind: 'financial_analysis', reason_codes: ['SKIP_PREDECESSOR_FAILED'] },
      ]),
    });
    expect(r.escalation_level).toBe('hold');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_PLANNER_PREDECESSOR_FAILURE)).toBe(true);
  });

  it('ESC_INCREMENTAL_INVALIDATION → warning', async () => {
    const r = await runEscalationManager('s', {
      computation_plan: computationPlanWithInvalidations({}),
    });
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_INCREMENTAL_INVALIDATION && f.level === 'warning')).toBe(true);
  });

  it('ESC_INCREMENTAL_METHODOLOGY_DRIFT → needs_review', async () => {
    const r = await runEscalationManager('s', {
      computation_plan: computationPlanWithInvalidations({ withMethodologyDrift: true }),
    });
    expect(r.escalation_level).toBe('needs_review');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_INCREMENTAL_METHODOLOGY_DRIFT)).toBe(true);
  });

  it('ESC_COST_BUDGET_EXHAUSTED → abort', async () => {
    const r = await runEscalationManager('s', {
      cost_governor_report: costGovernorReportStub({
        stop_reasons: ['GOV_STOP_BUDGET_EXHAUSTED'],
      }),
    });
    expect(r.escalation_level).toBe('abort');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_COST_BUDGET_EXHAUSTED)).toBe(true);
  });

  it('ESC_COST_TIGHT_HEADROOM → warning', async () => {
    const r = await runEscalationManager('s', {
      cost_governor_report: costGovernorReportStub({
        reason_codes: ['GOV_TIGHT_HEADROOM_BELOW_TEN_PERCENT'],
        remaining: 0.05,
      }),
    });
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_COST_TIGHT_HEADROOM)).toBe(true);
  });

  it('ESC_COST_DOWNGRADE_RECOMMENDED → info', async () => {
    const r = await runEscalationManager('s', {
      cost_governor_report: costGovernorReportStub({ downgraded_count: 1 }),
    });
    expect(r.escalation_level).toBe('info');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_COST_DOWNGRADE_RECOMMENDED && f.level === 'info')).toBe(true);
  });

  it('ESC_QUALITY_LIFECYCLE_HOLD → abort', async () => {
    const r = await runEscalationManager('s', {
      quality_budget: qualityBudgetStub('hold'),
    });
    expect(r.escalation_level).toBe('abort');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_HOLD)).toBe(true);
  });

  it('ESC_QUALITY_LIFECYCLE_DEGRADED → hold', async () => {
    const r = await runEscalationManager('s', {
      quality_budget: qualityBudgetStub('degraded'),
    });
    expect(r.escalation_level).toBe('hold');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_DEGRADED)).toBe(true);
  });

  it('ESC_QUALITY_LIFECYCLE_PWW → warning', async () => {
    const r = await runEscalationManager('s', {
      quality_budget: qualityBudgetStub('publishable_with_warnings'),
    });
    expect(r.escalation_level).toBe('warning');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_PWW)).toBe(true);
  });

  it('ESC_QUALITY_LIFECYCLE_publishable → no quality finding', async () => {
    const r = await runEscalationManager('s', {
      quality_budget: qualityBudgetStub('publishable'),
    });
    expect(r.escalation_level).toBe('info');
    expect(r.findings).toEqual([]);
  });

  it('ESC_CONTRADICTION_CRITICAL → needs_review', async () => {
    const r = await runEscalationManager('s', {
      contradiction_report: contradictionStub(1),
    });
    expect(r.escalation_level).toBe('needs_review');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_CONTRADICTION_CRITICAL)).toBe(true);
  });

  it('ESC_CITATION_CRITICAL_GAP → needs_review', async () => {
    const r = await runEscalationManager('s', {
      citation_report: citationStub(2),
    });
    expect(r.escalation_level).toBe('needs_review');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_CITATION_CRITICAL_GAP)).toBe(true);
  });

  it('ESC_COVERAGE_GAP → warning', async () => {
    const r = await runEscalationManager('s', {
      coverage_report: coverageStub(3),
    });
    expect(r.escalation_level).toBe('warning');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_COVERAGE_GAP)).toBe(true);
  });

  it('ESC_CHAIRMAN_P0_QUESTION → needs_review', async () => {
    const r = await runEscalationManager('s', {
      chairman_report: chairmanReportWithP0(),
    });
    expect(r.escalation_level).toBe('needs_review');
    expect(r.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_CHAIRMAN_P0_QUESTION)).toBe(true);
  });
});

// =============================================================================
// Overall code derivation
// =============================================================================

describe('escalation-manager — overall code derivation', () => {
  it('ESC_OVERALL_PROCEED — info-only inputs', async () => {
    const r = await runEscalationManager('s', {
      cost_governor_report: costGovernorReportStub({ downgraded_count: 1 }),
    });
    expect(r.action).toBe('proceed');
    expect(r.reason_codes).toContain(ESCALATION_REASON_CODES.ESC_OVERALL_PROCEED);
  });

  it('ESC_OVERALL_PROCEED_WITH_WARNING — warning is max', async () => {
    const r = await runEscalationManager('s', {
      coverage_report: coverageStub(2),
    });
    expect(r.action).toBe('proceed_with_warning');
    expect(r.reason_codes).toContain(ESCALATION_REASON_CODES.ESC_OVERALL_PROCEED_WITH_WARNING);
  });

  it('ESC_OVERALL_REQUEST_REVIEW — needs_review is max', async () => {
    const r = await runEscalationManager('s', {
      contradiction_report: contradictionStub(1),
    });
    expect(r.action).toBe('request_review');
    expect(r.reason_codes).toContain(ESCALATION_REASON_CODES.ESC_OVERALL_REQUEST_REVIEW);
  });

  it('ESC_OVERALL_RETRY_OR_RECOMPUTE — hold is max', async () => {
    const r = await runEscalationManager('s', {
      task_plan: taskPlanWithSkippedTasks([
        { kind: 'val_dcf', reason_codes: ['SKIP_PREFLIGHT_ABORT'] },
      ]),
    });
    expect(r.action).toBe('retry_or_recompute');
    expect(r.reason_codes).toContain(ESCALATION_REASON_CODES.ESC_OVERALL_RETRY_OR_RECOMPUTE);
  });

  it('ESC_OVERALL_STOP_SESSION — abort is max (overrides all)', async () => {
    const r = await runEscalationManager('s', {
      quality_budget: qualityBudgetStub('hold'),
      coverage_report: coverageStub(3),  // warning
      contradiction_report: contradictionStub(2),  // needs_review
    });
    expect(r.action).toBe('stop_session');
    expect(r.reason_codes).toContain(ESCALATION_REASON_CODES.ESC_OVERALL_STOP_SESSION);
    expect(r.blockers.length).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// Determinism + ordering
// =============================================================================

describe('escalation-manager — ordering invariants', () => {
  it('findings sorted by (level desc, source asc, reason_code asc)', async () => {
    const r = await runEscalationManager('s', {
      preflight_decisions: [preflightWithBlocker()],          // abort, preflight
      coverage_report: coverageStub(1),                        // warning, coverage
      contradiction_report: contradictionStub(1),              // needs_review, contradiction
      cost_governor_report: costGovernorReportStub({           // info, cost_governor
        downgraded_count: 1,
      }),
    });
    // Expected order: abort(preflight) > needs_review(contradiction) > warning(coverage) > info(cost_governor)
    const order = r.findings.map((f) => f.level);
    for (let i = 1; i < order.length; i++) {
      expect(LEVEL_RANK[order[i - 1]]).toBeGreaterThanOrEqual(LEVEL_RANK[order[i]]);
    }
  });

  it('affected_modules is sorted-unique', async () => {
    const r = await runEscalationManager('s', {
      preflight_decisions: [preflightWithBlocker()],
      task_plan: taskPlanWithSkippedTasks([
        { kind: 'val_dcf', reason_codes: ['SKIP_PREFLIGHT_ABORT'] },
      ]),
    });
    const sorted = [...r.affected_modules].sort();
    expect(r.affected_modules).toEqual(sorted);
    expect(new Set(r.affected_modules).size).toBe(r.affected_modules.length);
  });

  it('recommended_next_steps ordered by max-level-of-source desc', async () => {
    const r = await runEscalationManager('s', {
      coverage_report: coverageStub(1),                        // warning, coverage
      quality_budget: qualityBudgetStub('hold'),               // abort, quality_budget
    });
    // quality_budget step should come BEFORE coverage step
    const qbIdx = r.recommended_next_steps.findIndex((s) => s.startsWith('quality_budget:'));
    const covIdx = r.recommended_next_steps.findIndex((s) => s.startsWith('coverage:'));
    expect(qbIdx).toBeGreaterThanOrEqual(0);
    expect(covIdx).toBeGreaterThanOrEqual(0);
    expect(qbIdx).toBeLessThan(covIdx);
  });
});

// =============================================================================
// Narrative protection
// =============================================================================

describe('escalation-manager — narrative protection', () => {
  it('does not mutate accumulated_context outside adapter keys', async () => {
    const cached = { content: 'analytical narrative', tokens: 4200 };
    const accCtx: Record<string, unknown> = {
      strategic_synthesis: cached,
      existing_key: { keep: true },
    };
    const before = JSON.stringify(accCtx);
    await runEscalationManager('s', {
      quality_budget: qualityBudgetStub('hold'),
    }, { accumulated_context: accCtx });
    expect(JSON.stringify(accCtx)).toBe(before);
    expect(accCtx.strategic_synthesis).toBe(cached);
  });
});

// =============================================================================
// Adapter — recordEscalationReport
// =============================================================================

describe('escalation-manager — recordEscalationReport adapter', () => {
  it('appends to empty context — escalation_report + JSON mirror', async () => {
    const r = await runEscalationManager('s', {});
    const ctx: Record<string, unknown> = {};
    recordEscalationReport('s', r, ctx);
    expect(Array.isArray(ctx[ESCALATION_CONTEXT_KEYS.REPORT])).toBe(true);
    expect((ctx[ESCALATION_CONTEXT_KEYS.REPORT] as unknown[]).length).toBe(1);
    const parsed = JSON.parse(ctx[ESCALATION_CONTEXT_KEYS.REPORT_JSON] as string);
    expect(parsed[0].recorded_for_session).toBe('s');
  });

  it('append-only across multiple invocations', async () => {
    const r1 = await runEscalationManager('s', {});
    const r2 = await runEscalationManager('s', { coverage_report: coverageStub(1) });
    const ctx: Record<string, unknown> = {};
    recordEscalationReport('s', r1, ctx);
    recordEscalationReport('s', r2, ctx);
    expect((ctx[ESCALATION_CONTEXT_KEYS.REPORT] as unknown[]).length).toBe(2);
    expect(JSON.parse(ctx[ESCALATION_CONTEXT_KEYS.REPORT_JSON] as string).length).toBe(2);
  });

  it('does not mutate unrelated keys', async () => {
    const r = await runEscalationManager('s', {});
    const cached = { content: 'narrative' };
    const ctx: Record<string, unknown> = { existing: { keep: true }, val_dcf: cached };
    recordEscalationReport('s', r, ctx);
    expect(ctx.existing).toEqual({ keep: true });
    expect(ctx.val_dcf).toBe(cached);
  });
});

// =============================================================================
// KCHOL replays
// =============================================================================

describe('escalation-manager — KCHOL replay (qJASnWiqC-3xomxzyLamS)', () => {
  const KCHOL_SESSION = 'qJASnWiqC-3xomxzyLamS';
  const exists = db.prepare(`SELECT 1 AS x FROM analysis_sessions WHERE id = ?`)
    .get(KCHOL_SESSION) as { x?: number } | undefined;

  it.skipIf(!exists?.x)('clean replay: composes prior engines, no abort, runtime <250ms', async () => {
    const before = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
      .get(KCHOL_SESSION) as { total_cost_usd: number };
    const t0 = Date.now();
    const plan = await runTaskPlanner(KCHOL_SESSION, { ticker: 'KCHOL' });
    const cp = await runIncrementalComputation(KCHOL_SESSION, plan, {});
    const cgr = await runCostGovernor(KCHOL_SESSION, plan, {
      current_session_cost_usd: 0, budget_cap_usd: 50,
    });
    const qb = computeQualityBudget(KCHOL_SESSION);
    const con = detectContradictions(KCHOL_SESSION);
    const cit = detectCitationGaps(KCHOL_SESSION);
    const cov = computeCoverageReport(KCHOL_SESSION);
    const ch = runDeterministicChairmanQuestions(KCHOL_SESSION, 'KCHOL');
    const r = await runEscalationManager(KCHOL_SESSION, {
      task_plan: plan, computation_plan: cp, cost_governor_report: cgr,
      quality_budget: qb, contradiction_report: con, citation_report: cit,
      coverage_report: cov, chairman_report: ch,
    }, { ticker: 'KCHOL' });
    expect(Date.now() - t0).toBeLessThan(2500); // generous: composing 8 engines
    // Manager itself should be sub-250ms once inputs are gathered.
    const t1 = Date.now();
    await runEscalationManager(KCHOL_SESSION, {
      task_plan: plan, computation_plan: cp, cost_governor_report: cgr,
      quality_budget: qb, contradiction_report: con, citation_report: cit,
      coverage_report: cov, chairman_report: ch,
    }, { ticker: 'KCHOL' });
    expect(Date.now() - t1).toBeLessThan(250);
    // KCHOL is publishable* after P1B Wave 3, so worst expected level is needs_review
    // (chairman P0 questions about KCHOL leverage are normal triggers).
    expect(['info', 'warning', 'needs_review']).toContain(r.escalation_level);
    expect(r.blockers).toEqual([]);
    // DB unchanged
    const after = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
      .get(KCHOL_SESSION) as { total_cost_usd: number };
    expect(after.total_cost_usd).toBe(before.total_cost_usd);
  });

  it.skipIf(!exists?.x)('adverse-cost replay: tight cap forces stop_session, deterministic', async () => {
    const plan = await runTaskPlanner(KCHOL_SESSION, { ticker: 'KCHOL' });
    if (plan.planned_tasks.length === 0) return;
    // Force stop_session: current already > cap.
    const cgr = await runCostGovernor(KCHOL_SESSION, plan, {
      current_session_cost_usd: 10, budget_cap_usd: 5,
    });
    const t0 = Date.now();
    const a = await runEscalationManager(KCHOL_SESSION, {
      task_plan: plan, cost_governor_report: cgr,
    }, { ticker: 'KCHOL' });
    expect(Date.now() - t0).toBeLessThan(250);
    expect(a.escalation_level).toBe('abort');
    expect(a.action).toBe('stop_session');
    expect(a.blockers.length).toBeGreaterThanOrEqual(1);
    expect(a.findings.some((f) => f.reason_code === ESCALATION_REASON_CODES.ESC_COST_BUDGET_EXHAUSTED)).toBe(true);
    expect(a.recommended_next_steps.some((s) => s.startsWith('cost_governor:'))).toBe(true);

    // Determinism
    const b = await runEscalationManager(KCHOL_SESSION, {
      task_plan: plan, cost_governor_report: cgr,
    }, { ticker: 'KCHOL' });
    const norm = (p: EscalationReport): unknown =>
      JSON.parse(JSON.stringify(p, (k, v) => k === 'generated_at' ? null : v));
    expect(norm(a)).toEqual(norm(b));
  });
});

// Reference-only — silence unused imports if KCHOL session is absent
void makePublishableSession;
const _SourceModuleRef: SourceModule = 'preflight';
void _SourceModuleRef;
