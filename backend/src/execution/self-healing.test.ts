/**
 * P4B Wave 1 — self-healing pipeline tests.
 */
import { describe, expect, it } from 'vitest';
import {
  runSelfHealingPipeline,
  recordSelfHealingPlan,
  HEALING_ACTION_CODES,
  SELF_HEALING_CONTEXT_KEYS,
  ESC_TO_HEAL,
  TIER_RANK,
  type SelfHealingPlan,
  type HealingDecision,
} from './self-healing.js';
import {
  ESCALATION_REASON_CODES,
  type EscalationReport,
  type EscalationFinding,
  type EscalationLevel,
} from './escalation-manager.js';

// =============================================================================
// Fixtures
// =============================================================================

function emptyEscalation(): EscalationReport {
  return {
    session_id: 's', ticker: 'KCHOL', generated_at: 'x',
    escalation_level: 'info', action: 'proceed',
    reason_codes: [ESCALATION_REASON_CODES.ESC_OVERALL_PROCEED],
    findings: [], affected_modules: [], recommended_next_steps: [],
    blockers: [], warnings: [],
  };
}

function escalationWithFinding(
  reasonCode: string,
  level: EscalationLevel,
): EscalationReport {
  const finding: EscalationFinding = {
    finding_id: `esc-${reasonCode}`.slice(0, 16),
    level, reason_code: reasonCode,
    source_module: 'preflight',
    details: 'x', affected_modules: ['preflight'],
    source_reason_codes: [],
  };
  return {
    session_id: 's', ticker: 'KCHOL', generated_at: 'x',
    escalation_level: level,
    action: level === 'abort' ? 'stop_session' : 'proceed_with_warning',
    reason_codes: [reasonCode],
    findings: [finding],
    affected_modules: ['preflight'],
    recommended_next_steps: [],
    blockers: level === 'abort' ? [finding] : [],
    warnings: level === 'warning' || level === 'needs_review' ? [finding] : [],
  };
}

function escalationWithMultiple(codes: ReadonlyArray<{ code: string; level: EscalationLevel }>): EscalationReport {
  const findings: EscalationFinding[] = codes.map((c, i) => ({
    finding_id: `esc-multi-${i}`,
    level: c.level, reason_code: c.code,
    source_module: 'preflight',
    details: 'x', affected_modules: ['preflight'],
    source_reason_codes: [],
  }));
  return {
    session_id: 's', ticker: 'KCHOL', generated_at: 'x',
    escalation_level: 'info', action: 'proceed',
    reason_codes: codes.map((c) => c.code),
    findings, affected_modules: ['preflight'], recommended_next_steps: [],
    blockers: findings.filter((f) => f.level === 'abort'),
    warnings: findings.filter((f) => f.level === 'warning' || f.level === 'needs_review'),
  };
}

// =============================================================================
// Smoke
// =============================================================================

describe('self-healing — smoke', () => {
  it('async signature returns a Promise', () => {
    expect(runSelfHealingPipeline('s', emptyEscalation())).toBeInstanceOf(Promise);
  });

  it('empty escalation → fully_recoverable, no actions', async () => {
    const r = await runSelfHealingPipeline('s', emptyEscalation());
    expect(r.overall_recoverability).toBe('fully_recoverable');
    expect(r.healing_actions).toEqual([]);
    expect(r.estimated_recovery_steps).toBe(0);
    expect(r.estimated_total_cost_usd).toBe(0);
  });

  it('determinism: same input → same output mod generated_at', async () => {
    const esc = escalationWithMultiple([
      { code: ESCALATION_REASON_CODES.ESC_COVERAGE_GAP, level: 'warning' },
      { code: ESCALATION_REASON_CODES.ESC_CONTRADICTION_CRITICAL, level: 'needs_review' },
    ]);
    const a = await runSelfHealingPipeline('s', esc);
    const b = await runSelfHealingPipeline('s', esc);
    const norm = (p: SelfHealingPlan): unknown =>
      JSON.parse(JSON.stringify(p, (k, v) => k === 'generated_at' ? null : v));
    expect(norm(a)).toEqual(norm(b));
  });

  it('overall ESC_* codes (not in mapping) → no healing action emitted', async () => {
    const esc = emptyEscalation();
    esc.findings = [{
      finding_id: 'esc-overall', level: 'info',
      reason_code: ESCALATION_REASON_CODES.ESC_OVERALL_PROCEED,
      source_module: 'preflight',
      details: 'x', affected_modules: ['preflight'], source_reason_codes: [],
    }];
    const r = await runSelfHealingPipeline('s', esc);
    expect(r.healing_actions).toEqual([]);
  });
});

// =============================================================================
// One positive test per HEAL_* code (12)
// =============================================================================

describe('self-healing — HEAL_* action codes', () => {
  const cases: Array<{
    name: string;
    escCode: string;
    level: EscalationLevel;
    expectedAction: string;
    expectedDecision: HealingDecision;
  }> = [
    { name: 'HEAL_RETRY_PLANNER', escCode: ESCALATION_REASON_CODES.ESC_PLANNER_SKIP_ABORT, level: 'hold', expectedAction: HEALING_ACTION_CODES.HEAL_RETRY_PLANNER, expectedDecision: 'auto_heal' },
    { name: 'HEAL_RETRY_PREDECESSOR', escCode: ESCALATION_REASON_CODES.ESC_PLANNER_PREDECESSOR_FAILURE, level: 'hold', expectedAction: HEALING_ACTION_CODES.HEAL_RETRY_PREDECESSOR, expectedDecision: 'auto_heal' },
    { name: 'HEAL_REFRESH_CACHE', escCode: ESCALATION_REASON_CODES.ESC_INCREMENTAL_INVALIDATION, level: 'warning', expectedAction: HEALING_ACTION_CODES.HEAL_REFRESH_CACHE, expectedDecision: 'auto_heal' },
    { name: 'HEAL_NEW_SESSION_RECOMMENDED', escCode: ESCALATION_REASON_CODES.ESC_INCREMENTAL_METHODOLOGY_DRIFT, level: 'needs_review', expectedAction: HEALING_ACTION_CODES.HEAL_NEW_SESSION_RECOMMENDED, expectedDecision: 'manual_heal' },
    { name: 'HEAL_RECOMMEND_BUDGET_INCREASE', escCode: ESCALATION_REASON_CODES.ESC_COST_TIGHT_HEADROOM, level: 'warning', expectedAction: HEALING_ACTION_CODES.HEAL_RECOMMEND_BUDGET_INCREASE, expectedDecision: 'assisted_heal' },
    { name: 'HEAL_AUTO_APPLY_DOWNGRADE', escCode: ESCALATION_REASON_CODES.ESC_COST_DOWNGRADE_RECOMMENDED, level: 'info', expectedAction: HEALING_ACTION_CODES.HEAL_AUTO_APPLY_DOWNGRADE, expectedDecision: 'auto_heal' },
    { name: 'HEAL_RUN_RECONCILIATION (degraded)', escCode: ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_DEGRADED, level: 'hold', expectedAction: HEALING_ACTION_CODES.HEAL_RUN_RECONCILIATION, expectedDecision: 'auto_heal' },
    { name: 'HEAL_RUN_RECONCILIATION (contradiction)', escCode: ESCALATION_REASON_CODES.ESC_CONTRADICTION_CRITICAL, level: 'needs_review', expectedAction: HEALING_ACTION_CODES.HEAL_RUN_RECONCILIATION, expectedDecision: 'auto_heal' },
    { name: 'HEAL_RERUN_PARSE_STANDARDIZATION', escCode: ESCALATION_REASON_CODES.ESC_CITATION_CRITICAL_GAP, level: 'needs_review', expectedAction: HEALING_ACTION_CODES.HEAL_RERUN_PARSE_STANDARDIZATION, expectedDecision: 'auto_heal' },
    { name: 'HEAL_RERUN_FINANCIAL_ANALYSIS', escCode: ESCALATION_REASON_CODES.ESC_COVERAGE_GAP, level: 'warning', expectedAction: HEALING_ACTION_CODES.HEAL_RERUN_FINANCIAL_ANALYSIS, expectedDecision: 'auto_heal' },
    { name: 'HEAL_ASSIGN_OWNER_REQUIRED', escCode: ESCALATION_REASON_CODES.ESC_CHAIRMAN_P0_QUESTION, level: 'needs_review', expectedAction: HEALING_ACTION_CODES.HEAL_ASSIGN_OWNER_REQUIRED, expectedDecision: 'manual_heal' },
    { name: 'HEAL_NO_ACTION_NEEDED (preflight warning)', escCode: ESCALATION_REASON_CODES.ESC_PREFLIGHT_WARNING, level: 'warning', expectedAction: HEALING_ACTION_CODES.HEAL_NO_ACTION_NEEDED, expectedDecision: 'no_action_needed' },
    { name: 'HEAL_NO_ACTION_NEEDED (PWW)', escCode: ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_PWW, level: 'warning', expectedAction: HEALING_ACTION_CODES.HEAL_NO_ACTION_NEEDED, expectedDecision: 'no_action_needed' },
    { name: 'HEAL_ABORT_NO_RECOVERY (preflight blocker)', escCode: ESCALATION_REASON_CODES.ESC_PREFLIGHT_BLOCKER, level: 'abort', expectedAction: HEALING_ACTION_CODES.HEAL_ABORT_NO_RECOVERY, expectedDecision: 'abort_no_recovery' },
    { name: 'HEAL_ABORT_NO_RECOVERY (budget exhausted)', escCode: ESCALATION_REASON_CODES.ESC_COST_BUDGET_EXHAUSTED, level: 'abort', expectedAction: HEALING_ACTION_CODES.HEAL_ABORT_NO_RECOVERY, expectedDecision: 'abort_no_recovery' },
    { name: 'HEAL_ABORT_NO_RECOVERY (lifecycle hold)', escCode: ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_HOLD, level: 'abort', expectedAction: HEALING_ACTION_CODES.HEAL_ABORT_NO_RECOVERY, expectedDecision: 'abort_no_recovery' },
  ];

  for (const c of cases) {
    it(c.name, async () => {
      const esc = escalationWithFinding(c.escCode, c.level);
      const r = await runSelfHealingPipeline('s', esc);
      expect(r.healing_actions.length).toBe(1);
      const action = r.healing_actions[0];
      expect(action.action_code).toBe(c.expectedAction);
      expect(action.decision).toBe(c.expectedDecision);
      expect(action.source_reason_code).toBe(c.escCode);
      expect(action.action_id).toMatch(/^heal-[0-9a-f]{12}$/);
    });
  }
});

// =============================================================================
// Decision categorization (one positive test per HealingDecision)
// =============================================================================

describe('self-healing — decision categorization', () => {
  it('auto_heal bucket', async () => {
    const esc = escalationWithFinding(ESCALATION_REASON_CODES.ESC_COVERAGE_GAP, 'warning');
    const r = await runSelfHealingPipeline('s', esc);
    expect(r.auto_heal_actions.length).toBe(1);
    expect(r.assisted_heal_actions).toEqual([]);
    expect(r.manual_heal_actions).toEqual([]);
    expect(r.abort_actions).toEqual([]);
  });

  it('assisted_heal bucket', async () => {
    const esc = escalationWithFinding(ESCALATION_REASON_CODES.ESC_COST_TIGHT_HEADROOM, 'warning');
    const r = await runSelfHealingPipeline('s', esc);
    expect(r.assisted_heal_actions.length).toBe(1);
    expect(r.auto_heal_actions).toEqual([]);
  });

  it('manual_heal bucket', async () => {
    const esc = escalationWithFinding(ESCALATION_REASON_CODES.ESC_CHAIRMAN_P0_QUESTION, 'needs_review');
    const r = await runSelfHealingPipeline('s', esc);
    expect(r.manual_heal_actions.length).toBe(1);
  });

  it('no_action_needed: not bucketed but counted in healing_actions', async () => {
    const esc = escalationWithFinding(ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_PWW, 'warning');
    const r = await runSelfHealingPipeline('s', esc);
    expect(r.healing_actions.length).toBe(1);
    expect(r.auto_heal_actions).toEqual([]);
    expect(r.assisted_heal_actions).toEqual([]);
    expect(r.manual_heal_actions).toEqual([]);
    expect(r.abort_actions).toEqual([]);
    // estimated_recovery_steps excludes no_action_needed
    expect(r.estimated_recovery_steps).toBe(0);
  });

  it('abort_no_recovery bucket + reason_code propagation', async () => {
    const esc = escalationWithFinding(ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_HOLD, 'abort');
    const r = await runSelfHealingPipeline('s', esc);
    expect(r.abort_actions.length).toBe(1);
    expect(r.reason_codes).toContain(HEALING_ACTION_CODES.HEAL_ABORT_NO_RECOVERY);
    expect(r.reason_codes).toContain(ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_HOLD);
  });
});

// =============================================================================
// Overall recoverability mapping
// =============================================================================

describe('self-healing — overall_recoverability', () => {
  it('fully_recoverable: empty + all auto/no_action_needed', async () => {
    const e1 = emptyEscalation();
    const r1 = await runSelfHealingPipeline('s', e1);
    expect(r1.overall_recoverability).toBe('fully_recoverable');

    const e2 = escalationWithMultiple([
      { code: ESCALATION_REASON_CODES.ESC_COVERAGE_GAP, level: 'warning' },
      { code: ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_PWW, level: 'warning' },
    ]);
    const r2 = await runSelfHealingPipeline('s', e2);
    expect(r2.overall_recoverability).toBe('fully_recoverable');
  });

  it('partially_recoverable: mix of auto + manual but no abort', async () => {
    const esc = escalationWithMultiple([
      { code: ESCALATION_REASON_CODES.ESC_COVERAGE_GAP, level: 'warning' },         // auto
      { code: ESCALATION_REASON_CODES.ESC_CHAIRMAN_P0_QUESTION, level: 'needs_review' }, // manual
    ]);
    const r = await runSelfHealingPipeline('s', esc);
    expect(r.overall_recoverability).toBe('partially_recoverable');
  });

  it('not_recoverable: any abort_no_recovery present', async () => {
    const esc = escalationWithMultiple([
      { code: ESCALATION_REASON_CODES.ESC_COVERAGE_GAP, level: 'warning' },
      { code: ESCALATION_REASON_CODES.ESC_COST_BUDGET_EXHAUSTED, level: 'abort' },
    ]);
    const r = await runSelfHealingPipeline('s', esc);
    expect(r.overall_recoverability).toBe('not_recoverable');
    expect(r.abort_actions.length).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// Recommended sequence ordering
// =============================================================================

describe('self-healing — recommended_sequence ordering', () => {
  it('abort first, then auto, assisted, manual, no_action_needed', async () => {
    const esc = escalationWithMultiple([
      { code: ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_PWW, level: 'warning' },     // no_action_needed
      { code: ESCALATION_REASON_CODES.ESC_CHAIRMAN_P0_QUESTION, level: 'needs_review' }, // manual
      { code: ESCALATION_REASON_CODES.ESC_COST_TIGHT_HEADROOM, level: 'warning' },        // assisted
      { code: ESCALATION_REASON_CODES.ESC_COVERAGE_GAP, level: 'warning' },               // auto
      { code: ESCALATION_REASON_CODES.ESC_COST_BUDGET_EXHAUSTED, level: 'abort' },        // abort
    ]);
    const r = await runSelfHealingPipeline('s', esc);
    const decisions = r.recommended_sequence.map((a) => a.decision);
    // Each decision's tier rank should be monotonically non-decreasing.
    for (let i = 1; i < decisions.length; i++) {
      expect(TIER_RANK[decisions[i - 1]]).toBeLessThanOrEqual(TIER_RANK[decisions[i]]);
    }
    // First should be abort
    expect(decisions[0]).toBe('abort_no_recovery');
  });

  it('alphabetical tie-break on action_code within tier', async () => {
    const esc = escalationWithMultiple([
      { code: ESCALATION_REASON_CODES.ESC_COVERAGE_GAP, level: 'warning' },               // HEAL_RERUN_FINANCIAL_ANALYSIS
      { code: ESCALATION_REASON_CODES.ESC_CITATION_CRITICAL_GAP, level: 'needs_review' }, // HEAL_RERUN_PARSE_STANDARDIZATION
      { code: ESCALATION_REASON_CODES.ESC_INCREMENTAL_INVALIDATION, level: 'warning' },   // HEAL_REFRESH_CACHE
    ]);
    const r = await runSelfHealingPipeline('s', esc);
    const autoActions = r.recommended_sequence.filter((a) => a.decision === 'auto_heal');
    const codes = autoActions.map((a) => a.action_code);
    const sorted = [...codes].sort();
    expect(codes).toEqual(sorted);
  });
});

// =============================================================================
// Cost & invariants
// =============================================================================

describe('self-healing — cost invariants', () => {
  it('estimated_total_cost_usd === Σ healing_actions[*].estimated_cost_usd', async () => {
    const esc = escalationWithMultiple([
      { code: ESCALATION_REASON_CODES.ESC_COVERAGE_GAP, level: 'warning' },
      { code: ESCALATION_REASON_CODES.ESC_CITATION_CRITICAL_GAP, level: 'needs_review' },
      { code: ESCALATION_REASON_CODES.ESC_CONTRADICTION_CRITICAL, level: 'needs_review' },
    ]);
    const r = await runSelfHealingPipeline('s', esc);
    const sum = r.healing_actions.reduce((acc, a) => acc + a.estimated_cost_usd, 0);
    expect(r.estimated_total_cost_usd).toBeCloseTo(sum, 4);
  });

  it('manual_heal / abort actions contribute 0 to cost', async () => {
    const esc = escalationWithMultiple([
      { code: ESCALATION_REASON_CODES.ESC_CHAIRMAN_P0_QUESTION, level: 'needs_review' },
      { code: ESCALATION_REASON_CODES.ESC_COST_BUDGET_EXHAUSTED, level: 'abort' },
    ]);
    const r = await runSelfHealingPipeline('s', esc);
    expect(r.estimated_total_cost_usd).toBe(0);
  });

  it('estimated_recovery_steps excludes no_action_needed and abort', async () => {
    const esc = escalationWithMultiple([
      { code: ESCALATION_REASON_CODES.ESC_COVERAGE_GAP, level: 'warning' },                 // auto
      { code: ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_PWW, level: 'warning' },         // no_action
      { code: ESCALATION_REASON_CODES.ESC_COST_BUDGET_EXHAUSTED, level: 'abort' },           // abort
      { code: ESCALATION_REASON_CODES.ESC_CHAIRMAN_P0_QUESTION, level: 'needs_review' },     // manual
    ]);
    const r = await runSelfHealingPipeline('s', esc);
    // Only auto + manual counted (no_action and abort excluded).
    expect(r.estimated_recovery_steps).toBe(2);
  });
});

// =============================================================================
// Mapping table integrity
// =============================================================================

describe('self-healing — mapping table integrity', () => {
  it('every per-source ESC_* code has an ESC_TO_HEAL entry', () => {
    const perSourceCodes = [
      ESCALATION_REASON_CODES.ESC_PREFLIGHT_BLOCKER,
      ESCALATION_REASON_CODES.ESC_PREFLIGHT_WARNING,
      ESCALATION_REASON_CODES.ESC_PLANNER_SKIP_ABORT,
      ESCALATION_REASON_CODES.ESC_PLANNER_PREDECESSOR_FAILURE,
      ESCALATION_REASON_CODES.ESC_INCREMENTAL_INVALIDATION,
      ESCALATION_REASON_CODES.ESC_INCREMENTAL_METHODOLOGY_DRIFT,
      ESCALATION_REASON_CODES.ESC_COST_BUDGET_EXHAUSTED,
      ESCALATION_REASON_CODES.ESC_COST_TIGHT_HEADROOM,
      ESCALATION_REASON_CODES.ESC_COST_DOWNGRADE_RECOMMENDED,
      ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_HOLD,
      ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_DEGRADED,
      ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_PWW,
      ESCALATION_REASON_CODES.ESC_CONTRADICTION_CRITICAL,
      ESCALATION_REASON_CODES.ESC_CITATION_CRITICAL_GAP,
      ESCALATION_REASON_CODES.ESC_COVERAGE_GAP,
      ESCALATION_REASON_CODES.ESC_CHAIRMAN_P0_QUESTION,
    ];
    for (const code of perSourceCodes) {
      expect(ESC_TO_HEAL[code]).toBeDefined();
    }
  });

  it('ESC_OVERALL_* codes are intentionally NOT in ESC_TO_HEAL', () => {
    expect(ESC_TO_HEAL[ESCALATION_REASON_CODES.ESC_OVERALL_PROCEED]).toBeUndefined();
    expect(ESC_TO_HEAL[ESCALATION_REASON_CODES.ESC_OVERALL_STOP_SESSION]).toBeUndefined();
  });
});

// =============================================================================
// Narrative protection + adapter
// =============================================================================

describe('self-healing — narrative protection', () => {
  it('does not mutate accumulated_context', async () => {
    const cached = { content: 'narrative', tokens: 1000 };
    const accCtx: Record<string, unknown> = {
      strategic_synthesis: cached,
      existing: { keep: true },
    };
    const before = JSON.stringify(accCtx);
    const esc = escalationWithFinding(ESCALATION_REASON_CODES.ESC_COVERAGE_GAP, 'warning');
    await runSelfHealingPipeline('s', esc, { accumulated_context: accCtx });
    expect(JSON.stringify(accCtx)).toBe(before);
    expect(accCtx.strategic_synthesis).toBe(cached);
  });
});

describe('self-healing — recordSelfHealingPlan adapter', () => {
  it('appends to empty context — self_healing_plan + JSON mirror', async () => {
    const r = await runSelfHealingPipeline('s', emptyEscalation());
    const ctx: Record<string, unknown> = {};
    recordSelfHealingPlan('s', r, ctx);
    expect(Array.isArray(ctx[SELF_HEALING_CONTEXT_KEYS.PLAN])).toBe(true);
    expect((ctx[SELF_HEALING_CONTEXT_KEYS.PLAN] as unknown[]).length).toBe(1);
    const parsed = JSON.parse(ctx[SELF_HEALING_CONTEXT_KEYS.PLAN_JSON] as string);
    expect(parsed[0].recorded_for_session).toBe('s');
  });

  it('append-only across multiple invocations', async () => {
    const r1 = await runSelfHealingPipeline('s', emptyEscalation());
    const r2 = await runSelfHealingPipeline('s', escalationWithFinding(
      ESCALATION_REASON_CODES.ESC_COVERAGE_GAP, 'warning'));
    const ctx: Record<string, unknown> = {};
    recordSelfHealingPlan('s', r1, ctx);
    recordSelfHealingPlan('s', r2, ctx);
    expect((ctx[SELF_HEALING_CONTEXT_KEYS.PLAN] as unknown[]).length).toBe(2);
  });

  it('does not mutate unrelated keys', async () => {
    const r = await runSelfHealingPipeline('s', emptyEscalation());
    const cached = { content: 'narrative' };
    const ctx: Record<string, unknown> = { existing: { keep: true }, val_dcf: cached };
    recordSelfHealingPlan('s', r, ctx);
    expect(ctx.existing).toEqual({ keep: true });
    expect(ctx.val_dcf).toBe(cached);
  });
});
