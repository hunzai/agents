---
name: speak
description: >
  Speak text aloud using ElevenLabs voice AI and play it immediately.
  Use when asked to speak, say, read aloud, narrate, or generate audio from text.
  Invoke with /elevenlabs:speak followed by the text to speak.
argument-hint: [text to speak]
disable-model-invocation: true
allowed-tools: Bash(*)
---

# Speak

Convert text to speech using ElevenLabs and play it immediately.
Saves audio to `/tmp/voice-speech.mp3`.

**Requires:** `ELEVENLABS_API_KEY` in environment or `.env`, and `mpv` or `ffmpeg` for playback.

## Steps

### 1. Build CLI (idempotent)

```bash
bash ${CLAUDE_SKILL_DIR}/../../scripts/setup.sh
```

### 2. Speak

```bash
node ${CLAUDE_SKILL_DIR}/../../vendor/tts/dist/cli.js speak $ARGUMENTS
```

Audio plays automatically. Output is JSON: `{ "path": "...", "voice": "...", "model": "...", "text": "..." }`

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--voice <id>` | Voice to use | Achar (`Vwq3FUaRDrPephO3Qaxs`) |
| `--model <id>` | Model to use | `eleven_flash_v2_5` |
| `--output <path>` | Output file | `/tmp/voice-speech.mp3` |
| `--no-play` | Save to file only, skip playback | — |

## Voice

| ID | Name | Style |
|----|------|-------|
| `Vwq3FUaRDrPephO3Qaxs` | Achar *(default)* | Male |

## Models

| ID | Latency | Languages |
|----|---------|-----------|
| `eleven_flash_v2_5` *(default)* | ~75ms | 32 |
| `eleven_turbo_v2_5` | Balanced | 32 |
| `eleven_multilingual_v2` | Highest quality | 29 |

## Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ELEVENLABS_API_KEY is not set` | Missing key | Add to `.env` |
| `401 Unauthorized` | Invalid key | Check key at elevenlabs.io/app/settings/api-keys |
| `422` | Bad voice/model ID | Check ID is correct |
| No audio plays | mpv/ffplay missing | Run `sudo apt-get install -y mpv` |
