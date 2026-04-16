/**
 * Extract narrative blocks from LLM agent outputs (final_summary,
 * strategic_synthesis, valuation_agent, context_extraction) for
 * injection into the Python template's placeholder slots.
 *
 * LLM outputs are a mix of JSON envelopes, markdown narrative, and
 * free-form Turkish prose. We use lightweight heading-anchor slicing:
 * find Turkish section headings (H1/H2/bold line) and slice the
 * paragraphs that follow. Zero regex hallucination — if the heading
 * isn't there, the block stays empty and the template hides it.
 */

/** Normalise raw LLM output: strip JSON wrappers, html, keep prose. */
export function stripToNarrative(raw: unknown): string {
  if (raw == null) return '';
  let text = typeof raw === 'string' ? raw : JSON.stringify(raw);

  // If the agent wrapped a free-text field in JSON, unwrap it.
  // Common field names across finance-x agent outputs.
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && parsed !== null) {
      const obj = parsed as Record<string, unknown>;
      const candidate = obj.narrative ?? obj.summary ?? obj.executive_summary
        ?? obj.yatirimci_karti ?? obj.markdown ?? obj.text ?? obj.body;
      if (typeof candidate === 'string' && candidate.length > 50) {
        text = candidate;
      }
    }
  } catch { /* not JSON, treat as raw markdown */ }

  // Strip any embedded <script>/<style> blocks.
  text = text.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
  return text;
}


/** Slice the paragraphs between two heading-like anchors.
 *
 * Example: sliceSection(md, ['## Yatırım Tezi', '### Yatırım Tezi'])
 * returns the text between the first matching heading and the next
 * heading at same-or-higher level, capped at `maxChars`.
 *
 * Matching is case-insensitive and ignores leading markdown hashes
 * and trailing punctuation.
 */
export function sliceSection(
  md: string,
  headingPatterns: string[],
  maxChars = 1600,
): string {
  if (!md) return '';

  // Build a regex that matches any heading line containing ANY of the
  // anchor keywords. We match the whole line so we can find its end.
  const anchors = headingPatterns.map(escapeRegex).join('|');
  const startRe = new RegExp(
    `(^|\\n)\\s*(#{1,4}|\\*\\*)\\s*.*?(?:${anchors}).*?(?:\\*\\*)?\\s*(?:\\n|$)`,
    'i',
  );
  const startMatch = md.match(startRe);
  if (!startMatch) return '';

  const sliceStart = (startMatch.index ?? 0) + startMatch[0].length;

  // End: next heading-line (h1–h4 or bold-line) after our start.
  const endRe = /\n\s*(#{1,4}|\*\*[^*\n]{3,80}\*\*)\s*.*?\n/;
  const rest = md.slice(sliceStart);
  const endMatch = rest.match(endRe);
  const sliceEnd = endMatch ? (endMatch.index ?? rest.length) : rest.length;

  let block = rest.slice(0, sliceEnd).trim();
  block = cleanupMarkdown(block);

  if (block.length > maxChars) {
    // Cut at the last paragraph boundary within maxChars so we don't
    // truncate mid-sentence.
    const cut = block.slice(0, maxChars);
    const lastBreak = Math.max(cut.lastIndexOf('\n\n'), cut.lastIndexOf('. '));
    block = (lastBreak > maxChars * 0.5 ? cut.slice(0, lastBreak + 1) : cut) + '…';
  }
  return block;
}


/** Light markdown → HTML-paragraph conversion safe for template {{&raw}}. */
function cleanupMarkdown(md: string): string {
  let out = md.trim();
  // Drop redundant heading lines that snuck into the slice.
  out = out.replace(/^\s*#{1,6}\s+.*$/gm, '').trim();
  // Convert markdown bold/italic into <strong>/<em>.
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\n]+)\*([^*]|$)/g, '$1<em>$2</em>$3');
  // Convert bullet lists into <ul>.
  const lines = out.split('\n');
  const htmlParts: string[] = [];
  let paragraph: string[] = [];
  let inList = false;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    const joined = paragraph.join(' ').trim();
    if (joined) htmlParts.push(`<p>${escapeHtmlInner(joined)}</p>`);
    paragraph = [];
  }

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) {
      flushParagraph();
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      continue;
    }
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      if (!inList) { htmlParts.push('<ul>'); inList = true; }
      htmlParts.push(`<li>${escapeHtmlInner(bulletMatch[1])}</li>`);
    } else {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      paragraph.push(line);
    }
  }
  flushParagraph();
  if (inList) htmlParts.push('</ul>');
  return htmlParts.join('\n');
}


/** Protect inner content but preserve <strong>/<em> we just injected. */
function escapeHtmlInner(s: string): string {
  return s
    .replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, '&amp;')
    .replace(/<(?!\/?(?:strong|em)\b)/g, '&lt;');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


// ---------- The narrative-block resolver ----------

export interface NarrativeInputs {
  final_summary?: unknown;
  strategic_synthesis?: unknown;
  valuation_agent?: unknown;
  context_extraction?: unknown;
  ceo?: unknown;
}


/** Extract the four template narrative slots from upstream LLM agent
 *  outputs. Missing sources = empty blocks (template hides them). */
export function buildNarrativeBlocks(inputs: NarrativeInputs): Record<string, string> {
  const finalText = stripToNarrative(inputs.final_summary);
  const ssText = stripToNarrative(inputs.strategic_synthesis);
  const valText = stripToNarrative(inputs.valuation_agent);
  const ctxText = stripToNarrative(inputs.context_extraction);

  // 1. card_summary: investor card / yatırımcı kartı narrative from
  //    final_summary (canonical source), fallback to context_extraction.
  const cardSummary =
    sliceSection(finalText, ['Yatırımcı Kartı', 'Yatirimci Karti', 'Investor Card', 'Özet', 'Ozet', 'Executive Summary'], 1400)
    || sliceSection(finalText, ['Yatırım Tezi', 'Yatirim Tezi', 'Investment Thesis'], 1400)
    || sliceSection(ctxText, ['Şirket Özeti', 'Sirket Ozeti', 'Company Overview'], 1400);

  // 2. financial_intro: from final_summary's financial section.
  const financialIntro =
    sliceSection(finalText, ['Finansal Panorama', 'Finansal Görünüm', 'Finansal Analiz', 'Financial Overview'], 1600)
    || sliceSection(finalText, ['Finansal', 'Financial'], 1200);

  // 3. valuation narrative: prefer valuation_agent output's own
  //    scenarios, fall back to final_summary section.
  const valuationBlock =
    sliceSection(valText, ['Bear', 'Base', 'Bull', 'Senaryo', 'Scenarios'], 1600)
    || sliceSection(finalText, ['Değerleme', 'Degerleme', 'Valuation'], 1600);

  // 4. closing narrative — investment thesis / risks / recommendation
  //    wrap-up from strategic_synthesis or final_summary tail.
  const closing =
    sliceSection(finalText, ['Sonuç', 'Sonuc', 'Kapanış', 'Closing', 'Conclusion', 'Risk'], 1800)
    || sliceSection(ssText, ['Yatırım Tezi', 'Yatirim Tezi', 'Convergence', 'Divergence', 'Sentez'], 1800);

  return {
    card_summary: cardSummary,
    financial_intro: financialIntro,
    valuation: valuationBlock,
    closing,
  };
}
