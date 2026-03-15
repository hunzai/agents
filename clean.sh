#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Cleaning dist/ and node_modules/ from all plugins..."

find "$ROOT" -maxdepth 5 -type d \( -name "dist" -o -name "node_modules" \) | while read -r dir; do
  echo "  rm -rf $dir"
  rm -rf "$dir"
done

echo "Done. Run each plugin's setup.sh to rebuild."
