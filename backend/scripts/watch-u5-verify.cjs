#!/usr/bin/env node
/**
 * Watch U5 agent completion across 3 verification sessions.
 * Emits one line per newly-completed U5 agent with byte size + evidence
 * signal so the Bug #3 fix effectiveness is visible as data comes in.
 *
 * Exits after all 12 (4 agents × 3 tickers) U5 rows reach terminal state.
 */
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'data', 'financex.db'), { readonly: true });

const SIDS = {
  THYAO: 'gHiKhzgtibbp3zJRbI6Cv',
  ARCLK: '-GYVP6rDN0MQyI1HKwE8_',
  EREGL: 'OlowvziHH2ApthenXAqHI',
};

const U5 = ['research_brief', 'knowledge_base', 'document_evidence', 'external_research'];

// Expected minimums (from commit adab3c6e prompt hardening)
const MIN_BYTES = {
  research_brief: 3000,
  knowledge_base: 10000,
  document_evidence: 5000,
  external_research: 3000,
};

const seen = new Set();

function evidenceCount(t) {
  if (!t) return 0;
  return (t.match(/"evidence(?:_items|_list|_pack|_chain|_by_question)?"\s*:/gi) || []).length;
}
function claimCount(t) {
  if (!t) return 0;
  return (t.match(/"claims?"\s*:\s*\[/gi) || []).length;
}
function findingCount(t) {
  if (!t) return 0;
  return (t.match(/"findings?"\s*:\s*\[/gi) || []).length;
}
function hasJsonEnvelope(t) {
  if (!t) return false;
  const first = t.trim().slice(0, 20);
  return first.startsWith('```json') || first.startsWith('{') || first.startsWith('```\n{') || t.includes('```json\n{');
}

let done = 0;
const TOTAL = U5.length * Object.keys(SIDS).length;

function verdict(agent, bytes, evi, claims, findings, jsonFirst) {
  const min = MIN_BYTES[agent];
  if (bytes < 500) return 'FAIL_STUB';
  if (bytes < min) return 'FAIL_SMALL';
  if (!jsonFirst && agent !== 'external_research') return 'FAIL_NOJSON';
  if (agent === 'knowledge_base' && evi === 0) return 'FAIL_NOEVIDENCE';
  if (agent === 'document_evidence' && claims === 0) return 'FAIL_NOCLAIMS';
  if (agent === 'external_research' && findings === 0 && !t_has_findings_kw(arguments)) {
    // tolerant
  }
  return 'PASS';
}

function t_has_findings_kw() { return true; }

function tick() {
  for (const [ticker, sid] of Object.entries(SIDS)) {
    const rows = db.prepare(`
      SELECT agent_id, status, duration_ms, LENGTH(output_text) AS bytes, output_text
      FROM agent_runs
      WHERE session_id = ? AND agent_id IN (${U5.map(() => '?').join(',')})
    `).all(sid, ...U5);

    for (const r of rows) {
      const key = `${ticker}:${r.agent_id}`;
      if (seen.has(key)) continue;
      if (r.status !== 'completed' && r.status !== 'failed' && r.status !== 'schema_invalid') continue;
      seen.add(key);
      done++;
      if (r.status !== 'completed') {
        console.log(`[${new Date().toTimeString().slice(0,8)}] ${ticker} ${r.agent_id.padEnd(20)} ${r.status.padEnd(14)} bytes=${r.bytes ?? 0} FAIL_STATUS`);
        continue;
      }
      const t = r.output_text || '';
      const evi = evidenceCount(t);
      const claims = claimCount(t);
      const findings = findingCount(t);
      const jsonFirst = hasJsonEnvelope(t);
      const v = verdict(r.agent_id, r.bytes, evi, claims, findings, jsonFirst);
      const durS = r.duration_ms ? Math.round(r.duration_ms / 1000) + 's' : '-';
      console.log(`[${new Date().toTimeString().slice(0,8)}] ${ticker} ${r.agent_id.padEnd(20)} ${v.padEnd(15)} bytes=${String(r.bytes).padStart(6)} dur=${durS.padStart(5)} evi=${evi} claims=${claims} findings=${findings} json=${jsonFirst?'Y':'N'}`);
    }
  }
  if (done >= TOTAL) {
    console.log(`ALL 12 U5 RUNS TERMINAL (${TOTAL}/${TOTAL})`);
    process.exit(0);
  }
}

// Poll every 30s
tick();
setInterval(tick, 30000);
