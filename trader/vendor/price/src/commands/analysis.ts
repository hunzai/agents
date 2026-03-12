/**
 * Price analysis from a price history file (monitor format).
 * No API calls. Reads file: last entry = current; last N minutes = window for min/max.
 * Includes trend (bullish/bearish/flat) and sampled prices over the window.
 */

import {
  readPriceHistoryFile,
  getSampleIntervalMinutes,
  sampleWindowRows,
} from "../priceHistoryFile.js";

const TREND_FLAT_THRESHOLD_PCT = 0.5; // within 0.5% = flat

export interface AnalysisParams {
  /** Path to price history file (epoch,timestamp,price per line). */
  historyPath: string;
  /** Last N minutes to analyze (default 60). */
  minutes?: number;
}

export interface SampledPricePoint {
  epoch: number;
  timestamp: string; // ISO UTC
  price: number;
}

export type Trend = "bullish" | "bearish" | "flat";

export interface AnalysisResult {
  success: boolean;
  source: "file";
  /** Current price (last entry in file). */
  current: number | null;
  /** Min price in the window (last N minutes, excluding last entry). */
  min: number | null;
  /** Max price in the window. */
  max: number | null;
  /** Current minus max (negative = current below max). */
  diff_from_max: number | null;
  /** Current minus min (positive = current above min). */
  diff_from_min: number | null;
  /** Percent dip from max: (max - current) / max * 100 (positive = below high). */
  pct_dip_from_max: number | null;
  /** Percent high from min: (current - min) / min * 100 (positive = above low). */
  pct_high_from_min: number | null;
  /** Trend over the window: current vs first price in window. */
  trend: Trend | null;
  /** Sample interval used for sampled_prices (minutes). */
  sample_interval_minutes: number | null;
  /** Prices sampled every 5, 10, or 60 min depending on window size. */
  sampled_prices: SampledPricePoint[] | null;
  /** Number of minutes analyzed. */
  minutes: number;
  /** Path to the history file. */
  historyPath: string;
  error?: string;
}

export async function analysisCommand(params: AnalysisParams): Promise<AnalysisResult> {
  const historyPath = params.historyPath;
  const minutes = Math.max(1, Math.min(60 * 24 * 30, params.minutes ?? 60));

  const data = await readPriceHistoryFile(historyPath, minutes);
  if (!data) {
    return {
      success: false,
      source: "file",
      current: null,
      min: null,
      max: null,
      diff_from_max: null,
      diff_from_min: null,
      pct_dip_from_max: null,
      pct_high_from_min: null,
      trend: null,
      sample_interval_minutes: null,
      sampled_prices: null,
      minutes,
      historyPath,
      error: "No valid price entries in file",
    };
  }

  const { current, currentEpoch, min: minVal, max: maxVal, firstPriceInWindow, windowRows } = data;

  const diff_from_max = Number((current - maxVal).toFixed(8));
  const diff_from_min = Number((current - minVal).toFixed(8));
  const pct_dip_from_max =
    maxVal > 0 ? Number((((maxVal - current) / maxVal) * 100).toFixed(4)) : null;
  const pct_high_from_min =
    minVal > 0 ? Number((((current - minVal) / minVal) * 100).toFixed(4)) : null;

  const pctChange =
    firstPriceInWindow > 0
      ? ((current - firstPriceInWindow) / firstPriceInWindow) * 100
      : 0;
  let trend: Trend = "flat";
  if (pctChange > TREND_FLAT_THRESHOLD_PCT) trend = "bullish";
  else if (pctChange < -TREND_FLAT_THRESHOLD_PCT) trend = "bearish";

  const sampleInterval = getSampleIntervalMinutes(minutes);
  const windowStartEpoch = currentEpoch - minutes * 60;
  const sampled = sampleWindowRows(
    windowRows,
    sampleInterval,
    windowStartEpoch,
    currentEpoch
  );
  const sampled_prices: SampledPricePoint[] = sampled.map(({ epoch, price }) => ({
    epoch,
    timestamp: new Date(epoch * 1000).toISOString(),
    price,
  }));

  return {
    success: true,
    source: "file",
    current,
    min: minVal,
    max: maxVal,
    diff_from_max,
    diff_from_min,
    pct_dip_from_max,
    pct_high_from_min,
    trend,
    sample_interval_minutes: sampleInterval,
    sampled_prices,
    minutes,
    historyPath,
  };
}
