/**
 * Pre-P5 Cost-Cap Calibration (P4.6 Wave A — test-only).
 *
 * Quantifies the false-abort vs false-skip rates of five candidate cost-cap
 * strategies against stored completed sessions, so the operator can pick a
 * data-derived default before any cost-cap enforcement is enabled.
 *
 * STRICTLY READ-ONLY:
 *   - No source modifications.
 *   - No DB writes; `analysis_sessions.total_cost_usd` snapshot before/after
 *     every replay is asserted equal.
 *   - No fresh agent invocations; replay only over stored sessions.
 *   - No artefacts written; the strategy comparison table is logged via
 *     console.log for operator decision.
 *
 * Acceptance:
 *   - At least one candidate strategy achieves false-abort rate ≤ 5%.
 *   - false-skip rate stays at 0% under every candidate strategy.
 *   - DB unchanged.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../db.js';
import { runTaskPlanner, type TaskPlan } from './task-planner.js';
import { runIncrementalComputation } from './incremental.js';
import { runCostGovernor, type CostGovernorReport } from './cost-governor.js';
import { runEscalationManager, type EscalationReport } from './escalation-manager.js';
import { computeQualityBudget } from '../quality-os/quality-budget.js';
import { detectContradictions } from '../quality-os/contradiction-engine.js';
import { detectCitationGaps } from '../quality-os/citation-enforcement.js';
import { computeCoverageReport } from '../quality-os/coverage-engine.js';
import { runDeterministicChairmanQuestions } from '../quality-os/chairman-questions-deterministic.js';
import { FLAG_ENV_VAR, FLAG_ENABLED_VALUE } from '../orchestrator-governance.js';

// =============================================================================
// Targets
// =============================================================================

const TARGET_TICKERS = ['KCHOL', 'THYAO', 'EREGL', 'ASELS'] as const;
const SESSIONS_PER_TICKER_CAP = 4;
const MIN_FLOOR_USD = 2.00;
const ACCEPTANCE_FALSE_ABORT_RATE = 0.05;  // ≤ 5%

interface CompletedSessionRow {
  id: string;
  ticker: string;
  status: string;
  total_cost_usd: number;
}

function listObservableSessions(): CompletedSessionRow[] {
  const placeholders = TARGET_TICKERS.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT id, ticker, status, total_cost_usd
       FROM analysis_sessions
      WHERE ticker IN (${placeholders})
        AND status IN ('completed', 'completed_with_warning')
      ORDER BY ticker ASC, started_at DESC`
  ).all(...TARGET_TICKERS) as CompletedSessionRow[];
  const byTicker = new Map<string, CompletedSessionRow[]>();
  for (const r of rows) {
    const list = byTicker.get(r.ticker) ?? [];
    if (list.length < SESSIONS_PER_TICKER_CAP) list.push(r);
    byTicker.set(r.ticker, list);
  }
  return Array.from(byTicker.values()).flat();
}

// =============================================================================
// Per-ticker cost distribution (uses ALL stored sessions, not just observed)
// =============================================================================

interface TickerStat { ticker: string; n: number; min: number; max: number; mean: number; p95: number; }

function computeTickerStats(): Map<string, TickerStat> {
  const placeholders = TARGET_TICKERS.map(() => '?').join(',');
  const rows = db.prepare(
    `SELECT ticker, total_cost_usd FROM analysis_sessions
      WHERE ticker IN (${placeholders})
        AND status IN ('completed', 'completed_with_warning')`
  ).all(...TARGET_TICKERS) as Array<{ ticker: string; total_cost_usd: number }>;
  const byTicker = new Map<string, number[]>();
  for (const r of rows) {
    const list = byTicker.get(r.ticker) ?? [];
    list.push(r.total_cost_usd);
    byTicker.set(r.ticker, list);
  }
  const out = new Map<string, TickerStat>();
  for (const [ticker, costs] of byTicker) {
    const sorted = costs.slice().sort((a, b) => a - b);
    const n = sorted.length;
    const min = sorted[0];
    const max = sorted[n - 1];
    const mean = costs.reduce((a, c) => a + c, 0) / n;
    // p95 index for small samples: ceil(0.95 * n) - 1, clamped.
    const p95Idx = Math.min(n - 1, Math.max(0, Math.ceil(0.95 * n) - 1));
    const p95 = sorted[p95Idx];
    out.set(ticker, { ticker, n, min, max, mean, p95 });
  }
  return out;
}

// =============================================================================
// Strategies
// =============================================================================

interface StrategyContext {
  row: CompletedSessionRow;
  tickerStats: Map<string, TickerStat>;
  planTotal: number;  // populated after a generous-cap planner bootstrap
}

interface StrategyDef {
  name: string;
  /** Returns the cap (USD) for a given session. Pure deterministic function. */
  resolveCap: (ctx: StrategyContext) => number;
}

const STRATEGIES: StrategyDef[] = [
  {
    name: 'default ($5)',
    resolveCap: () => 5.00,
  },
  {
    name: 'global $8',
    resolveCap: () => 8.00,
  },
  {
    name: 'per-ticker p95 + 20%',
    resolveCap: (ctx) => {
      const s = ctx.tickerStats.get(ctx.row.ticker);
      const p95 = s ? s.p95 : 5.00;
      return Math.max(p95 * 1.20, MIN_FLOOR_USD);
    },
  },
  {
    name: 'taskPlan × 1.5',
    resolveCap: (ctx) => Math.max(ctx.planTotal * 1.5, MIN_FLOOR_USD),
  },
  {
    name: 'hybrid (max of p95×1.20, plan×1.50, floor)',
    resolveCap: (ctx) => {
      const s = ctx.tickerStats.get(ctx.row.ticker);
      const p95 = s ? s.p95 : 5.00;
      return Math.max(p95 * 1.20, ctx.planTotal * 1.50, MIN_FLOOR_USD);
    },
  },
];

// =============================================================================
// Per-session × per-strategy evaluation (read-only)
// =============================================================================

interface SessionStrategyResult {
  session_id: string;
  ticker: string;
  runtime_cost_usd: number;
  cap_usd: number;
  governor_budget_status: string;
  governor_projected_cost_usd: number;
  governor_stop_reasons: string[];
  escalation_level: string;
  would_abort: boolean;
  planner_skipped_count: number;
  false_skip_hits: number;
}

interface StrategyAggregate {
  name: string;
  total_sessions: number;
  abort_count: number;
  false_abort_rate: number;
  false_skip_count: number;
  cap_min: number;
  cap_max: number;
  cap_mean: number;
}

async function evaluateSessionUnderStrategy(
  row: CompletedSessionRow,
  strategy: StrategyDef,
  tickerStats: Map<string, TickerStat>,
): Promise<SessionStrategyResult> {
  // Bootstrap pass — generous cap to get the planner's projected cost.
  const bootstrapPlan = await runTaskPlanner(row.id, {
    ticker: row.ticker,
    current_session_cost_usd: 0,
    budget_cap_usd: 1000,
  });
  const planTotal = bootstrapPlan.total_estimated_cost_usd;

  // Final cap derived from strategy.
  const cap = strategy.resolveCap({ row, tickerStats, planTotal });

  // Re-plan with the final cap (still at session-start semantics: current=0).
  const taskPlan: TaskPlan = await runTaskPlanner(row.id, {
    ticker: row.ticker,
    current_session_cost_usd: 0,
    budget_cap_usd: cap,
  });

  // Cold incremental.
  const computation = await runIncrementalComputation(row.id, taskPlan, {});

  // Cost governor at session-end semantics: current = actual session cost.
  const governor: CostGovernorReport = await runCostGovernor(row.id, taskPlan, {
    ticker: row.ticker,
    current_session_cost_usd: row.total_cost_usd,
    budget_cap_usd: cap,
    computation_plan: computation,
  });

  // Quality-os reads.
  const qualityBudget = computeQualityBudget(row.id);
  const contradictionReport = detectContradictions(row.id);
  const citationReport = detectCitationGaps(row.id);
  const coverageReport = computeCoverageReport(row.id);
  const chairmanReport = runDeterministicChairmanQuestions(row.id, row.ticker);

  // Escalation manager.
  const escalation: EscalationReport = await runEscalationManager(row.id, {
    task_plan: taskPlan,
    computation_plan: computation,
    cost_governor_report: governor,
    quality_budget: qualityBudget,
    contradiction_report: contradictionReport,
    citation_report: citationReport,
    coverage_report: coverageReport,
    chairman_report: chairmanReport,
  }, { ticker: row.ticker });

  // Would-abort = governor stops OR escalation aborts (matches Shadow Observation definition).
  const would_abort = escalation.escalation_level === 'abort'
    || governor.budget_status === 'exhausted'
    || governor.budget_status === 'over_budget'
    || governor.stop_reasons.length > 0;

  // False-skip = planner-skipped tasks the runtime ACTUALLY ran.
  const skippedKinds = Array.from(new Set(taskPlan.skipped_tasks.map((t) => t.kind)));
  let false_skip_hits = 0;
  for (const kind of skippedKinds) {
    const r = db.prepare(
      `SELECT 1 AS x FROM agent_runs WHERE session_id = ? AND agent_id = ? AND status = 'completed'`
    ).get(row.id, kind) as { x?: number } | undefined;
    if (r?.x) false_skip_hits++;
  }

  return {
    session_id: row.id,
    ticker: row.ticker,
    runtime_cost_usd: row.total_cost_usd,
    cap_usd: round4(cap),
    governor_budget_status: governor.budget_status,
    governor_projected_cost_usd: governor.projected_cost_usd,
    governor_stop_reasons: governor.stop_reasons.slice(),
    escalation_level: escalation.escalation_level,
    would_abort,
    planner_skipped_count: taskPlan.skipped_tasks.length,
    false_skip_hits,
  };
}

function round4(n: number): number { return Math.round(n * 10000) / 10000; }

function aggregate(name: string, results: SessionStrategyResult[]): StrategyAggregate {
  const n = results.length;
  const aborts = results.filter((r) => r.would_abort).length;
  const falseSkip = results.reduce((a, r) => a + r.false_skip_hits, 0);
  const caps = results.map((r) => r.cap_usd);
  return {
    name,
    total_sessions: n,
    abort_count: aborts,
    false_abort_rate: n > 0 ? aborts / n : 0,
    false_skip_count: falseSkip,
    cap_min: Math.min(...caps),
    cap_max: Math.max(...caps),
    cap_mean: round4(caps.reduce((a, c) => a + c, 0) / Math.max(1, n)),
  };
}

// =============================================================================
// Test suite
// =============================================================================

describe('cost-cap calibration — strategy comparison', () => {
  const targets = listObservableSessions();
  const tickerStats = computeTickerStats();
  const perStrategy = new Map<string, StrategyAggregate>();
  const dbSnapshots = new Map<string, number>();

  beforeAll(async () => {
    process.env[FLAG_ENV_VAR] = FLAG_ENABLED_VALUE;
    // Snapshot DB cost rows before the test runs anything.
    for (const row of targets) {
      const r = db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
        .get(row.id) as { total_cost_usd: number };
      dbSnapshots.set(row.id, r.total_cost_usd);
    }
    // Evaluate every strategy against every observed session.
    for (const strategy of STRATEGIES) {
      const results: SessionStrategyResult[] = [];
      for (const row of targets) {
        results.push(await evaluateSessionUnderStrategy(row, strategy, tickerStats));
      }
      perStrategy.set(strategy.name, aggregate(strategy.name, results));
      // Persist per-session detail too — used by the printer below.
      perStrategyDetail.set(strategy.name, results);
    }
  });

  afterAll(() => {
    delete process.env[FLAG_ENV_VAR];
    if (targets.length === 0) return;
    // ----- Print summary tables (operator-facing) ---------------------------
    const lines: string[] = [];
    lines.push(`\n=== Cost-Cap Calibration: per-ticker cost distribution ===`);
    for (const [t, s] of tickerStats) {
      lines.push(
        `[${t}] n=${s.n} min=$${s.min.toFixed(4)} mean=$${s.mean.toFixed(4)} ` +
        `p95=$${s.p95.toFixed(4)} max=$${s.max.toFixed(4)}`,
      );
    }
    lines.push(`\n=== Strategy comparison (false-abort vs false-skip across ${targets.length} sessions) ===`);
    lines.push(
      `Strategy`.padEnd(50) +
      `false-abort`.padEnd(14) +
      `false-skip`.padEnd(13) +
      `cap range`.padEnd(20) +
      `cap mean`,
    );
    for (const a of perStrategy.values()) {
      lines.push(
        a.name.padEnd(50) +
        `${a.abort_count}/${a.total_sessions} (${(a.false_abort_rate * 100).toFixed(0)}%)`.padEnd(14) +
        `${a.false_skip_count}`.padEnd(13) +
        `$${a.cap_min.toFixed(2)}-$${a.cap_max.toFixed(2)}`.padEnd(20) +
        `$${a.cap_mean.toFixed(4)}`,
      );
    }

    // ----- Per-session detail (only for the BEST strategy + the default) ----
    const targetStrategies = ['default ($5)', 'hybrid (max of p95×1.20, plan×1.50, floor)'];
    for (const sname of targetStrategies) {
      const detail = perStrategyDetail.get(sname);
      if (!detail) continue;
      lines.push(`\n--- ${sname} per-session detail ---`);
      for (const r of detail) {
        lines.push(
          `[${r.ticker}] ${r.session_id.slice(0, 12)} ` +
          `runtime=$${r.runtime_cost_usd.toFixed(4)} cap=$${r.cap_usd.toFixed(4)} ` +
          `budget=${r.governor_budget_status} esc=${r.escalation_level} ` +
          `would_abort=${r.would_abort} skipped=${r.planner_skipped_count} ` +
          `false_skip=${r.false_skip_hits}`,
        );
      }
    }

    // ----- Recommended cap ---------------------------------------------------
    const recommended = pickRecommendedStrategy(perStrategy);
    lines.push(`\n=== RECOMMENDED STRATEGY ===`);
    lines.push(`name = "${recommended.name}"`);
    lines.push(`false_abort_rate = ${(recommended.false_abort_rate * 100).toFixed(1)}%`);
    lines.push(`cap range = $${recommended.cap_min.toFixed(2)} – $${recommended.cap_max.toFixed(2)} ` +
      `(mean $${recommended.cap_mean.toFixed(4)})`);
    lines.push(`cap_scope_recommendation = ${recommended.cap_min === recommended.cap_max ? 'global' : 'per_ticker'}`);
    console.log(lines.join('\n'));
  });

  // ---------------------------------------------------------------------------
  // Coverage
  // ---------------------------------------------------------------------------
  it.skipIf(targets.length === 0)('observes ≥ 1 stored completed session', () => {
    expect(targets.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // false-skip rate must remain 0% under EVERY strategy (calibration cannot
  // regress the safe-to-enforce skip layer).
  // ---------------------------------------------------------------------------
  for (const strategy of STRATEGIES) {
    it(`strategy "${strategy.name}" — false-skip rate stays at 0%`, () => {
      const a = perStrategy.get(strategy.name);
      expect(a).toBeDefined();
      expect(a!.false_skip_count).toBe(0);
    });
  }

  // ---------------------------------------------------------------------------
  // GO criterion: at least one strategy gets false-abort ≤ 5%.
  // ---------------------------------------------------------------------------
  it.skipIf(targets.length === 0)('at least one strategy achieves false-abort rate ≤ 5%', () => {
    const passing = Array.from(perStrategy.values())
      .filter((a) => a.false_abort_rate <= ACCEPTANCE_FALSE_ABORT_RATE);
    expect(passing.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Default ($5) is documented as 40% false-abort (sanity check that the
  // calibration replay reproduces the Shadow Observation finding).
  // ---------------------------------------------------------------------------
  it.skipIf(targets.length === 0)('default $5 cap reproduces ≥ 30% false-abort rate (shadow-observation baseline)', () => {
    const def = perStrategy.get('default ($5)')!;
    expect(def.false_abort_rate).toBeGreaterThanOrEqual(0.30);
  });

  // ---------------------------------------------------------------------------
  // DB unchanged across all replays (every strategy × every session).
  // ---------------------------------------------------------------------------
  it('DB total_cost_usd snapshot unchanged across all calibration replays', () => {
    for (const row of targets) {
      const before = dbSnapshots.get(row.id);
      const after = (db.prepare(`SELECT total_cost_usd FROM analysis_sessions WHERE id = ?`)
        .get(row.id) as { total_cost_usd: number }).total_cost_usd;
      expect(after).toBe(before);
    }
  });

  // ---------------------------------------------------------------------------
  // Recommended strategy structural invariants.
  // ---------------------------------------------------------------------------
  it.skipIf(targets.length === 0)('recommended strategy has false-abort ≤ 5% AND false-skip = 0', () => {
    const recommended = pickRecommendedStrategy(perStrategy);
    expect(recommended.false_abort_rate).toBeLessThanOrEqual(ACCEPTANCE_FALSE_ABORT_RATE);
    expect(recommended.false_skip_count).toBe(0);
  });
});

// =============================================================================
// Per-strategy detail storage (populated in beforeAll)
// =============================================================================

const perStrategyDetail = new Map<string, SessionStrategyResult[]>();

function pickRecommendedStrategy(per: Map<string, StrategyAggregate>): StrategyAggregate {
  // Prefer strategies that pass the acceptance target. Among those, pick the
  // one with the LOWEST mean cap (tightest meaningful guard).
  const passing = Array.from(per.values())
    .filter((a) => a.false_abort_rate <= ACCEPTANCE_FALSE_ABORT_RATE && a.false_skip_count === 0)
    .sort((a, b) => a.cap_mean - b.cap_mean);
  if (passing.length > 0) return passing[0];
  // Fall back: lowest false-abort rate.
  return Array.from(per.values()).sort((a, b) => a.false_abort_rate - b.false_abort_rate)[0];
}
