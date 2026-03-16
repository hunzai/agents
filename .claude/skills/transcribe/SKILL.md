---
name: transcribe
description: >
  Transcribe audio files to text. Takes a directory of audio files, transcribes
  each to .txt, then combines into a single clean transcript. Supports flac,
  wav, mp3, ogg, opus, m4a, webm. Use when asked to transcribe audio,
  convert speech to text, or extract text from recordings.
metadata:
  category: content
disable-model-invocation: true
argument-hint: <audio-dir> [output-dir]
allowed-tools: Bash(*)
context: fork
---

# Transcribe Audio

Audio directory → individual .txt per file → combined transcript.txt.

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

- AUDIO_DIR = $ARGUMENTS[0] (required)
- OUTPUT_DIR = $ARGUMENTS[1] or `<AUDIO_DIR>/../transcribe/`

### Step 4: Transcribe

```bash
node elevenlabs/vendor/elevenlabs/dist/cli.js stt <AUDIO_DIR> <OUTPUT_DIR>/chunks/
```

Processes all `.flac`, `.wav`, `.mp3`, `.ogg`, `.opus`, `.m4a`, `.webm` files
in sorted order. One `.txt` per audio file.

### Step 5: Combine into single transcript

```bash
node elevenlabs/vendor/elevenlabs/dist/cli.js combine <OUTPUT_DIR>/chunks/ <OUTPUT_DIR>/transcript.txt
```

Merges all chunk .txt files (sorted by name) with `\n\n` between sections.

### Step 6: Report

```
Input:      <AUDIO_DIR> (N audio files)
Chunks:     <OUTPUT_DIR>/chunks/ (N .txt files)
Transcript: <OUTPUT_DIR>/transcript.txt (N words)
```

## Errors

| Error | Cause | Fix |
|-------|-------|-----|
| API key missing | ELEVENLABS_API_KEY not set | Add to `.env` |
| No audio files | Wrong path or empty dir | Check argument |
| cli.js not found | CLI not built | Run Step 2 |
