/**
 * IAS 29 adapter — reshape engine-computed IAS 29 figures into the
 * downstream contract that financial_analysis, valuation_agent and
 * strategic_synthesis consume.
 *
 * Source of truth: python-services/src/financex/calculators/ias29.py
 * and the ebitda_ias29 / ebitda_margin_ias29 ratios emitted by
 * compute_for_period() in financial_engine.py.
 *
 * Shape mirrors Ias29EbitdaResult.to_dict() so the Node side can
 * inject it verbatim into prompts.
 */

export interface Ias29Components {
  operating_profit_restated: number | null;
  depreciation_restated: number | null;
  amortization_restated: number | null;
  net_monetary_position_gain_loss: number | null;
}

export interface Ias29Reconciliation {
  reported_ebitda: number | null;
  computed_ebitda_ias29: number | null;
  divergence: number | null;
  likely_cause: string;
  action_hint: string;
}

export interface Ias29Result {
  ticker: string;
  fiscal_period: string;
  ias29_applied: boolean;
  ebitda_ias29: number | null;
  ebitda_margin_ias29: number | null;
  components: Ias29Components;
  excluded_items: { net_monetary_position_gain_loss: number | null };
  reconciliation: Ias29Reconciliation | null;
  warnings: string[];
}

const NMP_INCLUSION_TOLERANCE = 0.05;

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export interface EngineSnapshotForIas29 {
  ratios?: {
    ebitda?: { value?: number | string | null } | null;
    ebitda_ias29?: { value?: number | string | null; warning?: string | null } | null;
    ebitda_margin_ias29?: { value?: number | string | null } | null;
  } | null;
}

export interface StatementsForIas29 {
  operating_profit_restated?: number | null;
  depreciation_restated?: number | null;
  amortization_restated?: number | null;
  net_monetary_position_gain_loss?: number | null;
  reported_ebitda?: number | null;
  ias29_applied?: boolean;
}

/**
 * Build the normalized IAS 29 block that downstream agents consume.
 * Combines engine-computed ratios with parse/reconciliation IAS 29 fields.
 */
export function buildIas29Block(
  ticker: string,
  fiscalPeriod: string,
  engine: EngineSnapshotForIas29 | null,
  stmts: StatementsForIas29 | null,
): Ias29Result {
  const warnings: string[] = [];
  const rEbitda = num(engine?.ratios?.ebitda_ias29?.value);
  const rMargin = num(engine?.ratios?.ebitda_margin_ias29?.value);
  const engineWarn = engine?.ratios?.ebitda_ias29?.warning;
  if (engineWarn) warnings.push(`engine: ${engineWarn}`);

  const op = num(stmts?.operating_profit_restated);
  const dep = num(stmts?.depreciation_restated);
  const amort = num(stmts?.amortization_restated);
  const nmp = num(stmts?.net_monetary_position_gain_loss);
  const reported = num(stmts?.reported_ebitda);
  const ias29Applied = Boolean(stmts?.ias29_applied);

  let reconciliation: Ias29Reconciliation | null = null;
  if (reported !== null && rEbitda !== null && reported !== rEbitda) {
    const divergence = reported - rEbitda;
    let likely = 'unknown — verify restatement methodology';
    let hint = 'cross-check with Note 2.x (IAS 29) and Note 35 (Net Monetary Position)';
    if (nmp !== null) {
      const threshold = NMP_INCLUSION_TOLERANCE * Math.abs(reported);
      if (Math.abs(divergence - nmp) <= threshold) {
        likely = `reported_ebitda includes net_monetary_position_gain_loss (${nmp >= 0 ? '+' : ''}${nmp.toLocaleString()}); exclude per IAS 29 operating definition`;
        hint = 'use computed_ebitda_ias29 (excludes NMP); flag management disclosure inconsistency';
      }
    }
    reconciliation = {
      reported_ebitda: reported,
      computed_ebitda_ias29: rEbitda,
      divergence,
      likely_cause: likely,
      action_hint: hint,
    };
  }

  if (!ias29Applied && nmp !== null && op !== null && Math.abs(nmp) > 0.05 * Math.abs(op)) {
    warnings.push('monetary_gain_loss material but ias29_applied=false; may indicate missing restatement');
  }

  return {
    ticker,
    fiscal_period: fiscalPeriod,
    ias29_applied: ias29Applied,
    ebitda_ias29: rEbitda,
    ebitda_margin_ias29: rMargin,
    components: {
      operating_profit_restated: op,
      depreciation_restated: dep,
      amortization_restated: amort,
      net_monetary_position_gain_loss: nmp,
    },
    excluded_items: { net_monetary_position_gain_loss: nmp },
    reconciliation,
    warnings,
  };
}

/**
 * Render the IAS 29 block as a prompt-friendly markdown section that
 * agents (financial_analysis, valuation_agent, esg_agent) can read
 * directly.
 */
export function formatIas29ForAgent(pack: Ias29Result, maxChars = 2000): string {
  const fmt = (v: number | null, suffix = '') =>
    v === null ? 'n/a' : `${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;

  const lines = [
    `## IAS 29 / TMS 29 — ${pack.ticker} ${pack.fiscal_period}`,
    `- ias29_applied: ${pack.ias29_applied}`,
    `- EBITDA_ias29 (operating-only): ${fmt(pack.ebitda_ias29)}`,
    `- EBITDA margin IAS29: ${fmt(pack.ebitda_margin_ias29, '%')}`,
    `- Components:`,
    `  - operating_profit_restated: ${fmt(pack.components.operating_profit_restated)}`,
    `  - depreciation_restated: ${fmt(pack.components.depreciation_restated)}`,
    `  - amortization_restated: ${fmt(pack.components.amortization_restated)}`,
    `- EXCLUDED (non-operating): net_monetary_position_gain_loss = ${fmt(pack.excluded_items.net_monetary_position_gain_loss)}`,
  ];

  if (pack.reconciliation) {
    const r = pack.reconciliation;
    lines.push(
      `- Reconciliation:`,
      `  - reported_ebitda (mgmt): ${fmt(r.reported_ebitda)}`,
      `  - divergence: ${fmt(r.divergence)}`,
      `  - likely_cause: ${r.likely_cause}`,
      `  - action_hint: ${r.action_hint}`,
    );
  }
  if (pack.warnings.length) {
    lines.push(`- Warnings:`);
    pack.warnings.forEach(w => lines.push(`  - ${w}`));
  }
  lines.push(
    '',
    '**Kural:** NMP (Net Parasal Pozisyon) EBITDA\'ya dahil EDİLMEZ. IAS 29/TMS 29 altında bu kalem Not 35 tipiktir, finansal giderlerin ALTINDA yer alır (non-operating). "Adjusted EBITDA" olarak yönetimin raporladığı farklı bir rakam varsa reconciliation bloğunu uygula.',
  );

  const full = lines.join('\n');
  return full.length > maxChars ? full.slice(0, maxChars) + '\n\n[...kırpıldı]' : full;
}
