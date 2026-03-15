#!/usr/bin/env node
/**
 * Price CLI — Solana price analysis via Pyth Network + CoinGecko.
 */

import "dotenv/config";
import { fetchCommand } from "./src/commands/fetch.js";
import { analysisCommand } from "./src/commands/analysis.js";
import { historicalCommand } from "./src/commands/historical.js";
import { signalCommand } from "./src/commands/signal.js";
import { levelsCommand } from "./src/commands/levels.js";
import { sentimentCommand } from "./src/commands/sentiment.js";

const USAGE = `
Solana Price CLI

Usage:
  cli.js fetch <output-path> [options]       Fetch current price → append to file
  cli.js analysis <path> [minutes]           Analyze local price history file
  cli.js historical [coinId] [days]          CoinGecko historical OHLCV data
  cli.js signal [symbol] [minutes]           RSI/MACD/Bollinger/EMA/Volume composite signal
  cli.js levels [symbol]                     Pivot points, S/R levels, swing highs/lows
  cli.js sentiment                           Fear & Greed index + global market data

fetch options:
  --source pyth|gecko   Price source (default: pyth, falls back to gecko)
  --feed <id>           Pyth feed ID (default: SOL/USD)
  --coin <id>           CoinGecko coin ID (default: solana)

signal options:
  symbol                sol | btc | eth (default: sol)
  minutes               Look-back window, 35–1440 (default: 120)

levels options:
  symbol                sol | btc | eth (default: sol)

Examples:
  cli.js fetch /tmp/sol_price.txt
  cli.js fetch /tmp/sol_price.txt --source gecko --coin solana
  cli.js analysis /tmp/sol_price.txt
  cli.js analysis /tmp/sol_price.txt 30
  cli.js historical
  cli.js historical solana 7
  cli.js historical bitcoin 30
  cli.js signal
  cli.js signal sol 240
  cli.js signal btc 120
  cli.js levels
  cli.js levels sol
  cli.js sentiment

Env:
  COINGECKO_API_KEY     Optional demo API key (raises rate limits)
  PRICE_HISTORY_FILE    Default path for fetch and analysis commands
`.trim();

interface ParsedArgs {
  command: string;
  positionals: string[];
  flags: Record<string, string>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  const command = args[0] ?? "help";
  const positionals: string[] = [];
  const flags: Record<string, string> = {};

  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = "true";
        i += 1;
      }
    } else {
      positionals.push(arg);
      i += 1;
    }
  }

  return { command, positionals, flags };
}

async function main(): Promise<void> {
  const { command, positionals, flags } = parseArgs(process.argv);

  if (command === "help" || flags["help"] === "true") {
    console.log(USAGE);
    process.exit(0);
  }

  // ── fetch ──────────────────────────────────────────────────────────────────
  if (command === "fetch") {
    const outputPath = positionals[0] ?? process.env.PRICE_HISTORY_FILE;
    if (!outputPath) {
      console.error("Error: output path required.\n  cli.js fetch <output-path>\n  or set PRICE_HISTORY_FILE");
      process.exit(1);
    }

    const source = flags["source"] as "pyth" | "gecko" | undefined;
    if (source && source !== "pyth" && source !== "gecko") {
      console.error("Error: --source must be pyth or gecko");
      process.exit(1);
    }

    const result = await fetchCommand({
      outputPath,
      source,
      feedId: flags["feed"],
      coinId: flags["coin"],
    });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }

  // ── analysis ───────────────────────────────────────────────────────────────
  if (command === "analysis") {
    const historyPath = positionals[0] ?? process.env.PRICE_HISTORY_FILE;
    if (!historyPath) {
      console.error("Error: path required.\n  cli.js analysis <path> [minutes]\n  or set PRICE_HISTORY_FILE");
      process.exit(1);
    }

    const minutesArg = positionals[1];
    const minutes = minutesArg != null ? parseInt(minutesArg, 10) : 60;
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 43200) {
      console.error("Error: minutes must be 1–43200");
      process.exit(1);
    }

    const result = await analysisCommand({ historyPath, minutes });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }

  // ── historical ─────────────────────────────────────────────────────────────
  if (command === "historical") {
    const coinId = positionals[0] ?? "solana";
    const daysArg = positionals[1];
    const days = daysArg != null ? parseInt(daysArg, 10) : 1;
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      console.error("Error: days must be 1–365");
      process.exit(1);
    }

    const result = await historicalCommand({ coinId, days });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }

  // ── signal ─────────────────────────────────────────────────────────────────
  if (command === "signal") {
    const symbol = positionals[0] ?? "sol";
    const minutesArg = positionals[1];
    const minutes = minutesArg != null ? parseInt(minutesArg, 10) : 120;
    if (!Number.isFinite(minutes) || minutes < 35 || minutes > 1440) {
      console.error("Error: minutes must be 35–1440 (MACD needs ≥35 data points)");
      process.exit(1);
    }

    const result = await signalCommand({ symbol, minutes });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }

  // ── levels ─────────────────────────────────────────────────────────────────
  if (command === "levels") {
    const symbol = positionals[0] ?? "sol";
    const result = await levelsCommand({ symbol });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }

  // ── sentiment ──────────────────────────────────────────────────────────────
  if (command === "sentiment") {
    const result = await sentimentCommand();
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }

  console.error(`Unknown command: ${command}\n`);
  console.error(USAGE);
  process.exit(1);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[price] Fatal error: ${message}`);
  process.exit(1);
});
