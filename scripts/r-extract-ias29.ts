import { db } from '../backend/src/db.js';

const SID = process.argv[2] || 'hTmvou63CfqFxF3VIEx-j';
const row = db.prepare(`SELECT output_text FROM agent_runs WHERE session_id = ? AND agent_id = 'financial_analysis'`).get(SID) as { output_text: string | null } | undefined;
if (!row?.output_text) { console.log('no output for financial_analysis'); process.exit(1); }
const text = row.output_text;
console.log(`financial_analysis output length: ${text.length}`);

const iasMatches = text.match(/[^.\n]{0,100}(IAS[\s_-]?29|enflasyon muhasebesi|hiperenflasyon|adjusted|düzeltilmiş|duzeltilmis)[^.\n]{0,200}/gi) || [];
console.log('\n=== IAS / enflasyon / adjusted contexts ===');
iasMatches.slice(0, 15).forEach((m, i) => console.log(`[${i+1}] ${m.trim().replace(/\s+/g,' ')}`));

const ebitdaVals = text.match(/(EBITDAR?|FAVÖK|FAV[öÖ]K|FAVOK)[^\n]{0,150}?([0-9][0-9.,]+)[^\n]{0,50}/gi) || [];
console.log('\n=== EBITDA/FAVÖK mentions ===');
ebitdaVals.slice(0, 20).forEach((m, i) => console.log(`[${i+1}] ${m.trim().replace(/\s+/g,' ')}`));

// Look for JSON metrics output with canonical keys
const jsonMatch = text.match(/```json([\s\S]*?)```/);
if (jsonMatch) {
  try {
    const parsed = JSON.parse(jsonMatch[1].trim());
    console.log('\n=== JSON metrics (parsed) keys ===');
    const findKey = (obj: any, needle: string, path = ''): string[] => {
      const out: string[] = [];
      if (!obj || typeof obj !== 'object') return out;
      for (const k of Object.keys(obj)) {
        if (k.toLowerCase().includes(needle)) out.push(`${path}${k} = ${JSON.stringify(obj[k]).slice(0,120)}`);
        if (typeof obj[k] === 'object') out.push(...findKey(obj[k], needle, `${path}${k}.`));
      }
      return out;
    };
    for (const term of ['ias29', 'adjusted', 'ebitda', 'favok', 'inflation', 'enflasyon', 'hyperinflation', 'monetary']) {
      const hits = findKey(parsed, term);
      if (hits.length > 0) {
        console.log(`\n${term.toUpperCase()}:`);
        hits.slice(0, 10).forEach(h => console.log(`  ${h}`));
      }
    }
  } catch (e: any) {
    console.log('JSON parse fail:', e.message);
  }
}
