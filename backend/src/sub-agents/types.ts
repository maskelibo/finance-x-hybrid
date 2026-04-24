/**
 * Sub-agent type definitions.
 *
 * Bounded worker graph — a parent agent (e.g. financial_analysis) fans out to
 * a fixed set of sub-agents that return structured JSON, and the parent
 * compiles their outputs into its own final output. Sub-agents never spawn
 * further sub-agents — depth is 1, by design.
 *
 * Tiers:
 *   - llm            — Claude call, prompt read from agents/<parent>/sub_agents/<id>.md
 *   - deterministic  — Python module called via child_process; no LLM
 *   - hybrid         — deterministic pre-compute then LLM narration
 *
 * Isolation:
 *   - isolated_context=false → sub-agent sees full parent context
 *   - isolated_context=true  → only ticker + fact_pack, to keep prompt size small
 */

export type SubAgentTier = 'llm' | 'deterministic' | 'hybrid';

export type SubAgentModel = 'sonnet' | 'haiku';

export type SubAgentDef = {
  id: string;
  parent_agent_id: string;
  display_name: string;
  description: string;
  tier: SubAgentTier;
  model?: SubAgentModel;                 // required when tier is 'llm' or 'hybrid'
  python_module?: string;                // required when tier is 'deterministic' or 'hybrid'
  timeout_ms: number;
  isolated_context: boolean;
  output_schema_path: string;            // relative to PROJECT_ROOT, e.g. schemas/sub-agents/<id>.json
  parallelizable: boolean;
  retry_max: number;
};

export type SubAgentTask = {
  sub_agent_id: string;
  parent_session_id: string;
  parent_run_id: string;
  parent_agent_id: string;
  task_description: string;
  task_inputs: Record<string, unknown>;
};

export type SubAgentStatus =
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'schema_invalid';

export type SubAgentResult = {
  sub_agent_id: string;
  status: SubAgentStatus;
  output: string;
  output_parsed: unknown;
  duration_ms: number;
  tokens_used: number;
  cost_usd: number;
  error?: string;
  schema_validation_errors?: string[];
};

export type SubAgentExecutionStrategy = 'parallel' | 'sequential' | 'hybrid';

export type SubAgentExecutionPlan = {
  parent_agent_id: string;
  sub_agents: SubAgentDef[];
  execution_strategy: SubAgentExecutionStrategy;
  fallback_to_legacy: boolean;
};
