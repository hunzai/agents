# Jupiter extension

Single OpenClaw extension for **Jupiter Perpetuals** (leverage) and **Jupiter Aggregator** (swap). Registers two tools: `leverage` and `swap`, so existing agents and config keep working.

## Build

```bash
cd extensions/jupiter
npm install
npm run build
```

## CLI (named params)

All commands support named parameters. Use `--key value` or `--key=value`. Run either from **repo root** or from **extensions/jupiter/** (paths below assume you are in `extensions/jupiter/`; from repo root use `extensions/jupiter/dist/cli.js` instead of `dist/cli.js`).

**Required env (or pass per command):** `WALLET_PATH`, `RPC_URL`. Optional for swap: `JUPITER_URL`, `JUPITER_API_KEY`, `SLIPPAGE_BPS`.

### Perps (leverage)

```bash
# List open positions
node dist/cli.js perps list
node dist/cli.js perps list --wallet-path /path/to/wallet.json

# Open long (collateral in USD, leverage multiplier)
node dist/cli.js perps open-long --collateral 1 --leverage 30
node dist/cli.js perps open-long --collateral 10 --leverage 5 --wallet-path /path/to/wallet.json

# Open short
node dist/cli.js perps open-short --collateral 1 --leverage 50
node dist/cli.js perps open-short --collateral 1 --leverage 50 --wallet-path=/path/to/wallet.json

# Close position (use position pubkey from list or from open response)
node dist/cli.js perps close --position-pubkey 7Rix45BTKLU391vfkoNDRUW9ii6pkqaxjf939f9yLeuX
node dist/cli.js perps close --position-pubkey 7Rix45BTKLU391vfkoNDRUW9ii6pkqaxjf939f9yLeuX --wallet-path /path/to/wallet.json

# PNL and liquidation price for a position
node dist/cli.js perps pnl --position-pubkey 7Rix45BTKLU391vfkoNDRUW9ii6pkqaxjf939f9yLeuX --current-price 85.5
node dist/cli.js perps pnl --position-pubkey 7Rix45BTKLU391vfkoNDRUW9ii6pkqaxjf939f9yLeuX --current-price 85.5 --wallet-path /path/to/wallet.json
```

### Swap

```bash
# Wallet balance (SOL + USDC)
node dist/cli.js swap balance
node dist/cli.js swap balance --wallet-path /path/to/wallet.json

# Quote only (no transaction)
node dist/cli.js swap quote --subcommand buy --amount 1
node dist/cli.js swap quote --subcommand sell --amount 0.05

# Buy SOL with USDC
node dist/cli.js swap buy --amount 1
node dist/cli.js swap buy --amount 10 --wallet-path /path/to/wallet.json

# Sell SOL for USDC
node dist/cli.js swap sell --amount 0.05
node dist/cli.js swap sell --amount 0.1 --wallet-path /path/to/wallet.json
```

**Help:** `node dist/cli.js help` (or `node dist/cli.js --help`)

## Run from repo root

From the project root, use the full path to the CLI:

```bash
node extensions/jupiter/dist/cli.js perps list
node extensions/jupiter/dist/cli.js perps open-short --collateral 1 --leverage 50 --wallet-path=/home/you/projects/openclaw/wallet.json
node extensions/jupiter/dist/cli.js perps close --position-pubkey <pubkey> --wallet-path=/home/you/projects/openclaw/wallet.json
node extensions/jupiter/dist/cli.js swap balance --wallet-path=/home/you/projects/openclaw/wallet.json
```

## Tool registration

When the extension is loaded, it registers:

- **leverage** — list, open-long, open-short, close, pnl (same as former leverage extension).
- **swap** — balance, quote, buy, sell (same as former swap extension).

Env: `WALLET_PATH`, `RPC_URL` (and for swap: `JUPITER_URL`, `JUPITER_API_KEY`, `SLIPPAGE_BPS` optional).
