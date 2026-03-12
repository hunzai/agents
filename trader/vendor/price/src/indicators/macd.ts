/**
 * MACD (Moving Average Convergence Divergence) calculation.
 * Uses exponential moving averages (EMA).
 * Returns { macd, signal_line, histogram } or null if insufficient data.
 */

export interface MACDResult {
  macd: number;
  signal_line: number;
  histogram: number;
}

function computeEMA(prices: number[], period: number): number[] {
  if (prices.length < period) {
    return [];
  }

  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Simple moving average for first EMA point
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  let currentEMA = sum / period;
  ema.push(currentEMA);

  // EMA for remaining points
  for (let i = period; i < prices.length; i++) {
    currentEMA = prices[i] * multiplier + currentEMA * (1 - multiplier);
    ema.push(currentEMA);
  }

  return ema;
}

export function computeMACD(
  prices: number[],
  fast: number = 12,
  slow: number = 26,
  signal: number = 9
): MACDResult | null {
  // Need at least slow + signal - 1 points to compute signal line
  if (!prices || prices.length < slow + signal - 1) {
    return null;
  }

  const fastEMA = computeEMA(prices, fast);
  const slowEMA = computeEMA(prices, slow);

  if (fastEMA.length === 0 || slowEMA.length === 0) {
    return null;
  }

  // MACD line: 12-day EMA - 26-day EMA
  // Start from where both EMAs exist
  const startIdx = slow - 1;
  const macdLine: number[] = [];
  for (let i = startIdx; i < prices.length; i++) {
    const idx12 = i - (slow - fast);
    const idx26 = i - startIdx;
    if (idx12 >= 0 && idx26 >= 0 && idx12 < fastEMA.length && idx26 < slowEMA.length) {
      macdLine.push(fastEMA[idx12] - slowEMA[idx26]);
    }
  }

  if (macdLine.length < signal) {
    return null;
  }

  // Signal line: 9-day EMA of MACD line
  const signalEMA = computeEMA(macdLine, signal);
  if (signalEMA.length === 0) {
    return null;
  }

  const lastMACD = macdLine[macdLine.length - 1];
  const lastSignal = signalEMA[signalEMA.length - 1];
  const histogram = lastMACD - lastSignal;

  return {
    macd: Number(lastMACD.toFixed(6)),
    signal_line: Number(lastSignal.toFixed(6)),
    histogram: Number(histogram.toFixed(6)),
  };
}
