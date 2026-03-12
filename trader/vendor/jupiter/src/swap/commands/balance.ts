import { loadWallet } from "openclaw-common";
import type { Config } from "../utils/config.js";
import type { BalanceResult } from "../types/index.js";
import { BalanceService } from "../blockchain/balance.js";

export async function balanceCommand(config: Config): Promise<BalanceResult> {
  try {
    const balanceService = new BalanceService(config.rpcUrl);
    const keypair = loadWallet(config.walletPath);
    const wallet = keypair.publicKey.toString();

    const sol = await balanceService.getSOLBalance(wallet);
    const usdc = await balanceService.getUSDCBalance(wallet);

    return {
      success: true,
      wallet,
      sol: sol.toFixed(9),
      usdc: usdc.toFixed(6),
    };
  } catch (error: any) {
    return {
      success: false,
      wallet: "",
      sol: "0",
      usdc: "0",
      error: error.message,
    };
  }
}
