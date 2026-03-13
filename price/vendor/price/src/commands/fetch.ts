/**
 * fetch command — get the current price from Pyth Network (or CoinGecko as fallback)
 * and append one line to a local price history file.
 *
 * Output format (matches what analysis command expects):
 *   epoch,ISO-timestamp,price
 *
 * Example output file line:
 *   1709500000,2024-03-03T20:26:40.000Z,145.231847
 */

import { appendFile, mkdir } from "fs/promises";
import { dirname, resolve } from "path";
import { getLatestPrice, SOL_USD_FEED_ID } from "../pyth/client.js";
import { getSimplePrice } from "../gecko/client.js";

export type PriceSource = "pyth" | "gecko";

export interface FetchParams {
  /** Local file path to append the price entry to. */
  outputPath: string;
  /** Pyth feed ID (default: SOL/USD). Only used when source is "pyth". */
  feedId?: string;
  /** CoinGecko coin ID (default: "solana"). Only used when source is "gecko". */
  coinId?: string;
  /** Price source: "pyth" (default) or "gecko". Falls back to the other on failure. */
  source?: PriceSource;
}

export interface FetchResult {
  success: boolean;
  price?: number;
  epoch?: number;
  timestamp?: string;
  source?: PriceSource;
  outputPath?: string;
  line?: string;
  error?: string;
}

export async function fetchCommand(params: FetchParams): Promise<FetchResult> {
  const outputPath = resolve(params.outputPath);
  const preferredSource: PriceSource = params.source ?? "pyth";
  const feedId = params.feedId ?? SOL_USD_FEED_ID;
  const coinId = params.coinId ?? "solana";

  let price: number | null = null;
  let usedSource: PriceSource = preferredSource;

  if (preferredSource === "pyth") {
    price = await getLatestPrice(feedId);
    if (price === null) {
      console.error("[price] Pyth fetch failed, falling back to CoinGecko...");
      price = await getSimplePrice(coinId);
      usedSource = "gecko";
    }
  } else {
    price = await getSimplePrice(coinId);
    if (price === null) {
      console.error("[price] CoinGecko fetch failed, falling back to Pyth...");
      price = await getLatestPrice(feedId);
      usedSource = "pyth";
    }
  }

  if (price === null) {
    return { success: false, error: "Failed to fetch price from both Pyth and CoinGecko" };
  }

  const epoch = Math.floor(Date.now() / 1000);
  const timestamp = new Date().toISOString();
  const line = `${epoch},${timestamp},${price}`;

  await mkdir(dirname(outputPath), { recursive: true });
  await appendFile(outputPath, line + "\n", "utf-8");

  console.error(`[price] Appended to ${outputPath}: ${line}`);

  return { success: true, price, epoch, timestamp, source: usedSource, outputPath, line };
}
