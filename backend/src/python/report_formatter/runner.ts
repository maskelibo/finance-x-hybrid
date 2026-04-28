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
import { loadAnnualReportExtracts } from '../../data/annual-report-text-loader.js';
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
  type SanitizeOptions,
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
    // Phase G — Annual Report (Faaliyet Raporu) text extraction. Pulls
    // canonical Turkish narrative sections from the most recent activity
    // report PDF in data_collection_output and injects them as
    // accumulatedContext['annual_report_extracts_output'] so compose.ts
    // can render quoted sections (chairman_letter, ceo_message, risks,
    // outlook, sustainability, segments). Best-effort and isolated;
    // PDF parse failures fall through to no-section rendering.
    if (accumulatedContext['annual_report_extracts_output'] == null) {
      try {
        const dcRaw = accumulatedContext['data_collection_output'];
        const dc = dcRaw
          ? (typeof dcRaw === 'string' ? JSON.parse(dcRaw) : dcRaw) as Record<string, unknown>
          : null;
        const manifest = (dc?.['data_manifest'] ?? null) as Record<string, unknown> | null;
        const activity = Array.isArray(manifest?.['activity_reports'])
          ? manifest!['activity_reports'] as Array<Record<string, unknown>>
          : [];
        // Pick most recent activity report by year desc, then published_at desc
        activity.sort((a, b) => {
          const ya = Number(a.year ?? 0);
          const yb = Number(b.year ?? 0);
          if (yb !== ya) return yb - ya;
          return String(b.published_at ?? '').localeCompare(String(a.published_at ?? ''));
        });
        const top = activity[0];
        const localPath = top ? String(top['local_path'] ?? '') : '';
        if (localPath) {
          const extracts = await loadAnnualReportExtracts(ticker, localPath);
          if (extracts) {
            accumulatedContext['annual_report_extracts_output'] = JSON.stringify(extracts);
            console.log(
              `[PYTHON:report_formatter] annual_report extracts: ${extracts.page_count} pages from ${path.basename(localPath)}`,
            );
          }
        }
      } catch (e) {
        console.warn(`[PYTHON:report_formatter] annual_report extraction failed: ${(e as Error).message}`);
      }
    }

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

    // P4.beta.1 + P4.beta.2 — post-render hygiene + section completeness +
    // metric clarification (text-only). All read-only consumes from
    // accumulatedContext; structured fields drive deterministic kapsam notu
    // and canonical disclaimer injection. HTML structure preserved.
    const sanitizeOptions = buildSanitizeOptions(ticker, accumulatedContext);
    const { html, report: hygieneReport } = sanitizeBoardroomReport(renderedHtml, sanitizeOptions);
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


// =============================================================================
// P4.beta.2 — read-only accumulatedContext extraction for sanitizer
// =============================================================================
//
// Pulls structured fields needed by section_filler + metric_clarifier.
// All extractions are best-effort: missing fields collapse to null/undefined,
// causing the sanitizer to skip the corresponding template clause without
// fabricating values.

/**
 * P4.beta.3 — exported for runner extraction verification test.
 * Pure function: pulls structured fields from accumulatedContext into
 * SanitizeOptions. Read-only; never mutates ctx.
 */
export function buildSanitizeOptions(
  ticker: string,
  ctx: Record<string, unknown>,
): SanitizeOptions {
  const truth = readTruthIfAny(ctx);
  const fa = parseLooseJson(ctx['financial_analysis_output']);
  const macro = parseLooseJson(ctx['macro_analysis_output']);
  const tech = parseLooseJson(ctx['technical_analysis_output']);
  const valuation = parseLooseJson(ctx['valuation_agent_output']);
  // P4.beta.4 Wave 2 — context_extraction_output may contain an LLM preamble
  // before the JSON envelope (observed: "I have all the data needed. ..."),
  // so use the brace-bounded slice parser.
  const contextEx = parseLooseJson(ctx['context_extraction_output']);
  const companyProfile = contextEx && typeof contextEx['company_profile'] === 'object'
    ? contextEx['company_profile'] as Record<string, unknown>
    : null;

  return {
    ticker,
    period_label: pickString(truth?.classification, ['period_label'])
      ?? pickString(fa, ['period_label']),
    sector_canonical: pickString(truth?.classification, ['sector_canonical']),
    is_holding: truth?.classification?.is_holding,
    is_banking: truth?.classification?.is_banking,
    primary_method: pickString(truth?.valuation_methodology, ['primary_method']),
    recommendation: pickString(valuation, ['recommendation', 'rating', 'investment_recommendation']),
    current_price_try: pickNumber(ctx as Record<string, unknown>, ['current_price', 'current_price_try']),
    current_price_as_of: pickString(ctx as Record<string, unknown>, ['current_price_as_of', 'price_snapshot_as_of']),
    fa_canonical: fa && typeof fa['canonical_numbers'] === 'object'
      ? fa['canonical_numbers'] as { net_debt?: number; net_debt_to_ebitda?: number; current_ratio?: number }
      : null,
    fa_critical_flag_count: pickNumber(fa, ['critical_flag_count']),
    fa_prior_period_loaded: Boolean(ctx['fa_prior_period_loaded']),
    // P4.beta.3 — pass full red_flags array to critical_finding_resolver for
    // active rewrite. Sanitizer guards null/missing/empty cases internally.
    fa_red_flags: fa && Array.isArray(fa['red_flags']) ? fa['red_flags'] : null,
    macro: macro ? {
      tcmb_policy_rate: pickNumber(macro['rates'], ['tcmb_policy_rate'])
        ?? pickNumber(macro, ['tcmb_policy_rate']),
      cpi_yoy: pickNumber(macro['inflation'], ['cpi_yoy'])
        ?? pickNumber(macro, ['cpi_yoy']),
      usd_try: pickNumber(macro['rates'], ['usd_try'])
        ?? pickNumber(macro, ['usd_try']),
      eur_try: pickNumber(macro['rates'], ['eur_try'])
        ?? pickNumber(macro, ['eur_try']),
      as_of: pickString(macro, ['as_of', 'fetched_at']),
    } : null,
    technical: tech ? {
      trend: pickString(tech, ['trend']),
      rsi: pickNumber(tech, ['rsi', 'rsi_14']),
      volume_data_available: typeof tech['volume_data_available'] === 'boolean'
        ? tech['volume_data_available']
        : undefined,
      as_of: pickString(tech, ['as_of', 'snapshot_at']),
    } : null,
    // P4.beta.4 Wave 2 — ownership extraction (read-only)
    shareholder_structure: companyProfile && Array.isArray(companyProfile['shareholder_structure'])
      ? (companyProfile['shareholder_structure'] as Array<Record<string, unknown>>).map((e) => ({
          shareholder: pickString(e, ['shareholder', 'name']),
          stake_pct: pickNumber(e, ['stake_pct', 'pct', 'percentage']),
          source: pickString(e, ['source', 'citation']),
        }))
      : null,
    controlling_shareholder: companyProfile && typeof companyProfile['controlling_shareholder'] === 'object' && companyProfile['controlling_shareholder']
      ? (() => {
          const cs = companyProfile['controlling_shareholder'] as Record<string, unknown>;
          return {
            name: pickString(cs, ['name', 'shareholder']),
            pct: pickNumber(cs, ['pct', 'stake_pct', 'percentage']),
            source: pickString(cs, ['source', 'citation']),
          };
        })()
      : null,
    free_float_pct: pickNumber(companyProfile, ['free_float_pct', 'free_float']),
    foreign_investor_ratio_pct: pickNumber(companyProfile, ['foreign_investor_ratio_pct', 'foreign_ratio_pct']),
  };
}

function parseLooseJson(raw: unknown): Record<string, any> | null {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw as Record<string, any>;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed); } catch { /* fall through to brace-bounded parse */ }
  // P4.beta.4 Wave 2 — some agent outputs (e.g. context_extraction) carry an
  // LLM preamble or trailing prose around the JSON envelope. Recover by
  // taking the longest brace-bounded slice and re-parsing.
  const a = trimmed.indexOf('{');
  const b = trimmed.lastIndexOf('}');
  if (a >= 0 && b > a) {
    try { return JSON.parse(trimmed.slice(a, b + 1)); } catch { return null; }
  }
  return null;
}

function pickString(o: unknown, keys: string[]): string | null {
  if (!o || typeof o !== 'object') return null;
  const r = o as Record<string, unknown>;
  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return null;
}

function pickNumber(o: unknown, keys: string[]): number | null {
  if (o == null || typeof o !== 'object') return null;
  const r = o as Record<string, unknown>;
  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string') {
      const n = Number(v.replace(/[, ]/g, ''));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function readTruthIfAny(ctx: Record<string, unknown>): {
  classification?: { sector_canonical?: string; is_holding?: boolean; is_banking?: boolean; period_label?: string };
  valuation_methodology?: { primary_method?: string };
} | null {
  const v = ctx['truth_assertions'];
  if (!v || typeof v !== 'object') return null;
  return v as ReturnType<typeof readTruthIfAny>;
}
