---
name: banana
description: Generate images from .txt prompt files using google/nano-banana-pro on Replicate. Invoke with /replicate:banana followed by input and output directory paths.
argument-hint: <input-dir> <output-dir> [--aspect-ratio 4:3] [--resolution 2K] [--format jpg] [--force]
disable-model-invocation: true
allowed-tools: Bash(*)
---

# Generate Images (banana)

Generate one image per `.txt` prompt file using `google/nano-banana-pro` on Replicate.

**Requires:** `REPLICATE_API_TOKEN` in environment or `.env`.

## Steps

### 1. Build CLI (idempotent)

```bash
bash ${CLAUDE_SKILL_DIR}/../../scripts/setup.sh
```

### 2. Generate images

```bash
node ${CLAUDE_SKILL_DIR}/../../vendor/replicate/dist/cli.js banana $ARGUMENTS
```

## Behaviour

- Reads every `.txt` file in `input-dir` (sorted alphabetically)
- Uses the file content as the image prompt
- Saves output as `<stem>.<format>` in `output-dir`
- Skips files that already have a matching output (use `--force` to overwrite)

## Options

| Flag | Values | Default |
|------|--------|---------|
| `--aspect-ratio` | `1:1` `4:3` `3:4` `16:9` `9:16` | `4:3` |
| `--resolution` | `1K` `2K` | `2K` |
| `--format` | `jpg` `png` `webp` | `jpg` |
| `--force` | overwrite existing images | off |

## Examples

```bash
/replicate:banana ./prompts/ ./images/
/replicate:banana ./prompts/ ./images/ --aspect-ratio 16:9 --format png
/replicate:banana ./prompts/ ./images/ --resolution 1K --force
```
