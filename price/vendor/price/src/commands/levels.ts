/**
 * Key price levels: pivot points + local highs/lows + EMA levels.
 * Uses CoinGecko 24hr hourly data to derive H/L/C for pivot math.
 */

import { getMarketChart } from "../gecko/client.js";
import { getPricesForLastMinutes, SOL_USD_FEED_ID, ETH_USD_FEED_ID, BTC_USD_FEED_ID } from "../pyth/client.js";
import { computeEMA } from "../indicators/ema.js";

function getFeedId(symbol: string): string {
  switch (symbol.toLowerCase()) {
    case "btc": return BTC_USD_FEED_ID;
    case "eth": return ETH_USD_FEED_ID;
    default:    return SOL_USD_FEED_ID;
  }
}
function getGeckoId(symbol: string): string {
  switch (symbol.toLowerCase()) {
    case "btc": return "bitcoin";
    case "eth": return "ethereum";
    default:    return "solana";
  }
}

export interface PriceLevel {
  price: number;
  label: string;
  type: "resistance" | "support" | "pivot" | "ema";
  distance_pct: number; // positive = above current, negative = below
}

export interface LevelsResult {
  success: boolean;
  symbol?: string;
  current_price?: number;
  timestamp?: string;
  h24_high?: number;
  h24_low?: number;
  h24_close?: number;
  pivot?: number;
  r1?: number;
  r2?: number;
  r3?: number;
  s1?: number;
  s2?: number;
  s3?: number;
  ema20?: number;
  ema50?: number;
  local_highs?: number[];   // recent swing highs (last 24hr)
  local_lows?: number[];    // recent swing lows (last 24hr)
  position?: "near_resistance" | "near_support" | "midrange";
  nearest_resistance?: number;
  nearest_support?: number;
  levels?: PriceLevel[];    // sorted by price
  error?: string;
}

/**
 * Detect swing highs: price[i] is a local high if higher than both neighbors.
 * lookback defines how many bars on each side must be lower.
 */
function findSwingHighs(prices: number[], lookback: number = 2): number[] {
  const highs: number[] = [];
  for (let i = lookback; i < prices.length - lookback; i++) {
    let isHigh = true;
    for (let j = 1; j <= lookback; j++) {
      if (prices[i] <= prices[i - j] || prices[i] <= prices[i + j]) {
        isHigh = false;
        break;
      }
    }
    if (isHigh) highs.push(Number(prices[i].toFixed(4)));
  }
  return highs;
}

/**
 * Detect swing lows: price[i] is a local low if lower than both neighbors.
 */
function findSwingLows(prices: number[], lookback: number = 2): number[] {
  const lows: number[] = [];
  for (let i = lookback; i < prices.length - lookback; i++) {
    let isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (prices[i] >= prices[i - j] || prices[i] >= prices[i + j]) {
        isLow = false;
        break;
      }
    }
    if (isLow) lows.push(Number(prices[i].toFixed(4)));
  }
  return lows;
}

export async function levelsCommand(params: {
  symbol?: string;
}): Promise<LevelsResult> {
  const symbol = (params.symbol ?? "sol").toLowerCase();
  const geckoId = getGeckoId(symbol);
  const feedId = getFeedId(symbol);
  const displaySymbol = symbol.toUpperCase();
  const timestamp = new Date().toISOString();

  try {
    // Fetch 24hr data from CoinGecko + current price from Pyth in parallel
    const [chartData, priceData] = await Promise.all([
      getMarketChart(geckoId, 1),
      getPricesForLastMinutes(60, feedId).catch(() => null),
    ]);

    if (!chartData || chartData.prices.length < 5) {
      return { success: false, symbol: displaySymbol, timestamp, error: "Insufficient CoinGecko data" };
    }

    const priceSeries = chartData.prices.map(([, p]) => p);
    const currentPrice = priceData?.current ?? priceSeries[priceSeries.length - 1];

    const h24High = Math.max(...priceSeries);
    const h24Low  = Math.min(...priceSeries);
    const h24Close = currentPrice;

    // Standard pivot point formula
    const pivot = (h24High + h24Low + h24Close) / 3;
    const r1 = 2 * pivot - h24Low;
    const r2 = pivot + (h24High - h24Low);
    const r3 = h24High + 2 * (pivot - h24Low);
    const s1 = 2 * pivot - h24High;
    const s2 = pivot - (h24High - h24Low);
    const s3 = h24Low - 2 * (h24High - pivot);

    // EMA levels from recent 60-min Pyth data (or fall back to gecko series)
    const allPrices = priceData?.historical.length
      ? [...priceData.historical, currentPrice]
      : priceSeries;

    const ema20Series = computeEMA(allPrices, 20);
    const ema50Series = computeEMA(allPrices, 50);
    const ema20 = ema20Series.length ? ema20Series[ema20Series.length - 1] : null;
    const ema50 = ema50Series.length ? ema50Series[ema50Series.length - 1] : null;

    // Swing highs/lows from 24hr hourly series
    const localHighs = findSwingHighs(priceSeries, 2).slice(-5); // last 5 recent
    const localLows  = findSwingLows(priceSeries, 2).slice(-5);

    // Build sorted levels list
    const dist = (p: number) => Number((((p - currentPrice) / currentPrice) * 100).toFixed(3));

    const levels: PriceLevel[] = [
      { price: Number(r3.toFixed(4)), label: "R3", type: "resistance", distance_pct: dist(r3) },
      { price: Number(r2.toFixed(4)), label: "R2", type: "resistance", distance_pct: dist(r2) },
      { price: Number(r1.toFixed(4)), label: "R1", type: "resistance", distance_pct: dist(r1) },
      { price: Number(pivot.toFixed(4)), label: "Pivot", type: "pivot", distance_pct: dist(pivot) },
      { price: Number(s1.toFixed(4)), label: "S1", type: "support", distance_pct: dist(s1) },
      { price: Number(s2.toFixed(4)), label: "S2", type: "support", distance_pct: dist(s2) },
      { price: Number(s3.toFixed(4)), label: "S3", type: "support", distance_pct: dist(s3) },
    ];

    if (ema20 !== null) {
      levels.push({ price: Number(ema20.toFixed(4)), label: "EMA20", type: "ema", distance_pct: dist(ema20) });
    }
    if (ema50 !== null) {
      levels.push({ price: Number(ema50.toFixed(4)), label: "EMA50", type: "ema", distance_pct: dist(ema50) });
    }

    // Add local swing highs/lows
    for (const lh of localHighs) {
      levels.push({ price: lh, label: "SwingHigh", type: "resistance", distance_pct: dist(lh) });
    }
    for (const ll of localLows) {
      levels.push({ price: ll, label: "SwingLow", type: "support", distance_pct: dist(ll) });
    }

    levels.sort((a, b) => b.price - a.price);

    // Nearest resistance (first level above current)
    const nearestResistance = levels.find(l => l.price > currentPrice && l.type !== "pivot")?.price;
    const nearestSupport    = [...levels].reverse().find(l => l.price < currentPrice && l.type !== "pivot")?.price;

    // Position assessment
    let position: "near_resistance" | "near_support" | "midrange" = "midrange";
    if (nearestResistance && Math.abs(dist(nearestResistance)) < 1.0) position = "near_resistance";
    else if (nearestSupport && Math.abs(dist(nearestSupport)) < 1.0)  position = "near_support";

    return {
      success: true,
      symbol: displaySymbol,
      current_price: Number(currentPrice.toFixed(4)),
      timestamp,
      h24_high: Number(h24High.toFixed(4)),
      h24_low:  Number(h24Low.toFixed(4)),
      h24_close: Number(h24Close.toFixed(4)),
      pivot:  Number(pivot.toFixed(4)),
      r1: Number(r1.toFixed(4)),
      r2: Number(r2.toFixed(4)),
      r3: Number(r3.toFixed(4)),
      s1: Number(s1.toFixed(4)),
      s2: Number(s2.toFixed(4)),
      s3: Number(s3.toFixed(4)),
      ema20: ema20 ? Number(ema20.toFixed(4)) : undefined,
      ema50: ema50 ? Number(ema50.toFixed(4)) : undefined,
      local_highs: localHighs,
      local_lows: localLows,
      position,
      nearest_resistance: nearestResistance ? Number(nearestResistance.toFixed(4)) : undefined,
      nearest_support:    nearestSupport    ? Number(nearestSupport.toFixed(4))    : undefined,
      levels,
    };
  } catch (error: any) {
    return { success: false, symbol: displaySymbol, timestamp, error: `Levels computation failed: ${error.message}` };
  }
}
