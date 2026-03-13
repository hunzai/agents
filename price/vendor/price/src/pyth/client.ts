/**
 * Pyth Network client.
 *
 * Hermes (latest price):    https://hermes.pyth.network
 * Benchmarks (historical):  https://benchmarks.pyth.network
 *
 * No API key required. Uses native fetch (Node 18+).
 */

const HERMES_BASE = "https://hermes.pyth.network";
const BENCHMARKS_BASE = "https://benchmarks.pyth.network";

/** SOL/USD Pyth price feed ID. */
export const SOL_USD_FEED_ID =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

/** BTC/USD Pyth price feed ID. */
export const BTC_USD_FEED_ID =
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43";

/** ETH/USD Pyth price feed ID. */
export const ETH_USD_FEED_ID =
  "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";

interface PythPriceFields {
  price: string;
  expo: number;
  publish_time?: number;
}

function parsePythPrice(p: PythPriceFields): number {
  return parseFloat(p.price) * Math.pow(10, p.expo);
}

/**
 * Get the latest price for a Pyth feed from Hermes.
 * Returns the USD price or null on failure.
 */
export async function getLatestPrice(feedId: string = SOL_USD_FEED_ID): Promise<number | null> {
  try {
    const id = feedId.startsWith("0x") ? feedId : `0x${feedId}`;
    const url = `${HERMES_BASE}/v2/updates/price/latest?ids[]=${encodeURIComponent(id)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      parsed?: Array<{ price: PythPriceFields }>;
    };
    const first = data.parsed?.[0]?.price;
    return first ? parsePythPrice(first) : null;
  } catch {
    return null;
  }
}

/**
 * Get historical price updates from Pyth Benchmarks for a time window.
 * Returns an array of prices (one per slot) within the window.
 */
/**
 * Fetch all prices for the last N minutes from Pyth Benchmarks (one window per minute),
 * plus the current price from Hermes. All requests run in parallel.
 */
export async function getPricesForLastMinutes(
  minutes: number,
  feedId: string = SOL_USD_FEED_ID
): Promise<{ current: number | null; historical: number[] }> {
  const now = Math.floor(Date.now() / 1000);
  const currentPromise = getLatestPrice(feedId);
  const historicalPromises: Promise<number[]>[] = [];
  for (let i = 0; i < minutes; i++) {
    const startTs = now - (minutes - i) * 60;
    historicalPromises.push(getHistoricalUpdates(startTs, 60, feedId));
  }
  const [current, ...windowResults] = await Promise.all([currentPromise, ...historicalPromises]);
  return { current, historical: windowResults.flat() };
}

export async function getHistoricalUpdates(
  timestamp: number,
  intervalSeconds: number,
  feedId: string = SOL_USD_FEED_ID
): Promise<number[]> {
  try {
    const id = feedId.startsWith("0x") ? feedId.slice(2) : feedId;
    const interval = Math.min(60, intervalSeconds);
    const url = `${BENCHMARKS_BASE}/v1/updates/price/${timestamp}/${interval}?ids=${id}&parsed=true`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const arr = (await res.json()) as Array<{
      parsed?: Array<{ id: string; price: PythPriceFields }>;
    }>;

    const prices: number[] = [];
    const wantId = id.toLowerCase().replace(/^0x/, "");
    for (const item of arr) {
      for (const p of item.parsed ?? []) {
        if (p.id?.toLowerCase().replace(/^0x/, "") === wantId) {
          prices.push(parsePythPrice(p.price));
          break;
        }
      }
    }
    return prices;
  } catch {
    return [];
  }
}
