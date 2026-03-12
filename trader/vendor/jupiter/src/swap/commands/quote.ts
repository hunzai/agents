import type { Config } from "../utils/config.js";
import type { SwapResult } from "../types/index.js";
import { JupiterAPI } from "../api/jupiter.js";
import { TOKEN_ADDRESSES, TOKEN_DECIMALS } from "../types/index.js";

export async function quoteCommand(
  config: Config,
  action: "buy" | "sell",
  amount: number
): Promise<SwapResult> {
  try {
    const jupiter = new JupiterAPI(config.jupiterUrl, config.jupiterApiKey);

    let inputMint: string, outputMint: string, decimals: number;

    if (action === "buy") {
      inputMint = TOKEN_ADDRESSES.USDC;
      outputMint = TOKEN_ADDRESSES.SOL;
      decimals = TOKEN_DECIMALS.USDC;
    } else {
      inputMint = TOKEN_ADDRESSES.SOL;
      outputMint = TOKEN_ADDRESSES.USDC;
      decimals = TOKEN_DECIMALS.SOL;
    }

    const rawAmount = Math.floor(amount * Math.pow(10, decimals)).toString();
    const quote = await jupiter.getQuote(
      inputMint,
      outputMint,
      rawAmount,
      config.slippageBps
    );

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
      signature: "QUOTE_ONLY",
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
