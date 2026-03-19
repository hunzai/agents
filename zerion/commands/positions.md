---
description: >
  List all token positions in a wallet — name, symbol, chain, quantity, value, 24h change.
  Use when asked about specific token holdings, what tokens are in a wallet, DeFi positions,
  or "what coins do I have" — works across 40+ chains including Ethereum, Arbitrum, Solana.
allowed-tools: Bash(*)
---

# Wallet Positions (Zerion)

Detailed list of all token positions across chains for any wallet.

## Steps

### Step 1: Environment check

```bash
echo "ZERION: ${ZERION_API_KEY:-NOT SET}"
```

### Step 2: Build CLI (idempotent)

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
```

### Step 3: Fetch positions

```bash
NODE_OPTIONS="--dns-result-order=ipv4first" node ${CLAUDE_PLUGIN_ROOT}/vendor/zerion/dist/cli.js positions <ADDRESS> [--currency usd] [--chain <chain>] [--sort -value]
```

### Step 4: Format report

Filter out zero-value positions and present:

```
Positions: <address>
Total: $<total_value> across <count> tokens

Token          Chain        Qty            Value     24h
ETH            ethereum     1.234          $2,345    +2.3%
USDC           arbitrum     500.00         $500      0.0%
SOL            solana       10.5           $1,890    -1.2%
...
```

Group by chain if user asks for a chain breakdown.

## Supported Chains

Zerion supports 40+ chains including: ethereum, arbitrum, optimism, base, polygon, avalanche, binance-smart-chain, fantom, solana, and many more.

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--currency` | `usd` | Price denomination |
| `--chain` | all | Filter to one chain |
| `--sort` | `-value` | Sort order |
