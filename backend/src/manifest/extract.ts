/**
 * Manifest extractor — Phase 5A observe-only.
 *
 * Takes the raw output string of a single agent run and produces a compact
 * AgentOutputManifest. The extractor NEVER throws: malformed output yields a
 * minimal manifest with extraction_mode='heuristic' and empty catalog arrays.
 *
 * Two-pass strategy:
 *   1) JSON parse (progressive — same fallback chain as compose.ts).
 *      If successful, pull structured fields verbatim (metrics_array[].id,
 *      findings[].finding_id, addressed_findings[].finding_id,
 *      evidence_refs[].source_type, interpretations[], etc.)
 *   2) Regex pass on the prose (always runs — picks up MM-XX / NH-XXX /
 *      finding id mentions even in markdown). Merged with JSON pass.
 *
 * Cost discipline: the manifest is capped to ~16 KB when serialized; if
 * sections get too large they are truncated to the most information-rich
 * prefix and a trailing summary section records the truncation.
 */

import {
  MANIFEST_SCHEMA_VERSION,
  TRUNCATION_RISK_BYTES,
  type AgentOutputManifest,
  type ManifestSection,
} from './types.js';

const MANIFEST_MAX_BYTES = 16_000;

const CANONICAL_ID_PATTERN = /\b(MM-[0-9]{2}|NH-[0-9]{3}|CT-[0-9]{3}|OI-[0-9]{3}|IAS29-[0-9]{3}|SR-[a-z_]+-[0-9]{3}|TM-[A-Z]{3,5})\b/g;
const FINDING_ID_PATTERN = /\bfinding[_-]?id["'\s:]+([A-Za-z0-9_-]{3,40})/gi;
const SECTION_HEADING_PATTERN = /^#{1,3}\s+(.+?)\s*$/gm;
const JSON_FENCE_PATTERN = /```json\s*([\s\S]*?)```/i;
const JSON_FALLBACK_FENCE_PATTERN = /```\s*(\{[\s\S]*?\})\s*```/;

const EVIDENCE_SOURCE_TYPES = new Set([
  'kap_disclosure',
  'financial_statement_balance_sheet',
  'financial_statement_income',
  'financial_statement_cashflow',
  'annual_report',
  'activity_report',
  'footnote',
  'press_release',
  'regulatory_filing',
  'market_data_feed',
  'analyst_estimate',
  'management_commentary',
  'computed_ratio',
  'peer_comparison',
  'macro_indicator',
  'internal_inference',
]);

function tryParseJson(raw: string): unknown | null {
  const text = raw.trim();
  try { return JSON.parse(text); } catch { /* fall through */ }
  const fenced = text.match(JSON_FENCE_PATTERN) || text.match(JSON_FALLBACK_FENCE_PATTERN);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()); } catch { /* fall through */ }
  }
  const firstBrace = text.indexOf('{');
  if (firstBrace < 0) return null;
  let depth = 0;
  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(text.slice(firstBrace, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

function dedup<T>(xs: T[]): T[] { return Array.from(new Set(xs)); }

function collectCanonicalRefs(text: string): string[] {
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  // `matchAll` would be cleaner but requires ES2020 lib target everywhere.
  CANONICAL_ID_PATTERN.lastIndex = 0;
  while ((match = CANONICAL_ID_PATTERN.exec(text)) !== null) {
    found.add(match[1]);
  }
  return Array.from(found).sort();
}

function splitCanonicalRefs(refs: string[]): {
  metric_ids: string[];
  missing_data_codes: string[];
  all: string[];
} {
  const metrics: string[] = [];
  const missing: string[] = [];
  for (const ref of refs) {
    if (ref.startsWith('MM-')) metrics.push(ref);
    else if (ref.startsWith('NH-')) missing.push(ref);
  }
  return { metric_ids: metrics, missing_data_codes: missing, all: refs };
}

function collectFindingIdsFromProse(text: string): string[] {
  const found = new Set<string>();
  FINDING_ID_PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = FINDING_ID_PATTERN.exec(text)) !== null) {
    if (m[1]) found.add(m[1]);
  }
  return Array.from(found);
}

function pickStringArray(value: unknown, key: string): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const v = (item as Record<string, unknown>)[key];
    if (typeof v === 'string' && v.length > 0) out.push(v);
  }
  return out;
}

function countEvidenceRefs(doc: Record<string, unknown>): {
  count: number;
  source_types: string[];
} {
  const tally = new Map<string, number>();
  let count = 0;

  const visit = (node: unknown): void => {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;
    if (Array.isArray(obj.evidence_refs)) {
      for (const ref of obj.evidence_refs) {
        if (ref && typeof ref === 'object') {
          count++;
          const src = (ref as Record<string, unknown>).source_type;
          if (typeof src === 'string' && EVIDENCE_SOURCE_TYPES.has(src)) {
            tally.set(src, (tally.get(src) ?? 0) + 1);
          }
        }
      }
    }
    for (const value of Object.values(obj)) visit(value);
  };
  visit(doc);

  return {
    count,
    source_types: Array.from(tally.keys()).sort(),
  };
}

function buildSectionsFromProse(raw: string): ManifestSection[] {
  const sections: ManifestSection[] = [];
  SECTION_HEADING_PATTERN.lastIndex = 0;
  const headings: Array<{ title: string; offset: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = SECTION_HEADING_PATTERN.exec(raw)) !== null) {
    headings.push({ title: m[1].trim().slice(0, 120), offset: m.index });
  }
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const nextOffset = i + 1 < headings.length ? headings[i + 1].offset : raw.length;
    sections.push({
      id: `sec-${i + 1}`,
      title: h.title,
      offset: h.offset,
      length: nextOffset - h.offset,
    });
  }
  return sections;
}

function buildSectionsFromJson(doc: Record<string, unknown>, raw: string): ManifestSection[] {
  // Strategy: top-level keys of the JSON doc become sections. offset/length
  // refer back to the raw string's position. For deeply nested docs we cap
  // at the first 12 top-level keys to keep the manifest under budget.
  const sections: ManifestSection[] = [];
  const keys = Object.keys(doc).slice(0, 12);
  for (const key of keys) {
    const needle = `"${key}"`;
    const idx = raw.indexOf(needle);
    if (idx < 0) continue;
    sections.push({
      id: key,
      title: key,
      offset: idx,
      length: Math.max(0, Math.min(raw.length - idx, 4000)),
    });
  }
  return sections;
}

export type ExtractContext = {
  agentId: string;
  ticker: string | null;
  runtimeMode: string | null;
};

export function extractManifest(
  rawOutput: string,
  ctx: ExtractContext,
): AgentOutputManifest {
  const t0 = Date.now();
  const raw = typeof rawOutput === 'string' ? rawOutput : '';
  const rawBytes = Buffer.byteLength(raw, 'utf8');
  const truncation_risk = rawBytes > TRUNCATION_RISK_BYTES;

  const prose_canonical_refs = collectCanonicalRefs(raw);
  const prose_finding_ids = collectFindingIdsFromProse(raw);
  const parsed = tryParseJson(raw);

  let extraction_mode: 'json' | 'heuristic' | 'mixed' = 'heuristic';
  let json_canonical_refs: string[] = [];
  let metric_ids: string[] = [];
  let finding_ids: string[] = [];
  let addressed_finding_ids: string[] = [];
  let evidence_ref_count = 0;
  let evidence_source_types: string[] = [];
  let has_interpretations = false;
  let has_engine_snapshot = false;
  let has_metrics_array = false;
  let has_claims = false;
  let has_findings = false;
  let has_addressed_findings = false;
  let sections: ManifestSection[] = [];

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    extraction_mode = 'json';
    const doc = parsed as Record<string, unknown>;

    metric_ids = pickStringArray(doc.metrics_array, 'id');
    finding_ids = pickStringArray(doc.findings, 'finding_id');
    addressed_finding_ids = pickStringArray(doc.addressed_findings, 'finding_id');

    has_metrics_array = Array.isArray(doc.metrics_array) && (doc.metrics_array as unknown[]).length > 0;
    has_claims = Array.isArray(doc.claims) && (doc.claims as unknown[]).length > 0;
    has_findings = Array.isArray(doc.findings) && (doc.findings as unknown[]).length > 0;
    has_addressed_findings = Array.isArray(doc.addressed_findings) && (doc.addressed_findings as unknown[]).length > 0;
    has_interpretations = Array.isArray(doc.interpretations) && (doc.interpretations as unknown[]).length > 0;
    has_engine_snapshot = typeof doc.engine_snapshot === 'object' && doc.engine_snapshot !== null;

    const ev = countEvidenceRefs(doc);
    evidence_ref_count = ev.count;
    evidence_source_types = ev.source_types;

    // Canonical refs from JSON payload, in addition to prose matches.
    json_canonical_refs = collectCanonicalRefs(JSON.stringify(doc));
    sections = buildSectionsFromJson(doc, raw);
    if (sections.length === 0 && prose_canonical_refs.length > 0) {
      // JSON was present but sections fell through — merge heuristic.
      sections = buildSectionsFromProse(raw);
      if (sections.length > 0) extraction_mode = 'mixed';
    }
  } else {
    sections = buildSectionsFromProse(raw);
  }

  const merged_refs = dedup([...prose_canonical_refs, ...json_canonical_refs]).sort();
  const split = splitCanonicalRefs(merged_refs);
  const merged_finding_ids = dedup([...finding_ids, ...prose_finding_ids]);

  // Merge metric_ids — prefer structured ids but include prose-only MM refs.
  const merged_metric_ids = dedup([...metric_ids, ...split.metric_ids]);

  // Serialize once to measure size, then trim if we overshot the budget.
  let manifest: AgentOutputManifest = {
    schema_version: MANIFEST_SCHEMA_VERSION,
    agent_id: ctx.agentId,
    ticker: ctx.ticker,
    runtime_mode: ctx.runtimeMode,

    raw_output_bytes: rawBytes,
    manifest_bytes: 0, // filled in below
    compression_ratio: 0,
    truncation_risk,

    sections,
    metric_ids: merged_metric_ids,
    finding_ids: merged_finding_ids,
    addressed_finding_ids,
    evidence_ref_count,
    evidence_source_types,
    missing_data_codes: split.missing_data_codes,
    canonical_refs: merged_refs,

    has_interpretations,
    has_engine_snapshot,
    has_metrics_array,
    has_claims,
    has_findings,
    has_addressed_findings,

    extraction_mode,
    extraction_duration_ms: 0,
    generated_at: new Date().toISOString(),
  };

  let serialized = JSON.stringify(manifest);
  if (Buffer.byteLength(serialized, 'utf8') > MANIFEST_MAX_BYTES) {
    // Too fat — drop sections past 6, then canonical_refs past 40.
    manifest = {
      ...manifest,
      sections: manifest.sections.slice(0, 6),
      canonical_refs: manifest.canonical_refs.slice(0, 40),
      metric_ids: manifest.metric_ids.slice(0, 40),
      finding_ids: manifest.finding_ids.slice(0, 40),
    };
    serialized = JSON.stringify(manifest);
  }
  const manifestBytes = Buffer.byteLength(serialized, 'utf8');
  manifest.manifest_bytes = manifestBytes;
  manifest.compression_ratio = manifestBytes > 0
    ? Number((rawBytes / manifestBytes).toFixed(2))
    : 0;
  manifest.extraction_duration_ms = Date.now() - t0;
  return manifest;
}
