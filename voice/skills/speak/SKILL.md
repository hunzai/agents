---
name: speak
description: Speak text aloud using ElevenLabs voice AI. Invoke manually with /voice:speak followed by the text.
argument-hint: [text to speak]
disable-model-invocation: true
allowed-tools: Bash(*)
---

# Speak

Convert text to speech using ElevenLabs and play it immediately.
Saves the audio to `/tmp/voice-speech.mp3`.

**Requires:** `ELEVENLABS_API_KEY` in environment, and `mpv` or `ffmpeg` for playback.

## Steps

### 1. Build CLI (idempotent — skips if already built)

```bash
bash ${CLAUDE_SKILL_DIR}/../../scripts/setup.sh
```

### 2. Speak

```bash
node ${CLAUDE_SKILL_DIR}/../../vendor/tts/dist/cli.js speak $ARGUMENTS
```

Audio plays automatically via the ElevenLabs SDK (uses `mpv` or `ffplay`).

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--voice <id>` | Voice to use | George (`JBFqnCBsd6RMkjVDRZzb`) |
| `--model <id>` | Model to use | `eleven_flash_v2_5` |
| `--output <path>` | Output file path | `/tmp/voice-speech.mp3` |
| `--no-play` | Save to file only, skip playback | — |

## Voices

```bash
node ${CLAUDE_SKILL_DIR}/../../vendor/tts/dist/cli.js voices
```

| Voice ID | Name | Gender | Style |
|----------|------|--------|-------|
| `JBFqnCBsd6RMkjVDRZzb` | George    | Male   | Narrative, deep — **default** |
| `nPczCjzI2devNBz1zQrb` | Brian     | Male   | Deep, authoritative |
| `iP95p4xoKVk53GoZ742B` | Chris     | Male   | Casual, conversational |
| `TX3LPaxmHKxFdv7VOQHJ` | Liam      | Male   | Young, energetic |
| `EXAVITQu4vr4xnSDxMaL` | Sarah     | Female | Soft, pleasant |
| `XB0fDUnXU5powFXDhCwa` | Charlotte | Female | Conversational, warm |
| `cgSgspJ2msm6clMCkdW9` | Jessica   | Female | Expressive, dynamic |
| `pFZP5JQG7iQjIQuC4Bku` | Lily      | Female | Calm, soothing |

## Models

```bash
node ${CLAUDE_SKILL_DIR}/../../vendor/tts/dist/cli.js models
```

| Model ID | Latency | Languages |
|----------|---------|-----------|
| `eleven_flash_v2_5`      | ~75ms — **default** | 32 |
| `eleven_turbo_v2_5`      | Balanced            | 32 |
| `eleven_multilingual_v2` | Highest quality     | 29 |

## Errors

| Code | Cause | Fix |
|------|-------|-----|
| 401 | Invalid API key | Check `ELEVENLABS_API_KEY` is set in `.env` |
| 422 | Invalid parameters | Run `cli.js voices` to verify voice ID |
| 429 | Rate limit | Wait and retry |
