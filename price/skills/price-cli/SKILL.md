---
name: price-cli
description: >
  Solana price CLI reference. Use this skill when fetching real-time prices
  from Pyth Network, storing price history, analyzing movements (min/max/trend),
  running RSI/MACD/Bollinger/EMA/Volume signals, computing pivot-point S/R levels,
  detecting swing highs/lows, or fetching Fear & Greed sentiment data.
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
  "price": 88.42,
  "epoch": 1709500000,
  "timestamp": "2026-03-15T11:00:00.000Z",
  "source": "pyth",
  "outputPath": "/tmp/sol_price.txt",
  "line": "1709500000,2026-03-15T11:00:00.000Z,88.42"
}
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
  "current": 88.42,
  "min": 86.72,
  "max": 88.77,
  "diff_from_max": -0.35,
  "diff_from_min": 1.70,
  "pct_dip_from_max": 0.394,
  "pct_high_from_min": 2.017,
  "trend": "bullish",
  "sample_interval_minutes": 5,
  "sampled_prices": [
    { "epoch": 1709496400, "price": 86.72 },
    { "epoch": 1709496700, "price": 87.50 }
  ],
  "minutes": 60,
  "historyPath": "/tmp/sol_price.txt"
}
```

**trend values:** `"bullish"` | `"bearish"` | `"flat"` (flat = within ±0.5%)

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
  "days": 1,
  "prices": [[1709500000000, 88.42], ...],
  "market_caps": [[1709500000000, 38200000000], ...],
  "total_volumes": [[1709500000000, 1820000000], ...]
}
```

---

## signal — RSI/MACD/Bollinger/EMA/Volume composite

Fetches live price data from Pyth Network + CoinGecko volume, runs five technical
indicators, and returns a weighted composite prediction.

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js signal [symbol] [minutes]
```

`symbol`: `sol` (default) | `btc` | `eth`
`minutes`: look-back window 35–1440 (default: 120).

**Indicator weights:** MACD 28% · RSI 22% · Bollinger 22% · Volume 15% · EMA crossover 13%

**Output:**
```json
{
  "success": true,
  "symbol": "SOL",
  "current_price": 88.42,
  "timestamp": "2026-03-15T11:00:00.000Z",
  "prediction": "bearish",
  "confidence": 0.72,
  "signals": {
    "rsi":       { "value": 99.7,  "signal": "overbought", "weight": 0.22 },
    "macd":      { "macd": -0.09,  "signal_line": -0.02, "histogram": -0.08, "signal": "bearish", "weight": 0.28 },
    "bollinger": { "upper": 87.88, "middle": 87.07, "lower": 86.26, "position": "above_upper", "signal": "bearish", "weight": 0.22 },
    "volume":    { "current_volume": 1830000000, "avg_volume": 2360000000, "ratio": 0.78, "signal": "normal", "weight": 0.15 },
    "ema_crossover": { "fast_ema": 88.10, "slow_ema": 87.45, "gap_pct": 0.74, "signal": "bullish", "weight": 0.13 }
  },
  "data_points": 121,
  "minutes": 120
}
```

**prediction values:** `"bullish"` | `"bearish"` | `"neutral"`
**confidence:** 0–1 (higher = stronger signal agreement)

---

## levels — Pivot points, S/R levels, swing highs/lows

Derives key price levels from CoinGecko 24hr hourly data using standard pivot point
formula. Also detects recent swing highs/lows and EMA levels.

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js levels [symbol]
```

`symbol`: `sol` (default) | `btc` | `eth`

**Output:**
```json
{
  "success": true,
  "symbol": "SOL",
  "current_price": 88.42,
  "timestamp": "2026-03-15T11:00:00.000Z",
  "h24_high": 88.77,
  "h24_low": 86.72,
  "h24_close": 88.42,
  "pivot": 87.97,
  "r1": 89.22,
  "r2": 90.02,
  "r3": 91.27,
  "s1": 86.72,
  "s2": 85.92,
  "s3": 84.67,
  "ema20": 87.65,
  "ema50": 87.12,
  "local_highs": [88.77, 88.20],
  "local_lows": [86.72, 87.10],
  "position": "near_resistance",
  "nearest_resistance": 89.22,
  "nearest_support": 87.97,
  "levels": [
    { "price": 91.27, "label": "R3", "type": "resistance", "distance_pct": 3.22 },
    { "price": 90.02, "label": "R2", "type": "resistance", "distance_pct": 1.81 },
    { "price": 89.22, "label": "R1", "type": "resistance", "distance_pct": 0.90 },
    { "price": 88.77, "label": "SwingHigh", "type": "resistance", "distance_pct": 0.40 },
    { "price": 87.97, "label": "Pivot", "type": "pivot", "distance_pct": -0.51 },
    ...
  ]
}
```

**position values:** `"near_resistance"` | `"near_support"` | `"midrange"`
(near = within 1% of a key level)

**Pivot formulas:**
- P = (H + L + C) / 3
- R1 = 2P − L, R2 = P + (H − L), R3 = H + 2(P − L)
- S1 = 2P − H, S2 = P − (H − L), S3 = L − 2(H − P)

---

## sentiment — Fear & Greed + global market data

Fetches the Crypto Fear & Greed Index (alternative.me) and CoinGecko global market stats.

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js sentiment
```

**Output:**
```json
{
  "success": true,
  "timestamp": "2026-03-15T11:00:00.000Z",
  "fear_greed": { "value": 15, "classification": "Extreme Fear", "timestamp": "..." },
  "fear_greed_yesterday": { "value": 18, "classification": "Extreme Fear", "timestamp": "..." },
  "fear_greed_trend": "worsening",
  "btc_dominance_pct": 58.4,
  "total_market_cap_usd": 2800000000000,
  "total_volume_24h_usd": 98000000000,
  "active_cryptocurrencies": 14200,
  "market_cap_change_24h_pct": 1.24,
  "sentiment_bias": "bullish",
  "summary": "Fear & Greed 15/100 (Extreme Fear), trending worsening, BTC dominance 58.4%, market cap +1.2% 24h. Sentiment bias: BULLISH."
}
```

**sentiment_bias:** contrarian-adjusted — Extreme Fear (<25) → `"bullish"`, Extreme Greed (>75) → `"bearish"`
**fear_greed_trend:** `"improving"` | `"worsening"` | `"stable"`

---

## Common workflows

### Full trade signal (run in parallel)
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js signal sol 120
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js levels sol
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js sentiment
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js fetch /tmp/sol_price.txt
```

### Get 24hr pivot levels for SOL
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js levels sol
```

### Check market sentiment
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js sentiment
```

### Analyze last 4 hours from local history
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js analysis /tmp/sol_price.txt 240
```

### 7-day historical chart for Bitcoin
```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js historical bitcoin 7
```
