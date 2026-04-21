/**
 * Validation gate — Phase 4A observe-only scaffold.
 *
 * Classifies schema-shadow-validator violations into the 4-category taxonomy
 * defined in refactor/reports/CLAUDE_MASTER_PROMPT.md §6.5:
 *
 *   1. missing_metric          — mandatory metric absent / malformed
 *   2. unaddressed_finding     — downstream didn't cover an upstream QA finding
 *   3. shallow_interpretation  — depth floor breached (observation/reasoning/…)
 *   4. broken_structure        — parse failure, invalid enum, ref mismatch, etc.
 *
 * Phase 4A contract (STRICT):
 *   - Never throws. Swallows all errors.
 *   - Never retries, never routes, never mutates accumulatedContext.
 *   - Writes one row to agent_runs (validation_category + details) per call.
 *   - If the phase4 migration hasn't been applied, the update is a no-op.
 *
 * Later phases (4B shadow-warn, 4C retry routing) build ON this classifier
 * without changing its signature. The 4-category taxonomy is the canonical
 * vocabulary the rest of the refactor plan leans on — keep it stable.
 */

import { db } from './db.js';

/**
 * Mirror of the progressive JSON extraction used by compose.ts / orchestrator
 * QA routing / schema-shadow-validator. Kept local to avoid cross-module
 * refactor scope in Phase 4A; when Phase 5 introduces a manifest layer the
 * helper moves to a shared module.
 */
function extractJsonFromAgentOutput(raw: unknown): unknown | null {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;
  const text = raw;
  try { return JSON.parse(text); } catch { /* fall through */ }
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()); } catch { /* fall through */ }
  }
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

export type ValidationCategory =
  | 'missing_metric'
  | 'unaddressed_finding'
  | 'shallow_interpretation'
  | 'broken_structure';

export type ShadowViolation = {
  rule: string;
  path?: string;
  detail?: string;
};

export type ClassifiedViolation = ShadowViolation & { category: ValidationCategory };

const RULE_TO_CATEGORY: Record<string, ValidationCategory> = {
  // missing_metric
  metrics_array_size: 'missing_metric',
  metrics_array_item_malformed: 'missing_metric',

  // shallow_interpretation
  interpretation_depth: 'shallow_interpretation',
  addressed_finding_shallow: 'shallow_interpretation',
  qa_overall_score_missing: 'shallow_interpretation',

  // unaddressed_finding
  addressed_findings_set_mismatch: 'unaddressed_finding',
  upstream_finding_not_addressed: 'unaddressed_finding',

  // broken_structure
  json_block_missing: 'broken_structure',
  'OI-002_engine_snapshot_subset': 'broken_structure',
  'IAS29-001_trio_missing': 'broken_structure',
  'MM-25_roe_without_coe': 'broken_structure',
  shadow_validator_internal_error: 'broken_structure',
  'OI-007_canvas_forbidden': 'broken_structure',
  'OI-007_chartjs_reference': 'broken_structure',
  'OI-007_external_script': 'broken_structure',
  'OI-003_section_count_below_minimum': 'broken_structure',
  'OI-008_emoji_in_institutional_output': 'broken_structure',
};

export function classifyViolation(rule: string): ValidationCategory {
  return RULE_TO_CATEGORY[rule] ?? 'broken_structure';
}

export function classifyAll(violations: ShadowViolation[]): ClassifiedViolation[] {
  return violations.map((v) => ({ ...v, category: classifyViolation(v.rule) }));
}

/**
 * Cross-agent acknowledgement check. Called by validateAgentRun when the
 * running agent is a revision target AFTER qa_review has produced findings.
 * Reads the latest qa_review output for the session, extracts quality_flags[],
 * matches against the current agent's addressed_findings[]. Any unaddressed
 * flag becomes an `upstream_finding_not_addressed` violation.
 *
 * Phase 4A observes only — the orchestrator doesn't act on the result.
 */
export function crossAgentAcknowledgement(args: {
  sessionId: string;
  agentId: string;
  currentOutput: string;
}): ShadowViolation[] {
  const violations: ShadowViolation[] = [];
  try {
    const qaRow = db
      .prepare(
        `SELECT output_text FROM agent_runs
          WHERE session_id = ? AND agent_id = 'qa_review' AND status = 'completed'
          ORDER BY completed_at DESC LIMIT 1`,
      )
      .get(args.sessionId) as { output_text: string | null } | undefined;
    if (!qaRow?.output_text) return violations;

    const qaDoc = extractJsonFromAgentOutput(qaRow.output_text);
    if (!qaDoc || typeof qaDoc !== 'object' || Array.isArray(qaDoc)) return violations;
    const flags = (qaDoc as Record<string, unknown>)['quality_flags'];
    if (!Array.isArray(flags)) return violations;

    // A flag targets this agent if its `agent`/`agent_id`/`target_agent` field
    // matches. Without routing hints we can't attribute, so skip those.
    const targeted = flags.filter((f) => {
      if (!f || typeof f !== 'object') return false;
      const rec = f as Record<string, unknown>;
      const target = rec['agent'] ?? rec['agent_id'] ?? rec['target_agent'];
      return typeof target === 'string' && target === args.agentId;
    });
    if (targeted.length === 0) return violations;

    const flagIds = targeted
      .map((f) => {
        const rec = f as Record<string, unknown>;
        const id = rec['finding_id'] ?? rec['flag_id'] ?? rec['id'];
        return typeof id === 'string' ? id : null;
      })
      .filter((id): id is string => id !== null);
    if (flagIds.length === 0) return violations;

    const currentDoc = extractJsonFromAgentOutput(args.currentOutput);
    const addressed = currentDoc && typeof currentDoc === 'object' && !Array.isArray(currentDoc)
      ? (currentDoc as Record<string, unknown>)['addressed_findings']
      : undefined;
    const addressedIds = new Set<string>();
    if (Array.isArray(addressed)) {
      addressed.forEach((a) => {
        if (!a || typeof a !== 'object') return;
        const rec = a as Record<string, unknown>;
        const id = rec['finding_id'];
        if (typeof id === 'string') addressedIds.add(id);
      });
    }

    for (const fid of flagIds) {
      if (!addressedIds.has(fid)) {
        violations.push({
          rule: 'upstream_finding_not_addressed',
          path: `addressed_findings (missing ${fid})`,
          detail: `qa_review flag ${fid} not in current output's addressed_findings[]`,
        });
      }
    }
  } catch (err) {
    // Never break the pipeline.
    violations.push({
      rule: 'shadow_validator_internal_error',
      detail: `crossAgentAcknowledgement: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
  return violations;
}

/**
 * Writes a category summary onto the current agent_runs row so dashboards
 * and analyses can GROUP BY category/agent without re-parsing detail JSON.
 * Silent no-op if the phase4 migration hasn't been applied yet.
 */
export function recordValidationCategories(args: {
  sessionId: string;
  agentId: string;
  classified: ClassifiedViolation[];
}): void {
  const { sessionId, agentId, classified } = args;
  const countsByCategory: Record<ValidationCategory, number> = {
    missing_metric: 0,
    unaddressed_finding: 0,
    shallow_interpretation: 0,
    broken_structure: 0,
  };
  for (const v of classified) countsByCategory[v.category]++;

  const worst = classified.length === 0
    ? null
    : (['broken_structure', 'missing_metric', 'unaddressed_finding', 'shallow_interpretation'] as ValidationCategory[])
        .find((c) => countsByCategory[c] > 0) ?? 'broken_structure';

  try {
    db.prepare(
      `UPDATE agent_runs
          SET validation_category = ?,
              validation_category_details_json = ?
        WHERE session_id = ? AND agent_id = ?`,
    ).run(
      worst,
      JSON.stringify({
        counts: countsByCategory,
        top: classified.slice(0, 20),
      }).slice(0, 8000),
      sessionId,
      agentId,
    );
  } catch {
    // Migration not applied or row not present yet — silent.
  }
}

/**
 * Orchestrator entry point. Combines:
 *   1. Shadow-validator violations (passed in by caller — we don't rerun)
 *   2. Cross-agent acknowledgement check (read-only from db)
 *   3. Category classification + persisted summary
 *
 * Returns the classified list for any caller that wants to log or surface it;
 * callers MUST NOT use the return value to mutate control flow in Phase 4A.
 */
export function classifyAndRecord(args: {
  sessionId: string;
  agentId: string;
  ticker: string | null;
  runtimeMode: string | null;
  shadowViolations: ShadowViolation[];
  currentOutput: string;
}): ClassifiedViolation[] {
  const cross = crossAgentAcknowledgement({
    sessionId: args.sessionId,
    agentId: args.agentId,
    currentOutput: args.currentOutput,
  });
  const combined = classifyAll([...args.shadowViolations, ...cross]);
  recordValidationCategories({
    sessionId: args.sessionId,
    agentId: args.agentId,
    classified: combined,
  });
  return combined;
}
