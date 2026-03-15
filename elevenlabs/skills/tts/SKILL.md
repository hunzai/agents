---
name: tts
description: Convert a directory of .txt files to audio using ElevenLabs TTS. Invoke with /elevenlabs:tts followed by the input directory path.
argument-hint: <input-dir> [output-dir] [--voice ID] [--model ID] [--format FMT] [--force]
disable-model-invocation: true
allowed-tools: Bash(*)
---

# Text-to-Speech (TTS)

Convert all `.txt` files in a directory to audio using ElevenLabs.

**Requires:** `ELEVENLABS_API_KEY` in environment or `.env`.

## Steps

### 1. Build CLI (idempotent)

```bash
bash ${CLAUDE_SKILL_DIR}/../../scripts/setup.sh
```

### 2. Generate audio

```bash
node ${CLAUDE_SKILL_DIR}/../../vendor/elevenlabs/dist/cli.js tts $ARGUMENTS
```

## Behaviour

- Processes all `.txt` files in the input directory
- Writes one audio file per `.txt`, named identically (e.g. `section-01.txt` → `section-01.mp3`)
- Default output: `<input-dir>/../audio/`
- Skips files that already have output (use `--force` to overwrite)

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--voice <id>` | Voice ID | Achar (`Vwq3FUaRDrPephO3Qaxs`) |
| `--model <id>` | Model ID | `eleven_multilingual_v2` |
| `--format <fmt>` | Output format | `mp3_44100_128` |
| `--force` | Re-synthesize already-processed files | |

## Voice

| ID | Name | Style |
|----|------|-------|
| `Vwq3FUaRDrPephO3Qaxs` | Achar *(default)* | Male |

## Models

| ID | Quality |
|----|---------|
| `eleven_multilingual_v2` *(default)* | Highest quality, 29 languages |
| `eleven_turbo_v2_5` | Balanced, 32 languages |
| `eleven_flash_v2_5` | Fast (~75ms), 32 languages |

## Examples

```bash
/elevenlabs:tts ./transcripts/
/elevenlabs:tts ./transcripts/ ./audio/ --model eleven_flash_v2_5 --force
```
