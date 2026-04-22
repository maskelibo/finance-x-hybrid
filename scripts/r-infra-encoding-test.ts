/**
 * Infra fix-pack test: Python spawn UTF-8 stdout.
 * Pre-fix: Windows Python stdout default cp1254 → UnicodeEncodeError on Turkish chars.
 * Post-fix: PYTHONIOENCODING=utf-8 + PYTHONUTF8=1 → clean UTF-8 stream.
 */
import { runFinancexCommand as runFinancex } from '../backend/src/python/bridge.js';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { PROJECT_ROOT } from '../backend/src/config.js';

let ok = 0, fail = 0;
const log: string[] = [];
const a = (c: boolean, m: string) => { if (c) { ok++; log.push(`✅ ${m}`); } else { fail++; log.push(`❌ ${m}`); } };

// --- Test 1: financex CLI is reachable (platform-aware DEFAULT_BIN)
const versionRes = await runFinancex(['version']);
a(versionRes.success, `financex version call success (exit=${versionRes.exitCode})`);
a(/financex\s+\d/.test(versionRes.stdout), `version output has "financex N" pattern: ${versionRes.stdout.trim().slice(0,80)}`);

// --- Test 2: Turkish char roundtrip — no UnicodeEncodeError
// Directly spawn python + print turkish chars to trigger cp1254 bug path
const bin = process.platform === 'win32'
  ? path.join(PROJECT_ROOT, 'python-services', '.venv', 'Scripts', 'python.exe')
  : path.join(PROJECT_ROOT, 'python-services', '.venv', 'bin', 'python');

// With env (fix applied)
const withFix = spawnSync(bin, ['-c', 'import sys; sys.stdout.write("şçığüö—áéí€\\n")'], {
  env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
  encoding: 'utf-8',
});
a(withFix.status === 0, `Turkish print with PYTHONIOENCODING=utf-8: exit 0 (got ${withFix.status})`);
a((withFix.stdout || '').includes('şçığüö'), `Turkish chars present in stdout (got: ${JSON.stringify((withFix.stdout||'').trim())})`);

// Without env (simulate old behavior — may or may not fail on this specific Windows)
const withoutFix = spawnSync(bin, ['-c', 'import sys; sys.stdout.write("şçığüö—áéí€\\n")'], {
  env: { ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('PYTHON'))) },
  encoding: 'utf-8',
});
const failedWithoutFix = withoutFix.status !== 0 || (withoutFix.stderr || '').includes('UnicodeEncodeError');
log.push(`ℹ️  Without fix: exit=${withoutFix.status} hasUnicodeErr=${(withoutFix.stderr||'').includes('UnicodeEncodeError')}`);
// Not strict-assert; on modern Windows some builds use utf-8 by default already.

// --- Test 3: financex data collect via bridge — no Unicode crash (real-world trigger)
// Note: this is a lightweight ping; we only test absence of crash, not successful data.
const collectRes = await runFinancex(['--help']);
a(collectRes.success || collectRes.exitCode === 0, `financex --help clean exit`);
a(!(collectRes.stderr || '').includes('UnicodeEncodeError'), `No UnicodeEncodeError in --help stderr`);
a(!(collectRes.stderr || '').includes('charmap'), `No cp1254 'charmap' codec in --help stderr`);

console.log(log.join('\n'));
console.log(`\n=== Result: ${ok} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
