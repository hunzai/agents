/**
 * Stats command — derives price and volume statistics from CoinGecko
 * historical OHLCV data. Equivalent to the ad-hoc python analysis:
 *   24h high/low/open/close, change%, avg volume, volume ratio,
 *   last-N-candles swing high/low, volume trend.
 */

import { getMarketChart } from "../gecko/client.js";

export interface CandleStats {
  count: number;
  swing_high: number;
  swing_low: number;
  avg_volume: number;
  latest_volume: number;
  volume_ratio: number; // latest / avg
}

export interface StatsResult {
  success: boolean;
  coin_id?: string;
  days?: number;
  timestamp?: string;
  // Price
  price_points?: number;
  open?: number;       // oldest price in window
  close?: number;      // latest price in window
  high?: number;
  low?: number;
  change_pct?: number; // (close - open) / open * 100
  // Volume
  volume_points?: number;
  avg_volume?: number;
  latest_volume?: number;
  volume_ratio?: number; // latest vs avg — >1 = above average activity
  // Last-N candles (default: 24)
  last_candles?: CandleStats;
  error?: string;
}

function roundTo(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

export async function statsCommand(params: {
  coinId?: string;
  days?: number;
  lastCandles?: number;
}): Promise<StatsResult> {
  const coinId = params.coinId ?? "solana";
  const days = params.days ?? 1;
  const lastN = params.lastCandles ?? 24;
  const timestamp = new Date().toISOString();

  try {
    const data = await getMarketChart(coinId, days);

    if (!data || data.prices.length < 2) {
      return { success: false, coin_id: coinId, days, timestamp, error: "Insufficient data from CoinGecko" };
    }

    const prices  = data.prices.map(([, p]) => p);
    const volumes = data.total_volumes.map(([, v]) => v);

    // Full-window stats
    const open   = prices[0];
    const close  = prices[prices.length - 1];
    const high   = Math.max(...prices);
    const low    = Math.min(...prices);
    const changePct = ((close - open) / open) * 100;

    const avgVol    = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const latestVol = volumes[volumes.length - 1];
    const volRatio  = latestVol / avgVol;

    // Last-N candles
    const recentPrices  = prices.slice(-lastN);
    const recentVolumes = volumes.slice(-lastN);
    const recentAvgVol  = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
    const recentLatest  = recentVolumes[recentVolumes.length - 1];

    const lastCandles: CandleStats = {
      count:          recentPrices.length,
      swing_high:     roundTo(Math.max(...recentPrices), 4),
      swing_low:      roundTo(Math.min(...recentPrices), 4),
      avg_volume:     roundTo(recentAvgVol, 0),
      latest_volume:  roundTo(recentLatest, 0),
      volume_ratio:   roundTo(recentLatest / recentAvgVol, 2),
    };

    return {
      success:       true,
      coin_id:       coinId,
      days,
      timestamp,
      price_points:  prices.length,
      open:          roundTo(open, 4),
      close:         roundTo(close, 4),
      high:          roundTo(high, 4),
      low:           roundTo(low, 4),
      change_pct:    roundTo(changePct, 2),
      volume_points: volumes.length,
      avg_volume:    roundTo(avgVol, 0),
      latest_volume: roundTo(latestVol, 0),
      volume_ratio:  roundTo(volRatio, 2),
      last_candles:  lastCandles,
    };
  } catch (err: any) {
    return { success: false, coin_id: coinId, days, timestamp, error: `Stats failed: ${err.message}` };
  }
}
