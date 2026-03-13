/**
 * historical command — fetch OHLCV-style price data from CoinGecko market_chart.
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
  /** [timestamp_ms, price_usd][] */
  prices: [number, number][];
  /** [timestamp_ms, market_cap_usd][] */
  market_caps: [number, number][];
  /** [timestamp_ms, volume_usd_24h][] */
  total_volumes: [number, number][];
  error?: string;
}

export async function historicalCommand(params: HistoricalParams): Promise<HistoricalResult> {
  const coinId = params.coinId ?? "solana";
  const days = Math.max(1, Math.min(365, params.days ?? 1));

  const data = await getMarketChart(coinId, days);
  if (!data) {
    return { success: false, coinId, days, prices: [], market_caps: [], total_volumes: [], error: "Failed to fetch market chart" };
  }

  return { success: true, coinId, days, ...data };
}
