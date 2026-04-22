// Phase 8H sub-agent runner unit tests.
// Tests concurrency + ordering + error semantics using a mocked runAgent.
// Run with: node sub-agent-runner.test.cjs

const assert = require('node:assert/strict');

// Inline re-implementation of runParallelSubAgents with injectable runAgent,
// so we can exercise the concurrency logic without spawning Claude CLI.
function makeRunner(runAgentMock) {
  return async function runParallelSubAgents(tasks, opts = {}) {
    const maxConcurrency = Math.max(1, opts.maxConcurrency ?? 3);
    const continueOnError = opts.continueOnError ?? true;
    if (tasks.length === 0) return [];
    const results = new Array(tasks.length).fill(null);
    let cursor = 0;
    const workerCount = Math.min(maxConcurrency, tasks.length);

    async function worker() {
      while (true) {
        const i = cursor++;
        if (i >= tasks.length) return;
        const task = tasks[i];
        const t0 = Date.now();
        try {
          const result = await runAgentMock({ agentId: task.agentId, taskPrompt: task.taskPrompt, context: task.context });
          results[i] = { id: task.id, agentId: task.agentId, result, durationMs: Date.now() - t0 };
          if (!result.success && !continueOnError) { cursor = tasks.length; return; }
        } catch (err) {
          results[i] = { id: task.id, agentId: task.agentId, result: { success: false, output: '', error: err.message, errorType: 'unknown', durationMs: Date.now()-t0, tokensUsed: 0, costUsd: 0, provider: 'claude' }, durationMs: Date.now()-t0 };
          if (!continueOnError) { cursor = tasks.length; return; }
        }
      }
    }
    const workers = Array.from({ length: workerCount }, () => worker());
    await Promise.all(workers);
    for (let i = 0; i < results.length; i++) {
      if (results[i] === null) {
        results[i] = { id: tasks[i].id, agentId: tasks[i].agentId, result: { success: false, output: '', error: 'skipped', errorType: 'unknown', durationMs: 0, tokensUsed: 0, costUsd: 0, provider: 'claude' }, durationMs: 0 };
      }
    }
    return results;
  };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Test 1: Results come back in INPUT order, not completion order.
(async function () {
  const delays = { a: 150, b: 50, c: 100 };
  const mock = async ({ agentId, taskPrompt }) => {
    await sleep(delays[taskPrompt]);
    return { success: true, output: taskPrompt.toUpperCase(), durationMs: delays[taskPrompt], tokensUsed: 10, costUsd: 0.01, provider: 'claude' };
  };
  const run = makeRunner(mock);
  const tasks = [
    { id: 't1', agentId: 'x', taskPrompt: 'a' },
    { id: 't2', agentId: 'x', taskPrompt: 'b' },
    { id: 't3', agentId: 'x', taskPrompt: 'c' },
  ];
  const results = await run(tasks, { maxConcurrency: 3 });
  assert.equal(results[0].result.output, 'A');
  assert.equal(results[1].result.output, 'B');
  assert.equal(results[2].result.output, 'C');
  console.log('OK: test_input_order_preserved');
})();

// Test 2: Concurrency limit respected — never more than N workers at once.
(async function () {
  let active = 0;
  let peak = 0;
  const mock = async () => {
    active++;
    peak = Math.max(peak, active);
    await sleep(30);
    active--;
    return { success: true, output: 'x', durationMs: 30, tokensUsed: 1, costUsd: 0.001, provider: 'claude' };
  };
  const run = makeRunner(mock);
  const tasks = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, agentId: 'x', taskPrompt: `p${i}` }));
  await run(tasks, { maxConcurrency: 3 });
  assert.ok(peak <= 3, `peak concurrency ${peak} exceeded limit 3`);
  assert.ok(peak >= 2, `peak concurrency ${peak} suspiciously low — serial?`);
  console.log(`OK: test_concurrency_limit_respected (peak=${peak})`);
})();

// Test 3: continueOnError=true completes all tasks even if some fail.
(async function () {
  const mock = async ({ taskPrompt }) => {
    if (taskPrompt === 'fail') {
      return { success: false, output: '', error: 'fake error', errorType: 'unknown', durationMs: 1, tokensUsed: 0, costUsd: 0, provider: 'claude' };
    }
    return { success: true, output: taskPrompt, durationMs: 1, tokensUsed: 1, costUsd: 0.001, provider: 'claude' };
  };
  const run = makeRunner(mock);
  const tasks = [
    { id: 't1', agentId: 'x', taskPrompt: 'ok1' },
    { id: 't2', agentId: 'x', taskPrompt: 'fail' },
    { id: 't3', agentId: 'x', taskPrompt: 'ok2' },
  ];
  const results = await run(tasks, { continueOnError: true });
  assert.equal(results[0].result.success, true);
  assert.equal(results[1].result.success, false);
  assert.equal(results[2].result.success, true);
  console.log('OK: test_continue_on_error');
})();

// Test 4: Empty task list resolves to []
(async function () {
  const run = makeRunner(async () => { throw new Error('should not be called'); });
  const results = await run([]);
  assert.deepEqual(results, []);
  console.log('OK: test_empty_task_list');
})();

// Test 5: Exception in runAgent is caught and reported as sub-task failure.
(async function () {
  const mock = async ({ taskPrompt }) => {
    if (taskPrompt === 'boom') throw new Error('mock explosion');
    return { success: true, output: taskPrompt, durationMs: 1, tokensUsed: 1, costUsd: 0.001, provider: 'claude' };
  };
  const run = makeRunner(mock);
  const tasks = [
    { id: 't1', agentId: 'x', taskPrompt: 'boom' },
    { id: 't2', agentId: 'x', taskPrompt: 'ok' },
  ];
  const results = await run(tasks, { continueOnError: true });
  assert.equal(results[0].result.success, false);
  assert.ok(results[0].result.error.includes('mock explosion'));
  assert.equal(results[1].result.success, true);
  console.log('OK: test_exception_handled');
})();

(async function main() {
  // Give the async test functions time to complete.
  await sleep(500);
  console.log('\nAll tests passed.');
})();
