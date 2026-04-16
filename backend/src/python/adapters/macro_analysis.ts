/**
 * macro_analysis adapter — Python MacroSnapshot / TransmissionImpact →
 * legacy macro_analysis agent shape.
 *
 * The LLM version used to synthesise geopolitics, management macro
 * assessment, and transmission mechanisms. The Python side provides
 * the *numbers* (FX, policy rate, transmission impacts); the legacy
 * consumer gets a drastically smaller object but sees `source:python`
 * in the metadata so downstream LLMs (strategic_synthesis) know not
 * to expect geopolitical narrative here.
 */

export interface PythonMacroSnapshot {
  as_of?: string | null;
  tcmb_policy_rate?: string | null;
  tcmb_10y_bond_yield?: string | null;
  cpi_yoy?: string | null;
  ppi_yoy?: string | null;
  usd_try?: string | null;
  eur_try?: string | null;
  gdp_yoy?: string | null;
  bist100_level?: string | null;
  bist100_ytd_return?: string | null;
  sources?: unknown[];
}

export interface LegacyMacroAnalysisOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  as_of: string | null;
  rates: {
    policy_rate: string | null;
    tcmb_10y: string | null;
  };
  inflation: {
    cpi_yoy: string | null;
    ppi_yoy: string | null;
  };
  fx: {
    usd_try: string | null;
    eur_try: string | null;
  };
  growth: {
    gdp_yoy: string | null;
  };
  equity: {
    bist100_level: string | null;
    bist100_ytd_return: string | null;
  };
  source: 'python';
  warnings: string[];
  review_status: string;
}


export function adaptPythonMacroForLegacy(
  py: PythonMacroSnapshot,
  ticker: string,
  outputId: string,
): LegacyMacroAnalysisOutput {
  const warnings: string[] = [];
  if (py.usd_try == null) warnings.push('USD/TRY missing — TCMB FX fetch may have failed');
  if (py.tcmb_policy_rate == null) warnings.push('TCMB policy rate missing (EVDS key not supplied; provide via --policy-rate)');

  return {
    agent_id: 'macro_analysis',
    output_id: outputId,
    ticker: ticker.toUpperCase(),
    as_of: py.as_of ?? null,
    rates: {
      policy_rate: py.tcmb_policy_rate ?? null,
      tcmb_10y: py.tcmb_10y_bond_yield ?? null,
    },
    inflation: {
      cpi_yoy: py.cpi_yoy ?? null,
      ppi_yoy: py.ppi_yoy ?? null,
    },
    fx: {
      usd_try: py.usd_try ?? null,
      eur_try: py.eur_try ?? null,
    },
    growth: {
      gdp_yoy: py.gdp_yoy ?? null,
    },
    equity: {
      bist100_level: py.bist100_level ?? null,
      bist100_ytd_return: py.bist100_ytd_return ?? null,
    },
    source: 'python',
    warnings,
    review_status: 'pending_ceo_review',
  };
}
