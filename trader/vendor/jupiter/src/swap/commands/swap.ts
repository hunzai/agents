import { loadWallet } from "openclaw-common";
import type { Config } from "../utils/config.js";
import type { SwapResult } from "../types/index.js";
import { JupiterAPI } from "../api/jupiter.js";
import { BalanceService } from "../blockchain/balance.js";
import { TransactionService } from "../blockchain/transaction.js";
import { TOKEN_ADDRESSES, TOKEN_DECIMALS } from "../types/index.js";

const SOL_FEE_RESERVE = 0.01;

export async function swapCommand(
  config: Config,
  action: "buy" | "sell",
  amount: number
): Promise<SwapResult> {
  try {
    const jupiter = new JupiterAPI(config.jupiterUrl, config.jupiterApiKey);
    const balanceService = new BalanceService(config.rpcUrl);
    const txService = new TransactionService(config.rpcUrl);

    const keypair = loadWallet(config.walletPath);
    const wallet = keypair.publicKey.toString();

    let inputMint: string, outputMint: string, swapAmount: number;

    if (action === "buy") {
      inputMint = TOKEN_ADDRESSES.USDC;
      outputMint = TOKEN_ADDRESSES.SOL;
      swapAmount = amount;

      const usdcBalance = await balanceService.getUSDCBalance(wallet);
      if (usdcBalance < amount) {
        throw new Error(
          `Insufficient USDC: need ${amount}, have ${usdcBalance.toFixed(2)}`
        );
      }
    } else {
      inputMint = TOKEN_ADDRESSES.SOL;
      outputMint = TOKEN_ADDRESSES.USDC;

      const solBalance = await balanceService.getSOLBalance(wallet);
      if (solBalance < amount + SOL_FEE_RESERVE) {
        throw new Error(
          `Insufficient SOL: need ${amount} + ${SOL_FEE_RESERVE} for fees, have ${solBalance.toFixed(9)}`
        );
      }

      swapAmount = Math.min(amount, solBalance - SOL_FEE_RESERVE);
    }

    const decimals =
      inputMint === TOKEN_ADDRESSES.SOL
        ? TOKEN_DECIMALS.SOL
        : TOKEN_DECIMALS.USDC;
    const rawAmount = Math.floor(swapAmount * Math.pow(10, decimals)).toString();

    const quote = await jupiter.getQuote(
      inputMint,
      outputMint,
      rawAmount,
      config.slippageBps
    );

    const swapTx = await jupiter.getSwapTransaction(quote, wallet);
    const signature = await txService.sendAndConfirm(swapTx, keypair);

    const inDecimals =
      inputMint === TOKEN_ADDRESSES.SOL
        ? TOKEN_DECIMALS.SOL
        : TOKEN_DECIMALS.USDC;
    const outDecimals =
      outputMint === TOKEN_ADDRESSES.SOL
        ? TOKEN_DECIMALS.SOL
        : TOKEN_DECIMALS.USDC;

    const inputAmount = (
      Number(quote.inAmount) / Math.pow(10, inDecimals)
    ).toFixed(inDecimals === 6 ? 2 : 6);

    const outputAmount = (
      Number(quote.outAmount) / Math.pow(10, outDecimals)
    ).toFixed(outDecimals === 6 ? 2 : 6);

    return {
      success: true,
      action: action === "buy" ? "BUY" : "SELL",
      inputAmount: `${inputAmount} ${action === "buy" ? "USDC" : "SOL"}`,
      outputAmount: `${outputAmount} ${action === "buy" ? "SOL" : "USDC"}`,
      priceImpact: `${quote.priceImpactPct}%`,
      signature,
      txUrl: `https://solscan.io/tx/${signature}`,
    };
  } catch (error: any) {
    return {
      success: false,
      action: action === "buy" ? "BUY" : "SELL",
      inputAmount: "",
      outputAmount: "",
      priceImpact: "",
      error: error.message,
    };
  }
}
