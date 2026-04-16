/**
 * Finance X — Golden Test Eval Runner
 *
 * Bir session'daki agent çıktılarını golden markers'a karşı değerlendirir.
 * Kullanım:
 *   npx tsx evals/run-eval.ts <session_id>
 *   npx tsx evals/run-eval.ts --all          (tüm golden session'ları değerlendir)
 *   npx tsx evals/run-eval.ts --latest       (son completed session)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

// -------------------------------------------------------------------
// Paths
// -------------------------------------------------------------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DB_PATH = process.env.FINANCEX_DB || path.join(ROOT, 'backend', 'data', 'financex.db');
const MARKERS_DIR = path.join(ROOT, 'evals', 'golden', 'markers');
const RESULTS_DIR = path.join(ROOT, 'evals', 'results');
const BASELINE_PATH = path.join(ROOT, 'evals', 'baseline.json');
// NOTE: Run from backend/ dir for dependency resolution:
//   cd backend && npx tsx ../evals/run-eval.ts --all
// Or use Python version directly:
//   python3 evals/run-eval.py --all

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
type Markers = {
  agent_id: string;
  required_metrics: string[];
  optional_metrics: string[];
  required_sections: string[];
  source_tags: string[];
  forbidden_patterns: string[];
  warning_patterns: string[];
  min_output_length: number;
};

type AgentEvalResult = {
  agent_id: string;
  status: string;
  output_length: number;
  tokens_used: number;
  cost_usd: number;
  duration_ms: number;
  // Quality metrics
  quality_ratio: number;
  required_found: string[];
  required_missing: string[];
  optional_found: string[];
  sections_found: string[];
  sections_missing: string[];
  source_tag_count: number;
  forbidden_found: string[];
  warning_found: string[];
  length_ok: boolean;
  // Baseline comparison
  token_vs_baseline: number | null;   // ratio: current / baseline avg
  cost_vs_baseline: number | null;
  duration_vs_baseline: number | null;
};

type SessionEvalResult = {
  session_id: string;
  ticker: string;
  evaluated_at: string;
  total_cost: number;
  total_tokens: number;
  cost_vs_baseline: number | null;
  tokens_vs_baseline: number | null;
  agents: AgentEvalResult[];
  summary: {
    agents_evaluated: number;
    agents_passed: number;
    agents_warned: number;
    agents_failed: number;
    overall_quality_ratio: number;
    total_forbidden_found: number;
    regression_detected: boolean;
  };
};

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
function loadMarkers(agentId: string): Markers | null {
  const p = path.join(MARKERS_DIR, `${agentId}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function loadBaseline(): Record<string, any> | null {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
}

function countCaseInsensitive(text: string, keyword: string): number {
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase();
  let count = 0;
  let idx = 0;
  while ((idx = lower.indexOf(kw, idx)) !== -1) {
    count++;
    idx += kw.length;
  }
  return count;
}

function evaluateAgent(
  agentId: string,
  outputText: string,
  tokensUsed: number,
  costUsd: number,
  durationMs: number,
  status: string,
  markers: Markers,
  baseline: Record<string, any> | null,
): AgentEvalResult {
  const text = outputText || '';

  // Required metrics
  const requiredFound = markers.required_metrics.filter(m => countCaseInsensitive(text, m) > 0);
  const requiredMissing = markers.required_metrics.filter(m => countCaseInsensitive(text, m) === 0);
  const qualityRatio = markers.required_metrics.length > 0
    ? requiredFound.length / markers.required_metrics.length
    : 1.0;

  // Optional metrics
  const optionalFound = markers.optional_metrics.filter(m => countCaseInsensitive(text, m) > 0);

  // Sections
  const sectionsFound = markers.required_sections.filter(s => countCaseInsensitive(text, s) > 0);
  const sectionsMissing = markers.required_sections.filter(s => countCaseInsensitive(text, s) === 0);

  // Source tags
  const sourceTagCount = markers.source_tags.reduce((sum, tag) => sum + countCaseInsensitive(text, tag), 0);

  // Forbidden patterns
  const forbiddenFound = markers.forbidden_patterns.filter(p => countCaseInsensitive(text, p) > 0);
  const warningFound = markers.warning_patterns.filter(p => countCaseInsensitive(text, p) > 0);

  // Length check
  const lengthOk = text.length >= markers.min_output_length;

  // Baseline comparison
  const agentBaseline = baseline?.agents?.[agentId];
  const tokenVsBaseline = agentBaseline?.avg_tokens
    ? tokensUsed / agentBaseline.avg_tokens
    : null;
  const costVsBaseline = agentBaseline?.avg_cost
    ? costUsd / agentBaseline.avg_cost
    : null;
  const durationVsBaseline = agentBaseline?.avg_duration_ms
    ? durationMs / agentBaseline.avg_duration_ms
    : null;

  return {
    agent_id: agentId,
    status,
    output_length: text.length,
    tokens_used: tokensUsed,
    cost_usd: costUsd,
    duration_ms: durationMs,
    quality_ratio: Math.round(qualityRatio * 1000) / 1000,
    required_found: requiredFound,
    required_missing: requiredMissing,
    optional_found: optionalFound,
    sections_found: sectionsFound,
    sections_missing: sectionsMissing,
    source_tag_count: sourceTagCount,
    forbidden_found: forbiddenFound,
    warning_found: warningFound,
    length_ok: lengthOk,
    token_vs_baseline: tokenVsBaseline ? Math.round(tokenVsBaseline * 100) / 100 : null,
    cost_vs_baseline: costVsBaseline ? Math.round(costVsBaseline * 100) / 100 : null,
    duration_vs_baseline: durationVsBaseline ? Math.round(durationVsBaseline * 100) / 100 : null,
  };
}

function evaluateSession(db: Database.Database, sessionId: string, baseline: Record<string, any> | null): SessionEvalResult {
  const session = db.prepare('SELECT * FROM analysis_sessions WHERE id = ?').get(sessionId) as any;
  if (!session) throw new Error(`Session not found: ${sessionId}`);

  const runs = db.prepare(
    'SELECT agent_id, status, output_text, tokens_used, cost_usd, duration_ms FROM agent_runs WHERE session_id = ? ORDER BY rowid'
  ).all(sessionId) as any[];

  const agentResults: AgentEvalResult[] = [];
  let totalQuality = 0;
  let qualityCount = 0;

  for (const run of runs) {
    const markers = loadMarkers(run.agent_id);
    if (!markers) continue; // No markers for this agent — skip

    const result = evaluateAgent(
      run.agent_id,
      run.output_text || '',
      run.tokens_used || 0,
      run.cost_usd || 0,
      run.duration_ms || 0,
      run.status,
      markers,
      baseline,
    );
    agentResults.push(result);
    totalQuality += result.quality_ratio;
    qualityCount++;
  }

  const overallQuality = qualityCount > 0 ? totalQuality / qualityCount : 0;
  const regressionThreshold = baseline?.regression_threshold ?? 0.90;

  // Check regression against golden session quality ratios
  const regressionDetected = agentResults.some(r => {
    if (r.quality_ratio < 0.75) return true; // Absolute threshold
    return false;
  });

  const sessionBaseline = baseline?.session_totals;
  const costVsBaseline = sessionBaseline?.avg_cost_per_session
    ? session.total_cost_usd / sessionBaseline.avg_cost_per_session
    : null;
  const tokensVsBaseline = sessionBaseline?.avg_tokens_per_session
    ? session.total_tokens / sessionBaseline.avg_tokens_per_session
    : null;

  return {
    session_id: sessionId,
    ticker: session.ticker,
    evaluated_at: new Date().toISOString(),
    total_cost: session.total_cost_usd || 0,
    total_tokens: session.total_tokens || 0,
    cost_vs_baseline: costVsBaseline ? Math.round(costVsBaseline * 100) / 100 : null,
    tokens_vs_baseline: tokensVsBaseline ? Math.round(tokensVsBaseline * 100) / 100 : null,
    agents: agentResults,
    summary: {
      agents_evaluated: agentResults.length,
      agents_passed: agentResults.filter(r => r.quality_ratio >= 0.90 && r.forbidden_found.length === 0 && r.length_ok).length,
      agents_warned: agentResults.filter(r => (r.quality_ratio >= 0.75 && r.quality_ratio < 0.90) || r.warning_found.length > 0).length,
      agents_failed: agentResults.filter(r => r.quality_ratio < 0.75 || r.forbidden_found.length > 0 || !r.length_ok).length,
      overall_quality_ratio: Math.round(overallQuality * 1000) / 1000,
      total_forbidden_found: agentResults.reduce((sum, r) => sum + r.forbidden_found.length, 0),
      regression_detected: regressionDetected,
    },
  };
}

// -------------------------------------------------------------------
// Compact console report
// -------------------------------------------------------------------
function printReport(result: SessionEvalResult): void {
  const s = result.summary;
  console.log(`\n${'='.repeat(70)}`);
  console.log(`EVAL REPORT — ${result.ticker} (${result.session_id.slice(0, 12)}...)`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Cost: $${result.total_cost.toFixed(2)} (vs baseline: ${result.cost_vs_baseline ?? '?'}x)`);
  console.log(`Tokens: ${result.total_tokens.toLocaleString()} (vs baseline: ${result.tokens_vs_baseline ?? '?'}x)`);
  console.log(`Overall quality: ${(s.overall_quality_ratio * 100).toFixed(1)}%`);
  console.log(`Agents: ${s.agents_passed} PASS / ${s.agents_warned} WARN / ${s.agents_failed} FAIL (of ${s.agents_evaluated})`);
  if (s.total_forbidden_found > 0) console.log(`⚠ Forbidden patterns found: ${s.total_forbidden_found}`);
  if (s.regression_detected) console.log(`🔴 REGRESSION DETECTED`);

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`${'Agent'.padEnd(24)} ${'Quality'.padEnd(9)} ${'Len'.padEnd(8)} ${'Tokens'.padEnd(8)} ${'Cost'.padEnd(8)} ${'Status'}`);
  console.log(`${'─'.repeat(70)}`);

  for (const a of result.agents) {
    const q = `${(a.quality_ratio * 100).toFixed(0)}%`;
    const len = a.length_ok ? `${(a.output_length / 1000).toFixed(0)}K` : `${(a.output_length / 1000).toFixed(0)}K ✗`;
    const tok = `${(a.tokens_used / 1000).toFixed(0)}K`;
    const cost = `$${a.cost_usd.toFixed(2)}`;

    let statusIcon = '✓';
    if (a.quality_ratio < 0.75 || a.forbidden_found.length > 0 || !a.length_ok) statusIcon = '✗';
    else if (a.quality_ratio < 0.90 || a.warning_found.length > 0) statusIcon = '⚠';

    const missing = a.required_missing.length > 0 ? ` [eksik: ${a.required_missing.join(', ')}]` : '';
    const forbidden = a.forbidden_found.length > 0 ? ` [YASAK: ${a.forbidden_found.join(', ')}]` : '';

    console.log(`${a.agent_id.padEnd(24)} ${q.padEnd(9)} ${len.padEnd(8)} ${tok.padEnd(8)} ${cost.padEnd(8)} ${statusIcon}${missing}${forbidden}`);
  }
  console.log(`${'─'.repeat(70)}\n`);
}

// -------------------------------------------------------------------
// Main
// -------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: npx tsx evals/run-eval.ts <session_id | --all | --latest>');
    process.exit(1);
  }

  const db = new Database(DB_PATH, { readonly: true });
  const baseline = loadBaseline();

  let sessionIds: string[] = [];

  if (args[0] === '--all') {
    // Evaluate all golden sessions
    const golden = baseline?.golden_sessions?.map((s: string) => s.split(':')[1]) || [];
    sessionIds = golden;
  } else if (args[0] === '--latest') {
    const row = db.prepare("SELECT id FROM analysis_sessions WHERE status = 'completed' ORDER BY started_at DESC LIMIT 1").get() as any;
    if (row) sessionIds = [row.id];
  } else {
    sessionIds = [args[0]];
  }

  if (sessionIds.length === 0) {
    console.error('No sessions to evaluate');
    process.exit(1);
  }

  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  for (const sid of sessionIds) {
    try {
      const result = evaluateSession(db, sid, baseline);
      printReport(result);

      // Save result
      const outPath = path.join(RESULTS_DIR, `${result.ticker}_${sid.slice(0, 12)}.json`);
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
      console.log(`Result saved: ${outPath}`);
    } catch (err: any) {
      console.error(`Error evaluating ${sid}: ${err.message}`);
    }
  }

  db.close();
}

main();
