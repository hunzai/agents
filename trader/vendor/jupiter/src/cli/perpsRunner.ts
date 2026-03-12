/**
 * Perps (leverage) CLI runner. Handles: list, open-long, open-short, close, pnl.
 */

import { loadWallet } from "openclaw-common";
import { listPositions } from "../perps/commands/list.js";
import { openPosition } from "../perps/commands/open.js";
import { closePosition } from "../perps/commands/close.js";
import { getPositionPnl } from "../perps/commands/pnl.js";
import { getParam, getWalletPath } from "./parseArgs.js";

export async function runPerps(
  cmd: string,
  positionals: string[],
  params: Record<string, string>
): Promise<unknown> {
  const walletPath = getWalletPath(params);
  if (!walletPath && cmd !== "pnl") {
    throw new Error("WALLET_PATH required (env or --wallet-path)");
  }

  switch (cmd) {
    case "list": {
      const wallet = loadWallet(walletPath!);
      return listPositions(wallet.publicKey.toString());
    }
    case "open-long": {
      const collateralLong = parseFloat(getParam(params, "collateral") ?? positionals[2] ?? "");
      const leverageLong = parseFloat(getParam(params, "leverage") ?? positionals[3] ?? "2");
      if (!Number.isFinite(collateralLong) || collateralLong <= 0) {
        throw new Error("--collateral <usd> required and must be positive");
      }
      return openPosition("long", collateralLong, leverageLong, walletPath!);
    }
    case "open-short": {
      const collateralShort = parseFloat(getParam(params, "collateral") ?? positionals[2] ?? "");
      const leverageShort = parseFloat(getParam(params, "leverage") ?? positionals[3] ?? "2");
      if (!Number.isFinite(collateralShort) || collateralShort <= 0) {
        throw new Error("--collateral <usd> required and must be positive");
      }
      return openPosition("short", collateralShort, leverageShort, walletPath!);
    }
    case "close": {
      const pubkey = getParam(params, "position_pubkey") ?? positionals[2];
      if (!pubkey) throw new Error("--position-pubkey <pubkey> required");
      return closePosition(pubkey, walletPath!);
    }
    case "pnl": {
      const pubkeyPnl = getParam(params, "position_pubkey") ?? positionals[2];
      const price = parseFloat(getParam(params, "current_price") ?? positionals[3] ?? "");
      if (!pubkeyPnl) throw new Error("--position-pubkey <pubkey> required");
      if (!Number.isFinite(price) || price <= 0) throw new Error("--current-price <price> required");
      return getPositionPnl(pubkeyPnl, price);
    }
    default:
      throw new Error(`Unknown perps command: ${cmd}`);
  }
}
