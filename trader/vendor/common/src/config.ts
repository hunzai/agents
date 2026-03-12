export interface SolanaConfig {
  rpcUrl: string;
  walletPath: string;
}

/**
 * Read RPC URL and wallet path from env. Throws if missing.
 * Supports RPC_URL or SOLANA_RPC_URL for RPC.
 */
export function getSolanaConfig(): SolanaConfig {
  const rpcUrl =
    process.env.RPC_URL || process.env.SOLANA_RPC_URL;
  const walletPath = process.env.WALLET_PATH;

  if (!rpcUrl || !walletPath) {
    throw new Error(
      "Missing required env: RPC_URL (or SOLANA_RPC_URL) and WALLET_PATH"
    );
  }

  return { rpcUrl, walletPath };
}
