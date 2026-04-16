/**
 * strategic_synthesis adapter — cross-signal convergence map.
 *
 * Ported from python-services/src/financex/calculators/strategic_synthesis.py.
 * Extracts signed signals from the 4 deterministic upstream layers
 * (fundamental, peer, technical, macro, event), buckets them by
 * direction, and computes a convergence score in [-1, 1] plus a
 * confidence tag. The narrative (Bull/Base/Bear) stays with the LLM.
 */

type Direction = 'positive' | 'negative' | 'neutral';
type Confidence = 'low' | 'medium' | 'high';

export interface UpstreamHighlight {
  code: string;
  label?: string;
  value?: string | number | null;
  narrative_hint?: string | null;
}

export interface UpstreamRedFlag {
  code: string;
  severity: string;
  message?: string;
}

export interface UpstreamFinancialAnalysis {
  ticker?: string;
  period_label?: string;
  sector?: string;
  highlights?: UpstreamHighlight[];
  metrics?: UpstreamHighlight[];
  red_flags?: UpstreamRedFlag[];
}

export interface UpstreamSectorCompetition {
  strengths?: string[];
  weaknesses?: string[];
}

export interface UpstreamTechnical {
  trend?: string | null;
  overall_trend?: string | null;
}

export interface UpstreamMacro {
  tilt?: string | null;
  macro_tilt?: string | null;
}

export interface UpstreamEventImpact {
  portfolio_impact_summary?: string | null;
  confidence_overall?: string | null;
  event_impacts?: Array<{ impact_direction?: string | null }>;
}


export interface Signal {
  source: 'fundamental' | 'peer' | 'technical' | 'macro' | 'event';
  direction: Direction;
  label: string;
  evidence: string | null;
}


export interface LegacyStrategicSynthesisOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  period_label: string;
  sector: string;
  signals: {
    positive: Signal[];
    negative: Signal[];
    neutral: Signal[];
  };
  convergence_score: number; // −1..+1
  confidence: Confidence;
  divergences: string[];
  warnings: string[];
  review_status: string;
  source: 'python';
}


const POSITIVE_HIGHLIGHT_CODES = new Set([
  'GROSS_MARGIN', 'EBITDA_MARGIN', 'NET_MARGIN', 'ROE', 'ROA', 'ROCE',
  'NIM', 'BANK_ROE', 'BANK_ROA',
  'CCC', 'FCF', 'ALTMAN_Z', 'PIOTROSKI_F',
]);


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

export function extractTechnical(raw: unknown): UpstreamTechnical | null {
  return unwrap<UpstreamTechnical>(raw);
}

export function extractMacro(raw: unknown): UpstreamMacro | null {
  return unwrap<UpstreamMacro>(raw);
}

export function extractEventImpact(raw: unknown): UpstreamEventImpact | null {
  return unwrap<UpstreamEventImpact>(raw);
}


function parseNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : null;
}


function fundamentalSignals(fa: UpstreamFinancialAnalysis): Signal[] {
  const out: Signal[] = [];
  const highlights = fa.highlights ?? fa.metrics ?? [];
  for (const h of highlights) {
    if (!POSITIVE_HIGHLIGHT_CODES.has(h.code)) continue;
    const val = parseNumber(h.value);
    if (val == null) continue;
    let direction: Direction = 'positive';
    if (h.code === 'CCC' && val > 0) direction = 'neutral';
    if (h.code === 'NET_MARGIN' && val <= 0) direction = 'negative';
    if (['ROE', 'ROA', 'BANK_ROE', 'BANK_ROA'].includes(h.code) && val <= 0) direction = 'negative';
    out.push({
      source: 'fundamental',
      direction,
      label: h.label ?? h.code,
      evidence: h.code,
    });
  }
  for (const f of fa.red_flags ?? []) {
    const sev = (f.severity ?? '').toLowerCase();
    const direction: Direction = sev === 'info' ? 'neutral' : 'negative';
    out.push({
      source: 'fundamental',
      direction,
      label: f.code,
      evidence: f.message ?? null,
    });
  }
  return out;
}


function peerSignals(sc: UpstreamSectorCompetition | null): Signal[] {
  if (!sc) return [];
  const out: Signal[] = [];
  for (const code of sc.strengths ?? []) {
    out.push({ source: 'peer', direction: 'positive', label: `Top quartile: ${code}`, evidence: code });
  }
  for (const code of sc.weaknesses ?? []) {
    out.push({ source: 'peer', direction: 'negative', label: `Bottom quartile: ${code}`, evidence: code });
  }
  return out;
}


function normaliseTrend(raw: string | null | undefined): Direction | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v.includes('bull') || v === 'positive' || v === 'up') return 'positive';
  if (v.includes('bear') || v === 'negative' || v === 'down') return 'negative';
  if (v === 'neutral' || v.includes('side')) return 'neutral';
  return null;
}


function technicalSignal(ta: UpstreamTechnical | null): Signal | null {
  if (!ta) return null;
  const raw = ta.trend ?? ta.overall_trend;
  const dir = normaliseTrend(raw ?? null);
  if (!dir) return null;
  return { source: 'technical', direction: dir, label: `Trend: ${raw}`, evidence: null };
}


function macroSignal(ma: UpstreamMacro | null): Signal | null {
  if (!ma) return null;
  const raw = ma.tilt ?? ma.macro_tilt;
  const dir = normaliseTrend(raw ?? null);
  if (!dir) return null;
  return { source: 'macro', direction: dir, label: `Macro tilt: ${raw}`, evidence: null };
}


function eventNetSignal(ev: UpstreamEventImpact | null): Signal | null {
  if (!ev?.event_impacts?.length) return null;
  let pos = 0, neg = 0;
  for (const e of ev.event_impacts) {
    const d = (e.impact_direction ?? '').toLowerCase();
    if (d === 'positive') pos += 1;
    else if (d === 'negative') neg += 1;
  }
  let direction: Direction;
  if (pos === 0 && neg === 0) return null;
  if (pos > neg * 1.5) direction = 'positive';
  else if (neg > pos * 1.5) direction = 'negative';
  else direction = 'neutral';
  return {
    source: 'event',
    direction,
    label: `Event net: ${direction} (+${pos} / −${neg})`,
    evidence: null,
  };
}


function confidenceFrom(total: number, absScore: number): Confidence {
  if (total >= 8 && absScore >= 0.4) return 'high';
  if (total >= 4) return 'medium';
  return 'low';
}


function detectDivergences(signals: Signal[]): string[] {
  const sourcesByDir: Record<Direction, Set<string>> = {
    positive: new Set(),
    negative: new Set(),
    neutral: new Set(),
  };
  for (const s of signals) sourcesByDir[s.direction].add(s.source);
  const out: string[] = [];
  for (const src of sourcesByDir.positive) {
    if (sourcesByDir.negative.has(src)) {
      out.push(`${src} has both positive and negative signals — inspect closer.`);
    }
  }
  return out;
}


export interface SynthesisInputs {
  financialAnalysis: UpstreamFinancialAnalysis | null;
  sectorCompetition: UpstreamSectorCompetition | null;
  technical: UpstreamTechnical | null;
  macro: UpstreamMacro | null;
  eventImpact: UpstreamEventImpact | null;
}


export function adaptStrategicSynthesisForLegacy(
  inputs: SynthesisInputs,
  ticker: string,
  outputId: string,
): LegacyStrategicSynthesisOutput {
  const warnings: string[] = [];
  const fa = inputs.financialAnalysis;
  if (!fa) {
    warnings.push('No financial_analysis output — strategic_synthesis cannot extract fundamental signals');
  }

  const signals: Signal[] = [];
  if (fa) signals.push(...fundamentalSignals(fa));
  signals.push(...peerSignals(inputs.sectorCompetition));
  const ta = technicalSignal(inputs.technical); if (ta) signals.push(ta);
  const ma = macroSignal(inputs.macro);         if (ma) signals.push(ma);
  const ev = eventNetSignal(inputs.eventImpact); if (ev) signals.push(ev);

  const bucket = {
    positive: signals.filter(s => s.direction === 'positive'),
    negative: signals.filter(s => s.direction === 'negative'),
    neutral:  signals.filter(s => s.direction === 'neutral'),
  };

  const total = signals.length;
  const score = total === 0
    ? 0
    : Math.round(((bucket.positive.length - bucket.negative.length) / total) * 100) / 100;

  const confidence = confidenceFrom(total, Math.abs(score));
  const divergences = detectDivergences(signals);

  return {
    agent_id: 'strategic_synthesis',
    output_id: outputId,
    ticker: (fa?.ticker ?? ticker).toUpperCase(),
    period_label: fa?.period_label ?? 'unknown',
    sector: fa?.sector ?? 'unknown',
    signals: bucket,
    convergence_score: score,
    confidence,
    divergences,
    warnings,
    review_status: 'pending_ceo_review',
    source: 'python',
  };
}
