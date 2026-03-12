#!/usr/bin/env node
/**
 * Price CLI: "price analysis" (from file) and "historical" (CoinGecko).
 */

import { historicalCommand } from "./src/commands/historical.js";
import { analysisCommand } from "./src/commands/analysis.js";
import { signalCommand } from "./src/commands/signal.js";

const args = process.argv.slice(2);
const cmd = args[0];
const sub = args[1];

if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
  console.log(`
Usage:
  node dist/cli.js price analysis <path> [minutes]
  node dist/cli.js historical [coinId] [days]
  node dist/cli.js signal [symbol] [minutes]

Commands:
  price analysis <path> [minutes]
                            Read price history file (epoch,timestamp,price per line).
                            Compare last price to min/max over last N minutes. No API calls.
                            path: path to price_history file (e.g. from PRICE_HISTORY_FILE).
                            minutes: default 60, max 43200 (30 days).

  historical [coinId] [days] CoinGecko market_chart: prices, market_caps, total_volumes.
                            coinId: default solana. days: default 1, max 365.

  signal [symbol] [minutes]  Technical indicators (RSI, MACD, Bollinger, Volume).
                            Weighted composite prediction: bullish | bearish | neutral.
                            symbol: sol (default), eth, btc.
                            minutes: default 120, must be 35–1440.

Examples:
  node dist/cli.js price analysis /root/.openclaw/logs/solana/price_history.txt
  node dist/cli.js price analysis ./price_history.txt 30
  node dist/cli.js historical
  node dist/cli.js historical bitcoin 7
  node dist/cli.js signal
  node dist/cli.js signal sol 60
  node dist/cli.js signal eth 240
  node dist/cli.js signal btc

Env: COINGECKO_API_KEY (optional, for historical/signal). PRICE_HISTORY_FILE (optional default path for analysis).
`);
  process.exit(0);
}

async function main() {
  if (cmd === "price" && sub === "analysis") {
    const pathArg = args[2];
    const minutesArg = args[3];
    const historyPath = pathArg ?? process.env.PRICE_HISTORY_FILE;
    if (!historyPath) {
      console.error(
        JSON.stringify({
          success: false,
          error: "Path required: price analysis <path> [minutes] or set PRICE_HISTORY_FILE",
        })
      );
      process.exit(1);
    }
    const minutes = minutesArg != null ? parseInt(String(minutesArg), 10) : 60;
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 43200) {
      console.error(JSON.stringify({ success: false, error: "minutes must be 1–43200 (30 days)" }));
      process.exit(1);
    }
    const result = await analysisCommand({ historyPath, minutes });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
    return;
  }

  if (cmd === "historical") {
    const coinId = args[1] ?? "solana";
    const daysArg = args[2] ?? (Number.isFinite(Number(coinId)) ? coinId : undefined);
    const finalCoinId = daysArg !== undefined && Number.isFinite(Number(coinId)) ? "solana" : coinId;
    const days = daysArg != null ? parseInt(String(daysArg), 10) : 1;
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      console.error(JSON.stringify({ success: false, error: "days must be 1–365" }));
      process.exit(1);
    }
    const result = await historicalCommand({ coinId: finalCoinId, days });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
    return;
  }

  if (cmd === "signal") {
    const symbol = args[1] ?? "sol";
    const minutesArg = args[2];
    const minutes = minutesArg != null ? parseInt(String(minutesArg), 10) : 120;
    if (!Number.isFinite(minutes) || minutes < 35 || minutes > 1440) {
      console.error(JSON.stringify({ success: false, error: "minutes must be 35–1440" }));
      process.exit(1);
    }
    const result = await signalCommand({ symbol, minutes });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
    return;
  }

  console.error(
    JSON.stringify({
      success: false,
      error: 'Use "price analysis <path> [minutes]", "historical [coinId] [days]", or "signal [symbol] [minutes]"',
    })
  );
  process.exit(1);
}

main();
