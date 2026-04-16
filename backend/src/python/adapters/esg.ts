/**
 * esg adapter — CBAM + EU ETS deterministic cost arithmetic.
 *
 * Ported from python-services/src/financex/calculators/esg.py.
 * Needs per-issuer inputs (scope 1 emissions, product tonnage,
 * carbon price, free-allowance %, CBAM phase-in factor) that the
 * current orchestrator does not collect — the LLM ESG agent fetches
 * these via research. Python version consumes
 * accumulatedContext['esg_cbam_inputs'] when operator has seeded it;
 * otherwise emits an empty output with a warning so the LLM layer
 * can still render sustainability narrative.
 *
 * Rating interpretation, materiality, greenwashing detection stay
 * with the LLM.
 */

export interface CbamInputs {
  scope1_tco2?: number | string;
  carbon_price_eur_per_t?: number | string;
  ets_free_allowance_pct?: number | string;
  cbam_coverage_pct?: number | string;
  product_tonnage?: number | string | null;
  cbam_default_intensity?: number | string | null;
  eur_try?: number | string | null;
}


export interface CbamCostBreakdown {
  scope1_tco2: number;
  carbon_price_eur_per_t: number;
  ets_free_allowance_pct: number;
  cbam_coverage_pct: number;
  ets_annual_cost_eur: number;
  cbam_annual_cost_eur: number;
  total_annual_cost_eur: number;
  ets_annual_cost_try: number | null;
  cbam_annual_cost_try: number | null;
  total_annual_cost_try: number | null;
}


export interface LegacyEsgOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  sector_hint: string;
  cbam: CbamCostBreakdown | null;
  external_ratings_supplied: boolean;
  notes: string | null;
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


export function extractCbamInputs(raw: unknown): CbamInputs | null {
  return unwrap<CbamInputs>(raw);
}


function n(v: unknown, def = 0): number {
  if (v == null || v === '') return def;
  const parsed = typeof v === 'number' ? v : Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(parsed) ? parsed : def;
}


function nOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const parsed = typeof v === 'number' ? v : Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}


function round0(x: number): number { return Math.round(x); }


export function computeCbamCost(inputs: CbamInputs): CbamCostBreakdown {
  const scope1 = n(inputs.scope1_tco2);
  if (scope1 < 0) throw new Error('scope1_tco2 must be non-negative');

  const carbonPrice = n(inputs.carbon_price_eur_per_t, 85);       // 2026 indicative EU ETS
  const ftsFree     = n(inputs.ets_free_allowance_pct, 0.5);
  const cbamCov     = n(inputs.cbam_coverage_pct, 0.485);         // 2026 CBAM phase-in
  const eurTry      = nOrNull(inputs.eur_try);
  const productT    = nOrNull(inputs.product_tonnage);
  const defaultInt  = nOrNull(inputs.cbam_default_intensity);

  const etsCostEur = round0(scope1 * (1 - ftsFree) * carbonPrice);

  // EU falls back to default intensity × product tonnage when verified
  // emissions are unreported — we use max(verified, default) so the
  // punitive default only kicks in when the producer is dirtier than
  // the benchmark.
  let cbamBasis = scope1;
  if (productT != null && productT > 0 && defaultInt != null) {
    const defaultEmissions = defaultInt * productT;
    cbamBasis = Math.max(scope1, defaultEmissions);
  }
  const cbamCostEur = round0(cbamBasis * cbamCov * carbonPrice);
  const totalEur = etsCostEur + cbamCostEur;

  const etsTry   = eurTry != null && eurTry > 0 ? round0(etsCostEur   * eurTry) : null;
  const cbamTry  = eurTry != null && eurTry > 0 ? round0(cbamCostEur  * eurTry) : null;
  const totalTry = eurTry != null && eurTry > 0 ? round0(totalEur     * eurTry) : null;

  return {
    scope1_tco2: scope1,
    carbon_price_eur_per_t: carbonPrice,
    ets_free_allowance_pct: ftsFree,
    cbam_coverage_pct: cbamCov,
    ets_annual_cost_eur: etsCostEur,
    cbam_annual_cost_eur: cbamCostEur,
    total_annual_cost_eur: totalEur,
    ets_annual_cost_try: etsTry,
    cbam_annual_cost_try: cbamTry,
    total_annual_cost_try: totalTry,
  };
}


export function adaptEsgForLegacy(
  cbamInputs: CbamInputs | null,
  ticker: string,
  outputId: string,
  opts: { sectorHint?: string | null; externalRatingsSupplied?: boolean; notes?: string | null } = {},
): LegacyEsgOutput {
  const warnings: string[] = [];
  const sectorHint = opts.sectorHint ?? 'industrial';
  let cbam: CbamCostBreakdown | null = null;

  if (cbamInputs) {
    try {
      cbam = computeCbamCost(cbamInputs);
    } catch (err) {
      warnings.push(`CBAM calc failed: ${(err as Error).message}`);
    }
  } else {
    warnings.push('No CBAM inputs supplied (accumulatedContext[esg_cbam_inputs] empty). LLM layer should research scope 1 + carbon price.');
  }

  return {
    agent_id: 'esg_agent',
    output_id: outputId,
    ticker: ticker.toUpperCase(),
    sector_hint: sectorHint,
    cbam,
    external_ratings_supplied: Boolean(opts.externalRatingsSupplied),
    notes: opts.notes ?? null,
    warnings,
    review_status: 'pending_ceo_review',
    source: 'python',
  };
}
