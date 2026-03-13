---
name: price-cli
description: >
  Solana price CLI reference. Use this skill when fetching real-time prices
  from Pyth Network, storing price history to a file, analyzing price movements
  (min/max/trend), running RSI/MACD/Bollinger/Volume signals, or retrieving
  CoinGecko historical market data.
---

# Price CLI Reference

**Binary:** `node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js <command>`

All commands output JSON to stdout. Informational logs go to stderr.
Exit code 0 = success, exit code 1 = error.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COINGECKO_API_KEY` | No | — | Demo API key for higher rate limits |
| `PRICE_HISTORY_FILE` | No | — | Default path for `fetch` and `analysis` commands |

---

## fetch — Append current price to a file

Fetches the current SOL/USD price from **Pyth Network** (Hermes API) and appends
one line to a local CSV file. Falls back to CoinGecko if Pyth is unavailable.

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js fetch <output-path>
```

With options:
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js fetch <output-path> \
  [--source pyth|gecko] \
  [--feed <pyth-feed-id>] \
  [--coin <coingecko-coin-id>]
```

**Options:**

| Flag | Default | Description |
|------|---------|-------------|
| `--source pyth\|gecko` | `pyth` | Primary price source; falls back to the other |
| `--feed <id>` | SOL/USD feed | Pyth Network feed ID |
| `--coin <id>` | `solana` | CoinGecko coin ID (used when source is gecko) |

**Output:**
```json
{
  "success": true,
  "price": 145.231847,
  "epoch": 1709500000,
  "timestamp": "2024-03-03T20:26:40.000Z",
  "source": "pyth",
  "outputPath": "/tmp/sol_price.txt",
  "line": "1709500000,2024-03-03T20:26:40.000Z,145.231847"
}
```

**File format** (one entry appended per call):
```
1709500000,2024-03-03T20:26:40.000Z,145.231847
1709500060,2024-03-03T20:27:40.000Z,145.418200
1709500120,2024-03-03T20:28:40.000Z,145.123456
```

**Pyth feed IDs:**

| Asset | Feed ID |
|-------|---------|
| SOL/USD | `0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d` |
| BTC/USD | `0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` |
| ETH/USD | `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` |

---

## analysis — Analyze local price history

Reads the price history file and computes min, max, trend, and sampled price
points over the last N minutes. **No API calls.**

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js analysis <path> [minutes]
```

`minutes` defaults to 60, max 43200 (30 days).

**Output:**
```json
{
  "success": true,
  "source": "file",
  "current": 145.23,
  "min": 143.10,
  "max": 147.80,
  "diff_from_max": -2.57,
  "diff_from_min": 2.13,
  "pct_dip_from_max": 1.7olean,
  "pct_high_from_min": 1.489,
  "trend": "bearish",
  "sample_interval_minutes": 5,
  "sampled_prices": [
    { "epoch": 1709496400, "timestamp": "2024-03-03T19:20:00.000Z", "price": 147.80 },
    { "epoch": 1709496700, "timestamp": "2024-03-03T19:25:00.000Z", "price": 146.50 }
  ],
  "minutes": 60,
  "historyPath": "/tmp/sol_price.txt"
}
```

**trend values:** `"bullish"` | `"bearish"` | `"flat"` (flat = within ±0.5% of window open)

**sample_interval_minutes:** 5 (≤120 min window) · 10 (≤720 min) · 60 (>720 min)

---

## historical — CoinGecko historical OHLCV

Fetches historical prices, market caps, and volumes from CoinGecko.

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js historical [coinId] [days]
```

`coinId` defaults to `solana`. `days` defaults to 1, max 365.

**Output:**
```json
{
  "success": true,
  "coinId": "solana",
  "days": 7,
  "prices": [[1709500000000, 145.23], [1709503600000, 146.10]],
  "market_caps": [[1709500000000, 63200000000], ...],
  "total_volumes": [[1709500000000, 1820000000], ...]
}
```

Each array entry is `[timestamp_ms, value_usd]`.

---

## signal — RSI/MACD/Bollinger/Volume composite

Fetches live price data from Pyth Network + CoinGecko volume, runs four technical
indicators, and returns a weighted composite prediction.

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js signal [symbol] [minutes]
```

`symbol`: `sol` (default) | `btc` | `eth`
`minutes`: look-back window 35–1440 (default: 120). MACD requires ≥35 data points.

**Output:**
```json
{
  "success": true,
  "symbol": "SOL",
  "current_price": 145.23,
  "timestamp": "2024-03-03T20:26:40.000Z",
  "prediction": "bullish",
  "confidence": 0.62,
  "signals": {
    "rsi":       { "value": 28.4,  "signal": "oversold",  "weight": 0.25 },
    "macd":      { "macd": 0.42,   "signal_line": 0.18, "histogram": 0.24, "signal": "bullish", "weight": 0.3 },
    "bollinger": { "upper": 148.1, "middle": 144.5, "lower": 140.9, "position": "below_lower", "signal": "bullish", "weight": 0.25 },
    "volume":    { "current_volume": 1820000000, "avg_volume": 1200000000, "ratio": 1.52, "signal": "high", "weight": 0.2 }
  },
  "data_points": 121,
  "minutes": 120
}
```

**prediction values:** `"bullish"` | `"bearish"` | `"neutral"`

**confidence:** 0–1 (absolute normalized weighted score across all indicators)

**Indicator weights:** MACD 30% · RSI 25% · Bollinger 25% · Volume 20%

---

## Common workflows

### Build a price history file (call once per minute via cron or loop)
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js fetch /tmp/sol_price.txt
```

### Analyze the last hour
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js analysis /tmp/sol_price.txt 60
```

### Analyze the last 24 hours
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js analysis /tmp/sol_price.txt 1440
```

### Get 7-day historical chart for Bitcoin
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js historical bitcoin 7
```

### Run composite signal for SOL (2-hour window)
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js signal sol 120
```

### Run composite signal for BTC (4-hour window)
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js signal btc 240
```
