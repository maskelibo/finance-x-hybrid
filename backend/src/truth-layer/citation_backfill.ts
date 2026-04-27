/**
 * Financial Truth Layer — Citation Backfill (P3.delta v1).
 *
 * Deterministic-only citation layer that normalizes structured upstream
 * signals into canonical Citation records and annotates claims from
 * P3.alpha (contradiction findings) + P3.gamma (chairman questions)
 * with citation references.
 *
 * Design rules (per scope, P3.delta):
 *   - additive only — accumulatedContext gains 2 optional keys; nothing else
 *   - no schema break, no production override, no S-block regression
 *   - no report_formatter consumption in v1 (output captured for log only)
 *   - no LLM calls; no raw PDF parsing; no narrative parsing
 *   - no fabrication: when no structured source exists, claim stays uncited
 *
 * Public API:
 *   runCitationBackfill(ticker, ctx)         — main entry
 *   logCitationBackfillSummary(report)       — orchestrator log helper
 *
 * Output written to:
 *   accumulatedContext['citation_report']
 *   accumulatedContext['citation_report_json']
 */

import { createHash } from 'node:crypto';
import { readTruthAssertions } from './preflight.js';
import type { ContradictionFinding, ContradictionReport } from './contradiction_hunter.js';
import type {
  ChairmanQuestion,
  ChairmanQuestionReport,
  QuestionCategory,
} from './chairman_anticipator.js';

// =============================================================================
// Types
// =============================================================================

export type CitationSourceType =
  | 'kap_disclosure'
  | 'fa_red_flag'
  | 'fa_metric'
  | 'fa_confidence'
  | 'truth_assertion'
  | 'synthesis_divergence'
  | 'synthesis_score'
  | 'methodology_decision'
  | 'contradiction_finding';

export type CitationConfidence = 'authoritative' | 'derived' | 'inferred';

export interface Citation {
  id: string;
  source_type: CitationSourceType;
  source_ref: string;
  excerpt: string;
  confidence: CitationConfidence;
}

export type ClaimOrigin = 'contradiction_finding' | 'chairman_question';
export type CitationStatus = 'cited' | 'partial' | 'uncited';
export type RequiredCoverage = 'must' | 'should' | 'optional';

export interface ClaimAnnotation {
  claim_id: string;
  claim_origin: ClaimOrigin;
  claim_severity_or_confidence: string;
  required_coverage: RequiredCoverage;
  citation_ids: string[];
  status: CitationStatus;
}

export interface CitationReport {
  ticker: string;
  generated_at: string;
  citations: Citation[];
  claim_annotations: ClaimAnnotation[];
  source_count: number;
  by_status: Record<CitationStatus, number>;
  by_required_coverage: Record<RequiredCoverage, number>;
  uncited_must_count: number;
  warnings: string[];
}

export const CITATION_CONTEXT_KEYS = {
  REPORT: 'citation_report',
  REPORT_JSON: 'citation_report_json',
} as const;

const EXCERPT_CAP = 180;

// =============================================================================
// Helpers
// =============================================================================

function citationId(ticker: string, sourceType: CitationSourceType, sourceRef: string): string {
  const h = createHash('sha1').update(`${ticker}|${sourceType}|${sourceRef}`).digest('hex').slice(0, 10);
  return `ct-${h}`;
}

function clip(s: string, n = EXCERPT_CAP): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function parseJsonLoose(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed) as Record<string, unknown>; } catch { return null; }
}

// =============================================================================
// Source extractors — produce deduplicated Citation records
// =============================================================================

class CitationIndex {
  private byKey = new Map<string, Citation>();   // key = `${source_type}|${source_ref}`
  constructor(private readonly ticker: string) {}

  add(c: Omit<Citation, 'id'>): Citation {
    const key = `${c.source_type}|${c.source_ref}`;
    const existing = this.byKey.get(key);
    if (existing) return existing;
    const id = citationId(this.ticker, c.source_type, c.source_ref);
    const full: Citation = { id, ...c };
    this.byKey.set(key, full);
    return full;
  }

  /** Look up an existing citation by source_type + source_ref; null if absent. */
  get(sourceType: CitationSourceType, sourceRef: string): Citation | null {
    return this.byKey.get(`${sourceType}|${sourceRef}`) ?? null;
  }

  /** All registered citations in insertion order. */
  list(): Citation[] {
    return Array.from(this.byKey.values());
  }
}

function extractKapDisclosures(ticker: string, ctx: Record<string, unknown>, idx: CitationIndex): void {
  // Prefer FTL-blessed selection
  const truth = readTruthAssertions(ctx);
  if (truth?.filing_selection?.selected) {
    const f = truth.filing_selection.selected;
    idx.add({
      source_type: 'kap_disclosure',
      source_ref: `kap:${f.filing_id}`,
      excerpt: clip(`KAP filing ${f.filing_id} — ${f.document_type}${f.title ? ` (${f.title})` : ''}`),
      confidence: 'authoritative',
    });
  }
  // Pull all financial_reports from the data manifest
  const dc = parseJsonLoose(ctx['data_collection_output']);
  const manifest = dc && typeof dc['data_manifest'] === 'object' ? dc['data_manifest'] as Record<string, unknown> : null;
  const reports = manifest && Array.isArray(manifest['financial_reports'])
    ? (manifest['financial_reports'] as Array<Record<string, unknown>>)
    : [];
  for (const r of reports) {
    const did = String(r['disclosure_id'] ?? '').trim();
    if (!did) continue;
    const title = String(r['title'] ?? '');
    const period = String(r['period_label'] ?? '');
    idx.add({
      source_type: 'kap_disclosure',
      source_ref: `kap:${did}`,
      excerpt: clip(`KAP filing ${did}${period ? ` (${period})` : ''}${title ? ` — ${title}` : ''}`),
      confidence: 'authoritative',
    });
  }
}

function extractFaSignals(ticker: string, ctx: Record<string, unknown>, idx: CitationIndex): void {
  const fa = parseJsonLoose(ctx['financial_analysis_output']);
  if (!fa) return;
  const conf = typeof fa['confidence'] === 'string' ? (fa['confidence'] as string) : null;
  if (conf) {
    idx.add({
      source_type: 'fa_confidence',
      source_ref: `fa_confidence:${conf}`,
      excerpt: `FA confidence=${conf}`,
      confidence: 'derived',
    });
  }
  const flags = Array.isArray(fa['red_flags']) ? (fa['red_flags'] as Array<Record<string, unknown>>) : [];
  for (const f of flags) {
    const code = String(f['code'] ?? '').trim();
    if (!code) continue;
    const severity = String(f['severity'] ?? '');
    const msg = typeof f['message'] === 'string' ? (f['message'] as string) : '';
    idx.add({
      source_type: 'fa_red_flag',
      source_ref: `fa_red_flag:${code}`,
      excerpt: clip(`${code}${severity ? ` severity=${severity}` : ''}${msg ? ` — ${msg}` : ''}`),
      confidence: 'derived',
    });
  }
  const highlights = Array.isArray(fa['highlights']) ? (fa['highlights'] as Array<Record<string, unknown>>)
    : Array.isArray(fa['metrics']) ? (fa['metrics'] as Array<Record<string, unknown>>) : [];
  for (const h of highlights) {
    const code = String(h['code'] ?? '').trim();
    if (!code) continue;
    const value = h['value'];
    idx.add({
      source_type: 'fa_metric',
      source_ref: `fa_metric:${code}`,
      excerpt: clip(`${code}=${value ?? '?'}`),
      confidence: 'derived',
    });
  }
}

function extractTruthAssertions(ticker: string, ctx: Record<string, unknown>, idx: CitationIndex): void {
  const truth = readTruthAssertions(ctx);
  if (!truth) return;
  const c = truth.classification;
  const subFlags = c.sub_classifications.length > 0 ? ` sub=[${c.sub_classifications.join(',')}]` : '';
  idx.add({
    source_type: 'truth_assertion',
    source_ref: 'ftl:classification',
    excerpt: clip(`${c.sector_canonical}${subFlags} holding=${c.is_holding} banking=${c.is_banking} conf=${c.confidence.toFixed(2)}`),
    confidence: 'authoritative',
  });
  const w = truth.valuation_methodology;
  idx.add({
    source_type: 'truth_assertion',
    source_ref: 'ftl:methodology:primary_method',
    excerpt: clip(`primary=${w.primary_method} conf=${w.confidence.toFixed(2)}`),
    confidence: 'authoritative',
  });
  idx.add({
    source_type: 'truth_assertion',
    source_ref: 'ftl:methodology:weights',
    excerpt: clip(`weights=${JSON.stringify(w.weights)}`),
    confidence: 'authoritative',
  });
  if (truth.filing_selection) {
    idx.add({
      source_type: 'truth_assertion',
      source_ref: 'ftl:filing_selection',
      excerpt: clip(`selected=${truth.filing_selection.selected?.filing_id ?? 'none'} conf=${truth.filing_selection.confidence.toFixed(2)}`),
      confidence: 'authoritative',
    });
  }

  // Methodology decision (separate type — captures the weighter justification)
  const labelMatch = w.justification.match(/^\[([^\]]+)\]/);
  const label = labelMatch ? labelMatch[1] : 'unknown';
  idx.add({
    source_type: 'methodology_decision',
    source_ref: `methodology:${w.primary_method}:${label}`,
    excerpt: clip(w.justification),
    confidence: 'authoritative',
  });
}

function extractSynthesisSignals(ticker: string, ctx: Record<string, unknown>, idx: CitationIndex): void {
  const synth = parseJsonLoose(ctx['strategic_synthesis_output']);
  if (!synth) return;
  const score = synth['convergence_score'];
  const conf = synth['confidence'];
  if (score != null || conf != null) {
    idx.add({
      source_type: 'synthesis_score',
      source_ref: 'synth_score',
      excerpt: clip(`convergence_score=${score ?? '?'} confidence=${conf ?? '?'}`),
      confidence: 'derived',
    });
  }
  const divs = Array.isArray(synth['divergences']) ? (synth['divergences'] as unknown[]) : [];
  divs.forEach((d, i) => {
    const text = String(d ?? '').trim();
    if (!text) return;
    idx.add({
      source_type: 'synthesis_divergence',
      source_ref: `synth_div:${i}`,
      excerpt: clip(text),
      confidence: 'derived',
    });
  });
}

function extractContradictionFindings(ticker: string, ctx: Record<string, unknown>, idx: CitationIndex): void {
  const cReport = ctx['contradiction_report'] as ContradictionReport | undefined;
  if (!cReport || cReport.findings.length === 0) return;
  for (const f of cReport.findings) {
    idx.add({
      source_type: 'contradiction_finding',
      source_ref: `contradiction:${f.id}`,
      excerpt: clip(`[${f.severity}] ${f.type}: ${f.title}`),
      confidence: 'derived',
    });
  }
}

// =============================================================================
// Claim → citation mapping
// =============================================================================

function citationsForContradiction(
  finding: ContradictionFinding,
  idx: CitationIndex,
): string[] {
  const ids: string[] = [];
  const tryAdd = (sourceType: CitationSourceType, sourceRef: string) => {
    const c = idx.get(sourceType, sourceRef);
    if (c) ids.push(c.id);
  };

  switch (finding.type) {
    case 'valuation_method_mismatch':
      tryAdd('truth_assertion', 'ftl:methodology:primary_method');
      tryAdd('truth_assertion', 'ftl:methodology:weights');
      tryAdd('methodology_decision', `methodology:${finding.evidence['ftl_primary_method'] ?? '?'}:${finding.evidence['ftl_classification'] ?? '?'}`);
      break;
    case 'target_spread':
      // structured DCF/SOTP targets — only cited if those specific values exist as fa_metric
      tryAdd('fa_metric', 'fa_metric:DCF_TARGET');
      tryAdd('fa_metric', 'fa_metric:SOTP_TARGET');
      break;
    case 'thesis_vs_valuation':
      // No structured source for recommendation/upside in v1 — likely uncited
      break;
    case 'confidence_vs_conviction':
      tryAdd('fa_confidence', `fa_confidence:${finding.evidence['fa_confidence'] ?? 'low'}`);
      tryAdd('synthesis_score', 'synth_score');
      break;
    case 'financial_red_flag_vs_narrative':
      // Cite all FA red flags + synth score
      for (const c of idx.list()) {
        if (c.source_type === 'fa_red_flag') ids.push(c.id);
      }
      tryAdd('synthesis_score', 'synth_score');
      break;
    case 'synthesis_divergence': {
      const text = String(finding.evidence['divergence_text'] ?? '');
      // Find the matching synth_div by excerpt content
      for (const c of idx.list()) {
        if (c.source_type === 'synthesis_divergence' && c.excerpt.includes(text.slice(0, 50))) {
          ids.push(c.id);
          break;
        }
      }
      break;
    }
  }
  return Array.from(new Set(ids));
}

const FA_CRITICAL_FLAG_RE = /critical_flag_count|critical[\s_-]?flag/i;
const FTL_PRIMARY_RE = /primary_method|FTL\.primary|methodology\.primary/i;
const FTL_WEIGHTS_RE = /weights|methodology\.weights/i;
const FTL_CLASSIFICATION_RE = /classification|FTL\.class|sector_canonical|holding_banking/i;
const SYNTH_SCORE_RE = /convergence_score|synthesis\.score|synth_score/i;
const KAP_RE = /^kap:|disclosure_id|filing_id|kap_disclosure/i;
const CONTRADICTION_RE = /^contradiction:/;
const SYNTH_DIV_RE = /synth_div|synthesis\.divergences?|divergence\[/;
const FA_RED_FLAG_CODE_RE = /^(?:fa[._]red_flag:)?([A-Z][A-Z0-9_]{2,})/;

function citationsForChairmanQuestion(
  q: ChairmanQuestion,
  idx: CitationIndex,
  warnings: string[],
): { ids: string[]; matchedRefs: number; totalRefs: number } {
  const ids = new Set<string>();
  const tryAdd = (sourceType: CitationSourceType, sourceRef: string): boolean => {
    const c = idx.get(sourceType, sourceRef);
    if (c) { ids.add(c.id); return true; }
    return false;
  };

  // 1) evidence_refs from LLM — canonicalize each
  const refs = q.evidence_refs ?? [];
  let matched = 0;
  for (const ref of refs) {
    const rstr = String(ref).trim();
    if (!rstr) continue;
    let hit = false;

    if (CONTRADICTION_RE.test(rstr)) {
      // Direct contradiction reference
      hit = tryAdd('contradiction_finding', rstr);
    } else if (KAP_RE.test(rstr)) {
      // Try to extract filing_id digits or direct kap: prefix
      const m = rstr.match(/(?:kap:|disclosure_id[=:]|filing_id[=:])(\d+)/i)
        ?? rstr.match(/^kap:(\S+)/i);
      const fid = m ? m[1] : null;
      if (fid) hit = tryAdd('kap_disclosure', `kap:${fid}`);
    } else if (FTL_PRIMARY_RE.test(rstr)) {
      hit = tryAdd('truth_assertion', 'ftl:methodology:primary_method');
    } else if (FTL_WEIGHTS_RE.test(rstr)) {
      hit = tryAdd('truth_assertion', 'ftl:methodology:weights');
    } else if (FTL_CLASSIFICATION_RE.test(rstr)) {
      hit = tryAdd('truth_assertion', 'ftl:classification');
    } else if (SYNTH_SCORE_RE.test(rstr)) {
      hit = tryAdd('synthesis_score', 'synth_score');
    } else if (SYNTH_DIV_RE.test(rstr)) {
      // Cite all known divergences
      for (const c of idx.list()) {
        if (c.source_type === 'synthesis_divergence') { ids.add(c.id); hit = true; }
      }
    } else if (FA_CRITICAL_FLAG_RE.test(rstr)) {
      // Cite all FA red flags + fa_confidence
      for (const c of idx.list()) {
        if (c.source_type === 'fa_red_flag') { ids.add(c.id); hit = true; }
      }
    } else {
      // Try to detect FA red flag code (e.g., 'ALTMAN_Z' raw)
      const codeMatch = rstr.match(FA_RED_FLAG_CODE_RE);
      if (codeMatch) {
        hit = tryAdd('fa_red_flag', `fa_red_flag:${codeMatch[1]}`);
      }
    }

    if (hit) matched++;
    else warnings.push(`unmatched_evidence_ref:${q.id}:${rstr.slice(0, 60)}`);
  }

  // 2) Category-driven fallback (only adds; does not remove unmatched warnings)
  if (q.category === 'financial_risk_challenge') {
    for (const c of idx.list()) {
      if (c.source_type === 'fa_red_flag') ids.add(c.id);
    }
    tryAdd('fa_confidence', 'fa_confidence:low');
    tryAdd('fa_confidence', 'fa_confidence:medium');
    tryAdd('fa_confidence', 'fa_confidence:high');
  }
  if (q.category === 'valuation_challenge') {
    tryAdd('truth_assertion', 'ftl:methodology:primary_method');
    tryAdd('truth_assertion', 'ftl:methodology:weights');
  }
  if (q.category === 'methodology_challenge') {
    tryAdd('truth_assertion', 'ftl:methodology:primary_method');
    tryAdd('truth_assertion', 'ftl:classification');
  }

  return { ids: Array.from(ids), matchedRefs: matched, totalRefs: refs.length };
}

// =============================================================================
// Required coverage rules
// =============================================================================

function coverageForContradiction(severity: string): RequiredCoverage {
  if (severity === 'high') return 'must';
  if (severity === 'medium') return 'should';
  return 'optional';
}

function coverageForQuestion(q: ChairmanQuestion): RequiredCoverage {
  // Category overrides take precedence
  if (q.category === 'financial_risk_challenge') return 'must';
  if (q.category === 'valuation_challenge' && (q.confidence === 'high' || q.confidence === 'medium')) return 'must';
  // Confidence-based
  if (q.confidence === 'high') return 'must';
  if (q.confidence === 'medium') return 'should';
  return 'optional';
}

// =============================================================================
// Aggregator (main entry)
// =============================================================================

export function runCitationBackfill(
  ticker: string,
  accumulatedContext: Record<string, unknown>,
): CitationReport {
  const idx = new CitationIndex(ticker);
  const warnings: string[] = [];

  // Build the citation index from all 9 source types
  extractKapDisclosures(ticker, accumulatedContext, idx);
  extractFaSignals(ticker, accumulatedContext, idx);
  extractTruthAssertions(ticker, accumulatedContext, idx);
  extractSynthesisSignals(ticker, accumulatedContext, idx);
  extractContradictionFindings(ticker, accumulatedContext, idx);

  // Annotate claims
  const annotations: ClaimAnnotation[] = [];

  const cReport = accumulatedContext['contradiction_report'] as ContradictionReport | undefined;
  for (const f of cReport?.findings ?? []) {
    const ids = citationsForContradiction(f, idx);
    const required = coverageForContradiction(f.severity);
    annotations.push({
      claim_id: `contradiction:${f.id}`,
      claim_origin: 'contradiction_finding',
      claim_severity_or_confidence: f.severity,
      required_coverage: required,
      citation_ids: ids,
      status: ids.length === 0 ? 'uncited' : 'cited',
    });
  }

  const qReport = accumulatedContext['chairman_questions'] as ChairmanQuestionReport | undefined;
  for (const q of qReport?.questions ?? []) {
    const { ids, matchedRefs, totalRefs } = citationsForChairmanQuestion(q, idx, warnings);
    const required = coverageForQuestion(q);
    let status: CitationStatus;
    if (ids.length === 0) status = 'uncited';
    else if (totalRefs > 0 && matchedRefs < totalRefs) status = 'partial';
    else status = 'cited';
    annotations.push({
      claim_id: `question:${q.id}`,
      claim_origin: 'chairman_question',
      claim_severity_or_confidence: q.confidence,
      required_coverage: required,
      citation_ids: ids,
      status,
    });
  }

  // Aggregate stats
  const byStatus: Record<CitationStatus, number> = { cited: 0, partial: 0, uncited: 0 };
  const byRequired: Record<RequiredCoverage, number> = { must: 0, should: 0, optional: 0 };
  let uncitedMust = 0;
  for (const a of annotations) {
    byStatus[a.status]++;
    byRequired[a.required_coverage]++;
    if (a.required_coverage === 'must' && a.status === 'uncited') uncitedMust++;
  }

  if (uncitedMust > 0) {
    warnings.push(`uncited_must_count=${uncitedMust} — boardroom-grade citation gap`);
  }

  const citations = idx.list();
  const report: CitationReport = {
    ticker,
    generated_at: new Date().toISOString(),
    citations,
    claim_annotations: annotations,
    source_count: citations.length,
    by_status: byStatus,
    by_required_coverage: byRequired,
    uncited_must_count: uncitedMust,
    warnings,
  };

  accumulatedContext[CITATION_CONTEXT_KEYS.REPORT] = report;
  accumulatedContext[CITATION_CONTEXT_KEYS.REPORT_JSON] = JSON.stringify(report);
  return report;
}

// =============================================================================
// Log helper
// =============================================================================

export function logCitationBackfillSummary(report: CitationReport): void {
  const totalAnn = report.claim_annotations.length;
  const mustCited = report.by_required_coverage.must - report.uncited_must_count;
  const mustTotal = report.by_required_coverage.must;
  console.log(
    `[citation-backfill] ticker=${report.ticker} citations=${report.source_count} ` +
      `annotations=${totalAnn} must_cited=${mustCited}/${mustTotal} ` +
      `partial=${report.by_status.partial} uncited=${report.by_status.uncited} ` +
      `uncited_must=${report.uncited_must_count} warnings=${report.warnings.length}`,
  );
  if (report.uncited_must_count > 0) {
    for (const a of report.claim_annotations) {
      if (a.required_coverage === 'must' && a.status === 'uncited') {
        console.warn(`[citation-backfill]   UNCITED MUST: ${a.claim_id} (${a.claim_origin}, ${a.claim_severity_or_confidence})`);
      }
    }
  }
}
