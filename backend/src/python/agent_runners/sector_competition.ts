import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import {
  adaptSectorCompetitionForLegacy,
  extractFinancialAnalysis,
  extractPeers,
} from '../adapters/sector_competition.js';
import {
  loadPeerFixtures,
  peerFixturesToContextValue,
} from '../../peers/peer-fixture-loader.js';
import { getSector } from '../../sector-registry.js';

export type RunOutcome = 'ok' | 'failed';

export async function runPythonSectorCompetition(
  sessionId: string,
  runId: string,
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): Promise<RunOutcome> {
  const startedAt = new Date().toISOString();
  const startedAtMs = Date.now();
  db.prepare(
    `UPDATE agent_runs SET status = 'running', started_at = ?, error_message = NULL, provider_used = 'python' WHERE id = ?`,
  ).run(startedAt, runId);

  const faRaw = accumulatedContext['financial_analysis_output'];
  const fa = extractFinancialAnalysis(faRaw);

  // Pre-Core-4 Phase B (2026-04-28) — fixture-backed peer loader.
  // If accumulatedContext['sector_competition_peers'] is unset (the
  // common production case — no live peer chain runs), fall back to
  // committed peer fixtures under config/peer_fixtures/<sector>/*.json.
  // This eliminates the "peer_count=0 → self-median" deception that
  // KCHOL 2026-04-28 surfaced.
  if (!accumulatedContext['sector_competition_peers']) {
    const sector = getSector(ticker) ?? 'industrial';
    const loaded = loadPeerFixtures(sector);
    if (loaded.fixtures.length > 0) {
      accumulatedContext['sector_competition_peers'] = peerFixturesToContextValue(loaded);
      accumulatedContext['__peer_fixture_meta'] = JSON.stringify({
        sector,
        loaded_count: loaded.loaded_count,
        verified_count: loaded.verified_count,
        warnings: loaded.warnings,
      });
      console.log(
        `[PYTHON:sector_competition] peer-fixtures loaded sector=${sector} ` +
        `loaded=${loaded.loaded_count} verified=${loaded.verified_count}`,
      );
    } else if (loaded.warnings.length > 0) {
      console.log(
        `[PYTHON:sector_competition] peer-fixtures unavailable sector=${sector} — ` +
        `${loaded.warnings.join('; ')}`,
      );
    }
  }
  const peers = extractPeers(accumulatedContext['sector_competition_peers']);

  const llmMarkdownSource = typeof faRaw === 'string' ? faRaw : null;
  const legacy = adaptSectorCompetitionForLegacy(
    fa, peers, ticker, `sc-out-${nanoid()}`, { llmMarkdownSource },
  );
  const outputJson = JSON.stringify(legacy, null, 2);

  // Soft-fail: empty-upstream is a legitimate degraded-mode output —
  // the adapter already emitted valid JSON with a warning. Marking it
  // 'completed' lets downstream agents + governance see that we
  // reported cleanly rather than treating a data gap as a hard failure.
  const completedAt = new Date().toISOString();
  db.prepare(
    `UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
     output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = NULL,
     provider_used = 'python' WHERE id = ?`,
  ).run(
    completedAt,
    Date.now() - startedAtMs,
    outputJson,
    `python:sector_competition (fa=${fa ? 'ok' : 'null'}, peers=${peers.length}, benchmarks=${legacy.benchmarks.length})`,
    runId,
  );

  accumulatedContext['sector_competition_output'] = outputJson;
  console.log(
    `[PYTHON:sector_competition] ok — fa=${fa ? 'ok' : 'null'}, peers=${peers.length}, strengths=${legacy.strengths.length}, weaknesses=${legacy.weaknesses.length}, warnings=${legacy.warnings.length}`,
  );
  return 'ok';
}
