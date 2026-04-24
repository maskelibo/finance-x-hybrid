import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { PROJECT_ROOT } from '../config.js';
import { getSector } from '../sector-registry.js';

export type SkillMeta = {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  applies_to_agents: string[];
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  has_executable?: boolean;
  executable?: string;
};

let _cache: SkillMeta[] | null = null;

export function loadSkillsRegistry(): SkillMeta[] {
  if (_cache) return _cache;
  const yamlPath = path.join(PROJECT_ROOT, 'skills', '_registry.yml');
  if (!fs.existsSync(yamlPath)) {
    console.warn('[skills] _registry.yml not found');
    _cache = [];
    return _cache;
  }
  try {
    const content = fs.readFileSync(yamlPath, 'utf8');
    const parsed = yaml.parse(content);
    _cache = (parsed?.skills as SkillMeta[]) || [];
    return _cache!;
  } catch (err) {
    console.warn(`[skills] registry parse failed: ${err instanceof Error ? err.message : err}`);
    _cache = [];
    return _cache;
  }
}

export function getSkillsForAgent(agentId: string): SkillMeta[] {
  return loadSkillsRegistry().filter(s => s.applies_to_agents.includes(agentId));
}

// Map registry sector id → sector-X skill id. sector_registry.yml uses
// composite keys (defense_electronics, energy_distribution); collapse them
// to the closest skill playbook. Unmapped sectors fall through.
const SECTOR_TO_SKILL_ID: Record<string, string> = {
  aviation: 'sector-aviation',
  banking: 'sector-banking',
  steel: 'sector-steel',
  refinery: 'sector-refinery',
  holding: 'sector-holding',
  telecom: 'sector-telecom',
  retail: 'sector-retail',
  defense: 'sector-defense',
  defense_electronics: 'sector-defense',
  defense_industrial: 'sector-defense',
};

export function getTriggeredSkills(agentId: string, context: Record<string, unknown>): SkillMeta[] {
  const agentSkills = getSkillsForAgent(agentId);
  const contextText = JSON.stringify(context).toLowerCase();

  // B2 fix (2026-04-23): sector-X skills must be gated by the ticker's
  // authoritative sector from config/sector_registry.yml. Pre-fix, a steel
  // ticker (EREGL) session could trigger sector-aviation/banking/retail
  // just because an upstream agent output, a memory snippet, or a macro
  // note mentioned "aviation" or "banka" in passing. Non-sector skills
  // (IAS29, IFRS16, DCF, etc.) keep keyword-based triggering.
  const ticker = typeof context.ticker === 'string' ? context.ticker : null;
  const allowedSectorSkill = ticker
    ? SECTOR_TO_SKILL_ID[(getSector(ticker) || '').toLowerCase()] || null
    : null;

  return agentSkills.filter(skill => {
    const isSectorSkill = skill.id.startsWith('sector-');
    if (isSectorSkill) {
      // Only emit the sector skill that matches the ticker's registry sector.
      if (!allowedSectorSkill) return false; // ticker unknown or unmapped → skip all sector skills
      return skill.id === allowedSectorSkill;
    }
    // Non-sector: unchanged keyword-based trigger match.
    return skill.triggers.some(trigger => contextText.includes(trigger.toLowerCase()));
  });
}

export function readSkillContent(skillId: string, maxChars = 3000): string | null {
  const skillPath = path.join(PROJECT_ROOT, 'skills', skillId, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return null;
  const content = fs.readFileSync(skillPath, 'utf8');
  return content.length > maxChars
    ? content.slice(0, maxChars) + '\n\n[... skill içeriği kırpıldı, tam versiyon dosyada]'
    : content;
}

/**
 * Heading-based excerpt engine: always include Ne Zaman/Prosedür/Kurallar;
 * conditionally Örnek and Bilinen Tuzaklar; never Referanslar.
 */
export function readSkillExcerpt(skillId: string, context: Record<string, unknown>, maxChars = 2000): string | null {
  const skillPath = path.join(PROJECT_ROOT, 'skills', skillId, 'SKILL.md');
  if (!fs.existsSync(skillPath)) return null;
  const content = fs.readFileSync(skillPath, 'utf8');

  const frontMatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!frontMatterMatch) return content.slice(0, maxChars);
  const body = frontMatterMatch[2];

  const sections = extractSections(body);
  const selected: string[] = [];
  const contextText = JSON.stringify(context).toLowerCase();

  const alwaysInclude = ['ne zaman kullanılır', 'prosedür', 'kurallar'];
  for (const section of sections) {
    const h = section.heading.toLowerCase();
    if (alwaysInclude.some(k => h.includes(k))) {
      selected.push(`## ${section.heading}\n${section.content}`);
    }
  }

  if (/(example|örnek|test)/.test(contextText)) {
    const ex = sections.find(s => s.heading.toLowerCase().includes('örnek'));
    if (ex) selected.push(`## ${ex.heading}\n${ex.content}`);
  }

  if (/(error|fail|tuzak|bug)/.test(contextText)) {
    const pit = sections.find(s =>
      s.heading.toLowerCase().includes('tuzak') || s.heading.toLowerCase().includes('pitfall'),
    );
    if (pit) selected.push(`## ${pit.heading}\n${pit.content}`);
  }

  const excerpt = selected.join('\n\n');
  return excerpt.length > maxChars
    ? excerpt.slice(0, maxChars) + '\n\n[excerpt truncated — full skill in SKILL.md]'
    : excerpt;
}

function extractSections(body: string): Array<{ heading: string; content: string }> {
  const sections: Array<{ heading: string; content: string }> = [];
  const regex = /^##\s+(.+?)$/gm;
  const matches: Array<{ heading: string; index: number }> = [];

  let match;
  while ((match = regex.exec(body)) !== null) {
    matches.push({ heading: match[1].trim(), index: match.index });
  }

  for (let i = 0; i < matches.length; i++) {
    const startIdx = matches[i].index + matches[i].heading.length + 3;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : body.length;
    sections.push({
      heading: matches[i].heading,
      content: body.slice(startIdx, endIdx).trim(),
    });
  }

  return sections;
}

// Test-support: reset cache so unit tests can reload the registry mid-process.
export function _resetSkillRegistryCache(): void {
  _cache = null;
}
