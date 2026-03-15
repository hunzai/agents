---
name: seedream
description: >
  Generate images from .txt prompt files using bytedance/seedream-5-lite on Replicate.
  DEFAULT model — use for all new image generation ($0.035/image). Supports Urdu/Arabic
  text rendering, infographic diagrams, photorealistic and editorial photos.
  Invoke with /replicate:seedream followed by input and output directory paths.
argument-hint: <input-dir> <output-dir> [--aspect-ratio 4:3] [--size 2K] [--format jpg] [--force]
disable-model-invocation: true
allowed-tools: Bash(*)
---

# Generate Images (seedream) — DEFAULT

Generate one image per `.txt` prompt file using `bytedance/seedream-5-lite` on Replicate.
This is the **default and preferred** model for all image generation tasks.

**Requires:** `REPLICATE_API_TOKEN` in environment or `.env`.

## Steps

### 1. Build CLI (idempotent)

```bash
bash ${CLAUDE_SKILL_DIR}/../../scripts/setup.sh
```

### 2. Generate images

```bash
node ${CLAUDE_SKILL_DIR}/../../vendor/replicate/dist/cli.js seedream $ARGUMENTS
```

## Behaviour

- Reads every `.txt` file in `input-dir` (sorted alphabetically)
- Uses the file content as the image prompt
- Saves output as `<stem>.<format>` in `output-dir`
- Skips files that already have a matching output (use `--force` to overwrite)
- Output is always a `.jpg` or `.png` — no webp support

## Options

| Flag | Values | Default |
|------|--------|---------|
| `--aspect-ratio` | `1:1` `4:3` `3:4` `16:9` `9:16` `3:2` `2:3` `21:9` | `4:3` |
| `--size` | `2K` `3K` | `2K` |
| `--format` | `jpg` `png` | `jpg` |
| `--force` | overwrite existing images | off |

## Examples

```bash
/replicate:seedream ./prompts/ ./images/
/replicate:seedream ./prompts/ ./images/ --aspect-ratio 16:9 --size 3K
/replicate:seedream ./prompts/ ./images/ --format png --force
```

## Why Seedream over Banana?

| Feature | Seedream (default) | Banana |
|---------|-------------------|--------|
| Cost | $0.035/image | higher |
| Urdu/Arabic text rendering | Excellent | Limited |
| Infographic diagrams | Excellent | Good |
| Aspect ratios | 8 options incl. 2:3, 21:9 | 5 options |
| Max resolution | 3K | 2K |
| Sequential generation | Yes (auto) | No |
