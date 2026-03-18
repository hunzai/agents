---
name: workflow/audio-story
description: >
  Full content pipeline: audio → transcript → story → Urdu translation →
  images → videos → narrated audio. Chains modular skills: audio/transcribe,
  text/translate, image/generate, video/generate, audio/narrate. Use when asked to
  process a recording into a complete content package.
metadata:
  tier: workflow
  category: workflow
  inputs: "<audio-dir> directory of audio files, <output-dir> for all outputs"
  outputs: "transcript.txt, story.txt, urdu.txt, images/, videos/, urdu-audio/"
  uses: [elevenlabs, replicate]
  cost-estimate: "~$0.50-1.00 (transcription + images + video + TTS)"
  disable-model-invocation: true
  argument-hint: <audio-dir> <output-dir>
  allowed-tools: Bash(*)
  context: fork
---

# Content Creator Pipeline

Chains modular skills to produce a full content package from audio input.

```
audio → audio/transcribe → story.txt → text/translate → urdu.txt
                                      → image/generate → video/generate
                                      → audio/narrate (Urdu audio)
```

## Steps

### Step 1: Environment check

```bash
echo "ELEVENLABS: ${ELEVENLABS_API_KEY:-NOT SET}"
echo "REPLICATE:  ${REPLICATE_API_TOKEN:-NOT SET}"
```

If either is NOT SET, stop.

### Step 2: Parse arguments

- AUDIO_DIR = $ARGUMENTS[0] (required)
- OUTPUT = $ARGUMENTS[1] (required)

### Step 3: Transcribe audio → text

Use **audio/transcribe**:

```bash
bash elevenlabs/scripts/setup.sh
node elevenlabs/vendor/elevenlabs/dist/cli.js stt <AUDIO_DIR> <OUTPUT>/transcribe/
node elevenlabs/vendor/elevenlabs/dist/cli.js combine <OUTPUT>/transcribe/ <OUTPUT>/transcript.txt
```

### Step 4: Rewrite as story → story.txt

Read transcript.txt. Rewrite as `<OUTPUT>/story.txt`:

- Think like a storyteller explaining to a curious friend over chai
- Hook → short titled sections → bridges between sections
- Short paragraphs (2-3 sentences) for TTS breathing room
- Remove fillers, rephrase for clarity, conversational language
- Numbers as spoken words ("fifty lakh rupees" not "5,000,000")
- Localize: Dollar → PKR, Social Security → EOBI, Medicare → Sehat Card
- Keep English technical terms: tax, GDP, IMF, bank, economy, budget
- Do not add information not in the transcript

### Step 5: Translate → urdu.txt

Use **text/translate** logic:

Read story.txt → translate to Urdu → save as `<OUTPUT>/urdu.txt`.
Keep English terms that are commonly used in spoken Urdu.
Optimize for TTS: short paragraphs, spoken numbers, plain text.

### Step 6: Write image prompts

Read urdu.txt and story.txt. Create 4 prompt files in `<OUTPUT>/prompts/`:

- `01-<slug>.txt`, `02-<slug>.txt` — Infographics with Urdu text labels
- `03-<slug>.txt`, `04-<slug>.txt` — Anime-style illustrations (no text)

### Step 7: Generate images

Use **image/generate**:

```bash
bash replicate/scripts/setup.sh
node replicate/vendor/replicate/dist/cli.js seedream \
  <OUTPUT>/prompts/ <OUTPUT>/images/ --aspect-ratio 16:9 --format jpg
```

### Step 8: Generate videos

Use **video/generate**:

```bash
cp <OUTPUT>/prompts/*.txt <OUTPUT>/images/
node replicate/vendor/replicate/dist/cli.js video \
  <OUTPUT>/images/ <OUTPUT>/videos/ --resolution 480p --frames 81 --fps 16
```

### Step 9: Narrate in Urdu

Use **audio/narrate**:

```bash
node elevenlabs/vendor/elevenlabs/dist/cli.js tts \
  <OUTPUT>/urdu.txt <OUTPUT>/urdu-audio/ \
  --model eleven_multilingual_v2 --voice Vwq3FUaRDrPephO3Qaxs --format mp3_44100_128
```

### Step 10: Report

List every output file path with status.

## Output layout

```
<OUTPUT>/
  transcribe/     per-chunk .txt files
  transcript.txt  combined raw transcript
  story.txt       clean localized English
  urdu.txt        Urdu translation
  prompts/        4 image prompt files
  images/         4 images + prompt copies
  videos/         4 .mp4 videos
  urdu-audio/     Urdu narration audio
```
