#!/usr/bin/env bash
# Installs vendor dependencies the first time the skill runs.
# Idempotent: skips install if node_modules already exists.
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
VENDOR="$PLUGIN_ROOT/vendor"

if [[ ! -d "$VENDOR/node_modules" ]]; then
  echo "[voice] Installing dependencies..."
  (cd "$VENDOR" && npm install --silent)
  echo "[voice] Ready."
fi
