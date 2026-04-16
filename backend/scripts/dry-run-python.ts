/**
 * Dry-run: apply every Python adapter against a completed session's
 * LLM outputs, WITHOUT touching the DB or calling Claude.
 *
 * Reads agent_runs rows for a target session_id, feeds the LLM
 * output_text of each upstream agent into the matching Python
 * adapter, prints the Python result alongside a size diff vs the
 * LLM version, and flags any extract/adapt failures.
 *
 * Usage:   cd backend && npx tsx scripts/dry-run-python.ts [session_id]
 * Default: most recent completed session.
 */

import { db } from '../src/db.js';
import {
  adaptDisclosuresToClassification,
  extractDisclosuresFromUpstream,
} from '../src/python/adapters/event_classification.js';
import {
  adaptClassifiedToImpacts,
  extractClassifiedEventsFromUpstream,
} from '../src/python/adapters/event_impact_mapper.js';
import {
  adaptCooForLegacy,
  runDeliveryCheck,
  runPreflight,
} from '../src/python/adapters/coo.js';
import {
  adaptQaReviewForLegacy,
  extractFinancialAnalysis as extractFaForQa,
  extractReconciliation,
} from '../src/python/adapters/qa_review.js';
import {
  adaptSectorCompetitionForLegacy,
  extractFinancialAnalysis as extractFaForSc,
  extractPeers,
} from '../src/python/adapters/sector_competition.js';
import {
  adaptStrategicSynthesisForLegacy,
  extractEventImpact,
  extractFinancialAnalysis as extractFaForSs,
  extractMacro,
  extractSectorCompetition,
  extractTechnical,
} from '../src/python/adapters/strategic_synthesis.js';
import {
  adaptValuationForLegacy,
  extractFinancialAnalysis as extractFaForVal,
  extractSectorCompetition as extractScForVal,
} from '../src/python/adapters/valuation.js';
import {
  adaptAnalystConsensusForLegacy,
  extractReports,
} from '../src/python/adapters/analyst_consensus.js';
import {
  adaptEsgForLegacy,
  extractCbamInputs,
} from '../src/python/adapters/esg.js';


const targetSessionId = process.argv[2] ?? (() => {
  const row = db.prepare(
    `SELECT id FROM analysis_sessions WHERE status='completed' ORDER BY started_at DESC LIMIT 1`,
  ).get() as { id: string } | undefined;
  return row?.id;
})();

if (!targetSessionId) {
  console.error('No completed session found. Pass a session_id as arg.');
  process.exit(1);
}

const sessionMeta = db.prepare(
  `SELECT ticker, status FROM analysis_sessions WHERE id = ?`,
).get(targetSessionId) as { ticker: string; status: string } | undefined;

if (!sessionMeta) {
  console.error(`Session ${targetSessionId} not found`);
  process.exit(1);
}

const { ticker } = sessionMeta;


function llmOutput(agentId: string): string | null {
  const row = db.prepare(
    `SELECT output_text FROM agent_runs WHERE session_id = ? AND agent_id = ? AND status = 'completed' ORDER BY id DESC LIMIT 1`,
  ).get(targetSessionId, agentId) as { output_text: string | null } | undefined;
  return row?.output_text ?? null;
}


function pad(s: string, n: number): string {
  return s + ' '.repeat(Math.max(0, n - s.length));
}


function heading(title: string): void {
  const line = '━'.repeat(72);
  console.log(`\n${line}\n  ${title}\n${line}`);
}


interface DryRunRow {
  agent: string;
  llmBytes: number;
  pyBytes: number;
  status: 'ok' | 'empty' | 'error';
  detail: string;
}


const results: DryRunRow[] = [];


function record(agent: string, llmBytes: number, pyOut: unknown, detail = ''): void {
  const pyStr = JSON.stringify(pyOut, null, 2);
  const pyBytes = pyStr.length;
  let status: DryRunRow['status'] = 'ok';
  if (pyBytes < 200) status = 'empty';
  if (pyOut == null) status = 'error';
  results.push({ agent, llmBytes, pyBytes, status, detail });

  console.log(`\n--- ${agent} ---`);
  console.log(`  LLM output: ${llmBytes} bytes`);
  console.log(`  Python out: ${pyBytes} bytes [${status}]`);
  if (detail) console.log(`  ${detail}`);
  const preview = pyStr.length > 1200 ? pyStr.slice(0, 1200) + '\n  ... (truncated)' : pyStr;
  console.log(preview.split('\n').map(l => '  ' + l).join('\n'));
}


heading(`DRY RUN — Session ${targetSessionId} (${ticker})`);


// ------- 1. COO preflight (stand-alone; no upstream needed) -------
try {
  const sector = ticker === 'KCHOL' || ticker === 'SAHOL' ? 'holding'
               : ticker === 'AKBNK' ? 'banking'
               : 'industrial';
  const preflight = runPreflight(ticker, sector);
  const llm = llmOutput('coo');
  record('coo:preflight',
    llm?.length ?? 0,
    adaptCooForLegacy(preflight, 'preflight', 'dry-coo-pre'),
    `sector=${sector} decision=${preflight.decision}`,
  );
} catch (err) {
  record('coo:preflight', 0, null, `ERROR: ${(err as Error).message}`);
}


// ------- 2. event_classification -------
try {
  const kapOut = llmOutput('kap_watch');
  if (!kapOut) throw new Error('no kap_watch output');
  const disclosures = extractDisclosuresFromUpstream(kapOut);
  const out = adaptDisclosuresToClassification(disclosures, ticker, 'dry-ec');
  record('event_classification',
    llmOutput('event_classification')?.length ?? 0,
    out,
    `${disclosures.length} disclosures → ${out.classified_events.length} classified, high=${out.high_confidence_count}`,
  );
} catch (err) {
  record('event_classification', 0, null, `ERROR: ${(err as Error).message}`);
}


// ------- 3. event_impact_mapper -------
try {
  const ecLlm = llmOutput('event_classification');
  if (!ecLlm) throw new Error('no event_classification output');
  const classified = extractClassifiedEventsFromUpstream(ecLlm);
  const out = adaptClassifiedToImpacts(classified, ticker, 'dry-eim');
  record('event_impact_mapper',
    llmOutput('event_impact_mapper')?.length ?? 0,
    out,
    `${classified.length} events → ${out.event_impacts.length} impacts, direct=${out.events_requiring_full_mapping}`,
  );
} catch (err) {
  record('event_impact_mapper', 0, null, `ERROR: ${(err as Error).message}`);
}


// ------- 4. sector_competition (no peers → warn-only output) -------
try {
  const faLlm = llmOutput('financial_analysis');
  if (!faLlm) throw new Error('no financial_analysis output');
  const company = extractFaForSc(faLlm);
  const peers = extractPeers(null);
  const out = adaptSectorCompetitionForLegacy(company, peers, ticker, 'dry-sc');
  record('sector_competition',
    llmOutput('sector_competition')?.length ?? 0,
    out,
    `benchmarks=${out.benchmarks.length} strengths=${out.strengths.length} weaknesses=${out.weaknesses.length}`,
  );
} catch (err) {
  record('sector_competition', 0, null, `ERROR: ${(err as Error).message}`);
}


// ------- 5. qa_review -------
try {
  const fa = extractFaForQa(llmOutput('financial_analysis'));
  const rec = extractReconciliation(llmOutput('reconciliation'));
  const out = adaptQaReviewForLegacy(fa, rec, ticker, 'dry-qa');
  record('qa_review',
    llmOutput('qa_review')?.length ?? 0,
    out,
    `decision=${out.qa_decision} overall=${out.overall_score} flags=${out.quality_flags.length}`,
  );
} catch (err) {
  record('qa_review', 0, null, `ERROR: ${(err as Error).message}`);
}


// ------- 6. strategic_synthesis -------
try {
  const out = adaptStrategicSynthesisForLegacy({
    financialAnalysis: extractFaForSs(llmOutput('financial_analysis')),
    sectorCompetition: extractSectorCompetition(llmOutput('sector_competition')),
    technical:         extractTechnical(llmOutput('technical_analysis')),
    macro:             extractMacro(llmOutput('macro_analysis')),
    eventImpact:       extractEventImpact(llmOutput('event_impact_mapper')),
  }, ticker, 'dry-ss');
  record('strategic_synthesis',
    llmOutput('strategic_synthesis')?.length ?? 0,
    out,
    `score=${out.convergence_score} confidence=${out.confidence} signals=${out.signals.positive.length}p/${out.signals.negative.length}n/${out.signals.neutral.length}= divergences=${out.divergences.length}`,
  );
} catch (err) {
  record('strategic_synthesis', 0, null, `ERROR: ${(err as Error).message}`);
}


// ------- 7. valuation_agent -------
try {
  const out = adaptValuationForLegacy(
    extractFaForVal(llmOutput('financial_analysis')),
    extractScForVal(llmOutput('sector_competition')),
    ticker, 'dry-val',
  );
  record('valuation_agent',
    llmOutput('valuation_agent')?.length ?? 0,
    out,
    `sector=${out.sector} dcf=${out.dcf ? 'present' : 'missing'} try_wacc=${out.try_wacc_warning} holding_sotp=${out.holding_sotp_required} banking=${out.banking_sector_warning}`,
  );
} catch (err) {
  record('valuation_agent', 0, null, `ERROR: ${(err as Error).message}`);
}


// ------- 8. analyst_consensus (no reports → warn-only output) -------
try {
  const reports = extractReports(null);
  const out = adaptAnalystConsensusForLegacy(reports, ticker, 'dry-ac');
  record('analyst_consensus_agent',
    llmOutput('analyst_consensus_agent')?.length ?? 0,
    out,
    `count=${reports.length} — enrichment required for real output`,
  );
} catch (err) {
  record('analyst_consensus_agent', 0, null, `ERROR: ${(err as Error).message}`);
}


// ------- 9. esg_agent (no cbam inputs → warn-only output) -------
try {
  const cbamIn = extractCbamInputs(null);
  const out = adaptEsgForLegacy(cbamIn, ticker, 'dry-esg');
  record('esg_agent',
    llmOutput('esg_agent')?.length ?? 0,
    out,
    `cbam=${out.cbam ? 'computed' : 'skipped'} — enrichment required for real output`,
  );
} catch (err) {
  record('esg_agent', 0, null, `ERROR: ${(err as Error).message}`);
}


// ------- 10. event_timeline_alert — skipped in dry-run (spawns Python CLI)
console.log(`\n--- event_timeline_alert ---`);
console.log(`  SKIPPED in dry-run (spawns financex timeline bucket CLI; covered by runners.test.ts + live test)`);


// ------- 11. COO delivery (runs on final formatted HTML) -------
try {
  const formatter = llmOutput('report_formatter');
  if (!formatter) throw new Error('no report_formatter output');
  // Formatter wraps HTML in a JSON envelope {formatted_html: "..."}.
  let html = formatter;
  try {
    const parsed = JSON.parse(formatter);
    if (typeof parsed === 'object' && parsed?.formatted_html) html = parsed.formatted_html;
  } catch { /* use raw */ }
  const delivery = runDeliveryCheck(ticker, html);
  record('coo:delivery',
    formatter.length,
    adaptCooForLegacy(delivery, 'delivery', 'dry-coo-del'),
    `html=${html.length}B decision=${delivery.decision}`,
  );
} catch (err) {
  record('coo:delivery', 0, null, `ERROR: ${(err as Error).message}`);
}


// ------- Summary -------
heading('SUMMARY');
console.log(`\n  ${pad('Agent', 30)} ${pad('LLM bytes', 12)} ${pad('Py bytes', 12)} Status`);
console.log(`  ${'-'.repeat(30)} ${'-'.repeat(12)} ${'-'.repeat(12)} ------`);
for (const r of results) {
  const ratio = r.llmBytes > 0 ? `(${Math.round((r.pyBytes / r.llmBytes) * 100)}%)` : '';
  console.log(
    `  ${pad(r.agent, 30)} ${pad(String(r.llmBytes), 12)} ${pad(String(r.pyBytes), 12)} ${r.status} ${ratio}`,
  );
}

const errors = results.filter(r => r.status === 'error').length;
const empties = results.filter(r => r.status === 'empty').length;
console.log(`\n  ${results.length} adapters run, ${errors} errors, ${empties} empty.`);
process.exit(errors > 0 ? 1 : 0);
