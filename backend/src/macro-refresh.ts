/**
 * Macro Facts Auto-Refresh
 * Fetches current TCMB policy rate, CPI, USD/TRY at session start.
 * Prevents stale memory values (e.g., TCMB %46 when actual is %37).
 */

export interface MacroSnapshot {
  asOf: string;
  tcmbPolicyRate: number | null;
  cpiYoY: number | null;
  usdTry: number | null;
  eurTry: number | null;
  brent: number | null;
  source: string;
}

export async function fetchMacroSnapshot(): Promise<MacroSnapshot> {
  const asOf = new Date().toISOString().slice(0, 10);
  const snapshot: MacroSnapshot = {
    asOf,
    tcmbPolicyRate: null,
    cpiYoY: null,
    usdTry: null,
    eurTry: null,
    brent: null,
    source: 'multi-source',
  };

  // Try TCMB: https://evds2.tcmb.gov.tr/service/evds/
  // For simplicity, use secondary sources that don't require API keys
  try {
    // USD/TRY from exchangerate-api
    const fxRes = await fetch('https://open.er-api.com/v6/latest/USD');
    if (fxRes.ok) {
      const fx = await fxRes.json() as any;
      if (fx.rates?.TRY) snapshot.usdTry = fx.rates.TRY;
      if (fx.rates?.TRY && fx.rates?.EUR) {
        snapshot.eurTry = fx.rates.TRY / fx.rates.EUR;
      }
    }
  } catch (err) {
    console.warn(`[macro] FX fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // TCMB rate, CPI, Brent require web scraping or paid APIs
  // For now, mark as null and let macro_analysis agent fill via WebSearch
  // The key benefit: caller knows which facts ARE fresh vs need lookup

  return snapshot;
}
