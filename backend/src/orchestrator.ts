import { nanoid } from 'nanoid';
import { db } from './db.js';
import { runAgent } from './agent-runner.js';
import { getAgentMeta } from './agents.js';
import { runFeedbackLoop } from './feedback-loop.js';
import { CONTEXT_CHAR_LIMIT } from './config.js';
import path from 'path';
import fs from 'fs';

/**
 * Extract HTML from report_formatter output and convert to PDF via Puppeteer.
 * The formatter agent outputs JSON with a `formatted_html` field containing a full HTML document.
 * Falls back to treating the entire output as HTML if JSON parsing fails.
 */
async function generatePdfFromFormatterOutput(ticker: string, formatterOutput: string): Promise<string> {
  let html = formatterOutput;

  // 1. Önce JSON wrapper'dan çıkarmayı dene (eski format uyumluluğu)
  try {
    const jsonMatch = formatterOutput.match(/\{[\s\S]*"formatted_html"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.formatted_html) {
        html = parsed.formatted_html;
      }
    }
  } catch {
    // JSON parse başarısız — direkt HTML olarak devam et
  }

  // 2. Markdown code block içinde HTML olabilir — çıkar
  const codeBlockMatch = html.match(/```html?\s*\n([\s\S]*?)```/);
  if (codeBlockMatch && codeBlockMatch[1].includes('<!DOCTYPE')) {
    html = codeBlockMatch[1];
  }

  // 3. HTML dokümanını çıkar (önünde/arkasında metin olabilir)
  const htmlDocMatch = html.match(/<!DOCTYPE html>[\s\S]*<\/html>/i);
  if (htmlDocMatch) {
    html = htmlDocMatch[0];
  } else if (html.includes('<!DOCTYPE html>') || html.includes('<html')) {
    // HTML başlamış ama </html> ile bitmemiş — truncation olmuş, kapanışı ekle
    console.warn(`[orchestrator] HTML truncated — </html> kapanışı eksik, otomatik ekleniyor`);
    if (!html.includes('</body>')) html += '\n</body>';
    if (!html.includes('</html>')) html += '\n</html>';
  } else {
    console.warn(`[orchestrator] report_formatter çıktısı HTML değil, PDF üretimi atlanıyor`);
    return '';
  }

  // --- HTML QUALITY VALIDATION ---
  // Prevent generating broken/empty PDFs from truncated or garbled agent output
  const MIN_HTML_LENGTH = 5000; // A proper report HTML is at least 5KB
  const REQUIRED_HTML_TAGS = ['<head', '<body', '<table', '</html>'];
  const REQUIRED_SECTIONS = ['page']; // At least one .page div

  if (html.length < MIN_HTML_LENGTH) {
    console.error(`[orchestrator] HTML too short (${html.length} chars, min ${MIN_HTML_LENGTH}). report_formatter likely failed or truncated. Skipping PDF.`);
    console.error(`[orchestrator] First 200 chars of output: ${formatterOutput.slice(0, 200)}`);
    return '';
  }

  const missingTags = REQUIRED_HTML_TAGS.filter(tag => !html.toLowerCase().includes(tag));
  if (missingTags.length > 0) {
    console.error(`[orchestrator] HTML missing required tags: ${missingTags.join(', ')}. report_formatter output is incomplete. Skipping PDF.`);
    return '';
  }

  const pageCount = (html.match(/class="page"/g) || []).length;
  if (pageCount < 3) {
    console.warn(`[orchestrator] HTML has only ${pageCount} pages (expected 12-16). report_formatter may have truncated.`);
    // Don't block — generate PDF but log warning for investigation
  }

  const chartCount = (html.match(/<canvas/g) || []).length;
  if (chartCount === 0) {
    console.warn(`[orchestrator] HTML has no Chart.js canvases. Charts may be missing from report.`);
  }

  console.log(`[orchestrator] HTML validation passed: ${html.length} chars, ${pageCount} pages, ${chartCount} charts`);
  // --- END HTML QUALITY VALIDATION ---

  // Dynamic import puppeteer (it's a CommonJS module)
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--allow-file-access-from-files',
    ],
  });

  const page = await browser.newPage();

  // Viewport A4 boyutunda — CSS media print ile uyumlu
  await page.setViewport({ width: 794, height: 1123 }); // A4 @ 96dpi

  // Chart.js CDN'den yüklenebilmesi için networkidle0 kullan
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

  // Chart.js renderını bekle — canvas'lar render olana kadar
  try {
    await page.waitForFunction(() => {
      const canvases = document.querySelectorAll('canvas');
      if (canvases.length === 0) return true; // Chart yoksa beklemesine gerek yok
      // Chart.js 4.x chart instance kontrolü
      return Array.from(canvases).every(c => {
        const ctx = c.getContext('2d');
        return ctx && c.width > 0 && c.height > 0;
      });
    }, { timeout: 15000 });
  } catch {
    console.warn(`[orchestrator] Chart.js render bekleme timeout — devam ediliyor`);
  }

  // Ek güvenlik için kısa bekleme (animasyonlar)
  await new Promise(resolve => setTimeout(resolve, 2000));

  const date = new Date().toISOString().slice(0, 10);
  const pdfFilename = `${ticker}_Yonetim_Kurulu_Raporu_${date.replace(/-/g, '')}.pdf`;
  const pdfPath = path.join(process.cwd(), '..', pdfFilename);

  // HTML'deki header/footer template'ini enjekte et
  const headerTemplate = `
    <div style="width:100%;font-size:8px;color:#666;padding:0 15mm;display:flex;justify-content:space-between;">
      <span>${ticker} — Yönetim Kurulu Raporu</span>
      <span>Finance X Platform</span>
    </div>`;
  const footerTemplate = `
    <div style="width:100%;font-size:8px;color:#666;padding:0 15mm;display:flex;justify-content:space-between;">
      <span>Gizli — Yatırım tavsiyesi niteliği taşımaz</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`;

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: false,
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
  });

  await browser.close();

  // Post-generation validation: check PDF file size
  const stats = fs.statSync(pdfPath);
  if (stats.size < 50000) { // 50KB minimum for a real report PDF
    console.error(`[orchestrator] Generated PDF is suspiciously small (${stats.size} bytes). Report may be broken. Path: ${pdfPath}`);
  } else {
    console.log(`[orchestrator] PDF generated successfully: ${pdfPath} (${(stats.size / 1024).toFixed(0)} KB, ${pageCount} pages)`);
  }

  // HTML'i de kaydet (debug ve tekrar kullanım için)
  const htmlPath = pdfPath.replace('.pdf', '.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`[orchestrator] HTML kaydedildi: ${htmlPath}`);

  return pdfPath;
}

export type RuntimeMode = 'fast_screening' | 'standard_institutional' | 'deep_dive';

export type AnalysisLayer = 'fundamental' | 'technical' | 'events' | 'sector' | 'macro';

// Map each layer to the agents it requires
const LAYER_AGENTS: Record<AnalysisLayer, string[]> = {
  fundamental: ['data_collection', 'parse_standardization', 'reconciliation', 'context_extraction', 'financial_analysis'],
  technical: ['technical_analysis'],
  events: ['kap_watch', 'event_classification', 'event_impact_mapper', 'event_timeline_alert'],
  sector: ['sector_competition'],
  macro: ['macro_analysis'],
};

// Agents that always run regardless of layers (backbone)
const BACKBONE_AGENTS = ['ceo', 'qa_review', 'strategic_synthesis', 'final_summary', 'report_formatter'];

const AGENT_PIPELINE: Array<{ id: string; phase: string }> = [
  { id: 'ceo', phase: 'Mandate Interpretation' },
  { id: 'data_collection', phase: 'Data Acquisition' },
  { id: 'parse_standardization', phase: 'Document Parsing' },
  { id: 'reconciliation', phase: 'Data Quality' },
  { id: 'context_extraction', phase: 'Context Extraction' },
  { id: 'financial_analysis', phase: 'Financial Analysis' },
  { id: 'sector_competition', phase: 'Sector & Competition' },
  { id: 'macro_analysis', phase: 'Macro Analysis' },
  { id: 'technical_analysis', phase: 'Technical Analysis' },
  { id: 'kap_watch', phase: 'KAP Watch' },
  { id: 'event_classification', phase: 'Event Classification' },
  { id: 'event_impact_mapper', phase: 'Event Impact Mapping' },
  { id: 'event_timeline_alert', phase: 'Event Timeline' },
  { id: 'qa_review', phase: 'Quality Review' },
  { id: 'strategic_synthesis', phase: 'Strategic Synthesis' },
  { id: 'final_summary', phase: 'Final Summary' },
  { id: 'valuation_agent', phase: 'Valuation' },
  { id: 'sentiment_news_agent', phase: 'Sentiment Analysis' },
  { id: 'analyst_consensus_agent', phase: 'Analyst Consensus' },
  { id: 'esg_agent', phase: 'ESG Analysis' },
  { id: 'report_formatter', phase: 'Report Formatting' },
];

const PIPELINE_BY_MODE: Record<RuntimeMode, string[]> = {
  fast_screening: ['ceo', 'data_collection', 'financial_analysis', 'technical_analysis', 'final_summary'],
  standard_institutional: AGENT_PIPELINE.map(a => a.id),
  deep_dive: AGENT_PIPELINE.map(a => a.id),
};

// Track running/paused sessions so we can resume them
const activeSessionPromises = new Map<string, Promise<void>>();

function buildPipelineForLayers(runtimeMode: RuntimeMode, layers?: AnalysisLayer[]): string[] {
  const basePipeline = PIPELINE_BY_MODE[runtimeMode];

  // If no layers specified, use the full mode pipeline
  if (!layers || layers.length === 0) return basePipeline;

  // Collect all agents required by the selected layers
  const required = new Set<string>(BACKBONE_AGENTS);
  for (const layer of layers) {
    const agents = LAYER_AGENTS[layer];
    if (agents) agents.forEach(a => required.add(a));
  }

  // Filter the base pipeline to only include required agents
  // (preserves canonical ordering)
  return basePipeline.filter(agentId => required.has(agentId));
}

export function startAnalysisSession(ticker: string, runtimeMode: RuntimeMode, layers?: AnalysisLayer[]): string {
  const sessionId = nanoid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO analysis_sessions (id, ticker, runtime_mode, status, started_at)
    VALUES (?, ?, ?, 'pending', ?)
  `).run(sessionId, ticker.toUpperCase(), runtimeMode, now);

  const agentIds = buildPipelineForLayers(runtimeMode, layers);
  const insertRun = db.prepare(`
    INSERT INTO agent_runs (id, session_id, agent_id, agent_display_name, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);
  for (const agentId of agentIds) {
    const meta = getAgentMeta(agentId);
    if (!meta) continue;
    insertRun.run(nanoid(), sessionId, agentId, meta.displayName);
  }

  const promise = executeSession(sessionId, ticker, runtimeMode).catch((err) => {
    console.error(`Session ${sessionId} crashed:`, err);
    db.prepare(`
      UPDATE analysis_sessions
      SET status = 'failed', error_message = ?, completed_at = ?
      WHERE id = ?
    `).run(err.message || String(err), new Date().toISOString(), sessionId);
  }).finally(() => {
    activeSessionPromises.delete(sessionId);
  });

  activeSessionPromises.set(sessionId, promise);
  return sessionId;
}

/**
 * Resume a paused session (after rate limit has lifted).
 * Picks up from the first pending agent run.
 */
export function resumeSession(sessionId: string): boolean {
  if (activeSessionPromises.has(sessionId)) return false;

  const session = db.prepare(`SELECT * FROM analysis_sessions WHERE id = ?`).get(sessionId) as any;
  if (!session) return false;
  if (session.status !== 'paused_rate_limit' && session.status !== 'failed') return false;

  const promise = executeSession(session.id, session.ticker, session.runtime_mode as RuntimeMode).catch((err) => {
    console.error(`Session ${sessionId} resume crashed:`, err);
    db.prepare(`
      UPDATE analysis_sessions
      SET status = 'failed', error_message = ?
      WHERE id = ?
    `).run(err.message || String(err), sessionId);
  }).finally(() => {
    activeSessionPromises.delete(sessionId);
  });

  activeSessionPromises.set(sessionId, promise);
  return true;
}

/**
 * Auto-resume all paused sessions. Called periodically from the watchdog.
 */
export function resumeAllPausedSessions(): number {
  const paused = db.prepare(`
    SELECT id FROM analysis_sessions
    WHERE status = 'paused_rate_limit'
  `).all() as Array<{ id: string }>;

  let resumedCount = 0;
  for (const row of paused) {
    if (!activeSessionPromises.has(row.id)) {
      if (resumeSession(row.id)) resumedCount++;
    }
  }
  return resumedCount;
}

// Parallel execution phases — agents within the same phase run concurrently
const EXECUTION_PHASES: Array<{ name: string; agents: string[][] }> = [
  { name: 'Mandate', agents: [['ceo']] },
  { name: 'Data Acquisition', agents: [['data_collection', 'kap_watch']] }, // parallel
  { name: 'Parsing', agents: [['parse_standardization']] },
  { name: 'Data Quality', agents: [['reconciliation']] }, // DATA QUALITY GATE after this
  { name: 'Analysis', agents: [['context_extraction', 'financial_analysis', 'macro_analysis', 'sector_competition', 'technical_analysis', 'sentiment_news_agent', 'analyst_consensus_agent']] }, // all parallel
  { name: 'Valuation & ESG', agents: [['valuation_agent', 'esg_agent']] }, // parallel — depend on financial_analysis output
  { name: 'Events', agents: [['event_classification'], ['event_impact_mapper', 'event_timeline_alert']] },
  { name: 'Quality Review', agents: [['qa_review']] }, // QA REVISION LOOP after this
  { name: 'Synthesis', agents: [['strategic_synthesis']] },
  { name: 'Final Report', agents: [['final_summary']] },
  { name: 'Report Formatting', agents: [['report_formatter']] },
];

// Agent timeout configuration
function getAgentTimeout(agentId: string): number {
  const DATA_AGENTS = ['data_collection', 'kap_watch'];
  const HEAVY_ANALYSIS = ['financial_analysis', 'technical_analysis', 'macro_analysis', 'sector_competition', 'context_extraction', 'valuation_agent', 'esg_agent', 'sentiment_news_agent', 'analyst_consensus_agent'];
  const SYNTHESIS_AGENTS = ['strategic_synthesis', 'final_summary'];

  if (DATA_AGENTS.includes(agentId)) return 15 * 60 * 1000;
  if (HEAVY_ANALYSIS.includes(agentId)) return 25 * 60 * 1000;
  if (SYNTHESIS_AGENTS.includes(agentId)) return 25 * 60 * 1000;
  if (agentId === 'report_formatter') return 30 * 60 * 1000;
  return 15 * 60 * 1000; // default for meta/qa agents (artırıldı: 10dk → 15dk)
}

// Run a single agent and update DB. Returns true if session should pause (rate limit).
async function runSingleAgent(
  agentId: string,
  sessionId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
  costTracker: { totalCost: number; totalTokens: number },
): Promise<'ok' | 'rate_limit' | 'failed'> {
  const phase = AGENT_PIPELINE.find(a => a.id === agentId)?.phase || agentId;
  const runRow = db.prepare(`
    SELECT id, status FROM agent_runs WHERE session_id = ? AND agent_id = ?
  `).get(sessionId, agentId) as { id: string; status: string } | undefined;

  if (!runRow || runRow.status === 'completed') return 'ok';

  db.prepare(`UPDATE analysis_sessions SET current_phase = ? WHERE id = ?`).run(phase, sessionId);
  const runId = runRow.id;
  db.prepare(`UPDATE agent_runs SET status = 'running', started_at = ?, error_message = NULL WHERE id = ?`)
    .run(new Date().toISOString(), runId);

  const taskPrompt = buildTaskPrompt(agentId, ticker, accumulatedContext);
  const timeoutMs = getAgentTimeout(agentId);
  const RETRY_AGENTS = ['strategic_synthesis', 'final_summary', 'financial_analysis', 'report_formatter', 'context_extraction', 'valuation_agent'];
  const maxAttempts = RETRY_AGENTS.includes(agentId) ? 2 : 1;
  let result: Awaited<ReturnType<typeof runAgent>> | null = null;

  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) console.log(`  retry: ${agentId} (attempt ${attempt}/${maxAttempts})`);
      result = await runAgent({ agentId, taskPrompt, context: accumulatedContext, timeoutMs });
      if (result.success) break;
      if (result.errorType === 'rate_limit' || result.errorType === 'auth') break;
    }

    if (!result) throw new Error('runAgent returned no result');
    const completedAt = new Date().toISOString();

    if (result.success) {
      db.prepare(`
        UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
        output_text = ?, tokens_used = ?, cost_usd = ?, input_prompt = ? WHERE id = ?
      `).run(completedAt, result.durationMs, result.output, result.tokensUsed, result.costUsd, taskPrompt, runId);

      costTracker.totalCost += result.costUsd;
      costTracker.totalTokens += result.tokensUsed;
      db.prepare(`UPDATE analysis_sessions SET total_cost_usd = ?, total_tokens = ? WHERE id = ?`)
        .run(costTracker.totalCost, costTracker.totalTokens, sessionId);

      accumulatedContext[`${agentId}_output`] = result.output.slice(0, CONTEXT_CHAR_LIMIT);

      if (agentId === 'final_summary') {
        db.prepare(`INSERT INTO reports (id, session_id, report_type, title, content, created_at) VALUES (?, ?, 'executive', ?, ?, ?)`)
          .run(nanoid(), sessionId, `${ticker} — Yonetici Ozeti`, result.output, completedAt);
      }

      // After report_formatter completes, extract HTML and generate PDF
      if (agentId === 'report_formatter') {
        try {
          await generatePdfFromFormatterOutput(ticker, result.output);
        } catch (pdfErr: any) {
          console.error(`[orchestrator] PDF generation failed for ${ticker}:`, pdfErr.message);
          // Non-blocking — report data is still saved, PDF is a bonus
        }
      }
      return 'ok';
    } else {
      if (result.errorType === 'rate_limit') {
        db.prepare(`UPDATE agent_runs SET status = 'pending', started_at = NULL, error_message = 'Rate limit' WHERE id = ?`).run(runId);
        db.prepare(`UPDATE analysis_sessions SET status = 'paused_rate_limit', error_message = ?, current_phase = ? WHERE id = ?`)
          .run(`Rate limit — ${agentId}`, phase, sessionId);
        return 'rate_limit';
      }
      db.prepare(`UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?, error_message = ?, input_prompt = ? WHERE id = ?`)
        .run(completedAt, result.durationMs, result.error || 'Unknown', taskPrompt, runId);
      accumulatedContext[`${agentId}_output`] = `[DEGRADED] ${agentId} failed: ${(result.error || '').slice(0, 200)}`;
      return 'failed';
    }
  } catch (err: any) {
    db.prepare(`UPDATE agent_runs SET status = 'failed', error_message = ?, completed_at = ? WHERE id = ?`)
      .run(err.message || String(err), new Date().toISOString(), runId);
    accumulatedContext[`${agentId}_output`] = `[DEGRADED] ${agentId} crashed: ${(err.message || '').slice(0, 200)}`;
    return 'failed';
  }
}

async function executeSession(sessionId: string, ticker: string, runtimeMode: RuntimeMode): Promise<void> {
  db.prepare(`UPDATE analysis_sessions SET status = 'running', error_message = NULL WHERE id = ?`).run(sessionId);

  const runRows = db.prepare(`SELECT agent_id FROM agent_runs WHERE session_id = ? ORDER BY rowid ASC`)
    .all(sessionId) as Array<{ agent_id: string }>;
  const activeAgentIds = new Set(runRows.length > 0 ? runRows.map(r => r.agent_id) : PIPELINE_BY_MODE[runtimeMode]);

  // DELTA ANALYSIS: Check for previous completed analysis of same ticker
  const previousReport = db.prepare(`
    SELECT r.content, r.created_at FROM reports r
    JOIN analysis_sessions s ON r.session_id = s.id
    WHERE s.ticker = ? AND s.status = 'completed' AND s.id != ?
    ORDER BY r.created_at DESC LIMIT 1
  `).get(ticker, sessionId) as { content: string; created_at: string } | undefined;

  // Rebuild context from completed runs (resume support)
  const completedRuns = db.prepare(`SELECT agent_id, output_text FROM agent_runs WHERE session_id = ? AND status = 'completed'`)
    .all(sessionId) as any[];
  const accumulatedContext: Record<string, unknown> = { ticker, runtimeMode };
  for (const r of completedRuns) {
    if (r.output_text) accumulatedContext[`${r.agent_id}_output`] = String(r.output_text).slice(0, CONTEXT_CHAR_LIMIT);
  }

  // Include previous report summary for delta analysis (agents can compare/update)
  if (previousReport) {
    console.log(`  Delta mode: previous report found from ${previousReport.created_at}`);
    accumulatedContext['previous_report_summary'] = previousReport.content.slice(0, 5000);
    accumulatedContext['previous_report_date'] = previousReport.created_at;
    accumulatedContext['analysis_mode'] = 'delta_update';
  } else {
    accumulatedContext['analysis_mode'] = 'fresh';
  }

  const sessionRow = db.prepare(`SELECT total_cost_usd, total_tokens FROM analysis_sessions WHERE id = ?`).get(sessionId) as any;
  const costTracker = { totalCost: sessionRow?.total_cost_usd || 0, totalTokens: sessionRow?.total_tokens || 0 };

  // Execute phases sequentially, agents within a phase in parallel
  for (const phase of EXECUTION_PHASES) {
    console.log(`\n--- Phase: ${phase.name} ---`);

    for (const parallelGroup of phase.agents) {
      // Filter to only agents that are in this session's pipeline
      const agentsToRun = parallelGroup.filter(id => activeAgentIds.has(id));
      if (agentsToRun.length === 0) continue;

      if (agentsToRun.length === 1) {
        // Single agent — run directly
        const status = await runSingleAgent(agentsToRun[0], sessionId, ticker, accumulatedContext, costTracker);
        if (status === 'rate_limit') return;
      } else {
        // Multiple agents — run in parallel
        console.log(`  [parallel] ${agentsToRun.join(', ')}`);
        const results = await Promise.all(
          agentsToRun.map(id => runSingleAgent(id, sessionId, ticker, accumulatedContext, costTracker))
        );
        if (results.includes('rate_limit')) return;
      }
    }

    // DATA QUALITY GATE: after reconciliation phase
    if (phase.name === 'Data Quality') {
      const reconOutput = String(accumulatedContext['reconciliation_output'] || '');
      const scoreMatch = reconOutput.match(/data_quality_score["\s:]*([0-9.]+)/i);
      const score = scoreMatch ? parseFloat(scoreMatch[1]) : 1.0;

      if (score < 0.40) {
        console.log(`DATA QUALITY GATE: Score ${score} < 0.40 — ABORTING session`);
        db.prepare(`UPDATE analysis_sessions SET status = 'failed', error_message = ?, completed_at = ? WHERE id = ?`)
          .run(`Data quality too low (${score}) — analiz durdu. Veri kalitesi yetersiz.`, new Date().toISOString(), sessionId);
        return;
      }
      if (score < 0.60) {
        console.log(`DATA QUALITY GATE: Score ${score} < 0.60 — continuing with DEGRADED warning`);
        accumulatedContext['data_quality_warning'] = `VERI KALITESI UYARISI: Reconciliation skoru ${score}/1.00. Analiz sonuclarina dusuk guvenle yaklasin.`;
      }
    }

    // QA REVISION LOOP: after qa_review phase
    if (phase.name === 'Quality Review') {
      const qaOutput = String(accumulatedContext['qa_review_output'] || '').toLowerCase();
      if (qaOutput.includes('revision_requested')) {
        const revisionTargets = ['financial_analysis', 'macro_analysis', 'technical_analysis', 'sector_competition'];
        for (const target of revisionTargets) {
          if (qaOutput.includes(target) && activeAgentIds.has(target)) {
            console.log(`  QA revision: re-running ${target}`);
            const revisionPrompt = buildTaskPrompt(target, ticker, accumulatedContext)
              + `\n\nQA REVISION: Fix the issues flagged by QA:\n${String(accumulatedContext['qa_review_output'] || '').slice(0, 3000)}`;
            const revResult = await runAgent({ agentId: target, taskPrompt: revisionPrompt, context: accumulatedContext, timeoutMs: 15 * 60 * 1000 });
            if (revResult.success) {
              accumulatedContext[`${target}_output`] = revResult.output.slice(0, CONTEXT_CHAR_LIMIT);
              costTracker.totalCost += revResult.costUsd;
              costTracker.totalTokens += revResult.tokensUsed;
              db.prepare(`UPDATE analysis_sessions SET total_cost_usd = ?, total_tokens = ? WHERE id = ?`)
                .run(costTracker.totalCost, costTracker.totalTokens, sessionId);
              console.log(`  QA revision done: ${target}`);
            }
          }
        }
      }
    }
  }

  // Check if any agents failed due to rate limit — if so, pause session for auto-retry
  const failedRateLimitAgents = db.prepare(`
    SELECT id, agent_id, error_message FROM agent_runs
    WHERE session_id = ? AND status = 'failed'
      AND (LOWER(error_message) LIKE '%limit%' OR LOWER(error_message) LIKE '%quota%' OR LOWER(error_message) LIKE '%429%' OR LOWER(error_message) LIKE '%resets%')
  `).all(sessionId) as Array<{ id: string; agent_id: string; error_message: string }>;

  if (failedRateLimitAgents.length > 0) {
    // Reset rate-limited agents to pending for retry
    const resetStmt = db.prepare(`UPDATE agent_runs SET status = 'pending', started_at = NULL, completed_at = NULL, error_message = 'Rate limit — otomatik yeniden deneme bekliyor' WHERE id = ?`);
    for (const agent of failedRateLimitAgents) {
      resetStmt.run(agent.id);
      console.log(`🔄 Rate-limited agent reset to pending: ${agent.agent_id}`);
    }
    // Also reset downstream agents that depend on failed ones
    const allAgentIds = failedRateLimitAgents.map(a => a.agent_id);
    const downstreamAgents = ['qa_review', 'strategic_synthesis', 'final_summary', 'report_formatter'];
    for (const dsAgent of downstreamAgents) {
      if (!allAgentIds.includes(dsAgent)) {
        db.prepare(`UPDATE agent_runs SET status = 'pending', started_at = NULL, completed_at = NULL, output_text = NULL, error_message = 'Upstream rate limit — yeniden calistirilacak' WHERE session_id = ? AND agent_id = ?`)
          .run(sessionId, dsAgent);
      }
    }
    // Pause session — watchdog will auto-resume when Claude is available
    db.prepare(`UPDATE analysis_sessions SET status = 'paused_rate_limit', error_message = ?, current_phase = 'Rate Limit Recovery' WHERE id = ?`)
      .run(`${failedRateLimitAgents.length} agent rate limit nedeniyle bekleniyor: ${allAgentIds.join(', ')}`, sessionId);
    console.log(`⏸️  Session ${sessionId} paused — ${failedRateLimitAgents.length} agent(s) rate-limited, watchdog will auto-resume`);
    return; // Don't mark as completed, don't run feedback loop
  }

  db.prepare(`UPDATE analysis_sessions SET status = 'completed', completed_at = ?, current_phase = NULL WHERE id = ?`)
    .run(new Date().toISOString(), sessionId);

  // Post-completion: CEO feedback loop
  console.log(`Starting CEO feedback loop for ${ticker}`);
  try {
    await runFeedbackLoop(sessionId);
    console.log(`Feedback loop completed for ${ticker}`);
  } catch (err: any) {
    console.error(`Feedback loop failed (non-blocking):`, err.message);
  }
}

function buildTaskPrompt(agentId: string, ticker: string, context: Record<string, unknown>): string {
  // For synthesis agents, only include critical analysis outputs to prevent context window bloat
  const SYNTHESIS_AGENTS = ['strategic_synthesis', 'final_summary'];
  const CRITICAL_OUTPUTS = ['strategic_synthesis_output', 'financial_analysis_output', 'technical_analysis_output', 'macro_analysis_output',
                            'sector_competition_output', 'event_impact_mapper_output', 'context_extraction_output',
                            'qa_review_output', 'event_timeline_alert_output', 'reconciliation_output'];

  let ctxKeys = Object.keys(context).filter(k => k.endsWith('_output'));

  if (SYNTHESIS_AGENTS.includes(agentId)) {
    // Filter to only critical analysis outputs for synthesis agents
    ctxKeys = ctxKeys.filter(k => CRITICAL_OUTPUTS.includes(k));
  }

  const priorOutputs = ctxKeys.length > 0
    ? `\n\nPrior agent outputs available in context: ${ctxKeys.join(', ')}`
    : '';

  const perAgent: Record<string, string> = {
    ceo: `Interpret the analysis mandate for BIST-listed company ${ticker}. Define quality thresholds, assign work to specialist agents, and set the session scope. Output the mandate as a structured plan.`,
    data_collection: `Collect public data for ${ticker}: last 5 years of financial statements (balance sheet, income, cash flow), annual/activity reports, and KAP disclosures. Use WebSearch and WebFetch to find actual data from isyatirim.com.tr, kap.org.tr, and company investor relations pages. Provide real numbers where possible.

ADDITIONALLY COLLECT:
- Current share price and total shares outstanding (for valuation metrics)
- Market capitalization
- Ownership structure (major shareholders, free float %, foreign investor %)
- Last 5 years dividend history (TL per share)
- Recent insider transactions (if available from KAP)
- Annual report / faaliyet raporu full text (not just financial tables)
- ESG / sustainability report (if company publishes one)
- Credit ratings (Moody's, Fitch, S&P) — search for "[ticker] kredi notu" or "[ticker] credit rating"
- Analyst consensus data — search for "[ticker] hedef fiyat analist" to find target prices and recommendations
- Last 30 days of major news about the company — search for "[ticker] haber" and collect headline + sentiment
- Regulatory decisions affecting the company's sector (SPK, BDDK, EMRA) in last 6 months`,
    parse_standardization: `Standardize the financial data for ${ticker}. Normalize line items, extract key figures for the last 5 years. Provide the data in structured markdown tables.

ADDITIONALLY — FAALIYET RAPORU METIN PARSE:
If annual/activity report text is available, extract these sections into structured fields:
- CEO/Yonetim Mesaji (strategy, outlook)
- Uretim Surecleri ve Kapasiteler
- Amiral Urunler / Ana Urun Gruplari
- Segment Bazli Gelir Dagilimi
- Ar-Ge Yatirimlari ve Projeler
- Yatirim Planlari (CAPEX, yeni fabrikalar)
- Calisma Sayilari ve Insan Kaynaklari
- Musteri/Tedarikci Yogunlasmasi`,
    reconciliation: `Validate the data quality for ${ticker}. Check accounting integrity, cross-statement consistency, and assign data quality scores.`,
    context_extraction: `Extract the business model context for ${ticker}: what the company sells, revenue sources, customer structure, operational cycle, FX sensitivity, segment breakdown, key risks. Use WebSearch to find recent annual report data.

HOLDING/KONGLOMERA TESPITI:
- If ${ticker} is a holding company (e.g., KCHOL, SAHOL, DOHOL, TAVHL), identify ALL subsidiaries with >10% ownership
- For each subsidiary: name, ticker (if listed), ownership %, main business, revenue contribution
- Flag as "HOLDING" in output so financial_analysis can do SOTP (Sum-of-the-Parts) valuation

ORTAKLIK YAPISI:
- Major shareholders (>5% stake) and their percentages
- Free float percentage
- Foreign investor ownership ratio (yabanci orani)
- Recent changes in ownership structure (son 6 ay)

YONETIM KADROSU:
- CEO/GM name and tenure
- Board chairman
- Key management changes in last 12 months

ESG POLİTİKALARI:
- Company's ESG/sustainability commitments (if any)
- Environmental: carbon footprint, energy efficiency targets
- Social: employee safety record, diversity policies
- Governance: board independence ratio, committee structure, related party transactions

IR GUIDANCE:
- Management's forward guidance (revenue, EBITDA, CAPEX targets)
- Compare last year's guidance vs actual results — did they deliver?
- Any guidance revisions in last 12 months`,
    financial_analysis: `Perform a FULL institutional-grade fundamental analysis of ${ticker}. This is the MOST IMPORTANT output.

YOU MUST COMPUTE AND INTERPRET ALL of the following metrics. Missing any is UNACCEPTABLE:

## GELİR TABLOSU METRİKLERİ
- Net Satışlar (Revenue) — TRY millions, YoY growth %
- Brüt Kar / Brüt Kar Oranı (IAS29 varsa belirt)
- Parasal Kayıp/Kazanç (IAS29 etkisi)
- FAVÖK (EBITDA) ve FAVÖK Oranı (EBITDA Margin)
- Cash FAVÖK vs Non-Cash FAVÖK ayrımı
- OPEX / Ciro oranı
- Vergi Öncesi Kar
- Net Dönem Karı ve Net Kar Marjı

## İŞLETME SERMAYESİ METRİKLERİ (KRİTİK — HEPSİ ZORUNLU)
- Ticari Alacak Tahsil Süresi (DSO) = (Ticari Alacaklar / Satışlar) × 360
- Stok Devir Süresi (DIO) = (Stoklar / SMM) × 360
- Ticari Borç Ödeme Süresi (DPO) = (Ticari Borçlar / SMM) × 360
- Nakit Dönüşüm Süresi (CCC) = DSO + DIO - DPO
- Net İşletme Sermayesi (NWC) = Dönen Varlıklar - Kısa Vadeli Yükümlülükler
- Net İşletme Sermayesi / Hasılat oranı
- Net İşletme Sermayesi Gün Sayısı = (NWC / Hasılat) × 360

## BORÇLANMA ve KALDIRAÇ METRİKLERİ
- Net Kredi (Net Financial Debt) = Finansal Borçlar - Nakit & Nakit Benzerleri
- Net Borç / FAVÖK (Net Debt / EBITDA)
- Son 12 Aylık Operasyonel Nakit Akışı / Son 12 Aylık FAVÖK
- Son 12 Aylık FAVÖK / Son 12 Aylık Faiz Gideri (Interest Coverage)
- Son 12 Aylık Serbest Nakit Akışı / Son 12 Aylık Faiz Ödemesi
- Faiz Gideri / FAVÖK oranı

## LİKİDİTE METRİKLERİ
- Cari Oran (Current Ratio)
- Asit-Test Oranı (Quick Ratio / Acid Test)
- Nakit Oran (Cash Ratio)

## KARLILIK ve GETİRİ METRİKLERİ
- ROE (Return on Equity) — Özkaynak Getirisi
- ROCE (Return on Capital Employed) — Kullanılan Varlıkların Getirisi
- ROA (Return on Assets)
- ROIC (Return on Invested Capital)

## NAKİT AKIŞI METRİKLERİ
- Serbest Nakit Akışı (FCF) = İşletme Faaliyetlerinden Nakit - CAPEX
- FCF Marjı (FCF / Revenue)
- Yatırım Harcamaları (CAPEX) / FAVÖK oranı
- İşletme Nakit Akışı vs Net Kar karşılaştırması (cash conversion quality)

## YORUM GEREKSİNİMİ
Her metrik için:
1. Rakamı yaz
2. Formülü göster
3. Sektör benchmark ile karşılaştır (varsa)
4. Trend yönünü belirt (iyileşiyor/kötüleşiyor)
5. NE ANLAMA GELDİĞİNİ AÇIKLA — sadece rakam yazmak KABUL EDİLMEZ

Context_extraction çıktısını kullanarak ratio'ları şirketin iş modeline özel yorumla. Savunma sanayi için farklı, perakende için farklı yorumla.

Use WebSearch to find recent financial data for ${ticker} from isyatirim.com.tr or kap.org.tr.`,

    sector_competition: `Analyze the sector and competitive position of ${ticker}. Industry structure, peers, market positioning, SWOT. Use WebSearch for recent sector data.`,

    macro_analysis: `Analyze Turkey macro environment and its SPECIFIC transmission to ${ticker}. This is NOT a generic macro report.

MANDATORY SECTIONS:

## 1. Türkiye Makro Göstergeler
- Enflasyon (TÜFE, ÜFE), faiz oranları (TCMB politika faizi), TL/USD, büyüme (GSYİH)
- Para politikası yönü, maliye politikası

## 2. JEOPOLİTİK BAĞLAM (KRİTİK — ATLAMA!)
- Bölgesel çatışmalar ve ${ticker}'a etkisi
- Özellikle: İran-ABD gerginliği/savaş senaryosu, Rusya-Ukrayna, İsrail-Filistin, Suriye durumu
- ${ticker} savunma/enerji/turizm/ihracat sektöründe ise bunlar DOĞRUDAN etki eder
- Türkiye'nin NATO pozisyonu, silah ihracatı, enerji bağımlılığı
- Ambargo riskleri, yaptırım riskleri
- Komşu ülke instabiliteleri (Irak, Suriye, İran)

## 3. Sektör-Spesifik Makro Etki
- ${ticker}'ın sektörüne özel makro geçiş mekanizmaları
- Savunma sanayi ise: savunma bütçesi artışı, NATO gereksinimleri, İran-ABD savaş senaryosunun sipariş etkisi
- Bankacılık ise: faiz marjı, kredi büyümesi, TL/USD etkisi
- İhracatçı ise: TL değer kaybı avantajı, hedef pazar riskleri
- Enerji ise: petrol fiyatı, doğalgaz, yenilenebilir teşvikler

## 4. Politika Duyarlılığı
- Seçim takvimi, düzenleyici değişiklikler
- Sektörel teşvikler veya kısıtlamalar
- Vergi politikası değişiklikleri

## 5. Makro → Şirket Geçiş Mekanizması
- Bu makro koşullar ${ticker}'ın gelirini, marjını, borçlanma maliyetini nasıl etkiler?
- Olumlu ve olumsuz senaryolar

Use WebSearch for current geopolitical developments and their impact on the company's sector.`,

    technical_analysis: `Perform technical analysis for ${ticker}: daily/weekly trend, 50/100/200-day MAs, support/resistance, volume, bullish/bearish scenarios. Use WebSearch to find current price data and recent chart patterns.`,
    kap_watch: `Identify material KAP disclosures for ${ticker} in the last 12 months. Use WebSearch to check kap.org.tr for recent announcements.`,
    event_classification: `Classify detected events for ${ticker} by type (contract, capex, debt, legal, management change, dividend, etc.).`,
    event_impact_mapper: `Map each classified event for ${ticker} to financial statement impact: affected line items (revenue, EBITDA, debt, cash), timing horizon (immediate/near/medium/long), confidence level, effect type (confirmed/plausible/speculative). Quantify impact where possible using disclosed figures.`,
    event_timeline_alert: `Build a chronological event timeline for ${ticker} and flag forward-looking alerts.`,
    qa_review: `Review all prior outputs for ${ticker}. Check:
1. Evidence sufficiency — are numbers cited with sources?
2. Confidence calibration — are confidence labels appropriate?
3. Contradictions between agents
4. MISSING METRICS — especially check financial_analysis for: DSO, DIO, DPO, CCC, NWC/Revenue, Net Debt/EBITDA, Interest Coverage, FCF, CAPEX/EBITDA, ROE, ROCE
5. MISSING CONTEXT — check macro_analysis for: geopolitical events, sector-specific macro transmission
6. Flag any issues and request revision.`,
    strategic_synthesis: `Synthesize all analysis layers for ${ticker} into a coherent investment narrative. Separate facts, inferences, scenarios, speculations. Include geopolitical risk assessment from macro_analysis.

MANDATORY — SCORING SYSTEM:
At the end of your synthesis, produce a standardized company score card:

| Boyut | Puan (1-10) | Agirlik | Aciklama |
|-------|-------------|---------|----------|
| Finansal Saglik | ? | %30 | Karlilik, borc, nakit akisi |
| Buyume Potansiyeli | ? | %20 | Gelir buyumesi, yatirimlar, kapasite |
| Sektor Pozisyonu | ? | %15 | Pazar payi, rekabet gucu, SWOT |
| Makro Uyumluluk | ? | %15 | Turkiye/dunya makro, jeopolitik |
| Teknik Gorunum | ? | %10 | Fiyat trendi, momentum |
| Yonetim/Kurumsal | ? | %10 | Ortaklik yapisi, yonetim kalitesi |
| **GENEL SKOR** | **?/10** | | Agirlikli ortalama |

Scoring rules:
- 1-3: Zayif/Riskli
- 4-5: Ortanin altinda
- 6-7: Orta/Kabul edilebilir
- 8-9: Guclu
- 10: Mukemmel

Her puan icin 1 cumle gerekce yaz.`,

    final_summary: `Produce the final institutional-grade analysis report for ${ticker}. Write in Turkish. Use professional, formal tone — Koc Holding ic denetim raporu kalitesinde.

RAPOR FORMAT KURALLARI:
- Emoji YASAK — hicbir yerde emoji kullanma
- Agent meta-text YASAK ("Hafizami inceledim", "Session ID" vb.)
- Her tespit: Bulgu → Aciklama → Risk Degerlendirmesi → Oneri yapisiyla yazilmali
- Tablolar profesyonel: sayilar saga yasli, yuzdelikler 1 ondalik
- Her bolumdeki iddialarin kaynagi belirtilmeli
- Guven seviyeleri (Yuksek/Orta/Dusuk) her kritik bulguda gosterilmeli

RAPOR YAPISI:

# KAPAK
- Sirket tam unvani, BIST kodu
- Rapor tarihi
- Analiz tipi: "Kapsamli Sirket Analizi"
- Hazirlayan: Finance X Platform
- Gonderilen: Yatirimci

# ICINDEKILER (sayfa numaralariyla)

# I. YONETICI OZETI (max 2 sayfa)
- Genel Degerlendirme (1 paragraf)
- SKOR KARTI:
  | Boyut | Puan (1-10) | Yorum |
  |-------|-------------|-------|
  | Finansal Saglik | X | ... |
  | Buyume Potansiyeli | X | ... |
  | Sektor Pozisyonu | X | ... |
  | Makro Uyumluluk | X | ... |
  | Teknik Gorunum | X | ... |
  | ESG | X | ... |
  | GENEL SKOR | X/10 | ... |
- Risk Seviyesi: Dusuk / Orta / Yuksek
- Hedef Fiyat Araligi: Bear X TL / Baz Y TL / Bull Z TL
- 5 Kritik Bulgu (madde madde, her biri 1-2 cumle)
- Temel Degerleme Metrikleri Tablosu (F/K, FD/FAVOK, PD/DD, Temettu Verimi)

# II. SIRKET PROFILI
- Sirket tanitimi, tarihce, sektor, faaliyet alani
- Ortaklik yapisi (pasta grafik icin veri: ortaklar ve yuzdeleri)
- Yonetim kadrosu
- Is modeli ve gelir kaynaklari (yatay bar grafik icin veri: segment bazli gelir dagilimi)
- Holding ise: Istirakler tablosu (istirak, ortaklik%, piyasa degeri katkisi)

# III. FINANSAL ANALIZ (detay rapor)
Her bolum icin: Tespit → Tablo → Yorum → Trend → Risk yapisi

A. Gelir Tablosu Analizi (5 yillik tablo + yorum)
B. Karlilik Metrikleri (FAVOK marji, net marj — cizgi grafik icin veri)
C. Isletme Sermayesi (DSO, DIO, DPO, CCC — tablo)
D. Borc ve Kaldirac (Net Borc/FAVOK, Faiz Karsilama — tablo)
E. Likidite (Cari Oran, Asit-test — tablo)
F. Getiri Metrikleri (ROE, ROCE, ROIC — tablo)
G. Nakit Akisi (OCF, FCF, CAPEX/FAVOK — tablo)
H. Altman Z-Score ve Piotroski F-Score
I. Temettu Analizi (5 yillik temettu gecmisi, verim, payout, surdurulebilirlik)

# IV. DEGERLEME
A. Carpan Bazli (F/K, FD/FAVOK tarihsel karsilastirma)
B. DCF Modeli (5 yillik projeksiyon tablosu, WACC, terminal deger)
C. SOTP (holding ise)
D. Hedef Fiyat Ozeti (Bear/Baz/Bull senaryolari)
E. Analist Konsensus (tablo: analist sayisi, ortalama hedef, oneri dagilimi)

# V. SEKTOR ve REKABET ANALIZI
A. Sektor Genel Gorunum
B. Porter's Five Forces (5 guc, 1-5 puanlama tablosu)
C. Sektor Yasam Dongusu
D. Peer Karsilastirma Tablosu (FAVOK marji, ROE, F/K — tablo)
E. SWOT Analizi (4 ceyrek tablo)

# VI. MAKROEKONOMIK BAGLAM
A. Turkiye Makro Gostergeler Tablosu
B. Jeopolitik Degerlendirme
C. Sektor-Spesifik Makro Etki
D. Regulator Kararlari

# VII. TEKNIK ANALIZ
A. Fiyat ve Trend
B. Destek/Direnc Seviyeleri Tablosu
C. Indikatorler (RSI, MACD, Fibonacci, Bollinger)
D. Hacim Analizi
E. Teknik Senaryolar

# VIII. ESG DEGERLENDIRMESI
A. Cevresel (E) Skor ve Bulgular
B. Sosyal (S) Skor ve Bulgular
C. Yonetisim (G) Skor ve Bulgular
D. ESG Genel Skor Tablosu

# IX. HABER ve SENTIMENT ANALIZI
A. Son 30 Gun Haber Ozeti Tablosu (tarih, baslik, kaynak, sentiment)
B. Genel Sentiment Skoru (-5 / +5)

# X. KAP OLAYLARI ve ETKI ANALIZI
A. Son 12 Ay KAP Bildirimleri Tablosu
B. Olay Etki Haritasi
C. Olay Zaman Cizelgesi

# XI. RISK DEGERLENDIRMESI
A. Risk Matrisi (olasilik x etki tablosu)
B. Bull/Baz/Bear Senaryolari (her biri: tetikleyici, FAVOK etkisi, hedef fiyat)

# XII. SONUC ve DEGERLENDIRME
- Genel degerlendirme (2-3 paragraf)
- Izlenmesi gereken kritik kilometre taslari
- Bir sonraki analiz icin oneriler

# ZORUNLU BILDIRIMLER
- "Bu rapor Finance X platformu tarafindan otomatik olarak uretilmistir."
- "Yatirim tavsiyesi niteligi tasimaz."
- "Tum veriler analiz tarihi itibariyledir."
- Veri kaynaklari listesi
- Analitik kisitlamalar

GRAFIK VERISI FORMATI:
Rapor icinde grafik verileri su formatta yaz (report_formatter PDF'e cevirirken kullanacak):

[CHART:PIE] Ortaklik Yapisi
| Ortak | Yuzde |
|-------|-------|
| Abc Holding | 51.0 |
| Halka Acik | 30.0 |
| Diger | 19.0 |

[CHART:BAR] Segment Bazli Gelir Dagilimi (Milyar TL)
| Segment | 2024 |
|---------|------|
| Duzcam | 57.5 |
| Ambalaj | 51.9 |

[CHART:LINE] FAVOK Marji Trendi (%)
| Yil | FAVOK Marji |
|-----|------------|
| 2020 | 18.5 |
| 2021 | 15.2 |

Bu chart tag'leri report_formatter tarafindan PDF'e cevrildiklerinde gorselllestirilecek.`,

    valuation_agent: `Perform comprehensive valuation analysis for ${ticker}. Use financial_analysis output for FCF, growth rates, and capital structure data.

MANDATORY METHODS:
1. DCF Model: 5-year FCF projection, WACC (TCMB policy rate + 5% risk premium), terminal growth 3%, sensitivity matrix (WACC vs growth)
2. Comparative Valuation: F/K, FD/FAVÖK, PD/DD vs 5-year historical average and sector peers
3. DDM (if company pays dividends): Gordon Growth with sustainable growth rate
4. SOTP (if HOLDING flag in context_extraction): Sum-of-the-Parts per subsidiary

OUTPUT: Fair value range (bear/base/bull), current price vs fair value (% discount/premium), 12-month target price range.
NEVER say "buy" or "sell" — report fair value and let user decide.`,

    sentiment_news_agent: `Analyze news sentiment for ${ticker}. Use WebSearch to collect last 30 days of news.

Search queries: "${ticker} haber", "${ticker} son gelişmeler", company full name + "haber"
For each headline: date, title, source, sentiment (positive/negative/neutral), theme
Calculate overall sentiment score: -5 (very negative) to +5 (very positive)
Flag any major news that could materially impact the stock.`,

    analyst_consensus_agent: `Track analyst consensus for ${ticker}. Use WebSearch to find target prices and recommendations.

Search: "${ticker} hedef fiyat", "${ticker} analist önerisi", "${ticker} analyst target"
Collect: Number of analysts, average/median/high/low target prices, recommendation distribution (Buy/Hold/Sell)
Compare current price to consensus target (% upside/downside)
Flag any recent rating changes (upgrades/downgrades in last 3 months).`,

    esg_agent: `Perform ESG analysis for ${ticker}. Use context_extraction ESG output and data_collection ESG report.

Score each dimension (1-10):
- Environmental: carbon, energy, waste, water, environmental fines
- Social: employee safety, diversity, community, labor practices
- Governance: board independence, committees, related party transactions, transparency

Check BIST Sürdürülebilirlik Endeksi membership. Calculate overall ESG score (E:30%, S:30%, G:40% weighted).
Flag material ESG risks that could affect investment thesis.`,

    report_formatter: `${ticker} icin Puppeteer ile PDF'e cevrilecek kurumsal HTML rapor uret.

KRITIK KURALLAR:
1. Ciktin TAMAMEN gecerli HTML olmali: <!DOCTYPE html> ile basla, </html> ile bitir
2. Markdown CIKTI VERME — sadece HTML
3. JSON wrapper KULLANMA — direkt HTML ver
4. Chart.js CDN KULLANMA — grafikleri inline SVG olarak ciz
5. page-break-after: always KULLANMA (bos sayfa olusturur) — sadece page-break-before: always kullan
6. Harici CSS/font KULLANMA — her sey inline
7. Minimum 30,000 karakter cikti olmali

TEMIZLIK:
- Tum ajan meta-text'i kaldir (Session ID, Kaynak: X Agent, DEGRADED vb.)
- Emoji kaldir, confidence marker'lari badge'e donustur
- Markdown kalintisi birakma (###, **, ---)

GORSEL KURALLAR:
- Inline CSS, font: Segoe UI, 10pt body
- Renk: primary #003366, accent #0d9488, positive #059669, negative #dc2626
- KPI kartlari: 4'lu grid, renkli sol border, buyuk degerler
- Tablolar: #003366 header bg, beyaz text, alternating rows, sayilar saga yasla
- Grafikler: Inline SVG — bar, cizgi, yatay bar, pasta grafik (Canvas/Chart.js kullanma)
- Her sayfada en az 1 gorsel oge (tablo, grafik, KPI)
- Art arda 3+ tablo koyma — araya aciklayici metin ekle

15 ZORUNLU BOLUM (her biri ayri section div):
1. Kapak (gradient bg, sirket adi, ticker, tarih)
2. Yonetici Ozeti (4 KPI karti + guclu/zayif iki sutun)
3. Sirket Profili (is modeli, ortaklik yapisi pasta SVG, gelir dagilimi bar SVG)
4. Finansal Performans (5 yillik tablo + net kar bar SVG + ROE cizgi)
5. Karlilik Analizi (FAVOK/NIM trend SVG + sektor benchmark)
6. Bilanco ve Borcluluk (Net Borc/FAVOK, Cari Oran tablosu)
7. Nakit Akisi (FCF trendi, CAPEX/Hasilat)
8. Degerleme (F/K, FD/FAVOK + Bear/Baz/Bull hedef fiyat tablosu)
9. Sektor Karsilastirmasi (grouped bar SVG + SWOT tablosu)
10. Makro Ortam (4 KPI karti + etki tablosu + jeopolitik)
11. Teknik Analiz (destek/direnc + MA tablosu + 3 senaryo)
12. KAP Olaylari (son 12 ay tablo + etki degerlendirmesi)
13. Risk Degerlendirmesi (yatay bar SVG 0-10 + risk tablosu)
14. Genel Degerlendirme (skor karti + izleme plani)
15. Zorunlu Bildirimler (yasal uyarilar, veri kaynaklari)

SVG GRAFIK KURALI:
- viewBox="0 0 500 250" kullan, width %100
- Bar: rect elemanlari, deger etiketleri ustunde
- Cizgi: polyline + circle noktalari
- Yatay bar: risk skorlari renk kodlu (yesil 1-3, sari 4-6, kirmizi 7-10)
- Pasta: circle stroke-dasharray ile
- HER grafikte baslik (h3) ve aciklayici alt yazi olsun

KONTROL:
- Agent referansi kalmamis mi?
- Session ID, Output ID kalmamis mi?
- Sayisal veriler kaynak agent'lardan dogru alinmis mi?
- </html> kapanisi var mi?
- Hedef: 13-16 sayfa A4`,
  };

  return (perAgent[agentId] || `Perform your agent duties for ${ticker}.`) + priorOutputs;
}
