---
name: audio-story
description: >
  Converts audio recordings into a polished Urdu story with educational
  illustrations. Transcribes audio → reformats into clear sections →
  translates to Urdu → generates up to 2 consistent-style images.
  Use when asked to "turn audio into a story", "transcribe and translate
  to Urdu", "make an illustrated story from audio", "audio to Urdu",
  or "create images from a recording".
metadata:
  author: hunzai
  version: 1.0.0
---

# Audio Story

Transcribe audio → edit for clarity → translate to Urdu → generate
illustrated prompts → produce images. Uses the ElevenLabs CLI (this plugin)
and the Replicate CLI (sibling plugin).

## CRITICAL

- Run Step 1 (env check) before anything else. Stop if any key is missing.
- NEVER invent transcription content — use STT output only.
- Generate **exactly 2 image prompts**, no more, no less.
- ALWAYS prepend the style prefix (defined below) to every image prompt.
- Do not translate the image prompts — keep them in English for the model.

---

## Output folder layout

Given `<output-dir>` (default: `content/<topic>/output`):

```
<output-dir>/
  transcribe/        ← per-chunk .txt files from STT
  transcript.txt     ← combined raw transcript
  story.txt          ← reformatted English version
  urdu.txt           ← Urdu translation
  prompts/           ← 2 image prompt .txt files
  images/            ← 2 generated images (.jpg)
```

---

## Consistent image style prefix

Prepend this exact prefix to every image prompt (do not modify it):

```
Flat editorial illustration, warm parchment background, deep teal and
saffron accents, clean modern vector art, no text overlaid, consistent
style across all panels —
```

---

## Workflow

### Step 1: Environment check

```bash
echo "ELEVENLABS: ${ELEVENLABS_API_KEY:-NOT SET}"
echo "REPLICATE:  ${REPLICATE_API_TOKEN:-NOT SET}"
```

If either is `NOT SET`, stop and tell the user which key to add to `.env`.

### Step 2: Build CLIs (idempotent — safe to run every time)

```bash
bash ${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh
bash ${CLAUDE_PLUGIN_ROOT}/../replicate/scripts/setup.sh
```

### Step 3: Transcribe audio → per-chunk .txt files

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/elevenlabs/dist/cli.js stt \
  <audio-dir> \
  <output-dir>/transcribe/
```

- Accepts `.flac`, `.wav`, `.mp3`, `.ogg`, `.opus`, `.m4a`, `.webm`
- Writes one `.txt` per audio file; skips files that already have output

### Step 4: Combine chunks into single transcript

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/elevenlabs/dist/cli.js combine \
  <output-dir>/transcribe/ \
  <output-dir>/transcript.txt
```

Read the combined transcript before proceeding.

### Step 5: Reformat and rephrase (Claude reasoning step)

Read `<output-dir>/transcript.txt` then write `<output-dir>/story.txt` with:

- **Remove filler words** — ums, uhs, repetitions, false starts
- **Fix grammar** — complete sentences, consistent tense
- **Arrange into sections** — short `##` heading per section
- **Rephrase for clarity** — plain language, active voice, short paragraphs

Write the result to `<output-dir>/story.txt`.

### Step 6: Translate to Urdu

Read `<output-dir>/story.txt` then write `<output-dir>/urdu.txt`:

- Translate every heading and paragraph to Urdu script
- Preserve section structure (`##` headings in Urdu)
- Use clear, everyday Pakistani Urdu — avoid archaic or literary Urdu
- Keep proper nouns (names, places) in their original form

Write the result to `<output-dir>/urdu.txt`.

### Step 7: Write 2 image prompts

Read `<output-dir>/story.txt`, identify the **two most visually representable
ideas**. For each:

1. Write a one-sentence visual scene description
2. Prepend the style prefix (see above)
3. Write to `<output-dir>/prompts/01-<slug>.txt` and `02-<slug>.txt`

Example prompt file content:
```
Flat editorial illustration, warm parchment background, deep teal and
saffron accents, clean modern vector art, no text overlaid, consistent
style across all panels — a farmer standing in a wheat field handing
grain sacks to a tax collector while roads and schools appear in the
background as glowing icons, showing the flow of money to public services.
```

### Step 8: Generate images

```bash
node ${CLAUDE_PLUGIN_ROOT}/../replicate/vendor/replicate/dist/cli.js banana \
  <output-dir>/prompts/ \
  <output-dir>/images/ \
  --aspect-ratio 16:9 \
  --resolution 2K \
  --format jpg
```

---

## Report when done

```
✓ Transcript:  <output-dir>/transcript.txt
✓ Story:       <output-dir>/story.txt  ([N] sections)
✓ Urdu:        <output-dir>/urdu.txt
✓ Prompts:     <output-dir>/prompts/01-*.txt
               <output-dir>/prompts/02-*.txt
✓ Images:      <output-dir>/images/01-*.jpg
               <output-dir>/images/02-*.jpg
```

---

## Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ELEVENLABS_API_KEY` missing | Key not in env | Add to `.env`, reload shell |
| `REPLICATE_API_TOKEN` missing | Key not in env | Add to `.env`, reload shell |
| `No audio files found` | Wrong audio dir | Check path, verify audio files exist |
| `success: false` (Replicate) | API or prompt error | Check prompt file, verify token |

---

## Example

User: "turn the recordings in `tools/recording/economics/` into a story"

```bash
node ${CLAUDE_PLUGIN_ROOT}/vendor/elevenlabs/dist/cli.js stt \
  tools/recording/economics/ \
  content/economics/output/transcribe/

node ${CLAUDE_PLUGIN_ROOT}/vendor/elevenlabs/dist/cli.js combine \
  content/economics/output/transcribe/ \
  content/economics/output/transcript.txt

# Steps 5–7: Claude reads transcript, writes story.txt, urdu.txt, prompts/

node ${CLAUDE_PLUGIN_ROOT}/../replicate/vendor/replicate/dist/cli.js banana \
  content/economics/output/prompts/ \
  content/economics/output/images/ \
  --aspect-ratio 16:9 --resolution 2K --format jpg
```
