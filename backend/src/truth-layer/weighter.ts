/**
 * Financial Truth Layer — valuation methodology weighter.
 *
 * Given a CompanyClassification, recommend a valuation methodology mix.
 * Outputs are advisory: val_scenario_builder may use the weights when
 * blending sub-agent outputs into a composite target. Existing sub-agent
 * contracts are unchanged — this layer only suggests, never overrides.
 *
 * Methodology principles:
 * - Holdings: SOTP primary (NAV breakdown of subsidiaries) — DCF distorts
 *   when banking/insurance subsidiaries are consolidated.
 * - Banks: P/B + DDM primary; DCF requires custom assumptions (P&L != FCF).
 * - Real estate: NAV primary; DCF appropriate only for development-heavy.
 * - Regular industrials: DCF primary, comps secondary, SOTP if multi-segment.
 */

import type { CompanyClassification, ValuationMethod, ValuationMethodologyWeights } from './types.js';

/** Default weighting blueprint per company type. Sum to 1.0. */
const TEMPLATE_REGULAR: Record<ValuationMethod, number> = {
  val_dcf: 0.55,
  val_trading_comps: 0.35,
  val_sotp: 0.10,
  val_p_b: 0,
  val_ddm: 0,
  val_nav: 0,
};

const TEMPLATE_HOLDING: Record<ValuationMethod, number> = {
  val_sotp: 0.70,
  val_dcf: 0.20,
  val_trading_comps: 0.10,
  val_p_b: 0,
  val_ddm: 0,
  val_nav: 0,
};

const TEMPLATE_HOLDING_BANKING_HEAVY: Record<ValuationMethod, number> = {
  // KCHOL/SAHOL — banking subsidiary distorts consolidated DCF; SOTP must
  // dominate, with P/B-style adjustment for the banking sleeve.
  val_sotp: 0.65,
  val_p_b: 0.20,
  val_dcf: 0.10,
  val_trading_comps: 0.05,
  val_ddm: 0,
  val_nav: 0,
};

const TEMPLATE_BANKING: Record<ValuationMethod, number> = {
  val_p_b: 0.50,
  val_ddm: 0.30,
  val_trading_comps: 0.20,
  val_dcf: 0,
  val_sotp: 0,
  val_nav: 0,
};

const TEMPLATE_REAL_ESTATE: Record<ValuationMethod, number> = {
  val_nav: 0.60,
  val_sotp: 0.20,
  val_trading_comps: 0.15,
  val_dcf: 0.05,
  val_p_b: 0,
  val_ddm: 0,
};

const TEMPLATE_INSURANCE: Record<ValuationMethod, number> = {
  val_p_b: 0.40,
  val_trading_comps: 0.30,
  val_ddm: 0.20,
  val_dcf: 0.10,
  val_sotp: 0,
  val_nav: 0,
};

function pickTemplate(classification: CompanyClassification): {
  template: Record<ValuationMethod, number>;
  label: string;
  justification: string;
} {
  if (classification.is_banking) {
    return {
      template: TEMPLATE_BANKING,
      label: 'banking',
      justification: 'Bank: P/B (price-to-book) primary because deposit-taking institutions are valued on equity capital quality; DDM secondary; DCF inappropriate (P&L cash flow != enterprise FCF for banks).',
    };
  }
  if (classification.is_holding) {
    if (classification.sub_classifications.includes('banking_heavy')) {
      return {
        template: TEMPLATE_HOLDING_BANKING_HEAVY,
        label: 'holding_banking_heavy',
        justification: 'Holding consolidates banking subsidiary (e.g., KCHOL/YKBNK or SAHOL/AKBNK) — consolidated DCF is distorted by bank P&L. SOTP primary; P/B sleeve for the bank component; DCF heavily deprioritized.',
      };
    }
    return {
      template: TEMPLATE_HOLDING,
      label: 'holding',
      justification: 'Diversified holding/conglomerate — SOTP primary because aggregate DCF averages mismatched segment economics. Subsidiary-level NAV breakdown is the canonical lens.',
    };
  }
  if (classification.is_real_estate) {
    return {
      template: TEMPLATE_REAL_ESTATE,
      label: 'real_estate',
      justification: 'Real estate / REIT — NAV primary (mark-to-market portfolio); DCF only appropriate for development-heavy entities.',
    };
  }
  if (classification.is_insurance) {
    return {
      template: TEMPLATE_INSURANCE,
      label: 'insurance',
      justification: 'Insurance — P/B + comps primary; reserves and float make DCF assumptions fragile.',
    };
  }
  return {
    template: TEMPLATE_REGULAR,
    label: 'regular_industrial',
    justification: 'Regular industrial/services — DCF primary (FCF generation is the central economic driver); trading comps secondary as cross-check.',
  };
}

export function recommendValuationWeights(
  classification: CompanyClassification,
): ValuationMethodologyWeights {
  const { template, label, justification } = pickTemplate(classification);

  // Filter: methods with weight=0 are inappropriate; >0 but < 0.15 are secondary
  const inappropriate: ValuationMethod[] = [];
  const secondary: ValuationMethod[] = [];
  let primary: ValuationMethod = 'val_dcf';
  let topWeight = 0;
  for (const [m, w] of Object.entries(template) as Array<[ValuationMethod, number]>) {
    if (w === 0) inappropriate.push(m);
    else if (w < 0.15) secondary.push(m);
    if (w > topWeight) {
      topWeight = w;
      primary = m;
    }
  }

  return {
    ticker: classification.ticker,
    classification,
    primary_method: primary,
    weights: { ...template },
    secondary_methods: secondary,
    inappropriate_methods: inappropriate,
    justification: `[${label}] ${justification}`,
  };
}

/** Convenience: lookup weight for a specific method. */
export function methodWeight(
  weights: ValuationMethodologyWeights,
  method: ValuationMethod,
): number {
  return weights.weights[method] ?? 0;
}
