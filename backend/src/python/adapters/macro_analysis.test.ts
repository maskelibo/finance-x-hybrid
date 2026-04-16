import { describe, expect, it } from 'vitest';

import {
  adaptPythonMacroForLegacy,
  type PythonMacroSnapshot,
} from './macro_analysis.js';


describe('adaptPythonMacroForLegacy', () => {
  it('nests FX / rates / inflation / equity correctly', () => {
    const snap: PythonMacroSnapshot = {
      as_of: '2026-04-16',
      usd_try: '44.76',
      eur_try: '52.76',
      tcmb_policy_rate: '47.5',
      cpi_yoy: '42.3',
      gdp_yoy: '3.1',
      bist100_level: '10500',
      bist100_ytd_return: '12.4',
    };
    const legacy = adaptPythonMacroForLegacy(snap, 'KCHOL', 'macro-1');
    expect(legacy.fx.usd_try).toBe('44.76');
    expect(legacy.fx.eur_try).toBe('52.76');
    expect(legacy.rates.policy_rate).toBe('47.5');
    expect(legacy.inflation.cpi_yoy).toBe('42.3');
    expect(legacy.growth.gdp_yoy).toBe('3.1');
    expect(legacy.equity.bist100_level).toBe('10500');
  });

  it('warns when USD/TRY is missing', () => {
    const legacy = adaptPythonMacroForLegacy({}, 'KCHOL', 'macro-1');
    expect(legacy.warnings.some(w => w.includes('USD/TRY'))).toBe(true);
  });

  it('warns when policy rate is missing', () => {
    const legacy = adaptPythonMacroForLegacy({ usd_try: '44' }, 'KCHOL', 'macro-1');
    expect(legacy.warnings.some(w => w.includes('policy'))).toBe(true);
  });

  it('tags source=python', () => {
    const legacy = adaptPythonMacroForLegacy({ usd_try: '44', tcmb_policy_rate: '50' }, 'T', 'macro-1');
    expect(legacy.source).toBe('python');
    expect(legacy.warnings).toEqual([]);
  });

  it('uppercases ticker', () => {
    const legacy = adaptPythonMacroForLegacy({}, 'kchol', 'macro-1');
    expect(legacy.ticker).toBe('KCHOL');
  });
});
