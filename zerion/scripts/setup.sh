#!/usr/bin/env bash
# Build the Zerion vendor CLI. Idempotent.
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
VENDOR="$PLUGIN_ROOT/vendor/zerion"

if [[ ! -d "$VENDOR/dist" ]]; then
  echo "[zerion] Building CLI..."
  if command -v tsc &>/dev/null; then
    (cd "$VENDOR" && tsc)
  else
    (cd "$VENDOR" && npm install --silent && npm run build --silent)
  fi
  echo "[zerion] CLI ready."
else
  echo "[zerion] CLI already built."
fi
