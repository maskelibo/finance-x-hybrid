/**
 * sector_competition adapter — peer quartile benchmarking, ported
 * from python-services/src/financex/calculators/sector_competition.py.
 *
 * Needs peer data that the orchestrator does not collect today — the
 * LLM version runs web research for peers. This adapter accepts a
 * `peers` array from accumulatedContext['sector_competition_peers']
 * (each peer mirrors the financial_analysis output shape). When the
 * peer list is empty the output emits zero benchmarks plus a warning;
 * the LLM layer can still do Porter Five Forces on its own.
 *
 * Porter + qualitative SWOT stay with the LLM — this module is
 * purely arithmetic.
 */

import { resolveSector as resolveSectorFallback } from './llm_fallback.js';

type MetricCode = string;

export interface UpstreamHighlight {
  code: MetricCode;
  value?: string | number | null;
}

export interface UpstreamFinancialAnalysis {
  ticker?: string;
  period_label?: string;
  sector?: string;
  highlights?: UpstreamHighlight[];
  metrics?: UpstreamHighlight[];
}


interface MetricSpec {
  code: MetricCode;
  label: string;
  unit: string;
  higherIsBetter: boolean;
}


const INDUSTRIAL_METRICS: ReadonlyArray<MetricSpec> = [
  { code: 'GROSS_MARGIN',       label: 'Gross margin',            unit: '%',     higherIsBetter: true  },
  { code: 'EBITDA_MARGIN',      label: 'EBITDA margin',           unit: '%',     higherIsBetter: true  },
  { code: 'NET_MARGIN',         label: 'Net margin',              unit: '%',     higherIsBetter: true  },
  { code: 'ROE',                label: 'Return on equity',        unit: '%',     higherIsBetter: true  },
  { code: 'NET_DEBT_TO_EBITDA', label: 'Net debt / EBITDA',       unit: 'ratio', higherIsBetter: false },
  { code: 'CCC',                label: 'Cash conversion cycle',   unit: 'days',  higherIsBetter: false },
  { code: 'ALTMAN_Z',           label: 'Altman Z-score',          unit: 'score', higherIsBetter: true  },
  { code: 'PIOTROSKI_F',        label: 'Piotroski F-score',       unit: 'score', higherIsBetter: true  },
];

const BANKING_METRICS: ReadonlyArray<MetricSpec> = [
  { code: 'NIM',              label: 'Net Interest Margin',          unit: '%', higherIsBetter: true  },
  { code: 'BANK_ROE',         label: 'Banking ROE',                  unit: '%', higherIsBetter: true  },
  { code: 'BANK_ROA',         label: 'Banking ROA',                  unit: '%', higherIsBetter: true  },
  { code: 'COST_TO_INCOME',   label: 'Cost/Income',                  unit: '%', higherIsBetter: false },
  { code: 'LLP_NII_BURDEN',   label: 'Loan-loss provisions / NII',   unit: '%', higherIsBetter: false },
];


function metricsForSector(sector: string): ReadonlyArray<MetricSpec> {
  return sector.toLowerCase() === 'banking' ? BANKING_METRICS : INDUSTRIAL_METRICS;
}


function unwrap<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
  if (typeof raw === 'object') return raw as T;
  return null;
}


export function extractFinancialAnalysis(upstream: unknown): UpstreamFinancialAnalysis | null {
  return unwrap<UpstreamFinancialAnalysis>(upstream);
}


export function extractPeers(upstream: unknown): UpstreamFinancialAnalysis[] {
  if (upstream == null) return [];
  const parsed = typeof upstream === 'string' ? unwrap<unknown>(upstream) : upstream;
  if (Array.isArray(parsed)) return parsed as UpstreamFinancialAnalysis[];
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.peers)) return obj.peers as UpstreamFinancialAnalysis[];
  }
  return [];
}


function metricValue(fa: UpstreamFinancialAnalysis, code: MetricCode): number | null {
  const hls = fa.highlights ?? fa.metrics ?? [];
  for (const h of hls) {
    if (h.code === code && h.value != null && h.value !== '') {
      const n = typeof h.value === 'number' ? h.value : Number(String(h.value).replace(/[, ]/g, ''));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}


function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}


/** Inclusive-method quartiles to match Python statistics.quantiles(n=4, method="inclusive"). */
function inclusiveQuartiles(values: number[]): { q1: number; median: number; q3: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return { q1: 0, median: 0, q3: 0 };
  if (n === 1) return { q1: sorted[0], median: sorted[0], q3: sorted[0] };
  const pick = (p: number): number => {
    const pos = p * (n - 1); // inclusive method
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    if (lo === hi) return sorted[lo];
    const frac = pos - lo;
    return sorted[lo] + frac * (sorted[hi] - sorted[lo]);
  };
  return {
    q1: round4(pick(0.25)),
    median: round4(pick(0.5)),
    q3: round4(pick(0.75)),
  };
}


function quartileOf(value: number, sortedAll: number[], higherIsBetter: boolean): 1 | 2 | 3 | 4 {
  if (sortedAll.length === 0) return 4;
  // position: count of values strictly less than `value` (mirrors Python's
  // .index fallback path when the exact value is missing from rounding).
  const posExact = sortedAll.indexOf(value);
  const pos = posExact >= 0 ? posExact : sortedAll.filter(v => v < value).length;
  let pct = (pos + 0.5) / sortedAll.length;
  if (higherIsBetter) pct = 1 - pct;
  if (pct <= 0.25) return 1;
  if (pct <= 0.5)  return 2;
  if (pct <= 0.75) return 3;
  return 4;
}


function rankOf(value: number, allValues: number[], higherIsBetter: boolean): number {
  const sorted = [...allValues].sort(higherIsBetter ? (a, b) => b - a : (a, b) => a - b);
  const idx = sorted.indexOf(value);
  return idx >= 0 ? idx + 1 : sorted.length;
}


export interface MetricBenchmark {
  metric_code: MetricCode;
  label: string;
  unit: string;
  higher_is_better: boolean;
  company_value: number | null;
  min_value: number | null;
  q1: number | null;
  median: number | null;
  q3: number | null;
  max_value: number | null;
  company_rank: number | null;
  peer_count: number;
  quartile: 1 | 2 | 3 | 4 | null;
}


export interface LegacySectorCompetitionOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  period_label: string;
  sector: string;
  peer_group: string[];
  benchmarks: MetricBenchmark[];
  strengths: MetricCode[];
  weaknesses: MetricCode[];
  warnings: string[];
  review_status: string;
  source: 'python';
}


export function adaptSectorCompetitionForLegacy(
  company: UpstreamFinancialAnalysis | null,
  peers: UpstreamFinancialAnalysis[],
  ticker: string,
  outputId: string,
  opts: { llmMarkdownSource?: string | null } = {},
): LegacySectorCompetitionOutput {
  const warnings: string[] = [];

  // Resolve sector even when upstream fa is null (mixed-flag mode):
  // prefer structured, then LLM markdown cues, then ticker heuristic.
  const sectorResolution = resolveSectorFallback({
    structuredSector: company?.sector ?? null,
    markdownSource: opts.llmMarkdownSource ?? null,
    ticker,
  });
  if (sectorResolution.source !== 'structured') {
    warnings.push(`Sector inferred via ${sectorResolution.source} fallback → ${sectorResolution.sector}; LLM should verify.`);
  }

  if (!company) {
    warnings.push('No financial_analysis output — sector_competition cannot score');
    return {
      agent_id: 'sector_competition',
      output_id: outputId,
      ticker: ticker.toUpperCase(),
      period_label: 'unknown',
      sector: sectorResolution.sector,
      peer_group: [],
      benchmarks: [],
      strengths: [],
      weaknesses: [],
      warnings,
      review_status: 'pending_ceo_review',
      source: 'python',
    };
  }

  const sector = sectorResolution.sector;
  const metrics = metricsForSector(sector);
  const benchmarks: MetricBenchmark[] = [];
  const strengths: MetricCode[] = [];
  const weaknesses: MetricCode[] = [];

  if (peers.length === 0) {
    warnings.push('No peer financial_analysis outputs supplied — benchmarks cannot be computed. LLM layer should research peers.');
  }

  for (const metric of metrics) {
    const cv = metricValue(company, metric.code);
    const peerValues = peers.map(p => metricValue(p, metric.code)).filter((v): v is number => v != null);
    const allValues = cv != null ? [...peerValues, cv] : peerValues;

    if (allValues.length === 0) {
      benchmarks.push({
        metric_code: metric.code,
        label: metric.label,
        unit: metric.unit,
        higher_is_better: metric.higherIsBetter,
        company_value: null,
        min_value: null,
        q1: null,
        median: null,
        q3: null,
        max_value: null,
        company_rank: null,
        peer_count: peers.length,
        quartile: null,
      });
      continue;
    }

    const sorted = [...allValues].sort((a, b) => a - b);
    const { q1, median, q3 } = allValues.length >= 2
      ? inclusiveQuartiles(allValues)
      : { q1: sorted[0], median: sorted[0], q3: sorted[0] };

    let quartile: 1 | 2 | 3 | 4 | null = null;
    let rank: number | null = null;
    if (cv != null) {
      quartile = quartileOf(cv, sorted, metric.higherIsBetter);
      rank = rankOf(cv, allValues, metric.higherIsBetter);
      if (quartile === 1) strengths.push(metric.code);
      else if (quartile === 4) weaknesses.push(metric.code);
    }

    benchmarks.push({
      metric_code: metric.code,
      label: metric.label,
      unit: metric.unit,
      higher_is_better: metric.higherIsBetter,
      company_value: cv,
      min_value: sorted[0],
      q1,
      median,
      q3,
      max_value: sorted[sorted.length - 1],
      company_rank: rank,
      peer_count: peers.length,
      quartile,
    });
  }

  return {
    agent_id: 'sector_competition',
    output_id: outputId,
    ticker: (company.ticker ?? ticker).toUpperCase(),
    period_label: company.period_label ?? 'unknown',
    sector,
    peer_group: peers.map(p => (p.ticker ?? '').toUpperCase()).filter(Boolean),
    benchmarks,
    strengths,
    weaknesses,
    warnings,
    review_status: 'pending_ceo_review',
    source: 'python',
  };
}
