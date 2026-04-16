/**
 * valuation adapter — hybrid runner.
 *
 * Ported from python-services/src/financex/calculators/valuation.py.
 * The DCF arithmetic itself already runs inside financial_engine
 * when valuation_inputs are supplied there; this adapter reshapes
 * whatever the engine produced (dcf block inside engine_snapshot),
 * layers peer multiple stats from sector_competition output, and
 * adds the three sector hint flags (TRY WACC warning, holding SOTP
 * required, banking FCF-DCF incompatible).
 *
 * Bull/Base/Bear narrative, SOTP composition, WACC policy choice,
 * scenario weighting, sensitivity matrix narration — all stay with
 * the LLM. This is the numeric skeleton only.
 *
 * When upstream financial_analysis is LLM markdown (mixed-flag mode),
 * we fall back to llm_fallback.resolveSector() to still get the
 * sector-aware flags right.
 */

import { resolveSector } from './llm_fallback.js';

export interface UpstreamRatioValue {
  value?: string | number | null;
  label?: string | null;
  warning?: string | null;
}

export interface UpstreamDcfResult {
  enterprise_value?: string | number | null;
  equity_value?: string | number | null;
  per_share_value?: string | number | null;
  wacc_used?: string | number | null;
  terminal_growth?: string | number | null;
  sensitivity?: Array<{ wacc?: unknown; terminal_g?: unknown; per_share?: unknown }>;
}

export interface UpstreamEngineSnapshot {
  dcf?: UpstreamDcfResult | null;
  ratios?: unknown;
  scores?: unknown;
}

export interface UpstreamFinancialAnalysis {
  ticker?: string;
  period_label?: string;
  sector?: string;
  engine_snapshot?: UpstreamEngineSnapshot | null;
  engine?: UpstreamEngineSnapshot | null;
}

export interface UpstreamSectorCompetition {
  benchmarks?: Array<{
    metric_code: string;
    company_value?: number | null;
    median?: number | null;
    q1?: number | null;
    q3?: number | null;
  }>;
}


export interface PeerMultipleStats {
  metric: string;
  count: number;
  median: number | null;
  q1: number | null;
  q3: number | null;
  company_value: number | null;
  company_vs_median: number | null;
}


export interface LegacyValuationOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  period_label: string;
  sector: string;
  dcf: UpstreamDcfResult | null;
  peer_ev_ebitda: PeerMultipleStats | null;
  peer_pe: PeerMultipleStats | null;
  try_wacc_warning: boolean;
  holding_sotp_required: boolean;
  banking_sector_warning: boolean;
  sector_source: 'structured' | 'markdown' | 'ticker';
  notes: string[];
  warnings: string[];
  review_status: string;
  source: 'python';
}


function unwrap<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
  return typeof raw === 'object' ? (raw as T) : null;
}


export function extractFinancialAnalysis(raw: unknown): UpstreamFinancialAnalysis | null {
  return unwrap<UpstreamFinancialAnalysis>(raw);
}


export function extractSectorCompetition(raw: unknown): UpstreamSectorCompetition | null {
  return unwrap<UpstreamSectorCompetition>(raw);
}


function parseNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
}


function peerMultipleFromBenchmark(
  sc: UpstreamSectorCompetition | null,
  metricCode: string,
): PeerMultipleStats | null {
  if (!sc?.benchmarks) return null;
  const b = sc.benchmarks.find(x => x.metric_code === metricCode);
  if (!b) return null;
  const median = b.median ?? null;
  const cv = b.company_value ?? null;
  const vsMedian = (cv != null && median != null && median !== 0)
    ? Math.round(((cv / median) - 1) * 10000) / 10000
    : null;
  return {
    metric: metricCode,
    count: b.company_value != null ? 1 : 0,
    median,
    q1: b.q1 ?? null,
    q3: b.q3 ?? null,
    company_value: cv,
    company_vs_median: vsMedian,
  };
}


export function adaptValuationForLegacy(
  fa: UpstreamFinancialAnalysis | null,
  sc: UpstreamSectorCompetition | null,
  ticker: string,
  outputId: string,
  opts: { llmMarkdownSource?: string | null } = {},
): LegacyValuationOutput {
  const warnings: string[] = [];
  if (!fa) {
    warnings.push('No financial_analysis output — valuation cannot pull engine DCF');
  }

  // Sector resolution: structured first, then LLM markdown cues, then
  // ticker heuristic. Mixed-flag mode (valuation Python + fa LLM)
  // leaves fa=null here; we still want banking/holding warnings to
  // fire so the LLM doesn't produce an FCF-DCF on a bank.
  const sectorResolution = resolveSector({
    structuredSector: fa?.sector ?? null,
    markdownSource: opts.llmMarkdownSource ?? null,
    ticker,
  });
  const sector = sectorResolution.sector;
  if (sectorResolution.source !== 'structured') {
    warnings.push(`Sector inferred via ${sectorResolution.source} fallback → ${sector}; LLM should verify.`);
  }
  const engine = fa?.engine_snapshot ?? fa?.engine ?? null;
  const dcf = engine?.dcf ?? null;

  const notes: string[] = [];
  let tryWacc = false;
  let holdingSotp = false;
  let bankingWarn = false;

  // TRY WACC trap — engine emits wacc_used as a decimal (0.32 = 32%);
  // anything above 25% looks like a TRY rate and the DCF will be
  // suppressed to near-zero. Warn and recommend USD WACC.
  if (dcf?.wacc_used != null) {
    const w = parseNumber(dcf.wacc_used);
    if (w != null && w > 0.25) {
      tryWacc = true;
      notes.push(`WACC used ${w.toFixed(3)} looks like a TRY rate. Prefer USD WACC for Turkish filers — TRY WACC trap collapses DCF.`);
    }
  }

  if (sector === 'holding') {
    holdingSotp = true;
    notes.push('Holding filer — consolidated DCF is an upper bound only. SOTP table required for real fair value.');
  }

  if (sector === 'banking') {
    bankingWarn = true;
    notes.push('Banking filer — FCF-based DCF not applicable. Prefer excess return / DDM. Engine DCF (if any) should be ignored.');
  }

  if (!dcf) {
    warnings.push('No engine DCF in upstream — LLM layer must run the DCF itself or supply valuation_inputs to the engine.');
  }

  const peerEvEbitda = peerMultipleFromBenchmark(sc, 'EBITDA_MARGIN');
  const peerPe       = peerMultipleFromBenchmark(sc, 'NET_MARGIN');

  return {
    agent_id: 'valuation_agent',
    output_id: outputId,
    ticker: (fa?.ticker ?? ticker).toUpperCase(),
    period_label: fa?.period_label ?? 'unknown',
    sector,
    dcf: bankingWarn ? null : dcf,  // refuse to surface an FCF-DCF on a bank
    peer_ev_ebitda: peerEvEbitda,
    peer_pe: peerPe,
    try_wacc_warning: tryWacc,
    holding_sotp_required: holdingSotp,
    banking_sector_warning: bankingWarn,
    sector_source: sectorResolution.source,
    notes,
    warnings,
    review_status: 'pending_ceo_review',
    source: 'python',
  };
}
