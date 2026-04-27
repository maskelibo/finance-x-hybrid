/**
 * Deterministic Chairman Question Engine (Block P — Plan P2F Wave 1).
 *
 * Zero-cost, deterministic boardroom-question generator. Reads only Block P
 * read-only signals (CanonicalFactPackV2, ConfidenceSummary, contradictions,
 * citation gaps) and emits Turkish boardroom-grade questions whose triggers
 * are factually traceable.
 *
 * Coexists with the LLM-first P3.gamma `chairman_anticipator.ts` — neither
 * imports the other; outputs land on distinct accumulatedContext keys.
 *
 * Strict invariants:
 *   - DETECTION ONLY in Wave 1 — never blocks delivery, never deletes
 *     content, never modifies canonical_facts or any prior context key
 *   - Pure functions: same inputs → same questions (deterministic)
 *   - Stable question_id (sha1 over ticker|category|trigger_key) so the
 *     same trigger across runs produces the same id
 *   - Per-detector try/catch — a single detector failure can never abort
 *     the report; the broken detector is silently skipped
 *   - Empty pack → well-formed empty report, never throws
 *   - No LLM calls; no I/O beyond the Block P read APIs
 */

import { createHash } from 'node:crypto';
import { getCanonicalFactPackV2 } from '../fact-layer/pack-v2.js';
import { buildFactConfidenceSummary } from '../fact-layer/summary.js';
import { detectContradictions } from './contradiction-engine.js';
import { detectCitationGaps } from './citation-enforcement.js';

// =============================================================================
// Types
// =============================================================================

export type ChairmanQuestionSeverity = 'P0' | 'P1' | 'P2';

export type ChairmanQuestionCategory =
  | 'leverage'
  | 'liquidity'
  | 'profitability_margin'
  | 'profitability_negative'
  | 'data_quality'
  | 'citation_gap'
  | 'contradiction';

export type ChairmanQuestionConfidence = 'high' | 'medium' | 'low';

export interface DeterministicChairmanQuestion {
  question_id: string;
  severity: ChairmanQuestionSeverity;
  category: ChairmanQuestionCategory;
  /** fact_keys whose pattern triggered the question. */
  trigger_facts: string[];
  /** Turkish boardroom-register question. */
  question: string;
  /** 1-2 sentence rationale, Turkish. */
  why_it_matters: string;
  /** Where the answer is expected to be authored. */
  expected_answer_location: string;
  /** All fact_keys the answerer should reference (superset of trigger_facts). */
  evidence_fact_keys: string[];
  /** Confidence in the QUESTION — derived from input data quality, not the answer. */
  confidence: ChairmanQuestionConfidence;
  /** Optional: which agent the answer should come from. */
  suggested_owner_agent?: string;
}

export interface DeterministicChairmanReport {
  ticker: string | null;
  session_id: string;
  generated_at: string;
  questions: DeterministicChairmanQuestion[];
  by_severity: { P0: number; P1: number; P2: number };
  by_category: Record<ChairmanQuestionCategory, number>;
  total_count: number;
  warnings: string[];
}

// =============================================================================
// Constants
// =============================================================================

const CRITICAL_FACT_STEMS: ReadonlySet<string> = new Set([
  'revenue', 'net_income', 'ebitda', 'net_debt', 'net_debt_to_ebitda', 'roe', 'fcf',
]);

/** Numeric thresholds (deterministic). */
const LEVERAGE_DISTRESS_THRESHOLD = 5.0;       // net_debt_to_ebitda >= 5.0 → P0
const LIQUIDITY_DISTRESS_THRESHOLD = 1.0;      // current_ratio < 1.0 → P0
const REVENUE_GROWTH_TRIGGER = 0.10;           // YoY > 10%
const MARGIN_COMPRESSION_BPS = 200;            // ebitda_margin drop ≥ 200bps
const LOW_CONFIDENCE_THRESHOLD = 0.55;

const ALL_CATEGORIES: ChairmanQuestionCategory[] = [
  'leverage',
  'liquidity',
  'profitability_margin',
  'profitability_negative',
  'data_quality',
  'citation_gap',
  'contradiction',
];

// =============================================================================
// Period suffix utilities
// =============================================================================

const PERIOD_SUFFIX_RE = /_(?:fy\d{4}|q[1-4]_\d{4}|h[12]_\d{4}|\d{8})$/i;
const FY_SUFFIX_RE = /_fy(\d{4})$/i;

/** Returns the stem (fact_key without period suffix). Returns the input
 *  unchanged when no period suffix is present. */
function stemOf(factKey: string): string {
  const m = factKey.match(PERIOD_SUFFIX_RE);
  if (!m) return factKey;
  return factKey.slice(0, -m[0].length);
}

/** Returns the period suffix (without leading underscore). null when none. */
function periodOf(factKey: string): string | null {
  const m = factKey.match(PERIOD_SUFFIX_RE);
  return m ? m[0].slice(1) : null;
}

// =============================================================================
// Question id (stable across runs)
// =============================================================================

function questionId(ticker: string | null, category: ChairmanQuestionCategory, triggerKey: string): string {
  const h = createHash('sha1').update(`${ticker ?? 'unknown'}|${category}|${triggerKey}`).digest('hex').slice(0, 12);
  return `dcq-${h}`;
}

// =============================================================================
// Confidence helper (per-question, derived from input data quality)
// =============================================================================

interface FactSnapshot { fact_key: string; value: unknown; confidence_score: number | null; }

function pickFactByKey(
  facts: ReadonlyArray<FactSnapshot>,
  key: string,
): FactSnapshot | null {
  return facts.find((f) => f.fact_key === key) ?? null;
}

function questionConfidenceFor(
  triggerFactKeys: ReadonlyArray<string>,
  facts: ReadonlyArray<FactSnapshot>,
): ChairmanQuestionConfidence {
  let minScore = 1;
  let scoredCount = 0;
  for (const k of triggerFactKeys) {
    const f = pickFactByKey(facts, k);
    if (f && typeof f.confidence_score === 'number' && Number.isFinite(f.confidence_score)) {
      minScore = Math.min(minScore, f.confidence_score);
      scoredCount++;
    }
  }
  if (scoredCount === 0) return 'medium';
  if (minScore < LOW_CONFIDENCE_THRESHOLD) return 'low';
  if (minScore < 0.85) return 'medium';
  return 'high';
}

// =============================================================================
// Detectors
// =============================================================================
//
// Each detector returns an array of ChairmanQuestion. Detectors are pure
// functions over the precomputed input snapshot. Empty array = no trigger.

interface DetectorContext {
  ticker: string | null;
  facts: FactSnapshot[];
  contradictionsBySeverity: { critical: number; material: number; soft: number };
  contradictionFactKeys: string[];
  citationCriticalGapKeys: string[];
}

function detectorLeverage(ctx: DetectorContext): DeterministicChairmanQuestion[] {
  const out: DeterministicChairmanQuestion[] = [];
  for (const f of ctx.facts) {
    if (stemOf(f.fact_key) !== 'net_debt_to_ebitda') continue;
    if (typeof f.value !== 'number' || !Number.isFinite(f.value)) continue;
    if (f.value < LEVERAGE_DISTRESS_THRESHOLD) continue;
    const period = periodOf(f.fact_key);
    const evidenceKeys = [f.fact_key];
    if (period) {
      if (pickFactByKey(ctx.facts, `net_debt_${period}`)) evidenceKeys.push(`net_debt_${period}`);
      if (pickFactByKey(ctx.facts, `ebitda_${period}`)) evidenceKeys.push(`ebitda_${period}`);
    }
    out.push({
      question_id: questionId(ctx.ticker, 'leverage', f.fact_key),
      severity: 'P0',
      category: 'leverage',
      trigger_facts: [f.fact_key],
      question: `Net Borç / FAVÖK çarpanı ${formatRatio(f.value)}x ile yüksek finansal sıkıntı bölgesinde — sermaye yapısı sürdürülebilir mi, refinansman planı nedir?`,
      why_it_matters: `Çarpan ${LEVERAGE_DISTRESS_THRESHOLD.toFixed(1)}x sınırını aştığında borç servisi cari nakit akışını zorlamakta, refinansman riski materyalleşmektedir. Yatırım kararı için yönetimin kaldıraç azaltım yol haritası net olmalıdır.`,
      expected_answer_location: 'financial_analysis > leverage',
      evidence_fact_keys: evidenceKeys,
      confidence: questionConfidenceFor([f.fact_key], ctx.facts),
      suggested_owner_agent: 'financial_analysis',
    });
  }
  return out;
}

function detectorLiquidity(ctx: DetectorContext): DeterministicChairmanQuestion[] {
  const out: DeterministicChairmanQuestion[] = [];
  for (const f of ctx.facts) {
    if (stemOf(f.fact_key) !== 'current_ratio') continue;
    if (typeof f.value !== 'number' || !Number.isFinite(f.value)) continue;
    if (f.value >= LIQUIDITY_DISTRESS_THRESHOLD) continue;
    const period = periodOf(f.fact_key);
    const evidenceKeys = [f.fact_key];
    if (period && pickFactByKey(ctx.facts, `current_liabilities_${period}`)) evidenceKeys.push(`current_liabilities_${period}`);
    out.push({
      question_id: questionId(ctx.ticker, 'liquidity', f.fact_key),
      severity: 'P0',
      category: 'liquidity',
      trigger_facts: [f.fact_key],
      question: `Cari oran ${formatRatio(f.value)}x, 1,0x altında — kısa vadeli yükümlülükleri karşılayacak nakit / likidite yönetimi nasıl planlanıyor?`,
      why_it_matters: `Cari oran 1,0x altına indiğinde dönen varlıklar kısa vadeli yükümlülükleri karşılayamamakta, likidite stresi sinyali verilmektedir. Yatırım kararı öncesi yönetimin nakit yönetim stratejisi şeffaflıkla açıklanmalıdır.`,
      expected_answer_location: 'financial_analysis > liquidity',
      evidence_fact_keys: evidenceKeys,
      confidence: questionConfidenceFor([f.fact_key], ctx.facts),
      suggested_owner_agent: 'financial_analysis',
    });
  }
  return out;
}

function detectorRevenueMarginCompression(ctx: DetectorContext): DeterministicChairmanQuestion[] {
  // D3: cross-FY revenue↑ / margin↓. Wave 1 narrows to FY-shape periods only;
  // Q/H comparisons deferred to a future wave to keep semantics tight.
  const out: DeterministicChairmanQuestion[] = [];
  // Collect FY periods that have BOTH revenue and ebitda_margin facts.
  const fyMap = new Map<number, { revenue?: number; ebitda_margin?: number }>();
  for (const f of ctx.facts) {
    const fy = matchFyYear(f.fact_key);
    if (fy === null) continue;
    if (typeof f.value !== 'number' || !Number.isFinite(f.value)) continue;
    const stem = stemOf(f.fact_key);
    const entry = fyMap.get(fy) ?? {};
    if (stem === 'revenue') entry.revenue = f.value;
    if (stem === 'ebitda_margin') entry.ebitda_margin = f.value;
    fyMap.set(fy, entry);
  }
  // Need ≥ 2 FY years where BOTH revenue and ebitda_margin are present.
  const completeYears = Array.from(fyMap.entries())
    .filter(([, e]) => typeof e.revenue === 'number' && typeof e.ebitda_margin === 'number')
    .map(([y, e]) => ({ year: y, ...e }))
    .sort((a, b) => b.year - a.year);
  if (completeYears.length < 2) return out;

  const latest = completeYears[0];
  const prior = completeYears[1];
  const revenueGrowth = (latest.revenue! - prior.revenue!) / Math.abs(prior.revenue!);
  const marginDelta = latest.ebitda_margin! - prior.ebitda_margin!;
  // ebitda_margin stored as decimal-equivalent percent (e.g. 17.02). Drop > 2.0 percentage points = 200bps.
  if (revenueGrowth > REVENUE_GROWTH_TRIGGER && marginDelta < -(MARGIN_COMPRESSION_BPS / 100)) {
    const triggerFacts = [`revenue_fy${latest.year}`, `ebitda_margin_fy${latest.year}`];
    const evidenceKeys = [
      `revenue_fy${latest.year}`, `revenue_fy${prior.year}`,
      `ebitda_margin_fy${latest.year}`, `ebitda_margin_fy${prior.year}`,
    ];
    out.push({
      question_id: questionId(ctx.ticker, 'profitability_margin', `fy${latest.year}_vs_fy${prior.year}`),
      severity: 'P0',
      category: 'profitability_margin',
      trigger_facts: triggerFacts,
      question: `Hasılat FY${latest.year}'da yıllık +%${(revenueGrowth * 100).toFixed(1)} büyürken FAVÖK marjı ${(marginDelta * 100).toFixed(0)}bps daraldı — operasyonel sorun mu, girdi maliyet baskısı mı, ürün karması etkisi mi?`,
      why_it_matters: `Hasılat büyümesinin marja yansımaması yapısal kâr kalitesi sorununa işaret eder. Yatırım kararı için yönetimin marj koruma stratejisi şeffaflıkla açıklanmalıdır.`,
      expected_answer_location: 'financial_analysis > profitability',
      evidence_fact_keys: evidenceKeys,
      confidence: questionConfidenceFor(triggerFacts, ctx.facts),
      suggested_owner_agent: 'financial_analysis',
    });
  }
  return out;
}

function detectorNegativeProfitability(ctx: DetectorContext): DeterministicChairmanQuestion[] {
  const out: DeterministicChairmanQuestion[] = [];
  for (const f of ctx.facts) {
    if (stemOf(f.fact_key) !== 'net_income') continue;
    if (typeof f.value !== 'number' || !Number.isFinite(f.value)) continue;
    if (f.value >= 0) continue;
    out.push({
      question_id: questionId(ctx.ticker, 'profitability_negative', f.fact_key),
      severity: 'P0',
      category: 'profitability_negative',
      trigger_facts: [f.fact_key],
      question: `${labelForPeriod(periodOf(f.fact_key))} döneminde net dönem zararı ${formatTRYmn(f.value)} kaydedildi — operasyonel mi, tek seferlik mi, yapısal mı? Gelecek döneme normalleşme beklenir mi?`,
      why_it_matters: `Net zarar özsermayeyi eritir ve temettü kapasitesini sınırlar. Yatırım tezi için zararın niteliği (geçici / yapısal) net olmalıdır.`,
      expected_answer_location: 'financial_analysis > profitability + strategic_synthesis',
      evidence_fact_keys: [f.fact_key],
      confidence: questionConfidenceFor([f.fact_key], ctx.facts),
      suggested_owner_agent: 'financial_analysis',
    });
  }
  return out;
}

function detectorLowConfidenceCriticalFact(ctx: DetectorContext): DeterministicChairmanQuestion[] {
  const out: DeterministicChairmanQuestion[] = [];
  for (const f of ctx.facts) {
    if (!CRITICAL_FACT_STEMS.has(stemOf(f.fact_key))) continue;
    if (typeof f.confidence_score !== 'number' || !Number.isFinite(f.confidence_score)) continue;
    if (f.confidence_score >= LOW_CONFIDENCE_THRESHOLD) continue;
    out.push({
      question_id: questionId(ctx.ticker, 'data_quality', f.fact_key),
      severity: 'P0',
      category: 'data_quality',
      trigger_facts: [f.fact_key],
      question: `${f.fact_key} değeri düşük güven düzeyiyle (skor=${f.confidence_score.toFixed(2)}) raporlanmış — kanonik kaynak nedir, doğrulama adımı atlandı mı?`,
      why_it_matters: `Kritik finansal kalemde düşük güven düzeyi, raporun kanıt zinciri için bir kırılma noktasıdır. Yatırım kararı verilmeden önce kaynak ve metodoloji teyit edilmelidir.`,
      expected_answer_location: 'fact_layer > confidence + lineage',
      evidence_fact_keys: [f.fact_key],
      confidence: 'low', // by definition — the underlying data is low confidence
      suggested_owner_agent: 'reconciliation',
    });
  }
  return out;
}

function detectorCriticalCitationGap(ctx: DetectorContext): DeterministicChairmanQuestion[] {
  if (ctx.citationCriticalGapKeys.length === 0) return [];
  return [{
    question_id: questionId(ctx.ticker, 'citation_gap', `n=${ctx.citationCriticalGapKeys.length}`),
    severity: 'P1',
    category: 'citation_gap',
    trigger_facts: ctx.citationCriticalGapKeys.slice().sort(),
    question: `Kritik finansal kalemlerden ${ctx.citationCriticalGapKeys.length} tanesi belge anchor'ına sahip değil — yatırım kararı için kaynak gösterimi yeterli mi?`,
    why_it_matters: `Kritik fact'ler için doğrudan bağlanmış filing referansı, kurumsal araştırma standardı için zorunludur. Eksik citation, denetim ve yatırımcı güvenini erozyona uğratır.`,
    expected_answer_location: 'fact_layer > lineage (Wave 2 doc enrichment)',
    evidence_fact_keys: ctx.citationCriticalGapKeys.slice().sort(),
    confidence: 'high',
    suggested_owner_agent: 'parse_standardization',
  }];
}

function detectorUnresolvedCriticalContradiction(ctx: DetectorContext): DeterministicChairmanQuestion[] {
  if (ctx.contradictionsBySeverity.critical === 0) return [];
  return [{
    question_id: questionId(ctx.ticker, 'contradiction', `n=${ctx.contradictionsBySeverity.critical}`),
    severity: 'P1',
    category: 'contradiction',
    trigger_facts: ctx.contradictionFactKeys.slice().sort(),
    question: `Cross-agent veride ${ctx.contradictionsBySeverity.critical} kritik tutarsızlık tespit edildi — hangi rakam birincil olarak kabul edildi, hangileri elendi?`,
    why_it_matters: `Çelişen ajan çıktıları, raporun arkasındaki mutabakat sürecini sorgulanabilir kılar. Yatırım kararı için tek kanonik değer ve seçim gerekçesi açıkça yazılmalıdır.`,
    expected_answer_location: 'fact_layer > truth_arbitration',
    evidence_fact_keys: ctx.contradictionFactKeys.slice().sort(),
    confidence: 'high',
    suggested_owner_agent: 'reconciliation',
  }];
}

const ALL_DETECTORS: Array<{ name: string; fn: (ctx: DetectorContext) => DeterministicChairmanQuestion[] }> = [
  { name: 'leverage_above_threshold',          fn: detectorLeverage },
  { name: 'liquidity_distress',                 fn: detectorLiquidity },
  { name: 'revenue_growth_margin_compression',  fn: detectorRevenueMarginCompression },
  { name: 'negative_profitability',             fn: detectorNegativeProfitability },
  { name: 'low_confidence_critical_fact',       fn: detectorLowConfidenceCriticalFact },
  { name: 'critical_citation_gap',              fn: detectorCriticalCitationGap },
  { name: 'unresolved_critical_contradiction',  fn: detectorUnresolvedCriticalContradiction },
];

// =============================================================================
// Helpers
// =============================================================================

function matchFyYear(factKey: string): number | null {
  const m = factKey.match(FY_SUFFIX_RE);
  if (!m) return null;
  const y = Number(m[1]);
  return Number.isFinite(y) ? y : null;
}

function formatRatio(n: number): string {
  return n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

function formatTRYmn(n: number): string {
  return `${Math.abs(n).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} mn TL`;
}

function labelForPeriod(period: string | null): string {
  if (!period) return 'İlgili';
  const m = period.match(/^fy(\d{4})$/i);
  if (m) return `FY-${m[1]}`;
  const q = period.match(/^q([1-4])_(\d{4})$/i);
  if (q) return `Q${q[1]}-${q[2]}`;
  const h = period.match(/^h([12])_(\d{4})$/i);
  if (h) return `H${h[1]}-${h[2]}`;
  return period;
}

function emptyCategoryCounts(): Record<ChairmanQuestionCategory, number> {
  const out: Record<ChairmanQuestionCategory, number> = {
    leverage: 0, liquidity: 0, profitability_margin: 0, profitability_negative: 0,
    data_quality: 0, citation_gap: 0, contradiction: 0,
  };
  for (const c of ALL_CATEGORIES) out[c] = 0;
  return out;
}

// =============================================================================
// Main entry
// =============================================================================

export function runDeterministicChairmanQuestions(
  sessionId: string,
  ticker?: string | null,
): DeterministicChairmanReport {
  const warnings: string[] = [];
  const questions: DeterministicChairmanQuestion[] = [];
  const seenIds = new Set<string>();

  // 1) Read all Block P inputs (each defensively).
  let pack: ReturnType<typeof getCanonicalFactPackV2> | null = null;
  try { pack = getCanonicalFactPackV2(sessionId); }
  catch (err) { warnings.push(`pack_read_failed:${(err as Error).message}`); }
  let summary: ReturnType<typeof buildFactConfidenceSummary> | null = null;
  try { summary = buildFactConfidenceSummary(sessionId); }
  catch (err) { warnings.push(`summary_read_failed:${(err as Error).message}`); }
  let contradictions: ReturnType<typeof detectContradictions> | null = null;
  try { contradictions = detectContradictions(sessionId); }
  catch (err) { warnings.push(`contradictions_read_failed:${(err as Error).message}`); }
  let citation: ReturnType<typeof detectCitationGaps> | null = null;
  try { citation = detectCitationGaps(sessionId); }
  catch (err) { warnings.push(`citation_read_failed:${(err as Error).message}`); }

  // 2) Build a flat fact snapshot (fact_key + value + confidence_score).
  const facts: FactSnapshot[] = [];
  if (pack) {
    for (const [key, fact] of Object.entries(pack.facts)) {
      facts.push({
        fact_key: key,
        value: fact.value,
        confidence_score: fact.confidence?.score ?? null,
      });
    }
  }

  const ctx: DetectorContext = {
    ticker: ticker ?? pack?.ticker ?? null,
    facts,
    contradictionsBySeverity: contradictions
      ? contradictions.by_severity
      : { critical: 0, material: 0, soft: 0 },
    contradictionFactKeys: contradictions
      ? contradictions.conflicts.map((c) => c.fact_key)
      : [],
    citationCriticalGapKeys: citation
      ? citation.critical_gaps.map((g) => g.fact_key)
      : [],
  };

  // 3) Run each detector under per-detector try/catch — one detector
  //    failure cannot fail the report.
  for (const d of ALL_DETECTORS) {
    try {
      const found = d.fn(ctx);
      for (const q of found) {
        if (seenIds.has(q.question_id)) continue; // de-dup by stable id
        seenIds.add(q.question_id);
        questions.push(q);
      }
    } catch (err) {
      warnings.push(`detector_failed:${d.name}:${(err as Error).message}`);
    }
  }

  // 4) Assemble report
  const bySeverity = { P0: 0, P1: 0, P2: 0 };
  const byCategory = emptyCategoryCounts();
  for (const q of questions) {
    bySeverity[q.severity]++;
    byCategory[q.category]++;
  }

  // unused-variable quiet
  void summary;

  return {
    ticker: ctx.ticker,
    session_id: sessionId,
    generated_at: new Date().toISOString(),
    questions,
    by_severity: bySeverity,
    by_category: byCategory,
    total_count: questions.length,
    warnings,
  };
}

// =============================================================================
// accumulatedContext adapter (Wave 1 — explicit invocation only)
// =============================================================================

export const DETERMINISTIC_CHAIRMAN_CONTEXT_KEYS = {
  REPORT: 'chairman_questions_deterministic',
  REPORT_JSON: 'chairman_questions_deterministic_json',
} as const;

/**
 * Run the deterministic engine and write the result into accumulatedContext
 * under two distinct keys (parallel to the LLM-first chairman_anticipator).
 * Returns the report. Does NOT mutate any other accumulatedContext key.
 */
export function recordDeterministicChairmanReport(
  sessionId: string,
  ticker: string | null,
  ctx: Record<string, unknown>,
): DeterministicChairmanReport {
  const report = runDeterministicChairmanQuestions(sessionId, ticker);
  ctx[DETERMINISTIC_CHAIRMAN_CONTEXT_KEYS.REPORT] = report;
  ctx[DETERMINISTIC_CHAIRMAN_CONTEXT_KEYS.REPORT_JSON] = JSON.stringify(report);
  return report;
}

// Test exports
export { stemOf, periodOf, ALL_DETECTORS };
