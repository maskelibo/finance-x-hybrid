#!/usr/bin/env npx tsx
/**
 * Force two-stage formatter for a completed session.
 * Usage: npx tsx backend/scripts/force-formatter.ts <sessionId>
 */
import { db } from '../src/db.js';
import { runAgent } from '../src/agent-runner.js';
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_ROOT } from '../src/config.js';

const sessionId = process.argv[2];
if (!sessionId) {
  console.error('Usage: npx tsx force-formatter.ts <sessionId>');
  process.exit(1);
}

const session = db.prepare(`SELECT * FROM analysis_sessions WHERE id = ?`).get(sessionId) as any;
if (!session) {
  console.error(`Session ${sessionId} not found`);
  process.exit(1);
}

const ticker = session.ticker;
console.log(`\n🎯 Force two-stage formatter for ${ticker} (${sessionId})\n`);

// Build context from all completed agent outputs
const runs = db.prepare(`
  SELECT agent_id, output_text FROM agent_runs
  WHERE session_id = ? AND status = 'completed' AND output_text IS NOT NULL
`).all(sessionId) as Array<{ agent_id: string; output_text: string }>;

const context: Record<string, unknown> = { ticker };
for (const run of runs) {
  context[`${run.agent_id}_output`] = run.output_text;
}

console.log(`Loaded ${runs.length} agent outputs into context\n`);

const SECTIONS = [
  { id: 'cover_summary', title: 'Kapak + Yönetici Özeti', deps: ['final_summary_output', 'context_extraction_output'] },
  { id: 'financial', title: 'Finansal Analiz + Ratiolar', deps: ['financial_analysis_output'] },
  { id: 'valuation_sector', title: 'Değerleme + Sektör', deps: ['valuation_agent_output', 'sector_competition_output'] },
  { id: 'macro_technical', title: 'Makro + Teknik', deps: ['macro_analysis_output', 'technical_analysis_output'] },
  { id: 'sentiment_events', title: 'Sentiment + Events + ESG', deps: ['sentiment_news_agent_output', 'event_impact_mapper_output', 'analyst_consensus_agent_output', 'esg_agent_output'] },
  { id: 'synthesis_risks', title: 'Stratejik Sentez + Riskler', deps: ['strategic_synthesis_output'] },
];

const sectionOutputs: Record<string, string> = {};

for (const section of SECTIONS) {
  console.log(`\n[SECTION] ${section.title}...`);

  const sectionContext: Record<string, unknown> = { ticker };
  for (const dep of section.deps) {
    const val = String(context[dep] || '').slice(0, 8000);
    if (val) sectionContext[dep] = val;
  }

  const sectionPrompt = [
    `# Section Generator: ${section.title}`,
    ``,
    `Ticker: ${ticker}`,
    `Bu raporun sadece bir bölümü. Sadece "${section.title}" için HTML üret.`,
    ``,
    `## Kurallar:`,
    `- Sadece bu section'ın HTML'ini üret, <section class="section"> ile başla </section> ile bitir`,
    `- İçeride H1 + tablolar + SVG grafikler + callout kutuları olsun`,
    `- CSS class: .section, .kpi-grid, .kpi-card, .data-table, .callout, .callout-positive, .callout-negative, .analysis-block`,
    `- Brand color: #003366 (başlıklar), #059669 (pozitif), #dc2626 (negatif)`,
    `- Metin sandviç: her tablo/grafik öncesi + sonrası metin ZORUNLU`,
    ``,
    `## Upstream Data:`,
    Object.entries(sectionContext).filter(([k]) => k !== 'ticker').map(([k, v]) => `### ${k}\n${v}`).join('\n\n'),
    ``,
    `## Output:`,
    `Sadece HTML ver, başka açıklama yazma. <section class="section"> ile başla.`,
  ].join('\n');

  try {
    const result = await runAgent({
      agentId: 'report_formatter',
      taskPrompt: sectionPrompt,
      context: sectionContext,
      timeoutMs: 10 * 60 * 1000,
    });

    if (result.success && result.output && result.output.length > 1000) {
      sectionOutputs[section.id] = result.output;
      console.log(`  ✓ ${Math.round(result.output.length / 1024)}KB, ${result.tokensUsed} tokens, ${result.durationMs}ms`);
    } else {
      console.warn(`  ✗ failed: ${result.error || 'empty output'}`);
      sectionOutputs[section.id] = `<section class="section"><h1>${section.title}</h1><p>Bu bölüm üretilemedi.</p></section>`;
    }
  } catch (err) {
    console.error(`  ✗ error:`, err);
    sectionOutputs[section.id] = `<section class="section"><h1>${section.title}</h1><p>Hata: ${err instanceof Error ? err.message : String(err)}</p></section>`;
  }
}

const htmlShell = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>${ticker} Kapsamlı Analiz Raporu</title>
<style>
@page { size: A4 portrait; margin: 20mm 15mm; }
body { font-family: 'Georgia', serif; font-size: 10pt; color: #1e293b; line-height: 1.5; }
.section { page-break-before: always; padding: 0 5mm; }
.section:first-child { page-break-before: avoid; }
h1 { color: #003366; font-size: 22pt; border-bottom: 2px solid #003366; padding-bottom: 8px; }
h2 { color: #003366; font-size: 16pt; margin-top: 20px; }
h3 { color: #1e3a5f; font-size: 13pt; }
table, .kpi-grid, .callout, .analysis-block { page-break-inside: avoid; }
table.data-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9pt; }
table.data-table th { background: #003366; color: #fff; padding: 8px; text-align: left; }
table.data-table td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
.kpi-card { border-left: 4px solid #003366; padding: 10px; background: #f8fafc; }
.kpi-label { font-size: 8pt; color: #64748b; text-transform: uppercase; }
.kpi-value { font-size: 16pt; font-weight: bold; color: #003366; margin: 4px 0; }
.callout { padding: 12px; margin: 12px 0; border-radius: 4px; }
.callout-positive { background: #d1fae5; border-left: 4px solid #059669; }
.callout-negative { background: #fee2e2; border-left: 4px solid #dc2626; }
.analysis-block { margin: 16px 0; }
.analysis-intro { font-style: italic; color: #475569; border-left: 3px solid #003366; padding-left: 10px; }
.analysis-commentary { background: #f8fafc; padding: 12px; margin-top: 10px; line-height: 1.7; }
p, li { orphans: 4; widows: 4; }
h1, h2, h3 { page-break-after: avoid; }
</style>
</head>
<body>
${SECTIONS.map(s => sectionOutputs[s.id] || '').join('\n\n')}
<section class="section">
<h2>Yasal Uyarılar</h2>
<p><strong>Sorumluluk Reddi:</strong> Bu rapor sadece bilgilendirme amaçlıdır. Yatırım tavsiyesi değildir. SPK mevzuatı kapsamındadır.</p>
<p><em>Finance X Platform — ${new Date().toLocaleDateString('tr-TR')}</em></p>
</section>
</body>
</html>`;

const htmlPath = path.join(PROJECT_ROOT, `${ticker}_Kapsamli_Analiz_Raporu_2026.html`);
fs.writeFileSync(htmlPath, htmlShell, 'utf8');
console.log(`\n✅ HTML written: ${htmlPath} (${Math.round(htmlShell.length / 1024)}KB)`);

db.prepare(`UPDATE agent_runs SET status = 'completed', output_text = ?, error_message = 'Generated via two-stage formatter (forced)', completed_at = ? WHERE session_id = ? AND agent_id = 'report_formatter'`)
  .run(htmlShell, new Date().toISOString(), sessionId);

db.prepare(`UPDATE analysis_sessions SET status = 'completed', completed_at = ? WHERE id = ?`)
  .run(new Date().toISOString(), sessionId);

console.log(`\n✅ Session marked completed`);
process.exit(0);
