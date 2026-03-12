/**
 * Volume analysis from CoinGecko historical data.
 * Analyzes current volume against average volume over a window.
 */

export type VolumeSignal = "high" | "low" | "normal";

export interface VolumeResult {
  current_volume: number;
  avg_volume: number;
  ratio: number;
  signal: VolumeSignal;
}

export function analyzeVolume(
  volumes: [number, number][],
  windowHours: number = 24
): VolumeResult | null {
  if (!volumes || volumes.length === 0) {
    return null;
  }

  const now = Date.now();
  const windowMs = windowHours * 60 * 60 * 1000;
  const cutoffTime = now - windowMs;

  // Filter volumes within the window (most recent)
  const recentVolumes = volumes.filter(([timestamp]) => timestamp >= cutoffTime);

  if (recentVolumes.length === 0) {
    return null;
  }

  // Current volume is the most recent one
  const currentVolume = recentVolumes[recentVolumes.length - 1][1];

  // Average volume in the window
  const sum = recentVolumes.reduce((acc, [, vol]) => acc + vol, 0);
  const avgVolume = sum / recentVolumes.length;

  // Volume ratio
  const ratio = avgVolume > 0 ? Number((currentVolume / avgVolume).toFixed(2)) : 1;

  // Signal determination: high if > 1.5x average, low if < 0.5x, normal otherwise
  let signal: VolumeSignal = "normal";
  if (ratio > 1.5) {
    signal = "high";
  } else if (ratio < 0.5) {
    signal = "low";
  }

  return {
    current_volume: Math.round(currentVolume),
    avg_volume: Math.round(avgVolume),
    ratio,
    signal,
  };
}
