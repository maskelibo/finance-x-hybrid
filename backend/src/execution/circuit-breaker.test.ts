/**
 * P4D Wave 1 — circuit breaker tests.
 */
import { describe, expect, it } from 'vitest';
import {
  runCircuitBreaker,
  recordCircuitBreakerPlan,
  CIRCUIT_BREAKER_REASON_CODES,
  CIRCUIT_BREAKER_CONTEXT_KEYS,
  CIRCUIT_BREAKER_DEFAULTS,
  type CircuitBreakerPlan,
  type AttemptRecord,
  type AttemptStatus,
  type OperationInput,
} from './circuit-breaker.js';

// =============================================================================
// Fixtures
// =============================================================================

function attempt(status: AttemptStatus, isoOffset: string = '2026-04-28T00:00:00Z'): AttemptRecord {
  return { status, timestamp_iso: isoOffset };
}

function op(
  operation_id: string,
  recent_attempts: AttemptRecord[],
  overrides: Partial<OperationInput> = {},
): OperationInput {
  return {
    operation_id, kind: overrides.kind ?? `kind-${operation_id}`,
    recent_attempts,
    last_opened_at: overrides.last_opened_at,
  };
}

// =============================================================================
// Smoke
// =============================================================================

describe('circuit-breaker — smoke', () => {
  it('async signature returns a Promise', () => {
    expect(runCircuitBreaker('s', { operations: [] })).toBeInstanceOf(Promise);
  });

  it('empty operations → no verdicts, no flags', async () => {
    const r = await runCircuitBreaker('s', { operations: [] });
    expect(r.verdicts).toEqual([]);
    expect(r.any_open).toBe(false);
    expect(r.any_half_open).toBe(false);
    expect(r.blocked_kinds).toEqual([]);
  });

  it('determinism: same input → same output mod generated_at', async () => {
    const inputs = {
      operations: [
        op('o1', [attempt('failure'), attempt('failure'), attempt('failure'),
                  attempt('failure'), attempt('failure')]),
      ],
    };
    const a = await runCircuitBreaker('s', inputs);
    const b = await runCircuitBreaker('s', inputs);
    const norm = (p: CircuitBreakerPlan): unknown =>
      JSON.parse(JSON.stringify(p, (k, v) => k === 'generated_at' ? null : v));
    expect(norm(a)).toEqual(norm(b));
  });
});

// =============================================================================
// CB_* reason codes — one positive test each
// =============================================================================

describe('circuit-breaker — CB_* reason codes', () => {
  it('CB_CLOSED_HEALTHY — all successes in window', async () => {
    const r = await runCircuitBreaker('s', {
      operations: [op('o1', [attempt('success'), attempt('success')])],
    });
    expect(r.verdicts[0].state).toBe('closed');
    expect(r.verdicts[0].decision).toBe('allow');
    expect(r.verdicts[0].reason_code).toBe(CIRCUIT_BREAKER_REASON_CODES.CB_CLOSED_HEALTHY);
  });

  it('CB_CLOSED_UNDER_THRESHOLD — some failures, under threshold', async () => {
    const r = await runCircuitBreaker('s', {
      // most recent first: success, failure, success, failure
      // consecutive failures from head = 0; window has 2 failures, 2 successes
      operations: [op('o1', [
        attempt('success'), attempt('failure'),
        attempt('success'), attempt('failure'),
      ])],
    });
    expect(r.verdicts[0].state).toBe('closed');
    expect(r.verdicts[0].decision).toBe('allow');
    expect(r.verdicts[0].reason_code).toBe(CIRCUIT_BREAKER_REASON_CODES.CB_CLOSED_UNDER_THRESHOLD);
  });

  it('CB_INSUFFICIENT_HISTORY — no attempts at all', async () => {
    const r = await runCircuitBreaker('s', {
      operations: [op('o1', [])],
    });
    expect(r.verdicts[0].state).toBe('closed');
    expect(r.verdicts[0].decision).toBe('allow');
    expect(r.verdicts[0].reason_code).toBe(CIRCUIT_BREAKER_REASON_CODES.CB_INSUFFICIENT_HISTORY);
  });

  it('CB_OPEN_FAILURE_THRESHOLD_EXCEEDED — 5 consecutive failures', async () => {
    const r = await runCircuitBreaker('s', {
      operations: [op('o1', [
        attempt('failure'), attempt('failure'), attempt('failure'),
        attempt('failure'), attempt('failure'),
      ])],
    });
    expect(r.verdicts[0].state).toBe('open');
    expect(r.verdicts[0].decision).toBe('block');
    expect(r.verdicts[0].reason_code).toBe(CIRCUIT_BREAKER_REASON_CODES.CB_OPEN_FAILURE_THRESHOLD_EXCEEDED);
    expect(r.any_open).toBe(true);
    expect(r.blocked_kinds).toContain('kind-o1');
  });

  it('CB_OPEN_COOLDOWN_ACTIVE — last_opened_at within cooldown', async () => {
    const now = '2026-04-28T00:01:00Z';
    const opened = '2026-04-28T00:00:50Z'; // 10s ago < 30s cooldown
    const r = await runCircuitBreaker('s', {
      operations: [op('o1', [], { last_opened_at: opened })],
    }, { now_iso: now });
    expect(r.verdicts[0].state).toBe('open');
    expect(r.verdicts[0].decision).toBe('block');
    expect(r.verdicts[0].reason_code).toBe(CIRCUIT_BREAKER_REASON_CODES.CB_OPEN_COOLDOWN_ACTIVE);
    expect(r.verdicts[0].cooldown_remaining_ms).toBeGreaterThan(0);
  });

  it('CB_HALF_OPEN_PROBE — cooldown expired, no consecutive successes', async () => {
    const now = '2026-04-28T00:02:00Z';
    const opened = '2026-04-28T00:01:00Z'; // 60s ago > 30s cooldown
    const r = await runCircuitBreaker('s', {
      operations: [op('o1', [attempt('failure')], { last_opened_at: opened })],
    }, { now_iso: now });
    expect(r.verdicts[0].state).toBe('half_open');
    expect(r.verdicts[0].decision).toBe('probe');
    expect(r.verdicts[0].reason_code).toBe(CIRCUIT_BREAKER_REASON_CODES.CB_HALF_OPEN_PROBE);
    expect(r.any_half_open).toBe(true);
  });

  it('CB_HALF_OPEN_RECOVERED — cooldown expired, success_threshold consecutive successes', async () => {
    const now = '2026-04-28T00:02:00Z';
    const opened = '2026-04-28T00:01:00Z';
    const r = await runCircuitBreaker('s', {
      operations: [op('o1', [
        attempt('success'), attempt('success'), // 2 consecutive (default success_threshold=2)
      ], { last_opened_at: opened })],
    }, { now_iso: now });
    expect(r.verdicts[0].state).toBe('closed');
    expect(r.verdicts[0].decision).toBe('allow');
    expect(r.verdicts[0].reason_code).toBe(CIRCUIT_BREAKER_REASON_CODES.CB_HALF_OPEN_RECOVERED);
  });
});

// =============================================================================
// Threshold edge cases
// =============================================================================

describe('circuit-breaker — threshold edges', () => {
  it('threshold-1 consecutive failures → still closed (under threshold)', async () => {
    const r = await runCircuitBreaker('s', {
      operations: [op('o1', [
        attempt('failure'), attempt('failure'), attempt('failure'), attempt('failure'),
      ])],  // 4 < 5 default threshold
    });
    expect(r.verdicts[0].state).toBe('closed');
    expect(r.verdicts[0].reason_code).toBe(CIRCUIT_BREAKER_REASON_CODES.CB_CLOSED_UNDER_THRESHOLD);
  });

  it('non-consecutive failures do NOT trip (success in front)', async () => {
    const r = await runCircuitBreaker('s', {
      operations: [op('o1', [
        attempt('success'),
        attempt('failure'), attempt('failure'), attempt('failure'),
        attempt('failure'), attempt('failure'),
      ])],
    });
    // consecutive_failures from head = 0 (success in front)
    expect(r.verdicts[0].state).toBe('closed');
    expect(r.verdicts[0].consecutive_failures).toBe(0);
  });

  it('caller-supplied failure_threshold honored', async () => {
    const r = await runCircuitBreaker('s', {
      operations: [op('o1', [
        attempt('failure'), attempt('failure'), attempt('failure'),
      ])],
    }, { failure_threshold: 3 });
    expect(r.verdicts[0].state).toBe('open');
    expect(r.verdicts[0].reason_code).toBe(CIRCUIT_BREAKER_REASON_CODES.CB_OPEN_FAILURE_THRESHOLD_EXCEEDED);
  });
});

// =============================================================================
// Cooldown timing
// =============================================================================

describe('circuit-breaker — cooldown timing', () => {
  it('cooldown_remaining_ms decreases as elapsed grows', async () => {
    const opened = '2026-04-28T00:00:00Z';
    const a = await runCircuitBreaker('s', {
      operations: [op('o1', [], { last_opened_at: opened })],
    }, { now_iso: '2026-04-28T00:00:05Z' });   // 5s elapsed → 25_000 ms remaining
    const b = await runCircuitBreaker('s', {
      operations: [op('o1', [], { last_opened_at: opened })],
    }, { now_iso: '2026-04-28T00:00:25Z' });   // 25s elapsed → 5_000 ms remaining
    expect(a.verdicts[0].cooldown_remaining_ms).toBeGreaterThan(b.verdicts[0].cooldown_remaining_ms);
    expect(b.verdicts[0].cooldown_remaining_ms).toBeGreaterThan(0);
  });

  it('caller-supplied cooldown_ms honored', async () => {
    const opened = '2026-04-28T00:00:00Z';
    const r = await runCircuitBreaker('s', {
      operations: [op('o1', [], { last_opened_at: opened })],
    }, { now_iso: '2026-04-28T00:00:00.500Z', cooldown_ms: 1000 }); // 0.5s elapsed of 1s
    expect(r.verdicts[0].cooldown_remaining_ms).toBeGreaterThan(0);
    expect(r.verdicts[0].state).toBe('open');
  });
});

// =============================================================================
// Aggregation
// =============================================================================

describe('circuit-breaker — aggregation', () => {
  it('multi-operation: blocked_kinds sorted-unique', async () => {
    const r = await runCircuitBreaker('s', {
      operations: [
        op('o1', [attempt('failure'), attempt('failure'), attempt('failure'),
                  attempt('failure'), attempt('failure')], { kind: 'val_dcf' }),
        op('o2', [attempt('failure'), attempt('failure'), attempt('failure'),
                  attempt('failure'), attempt('failure')], { kind: 'parse_standardization' }),
        op('o3', [attempt('success')], { kind: 'financial_analysis' }),
      ],
    });
    expect(r.blocked_kinds).toEqual(['parse_standardization', 'val_dcf']);
  });

  it('recommended_next_steps populated when any open', async () => {
    const r = await runCircuitBreaker('s', {
      operations: [op('o1', Array(5).fill(attempt('failure')))],
    });
    expect(r.recommended_next_steps.some((s) => s.startsWith('circuit_breaker:'))).toBe(true);
    expect(r.recommended_next_steps.some((s) => s.includes('açık devre'))).toBe(true);
  });

  it('recommended_next_steps mentions "sağlıklı" when all closed', async () => {
    const r = await runCircuitBreaker('s', {
      operations: [op('o1', [attempt('success'), attempt('success')])],
    });
    expect(r.recommended_next_steps.some((s) => s.includes('sağlıklı'))).toBe(true);
  });

  it('reason_codes is sorted-unique', async () => {
    const r = await runCircuitBreaker('s', {
      operations: [
        op('o1', [attempt('success'), attempt('success')]),
        op('o2', Array(5).fill(attempt('failure'))),
      ],
    });
    const sorted = [...r.reason_codes].sort();
    expect(r.reason_codes).toEqual(sorted);
    expect(new Set(r.reason_codes).size).toBe(r.reason_codes.length);
  });
});

// =============================================================================
// Defaults sanity
// =============================================================================

describe('circuit-breaker — defaults', () => {
  it('defaults match documented values', () => {
    expect(CIRCUIT_BREAKER_DEFAULTS.failure_threshold).toBe(5);
    expect(CIRCUIT_BREAKER_DEFAULTS.success_threshold).toBe(2);
    expect(CIRCUIT_BREAKER_DEFAULTS.cooldown_ms).toBe(30_000);
    expect(CIRCUIT_BREAKER_DEFAULTS.window_size).toBe(10);
  });
});

// =============================================================================
// Narrative protection + adapter
// =============================================================================

describe('circuit-breaker — narrative protection', () => {
  it('does not mutate accumulated_context', async () => {
    const cached = { content: 'narrative' };
    const accCtx: Record<string, unknown> = {
      strategic_synthesis: cached, existing: { keep: true },
    };
    const before = JSON.stringify(accCtx);
    await runCircuitBreaker('s', {
      operations: [op('o1', [attempt('success')])],
    }, { accumulated_context: accCtx });
    expect(JSON.stringify(accCtx)).toBe(before);
    expect(accCtx.strategic_synthesis).toBe(cached);
  });
});

describe('circuit-breaker — recordCircuitBreakerPlan adapter', () => {
  it('appends to empty context — circuit_breaker_plan + JSON mirror', async () => {
    const r = await runCircuitBreaker('s', { operations: [] });
    const ctx: Record<string, unknown> = {};
    recordCircuitBreakerPlan('s', r, ctx);
    expect(Array.isArray(ctx[CIRCUIT_BREAKER_CONTEXT_KEYS.PLAN])).toBe(true);
    expect((ctx[CIRCUIT_BREAKER_CONTEXT_KEYS.PLAN] as unknown[]).length).toBe(1);
    const parsed = JSON.parse(ctx[CIRCUIT_BREAKER_CONTEXT_KEYS.PLAN_JSON] as string);
    expect(parsed[0].recorded_for_session).toBe('s');
  });

  it('append-only', async () => {
    const r1 = await runCircuitBreaker('s', { operations: [] });
    const r2 = await runCircuitBreaker('s', {
      operations: [op('o1', [attempt('success')])],
    });
    const ctx: Record<string, unknown> = {};
    recordCircuitBreakerPlan('s', r1, ctx);
    recordCircuitBreakerPlan('s', r2, ctx);
    expect((ctx[CIRCUIT_BREAKER_CONTEXT_KEYS.PLAN] as unknown[]).length).toBe(2);
  });

  it('does not mutate unrelated keys', async () => {
    const r = await runCircuitBreaker('s', { operations: [] });
    const cached = { content: 'narrative' };
    const ctx: Record<string, unknown> = { existing: { keep: true }, val_dcf: cached };
    recordCircuitBreakerPlan('s', r, ctx);
    expect(ctx.existing).toEqual({ keep: true });
    expect(ctx.val_dcf).toBe(cached);
  });
});
