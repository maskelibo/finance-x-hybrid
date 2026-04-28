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

  CREATE TABLE IF NOT EXISTS fact_packs (
    session_id TEXT PRIMARY KEY,
    pack_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS canonical_facts (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    fact_key TEXT NOT NULL,
    value_json TEXT NOT NULL,
    unit TEXT NOT NULL,
    raw_unit TEXT,
    sources_json TEXT NOT NULL DEFAULT '[]',
    confidence_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(session_id, fact_key),
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_facts_session ON canonical_facts(session_id);

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

  -- Part 2 / Block S: sub-agent run persistence.
  -- One row per sub-agent invocation; parent_run_id links back to agent_runs.
  CREATE TABLE IF NOT EXISTS sub_agent_runs (
    id TEXT PRIMARY KEY,
    parent_run_id TEXT NOT NULL,
    sub_agent_id TEXT NOT NULL,
    parent_agent_id TEXT NOT NULL,
    status TEXT NOT NULL,
    output_text TEXT,
    error_message TEXT,
    duration_ms INTEGER,
    tokens_used INTEGER,
    cost_usd REAL,
    started_at TEXT,
    completed_at TEXT,
    FOREIGN KEY (parent_run_id) REFERENCES agent_runs(id)
  );

  CREATE INDEX IF NOT EXISTS idx_subagent_parent ON sub_agent_runs(parent_run_id);
  CREATE INDEX IF NOT EXISTS idx_subagent_status ON sub_agent_runs(status);
  CREATE INDEX IF NOT EXISTS idx_subagent_parent_agent ON sub_agent_runs(parent_agent_id);

  -- Block P / Plan P1B Wave 1 — Data Lineage Tracking.
  -- Per-fact derivation nodes + DAG edges. Wave 1 emits raw_extracted only;
  -- computed / aggregated / transformed nodes are reserved for Wave 2.
  -- canonical_facts is UNTOUCHED; lineage is opt-in via fact-layer/lineage.ts.
  CREATE TABLE IF NOT EXISTS lineage_nodes (
    session_id        TEXT NOT NULL,
    fact_key          TEXT NOT NULL,
    node_id           TEXT PRIMARY KEY,
    node_type         TEXT NOT NULL,
    formula           TEXT,
    computed_by       TEXT NOT NULL,
    computed_at       TEXT NOT NULL,
    source_doc_id     TEXT,
    source_page       INTEGER,
    source_snippet    TEXT,
    raw_value         TEXT,
    normalized_value  TEXT,
    unit_conversion   TEXT,
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lineage_edges (
    session_id        TEXT NOT NULL,
    input_node_id     TEXT NOT NULL,
    output_node_id    TEXT NOT NULL,
    PRIMARY KEY (session_id, input_node_id, output_node_id),
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_lineage_nodes_session ON lineage_nodes(session_id);
  CREATE INDEX IF NOT EXISTS idx_lineage_nodes_fact ON lineage_nodes(session_id, fact_key);
  CREATE INDEX IF NOT EXISTS idx_lineage_edges_input ON lineage_edges(session_id, input_node_id);
  CREATE INDEX IF NOT EXISTS idx_lineage_edges_output ON lineage_edges(session_id, output_node_id);

  -- Block P / Plan P1C — Versioned Methodology Registry.
  -- Per-session snapshot of the methodology in force when the session ran.
  -- Idempotent INSERT OR IGNORE keyed by session_id; first writer wins.
  CREATE TABLE IF NOT EXISTS session_methodology (
    session_id            TEXT PRIMARY KEY,
    methodology_version   TEXT NOT NULL,
    methodology_snapshot  TEXT NOT NULL,
    recorded_at           TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_session_methodology_version ON session_methodology(methodology_version);
`);

export function ensureColumn(tableName: string, columnName: string, columnDefinition: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    try {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    } catch (err) {
      // Idempotent under parallel workers (vitest forks): a peer worker may
      // have added the column between our PRAGMA check and our ALTER. Swallow
      // only that specific race-window error; re-raise everything else.
      if (!(err instanceof Error) || !/duplicate column name/i.test(err.message)) {
        throw err;
      }
    }
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
// Block P / Plan P1A Wave 1 — fact-level confidence scoring (nullable, additive)
ensureColumn('canonical_facts', 'confidence_json', 'TEXT');

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
