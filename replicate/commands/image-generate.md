---
description: >
  Generate images from text prompts. Default: seedream ($0.035/img). Also supports banana.
  Use when asked to generate images, create illustrations, or make visuals.
allowed-tools: Bash(*)
---

# Generate Images (Replicate)

Text prompt files → images. One image per .txt file.

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

- PROMPTS_DIR = $ARGUMENTS[0] (required — directory of .txt prompt files)
- OUTPUT_DIR = $ARGUMENTS[1] (required — where to save images)
- MODEL = extract `--model` flag or default to `seedream`
- Pass remaining flags through (--aspect-ratio, --size, --format, --force)

### Step 4: Generate

```bash
# seedream (default, cheaper, better text rendering)
node ${CLAUDE_PLUGIN_ROOT}/vendor/replicate/dist/cli.js seedream <PROMPTS_DIR> <OUTPUT_DIR> [flags]

# banana (use only if specifically requested)
node ${CLAUDE_PLUGIN_ROOT}/vendor/replicate/dist/cli.js banana <PROMPTS_DIR> <OUTPUT_DIR> [flags]
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
| seedream (default) | $0.035/img | Text rendering, infographics, editorial |
| banana | ~$0.04/img | Anime style, creative illustrations |

## Seedream options

| Flag | Values | Default |
|------|--------|---------|
| `--aspect-ratio` | `1:1` `4:3` `3:4` `16:9` `9:16` `3:2` `2:3` `21:9` | `4:3` |
| `--size` | `2K` `3K` | `2K` |
| `--format` | `jpg` `png` | `jpg` |
| `--force` | overwrite existing | off |

## Banana options

| Flag | Values | Default |
|------|--------|---------|
| `--aspect-ratio` | `1:1` `4:3` `3:4` `16:9` `9:16` | `4:3` |
| `--resolution` | `1K` `2K` | `1K` |
| `--format` | `jpg` `png` `webp` | `jpg` |
| `--force` | overwrite existing | off |
