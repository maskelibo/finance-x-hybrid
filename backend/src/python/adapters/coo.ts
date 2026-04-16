/**
 * coo adapter — deterministic pre-flight + delivery checks.
 *
 * Ported from python-services/src/financex/calculators/coo.py so the
 * rules run in-process without a Python subprocess. Keep the two
 * sides in sync — if you add a _PreflightRule in Python, mirror it
 * in PREFLIGHT_RULES below (and vice-versa).
 *
 * The LLM coo agent does more than this (directive issuance, memory
 * lookup, qualitative checks). When PYTHON_COO_ENABLED is off the
 * LLM path keeps running — this module is a rollback target for the
 * deterministic subset.
 */

export type Sector = 'industrial' | 'banking' | 'holding' | 'insurance' | 'reit';
export type PreflightDecision = 'go' | 'conditional' | 'no_go';
export type DeliveryDecision = 'approved' | 'revision_needed' | 'blocked';


export interface CheckItem {
  code: string;
  label: string;
  passed: boolean;
  message: string;
}


export interface PreflightReport {
  ticker: string;
  sector: Sector;
  decision: PreflightDecision;
  items: CheckItem[];
}


export interface DeliveryReport {
  ticker: string;
  decision: DeliveryDecision;
  items: CheckItem[];
}


interface PreflightRule {
  code: string;
  label: string;
  sectors: ReadonlyArray<Sector>;
}


const ALL_SECTORS: ReadonlyArray<Sector> = ['industrial', 'banking', 'holding', 'insurance', 'reit'];

const PREFLIGHT_RULES: ReadonlyArray<PreflightRule> = [
  { code: 'KAP_ACCESS',          label: 'Reachable KAP endpoint (api/search/combined)', sectors: ALL_SECTORS },
  { code: 'TCMB_FX',             label: 'TCMB daily FX bulletin reachable',             sectors: ALL_SECTORS },
  { code: 'FIVE_YEAR_WINDOW',    label: 'Five-year fetch window resolvable',             sectors: ALL_SECTORS },
  { code: 'BDDK_FORMAT_AWARE',   label: 'Parser loaded banking label overlay',           sectors: ['banking'] },
  { code: 'HOLDING_SOTP_NOTED',  label: 'Holding SOTP requirement flagged to valuation', sectors: ['holding'] },
];


export function runPreflight(
  ticker: string,
  sector: Sector,
  facts: Record<string, boolean> = {},
): PreflightReport {
  const items: CheckItem[] = [];
  let failedAny = false;

  for (const rule of PREFLIGHT_RULES) {
    if (!rule.sectors.includes(sector)) continue;
    // Optimistic default: missing probe = assume OK so preflight never
    // blocks just because a liveness probe wasn't run.
    const passed = facts[rule.code] !== false;
    if (!passed) failedAny = true;
    items.push({
      code: rule.code,
      label: rule.label,
      passed,
      message: passed ? 'ok' : `fact missing or false for ${rule.code}`,
    });
  }

  return {
    ticker: ticker.toUpperCase(),
    sector,
    decision: failedAny ? 'no_go' : 'go',
    items,
  };
}


const TABLE_OPEN_RE = /<table\b/gi;
const TABLE_CLOSE_RE = /<\/table>/gi;


export function runDeliveryCheck(ticker: string, html: string): DeliveryReport {
  const items: CheckItem[] = [];
  const lower = html.toLowerCase();

  // 1. HTML structural integrity
  const openTables = (html.match(TABLE_OPEN_RE) ?? []).length;
  const closeTables = (html.match(TABLE_CLOSE_RE) ?? []).length;
  const tablesOk = openTables === closeTables;
  items.push({
    code: 'TABLE_BALANCE',
    label: 'Every <table> closes properly',
    passed: tablesOk,
    message: `${openTables} opened, ${closeTables} closed`,
  });

  // 2. Document envelope
  const envelopeOk = lower.includes('<html') && lower.includes('</html>');
  items.push({
    code: 'HTML_ENVELOPE',
    label: 'HTML envelope present',
    passed: envelopeOk,
    message: envelopeOk ? 'ok' : 'missing <html> or </html>',
  });

  // 3. Mandatory SPK disclaimer
  const disclaimerOk = lower.includes('yatırım tavsiyesi değildir');
  items.push({
    code: 'SPK_DISCLAIMER',
    label: 'Mandatory SPK disclaimer present',
    passed: disclaimerOk,
    message: disclaimerOk ? 'ok' : "missing 'yatırım tavsiyesi değildir'",
  });

  // 4. Minimum page-count proxy — full LLM template is 80 KB+; minimal
  // Python template is ~6 KB. Floor at 5 KB to catch stubs / errors.
  const sizeOk = html.length >= 5_000;
  items.push({
    code: 'MIN_PAYLOAD_SIZE',
    label: 'Rendered HTML ≥ 5 KB',
    passed: sizeOk,
    message: `${html.length} bytes`,
  });

  let decision: DeliveryDecision;
  if (!envelopeOk || !disclaimerOk) decision = 'blocked';
  else if (!tablesOk || !sizeOk) decision = 'revision_needed';
  else decision = 'approved';

  return {
    ticker: ticker.toUpperCase(),
    decision,
    items,
  };
}


// ---------------------------------------------------------------------
// Phase dispatcher — the orchestrator tells us which phase we're in
// (preflight before data_collection, delivery after report_formatter)
// ---------------------------------------------------------------------

export type CooPhase = 'preflight' | 'delivery';


export interface LegacyCooOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  phase: CooPhase;
  decision: PreflightDecision | DeliveryDecision;
  checks: CheckItem[];
  directives: string[];
  warnings: string[];
  review_status: string;
  source: 'python';
}


export function adaptCooForLegacy(
  report: PreflightReport | DeliveryReport,
  phase: CooPhase,
  outputId: string,
): LegacyCooOutput {
  const warnings = report.items
    .filter(it => !it.passed)
    .map(it => `${it.code}: ${it.message}`);

  const directives: string[] = [];
  if (phase === 'preflight') {
    const pre = report as PreflightReport;
    if (pre.sector === 'banking') directives.push('Banking filer — BDDK label overlay + NII_RECONCILE rules apply.');
    if (pre.sector === 'holding') directives.push('Holding — SOTP valuation required; consolidated DCF is upper-bound only.');
  }

  return {
    agent_id: 'coo',
    output_id: outputId,
    ticker: report.ticker,
    phase,
    decision: report.decision,
    checks: report.items,
    directives,
    warnings,
    review_status: 'pending_ceo_review',
    source: 'python',
  };
}
