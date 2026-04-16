import { nanoid } from 'nanoid';
import { db, ensureColumn } from './db.js';
import { runAgent } from './agent-runner.js';
import { getAgentMeta } from './agents.js';
import { runFeedbackLoop } from './feedback-loop.js';
import { CONTEXT_CHAR_LIMIT, DIGEST_MODE, SCHEMA_VALIDATION_MODE, SCHEMA_SOFT_BLOCK_AGENTS, FINANCIAL_ENGINE_ENABLED, BYPASS_CEO_FOR_TESTS, REPORT_PAYLOAD_MODE, FORMATTER_MINIMAL_CONTEXT, REGRESSION_EVAL_ENABLED, getStuckThresholdForAgent, PROJECT_ROOT, PYTHON_EVENT_TIMELINE_ALERT_ENABLED, PYTHON_TECHNICAL_ANALYSIS_ENABLED, PYTHON_KAP_WATCH_ENABLED, PYTHON_DATA_COLLECTION_ENABLED, PYTHON_PARSE_STANDARDIZATION_ENABLED, PYTHON_RECONCILIATION_ENABLED } from './config.js';
import { runPythonEventTimelineAlert } from './python/agent_runners/event_timeline_alert.js';
import { runPythonTechnicalAnalysis } from './python/agent_runners/technical_analysis.js';
import { runPythonKapWatch } from './python/agent_runners/kap_watch.js';
import { runPythonDataCollection } from './python/agent_runners/data_collection.js';
import { runPythonParseStandardization } from './python/agent_runners/parse_standardization.js';
import { runPythonReconciliation } from './python/agent_runners/reconciliation.js';
import { computeAll, type FinancialInputs, type EngineOutput } from './financial-engine.js';
import { validateAgentOutput } from './schema-validator.js';
import { captureSessionSnapshot } from './version-snapshot.js';
import { runRegressionEval } from './regression-eval.js';
import { ANALYSIS_LAYERS, MODE_DEFAULT_LAYERS, type AnalysisLayer, type RuntimeMode } from './analysis-config.js';
import { computeIndicators } from './technical-indicators.js';
import { fetchMacroSnapshot } from './macro-refresh.js';
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
  const svgCount = (html.match(/<svg/gi) || []).length;
  if (svgCount === 0 && chartCount === 0) {
    console.warn(`[orchestrator] HTML has no charts (no SVG or Chart.js canvas). Charts may be missing from report.`);
  }

  console.log(`[orchestrator] HTML validation passed: ${html.length} chars, ${pageCount} pages, ${svgCount} SVGs, ${chartCount} canvas charts`);
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

// Map each layer to the agents it requires
const LAYER_AGENTS: Record<AnalysisLayer, string[]> = {
  fundamental: ['data_collection', 'parse_standardization', 'reconciliation', 'context_extraction', 'financial_analysis'],
  technical: ['technical_analysis'],
  events: ['kap_watch', 'event_classification', 'event_impact_mapper', 'event_timeline_alert'],
  sector: ['sector_competition'],
  macro: ['macro_analysis'],
  valuation: ['valuation_agent'],
  sentiment: ['sentiment_news_agent'],
  consensus: ['analyst_consensus_agent'],
  esg: ['esg_agent'],
};

// Agents that always run regardless of layers (backbone)
const BACKBONE_AGENTS = ['ceo', 'coo', 'qa_review', 'strategic_synthesis', 'final_summary', 'report_formatter'];

const AGENT_PIPELINE: Array<{ id: string; phase: string }> = [
  { id: 'ceo', phase: 'Mandate Interpretation' },
  { id: 'coo', phase: 'Pre-Flight Check' },
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
  fast_screening: AGENT_PIPELINE.map(a => a.id),
  standard_institutional: AGENT_PIPELINE.map(a => a.id),
  deep_dive: AGENT_PIPELINE.map(a => a.id),
};

// Track running/paused sessions so we can resume them
const activeSessionPromises = new Map<string, Promise<void>>();

function buildPipelineForLayers(runtimeMode: RuntimeMode, layers?: AnalysisLayer[]): string[] {
  const basePipeline = PIPELINE_BY_MODE[runtimeMode];
  const selectedLayers = layers && layers.length > 0 ? layers : MODE_DEFAULT_LAYERS[runtimeMode];

  const required = new Set<string>(BACKBONE_AGENTS);
  for (const layer of selectedLayers) {
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
  const selectedLayers = layers && layers.length > 0 ? layers : MODE_DEFAULT_LAYERS[runtimeMode];

  db.prepare(`
    INSERT INTO analysis_sessions (id, ticker, runtime_mode, selected_layers, status, started_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(sessionId, ticker.toUpperCase(), runtimeMode, JSON.stringify(selectedLayers), now);

  const agentIds = buildPipelineForLayers(runtimeMode, selectedLayers);
  const insertRun = db.prepare(`
    INSERT INTO agent_runs (id, session_id, agent_id, agent_display_name, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);
  for (const agentId of agentIds) {
    const meta = getAgentMeta(agentId);
    if (!meta) continue;
    insertRun.run(nanoid(), sessionId, agentId, meta.displayName);
  }

  const promise = executeSession(sessionId, ticker, runtimeMode, selectedLayers).catch((err) => {
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
  // Only resume paused/failed sessions — never completed
  if (!['paused_rate_limit', 'paused_stuck_agent', 'failed'].includes(session.status)) return false;
  const selectedLayers = parseSelectedLayers(session.selected_layers);

  const promise = executeSession(session.id, session.ticker, session.runtime_mode as RuntimeMode, selectedLayers).catch((err) => {
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
    WHERE status = 'paused_rate_limit' OR status = 'paused_stuck_agent'
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
// ADIM 9: Optimized pipeline — dependency-aware paralellik artırıldı
//
// ÖNCEKİ: 11 seri faz, ~55dk
// YENİ: 10 faz, daha fazla paralel grup
//
// Değişiklikler:
// 1. context_extraction + reconciliation paralel (ikisi de parse+data'ya bağlı)
// 2. Events, Analysis ile paralel (events kap_watch'a bağlı, analysis'e değil)
// 3. sector_competition FA sonrasına taşındı (gerçek FA dependency)
// 4. valuation + sector_competition paralel çalışır
// 5. Kritik path: 11 faz → 10 faz, Events artık bekleme noktası değil
const EXECUTION_PHASES: Array<{ name: string; agents: string[][] }> = [
  { name: 'Mandate', agents: [['ceo']] },
  { name: 'Pre-Flight', agents: [['coo']] },
  { name: 'Data Acquisition', agents: [['data_collection', 'kap_watch']] },
  { name: 'Parsing', agents: [['parse_standardization']] },
  // reconciliation + context_extraction paralel (ikisi de parse+data_collection'a bağlı)
  { name: 'Data Quality & Context', agents: [['reconciliation', 'context_extraction']] },
  // Analysis: FA + bağımsız agent'lar paralel + events paralel (kap_watch zaten tamamlanmış)
  { name: 'Analysis & Events', agents: [
    ['financial_analysis', 'macro_analysis', 'technical_analysis', 'sentiment_news_agent', 'analyst_consensus_agent', 'esg_agent', 'event_classification'],
  ]},
  // FA-dependent + event-dependent agent'lar paralel
  { name: 'Valuation & Sector & Event Impact', agents: [
    ['valuation_agent', 'sector_competition', 'event_impact_mapper', 'event_timeline_alert'],
  ]},
  { name: 'Quality Review', agents: [['qa_review']] },
  { name: 'Synthesis', agents: [['strategic_synthesis']] },
  { name: 'Final Report', agents: [['final_summary']] },
];

// Agent timeout configuration — config.ts'teki kalibre edilmiş değerleri kullan
function getAgentTimeout(agentId: string): number {
  return getStuckThresholdForAgent(agentId);
}

function buildCeoBypassOutput(ticker: string): string {
  return [
    '[TEST BYPASS] CEO agent local runtime validation için atlandı.',
    '',
    `# ${ticker} Mandate Plan`,
    '- Scope: Standard BIST issuer review with emphasis on financial quality, context extraction, valuation readiness, and final synthesis.',
    '- Quality threshold: All downstream agents must cite sources, separate facts from inference, and flag data gaps explicitly.',
    '- Critical downstream requirement: financial_analysis output must include a `structured_financials` JSON appendix for deterministic engine extraction.',
    '- COO instruction: proceed with pre-flight checks and keep the pipeline moving unless a blocking infrastructure issue is found.',
    '- Data priority: KAP filings, investor relations PDFs, recent quarterly and annual financial statements, market cap, shares outstanding, debt/cash, and management guidance.',
    '- Delivery rule: if deterministic calculations are available in context, downstream valuation and synthesis agents must use them instead of recomputing arithmetic manually.',
  ].join('\n');
}

/**
 * Detect upstream data gap markers in agent output.
 * If agent is flagging upstream failures, log a warning so we can add
 * dependency-aware retry in future (for now just observability).
 */
function detectUpstreamGap(agentId: string, output: string): { hasGap: boolean; gapPatterns: string[]; upstreamAgents: string[] } {
  const gapPatterns: string[] = [];
  const upstreamAgents = new Set<string>();

  // Look for PENDING context patterns that indicate upstream-caused gaps
  const patterns = [
    /\[VERİ YOK\s*\|\s*denendi:\s*([^;]+);[^\]]+\]/gi,
    /upstream[a-z\s]*(eksik|yok|pending|gap|retry)/gi,
    /parse.{0,50}(eksik|yok|pending|tamamla)/gi,
    /data_collection.{0,50}(eksik|yok|pending|indir)/gi,
  ];

  for (const pattern of patterns) {
    const matches = output.matchAll(pattern);
    for (const match of matches) {
      gapPatterns.push(match[0].slice(0, 200));
    }
  }

  // Detect which upstream agent might need re-run
  if (/parse_standardization|parse/i.test(output) && /eksik|yok|pending/i.test(output)) {
    upstreamAgents.add('parse_standardization');
  }
  if (/data_collection|KAP.*indir/i.test(output) && /eksik|yok|pending/i.test(output)) {
    upstreamAgents.add('data_collection');
  }

  return {
    hasGap: gapPatterns.length > 0,
    gapPatterns: gapPatterns.slice(0, 5),
    upstreamAgents: Array.from(upstreamAgents),
  };
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
  const taskPrompt = buildTaskPrompt(agentId, ticker, accumulatedContext);

  // Python hybrid path — flag off by default; opt-in per agent.
  // When enabled for an agent, the LLM prompt is skipped entirely and
  // the deterministic Python runner writes the agent_runs row.
  if (PYTHON_EVENT_TIMELINE_ALERT_ENABLED && agentId === 'event_timeline_alert') {
    const outcome = await runPythonEventTimelineAlert(sessionId, runId, ticker, accumulatedContext);
    return outcome === 'ok' ? 'ok' : 'failed';
  }
  if (PYTHON_TECHNICAL_ANALYSIS_ENABLED && agentId === 'technical_analysis') {
    const outcome = await runPythonTechnicalAnalysis(sessionId, runId, ticker, accumulatedContext);
    return outcome === 'ok' ? 'ok' : 'failed';
  }
  if (PYTHON_KAP_WATCH_ENABLED && agentId === 'kap_watch') {
    const outcome = await runPythonKapWatch(sessionId, runId, ticker, accumulatedContext);
    return outcome === 'ok' ? 'ok' : 'failed';
  }
  if (PYTHON_DATA_COLLECTION_ENABLED && agentId === 'data_collection') {
    const outcome = await runPythonDataCollection(sessionId, runId, ticker, accumulatedContext);
    return outcome === 'ok' ? 'ok' : 'failed';
  }
  if (PYTHON_PARSE_STANDARDIZATION_ENABLED && agentId === 'parse_standardization') {
    const outcome = await runPythonParseStandardization(sessionId, runId, ticker, accumulatedContext);
    return outcome === 'ok' ? 'ok' : 'failed';
  }
  if (PYTHON_RECONCILIATION_ENABLED && agentId === 'reconciliation') {
    const outcome = await runPythonReconciliation(sessionId, runId, ticker, accumulatedContext);
    return outcome === 'ok' ? 'ok' : 'failed';
  }

  if (BYPASS_CEO_FOR_TESTS && agentId === 'ceo') {
    const now = new Date().toISOString();
    const bypassOutput = buildCeoBypassOutput(ticker);
    db.prepare(`
      UPDATE agent_runs SET status = 'completed', started_at = ?, completed_at = ?, duration_ms = ?,
      output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = NULL, provider_used = ? WHERE id = ?
    `).run(now, now, 1, bypassOutput, taskPrompt, 'test-bypass', runId);
    accumulatedContext[`${agentId}_output`] = bypassOutput;
    console.warn(`[TEST BYPASS] CEO agent skipped for session ${sessionId}`);
    return 'ok';
  }

  db.prepare(`UPDATE agent_runs SET status = 'running', started_at = ?, error_message = NULL, provider_used = NULL WHERE id = ?`)
    .run(new Date().toISOString(), runId);
  const timeoutMs = getAgentTimeout(agentId);
  // Sadece geçici hata (network/timeout) için 1 retry — aynı prompt ile tekrar çalıştırmanın anlamı yok
  const maxAttempts = 2; // 1 deneme + 1 retry
  let result: Awaited<ReturnType<typeof runAgent>> | null = null;

  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
        console.log(`  retry: ${agentId} (attempt ${attempt}/${maxAttempts})`);
        // Brief pause before retry to let transient network issues clear
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
      result = await runAgent({ agentId, taskPrompt, context: accumulatedContext, timeoutMs });
      if (result.success) break;
      if (result.errorType === 'rate_limit' || result.errorType === 'auth') break; // Rate limit/auth → pause, retry yapmaz
      // Diğer tüm hatalar (network, timeout, unknown) → retry
    }

    if (!result) throw new Error('runAgent returned no result');
    const completedAt = new Date().toISOString();

    if (result.success) {
      db.prepare(`
        UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
        output_text = ?, tokens_used = ?, cost_usd = ?, input_prompt = ?, error_message = NULL, provider_used = ? WHERE id = ?
      `).run(completedAt, result.durationMs, result.output, result.tokensUsed, result.costUsd, taskPrompt, result.provider, runId);

      costTracker.totalCost += result.costUsd;
      costTracker.totalTokens += result.tokensUsed;
      db.prepare(`UPDATE analysis_sessions SET total_cost_usd = ?, total_tokens = ? WHERE id = ?`)
        .run(costTracker.totalCost, costTracker.totalTokens, sessionId);

      // Store output with conservative limit — downstream agents will get even less via dependency matrix
      accumulatedContext[`${agentId}_output`] = result.output.slice(0, 1000000);

      // Schema validation — warn or soft_block (pipeline never stops; soft_block marks critical agents degraded)
      if (SCHEMA_VALIDATION_MODE === 'warn' || SCHEMA_VALIDATION_MODE === 'soft_block') {
        const validation = validateAgentOutput(agentId, result.output);
        if (!validation.valid) {
          const isBlockAgent = SCHEMA_VALIDATION_MODE === 'soft_block' && SCHEMA_SOFT_BLOCK_AGENTS.has(agentId);
          const prefix = isBlockAgent ? '[SCHEMA:SOFT_BLOCK]' : '[SCHEMA]';
          console.warn(`${prefix} ${agentId}: ${validation.errors.join('; ')}`);
          try {
            db.prepare(`INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, created_at)
              VALUES (?, ?, ?, ?, 'autonomous', 'completed', ?)`)
              .run(nanoid(), isBlockAgent ? 'schema_soft_block' : 'schema_warning', `${agentId} schema uyumsuzluğu`, validation.errors.join('\n'), new Date().toISOString());
          } catch { /* non-fatal logging */ }

          // BLOCK mode: mark critical agent outputs as degraded so downstream agents can see
          if (isBlockAgent) {
            console.warn(`[SCHEMA:SOFT_BLOCK] ${agentId} çıktısı schema'ya uymuyor — DEGRADED olarak işaretlendi`);
            accumulatedContext[`${agentId}_schema_soft_blocked`] = true;
          }
        }
        if (validation.warnings.length > 0) {
          console.log(`[SCHEMA] ${agentId} warnings: ${validation.warnings.join('; ')}`);
        }
        // Store extracted structured fields for downstream use
        if (Object.keys(validation.extractedFields).length > 0) {
          accumulatedContext[`${agentId}_structured`] = validation.extractedFields;
        }
      }

      // Financial Engine — financial_analysis tamamlandığında deterministik hesap çalıştır
      if (FINANCIAL_ENGINE_ENABLED && agentId === 'financial_analysis') {
        try {
          const engineInput = extractFinancialInputs(result.output, accumulatedContext);
          const engineOutput = computeAll(engineInput);
          accumulatedContext['financial_engine_results'] = engineOutput;
          const computedCount = Object.keys(engineOutput.ratios).length + Object.keys(engineOutput.scores).length;
          console.log(`[ENGINE] financial_analysis → ${computedCount} ratio/score hesaplandı, ${engineOutput.warnings.length} warning`);
          if (engineOutput.warnings.length > 0) {
            console.log(`[ENGINE] warnings: ${engineOutput.warnings.slice(0, 5).join('; ')}`);
          }
        } catch (err: any) {
          console.warn(`[ENGINE] Financial engine failed (fallback — LLM hesaplamaları kullanılacak): ${err.message}`);
          // Engine başarısız → pipeline devam eder, agent çıktıları yeterli
        }
      }

      if (agentId === 'final_summary') {
        const scoreMatch = result.output.match(/(?:overall[_\s-]*score|genel[_\s-]*puan|puan)\D{0,20}(\d{1,3}(?:[.,]\d+)?)/i);
        const overallScore = scoreMatch ? Number.parseFloat(scoreMatch[1].replace(',', '.')) : null;
        if (overallScore !== null && Number.isFinite(overallScore)) {
          db.prepare(`UPDATE analysis_sessions SET overall_score = ? WHERE id = ?`)
            .run(overallScore, sessionId);
        }
      }

      // Dependency-aware gap detection (observability for future retry logic)
      if (result.output) {
        const gap = detectUpstreamGap(agentId, result.output);
        if (gap.hasGap) {
          console.log(`[GAP DETECT] ${agentId}: ${gap.gapPatterns.length} upstream gaps, upstream agents: ${gap.upstreamAgents.join(', ') || 'unknown'}`);
          // TODO: Future enhancement — trigger upstream retry here
          try {
            db.prepare(`INSERT INTO watchdog_events (id, event_type, agent_id, session_id, ticker, details, created_at) VALUES (?, 'upstream_gap', ?, ?, ?, ?, ?)`)
              .run(nanoid(), agentId, sessionId, ticker, JSON.stringify({ gaps: gap.gapPatterns, upstream: gap.upstreamAgents }), new Date().toISOString());
          } catch (e) { /* non-fatal */ }
        }
      }
      return 'ok';
    } else {
      if (result.errorType === 'rate_limit') {
        db.prepare(`UPDATE agent_runs SET status = 'pending', started_at = NULL, error_message = 'Rate limit', provider_used = ? WHERE id = ?`)
          .run(result.provider, runId);
        db.prepare(`UPDATE analysis_sessions SET status = 'paused_rate_limit', error_message = ?, current_phase = ? WHERE id = ?`)
          .run(`Rate limit — ${agentId}`, phase, sessionId);
        return 'rate_limit';
      }
      db.prepare(`UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?, error_message = ?, input_prompt = ?, provider_used = ? WHERE id = ?`)
        .run(completedAt, result.durationMs, result.error || 'Unknown', taskPrompt, result.provider, runId);
      accumulatedContext[`${agentId}_output`] = `[DEGRADED] ${agentId} failed: ${(result.error || '').slice(0, 200)}`;
      return 'failed';
    }
  } catch (err: any) {
    db.prepare(`UPDATE agent_runs SET status = 'failed', error_message = ?, completed_at = ?, provider_used = NULL WHERE id = ?`)
      .run(err.message || String(err), new Date().toISOString(), runId);
    accumulatedContext[`${agentId}_output`] = `[DEGRADED] ${agentId} crashed: ${(err.message || '').slice(0, 200)}`;
    return 'failed';
  }
}

function parseSelectedLayers(raw: unknown): AnalysisLayer[] | undefined {
  if (typeof raw !== 'string' || raw.trim() === '') return undefined;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return undefined;
    const validLayers = new Set<AnalysisLayer>(ANALYSIS_LAYERS.map((layer) => layer.id));
    const filtered = parsed.filter(
      (value): value is AnalysisLayer => typeof value === 'string' && validLayers.has(value as AnalysisLayer),
    );
    return filtered.length > 0 ? filtered : undefined;
  } catch {
    return undefined;
  }
}

async function executeSession(
  sessionId: string,
  ticker: string,
  runtimeMode: RuntimeMode,
  selectedLayers?: AnalysisLayer[],
): Promise<void> {
  db.prepare(`UPDATE analysis_sessions SET status = 'running', error_message = NULL WHERE id = ?`).run(sessionId);

  const runRows = db.prepare(`SELECT agent_id FROM agent_runs WHERE session_id = ? ORDER BY rowid ASC`)
    .all(sessionId) as Array<{ agent_id: string }>;
  const pipeline = buildPipelineForLayers(runtimeMode, selectedLayers);
  const activeAgentIds = new Set(runRows.length > 0 ? runRows.map(r => r.agent_id) : pipeline);

  // PIPELINE MIGRATION: Insert agent_run rows for any agents that are in the current pipeline
  // but were not present when this session was originally created (added in a later code update).
  // This ensures sessions started before a pipeline update still run the new agents.
  const currentPipeline = pipeline;
  const insertMissingRun = db.prepare(`INSERT OR IGNORE INTO agent_runs (id, session_id, agent_id, agent_display_name, status) VALUES (?, ?, ?, ?, 'pending')`);
  for (const agentId of currentPipeline) {
    if (!activeAgentIds.has(agentId)) {
      const meta = getAgentMeta(agentId);
      if (!meta) continue;
      insertMissingRun.run(nanoid(), sessionId, agentId, meta.displayName);
      activeAgentIds.add(agentId);
      console.log(`  [pipeline-migration] Added missing agent to session: ${agentId}`);
    }
  }

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
    if (r.output_text) accumulatedContext[`${r.agent_id}_output`] = String(r.output_text).slice(0, 1000000);
  }

    // Price snapshot lock — tek referans fiyat tüm agent'larda kullanılır
    accumulatedContext['session_metadata'] = JSON.stringify({
      ticker,
      session_start: new Date().toISOString(),
      runtime_mode: runtimeMode,
      note: 'Tüm agent\'lar bu session_metadata\'daki bilgileri referans almalı. Farklı fiyat snapshot\'ları kullanmayın.'
    });

  // Pre-fetch macro snapshot (best-effort, non-blocking)
  try {
    const macroSnapshot = await fetchMacroSnapshot();
    accumulatedContext['macro_snapshot'] = JSON.stringify(macroSnapshot);
    console.log(`[ORCHESTRATOR] Macro snapshot: USD/TRY=${macroSnapshot.usdTry?.toFixed(2)} (${macroSnapshot.asOf})`);
  } catch (err) {
    console.warn(`[ORCHESTRATOR] Macro snapshot failed (non-fatal):`, err);
  }

  // Pre-fetch technical indicators for ticker (best-effort, non-blocking)
  try {
    const indicators = await computeIndicators(ticker);
    if (indicators) {
      accumulatedContext['technical_indicators'] = JSON.stringify(indicators);
      console.log(`[ORCHESTRATOR] Technical indicators: price=${indicators.currentPrice} RSI=${indicators.rsi14.toFixed(1)} MACD=${indicators.macd.line.toFixed(2)}`);
    }
  } catch (err) {
    console.warn(`[ORCHESTRATOR] Technical indicators failed (non-fatal):`, err);
  }

  // Version snapshot — capture artifact hashes at session start
  try {
    const snapshot = captureSessionSnapshot(pipeline);
    ensureColumn('analysis_sessions', 'version_snapshot', 'TEXT');
    db.prepare(`UPDATE analysis_sessions SET version_snapshot = ? WHERE id = ?`)
      .run(JSON.stringify(snapshot), sessionId);
  } catch (err: any) {
    console.warn(`[VERSION] Snapshot capture failed (non-fatal): ${err.message}`);
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
    const phaseStart = Date.now();
    const allPhaseAgents = phase.agents.flat().filter(id => activeAgentIds.has(id));
    console.log(`\n--- Phase: ${phase.name} [${allPhaseAgents.length} agent${allPhaseAgents.length > 1 ? ', parallel' : ''}] ---`);

    for (const parallelGroup of phase.agents) {
      // Filter to only agents that are in this session's pipeline
      const agentsToRun = parallelGroup.filter(id => activeAgentIds.has(id));
      if (agentsToRun.length === 0) continue;

      if (agentsToRun.length === 1) {
        // Single agent — run directly
        const status = await runSingleAgent(agentsToRun[0], sessionId, ticker, accumulatedContext, costTracker);
        if (status === 'rate_limit') return;
      } else {
        // Multiple agents — run with concurrency limit to avoid API throttling
        const MAX_CONCURRENT = 3;
        console.log(`  [parallel, max ${MAX_CONCURRENT}] ${agentsToRun.join(', ')}`);
        const results: string[] = [];
        for (let i = 0; i < agentsToRun.length; i += MAX_CONCURRENT) {
          const batch = agentsToRun.slice(i, i + MAX_CONCURRENT);
          const batchResults = await Promise.all(
            batch.map(id => runSingleAgent(id, sessionId, ticker, accumulatedContext, costTracker))
          );
          results.push(...batchResults);
          if (batchResults.includes('rate_limit')) return;
        }
      }
    }

    const phaseDur = Math.round((Date.now() - phaseStart) / 1000);
    if (allPhaseAgents.length > 0) {
      console.log(`  ← Phase ${phase.name} completed in ${phaseDur}s (${allPhaseAgents.join(', ')})`);
    }

    // DATA QUALITY GATE: after reconciliation phase
    if (phase.name === 'Data Quality' || phase.name === 'Data Quality & Context') {
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

    // ============================================================
    // PRE-QA COMPLETENESS GATE — Events phase bittikten sonra
    // QA'ya girmeden önce analiz agent'larının çıktıları yeterli mi?
    // ============================================================
    // PRE-QA gate kaldırıldı — gereksiz re-run döngüsü yaratıyordu.
    // Truncation Claude output limiti yüzünden oluyor, tekrar çalıştırınca da aynı.
    // QA zaten eksikleri tespit ediyor.

    // ============================================================
    // QA REVISION LOOP — Max 2 tur revision, sonra block
    // ============================================================
    if (phase.name === 'Quality Review') {
      const MAX_QA_ROUNDS = 2;

      for (let qaRound = 1; qaRound <= MAX_QA_ROUNDS; qaRound++) {
        const qaOutputRaw = String(accumulatedContext['qa_review_output'] || '');
        const qaOutput = qaOutputRaw.toLowerCase();

        // GOVERNANCE GATE — check qa_review DB status
        const qaRunRow = db.prepare(`SELECT status, error_message FROM agent_runs WHERE session_id = ? AND agent_id = 'qa_review'`)
          .get(sessionId) as { status: string; error_message: string | null } | undefined;

        if (qaRunRow?.status === 'failed') {
          const errMsg = (qaRunRow.error_message || '').toLowerCase();
          const isTransientError = errMsg.includes('enotfound') || errMsg.includes('unable to connect')
            || errMsg.includes('econnrefused') || errMsg.includes('network') || errMsg.includes('timeout');

          if (isTransientError) {
            console.error(`[GOVERNANCE] qa_review failed (geçici ağ hatası) — session duraklatılıyor`);
            db.prepare(`UPDATE agent_runs SET status = 'pending', started_at = NULL, error_message = 'Ağ hatası — otomatik yeniden denenecek' WHERE session_id = ? AND agent_id = 'qa_review'`)
              .run(sessionId);
            db.prepare(`UPDATE analysis_sessions SET status = 'paused_rate_limit', error_message = ?, current_phase = 'Quality Review' WHERE id = ?`)
              .run('Kalite kontrol geçici ağ hatası — otomatik yeniden deneme bekliyor', sessionId);
          } else {
            console.error(`[GOVERNANCE] qa_review başarısız — rapor oluşturma ENGELLENDİ`);
            db.prepare(`UPDATE analysis_sessions SET status = 'failed', error_message = ?, completed_at = ? WHERE id = ?`)
              .run('Kalite kontrol başarısız — rapor oluşturma engellendi.', new Date().toISOString(), sessionId);
          }
          return;
        }

        // Check if QA requests revision — WHITELIST approach: only pass explicit approval
        // "conditional_pass" is a masked failure — it acknowledges problems while passing. BLOCKED.
        const QA_BLOCK_KEYWORDS = [
          'revision_requested', 'rejected', 'reject', 'revision required',
          'fail', 'failed', 'block', 'blocked',
          'hard rejection', 'hard fail',
          'conditional_pass', 'condition_pass', 'koşullu geçiş', 'koşullu onay',
          'başarısız', 'reddedildi', 'revizyon gerekli', 'düzeltme gerekli',
        ];
        const keywordBlock = QA_BLOCK_KEYWORDS.some(marker => qaOutput.includes(marker));

        // Score-based blocking: extract numeric QA score, block if < 0.75
        const qaScoreMatch = qaOutputRaw.match(/overall[_\s-]*(?:score|puan|skor)["\s:]*([0-9]+(?:[.,][0-9]+)?)/i)
          || qaOutputRaw.match(/(?:genel|toplam)[_\s]*(?:score|puan|skor)["\s:]*([0-9]+(?:[.,][0-9]+)?)/i)
          || qaOutputRaw.match(/kalite[_\s-]*(?:score|puan|skor)["\s:]*([0-9]+(?:[.,][0-9]+)?)/i)
          || qaOutputRaw.match(/qa[_\s-]*(?:score|puan|skor)["\s:]*([0-9]+(?:[.,][0-9]+)?)/i);
        const qaNumericRaw = qaScoreMatch ? parseFloat(qaScoreMatch[1].replace(',', '.')) : null;
        // Normalize: scores on 0-10 scale are converted to 0-1
        const qaNormalized = qaNumericRaw !== null
          ? (qaNumericRaw > 1.5 ? qaNumericRaw / 10 : qaNumericRaw)
          : null;
        const scoreBlock = qaNormalized !== null && qaNormalized < 0.75;
        if (scoreBlock && !keywordBlock) {
          console.log(`[QA GATE] Score-based block: QA score ${qaNormalized?.toFixed(2)} < 0.75`);
        }

        const qaBlocksRelease = keywordBlock || scoreBlock;

        if (!qaBlocksRelease) {
          console.log(`[QA GATE] Round ${qaRound}/${MAX_QA_ROUNDS}: QA PASSED — devam ediliyor`);
          break; // QA passed, continue pipeline
        }

        // QA failed — if this is the last round, LOG WARNING but CONTINUE
        // Rapor eksik olabilir ama çıksın — Chairman kendi değerlendirir
        if (qaRound >= MAX_QA_ROUNDS) {
          console.warn(`[QA GATE] ${MAX_QA_ROUNDS} tur revision sonrası hâlâ geçemedi — UYARI ile devam ediliyor`);
          accumulatedContext['qa_warning'] = `QA ${MAX_QA_ROUNDS} turda onay veremedi. Rapor eksiklikler içerebilir.`;

          // CEO override post-mortem log — QA still blocking after max rounds but we ship anyway.
          try {
            db.prepare(`INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, created_at) VALUES (?, 'ceo_override', ?, ?, 'ceo', 'logged', ?)`)
              .run(
                nanoid(),
                `CEO Override — ${ticker}`,
                `QA flagged issues but CEO approved delivery. Session: ${sessionId}. Review post-mortem.\nQA ${MAX_QA_ROUNDS} revision turu sonrası hâlâ onay vermedi — CEO rapor teslimine izin verdi.`,
                new Date().toISOString(),
              );
          } catch (err: any) {
            console.warn(`[CEO OVERRIDE LOG] Failed to persist QA-revision override event: ${err.message}`);
          }

          break; // Block etme, devam et
        }

        // QA failed, round < max — REVISION: parse which agents need re-run
        console.log(`[QA GATE] Round ${qaRound}/${MAX_QA_ROUNDS}: QA revision requested — revize ediliyor`);
        db.prepare(`UPDATE analysis_sessions SET current_phase = ? WHERE id = ?`)
          .run(`QA Revision (Round ${qaRound + 1})`, sessionId);

        // Sadece P0/P1 blocker olarak işaretlenen agent'ları revize et
        // QA çıktısında her agent'ın adı geçer (değerlendirme yapıyor) — ama sadece
        // "BLOCKER" veya "P0" veya "P1" ile birlikte geçenler gerçekten revize edilmeli
        const REVISABLE_AGENTS = [
          'financial_analysis', 'data_collection', 'reconciliation',
          'context_extraction', 'valuation_agent',
        ];
        const agentsToRevise: string[] = [];
        for (const agentId of REVISABLE_AGENTS) {
          // Agent adı P0/P1/BLOCKER bağlamında mı geçiyor?
          const agentPattern = new RegExp(`(P0|P1|BLOCKER|blocker|critical).*${agentId}|${agentId}.*(P0|P1|BLOCKER|blocker|critical)`, 'i');
          if (agentPattern.test(qaOutputRaw)) {
            agentsToRevise.push(agentId);
          }
        }

        // Max 3 agent revize et — daha fazlası gereksiz maliyet
        const revisionTargets = agentsToRevise.length > 0
          ? agentsToRevise.slice(0, 3)
          : ['financial_analysis'];

        console.log(`[QA REVISION] Revize edilecek agent'lar: ${revisionTargets.join(', ')}`);

        // Inject TARGETED QA feedback — agent'a spesifik eksik listesi + knowledge.md yönlendirme
        accumulatedContext['qa_revision_feedback'] = qaOutputRaw.slice(0, 5000);
        accumulatedContext['qa_revision_round'] = qaRound + 1;
        accumulatedContext['qa_revision_instruction'] = [
          `QA REVISION TURU ${qaRound + 1} — ÖNCEKİ ÇIKTINDA EKSİKLER BULUNDU.`,
          ``,
          `YAPMAN GEREKENLER:`,
          `1. Yukarıdaki qa_revision_feedback'i oku — QA hangi eksikleri bulmuş?`,
          `2. \`Read\` ile kendi \`knowledge.md\` dosyanı aç — eksik formüller/benchmark'lar orada`,
          `3. SADECE eksik bölümleri tamamla — zaten doğru olan kısımları tekrar yazma`,
          `4. Çıktını kısa tut — sadece eksik metrikleri/bölümleri ekle`,
          `5. Truncation olmasın diye önce en kritik eksikleri yaz`,
        ].join('\n');

        // Smart revision: don't re-run agents whose failure is caused by upstream data gaps
        const qaRevisionText = String(accumulatedContext['qa_review_output'] || '').toLowerCase();
        const upstreamDataGap = qaRevisionText.includes('pending') || qaRevisionText.includes('veri yok') || (qaRevisionText.includes('eksik') && qaRevisionText.includes('parse'));
        if (upstreamDataGap) {
          console.log(`[QA REVISION] Upstream data gap detected — skipping agent re-runs, proceeding with available data`);
          // Don't re-run agents, just continue pipeline
        } else {
          // Re-run flagged agents — ORİJİNAL ÇIKTIYI KORU, revision patch olarak ekle
          for (const agentId of revisionTargets) {
            if (!activeAgentIds.has(agentId)) continue;
            // Orijinal çıktıyı context'te sakla — revision agent bunu görecek
            const originalRun = db.prepare(`SELECT output_text FROM agent_runs WHERE session_id = ? AND agent_id = ?`)
              .get(sessionId, agentId) as { output_text: string | null } | undefined;
            if (originalRun?.output_text) {
              accumulatedContext[`${agentId}_original_output`] = originalRun.output_text.slice(0, 10000);
            }
            db.prepare(`UPDATE agent_runs SET status = 'pending', started_at = NULL, completed_at = NULL, error_message = 'QA revision round ${qaRound + 1} — hedefli düzeltme' WHERE session_id = ? AND agent_id = ?`)
              .run(sessionId, agentId);
            const status = await runSingleAgent(agentId, sessionId, ticker, accumulatedContext, costTracker);
            if (status === 'rate_limit') return;
            // Revision sonrası: orijinal + revision birleştir
            const revisedRun = db.prepare(`SELECT output_text FROM agent_runs WHERE session_id = ? AND agent_id = ?`)
              .get(sessionId, agentId) as { output_text: string | null } | undefined;
            if (originalRun?.output_text && revisedRun?.output_text) {
              const merged = originalRun.output_text + '\n\n---\n## QA REVISION EKI\n' + revisedRun.output_text;
              db.prepare(`UPDATE agent_runs SET output_text = ? WHERE session_id = ? AND agent_id = ?`)
                .run(merged, sessionId, agentId);
              accumulatedContext[`${agentId}_output`] = merged.slice(0, 1000000);
            }
          }
        }

        // Clean up revision instruction after re-runs
        delete accumulatedContext['qa_revision_instruction'];

        // Re-run QA
        db.prepare(`UPDATE agent_runs SET status = 'pending', started_at = NULL, completed_at = NULL, output_text = NULL, error_message = 'QA re-review round ${qaRound + 1}' WHERE session_id = ? AND agent_id = 'qa_review'`)
          .run(sessionId);
        const qaRetryStatus = await runSingleAgent('qa_review', sessionId, ticker, accumulatedContext, costTracker);
        if (qaRetryStatus === 'rate_limit') return;
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

  // ============================================================
  // CEO APPROVAL GATE — RAPOR ONAYLANMADAN ÇIKMAZ
  // Chairman Direktifi: "Onaysız rapor çıkmasın. Bir daha böyle rapor getirme."
  // ============================================================
  const CEO_APPROVAL_AGENTS = ['qa_review', 'strategic_synthesis', 'final_summary'];
  const MIN_OUTPUT_LENGTH: Record<string, number> = {
    qa_review: 500,          // QA yorumları minimum 500 karakter olmalı
    strategic_synthesis: 2000, // Sentez minimum 2000 karakter
    final_summary: 5000,     // Final rapor minimum 5000 karakter
  };
  const DEGRADED_MARKERS = ['[DEGRADED]', 'crashed:', 'failed:', '[pending]'];

  const approvalFailures: string[] = [];

  for (const agentId of CEO_APPROVAL_AGENTS) {
    // 1. Agent pipeline'da aktif mi?
    if (!activeAgentIds.has(agentId)) continue;

    // 2. DB'deki run durumunu kontrol et
    const runRow = db.prepare(`SELECT status, output_text FROM agent_runs WHERE session_id = ? AND agent_id = ?`)
      .get(sessionId, agentId) as { status: string; output_text: string | null } | undefined;

    if (!runRow) {
      approvalFailures.push(`${agentId}: agent_run kaydı yok`);
      continue;
    }

    if (runRow.status !== 'completed') {
      approvalFailures.push(`${agentId}: status='${runRow.status}' (completed değil)`);
      continue;
    }

    const output = runRow.output_text || '';

    // 3. Truncation / boş çıktı kontrolü
    const minLen = MIN_OUTPUT_LENGTH[agentId] || 200;
    if (output.length < minLen) {
      approvalFailures.push(`${agentId}: çıktı çok kısa (${output.length} karakter, minimum ${minLen})`);
      continue;
    }

    // 4. Degraded marker kontrolü
    const degraded = DEGRADED_MARKERS.some(marker => output.startsWith(marker));
    if (degraded) {
      approvalFailures.push(`${agentId}: degraded/hatalı çıktı — "${output.slice(0, 80)}"`);
      continue;
    }

    // 5. Agent-specific content check
    if (agentId === 'qa_review') {
      const hasReview = /kalite|quality|score|puan|review|denetim|kontrol|eksik|eksiklik|sorun/i.test(output);
      if (!hasReview) {
        approvalFailures.push(`qa_review: gerçek kalite incelemesi içermiyor`);
      }
    }

    if (agentId === 'strategic_synthesis') {
      const hasSynthesis = /skor|score|sentez|synthesis|yatırım|değerlendirme|sonuç|risk|boyut/i.test(output);
      if (!hasSynthesis) {
        approvalFailures.push(`strategic_synthesis: sentez içeriği eksik (skor kartı veya değerlendirme bulunamadı)`);
      }
    }

    if (agentId === 'final_summary') {
      const hasContent = /hedef fiyat|target price|bear|bull|skor|özet|yönetici|rapor/i.test(output);
      if (!hasContent) {
        approvalFailures.push(`final_summary: zorunlu rapor içeriği eksik (hedef fiyat, yönetici özeti)`);
      }
    }
  }

  if (approvalFailures.length > 0) {
    const warningMsg = `CEO APPROVAL UYARI — ${approvalFailures.length} eksiklik:\n${approvalFailures.map(f => `  • ${f}`).join('\n')}`;
    console.warn(`\n⚠️  [CEO APPROVAL GATE] ${warningMsg}\n`);
    // Block etme, uyarı ile devam et — rapor çıksın, Chairman değerlendirir
    accumulatedContext['ceo_approval_warning'] = warningMsg;

    // CEO override post-mortem log — QA flagged issues but CEO approved delivery.
    // Persisted as ceo_activities row for Chairman review / governance traceability.
    try {
      db.prepare(`INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, created_at) VALUES (?, 'ceo_override', ?, ?, 'ceo', 'logged', ?)`)
        .run(
          nanoid(),
          `CEO Override — ${ticker}`,
          `QA flagged issues but CEO approved delivery. Session: ${sessionId}. Review post-mortem.\n\n${warningMsg}`,
          new Date().toISOString(),
        );
    } catch (err: any) {
      console.warn(`[CEO OVERRIDE LOG] Failed to persist override event: ${err.message}`);
    }
  } else {
    console.log(`\n✅ [CEO APPROVAL GATE] Tüm kritik agent'lar onaylandı — rapor teslime hazır\n`);
  }
  // ============================================================
  // END CEO APPROVAL GATE
  // ============================================================

  const finalSummaryRun = db.prepare(`
    SELECT output_text FROM agent_runs WHERE session_id = ? AND agent_id = 'final_summary'
  `).get(sessionId) as { output_text: string | null } | undefined;
  const finalSummaryOutput = finalSummaryRun?.output_text || '';
  const completedAt = new Date().toISOString();
  if (!finalSummaryOutput.trim()) {
    console.warn(`[PIPELINE] final_summary çıktısı boş — mevcut strategic_synthesis çıktısı ile devam ediliyor`);
    // Boş final_summary yerine strategic_synthesis çıktısını kullan
    const fallbackOutput = String(accumulatedContext['strategic_synthesis_output'] || 'Rapor özeti oluşturulamadı.');
    db.prepare(`INSERT INTO reports (id, session_id, report_type, title, content, created_at) VALUES (?, ?, 'executive', ?, ?, ?)`)
      .run(nanoid(), sessionId, `${ticker} — Yonetici Ozeti (Kısmi)`, fallbackOutput, completedAt);
  } else {
    db.prepare(`INSERT INTO reports (id, session_id, report_type, title, content, created_at) VALUES (?, ?, 'executive', ?, ?, ?)`)
      .run(nanoid(), sessionId, `${ticker} — Yonetici Ozeti`, finalSummaryOutput, completedAt);
  }

  if (activeAgentIds.has('report_formatter')) {
    let formatterStatus = await runSingleAgent('report_formatter', sessionId, ticker, accumulatedContext, costTracker);
    if (formatterStatus !== 'ok') {
      console.warn(`[PIPELINE] report_formatter fail (${formatterStatus}) — trying two-stage formatter`);
      // İki aşamalı formatter: prompt çok büyükse bölüm bölüm üret
      const twoStageSuccess = await runTwoStageFormatter(sessionId, ticker, accumulatedContext, costTracker);
      if (!twoStageSuccess) {
        // Son çare: normal retry
        db.prepare(`UPDATE agent_runs SET status = 'pending', started_at = NULL, completed_at = NULL, output_text = NULL, error_message = 'Formatter retry after two-stage failed' WHERE session_id = ? AND agent_id = 'report_formatter'`)
          .run(sessionId);
        formatterStatus = await runSingleAgent('report_formatter', sessionId, ticker, accumulatedContext, costTracker);
        if (formatterStatus !== 'ok') {
          console.warn(`[PIPELINE] report_formatter all attempts failed — PDF olmadan devam ediliyor, text rapor mevcut`);
        }
      }
      // Block etme — text rapor reports tablosunda, PDF olmasa da rapor tamamlansın
    }

    const formatterRun = db.prepare(`
      SELECT output_text FROM agent_runs WHERE session_id = ? AND agent_id = 'report_formatter'
    `).get(sessionId) as { output_text: string | null } | undefined;

    // If formatter wrote HTML to file but DB has only summary, store HTML in DB too
    const formatterOutput = formatterRun?.output_text || '';
    if (formatterOutput.length < 5000) {
      // Formatter likely wrote HTML to file, DB has only summary
      const htmlPath = path.join(PROJECT_ROOT, `${ticker}_Kapsamli_Analiz_Raporu_2026.html`);
      try {
        if (fs.existsSync(htmlPath)) {
          const htmlContent = fs.readFileSync(htmlPath, 'utf8');
          if (htmlContent.length > 5000) {
            db.prepare(`UPDATE agent_runs SET output_text = ? WHERE session_id = ? AND agent_id = 'report_formatter'`)
              .run(htmlContent, sessionId);
            console.log(`[PIPELINE] Formatter HTML stored in DB (${Math.round(htmlContent.length / 1024)}KB)`);
          }
        }
      } catch (err) {
        console.warn(`[PIPELINE] Could not store formatter HTML in DB:`, err);
      }
    }

    // ============================================================
    // COO DELIVERY CHECK — Rapor finalize olmadan son kontrol
    // ============================================================
    if (activeAgentIds.has('coo')) {
      console.log(`\n--- COO Delivery Check ---`);
      accumulatedContext['report_formatter_html'] = (formatterRun?.output_text || '').slice(0, 8000);
      accumulatedContext['delivery_check_mode'] = true;

      db.prepare(`UPDATE agent_runs SET status = 'pending', started_at = NULL, completed_at = NULL, output_text = NULL, error_message = 'Delivery check' WHERE session_id = ? AND agent_id = 'coo'`)
        .run(sessionId);
      const cooDeliveryStatus = await runSingleAgent('coo', sessionId, ticker, accumulatedContext, costTracker);

      if (cooDeliveryStatus === 'rate_limit') return;

      const cooOutput = String(accumulatedContext['coo_output'] || '').toLowerCase();
      const deliveryBlocked = cooOutput.includes('revision_needed') || cooOutput.includes('blocked');

      if (deliveryBlocked) {
        console.error(`[COO DELIVERY] Rapor teslimat kontrolünden geçemedi — revision gerekli`);
        db.prepare(`DELETE FROM reports WHERE session_id = ? AND report_type = 'executive'`).run(sessionId);

        // Report formatter'ı tekrar çalıştır
        db.prepare(`UPDATE agent_runs SET status = 'pending', started_at = NULL, completed_at = NULL, output_text = NULL, error_message = 'COO delivery revision' WHERE session_id = ? AND agent_id = 'report_formatter'`)
          .run(sessionId);
        const retryStatus = await runSingleAgent('report_formatter', sessionId, ticker, accumulatedContext, costTracker);
        if (retryStatus !== 'ok') {
          console.warn(`[COO DELIVERY] Formatter retry da fail — text rapor ile devam ediliyor`);
        } else {
          // Retry başarılı — PDF'i yeniden üret
          const retryFormatterRun = db.prepare(`SELECT output_text FROM agent_runs WHERE session_id = ? AND agent_id = 'report_formatter'`).get(sessionId) as { output_text: string | null } | undefined;
          try {
            await generatePdfFromFormatterOutput(ticker, retryFormatterRun?.output_text || '');
          } catch (pdfErr: any) {
            console.warn(`[COO DELIVERY] PDF retry failed: ${pdfErr.message} — text rapor ile devam`);
          }
        }
      }
    }
    // ============================================================
    // END COO DELIVERY CHECK
    // ============================================================

    try {
      await generatePdfFromFormatterOutput(ticker, formatterRun?.output_text || '');
    } catch (pdfErr: any) {
      console.warn(`[PIPELINE] PDF generation failed: ${pdfErr.message} — text rapor ile tamamlanıyor`);
      // PDF fail olsa bile text rapor reports tablosunda mevcut — block etme
    }
  }

  // Guard: only mark completed if still running (prevent duplicate completion on resume race)
  const currentStatus = (db.prepare(`SELECT status FROM analysis_sessions WHERE id = ?`).get(sessionId) as any)?.status;
  if (currentStatus === 'completed') {
    console.warn(`[GOVERNANCE] Session ${sessionId} already completed — skipping post-completion hooks`);
    return;
  }

  db.prepare(`UPDATE analysis_sessions SET status = 'completed', completed_at = ?, current_phase = NULL WHERE id = ?`)
    .run(completedAt, sessionId);

  // Post-completion: CEO feedback loop
  console.log(`Starting CEO feedback loop for ${ticker}`);
  try {
    await runFeedbackLoop(sessionId);
    console.log(`Feedback loop completed for ${ticker}`);
  } catch (err: any) {
    console.error(`Feedback loop failed (non-blocking):`, err.message);
  }

  // Post-completion: Regression eval (observe mode — never blocks)
  if (REGRESSION_EVAL_ENABLED) {
    try {
      const evalResult = runRegressionEval(sessionId);
      if (evalResult) {
        // Write eval summary to session row for governance traceability
        ensureColumn('analysis_sessions', 'eval_summary', 'TEXT');
        db.prepare(`UPDATE analysis_sessions SET eval_summary = ? WHERE id = ?`)
          .run(JSON.stringify(evalResult), sessionId);
        if (evalResult.regression_detected) {
          console.warn(`[GOVERNANCE] ⚠️ Regression detected for ${ticker} — review recommended`);
        } else {
          console.log(`[GOVERNANCE] ✅ ${ticker} quality check passed (${(evalResult.overall_quality * 100).toFixed(0)}%)`);
        }
      }
    } catch (err: any) {
      console.error(`[GOVERNANCE] Regression eval failed (non-blocking): ${err.message}`);
    }
  }
}

// ============================================================
// AGENT DEPENDENCY MATRIX — her agent sadece ihtiyacı olan context'i alır
// ============================================================
const AGENT_DEPENDENCIES: Record<string, string[]> = {
  ceo: [],
  coo: ['ceo_output'],
  data_collection: ['ceo_output', 'coo_output'],
  kap_watch: ['ceo_output'],
  parse_standardization: ['data_collection_output'],
  reconciliation: ['data_collection_output', 'parse_standardization_output'],
  context_extraction: ['data_collection_output', 'parse_standardization_output'],
  financial_analysis: ['parse_standardization_output', 'reconciliation_output', 'context_extraction_output'],
  technical_analysis: ['context_extraction_output'],
  macro_analysis: ['context_extraction_output'],
  sector_competition: ['context_extraction_output', 'financial_analysis_output'],
  valuation_agent: ['financial_analysis_output', 'context_extraction_output', 'macro_analysis_output'],
  esg_agent: ['context_extraction_output', 'data_collection_output'],
  sentiment_news_agent: ['context_extraction_output'],
  analyst_consensus_agent: ['context_extraction_output'],
  event_classification: ['kap_watch_output'],
  event_impact_mapper: ['event_classification_output', 'context_extraction_output'],
  event_timeline_alert: ['event_classification_output', 'event_impact_mapper_output'],
  qa_review: ['financial_analysis_output', 'context_extraction_output', 'reconciliation_output', 'valuation_agent_output'],
  strategic_synthesis: ['financial_analysis_output', 'technical_analysis_output', 'macro_analysis_output', 'sector_competition_output', 'context_extraction_output', 'event_impact_mapper_output', 'valuation_agent_output'],
  final_summary: ['strategic_synthesis_output', 'financial_analysis_output', 'valuation_agent_output', 'qa_review_output', 'macro_analysis_output', 'technical_analysis_output', 'sector_competition_output', 'context_extraction_output', 'esg_agent_output', 'sentiment_news_agent_output'],
  report_formatter: ['final_summary_output', 'strategic_synthesis_output', 'financial_analysis_output', 'technical_analysis_output', 'macro_analysis_output', 'sector_competition_output', 'valuation_agent_output', 'context_extraction_output', 'esg_agent_output', 'sentiment_news_agent_output', 'event_impact_mapper_output', 'analyst_consensus_agent_output', 'reconciliation_output'],
};

// Agent tipine göre context karakter limiti
const AGENT_CONTEXT_LIMITS: Record<string, number> = {
  // Veri agent'ları — az context yeterli
  data_collection: 3000, kap_watch: 2000, parse_standardization: 8000,
  reconciliation: 8000, event_classification: 3000,
  // Analiz agent'ları — digest aktif, gerçekçi limitler
  sentiment_news_agent: 30000, analyst_consensus_agent: 30000,
  event_impact_mapper: 30000, event_timeline_alert: 20000,
  financial_analysis: 50000, context_extraction: 40000,
  technical_analysis: 30000, macro_analysis: 40000,
  sector_competition: 40000, valuation_agent: 50000, esg_agent: 25000,
  // Sentez/QA/format — daha fazla context gerekli
  qa_review: 60000, strategic_synthesis: 60000, final_summary: 80000,
  report_formatter: 60000,
  ceo: 50000, coo: 20000,
};

// ============================================================
// RUNTIME DIGEST — upstream output'ları downstream agent'a özetleyerek geçirir
// DIGEST_MODE=false ise tüm digest atlanır, raw output slice kullanılır
// ============================================================

/**
 * Extract lines from text that contain any of the given keywords.
 * Includes the keyword line + up to `contextLines` surrounding lines.
 */
function extractByKeywords(text: string, keywords: string[], contextLines = 2, maxChars = 30000): string {
  const lines = text.split('\n');
  const linesLower = lines.map(l => l.toLowerCase());
  const keywordsLower = keywords.map(k => k.toLowerCase());
  const selected = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    if (keywordsLower.some(kw => linesLower[i].includes(kw))) {
      for (let j = Math.max(0, i - contextLines); j <= Math.min(lines.length - 1, i + contextLines); j++) {
        selected.add(j);
      }
    }
  }

  const sorted = Array.from(selected).sort((a, b) => a - b);
  const result: string[] = [];
  let prevIdx = -2;
  for (const idx of sorted) {
    if (idx > prevIdx + 1) result.push(''); // gap marker
    result.push(lines[idx]);
    prevIdx = idx;
  }

  const joined = result.join('\n').slice(0, maxChars);
  return joined;
}

/**
 * Extract markdown sections that match heading keywords.
 * Looks for ## or ### headings containing the keyword.
 */
function extractSections(text: string, headingKeywords: string[], maxChars = 40000): string {
  const lines = text.split('\n');
  const headingKwLower = headingKeywords.map(k => k.toLowerCase());
  const sections: string[] = [];
  let capturing = false;
  let currentSection: string[] = [];

  for (const line of lines) {
    const isHeading = /^#{1,4}\s/.test(line);
    if (isHeading) {
      // Finish previous section if capturing
      if (capturing && currentSection.length > 0) {
        sections.push(currentSection.join('\n'));
        currentSection = [];
      }
      // Check if this heading matches
      const lineLower = line.toLowerCase();
      capturing = headingKwLower.some(kw => lineLower.includes(kw));
    }
    if (capturing) {
      currentSection.push(line);
    }
  }
  if (capturing && currentSection.length > 0) {
    sections.push(currentSection.join('\n'));
  }

  return sections.join('\n\n').slice(0, maxChars);
}

/**
 * Extract tables (lines containing | characters) and their surrounding context.
 */
function extractTablesAndMetrics(text: string, maxChars = 40000): string {
  const lines = text.split('\n');
  const selected = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    // Table rows (contain |)
    if (lines[i].includes('|') && lines[i].trim().startsWith('|')) {
      for (let j = Math.max(0, i - 1); j <= Math.min(lines.length - 1, i + 1); j++) {
        selected.add(j);
      }
    }
    // Lines with numbers that look like financial data
    if (/\d{1,3}([.,]\d{3})+|\d+[.,]\d+%|\d+[.,]\d+x/.test(lines[i])) {
      selected.add(i);
    }
  }

  const sorted = Array.from(selected).sort((a, b) => a - b);
  const result: string[] = [];
  let prevIdx = -2;
  for (const idx of sorted) {
    if (idx > prevIdx + 1) result.push('');
    result.push(lines[idx]);
    prevIdx = idx;
  }

  return result.join('\n').slice(0, maxChars);
}

/**
 * Agent-pair specific digest rules.
 * Returns digested text, or null to use default raw slice.
 */
function digestOutput(sourceAgentId: string, rawOutput: string, targetAgentId: string): string | null {
  if (!DIGEST_MODE) return null; // Feature flag off → use raw

  // financial_analysis → valuation_agent: sadece FCF/EBITDA/kaldıraç/büyüme metrikleri
  if (sourceAgentId === 'financial_analysis' && targetAgentId === 'valuation_agent') {
    const digest = extractByKeywords(rawOutput, [
      'FCF', 'OCF', 'CAPEX', 'EBITDA', 'FAVÖK', 'Net Borç', 'Net Borc',
      'Faiz', 'Interest', 'WACC', 'büyüme', 'growth', 'ROE', 'ROCE', 'ROIC',
      'Nakit', 'Cash', 'Temettü', 'Dividend', 'Gelir', 'Revenue', 'Net Kar',
      'Özkaynak', 'Equity', 'Borç', 'Debt', 'Kaldıraç', 'Leverage',
    ], 3, 40000);
    return digest.length > 2000 ? digest : null; // Fallback if too little extracted
  }

  // financial_analysis → report_formatter: tablolar ve sayısal veriler öncelikli
  if (sourceAgentId === 'financial_analysis' && targetAgentId === 'report_formatter') {
    const digest = extractTablesAndMetrics(rawOutput, 50000);
    return digest.length > 2000 ? digest : null;
  }

  // financial_analysis → strategic_synthesis: tüm ana bölümler
  if (sourceAgentId === 'financial_analysis' && targetAgentId === 'strategic_synthesis') {
    const digest = extractSections(rawOutput, [
      'Karlılık', 'Profitability', 'Kaldıraç', 'Leverage', 'Likidite', 'Liquidity',
      'Nakit', 'Cash', 'İşletme Sermayesi', 'Working Capital', 'Trend', 'Risk',
      'Skor', 'Score', 'Özet', 'Summary', 'Sonuç', 'Conclusion',
    ], 40000);
    return digest.length > 2000 ? digest : null;
  }

  // context_extraction → any downstream: business model + management guidance + risk
  if (sourceAgentId === 'context_extraction') {
    const digest = extractSections(rawOutput, [
      'İş Modeli', 'Business Model', 'Yönetim', 'Management', 'Guidance',
      'Rehber', 'Strateji', 'Strategy', 'Risk', 'Ortaklık', 'Ownership',
      'Segment', 'SOTP', 'Holding', 'Temettü', 'Dividend', 'ESG',
      'Brand', 'Marka', 'Rekabet', 'Competition',
    ], 30000);
    return digest.length > 1000 ? digest : null;
  }

  // macro_analysis → any downstream: key indicators + risk signals
  if (sourceAgentId === 'macro_analysis') {
    const digest = extractByKeywords(rawOutput, [
      'TCMB', 'faiz', 'enflasyon', 'TÜFE', 'kur', 'USD/TRY', 'EUR/TRY',
      'büyüme', 'GDP', 'GSYH', 'cari açık', 'bütçe', 'risk', 'jeopolitik',
      'petrol', 'Brent', 'emtia', 'altın', 'tahvil', 'CDS', 'spread',
    ], 3, 15000);
    return digest.length > 1000 ? digest : null;
  }

  // technical_analysis → downstream: signal + levels only
  if (sourceAgentId === 'technical_analysis') {
    const digest = extractByKeywords(rawOutput, [
      'destek', 'support', 'direnç', 'resistance', 'sinyal', 'signal',
      'trend', 'RSI', 'MACD', 'hacim', 'volume', 'kırılım', 'breakout',
      'hedef', 'target', 'stop', 'fiyat', 'price', 'Bear', 'Bull', 'Baz',
    ], 2, 10000);
    return digest.length > 500 ? digest : null;
  }

  // sentiment_news_agent → downstream: score + top news
  if (sourceAgentId === 'sentiment_news_agent') {
    const digest = extractByKeywords(rawOutput, [
      'sentiment', 'skor', 'score', 'pozitif', 'negatif', 'nötr',
      'haber', 'news', 'analist', 'analyst', 'hedef fiyat', 'target',
      'SELL', 'BUY', 'HOLD', 'upgrade', 'downgrade',
    ], 2, 10000);
    return digest.length > 500 ? digest : null;
  }

  // sector_competition → downstream: Porter + peer ranking
  if (sourceAgentId === 'sector_competition') {
    const digest = extractByKeywords(rawOutput, [
      'Porter', 'rakip', 'competitor', 'peer', 'pazar payı', 'market share',
      'quartile', 'çeyrek', 'benchmark', 'sıralama', 'ranking',
      'avantaj', 'advantage', 'tehdit', 'threat', 'giriş engeli',
    ], 2, 12000);
    return digest.length > 500 ? digest : null;
  }

  // valuation_agent → downstream: target prices + method summary
  if (sourceAgentId === 'valuation_agent') {
    const digest = extractByKeywords(rawOutput, [
      'hedef fiyat', 'target price', 'DCF', 'WACC', 'upside', 'downside',
      'Bull', 'Bear', 'Baz', 'Base', 'çarpan', 'multiple', 'EV/EBITDA',
      'P/E', 'P/BV', 'NAV', 'SOTP', 'sensitivity', 'duyarlılık',
    ], 2, 15000);
    return digest.length > 500 ? digest : null;
  }

  // esg_agent → downstream: ESG scores + risks
  if (sourceAgentId === 'esg_agent') {
    const digest = extractByKeywords(rawOutput, [
      'ESG', 'çevresel', 'sosyal', 'yönetişim', 'karbon', 'emisyon',
      'sürdürülebilirlik', 'sustainability', 'risk', 'skor', 'score',
      'MSCI', 'CDP', 'GRI', 'uyum', 'compliance',
    ], 2, 8000);
    return digest.length > 500 ? digest : null;
  }

  // reconciliation → downstream: data quality signals
  if (sourceAgentId === 'reconciliation') {
    const digest = extractByKeywords(rawOutput, [
      'skor', 'score', 'tutarsızlık', 'inconsistency', 'uyarı', 'warning',
      'hata', 'error', 'doğrulama', 'validation', 'fark', 'deviation',
      'güvenilirlik', 'reliability', 'kaynak', 'source',
    ], 2, 8000);
    return digest.length > 500 ? digest : null;
  }

  return null; // No specific rule → use default raw slice
}

/**
 * Extract financial inputs from agent output text using regex.
 * Best-effort — returns whatever it can find, engine handles nulls gracefully.
 */
function extractFinancialInputs(faOutput: string, context: Record<string, unknown>): FinancialInputs {
  const inputs: FinancialInputs = {};

  // Strategy 1: Try to extract structured_financials JSON block (preferred — agent output'unun sonunda)
  const jsonMatch = faOutput.match(/```json\s*\n(\{[\s\S]*?"structured_financials"[\s\S]*?\})\s*\n```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      const sf = parsed.structured_financials || parsed;
      if (sf.revenue != null) inputs.revenue = sf.revenue;
      if (sf.cogs != null) inputs.cogs = sf.cogs;
      if (sf.gross_profit != null) inputs.grossProfit = sf.gross_profit;
      if (sf.ebit != null) inputs.ebit = sf.ebit;
      if (sf.ebitda != null) inputs.ebitda = sf.ebitda;
      if (sf.net_income != null) inputs.netIncome = sf.net_income;
      if (sf.interest_expense != null) inputs.interestExpense = sf.interest_expense;
      if (sf.total_assets != null) inputs.totalAssets = sf.total_assets;
      if (sf.current_assets != null) inputs.currentAssets = sf.current_assets;
      if (sf.current_liabilities != null) inputs.currentLiabilities = sf.current_liabilities;
      if (sf.equity != null) inputs.equity = sf.equity;
      if (sf.financial_debt != null) inputs.financialDebt = sf.financial_debt;
      if (sf.cash != null) inputs.cashAndEquivalents = sf.cash;
      if (sf.trade_receivables != null) inputs.tradeReceivables = sf.trade_receivables;
      if (sf.trade_payables != null) inputs.tradePayables = sf.trade_payables;
      if (sf.inventories != null) inputs.inventories = sf.inventories;
      if (sf.total_liabilities != null) inputs.totalLiabilities = sf.total_liabilities;
      if (sf.ocf != null) inputs.ocf = sf.ocf;
      if (sf.capex != null) inputs.capex = sf.capex;
      if (sf.shares_outstanding != null) inputs.sharesOutstanding = sf.shares_outstanding;
      if (sf.market_cap != null) inputs.marketCap = sf.market_cap;

      const fieldCount = Object.values(inputs).filter(v => v != null).length;
      console.log(`[ENGINE] Structured JSON block found — ${fieldCount} fields extracted`);
      return inputs; // JSON extraction successful — skip regex fallback
    } catch (err) {
      console.warn(`[ENGINE] Structured JSON parse failed, falling back to regex: ${err}`);
    }
  }

  // Strategy 2: Regex fallback — extract numbers from markdown text
  // Helper: extract first number after a keyword
  function extractNumber(text: string, ...patterns: string[]): number | undefined {
    for (const pattern of patterns) {
      // Match: keyword followed by number (with optional TL/B/M suffix)
      const regex = new RegExp(pattern + '[\\s:=]*([\\-]?[\\d.,]+)\\s*(?:TL|TRY|B|M|milyon|milyar)?', 'i');
      const match = text.match(regex);
      if (match) {
        let numStr = match[1].replace(/\./g, '').replace(',', '.'); // Turkish number format
        const val = parseFloat(numStr);
        if (Number.isFinite(val)) return val;
      }
    }
    return undefined;
  }

  // Also check structured fields from schema validator (Adım 5)
  const structured = context['financial_analysis_structured'] as Record<string, unknown> | undefined;

  // Revenue / Income Statement
  inputs.revenue = extractNumber(faOutput, 'Net Satış', 'Net Sales', 'Revenue', 'Hasılat');
  inputs.grossProfit = extractNumber(faOutput, 'Brüt Kar(?!.*Marj)', 'Gross Profit');
  inputs.ebitda = extractNumber(faOutput, 'FAVÖK(?!.*Marj)', 'EBITDA(?!.*Marj)');
  inputs.ebit = extractNumber(faOutput, 'FVÖK', 'EBIT(?!DA)', 'Faaliyet Kârı');
  inputs.netIncome = extractNumber(faOutput, 'Net (?:Dönem )?Kâr', 'Net Income', 'Net Profit');
  inputs.interestExpense = extractNumber(faOutput, 'Faiz Gider', 'Interest Expense');
  inputs.cogs = extractNumber(faOutput, 'SMM', 'COGS', 'Satışların Maliyeti');

  // Balance Sheet
  inputs.totalAssets = extractNumber(faOutput, 'Toplam (?:Aktif|Varlık)', 'Total Assets');
  inputs.currentAssets = extractNumber(faOutput, 'Dönen Varlık', 'Current Assets');
  inputs.currentLiabilities = extractNumber(faOutput, 'KVYK', 'Kısa Vadeli', 'Current Liabilities');
  inputs.equity = extractNumber(faOutput, 'Özkaynak', 'Özsermaye', 'Equity');
  inputs.financialDebt = extractNumber(faOutput, 'Finansal Borç', 'Financial Debt');
  inputs.cashAndEquivalents = extractNumber(faOutput, 'Nakit(?! Akış)', 'Cash(?! Flow)');
  inputs.tradeReceivables = extractNumber(faOutput, 'Ticari Alacak', 'Trade Receivable');
  inputs.tradePayables = extractNumber(faOutput, 'Ticari Borç', 'Trade Payable');
  inputs.inventories = extractNumber(faOutput, 'Stok', 'Inventor');
  inputs.totalLiabilities = extractNumber(faOutput, 'Toplam (?:Borç|Yükümlülük)', 'Total Liabilities');

  // Cash Flow
  inputs.ocf = extractNumber(faOutput, 'OCF', 'İşletme Nakit', 'Operating Cash');
  inputs.capex = extractNumber(faOutput, 'CAPEX', 'Yatırım Harcama');

  // Market
  inputs.marketCap = extractNumber(faOutput, 'Piyasa Değeri', 'Market Cap');
  inputs.sharesOutstanding = extractNumber(faOutput, 'Hisse (?:Adedi|Sayısı)', 'Shares Outstanding');

  return inputs;
}

/**
 * Build a structured report payload for report_formatter.
 * Instead of passing 13 raw agent outputs, assemble a compact payload
 * with pre-extracted sections, structured data, and clear instructions.
 * Falls back to raw context if REPORT_PAYLOAD_MODE is off.
 */
function buildReportPayload(ticker: string, context: Record<string, unknown>): string {
  // FORMATTER_MINIMAL_CONTEXT — trim the payload aggressively when true.
  // Drops all secondary agent excerpts; ships only the highest-signal content.
  const MINIMAL_MODE = FORMATTER_MINIMAL_CONTEXT;

  // Extract key sections from each agent output (first N chars of each)
  function excerpt(key: string, maxChars = 8000): string {
    return String(context[key] || '').slice(0, maxChars);
  }

  // Engine results if available
  const engineResults = context['financial_engine_results'] as Record<string, unknown> | undefined;
  const engineRatios = engineResults?.ratios as Record<string, { value: number | null }> | undefined;

  // Build compact key metrics from engine
  let keyMetrics = '';
  if (engineRatios) {
    const metrics = Object.entries(engineRatios)
      .filter(([, r]) => r.value !== null)
      .map(([name, r]) => `${name}: ${r.value}`)
      .join(' | ');
    keyMetrics = `\n### Engine Hesaplanmış Metrikler\n${metrics}\n`;
  }

  // Overall score from final_summary
  const scoreMatch = excerpt('final_summary_output', 2000).match(/(?:overall|genel|toplam)[_\s-]*(?:score|puan|skor)["\s:]*([0-9]+(?:[.,][0-9]+)?)/i);
  const overallScore = scoreMatch ? scoreMatch[1] : '?';

  // QA status
  const qaExcerpt = excerpt('qa_review_output', 2000).toLowerCase();
  const qaStatus = qaExcerpt.includes('pass') ? 'PASS' : qaExcerpt.includes('fail') ? 'FAIL' : 'UNKNOWN';

  // Data quality warning
  const dqWarning = context['data_quality_warning'] ? String(context['data_quality_warning']) : '';
  const qaWarning = context['qa_warning'] ? String(context['qa_warning']) : '';
  const ceoWarning = context['ceo_approval_warning'] ? String(context['ceo_approval_warning']) : '';

  // -------- MINIMAL MODE PATH --------
  if (MINIMAL_MODE) {
    // Build canonical_fact_pack — key numeric metrics from financial_analysis + reconciliation
    const faOutput = excerpt('financial_analysis_output', 20000);
    const reconOutput = excerpt('reconciliation_output', 8000);

    // Pull key financial lines (revenue, ebitda, margins, growth) via regex sweep.
    const factLines: string[] = [];
    const FACT_PATTERNS: Array<[string, RegExp]> = [
      ['Net Satışlar', /net\s+satı[sş]lar?[^\n]{0,160}/i],
      ['Revenue', /revenue[^\n]{0,120}/i],
      ['FAVÖK', /fav[öo]k[^\n]{0,160}/i],
      ['EBITDA', /ebitda[^\n]{0,120}/i],
      ['Net Kar', /net\s+(?:d[öo]nem\s+)?k[aâ]r[^\n]{0,160}/i],
      ['Net Income', /net\s+income[^\n]{0,120}/i],
      ['Brüt Marj', /br[üu]t\s+(?:k[aâ]r\s+)?(?:oran|marj)[^\n]{0,140}/i],
      ['FAVÖK Marjı', /fav[öo]k\s+(?:oran|marj)[^\n]{0,140}/i],
      ['Net Borç', /net\s+bor[çc][^\n]{0,140}/i],
      ['Net Debt', /net\s+debt[^\n]{0,120}/i],
      ['ROE', /roe[^\n]{0,120}/i],
      ['ROIC', /roic[^\n]{0,120}/i],
      ['ROA', /roa[^\n]{0,120}/i],
      ['DSO', /dso[^\n]{0,120}/i],
      ['Cari Oran', /cari\s+oran[^\n]{0,120}/i],
      ['İşletme Sermayesi', /i[sş]letme\s+sermayesi[^\n]{0,160}/i],
    ];
    for (const [label, pat] of FACT_PATTERNS) {
      const m = faOutput.match(pat);
      if (m) factLines.push(`- ${label}: ${m[0].replace(/\s+/g, ' ').trim().slice(0, 200)}`);
    }

    // Data quality score from reconciliation
    const dqMatch = reconOutput.match(/data_quality_score["\s:]*([0-9.]+)/i);
    const dqScore = dqMatch ? dqMatch[1] : null;
    if (dqScore) factLines.push(`- Data Quality Score: ${dqScore}`);

    const canonicalFactPack = factLines.length > 0
      ? `### Canonical Fact Pack\n${factLines.join('\n')}\n`
      : `### Canonical Fact Pack\n(no structured metrics extracted)\n`;

    // Brand identity — first 3K of context_extraction for logo/colors/style references
    const brandIdentity = excerpt('context_extraction_output', 3000);

    // Engine results block (full JSON if present, else metrics line)
    let engineBlock = '';
    if (engineResults) {
      try {
        const json = JSON.stringify(engineResults, null, 2);
        engineBlock = `\n### Engine Results (Deterministic)\n\`\`\`json\n${json.slice(0, 6000)}\n\`\`\`\n`;
      } catch {
        engineBlock = keyMetrics;
      }
    } else {
      engineBlock = keyMetrics;
    }

    const minimalPayload = `## REPORT PAYLOAD — ${ticker} (MINIMAL MODE)

### Metadata
- Ticker: ${ticker}
- Overall Score: ${overallScore}
- QA Status: ${qaStatus}
- Report Date: ${new Date().toLocaleDateString('tr-TR')}
${dqWarning ? `- Data Quality Warning: ${dqWarning}` : ''}
${qaWarning ? `- QA Warning: ${qaWarning}` : ''}
${ceoWarning ? `- CEO Warning: ${ceoWarning}` : ''}
${engineBlock}
${canonicalFactPack}
### Marka / Şirket Kimliği (context_extraction, ilk 3K)
${brandIdentity}

### Yönetici Özeti (final_summary — tam)
${excerpt('final_summary_output', 30000)}
`;

    return minimalPayload;
  }
  // -------- END MINIMAL MODE --------

  const payload = `## REPORT PAYLOAD — ${ticker}

### Metadata
- Ticker: ${ticker}
- Overall Score: ${overallScore}
- QA Status: ${qaStatus}
- Report Date: ${new Date().toLocaleDateString('tr-TR')}
${dqWarning ? `- Data Quality Warning: ${dqWarning}` : ''}
${qaWarning ? `- QA Warning: ${qaWarning}` : ''}
${ceoWarning ? `- CEO Warning: ${ceoWarning}` : ''}
${keyMetrics}
### Yönetici Özeti (final_summary)
${excerpt('final_summary_output', 8000)}

### Stratejik Sentez (strategic_synthesis)
${excerpt('strategic_synthesis_output', 6000)}

### Finansal Analiz (financial_analysis)
${excerpt('financial_analysis_output', 8000)}

### Değerleme (valuation_agent)
${excerpt('valuation_agent_output', 5000)}

### Şirket Profili (context_extraction)
${excerpt('context_extraction_output', 4000)}

### Makro Analiz (macro_analysis)
${excerpt('macro_analysis_output', 3000)}

### Sektör & Rekabet (sector_competition)
${excerpt('sector_competition_output', 3000)}

### Teknik Analiz (technical_analysis)
${excerpt('technical_analysis_output', 3000)}

### ESG (esg_agent)
${excerpt('esg_agent_output', 2000)}

### Haber & Sentiment (sentiment_news_agent)
${excerpt('sentiment_news_agent_output', 2000)}

### KAP Olayları (event_impact_mapper)
${excerpt('event_impact_mapper_output', 2000)}

### Analist Konsensüs (analyst_consensus_agent)
${excerpt('analyst_consensus_agent_output', 2000)}

### Veri Kalitesi (reconciliation)
${excerpt('reconciliation_output', 3000)}
`;

  return payload;
}

function buildTaskPrompt(agentId: string, ticker: string, context: Record<string, unknown>): string {
  // Use dependency matrix to filter context — each agent only sees what it needs
  const deps = AGENT_DEPENDENCIES[agentId] || [];
  const contextLimit = AGENT_CONTEXT_LIMITS[agentId] || CONTEXT_CHAR_LIMIT;

  let ctxKeys: string[];
  if (deps.length > 0) {
    // Only include declared dependencies
    ctxKeys = deps.filter(k => context[k] !== undefined);
  } else {
    // No dependencies declared — no prior outputs
    ctxKeys = [];
  }

  // Build context string with per-agent limit — distribute budget across dependencies
  // DIGEST_MODE: agent-pair bazlı digest uygula, fallback raw slice
  const perDepLimit = ctxKeys.length > 0 ? Math.floor(contextLimit / ctxKeys.length) : 0;
  const priorOutputs = ctxKeys.length > 0
    ? `\n\n## Prior Agent Outputs\n` + ctxKeys.map(k => {
        const sourceAgentId = k.replace('_output', '');
        const rawVal = String(context[k] || '');
        const digested = digestOutput(sourceAgentId, rawVal, agentId);
        const val = digested !== null
          ? digested.slice(0, perDepLimit)
          : rawVal.slice(0, perDepLimit);
        return `### ${sourceAgentId}\n${val}`;
      }).join('\n\n')
    : '';

  const perAgent: Record<string, string> = {
    ceo: `Interpret the analysis mandate for BIST-listed company ${ticker}. Define quality thresholds, assign work to specialist agents, and set the session scope. Output the mandate as a structured plan.`,
    coo: context.delivery_check_mode
      ? `DELIVERY CHECK MODE: ${ticker} raporu finalize edilmek üzere. report_formatter HTML çıktısını kontrol et.

Kontrol listesi:
1. HTML bütünlüğü (DOCTYPE, head, body, table kapanışları, sayfa sayısı)
2. İçerik bütünlüğü (kapak, yatırımcı kartı, finansal tablolar, SWOT, değerleme, risk matrisi)
3. Veri tutarlılığı (rapordaki rakamlar financial_analysis ile eşleşiyor mu, skor strategic_synthesis ile tutarlı mı)
4. Tablo genişlikleri taşıyor mu, sayfa geçişleri doğru mu

Çıktında delivery_status alanı ZORUNLU: "APPROVED" veya "REVISION_NEEDED" veya "BLOCKED".
REVISION_NEEDED veya BLOCKED dersen report_formatter tekrar çalışır.${priorOutputs}`
      : `PRE-FLIGHT CHECK: ${ticker} analizi başlamak üzere.

Kontrol et:
1. WebFetch ile kap.org.tr erişilebilir mi test et
2. WebFetch ile isyatirim.com.tr erişilebilir mi test et
3. Bu ticker için daha önce analiz yapılmış mı (context'te previous_report_date var mı bak)
4. Pipeline'daki agent sayısını raporla

Çıktında pre_flight_status alanı ZORUNLU: "GO" veya "NO_GO" veya "CONDITIONAL".${priorOutputs}`,
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

  // report_formatter: REPORT_PAYLOAD_MODE aktifse structured payload kullan, yoksa raw context
  if (agentId === 'report_formatter' && REPORT_PAYLOAD_MODE) {
    const payload = buildReportPayload(ticker, context);
    return (perAgent[agentId] || '') + '\n\n## Report Payload (Structured)\n' + payload;
  }

  return (perAgent[agentId] || `Perform your agent duties for ${ticker}.`) + priorOutputs;
}

// ============================================================
// İKİ AŞAMALI FORMATTER — büyük prompt sorununa karşı
// ============================================================
async function runTwoStageFormatter(
  sessionId: string,
  ticker: string,
  context: Record<string, unknown>,
  costTracker: { totalCost: number; totalTokens: number },
): Promise<boolean> {
  console.log(`[TWO-STAGE FORMATTER] Starting for ${ticker}`);

  const SECTIONS = [
    { id: 'cover_summary', title: 'Kapak + Yönetici Özeti', deps: ['final_summary_output', 'context_extraction_output'] },
    { id: 'financial', title: 'Finansal Analiz + Ratiolar', deps: ['financial_analysis_output'] },
    { id: 'valuation_sector', title: 'Değerleme + Sektör', deps: ['valuation_agent_output', 'sector_competition_output'] },
    { id: 'macro_technical', title: 'Makro + Teknik', deps: ['macro_analysis_output', 'technical_analysis_output'] },
    { id: 'sentiment_events', title: 'Sentiment + Events + ESG', deps: ['sentiment_news_agent_output', 'event_impact_mapper_output', 'analyst_consensus_agent_output', 'esg_agent_output'] },
    { id: 'synthesis_risks', title: 'Stratejik Sentez + Riskler', deps: ['strategic_synthesis_output'] },
  ];

  const sectionOutputs: Record<string, string> = {};

  for (const section of SECTIONS) {
    console.log(`[TWO-STAGE] Generating section: ${section.title}`);

    // Sadece bu section'a ait upstream'i topla
    const sectionContext: Record<string, unknown> = { ticker };
    for (const dep of section.deps) {
      const val = String(context[dep] || '').slice(0, 20000);
      if (val) sectionContext[dep] = val;
    }

    // Mini formatter prompt
    const sectionPrompt = [
      `# Section Generator: ${section.title}`,
      ``,
      `Ticker: ${ticker}`,
      `Bu sadece raporun bir bölümü. Sadece "${section.title}" için HTML üret.`,
      ``,
      `## Kurallar:`,
      `- Sadece bu section'ın HTML'ini üret, <section class="section"> ile başla </section> ile bitir`,
      `- İçeride H1 + tablolar + SVG grafikler + callout kutuları olsun`,
      `- CSS class isimleri: .section, .kpi-grid, .kpi-card, .data-table, .callout, .callout-positive, .callout-negative, .analysis-block`,
      `- Brand color: #003366 (başlıklar), #059669 (pozitif), #dc2626 (negatif)`,
      `- Metin sandviç kuralı: her tablo/grafik öncesi + sonrası metin ZORUNLU`,
      `- page-break-before: always; section başlangıcında`,
      ``,
      `## Upstream Data:`,
      Object.entries(sectionContext).filter(([k]) => k !== 'ticker').map(([k, v]) => `### ${k}\n${v}`).join('\n\n'),
      ``,
      `## Output:`,
      `Sadece HTML ver, başka açıklama yazma. <section> ile başla.`,
    ].join('\n');

    try {
      const { runAgent } = await import('./agent-runner.js');
      const result = await runAgent({
        agentId: 'report_formatter',
        taskPrompt: sectionPrompt,
        context: sectionContext,
        timeoutMs: 10 * 60 * 1000, // 10dk per section
      });

      if (result.success && result.output && result.output.length > 1000) {
        sectionOutputs[section.id] = result.output;
        costTracker.totalCost += result.costUsd || 0;
        costTracker.totalTokens += result.tokensUsed || 0;
        console.log(`[TWO-STAGE] ✓ ${section.title}: ${Math.round(result.output.length / 1024)}KB`);
      } else {
        console.warn(`[TWO-STAGE] ✗ ${section.title} failed: ${result.error || 'empty output'}`);
        sectionOutputs[section.id] = `<section class="section"><h1>${section.title}</h1><p>Bu bölüm üretilemedi.</p></section>`;
      }
    } catch (err) {
      console.error(`[TWO-STAGE] Error on ${section.title}:`, err);
      sectionOutputs[section.id] = `<section class="section"><h1>${section.title}</h1><p>Hata: ${err instanceof Error ? err.message : String(err)}</p></section>`;
    }
  }

  // HTML iskeletini oluştur
  const htmlShell = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${ticker} Kapsamlı Analiz Raporu</title>
<style>
@page { size: A4 portrait; margin: 20mm 15mm; }
body { font-family: 'Georgia', serif; font-size: 10pt; color: #1e293b; line-height: 1.5; }
.section { page-break-before: always; padding: 0 5mm; }
.section:first-child { page-break-before: avoid; }
h1 { color: #003366; font-size: 22pt; border-bottom: 2px solid #003366; padding-bottom: 8px; }
h2 { color: #003366; font-size: 16pt; margin-top: 20px; }
h3 { color: #1e3a5f; font-size: 13pt; }
table, .kpi-grid, .callout, .analysis-block { page-break-inside: avoid; }
table.data-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9pt; }
table.data-table th { background: #003366; color: #fff; padding: 8px; text-align: left; }
table.data-table td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
.kpi-card { border-left: 4px solid #003366; padding: 10px; background: #f8fafc; }
.kpi-label { font-size: 8pt; color: #64748b; text-transform: uppercase; }
.kpi-value { font-size: 16pt; font-weight: bold; color: #003366; margin: 4px 0; }
.callout { padding: 12px; margin: 12px 0; border-radius: 4px; }
.callout-positive { background: #d1fae5; border-left: 4px solid #059669; }
.callout-negative { background: #fee2e2; border-left: 4px solid #dc2626; }
.analysis-block { margin: 16px 0; }
.analysis-intro { font-style: italic; color: #475569; border-left: 3px solid #003366; padding-left: 10px; font-size: 10pt; }
.analysis-commentary { background: #f8fafc; padding: 12px; margin-top: 10px; font-size: 10pt; line-height: 1.7; }
orphans: 4; widows: 4;
p, li { orphans: 4; widows: 4; }
h1, h2, h3 { page-break-after: avoid; }
</style>
</head>
<body>
${SECTIONS.map(s => sectionOutputs[s.id] || '').join('\n\n')}
<section class="section" style="page-break-before: always;">
<h2>Yasal Uyarılar</h2>
<p><strong>Sorumluluk Reddi:</strong> Bu rapor sadece bilgilendirme amaçlıdır. Yatırım tavsiyesi değildir. SPK mevzuatı kapsamındadır.</p>
<p><em>Finance X Platform — ${new Date().toLocaleDateString('tr-TR')}</em></p>
</section>
</body>
</html>`;

  // Dosyaya yaz
  const htmlPath = path.join(PROJECT_ROOT, `${ticker}_Kapsamli_Analiz_Raporu_2026.html`);
  try {
    fs.writeFileSync(htmlPath, htmlShell, 'utf8');
    console.log(`[TWO-STAGE] HTML written: ${htmlPath} (${Math.round(htmlShell.length / 1024)}KB)`);

    // DB'ye agent_run olarak kaydet
    db.prepare(`UPDATE agent_runs SET status = 'completed', output_text = ?, error_message = 'Generated via two-stage formatter', completed_at = ? WHERE session_id = ? AND agent_id = 'report_formatter'`)
      .run(htmlShell, new Date().toISOString(), sessionId);

    return true;
  } catch (err) {
    console.error(`[TWO-STAGE] Failed to write HTML:`, err);
    return false;
  }
}
