#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$ROOT_DIR/scripts/mic_watch.sh"

export OUT_DIR="${OUT_DIR:-$ROOT_DIR/recordings}"
export CHUNK_SECONDS="${CHUNK_SECONDS:-300}"
export FORMAT="${FORMAT:-flac}"
export QUALITY="${QUALITY:-}"
export LOGLEVEL="${LOGLEVEL:-warning}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out-dir)  OUT_DIR="$2";       shift 2 ;;
    --chunk)    CHUNK_SECONDS="$2"; shift 2 ;;
    --format)   FORMAT="$2";        shift 2 ;;
    --quality)  QUALITY="$2";       shift 2 ;;
    --loglevel) LOGLEVEL="$2";      shift 2 ;;
    -h|--help)
      cat <<'EOF'
Usage: ./run.sh [OPTIONS]

  --out-dir DIR    Output directory            (default: recordings)
  --chunk SECS     Seconds per file            (default: 300)
  --format FORMAT  Output format               (default: flac)
  --quality VALUE  Quality setting per format  (default: per format)
  --loglevel LVL   ffmpeg log verbosity        (default: warning)

Formats and quality values:
  flac   Lossless, ~50% smaller than WAV. Best for ElevenLabs and processing.
         --quality 0-12  (compression level; 0=fastest, 12=smallest, all lossless)
         default: 8

  wav    Raw PCM. Maximum compatibility, largest files.
         --quality ignored

  mp3    Compressed. Universal compatibility.
         --quality 0-9   (VBR; 0=best quality, 9=smallest file)
         default: 2

  opus   Smallest files, great for voice. Ogg container.
         --quality 32k-192k  (bitrate)
         default: 96k

Examples:
  ./run.sh                                  # flac, 5-min chunks
  ./run.sh --chunk 60                       # flac, 1-min chunks
  ./run.sh --format wav                     # lossless raw
  ./run.sh --format mp3 --quality 0         # best MP3 quality
  ./run.sh --format opus --quality 128k     # high-quality voice
  ./run.sh --out-dir /tmp/mics --chunk 120
EOF
      exit 0 ;;
    *) echo "Unknown flag: $1  (run ./run.sh --help)"; exit 1 ;;
  esac
done

exec bash "$SCRIPT"
