---
name: solana/trade
description: >
  Solana trading via Jupiter. Spot swap SOL/USDC (balance, quote, buy, sell)
  and perpetual positions (list, open-long, open-short, close, pnl). Use when
  asked to trade SOL, check wallet balance, open/close leveraged positions,
  or get swap quotes.
---

# Jupiter Trade CLI Reference

**Binary:** `node trader/vendor/jupiter/dist/cli.js <command>`

All commands output JSON to stdout. Errors are JSON with `{ "success": false, "error": "..." }`.
Exit code 0 = success, exit code 1 = error.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WALLET_PATH` | Yes | — | Absolute path to Solana keypair JSON file |
| `RPC_URL` | Yes | — | Solana RPC endpoint URL |
| `JUPITER_URL` | No | `https://api.jup.ag` | Jupiter Aggregator API base URL |
| `JUPITER_API_KEY` | No | — | Jupiter paid-tier API key |
| `SLIPPAGE_BPS` | No | `50` | Swap slippage tolerance in basis points (50 = 0.5%) |

---

## Swap Commands

**Base:** `node trader/vendor/jupiter/dist/cli.js swap <command> [options]`

### balance — Check wallet balances
```bash
node trader/vendor/jupiter/dist/cli.js swap balance
```
```json
{ "success": true, "sol": 2.451, "usdc": 150.23 }
```

### quote — Get swap quote (no execution)
```bash
node trader/vendor/jupiter/dist/cli.js swap quote --subcommand buy --amount 100
node trader/vendor/jupiter/dist/cli.js swap quote --subcommand sell --amount 0.5
```
- `--subcommand`: `buy` or `sell` (required)
- `--amount`: USDC amount for buy, SOL amount for sell (required)

```json
{ "success": true, "action": "buy", "inputAmount": 100, "outputAmount": 0.534, "priceImpact": 0.001 }
```

### buy — Buy SOL with USDC (executes on-chain)
```bash
node trader/vendor/jupiter/dist/cli.js swap buy --amount 100
```
- `--amount`: USDC to spend (required)

```json
{ "success": true, "action": "buy", "inputAmount": 100, "outputAmount": 0.534, "priceImpact": 0.001, "signature": "5xYz...abc" }
```

### sell — Sell SOL for USDC (executes on-chain)
```bash
node trader/vendor/jupiter/dist/cli.js swap sell --amount 0.5
```
- `--amount`: SOL to sell (required)

---

## Perps Commands

**Base:** `node trader/vendor/jupiter/dist/cli.js perps <command> [options]`

Jupiter Perpetuals uses a request-fulfillment model — opens/closes are not instant.

### list — List open positions
```bash
node trader/vendor/jupiter/dist/cli.js perps list
```
```json
{
  "success": true,
  "positions": [{
    "pubkey": "AbCd...1234",
    "side": "long",
    "entryPrice": 185.50,
    "sizeUsd": 200,
    "collateralUsd": 100,
    "openTime": "2024-01-15T10:30:00.000Z"
  }]
}
```

### open-long — Open leveraged long
```bash
node trader/vendor/jupiter/dist/cli.js perps open-long --collateral 50 --leverage 2
```
- `--collateral`: USD amount (required)
- `--leverage`: multiplier (default: `2`)

```json
{ "success": true, "side": "long", "collateralUsd": 50, "leverage": 2, "signature": "5xYz...abc" }
```

### open-short — Open leveraged short
```bash
node trader/vendor/jupiter/dist/cli.js perps open-short --collateral 50 --leverage 2
```
Same options as `open-long`.

### close — Close a position
```bash
node trader/vendor/jupiter/dist/cli.js perps close --position-pubkey AbCd...1234
```
- `--position-pubkey`: Position account public key (required)

```json
{ "success": true, "positionPubkey": "AbCd...1234", "signature": "9mNo...xyz" }
```

### pnl — Calculate PnL (read-only)
```bash
node trader/vendor/jupiter/dist/cli.js perps pnl \
  --position-pubkey AbCd...1234 \
  --current-price 190.50
```
- `--position-pubkey`: Position public key (required)
- `--current-price`: Current SOL price in USD (required)

```json
{ "success": true, "pnlUsd": 12.45, "closeFeeUsd": 0.80, "borrowFeeUsd": 0.12, "liquidationPrice": 88.20 }
```

---

## Workflow Patterns

**Safe swap:**
```
1. swap balance          → check available USDC/SOL
2. swap quote buy 100    → verify expected output
3. swap buy 100          → execute
```

**Safe perps:**
```
1. perps list            → check existing positions
2. perps open-long --collateral 50 --leverage 2
3. perps pnl --position-pubkey <pk> --current-price <price>
4. perps close --position-pubkey <pk>
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `WALLET_PATH required` | Env var missing | Add to `.env` |
| `RPC_URL required` | Env var missing | Add to `.env` |
| `--collateral required and must be positive` | Missing arg | Provide positive USD number |
| `--position-pubkey required` | Missing arg | Get from `perps list` |
| `--amount required and must be positive` | Missing arg | Provide positive number |
