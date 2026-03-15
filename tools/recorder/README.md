# Recording

Standalone mic recorder for Ubuntu/Linux.

- Detects mic plug events instantly via `udevadm` (no polling).
- Starts recording immediately if a mic is already attached at launch.
- Splits output into time-based chunk files automatically via `ffmpeg -f segment`.
- No Python — pure bash.

**Default format:** FLAC — lossless quality, ~50% smaller than WAV, compatible with ElevenLabs and all audio tools.

**Requires:** `ffmpeg`, `wpctl` (wireplumber), `udevadm` (systemd, pre-installed).

## Quick Start

```bash
cd recording
./install.sh --with-system-deps   # installs ffmpeg + wireplumber if missing
./run.sh
```

## Formats

| Format | Quality | File size | ElevenLabs | Use when |
|--------|---------|-----------|------------|----------|
| `flac` *(default)* | Lossless | Small | ✅ Best | Processing, archiving |
| `wav`  | Lossless | Largest | ✅ | Max compatibility |
| `mp3`  | Lossy | Medium | ✅ | Sharing, broad support |
| `opus` | Lossy | Smallest | ✅ | Low-bandwidth streaming |

## Options

```bash
./run.sh --help                          # full usage

./run.sh                                 # flac, 5-min chunks (default)
./run.sh --chunk 60                      # 1-min chunks
./run.sh --format wav                    # raw lossless
./run.sh --format mp3 --quality 0        # best MP3 quality (VBR)
./run.sh --format mp3 --quality 5        # smaller MP3
./run.sh --format opus --quality 128k    # high-quality voice
./run.sh --format flac --quality 0       # flac, fastest encoding
./run.sh --out-dir /tmp/mics --chunk 120
```

## Quality parameter

| Format | `--quality` | Range | Default |
|--------|-------------|-------|---------|
| `flac` | compression level | `0` (fast) – `12` (smallest) | `8` |
| `wav`  | — | n/a | — |
| `mp3`  | VBR quality | `0` (best) – `9` (smallest) | `2` |
| `opus` | bitrate | `32k` – `192k` | `96k` |

## Output

Files are named by start time:

```
recordings/chunk-20260314-183000.flac
recordings/chunk-20260314-183500.flac
```

Play with: `ffplay recordings/chunk-20260314-183000.flac`
