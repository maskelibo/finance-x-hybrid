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
  executive_summary: string | null;
  chairman_letter: string | null;
  ceo_message: string | null;
  segments_overview: string | null;
  risks_section: string | null;
  outlook_section: string | null;
  sustainability_section: string | null;
  human_resources_section: string | null;
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
      executive_summary: null,
      chairman_letter: null,
      ceo_message: null,
      segments_overview: null,
      risks_section: null,
      outlook_section: null,
      sustainability_section: null,
      human_resources_section: null,
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

  return {
    ticker: tk,
    source_path: pdfPath,
    page_count: pageCount,
    byte_count: buffer.length,
    raw_text_preview: text.slice(0, 500),
    executive_summary: sliceForAnchors(text, ANCHORS.executive_summary),
    chairman_letter: sliceForAnchors(text, ANCHORS.chairman_letter),
    ceo_message: sliceForAnchors(text, ANCHORS.ceo_message),
    segments_overview: sliceForAnchors(text, ANCHORS.segments_overview),
    risks_section: sliceForAnchors(text, ANCHORS.risks_section),
    outlook_section: sliceForAnchors(text, ANCHORS.outlook_section),
    sustainability_section: sliceForAnchors(text, ANCHORS.sustainability_section),
    human_resources_section: sliceForAnchors(text, ANCHORS.human_resources_section),
    warnings,
  };
}

/**
 * Pure slicer exposed for unit tests — no PDF dependency.
 */
export function _sliceForTests(text: string, sectionKey: keyof typeof ANCHORS): string | null {
  return sliceForAnchors(text, ANCHORS[sectionKey]);
}

export const _ANCHORS_FOR_TESTS = ANCHORS;
