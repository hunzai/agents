---
name: sol-swap
description: >
  Simple SOL/USDC dip-and-high swapper. Checks last 1 hour of price history.
  Buys SOL on dips, sells on highs with profit check (fees included).
  Max budget 5 USDC, invests 2 USDC per entry and waits for deeper dips/highs
  before next entry. Logs every swap to swap-ledger.jsonl. Use when asked to
  swap SOL, buy the dip, or run the simple spot trader.
metadata:
  category: trading
disable-model-invocation: true
argument-hint: [max-budget-usdc] [trade-size-usdc]
allowed-tools: Bash(*)
context: fork
---

# SOL Dip & High Swapper

Simple spot swap strategy using only 1-hour price history. No indicators, no
signals — just price action: buy dips, sell highs, protect capital.

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

**Data sources:**
- `fetch --source pyth` → current live price from Pyth Network (on-chain, real-time)
- `historical solana 1` → last 24h of prices from CoinGecko (`prices` array of `[epoch_ms, price]` pairs, ~5 min granularity)
- `swap balance` → wallet SOL and USDC balances

### Step 4: Build the 1-hour price window

From `historical` output, filter the `prices` array to keep only entries where
`epoch_ms >= (now - 3600000)` (last 60 minutes).

From the filtered 1-hour prices extract:

```
live_price = fetch.price              (Pyth — most accurate current price)
h1_high    = max(filtered_prices)     (CoinGecko 1h high)
h1_low     = min(filtered_prices)     (CoinGecko 1h low)
h1_open    = filtered_prices[0]       (price 1 hour ago)

dip_pct    = ((h1_high - live_price) / h1_high) * 100
rally_pct  = ((live_price - h1_low) / h1_low) * 100
range_pct  = ((h1_high - h1_low) / h1_high) * 100
```

From balance output extract: `sol` balance, `usdc` balance.

### Step 5: Decide action

Track `usdc_spent` this run (starts at 0). Each entry adds TRADE_SIZE.
Require progressively deeper moves for each successive entry:

| Entry # | BUY threshold (dip_pct) | SELL threshold (rally_pct) |
|---------|------------------------|---------------------------|
| 1       | >= 1.0%                | >= 1.0%                   |
| 2       | >= 1.5%                | >= 1.5%                   |
| 3+      | >= 2.0%                | >= 2.0%                   |

Evaluate in order. Take the FIRST match:

**A. BUY SOL (dip detected):**
- dip_pct >= threshold for current entry number
- USDC balance >= TRADE_SIZE
- usdc_spent + TRADE_SIZE <= MAX_BUDGET
- Action: buy SOL with TRADE_SIZE USDC

**B. SELL SOL (high detected — with profit check):**
- rally_pct >= threshold for current entry number
- SOL balance > 0.01 (keep reserve for fees)
- Before selling, calculate if profitable (Step 6)
- If profitable → sell. If not → HOLD.
- usdc_spent + TRADE_SIZE <= MAX_BUDGET

**C. HOLD (no edge):**
- Price is mid-range (hasn't reached threshold for current entry)
- Or insufficient balance
- Or budget exhausted (usdc_spent >= MAX_BUDGET)
- Action: report current state, do nothing

### Step 6: Profit check before selling

Get a quote to see what the sell would yield:

```bash
node trader/vendor/jupiter/dist/cli.js swap quote --subcommand sell --amount <sol_to_sell>
```

Calculate net PnL:

```
sell_usdc       = quote.outputAmount
cost_basis      = amount_of_usdc_spent_to_buy_this_sol (from history or estimate)
tx_fee_estimate = 0.01 USDC (Solana tx fees are negligible but account for them)
net_pnl         = sell_usdc - cost_basis - tx_fee_estimate
```

If no exact cost basis is known, use h1_low as a conservative
buy estimate: `cost_basis = sol_to_sell * h1_low`.

- net_pnl > 0 → SELL (profitable)
- net_pnl <= 0 → HOLD (not profitable, wait for better price)

### Step 7: Execute and log

```bash
# BUY
node trader/vendor/jupiter/dist/cli.js swap buy --amount <TRADE_SIZE>

# SELL (only if Step 6 confirmed profit)
node trader/vendor/jupiter/dist/cli.js swap sell --amount <sol_amount>
```

After each trade:

1. Re-check balance:
```bash
node trader/vendor/jupiter/dist/cli.js swap balance
```

2. Append to ledger (`swap-ledger.jsonl` — one JSON object per line):
```bash
echo '{"timestamp":"2026-03-16T14:32:00Z","date":"2026-03-16","action":"BUY","sol_amount":0.015,"usdc_amount":2.00,"price":131.50,"fee_usdc":0.01,"pnl_usdc":null,"tx":"5xK...abc","entry_num":1,"dip_pct":1.2,"rally_pct":null,"h1_high":133.10,"h1_low":130.80,"balance_sol":0.025,"balance_usdc":3.00}' >> swap-ledger.jsonl
```

Field reference:
- `timestamp`: ISO 8601 UTC
- `date`: YYYY-MM-DD
- `action`: BUY | SELL
- `sol_amount`: SOL bought or sold
- `usdc_amount`: USDC spent (BUY) or received (SELL)
- `price`: execution price (live_price at time of trade)
- `fee_usdc`: estimated transaction fee in USDC
- `pnl_usdc`: net profit/loss for SELL trades (null for BUY)
- `tx`: on-chain transaction signature
- `entry_num`: which entry this run (1, 2, 3...)
- `dip_pct` / `rally_pct`: trigger percentage at time of trade
- `h1_high` / `h1_low`: 1h range at time of trade
- `balance_sol` / `balance_usdc`: wallet after trade

3. If budget remaining and conditions still met, repeat from Step 5 with incremented entry number.

### Step 8: Report

```
ACTION:      BUY / SELL / HOLD
Budget:      $X.XX of $MAX_BUDGET spent (N of MAX_TRADES entries)

Price (Pyth): $X.XX (live)
1h high (CG): $X.XX
1h low  (CG): $X.XX
1h open (CG): $X.XX
Dip:          X.X% from 1h high
Rally:        X.X% from 1h low
Range:        X.X%

Wallet:       X.XX SOL | X.XX USDC

Trade 1:      BUY/SELL X.XX SOL @ ~$X.XX | fee: $0.01 | tx: <signature>
Trade 2:      BUY/SELL X.XX SOL @ ~$X.XX | fee: $0.01 | tx: <signature>
              (or "budget remaining — waiting for deeper dip/high")

Net PnL:      $X.XX (if sells occurred)
Reason:       dip detected / high detected + profitable / no edge — holding
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

## Ledger

All swaps are appended to `swap-ledger.jsonl` (project root). One JSON object
per line. Never overwrite — append only. Use `cat swap-ledger.jsonl | jq .` to
review history or `jq -s '[.[] | select(.action=="SELL")] | map(.pnl_usdc) | add'
swap-ledger.jsonl` to sum realized PnL.
