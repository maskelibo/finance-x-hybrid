/**
 * Post-session regression eval — session tamamlandıktan sonra kalite kontrolü.
 * OBSERVE mode: loglar, DB'ye yazar, pipeline'ı ASLA bloklamaz.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { nanoid } from 'nanoid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKERS_DIR = path.resolve(__dirname, '../../evals/golden/markers');
const BASELINE_PATH = path.resolve(__dirname, '../../evals/baseline.json');

type MarkerDef = {
  required_metrics: string[];
  forbidden_patterns: string[];
  min_output_length: number;
};

function loadMarkers(agentId: string): MarkerDef | null {
  const p = path.join(MARKERS_DIR, `${agentId}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { return null; }
}

function loadBaseline(): Record<string, unknown> | null {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  } catch { return null; }
}

type EvalSummary = {
  session_id: string;
  ticker: string;
  agents_evaluated: number;
  agents_passed: number;
  agents_warned: number;
  agents_failed: number;
  overall_quality: number;
  regression_detected: boolean;
  details: string;
};

export function runRegressionEval(sessionId: string): EvalSummary | null {
  try {
    const session = db.prepare('SELECT ticker FROM analysis_sessions WHERE id = ?').get(sessionId) as { ticker: string } | undefined;
    if (!session) return null;

    const runs = db.prepare(
      "SELECT agent_id, output_text FROM agent_runs WHERE session_id = ? AND status = 'completed'"
    ).all(sessionId) as Array<{ agent_id: string; output_text: string | null }>;

    let totalQuality = 0;
    let qualityCount = 0;
    let passed = 0;
    let warned = 0;
    let failed = 0;
    const failDetails: string[] = [];

    for (const run of runs) {
      const markers = loadMarkers(run.agent_id);
      if (!markers) continue;

      const text = (run.output_text || '').toLowerCase();
      const textLen = (run.output_text || '').length;

      // Required metrics check
      const found = markers.required_metrics.filter(m => text.includes(m.toLowerCase()));
      const missing = markers.required_metrics.filter(m => !text.includes(m.toLowerCase()));
      const ratio = markers.required_metrics.length > 0 ? found.length / markers.required_metrics.length : 1;

      // Forbidden patterns
      const forbidden = markers.forbidden_patterns.filter(p => text.includes(p.toLowerCase()));

      // Length check
      const lengthOk = textLen >= markers.min_output_length;

      totalQuality += ratio;
      qualityCount++;

      if (ratio >= 0.90 && forbidden.length === 0 && lengthOk) {
        passed++;
      } else if (ratio < 0.75 || forbidden.length > 0 || !lengthOk) {
        failed++;
        if (missing.length > 0) failDetails.push(`${run.agent_id}: eksik ${missing.join(',')}`);
        if (!lengthOk) failDetails.push(`${run.agent_id}: çıktı kısa (${textLen})`);
      } else {
        warned++;
      }
    }

    const overallQuality = qualityCount > 0 ? Math.round((totalQuality / qualityCount) * 1000) / 1000 : 0;
    const regressionDetected = failed > 0 || overallQuality < 0.75;

    const summary: EvalSummary = {
      session_id: sessionId,
      ticker: session.ticker,
      agents_evaluated: qualityCount,
      agents_passed: passed,
      agents_warned: warned,
      agents_failed: failed,
      overall_quality: overallQuality,
      regression_detected: regressionDetected,
      details: failDetails.join('; ').slice(0, 500),
    };

    // Log to console
    const icon = regressionDetected ? '🔴' : '✅';
    console.log(`[GOVERNANCE:EVAL] ${icon} ${session.ticker} — quality: ${(overallQuality * 100).toFixed(0)}% | pass: ${passed} warn: ${warned} fail: ${failed}${regressionDetected ? ' | REGRESSION DETECTED' : ''}`);

    // Write to DB
    try {
      db.prepare(`INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, created_at)
        VALUES (?, 'regression_eval', ?, ?, 'autonomous', 'completed', ?)`)
        .run(
          nanoid(),
          `${session.ticker} regression eval: ${(overallQuality * 100).toFixed(0)}%`,
          JSON.stringify(summary),
          new Date().toISOString(),
        );
    } catch { /* non-fatal */ }

    return summary;
  } catch (err: any) {
    console.error(`[GOVERNANCE:EVAL] Failed (non-blocking): ${err.message}`);
    return null;
  }
}
