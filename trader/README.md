# Trader — Solana Trading Agent

A Claude Code plugin that gives you a disciplined Solana trading agent powered by
Jupiter Perpetuals and Jupiter Aggregator.

## What It Does

- Execute SOL/USDC spot swaps via Jupiter Aggregator v6
- Open and close leveraged perpetual positions via Jupiter Perps
- Check wallet balances, get quotes, and monitor PnL
- Always confirms before submitting on-chain transactions

## Prerequisites

- Node.js 18+ and npm (required to build vendor CLIs on first run)
- A Solana wallet keypair JSON file
- A Solana RPC endpoint (e.g. Helius, QuickNode, or mainnet-beta public)
- Claude Code 1.0.33+

## Environment Variables

Set these in your shell before starting Claude Code:

```bash
export WALLET_PATH="/absolute/path/to/your/keypair.json"
export RPC_URL="https://your-rpc-endpoint.com"

# Optional
export JUPITER_API_KEY="your-jupiter-paid-api-key"
export SLIPPAGE_BPS=50           # 0.5% default
export COINGECKO_API_KEY="..."   # for higher rate limits on price history
```

Two keypair formats are supported:

```json
[0, 1, 2, ...63 bytes...]
```

Standard Solana CLI format (e.g. `solana-keygen new -o wallet.json`). Or the object format:

```json
{ "publicKey": "YourBase58PublicKey", "secretKey": [0, 1, 2, ...63 bytes...] }
```

## Installation

### Development (local)

```bash
export WALLET_PATH="/path/to/keypair.json"
export RPC_URL="https://your-rpc-endpoint.com"
claude --plugin-dir /home/hunzai/projects/ai/trader
```

### From GitHub

```bash
# In a Claude Code session
/plugin marketplace add github.com/hunzai/trader
/plugin install trader@hunzai
```

#### What happens on first use

The `vendor/dist/` directories are not committed to git. On the first agent
start, the `setup.sh` hook detects the missing `dist/` directories and
automatically builds all three vendor packages (`common` → `jupiter` → `price`).
This takes about 20–30 seconds and only happens once. Every subsequent start is
instant.

Build order is handled automatically: `common` is compiled first since `jupiter`
depends on it.

## Usage

Start Claude Code and ask the `jupiter-trader` agent directly:

```
Use the jupiter-trader agent to check my balance
Open a 2x long position with $50 collateral
Sell 0.5 SOL for USDC
What are my open positions?
Close position AbCd...1234
```

Or trigger it in any conversation — the agent description is broad enough that
Claude will delegate automatically when trading intent is detected.

## Project Structure

```
trader/
├── .claude-plugin/plugin.json   # Plugin manifest (name: trader)
├── hooks/hooks.json             # SubagentStart hook → scripts/setup.sh
├── scripts/setup.sh             # Idempotent build script for vendor CLIs
├── vendor/
│   ├── common/                  # Shared Solana utilities (wallet loader, config)
│   ├── jupiter/                 # Jupiter swap + perps CLI
│   └── price/                   # CoinGecko + local price analysis CLI
├── skills/
│   └── jupiter-cli/SKILL.md     # Full CLI reference injected into agent context
└── agents/
    └── jupiter-trader.md        # Trading agent definition
```

`vendor/*/dist/` and `vendor/*/node_modules/` are gitignored — rebuilt
automatically by `setup.sh` on first agent start.

## Rebuilding Vendor CLIs

If you modify vendor source code, rebuild manually:

```bash
cd /home/hunzai/projects/ai/trader
cd vendor/common  && npm run build
cd ../jupiter     && npm run build
cd ../price       && npm run build
```

Or delete any `dist/` directory and restart the agent — `setup.sh` will rebuild it.

## Security

- The agent always shows a confirmation summary before any on-chain transaction.
- Never share your `WALLET_PATH` or keypair file contents.
- `.env` is gitignored — never commit API keys or wallet paths.
- Use a dedicated trading wallet with only the funds you intend to trade.
