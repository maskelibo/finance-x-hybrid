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
import { applyTheme, getTheme, mergeBrandOverride, type BrandOverride, type ThemeName } from './themes.js';
// P4.alpha — boardroom intelligence sections (additive; reads P3 truth-layer outputs)
import { buildBoardroomIntelligenceContext } from './boardroom_intelligence.js';
// P4.beta.1 — post-render hygiene sanitizer (banned phrase + translation + scan-only)
import {
  sanitizeBoardroomReport,
  logHygieneSummary,
  HYGIENE_CONTEXT_KEYS,
} from './hygiene_sanitizer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, 'template.html');
// Load the template once at module-load time. It's ~57KB, negligible.
const TEMPLATE = readFileSync(TEMPLATE_PATH, 'utf-8');


/** Read theme name from session metadata or accumulatedContext.
 *  Falls back to DEFAULT_THEME. Recognized sources:
 *    - accumulatedContext.theme         (set by API handler from session.theme)
 *    - session row has a theme column   (optional future extension)
 */
function resolveTheme(accumulatedContext: Record<string, unknown>): ThemeName {
  const raw = accumulatedContext['theme'];
  if (typeof raw === 'string' && raw.length > 0) return raw as ThemeName;
  return 'institutional';
}


/** Pull brand color override from context_extraction output, if present. */
function resolveBrandOverride(accumulatedContext: Record<string, unknown>): BrandOverride | undefined {
  const raw = accumulatedContext['context_extraction_output'];
  if (!raw) return undefined;
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : raw as Record<string, unknown>;
  } catch {
    return undefined;
  }
  if (!parsed) return undefined;
  const brand = parsed['brand_identity'] as Record<string, unknown> | undefined;
  if (!brand) return undefined;
  const override: BrandOverride = {};
  if (typeof brand.primary_color === 'string') override.primary = brand.primary_color;
  if (typeof brand.secondary_color === 'string') override.primaryDark = brand.secondary_color;
  if (typeof brand.accent_color === 'string') override.accent = brand.accent_color;
  return Object.keys(override).length > 0 ? override : undefined;
}


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
    const baseCtx = composeReportContext({
      ticker,
      reportId,
      accumulatedContext,
      // Auto-extract narrative blocks from LLM outputs via llm_narrative.ts
      // (passing undefined lets composeReportContext use buildNarrativeBlocks)
    });

    // P4.alpha — boardroom intelligence sections from P3 truth-layer outputs.
    // Empty data → empty strings + has_X=false → template conditionally omits.
    // accumulatedContext is read-only here.
    const boardroomCtx = buildBoardroomIntelligenceContext(accumulatedContext);
    const ctx = { ...baseCtx, ...boardroomCtx };

    // Resolve theme: API/session-level override → company brand override → render.
    const themeName = resolveTheme(accumulatedContext);
    const brandOverride = resolveBrandOverride(accumulatedContext);
    const theme = mergeBrandOverride(getTheme(themeName), brandOverride);
    const themedTemplate = applyTheme(TEMPLATE, theme);

    const renderedHtml = renderTemplate(themedTemplate, ctx);

    // P4.beta.1 — post-render hygiene pass (text-only). Removes/translates
    // internal phrases, scans (no auto-fix) metric conflicts + weak sections,
    // computes delivery_status. HTML structure is preserved.
    const { html, report: hygieneReport } = sanitizeBoardroomReport(renderedHtml, { ticker });
    accumulatedContext[HYGIENE_CONTEXT_KEYS.REPORT] = hygieneReport;
    accumulatedContext[HYGIENE_CONTEXT_KEYS.REPORT_JSON] = JSON.stringify(hygieneReport);
    logHygieneSummary(hygieneReport);

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
