---
description: >
  Show multi-chain wallet portfolio — total value, breakdown by chain and position type, 24h changes.
  Use when asked to check portfolio, wallet value, holdings overview, or track a wallet across chains.
allowed-tools: Bash(*)
---

# Wallet Portfolio (Zerion)

Multi-chain portfolio summary for any EVM or Solana wallet address.

## Steps

### Step 1: Environment check

```bash
echo "ZERION: ${ZERION_API_KEY:-NOT SET}"
```

If NOT SET, stop and ask user to add `ZERION_API_KEY` to `.env`.

### Step 2: Build CLI (idempotent)

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
```

### Step 3: Get portfolio summary

```bash
NODE_OPTIONS="--dns-result-order=ipv4first" node ${CLAUDE_PLUGIN_ROOT}/vendor/zerion/dist/cli.js portfolio <ADDRESS> [--currency usd]
```

Returns JSON with: `total_value`, `change_1d`, `change_1d_pct`, `by_type` (wallet/deposited/staked/locked/borrowed), `by_chain`.

### Step 4: Get token positions (optional, for detailed view)

```bash
NODE_OPTIONS="--dns-result-order=ipv4first" node ${CLAUDE_PLUGIN_ROOT}/vendor/zerion/dist/cli.js positions <ADDRESS> [--currency usd] [--chain ethereum]
```

Returns all token positions with: name, symbol, chain, quantity, value, price, 24h change.

### Step 5: Format report

Present a clean summary:

```
Portfolio: <address>
Total Value: $<total>  (<change_1d_pct>% 24h)

By Chain:
  ethereum    $XXX.XX
  arbitrum    $XXX.XX
  solana      $XXX.XX
  ...

By Type:
  Wallet      $XXX.XX
  Deposited   $XXX.XX
  Staked      $XXX.XX

Top Holdings:
  <symbol>  <quantity>  $<value>  (<chain>)
  ...
```

If saving to `$OUTPUT_DIR`, write `portfolio.json` with full data.

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--currency` | `usd` | Price denomination |
| `--chain` | all | Filter to specific chain (positions only) |
| `--sort` | `-value` | Sort positions by value |
