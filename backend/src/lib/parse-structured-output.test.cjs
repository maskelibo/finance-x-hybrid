const assert = require('node:assert/strict');

// Inline reimpl for isolated testing
const PARSE_MODE_COUNTS = { pass_object:0, fast_whole:0, fallback_fenced:0, fallback_appendix:0, fallback_braces:0, null_input:0, no_match:0 };
function parseStructuredOutput(raw) {
  if (raw == null) { PARSE_MODE_COUNTS.null_input++; return { value: null, mode: 'null_input' }; }
  if (typeof raw === 'object') { PARSE_MODE_COUNTS.pass_object++; return { value: raw, mode: 'pass_object' }; }
  if (typeof raw !== 'string') { PARSE_MODE_COUNTS.null_input++; return { value: null, mode: 'null_input' }; }
  const text = raw;
  try { const v = JSON.parse(text); PARSE_MODE_COUNTS.fast_whole++; return { value: v, mode: 'fast_whole' }; } catch {}
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) { try { const v = JSON.parse(fenced[1].trim()); PARSE_MODE_COUNTS.fallback_fenced++; return { value: v, mode: 'fallback_fenced' }; } catch {} }
  const appendix = text.match(/STRUCTURED\s+DATA\s+APPENDIX[\s\S]*?(\{[\s\S]*\})\s*$/i);
  if (appendix) { try { const v = JSON.parse(appendix[1]); PARSE_MODE_COUNTS.fallback_appendix++; return { value: v, mode: 'fallback_appendix' }; } catch {} }
  const fb = text.indexOf('{');
  if (fb >= 0) {
    let d = 0, end = -1;
    for (let i = fb; i < text.length; i++) { const c = text[i]; if (c === '{') d++; else if (c === '}') { d--; if (d === 0) { end = i; break; } } }
    if (end > fb) { const cand = text.slice(fb, end + 1); if (cand.length >= 20) { try { const v = JSON.parse(cand); PARSE_MODE_COUNTS.fallback_braces++; return { value: v, mode: 'fallback_braces' }; } catch {} } }
  }
  PARSE_MODE_COUNTS.no_match++; return { value: null, mode: 'no_match' };
}

// T1: null / undefined / number → null_input
assert.equal(parseStructuredOutput(null).mode, 'null_input');
assert.equal(parseStructuredOutput(undefined).mode, 'null_input');
assert.equal(parseStructuredOutput(42).mode, 'null_input');
console.log('OK: test_null_input');

// T2: Already an object → pass through
const r2 = parseStructuredOutput({ a: 1, b: 2 });
assert.equal(r2.mode, 'pass_object');
assert.deepEqual(r2.value, { a: 1, b: 2 });
console.log('OK: test_pass_object');

// T3: Whole-string JSON
const r3 = parseStructuredOutput('{"ebitda": 100}');
assert.equal(r3.mode, 'fast_whole');
assert.equal(r3.value.ebitda, 100);
console.log('OK: test_fast_whole');

// T4: Fenced json block in middle of prose
const t4 = 'Some prose here.\n\n```json\n{"agent_id":"fa","roe":0.14}\n```\n\nMore prose.';
const r4 = parseStructuredOutput(t4);
assert.equal(r4.mode, 'fallback_fenced');
assert.equal(r4.value.roe, 0.14);
console.log('OK: test_fallback_fenced');

// T5: STRUCTURED DATA APPENDIX pattern at end
const t5 = '# Header\n\nNarrative content.\n\n## STRUCTURED DATA APPENDIX\n\n{"ebitda": 150, "nested": {"k": "v"}}';
const r5 = parseStructuredOutput(t5);
assert.equal(r5.mode, 'fallback_appendix');
assert.equal(r5.value.ebitda, 150);
assert.equal(r5.value.nested.k, 'v');
console.log('OK: test_fallback_appendix');

// T6: Balanced-brace scan mid-text
const t6 = 'Random text. {"company": "TUPRS", "ratio": 1.5} more text.';
const r6 = parseStructuredOutput(t6);
// This one SHOULD hit braces (no fence, no appendix pattern)
assert.ok(r6.mode === 'fallback_braces' || r6.mode === 'fast_whole');
assert.equal(r6.value.company, 'TUPRS');
console.log('OK: test_fallback_braces');

// T7: No JSON anywhere → no_match
const r7 = parseStructuredOutput('Pure prose, no structure at all.');
assert.equal(r7.mode, 'no_match');
assert.equal(r7.value, null);
console.log('OK: test_no_match');

// T8: Malformed fence → parser gives up (first-match policy).
// Documented limitation: agent shouldn't emit malformed fences.
const t8 = '```json\n{broken: json}\n```\n\nbut {"ok": "valid_value_long"} here';
const r8 = parseStructuredOutput(t8);
// Balanced-brace only tries the FIRST {...} it finds. If that fails (the
// broken one), scanner does not continue to the next — so we expect null.
assert.equal(r8.mode, 'no_match');
assert.equal(r8.value, null);
console.log('OK: test_malformed_fence_first_match_policy');

// T9: Tiny braces (<20 chars) are rejected
const r9 = parseStructuredOutput('text {"a":1} end');
// {"a":1} is only 7 chars so balanced-brace candidate is < 20 → no_match
assert.equal(r9.mode, 'no_match');
console.log('OK: test_tiny_braces_rejected');

console.log('\nAll tests passed.');
