/**
 * P5A — Golden Eval CLI runner (read-only).
 *
 * Usage:
 *   cd backend
 *   npx tsx scripts/golden-eval.ts <session_id> <ticker> [<golden_report_path>]
 *
 * Behaviour:
 *   - Read-only DB access. Loads CanonicalFactPackV2 + the most recent
 *     `reports.content` for the session. No writes.
 *   - Runs three scorers (numeric / coverage / narrative) and prints a
 *     scorecard to stdout. JSON-formatted for easy piping.
 *   - When the golden_report.json carries `synthetic_fixture: true`, the CLI
 *     emits a clear stderr warning so operators are not misled.
 *   - No LLM calls, no paid runs.
 *
 * Exit codes:
 *   0  — scoring completed (regardless of score values; this is observation,
 *        not enforcement)
 *   2  — argument error (missing session_id / ticker / file)
 *   3  — golden report failed schema validation
 *   4  — DB read failure
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import { db } from '../src/db.js';
import { getCanonicalFactPackV2 } from '../src/fact-layer/pack-v2.js';
import {
  scoreNumericAccuracy,
  type ExpectedFacts,
} from '../src/quality-data/golden_v2/scoring/numeric_accuracy.js';
import {
  scoreCoverage,
  type ExpectedNarrative,
} from '../src/quality-data/golden_v2/scoring/coverage_score.js';
import { scoreNarrativeQuality } from '../src/quality-data/golden_v2/scoring/narrative_quality.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface GoldenReport {
  ticker: string;
  period: string;
  synthetic_fixture?: boolean;
  expected_facts: ExpectedFacts;
  expected_narratives: ExpectedNarrative[];
  expected_conclusions: {
    recommendation: 'buy' | 'outperform' | 'hold' | 'underperform' | 'sell' | 'not_rated';
    target_price_try?: number;
    target_price_range?: [number, number];
  };
  analyst_name?: string;
  analyst_firm?: string;
  report_date?: string;
}

function loadAndValidate(reportPath: string): GoldenReport {
  if (!fs.existsSync(reportPath)) {
    console.error(`[golden-eval] Golden report not found: ${reportPath}`);
    process.exit(2);
  }
  const raw = JSON.parse(fs.readFileSync(reportPath, 'utf-8')) as Record<string, unknown>;
  const schemaPath = path.resolve(__dirname, '../../evals/golden_v2/schema/golden_report.schema.json');
  if (!fs.existsSync(schemaPath)) {
    console.error(`[golden-eval] Schema not found: ${schemaPath}`);
    process.exit(2);
  }
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(raw);
  if (!ok) {
    console.error(`[golden-eval] Golden report failed schema validation:`);
    for (const err of validate.errors ?? []) {
      console.error(`  - ${err.instancePath} ${err.message}`);
    }
    process.exit(3);
  }
  return raw as unknown as GoldenReport;
}

function findGoldenReportForTicker(ticker: string): string | null {
  // Default search: evals/golden_v2/reports/<TICKER>/*.json — pick first match.
  const dir = path.resolve(__dirname, '../../evals/golden_v2/reports', ticker.toUpperCase());
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  if (files.length === 0) return null;
  return path.join(dir, files[0]);
}

function readSessionReportContent(sessionId: string): string {
  try {
    const row = db.prepare(
      `SELECT content FROM reports WHERE session_id = ? ORDER BY created_at DESC LIMIT 1`,
    ).get(sessionId) as { content?: string } | undefined;
    return row?.content ?? '';
  } catch (err) {
    console.error(`[golden-eval] DB read failed: ${err instanceof Error ? err.message : err}`);
    process.exit(4);
  }
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/golden-eval.ts <session_id> <ticker> [<golden_report_path>]');
    process.exit(2);
  }
  const [sessionId, ticker, explicitPath] = args;
  const reportPath = explicitPath ?? findGoldenReportForTicker(ticker);
  if (!reportPath) {
    console.error(`[golden-eval] No golden report found for ticker=${ticker}. Place a JSON file under evals/golden_v2/reports/${ticker.toUpperCase()}/, or pass an explicit path.`);
    process.exit(2);
  }

  const golden = loadAndValidate(reportPath);
  if (golden.synthetic_fixture === true) {
    console.error('[golden-eval] ⚠️  WARNING: this golden report is a SYNTHETIC TEST FIXTURE, not authoritative analyst data. Scoring output is for framework validation only.');
  }

  const pack = getCanonicalFactPackV2(sessionId);
  const reportContent = readSessionReportContent(sessionId);

  const numeric = scoreNumericAccuracy(golden.expected_facts, pack);
  const coverage = scoreCoverage(golden.expected_narratives, reportContent);
  const narrative = scoreNarrativeQuality(golden.expected_narratives, reportContent);

  const composite = round4((numeric.score + coverage.score + narrative.score) / 3);

  const scorecard = {
    session_id: sessionId,
    ticker: golden.ticker,
    period: golden.period,
    synthetic_fixture: golden.synthetic_fixture === true,
    golden_report_path: path.relative(path.resolve(__dirname, '../..'), reportPath),
    composite_score: composite,
    numeric_accuracy: numeric,
    coverage: coverage,
    narrative_quality: narrative,
    expected_recommendation: golden.expected_conclusions.recommendation,
    expected_target_price_try: golden.expected_conclusions.target_price_try ?? null,
    fact_pack_total: pack.fact_count,
    actual_report_chars: reportContent.length,
    generated_at: new Date().toISOString(),
  };

  process.stdout.write(JSON.stringify(scorecard, null, 2) + '\n');
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

main();
