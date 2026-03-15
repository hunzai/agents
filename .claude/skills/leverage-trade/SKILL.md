---
name: leverage-trade
description: >
  Analyze SOL market and execute leveraged trades on Jupiter Perpetuals.
  Runs signal, levels, sentiment, and historical analysis then opens/closes
  positions with user confirmation. Use when asked to trade, analyze and
  trade SOL, open a leveraged position, or run the trading workflow.
disable-model-invocation: true
argument-hint: [collateral] [leverage]
allowed-tools: Bash(*)
context: fork
---

# Leverage Trade

Market analysis → trade decision → execution → record keeping.
Uses price plugin CLIs for analysis and trader plugin CLIs for execution.

## Safety rules (cannot be overridden)

- Always confirm with user before any on-chain transaction.
- Never trade when confidence < 0.40 or signal agreement <= 2/5.
- Never exceed 10x leverage. Default: 2 USDC collateral, 2x leverage.
- Stop if WALLET_PATH or RPC_URL is missing.
- Never re-send a transaction if a signature was returned.
- Never hallucinate prices — use only CLI output.

---

## Steps

### Step 1: Environment check

```bash
echo "WALLET: ${WALLET_PATH:-NOT SET}" && echo "RPC: ${RPC_URL:-NOT SET}"
```

If either is NOT SET, stop and tell user which to add to `.env`.

### Step 2: Market analysis (run all in parallel)

```bash
node price/vendor/price/dist/cli.js signal sol 120
node price/vendor/price/dist/cli.js levels sol
node price/vendor/price/dist/cli.js sentiment
node price/vendor/price/dist/cli.js fetch /tmp/sol_price.txt
node price/vendor/price/dist/cli.js historical solana 1
node trader/vendor/jupiter/dist/cli.js swap balance
node trader/vendor/jupiter/dist/cli.js perps list
```

### Step 3: Portfolio check

For each open position from `perps list`:

```bash
node trader/vendor/jupiter/dist/cli.js perps pnl \
  --position-pubkey <pubkey> --current-price <price>
```

Triggers:
- Take profit: PnL reached target from history record.
- Stop loss: LONG down >3% or SHORT up >3% from entry, or liquidation within 5%.
- Conflict: open position opposite to new signal — flag it, do not stack.

### Step 4: Synthesize decision

Produce one structured recommendation:

```
ACTION:      OPEN LONG / OPEN SHORT / TAKE PROFIT / CLOSE / HOLD / WAIT
Confidence:  HIGH (>=0.75) / MEDIUM (0.50-0.74) / LOW (<0.50)
Agreement:   X/5 [direction]

Price:       $X.XX
Entry zone:  $X.XX - $X.XX
Target:      $X.XX (level name)
Stop:        $X.XX (level name)
R:R:         X.X:1
Collateral:  X USDC
Leverage:    Xx

Indicators:  RSI / MACD / Bollinger / EMA / Volume — each with value and reading
Levels:      Resistance / Current / Support / Position (near_resistance/near_support/midrange)
Sentiment:   F&G XX/100, BTC dominance, market cap 24h, bias
Wallet:      X.XX USDC free | N open positions
```

Entry quality: only enter when price is within 0.5% of a key level.
Thin volume (<50% of 24h avg) raises confidence threshold to 0.75.

Leverage selection:
- HIGH confidence + R:R >= 3:1 + 4/5 agreement → 5x
- HIGH + R:R >= 2:1 + 3/5 → 3x
- MEDIUM → 2x
- LOW or R:R < 1.5:1 → WAIT

### Step 5: Confirm and execute

Show summary, ask `Confirm? (yes / no)`. On yes:

```bash
# LONG
node trader/vendor/jupiter/dist/cli.js perps open-long \
  --collateral <amount> --leverage <N>

# SHORT
node trader/vendor/jupiter/dist/cli.js perps open-short \
  --collateral <amount> --leverage <N>

# CLOSE (always run pnl first)
node trader/vendor/jupiter/dist/cli.js perps pnl \
  --position-pubkey <pk> --current-price <price>
node trader/vendor/jupiter/dist/cli.js perps close \
  --position-pubkey <pk>
```

On WAIT/HOLD: explain why and what to watch.

### Step 6: Record keeping

Write JSON to `history/YYYY-MM-DDTHH-MM-SS-[action].json`:

Open record fields: timestamp, action, symbol, side, collateral_usd, leverage,
entry_price, target_price, stop_price, rr_ratio, position_pubkey, tx_signature,
confidence, signal_agreement, indicators (rsi, macd_histogram, bollinger,
ema_crossover, volume_vs_avg), sentiment (fear_greed, classification,
btc_dominance_pct, market_cap_change_24h_pct, bias), levels (nearest_resistance,
nearest_support, pivot, ema20, ema50), notes.

Close record fields: timestamp, action, reason, symbol, side, position_pubkey,
tx_signature, entry_price, close_price, collateral_usd, leverage, pnl_usd,
pnl_pct, close_fee_usd, borrow_fee_usd, net_pnl_usd, duration_minutes,
linked_open_file.

Only write on success: true. On failure, report error and stop.

---

## Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `WALLET_PATH required` | Env var missing | Add to `.env` |
| `RPC_URL required` | Env var missing | Add to `.env` |
| `Insufficient price data` | Price file empty | Re-run `fetch` then `signal` |
| `success: false` on open/close | On-chain error | Show error field, do not retry |
| WAIT signal | Low confidence or no key level | Report reason, do not trade |
