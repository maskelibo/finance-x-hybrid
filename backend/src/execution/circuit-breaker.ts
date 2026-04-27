/**
 * Circuit Breaker Decisions (Block P — Plan P4D Wave 1).
 *
 * Standalone module that tracks per-operation failure history and emits
 * circuit-breaker decisions: closed/open/half_open state with allow/block/probe
 * action recommendations.
 *
 * Wave 1 invariants:
 *   - Standalone: no orchestrator / agent-runner / retry wiring. The module
 *     RECOMMENDS; the caller acts (executes the call, records the result,
 *     updates last_opened_at).
 *   - Read-only: never mutates accumulated_context outside the adapter's two
 *     keys; cached analytical narrative preserved verbatim.
 *   - Deterministic: same input → same plan (modulo `generated_at`).
 *   - Every verdict carries exactly one frozen reason code from
 *     CIRCUIT_BREAKER_REASON_CODES.
 *   - No LLM calls; no DB access; no network/disk I/O.
 */

// =============================================================================
// Frozen reason-code constants (7)
// =============================================================================

export const CIRCUIT_BREAKER_REASON_CODES = {
  CB_CLOSED_HEALTHY: 'CB_CLOSED_HEALTHY',
  CB_CLOSED_UNDER_THRESHOLD: 'CB_CLOSED_UNDER_THRESHOLD',
  CB_INSUFFICIENT_HISTORY: 'CB_INSUFFICIENT_HISTORY',
  CB_OPEN_FAILURE_THRESHOLD_EXCEEDED: 'CB_OPEN_FAILURE_THRESHOLD_EXCEEDED',
  CB_OPEN_COOLDOWN_ACTIVE: 'CB_OPEN_COOLDOWN_ACTIVE',
  CB_HALF_OPEN_PROBE: 'CB_HALF_OPEN_PROBE',
  CB_HALF_OPEN_RECOVERED: 'CB_HALF_OPEN_RECOVERED',
} as const;

export type CircuitBreakerReasonCode =
  typeof CIRCUIT_BREAKER_REASON_CODES[keyof typeof CIRCUIT_BREAKER_REASON_CODES];

// =============================================================================
// Types
// =============================================================================

export type CircuitState = 'closed' | 'open' | 'half_open';
export type CircuitDecision = 'allow' | 'block' | 'probe';

export type AttemptStatus = 'success' | 'failure';

export interface AttemptRecord {
  status: AttemptStatus;
  timestamp_iso: string;
}

export interface OperationInput {
  operation_id: string;
  kind: string;
  /** Most recent attempt FIRST. */
  recent_attempts: AttemptRecord[];
  /** Timestamp the circuit was last opened (the trip point). When omitted,
   *  the operation has never been opened. */
  last_opened_at?: string;
}

export interface CircuitBreakerVerdict {
  operation_id: string;
  kind: string;
  state: CircuitState;
  decision: CircuitDecision;
  reason_code: CircuitBreakerReasonCode;
  failure_count_window: number;
  success_count_window: number;
  consecutive_failures: number;
  cooldown_remaining_ms: number;
  details: string;
}

export interface CircuitBreakerPlan {
  session_id: string;
  ticker: string | null;
  generated_at: string;
  verdicts: CircuitBreakerVerdict[];
  any_open: boolean;
  any_half_open: boolean;
  blocked_kinds: string[];
  recommended_next_steps: string[];
  reason_codes: string[];
  warnings: string[];
}

export interface CircuitBreakerInputs {
  operations: OperationInput[];
}

export interface CircuitBreakerOptions {
  ticker?: string | null;
  /** Consecutive failures (most recent) needed to trip the circuit. Default 5. */
  failure_threshold?: number;
  /** Consecutive successes needed in half-open to close. Default 2. */
  success_threshold?: number;
  /** Milliseconds the circuit stays "open / cooldown active" before
   *  transitioning to half_open. Default 30_000. */
  cooldown_ms?: number;
  /** Window of recent attempts to count over. Default 10. */
  window_size?: number;
  /** Override of wall clock (test-only). */
  now_iso?: string;
  /** Read-only — surfaced for the optional adapter. Never mutated. */
  accumulated_context?: Record<string, unknown>;
}

// =============================================================================
// Defaults
// =============================================================================

const DEFAULTS = {
  failure_threshold: 5,
  success_threshold: 2,
  cooldown_ms: 30_000,
  window_size: 10,
} as const;

// =============================================================================
// Helpers
// =============================================================================

function sortedUnique<T extends string>(values: ReadonlyArray<T>): T[] {
  return Array.from(new Set(values)).sort() as T[];
}

function countWindow(
  attempts: ReadonlyArray<AttemptRecord>,
  windowSize: number,
): { failures: number; successes: number } {
  const window = attempts.slice(0, windowSize);
  let failures = 0;
  let successes = 0;
  for (const a of window) {
    if (a.status === 'failure') failures++;
    else if (a.status === 'success') successes++;
  }
  return { failures, successes };
}

function consecutiveFailuresFromHead(attempts: ReadonlyArray<AttemptRecord>): number {
  let n = 0;
  for (const a of attempts) {
    if (a.status === 'failure') n++;
    else break;
  }
  return n;
}

function consecutiveSuccessesFromHead(attempts: ReadonlyArray<AttemptRecord>): number {
  let n = 0;
  for (const a of attempts) {
    if (a.status === 'success') n++;
    else break;
  }
  return n;
}

// =============================================================================
// Per-operation classifier
// =============================================================================

interface ClassifyArgs {
  op: OperationInput;
  failureThreshold: number;
  successThreshold: number;
  cooldownMs: number;
  windowSize: number;
  now: Date;
}

function classifyOperation(args: ClassifyArgs): CircuitBreakerVerdict {
  const { op, failureThreshold, successThreshold, cooldownMs, windowSize, now } = args;
  const { failures, successes } = countWindow(op.recent_attempts, windowSize);
  const consecutiveFailures = consecutiveFailuresFromHead(op.recent_attempts);
  const consecutiveSuccesses = consecutiveSuccessesFromHead(op.recent_attempts);

  // -- Branch on whether the circuit was previously opened ------------------
  if (op.last_opened_at) {
    const openedAt = new Date(op.last_opened_at).getTime();
    const elapsed = Number.isFinite(openedAt) ? now.getTime() - openedAt : Number.POSITIVE_INFINITY;
    const remaining = Math.max(0, cooldownMs - elapsed);
    if (remaining > 0) {
      return {
        operation_id: op.operation_id, kind: op.kind,
        state: 'open', decision: 'block',
        reason_code: CIRCUIT_BREAKER_REASON_CODES.CB_OPEN_COOLDOWN_ACTIVE,
        failure_count_window: failures, success_count_window: successes,
        consecutive_failures: consecutiveFailures,
        cooldown_remaining_ms: remaining,
        details: `${op.kind}: cooldown aktif (kalan ${remaining} ms) — istek bloklanıyor.`,
      };
    }
    // Cooldown expired — half_open OR recovered.
    if (consecutiveSuccesses >= successThreshold) {
      return {
        operation_id: op.operation_id, kind: op.kind,
        state: 'closed', decision: 'allow',
        reason_code: CIRCUIT_BREAKER_REASON_CODES.CB_HALF_OPEN_RECOVERED,
        failure_count_window: failures, success_count_window: successes,
        consecutive_failures: consecutiveFailures,
        cooldown_remaining_ms: 0,
        details: `${op.kind}: ${consecutiveSuccesses} ardışık başarı — devre kapandı.`,
      };
    }
    return {
      operation_id: op.operation_id, kind: op.kind,
      state: 'half_open', decision: 'probe',
      reason_code: CIRCUIT_BREAKER_REASON_CODES.CB_HALF_OPEN_PROBE,
      failure_count_window: failures, success_count_window: successes,
      consecutive_failures: consecutiveFailures,
      cooldown_remaining_ms: 0,
      details: `${op.kind}: cooldown bitti — sondaj isteği izin veriliyor.`,
    };
  }

  // -- No prior open: closed (most cases) -----------------------------------
  if (op.recent_attempts.length === 0) {
    return {
      operation_id: op.operation_id, kind: op.kind,
      state: 'closed', decision: 'allow',
      reason_code: CIRCUIT_BREAKER_REASON_CODES.CB_INSUFFICIENT_HISTORY,
      failure_count_window: 0, success_count_window: 0,
      consecutive_failures: 0,
      cooldown_remaining_ms: 0,
      details: `${op.kind}: geçmiş veri yok — varsayılan olarak izinli.`,
    };
  }

  if (consecutiveFailures >= failureThreshold) {
    return {
      operation_id: op.operation_id, kind: op.kind,
      state: 'open', decision: 'block',
      reason_code: CIRCUIT_BREAKER_REASON_CODES.CB_OPEN_FAILURE_THRESHOLD_EXCEEDED,
      failure_count_window: failures, success_count_window: successes,
      consecutive_failures: consecutiveFailures,
      cooldown_remaining_ms: cooldownMs,
      details: `${op.kind}: ${consecutiveFailures} ardışık başarısızlık ${failureThreshold} eşiğini aştı — devre açıldı.`,
    };
  }

  if (failures > 0) {
    return {
      operation_id: op.operation_id, kind: op.kind,
      state: 'closed', decision: 'allow',
      reason_code: CIRCUIT_BREAKER_REASON_CODES.CB_CLOSED_UNDER_THRESHOLD,
      failure_count_window: failures, success_count_window: successes,
      consecutive_failures: consecutiveFailures,
      cooldown_remaining_ms: 0,
      details: `${op.kind}: pencerede ${failures} başarısızlık var, eşik altında — izinli.`,
    };
  }

  return {
    operation_id: op.operation_id, kind: op.kind,
    state: 'closed', decision: 'allow',
    reason_code: CIRCUIT_BREAKER_REASON_CODES.CB_CLOSED_HEALTHY,
    failure_count_window: 0, success_count_window: successes,
    consecutive_failures: 0,
    cooldown_remaining_ms: 0,
    details: `${op.kind}: pencere temiz (${successes} başarı) — sağlıklı.`,
  };
}

// =============================================================================
// Main entry — runCircuitBreaker
// =============================================================================

export async function runCircuitBreaker(
  sessionId: string,
  inputs: CircuitBreakerInputs,
  options: CircuitBreakerOptions = {},
): Promise<CircuitBreakerPlan> {
  const warnings: string[] = [];
  const failureThreshold = typeof options.failure_threshold === 'number' && Number.isFinite(options.failure_threshold)
    ? options.failure_threshold
    : DEFAULTS.failure_threshold;
  const successThreshold = typeof options.success_threshold === 'number' && Number.isFinite(options.success_threshold)
    ? options.success_threshold
    : DEFAULTS.success_threshold;
  const cooldownMs = typeof options.cooldown_ms === 'number' && Number.isFinite(options.cooldown_ms)
    ? options.cooldown_ms
    : DEFAULTS.cooldown_ms;
  const windowSize = typeof options.window_size === 'number' && Number.isFinite(options.window_size)
    ? options.window_size
    : DEFAULTS.window_size;
  const now = options.now_iso ? new Date(options.now_iso) : new Date();

  const verdicts: CircuitBreakerVerdict[] = inputs.operations.map((op) =>
    classifyOperation({ op, failureThreshold, successThreshold, cooldownMs, windowSize, now }),
  );

  const anyOpen = verdicts.some((v) => v.state === 'open');
  const anyHalfOpen = verdicts.some((v) => v.state === 'half_open');
  const blockedKinds = sortedUnique(
    verdicts.filter((v) => v.decision === 'block').map((v) => v.kind),
  );

  const nextSteps: string[] = [];
  if (anyOpen) {
    nextSteps.push(`circuit_breaker: ${blockedKinds.length} işlem türü açık devre nedeniyle bloklandı: ${blockedKinds.join(', ')}.`);
  }
  if (anyHalfOpen) {
    nextSteps.push('circuit_breaker: half_open durumunda olan işlemler için tek sondaj izni var; sonuç geri yazılmalı.');
  }
  if (!anyOpen && !anyHalfOpen && verdicts.length > 0) {
    nextSteps.push('circuit_breaker: tüm devreler kapalı (sağlıklı) — istekler normal şekilde ilerleyebilir.');
  }

  const reasonCodes = sortedUnique(verdicts.map((v) => v.reason_code as string));

  return {
    session_id: sessionId,
    ticker: options.ticker ?? null,
    generated_at: new Date().toISOString(),
    verdicts,
    any_open: anyOpen,
    any_half_open: anyHalfOpen,
    blocked_kinds: blockedKinds,
    recommended_next_steps: nextSteps,
    reason_codes: reasonCodes,
    warnings,
  };
}

// =============================================================================
// Adapter — recordCircuitBreakerPlan
// =============================================================================

export const CIRCUIT_BREAKER_CONTEXT_KEYS = {
  PLAN: 'circuit_breaker_plan',
  PLAN_JSON: 'circuit_breaker_plan_json',
} as const;

/**
 * Append a CircuitBreakerPlan into the caller's accumulatedContext.
 *
 * - 'circuit_breaker_plan' is an append-only array; existing entries preserved.
 * - 'circuit_breaker_plan_json' is a JSON string mirror.
 *
 * Mutates only the two keys above.
 */
export function recordCircuitBreakerPlan(
  sessionId: string,
  plan: CircuitBreakerPlan,
  accumulatedContext: Record<string, unknown>,
): void {
  const prior = accumulatedContext[CIRCUIT_BREAKER_CONTEXT_KEYS.PLAN];
  const log: Array<CircuitBreakerPlan & { recorded_for_session: string }> = Array.isArray(prior)
    ? (prior as Array<CircuitBreakerPlan & { recorded_for_session: string }>).slice()
    : [];
  log.push({ ...plan, recorded_for_session: sessionId });
  accumulatedContext[CIRCUIT_BREAKER_CONTEXT_KEYS.PLAN] = log;
  accumulatedContext[CIRCUIT_BREAKER_CONTEXT_KEYS.PLAN_JSON] = JSON.stringify(log);
}

// =============================================================================
// Test exports
// =============================================================================

export {
  DEFAULTS as CIRCUIT_BREAKER_DEFAULTS,
};
