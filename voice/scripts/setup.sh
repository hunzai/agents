#!/usr/bin/env bash
# Builds vendor CLIs and installs system audio dependencies.
# Idempotent: skips any package that already has a dist/ directory.
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
VENDOR="$PLUGIN_ROOT/vendor"

# ── Audio playback ──────────────────────────────────────────────────────────
# ElevenLabs SDK play() requires mpv or ffmpeg (ffplay). Install mpv if
# neither is available.
install_audio_player() {
  if command -v mpv &>/dev/null || command -v ffplay &>/dev/null; then
    return 0
  fi

  echo "[voice] Installing mpv for audio playback..."
  if command -v apt-get &>/dev/null; then
    sudo apt-get install -y -q mpv
  elif command -v brew &>/dev/null; then
    brew install mpv --quiet
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y -q mpv
  elif command -v pacman &>/dev/null; then
    sudo pacman -S --noconfirm mpv
  else
    echo "[voice] WARNING: Could not install mpv automatically."
    echo "[voice] Please install mpv or ffmpeg manually: https://mpv.io"
    return 1
  fi
  echo "[voice] mpv installed."
}

install_audio_player

# ── Node.js CLI build ────────────────────────────────────────────────────────
build_if_needed() {
  local pkg="$1"
  local dir="$VENDOR/$pkg"

  if [[ ! -d "$dir/dist" ]]; then
    echo "[voice] Building $pkg..."
    (cd "$dir" && npm install --silent && npm run build --silent)
    echo "[voice] $pkg ready."
  fi
}

build_if_needed tts
