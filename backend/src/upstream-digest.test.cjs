// Lightweight manual test harness for upstream-digest.
// Run: node upstream-digest.test.cjs (after tsc build) — or integrate later.
// Not tied to a test framework; exits non-zero on failure so CI can notice.

const assert = require('node:assert/strict');

// Import compiled .js (run `tsc` before this test)
const { digestUpstream } = require('./upstream-digest.js');

// Helper
const bytes = (s) => Buffer.byteLength(s, 'utf8');

// Test 1: Raw passthrough when output < budget.
(function test_raw_passthrough() {
  const small = 'hello world';
  const result = digestUpstream(small, 1000);
  assert.equal(result.mode, 'raw');
  assert.equal(result.digest, small);
  assert.equal(result.compressionRatio, 1);
  console.log('OK test_raw_passthrough');
})();

// Test 2: JSON digest keeps high-signal fields.
(function test_json_digest() {
  const big = {
    executive_summary: 'EBITDA down 5% YoY, WACC pressure from TRY rates.',
    findings: [
      { finding_id: 'F1', severity: 'high', issue: 'DCF terminal g too high' },
      { finding_id: 'F2', severity: 'medium', issue: 'Missing CoE benchmark' },
    ],
    metrics_array: Array.from({ length: 100 }, (_, i) => ({ id: `MM-${i.toString().padStart(3, '0')}`, value: i * 10 })),
    filler_field_that_should_be_dropped: 'x'.repeat(50000),
  };
  const raw = JSON.stringify(big);
  assert.ok(bytes(raw) > 20000, 'fixture should exceed budget');
  const result = digestUpstream(raw, 5000);
  assert.equal(result.mode, 'json');
  assert.ok(result.digestBytes <= 5000, `digestBytes ${result.digestBytes} exceeded budget 5000`);
  assert.ok(result.sectionsKept.includes('executive_summary'), 'executive_summary must survive');
  assert.ok(result.sectionsKept.includes('findings'), 'findings must survive');
  assert.ok(!result.digest.includes('filler_field_that_should_be_dropped'), 'low-signal field must be dropped');
  assert.ok(result.compressionRatio > 2, `compression ratio ${result.compressionRatio} too low`);
  console.log(`OK test_json_digest (kept: ${result.sectionsKept.join(', ')}, ratio=${result.compressionRatio.toFixed(1)}x)`);
})();

// Test 3: Smart slice when output isn't JSON — keeps head AND tail.
(function test_smart_slice_head_and_tail() {
  const head = 'BEGIN:::' + 'a'.repeat(20000);
  const middle = 'MIDDLE_FILLER:::' + 'b'.repeat(60000);
  const tail = 'c'.repeat(20000) + ':::END_CRITICAL_FINDING';
  const raw = head + middle + tail;
  assert.ok(bytes(raw) > 80000);

  const result = digestUpstream(raw, 20000);
  assert.equal(result.mode, 'smart_slice');
  assert.ok(result.digest.startsWith('BEGIN:::'), 'head must be preserved');
  assert.ok(result.digest.endsWith(':::END_CRITICAL_FINDING'), `tail must be preserved — got: ...${result.digest.slice(-60)}`);
  assert.ok(result.digest.includes('[... digest:'), 'marker must be inserted');
  console.log('OK test_smart_slice_head_and_tail');
})();

// Test 4: Legacy truncate mode — front-only slice.
(function test_legacy_truncate() {
  const raw = 'x'.repeat(100_000);
  const result = digestUpstream(raw, 15000, { mode: 'truncate' });
  assert.equal(result.mode, 'legacy_truncate');
  assert.equal(bytes(result.digest), 15000);
  console.log('OK test_legacy_truncate');
})();

// Test 5: Handles null / undefined / non-string gracefully.
(function test_null_safety() {
  assert.equal(digestUpstream(null, 100).digest, '');
  assert.equal(digestUpstream(undefined, 100).digest, '');
  assert.equal(digestUpstream(null, 100).mode, 'raw');
  console.log('OK test_null_safety');
})();

// Test 6: Idempotent — re-digesting a digest doesn't shrink further meaningfully.
(function test_idempotent() {
  const big = JSON.stringify({
    executive_summary: 'big summary ' + 'x'.repeat(5000),
    filler: 'y'.repeat(50000),
  });
  const first = digestUpstream(big, 3000);
  const second = digestUpstream(first.digest, 3000);
  // Second pass: already under budget, so mode='raw'.
  assert.equal(second.mode, 'raw');
  assert.equal(second.digest, first.digest);
  console.log('OK test_idempotent');
})();

// Test 7: Tail must not be eaten — realistic EBITDA scenario.
(function test_ebitda_scenario() {
  // Simulate a 100 KB agent output where the critical EBITDA finding is in
  // the last 10 KB (classic Lost-in-the-Middle).
  const frame = '## Analysis\n' + 'intro text '.repeat(1000);
  const filler = 'dense narrative prose repeating analysis details. '.repeat(1200);
  const ebitdaCritical = '\n\n## Critical Finding: EBITDA calculation off by 18%, see reconciliation note 4.\n';
  const raw = frame + filler + ebitdaCritical;

  const legacy = digestUpstream(raw, 15000, { mode: 'truncate' }).digest;
  const smart = digestUpstream(raw, 15000, { mode: 'smart' }).digest;

  assert.ok(!legacy.includes('EBITDA calculation off'), 'legacy truncate DROPS the finding (that is the bug)');
  assert.ok(smart.includes('EBITDA calculation off'), 'smart mode MUST preserve the tail finding');
  console.log('OK test_ebitda_scenario — smart mode rescues the tail finding');
})();

console.log('\nAll tests passed.');
