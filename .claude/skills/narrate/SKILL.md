---
name: narrate
description: >
  Convert text to speech audio using ElevenLabs TTS. Takes a text file or
  directory of .txt files and generates audio. Default voice: Achar (male),
  model: eleven_multilingual_v2. Use when asked to narrate, read aloud,
  create audio from text, or generate voiceover.
metadata:
  category: content
disable-model-invocation: true
argument-hint: <input-file-or-dir> [output-dir] [--voice ID] [--model ID]
allowed-tools: Bash(*)
context: fork
---

# Narrate — Text to Speech

Text file(s) → audio file(s) using ElevenLabs TTS.

## Steps

### Step 1: Environment check

```bash
echo "ELEVENLABS: ${ELEVENLABS_API_KEY:-NOT SET}"
```

If NOT SET, stop.

### Step 2: Build CLI (idempotent)

```bash
bash elevenlabs/scripts/setup.sh
```

### Step 3: Parse arguments

- INPUT = $ARGUMENTS[0] (required — .txt file or directory of .txt files)
- OUTPUT_DIR = $ARGUMENTS[1] or `<INPUT>/../audio/`
- Extract --voice, --model, --format flags if provided

### Step 4: Generate audio

If INPUT is a single file, create a temp directory with just that file:

```bash
mkdir -p /tmp/narrate-input && cp <INPUT> /tmp/narrate-input/
node elevenlabs/vendor/elevenlabs/dist/cli.js tts /tmp/narrate-input/ <OUTPUT_DIR> [flags]
```

If INPUT is a directory:

```bash
node elevenlabs/vendor/elevenlabs/dist/cli.js tts <INPUT> <OUTPUT_DIR> [flags]
```

Each .txt → one audio file with the same stem name.

### Step 5: Report

```
Input:   <INPUT> (N .txt files)
Output:  <OUTPUT_DIR> (N audio files)
Voice:   Achar (Vwq3FUaRDrPephO3Qaxs) or specified
Model:   eleven_multilingual_v2 or specified
```

## Options

| Flag | Values | Default |
|------|--------|---------|
| `--voice` | ElevenLabs voice ID | `Vwq3FUaRDrPephO3Qaxs` (Achar, male) |
| `--model` | Model ID | `eleven_multilingual_v2` |
| `--format` | `mp3_44100_128`, `mp3_22050_32` | `mp3_44100_128` |
| `--force` | overwrite existing | off |

## Models

| Model | Quality | Languages |
|-------|---------|-----------|
| `eleven_multilingual_v2` (default) | Highest | 29 |
| `eleven_turbo_v2_5` | Balanced | 32 |
| `eleven_flash_v2_5` | Fast (~75ms) | 32 |
