#!/usr/bin/env bash
# Install system dependencies for the mic recorder.
# No Python or virtual environment required — pure bash + ffmpeg + udevadm.
set -euo pipefail

INSTALL_SYSTEM_DEPS=false
if [[ "${1:-}" == "--with-system-deps" ]]; then
  INSTALL_SYSTEM_DEPS=true
fi

if $INSTALL_SYSTEM_DEPS; then
  if command -v apt-get >/dev/null 2>&1; then
    echo "[recording] Installing system dependencies..."
    sudo apt-get update -y -q
    sudo apt-get install -y -q ffmpeg wireplumber
  else
    echo "[recording] Unsupported package manager."
    echo "[recording] Install manually: ffmpeg wireplumber"
    exit 1
  fi
fi

ok=true
for cmd in ffmpeg wpctl udevadm; do
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "[recording] OK: $cmd"
  else
    echo "[recording] MISSING: $cmd"
    ok=false
  fi
done

if ! $ok; then
  echo "[recording] Install missing commands with: sudo apt-get install -y ffmpeg wireplumber"
  exit 1
fi

chmod +x "$(dirname "$0")/scripts/mic_watch.sh"

echo "[recording] Install complete."
echo "[recording] Run: ./run.sh"
