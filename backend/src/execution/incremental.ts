/**
 * Deterministic Incremental Computation Engine (Block P — Plan P3C Wave 1).
 *
 * Standalone read-only engine that decides, per planned task in a P3B
 * TaskPlan, whether the task can be reused, must be recomputed, must be
 * invalidated, or can be partially recomputed. Decisions are based on:
 *
 *   - presence of a cached output marker in accumulated_context
 *   - caller-supplied cache metadata (input_fingerprint + methodology_version
 *     + computed_at + optional sub_key_fingerprints)
 *   - the engine's own deterministic input fingerprint (sha1 over session_id,
 *     task_kind, fact-pack content, methodology version, and merkle-style
 *     predecessor fingerprints)
 *   - upstream dirty-cascade propagation
 *   - freshness bands (≤30d band-1, 30-90d band-2, >90d band-3)
 *
 * Wave 1 invariants:
 *   - Standalone: no orchestrator / agent-runner / sub-agent-runner / planner
 *     wiring; the engine consumes a TaskPlan that the caller composed.
 *   - Read-only: no DB writes; never mutates cached output objects in
 *     accumulated_context. The optional adapter writes only two narrow
 *     keys ('computation_plan' + 'computation_plan_json').
 *   - Deterministic: same inputs → same structural output (mod
 *     `generated_at`); fingerprints are key-order-independent.
 *   - Every verdict carries ≥ 1 frozen reason code from
 *     INCREMENTAL_REASON_CODES.
 *   - No LLM calls; no network/disk I/O beyond the read APIs of consumed
 *     modules.
 */

import { createHash } from 'node:crypto';
import { getCanonicalFactPackV2, type CanonicalFactPackV2 } from '../fact-layer/pack-v2.js';
import { getSessionMethodology, getMethodologyVersion } from '../fact-layer/methodology.js';
import {
  TASK_DAG,
  TASK_COST_USD,
  TASK_OUTPUTS,
  type TaskKind,
  type TaskPlan,
  type PlannedTask,
} from './task-planner.js';

// =============================================================================
// Frozen reason-code constants
// =============================================================================

export const INCREMENTAL_REASON_CODES = {
  REUSE_HASH_MATCH: 'REUSE_HASH_MATCH',
  PARTIAL_RECOMPUTE_FRESHNESS_BAND_2: 'PARTIAL_RECOMPUTE_FRESHNESS_BAND_2',
  PARTIAL_RECOMPUTE_SUBKEY_DIRTY: 'PARTIAL_RECOMPUTE_SUBKEY_DIRTY',
  INVALIDATION_INPUT_HASH_MISMATCH: 'INVALIDATION_INPUT_HASH_MISMATCH',
  INVALIDATION_METHODOLOGY_DRIFT: 'INVALIDATION_METHODOLOGY_DRIFT',
  INVALIDATION_UPSTREAM_DIRTY: 'INVALIDATION_UPSTREAM_DIRTY',
  INVALIDATION_FRESHNESS_BAND_3: 'INVALIDATION_FRESHNESS_BAND_3',
  INVALIDATION_NO_CACHE_META: 'INVALIDATION_NO_CACHE_META',
  RECOMPUTE_NO_CACHE: 'RECOMPUTE_NO_CACHE',
} as const;

export type IncrementalReasonCode =
  typeof INCREMENTAL_REASON_CODES[keyof typeof INCREMENTAL_REASON_CODES];

// =============================================================================
// Types
// =============================================================================

export type ComputationDecision = 'reuse' | 'recompute' | 'partial_recompute' | 'invalidate';

export interface CachedOutputMeta {
  input_fingerprint: string;
  methodology_version: string;
  /** ISO date — used for freshness banding. */
  computed_at: string;
  /** Optional per-output-key fingerprint snapshot at cache time. When the
   *  caller also supplies current_sub_key_fingerprints, the engine compares
   *  the two and emits PARTIAL_RECOMPUTE_SUBKEY_DIRTY for any mismatch. */
  sub_key_fingerprints?: Record<string, string>;
}

export interface ComputationVerdict {
  task_id: string;
  kind: TaskKind;
  decision: ComputationDecision;
  /** Sorted-unique frozen codes from INCREMENTAL_REASON_CODES. */
  reason_codes: string[];
  /** Human-readable summaries; aligned with reason_codes. */
  invalidation_reasons: string[];
  /** Output keys read from cache. Set for reuse / partial_recompute. */
  reused_output_keys: string[];
  /** Sub-keys still requiring recomputation. Set for partial_recompute. */
  dirty_sub_keys: string[];
  /** USD that would be saved if the caller honors the verdict. */
  estimated_cost_saved_usd: number;
  /** Engine-computed input fingerprint (deterministic sha1, 40 hex chars). */
  computed_input_fingerprint: string;
  /** Snapshot of the cache metadata that drove the decision (when supplied). */
  cache_meta_snapshot?: CachedOutputMeta;
}

export interface ComputationPlan {
  session_id: string;
  ticker: string | null;
  generated_at: string;
  /** One verdict per planned task; same order as taskPlan.planned_tasks. */
  computation_decision: ComputationVerdict[];
  /** Subset of computation_decision that propagated dirty signal to descendants. */
  affected_tasks: TaskKind[];
  /** Aggregated invalidation_reasons across all verdicts (sorted unique). */
  invalidation_reasons: string[];
  /** TaskKinds whose verdict is reuse OR partial_recompute. */
  reused_outputs: TaskKind[];
  /** TaskKinds whose verdict is recompute, invalidate, OR partial_recompute. */
  recompute_tasks: TaskKind[];
  /** Sum of verdict-level estimated_cost_saved_usd. */
  estimated_cost_saved_usd: number;
  warnings: string[];
}

export interface IncrementalOptions {
  /** Caller-supplied accumulated context. Used for:
   *   - cached output presence detection (canonical marker = TASK_OUTPUTS[kind][0])
   *   - the engine NEVER mutates this object's existing keys. */
  accumulated_context?: Record<string, unknown>;
  /** Per-task cache metadata. Absent entries → INVALIDATION_NO_CACHE_META
   *  when the canonical marker IS present. */
  cached_outputs_meta?: Partial<Record<TaskKind, CachedOutputMeta>>;
  /** Per-task current sub-key fingerprints. Compared against
   *  cached_outputs_meta[kind].sub_key_fingerprints. */
  current_sub_key_fingerprints?: Partial<Record<TaskKind, Record<string, string>>>;
  /** Optional manual override of the engine-computed input fingerprint. */
  input_hashes?: Partial<Record<TaskKind, string>>;
  /** Override of the live methodology version (for tests / what-if). */
  current_methodology_version?: string;
  /** Override the wall clock used for freshness banding (for tests). */
  now_iso?: string;
}

// =============================================================================
// Fingerprint helper (exported)
// =============================================================================

export interface FingerprintArgs {
  session_id: string;
  task_kind: TaskKind;
  /** Map fact_key → canonical content. The engine sorts keys before hashing
   *  so callers do not need to pre-sort. */
  fact_pack_content?: Record<string, unknown>;
  /** Predecessor merkle hashes; sorted before hashing. */
  predecessor_fingerprints?: Record<string, string>;
  /** Methodology version snapshot; '' when unknown. */
  methodology_version?: string | null;
}

/**
 * Stable sha1-hex fingerprint over the canonical input set for a task.
 * Key-order-independent; safe to use as a cache key.
 */
export function computeTaskFingerprint(args: FingerprintArgs): string {
  const stable = canonicalize({
    s: args.session_id,
    k: args.task_kind,
    f: args.fact_pack_content ?? {},
    p: args.predecessor_fingerprints ?? {},
    m: args.methodology_version ?? '',
  });
  return createHash('sha1').update(stable).digest('hex');
}

/**
 * Recursively serialize a value with sorted object keys so that two values
 * that differ only in key insertion order produce identical strings.
 */
function canonicalize(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalize(v)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const parts = keys.map((k) =>
      `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`,
    );
    return `{${parts.join(',')}}`;
  }
  // undefined / function / symbol → drop
  return 'null';
}

// =============================================================================
// Pack content extraction (deterministic per session)
// =============================================================================

function packContentSnapshot(pack: CanonicalFactPackV2 | null): Record<string, unknown> {
  if (!pack) return {};
  const snap: Record<string, unknown> = {};
  for (const [k, fact] of Object.entries(pack.facts)) {
    snap[k] = { value: fact.value, unit: fact.unit };
  }
  return snap;
}

// =============================================================================
// Freshness banding
// =============================================================================

const FRESHNESS_BAND_1_DAYS = 30;
const FRESHNESS_BAND_2_DAYS = 90;

function ageDays(computedAtIso: string, now: Date): number {
  const computed = new Date(computedAtIso).getTime();
  if (!Number.isFinite(computed)) return Number.POSITIVE_INFINITY;
  const ms = now.getTime() - computed;
  return ms / 86_400_000;
}

// =============================================================================
// Decision helpers
// =============================================================================

function reasonText(code: IncrementalReasonCode, kind: TaskKind, extra?: string): string {
  switch (code) {
    case INCREMENTAL_REASON_CODES.REUSE_HASH_MATCH:
      return `${kind}: cache fingerprint matches; methodology current; freshness band 1.`;
    case INCREMENTAL_REASON_CODES.PARTIAL_RECOMPUTE_FRESHNESS_BAND_2:
      return `${kind}: cache age in 30-90d band; partial recompute recommended.${extra ? ` ${extra}` : ''}`;
    case INCREMENTAL_REASON_CODES.PARTIAL_RECOMPUTE_SUBKEY_DIRTY:
      return `${kind}: ${extra ?? ''} sub-key fingerprint(s) dirty; partial recompute.`;
    case INCREMENTAL_REASON_CODES.INVALIDATION_INPUT_HASH_MISMATCH:
      return `${kind}: cached input_fingerprint differs from current.`;
    case INCREMENTAL_REASON_CODES.INVALIDATION_METHODOLOGY_DRIFT:
      return `${kind}: cached methodology_version differs from current (${extra ?? ''}).`;
    case INCREMENTAL_REASON_CODES.INVALIDATION_UPSTREAM_DIRTY:
      return `${kind}: predecessor task(s) marked dirty (${extra ?? ''}).`;
    case INCREMENTAL_REASON_CODES.INVALIDATION_FRESHNESS_BAND_3:
      return `${kind}: cache age >90d; invalidate.`;
    case INCREMENTAL_REASON_CODES.INVALIDATION_NO_CACHE_META:
      return `${kind}: cached output present but no cache metadata supplied.`;
    case INCREMENTAL_REASON_CODES.RECOMPUTE_NO_CACHE:
      return `${kind}: no cached output marker in accumulated_context.`;
  }
}

function costSavedFor(
  decision: ComputationDecision,
  taskCost: number,
  totalSubKeys: number,
  dirtySubKeys: number,
): number {
  if (decision === 'reuse') return round4(taskCost);
  if (decision === 'recompute' || decision === 'invalidate') return 0;
  // partial_recompute
  if (totalSubKeys <= 0) return 0;
  const clean = Math.max(0, totalSubKeys - dirtySubKeys);
  return round4((clean / totalSubKeys) * taskCost);
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function sortedUnique(values: ReadonlyArray<string>): string[] {
  return Array.from(new Set(values)).sort();
}

// =============================================================================
// Main entry — runIncrementalComputation
// =============================================================================

export async function runIncrementalComputation(
  sessionId: string,
  taskPlan: TaskPlan,
  options: IncrementalOptions = {},
): Promise<ComputationPlan> {
  const warnings: string[] = [];
  const accCtx = options.accumulated_context ?? {};
  const cachedMetaTable: Partial<Record<TaskKind, CachedOutputMeta>> = options.cached_outputs_meta ?? {};
  const currentSubFps: Partial<Record<TaskKind, Record<string, string>>> = options.current_sub_key_fingerprints ?? {};
  const inputHashOverride: Partial<Record<TaskKind, string>> = options.input_hashes ?? {};
  const now = options.now_iso ? new Date(options.now_iso) : new Date();

  // Defensive read of the upstream snapshots used by the fingerprint.
  let pack: CanonicalFactPackV2 | null = null;
  try { pack = getCanonicalFactPackV2(sessionId); }
  catch (err) { warnings.push(`pack_read_failed:${(err as Error).message}`); }

  const ticker = pack?.ticker ?? null;
  const sessionMeth = (() => {
    try { return getSessionMethodology(sessionId); }
    catch (err) { warnings.push(`session_methodology_read_failed:${(err as Error).message}`); return null; }
  })();
  const currentMethodologyVersion = options.current_methodology_version
    ?? (() => {
      try { return getMethodologyVersion(); }
      catch (err) { warnings.push(`methodology_version_read_failed:${(err as Error).message}`); return ''; }
    })();
  const fingerprintMethodologyVersion = sessionMeth?.methodology_version ?? currentMethodologyVersion;
  const factSnap = packContentSnapshot(pack);

  // -------------------------------------------------------------------------
  // Iterate planned tasks in their given (topo) order. Track per-task
  // fingerprints + dirty status for upstream-cascade propagation.
  // -------------------------------------------------------------------------

  const computedFingerprints = new Map<TaskKind, string>();
  const dirtyKinds = new Set<TaskKind>();
  const verdicts: ComputationVerdict[] = [];

  for (const t of taskPlan.planned_tasks) {
    const fingerprint = computeFingerprintForTask(
      sessionId, t, factSnap, computedFingerprints, fingerprintMethodologyVersion, inputHashOverride,
    );
    computedFingerprints.set(t.kind, fingerprint);

    const verdict = decideVerdict({
      sessionId,
      task: t,
      computedFingerprint: fingerprint,
      accCtx,
      cacheMeta: cachedMetaTable[t.kind],
      currentSubFps: currentSubFps[t.kind],
      currentMethodologyVersion,
      dirtyKinds,
      now,
    });
    verdicts.push(verdict);
    if (verdict.decision !== 'reuse') {
      dirtyKinds.add(t.kind);
    }
  }

  // -------------------------------------------------------------------------
  // Aggregations
  // -------------------------------------------------------------------------

  const candidateKinds = new Set(taskPlan.planned_tasks.map((t) => t.kind));
  const affected: TaskKind[] = [];
  for (const v of verdicts) {
    if (v.decision === 'reuse') continue;
    const hasDirtyDescendant = taskPlan.planned_tasks.some((t) =>
      candidateKinds.has(t.kind) && TASK_DAG[t.kind].includes(v.kind),
    );
    if (hasDirtyDescendant) affected.push(v.kind);
  }

  const invalidationReasonsAgg = sortedUnique(verdicts.flatMap((v) => v.invalidation_reasons));
  const reusedOutputs = sortedUnique(
    verdicts.filter((v) => v.decision === 'reuse' || v.decision === 'partial_recompute').map((v) => v.kind),
  ) as TaskKind[];
  const recomputeTasks = sortedUnique(
    verdicts
      .filter((v) => v.decision === 'recompute' || v.decision === 'invalidate' || v.decision === 'partial_recompute')
      .map((v) => v.kind),
  ) as TaskKind[];
  const totalSaved = round4(verdicts.reduce((a, v) => a + v.estimated_cost_saved_usd, 0));

  return {
    session_id: sessionId,
    ticker,
    generated_at: new Date().toISOString(),
    computation_decision: verdicts,
    affected_tasks: affected,
    invalidation_reasons: invalidationReasonsAgg,
    reused_outputs: reusedOutputs,
    recompute_tasks: recomputeTasks,
    estimated_cost_saved_usd: totalSaved,
    warnings,
  };
}

// =============================================================================
// Per-task fingerprint
// =============================================================================

function computeFingerprintForTask(
  sessionId: string,
  task: PlannedTask,
  factSnap: Record<string, unknown>,
  prior: Map<TaskKind, string>,
  methodologyVersion: string,
  override: Partial<Record<TaskKind, string>>,
): string {
  const ovr = override[task.kind];
  if (typeof ovr === 'string' && ovr.length > 0) return ovr;
  const predFps: Record<string, string> = {};
  for (const p of task.required_predecessors) {
    const pf = prior.get(p);
    if (pf) predFps[p] = pf;
  }
  return computeTaskFingerprint({
    session_id: sessionId,
    task_kind: task.kind,
    fact_pack_content: factSnap,
    predecessor_fingerprints: predFps,
    methodology_version: methodologyVersion,
  });
}

// =============================================================================
// Per-task verdict
// =============================================================================

interface DecideVerdictArgs {
  sessionId: string;
  task: PlannedTask;
  computedFingerprint: string;
  accCtx: Record<string, unknown>;
  cacheMeta: CachedOutputMeta | undefined;
  currentSubFps: Record<string, string> | undefined;
  currentMethodologyVersion: string;
  dirtyKinds: ReadonlySet<TaskKind>;
  now: Date;
}

function decideVerdict(args: DecideVerdictArgs): ComputationVerdict {
  const t = args.task;
  const taskCost = TASK_COST_USD[t.kind];
  const expectedKeys = TASK_OUTPUTS[t.kind];
  const canonicalMarker = expectedKeys[0];
  const cachedPresent = Object.prototype.hasOwnProperty.call(args.accCtx, canonicalMarker);
  const baseVerdict = (
    decision: ComputationDecision,
    code: IncrementalReasonCode,
    extra?: string,
    dirtySubKeys: string[] = [],
  ): ComputationVerdict => {
    const reusedKeys = (decision === 'reuse' || decision === 'partial_recompute')
      ? expectedKeys.slice()
      : [];
    return {
      task_id: t.task_id,
      kind: t.kind,
      decision,
      reason_codes: [code],
      invalidation_reasons: [reasonText(code, t.kind, extra)],
      reused_output_keys: reusedKeys,
      dirty_sub_keys: dirtySubKeys,
      estimated_cost_saved_usd: costSavedFor(decision, taskCost, expectedKeys.length, dirtySubKeys.length),
      computed_input_fingerprint: args.computedFingerprint,
      cache_meta_snapshot: args.cacheMeta ? { ...args.cacheMeta } : undefined,
    };
  };

  // 1) No cached output marker in accumulated_context → recompute.
  if (!cachedPresent) {
    return baseVerdict('recompute', INCREMENTAL_REASON_CODES.RECOMPUTE_NO_CACHE);
  }

  // 2) Cached output present but no cache metadata → invalidate.
  if (!args.cacheMeta) {
    return baseVerdict('invalidate', INCREMENTAL_REASON_CODES.INVALIDATION_NO_CACHE_META);
  }

  // 3) Methodology drift.
  if (args.cacheMeta.methodology_version !== args.currentMethodologyVersion) {
    return baseVerdict(
      'invalidate',
      INCREMENTAL_REASON_CODES.INVALIDATION_METHODOLOGY_DRIFT,
      `cached=${args.cacheMeta.methodology_version} current=${args.currentMethodologyVersion}`,
    );
  }

  // 4) Predecessor dirty (cascade).
  const dirtyPreds = t.required_predecessors.filter((p) => args.dirtyKinds.has(p));
  if (dirtyPreds.length > 0) {
    return baseVerdict(
      'invalidate',
      INCREMENTAL_REASON_CODES.INVALIDATION_UPSTREAM_DIRTY,
      dirtyPreds.sort().join(', '),
    );
  }

  // 5) Input fingerprint mismatch.
  if (args.cacheMeta.input_fingerprint !== args.computedFingerprint) {
    return baseVerdict('invalidate', INCREMENTAL_REASON_CODES.INVALIDATION_INPUT_HASH_MISMATCH);
  }

  // 6) Freshness band 3 (>90d).
  const age = ageDays(args.cacheMeta.computed_at, args.now);
  if (age > FRESHNESS_BAND_2_DAYS) {
    return baseVerdict('invalidate', INCREMENTAL_REASON_CODES.INVALIDATION_FRESHNESS_BAND_3);
  }

  // 7) Sub-key dirtiness (when both cached + current sub-key fingerprints supplied).
  if (args.cacheMeta.sub_key_fingerprints && args.currentSubFps) {
    const dirty: string[] = [];
    const cachedSubs = args.cacheMeta.sub_key_fingerprints;
    const liveSubs = args.currentSubFps;
    const subKeys = new Set([...Object.keys(cachedSubs), ...Object.keys(liveSubs)]);
    for (const k of subKeys) {
      if (cachedSubs[k] !== liveSubs[k]) dirty.push(k);
    }
    if (dirty.length > 0) {
      return baseVerdict(
        'partial_recompute',
        INCREMENTAL_REASON_CODES.PARTIAL_RECOMPUTE_SUBKEY_DIRTY,
        `${dirty.length}`,
        dirty.sort(),
      );
    }
  }

  // 8) Freshness band 2 (30-90d) → partial_recompute (no specific dirty sub-keys).
  if (age > FRESHNESS_BAND_1_DAYS) {
    return baseVerdict(
      'partial_recompute',
      INCREMENTAL_REASON_CODES.PARTIAL_RECOMPUTE_FRESHNESS_BAND_2,
      `age=${age.toFixed(1)}d`,
    );
  }

  // 9) Otherwise — reuse.
  return baseVerdict('reuse', INCREMENTAL_REASON_CODES.REUSE_HASH_MATCH);
}

// =============================================================================
// Adapter — recordComputationPlan
// =============================================================================

export const COMPUTATION_PLAN_CONTEXT_KEYS = {
  PLAN: 'computation_plan',
  PLAN_JSON: 'computation_plan_json',
} as const;

/**
 * Append a ComputationPlan into the caller's accumulatedContext.
 *
 * - 'computation_plan' is an append-only array; existing entries are preserved.
 * - 'computation_plan_json' is a JSON string mirror.
 *
 * Mutates only the two keys above; never touches the DB or any other key,
 * and never mutates cached output objects (analytical narrative is preserved).
 */
export function recordComputationPlan(
  sessionId: string,
  plan: ComputationPlan,
  accumulatedContext: Record<string, unknown>,
): void {
  const prior = accumulatedContext[COMPUTATION_PLAN_CONTEXT_KEYS.PLAN];
  const log: Array<ComputationPlan & { recorded_for_session: string }> = Array.isArray(prior)
    ? (prior as Array<ComputationPlan & { recorded_for_session: string }>).slice()
    : [];
  log.push({ ...plan, recorded_for_session: sessionId });
  accumulatedContext[COMPUTATION_PLAN_CONTEXT_KEYS.PLAN] = log;
  accumulatedContext[COMPUTATION_PLAN_CONTEXT_KEYS.PLAN_JSON] = JSON.stringify(log);
}

// =============================================================================
// Test exports — narrow
// =============================================================================

export {
  packContentSnapshot,
  ageDays,
  FRESHNESS_BAND_1_DAYS,
  FRESHNESS_BAND_2_DAYS,
};
