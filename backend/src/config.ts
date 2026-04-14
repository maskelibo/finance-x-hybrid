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
export const CODEX_PATH = process.env.CODEX_PATH || CLAUDE_PATH;

// Server
export const PORT = parseInt(process.env.PORT || '4000', 10);

// Model configuration — agent bazli model secimi
// Basit isler (veri toplama, parse, reconciliation) ucuz modelle yapilir
// Analiz, sentez, CEO ise pahalı modelle yapilir
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
export const CLAUDE_MODEL_LIGHT = process.env.CLAUDE_MODEL_LIGHT || 'claude-haiku-4-5';
export const CODEX_MODEL = process.env.CODEX_MODEL || 'gpt-5.4';
export const CODEX_MODEL_LIGHT = process.env.CODEX_MODEL_LIGHT || 'gpt-5.4-mini';
export const LLM_PRIMARY_PROVIDER = (process.env.LLM_PRIMARY_PROVIDER || 'claude').trim();
export const LLM_FALLBACK_PROVIDER = (process.env.LLM_FALLBACK_PROVIDER || 'codex').trim();

// Agent -> model mapping: light model kullanacak agent'lar
// Ağır model (Sonnet/GPT-5.4): financial_analysis, strategic_synthesis, valuation_agent,
//   qa_review, ceo, final_summary, macro_analysis, context_extraction
// Light model (Haiku/GPT-5.4-mini): veri toplama, parse, sınıflandırma, formatlama
const LIGHT_MODEL_AGENTS = new Set([
  'data_collection',
  'parse_standardization',
  'reconciliation',
  'event_classification',
  'event_timeline_alert',
  'event_impact_mapper',
  'kap_watch',
  'sentiment_news_agent',
  'analyst_consensus_agent',
  'report_formatter',
  'esg_agent',
  'sector_competition',
  'technical_analysis',
  'coo',            // Pre-flight check + delivery check
]);

export function getModelForAgent(agentId: string, provider: 'claude' | 'codex' = 'claude'): string {
  const useLightModel = LIGHT_MODEL_AGENTS.has(agentId);
  if (provider === 'codex') {
    return useLightModel ? CODEX_MODEL_LIGHT : CODEX_MODEL;
  }
  return useLightModel ? CLAUDE_MODEL_LIGHT : CLAUDE_MODEL;
}

// Timeouts (ms)
export const STUCK_AGENT_THRESHOLD_MS = parseInt(process.env.STUCK_AGENT_THRESHOLD_MS || String(25 * 60 * 1000), 10);
export const CONTEXT_CHAR_LIMIT = parseInt(process.env.CONTEXT_CHAR_LIMIT || '15000', 10);
export const HEARTBEAT_INTERVAL_MIN = parseInt(process.env.HEARTBEAT_INTERVAL_MIN || '30', 10);
export const WATCHDOG_INTERVAL_MIN = parseInt(process.env.WATCHDOG_INTERVAL_MIN || '2', 10);
export const NIGHT_TRAINING_HOUR_UTC = parseInt(process.env.NIGHT_TRAINING_HOUR_UTC || '23', 10);

export const CLAUDE_SPAWN_ENV = {
  ...process.env,
  PATH: CLAUDE_PATH,
};

export const CODEX_SPAWN_ENV = {
  ...process.env,
  PATH: CODEX_PATH,
};

export const CLAUDE_PERMISSION_MODE = (process.env.CLAUDE_PERMISSION_MODE || 'bypassPermissions').trim();

export const CLAUDE_SPAWN_OPTIONS = {
  cwd: PROJECT_ROOT,
  env: CLAUDE_SPAWN_ENV,
};

export const CODEX_SPAWN_OPTIONS = {
  cwd: PROJECT_ROOT,
  env: CODEX_SPAWN_ENV,
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
