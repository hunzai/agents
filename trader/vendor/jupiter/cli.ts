#!/usr/bin/env node
/**
 * Jupiter CLI: perps | swap with named params.
 * Delegates to perpsRunner and swapRunner.
 * Run after build: node dist/cli.js <perps|swap> <command> [options]
 */

import "dotenv/config";
import { parseArgs, getParam } from "./src/cli/parseArgs.js";
import { HELP } from "./src/cli/help.js";
import { runPerps } from "./src/cli/perpsRunner.js";
import { runSwap } from "./src/cli/swapRunner.js";

const rawArgs = process.argv.slice(2);
const { positionals, params } = parseArgs(rawArgs);
const sub = positionals[0];
const cmd = positionals[1];

if (!sub || sub === "help" || sub === "--help" || sub === "-h") {
  console.log(HELP);
  process.exit(0);
}

const walletPathArg = getParam(params, "wallet_path");
if (walletPathArg) process.env.WALLET_PATH = walletPathArg;

async function main() {
  let result: unknown;

  try {
    if (sub === "perps") {
      result = await runPerps(cmd, positionals, params);
    } else if (sub === "swap") {
      result = await runSwap(cmd, positionals, params);
    } else {
      console.error(
        JSON.stringify({ success: false, error: `Unknown subcommand: ${sub}. Use perps or swap.` })
      );
      process.exit(1);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ success: false, error: message }, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
  const outcome = result as { success?: boolean };
  process.exit(outcome?.success === false ? 1 : 0);
}

main();
