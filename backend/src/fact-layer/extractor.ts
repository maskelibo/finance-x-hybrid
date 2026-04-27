/**
 * Fact extractor (Block P — Plan P1A Wave 2).
 *
 * Per-agent allow-listed numeric extractor that turns structured agent
 * outputs into rows in `canonical_facts` via the existing R7 store. Uses
 * fact-layer/confidence.ts to compute deterministic per-fact confidence
 * with conservative cross-agent agreement / conflict signals.
 *
 * Strict invariants:
 *   - allow-listed registry only (no blind numeric scanning)
 *   - missing JSON path → skip (no fabrication)
 *   - non-finite numeric value → skip
 *   - unknown agent_id → no-op
 *   - extractor failure must NEVER fail the agent run; tryExtractFactsBestEffort
 *     wraps the main entry in try/catch and only logs on error
 *   - period suffix appended to fact_key when applicable; macro/technical
 *     facts stay scope-free and rely on (session_id, fact_key) uniqueness
 *   - cross-agent agreement is conservative: increments
 *     cross_agent_agreement_count when an existing fact has near-equal value;
 *     marks has_conflict=true / severity='minor' when values diverge; never
 *     escalates to 'material' / 'critical' (those require P1D arbitration)
 */

import { nanoid } from 'nanoid';
import { upsertFact, getFact, type FactSource, type FactValue } from './store.js';
import {
  tryRecordLineageNode,
  getLineageNodeIdsForFact,
  findSourceDocIdForFact,
  computedNodeExistsForFact,
} from './lineage.js';
import { tryRecordSessionMethodology } from './methodology.js';
import { db } from '../db.js';
import type { FactConfidenceInputs } from './confidence.js';

// =============================================================================
// Types
// =============================================================================

export interface ExtractionRule {
  /** Final stored fact_key. Period suffix is appended at extraction time when
   *  the rule sets `period_scope='per_period'`. */
  fact_key: string;
  /** Dot/bracket path inside the parsed agent output. Examples:
   *    "canonical_numbers.net_debt"
   *    "standardized_statements[0].income_statement.revenue"
   *    "rates.tcmb_policy_rate"
   */
  json_path: string;
  /** Stored unit (passed through unit-normalizer in store.upsertFact). */
  unit: string;
  /** Period scoping: 'point_in_time' = no suffix; 'per_period' = `${fact_key}_${period}`. */
  period_scope: 'point_in_time' | 'per_period';
  /** Optional path that yields the period_label for `per_period` rules.
   *  Examples: "period_label" (top-level FA), "standardized_statements[0].period_label". */
  period_path?: string;
  /** Confidence inputs constants for this rule. */
  computation_complexity: 0 | 1 | 2 | 3;
  /**
   * P1B Wave 2 — optional path to the source document identifier in the
   * agent's output. When present and resolvable, the lineage node for
   * this fact carries the resulting string as source_doc_id. Examples:
   *    "standardized_statements[0].source_pdf"
   */
  source_doc_path?: string;
  /**
   * P1B Wave 2 — when true (default for FA rules), the lineage node
   * inherits source_doc_id from any prior lineage row in the session
   * whose fact_key matches the current period suffix. Inheritance only
   * fires when source_doc_path didn't resolve.
   */
  inherit_source_doc?: boolean;
}

export interface ExtractionResult {
  agent_id: string;
  session_id: string;
  extracted: number;
  skipped: number;
  /** Aligned with skipped count — one entry per skip, in deterministic order. */
  skip_reasons: string[];
  /** Distinct fact_keys persisted in this run. */
  fact_keys: string[];
}

// =============================================================================
// Per-agent registry
// =============================================================================
//
// Wave 2 covers exactly 4 agents: parse_standardization, financial_analysis,
// macro_analysis, technical_analysis. valuation_agent and others are out of
// scope for this wave (per approved decision answer #2).

// Currency rule unit is `TRY` (raw amount as emitted by parse_std /
// financial_analysis); unit-normalizer.ts routes those keys through
// normalizeToTRYMn which divides by 1e6 and stores as `TRY_mn`.
//
// P1B Wave 2 — every parse_std rule carries source_doc_path pointing at
// the per-statement `source_pdf` so lineage nodes capture provenance
// without fabrication.
const PARSE_STD_INCOME_RULES = (idx: number, period_path: string): ExtractionRule[] => {
  const source_doc_path = `standardized_statements[${idx}].source_pdf`;
  return ([
    { fact_key: 'revenue',           json_path: `standardized_statements[${idx}].income_statement.revenue`,           unit: 'TRY', period_scope: 'per_period', period_path, computation_complexity: 0, source_doc_path },
    { fact_key: 'cost_of_sales',     json_path: `standardized_statements[${idx}].income_statement.cost_of_sales`,     unit: 'TRY', period_scope: 'per_period', period_path, computation_complexity: 0, source_doc_path },
    { fact_key: 'gross_profit',      json_path: `standardized_statements[${idx}].income_statement.gross_profit`,      unit: 'TRY', period_scope: 'per_period', period_path, computation_complexity: 0, source_doc_path },
    { fact_key: 'operating_income',  json_path: `standardized_statements[${idx}].income_statement.operating_income`,  unit: 'TRY', period_scope: 'per_period', period_path, computation_complexity: 0, source_doc_path },
    { fact_key: 'ebitda',            json_path: `standardized_statements[${idx}].income_statement.ebitda`,            unit: 'TRY', period_scope: 'per_period', period_path, computation_complexity: 0, source_doc_path },
    { fact_key: 'net_income',        json_path: `standardized_statements[${idx}].income_statement.net_income`,        unit: 'TRY', period_scope: 'per_period', period_path, computation_complexity: 0, source_doc_path },
  ]);
};

const PARSE_STD_BALANCE_RULES = (idx: number, period_path: string): ExtractionRule[] => {
  const source_doc_path = `standardized_statements[${idx}].source_pdf`;
  return ([
    { fact_key: 'total_assets',         json_path: `standardized_statements[${idx}].balance_sheet.total_assets`,         unit: 'TRY', period_scope: 'per_period', period_path, computation_complexity: 0, source_doc_path },
    { fact_key: 'total_equity',         json_path: `standardized_statements[${idx}].balance_sheet.total_equity`,         unit: 'TRY', period_scope: 'per_period', period_path, computation_complexity: 0, source_doc_path },
    { fact_key: 'current_liabilities',  json_path: `standardized_statements[${idx}].balance_sheet.current_liabilities`,  unit: 'TRY', period_scope: 'per_period', period_path, computation_complexity: 0, source_doc_path },
  ]);
};

/** Statement index 0 = latest period in the standardized statements array.
 *  Wave 2 extracts from latest only; multi-period extraction is deferred. */
const PARSE_STD_RULES: ExtractionRule[] = [
  ...PARSE_STD_INCOME_RULES(0, 'standardized_statements[0].period_label'),
  ...PARSE_STD_BALANCE_RULES(0, 'standardized_statements[0].period_label'),
];

// Percentage / multiplier values are persisted as `decimal` raw (matches
// production agent output: roe=17.02 means "17.02%"). unit-normalizer.ts
// routes these through normalizePercentage when fact_key matches
// margin/ratio/rate; with `decimal` input the value passes unchanged.
// Currency keys use raw `TRY`; normalizer converts to TRY_mn.
//
// P1B Wave 2 — every FA rule sets inherit_source_doc=true. The extractor
// looks up any prior lineage row in the session whose fact_key matches
// the same period suffix (typically the parse_standardization-emitted
// raw_extracted nodes) and inherits the source_doc_id. No fabrication —
// inheritance only fires when an upstream doc anchor really exists.
const FINANCIAL_ANALYSIS_RULES: ExtractionRule[] = [
  { fact_key: 'revenue',            json_path: 'canonical_numbers.revenue',            unit: 'TRY',     period_scope: 'per_period', period_path: 'period_label', computation_complexity: 0, inherit_source_doc: true },
  { fact_key: 'net_income',         json_path: 'canonical_numbers.net_income',         unit: 'TRY',     period_scope: 'per_period', period_path: 'period_label', computation_complexity: 0, inherit_source_doc: true },
  { fact_key: 'total_assets',       json_path: 'canonical_numbers.total_assets',       unit: 'TRY',     period_scope: 'per_period', period_path: 'period_label', computation_complexity: 0, inherit_source_doc: true },
  { fact_key: 'total_equity',       json_path: 'canonical_numbers.total_equity',       unit: 'TRY',     period_scope: 'per_period', period_path: 'period_label', computation_complexity: 0, inherit_source_doc: true },
  { fact_key: 'gross_margin',       json_path: 'canonical_numbers.gross_margin',       unit: 'decimal', period_scope: 'per_period', period_path: 'period_label', computation_complexity: 1, inherit_source_doc: true },
  { fact_key: 'ebitda_margin',      json_path: 'canonical_numbers.ebitda_margin',      unit: 'decimal', period_scope: 'per_period', period_path: 'period_label', computation_complexity: 1, inherit_source_doc: true },
  { fact_key: 'net_margin',         json_path: 'canonical_numbers.net_margin',         unit: 'decimal', period_scope: 'per_period', period_path: 'period_label', computation_complexity: 1, inherit_source_doc: true },
  { fact_key: 'roe',                json_path: 'canonical_numbers.roe',                unit: 'decimal', period_scope: 'per_period', period_path: 'period_label', computation_complexity: 1, inherit_source_doc: true },
  { fact_key: 'roa',                json_path: 'canonical_numbers.roa',                unit: 'decimal', period_scope: 'per_period', period_path: 'period_label', computation_complexity: 1, inherit_source_doc: true },
  { fact_key: 'roce',               json_path: 'canonical_numbers.roce',               unit: 'decimal', period_scope: 'per_period', period_path: 'period_label', computation_complexity: 1, inherit_source_doc: true },
  { fact_key: 'current_ratio',      json_path: 'canonical_numbers.current_ratio',      unit: 'decimal', period_scope: 'per_period', period_path: 'period_label', computation_complexity: 1, inherit_source_doc: true },
  { fact_key: 'net_debt',           json_path: 'canonical_numbers.net_debt',           unit: 'TRY',     period_scope: 'per_period', period_path: 'period_label', computation_complexity: 1, inherit_source_doc: true },
  { fact_key: 'net_debt_to_ebitda', json_path: 'canonical_numbers.net_debt_to_ebitda', unit: 'x',       period_scope: 'per_period', period_path: 'period_label', computation_complexity: 2, inherit_source_doc: true },
  { fact_key: 'fcf',                json_path: 'canonical_numbers.fcf',                unit: 'TRY',     period_scope: 'per_period', period_path: 'period_label', computation_complexity: 1, inherit_source_doc: true },
];

const MACRO_RULES: ExtractionRule[] = [
  // Both nested and flat shapes are observed in live macro_analysis output;
  // we run both rule sets and the missing-path skip filters out the absent
  // shape automatically. Values stored raw decimal (production format,
  // e.g. tcmb=50 means 50%); unit-normalizer routes through percentage
  // branch via the `_rate` keyword and pass-through for `decimal`.
  { fact_key: 'tcmb_policy_rate', json_path: 'rates.tcmb_policy_rate', unit: 'decimal', period_scope: 'point_in_time', computation_complexity: 0 },
  { fact_key: 'tcmb_policy_rate', json_path: 'tcmb_policy_rate',       unit: 'decimal', period_scope: 'point_in_time', computation_complexity: 0 },
  { fact_key: 'cpi_yoy',          json_path: 'inflation.cpi_yoy',      unit: 'decimal', period_scope: 'point_in_time', computation_complexity: 0 },
  { fact_key: 'cpi_yoy',          json_path: 'cpi_yoy',                unit: 'decimal', period_scope: 'point_in_time', computation_complexity: 0 },
  { fact_key: 'usd_try',          json_path: 'rates.usd_try',          unit: 'decimal', period_scope: 'point_in_time', computation_complexity: 0 },
  { fact_key: 'usd_try',          json_path: 'usd_try',                unit: 'decimal', period_scope: 'point_in_time', computation_complexity: 0 },
  { fact_key: 'eur_try',          json_path: 'rates.eur_try',          unit: 'decimal', period_scope: 'point_in_time', computation_complexity: 0 },
  { fact_key: 'eur_try',          json_path: 'eur_try',                unit: 'decimal', period_scope: 'point_in_time', computation_complexity: 0 },
];

const TECHNICAL_RULES: ExtractionRule[] = [
  { fact_key: 'rsi_14', json_path: 'rsi_14', unit: 'decimal', period_scope: 'point_in_time', computation_complexity: 1 },
  { fact_key: 'rsi_14', json_path: 'rsi',    unit: 'decimal', period_scope: 'point_in_time', computation_complexity: 1 },
];

const REGISTRY: Record<string, ExtractionRule[]> = {
  parse_standardization: PARSE_STD_RULES,
  financial_analysis:    FINANCIAL_ANALYSIS_RULES,
  macro_analysis:        MACRO_RULES,
  technical_analysis:    TECHNICAL_RULES,
};

/** Internal — exposed for tests so the registry surface is verifiable. */
export function getExtractionRules(agentId: string): ExtractionRule[] {
  return REGISTRY[agentId] ?? [];
}

/** Internal — exposed for tests. */
export function listSupportedAgents(): string[] {
  return Object.keys(REGISTRY);
}

// =============================================================================
// JSON loose-parse + path resolution
// =============================================================================

/** Robust JSON parser that recovers from LLM preambles or trailing prose by
 *  taking the longest brace-bounded slice. Mirrors runner.parseLooseJson. */
function parseLooseJson(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed); } catch { /* fall through */ }
  const a = trimmed.indexOf('{');
  const b = trimmed.lastIndexOf('}');
  if (a >= 0 && b > a) {
    try { return JSON.parse(trimmed.slice(a, b + 1)); } catch { return null; }
  }
  return null;
}

/** Resolve a dot/bracket path against a parsed object. Returns undefined when
 *  any segment is missing or types diverge. Pure / no-throw. */
export function resolvePath(root: unknown, path: string): unknown {
  if (root == null || typeof root !== 'object') return undefined;
  // Tokenize: "a.b[0].c" → ['a', 'b', '0', 'c']
  const tokens: string[] = [];
  let buf = '';
  for (let i = 0; i < path.length; i++) {
    const ch = path[i];
    if (ch === '.') {
      if (buf) tokens.push(buf);
      buf = '';
    } else if (ch === '[') {
      if (buf) tokens.push(buf);
      buf = '';
    } else if (ch === ']') {
      if (buf) tokens.push(buf);
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf) tokens.push(buf);

  let cur: unknown = root;
  for (const t of tokens) {
    if (cur == null) return undefined;
    if (Array.isArray(cur)) {
      const i = Number(t);
      if (!Number.isInteger(i) || i < 0 || i >= cur.length) return undefined;
      cur = cur[i];
    } else if (typeof cur === 'object') {
      cur = (cur as Record<string, unknown>)[t];
    } else {
      return undefined;
    }
  }
  return cur;
}

/** Coerce a resolved value into a finite number. Strings with thousand
 *  separators / spaces / commas are accepted. Returns null on failure. */
function toFiniteNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const cleaned = v.trim().replace(/[, ]/g, '');
    if (!cleaned) return null;
    const n = Number(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * Wave 2 — extractor-side unit normalisation. Decoupled from
 * `unit-normalizer.normalizeFactValue` (which uses fact_key heuristics that
 * miss several keys, e.g. `net_income`, `total_assets`). This helper applies
 * the storage transform per declared rule unit so the extractor's contract
 * is stable regardless of which fact_key heuristics the downstream
 * normaliser happens to recognise.
 *
 * Wave 1 of P1B also uses this transform's verbal label as the lineage
 * `unit_conversion` audit string (e.g. "TRY → TRY_mn /1e6").
 */
function normalizeForStorage(rawValue: number, ruleUnit: string): { value: number; unit: string; conversion: string | null } {
  switch (ruleUnit) {
    case 'TRY':    return { value: rawValue / 1_000_000, unit: 'TRY_mn', conversion: 'TRY → TRY_mn /1e6' };
    case 'TRY_bn': return { value: rawValue * 1000,      unit: 'TRY_mn', conversion: 'TRY_bn → TRY_mn ×1000' };
    case 'TRY_mn': return { value: rawValue,             unit: 'TRY_mn', conversion: null };
    case 'pct':    return { value: rawValue / 100,       unit: 'decimal', conversion: 'pct → decimal /100' };
    case 'decimal':return { value: rawValue,             unit: 'decimal', conversion: null };
    case 'x':      return { value: rawValue,             unit: 'x',       conversion: null };
    default:       return { value: rawValue,             unit: ruleUnit,  conversion: null };
  }
}

// =============================================================================
// Period suffix
// =============================================================================
//
// Normalises observed period_label strings to a stable, lowercase suffix that
// keeps fact_keys collision-free across periods AND legible in the store
// ("revenue_fy2025" / "revenue_q1_2026" / "revenue_h1_2026"). Falls back to
// raw lowercase-alnum when the shape is unrecognised.

/** Exposed for tests. */
export function normalizePeriodSuffix(period: unknown): string | null {
  if (typeof period !== 'string') return null;
  const trimmed = period.trim();
  if (!trimmed) return null;
  // FY-2025 / fy_2025 / FY2025 → fy2025
  let m = trimmed.match(/^FY[-_]?(\d{4})$/i);
  if (m) return `fy${m[1]}`;
  // Q1-2026 / Q1_2026 / Q1 2026 → q1_2026
  m = trimmed.match(/^(Q[1-4])[-_ ]?(\d{4})$/i);
  if (m) return `${m[1].toLowerCase()}_${m[2]}`;
  // H1-2026 / H2-2026
  m = trimmed.match(/^(H[12])[-_ ]?(\d{4})$/i);
  if (m) return `${m[1].toLowerCase()}_${m[2]}`;
  // YYYY-MM-DD or YYYYMMDD as-of marker
  m = trimmed.match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
  if (m) return `${m[1]}${m[2]}${m[3]}`;
  // Fallback: lowercase alphanumerics only
  const fallback = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  return fallback.length > 0 ? fallback : null;
}

// =============================================================================
// Cross-agent agreement / conflict (conservative)
// =============================================================================
//
// Wave 2 limits classification to:
//   - same fact_key + near-equal value → cross_agent_agreement_count++
//   - same fact_key + different value  → has_conflict=true, severity='minor'
// `material` / `critical` severities require P1D arbitration; never set here.

const NEAR_EQUAL_RELATIVE_TOLERANCE = 0.01; // 1%
const NEAR_EQUAL_ABSOLUTE_TOLERANCE = 1e-6;

function nearEqual(a: number, b: number): boolean {
  if (a === b) return true;
  const diff = Math.abs(a - b);
  if (diff <= NEAR_EQUAL_ABSOLUTE_TOLERANCE) return true;
  const denom = Math.max(Math.abs(a), Math.abs(b));
  if (denom === 0) return diff <= NEAR_EQUAL_ABSOLUTE_TOLERANCE;
  return diff / denom <= NEAR_EQUAL_RELATIVE_TOLERANCE;
}

interface AgreementSignal {
  agreement_count: number;
  has_conflict: boolean;
  conflict_severity?: 'minor';
}

function detectAgreementSignal(
  sessionId: string,
  factKey: string,
  /** Already storage-normalised numeric value (extractor pre-normalises via
   *  normalizeForStorage so existing/new comparison is apples-to-apples). */
  storedValue: FactValue,
): AgreementSignal {
  if (typeof storedValue !== 'number' || !Number.isFinite(storedValue)) {
    return { agreement_count: 1, has_conflict: false };
  }
  const existing = getFact(sessionId, factKey);
  if (!existing || typeof existing.value !== 'number' || !Number.isFinite(existing.value)) {
    return { agreement_count: 1, has_conflict: false };
  }
  if (nearEqual(existing.value, storedValue)) {
    const prevCount = existing.confidence?.components?.agreement_bonus != null
      ? Math.round(existing.confidence.components.agreement_bonus / 0.03) + 1
      : 1;
    return { agreement_count: Math.max(prevCount + 1, 2), has_conflict: false };
  }
  return { agreement_count: 1, has_conflict: true, conflict_severity: 'minor' };
}

// =============================================================================
// Main entry — pure, no thrown errors at the rule-evaluation boundary
// =============================================================================

export function extractFactsFromAgentOutput(
  agentId: string,
  sessionId: string,
  outputText: string | null | undefined,
  options?: {
    /** ISO timestamp for the FactSource.extracted_at. Defaults to now. */
    extracted_at?: string;
  },
): ExtractionResult {
  const result: ExtractionResult = {
    agent_id: agentId,
    session_id: sessionId,
    extracted: 0,
    skipped: 0,
    skip_reasons: [],
    fact_keys: [],
  };

  const rules = getExtractionRules(agentId);
  if (rules.length === 0) {
    // Unknown agent_id → no-op. Recorded so callers can verify expected coverage.
    result.skip_reasons.push(`unknown_agent_id:${agentId}`);
    return result;
  }

  const parsed = parseLooseJson(outputText);
  if (!parsed) {
    result.skip_reasons.push('parse_failed_or_empty_output');
    return result;
  }

  const extractedAt = options?.extracted_at ?? new Date().toISOString();
  const seenKeys = new Set<string>();

  // P1C Wave 1 — record the methodology snapshot lazily on the first
  // extraction call for this session. Idempotent (INSERT OR IGNORE) and
  // best-effort: failure logs warn and never blocks extraction.
  tryRecordSessionMethodology(sessionId);

  for (const rule of rules) {
    let keyForStore = rule.fact_key;
    if (rule.period_scope === 'per_period') {
      const pPath = rule.period_path ?? 'period_label';
      const periodRaw = resolvePath(parsed, pPath);
      const periodSuffix = normalizePeriodSuffix(periodRaw);
      if (!periodSuffix) {
        result.skipped++;
        result.skip_reasons.push(`${rule.fact_key}: period_missing_or_unparseable@${pPath}`);
        continue;
      }
      keyForStore = `${rule.fact_key}_${periodSuffix}`;
    }

    if (seenKeys.has(keyForStore)) {
      // A second rule resolved into the same final key (e.g. macro nested vs
      // flat shape both succeeded). Skip the duplicate so we don't overwrite
      // the first persisted fact with a re-derived but identical value.
      continue;
    }

    const raw = resolvePath(parsed, rule.json_path);
    if (raw === undefined) {
      result.skipped++;
      result.skip_reasons.push(`${keyForStore}: missing_path:${rule.json_path}`);
      continue;
    }
    const numeric = toFiniteNumber(raw);
    if (numeric === null) {
      result.skipped++;
      result.skip_reasons.push(`${keyForStore}: non_finite_value:${rule.json_path}`);
      continue;
    }

    // Pre-normalise to storage form (TRY → TRY_mn /1e6, pct → decimal /100,
    // x/decimal/TRY_mn pass-through). Decoupled from unit-normalizer's
    // fact_key heuristics so the extractor's contract is stable. The
    // verbal `conversion` label is also persisted into lineage for audit.
    const { value: storedValue, unit: storedUnit, conversion: unitConversion } =
      normalizeForStorage(numeric, rule.unit);

    const source: FactSource = {
      type: 'agent',
      agent_id: agentId,
      extracted_at: extractedAt,
      freshness_days: 0,
    };

    const agreement = detectAgreementSignal(sessionId, keyForStore, storedValue);
    const confidenceInputs: Omit<FactConfidenceInputs, 'sources'> = {
      computation_complexity: rule.computation_complexity,
      cross_agent_agreement_count: agreement.agreement_count,
      has_conflict: agreement.has_conflict,
      ...(agreement.has_conflict ? { conflict_severity: agreement.conflict_severity } : {}),
    };

    try {
      upsertFact({
        session_id: sessionId,
        fact_key: keyForStore,
        value: storedValue,
        unit: storedUnit,
        sources: [source],
        confidence_inputs: confidenceInputs,
      });
      result.extracted++;
      result.fact_keys.push(keyForStore);
      seenKeys.add(keyForStore);

      // P1B Wave 2 — resolve source_doc_id with strict no-fabrication
      // semantics:
      //   1. If rule.source_doc_path resolves to a non-empty string in
      //      the agent output, use that.
      //   2. Otherwise, if rule.inherit_source_doc is true AND the fact_key
      //      has period-suffix matches in prior lineage rows (e.g. parse_std
      //      already wrote `revenue_fy2025` with a doc_id), inherit it.
      //   3. Otherwise, leave null. No synthetic doc IDs.
      let sourceDocId: string | null = null;
      if (rule.source_doc_path) {
        const r = resolvePath(parsed, rule.source_doc_path);
        if (typeof r === 'string' && r.trim().length > 0) sourceDocId = r.trim();
      }
      if (sourceDocId === null && rule.inherit_source_doc) {
        sourceDocId = findSourceDocIdForFact(sessionId, keyForStore);
        if (sourceDocId === null && rule.period_scope === 'per_period') {
          // Fall back to any prior lineage row in this session whose
          // fact_key carries the same period suffix.
          const periodMatch = keyForStore.match(/_(?:fy\d{4}|q[1-4]_\d{4}|h[12]_\d{4}|\d{8})$/i);
          if (periodMatch) {
            sourceDocId = inheritSourceDocByPeriodSuffix(sessionId, periodMatch[0]);
          }
        }
      }

      tryRecordLineageNode({
        session_id: sessionId,
        fact_key: keyForStore,
        node_id: `ln-${nanoid(10)}`,
        node_type: 'raw_extracted',
        formula: null,
        computed_by: agentId,
        computed_at: extractedAt,
        source_doc_id: sourceDocId,
        source_page: null,
        source_snippet: null,
        raw_value: numeric,
        normalized_value: storedValue,
        unit_conversion: unitConversion,
        input_node_ids: [],
      });
    } catch (err) {
      // Per-rule persistence failure should not abort the whole extraction.
      result.skipped++;
      result.skip_reasons.push(`${keyForStore}: upsert_failed:${(err as Error).message}`);
    }
  }

  // P1B Wave 2 — post-extraction pass: emit `computed` lineage nodes for
  // the well-known derivations whose inputs all exist in this session's
  // lineage. Idempotent (skips when a computed node already exists for
  // the output fact_key).
  try {
    emitComputedLineageForSession(sessionId, agentId, extractedAt);
  } catch (err) {
    console.warn(`[fact-extractor] computed_lineage_failed session=${sessionId}: ${(err as Error).message}`);
  }

  return result;
}

// =============================================================================
// P1B Wave 2 — period-suffix doc inheritance
// =============================================================================
//
// When a rule sets inherit_source_doc=true and we cannot find a doc on
// the same fact_key (e.g. FA's `revenue_fy2025` with no parse_std-emitted
// `revenue_fy2025` row yet), we widen the search to ANY fact_key in the
// session whose suffix matches. This catches the common case where
// parse_std emitted revenue/ebitda/etc. for the same period; FA inherits
// from the cohort.

function inheritSourceDocByPeriodSuffix(sessionId: string, periodSuffixWithUnderscore: string): string | null {
  const row = db.prepare(`
    SELECT source_doc_id FROM lineage_nodes
    WHERE session_id = ?
      AND fact_key LIKE ?
      AND source_doc_id IS NOT NULL AND source_doc_id != ''
    ORDER BY computed_at ASC
    LIMIT 1
  `).get(sessionId, `%${periodSuffixWithUnderscore}`) as { source_doc_id: string } | undefined;
  return row?.source_doc_id ?? null;
}

// =============================================================================
// P1B Wave 2 — computed-fact registry + post-pass emitter
// =============================================================================
//
// 7 well-known derivations approved by user. Each entry declares its
// inputs and the formula. After extraction completes, we walk the period
// suffixes seen in this session and emit a `computed` lineage node for
// each (output_stem, period) combo whose inputs are ALL present.
//
// Strict: no canonical_facts mutation. The computed node is purely for
// audit / DAG visibility. When the formula-derived value diverges from
// FA's emitted value beyond DIVERGENCE_TOLERANCE, the unit_conversion
// audit field carries a `formula_divergence:` annotation so P2A can
// surface it without altering canonical_facts.

interface ComputedRule {
  output_stem: string;
  formula: string;
  input_stems: string[];
  /**
   * Computes the formula value from input fact_values (already storage-
   * normalised by the time we read them). Returns null on any input
   * missing / non-finite / divide-by-zero.
   */
  compute: (inputs: Record<string, number>) => number | null;
}

const COMPUTED_FACT_REGISTRY: ComputedRule[] = [
  {
    output_stem: 'net_debt_to_ebitda',
    formula: 'net_debt / ebitda',
    input_stems: ['net_debt', 'ebitda'],
    compute: (i) => safeDivide(i.net_debt, i.ebitda),
  },
  {
    output_stem: 'current_ratio',
    formula: 'current_assets / current_liabilities',
    input_stems: ['current_assets', 'current_liabilities'],
    compute: (i) => safeDivide(i.current_assets, i.current_liabilities),
  },
  {
    output_stem: 'gross_margin',
    formula: '(gross_profit / revenue) * 100',
    input_stems: ['gross_profit', 'revenue'],
    compute: (i) => mulOrNull(safeDivide(i.gross_profit, i.revenue), 100),
  },
  {
    output_stem: 'ebitda_margin',
    formula: '(ebitda / revenue) * 100',
    input_stems: ['ebitda', 'revenue'],
    compute: (i) => mulOrNull(safeDivide(i.ebitda, i.revenue), 100),
  },
  {
    output_stem: 'net_margin',
    formula: '(net_income / revenue) * 100',
    input_stems: ['net_income', 'revenue'],
    compute: (i) => mulOrNull(safeDivide(i.net_income, i.revenue), 100),
  },
  {
    output_stem: 'roe',
    formula: '(net_income / total_equity) * 100',
    input_stems: ['net_income', 'total_equity'],
    compute: (i) => mulOrNull(safeDivide(i.net_income, i.total_equity), 100),
  },
  {
    output_stem: 'roa',
    formula: '(net_income / total_assets) * 100',
    input_stems: ['net_income', 'total_assets'],
    compute: (i) => mulOrNull(safeDivide(i.net_income, i.total_assets), 100),
  },
];

const DIVERGENCE_TOLERANCE = 0.01; // 1% relative

function safeDivide(a: number | undefined, b: number | undefined): number | null {
  if (typeof a !== 'number' || !Number.isFinite(a)) return null;
  if (typeof b !== 'number' || !Number.isFinite(b) || b === 0) return null;
  return a / b;
}

function mulOrNull(v: number | null, k: number): number | null {
  if (v === null) return null;
  const r = v * k;
  return Number.isFinite(r) ? r : null;
}

function emitComputedLineageForSession(
  sessionId: string,
  emitterAgentId: string,
  extractedAt: string,
): void {
  // Discover period suffixes in this session's persisted facts.
  const periods = new Set<string>();
  const factRows = db.prepare(
    `SELECT fact_key FROM canonical_facts WHERE session_id = ?`,
  ).all(sessionId) as Array<{ fact_key: string }>;
  for (const r of factRows) {
    const m = r.fact_key.match(/_(?:fy\d{4}|q[1-4]_\d{4}|h[12]_\d{4}|\d{8})$/i);
    if (m) periods.add(m[0].slice(1)); // strip leading underscore
  }
  if (periods.size === 0) return;

  for (const period of periods) {
    for (const rule of COMPUTED_FACT_REGISTRY) {
      const outputKey = `${rule.output_stem}_${period}`;

      // Idempotent: skip if a computed node already exists for this fact_key
      if (computedNodeExistsForFact(sessionId, outputKey)) continue;

      // Look up input fact values + their lineage_node ids
      const inputValues: Record<string, number> = {};
      const inputNodeIds: string[] = [];
      let allInputsPresent = true;
      for (const stem of rule.input_stems) {
        const inputKey = `${stem}_${period}`;
        const inputFact = getFact(sessionId, inputKey);
        if (!inputFact || typeof inputFact.value !== 'number' || !Number.isFinite(inputFact.value)) {
          allInputsPresent = false;
          break;
        }
        inputValues[stem] = inputFact.value;
        const nodeIds = getLineageNodeIdsForFact(sessionId, inputKey);
        if (nodeIds.length === 0) {
          allInputsPresent = false;
          break;
        }
        inputNodeIds.push(nodeIds[0]); // first (oldest) input node anchors the edge
      }
      if (!allInputsPresent) continue;

      const formulaValue = rule.compute(inputValues);
      if (formulaValue === null) continue;

      // Compare against FA-emitted (canonical_facts) value for the same key
      const emittedFact = getFact(sessionId, outputKey);
      const emittedValue = emittedFact && typeof emittedFact.value === 'number' && Number.isFinite(emittedFact.value)
        ? emittedFact.value
        : null;
      let unitConversion: string | null = `formula:${rule.formula}`;
      if (emittedValue !== null) {
        const denom = Math.max(Math.abs(emittedValue), Math.abs(formulaValue));
        const relDelta = denom > 0 ? Math.abs(emittedValue - formulaValue) / denom : 0;
        if (relDelta > DIVERGENCE_TOLERANCE) {
          unitConversion = `formula:${rule.formula}; formula_divergence: computed=${formulaValue.toFixed(4)} vs FA-emitted=${emittedValue.toFixed(4)} (${(relDelta * 100).toFixed(2)}%)`;
        }
      }

      // Inherit source_doc_id from the first input that has one
      let sourceDocId: string | null = null;
      for (const stem of rule.input_stems) {
        const inputKey = `${stem}_${period}`;
        const docId = findSourceDocIdForFact(sessionId, inputKey);
        if (docId) { sourceDocId = docId; break; }
      }

      tryRecordLineageNode({
        session_id: sessionId,
        fact_key: outputKey,
        node_id: `ln-${nanoid(10)}`,
        node_type: 'computed',
        formula: rule.formula,
        computed_by: `fact_layer:formula:${emitterAgentId}`,
        computed_at: extractedAt,
        source_doc_id: sourceDocId,
        source_page: null,
        source_snippet: null,
        raw_value: emittedValue,
        normalized_value: formulaValue,
        unit_conversion: unitConversion,
        input_node_ids: inputNodeIds,
      });
    }
  }
}

// =============================================================================
// Best-effort wrapper for agent-runner integration
// =============================================================================
//
// Designed to be called from agent-runner.ts in a fire-and-forget shape.
// Swallows all errors — fact extraction is observability, never a blocker
// on the agent run itself.

export function tryExtractFactsBestEffort(
  agentId: string | undefined,
  sessionId: string | undefined,
  outputText: string | null | undefined,
): ExtractionResult | null {
  if (!agentId || !sessionId || !outputText) return null;
  try {
    return extractFactsFromAgentOutput(agentId, sessionId, outputText);
  } catch (err) {
    console.warn(`[fact-extractor] best_effort_failed agent=${agentId} session=${sessionId}: ${(err as Error).message}`);
    return null;
  }
}
