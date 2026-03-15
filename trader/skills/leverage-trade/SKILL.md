---
name: leverage-trade
description: >
  Runs a full SOL market analysis then executes a leveraged long or short
  position on Jupiter Perpetuals in one workflow. Use when asked to "trade
  based on analysis", "open a leveraged trade", "analyze and trade SOL",
  "run a signal and open a position", or "do a leverage trade".
metadata:
  author: hunzai
  version: 1.0.0
---

# Leverage Trade

Analyze the SOL market with four price-CLI commands, synthesize a LONG/SHORT/WAIT
signal, then optionally open a Jupiter Perpetuals position — all in one workflow.

## CRITICAL: Safety rules (never skip)

- ALWAYS show the full recommendation and wait for explicit user confirmation
  before opening any position.
- NEVER open a position when the signal is WAIT or confidence < 0.40.
- NEVER use leverage above 10x.
- If WALLET_PATH or RPC_URL is unset, stop immediately and tell the user.
- Default collateral: **2 USDC** (micro-trade safe). Use user-specified amount
  if provided.
- Only enter when price is within **0.5% of a key level** (support for LONG,
  resistance for SHORT) for micro-trades ≤ 2 USDC.

---

## Quick Start

```bash
# User says: "analyze and trade SOL"
# Run steps 1–4 in parallel, then proceed to step 5.
```

---

## Workflow

### Step 1: Pre-flight check

```bash
echo "WALLET: ${WALLET_PATH:-NOT SET}" && echo "RPC: ${RPC_URL:-NOT SET}"
```

If either is `NOT SET`, stop and ask the user to set the missing env vars.

### Step 2: Run analysis in parallel (4 commands simultaneously)

```bash
# Signal: RSI, MACD, Bollinger, EMA crossover, Volume (2hr window)
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js signal sol 120

# Key levels: pivot points, S/R, swing highs/lows, EMA
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js levels sol

# Sentiment: Fear & Greed + market cap trend
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js sentiment

# Keep price history fresh
node ${CLAUDE_PLUGIN_ROOT}/vendor/price/dist/cli.js fetch /tmp/sol_price.txt
```

### Step 3: Check portfolio state in parallel

```bash
# Wallet balances
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js swap balance

# Open perpetual positions
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps list
```

### Step 4: Synthesize signal

Use this decision table:

| Condition | Action |
|-----------|--------|
| confidence ≥ 0.60, prediction = bullish, ≥3 bullish indicators | LONG |
| confidence ≥ 0.60, prediction = bearish, ≥3 bearish indicators | SHORT |
| existing position matches signal direction | HOLD (no new position) |
| existing position is opposite direction | report conflict, ask user |
| confidence < 0.40 or indicators conflict | WAIT — do not trade |
| price not within 0.5% of key level (micro-trade) | WAIT — wait for better entry |

### Step 5: Present recommendation

Always output this block before asking for confirmation:

```
--- Analysis: [date/time UTC] ---

SIGNAL: LONG / SHORT / WAIT
Confidence: HIGH (≥0.60) / MEDIUM (0.40–0.59) / LOW (<0.40) [raw value]

Indicators:
  RSI [value]: [overbought/oversold/neutral]
  MACD [histogram]: [bullish/bearish/flat]
  Bollinger: [above_upper/below_lower/inside]
  EMA crossover: [fast>slow LONG / fast<slow SHORT / flat]
  Volume: [Nx avg — strong/weak]

Key levels:
  Resistance: $X.XX
  Current:    $X.XX
  Support:    $X.XX
  Pivot:      $X.XX

Trade plan:
  Side:       LONG / SHORT
  Collateral: $X.XX USDC
  Leverage:   Xx
  Entry:      $X.XX – $X.XX
  Target:     $X.XX ([level name])
  Stop:       $X.XX ([level name])
  R:R:        X.X:1

Wallet: X.XX USDC free | [N open positions]

Sentiment: F&G [value]/100 [label] — [contrarian implication]

Proceed? (yes / no)
```

### Step 6: On user confirmation

Open the position:

```bash
# LONG
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps open-long \
  --collateral <amount> --leverage <leverage>

# SHORT
node ${CLAUDE_PLUGIN_ROOT}/vendor/jupiter/dist/cli.js perps open-short \
  --collateral <amount> --leverage <leverage>
```

After execution, show the JSON output and summarise:
- Side, collateral, leverage, transaction signature
- Remind user to monitor PnL with: `perps pnl --position-pubkey <pk> --current-price <price>`

---

## Collateral & leverage defaults

| Scenario | Collateral | Leverage |
|----------|-----------|----------|
| Not specified by user | 2 USDC | 2x |
| User specifies collateral only | user value | 2x |
| User specifies both | user values | user values |

Never exceed 10x leverage without a second explicit risk warning.

---

## Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `WALLET_PATH required` | Env var missing | Set `WALLET_PATH` in `.env` |
| `RPC_URL required` | Env var missing | Set `RPC_URL` in `.env` |
| `Insufficient price data` | Price file empty | `fetch` ran — retry `signal` |
| `success: false` on open | On-chain error | Show `error` field, do not retry silently |
| WAIT signal | Low confidence or no key level nearby | Report reason, do not open position |

---

## References

- [jupiter-cli SKILL.md](../jupiter-cli/SKILL.md) — full Jupiter + price CLI reference
