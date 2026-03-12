export const TOKEN_ADDRESSES = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
} as const;

export const TOKEN_DECIMALS = {
  SOL: 9,
  USDC: 6,
} as const;

export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  slippageBps: number;
  routePlan: any[];
}

export interface SwapResult {
  success: boolean;
  action: string;
  inputAmount: string;
  outputAmount: string;
  priceImpact: string;
  signature?: string;
  txUrl?: string;
  error?: string;
}

export interface BalanceResult {
  success: boolean;
  wallet: string;
  sol: string;
  usdc: string;
  error?: string;
}
