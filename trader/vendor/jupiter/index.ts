/**
 * Jupiter - OpenClaw Plugin
 * Registers both `leverage` (perps) and `swap` (aggregator) tools.
 */

import { loadWallet, toolSuccess, toolError } from "openclaw-common";
import { listPositions } from "./src/perps/commands/list.js";
import { openPosition } from "./src/perps/commands/open.js";
import { closePosition } from "./src/perps/commands/close.js";
import { getPositionPnl } from "./src/perps/commands/pnl.js";
import { loadConfig } from "./src/swap/utils/config.js";
import { balanceCommand } from "./src/swap/commands/balance.js";
import { quoteCommand } from "./src/swap/commands/quote.js";
import { swapCommand } from "./src/swap/commands/swap.js";

export default function register(api: any) {
  // --- Leverage (perps) tool ---
  api.registerTool({
    name: "leverage",
    description: `Execute SOL/USDC leverage positions via Jupiter Perpetuals.

Commands:
  list                      List open positions
  open-long <collateral> [leverage]   Open long position (default 2x)
  open-short <collateral> [leverage]  Open short position (default 2x)
  close <position_pubkey>   Close position entirely
  pnl <position_pubkey> <current_price>  Get PNL and liquidation price

Returns JSON with success, positions, pnl, tx signatures.
Default leverage: 2x. Request-fulfillment model (not instant).`,
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "Command: list, open-long, open-short, close, pnl" },
        collateral: { type: "number", description: "Collateral in USD (open commands)" },
        leverage: { type: "number", description: "Leverage (default 2)" },
        position_pubkey: { type: "string", description: "Position pubkey (close/pnl)" },
        current_price: { type: "number", description: "SOL price (pnl)" },
      },
      required: ["command"],
    },
    async execute(_id: string, params: { command: string; collateral?: number; leverage?: number; position_pubkey?: string; current_price?: number }) {
      try {
        const walletPath = process.env.WALLET_PATH!;
        const { command, collateral, leverage = 2, position_pubkey, current_price } = params;
        let result: any;
        switch (command) {
          case "list":
            const wallet = loadWallet(walletPath);
            result = await listPositions(wallet.publicKey.toString());
            break;
          case "open-long":
            if (!collateral || collateral <= 0) throw new Error("collateral must be positive");
            result = await openPosition("long", collateral, leverage, walletPath);
            break;
          case "open-short":
            if (!collateral || collateral <= 0) throw new Error("collateral must be positive");
            result = await openPosition("short", collateral, leverage, walletPath);
            break;
          case "close":
            if (!position_pubkey) throw new Error("position_pubkey required");
            result = await closePosition(position_pubkey, walletPath);
            break;
          case "pnl":
            if (!position_pubkey) throw new Error("position_pubkey required");
            if (!current_price || current_price <= 0) throw new Error("current_price required");
            result = await getPositionPnl(position_pubkey, current_price);
            break;
          default:
            throw new Error(`Unknown command: ${command}. Use list, open-long, open-short, close, pnl.`);
        }
        return toolSuccess(result);
      } catch (error: any) {
        return toolError(error);
      }
    },
  });

  // --- Swap tool ---
  api.registerTool({
    name: "swap",
    description: `Execute SOL/USDC swaps via Jupiter Aggregator.

Commands:
  balance               Check SOL and USDC wallet balances
  quote buy <amount>    Get buy quote (USDC amount)
  quote sell <amount>   Get sell quote (SOL amount)
  buy <amount>          Buy SOL with USDC
  sell <amount>         Sell SOL for USDC

Returns JSON with success, action, inputAmount, outputAmount, priceImpact, signature.`,
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "Command: balance, buy, sell, quote" },
        subcommand: { type: "string", description: "For quote: buy or sell" },
        amount: { type: "number", description: "Amount (USDC for buy, SOL for sell)" },
      },
      required: ["command"],
    },
    async execute(_id: string, params: { command: string; subcommand?: string; amount?: number }) {
      try {
        const config = loadConfig();
        const { command, subcommand, amount } = params;
        let result: any;
        switch (command) {
          case "balance":
            result = await balanceCommand(config);
            break;
          case "quote":
            if (!subcommand || !["buy", "sell"].includes(subcommand))
              throw new Error("quote requires buy or sell subcommand");
            if (!amount || amount <= 0) throw new Error("amount must be positive");
            result = await quoteCommand(config, subcommand as "buy" | "sell", amount);
            break;
          case "buy":
          case "sell":
            if (!amount || amount <= 0) throw new Error("amount must be positive");
            result = await swapCommand(config, command, amount);
            break;
          default:
            throw new Error(`Unknown command: ${command}. Use balance, buy, sell, quote.`);
        }
        return toolSuccess(result);
      } catch (error: any) {
        return toolError(error);
      }
    },
  });
}
