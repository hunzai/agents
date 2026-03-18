---
description: >
  Check SOL balance for any Solana wallet address. Also shows token accounts.
  Use when asked to check balance, how much SOL someone has, or wallet holdings.
allowed-tools: Bash(solana:*), Bash(spl-token:*)
---

# Check Wallet Balance

Query SOL and SPL token balances for any Solana address using the official CLI.

## Steps

### Step 1: Verify CLI installed

```bash
solana --version || bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
```

### Step 2: Determine RPC and address

- Use the address provided by the user, OR
- If no address given, use the default keypair: `solana address`
- Use mainnet RPC unless user specifies otherwise

```bash
# Check current config
solana config get
```

### Step 3: Get SOL balance

```bash
# For a specific address
solana balance <ADDRESS> --url <rpc-url>

# For default keypair
solana balance --url <rpc-url>
```

### Step 4: Get SPL token accounts (optional)

If user asks about token holdings or portfolio:

```bash
# List all token accounts for the address
spl-token accounts --owner <ADDRESS> --url <rpc-url> 2>/dev/null || echo "No SPL tokens or spl-token not installed"
```

### Step 5: Report

```
Wallet: <address>
Network: mainnet-beta | devnet | testnet
SOL Balance: <amount> SOL
```

If tokens found, list them with mint addresses and amounts.

## RPC URLs

| Network | URL |
|---------|-----|
| Mainnet | `https://api.mainnet-beta.solana.com` or custom RPC from env |
| Devnet | `https://api.devnet.solana.com` |
| Testnet | `https://api.testnet.solana.com` |

Use `$RPC_URL` env var if set, otherwise mainnet default.
