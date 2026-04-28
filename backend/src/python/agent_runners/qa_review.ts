import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import {
  adaptQaReviewForLegacy,
  extractFinancialAnalysis,
  extractReconciliation,
  type QaTruthContext,
} from '../adapters/qa_review.js';

/**
 * Wave 2 — extract truth context from accumulatedContext upstream
 * outputs. Best-effort; fields default to undefined when not derivable
 * (qa adapter then assigns mid-score 0.5).
 */
function buildQaTruthContext(
  ctx: Record<string, unknown>,
  fa: ReturnType<typeof extractFinancialAnalysis>,
  rec: ReturnType<typeof extractReconciliation>,
): QaTruthContext {
  const t: QaTruthContext = {};

  // peer_count from sector_competition_output
  const sc = ctx['sector_competition_output'];
  if (sc != null) {
    let scObj: Record<string, unknown> | null = null;
    try {
      scObj = typeof sc === 'string' ? JSON.parse(sc) : (sc as Record<string, unknown>);
    } catch { scObj = null; }
    const peers = scObj?.['peer_group'];
    if (Array.isArray(peers)) t.peer_count = peers.length;
  }

  // ownership from context_extraction_output.company_profile
  const ce = ctx['context_extraction_output'];
  if (ce != null) {
    let ceObj: Record<string, unknown> | null = null;
    try {
      ceObj = typeof ce === 'string' ? JSON.parse(ce) : (ce as Record<string, unknown>);
    } catch { ceObj = null; }
    const profile = ceObj?.['company_profile'] as Record<string, unknown> | undefined;
    if (profile && Array.isArray(profile['shareholder_structure'])) {
      // context_extraction extracted ownership → freshness reasonable
      t.ownership_source = 'context_extraction';
      // Age unknown for now; leave undefined (adapter accepts <=90 default)
    }
  }

  // CFS parsed flags from canonical_numbers
  if (fa && (fa as { canonical_numbers?: Record<string, unknown> }).canonical_numbers) {
    const canon = (fa as { canonical_numbers?: Record<string, unknown> }).canonical_numbers!;
    t.cfs_operating_cash_flow_parsed = canon['operating_cash_flow'] != null;
    t.cfs_capex_parsed = canon['capex'] != null;
  }

  // multi_year_periods from financial_analysis (single-period today; will be
  // populated by Wave 3 schema migration). Leave undefined for now.

  // reconciliation period
  if (rec) {
    const recObj = rec as { period_label?: string; period?: string };
    t.reconciliation_period = recObj.period_label ?? recObj.period;
  }

  // sanitizer counts (if a hygiene_sanitizer_report was injected)
  const san = ctx['hygiene_sanitizer_report'];
  if (san != null) {
    let sanObj: Record<string, unknown> | null = null;
    try {
      sanObj = typeof san === 'string' ? JSON.parse(san) : (san as Record<string, unknown>);
    } catch { sanObj = null; }
    const residue = sanObj?.['english_residue_remaining'];
    if (typeof residue === 'number') t.english_residue_count = residue;
    // estimate_judgment_rewrites — exposed by Wave 1 sanitizer warning text
    const warnings = sanObj?.['warnings'];
    if (Array.isArray(warnings)) {
      const m = warnings.find((w) => typeof w === 'string' && (w as string).startsWith('no_estimate_judgment_rewritten:'));
      if (typeof m === 'string') {
        const num = m.match(/no_estimate_judgment_rewritten:\s*(\d+)/);
        if (num) t.estimate_judgment_rewrites = Number(num[1]);
      }
    }
  }

  return t;
}

export type RunOutcome = 'ok' | 'failed';

export async function runPythonQaReview(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<RunOutcome> {
  const startedAt = new Date().toISOString();
  const startedAtMs = Date.now();
  db.prepare(
    `UPDATE agent_runs SET status = 'running', started_at = ?, error_message = NULL, provider_used = 'python' WHERE id = ?`,
  ).run(startedAt, runId);

  const faRaw = accumulatedContext['financial_analysis_output'];
  const fa = extractFinancialAnalysis(faRaw);
  const rec = extractReconciliation(accumulatedContext['reconciliation_output']);

  const llmMarkdownSource = typeof faRaw === 'string' ? faRaw : null;

  // Wave 2 (2026-04-28) — best-effort truth context extraction.
  // Each field is optional; adapter falls back to mid-score (0.5) for
  // missing dimensions so legacy callers don't spuriously hard-fail.
  const truthContext = buildQaTruthContext(accumulatedContext, fa, rec);

  const legacy = adaptQaReviewForLegacy(fa, rec, ticker, `qa-out-${nanoid()}`, {
    llmMarkdownSource,
    truthContext,
  });
  const outputJson = JSON.stringify(legacy, null, 2);

  // Soft-fail on upstream gap. The legacy output still encodes the
  // qa_decision ('fail' on null fa) so governance can pick up the
  // signal deterministically — we don't need to also mark the
  // agent_run itself failed.
  const completedAt = new Date().toISOString();
  db.prepare(
    `UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
     output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = NULL,
     provider_used = 'python' WHERE id = ?`,
  ).run(
    completedAt,
    Date.now() - startedAtMs,
    outputJson,
    `python:qa_review rubric score (fa=${fa ? 'ok' : 'missing'}, rec=${rec ? 'ok' : 'missing'})`,
    runId,
  );

  accumulatedContext['qa_review_output'] = outputJson;
  console.log(
    `[PYTHON:qa_review] ok decision=${legacy.qa_decision} overall=${legacy.overall_score} flags=${legacy.quality_flags.length}`,
  );
  return 'ok';
}
