#!/usr/bin/env bash
# Builds vendor CLIs the first time the price-analyst agent starts.
# Idempotent: skips any package that already has a dist/ directory.
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
VENDOR="$PLUGIN_ROOT/vendor"

build_if_needed() {
  local pkg="$1"
  local dir="$VENDOR/$pkg"

  if [[ ! -d "$dir/dist" ]]; then
    echo "[price] Building $pkg..."
    (cd "$dir" && npm install --silent && npm run build --silent)
    echo "[price] $pkg ready."
  fi
}

build_if_needed price
