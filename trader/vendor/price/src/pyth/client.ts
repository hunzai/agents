/**
 * Pyth Network client: Hermes (latest) + Benchmarks (historical).
 * No CoinGecko. Used for price analysis (min/max/current).
 */

const HERMES_BASE = "https://hermes.pyth.network";
const BENCHMARKS_BASE = "https://benchmarks.pyth.network";

/** SOL/USD price feed id (Pyth hex). */
export const SOL_USD_FEED_ID = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

interface PythPriceFields {
  price: string;
  expo: number;
  publish_time?: number;
}

function parsePythPrice(price: PythPriceFields): number {
  const p = parseFloat(price.price);
  const e = price.expo;
  return p * Math.pow(10, e);
}

/**
 * Fetch latest price from Hermes.
 */
export async function getLatestPrice(feedId: string = SOL_USD_FEED_ID): Promise<number | null> {
  try {
    const id = feedId.startsWith("0x") ? feedId : `0x${feedId}`;
    const url = `${HERMES_BASE}/v2/updates/price/latest?ids[]=${encodeURIComponent(id)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { parsed?: Array<{ price: PythPriceFields }> };
    const first = data.parsed?.[0]?.price;
    if (!first) return null;
    return parsePythPrice(first);
  } catch {
    return null;
  }
}

/**
 * Fetch historical price updates for one time window (max 60s) from Benchmarks.
 * Returns array of human-readable prices for the given feed in that window.
 */
export async function getHistoricalUpdates(
  timestamp: number,
  intervalSeconds: number,
  feedId: string = SOL_USD_FEED_ID
): Promise<number[]> {
  try {
    const id = feedId.startsWith("0x") ? feedId.slice(2) : feedId;
    const url = `${BENCHMARKS_BASE}/v1/updates/price/${timestamp}/${Math.min(60, intervalSeconds)}?ids=${id}&parsed=true`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const arr = (await res.json()) as Array<{ parsed?: Array<{ id: string; price: PythPriceFields }> }>;
    const prices: number[] = [];
    const wantId = id.toLowerCase();
    for (const item of arr) {
      for (const p of item.parsed ?? []) {
        if (p.id?.toLowerCase().replace(/^0x/, "") === wantId.replace(/^0x/, "")) {
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

/**
 * Get all prices for the last n minutes (Pyth Benchmarks, one window per minute).
 * Includes latest from Hermes as "current"; historical windows are past minutes.
 * Fetches current and all historical windows in parallel for speed.
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
  const historical = windowResults.flat();

  return { current, historical };
}
