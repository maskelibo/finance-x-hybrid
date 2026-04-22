#!/usr/bin/env tsx
/**
 * Memory Migration: pull legacy "## CEO Geri Bildirimi" blocks from memory.md
 * into structured lessons.jsonl, with dedup + issue_type classification.
 *
 * Non-destructive: memory.md is NOT modified. lessons.jsonl receives appends only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_ROOT = path.resolve(__dirname, '../agents');

const agents = fs.readdirSync(AGENTS_ROOT)
  .filter(d => !d.startsWith('_') && !d.startsWith('.'))
  .filter(d => fs.statSync(path.join(AGENTS_ROOT, d)).isDirectory());

let totalExtracted = 0;
let agentsAffected = 0;

for (const agentId of agents) {
  const memoryPath = path.join(AGENTS_ROOT, agentId, 'memory.md');
  if (!fs.existsSync(memoryPath)) continue;

  const content = fs.readFileSync(memoryPath, 'utf8');
  const feedbackPattern = /##\s*CEO\s*Geri\s*Bildirimi\s*—\s*(\d{4}-\d{2}-\d{2})\s*—\s*(\w+)[\s\S]*?(?=##\s*CEO|\n##\s|\n---|\Z)/gi;

  const matches = [...content.matchAll(feedbackPattern)];
  if (matches.length === 0) continue;

  const existingLessonsPath = path.join(AGENTS_ROOT, agentId, 'lessons.jsonl');
  const existingLessons = fs.existsSync(existingLessonsPath)
    ? fs.readFileSync(existingLessonsPath, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
    : [];

  const lessons: any[] = [];
  for (const match of matches) {
    const [fullText, date, ticker] = match;
    const eksikMatch = fullText.match(/###?\s*Eksikler:?([\s\S]*?)(?=###|$)/i);
    const bundanSonraMatch = fullText.match(/###?\s*Bundan\s*Sonra:?([\s\S]*?)(?=###|$)/i);

    if (eksikMatch) {
      const bullets = eksikMatch[1].match(/^\s*[-*]\s*(.+)$/gm) || [];
      for (const bullet of bullets) {
        const issue = bullet.replace(/^\s*[-*]\s*/, '').trim();
        if (issue.length < 20) continue;
        const rule = bundanSonraMatch ? bundanSonraMatch[1].slice(0, 300).trim() : '';
        lessons.push({
          id: `lsn-migrated-${date}-${ticker}-${lessons.length}`,
          date, ticker,
          agent_id: agentId,
          issue_type: classifyIssueType(issue),
          severity: extractSeverity(issue),
          issue,
          rule: rule || null,
          case_lesson: null,
          status: 'open',
          repeat_count: 1,
          migrated_from: 'memory.md',
          last_seen: new Date().toISOString(),
          last_ticker: ticker,
        });
      }
    }
  }

  const dedupedLessons: any[] = [...existingLessons];
  let addedCount = 0;
  for (const newLesson of lessons) {
    const similar = findSimilar(dedupedLessons, newLesson);
    if (similar) {
      similar.repeat_count = (similar.repeat_count || 1) + 1;
      similar.last_seen = newLesson.last_seen;
    } else {
      dedupedLessons.push(newLesson);
      addedCount++;
    }
  }

  fs.writeFileSync(
    existingLessonsPath,
    dedupedLessons.map(l => JSON.stringify(l)).join('\n') + '\n',
    'utf8',
  );

  console.log(`[MIGRATE] ${agentId}: ${matches.length} feedback blocks → ${lessons.length} candidate → +${addedCount} new (dedup: ${lessons.length - addedCount})`);
  totalExtracted += addedCount;
  if (addedCount > 0) agentsAffected++;
}

console.log(`\n=== Migration Summary ===`);
console.log(`Agents processed: ${agents.length}`);
console.log(`Agents with new lessons: ${agentsAffected}`);
console.log(`Total new lessons added: ${totalExtracted}`);

function classifyIssueType(issue: string): string {
  const lower = issue.toLowerCase();
  if (lower.includes('null') || lower.includes('eksik') || lower.includes('hesaplanmadı')) return 'missing_metric';
  if (lower.includes('yanlış') || lower.includes('hatalı') || lower.includes('wrong')) return 'wrong_calculation';
  if (lower.includes('format') || lower.includes('html') || lower.includes('pdf')) return 'format_violation';
  if (lower.includes('upstream') || lower.includes('parse')) return 'upstream_gap';
  return 'other';
}

function extractSeverity(issue: string): string {
  if (/P0|blocker|critical|kritik/i.test(issue)) return 'P0';
  if (/P1|yüksek/i.test(issue)) return 'P1';
  if (/P2|orta/i.test(issue)) return 'P2';
  return 'P2';
}

function findSimilar(existing: any[], newLesson: any): any | null {
  const keywords = newLesson.issue.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
  for (const lesson of existing) {
    if (lesson.agent_id !== newLesson.agent_id) continue;
    if (lesson.issue_type !== newLesson.issue_type) continue;
    const lessonKeywords = (lesson.issue || '').toLowerCase().split(/\s+/);
    const overlap = keywords.filter((k: string) => lessonKeywords.some((lk: string) => lk.includes(k))).length;
    if (overlap >= 3) return lesson;
  }
  return null;
}
