/**
 * Infra smoke: `financex data collect THYAO` via bridge, post UTF-8 fix.
 * Goal: no UnicodeEncodeError in stderr, non-empty stdout (manifest JSON).
 */
import { runFinancexCommand } from '../backend/src/python/bridge.js';

const res = await runFinancexCommand([
  'data', 'collect',
  'THYAO',                     // positional
  '--years', '2',              // small window for smoke
  '--kinds', 'activity_report',
], { timeoutMs: 180_000 });

console.log('=== data collect THYAO ===');
console.log(`success=${res.success} exit=${res.exitCode} dur=${res.durationMs}ms`);
console.log(`stderr excerpt (first 300):`);
console.log((res.stderr || '').slice(0, 300));
console.log();
console.log(`stdout excerpt (first 500):`);
console.log((res.stdout || '').slice(0, 500));
console.log();

const hasUnicodeErr = (res.stderr || '').includes('UnicodeEncodeError') || (res.stderr || '').includes('charmap');
const manifestJson = res.stdout.trim().startsWith('{');

console.log(`=== VERDICT ===`);
console.log(`UnicodeEncodeError absent: ${hasUnicodeErr ? '❌ present' : '✅'}`);
console.log(`Manifest JSON emitted:     ${manifestJson ? '✅' : '❌ no valid JSON'}`);
console.log(`Exit code 0:               ${res.exitCode === 0 ? '✅' : `❌ ${res.exitCode}`}`);
process.exit(!hasUnicodeErr && manifestJson ? 0 : 1);
