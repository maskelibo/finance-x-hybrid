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
  maxChars = 3000,
): string {
  if (!md) return '';

  // JS /i flag is ASCII-only — Turkish Ş/İ don't match ş/i. Do a
  // Turkish-aware lowercased search line-by-line for headings that
  // contain any anchor keyword.
  const anchorsLower = headingPatterns.map(p => p.toLocaleLowerCase('tr-TR'));
  const lines = md.split('\n');
  let startIdx = -1;
  let startLineLen = 0;
  let cursor = 0;

  for (const line of lines) {
    const isHeading = /^\s*(#{1,4}\s|\*\*[^\n]+\*\*\s*$)/.test(line);
    if (isHeading) {
      const lineLower = line.toLocaleLowerCase('tr-TR');
      if (anchorsLower.some(a => lineLower.includes(a))) {
        startIdx = cursor;
        startLineLen = line.length + 1;
        break;
      }
    }
    cursor += line.length + 1;
  }

  if (startIdx < 0) return '';
  const sliceStart = startIdx + startLineLen;

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

  // Clean up LLM's ugly "[VERI YOK — ...]" and "[Hesaplanamadi — ...]"
  // placeholders before the conversion — turn them into muted italic.
  out = out.replace(/\[VER[İI]\s*YOK\s*[—\-]?\s*([^\]]*)\]/gi, (_, reason) => {
    const r = reason.trim();
    return r
      ? `<em style="color:#94a3b8;">(Raporlanmadı — ${r})</em>`
      : `<em style="color:#94a3b8;">(Raporlanmadı)</em>`;
  });
  out = out.replace(/\[Hesaplanamad[ıi][^\]]*\]/gi, (m) => {
    const reason = m.replace(/^\[Hesaplanamad[ıi]\s*[—\-]?\s*/i, '').replace(/\]$/, '').trim();
    return reason
      ? `<em style="color:#94a3b8;">(Hesaplanamadı — ${reason})</em>`
      : `<em style="color:#94a3b8;">(Hesaplanamadı)</em>`;
  });
  // Plain "VERİ YOK" outside brackets
  out = out.replace(/\bVER[İI]\s*YOK\b/gi, '<em style="color:#94a3b8;">Raporlanmadı</em>');

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


/** Extract 15+ narrative slots from upstream LLM agent outputs onto
 *  the 12-section template. Missing sources → empty block, template
 *  hides the surrounding container. */
export function buildNarrativeBlocks(inputs: NarrativeInputs): Record<string, string> {
  const finalText = stripToNarrative(inputs.final_summary);
  const ssText = stripToNarrative(inputs.strategic_synthesis);
  const valText = stripToNarrative(inputs.valuation_agent);
  const ctxText = stripToNarrative(inputs.context_extraction);

  // --- I. Yönetici Özeti ---
  const cardSummary =
    sliceSection(finalText, ['Yönetici Özeti', 'Yonetici Ozeti', 'Yatırımcı Kartı', 'Executive Summary', 'Temel Değerlendirme'], 4000)
    || sliceSection(finalText, ['Yatırım Tezi', 'Investment Thesis', 'Özet', 'Summary'], 3200)
    || sliceSection(ctxText, ['Şirket Özeti', 'Company Overview'], 2800);

  // --- II. Şirket Profili ---
  const companyProfile =
    sliceSection(ctxText, ['Şirket Profili', 'Company Profile', 'Şirket Tanıtımı', 'Kurumsal Yapı'], 4800)
    || sliceSection(ctxText, ['İş Modeli', 'Business Model'], 4000);

  const segments =
    sliceSection(ctxText, ['Segment', 'İştirak', 'Subsidiary', 'Portföy', 'SOTP'], 3600)
    || sliceSection(finalText, ['Segment', 'İştirak', 'SOTP'], 2800);

  // --- III. Finansal Analiz ---
  const financialIntro =
    sliceSection(finalText, ['Finansal Analiz', 'Finansal Panorama', 'Finansal Performans', 'Financial Analysis', 'Financial Performance'], 4000)
    || sliceSection(finalText, ['Finansal Göstergeler', 'Financial Overview'], 2800);

  const profitability =
    sliceSection(finalText, ['Karlılık', 'Kârlılık', 'Profitability', 'Marj Analizi', 'Margin Analysis'], 3600)
    || sliceSection(ssText, ['Karlılık', 'Kârlılık', 'Profitability'], 2800);

  const leverage =
    sliceSection(finalText, ['Bilanço', 'Borçluluk', 'Kaldıraç', 'Leverage', 'Balance Sheet', 'Liquidity', 'Likidite'], 3600)
    || sliceSection(finalText, ['Borç', 'Debt'], 2800);

  const cashflow =
    sliceSection(finalText, ['Nakit Akış', 'Nakit Akisi', 'Cash Flow', 'İşletme Sermayesi', 'Working Capital'], 3600)
    || sliceSection(finalText, ['OCF', 'FCF'], 2400);

  // --- Yatırım Programı (CAPEX planı, kapasite genişleme, iştirakler) ---
  const investments =
    sliceSection(finalText, ['Yatırım', 'Yatirim', 'CAPEX', 'Kapasite', 'Capacity', 'Büyüme Planı', 'Growth Plan', 'Investment Program'], 4000)
    || sliceSection(ctxText, ['Yatırım', 'CAPEX', 'Kapasite', 'Filo Yatırımı', 'Tesis Yatırımı'], 3600);

  // --- Temettü politikası ---
  const dividend =
    sliceSection(finalText, ['Temettü', 'Temettu', 'Dividend', 'Kar Payı', 'Payout'], 3200);

  // --- IV. Değerleme ---
  const valuationBlock =
    sliceSection(valText, ['Bear', 'Base', 'Bull', 'Senaryo', 'Scenarios', 'Hedef Fiyat', 'Target Price'], 4800)
    || sliceSection(finalText, ['Değerleme', 'Degerleme', 'Valuation', 'Hedef Fiyat'], 4000);

  // --- V. Sektör & Rekabet ---
  const sector =
    sliceSection(finalText, ['Sektör', 'Rekabet', 'Competition', 'Peer', 'Emsal', 'Porter', 'SWOT'], 4400)
    || sliceSection(ctxText, ['Rekabet', 'Sektör', 'Competition'], 3200);

  // --- VI. Makro ---
  const macro =
    sliceSection(finalText, ['Makro', 'Macro', 'Jeopolitik', 'Geopolitic', 'TCMB', 'Transmisyon', 'Transmission'], 4400)
    || sliceSection(finalText, ['Enflasyon', 'Inflation', 'Faiz', 'FX', 'Kur'], 3200);

  // --- VII. Teknik ---
  const technical =
    sliceSection(finalText, ['Teknik Analiz', 'Technical Analysis', 'Trend Analizi', 'Destek', 'Direnç', 'Support', 'Resistance'], 3200)
    || sliceSection(finalText, ['RSI', 'MACD', 'Momentum'], 2400);

  // --- VIII. ESG ---
  const esg =
    sliceSection(finalText, ['ESG', 'Sürdürülebilirlik', 'Sustainability', 'CBAM', 'Karbon', 'Carbon'], 3600)
    || sliceSection(ctxText, ['ESG', 'CBAM'], 2800);

  // --- IX. Sentiment ---
  const sentiment =
    sliceSection(finalText, ['Haber', 'Sentiment', 'Duygu', 'Market Mood', 'News Flow'], 3200);

  // --- XI. Risk ---
  const risks =
    sliceSection(finalText, ['Risk Değerlendirmesi', 'Risk Assessment', 'Temel Riskler', 'Key Risks', 'Risk Matrisi'], 4000)
    || sliceSection(finalText, ['Risk'], 3200);

  // --- XII. Sonuç ---
  const closing =
    sliceSection(finalText, ['Sonuç', 'Sonuc', 'Conclusion', 'Analitik Sonuç', 'Genel Değerlendirme', 'Kapanış'], 4800)
    || sliceSection(ssText, ['Sentez', 'Convergence', 'Divergence'], 3600);

  const investmentThesis =
    sliceSection(finalText, ['Yatırım Tezi', 'Investment Thesis', 'Öneriler', 'Recommendations'], 4000)
    || sliceSection(ssText, ['Yatırım Tezi', 'Investment Thesis'], 3200);

  return {
    card_summary: cardSummary,
    company_profile: companyProfile,
    segments,
    financial_intro: financialIntro,
    profitability,
    leverage,
    cashflow,
    investments,
    dividend,
    valuation: valuationBlock,
    sector,
    macro,
    technical,
    esg,
    sentiment,
    risks,
    closing,
    investment_thesis: investmentThesis,
  };
}
