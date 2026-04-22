// Phase 8D upstream-digest unit tests — standalone (inline reimpl).
// Run: node upstream-digest.test.cjs
const assert = require('node:assert/strict');

const DIGEST_MARKER = '\n\n[... digest: middle content summarized, see upstream manifest for full sections ...]\n\n';
const SIGNAL_FIELDS = ['executive_summary','summary','key_findings','findings','addressed_findings','mandatory_metrics_complete','engine_snapshot','metrics_array','interpretations','quality_flags','cross_reference_findings','risk_factors','recommendations','claims','confidence','status'];

function tryParseJson(raw) {
  const t = raw.trim();
  try { return JSON.parse(t); } catch {}
  const f = t.match(/```json\s*([\s\S]*?)```/i) || t.match(/```\s*(\{[\s\S]*?\})\s*```/);
  if (f) { try { return JSON.parse(f[1].trim()); } catch {} }
  const fb = t.indexOf('{');
  if (fb < 0) return null;
  let d = 0;
  for (let i = fb; i < t.length; i++) {
    const c = t[i];
    if (c === '{') d++;
    else if (c === '}') { d--; if (d === 0) { try { return JSON.parse(t.slice(fb, i+1)); } catch { return null; } } }
  }
  return null;
}

function byteLen(s) { return Buffer.byteLength(s, 'utf8'); }

function digestJson(doc, targetBytes) {
  const out = {};
  const kept = [];
  const perField = Math.max(400, Math.floor(targetBytes / 8));
  let consumed = 0;
  for (const key of SIGNAL_FIELDS) {
    if (!(key in doc)) continue;
    const v = doc[key];
    if (v === undefined || v === null) continue;
    let s = JSON.stringify(v);
    if (byteLen(s) > perField) {
      if (Array.isArray(v)) {
        const items = [];
        let acc = 2;
        for (const it of v) {
          const si = JSON.stringify(it);
          if (acc + byteLen(si) + 1 > perField) break;
          items.push(it);
          acc += byteLen(si) + 1;
        }
        s = items.length < v.length ? JSON.stringify({ __digest_kept: items.length, __digest_total: v.length, items }) : JSON.stringify(items);
      } else if (typeof v === 'string') {
        s = JSON.stringify(v.slice(0, perField - 2));
      } else if (typeof v === 'object') {
        const sh = {};
        let acc = 2;
        for (const [k, val] of Object.entries(v)) {
          const ps = byteLen(JSON.stringify({ [k]: val }));
          if (acc + ps > perField) break;
          sh[k] = val;
          acc += ps;
        }
        s = JSON.stringify(sh);
      }
    }
    const fl = byteLen(s);
    if (consumed + fl > targetBytes && kept.length > 0) break;
    out[key] = JSON.parse(s);
    kept.push(key);
    consumed += fl;
  }
  return { digest: JSON.stringify(out, null, 2), keptKeys: kept };
}

function smartSlice(raw, targetBytes) {
  const m = DIGEST_MARKER;
  const mb = byteLen(m);
  if (targetBytes <= mb * 2) return raw.slice(0, targetBytes);
  const budget = targetBytes - mb;
  const head = Math.floor(budget * 0.6);
  const tail = budget - head;
  return raw.slice(0, head) + m + raw.slice(raw.length - tail);
}

function digestUpstream(raw, targetBytes, opts = {}) {
  const r = typeof raw === 'string' ? raw : '';
  const ob = byteLen(r);
  if (ob <= targetBytes) {
    return { digest: r, mode: 'raw', originalBytes: ob, digestBytes: ob, compressionRatio: 1, sectionsKept: [] };
  }
  const mode = opts.mode || 'smart';
  if (mode === 'truncate') {
    const s = r.slice(0, targetBytes);
    return { digest: s, mode: 'legacy_truncate', originalBytes: ob, digestBytes: byteLen(s), compressionRatio: ob / (byteLen(s) || 1), sectionsKept: [] };
  }
  try {
    const p = tryParseJson(r);
    if (p && typeof p === 'object' && !Array.isArray(p)) {
      const { digest, keptKeys } = digestJson(p, targetBytes);
      const db = byteLen(digest);
      if (db <= targetBytes && keptKeys.length > 0) {
        return { digest, mode: 'json', originalBytes: ob, digestBytes: db, compressionRatio: ob / db, sectionsKept: keptKeys };
      }
    }
  } catch {}
  const s = smartSlice(r, targetBytes);
  return { digest: s, mode: 'smart_slice', originalBytes: ob, digestBytes: byteLen(s), compressionRatio: ob / (byteLen(s) || 1), sectionsKept: [] };
}

// T1: raw passthrough
(function() {
  const r = digestUpstream('hello world', 1000);
  assert.equal(r.mode, 'raw');
  assert.equal(r.digest, 'hello world');
  console.log('OK: test_raw_passthrough');
})();

// T2: JSON digest
(function() {
  const big = {
    executive_summary: 'EBITDA down 5% YoY, WACC pressure from TRY rates.',
    findings: [{ finding_id: 'F1', severity: 'high', issue: 'DCF terminal g too high' }, { finding_id: 'F2', severity: 'medium', issue: 'Missing CoE benchmark' }],
    metrics_array: Array.from({ length: 100 }, (_, i) => ({ id: `MM-${String(i).padStart(3, '0')}`, value: i * 10 })),
    filler_field_that_should_be_dropped: 'x'.repeat(50000),
  };
  const raw = JSON.stringify(big);
  assert.ok(byteLen(raw) > 20000);
  const r = digestUpstream(raw, 5000);
  assert.equal(r.mode, 'json');
  assert.ok(r.digestBytes <= 5000);
  assert.ok(r.sectionsKept.includes('executive_summary'));
  assert.ok(r.sectionsKept.includes('findings'));
  assert.ok(!r.digest.includes('filler_field_that_should_be_dropped'));
  console.log(`OK: test_json_digest (kept: ${r.sectionsKept.join(', ')}, ratio=${r.compressionRatio.toFixed(1)}x)`);
})();

// T3: smart slice head + tail
(function() {
  const head = 'BEGIN:::' + 'a'.repeat(20000);
  const middle = 'MIDDLE:::' + 'b'.repeat(60000);
  const tail = 'c'.repeat(20000) + ':::END_CRITICAL_FINDING';
  const raw = head + middle + tail;
  const r = digestUpstream(raw, 20000);
  assert.equal(r.mode, 'smart_slice');
  assert.ok(r.digest.startsWith('BEGIN:::'));
  assert.ok(r.digest.endsWith(':::END_CRITICAL_FINDING'));
  assert.ok(r.digest.includes('[... digest:'));
  console.log('OK: test_smart_slice_head_and_tail');
})();

// T4: legacy truncate
(function() {
  const raw = 'x'.repeat(100000);
  const r = digestUpstream(raw, 15000, { mode: 'truncate' });
  assert.equal(r.mode, 'legacy_truncate');
  assert.equal(byteLen(r.digest), 15000);
  console.log('OK: test_legacy_truncate');
})();

// T5: null safety
(function() {
  assert.equal(digestUpstream(null, 100).digest, '');
  assert.equal(digestUpstream(undefined, 100).digest, '');
  console.log('OK: test_null_safety');
})();

// T6: EBITDA scenario — tail finding rescued by smart slice
(function() {
  const frame = '## Analysis\n' + 'intro text '.repeat(1000);
  const filler = 'dense narrative prose repeating analysis details. '.repeat(1200);
  const ebitda = '\n\n## Critical Finding: EBITDA calculation off by 18%, see reconciliation note 4.\n';
  const raw = frame + filler + ebitda;
  const legacy = digestUpstream(raw, 15000, { mode: 'truncate' }).digest;
  const smart = digestUpstream(raw, 15000, { mode: 'smart' }).digest;
  assert.ok(!legacy.includes('EBITDA calculation off'));
  assert.ok(smart.includes('EBITDA calculation off'));
  console.log('OK: test_ebitda_scenario');
})();

console.log('\nAll tests passed.');
