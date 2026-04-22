import { db } from '../backend/src/db.js';
const row = db.prepare(`SELECT output_text FROM agent_runs WHERE session_id = 'hTmvou63CfqFxF3VIEx-j' AND agent_id = 'financial_analysis'`).get() as any;
const t = row.output_text as string;

console.log('--- ALL keys containing ias29, adjusted, monetary, hyperinflation ---');
const kv = t.match(/"[^"]*(ias29|adjusted|monetary|hyperinflation|enflasyon)[^"]*"\s*:\s*(?:"[^"]*"|\{[^\}]*\}|[0-9.eE+-]+)/gi) || [];
kv.slice(0, 30).forEach((x, i) => console.log(`${i+1}. ${x.trim().replace(/\s+/g,' ').slice(0,200)}`));

console.log('\n--- FACT-layer / engine / reconciliation raw numbers related to IAS29 ---');
const num = t.match(/(?:IAS29|ias29)[^.\n]{0,30}[:=]?\s*([0-9][0-9.,_]+)\s*(?:mn|bn|mio|TL|TRY)?/gi) || [];
num.slice(0, 20).forEach((x, i) => console.log(`${i+1}. ${x.trim()}`));

console.log('\n--- IAS29 narrative full paragraphs ---');
const para = t.split(/\n\n+/).filter(p => /ias\s*29|hiperenf|enflasyon muhasebesi|parasal kay|monetary/i.test(p));
para.slice(0, 6).forEach((p, i) => console.log(`\n[${i+1}] ${p.slice(0, 600)}`));
