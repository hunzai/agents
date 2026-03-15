---
name: content-creator
description: >
  Audio → transcript → localized story → Urdu translation → 4 images
  (2 documentary photos + 2 infographic illustrations with Urdu text)
  → Urdu audio. Use when asked to process a recording, create content
  from audio, or generate an illustrated Urdu story.
disable-model-invocation: true
argument-hint: <audio-file-or-dir> <output-dir>
allowed-tools: Bash(*)
context: fork
---

# Content Creator Pipeline

Audio → transcript → clean localized story → Urdu → 4 images → videos → Urdu audio.
Uses elevenlabs plugin CLIs (stt, tts, combine) and replicate plugin CLI (seedream, video).

## Safety

- Never invent content — use only what STT returns.
- Stop if ELEVENLABS_API_KEY or REPLICATE_API_TOKEN is missing.

---

## Steps

### Step 1: Environment check

```bash
echo "ELEVENLABS: ${ELEVENLABS_API_KEY:-NOT SET}"
echo "REPLICATE:  ${REPLICATE_API_TOKEN:-NOT SET}"
```

### Step 2: Build CLIs (idempotent)

```bash
bash elevenlabs/scripts/setup.sh
bash replicate/scripts/setup.sh
```

### Step 3: Transcribe → combine

```bash
node elevenlabs/vendor/elevenlabs/dist/cli.js stt <audio-input> <output-dir>/transcribe/
node elevenlabs/vendor/elevenlabs/dist/cli.js combine <output-dir>/transcribe/ <output-dir>/transcript.txt
```

### Step 4: Clean, localize → story.txt

Read transcript.txt, write `<output-dir>/story.txt`.

Cleaning: remove fillers, fix grammar, split into titled sections, plain text
only (no markdown, no special characters).

Localization (apply during cleaning, not as separate pass):
- Dollar amounts → PKR equivalents
- pay stub → salary slip
- Social Security → EOBI / provident fund
- Medicare → Sehat Sahulat Card / government health scheme
- federal income tax → income tax, state tax → provincial tax
- Western examples → South Asian (worker in Lahore, shopkeeper in Karachi)
- Keep technical terms in English: income tax, sales tax, GST, EOBI, GDP, inflation, etc.
- Do not lose original meaning — only the framing changes.

### Step 5: Translate → urdu.txt

Read story.txt, write `<output-dir>/urdu.txt`.

- Simple everyday Urdu — conversational, not literary or archaic.
- Use تنخواہ not مشاہرہ, رقم not روپیہ پیسہ, کام not شغل, آسان not سہل.
- Keep ALL technical English terms in English.
- Keep numbers, currency, city names, proper nouns unchanged.
- Plain text only — no special characters or formatting marks.
- Match section structure of story.txt.

### Step 6: Write 4 image prompts

Read urdu.txt and story.txt.

**01, 02 — Documentary photos:** pick two vivid real-world moments.
Formula: [Subject] + [Action] + [Location] + [Composition] + style block.

Style block (append unchanged to every documentary prompt):
```
documentary-style editorial photograph, golden hour natural light, shot on
Fujifilm GFX medium format camera with 45mm lens at f/2.8, warm amber and
terracotta color grading, deep teal and saffron accent tones, deep shadow
detail, cinematic film grain, rich fabric and surface textures,
photorealistic, no overlaid text, consistent visual style across all four images
```

**03, 04 — Infographic illustrations with Urdu text:** pick two process-driven
ideas (flows, cause-effect). Include 3-5 short Urdu labels in double quotes.
Formula: [Layout] + [Content with quoted Urdu] + [Flow indicators] + style block.

Style block (append unchanged to every infographic prompt):
```
clean flat-design infographic illustration, off-white background, deep teal
and warm saffron color palette, bold geometric shapes, clear Naskh Urdu
font for all text labels, right-to-left text layout, crisp vector-style
artwork, subtle drop shadows on boxes, no photographic textures,
consistent visual style across all four images
```

Save to `<output-dir>/prompts/01-<slug>.txt` through `04-<slug>.txt`.

### Step 7: Generate images (seedream)

```bash
node replicate/vendor/replicate/dist/cli.js seedream \
  <output-dir>/prompts/ <output-dir>/images/ \
  --aspect-ratio 16:9 --size 2K --format jpg
```

### Step 8: Generate videos from documentary photos (optional)

Copy the prompt files for the 2 documentary photos into the images directory
so the video CLI can pair them, then generate:

```bash
cp <output-dir>/prompts/01-*.txt <output-dir>/prompts/02-*.txt <output-dir>/images/
node replicate/vendor/replicate/dist/cli.js video \
  <output-dir>/images/ <output-dir>/videos/ \
  --resolution 480p --frames 81 --fps 16
```

Only the documentary photos (01, 02) get videos — infographics (03, 04) are
static by nature. The video CLI skips images without a matching .txt prompt.

### Step 9: Generate Urdu audio

```bash
node elevenlabs/vendor/elevenlabs/dist/cli.js tts \
  <output-dir>/urdu.txt <output-dir>/urdu-audio/ \
  --model eleven_multilingual_v2 --voice Vwq3FUaRDrPephO3Qaxs --format mp3_44100_128
```

### Step 10: Report

List every output file path with status.

---

## Output layout

```
<output-dir>/
  transcribe/          per-chunk .txt files
  transcript.txt       combined raw transcript
  story.txt            clean localized English
  urdu.txt             Urdu translation (plain text)
  urdu-audio/          Urdu TTS audio
  prompts/01-*.txt     documentary photo prompt 1
  prompts/02-*.txt     documentary photo prompt 2
  prompts/03-*.txt     infographic prompt 1
  prompts/04-*.txt     infographic prompt 2
  images/01-*.jpg      documentary photo 1
  images/02-*.jpg      documentary photo 2
  images/03-*.jpg      infographic 1
  images/04-*.jpg      infographic 2
  videos/01-*.mp4      documentary video 1 (optional)
  videos/02-*.mp4      documentary video 2 (optional)
```

---

## Errors

| Error | Cause | Fix |
|-------|-------|-----|
| API key missing | Key not in env | Add to `.env` |
| No audio files found | Wrong path | Check argument |
| cli.js not found | CLIs not built | Run Step 2 |
| Replicate failure | Bad prompt or token | Check prompt and token |
