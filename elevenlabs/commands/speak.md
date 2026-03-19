---
description: >
  Speak text aloud with immediate playback using ElevenLabs. For interactive real-time use.
  Use when asked to speak, say, or read aloud.
allowed-tools: Bash(*)
---

# Speak Aloud (ElevenLabs)

Convert text to speech and play it immediately.

**Requires:** `ELEVENLABS_API_KEY` in environment or `.env`, and `mpv` or `ffmpeg` for playback.

## Steps

### Step 1: Environment check

```bash
echo "ELEVENLABS: ${ELEVENLABS_API_KEY:-NOT SET}"
```

If NOT SET, stop.

### Step 2: Build CLI (idempotent)

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
```

### Step 3: Speak

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/elevenlabs/dist/cli.js speak $ARGUMENTS
```

Audio plays automatically. Output is JSON: `{ "path": "...", "voice": "...", "model": "...", "text": "..." }`

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--voice <id>` | Voice to use | Achar (`Vwq3FUaRDrPephO3Qaxs`) |
| `--model <id>` | Model to use | `eleven_flash_v2_5` |
| `--output <path>` | Output file | `/tmp/voice-speech.mp3` |
| `--no-play` | Save to file only, skip playback | — |
