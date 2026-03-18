---
description: >
  Spot swap SOL/USDC and manage perpetual positions (open/close/pnl) via Jupiter.
  Use when asked to trade SOL, check wallet balance, or manage leveraged positions.
allowed-tools: Bash(*)
---

# Jupiter Trade CLI Reference

**Binary:** `node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js <command>`

Build first: `bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh`

**Requires:** `WALLET_PATH` and `RPC_URL` env vars.

## Swap Commands

```bash
# Check wallet balances
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js swap balance

# Get quote (no execution)
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js swap quote --subcommand buy --amount 100

# Buy SOL with USDC
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js swap buy --amount 100

# Sell SOL for USDC
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js swap sell --amount 0.5
```

## Perpetual Commands

```bash
# List open positions
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps list

# Open long position
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps open-long --collateral 10 --leverage 5

# Open short position
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps open-short --collateral 10 --leverage 3

# Close position
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps close --position <address>

# Check PnL
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps pnl
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--wallet-path` | Override WALLET_PATH | env var |
| `--rpc-url` | Override RPC_URL | env var |
| `--slippage` | Slippage BPS | 50 (0.5%) |
