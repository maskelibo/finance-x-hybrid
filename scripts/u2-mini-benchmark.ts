/**
 * U2 mini-benchmark: all 20 skills have real content + excerpt engine works.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadSkillsRegistry, readSkillExcerpt, readSkillContent } from '../backend/src/skills/registry.js';
import { PROJECT_ROOT } from '../backend/src/config.js';

let ok = 0, fail = 0;
const log: string[] = [];
const a = (c: boolean, m: string) => { if (c) { ok++; log.push(`✅ ${m}`); } else { fail++; log.push(`❌ ${m}`); } };

const REQUIRED_HEADINGS = ['Ne Zaman Kullanılır', 'Prosedür', 'Kurallar', 'Örnek', 'Bilinen Tuzaklar', 'Referanslar'];
const BANNED_STUBS = ['TBD — Block U2', 'TBD — Block U3', 'TBD\n'];

const reg = loadSkillsRegistry();
a(reg.length === 20, `Registry has 20 skills (got ${reg.length})`);

let skillsWithAllHeadings = 0;
let skillsWithBannedStubs = 0;
let totalContentChars = 0;
const sizes: Array<{ id: string; size: number }> = [];

for (const s of reg) {
  const p = path.join(PROJECT_ROOT, 'skills', s.id, 'SKILL.md');
  const exists = fs.existsSync(p);
  if (!exists) { fail++; log.push(`❌ ${s.id}: SKILL.md missing`); continue; }
  const content = fs.readFileSync(p, 'utf8');
  const hasAll = REQUIRED_HEADINGS.every(h => content.includes(`## ${h}`));
  if (hasAll) skillsWithAllHeadings++;
  const hasBannedStubs = BANNED_STUBS.some(stub => content.includes(stub));
  if (hasBannedStubs) skillsWithBannedStubs++;
  totalContentChars += content.length;
  sizes.push({ id: s.id, size: content.length });
}

a(skillsWithAllHeadings === 20, `All 20 skills have 6 standard headings (got ${skillsWithAllHeadings}/20)`);
a(skillsWithBannedStubs === 0, `No skill has TBD stub content (got ${skillsWithBannedStubs} with stubs)`);
a(totalContentChars >= 30000, `Total skills content ≥30KB (got ${totalContentChars} chars)`);

// Content size distribution — every skill ≥1200 (reasonable minimum for 6-heading content)
const small = sizes.filter(x => x.size < 1200);
a(small.length === 0, `All skills ≥1200 chars (found ${small.length} smaller: ${small.map(x=>x.id).slice(0,5).join(',')})`);

// Excerpt engine produces non-trivial output for every skill
let validExcerpts = 0;
for (const s of reg) {
  const excerpt = readSkillExcerpt(s.id, { test: 'example' }, 3000);
  if (excerpt && excerpt.length > 500) validExcerpts++;
}
a(validExcerpts === 20, `All 20 skills produce >500-char excerpts with example/test context (got ${validExcerpts}/20)`);

// Specific content spot-check: ias29 has EBITDA formula ref
const ias29 = readSkillContent('ias29-inflation-accounting', 5000) || '';
a(ias29.includes('EBITDA') && ias29.includes('Monetary Gain'), 'ias29 skill has EBITDA + Monetary Gain formula');

// sector-aviation has EBITDAR
const aviation = readSkillContent('sector-aviation', 5000) || '';
a(aviation.includes('EBITDAR') && aviation.includes('Load Factor'), 'sector-aviation has EBITDAR + Load Factor');

// sector-banking has NIM/CET1
const banking = readSkillContent('sector-banking', 5000) || '';
a(banking.includes('NIM') && banking.includes('CET1') && banking.includes('BDDK'), 'sector-banking has NIM+CET1+BDDK');

// dcf-valuation has WACC + terminal value
const dcf = readSkillContent('dcf-valuation', 5000) || '';
a(dcf.includes('WACC') && dcf.includes('Terminal'), 'dcf-valuation has WACC + Terminal value');

console.log(log.join('\n'));
console.log(`\n=== Summary ===`);
console.log(`Avg skill size: ${Math.round(totalContentChars / reg.length)} chars`);
console.log(`Largest: ${sizes.sort((a,b)=>b.size-a.size)[0].id} = ${sizes[0].size} chars`);
console.log(`Smallest: ${sizes[sizes.length-1].id} = ${sizes[sizes.length-1].size} chars`);
console.log(`\n=== Result: ${ok} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
