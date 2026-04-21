/**
 * Persists the end-of-session AddressalReport to the DB — Phase 6A observe-only.
 *
 *   - analysis_sessions.addressal_rate / findings_total / findings_addressed /
 *     addressal_escalation_flag / addressal_report_json get the session roll-up.
 *   - Each agent_runs row for the session gets its per-agent counts.
 *
 * Silent no-op when the phase6 migration hasn't been applied (the ALTER
 * columns raise `no such column`, swallowed).
 */

import { db } from '../db.js';
import type { AddressalReport } from './types.js';

let columnsMissingWarned = false;

function warnOnce(msg: string): void {
  if (!columnsMissingWarned) {
    console.warn(msg);
    columnsMissingWarned = true;
  }
}

export function persistAddressalReport(report: AddressalReport): void {
  try {
    db.prepare(
      `UPDATE analysis_sessions
          SET addressal_rate = ?,
              findings_total = ?,
              findings_addressed = ?,
              addressal_escalation_flag = ?,
              addressal_report_json = ?
        WHERE id = ?`,
    ).run(
      report.addressal_rate,
      report.finding_count,
      report.addressed_count,
      report.escalation_flag ? 1 : 0,
      JSON.stringify(report).slice(0, 16_000),
      report.session_id,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('no such column') || msg.includes('no such table')) {
      warnOnce(
        '[checklist] analysis_sessions.addressal_* columns missing — apply ' +
        'backend/src/migrations/phase6_checklist_observation.sql to enable ' +
        'observe-only addressal logging. Continuing without logging.',
      );
      return;
    }
    console.warn(`[checklist] non-fatal session persist failure: ${msg}`);
  }

  // Per-agent counts.
  for (const bd of report.by_agent) {
    try {
      db.prepare(
        `UPDATE agent_runs
            SET addressal_rate = ?,
                finding_action_fixed_count = ?,
                finding_action_acknowledged_count = ?,
                finding_action_rejected_count = ?
          WHERE session_id = ? AND agent_id = ?`,
      ).run(
        bd.findings_raised === 0
          ? null
          : Number((bd.findings_addressed / Math.max(1, bd.findings_raised)).toFixed(4)),
        bd.action_counts.fixed,
        bd.action_counts.acknowledged,
        bd.action_counts.rejected,
        report.session_id,
        bd.agent_id,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('no such column') || msg.includes('no such table')) {
        // Already warned above; skip silently.
        return;
      }
      console.warn(`[checklist] non-fatal agent_runs persist failure: ${msg}`);
    }
  }
}
