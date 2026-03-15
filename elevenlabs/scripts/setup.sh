#!/usr/bin/env bash
# Build ElevenLabs vendor CLIs. Idempotent: skips packages that already have dist/.
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
VENDOR="$PLUGIN_ROOT/vendor"

# ── Audio playback (required by speak/tts) ──────────────────────────────────
# ElevenLabs SDK play() needs mpv or ffplay. Install mpv if neither is present.
install_audio_player() {
  if command -v mpv &>/dev/null || command -v ffplay &>/dev/null; then
    return 0
  fi
  echo "[elevenlabs] Installing mpv for audio playback..."
  if command -v apt-get &>/dev/null; then
    sudo apt-get install -y -q mpv
  elif command -v brew &>/dev/null; then
    brew install mpv --quiet
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y -q mpv
  elif command -v pacman &>/dev/null; then
    sudo pacman -S --noconfirm mpv
  else
    echo "[elevenlabs] WARNING: Cannot install mpv automatically. Install manually: https://mpv.io"
  fi
}

install_audio_player

# ── Node.js CLI builds ───────────────────────────────────────────────────────
build_if_needed() {
  local pkg="$1"
  local dir="$VENDOR/$pkg"

  if [[ ! -d "$dir/dist" ]]; then
    echo "[elevenlabs] Building $pkg..."
    (cd "$dir" && npm install --silent && npm run build --silent)
    echo "[elevenlabs] $pkg ready."
  fi
}

# tts  — speak text aloud (single text → audio + playback)
build_if_needed tts

# elevenlabs — batch STT (audio dir → transcripts) + batch TTS (text dir → audio)
build_if_needed elevenlabs
