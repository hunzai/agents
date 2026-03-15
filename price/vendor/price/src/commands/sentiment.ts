/**
 * Market sentiment command.
 * Sources:
 *   - Fear & Greed Index: https://api.alternative.me/fng/
 *   - CoinGecko global market data (BTC dominance, total market cap)
 */

const FNG_URL = "https://api.alternative.me/fng/?limit=3&format=json";
const GECKO_GLOBAL_URL = "https://api.coingecko.com/api/v3/global";

export interface FearGreedEntry {
  value: number;               // 0–100
  classification: string;      // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  timestamp: string;           // ISO
}

export interface SentimentResult {
  success: boolean;
  timestamp?: string;
  fear_greed?: FearGreedEntry;
  fear_greed_yesterday?: FearGreedEntry;
  fear_greed_last_week?: FearGreedEntry;
  fear_greed_trend?: "improving" | "worsening" | "stable";
  btc_dominance_pct?: number;
  total_market_cap_usd?: number;
  total_volume_24h_usd?: number;
  active_cryptocurrencies?: number;
  market_cap_change_24h_pct?: number;
  sentiment_bias?: "bullish" | "bearish" | "neutral";
  summary?: string;
  error?: string;
}

async function fetchFearGreed(): Promise<FearGreedEntry[] | null> {
  try {
    const res = await fetch(FNG_URL);
    if (!res.ok) throw new Error(`FNG API ${res.status}`);
    const body = (await res.json()) as {
      data: Array<{ value: string; value_classification: string; timestamp: string }>;
    };
    return body.data.map(d => ({
      value: parseInt(d.value, 10),
      classification: d.value_classification,
      timestamp: new Date(parseInt(d.timestamp, 10) * 1000).toISOString(),
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[sentiment] FNG fetch error: ${msg}`);
    return null;
  }
}

async function fetchGeckoGlobal(): Promise<{
  btc_dominance: number;
  total_market_cap: number;
  total_volume: number;
  active_cryptos: number;
  market_cap_change_24h: number;
} | null> {
  try {
    const h: Record<string, string> = { Accept: "application/json" };
    const key = process.env.COINGECKO_API_KEY ?? "";
    if (key) h["x-cg-demo-api-key"] = key;

    const res = await fetch(GECKO_GLOBAL_URL, { headers: h });
    if (!res.ok) throw new Error(`CoinGecko global ${res.status}`);
    const body = (await res.json()) as {
      data: {
        btc_dominance: number;
        total_market_cap: { usd: number };
        total_volume: { usd: number };
        active_cryptocurrencies: number;
        market_cap_change_percentage_24h_usd: number;
      };
    };
    const d = body.data;
    return {
      btc_dominance: d.btc_dominance,
      total_market_cap: d.total_market_cap.usd,
      total_volume: d.total_volume.usd,
      active_cryptos: d.active_cryptocurrencies,
      market_cap_change_24h: d.market_cap_change_percentage_24h_usd,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[sentiment] Gecko global fetch error: ${msg}`);
    return null;
  }
}

export async function sentimentCommand(): Promise<SentimentResult> {
  const timestamp = new Date().toISOString();

  const [fng, global_] = await Promise.all([fetchFearGreed(), fetchGeckoGlobal()]);

  if (!fng && !global_) {
    return { success: false, timestamp, error: "Both FNG and CoinGecko global data unavailable" };
  }

  const result: SentimentResult = { success: true, timestamp };

  if (fng && fng.length > 0) {
    result.fear_greed = fng[0];
    if (fng.length > 1) result.fear_greed_yesterday = fng[1];
    if (fng.length > 2) result.fear_greed_last_week = fng[2];

    if (fng.length >= 2) {
      const delta = fng[0].value - fng[1].value;
      if (delta > 3) result.fear_greed_trend = "improving";
      else if (delta < -3) result.fear_greed_trend = "worsening";
      else result.fear_greed_trend = "stable";
    }
  }

  if (global_) {
    result.btc_dominance_pct = global_.btc_dominance != null ? Number(global_.btc_dominance.toFixed(2)) : undefined;
    result.total_market_cap_usd = global_.total_market_cap ?? undefined;
    result.total_volume_24h_usd = global_.total_volume ?? undefined;
    result.active_cryptocurrencies = global_.active_cryptos ?? undefined;
    result.market_cap_change_24h_pct = global_.market_cap_change_24h != null
      ? Number(global_.market_cap_change_24h.toFixed(3))
      : undefined;
  }

  // Derive a bias
  const fngVal = fng?.[0]?.value ?? 50;
  const mcChange = global_?.market_cap_change_24h ?? 0;

  let bias: "bullish" | "bearish" | "neutral" = "neutral";
  let biasScore = 0;
  if (fngVal <= 20) biasScore -= 2;         // extreme fear → contrarian bullish
  else if (fngVal >= 80) biasScore += 2;    // extreme greed → contrarian bearish
  else if (fngVal <= 40) biasScore -= 1;
  else if (fngVal >= 60) biasScore += 1;

  if (mcChange > 2) biasScore += 1;
  else if (mcChange < -2) biasScore -= 1;

  // Contrarian: extreme fear is actually a buy signal
  if (fngVal <= 20) {
    bias = "bullish"; // contrarian
  } else if (fngVal >= 80) {
    bias = "bearish"; // contrarian sell
  } else {
    bias = biasScore > 0 ? "bullish" : biasScore < 0 ? "bearish" : "neutral";
  }
  result.sentiment_bias = bias;

  // Human-readable summary
  const fngStr = fng ? `Fear & Greed ${fng[0].value}/100 (${fng[0].classification})` : "";
  const trendStr = result.fear_greed_trend ? `, trending ${result.fear_greed_trend}` : "";
  const btcDom = global_?.btc_dominance;
  const btcDomStr = btcDom != null ? `, BTC dominance ${btcDom.toFixed(1)}%` : "";
  const mcStr = (global_ && global_.market_cap_change_24h != null)
    ? `, market cap ${mcChange > 0 ? "+" : ""}${mcChange.toFixed(1)}% 24h`
    : "";
  result.summary = `${fngStr}${trendStr}${btcDomStr}${mcStr}. Sentiment bias: ${bias.toUpperCase()}.`;

  return result;
}
