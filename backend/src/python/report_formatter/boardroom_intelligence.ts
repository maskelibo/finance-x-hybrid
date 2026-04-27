/**
 * Boardroom Intelligence renderer (P4.alpha v1).
 *
 * Pure leaf-layer module. Reads three optional fields from
 * accumulatedContext and produces three HTML snippets ready to be
 * inserted into the template via {{&placeholder}} (unescaped). The
 * accumulatedContext itself is read-only; this module never writes
 * back to it.
 *
 * Inputs (all optional):
 *   accumulatedContext['contradiction_report'] (P3.alpha)
 *   accumulatedContext['chairman_questions']   (P3.gamma)
 *   accumulatedContext['citation_report']      (P3.delta)
 *
 * Output: BoardroomIntelligenceContext — three HTML strings + three
 * boolean flags. Empty data → empty string + flag=false; the template
 * conditionally omits the section.
 *
 * Design rules (per scope, P4.alpha):
 *   - additive only; no compose.ts touch
 *   - no template_engine change; uses existing Mustache {{#if}}/{{&}}
 *   - all dynamic text HTML-escaped; no raw user data injected
 *   - reuses P3.beta utility classes (.fx-pill-*, .fx-no-break, .fx-subtle-surface)
 *   - no LLM calls, no schema break, no production override
 */

import type { ContradictionReport, ContradictionFinding } from '../../truth-layer/contradiction_hunter.js';
import type {
  ChairmanQuestionReport,
  ChairmanQuestion,
  QuestionConfidence,
} from '../../truth-layer/chairman_anticipator.js';
import type {
  CitationReport,
  Citation,
  CitationConfidence,
  CitationSourceType,
} from '../../truth-layer/citation_backfill.js';

// =============================================================================
// Output shape
// =============================================================================

export interface BoardroomIntelligenceContext {
  has_consistency_check: boolean;
  consistency_check_html: string;
  has_boardroom_questions: boolean;
  boardroom_questions_html: string;
  has_citation_index: boolean;
  citation_index_html: string;
}

// =============================================================================
// HTML escape — applied to ALL dynamic text since outputs go to {{&}}
// =============================================================================

export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// =============================================================================
// Severity / confidence → pill class mapping
// =============================================================================

function severityPillClass(severity: string): string {
  if (severity === 'high') return 'fx-pill-high';
  if (severity === 'medium') return 'fx-pill-medium';
  if (severity === 'low') return 'fx-pill-low';
  return 'fx-pill-neutral';
}

function questionConfidencePillClass(c: QuestionConfidence): string {
  if (c === 'high') return 'fx-pill-info';
  if (c === 'medium') return 'fx-pill-neutral';
  return 'fx-pill-neutral';
}

function citationConfidencePillClass(c: CitationConfidence): string {
  if (c === 'authoritative') return 'fx-pill-info';
  return 'fx-pill-neutral';
}

// =============================================================================
// Section 1 — Internal Consistency Check
// =============================================================================

export function renderConsistencyCheck(
  accumulatedContext: Record<string, unknown>,
): string {
  const report = accumulatedContext['contradiction_report'] as ContradictionReport | undefined;
  if (!report || report.findings.length === 0) return '';

  const counts = report.by_severity;
  const overallPill =
    counts.high > 0 ? 'fx-pill-high' :
    counts.medium > 0 ? 'fx-pill-medium' : 'fx-pill-low';

  const rows = report.findings.map((f) => renderConsistencyRow(f)).join('');

  return `
<div class="page fx-no-break" style="page-break-before: always;">
  <div class="page-inner">
    <h1>İç Tutarlılık Kontrolü</h1>
    <p style="color: var(--fx-gray); font-size: 8.5pt;">P3.alpha katmanı tarafından üretilen yapısal çapraz-agent tutarlılık taraması. Boardroom-grade observation; production output override edilmez.</p>
    <div style="margin: 10px 0 14px;">
      <span class="fx-pill ${overallPill}">${escapeHtml(report.finding_count)} bulgu</span>
      <span class="fx-pill fx-pill-high">${escapeHtml(counts.high)} high</span>
      <span class="fx-pill fx-pill-medium">${escapeHtml(counts.medium)} medium</span>
      <span class="fx-pill fx-pill-low">${escapeHtml(counts.low)} low</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 12%;">Şiddet</th>
          <th style="width: 26%;">Kategori</th>
          <th style="width: 62%;">Bulgu / Önerilen Çözüm</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <p style="font-size: 7.5pt; color: var(--fx-gray); margin-top: 14px; font-style: italic;">Üreten katman: P3.alpha Contradiction Hunter (deterministic). Bu bulgular advisory'dir; rapor içeriği bu bölüme bağımlı değildir.</p>
  </div>
</div>
`.trim();
}

function renderConsistencyRow(f: ContradictionFinding): string {
  const sevClass = severityPillClass(f.severity);
  const resolution = f.suggested_resolution
    ? `<br/><em style="font-size: 8.5pt; color: var(--fx-dark);">Öneri: ${escapeHtml(f.suggested_resolution)}</em>`
    : '';
  return `
        <tr>
          <td><span class="fx-pill ${sevClass}">${escapeHtml(f.severity)}</span></td>
          <td class="label" style="font-size: 8.5pt;">${escapeHtml(f.type)}</td>
          <td>
            <strong style="font-size: 9pt;">${escapeHtml(f.title)}</strong><br/>
            <span style="font-size: 8.5pt; color: var(--fx-gray);">${escapeHtml(f.reasoning)}</span>${resolution}
          </td>
        </tr>`;
}

// =============================================================================
// Section 2 — Anticipated Boardroom Questions
// =============================================================================

const CATEGORY_LABEL_TR: Record<string, string> = {
  valuation_challenge: 'Değerleme Sorgusu',
  financial_risk_challenge: 'Finansal Risk Sorgusu',
  methodology_challenge: 'Metodoloji Sorgusu',
  management_strategy: 'Yönetim & Strateji',
  downside_scenario: 'Aşağı Yönlü Senaryo',
};

export function renderBoardroomQuestions(
  accumulatedContext: Record<string, unknown>,
): string {
  const report = accumulatedContext['chairman_questions'] as ChairmanQuestionReport | undefined;
  if (!report || report.questions.length === 0) return '';

  const cards = report.questions.map((q) => renderQuestionCard(q)).join('');
  const sourceLabel = report.source === 'llm' ? 'LLM (Sonnet 4.6)' : 'deterministic fallback';

  return `
<div class="page fx-no-break" style="page-break-before: always;">
  <div class="page-inner">
    <h1>Yönetim Kurulu Beklenen Soruları</h1>
    <p style="color: var(--fx-gray); font-size: 8.5pt;">P3.gamma katmanı tarafından üretilen proactive Q&amp;A — chairman-level soru anticipasyonu. Cevaplar advisory'dir.</p>
    <div style="margin: 10px 0 14px;">
      <span class="fx-pill fx-pill-info">${escapeHtml(report.question_count)} soru</span>
      <span class="fx-pill fx-pill-neutral">kaynak: ${escapeHtml(sourceLabel)}</span>
    </div>
    ${cards}
    <p style="font-size: 7.5pt; color: var(--fx-gray); margin-top: 14px; font-style: italic;">Üreten katman: P3.gamma Chairman Question Anticipator. Bu sorular boardroom-grade hazırlık amaçlıdır; resmi tavsiye değildir.</p>
  </div>
</div>
`.trim();
}

function renderQuestionCard(q: ChairmanQuestion): string {
  const catLabel = CATEGORY_LABEL_TR[q.category] ?? q.category;
  const evidence = q.evidence_refs.length > 0
    ? `<div style="font-size: 7.5pt; color: var(--fx-gray); margin-top: 6px;">Kanıt: ${q.evidence_refs.map(escapeHtml).join(' &middot; ')}</div>`
    : '';
  return `
    <div class="fx-subtle-surface fx-no-break" style="margin: 10px 0;">
      <div style="margin-bottom: 6px;">
        <span class="fx-pill fx-pill-info">${escapeHtml(catLabel)}</span>
        <span class="fx-pill ${questionConfidencePillClass(q.confidence)}">conviction: ${escapeHtml(q.confidence)}</span>
      </div>
      <h4 style="font-size: 10.5pt; color: var(--brand-primary); margin: 0 0 6px;">${escapeHtml(q.question)}</h4>
      <p style="font-size: 9.5pt; margin: 0;">${escapeHtml(q.proactive_answer)}</p>
      ${evidence}
    </div>`;
}

// =============================================================================
// Section 3 — Citation / Evidence Index
// =============================================================================

const SOURCE_TYPE_LABEL_TR: Record<CitationSourceType, string> = {
  kap_disclosure: 'KAP Bildirimleri',
  fa_red_flag: 'Finansal Kırmızı Bayraklar',
  fa_metric: 'Finansal Metrikler',
  fa_confidence: 'FA Güven Sinyali',
  truth_assertion: 'FTL Truth Assertions',
  synthesis_divergence: 'Sentez Divergence',
  synthesis_score: 'Sentez Convergence Score',
  methodology_decision: 'Metodoloji Kararı',
  contradiction_finding: 'Tutarsızlık Bulgusu (P3.alpha)',
};

const SOURCE_TYPE_ORDER: CitationSourceType[] = [
  'kap_disclosure',
  'truth_assertion',
  'methodology_decision',
  'fa_red_flag',
  'fa_metric',
  'fa_confidence',
  'synthesis_score',
  'synthesis_divergence',
  'contradiction_finding',
];

export function renderCitationIndex(
  accumulatedContext: Record<string, unknown>,
): string {
  const report = accumulatedContext['citation_report'] as CitationReport | undefined;
  if (!report || report.citations.length === 0) return '';

  const groups = groupCitationsByType(report.citations);
  const groupHtml = SOURCE_TYPE_ORDER
    .filter((t) => groups[t] && groups[t].length > 0)
    .map((t) => renderCitationGroup(t, groups[t]))
    .join('');

  const uncitedAlarm = report.uncited_must_count > 0
    ? `<div class="note" style="border-left-color: var(--fx-danger); background: var(--fx-danger-light); color: #7c2d12; margin: 10px 0 14px;"><strong>⚠ Boardroom-grade citation gap:</strong> ${escapeHtml(report.uncited_must_count)} must-cite claim için yapısal kaynak bulunamadı. Detay: aşağıdaki kaynak listesinde eşleşme yok.</div>`
    : '';

  const status = report.by_status;

  return `
<div class="page fx-no-break" style="page-break-before: always;">
  <div class="page-inner">
    <h1>Kanıt İndeksi</h1>
    <p style="color: var(--fx-gray); font-size: 8.5pt;">P3.delta katmanı tarafından üretilen kanonik kaynak indeksi. Yapılandırılmış kaynaklara çapraz referans; rapor içeriği bu bölüme bağımlı değildir.</p>
    <div style="margin: 10px 0 14px;">
      <span class="fx-pill fx-pill-info">${escapeHtml(report.source_count)} kaynak</span>
      <span class="fx-pill fx-pill-low">${escapeHtml(status.cited)} cited</span>
      <span class="fx-pill fx-pill-medium">${escapeHtml(status.partial)} partial</span>
      <span class="fx-pill ${report.uncited_must_count > 0 ? 'fx-pill-high' : 'fx-pill-neutral'}">${escapeHtml(status.uncited)} uncited</span>
    </div>
    ${uncitedAlarm}
    ${groupHtml}
    <p style="font-size: 7.5pt; color: var(--fx-gray); margin-top: 14px; font-style: italic;">Üreten katman: P3.delta Citation Backfill (deterministic). Source type taxonomy: 9 kanonik kategori. No-fabrication invariant.</p>
  </div>
</div>
`.trim();
}

function groupCitationsByType(citations: Citation[]): Record<string, Citation[]> {
  const acc: Record<string, Citation[]> = {};
  for (const c of citations) {
    if (!acc[c.source_type]) acc[c.source_type] = [];
    acc[c.source_type].push(c);
  }
  return acc;
}

function renderCitationGroup(t: CitationSourceType, list: Citation[]): string {
  const label = SOURCE_TYPE_LABEL_TR[t];
  const rows = list.map((c) => `
        <tr>
          <td style="font-family: var(--font-mono); font-size: 8pt;">${escapeHtml(c.id)}</td>
          <td><strong style="font-size: 8.5pt;">${escapeHtml(c.source_ref)}</strong></td>
          <td><span class="fx-pill ${citationConfidencePillClass(c.confidence)}">${escapeHtml(c.confidence)}</span></td>
          <td style="font-size: 8.5pt;">${escapeHtml(c.excerpt)}</td>
        </tr>`).join('');
  return `
    <h3>${escapeHtml(label)} <span style="font-size: 9pt; color: var(--fx-gray); font-weight: 400;">(${escapeHtml(list.length)})</span></h3>
    <table>
      <thead>
        <tr>
          <th style="width: 18%;">ID</th>
          <th style="width: 22%;">Kaynak</th>
          <th style="width: 14%;">Güven</th>
          <th style="width: 46%;">Excerpt</th>
        </tr>
      </thead>
      <tbody>${rows}
      </tbody>
    </table>`;
}

// =============================================================================
// Aggregator — main entry called from runner.ts
// =============================================================================

export function buildBoardroomIntelligenceContext(
  accumulatedContext: Record<string, unknown>,
): BoardroomIntelligenceContext {
  const consistency = renderConsistencyCheck(accumulatedContext);
  const questions = renderBoardroomQuestions(accumulatedContext);
  const citations = renderCitationIndex(accumulatedContext);

  return {
    has_consistency_check: consistency.length > 0,
    consistency_check_html: consistency,
    has_boardroom_questions: questions.length > 0,
    boardroom_questions_html: questions,
    has_citation_index: citations.length > 0,
    citation_index_html: citations,
  };
}
