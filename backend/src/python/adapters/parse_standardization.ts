/**
 * parse_standardization adapter — Python PeriodFinancials (one per PDF)
 * → legacy standardized_statements schema.
 *
 * Pulls PDF paths from the upstream data_collection output (works for
 * both the Python-migrated and legacy-LLM shapes).
 */

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


export function adaptParsedPeriodsForLegacy(
  periods: Array<{ pdf: string; parsed: PythonPeriodFinancials }>,
  ticker: string,
  outputId: string,
): LegacyParseStandardizationOutput {
  const statements: LegacyStandardizedStatement[] = periods.map(({ pdf, parsed }) => ({
    period_label: `${parsed.period}-${parsed.year}`,
    year: parsed.year,
    currency: parsed.currency ?? 'TRY',
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
