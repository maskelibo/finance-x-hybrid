/**
 * R3 mini-benchmark: feedback loop deterministic write path.
 * LLM'i çağırmaz — structured feedback parse + file write davranışını izole test eder.
 */
import fs from 'node:fs';
import path from 'node:path';
import { applyFeedbackDeterministic } from '../backend/src/feedback-loop.js';
import { AGENTS_ROOT } from '../backend/src/config.js';

const TARGET_AGENT = 'financial_analysis';
const LESSONS_PATH = path.join(AGENTS_ROOT, TARGET_AGENT, 'lessons.jsonl');
const CASE_PATH = path.join(AGENTS_ROOT, TARGET_AGENT, 'case_lessons.md');
const RULES_PATH = path.join(AGENTS_ROOT, TARGET_AGENT, 'permanent_rules.md');

const backup = {
  lessons: fs.existsSync(LESSONS_PATH) ? fs.readFileSync(LESSONS_PATH, 'utf8') : null,
  cases: fs.existsSync(CASE_PATH) ? fs.readFileSync(CASE_PATH, 'utf8') : null,
  rules: fs.existsSync(RULES_PATH) ? fs.readFileSync(RULES_PATH, 'utf8') : null,
};

function restore() {
  if (backup.lessons === null) fs.existsSync(LESSONS_PATH) && fs.unlinkSync(LESSONS_PATH);
  else fs.writeFileSync(LESSONS_PATH, backup.lessons, 'utf8');
  if (backup.cases === null) fs.existsSync(CASE_PATH) && fs.unlinkSync(CASE_PATH);
  else fs.writeFileSync(CASE_PATH, backup.cases, 'utf8');
  if (backup.rules === null) fs.existsSync(RULES_PATH) && fs.unlinkSync(RULES_PATH);
  else fs.writeFileSync(RULES_PATH, backup.rules, 'utf8');
}

function countLines(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  return fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean).length;
}

let ok = 0;
let fail = 0;
const log: string[] = [];
const assert = (cond: boolean, msg: string) => {
  if (cond) { ok++; log.push(`✅ ${msg}`); }
  else { fail++; log.push(`❌ ${msg}`); }
};

try {
  // --- Case 1: new lesson (first write)
  if (fs.existsSync(LESSONS_PATH)) fs.unlinkSync(LESSONS_PATH);
  const linesBefore = countLines(LESSONS_PATH);
  const feedback1 = {
    session_summary: 'Test run 1',
    items: [{
      agent_id: TARGET_AGENT,
      issue_type: 'missing_metric' as const,
      severity: 'P0' as const,
      issue_description: 'EBITDAR null — aviation primary metric missing',
      rule_to_add: 'Aviation: EBITDA null ise EBITDAR proxy zorunlu',
      case_lesson: 'THYAO: EBITDAR 2025 marjı %23.2',
    }],
  };
  const r1 = applyFeedbackDeterministic(feedback1, 'THYAO');
  assert(r1.memoryWrites === 1, `Case 1: memoryWrites=${r1.memoryWrites} (beklenen 1)`);
  assert(countLines(LESSONS_PATH) === linesBefore + 1, `Case 1: lessons.jsonl satır +1 (şu an ${countLines(LESSONS_PATH)})`);
  assert(fs.existsSync(CASE_PATH), 'Case 1: case_lessons.md oluşturuldu');

  // --- Case 2: dedup — aynı issue tekrar
  const feedback2 = {
    session_summary: 'Test run 2',
    items: [{
      agent_id: TARGET_AGENT,
      issue_type: 'missing_metric' as const,
      severity: 'P0' as const,
      issue_description: 'EBITDAR null — aviation primary metric missing again',
      rule_to_add: 'Aviation: EBITDA null ise EBITDAR proxy zorunlu',
    }],
  };
  const r2 = applyFeedbackDeterministic(feedback2, 'PGSUS');
  assert(r2.duplicatesSkipped === 1, `Case 2: duplicatesSkipped=${r2.duplicatesSkipped} (beklenen 1)`);
  assert(r2.memoryWrites === 0, `Case 2: memoryWrites=${r2.memoryWrites} (beklenen 0)`);
  assert(countLines(LESSONS_PATH) === linesBefore + 1, 'Case 2: lessons.jsonl satır sayısı aynı kaldı (dedup)');

  // --- Case 3: üçüncü aynı issue → auto-promote
  const r3 = applyFeedbackDeterministic(feedback2, 'TAVHL');
  assert(r3.duplicatesSkipped === 1, `Case 3: duplicatesSkipped=${r3.duplicatesSkipped} (beklenen 1)`);
  assert(fs.existsSync(RULES_PATH), 'Case 3: permanent_rules.md oluştu (auto-promotion repeat_count>=3)');

  // --- Case 4: yanlış agent_id → skip
  const feedback4 = {
    session_summary: 'Test run 4',
    items: [{
      agent_id: 'bogus_agent_12345',
      issue_type: 'other' as const,
      severity: 'P2' as const,
      issue_description: 'should be skipped',
    }],
  };
  const r4 = applyFeedbackDeterministic(feedback4, 'THYAO');
  assert(r4.memoryWrites === 0, `Case 4: memoryWrites=${r4.memoryWrites} (beklenen 0 — bogus agent)`);
} finally {
  restore();
}

console.log(log.join('\n'));
console.log(`\n=== Result: ${ok} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
