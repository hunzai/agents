/**
 * Bollinger Bands calculation.
 * Returns { upper, middle, lower, position } where position indicates price relative to bands.
 */

export type BollingerPosition = "above_upper" | "below_lower" | "above_middle" | "below_middle";

export interface BollingerResult {
  upper: number;
  middle: number;
  lower: number;
  position: BollingerPosition;
}

export function computeBollinger(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerResult | null {
  if (!prices || prices.length < period) {
    return null;
  }

  // Get last 'period' prices
  const window = prices.slice(-period);

  // Calculate simple moving average (middle band)
  const sum = window.reduce((a, b) => a + b, 0);
  const middle = sum / period;

  // Calculate standard deviation
  const squaredDiffs = window.map((p) => Math.pow(p - middle, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);

  // Calculate bands
  const upper = middle + stdDev * stdDevMultiplier;
  const lower = middle - stdDev * stdDevMultiplier;

  // Current price is the last price in the array
  const currentPrice = prices[prices.length - 1];

  // Determine position
  let position: BollingerPosition;
  if (currentPrice > upper) {
    position = "above_upper";
  } else if (currentPrice < lower) {
    position = "below_lower";
  } else if (currentPrice > middle) {
    position = "above_middle";
  } else {
    position = "below_middle";
  }

  return {
    upper: Number(upper.toFixed(8)),
    middle: Number(middle.toFixed(8)),
    lower: Number(lower.toFixed(8)),
    position,
  };
}
