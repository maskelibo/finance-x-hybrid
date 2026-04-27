/**
 * Pre-LLM / Pre-Agent Validation Engine (Block P — Plan P3A Wave 1).
 *
 * Standalone preflight that inspects the about-to-be-made LLM/agent/sub-agent
 * call against a battery of cheap deterministic validators (V1..V8) and emits
 * a single PreflightDecision with action ∈ {proceed | skip | abort}.
 *
 * Wave 1 invariants:
 *   - Standalone: no orchestrator / agent-runner / formatter wiring; the
 *     consumer is expected to invoke `runPreflight` explicitly and consult
 *     `decision.action` before issuing the call.
 *   - Read-only: no DB writes; the optional `recordPreflightDecision` adapter
 *     mutates only the caller-supplied accumulatedContext object.
 *   - Per-validator try/catch: a single validator's exception becomes an
 *     `info`-severity finding (`reason_code` ending in `_FAILURE`) and never
 *     aborts the decision pipeline.
 *   - Deterministic ordering: findings preserve validator declaration order;
 *     reason_codes are sorted unique for stable hashing/equality.
 *   - Empty / missing inputs are honest (warning), not failures.
 *
 * Action arbitration:
 *   1) any blocker  → abort
 *   2) duplication warning (V4) AND no blocker → skip
 *   3) otherwise → proceed
 *
 *   info findings never affect action; warnings (other than V4) never affect
 *   action either — they surface intent to the caller without halting.
 */

import { db } from '../db.js';
import { getCanonicalFactPackV2 } from '../fact-layer/pack-v2.js';
import { buildFactConfidenceSummary } from '../fact-layer/summary.js';
import { detectCitationGaps } from '../quality-os/citation-enforcement.js';
import { getMethodologyVersion, getSessionMethodology } from '../fact-layer/methodology.js';
import { getSector } from '../sector-registry.js';

// =============================================================================
// Types
// =============================================================================

export type PreflightAction = 'proceed' | 'skip' | 'abort';
export type PreflightSeverity = 'blocker' | 'warning' | 'info';

export type PreflightCallKind = 'llm' | 'agent' | 'subagent';

export interface PreflightCallTarget {
  kind: PreflightCallKind;
  /** Free-form id (agent_id / sub-agent name / model name). */
  id: string;
}

export interface PreflightCallContext {
  session_id: string;
  /** Override; falls back to canonical fact-pack ticker. */
  ticker?: string | null;
  call_target: PreflightCallTarget;
  /** Keys that the call is expected to write into accumulated_context. Used by V4. */
  expected_output_keys?: string[];
  /** The accumulated context the caller has built so far. Used by V4 + V6. */
  accumulated_context?: Record<string, unknown>;
  /** USD estimate for THIS call. Added to current_session_cost_usd by V8. */
  estimated_cost_usd?: number;
  /** USD cost the session has already accumulated prior to this call. V8
   *  checks `current + estimated > cap`. Defaults to 0 when unspecified —
   *  callers are expected to pass the live counter (e.g. analysis_sessions
   *  .total_cost_usd) so the cap is enforced against session-cumulative spend. */
  current_session_cost_usd?: number;
  /** USD cap on session-cumulative spend (current + estimated). Defaults to 5. */
  budget_cap_usd?: number;
  /** Free-form phase label for diagnostics (no semantics in Wave 1). */
  phase?: string;
  /** Phase boundary contract: every entry must exist as a key in
   *  accumulated_context, otherwise V6 emits a blocker. */
  required_predecessor_phases?: string[];
}

export interface PreflightFinding {
  validator: string;       // 'V1_ticker_known' .. 'V8_cost_budget_within_cap'
  reason_code: string;     // stable upper-snake-case identifier
  severity: PreflightSeverity;
  details: string;
  suggested_fix?: string;
}

export interface PreflightDecision {
  action: PreflightAction;
  /** Sorted unique. */
  reason_codes: string[];
  /** Validator declaration order. */
  findings: PreflightFinding[];
  blockers_count: number;
  warnings_count: number;
  info_count: number;
  /** Wall-clock ISO. The only non-deterministic field. */
  generated_at: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_BUDGET_CAP_USD = 5;
const CONFIDENCE_FLOOR = 0.55;

// =============================================================================
// Validator definitions
// =============================================================================

interface ValidatorRegistration {
  /** Stable validator name; appears in PreflightFinding.validator. */
  name: string;
  /** Returns 0..n findings. May throw — caught by the runner. */
  fn: (ctx: PreflightCallContext) => PreflightFinding[];
}

// -- V1 ticker_known -----------------------------------------------------------

function v1TickerKnown(ctx: PreflightCallContext): PreflightFinding[] {
  const ticker = resolveTicker(ctx);
  if (!ticker) {
    return [{
      validator: 'V1_ticker_known',
      reason_code: 'TICKER_UNKNOWN',
      severity: 'blocker',
      details: 'Aktif ticker tespit edilemedi (ne ctx.ticker ne fact-pack üzerinden).',
      suggested_fix: 'PreflightCallContext.ticker alanını doldurun veya canonical_facts ticker bilgisini güncelleyin.',
    }];
  }
  if (!getSector(ticker)) {
    return [{
      validator: 'V1_ticker_known',
      reason_code: 'TICKER_UNKNOWN',
      severity: 'blocker',
      details: `Ticker "${ticker}" sector_registry.yml içinde kayıtlı değil.`,
      suggested_fix: 'config/sector_registry.yml dosyasına ticker → sector eşlemesi ekleyin.',
    }];
  }
  return [];
}

// -- V2 fact_pack_available ----------------------------------------------------

function v2FactPackAvailable(ctx: PreflightCallContext): PreflightFinding[] {
  const pack = getCanonicalFactPackV2(ctx.session_id);
  if (pack.fact_count === 0) {
    return [{
      validator: 'V2_fact_pack_available',
      reason_code: 'DATA_FACT_PACK_EMPTY',
      severity: 'warning',
      details: `Session ${ctx.session_id} canonical fact_pack boş — ajan girdi olmadan çalışacak.`,
      suggested_fix: 'parse_standardization veya financial_analysis ajanını önce çalıştırın.',
    }];
  }
  return [];
}

// -- V3 confidence_floor -------------------------------------------------------

function v3ConfidenceFloor(ctx: PreflightCallContext): PreflightFinding[] {
  const summary = buildFactConfidenceSummary(ctx.session_id);
  if (summary.scored_fact_count === 0) {
    // Empty session is reported by V2; do not double-warn here.
    return [];
  }
  if (summary.avg_score < CONFIDENCE_FLOOR) {
    return [{
      validator: 'V3_confidence_floor',
      reason_code: 'DATA_CONFIDENCE_FLOOR_BELOW_THRESHOLD',
      severity: 'warning',
      details: `Ortalama güven skoru ${summary.avg_score.toFixed(2)} < ${CONFIDENCE_FLOOR.toFixed(2)} — düşük güvenli verilerle ileri çağrı yapılacak.`,
      suggested_fix: 'Düşük güvenli kritik fact\'leri reconciliation ajanı ile rezolüsyona alın.',
    }];
  }
  return [];
}

// -- V4 duplication_check ------------------------------------------------------

function v4DuplicationCheck(ctx: PreflightCallContext): PreflightFinding[] {
  const expected = ctx.expected_output_keys ?? [];
  const accCtx = ctx.accumulated_context ?? {};
  const collisions = expected.filter((k) => Object.prototype.hasOwnProperty.call(accCtx, k));
  if (collisions.length === 0) return [];
  return [{
    validator: 'V4_duplication_check',
    reason_code: 'DUPLICATION_OUTPUT_ALREADY_PRESENT',
    severity: 'warning',
    details: `Aşağıdaki çıkış anahtar(lar)ı accumulated_context içinde mevcut: ${collisions.sort().join(', ')}.`,
    suggested_fix: 'Tekrar üretmek istemiyorsanız bu çağrıyı atlayın; aksi halde mevcut anahtarları silin/yeniden adlandırın.',
  }];
}

// -- V5 citation_provenance_ready ---------------------------------------------

function v5CitationProvenanceReady(ctx: PreflightCallContext): PreflightFinding[] {
  const report = detectCitationGaps(ctx.session_id);
  if (report.critical_gaps.length === 0) return [];
  return [{
    validator: 'V5_citation_provenance_ready',
    reason_code: 'CITATION_CRITICAL_GAPS_PRESENT',
    severity: 'warning',
    details: `${report.critical_gaps.length} kritik fact citation eksiği mevcut: ${report.critical_gaps.slice(0, 5).map((g) => g.fact_key).join(', ')}${report.critical_gaps.length > 5 ? ', …' : ''}.`,
    suggested_fix: 'parse_standardization lineage_node\'larına source_doc_id ekleyin (P1B Wave 2/3 boru hattı).',
  }];
}

// -- V6 phase_boundary_satisfied ----------------------------------------------

function v6PhaseBoundarySatisfied(ctx: PreflightCallContext): PreflightFinding[] {
  const required = ctx.required_predecessor_phases ?? [];
  if (required.length === 0) return [];
  const accCtx = ctx.accumulated_context ?? {};
  const missing = required.filter((k) => !Object.prototype.hasOwnProperty.call(accCtx, k));
  if (missing.length === 0) return [];
  return [{
    validator: 'V6_phase_boundary_satisfied',
    reason_code: 'PHASE_BOUNDARY_VIOLATION',
    severity: 'blocker',
    details: `Önkoşul faz çıktıları accumulated_context içinde eksik: ${missing.sort().join(', ')}.`,
    suggested_fix: 'Eksik fazları (parse_standardization → financial_analysis → …) doğru sırayla çalıştırın.',
  }];
}

// -- V7 methodology_session_fresh ---------------------------------------------

function v7MethodologySessionFresh(ctx: PreflightCallContext): PreflightFinding[] {
  const snap = getSessionMethodology(ctx.session_id);
  if (!snap) {
    return [{
      validator: 'V7_methodology_session_fresh',
      reason_code: 'METHODOLOGY_SESSION_STALE',
      severity: 'warning',
      details: `Session ${ctx.session_id} için methodology snapshot kayıtlı değil — sürüm izi yok.`,
      suggested_fix: 'recordSessionMethodology(sessionId) çağrısını ajan başlangıcına ekleyin.',
    }];
  }
  const current = getMethodologyVersion();
  if (snap.methodology_version !== current) {
    return [{
      validator: 'V7_methodology_session_fresh',
      reason_code: 'METHODOLOGY_SESSION_STALE',
      severity: 'warning',
      details: `Session methodology sürümü "${snap.methodology_version}" canlı sürüm "${current}" ile eşleşmiyor.`,
      suggested_fix: 'Sürüm farkı kasıtlı değilse oturumu yeni metodolojiyle yeniden çalıştırmayı değerlendirin.',
    }];
  }
  return [];
}

// -- V8 cost_budget_within_cap -------------------------------------------------

function v8CostBudgetWithinCap(ctx: PreflightCallContext): PreflightFinding[] {
  const cap = typeof ctx.budget_cap_usd === 'number' && Number.isFinite(ctx.budget_cap_usd)
    ? ctx.budget_cap_usd
    : DEFAULT_BUDGET_CAP_USD;
  const estimate = typeof ctx.estimated_cost_usd === 'number' && Number.isFinite(ctx.estimated_cost_usd)
    ? ctx.estimated_cost_usd
    : 0;
  const current = typeof ctx.current_session_cost_usd === 'number' && Number.isFinite(ctx.current_session_cost_usd)
    ? ctx.current_session_cost_usd
    : 0;
  const projected = current + estimate;
  if (projected > cap) {
    return [{
      validator: 'V8_cost_budget_within_cap',
      reason_code: 'BUDGET_EXCEEDED',
      severity: 'blocker',
      details: `Mevcut oturum maliyeti $${current.toFixed(4)} + tahmini çağrı maliyeti $${estimate.toFixed(4)} = $${projected.toFixed(4)}, $${cap.toFixed(4)} bütçe sınırını aşıyor.`,
      suggested_fix: 'budget_cap_usd değerini bilinçli olarak yükseltin veya çağrıyı küçültün (daha az token / daha küçük model).',
    }];
  }
  return [];
}

// =============================================================================
// Validator registry — declaration order is the report finding order.
// =============================================================================

const VALIDATORS: ValidatorRegistration[] = [
  { name: 'V1_ticker_known',                fn: v1TickerKnown },
  { name: 'V2_fact_pack_available',          fn: v2FactPackAvailable },
  { name: 'V3_confidence_floor',             fn: v3ConfidenceFloor },
  { name: 'V4_duplication_check',            fn: v4DuplicationCheck },
  { name: 'V5_citation_provenance_ready',    fn: v5CitationProvenanceReady },
  { name: 'V6_phase_boundary_satisfied',     fn: v6PhaseBoundarySatisfied },
  { name: 'V7_methodology_session_fresh',    fn: v7MethodologySessionFresh },
  { name: 'V8_cost_budget_within_cap',       fn: v8CostBudgetWithinCap },
];

// =============================================================================
// Helpers
// =============================================================================

function resolveTicker(ctx: PreflightCallContext): string | null {
  if (typeof ctx.ticker === 'string' && ctx.ticker.trim().length > 0) {
    return ctx.ticker.trim().toUpperCase();
  }
  // Fall back to the session's recorded ticker (analysis_sessions row).
  const row = db.prepare(`SELECT ticker FROM analysis_sessions WHERE id = ?`)
    .get(ctx.session_id) as { ticker?: string } | undefined;
  if (row?.ticker && row.ticker !== 'TEST') return row.ticker.toUpperCase();
  return null;
}

function arbitrateAction(findings: ReadonlyArray<PreflightFinding>): PreflightAction {
  const hasBlocker = findings.some((f) => f.severity === 'blocker');
  if (hasBlocker) return 'abort';
  const hasDuplication = findings.some(
    (f) => f.severity === 'warning' && f.reason_code === 'DUPLICATION_OUTPUT_ALREADY_PRESENT',
  );
  if (hasDuplication) return 'skip';
  return 'proceed';
}

// =============================================================================
// Main entry — runPreflight
// =============================================================================

/**
 * Run all 8 preflight validators against the proposed call. Async signature
 * is kept for forward compatibility (Wave 2 may add network/disk-bound
 * validators); Wave 1 is synchronous internally.
 */
export async function runPreflight(ctx: PreflightCallContext): Promise<PreflightDecision> {
  const findings: PreflightFinding[] = [];

  for (const v of VALIDATORS) {
    try {
      const out = v.fn(ctx);
      for (const f of out) findings.push(f);
    } catch (err) {
      findings.push({
        validator: v.name,
        reason_code: `${v.name.toUpperCase()}_FAILURE`,
        severity: 'info',
        details: `Validator çalışma hatası: ${(err as Error).message}`,
        suggested_fix: 'Validator implementasyonunu inceleyin; preflight kararı blokerleri yine de uygulanır.',
      });
    }
  }

  const blockers = findings.filter((f) => f.severity === 'blocker').length;
  const warnings = findings.filter((f) => f.severity === 'warning').length;
  const infos = findings.filter((f) => f.severity === 'info').length;
  const action = arbitrateAction(findings);
  const reasonCodes = Array.from(new Set(findings.map((f) => f.reason_code))).sort();

  return {
    action,
    reason_codes: reasonCodes,
    findings,
    blockers_count: blockers,
    warnings_count: warnings,
    info_count: infos,
    generated_at: new Date().toISOString(),
  };
}

// =============================================================================
// Adapter — recordPreflightDecision
// =============================================================================

export const PREFLIGHT_CONTEXT_KEYS = {
  /** Append-only array of PreflightDecision objects. */
  LOG: 'preflight_log',
  /** JSON mirror of LOG (string), for downstream stringly-typed transports. */
  LOG_JSON: 'preflight_log_json',
} as const;

/**
 * Append a PreflightDecision into the caller's accumulatedContext.
 *
 * - `preflight_log` is an append-only array; existing entries are preserved.
 * - `preflight_log_json` is a JSON string mirror (rebuilt on every call from
 *   the up-to-date array) so plain JSON transports can ferry the log.
 *
 * Mutates only the two keys above; never touches the DB or any other key.
 */
export function recordPreflightDecision(
  sessionId: string,
  decision: PreflightDecision,
  accumulatedContext: Record<string, unknown>,
): void {
  const prior = accumulatedContext[PREFLIGHT_CONTEXT_KEYS.LOG];
  const log: Array<PreflightDecision & { session_id: string }> = Array.isArray(prior)
    ? (prior as Array<PreflightDecision & { session_id: string }>).slice()
    : [];
  log.push({ ...decision, session_id: sessionId });
  accumulatedContext[PREFLIGHT_CONTEXT_KEYS.LOG] = log;
  accumulatedContext[PREFLIGHT_CONTEXT_KEYS.LOG_JSON] = JSON.stringify(log);
}

// Test exports — intentionally narrow.
export { VALIDATORS, arbitrateAction, DEFAULT_BUDGET_CAP_USD, CONFIDENCE_FLOOR };
