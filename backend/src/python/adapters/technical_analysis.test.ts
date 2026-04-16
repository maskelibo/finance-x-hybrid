import { describe, expect, it } from 'vitest';

import {
  adaptPythonTechnicalForLegacy,
  type PythonTechnicalIndicators,
} from './technical_analysis.js';


describe('adaptPythonTechnicalForLegacy', () => {
  const full: PythonTechnicalIndicators = {
    as_of_date: '2026-04-16',
    ma_20: '196.43',
    ma_50: '200.58',
    ma_200: '181.70',
    rsi_14: '57.32',
    macd: '2.39',
    macd_signal: '0.71',
    macd_histogram: '1.68',
    bollinger_upper: '208.60',
    bollinger_middle: '196.43',
    bollinger_lower: '184.26',
    atr_14: '5.93',
    trend: 'bullish',
  };

  it('nests into moving_averages / momentum / volatility', () => {
    const legacy = adaptPythonTechnicalForLegacy(full, 'KCHOL', 'ta-1');
    expect(legacy.moving_averages.ma_200).toBe('181.70');
    expect(legacy.momentum.rsi_14).toBe('57.32');
    expect(legacy.volatility.bollinger_upper).toBe('208.60');
    expect(legacy.volatility.atr_14).toBe('5.93');
  });

  it('carries trend and as_of_date verbatim', () => {
    const legacy = adaptPythonTechnicalForLegacy(full, 'KCHOL', 'ta-1');
    expect(legacy.trend).toBe('bullish');
    expect(legacy.as_of_date).toBe('2026-04-16');
  });

  it('caps confidence at medium per agent policy', () => {
    const legacy = adaptPythonTechnicalForLegacy(full, 'KCHOL', 'ta-1');
    expect(legacy.confidence).toBe('medium');
  });

  it('adds warning when MA200 unavailable (short history)', () => {
    const short: PythonTechnicalIndicators = { ...full, ma_200: null };
    const legacy = adaptPythonTechnicalForLegacy(short, 'KCHOL', 'ta-1');
    expect(legacy.warnings.length).toBeGreaterThan(0);
    expect(legacy.warnings[0]).toContain('MA200');
  });

  it('returns empty warnings on full indicators', () => {
    const legacy = adaptPythonTechnicalForLegacy(full, 'KCHOL', 'ta-1');
    expect(legacy.warnings).toEqual([]);
  });

  it('upper-cases ticker and preserves output_id', () => {
    const legacy = adaptPythonTechnicalForLegacy(full, 'kchol', 'ta-custom-id');
    expect(legacy.ticker).toBe('KCHOL');
    expect(legacy.output_id).toBe('ta-custom-id');
  });

  it('tolerates sparse indicators (all null)', () => {
    const empty: PythonTechnicalIndicators = {};
    const legacy = adaptPythonTechnicalForLegacy(empty, 'TEST', 'ta-1');
    expect(legacy.moving_averages.ma_20).toBeNull();
    expect(legacy.momentum.rsi_14).toBeNull();
    expect(legacy.trend).toBeNull();
  });

  it('source tag cites local compute and TradingView', () => {
    const legacy = adaptPythonTechnicalForLegacy(full, 'KCHOL', 'ta-1');
    expect(legacy.source_tag).toContain('lokal hesap');
    expect(legacy.source_tag).toContain('TradingView');
  });
});
