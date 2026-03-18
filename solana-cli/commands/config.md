---
description: >
  Configure Solana CLI — set RPC URL, default keypair, commitment level.
  Use when asked to switch networks, set up Solana CLI, or change RPC endpoint.
allowed-tools: Bash(solana:*)
---

# Configure Solana CLI

View and update the Solana CLI configuration.

## Steps

### Step 1: Verify CLI installed

```bash
solana --version || bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
```

### Step 2: Show current config

```bash
solana config get
```

### Step 3: Apply changes

Based on what the user wants:

```bash
# Set RPC URL
solana config set --url <url>

# Set default keypair
solana config set --keypair <path>

# Set commitment level
solana config set --commitment <level>
```

## Common RPC presets

| Network | Command |
|---------|---------|
| Mainnet | `solana config set --url mainnet-beta` |
| Devnet | `solana config set --url devnet` |
| Testnet | `solana config set --url testnet` |
| Custom | `solana config set --url https://your-rpc.com` |

If the user has `$RPC_URL` set in their environment, suggest using that:

```bash
solana config set --url $RPC_URL
```

### Step 4: Verify

```bash
solana config get
```
