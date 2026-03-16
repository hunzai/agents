#!/bin/bash
# Zero-cost usage logger — runs as PostToolUse hook, no LLM tokens consumed.
# Appends one line per CLI call to logs/usage.log.

LOG_DIR="$(cd "$(dirname "$0")/../.." && pwd)/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/usage.log"

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // .tool_input.file_path // "n/a"' | head -c 200)
SESSION=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Detect which plugin the command belongs to
PLUGIN="other"
case "$CMD" in
  *elevenlabs*) PLUGIN="elevenlabs" ;;
  *replicate*) PLUGIN="replicate" ;;
  *price/vendor*|*price-cli*) PLUGIN="price" ;;
  *trader/vendor*|*jupiter*) PLUGIN="trader" ;;
  *playwright-cli*) PLUGIN="browser" ;;
esac

echo "$TS|$SESSION|$TOOL|$PLUGIN|$CMD" >> "$LOG"
exit 0
