# Agents

A collection of Claude Code plugins. Each subdirectory is a self-contained
plugin that can be installed independently.

## Available Agents

| Agent | Description |
|-------|-------------|
| [trader](./trader/) | Solana trading agent — Jupiter Perpetuals + Spot Swap |
| [voice](./voice/) | Text-to-speech — speak any text using ElevenLabs voice AI |

## Installation

Add this repo as a marketplace once, then install any agent by name:

```bash
# In a Claude Code session
/plugin marketplace add github.com/hunzai/agents
/plugin install trader@hunzai-agents
/plugin install voice@hunzai-agents
```

---

## trader

Solana trading agent powered by [Jupiter](https://jup.ag) Perpetuals and Spot Swap.

**Requires:** `WALLET_PATH`, `RPC_URL` in `.env`

```bash
/plugin install trader@hunzai-agents
```

Invoked automatically when you ask about opening/closing positions, swapping
tokens, checking balances, or monitoring PnL.

---

## voice

Text-to-speech powered by [ElevenLabs](https://elevenlabs.io). Converts text
to audio and plays it immediately using `mpv` or `ffmpeg`.

**Requires:** `ELEVENLABS_API_KEY` in `.env`

```bash
/plugin install voice@hunzai-agents
```

### Usage

**As a slash command:**

```
/voice:speak Hello, world!
/voice:speak Hello, world! --voice EXAVITQu4vr4xnSDxMaL
/voice:speak Hello, world! --model eleven_multilingual_v2
```

**As an agent** — just ask naturally:

> "Say hello in a calm female voice"
> "Read this paragraph aloud"
> "Use the Brian voice to narrate this"

### CLI reference

The plugin ships with a TypeScript CLI at `vendor/tts/`:

```bash
# Speak text (generates + plays automatically)
node vendor/tts/dist/cli.js speak "Hello world"
node vendor/tts/dist/cli.js speak "Hello world" --voice nPczCjzI2devNBz1zQrb --model eleven_turbo_v2_5
node vendor/tts/dist/cli.js speak "Hello world" --output /tmp/out.mp3 --no-play

# List voices and models
node vendor/tts/dist/cli.js voices
node vendor/tts/dist/cli.js models
```

### Voices

| Name | ID | Style |
|------|----|-------|
| George *(default)* | `JBFqnCBsd6RMkjVDRZzb` | Male, narrative |
| Brian | `nPczCjzI2devNBz1zQrb` | Male, deep |
| Chris | `iP95p4xoKVk53GoZ742B` | Male, casual |
| Liam | `TX3LPaxmHKxFdv7VOQHJ` | Male, energetic |
| Sarah | `EXAVITQu4vr4xnSDxMaL` | Female, soft |
| Charlotte | `XB0fDUnXU5powFXDhCwa` | Female, warm |
| Jessica | `cgSgspJ2msm6clMCkdW9` | Female, expressive |
| Lily | `pFZP5JQG7iQjIQuC4Bku` | Female, calm |

### Models

| Model | Latency | Languages |
|-------|---------|-----------|
| `eleven_flash_v2_5` *(default)* | ~75ms | 32 |
| `eleven_turbo_v2_5` | Balanced | 32 |
| `eleven_multilingual_v2` | Highest quality | 29 |

---

## Adding a New Agent

1. Create a subdirectory: `mkdir my-agent`
2. Add `.claude-plugin/plugin.json` with `{ "name": "my-agent", ... }`
3. Add `agents/`, `skills/`, `hooks/`, and `vendor/` as needed
4. Push — it's immediately installable via `/plugin install my-agent@hunzai-agents`
