---
name: speak
description: Speak text aloud using ElevenLabs voice AI. Invoke manually with /voice:speak followed by the text.
argument-hint: <text to speak>
disable-model-invocation: true
allowed-tools: Bash
---

# Speak

Generate speech from text using ElevenLabs and play it.

**Requires:** `ELEVENLABS_API_KEY` in environment.

## Steps

Run these three bash commands in order:

### 1. Install dependencies (idempotent — skips if already installed)

```bash
bash ${CLAUDE_SKILL_DIR}/../../../scripts/setup.sh
```

### 2. Generate speech

```bash
node ${CLAUDE_SKILL_DIR}/../../../vendor/speak.mjs $ARGUMENTS
```

### 3. Play the audio

```bash
xdg-open /tmp/voice-speech.mp3
```

## Voices

Change the voice by editing the `voice_id` in `speak.mjs`:

| Voice ID | Name | Style |
|----------|------|-------|
| `JBFqnCBsd6RMkjVDRZzb` | George | Male, narrative — default |
| `EXAVITQu4vr4xnSDxMaL` | Sarah | Female, soft |
| `onwK4e9ZLuTAKqWW03F9` | Daniel | Male, authoritative |
| `XB0fDUnXU5powFXDhCwa` | Charlotte | Female, conversational |

## Errors

| Code | Cause | Fix |
|------|-------|-----|
| 401 | Invalid API key | Check `ELEVENLABS_API_KEY` is set in `.env` |
| 422 | Invalid parameters | Check voice_id in `speak.mjs` |
| 429 | Rate limit | Wait and retry |
