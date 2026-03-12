/**
 * Swap CLI runner. Handles: balance, quote, buy, sell.
 */

import { loadConfig } from "../swap/utils/config.js";
import { balanceCommand } from "../swap/commands/balance.js";
import { quoteCommand } from "../swap/commands/quote.js";
import { swapCommand } from "../swap/commands/swap.js";
import { getParam } from "./parseArgs.js";

export async function runSwap(
  cmd: string,
  positionals: string[],
  params: Record<string, string>
): Promise<unknown> {
  const config = loadConfig();

  switch (cmd) {
    case "balance":
      return balanceCommand(config);
    case "quote": {
      const quoteAction = (getParam(params, "subcommand") ?? positionals[2]) as "buy" | "sell" | undefined;
      const quoteAmount = parseFloat(getParam(params, "amount") ?? positionals[3] ?? "");
      if (!quoteAction || !["buy", "sell"].includes(quoteAction)) {
        throw new Error("--subcommand buy|sell required");
      }
      if (isNaN(quoteAmount) || quoteAmount <= 0) {
        throw new Error("--amount <n> required and must be positive");
      }
      return quoteCommand(config, quoteAction, quoteAmount);
    }
    case "buy":
    case "sell": {
      const amount = parseFloat(getParam(params, "amount") ?? positionals[2] ?? "");
      if (isNaN(amount) || amount <= 0) {
        throw new Error("--amount <n> required and must be positive");
      }
      return swapCommand(config, cmd, amount);
    }
    default:
      throw new Error(`Unknown swap command: ${cmd}`);
  }
}
