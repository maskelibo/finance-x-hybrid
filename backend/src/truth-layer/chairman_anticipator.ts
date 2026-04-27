/**
 * Financial Truth Layer — Chairman Question Anticipator (P3.gamma v1).
 *
 * Generates proactive boardroom-grade Q&A from a deterministic challenge
 * brief composed of structured upstream signals + P3.alpha contradiction
 * findings. Uses a single direct LLM call (Sonnet 4.6) with strict
 * timeout/cost/output budgets; falls back to deterministic skeleton on
 * any LLM failure.
 *
 * Design rules (per scope, P3.gamma):
 *   - additive only — accumulatedContext gains 2 optional keys; nothing else
 *   - no schema break, no production override, no S-block regression
 *   - no report_formatter consumption in v1 (output captured for log only)
 *   - no final_summary narrative parsing; no raw KAP/PDF reads
 *   - deterministic fallback always available; never blocks pipeline
 *   - input challenge brief ≤ 5KB; output max 2000 tokens; single LLM call
 *
 * Public API:
 *   runChairmanAnticipator(ticker, ctx)       — main entry
 *   logChairmanAnticipatorSummary(report)     — orchestrator log helper
 *   buildChallengeBrief(ticker, ctx)          — exposed for testability
 *   setProviderRunner(fn)                     — test injection point
 */

import { createHash } from 'node:crypto';
import { createDefaultProviderRouter } from '../llm/default-router.js';
import type { ContradictionFinding, ContradictionReport } from './contradiction_hunter.js';
import { readTruthAssertions } from './preflight.js';
import type { TruthAssertions } from './types.js';

// =============================================================================
// Types
// =============================================================================

export type QuestionCategory =
  | 'valuation_challenge'
  | 'financial_risk_challenge'
  | 'methodology_challenge'
  | 'management_strategy'
  | 'downside_scenario';

export type QuestionConfidence = 'high' | 'medium' | 'low';

export interface ChairmanQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  proactive_answer: string;
  evidence_refs: string[];
  confidence: QuestionConfidence;
}

export interface ChairmanQuestionReport {
  ticker: string;
  generated_at: string;
  question_count: number;
  by_category: Record<QuestionCategory, number>;
  questions: ChairmanQuestion[];
  source: 'llm' | 'fallback_deterministic';
  llm_model: string | null;
  llm_duration_ms: number | null;
  llm_input_tokens: number | null;
  llm_output_tokens: number | null;
  llm_cost_usd: number | null;
  warnings: string[];
}

export const CHAIRMAN_CONTEXT_KEYS = {
  REPORT: 'chairman_questions',
  REPORT_JSON: 'chairman_questions_json',
} as const;

// =============================================================================
// Budgets (per scope)
// =============================================================================

const MODEL = 'claude-sonnet-4-6';
const TIMEOUT_MS = 90_000;
const MAX_QUESTIONS = 7;
const BRIEF_BYTE_CAP = 5000;

const ALL_CATEGORIES: QuestionCategory[] = [
  'valuation_challenge',
  'financial_risk_challenge',
  'methodology_challenge',
  'management_strategy',
  'downside_scenario',
];

// =============================================================================
// Provider runner (DI for test injection)
// =============================================================================

export interface ProviderCallResult {
  success: boolean;
  output: string;
  durationMs: number;
  tokensUsed: number;
  costUsd: number;
  error?: string;
  errorType?: string;
}

export type ProviderRunner = (input: {
  prompt: string;
  model: string;
  timeoutMs: number;
}) => Promise<ProviderCallResult>;

let _router: ReturnType<typeof createDefaultProviderRouter> | null = null;
function lazyDefaultRunner(): ProviderRunner {
  return async (input) => {
    if (!_router) _router = createDefaultProviderRouter();
    const r = await _router.run({
      prompt: input.prompt,
      model: input.model,
      timeoutMs: input.timeoutMs,
    });
    return {
      success: r.success,
      output: r.output ?? '',
      durationMs: r.durationMs ?? 0,
      tokensUsed: r.tokensUsed ?? 0,
      costUsd: r.costUsd ?? 0,
      error: r.error,
      errorType: r.errorType,
    };
  };
}

let activeRunner: ProviderRunner = lazyDefaultRunner();
export function setProviderRunner(fn: ProviderRunner): void { activeRunner = fn; }
export function resetProviderRunner(): void { activeRunner = lazyDefaultRunner(); }

// =============================================================================
// Helpers
// =============================================================================

function parseJsonLoose(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed) as Record<string, unknown>; } catch { /* fall through */ }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try { return JSON.parse(fence[1]) as Record<string, unknown>; } catch { /* swallow */ }
  }
  return null;
}

function questionId(ticker: string, category: QuestionCategory, key: string): string {
  const h = createHash('sha1').update(`${ticker}|${category}|${key}`).digest('hex').slice(0, 10);
  return `cq-${h}`;
}

// =============================================================================
// Challenge brief builder (≤5KB, structured signals only)
// =============================================================================

const SYSTEM_PROMPT = `You are a senior equity research advisor preparing the analyst for a board meeting.
Your job: anticipate the questions a chairman/board member would ask after reading the analyst's
report on the target company, and provide a concise proactive answer for each.

Output strict JSON ONLY — no prose, no markdown, no code fences. Schema:

{
  "questions": [
    {
      "category": "valuation_challenge" | "financial_risk_challenge" | "methodology_challenge" | "management_strategy" | "downside_scenario",
      "question": "<chairman's question, Turkish>",
      "proactive_answer": "<2-3 sentence proactive answer, Turkish>",
      "evidence_refs": ["<reference>", ...],
      "confidence": "high" | "medium" | "low"
    }
  ]
}

Constraints:
- 5 to 7 questions total.
- At least one question per category when the brief has supporting signal.
- Turkish language for question + proactive_answer.
- evidence_refs: cite signals from the brief (e.g., "FA.critical_flag_count=1", "contradiction:cf-abc123", "FTL.primary_method=val_sotp").
- confidence: how confident the proactive answer is given the brief alone.
- proactive_answer: 2-3 sentences, no markdown formatting.`;

export function buildChallengeBrief(
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): string {
  const lines: string[] = [];
  lines.push(`TICKER: ${ticker}`);

  const truth: TruthAssertions | null = readTruthAssertions(accumulatedContext);
  if (truth) {
    const c = truth.classification;
    const subs = c.sub_classifications.length > 0 ? ` sub=[${c.sub_classifications.join(',')}]` : '';
    lines.push(
      `CLASSIFICATION: ${c.sector_canonical}${subs} holding=${c.is_holding} banking=${c.is_banking} ` +
        `confidence=${c.confidence.toFixed(2)}`,
    );
    const w = truth.valuation_methodology;
    lines.push(
      `METHODOLOGY: primary=${w.primary_method} weights=${JSON.stringify(w.weights)} ` +
        `confidence=${w.confidence.toFixed(2)}`,
    );
    if (truth.filing_selection?.selected) {
      lines.push(
        `FILING: id=${truth.filing_selection.selected.filing_id} ` +
          `type=${truth.filing_selection.selected.document_type} ` +
          `confidence=${truth.filing_selection.confidence.toFixed(2)}`,
      );
    }
  }

  const fa = parseJsonLoose(accumulatedContext['financial_analysis_output']);
  if (fa) {
    const conf = String(fa['confidence'] ?? '');
    const critical = Number(fa['critical_flag_count'] ?? 0);
    lines.push(`\nFINANCIAL ANALYSIS:`);
    lines.push(`  confidence: ${conf || 'n/a'}`);
    lines.push(`  critical_flag_count: ${critical}`);
    const flags = Array.isArray(fa['red_flags']) ? (fa['red_flags'] as Array<Record<string, unknown>>) : [];
    const top = flags.slice(0, 3).map((f) => `${f['code'] ?? '?'}(${f['severity'] ?? '?'})`).join(', ');
    if (top) lines.push(`  top_red_flags: [${top}]`);
  }

  const synth = parseJsonLoose(accumulatedContext['strategic_synthesis_output']);
  if (synth) {
    lines.push(`\nSTRATEGIC SYNTHESIS:`);
    lines.push(`  convergence_score: ${synth['convergence_score'] ?? 'n/a'}`);
    lines.push(`  confidence: ${synth['confidence'] ?? 'n/a'}`);
    const divs = Array.isArray(synth['divergences']) ? (synth['divergences'] as unknown[]).map(String) : [];
    if (divs.length > 0) {
      lines.push(`  divergences:`);
      for (const d of divs.slice(0, 3)) lines.push(`    - ${d.slice(0, 200)}`);
    }
  }

  const valuation = parseJsonLoose(accumulatedContext['valuation_agent_output']);
  if (valuation) {
    lines.push(`\nVALUATION:`);
    if (valuation['primary_method']) lines.push(`  primary_method: ${valuation['primary_method']}`);
    if (valuation['recommendation']) lines.push(`  recommendation: ${valuation['recommendation']}`);
    if (valuation['upside_pct'] != null) lines.push(`  upside_pct: ${valuation['upside_pct']}`);
    if (valuation['dcf_target_try'] != null) lines.push(`  dcf_target_try: ${valuation['dcf_target_try']}`);
    if (valuation['sotp_target_try'] != null) lines.push(`  sotp_target_try: ${valuation['sotp_target_try']}`);
  }

  const cReport = accumulatedContext['contradiction_report'] as ContradictionReport | undefined;
  if (cReport && cReport.findings.length > 0) {
    lines.push(`\nCONTRADICTIONS DETECTED (P3.alpha, count=${cReport.finding_count}):`);
    for (const f of cReport.findings.slice(0, 8)) {
      const reasoningClipped = f.reasoning.length > 220 ? f.reasoning.slice(0, 220) + '…' : f.reasoning;
      lines.push(`  - id=${f.id} [${f.severity}] ${f.type}: ${reasoningClipped}`);
    }
  } else {
    lines.push(`\nCONTRADICTIONS DETECTED: none`);
  }

  let brief = lines.join('\n');
  // Hard cap at BRIEF_BYTE_CAP — truncate from the end with a marker
  if (brief.length > BRIEF_BYTE_CAP) {
    brief = brief.slice(0, BRIEF_BYTE_CAP - 60).trimEnd() + '\n\n[... brief truncated to 5KB cap ...]';
  }
  return brief;
}

function buildPrompt(brief: string): string {
  return `${SYSTEM_PROMPT}\n\n=== CHALLENGE BRIEF ===\n${brief}\n=== END BRIEF ===\n\nProduce the JSON now.`;
}

// =============================================================================
// LLM output parser
// =============================================================================

const VALID_CATS = new Set<QuestionCategory>(ALL_CATEGORIES);
const VALID_CONF = new Set<QuestionConfidence>(['high', 'medium', 'low']);

function parseLlmOutput(
  raw: string,
  ticker: string,
): { questions: ChairmanQuestion[] } | { error: string } {
  if (!raw || !raw.trim()) return { error: 'empty output' };

  // Try to locate the first JSON object in the output
  let payload: Record<string, unknown> | null = parseJsonLoose(raw);
  if (!payload) {
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try { payload = JSON.parse(objMatch[0]) as Record<string, unknown>; } catch { /* swallow */ }
    }
  }
  if (!payload) return { error: 'JSON parse failed' };

  const rawQs = payload['questions'];
  if (!Array.isArray(rawQs)) return { error: 'missing questions[] array' };

  const out: ChairmanQuestion[] = [];
  let idx = 0;
  for (const r of rawQs) {
    if (out.length >= MAX_QUESTIONS) break;
    if (!r || typeof r !== 'object') continue;
    const obj = r as Record<string, unknown>;
    const category = obj['category'];
    const question = obj['question'];
    const answer = obj['proactive_answer'];
    const confidence = obj['confidence'];
    if (typeof category !== 'string' || !VALID_CATS.has(category as QuestionCategory)) continue;
    if (typeof question !== 'string' || !question.trim()) continue;
    if (typeof answer !== 'string' || !answer.trim()) continue;
    const conf = (typeof confidence === 'string' && VALID_CONF.has(confidence as QuestionConfidence))
      ? (confidence as QuestionConfidence)
      : 'medium';
    const refs = Array.isArray(obj['evidence_refs'])
      ? (obj['evidence_refs'] as unknown[]).filter((x): x is string => typeof x === 'string' && x.length > 0)
      : [];
    out.push({
      id: questionId(ticker, category as QuestionCategory, `llm-${idx}-${question.slice(0, 50)}`),
      category: category as QuestionCategory,
      question: question.trim(),
      proactive_answer: answer.trim(),
      evidence_refs: refs,
      confidence: conf,
    });
    idx++;
  }

  if (out.length === 0) return { error: 'no valid questions in payload' };
  return { questions: out };
}

// =============================================================================
// Deterministic fallback — one Q per contradiction finding
// =============================================================================

const CONTRADICTION_TO_CATEGORY: Record<string, QuestionCategory> = {
  valuation_method_mismatch: 'methodology_challenge',
  target_spread: 'valuation_challenge',
  thesis_vs_valuation: 'valuation_challenge',
  confidence_vs_conviction: 'methodology_challenge',
  financial_red_flag_vs_narrative: 'financial_risk_challenge',
  synthesis_divergence: 'methodology_challenge',
};

function deterministicFallback(
  ticker: string,
  ctx: Record<string, unknown>,
): ChairmanQuestion[] {
  const out: ChairmanQuestion[] = [];
  const cReport = ctx['contradiction_report'] as ContradictionReport | undefined;
  const findings = cReport?.findings ?? [];
  let idx = 0;
  for (const f of findings) {
    if (out.length >= MAX_QUESTIONS) break;
    const cat = CONTRADICTION_TO_CATEGORY[f.type] ?? 'methodology_challenge';
    out.push({
      id: questionId(ticker, cat, `det-${idx}-${f.id}`),
      category: cat,
      question: chairmanizeFromFinding(f),
      proactive_answer: answerFromFinding(f),
      evidence_refs: [`contradiction:${f.id}`],
      confidence: 'medium',
    });
    idx++;
  }
  return out;
}

function chairmanizeFromFinding(f: ContradictionFinding): string {
  switch (f.type) {
    case 'valuation_method_mismatch':
      return `Değerleme metodolojisi neden FTL önerisinden farklı seçildi? (${f.title})`;
    case 'target_spread':
      return `DCF ve SOTP hedef fiyatları arasındaki fark nasıl uzlaştırılıyor? (${f.title})`;
    case 'thesis_vs_valuation':
      return `Tavsiye ile hedef fiyat arasındaki tutarsızlık nasıl açıklanır? (${f.title})`;
    case 'confidence_vs_conviction':
      return `Finansal analiz düşük güvenirlik bildirirken sentez yüksek convicted — bu çelişki nasıl çözülür?`;
    case 'financial_red_flag_vs_narrative':
      return `Finansal analiz kritik bayrak verdi; tezde bu bayrak nasıl ele alındı?`;
    case 'synthesis_divergence':
      return `Sentez katmanı bir divergence tespit etti — yatırım kararı nasıl etkileniyor?`;
    default:
      return `Raporda tespit edilen tutarsızlık: ${f.title}`;
  }
}

function answerFromFinding(f: ContradictionFinding): string {
  return (
    `Tespit (${f.severity}): ${f.reasoning}` +
    (f.suggested_resolution ? ` Önerilen çözüm: ${f.suggested_resolution}` : '')
  );
}

// =============================================================================
// Aggregator (main entry)
// =============================================================================

export async function runChairmanAnticipator(
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<ChairmanQuestionReport> {
  const warnings: string[] = [];
  const generatedAt = new Date().toISOString();
  const brief = buildChallengeBrief(ticker, accumulatedContext);
  const prompt = buildPrompt(brief);

  let questions: ChairmanQuestion[] = [];
  let source: 'llm' | 'fallback_deterministic' = 'fallback_deterministic';
  let llmDurationMs: number | null = null;
  let llmInputTokens: number | null = null;
  let llmOutputTokens: number | null = null;
  let llmCostUsd: number | null = null;
  let llmModel: string | null = null;

  let llmResult: ProviderCallResult | null = null;
  try {
    llmResult = await activeRunner({ prompt, model: MODEL, timeoutMs: TIMEOUT_MS });
    llmModel = MODEL;
    llmDurationMs = llmResult.durationMs;
    llmCostUsd = llmResult.costUsd;
    // Provider returns an aggregate tokens field; we don't have a clean split.
    llmInputTokens = null;
    llmOutputTokens = llmResult.tokensUsed ?? null;
  } catch (err) {
    warnings.push(`llm_runner_threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (llmResult && llmResult.success) {
    const parsed = parseLlmOutput(llmResult.output, ticker);
    if ('questions' in parsed) {
      questions = parsed.questions;
      source = 'llm';
    } else {
      warnings.push(`llm_output_parse_failed: ${parsed.error}`);
    }
  } else if (llmResult && !llmResult.success) {
    warnings.push(`llm_call_failed: ${llmResult.errorType ?? 'unknown'} ${llmResult.error ?? ''}`.trim());
  }

  if (source !== 'llm') {
    questions = deterministicFallback(ticker, accumulatedContext);
    if (questions.length === 0) {
      warnings.push('no contradictions to fall back on; question_count=0');
    }
  }

  const byCategory = ALL_CATEGORIES.reduce<Record<QuestionCategory, number>>((acc, c) => {
    acc[c] = 0;
    return acc;
  }, {} as Record<QuestionCategory, number>);
  for (const q of questions) byCategory[q.category]++;

  // Surface empty categories as warnings only when source=llm (fallback may legitimately leave categories empty)
  if (source === 'llm') {
    for (const c of ALL_CATEGORIES) {
      if (byCategory[c] === 0) warnings.push(`category_empty:${c}`);
    }
  }

  const report: ChairmanQuestionReport = {
    ticker,
    generated_at: generatedAt,
    question_count: questions.length,
    by_category: byCategory,
    questions,
    source,
    llm_model: llmModel,
    llm_duration_ms: llmDurationMs,
    llm_input_tokens: llmInputTokens,
    llm_output_tokens: llmOutputTokens,
    llm_cost_usd: llmCostUsd,
    warnings,
  };

  accumulatedContext[CHAIRMAN_CONTEXT_KEYS.REPORT] = report;
  accumulatedContext[CHAIRMAN_CONTEXT_KEYS.REPORT_JSON] = JSON.stringify(report);
  return report;
}

// =============================================================================
// Log helper
// =============================================================================

export function logChairmanAnticipatorSummary(report: ChairmanQuestionReport): void {
  const cat = report.by_category;
  const catSummary =
    `vc:${cat.valuation_challenge} frc:${cat.financial_risk_challenge} ` +
    `mc:${cat.methodology_challenge} ms:${cat.management_strategy} ds:${cat.downside_scenario}`;
  const sourcePart =
    report.source === 'llm'
      ? `source=llm dur=${Math.round((report.llm_duration_ms ?? 0) / 1000)}s cost=$${(report.llm_cost_usd ?? 0).toFixed(4)}`
      : `source=fallback_deterministic`;
  console.log(
    `[chairman-anticipator] ticker=${report.ticker} questions=${report.question_count} ` +
      `by_cat={${catSummary}} ${sourcePart} warnings=${report.warnings.length}`,
  );
  for (const q of report.questions) {
    console.log(`[chairman-anticipator]   [${q.confidence}] ${q.category}: ${q.question.slice(0, 100)}${q.question.length > 100 ? '…' : ''}`);
  }
  if (report.warnings.length > 0) {
    for (const w of report.warnings) console.log(`[chairman-anticipator]   warn: ${w}`);
  }
}
