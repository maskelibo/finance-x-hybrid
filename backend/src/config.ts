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

// On Windows the claude CLI lives under %AppData%\npm; on macOS/Linux it's
// typically Homebrew. Hardcoding a POSIX default breaks `spawn('claude')` on
// Windows ("ENOENT") so we fall through to the inherited PATH instead.
const defaultClaudePath = process.platform === 'win32'
  ? (process.env.PATH || '')
  : '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin';
export const CLAUDE_PATH = process.env.CLAUDE_PATH || defaultClaudePath;

// Server
export const PORT = parseInt(process.env.PORT || '4000', 10);

// Model configuration — agent bazli model secimi
// Basit isler (veri toplama, parse, reconciliation) ucuz modelle yapilir
// Analiz, sentez, CEO ise pahalı modelle yapilir.
//
// Prompt caching: Claude Code CLI (spawn'ladığımız binary) son sürümlerde
// otomatik prompt caching uyguluyor — sabit prefix (shared_directives +
// system_prompt + knowledge.md) her çağrıda aynı olduğu için cache hit oranı
// yüksek. agent-runner.ts prompt'u bu sabit-önce-değişken sırada kuruyor,
// müdahaleye gerek yok.
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

// R5: Dynamic QA Round Governor — profile-aware max revision rounds.
// RuntimeMode ids: fast_screening (LIGHT), standard_institutional (STANDARD), deep_dive (INSTITUTIONAL).
// Master spec aliases (LIGHT/STANDARD/FULL/INSTITUTIONAL) accepted for forward compat.
export function getMaxQaRounds(profile?: string | null): number {
  const rounds: Record<string, number> = {
    fast_screening: 2,
    standard_institutional: 3,
    deep_dive: 5,
    LIGHT: 2,
    STANDARD: 3,
    FULL: 4,
    INSTITUTIONAL: 5,
  };
  if (profile && rounds[profile] !== undefined) return rounds[profile];
  return parseInt(process.env.MAX_QA_ROUNDS || '3', 10);
}

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
export const PYTHON_PIPELINE_ENABLED = (process.env.PYTHON_PIPELINE_ENABLED ?? 'true') === 'true';
export const PYTHON_KAP_WATCH_ENABLED = (process.env.PYTHON_KAP_WATCH_ENABLED ?? 'true') === 'true';
export const PYTHON_DATA_COLLECTION_ENABLED = (process.env.PYTHON_DATA_COLLECTION_ENABLED ?? 'true') === 'true';
export const PYTHON_PARSE_STANDARDIZATION_ENABLED = (process.env.PYTHON_PARSE_STANDARDIZATION_ENABLED ?? 'true') === 'true';
export const PYTHON_RECONCILIATION_ENABLED = (process.env.PYTHON_RECONCILIATION_ENABLED ?? 'true') === 'true';
export const PYTHON_FINANCIAL_ANALYSIS_ENABLED = (process.env.PYTHON_FINANCIAL_ANALYSIS_ENABLED ?? 'true') === 'true';
export const PYTHON_TECHNICAL_ANALYSIS_ENABLED = (process.env.PYTHON_TECHNICAL_ANALYSIS_ENABLED ?? 'true') === 'true';
export const PYTHON_TECHNICAL_BARS = parseInt(process.env.PYTHON_TECHNICAL_BARS || '250', 10);
export const PYTHON_MACRO_ANALYSIS_ENABLED = (process.env.PYTHON_MACRO_ANALYSIS_ENABLED ?? 'true') === 'true';
export const PYTHON_ANALYST_CONSENSUS_ENABLED = (process.env.PYTHON_ANALYST_CONSENSUS_ENABLED ?? 'true') === 'true';
export const PYTHON_SENTIMENT_NEWS_ENABLED = (process.env.PYTHON_SENTIMENT_NEWS_ENABLED ?? 'true') === 'true';
export const PYTHON_ESG_ENABLED = (process.env.PYTHON_ESG_ENABLED ?? 'true') === 'true';
export const PYTHON_EVENT_CLASSIFICATION_ENABLED = (process.env.PYTHON_EVENT_CLASSIFICATION_ENABLED ?? 'true') === 'true';
export const PYTHON_EVENT_IMPACT_MAPPER_ENABLED = (process.env.PYTHON_EVENT_IMPACT_MAPPER_ENABLED ?? 'true') === 'true';
export const PYTHON_EVENT_TIMELINE_ALERT_ENABLED = (process.env.PYTHON_EVENT_TIMELINE_ALERT_ENABLED ?? 'true') === 'true';
export const PYTHON_VALUATION_ENABLED = (process.env.PYTHON_VALUATION_ENABLED ?? 'true') === 'true';
export const PYTHON_STRATEGIC_SYNTHESIS_ENABLED = (process.env.PYTHON_STRATEGIC_SYNTHESIS_ENABLED ?? 'true') === 'true';
export const PYTHON_QA_REVIEW_ENABLED = (process.env.PYTHON_QA_REVIEW_ENABLED ?? 'true') === 'true';
export const PYTHON_COO_ENABLED = (process.env.PYTHON_COO_ENABLED ?? 'true') === 'true';
export const PYTHON_REPORT_FORMATTER_ENABLED = (process.env.PYTHON_REPORT_FORMATTER_ENABLED ?? 'true') === 'true';
export const PYTHON_SECTOR_COMPETITION_ENABLED = (process.env.PYTHON_SECTOR_COMPETITION_ENABLED ?? 'true') === 'true';


// ---------------------------------------------------------------------
// Flag dependency validation
//
// Python downstream agents parse upstream JSON; LLM upstream agents
// emit markdown. Mixing them drops critical fields (sector, metrics,
// DCF). The dry-run against KCHOL caught a valuation_agent sector
// defaulting bug exactly because valuation was Python while
// financial_analysis was LLM.
//
// At startup we log a warning for any enabled agent whose upstream
// dependencies are still on the LLM path. We do NOT hard-fail: the
// adapters degrade gracefully (LLM markdown fallback in
// llm_fallback.ts), but the operator should know the combo is
// sub-optimal.
// ---------------------------------------------------------------------

interface FlagDep {
  flag: boolean;
  name: string;
  dependsOn: Array<{ flag: boolean; name: string }>;
}

export function validatePythonFlagDependencies(): string[] {
  const dependencies: FlagDep[] = [
    {
      flag: PYTHON_EVENT_CLASSIFICATION_ENABLED,
      name: 'PYTHON_EVENT_CLASSIFICATION_ENABLED',
      dependsOn: [{ flag: PYTHON_KAP_WATCH_ENABLED, name: 'PYTHON_KAP_WATCH_ENABLED' }],
    },
    {
      flag: PYTHON_EVENT_IMPACT_MAPPER_ENABLED,
      name: 'PYTHON_EVENT_IMPACT_MAPPER_ENABLED',
      dependsOn: [{ flag: PYTHON_EVENT_CLASSIFICATION_ENABLED, name: 'PYTHON_EVENT_CLASSIFICATION_ENABLED' }],
    },
    {
      flag: PYTHON_EVENT_TIMELINE_ALERT_ENABLED,
      name: 'PYTHON_EVENT_TIMELINE_ALERT_ENABLED',
      dependsOn: [
        { flag: PYTHON_EVENT_CLASSIFICATION_ENABLED, name: 'PYTHON_EVENT_CLASSIFICATION_ENABLED' },
        { flag: PYTHON_EVENT_IMPACT_MAPPER_ENABLED, name: 'PYTHON_EVENT_IMPACT_MAPPER_ENABLED' },
      ],
    },
    {
      flag: PYTHON_FINANCIAL_ANALYSIS_ENABLED,
      name: 'PYTHON_FINANCIAL_ANALYSIS_ENABLED',
      dependsOn: [
        { flag: PYTHON_PARSE_STANDARDIZATION_ENABLED, name: 'PYTHON_PARSE_STANDARDIZATION_ENABLED' },
        { flag: PYTHON_RECONCILIATION_ENABLED, name: 'PYTHON_RECONCILIATION_ENABLED' },
      ],
    },
    {
      flag: PYTHON_RECONCILIATION_ENABLED,
      name: 'PYTHON_RECONCILIATION_ENABLED',
      dependsOn: [{ flag: PYTHON_PARSE_STANDARDIZATION_ENABLED, name: 'PYTHON_PARSE_STANDARDIZATION_ENABLED' }],
    },
    {
      flag: PYTHON_PARSE_STANDARDIZATION_ENABLED,
      name: 'PYTHON_PARSE_STANDARDIZATION_ENABLED',
      dependsOn: [{ flag: PYTHON_DATA_COLLECTION_ENABLED, name: 'PYTHON_DATA_COLLECTION_ENABLED' }],
    },
    {
      flag: PYTHON_VALUATION_ENABLED,
      name: 'PYTHON_VALUATION_ENABLED',
      dependsOn: [{ flag: PYTHON_FINANCIAL_ANALYSIS_ENABLED, name: 'PYTHON_FINANCIAL_ANALYSIS_ENABLED' }],
    },
    {
      flag: PYTHON_SECTOR_COMPETITION_ENABLED,
      name: 'PYTHON_SECTOR_COMPETITION_ENABLED',
      dependsOn: [{ flag: PYTHON_FINANCIAL_ANALYSIS_ENABLED, name: 'PYTHON_FINANCIAL_ANALYSIS_ENABLED' }],
    },
    {
      flag: PYTHON_QA_REVIEW_ENABLED,
      name: 'PYTHON_QA_REVIEW_ENABLED',
      dependsOn: [
        { flag: PYTHON_FINANCIAL_ANALYSIS_ENABLED, name: 'PYTHON_FINANCIAL_ANALYSIS_ENABLED' },
        { flag: PYTHON_RECONCILIATION_ENABLED, name: 'PYTHON_RECONCILIATION_ENABLED' },
      ],
    },
    {
      flag: PYTHON_STRATEGIC_SYNTHESIS_ENABLED,
      name: 'PYTHON_STRATEGIC_SYNTHESIS_ENABLED',
      dependsOn: [{ flag: PYTHON_FINANCIAL_ANALYSIS_ENABLED, name: 'PYTHON_FINANCIAL_ANALYSIS_ENABLED' }],
    },
  ];

  const warnings: string[] = [];
  for (const dep of dependencies) {
    if (!dep.flag) continue;  // only check enabled flags
    const missing = dep.dependsOn.filter(d => !d.flag);
    if (missing.length > 0) {
      warnings.push(
        `[flag-deps] ${dep.name}=true but upstream still LLM: ${missing.map(m => m.name + '=false').join(', ')}. Python adapter will fall back to markdown parsing (lower fidelity).`,
      );
    }
  }
  return warnings;
}


// Emit warnings at module load so every process startup sees them.
// Silent in prod when no flags are enabled.
for (const w of validatePythonFlagDependencies()) {
  console.warn(w);
}

// Stall detection: if provider produces no activity (stdout OR stderr) for
// this many seconds, kill the process. With --output-format=stream-json
// (Phase 8G) partial assistant events arrive during generation, so stall
// firing is now rare — default raised from 900 to 1800 originally for the
// Phase 8E stderr-aware patch; stream-json makes it even safer. Still
// configurable per agent via env.
export const PROVIDER_STALL_TIMEOUT_S = parseInt(process.env.PROVIDER_STALL_TIMEOUT_S || '1800', 10);

// Phase 8G — Claude CLI output format.
//  'stream-json' (default): emit NDJSON events while generating (requires
//    --verbose). assistant-message partial events keep stdout alive; stall
//    kill false-positives collapse to near zero. Parser must handle NDJSON.
//  'json': legacy single-JSON at end. Claude buffers full response; big
//    outputs (FA, synthesis) go silent for 15-25 min. Kept for fallback in
//    case stream-json parsing misbehaves on a CLI version.
export const CLAUDE_OUTPUT_FORMAT = (process.env.CLAUDE_OUTPUT_FORMAT || 'stream-json') as 'stream-json' | 'json';

// Feature flag — ADIM 5: Schema validation mode ('off' | 'warn' | 'soft_block')
// 'off'        = no validation
// 'warn'       = validate + log, pipeline continues normally
// 'soft_block' = validate + log + mark degraded for critical agents so downstream
//                consumers (formatter) can surface a "[DEGRADED]" warning box.
//                Pipeline still continues — we never hard-fail a session on schema.
// Default is now 'soft_block' so bad upstream JSON surfaces in the final report
// instead of silently corrupting the composed template context.
export const SCHEMA_VALIDATION_MODE = (process.env.SCHEMA_VALIDATION_MODE ?? 'warn') as 'off' | 'warn' | 'soft_block';
// Agents where soft_block applies (degraded flag set). Expanded to cover the
// three agents whose outputs directly drive the composed report: missing or
// malformed JSON here is what produces "broken-looking" PDFs.
export const SCHEMA_SOFT_BLOCK_AGENTS = new Set(
  (process.env.SCHEMA_SOFT_BLOCK_AGENTS || 'financial_analysis,reconciliation,valuation_agent,sector_competition,strategic_synthesis')
    .split(',')
    .map(s => s.trim()),
);

// Feature flag — Phase 8D: Upstream digest runtime activation (brief §5).
// Replaces blind `.slice(0, N)` of upstream outputs with a manifest-aware
// digest: JSON key-priority extraction or front-and-tail smart slice.
// Stops the "Lost in the Middle" problem where a 100 KB FA output was
// front-truncated to 15 KB and downstream never saw the tail findings.
// 'smart'    → active (default). JSON digest or 60%-head + 30%-tail slice.
// 'truncate' → legacy. `slice(0, N)` front-only.
export const UPSTREAM_DIGEST_MODE = (process.env.UPSTREAM_DIGEST_MODE || 'smart') as 'smart' | 'truncate';

// Feature flag — Phase 8D: QA checklist addressal enforcement (brief §6).
// 'observe' → legacy. Phase 6A aggregator writes metrics, pipeline ignores.
// 'warn'    → CEO gate surfaces addressal_rate < threshold as an approval
//              failure candidate but does not hard-fail; Chairman sees it.
// 'block'   → hard-fail session finalisation when addressal < threshold.
export const CHECKLIST_ENFORCEMENT_MODE = (process.env.CHECKLIST_ENFORCEMENT_MODE || 'warn') as 'observe' | 'warn' | 'block';
export const CHECKLIST_MIN_ADDRESSAL_RATE = parseFloat(process.env.CHECKLIST_MIN_ADDRESSAL_RATE || '0.85');

export const HEARTBEAT_INTERVAL_MIN = parseInt(process.env.HEARTBEAT_INTERVAL_MIN || '30', 10);
export const WATCHDOG_INTERVAL_MIN = parseInt(process.env.WATCHDOG_INTERVAL_MIN || '2', 10);
export const NIGHT_TRAINING_HOUR_UTC = parseInt(process.env.NIGHT_TRAINING_HOUR_UTC || '23', 10);

export const CLAUDE_SPAWN_ENV = {
  ...process.env,
  PATH: CLAUDE_PATH,
};

export const CLAUDE_PERMISSION_MODE = (process.env.CLAUDE_PERMISSION_MODE || 'bypassPermissions').trim();

// R8: PII scrubber toggle — default true (sensitive data never leaves process).
export const PII_FILTER_ENABLED = (process.env.PII_FILTER_ENABLED ?? 'true') === 'true';

// U1: Skills infrastructure toggles.
export const SKILLS_ENABLED = (process.env.SKILLS_ENABLED ?? 'true') === 'true';
export const MAX_SKILLS_PER_AGENT = parseInt(process.env.MAX_SKILLS_PER_AGENT || '3', 10);
export const SKILL_EXCERPT_ENGINE_ENABLED = (process.env.SKILL_EXCERPT_ENGINE_ENABLED ?? 'true') === 'true';

// U3: Document intelligence (Qdrant RAG).
export const DOCUMENT_INTEL_ENABLED = (process.env.DOCUMENT_INTEL_ENABLED ?? 'true') === 'true';
export const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
export const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || 'local'; // 'local' | 'openai'

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
