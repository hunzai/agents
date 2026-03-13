/**
 * CoinGecko API client.
 *
 * market_chart: GET /coins/{id}/market_chart — historical prices, market caps, volumes.
 * simple/price: GET /simple/price           — current spot price for one or more coins.
 *
 * Set COINGECKO_API_KEY (demo key) to raise rate limits.
 */

import type { GeckoHistoricalData } from "./types.js";

const BASE = "https://api.coingecko.com/api/v3";

function headers(): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json" };
  const key = process.env.COINGECKO_API_KEY ?? "";
  if (key) h["x-cg-demo-api-key"] = key;
  return h;
}

export interface MarketChartParams {
  vs_currency?: string;
  days?: number;
  interval?: "daily";
  precision?: "full" | `${number}`;
}

/**
 * Fetch historical OHLCV-style data for a coin.
 * Returns [timestamp_ms, value][] arrays for prices, market_caps, and total_volumes.
 */
export async function getMarketChart(
  coinId: string,
  days: number = 1,
  options: MarketChartParams = {}
): Promise<GeckoHistoricalData | null> {
  try {
    const vs = options.vs_currency ?? "usd";
    const url = new URL(`${BASE}/coins/${encodeURIComponent(coinId)}/market_chart`);
    url.searchParams.set("vs_currency", vs);
    url.searchParams.set("days", String(Math.max(1, Math.min(365, days))));
    if (options.interval) url.searchParams.set("interval", options.interval);
    if (options.precision) url.searchParams.set("precision", options.precision);

    const res = await fetch(url.toString(), { headers: headers() });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`CoinGecko ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as GeckoHistoricalData;
    return {
      prices: data.prices ?? [],
      market_caps: data.market_caps ?? [],
      total_volumes: data.total_volumes ?? [],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[gecko] market_chart error for ${coinId}: ${msg}`);
    return null;
  }
}

/**
 * Fetch the current spot price for a coin from CoinGecko /simple/price.
 * Returns price in USD, or null on failure.
 */
export async function getSimplePrice(coinId: string): Promise<number | null> {
  try {
    const url = new URL(`${BASE}/simple/price`);
    url.searchParams.set("ids", coinId);
    url.searchParams.set("vs_currencies", "usd");

    const res = await fetch(url.toString(), { headers: headers() });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`CoinGecko ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as Record<string, { usd?: number }>;
    return data[coinId]?.usd ?? null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[gecko] simple/price error for ${coinId}: ${msg}`);
    return null;
  }
}
