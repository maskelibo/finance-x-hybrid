/**
 * Sub-agent registry — loads definitions from config/sub_agents.yml and
 * resolves per-sub-agent system prompts from agents/<parent>/sub_agents/<id>.md.
 *
 * The registry is cached in-process; a long-running backend picks up YAML
 * edits only after restart. Prompt files are read fresh on each dispatch
 * so prompt iteration does not require restart.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { PROJECT_ROOT, AGENTS_ROOT } from '../config.js';
import type { SubAgentDef } from './types.js';

let _cache: SubAgentDef[] | null = null;

export function loadSubAgentRegistry(): SubAgentDef[] {
  if (_cache) return _cache;
  const yamlPath = path.join(PROJECT_ROOT, 'config', 'sub_agents.yml');
  if (!fs.existsSync(yamlPath)) {
    console.warn(`[sub-agents] config/sub_agents.yml not found at ${yamlPath} — registry empty`);
    _cache = [];
    return _cache;
  }
  try {
    const content = fs.readFileSync(yamlPath, 'utf8');
    const parsed = parseYaml(content) as { sub_agents?: SubAgentDef[] };
    _cache = parsed?.sub_agents ?? [];
  } catch (err) {
    console.error(`[sub-agents] Failed to parse sub_agents.yml:`, err);
    _cache = [];
  }
  return _cache;
}

export function getSubAgentsForParent(parentAgentId: string): SubAgentDef[] {
  return loadSubAgentRegistry().filter((s) => s.parent_agent_id === parentAgentId);
}

export function getSubAgentDef(subAgentId: string): SubAgentDef | null {
  return loadSubAgentRegistry().find((s) => s.id === subAgentId) ?? null;
}

export function loadSubAgentSystemPrompt(subAgentId: string): string {
  const def = getSubAgentDef(subAgentId);
  if (!def) throw new Error(`Sub-agent not found: ${subAgentId}`);
  const promptPath = path.join(
    AGENTS_ROOT,
    def.parent_agent_id,
    'sub_agents',
    `${subAgentId}.md`,
  );
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Sub-agent prompt missing: ${promptPath}`);
  }
  return fs.readFileSync(promptPath, 'utf8');
}

/** Test hook — clear the in-process cache so a subsequent load re-reads YAML. */
export function _clearSubAgentRegistryCache(): void {
  _cache = null;
}
