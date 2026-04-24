# Sub-Agent Output Schemas

One JSON Schema file per sub-agent, named `<sub_agent_id>.json`.

The dispatcher (`backend/src/sub-agents/dispatcher.ts`) reads the path from
each sub-agent's `output_schema_path` (declared in `config/sub_agents.yml`)
and applies a lightweight required-field check after JSON parse. When a
schema file is missing, validation is skipped — the sub-agent result is
marked `completed` on LLM/Python success alone.

Populated incrementally by Block S phases S2–S11. Empty in S1 (infrastructure-only).
