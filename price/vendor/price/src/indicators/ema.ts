/**
 * Exponential Moving Average (EMA) calculation.
 * Exported for reuse in MACD, crossover signals, etc.
 */

/**
 * Compute EMA series over a price array.
 * Returns empty array if prices.length < period.
 */
export function computeEMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];

  const multiplier = 2 / (period + 1);
  const ema: number[] = [];

  // Seed with SMA of first `period` prices
  let current = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema.push(current);

  for (let i = period; i < prices.length; i++) {
    current = prices[i] * multiplier + current * (1 - multiplier);
    ema.push(current);
  }

  return ema;
}

export interface EMACrossoverResult {
  fast_ema: number;
  slow_ema: number;
  signal: "bullish" | "bearish" | "neutral";
  gap_pct: number; // (fast - slow) / slow * 100
}

/**
 * EMA crossover signal: compares fast vs slow EMA on latest price.
 * Typically: fast=20, slow=50.
 */
export function computeEMACrossover(
  prices: number[],
  fast: number = 20,
  slow: number = 50
): EMACrossoverResult | null {
  if (prices.length < slow) return null;

  const fastEMA = computeEMA(prices, fast);
  const slowEMA = computeEMA(prices, slow);

  if (fastEMA.length === 0 || slowEMA.length === 0) return null;

  const lastFast = fastEMA[fastEMA.length - 1];
  const lastSlow = slowEMA[slowEMA.length - 1];
  const gapPct = ((lastFast - lastSlow) / lastSlow) * 100;

  let signal: "bullish" | "bearish" | "neutral" = "neutral";
  if (gapPct > 0.1) signal = "bullish";    // fast above slow → uptrend
  else if (gapPct < -0.1) signal = "bearish"; // fast below slow → downtrend

  return {
    fast_ema: Number(lastFast.toFixed(6)),
    slow_ema: Number(lastSlow.toFixed(6)),
    signal,
    gap_pct: Number(gapPct.toFixed(4)),
  };
}
