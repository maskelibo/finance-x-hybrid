/**
 * Manifest recorder — Phase 5A observe-only.
 *
 * Persists the compact manifest produced by extract.ts onto the current
 * agent_runs row. Strictly no-op if the phase5_manifest_observation
 * migration has not been applied (column-missing errors are swallowed so
 * the orchestrator never breaks).
 *
 * Phase 5A contract:
 *   - Called once per agent completion.
 *   - Never throws, never routes, never mutates accumulatedContext.
 *   - Writes 5 fields on agent_runs: raw/compressed sizes, section count,
 *     truncation_risk flag, full JSON blob (already size-capped at 16 KB).
 *
 * Phase 5B (dual-write) will add a disk-side artifact write next to the
 * DB row, keyed on (session_id, agent_id, output_id). Phase 5C (dual-read)
 * modifies downstream prompt assembly to fetch by manifest-id instead of
 * raw slice.
 */

import { db } from '../db.js';
import type { AgentOutputManifest } from './types.js';

let manifestColumnsMissingWarned = false;

export function recordManifest(args: {
  sessionId: string;
  agentId: string;
  manifest: AgentOutputManifest;
}): void {
  const { sessionId, agentId, manifest } = args;
  try {
    db.prepare(
      `UPDATE agent_runs
          SET manifest_raw_size_bytes = ?,
              manifest_compressed_size_bytes = ?,
              manifest_section_count = ?,
              manifest_truncation_risk = ?,
              manifest_json = ?
        WHERE session_id = ? AND agent_id = ?`,
    ).run(
      manifest.raw_output_bytes,
      manifest.manifest_bytes,
      manifest.sections.length,
      manifest.truncation_risk ? 1 : 0,
      JSON.stringify(manifest).slice(0, 16_000),
      sessionId,
      agentId,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('no such column') || msg.includes('no such table')) {
      if (!manifestColumnsMissingWarned) {
        console.warn(
          '[manifest-recorder] agent_runs.manifest_* columns missing — ' +
          'apply backend/src/migrations/phase5_manifest_observation.sql to ' +
          'enable observe-only manifest capture. Continuing without logging.',
        );
        manifestColumnsMissingWarned = true;
      }
      return;
    }
    console.warn(`[manifest-recorder] non-fatal persist failure: ${msg}`);
  }
}
