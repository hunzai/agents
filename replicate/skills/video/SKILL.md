---
name: video
description: >
  Generate video from images using wan-video/wan-2.2-i2v-fast on Replicate.
  Each image in the input directory is paired with a .txt prompt file of the
  same name and turned into a short .mp4 video. Pairs naturally with seedream
  output. Invoke with /replicate:video followed by input and output directories.
argument-hint: <input-dir> <output-dir> [--resolution 480p] [--frames 81] [--fps 16] [--force]
disable-model-invocation: true
allowed-tools: Bash(*)
---

# Generate Video (image-to-video)

Turn images into short videos using `wan-video/wan-2.2-i2v-fast` on Replicate.

**Requires:** `REPLICATE_API_TOKEN` in environment or `.env`.

## How pairing works

The CLI scans the input directory for image files (`.jpg`, `.png`). For each
image, it looks for a `.txt` file with the same stem name to use as the prompt:

```
input-dir/
  01-inflation.jpg    + 01-inflation.txt  →  01-inflation.mp4
  02-bazaar.jpg       + 02-bazaar.txt     →  02-bazaar.mp4
```

This pairs naturally with seedream output where prompts/ and images/ share
filenames. Copy (or symlink) the prompt .txt files into the images directory
before running.

If no matching .txt is found, a generic motion prompt is used.

## Steps

### 1. Build CLI (idempotent)

```bash
bash ${CLAUDE_SKILL_DIR}/../../scripts/setup.sh
```

### 2. Generate videos

```bash
node ${CLAUDE_SKILL_DIR}/../../vendor/replicate/dist/cli.js video $ARGUMENTS
```

## Options

| Flag | Values | Default |
|------|--------|---------|
| `--resolution` | `480p` `720p` | `480p` |
| `--frames` | number of frames | `81` |
| `--fps` | frames per second | `16` |
| `--sample-shift` | shift factor | `12` |
| `--no-fast` | disable speed optimization | off |
| `--force` | overwrite existing videos | off |

## Examples

```bash
/replicate:video ./images/ ./videos/
/replicate:video ./images/ ./videos/ --resolution 720p
/replicate:video ./images/ ./videos/ --frames 81 --fps 16 --force
```
