/**
 * QA checklist enforcement — types for the session-level addressal report.
 * Phase 6A observe-only: computed end-of-session from agent_runs + manifests,
 * persisted to analysis_sessions and agent_runs, never acted upon.
 *
 * Phase 6B (shadow-warn) surfaces escalation candidates in the dashboard.
 * Phase 6C (hard) wires escalation_flag=1 into the retry router and CEO
 * escalation path described in CLAUDE_MASTER_PROMPT.md §6.7.
 */

export const ADDRESSAL_ESCALATION_THRESHOLD = 0.7;

export type FindingAction = 'fixed' | 'acknowledged' | 'rejected';

export type AgentAddressalBreakdown = {
  agent_id: string;
  findings_raised: number;
  findings_addressed: number;
  action_counts: Record<FindingAction, number>;
  unaddressed_finding_ids: string[];
};

/**
 * Session-level roll-up. finding_count = all distinct finding_ids produced by
 * the session's agents (QA + any agent that raised findings downstream).
 * addressed_count = distinct finding_ids that appear in at least one
 * addressed_findings[].finding_id. Both sets are computed ACROSS agent
 * boundaries so QA findings raised in round N can be counted as addressed by
 * any revised agent in round N+1.
 */
export type AddressalReport = {
  session_id: string;
  ticker: string | null;
  finding_count: number;
  addressed_count: number;
  addressal_rate: number;
  action_counts: Record<FindingAction, number>;
  unaddressed_finding_ids: string[];
  by_agent: AgentAddressalBreakdown[];
  escalation_flag: boolean;
  generated_at: string;
};
