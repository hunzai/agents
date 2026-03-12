/**
 * Read price history file (monitor format: epoch,timestamp,price per line, optional header).
 * Returns last entry as current, min/max and first price in window, and window rows for sampling.
 */

import { readFile } from "fs/promises";
import { resolve } from "path";

export interface PriceHistoryRow {
  epoch: number;
  price: number;
}

export interface PriceHistoryResult {
  current: number;
  currentEpoch: number;
  min: number;
  max: number;
  /** First (oldest) price in the window, for trend. */
  firstPriceInWindow: number;
  /** Window rows sorted by epoch ascending (excluding last entry). */
  windowRows: PriceHistoryRow[];
}

export async function readPriceHistoryFile(
  filePath: string,
  minutes: number
): Promise<PriceHistoryResult | null> {
  const resolved = resolve(filePath);
  const raw = await readFile(resolved, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  const rows: PriceHistoryRow[] = [];
  for (const line of lines) {
    const parts = line.split(",");
    if (parts.length < 3) continue;
    const epoch = parseInt(parts[0].trim(), 10);
    const price = parseFloat(parts[2].trim());
    if (!Number.isFinite(epoch) || !Number.isFinite(price)) continue;
    if (parts[0].trim() === "epoch") continue;
    rows.push({ epoch, price });
  }
  if (rows.length === 0) return null;
  const last = rows[rows.length - 1];
  const current = last.price;
  const currentEpoch = last.epoch;
  const cutoffEpoch = currentEpoch - minutes * 60;
  const windowRows = rows
    .filter((r) => r.epoch > cutoffEpoch && r.epoch < currentEpoch)
    .sort((a, b) => a.epoch - b.epoch);
  const firstPriceInWindow = windowRows.length > 0 ? windowRows[0].price : current;
  if (windowRows.length === 0) {
    return {
      current,
      currentEpoch,
      min: current,
      max: current,
      firstPriceInWindow: current,
      windowRows: [],
    };
  }
  const min = Math.min(...windowRows.map((r) => r.price));
  const max = Math.max(...windowRows.map((r) => r.price));
  return {
    current,
    currentEpoch,
    min,
    max,
    firstPriceInWindow,
    windowRows,
  };
}

/** Sample interval in minutes: 5 for small windows, 10 for medium, 60 for large. */
export function getSampleIntervalMinutes(totalMinutes: number): number {
  if (totalMinutes <= 120) return 5;
  if (totalMinutes <= 720) return 10;
  return 60;
}

/** Pick sampled points from window rows: for each target timestamp (every intervalMinutes), take the row with epoch closest to that target. */
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
      if (d < bestDist) {
        bestDist = d;
        best = windowRows[i];
      }
    }
    if (!seen.has(best.epoch)) {
      seen.add(best.epoch);
      result.push({ epoch: best.epoch, price: best.price });
    }
  }
  return result.sort((a, b) => a.epoch - b.epoch);
}
