/**
 * CoinGecko API client — market_chart only.
 * GET /coins/{id}/market_chart?vs_currency=usd&days=N&interval=&precision=
 * Header: x-cg-demo-api-key when COINGECKO_API_KEY is set.
 */

import type { GeckoHistoricalData } from "./types.js";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

/** Query params for market_chart: vs_currency (default usd), days (default 1), optional interval (daily), precision (full|0..18). */
export interface MarketChartParams {
  vs_currency?: string;
  days?: number;
  interval?: "daily";
  precision?: "full" | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18";
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const key = process.env.COINGECKO_API_KEY ?? "";
  if (key) headers["x-cg-demo-api-key"] = key;
  return headers;
}

/**
 * Get historical data for a coin by id (e.g. solana, bitcoin).
 * Defaults: vs_currency=usd, days=1. Optional: interval (daily), precision.
 * Response: prices, market_caps, total_volumes — each [timestamp_ms, value][].
 */
export async function getMarketChart(
  coinId: string,
  days: number = 1,
  options: MarketChartParams = {}
): Promise<GeckoHistoricalData | null> {
  try {
    const vs_currency = options.vs_currency ?? "usd";
    const interval = options.interval;
    const precision = options.precision;

    const url = new URL(`${COINGECKO_BASE}/coins/${encodeURIComponent(coinId)}/market_chart`);
    url.searchParams.set("vs_currency", vs_currency);
    url.searchParams.set("days", String(days));
    if (interval != null) url.searchParams.set("interval", interval);
    if (precision != null) url.searchParams.set("precision", precision);

    const res = await fetch(url.toString(), { headers: getHeaders() });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`CoinGecko ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    return {
      prices: data.prices ?? [],
      market_caps: data.market_caps ?? [],
      total_volumes: data.total_volumes ?? [],
    };
  } catch (error: any) {
    console.error(`Error fetching market_chart for ${coinId}: ${error.message}`);
    return null;
  }
}
