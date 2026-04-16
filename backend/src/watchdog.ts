import { nanoid } from 'nanoid';
import { db } from './db.js';
import { resumeAllPausedSessions, resumeSession } from './orchestrator.js';
import { STUCK_AGENT_THRESHOLD_MS, getStuckThresholdForAgent } from './config.js';
import { createDefaultProviderRouter } from './llm/default-router.js';

let watchdogTimer: NodeJS.Timeout | null = null;
let isChecking = false;
const providerRouter = createDefaultProviderRouter();

// -------------------------------------------------------------------
// Watchdog event logging — watchdog_events tablosuna kalıcı kayıt
// -------------------------------------------------------------------
function logWatchdogEvent(
  eventType: string,
  agentId: string | null,
  sessionId: string | null,
  ticker: string | null,
  details: string,
): void {
  try {
    db.prepare(`INSERT INTO watchdog_events (id, event_type, agent_id, session_id, ticker, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(nanoid(), eventType, agentId, sessionId, ticker, details, new Date().toISOString());
  } catch (err) {
    console.error('Watchdog event log failed (non-fatal):', err);
  }
}

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

  // 4. Log to watchdog_events + ceo_activities
  const description = `Backend yeniden başladı. ${zombies.length} zombie agent temizlendi, ${affectedSessionIds.size} session duraklatıldı.`;

  logWatchdogEvent('zombie_cleanup', null, null, null, description);

  try {
    db.prepare(`
      INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, created_at)
      VALUES (?, 'watchdog', 'Zombie temizliği', ?, 'autonomous', 'completed', ?)
    `).run(nanoid(), description, new Date().toISOString());
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
           ar.provider_used, ar.tokens_used, LENGTH(ar.input_prompt) as prompt_size,
           COALESCE(ar.retry_count, 0) as retry_count,
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
    provider_used: string | null;
    tokens_used: number;
    prompt_size: number | null;
    retry_count: number;
    ticker: string;
  }>;

  let restarted = 0;

  for (const agent of stuckAgents) {
    const startedAtMs = new Date(agent.started_at).getTime();
    const elapsedMs = now - startedAtMs;
    const threshold = getStuckThresholdForAgent(agent.agent_id);

    if (elapsedMs > threshold) {
      const elapsedMin = Math.round(elapsedMs / 60000);
      const thresholdMin = Math.round(threshold / 60000);

      console.log(`⚠️  Stuck agent detected: ${agent.agent_display_name} (${agent.agent_id}) in session ${agent.session_id} — running for ${elapsedMin}dk (threshold: ${thresholdMin}dk)`);

      // Rich stuck event details
      const details = JSON.stringify({
        agent_id: agent.agent_id,
        session_id: agent.session_id,
        ticker: agent.ticker,
        elapsed_ms: elapsedMs,
        elapsed_min: elapsedMin,
        threshold_ms: threshold,
        threshold_min: thresholdMin,
        provider: agent.provider_used || 'unknown',
        prompt_size_chars: agent.prompt_size || 0,
        tokens_so_far: agent.tokens_used || 0,
      });

      // Log to watchdog_events
      logWatchdogEvent('stuck_detected', agent.agent_id, agent.session_id, agent.ticker, details);

      // Log CEO activity
      try {
        db.prepare(`
          INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, created_at)
          VALUES (?, 'watchdog', 'Stuck agent yeniden başlatıldı', ?, 'autonomous', 'completed', ?)
        `).run(
          nanoid(),
          `${agent.agent_display_name} (${agent.ticker}) — ${elapsedMin}dk timeout (eşik: ${thresholdMin}dk), provider: ${agent.provider_used || '?'}, prompt: ${agent.prompt_size ? Math.round(agent.prompt_size / 1000) + 'K' : '?'}`,
          new Date().toISOString()
        );
      } catch (err) {
        console.error('Watchdog activity log failed (non-fatal):', err);
      }

      const retryCount = (agent.retry_count || 0) + 1;

      if (retryCount >= 3) {
        // 3rd stuck: skip agent, mark as failed with DEGRADED
        console.log(`🚫 Agent ${agent.agent_id} stuck 3x — skipping with DEGRADED marker`);
        db.prepare(`
          UPDATE agent_runs
          SET status = 'failed',
              retry_count = ?,
              error_message = ?
          WHERE id = ?
        `).run(retryCount, `[DEGRADED] ${retryCount}x timeout — agent atlandı`, agent.id);

        // Resume session (will skip the failed agent)
        setTimeout(() => {
          resumeSession(agent.session_id);
        }, 1000);

        logWatchdogEvent('stuck_skip_degraded', agent.agent_id, agent.session_id, agent.ticker,
          JSON.stringify({ retry_count: retryCount, action: 'skip_degraded' }));
      } else {
        // 1st or 2nd stuck: reset to pending and retry
        db.prepare(`
          UPDATE agent_runs
          SET status = 'pending',
              started_at = NULL,
              retry_count = ?,
              error_message = ?
          WHERE id = ?
        `).run(retryCount, `Timeout (${elapsedMin}dk > ${thresholdMin}dk eşik) — Watchdog retry #${retryCount}`, agent.id);

        // Pause session temporarily
        db.prepare(`
          UPDATE analysis_sessions
          SET status = 'paused_stuck_agent',
              error_message = ?
          WHERE id = ?
        `).run(`${agent.agent_display_name} timeout (${elapsedMin}dk) — retry #${retryCount}`, agent.session_id);

        // Resume session
        setTimeout(() => {
          const resumed = resumeSession(agent.session_id);
          if (resumed) {
            console.log(`▶️  Session ${agent.session_id} (${agent.ticker}) restarted (retry #${retryCount})`);
          }
        }, 2000);
      }

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
      console.log(`🔄 Watchdog: ${stuckPaused.length} stuck-agent session(s) — resuming`);
      for (const row of stuckPaused) {
        const resumed = resumeSession(row.id);
        if (resumed) {
          console.log(`▶️  Stuck-agent session ${row.id} resumed`);
        } else {
          // Force status to paused_stuck_agent if it's in an unresumable state
          const session = db.prepare(`SELECT status FROM analysis_sessions WHERE id = ?`).get(row.id) as { status: string } | undefined;
          if (session && !['completed', 'failed'].includes(session.status)) {
            console.log(`🔧 Watchdog: session ${row.id} stuck in '${session.status}' — forcing to paused_stuck_agent for retry`);
            db.prepare(`UPDATE analysis_sessions SET status = 'paused_stuck_agent' WHERE id = ?`).run(row.id);
            // Try resume again
            resumeSession(row.id);
          }
        }
      }
    }

    // 2b. Check for rate-limit paused sessions — STAGGERED RESUME
    const rateLimitPaused = db.prepare(`
      SELECT id, ticker FROM analysis_sessions WHERE status = 'paused_rate_limit'
    `).all() as Array<{ id: string; ticker: string }>;

    if (rateLimitPaused.length > 0) {
      console.log(`🔍 Watchdog: ${rateLimitPaused.length} rate-limited session(s) — probing provider availability...`);
      const availability = await providerRouter.probeRoutedAvailability();
      if (availability.available) {
        console.log(`✅ Provider available (${availability.provider ?? 'unknown'}) — resuming rate-limited sessions (staggered)`);

        // Staggered resume — 15 saniye aralıklarla resume ederek thundering herd önle
        const STAGGER_INTERVAL_MS = 15000;
        let resumed = 0;

        for (let i = 0; i < rateLimitPaused.length; i++) {
          const row = rateLimitPaused[i];
          const delay = i * STAGGER_INTERVAL_MS;

          if (delay === 0) {
            // İlk session hemen resume
            if (resumeSession(row.id)) {
              resumed++;
              logWatchdogEvent('rate_limit_resume', null, row.id, row.ticker, `Session resumed (stagger: 0ms)`);
            }
          } else {
            // Sonraki session'lar aralıklı
            setTimeout(() => {
              if (resumeSession(row.id)) {
                logWatchdogEvent('rate_limit_resume', null, row.id, row.ticker, `Session resumed (stagger: ${delay}ms)`);
                console.log(`▶️  Staggered resume: ${row.id} (${row.ticker}) after ${delay / 1000}s`);
              }
            }, delay);
            resumed++;
          }
        }

        console.log(`▶️  Resumed ${resumed} session(s) with ${STAGGER_INTERVAL_MS / 1000}s stagger interval`);
      } else {
        console.log(`⏳ No provider currently available — sonraki tick'te tekrar denenecek`);
        logWatchdogEvent('rate_limit_probe_failed', null, null, null,
          `${rateLimitPaused.length} session(s) bekliyor, provider unavailable`);
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

  console.log(`🐕 Watchdog started — checking every ${intervalMinutes} minutes`);
  console.log(`   Default stuck threshold: ${STUCK_AGENT_THRESHOLD_MS / 60000}dk (agent-specific overrides active)`);
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
