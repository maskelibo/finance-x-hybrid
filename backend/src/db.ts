import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../data/financex.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS analysis_sessions (
    id TEXT PRIMARY KEY,
    ticker TEXT NOT NULL,
    company_name TEXT,
    runtime_mode TEXT NOT NULL,
    selected_layers TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    current_phase TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    total_cost_usd REAL DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    overall_score REAL,
    error_message TEXT
  );

  CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    agent_display_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    provider_used TEXT,
    started_at TEXT,
    completed_at TEXT,
    duration_ms INTEGER,
    input_prompt TEXT,
    output_text TEXT,
    error_message TEXT,
    tokens_used INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    report_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    confidence_level TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_agent_runs_session ON agent_runs(session_id);
  CREATE INDEX IF NOT EXISTS idx_reports_session ON reports(session_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_ticker ON analysis_sessions(ticker);

  CREATE TABLE IF NOT EXISTS ceo_activities (
    id TEXT PRIMARY KEY,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    triggered_by TEXT NOT NULL DEFAULT 'autonomous',
    status TEXT NOT NULL DEFAULT 'completed',
    output_text TEXT,
    duration_ms INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    priority TEXT NOT NULL DEFAULT 'normal',
    created_by TEXT NOT NULL DEFAULT 'chairman',
    created_at TEXT NOT NULL,
    completed_at TEXT,
    progress_notes TEXT
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    id TEXT PRIMARY KEY,
    ticker TEXT NOT NULL UNIQUE,
    company_name TEXT,
    added_at TEXT NOT NULL,
    notes TEXT,
    last_checked_at TEXT,
    alert_active INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ceo_decisions (
    id TEXT PRIMARY KEY,
    decision_type TEXT NOT NULL,
    summary TEXT NOT NULL,
    reasoning TEXT,
    affected_agents TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_ceo_activities_created ON ceo_activities(created_at);
  CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS kap_events (
    id TEXT PRIMARY KEY,
    ticker TEXT NOT NULL,
    company_name TEXT,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    source_url TEXT,
    published_at TEXT NOT NULL,
    detected_at TEXT NOT NULL,
    impact_direction TEXT,
    impact_score REAL,
    confidence TEXT,
    affected_statements TEXT,
    session_id TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_kap_events_ticker ON kap_events(ticker);
  CREATE INDEX IF NOT EXISTS idx_kap_events_published ON kap_events(published_at);
  CREATE INDEX IF NOT EXISTS idx_kap_events_type ON kap_events(event_type);

  CREATE TABLE IF NOT EXISTS watchdog_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    agent_id TEXT,
    session_id TEXT,
    ticker TEXT,
    details TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_watchdog_events_type ON watchdog_events(event_type);
  CREATE INDEX IF NOT EXISTS idx_watchdog_events_created ON watchdog_events(created_at);
`);

export function ensureColumn(tableName: string, columnName: string, columnDefinition: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
}

ensureColumn('analysis_sessions', 'selected_layers', 'TEXT');
ensureColumn('analysis_sessions', 'overall_score', 'REAL');
ensureColumn('analysis_sessions', 'theme', 'TEXT'); // 'institutional' | 'anthropic' | 'minimal'
// R5: QA hard gate — critical vs soft fail tracking
ensureColumn('analysis_sessions', 'quality_warning', 'INTEGER DEFAULT 0');
ensureColumn('analysis_sessions', 'quality_warning_reason', 'TEXT');
ensureColumn('agent_runs', 'provider_used', 'TEXT');
ensureColumn('agent_runs', 'retry_count', 'INTEGER DEFAULT 0');

export type AnalysisSession = {
  id: string;
  ticker: string;
  company_name: string | null;
  runtime_mode: string;
  selected_layers: string | null;
  status: 'pending' | 'running' | 'paused_rate_limit' | 'paused_stuck_agent' | 'blocked_for_review' | 'completed' | 'completed_with_warning' | 'qa_failed' | 'failed';
  current_phase: string | null;
  started_at: string;
  completed_at: string | null;
  total_cost_usd: number;
  total_tokens: number;
  overall_score: number | null;
  error_message: string | null;
  quality_warning: number | null;
  quality_warning_reason: string | null;
};

export type AgentRun = {
  id: string;
  session_id: string;
  agent_id: string;
  agent_display_name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  provider_used: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  input_prompt: string | null;
  output_text: string | null;
  error_message: string | null;
  tokens_used: number;
  cost_usd: number;
  retry_count: number;
};

export type Report = {
  id: string;
  session_id: string;
  report_type: 'fundamental' | 'technical' | 'executive';
  title: string;
  content: string;
  confidence_level: string | null;
  created_at: string;
};
