/**
 * Self-Healing Pipeline Decisions (Block P — Plan P4B Wave 1).
 *
 * Standalone module that consumes a P4A EscalationReport and emits a
 * SelfHealingPlan: per-finding recovery actions categorized as
 * auto_heal | assisted_heal | manual_heal | no_action_needed |
 * abort_no_recovery, plus a session-level overall_recoverability classifier.
 *
 * Wave 1 invariants:
 *   - Standalone: no orchestrator / agent-runner wiring. The module
 *     RECOMMENDS heals; it does not invoke any agent or task itself.
 *   - Read-only: never mutates accumulated_context outside the adapter's
 *     two keys; cached analytical narrative preserved verbatim.
 *   - Deterministic: same EscalationReport → same SelfHealingPlan
 *     (modulo `generated_at`); ordering rules are fully specified.
 *   - Every healing action carries exactly one frozen HEAL_* action_code.
 *   - The ESC_* → HEAL_* mapping is a single source-of-truth table; no
 *     branching logic outside the table.
 *   - No LLM calls; no DB access; no network/disk I/O.
 */

import { createHash } from 'node:crypto';
import {
  ESCALATION_REASON_CODES,
  type EscalationFinding,
  type EscalationReport,
  type SourceModule,
} from './escalation-manager.js';
import type { TaskKind } from './task-planner.js';

// =============================================================================
// Frozen reason-code constants (12)
// =============================================================================

export const HEALING_ACTION_CODES = {
  HEAL_RETRY_PLANNER: 'HEAL_RETRY_PLANNER',
  HEAL_RETRY_PREDECESSOR: 'HEAL_RETRY_PREDECESSOR',
  HEAL_REFRESH_CACHE: 'HEAL_REFRESH_CACHE',
  HEAL_NEW_SESSION_RECOMMENDED: 'HEAL_NEW_SESSION_RECOMMENDED',
  HEAL_RECOMMEND_BUDGET_INCREASE: 'HEAL_RECOMMEND_BUDGET_INCREASE',
  HEAL_AUTO_APPLY_DOWNGRADE: 'HEAL_AUTO_APPLY_DOWNGRADE',
  HEAL_RUN_RECONCILIATION: 'HEAL_RUN_RECONCILIATION',
  HEAL_RERUN_PARSE_STANDARDIZATION: 'HEAL_RERUN_PARSE_STANDARDIZATION',
  HEAL_RERUN_FINANCIAL_ANALYSIS: 'HEAL_RERUN_FINANCIAL_ANALYSIS',
  HEAL_ASSIGN_OWNER_REQUIRED: 'HEAL_ASSIGN_OWNER_REQUIRED',
  HEAL_NO_ACTION_NEEDED: 'HEAL_NO_ACTION_NEEDED',
  HEAL_ABORT_NO_RECOVERY: 'HEAL_ABORT_NO_RECOVERY',
} as const;

export type HealingActionCode =
  typeof HEALING_ACTION_CODES[keyof typeof HEALING_ACTION_CODES];

// =============================================================================
// Types
// =============================================================================

export type HealingDecision =
  | 'auto_heal'
  | 'assisted_heal'
  | 'manual_heal'
  | 'no_action_needed'
  | 'abort_no_recovery';

export type OverallRecoverability =
  | 'fully_recoverable'
  | 'partially_recoverable'
  | 'not_recoverable';

export interface HealingAction {
  action_id: string;             // sha1(session|finding_id|action_code), 'heal-' prefix
  finding_id: string;            // mirrors EscalationFinding.finding_id
  source_reason_code: string;    // ESC_* that triggered this heal
  decision: HealingDecision;
  action_code: HealingActionCode;
  target_module: SourceModule;
  target_task_kinds: TaskKind[]; // sorted alphabetically
  description: string;            // deterministic Turkish text
  estimated_cost_usd: number;
  can_run_immediately: boolean;   // auto_heal that doesn't need operator input
}

export interface SelfHealingPlan {
  session_id: string;
  ticker: string | null;
  generated_at: string;
  overall_recoverability: OverallRecoverability;
  healing_actions: HealingAction[];
  auto_heal_actions: HealingAction[];
  assisted_heal_actions: HealingAction[];
  manual_heal_actions: HealingAction[];
  abort_actions: HealingAction[];
  estimated_recovery_steps: number;
  /** Ordered: abort first (when present), then auto_heal, assisted_heal,
   *  manual_heal, no_action_needed. Within each tier, alphabetical on
   *  action_code. */
  recommended_sequence: HealingAction[];
  estimated_total_cost_usd: number;
  reason_codes: string[];        // sorted unique HEAL_* + ESC_*
  warnings: string[];
}

export interface SelfHealingOptions {
  ticker?: string | null;
  /** Read-only — surfaced for the optional adapter. Never mutated. */
  accumulated_context?: Record<string, unknown>;
}

// =============================================================================
// ESC_* → HEAL_* mapping table (single source of truth)
// =============================================================================

interface MappingEntry {
  action_code: HealingActionCode;
  decision: HealingDecision;
  target_module: SourceModule;
  target_task_kinds: TaskKind[];
  /** Static USD estimate for this heal. 0 when no cost (manual / abort). */
  estimated_cost_usd: number;
  /** True for auto_heal that requires zero operator input. */
  can_run_immediately: boolean;
  /** Turkish description template. */
  description: string;
}

const ESC_TO_HEAL: Record<string, MappingEntry> = {
  [ESCALATION_REASON_CODES.ESC_PREFLIGHT_BLOCKER]: {
    action_code: HEALING_ACTION_CODES.HEAL_ABORT_NO_RECOVERY,
    decision: 'abort_no_recovery',
    target_module: 'preflight',
    target_task_kinds: [],
    estimated_cost_usd: 0,
    can_run_immediately: false,
    description: 'Preflight blocker terminal: oturum durdurulmalı, otomatik kurtarma yok.',
  },
  [ESCALATION_REASON_CODES.ESC_PREFLIGHT_WARNING]: {
    action_code: HEALING_ACTION_CODES.HEAL_NO_ACTION_NEEDED,
    decision: 'no_action_needed',
    target_module: 'preflight',
    target_task_kinds: [],
    estimated_cost_usd: 0,
    can_run_immediately: false,
    description: 'Preflight uyarısı bilgi amaçlı; aksiyon gerekmiyor.',
  },
  [ESCALATION_REASON_CODES.ESC_PLANNER_SKIP_ABORT]: {
    action_code: HEALING_ACTION_CODES.HEAL_RETRY_PLANNER,
    decision: 'auto_heal',
    target_module: 'task_planner',
    target_task_kinds: [],
    estimated_cost_usd: 0,
    can_run_immediately: true,
    description: 'Task planner yeniden çalıştırılabilir: preflight koşulları düzeltildikten sonra plan üretilsin.',
  },
  [ESCALATION_REASON_CODES.ESC_PLANNER_PREDECESSOR_FAILURE]: {
    action_code: HEALING_ACTION_CODES.HEAL_RETRY_PREDECESSOR,
    decision: 'auto_heal',
    target_module: 'task_planner',
    target_task_kinds: [],
    estimated_cost_usd: 0,
    can_run_immediately: true,
    description: 'Önkoşul ajanı yeniden tetiklenebilir: planlamayı yenileyin.',
  },
  [ESCALATION_REASON_CODES.ESC_INCREMENTAL_INVALIDATION]: {
    action_code: HEALING_ACTION_CODES.HEAL_REFRESH_CACHE,
    decision: 'auto_heal',
    target_module: 'incremental',
    target_task_kinds: [],
    estimated_cost_usd: 0,
    can_run_immediately: true,
    description: 'Cache tazelenmesi otomatik gerçekleştirilebilir: invalidate görevleri yeniden hesaplanır.',
  },
  [ESCALATION_REASON_CODES.ESC_INCREMENTAL_METHODOLOGY_DRIFT]: {
    action_code: HEALING_ACTION_CODES.HEAL_NEW_SESSION_RECOMMENDED,
    decision: 'manual_heal',
    target_module: 'incremental',
    target_task_kinds: [],
    estimated_cost_usd: 0,
    can_run_immediately: false,
    description: 'Metodoloji sürüm kayması — operatör yeni oturum açmalı; otomatik geçiş güvenli değil.',
  },
  [ESCALATION_REASON_CODES.ESC_COST_BUDGET_EXHAUSTED]: {
    action_code: HEALING_ACTION_CODES.HEAL_ABORT_NO_RECOVERY,
    decision: 'abort_no_recovery',
    target_module: 'cost_governor',
    target_task_kinds: [],
    estimated_cost_usd: 0,
    can_run_immediately: false,
    description: 'Bütçe tükendi: oturum durdurulmalı, otomatik kurtarma yok.',
  },
  [ESCALATION_REASON_CODES.ESC_COST_TIGHT_HEADROOM]: {
    action_code: HEALING_ACTION_CODES.HEAL_RECOMMEND_BUDGET_INCREASE,
    decision: 'assisted_heal',
    target_module: 'cost_governor',
    target_task_kinds: [],
    estimated_cost_usd: 0,
    can_run_immediately: false,
    description: 'Bütçe headroom %10 altında: operatör onayıyla budget_cap_usd değeri yükseltilebilir.',
  },
  [ESCALATION_REASON_CODES.ESC_COST_DOWNGRADE_RECOMMENDED]: {
    action_code: HEALING_ACTION_CODES.HEAL_AUTO_APPLY_DOWNGRADE,
    decision: 'auto_heal',
    target_module: 'cost_governor',
    target_task_kinds: [],
    estimated_cost_usd: 0,
    can_run_immediately: true,
    description: 'Cost governor model kademe önerisi otomatik uygulanabilir: ekonomi modeline geçiş.',
  },
  [ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_HOLD]: {
    action_code: HEALING_ACTION_CODES.HEAL_ABORT_NO_RECOVERY,
    decision: 'abort_no_recovery',
    target_module: 'quality_budget',
    target_task_kinds: [],
    estimated_cost_usd: 0,
    can_run_immediately: false,
    description: 'Quality lifecycle="hold": kritik blokerler var, otomatik kurtarma yok.',
  },
  [ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_DEGRADED]: {
    action_code: HEALING_ACTION_CODES.HEAL_RUN_RECONCILIATION,
    decision: 'auto_heal',
    target_module: 'quality_budget',
    target_task_kinds: ['reconciliation'],
    estimated_cost_usd: 0.15,
    can_run_immediately: true,
    description: 'Quality lifecycle="degraded": reconciliation ajanı otomatik tetiklenebilir.',
  },
  [ESCALATION_REASON_CODES.ESC_QUALITY_LIFECYCLE_PWW]: {
    action_code: HEALING_ACTION_CODES.HEAL_NO_ACTION_NEEDED,
    decision: 'no_action_needed',
    target_module: 'quality_budget',
    target_task_kinds: [],
    estimated_cost_usd: 0,
    can_run_immediately: false,
    description: 'Quality lifecycle="publishable_with_warnings": yayın yapılabilir, ek aksiyon gerekmiyor.',
  },
  [ESCALATION_REASON_CODES.ESC_CONTRADICTION_CRITICAL]: {
    action_code: HEALING_ACTION_CODES.HEAL_RUN_RECONCILIATION,
    decision: 'auto_heal',
    target_module: 'contradiction',
    target_task_kinds: ['reconciliation'],
    estimated_cost_usd: 0.15,
    can_run_immediately: true,
    description: 'Kritik tutarsızlık: reconciliation ajanı otomatik çalıştırılabilir.',
  },
  [ESCALATION_REASON_CODES.ESC_CITATION_CRITICAL_GAP]: {
    action_code: HEALING_ACTION_CODES.HEAL_RERUN_PARSE_STANDARDIZATION,
    decision: 'auto_heal',
    target_module: 'citation',
    target_task_kinds: ['parse_standardization'],
    estimated_cost_usd: 0.20,
    can_run_immediately: true,
    description: 'Kritik citation eksiği: parse_standardization yeniden çalıştırılarak source_doc_id eklenir.',
  },
  [ESCALATION_REASON_CODES.ESC_COVERAGE_GAP]: {
    action_code: HEALING_ACTION_CODES.HEAL_RERUN_FINANCIAL_ANALYSIS,
    decision: 'auto_heal',
    target_module: 'coverage',
    target_task_kinds: ['financial_analysis'],
    estimated_cost_usd: 0.40,
    can_run_immediately: true,
    description: 'Coverage gap: financial_analysis ile eksik fact stem\'leri tamamlanır.',
  },
  [ESCALATION_REASON_CODES.ESC_CHAIRMAN_P0_QUESTION]: {
    action_code: HEALING_ACTION_CODES.HEAL_ASSIGN_OWNER_REQUIRED,
    decision: 'manual_heal',
    target_module: 'chairman_deterministic',
    target_task_kinds: [],
    estimated_cost_usd: 0,
    can_run_immediately: false,
    description: 'P0 yönetim kurulu sorusu: yanıt sahibi operatör tarafından atanmalı.',
  },
};

// =============================================================================
// Healing tier ordering (for recommended_sequence)
// =============================================================================

const TIER_RANK: Record<HealingDecision, number> = {
  abort_no_recovery: 0,    // surfaced first to make terminality visible
  auto_heal: 1,
  assisted_heal: 2,
  manual_heal: 3,
  no_action_needed: 4,
};

// =============================================================================
// Helpers
// =============================================================================

function actionId(sessionId: string, findingId: string, actionCode: HealingActionCode): string {
  const h = createHash('sha1').update(`${sessionId}|${findingId}|${actionCode}`).digest('hex').slice(0, 12);
  return `heal-${h}`;
}

function sortedUnique<T extends string>(values: ReadonlyArray<T>): T[] {
  return Array.from(new Set(values)).sort() as T[];
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function buildHealingAction(
  sessionId: string,
  finding: EscalationFinding,
): HealingAction | null {
  const mapping = ESC_TO_HEAL[finding.reason_code];
  if (!mapping) return null;  // overall codes (ESC_OVERALL_*) aren't mapped — skipped.
  return {
    action_id: actionId(sessionId, finding.finding_id, mapping.action_code),
    finding_id: finding.finding_id,
    source_reason_code: finding.reason_code,
    decision: mapping.decision,
    action_code: mapping.action_code,
    target_module: mapping.target_module,
    target_task_kinds: mapping.target_task_kinds.slice().sort(),
    description: mapping.description,
    estimated_cost_usd: round4(mapping.estimated_cost_usd),
    can_run_immediately: mapping.can_run_immediately,
  };
}

function classifyOverallRecoverability(actions: ReadonlyArray<HealingAction>): OverallRecoverability {
  if (actions.length === 0) return 'fully_recoverable';
  if (actions.some((a) => a.decision === 'abort_no_recovery')) return 'not_recoverable';
  const allAutoOrNoOp = actions.every((a) =>
    a.decision === 'auto_heal' || a.decision === 'no_action_needed',
  );
  if (allAutoOrNoOp) return 'fully_recoverable';
  return 'partially_recoverable';
}

// =============================================================================
// Main entry — runSelfHealingPipeline
// =============================================================================

export async function runSelfHealingPipeline(
  sessionId: string,
  escalation: EscalationReport,
  options: SelfHealingOptions = {},
): Promise<SelfHealingPlan> {
  const warnings: string[] = [];
  const actions: HealingAction[] = [];

  // 1) Map each finding 1:1 via ESC_TO_HEAL.
  for (const f of escalation.findings) {
    const action = buildHealingAction(sessionId, f);
    if (action) actions.push(action);
  }

  // 2) Bucket by decision.
  const auto: HealingAction[] = [];
  const assisted: HealingAction[] = [];
  const manual: HealingAction[] = [];
  const aborts: HealingAction[] = [];
  for (const a of actions) {
    switch (a.decision) {
      case 'auto_heal': auto.push(a); break;
      case 'assisted_heal': assisted.push(a); break;
      case 'manual_heal': manual.push(a); break;
      case 'abort_no_recovery': aborts.push(a); break;
      case 'no_action_needed': break;  // not bucketed; counted only via actions list
    }
  }

  // 3) Recommended sequence — abort first (terminality), then auto, assisted,
  //    manual, no_action_needed. Within each tier, alphabetical action_code.
  const sortedActions = [...actions].sort((a, b) => {
    if (TIER_RANK[a.decision] !== TIER_RANK[b.decision]) {
      return TIER_RANK[a.decision] - TIER_RANK[b.decision];
    }
    if (a.action_code !== b.action_code) {
      return a.action_code.localeCompare(b.action_code);
    }
    return a.finding_id.localeCompare(b.finding_id);
  });

  // 4) Estimated total cost — only across auto + assisted heals that the
  //    caller might actually execute. Manual / abort / no_action contribute 0
  //    by mapping (estimated_cost_usd already 0 for those).
  const estimatedTotal = round4(actions.reduce((acc, a) => acc + a.estimated_cost_usd, 0));

  const overall = classifyOverallRecoverability(actions);

  const reasonCodes = sortedUnique([
    ...actions.map((a) => a.action_code as string),
    ...escalation.findings.map((f) => f.reason_code),
  ]);

  return {
    session_id: sessionId,
    ticker: options.ticker ?? escalation.ticker ?? null,
    generated_at: new Date().toISOString(),
    overall_recoverability: overall,
    healing_actions: actions,
    auto_heal_actions: auto,
    assisted_heal_actions: assisted,
    manual_heal_actions: manual,
    abort_actions: aborts,
    estimated_recovery_steps: actions.filter((a) =>
      a.decision === 'auto_heal' || a.decision === 'assisted_heal' || a.decision === 'manual_heal',
    ).length,
    recommended_sequence: sortedActions,
    estimated_total_cost_usd: estimatedTotal,
    reason_codes: reasonCodes,
    warnings,
  };
}

// =============================================================================
// Adapter — recordSelfHealingPlan
// =============================================================================

export const SELF_HEALING_CONTEXT_KEYS = {
  PLAN: 'self_healing_plan',
  PLAN_JSON: 'self_healing_plan_json',
} as const;

/**
 * Append a SelfHealingPlan into the caller's accumulatedContext.
 *
 * - 'self_healing_plan' is an append-only array; existing entries preserved.
 * - 'self_healing_plan_json' is a JSON string mirror.
 *
 * Mutates only the two keys above; never touches the DB or any other key,
 * and never mutates cached output objects.
 */
export function recordSelfHealingPlan(
  sessionId: string,
  plan: SelfHealingPlan,
  accumulatedContext: Record<string, unknown>,
): void {
  const prior = accumulatedContext[SELF_HEALING_CONTEXT_KEYS.PLAN];
  const log: Array<SelfHealingPlan & { recorded_for_session: string }> = Array.isArray(prior)
    ? (prior as Array<SelfHealingPlan & { recorded_for_session: string }>).slice()
    : [];
  log.push({ ...plan, recorded_for_session: sessionId });
  accumulatedContext[SELF_HEALING_CONTEXT_KEYS.PLAN] = log;
  accumulatedContext[SELF_HEALING_CONTEXT_KEYS.PLAN_JSON] = JSON.stringify(log);
}

// =============================================================================
// Test exports
// =============================================================================

export {
  ESC_TO_HEAL,
  TIER_RANK,
};
