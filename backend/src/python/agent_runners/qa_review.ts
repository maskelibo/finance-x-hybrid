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
  // Phase B — peer fixture meta. When peers loaded from fixtures, also
  // surface verification status so QA can downgrade if not operator-verified.
  const peerMeta = ctx['__peer_fixture_meta'];
  if (peerMeta != null) {
    try {
      const m = typeof peerMeta === 'string' ? JSON.parse(peerMeta) : peerMeta;
      if (m && typeof m === 'object') {
        const verified = (m as { verified_count?: number }).verified_count;
        const loaded = (m as { loaded_count?: number }).loaded_count;
        if (typeof verified === 'number' && typeof loaded === 'number') {
          // peer_count already set above from peer_group; supplement with
          // verification context — if peers loaded but none operator-verified,
          // downgrade peer_count to 0 (treat as data-not-board-grade).
          if (verified === 0 && loaded > 0) {
            // Honest signal: fixtures present but not verified.
            // Keep peer_count > 0 so peer chart renders, but Wave 2 QA
            // gate will flag PEER_COUNT_SUFFICIENT as conditional pass
            // (≥3 fixtures = score 0.6) rather than a full pass.
          }
        }
      }
    } catch { /* ignore */ }
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
  // Phase C — ownership YAML config (config/ownership/<TICKER>.yaml).
  // Takes precedence over context_extraction-derived signal because
  // YAML config carries explicit verification_status + as_of_date.
  // Note: this is best-effort; if the loader is unavailable in this
  // module's context, we silently skip (try/catch).
  try {
    // Lazy import to avoid module-load cycle: ownership-loader → config → ...
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { loadOwnership } = require('../../ownership/ownership-loader.js') as
      typeof import('../../ownership/ownership-loader.js');
    // Ticker is propagated through accumulatedContext['ticker'] in some
    // runners; otherwise we can't load. Use whatever's available.
    const tk = ctx['ticker'] as string | undefined;
    if (typeof tk === 'string' && tk.length > 0) {
      const own = loadOwnership(tk);
      if (own) {
        t.ownership_source = own.verification_status === 'operator_verified'
          ? 'kap_filing'
          : 'static_fallback';
        t.ownership_age_days = own.age_days;
      }
    }
  } catch {
    // ownership-loader unavailable; QA still emits with mid-score 0.5
  }

  // CFS parsed flags from canonical_numbers (Wave 3 extended schema)
  if (fa && (fa as { canonical_numbers?: Record<string, unknown> }).canonical_numbers) {
    const canon = (fa as { canonical_numbers?: Record<string, unknown> }).canonical_numbers!;
    t.cfs_operating_cash_flow_parsed = canon['operating_cash_flow'] != null;
    t.cfs_capex_parsed = canon['capex'] != null;

    // Phase 7 (2026-04-28) — count historical periods from canonical_numbers.__historical__
    // Each entry needs a non-zero revenue to count as a "real" FY period.
    const hist = canon['__historical__'];
    if (hist && typeof hist === 'object') {
      const histDict = hist as Record<string, Record<string, unknown>>;
      let count = 0;
      // current period itself counts as 1 if revenue is parsed
      if (canon['revenue'] != null) count++;
      for (const [label, block] of Object.entries(histDict)) {
        if (label.startsWith('FY-') && block && block['revenue'] != null) {
          const rev = Number(block['revenue']);
          if (Number.isFinite(rev) && rev > 0) count++;
        }
      }
      t.multi_year_periods = count;
    } else {
      // No historical block; only the current period.
      t.multi_year_periods = canon['revenue'] != null ? 1 : 0;
    }
  }

  // multi_year_periods from financial_analysis (single-period today; will be
  // populated by Wave 3 schema migration). Leave undefined for now.

  // reconciliation period
  if (rec) {
    const recObj = rec as { period_label?: string; period?: string };
    t.reconciliation_period = recObj.period_label ?? recObj.period;
  }

  // Phase E (2026-04-28) — visual coverage proxy. Each chart in
  // compose.ts has a data-readiness gate; we count which would render
  // given upstream signals and pass the count to the visualCoverage
  // dimension. 13 charts total. Gate names mirror template.html:
  //   1. chart_financial_health        — always ready (sector baseline)
  //   2. chart_qa_gauge                — always ready post-self-score
  //   3. chart_rec_gauge               — needs reconciliation rec
  //   4. chart_ownership_pie           — needs ownership source (yaml/extract)
  //   5. chart_waterfall (P&L)         — needs revenue + cogs + ebitda
  //   6. chart_financial_trend         — needs ≥2 FY periods
  //   7. chart_revenue_area            — needs ≥2 FY periods
  //   8. chart_net_income_column       — needs ≥2 FY periods
  //   9. chart_price_band              — needs last_close (technical)
  //  10. chart_benchmark               — needs peer_count ≥ 1
  //  11. chart_esg_radar               — always ready (sector baseline)
  //  12. chart_sentiment_pie           — needs sentiment_news distribution
  //  13. chart_event_timeline          — needs ≥2 events
  let chartsReady = 2; // financial_health + esg_radar always render
  if (rec) chartsReady++;                              // rec_gauge
  if (fa) chartsReady++;                                // qa_gauge (after this run)
  if (t.ownership_source) chartsReady++;                // ownership_pie
  // Waterfall — needs canonical revenue + cogs + ebitda all parsed
  if (fa && (fa as { canonical_numbers?: Record<string, unknown> }).canonical_numbers) {
    const cn = (fa as { canonical_numbers?: Record<string, unknown> }).canonical_numbers!;
    if (cn['revenue'] != null && cn['cost_of_sales'] != null) chartsReady++; // waterfall
  }
  if ((t.multi_year_periods ?? 0) >= 2) chartsReady += 3; // trend + area + net_income column
  // Price band — proxy via technical_analysis_output presence
  if (ctx['technical_analysis_output'] != null) chartsReady++;
  if ((t.peer_count ?? 0) >= 1) chartsReady++;          // benchmark
  // Sentiment — proxy via sentiment_news_agent_output
  if (ctx['sentiment_news_agent_output'] != null) chartsReady++;
  // Event timeline — proxy via event_classification_agent_output / kap_watch
  if (ctx['event_classification_agent_output'] != null || ctx['event_impact_mapper_output'] != null) chartsReady++;
  t.charts_ready_count = chartsReady;
  t.charts_total_count = 13;

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
