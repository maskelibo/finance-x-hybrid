import { spawn } from 'node:child_process';
import { nanoid } from 'nanoid';
import { db } from './db.js';
import { resumeAllPausedSessions, resumeSession } from './orchestrator.js';
import { CLAUDE_SPAWN_OPTIONS, STUCK_AGENT_THRESHOLD_MS } from './config.js';

let watchdogTimer: NodeJS.Timeout | null = null;
let isChecking = false;

/**
 * On backend startup, any agent_run with status='running' is a zombie —
 * the process that was running it died when the backend restarted.
 * Reset them to pending so the session can be resumed cleanly.
 */
export function cleanupZombiesOnStartup(): { zombieRuns: number; pausedSessions: number } {
  // 1. Find all "running" agent runs — these are zombies after restart
  const zombies = db.prepare(`
    SELECT ar.id, ar.session_id, ar.agent_id, ar.agent_display_name, s.ticker
    FROM agent_runs ar
    JOIN analysis_sessions s ON ar.session_id = s.id
    WHERE ar.status = 'running'
  `).all() as Array<{
    id: string;
    session_id: string;
    agent_id: string;
    agent_display_name: string;
    ticker: string;
  }>;

  if (zombies.length === 0) {
    return { zombieRuns: 0, pausedSessions: 0 };
  }

  // 2. Reset each zombie run to pending
  const resetStmt = db.prepare(`
    UPDATE agent_runs
    SET status = 'pending',
        started_at = NULL,
        error_message = 'Zombie — backend yeniden başladı, temizlendi'
    WHERE id = ?
  `);

  // 3. Pause the containing sessions so watchdog/manual resume can restart them
  const pauseSessionStmt = db.prepare(`
    UPDATE analysis_sessions
    SET status = 'paused_rate_limit',
        error_message = 'Backend yeniden başladı — zombie agent temizlendi',
        current_phase = ?
    WHERE id = ? AND status = 'running'
  `);

  const affectedSessionIds = new Set<string>();

  for (const z of zombies) {
    resetStmt.run(z.id);
    pauseSessionStmt.run(z.agent_display_name, z.session_id);
    affectedSessionIds.add(z.session_id);
    console.log(`🧟 Zombie cleanup: ${z.agent_display_name} (${z.ticker}) → pending`);
  }

  // 4. Log CEO activity (best-effort, ignore errors if schema differs)
  try {
    db.prepare(`
      INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, created_at)
      VALUES (?, 'watchdog', 'Zombie temizliği', ?, 'autonomous', 'completed', ?)
    `).run(
      nanoid(),
      `Backend yeniden başladı. ${zombies.length} zombie agent temizlendi, ${affectedSessionIds.size} session duraklatıldı.`,
      new Date().toISOString()
    );
  } catch (err) {
    console.error('Zombie cleanup activity log failed (non-fatal):', err);
  }

  return { zombieRuns: zombies.length, pausedSessions: affectedSessionIds.size };
}

/**
 * Test if Claude CLI is currently responsive (rate limit not hit).
 * Uses a minimal 1-token prompt to probe availability without wasting quota.
 */
async function probeClaudeAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('claude', ['-p', 'ok', '--model', 'claude-haiku-4-5', '--output-format', 'json'], {
      ...CLAUDE_SPAWN_OPTIONS,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderrBuf = '';
    child.stderr.on('data', (c: Buffer) => { stderrBuf += c.toString('utf8'); });
    child.stdout.on('data', () => {}); // drain

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      resolve(false);
    }, 30000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(true);
        return;
      }
      const lower = stderrBuf.toLowerCase();
      // If stderr still says rate limit → not available
      if (lower.includes('limit') || lower.includes('quota') || lower.includes('429')) {
        resolve(false);
      } else {
        // Some other error (e.g., auth) — don't try to auto-resume
        resolve(false);
      }
    });

    child.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

/**
 * Detect and restart stuck agents that have been running too long.
 * Returns number of agents restarted.
 */
function detectAndRestartStuckAgents(): number {
  const now = Date.now();
  const stuckAgents = db.prepare(`
    SELECT ar.id, ar.session_id, ar.agent_id, ar.agent_display_name, ar.started_at,
           s.ticker
    FROM agent_runs ar
    JOIN analysis_sessions s ON ar.session_id = s.id
    WHERE ar.status = 'running'
      AND ar.started_at IS NOT NULL
      AND s.status = 'running'
  `).all() as Array<{
    id: string;
    session_id: string;
    agent_id: string;
    agent_display_name: string;
    started_at: string;
    ticker: string;
  }>;

  let restarted = 0;

  for (const agent of stuckAgents) {
    const startedAtMs = new Date(agent.started_at).getTime();
    const elapsedMs = now - startedAtMs;

    if (elapsedMs > STUCK_AGENT_THRESHOLD_MS) {
      console.log(`⚠️  Stuck agent detected: ${agent.agent_display_name} (${agent.agent_id}) in session ${agent.session_id} — running for ${Math.round(elapsedMs / 60000)} minutes`);

      // Reset agent run to pending (will be retried on next cycle)
      db.prepare(`
        UPDATE agent_runs
        SET status = 'pending',
            started_at = NULL,
            error_message = 'Timeout — Watchdog tarafından yeniden başlatıldı'
        WHERE id = ?
      `).run(agent.id);

      // Pause session temporarily
      db.prepare(`
        UPDATE analysis_sessions
        SET status = 'paused_rate_limit'
        WHERE id = ?
      `).run(agent.session_id);

      // Log CEO activity (correct schema)
      try {
        db.prepare(`
          INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, created_at)
          VALUES (?, 'watchdog', 'Stuck agent yeniden başlatıldı', ?, 'autonomous', 'completed', ?)
        `).run(
          nanoid(),
          `${agent.agent_display_name} (${agent.ticker}) — ${Math.round(elapsedMs / 60000)}dk timeout sonrası watchdog tarafından resetlendi`,
          new Date().toISOString()
        );
      } catch (err) {
        console.error('Watchdog activity log failed (non-fatal):', err);
      }

      // Resume session (will restart from the pending agent)
      setTimeout(() => {
        const resumed = resumeSession(agent.session_id);
        if (resumed) {
          console.log(`▶️  Session ${agent.session_id} (${agent.ticker}) restarted`);
        }
      }, 2000); // 2 saniye bekle, DB yazımlarının tamamlanması için

      restarted++;
    }
  }

  return restarted;
}

async function watchdogTick(): Promise<void> {
  if (isChecking) return;
  isChecking = true;

  try {
    // 1. Check for stuck agents (runs too long)
    const stuckRestarted = detectAndRestartStuckAgents();
    if (stuckRestarted > 0) {
      console.log(`🔄 Watchdog: ${stuckRestarted} stuck agent(s) restarted`);
    }

    // 2. Check for paused sessions (rate limit recovery)
    const pausedCount = (db.prepare(`
      SELECT COUNT(*) as c FROM analysis_sessions WHERE status = 'paused_rate_limit'
    `).get() as { c: number }).c;

    if (pausedCount > 0) {
      console.log(`🔍 Watchdog: ${pausedCount} paused session(s) — probing Claude availability...`);
      const available = await probeClaudeAvailability();
      if (available) {
        console.log(`✅ Claude available — resuming paused sessions`);
        const resumed = resumeAllPausedSessions();
        console.log(`▶️  Resumed ${resumed} session(s)`);
      } else {
        console.log(`⏳ Claude still rate-limited, will retry in 5 minutes`);
      }
    }
  } catch (err) {
    console.error('Watchdog error:', err);
  } finally {
    isChecking = false;
  }
}

export function startWatchdog(intervalMinutes: number = 2) {
  if (watchdogTimer) clearInterval(watchdogTimer);
  watchdogTimer = setInterval(() => {
    void watchdogTick();
  }, intervalMinutes * 60 * 1000);

  // Run one check on startup (delayed 10s — enough for DB to settle)
  setTimeout(() => void watchdogTick(), 10 * 1000);

  console.log(`🐕 Watchdog started — checking every ${intervalMinutes} minutes (stuck threshold: ${STUCK_AGENT_THRESHOLD_MS / 60000}dk)`);
}

export function stopWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

export async function manualResumeCheck(): Promise<{ available: boolean; resumed: number }> {
  const available = await probeClaudeAvailability();
  if (available) {
    const resumed = resumeAllPausedSessions();
    return { available: true, resumed };
  }
  return { available: false, resumed: 0 };
}
