/**
 * R6 mini-benchmark: sector registry + schema enum additions.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getSector, getAllTickers } from '../backend/src/sector-registry.js';
import { PROJECT_ROOT } from '../backend/src/config.js';

let ok = 0, fail = 0;
const log: string[] = [];
const a = (c: boolean, m: string) => { if (c) { ok++; log.push(`✅ ${m}`); } else { fail++; log.push(`❌ ${m}`); } };

// --- getSector
a(getSector('THYAO') === 'aviation', 'getSector: THYAO → aviation');
a(getSector('thyao') === 'aviation', 'getSector: lowercase accepted');
a(getSector('EREGL') === 'steel', 'getSector: EREGL → steel');
a(getSector('KCHOL') === 'holding', 'getSector: KCHOL → holding');
a(getSector('TUPRS') === 'refinery', 'getSector: TUPRS → refinery');
a(getSector('ASELS') === 'defense_electronics', 'getSector: ASELS → defense_electronics');
a(getSector('AKBNK') === 'banking', 'getSector: AKBNK → banking');
a(getSector('BIMAS') === 'retail', 'getSector: BIMAS → retail');
a(getSector('TCELL') === 'telecom', 'getSector: TCELL → telecom');
a(getSector('NONEXISTENT') === null, 'getSector: unknown ticker → null');

// --- getAllTickers
const all = getAllTickers();
a(all.length >= 36, `getAllTickers: ${all.length} entry (beklenen ≥ 36)`);
a(all.includes('THYAO') && all.includes('EREGL'), 'getAllTickers: core set var');

// --- Schema enum
const schemaPath = path.join(PROJECT_ROOT, 'schemas/shared/agent_output_contract.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const enumVals = schema.properties.output_type.enum;
const newTypes = ['analyst_consensus_report', 'coo_delivery_check', 'esg_report',
  'performance_review_report', 'report_formatter_output',
  'sentiment_news_report', 'valuation_report'];
for (const t of newTypes) {
  a(enumVals.includes(t), `Schema enum: ${t} eklendi`);
}
a(enumVals.length === 26, `Schema enum total count=26 (19 eski + 7 yeni) — şu an ${enumVals.length}`);

console.log(log.join('\n'));
console.log(`\n=== Result: ${ok} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
