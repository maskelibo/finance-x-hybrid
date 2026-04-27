/**
 * Idempotency + Saga Pattern Decisions (Block P — Plan P4C Wave 1).
 *
 * Standalone module that emits two parallel decisions per saga step:
 *
 *   1) IdempotencyVerdict — should this single operation be skipped (because
 *      a prior identical attempt succeeded), proceeded (new or fingerprint
 *      mismatch), or retried (failed but idempotent)?
 *
 *   2) SagaStatus + per-step CompensationStep — when a downstream step has
 *      failed AND prior steps have completed, emit LIFO compensation
 *      (rollback) steps so the caller can unwind partial progress.
 *
 * Wave 1 invariants:
 *   - Standalone: no orchestrator / agent-runner / saga-executor wiring. The
 *     module RECOMMENDS; the caller acts (executes, retries, compensates).
 *   - Read-only: never mutates accumulated_context outside the adapter's two
 *     keys. Cached analytical narrative is preserved verbatim.
 *   - Deterministic: same input → same plan (modulo `generated_at`).
 *   - Every verdict / compensation step carries exactly one frozen reason
 *     code from IDEMPO_REASON_CODES / SAGA_REASON_CODES.
 *   - No LLM calls; no DB access; no network/disk I/O.
 */

// =============================================================================
// Frozen reason-code constants
// =============================================================================

export const IDEMPO_REASON_CODES = {
  IDEMPO_SKIP_FINGERPRINT_MATCH: 'IDEMPO_SKIP_FINGERPRINT_MATCH',
  IDEMPO_SKIP_ALREADY_COMPLETED: 'IDEMPO_SKIP_ALREADY_COMPLETED',
  IDEMPO_PROCEED_NEW_OPERATION: 'IDEMPO_PROCEED_NEW_OPERATION',
  IDEMPO_PROCEED_FINGERPRINT_MISMATCH: 'IDEMPO_PROCEED_FINGERPRINT_MISMATCH',
  IDEMPO_RETRY_FAILED_IDEMPOTENT: 'IDEMPO_RETRY_FAILED_IDEMPOTENT',
  IDEMPO_PROCEED_FAILED_NON_IDEMPOTENT: 'IDEMPO_PROCEED_FAILED_NON_IDEMPOTENT',
} as const;

export const SAGA_REASON_CODES = {
  SAGA_STATUS_SUCCESS: 'SAGA_STATUS_SUCCESS',
  SAGA_STATUS_PARTIAL_FAILURE: 'SAGA_STATUS_PARTIAL_FAILURE',
  SAGA_STATUS_REQUIRES_COMPENSATION: 'SAGA_STATUS_REQUIRES_COMPENSATION',
  SAGA_COMPENSATE_LIFO: 'SAGA_COMPENSATE_LIFO',
  SAGA_COMPENSATE_NO_ACTION_NEEDED: 'SAGA_COMPENSATE_NO_ACTION_NEEDED',
  SAGA_COMPENSATE_MANUAL_INTERVENTION_REQUIRED: 'SAGA_COMPENSATE_MANUAL_INTERVENTION_REQUIRED',
} as const;

export type IdempoReasonCode = typeof IDEMPO_REASON_CODES[keyof typeof IDEMPO_REASON_CODES];
export type SagaReasonCode = typeof SAGA_REASON_CODES[keyof typeof SAGA_REASON_CODES];

// =============================================================================
// Types
// =============================================================================

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export type IdempotencyDecision = 'skip_idempotent' | 'proceed_new' | 'retry_after_failure';

export type CompensationDecision =
  | 'compensate'
  | 'no_action_needed'
  | 'manual_intervention_required';

export type SagaStatus = 'success' | 'partial_failure' | 'requires_compensation';

export interface SagaStepInput {
  step_id: string;
  kind: string;
  fingerprint: string;
  status: StepStatus;
  has_compensating_action: boolean;
  is_idempotent: boolean;
  /** Read-only operations etc. — completed but no rollback needed. */
  is_safe_no_op?: boolean;
  /** When status='completed', the fingerprint recorded with the prior
   *  successful execution. Compared against `fingerprint` to detect drift. */
  prior_result_fingerprint?: string;
}

export interface IdempotencyVerdict {
  step_id: string;
  kind: string;
  fingerprint: string;
  decision: IdempotencyDecision;
  reason_code: IdempoReasonCode;
  details: string;
}

export interface CompensationStep {
  step_id: string;
  kind: string;
  decision: CompensationDecision;
  reason_code: SagaReasonCode;
  compensating_action_description: string;
}

export interface IdempotencySagaPlan {
  session_id: string;
  ticker: string | null;
  generated_at: string;
  idempotency_verdicts: IdempotencyVerdict[];
  saga_status: SagaStatus;
  /** LIFO over completed steps when saga_status='requires_compensation' OR
   *  options.force_compensation=true. Empty otherwise. */
  compensation_steps: CompensationStep[];
  recommended_next_steps: string[];
  reason_codes: string[];
  warnings: string[];
}

export interface IdempotencySagaInputs {
  saga_steps: SagaStepInput[];
  /** Caller-supplied accumulated context with prior operation results.
   *  When a step's `kind` matches a key here, IDEMPO_SKIP_ALREADY_COMPLETED
   *  fires (provided fingerprint comparison didn't already short-circuit). */
  accumulated_context?: Record<string, unknown>;
  /** Force compensation plan emission even if no failure was observed
   *  (dry-run rollback). Default false. */
  force_compensation?: boolean;
}

export interface IdempotencySagaOptions {
  ticker?: string | null;
  /** Read-only — surfaced for the optional adapter. Never mutated. */
  accumulated_context?: Record<string, unknown>;
}

// =============================================================================
// Helpers
// =============================================================================

function sortedUnique<T extends string>(values: ReadonlyArray<T>): T[] {
  return Array.from(new Set(values)).sort() as T[];
}

// =============================================================================
// Idempotency classifier
// =============================================================================

function classifyIdempotency(
  step: SagaStepInput,
  accCtx: Record<string, unknown>,
): IdempotencyVerdict {
  const base = { step_id: step.step_id, kind: step.kind, fingerprint: step.fingerprint };

  if (step.status === 'pending' || step.status === 'in_progress') {
    return {
      ...base,
      decision: 'proceed_new',
      reason_code: IDEMPO_REASON_CODES.IDEMPO_PROCEED_NEW_OPERATION,
      details: `${step.kind}: status=${step.status}, yeni / devam eden işlem.`,
    };
  }

  if (step.status === 'failed') {
    if (step.is_idempotent) {
      return {
        ...base,
        decision: 'retry_after_failure',
        reason_code: IDEMPO_REASON_CODES.IDEMPO_RETRY_FAILED_IDEMPOTENT,
        details: `${step.kind}: failed ama idempotent — yeniden çalıştırma güvenli.`,
      };
    }
    return {
      ...base,
      decision: 'proceed_new',
      reason_code: IDEMPO_REASON_CODES.IDEMPO_PROCEED_FAILED_NON_IDEMPOTENT,
      details: `${step.kind}: failed ve idempotent değil — temkinli yeniden başlatma gerekli.`,
    };
  }

  // status === 'completed'
  if (step.prior_result_fingerprint !== undefined) {
    if (step.prior_result_fingerprint === step.fingerprint) {
      return {
        ...base,
        decision: 'skip_idempotent',
        reason_code: IDEMPO_REASON_CODES.IDEMPO_SKIP_FINGERPRINT_MATCH,
        details: `${step.kind}: önceki sonuç fingerprint'i eşleşiyor — atla.`,
      };
    }
    return {
      ...base,
      decision: 'proceed_new',
      reason_code: IDEMPO_REASON_CODES.IDEMPO_PROCEED_FINGERPRINT_MISMATCH,
      details: `${step.kind}: önceki sonuç fingerprint'i (${step.prior_result_fingerprint}) farklı — yeniden çalıştır.`,
    };
  }

  if (Object.prototype.hasOwnProperty.call(accCtx, step.kind)) {
    return {
      ...base,
      decision: 'skip_idempotent',
      reason_code: IDEMPO_REASON_CODES.IDEMPO_SKIP_ALREADY_COMPLETED,
      details: `${step.kind}: accumulated_context'ta sonuç mevcut — atla.`,
    };
  }

  // No prior_result_fingerprint and no accCtx evidence.
  return {
    ...base,
    decision: 'proceed_new',
    reason_code: IDEMPO_REASON_CODES.IDEMPO_PROCEED_NEW_OPERATION,
    details: `${step.kind}: status=completed ama bilinen prior sonuç yok — temkinli yeniden çalıştır.`,
  };
}

// =============================================================================
// Saga status classifier
// =============================================================================

function classifySagaStatus(steps: ReadonlyArray<SagaStepInput>): SagaStatus {
  const hasFailed = steps.some((s) => s.status === 'failed');
  if (!hasFailed) return 'success';
  // Find the index of the first failure; if any earlier step completed → requires compensation.
  const firstFailureIdx = steps.findIndex((s) => s.status === 'failed');
  const priorCompleted = steps
    .slice(0, firstFailureIdx)
    .some((s) => s.status === 'completed');
  return priorCompleted ? 'requires_compensation' : 'partial_failure';
}

// =============================================================================
// Compensation step builder (LIFO)
// =============================================================================

function buildCompensationSteps(
  steps: ReadonlyArray<SagaStepInput>,
): CompensationStep[] {
  const out: CompensationStep[] = [];
  // LIFO over COMPLETED steps in input order — reversed.
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i];
    if (s.status !== 'completed') continue;
    if (s.is_safe_no_op === true) {
      out.push({
        step_id: s.step_id, kind: s.kind,
        decision: 'no_action_needed',
        reason_code: SAGA_REASON_CODES.SAGA_COMPENSATE_NO_ACTION_NEEDED,
        compensating_action_description: `${s.kind}: side-effect yok — rollback gerekmiyor.`,
      });
      continue;
    }
    if (s.has_compensating_action) {
      out.push({
        step_id: s.step_id, kind: s.kind,
        decision: 'compensate',
        reason_code: SAGA_REASON_CODES.SAGA_COMPENSATE_LIFO,
        compensating_action_description: `${s.kind}: kayıtlı compensating action LIFO sırada uygulanır.`,
      });
      continue;
    }
    out.push({
      step_id: s.step_id, kind: s.kind,
      decision: 'manual_intervention_required',
      reason_code: SAGA_REASON_CODES.SAGA_COMPENSATE_MANUAL_INTERVENTION_REQUIRED,
      compensating_action_description: `${s.kind}: compensating action tanımlanmamış — operatör müdahalesi gerekli.`,
    });
  }
  return out;
}

// =============================================================================
// Main entry — runIdempotencySaga
// =============================================================================

export async function runIdempotencySaga(
  sessionId: string,
  inputs: IdempotencySagaInputs,
  options: IdempotencySagaOptions = {},
): Promise<IdempotencySagaPlan> {
  const warnings: string[] = [];
  const accCtx = inputs.accumulated_context ?? {};
  const steps = inputs.saga_steps;

  // 1) Idempotency verdicts (preserve input order).
  const verdicts: IdempotencyVerdict[] = steps.map((s) => classifyIdempotency(s, accCtx));

  // 2) Saga status.
  const sagaStatus = classifySagaStatus(steps);

  // 3) Compensation steps — emitted when requires_compensation OR force.
  const shouldCompensate = sagaStatus === 'requires_compensation' || inputs.force_compensation === true;
  const compensationSteps = shouldCompensate ? buildCompensationSteps(steps) : [];

  // 4) Recommended next steps — deterministic Turkish text.
  const nextSteps: string[] = [];
  if (sagaStatus === 'success') {
    nextSteps.push('saga: tüm adımlar başarılı; ek aksiyon gerekmiyor.');
  } else if (sagaStatus === 'partial_failure') {
    nextSteps.push('saga: kısmi başarısızlık; başarısız adım(lar)ı yeniden deneyebilir veya saga\'yı durdurabilirsiniz.');
  } else {
    nextSteps.push('saga: tamamlanan adımlar için LIFO sırada compensation uygulanmalı.');
  }
  const skipCount = verdicts.filter((v) => v.decision === 'skip_idempotent').length;
  const retryCount = verdicts.filter((v) => v.decision === 'retry_after_failure').length;
  if (skipCount > 0) {
    nextSteps.push(`idempotency: ${skipCount} adım önceki sonuçla eşleşiyor — atlanabilir.`);
  }
  if (retryCount > 0) {
    nextSteps.push(`idempotency: ${retryCount} idempotent adım yeniden denenebilir.`);
  }

  // 5) Aggregate reason codes (sorted unique).
  const sagaStatusCode: SagaReasonCode = sagaStatus === 'success'
    ? SAGA_REASON_CODES.SAGA_STATUS_SUCCESS
    : sagaStatus === 'partial_failure'
      ? SAGA_REASON_CODES.SAGA_STATUS_PARTIAL_FAILURE
      : SAGA_REASON_CODES.SAGA_STATUS_REQUIRES_COMPENSATION;

  const reasonCodes = sortedUnique([
    ...verdicts.map((v) => v.reason_code as string),
    ...compensationSteps.map((c) => c.reason_code as string),
    sagaStatusCode,
  ]);

  return {
    session_id: sessionId,
    ticker: options.ticker ?? null,
    generated_at: new Date().toISOString(),
    idempotency_verdicts: verdicts,
    saga_status: sagaStatus,
    compensation_steps: compensationSteps,
    recommended_next_steps: nextSteps,
    reason_codes: reasonCodes,
    warnings,
  };
}

// =============================================================================
// Adapter — recordIdempotencySagaPlan
// =============================================================================

export const IDEMPOTENCY_SAGA_CONTEXT_KEYS = {
  PLAN: 'idempotency_saga_plan',
  PLAN_JSON: 'idempotency_saga_plan_json',
} as const;

/**
 * Append an IdempotencySagaPlan into the caller's accumulatedContext.
 *
 * - 'idempotency_saga_plan' is an append-only array; existing entries preserved.
 * - 'idempotency_saga_plan_json' is a JSON string mirror.
 *
 * Mutates only the two keys above; never touches the DB or any other key.
 */
export function recordIdempotencySagaPlan(
  sessionId: string,
  plan: IdempotencySagaPlan,
  accumulatedContext: Record<string, unknown>,
): void {
  const prior = accumulatedContext[IDEMPOTENCY_SAGA_CONTEXT_KEYS.PLAN];
  const log: Array<IdempotencySagaPlan & { recorded_for_session: string }> = Array.isArray(prior)
    ? (prior as Array<IdempotencySagaPlan & { recorded_for_session: string }>).slice()
    : [];
  log.push({ ...plan, recorded_for_session: sessionId });
  accumulatedContext[IDEMPOTENCY_SAGA_CONTEXT_KEYS.PLAN] = log;
  accumulatedContext[IDEMPOTENCY_SAGA_CONTEXT_KEYS.PLAN_JSON] = JSON.stringify(log);
}
