/**
 * RSI (Relative Strength Index) calculation.
 * Uses Wilder's smoothed average (standard RSI).
 * Returns 0-100; null if insufficient data (needs > period points).
 */

export function computeRSI(prices: number[], period: number = 14): number | null {
  if (!prices || prices.length <= period) {
    return null;
  }

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Separate gains and losses
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 0; i < period; i++) {
    const change = changes[i];
    if (change > 0) {
      gainSum += change;
    } else {
      lossSum += Math.abs(change);
    }
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  // Wilder's smoothing for the rest of the data
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
  }

  // Calculate RS and RSI
  if (avgLoss === 0) {
    return avgGain === 0 ? 50 : 100;
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return Number(rsi.toFixed(2));
}
