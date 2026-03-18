---
description: >
  Show full Solana portfolio — SOL balance, token accounts, stake accounts, and transaction history.
  Use when asked to track portfolio, show holdings, account overview, or recent activity.
allowed-tools: Bash(solana:*), Bash(spl-token:*), Bash(echo:*), Bash(printf:*)
---

# Solana Portfolio

Full account overview: SOL balance, SPL tokens, staking, and recent transactions.

## Steps

### Step 1: Verify CLI installed

```bash
solana --version || bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
```

### Step 2: Determine address and RPC

- Use the address provided by the user
- If none given, use default: `solana address`
- Use `$RPC_URL` if set, otherwise mainnet

### Step 3: SOL balance

```bash
solana balance <ADDRESS> --url <rpc-url>
```

### Step 4: Account info

```bash
solana account <ADDRESS> --url <rpc-url> --output json 2>/dev/null
```

### Step 5: SPL token accounts

```bash
spl-token accounts --owner <ADDRESS> --url <rpc-url> --output json 2>/dev/null || echo "[]"
```

### Step 6: Stake accounts

```bash
solana stakes <ADDRESS> --url <rpc-url> 2>/dev/null || echo "No stake accounts"
```

### Step 7: Recent transactions

```bash
solana transaction-history <ADDRESS> --limit 10 --url <rpc-url> 2>/dev/null
```

### Step 8: Report

Present a clean portfolio summary:

```
Portfolio: <address>
Network: <network>

SOL Balance: <amount> SOL

Token Holdings:
  <token mint> — <amount>
  ...

Staking:
  <validator> — <amount> SOL (<status>)
  ...

Recent Transactions (last 10):
  <signature> — <date>
  ...
```

If output is saved to `$OUTPUT_DIR`, write `portfolio.json` with all data.
