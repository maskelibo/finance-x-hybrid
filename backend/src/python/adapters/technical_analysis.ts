/**
 * Technical analysis adapter — Python TechnicalIndicators → legacy
 * agent JSON that downstream LLM agents and report_formatter expect.
 *
 * No input adapter needed: Python runner fetches its own OHLCV
 * directly from TradingView; the LLM agent's upstream price_data
 * is bypassed entirely.
 */

export interface PythonTechnicalIndicators {
  as_of_date?: string | null;
  ma_20?: string | null;
  ma_50?: string | null;
  ma_200?: string | null;
  rsi_14?: string | null;
  macd?: string | null;
  macd_signal?: string | null;
  macd_histogram?: string | null;
  bollinger_upper?: string | null;
  bollinger_middle?: string | null;
  bollinger_lower?: string | null;
  atr_14?: string | null;
  trend?: string | null;
  relative_to_bist100_ytd?: string | null;
}

export interface LegacyTechnicalOutput {
  agent_id: string;
  output_id: string;
  ticker: string;
  as_of_date: string | null;
  moving_averages: {
    ma_20: string | null;
    ma_50: string | null;
    ma_200: string | null;
  };
  momentum: {
    rsi_14: string | null;
    macd: string | null;
    macd_signal: string | null;
    macd_histogram: string | null;
  };
  volatility: {
    bollinger_upper: string | null;
    bollinger_middle: string | null;
    bollinger_lower: string | null;
    atr_14: string | null;
  };
  trend: string | null;
  relative_to_bist100_ytd: string | null;
  confidence: 'low' | 'medium';
  source_tag: string;
  warnings: string[];
  review_status: string;
}


export function adaptPythonTechnicalForLegacy(
  py: PythonTechnicalIndicators,
  ticker: string,
  outputId: string,
): LegacyTechnicalOutput {
  const hasFullIndicators = py.ma_200 !== null && py.ma_200 !== undefined;

  return {
    agent_id: 'technical_analysis',
    output_id: outputId,
    ticker: ticker.toUpperCase(),
    as_of_date: py.as_of_date ?? null,
    moving_averages: {
      ma_20: py.ma_20 ?? null,
      ma_50: py.ma_50 ?? null,
      ma_200: py.ma_200 ?? null,
    },
    momentum: {
      rsi_14: py.rsi_14 ?? null,
      macd: py.macd ?? null,
      macd_signal: py.macd_signal ?? null,
      macd_histogram: py.macd_histogram ?? null,
    },
    volatility: {
      bollinger_upper: py.bollinger_upper ?? null,
      bollinger_middle: py.bollinger_middle ?? null,
      bollinger_lower: py.bollinger_lower ?? null,
      atr_14: py.atr_14 ?? null,
    },
    trend: py.trend ?? null,
    relative_to_bist100_ytd: py.relative_to_bist100_ytd ?? null,
    confidence: 'medium',  // technical is capped at medium by agent policy
    source_tag: '[src: lokal hesap, OHLCV: TradingView]',
    warnings: hasFullIndicators ? [] : ['MA200 unavailable — <200 daily bars in history'],
    review_status: 'pending_ceo_review',
  };
}
