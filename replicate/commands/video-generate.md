---
description: >
  Generate short videos from images using wan-video. Each image + paired .txt prompt becomes a .mp4.
  Use when asked to create videos from images, animate images, or generate video content.
allowed-tools: Bash(*)
---

# Generate Video (Replicate wan-video)

Images + prompt .txt files → short .mp4 videos.

## How pairing works

The CLI scans the input directory for image files (.jpg, .png). For each
image, it looks for a .txt file with the same stem name as the motion prompt:

```
images-dir/
  01-inflation.jpg + 01-inflation.txt → 01-inflation.mp4
  02-bazaar.jpg    + 02-bazaar.txt    → 02-bazaar.mp4
```

If no .txt found, a generic motion prompt is used.

## Steps

### Step 1: Environment check

```bash
echo "REPLICATE: ${REPLICATE_API_TOKEN:-NOT SET}"
```

If NOT SET, stop.

### Step 2: Build CLI (idempotent)

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
```

### Step 3: Parse arguments

- IMAGES_DIR = $ARGUMENTS[0] (required — directory with images + optional .txt prompts)
- OUTPUT_DIR = $ARGUMENTS[1] (required — where to save .mp4 files)
- Pass remaining flags through (--resolution, --frames, --fps, --force)

### Step 4: Ensure prompts are alongside images

If prompt .txt files are in a separate directory, copy them next to the images:

```bash
cp <prompts-dir>/*.txt <IMAGES_DIR>/
```

### Step 5: Generate

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/replicate/dist/cli.js video <IMAGES_DIR> <OUTPUT_DIR> [flags]
```

### Step 6: Report

```
Input:   <IMAGES_DIR> (N images)
Output:  <OUTPUT_DIR> (N .mp4 videos)
```

## Options

| Flag | Values | Default |
|------|--------|---------|
| `--resolution` | `480p` `720p` | `480p` |
| `--frames` | number of frames | `81` |
| `--fps` | frames per second | `16` |
| `--force` | overwrite existing | off |
