/**
 * Python-hybrid report_formatter runner.
 *
 * Loads the HTML skeleton template, binds it against a deterministic
 * context map (composeReportContext), and writes the rendered output
 * to agent_runs.output_text. Narrative LLM blocks are left as empty
 * strings in this MVP — the template gracefully hides the
 * surrounding {{#if}} blocks so a narrative-free report still reads
 * cleanly.
 *
 * A later wave will add a minimal-prompt LLM call right before
 * render to fill the 4 narrative placeholders (card_summary,
 * financial_intro, valuation, closing), keeping the 100KB LLM
 * prompt footprint down to ~5KB.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nanoid } from 'nanoid';

import { db } from '../../db.js';
import { renderTemplate } from './template_engine.js';
import { composeReportContext } from './compose.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, 'template.html');
// Load the template once at module-load time. It's ~9KB, negligible.
const TEMPLATE = readFileSync(TEMPLATE_PATH, 'utf-8');


export type RunOutcome = 'ok' | 'failed';


export async function runPythonReportFormatter(
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

  try {
    const reportId = `rpt-${nanoid()}`;
    const ctx = composeReportContext({
      ticker,
      reportId,
      accumulatedContext,
      // Auto-extract narrative blocks from LLM outputs via llm_narrative.ts
      // (passing undefined lets composeReportContext use buildNarrativeBlocks)
    });

    const html = renderTemplate(TEMPLATE, ctx);

    // Formatter output is historically a JSON envelope {formatted_html: "..."}.
    // Preserve that contract so downstream (PDF gen, COO delivery check) still works.
    const envelope = JSON.stringify({ formatted_html: html, report_id: reportId, source: 'python' });

    const completedAt = new Date().toISOString();
    db.prepare(
      `UPDATE agent_runs SET status = 'completed', completed_at = ?, duration_ms = ?,
       output_text = ?, tokens_used = 0, cost_usd = 0, input_prompt = ?, error_message = NULL,
       provider_used = 'python' WHERE id = ?`,
    ).run(
      completedAt,
      Date.now() - startedAtMs,
      envelope,
      `python:report_formatter template render (${html.length} bytes)`,
      runId,
    );

    accumulatedContext['report_formatter_output'] = envelope;
    accumulatedContext['report_formatter_html']   = html;
    console.log(`[PYTHON:report_formatter] rendered ${html.length} bytes — id=${reportId}`);
    return 'ok';

  } catch (err) {
    const completedAt = new Date().toISOString();
    const msg = `report_formatter template render failed: ${(err as Error).message}`;
    db.prepare(
      `UPDATE agent_runs SET status = 'failed', completed_at = ?, duration_ms = ?,
       output_text = NULL, error_message = ?, provider_used = 'python' WHERE id = ?`,
    ).run(completedAt, Date.now() - startedAtMs, msg, runId);
    console.error(`[PYTHON:report_formatter] ${msg}`);
    return 'failed';
  }
}
