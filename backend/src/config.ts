import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

/**
 * Central configuration for Finance X backend.
 * All paths derived from PROJECT_ROOT — override via FINANCE_X_ROOT env var.
 */
export const PROJECT_ROOT = process.env.FINANCE_X_ROOT || path.resolve(__dirname, '../..');

export const AGENTS_ROOT = path.join(PROJECT_ROOT, 'agents');

export const CLAUDE_PATH = process.env.CLAUDE_PATH || '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin';

// Server
export const PORT = parseInt(process.env.PORT || '4000', 10);

// Model configuration — agent bazli model secimi
// Basit isler (veri toplama, parse, reconciliation) ucuz modelle yapilir
// Analiz, sentez, CEO ise pahalı modelle yapilir
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
export const CLAUDE_MODEL_LIGHT = process.env.CLAUDE_MODEL_LIGHT || 'claude-haiku-4-5';
export const LLM_PRIMARY_PROVIDER = 'claude' as const;

// Agent -> model mapping: light model kullanacak agent'lar
// Ağır model (Sonnet/GPT-5.4): financial_analysis, strategic_synthesis, valuation_agent,
//   qa_review, ceo, final_summary, macro_analysis, context_extraction
// Light model (Haiku/GPT-5.4-mini): veri toplama, parse, sınıflandırma, formatlama
const LIGHT_MODEL_AGENTS = new Set([
  'event_classification',
  'kap_watch',
  'sentiment_news_agent',
  'analyst_consensus_agent',
  'esg_agent',
  'technical_analysis',
]);

export function getModelForAgent(agentId: string): string {
  const useLightModel = LIGHT_MODEL_AGENTS.has(agentId);
  return useLightModel ? CLAUDE_MODEL_LIGHT : CLAUDE_MODEL;
}

// Timeouts (ms) — Agent bazlı kalibrasyon (baseline verilerinden: max_observed × 2)
export const STUCK_AGENT_THRESHOLD_MS = parseInt(process.env.STUCK_AGENT_THRESHOLD_MS || String(25 * 60 * 1000), 10);

// Agent-specific timeout overrides (ms) — generous limits for web research + large context
const AGENT_TIMEOUT_OVERRIDES: Record<string, number> = {
  // Ağır agent'lar — web research + büyük context
  financial_analysis: 45 * 60 * 1000,   // revision loop dahil
  final_summary:      35 * 60 * 1000,   // tüm upstream'i sentezliyor
  context_extraction: 30 * 60 * 1000,   // web research ağır
  macro_analysis:     30 * 60 * 1000,   // web research
  valuation_agent:    30 * 60 * 1000,   // DCF + sensitivity hesabı
  strategic_synthesis:25 * 60 * 1000,   // tüm upstream sentez
  report_formatter:   35 * 60 * 1000,   // 100KB HTML üretimi
  qa_review:          25 * 60 * 1000,   // revision context büyük
  // Orta agent'lar
  sector_competition: 25 * 60 * 1000,   // web research + peer analysis
  technical_analysis: 25 * 60 * 1000,   // web research
  esg_agent:          20 * 60 * 1000,   // web research
  event_impact_mapper:20 * 60 * 1000,
  reconciliation:     20 * 60 * 1000,   // revision loop dahil
  // Hafif agent'lar
  data_collection:    20 * 60 * 1000,   // web scraping
  parse_standardization: 20 * 60 * 1000, // PDF extraction
  ceo:                20 * 60 * 1000,
  kap_watch:          15 * 60 * 1000,
  sentiment_news_agent: 15 * 60 * 1000,
  analyst_consensus_agent: 15 * 60 * 1000,
  event_classification: 10 * 60 * 1000,
  event_timeline_alert: 10 * 60 * 1000,
  coo:                10 * 60 * 1000,
};

export function getStuckThresholdForAgent(agentId: string): number {
  return AGENT_TIMEOUT_OVERRIDES[agentId] ?? STUCK_AGENT_THRESHOLD_MS;
}
export const CONTEXT_CHAR_LIMIT = parseInt(process.env.CONTEXT_CHAR_LIMIT || '15000', 10);

// Feature flags — ADIM 4
export const DIGEST_MODE = (process.env.DIGEST_MODE || 'true') === 'true';
export const TARGETED_KNOWLEDGE_INJECTION = (process.env.TARGETED_KNOWLEDGE_INJECTION || 'true') === 'true';

// Feature flag — ADIM 7: Deterministic financial engine
export const FINANCIAL_ENGINE_ENABLED = (process.env.FINANCIAL_ENGINE_ENABLED || 'true') === 'true';
export const BYPASS_CEO_FOR_TESTS = (process.env.BYPASS_CEO_FOR_TESTS || 'false') === 'true';

// Feature flag — ADIM 8: Structured report payload for formatter
export const REPORT_PAYLOAD_MODE = (process.env.REPORT_PAYLOAD_MODE || 'true') === 'true';

// Feature flag — Formatter minimal context mode.
// When true, buildReportPayload discards low-value agent excerpts and ships only:
//   metadata + engineResults + final_summary (full, 30K) + canonical_fact_pack + brand identity (3K)
// Reduces payload from ~48K to ~35K max, improving formatter reliability and truncation risk.
export const FORMATTER_MINIMAL_CONTEXT = (process.env.FORMATTER_MINIMAL_CONTEXT || 'true') === 'true';

// Feature flag — ADIM 9: Optimized pipeline (true = new parallel phases, false = legacy 11-phase)
export const OPTIMIZED_PIPELINE = (process.env.OPTIMIZED_PIPELINE || 'true') === 'true';

// Feature flag — ADIM 12: Post-session regression eval (observe mode — logs result, never blocks)
export const REGRESSION_EVAL_ENABLED = (process.env.REGRESSION_EVAL_ENABLED || 'true') === 'true';

// ---------------------------------------------------------------------
// Feature flags — Python hybrid pipeline (Wave 9 migration flags)
//
// Each flag swaps the matching LLM agent for its deterministic Python
// runner in `python-services/src/financex/`. All default to 'false' so
// flipping the switch in .env turns on a single runner at a time —
// gives us per-agent rollback if a prod issue shows up.
// ---------------------------------------------------------------------
export const PYTHON_PIPELINE_ENABLED = (process.env.PYTHON_PIPELINE_ENABLED || 'false') === 'true';
export const PYTHON_KAP_WATCH_ENABLED = (process.env.PYTHON_KAP_WATCH_ENABLED || 'false') === 'true';
export const PYTHON_DATA_COLLECTION_ENABLED = (process.env.PYTHON_DATA_COLLECTION_ENABLED || 'false') === 'true';
export const PYTHON_PARSE_STANDARDIZATION_ENABLED = (process.env.PYTHON_PARSE_STANDARDIZATION_ENABLED || 'false') === 'true';
export const PYTHON_RECONCILIATION_ENABLED = (process.env.PYTHON_RECONCILIATION_ENABLED || 'false') === 'true';
export const PYTHON_FINANCIAL_ANALYSIS_ENABLED = (process.env.PYTHON_FINANCIAL_ANALYSIS_ENABLED || 'false') === 'true';
export const PYTHON_TECHNICAL_ANALYSIS_ENABLED = (process.env.PYTHON_TECHNICAL_ANALYSIS_ENABLED || 'false') === 'true';
export const PYTHON_TECHNICAL_BARS = parseInt(process.env.PYTHON_TECHNICAL_BARS || '250', 10);
export const PYTHON_MACRO_ANALYSIS_ENABLED = (process.env.PYTHON_MACRO_ANALYSIS_ENABLED || 'false') === 'true';
export const PYTHON_ANALYST_CONSENSUS_ENABLED = (process.env.PYTHON_ANALYST_CONSENSUS_ENABLED || 'false') === 'true';
export const PYTHON_SENTIMENT_NEWS_ENABLED = (process.env.PYTHON_SENTIMENT_NEWS_ENABLED || 'false') === 'true';
export const PYTHON_ESG_ENABLED = (process.env.PYTHON_ESG_ENABLED || 'false') === 'true';
export const PYTHON_EVENT_CLASSIFICATION_ENABLED = (process.env.PYTHON_EVENT_CLASSIFICATION_ENABLED || 'false') === 'true';
export const PYTHON_EVENT_IMPACT_MAPPER_ENABLED = (process.env.PYTHON_EVENT_IMPACT_MAPPER_ENABLED || 'false') === 'true';
export const PYTHON_EVENT_TIMELINE_ALERT_ENABLED = (process.env.PYTHON_EVENT_TIMELINE_ALERT_ENABLED || 'false') === 'true';
export const PYTHON_VALUATION_ENABLED = (process.env.PYTHON_VALUATION_ENABLED || 'false') === 'true';
export const PYTHON_STRATEGIC_SYNTHESIS_ENABLED = (process.env.PYTHON_STRATEGIC_SYNTHESIS_ENABLED || 'false') === 'true';
export const PYTHON_QA_REVIEW_ENABLED = (process.env.PYTHON_QA_REVIEW_ENABLED || 'false') === 'true';
export const PYTHON_COO_ENABLED = (process.env.PYTHON_COO_ENABLED || 'false') === 'true';
export const PYTHON_REPORT_FORMATTER_ENABLED = (process.env.PYTHON_REPORT_FORMATTER_ENABLED || 'false') === 'true';
export const PYTHON_SECTOR_COMPETITION_ENABLED = (process.env.PYTHON_SECTOR_COMPETITION_ENABLED || 'false') === 'true';

// Stall detection: if provider produces no output for this many seconds, kill
export const PROVIDER_STALL_TIMEOUT_S = parseInt(process.env.PROVIDER_STALL_TIMEOUT_S || '900', 10);

// Feature flag — ADIM 5: Schema validation mode ('off' | 'warn')
// 'warn' = validate + log warnings, pipeline devam eder
// 'off' = validation atlanır
// Schema validation modes:
// 'off'        = no validation
// 'warn'       = validate + log, pipeline continues normally
// 'soft_block' = validate + log + mark degraded for critical agents, pipeline continues but downstream sees flag
export const SCHEMA_VALIDATION_MODE = (process.env.SCHEMA_VALIDATION_MODE || 'warn') as 'off' | 'warn' | 'soft_block';
// Agents where soft_block applies (degraded flag set). Only used when mode='soft_block'.
export const SCHEMA_SOFT_BLOCK_AGENTS = new Set((process.env.SCHEMA_SOFT_BLOCK_AGENTS || 'financial_analysis,reconciliation').split(',').map(s => s.trim()));

export const HEARTBEAT_INTERVAL_MIN = parseInt(process.env.HEARTBEAT_INTERVAL_MIN || '30', 10);
export const WATCHDOG_INTERVAL_MIN = parseInt(process.env.WATCHDOG_INTERVAL_MIN || '2', 10);
export const NIGHT_TRAINING_HOUR_UTC = parseInt(process.env.NIGHT_TRAINING_HOUR_UTC || '23', 10);

export const CLAUDE_SPAWN_ENV = {
  ...process.env,
  PATH: CLAUDE_PATH,
};

export const CLAUDE_PERMISSION_MODE = (process.env.CLAUDE_PERMISSION_MODE || 'bypassPermissions').trim();

export const CLAUDE_SPAWN_OPTIONS = {
  cwd: PROJECT_ROOT,
  env: CLAUDE_SPAWN_ENV,
};

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://localhost:3000',
  `http://localhost:${PORT}`,
];

export const ALLOWED_ORIGINS = (process.env.FINANCE_X_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (ALLOWED_ORIGINS.length === 0) {
  ALLOWED_ORIGINS.push(...defaultAllowedOrigins);
}
