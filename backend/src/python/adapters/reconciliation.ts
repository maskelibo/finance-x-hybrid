/**
 * reconciliation adapter — Python ReconciliationReport → legacy
 * agent JSON (check_results, pass_rate, quality_score).
 */

export interface PythonReconciliationCheck {
  code: string;
  name: string;
  passed: boolean;
  message: string;
  actual?: string | null;
  expected?: string | null;
  absolute_error?: string | null;
  relative_error_pct?: string | null;
  tolerance_pct?: string | null;
}

export interface PythonReconciliationReport {
  ticker?: string;
  period_label?: string;
  checks?: PythonReconciliationCheck[];
}

export interface LegacyReconciliationOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  period_label: string | null;
  check_results: PythonReconciliationCheck[];
  pass_rate: number;
  check_count: number;
  passed_count: number;
  failed_count: number;
  skipped_count: number;
  overall_decision: 'pass' | 'partial' | 'fail';
  warnings: string[];
  review_status: string;
}


export function adaptPythonReconciliationForLegacy(
  py: PythonReconciliationReport,
  ticker: string,
  outputId: string,
): LegacyReconciliationOutput {
  const checks = py.checks ?? [];
  const passed = checks.filter(c => c.passed).length;
  const skipped = checks.filter(c => c.passed && c.message.startsWith('skipped')).length;
  const realPassed = passed - skipped;
  const failed = checks.length - passed;
  const passRate = checks.length === 0 ? 0 : passed / checks.length;

  let decision: LegacyReconciliationOutput['overall_decision'];
  if (failed === 0) decision = 'pass';
  else if (failed <= 2) decision = 'partial';
  else decision = 'fail';

  const warnings: string[] = [];
  const criticalFailed = checks.filter(
    c => !c.passed && (c.code === 'BS_IDENTITY' || c.code === 'IS_NET_SPLIT'),
  );
  if (criticalFailed.length) {
    warnings.push(
      `Critical check(s) failed: ${criticalFailed.map(c => c.code).join(', ')} — review math`,
    );
  }

  return {
    agent_id: 'reconciliation',
    output_id: outputId,
    ticker: ticker.toUpperCase(),
    period_label: py.period_label ?? null,
    check_results: checks,
    pass_rate: Number(passRate.toFixed(4)),
    check_count: checks.length,
    passed_count: realPassed,
    failed_count: failed,
    skipped_count: skipped,
    overall_decision: decision,
    warnings,
    review_status: 'pending_ceo_review',
  };
}
