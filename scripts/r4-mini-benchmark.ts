/**
 * R4 mini-benchmark: loadStructuredMemory — 3-part structured loader
 * (permanent_rules + memory kurallar + recent lessons)
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadStructuredMemory } from '../backend/src/agent-runner.js';
import { AGENTS_ROOT } from '../backend/src/config.js';

const TARGET = 'financial_analysis';
const MEMORY = path.join(AGENTS_ROOT, TARGET, 'memory.md');
const RULES = path.join(AGENTS_ROOT, TARGET, 'permanent_rules.md');
const LESSONS = path.join(AGENTS_ROOT, TARGET, 'lessons.jsonl');

const backup = {
  rules: fs.existsSync(RULES) ? fs.readFileSync(RULES, 'utf8') : null,
  lessons: fs.existsSync(LESSONS) ? fs.readFileSync(LESSONS, 'utf8') : null,
};

function restore() {
  if (backup.rules === null && fs.existsSync(RULES)) fs.unlinkSync(RULES);
  else if (backup.rules !== null) fs.writeFileSync(RULES, backup.rules, 'utf8');
  if (backup.lessons === null && fs.existsSync(LESSONS)) fs.unlinkSync(LESSONS);
  else if (backup.lessons !== null) fs.writeFileSync(LESSONS, backup.lessons, 'utf8');
}

let ok = 0, fail = 0;
const log: string[] = [];
const a = (c: boolean, m: string) => { if (c) { ok++; log.push(`✅ ${m}`); } else { fail++; log.push(`❌ ${m}`); } };

try {
  // --- Case 1: sadece memory.md varsa (rules/lessons yok)
  if (fs.existsSync(RULES)) fs.unlinkSync(RULES);
  if (fs.existsSync(LESSONS)) fs.unlinkSync(LESSONS);
  const out1 = loadStructuredMemory(TARGET, MEMORY);
  a(out1.includes('### Memory'), 'Case 1: memory.md section yüklendi');
  a(!out1.includes('### Kalıcı Kurallar'), 'Case 1: Kalıcı Kurallar yok (rules yok)');
  a(!out1.includes('### Son Açık Öğrenimler'), 'Case 1: lessons yok');

  // --- Case 2: rules + memory.md
  fs.writeFileSync(RULES, '# Permanent Rules\n\n## Kural A\nHavacılık EBITDAR zorunlu.\n', 'utf8');
  const out2 = loadStructuredMemory(TARGET, MEMORY);
  a(out2.includes('### Kalıcı Kurallar'), 'Case 2: permanent_rules section yüklendi');
  a(out2.includes('Havacılık EBITDAR zorunlu'), 'Case 2: rules içeriği var');
  a(out2.includes('### Memory'), 'Case 2: memory section hala var');

  // --- Case 3: rules + memory + lessons
  const lessonLine = JSON.stringify({
    id: 'lsn-test01', date: '2026-04-22', ticker: 'THYAO',
    agent_id: TARGET, issue_type: 'missing_metric', severity: 'P0',
    issue: 'EBITDAR null',
    rule: 'Havacılık EBITDAR zorunlu',
    status: 'open', repeat_count: 2,
    last_seen: new Date().toISOString(), last_ticker: 'THYAO',
  });
  fs.writeFileSync(LESSONS, lessonLine + '\n', 'utf8');
  const out3 = loadStructuredMemory(TARGET, MEMORY);
  a(out3.includes('### Son Açık Öğrenimler'), 'Case 3: lessons section yüklendi');
  a(out3.includes('THYAO'), 'Case 3: lesson içeriği var');
  a(out3.includes('Havacılık EBITDAR zorunlu'), 'Case 3: lesson rule görünüyor');

  // --- Case 4: büyük rules (>4KB) → clip to 4KB
  const big = '# Rules\n\n' + 'x'.repeat(5000);
  fs.writeFileSync(RULES, big, 'utf8');
  const out4 = loadStructuredMemory(TARGET, MEMORY);
  a(out4.includes('ilk 4KB'), 'Case 4: büyük rules için "ilk 4KB" uyarısı');
} finally {
  restore();
}

console.log(log.join('\n'));
console.log(`\n=== Result: ${ok} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
