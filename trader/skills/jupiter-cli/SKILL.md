---
name: jupiter-cli
description: >
  Jupiter and price CLI reference for Solana trading. Use this skill when executing
  trades, checking balances, managing perpetual positions, or fetching price data
  on Solana via the Inti plugin's bundled CLIs.
---

# Jupiter CLI Reference

The Inti plugin bundles two CLI tools under `${CLAUDE_PLUGIN_ROOT}/vendor/`:

| CLI | Binary path | Purpose |
|-----|-------------|---------|
| Jupiter | `${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js` | Spot swaps + perpetual positions |
| Price | `${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js` | CoinGecko historical + local price file analysis |

All CLIs output JSON to stdout. Errors are JSON to stderr with `{ "success": false, "error": "..." }`.
Exit code 0 = success, exit code 1 = error.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WALLET_PATH` | Yes (swap + perps) | — | Absolute path to Solana keypair JSON file (standard `[64-byte array]` or `{ "secretKey": [...] }` format) |
| `RPC_URL` | Yes (swap + perps) | — | Solana RPC endpoint URL |
| `JUPITER_URL` | No | `https://api.jup.ag` | Jupiter Aggregator API base URL |
| `JUPITER_API_KEY` | No | — | Jupiter paid-tier API key |
| `SLIPPAGE_BPS` | No | `50` | Swap slippage tolerance in basis points (50 = 0.5%) |
| `COINGECKO_API_KEY` | No | — | CoinGecko API key for higher rate limits |
| `PRICE_HISTORY_FILE` | No | — | Default path for `price analysis` command |

---

## Jupiter CLI: Swap Commands

**Binary:** `node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js swap <command> [options]`

### balance
Check SOL and USDC wallet balances.
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js swap balance
```
**Output:**
```json
{
  "success": true,
  "sol": 2.451,
  "usdc": 150.23
}
```

### quote buy
Get a quote for buying SOL with USDC. Does not execute a transaction.
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js swap quote --subcommand buy --amount 100
```
- `--subcommand`: `buy` or `sell` (required)
- `--amount`: USDC amount for buy, SOL amount for sell (required, must be positive)

**Output:**
```json
{
  "success": true,
  "action": "buy",
  "inputAmount": 100,
  "outputAmount": 0.534,
  "priceImpact": 0.001
}
```

### quote sell
Get a quote for selling SOL for USDC.
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js swap quote --subcommand sell --amount 0.5
```

### buy
Buy SOL with USDC (executes on-chain transaction).
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js swap buy --amount 100
```
- `--amount`: USDC amount to spend (required, must be positive)

**Output:**
```json
{
  "success": true,
  "action": "buy",
  "inputAmount": 100,
  "outputAmount": 0.534,
  "priceImpact": 0.001,
  "signature": "5xYz...abc"
}
```

### sell
Sell SOL for USDC (executes on-chain transaction).
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js swap sell --amount 0.5
```
- `--amount`: SOL amount to sell (required, must be positive)

---

## Jupiter CLI: Perps Commands

**Binary:** `node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps <command> [options]`

Jupiter Perpetuals uses a **request-fulfillment model** — position opens/closes are not instant.
The transaction sends a request to the on-chain program; fulfillment happens in the next keeper cycle.

### list
List all open perpetual positions for the configured wallet.
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps list
```
**Output:**
```json
{
  "success": true,
  "positions": [
    {
      "pubkey": "AbCd...1234",
      "side": "long",
      "entryPrice": 185.50,
      "sizeUsd": 200,
      "collateralUsd": 100,
      "openTime": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### open-long
Open a leveraged long position on SOL.
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps open-long --collateral 50 --leverage 2
```
- `--collateral`: Collateral in USD (required, must be positive)
- `--leverage`: Leverage multiplier (optional, default `2`)
- `--wallet-path`: Override `WALLET_PATH` env var (optional)

**Output:**
```json
{
  "success": true,
  "side": "long",
  "collateralUsd": 50,
  "leverage": 2,
  "signature": "5xYz...abc"
}
```

### open-short
Open a leveraged short position on SOL.
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps open-short --collateral 50 --leverage 2
```
Same options as `open-long`.

### close
Close an existing position entirely.
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps close --position-pubkey AbCd...1234
```
- `--position-pubkey`: Public key of the position account (required)
- `--wallet-path`: Override `WALLET_PATH` env var (optional)

**Output:**
```json
{
  "success": true,
  "positionPubkey": "AbCd...1234",
  "signature": "9mNo...xyz"
}
```

### pnl
Calculate PnL, borrow fees, close fees, and liquidation price for a position.
Does not execute a transaction — read-only.
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps pnl \
  --position-pubkey AbCd...1234 \
  --current-price 190.50
```
- `--position-pubkey`: Position account public key (required)
- `--current-price`: Current SOL price in USD (required, must be positive)

**Output:**
```json
{
  "success": true,
  "pnlUsd": 12.45,
  "closeFeeUsd": 0.80,
  "borrowFeeUsd": 0.12,
  "liquidationPrice": 88.20
}
```

---

## Price CLI

**Binary:** `node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js <command> [args]`

### historical
Fetch OHLCV data from CoinGecko for any coin.
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js historical [coinId] [days]
```
- `coinId`: CoinGecko coin ID (optional, default `solana`). Examples: `solana`, `bitcoin`, `ethereum`
- `days`: Number of days of history (optional, default `1`, max `365`)

```bash
# SOL price for last 7 days
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js historical solana 7

# BTC price for last 30 days
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js historical bitcoin 30
```

**Output:**
```json
{
  "success": true,
  "coinId": "solana",
  "days": 7,
  "prices": [[1705276800000, 98.45], [1705363200000, 102.10]],
  "market_caps": [[1705276800000, 45000000000]],
  "total_volumes": [[1705276800000, 1200000000]]
}
```
Timestamps are Unix milliseconds.

### price analysis
Analyse a local price history file. No API calls.
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js price analysis <path> [minutes]
```
- `path`: Path to a price history file in `epoch,timestamp,price` CSV format (required)
- `minutes`: Look-back window in minutes (optional, default `60`, max `43200`)

**Output:**
```json
{
  "success": true,
  "currentPrice": 192.30,
  "minPrice": 188.10,
  "maxPrice": 195.40,
  "dipFromMax": -1.59,
  "highFromMin": 2.23,
  "trend": "bullish",
  "sampledPrices": [188.10, 190.20, 192.30]
}
```
`trend` values: `"bullish"`, `"bearish"`, or `"flat"`

---

## Error Response Format

All errors follow this shape:
```json
{ "success": false, "error": "descriptive error message" }
```

Common errors:
- `WALLET_PATH required` — set `WALLET_PATH` env var or pass `--wallet-path`
- `RPC_URL required` — set `RPC_URL` or `SOLANA_RPC_URL` env var
- `--collateral required and must be positive` — provide a positive USD number
- `--position-pubkey required` — provide the base58 position pubkey from `perps list`
- `--amount required and must be positive` — provide a positive number

---

## Workflow Patterns

**Safe swap workflow:**
```
1. swap balance          → check available USDC/SOL
2. swap quote buy 100    → verify expected output and price impact
3. swap buy 100          → execute if quote is acceptable
```

**Safe perps workflow:**
```
1. historical solana 1   → get current price context
2. perps list            → check existing positions
3. perps open-long --collateral 50 --leverage 2   → open position
4. perps pnl --position-pubkey <pk> --current-price <price>  → monitor
5. perps close --position-pubkey <pk>             → close when done
```
