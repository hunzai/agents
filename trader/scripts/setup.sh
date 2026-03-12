#!/usr/bin/env bash
# Builds vendor CLIs the first time the jupiter-trader agent starts.
# Idempotent: skips any package that already has a dist/ directory.
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
VENDOR="$PLUGIN_ROOT/vendor"

build_if_needed() {
  local pkg="$1"
  local dir="$VENDOR/$pkg"

  if [[ ! -d "$dir/dist" ]]; then
    echo "[inti] Building $pkg..."
    (cd "$dir" && npm install --silent && npm run build --silent)
    echo "[inti] $pkg ready."
  fi
}

# Build in dependency order: common must precede jupiter
build_if_needed common
build_if_needed jupiter
build_if_needed price
