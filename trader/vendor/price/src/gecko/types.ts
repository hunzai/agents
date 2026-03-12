/**
 * CoinGecko market_chart response.
 * Each array: [timestamp_ms, value][] — prices (USD), market_caps (USD), total_volumes (24h USD).
 */

export interface GeckoHistoricalData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}
