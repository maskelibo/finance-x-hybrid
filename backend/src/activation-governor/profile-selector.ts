/**
 * P9 Wave 1 — Execution profile selection + session classifier + token budget.
 *
 * Pure logic. No DB, no LLM, no I/O.
 *
 * 4 profiles: LIGHT, STANDARD, FULL, INSTITUTIONAL.
 * Profile is selected by complexity total (0-100) with optional
 * mode and session-class overrides.
 *
 * CORE_PROTECTED_AGENTS: agents that MUST run in every profile,
 * including LIGHT. Without them the report has no analytical value.
 *
 * Token budgets are cumulative session caps (all LLM calls summed).
 * checkTokenBudget returns a 4-tier action: continue / alarm_only /
 * reduce_optional / hard_stop. Hard stop triggers only at 2x budget
 * (runaway / bug indicator) so normal heavy workloads aren't blocked.
 */

import type { ComplexityScore } from './complexity-scorer.js';

export type ExecutionProfile = 'LIGHT' | 'STANDARD' | 'FULL' | 'INSTITUTIONAL';

export interface ActivationPlan {
  profile: ExecutionProfile;
  complexity_score: number;
  why_selected: string;
  required_agents: string[];
  optional_agents: string[];
  skipped_agents: string[];
  required_sub_agents: string[];
  skipped_sub_agents: string[];
  enable_truth_arbitration: boolean;
  enable_citation_enforcement: boolean;
  enable_contradiction_full_scan: boolean;
  enable_chairman_questions: boolean;
  enable_full_quality_governor: boolean;
  enable_deep_shadow_compare: boolean;
  skipped_layers: string[];
  token_budget: number;
  estimated_cost_usd: number;
  estimated_latency_seconds: number;
}

export type SessionClassType =
  | 'full_institutional'
  | 'delta_update'
  | 'event_flash'
  | 'earnings_preview'
  | 'valuation_refresh'
  | 'unspecified';

export interface SessionClass {
  type: SessionClassType;
  confidence: number;
  signals: string[];
}

export const CORE_PROTECTED_AGENTS: ReadonlyArray<string> = Object.freeze([
  'data_collection',
  'parse_standardization',
  'reconciliation',
  'financial_analysis',
  'sector_competition',
  'valuation_agent',
  'macro_analysis',
  'final_summary',
  'report_formatter',
]);

const TOKEN_BUDGETS: Record<ExecutionProfile, number> = {
  LIGHT: 500_000,
  STANDARD: 1_500_000,
  FULL: 3_000_000,
  INSTITUTIONAL: 5_000_000,
};

export function getTokenBudget(profile: ExecutionProfile): number {
  return TOKEN_BUDGETS[profile];
}

export type TokenBudgetAction = 'continue' | 'alarm_only' | 'reduce_optional' | 'hard_stop';

export interface TokenBudgetResult {
  budget: number;
  used_pct: number;
  action: TokenBudgetAction;
  disabled_layers?: string[];
  reason?: string;
}

export function checkTokenBudget(used: number, profile: ExecutionProfile): TokenBudgetResult {
  const budget = getTokenBudget(profile);
  const pct = budget === 0 ? 0 : used / budget;
  if (pct < 1.0) return { budget, used_pct: pct, action: 'continue' };
  if (pct < 1.5) {
    return {
      budget,
      used_pct: pct,
      action: 'alarm_only',
      reason: `Budget ${Math.round(pct * 100)}% — log only, analytical workload continues`,
    };
  }
  if (pct < 2.0) {
    return {
      budget,
      used_pct: pct,
      action: 'reduce_optional',
      disabled_layers: [
        'chairman_questions',
        'esg_agent',
        'sentiment_news_agent',
        'external_research_agent',
        'synthetic_company_generator',
        'deep_shadow_compare',
      ],
      reason: `Budget ${Math.round(pct * 100)}% — optional layers disabled`,
    };
  }
  return {
    budget,
    used_pct: pct,
    action: 'hard_stop',
    reason: `Budget ${Math.round(pct * 100)}% — runaway detection, session terminated`,
  };
}

// ---------------------------------------------------------------------------
// classifySession
// ---------------------------------------------------------------------------

export function classifySession(userRequest: string | undefined, _ticker: string): SessionClass {
  if (typeof userRequest !== 'string' || userRequest.trim().length === 0) {
    return { type: 'unspecified', confidence: 0, signals: ['no user request provided'] };
  }
  const text = userRequest;
  const signals: string[] = [];

  if (
    /\b(yeni|acil|flash|breaking|just|şimdi)\s+(disclosure|bildirim|haber|event|olay|announcement|kap)/i.test(text) ||
    /\b(material\s+event|önemli\s+gelişme|material\s+disclosure)/i.test(text)
  ) {
    signals.push('event_flash keywords');
    return { type: 'event_flash', confidence: 0.9, signals };
  }
  if (
    /\b(kazanç|earnings|finansal\s+sonuç|quarterly\s+result|çeyrek\s+sonuç)\s+(önce|preview|before|expectation|beklenti)/i.test(
      text,
    ) ||
    /\b(Q[1-4]\s+önce|earnings\s+call\s+önce)/i.test(text)
  ) {
    signals.push('earnings_preview keywords');
    return { type: 'earnings_preview', confidence: 0.85, signals };
  }
  if (
    /\b(hedef\s+fiyat|target\s+price|valuation)\s+(güncel|refresh|update|yenile)/i.test(text) ||
    /\b(fiyat\s+değişti|price\s+changed|valuation\s+only)/i.test(text) ||
    /\b(sadece\s+değerleme|only\s+valuation)/i.test(text)
  ) {
    signals.push('valuation_refresh keywords');
    return { type: 'valuation_refresh', confidence: 0.85, signals };
  }
  if (
    /\b(delta|kısa\s+güncelleme|short\s+update|quick\s+update|incremental)/i.test(text) ||
    /\b(sadece\s+yeni|only\s+new|just\s+updates|son\s+değişiklik)/i.test(text)
  ) {
    signals.push('delta_update keywords');
    return { type: 'delta_update', confidence: 0.85, signals };
  }
  if (
    /\b(tam\s+analiz|full\s+analysis|deep\s+dive|kurumsal\s+rapor|institutional\s+report|12\s+bölüm)/i.test(text) ||
    /\b(comprehensive|detaylı\s+analiz|full\s+report)/i.test(text)
  ) {
    signals.push('full_institutional keywords');
    return { type: 'full_institutional', confidence: 0.95, signals };
  }
  signals.push('no clear pattern, defaulting to full_institutional');
  return { type: 'full_institutional', confidence: 0.3, signals };
}

// ---------------------------------------------------------------------------
// selectProfile + buildPlan
// ---------------------------------------------------------------------------

export function selectProfile(
  complexity: ComplexityScore,
  mode: string,
  _sessionClass?: SessionClass,
): ActivationPlan {
  const total = complexity.total;
  let profile: ExecutionProfile;
  let why: string;

  if (total <= 30) {
    profile = 'LIGHT';
    why = `Low complexity (${total}/100) — simple structure, minimal regulatory, single business.`;
  } else if (total <= 55) {
    profile = 'STANDARD';
    why = `Medium complexity (${total}/100) — typical BIST analysis.`;
  } else if (total <= 80) {
    profile = 'FULL';
    why = `High complexity (${total}/100) — multi-segment or cyclical sector, material IAS 29 impact likely.`;
  } else {
    profile = 'INSTITUTIONAL';
    why = `Very high complexity (${total}/100) — holding/banking with peak disclosure activity, all quality layers required.`;
  }

  if (mode === 'deep_dive' && profile === 'LIGHT') {
    profile = 'STANDARD';
    why += ' | Mode=deep_dive upgraded LIGHT->STANDARD.';
  }
  if (mode === 'fast_screening' && (profile === 'FULL' || profile === 'INSTITUTIONAL')) {
    profile = 'STANDARD';
    why += ' | Mode=fast_screening downgraded -> STANDARD.';
  }

  return buildPlan(profile, complexity, why);
}

function buildPlan(profile: ExecutionProfile, complexity: ComplexityScore, why: string): ActivationPlan {
  const coreAgents = [
    'ceo',
    'coo',
    'data_collection',
    'parse_standardization',
    'reconciliation',
    'context_extraction',
    'financial_analysis',
    'sector_competition',
    'valuation_agent',
    'macro_analysis',
    'qa_review',
    'final_summary',
    'report_formatter',
  ];

  switch (profile) {
    case 'LIGHT':
      return {
        profile,
        complexity_score: complexity.total,
        why_selected: why,
        required_agents: coreAgents,
        optional_agents: [],
        skipped_agents: [
          'esg_agent',
          'sentiment_news_agent',
          'analyst_consensus_agent',
          'technical_analysis',
          'event_impact_mapper',
          'strategic_synthesis',
          'external_research_agent',
        ],
        required_sub_agents: [],
        skipped_sub_agents: ['*'],
        enable_truth_arbitration: false,
        enable_citation_enforcement: false,
        enable_contradiction_full_scan: false,
        enable_chairman_questions: false,
        enable_full_quality_governor: false,
        enable_deep_shadow_compare: false,
        skipped_layers: [
          'truth_arbitration',
          'citation_enforcement',
          'contradiction_full_scan',
          'chairman_questions',
          'full_quality_governor',
          'shadow_compare',
        ],
        token_budget: getTokenBudget(profile),
        estimated_cost_usd: 0.55,
        estimated_latency_seconds: 520,
      };
    case 'STANDARD':
      return {
        profile,
        complexity_score: complexity.total,
        why_selected: why,
        required_agents: [...coreAgents, 'technical_analysis', 'strategic_synthesis'],
        optional_agents: ['event_impact_mapper', 'sentiment_news_agent'],
        skipped_agents: ['esg_agent', 'analyst_consensus_agent', 'external_research_agent'],
        required_sub_agents: ['fa_profitability', 'fa_working_capital', 'fa_leverage_liquidity', 'fa_cash_flow'],
        skipped_sub_agents: [
          'fa_sector_kpi',
          'val_sotp',
          'val_scenario_builder',
          'ma_geopolitical_risk',
          'sc_structure_analyst',
        ],
        enable_truth_arbitration: false,
        enable_citation_enforcement: true,
        enable_contradiction_full_scan: true,
        enable_chairman_questions: false,
        enable_full_quality_governor: true,
        enable_deep_shadow_compare: false,
        skipped_layers: ['truth_arbitration', 'chairman_questions', 'deep_shadow_compare'],
        token_budget: getTokenBudget(profile),
        estimated_cost_usd: 1.2,
        estimated_latency_seconds: 1500,
      };
    case 'FULL':
      return {
        profile,
        complexity_score: complexity.total,
        why_selected: why,
        required_agents: [
          ...coreAgents,
          'technical_analysis',
          'strategic_synthesis',
          'event_impact_mapper',
          'esg_agent',
          'sentiment_news_agent',
          'analyst_consensus_agent',
          'knowledge_base_agent',
          'document_evidence_agent',
        ],
        optional_agents: ['external_research_agent'],
        skipped_agents: [],
        required_sub_agents: ['*'],
        skipped_sub_agents: ['ss_signal_merger', 'ss_contradiction_flag', 'ss_thesis_writer'],
        enable_truth_arbitration: true,
        enable_citation_enforcement: true,
        enable_contradiction_full_scan: true,
        enable_chairman_questions: true,
        enable_full_quality_governor: true,
        enable_deep_shadow_compare: false,
        skipped_layers: ['deep_shadow_compare'],
        token_budget: getTokenBudget(profile),
        estimated_cost_usd: 2.8,
        estimated_latency_seconds: 2400,
      };
    case 'INSTITUTIONAL':
      return {
        profile,
        complexity_score: complexity.total,
        why_selected: why,
        required_agents: [
          ...coreAgents,
          'technical_analysis',
          'strategic_synthesis',
          'event_impact_mapper',
          'esg_agent',
          'sentiment_news_agent',
          'analyst_consensus_agent',
          'research_brief_agent',
          'knowledge_base_agent',
          'document_evidence_agent',
          'external_research_agent',
        ],
        optional_agents: [],
        skipped_agents: [],
        required_sub_agents: ['*'],
        skipped_sub_agents: [],
        enable_truth_arbitration: true,
        enable_citation_enforcement: true,
        enable_contradiction_full_scan: true,
        enable_chairman_questions: true,
        enable_full_quality_governor: true,
        enable_deep_shadow_compare: true,
        skipped_layers: [],
        token_budget: getTokenBudget(profile),
        estimated_cost_usd: 4.5,
        estimated_latency_seconds: 4800,
      };
  }
}

export const _CORE_PROTECTED_AGENTS_FOR_TESTS = CORE_PROTECTED_AGENTS;
export const _TOKEN_BUDGETS_FOR_TESTS = TOKEN_BUDGETS;
