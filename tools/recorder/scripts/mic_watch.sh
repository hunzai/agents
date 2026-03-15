#!/usr/bin/env bash
# Detect mic plug/unplug via udevadm and record in time-based chunks with ffmpeg.
# Already-attached mics are recorded immediately on start.
# New mics are detected the instant they are plugged in.
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────

OUT_DIR="${OUT_DIR:-recordings}"
CHUNK_SECONDS="${CHUNK_SECONDS:-300}"
FORMAT="${FORMAT:-flac}"     # flac | wav | mp3 | opus
QUALITY="${QUALITY:-}"       # flac: 0-12  mp3: 0-9  opus: 32k-192k  wav: ignored
LOGLEVEL="${LOGLEVEL:-warning}"

# ── Chapter 1: helpers ────────────────────────────────────────────────────────

log() { echo "[$(date '+%Y-%m-%dT%H:%M:%S')] $*"; }

die() { echo "[recording] ERROR: $*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1  (install: $2)"
}

# Return the PipeWire node.name for the default audio capture source.
# Waits up to $1 seconds for PipeWire to register a newly arrived device.
resolve_source() {
  local retries="${1:-5}"
  local i node
  for ((i = 0; i < retries; i++)); do
    node=$(wpctl inspect "$(wpctl status \
      | grep -A1 'Sources:' \
      | grep -oP '(?<=\*\s{3})\d+' \
      | head -1)" 2>/dev/null \
      | grep 'node\.name' \
      | grep -oP '(?<=")[^"]+' || true)
    if [[ -n "$node" ]]; then
      echo "$node"
      return 0
    fi
    sleep 1
  done
  echo "default"
}

# ── Chapter 2: build codec args from FORMAT + QUALITY ────────────────────────

# Sets globals: CODEC_ARGS  CONTAINER  EXT
build_codec_args() {
  case "$FORMAT" in
    flac)
      local level="${QUALITY:-8}"   # 0=fastest 12=smallest, all lossless
      CODEC_ARGS="-c:a flac -compression_level ${level} -ar 44100 -ac 1"
      CONTAINER="flac"
      EXT="flac"
      ;;
    wav)
      CODEC_ARGS="-c:a pcm_s16le -ar 44100 -ac 1"
      CONTAINER="wav"
      EXT="wav"
      ;;
    mp3)
      local q="${QUALITY:-2}"       # VBR: 0=best quality, 9=smallest
      CODEC_ARGS="-c:a libmp3lame -q:a ${q} -ar 44100 -ac 1"
      CONTAINER="mp3"
      EXT="mp3"
      ;;
    opus)
      local brate="${QUALITY:-96k}" # 32k-192k; 96k is clear voice + small
      CODEC_ARGS="-c:a libopus -b:a ${brate} -vbr on -application voip -ar 48000 -ac 1"
      CONTAINER="ogg"
      EXT="ogg"
      ;;
    *)
      die "Unknown format '${FORMAT}'. Valid: flac wav mp3 opus"
      ;;
  esac
}

# ── Chapter 3: start a chunked ffmpeg recording loop ─────────────────────────

start_recording() {
  local source="$1"
  mkdir -p "$OUT_DIR"

  log "Format:  ${FORMAT} (${CONTAINER})"
  log "Source:  ${source}"
  log "Chunks:  ${CHUNK_SECONDS}s each → ${OUT_DIR}/"
  log "Press Ctrl+C to stop."

  # shellcheck disable=SC2086
  ffmpeg \
    -hide_banner -loglevel "$LOGLEVEL" \
    -f pulse -i "$source" \
    $CODEC_ARGS \
    -f segment \
    -segment_time "$CHUNK_SECONDS" \
    -strftime 1 \
    -reset_timestamps 1 \
    -segment_format "$CONTAINER" \
    "${OUT_DIR}/chunk-%Y%m%d-%H%M%S.${EXT}"
}

# ── Chapter 4: detect already-attached mic ────────────────────────────────────

start_if_mic_present() {
  local capture_nodes
  capture_nodes=$(ls /sys/class/sound/ 2>/dev/null | grep -E 'pcmC[0-9]+D[0-9]+c$' || true)

  if [[ -n "$capture_nodes" ]]; then
    log "Mic already attached. Resolving source..."
    local source
    source=$(resolve_source 3)
    start_recording "$source"
  fi
}

# ── Chapter 5: watch for new mic plug events via udevadm ─────────────────────

watch_for_plug() {
  log "Watching for mic plug events (udevadm)..."

  local action="" devname=""

  udevadm monitor --udev --subsystem-match=sound --property | \
  while IFS= read -r line; do
    line="${line%$'\r'}"

    if [[ -z "$line" ]]; then
      if [[ "$action" == "add" && "$devname" == *pcmC*D*c ]]; then
        log "Mic plugged in: $devname"
        sleep 1
        local source
        source=$(resolve_source 5)
        start_recording "$source"
        log "Recording stopped. Watching for next plug event..."
      fi
      action=""; devname=""
      continue
    fi

    case "$line" in
      ACTION=*)  action="${line#ACTION=}"  ;;
      DEVNAME=*) devname="${line#DEVNAME=}" ;;
    esac
  done
}

# ── Entrypoint ────────────────────────────────────────────────────────────────

main() {
  need_cmd ffmpeg   "sudo apt-get install -y ffmpeg"
  need_cmd wpctl    "sudo apt-get install -y wireplumber"
  need_cmd udevadm  "sudo apt-get install -y udev"

  build_codec_args

  log "Starting mic recorder (format=${FORMAT}, chunk=${CHUNK_SECONDS}s)"

  start_if_mic_present
  watch_for_plug
}

main "$@"
