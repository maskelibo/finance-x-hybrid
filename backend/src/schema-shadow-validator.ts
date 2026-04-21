/**
 * Schema shadow validator — Phase 3A + Phase 4A observe-only.
 *
 * Runs the canonical depth rules (from canonical/rules/mandatory_metrics.yaml)
 * and shared-contract structural expectations against an agent output WITHOUT
 * influencing the pipeline. Violations are recorded via
 * gate-observer.recordSchemaShadowObservation() so later phases can make a
 * data-informed decision about flipping to hard enforcement.
 *
 * Rules checked (each raises a distinct `rule` string the validation-gate
 * classifier buckets into a category):
 *
 *   Phase 3A (depth + metric catalogue):
 *   - interpretation_depth           — observation/reasoning/counterargument/
 *                                      implication below canonical minLength
 *   - metrics_array_size             — financial_analysis: < 28 items
 *   - OI-002_engine_snapshot_subset  — engine_snapshot keys ⊄ metrics_array ids
 *   - IAS29-001_trio_missing         — IAS29 text implied but trio incomplete
 *   - MM-25_roe_without_coe          — ROE discussed without CoE comparison
 *
 *   Phase 4A (shared-contract structural):
 *   - qa_overall_score_missing       — qa_review lacks numeric overall_score
 *   - addressed_findings_set_mismatch — intra-doc findings[] vs addressed_findings[]
 *                                       id set inequality
 *   - addressed_finding_shallow       — addressed_findings[].explanation < 30
 *   - metrics_array_item_malformed    — metrics_array[] item id not MM-XX
 *
 * Called from orchestrator.ts right after each agent run. Errors here never
 * propagate — the shadow validator is allowed to fail silently. It is NOT a
 * source of truth; it is a data-collection layer.
 */

import { recordSchemaShadowObservation } from './gate-observer.js';

type Violation = { rule: string; path?: string; detail?: string };

const INTERPRETATION_MIN_CHARS: Record<string, number> = {
  observation: 80,
  reasoning: 120,
  counterargument: 60,
  implication: 80,
};

const MANDATORY_METRIC_IDS = Array.from({ length: 28 }, (_, i) => `MM-${String(i + 1).padStart(2, '0')}`);

function extractJsonBlock(text: string): unknown | null {
  // Look for ```json ... ``` first; fall back to first balanced brace block.
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch { /* fall through */ }
  }
  // Naive extraction: first '{' to matching '}'.
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(text.slice(start, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

function walkInterpretations(node: unknown, path: string, violations: Violation[]): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((child, i) => walkInterpretations(child, `${path}[${i}]`, violations));
    return;
  }
  const obj = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    const childPath = path ? `${path}.${key}` : key;
    const minChars = INTERPRETATION_MIN_CHARS[key];
    if (minChars && typeof value === 'string') {
      const len = value.trim().length;
      if (len < minChars) {
        violations.push({
          rule: 'interpretation_depth',
          path: childPath,
          detail: `${key} is ${len} chars, floor ${minChars}`,
        });
      }
    } else if (value && typeof value === 'object') {
      walkInterpretations(value, childPath, violations);
    }
  }
}

function collectMetricArray(doc: unknown): { ids: string[]; arrayKey: string | null } {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return { ids: [], arrayKey: null };
  const obj = doc as Record<string, unknown>;
  const candidateKeys = ['metrics_array', 'metrics', 'metric_list'];
  for (const k of candidateKeys) {
    const v = obj[k];
    if (Array.isArray(v)) {
      const ids = v
        .map((item) => {
          if (item && typeof item === 'object' && 'id' in item) {
            return String((item as Record<string, unknown>).id);
          }
          return null;
        })
        .filter((id): id is string => typeof id === 'string');
      return { ids, arrayKey: k };
    }
  }
  return { ids: [], arrayKey: null };
}

function collectEngineSnapshotKeys(doc: unknown): string[] {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return [];
  const obj = doc as Record<string, unknown>;
  const snap = obj.engine_snapshot;
  if (!snap || typeof snap !== 'object' || Array.isArray(snap)) return [];
  return Object.keys(snap);
}

function validateFinancialAnalysisOutput(output: string, violations: Violation[]): void {
  const doc = extractJsonBlock(output);
  if (!doc) {
    violations.push({ rule: 'json_block_missing', detail: 'no parseable JSON block' });
    return;
  }
  walkInterpretations(doc, '', violations);

  const { ids } = collectMetricArray(doc);
  if (ids.length < MANDATORY_METRIC_IDS.length) {
    const missing = MANDATORY_METRIC_IDS.filter((m) => !ids.includes(m));
    violations.push({
      rule: 'metrics_array_size',
      path: 'metrics_array',
      detail: `present ${ids.length}/${MANDATORY_METRIC_IDS.length}; missing: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '…' : ''}`,
    });
  }

  // Phase 4A: canonical id shape — each metrics_array[].id should match MM-XX.
  const malformedIds = ids.filter((id) => !/^MM-[0-9]{2}$/.test(id));
  if (malformedIds.length > 0) {
    violations.push({
      rule: 'metrics_array_item_malformed',
      path: 'metrics_array[].id',
      detail: `malformed ids: ${malformedIds.slice(0, 8).join(', ')}${malformedIds.length > 8 ? '…' : ''}`,
    });
  }

  const snapKeys = collectEngineSnapshotKeys(doc);
  if (snapKeys.length > 0) {
    const notInArray = snapKeys.filter((k) => !ids.includes(k));
    if (notInArray.length > 0) {
      violations.push({
        rule: 'OI-002_engine_snapshot_subset',
        path: 'engine_snapshot',
        detail: `engine_snapshot keys not in metrics_array: ${notInArray.slice(0, 10).join(', ')}${notInArray.length > 10 ? '…' : ''}`,
      });
    }
  }
}

/**
 * Phase 4A — qa_review specific check: the overall_score (0..1 numeric) must
 * be present for the CEO gate / dashboard to reason about quality trends.
 * Shadow-only: the runtime schema still has overall_score as optional.
 */
function validateQaReviewOutput(output: string, violations: Violation[]): void {
  const doc = extractJsonBlock(output);
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    // QA outputs are expected to be JSON; treat parse failure as structural gap.
    violations.push({ rule: 'qa_overall_score_missing', detail: 'could not parse QA JSON block' });
    return;
  }
  const obj = doc as Record<string, unknown>;
  const score = obj['overall_score'];
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 1) {
    violations.push({
      rule: 'qa_overall_score_missing',
      path: 'overall_score',
      detail: typeof score === 'undefined'
        ? 'field absent'
        : `field present but invalid: ${JSON.stringify(score).slice(0, 60)}`,
    });
  }
}

/**
 * Phase 4A — intra-doc findings ↔ addressed_findings consistency. The
 * cross-agent coverage (downstream addresses upstream's findings) is owned
 * by validation-gate.ts because it needs session context; here we only
 * assert that when a single output carries BOTH arrays, their id sets are
 * equal and each addressed_findings[].explanation passes the shallow floor.
 */
function validateFindingsBlock(doc: unknown, violations: Violation[]): void {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return;
  const obj = doc as Record<string, unknown>;
  const findings = Array.isArray(obj['findings']) ? obj['findings'] as unknown[] : null;
  const addressed = Array.isArray(obj['addressed_findings']) ? obj['addressed_findings'] as unknown[] : null;

  const collectIds = (arr: unknown[]): string[] => arr
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const id = (item as Record<string, unknown>)['finding_id'];
      return typeof id === 'string' ? id : null;
    })
    .filter((id): id is string => id !== null);

  if (findings && addressed) {
    const findingIds = new Set(collectIds(findings));
    const addressedIds = new Set(collectIds(addressed));
    const missingAddressed: string[] = [];
    findingIds.forEach((id) => { if (!addressedIds.has(id)) missingAddressed.push(id); });
    const extraAddressed: string[] = [];
    addressedIds.forEach((id) => { if (!findingIds.has(id)) extraAddressed.push(id); });
    if (missingAddressed.length > 0 || extraAddressed.length > 0) {
      violations.push({
        rule: 'addressed_findings_set_mismatch',
        path: 'addressed_findings[].finding_id',
        detail: `missing_in_addressed=${missingAddressed.slice(0, 6).join(',') || '∅'} | extra_in_addressed=${extraAddressed.slice(0, 6).join(',') || '∅'}`,
      });
    }
  }

  if (addressed) {
    addressed.forEach((item, i) => {
      if (!item || typeof item !== 'object') return;
      const rec = item as Record<string, unknown>;
      const explanation = rec['explanation'];
      if (typeof explanation === 'string' && explanation.trim().length < 30) {
        violations.push({
          rule: 'addressed_finding_shallow',
          path: `addressed_findings[${i}].explanation`,
          detail: `${explanation.trim().length} chars, floor 30`,
        });
      }
    });
  }
}

function ias29PeriodLikelyApplies(text: string): boolean {
  return /IAS\s*29|TAS\s*29|enflasyon\s+muhaseb/i.test(text);
}

function coeMentioned(text: string): boolean {
  return /\bCoE\b|cost\s+of\s+equity|[öo]zkaynak\s+maliyeti/i.test(text);
}

function roeMentioned(text: string): boolean {
  return /\bROE\b|[öo]zsermaye\s+k[aâ]rl/i.test(text);
}

function ias29TrioPresent(text: string): boolean {
  const grossProfitIas = /br[uü]t\s+k[aâ]r.*IAS\s*29|IAS\s*29.*br[uü]t\s+k[aâ]r/i.test(text);
  const grossMarginIas = /br[uü]t\s+marj.*IAS\s*29|IAS\s*29.*br[uü]t\s+marj/i.test(text);
  const monetary = /parasal\s+(kay[ıi]p|kazan[çc])|monetary\s+(gain|loss)|net\s+parasal\s+pozisyon/i.test(text);
  return grossProfitIas && grossMarginIas && monetary;
}

export type ShadowValidationResult = {
  violations: Violation[];
};

export function shadowValidate(
  agentId: string,
  output: string,
  ctx: {
    sessionId: string;
    ticker: string | null;
    runtimeMode: string | null;
  },
): ShadowValidationResult {
  if (!output || output.length < 20) return { violations: [] };
  const violations: Violation[] = [];

  try {
    if (agentId === 'financial_analysis') {
      validateFinancialAnalysisOutput(output, violations);
    }
    if (agentId === 'qa_review') {
      validateQaReviewOutput(output, violations);
    }
    // Phase 4A: any agent output that carries findings[]/addressed_findings[]
    // gets the intra-doc consistency check.
    const docForFindings = extractJsonBlock(output);
    if (docForFindings) {
      validateFindingsBlock(docForFindings, violations);
    }

    // Cross-agent heuristics:
    if (ias29PeriodLikelyApplies(output) && !ias29TrioPresent(output)) {
      violations.push({
        rule: 'IAS29-001_trio_missing',
        detail: 'IAS 29 period implied but MM-04/05/06 trio not all present',
      });
    }
    if (roeMentioned(output) && !coeMentioned(output)) {
      violations.push({
        rule: 'MM-25_roe_without_coe',
        detail: 'ROE mentioned without Cost of Equity comparison',
      });
    }
  } catch (err) {
    // Shadow validator must never break the caller.
    violations.push({
      rule: 'shadow_validator_internal_error',
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  recordSchemaShadowObservation({
    sessionId: ctx.sessionId,
    ticker: ctx.ticker,
    runtimeMode: ctx.runtimeMode,
    agentId,
    violationCount: violations.length,
    violations,
  });

  return { violations };
}
