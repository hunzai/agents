---
name: content-creator
description: >
  Audio → transcript → localized story → Urdu translation → 4 images
  (2 infographics with Urdu text + 2 anime-style illustrations)
  → 4 videos → Urdu audio. Use when asked to process a recording,
  create content from audio, or generate an illustrated Urdu story.
disable-model-invocation: true
argument-hint: <audio-file-or-dir> <output-dir>
allowed-tools: Bash(*)
context: fork
---

# Content Creator Pipeline

Audio → transcript → clean localized story → Urdu → 4 images → videos → Urdu audio.
Uses elevenlabs plugin CLIs (stt, tts, combine) and replicate plugin CLI (banana, video).

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

### Step 3: Transcribe all audio → combine into one file

Transcribe every audio file in the input directory, then merge all chunks
into a single transcript. Small or silent files produce empty chunks — that
is normal; they are harmlessly included.

```bash
node elevenlabs/vendor/elevenlabs/dist/cli.js stt <audio-input> <output-dir>/transcribe/
node elevenlabs/vendor/elevenlabs/dist/cli.js combine <output-dir>/transcribe/ <output-dir>/transcript.txt
```

### Step 4: Rewrite as a storyteller → story.txt

Read transcript.txt. Rewrite it completely as `<output-dir>/story.txt`.

Think like an exceptional storyteller explaining a complex topic to a curious
friend over chai. The listener has no background in this subject. Every
concept must click on the first hearing — no re-reading possible because
this text will become audio.

Structure for audio narration:
- Start with a one-sentence hook that sparks curiosity.
- Break into short titled sections. One idea per section, fully explained
  before moving on. Use plain text headings (no markdown).
- Keep paragraphs to 2-3 sentences max. Short paragraphs give the voice
  natural breathing room when converted to speech.
- Use an empty line between paragraphs — this creates natural pauses in TTS.
- End each section with a one-line bridge that connects to the next section
  so the audio flows like a conversation, not a list of facts.

Writing rules:
- Remove all fillers (um, uh, you know, like, so, basically).
- Rephrase for maximum clarity and conciseness.
- Use everyday conversational language — short sentences, concrete examples.
- Write numbers as spoken words for TTS clarity: "fifty lakh rupees" not
  "5,000,000 PKR", "nineteen seventy-one" not "1971", "ten percent" not "10%".
- Do not add information that was not in the transcript.
- Plain text only — no markdown, no special characters.

Localization (apply while rewriting, not as a separate pass):
- Dollar amounts → PKR equivalents (written as words)
- pay stub → salary slip
- Social Security → EOBI / provident fund
- Medicare → Sehat Sahulat Card / government health scheme
- federal income tax → income tax, state tax → provincial tax
- Western examples → South Asian (worker in Lahore, shopkeeper in Karachi)
- Keep technical terms in English: income tax, sales tax, GST, EOBI, GDP,
  inflation, IMF, bank, policy, economy, budget, percent, etc.
- Do not lose original meaning — only the framing changes.

### Step 5: Translate story.txt → urdu.txt

Read story.txt. Translate it into `<output-dir>/urdu.txt`.

This file will be sent directly to ElevenLabs TTS (eleven_multilingual_v2)
to generate Urdu audio. Structure and word choice must be optimized for
natural-sounding speech.

Modern spoken Urdu — the kind people actually speak today — is a natural mix
of Urdu and English. Do NOT force-translate English words that everyone
already uses in English, even in everyday Urdu conversation.

Words to keep in English (never translate these):
- Finance: bank, account, loan, interest rate, inflation, deflation, GDP,
  IMF, budget, economy, policy, tax, income tax, sales tax, GST, percent,
  investment, currency, money supply, reserve, credit, debit
- Organizations: State Bank, Federal Reserve, World Bank, IMF, EOBI
- General: government, system, control, balance, data, result, example,
  process, level, rate, increase, decrease, growth, problem, solution

Words to translate into simple Urdu:
- Use تنخواہ for salary/wages, رقم for money/amount, قیمت for price/value
- Use بازار for market, دکاندار for shopkeeper, مزدور for worker/laborer
- Use سمجھیں for understand, سوچیں for think, دیکھیں for see/look
- Use everyday words a rickshaw driver would understand

TTS formatting rules:
- Match the section structure of story.txt exactly.
- Keep paragraphs short (2-3 sentences). Each paragraph becomes one breath
  group in audio.
- Use an empty line between paragraphs for natural TTS pauses.
- Write numbers as Urdu spoken words: "pachaas lakh rupay" not "5,000,000".
- Keep English acronyms as-is (IMF, GDP, GST) — the TTS model pronounces
  them correctly as letter-by-letter.
- Plain text only — no markdown, no special characters, no formatting marks.

### Step 6: Write 4 image prompts

Read urdu.txt and story.txt.

**01, 02 — Infographics with Urdu text:** pick two process-driven ideas
(flows, cause-effect, comparisons, timelines). Include 3-5 short Urdu
labels in double quotes — each label must be 2-4 words max so the model
renders them clearly. Use only common Naskh-script words the model can
reproduce without distortion.
Formula: [Layout] + [Content with quoted Urdu labels] + [Flow indicators] + style block.

Style block (append unchanged to every infographic prompt):
```
clean flat-design infographic illustration, white background, deep teal
and warm saffron color palette, bold geometric shapes with rounded corners,
large clear Naskh Urdu text labels inside colored boxes, right-to-left
reading order, thick directional arrows between boxes, high contrast black
text on light-colored boxes, crisp vector-style artwork, subtle drop
shadows, no photographic textures, no small or decorative text, every text
label must be large bold and legible, consistent visual style
```

Urdu text rules for infographic prompts:
- Each quoted Urdu label must be 2-4 words only (e.g. "قیمت بڑھتی ہے")
- Use simple high-frequency Urdu words the model has seen in training
- Place labels inside colored boxes for maximum contrast and readability
- Never use long sentences as labels — split into multiple short labels

**03, 04 — Anime-style illustrations:** pick two vivid moments from the
story that depict people, places, or emotions related to the topic. These
are narrative scenes — no text overlays.
Formula: [Characters] + [Action] + [Setting] + [Emotion/mood] + style block.

Style block (append unchanged to every anime prompt):
```
anime illustration in Studio Ghibli style, soft watercolor textures, warm
golden hour lighting, South Asian characters with expressive faces, detailed
background environment, warm amber and teal color palette, gentle cel
shading, clean linework, cinematic wide-angle composition, emotional and
atmospheric, no text overlays, no UI elements, consistent visual style
```

Save to `<output-dir>/prompts/01-<slug>.txt` through `04-<slug>.txt`.

### Step 7: Generate images (banana)

```bash
node replicate/vendor/replicate/dist/cli.js banana \
  <output-dir>/prompts/ <output-dir>/images/ \
  --aspect-ratio 16:9 --resolution 1024 --format jpg
```

### Step 8: Generate videos from all images

The video CLI pairs each image with a `.txt` prompt of the same filename stem.
Copy all prompt files into the images directory so every image has its prompt
alongside it, then generate:

```bash
cp <output-dir>/prompts/*.txt <output-dir>/images/
node replicate/vendor/replicate/dist/cli.js video \
  <output-dir>/images/ <output-dir>/videos/ \
  --resolution 480p --frames 81 --fps 16
```

This produces one `.mp4` per image (4 total). The CLI reads `01-slug.jpg` +
`01-slug.txt` from the same directory and sends both to wan-video.

### Step 9: Generate Urdu audio

The TTS CLI reads urdu.txt directly. The eleven_multilingual_v2 model handles
mixed Urdu-English text natively — English terms are pronounced correctly
within Urdu speech.

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
  prompts/01-*.txt     infographic prompt 1
  prompts/02-*.txt     infographic prompt 2
  prompts/03-*.txt     anime illustration prompt 1
  prompts/04-*.txt     anime illustration prompt 2
  images/01-*.jpg      infographic with Urdu text
  images/01-*.txt      prompt copy (for video pairing)
  images/02-*.jpg      infographic with Urdu text
  images/02-*.txt      prompt copy (for video pairing)
  images/03-*.jpg      anime-style illustration
  images/03-*.txt      prompt copy (for video pairing)
  images/04-*.jpg      anime-style illustration
  images/04-*.txt      prompt copy (for video pairing)
  videos/01-*.mp4      infographic video
  videos/02-*.mp4      infographic video
  videos/03-*.mp4      anime illustration video
  videos/04-*.mp4      anime illustration video
```

---

## Errors

| Error | Cause | Fix |
|-------|-------|-----|
| API key missing | Key not in env | Add to `.env` |
| No audio files found | Wrong path | Check argument |
| cli.js not found | CLIs not built | Run Step 2 |
| Replicate failure | Bad prompt or token | Check prompt and token |
