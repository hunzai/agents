/**
 * CLI help text for Jupiter (perps + swap).
 */

export const HELP = `
Usage:
  node dist/cli.js perps <list|open-long|open-short|close|pnl> [options]
  node dist/cli.js swap <balance|quote|buy|sell> [options]

Perps:
  perps list
      [--wallet-path <path>]

  perps open-long [--collateral <usd>] [--leverage <n>]
      --collateral <usd>   Collateral in USD (required for open-long)
      --leverage <n>       Leverage (default 2)
      --wallet-path <path> Override WALLET_PATH

  perps open-short [--collateral <usd>] [--leverage <n>]
      --collateral <usd>   Collateral in USD (required)
      --leverage <n>       Leverage (default 2)
      --wallet-path <path> Override WALLET_PATH

  perps close [--position-pubkey <pubkey>]
      --position-pubkey <pubkey>   Position to close (required)
      --wallet-path <path>         Override WALLET_PATH

  perps pnl [--position-pubkey <pubkey>] [--current-price <price>]
      --position-pubkey <pubkey>   Position (required)
      --current-price <price>      SOL price for PNL (required)

Swap:
  swap balance
      [--wallet-path <path>]

  swap quote [--subcommand buy|sell] [--amount <n>]
      --subcommand <buy|sell>   buy or sell (required)
      --amount <n>             Amount in USDC (buy) or SOL (sell) (required)

  swap buy [--amount <usd>]
      --amount <usd>   USDC amount (required)

  swap sell [--amount <sol>]
      --amount <sol>   SOL amount (required)

Env: WALLET_PATH, RPC_URL (required for perps and swap execution).
     Optional: JUPITER_URL, JUPITER_API_KEY, SLIPPAGE_BPS (swap).
`;
