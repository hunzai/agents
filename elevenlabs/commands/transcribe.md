---
description: >
  Transcribe audio files to text using ElevenLabs STT. Takes a directory of audio files,
  outputs per-file .txt and a combined transcript. Supports flac, wav, mp3, ogg, opus, m4a, webm.
allowed-tools: Bash(*)
---

# Transcribe Audio (ElevenLabs STT)

Audio directory → individual .txt per file → combined transcript.txt.

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

- AUDIO_DIR = $ARGUMENTS[0] (required)
- OUTPUT_DIR = $ARGUMENTS[1] or `<AUDIO_DIR>/../transcribe/`

### Step 4: Transcribe

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/elevenlabs/dist/cli.js stt <AUDIO_DIR> <OUTPUT_DIR>/chunks/
```

Processes all `.flac`, `.wav`, `.mp3`, `.ogg`, `.opus`, `.m4a`, `.webm` files
in sorted order. One `.txt` per audio file.

### Step 5: Combine into single transcript

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/elevenlabs/dist/cli.js combine <OUTPUT_DIR>/chunks/ <OUTPUT_DIR>/transcript.txt
```

### Step 6: Report

```
Input:      <AUDIO_DIR> (N audio files)
Chunks:     <OUTPUT_DIR>/chunks/ (N .txt files)
Transcript: <OUTPUT_DIR>/transcript.txt
```
