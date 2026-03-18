---
description: >
  Create a new Solana wallet (keypair). Generates a keypair file and shows the public address.
  Use when asked to create a wallet, generate a keypair, or set up a new Solana account.
allowed-tools: Bash(solana:*), Bash(solana-keygen:*), Bash(mkdir:*), Bash(cat:*), Bash(echo:*)
---

# Create Solana Wallet

Generate a new Solana keypair using the official Solana CLI.

## Steps

### Step 1: Verify CLI installed

```bash
solana --version || bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
```

### Step 2: Determine output path

- If the user specified a path, use that
- Otherwise use `~/.config/solana/wallets/<name>.json`
- Default name: `wallet-<timestamp>`

```bash
mkdir -p ~/.config/solana/wallets
```

### Step 3: Generate keypair

```bash
solana-keygen new --outfile <path> --no-bip39-passphrase
```

This outputs the public key and writes the keypair to the file.

**IMPORTANT:** Never display or log the private key / seed phrase. Only show the public address.

### Step 4: Show the address

```bash
solana-keygen pubkey <path>
```

### Step 5: Report

```
Wallet created
Address: <public key>
Keypair: <file path>

Fund this wallet:
  Devnet:  solana airdrop 2 <address> --url devnet
  Mainnet: Transfer SOL to <address>
```

## Options

| Flag | Description |
|------|-------------|
| `--force` | Overwrite existing keypair file |
| `--word-count 12\|24` | Seed phrase word count (default: 12) |

## Security

- Never print the private key or seed phrase to the user
- Never log keypair contents
- Warn the user to back up the keypair file
