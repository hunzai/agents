#!/usr/bin/env bash
# Build the Replicate vendor CLI. Idempotent: skips if dist/ already exists.
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
VENDOR="$PLUGIN_ROOT/vendor"

build_if_needed() {
  local pkg="$1"
  local dir="$VENDOR/$pkg"

  if [[ ! -d "$dir/dist" ]]; then
    echo "[replicate] Building $pkg..."
    (cd "$dir" && npm install --silent && npm run build --silent)
    echo "[replicate] $pkg ready."
  fi
}

build_if_needed replicate
