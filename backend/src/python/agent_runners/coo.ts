import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import {
  adaptCooForLegacy,
  runDeliveryCheck,
  runPreflight,
  type Sector,
} from '../adapters/coo.js';

export type RunOutcome = 'ok' | 'failed';

// Minimal ticker→sector heuristic. COO preflight runs BEFORE
// context_extraction, so we can't rely on the LLM sector detector.
// Unknown tickers fall back to 'industrial' (safest default — the
// sector-gated banking/holding rules simply don't fire).
const KNOWN_BANKING = new Set(['AKBNK', 'ISCTR', 'GARAN', 'YKBNK', 'HALKB', 'VAKBN', 'TSKB', 'ALBRK', 'KLNMA']);
const KNOWN_HOLDING = new Set(['KCHOL', 'SAHOL', 'DOHOL', 'TKFEN', 'SISE', 'EGYO', 'GSDHO', 'GOZDE']);
const KNOWN_REIT = new Set(['EKGYO', 'HLGYO', 'ISGYO', 'TRGYO']);
const KNOWN_INSURANCE = new Set(['AKGRT', 'ANSGR', 'RAYSG', 'AVIVA']);

function guessSector(ticker: string): Sector {
  const t = ticker.toUpperCase();
  if (KNOWN_BANKING.has(t)) return 'banking';
  if (KNOWN_HOLDING.has(t)) return 'holding';
  if (KNOWN_REIT.has(t)) return 'reit';
  if (KNOWN_INSURANCE.has(t)) return 'insurance';
  return 'industrial';
}


export async function runPythonCoo(
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

  const isDelivery = Boolean(accumulatedContext['delivery_check_mode']);
  const outputId = `coo-out-${nanoid()}`;

  let legacy;
  let summary: string;

  if (isDelivery) {
    const html = String(accumulatedContext['report_formatter_html'] || '');
    if (html.length === 0) {
      const completedAt = new Date().toISOString();
      db.prepare(
        `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
         output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
      ).run(completedAt, Date.now() - startedAtMs, 'coo delivery: no report_formatter_html in context', runId);
      console.warn('[PYTHON:coo] delivery mode but no HTML in context');
      return 'failed';
    }
    const report = runDeliveryCheck(ticker, html);
    legacy = adaptCooForLegacy(report, 'delivery', outputId);
    summary = `python:coo delivery (${report.decision}, ${report.items.length} checks, ${html.length}B)`;
  } else {
    const sector = guessSector(ticker);
    const report = runPreflight(ticker, sector);
    legacy = adaptCooForLegacy(report, 'preflight', outputId);
    summary = `python:coo preflight (${sector}, ${report.decision}, ${report.items.length} rules)`;
  }

  const outputJson = JSON.stringify(legacy, null, 2);
  const completedAt = new Date().toISOString();
  db.prepare(
    `UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
     output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = NULL,
     provider_used = 'python' WHERE id = ?`,
  ).run(
    completedAt,
    Date.now() - startedAtMs,
    outputJson,
    summary,
    runId,
  );

  accumulatedContext['coo_output'] = outputJson;
  console.log(
    `[PYTHON:coo] ${isDelivery ? 'delivery' : 'preflight'} — decision=${legacy.decision} (${legacy.checks.length} checks)`,
  );
  return 'ok';
}
