---
name: audio/speak
description: >
  Speak text aloud using ElevenLabs voice AI and play it immediately.
  Use when asked to speak, say, read aloud, or generate audio from text.
metadata:
  category: audio
disable-model-invocation: true
argument-hint: [text to speak]
allowed-tools: Bash(*)
context: fork
---

# Speak Aloud (ElevenLabs)

Convert text to speech and play it immediately.
Saves audio to `/tmp/voice-speech.mp3`.

**Requires:** `ELEVENLABS_API_KEY` in environment or `.env`, and `mpv` or `ffmpeg` for playback.

## Steps

### Step 1: Build CLI (idempotent)

```bash
bash elevenlabs/scripts/setup.sh
```

### Step 2: Speak

```bash
node elevenlabs/vendor/elevenlabs/dist/cli.js speak $ARGUMENTS
```

Audio plays automatically. Output is JSON: `{ "path": "...", "voice": "...", "model": "...", "text": "..." }`

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--voice <id>` | Voice to use | Achar (`Vwq3FUaRDrPephO3Qaxs`) |
| `--model <id>` | Model to use | `eleven_flash_v2_5` |
| `--output <path>` | Output file | `/tmp/voice-speech.mp3` |
| `--no-play` | Save to file only, skip playback | — |

## Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ELEVENLABS_API_KEY is not set` | Missing key | Add to `.env` |
| `401 Unauthorized` | Invalid key | Check key at elevenlabs.io |
| No audio plays | mpv/ffplay missing | Run `sudo apt-get install -y mpv` |
