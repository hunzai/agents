/**
 * Coin historical data via CoinGecko market_chart (coin id, e.g. bitcoin, solana).
 */

import { getMarketChart } from "../gecko/client.js";

export interface HistoricalParams {
  coinId?: string;
  days?: number;
}

export interface HistoricalResult {
  success: boolean;
  coinId: string;
  days: number;
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
  error?: string;
}

export async function historicalCommand(
  params: HistoricalParams
): Promise<HistoricalResult> {
  const coinId = params.coinId ?? "solana";
  const days = params.days ?? 1;
  const d = Math.max(1, Math.min(365, days));
  const data = await getMarketChart(coinId, d);
  if (!data) {
    return {
      success: false,
      coinId,
      days: d,
      prices: [],
      market_caps: [],
      total_volumes: [],
      error: "Failed to fetch market_chart",
    };
  }
  return {
    success: true,
    coinId,
    days: d,
    prices: data.prices,
    market_caps: data.market_caps,
    total_volumes: data.total_volumes,
  };
}
