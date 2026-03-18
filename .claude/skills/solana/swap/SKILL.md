---
name: solana/swap
description: >
  Simple SOL/USDC dip-and-high swapper. Checks last 1 hour of price history.
  Buys SOL on dips, sells on highs with profit check (fees included).
  Max budget 5 USDC, invests 2 USDC per entry and waits for deeper dips/highs
  before next entry. Logs every swap to swap-ledger.jsonl. Use when asked to
  swap SOL, buy the dip, or run the simple spot trader.
metadata:
  category: solana
disable-model-invocation: true
argument-hint: [max-budget-usdc] [trade-size-usdc]
allowed-tools: Bash(*)
context: fork
---

# SOL Dip & High Swapper

Simple spot swap strategy using only 1-hour price history. No indicators, no
signals — just price action: buy dips, sell highs, protect capital.
Uses **solana/price** for data and **solana/trade** for execution.

## Rules

- Max budget: 5 USDC total (override via first argument). Entries of 2 USDC each (override via second argument).
- Wait for progressively deeper dips/highs before each successive entry (staggered entries).
- Always keep at least 0.01 SOL in wallet to pay transaction fees.
- Before selling: calculate PnL including fees. Only sell if net profitable.
- If not profitable → HOLD. Never sell at a loss.
- Use only the last 1 hour of price data. No RSI, MACD, or other indicators.
- Auto-execute — no confirmation needed.
- Never re-send a transaction if a signature was returned.
- Log every executed swap to `swap-ledger.jsonl` (append, never overwrite).

---

## Steps

### Step 1: Environment check

```bash
echo "WALLET: ${WALLET_PATH:-NOT SET}" && echo "RPC: ${RPC_URL:-NOT SET}"
```

If either is NOT SET, stop and report which env var to add to `.env`.

### Step 2: Parse arguments

- MAX_BUDGET = $ARGUMENTS[0] or 5 (total USDC budget for this run)
- TRADE_SIZE = $ARGUMENTS[1] or 2 (USDC per entry)
- MAX_TRADES = floor(MAX_BUDGET / TRADE_SIZE)  → default: 2 entries
- LEDGER = swap-ledger.jsonl (in project root)

### Step 3: Get current state (run all in parallel)

```bash
node price/vendor/price/dist/cli.js fetch /tmp/sol_price.txt --source pyth
node price/vendor/price/dist/cli.js historical solana 1
node trader/vendor/jupiter/dist/cli.js swap balance
```

### Step 4: Build the 1-hour price window

From `historical` output, filter the `prices` array to keep only entries where
`epoch_ms >= (now - 3600000)` (last 60 minutes).

```
live_price = fetch.price              (Pyth — most accurate current price)
h1_high    = max(filtered_prices)     (CoinGecko 1h high)
h1_low     = min(filtered_prices)     (CoinGecko 1h low)
h1_open    = filtered_prices[0]       (price 1 hour ago)

dip_pct    = ((h1_high - live_price) / h1_high) * 100
rally_pct  = ((live_price - h1_low) / h1_low) * 100
range_pct  = ((h1_high - h1_low) / h1_high) * 100
```

### Step 5: Decide action

Track `usdc_spent` this run (starts at 0). Require progressively deeper moves:

| Entry # | BUY threshold (dip_pct) | SELL threshold (rally_pct) |
|---------|------------------------|---------------------------|
| 1       | >= 1.0%                | >= 1.0%                   |
| 2       | >= 1.5%                | >= 1.5%                   |
| 3+      | >= 2.0%                | >= 2.0%                   |

**A. BUY SOL (dip detected):**
- dip_pct >= threshold for current entry number
- USDC balance >= TRADE_SIZE
- usdc_spent + TRADE_SIZE <= MAX_BUDGET

**B. SELL SOL (high detected — with profit check):**
- rally_pct >= threshold
- SOL balance > 0.01 (keep reserve for fees)
- Must pass profit check (Step 6)

**C. HOLD (no edge):**
- Price is mid-range, insufficient balance, or budget exhausted

### Step 6: Profit check before selling

```bash
node trader/vendor/jupiter/dist/cli.js swap quote --subcommand sell --amount <sol_to_sell>
```

net_pnl > 0 → SELL. net_pnl <= 0 → HOLD.

### Step 7: Execute and log

```bash
# BUY
node trader/vendor/jupiter/dist/cli.js swap buy --amount <TRADE_SIZE>

# SELL (only if Step 6 confirmed profit)
node trader/vendor/jupiter/dist/cli.js swap sell --amount <sol_amount>
```

After each trade, re-check balance and append to `swap-ledger.jsonl`.

### Step 8: Report

```
ACTION:      BUY / SELL / HOLD
Budget:      $X.XX of $MAX_BUDGET spent (N of MAX_TRADES entries)

Price (Pyth): $X.XX (live)
1h high (CG): $X.XX
1h low  (CG): $X.XX
Dip:          X.X% from 1h high
Rally:        X.X% from 1h low

Wallet:       X.XX SOL | X.XX USDC
Net PnL:      $X.XX (if sells occurred)
Ledger:       swap-ledger.jsonl (N total entries)
```

---

## Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `WALLET_PATH required` | Env var missing | Add to `.env` |
| `RPC_URL required` | Env var missing | Add to `.env` |
| `Insufficient balance` | Not enough USDC or SOL | Report balance, skip trade |
| `success: false` on swap | On-chain error | Show error, do not retry |
| HOLD | Not profitable or no dip/high | Report reason, do nothing |
| Budget exhausted | usdc_spent >= MAX_BUDGET | Report, stop trading |
