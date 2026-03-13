/**
 * Price history file reader and sampler.
 *
 * File format (one entry per line):
 *   epoch,ISO-timestamp,price
 *
 * Example:
 *   1709500000,2024-03-03T20:26:40.000Z,145.23
 */

import { readFile } from "fs/promises";
import { resolve } from "path";

export interface PriceHistoryRow {
  epoch: number;
  price: number;
}

export interface PriceHistoryResult {
  /** Last entry — the current price. */
  current: number;
  currentEpoch: number;
  /** Min price within the requested window. */
  min: number;
  /** Max price within the requested window. */
  max: number;
  /** First (oldest) price in the window, used for trend calculation. */
  firstPriceInWindow: number;
  /** All rows in the window, sorted ascending by epoch. */
  windowRows: PriceHistoryRow[];
}

export async function readPriceHistoryFile(
  filePath: string,
  minutes: number
): Promise<PriceHistoryResult | null> {
  const raw = await readFile(resolve(filePath), "utf-8");
  const rows: PriceHistoryRow[] = [];

  for (const line of raw.split("\n")) {
    const parts = line.trim().split(",");
    if (parts.length < 3) continue;
    if (parts[0].trim() === "epoch") continue; // header

    const epoch = parseInt(parts[0].trim(), 10);
    const price = parseFloat(parts[2].trim());
    if (Number.isFinite(epoch) && Number.isFinite(price)) {
      rows.push({ epoch, price });
    }
  }

  if (rows.length === 0) return null;

  const last = rows[rows.length - 1];
  const current = last.price;
  const currentEpoch = last.epoch;
  const cutoffEpoch = currentEpoch - minutes * 60;

  const windowRows = rows
    .filter((r) => r.epoch > cutoffEpoch && r.epoch < currentEpoch)
    .sort((a, b) => a.epoch - b.epoch);

  if (windowRows.length === 0) {
    return { current, currentEpoch, min: current, max: current, firstPriceInWindow: current, windowRows: [] };
  }

  const prices = windowRows.map((r) => r.price);
  return {
    current,
    currentEpoch,
    min: Math.min(...prices),
    max: Math.max(...prices),
    firstPriceInWindow: windowRows[0].price,
    windowRows,
  };
}

/** Returns a sample interval in minutes appropriate for the window size. */
export function getSampleIntervalMinutes(totalMinutes: number): number {
  if (totalMinutes <= 120) return 5;
  if (totalMinutes <= 720) return 10;
  return 60;
}

/** Pick one price point per sample interval from the window rows. */
export function sampleWindowRows(
  windowRows: PriceHistoryRow[],
  intervalMinutes: number,
  windowStartEpoch: number,
  windowEndEpoch: number
): Array<{ epoch: number; price: number }> {
  if (windowRows.length === 0) return [];

  const intervalSec = intervalMinutes * 60;
  const targets: number[] = [];
  for (let t = windowStartEpoch; t < windowEndEpoch; t += intervalSec) {
    targets.push(t);
  }

  const result: Array<{ epoch: number; price: number }> = [];
  const seen = new Set<number>();

  for (const target of targets) {
    let best = windowRows[0];
    let bestDist = Math.abs(windowRows[0].epoch - target);
    for (let i = 1; i < windowRows.length; i++) {
      const d = Math.abs(windowRows[i].epoch - target);
      if (d < bestDist) { bestDist = d; best = windowRows[i]; }
    }
    if (!seen.has(best.epoch)) {
      seen.add(best.epoch);
      result.push({ epoch: best.epoch, price: best.price });
    }
  }

  return result.sort((a, b) => a.epoch - b.epoch);
}
