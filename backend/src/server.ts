import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { db } from './db.js';
import { listAgents } from './agents.js';
import { startAnalysisSession } from './orchestrator.js';
import { chatWithCEO, streamChatWithCEO, getSessionHistory, clearSession, abortCEOChat } from './ceo-chat.js';
import { startHeartbeat, stopHeartbeat, runHeartbeatCycle, isHeartbeatRunning } from './heartbeat.js';
import { startNightTraining, stopNightTraining, runNightTrainingCycle, isNightTrainingRunning } from './night-training.js';
import { readCEOMemory, writeCEOMemory, getAgentMemoryMtime, writeAgentMemory, MemoryConflictError } from './memory.js';
import { startWatchdog, stopWatchdog, manualResumeCheck, cleanupZombiesOnStartup } from './watchdog.js';
import { resumeSession, resumeAllPausedSessions } from './orchestrator.js';
import { getAllSettings, updateSettings } from './settings.js';
import { runFeedbackLoop } from './feedback-loop.js';
import { ANALYSIS_LAYERS, ANALYSIS_MODES, VALID_ANALYSIS_LAYERS, VALID_RUNTIME_MODES, type AnalysisLayer, type RuntimeMode } from './analysis-config.js';
import { registerRefactorDashboardRoutes } from './refactor/dashboard-api.js';
import fs from 'node:fs';
import path from 'node:path';
import { ALLOWED_ORIGINS, AGENTS_ROOT, PORT, HEARTBEAT_INTERVAL_MIN, WATCHDOG_INTERVAL_MIN, NIGHT_TRAINING_HOUR_UTC, LLM_PRIMARY_PROVIDER } from './config.js';
import { loadSecrets } from './security/secrets.js';

// P6A: pluggable secrets boot hook. SECRETS_MODE unset/'env' = no-op.
loadSecrets().catch(err => {
  console.warn('[secrets-boot] loadSecrets failed (non-fatal):', err instanceof Error ? err.message : err);
});

console.log(`ℹ️  LLM provider: ${LLM_PRIMARY_PROVIDER}`);

const app = express();

// CORS
app.use(cors({
  origin: ALLOWED_ORIGINS,
}));
app.use(express.json({ limit: '10mb' }));

// API Key authentication middleware
const API_KEY = process.env.FINANCE_X_API_KEY;
if (API_KEY) {
  app.use('/api', (req, res, next) => {
    // Health endpoint herkese açık
    if (req.path === '/health') return next();
    const key = req.headers['x-api-key'] || req.query.apiKey;
    if (key !== API_KEY) {
      return res.status(401).json({ error: 'Geçersiz API anahtarı' });
    }
    next();
  });
  console.log('🔐 API Key authentication aktif');
} else {
  console.warn('⚠️  FINANCE_X_API_KEY tanımlı değil — API korumasız çalışıyor');
}

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'finance-x-backend' });
});

// Phase 11A — refactor observability dashboard API.
registerRefactorDashboardRoutes(app);

// Serve the static refactor dashboard UI. Kept outside the /api auth gate
// so the HTML loads; the API calls it makes still pass through the API key
// middleware above. ESM-compatible path resolution.
const REFACTOR_DASHBOARD_DIR = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
  '..',
  'public',
  'refactor-dashboard',
);
if (fs.existsSync(REFACTOR_DASHBOARD_DIR)) {
  app.use('/refactor-dashboard', express.static(REFACTOR_DASHBOARD_DIR));
}

// Operational metrics — JSON snapshot of session & agent health.
// Prometheus-compatible text exposition available at GET /metrics (below).
app.get('/api/metrics', (_req, res) => {
  const sessionStats = db.prepare(`
    SELECT status, COUNT(*) as count FROM analysis_sessions GROUP BY status
  `).all() as Array<{ status: string; count: number }>;

  const agentStats = db.prepare(`
    SELECT agent_id, status, COUNT(*) as count FROM agent_runs GROUP BY agent_id, status
  `).all() as Array<{ agent_id: string; status: string; count: number }>;

  const avgDuration = db.prepare(`
    SELECT agent_id, AVG(duration_ms) as avg_ms, COUNT(*) as n
    FROM agent_runs
    WHERE status = 'completed' AND duration_ms IS NOT NULL
    GROUP BY agent_id
  `).all() as Array<{ agent_id: string; avg_ms: number; n: number }>;

  const heartbeat = db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
           MAX(created_at) as last_run
    FROM ceo_activities WHERE activity_type = 'heartbeat'
  `).get() as { total: number; completed: number; failed: number; last_run: string };

  res.json({
    sessions: Object.fromEntries(sessionStats.map(s => [s.status, s.count])),
    agents: agentStats,
    avgDurationMs: Object.fromEntries(avgDuration.map(a => [a.agent_id, { avgMs: Math.round(a.avg_ms), n: a.n }])),
    heartbeat,
    timestamp: new Date().toISOString(),
  });
});

// Prometheus text exposition — scrape with standard Prometheus at this path.
app.get('/metrics', (_req, res) => {
  const lines: string[] = [];

  const sessionStats = db.prepare(`
    SELECT status, COUNT(*) as count FROM analysis_sessions GROUP BY status
  `).all() as Array<{ status: string; count: number }>;
  lines.push('# HELP finance_x_sessions_total Analysis sessions by status');
  lines.push('# TYPE finance_x_sessions_total gauge');
  for (const row of sessionStats) {
    lines.push(`finance_x_sessions_total{status="${row.status}"} ${row.count}`);
  }

  const agentRuns = db.prepare(`
    SELECT agent_id, status, COUNT(*) as count FROM agent_runs GROUP BY agent_id, status
  `).all() as Array<{ agent_id: string; status: string; count: number }>;
  lines.push('# HELP finance_x_agent_runs_total Agent runs by agent and status');
  lines.push('# TYPE finance_x_agent_runs_total counter');
  for (const row of agentRuns) {
    lines.push(`finance_x_agent_runs_total{agent="${row.agent_id}",status="${row.status}"} ${row.count}`);
  }

  const avgDuration = db.prepare(`
    SELECT agent_id, AVG(duration_ms) as avg_ms
    FROM agent_runs WHERE status = 'completed' AND duration_ms IS NOT NULL
    GROUP BY agent_id
  `).all() as Array<{ agent_id: string; avg_ms: number }>;
  lines.push('# HELP finance_x_agent_duration_ms Average agent run duration (completed runs)');
  lines.push('# TYPE finance_x_agent_duration_ms gauge');
  for (const row of avgDuration) {
    lines.push(`finance_x_agent_duration_ms{agent="${row.agent_id}"} ${Math.round(row.avg_ms)}`);
  }

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(lines.join('\n') + '\n');
});

app.get('/api/analysis/config', (_req, res) => {
  res.json({
    modes: ANALYSIS_MODES,
    layers: ANALYSIS_LAYERS,
  });
});

// List all agents (with live status from last runs) — single JOIN query instead of N+1
app.get('/api/agents', (_req, res) => {
  const agentStats = db.prepare(`
    SELECT
      agent_id,
      COUNT(*) as total_runs,
      MAX(COALESCE(started_at, '')) as last_run_at
    FROM agent_runs
    GROUP BY agent_id
  `).all() as Array<{ agent_id: string; total_runs: number; last_run_at: string }>;

  const lastStatuses = db.prepare(`
    SELECT agent_id, status, completed_at, started_at
    FROM agent_runs ar1
    WHERE rowid = (
      SELECT rowid FROM agent_runs ar2
      WHERE ar2.agent_id = ar1.agent_id
      ORDER BY COALESCE(ar2.started_at, '') DESC LIMIT 1
    )
  `).all() as Array<{ agent_id: string; status: string; completed_at: string; started_at: string }>;

  const statsMap = new Map(agentStats.map(s => [s.agent_id, s]));
  const statusMap = new Map(lastStatuses.map(s => [s.agent_id, s]));

  const agents = listAgents().map(a => {
    const stats = statsMap.get(a.id);
    const lastRun = statusMap.get(a.id);
    return {
      id: a.id,
      displayName: a.displayName,
      group: a.group,
      systemPromptLength: a.systemPrompt.length,
      status: lastRun?.status || 'idle',
      lastRunAt: lastRun?.completed_at || lastRun?.started_at || null,
      totalRuns: stats?.total_runs || 0,
    };
  });
  res.json({ agents });
});

// Get single agent with full prompt
app.get('/api/agents/:id', (req, res) => {
  try {
    const agents = listAgents();
    const agent = agents.find(a => a.id === req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start a new analysis
const VALID_THEMES = new Set(['institutional', 'anthropic', 'minimal']);

app.post('/api/analysis/start', (req, res) => {
  const { ticker, runtimeMode, layers, theme } = req.body as {
    ticker?: string;
    runtimeMode?: RuntimeMode;
    layers?: AnalysisLayer[];
    theme?: string;
  };

  // Ticker validation
  if (!ticker) return res.status(400).json({ error: 'ticker required' });
  const cleanTicker = String(ticker).trim().toUpperCase();
  if (!/^[A-Z]{3,6}$/.test(cleanTicker)) {
    return res.status(400).json({ error: 'Geçersiz ticker formatı. 3-6 harfli BIST sembolü kullanın (örn: ASELS, THYAO)' });
  }

  // Mode validation
  const mode: RuntimeMode = runtimeMode || 'standard_institutional';
  if (!VALID_RUNTIME_MODES.has(mode)) {
    return res.status(400).json({ error: 'Geçersiz analiz modu' });
  }

  // Layer validation
  const filteredLayers = Array.isArray(layers)
    ? layers.filter((layer): layer is AnalysisLayer => VALID_ANALYSIS_LAYERS.has(layer as AnalysisLayer))
    : undefined;

  // Require at least one layer if layers array is provided
  if (Array.isArray(layers) && filteredLayers && filteredLayers.length === 0) {
    return res.status(400).json({ error: 'En az bir analiz katmanı seçmelisiniz' });
  }

  // Theme validation — silently fall back to default if missing/invalid
  const resolvedTheme = theme && VALID_THEMES.has(theme) ? theme : 'institutional';

  try {
    const sessionId = startAnalysisSession(cleanTicker, mode, filteredLayers, resolvedTheme);
    res.json({ sessionId, ticker: cleanTicker, runtimeMode: mode, layers: filteredLayers, theme: resolvedTheme, status: 'started' });
  } catch (err: any) {
    // Duplicate-ticker guard from orchestrator: surface the existing session id
    // with HTTP 409 so callers can poll the active pipeline instead of
    // double-spawning.
    if (err?.name === 'DuplicateSessionError') {
      return res.status(409).json({
        error: err.message,
        existingSessionId: err.existingSessionId,
        ticker: cleanTicker,
        code: 'duplicate_session',
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// Expose the available themes so the dashboard can render a selector.
app.get('/api/themes', (_req, res) => {
  res.json({
    themes: [
      { name: 'institutional', label: 'Kurumsal (Navy/Gold)', description: 'Varsayılan Finance X teması — Goldman/BofA tarzı koyu lacivert.' },
      { name: 'anthropic',     label: 'Anthropic (Warm Neutrals)', description: 'Sıcak tonlar + amber vurgu. Modern, minimal, okuma odaklı.' },
      { name: 'minimal',       label: 'Minimal (Siyah/Gri)', description: 'Vurgusuz, temiz siyah-gri palet. İkincil markalaşma gerektiren senaryolar için.' },
    ],
    default: 'institutional',
  });
});

// List all sessions
app.get('/api/analysis/sessions', (_req, res) => {
  const sessions = db.prepare(`
    SELECT * FROM analysis_sessions ORDER BY started_at DESC LIMIT 100
  `).all();
  res.json({ sessions });
});

// Get session detail with agent runs
app.get('/api/analysis/sessions/:id', (req, res) => {
  const session = db.prepare(`SELECT * FROM analysis_sessions WHERE id = ?`).get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const runs = db.prepare(`
    SELECT * FROM agent_runs WHERE session_id = ? ORDER BY rowid ASC
  `).all(req.params.id);

  const reports = db.prepare(`
    SELECT * FROM reports WHERE session_id = ? ORDER BY created_at ASC
  `).all(req.params.id);

  res.json({ session, runs, reports });
});

// Live stream of agent runs for a session (polling endpoint)
app.get('/api/analysis/sessions/:id/runs', (req, res) => {
  const runs = db.prepare(`
    SELECT * FROM agent_runs WHERE session_id = ? ORDER BY rowid ASC
  `).all(req.params.id);
  res.json({ runs });
});

// List all reports
app.get('/api/reports', (_req, res) => {
  const reports = db.prepare(`
    SELECT r.*, s.ticker, s.runtime_mode
    FROM reports r
    JOIN analysis_sessions s ON r.session_id = s.id
    ORDER BY r.created_at DESC LIMIT 100
  `).all();
  res.json({ reports });
});

// Get single report
app.get('/api/reports/:id', (req, res) => {
  const report = db.prepare(`SELECT * FROM reports WHERE id = ?`).get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
});

// Delete a report
app.delete('/api/reports/:id', (req, res) => {
  const result = db.prepare(`DELETE FROM reports WHERE id = ?`).run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Report not found' });
  res.json({ ok: true });
});

// Download latest PDF report for a ticker
app.get('/api/reports/:ticker/pdf', (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  // Ticker validation — path traversal önleme
  if (!/^[A-Z]{2,8}$/.test(ticker)) {
    return res.status(400).json({ error: 'Geçersiz ticker formatı' });
  }
  const projectRoot = path.resolve(process.cwd(), '..');

  // Find the most recent PDF matching the ticker
  const files = fs.readdirSync(projectRoot)
    .filter(f => f.toUpperCase().includes(ticker) && f.endsWith('.pdf'))
    .map(f => ({ name: f, path: path.join(projectRoot, f), mtime: fs.statSync(path.join(projectRoot, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    return res.status(404).json({ error: `No PDF report found for ${ticker}` });
  }

  const latest = files[0];
  // Dosya yolunun proje kökü dışına çıkmadığını doğrula
  const resolvedPath = path.resolve(latest.path);
  if (!resolvedPath.startsWith(path.resolve(projectRoot))) {
    return res.status(403).json({ error: 'Erişim reddedildi' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${path.basename(latest.name)}"`);
  fs.createReadStream(resolvedPath).pipe(res);
});

// List all available PDF reports
app.get('/api/reports/pdfs/list', (_req, res) => {
  const projectRoot = path.resolve(process.cwd(), '..');
  const files = fs.readdirSync(projectRoot)
    .filter(f => f.endsWith('.pdf'))
    .map(f => {
      const stat = fs.statSync(path.join(projectRoot, f));
      return { filename: f, size_kb: Math.round(stat.size / 1024), modified: stat.mtime.toISOString() };
    })
    .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
  res.json({ pdfs: files });
});

// Re-render a report using the template system from existing agent_runs data
app.post('/api/reports/:sessionId/rerender', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = db.prepare(`SELECT ticker FROM analysis_sessions WHERE id = ?`).get(sessionId) as { ticker: string } | undefined;
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Reconstruct accumulatedContext from agent_runs
    const runs = db.prepare(`SELECT agent_id, output_text FROM agent_runs WHERE session_id = ? AND status = 'completed'`)
      .all(sessionId) as Array<{ agent_id: string; output_text: string | null }>;
    const accCtx: Record<string, unknown> = {};
    for (const run of runs) {
      accCtx[`${run.agent_id}_output`] = run.output_text || '';
    }

    const { composeReportContext } = await import('./python/report_formatter/compose.js');
    const { renderTemplate } = await import('./python/report_formatter/template_engine.js');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const templatePath = path.join(process.cwd(), 'dist', 'template.html');
    const template = fs.readFileSync(templatePath, 'utf-8');

    const ctx = composeReportContext({
      ticker: session.ticker,
      reportId: `rpt-rerender-${Date.now()}`,
      accumulatedContext: accCtx,
    });
    const html = renderTemplate(template, ctx);

    // Update reports table
    db.prepare(`UPDATE reports SET content = ? WHERE session_id = ? AND report_type = 'executive'`)
      .run(html, sessionId);

    res.json({ ok: true, ticker: session.ticker, html_bytes: html.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Compare reports for multiple tickers
app.get('/api/analysis/compare', (req, res) => {
  const tickers = (req.query.tickers as string || '').split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
  if (tickers.length < 2) return res.status(400).json({ error: 'At least 2 tickers required (comma-separated)' });

  const results = tickers.map(ticker => {
    const report = db.prepare(`
      SELECT r.content, r.created_at, s.ticker, s.runtime_mode
      FROM reports r JOIN analysis_sessions s ON r.session_id = s.id
      WHERE s.ticker = ? AND s.status = 'completed'
      ORDER BY r.created_at DESC LIMIT 1
    `).get(ticker) as any;
    return { ticker, report: report || null, hasReport: !!report };
  });

  const missing = results.filter(r => !r.hasReport).map(r => r.ticker);
  res.json({ comparisons: results, missing });
});

// Delete an analysis session (and its agent runs)
app.delete('/api/analysis/sessions/:id', (req, res) => {
  const sessionId = req.params.id;
  db.prepare(`DELETE FROM agent_runs WHERE session_id = ?`).run(sessionId);
  db.prepare(`DELETE FROM reports WHERE session_id = ?`).run(sessionId);
  const result = db.prepare(`DELETE FROM analysis_sessions WHERE id = ?`).run(sessionId);
  if (result.changes === 0) return res.status(404).json({ error: 'Session not found' });
  res.json({ ok: true });
});

// Dashboard overview stats
app.get('/api/stats/overview', (_req, res) => {
  const totalSessions = db.prepare(`SELECT COUNT(*) as c FROM analysis_sessions`).get() as { c: number };
  const completedSessions = db.prepare(`SELECT COUNT(*) as c FROM analysis_sessions WHERE status = 'completed'`).get() as { c: number };
  const runningSessions = db.prepare(`SELECT COUNT(*) as c FROM analysis_sessions WHERE status = 'running'`).get() as { c: number };
  const totalCost = db.prepare(`SELECT COALESCE(SUM(total_cost_usd), 0) as c FROM analysis_sessions`).get() as { c: number };
  const totalTokens = db.prepare(`SELECT COALESCE(SUM(total_tokens), 0) as c FROM analysis_sessions`).get() as { c: number };
  const activeAgents = listAgents().length;

  res.json({
    totalAnalyses: totalSessions.c,
    completedAnalyses: completedSessions.c,
    runningAnalyses: runningSessions.c,
    activeAgents,
    totalCostUsd: totalCost.c,
    totalTokens: totalTokens.c,
  });
});

// Cost breakdown by agent
app.get('/api/stats/costs', (_req, res) => {
  const byAgent = db.prepare(`
    SELECT
      agent_id,
      agent_display_name,
      COUNT(*) as runs,
      COALESCE(SUM(cost_usd), 0) as total_cost,
      COALESCE(SUM(tokens_used), 0) as total_tokens
    FROM agent_runs
    WHERE status = 'completed'
    GROUP BY agent_id
    ORDER BY total_cost DESC
  `).all();
  res.json({ byAgent });
});

// CEO Chat — direct conversation with the CEO Meta-Agent
app.post('/api/ceo/chat', async (req, res) => {
  const { sessionId, message } = req.body as { sessionId?: string; message?: string };
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message required' });
  }
  try {
    const result = await chatWithCEO(sessionId, message);
    res.json({ content: result.content, durationMs: result.durationMs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SSE streaming endpoint for CEO chat
app.post('/api/ceo/chat/stream', (req, res) => {
  const { sessionId, message } = req.body as { sessionId?: string; message?: string };
  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message required' });
  }
  try {
    streamChatWithCEO(sessionId, message, res);
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || 'CEO stream failed' });
      return;
    }
    try {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err?.message || 'CEO stream failed' })}\n\n`);
    } catch {}
    res.end();
  }
});

app.get('/api/ceo/chat/:sessionId', (req, res) => {
  const history = getSessionHistory(req.params.sessionId);
  res.json({ history });
});

app.delete('/api/ceo/chat/:sessionId', (req, res) => {
  clearSession(req.params.sessionId);
  res.json({ ok: true });
});

// Abort in-flight CEO chat
app.post('/api/ceo/chat/:sessionId/abort', (req, res) => {
  const ok = abortCEOChat(req.params.sessionId);
  res.json({ ok });
});

// CEO Memory — with optimistic locking
app.get('/api/ceo/memory', (_req, res) => {
  res.json({
    content: readCEOMemory(),
    mtime: getAgentMemoryMtime('ceo'),
  });
});

app.put('/api/ceo/memory', (req, res) => {
  const { content, mtime } = req.body as { content?: string; mtime?: number };
  if (typeof content !== 'string') return res.status(400).json({ error: 'content required' });
  try {
    writeAgentMemory('ceo', content, mtime);
    res.json({ ok: true, mtime: getAgentMemoryMtime('ceo') });
  } catch (err: any) {
    if (err instanceof MemoryConflictError) {
      return res.status(409).json({
        error: 'Hafıza arka planda güncellendi. Lütfen yenileyin.',
        currentMtime: err.currentMtime,
        expectedMtime: err.expectedMtime,
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// CEO System Prompt
app.get('/api/ceo/system-prompt', (_req, res) => {
  const p = path.join(AGENTS_ROOT, 'ceo', 'system_prompt.md');
  try {
    res.json({ content: fs.readFileSync(p, 'utf8') });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Heartbeat
app.post('/api/ceo/heartbeat/run', async (_req, res) => {
  if (isHeartbeatRunning()) {
    return res.status(409).json({ error: 'Heartbeat already running' });
  }
  res.json({ ok: true, started: true });
  void runHeartbeatCycle();
});

app.get('/api/ceo/heartbeat/status', (_req, res) => {
  res.json({ running: isHeartbeatRunning() });
});

// Night Training
app.post('/api/ceo/night-training/run', async (_req, res) => {
  if (isNightTrainingRunning()) {
    return res.status(409).json({ error: 'Night training already running' });
  }
  res.json({ ok: true, started: true });
  void runNightTrainingCycle();
});

app.get('/api/ceo/night-training/status', (_req, res) => {
  res.json({ running: isNightTrainingRunning() });
});

// CEO Activities
app.get('/api/ceo/activities', (_req, res) => {
  const activities = db.prepare(`
    SELECT * FROM ceo_activities ORDER BY created_at DESC LIMIT 100
  `).all();
  res.json({ activities });
});

// Goals
app.get('/api/goals', (_req, res) => {
  const goals = db.prepare(`SELECT * FROM goals ORDER BY created_at DESC`).all();
  res.json({ goals });
});

app.post('/api/goals', (req, res) => {
  const { title, description, priority } = req.body as { title?: string; description?: string; priority?: string };
  if (!title) return res.status(400).json({ error: 'title required' });
  const id = nanoid();
  db.prepare(`
    INSERT INTO goals (id, title, description, status, priority, created_by, created_at)
    VALUES (?, ?, ?, 'active', ?, 'chairman', ?)
  `).run(id, title, description || null, priority || 'normal', new Date().toISOString());
  res.json({ id });
});

app.patch('/api/goals/:id', (req, res) => {
  const goal = db.prepare(`SELECT id FROM goals WHERE id = ?`).get(req.params.id);
  if (!goal) { res.status(404).json({ error: 'Goal not found' }); return; }

  const { status, progress_notes } = req.body as { status?: string; progress_notes?: string };
  if (status) {
    db.prepare(`UPDATE goals SET status = ?, completed_at = ? WHERE id = ?`).run(
      status,
      status === 'completed' ? new Date().toISOString() : null,
      req.params.id
    );
  }
  if (progress_notes) {
    db.prepare(`UPDATE goals SET progress_notes = ? WHERE id = ?`).run(progress_notes, req.params.id);
  }
  res.json({ ok: true });
});

app.delete('/api/goals/:id', (req, res) => {
  const result = db.prepare(`DELETE FROM goals WHERE id = ?`).run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Goal not found' }); return; }
  res.json({ ok: true });
});

// Watchlist
app.get('/api/watchlist', (_req, res) => {
  const items = db.prepare(`SELECT * FROM watchlist ORDER BY added_at DESC`).all();
  res.json({ watchlist: items });
});

app.post('/api/watchlist', (req, res) => {
  const { ticker, company_name, notes } = req.body as { ticker?: string; company_name?: string; notes?: string };
  if (!ticker) return res.status(400).json({ error: 'ticker required' });
  try {
    const id = nanoid();
    db.prepare(`
      INSERT INTO watchlist (id, ticker, company_name, added_at, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, ticker.toUpperCase(), company_name || null, new Date().toISOString(), notes || null);
    res.json({ id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/watchlist/:id', (req, res) => {
  const result = db.prepare(`DELETE FROM watchlist WHERE id = ?`).run(req.params.id);
  if (result.changes === 0) { res.status(404).json({ error: 'Watchlist item not found' }); return; }
  res.json({ ok: true });
});

// KAP Events
app.get('/api/kap/events', (req, res) => {
  const { ticker, event_type, limit } = req.query;
  const limitNum = Math.min(Number(limit) || 100, 500);
  let query = `SELECT * FROM kap_events WHERE 1=1`;
  const params: any[] = [];
  if (ticker) {
    query += ` AND ticker = ?`;
    params.push(String(ticker).toUpperCase());
  }
  if (event_type) {
    query += ` AND event_type = ?`;
    params.push(String(event_type));
  }
  query += ` ORDER BY published_at DESC LIMIT ?`;
  params.push(limitNum);
  const events = db.prepare(query).all(...params);
  res.json({ events });
});

app.post('/api/kap/events', (req, res) => {
  const e = req.body as any;
  if (!e.ticker || !e.event_type || !e.title || !e.published_at) {
    return res.status(400).json({ error: 'ticker, event_type, title, published_at required' });
  }
  const id = nanoid();
  db.prepare(`
    INSERT INTO kap_events (id, ticker, company_name, event_type, title, content, source_url,
                            published_at, detected_at, impact_direction, impact_score, confidence,
                            affected_statements, session_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, e.ticker.toUpperCase(), e.company_name || null, e.event_type, e.title,
    e.content || null, e.source_url || null, e.published_at, new Date().toISOString(),
    e.impact_direction || null, e.impact_score || null, e.confidence || null,
    e.affected_statements ? JSON.stringify(e.affected_statements) : null,
    e.session_id || null
  );
  res.json({ id });
});

// Settings
app.get('/api/settings', (_req, res) => {
  res.json(getAllSettings());
});

app.put('/api/settings', (req, res) => {
  try {
    updateSettings(req.body);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Resume / Watchdog endpoints
// CEO Feedback Loop — reviews report and gives feedback to agents
app.post('/api/analysis/sessions/:id/feedback', async (req, res) => {
  try {
    res.json({ ok: true, started: true });
    void runFeedbackLoop(req.params.id).catch(err => {
      console.error('Feedback loop error:', err.message);
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analysis/resume-all', async (_req, res) => {
  try {
    const result = await manualResumeCheck();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/analysis/sessions/:id/resume', (req, res) => {
  const ok = resumeSession(req.params.id);
  res.json({ ok });
});

// Serve dashboard static files from ../dashboard/dist
const dashboardPath = path.resolve(process.cwd(), '..', 'dashboard', 'dist');
if (fs.existsSync(dashboardPath)) {
  app.use(express.static(dashboardPath));
  // SPA fallback — all non-API routes serve index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(dashboardPath, 'index.html'));
    }
  });
  console.log(`📊 Dashboard: http://localhost:${PORT} (static from dashboard/dist)`);
} else {
  console.log(`⚠️  Dashboard build not found at ${dashboardPath} — run: cd dashboard && npm run build`);
}

// R8: Init OpenTelemetry (no-op if OTEL_EXPORTER_URL not set)
import('./observability/setup.js').then(m => m.initTracing()).catch(err => {
  console.warn('[tracing] init skipped:', err instanceof Error ? err.message : err);
});

// R8b: Wire event bus subscribers (auto-trigger on material KAP disclosures, etc.)
import('./event-bus-wiring.js').then(m => m.initEventBusWiring()).catch(err => {
  console.warn('[event-bus] wiring skipped:', err instanceof Error ? err.message : err);
});

app.listen(PORT, () => {
  console.log(`\n🚀 Finance X Backend`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Database: data/financex.db`);
  console.log(`   Agents loaded: ${listAgents().length}`);

  // Clean up zombie agent runs from previous backend instance
  const zombieResult = cleanupZombiesOnStartup();
  if (zombieResult.zombieRuns > 0) {
    console.log(`🧟 Cleaned ${zombieResult.zombieRuns} zombie agent run(s), paused ${zombieResult.pausedSessions} session(s)`);
  }

  // Start CEO autonomous heartbeat
  startHeartbeat(HEARTBEAT_INTERVAL_MIN);

  // Start CEO night training protocol
  startNightTraining(NIGHT_TRAINING_HOUR_UTC);

  // Start watchdog to auto-resume paused sessions when rate limit lifts
  startWatchdog(WATCHDOG_INTERVAL_MIN);

  console.log('');
});

// Graceful shutdown — clean up timers and DB on exit
function shutdown(signal: string) {
  console.log(`\n🛑 ${signal} received — shutting down gracefully...`);
  stopHeartbeat();
  stopNightTraining();
  stopWatchdog();
  try { db.close(); } catch {}
  console.log('✅ Cleanup complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
