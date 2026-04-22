/**
 * U1 mini-benchmark: skills registry + getTriggeredSkills + readSkillExcerpt.
 */
import {
  loadSkillsRegistry,
  getSkillsForAgent,
  getTriggeredSkills,
  readSkillExcerpt,
  readSkillContent,
} from '../backend/src/skills/registry.js';

let ok = 0, fail = 0;
const log: string[] = [];
const a = (c: boolean, m: string) => { if (c) { ok++; log.push(`✅ ${m}`); } else { fail++; log.push(`❌ ${m}`); } };

// --- registry load
const reg = loadSkillsRegistry();
a(reg.length === 20, `registry: 20 skills (got ${reg.length})`);
a(reg.every(s => s.id && s.triggers?.length), 'registry: all have id + triggers');
a(reg.every(s => Array.isArray(s.applies_to_agents)), 'registry: all have applies_to_agents array');

// --- getSkillsForAgent
const faSkills = getSkillsForAgent('financial_analysis');
a(faSkills.length >= 8, `FA skills: ${faSkills.length} applicable (expected >=8)`);
a(faSkills.some(s => s.id === 'ias29-inflation-accounting'), 'FA has ias29-inflation-accounting');

const tecSkills = getSkillsForAgent('technical_analysis');
a(tecSkills.some(s => s.id === 'technical-indicators'), 'technical_analysis has technical-indicators');

// --- getTriggeredSkills
const thyaoCtx = { ticker: 'THYAO', sector: 'aviation', context_extraction_output: 'EBITDAR havacılık analizi load factor ASK' };
const thyaoTrig = getTriggeredSkills('financial_analysis', thyaoCtx);
a(thyaoTrig.some(s => s.id === 'sector-aviation'), 'THYAO FA context → sector-aviation triggered');

const ias29Ctx = { analysis_note: 'IAS 29 enflasyon muhasebesi parasal kazanç' };
const ias29Trig = getTriggeredSkills('financial_analysis', ias29Ctx);
a(ias29Trig.some(s => s.id === 'ias29-inflation-accounting'), 'IAS 29 keyword → ias29-inflation-accounting triggered');

const emptyCtx = { foo: 'nothing relevant here' };
const emptyTrig = getTriggeredSkills('financial_analysis', emptyCtx);
a(emptyTrig.length === 0, `empty context → 0 triggered (got ${emptyTrig.length})`);

// --- readSkillExcerpt (heading-based)
const excerpt = readSkillExcerpt('ias29-inflation-accounting', thyaoCtx, 2000);
a(excerpt !== null, 'excerpt returns non-null for existing skill');
a((excerpt || '').includes('Ne Zaman Kullanılır'), 'excerpt includes "Ne Zaman Kullanılır"');
a((excerpt || '').includes('Prosedür'), 'excerpt includes "Prosedür"');
a((excerpt || '').includes('Kurallar'), 'excerpt includes "Kurallar"');
a(!(excerpt || '').includes('Referanslar'), 'excerpt EXCLUDES "Referanslar" (by design)');

// Context with "örnek" → should include example section
const exampleCtx = { note: 'örnek test vaka' };
const withExample = readSkillExcerpt('ias29-inflation-accounting', exampleCtx, 3000) || '';
a(withExample.includes('Örnek'), 'context with "örnek" → Örnek section included');

// Context without → excluded
const withoutExample = readSkillExcerpt('ias29-inflation-accounting', { foo: 'bar' }, 3000) || '';
a(!withoutExample.includes('## Örnek'), 'no keyword → Örnek excluded');

// --- readSkillContent fallback
const full = readSkillContent('sector-aviation', 3000);
a(full !== null && full.includes('sector-aviation'), 'readSkillContent for sector-aviation');

// --- Non-existent skill
a(readSkillExcerpt('bogus-skill', {}, 1000) === null, 'non-existent skill → null');
a(readSkillContent('bogus-skill', 1000) === null, 'non-existent skill content → null');

console.log(log.join('\n'));
console.log(`\n=== Result: ${ok} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
