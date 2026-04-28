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
// Fix #20 — exported so compose.ts/fallbackNarrative can sanitize the
// hybridSS path (strategic_synthesis raw llm_narrative) before it bypasses
// sliceSection's cleanupMarkdown call. BIMAS 20260423 leaked a full
// ```json {agent_id, output_id, ...} ``` envelope into "Senaryo Analizi —
// Yorumlu" because narrativeBlocks.valuation was empty (no valuation_agent
// + no Bear/Base/Bull anchor in finalText) → fell through to raw hybridSS.
export function cleanupMarkdownForFallback(md: string): string {
  return cleanupMarkdown(md);
}

function cleanupMarkdown(md: string): string {
  let out = md.trim();

  // -----------------------------------------------------------------
  // Fix #3 / #9 / #17 / #18 (2026-04-24): strip raw agent metadata
  // that used to leak into the final report. ARCLK 20260423 pages
  // 19-27 were a direct dump of macro_analysis agent JSON + its
  // markdown, including AGENT SELF-ASSESSMENT blocks, raw [src: ...]
  // attribution, output/session ids, LLM internal "thinking" prose.
  // Every pattern here corresponds to a concrete leak observed
  // in that report.
  // -----------------------------------------------------------------

  // (1) Drop fenced code blocks (```json ... ``` and ```any ... ```)
  out = out.replace(/```[a-z]*\s*\n?([\s\S]*?)```/gi, (_, body) => {
    // If the fence was JSON and body includes "agent_id" / "output_id" it's
    // an agent envelope — drop entirely. Otherwise preserve the inner text.
    if (/"agent_id"|"output_id"|"session_id"/.test(body)) return '';
    return body.trim();
  });

  // (2) Drop raw JSON agent envelopes that weren't even fenced
  out = out.replace(
    /\{\s*"agent_id"\s*:\s*"[^"]+"[\s\S]*?"review_status"\s*:\s*"[^"]+"\s*\}/g,
    '',
  );

  // Fix #23 — strip inline `{ "structured_financials": {...} }` data blobs
  // BIMAS 20260424 leaked the full numeric payload as a standalone JSON
  // paragraph. Also covers top-level "nota" / "canonical_*" data envelopes.
  out = out.replace(
    /\{\s*"structured_financials"\s*:\s*\{[\s\S]*?\}(?:\s*,\s*"[a-z_]+"\s*:\s*(?:"[^"]*"|\{[\s\S]*?\}|\[[\s\S]*?\]))*\s*\}/g,
    '',
  );
  out = out.replace(
    /\{\s*"(?:canonical_numbers|canonical_financials|parsed_statements)"\s*:\s*\{[\s\S]*?\}\s*\}/g,
    '',
  );

  // Fix #24 — strip "Agent | Durum | Etki" internal pipeline-status table.
  // Match markdown table rows whose cells list internal agent names +
  // PRESENT/DEGRADED/MISSING/PARTIAL status markers. Internal diagnostic,
  // not investor-facing.
  out = out.replace(
    /\|\s*Agent\s*\|\s*Durum\s*\|\s*Etki[^\n]*\n[\s\S]{0,3000}?(?=\n\s*\n|\n#|$)/gi,
    '',
  );
  // Also catch HTML-rendered form if LLM emitted a raw <table>
  out = out.replace(
    /<table>[^<]*<thead>\s*<tr>\s*<th>\s*Agent\s*<\/th>\s*<th>\s*Durum\s*<\/th>\s*<th>\s*Etki\s*<\/th>[\s\S]*?<\/table>/gi,
    '',
  );

  // Fix #26 — drop markdown tables where >50% of data cells are
  // "(Raporlanmadı)" / "Raporlanmadı". BIMAS had LLM emit multi-year CF
  // tables with 4 of 5 year columns = "(Raporlanmadı)" because LLM only
  // looked at FY-2025 data while parse_standardization had FY-2020..FY-2024
  // available. These misleading stub tables should be stripped; the real
  // multi-year trend comes from compose.ts buildMultiYearTrend.
  out = out.replace(/(\|[^\n]*\|[^\n]*\n){3,}/g, (block) => {
    const rows = block.split('\n').filter(l => l.trim().startsWith('|'));
    if (rows.length < 3) return block;
    const cells: string[] = [];
    for (const row of rows) {
      for (const cell of row.split('|').slice(1, -1)) {
        cells.push(cell.trim());
      }
    }
    const nonEmpty = cells.filter(c => c.length > 0 && !/^-+$/.test(c));
    const unreported = nonEmpty.filter(c => /\b\(?Raporlanmadı\)?\b|^—$/i.test(c)).length;
    if (nonEmpty.length >= 10 && unreported / nonEmpty.length > 0.5) return '\n';
    return block;
  });

  // (3) Drop AGENT SELF-ASSESSMENT / Known gaps / Confidence internal blocks
  //     — ## AGENT SELF-ASSESSMENT ... until end-of-section or end-of-string
  out = out.replace(/##+\s*AGENT\s*SELF[-\s]?ASSESSMENT[\s\S]*?(?=\n##+\s|\n\*\*|$)/gi, '');
  out = out.replace(/\bKnown\s*gaps?\s*:[\s\S]*?(?=\n\n|$)/gi, '');
  out = out.replace(/^Confidence\s*:\s*0?\.\d+.*$/gim, '');
  out = out.replace(/\bllm_override\s*:\s*(?:true|false)\b/gi, '');
  out = out.replace(/\bdata\s*completeness\s*:\s*\d+%.*$/gim, '');

  // (4) Strip LLM "thinking" prose that leaked pre-answer
  out = out.replace(/^(?:Tüm veri(?:\s*setim|\s*noktaları)?\s*(?:tamamlandı|doğrulandı|hazır)[\.,]?.*|Şimdi[^\n]{0,80}(?:yazıyorum|hazırlıyorum|derliyorum|üretiyorum)[\.,]?.*|Yapılandırılmış çıktıyı oluşturuyorum[\.,]?.*|Knowledge_base çıktısını işleyip[^\n]*|Kapsamlı (?:analizi|raporu|sentezi)[^\n]{0,40}(?:derliyorum|hazırlıyorum|üretiyorum)[\.,]?.*|[A-Z]{3,6}\s+FY\d{4}\s+stratejik sentezi[^\n]*)$/gim, '');
  out = out.replace(/^Aşağıda[^\n]{0,50}sunuyorum[\.,]?.*$/gim, '');
  // Standalone preamble fragments that LLM emits before --- separator
  out = out.replace(/^[A-ZÇŞÜÖİĞ]{3,6}\s+FY\d{4}[^\n]{0,200}(?:hazırlıyorum|derliyorum|üretiyorum|analiz ediyorum)[\.,]?\s*$/gim, '');
  // Drop ``` ... --- pattern where preamble is followed by separator
  out = out.replace(/^\s*---\s*$/gm, '');

  // Fix #22 — strip agent's own document header that bled into the report.
  // BIMAS macro section had: "Nisan 2026 | Finance X Platform | Makro Analiz Ajansı"
  // pattern: month + year + | Finance X Platform + | <agent name>
  out = out.replace(/^\*\*(?:Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+20\d{2}\s*\|\s*Finance X[^*]*\*\*\s*$/gim, '');
  out = out.replace(/^(?:Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık)\s+20\d{2}\s*\|\s*Finance X[^\n]*$/gim, '');

  // Cosmetic 1 — convert markdown `> text` blockquotes to styled <blockquote>
  // BEFORE the narrative reaches compose.ts (which doesn't run mdToHtml on
  // these slots — only on the full final_summary dump).
  {
    const lines = out.split('\n');
    const acc: string[] = [];
    let i = 0;
    while (i < lines.length) {
      if (/^\s{0,3}>\s+/.test(lines[i])) {
        const block: string[] = [];
        while (i < lines.length && /^\s{0,3}>\s+/.test(lines[i])) {
          block.push(lines[i].replace(/^\s{0,3}>\s+/, ''));
          i++;
        }
        acc.push(
          `<blockquote style="border-left:3px solid #3b82f6; background:#eff6ff; padding:8px 14px; margin:10px 0; color:#1e3a8a;">${block.join('<br>')}</blockquote>`,
        );
      } else {
        acc.push(lines[i]);
        i++;
      }
    }
    out = acc.join('\n');
  }

  // (5) Drop [src: ...] inline attribution — internal bookkeeping, not
  //     useful for readers. Preserve the cell content around it.
  out = out.replace(/\s*\[src:\s*[^\]]+\]/gi, '');

  // (6) Drop schema envelope bits that occasionally appear outside fenced JSON
  out = out.replace(/^\s*"(?:agent_id|output_id|session_id|task_id|timestamp|review_status)"\s*:\s*"[^"]*",?\s*$/gim, '');

  // Fix escaped pipes that break markdown tables (LLM writes \| inside cells)
  out = out.replace(/\\\|/g, '—');

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

  // Translate English confidence labels → Turkish
  out = out.replace(/\(High Confidence\)/gi, '(Yüksek Güven)');
  out = out.replace(/\(Medium Confidence\)/gi, '(Orta Güven)');
  out = out.replace(/\(Low Confidence\)/gi, '(Düşük Güven)');
  out = out.replace(/\(Speculative\)/gi, '(Spekülatif)');
  out = out.replace(/\bHIGH\b(?=\s*(?:güven|confidence))/gi, 'YÜKSEK');
  out = out.replace(/\bMEDIUM\b(?=\s*(?:güven|confidence))/gi, 'ORTA');
  out = out.replace(/\bLOW\b(?=\s*(?:güven|confidence))/gi, 'DÜŞÜK');

  // Strip internal pipeline agent names from KAYNAK citations
  out = out.replace(/valuation_agent\s*çıktısı/gi, 'değerleme modeli');
  out = out.replace(/\bvaluation_agent\b/gi, 'değerleme modeli');
  out = out.replace(/\bdata_collection\b/gi, 'veri toplama');
  out = out.replace(/\bsector_competition_output\b/gi, 'sektör analizi');
  out = out.replace(/\bfinancial_analysis_output\b/gi, 'finansal analiz');
  out = out.replace(/\bstrategic_synthesis_output\b/gi, 'stratejik sentez');
  out = out.replace(/\bfinal_summary_output\b/gi, 'nihai özet');
  out = out.replace(/\bcontext_extraction\b/gi, 'bağlam çıkarma');
  out = out.replace(/\bsnippet'ları\b/gi, 'verileri');
  out = out.replace(/\bsnippet(?:'?s)?\b/gi, 'veri parçaları');
  // Wave 1 (2026-04-28): broadened to catch LLM truncation
  // ("fundamental has both positive and negati"). Old strict regex
  // missed truncated outputs and English residue leaked to the report.
  out = out.replace(
    /\bfundamental[^.\n<]{0,40}both[^.\n<]{0,30}positive[^.\n<]{0,80}(?=\.|\n|<|$)/gi,
    'Temel göstergeler hem olumlu hem olumsuz sinyaller içermektedir — detaylı inceleme gerekmektedir.',
  );

  // -----------------------------------------------------------------
  // Fix #2 + #14 (2026-04-24): Python financial_engine emits English
  // flag text ("Net margin negative (-1.70%)", "Current ratio 0.96 < 1
  // — short-term obligations exceed current assets"). These land in
  // report body verbatim. Translate canonical phrases to Turkish.
  // -----------------------------------------------------------------
  const engineFlagTranslations: Array<[RegExp, string]> = [
    [/Net margin negative\s*\(([-\d.,%]+)\)\.?/gi, 'Net marj negatif ($1) — şirket zarar üretiyor.'],
    [/Current ratio\s+([\d.,]+)\s*<\s*1\s*—\s*short-term obligations exceed current assets\.?/gi,
      'Cari oran $1 — dönen varlıklar kısa vadeli borçları karşılamıyor, likidite kırılganlığı var.'],
    [/Net Debt\/EBITDA\s+([\d.,]+)\s*>\s*5x\s*—\s*elevated distress risk\.?/gi,
      'Net Borç/FAVÖK $1x — yüksek kaldıraç, faiz şokuna aşırı duyarlı.'],
    [/Interest coverage\s+([\d.,]+)\s*<\s*2x\s*—\s*earnings barely cover financing cost\.?/gi,
      'Faiz karşılama oranı $1x — faaliyet kârı finansman giderini zar zor karşılıyor.'],
    [/Piotroski F\s+([\d]+)\s*\/\s*9\s*—\s*low quality fundamentals\.?/gi,
      'Piotroski F-skoru $1/9 — temel finansal sağlık düşük kalitede.'],
    [/Altman Z\s*([\d.,]+)\s*<\s*1\.8\s*—\s*bankruptcy risk zone\.?/gi,
      'Altman Z-skoru $1 — iflas riski bölgesi (<1.8).'],
    [/ROE\s+([-\d.,%]+)\s*<\s*0\s*—\s*value destruction\.?/gi,
      'ROE $1 — özsermaye değeri azalıyor, yatırımcı sermayesi eriyor.'],
    [/negative free cash flow\s*\(([-\d.,%B]+)\)\s*—\s*cash burn\.?/gi,
      'Serbest nakit akışı negatif ($1) — operasyonlardan nakit çıkıyor.'],
    [/warning:\s*EBIT\s+or\s+D&A\s+missing/gi,
      'uyarı: FAVÖK hesaplaması için EBIT veya D&A verisi eksik'],
    [/warning:\s*market_cap\s+missing/gi,
      'uyarı: piyasa değeri eksik — Altman Z hesaplanamadı'],
  ];
  for (const [re, replacement] of engineFlagTranslations) {
    out = out.replace(re, replacement);
  }

  // Internal risk code enum → Türkçe human label
  const riskCodeMap: Record<string, string> = {
    'NET_LOSS': 'Net Zarar',
    'OVERLEVERAGED': 'Yüksek Kaldıraç',
    'LIQUIDITY_TIGHT': 'Likidite Sıkışıklığı',
    'INTEREST_COVERAGE_LOW': 'Faiz Karşılama Düşük',
    'INTEREST_COVERAGE_LOW ': 'Faiz Karşılama Düşük ',
    'DATA_QUALITY_LOW': 'Veri Kalitesi Düşük',
    'DSO_ANOMALY': 'DSO Anomalisi',
    'DIO_ANOMALY': 'Stok Dönüş Anomalisi',
    'DPO_ANOMALY': 'Tedarikçi Ödeme Anomalisi',
    'FCF_NEGATIVE': 'FCF Negatif',
    'VALUE_DESTROYING': 'Değer Yıkımı',
    'UNANNUALIZED_Q1': 'Q1 Yıllıklaştırılmamış',
  };
  for (const [code, label] of Object.entries(riskCodeMap)) {
    const re = new RegExp(`\\b${code}\\b`, 'g');
    out = out.replace(re, label);
  }
  // Strip AGENT SELF-ASSESSMENT section entirely — internal metadata
  out = out.replace(/##?\s*AGENT SELF-ASSESSMENT[\s\S]*$/gi, '');
  out = out.replace(/\bpending_ceo_review\b/gi, 'CEO onayı bekliyor');
  // Strip agent file hashes (ta-out-xxxxx, rpt-xxxxx etc.)
  out = out.replace(/\b[a-z]{2,4}-(?:out|in|rpt)-[A-Za-z0-9_-]{10,}\b/g, '');
  // Strip "management_guidance" system term
  out = out.replace(/\bmanagement_guidance\b/gi, 'yönetim rehberliği');
  // Common Turkish typos from LLM — ASCII fallback + encoding bugs.
  // Keep this list growing as new LLM output patterns emerge.
  const typoFixes: Array<[RegExp, string]> = [
    // ASCII fallback for Turkish chars
    [/\bguclu\b/gi, 'güçlü'],
    [/\bzayif\b/gi, 'zayıf'],
    [/\bDegerleme\b/g, 'Değerleme'],
    [/\bdegerleme\b/g, 'değerleme'],
    [/\bKarlilik\b/g, 'Kârlılık'],
    [/\bkarlilik\b/g, 'kârlılık'],
    [/\bAgirlikli\b/g, 'Ağırlıklı'],
    [/\bagirlikli\b/g, 'ağırlıklı'],
    [/\bBuyume\b/g, 'Büyüme'],
    [/\bbuyume\b/g, 'büyüme'],
    [/\bOzet\b/g, 'Özet'],
    [/\bozet\b/g, 'özet'],
    [/\bFinanscal\b/g, 'Finansal'],
    [/\bfinanscal\b/g, 'finansal'],
    [/\bSirket\b/g, 'Şirket'],
    [/\bsirket\b/g, 'şirket'],
    [/\bOzsermaye\b/g, 'Özsermaye'],
    [/\bozsermaye\b/g, 'özsermaye'],
    [/\bDoviz\b/g, 'Döviz'],
    [/\bdoviz\b/g, 'döviz'],
    [/\bFaalıyet\b/g, 'Faaliyet'],
    [/\bfaalıyet\b/g, 'faaliyet'],
    [/\bCalisma\b/g, 'Çalışma'],
    [/\bcalisma\b/g, 'çalışma'],
    [/\bUretim\b/g, 'Üretim'],
    [/\buretim\b/g, 'üretim'],
    // Encoding bugs
    [/\bBüsük\b/g, 'Büyük'],
    [/\bbüsük\b/g, 'büyük'],
    [/\beesasl/gi, 'esasl'],
    [/\brotalarininin\b/gi, 'rotalarının'],
    [/\bstruktur/gi, 'yapıs'],
    [/\bANLAT1SI\b/g, 'ANLATISI'],
    [/\bAnlatiisi\b/g, 'Anlatısı'],
    [/\bAg Irlikli\b/g, 'Ağırlıklı'],
    [/\bkalmistr\b/g, 'kalmıştır'],
    [/\bgorunuyor\b/g, 'görünüyor'],
    [/\bGorunuyor\b/g, 'Görünüyor'],
    [/\byuksek\b/g, 'yüksek'],
    [/\bYuksek\b/g, 'Yüksek'],
    [/\bdusuk\b/g, 'düşük'],
    [/\bDusuk\b/g, 'Düşük'],
    [/\bgelecek donem\b/gi, 'gelecek dönem'],
    [/\bsektorde\b/g, 'sektörde'],
    [/\bdonem\b/g, 'dönem'],
    [/\bsure\b(?=\s)/g, 'süre'],
    [/\bortalama\b/g, 'ortalama'],
    // Repeated words
    [/\b(\w+)\s+\1\b/g, '$1'],
  ];
  for (const [re, fix] of typoFixes) out = out.replace(re, fix);
  out = out.replace(/  +/g, ' ');

  // Drop redundant heading lines that snuck into the slice.
  out = out.replace(/^\s*#{1,6}\s+.*$/gm, '').trim();

  // Convert markdown tables to HTML tables (block-level or inline).
  // Block-level: consecutive | ... | lines
  {
    const lines = out.split('\n');
    const result: string[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const block: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          block.push(lines[i].trim());
          i++;
        }
        if (block.length >= 3 && /^\|[\s|:\-]+\|$/.test(block[1])) {
          const splitCells = (r: string) => r.slice(1, -1).split('|').map(c => c.trim());
          const headerCells = splitCells(block[0]);
          const bodyRows = block.slice(2).map(splitCells);
          const thead = `<thead><tr>${headerCells.map(c => `<th>${c}</th>`).join('')}</tr></thead>`;
          const tbody = `<tbody>${bodyRows.map(cells => `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
          result.push(`<table>${thead}${tbody}</table>`);
        } else {
          result.push(...block);
        }
      } else {
        result.push(line);
        i++;
      }
    }
    out = result.join('\n');
  }

  // Inline squished tables: "| h1 | h2 | |---|---| | a | b |" all on one paragraph
  out = out.replace(/(\|[^|\n]+(?:\|[^|\n]+)+\|)\s*(\|[\s|:\-]+\|)\s*((?:\|[^|\n]+(?:\|[^|\n]+)+\|\s*)+)/g, (_, header, sep, body) => {
    void sep;
    const splitCells = (r: string) => r.slice(1, -1).split('|').map(c => c.trim());
    const headerCells = splitCells(header.trim());
    const rowMatches = body.match(/\|[^|\n]+(?:\|[^|\n]+)+\|/g) ?? [];
    const bodyRows = rowMatches.map((r: string) => splitCells(r.trim()));
    if (headerCells.length === 0 || bodyRows.some((r: string[]) => r.length !== headerCells.length)) return _;
    const thead = `<thead><tr>${headerCells.map(c => `<th>${c}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${bodyRows.map((cells: string[]) => `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table>${thead}${tbody}</table>`;
  });
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
    // Horizontal rules
    if (/^---+$/.test(line) || /^\*\*\*+$/.test(line) || /^___+$/.test(line)) {
      flushParagraph();
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push('<hr>');
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
    .replace(/<(?!\/?(?:strong|em|table|thead|tbody|tr|th|td|ul|ol|li|p|h[1-6]|div|hr|br|blockquote|sup|code)\b)/g, '&lt;');
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
