/**
 * Execute phase — run each scoped query against a web search function.
 *
 * The web-search function is INJECTABLE so this module stays testable:
 * the orchestrator (or a smoke test) provides either a real WebFetch-backed
 * implementation, a Claude-CLI WebSearch-tool-backed implementation (via
 * agent-runner external_research spawn), or a deterministic mock.
 *
 * Queries run with bounded concurrency to respect upstream rate limits.
 */
import type { ScopedQuery, ScopedResearchPlan, WebSearchFn, WebSearchResult } from './types.js';

export interface ExecuteOptions {
  concurrency?: number;
  timeoutMsPerQuery?: number;
  webSearch: WebSearchFn;
}

export interface ExecuteOutput {
  results: Array<{ query: ScopedQuery; result: WebSearchResult | null; error?: string }>;
  duration_ms: number;
}

async function runLimited<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  const workers: Promise<void>[] = [];
  const n = Math.min(limit, items.length);
  for (let i = 0; i < n; i++) {
    workers.push(
      (async () => {
        while (true) {
          const myIdx = idx++;
          if (myIdx >= items.length) return;
          out[myIdx] = await worker(items[myIdx]);
        }
      })(),
    );
  }
  await Promise.all(workers);
  return out;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms: ${label}`)), ms);
    p.then(v => {
      clearTimeout(timer);
      resolve(v);
    }).catch(err => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function executeScope(
  plan: ScopedResearchPlan,
  opts: ExecuteOptions,
): Promise<ExecuteOutput> {
  const concurrency = opts.concurrency ?? 3;
  const timeoutMsPerQuery = opts.timeoutMsPerQuery ?? 30_000;
  const t0 = Date.now();

  const results = await runLimited(plan.queries, concurrency, async q => {
    try {
      const result = await withTimeout(opts.webSearch(q.query), timeoutMsPerQuery, q.query);
      return { query: q, result, error: undefined };
    } catch (err) {
      return { query: q, result: null, error: (err as Error).message };
    }
  });

  return { results, duration_ms: Date.now() - t0 };
}
