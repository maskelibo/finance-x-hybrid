import { nanoid } from 'nanoid';
import { db } from './db.js';
import { resumeAllPausedSessions, resumeSession } from './orchestrator.js';
import { STUCK_AGENT_THRESHOLD_MS } from './config.js';
import { createDefaultProviderRouter } from './llm/default-router.js';

let watchdogTimer: NodeJS.Timeout | null = null;
let isChecking = false;
const providerRouter = createDefaultProviderRouter();

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

      // Pause session temporarily — use 'paused_stuck_agent' to distinguish from rate limit pauses.
      // This avoids the dashboard showing "kota bitti" (quota finished) for simple timeout restarts.
      db.prepare(`
        UPDATE analysis_sessions
        SET status = 'paused_stuck_agent',
            error_message = ?
        WHERE id = ?
      `).run(`${agent.agent_display_name} timeout — otomatik yeniden başlatılıyor`, agent.session_id);

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

    // 2a. Resume stuck-agent sessions immediately (no probe needed — not a quota issue)
    const stuckPaused = db.prepare(`
      SELECT id FROM analysis_sessions WHERE status = 'paused_stuck_agent'
    `).all() as Array<{ id: string }>;

    if (stuckPaused.length > 0) {
      console.log(`🔄 Watchdog: ${stuckPaused.length} stuck-agent session(s) — resuming immediately`);
      for (const row of stuckPaused) {
        if (resumeSession(row.id)) {
          console.log(`▶️  Stuck-agent session ${row.id} resumed`);
        }
      }
    }

    // 2b. Check for rate-limit paused sessions (resume if current routing path is available)
    const rateLimitPausedCount = (db.prepare(`
      SELECT COUNT(*) as c FROM analysis_sessions WHERE status = 'paused_rate_limit'
    `).get() as { c: number }).c;

    if (rateLimitPausedCount > 0) {
      console.log(`🔍 Watchdog: ${rateLimitPausedCount} rate-limited session(s) — probing provider availability...`);
      const availability = await providerRouter.probeRoutedAvailability();
      if (availability.available) {
        console.log(`✅ Provider available (${availability.provider ?? 'unknown'}) — resuming rate-limited sessions`);
        const resumed = resumeAllPausedSessions();
        console.log(`▶️  Resumed ${resumed} session(s)`);
      } else {
        console.log(`⏳ No provider currently available — 5 dakika sonra tekrar denenecek`);
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
  const availability = await providerRouter.probeRoutedAvailability();
  if (availability.available) {
    const resumed = resumeAllPausedSessions();
    return { available: true, resumed };
  }
  return { available: false, resumed: 0 };
}
