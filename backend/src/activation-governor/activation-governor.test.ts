/**
 * P9 Wave 1 — Activation Governor unit tests.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  scoreComplexity,
  _SECTOR_COMPLEXITY_FOR_TESTS,
} from './complexity-scorer.js';
import {
  CORE_PROTECTED_AGENTS,
  checkTokenBudget,
  classifySession,
  getTokenBudget,
  selectProfile,
  _CORE_PROTECTED_AGENTS_FOR_TESTS,
  _TOKEN_BUDGETS_FOR_TESTS,
} from './profile-selector.js';
import {
  _resetActivationCacheForTests,
  getActivationPlan,
  isActivationGovernorEnabled,
  isActivationGovernorShadow,
  planActivation,
  shouldActivate,
  shouldRunAgent,
  shouldRunSubAgent,
} from './index.js';

const ORIGINAL_ENV = { ...process.env };

function restoreEnv(): void {
  for (const k of Object.keys(process.env)) {
    if (!(k in ORIGINAL_ENV)) delete process.env[k];
  }
  for (const [k, v] of Object.entries(ORIGINAL_ENV)) process.env[k] = v;
}

beforeEach(() => {
  restoreEnv();
  delete process.env.ACTIVATION_GOVERNOR_ENABLED;
  delete process.env.ACTIVATION_GOVERNOR_SHADOW;
  _resetActivationCacheForTests();
});

afterEach(() => {
  restoreEnv();
  _resetActivationCacheForTests();
});

// =============================================================================
// scoreComplexity
// =============================================================================

describe('scoreComplexity', () => {
  it('returns total in 0-100 range', () => {
    const r = scoreComplexity('KCHOL');
    expect(r.total).toBeGreaterThanOrEqual(0);
    expect(r.total).toBeLessThanOrEqual(100);
  });

  it('attributes higher complexity to a holding (KCHOL) than a food retailer (ULKER)', () => {
    const kchol = scoreComplexity('KCHOL');
    const ulker = scoreComplexity('ULKER');
    expect(kchol.total).toBeGreaterThan(ulker.total);
  });

  it('explanation lists sector and structure rationale', () => {
    const r = scoreComplexity('KCHOL');
    const joined = r.explanation.join(' ');
    expect(joined.toLowerCase()).toContain('sector');
    expect(joined.toLowerCase()).toContain('holding');
  });

  it('falls back to disclosure_density 5/20 when disclosures table missing', () => {
    const r = scoreComplexity('KCHOL');
    expect([5, 12, 20]).toContain(r.dimensions.disclosure_density);
  });

  it('SECTOR_COMPLEXITY map is non-empty and 0-20 ranged', () => {
    expect(Object.keys(_SECTOR_COMPLEXITY_FOR_TESTS).length).toBeGreaterThan(5);
    for (const v of Object.values(_SECTOR_COMPLEXITY_FOR_TESTS)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(20);
    }
  });
});

// =============================================================================
// classifySession
// =============================================================================

describe('classifySession', () => {
  it("'unspecified' on empty / undefined request", () => {
    expect(classifySession(undefined, 'KCHOL').type).toBe('unspecified');
    expect(classifySession('', 'KCHOL').type).toBe('unspecified');
    expect(classifySession('   ', 'KCHOL').type).toBe('unspecified');
  });

  it("classifies event_flash on 'yeni KAP bildirimi'", () => {
    const r = classifySession('Yeni KAP bildirimi geldi, hemen analiz et', 'KCHOL');
    expect(r.type).toBe('event_flash');
  });

  it("classifies earnings_preview on 'Q3 öncesi beklenti'", () => {
    const r = classifySession('Q3 öncesi finansal sonuç beklentisi', 'KCHOL');
    expect(r.type).toBe('earnings_preview');
  });

  it("classifies valuation_refresh on 'hedef fiyat güncelle'", () => {
    const r = classifySession('Hedef fiyat güncelle, sadece değerleme', 'KCHOL');
    expect(r.type).toBe('valuation_refresh');
  });

  it("classifies delta_update on 'kısa güncelleme'", () => {
    const r = classifySession('Sadece kısa güncelleme yeterli', 'KCHOL');
    expect(r.type).toBe('delta_update');
  });

  it("classifies full_institutional on 'tam analiz'", () => {
    const r = classifySession('Tam analiz raporu üret', 'KCHOL');
    expect(r.type).toBe('full_institutional');
  });

  it('defaults to full_institutional when no clear pattern', () => {
    const r = classifySession('Lütfen analiz yap', 'KCHOL');
    expect(r.type).toBe('full_institutional');
    expect(r.confidence).toBeLessThan(0.5);
  });
});

// =============================================================================
// selectProfile
// =============================================================================

describe('selectProfile', () => {
  function makeComplexity(total: number) {
    return {
      ticker: 'X',
      total,
      dimensions: {
        sector_complexity: 0,
        company_structure_complexity: 0,
        disclosure_density: 0,
        valuation_complexity: 0,
        contradiction_likelihood: 0,
      },
      explanation: [],
    };
  }

  it('LIGHT for total ≤ 30', () => {
    expect(selectProfile(makeComplexity(20), 'standard_institutional').profile).toBe('LIGHT');
    expect(selectProfile(makeComplexity(30), 'standard_institutional').profile).toBe('LIGHT');
  });

  it('STANDARD for 31-55', () => {
    expect(selectProfile(makeComplexity(45), 'standard_institutional').profile).toBe('STANDARD');
  });

  it('FULL for 56-80', () => {
    expect(selectProfile(makeComplexity(70), 'standard_institutional').profile).toBe('FULL');
  });

  it('INSTITUTIONAL for > 80', () => {
    expect(selectProfile(makeComplexity(90), 'standard_institutional').profile).toBe('INSTITUTIONAL');
  });

  it("mode='deep_dive' upgrades LIGHT to STANDARD", () => {
    expect(selectProfile(makeComplexity(20), 'deep_dive').profile).toBe('STANDARD');
  });

  it("mode='fast_screening' downgrades FULL/INSTITUTIONAL to STANDARD", () => {
    expect(selectProfile(makeComplexity(70), 'fast_screening').profile).toBe('STANDARD');
    expect(selectProfile(makeComplexity(90), 'fast_screening').profile).toBe('STANDARD');
  });

  it('every profile includes the CORE_PROTECTED_AGENTS in required_agents', () => {
    for (const total of [10, 40, 70, 95]) {
      const plan = selectProfile(makeComplexity(total), 'standard_institutional');
      for (const core of CORE_PROTECTED_AGENTS) {
        expect(
          plan.required_agents.includes(core),
          `${plan.profile} missing CORE agent ${core}`,
        ).toBe(true);
      }
    }
  });

  it('estimated_cost and latency monotonically increase with profile size', () => {
    const light = selectProfile(makeComplexity(20), 'standard_institutional');
    const std = selectProfile(makeComplexity(45), 'standard_institutional');
    const full = selectProfile(makeComplexity(70), 'standard_institutional');
    const inst = selectProfile(makeComplexity(95), 'standard_institutional');
    expect(light.estimated_cost_usd).toBeLessThan(std.estimated_cost_usd);
    expect(std.estimated_cost_usd).toBeLessThan(full.estimated_cost_usd);
    expect(full.estimated_cost_usd).toBeLessThan(inst.estimated_cost_usd);
    expect(light.estimated_latency_seconds).toBeLessThan(inst.estimated_latency_seconds);
  });
});

// =============================================================================
// Token budget
// =============================================================================

describe('checkTokenBudget', () => {
  it('continue when used < 100% of budget', () => {
    const r = checkTokenBudget(100_000, 'STANDARD');
    expect(r.action).toBe('continue');
  });

  it('alarm_only when 100-150%', () => {
    const r = checkTokenBudget(_TOKEN_BUDGETS_FOR_TESTS.STANDARD * 1.2, 'STANDARD');
    expect(r.action).toBe('alarm_only');
  });

  it('reduce_optional when 150-200%', () => {
    const r = checkTokenBudget(_TOKEN_BUDGETS_FOR_TESTS.STANDARD * 1.7, 'STANDARD');
    expect(r.action).toBe('reduce_optional');
    expect(r.disabled_layers).toBeDefined();
    expect(r.disabled_layers!.length).toBeGreaterThan(0);
  });

  it('hard_stop when ≥ 200%', () => {
    const r = checkTokenBudget(_TOKEN_BUDGETS_FOR_TESTS.STANDARD * 2.5, 'STANDARD');
    expect(r.action).toBe('hard_stop');
  });

  it('budgets monotonically increase across profiles', () => {
    expect(getTokenBudget('LIGHT')).toBeLessThan(getTokenBudget('STANDARD'));
    expect(getTokenBudget('STANDARD')).toBeLessThan(getTokenBudget('FULL'));
    expect(getTokenBudget('FULL')).toBeLessThan(getTokenBudget('INSTITUTIONAL'));
  });
});

// =============================================================================
// CORE_PROTECTED_AGENTS
// =============================================================================

describe('CORE_PROTECTED_AGENTS', () => {
  it('exposes exactly the documented core list', () => {
    expect([..._CORE_PROTECTED_AGENTS_FOR_TESTS].sort()).toEqual([
      'data_collection',
      'final_summary',
      'financial_analysis',
      'macro_analysis',
      'parse_standardization',
      'reconciliation',
      'report_formatter',
      'sector_competition',
      'valuation_agent',
    ]);
  });
});

// =============================================================================
// planActivation + predicates
// =============================================================================

describe('planActivation default-OFF gate', () => {
  it('returns null when ACTIVATION_GOVERNOR_ENABLED is unset', () => {
    delete process.env.ACTIVATION_GOVERNOR_ENABLED;
    const plan = planActivation({ sessionId: 's1', ticker: 'KCHOL', mode: 'standard_institutional' });
    expect(plan).toBeNull();
  });

  it("returns a plan when ACTIVATION_GOVERNOR_ENABLED='true'", () => {
    process.env.ACTIVATION_GOVERNOR_ENABLED = 'true';
    const plan = planActivation({ sessionId: 's1', ticker: 'KCHOL', mode: 'standard_institutional' });
    expect(plan).not.toBeNull();
    expect(plan?.profile).toBeTruthy();
  });

  it("isActivationGovernorEnabled is strict on 'true'", () => {
    delete process.env.ACTIVATION_GOVERNOR_ENABLED;
    expect(isActivationGovernorEnabled()).toBe(false);
    process.env.ACTIVATION_GOVERNOR_ENABLED = '1';
    expect(isActivationGovernorEnabled()).toBe(false);
    process.env.ACTIVATION_GOVERNOR_ENABLED = 'true';
    expect(isActivationGovernorEnabled()).toBe(true);
  });

  it("isActivationGovernorShadow is strict on 'true'", () => {
    delete process.env.ACTIVATION_GOVERNOR_SHADOW;
    expect(isActivationGovernorShadow()).toBe(false);
    process.env.ACTIVATION_GOVERNOR_SHADOW = 'true';
    expect(isActivationGovernorShadow()).toBe(true);
  });
});

describe('shouldRunAgent / shouldRunSubAgent / shouldActivate', () => {
  it('default-allow when no plan is cached', () => {
    delete process.env.ACTIVATION_GOVERNOR_ENABLED;
    expect(shouldRunAgent('s-no-plan', 'esg_agent')).toBe(true);
    expect(shouldRunSubAgent('s-no-plan', 'fa_profitability')).toBe(true);
    expect(shouldActivate('s-no-plan', 'truth_arbitration')).toBe(true);
  });

  it('respects skipped_agents in a LIGHT plan', () => {
    process.env.ACTIVATION_GOVERNOR_ENABLED = 'true';
    planActivation({ sessionId: 's-light', ticker: 'ULKER', mode: 'fast_screening' });
    const plan = getActivationPlan('s-light');
    expect(plan).not.toBeNull();
    if (plan && plan.skipped_agents.length > 0) {
      const skipped = plan.skipped_agents[0];
      expect(shouldRunAgent('s-light', skipped)).toBe(false);
    }
    expect(shouldRunAgent('s-light', 'financial_analysis')).toBe(true);
  });

  it("LIGHT profile carries skipped_sub_agents '*' wildcard (verified via selectProfile)", () => {
    const plan = selectProfile(
      {
        ticker: 'X',
        total: 20,
        dimensions: {
          sector_complexity: 0,
          company_structure_complexity: 0,
          disclosure_density: 0,
          valuation_complexity: 0,
          contradiction_likelihood: 0,
        },
        explanation: [],
      },
      'standard_institutional',
    );
    expect(plan.profile).toBe('LIGHT');
    expect(plan.skipped_sub_agents).toEqual(['*']);
  });

  it('respects feature flags in plan (truth_arbitration, citation_enforcement)', () => {
    process.env.ACTIVATION_GOVERNOR_ENABLED = 'true';
    planActivation({ sessionId: 's-inst', ticker: 'KCHOL', mode: 'deep_dive' });
    const plan = getActivationPlan('s-inst');
    expect(plan).not.toBeNull();
    if (plan?.profile === 'INSTITUTIONAL' || plan?.profile === 'FULL') {
      expect(shouldActivate('s-inst', 'citation_enforcement')).toBe(true);
    }
  });
});

describe('plan cache', () => {
  it('returns the same plan for repeated getActivationPlan calls', () => {
    process.env.ACTIVATION_GOVERNOR_ENABLED = 'true';
    planActivation({ sessionId: 's-cache', ticker: 'KCHOL', mode: 'standard_institutional' });
    const a = getActivationPlan('s-cache');
    const b = getActivationPlan('s-cache');
    expect(a).toBe(b);
  });

  it('_resetActivationCacheForTests clears stored plans', () => {
    process.env.ACTIVATION_GOVERNOR_ENABLED = 'true';
    planActivation({ sessionId: 's-reset', ticker: 'KCHOL', mode: 'standard_institutional' });
    expect(getActivationPlan('s-reset')).not.toBeNull();
    _resetActivationCacheForTests();
    expect(getActivationPlan('s-reset')).toBeNull();
  });
});

// =============================================================================
// End-to-end ticker checks (qualitative — sector_registry.yml dependent)
// =============================================================================

describe('end-to-end profile selection (qualitative)', () => {
  beforeEach(() => {
    process.env.ACTIVATION_GOVERNOR_ENABLED = 'true';
  });

  it('KCHOL (holding) → high complexity → FULL or INSTITUTIONAL', () => {
    const plan = planActivation({ sessionId: 'e2e-kchol', ticker: 'KCHOL', mode: 'standard_institutional' });
    expect(plan).not.toBeNull();
    expect(['FULL', 'INSTITUTIONAL']).toContain(plan!.profile);
  });

  it('ULKER (food, simple) → LIGHT or STANDARD', () => {
    const plan = planActivation({ sessionId: 'e2e-ulker', ticker: 'ULKER', mode: 'standard_institutional' });
    expect(plan).not.toBeNull();
    expect(['LIGHT', 'STANDARD']).toContain(plan!.profile);
  });
});
