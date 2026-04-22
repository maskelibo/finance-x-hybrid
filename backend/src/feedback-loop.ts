import { nanoid } from 'nanoid';
import { db } from './db.js';
import { readAgentMemory } from './memory.js';
import { getModelForAgent, AGENTS_ROOT } from './config.js';
import { createDefaultProviderRouter } from './llm/default-router.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * CEO Feedback Loop — Post-Report Agent Review (R3: deterministic file writer)
 *
 * CEO LLM emits structured JSON describing gaps; orchestrator writes
 * lessons.jsonl / case_lessons.md / permanent_rules.md deterministically.
 * Auto-promotion: lessons with repeat_count >= 3 move to permanent_rules.md.
 */

const providerRouter = createDefaultProviderRouter();

type FeedbackItem = {
  agent_id: string;
  issue_type: 'missing_metric' | 'wrong_calculation' | 'format_violation' | 'upstream_gap' | 'other';
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  issue_description: string;
  rule_to_add?: string;
  case_lesson?: string;
  repeat_count_hint?: number;
};

type FeedbackResponse = {
  session_summary: string;
  items: FeedbackItem[];
};

export async function runFeedbackLoop(sessionId: string): Promise<string> {
  const session = db.prepare(`SELECT * FROM analysis_sessions WHERE id = ?`).get(sessionId) as any;
  if (!session) throw new Error('Session not found');

  const runs = db.prepare(`
    SELECT agent_id, agent_display_name, output_text, status
    FROM agent_runs WHERE session_id = ? ORDER BY rowid ASC
  `).all(sessionId) as Array<{
    agent_id: string;
    agent_display_name: string;
    output_text: string | null;
    status: string;
  }>;

  const agentSummaries = runs
    .filter(r => r.output_text && r.status === 'completed')
    .map(r => `### ${r.agent_display_name} (${r.agent_id})\n${r.output_text!.slice(0, 3000)}`)
    .join('\n\n---\n\n');

  const ceoMemory = readAgentMemory('ceo');

  const prompt = [
    `# CEO Post-Report Feedback — STRUCTURED OUTPUT`,
    ``,
    `Sen Finance X CEO Meta-Ajanısın. ${session.ticker} analizi tamamlandı.`,
    ``,
    `## Görev`,
    `Her agent çıktısındaki eksikliği tespit et ve AŞAĞIDAKİ JSON FORMATINDA cevap ver.`,
    `Serbest metin YAZMA. SADECE JSON. Markdown code block kullan.`,
    ``,
    `## CEO Hafızan (context için)`,
    ceoMemory.slice(0, 2000),
    ``,
    `## Chairman Zorunlu Metrikleri`,
    `Net Satışlar, Brüt Kar, FAVÖK, Cash FAVÖK, DSO, DIO, DPO, CCC, NWC/Hasılat, Net Borç/FAVÖK, Faiz Karşılama, Cari Oran, Asit-Test, ROE, ROCE, ROIC, FCF, CAPEX/FAVÖK, OCF/FAVÖK, jeopolitik bağlam, sektör-özel makro geçiş, her ratio yorumu`,
    ``,
    `## Agent Çıktıları`,
    agentSummaries,
    ``,
    `## Output Format (ZORUNLU — sadece bu JSON)`,
    '```json',
    `{`,
    `  "session_summary": "Kısa özet, 2-3 cümle",`,
    `  "items": [`,
    `    {`,
    `      "agent_id": "financial_analysis",`,
    `      "issue_type": "missing_metric",`,
    `      "severity": "P0",`,
    `      "issue_description": "EBITDAR null — havacılık analizinin birincil metriği",`,
    `      "rule_to_add": "Havacılık şirketlerinde EBITDA null ise EBITDAR proxy zorunlu (Op. Income + D&A proxy %15-18 + IFRS 16 kira)",`,
    `      "case_lesson": "THYAO: EBITDAR 2025 marjı %23.2 (gerçek). Peer karşılaştırma EBITDAR bazlı.",`,
    `      "repeat_count_hint": 5`,
    `    }`,
    `  ]`,
    `}`,
    '```',
    ``,
    `Her agent için birden fazla item olabilir. Severity dağılımı gerçekçi olsun (her şey P0 olmaz).`,
  ].join('\n');

  const result = await providerRouter.run({
    prompt,
    model: getModelForAgent('ceo'),
    timeoutMs: 15 * 60 * 1000,
  });

  if (!result.success) {
    throw new Error(result.error || 'Feedback loop failed');
  }

  const feedback = parseFeedbackJson(result.output);
  const writeResults = applyFeedbackDeterministic(feedback, session.ticker);

  try {
    db.prepare(`
      INSERT INTO ceo_activities (id, activity_type, title, description, triggered_by, status, output_text, created_at)
      VALUES (?, 'feedback_loop', ?, ?, 'autonomous', 'completed', ?, ?)
    `).run(
      nanoid(),
      `${session.ticker} feedback döngüsü`,
      `${feedback.items.length} feedback item, ${writeResults.memoryWrites} memory yazımı, ${writeResults.caseLessonWrites} case lesson.`,
      JSON.stringify({ feedback, writeResults }, null, 2).slice(0, 10000),
      new Date().toISOString()
    );
  } catch {}

  return JSON.stringify({ feedback, writeResults }, null, 2);
}

function parseFeedbackJson(output: string): FeedbackResponse {
  const codeBlockMatch = output.match(/```(?:json)?\s*\n([\s\S]*?)```/);
  const jsonText = codeBlockMatch ? codeBlockMatch[1] : output;

  try {
    const parsed = JSON.parse(jsonText.trim());
    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error('items array missing');
    }
    return parsed as FeedbackResponse;
  } catch (err: any) {
    console.error(`[FEEDBACK] JSON parse failed: ${err.message}`);
    console.error(`[FEEDBACK] Raw output: ${output.slice(0, 500)}`);
    return { session_summary: 'Parse failed', items: [] };
  }
}

export function applyFeedbackDeterministic(
  feedback: FeedbackResponse,
  ticker: string,
): { memoryWrites: number; caseLessonWrites: number; duplicatesSkipped: number } {
  let memoryWrites = 0;
  let caseLessonWrites = 0;
  let duplicatesSkipped = 0;

  for (const item of feedback.items) {
    const agentDir = path.join(AGENTS_ROOT, item.agent_id);
    if (!fs.existsSync(agentDir)) {
      console.warn(`[FEEDBACK] Unknown agent: ${item.agent_id} — skipping`);
      continue;
    }

    const lessonsPath = path.join(agentDir, 'lessons.jsonl');
    const existingLessons = readLessonsJsonlFile(lessonsPath);

    const existing = findSimilarLesson(existingLessons, item);
    if (existing) {
      existing.repeat_count = (existing.repeat_count || 1) + 1;
      existing.last_seen = new Date().toISOString();
      existing.last_ticker = ticker;
      writeLessonsJsonl(lessonsPath, existingLessons);
      duplicatesSkipped++;
      console.log(`[FEEDBACK] Dedup: ${item.agent_id} — repeat_count=${existing.repeat_count}`);
    } else {
      const newLesson = {
        id: `lsn-${nanoid(8)}`,
        date: new Date().toISOString().split('T')[0],
        ticker,
        agent_id: item.agent_id,
        issue_type: item.issue_type,
        severity: item.severity,
        issue: item.issue_description,
        rule: item.rule_to_add || null,
        case_lesson: item.case_lesson || null,
        status: 'open',
        repeat_count: 1,
        last_seen: new Date().toISOString(),
        last_ticker: ticker,
      };
      existingLessons.push(newLesson);
      writeLessonsJsonl(lessonsPath, existingLessons);
      memoryWrites++;
    }

    const promotable = existingLessons.filter(l => (l.repeat_count || 0) >= 3 && l.status === 'open' && l.rule);
    for (const p of promotable) {
      promoteToPermenantRules(item.agent_id, p);
      p.status = 'promoted_to_permanent';
    }
    if (promotable.length > 0) writeLessonsJsonl(lessonsPath, existingLessons);

    if (item.case_lesson) {
      appendCaseLesson(item.agent_id, ticker, item.case_lesson);
      caseLessonWrites++;
    }
  }

  return { memoryWrites, caseLessonWrites, duplicatesSkipped };
}

function readLessonsJsonlFile(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean);
}

function writeLessonsJsonl(filePath: string, lessons: any[]): void {
  const content = lessons.map(l => JSON.stringify(l)).join('\n') + '\n';
  fs.writeFileSync(filePath, content, 'utf8');
}

function findSimilarLesson(lessons: any[], item: FeedbackItem): any | null {
  const keywords = item.issue_description.toLowerCase().split(/\s+/).filter(w => w.length > 4);
  for (const lesson of lessons) {
    if (lesson.agent_id !== item.agent_id) continue;
    if (lesson.issue_type !== item.issue_type) continue;
    if (lesson.status !== 'open') continue;
    const lessonKeywords = (lesson.issue || '').toLowerCase().split(/\s+/);
    const overlap = keywords.filter(k => lessonKeywords.some((lk: string) => lk.includes(k))).length;
    if (overlap >= 3) return lesson;
  }
  return null;
}

function promoteToPermenantRules(agentId: string, lesson: any): void {
  const rulesPath = path.join(AGENTS_ROOT, agentId, 'permanent_rules.md');
  const existing = fs.existsSync(rulesPath) ? fs.readFileSync(rulesPath, 'utf8') : `# ${agentId} — Permanent Rules\n\n`;
  const timestamp = new Date().toISOString().split('T')[0];
  const newRule = `\n## ${timestamp} — Auto-promoted (repeat_count=${lesson.repeat_count})\n\n**Kural:** ${lesson.rule}\n\n**Kaynak:** ${lesson.ticker} analizinde ${lesson.repeat_count} kez tekrarlandı (${lesson.issue})\n`;

  if (existing.includes(lesson.rule)) {
    console.log(`[FEEDBACK] Rule already in permanent_rules for ${agentId}, skipping promotion`);
    return;
  }

  fs.writeFileSync(rulesPath, existing + newRule, 'utf8');
  console.log(`[FEEDBACK] Promoted to permanent_rules for ${agentId}: ${lesson.rule.slice(0, 80)}...`);
}

function appendCaseLesson(agentId: string, ticker: string, lesson: string): void {
  const casePath = path.join(AGENTS_ROOT, agentId, 'case_lessons.md');
  const existing = fs.existsSync(casePath) ? fs.readFileSync(casePath, 'utf8') : `# ${agentId} — Case Lessons\n\n`;
  const timestamp = new Date().toISOString().split('T')[0];
  const entry = `\n### ${timestamp} — ${ticker}\n${lesson}\n`;

  if (existing.includes(lesson.slice(0, 100))) return;

  fs.writeFileSync(casePath, existing + entry, 'utf8');
}
