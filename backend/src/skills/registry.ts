import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { PROJECT_ROOT } from '../config.js';

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

export function getTriggeredSkills(agentId: string, context: Record<string, unknown>): SkillMeta[] {
  const agentSkills = getSkillsForAgent(agentId);
  const contextText = JSON.stringify(context).toLowerCase();
  return agentSkills.filter(skill =>
    skill.triggers.some(trigger => contextText.includes(trigger.toLowerCase())),
  );
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
