/**
 * Deterministic Escalation Manager (Block P — Plan P4A Wave 1).
 *
 * Standalone session-level aggregator that consumes pre-computed reports from
 * preflight (P3A), task planner (P3B), incremental computation (P3C), cost
 * governor (P3D), and the quality-os engines (quality budget, contradiction,
 * citation, coverage, deterministic chairman) and emits a single
 * EscalationReport with:
 *
 *   - Overall escalation_level ∈ {info, warning, needs_review, hold, abort}
 *   - Overall action ∈ {proceed, proceed_with_warning, request_review,
 *                       retry_or_recompute, stop_session} (1:1 derived)
 *   - Per-source EscalationFinding[] with frozen ESC_* reason codes
 *   - Sorted-unique affected_modules + deterministic recommended_next_steps
 *   - Strict bucketing of blockers (level=abort) and warnings (level∈{warning,
 *     needs_review})
 *
 * Wave 1 invariants:
 *   - Standalone: no orchestrator / agent-runner wiring; the manager consumes
 *     pre-computed report objects passed in by the caller.
 *   - Read-only: never mutates accumulated_context outside the adapter's two
 *     keys; cached analytical narrative is preserved verbatim.
 *   - Deterministic: same inputs → same structural output (mod
 *     `generated_at`); findings sorted by (level desc, source asc,
 *     reason_code asc); affected_modules + reason_codes sorted-unique.
 *   - Every finding carries exactly one `reason_code`; every report carries
 *     ≥ 1 reason code (the overall code is always present).
 *   - No LLM calls; no DB access; no network/disk I/O.
 */

import { createHash } from 'node:crypto';
import type { PreflightDecision } from './preflight.js';
import type { TaskPlan } from './task-planner.js';
import type { ComputationPlan } from './incremental.js';
import type { CostGovernorReport } from './cost-governor.js';
import type { QualityBudgetReport } from '../quality-os/quality-budget.js';
import type { ContradictionReport } from '../quality-os/contradiction-engine.js';
import type { CitationReport } from '../quality-os/citation-enforcement.js';
import type { CoverageReport } from '../quality-os/coverage-engine.js';
import type { DeterministicChairmanReport } from '../quality-os/chairman-questions-deterministic.js';

// =============================================================================
// Frozen reason-code constants (exported for downstream callers)
// =============================================================================

export const ESCALATION_REASON_CODES = {
  // Per-source (16)
  ESC_PREFLIGHT_BLOCKER: 'ESC_PREFLIGHT_BLOCKER',
  ESC_PREFLIGHT_WARNING: 'ESC_PREFLIGHT_WARNING',
  ESC_PLANNER_SKIP_ABORT: 'ESC_PLANNER_SKIP_ABORT',
  ESC_PLANNER_PREDECESSOR_FAILURE: 'ESC_PLANNER_PREDECESSOR_FAILURE',
  ESC_INCREMENTAL_INVALIDATION: 'ESC_INCREMENTAL_INVALIDATION',
  ESC_INCREMENTAL_METHODOLOGY_DRIFT: 'ESC_INCREMENTAL_METHODOLOGY_DRIFT',
  ESC_COST_BUDGET_EXHAUSTED: 'ESC_COST_BUDGET_EXHAUSTED',
  ESC_COST_TIGHT_HEADROOM: 'ESC_COST_TIGHT_HEADROOM',
  ESC_COST_DOWNGRADE_RECOMMENDED: 'ESC_COST_DOWNGRADE_RECOMMENDED',
  ESC_QUALITY_LIFECYCLE_HOLD: 'ESC_QUALITY_LIFECYCLE_HOLD',
  ESC_QUALITY_LIFECYCLE_DEGRADED: 'ESC_QUALITY_LIFECYCLE_DEGRADED',
  ESC_QUALITY_LIFECYCLE_PWW: 'ESC_QUALITY_LIFECYCLE_PWW',
  ESC_CONTRADICTION_CRITICAL: 'ESC_CONTRADICTION_CRITICAL',
  ESC_CITATION_CRITICAL_GAP: 'ESC_CITATION_CRITICAL_GAP',
  ESC_COVERAGE_GAP: 'ESC_COVERAGE_GAP',
  ESC_CHAIRMAN_P0_QUESTION: 'ESC_CHAIRMAN_P0_QUESTION',
  // Session-level overall (5)
  ESC_OVERALL_PROCEED: 'ESC_OVERALL_PROCEED',
  ESC_OVERALL_PROCEED_WITH_WARNING: 'ESC_OVERALL_PROCEED_WITH_WARNING',
  ESC_OVERALL_REQUEST_REVIEW: 'ESC_OVERALL_REQUEST_REVIEW',
  ESC_OVERALL_RETRY_OR_RECOMPUTE: 'ESC_OVERALL_RETRY_OR_RECOMPUTE',
  ESC_OVERALL_STOP_SESSION: 'ESC_OVERALL_STOP_SESSION',
} as const;

export type EscalationReasonCode =
  typeof ESCALATION_REASON_CODES[keyof typeof ESCALATION_REASON_CODES];

// =============================================================================
// Types
// =============================================================================

export type EscalationLevel = 'info' | 'warning' | 'needs_review' | 'hold' | 'abort';

export type EscalationAction =
  | 'proceed'
  | 'proceed_with_warning'
  | 'request_review'
  | 'retry_or_recompute'
  | 'stop_session';

export type SourceModule =
  | 'preflight'
  | 'task_planner'
  | 'incremental'
  | 'cost_governor'
  | 'quality_budget'
  | 'contradiction'
  | 'citation'
  | 'coverage'
  | 'chairman_deterministic';

export interface EscalationFinding {
  finding_id: string;
  level: EscalationLevel;
  reason_code: string;
  source_module: SourceModule;
  details: string;
  affected_modules: SourceModule[];
  source_reason_codes: string[];
}

export interface EscalationReport {
  session_id: string;
  ticker: string | null;
  generated_at: string;
  escalation_level: EscalationLevel;
  action: EscalationAction;
  reason_codes: string[];
  findings: EscalationFinding[];
  affected_modules: SourceModule[];
  recommended_next_steps: string[];
  blockers: EscalationFinding[];
  warnings: EscalationFinding[];
}

export interface EscalationManagerInputs {
  preflight_decisions?: PreflightDecision[];
  task_plan?: TaskPlan;
  computation_plan?: ComputationPlan;
  cost_governor_report?: CostGovernorReport;
  quality_budget?: QualityBudgetReport;
  contradiction_report?: ContradictionReport;
  citation_report?: CitationReport;
  coverage_report?: CoverageReport;
  chairman_report?: DeterministicChairmanReport;
}

export interface EscalationManagerOptions {
  ticker?: string | null;
  /** Read-only — surfaced for the optional adapter. The manager never mutates
   *  this object outside the two adapter keys. */
  accumulated_context?: Record<string, unknown>;
}

// =============================================================================
// Level / action plumbing
// =============================================================================

const LEVEL_RANK: Record<EscalationLevel, number> = {
  info: 0,
  warning: 1,
  needs_review: 2,
  hold: 3,
  abort: 4,
};

const ACTION_BY_LEVEL: Record<EscalationLevel, EscalationAction> = {
  info: 'proceed',
  warning: 'proceed_with_warning',
  needs_review: 'request_review',
  hold: 'retry_or_recompute',
  abort: 'stop_session',
};

const OVERALL_CODE_BY_LEVEL: Record<EscalationLevel, EscalationReasonCode> = {
  info: ESCALATION_REASON_CODES.ESC_OVERALL_PROCEED,
  warning: ESCALATION_REASON_CODES.ESC_OVERALL_PROCEED_WITH_WARNING,
  needs_review: ESCALATION_REASON_CODES.ESC_OVERALL_REQUEST_REVIEW,
  hold: ESCALATION_REASON_CODES.ESC_OVERALL_RETRY_OR_RECOMPUTE,
  abort: ESCALATION_REASON_CODES.ESC_OVERALL_STOP_SESSION,
};

function maxLevel(a: EscalationLevel, b: EscalationLevel): EscalationLevel {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}

// =============================================================================
// Reason-code → level mapping (single source of truth)
// =============================================================================

const REASON_CODE_LEVEL: Record<string, EscalationLevel> = {
  [ESCALATION_REASON_CODES.ESC_PREFLIGHT_BLOCKER]: 'abort',
  [ESCALATION_REASON_CODES.ESC_PREFLIGHT_WARNING]: 'warning',
  [ESCALATION_REASON_CODES.ESC_PLANNER_SKIP_ABORT]: 'hold',
  [ESCALATION_REASON_CODES.ESC_PLANNER_PREDECESSOR_FAILURE]: 'hold',
  [ESCALATION_REASON_CODES.ESC_INCREMENTAL_INVALIDATION]: 'warning',
  [ESCALATION_REASON_CODES.ESC_INCREMENTAL_METHODOLOGY_DRIFT]: 'needs_review',
  [ESCALATION_REASON_CODES.ESC_COST_BUDGET_EXHAUSTED]: 'abort',
  [ESCALATION_REASON_CODES.ESC_COST_TIGHT_HEADROOM]: 'warning',
  [ESCALATION_REASON_CODES.ESC_COST_DOWNGRADE_RECOMMENDED]: 'info',
  [ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_HOLD]: 'abort',
  [ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_DEGRADED]: 'hold',
  [ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_PWW]: 'warning',
  [ESCALATION_REASON_CODES.ESC_CONTRADICTION_CRITICAL]: 'needs_review',
  [ESCALATION_REASON_CODES.ESC_CITATION_CRITICAL_GAP]: 'needs_review',
  [ESCALATION_REASON_CODES.ESC_COVERAGE_GAP]: 'warning',
  [ESCALATION_REASON_CODES.ESC_CHAIRMAN_P0_QUESTION]: 'needs_review',
};

// =============================================================================
// Module → recommended-next-step text (deterministic Turkish)
// =============================================================================

const NEXT_STEP_BY_MODULE: Record<SourceModule, string> = {
  preflight: 'preflight: V1-V8 bulgularını gözden geçirin (ticker / fact-pack / bütçe / metodoloji / faz sınırı).',
  task_planner: 'task_planner: planı yeniden üretin; önkoşul ve duplikasyon kurallarını yeniden değerlendirin.',
  incremental: 'incremental: cache geçerliliğini doğrulayın (fingerprint / metodoloji sürümü / freshness band).',
  cost_governor: 'cost_governor: bütçe kapaklarını ve maliyet kademe önerilerini gözden geçirin; oturum maliyet planını ayarlayın.',
  quality_budget: 'quality_budget: blokerleri çözün; lifecycle durumunu publishable seviyesine yükseltin.',
  contradiction: 'contradiction: reconciliation ajanı ile kritik tutarsızlıkları kanonik değere çekin.',
  citation: 'citation: parse_standardization lineage_node\'larına source_doc_id ekleyin (P1B Wave 2/3 boru hattı).',
  coverage: 'coverage: eksik fact stem\'lerini parse_standardization veya financial_analysis ile tamamlayın.',
  chairman_deterministic: 'chairman_deterministic: P0 yönetim kurulu sorularına yanıt sahibi atayın ve raporda yanıtlayın.',
};

const SOURCE_DECLARATION_ORDER: SourceModule[] = [
  'preflight', 'task_planner', 'incremental', 'cost_governor',
  'quality_budget', 'contradiction', 'citation', 'coverage', 'chairman_deterministic',
];

// =============================================================================
// Helpers
// =============================================================================

function findingId(sessionId: string, code: string, source: SourceModule): string {
  const h = createHash('sha1').update(`${sessionId}|${code}|${source}`).digest('hex').slice(0, 12);
  return `esc-${h}`;
}

function sortedUnique<T extends string>(values: ReadonlyArray<T>): T[] {
  return Array.from(new Set(values)).sort() as T[];
}

function makeFinding(args: {
  sessionId: string;
  code: EscalationReasonCode;
  source: SourceModule;
  details: string;
  affected: SourceModule[];
  sourceReasonCodes: string[];
}): EscalationFinding {
  const level = REASON_CODE_LEVEL[args.code];
  if (!level) {
    throw new Error(`Unknown reason code: ${args.code}`);
  }
  return {
    finding_id: findingId(args.sessionId, args.code, args.source),
    level,
    reason_code: args.code,
    source_module: args.source,
    details: args.details,
    affected_modules: sortedUnique(args.affected),
    source_reason_codes: sortedUnique(args.sourceReasonCodes),
  };
}

// =============================================================================
// Per-source classifiers
// =============================================================================

function classifyPreflight(
  sessionId: string,
  decisions: PreflightDecision[] | undefined,
  out: EscalationFinding[],
): void {
  if (!decisions || decisions.length === 0) return;
  const blockerCodes: string[] = [];
  const warningCodes: string[] = [];
  let blockerCount = 0;
  let warningCount = 0;
  for (const d of decisions) {
    for (const f of d.findings) {
      if (f.severity === 'blocker') {
        blockerCodes.push(f.reason_code);
        blockerCount++;
      } else if (f.severity === 'warning') {
        warningCodes.push(f.reason_code);
        warningCount++;
      }
    }
  }
  if (blockerCount > 0) {
    out.push(makeFinding({
      sessionId,
      code: ESCALATION_REASON_CODES.ESC_PREFLIGHT_BLOCKER,
      source: 'preflight',
      details: `${blockerCount} preflight blocker bulgu(lar)ı: çağrı(lar) abort edildi.`,
      affected: ['preflight'],
      sourceReasonCodes: blockerCodes,
    }));
  }
  if (warningCount > 0) {
    out.push(makeFinding({
      sessionId,
      code: ESCALATION_REASON_CODES.ESC_PREFLIGHT_WARNING,
      source: 'preflight',
      details: `${warningCount} preflight uyarısı: çağrı yapılabilir ancak uyarı kayıt altında.`,
      affected: ['preflight'],
      sourceReasonCodes: warningCodes,
    }));
  }
}

function classifyTaskPlan(
  sessionId: string,
  plan: TaskPlan | undefined,
  out: EscalationFinding[],
): void {
  if (!plan) return;
  const skipAbort: string[] = [];
  const predFail: string[] = [];
  for (const s of plan.skipped_tasks) {
    if (s.reason_codes.includes('SKIP_PREFLIGHT_ABORT')) skipAbort.push(s.kind);
    if (s.reason_codes.includes('SKIP_PREDECESSOR_FAILED')) predFail.push(s.kind);
  }
  if (skipAbort.length > 0) {
    out.push(makeFinding({
      sessionId,
      code: ESCALATION_REASON_CODES.ESC_PLANNER_SKIP_ABORT,
      source: 'task_planner',
      details: `${skipAbort.length} planlanan görev preflight=abort nedeniyle iptal edildi: ${skipAbort.sort().join(', ')}.`,
      affected: ['task_planner', 'preflight'],
      sourceReasonCodes: ['SKIP_PREFLIGHT_ABORT'],
    }));
  }
  if (predFail.length > 0) {
    out.push(makeFinding({
      sessionId,
      code: ESCALATION_REASON_CODES.ESC_PLANNER_PREDECESSOR_FAILURE,
      source: 'task_planner',
      details: `${predFail.length} görev önkoşul ajanı başarısız olduğu için iptal edildi: ${predFail.sort().join(', ')}.`,
      affected: ['task_planner'],
      sourceReasonCodes: ['SKIP_PREDECESSOR_FAILED'],
    }));
  }
}

function classifyIncremental(
  sessionId: string,
  cp: ComputationPlan | undefined,
  out: EscalationFinding[],
): void {
  if (!cp) return;
  const invalidations: string[] = [];
  const methodologyDrift: string[] = [];
  for (const v of cp.computation_decision) {
    if (v.decision === 'invalidate') {
      invalidations.push(v.kind);
      if (v.reason_codes.includes('INVALIDATION_METHODOLOGY_DRIFT')) {
        methodologyDrift.push(v.kind);
      }
    }
  }
  if (invalidations.length > 0) {
    out.push(makeFinding({
      sessionId,
      code: ESCALATION_REASON_CODES.ESC_INCREMENTAL_INVALIDATION,
      source: 'incremental',
      details: `${invalidations.length} cache invalidation: ${invalidations.sort().join(', ')}.`,
      affected: ['incremental'],
      sourceReasonCodes: ['INVALIDATION'],
    }));
  }
  if (methodologyDrift.length > 0) {
    out.push(makeFinding({
      sessionId,
      code: ESCALATION_REASON_CODES.ESC_INCREMENTAL_METHODOLOGY_DRIFT,
      source: 'incremental',
      details: `Metodoloji sürüm kayması ${methodologyDrift.length} görev için tespit edildi: ${methodologyDrift.sort().join(', ')}.`,
      affected: ['incremental'],
      sourceReasonCodes: ['INVALIDATION_METHODOLOGY_DRIFT'],
    }));
  }
}

function classifyCostGovernor(
  sessionId: string,
  report: CostGovernorReport | undefined,
  out: EscalationFinding[],
): void {
  if (!report) return;
  const STOP_CODES = new Set([
    'GOV_STOP_BUDGET_EXHAUSTED',
    'GOV_STOP_NO_VIABLE_PLAN',
    'GOV_STOP_PREFLIGHT_ABORT_CHAIN',
  ]);
  const stopHits = report.stop_reasons.filter((r) => STOP_CODES.has(r));
  if (stopHits.length > 0) {
    out.push(makeFinding({
      sessionId,
      code: ESCALATION_REASON_CODES.ESC_COST_BUDGET_EXHAUSTED,
      source: 'cost_governor',
      details: `Cost governor oturum-seviyesi durdurma sinyali: ${stopHits.sort().join(', ')}.`,
      affected: ['cost_governor'],
      sourceReasonCodes: stopHits,
    }));
  }
  if (report.reason_codes.includes('GOV_TIGHT_HEADROOM_BELOW_TEN_PERCENT')) {
    out.push(makeFinding({
      sessionId,
      code: ESCALATION_REASON_CODES.ESC_COST_TIGHT_HEADROOM,
      source: 'cost_governor',
      details: `Bütçe headroom %10 altında — kalan: $${report.remaining_budget_usd.toFixed(4)}.`,
      affected: ['cost_governor'],
      sourceReasonCodes: ['GOV_TIGHT_HEADROOM_BELOW_TEN_PERCENT'],
    }));
  }
  if (report.downgraded_tasks.length > 0) {
    out.push(makeFinding({
      sessionId,
      code: ESCALATION_REASON_CODES.ESC_COST_DOWNGRADE_RECOMMENDED,
      source: 'cost_governor',
      details: `${report.downgraded_tasks.length} görev için ekonomi modeline geçiş önerildi: ${report.downgraded_tasks.map((t) => t.kind).sort().join(', ')}.`,
      affected: ['cost_governor'],
      sourceReasonCodes: ['GOV_DOWNGRADE_MODEL_TIER'],
    }));
  }
}

function classifyQualityBudget(
  sessionId: string,
  report: QualityBudgetReport | undefined,
  out: EscalationFinding[],
): void {
  if (!report) return;
  switch (report.lifecycle_status) {
    case 'hold':
      out.push(makeFinding({
        sessionId,
        code: ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_HOLD,
        source: 'quality_budget',
        details: `Quality budget lifecycle="hold": ${report.blockers.length} bloker, ${report.warnings.length} uyarı.`,
        affected: ['quality_budget'],
        sourceReasonCodes: report.blockers.slice(),
      }));
      break;
    case 'degraded':
      out.push(makeFinding({
        sessionId,
        code: ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_DEGRADED,
        source: 'quality_budget',
        details: `Quality budget lifecycle="degraded" (skor=${report.publishable_score.toFixed(3)}).`,
        affected: ['quality_budget'],
        sourceReasonCodes: report.blockers.length > 0 ? report.blockers.slice() : ['lifecycle_degraded'],
      }));
      break;
    case 'publishable_with_warnings':
      out.push(makeFinding({
        sessionId,
        code: ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_PWW,
        source: 'quality_budget',
        details: `Quality budget lifecycle="publishable_with_warnings": ${report.warnings.length} uyarı.`,
        affected: ['quality_budget'],
        sourceReasonCodes: report.warnings.length > 0 ? report.warnings.slice() : ['lifecycle_pww'],
      }));
      break;
    case 'publishable':
      // No escalation
      break;
  }
}

function classifyContradiction(
  sessionId: string,
  report: ContradictionReport | undefined,
  out: EscalationFinding[],
): void {
  if (!report) return;
  if (report.by_severity.critical > 0) {
    out.push(makeFinding({
      sessionId,
      code: ESCALATION_REASON_CODES.ESC_CONTRADICTION_CRITICAL,
      source: 'contradiction',
      details: `${report.by_severity.critical} kritik tutarsızlık tespit edildi.`,
      affected: ['contradiction'],
      sourceReasonCodes: ['contradiction_critical'],
    }));
  }
}

function classifyCitation(
  sessionId: string,
  report: CitationReport | undefined,
  out: EscalationFinding[],
): void {
  if (!report) return;
  if (report.critical_gaps.length > 0) {
    out.push(makeFinding({
      sessionId,
      code: ESCALATION_REASON_CODES.ESC_CITATION_CRITICAL_GAP,
      source: 'citation',
      details: `${report.critical_gaps.length} kritik fact citation eksiği.`,
      affected: ['citation'],
      sourceReasonCodes: report.critical_gaps.map((g) => g.fact_key).sort(),
    }));
  }
}

function classifyCoverage(
  sessionId: string,
  report: CoverageReport | undefined,
  out: EscalationFinding[],
): void {
  if (!report) return;
  if (report.total_missing > 0) {
    out.push(makeFinding({
      sessionId,
      code: ESCALATION_REASON_CODES.ESC_COVERAGE_GAP,
      source: 'coverage',
      details: `${report.total_missing} required fact stem eksik (toplam ${report.total_required}).`,
      affected: ['coverage'],
      sourceReasonCodes: report.all_missing_stems.slice(),
    }));
  }
}

function classifyChairman(
  sessionId: string,
  report: DeterministicChairmanReport | undefined,
  out: EscalationFinding[],
): void {
  if (!report) return;
  const p0Count = report.by_severity.P0;
  if (p0Count > 0) {
    const p0Ids = report.questions.filter((q) => q.severity === 'P0').map((q) => q.question_id);
    out.push(makeFinding({
      sessionId,
      code: ESCALATION_REASON_CODES.ESC_CHAIRMAN_P0_QUESTION,
      source: 'chairman_deterministic',
      details: `${p0Count} P0 yönetim kurulu sorusu yanıt sahibi atanmasını bekliyor.`,
      affected: ['chairman_deterministic'],
      sourceReasonCodes: p0Ids.sort(),
    }));
  }
}

// =============================================================================
// Main entry — runEscalationManager
// =============================================================================

export async function runEscalationManager(
  sessionId: string,
  inputs: EscalationManagerInputs,
  options: EscalationManagerOptions = {},
): Promise<EscalationReport> {
  const findings: EscalationFinding[] = [];

  // 1) Per-source classification (declaration order).
  classifyPreflight(sessionId, inputs.preflight_decisions, findings);
  classifyTaskPlan(sessionId, inputs.task_plan, findings);
  classifyIncremental(sessionId, inputs.computation_plan, findings);
  classifyCostGovernor(sessionId, inputs.cost_governor_report, findings);
  classifyQualityBudget(sessionId, inputs.quality_budget, findings);
  classifyContradiction(sessionId, inputs.contradiction_report, findings);
  classifyCitation(sessionId, inputs.citation_report, findings);
  classifyCoverage(sessionId, inputs.coverage_report, findings);
  classifyChairman(sessionId, inputs.chairman_report, findings);

  // 2) Sort findings by (level desc, source asc, reason_code asc).
  findings.sort((a, b) => {
    if (LEVEL_RANK[b.level] !== LEVEL_RANK[a.level]) {
      return LEVEL_RANK[b.level] - LEVEL_RANK[a.level];
    }
    if (a.source_module !== b.source_module) {
      return a.source_module.localeCompare(b.source_module);
    }
    return a.reason_code.localeCompare(b.reason_code);
  });

  // 3) Overall level = max over findings (default 'info').
  let overallLevel: EscalationLevel = 'info';
  for (const f of findings) {
    overallLevel = maxLevel(overallLevel, f.level);
  }
  const overallCode = OVERALL_CODE_BY_LEVEL[overallLevel];
  const action = ACTION_BY_LEVEL[overallLevel];

  // 4) Affected modules — sorted unique union.
  const affectedModules = sortedUnique(findings.flatMap((f) => f.affected_modules));

  // 5) Recommended next steps — per affected module, ordered by max-level
  //    of any finding from that module (desc), alphabetical tie-break.
  const moduleMaxLevel = new Map<SourceModule, EscalationLevel>();
  for (const f of findings) {
    for (const m of f.affected_modules) {
      const cur = moduleMaxLevel.get(m);
      moduleMaxLevel.set(m, cur ? maxLevel(cur, f.level) : f.level);
    }
  }
  const orderedModules = [...affectedModules].sort((a, b) => {
    const la = moduleMaxLevel.get(a) ?? 'info';
    const lb = moduleMaxLevel.get(b) ?? 'info';
    if (LEVEL_RANK[lb] !== LEVEL_RANK[la]) return LEVEL_RANK[lb] - LEVEL_RANK[la];
    return a.localeCompare(b);
  });
  const recommendedNextSteps = orderedModules.map((m) => NEXT_STEP_BY_MODULE[m]);

  // 6) Strict bucketing.
  const blockers = findings.filter((f) => f.level === 'abort');
  const warnings = findings.filter((f) => f.level === 'warning' || f.level === 'needs_review');

  // 7) Aggregate reason codes.
  const reasonCodes = sortedUnique([
    ...findings.map((f) => f.reason_code),
    overallCode,
  ]);

  return {
    session_id: sessionId,
    ticker: options.ticker ?? null,
    generated_at: new Date().toISOString(),
    escalation_level: overallLevel,
    action,
    reason_codes: reasonCodes,
    findings,
    affected_modules: affectedModules,
    recommended_next_steps: recommendedNextSteps,
    blockers,
    warnings,
  };
}

// =============================================================================
// Adapter — recordEscalationReport
// =============================================================================

export const ESCALATION_CONTEXT_KEYS = {
  REPORT: 'escalation_report',
  REPORT_JSON: 'escalation_report_json',
} as const;

/**
 * Append an EscalationReport into the caller's accumulatedContext.
 *
 * - 'escalation_report' is an append-only array; existing entries preserved.
 * - 'escalation_report_json' is a JSON string mirror.
 *
 * Mutates only the two keys above; never touches the DB or any other key,
 * and never mutates cached output objects (analytical narrative is preserved).
 */
export function recordEscalationReport(
  sessionId: string,
  report: EscalationReport,
  accumulatedContext: Record<string, unknown>,
): void {
  const prior = accumulatedContext[ESCALATION_CONTEXT_KEYS.REPORT];
  const log: Array<EscalationReport & { recorded_for_session: string }> = Array.isArray(prior)
    ? (prior as Array<EscalationReport & { recorded_for_session: string }>).slice()
    : [];
  log.push({ ...report, recorded_for_session: sessionId });
  accumulatedContext[ESCALATION_CONTEXT_KEYS.REPORT] = log;
  accumulatedContext[ESCALATION_CONTEXT_KEYS.REPORT_JSON] = JSON.stringify(log);
}

// =============================================================================
// Test exports — narrow surface
// =============================================================================

export {
  LEVEL_RANK,
  ACTION_BY_LEVEL,
  REASON_CODE_LEVEL,
  NEXT_STEP_BY_MODULE,
  SOURCE_DECLARATION_ORDER,
};
