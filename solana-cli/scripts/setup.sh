#!/usr/bin/env bash
# Install or verify the Solana CLI. Idempotent.
# Source: https://solana.com/docs/intro/installation
set -euo pipefail

if command -v solana &>/dev/null; then
  echo "[solana-cli] solana $(solana --version 2>/dev/null | head -1) already installed"
  exit 0
fi

echo "[solana-cli] Installing Solana CLI via agave installer..."

# Official install method from solana.com/docs/intro/installation
curl -sSfL https://release.anza.xyz/stable/install | sh

# Add to PATH for current session
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo "[solana-cli] Installed: $(solana --version)"
echo "[solana-cli] Configure RPC: solana config set --url <rpc-url>"
