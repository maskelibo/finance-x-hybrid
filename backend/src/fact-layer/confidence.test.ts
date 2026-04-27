import { describe, it, expect } from 'vitest';
import {
  computeFactConfidence,
  mapSourceTypeToPlan,
  type FactConfidenceInputs,
} from './confidence.js';
import type { FactSource } from './store.js';

// =============================================================================
// Helpers
// =============================================================================

function src(overrides: Partial<FactSource> = {}): FactSource {
  return {
    type: 'agent',
    agent_id: 'parse_standardization',
    extracted_at: '2026-04-27T10:00:00.000Z',
    freshness_days: 5,
    ...overrides,
  };
}

// =============================================================================
// Source taxonomy mapping
// =============================================================================

describe('mapSourceTypeToPlan', () => {
  it('maps document → direct_disclosure', () => {
    const m = mapSourceTypeToPlan({ type: 'document' });
    expect(m.plan_type).toBe('direct_disclosure');
    expect(m.mapping_reason).toContain('document');
  });

  it('maps user → direct_disclosure (deliberate override)', () => {
    const m = mapSourceTypeToPlan({ type: 'user' });
    expect(m.plan_type).toBe('direct_disclosure');
    expect(m.mapping_reason).toContain('user');
  });

  it('maps computed → computed', () => {
    const m = mapSourceTypeToPlan({ type: 'computed' });
    expect(m.plan_type).toBe('computed');
  });

  it('maps agent + document-backed agent_id → direct_disclosure', () => {
    const m = mapSourceTypeToPlan({ type: 'agent', agent_id: 'parse_standardization' });
    expect(m.plan_type).toBe('direct_disclosure');
    expect(m.mapping_reason).toContain('parse_standardization');
  });

  it('maps agent + computational agent_id → computed', () => {
    const m = mapSourceTypeToPlan({ type: 'agent', agent_id: 'financial_analysis' });
    expect(m.plan_type).toBe('computed');
  });

  it('falls back to inferred for unknown agent_id (conservative)', () => {
    const m = mapSourceTypeToPlan({ type: 'agent', agent_id: 'mystery_agent' });
    expect(m.plan_type).toBe('inferred');
    expect(m.mapping_reason).toContain('conservative');
  });

  it('falls back to inferred when type=agent without agent_id', () => {
    const m = mapSourceTypeToPlan({ type: 'agent' });
    expect(m.plan_type).toBe('inferred');
    expect(m.mapping_reason).toContain('conservative');
  });

  it('handles unrecognised FactSource.type values defensively', () => {
    const m = mapSourceTypeToPlan({ type: 'mystery_future_type' as FactSource['type'] });
    expect(m.plan_type).toBe('inferred');
    expect(m.mapping_reason).toContain('conservative');
  });
});

// =============================================================================
// Determinism + scoring math
// =============================================================================

describe('computeFactConfidence — determinism', () => {
  it('produces identical output for identical inputs (pure)', () => {
    const inputs: FactConfidenceInputs = {
      sources: [src({ type: 'document', freshness_days: 10 })],
      has_conflict: false,
      computation_complexity: 0,
      cross_agent_agreement_count: 1,
    };
    const a = computeFactConfidence(inputs);
    const b = computeFactConfidence(inputs);
    expect(a).toEqual(b);
  });

  it('does not mutate input object or arrays', () => {
    const sources = [src({ freshness_days: 10 })] as const;
    const before = JSON.stringify({ sources });
    computeFactConfidence({ sources });
    expect(JSON.stringify({ sources })).toBe(before);
  });
});

// =============================================================================
// Tier boundaries
// =============================================================================

describe('computeFactConfidence — tier boundaries', () => {
  it('CERTAIN: direct_disclosure + multi-source corroboration (≥0.9)', () => {
    const r = computeFactConfidence({
      sources: [
        src({ type: 'document', freshness_days: 5 }),
        src({ type: 'document', freshness_days: 5 }),
        src({ type: 'document', freshness_days: 5 }),
      ],
      has_conflict: false,
      computation_complexity: 0,
      cross_agent_agreement_count: 1,
    });
    expect(r.score).toBeGreaterThanOrEqual(0.9);
    expect(r.tier).toBe('CERTAIN');
  });

  it('HIGH: direct_disclosure with complexity 3 lands in 0.75..<0.9 band', () => {
    // 1.0 source - 0.15 complexity = 0.85 → HIGH
    const r = computeFactConfidence({
      sources: [src({ type: 'document', freshness_days: 10 })],
      computation_complexity: 3,
    });
    expect(r.score).toBeGreaterThanOrEqual(0.75);
    expect(r.score).toBeLessThan(0.9);
    expect(r.tier).toBe('HIGH');
  });

  it('MEDIUM: computed-tier source with mild penalty lands in 0.55..<0.75 band', () => {
    // computed=0.9; -0.10 freshness (>90d) - 0.20 conflict_material = 0.60 → MEDIUM
    const r = computeFactConfidence({
      sources: [src({ type: 'computed', freshness_days: 120 })],
      has_conflict: true,
      conflict_severity: 'material',
    });
    expect(r.score).toBeGreaterThanOrEqual(0.55);
    expect(r.score).toBeLessThan(0.75);
    expect(r.tier).toBe('MEDIUM');
  });

  it('LOW: inferred source (0.35) collapses to LOW or below', () => {
    const r = computeFactConfidence({
      sources: [src({ type: 'agent', agent_id: 'sentiment_x', freshness_days: 5 })],
    });
    expect(r.score).toBeLessThan(0.55);
    expect(['LOW', 'SPECULATIVE']).toContain(r.tier);
  });

  it('SPECULATIVE: inferred + critical conflict + complexity 3', () => {
    const r = computeFactConfidence({
      sources: [src({ type: 'agent', agent_id: 'sentiment_x', freshness_days: 200 })],
      has_conflict: true,
      conflict_severity: 'critical',
      computation_complexity: 3,
    });
    expect(r.score).toBeLessThan(0.3);
    expect(r.tier).toBe('SPECULATIVE');
  });

  it('clamps score to [0, 1]', () => {
    const big = computeFactConfidence({
      sources: Array.from({ length: 20 }, () => src({ type: 'document', freshness_days: 1 })),
      cross_agent_agreement_count: 50,
    });
    expect(big.score).toBeLessThanOrEqual(1);
    expect(big.score).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// Freshness decay boundaries
// =============================================================================

describe('computeFactConfidence — freshness decay', () => {
  it('avg_days ≤ 30 → no penalty', () => {
    const r = computeFactConfidence({ sources: [src({ type: 'document', freshness_days: 30 })] });
    expect(r.components.freshness_penalty).toBe(0);
  });

  it('avg_days 31-90 → 0.05 penalty', () => {
    const r = computeFactConfidence({ sources: [src({ type: 'document', freshness_days: 60 })] });
    expect(r.components.freshness_penalty).toBeCloseTo(0.05, 5);
  });

  it('avg_days > 90 → 0.10 penalty', () => {
    const r = computeFactConfidence({ sources: [src({ type: 'document', freshness_days: 200 })] });
    expect(r.components.freshness_penalty).toBeCloseTo(0.10, 5);
  });

  it('uses average across sources, not max', () => {
    const r = computeFactConfidence({
      sources: [
        src({ type: 'document', freshness_days: 10 }),
        src({ type: 'document', freshness_days: 200 }),
      ],
    });
    // avg = 105 → > 90 → 0.10
    expect(r.components.freshness_penalty).toBeCloseTo(0.10, 5);
  });
});

// =============================================================================
// Missing / null input safety + decay reasons
// =============================================================================

describe('computeFactConfidence — missing / null input safety', () => {
  it('empty sources collapses to inferred quality + decay reason', () => {
    const r = computeFactConfidence({ sources: [] });
    expect(r.components.source_quality).toBeCloseTo(0.35, 5);
    expect(r.decay_reasons.some((s) => s.includes('no_sources_supplied'))).toBe(true);
    expect(r.tier).toBe('LOW'); // 0.35 → LOW band
  });

  it('records decay reason when sources lack freshness_days', () => {
    const broken = src({ type: 'document', freshness_days: NaN as unknown as number });
    const r = computeFactConfidence({ sources: [broken] });
    expect(r.components.freshness_penalty).toBe(0);
    expect(r.decay_reasons.some((s) => s.includes('freshness'))).toBe(true);
  });

  it('records decay reason when has_conflict=true but severity missing', () => {
    const r = computeFactConfidence({
      sources: [src({ type: 'document', freshness_days: 5 })],
      has_conflict: true,
    });
    expect(r.components.conflict_penalty).toBeCloseTo(0.05, 5); // minor default
    expect(r.decay_reasons.some((s) => s.includes('conflict_severity'))).toBe(true);
  });

  it('clamps out-of-range computation_complexity and records decay', () => {
    const r = computeFactConfidence({
      sources: [src({ type: 'document', freshness_days: 5 })],
      // @ts-expect-error — deliberately invalid value to verify clamp
      computation_complexity: 7,
    });
    expect(r.components.complexity_penalty).toBeLessThanOrEqual(0.15);
    expect(r.decay_reasons.some((s) => s.includes('computation_complexity'))).toBe(true);
  });

  it('defaults agreement_count to 1 when invalid; records decay', () => {
    const r = computeFactConfidence({
      sources: [src({ type: 'document', freshness_days: 5 })],
      cross_agent_agreement_count: -3,
    });
    expect(r.components.agreement_bonus).toBe(0);
    expect(r.decay_reasons.some((s) => s.includes('cross_agent_agreement_count'))).toBe(true);
  });

  it('produces well-formed FactConfidence even with all-missing inputs', () => {
    const r = computeFactConfidence({ sources: [] });
    expect(typeof r.score).toBe('number');
    expect(r.tier).toBeDefined();
    expect(r.components).toBeDefined();
    expect(Array.isArray(r.source_mappings)).toBe(true);
    expect(Array.isArray(r.decay_reasons)).toBe(true);
    expect(typeof r.explanation).toBe('string');
  });
});

// =============================================================================
// Component breakdown surfaces
// =============================================================================

describe('computeFactConfidence — component breakdown', () => {
  it('exposes all six components', () => {
    const r = computeFactConfidence({ sources: [src({ type: 'document', freshness_days: 5 })] });
    expect(r.components).toMatchObject({
      source_quality: expect.any(Number),
      source_count_bonus: expect.any(Number),
      freshness_penalty: expect.any(Number),
      conflict_penalty: expect.any(Number),
      complexity_penalty: expect.any(Number),
      agreement_bonus: expect.any(Number),
    });
  });

  it('caps source_count_bonus at 0.15', () => {
    const r = computeFactConfidence({
      sources: Array.from({ length: 10 }, () => src({ type: 'document', freshness_days: 5 })),
    });
    expect(r.components.source_count_bonus).toBeCloseTo(0.15, 5);
  });

  it('caps agreement_bonus at 0.10', () => {
    const r = computeFactConfidence({
      sources: [src({ type: 'document', freshness_days: 5 })],
      cross_agent_agreement_count: 100,
    });
    expect(r.components.agreement_bonus).toBeCloseTo(0.10, 5);
  });

  it('explanation includes tier, score, source count and conflict info', () => {
    const r = computeFactConfidence({
      sources: [src({ type: 'document', freshness_days: 5 })],
      has_conflict: true,
      conflict_severity: 'material',
      computation_complexity: 2,
      cross_agent_agreement_count: 3,
    });
    expect(r.explanation).toContain('%');
    expect(r.explanation).toMatch(/sources?/);
    expect(r.explanation).toContain('conflict');
    expect(r.explanation).toContain('complexity');
    expect(r.explanation).toContain('agree');
  });

  it('source_mappings has one entry per source with plan type + reason', () => {
    const r = computeFactConfidence({
      sources: [
        src({ type: 'document' }),
        src({ type: 'agent', agent_id: 'financial_analysis' }),
        src({ type: 'agent', agent_id: 'mystery' }),
      ],
    });
    expect(r.source_mappings.length).toBe(3);
    expect(r.source_mappings[0].plan_type).toBe('direct_disclosure');
    expect(r.source_mappings[1].plan_type).toBe('computed');
    expect(r.source_mappings[2].plan_type).toBe('inferred');
    for (const m of r.source_mappings) {
      expect(m.mapping_reason.length).toBeGreaterThan(0);
    }
  });
});
