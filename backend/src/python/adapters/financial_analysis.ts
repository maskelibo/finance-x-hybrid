/**
 * financial_analysis adapter — Python FinancialAnalysisOutput → legacy
 * agent JSON shape that downstream strategic_synthesis, valuation, and
 * qa_review agents understand.
 */

export interface PythonMetricHighlight {
  code: string;
  label: string;
  value?: string | null;
  unit?: string;
  narrative_hint?: string | null;
}

export interface PythonRedFlag {
  code: string;
  severity: string;
  message: string;
}

export interface PythonFinancialAnalysisOutput {
  ticker?: string;
  period_label?: string;
  sector?: string;
  highlights?: PythonMetricHighlight[];
  red_flags?: PythonRedFlag[];
  canonical_numbers?: Record<string, string | null>;
  trends?: unknown[];
  engine?: unknown;
}

export interface LegacyFinancialAnalysisOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  period_label: string;
  sector: string;
  metrics: PythonMetricHighlight[];
  red_flags: PythonRedFlag[];
  canonical_numbers: Record<string, string | null>;
  metric_count: number;
  critical_flag_count: number;
  engine_snapshot: unknown;
  confidence: string;
  warnings: string[];
  review_status: string;
}


export function adaptPythonFinancialAnalysisForLegacy(
  py: PythonFinancialAnalysisOutput,
  ticker: string,
  outputId: string,
): LegacyFinancialAnalysisOutput {
  const highlights = py.highlights ?? [];
  const flags = py.red_flags ?? [];
  const critical = flags.filter(f => f.severity === 'critical').length;

  const confidence = critical > 0 ? 'low' : flags.length > 2 ? 'medium' : 'high';

  const warnings: string[] = [];
  if (highlights.length < 5) {
    warnings.push(`Only ${highlights.length} metrics landed — financial_analysis usually produces 6–12.`);
  }

  return {
    agent_id: 'financial_analysis',
    output_id: outputId,
    ticker: ticker.toUpperCase(),
    period_label: py.period_label ?? 'unknown',
    sector: py.sector ?? 'industrial',
    metrics: highlights,
    red_flags: flags,
    canonical_numbers: py.canonical_numbers ?? {},
    metric_count: highlights.length,
    critical_flag_count: critical,
    engine_snapshot: py.engine ?? null,
    confidence,
    warnings,
    review_status: 'pending_ceo_review',
  };
}
