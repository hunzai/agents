---
name: leverage-trade
description: >
  Adaptive SOL leverage trading on Jupiter Perpetuals. Uses local highs/lows,
  trend structure, and tiered take-profit to capture moves. Default 5x
  leverage with wide structural stops. Use when asked to trade, analyze SOL,
  open a leveraged position, or run the trading workflow.
disable-model-invocation: true
argument-hint: [collateral] [leverage]
allowed-tools: Bash(*)
context: fork
---

# Adaptive Leverage Trade

Market scan → structure analysis → enter → ride → exit at target → record.
Uses price plugin CLIs for analysis and trader plugin CLIs for execution.

## Safety rules

- Auto-execute trades when setup conditions are met — no confirmation needed.
- Never exceed 10x leverage. Default: 2 USDC collateral, 5x leverage.
- Stop if WALLET_PATH or RPC_URL is missing.
- Never re-send a transaction if a signature was returned.
- Never hallucinate prices — use only CLI output.
- Volume ratio < 0.5 (thin market) → WAIT regardless of setup.

With 5x on 2 USDC the position size is $10. Liquidation is ~18% away from
entry — a very large buffer. Stops are structural, not tight. Let trades
breathe. Do not exit early from noise.

---

## Steps

### Step 1: Environment check

```bash
echo "WALLET: ${WALLET_PATH:-NOT SET}" && echo "RPC: ${RPC_URL:-NOT SET}"
```

If either is NOT SET, stop and tell user which to add to `.env`.

### Step 2: Full market scan (run all in parallel)

```bash
node price/vendor/price/dist/cli.js signal sol 120
node price/vendor/price/dist/cli.js levels sol
node price/vendor/price/dist/cli.js sentiment
node price/vendor/price/dist/cli.js stats solana 1 --last 12
node price/vendor/price/dist/cli.js fetch /tmp/sol_price.txt
node price/vendor/price/dist/cli.js analysis /tmp/sol_price.txt 240
node price/vendor/price/dist/cli.js historical solana 1
node trader/vendor/jupiter/dist/cli.js swap balance
node trader/vendor/jupiter/dist/cli.js perps list
```

### Step 3: Build the local price map

From the combined output, construct a mental price map:

```
Local structure (from levels + stats + analysis):
  Swing high:     stats.last_candles.swing_high OR levels.local_highs[0]
  Swing low:      stats.last_candles.swing_low  OR levels.local_lows[0]
  24h range:      stats.high - stats.low
  Volatility:     (24h range / stats.close) * 100 → volPct
  Dip from max:   analysis.pct_dip_from_max
  Rally from min: analysis.pct_high_from_min
  Trend:          analysis.trend (bullish/bearish/flat)
  Volume health:  stats.volume_ratio (>1.0 = strong, <0.5 = thin)

Key levels (sorted, from levels output):
  R3 > R2 > R1 > SwingHigh > Pivot > SwingLow > S1 > S2 > S3
  EMA20, EMA50 (trend confirmation)
```

### Step 4: Review trade history

```bash
ls -t history/*.json 2>/dev/null | head -5
```

Read last 3-5 records. Look for patterns in losses. If the last 3 trades
were all losses on the same side, skip that side this run.

### Step 5: Identify trade opportunity

Each setup below has its own structural conditions. When ALL conditions for
a setup are met, the trade is valid — execute it. The composite confidence
score from `signal` is informational context, NOT a gate. The setup rules
already check RSI, MACD, levels, and volume directly.

The only hard blocks are:
- Volume ratio < 0.5 (thin market) → WAIT
- No setup conditions fully met → WAIT

Apply these rules in order. Take the FIRST match:

**A. Dip buy (buy the pullback to support):**
- Price has dipped 1.5%+ from recent high (analysis.pct_dip_from_max >= 1.5)
- Price is within 1% of a support level (S1, S2, pivot, swing low, or EMA20)
- RSI < 55 (momentum has cooled)
- Trend is not strongly bearish (analysis.trend != bearish, OR if bearish
  then RSI < 30 which signals oversold bounce)
- Action: OPEN LONG at market

**B. Breakout long (ride the momentum):**
- Price crossed above swing high or R1 (within 0.5%)
- Volume ratio > 0.8 (enough participation)
- EMA20 > EMA50 (uptrend structure)
- Action: OPEN LONG at market

**C. Trend continuation long (buy the trend dip):**
- EMA20 > EMA50 (confirmed uptrend)
- Price pulled back to within 0.5% of EMA20 from above
- RSI between 40 and 65 (cooled but not bearish)
- MACD histogram > 0 or signal line trending up
- Action: OPEN LONG at market

**D. Overbought short (mean reversion at resistance):**
- Price rallied 3%+ from local low (analysis.pct_high_from_min >= 3.0 OR
  24h change from stats shows 3%+ gain)
- Price is within 1% of a resistance level (R1, R2, swing high, or 24h high)
- RSI > 70 (overbought)
- Action: OPEN SHORT at market
- Note: do NOT require volume to fade. Strong rallies carry volume. The
  edge is RSI extreme + resistance confluence, not volume exhaustion.

**E. Breakdown short (ride the drop):**
- Price broke below swing low or S1 (within 0.5%)
- Volume ratio > 0.8 (enough participation)
- EMA20 < EMA50 (downtrend structure)
- Action: OPEN SHORT at market

**F. No edge → WAIT:**
- Price in midrange with no level proximity
- Volume ratio < 0.5 (thin market)
- No setup conditions fully met
- Action: WAIT. Report what to watch for.

### Step 6: Set levels

**Entry:** At market when setup conditions are met. Do not wait for a
perfect level when the setup is already valid — chasing precision costs
opportunity.

**Stop loss (wide, structural — let trades breathe):**
At 5x leverage, liquidation is ~18% from entry. Stops should use major
structural levels, not the nearest swing:

- LONG stop: below S1 or the nearest major support that gives at least
  2% room. Use S2 if S1 is too close. Never tighter than 2%.
- SHORT stop: above R1 or the nearest major resistance that gives at least
  2% room. Use R2 if R1 is too close. Never tighter than 2%.
- Absolute max stop width: 6% (still far from 18% liquidation).
- If no structural level exists within 2-6%, use 3% flat.

**Take profit (tiered):**
- TP1 (50% of position): nearest resistance (long) or support (short)
- TP2 (remaining 50%): next level beyond TP1
- After TP1 is hit: move stop to entry price (breakeven). The remaining
  50% now rides risk-free toward TP2.

**R:R minimum:** R:R must be >= 1.2:1 for TP1. With wide stops and 5x,
even modest R:R turns profitable over many trades.

### Step 7: Leverage selection

Default is 5x. Adjust only in extreme conditions:

```
volPct = ((stats.high - stats.low) / stats.close) * 100

Normal conditions (volPct < 6%):   5x (default)
Extreme volatility (volPct >= 6%): 3x

Exception: if user specifies a leverage in the prompt, use that instead.
```

At 5x with 2 USDC:
- Position size: $10
- Liquidation (long): ~18% below entry
- Liquidation (short): ~18% above entry
- A 3% stop loss = $0.30 risk. A 3% gain at TP1 = $0.30 profit. Wins
  compound quickly at 5x without meaningful liquidation risk.

### Step 8: Synthesize decision

Produce one structured block:

```
ACTION:      OPEN LONG / OPEN SHORT / CLOSE / HOLD / WAIT
Setup:       Dip buy / Breakout / Trend continuation / Mean reversion / Breakdown
Price:       $X.XX

Entry:       $X.XX (at market)
Stop:        $X.XX (level name) — X.X% risk
TP1:         $X.XX (level name, 50%) — X.X% reward
TP2:         $X.XX (level name, 50%) — X.X% reward
R:R (TP1):   X.X:1
Collateral:  X USDC
Leverage:    Xx

Indicators:  RSI / MACD / Bollinger / EMA / Volume — value and reading
Levels:      swing highs / swing lows / nearest R / nearest S / pivot
Sentiment:   F&G XX/100, trend, bias
Volatility:  volPct X.X%, 24h range $X.XX-$X.XX
Wallet:      X.XX USDC free | N open positions
```

### Step 9: Manage open positions

For each open position from `perps list`, check PnL:

```bash
node trader/vendor/jupiter/dist/cli.js perps pnl \
  --position-pubkey <pubkey> --current-price <price>
```

**When to hold (let it ride):**
- Position is profitable but hasn't reached TP1 → hold, keep stop
- Position is slightly negative but above stop → hold, the wide stop
  exists for a reason. Do not panic-close on small drawdowns.
- Borrow fees on a $10 position are negligible — time is not the enemy.

**When to take profit:**
- Price reached TP1 → close 50%. Move stop on remainder to entry.
- Price reached TP2 → close everything.
- If position is in profit and a new signal appears in the OPPOSITE
  direction with a valid setup → close the position and open the new one.

**When to close at a loss:**
- Price hit stop level → close. No averaging down, no hoping.
- Liquidation within 8% of current price → close (something went wrong).
- New signal in the opposite direction with a valid setup → close and flip.

**Stacking rule:** one position at a time. Close before opening a new one.

### Step 10: Execute

Log the summary then execute immediately:

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

On WAIT/HOLD: log what you are watching for and at what price. Do not
execute any transaction.

### Step 11: Record keeping

Write JSON to `history/YYYY-MM-DDTHH-MM-SS-[action].json`:

Open record fields: timestamp, action, setup_type (dip_buy/breakout/
trend_continuation/mean_reversion/breakdown), symbol, side, collateral_usd,
leverage, entry_price, stop_price, tp1_price, tp2_price, rr_ratio,
position_pubkey, tx_signature, volatility_pct, volume_ratio,
indicators (rsi, macd_histogram, bollinger, ema_crossover, volume_vs_avg),
sentiment (fear_greed, classification, btc_dominance_pct,
market_cap_change_24h_pct, bias), levels (nearest_resistance,
nearest_support, pivot, swing_high, swing_low, ema20, ema50), notes.

Close record fields: timestamp, action, reason (tp1/tp2/stop/manual/
flip/conflict), symbol, side, position_pubkey, tx_signature,
entry_price, close_price, collateral_usd, leverage, pnl_usd, pnl_pct,
close_fee_usd, borrow_fee_usd, net_pnl_usd, duration_minutes,
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
| WAIT signal | No setup matched or thin market | Report reason, do not trade |
