/**
 * analysis command — read a local price history file, compute min/max/trend.
 * No API calls. Works entirely from the stored CSV file.
 */

import {
  readPriceHistoryFile,
  getSampleIntervalMinutes,
  sampleWindowRows,
} from "../priceHistoryFile.js";

const TREND_FLAT_THRESHOLD_PCT = 0.5;

export interface AnalysisParams {
  historyPath: string;
  minutes?: number;
}

export interface SampledPricePoint {
  epoch: number;
  timestamp: string;
  price: number;
}

export type Trend = "bullish" | "bearish" | "flat";

export interface AnalysisResult {
  success: boolean;
  source: "file";
  current: number | null;
  min: number | null;
  max: number | null;
  diff_from_max: number | null;
  diff_from_min: number | null;
  /** (max - current) / max * 100 — positive means price is below the high. */
  pct_dip_from_max: number | null;
  /** (current - min) / min * 100 — positive means price is above the low. */
  pct_high_from_min: number | null;
  trend: Trend | null;
  sample_interval_minutes: number | null;
  sampled_prices: SampledPricePoint[] | null;
  minutes: number;
  historyPath: string;
  error?: string;
}

export async function analysisCommand(params: AnalysisParams): Promise<AnalysisResult> {
  const { historyPath } = params;
  const minutes = Math.max(1, Math.min(43200, params.minutes ?? 60));

  const base: Omit<AnalysisResult, "success" | "error"> = {
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
  };

  const data = await readPriceHistoryFile(historyPath, minutes);
  if (!data) {
    return { ...base, success: false, error: "No valid price entries in file" };
  }

  const { current, currentEpoch, min, max, firstPriceInWindow, windowRows } = data;

  const diff_from_max = Number((current - max).toFixed(8));
  const diff_from_min = Number((current - min).toFixed(8));
  const pct_dip_from_max = max > 0 ? Number((((max - current) / max) * 100).toFixed(4)) : null;
  const pct_high_from_min = min > 0 ? Number((((current - min) / min) * 100).toFixed(4)) : null;

  const pctChange =
    firstPriceInWindow > 0 ? ((current - firstPriceInWindow) / firstPriceInWindow) * 100 : 0;
  const trend: Trend =
    pctChange > TREND_FLAT_THRESHOLD_PCT
      ? "bullish"
      : pctChange < -TREND_FLAT_THRESHOLD_PCT
      ? "bearish"
      : "flat";

  const sampleInterval = getSampleIntervalMinutes(minutes);
  const windowStartEpoch = currentEpoch - minutes * 60;
  const sampled = sampleWindowRows(windowRows, sampleInterval, windowStartEpoch, currentEpoch);
  const sampled_prices: SampledPricePoint[] = sampled.map(({ epoch, price }) => ({
    epoch,
    timestamp: new Date(epoch * 1000).toISOString(),
    price,
  }));

  return {
    success: true,
    source: "file",
    current,
    min,
    max,
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
