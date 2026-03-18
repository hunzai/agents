---
description: >
  Real-time SOL/USD price, technical signals (RSI/MACD/Bollinger), support/resistance levels, sentiment.
  Use when asked about SOL price, market signals, or market sentiment.
allowed-tools: Bash(*)
---

# Solana Price CLI Reference

**Binary:** `node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js <command>`

All commands output JSON to stdout. Build first: `bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh`

## Commands

| Command | Purpose |
|---------|---------|
| `fetch <path>` | Append current SOL/USD price to a CSV file |
| `analysis <path> [minutes]` | Analyze local price history (min/max/trend) |
| `historical [coinId] [days]` | CoinGecko OHLCV data |
| `signal [symbol] [minutes]` | RSI/MACD/Bollinger/EMA/Volume composite |
| `levels [symbol]` | Pivot points, S/R levels, swing highs/lows |
| `sentiment` | Fear & Greed index + global market stats |
| `stats [coinId] [days]` | 24h price and volume statistics |

## Common workflows

### Full trade signal (run in parallel)

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js signal sol 120
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js levels sol
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js sentiment
```

### Track price over time

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js fetch /tmp/sol_price.txt
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js analysis /tmp/sol_price.txt 240
```
