import { getSolanaConfig } from "openclaw-common";

export interface Config {
  rpcUrl: string;
  walletPath: string;
  slippageBps: number;
  jupiterUrl: string;
  jupiterApiKey?: string;
}

export function loadConfig(): Config {
  const { rpcUrl, walletPath } = getSolanaConfig();
  return {
    rpcUrl,
    walletPath,
    slippageBps: parseInt(process.env.SLIPPAGE_BPS || "50"),
    jupiterUrl: process.env.JUPITER_URL || "https://api.jup.ag",
    jupiterApiKey: process.env.JUPITER_API_KEY,
  };
}
