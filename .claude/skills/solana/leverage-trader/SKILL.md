---
name: solana/leverage-trader
description: >
  Autonomous SOL leverage trader on Jupiter Perpetuals. Runs 10x positions with
  max 2 USDC collateral, targeting local highs and dips for quick profit-taking.
  Maintains exactly one position at a time — closes existing before opening new.
  Tracks all trades in a persistent ledger to learn from history and track PnL.
  Use when asked to auto-trade leverage, run the leverage trader, scalp perps,
  or maximize profit on SOL perpetuals with small capital.
metadata:
  tier: composite
  category: solana
  inputs: "[collateral] USDC (default 2, max 2), [leverage] multiplier (default 10x)"
  outputs: "Trade records in leverage-history/*.json, cumulative PnL ledger"
  uses: [price, trader]
  cost-estimate: "~$0.15 (LLM analysis + on-chain tx fees)"
  disable-model-invocation: true
  argument-hint: [collateral] [leverage]
  allowed-tools: Bash(*)
  context: fork
---

# Leverage Trader

Scan → decide → execute → record. One position at a time, 10x default, quick
profit-taking at local highs/dips. This is a scalper — it takes what the market
gives rather than waiting for perfect setups.

Uses **solana/fetch-price** for analysis and **solana/trade** for execution.

## Philosophy

Traditional setups wait for ideal conditions. This skill trades the reality:
local price swings happen constantly. A 1% move at 10x = 10% return on
collateral. The edge comes from reading short-term structure (swing highs/lows,
momentum shifts, level proximity) and taking profits quickly rather than holding
for big moves. Small, frequent wins compound.

## Safety rules

- Auto-execute trades when setup conditions are met — no confirmation needed.
- Max leverage: 10x. Default: 2 USDC collateral, 10x leverage.
- **One position at a time.** If a position is open, manage it (hold/close). Never open a second.
- Stop if WALLET_PATH or RPC_URL is missing.
- Never re-send a transaction if a signature was returned.
- Never hallucinate prices — use only CLI output.
- Volume ratio < 0.5 (thin market) → WAIT.

At 10x on 2 USDC the position size is $20. Liquidation is ~9% from entry.
Stops must stay well inside that — max 4% stop width to keep a safety buffer.

---

## Steps

### Step 1: Environment check

```bash
echo "WALLET: ${WALLET_PATH:-NOT SET}" && echo "RPC: ${RPC_URL:-NOT SET}"
```

If either is NOT SET, stop and tell user which to add to `.env`.

### Step 2: Parse arguments

- COLLATERAL = $ARGUMENTS[0] or 2 (capped at 2 USDC)
- LEVERAGE = $ARGUMENTS[1] or 10 (capped at 10x)
- HISTORY_DIR = leverage-history/ (in project root)

### Step 3: Full market scan (run all in parallel)

```bash
node price/vendor/price/dist/cli.js signal sol 60
node price/vendor/price/dist/cli.js levels sol
node price/vendor/price/dist/cli.js sentiment
node price/vendor/price/dist/cli.js stats solana 1 --last 6
node price/vendor/price/dist/cli.js fetch /tmp/sol_price.txt
node price/vendor/price/dist/cli.js historical solana 1
node trader/vendor/jupiter/dist/cli.js swap balance
node trader/vendor/jupiter/dist/cli.js perps list
```

### Step 4: Build the local price map

From combined output, construct the short-term picture:

```
Swing high:     levels.local_highs[0] (nearest)
Swing low:      levels.local_lows[0] (nearest)
24h range:      stats.high - stats.low
Volatility:     (24h range / stats.close) * 100 → volPct
Dip from max:   ((stats.high - current) / stats.high) * 100
Rally from min: ((current - stats.low) / stats.low) * 100
1h trend:       price vs 1h ago from historical
Volume health:  signal.signals.volume.ratio

Key levels (sorted):
  R2 > R1 > SwingHigh > Pivot > SwingLow > S1 > S2
  EMA20, EMA50
```

### Step 5: Check existing positions

If `perps list` returns any position:

```bash
node trader/vendor/jupiter/dist/cli.js perps pnl \
  --position-pubkey <pubkey> --current-price <current_price>
```

**Position management (one position rule):**

| Condition | Action |
|-----------|--------|
| PnL >= +1.0% (after fees) | CLOSE — take profit |
| PnL >= +0.6% AND price near resistance (long) or support (short) | CLOSE — take profit at level |
| PnL <= -3.5% OR liquidation within 5% | CLOSE — cut loss |
| Price hit stop level from trade record | CLOSE — stop triggered |
| Opposite signal with valid setup | CLOSE current, then open new |
| None of the above | HOLD — let it run |

These thresholds are aggressive because at 10x, a 1% price move = 10% PnL.
Taking +1% quickly and often beats waiting for bigger moves that may reverse.

If position was closed, proceed to Step 6 to look for a new trade.
If HOLD, skip to Step 9 (record) and report status.

### Step 6: Review trade history

```bash
ls -t leverage-history/*.json 2>/dev/null | head -10
```

Read last 5-10 records. Build a learning picture:

- **Win rate:** wins / total closed trades
- **Avg win vs avg loss:** are winners bigger than losers?
- **Side bias:** if last 3 losses were all on one side, avoid that side
- **Time patterns:** trades opened and closed quickly vs stuck for a long time
- **Setup performance:** which setup types are winning/losing?

Use this to bias decisions: if shorts have been losing, prefer longs (and vice
versa). If a specific setup keeps failing, skip it.

### Step 7: Identify trade setup

These setups are tuned for quick profit-taking at local extremes. The bar is
lower than a swing trader because we're targeting small moves at 10x.

Apply rules in order, take the FIRST match:

**A. Dip scalp long (buy the local dip):**
- Price dipped 0.8%+ from recent high (1h-6h window)
- Price within 0.5% of any support level (S1, S2, pivot, swing low, EMA20)
- RSI < 60 (not overbought)
- Volume ratio >= 0.5
- Action: OPEN LONG

**B. Momentum long (ride fresh breakout):**
- Price broke above swing high or R1 (within 0.3%)
- Volume ratio > 0.8
- MACD histogram > 0
- EMA20 > EMA50 or EMA20 crossing above EMA50
- Action: OPEN LONG

**C. Mean reversion short (fade the local high):**
- Price rallied 1.5%+ from recent low (1h-6h window)
- Price within 0.5% of resistance (R1, R2, swing high, 24h high)
- RSI > 65
- Action: OPEN SHORT

**D. Breakdown short (ride the drop):**
- Price broke below swing low or S1 (within 0.3%)
- Volume ratio > 0.8
- MACD histogram < 0
- EMA20 < EMA50
- Action: OPEN SHORT

**E. Quick bounce long (oversold snap):**
- RSI < 30
- Price within 1% of S2 or S3
- Bollinger position = "below_lower"
- Action: OPEN LONG (tighter take-profit: 0.6%)

**F. Quick fade short (overbought snap):**
- RSI > 75
- Price within 1% of R2 or R3
- Bollinger position = "above_upper"
- Action: OPEN SHORT (tighter take-profit: 0.6%)

**G. No edge → WAIT:**
- Volume ratio < 0.5 (thin market)
- Price in midrange with no level proximity
- No setup conditions met
- History shows 3+ consecutive losses (cool-down)
- Action: WAIT. Report what conditions would trigger a trade.

### Step 8: Set levels and execute

**Entry:** At market.

**Stop loss (tight but not noise-level):**
- LONG stop: nearest support below entry minus 0.3% buffer. Min 1.5%, max 4%.
- SHORT stop: nearest resistance above entry plus 0.3% buffer. Min 1.5%, max 4%.
- If no structural level within range, use 2.5% flat stop.

**Take profit (quick):**
- TP1: nearest resistance (long) or support (short). Target 0.8-2% move.
- If TP1 is less than 0.5% away, use the next level.
- For snap setups (E, F): tighter TP at 0.6% from entry.

**R:R minimum:** 1:1 for TP1. Since we're taking profits quickly, even 1:1
works because the win rate should be high.

**Leverage adjustment:**
```
volPct < 4%:  10x (default — normal conditions)
volPct 4-8%:  7x (elevated volatility)
volPct > 8%:  5x (extreme — widen stops, reduce leverage)
```

**Execute:**

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

### Step 9: Record keeping

Write JSON to `leverage-history/YYYY-MM-DDTHH-MM-SS-[action].json`:

**Open record:**
```json
{
  "timestamp": "ISO",
  "action": "OPEN_LONG|OPEN_SHORT",
  "setup_type": "dip_scalp|momentum|mean_reversion|breakdown|quick_bounce|quick_fade",
  "symbol": "SOL",
  "side": "long|short",
  "collateral_usd": 2,
  "leverage": 10,
  "entry_price": 0,
  "stop_price": 0,
  "tp_price": 0,
  "rr_ratio": 0,
  "position_pubkey": "",
  "tx_signature": "",
  "volatility_pct": 0,
  "volume_ratio": 0,
  "indicators": {},
  "sentiment": {},
  "levels": {},
  "notes": ""
}
```

**Close record:**
```json
{
  "timestamp": "ISO",
  "action": "CLOSE",
  "reason": "take_profit|stop_loss|opposite_signal|manual",
  "symbol": "SOL",
  "side": "long|short",
  "position_pubkey": "",
  "tx_signature": "",
  "entry_price": 0,
  "close_price": 0,
  "collateral_usd": 2,
  "leverage": 10,
  "pnl_usd": 0,
  "pnl_pct": 0,
  "net_pnl_usd": 0,
  "duration_minutes": 0,
  "linked_open_file": "",
  "cumulative_pnl_usd": 0
}
```

**Wait record (minimal):**
```json
{
  "timestamp": "ISO",
  "action": "WAIT",
  "reason": "thin_market|no_setup|cooldown",
  "current_price": 0,
  "notes": ""
}
```

**Cumulative PnL:** On each close, sum `net_pnl_usd` from all close records in
leverage-history/ and store in `cumulative_pnl_usd`. This is the running
total that shows overall strategy performance.

Only write records on success. On failure, report error and stop.

### Step 10: Report

```
ACTION:      OPEN LONG / OPEN SHORT / CLOSE / HOLD / WAIT
Setup:       Dip scalp / Momentum / Mean reversion / Breakdown / Quick bounce / Quick fade
Price:       $X.XX

Entry:       $X.XX (at market)
Stop:        $X.XX (level) — X.X% risk
TP:          $X.XX (level) — X.X% target
R:R:         X.X:1
Collateral:  X USDC @ Xx

Indicators:  RSI X / MACD X / Bollinger X / EMA X / Volume X
Levels:      swing high $X / swing low $X / R1 $X / S1 $X
Sentiment:   F&G XX/100

History:     X wins / X losses / X.X% win rate
Cumulative:  $X.XX total PnL (X trades)
Wallet:      X.XX USDC | X open positions
```

---

## Learning from history

The trade history is not just a log — it's a feedback loop. Each run should:

1. Read the last 5-10 trades before making decisions
2. Calculate win rate and avg PnL per setup type
3. Avoid setups that have been consistently losing
4. Prefer the side (long/short) that has been winning recently
5. After 3 consecutive losses, enforce a cool-down (WAIT one cycle)

This creates an adaptive strategy that gets better as more data accumulates.
Early trades use the default rules. Later trades are biased by actual results.

---

## Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `WALLET_PATH required` | Env var missing | Add to `.env` |
| `RPC_URL required` | Env var missing | Add to `.env` |
| `Position already open` | One-position rule | Manage existing position first |
| `success: false` on open/close | On-chain error | Show error, do not retry |
| WAIT signal | No setup or thin market | Report reason, do not trade |
| Collateral > 2 USDC | Exceeds max | Cap at 2 USDC |
