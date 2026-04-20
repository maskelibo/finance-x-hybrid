/**
 * Schema shadow validator — Phase 3A observe-only.
 *
 * Runs the canonical depth rules (from canonical/rules/mandatory_metrics.yaml)
 * against an agent output WITHOUT influencing the pipeline. Violations are
 * recorded via gate-observer.recordSchemaShadowObservation() so Phase 3B can
 * make a data-informed decision about flipping to hard enforcement.
 *
 * Intentionally minimal: this is not the final hardening. It looks for the
 * most concrete, measurable contract breaches:
 *
 *   - Interpretation fields shorter than canonical minLength floors
 *     (observation ≥ 80, reasoning ≥ 120, counterargument ≥ 60, implication ≥ 80)
 *   - Fewer than 28 items in metrics_array (financial_analysis only)
 *   - engine_snapshot keys not subset of metrics_array keys (OI-002)
 *   - Missing IAS 29 trio for IAS-29 periods (approx heuristic: if IAS29 text
 *     appears in the output but MM-04/05/06 are absent)
 *   - Missing CoE comparison on ROE mentions (MM-25 interpretation requirement)
 *
 * Called from agent-runner.ts AFTER the authoritative validator
 * (schema-validator.ts) finishes. Errors here never propagate.
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

export function shadowValidate(
  agentId: string,
  output: string,
  ctx: {
    sessionId: string;
    ticker: string | null;
    runtimeMode: string | null;
  },
): void {
  if (!output || output.length < 20) return;
  const violations: Violation[] = [];

  try {
    if (agentId === 'financial_analysis') {
      validateFinancialAnalysisOutput(output, violations);
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
}
