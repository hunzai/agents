---
name: leverage-trade
description: >
  Adaptive SOL leverage trading on Jupiter Perpetuals. Uses local highs/lows,
  volatility-adjusted leverage, tiered take-profit, and trailing stops to
  maximize gains while protecting capital. Use when asked to trade, analyze
  SOL, open a leveraged position, or run the trading workflow.
disable-model-invocation: true
argument-hint: [collateral] [leverage]
allowed-tools: Bash(*)
context: fork
---

# Adaptive Leverage Trade

Market scan → local structure analysis → adaptive entry → tiered exit → record.
Uses price plugin CLIs for analysis and trader plugin CLIs for execution.

## Safety rules (cannot be overridden)

- Auto-execute trades when all conditions are met — no confirmation needed.
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
  Swing high:    stats.last_candles.swing_high  OR levels.local_highs[0]
  Swing low:     stats.last_candles.swing_low   OR levels.local_lows[0]
  24h range:     stats.high - stats.low
  Volatility:    (24h range / stats.close) * 100  → volPct
  Dip from max:  analysis.pct_dip_from_max
  Rally from min: analysis.pct_high_from_min
  Trend:         analysis.trend (bullish/bearish/flat)
  Volume health: stats.volume_ratio (>1.0 = strong, <0.5 = thin)

Key levels (sorted, from levels output):
  R3 > R2 > R1 > SwingHigh > Pivot > SwingLow > S1 > S2 > S3
  EMA20, EMA50 (trend confirmation)
```

### Step 4: Review trade history

```bash
ls -t history/*.json 2>/dev/null | head -5
```

Read the last 3-5 trade records. Look for:
- Patterns in losing trades (same side, same level, same time of day)
- Average win size vs average loss size (adjust targets accordingly)
- If the last 2+ trades were losses, raise confidence threshold to 0.60

### Step 5: Identify trade opportunity

Apply these rules in order. Take the FIRST match:

**A. Dip buy (highest edge):**
- analysis.trend = bullish OR flat
- analysis.pct_dip_from_max >= 2.0 (price has dipped 2%+ from recent high)
- Price is near a support level (within 1% of S1, S2, pivot, or swing low)
- RSI < 45 (not overbought)
- Signal prediction != bearish with confidence > 0.60
- Action: OPEN LONG. Target: nearest resistance. Stop: below swing low.

**B. Breakout long:**
- Price just crossed above swing high or R1 (within 0.3%)
- Volume ratio > 1.0 (breakout confirmed by volume)
- MACD histogram > 0 and increasing
- EMA20 > EMA50 (uptrend)
- Action: OPEN LONG. Target: next resistance up. Stop: below breakout level.

**C. Overbought short (mean reversion):**
- analysis.pct_high_from_min >= 3.0 (rallied 3%+ from local low)
- Price is near a resistance level (within 1% of R1, R2, or swing high)
- RSI > 70 (overbought)
- Volume ratio < 0.8 (rally losing steam)
- Action: OPEN SHORT. Target: nearest support. Stop: above swing high.

**D. Breakdown short:**
- Price just broke below swing low or S1 (within 0.3%)
- Volume ratio > 1.0 (breakdown confirmed)
- MACD histogram < 0 and decreasing
- EMA20 < EMA50 (downtrend)
- Action: OPEN SHORT. Target: next support down. Stop: above breakdown level.

**E. No edge → WAIT:**
- Price in midrange with no clear level proximity
- Conflicting signals (bearish signal + bullish sentiment or vice versa)
- Volume ratio < 0.5 (thin market — unreliable signals)
- Action: WAIT. Report what to watch for.

### Step 6: Set adaptive levels

**Entry:**
Place entry at the key level, not at current price. If price is 0.5%+ away
from the ideal level, report it as "wait for pullback to $X" rather than
chasing.

**Stop loss (structure-based, not percentage-based):**
- LONG stop: below the nearest swing low or support level — whichever is
  tighter but gives at least 1% room. Never wider than 4%.
- SHORT stop: above the nearest swing high or resistance level — same logic.
- If liquidation price is within 2% of stop → reduce leverage.

**Take profit (tiered):**
- TP1 (60% of position): nearest resistance (long) or support (short)
- TP2 (remaining 40%): next level beyond TP1
- After TP1 is hit: move stop to entry price (breakeven) and let TP2 run.

**Risk/reward minimum:** R:R must be >= 1.5:1 for TP1 alone. If not, WAIT.

### Step 7: Volatility-adjusted leverage

```
volPct = ((stats.high - stats.low) / stats.close) * 100

Low volatility  (volPct < 2%):   up to 5x allowed
Medium volatility (2-4%):        up to 3x allowed
High volatility (volPct > 4%):   max 2x

Within those caps, apply confidence scaling:
  HIGH confidence (>=0.75) + R:R >= 3:1 + 4/5 agreement → use the cap
  HIGH + R:R >= 2:1 + 3/5 → cap minus 1x (minimum 2x)
  MEDIUM confidence → 2x regardless of volatility
  LOW confidence → WAIT
```

### Step 8: Synthesize decision

Produce one structured recommendation:

```
ACTION:      OPEN LONG / OPEN SHORT / TAKE PROFIT / CLOSE / HOLD / WAIT
Setup:       Dip buy / Breakout / Mean reversion / Breakdown
Confidence:  HIGH (>=0.75) / MEDIUM (0.50-0.74) / LOW (<0.50)
Agreement:   X/5 [direction]

Price:       $X.XX
Entry:       $X.XX (level name, or "at market" if within 0.3%)
Stop:        $X.XX (level name) — X.X% risk
TP1:         $X.XX (level name, 60%) — X.X% reward
TP2:         $X.XX (level name, 40%) — X.X% reward
R:R (TP1):   X.X:1
Collateral:  X USDC
Leverage:    Xx (volPct X.X%, cap Xx)

Indicators:  RSI / MACD / Bollinger / EMA / Volume — value and reading
Levels:      local_highs / local_lows / nearest R / nearest S / pivot
Sentiment:   F&G XX/100, trend, BTC dom, bias
Volatility:  volPct X.X%, 24h range $X.XX-$X.XX
Wallet:      X.XX USDC free | N open positions
History:     last 3 trades: W/L/W, avg win +X%, avg loss -X%
```

### Step 9: Manage open positions

For each open position from `perps list`, check PnL:

```bash
node trader/vendor/jupiter/dist/cli.js perps pnl \
  --position-pubkey <pubkey> --current-price <price>
```

Apply adaptive exit rules:

**Trailing stop (for profitable positions):**
- PnL > 0 but below TP1: hold, keep original stop
- PnL reached TP1 level: recommend partial close (60%), move stop to entry
- PnL beyond TP1 heading to TP2: trail stop below last swing low (long)
  or above last swing high (short)
- PnL reached TP2: close remaining position

**Cut losers fast:**
- Price hit stop level → close immediately, no averaging down
- Liquidation within 5% of current price → close immediately
- Position held > 4 hours with no progress toward TP1 → evaluate closing
  (dead money in a leverage position costs borrow fees)

**Conflict detection:**
- Open position is opposite to the new signal → close the old position first
- Never stack same-direction positions (increases risk on same thesis)

### Step 10: Execute

Log the full summary (entry, stop, TP1, TP2, leverage reasoning) then
execute immediately:

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

On WAIT/HOLD: log the setup being watched and at what price level to
reconsider. Do not execute any transaction.

### Step 11: Record keeping

Write JSON to `history/YYYY-MM-DDTHH-MM-SS-[action].json`:

Open record fields: timestamp, action, setup_type (dip_buy/breakout/
mean_reversion/breakdown), symbol, side, collateral_usd, leverage,
entry_price, stop_price, tp1_price, tp2_price, rr_ratio, position_pubkey,
tx_signature, confidence, signal_agreement, volatility_pct, volume_ratio,
indicators (rsi, macd_histogram, bollinger, ema_crossover, volume_vs_avg),
sentiment (fear_greed, classification, btc_dominance_pct,
market_cap_change_24h_pct, bias), levels (nearest_resistance,
nearest_support, pivot, swing_high, swing_low, ema20, ema50), notes.

Close record fields: timestamp, action, reason (tp1/tp2/stop/manual/
time_exit/conflict), symbol, side, position_pubkey, tx_signature,
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
| WAIT signal | Low confidence or no key level | Report reason, do not trade |
