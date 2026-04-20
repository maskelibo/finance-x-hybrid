// Smoke test for the TS loader by invoking the Python side directly.
// We run this as a CommonJS script to avoid adding to the backend's test harness.
// Phase 3 migrates to vitest and imports the .ts loader via ts-node / backend's
// build pipeline.

const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const PY = process.env.FINANCEX_PYTHON || 'python';
const LOADER = path.join(ROOT, 'canonical', '_loader', 'python', 'loader.py');

function run(flag, value) {
  const buf = execFileSync(PY, value ? [LOADER, flag, value] : [LOADER, flag],
    { encoding: 'utf-8', cwd: ROOT });
  return JSON.parse(buf);
}

function assertEq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}: ${JSON.stringify(got)}`);
  if (!ok) process.exitCode = 2;
}

assertEq('THYAO sector', run('--ticker', 'THYAO').sector, 'aviation');
assertEq('TUPRS sector', run('--ticker', 'TUPRS').sector, 'energy_refining');
assertEq('UNKNOWN sector', run('--ticker', 'UNKNOWN').sector, null);

const fast = run('--mode', 'fast_screening');
assertEq('fast_screening count', fast.agents.length, 16);

const deep = run('--mode', 'deep_dive');
assertEq('deep_dive count', deep.agents.length, 22);

const m = run('--metric', 'MM-07');
assertEq('MM-07 name_en', m.name_en, 'EBITDA');

console.log('loader smoke:', process.exitCode ? 'FAILED' : 'OK');
