#!/usr/bin/env bash
# Build the Browser vendor CLI and install Chromium. Idempotent.
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
VENDOR="$PLUGIN_ROOT/vendor/browser"

if [[ ! -d "$VENDOR/dist" ]]; then
  echo "[browser] Installing dependencies..."
  (cd "$VENDOR" && npm install --silent)
  echo "[browser] Building CLI..."
  (cd "$VENDOR" && npm run build --silent)
  echo "[browser] CLI ready."
fi

EXEC_PATH=$(cd "$VENDOR" && node -e "const {chromium}=require('playwright-core');console.log(chromium.executablePath())" 2>/dev/null || true)
if [[ -z "$EXEC_PATH" || ! -f "$EXEC_PATH" ]]; then
  echo "[browser] Installing Chromium..."
  (cd "$VENDOR" && npx playwright-core install chromium)
  echo "[browser] Chromium ready."
fi

echo "[browser] Setup complete."
