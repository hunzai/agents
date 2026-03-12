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
export COINGECKO_API_KEY="..."   # for higher rate limits on price history and signal volume analysis
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

### Price Signal Analysis

Before making trades, use the `signal` command to analyze technical indicators (RSI, MACD, Bollinger Bands, Volume) and get a weighted prediction:

```bash
# Analyze SOL with default 120-minute window
cd vendor/price && node dist/cli.js signal

# Analyze ETH over 240 minutes
cd vendor/price && node dist/cli.js signal eth 240

# Analyze BTC over 60 minutes
cd vendor/price && node dist/cli.js signal btc 60
```

Example output:

```json
{
  "success": true,
  "symbol": "SOL",
  "current_price": 145.23,
  "timestamp": "2026-03-12T10:00:00Z",
  "prediction": "bullish",
  "confidence": 0.68,
  "signals": {
    "rsi": { "value": 38.2, "signal": "oversold", "weight": 0.25 },
    "macd": { "macd": -0.45, "signal_line": -0.23, "histogram": -0.22, "signal": "bullish", "weight": 0.3 },
    "bollinger": { "upper": 152.1, "middle": 145.0, "lower": 137.9, "position": "below_middle", "signal": "neutral", "weight": 0.25 },
    "volume": { "current_volume": 1234567890, "avg_volume": 987654321, "ratio": 1.25, "signal": "high", "weight": 0.2 }
  },
  "data_points": 120,
  "minutes": 120
}
```

Use this analysis to inform your trading decisions:
- **Prediction**: `bullish`, `bearish`, or `neutral` based on weighted indicator scoring
- **Confidence**: 0-1 score indicating signal strength
- **Individual signals**: Each indicator (RSI, MACD, Bollinger, Volume) with its own prediction and weight

Example workflow:
```bash
# Check SOL signal before entering a position
cd vendor/price && node dist/cli.js signal sol 120

# If prediction is "bullish" with confidence > 0.6, consider opening a long position
# Use jupiter-trader agent to execute the trade
```

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
