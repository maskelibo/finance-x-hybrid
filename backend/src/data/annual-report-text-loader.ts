/**
 * Pre-Core-4 Phase G — Annual Report (Faaliyet Raporu) text extractor.
 *
 * Activity-report PDFs that data_collection downloads carry the
 * narrative depth boards expect: chairman/CEO letters, segment
 * descriptions, risk inventories, strategic outlook. Until Phase G
 * these PDFs were silently ignored after download — this module pulls
 * the plaintext, slices canonical Turkish narrative sections, and
 * emits a structured object compose.ts can quote from directly.
 *
 * Slicing strategy: scan for Turkish heading anchors (case-insensitive,
 * accent-tolerant) and capture the next ~1500 characters or the next
 * heading, whichever comes first. Each section is a best-effort slice
 * — the loader is robust to missing sections and never throws.
 */

import fs from 'node:fs';

import { PDFParse } from 'pdf-parse';

export interface AnnualReportExtracts {
  ticker: string;
  source_path: string;
  page_count: number;
  byte_count: number;
  raw_text_preview: string;          // first 500 chars for diagnostic
  // Phase I (2026-04-29) — document_type discrimination. Many BIST KAP
  // "activity_report" filings are short (2-6 pages) auditor-opinion
  // covers attached to the FAR, NOT the FAR itself. The loader detects
  // this and labels accordingly so compose can render the auditor
  // opinion section instead of silently omitting.
  document_type: 'full_far' | 'auditor_opinion_cover' | 'kap_cover_only' | 'unknown';
  // Sections populated from a full FAR
  executive_summary: string | null;
  chairman_letter: string | null;
  ceo_message: string | null;
  segments_overview: string | null;
  risks_section: string | null;
  outlook_section: string | null;
  sustainability_section: string | null;
  human_resources_section: string | null;
  // Phase I — sections populated from an auditor-opinion cover
  auditor_opinion: string | null;
  audit_firm: string | null;
  audit_period: string | null;
  audit_result: string | null;        // 'Olumlu' / 'Olumsuz' / 'Şartlı' / etc.
  warnings: string[];
}

// Anchors match canonical section HEADINGS — i.e., the regex must
// hit a line that looks like a heading, not just a passing mention
// elsewhere in prose. We enforce this by requiring the keyword to
// appear at the start of a line (after a newline or string start).
// First anchor that matches wins for a given section.
const ANCHORS = {
  executive_summary: [
    /(?:^|\n)\s*yönetici özeti/i,
    /(?:^|\n)\s*yönetim özeti/i,
    /(?:^|\n)\s*faaliyet raporu özeti/i,
    /(?:^|\n)\s*executive summary/i,
  ],
  chairman_letter: [
    /(?:^|\n)\s*yönetim kurulu başkan(?:'?ın(?:ın)?|ı)? mesajı/i,
    /(?:^|\n)\s*başkan(?:'?ın)? mesajı/i,
    /(?:^|\n)\s*chairman'?s? message/i,
  ],
  ceo_message: [
    /(?:^|\n)\s*genel müdür(?:'?ün)? mesajı/i,
    /(?:^|\n)\s*ceo(?:'?nun)? mesajı/i,
    /(?:^|\n)\s*üst yönetim mesajı/i,
  ],
  segments_overview: [
    /(?:^|\n)\s*faaliyet konuları/i,
    /(?:^|\n)\s*faaliyet alanları/i,
    /(?:^|\n)\s*iş segmentleri/i,
    /(?:^|\n)\s*bölümlere ait bilgiler/i,
    /(?:^|\n)\s*segmentler(?:e? göre)?/i,
  ],
  risks_section: [
    /(?:^|\n)\s*risk yönetimi/i,
    /(?:^|\n)\s*önemli riskler/i,
    /(?:^|\n)\s*finansal riskler/i,
    /(?:^|\n)\s*risk faktörleri/i,
  ],
  outlook_section: [
    /(?:^|\n)\s*\d{0,4}\s*beklenti(?:ler(?:i)?|si)/i,
    /(?:^|\n)\s*görünüm/i,
    /(?:^|\n)\s*20\d{2} hedefler/i,
    /(?:^|\n)\s*gelecek dönem/i,
    /(?:^|\n)\s*outlook/i,
  ],
  sustainability_section: [
    /(?:^|\n)\s*sürdürülebilirlik/i,
    /(?:^|\n)\s*esg/i,
    /(?:^|\n)\s*çevresel,?\s*sosyal/i,
    /(?:^|\n)\s*iklim/i,
  ],
  human_resources_section: [
    /(?:^|\n)\s*insan kaynakları/i,
    /(?:^|\n)\s*çalışan profili/i,
    /(?:^|\n)\s*personel sayısı/i,
  ],
};

const SLICE_MAX = 1500;

/**
 * Locates the first anchor match in `text` and returns the slice from
 * that match through the next ~SLICE_MAX chars (cut at next heading
 * candidate when possible — heuristic: a line of 5-80 caps + Turkish
 * letters that ends without a period).
 */
function sliceForAnchors(text: string, anchors: RegExp[]): string | null {
  // Turkish dotted/dotless I (İ vs i, I vs ı) does not case-fold via
  // JS's regex /i flag. Lowercase via Turkish locale so anchors only
  // need to express their lowercase form. We then map match indices
  // back to the original text — the lowercase transform is char-for-
  // char in Turkish, so indices align.
  const lower = text.toLocaleLowerCase('tr-TR');
  for (const re of anchors) {
    const m = re.exec(lower);
    if (!m || m.index == null) continue;
    const start = m.index;
    const tail = text.slice(start, start + SLICE_MAX);
    // Try to truncate at next heading-like line break to avoid bleeding
    // into the next section.
    const nextHeadingRe = /\n\s*([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü ,/\-]{4,80})\n/g;
    nextHeadingRe.lastIndex = 200; // skip the current heading
    const next = nextHeadingRe.exec(tail);
    const cut = next ? next.index : tail.length;
    return tail.slice(0, cut).trim() || null;
  }
  return null;
}

/**
 * Extracts canonical narrative sections from a Faaliyet Raporu PDF.
 * Returns null sections for those not found; never throws.
 */
export async function loadAnnualReportExtracts(
  ticker: string,
  pdfPath: string,
): Promise<AnnualReportExtracts | null> {
  if (!fs.existsSync(pdfPath)) return null;

  const tk = ticker.toUpperCase();
  const warnings: string[] = [];

  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(pdfPath);
  } catch (e) {
    warnings.push(`read_failed: ${(e as Error).message}`);
    return {
      ticker: tk,
      source_path: pdfPath,
      page_count: 0,
      byte_count: 0,
      raw_text_preview: '',
      document_type: 'unknown',
      executive_summary: null,
      chairman_letter: null,
      ceo_message: null,
      segments_overview: null,
      risks_section: null,
      outlook_section: null,
      sustainability_section: null,
      human_resources_section: null,
      auditor_opinion: null,
      audit_firm: null,
      audit_period: null,
      audit_result: null,
      warnings,
    };
  }

  let text = '';
  let pageCount = 0;
  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    text = result.text ?? '';
    pageCount = result.pages?.length ?? 0;
    await parser.destroy();
  } catch (e) {
    warnings.push(`pdf_parse_failed: ${(e as Error).message}`);
  }

  // Phase I — classify document type. BIST KAP "activity_report"
  // filings are frequently short auditor-opinion covers, not the full
  // Faaliyet Raporu. We detect this so compose.ts can render auditor
  // sections instead of silently rendering nothing.
  const docType = classifyDocumentType(text, pageCount);
  if (docType === 'auditor_opinion_cover' || docType === 'kap_cover_only') {
    warnings.push(
      `document_type=${docType}: this PDF is a ${docType === 'auditor_opinion_cover' ? 'KAP auditor-opinion cover' : 'KAP cover sheet'} — chairman/CEO/risks/outlook sections will not populate. The full Faaliyet Raporu is published separately at the issuer's IR site.`,
    );
  }

  // Auditor opinion extraction (only meaningful for auditor_opinion_cover)
  const auditor = docType === 'auditor_opinion_cover'
    ? extractAuditorOpinion(text)
    : { opinion: null, firm: null, period: null, result: null };

  return {
    ticker: tk,
    source_path: pdfPath,
    page_count: pageCount,
    byte_count: buffer.length,
    raw_text_preview: text.slice(0, 500),
    document_type: docType,
    executive_summary: sliceForAnchors(text, ANCHORS.executive_summary),
    chairman_letter: sliceForAnchors(text, ANCHORS.chairman_letter),
    ceo_message: sliceForAnchors(text, ANCHORS.ceo_message),
    segments_overview: sliceForAnchors(text, ANCHORS.segments_overview),
    risks_section: sliceForAnchors(text, ANCHORS.risks_section),
    outlook_section: sliceForAnchors(text, ANCHORS.outlook_section),
    sustainability_section: sliceForAnchors(text, ANCHORS.sustainability_section),
    human_resources_section: sliceForAnchors(text, ANCHORS.human_resources_section),
    auditor_opinion: auditor.opinion,
    audit_firm: auditor.firm,
    audit_period: auditor.period,
    audit_result: auditor.result,
    warnings,
  };
}

/**
 * Phase I — classify the PDF based on text content + page count.
 * Auditor-opinion covers are typically 4-8 pages and contain the phrase
 * "BAĞIMSIZ DENETÇİ RAPORU" near the start. KAP cover sheets are 2-3
 * pages with mostly metadata. Anything else with chairman/CEO/risks
 * anchors is treated as a full FAR.
 */
function classifyDocumentType(
  text: string,
  pageCount: number,
): AnnualReportExtracts['document_type'] {
  const lower = text.toLocaleLowerCase('tr-TR');
  const hasAuditorMarker = /bağımsız denetçi raporu|bağımsız denetim kuruluşu/i.test(lower);
  const hasFarSection = /(?:^|\n)\s*(?:yönetim kurulu başkan|genel müdür|risk yönetimi|faaliyet (?:konuları|alanları))/i
    .test(lower);
  if (hasFarSection && pageCount >= 30) return 'full_far';
  if (hasAuditorMarker && pageCount <= 12) return 'auditor_opinion_cover';
  if (pageCount <= 4 && !hasFarSection) return 'kap_cover_only';
  if (hasFarSection) return 'full_far';
  return 'unknown';
}

/**
 * Phase I — auditor-opinion extractor. Pulls a structured summary
 * from the short KAP audit cover PDFs:
 *   - opinion: the "Görüş" paragraph (1-2 sentences)
 *   - firm: e.g. "GÜNEY BAĞIMSIZ DENETİM"
 *   - period: e.g. "1/1/2025-31/12/2025"
 *   - result: "Olumlu" / "Olumsuz" / "Şartlı"
 */
function extractAuditorOpinion(text: string): {
  opinion: string | null;
  firm: string | null;
  period: string | null;
  result: string | null;
} {
  const firmMatch = text.match(/Bağımsız Denetim Kuruluşu\s+([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜa-zçğıöşü .&]+)(?:\s+Denetim|\n)/);
  const firm = firmMatch ? firmMatch[1].trim() : null;
  const periodMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{4})/);
  const period = periodMatch ? periodMatch[1].replace(/\s+/g, '') : null;
  const resultMatch = text.match(/Denetim Sonucu\s+(Olumlu|Olumsuz|Şartlı(?:\s+olumlu)?|Görüş bildirmekten kaçınma)/i);
  const result = resultMatch ? resultMatch[1] : null;
  // Opinion paragraph: from "Görüşümüze göre" up to ~600 chars or next
  // numbered section.
  const opinionMatch = text.match(/Görüşümüze göre[\s\S]{0,600}?(?=\d\)|$)/);
  const opinion = opinionMatch ? opinionMatch[0].replace(/\s+/g, ' ').trim() : null;
  return { opinion, firm, period, result };
}

/**
 * Pure slicer exposed for unit tests — no PDF dependency.
 */
export function _sliceForTests(text: string, sectionKey: keyof typeof ANCHORS): string | null {
  return sliceForAnchors(text, ANCHORS[sectionKey]);
}

export const _ANCHORS_FOR_TESTS = ANCHORS;
