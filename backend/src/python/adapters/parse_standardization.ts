/**
 * parse_standardization adapter — Python PeriodFinancials (one per PDF)
 * → legacy standardized_statements schema.
 *
 * Pulls PDF paths from the upstream data_collection output (works for
 * both the Python-migrated and legacy-LLM shapes).
 */

import { getSector } from '../../sector-registry.js';

export interface PythonPeriodFinancials {
  period: string;
  year: number;
  currency?: string;
  sector?: string;
  balance_sheet?: Record<string, string | null>;
  income_statement?: Record<string, string | null>;
  cash_flow?: Record<string, string | null> | null;
  equity_change?: Record<string, string | null> | null;
  sources?: unknown[];
}

export interface LegacyStandardizedStatement {
  period_label: string;
  year: number;
  currency: string;
  // Cosmetic 3 — Python detect_sector defaults to INDUSTRIAL when PDF first
  // page lacks a recognised hint. We override at adapter layer using the
  // ticker→sector registry so downstream agents see retail/banking/etc.
  sector: string;
  balance_sheet: Record<string, string | null>;
  income_statement: Record<string, string | null>;
  cash_flow: Record<string, string | null>;
  equity_change: Record<string, string | null>;
  source_pdf: string;
}

export interface LegacyParseStandardizationOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  standardized_statements: LegacyStandardizedStatement[];
  period_count: number;
  auto_checks: {
    has_balance_sheet: boolean;
    has_income_statement: boolean;
    has_cash_flow: boolean;
    five_year_coverage: boolean;
  };
  warnings: string[];
  errors: string[];
  review_status: string;
}


/**
 * Best-effort extraction of PDF paths from an upstream data_collection
 * output — works for either the Python-migrated shape (data_manifest.
 * financial_reports[].local_path) or the older LLM JSON.
 */
export function extractPdfPathsFromManifest(upstream: unknown): string[] {
  let parsed: unknown = upstream;
  if (typeof upstream === 'string') {
    try {
      parsed = JSON.parse(upstream);
    } catch {
      return [];
    }
  }
  if (!parsed || typeof parsed !== 'object') return [];

  const paths = new Set<string>();
  const visit = (node: unknown): void => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node === 'object') {
      const rec = node as Record<string, unknown>;
      // Recognise any 'local_path' / 'pdf_path' / 'path' field that looks like a PDF.
      for (const key of ['local_path', 'pdf_path', 'path']) {
        const v = rec[key];
        if (typeof v === 'string' && v.toLowerCase().endsWith('.pdf')) {
          paths.add(v);
        }
      }
      for (const value of Object.values(rec)) visit(value);
    }
  };
  visit(parsed);
  return Array.from(paths);
}


/**
 * Phase I (2026-04-29) — kind-aware PDF path extractor.
 *
 * The legacy `extractPdfPathsFromManifest` walks the manifest blindly
 * and returns every .pdf path it sees; downstream code then filters by
 * path-substring (`p.includes('financial_report')`) which fails for
 * disk-seeded historical PDFs at `data/historical_pdfs/<TICKER>/<year>.pdf`
 * (their paths don't contain the kind name).
 *
 * This helper reads the structured manifest fields directly:
 *   - data_manifest.financial_reports[].local_path
 *   - data_manifest.activity_reports[].local_path
 *   - data_manifest.other[].local_path
 * and returns only the paths whose entries match the requested kind.
 */
export function extractPdfPathsByKind(
  upstream: unknown,
  kind: 'financial_report' | 'activity_report' | 'other',
): string[] {
  let parsed: unknown = upstream;
  if (typeof upstream === 'string') {
    try {
      parsed = JSON.parse(upstream);
    } catch {
      return [];
    }
  }
  if (!parsed || typeof parsed !== 'object') return [];
  const manifest = (parsed as Record<string, unknown>)['data_manifest'] as
    Record<string, unknown> | undefined;
  if (!manifest || typeof manifest !== 'object') return [];

  // Map kind → array key in data_manifest
  const arrayKey = kind === 'financial_report'
    ? 'financial_reports'
    : kind === 'activity_report'
      ? 'activity_reports'
      : 'other';
  const arr = manifest[arrayKey];
  if (!Array.isArray(arr)) return [];

  const paths: string[] = [];
  for (const entry of arr) {
    if (!entry || typeof entry !== 'object') continue;
    const rec = entry as Record<string, unknown>;
    // Trust the entry's `kind` field if present; the array key already
    // implies kind, but a defensive check keeps stale manifests honest.
    if (rec.kind != null && rec.kind !== kind) continue;
    const lp = rec['local_path'];
    if (typeof lp === 'string' && lp.toLowerCase().endsWith('.pdf')) {
      paths.push(lp);
    }
  }
  return paths;
}


export function adaptParsedPeriodsForLegacy(
  periods: Array<{ pdf: string; parsed: PythonPeriodFinancials }>,
  ticker: string,
  outputId: string,
): LegacyParseStandardizationOutput {
  // Cosmetic 3 — registry override: BIMAS/MGROS/SOKM → retail, GARAN/AKBNK → banking, etc.
  const registrySector = getSector(ticker.toUpperCase());
  const statements: LegacyStandardizedStatement[] = periods.map(({ pdf, parsed }) => ({
    period_label: `${parsed.period}-${parsed.year}`,
    year: parsed.year,
    currency: parsed.currency ?? 'TRY',
    sector: registrySector ?? parsed.sector ?? 'industrial',
    balance_sheet: parsed.balance_sheet ?? {},
    income_statement: parsed.income_statement ?? {},
    cash_flow: parsed.cash_flow ?? {},
    equity_change: parsed.equity_change ?? {},
    source_pdf: pdf,
  }));

  const years = new Set(statements.map(s => s.year));
  const hasBs = statements.some(s => Object.keys(s.balance_sheet).length > 0);
  const hasIs = statements.some(s => Object.keys(s.income_statement).length > 0);
  const hasCf = statements.some(s => Object.keys(s.cash_flow).length > 0);
  const fiveYr = years.size >= 5;

  const warnings: string[] = [];
  if (!hasCf) warnings.push('No cash-flow statements extracted from any PDF.');
  if (!fiveYr) warnings.push(`Only ${years.size} distinct reporting years — expected ≥5.`);

  return {
    agent_id: 'parse_standardization',
    output_id: outputId,
    ticker: ticker.toUpperCase(),
    standardized_statements: statements,
    period_count: statements.length,
    auto_checks: {
      has_balance_sheet: hasBs,
      has_income_statement: hasIs,
      has_cash_flow: hasCf,
      five_year_coverage: fiveYr,
    },
    warnings,
    errors: [],
    review_status: 'pending_ceo_review',
  };
}
