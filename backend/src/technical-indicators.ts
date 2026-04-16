/**
 * Technical Indicators Module
 * Fetches OHLCV from isyatirim and computes MACD, Bollinger, VWAP, RSI, etc.
 */

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  ticker: string;
  asOf: string;
  currentPrice: number;
  ma: { ma20: number; ma50: number; ma200: number };
  rsi14: number;
  macd: { line: number; signal: number; histogram: number };
  bollinger: { upper: number; middle: number; lower: number };
  vwap: number;
  support: number;
  resistance: number;
  volumeAvg20: number;
  candlesUsed: number;
}

export async function fetchOhlcv(ticker: string, days: number = 252): Promise<Candle[]> {
  // isyatirim has a public historical data endpoint
  // Try: https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/ChartData.aspx?hisse=<TICKER>&endeks=&tarih=<YYYYMMDD>&periyot=D
  // Alternative: scrape the chart data page
  // For now implement as: try isyatirim endpoint, fall back to Yahoo Finance if fails

  const url = `https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/ChartData.aspx?hisse=${ticker}&endeks=XU100&tarih=&periyot=D`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as any;

    if (!data || !Array.isArray(data.data)) {
      throw new Error('Unexpected response format');
    }

    const candles: Candle[] = data.data.slice(-days).map((row: any) => ({
      date: row.tarih || row.Date || '',
      open: parseFloat(row.acilis || row.Open || row[1]),
      high: parseFloat(row.yuksek || row.High || row[2]),
      low: parseFloat(row.dusuk || row.Low || row[3]),
      close: parseFloat(row.kapanis || row.Close || row[4]),
      volume: parseFloat(row.hacim || row.Volume || row[5] || 0),
    })).filter((c: Candle) => !isNaN(c.close));

    return candles;
  } catch (err) {
    console.warn(`[technical] isyatirim fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    // Fallback: try Yahoo Finance (ticker.IS format)
    return fetchOhlcvYahoo(ticker, days);
  }
}

async function fetchOhlcvYahoo(ticker: string, days: number): Promise<Candle[]> {
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 86400;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.IS?period1=${from}&period2=${now}&interval=1d`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36' },
    });
    if (!response.ok) throw new Error(`Yahoo HTTP ${response.status}`);
    const data = await response.json() as any;

    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No data');

    const timestamps = result.timestamp as number[];
    const quote = result.indicators?.quote?.[0];
    if (!quote) throw new Error('No quote data');

    const candles: Candle[] = timestamps.map((t, i) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      open: quote.open?.[i] ?? 0,
      high: quote.high?.[i] ?? 0,
      low: quote.low?.[i] ?? 0,
      close: quote.close?.[i] ?? 0,
      volume: quote.volume?.[i] ?? 0,
    })).filter((c: Candle) => c.close > 0);

    return candles;
  } catch (err) {
    console.warn(`[technical] Yahoo fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

function sma(values: number[], period: number): number {
  if (values.length < period) return NaN;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function ema(values: number[], period: number): number {
  if (values.length < period) return NaN;
  const k = 2 / (period + 1);
  let emaVal = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    emaVal = values[i] * k + emaVal * (1 - k);
  }
  return emaVal;
}

function stdev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function calcRsi(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return NaN;
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i <= period; i++) {
    const diff = closes[closes.length - i] - closes[closes.length - i - 1];
    if (diff >= 0) gains.push(diff); else losses.push(-diff);
  }
  const avgGain = gains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calcMacd(closes: number[]): { line: number; signal: number; histogram: number } {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12 - ema26;
  // Approximation: signal line as EMA9 of historical MACD
  // For simplicity, use last 9 closes' EMA approximation
  const signal = ema(closes.slice(-9).map((_, i) => {
    const end = closes.length - 8 + i;
    return ema(closes.slice(0, end + 1), 12) - ema(closes.slice(0, end + 1), 26);
  }), 9);
  return {
    line: macdLine,
    signal: isNaN(signal) ? macdLine : signal,
    histogram: macdLine - (isNaN(signal) ? macdLine : signal),
  };
}

function calcBollinger(closes: number[], period: number = 20, mult: number = 2): { upper: number; middle: number; lower: number } {
  if (closes.length < period) return { upper: NaN, middle: NaN, lower: NaN };
  const slice = closes.slice(-period);
  const middle = slice.reduce((a, b) => a + b, 0) / period;
  const sd = stdev(slice);
  return { upper: middle + mult * sd, middle, lower: middle - mult * sd };
}

function calcVwap(candles: Candle[]): number {
  if (candles.length === 0) return NaN;
  let totalPV = 0;
  let totalV = 0;
  for (const c of candles.slice(-30)) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    totalPV += typicalPrice * c.volume;
    totalV += c.volume;
  }
  return totalV > 0 ? totalPV / totalV : NaN;
}

export async function computeIndicators(ticker: string): Promise<TechnicalIndicators | null> {
  const candles = await fetchOhlcv(ticker, 252);
  if (candles.length < 30) {
    console.warn(`[technical] Not enough candles for ${ticker} (${candles.length})`);
    return null;
  }

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);
  const lastCandle = candles[candles.length - 1];

  return {
    ticker,
    asOf: lastCandle.date,
    currentPrice: lastCandle.close,
    ma: {
      ma20: sma(closes, 20),
      ma50: sma(closes, 50),
      ma200: sma(closes, 200),
    },
    rsi14: calcRsi(closes, 14),
    macd: calcMacd(closes),
    bollinger: calcBollinger(closes, 20, 2),
    vwap: calcVwap(candles),
    support: Math.min(...lows.slice(-30)),
    resistance: Math.max(...highs.slice(-30)),
    volumeAvg20: sma(volumes, 20),
    candlesUsed: candles.length,
  };
}
