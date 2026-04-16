/**
 * Compose the deterministic template context from accumulatedContext.
 *
 * Reads the upstream Python-adapter outputs (or their LLM
 * equivalents, parsed leniently) and emits a flat object the
 * template engine can render directly. Narrative blocks are
 * auto-extracted from upstream LLM agent outputs (final_summary,
 * strategic_synthesis, valuation_agent, context_extraction) by
 * llm_narrative.ts — section-anchor slicing, no additional LLM
 * calls. If caller supplies `narrativeBlocks` explicitly, those
 * win.
 */

import { buildNarrativeBlocks } from './llm_narrative.js';
import { formatPct, formatRatio, formatTRY, type TemplateContext } from './template_engine.js';


function parseJson<T = unknown>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
  return null;
}


interface ComposeInputs {
  ticker: string;
  reportId: string;
  accumulatedContext: Record<string, unknown>;
  // Optional pre-rendered LLM narrative blocks. Keys:
  // 'card_summary', 'financial_intro', 'valuation', 'closing'.
  narrativeBlocks?: Record<string, string>;
}


export function composeReportContext(inputs: ComposeInputs): TemplateContext {
  const { ticker, reportId, accumulatedContext, narrativeBlocks: explicitBlocks } = inputs;
  const ctx = accumulatedContext;

  // Auto-extract narrative blocks from upstream LLM agent outputs.
  // Explicit blocks passed by caller (rare — mostly tests) override.
  const extracted = buildNarrativeBlocks({
    final_summary: ctx['final_summary_output'],
    strategic_synthesis: ctx['strategic_synthesis_output'],
    valuation_agent: ctx['valuation_agent_output'],
    context_extraction: ctx['context_extraction_output'],
    ceo: ctx['ceo_output'],
  });
  const narrativeBlocks = { ...extracted, ...(explicitBlocks ?? {}) };

  const fa = parseJson<{
    ticker?: string;
    period_label?: string;
    sector?: string;
    highlights?: Array<{ code: string; label?: string; value?: number | string | null; unit?: string; narrative_hint?: string | null }>;
    metrics?: Array<{ code: string; label?: string; value?: number | string | null; unit?: string; narrative_hint?: string | null }>;
    red_flags?: Array<{ code: string; severity: string; message?: string }>;
    engine_snapshot?: { dcf?: Record<string, unknown> | null } | null;
  }>(ctx['financial_analysis_output']);

  const rec = parseJson<{
    check_results?: Array<{ passed: boolean }>;
    checks?: Array<{ passed: boolean }>;
    passed_count?: number;
    check_count?: number;
    pass_rate?: number;
  }>(ctx['reconciliation_output']);

  const qa = parseJson<{
    overall_score?: number;
    qa_decision?: string;
    quality_flags?: string[];
    dimension_scores?: Array<{ code: string; score: number; evidence: string }>;
  }>(ctx['qa_review_output']);

  const ss = parseJson<{
    convergence_score?: number;
    confidence?: string;
    signals?: { positive?: unknown[]; negative?: unknown[]; neutral?: unknown[] };
    divergences?: string[];
  }>(ctx['strategic_synthesis_output']);

  const val = parseJson<{
    dcf?: {
      enterprise_value?: number | null;
      equity_value?: number | null;
      per_share_value?: number | null;
      wacc_used?: number | null;
      terminal_growth?: number | null;
    } | null;
    try_wacc_warning?: boolean;
    holding_sotp_required?: boolean;
    banking_sector_warning?: boolean;
    notes?: string[];
  }>(ctx['valuation_agent_output']);

  const sc = parseJson<{
    benchmarks?: Array<{
      metric_code: string;
      label: string;
      company_value: number | null;
      min_value: number | null;
      median: number | null;
      max_value: number | null;
      quartile: number | null;
      higher_is_better: boolean;
    }>;
  }>(ctx['sector_competition_output']);

  const ev = parseJson<{
    event_impacts?: Array<{
      event_type: string;
      event_summary: string;
      impact_direction: string;
      timing_horizon: string;
    }>;
  }>(ctx['event_impact_mapper_output']);

  // ----- Section 1: card -----

  const highlights = (fa?.highlights ?? fa?.metrics ?? []).slice(0, 8).map(h => ({
    label: h.label ?? h.code,
    value_formatted: formatValueByCode(h.code, h.value),
    narrative_hint: h.narrative_hint ?? '',
  }));

  const criticalFindings: string[] = [
    ...(fa?.red_flags ?? []).filter(f => (f.severity ?? '').toLowerCase() === 'critical').map(f => f.message ?? f.code),
    ...((ss?.divergences) ?? []),
    ...((qa?.quality_flags) ?? []).slice(0, 3),
  ].slice(0, 6);

  const recChecks = rec?.checks ?? rec?.check_results ?? [];
  const recTotal = rec?.check_count ?? recChecks.length;
  const recPassed = rec?.passed_count ?? recChecks.filter(c => c.passed).length;
  const recPassRate = recTotal > 0 ? (recPassed / recTotal) : 0;

  // ----- Section 3: valuation -----

  const dcf = val?.dcf ?? null;
  const dcfPresent = !!dcf && dcf.per_share_value != null;

  // ----- Section 4: benchmarks -----

  const benchmarks = (sc?.benchmarks ?? []).filter(b => b.company_value != null).map(b => ({
    label: b.label,
    company_formatted: formatValueByCode(b.metric_code, b.company_value),
    median_formatted:  formatValueByCode(b.metric_code, b.median),
    range_formatted: b.min_value != null && b.max_value != null
      ? `${formatValueByCode(b.metric_code, b.min_value)} – ${formatValueByCode(b.metric_code, b.max_value)}`
      : '—',
    quartile: b.quartile ?? '—',
  }));

  // ----- Section 5: events -----

  const eventImpacts = (ev?.event_impacts ?? []).slice(0, 8).map(e => ({
    summary: e.event_summary,
    type: e.event_type,
    direction: e.impact_direction,
    timing: e.timing_horizon,
  }));

  // ----- Assemble -----

  return {
    ticker: ticker.toUpperCase(),
    company_name: (fa?.ticker ?? ticker).toUpperCase(),
    sector_label: fa?.sector ?? 'industrial',
    period_label: fa?.period_label ?? '—',
    report_date: new Date().toISOString().slice(0, 10),
    report_id: reportId,
    engine_source: 'financial_engine + adapters',

    qa_score: qa?.overall_score != null ? qa.overall_score.toFixed(2) : '—',
    qa_decision_label: qa?.qa_decision ?? '—',

    convergence_score: ss?.convergence_score != null ? (ss.convergence_score > 0 ? '+' : '') + ss.convergence_score.toFixed(2) : '—',
    signal_confidence: ss?.confidence ?? '—',

    reconciliation_pass_rate: recTotal > 0 ? `%${Math.round(recPassRate * 100)}` : '—',
    reconciliation_passed: recPassed,
    reconciliation_total: recTotal,

    critical_findings: criticalFindings,

    narrative_card_summary:    narrativeBlocks.card_summary    ?? '',
    narrative_financial_intro: narrativeBlocks.financial_intro ?? '',
    narrative_valuation:       narrativeBlocks.valuation       ?? '',
    narrative_closing:         narrativeBlocks.closing         ?? '',

    highlights,

    valuation_warnings: [
      ...(val?.try_wacc_warning ? ['TRY WACC tuzağı: USD bazlı WACC kullanılmalı'] : []),
      ...(val?.holding_sotp_required ? ['Holding — SOTP analizi zorunlu, konsolide DCF üst sınır'] : []),
      ...(val?.banking_sector_warning ? ['Banka filer — FCF-DCF uygulanabilir değil'] : []),
      ...(val?.notes ?? []),
    ],

    dcf_present: dcfPresent,
    dcf_ev_formatted:          dcf?.enterprise_value != null ? formatTRY(dcf.enterprise_value) + ' mn TL' : '—',
    dcf_equity_formatted:      dcf?.equity_value != null ? formatTRY(dcf.equity_value) + ' mn TL' : '—',
    dcf_per_share_formatted:   dcf?.per_share_value != null ? formatTRY(dcf.per_share_value, 2) + ' TL' : '—',
    dcf_wacc_formatted:        dcf?.wacc_used != null ? formatPct(Number(dcf.wacc_used) * 100) : '—',
    dcf_terminal_g_formatted:  dcf?.terminal_growth != null ? formatPct(Number(dcf.terminal_growth) * 100) : '—',

    benchmarks,
    event_impacts: eventImpacts,
  };
}


function formatValueByCode(code: string, value: number | string | null | undefined): string {
  const lower = code.toLowerCase();
  if (lower.includes('margin') || lower.includes('roe') || lower.includes('roa') ||
      lower.includes('roce') || lower === 'nim' || lower.includes('cost_to_income') ||
      lower.includes('nii_burden')) {
    return formatPct(value, 1);
  }
  if (lower.includes('ratio') || lower.includes('debt_to') || lower.includes('altman') ||
      lower.includes('piotroski')) {
    return formatRatio(value, 2);
  }
  if (lower === 'ccc' || lower === 'dso' || lower === 'dio' || lower === 'dpo') {
    if (value == null) return '—';
    return `${value} gün`;
  }
  return formatTRY(value, 0);
}
