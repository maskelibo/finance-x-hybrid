import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// Agent -> model mapping: light model kullanacak agent'lar
const LIGHT_MODEL_AGENTS = new Set([
  'data_collection',
  'parse_standardization',
  'reconciliation',
  'event_classification',
  'event_timeline_alert',
  'kap_watch',
  'sentiment_news_agent',
  'analyst_consensus_agent',
  'report_formatter',
]);

export function getModelForAgent(agentId: string): string {
  return LIGHT_MODEL_AGENTS.has(agentId) ? CLAUDE_MODEL_LIGHT : CLAUDE_MODEL;
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

export const CLAUDE_SPAWN_OPTIONS = {
  cwd: PROJECT_ROOT,
  env: CLAUDE_SPAWN_ENV,
};
