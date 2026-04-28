/**
 * P9 Wave 1 — Activation Governor entry point.
 *
 * planActivation() is the single entry: classifies the session, scores
 * complexity, selects the profile, caches the plan in-memory keyed by
 * sessionId, and returns it. Default OFF behind ACTIVATION_GOVERNOR_ENABLED='true'.
 *
 * Wave 1 deliberately omits:
 *   - DB persistence (no `activation_plans` table, no `analysis_sessions`
 *     ALTER). Plans live only in-process; a future Wave 2 can add the
 *     migration and persistence layer.
 *   - Orchestrator integration (forbidden file touch). Wave 2.
 *   - Sub-agent dispatcher integration. Wave 2.
 *   - Dashboard badge. Wave 2.
 *
 * The shouldRunAgent / shouldRunSubAgent / shouldActivate predicates
 * read from the in-memory cache. With the gate OFF or no plan present,
 * they default-allow (preserve current behaviour).
 */

import { scoreComplexity, type ComplexityScore } from './complexity-scorer.js';
import {
  classifySession,
  selectProfile,
  type ActivationPlan,
  type SessionClass,
} from './profile-selector.js';

const _planCache: Map<string, ActivationPlan> = new Map();

export function isActivationGovernorEnabled(): boolean {
  return process.env.ACTIVATION_GOVERNOR_ENABLED === 'true';
}

export function isActivationGovernorShadow(): boolean {
  return process.env.ACTIVATION_GOVERNOR_SHADOW === 'true';
}

export interface PlanActivationInputs {
  sessionId: string;
  ticker: string;
  mode: string;
  userRequest?: string;
}

export function planActivation(input: PlanActivationInputs): ActivationPlan | null {
  if (!isActivationGovernorEnabled()) return null;
  const sessionClass: SessionClass = classifySession(input.userRequest, input.ticker);
  const complexity: ComplexityScore = scoreComplexity(input.ticker);
  const plan = selectProfile(complexity, input.mode, sessionClass);
  _planCache.set(input.sessionId, plan);
  return plan;
}

export function getActivationPlan(sessionId: string): ActivationPlan | null {
  return _planCache.get(sessionId) ?? null;
}

export function shouldRunAgent(sessionId: string, agentId: string): boolean {
  const plan = _planCache.get(sessionId);
  if (!plan) return true;
  return !plan.skipped_agents.includes(agentId);
}

export function shouldRunSubAgent(sessionId: string, subAgentId: string): boolean {
  const plan = _planCache.get(sessionId);
  if (!plan) return true;
  if (plan.skipped_sub_agents.includes('*')) return false;
  return !plan.skipped_sub_agents.includes(subAgentId);
}

export type ActivationFeature =
  | 'truth_arbitration'
  | 'citation_enforcement'
  | 'contradiction_full_scan'
  | 'chairman_questions'
  | 'full_quality_governor'
  | 'deep_shadow_compare';

export function shouldActivate(sessionId: string, feature: ActivationFeature): boolean {
  const plan = _planCache.get(sessionId);
  if (!plan) return true;
  switch (feature) {
    case 'truth_arbitration':
      return plan.enable_truth_arbitration;
    case 'citation_enforcement':
      return plan.enable_citation_enforcement;
    case 'contradiction_full_scan':
      return plan.enable_contradiction_full_scan;
    case 'chairman_questions':
      return plan.enable_chairman_questions;
    case 'full_quality_governor':
      return plan.enable_full_quality_governor;
    case 'deep_shadow_compare':
      return plan.enable_deep_shadow_compare;
  }
}

export function _resetActivationCacheForTests(): void {
  _planCache.clear();
}

export type { ActivationPlan, ComplexityScore, SessionClass };
