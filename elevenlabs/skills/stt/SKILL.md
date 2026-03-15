---
name: stt
description: Transcribe a directory of audio files to individual .txt files, then combine them into one. Invoke with /elevenlabs:stt followed by the audio directory path.
argument-hint: <audio-dir> [output-dir] [--force]
disable-model-invocation: true
allowed-tools: Bash(*)
---

# Speech-to-Text → Combined Transcript

Transcribe all audio files in a directory, then combine the per-file `.txt` outputs
into a single transcript file.

**Requires:** `ELEVENLABS_API_KEY` in environment or `.env`.

## Steps

### 1. Build CLI (idempotent)

```bash
bash ${CLAUDE_SKILL_DIR}/../../scripts/setup.sh
```

### 2. Transcribe each audio file → individual .txt

```bash
node ${CLAUDE_SKILL_DIR}/../../vendor/elevenlabs/dist/cli.js stt $ARGUMENTS
```

Default output dir: `<audio-dir>/../transcribe/`

### 3. Combine all .txt files into one transcript

```bash
node ${CLAUDE_SKILL_DIR}/../../vendor/elevenlabs/dist/cli.js combine <transcribe-dir> <output-file>
```

## Behaviour

- Processes all `.flac`, `.wav`, `.mp3`, `.ogg`, `.opus`, `.m4a`, `.webm` files in sorted order
- Writes one `.txt` per audio file (e.g. `chunk-001.flac` → `chunk-001.txt`)
- Combine merges all `.txt` files (sorted by name) into one file with `\n\n` between sections
- Skips files that already have output (use `--force` to overwrite)

## Example

```bash
/elevenlabs:stt ./recordings/
# then combine:
node ${CLAUDE_SKILL_DIR}/../../vendor/elevenlabs/dist/cli.js combine ./transcribe/ ./output/transcript.txt
```
