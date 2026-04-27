/**
 * P4C Wave 1 — idempotency + saga pattern tests.
 */
import { describe, expect, it } from 'vitest';
import {
  runIdempotencySaga,
  recordIdempotencySagaPlan,
  IDEMPO_REASON_CODES,
  SAGA_REASON_CODES,
  IDEMPOTENCY_SAGA_CONTEXT_KEYS,
  type IdempotencySagaPlan,
  type SagaStepInput,
} from './idempotency-saga.js';

// =============================================================================
// Fixtures
// =============================================================================

function step(
  step_id: string,
  status: SagaStepInput['status'],
  overrides: Partial<SagaStepInput> = {},
): SagaStepInput {
  return {
    step_id,
    kind: overrides.kind ?? `kind-${step_id}`,
    fingerprint: overrides.fingerprint ?? `fp-${step_id}`,
    status,
    has_compensating_action: overrides.has_compensating_action ?? false,
    is_idempotent: overrides.is_idempotent ?? false,
    is_safe_no_op: overrides.is_safe_no_op,
    prior_result_fingerprint: overrides.prior_result_fingerprint,
  };
}

// =============================================================================
// Smoke
// =============================================================================

describe('idempotency-saga — smoke', () => {
  it('async signature returns a Promise', () => {
    expect(runIdempotencySaga('s', { saga_steps: [] })).toBeInstanceOf(Promise);
  });

  it('empty inputs → success / no verdicts', async () => {
    const r = await runIdempotencySaga('s', { saga_steps: [] });
    expect(r.saga_status).toBe('success');
    expect(r.idempotency_verdicts).toEqual([]);
    expect(r.compensation_steps).toEqual([]);
    expect(r.reason_codes).toContain(SAGA_REASON_CODES.SAGA_STATUS_SUCCESS);
  });

  it('determinism: same input → same output mod generated_at', async () => {
    const inputs = {
      saga_steps: [
        step('s1', 'completed', { fingerprint: 'A', prior_result_fingerprint: 'A' }),
        step('s2', 'failed', { is_idempotent: true }),
      ],
    };
    const a = await runIdempotencySaga('s', inputs);
    const b = await runIdempotencySaga('s', inputs);
    const norm = (p: IdempotencySagaPlan): unknown =>
      JSON.parse(JSON.stringify(p, (k, v) => k === 'generated_at' ? null : v));
    expect(norm(a)).toEqual(norm(b));
  });
});

// =============================================================================
// IDEMPO_* reason codes — one positive test each
// =============================================================================

describe('idempotency-saga — IDEMPO_* codes', () => {
  it('IDEMPO_SKIP_FINGERPRINT_MATCH', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [step('s1', 'completed', {
        fingerprint: 'A', prior_result_fingerprint: 'A',
      })],
    });
    expect(r.idempotency_verdicts[0].decision).toBe('skip_idempotent');
    expect(r.idempotency_verdicts[0].reason_code).toBe(IDEMPO_REASON_CODES.IDEMPO_SKIP_FINGERPRINT_MATCH);
  });

  it('IDEMPO_SKIP_ALREADY_COMPLETED — accumulated_context evidence', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [step('s1', 'completed', { kind: 'val_dcf' })],
      accumulated_context: { val_dcf: { result: 'cached' } },
    });
    expect(r.idempotency_verdicts[0].decision).toBe('skip_idempotent');
    expect(r.idempotency_verdicts[0].reason_code).toBe(IDEMPO_REASON_CODES.IDEMPO_SKIP_ALREADY_COMPLETED);
  });

  it('IDEMPO_PROCEED_NEW_OPERATION — pending', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [step('s1', 'pending')],
    });
    expect(r.idempotency_verdicts[0].decision).toBe('proceed_new');
    expect(r.idempotency_verdicts[0].reason_code).toBe(IDEMPO_REASON_CODES.IDEMPO_PROCEED_NEW_OPERATION);
  });

  it('IDEMPO_PROCEED_NEW_OPERATION — in_progress', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [step('s1', 'in_progress')],
    });
    expect(r.idempotency_verdicts[0].reason_code).toBe(IDEMPO_REASON_CODES.IDEMPO_PROCEED_NEW_OPERATION);
  });

  it('IDEMPO_PROCEED_FINGERPRINT_MISMATCH', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [step('s1', 'completed', {
        fingerprint: 'A', prior_result_fingerprint: 'B',
      })],
    });
    expect(r.idempotency_verdicts[0].decision).toBe('proceed_new');
    expect(r.idempotency_verdicts[0].reason_code).toBe(IDEMPO_REASON_CODES.IDEMPO_PROCEED_FINGERPRINT_MISMATCH);
  });

  it('IDEMPO_RETRY_FAILED_IDEMPOTENT', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [step('s1', 'failed', { is_idempotent: true })],
    });
    expect(r.idempotency_verdicts[0].decision).toBe('retry_after_failure');
    expect(r.idempotency_verdicts[0].reason_code).toBe(IDEMPO_REASON_CODES.IDEMPO_RETRY_FAILED_IDEMPOTENT);
  });

  it('IDEMPO_PROCEED_FAILED_NON_IDEMPOTENT', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [step('s1', 'failed', { is_idempotent: false })],
    });
    expect(r.idempotency_verdicts[0].decision).toBe('proceed_new');
    expect(r.idempotency_verdicts[0].reason_code).toBe(IDEMPO_REASON_CODES.IDEMPO_PROCEED_FAILED_NON_IDEMPOTENT);
  });
});

// =============================================================================
// SAGA_* status codes
// =============================================================================

describe('idempotency-saga — SAGA_* status codes', () => {
  it('SAGA_STATUS_SUCCESS — all completed, no failures', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [
        step('s1', 'completed'), step('s2', 'completed'),
      ],
    });
    expect(r.saga_status).toBe('success');
    expect(r.compensation_steps).toEqual([]);
    expect(r.reason_codes).toContain(SAGA_REASON_CODES.SAGA_STATUS_SUCCESS);
  });

  it('SAGA_STATUS_PARTIAL_FAILURE — failure with no completed predecessors', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [step('s1', 'failed', { is_idempotent: true })],
    });
    expect(r.saga_status).toBe('partial_failure');
    expect(r.compensation_steps).toEqual([]);
    expect(r.reason_codes).toContain(SAGA_REASON_CODES.SAGA_STATUS_PARTIAL_FAILURE);
  });

  it('SAGA_STATUS_REQUIRES_COMPENSATION — failure after completed step', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [
        step('s1', 'completed', { has_compensating_action: true }),
        step('s2', 'failed'),
      ],
    });
    expect(r.saga_status).toBe('requires_compensation');
    expect(r.compensation_steps.length).toBeGreaterThanOrEqual(1);
    expect(r.reason_codes).toContain(SAGA_REASON_CODES.SAGA_STATUS_REQUIRES_COMPENSATION);
  });
});

// =============================================================================
// SAGA_* compensation decisions
// =============================================================================

describe('idempotency-saga — compensation decisions', () => {
  it('SAGA_COMPENSATE_LIFO — has_compensating_action=true', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [
        step('s1', 'completed', { has_compensating_action: true }),
        step('s2', 'failed'),
      ],
    });
    expect(r.compensation_steps[0].decision).toBe('compensate');
    expect(r.compensation_steps[0].reason_code).toBe(SAGA_REASON_CODES.SAGA_COMPENSATE_LIFO);
  });

  it('SAGA_COMPENSATE_NO_ACTION_NEEDED — is_safe_no_op=true', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [
        step('s1', 'completed', { is_safe_no_op: true }),
        step('s2', 'failed'),
      ],
    });
    expect(r.compensation_steps[0].decision).toBe('no_action_needed');
    expect(r.compensation_steps[0].reason_code).toBe(SAGA_REASON_CODES.SAGA_COMPENSATE_NO_ACTION_NEEDED);
  });

  it('SAGA_COMPENSATE_MANUAL_INTERVENTION_REQUIRED — no compensating action and not safe no-op', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [
        step('s1', 'completed', { has_compensating_action: false }),
        step('s2', 'failed'),
      ],
    });
    expect(r.compensation_steps[0].decision).toBe('manual_intervention_required');
    expect(r.compensation_steps[0].reason_code).toBe(SAGA_REASON_CODES.SAGA_COMPENSATE_MANUAL_INTERVENTION_REQUIRED);
  });
});

// =============================================================================
// LIFO ordering & force_compensation
// =============================================================================

describe('idempotency-saga — LIFO ordering', () => {
  it('compensation_steps emitted in LIFO order over completed steps', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [
        step('a', 'completed', { has_compensating_action: true }),
        step('b', 'completed', { has_compensating_action: true }),
        step('c', 'completed', { has_compensating_action: true }),
        step('d', 'failed'),
      ],
    });
    // LIFO: c, b, a
    expect(r.compensation_steps.map((c) => c.step_id)).toEqual(['c', 'b', 'a']);
  });

  it('force_compensation=true emits LIFO compensation even without failure', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [
        step('a', 'completed', { has_compensating_action: true }),
        step('b', 'completed', { has_compensating_action: true }),
      ],
      force_compensation: true,
    });
    expect(r.compensation_steps.map((c) => c.step_id)).toEqual(['b', 'a']);
    // saga_status remains 'success' even though compensation is emitted on demand
    expect(r.saga_status).toBe('success');
  });

  it('compensation_steps skip non-completed steps (pending / in_progress / failed)', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [
        step('a', 'completed', { has_compensating_action: true }),
        step('b', 'pending'),
        step('c', 'in_progress'),
        step('d', 'completed', { has_compensating_action: true }),
        step('e', 'failed'),
      ],
    });
    expect(r.compensation_steps.map((c) => c.step_id)).toEqual(['d', 'a']);
  });
});

// =============================================================================
// Mixed reason-code aggregation + recommended_next_steps
// =============================================================================

describe('idempotency-saga — aggregation', () => {
  it('reason_codes is sorted-unique union of idempo + saga + status', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [
        step('a', 'completed', { has_compensating_action: true, fingerprint: 'A', prior_result_fingerprint: 'A' }),
        step('b', 'failed', { is_idempotent: true }),
      ],
    });
    const sorted = [...r.reason_codes].sort();
    expect(r.reason_codes).toEqual(sorted);
    expect(new Set(r.reason_codes).size).toBe(r.reason_codes.length);
    expect(r.reason_codes).toContain(IDEMPO_REASON_CODES.IDEMPO_SKIP_FINGERPRINT_MATCH);
    expect(r.reason_codes).toContain(IDEMPO_REASON_CODES.IDEMPO_RETRY_FAILED_IDEMPOTENT);
    expect(r.reason_codes).toContain(SAGA_REASON_CODES.SAGA_STATUS_REQUIRES_COMPENSATION);
    expect(r.reason_codes).toContain(SAGA_REASON_CODES.SAGA_COMPENSATE_LIFO);
  });

  it('recommended_next_steps mentions skip + retry counts', async () => {
    const r = await runIdempotencySaga('s', {
      saga_steps: [
        step('a', 'completed', { fingerprint: 'A', prior_result_fingerprint: 'A' }),
        step('b', 'failed', { is_idempotent: true }),
        step('c', 'pending'),
      ],
    });
    const text = r.recommended_next_steps.join(' | ');
    expect(text).toContain('idempotency: 1 adım');
    expect(text).toContain('1 idempotent adım');
  });
});

// =============================================================================
// Narrative protection + adapter
// =============================================================================

describe('idempotency-saga — narrative protection', () => {
  it('does not mutate accumulated_context', async () => {
    const cached = { content: 'narrative', tokens: 1000 };
    const accCtx: Record<string, unknown> = {
      strategic_synthesis: cached, existing: { keep: true },
    };
    const before = JSON.stringify(accCtx);
    await runIdempotencySaga('s', {
      saga_steps: [step('a', 'completed')],
      accumulated_context: accCtx,
    }, { accumulated_context: accCtx });
    expect(JSON.stringify(accCtx)).toBe(before);
    expect(accCtx.strategic_synthesis).toBe(cached);
  });
});

describe('idempotency-saga — recordIdempotencySagaPlan adapter', () => {
  it('appends to empty context — idempotency_saga_plan + JSON mirror', async () => {
    const r = await runIdempotencySaga('s', { saga_steps: [] });
    const ctx: Record<string, unknown> = {};
    recordIdempotencySagaPlan('s', r, ctx);
    expect(Array.isArray(ctx[IDEMPOTENCY_SAGA_CONTEXT_KEYS.PLAN])).toBe(true);
    expect((ctx[IDEMPOTENCY_SAGA_CONTEXT_KEYS.PLAN] as unknown[]).length).toBe(1);
    const parsed = JSON.parse(ctx[IDEMPOTENCY_SAGA_CONTEXT_KEYS.PLAN_JSON] as string);
    expect(parsed[0].recorded_for_session).toBe('s');
  });

  it('append-only', async () => {
    const r1 = await runIdempotencySaga('s', { saga_steps: [] });
    const r2 = await runIdempotencySaga('s', {
      saga_steps: [step('a', 'completed', { has_compensating_action: true }), step('b', 'failed')],
    });
    const ctx: Record<string, unknown> = {};
    recordIdempotencySagaPlan('s', r1, ctx);
    recordIdempotencySagaPlan('s', r2, ctx);
    expect((ctx[IDEMPOTENCY_SAGA_CONTEXT_KEYS.PLAN] as unknown[]).length).toBe(2);
  });

  it('does not mutate unrelated keys', async () => {
    const r = await runIdempotencySaga('s', { saga_steps: [] });
    const cached = { content: 'narrative' };
    const ctx: Record<string, unknown> = { existing: { keep: true }, val_dcf: cached };
    recordIdempotencySagaPlan('s', r, ctx);
    expect(ctx.existing).toEqual({ keep: true });
    expect(ctx.val_dcf).toBe(cached);
  });
});
