---
name: generate-images
description: >
  Generate images from text prompt files using Replicate. Reads .txt files
  from a directory, generates one image per prompt. Default model: seedream
  ($0.035/image). Supports infographics, illustrations, photorealistic.
  Use when asked to generate images, create illustrations, or make visuals
  from text descriptions.
metadata:
  category: content
disable-model-invocation: true
argument-hint: <prompts-dir> <output-dir> [--model seedream|banana] [--aspect-ratio 16:9]
allowed-tools: Bash(*)
context: fork
---

# Generate Images

Text prompt files → images. One image per .txt file.

## Steps

### Step 1: Environment check

```bash
echo "REPLICATE: ${REPLICATE_API_TOKEN:-NOT SET}"
```

If NOT SET, stop.

### Step 2: Build CLI (idempotent)

```bash
bash replicate/scripts/setup.sh
```

### Step 3: Parse arguments

- PROMPTS_DIR = $ARGUMENTS[0] (required — directory of .txt prompt files)
- OUTPUT_DIR = $ARGUMENTS[1] (required — where to save images)
- MODEL = extract `--model` flag or default to `seedream`
- Pass remaining flags through (--aspect-ratio, --size, --format, --force)

### Step 4: Generate

```bash
# seedream (default, cheaper, better text rendering)
node replicate/vendor/replicate/dist/cli.js seedream <PROMPTS_DIR> <OUTPUT_DIR> [flags]

# banana (legacy, use only if specifically requested)
node replicate/vendor/replicate/dist/cli.js banana <PROMPTS_DIR> <OUTPUT_DIR> [flags]
```

Each .txt file in PROMPTS_DIR → one image in OUTPUT_DIR with same stem name.

### Step 5: Report

```
Model:   seedream | banana
Input:   <PROMPTS_DIR> (N .txt files)
Output:  <OUTPUT_DIR> (N images)
```

## Models

| Model | Cost | Best for |
|-------|------|----------|
| seedream (default) | $0.035/img | Urdu/Arabic text, infographics, editorial |
| banana | higher | Anime style, creative illustrations |

## Common flags

| Flag | Values | Default |
|------|--------|---------|
| `--aspect-ratio` | `1:1` `4:3` `16:9` `9:16` `3:2` | `4:3` |
| `--format` | `jpg` `png` | `jpg` |
| `--force` | overwrite existing | off |
