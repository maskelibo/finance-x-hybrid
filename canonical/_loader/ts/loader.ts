/**
 * Canonical loader — TypeScript side.
 *
 * Thin shim around the authoritative Python loader at
 * `canonical/_loader/python/loader.py`. Runs via `child_process.execFileSync`,
 * which matches the existing architecture (backend already spawns Python for
 * the hybrid agents) and avoids adding a new dependency to `backend/package.json`.
 *
 * Hot-path alternative: in Phase 3, if latency matters, replace this with
 * `import yaml from 'js-yaml'` + direct file reads. `js-yaml` is already
 * present in the node_modules tree as a transitive dependency, but it is not
 * declared in package.json yet — Phase 3 adds the declaration if we keep this
 * path.
 *
 * Usage:
 *   import { getSector, getModeActivation } from './loader';
 *   const sector = getSector('THYAO');          // "aviation"
 *   const agents = getModeActivation('deep_dive'); // list of 22 agent ids
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..', '..', '..');
const PY = process.env.FINANCEX_PYTHON ?? 'python';
const LOADER = path.join(ROOT, 'canonical', '_loader', 'python', 'loader.py');

function callLoader(flag: string, value?: string): unknown {
  const args = value ? [LOADER, flag, value] : [LOADER, flag];
  const buf = execFileSync(PY, args, { encoding: 'utf-8', cwd: ROOT });
  return JSON.parse(buf);
}

export type TickerInfo = {
  ticker: string;
  sector: string | null;
  playbook: string | null;
};

export function getTickerInfo(ticker: string): TickerInfo {
  return callLoader('--ticker', ticker) as TickerInfo;
}

export function getSector(ticker: string): string | null {
  return getTickerInfo(ticker).sector;
}

export function isClassified(ticker: string): boolean {
  return getSector(ticker) !== null;
}

export type MetricDef = {
  name_tr?: string;
  name_en?: string;
  unit?: string;
  formula?: string;
  required_inputs?: string[];
  benchmark_required?: boolean;
  interpretation_required?: boolean;
  sector_variants?: Record<string, string>;
  null_proxy?: { formula: string; confidence: string; label?: string };
};

export function getMetric(metricId: string): MetricDef | null {
  const doc = callLoader('--metric', metricId) as MetricDef;
  if (doc && Object.keys(doc).length > 0) return doc;
  return null;
}

export type ModeActivation = {
  mode: string;
  agents: string[];
  parallel_groups: string[][];
  extended_thinking: string[];
};

export function getModeActivation(mode: string): ModeActivation {
  return callLoader('--mode', mode) as ModeActivation;
}

export function getAgentContract(agentId: string): unknown {
  return callLoader('--agent', agentId);
}

/**
 * Run the Python-side selftest as a smoke gate. Returns true if selftest
 * exits with code 0. Useful for backend boot checks or CI steps.
 */
export function selftest(): boolean {
  try {
    execFileSync(PY, [LOADER, '--selftest'], { encoding: 'utf-8', cwd: ROOT });
    return true;
  } catch {
    return false;
  }
}
