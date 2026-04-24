#!/usr/bin/env node
/**
 * U5 deep dive:
 * 1) Why BIMAS/TUPRS have no U5 rows — what agents DID run?
 * 2) Why THYAO has U5 rows but status=pending (never executed)?
 * 3) What does EREGL knowledge_base actually contain — is its evidence real?
 */
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'data', 'financex.db'), { readonly: true });

const dumpSession = (label, sid) => {
  console.log(`\n########## ${label}  session=${sid} ##########`);
  const runs = db.prepare(`
    SELECT agent_id, status, provider_used, duration_ms, output_chars, error_message, started_at
    FROM agent_runs WHERE session_id = ? ORDER BY started_at ASC
  `).all(sid);
  console.log(`Total agent rows: ${runs.length}`);
  for (const r of runs) {
    console.log(`  ${r.status.padEnd(10)} ${r.agent_id.padEnd(25)} chars=${r.output_chars ?? '-'}  dur=${r.duration_ms ?? '-'}ms  ${r.error_message ? 'ERR' : ''}`);
  }
};

// Case 1: BIMAS latest
dumpSession('BIMAS latest (2026-04-24)', 'mHfZoDyC1GgOYopZPJOmj');

// Case 2: THYAO latest (pending U5)
dumpSession('THYAO latest (2026-04-23)', 'tq4OK1p7GEw1H2MVTWNaQ');

// Case 3: EREGL — inspect knowledge_base full output
console.log('\n########## EREGL knowledge_base full output ##########');
const row = db.prepare(`
  SELECT output_text FROM agent_runs
  WHERE session_id = ? AND agent_id = ?
`).get('d5FU7UfEHokm8sN8eL8_f', 'knowledge_base');
if (row && row.output_text) {
  const t = row.output_text;
  console.log(`Length: ${t.length}`);
  // Look for evidence/citation blocks
  const m1 = t.match(/"evidence[^"]*"\s*:\s*\[[\s\S]{0,2000}?\]/);
  if (m1) {
    console.log('\n--- first evidence[] block ---');
    console.log(m1[0].substring(0, 1500));
  }
  // Look for cited_rag / retrieved chunks
  const ragMarkers = ['cited_rag', 'retrieved_chunks', 'KAP', 'faaliyet raporu', 'Not ', 'page:'];
  console.log('\n--- marker counts ---');
  for (const mk of ragMarkers) {
    const regex = new RegExp(mk, 'gi');
    const count = (t.match(regex) || []).length;
    console.log(`  "${mk}": ${count}`);
  }
  // Look for source quotes
  const sources = t.match(/"source"\s*:\s*"[^"]{5,120}"/g) || [];
  console.log(`\n--- source fields (first 5) ---`);
  for (const s of sources.slice(0, 5)) console.log(`  ${s}`);
}

// Case 4: ARCLK external_research — had 21k bytes, check structure
console.log('\n########## ARCLK external_research inspection ##########');
const arclkExt = db.prepare(`
  SELECT output_text FROM agent_runs
  WHERE session_id = ? AND agent_id = ?
`).get('3xPKJCWx0zFX4HQXT-jCm', 'external_research');
if (arclkExt && arclkExt.output_text) {
  const t = arclkExt.output_text;
  console.log(`Length: ${t.length}`);
  const jsonMatch = t.match(/```json\s*([\s\S]{0,5000})```/);
  if (jsonMatch) {
    console.log('\n--- JSON envelope head (first 2000 chars) ---');
    console.log(jsonMatch[1].substring(0, 2000));
  }
  const webfetchMarkers = ['webfetch', 'WebFetch', 'url":', 'http://', 'https://'];
  console.log('\n--- external source markers ---');
  for (const mk of webfetchMarkers) {
    const count = (t.match(new RegExp(mk, 'g')) || []).length;
    console.log(`  "${mk}": ${count}`);
  }
}
