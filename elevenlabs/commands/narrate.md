---
description: >
  Batch convert text files to audio using ElevenLabs TTS. One .txt in, one audio file out.
  Default voice: Achar (male), model: eleven_multilingual_v2. For file output, not playback.
  Use when asked to narrate, create audio from text, generate voiceover, or produce TTS files.
allowed-tools: Bash(*)
---

# Narrate — Text to Speech (ElevenLabs TTS)

Text file(s) → audio file(s) using ElevenLabs TTS.

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

### Step 3: Parse arguments

- INPUT = $ARGUMENTS[0] (required — .txt file or directory of .txt files)
- OUTPUT_DIR = $ARGUMENTS[1] or `<INPUT>/../audio/`
- Extract --voice, --model, --format flags if provided

### Step 4: Generate audio

If INPUT is a single file, create a temp directory with just that file:

```bash
mkdir -p /tmp/narrate-input && cp <INPUT> /tmp/narrate-input/
node ${CLAUDE_PLUGIN_ROOT}/vendor/elevenlabs/dist/cli.js tts /tmp/narrate-input/ <OUTPUT_DIR> [flags]
```

If INPUT is a directory:

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/elevenlabs/dist/cli.js tts <INPUT> <OUTPUT_DIR> [flags]
```

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
| `--voice` | ElevenLabs voice ID | `Vwq3FUaRDrPephO3Qaxs` (Achar) |
| `--model` | Model ID | `eleven_multilingual_v2` |
| `--format` | `mp3_44100_128`, `mp3_22050_32` | `mp3_44100_128` |
| `--force` | overwrite existing | off |
