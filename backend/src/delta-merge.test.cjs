// Phase 8J delta-merge unit tests.
const assert = require('node:assert/strict');

// Inline reimpl of core functions for isolated testing.
const JSON_FENCE = /```json\s*([\s\S]*?)```/i;

function extractJsonBlock(text) {
  const m = text.match(JSON_FENCE);
  if (!m) return { json: null, before: text, after: '' };
  try {
    const parsed = JSON.parse(m[1].trim());
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const idx = m.index;
      return { json: parsed, before: text.slice(0, idx), after: text.slice(idx + m[0].length) };
    }
  } catch {}
  return { json: null, before: text, after: '' };
}

function deepMerge(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v === undefined) continue;
    if (v === null) { out[k] = null; continue; }
    const e = out[k];
    if (e !== null && typeof e === 'object' && !Array.isArray(e) && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(e, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function deltaMerge(original, revision) {
  if (!original) return { merged: revision || '', strategy: 'revision_only' };
  if (!revision) return { merged: original, strategy: 'revision_only' };
  const o = extractJsonBlock(original);
  const r = extractJsonBlock(revision);
  if (!o.json || !r.json) {
    return { merged: `${original}\n\n---\n## QA REVISION EKI\n${revision}`, strategy: 'concat_fallback' };
  }
  const merged = deepMerge(o.json, r.json);
  const narr = `${(o.before + o.after).trim()}\n\n---\n## QA REVISION — DELTA\n${(r.before + r.after).trim()}`;
  return { merged: '```json\n' + JSON.stringify(merged, null, 2) + '\n```\n\n' + narr, strategy: 'json_deep_merge', mergedJson: merged };
}

// Test 1: Both structured — deep merge, revision overrides
(function() {
  const original = '```json\n' + JSON.stringify({ agent_id: 'fa', ebitda: 100, roe: 0.14, warnings: [] }) + '\n```\n\nOriginal narrative.';
  const revision = '```json\n' + JSON.stringify({ ebitda: 120, new_field: 'x' }) + '\n```\n\nRevision notes.';
  const r = deltaMerge(original, revision);
  assert.equal(r.strategy, 'json_deep_merge');
  assert.equal(r.mergedJson.ebitda, 120);
  assert.equal(r.mergedJson.roe, 0.14);
  assert.equal(r.mergedJson.new_field, 'x');
  assert.ok(r.merged.includes('Original narrative'));
  assert.ok(r.merged.includes('Revision notes'));
  console.log('OK: test_deep_merge_structured');
})();

// Test 2: No JSON in either — concat fallback
(function() {
  const original = 'Pure markdown output';
  const revision = 'Revision markdown';
  const r = deltaMerge(original, revision);
  assert.equal(r.strategy, 'concat_fallback');
  assert.ok(r.merged.includes('Pure markdown output'));
  assert.ok(r.merged.includes('QA REVISION EKI'));
  assert.ok(r.merged.includes('Revision markdown'));
  console.log('OK: test_concat_fallback');
})();

// Test 3: Nested object merge — revision field adds to nested object
(function() {
  const original = '```json\n' + JSON.stringify({ company: { name: 'TUPRS', ticker: 'TUPRS' }, metrics: { ebitda: 100 } }) + '\n```';
  const revision = '```json\n' + JSON.stringify({ company: { kap_id: '1234' }, metrics: { ebitda: 110, roe: 0.15 } }) + '\n```';
  const r = deltaMerge(original, revision);
  assert.equal(r.mergedJson.company.name, 'TUPRS');
  assert.equal(r.mergedJson.company.ticker, 'TUPRS');
  assert.equal(r.mergedJson.company.kap_id, '1234');
  assert.equal(r.mergedJson.metrics.ebitda, 110);
  assert.equal(r.mergedJson.metrics.roe, 0.15);
  console.log('OK: test_nested_deep_merge');
})();

// Test 4: Arrays are REPLACED by revision (not concatenated)
(function() {
  const original = '```json\n' + JSON.stringify({ warnings: ['a', 'b'], data: [1, 2, 3] }) + '\n```';
  const revision = '```json\n' + JSON.stringify({ warnings: ['c'], data: [4] }) + '\n```';
  const r = deltaMerge(original, revision);
  assert.deepEqual(r.mergedJson.warnings, ['c']);
  assert.deepEqual(r.mergedJson.data, [4]);
  console.log('OK: test_arrays_replaced');
})();

// Test 5: Only original has JSON — concat fallback
(function() {
  const original = '```json\n' + JSON.stringify({ x: 1 }) + '\n```\n\noriginal narrative';
  const revision = 'just markdown';
  const r = deltaMerge(original, revision);
  assert.equal(r.strategy, 'concat_fallback');
  console.log('OK: test_partial_json_fallback');
})();

// Test 6: Empty strings
(function() {
  assert.equal(deltaMerge('', 'rev').merged, 'rev');
  assert.equal(deltaMerge('orig', '').merged, 'orig');
  assert.equal(deltaMerge('', '').merged, '');
  console.log('OK: test_empty_inputs');
})();

// Test 7: Revision adds new top-level section
(function() {
  const original = '```json\n' + JSON.stringify({ agent_id: 'fa', core: { a: 1 } }) + '\n```';
  const revision = '```json\n' + JSON.stringify({ addressed_findings: [{ id: 'F1', action: 'fixed' }] }) + '\n```';
  const r = deltaMerge(original, revision);
  assert.equal(r.mergedJson.agent_id, 'fa');
  assert.equal(r.mergedJson.core.a, 1);
  assert.deepEqual(r.mergedJson.addressed_findings, [{ id: 'F1', action: 'fixed' }]);
  console.log('OK: test_revision_adds_new_field');
})();

console.log('\nAll tests passed.');
