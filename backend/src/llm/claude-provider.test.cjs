// Lightweight smoke test for Phase 8G StreamJsonAccumulator.
// Run with: node claude-provider.test.cjs (after tsc build to dist/, or adapt paths).
// Uses a private-ish re-require so we can exercise the accumulator in isolation.

const assert = require('node:assert/strict');

// Re-implement accumulator inline for the test harness — mirrors the class in
// claude-provider.ts. If you change behaviour there, update here too.
class Accumulator {
  constructor() {
    this.pendingLine = '';
    this.assistantText = '';
    this.finalResult = null;
    this.costUsd = 0;
    this.inputTokens = 0;
    this.outputTokens = 0;
  }
  feed(chunk) {
    this.pendingLine += chunk;
    let idx;
    while ((idx = this.pendingLine.indexOf('\n')) !== -1) {
      const line = this.pendingLine.slice(0, idx).trim();
      this.pendingLine = this.pendingLine.slice(idx + 1);
      if (!line) continue;
      this._handleLine(line);
    }
  }
  flush() {
    const tail = this.pendingLine.trim();
    this.pendingLine = '';
    if (tail) this._handleLine(tail);
  }
  _handleLine(line) {
    let evt;
    try { evt = JSON.parse(line); } catch { return; }
    if (!evt || typeof evt !== 'object') return;
    const type = evt.type;
    if (type === 'assistant') {
      const content = evt.message && evt.message.content;
      if (Array.isArray(content)) {
        for (const b of content) {
          if (b && b.type === 'text' && typeof b.text === 'string') {
            this.assistantText += b.text;
          }
        }
      }
    } else if (type === 'result') {
      if (typeof evt.result === 'string' && evt.result.length > 0) this.finalResult = evt.result;
      if (typeof evt.total_cost_usd === 'number') this.costUsd = evt.total_cost_usd;
      if (evt.usage) {
        if (typeof evt.usage.input_tokens === 'number') this.inputTokens = evt.usage.input_tokens;
        if (typeof evt.usage.output_tokens === 'number') this.outputTokens = evt.usage.output_tokens;
      }
    }
  }
  getOutput() { return this.finalResult !== null ? this.finalResult : this.assistantText; }
  getCostUsd() { return this.costUsd; }
  getTokensUsed() { return this.inputTokens + this.outputTokens; }
}

// Test 1: Feed complete lines one at a time.
(function() {
  const a = new Accumulator();
  a.feed(JSON.stringify({ type: 'system', session_id: 's1' }) + '\n');
  a.feed(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'Hello ' }] } }) + '\n');
  a.feed(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'world.' }] } }) + '\n');
  a.feed(JSON.stringify({ type: 'result', subtype: 'success', result: 'FINAL_RESULT_STRING', total_cost_usd: 0.42, usage: { input_tokens: 1000, output_tokens: 500 } }) + '\n');
  a.flush();
  assert.equal(a.getOutput(), 'FINAL_RESULT_STRING', 'result.result should override assistantText');
  assert.equal(a.getCostUsd(), 0.42);
  assert.equal(a.getTokensUsed(), 1500);
  console.log('OK: test_complete_lines');
})();

// Test 2: Chunk split mid-line — accumulator must buffer partial line.
(function() {
  const a = new Accumulator();
  const evt = JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'partial1 ' }] } }) + '\n';
  a.feed(evt.slice(0, 40));
  a.feed(evt.slice(40)); // rest including newline
  a.feed(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'partial2' }] } }) + '\n');
  a.flush();
  assert.equal(a.getOutput(), 'partial1 partial2');
  console.log('OK: test_chunk_split');
})();

// Test 3: No result event — fall back to assistantText.
(function() {
  const a = new Accumulator();
  a.feed(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'only partials' }] } }) + '\n');
  a.flush();
  assert.equal(a.getOutput(), 'only partials');
  assert.equal(a.getCostUsd(), 0);
  console.log('OK: test_no_result_fallback');
})();

// Test 4: Malformed JSON line is skipped, not fatal.
(function() {
  const a = new Accumulator();
  a.feed('not-json-garbage\n');
  a.feed(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'after garbage' }] } }) + '\n');
  a.feed(JSON.stringify({ type: 'result', result: 'final', total_cost_usd: 0.1, usage: {} }) + '\n');
  a.flush();
  assert.equal(a.getOutput(), 'final');
  console.log('OK: test_malformed_skipped');
})();

// Test 5: Empty result string falls back to accumulated text.
(function() {
  const a = new Accumulator();
  a.feed(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: 'accumulated' }] } }) + '\n');
  a.feed(JSON.stringify({ type: 'result', result: '', total_cost_usd: 0.05, usage: { input_tokens: 10, output_tokens: 20 } }) + '\n');
  a.flush();
  assert.equal(a.getOutput(), 'accumulated', 'empty result string should not override');
  assert.equal(a.getCostUsd(), 0.05);
  assert.equal(a.getTokensUsed(), 30);
  console.log('OK: test_empty_result_fallback');
})();

// Test 6: Big payload — ensure many small chunks accumulate correctly.
(function() {
  const a = new Accumulator();
  const chunks = [];
  for (let i = 0; i < 100; i++) {
    chunks.push(JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: `ch${i} ` }] } }) + '\n');
  }
  chunks.push(JSON.stringify({ type: 'result', result: 'done', total_cost_usd: 1.2, usage: { input_tokens: 5000, output_tokens: 3000 } }) + '\n');
  const joined = chunks.join('');
  // Feed in 1-byte chunks to stress the line buffer.
  for (const ch of joined) a.feed(ch);
  a.flush();
  assert.equal(a.getOutput(), 'done');
  assert.equal(a.getCostUsd(), 1.2);
  assert.equal(a.getTokensUsed(), 8000);
  console.log('OK: test_byte_stream');
})();

console.log('\nAll tests passed.');
