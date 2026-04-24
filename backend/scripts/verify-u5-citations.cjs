#!/usr/bin/env node
/**
 * U5/U6 citation verification — v2.
 */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'financex.db');
const db = new Database(dbPath, { readonly: true });

const TARGET_AGENTS = [
  'document_evidence',
  'external_research',
  'research_brief',
  'knowledge_base',
];

const sessions = db.prepare(`
  SELECT id, ticker, status, started_at
  FROM analysis_sessions
  WHERE ticker IN ('BIMAS','THYAO','ARCLK','EREGL','TUPRS')
    AND status LIKE 'completed%'
  ORDER BY started_at DESC
  LIMIT 40
`).all();

const perTicker = new Map();
for (const s of sessions) {
  if (!perTicker.has(s.ticker)) perTicker.set(s.ticker, s);
}

const inspect = (text) => {
  if (!text) return { size: 0, citations: 0, evidence: 0, hasRag: false, preview: '', sample: '' };
  const size = text.length;
  const citations = (text.match(/"citation(s)?"\s*:/gi) || []).length;
  const evidence = (text.match(/"evidence(_items|_list|_pack|_chain)?"\s*:/gi) || []).length;
  const hasRag = /cited_rag|retrieved_chunks|"source_tag".*KAP|"skill_applied"/i.test(text);
  const preview = text.substring(0, 300).replace(/\s+/g, ' ');
  const sample = text.substring(0, 1200).replace(/\s+/g, ' ');
  return { size, citations, evidence, hasRag, preview, sample };
};

for (const [ticker, sess] of perTicker) {
  console.log(`\n========== ${ticker}  session=${sess.id}  ${sess.status}  ${sess.started_at} ==========`);
  const runs = db.prepare(`
    SELECT agent_id, status, provider_used, duration_ms, output_text, error_message
    FROM agent_runs
    WHERE session_id = ? AND agent_id IN (${TARGET_AGENTS.map(() => '?').join(',')})
    ORDER BY started_at ASC
  `).all(sess.id, ...TARGET_AGENTS);

  if (runs.length === 0) {
    console.log('  (no U5 agent runs)');
    continue;
  }

  for (const r of runs) {
    const sum = inspect(r.output_text);
    const flag =
      r.status !== 'completed' ? '❌' :
      sum.size < 500 ? '⚠️STUB?' :
      (sum.citations === 0 && sum.evidence === 0 && !sum.hasRag) ? '⚠️NOCIT' :
      '✅';
    console.log(`  ${flag} ${r.agent_id.padEnd(20)} status=${r.status.padEnd(10)} bytes=${String(sum.size).padStart(6)}  cits=${sum.citations}  evi=${sum.evidence}  rag=${sum.hasRag?'yes':'no'}  prov=${r.provider_used ?? '-'}`);
    if (r.error_message) console.log(`       ERR: ${r.error_message.substring(0, 300)}`);
    if (sum.size > 0 && sum.size < 800) console.log(`       FULL: ${sum.sample}`);
    else if (sum.size > 0) console.log(`       head: ${sum.preview}`);
  }
}

console.log('\nDone.');
