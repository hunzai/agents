---
description: >
  Transfer SOL between Solana wallets using the official CLI.
  Use when asked to send SOL, transfer funds, or pay someone.
allowed-tools: Bash(solana:*)
---

# Transfer SOL

Send SOL from your wallet to another address using the Solana CLI.

## Steps

### Step 1: Verify CLI installed

```bash
solana --version || bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
```

### Step 2: Parse arguments

- RECIPIENT = destination wallet address (required)
- AMOUNT = SOL amount to send (required)
- KEYPAIR = sender keypair path (optional, defaults to CLI config)

### Step 3: Pre-flight checks

```bash
# Check sender balance
solana balance --keypair <keypair> --url <rpc-url>

# Verify recipient is a valid address
solana account <RECIPIENT> --url <rpc-url> 2>/dev/null || echo "New/unfunded address"
```

**IMPORTANT:** Always confirm the amount and recipient with the user before executing.

### Step 4: Execute transfer

```bash
solana transfer <RECIPIENT> <AMOUNT> \
  --keypair <keypair> \
  --url <rpc-url> \
  --allow-unfunded-recipient \
  --with-compute-unit-price 1000
```

### Step 5: Confirm

```bash
# The transfer command outputs the transaction signature
# Verify it was confirmed
solana confirm <TX_SIGNATURE> --url <rpc-url>
```

### Step 6: Report

```
Transfer: <AMOUNT> SOL
From: <sender address>
To: <RECIPIENT>
Signature: <tx signature>
Status: confirmed
```

## Safety

- Always show the recipient and amount before executing
- If amount > 1 SOL, ask for explicit confirmation
- Never transfer without a keypair being specified or configured
