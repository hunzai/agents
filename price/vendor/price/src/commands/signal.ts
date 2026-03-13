/**
 * Signal detection for price prediction.
 * Orchestrates RSI, MACD, Bollinger Bands, and Volume analysis.
 * Returns weighted composite prediction: bullish | bearish | neutral.
 */

import { getPricesForLastMinutes, SOL_USD_FEED_ID, ETH_USD_FEED_ID, BTC_USD_FEED_ID } from "../pyth/client.js";
import { getMarketChart } from "../gecko/client.js";
import { computeRSI } from "../indicators/rsi.js";
import { computeMACD, type MACDResult } from "../indicators/macd.js";
import { computeBollinger, type BollingerResult } from "../indicators/bollinger.js";
import { analyzeVolume, type VolumeResult } from "../indicators/volume.js";

type Prediction = "bullish" | "bearish" | "neutral";

interface RSISignal {
  value: number;
  signal: string;
  weight: number;
}

interface MACDSignal {
  macd: number;
  signal_line: number;
  histogram: number;
  signal: string;
  weight: number;
}

interface BollingerSignal {
  upper: number;
  middle: number;
  lower: number;
  position: string;
  signal: string;
  weight: number;
}

interface VolumeSignalObject {
  current_volume: number;
  avg_volume: number;
  ratio: number;
  signal: string;
  weight: number;
}

interface SignalGroup {
  rsi?: RSISignal;
  macd?: MACDSignal;
  bollinger?: BollingerSignal;
  volume?: VolumeSignalObject;
}

export interface SignalResult {
  success: boolean;
  symbol?: string;
  current_price?: number;
  timestamp?: string;
  prediction?: Prediction;
  confidence?: number;
  signals?: SignalGroup;
  data_points?: number;
  minutes?: number;
  error?: string;
}

function getFeedIdForSymbol(symbol: string): string {
  switch (symbol.toLowerCase()) {
    case "eth":
      return ETH_USD_FEED_ID;
    case "btc":
      return BTC_USD_FEED_ID;
    case "sol":
    default:
      return SOL_USD_FEED_ID;
  }
}

function getGeckoIdForSymbol(symbol: string): string {
  switch (symbol.toLowerCase()) {
    case "eth":
      return "ethereum";
    case "btc":
      return "bitcoin";
    case "sol":
    default:
      return "solana";
  }
}

function formatSymbol(symbol: string): string {
  return symbol.toUpperCase();
}

async function getVolumeData(
  geckoId: string,
  minutes: number
): Promise<[number, number][] | null> {
  // CoinGecko returns data in days; convert minutes to days
  const days = Math.max(1, Math.ceil(minutes / 1440));

  const data = await getMarketChart(geckoId, days);
  if (!data || !data.total_volumes) {
    return null;
  }

  return data.total_volumes;
}

export async function signalCommand(params: {
  symbol?: string;
  minutes?: number;
}): Promise<SignalResult> {
  const symbol = params.symbol ?? "sol";
  const minutes = params.minutes ?? 120;

  // Validate minutes
  if (!Number.isFinite(minutes) || minutes < 35 || minutes > 1440) {
    return {
      success: false,
      error: "minutes must be 35–1440 (MACD needs ≥35, max 1 day)",
    };
  }

  const feedId = getFeedIdForSymbol(symbol);
  const geckoId = getGeckoIdForSymbol(symbol);
  const displaySymbol = formatSymbol(symbol);
  const timestamp = new Date().toISOString();

  try {
    // Fetch Pyth prices and CoinGecko volumes in parallel
    const [priceData, volumeData] = await Promise.all([
      getPricesForLastMinutes(minutes, feedId),
      getVolumeData(geckoId, minutes).catch(() => null),
    ]);

    const currentPrice = priceData.current;
    const historicalPrices = priceData.historical;

    if (!currentPrice || historicalPrices.length === 0) {
      return {
        success: false,
        symbol: displaySymbol,
        timestamp,
        error: "Insufficient price data from Pyth Network",
      };
    }

    // All prices including current (for indicators)
    const allPrices = [...historicalPrices, currentPrice];

    // Compute indicators
    const rsiValue = computeRSI(allPrices);
    const macdValue = computeMACD(allPrices);
    const bollingerValue = computeBollinger(allPrices);
    const volumeValue = volumeData ? analyzeVolume(volumeData) : null;

    // Build signals with weights
    const signals: SignalGroup = {};
    const weights: Record<string, number> = {
      rsi: 0.25,
      macd: 0.3,
      bollinger: 0.25,
      volume: 0.2,
    };

    let rsiSignal: number | null = null;
    if (rsiValue !== null) {
      if (rsiValue < 30) rsiSignal = 1; // oversold → bullish
      else if (rsiValue > 70) rsiSignal = -1; // overbought → bearish
      else rsiSignal = 0;

      signals.rsi = {
        value: rsiValue,
        signal: rsiValue < 30 ? "oversold" : rsiValue > 70 ? "overbought" : "neutral",
        weight: weights.rsi,
      };
    }

    let macdSignal: number | null = null;
    if (macdValue !== null) {
      const { histogram } = macdValue;
      if (histogram > 0 && histogram > (macdValue.macd - macdValue.signal_line)) {
        macdSignal = 1; // bullish
      } else if (histogram < 0 && histogram < (macdValue.macd - macdValue.signal_line)) {
        macdSignal = -1; // bearish
      } else {
        macdSignal = 0;
      }

      signals.macd = {
        macd: macdValue.macd,
        signal_line: macdValue.signal_line,
        histogram: macdValue.histogram,
        signal: macdSignal === 1 ? "bullish" : macdSignal === -1 ? "bearish" : "neutral",
        weight: weights.macd,
      };
    }

    let bollingerSignal: number | null = null;
    if (bollingerValue !== null) {
      const { position } = bollingerValue;
      if (position === "below_lower") bollingerSignal = 1; // oversold → bullish
      else if (position === "above_upper") bollingerSignal = -1; // overbought → bearish
      else bollingerSignal = 0;

      signals.bollinger = {
        upper: bollingerValue.upper,
        middle: bollingerValue.middle,
        lower: bollingerValue.lower,
        position: bollingerValue.position,
        signal: bollingerSignal === 1 ? "bullish" : bollingerSignal === -1 ? "bearish" : "neutral",
        weight: weights.bollinger,
      };
    }

    let volumeSignal: number | null = null;
    if (volumeValue !== null) {
      const { ratio, signal: volSignal } = volumeValue;
      const priceUp = currentPrice > (historicalPrices[0] ?? currentPrice);

      if (ratio > 1.5 && priceUp) {
        volumeSignal = 1; // high volume + price up → bullish
      } else if (ratio > 1.5 && !priceUp) {
        volumeSignal = -1; // high volume + price down → bearish
      } else {
        volumeSignal = 0;
      }

      signals.volume = {
        current_volume: volumeValue.current_volume,
        avg_volume: volumeValue.avg_volume,
        ratio: volumeValue.ratio,
        signal: volSignal,
        weight: weights.volume,
      };
    }

    // Calculate weighted composite score
    const scores: number[] = [];
    let totalWeight = 0;

    if (rsiSignal !== null) {
      scores.push(rsiSignal * weights.rsi);
      totalWeight += weights.rsi;
    }
    if (macdSignal !== null) {
      scores.push(macdSignal * weights.macd);
      totalWeight += weights.macd;
    }
    if (bollingerSignal !== null) {
      scores.push(bollingerSignal * weights.bollinger);
      totalWeight += weights.bollinger;
    }
    if (volumeSignal !== null) {
      scores.push(volumeSignal * weights.volume);
      totalWeight += weights.volume;
    }

    // Predict based on weighted sum
    const weightedSum = scores.reduce((a, b) => a + b, 0);
    const normalizedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    let prediction: Prediction = "neutral";
    if (normalizedScore > 0.2) prediction = "bullish";
    else if (normalizedScore < -0.2) prediction = "bearish";

    // Confidence: absolute value of normalized score (0–1)
    const confidence = Math.min(1, Math.abs(normalizedScore));

    return {
      success: true,
      symbol: displaySymbol,
      current_price: Number(currentPrice.toFixed(8)),
      timestamp,
      prediction,
      confidence: Number(confidence.toFixed(2)),
      signals,
      data_points: allPrices.length,
      minutes,
    };
  } catch (error: any) {
    return {
      success: false,
      symbol: displaySymbol,
      timestamp,
      error: `Signal computation failed: ${error.message}`,
    };
  }
}
