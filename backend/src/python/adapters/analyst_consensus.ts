/**
 * analyst_consensus adapter — deterministic aggregation of broker
 * recommendations. Ported from
 * python-services/src/financex/calculators/analyst_consensus.py.
 *
 * Needs a list of AnalystReport-shaped rows (broker, recommendation,
 * target_price, report_date) that the current orchestrator does not
 * collect — the LLM agent scrapes is_yatirim + KAP broker filings.
 * Python version consumes
 * accumulatedContext['analyst_consensus_reports'] when operator has
 * pre-seeded it; otherwise emits empty output + warning so the LLM
 * layer can still provide narrative.
 */

export type Recommendation =
  | 'buy' | 'outperform' | 'hold' | 'underperform' | 'sell' | 'unknown';


export interface AnalystReport {
  broker?: string;
  recommendation?: Recommendation | string;
  target_price?: number | string | null;
  report_date?: string;        // ISO YYYY-MM-DD
  horizon_months?: number;
}


export interface LegacyAnalystConsensusOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  count: number;
  target_price_mean: number | null;
  target_price_median: number | null;
  target_price_high: number | null;
  target_price_low: number | null;
  target_price_stddev: number | null;
  upside_vs_last_close_pct: number | null;
  distribution_buy: number;
  distribution_hold: number;
  distribution_sell: number;
  revision_trend: 'rising' | 'falling' | 'stable' | null;
  crowded_long_flag: boolean;
  reports: AnalystReport[];
  warnings: string[];
  review_status: string;
  source: 'python';
}


const BUY_SET  = new Set<string>(['buy', 'outperform']);
const SELL_SET = new Set<string>(['sell', 'underperform']);


function unwrap<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return null; }
  }
  return typeof raw === 'object' ? (raw as T) : null;
}


function parseNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
}


export function extractReports(raw: unknown): AnalystReport[] {
  const parsed = unwrap<unknown>(raw);
  if (Array.isArray(parsed)) return parsed as AnalystReport[];
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.reports)) return obj.reports as AnalystReport[];
  }
  return [];
}


function bucketCounts(reports: AnalystReport[]): { buy: number; hold: number; sell: number } {
  let buy = 0, hold = 0, sell = 0;
  for (const r of reports) {
    const rec = String(r.recommendation ?? '').toLowerCase();
    if (BUY_SET.has(rec)) buy += 1;
    else if (SELL_SET.has(rec)) sell += 1;
    else if (rec === 'hold') hold += 1;
  }
  return { buy, hold, sell };
}


function round4(n: number): number { return Math.round(n * 10000) / 10000; }


function targetStats(reports: AnalystReport[]): {
  mean: number | null; median: number | null; high: number | null; low: number | null; stddev: number | null;
} {
  const prices = reports.map(r => parseNumber(r.target_price)).filter((v): v is number => v != null);
  if (prices.length === 0) return { mean: null, median: null, high: null, low: null, stddev: null };

  const sorted = [...prices].sort((a, b) => a - b);
  const mean = round4(prices.reduce((a, b) => a + b, 0) / prices.length);
  const median = round4(sorted.length % 2
    ? sorted[(sorted.length - 1) / 2]
    : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2);
  const high = sorted[sorted.length - 1];
  const low = sorted[0];
  const stddev = prices.length > 1
    ? round4(Math.sqrt(prices.reduce((acc, v) => acc + (v - mean) ** 2, 0) / prices.length))
    : 0;
  return { mean, median, high, low, stddev };
}


function revisionTrend(reports: AnalystReport[], asOfIso?: string): 'rising' | 'falling' | 'stable' | null {
  const priced = reports.filter(r => parseNumber(r.target_price) != null && r.report_date);
  if (priced.length < 3) return null;

  const parseDate = (iso: string) => new Date(iso).getTime();
  const refMs = asOfIso
    ? parseDate(asOfIso)
    : Math.max(...priced.map(r => parseDate(r.report_date!)));
  if (!Number.isFinite(refMs)) return null;

  const DAY = 86_400_000;
  const recentCutoff = refMs - 30 * DAY;
  const olderCutoff  = refMs - 90 * DAY;

  const recent: number[] = [];
  const older:  number[] = [];
  for (const r of priced) {
    const t = parseDate(r.report_date!);
    const price = parseNumber(r.target_price)!;
    if (t >= recentCutoff) recent.push(price);
    else if (t >= olderCutoff) older.push(price);
  }
  if (recent.length < 2 || older.length < 2) return null;

  const meanOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const recentMean = meanOf(recent);
  const olderMean  = meanOf(older);
  if (olderMean === 0) return null;
  const delta = (recentMean - olderMean) / Math.abs(olderMean);
  if (delta > 0.03)  return 'rising';
  if (delta < -0.03) return 'falling';
  return 'stable';
}


export function adaptAnalystConsensusForLegacy(
  reports: AnalystReport[],
  ticker: string,
  outputId: string,
  opts: { lastClose?: number | null; asOf?: string | null } = {},
): LegacyAnalystConsensusOutput {
  const warnings: string[] = [];
  if (reports.length === 0) {
    warnings.push('No analyst reports supplied — accumulatedContext[analyst_consensus_reports] empty. LLM layer should run broker scrape.');
  }

  const dist = bucketCounts(reports);
  const stats = targetStats(reports);
  const trend = revisionTrend(reports, opts.asOf ?? undefined);

  let upside: number | null = null;
  const lc = opts.lastClose;
  if (lc != null && lc > 0 && stats.mean != null) {
    upside = Math.round(((stats.mean / lc) - 1) * 100 * 100) / 100;
  }

  // Crowded long: 5+ reports and zero SELLs — same heuristic as
  // sentiment_news crowded-long flag.
  const crowdedLong = reports.length >= 5 && dist.sell === 0 && dist.buy >= 3;
  if (crowdedLong) {
    warnings.push(`Crowded long — zero SELL ratings across ${reports.length} analysts`);
  }

  return {
    agent_id: 'analyst_consensus_agent',
    output_id: outputId,
    ticker: ticker.toUpperCase(),
    count: reports.length,
    target_price_mean: stats.mean,
    target_price_median: stats.median,
    target_price_high: stats.high,
    target_price_low: stats.low,
    target_price_stddev: stats.stddev,
    upside_vs_last_close_pct: upside,
    distribution_buy: dist.buy,
    distribution_hold: dist.hold,
    distribution_sell: dist.sell,
    revision_trend: trend,
    crowded_long_flag: crowdedLong,
    reports,
    warnings,
    review_status: 'pending_ceo_review',
    source: 'python',
  };
}
