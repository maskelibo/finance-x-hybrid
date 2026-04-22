/**
 * U3 acceptance — EREGL corpus already ingested; verify hybrid retrieval quality.
 * Relevance@5 ≥ 0.60 (master spec threshold).
 */
import { queryCompanyKnowledge } from '../backend/src/document-intel/bridge.js';

const TICKER = 'EREGL';
const QUESTIONS = [
  { q: 'HRC spread ve çelik marjı 2025', keywords: ['hrc', 'spread', 'marj', 'çelik'] },
  { q: 'EBITDA marjı 2025', keywords: ['ebitda', 'marj', '2025'] },
  { q: 'Net borç EBITDA oranı', keywords: ['net borç', 'ebitda', 'oran'] },
  { q: 'CBAM karbon düzenlemesi etkisi', keywords: ['cbam', 'karbon', 'düzenleme'] },
  { q: 'Demir cevheri maliyet yapısı', keywords: ['demir', 'cevher', 'maliyet'] },
];

let ok = 0, fail = 0;
const log: string[] = [];
const a = (c: boolean, m: string) => { if (c) { ok++; log.push(`✅ ${m}`); } else { fail++; log.push(`❌ ${m}`); } };

const allRelevances: number[] = [];

for (const { q, keywords } of QUESTIONS) {
  try {
    const pack = await queryCompanyKnowledge(TICKER, q, 60_000);
    a(pack.total_retrieved > 0, `Q: "${q.slice(0,40)}" → ${pack.total_retrieved} chunks`);
    const topRelevance = pack.evidence[0]?.relevance ?? 0;
    allRelevances.push(topRelevance);
    a(topRelevance >= 0.6, `Q: top relevance ${topRelevance.toFixed(3)} ≥ 0.60`);

    // Keyword presence in top-3 snippets (any hit)
    const topText = pack.evidence.slice(0, 3).map(e => e.snippet.toLowerCase()).join(' ');
    const kwHits = keywords.filter(k => topText.includes(k.toLowerCase())).length;
    a(kwHits >= 1, `Q: "${q.slice(0,30)}" → ${kwHits}/${keywords.length} keywords in top-3`);
  } catch (err: unknown) {
    fail++;
    log.push(`❌ Q "${q.slice(0, 30)}" failed: ${err instanceof Error ? err.message.slice(0, 100) : err}`);
  }
}

const avgRelevance = allRelevances.reduce((s, r) => s + r, 0) / (allRelevances.length || 1);
a(avgRelevance >= 0.6, `Avg top-1 relevance ${avgRelevance.toFixed(3)} ≥ 0.60 (master spec acceptance)`);

console.log(log.join('\n'));
console.log(`\n=== Result: ${ok} pass, ${fail} fail ===`);
console.log(`Avg top-1 relevance across ${allRelevances.length} questions: ${avgRelevance.toFixed(3)}`);
process.exit(fail === 0 ? 0 : 1);
