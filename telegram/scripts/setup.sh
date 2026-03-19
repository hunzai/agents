#!/usr/bin/env bash
# Build the Telegram vendor CLI. Idempotent.
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
VENDOR="$PLUGIN_ROOT/vendor/telegram"

if [[ ! -d "$VENDOR/dist" ]]; then
  echo "[telegram] Building CLI..."
  if command -v tsc &>/dev/null; then
    (cd "$VENDOR" && tsc)
  else
    (cd "$VENDOR" && npm install --silent && npm run build --silent)
  fi
  echo "[telegram] CLI ready."
else
  echo "[telegram] CLI already built."
fi
